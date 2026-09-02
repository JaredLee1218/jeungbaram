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
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  eligibleAugments,
  newGame,
  nextRound,
  rerollSlot,
  goldenReroll,
  pickAugment,
} from '../docs/js/draft.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const loadJson = (p) => JSON.parse(readFileSync(join(__dirname, p), 'utf8'));

const AUGMENTS = loadJson('../docs/data/augments.json').augments;
const CHAMPIONS = loadJson('../docs/data/champions.json').champions;
const NOTES = loadJson('../research/data/eligibility-notes.json');

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

/** 풀 스트레스 게임 1판: 전 라운드·전 슬롯 리롤 + 황금 리롤 → 노출 최대화. 노출 apiName 목록 반환 */
function stressGame(c, seed, opts) {
  const g = newGame(Object.assign({ augments: AUGMENTS, champion: c, seed }, opts || {}));
  const exposedSlots = [];
  for (let r = 0; r < 4; r++) {
    const round = nextRound(g);
    for (let i = 0; i < round.slots.length; i++) rerollSlot(g, i);
    if (!g.goldenUsed && round.slots.length > 0) goldenReroll(g, 0);
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
  check('징크스 풀 < 소라카·다리우스 풀 (AP·힐 제외 > 크리 제외 방향성)',
    sizes.Jinx < sizes.Soraka && sizes.Jinx < sizes.Darius, sizeStr);
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
  // 예외 규정: Phenomenal Evil은 개별 게이트가 계열과 다름(징크스 포함) → 이진 금지
  if (allowed.ARAM_PhenomenalEvil) delete allowed.ARAM_PhenomenalEvil.classRequired;
  // 예외 규정: Draw Your Sword는 adCrit 계열이지만 rangedOnly+클래스 좁힘으로 별도 처리(위 augmentApiName 항목)

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

/* ---------------- 요약 ---------------- */
console.log('\n합계: PASS ' + passCount + ' / FAIL ' + failCount);
if (failCount > 0) process.exit(1);
