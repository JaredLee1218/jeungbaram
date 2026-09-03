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
 * ⚠ 근사: 챔피언별 풀 게이트(classRequired/championWhitelist 등)와 가중 추출(weightFor)은
 *   공식 확인 + 실측 통계 기반 근사다. 정확한 챔피언×증강 풀·가중치는 100% 서버 전용이라
 *   재현 불가 (research/AUGMENT-POOLS-STUDY.md §3, research/data/eligibility-notes.json).
 *   스킬 증강(category==='ability')은 제시 시 enhancedSkill(강화 대상 스킬)을 지정하는데,
 *   지정 순서는 ①spellPin(확정 매핑, rng 미소비) ②slot(고정 슬롯, rng 미소비)
 *   ③적격 스킬 중 무작위 — ③은 실제 지정 규칙이 비공개라서의 근사다 (STUDY §3-3,
 *   확정 매핑 근거: research/ABILITY-AUGMENT-DATA.md §4).
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
 *  - restrictions.classRequired → champion.tags와 교집합 1개 이상 필요
 *      (예: Mercy's Strike는 Support 전용 — 26.15 공식 버그픽스로 확인.
 *       근거: research/AUGMENT-POOLS-STUDY.md §3-1, research/data/eligibility-notes.json classBias)
 *  - restrictions.classExcluded → champion.tags와 교집합이 있으면 제외
 *  - restrictions.championWhitelist → champion.id가 목록에 있어야 함
 *      (예: Spin To Win — 위키의 적격 챔피언 명시 목록. 근거: STUDY §3-1)
 *  - restrictions.championExclude → champion.id가 목록에 있으면 제외
 *      (예: Smolder×Combusting Interest — 26.14 공식 버그픽스. 근거: STUDY §3-1)
 *  - restrictions.abilityProps → champion.abilityProps와 교집합 1개 이상 필요 (OR 조건)
 *  - restrictions.abilityPropsAll → **스킬 단위 AND**: champion.spells 중 props가
 *      요구 집합을 전부 포함하는 스킬이 1개 이상 필요
 *      (예: Tripleshot은 "대상 지정이면서 투사체"인 같은 스킬 하나 필요 → ['targeted','projectile']).
 *      spells[i].props가 없는 구스키마 데이터면 종전의 합집합(champion.abilityProps) 방식으로 폴백.
 * champion이 없으면(null) enabled 필터만 적용한다.
 * 입력 배열 순서를 보존한다(결정론에 중요).
 *
 * 근사: 신규 필드가 없는 증강은 종전과 동일하게 동작한다(방어적 하위 호환).
 * 스킬별 props 자체가 한국어 설명 키워드 기반 근사이므로(champions.json _note 참조)
 * 스킬 단위 AND 판정도 근사다. 근거: research/AUGMENT-POOLS-STUDY.md §3-1·§3-3.
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
    // 클래스 게이트 (DDragon tags 어휘: Marksman/Mage/Tank/Support/Fighter/Assassin)
    const tags = Array.isArray(champion.tags) ? champion.tags : [];
    if (Array.isArray(r.classRequired) && r.classRequired.length > 0) {
      const hasClass = r.classRequired.some(function (t) { return tags.indexOf(t) !== -1; });
      if (!hasClass) return false;
    }
    if (Array.isArray(r.classExcluded) && r.classExcluded.length > 0) {
      const hitExcluded = r.classExcluded.some(function (t) { return tags.indexOf(t) !== -1; });
      if (hitExcluded) return false;
    }
    // 챔피언 단위 화이트리스트/제외 (champion.id — DDragon id 어휘)
    if (Array.isArray(r.championWhitelist) && r.championWhitelist.length > 0) {
      if (r.championWhitelist.indexOf(champion.id) === -1) return false;
    }
    if (Array.isArray(r.championExclude) && r.championExclude.length > 0) {
      if (r.championExclude.indexOf(champion.id) !== -1) return false;
    }
    const props = champion.abilityProps || [];
    if (Array.isArray(r.abilityProps) && r.abilityProps.length > 0) {
      const hasCommon = r.abilityProps.some(function (p) { return props.indexOf(p) !== -1; });
      if (!hasCommon) return false;
    }
    if (Array.isArray(r.abilityPropsAll) && r.abilityPropsAll.length > 0) {
      // 스킬 단위 AND: props가 있는 스킬이 1개라도 있으면 스킬 단위로 판정,
      // 전부 없으면(구스키마) 종전 합집합 방식으로 폴백 (하위 호환)
      // spellExclude(스킬 슬롯 단위 게이트)에 걸린 스킬은 충족 후보에서 제외한다.
      const exKeys = (r.spellExclude && Array.isArray(r.spellExclude[champion.id]))
        ? r.spellExclude[champion.id]
        : [];
      const spells = Array.isArray(champion.spells) ? champion.spells : [];
      const spellsWithProps = spells.filter(function (s) {
        return s && Array.isArray(s.props) && exKeys.indexOf(s.key) === -1;
      });
      if (spellsWithProps.length > 0) {
        const anySpellHasAll = spellsWithProps.some(function (s) {
          return r.abilityPropsAll.every(function (p) { return s.props.indexOf(p) !== -1; });
        });
        if (!anySpellHasAll) return false;
      } else {
        const hasAll = r.abilityPropsAll.every(function (p) { return props.indexOf(p) !== -1; });
        if (!hasAll) return false;
      }
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
 * @param {boolean} [opts.trackL9] 진행도 트랙 Lv9 보정 (기본 false).
 *   근사: 켜면 스킬 증강(category==='ability') 추출 가중치를 WEIGHT_TRACK_L9_ABILITY(1.5)배 —
 *   실제 증가 폭은 비공개 (research/AUGMENT-POOLS-STUDY.md §3-2)
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
    trackL9: o.trackL9 === true,      // 진행도 트랙 Lv9 보정 (스킬 증강 가중치 ↑, 기본 off)
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

/**
 * 등급별 남은(미노출) 증강 수 — { silver, gold, prismatic }.
 * 순수 조회 (game 불변, rng 미소비). UI의 잔여 풀 표시("실버 n / 골드 m / 프리즘 k")용 export.
 */
export function remainingByTier(game) {
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
 * 근사: 가중 추출 계수 — 실제 가중치 수치는 서버 전용·비공개라 전부 추정 상수다.
 * Optimal/Viable/Average 3단(게임스컴 데브 2026 공개 강연, 수치 비공개)을
 * favored 2.0 / 기본 1.0 / disfavored 0.6 으로 근사.
 * 근거: research/AUGMENT-POOLS-STUDY.md §3-2, research/data/eligibility-notes.json classBias.
 */
export const WEIGHT_FAVORED = 2.0;
export const WEIGHT_DISFAVORED = 0.6;
/**
 * 근사: 진행도 트랙 레벨 9 보상은 스킬 증강 등장 확률을 올린다(증가 폭 비공개) — 1.5배로 근사.
 * 근거: research/AUGMENT-POOLS-STUDY.md §3-2, research/data/eligibility-notes.json abilityAugments.tierSystem.
 */
export const WEIGHT_TRACK_L9_ABILITY = 1.5;

/**
 * 증강 1개의 추출 가중치.
 *  기본 1.0
 *  × favoredClasses ∩ champion.tags 있으면 WEIGHT_FAVORED (2.0)
 *  × disfavoredClasses ∩ champion.tags 있으면 WEIGHT_DISFAVORED (0.6)
 *  × opts.trackL9 && category==='ability' 이면 WEIGHT_TRACK_L9_ABILITY (1.5)
 * 신규 필드가 없는 증강/챔피언은 1.0 (종전 균등 추출과 동일 — 하위 호환).
 * 근사: 계수는 전부 추정치 (위 상수 주석 참조).
 * @param {Object} aug 증강 객체
 * @param {Object|null} champion 챔피언 객체 (없으면 클래스 계수 미적용)
 * @param {Object} [opts] { trackL9: boolean }
 */
export function weightFor(aug, champion, opts) {
  let w = 1.0;
  const tags = (champion && Array.isArray(champion.tags)) ? champion.tags : [];
  if (tags.length > 0) {
    if (Array.isArray(aug.favoredClasses) && aug.favoredClasses.length > 0) {
      const fav = aug.favoredClasses.some(function (t) { return tags.indexOf(t) !== -1; });
      if (fav) w *= WEIGHT_FAVORED;
    }
    if (Array.isArray(aug.disfavoredClasses) && aug.disfavoredClasses.length > 0) {
      const dis = aug.disfavoredClasses.some(function (t) { return tags.indexOf(t) !== -1; });
      if (dis) w *= WEIGHT_DISFAVORED;
    }
  }
  if (opts && opts.trackL9 && aug.category === 'ability') {
    w *= WEIGHT_TRACK_L9_ABILITY;
  }
  return w;
}

/**
 * 지정 등급에서 미노출 증강 1개를 **가중 무작위**로 뽑는다.
 * 가중치는 weightFor(aug, game.champion, {trackL9}) — rng 1회로 누적 가중치를 스캔하므로
 * 시드 결정론이 유지되고, 가중치가 전부 같으면 종전 균등 추출과 동일한 인덱스를 낸다.
 * 그 등급이 고갈이면 fallbackOrder 순서로 다른 등급에서 보충한다(구현 보충 규칙 — 공식 아님).
 * 전 등급 고갈이면 null.
 * 근사: 가중치 계수는 전부 추정치 (weightFor 주석 참조 — research/AUGMENT-POOLS-STUDY.md §3-2).
 */
/**
 * 후보 분포 산출기 (단일 후보 산출기 — drawAugment와 확률 표시 UI가 공유해 드리프트 방지).
 * 지정 등급에서 미노출 후보와 가중치·정규화 확률을 계산한다. 그 등급이 고갈이면
 * fallbackOrder 순서로 다른 등급을 시도한다(drawAugment의 폴백 해소를 그대로 미러).
 * **순수 조회**: game을 변경하지 않고 rng(nextFloat)를 소비하지 않는다.
 *
 * entries는 game.pool 순서를 보존한다 — drawAugment의 rng 1회 누적 스캔 인덱스가
 * 종전 구현과 바이트 단위로 동일해야 하기 때문 (시드 결정론 회귀 가드: test-draft).
 * 가중치 합이 0 이하면 p를 균등(1/n)으로 채운다(drawAugment의 균등 폴백 미러).
 *
 * 근사: weight는 weightFor의 추정 상수(2.0/0.6/1.5) 기반 — 실제 가중치는 서버 전용.
 * 따라서 p는 "시뮬레이터 모델 기준" 확률이다 (weightFor 주석 참조).
 *
 * @param {Object} game 게임 상태 (불변 유지)
 * @param {string} tier 시작 등급 ('silver'|'gold'|'prismatic')
 * @param {Array<string>} [fallbackOrder] 고갈 시 보충 순서 (기본 FALLBACK_ORDER[tier])
 * @returns {{ resolvedTier: string|null, entries: Array<{aug: Object, weight: number, p: number}>, totalWeight: number }}
 *   전 등급 고갈 시 { resolvedTier: null, entries: [], totalWeight: 0 }
 */
export function drawDistribution(game, tier, fallbackOrder) {
  const used = {};
  for (let i = 0; i < game.used.length; i++) used[game.used[i]] = true;
  const order = [tier].concat(fallbackOrder || FALLBACK_ORDER[tier] || []);
  const wOpts = { trackL9: game.trackL9 === true };
  for (let t = 0; t < order.length; t++) {
    const entries = [];
    let total = 0;
    for (let i = 0; i < game.pool.length; i++) {
      const a = game.pool[i];
      if (a.tier === order[t] && !used[a.apiName]) {
        const w = weightFor(a, game.champion, wOpts);
        entries.push({ aug: a, weight: w, p: 0 });
        total += w; // 종전 drawAugment와 같은 순서(pool 순서)의 부동소수 합산 — 결정론 유지
      }
    }
    if (entries.length > 0) {
      if (total > 0) {
        for (let i = 0; i < entries.length; i++) entries[i].p = entries[i].weight / total;
      } else {
        for (let i = 0; i < entries.length; i++) entries[i].p = 1 / entries.length; // 균등 폴백 미러
      }
      return { resolvedTier: order[t], entries: entries, totalWeight: total };
    }
  }
  return { resolvedTier: null, entries: [], totalWeight: 0 };
}

function drawAugment(game, tier, fallbackOrder) {
  const dist = drawDistribution(game, tier, fallbackOrder);
  const entries = dist.entries;
  if (entries.length === 0) return null; // 전 등급 완전 고갈
  if (dist.totalWeight <= 0) {
    return entries[Math.floor(nextFloat(game) * entries.length)].aug; // 방어: 가중치 합 0이면 균등
  }
  // 가중 추출: rng 1회 → 누적 가중치 스캔 (entries가 pool 순서·동일 가중치라 종전과 바이트 동일)
  let r = nextFloat(game) * dist.totalWeight;
  for (let i = 0; i < entries.length; i++) {
    r -= entries[i].weight;
    if (r < 0) return entries[i].aug;
  }
  return entries[entries.length - 1].aug; // 부동소수 잔여 방어
}

/** 스킬 증강이 아닌 경우 그대로, 스킬 증강이면 enhancedSkill 지정용 기본 스킬 키 */
const DEFAULT_SKILL_KEYS = ['Q', 'W', 'E', 'R'];

/**
 * 증강을 슬롯에 "제시"할 항목으로 변환.
 * category==='ability'(스킬 증강)면 강화 대상 스킬을 지정해 enhancedSkill: {key, nameKo}를
 * 부여한 얕은 복사본을 반환한다 (풀의 원본 증강 객체는 불변 유지).
 * 대상 스킬 지정은 아래 우선순위 ①→②→③을 따른다. ③(무작위)에서는
 * restrictions.abilityPropsAll(requiredProps)을 충족하는 스킬 중 rng로 선택하고,
 * requiredProps가 비어 있으면 전 스킬(Q/W/E/R) 중 무작위.
 * spells[i].props가 없는 구스키마 데이터면 전 스킬을 후보로 폴백.
 * ③은 rng(nextFloat)를 사용하고 ①·②는 rng를 소비하지 않는다 — 어느 쪽이든 시드 결정론 유지.
 *
 * 추가 restrictions 연동 (augments.json F2 스키마와의 계약) — 지정 우선순위 ①→②→③:
 *  ① restrictions.spellPin ({챔피언id: 'Q'|'W'|'E'|'R'}): 챔피언×증강 확정 매핑
 *    (research/data/ability-augment-map.json의 skill 명시분) — rng를 쓰지 않고
 *    그 스킬로 고정한다. slot보다 우선.
 *  ② restrictions.slot ('Q'|'W'|'E'|'R'): 슬롯 고정형 증강(예: Bread 3종) —
 *    rng를 쓰지 않고 해당 스킬을 그대로 지정한다 (공식 — 스킬 지정이 없는 고정 슬롯 전신).
 *  ③ requiredProps(abilityPropsAll) 충족 스킬 중 rng 무작위 (spellExclude 제외).
 *  - restrictions.spellExclude ({챔피언id: [스킬키...]}): 해당 챔피언의 그 스킬은
 *    강화 대상 후보에서 제외한다 (공식 버그픽스 기반 — 예: 야스오 E×Specialized Recursion).
 *
 * 방어(데이터 오류 대비): spellPin이 없거나(구스키마) 값이 Q/W/E/R 밖이면 무시하고
 * 종전 동작(②→③). pin된 스킬이 같은 챔피언의 spellExclude에도 들어 있으면 데이터
 * 모순인데, exclude(공식 버그픽스 근거)를 우선해 pin을 무시하고 ②를 건너뛰어 ③ 무작위
 * 지정으로 내려간다 (③은 excludedKeys를 이미 제외하므로 exclude가 항상 지켜짐).
 *
 * 근사: 실제 게임의 증강×스킬 지정 규칙은 비공개(시스템이 조합을 사전 생성) —
 * 확정 매핑(spellPin) 밖에서는 "적격 스킬 중 무작위"로 근사한다.
 * 근거: research/AUGMENT-POOLS-STUDY.md §3-3, research/ABILITY-AUGMENT-DATA.md §4,
 * research/data/eligibility-notes.json abilityAugments.tierSystem.
 */
/**
 * 스킬 지정 규칙 ①②③의 해소기 (presentAugment와 skillOdds가 공유 — 드리프트 방지).
 * **순수 함수**: game 불변, rng 미소비. 우선순위·충돌 정책은 presentAugment 주석과 동일:
 *  ① spellPin 확정 매핑 (pin·exclude 충돌 시 무효화 → ② 건너뛰고 ③)
 *  ② slot 고정형
 *  ③ 적격 스킬(spellExclude 제외, abilityPropsAll 충족) 후보 목록 — 실제 추출은 호출부의 rng 몫.
 * @returns {{ fixedKey: string|null, cands: Array<{key, nameKo}>|null }}
 *   fixedKey가 있으면 결정적 지정(①②), 없으면 cands 중 무작위(③)가 계약.
 */
function resolveSkillTargets(game, aug) {
  const r = aug.restrictions || {};
  const champ = game.champion;
  const spells = (champ && Array.isArray(champ.spells)) ? champ.spells : null;

  // 스킬 슬롯 단위 제외 목록 (이 챔피언에 해당하는 키만) — ①·③에서 공용
  const excludedKeys = (champ && r.spellExclude && Array.isArray(r.spellExclude[champ.id]))
    ? r.spellExclude[champ.id]
    : [];

  // ① 챔피언×증강 확정 매핑 (spellPin): rng 소비 없이 그 스킬로 고정 — slot보다 우선.
  //    방어: 필드 부재/키 이상은 무시(구스키마 하위 호환). pin이 spellExclude와 충돌하면
  //    데이터 오류 — exclude를 우선해 pin을 무시하고 ②도 건너뛰어 ③으로 간다(계약 정책).
  const pinnedKey = (champ && r.spellPin && typeof r.spellPin[champ.id] === 'string')
    ? r.spellPin[champ.id]
    : null;
  const pinConflicts = pinnedKey !== null && excludedKeys.indexOf(pinnedKey) !== -1;
  if (pinnedKey !== null && !pinConflicts && DEFAULT_SKILL_KEYS.indexOf(pinnedKey) !== -1) {
    return { fixedKey: pinnedKey, cands: null };
  }

  // ② 슬롯 고정형 (예: Bread And Butter = Q): rng 소비 없이 결정적으로 지정
  //    (pin·exclude 충돌로 pin이 무효화된 경우에는 ②를 건너뛰고 ③으로 — 위 주석 참조)
  if (!pinConflicts && typeof r.slot === 'string' && DEFAULT_SKILL_KEYS.indexOf(r.slot) !== -1) {
    return { fixedKey: r.slot, cands: null };
  }

  // ③ 적격 스킬 후보 (spellExclude 제외) — 무작위 추출 자체는 호출부(presentAugment)가 수행
  const required = Array.isArray(r.abilityPropsAll) ? r.abilityPropsAll : [];
  const notExcluded = function (s) { return !s || excludedKeys.indexOf(s.key) === -1; };
  let cands;
  if (spells && spells.length > 0) {
    if (required.length > 0) {
      cands = spells.filter(function (s) {
        return s && Array.isArray(s.props) && notExcluded(s)
          && required.every(function (p) { return s.props.indexOf(p) !== -1; });
      });
      if (cands.length === 0) cands = spells.filter(notExcluded); // 폴백: 스킬별 props 미비(구스키마) → 제외 외 전 스킬
    } else {
      cands = spells.filter(notExcluded);
    }
    if (cands.length === 0) cands = spells.slice(); // 방어: 제외로 전 스킬이 비면 전 스킬 폴백
  } else {
    // 챔피언 미지정/스킬 데이터 없음: 키만으로 후보 구성
    cands = DEFAULT_SKILL_KEYS.map(function (k) { return { key: k, nameKo: null }; });
  }
  return { fixedKey: null, cands: cands };
}

function presentAugment(game, aug) {
  if (aug.category !== 'ability') return aug;
  const champ = game.champion;
  const spells = (champ && Array.isArray(champ.spells)) ? champ.spells : null;

  /** 스킬 키를 rng 소비 없이 결정적으로 지정 (①·② 공용 — nameKo는 champion.spells에서 조회) */
  function fixSkill(key) {
    let fixed = null;
    if (spells) {
      for (let i = 0; i < spells.length; i++) {
        if (spells[i] && spells[i].key === key) { fixed = spells[i]; break; }
      }
    }
    return Object.assign({}, aug, {
      enhancedSkill: { key: key, nameKo: (fixed && fixed.nameKo !== undefined) ? fixed.nameKo : null },
    });
  }

  const target = resolveSkillTargets(game, aug);
  if (target.fixedKey !== null) return fixSkill(target.fixedKey); // ①② — rng 미소비

  // ③ 적격 스킬 중 rng 무작위 (후보 목록은 resolveSkillTargets와 공유 — 종전과 동일 순서)
  const cands = target.cands;
  const s = cands[Math.floor(nextFloat(game) * cands.length)];
  return Object.assign({}, aug, {
    enhancedSkill: { key: s.key, nameKo: (s.nameKo === undefined ? null : s.nameKo) },
  });
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

  // 2) 해당 등급에서 3개 가중 무작위 제시 (고갈 시 다른 등급 보충 — drawAugment 내부 FALLBACK_ORDER)
  const slots = [];
  for (let k = 0; k < 3; k++) {
    const aug = drawAugment(game, tier);
    if (!aug) break; // 전 등급 완전 고갈: 남은 만큼만 제시
    game.used.push(aug.apiName);
    slots.push(presentAugment(game, aug)); // 스킬 증강이면 enhancedSkill 부여 (rng 사용)
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
  const presented = presentAugment(game, aug); // 스킬 증강이면 enhancedSkill 부여 (rng 사용)
  round.slots[i] = presented;
  return presented;
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
  const presented = presentAugment(game, aug); // 스킬 증강이면 enhancedSkill 부여 (rng 사용)
  round.slots[i] = presented;
  return presented;
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

/* ------------------------------------------------------------------ */
/* 확률 조회 API (전부 순수 조회 — game 불변, rng(nextFloat) 미소비)      */
/* ------------------------------------------------------------------ */

/**
 * 슬롯 리롤 분포: rerollSlot이 실제로 뽑을 후보·확률을 미리 계산한다.
 * rerollSlot과 동일하게 카드 자신의 tier(round.slots[i].tier — 폴백·황금 리롤로
 * 라운드 등급과 다를 수 있음) + FALLBACK_ORDER로 drawDistribution을 래핑.
 * rerolled[i]/goldenUsed 소진 여부는 검사하지 않는다(순수 조회) — 소진 처리는 app.js 몫.
 * @returns drawDistribution 반환형 { resolvedTier, entries: [{aug, weight, p}], totalWeight }
 */
export function rerollDistribution(game, slotIndex) {
  const round = mustActiveRound(game);
  mustSlot(round, slotIndex);
  const current = round.slots[slotIndex];
  return drawDistribution(game, current.tier);
}

/**
 * 황금 리롤 분포: goldenReroll이 실제로 뽑을 후보·확률을 미리 계산한다.
 * goldenReroll과 동일하게 TIER_UP[현재 tier] + FALLBACK_ORDER_UPGRADE로 래핑.
 * goldenUsed 소진 여부는 검사하지 않는다(순수 조회).
 * @returns drawDistribution 반환형 { resolvedTier, entries: [{aug, weight, p}], totalWeight }
 */
export function goldenDistribution(game, slotIndex) {
  const round = mustActiveRound(game);
  mustSlot(round, slotIndex);
  const current = round.slots[slotIndex];
  const upTier = TIER_UP[current.tier] || current.tier;
  return drawDistribution(game, upTier, FALLBACK_ORDER_UPGRADE[current.tier]);
}

/**
 * 목표 집합 적중 확률: 분포 entries 중 predicate에 맞는 항목의 p 합.
 * @param {Object} dist drawDistribution/rerollDistribution/goldenDistribution 결과
 * @param {Set<string>|Function} predicate apiName Set 또는 술어 함수 (aug) => boolean
 * @returns {number} 0~1 (빈 분포·무적중이면 0)
 */
export function hitProbability(dist, predicate) {
  if (!dist || !Array.isArray(dist.entries)) return 0;
  const test = (typeof predicate === 'function')
    ? predicate
    : function (a) { return !!(predicate && typeof predicate.has === 'function' && predicate.has(a.apiName)); };
  let p = 0;
  for (let i = 0; i < dist.entries.length; i++) {
    if (test(dist.entries[i].aug)) p += dist.entries[i].p;
  }
  return p;
}

/**
 * 스킬 증강의 강화 대상 스킬 배정 분포 — presentAugment의 ①②③ 규칙(resolveSkillTargets
 * 공유)을 확률로 미러한다. 순수 조회 (rng 미소비).
 *  ①spellPin/②slot(pin·exclude 충돌 시 ③ 강등 예외 포함) → 해당 키 1.0.
 *  ③ 적격 스킬 후보 중 균등 1/|cands|.
 * 근사: ③의 균등 가정은 실제 지정 규칙이 비공개라서의 근사다 (presentAugment 주석 참조).
 * @param {Object} game 게임 상태 (champion의 spells/spellExclude/spellPin 평가에 사용)
 * @param {Object} aug 증강 객체 — category!=='ability'면 전부 0
 * @returns {{ Q: number, W: number, E: number, R: number }}
 */
export function skillOdds(game, aug) {
  const odds = { Q: 0, W: 0, E: 0, R: 0 };
  if (!aug || aug.category !== 'ability') return odds;
  const target = resolveSkillTargets(game, aug);
  if (target.fixedKey !== null) {
    odds[target.fixedKey] = 1; // ①② 결정적 (fixedKey는 DEFAULT_SKILL_KEYS 검증 통과분)
    return odds;
  }
  const cands = target.cands;
  const each = 1 / cands.length; // 근사: ③ 균등 가정 (presentAugment의 rng 균등 추출 미러)
  for (let i = 0; i < cands.length; i++) {
    const k = cands[i] && cands[i].key;
    if (odds[k] !== undefined) odds[k] += each; // 방어: Q/W/E/R 밖 키는 표시 대상 아님
  }
  return odds;
}
