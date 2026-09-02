// scripts/test-e2e.mjs — 통합 스모크 테스트 (C1)
// draft.js + recommend.js + 실제 JSON 데이터로 "에코 4라운드 자동 진행 → 추천 생성"이
// 에러 없이 끝까지 도는지 확인한다. Node v14 (fetch 없음 → fs로 JSON 로드).
// 실행: node scripts/test-e2e.mjs

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import {
  newGame, nextRound, rerollSlot, goldenReroll, pickAugment,
  eligibleAugments, ROUND_LEVELS,
} from '../docs/js/draft.js';
import { recommend } from '../docs/js/recommend.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const loadJson = (rel) => JSON.parse(readFileSync(join(ROOT, 'docs', 'data', rel), 'utf8'));

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { passed++; }
  else { failed++; console.error('FAIL - ' + label); }
}

// ---- 1) 실제 데이터 로드 ----
const augData = loadJson('augments.json');
const champData = loadJson('champions.json');
const itemData = loadJson('items.json');
const synData = loadJson('synergies.json');

ok(Array.isArray(augData.augments) && augData.augments.length > 200, '데이터: augments 로드');
ok(Array.isArray(champData.champions) && champData.champions.length > 150, '데이터: champions 로드');
ok(Array.isArray(itemData.items) && itemData.items.length >= 60, '데이터: items 로드');
ok(Array.isArray(synData.combos) && Array.isArray(synData.tagRules), '데이터: synergies 로드');

// ---- 2) 교차 무결성 (통합 체크) ----
const augNames = new Set(augData.augments.map((a) => a.apiName));
const itemIds = new Set(itemData.items.map((i) => i.id));
const champIds = new Set(champData.champions.map((c) => c.id));
let badAug = 0, badItem = 0, badChamp = 0;
for (const c of synData.combos) {
  for (const n of c.augments || []) if (!augNames.has(n)) badAug++;
  for (const id of c.items || []) if (!itemIds.has(id)) badItem++;
  for (const id of c.champions || []) if (!champIds.has(id)) badChamp++;
}
for (const r of synData.tagRules) {
  for (const id of r.items || []) if (!itemIds.has(id)) badItem++;
}
ok(badAug === 0, '무결성: combos 증강 apiName 전부 augments.json에 존재 (불일치 ' + badAug + '건)');
ok(badItem === 0, '무결성: 시너지 아이템 id 전부 items.json에 존재 (불일치 ' + badItem + '건)');
ok(badChamp === 0, '무결성: combos 챔피언 id 전부 champions.json에 존재 (불일치 ' + badChamp + '건)');

// ---- 3) 에코로 4라운드 자동 진행 ----
const ekko = champData.champions.find((c) => c.id === 'Ekko');
ok(!!ekko, '챔피언: 에코(Ekko) 존재');
ok(ekko && ekko.nameKo === '에코', '챔피언: nameKo "에코"');

const pool = eligibleAugments(augData.augments, ekko);
ok(pool.length > 100, '드래프트: 에코 적격 증강 풀 ' + pool.length + '종 (>100)');
ok(pool.every((a) => a.enabled !== false), '드래프트: 비활성 증강 전부 필터됨');

const SEED = 20260902;
const game = newGame({ augments: augData.augments, champion: ekko, seed: SEED });

for (let r = 0; r < 4; r++) {
  const round = nextRound(game);
  ok(round.level === ROUND_LEVELS[r], '라운드 ' + (r + 1) + ': 레벨 ' + ROUND_LEVELS[r]);
  ok(round.slots.length === 3, '라운드 ' + (r + 1) + ': 슬롯 3개');
  ok(round.slots.every((a) => a && augNames.has(a.apiName)), '라운드 ' + (r + 1) + ': 슬롯 전부 실제 증강');
  // 라운드마다 다른 경로를 태운다: 1R 일반 리롤, 2R 황금 리롤, 3·4R 그대로 선택
  if (r === 0) {
    const before = round.slots[1].apiName;
    const after = rerollSlot(game, 1);
    ok(after.apiName !== before, '라운드 1: 슬롯 1 리롤로 교체됨');
  }
  if (r === 1) {
    const beforeTier = round.slots[2].tier;
    const after = goldenReroll(game, 2);
    const upOk = beforeTier === 'prismatic'
      ? after.tier === 'prismatic'
      : (beforeTier === 'silver' ? after.tier !== 'silver' : true);
    ok(upOk, '라운드 2: 황금 리롤 등급 상승/유지 (' + beforeTier + ' → ' + after.tier + ')');
    ok(game.goldenUsed === true, '라운드 2: goldenUsed 플래그');
  }
  pickAugment(game, 0);
}

ok(game.finished === true, '드래프트: 4라운드 후 finished');
ok(game.picked.length === 4, '드래프트: picked 4개');
const pickedNames = game.picked.map((a) => a.apiName);
ok(new Set(pickedNames).size === 4, '드래프트: 선택 증강 중복 없음');

// 시드 재현성: 같은 시드 + 같은 조작 = 같은 결과
const game2 = newGame({ augments: augData.augments, champion: ekko, seed: SEED });
for (let r = 0; r < 4; r++) {
  nextRound(game2);
  if (r === 0) rerollSlot(game2, 1);
  if (r === 1) goldenReroll(game2, 2);
  pickAugment(game2, 0);
}
ok(JSON.stringify(game2.picked.map((a) => a.apiName)) === JSON.stringify(pickedNames),
  '재현성: 같은 시드 = 같은 4증강');

// ---- 4) 추천 생성 ----
const rec = recommend({
  champion: ekko,
  picked: game.picked,
  synergies: synData,
  items: itemData.items,
  augments: augData.augments,
});

ok(typeof rec.headline === 'string' && rec.headline.length > 0, '추천: headline');
ok(typeof rec.playstyle === 'string' && rec.playstyle.length > 0, '추천: playstyle');
ok(Array.isArray(rec.matchedCombos), '추천: matchedCombos 배열');
ok(Array.isArray(rec.items) && rec.items.length > 0 && rec.items.length <= 6,
  '추천: 아이템 1~6개 (' + rec.items.length + '개)');
ok(rec.items.every((it) => itemIds.has(it.id) && typeof it.nameKo === 'string' && typeof it.reason === 'string'),
  '추천: 아이템 필드 {id, nameKo, icon, reason} + 실존 id');
ok(typeof rec.skills === 'string' && rec.skills.length > 0, '추천: skills');
ok(typeof rec.funScore === 'number' && rec.funScore >= 0 && rec.funScore <= 100,
  '추천: funScore 0~100 (' + rec.funScore + ')');
ok(Array.isArray(rec.styleTags) && rec.styleTags.length > 0, '추천: styleTags');

// ---- 5) 전 챔피언 스모크: newGame + 1라운드 + recommend가 어떤 챔피언에서도 안 죽는지 ----
let smokeErrors = 0;
for (const champ of champData.champions) {
  try {
    const g = newGame({ augments: augData.augments, champion: champ, seed: 7 });
    nextRound(g);
    pickAugment(g, 0);
    recommend({ champion: champ, picked: g.picked, synergies: synData, items: itemData.items, augments: augData.augments });
  } catch (err) {
    smokeErrors++;
    console.error('  스모크 실패: ' + champ.id + ' — ' + err.message);
  }
}
ok(smokeErrors === 0, '스모크: 전 챔피언 ' + champData.champions.length + '명 1라운드+추천 무사고');

// ---- 결과 ----
console.log('\n통과 ' + passed + ' / 실패 ' + failed);
if (failed > 0) process.exit(1);
console.log('E2E 통합 스모크 통과');
