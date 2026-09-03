// scripts/enrich-tier-adjust.cjs — 클래스 문맥 티어 조정표 이식 (Node v14, CJS)
//
// research/data/class-tier-adjust.json (A2 전수조사 산출물, 2026-09-03)
//   → docs/data/tier-adjust.json (런타임 데이터)
//
// 계약(class-tier 전수조사): 산출물은 기계 이식만 허용 — 이 스크립트 밖에서
// docs/data/tier-adjust.json 을 수작업 편집하지 말 것. 규칙 수정은 research 원본을
// 고치고 이 스크립트를 재실행한다.
//
// 런타임에 필요한 필드만 옮긴다:
//   rules[]      — id / ifAugmentTags / unlessAugmentTags / forDmg / forClasses / adjust / reason
//                  (+ 선택: unlessDmg / unlessChampionTags — 챔피언 측 제외 가드,
//                   2026-09-03 V2 클래스 스위프 확장: AP 탱커·Mage 하이브리드 예외)
//   perAugment[] — apiName / overrides / reason
// evidenceDetail·poolGateCandidates(풀 게이트 후보)는 조사 문서 전용이라 싣지 않는다
// (풀 게이트 반영은 별도 구현 판단 — research 원본 caveats 참조).
//
// 실행: node scripts/enrich-tier-adjust.cjs

'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const srcPath = path.join(root, 'research', 'data', 'class-tier-adjust.json');
const outPath = path.join(root, 'docs', 'data', 'tier-adjust.json');
const augPath = path.join(root, 'docs', 'data', 'augments.json');

const src = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
const augments = JSON.parse(fs.readFileSync(augPath, 'utf8')).augments;

const TIERS = ['S', 'A', 'B', 'C', 'D'];
const ARCHETYPES = ['apMage', 'adMarksman', 'tank', 'adAssassin', 'support', 'fighter'];
const DMG = ['ad', 'ap', 'mixed'];
// champions.json tags 어휘 (unlessChampionTags 검증용 — DDragon 태그 6종)
const CHAMP_TAGS = ['Fighter', 'Tank', 'Mage', 'Assassin', 'Marksman', 'Support'];
const ADJUST_RE = /^(cap:[SABCD]|down:\d+|up:\d+)$/;

const augNames = new Set(augments.map((a) => a.apiName));
const tagVocab = new Set();
for (const a of augments) for (const t of a.tags || []) tagVocab.add(t);

const issues = [];
const fail = (s) => issues.push(s);

// ---- rules 이식 + 검증
const rules = [];
const ruleIds = new Set();
for (const r of src.rules || []) {
  if (!r || typeof r.id !== 'string') { fail('rule: id 누락'); continue; }
  if (ruleIds.has(r.id)) fail(`rule ${r.id}: id 중복`);
  ruleIds.add(r.id);
  for (const k of ['ifAugmentTags', 'unlessAugmentTags']) {
    for (const t of r[k] || []) {
      if (!tagVocab.has(t)) fail(`rule ${r.id}: ${k} 태그 "${t}"가 augments.json 태그 어휘에 없음`);
    }
  }
  if (!Array.isArray(r.ifAugmentTags) || !r.ifAugmentTags.length) fail(`rule ${r.id}: ifAugmentTags 비어 있음`);
  if (r.forDmg !== null && r.forDmg !== undefined && DMG.indexOf(r.forDmg) === -1) {
    fail(`rule ${r.id}: forDmg 어휘 위반 "${r.forDmg}"`);
  }
  for (const c of r.forClasses || []) {
    if (ARCHETYPES.indexOf(c) === -1) fail(`rule ${r.id}: forClasses 아키타입 어휘 위반 "${c}"`);
  }
  if (!ADJUST_RE.test(r.adjust || '')) fail(`rule ${r.id}: adjust 문법 위반 "${r.adjust}"`);
  // 챔피언 측 제외 가드 (선택 필드 — 2026-09-03 V2 클래스 스위프 확장)
  if (r.unlessDmg !== null && r.unlessDmg !== undefined && DMG.indexOf(r.unlessDmg) === -1) {
    fail(`rule ${r.id}: unlessDmg 어휘 위반 "${r.unlessDmg}"`);
  }
  for (const t of r.unlessChampionTags || []) {
    if (CHAMP_TAGS.indexOf(t) === -1) fail(`rule ${r.id}: unlessChampionTags 어휘 위반 "${t}"`);
  }
  const out = {
    id: r.id,
    ifAugmentTags: (r.ifAugmentTags || []).slice(),
    unlessAugmentTags: (r.unlessAugmentTags || []).slice(),
    forDmg: r.forDmg === undefined ? null : r.forDmg,
    forClasses: (r.forClasses || []).slice(),
    adjust: r.adjust,
    reason: typeof r.reason === 'string' ? r.reason : '',
  };
  if (typeof r.unlessDmg === 'string') out.unlessDmg = r.unlessDmg;
  if (Array.isArray(r.unlessChampionTags) && r.unlessChampionTags.length) {
    out.unlessChampionTags = r.unlessChampionTags.slice();
  }
  rules.push(out);
}

// ---- perAugment 이식 + 검증
const perAugment = [];
const paNames = new Set();
for (const p of src.perAugment || []) {
  if (!p || typeof p.apiName !== 'string') { fail('perAugment: apiName 누락'); continue; }
  if (!augNames.has(p.apiName)) fail(`perAugment ${p.apiName}: augments.json에 없는 apiName`);
  if (paNames.has(p.apiName)) fail(`perAugment ${p.apiName}: 중복 항목`);
  paNames.add(p.apiName);
  const overrides = {};
  for (const [arch, tier] of Object.entries(p.overrides || {})) {
    if (ARCHETYPES.indexOf(arch) === -1) fail(`perAugment ${p.apiName}: overrides 아키타입 어휘 위반 "${arch}"`);
    if (TIERS.indexOf(tier) === -1) fail(`perAugment ${p.apiName}: overrides 티어 어휘 위반 "${tier}"`);
    overrides[arch] = tier;
  }
  if (!Object.keys(overrides).length) fail(`perAugment ${p.apiName}: overrides 비어 있음`);
  perAugment.push({ apiName: p.apiName, overrides, reason: typeof p.reason === 'string' ? p.reason : '' });
}

// ---- 산출물 규모가 원본 _meta.counts와 일치하는지 (이식 누락 방지)
const counts = (src._meta && src._meta.counts) || {};
if (typeof counts.rules === 'number' && counts.rules !== rules.length) {
  fail(`counts 불일치: 원본 rules ${counts.rules} vs 이식 ${rules.length}`);
}
if (typeof counts.perAugment === 'number' && counts.perAugment !== perAugment.length) {
  fail(`counts 불일치: 원본 perAugment ${counts.perAugment} vs 이식 ${perAugment.length}`);
}

if (issues.length) {
  console.error('이식 실패 (' + issues.length + '건):');
  for (const s of issues) console.error('  ISSUE: ' + s);
  process.exit(1);
}

const out = {
  _meta: {
    doc: '클래스 문맥 티어 조정표 — recommend.js displayTier(augment, champion, adjust)가 읽는 런타임 데이터',
    generatedBy: 'scripts/enrich-tier-adjust.cjs (수작업 편집 금지 — research/data/class-tier-adjust.json을 고치고 재생성)',
    source: 'research/data/class-tier-adjust.json',
    sourceCollectedAt: src._meta && src._meta.collectedAt,
    sourcePatch: src._meta && src._meta.patch,
    tierScale: TIERS,
    archetypes: ARCHETYPES,
    // 아키타입 유도 의사코드(원본 _meta.archetypeDerivation.doc 그대로) — displayTier 구현 기준
    archetypeDerivation: src._meta && src._meta.archetypeDerivation && src._meta.archetypeDerivation.doc,
    // 적용 의미론(원본 _meta.ruleSemantics 그대로) — displayTier 구현 기준
    ruleSemantics: src._meta && src._meta.ruleSemantics,
  },
  rules,
  perAugment,
};

fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
console.log(`이식 완료: rules ${rules.length} / perAugment ${perAugment.length} → ${path.relative(root, outPath)}`);
