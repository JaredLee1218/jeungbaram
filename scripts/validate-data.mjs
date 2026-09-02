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
