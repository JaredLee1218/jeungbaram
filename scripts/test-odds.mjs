/**
 * scripts/test-odds.mjs — 확률 조회 API 검증 (SPEC-day2 §5, T4) (Node v14 호환)
 * 실행: node scripts/test-odds.mjs   (실패 시 exit 1)
 *
 * 실데이터(docs/data/*.json)로 draft.js의 순수 조회 API
 * (drawDistribution / rerollDistribution(혼합) / hitProbability /
 *  skillOdds / remainingByTier)를 검증한다.
 * G-AUTO 갱신(사유: 황금 리롤이 수동 액션에서 자동 발동으로 리워크 — raw/19):
 * goldenDistribution 케이스는 rerollDistribution의 혼합 분포
 * P(a) = (1-g)·P_동급(a) + g·P_상급(a) 검증으로 대체됐다.
 *
 *  [1] 분포 불변식 — 12챔피언 × 전 등급 × (신규 게임 / 2라운드 진행 후):
 *      Σp = 1 ± 1e-9, 음수 p·weight 0건, entries = {pool − used, tier 일치} 정확 집합 일치,
 *      entries 순서 = pool 순서, weight = weightFor 재호출값, totalWeight = 순서 합,
 *      used(노출·선택분) 제외 확인 + rerollDistribution 혼합 정합(base/golden/goldenChance)
 *  [2] 순수성 — 조회 API 호출 전후 game JSON(rngState 포함) 불변
 *  [3] skillOdds 불변식 — 12챔피언 × 풀 내 스킬 증강 전부 (Σ=1±1e-9, 음수 0,
 *      spellPin은 해당 키 정확히 1.0, 비스킬 증강은 전부 0)
 *  [4] 엣지: 풀 고갈·타 등급 보충 — used 주입으로 FALLBACK_ORDER /
 *      FALLBACK_ORDER_UPGRADE 각 분기 강제, 전 등급 고갈 시 entries=[],
 *      프리즘 화면·화면 내 기발동이면 goldenChance=0 (판정 불가 상태)
 *  [5] hitProbability — Σ(개별 p)와 일치(±1e-12), Set/술어 함수 동등
 *  [6] 몬테카를로 대조 — 시나리오 8개(일반 리롤 / trackL9 / 자동 황금 혼합 / 폴백 /
 *      skillOdds ③균등·exclude / ①pin), 시드 고정 재현 가능, 시나리오당 N=100,000:
 *      각 증강(또는 스킬 키)의 |실측 빈도 − 해석 확률| < 4·√(p(1−p)/N)  (4σ 판정)
 *      — rerollSlot의 판정 draw + 결과 draw가 혼합 분포와 일치하는지의 직접 실증
 *  [7] 결정론 가드 — 같은 시드 100게임 전체 이력을 이중 실행 diff + FNV-1a 해시 고정
 *      (SPEC §5-1의 스냅샷 diff — 엔진 리팩터가 드로우 바이트를 바꾸면 여기서 잡힌다)
 *
 * 몬테카를로 방법론: 시나리오 상태를 고정하고 매 시행 rngState만 시드 고정 마스터 RNG로
 * 교체 → rerollSlot/goldenReroll 1회 실행 → O(1) 되감기(used 절단·슬롯 원복·플래그 원복).
 * JSON 전체 복제 대신 되감기를 쓰는 것은 실행 시간 최적화이며, 시나리오 종료 시
 * 원본 스냅샷과의 JSON 완전 일치로 되감기의 무결성을 증명한다.
 * 4σ 임계는 통계 관례(양측 p≈6.3e-5)로, 시드 고정이라 통과/실패는 항상 재현된다.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
/* goldenReroll/goldenDistribution import 제거 — G-AUTO 리워크로 export 삭제됨(위 헤더 사유) */
import {
  createRng,
  newGame,
  nextRound,
  rerollSlot,
  pickAugment,
  weightFor,
  drawDistribution,
  rerollDistribution,
  hitProbability,
  skillOdds,
  remainingByTier,
  TIERS,
} from '../docs/js/draft.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, '..', 'docs', 'data');
function loadJson(f) {
  return JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
}
const AUGMENTS = loadJson('augments.json').augments;
const CHAMPIONS = loadJson('champions.json').champions;

/* draft.js 내부 상수의 로컬 미러 (export되지 않은 폴백 규칙 — 값이 어긋나면
 * [4]의 resolvedTier 검증과 [6]의 몬테카를로 대조가 실패해 드리프트를 잡는다) */
const TIER_UP = { silver: 'gold', gold: 'prismatic', prismatic: 'prismatic' };
const FALLBACK_ORDER = {
  silver: ['gold', 'prismatic'],
  gold: ['silver', 'prismatic'],
  prismatic: ['gold', 'silver'],
};
const FALLBACK_ORDER_UPGRADE = {
  silver: ['prismatic', 'silver'],
  gold: ['gold', 'silver'],
  prismatic: ['gold', 'silver'],
};

/* ---------------- 테스트 하네스 ---------------- */
let passCount = 0;
let failCount = 0;
function check(cond, msg) {
  if (cond) { passCount++; }
  else { failCount++; console.error('  FAIL: ' + msg); }
}
function section(title) { console.log('[' + title + ']'); }
function byId(id) {
  const c = CHAMPIONS.find(function (x) { return x.id === id; });
  if (!c) throw new Error('champions.json에 없는 챔피언: ' + id);
  return c;
}

/* ---------------- 상태 조작 헬퍼 (game은 plain JSON — draft.js 헤더의 계약) ---------------- */

/** 해당 등급의 미노출 증강 전부를 used로 주입 (고갈 강제). 주입한 apiName 목록 반환. */
function depleteTier(game, tier) {
  const used = {};
  for (const n of game.used) used[n] = true;
  const injected = [];
  for (const a of game.pool) {
    if (a.tier === tier && !used[a.apiName]) { game.used.push(a.apiName); injected.push(a.apiName); }
  }
  return injected;
}

/** depleteTier로 주입했던 이름들을 used에서 되돌린다 (엣지 시나리오 구성용). */
function removeFromUsed(game, names) {
  const rm = {};
  for (const n of names) rm[n] = true;
  game.used = game.used.filter(function (n) { return !rm[n]; });
}

/** keep 1개만 남기고 미노출 풀 전부를 used로 주입 (skillOdds 몬테카를로용). */
function depleteAllExcept(game, keepApiName) {
  const used = {};
  for (const n of game.used) used[n] = true;
  for (const a of game.pool) {
    if (a.apiName !== keepApiName && !used[a.apiName]) game.used.push(a.apiName);
  }
}

/** k개 라운드를 진행·선택(결정적 픽)하고, 마지막에 nextRound 1회로 진행 중 라운드를 연다.
 *  goldenChance 미지정 시 draft.js 기본값(GOLDEN_REROLL_CHANCE) — 혼합 분포 경로가 기본 커버됨. */
function setupActiveRound(champion, seed, trackL9, roundsBefore, goldenChance) {
  const game = newGame({ augments: AUGMENTS, champion: champion, seed: seed, trackL9: trackL9, goldenChance: goldenChance });
  for (let r = 0; r < roundsBefore; r++) {
    nextRound(game);
    const cur = game.rounds[game.rounds.length - 1];
    pickAugment(game, r % cur.slots.length);
  }
  nextRound(game);
  return game;
}

/* ================================================================== */
/* [1] 분포 불변식 + [2] 순수성 + [3] skillOdds 불변식 — 12챔피언       */
/* ================================================================== */
section('1~3. 분포·skillOdds 불변식 + 순수성 (12챔피언 × 전 등급)');

const CHAMP_IDS = ['Lux', 'Ashe', 'MasterYi', 'Yasuo', 'Garen', 'Amumu',
  'Twitch', 'Katarina', 'Illaoi', 'Zeri', 'Ahri', 'Aatrox'];

/** dist가 game 상태에 대한 정확한 분포인지 전 항목 검증 */
function checkDistInvariants(label, game, dist, startTier) {
  const usedSet = {};
  for (const n of game.used) usedSet[n] = true;
  const wOpts = { trackL9: game.trackL9 === true };

  // resolvedTier: 시작 등급이 비고갈이면 그대로여야 함
  const remain = remainingByTier(game);
  if (startTier && remain[startTier] > 0) {
    check(dist.resolvedTier === startTier,
      label + ': resolvedTier=' + dist.resolvedTier + ' (기대 ' + startTier + ')');
  }
  const t = dist.resolvedTier;
  check(t !== null && dist.entries.length > 0, label + ': 비고갈인데 entries가 빔');
  if (t === null) return;

  // 기대 집합: pool 순서대로 {tier 일치, 미노출}
  const expected = [];
  for (const a of game.pool) {
    if (a.tier === t && !usedSet[a.apiName]) expected.push(a.apiName);
  }
  const actual = dist.entries.map(function (e) { return e.aug.apiName; });
  check(JSON.stringify(actual) === JSON.stringify(expected),
    label + ': entries가 pool−used 집합·pool 순서와 불일치');

  // weight = weightFor 재호출값, totalWeight = 같은 순서 합, p 비음수·정규화
  let sumW = 0;
  let sumP = 0;
  let ok = true;
  for (const e of dist.entries) {
    const w = weightFor(e.aug, game.champion, wOpts);
    if (e.weight !== w) { ok = false; }
    if (e.weight < 0 || e.p < 0) { ok = false; }
    sumW += e.weight; // drawDistribution과 같은 순서의 부동소수 합 → 정확 일치 기대
    sumP += e.p;
  }
  check(ok, label + ': weight/p 재계산 불일치 또는 음수');
  check(dist.totalWeight === sumW, label + ': totalWeight ≠ Σweight');
  check(Math.abs(sumP - 1) <= 1e-9, label + ': Σp=' + sumP + ' (1±1e-9 벗어남)');

  // used 제외 확인 (노출·선택 전부)
  const leaked = actual.filter(function (n) { return usedSet[n]; });
  check(leaked.length === 0, label + ': used 증강이 분포에 포함 ' + leaked.join(','));
}

/**
 * rerollDistribution(혼합 — G-AUTO)의 불변식 검증:
 *  - base(동급)/golden(상급) 하위 분포 각각 checkDistInvariants
 *  - goldenChance = 판정 가능 상태(실버/골드 화면·화면 내 미발동)면 game.goldenChance, 아니면 0
 *  - 혼합 정합: p(a) = (1-g)·p_base(a) + g·p_golden(a), Σp = 1, 중복 병합·후보 누락 없음
 */
function checkMixedInvariants(label, game, dist, slotIndex) {
  const round = game.rounds[game.rounds.length - 1];
  const slotTier = round.slots[slotIndex].tier;
  checkDistInvariants(label + '/base', game, dist.base, slotTier);
  const eligible = (round.tier === 'silver' || round.tier === 'gold') && round.golden === null;
  const expectG = eligible ? game.goldenChance : 0;
  check(dist.goldenChance === expectG,
    label + ': goldenChance=' + dist.goldenChance + ' (기대 ' + expectG + ')');
  check(dist.resolvedTier === dist.base.resolvedTier && dist.totalWeight === dist.base.totalWeight,
    label + ': 최상위 resolvedTier/totalWeight ≠ base');
  if (!(expectG > 0)) {
    check(dist.golden === null && dist.goldenTier === null, label + ': g=0인데 golden 분포 존재');
    check(dist.entries === dist.base.entries, label + ': g=0이면 entries === base.entries');
    return;
  }
  checkDistInvariants(label + '/golden', game, dist.golden, TIER_UP[round.tier]);
  check(dist.goldenTier === dist.golden.resolvedTier, label + ': goldenTier ≠ golden.resolvedTier');
  const g = expectG;
  const pBase = {};
  const pUp = {};
  dist.base.entries.forEach(function (e) { pBase[e.aug.apiName] = e.p; });
  dist.golden.entries.forEach(function (e) { pUp[e.aug.apiName] = e.p; });
  let sum = 0;
  let mixOk = true;
  const seen = {};
  for (const e of dist.entries) {
    if (seen[e.aug.apiName]) mixOk = false; // apiName 중복 = 병합 실패
    seen[e.aug.apiName] = true;
    const want = (1 - g) * (pBase[e.aug.apiName] || 0) + g * (pUp[e.aug.apiName] || 0);
    if (Math.abs(e.p - want) > 1e-12) mixOk = false;
    sum += e.p;
  }
  for (const n in pBase) if (!seen[n]) mixOk = false;
  for (const n in pUp) if (!seen[n]) mixOk = false;
  check(mixOk, label + ': 혼합 p ≠ (1-g)·base + g·golden (또는 후보 누락/중복)');
  check(Math.abs(sum - 1) <= 1e-9, label + ': 혼합 Σp=' + sum);
}

for (let ci = 0; ci < CHAMP_IDS.length; ci++) {
  const champ = byId(CHAMP_IDS[ci]);
  const trackL9 = ci % 2 === 1; // 절반은 trackL9 on — 가중 경로 커버

  // (a) 신규 게임 (used 없음)
  const fresh = newGame({ augments: AUGMENTS, champion: champ, seed: 1000 + ci, trackL9: trackL9 });
  for (const tier of TIERS) {
    checkDistInvariants(champ.id + '/신규/' + tier, fresh, drawDistribution(fresh, tier), tier);
  }

  // (b) 2라운드 진행 + 진행 중 라운드 (used 9개+ 누적) — used 제외가 실제로 걸리는 상태
  const game = setupActiveRound(champ, 5000 + ci, trackL9, 2);
  check(game.used.length >= 9, champ.id + ': 2라운드 후 used ' + game.used.length + '개 (9+ 기대)');
  for (const tier of TIERS) {
    checkDistInvariants(champ.id + '/진행/' + tier, game, drawDistribution(game, tier), tier);
  }
  // 리롤 래퍼(혼합 분포)도 불변식 검증 — G-AUTO 갱신: goldenDistribution 별도 케이스는
  // 혼합 분포의 base/golden 하위 분포 검증으로 대체 (checkMixedInvariants 주석 참조)
  checkMixedInvariants(champ.id + '/rerollDist', game, rerollDistribution(game, 0), 0);

  // [2] 순수성: 조회 API 6종 호출 전후 game 불변 (rngState 포함 — rng 미소비 증명)
  const abilityAug = game.pool.find(function (a) { return a.category === 'ability'; });
  const before = JSON.stringify(game);
  for (const tier of TIERS) drawDistribution(game, tier);
  rerollDistribution(game, 0);
  rerollDistribution(game, 1); // (goldenDistribution 삭제 — 혼합 분포가 golden 하위 분포 포함)
  remainingByTier(game);
  if (abilityAug) skillOdds(game, abilityAug);
  hitProbability(rerollDistribution(game, 0), new Set());
  check(JSON.stringify(game) === before, champ.id + ': 조회 API가 game을 변형(순수성 위반)');

  // [3] skillOdds 불변식 — 풀 내 스킬 증강 전부
  for (const a of game.pool) {
    const odds = skillOdds(game, a);
    const keys = ['Q', 'W', 'E', 'R'];
    const sum = odds.Q + odds.W + odds.E + odds.R;
    const neg = keys.some(function (k) { return odds[k] < 0; });
    check(!neg, champ.id + '/' + a.apiName + ': skillOdds 음수');
    if (a.category !== 'ability') {
      check(sum === 0, champ.id + '/' + a.apiName + ': 비스킬 증강인데 skillOdds ≠ 0');
      continue;
    }
    check(Math.abs(sum - 1) <= 1e-9, champ.id + '/' + a.apiName + ': skillOdds Σ=' + sum);
    const r = a.restrictions || {};
    const pin = (r.spellPin && typeof r.spellPin[champ.id] === 'string') ? r.spellPin[champ.id] : null;
    const excluded = (r.spellExclude && Array.isArray(r.spellExclude[champ.id])) ? r.spellExclude[champ.id] : [];
    if (pin && keys.indexOf(pin) !== -1 && excluded.indexOf(pin) === -1) {
      check(odds[pin] === 1, champ.id + '/' + a.apiName + ': spellPin ' + pin + '≠1.0 (' + odds[pin] + ')');
    }
  }
}

/* ================================================================== */
/* [4] 엣지: 풀 고갈·타 등급 보충 경로                                   */
/* ================================================================== */
section('4. 엣지 — 폴백·전 고갈 (used 주입 강제)');

{
  const champ = byId('Lux');

  // (a) 일반 폴백 사슬: silver 고갈 → gold → prismatic → 전 고갈
  const g1 = newGame({ augments: AUGMENTS, champion: champ, seed: 71 });
  depleteTier(g1, 'silver');
  let d = drawDistribution(g1, 'silver');
  check(d.resolvedTier === FALLBACK_ORDER.silver[0],
    '엣지a: silver 고갈 시 resolvedTier=' + d.resolvedTier + ' (기대 ' + FALLBACK_ORDER.silver[0] + ')');
  checkDistInvariants('엣지a/gold보충', g1, d, null);
  depleteTier(g1, 'gold');
  d = drawDistribution(g1, 'silver');
  check(d.resolvedTier === FALLBACK_ORDER.silver[1],
    '엣지a: silver·gold 고갈 시 resolvedTier=' + d.resolvedTier);
  checkDistInvariants('엣지a/prism보충', g1, d, null);
  depleteTier(g1, 'prismatic');
  for (const tier of TIERS) {
    d = drawDistribution(g1, tier);
    check(d.resolvedTier === null && d.entries.length === 0 && d.totalWeight === 0,
      '엣지a: 전 고갈(' + tier + ') 시 빈 분포가 아님');
  }

  // (b) gold 시작 폴백: gold 고갈 → silver (FALLBACK_ORDER.gold[0])
  const g2 = newGame({ augments: AUGMENTS, champion: champ, seed: 72 });
  depleteTier(g2, 'gold');
  d = drawDistribution(g2, 'gold');
  check(d.resolvedTier === FALLBACK_ORDER.gold[0],
    '엣지b: gold 고갈 시 resolvedTier=' + d.resolvedTier + ' (기대 ' + FALLBACK_ORDER.gold[0] + ')');

  // (G-AUTO 갱신: goldenDistribution 삭제 — 황금 경로 폴백은 rerollDistribution(...)
  //  .golden(상급 하위 분포)으로 검증한다. 상급 분포의 기준 등급은 화면 등급(round.tier)+1.)

  // (c) 황금 경로 폴백 — silver 화면, 상위(gold)·prismatic 고갈 → silver 유지
  //     (FALLBACK_ORDER_UPGRADE.silver = ['prismatic','silver'] 전 분기)
  const g3 = newGame({ augments: AUGMENTS, champion: champ, seed: 73 });
  depleteTier(g3, 'gold');
  depleteTier(g3, 'prismatic');
  nextRound(g3); // 등급 롤 후보가 silver뿐 → silver 라운드
  check(g3.rounds[0].tier === 'silver', '엣지c: 강제 silver 라운드 실패(' + g3.rounds[0].tier + ')');
  d = rerollDistribution(g3, 0);
  check(d.goldenChance === g3.goldenChance && d.golden !== null,
    '엣지c: silver 화면·미발동인데 goldenChance=' + d.goldenChance);
  check(d.golden.resolvedTier === 'silver',
    '엣지c: gold·prism 고갈 시 황금 경로 resolvedTier=' + d.golden.resolvedTier + ' (기대 silver)');
  checkDistInvariants('엣지c/silver유지', g3, d.golden, null);
  // (c2) 화면 내 기발동 상태 주입 → 판정 불가(goldenChance=0)
  g3.rounds[0].golden = 1;
  d = rerollDistribution(g3, 0);
  check(d.goldenChance === 0 && d.golden === null, '엣지c2: 화면 내 기발동 후 황금 판정 없음');
  g3.rounds[0].golden = null; // 원복

  // (d) 황금 경로 폴백 — silver 화면, gold만 고갈 → prismatic (UPGRADE[silver][0])
  const g4 = newGame({ augments: AUGMENTS, champion: champ, seed: 74 });
  const injGold = depleteTier(g4, 'gold');
  const injPrism = depleteTier(g4, 'prismatic');
  nextRound(g4); // silver 라운드 강제
  removeFromUsed(g4, injPrism); // prismatic 복구 → gold만 고갈 상태
  check(injGold.length > 0 && g4.rounds[0].tier === 'silver', '엣지d: 상태 구성 실패');
  d = rerollDistribution(g4, 0).golden;
  check(d !== null && d.resolvedTier === FALLBACK_ORDER_UPGRADE.silver[0],
    '엣지d: gold 고갈 시 황금 경로 resolvedTier=' + (d && d.resolvedTier) + ' (기대 prismatic)');
  checkDistInvariants('엣지d/prism상승', g4, d, null);

  // (e) 황금 경로 폴백 — gold 화면, prismatic 고갈 → gold 유지 (UPGRADE[gold][0])
  const g5 = newGame({ augments: AUGMENTS, champion: champ, seed: 75 });
  depleteTier(g5, 'silver');
  depleteTier(g5, 'prismatic');
  nextRound(g5); // gold 라운드 강제
  check(g5.rounds[0].tier === 'gold', '엣지e: 강제 gold 라운드 실패(' + g5.rounds[0].tier + ')');
  d = rerollDistribution(g5, 0).golden;
  check(d !== null && d.resolvedTier === FALLBACK_ORDER_UPGRADE.gold[0],
    '엣지e: prism 고갈 시 황금 경로 resolvedTier=' + (d && d.resolvedTier) + ' (기대 gold)');

  // (f) prismatic 화면 — G-AUTO에서는 황금 판정 자체가 없음(goldenChance=0) + 전 고갈 → 빈 분포
  const g6 = newGame({ augments: AUGMENTS, champion: champ, seed: 76 });
  depleteTier(g6, 'silver');
  depleteTier(g6, 'gold');
  nextRound(g6); // prismatic 라운드 강제
  check(g6.rounds[0].tier === 'prismatic', '엣지f: 강제 prismatic 라운드 실패');
  d = rerollDistribution(g6, 0);
  check(d.goldenChance === 0 && d.golden === null,
    '엣지f: prismatic 화면은 황금 판정 없음 (goldenChance=0)');
  check(d.resolvedTier === 'prismatic', '엣지f: prismatic 화면 리롤은 prismatic 동급');
  depleteTier(g6, 'prismatic');
  d = rerollDistribution(g6, 0);
  check(d.resolvedTier === null && d.entries.length === 0,
    '엣지f: 전 고갈 시 리롤 분포가 비어야 함');
}

/* ================================================================== */
/* [5] hitProbability — Σ개별 p 일치 + Set/술어 동등                     */
/* ================================================================== */
section('5. hitProbability');

{
  const game = setupActiveRound(byId('Ahri'), 8801, false, 1);
  const dist = rerollDistribution(game, 0);
  check(dist.entries.length >= 6, 'hitProb: 후보가 너무 적음 (' + dist.entries.length + ')');
  // 랜덤 목표 집합 3개 (시드 고정 마스터 RNG로 구성)
  const rng = createRng('hitprob-targets');
  for (let k = 0; k < 3; k++) {
    const names = [];
    let expected = 0;
    for (const e of dist.entries) {
      if (rng() < 0.3) { names.push(e.aug.apiName); expected += e.p; }
    }
    const set = new Set(names);
    const pSet = hitProbability(dist, set);
    const pFn = hitProbability(dist, function (a) { return set.has(a.apiName); });
    check(Math.abs(pSet - expected) <= 1e-12, 'hitProb Set#' + k + ': ' + pSet + ' ≠ Σp ' + expected);
    check(pSet === pFn, 'hitProb 술어#' + k + ': Set(' + pSet + ') ≠ 함수(' + pFn + ')');
  }
  check(hitProbability(dist, new Set()) === 0, 'hitProb: 빈 집합은 0');
  check(hitProbability({ resolvedTier: null, entries: [], totalWeight: 0 }, new Set(['x'])) === 0,
    'hitProb: 빈 분포는 0');
  const pAll = hitProbability(dist, function () { return true; });
  check(Math.abs(pAll - 1) <= 1e-9, 'hitProb: 전체 집합 Σp=' + pAll);
}

/* ================================================================== */
/* [6] 몬테카를로 대조 — 시나리오 8개, N=100,000, 4σ                     */
/* ================================================================== */
section('6. 몬테카를로 대조 (시나리오 8개, 시드 고정)');

const N_MC = 100000;
const mcRows = []; // 결과 표 (시나리오·resolvedTier·후보 수·maxσ)

/**
 * 몬테카를로 공용 루프: 상태 고정 → 매 시행 rngState 교체 → rerollSlot 1회 → O(1) 되감기.
 * (G-AUTO 갱신: 황금 리롤이 rerollSlot에 내재된 자동 발동이라 별도 action 분기가 없다 —
 *  판정 draw + 결과 draw의 실측 분포가 혼합 분포와 일치하는지가 검증 대상.)
 * 되감기 무결성은 종료 시 원본 JSON과의 완전 일치로 증명한다.
 * @returns {{ counts: Object, skillCounts: Object, goldenFired: number }}
 */
function runTrials(name, game, slot, n) {
  const round = game.rounds[game.rounds.length - 1];
  const savedSlot = round.slots[slot];
  const savedUsedLen = game.used.length;
  const savedRng = game.rngState;
  const savedGolden = round.golden; // 진행 중 라운드의 발동 상태 (시나리오 전제상 null)
  const pristine = JSON.stringify(game);
  const master = createRng('mc-' + name); // 시행별 rngState 공급 (시드 고정 → 재현 가능)
  const counts = {};
  const skillCounts = { Q: 0, W: 0, E: 0, R: 0 };
  let goldenFired = 0;
  for (let t = 0; t < n; t++) {
    game.rngState = Math.floor(master() * 4294967296) >>> 0;
    const got = rerollSlot(game, slot);
    counts[got.apiName] = (counts[got.apiName] || 0) + 1;
    if (round.golden === slot) goldenFired++;
    if (got.enhancedSkill && skillCounts[got.enhancedSkill.key] !== undefined) {
      skillCounts[got.enhancedSkill.key]++;
    }
    // O(1) 되감기 (rerollSlot의 변이 전부: used·슬롯·플래그·자동 발동 기록)
    game.used.length = savedUsedLen;
    round.slots[slot] = savedSlot;
    round.rerolled[slot] = false;
    round.golden = savedGolden;
  }
  game.rngState = savedRng;
  check(JSON.stringify(game) === pristine, name + ': 되감기 후 상태가 원본과 다름 (MC 무결성 위반)');
  return { counts: counts, skillCounts: skillCounts, goldenFired: goldenFired };
}

/** 실측 빈도 vs 해석 확률 4σ 대조. pairs = [{ key, p, count }]. 최대 편차(σ) 반환. */
function compareFreq(name, pairs, n) {
  let maxSigma = 0;
  let total = 0;
  for (const it of pairs) total += it.count;
  check(total === n, name + ': 실측 총합 ' + total + ' ≠ N ' + n);
  for (const it of pairs) {
    if (it.p <= 0) {
      check(it.count === 0, name + '/' + it.key + ': p=0인데 실측 ' + it.count + '회');
      continue;
    }
    if (it.p >= 1 - 1e-12) {
      check(it.count === n, name + '/' + it.key + ': p=1인데 실측 ' + it.count + '/' + n);
      continue;
    }
    const se = Math.sqrt(it.p * (1 - it.p) / n);
    const dev = Math.abs(it.count / n - it.p) / se;
    if (dev > maxSigma) maxSigma = dev;
    check(dev < 4, name + '/' + it.key + ': 편차 ' + dev.toFixed(2) + 'σ (p=' + it.p.toFixed(5)
      + ', 실측 ' + (it.count / n).toFixed(5) + ', N=' + n + ')');
  }
  return maxSigma;
}

/** 증강 분포 시나리오 1건 실행 — rerollSlot 실측 vs rerollDistribution(혼합) 해석 확률.
 *  cfg.goldenChance: newGame 재정의 (미지정 시 기본값 0.04 — 혼합이 기본 경로).
 *  cfg.requireGolden: 활성 라운드가 실버/골드(판정 가능)일 때까지 시드를 결정적으로 탐색. */
function mcAugScenario(cfg) {
  const champ = byId(cfg.champ);
  let game = setupActiveRound(champ, cfg.seed, cfg.trackL9, cfg.roundsBefore, cfg.goldenChance);
  if (cfg.requireGolden) {
    for (let t = 1; t <= 50; t++) {
      const rt = game.rounds[game.rounds.length - 1].tier;
      if (rt === 'silver' || rt === 'gold') break;
      game = setupActiveRound(champ, cfg.seed + t, cfg.trackL9, cfg.roundsBefore, cfg.goldenChance);
    }
    check(rerollDistribution(game, cfg.slot).goldenChance > 0,
      cfg.name + ': 판정 가능(실버/골드) 라운드 확보 실패');
  }
  if (cfg.prep) cfg.prep(game);
  const dist = rerollDistribution(game, cfg.slot);
  check(dist.entries.length >= 2 && dist.totalWeight > 0,
    cfg.name + ': 시나리오 전제 실패 (후보 ' + dist.entries.length + ')');
  if (cfg.expectTier) {
    check(dist.resolvedTier === cfg.expectTier,
      cfg.name + ': resolvedTier=' + dist.resolvedTier + ' (기대 ' + cfg.expectTier + ')');
  }
  if (cfg.needsAbility) {
    check(dist.entries.some(function (e) { return e.aug.category === 'ability'; }),
      cfg.name + ': trackL9 검증에 필요한 스킬 증강 후보가 없음');
  }
  const res = runTrials(cfg.name, game, cfg.slot, N_MC);
  // 자동 발동 빈도 자체도 이항 대조 (판정 draw의 실증 — goldenChance 0이면 0회여야 함)
  compareFreq(cfg.name + '/goldenFire',
    [{ key: '발동', p: dist.goldenChance, count: res.goldenFired },
     { key: '미발동', p: 1 - dist.goldenChance, count: N_MC - res.goldenFired }], N_MC);
  const known = {};
  const pairs = dist.entries.map(function (e) {
    known[e.aug.apiName] = true;
    return { key: e.aug.apiName, p: e.p, count: res.counts[e.aug.apiName] || 0 };
  });
  for (const k in res.counts) {
    check(known[k] === true, cfg.name + ': 분포 밖 증강이 실측 등장 ' + k);
  }
  const maxSigma = compareFreq(cfg.name, pairs, N_MC);

  // hitProbability 집합 적중 실측 대조 (entries 3개마다 1개 표본)
  if (cfg.hitProbe) {
    const names = [];
    for (let i = 0; i < dist.entries.length; i += 3) names.push(dist.entries[i].aug.apiName);
    const set = new Set(names);
    const pT = hitProbability(dist, set);
    let cT = 0;
    for (const nm of names) cT += res.counts[nm] || 0;
    // 여집합 쌍을 함께 넣어 총합=N을 만족시키고 양쪽 꼬리를 다 검정한다
    compareFreq(cfg.name + '/hitProb',
      [{ key: 'T', p: pT, count: cT }, { key: 'T여집합', p: 1 - pT, count: N_MC - cT }], N_MC);
  }

  mcRows.push({
    name: cfg.name, champ: cfg.champ,
    action: 'reroll(g=' + dist.goldenChance + ')' + (cfg.trackL9 ? '+trackL9' : ''),
    tier: dist.resolvedTier, cand: dist.entries.length, maxSigma: maxSigma,
  });
  return maxSigma;
}

/** skillOdds 시나리오 1건: 풀을 target 1개로 축소해 presentAugment의 스킬 지정을 실측 */
function mcSkillScenario(cfg) {
  const champ = byId(cfg.champ);
  const game = setupActiveRound(champ, cfg.seed, false, 0);
  const target = game.pool.find(function (a) { return a.apiName === cfg.target; });
  check(!!target, cfg.name + ': ' + cfg.target + '가 ' + cfg.champ + ' 풀에 없음');
  check(game.used.indexOf(cfg.target) === -1, cfg.name + ': target이 이미 노출됨 (시드 교체 필요)');
  if (!target) return 0;
  depleteAllExcept(game, cfg.target); // 리롤이 target만 뽑게 → 남은 무작위성은 스킬 지정뿐
  const dist = rerollDistribution(game, 0);
  check(dist.entries.length === 1 && dist.entries[0].aug.apiName === cfg.target,
    cfg.name + ': 단일 후보 축소 실패');
  const odds = skillOdds(game, target);
  for (const k in cfg.expectOdds) {
    check(Math.abs(odds[k] - cfg.expectOdds[k]) <= 1e-12,
      cfg.name + ': skillOdds.' + k + '=' + odds[k] + ' (기대 ' + cfg.expectOdds[k] + ')');
  }
  const res = runTrials(cfg.name, game, 0, N_MC);
  const pairs = ['Q', 'W', 'E', 'R'].map(function (k) {
    return { key: k, p: odds[k], count: res.skillCounts[k] };
  });
  const maxSigma = compareFreq(cfg.name, pairs, N_MC);
  mcRows.push({
    name: cfg.name, champ: cfg.champ, action: 'skill(' + cfg.mode + ')',
    tier: target.tier, cand: 4, maxSigma: maxSigma,
  });
  return maxSigma;
}

let mcMaxSigma = 0;
const t0 = Date.now();

// (G-AUTO 갱신: 종전 S3/S5 "황금 리롤 액션" 시나리오는 메커니즘 삭제로 "goldenChance를
//  크게 강제한 자동 발동 혼합 분포" 시나리오로 대체 — 판정 draw+상급 추출 경로의 4σ 실증.
//  S1/S2/S4/S6은 기본 goldenChance(0.04)로 돌아 혼합의 저확률 꼬리도 함께 검증된다.)
// S1 일반 리롤 기본 (Lux, 1라운드) + hitProbability 집합 대조
mcMaxSigma = Math.max(mcMaxSigma, mcAugScenario({
  name: 'S1-reroll-basic', champ: 'Lux', seed: 20260903, trackL9: false,
  roundsBefore: 0, slot: 0, hitProbe: true,
}));
// S2 일반 리롤 + trackL9 (MasterYi, 2라운드째 — 스킬 증강 1.5배 가중 경로)
mcMaxSigma = Math.max(mcMaxSigma, mcAugScenario({
  name: 'S2-reroll-trackL9', champ: 'MasterYi', seed: 777, trackL9: true,
  roundsBefore: 1, slot: 1, needsAbility: true,
}));
// S3 자동 황금 발동 혼합 (Garen, 실버/골드 화면 강제, g=0.3) + hitProbability 집합 대조
mcMaxSigma = Math.max(mcMaxSigma, mcAugScenario({
  name: 'S3-goldenmix', champ: 'Garen', seed: 424242, trackL9: false,
  roundsBefore: 0, slot: 0, goldenChance: 0.3, requireGolden: true, hitProbe: true,
}));
// S4 일반 리롤 후반 라운드 (Ahri, 3라운드째 — used 누적 상태)
mcMaxSigma = Math.max(mcMaxSigma, mcAugScenario({
  name: 'S4-reroll-late', champ: 'Ahri', seed: 31337, trackL9: false,
  roundsBefore: 2, slot: 2,
}));
// S5 자동 황금 발동 + trackL9 (Ashe, 2라운드째, g=0.3)
mcMaxSigma = Math.max(mcMaxSigma, mcAugScenario({
  name: 'S5-goldenmix-trackL9', champ: 'Ashe', seed: 9001, trackL9: true,
  roundsBefore: 1, slot: 1, goldenChance: 0.3, requireGolden: true,
}));
// S6 일반 리롤 폴백 — 슬롯 등급을 고갈시켜 타 등급 보충 경로의 확률 정합 검증
// (goldenChance=0: 폴백 base 경로를 순수하게 격리 — 혼합은 S1~S5가 담당)
mcMaxSigma = Math.max(mcMaxSigma, mcAugScenario({
  name: 'S6-reroll-fallback', champ: 'Amumu', seed: 555, trackL9: false,
  roundsBefore: 0, slot: 0, goldenChance: 0,
  prep: function (game) {
    const round = game.rounds[game.rounds.length - 1];
    const t = round.slots[0].tier;
    depleteTier(game, t);
    this.expectTier = FALLBACK_ORDER[t][0];
  },
}));
// S6 폴백 등급 확인 (prep의 this 바인딩 대신 명시 재검증)
{
  const g = setupActiveRound(byId('Amumu'), 555, false, 0);
  const t = g.rounds[0].slots[0].tier;
  depleteTier(g, t);
  const d = rerollDistribution(g, 0);
  check(d.resolvedTier === FALLBACK_ORDER[t][0],
    'S6: 폴백 resolvedTier=' + d.resolvedTier + ' (기대 ' + FALLBACK_ORDER[t][0] + ')');
}
// S7 skillOdds ③균등 + spellExclude (Yasuo × Specialized Recursion: Q·E 제외 → W/R 반반)
mcMaxSigma = Math.max(mcMaxSigma, mcSkillScenario({
  name: 'S7-skill-uniform', champ: 'Yasuo', seed: 121212, target: 'ARAM_SpecializedRecursion',
  mode: '③균등+exclude', expectOdds: { Q: 0, W: 0.5, E: 0, R: 0.5 },
}));
// S8 skillOdds ①pin 확정 (Lux × Dark Wind: Q 고정 → 빈도 1.0)
mcMaxSigma = Math.max(mcMaxSigma, mcSkillScenario({
  name: 'S8-skill-pin', champ: 'Lux', seed: 343434, target: 'DarkWind',
  mode: '①pin', expectOdds: { Q: 1, W: 0, E: 0, R: 0 },
}));

const mcElapsed = ((Date.now() - t0) / 1000).toFixed(1);

/* ================================================================== */
/* [7] 결정론 가드 — 같은 시드 100게임 이력 이중 실행 + 해시 고정          */
/* ================================================================== */
section('7. 결정론 가드 (100게임 이력 스냅샷)');

/**
 * 드로우 바이트 스냅샷 해시 (FNV-1a 32비트).
 * 엔진(draft.js)만 수정했는데 이 값이 바뀌면 시드 결정론 회귀다 — 수정 금지, 엔진을 고칠 것.
 * docs/data/augments.json·champions.json 갱신 시에는 바뀌는 것이 정상 —
 * 실패 메시지의 새 해시로 의도적으로 재고정하고 커밋 메시지에 데이터 갱신을 명기할 것.
 *
 * 재고정 이력:
 *  - 2026-09-03 '5aa8d647' → 재고정. 사유(정당한 이중 변경):
 *    ① 메커니즘 변경 — 황금 리롤 자동 발동(G-AUTO) 리워크로 rerollSlot이 판정 draw 1회를
 *       추가 소비 + 수동 goldenReroll 삭제로 이력 스크립트 자체가 바뀜 (raw/19)
 *    ② 데이터 갱신 — 풀 게이트 이식(enrich-augments 2.6: AD/크리 코어 10종·극악무도
 *       championExclude — research/data/class-tier-adjust.json confirmed)
 */
const HISTORY_HASH_PINNED = 'a9497399';

function fnv1a(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

function sig(a) {
  return a.apiName + (a.enhancedSkill ? ':' + a.enhancedSkill.key : '');
}

/** 게임 1판 자동 진행(리롤 조작은 시드 결정적) → 전체 이력 배열.
 *  G-AUTO 갱신: 수동 goldenReroll 단계 삭제 — 대신 goldenChance를 게임별로 0/0.04/1로
 *  순환시켜 미발동·기본·항상발동 경로를 모두 이력에 포함하고, 자동 발동 기록(round.golden)도
 *  해시 대상에 넣는다 (발동 판정 draw의 결정론 회귀 가드). */
function playHistory(gi) {
  const champ = CHAMPIONS[(gi * 37) % CHAMPIONS.length];
  const gc = [0, 0.04, 1][gi % 3];
  const g = newGame({ augments: AUGMENTS, champion: champ, seed: 90000 + gi * 101, trackL9: gi % 2 === 1, goldenChance: gc });
  const ctrl = createRng('hist-' + gi);
  const hist = [champ.id, 'g' + gc];
  for (let r = 0; r < 4; r++) {
    const round = nextRound(g);
    hist.push([round.tier, round.slots.map(sig)]);
    if (ctrl() < 0.5) {
      const si = Math.floor(ctrl() * round.slots.length);
      hist.push(['re' + si, sig(rerollSlot(g, si))]);
    }
    const cur = g.rounds[g.rounds.length - 1];
    hist.push(['au', cur.golden]); // 자동 황금 발동 슬롯 기록 (null = 미발동)
    hist.push(['pk', sig(pickAugment(g, Math.floor(ctrl() * cur.slots.length)))]);
  }
  return hist;
}

{
  const run1 = [];
  const run2 = [];
  for (let gi = 0; gi < 100; gi++) run1.push(playHistory(gi));
  for (let gi = 0; gi < 100; gi++) run2.push(playHistory(gi));
  const j1 = JSON.stringify(run1);
  check(j1 === JSON.stringify(run2), '결정론: 같은 시드 이중 실행 이력 불일치');
  const hash = fnv1a(j1);
  if (HISTORY_HASH_PINNED === 'PENDING') {
    console.log('  (해시 미고정 — 계산값 ' + hash + ' 을 HISTORY_HASH_PINNED에 고정하세요)');
    check(false, '결정론: HISTORY_HASH_PINNED 미고정 (계산값 ' + hash + ')');
  } else {
    check(hash === HISTORY_HASH_PINNED,
      '결정론: 이력 해시 ' + hash + ' ≠ 고정값 ' + HISTORY_HASH_PINNED
      + ' — 엔진만 바꿨다면 시드 결정론 회귀, 데이터 갱신이었다면 새 값으로 재고정');
  }
}

/* ---------------- 결과 요약 ---------------- */
console.log('\n몬테카를로 시나리오표 (N=' + N_MC + '/시나리오, ' + mcElapsed + 's):');
for (const r of mcRows) {
  console.log('  ' + r.name.padEnd(20) + ' ' + r.champ.padEnd(9) + ' ' + r.action.padEnd(16)
    + ' tier=' + String(r.tier).padEnd(10) + ' 후보=' + String(r.cand).padEnd(4)
    + ' maxσ=' + r.maxSigma.toFixed(2));
}
console.log('전체 최대 편차: ' + mcMaxSigma.toFixed(2) + 'σ (임계 4σ)');
console.log('통과 ' + passCount + ' / 실패 ' + failCount);
if (failCount > 0) {
  console.error('test-odds 실패');
  process.exit(1);
}
console.log('test-odds 통과');
