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
import { recommend, previewAugment } from '../docs/js/recommend.js';

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

// ---- 2.6) funrank.json 로드 + 참조 무결성 (선택 데이터지만 저장소에 있는 한 계약 준수) ----
{
  const funData = loadJson('funrank.json');
  ok(funData && Array.isArray(funData.ranks), 'funrank: ranks 배열 로드');
  const ranks = funData.ranks || [];
  ok(ranks.length === champData.champions.length,
    'funrank: 항목 수(' + ranks.length + ') = 챔피언 수(' + champData.champions.length + ')');

  const rankIds = new Set(ranks.map((r) => r.id));
  let missing = 0, badId = 0, badSig = 0, badTier = 0, badScore = 0;
  const tierVocab = new Set(['S+', 'S', 'A', 'B', 'C']);
  for (const c of champData.champions) if (!rankIds.has(c.id)) missing++;
  for (const r of ranks) {
    if (!champIds.has(r.id)) badId++;
    if (!tierVocab.has(r.tier)) badTier++;
    if (typeof r.funScore !== 'number' || r.funScore < 0 || r.funScore > 100) badScore++;
    for (const s of r.signatureAugments || []) if (!augNames.has(s)) badSig++;
  }
  ok(missing === 0, 'funrank: 챔피언 173명 전원 존재 (누락 ' + missing + '명)');
  ok(badId === 0, 'funrank: id 전부 champions.json에 존재 (불일치 ' + badId + '건)');
  ok(badSig === 0, 'funrank: signatureAugments 전부 augments.json에 존재 (불일치 ' + badSig + '건)');
  ok(badTier === 0, 'funrank: tier 어휘 준수 (위반 ' + badTier + '건)');
  ok(badScore === 0, 'funrank: funScore 0~100 (위반 ' + badScore + '건)');
}

// ---- 2.5) 실데이터 풀 게이트 검증 (2차 스터디 실측 패턴 재현 — AUGMENT-POOLS-STUDY.md §3) ----
{
  const byId = (id) => champData.champions.find((c) => c.id === id);
  const zed = byId('Zed');
  const malphite = byId('Malphite');
  const jinx = byId('Jinx');
  const soraka = byId('Soraka');
  ok(zed && malphite && jinx && soraka, '풀 게이트: 검증 챔피언 4명 존재');

  // 검증 기준 1: 제드(기력)에게 마나 증강 3종 절대 미제시
  const zedPool = new Set(eligibleAugments(augData.augments, zed).map((a) => a.apiName));
  for (const mana of ['ARAM_Overflow', 'ARAM_Juiced', 'ARAM_MindtoMatter']) {
    ok(augNames.has(mana), '풀 게이트: 마나 증강 실존 — ' + mana);
    ok(!zedPool.has(mana), '풀 게이트: 제드 풀에 ' + mana + ' 부재 (requiresMana)');
  }

  // 검증 기준 6: 챔피언별 풀 크기 비대칭 — 말파이트 풀 > 징크스 풀 방향성
  const malPool = eligibleAugments(augData.augments, malphite);
  const jinxPool = eligibleAugments(augData.augments, jinx);
  ok(malPool.length > jinxPool.length,
    '풀 게이트: 말파이트 풀(' + malPool.length + ') > 징크스 풀(' + jinxPool.length + ')');

  // 검증 기준 4: Spin To Win은 화이트리스트 챔피언에게만 — 소라카 풀에 부재
  ok(augNames.has('ARAM_SpinToWin'), '풀 게이트: ARAM_SpinToWin 실존');
  const sorakaPool = new Set(eligibleAugments(augData.augments, soraka).map((a) => a.apiName));
  ok(!sorakaPool.has('ARAM_SpinToWin'), '풀 게이트: 소라카 풀에 ARAM_SpinToWin 부재 (championWhitelist)');

  // 슬롯 고정/스킬 제외 연동: enhancedSkill이 restrictions.slot·spellExclude를 존중하는지
  // (근사: 스킬 지정은 "적격 스킬 중 무작위" — draft.js presentAugment 주석 참조)
  const bread = augData.augments.find((a) => a.apiName === 'ARAM_BreadAndButter');
  const recursion = augData.augments.find((a) => a.apiName === 'ARAM_SpecializedRecursion');
  const yasuo = byId('Yasuo');
  if (bread && bread.restrictions && bread.restrictions.slot && zed) {
    let slotOk = true;
    for (let s = 0; s < 10; s++) {
      const g = newGame({ augments: [bread], champion: zed, seed: 1000 + s });
      const round = nextRound(g);
      const got = round.slots[0] && round.slots[0].enhancedSkill;
      if (!got || got.key !== bread.restrictions.slot) slotOk = false;
    }
    ok(slotOk, '스킬 증강: restrictions.slot 고정 (Bread And Butter → ' + bread.restrictions.slot + ')');
  }
  if (recursion && yasuo) {
    let exclOk = true;
    for (let s = 0; s < 30; s++) {
      const g = newGame({ augments: [recursion], champion: yasuo, seed: 2000 + s });
      const round = nextRound(g);
      const got = round.slots[0] && round.slots[0].enhancedSkill;
      if (!got || got.key === 'E') exclOk = false; // 야스오 E 부적격 (공식 26.14 버그픽스)
    }
    ok(exclOk, '스킬 증강: spellExclude 존중 (야스오×Specialized Recursion에서 E 미지정, 30시드)');
  }
}

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

// ---- 4.5) previewAugment: 에코 드래프트 각 라운드 3슬롯 전부 무사고 + 형태 검증 ----
// 실데이터로 라운드마다(빈 picked 1라운드 포함) 제시 카드 3장 각각에 미리보기를 호출한다.
{
  const game3 = newGame({ augments: augData.augments, champion: ekko, seed: SEED });
  let calls = 0, bad = 0, newComboBad = 0;
  for (let r = 0; r < 4; r++) {
    const round = nextRound(game3);
    for (let s = 0; s < round.slots.length; s++) {
      const p = previewAugment({
        champion: ekko,
        candidate: round.slots[s],
        picked: game3.picked.slice(),
        synergies: synData,
        items: itemData.items,
        augments: augData.augments,
      });
      calls++;
      const shapeOk = p && typeof p === 'object'
        && typeof p.route === 'string' && p.route.length > 0
        && Array.isArray(p.styleTags) && p.styleTags.length >= 1 && p.styleTags.length <= 2
        && p.styleTags.every((t) => typeof t === 'string' && t.length > 0)
        && Array.isArray(p.newCombos) && p.newCombos.length <= 2
        && p.newCombos.every((c) => c && typeof c.title === 'string' && typeof c.whyFun === 'string')
        && Array.isArray(p.items) && p.items.length <= 3
        && p.items.every((it) => it && itemIds.has(it.id) && typeof it.nameKo === 'string' && typeof it.icon === 'string')
        && typeof p.funDelta === 'number' && isFinite(p.funDelta);
      if (!shapeOk) {
        bad++;
        console.error('  preview 형태 위반: 라운드 ' + (r + 1) + ' 슬롯 ' + s + ' — ' + JSON.stringify(p));
      }
      // newCombos 계약: 전부 실제 combo이고 candidate.apiName이 그 combo.augments에 포함돼야 함
      for (const nc of p.newCombos || []) {
        const src = synData.combos.find((c) => c.title === nc.title);
        if (!src || !(src.augments || []).includes(round.slots[s].apiName)) newComboBad++;
      }
    }
    pickAugment(game3, 0);
  }
  ok(calls === 12, 'preview: 4라운드 × 3슬롯 = 12회 호출 (' + calls + '회)');
  ok(bad === 0, 'preview: 형태 위반 0건 (' + bad + '건)');
  ok(newComboBad === 0, 'preview: newCombos 전부 후보 포함 실제 combo (' + newComboBad + '건 위반)');
}

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
