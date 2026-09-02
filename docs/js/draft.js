/**
 * docs/js/draft.js — 증바람(ARAM: Mayhem) 드래프트 엔진
 * 순수 로직 모듈: DOM 접근 금지. 브라우저 <script type="module">와 Node v14(.mjs/ESM) 겸용.
 *
 * 구현 근거 (research/raw/01-mode-mechanics.md §1~2, 교차 검증됨):
 *  - 증강 선택은 레벨 3 / 7 / 11 / 15, 총 4라운드. 매 라운드 3개 중 1개 선택.
 *  - 매 라운드 등급(실버/골드/프리즘) 1개를 무작위로 롤하고, 화면의 3개는 모두 그 등급.
 *  - 제약: 1라운드와 2라운드가 둘 다 실버일 수는 없음
 *    → 2라운드 롤 결과가 실버인데 1라운드가 실버였으면 실버를 제외하고 재롤.
 *  - 슬롯(카드)별 최대 1회 리롤, 같은 등급의 다른 증강으로 교체 (한 화면 최대 6개 노출).
 *  - 황금 리롤: 사용 시 해당 슬롯을 한 단계 높은 등급의 증강으로 교체 (실버→골드, 골드→프리즘).
 *  - 한 번이라도 노출(제시/리롤 포함)되었거나 선택된 증강은 같은 게임에서 다시 등장하지 않음.
 *
 * ⚠ 근사: 황금 리롤의 보유·사용 가능 조건은 단순화했다. 실제 게임에서는 진행도 트랙
 *   보상으로 해금한 플레이어가 "실버/골드 등급이 제시되는 화면"에서 일정 확률(비공개)로
 *   받는 소모품이다. 본 엔진은 (1) 게임당 1회 항상 보유, (2) 프리즘 화면에서도 사용 가능
 *   (이때 프리즘 유지)으로 근사한다 — 등장 확률이 비공개라 시뮬레이터에서는 결정적
 *   보유가 재현성에 유리하기 때문.
 *
 * ⚠ 근사: 등급 확률(tierWeights)은 라이엇이 공식 공개한 값이 없음.
 *   기본값 { silver: 0.45, gold: 0.35, prismatic: 0.20 } 은 **추정치**이며 패치로 조정되는 값임
 *   (V25.23에서 "초반 실버 빈도 하향" 조정 이력 존재).
 *
 * ⚠ 근사: 풀 고갈 처리(공식 규칙 아님, 구현 편의상의 보충 규칙):
 *   같은 등급의 남은 증강이 부족하면 남은 것으로 먼저 채우고,
 *   그래도 모자라면 다른 등급에서 보충한다. 보충 순서는 아래 FALLBACK_ORDER 참조.
 *
 * 결정론: 같은 seed + 같은 순서의 함수 호출 = 항상 같은 결과 (공유 URL 재현용).
 * 게임 상태는 JSON 직렬화 가능한 plain object. 증강 객체는 불변으로 취급하며
 * 내부 비교는 전부 apiName 문자열 기준이므로 JSON.parse(JSON.stringify(game))로
 * 복원한 상태에서 이어서 호출해도 동일하게 진행된다.
 */

/** 라운드별 레벨 (칼바람은 3레벨 시작 → 첫 선택이 레벨 3) */
export const ROUND_LEVELS = [3, 7, 11, 15];

/** 등급 목록 (낮은 순) */
export const TIERS = ['silver', 'gold', 'prismatic'];

/** 등급 확률 기본값 — 근사: 추정치 (공식 미공개, 패치마다 조정될 수 있음) */
export const DEFAULT_TIER_WEIGHTS = { silver: 0.45, gold: 0.35, prismatic: 0.20 };

/** 황금 리롤 등급 상승 매핑 (프리즘은 프리즘 유지) */
const TIER_UP = { silver: 'gold', gold: 'prismatic', prismatic: 'prismatic' };

/**
 * 근사: 풀 고갈 시 다른 등급에서 보충하는 순서 (공식 규칙 아님 — 구현 보충 규칙.
 * 실제 게임은 풀 고갈 상황의 동작이 문서화되어 있지 않음).
 * 일반 제시/리롤: 가까운 등급 우선, 등거리면 낮은 등급 우선.
 */
const FALLBACK_ORDER = {
  silver: ['gold', 'prismatic'],
  gold: ['silver', 'prismatic'],
  prismatic: ['gold', 'silver'],
};

/**
 * 근사: 황금 리롤 전용 보충 순서 (공식 규칙 아님 — 구현 보충 규칙).
 * 상승이 목적이므로 위 등급을 먼저, 다음으로 현재 등급 유지, 마지막에 하위 등급.
 * drawAugment의 시도 순서는 [상승 목표 등급].concat(이 목록)이 된다:
 *  - silver 슬롯: gold → prismatic → silver
 *  - gold 슬롯: prismatic → gold → silver
 *  - prismatic 슬롯: prismatic → gold → silver
 */
const FALLBACK_ORDER_UPGRADE = {
  silver: ['prismatic', 'silver'],
  gold: ['gold', 'silver'],
  prismatic: ['gold', 'silver'],
};

/* ------------------------------------------------------------------ */
/* RNG (mulberry32, 시드 가능)                                          */
/* ------------------------------------------------------------------ */

/**
 * 시드(숫자 또는 문자열)를 32비트 부호 없는 정수로 변환.
 * 문자열은 FNV-1a 해시. null/undefined는 호출부에서 처리.
 */
function hashSeed(seed) {
  if (typeof seed === 'number' && Number.isFinite(seed)) {
    return seed >>> 0;
  }
  const s = String(seed);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * mulberry32 한 스텝: 이전 상태(uint32)를 받아 { state, value } 반환.
 * 상태를 순수 값으로 주고받으므로 게임 상태(JSON)에 그대로 저장 가능.
 */
function mulberry32Step(state) {
  const a = (state + 0x6d2b79f5) >>> 0;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { state: a, value };
}

/**
 * 시드 가능한 RNG 팩토리. 반환 함수는 호출마다 [0, 1) 값을 낸다.
 * 같은 seed로 만든 RNG는 항상 같은 수열을 낸다.
 */
export function createRng(seed) {
  let state = hashSeed(seed === undefined || seed === null ? 0 : seed);
  return function rng() {
    const r = mulberry32Step(state);
    state = r.state;
    return r.value;
  };
}

/** 게임 상태에 내장된 RNG를 한 스텝 진행시키고 [0,1) 값을 반환 (상태는 game.rngState에 저장) */
function nextFloat(game) {
  const r = mulberry32Step(game.rngState);
  game.rngState = r.state;
  return r.value;
}

/* ------------------------------------------------------------------ */
/* 챔피언 필터                                                          */
/* ------------------------------------------------------------------ */

/**
 * enabled + restrictions를 champion 속성과 대조해 이 챔피언이 받을 수 있는 증강만 남긴다.
 *  - enabled === false → 제외
 *  - restrictions.rangedOnly → champion.ranged 필요
 *  - restrictions.meleeOnly → champion.ranged가 아니어야 함
 *  - restrictions.requiresMana → champion.usesMana 필요
 *  - restrictions.abilityProps → champion.abilityProps와 교집합 1개 이상 필요 (OR 조건)
 *  - restrictions.abilityPropsAll → champion.abilityProps에 전부 포함 필요 (AND 조건.
 *      예: Tripleshot은 "대상 지정 + 투사체" 스킬이 필요 → ['targeted','projectile'])
 * champion이 없으면(null) enabled 필터만 적용한다.
 * 입력 배열 순서를 보존한다(결정론에 중요).
 *
 * 근사: 실제 게임의 스킬 증강 필터는 "같은 스킬 하나"가 조건을 모두 만족해야 하지만
 * (예: Tripleshot = 대상 지정이면서 투사체인 스킬), champion.abilityProps는 챔피언의
 * 전 스킬 속성 합집합이라 스킬 단위 결합 판정은 불가능하다. abilityPropsAll(AND)은
 * 필요조건 근사이며, 서로 다른 스킬이 속성을 하나씩 나눠 가진 챔피언은 과잉 포함될 수 있다.
 */
export function eligibleAugments(augments, champion) {
  if (!Array.isArray(augments)) throw new Error('augments 배열이 필요합니다.');
  return augments.filter(function (a) {
    if (a.enabled === false) return false;
    const r = a.restrictions;
    if (!r) return true;
    if (!champion) return true; // 챔피언 미지정 시 제한 평가 불가 → 통과
    if (r.rangedOnly && !champion.ranged) return false;
    if (r.meleeOnly && champion.ranged) return false;
    if (r.requiresMana && !champion.usesMana) return false;
    const props = champion.abilityProps || [];
    if (Array.isArray(r.abilityProps) && r.abilityProps.length > 0) {
      const hasCommon = r.abilityProps.some(function (p) { return props.indexOf(p) !== -1; });
      if (!hasCommon) return false;
    }
    if (Array.isArray(r.abilityPropsAll) && r.abilityPropsAll.length > 0) {
      const hasAll = r.abilityPropsAll.every(function (p) { return props.indexOf(p) !== -1; });
      if (!hasAll) return false;
    }
    return true;
  });
}

/* ------------------------------------------------------------------ */
/* 게임 상태                                                            */
/* ------------------------------------------------------------------ */

/**
 * 새 게임 상태 생성.
 * @param {Object} opts
 * @param {Array}  opts.augments   augments.json의 augments 배열
 * @param {Object} [opts.champion] champions.json의 챔피언 1명 (없으면 필터 생략)
 * @param {number|string} [opts.seed] 시드 (없으면 무작위 생성 — 공유 URL용으로는 반드시 지정 권장)
 * @param {Object} [opts.tierWeights] 등급 확률 재정의 (기본값은 추정치 DEFAULT_TIER_WEIGHTS)
 * @returns JSON 직렬화 가능한 plain object 게임 상태
 */
export function newGame(opts) {
  const o = opts || {};
  if (!Array.isArray(o.augments)) throw new Error('augments 배열이 필요합니다.');
  const seed = (o.seed === undefined || o.seed === null)
    ? Math.floor(Math.random() * 4294967296) // 시드 미지정 시 1회 무작위 생성 후 상태에 기록(이후는 결정적)
    : o.seed;
  const champion = o.champion || null;
  return {
    seed: seed,                       // 원본 시드 (공유 URL 재현용)
    rngState: hashSeed(seed),         // RNG 내부 상태 (uint32, 호출마다 갱신)
    tierWeights: Object.assign({}, DEFAULT_TIER_WEIGHTS, o.tierWeights || {}),
    champion: champion,               // 전달받은 챔피언 객체 그대로 (plain object)
    pool: eligibleAugments(o.augments, champion), // 이 챔피언이 받을 수 있는 전체 증강 풀
    rounds: [],                       // 라운드 이력: {level, tier, slots, rerolled, golden, pickedIndex}
    used: [],                         // 게임 내 노출된 모든 증강 apiName (재등장 금지 판정용)
    picked: [],                       // 선택 확정된 증강 객체들
    goldenUsed: false,                // 황금 리롤 사용 여부 (게임당 1회)
    finished: false,                  // 4라운드 선택 완료 여부
  };
}

/** 진행 중(아직 선택하지 않은) 라운드를 반환. 없으면 null. */
function activeRound(game) {
  const last = game.rounds[game.rounds.length - 1];
  if (!last || last.pickedIndex !== null) return null;
  return last;
}

/** 진행 중 라운드가 반드시 있어야 하는 API용 가드 */
function mustActiveRound(game) {
  const round = activeRound(game);
  if (!round) throw new Error('진행 중인 라운드가 없습니다. nextRound(game)를 먼저 호출하세요.');
  return round;
}

/** 슬롯 인덱스 가드 */
function mustSlot(round, i) {
  if (!Number.isInteger(i) || i < 0 || i >= round.slots.length) {
    throw new Error('잘못된 슬롯 인덱스입니다: ' + i);
  }
}

/** 등급별 남은(미노출) 증강 수 */
function remainingByTier(game) {
  const used = {};
  for (let i = 0; i < game.used.length; i++) used[game.used[i]] = true;
  const counts = { silver: 0, gold: 0, prismatic: 0 };
  for (let i = 0; i < game.pool.length; i++) {
    const a = game.pool[i];
    if (!used[a.apiName] && counts[a.tier] !== undefined) counts[a.tier]++;
  }
  return counts;
}

/** 후보 등급 중 가중치 비례 무작위 선택 (가중치 합이 0이면 균등) */
function weightedTierPick(game, candidates, weights) {
  let total = 0;
  for (let i = 0; i < candidates.length; i++) total += weights[candidates[i]] || 0;
  if (total <= 0) {
    return candidates[Math.floor(nextFloat(game) * candidates.length)];
  }
  let r = nextFloat(game) * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[candidates[i]] || 0;
    if (r < 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

/**
 * 지정 등급에서 미노출 증강 1개를 무작위로 뽑는다.
 * 그 등급이 고갈이면 fallbackOrder 순서로 다른 등급에서 보충한다(구현 보충 규칙 — 공식 아님).
 * 전 등급 고갈이면 null.
 */
function drawAugment(game, tier, fallbackOrder) {
  const used = {};
  for (let i = 0; i < game.used.length; i++) used[game.used[i]] = true;
  const order = [tier].concat(fallbackOrder || FALLBACK_ORDER[tier] || []);
  for (let t = 0; t < order.length; t++) {
    const cands = [];
    for (let i = 0; i < game.pool.length; i++) {
      const a = game.pool[i];
      if (a.tier === order[t] && !used[a.apiName]) cands.push(a);
    }
    if (cands.length > 0) {
      return cands[Math.floor(nextFloat(game) * cands.length)];
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* 드래프트 진행 API                                                    */
/* ------------------------------------------------------------------ */

/**
 * 라운드 시작: 등급 1개를 롤하고 그 등급에서 3개를 무작위 제시.
 *  - 1·2라운드 모두 실버 금지: 2라운드 롤이 실버이고 1라운드가 실버였으면 실버 제외 재롤.
 *  - 이미 노출/선택된 증강은 제외.
 *  - 같은 등급 풀이 3개 미만이면 남은 것으로 채우고, 모자라면 다른 등급에서 보충(FALLBACK_ORDER).
 * @returns {Object} { level, tier, slots: [augment x3], rerolled: [false x3], golden: null, pickedIndex: null }
 */
export function nextRound(game) {
  if (game.finished) throw new Error('게임이 이미 종료되었습니다 (4라운드 선택 완료).');
  if (activeRound(game)) throw new Error('현재 라운드의 증강을 먼저 선택하세요 (pickAugment).');
  const roundIndex = game.rounds.length;
  if (roundIndex >= ROUND_LEVELS.length) throw new Error('모든 라운드가 이미 진행되었습니다.');

  // 1) 등급 롤 — 남은 증강이 1개 이상인 등급만 후보로 (완전 고갈 등급은 롤하지 않음)
  const counts = remainingByTier(game);
  let candidates = TIERS.filter(function (t) { return counts[t] > 0; });
  if (candidates.length === 0) candidates = TIERS.slice(); // 풀 전체 고갈: 형식상 롤 (슬롯이 비게 됨)

  let tier = weightedTierPick(game, candidates, game.tierWeights);

  // 제약: 1·2라운드가 둘 다 실버일 수 없음 → 실버 제외 재롤
  if (roundIndex === 1 && game.rounds[0].tier === 'silver' && tier === 'silver') {
    const noSilver = candidates.filter(function (t) { return t !== 'silver'; });
    if (noSilver.length > 0) {
      tier = weightedTierPick(game, noSilver, game.tierWeights);
    }
    // noSilver가 비면(실버 외 전부 고갈) 어쩔 수 없이 실버 유지 — 보충 규칙상 극단 케이스
  }

  // 2) 해당 등급에서 3개 무작위 제시 (고갈 시 다른 등급 보충 — drawAugment 내부 FALLBACK_ORDER)
  const slots = [];
  for (let k = 0; k < 3; k++) {
    const aug = drawAugment(game, tier);
    if (!aug) break; // 전 등급 완전 고갈: 남은 만큼만 제시
    game.used.push(aug.apiName);
    slots.push(aug);
  }

  const round = {
    level: ROUND_LEVELS[roundIndex],
    tier: tier,
    slots: slots,
    rerolled: slots.map(function () { return false; }),
    golden: null,       // 황금 리롤이 적용된 슬롯 인덱스 (없으면 null)
    pickedIndex: null,  // 선택 확정된 슬롯 인덱스 (null = 진행 중)
  };
  game.rounds.push(round);
  return round;
}

/**
 * 슬롯별 1회 리롤: 슬롯 i를 같은 등급의 다른 증강으로 교체.
 * 근사: 황금 리롤로 등급이 오른 슬롯은 오른 등급 기준으로 리롤한다 — 황금 리롤과
 * 일반 리롤의 상호작용 순서는 공식 문서에 없어(모호) 구현 판단.
 * 같은 등급 고갈 시 FALLBACK_ORDER로 보충. 전체 고갈 시 기존 증강 유지(리롤 횟수는 소모).
 * @returns 교체된(또는 유지된) 증강
 */
export function rerollSlot(game, i) {
  const round = mustActiveRound(game);
  mustSlot(round, i);
  if (round.rerolled[i]) throw new Error('이 슬롯은 이미 리롤했습니다 (슬롯당 1회).');
  round.rerolled[i] = true;
  const current = round.slots[i];
  const aug = drawAugment(game, current.tier);
  if (!aug) return current; // 풀 완전 고갈: 교체 불가, 기존 유지
  game.used.push(aug.apiName);
  round.slots[i] = aug;
  return aug;
}

/**
 * 황금 리롤: 슬롯 i를 한 단계 높은 등급의 증강으로 교체 (실버→골드, 골드→프리즘).
 * 근사: 실제 게임에서는 진행도 트랙 해금 후 실버/골드 화면에서 확률적으로 받는
 * 소모품이지만, 본 엔진은 "게임당 1회 항상 보유 + 프리즘 화면에서도 사용 가능
 * (프리즘 유지)"으로 단순화한다 (파일 상단 헤더 참조).
 * 상위 등급 고갈 시 FALLBACK_ORDER_UPGRADE(위 등급 → 현재 등급 → 하위 등급)로 보충.
 * 슬롯별 일반 리롤 횟수와는 별개로 카운트된다.
 * @returns 교체된(또는 유지된) 증강
 */
export function goldenReroll(game, i) {
  const round = mustActiveRound(game);
  mustSlot(round, i);
  if (game.goldenUsed) throw new Error('황금 리롤은 게임당 1회만 사용할 수 있습니다.');
  game.goldenUsed = true;
  round.golden = i;
  const current = round.slots[i];
  const upTier = TIER_UP[current.tier] || current.tier;
  const aug = drawAugment(game, upTier, FALLBACK_ORDER_UPGRADE[current.tier]);
  if (!aug) return current; // 풀 완전 고갈: 교체 불가, 기존 유지
  game.used.push(aug.apiName);
  round.slots[i] = aug;
  return aug;
}

/**
 * 선택 확정: 현재 라운드의 슬롯 i 증강을 game.picked에 추가.
 * 4개 선택이 끝나면 game.finished = true.
 * @returns 선택된 증강
 */
export function pickAugment(game, i) {
  const round = mustActiveRound(game);
  mustSlot(round, i);
  round.pickedIndex = i;
  const aug = round.slots[i];
  game.picked.push(aug);
  if (game.picked.length >= ROUND_LEVELS.length) game.finished = true;
  return aug;
}
