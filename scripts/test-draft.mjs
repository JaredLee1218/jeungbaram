/**
 * scripts/test-draft.mjs — docs/js/draft.js 유닛 체크 (Node v14 호환)
 * 실행: node scripts/test-draft.mjs   (실패 시 exit 1)
 *
 * 합성 증강 fixture 30개(실버 12 / 골드 10 / 프리즘 8)로 검증:
 *  [1] 4라운드 진행 (레벨 3/7/11/15, 3슬롯, finished 전이)
 *  [2] 등급 규칙 (1·2라운드 둘 다 실버 금지, 화면 3개 동일 등급, 3등급 모두 등장)
 *  [3] 리롤 1회 제한 (슬롯별 1회, 황금 리롤 게임당 1회 + 등급 상승)
 *  [4] 중복 금지 (게임 내 노출/선택 증강 재등장 없음 — 풀 스트레스)
 *  [5] 시드 재현성 (같은 seed+같은 조작=같은 결과, 직렬화 복원 후에도 동일, createRng)
 *  [6] eligibleAugments 챔피언 필터 (보너스 체크)
 */
import {
  createRng,
  eligibleAugments,
  newGame,
  nextRound,
  rerollSlot,
  goldenReroll,
  pickAugment,
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

/* ---------------- [3] 리롤 제한 ---------------- */
section('3. 리롤 1회 제한 + 황금 리롤');
{
  const g = newGame({ augments: AUGS, champion: CHAMP, seed: 777 });
  const round = nextRound(g);
  const before1 = round.slots[1].apiName;
  const re1 = rerollSlot(g, 1);
  check('리롤 시 다른 증강으로 교체', re1.apiName !== before1);
  check('리롤은 같은 등급 유지', re1.tier === round.tier, re1.tier + ' vs ' + round.tier);
  check('rerolled[1]=true', round.rerolled[1] === true);
  checkThrows('같은 슬롯 2번째 리롤은 예외', () => rerollSlot(g, 1));
  const re0 = rerollSlot(g, 0);
  check('다른 슬롯은 리롤 가능', re0 && typeof re0.apiName === 'string');
  checkThrows('잘못된 슬롯 인덱스는 예외', () => rerollSlot(g, 9));

  // 황금 리롤: 한 단계 상위 등급 (프리즘이면 프리즘 유지)
  const beforeGold = round.slots[2];
  const ga = goldenReroll(g, 2);
  check('황금 리롤 등급 상승', ga.tier === TIER_UP[beforeGold.tier],
    beforeGold.tier + ' → ' + ga.tier);
  check('goldenUsed=true', g.goldenUsed === true);
  check('round.golden=2', round.golden === 2);
  checkThrows('같은 라운드 2번째 황금 리롤은 예외', () => goldenReroll(g, 0));
  pickAugment(g, 2);
  nextRound(g);
  checkThrows('다음 라운드에서도 황금 리롤 불가 (게임당 1회)', () => goldenReroll(g, 0));

  // 황금 리롤로 등급이 오른 슬롯도 일반 리롤은 별개 (새 게임에서 확인)
  const g2 = newGame({ augments: AUGS, champion: CHAMP, seed: 778 });
  const r2 = nextRound(g2);
  const upped = goldenReroll(g2, 0);
  const reAfterGolden = rerollSlot(g2, 0);
  check('황금 리롤 후 일반 리롤 가능(별개 카운트)', reAfterGolden.apiName !== upped.apiName);
  check('황금 리롤 후 일반 리롤은 오른 등급 기준', reAfterGolden.tier === upped.tier,
    reAfterGolden.tier + ' vs ' + upped.tier);
  check('r2 참조 유지 확인', r2.slots[0].apiName === reAfterGolden.apiName);

  // 프리즘 슬롯 황금 리롤 → 프리즘 유지 (프리즘 라운드가 나올 때까지 시드 탐색)
  let prismChecked = false;
  for (let s = 0; s < 400 && !prismChecked; s++) {
    const gp = newGame({ augments: AUGS, champion: CHAMP, seed: 5000 + s });
    const rp = nextRound(gp);
    if (rp.tier === 'prismatic') {
      const gaP = goldenReroll(gp, 0);
      check('프리즘 슬롯 황금 리롤은 프리즘 유지', gaP.tier === 'prismatic', gaP.tier);
      prismChecked = true;
    }
  }
  check('프리즘 라운드 케이스 확보', prismChecked);
}

/* ---------------- [4] 중복 금지 (스트레스: 슬롯 3개 전부 리롤 + 황금) ---------------- */
section('4. 중복 금지');
{
  let dupGames = 0;
  for (let s = 0; s < 100; s++) {
    const g = newGame({ augments: AUGS, champion: CHAMP, seed: 1000 + s });
    for (let r = 0; r < 4; r++) {
      const round = nextRound(g);
      for (let i = 0; i < round.slots.length; i++) rerollSlot(g, i);
      if (!g.goldenUsed) goldenReroll(g, r % 3);
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
      if (r === 1) {
        goldenReroll(g, 0);
        trace.push(round.slots[0].apiName);
      }
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
  // 프리즘이 아예 없는 풀: 골드 슬롯 황금 리롤은 실버로 강등되지 않고 골드를 유지해야 함
  const noPrism = [];
  for (let i = 1; i <= 8; i++) noPrism.push({ apiName: 'NP_silver_' + i, tier: 'silver', enabled: true });
  for (let i = 1; i <= 8; i++) noPrism.push({ apiName: 'NP_gold_' + i, tier: 'gold', enabled: true });
  let goldChecked = false;
  for (let s = 0; s < 400 && !goldChecked; s++) {
    const g = newGame({ augments: noPrism, champion: CHAMP, seed: 9000 + s });
    const r = nextRound(g);
    if (r.tier === 'gold') {
      const ga = goldenReroll(g, 0);
      check('프리즘 고갈 시 골드 슬롯 황금 리롤은 골드 유지(실버 강등 금지)',
        ga.tier === 'gold', ga.tier);
      goldChecked = true;
    }
  }
  check('골드 라운드 케이스 확보', goldChecked);
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
