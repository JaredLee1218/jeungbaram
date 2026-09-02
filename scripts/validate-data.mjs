// D2 데이터 무결성 검사 스크립트 (Node v14)
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'docs', 'data');
const load = (f) => JSON.parse(readFileSync(join(dataDir, f), 'utf8'));

const augData = load('augments.json');
const champData = load('champions.json');
const itemData = load('items.json');
const synData = load('synergies.json');

const augments = augData.augments;
const champions = champData.champions;
const items = itemData.items;
const combos = synData.combos;

const issues = [];
const log = (s) => console.log(s);

// ===== 1. augments.json =====
log('=== augments.json ===');
log('count: ' + augments.length);

const validTiers = new Set(['silver', 'gold', 'prismatic']);
const badTiers = augments.filter(a => !validTiers.has(a.tier));
log('tier invalid: ' + JSON.stringify(badTiers.map(a => [a.apiName, a.tier])));

const noNameKo = augments.filter(a => !a.nameKo || !String(a.nameKo).trim());
log('nameKo missing: ' + JSON.stringify(noNameKo.map(a => a.apiName)));

const iconPatterns = {};
for (const a of augments) {
  const m = String(a.icon || '').match(/^(https:\/\/[^/]+\/[a-z]+\/game\/assets\/ux\/(kiwi|cherry)\/augments\/icons\/)[a-z0-9_']+\.png$/i);
  const k = m ? m[1] : (a.icon || '(none)');
  iconPatterns[k] = (iconPatterns[k] || 0) + 1;
}
log('icon URL patterns: ' + JSON.stringify(iconPatterns, null, 1));
const nonConforming = augments.filter(a => !/^https:\/\/raw\.communitydragon\.org\/latest\/game\/assets\/ux\/(kiwi|cherry)\/augments\/icons\/[a-z0-9_']+_large\.png$/i.test(a.icon || ''));
log('icon nonconforming: ' + JSON.stringify(nonConforming.map(a => [a.apiName, a.icon])));

const disabled = augments.filter(a => a.enabled === false);
log('enabled=false count: ' + disabled.length);
log('disabled list: ' + JSON.stringify(disabled.map(a => a.apiName)));

const dupApi = {};
for (const a of augments) dupApi[a.apiName] = (dupApi[a.apiName] || 0) + 1;
const dups = Object.entries(dupApi).filter(([, n]) => n > 1);
log('apiName duplicates: ' + JSON.stringify(dups));

// ===== 2. champions.json =====
log('\n=== champions.json ===');
log('count: ' + champions.length);
const keyCount = {};
const idCount = {};
for (const c of champions) {
  keyCount[c.key] = (keyCount[c.key] || 0) + 1;
  idCount[c.id] = (idCount[c.id] || 0) + 1;
}
log('key duplicates: ' + JSON.stringify(Object.entries(keyCount).filter(([, n]) => n > 1)));
log('id duplicates: ' + JSON.stringify(Object.entries(idCount).filter(([, n]) => n > 1)));

// 표본 10명 상식 검증
const expect = {
  Garen:   { usesMana: false, ranged: false },
  Ashe:    { usesMana: true,  ranged: true },
  Yasuo:   { usesMana: false, ranged: false },
  Lux:     { usesMana: true,  ranged: true },
  Zed:     { usesMana: false, ranged: false },
  Caitlyn: { usesMana: true,  ranged: true },
  DrMundo: { usesMana: false, ranged: false },
  Katarina:{ usesMana: false, ranged: false },
  Jinx:    { usesMana: true,  ranged: true },
  Riven:   { usesMana: false, ranged: false },
};
for (const [id, exp] of Object.entries(expect)) {
  const c = champions.find(x => x.id === id);
  if (!c) { log('SAMPLE MISSING: ' + id); continue; }
  const ok = c.usesMana === exp.usesMana && c.ranged === exp.ranged;
  log(`sample ${id}: usesMana=${c.usesMana}(exp ${exp.usesMana}) ranged=${c.ranged}(exp ${exp.ranged}) ${ok ? 'OK' : 'MISMATCH'}`);
}

// ===== 3. items.json =====
log('\n=== items.json ===');
log('count: ' + items.length);
const itemIdCount = {};
for (const it of items) itemIdCount[it.id] = (itemIdCount[it.id] || 0) + 1;
log('id duplicates: ' + JSON.stringify(Object.entries(itemIdCount).filter(([, n]) => n > 1)));

// ===== 4. synergies.json 전수 대조 =====
log('\n=== synergies.json ===');
log('combos count: ' + combos.length);
const augSet = new Set(augments.map(a => a.apiName));
const champSet = new Set(champions.map(c => c.id));
const itemSet = new Set(items.map(i => i.id));

const badRefs = [];
combos.forEach((cb, i) => {
  for (const ag of (cb.augments || [])) if (!augSet.has(ag)) badRefs.push([i, cb.title, 'augment', ag]);
  for (const ch of (cb.champions || [])) if (!champSet.has(ch)) badRefs.push([i, cb.title, 'champion', ch]);
  for (const it of (cb.items || [])) if (!itemSet.has(it)) badRefs.push([i, cb.title, 'item', it]);
});
log('bad refs (' + badRefs.length + '):');
for (const r of badRefs) log('  combo#' + r[0] + ' "' + r[1] + '" ' + r[2] + ': ' + r[3]);

// 비활성 증강 참조 여부(정보성)
const disabledSet = new Set(disabled.map(a => a.apiName));
const disabledRefs = [];
combos.forEach((cb, i) => {
  for (const ag of (cb.augments || [])) if (disabledSet.has(ag)) disabledRefs.push([i, cb.title, ag]);
});
log('combos referencing disabled augments (' + disabledRefs.length + '): ' + JSON.stringify(disabledRefs));

// ===== 5. 신규 스키마 필드 검증 (2차 스터디 반영분 — 위반 시 exit 1) =====
// 어휘·구조 근거: research/AUGMENT-POOLS-STUDY.md §3, research/data/eligibility-notes.json
log('\n=== 신규 스키마 필드 (category / restrictions / props) ===');

const CATEGORY_VOCAB = new Set(['ability', 'quest', 'normal']);
const CLASS_VOCAB = new Set(['Fighter', 'Tank', 'Mage', 'Assassin', 'Marksman', 'Support']); // DDragon tags 어휘
const PROP_VOCAB = new Set([ // 계약 어휘 (스킬 속성 14종)
  'projectile', 'dash', 'knockback', 'targeted', 'aoe', 'shield', 'heal', 'stealth',
  'global', 'spin', 'immobilize', 'terrain', 'empoweredAttack', 'durationEffect',
]);
const SKILL_KEYS = new Set(['Q', 'W', 'E', 'R']);
const RESTRICTION_KEYS = new Set([
  'rangedOnly', 'meleeOnly', 'requiresMana', 'abilityProps', 'abilityPropsAll',
  'classRequired', 'classExcluded', 'championWhitelist', 'championExclude',
  'spellExclude', 'slot', 'note',
]);

const champIdSet = new Set(champions.map(c => c.id));

// 5-1. augments: category 전수 + 어휘
for (const a of augments) {
  if (!CATEGORY_VOCAB.has(a.category)) {
    issues.push(`augment ${a.apiName}: category 어휘 위반 (${JSON.stringify(a.category)})`);
  }
}
const catDist = {};
for (const a of augments) catDist[a.category] = (catDist[a.category] || 0) + 1;
log('category 분포: ' + JSON.stringify(catDist));

// 5-2. augments: restrictions 키/값 어휘 + 참조 무결성
for (const a of augments) {
  const r = a.restrictions;
  if (r === undefined) continue;
  if (typeof r !== 'object' || r === null || Array.isArray(r)) {
    issues.push(`augment ${a.apiName}: restrictions가 객체가 아님`);
    continue;
  }
  for (const k of Object.keys(r)) {
    if (!RESTRICTION_KEYS.has(k)) issues.push(`augment ${a.apiName}: 미지의 restrictions 키 "${k}"`);
  }
  for (const k of ['abilityProps', 'abilityPropsAll']) {
    for (const p of (r[k] || [])) {
      if (!PROP_VOCAB.has(p)) issues.push(`augment ${a.apiName}: restrictions.${k} 속성 어휘 위반 "${p}"`);
    }
  }
  for (const k of ['classRequired', 'classExcluded']) {
    for (const t of (r[k] || [])) {
      if (!CLASS_VOCAB.has(t)) issues.push(`augment ${a.apiName}: restrictions.${k} 클래스 어휘 위반 "${t}"`);
    }
  }
  for (const k of ['championWhitelist', 'championExclude']) {
    for (const id of (r[k] || [])) {
      if (!champIdSet.has(id)) issues.push(`augment ${a.apiName}: restrictions.${k} 챔피언 id 미실존 "${id}"`);
    }
  }
  if (r.spellExclude !== undefined) {
    if (typeof r.spellExclude !== 'object' || r.spellExclude === null || Array.isArray(r.spellExclude)) {
      issues.push(`augment ${a.apiName}: spellExclude는 {챔피언id: [스킬키]} 객체여야 함`);
    } else {
      for (const [id, keys] of Object.entries(r.spellExclude)) {
        if (!champIdSet.has(id)) issues.push(`augment ${a.apiName}: spellExclude 챔피언 id 미실존 "${id}"`);
        if (!Array.isArray(keys)) { issues.push(`augment ${a.apiName}: spellExclude["${id}"]가 배열이 아님`); continue; }
        for (const k of keys) if (!SKILL_KEYS.has(k)) issues.push(`augment ${a.apiName}: spellExclude["${id}"] 스킬 키 위반 "${k}"`);
      }
    }
  }
  if (r.slot !== undefined && !SKILL_KEYS.has(r.slot)) {
    issues.push(`augment ${a.apiName}: restrictions.slot 스킬 키 위반 "${r.slot}"`);
  }
}

// 5-3. augments: favoredClasses/disfavoredClasses (가중치용) 클래스 어휘
for (const a of augments) {
  for (const k of ['favoredClasses', 'disfavoredClasses']) {
    if (a[k] === undefined) continue;
    if (!Array.isArray(a[k])) { issues.push(`augment ${a.apiName}: ${k}가 배열이 아님`); continue; }
    for (const t of a[k]) {
      if (!CLASS_VOCAB.has(t)) issues.push(`augment ${a.apiName}: ${k} 클래스 어휘 위반 "${t}"`);
    }
  }
}

// 5-4. champions: spells[].props 어휘 + abilityProps = 전 스킬 props 합집합 (계약: 하위 호환 재계산)
for (const c of champions) {
  const spells = Array.isArray(c.spells) ? c.spells : [];
  const union = new Set();
  let hasSpellProps = false;
  for (const s of spells) {
    if (!SKILL_KEYS.has(s.key)) issues.push(`champion ${c.id}: 스킬 키 위반 "${s.key}"`);
    if (!Array.isArray(s.props)) continue; // 구스키마 허용 (draft.js 폴백 대상)
    hasSpellProps = true;
    for (const p of s.props) {
      if (!PROP_VOCAB.has(p)) issues.push(`champion ${c.id} ${s.key}: props 어휘 위반 "${p}"`);
      union.add(p);
    }
  }
  if (hasSpellProps) {
    const declared = new Set(c.abilityProps || []);
    const a = [...union].sort().join(',');
    const b = [...declared].sort().join(',');
    if (a !== b) issues.push(`champion ${c.id}: abilityProps(${b})가 spells props 합집합(${a})과 불일치`);
  }
}

// 5-4b. champions: dmg 어휘 (ad/ap/mixed) — 173명 전원 필수 (class-fit 계약)
// 근사: dmg는 DDragon info.attack/magic 격차 3 기준 산출(생성: scripts/enrich-champions.cjs)
{
  const DMG_VOCAB = new Set(['ad', 'ap', 'mixed']);
  const dmgDist = {};
  for (const c of champions) {
    if (!DMG_VOCAB.has(c.dmg)) {
      issues.push(`champion ${c.id}: dmg 어휘 위반 (${JSON.stringify(c.dmg)}) — ad/ap/mixed 중 하나여야 함`);
      continue;
    }
    dmgDist[c.dmg] = (dmgDist[c.dmg] || 0) + 1;
  }
  log('dmg 분포: ' + JSON.stringify(dmgDist));
  // class-fit 계약 표본 7명 고정 검증 (에코는 enrich-champions.cjs DMG_OVERRIDES 근거)
  const DMG_SAMPLES = { Ashe: 'ad', Brand: 'ap', Ekko: 'ap', Galio: 'ap', Jayce: 'ad', Amumu: 'ap', Trundle: 'ad' };
  for (const [id, exp] of Object.entries(DMG_SAMPLES)) {
    const c = champions.find(x => x.id === id);
    if (!c) { issues.push(`champion 표본 ${id}: 항목 누락`); continue; }
    if (c.dmg !== exp) issues.push(`champion 표본 ${id}: dmg=${JSON.stringify(c.dmg)} (계약 기대값 ${exp})`);
  }
}

// 5-5. 게이트 위생: 각 abilityPropsAll 게이트를 충족하는 챔피언이 1명 이상 존재 (dead gate 방지)
for (const a of augments) {
  const req = a.restrictions && a.restrictions.abilityPropsAll;
  if (!Array.isArray(req) || req.length === 0) continue;
  const anyChamp = champions.some(c => (c.spells || []).some(
    s => Array.isArray(s.props) && req.every(p => s.props.includes(p))
  ));
  if (!anyChamp) issues.push(`augment ${a.apiName}: abilityPropsAll ${JSON.stringify(req)} 충족 챔피언 0명 (dead gate)`);
}

// ===== 6. funrank.json 검증 (꿀잼 티어 — 위반 시 exit 1) =====
log('\n=== funrank.json ===');
const funData = load('funrank.json');
const ranks = funData.ranks;
log('ranks count: ' + ranks.length);

const TIER_VOCAB = ['S+', 'S', 'A', 'B', 'C'];
const EVIDENCE_VOCAB = new Set(['stats', 'community', 'both', 'default']);
if (!funData._meta || JSON.stringify(funData._meta.tierVocab) !== JSON.stringify(TIER_VOCAB)) {
  issues.push('funrank _meta.tierVocab이 계약 어휘 ' + JSON.stringify(TIER_VOCAB) + '과 불일치');
}

// 6-1. 173명 전원 존재 + id 참조 무결성 (champions.json 전수 대조)
const rankIds = new Set();
for (const r of ranks) {
  if (!champIdSet.has(r.id)) issues.push(`funrank ${r.id}: champions.json에 없는 id`);
  if (rankIds.has(r.id)) issues.push(`funrank ${r.id}: 중복 항목`);
  rankIds.add(r.id);
}
for (const c of champions) {
  if (!rankIds.has(c.id)) issues.push(`funrank: 챔피언 ${c.id} 항목 누락`);
}

// 6-2. 필드 어휘·형식 + signatureAugments apiName 전수 대조
const tierSet = new Set(TIER_VOCAB);
for (const r of ranks) {
  if (!tierSet.has(r.tier)) issues.push(`funrank ${r.id}: tier 어휘 위반 "${r.tier}"`);
  if (typeof r.funScore !== 'number' || r.funScore < 0 || r.funScore > 100) {
    issues.push(`funrank ${r.id}: funScore 범위 위반 (${r.funScore})`);
  }
  if (typeof r.oneLiner !== 'string' || !r.oneLiner.trim()) issues.push(`funrank ${r.id}: oneLiner 누락`);
  if (!EVIDENCE_VOCAB.has(r.evidence)) issues.push(`funrank ${r.id}: evidence 어휘 위반 "${r.evidence}"`);
  if (!Array.isArray(r.signatureAugments) || r.signatureAugments.length > 3) {
    issues.push(`funrank ${r.id}: signatureAugments는 배열(최대 3개)이어야 함`);
  } else {
    for (const s of r.signatureAugments) {
      if (!augSet.has(s)) issues.push(`funrank ${r.id}: 미실존 증강 apiName "${s}"`);
    }
  }
  // evidence=default인데 구체 조합(signatureAugments)이 있으면 모순
  if (r.evidence === 'default' && Array.isArray(r.signatureAugments) && r.signatureAugments.length > 0) {
    issues.push(`funrank ${r.id}: evidence=default인데 signatureAugments 존재 (모순)`);
  }
}

// 6-3. funScore-tier 정합: 티어 구간 역전(겹침) 없음
{
  const range = {};
  for (const r of ranks) {
    if (!tierSet.has(r.tier) || typeof r.funScore !== 'number') continue;
    if (!range[r.tier]) range[r.tier] = { min: Infinity, max: -Infinity };
    range[r.tier].min = Math.min(range[r.tier].min, r.funScore);
    range[r.tier].max = Math.max(range[r.tier].max, r.funScore);
  }
  for (let i = 0; i < TIER_VOCAB.length - 1; i++) {
    const hi = range[TIER_VOCAB[i]];
    const lo = range[TIER_VOCAB[i + 1]];
    if (hi && lo && lo.max >= hi.min) {
      issues.push(`funrank: 티어 구간 역전 — ${TIER_VOCAB[i + 1]} 최대(${lo.max}) >= ${TIER_VOCAB[i]} 최소(${hi.min})`);
    }
  }
  log('tier ranges: ' + JSON.stringify(range));
}

// 6-4. 티어 분포 위생: 상위 티어(S+·S)가 과반이면 티어 인플레
{
  const dist = {};
  for (const r of ranks) dist[r.tier] = (dist[r.tier] || 0) + 1;
  log('tier 분포: ' + JSON.stringify(dist));
  const top = (dist['S+'] || 0) + (dist['S'] || 0);
  if (top > ranks.length / 2) issues.push(`funrank: S+·S 합계 ${top}명 > 절반 (티어 인플레)`);
  for (const t of TIER_VOCAB) if (!dist[t]) issues.push(`funrank: 티어 ${t} 사용 0건 (분포 붕괴)`);
}

log('신규 스키마 위반: ' + issues.length + '건');
for (const s of issues) log('  ISSUE: ' + s);
if (issues.length > 0) {
  console.error('\n검증 실패 (' + issues.length + '건)');
  process.exit(1);
}
console.log('\n신규 스키마 검증 통과');
