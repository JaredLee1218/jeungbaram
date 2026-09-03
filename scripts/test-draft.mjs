/**
 * scripts/test-draft.mjs — docs/js/draft.js 유닛 체크 (Node v14 호환)
 * 실행: node scripts/test-draft.mjs   (실패 시 exit 1)
 *
 * 합성 증강 fixture 30개(실버 12 / 골드 10 / 프리즘 8)로 검증:
 *  [1] 4라운드 진행 (레벨 3/7/11/15, 3슬롯, finished 전이)
 *  [2] 등급 규칙 (1·2라운드 둘 다 실버 금지, 화면 3개 동일 등급, 3등급 모두 등장)
 *  [3] 리롤 1회 제한 + 황금 리롤 자동 발동 (G-AUTO — research/raw/19-golden-reroll.md:
 *      실버/골드 화면에서 확률 goldenChance로 리롤이 화면 등급+1로 상승, 화면당 최대 1회,
 *      프리즘 화면 무발동. 구 "게임당 1회 수동 goldenReroll" 케이스는 메커니즘 변경으로 대체)
 *  [4] 중복 금지 (게임 내 노출/선택 증강 재등장 없음 — 풀 스트레스, 황금 발동 경로 포함)
 *  [5] 시드 재현성 (같은 seed+같은 조작=같은 결과, 직렬화 복원 후에도 동일, createRng)
 *  [6] eligibleAugments 챔피언 필터 (보너스 체크)
 *
 * 신규 스키마 계약 검증 (research/AUGMENT-POOLS-STUDY.md §3):
 *  [8] 신규 restrictions 판정 — 계약 검증 기준 1~5 (마나/대시/서포트/화이트리스트/속박 게이트)
 *  [9] abilityPropsAll 스킬 단위 AND (spells[i].props, 구스키마 합집합 폴백)
 *  [10] weightFor 단위 (favored 2.0 / disfavored 0.6 / trackL9 ability 1.5)
 *  [11] 가중 추출 분포 + 챔피언별 풀 비대칭 — 계약 검증 기준 6
 *  [12] 스킬 증강 enhancedSkill + trackL9 옵션
 *  [13] 신규 기능 포함 시드 재현성 — 계약 검증 기준 7
 *
 * real-mapping 계약 검증 (research/ABILITY-AUGMENT-DATA.md §4):
 *  [14] spellPin 지정 순서 — ①pin(rng 미소비) ②slot ③무작위, exclude 충돌 시 pin 무시→③
 */
/* goldenReroll import 제거: 황금 리롤이 자동 발동(G-AUTO)으로 바뀌며 수동 API가 삭제됨.
 * 대신 newGame({ goldenChance }) 재정의(0/1 강제)로 발동/미발동 경로를 결정적으로 검증한다. */
import {
  createRng,
  eligibleAugments,
  newGame,
  nextRound,
  rerollSlot,
  pickAugment,
  weightFor,
  GOLDEN_REROLL_CHANCE,
  WEIGHT_FAVORED,
  WEIGHT_DISFAVORED,
  WEIGHT_TRACK_L9_ABILITY,
  ROUND_LEVELS,
} from '../docs/js/draft.js';

/* ---------------- 테스트 하네스 ---------------- */
let passCount = 0;
let failCount = 0;
function check(name, cond, detail) {
  if (cond) {
    passCount++;
  } else {
    failCount++;
    console.error('  FAIL: ' + name + (detail !== undefined ? ' — ' + detail : ''));
  }
}
function checkThrows(name, fn) {
  let threw = false;
  try { fn(); } catch (e) { threw = true; }
  check(name, threw, '예외가 발생해야 하는데 발생하지 않음');
}
function section(title) { console.log('[' + title + ']'); }

/* ---------------- 합성 fixture 30개 ---------------- */
function makeFixtures() {
  const augs = [];
  const spec = [['silver', 12], ['gold', 10], ['prismatic', 8]];
  for (const [tier, n] of spec) {
    for (let i = 1; i <= n; i++) {
      augs.push({
        apiName: 'Test_' + tier + '_' + i,
        nameKo: '테스트 ' + tier + ' ' + i,
        nameEn: 'Test ' + tier + ' ' + i,
        tier: tier,
        descKo: '합성 테스트용 증강',
        icon: 'https://example.invalid/' + tier + i + '.png',
        enabled: true,
        arenaOrigin: false,
        tags: ['onhit'],
      });
    }
  }
  return augs;
}
const AUGS = makeFixtures();
const CHAMP = { id: 'TestChamp', nameKo: '테스트챔프', ranged: true, usesMana: true, abilityProps: ['projectile', 'dash'] };
const TIER_UP = { silver: 'gold', gold: 'prismatic', prismatic: 'prismatic' };

function remainingByTier(game) {
  const used = new Set(game.used);
  const counts = { silver: 0, gold: 0, prismatic: 0 };
  for (const a of game.pool) if (!used.has(a.apiName)) counts[a.tier]++;
  return counts;
}

/* ---------------- [1] 4라운드 진행 ---------------- */
section('1. 4라운드 진행');
{
  const g = newGame({ augments: AUGS, champion: CHAMP, seed: 12345 });
  check('시작 시 finished=false', g.finished === false);
  checkThrows('라운드 시작 전 rerollSlot은 예외', () => rerollSlot(g, 0));
  checkThrows('라운드 시작 전 pickAugment는 예외', () => pickAugment(g, 0));
  const levels = [];
  for (let r = 0; r < 4; r++) {
    const round = nextRound(g);
    levels.push(round.level);
    check('라운드 ' + (r + 1) + ' 슬롯 3개', round.slots.length === 3, '실제 ' + round.slots.length);
    check('라운드 ' + (r + 1) + ' rerolled 초기값 [false,false,false]',
      round.rerolled.length === 3 && round.rerolled.every((x) => x === false));
    checkThrows('선택 전 nextRound 재호출은 예외', () => nextRound(g));
    pickAugment(g, 0);
  }
  check('레벨 순서 3/7/11/15', JSON.stringify(levels) === JSON.stringify(ROUND_LEVELS), JSON.stringify(levels));
  check('4라운드 후 finished=true', g.finished === true);
  check('picked 4개', g.picked.length === 4);
  checkThrows('종료 후 nextRound는 예외', () => nextRound(g));
}

/* ---------------- [2] 등급 규칙 (시드 300개) ---------------- */
section('2. 등급 규칙');
{
  const tierSeen = { silver: 0, gold: 0, prismatic: 0 };
  let silverPairViolation = 0;
  let mixedTierViolation = 0;
  for (let s = 0; s < 300; s++) {
    const g = newGame({ augments: AUGS, champion: CHAMP, seed: s });
    const tiers = [];
    for (let r = 0; r < 4; r++) {
      const before = remainingByTier(g); // 라운드 시작 전 잔여 수 (고갈 보충 판별용)
      const round = nextRound(g);
      tiers.push(round.tier);
      tierSeen[round.tier]++;
      // 해당 등급이 3개 이상 남아 있었다면 화면 3개는 반드시 동일 등급
      if (before[round.tier] >= 3 && !round.slots.every((a) => a.tier === round.tier)) {
        mixedTierViolation++;
      }
      pickAugment(g, 0);
    }
    if (tiers[0] === 'silver' && tiers[1] === 'silver') silverPairViolation++;
  }
  check('1·2라운드 둘 다 실버인 게임 0건 (300시드)', silverPairViolation === 0, silverPairViolation + '건');
  check('잔여 충분 시 화면 3개 동일 등급 위반 0건', mixedTierViolation === 0, mixedTierViolation + '건');
  check('실버 등장함', tierSeen.silver > 0);
  check('골드 등장함', tierSeen.gold > 0);
  check('프리즘 등장함', tierSeen.prismatic > 0);
  // 가중치 순서 개연성(느슨한 체크): 실버 >= 프리즘
  check('등장 빈도 개연성 silver >= prismatic', tierSeen.silver >= tierSeen.prismatic,
    JSON.stringify(tierSeen));
}

/* ---------------- [3] 리롤 제한 + 황금 리롤 자동 발동 ---------------- */
section('3. 리롤 1회 제한 + 황금 리롤 자동 발동 (G-AUTO)');
{
  // 갱신 사유(메커니즘 변경): 황금 리롤이 "게임당 1회 수동 액션"에서 "리롤 시 자동 발동"으로
  // 바뀜 (raw/19 G-AUTO). goldenChance 0/1 강제로 미발동/발동 경로를 결정적으로 검증한다.
  const g = newGame({ augments: AUGS, champion: CHAMP, seed: 777, goldenChance: 0 });
  const round = nextRound(g);
  const before1 = round.slots[1].apiName;
  const re1 = rerollSlot(g, 1);
  check('리롤 시 다른 증강으로 교체', re1.apiName !== before1);
  check('goldenChance=0이면 리롤은 같은 등급 유지', re1.tier === round.tier, re1.tier + ' vs ' + round.tier);
  check('rerolled[1]=true', round.rerolled[1] === true);
  check('goldenChance=0이면 round.golden=null 유지', round.golden === null);
  checkThrows('같은 슬롯 2번째 리롤은 예외', () => rerollSlot(g, 1));
  const re0 = rerollSlot(g, 0);
  check('다른 슬롯은 리롤 가능', re0 && typeof re0.apiName === 'string');
  checkThrows('잘못된 슬롯 인덱스는 예외', () => rerollSlot(g, 9));

  // 기본값·직렬화: goldenChance 미지정 시 GOLDEN_REROLL_CHANCE, 상태에 저장(직렬화 왕복)
  const gDef = newGame({ augments: AUGS, seed: 1 });
  check('goldenChance 기본값 = GOLDEN_REROLL_CHANCE', gDef.goldenChance === GOLDEN_REROLL_CHANCE);
  check('goldenChance 직렬화 왕복 보존', JSON.parse(JSON.stringify(gDef)).goldenChance === GOLDEN_REROLL_CHANCE);

  // 자동 발동: goldenChance=1 + 실버/골드 화면 → 첫 리롤이 화면 등급+1로 상승
  let upChecked = false;
  let prismChecked = false;
  for (let s = 0; s < 400 && !(upChecked && prismChecked); s++) {
    const gu = newGame({ augments: AUGS, champion: CHAMP, seed: 5000 + s, goldenChance: 1 });
    const ru = nextRound(gu);
    if (!upChecked && (ru.tier === 'silver' || ru.tier === 'gold')) {
      const up = rerollSlot(gu, 0);
      check('발동: 실버/골드 화면 리롤이 화면 등급+1 (' + ru.tier + '→' + up.tier + ')',
        up.tier === TIER_UP[ru.tier]);
      check('발동: round.golden에 슬롯 기록', ru.golden === 0);
      // 화면당 최대 1회 (근사: 위키 단수 표현): 같은 화면의 두 번째 리롤은 동급 유지
      const re2 = rerollSlot(gu, 1);
      check('화면당 1회: 두 번째 리롤은 동급 유지', re2.tier === ru.tier, re2.tier);
      check('화면당 1회: round.golden 그대로', ru.golden === 0);
      upChecked = true;
    } else if (!prismChecked && ru.tier === 'prismatic') {
      const keep = rerollSlot(gu, 0);
      check('프리즘 화면: goldenChance=1이어도 무발동(동급 유지·golden=null)',
        keep.tier === 'prismatic' && ru.golden === null, keep.tier);
      prismChecked = true;
    }
  }
  check('실버/골드 발동 케이스 확보', upChecked);
  check('프리즘 무발동 케이스 확보', prismChecked);

  // 게임당 횟수 제한 없음 — 화면마다 독립 발동 (실측: 한 게임 3회 사례, raw/19 §5)
  let multiChecked = false;
  for (let s = 0; s < 400 && !multiChecked; s++) {
    const gm = newGame({ augments: AUGS, champion: CHAMP, seed: 15000 + s, goldenChance: 1 });
    const r1 = nextRound(gm);
    if (r1.tier === 'prismatic') continue;
    rerollSlot(gm, 0); // 화면 1 발동
    pickAugment(gm, 0);
    const r2 = nextRound(gm);
    if (r2.tier === 'prismatic') continue;
    const up2 = rerollSlot(gm, 0);
    check('게임당 제한 없음: 다음 화면에서도 발동 (화면 등급+1)',
      up2.tier === TIER_UP[r2.tier] && r2.golden === 0, r2.tier + '→' + up2.tier);
    multiChecked = true;
  }
  check('다음 화면 재발동 케이스 확보', multiChecked);
}

/* ---------------- [4] 중복 금지 (스트레스: 슬롯 3개 전부 리롤 + 황금) ---------------- */
section('4. 중복 금지');
{
  let dupGames = 0;
  for (let s = 0; s < 100; s++) {
    // 갱신 사유(메커니즘 변경): 수동 goldenReroll 삭제 — 절반은 goldenChance=1로
    // 자동 발동(상급 풀 추출) 경로까지 스트레스에 포함시킨다.
    const g = newGame({ augments: AUGS, champion: CHAMP, seed: 1000 + s, goldenChance: s % 2 ? 1 : 0 });
    for (let r = 0; r < 4; r++) {
      const round = nextRound(g);
      for (let i = 0; i < round.slots.length; i++) rerollSlot(g, i);
      pickAugment(g, (r * 2) % 3);
    }
    // used = 게임 내 노출된 모든 apiName. 중복이 있으면 재등장 금지 위반.
    if (new Set(g.used).size !== g.used.length) dupGames++;
    // picked 증강도 서로 달라야 하고 전부 used에 포함되어야 함
    const pickedNames = g.picked.map((a) => a.apiName);
    if (new Set(pickedNames).size !== pickedNames.length) dupGames++;
    if (!pickedNames.every((n) => g.used.indexOf(n) !== -1)) dupGames++;
  }
  check('100 스트레스 게임에서 노출/선택 중복 0건', dupGames === 0, dupGames + '건');
}

/* ---------------- [5] 시드 재현성 ---------------- */
section('5. 시드 재현성');
{
  // createRng 자체 검증
  const a = createRng(9);
  const b = createRng(9);
  const c = createRng(10);
  let sameSeq = true;
  let inRange = true;
  let diffSeen = false;
  for (let i = 0; i < 50; i++) {
    const va = a();
    const vb = b();
    const vc = c();
    if (va !== vb) sameSeq = false;
    if (!(va >= 0 && va < 1)) inRange = false;
    if (va !== vc) diffSeen = true;
  }
  check('createRng: 같은 시드 = 같은 수열', sameSeq);
  check('createRng: 값 범위 [0,1)', inRange);
  check('createRng: 다른 시드 = 다른 수열', diffSeen);

  // 같은 seed + 같은 조작 = 같은 전개
  function playScript(seed) {
    const g = newGame({ augments: AUGS, champion: CHAMP, seed: seed });
    const trace = [];
    for (let r = 0; r < 4; r++) {
      const round = nextRound(g);
      trace.push(round.tier);
      for (const aug of round.slots) trace.push(aug.apiName);
      rerollSlot(g, r % 3);
      trace.push(round.slots[r % 3].apiName);
      // (수동 goldenReroll 단계 삭제 — G-AUTO 전환. 자동 발동은 rerollSlot에 내재되어
      //  판정 draw까지 시드 결정적이므로 재현성 검증 범위에 이미 포함된다.)
      const p = pickAugment(g, (r + 1) % 3);
      trace.push(p.apiName);
    }
    return trace.join('|');
  }
  check('숫자 시드 재현: playScript(42) 동일', playScript(42) === playScript(42));
  check('문자열 시드 재현: playScript("hello") 동일', playScript('hello') === playScript('hello'));
  let anyDiff = false;
  for (const s2 of [43, 44, 45, 'world']) {
    if (playScript(42) !== playScript(s2)) anyDiff = true;
  }
  check('다른 시드는 다른 전개(4개 중 1개 이상)', anyDiff);

  // JSON 직렬화 복원 후에도 동일하게 이어짐 (상태 직렬화 가능성 + 결정론)
  const g1 = newGame({ augments: AUGS, champion: CHAMP, seed: 555 });
  nextRound(g1);
  rerollSlot(g1, 0);
  const g2 = JSON.parse(JSON.stringify(g1));
  pickAugment(g1, 2);
  pickAugment(g2, 2);
  const r1 = nextRound(g1);
  const r2 = nextRound(g2);
  check('직렬화 복원 후 동일 진행', JSON.stringify(r1) === JSON.stringify(r2));
  rerollSlot(g1, 1);
  rerollSlot(g2, 1);
  check('직렬화 복원 후 리롤도 동일', r1.slots[1].apiName === r2.slots[1].apiName,
    r1.slots[1].apiName + ' vs ' + r2.slots[1].apiName);
  check('게임 상태 직렬화 왕복 무손실', JSON.stringify(g1) === JSON.stringify(JSON.parse(JSON.stringify(g1))));
}

/* ---------------- [6] eligibleAugments 필터 (보너스) ---------------- */
section('6. eligibleAugments 챔피언 필터');
{
  const rAugs = [
    { apiName: 'R_ranged', tier: 'silver', enabled: true, restrictions: { rangedOnly: true } },
    { apiName: 'R_melee', tier: 'silver', enabled: true, restrictions: { meleeOnly: true } },
    { apiName: 'R_mana', tier: 'gold', enabled: true, restrictions: { requiresMana: true } },
    { apiName: 'R_disabled', tier: 'gold', enabled: false },
    { apiName: 'R_proj_spin', tier: 'prismatic', enabled: true, restrictions: { abilityProps: ['projectile', 'spin'] } },
    { apiName: 'R_knockback', tier: 'prismatic', enabled: true, restrictions: { abilityProps: ['knockback'] } },
    { apiName: 'R_targeted_proj', tier: 'prismatic', enabled: true, restrictions: { abilityPropsAll: ['targeted', 'projectile'] } },
    { apiName: 'R_free', tier: 'silver', enabled: true },
  ];
  const melee = { id: 'M', ranged: false, usesMana: false, abilityProps: ['spin'] };
  const rangedMana = { id: 'RM', ranged: true, usesMana: true, abilityProps: ['projectile'] };
  const names = (arr) => arr.map((x) => x.apiName).sort().join(',');
  check('근접/무마나/spin 챔피언 필터',
    names(eligibleAugments(rAugs, melee)) === 'R_free,R_melee,R_proj_spin',
    names(eligibleAugments(rAugs, melee)));
  check('원거리/마나/projectile 챔피언 필터',
    names(eligibleAugments(rAugs, rangedMana)) === 'R_free,R_mana,R_proj_spin,R_ranged',
    names(eligibleAugments(rAugs, rangedMana)));
  check('챔피언 미지정 시 enabled 필터만 적용',
    eligibleAugments(rAugs, null).length === 7,
    String(eligibleAugments(rAugs, null).length));
  check('newGame이 비적격 증강을 풀에서 제외',
    newGame({ augments: rAugs, champion: melee, seed: 1 }).pool.length === 3);

  // abilityPropsAll(AND 조건): targeted+projectile을 모두 가진 챔피언에게만 제시
  const targetedOnly = { id: 'T', ranged: true, usesMana: true, abilityProps: ['targeted'] };
  const targetedProj = { id: 'TP', ranged: true, usesMana: true, abilityProps: ['targeted', 'projectile', 'dash'] };
  check('abilityPropsAll: targeted만 있으면 제외 (AND 미충족)',
    names(eligibleAugments(rAugs, targetedOnly)).indexOf('R_targeted_proj') === -1,
    names(eligibleAugments(rAugs, targetedOnly)));
  check('abilityPropsAll: projectile만 있으면 제외 (AND 미충족)',
    names(eligibleAugments(rAugs, rangedMana)).indexOf('R_targeted_proj') === -1,
    names(eligibleAugments(rAugs, rangedMana)));
  check('abilityPropsAll: 둘 다 있으면 포함',
    names(eligibleAugments(rAugs, targetedProj)).indexOf('R_targeted_proj') !== -1,
    names(eligibleAugments(rAugs, targetedProj)));
}

/* ---------------- [7] 황금 리롤 고갈 보충: 하위 등급으로 떨어지지 않음 ---------------- */
section('7. 황금 리롤 고갈 보충 (프리즘 고갈 시 골드 유지)');
{
  // 갱신 사유(메커니즘 변경): 수동 goldenReroll → goldenChance=1 강제 자동 발동으로 재구성.
  // 프리즘이 아예 없는 풀: 골드 화면 황금 발동은 실버로 강등되지 않고 골드를 유지해야 함
  // (FALLBACK_ORDER_UPGRADE[gold] = 프리즘→골드→실버 보충 순서).
  const noPrism = [];
  for (let i = 1; i <= 8; i++) noPrism.push({ apiName: 'NP_silver_' + i, tier: 'silver', enabled: true });
  for (let i = 1; i <= 8; i++) noPrism.push({ apiName: 'NP_gold_' + i, tier: 'gold', enabled: true });
  let goldChecked = false;
  for (let s = 0; s < 400 && !goldChecked; s++) {
    const g = newGame({ augments: noPrism, champion: CHAMP, seed: 9000 + s, goldenChance: 1 });
    const r = nextRound(g);
    if (r.tier === 'gold') {
      const ga = rerollSlot(g, 0); // goldenChance=1 → 반드시 발동
      check('발동 기록(round.golden=0)', r.golden === 0);
      check('프리즘 고갈 시 골드 화면 황금 발동은 골드 유지(실버 강등 금지)',
        ga.tier === 'gold', ga.tier);
      goldChecked = true;
    }
  }
  check('골드 라운드 케이스 확보', goldChecked);
}

/* ================================================================== */
/* 신규 스키마 계약 검증 (research/AUGMENT-POOLS-STUDY.md §3)            */
/* ================================================================== */

/* ---------------- 계약 검증용 합성 fixture ---------------- */
// 게이트 5종 + 챔피언/클래스 제외 + 필러 (계약 [검증 기준] 1~5 대응)
function gatedFixture() {
  const augs = [
    // [기준 1] 마나 게이트 3종 (requiresMana)
    { apiName: 'ARAM_Overflow', tier: 'silver', enabled: true, restrictions: { requiresMana: true } },
    { apiName: 'ARAM_Juiced', tier: 'gold', enabled: true, restrictions: { requiresMana: true } },
    { apiName: 'ARAM_MindtoMatter', tier: 'prismatic', enabled: true, restrictions: { requiresMana: true } },
    // [기준 2] 대시 게이트 (abilityProps OR)
    { apiName: 'ARAM_Dashing', tier: 'gold', enabled: true, restrictions: { abilityProps: ['dash'] } },
    // [기준 3] 서포트 게이트 (classRequired)
    { apiName: 'MercysStrike', tier: 'gold', enabled: true, restrictions: { classRequired: ['Support'] } },
    // [기준 4] 화이트리스트 (championWhitelist)
    { apiName: 'ARAM_SpinToWin', tier: 'silver', enabled: true, restrictions: { championWhitelist: ['Garen', 'Darius'] } },
    // [기준 5] 속박 게이트 (abilityPropsAll — 스킬 단위)
    { apiName: 'ARAM_Cruelty', tier: 'silver', enabled: true, restrictions: { abilityPropsAll: ['immobilize'] } },
    // 챔피언 단위 제외 (championExclude — 스몰더×Combusting Interest 류)
    { apiName: 'BloodMoneyBurn', tier: 'gold', enabled: true, restrictions: { championExclude: ['Smolder'] } },
    // 클래스 제외 (classExcluded)
    { apiName: 'NoMages', tier: 'silver', enabled: true, restrictions: { classExcluded: ['Mage'] } },
  ];
  for (let i = 1; i <= 9; i++) augs.push({ apiName: 'Free_silver_' + i, tier: 'silver', enabled: true });
  for (let i = 1; i <= 7; i++) augs.push({ apiName: 'Free_gold_' + i, tier: 'gold', enabled: true });
  for (let i = 1; i <= 6; i++) augs.push({ apiName: 'Free_prism_' + i, tier: 'prismatic', enabled: true });
  return augs;
}
const GATED = gatedFixture();

// 제드형: 기력(무마나) 암살자, 대시 보유, 속박 없음
const ZED = {
  id: 'Zed', nameKo: '제드', tags: ['Assassin'], ranged: false, usesMana: false,
  abilityProps: ['projectile', 'dash', 'spin', 'targeted'],
  spells: [
    { key: 'Q', nameKo: '예리한 표창', props: ['projectile'] },
    { key: 'W', nameKo: '살아있는 그림자', props: ['dash'] },
    { key: 'E', nameKo: '그림자 베기', props: ['aoe', 'spin'] },
    { key: 'R', nameKo: '죽음의 표식', props: ['targeted', 'dash'] },
  ],
};
// 소라카형: 서포트, 대시·속박 없음
const SORAKA = {
  id: 'Soraka', nameKo: '소라카', tags: ['Support', 'Mage'], ranged: true, usesMana: true,
  abilityProps: ['projectile', 'heal', 'aoe'],
  spells: [
    { key: 'Q', nameKo: '별부름', props: ['projectile', 'aoe'] },
    { key: 'W', nameKo: '은하의 마력', props: ['heal', 'targeted'] },
    { key: 'E', nameKo: '별의 균형', props: ['aoe'] },
    { key: 'R', nameKo: '기원', props: ['heal', 'global'] },
  ],
};
// 모르가나형: 속박 스킬 보유
const BINDER = {
  id: 'Morgana', nameKo: '모르가나', tags: ['Mage'], ranged: true, usesMana: true,
  abilityProps: ['projectile', 'immobilize', 'shield', 'aoe'],
  spells: [
    { key: 'Q', nameKo: '어둠의 속박', props: ['projectile', 'immobilize'] },
    { key: 'W', nameKo: '고통의 대지', props: ['aoe'] },
    { key: 'E', nameKo: '칠흑의 방패', props: ['shield', 'targeted'] },
    { key: 'R', nameKo: '영혼의 족쇄', props: ['aoe', 'immobilize'] },
  ],
};
const GAREN = {
  id: 'Garen', nameKo: '가렌', tags: ['Fighter', 'Tank'], ranged: false, usesMana: false,
  abilityProps: ['spin', 'aoe', 'targeted', 'empoweredAttack'],
  spells: [
    { key: 'Q', nameKo: '결정타', props: ['empoweredAttack'] },
    { key: 'W', nameKo: '용기', props: ['shield', 'durationEffect'] },
    { key: 'E', nameKo: '심판', props: ['spin', 'aoe'] },
    { key: 'R', nameKo: '데마시아의 정의', props: ['targeted'] },
  ],
};
const SMOLDER = {
  id: 'Smolder', nameKo: '스몰더', tags: ['Marksman'], ranged: true, usesMana: true,
  abilityProps: ['projectile', 'aoe', 'dash'],
  spells: [
    { key: 'Q', nameKo: '초강력 화염 숨결', props: ['projectile', 'targeted'] },
    { key: 'W', nameKo: '뜨거운 침', props: ['projectile', 'aoe'] },
    { key: 'E', nameKo: '펄럭펄럭', props: ['dash'] },
    { key: 'R', nameKo: '마마!', props: ['aoe', 'global'] },
  ],
};
const hasAug = (arr, name) => arr.some((a) => a.apiName === name);

/* ---------------- [8] 신규 restrictions 판정 (계약 검증 기준 1~5) ---------------- */
section('8. 신규 restrictions 판정 (계약 검증 기준 1~5)');
{
  const zedPool = eligibleAugments(GATED, ZED);
  // [기준 1] 제드(기력)에게 마나 증강 3종 절대 미제시
  check('기준1: 제드 풀에 마나 증강 3종 없음',
    !hasAug(zedPool, 'ARAM_Overflow') && !hasAug(zedPool, 'ARAM_Juiced') && !hasAug(zedPool, 'ARAM_MindtoMatter'),
    zedPool.map((a) => a.apiName).join(','));
  // 풀 스트레스: 전 라운드·전 리롤을 돌려도 슬롯에 마나 증강이 한 번도 노출되지 않아야 함
  let manaExposed = 0;
  for (let s = 0; s < 80; s++) {
    // 갱신 사유(메커니즘 변경): 수동 goldenReroll 삭제 — 절반은 goldenChance=1로 상급 풀
    // 추출(자동 발동) 경로까지 노출 스트레스에 포함.
    const g = newGame({ augments: GATED, champion: ZED, seed: 20000 + s, goldenChance: s % 2 ? 1 : 0 });
    for (let r = 0; r < 4; r++) {
      const round = nextRound(g);
      for (let i = 0; i < round.slots.length; i++) rerollSlot(g, i);
      pickAugment(g, 0);
    }
    for (const n of ['ARAM_Overflow', 'ARAM_Juiced', 'ARAM_MindtoMatter']) {
      if (g.used.indexOf(n) !== -1) manaExposed++;
    }
  }
  check('기준1: 80게임 풀스트레스에서 마나 증강 노출 0건', manaExposed === 0, manaExposed + '건');

  // [기준 2] 대시 게이트는 대시 스킬 보유 챔피언에게만
  check('기준2: 대시 보유(제드)에게 ARAM_Dashing 제시', hasAug(zedPool, 'ARAM_Dashing'));
  check('기준2: 대시 미보유(소라카)에게 ARAM_Dashing 미제시',
    !hasAug(eligibleAugments(GATED, SORAKA), 'ARAM_Dashing'));

  // [기준 3] 서포트 게이트(classRequired)는 tags에 Support 있는 챔피언에게만
  check('기준3: 소라카(Support)에게 MercysStrike 제시', hasAug(eligibleAugments(GATED, SORAKA), 'MercysStrike'));
  check('기준3: 제드(non-support)에게 MercysStrike 미제시', !hasAug(zedPool, 'MercysStrike'));

  // [기준 4] Spin To Win은 화이트리스트 챔피언에게만
  check('기준4: 가렌(화이트리스트)에게 SpinToWin 제시', hasAug(eligibleAugments(GATED, GAREN), 'ARAM_SpinToWin'));
  check('기준4: 제드(목록 밖)에게 SpinToWin 미제시', !hasAug(zedPool, 'ARAM_SpinToWin'));
  check('기준4: 스몰더(목록 밖)에게 SpinToWin 미제시', !hasAug(eligibleAugments(GATED, SMOLDER), 'ARAM_SpinToWin'));

  // [기준 5] 속박 게이트는 속박 스킬 보유자에게만
  check('기준5: 모르가나(속박 Q)에게 Cruelty 제시', hasAug(eligibleAugments(GATED, BINDER), 'ARAM_Cruelty'));
  check('기준5: 제드(속박 없음)에게 Cruelty 미제시', !hasAug(zedPool, 'ARAM_Cruelty'));

  // championExclude / classExcluded
  check('championExclude: 스몰더에게 BloodMoneyBurn 미제시',
    !hasAug(eligibleAugments(GATED, SMOLDER), 'BloodMoneyBurn'));
  check('championExclude: 다른 챔피언(제드)에게는 제시', hasAug(zedPool, 'BloodMoneyBurn'));
  check('classExcluded: Mage(모르가나)에게 NoMages 미제시',
    !hasAug(eligibleAugments(GATED, BINDER), 'NoMages'));
  check('classExcluded: 비Mage(제드)에게는 제시', hasAug(zedPool, 'NoMages'));

  // 하위 호환: 신규 필드 없는 증강·챔피언은 종전 동작 (champion 미지정 시 enabled만)
  check('하위 호환: 챔피언 미지정 시 enabled 필터만', eligibleAugments(GATED, null).length === GATED.length);
}

/* ---------------- [9] abilityPropsAll 스킬 단위 AND ---------------- */
section('9. abilityPropsAll 스킬 단위 AND (spells[i].props)');
{
  const tripleshot = [{ apiName: 'SpellVolley', tier: 'prismatic', enabled: true, restrictions: { abilityPropsAll: ['targeted', 'projectile'] } }];
  // 같은 스킬 하나가 targeted+projectile → 적격
  const oneSpell = { id: 'A', tags: [], ranged: true, usesMana: true, abilityProps: ['targeted', 'projectile'],
    spells: [{ key: 'Q', nameKo: 'Q스킬', props: ['targeted', 'projectile'] }] };
  check('스킬 하나가 AND 전부 충족 → 적격', eligibleAugments(tripleshot, oneSpell).length === 1);
  // 서로 다른 스킬이 나눠 가짐(합집합은 충족) → 스킬 단위 판정으로 부적격
  const splitSpells = { id: 'B', tags: [], ranged: true, usesMana: true, abilityProps: ['targeted', 'projectile'],
    spells: [
      { key: 'Q', nameKo: 'Q스킬', props: ['targeted'] },
      { key: 'W', nameKo: 'W스킬', props: ['projectile'] },
    ] };
  check('속성이 스킬별로 분산(합집합만 충족) → 부적격 (스킬 단위 AND)',
    eligibleAugments(tripleshot, splitSpells).length === 0);
  // 구스키마: spells[i].props 없음 → 종전 합집합 방식 폴백 (적격)
  const legacy = { id: 'C', tags: [], ranged: true, usesMana: true, abilityProps: ['targeted', 'projectile'],
    spells: [{ key: 'Q', nameKo: 'Q스킬' }, { key: 'W', nameKo: 'W스킬' }] };
  check('구스키마(props 없음) → 합집합 폴백으로 적격', eligibleAugments(tripleshot, legacy).length === 1);
  // 일부 스킬만 props 보유(신스키마로 간주)하고 그 스킬이 미충족 → 부적격
  const partial = { id: 'D', tags: [], ranged: true, usesMana: true, abilityProps: ['targeted', 'projectile'],
    spells: [{ key: 'Q', nameKo: 'Q스킬', props: ['aoe'] }, { key: 'W', nameKo: 'W스킬' }] };
  check('props 있는 스킬이 미충족이면 부적격 (부분 데이터도 스킬 단위 판정)',
    eligibleAugments(tripleshot, partial).length === 0);
}

/* ---------------- [10] weightFor 단위 ---------------- */
section('10. weightFor 가중치 단위');
{
  const champ = { id: 'W1', tags: ['Marksman'], spells: [] };
  check('기본 가중치 1.0', weightFor({}, champ) === 1.0);
  check('favoredClasses 교집합 → 2.0 (WEIGHT_FAVORED)',
    weightFor({ favoredClasses: ['Marksman'] }, champ) === WEIGHT_FAVORED);
  check('disfavoredClasses 교집합 → 0.6 (WEIGHT_DISFAVORED)',
    weightFor({ disfavoredClasses: ['Marksman'] }, champ) === WEIGHT_DISFAVORED);
  check('교집합 없으면 1.0',
    weightFor({ favoredClasses: ['Mage'], disfavoredClasses: ['Tank'] }, champ) === 1.0);
  check('favored+disfavored 동시 → 곱연산 1.2',
    Math.abs(weightFor({ favoredClasses: ['Marksman'], disfavoredClasses: ['Marksman'] }, champ) - WEIGHT_FAVORED * WEIGHT_DISFAVORED) < 1e-12);
  check('trackL9 + category=ability → 1.5 (WEIGHT_TRACK_L9_ABILITY)',
    weightFor({ category: 'ability' }, champ, { trackL9: true }) === WEIGHT_TRACK_L9_ABILITY);
  check('trackL9 꺼짐이면 ability도 1.0', weightFor({ category: 'ability' }, champ, { trackL9: false }) === 1.0);
  check('trackL9 켜져도 normal은 1.0', weightFor({ category: 'normal' }, champ, { trackL9: true }) === 1.0);
  check('챔피언 null이면 클래스 계수 미적용 (trackL9 ability는 적용)',
    weightFor({ favoredClasses: ['Marksman'], category: 'ability' }, null, { trackL9: true }) === WEIGHT_TRACK_L9_ABILITY);
  check('favored × trackL9 ability 결합 3.0',
    Math.abs(weightFor({ favoredClasses: ['Marksman'], category: 'ability' }, champ, { trackL9: true }) - WEIGHT_FAVORED * WEIGHT_TRACK_L9_ABILITY) < 1e-12);
}

/* ---------------- [11] 가중 추출 분포 + 풀 비대칭 (계약 검증 기준 6) ---------------- */
section('11. 가중 추출 분포 + 챔피언별 풀 비대칭');
{
  // favored 3종 vs 일반 3종 (전부 실버 → 매 라운드 실버) — 슬롯 0 등장 빈도로 2:1 편향 확인
  const biasPool = [];
  for (let i = 1; i <= 3; i++) biasPool.push({ apiName: 'Fav_' + i, tier: 'silver', enabled: true, favoredClasses: ['Marksman'] });
  for (let i = 1; i <= 3; i++) biasPool.push({ apiName: 'Plain_' + i, tier: 'silver', enabled: true });
  const marksman = { id: 'MM', tags: ['Marksman'], ranged: true, usesMana: true, abilityProps: [], spells: [] };
  let favCount = 0;
  let plainCount = 0;
  for (let s = 0; s < 500; s++) {
    const g = newGame({ augments: biasPool, champion: marksman, seed: 30000 + s });
    const round = nextRound(g);
    if (round.slots[0].apiName.indexOf('Fav_') === 0) favCount++;
    else plainCount++;
  }
  // 근사 계수 2.0 → 기대 비율 2:1. 느슨한 통계 체크(500표본)
  check('favoredClasses 증강이 유의하게 더 자주 등장 (기대 2:1)',
    favCount > plainCount * 1.4, favCount + ' vs ' + plainCount);

  // disfavored 편향: 0.6배 → 덜 등장
  const disPool = [];
  for (let i = 1; i <= 3; i++) disPool.push({ apiName: 'Dis_' + i, tier: 'silver', enabled: true, disfavoredClasses: ['Marksman'] });
  for (let i = 1; i <= 3; i++) disPool.push({ apiName: 'Plain_' + i, tier: 'silver', enabled: true });
  let disCount = 0;
  let plainCount2 = 0;
  for (let s = 0; s < 500; s++) {
    const g = newGame({ augments: disPool, champion: marksman, seed: 40000 + s });
    const round = nextRound(g);
    if (round.slots[0].apiName.indexOf('Dis_') === 0) disCount++;
    else plainCount2++;
  }
  check('disfavoredClasses 증강이 유의하게 덜 등장 (기대 0.6:1)',
    disCount * 1.2 < plainCount2, disCount + ' vs ' + plainCount2);

  // [기준 6] 풀 크기 비대칭: 킷이 다양한 탱커(말파이트형) 풀 > 게이트에 덜 걸리는 원딜(징크스형) 풀
  const malphite = {
    id: 'Malphite', tags: ['Tank'], ranged: false, usesMana: true,
    abilityProps: ['targeted', 'projectile', 'aoe', 'knockback', 'immobilize', 'dash', 'empoweredAttack'],
    spells: [
      { key: 'Q', nameKo: '지진의 파편', props: ['targeted', 'projectile'] },
      { key: 'W', nameKo: '천둥소리', props: ['empoweredAttack'] },
      { key: 'E', nameKo: '지면 강타', props: ['aoe'] },
      { key: 'R', nameKo: '멈출 수 없는 힘', props: ['dash', 'knockback', 'aoe', 'immobilize'] },
    ],
  };
  const jinx = {
    id: 'Jinx', tags: ['Marksman'], ranged: true, usesMana: true,
    abilityProps: ['projectile', 'aoe', 'global'],
    spells: [
      { key: 'Q', nameKo: '전환!', props: [] },
      { key: 'W', nameKo: '찌직!', props: ['projectile'] },
      { key: 'E', nameKo: '와작와작', props: ['projectile', 'aoe'] },
      { key: 'R', nameKo: '슈퍼 메가 죽음의 로켓!', props: ['projectile', 'aoe', 'global'] },
    ],
  };
  const malphPool = eligibleAugments(GATED, malphite);
  const jinxPool = eligibleAugments(GATED, jinx);
  check('기준6: 말파이트형 풀 > 징크스형 풀 (대시·속박 게이트 차이)',
    malphPool.length > jinxPool.length, malphPool.length + ' vs ' + jinxPool.length);
}

/* ---------------- [12] 스킬 증강 enhancedSkill + trackL9 ---------------- */
section('12. 스킬 증강 enhancedSkill + trackL9 옵션');
{
  // 스킬 증강 fixture: knockback 요구 1종 + 무조건 1종 + 일반 필러
  const abilityPool = [
    { apiName: 'ChainReaction', tier: 'silver', enabled: true, category: 'ability', restrictions: { abilityPropsAll: ['knockback'] } },
    { apiName: 'ARAM_SustainingStrike', tier: 'silver', enabled: true, category: 'ability' },
  ];
  for (let i = 1; i <= 6; i++) abilityPool.push({ apiName: 'Norm_' + i, tier: 'silver', enabled: true });
  const knocker = {
    id: 'K', tags: ['Tank'], ranged: false, usesMana: true, abilityProps: ['projectile', 'knockback', 'aoe'],
    spells: [
      { key: 'Q', nameKo: '투사체기', props: ['projectile'] },
      { key: 'W', nameKo: '올려치기', props: ['knockback'] },
      { key: 'E', nameKo: '보통기', props: [] },
      { key: 'R', nameKo: '광역 올려치기', props: ['knockback', 'aoe'] },
    ],
  };
  let chainSeen = 0;
  let chainKeyOk = true;
  let siphonSeen = 0;
  let siphonKeyOk = true;
  let normNoSkill = true;
  let shapeOk = true;
  for (let s = 0; s < 200; s++) {
    const g = newGame({ augments: abilityPool, champion: knocker, seed: 50000 + s });
    const round = nextRound(g);
    for (const slot of round.slots) {
      if (slot.apiName === 'ChainReaction') {
        chainSeen++;
        if (!slot.enhancedSkill || ['W', 'R'].indexOf(slot.enhancedSkill.key) === -1) chainKeyOk = false;
        if (!slot.enhancedSkill || typeof slot.enhancedSkill.nameKo !== 'string') shapeOk = false;
      } else if (slot.apiName === 'ARAM_SustainingStrike') {
        siphonSeen++;
        if (!slot.enhancedSkill || ['Q', 'W', 'E', 'R'].indexOf(slot.enhancedSkill.key) === -1) siphonKeyOk = false;
      } else if (slot.enhancedSkill !== undefined) {
        normNoSkill = false;
      }
    }
  }
  check('ChainReaction 케이스 확보(200시드)', chainSeen > 0, chainSeen + '회');
  check('requiredProps 충족 스킬(W/R)에만 enhancedSkill 지정', chainKeyOk);
  check('enhancedSkill 형태 {key, nameKo}', shapeOk);
  check('requiredProps 없는 스킬 증강은 Q/W/E/R 중 지정', siphonSeen > 0 && siphonKeyOk, siphonSeen + '회');
  check('일반 증강에는 enhancedSkill 없음', normNoSkill);
  check('풀의 원본 증강 객체는 불변 (enhancedSkill 미오염)',
    abilityPool[0].enhancedSkill === undefined && abilityPool[1].enhancedSkill === undefined);

  // 적격 스킬이 하나뿐이면 항상 그 스킬
  const singleKnock = {
    id: 'SK', tags: [], ranged: false, usesMana: true, abilityProps: ['knockback'],
    spells: [
      { key: 'Q', nameKo: '보통기1', props: [] },
      { key: 'W', nameKo: '유일한 넉백기', props: ['knockback'] },
      { key: 'E', nameKo: '보통기2', props: [] },
      { key: 'R', nameKo: '보통기3', props: [] },
    ],
  };
  let alwaysW = true;
  let singleSeen = 0;
  for (let s = 0; s < 200 && singleSeen < 10; s++) {
    const g = newGame({ augments: abilityPool, champion: singleKnock, seed: 60000 + s });
    const round = nextRound(g);
    for (const slot of round.slots) {
      if (slot.apiName === 'ChainReaction') {
        singleSeen++;
        if (!slot.enhancedSkill || slot.enhancedSkill.key !== 'W') alwaysW = false;
      }
    }
  }
  check('적격 스킬 1개면 항상 그 스킬(W) 지정', singleSeen > 0 && alwaysW, singleSeen + '회');

  // trackL9 기본값 off + 게임 상태 포함(직렬화)
  const gDef = newGame({ augments: abilityPool, champion: knocker, seed: 1 });
  check('trackL9 기본값 false', gDef.trackL9 === false);
  const gOn = newGame({ augments: abilityPool, champion: knocker, seed: 1, trackL9: true });
  check('trackL9 옵션이 게임 상태에 저장(직렬화 가능)',
    gOn.trackL9 === true && JSON.parse(JSON.stringify(gOn)).trackL9 === true);

  // trackL9=true면 스킬 증강 등장 빈도 증가 (근사 계수 1.5)
  function countAbilityOffers(trackL9) {
    let n = 0;
    for (let s = 0; s < 400; s++) {
      const g = newGame({ augments: abilityPool, champion: knocker, seed: 70000 + s, trackL9: trackL9 });
      const round = nextRound(g);
      for (const slot of round.slots) if (slot.category === 'ability') n++;
    }
    return n;
  }
  const offOffers = countAbilityOffers(false);
  const onOffers = countAbilityOffers(true);
  check('trackL9=true면 스킬 증강 제시 빈도 증가', onOffers > offOffers, onOffers + ' vs ' + offOffers);
}

/* ---------------- [13] 신규 기능 포함 시드 재현성 (계약 검증 기준 7) ---------------- */
section('13. 신규 기능 포함 시드 재현성');
{
  // 가중치 + 카테고리 + 게이트가 섞인 풀에서의 전체 트레이스 재현 (enhancedSkill 포함)
  const mixedPool = [];
  for (let i = 1; i <= 5; i++) {
    mixedPool.push({ apiName: 'Mix_silver_' + i, tier: 'silver', enabled: true, favoredClasses: i % 2 ? ['Assassin'] : [] });
  }
  mixedPool.push({ apiName: 'MixAbility_s', tier: 'silver', enabled: true, category: 'ability' });
  for (let i = 1; i <= 4; i++) {
    mixedPool.push({ apiName: 'Mix_gold_' + i, tier: 'gold', enabled: true, disfavoredClasses: i % 2 ? ['Assassin'] : [] });
  }
  mixedPool.push({ apiName: 'MixAbility_g', tier: 'gold', enabled: true, category: 'ability', restrictions: { abilityPropsAll: ['dash'] } });
  for (let i = 1; i <= 4; i++) mixedPool.push({ apiName: 'Mix_prism_' + i, tier: 'prismatic', enabled: true });

  function playScript2(seed, trackL9) {
    const g = newGame({ augments: mixedPool, champion: ZED, seed: seed, trackL9: trackL9 });
    const trace = [];
    for (let r = 0; r < 4; r++) {
      const round = nextRound(g);
      trace.push(round.tier);
      for (const aug of round.slots) {
        trace.push(aug.apiName + (aug.enhancedSkill ? ':' + aug.enhancedSkill.key : ''));
      }
      rerollSlot(g, r % 3);
      const s2 = round.slots[r % 3];
      trace.push(s2.apiName + (s2.enhancedSkill ? ':' + s2.enhancedSkill.key : ''));
      // (수동 goldenReroll 단계 삭제 — G-AUTO 전환. 발동 판정 draw는 rerollSlot에 내재)
      trace.push(pickAugment(g, (r + 1) % 3).apiName);
    }
    return trace.join('|');
  }
  check('기준7: 같은 시드 = 같은 결과 (가중 추출 + enhancedSkill 포함)',
    playScript2(42, false) === playScript2(42, false));
  check('기준7: trackL9=true도 자체적으로는 결정적',
    playScript2(42, true) === playScript2(42, true));
  check('trackL9 미지정과 false는 동일 전개 (URL 하위 호환)',
    playScript2(42, undefined) === playScript2(42, false));

  // 직렬화 복원 후에도 동일 진행 (enhancedSkill 지정 rng 포함)
  const gA = newGame({ augments: mixedPool, champion: ZED, seed: 999, trackL9: true });
  nextRound(gA);
  const gB = JSON.parse(JSON.stringify(gA));
  pickAugment(gA, 0);
  pickAugment(gB, 0);
  const rA = nextRound(gA);
  const rB = nextRound(gB);
  check('직렬화 복원 후 동일 진행 (신규 상태 필드 포함)', JSON.stringify(rA) === JSON.stringify(rB));
}

/* ---------------- [14] spellPin 지정 순서 (real-mapping 계약: ①pin ②slot ③무작위) ---------------- */
section('14. spellPin 지정 순서 (①pin ②slot ③무작위)');
{
  const PINCH = {
    id: 'PinChamp', tags: [], ranged: false, usesMana: true,
    abilityProps: ['projectile', 'knockback'],
    spells: [
      { key: 'Q', nameKo: '핀Q', props: ['projectile'] },
      { key: 'W', nameKo: '핀W', props: ['knockback'] },
      { key: 'E', nameKo: '핀E', props: [] },
      { key: 'R', nameKo: '핀R', props: ['knockback'] },
    ],
  };
  const fillers = [];
  for (let i = 1; i <= 5; i++) fillers.push({ apiName: 'PFill_' + i, tier: 'silver', enabled: true });

  // ① 기본: spellPin이 있으면 그 스킬로 고정 — requiredProps(knockback)를 못 채우는 E라도
  //   확정 매핑(실측/공식 근거)이 근사 필터(requiredProps 무작위)보다 우선한다
  const pinAug = { apiName: 'PinAug', tier: 'silver', enabled: true, category: 'ability',
    restrictions: { abilityPropsAll: ['knockback'], spellPin: { PinChamp: 'E' } } };
  let pinSeen = 0;
  let pinOk = true;
  let pinNameOk = true;
  for (let s = 0; s < 120; s++) {
    const g = newGame({ augments: [pinAug].concat(fillers), champion: PINCH, seed: 80000 + s });
    const round = nextRound(g);
    for (const slot of round.slots) {
      if (slot.apiName === 'PinAug') {
        pinSeen++;
        if (!slot.enhancedSkill || slot.enhancedSkill.key !== 'E') pinOk = false;
        if (!slot.enhancedSkill || slot.enhancedSkill.nameKo !== '핀E') pinNameOk = false;
      }
    }
  }
  check('① spellPin 케이스 확보(120시드)', pinSeen > 0, pinSeen + '회');
  check('① spellPin이 있으면 항상 그 스킬(E)로 고정 (requiredProps보다 우선)', pinOk);
  check('① 고정 스킬 nameKo를 champion.spells에서 조회', pinNameOk);

  // ① > ②: slot과 pin이 같이 있으면 pin 우선
  const pinOverSlot = { apiName: 'PinOverSlot', tier: 'silver', enabled: true, category: 'ability',
    restrictions: { slot: 'Q', spellPin: { PinChamp: 'W' } } };
  let posSeen = 0;
  let posOk = true;
  for (let s = 0; s < 120; s++) {
    const g = newGame({ augments: [pinOverSlot].concat(fillers), champion: PINCH, seed: 150000 + s });
    const round = nextRound(g);
    for (const slot of round.slots) {
      if (slot.apiName === 'PinOverSlot' && slot.enhancedSkill) {
        posSeen++;
        if (slot.enhancedSkill.key !== 'W') posOk = false;
      }
    }
  }
  check('①>②: slot(Q)과 pin(W)이 같이 있으면 pin(W) 우선', posSeen > 0 && posOk, posSeen + '회');

  // 공용 트레이스: 드로우 시퀀스(apiName) + 증강별 최초 지정 스킬 키 + 최종 rng 상태
  function playTrace(pool, seed) {
    const g = newGame({ augments: pool, champion: PINCH, seed: seed });
    const seq = [];
    const keys = {};
    const note = function (a) {
      seq.push(a.apiName);
      if (a.enhancedSkill && keys[a.apiName] === undefined) keys[a.apiName] = a.enhancedSkill.key;
    };
    for (let r = 0; r < 4; r++) {
      const round = nextRound(g);
      for (const a of round.slots) note(a);
      rerollSlot(g, r % 3);
      note(round.slots[r % 3]);
      // (수동 goldenReroll 단계 삭제 — G-AUTO 전환. 판정 draw 소비는 양쪽 풀에서 동일하므로
      //  rng 미소비(a)/(b)의 "동일 소비량" 전제는 그대로 성립한다.)
      pickAugment(g, (r + 1) % 3);
    }
    return { seq: seq.join('|'), keys: keys, rngState: g.rngState };
  }
  const mkNames = [];
  for (let i = 1; i <= 10; i++) mkNames.push(['NX_silver_' + i, 'silver']);
  for (let i = 1; i <= 8; i++) mkNames.push(['NX_gold_' + i, 'gold']);
  const plainPool = mkNames.map(function (nt) { return { apiName: nt[0], tier: nt[1], enabled: true }; });
  const pinnedPool = mkNames.map(function (nt) {
    return { apiName: nt[0], tier: nt[1], enabled: true, category: 'ability',
      restrictions: { spellPin: { PinChamp: 'W' } } };
  });

  // rng 미소비(a): 전 증강이 pin인 풀은 "일반 증강(지정 자체가 없는)" 풀과 rng 소비량이 같아야 함
  //   → 같은 시드에서 드로우 시퀀스와 최종 rngState가 완전히 일치 (pin 지정이 rng를 안 쓴다는 직접 증거)
  let rngFreeOk = true;
  let pinnedAllW = true;
  for (const s of [1, 2, 77, 12345, 'seedstr']) {
    const tp = playTrace(plainPool, s);
    const tq = playTrace(pinnedPool, s);
    if (tp.seq !== tq.seq || tp.rngState !== tq.rngState) rngFreeOk = false;
    for (const n in tq.keys) if (tq.keys[n] !== 'W') pinnedAllW = false;
  }
  check('rng 미소비(a): 전원 pin 풀 = 일반 증강 풀과 드로우 시퀀스·최종 rng 상태 동일', rngFreeOk);
  check('rng 미소비(a): pin 풀의 지정 키는 전부 W', pinnedAllW);

  // rng 미소비(b): 같은 시드에서 spellPin 유무가 이후 드로우를 바꾸지 않음.
  //   비교 기준은 rng-free인 ②(slot) — pin이 있으면 ①(W), 없으면 ②(Q)로 지정만 달라지고
  //   드로우 시퀀스·rngState는 동일해야 한다. (③ 무작위 경로는 rng를 1회 소비하므로
  //   pin↔③ 비교는 정의상 rng 스트림이 달라짐 — 계약이 pin을 "rng 미소비"로 규정한 결과)
  const baseSlotAug = { apiName: 'XSlot', tier: 'silver', enabled: true, category: 'ability',
    restrictions: { slot: 'Q' } };
  const pinSlotAug = { apiName: 'XSlot', tier: 'silver', enabled: true, category: 'ability',
    restrictions: { slot: 'Q', spellPin: { PinChamp: 'W' } } };
  const rest = [];
  for (let i = 1; i <= 9; i++) rest.push({ apiName: 'Y_silver_' + i, tier: 'silver', enabled: true });
  for (let i = 1; i <= 8; i++) rest.push({ apiName: 'Y_gold_' + i, tier: 'gold', enabled: true });
  let pinPresenceOk = true;
  let xSeen = 0;
  let xKeysOk = true;
  for (let s = 0; s < 60; s++) {
    const tc = playTrace([baseSlotAug].concat(rest), 90000 + s);
    const td = playTrace([pinSlotAug].concat(rest), 90000 + s);
    if (tc.seq !== td.seq || tc.rngState !== td.rngState) pinPresenceOk = false;
    if (tc.keys.XSlot !== undefined) {
      xSeen++;
      if (tc.keys.XSlot !== 'Q' || td.keys.XSlot !== 'W') xKeysOk = false;
    }
  }
  check('rng 미소비(b): spellPin 유무가 이후 드로우를 바꾸지 않음(시퀀스·rng 상태 동일)', pinPresenceOk);
  check('rng 미소비(b): 대상 증강 노출 케이스 확보(60시드)', xSeen > 0, xSeen + '회');
  check('rng 미소비(b): 같은 시드에서 pin 없으면 slot(Q), 있으면 pin(W)', xKeysOk);

  // 충돌 정책: pin된 스킬이 같은 챔피언의 spellExclude에도 있으면 데이터 오류 —
  //   exclude(공식 버그픽스 근거)를 우선해 pin을 무시하고 ③ 무작위로 (draft.js 주석 명시)
  const conflictAug = { apiName: 'ConflictAug', tier: 'silver', enabled: true, category: 'ability',
    restrictions: { abilityPropsAll: ['knockback'], spellPin: { PinChamp: 'W' }, spellExclude: { PinChamp: ['W'] } } };
  let confSeen = 0;
  let confOk = true;
  for (let s = 0; s < 120; s++) {
    const g = newGame({ augments: [conflictAug].concat(fillers), champion: PINCH, seed: 100000 + s });
    const round = nextRound(g);
    for (const slot of round.slots) {
      if (slot.apiName === 'ConflictAug') {
        confSeen++;
        // 적격(knockback) 스킬 W·R 중 W가 제외 → ③에서 항상 R
        if (!slot.enhancedSkill || slot.enhancedSkill.key !== 'R') confOk = false;
      }
    }
  }
  check('충돌: pin(W)∈exclude(W)면 pin 무시 → ③ 무작위(적격은 R만 남아 항상 R)',
    confSeen > 0 && confOk, confSeen + '회');

  // 충돌 시 ②(slot)도 건너뛰고 ③으로 간다 (계약 정책: "pin 무시하고 ③으로")
  const conflictSlotAug = { apiName: 'ConflictSlotAug', tier: 'silver', enabled: true, category: 'ability',
    restrictions: { slot: 'Q', spellPin: { PinChamp: 'W' }, spellExclude: { PinChamp: ['W'] } } };
  const keySeen = {};
  let confSlotSeen = 0;
  let neverW = true;
  for (let s = 0; s < 200; s++) {
    const g = newGame({ augments: [conflictSlotAug].concat(fillers), champion: PINCH, seed: 110000 + s });
    const round = nextRound(g);
    for (const slot of round.slots) {
      if (slot.apiName === 'ConflictSlotAug' && slot.enhancedSkill) {
        confSlotSeen++;
        keySeen[slot.enhancedSkill.key] = true;
        if (slot.enhancedSkill.key === 'W') neverW = false;
      }
    }
  }
  check('충돌: slot(Q)이 있어도 ②를 건너뛰고 ③ 무작위 (Q 고정이 아님 — 복수 키 관측)',
    confSlotSeen > 0 && Object.keys(keySeen).length >= 2, JSON.stringify(Object.keys(keySeen)));
  check('충돌: 제외된 스킬(W)은 끝까지 지정되지 않음', neverW);

  // 방어: 다른 챔피언 id 키의 pin은 미적용 → ③ (적격 W/R 중 무작위)
  const otherPin = { apiName: 'OtherPin', tier: 'silver', enabled: true, category: 'ability',
    restrictions: { abilityPropsAll: ['knockback'], spellPin: { SomeoneElse: 'E' } } };
  let otherSeen = 0;
  let otherOk = true;
  for (let s = 0; s < 120; s++) {
    const g = newGame({ augments: [otherPin].concat(fillers), champion: PINCH, seed: 120000 + s });
    const round = nextRound(g);
    for (const slot of round.slots) {
      if (slot.apiName === 'OtherPin' && slot.enhancedSkill) {
        otherSeen++;
        if (['W', 'R'].indexOf(slot.enhancedSkill.key) === -1) otherOk = false;
      }
    }
  }
  check('방어: 다른 챔피언 id의 pin은 미적용 (③ 적격 W/R 중 지정)', otherSeen > 0 && otherOk, otherSeen + '회');

  // 방어: 스킬 키 범위(Q/W/E/R) 밖 pin 값은 무시 → ②(slot Q) 적용
  const badPin = { apiName: 'BadPin', tier: 'silver', enabled: true, category: 'ability',
    restrictions: { slot: 'Q', spellPin: { PinChamp: 'X' } } };
  let badSeen = 0;
  let badOk = true;
  for (let s = 0; s < 120; s++) {
    const g = newGame({ augments: [badPin].concat(fillers), champion: PINCH, seed: 130000 + s });
    const round = nextRound(g);
    for (const slot of round.slots) {
      if (slot.apiName === 'BadPin' && slot.enhancedSkill) {
        badSeen++;
        if (slot.enhancedSkill.key !== 'Q') badOk = false;
      }
    }
  }
  check('방어: 키 범위 밖 pin(X)은 무시하고 ② slot(Q) 적용', badSeen > 0 && badOk, badSeen + '회');

  // 방어: 챔피언 미지정 게임에서는 pin이 적용될 수 없음 (champion.id 매칭 불가) — 예외 없이 Q/W/E/R 지정
  let nullSeen = 0;
  let nullOk = true;
  for (let s = 0; s < 40; s++) {
    const g = newGame({ augments: [pinAug].concat(fillers), seed: 140000 + s });
    const round = nextRound(g);
    for (const slot of round.slots) {
      if (slot.apiName === 'PinAug') {
        nullSeen++;
        if (!slot.enhancedSkill || ['Q', 'W', 'E', 'R'].indexOf(slot.enhancedSkill.key) === -1) nullOk = false;
      }
    }
  }
  check('방어: 챔피언 미지정이면 pin 미적용·예외 없이 Q/W/E/R 지정', nullSeen > 0 && nullOk, nullSeen + '회');

  // 풀 원본 불변 + pin 포함 시드 재현성
  check('풀 원본 불변: pin 증강 원본에 enhancedSkill 미오염',
    pinAug.enhancedSkill === undefined && pinOverSlot.enhancedSkill === undefined
    && conflictAug.enhancedSkill === undefined && pinnedPool[0].enhancedSkill === undefined);
  check('pin 포함 시드 재현성 (같은 시드 = 같은 전개)',
    playTrace(pinnedPool, 4242).seq === playTrace(pinnedPool, 4242).seq
    && playTrace(pinnedPool, 4242).rngState === playTrace(pinnedPool, 4242).rngState);
}

/* ---------------- 결과 ---------------- */
console.log('');
console.log('통과 ' + passCount + ' / 실패 ' + failCount);
if (failCount > 0) {
  console.error('테스트 실패');
  process.exit(1);
}
console.log('모든 테스트 통과');
process.exit(0);
