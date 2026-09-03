/**
 * scripts/test-fidelity.mjs — 실측 재현 충실도 감사 (V1, Node v14 호환)
 * 실행: node scripts/test-fidelity.mjs   (실패 시 exit 1)
 *
 * 목적: 시뮬레이터(docs/js/draft.js + docs/data/*.json 실데이터)가
 * 스터디의 실측 패턴을 재현하는지 검증한다.
 * 근거: research/AUGMENT-POOLS-STUDY.md §3, research/data/eligibility-notes.json,
 *       research/raw/11-empirical-pools.md (챔피언 6명 실측: 징크스/브랜드/말파이트/제드/소라카/다리우스)
 *
 * 검증 항목:
 *  [1] 기준1 — 마나 게이트: 제드(기력)에게 마나 증강 3종 절대 미제시, OceanSoul은 보류(전원 제시) (11 §3-3)
 *  [2] 기준2 — 대시 게이트 5종: 6인 중 대시 보유자(말파이트 R·제드 W)만 (11 §3-5, 패턴 001100)
 *  [3] 기준3 — 서포트/아군힐 게이트 7종: 6인 중 소라카만 + 블라디미르×MercysStrike 미제시(26.15 버그픽스 재현) (11 §3-4)
 *  [4] 기준4 — Spin To Win 화이트리스트: 6인 중 제드·다리우스만 (11 §3-1, 위키 적격 목록)
 *  [5] 기준5 — 속박 게이트 5종: 제드(하드 CC 없음) 미제시 (11 §3-6)
 *  [6] 기준6 — 풀 비대칭(말파이트 최대·징크스 최소, 11 §4-5) + 가중 추출 분포(favored ≈2배)
 *  [7] 추가 — Draw Your Sword: 원거리 비원딜(브랜드·소라카)에게 미제시 — 클래스 좁힘 이진 이식 (11 §4-1)
 *  [8] 추가 — 스킬 증강 30종 category==='ability' 표기 (eligibility-notes abilityAugments, 10 §1.6)
 *  [9] 추가 — enhancedSkill이 requiredProps 충족 스킬로만 지정되는지 1000회+ 샘플링 (slot 고정·spellExclude 포함)
 *  [10] 추가 — trackL9 on 시 스킬 증강 등장 빈도 유의 상승 (z > 4)
 *  [11] 추가 — confidence 규율 감사: augments.json의 모든 이진 필터를 eligibility-notes로 역추적
 *       (official/datamined/empirical만 이진 허용, community는 이진 금지 — STUDY §3-4 3단계)
 *
 * real-mapping 계약 [검증 기준] 1~5 실데이터 전수 감사 (research/ABILITY-AUGMENT-DATA.md,
 * research/data/ability-augment-map.json 306건):
 *  [12] 계약 기준1 — offered 287건 전수 champion-level 대조 (전 confidence, 풀에 실재해야 함)
 *  [13] 계약 기준2 — excluded 19건 부재 (풀 부재/spellExclude 이식/지정 샘플링, 보류 2건은 사유 검증)
 *  [14] 계약 기준3 — 지형 생성됨(Terraind) 적격 6명 전수: 173명 전원 풀 대조로 과잉/누락 0
 *  [15] 계약 기준4 — spellPin 86건 정합 + 실지정 표본 29건(ability pin 증강 16종×각 2건, 시드 5개씩)
 *  [16] 계약 기준5 — 제드×마나·대시 게이트 기존 패턴: 위 [1]·[2] 섹션이 담당 (중복 구현 없음)
 *  [17] 추가 감사 — champions.json propsSource 분포가 생성기 보고와 일치
 *       (enrich-champions.cjs 2026-09-03 실행 보고: traits 296 / merged 389 / keywords 7)
 *  [18] 추가 감사 — community 근거의 하드 필터 유입 0 역추적 (map 61건 전수 + 이진 필터 역방향)
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
/* goldenReroll import 제거 — 황금 리롤 자동 발동(G-AUTO) 리워크로 수동 API 삭제 (raw/19).
 * 풀 스트레스는 goldenChance=1 강제로 상급 추출(자동 발동) 경로를 그대로 유지한다. */
import {
  eligibleAugments,
  newGame,
  nextRound,
  rerollSlot,
  pickAugment,
} from '../docs/js/draft.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const loadJson = (p) => JSON.parse(readFileSync(join(__dirname, p), 'utf8'));

const AUGMENTS = loadJson('../docs/data/augments.json').augments;
const CHAMPIONS = loadJson('../docs/data/champions.json').champions;
const NOTES = loadJson('../research/data/eligibility-notes.json');
const MAP = loadJson('../research/data/ability-augment-map.json');

/* ---------------- 테스트 하네스 ---------------- */
let passCount = 0;
let failCount = 0;
function check(name, cond, detail) {
  if (cond) {
    passCount++;
    console.log('  PASS  ' + name);
  } else {
    failCount++;
    console.log('  FAIL  ' + name + (detail !== undefined ? ' — ' + detail : ''));
  }
}
function section(title) {
  console.log('\n=== ' + title + ' ===');
}

/* ---------------- 공통 헬퍼 ---------------- */
const champ = (id) => {
  const c = CHAMPIONS.find((x) => x.id === id);
  if (!c) throw new Error('champions.json에 없음: ' + id);
  return c;
};
const SIX = ['Jinx', 'Brand', 'Malphite', 'Zed', 'Soraka', 'Darius'];
const pools = {};
for (const id of SIX) pools[id] = eligibleAugments(AUGMENTS, champ(id));
const inPool = (id, api) => pools[id].some((a) => a.apiName === api);
/** 실측 패턴 문자열(징브말제소다 순서, 1=제시 가능) 대조 */
function patternOf(api) {
  return SIX.map((id) => (inPool(id, api) ? '1' : '0')).join('');
}

/** 풀 스트레스 게임 1판: 전 라운드·전 슬롯 리롤 → 노출 최대화. 노출 apiName 목록 반환.
 *  갱신 사유(메커니즘 변경): 수동 goldenReroll 삭제 — goldenChance=1 강제로 실버/골드
 *  화면의 첫 리롤이 항상 자동 발동해 상급 풀 추출 경로 노출이 종전과 동등하게 유지된다. */
function stressGame(c, seed, opts) {
  const g = newGame(Object.assign({ augments: AUGMENTS, champion: c, seed, goldenChance: 1 }, opts || {}));
  const exposedSlots = [];
  for (let r = 0; r < 4; r++) {
    const round = nextRound(g);
    for (let i = 0; i < round.slots.length; i++) rerollSlot(g, i);
    for (let i = 0; i < round.slots.length; i++) exposedSlots.push(round.slots[i]);
    if (round.slots.length > 0) pickAugment(g, 0);
  }
  return { game: g, slots: exposedSlots };
}

/* ---------------- [1] 기준1: 마나 게이트 ---------------- */
section('1. [기준1] 마나 게이트 — 제드(기력) 미제시 (11 §3-3, empirical+datamined)');
{
  const MANA3 = ['ARAM_Overflow', 'ARAM_Juiced', 'ARAM_MindtoMatter'];
  for (const api of MANA3) {
    check('제드 풀에 ' + api + ' 없음 (패턴 x11x11, 제드=0)', !inPool('Zed', api), patternOf(api));
    check('마나 사용자(징크스·브랜드) 풀에 ' + api + ' 있음', inPool('Jinx', api) && inPool('Brand', api));
  }
  // OceanSoul은 실측상 전원 등재 → requiresMana 미부여가 정답 (STUDY §3-1 "보류")
  check('ARAM_OceanSoul은 제드에게도 제시 (실측: 전원 등재 — 보류 판단 재현)', inPool('Zed', 'ARAM_OceanSoul'), patternOf('ARAM_OceanSoul'));
  // 풀 스트레스: 200게임 동안 제드에게 마나 증강 노출 0건
  let exposed = 0;
  for (let s = 0; s < 200; s++) {
    const { game } = stressGame(champ('Zed'), 100000 + s);
    for (const api of MANA3) if (game.used.indexOf(api) !== -1) exposed++;
  }
  check('200게임 풀스트레스: 제드에게 마나 증강 노출 0건', exposed === 0, exposed + '건');
}

/* ---------------- [2] 기준2: 대시 게이트 ---------------- */
section('2. [기준2] 대시 게이트 5종 — 실측 패턴 001100 재현 (11 §3-5)');
{
  const DASH5 = ['ARAM_Dashing', 'ARAM_Earthwake', 'ARAM_OutlawsGrit', 'ARAM_ShadowRunner', 'SwiftAndSafe'];
  for (const api of DASH5) {
    check(api + ' 패턴 001100 (말파이트 R·제드 W만)', patternOf(api) === '001100', patternOf(api));
  }
}

/* ---------------- [3] 기준3: 서포트/아군힐 게이트 ---------------- */
section('3. [기준3] 아군 힐/실드 계열 — 6인 중 소라카만 (11 §3-4)');
{
  const SUPPORT7 = ['ARAM_SonicBoom', 'ARAM_WeeWooWeeWoo', 'ARAM_EmpoweredByTheFaithful',
    'MercysStrike', 'ARAM_AllForYou', 'ARAM_SpiritBomb', 'EmpyreanPromise'];
  for (const api of SUPPORT7) {
    check(api + ' 패턴 000010 (소라카만)', patternOf(api) === '000010', patternOf(api));
  }
  // 26.15 공식 버그픽스 재현: 블라디미르(non-support)에게 MercysStrike 미제시
  const vladPool = eligibleAugments(AUGMENTS, champ('Vladimir'));
  check('블라디미르에게 MercysStrike 미제시 (26.15 버그픽스 재현, official)',
    !vladPool.some((a) => a.apiName === 'MercysStrike'));
}

/* ---------------- [4] 기준4: Spin To Win 화이트리스트 ---------------- */
section('4. [기준4] Spin To Win 화이트리스트 (위키 적격 목록, official)');
{
  check('SpinToWin 패턴 000101 (제드 E·다리우스 Q만)', patternOf('ARAM_SpinToWin') === '000101', patternOf('ARAM_SpinToWin'));
  check('가렌(화이트리스트 등재)에게 제시',
    eligibleAugments(AUGMENTS, champ('Garen')).some((a) => a.apiName === 'ARAM_SpinToWin'));
  check('애쉬(목록 밖)에게 미제시',
    !eligibleAugments(AUGMENTS, champ('Ashe')).some((a) => a.apiName === 'ARAM_SpinToWin'));
}

/* ---------------- [5] 기준5: 속박 게이트 ---------------- */
section('5. [기준5] 속박(immobilize) 게이트 5종 — 제드 미제시 (11 §3-6)');
{
  const IMMOB5 = ['ARAM_Cruelty', 'ARAM_SlapAround', 'SoulEater', 'ARAM_Impassable', 'ARAM_CourageoftheColossus'];
  for (const api of IMMOB5) {
    check(api + ': 제드(하드 CC 없음) 미제시', !inPool('Zed', api), patternOf(api));
    check(api + ': 속박 보유(브랜드·말파이트·다리우스) 제시', inPool('Brand', api) && inPool('Malphite', api) && inPool('Darius', api));
  }
  // ⚠ 알려진 근사 한계(실패 아님): 실측상 Cruelty는 속박 E 보유 징크스에게도 부재(11 §4-4)지만
  // 원인(클래스 오버라이드) 미확인이라 시뮬레이터는 킷 기반으로 징크스에게 제시한다 — 정보 로그만.
  console.log('  INFO  Cruelty×징크스: 시뮬=' + (inPool('Jinx', 'ARAM_Cruelty') ? '제시' : '미제시')
    + ' / 실측=미제시 (원인 미확인 반례 — eligibility-notes classBias.immobilize notes, 이진 이식 보류가 규율상 정답)');
}

/* ---------------- [6] 기준6: 풀 비대칭 + 가중 추출 분포 ---------------- */
section('6. [기준6] 챔피언별 풀 비대칭 + 가중 추출 분포 (11 §4-5, STUDY §3-2)');
{
  const sizes = {};
  for (const id of SIX) sizes[id] = pools[id].length;
  const sizeStr = SIX.map((id) => id + '=' + sizes[id]).join(', ');
  // 계약 검증 기준 6의 바(test-e2e와 동일): 방향성 — 말파이트 최대, 말파이트 > 징크스.
  check('말파이트 풀 최대 (실측: op.gg 193종 최대 — 전원 이상)',
    SIX.every((id) => sizes.Malphite >= sizes[id]), sizeStr);
  check('말파이트 풀 > 징크스 풀 (실측 방향성 재현)', sizes.Malphite > sizes.Jinx, sizeStr);
  // 갱신 사유(2026-09-03, 풀 게이트 이식): 극악무도 근접 AD 게이트로 다리우스가 1종을 더 잃어
  // (raw/11 111010의 다리우스 부재를 이제 시뮬이 재현) 징크스와 동수가 될 수 있다 —
  // 방향성 주장을 "징크스 ≤ 다리우스"로 완화 (소라카 비교는 유지).
  check('징크스 풀 < 소라카 풀, ≤ 다리우스 풀 (AP·힐 제외 > 크리 제외 방향성)',
    sizes.Jinx < sizes.Soraka && sizes.Jinx <= sizes.Darius, sizeStr);
  // ⚠ 알려진 근사 한계(실패 아님): 실측 최소는 징크스(op.gg 169)지만, 징크스를 최소로 만드는
  // 큐레이션 게이트(Echo Cast·Quickstep·힐스탯류 등 — 11 §4-6)는 confidence 부족(중간/추정)으로
  // 이진 미이식이라 시뮬에서는 제드·브랜드가 더 작을 수 있다. AMNET 실측도 제드 107 < 징크스 108.
  console.log('  INFO  풀 크기: ' + sizeStr);

  // 가중 추출: 징크스에게 favored(Marksman) 실버 증강 vs 중립 실버 증강 노출 빈도 ≈ 2:1
  const jinx = champ('Jinx');
  const jinxPool = pools.Jinx;
  const favSilver = jinxPool.find((a) => a.tier === 'silver' && Array.isArray(a.favoredClasses) && a.favoredClasses.indexOf('Marksman') !== -1);
  const neutralSilver = jinxPool.find((a) => a.tier === 'silver'
    && (!a.favoredClasses || a.favoredClasses.length === 0)
    && (!a.disfavoredClasses || a.disfavoredClasses.length === 0)
    && a.category === 'normal');
  check('표본 증강 존재 (favored 실버 + 중립 실버)', !!favSilver && !!neutralSilver,
    'fav=' + (favSilver && favSilver.apiName) + ' neutral=' + (neutralSilver && neutralSilver.apiName));
  if (favSilver && neutralSilver) {
    let favN = 0;
    let neuN = 0;
    for (let s = 0; s < 800; s++) {
      const { game } = stressGame(jinx, 200000 + s);
      if (game.used.indexOf(favSilver.apiName) !== -1) favN++;
      if (game.used.indexOf(neutralSilver.apiName) !== -1) neuN++;
    }
    const ratio = neuN > 0 ? favN / neuN : Infinity;
    check('favored 노출 / 중립 노출 비율 1.4 이상 (기대 ≈2.0, WEIGHT_FAVORED)',
      ratio >= 1.4, favSilver.apiName + '=' + favN + ' / ' + neutralSilver.apiName + '=' + neuN + ' (비율 ' + ratio.toFixed(2) + ')');
  }
}

/* ---------------- [7] Draw Your Sword 클래스 좁힘 ---------------- */
section('7. [추가] Draw Your Sword — 원거리 비원딜(브랜드·소라카) 미제시 (11 §4-1, empirical)');
{
  check('DYS 패턴 100000 (6인 중 징크스만 — 실측 100000/100000 재현)',
    patternOf('ARAM_DrawYourSword') === '100000', patternOf('ARAM_DrawYourSword'));
  check('브랜드(원거리 메이지) 미제시', !inPool('Brand', 'ARAM_DrawYourSword'));
  check('소라카(원거리 서포터) 미제시', !inPool('Soraka', 'ARAM_DrawYourSword'));
  // 풀 스트레스: 브랜드 300게임 동안 DYS 노출 0건
  let exposed = 0;
  for (let s = 0; s < 300; s++) {
    const { game } = stressGame(champ('Brand'), 300000 + s);
    if (game.used.indexOf('ARAM_DrawYourSword') !== -1) exposed++;
  }
  check('300게임 풀스트레스: 브랜드에게 DYS 노출 0건', exposed === 0, exposed + '건');
}

/* ---------------- [8] 스킬 증강 30종 category ---------------- */
section('8. [추가] 스킬 증강 30종 category==="ability" (10 §1.6, datamined)');
{
  const noteAbility = NOTES.abilityAugments.augments.map((a) => a.apiName);
  check('eligibility-notes 스킬 증강 목록 30종', noteAbility.length === 30, String(noteAbility.length));
  const byApi = {};
  AUGMENTS.forEach((a) => { byApi[a.apiName] = a; });
  let missing = [];
  let wrongCat = [];
  for (const api of noteAbility) {
    if (!byApi[api]) missing.push(api);
    else if (byApi[api].category !== 'ability') wrongCat.push(api + '(' + byApi[api].category + ')');
  }
  check('30종 전부 augments.json에 존재', missing.length === 0, missing.join(','));
  check('30종 전부 category==="ability"', wrongCat.length === 0, wrongCat.join(','));
  const extra = AUGMENTS.filter((a) => a.category === 'ability' && noteAbility.indexOf(a.apiName) === -1);
  check('notes 목록 밖의 ability 표기 없음 (합계 정확히 30종)', extra.length === 0,
    extra.map((a) => a.apiName).join(','));
  // 등급 분포 재확인: 실버 7 / 골드 17 / 프리즘 6 (10 §1.6 게임 데이터 기준)
  const dist = { silver: 0, gold: 0, prismatic: 0 };
  AUGMENTS.forEach((a) => { if (a.category === 'ability') dist[a.tier]++; });
  check('스킬 증강 등급 분포 실버7/골드17/프리즘6', dist.silver === 7 && dist.gold === 17 && dist.prismatic === 6,
    JSON.stringify(dist));
}

/* ---------------- [9] enhancedSkill 적격성 샘플링 ---------------- */
section('9. [추가] enhancedSkill 적격성 — 1000회+ 샘플링 (STUDY §3-3 근사 규칙 준수)');
{
  // 스킬 증강 노출이 많이 나오도록 여러 챔피언 로테이션 (spellExclude 대상 챔피언 포함)
  const ROTATION = ['Jinx', 'Brand', 'Malphite', 'Zed', 'Soraka', 'Darius',
    'Yasuo', 'Akshan', 'Katarina', 'Shaco', 'Draven', 'Illaoi', 'Garen', 'Ashe'];
  let samples = 0;
  let noKey = 0;
  const badProps = [];
  const badSlot = [];
  const badExclude = [];
  let seed = 400000;
  while (samples < 1000) {
    for (const id of ROTATION) {
      const c = champ(id);
      const { slots } = stressGame(c, seed++);
      for (const s of slots) {
        if (s.category !== 'ability') continue;
        samples++;
        if (!s.enhancedSkill || ['Q', 'W', 'E', 'R'].indexOf(s.enhancedSkill.key) === -1) {
          noKey++;
          continue;
        }
        const key = s.enhancedSkill.key;
        const r = s.restrictions || {};
        // (a) 슬롯 고정형은 그 슬롯이어야 함
        if (typeof r.slot === 'string' && key !== r.slot) {
          badSlot.push(s.apiName + '@' + id + '→' + key);
        }
        // (b) spellExclude에 걸린 스킬은 금지 (공식 버그픽스 재현: Yasuo E 등)
        if (r.spellExclude && Array.isArray(r.spellExclude[id]) && r.spellExclude[id].indexOf(key) !== -1) {
          badExclude.push(s.apiName + '@' + id + '→' + key);
        }
        // (c) requiredProps(abilityPropsAll)가 있으면 지정 스킬이 전부 충족해야 함
        if (Array.isArray(r.abilityPropsAll) && r.abilityPropsAll.length > 0 && !r.slot) {
          const spell = (c.spells || []).find((sp) => sp.key === key);
          const ok = spell && Array.isArray(spell.props)
            && r.abilityPropsAll.every((p) => spell.props.indexOf(p) !== -1);
          if (!ok) badProps.push(s.apiName + '@' + id + '→' + key + ' req=' + r.abilityPropsAll.join('+'));
        }
      }
    }
    if (seed > 500000) break; // 안전 상한
  }
  check('스킬 증강 제시 샘플 1000회 이상 수집', samples >= 1000, samples + '회');
  check('전 샘플에 enhancedSkill.key(Q/W/E/R) 존재', noKey === 0, noKey + '건');
  check('슬롯 고정형(Bread류)은 지정 슬롯 그대로', badSlot.length === 0, badSlot.slice(0, 5).join(' | '));
  check('spellExclude 스킬로는 지정되지 않음 (Yasuo E×Recursion 등 26.14~15 버그픽스 재현)',
    badExclude.length === 0, badExclude.slice(0, 5).join(' | '));
  check('requiredProps 충족 스킬로만 지정 (' + samples + '회 중 위반 0)', badProps.length === 0,
    badProps.slice(0, 8).join(' | '));
}

/* ---------------- [10] trackL9 스킬 증강 빈도 상승 ---------------- */
section('10. [추가] trackL9 — 스킬 증강 등장 빈도 유의 상승 (09 §2 근사 재현)');
{
  const c = champ('Malphite');
  function abilityShare(trackL9, seedBase, games) {
    let ability = 0;
    let total = 0;
    for (let s = 0; s < games; s++) {
      const { game } = stressGame(c, seedBase + s, { trackL9 });
      const byApi = {};
      game.pool.forEach((a) => { byApi[a.apiName] = a; });
      for (const api of game.used) {
        total++;
        if (byApi[api] && byApi[api].category === 'ability') ability++;
      }
    }
    return { ability, total, p: ability / total };
  }
  const off = abilityShare(false, 600000, 1200);
  const on = abilityShare(true, 700000, 1200);
  const pPool = (off.ability + on.ability) / (off.total + on.total);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / off.total + 1 / on.total));
  const z = (on.p - off.p) / se;
  check('trackL9 on에서 스킬 증강 노출 비중 상승', on.p > off.p,
    'off=' + (off.p * 100).toFixed(2) + '% on=' + (on.p * 100).toFixed(2) + '%');
  check('상승이 통계적으로 유의 (z > 4)', z > 4, 'z=' + z.toFixed(2)
    + ' (off ' + off.ability + '/' + off.total + ', on ' + on.ability + '/' + on.total + ')');
}

/* ---------------- [11] confidence 규율 감사 ---------------- */
section('11. [추가] confidence 규율 — 이진 필터의 eligibility-notes 역추적 (STUDY §3-4 3단계)');
{
  // 이진 이식이 허용되는 confidence (STUDY §3-4 3단계: "empirical 이상")
  const OK_CONF = ['official', 'datamined', 'empirical'];
  // apiName → 허용된 이진 restriction 키 집합 (eligibility-notes에서 구축)
  const allowed = {}; // { apiName: Set(keys) }
  const allow = (api, key) => {
    if (!allowed[api]) allowed[api] = {};
    allowed[api][key] = true;
  };

  // (a) abilityAugments: requiredProps → abilityPropsAll, slot → slot (위키·게임데이터 큐레이션 = official/datamined급)
  for (const a of NOTES.abilityAugments.augments) {
    if (Array.isArray(a.requiredProps) && a.requiredProps.length > 0) allow(a.apiName, 'abilityPropsAll');
    if (a.slot) allow(a.apiName, 'slot');
  }
  // (b) classBias: confidence가 empirical 이상인 클러스터의 augments만 이진 허용
  const CLUSTER_KEY = {
    mana: ['requiresMana'],
    adCrit: ['classRequired'],
    ap: ['classRequired'],
    dash: ['abilityProps'],
    // 이중 게이트: Support 클래스 + 킷에 힐/실드(OR) — classRequired만으로는 DDragon 태그상
    // Support인 브랜드가 통과해 실측 000010(소라카만)이 깨짐 (11 §3-4)
    allyHealShield: ['classRequired', 'abilityProps'],
    immobilize: ['abilityProps'],
    sniper: ['rangedOnly'],
    critStats: null,          // 실측 판정: 제외 아님 — 가중치만 (이진 금지)
    selfHealCircle: ['abilityProps'],
    meleeCluster: ['meleeOnly'],
    'buildTags(mBuildTags)': null, // 서버 사용 여부 미확증 — 이진 금지
    ALL: null,
  };
  for (const cb of NOTES.classBias) {
    const conf = cb.confidence;
    const keys = CLUSTER_KEY[cb.augmentTag !== undefined ? cb.augmentTag : '__single__'];
    if (cb.augmentTag && Array.isArray(cb.augments) && keys && OK_CONF.indexOf(conf) !== -1) {
      for (const api of cb.augments) for (const key of keys) allow(api, key);
    }
    if (cb.augmentApiName && OK_CONF.indexOf(conf) !== -1) {
      // MercysStrike(official, Support 게이트) / DrawYourSword(empirical, 클래스 좁힘 + official rangedOnly)
      if (cb.augmentApiName === 'MercysStrike') allow('MercysStrike', 'classRequired');
      if (cb.augmentApiName === 'ARAM_DrawYourSword') {
        allow('ARAM_DrawYourSword', 'rangedOnly');
        allow('ARAM_DrawYourSword', 'classRequired');
      }
    }
  }
  // 예외 규정: OceanSoul은 실측상 전원 등재라 보류(STUDY §3-1) → requiresMana 금지
  if (allowed.ARAM_OceanSoul) delete allowed.ARAM_OceanSoul.requiresMana;
  // 예외 규정: meleeCluster 중 StuckInHereWithMe는 신뢰도 '중간'(notes) → 이진 금지
  if (allowed.ARAM_StuckInHereWithMe) delete allowed.ARAM_StuckInHereWithMe.meleeOnly;
  // 예외 규정(2026-09-03, ability-augment-map.json — 3차 실매핑의 offered 반례로 근사 해제):
  //  - Quickstep: 원거리 켄넨 R offered(official, 26.12 패치노트) → meleeOnly 반증, 가중치 강등
  //  - TitansPulse: 원거리 아리·리산드라·블라디미르 offered(empirical, mayhemmeta 16챔프) → meleeOnly 반증
  //  - SkilledSniper: 근접 Locke Q offered(official, 26.15 패치노트) → rangedOnly 반증
  // 계약 검증 기준 1("offered와 충돌하면 필터 완화")에 따른 완화 — enrich-augments.cjs 주석·로그 참조
  if (allowed.ARAM_Quickstep) delete allowed.ARAM_Quickstep.meleeOnly;
  if (allowed.TitansPulse) delete allowed.TitansPulse.meleeOnly;
  if (allowed.ARAM_SkilledSniper) delete allowed.ARAM_SkilledSniper.rangedOnly;
  // 예외 규정: Phenomenal Evil은 개별 게이트가 계열과 다름(징크스 포함) → classRequired 이진 금지
  if (allowed.ARAM_PhenomenalEvil) delete allowed.ARAM_PhenomenalEvil.classRequired;
  // 예외 규정: Draw Your Sword는 adCrit 계열이지만 rangedOnly+클래스 좁힘으로 별도 처리(위 augmentApiName 항목)
  // 추가 근거원(2026-09-03, research/data/class-tier-adjust.json — 4차 전수조사 풀 게이트):
  // poolGateCandidates(status='confirmed', evidence empirical 이상)의 championExclude 게이트
  // (AD/크리 코어 10종 dmg=ap 제외 + 극악무도 근접 AD 제외 — enrich-augments.cjs 2.6이 이식).
  // mana-core-gate는 기존 eligibility-notes classBias(mana)의 requiresMana와 동일 근거라 통과.
  const ADJUST = loadJson('../research/data/class-tier-adjust.json');
  for (const gate of ADJUST.poolGateCandidates) {
    if (gate.status !== 'confirmed' || OK_CONF.indexOf(gate.evidence) === -1) continue;
    if (gate.id === 'mana-core-gate') continue; // requiresMana — notes 근거로 이미 허용됨
    for (const api of gate.augments) allow(api, 'championExclude');
  }

  // (c) championSpecific: confidence empirical 이상 + rule exclude/excludeSpell만 이진 허용
  for (const cs of NOTES.championSpecific) {
    if (OK_CONF.indexOf(cs.confidence) === -1) continue; // community(칼리스타 effectReplace)는 불허
    if (cs.rule === 'exclude') allow(cs.augmentApiName, 'championExclude');
    if (cs.rule === 'excludeSpell') allow(cs.augmentApiName, 'spellExclude');
  }
  // (d) otherRestrictions: SpinToWin kitRequired(official, 위키 적격 목록) → championWhitelist
  for (const or of NOTES.otherRestrictions) {
    if (or.confidence !== 'official') continue;
    if (or.augmentApiName === 'ARAM_SpinToWin' && or.rule === 'kitRequired') {
      allow('ARAM_SpinToWin', 'championWhitelist');
    }
    // itemExclude/mutualExclude/teamLimit/mapOnly는 시뮬 범위 밖(1인·단일맵·아이템 미추적) — note로만 기록 허용
  }

  const BINARY_KEYS = ['rangedOnly', 'meleeOnly', 'requiresMana', 'classRequired', 'classExcluded',
    'championWhitelist', 'championExclude', 'abilityProps', 'abilityPropsAll', 'slot', 'spellExclude'];
  const violations = [];
  for (const a of AUGMENTS) {
    const r = a.restrictions;
    if (!r) continue;
    for (const k of BINARY_KEYS) {
      if (r[k] === undefined || r[k] === null || r[k] === false) continue;
      if (Array.isArray(r[k]) && r[k].length === 0) continue;
      if (!(allowed[a.apiName] && allowed[a.apiName][k])) {
        violations.push(a.apiName + '.' + k + ' (근거 미추적 — community이거나 notes에 없음)');
      }
    }
  }
  check('이진 필터 전수 역추적: 근거 없는(또는 community 출처) 이진 필터 0건',
    violations.length === 0, violations.join(' | '));

  // 역방향: empirical 이상 근거가 있는 핵심 이진 게이트가 실제로 이식되어 있는지 (누락 검출)
  const byApi = {};
  AUGMENTS.forEach((a) => { byApi[a.apiName] = a; });
  const missingPorts = [];
  for (const api of Object.keys(allowed)) {
    const a = byApi[api];
    if (!a) continue; // notes에만 있고 데이터 미등재 (_unresolved 계열)
    if (a.enabled === false) continue; // 비활성 증강은 이식 불요
    for (const k of Object.keys(allowed[api])) {
      const v = a.restrictions && a.restrictions[k];
      const present = v !== undefined && v !== null && v !== false
        && !(Array.isArray(v) && v.length === 0);
      if (!present) missingPorts.push(api + '.' + k);
    }
  }
  check('empirical 이상 근거의 이진 게이트 이식 누락 0건', missingPorts.length === 0, missingPorts.join(' | '));

  // community 항목이 이진으로 넘어오지 않았는지 개별 확인 (칼리스타×Dashing effectReplace)
  const dashing = byApi.ARAM_Dashing;
  const dr = dashing.restrictions || {};
  check('칼리스타×Dashing(community, effectReplace)이 이진 필터로 미이식',
    !dr.championExclude && !dr.championWhitelist && !dr.spellExclude);
  // 크리 스탯류(empirical: "제외 아님 — 가중치만")가 이진 없이 favored만 갖는지
  const critStats = (NOTES.classBias.find((c2) => c2.augmentTag === 'critStats') || {}).augments || [];
  const critBad = critStats.filter((api) => {
    const a = byApi[api];
    if (!a || !a.restrictions) return false;
    return BINARY_KEYS.some((k) => {
      const v = a.restrictions[k];
      return v !== undefined && v !== null && v !== false && !(Array.isArray(v) && v.length === 0);
    });
  });
  check('크리 스탯류 7종은 이진 제외 없음(가중치만 — 11 §3-1 재현)', critBad.length === 0, critBad.join(','));
  // 상호배제쌍 Vampirism↔Perseverance는 현재 비활성 (notes otherRestrictions official)
  check('Vampirism·ARAM_Perseverance 비활성 상태 유지',
    byApi.Vampirism.enabled === false && byApi.ARAM_Perseverance.enabled === false);
}

/* ================================================================== */
/* real-mapping 계약 [검증 기준] 1~5 실데이터 전수 감사                   */
/* (research/ABILITY-AUGMENT-DATA.md + research/data/ability-augment-map.json) */
/* ================================================================== */

/** 공용: apiName → 증강, 챔피언 id → 풀 Set (전 173명 lazy) */
const BY_API = {};
AUGMENTS.forEach((a) => { BY_API[a.apiName] = a; });
const POOL_CACHE = {};
function poolSet(champId) {
  if (!POOL_CACHE[champId]) {
    POOL_CACHE[champId] = new Set(eligibleAugments(AUGMENTS, champ(champId)).map((a) => a.apiName));
  }
  return POOL_CACHE[champId];
}
/** 단일 증강 게임으로 enhancedSkill 지정 키를 1회 관측 (제시 불가면 null) */
function designateOnce(augApi, champId, seed) {
  const g = newGame({ augments: [BY_API[augApi]], champion: champ(champId), seed });
  const round = nextRound(g);
  const s = round.slots[0];
  return (s && s.enhancedSkill) ? s.enhancedSkill.key : null;
}

/* ---------------- [12] 계약 기준1: offered 287건 전수 대조 ---------------- */
section('12. [계약 기준1] offered 287건 전수 champion-level 대조 (풀 실재 증명)');
{
  const offered = MAP.mappings.filter((e) => e.polarity === 'offered');
  check('ability-augment-map offered 287건 로드', offered.length === 287, String(offered.length));
  const violations = [];
  for (const e of offered) {
    if (!CHAMPIONS.some((c) => c.id === e.champion)) {
      violations.push(e.champion + '×' + e.augment + ' — 챔피언 id 미존재');
      continue;
    }
    if (!BY_API[e.augment]) {
      violations.push(e.champion + '×' + e.augment + ' — 증강 apiName 미존재');
      continue;
    }
    if (!poolSet(e.champion).has(e.augment)) {
      violations.push(e.champion + (e.skill ? ' ' + e.skill : '') + '×' + e.augment + ' (' + e.confidence + ') — 풀 부재');
    }
  }
  check('offered 287건(전 confidence) 전부 해당 챔피언 풀에 실재 — 위반 0',
    violations.length === 0, violations.slice(0, 10).join(' | '));
}

/* ---------------- [13] 계약 기준2: excluded 19건 부재 ---------------- */
section('13. [계약 기준2] excluded 19건 부재 (풀/지정 양쪽에서 관측 불가)');
{
  const excluded = MAP.mappings.filter((e) => e.polarity === 'excluded');
  check('ability-augment-map excluded 19건 로드', excluded.length === 19, String(excluded.length));

  // 보류 2건(enrich-augments-log "하드 필터 보류" 사유 검증 — 풀 부재를 요구하면 안 되는 항목):
  //  - Locke×SpecializedEmpowerment(official, skill=null): 패시브 효과 오적용 수정이지 풀 제외가
  //    아님(동 챔피언 Locke E offered official와 모순 방지). 대신 지정이 항상 pin된 E인지 확인.
  //  - Vladimir×MercysStrike(official): 별도 이진 미이식 — 기존 classRequired(Support)가 커버.
  //    풀 부재로 검증(아래 일반 경로).
  const DEFERRED_LOCKE = (e) => e.champion === 'Locke' && e.augment === 'SpecializedEmpowerment' && e.skill === null;
  // Yorick×Terraind(community): 하드 필터 금지 — 부재는 terrain 게이트(datamined 6명 전수)로
  //   창발해야 하며, 이진 필드로 이식되어 있으면 규율 위반([18]에서 재검).
  const bad = [];
  let checkedPool = 0;
  let checkedSpell = 0;
  for (const e of excluded) {
    if (DEFERRED_LOCKE(e)) {
      const pinE = BY_API.SpecializedEmpowerment.restrictions.spellPin.Locke === 'E';
      let always = true;
      for (let s = 0; s < 5; s++) if (designateOnce('SpecializedEmpowerment', 'Locke', 810000 + s) !== 'E') always = false;
      check('보류 항목 Locke×SpecializedEmpowerment: 풀 유지 + 지정은 항상 E(pin, 5시드)',
        poolSet('Locke').has('SpecializedEmpowerment') && pinE && always);
      continue;
    }
    if (e.skill === null || e.augment === 'ARAM_BreadAndButter' || e.augment === 'Terraind') {
      // 챔피언 단위 부재 (Smolder·Vladimir / Jinx는 slot=Q 고정형이라 championExclude 등가 /
      // Yorick은 terrain 게이트 창발 부재)
      checkedPool++;
      if (poolSet(e.champion).has(e.augment)) bad.push(e.champion + '×' + e.augment + ' — 풀에 존재');
      continue;
    }
    // 스킬 슬롯 단위 부재 (official/datamined 14건): spellExclude 이식 + 지정 샘플링(10시드)
    checkedSpell++;
    const r = BY_API[e.augment].restrictions || {};
    const listed = r.spellExclude && Array.isArray(r.spellExclude[e.champion])
      && r.spellExclude[e.champion].indexOf(e.skill) !== -1;
    if (!listed) bad.push(e.champion + ' ' + e.skill + '×' + e.augment + ' — spellExclude 미이식');
    let hit = false;
    let seen = 0;
    for (let s = 0; s < 10; s++) {
      const key = designateOnce(e.augment, e.champion, 820000 + s * 17);
      if (key !== null) seen++;
      if (key === e.skill) hit = true;
    }
    if (seen === 0) bad.push(e.champion + '×' + e.augment + ' — 지정 표본 0(풀 부재?)');
    if (hit) bad.push(e.champion + ' ' + e.skill + '×' + e.augment + ' — 제외 스킬이 지정됨');
  }
  check('excluded 챔피언 단위 ' + checkedPool + '건 전부 풀 부재', bad.filter((b) => b.indexOf('풀에 존재') !== -1).length === 0);
  check('excluded 스킬 단위 ' + checkedSpell + '건 전부 spellExclude 이식 + 10시드 지정 회피',
    bad.length === 0, bad.slice(0, 8).join(' | '));
}

/* ---------------- [14] 계약 기준3: 지형 생성됨 6명 전수 ---------------- */
section('14. [계약 기준3] Terraind 적격 6명 전수 — 173명 전원 대조 (과잉 보유자 0)');
{
  // datamined 전수(raw/14 Trait_CreateTerrain = mayhemmeta 실측 6챔프와 정확 일치)
  const TERRAIN6 = { Anivia: 'W', Azir: 'R', JarvanIV: 'R', Ornn: 'Q', Taliyah: 'R', Trundle: 'E' };
  // (a) champions.json terrain prop 보유 슬롯이 정확히 이 6개인지 (데이터 층)
  const holders = [];
  for (const c of CHAMPIONS) {
    for (const sp of c.spells || []) {
      if (Array.isArray(sp.props) && sp.props.indexOf('terrain') !== -1) holders.push(c.id + '.' + sp.key);
    }
  }
  const expectSlots = Object.keys(TERRAIN6).map((id) => id + '.' + TERRAIN6[id]).sort();
  check('terrain prop 보유 슬롯 = 6개 정확 일치 (datamined 전수)',
    JSON.stringify(holders.slice().sort()) === JSON.stringify(expectSlots), holders.sort().join(', '));
  // (b) 풀 층: 173명 전원 대조 — Terraind는 6명에게만 제시
  const wrongIn = [];
  const wrongOut = [];
  for (const c of CHAMPIONS) {
    const has = poolSet(c.id).has('Terraind');
    if (has && !TERRAIN6[c.id]) wrongIn.push(c.id);
    if (!has && TERRAIN6[c.id]) wrongOut.push(c.id);
  }
  check('Terraind 풀 보유자 = 정확히 6명 (과잉 0)', wrongIn.length === 0, '과잉: ' + wrongIn.join(','));
  check('Terraind 풀 누락 0 (6명 전원 제시)', wrongOut.length === 0, '누락: ' + wrongOut.join(','));
  // (c) 6명 각각 spellPin이 datamined 슬롯과 일치 + 실지정(3시드)
  const pin = (BY_API.Terraind.restrictions || {}).spellPin || {};
  const pinBad = [];
  for (const id of Object.keys(TERRAIN6)) {
    if (pin[id] !== TERRAIN6[id]) pinBad.push(id + ': pin=' + pin[id] + ' 기대=' + TERRAIN6[id]);
    for (let s = 0; s < 3; s++) {
      if (designateOnce('Terraind', id, 830000 + s) !== TERRAIN6[id]) pinBad.push(id + ' 지정 불일치(seed ' + s + ')');
    }
  }
  check('Terraind spellPin 6건 = datamined 슬롯 + 실지정 일치(각 3시드)', pinBad.length === 0, pinBad.join(' | '));
}

/* ---------------- [15] 계약 기준4: spellPin 정합 + 표본 실지정 ---------------- */
section('15. [계약 기준4] spellPin 86건 정합 + 실지정 표본(ability pin 증강 전종×각 2건, 시드 5개)');
{
  // (a) 전수 정합: 총 86건(enrich-augments-log), 챔피언 실존·키 유효·map 근거 존재
  const allPins = []; // {aug, champ, key}
  for (const a of AUGMENTS) {
    const p = a.restrictions && a.restrictions.spellPin;
    if (!p) continue;
    for (const cid of Object.keys(p)) allPins.push({ aug: a.apiName, champ: cid, key: p[cid] });
  }
  check('spellPin 총 86건 (enrich-augments-log 보고와 일치)', allPins.length === 86, String(allPins.length));
  const integ = [];
  const mapSkillOffered = new Set(MAP.mappings
    .filter((e) => e.polarity === 'offered' && e.skill)
    .map((e) => e.augment + '|' + e.champion + '|' + e.skill));
  for (const p of allPins) {
    const c = CHAMPIONS.find((x) => x.id === p.champ);
    if (!c) { integ.push(p.aug + '.' + p.champ + ' — 챔피언 미존재'); continue; }
    if (['Q', 'W', 'E', 'R'].indexOf(p.key) === -1) integ.push(p.aug + '.' + p.champ + ' — 키 이상 ' + p.key);
    if (!(c.spells || []).some((s) => s.key === p.key)) integ.push(p.aug + '.' + p.champ + ' — 챔피언에 ' + p.key + ' 슬롯 없음');
    if (!mapSkillOffered.has(p.aug + '|' + p.champ + '|' + p.key)) {
      integ.push(p.aug + '.' + p.champ + '→' + p.key + ' — map offered(skill 명시) 근거 없음');
    }
  }
  check('spellPin 전수(86건) 정합: 챔피언 실존·키 유효·map offered 근거 역추적', integ.length === 0,
    integ.slice(0, 8).join(' | '));
  // (b) 표본 실지정: enhancedSkill 지정은 category==='ability'에서만 일어난다(draft.js
  //     presentAugment — 비ability 증강의 spellPin은 "어느 스킬에 적용되는가"의 확정 기록으로,
  //     풀 필터도 지정도 아닌 메타데이터). 따라서 실지정 표본은 ability 증강의 pin에서 뽑는다:
  //     ability pin 보유 증강 전종 × 각 최대 2건(정렬 기준) ≥ 20건, 시드 5개씩.
  const byAug = {};
  for (const p of allPins) {
    if ((BY_API[p.aug].category || 'normal') !== 'ability') continue;
    if (!byAug[p.aug]) byAug[p.aug] = [];
    byAug[p.aug].push(p);
  }
  const augNames = Object.keys(byAug).sort();
  const samples = [];
  for (const n of augNames) {
    const sorted = byAug[n].sort((x, y) => (x.champ < y.champ ? -1 : 1));
    samples.push(sorted[0]);
    if (sorted.length > 1) samples.push(sorted[1]);
  }
  check('표본 20건 이상 확보 (ability pin 증강 ' + augNames.length + '종 × 각 최대 2건)',
    samples.length >= 20, String(samples.length));
  const desBad = [];
  for (const p of samples) {
    for (let s = 0; s < 5; s++) {
      const got = designateOnce(p.aug, p.champ, 840000 + s * 31);
      if (got !== p.key) desBad.push(p.aug + '@' + p.champ + ': 기대 ' + p.key + ' 실측 ' + got + ' (seed ' + s + ')');
    }
  }
  check('표본 ' + samples.length + '건 × 5시드 = ' + (samples.length * 5) + '회 전부 pin 스킬로 실지정',
    desBad.length === 0, desBad.slice(0, 6).join(' | '));
  // (c) 비ability pin 32건은 지정에 관여하지 않음을 표본으로 확인 (enhancedSkill 미부여)
  const nonAbility = allPins.filter((p) => (BY_API[p.aug].category || 'normal') !== 'ability');
  const inertBad = [];
  for (const p of nonAbility.slice(0, 5)) {
    const g = newGame({ augments: [BY_API[p.aug]], champion: champ(p.champ), seed: 850000 });
    const slot = nextRound(g).slots[0];
    if (!slot || slot.enhancedSkill !== undefined) inertBad.push(p.aug + '@' + p.champ);
  }
  check('비ability pin(' + nonAbility.length + '건)은 enhancedSkill 미부여 — 메타데이터로만 유지 (표본 5건)',
    inertBad.length === 0, inertBad.join(','));
}

/* ---------------- [16] 계약 기준5: 제드×마나·대시 게이트 ---------------- */
section('16. [계약 기준5] 제드×마나·대시 게이트 — 기존 패턴 (위 [1]·[2] 섹션이 전담)');
{
  // 기준5는 본 파일 [1](마나 게이트: 제드 미제시 + 200게임 풀스트레스)과 [2](대시 게이트
  // 5종 001100 패턴)가 이미 전수 검증한다. 여기서는 회귀 가드로 핵심 2건만 재확인.
  check('제드 풀에 마나 3종 부재 재확인 ([1] 연동)',
    !inPool('Zed', 'ARAM_Overflow') && !inPool('Zed', 'ARAM_Juiced') && !inPool('Zed', 'ARAM_MindtoMatter'));
  check('대시 5종 패턴 001100 재확인 ([2] 연동)',
    ['ARAM_Dashing', 'ARAM_Earthwake', 'ARAM_OutlawsGrit', 'ARAM_ShadowRunner', 'SwiftAndSafe']
      .every((api) => patternOf(api) === '001100'));
}

/* ---------------- [17] 추가 감사: propsSource 분포 ---------------- */
section('17. [추가 감사] champions.json propsSource 분포 = 생성기 보고 일치');
{
  // 보고 기준: node scripts/enrich-champions.cjs (2026-09-03 실행 로그)
  //   "propsSource 분포: {traits:296, merged:389, keywords:7}" — 총 692 스킬(173명×4).
  // keywords 7 = 게임 데이터 자체에 mSpellTags가 없는 7슬롯 (스크립트 주석·raw/14 §8).
  const dist = { traits: 0, merged: 0, keywords: 0 };
  const unknown = [];
  let total = 0;
  for (const c of CHAMPIONS) {
    for (const sp of c.spells || []) {
      total++;
      if (dist[sp.propsSource] !== undefined) dist[sp.propsSource]++;
      else unknown.push(c.id + '.' + sp.key + '=' + sp.propsSource);
    }
  }
  check('전 스킬 propsSource 표기 (traits|merged|keywords 외 값 0)', unknown.length === 0, unknown.slice(0, 5).join(','));
  check('스킬 총수 692 (173명 × 4)', total === 692, String(total));
  check('분포 = 보고값 traits 296 / merged 389 / keywords 7',
    dist.traits === 296 && dist.merged === 389 && dist.keywords === 7, JSON.stringify(dist));
}

/* ---------------- [18] 추가 감사: community → 하드 필터 유입 0 역추적 ---------------- */
section('18. [추가 감사] community 근거의 하드 필터 유입 0 (map 61건 전수 + 역방향)');
{
  // 순방향: map의 community 매핑(offered 60 + excluded 1) 전수 — championExclude/spellExclude
  // 어느 쪽으로도 이식되어 있으면 규율 위반. (spellPin은 풀 필터가 아닌 지정이라 계약 예외 허용.
  // ARAM_SpinToWin championWhitelist는 community 등급이지만 계약이 명시 유지 지시한 예외 —
  // eligibility-notes otherRestrictions official kitRequired가 별도 근거, [11]에서 감사.)
  const communities = MAP.mappings.filter((e) => e.confidence === 'community');
  check('map community 매핑 61건 로드', communities.length === 61, String(communities.length));
  const leak = [];
  for (const e of communities) {
    const a = BY_API[e.augment];
    if (!a) continue;
    const r = a.restrictions || {};
    if (Array.isArray(r.championExclude) && r.championExclude.indexOf(e.champion) !== -1) {
      leak.push(e.augment + '×' + e.champion + ' — championExclude 유입');
    }
    if (e.skill && r.spellExclude && Array.isArray(r.spellExclude[e.champion])
      && r.spellExclude[e.champion].indexOf(e.skill) !== -1 && e.polarity === 'excluded') {
      leak.push(e.augment + '×' + e.champion + ' ' + e.skill + ' — spellExclude 유입');
    }
  }
  check('community 61건 중 하드 필터(championExclude/spellExclude) 유입 0', leak.length === 0, leak.join(' | '));
  // 특별 확인: 유일한 excluded/community(Yorick W×Terraind)는 이진 미이식 + terrain 게이트로 창발 부재
  const tr = BY_API.Terraind.restrictions || {};
  check('Yorick W×Terraind(community excluded): 이진 미이식 + 풀 부재는 terrain 게이트 창발',
    !tr.championExclude && !(tr.spellExclude && tr.spellExclude.Yorick) && !poolSet('Yorick').has('Terraind'));

  // 역방향: augments.json의 spellExclude·championExclude 전 항목이 official/datamined
  // (championExclude는 empirical까지 — Jinx×BreadAndButter) 근거로 역추적되는지
  const mapExcl = {}; // 'aug|champ|skill' → confidence / 'aug|champ|' → confidence
  for (const e of MAP.mappings) {
    if (e.polarity !== 'excluded') continue;
    mapExcl[e.augment + '|' + e.champion + '|' + (e.skill || '')] = e.confidence;
  }
  const HARD_OK = ['official', 'datamined'];
  // 추가 근거원(2026-09-03): 풀 게이트 championExclude는 map이 아니라
  // research/data/class-tier-adjust.json poolGateCandidates(confirmed, empirical)에서 파생됨
  // (enrich-augments.cjs 2.6 — dmg=ap 제외 + 근접 AD 제외, Qiyana·Belveth는 dmg 근사 오류 면제).
  // 게이트 파생 목록을 여기서 동일 규칙으로 재계산해 역추적한다 (드리프트 시 실패 → 감사 유지).
  const ADJUST18 = loadJson('../research/data/class-tier-adjust.json');
  const AP_EXEMPT18 = { Qiyana: true, Belveth: true };
  const gateAllowed = {}; // 'aug|champ' → true
  {
    const apSet = {};
    const meleeAdSet = {};
    for (const c of CHAMPIONS) {
      if (c.dmg === 'ap' && !AP_EXEMPT18[c.id]) apSet[c.id] = true;
      if (c.dmg === 'ad' && !c.ranged) meleeAdSet[c.id] = true;
    }
    for (const gate of ADJUST18.poolGateCandidates) {
      if (gate.status !== 'confirmed' || ['official', 'datamined', 'empirical'].indexOf(gate.evidence) === -1) continue;
      const idSet = gate.id === 'ad-crit-core-dmg-gate' ? apSet
        : (gate.id === 'phenomenal-evil-melee-ad-gate' ? meleeAdSet : null);
      if (!idSet) continue; // mana-core-gate 등 championExclude 미사용 게이트
      for (const api of gate.augments) {
        for (const cid of Object.keys(idSet)) gateAllowed[api + '|' + cid] = true;
      }
    }
  }
  const rev = [];
  for (const a of AUGMENTS) {
    const r = a.restrictions;
    if (!r) continue;
    if (r.spellExclude) {
      for (const cid of Object.keys(r.spellExclude)) {
        for (const key of r.spellExclude[cid]) {
          const conf = mapExcl[a.apiName + '|' + cid + '|' + key];
          if (HARD_OK.indexOf(conf) === -1) rev.push(a.apiName + '.spellExclude.' + cid + '.' + key + ' — 근거 ' + conf);
        }
      }
    }
    if (Array.isArray(r.championExclude)) {
      for (const cid of r.championExclude) {
        if (gateAllowed[a.apiName + '|' + cid]) continue; // 풀 게이트 파생분 (class-tier-adjust 근거)
        // 챔피언 단위: map의 champion-level excluded (skill 무관 — Jinx는 Q 명시라 skill 키로도 조회)
        const conf = mapExcl[a.apiName + '|' + cid + '|']
          || mapExcl[a.apiName + '|' + cid + '|Q'] || mapExcl[a.apiName + '|' + cid + '|W']
          || mapExcl[a.apiName + '|' + cid + '|E'] || mapExcl[a.apiName + '|' + cid + '|R'];
        if (['official', 'datamined', 'empirical'].indexOf(conf) === -1) {
          rev.push(a.apiName + '.championExclude.' + cid + ' — 근거 ' + conf);
        }
      }
    }
  }
  check('역방향: 이진 spellExclude·championExclude 전 항목이 empirical 이상 근거로 역추적',
    rev.length === 0, rev.join(' | '));

  // [V1 확장 감사 2026-09-03] 풀 게이트 정확 집합 대조 — 위 역추적은 "목록 ⊆ 근거"만
  // 보장하므로(초과분 검출), 여기서 "목록 = 파생 집합" 등식을 추가로 강제한다
  // (누락분 검출 — 게이트가 근거보다 느슨해지는 드리프트 방지).
  // 파생 규칙은 enrich-augments.cjs 2.6과 동일: ad-crit-core → dmg=ap(면제 2명 제외),
  // phenomenal-evil → dmg=ad·근접. 대상 증강 목록은 class-tier-adjust.json 게이트가 정의.
  {
    const apExact = Object.keys(
      CHAMPIONS.reduce((m, c) => { if (c.dmg === 'ap' && !AP_EXEMPT18[c.id]) m[c.id] = 1; return m; }, {})
    ).sort().join(',');
    const meleeAdExact = CHAMPIONS.filter((c) => c.dmg === 'ad' && !c.ranged)
      .map((c) => c.id).sort().join(',');
    const augByName = {};
    for (const a of AUGMENTS) augByName[a.apiName] = a;
    const mismatch = [];
    for (const gate of ADJUST18.poolGateCandidates) {
      if (gate.status !== 'confirmed' || ['official', 'datamined', 'empirical'].indexOf(gate.evidence) === -1) continue;
      const want = gate.id === 'ad-crit-core-dmg-gate' ? apExact
        : (gate.id === 'phenomenal-evil-melee-ad-gate' ? meleeAdExact : null);
      if (!want) continue; // championExclude 미사용 게이트
      for (const api of gate.augments) {
        const a = augByName[api];
        const got = (a && a.restrictions && Array.isArray(a.restrictions.championExclude))
          ? a.restrictions.championExclude.slice().sort().join(',')
          : '(없음)';
        if (got !== want) mismatch.push(api + ' — championExclude ≠ 파생 집합 (' + gate.id + ')');
      }
    }
    check('풀 게이트 championExclude = 파생 집합 정확 일치 (부분집합 아님 — 누락 0)',
      mismatch.length === 0, mismatch.join(' | '));
  }
}

/* ---------------- 요약 ---------------- */
console.log('\n합계: PASS ' + passCount + ' / FAIL ' + failCount);
if (failCount > 0) process.exit(1);
