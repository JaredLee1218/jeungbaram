#!/usr/bin/env node
/**
 * enrich-augments.cjs — research/data/eligibility-notes.json (1차 스터디) 및
 * research/data/ability-augment-map.json (3차 실매핑, 306건) 의 조사 결과를
 * docs/data/augments.json 에 이식하는 변환 스크립트 (재실행 가능·결정론).
 *
 * 실행: node scripts/enrich-augments.cjs   (Node v14 호환, 의존성 0)
 * 산출: docs/data/augments.json 갱신 + scripts/enrich-augments-log.md 로그
 *
 * 이식 원칙 (근거: research/AUGMENT-POOLS-STUDY.md §3, real-mapping 계약):
 *  - confidence가 official/datamined/empirical 인 것만 이진 필터(restrictions)로,
 *    community 는 note/가중치까지만.
 *  - 예외(계약 명시): restrictions.spellPin(강화 대상 스킬 확정 매핑)은 풀 필터가
 *    아니라 지정(designation)이므로 community도 허용하되 note에 표기한다.
 *  - map의 offered 기록은 필터에 쓰지 않음(표본일 뿐) — 단 "필터가 실제보다 좁은지"
 *    검증 기준으로 사용: offered(official/empirical)와 충돌하는 기존 근사 게이트는 완화.
 *  - "완전 제외 실측"은 이진, "선호" 층위는 favoredClasses/disfavoredClasses 가중치로.
 *  - 근사: 모든 근사 항목에는 restrictions.note 또는 본 스크립트 주석에 "근사:" 표기.
 *
 * category 분류 규칙:
 *  - "ability": eligibility-notes.json abilityAugments 30종 (게임 데이터 {e3a02eac} 플래그 기준)
 *  - "quest":  위키 기준 퀘스트형(research/raw/09-ability-augments.md §4) 중 ability 30종에
 *              포함되지 않는 것 + descKo에 퀘스트 구조가 명시된 것(From Downtown, Ultra Hydra).
 *              스킬 지정형 퀘스트 3종(Multishot/Pursuit of Haste/Pursuit of Power)은
 *              겸용이지만 계약상 "ability"를 우선한다.
 *  - "normal": 나머지 전부
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const AUG_PATH = path.join(ROOT, 'docs', 'data', 'augments.json');
const NOTES_PATH = path.join(ROOT, 'research', 'data', 'eligibility-notes.json');
const MAP_PATH = path.join(ROOT, 'research', 'data', 'ability-augment-map.json');
const LOG_PATH = path.join(__dirname, 'enrich-augments-log.md');

const augData = JSON.parse(fs.readFileSync(AUG_PATH, 'utf8'));
const notes = JSON.parse(fs.readFileSync(NOTES_PATH, 'utf8'));
const abilityMap = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));

/* ------------------------------------------------------------------ */
/* 1. category                                                         */
/* ------------------------------------------------------------------ */

// 스킬 증강 30종 — eligibility-notes.json abilityAugments 에서 직접 로드 (단일 근원)
const ABILITY = new Map(); // apiName -> requiredProps
for (const a of notes.abilityAugments.augments) ABILITY.set(a.apiName, a.requiredProps || []);
if (ABILITY.size !== 30) throw new Error('abilityAugments 30종이 아님: ' + ABILITY.size);

// 위키 기준 퀘스트형 (research/raw/09-ability-augments.md §4 + descKo 퀘스트 구조 명시분)
const QUEST = new Set([
  'PoroCharge_Active',            // Poro Stampede — 9단계 퀘스트
  'PressureCooker',               // Pressure Cooker — 3단계 퀘스트
  'ARAM_Quest_SteelYourHeart',    // Quest: Steel Your Heart
  'ARAM_Quest_UrfsChampion',      // Quest: Urf's Champion
  'ARAM_Quest_WoogletsWitchcap',  // Quest: Wooglet's Witchcap
  'ARAM_Quest_VoidImmolation',    // Quest: Icathia's Fall
  'Quest_Sneakerhead',            // Quest: Sneakerhead (비활성)
  'ARAM_BangBang',                // From Downtown — descKo "퀘스트: 600유닛…" (kiwi.bin 설명 원문)
  'Quest_UltraHydra',             // Ultra Hydra — descKo "퀘스트: 신성 모독의 히드라…"
]);

/* ------------------------------------------------------------------ */
/* 2. 이식 테이블                                                        */
/* ------------------------------------------------------------------ */

// Spin To Win 화이트리스트 — 위키 "Eligible Abilities" 실측 목록(검증 수정본: 22챔피언·28스킬)에서
// 스크립트 파생 (research/raw/15-wiki-patch-mining.md §2-1 → ability-augment-map.json SpinToWin offered).
// ⚠ 근거 등급은 community(위키 편집자 실측, {{Editors needed}} 미완성) — 하드 필터 규율의 예외지만
// 계약이 화이트리스트 유지·갱신을 명시(기존 설계 결정 승계). "Pending for test"(아크샨·뽀삐 R 등)는 미포함.
const SPIN_WHITELIST = [];
{
  const seen = {};
  for (const e of abilityMap.mappings) {
    if (e.augment !== 'ARAM_SpinToWin' || e.polarity !== 'offered') continue;
    if (!seen[e.champion]) { seen[e.champion] = true; SPIN_WHITELIST.push(e.champion); }
  }
  SPIN_WHITELIST.sort();
  if (SPIN_WHITELIST.length !== 22) {
    throw new Error('SpinToWin 화이트리스트가 22명이 아님(raw/15 §2-1 검증 수정본 기준): ' + SPIN_WHITELIST.length);
  }
}

// 근사: 가중치 계수 자체는 draft.js weightFor()가 보유 — 여기서는 대상 클래스만 기술.
// adCrit/ap 계열을 이진(classExcluded)이 아닌 가중치로만 이식하는 이유:
//   실측(11 §3-1·§3-2)은 구조적 부재를 시사하지만 DDragon tags가 하이브리드
//   (예: 이즈리얼 Marksman+Mage, 카타리나 Assassin+Mage)라 클래스 이진 제외는
//   실제 게임에 없는 오탐(이즈리얼에게 치명타 증강 미제시 등)을 만든다.
//   STUDY §3-2 "크리 스탯류는 제외하지 말고 가중치만" 방침과도 정합.
const AD_FAVORED = ['Marksman', 'Fighter', 'Assassin'];
const AD_DISFAVORED = ['Mage', 'Support', 'Tank']; // 근사: tank(주문형)을 tags로 못 갈라 Tank 전체를 약한 감쇠로
const AP_FAVORED = ['Mage', 'Support'];
const AP_DISFAVORED = ['Marksman', 'Assassin', 'Fighter'];

// classBias(adCrit, empirical) — eligibility-notes.json classBias[2]
const ADCRIT = ['ARAM_BluntForce', 'ARAM_Upgrade_Collector', 'Quest_UltraHydra',
  'Upgrade_DeathDance', 'Upgrade_Ravenous', 'Upgrade_SunderedSky', 'ARAM_Upgrade_IE',
  'CriticalMissile', 'CriticalRhythm', 'ARAM_escAPADe', 'ARAM_Typhoon'];
  // ARAM_DrawYourSword 는 개별 OPS 항목에서 별도 처리(클래스 좁힘 — STUDY §3-1)

// classBias(ap, empirical) — ARAM_PhenomenalEvil 은 예외(징크스 포함 관측)라 별도 처리
const AP_GROUP = ['ARAM_ADAPt', 'ARAM_Eureka', 'ARAM_BigBrain', 'ARAM_MasterofDuality',
  'OminousPact', 'ARAM_Quest_WoogletsWitchcap', 'ARAM_WitchfulThinking', 'ARAM_Upgrade_ZH'];

// classBias(critStats, empirical — "제외가 아닌 가중치 층위" 명시)
const CRITSTATS = ['ARAM_Deft', 'ARAM_Vulnerability', 'ARAM_TapDancer', 'ARAM_DoubleTap',
  'ARAM_ItsCritical', 'ARAM_LightemUp', 'ARAM_TankItOrLeaveIt'];

// classBias(dash, empirical) — 5종 완전 동일 패턴(001100). OR 의미(대시 스킬 하나만 있으면 됨)
const DASH_GATE = ['ARAM_Dashing', 'ARAM_Earthwake', 'ARAM_OutlawsGrit', 'ARAM_ShadowRunner', 'SwiftAndSafe'];

// classBias(immobilize, empirical) — 하드 CC 미보유(제드)만 부재
const IMMOBILIZE_GATE = ['ARAM_Cruelty', 'ARAM_SlapAround', 'SoulEater', 'ARAM_Impassable', 'ARAM_CourageoftheColossus'];

// classBias(allyHealShield, empirical) + MercysStrike(official) — STUDY §3-1: tags Support 필요로 근사
const SUPPORT_GATE = ['ARAM_SonicBoom', 'ARAM_WeeWooWeeWoo', 'ARAM_EmpoweredByTheFaithful',
  'MercysStrike', 'ARAM_AllForYou', 'ARAM_SpiritBomb', 'EmpyreanPromise'];

// classBias(sniper, empirical) — 원거리 3인만 등재/근접 3인 부재 → rangedOnly로 근사.
// 근사 해제(2026-09-03, ability-augment-map): ARAM_SkilledSniper는 근접 Locke Q 공식 offered
// (26.15 패치노트)가 rangedOnly를 반증 → 게이트 제거, 가중치로 강등. BangBang은 반례 없어 유지.
const SNIPER_GATE = ['ARAM_BangBang'];

// classBias(selfHealCircle, empirical) — 조건을 "킷 내 회복 보유"로 추정 → abilityProps=heal
const SELFHEAL_GATE = ['ARAM_WindspeakersBlessing', 'ARAM_CircleofDeath'];

// classBias(meleeCluster, empirical) — 근접 3인만 등재 확실분 → meleeOnly.
// ARAM_StuckInHereWithMe 는 실측 불확실(징크스 op.gg 등재)이라 가중치로만.
// 근사 해제(2026-09-03, ability-augment-map):
//  - TitansPulse: 원거리 아리·리산드라·블라디미르 empirical offered(mayhemmeta 16챔프, raw/16)가
//    meleeOnly를 반증 → 게이트 제거, 가중치로 강등.
//  - ARAM_Quickstep: 원거리 켄넨 R 공식 offered(26.12 "Garen E and Kennen R are very happy")가
//    meleeOnly를 반증 → 게이트 제거, 가중치로 강등.
//  - ARAM_Upgrade_Immolate: 반례 없어 유지.
const MELEE_GATE = ['ARAM_Upgrade_Immolate'];

// classBias(mana, empirical+datamined) — 소모 연동 3종만. 근사 아님(삼중 일치).
// ⚠ ARAM_OceanSoul 은 실측 전원 등재(STUDY §3-1 "보류")라 이식하지 않는다.
const MANA_GATE = ['ARAM_Overflow', 'ARAM_Juiced', 'ARAM_MindtoMatter'];

/**
 * 증강별 개별 이식 지시.
 * r: restrictions에 병합할 필드 / note: restrictions.note 전체 교체(결정론·재실행 안전)
 * fav/dis: 최상위 favoredClasses/disfavoredClasses / dropProps: restrictions.abilityProps 제거
 * drop: 나열된 restrictions 키 제거 (종전 실행이 남긴 완화 대상 게이트의 잔존값 청소 — 재실행 결정론)
 * why: 로그용 근거 요약
 */
const OPS = {
  /* --- championSpecific (eligibility-notes.json championSpecific) --- */
  BloodMoneyBurn: {
    r: { championExclude: ['Smolder'] },
    note: '스몰더에게 미제시 (공식 26.14 버그픽스). 근거: research/data/eligibility-notes.json championSpecific',
    why: 'official — 26.14 패치노트',
  },
  ARAM_BreadAndButter: {
    r: { championExclude: ['Jinx'], slot: 'Q' },
    note: 'Q 슬롯 고정형. 실측: 토글 Q(쿨다운 없음)인 징크스만 제외 — 스킬 단위 dead draw 필터. 근거: eligibility-notes.json championSpecific, research/raw/11-empirical-pools.md §4-2',
    why: 'empirical — 양 소스 일치(11 §4-2)',
  },
  ARAM_BreadAndJam: { r: { slot: 'W' }, note: 'W 슬롯 고정형 (스킬 지정 불필요한 전신 — 09 §3-3)', why: 'official — 위키 원문' },
  ARAM_BreadAndCheese: { r: { slot: 'E' }, note: 'E 슬롯 고정형 (스킬 지정 불필요한 전신 — 09 §3-3)', why: 'official — 위키 원문' },
  WardingWeapon: {
    r: { spellExclude: { Akshan: ['E'] } },
    note: '스킬 슬롯 단위 게이트: 아크샨 E 부적격 (공식 26.15 버그픽스). 근거: eligibility-notes.json championSpecific',
    why: 'official — 26.15 버그픽스',
  },
  TrustyWeapon: {
    r: { spellExclude: { Akshan: ['E'] } },
    note: '스킬 슬롯 단위 게이트: 아크샨 E 부적격 (공식 26.15 버그픽스). 근거: eligibility-notes.json championSpecific',
    why: 'official — 26.15 버그픽스',
  },
  SpecializedEmpowerment: {
    r: { spellExclude: { Akshan: ['E'], Draven: ['Q'], Illaoi: ['E'], Malphite: ['W'] } },
    note: '스킬 슬롯 단위 게이트: 아크샨 E·드레이븐 Q·일라오이 E·말파이트 W 부적격 (공식 26.15 버그픽스). 근거: eligibility-notes.json championSpecific',
    why: 'official — 26.15 버그픽스',
  },
  ARAM_SpecializedRecursion: {
    r: { spellExclude: { Yasuo: ['E'], Akshan: ['E'] } },
    note: '스킬 슬롯 단위 게이트: 야스오 E(26.14)·아크샨 E(26.15) 부적격 (공식 버그픽스) + 야스오 Q·요네 Q/W·제리 Q 부적격 (datamined — Trait_NotBenefitFromHaste, 26.14 야스오 버그픽스가 태그 편집으로 실증). 근거: eligibility-notes.json championSpecific, ability-augment-map.json excluded',
    why: 'official — 26.14/26.15 버그픽스 + datamined(Trait_NotBenefitFromHaste)',
  },
  Overloaded: {
    r: { spellExclude: { Katarina: ['E'], Shaco: ['E'] } },
    note: '스킬 슬롯 단위 게이트: 카타리나 E·샤코 E 부적격 (공식 26.15 버그픽스). 근거: eligibility-notes.json championSpecific',
    why: 'official — 26.15 버그픽스',
  },
  ARAM_Multishot: {
    note: '투사체(미사일) 스킬 필요 (스킬 단위 AND). 벨코즈는 전용 예외 스펠 존재 (datamined — kiwi.bin AdditionalSpells). 실측: 6명 중 브랜드·제드만. 근거: eligibility-notes.json abilityAugments·championSpecific',
    why: 'official(requiredProps) + datamined(벨코즈)',
  },

  /* --- STUDY §3-1 개별 게이트 --- */
  MercysStrike: {
    r: { classRequired: ['Support'] },
    note: '서포트 전용 클래스 게이트 (공식 26.15 버그픽스로 실존 확인). 근사: DDragon tags의 Support 보유로 판정. 근거: research/AUGMENT-POOLS-STUDY.md §3-1, eligibility-notes.json classBias',
    why: 'official — 26.15 버그픽스',
  },
  ARAM_DrawYourSword: {
    r: { rangedOnly: true },
    fav: ['Marksman'], dis: ['Mage', 'Support'],
    note: '원거리 챔피언 전용 (공식). 루난의 허리케인 보유 시 미제시 (아이템 조건부 — note로만 기록). 근사: 실측상 원거리 브랜드·소라카에도 부재 — 명문 조건보다 좁은 클래스 필터를 가중치(favored/disfavored)로 근사. 근거: STUDY §3-1, eligibility-notes.json classBias',
    why: 'official(rangedOnly·루난) + empirical(클래스 좁힘 — 가중치)',
  },
  ARAM_SpinToWin: {
    r: { championWhitelist: SPIN_WHITELIST.slice() },
    dropProps: true, // 종전 abilityProps:['spin'] 제거 — 위키 실측 목록이 더 정확 (champions.json spin 속성 누락 리스크 회피)
    note: '위키 "Eligible Abilities" 실측 목록의 챔피언 화이트리스트 (community — 위키 편집자 실측, 검증 수정본 22챔피언·28스킬: 아리 W·R, 다리우스 Q, 가렌 E, 제드 E 등). 검증 대기분(아크샨·뽀삐 R 등)은 미포함. 하드 필터 규율의 예외 — 계약이 화이트리스트 유지·갱신 명시. 근거: research/raw/15-wiki-patch-mining.md §2-1, ability-augment-map.json',
    why: 'community(위키 실측, 검증 수정본) — 계약 지시로 화이트리스트 유지',
  },

  /* --- 스킬 증강 requiredProps 외 개별 노트 --- */
  TitansPulse: {
    drop: ['meleeOnly'],
    fav: ['Fighter', 'Tank'],
    note: '근사 해제: 종전 meleeOnly(raw/11 근접 3인 표본)를 26.17 확대 실측이 반증 — 원거리 아리·리산드라·블라디미르 포함 16챔프 offered(mayhemmeta ≥100판). 게이트 제거, 근접 브루저 편중은 가중치(favoredClasses)로만. 근거: ability-augment-map.json offered(empirical), research/raw/16 §4~5',
    why: 'empirical — 확대 실측(16챔프)이 meleeOnly 반증 → 가중치 강등',
  },
  ARAM_Quickstep: {
    drop: ['meleeOnly'],
    fav: ['Fighter', 'Tank'],
    note: '근사 해제: 종전 meleeOnly(raw/11 근접 3인 표본)를 공식 기록이 반증 — 원거리 켄넨 R offered(26.12 패치노트 "Garen E and Kennen R are very happy"). 게이트 제거, 근접 편중은 가중치로만. 26.12 발표 조건(자가 대상 AoE)은 현행 여부 미확인이라 미이식. 근거: ability-augment-map.json offered(official), eligibility-notes.json abilityAugments',
    why: 'official — 켄넨 R offered(26.12)가 meleeOnly 반증 → 가중치 강등',
  },
  ARAM_Upgrade_Immolate: {
    note: '근사: 실측에서 근접 3인에게만 등재 → meleeOnly로 이식. 근거: eligibility-notes.json classBias(meleeCluster)',
    why: 'empirical — 근접 3인만(11 §3-8)',
  },
  Ability_SelfAOE_DoubleCast: {
    note: '실측: 징크스·브랜드 제외 관측 (큐레이션 게이트 추정) — 근거 불충분으로 이진 미이식, 기록만. 근거: eligibility-notes.json abilityAugments (11 §3-9)',
    why: 'empirical(약) — 이진 보류',
  },
  ItsGoTime: { note: '지속시간형 효과가 있는 스킬 필요 (스킬 단위 AND). 근거: eligibility-notes.json abilityAugments(requiredProps)', why: 'official — 위키 원문' },
  DoubleDefense: { note: '보호막 효과가 있는 스킬 필요 (스킬 단위 AND). 근거: eligibility-notes.json abilityAugments', why: 'official — 위키 원문' },
  DoubleStrike: { note: '강화 기본 공격 효과가 있는 스킬 필요 (스킬 단위 AND). 미출시(내부 데이터 전용)', why: 'official — 위키 원문' },
  Bonk: { note: '강화 기본 공격 효과가 있는 스킬 필요 (스킬 단위 AND). 실측: 6명 중 다리우스(강화 평타 W)만 등재. 근거: eligibility-notes.json abilityAugments', why: 'official + empirical' },
  ChainReaction: { note: '밀쳐내기(넉백) 효과가 있는 스킬 필요 (스킬 단위 AND). 궁극기 대상이면 피해 250%. 근거: eligibility-notes.json abilityAugments', why: 'official — 위키 원문' },
  DarkWind: { note: '속박/그라운딩(immobilize) 스킬 필요 (스킬 단위 AND). 챔피언마다 다른 스킬에 바인딩(빅토르 W·레넥톤 W 실측). 근거: eligibility-notes.json abilityAugments', why: 'official — 위키 원문' },
  Terraind: { note: '지형을 생성하는 스킬 필요 (스킬 단위 AND — 아니비아·탈리야·트런들 등). 궁극기면 피해 3배. 근거: eligibility-notes.json abilityAugments', why: 'official — 위키 원문' },
  LittleExtraHelp: { note: '일정 시간 기본 공격을 강화하는 스킬 필요 (empoweredAttack+durationEffect 스킬 단위 AND). 근거: eligibility-notes.json abilityAugments', why: 'official — 위키 원문' },
  VoidDash: { note: '돌진(dash)이 있는 스킬 필요 (스킬 단위 AND). 26.12 핫픽스 이후 비활성. 근거: eligibility-notes.json abilityAugments', why: 'official — 위키 원문' },
  KeepGoing: { note: '지속시간형 스킬 필요 (스킬 단위 AND). 미출시(내부 데이터 전용)', why: 'official — 위키 원문' },
  Overkill: { note: '지속시간형 효과가 있는 스킬 필요 (스킬 단위 AND). 근거: eligibility-notes.json abilityAugments', why: 'official — 위키 원문' },
  Missile_Split: { note: '투사체(미사일) 스킬 필요 (스킬 단위 AND). 실측: 6명 중 브랜드·제드만 등재. 근거: eligibility-notes.json abilityAugments', why: 'official + empirical' },
  SpellVolley: { note: '대상 지정이면서 투사체인 같은 스킬 하나 필요 (스킬 단위 AND — spells[i].props 기반 판정, 구스키마면 합집합 폴백). props는 bin mCastType=1+mMissileSpec(게임 데이터)과 키워드 병합 — 26.17 실측 offered 16챔피언(브랜드 R·베이가 R·애니비아 E 등, ability-augment-map empirical) 전부 커버. 근거: eligibility-notes.json abilityAugments, research/raw/16', why: 'official + empirical' },

  /* --- 그룹 게이트 노트 (그룹 필드는 아래 그룹 루프가 부여) --- */
  ARAM_Overflow: { note: '마나 게이트: 마나 미사용(기력·무자원) 챔피언에게 미제시 — 실측(제드 부재)·kiwi.bin mAugmentTags=8·아레나 공식 삼중 일치. 근거: STUDY §3-1, eligibility-notes.json classBias(mana)', why: 'empirical + datamined' },
  ARAM_Juiced: { note: '마나 게이트: 마나 미사용(기력·무자원) 챔피언에게 미제시 — 실측(제드 부재)·kiwi.bin mAugmentTags=8·아레나 공식 삼중 일치. 근거: STUDY §3-1, eligibility-notes.json classBias(mana)', why: 'empirical + datamined' },
  ARAM_MindtoMatter: { note: '마나 게이트: 마나 미사용(기력·무자원) 챔피언에게 미제시 — 실측(제드 부재)·kiwi.bin mAugmentTags=8·아레나 공식 삼중 일치. 근거: STUDY §3-1, eligibility-notes.json classBias(mana)', why: 'empirical + datamined' },
  ARAM_Dashing: { note: '돌진/점멸 스킬 보유 챔피언에게만 (실측 5종 완전 동일 패턴·kiwi.bin mAugmentTags=32 합치). 칼리스타는 대신 공격 속도 125%를 얻음 (효과 치환 — community, note로만). 근거: STUDY §3-1, eligibility-notes.json classBias(dash)·championSpecific', why: 'empirical + datamined' },
  ARAM_Earthwake: { note: '돌진 스킬 보유 챔피언에게만 (실측 5종 동일 패턴). 팀당 최대 2명에게만 제시 (공식 — 1인 시뮬 범위 밖이라 note로만). 근거: STUDY §3-1, eligibility-notes.json classBias(dash)·otherRestrictions', why: 'empirical + official(팀 제한)' },
  ARAM_OutlawsGrit: { note: '돌진 스킬 보유 챔피언에게만 (실측 5종 동일 패턴). 근거: STUDY §3-1, eligibility-notes.json classBias(dash)', why: 'empirical' },
  ARAM_ShadowRunner: { note: '돌진 스킬 보유 챔피언에게만 (실측 5종 동일 패턴). 근거: STUDY §3-1, eligibility-notes.json classBias(dash)', why: 'empirical' },
  SwiftAndSafe: { note: '돌진 스킬 보유 챔피언에게만 (실측 5종 동일 패턴). 근거: STUDY §3-1, eligibility-notes.json classBias(dash)', why: 'empirical' },
  ARAM_Cruelty: { note: '하드 CC(속박/접지) 스킬 보유 챔피언에게만 (실측: 제드만 부재·kiwi.bin mAugmentTags=16 합치). 반례 관측: 속박 E 보유 징크스가 실측 부재 — 클래스 오버라이드 추정, 미이식. 근거: STUDY §3-1, eligibility-notes.json classBias(immobilize)', why: 'empirical + datamined' },
  ARAM_SlapAround: { note: '하드 CC(속박/접지) 스킬 보유 챔피언에게만. 근거: STUDY §3-1, eligibility-notes.json classBias(immobilize)', why: 'empirical + datamined' },
  SoulEater: { note: '하드 CC(속박/접지) 스킬 보유 챔피언에게만. 근거: STUDY §3-1, eligibility-notes.json classBias(immobilize)', why: 'empirical + datamined' },
  ARAM_Impassable: { note: '하드 CC(속박/접지) 스킬 보유 챔피언에게만. 근거: STUDY §3-1, eligibility-notes.json classBias(immobilize)', why: 'empirical + datamined' },
  ARAM_CourageoftheColossus: { note: '하드 CC(속박/접지) 스킬 보유 챔피언에게만. 근거: STUDY §3-1, eligibility-notes.json classBias(immobilize)', why: 'empirical + datamined' },
  ARAM_SonicBoom: { note: '근사: 아군 힐/실드 계열 — 실측에서 소라카 전용 관측 → DDragon tags의 Support 필요로 근사. 근거: STUDY §3-1, eligibility-notes.json classBias(allyHealShield)', why: 'empirical' },
  ARAM_WeeWooWeeWoo: { note: '근사: 아군 힐/실드 계열 — 실측에서 소라카 전용 관측 → DDragon tags의 Support 필요로 근사. 근거: STUDY §3-1, eligibility-notes.json classBias(allyHealShield)', why: 'empirical' },
  ARAM_EmpoweredByTheFaithful: { note: '근사: 아군 힐/실드 계열 — 실측에서 소라카 전용 관측 → DDragon tags의 Support 필요로 근사. 근거: STUDY §3-1, eligibility-notes.json classBias(allyHealShield)', why: 'empirical' },
  ARAM_AllForYou: { note: '근사: 아군 힐/실드 계열 — 실측에서 소라카 전용 관측 → DDragon tags의 Support 필요로 근사. 근거: STUDY §3-1, eligibility-notes.json classBias(allyHealShield)', why: 'empirical' },
  ARAM_SpiritBomb: { note: '근사: 아군 힐/실드 계열 — 실측에서 소라카 전용 관측 → DDragon tags의 Support 필요로 근사. 근거: STUDY §3-1, eligibility-notes.json classBias(allyHealShield)', why: 'empirical' },
  EmpyreanPromise: { note: '근사: 아군 힐/실드 계열 — 실측에서 소라카 전용 관측 → DDragon tags의 Support 필요로 근사. 근거: STUDY §3-1, eligibility-notes.json classBias(allyHealShield)', why: 'empirical' },
  ARAM_SkilledSniper: {
    drop: ['rangedOnly'],
    fav: ['Mage', 'Marksman'],
    note: '근사 해제: 종전 rangedOnly(raw/11 원거리 3인 표본)를 공식 기록이 반증 — 근접 Locke Q offered(26.15 패치노트). 실제 조건은 장거리(600+) 스킬샷 보유로 추정되나 킷 속성 어휘 밖이라 게이트 없이 가중치로만. 근거: ability-augment-map.json offered(official), eligibility-notes.json classBias(sniper)',
    why: 'official — Locke Q offered(26.15)가 rangedOnly 반증 → 가중치 강등',
  },
  ARAM_BangBang: { note: '근사: 장거리(600+) 스킬샷 계열 — 실측에서 원거리 3인만 등재·근접 3인 부재 → rangedOnly로 근사. 근거: eligibility-notes.json classBias(sniper), research/raw/11-empirical-pools.md §3-7', why: 'empirical' },
  ARAM_WindspeakersBlessing: { note: '근사: 실측에서 소라카+다리우스(셀프힐 Q)만 등재 — 조건을 "킷 내 회복 보유"로 추정해 abilityProps=heal로 이식. 근거: eligibility-notes.json classBias(selfHealCircle), research/raw/11-empirical-pools.md §4-3', why: 'empirical(조건 해석은 추정)' },
  ARAM_CircleofDeath: { note: '근사: 실측에서 소라카+다리우스(셀프힐 Q)만 등재 — 조건을 "킷 내 회복 보유"로 추정해 abilityProps=heal로 이식. 근거: eligibility-notes.json classBias(selfHealCircle), research/raw/11-empirical-pools.md §4-3', why: 'empirical(조건 해석은 추정)' },
};

/* ------------------------------------------------------------------ */
/* 2.5 ability-augment-map.json 이식 파생 (306건 실매핑 — real-mapping 계약) */
/* ------------------------------------------------------------------ */

// 하드 필터(excluded → championExclude/spellExclude) 허용 confidence — community 금지.
const HARD_OK = { official: true, datamined: true, empirical: true };
const SKILL_OK = { Q: true, W: true, E: true, R: true };

// 하드 필터 보류 예외 — key: "augment|champion|skill(null이면 'null')". 사유는 로그에 남김.
const MAP_EXCLUDE_SKIP = {
  'SpecializedEmpowerment|Locke|null':
    '효과 오적용 수정(패시브 P는 지정 비대상 — 26.16 원문 "affected Locke (P) damage")이지 제시 풀 제외가 아님. ' +
    '동 챔피언 Locke E offered(official, 26.15)와의 모순 방지 — 하드 필터 미이식, 기록만',
  'MercysStrike|Vladimir|null':
    '기존 classRequired(Support) 게이트가 이미 커버(블라디미르는 비서포트) — 중복 이진 미이식. ' +
    '이 항목 자체가 그 클래스 게이트의 공식 예시(26.15)',
  'ARAM_BreadAndButter|Jinx|Q':
    '기존 championExclude(Jinx)로 이미 커버(slot=Q 고정형이라 등가). raw/16 §9-4의 "부정 단정 아님" 주석 승계',
  'Terraind|Yorick|W':
    'community 근거(디시 실측) — 하드 필터 규율상 이진 금지, 기록만. 지형 6인 datamined 전수와도 무모순(요릭 W는 Trait_CreateTerrain 미보유)',
};

// 파생 산출물: apiName → { spellExclude, championExclude, pins:{champ:{skill,confidence}}, communityPins:[] }
const MAP_DERIVED = {};
const mapLog = { spellExclude: [], championExclude: [], pin: [], skip: [], conflict: [] };

function derivedOf(api) {
  if (!MAP_DERIVED[api]) MAP_DERIVED[api] = { spellExclude: {}, championExclude: [], pins: {}, pinSkills: {} };
  return MAP_DERIVED[api];
}

for (const e of abilityMap.mappings) {
  const skillKey = e.skill && SKILL_OK[e.skill] ? e.skill : null;

  if (e.polarity === 'excluded') {
    const skipKey = e.augment + '|' + e.champion + '|' + (e.skill || 'null');
    if (MAP_EXCLUDE_SKIP[skipKey]) {
      mapLog.skip.push({ key: skipKey, confidence: e.confidence, reason: MAP_EXCLUDE_SKIP[skipKey] });
      continue;
    }
    if (!HARD_OK[e.confidence]) {
      // 명시 예외 목록에 없는 community excluded — 규율상 자동 보류 (신규 데이터 유입 대비 방어)
      mapLog.skip.push({ key: skipKey, confidence: e.confidence, reason: 'community 근거 — 하드 필터 규율상 이진 금지(자동 보류)' });
      continue;
    }
    const d = derivedOf(e.augment);
    if (skillKey) {
      if (!d.spellExclude[e.champion]) d.spellExclude[e.champion] = [];
      if (d.spellExclude[e.champion].indexOf(skillKey) === -1) d.spellExclude[e.champion].push(skillKey);
      mapLog.spellExclude.push({ augment: e.augment, champion: e.champion, skill: skillKey, confidence: e.confidence, source: e.source });
    } else {
      if (d.championExclude.indexOf(e.champion) === -1) d.championExclude.push(e.champion);
      mapLog.championExclude.push({ augment: e.augment, champion: e.champion, confidence: e.confidence, source: e.source });
    }
    continue;
  }

  // offered — 필터에 쓰지 않음(표본). 단 skill 명시분은 spellPin(지정 확정)으로 이식.
  // community 도 허용(계약: "community는 note에 표기") — 풀 필터가 아닌 지정이기 때문.
  if (e.polarity === 'offered' && skillKey) {
    const d = derivedOf(e.augment);
    if (!d.pinSkills[e.champion]) d.pinSkills[e.champion] = [];
    if (d.pinSkills[e.champion].indexOf(skillKey) === -1) d.pinSkills[e.champion].push(skillKey);
    if (!d.pins[e.champion]) d.pins[e.champion] = { skill: skillKey, confidence: e.confidence, source: e.source };
  }
}

// 다중 스킬 적격(같은 챔피언×증강에 상이한 skill) → 지정 확정 불가: pin 제거, 로그.
// 예: SpinToWin 아리 W·R, 드레이븐 Q·E·R — 단일 pin으로 표현 불가라 ③무작위(또는 미지정)에 맡긴다.
for (const api of Object.keys(MAP_DERIVED)) {
  const d = MAP_DERIVED[api];
  for (const champ of Object.keys(d.pinSkills)) {
    if (d.pinSkills[champ].length > 1) {
      mapLog.conflict.push({ augment: api, champion: champ, skills: d.pinSkills[champ].slice() });
      delete d.pins[champ];
    }
  }
}

for (const api of Object.keys(MAP_DERIVED)) {
  const d = MAP_DERIVED[api];
  for (const champ of Object.keys(d.pins).sort()) {
    mapLog.pin.push({ augment: api, champion: champ, skill: d.pins[champ].skill, confidence: d.pins[champ].confidence });
  }
}

/* ------------------------------------------------------------------ */
/* 2.7 funTier — 꿀잼 티어 큐레이션 (augment-fun-tier 계약)               */
/* ------------------------------------------------------------------ */
// 근거 우선순위(계약): ① research/raw/13 (aramgg 한국판 T1~T5 + 인벤/디시/증바람.com)
//                     ② raw/16 §4·§7·§8 (스킬 증강 26종 실측 — 전역 승률·순위/209)
//                     ③ raw/07 (영어권 통계·티어: u.gg/blitz/aramnerfs/esports.net/games.gg)
//                     ④ raw/06 (한국 커뮤니티 체감 0티어·사기 증강). 상충 시 한국 소스 우선.
// 라이브 대조(2026-09-03 WebFetch): aramgg.com/ko/augments — 26.17 T1 8종이 raw/13 기록과 동일함을 재확인.
//   arammayhem.com/augments — 26.17 승률 상위 25/하위 15 (본 주석에서 "라이브 26.17"로 인용;
//   arammayhem은 aramgg와 원천 공유 — raw/16 §3-1).
// FUN_TIER: 근거 있는 큐레이션(항목별 주석 — S는 계약상 근거 한 줄 필수).
// FUN_TIER_INFERRED: 어느 소스에도 등재되지 않아 태그·등급·유사 증강으로 유추한 것
//   (계약: 근거 없는 고평가 방지 — A 이상 금지, B 또는 C만. 비활성+근거 없음 → C).
const FUN_TIER = {
  /* ===== S (23종) — 근거 한 줄씩 ===== */
  ARAM_TransmutePrismatic: 'S',      // 전환: 프리즘 — aramgg(KR) T1 승률 전체 1위 65.37% (raw/13 §1-3, 라이브 26.17 재확인)
  ARAM_HighRoller: 'S',              // 도박꾼 — aramgg T1 2위 64.55% + 펨코 하이롤 밈 (raw/13, raw/06 ㉘)
  ShrinkEngine: 'S',                 // 축소 엔진 — aramgg T1 3위 61.59% (raw/13 §1-3)
  ARAM_TankEngine: 'S',              // 탱크 엔진 — aramgg T1 60.48% + 라이엇 개발 인터뷰의 문도 재미 사례 (raw/13, raw/06 §1·⑫)
  ARAM_DrawYourSword: 'S',           // 검을 뽑아라 — aramgg T1 60.46% + 디시 "그브·사미라 말 안 됨" (raw/13 §3-1, raw/06 ⑰)
  ARAM_Recursion: 'S',               // 되풀이 — aramgg T1 60.35% + 인벤 "되풀이 > E가속 > Q가속" (raw/13 §2-3)
  ARAM_Quest_SteelYourHeart: 'S',    // 강철 같은 심장 — aramgg T1 59.46% + 블로그 "탱커 최사기" + 나무위키 "체력 몇만" (raw/13, raw/06 ⑫)
  BloodMoneyBurn: 'S',               // 타오르는 이자 — aramgg T1 59.37% (raw/13 §1-3)
  ARAM_DualWield: 'S',               // 양손잡이 — 디시 "원딜 전용 0티어" + 인벤 S + 증바람.com 징크스 59%·픽률 36% (raw/13 §1-3·§3-1)
  ARAM_InfernalConduit: 'S',         // 지옥의 전도체 — 디시 "브랜드 한정 압도적 0티어" + u.gg 프리즘 상위 (raw/13 §3-1, raw/07)
  ARAM_BacktoBasics: 'S',            // 기본으로 돌아가기 — 인벤 "GOAT" + 펨코 갱플 술통 원킬 (raw/13 §3-3, raw/06 ②)
  ARAM_TapDancer: 'S',               // 탭 댄서 — 블로그 "원딜은 탭댄서가 두말할 것 없이 최고" + 픽률 17~29% 실측 (raw/13 §3-4, raw/06 ⑱)
  ARAM_EtherealWeapon: 'S',          // 환영 무기 — 펨코 "환무" 유명 조합 다수(헤카림·신지드·그라가스·에코) + 라이브 26.17 57.48% (raw/06 ⑤~⑧)
  ARAM_MysticPunch: 'S',             // 신비한 주먹 — 인벤 프리즘 평가 S + arammayhem 54.99%·픽률 28% (raw/13 §3-3, raw/07 §1-1)
  ARAM_GiantSlayer: 'S',             // 거인 학살자 — 인벤 프리즘 평가 S "모든 딜러" (raw/13 §3-3)
  ARAM_Eureka: 'S',                  // 유레카 — 인벤 S + blitz S + 라이브 26.17 58.23% (raw/13 §3-3, raw/07 §1-4)
  ARAM_JeweledGauntlet: 'S',         // 보석 건틀릿 — aramnerfs S+·blitz S + 디시 "스킬 치명타 2.5배 개꿀" (raw/07 §1-4, raw/06 ㉓)
  ARAM_ItsKillingTime: 'S',          // 처형 시간 — 펨코 "처형시간 코그모 좌절감 GOAT·AP 나서스 개사기" (raw/06 ⑲)
  ARAM_Typhoon: 'S',                 // 태풍 — 펨코 "세나 태풍 GOAT — 실버인데 프리즘급, 무조건 먹으셈" (raw/06 ⑩)
  FinalForm: 'S',                    // 최종 형태 — 펨코 "퓨어탱커 최종형태 답없음·문도 재앙" (raw/06 ⑫)
  ARAM_Quest_WoogletsWitchcap: 'S',  // 우글렛의 마녀 모자 — 인벤 프리즘 평가 S + 블로그 "AP딜러 최사기" (raw/13 §3-3·§3-4)
  BiggestSnowballEver: 'S',          // 데굴데굴 눈덩이! — games.gg "모드 최강 단일 증강 논쟁 후보" + aussyelo·u.gg S (raw/07 §3-3·§3-4)
  ARAM_ClownCollege: 'S',            // 광대 대학 — 인벤 프리즘 평가 S + 펨코 "광대 자폭샤코" (raw/13 §3-3, raw/06 ⑯) ※ 비활성 — 재활성 시 유효

  /* ===== A (40종) ===== */
  ARAM_ADAPt: 'A',                   // 펨코 "적능" 사기증강 리스트·"증바람에서만의 맛" + EloFactory 라이즈 콤보 (raw/06 ⑮·㉗, raw/07 §4)
  ARAM_BluntForce: 'A',              // u.gg 실버 S 추천 + 라이브 26.17 58.26% 상위 (raw/07 §1-2)
  ARAM_Deft: 'A',                    // 증바람.com 징크스 실측 59%·픽률 19% + esports.net 실버 추천 (raw/13 §1-3, raw/07 §3-2)
  ARAM_HeavyHitter: 'A',             // 라이브 26.17 58.01% 상위 + esports.net 탐켄치·초가스·문도 (raw/07 §3-2)
  ARAM_IceCold: 'A',                 // 펨코 챔피언별 사기증강 "차냉"(애쉬·아우렐리온 솔) (raw/06 ㉗)
  ARAM_MindtoMatter: 'A',            // 펨코 라이즈·카사딘 "정신변환" 사기 리스트 + EloFactory 질리언·미포 콤보 (raw/06 ④·⑪, raw/07 §4)
  ARAM_StackosaurusRex: 'A',         // games.gg "스택 챔피언에게 자동 승리 조건" + 베이가·스몰더·세나 (raw/07 §3-3, raw/06 ㉗)
  TitansPulse: 'A',                  // 확고한 의지로 — 스킬 증강 실측 1위 52.29% #21/209 (raw/16 §4)
  ARAM_ApexInventor: 'A',            // u.gg 골드 S 추천 (raw/07 §1-2)
  CriticalMissile: 'A',              // blitz 골드 S + 라이브 26.17 59.20% 상위 (raw/07 §1-4)
  ARAM_Firebrand: 'A',               // u.gg 골드 S + 펨코 카타리나=화염낙인 (raw/07 §1-2, raw/06 ㉑)
  ARAM_Flashy: 'A',                  // u.gg 골드 S 추천 (raw/07 §1-2)
  ARAM_FromBeginningToEnd: 'A',      // u.gg·esports.net·games.gg 골드 최상위 공통 추천 (raw/07)
  ARAM_MagicMissile: 'A',            // blitz 골드 S + 펨코 아지르·오로라 추천 (raw/07 §1-4, raw/06 ㉗)
  ARAM_Overflow: 'A',                // 인벤 "범람 = 미니 기돌, 딜 약 20%" + EloFactory 카사딘 루프 (raw/13 §3-3, raw/07 §3-5)
  ARAM_PhenomenalEvil: 'A',          // blitz 골드 S + 라이브 26.17 58.09% + op.gg 브랜드·카서스 최적 (raw/07 §1-3·§1-4)
  PressureCooker: 'A',               // 인벤 탱커 매핑 "찜솥" + aramnerfs S (raw/13 §3-3, raw/07 §1-4)
  ARAM_ScopierWeapons: 'A',          // blitz 골드 S "Scopier Weapons" (raw/07 §1-4)
  ARAM_SoulSiphon: 'A',              // u.gg 골드 S + games.gg 야스오·요네 + 라이브 26.17 58.24% (raw/07)
  BurstingTeeth: 'A',                // 이빨 요정 — 라이브 26.17 57.76% 상위 + aramtheory 추천 (raw/07 §1-4)
  ARAM_Upgrade_IE: 'A',              // 인벤 치명타 서열 1위 "인피" + 라이브 26.17 57.40% (raw/13 §3-3)
  ARAM_Vulnerability: 'A',           // 인벤 치명타 서열 2위 "취약" + 라이브 26.17 57.59% + 나무위키 가렌 (raw/13 §3-3, raw/06 §7)
  WarlockJuicebox: 'A',              // 라이브 26.17 59.31% 상위 10위권 (WebFetch 대조)
  ARAM_BladeWaltz: 'A',              // 나무위키 "가렌 검무 — 무적+타겟팅 살인적 딜량" (raw/13 §3-2)
  ARAM_CircleofDeath: 'A',           // 펨코 "자크 죽순 1대5" + EloFactory 자크·모데·트린 콤보 (raw/06 ⑭, raw/07 §4)
  ARAM_Dashing: 'A',                 // 인벤 S·디시 "오로라·피즈 사기급" — 단 라이브 승률 하위권이라 S 제외 (raw/13 §3-1·§3-3)
  ARAM_FanTheHammer: 'A',            // 인벤 원딜 매핑 "탄환 세례" + 베인·나르 "평타 한 방 삭제" 콤보 (raw/13 §3-3, raw/07 §4)
  ARAM_FeyMagic: 'A',                // u.gg 뉴스 S + 나무위키 카사딘 + 인벤 "원형낫이랑 쓸만" (raw/07 §1-2, raw/13)
  ARAM_Goliath: 'A',                 // 인벤 A + u.gg 뉴스 S + 라이브 26.17 57.58% (raw/13 §3-3, raw/07)
  InfiniteRecursion: 'A',            // 라이브 26.17 59.26% 상위 + blitz S (raw/07 §1-4)
  ARAM_MadScientist: 'A',            // u.gg 프리즘 상위 + 라이브 26.17 57.13% (raw/07 §1-2)
  ARAM_MasterofDuality: 'A',         // 인벤 원딜 매핑 "결투의 대가" + 펨코 유나라 "결대+양잡" (raw/13 §3-3, raw/06 ㉗)
  PoroCharge_Active: 'A',            // 게임플 1티어 "포로발사기" + 펨코 §4 화제성 (raw/06 ㉘·§4)
  ARAM_ProteinShake: 'A',            // 펨코 "프로틴음료 존내맛잇음"·"크산테 실드 못 뚫음" (raw/06 ⑬)
  ARAM_Quest_VoidImmolation: 'A',    // 증바람.com 말파이트 승률 1위 62% + 펨코 레오나 (raw/13 §1-3, raw/06 ㉗)
  ARAM_Quest_UrfsChampion: 'A',      // esports.net 골드 추천 + 펨코 이렐리아 (raw/07 §3-2, raw/06 ㉗)
  ARAM_ScopiestWeapons: 'A',         // u.gg 뉴스 S + 인벤 원딜 매핑 + 세나 "우물 저격" (raw/07)
  UltimateAwakening: 'A',            // 인벤 A + u.gg 뉴스 S + 펨코 아리·카사딘 (raw/13 §3-3, raw/07 §1-2)
  ARAM_UltimateRevolution: 'A',      // 인벤 A + games.gg "한타에 궁 2번" + 카서스·말파 (raw/13, raw/07 §3-3, raw/06 ㉒)
  ARAM_WindspeakersBlessing: 'A',    // 디시 "소나 먹으면 죽고 싶어도 못 죽음" + u.gg 프리즘 상위 (raw/06 ⑳, raw/07 §1-2)

  /* ===== B (34종 — 큐레이션분) ===== */
  ARAM_escAPADe: 'B',                // 펨코 초가스 "마법사(물리) 걸어다니는 재난" (raw/06 ⑮)
  ARAM_Homeguard: 'B',               // 인벤 "민병대 탈실버" (raw/13 §3-3)
  ARAM_LegDay: 'B',                  // 인벤 "하체운동(신발 스킵)" + esports.net (raw/13 §3-3, raw/07 §3-2)
  ARAM_ScopedWeapons: 'B',           // u.gg 실버 S 추천 + sheepesports (raw/07 §1-2·§3-1)
  ARAM_SlapAround: 'B',              // 인벤 "우당탕탕 — CC 적중 시 적응형 스택(아트록스·쓰레쉬·자크)" (raw/06 §4)
  ARAM_Snowday: 'B',                 // esports.net·games.gg 세트 S "눈덩이는 항상 쓸 수 있어" (raw/07 §3-2)
  ARAM_TankItOrLeaveIt: 'B',         // u.gg 실버 S 추천 (raw/07 §1-2)
  ARAM_UltimateUnstoppable: 'B',     // 펨코 카사딘 사기증강 "궁극기 저지불가" (raw/06 ⑪)
  ARAM_WitchfulThinking: 'B',        // u.gg·esports.net 실버 추천 (raw/07 §1-2·§3-2)
  Bonk: 'B',                         // 꽁! — 실측 51.22% #42 + 강화 평타 13챔프 한정 (raw/16 §4)
  ARAM_CelestialBody: 'B',           // 증바람.com 말파이트 53%·픽률 12% (raw/13 §1-3)
  ARAM_ItsCritical: 'B',             // esports.net 골드 추천 + 인벤 치명타 서열 중위 "치확50%" (raw/07 §3-2, raw/13 §3-3)
  LittleExtraHelp: 'B',              // 실측 50.75% #59 + 애쉬 t0 픽률 14.8% (raw/16 §4·§5)
  ARAM_Minionmancer: 'B',            // 펨코 "아이번+소환물 증강 개꿀잼"·자이라 추천 (raw/06 ㉖)
  ARAM_Perseverance: 'B',            // 펨코 "프로틴+탱크엔진+강철심장+인내심 = 서렌" (raw/06 ⑬) ※ 비활성
  ARAM_SkilledSniper: 'B',           // 펨코 모르가나·미포·멜·벨코즈·바루스 추천 (raw/06 ㉗)
  SoulEater: 'B',                    // EloFactory 갈리오 "도발 후 사실상 무적" — 단 라이브 승률 하위권 (raw/07 §4)
  ARAM_Upgrade_Sheen: 'B',           // 펨코 이즈리얼 "보건+광휘 업글" (raw/06 ㉗)
  ARAM_WeeWooWeeWoo: 'B',            // aussyelo 세트 A — 소나 "치유·보호막 45% 증폭" (raw/07 §3-4)
  ARAM_Archmage: 'B',                // EloFactory·aussyelo 대마법사 세트(브랜드·카사딘·라이즈) (raw/07 §3-4·§3-5)
  ARAM_CantTouchThis: 'B',           // 펨코 카사딘 사기증강 "난공불락" (raw/06 ⑪)
  ARAM_CourageoftheColossus: 'B',    // 인벤 A ↔ 라이브 26.17 하위 15위권 50.20% — 중간 판정 (raw/13 §3-3)
  ARAM_Cruelty: 'B',                 // 펨코 CC챔프 다수 추천 "잔혹 행위" ↔ 라이브 하위권 — 중간 판정 (raw/06 ㉗·§4)
  ARAM_DoubleTap: 'B',               // 자야 "Dual Wield+Double Tap" 콤보 영상 + 49.83% (raw/07 §1-1·§2)
  ARAM_DropBear: 'B',                // u.gg 프리즘 상위 나열 (raw/07 §1-2)
  ARAM_EndlessHunt: 'B',             // aramnerfs A "En Passant" (raw/07 §1-4)
  HandOfBaron: 'B',                  // u.gg 프리즘 상위 나열 (raw/07 §1-2)
  OminousPact: 'B',                  // 펨코 신지드·카사딘 "불길한 서약" ↔ 라이브 하위권 — 중간 판정 (raw/06 ⑥·⑪)
  ARAM_OmniSoul: 'B',                // u.gg 프리즘 상위 나열 (raw/07 §1-2)
  ARAM_QuantumComputing: 'B',        // 인벤 B + 펨코 "양자 연산 첫 증강 GOAT" (raw/13 §3-3, raw/06 ㉗) ※ 비활성
  ARAM_SpiritBomb: 'B',              // u.gg 프리즘 상위 나열 (raw/07 §1-2)
  SurgeField: 'B',                   // aramnerfs A "Surge Field" (raw/07 §1-4)
  ARAM_SymphonyofWar: 'B',           // aramnerfs A "Symphony of War" (raw/07 §1-4)
  Quest_UltraHydra: 'B',             // u.gg 프리즘 상위 나열 "Ultra Hydra" (raw/07 §1-2)

  /* ===== C (27종 — 근거 있는 평범/하위권. 등재 없는 C는 FUN_TIER_INFERRED에) ===== */
  DoubleDefense: 'C',                // 보강 — 실측 49.40% #101 (raw/16 §4)
  EscapePlan: 'C',                   // aramtheory 챔피언 한정 추천 정도 (raw/07 §1-4)
  ARAM_Firefox: 'C',                 // 라이브 26.17 하위 15위권 50.56% (WebFetch 대조)
  HextechSoul: 'C',                  // 라이브 26.17 하위 15위권 50.72% (WebFetch 대조)
  ARAM_InfernalSoul: 'C',            // 라이브 26.17 하위 15위권 50.30% (WebFetch 대조)
  ItsGoTime: 'C',                    // 출발할 시간 — 실측 49.50% #97 (raw/16 §4)
  ARAM_MountainSoul: 'C',            // 펨코 세라핀 한정 추천 정도 (raw/06 ㉗)
  ARAM_SonicBoom: 'C',               // 나무위키 나미 한정 추천 정도 (raw/06 §7)
  ARAM_SpinToWin: 'C',               // 나무위키 가렌 한정 추천 정도 (raw/06 §7)
  ARAM_SustainingStrike: 'C',        // 흡수 — 전역 48.29% #138 (야스오 한정 t0 예외) (raw/16 §4·§5)
  ARAM_AllForYou: 'C',               // 라이브 26.17 하위 15위권 50.56% (WebFetch 대조)
  ARAM_BreadAndCheese: 'C',          // 실측 48.15% #145 — 단 인벤 "E가속 > Q가속" 상대 우위 (raw/16 §4, raw/13 §2-3)
  CriticalRhythm: 'C',               // 인벤 치명타 서열 하위 (raw/13 §3-3)
  DarkWind: 'C',                     // 굶주린 속박 — 실측 48.21% #143 (raw/16 §4)
  MercysStrike: 'C',                 // 자비의 일격 — 실측 49.97% #82, 힐/실드 11챔프 한정 (raw/16 §4)
  Nightstalking: 'C',                // aramtheory 챔피언 한정 추천 정도 (raw/07 §1-4)
  Overextender: 'C',                 // 펨코 "무리한 진입 신지드" 난입 재미 정도 (raw/06 ⑥)
  ARAM_RabbleRousing: 'C',           // 원기 회복 — 실측 48.47% #135 (raw/16 §4)
  Sonata: 'C',                       // 나무위키 나미 한정 추천 정도 (raw/06 §7)
  Terraind: 'C',                     // 지형 생성됨 — 실측 48.27% #139, 지형 6챔프 한정 (raw/16 §4)
  ARAM_YowchMyCoins: 'C',            // 라이브 26.17 하위 15위권 50.55% (WebFetch 대조)
  Ability_SelfAOE_DoubleCast: 'C',   // 메아리 시전 — 실측 49.26% #109, 나무위키 "특수 메커니즘" 개성파 (raw/16 §4, raw/13 §2-3)
  EmpyreanPromise: 'C',              // 라이브 26.17 하위 15위권 50.60% (WebFetch 대조)
  ARAM_PandorasBox: 'C',             // 라이브 26.17 하위권 50.23% (WebFetch 대조)
  Missile_Split: 'C',                // 주문 분산 — 실측 48.09% #147 (raw/16 §4)
  SpellVolley: 'C',                  // 3연발 — 실측 48.59% #129 + 증바람.com 47%·픽률 0.39% (raw/16 §4, raw/13 §2-2)

  /* ===== D (15종) — 실측 하위·공인 함정 ===== */
  // 스킬 증강 컷: mm 전역 순위 #157/209 이하(승률 ≤47.7%)를 D로 (raw/16 §4; 한국 실측도
  // "스킬 증강 승률 44~49%·최하위권 C~D티어" — raw/13 §2-2·§2-3와 정합)
  WardingWeapon: 'D',                // 적응형 와드 — 실측 47.66% #157/209 (raw/16 §4)
  TrustyWeapon: 'D',                 // 믿음직한 무기 — 실측 47.49% #163 (raw/16 §4)
  ARAM_BreadAndButter: 'D',          // 빵과 버터 — 실측 47.48% #164 + 증바람.com 47%·1.72% + 인벤 가속 서열 최하 (raw/16, raw/13)
  ARAM_BreadAndJam: 'D',             // 빵과 잼 — 실측 47.54% #160 + 라이브 하위 15위권 (raw/16 §4)
  ChainReaction: 'D',                // 연쇄 반응 — 실측 46.32% #197 + 증바람.com 44%·0.38% (raw/16 §4, raw/13 §2-2)
  ARAM_CriticalHealing: 'D',         // 치명적 치유 — 인벤 치명타 서열 최하위 + 라이브 하위 15위권 (raw/13 §3-3)
  ARAM_SpecializedRecursion: 'D',    // 가속 추구 — 실측 47.29% #174 (raw/16 §4)
  SpecializedEmpowerment: 'D',       // 위력 추구 — 실측 47.63% #158 (raw/16 §4)
  ARAM_Quickstep: 'D',               // 날쌘걸음 — 실측 46.54% #195 + 펨코 "픽률 29.7% 승률 46.2% 함정 증강" (raw/16, raw/06 ⑤)
  ARAM_Terror: 'D',                  // 공포 — 실측 47.38% #171 (raw/16 §4)
  GlassCannon: 'D',                  // 유리 대포 — 인벤 프리즘 평가 F (raw/13 §3-3)
  KingMe: 'D',                       // 나는 왕이다 — 인벤 프리즘 평가 F (raw/13 §3-3)
  ARAM_Multishot: 'D',               // 다중 공격 — 실측 45.58% #201/209 최하위권 (raw/16 §4)
  Overloaded: 'D',                   // 과충전 — 실측 46.86% #186 + 나무위키 "카서스는 없는 증강"(라이즈 한정 예외) (raw/16, raw/13 §1-1)
  Overkill: 'D',                     // 바늘꽂이(mm 표기 Pin Cushion) — 실측 46.72% #190 (raw/16 §4)
};

// 근거 미등재분 — 태그·등급·유사 증강 유추 (A 이상 금지: B/C만. 비활성+근거 없음 → C)
const FUN_TIER_INFERRED = {
  /* 실버 — 순수 스탯/소소한 효과 위주 → C */
  Adamant: 'C',                      // 비활성
  CritNCast: 'C',
  ARAM_DiveBomber: 'C',
  ARAM_DontBlink: 'C',
  DontChangeTheChannel: 'C',
  DoubleStrike: 'C',                 // 비활성(미출시)
  ARAM_Erosion: 'C',
  ARAM_FirstAidKit: 'C',
  Flash2: 'C',
  ARAM_Flashbang: 'C',
  ForgedByTheMaster: 'C',
  ARAM_Goredrink: 'C',
  ARAM_GuiltyPleasure: 'C',
  ARAM_Juiced: 'C',
  KillSecured: 'C',
  ARAM_LightemUp: 'C',
  MightyShield: 'C',
  ARAM_OceanSoul: 'C',
  Poltergeist: 'C',
  ARAM_Purist_Caster: 'C',
  ARAM_ShadowRunner: 'C',
  YouSpinMeRightRound: 'C',
  ARAM_Stats: 'C',
  SwiftAndSafe: 'C',
  ARAM_TransmuteGold: 'C',
  Twinfire: 'C',
  ARAM_Upgrade_Collector: 'C',
  Upgrade_DeathDance: 'C',
  ARAM_Upgrade_Immolate: 'C',
  ARAM_Upgrade_ZH: 'C',
  VeilOfWarding: 'C',
  ARAM_Zealot: 'C',
  /* 골드 — 기본 C, 광역/소환/놀이성 태그(aoe·summoner·onkill 콤보류)는 B 유추 */
  ARAM_BigBrain: 'C',
  ARAM_DawnbringersResolve: 'C',
  ARAM_DivineIntervention: 'C',
  Donation: 'C',
  EndlessDecimation: 'B',            // 유추: 골드 aoe/heal/ad 키스톤류 — 유사 광역 증강 준거
  TrainOfTheDead: 'C',               // 비활성
  ARAM_BangBang: 'C',
  ARAM_GetExcited: 'C',
  GrowthSpurt: 'B',                  // 유추: 소환수 성장(summoner/tank) — 소환물 계열(소환술사 B) 준거
  BrushPower: 'C',
  ARAM_Impassable: 'C',
  ARAM_Marksmage: 'C',
  NatureIsHealing: 'C',
  ARAM_OkBoomerang: 'B',             // 유추: 골드 poke/aoe 투사체 놀이성 — 부메랑류
  Equilibrium: 'C',
  ARAM_OutlawsGrit: 'C',
  PatOnTheBack: 'C',
  PinballSnowball: 'B',              // 유추: 눈덩이 놀이성(summoner) — 눈덩이 계열(눈 오는 날 B) 준거
  PinCushion: 'C',                   // 고슴도치(골드) — mm "Pin Cushion"(바늘꽂이=Overkill)와 다른 증강
  ARAM_SearingDawn: 'C',
  FishBait: 'B',                     // 유추: 상어 미끼 cc/aoe 놀이성
  SharkTempest: 'B',                 // 유추: 상어 폭풍 summoner/aoe 놀이성
  ARAM_ShrinkRay: 'C',
  SnapBack: 'C',                     // 비활성(미출시)
  SnowballUpgrade: 'C',              // 비활성
  Snowbomb: 'B',                     // 유추: 눈덩이 폭발(summoner/cc) 놀이성
  ARAM_SpiritualPurification: 'B',   // 유추: onkill/aoe/execute 연쇄 처치 콤보류
  ARAM_StatsOnStats: 'C',
  ARAM_ThreadtheNeedle: 'C',
  Upgrade_Ravenous: 'C',
  Upgrade_SunderedSky: 'C',
  Vampirism: 'C',                    // 비활성
  VoidDash: 'C',                     // 비활성
  ARAM_WithHaste: 'C',
  KeepGoing: 'C',                    // 비활성(미출시)
  /* 프리즘 — 게임체인저 등급 유추 B, 순수 스탯/아이템 업글·비활성 무근거는 C */
  ARAM_LittleDevil: 'C',             // 비활성
  DimensionShift_Active: 'B',        // 유추: 프리즘 유틸 게임체인저류
  ARAM_Dropkick: 'B',                // 유추: 프리즘 execute/aoe
  Dropybara_Active: 'C',             // 비활성
  ARAM_Earthwake: 'B',               // 유추: 프리즘 돌진 연계 광역 — 돌진 계열(돌진 A) 하위 준거
  ARAM_EmpoweredByTheFaithful: 'B',  // 유추: 프리즘 서포트 게임체인저류
  Goldrend: 'B',                     // 유추: 프리즘 골드 스노볼류
  ARAM_Hellbent: 'B',                // 유추: 프리즘 heal/move/tank
  GoldenSnowball: 'B',               // 유추: 프리즘 눈덩이 계열
  PromQueen: 'B',                    // 유추: 프리즘 cc/move 게임체인저류
  SquishySlappyGrab: 'B',            // 유추: 프리즘 다중 그랩류(cc/aoe)
  ARAM_StatsOnStatsOnStats: 'C',     // 순수 스탯 3중 — 능력치 계열(C) 준거
  ARAM_StuckInHereWithMe: 'B',       // 유추: 프리즘 궁 연계 감금류
  ARAM_ImTheJuggernaut: 'B',         // 유추: 프리즘 탱커 스탯 대형화류
  ARAM_TransmuteChaos: 'B',          // 유추: 프리즘 전환 도박류 — 전환: 프리즘(S) 하위 준거
  ARAM_InfernoTriggered: 'B',        // 유추: 프리즘 move/aoe
  SkipTheBasics: 'B',                // 유추: 프리즘 궁극기 특화 — 궁극기 계열(A) 하위 준거
  ARAM_DivineDomain: 'B',            // 유추: 프리즘 onkill/heal/move
  Quest_Sneakerhead: 'C',            // 비활성
  Upgrade_SwordOfBlossom: 'C',       // 아이템 업그레이드 스탯류 — Upgrade_* 계열(C) 준거
};

// 무결성 가드: 전원 커버·중복 없음·어휘·유추분 A 이상 금지·S 폭주 방지 (계약)
(function validateFunTier() {
  const apiSet = {};
  for (const a of augData.augments) apiSet[a.apiName] = true;
  const seen = {};
  function check(table, label, inferred) {
    for (const k of Object.keys(table)) {
      if (!apiSet[k]) throw new Error('funTier ' + label + ': 미실존 apiName ' + k);
      if (seen[k]) throw new Error('funTier: ' + k + ' 두 표에 중복 등재');
      seen[k] = true;
      const v = table[k];
      if (['S', 'A', 'B', 'C', 'D'].indexOf(v) === -1) throw new Error('funTier 어휘 위반: ' + k + '=' + v);
      if (inferred && v !== 'B' && v !== 'C') throw new Error('funTier 유추분은 B/C만 (근거 없는 고평가 금지): ' + k + '=' + v);
    }
  }
  check(FUN_TIER, '큐레이션', false);
  check(FUN_TIER_INFERRED, '유추', true);
  const missing = augData.augments.filter(function (a) { return !seen[a.apiName]; }).map(function (a) { return a.apiName; });
  if (missing.length > 0) throw new Error('funTier 미부여 ' + missing.length + '건: ' + missing.join(', '));
  let s = 0;
  for (const k of Object.keys(FUN_TIER)) if (FUN_TIER[k] === 'S') s++;
  if (s > 30) throw new Error('funTier S ' + s + '개 > 30 (분포 폭주)');
})();

/* ------------------------------------------------------------------ */
/* 3. 적용                                                              */
/* ------------------------------------------------------------------ */

const RESTR_KEY_ORDER = ['rangedOnly', 'meleeOnly', 'requiresMana', 'classRequired', 'classExcluded',
  'championWhitelist', 'championExclude', 'abilityProps', 'abilityPropsAll', 'spellExclude', 'spellPin', 'slot', 'note'];

const logRows = []; // { apiName, nameKo, category, fields:[], why }
const counts = { ability: 0, quest: 0, normal: 0, restrAdded: 0, weightAdded: 0,
  mapSpellPin: 0, mapSpellExclude: 0, mapChampionExclude: 0 };
const funDist = { S: 0, A: 0, B: 0, C: 0, D: 0 };
let funInferredCount = 0;

function orderedRestrictions(r) {
  const out = {};
  for (const k of RESTR_KEY_ORDER) if (r[k] !== undefined) out[k] = r[k];
  for (const k of Object.keys(r)) if (out[k] === undefined) out[k] = r[k]; // 미지 키 보존
  return out;
}

for (const aug of augData.augments) {
  const api = aug.apiName;
  const r = Object.assign({}, aug.restrictions);
  const changedFields = new Set();
  let fav; let dis;

  // (1) category
  const category = ABILITY.has(api) ? 'ability' : (QUEST.has(api) ? 'quest' : 'normal');
  counts[category]++;

  // (1b) funTier — 꿀잼 티어 (2.7 큐레이션 표; 가드에서 전원 커버 보장됨)
  const funTier = FUN_TIER[api] !== undefined ? FUN_TIER[api] : FUN_TIER_INFERRED[api];
  funDist[funTier]++;
  if (FUN_TIER[api] === undefined) funInferredCount++;

  // (2) 스킬 증강 requiredProps → abilityPropsAll (스킬 단위 AND 원칙 — 계약서 기준)
  if (ABILITY.has(api)) {
    const req = ABILITY.get(api);
    if (req.length > 0) {
      r.abilityPropsAll = req.slice();
      changedFields.add('abilityPropsAll=' + req.join('+'));
      delete r.abilityProps; // 종전 OR 게이트는 abilityPropsAll이 대체 (무조건 삭제 — 재실행 결정론)
    }
  }

  // (3) 그룹 게이트 (이진 — empirical 이상)
  if (MANA_GATE.indexOf(api) !== -1) { r.requiresMana = true; changedFields.add('requiresMana'); }
  if (DASH_GATE.indexOf(api) !== -1) { r.abilityProps = ['dash']; changedFields.add('abilityProps=dash'); }
  if (IMMOBILIZE_GATE.indexOf(api) !== -1) { r.abilityProps = ['immobilize']; changedFields.add('abilityProps=immobilize'); }
  if (SELFHEAL_GATE.indexOf(api) !== -1) { r.abilityProps = ['heal']; changedFields.add('abilityProps=heal'); }
  if (SUPPORT_GATE.indexOf(api) !== -1) { r.classRequired = ['Support']; changedFields.add('classRequired=Support'); }
  if (SNIPER_GATE.indexOf(api) !== -1) { r.rangedOnly = true; changedFields.add('rangedOnly'); }
  if (MELEE_GATE.indexOf(api) !== -1) { r.meleeOnly = true; changedFields.add('meleeOnly'); }

  // (4) 그룹 가중치 (선호 층위 — favoredClasses/disfavoredClasses)
  if (ADCRIT.indexOf(api) !== -1) { fav = AD_FAVORED.slice(); dis = AD_DISFAVORED.slice(); }
  if (AP_GROUP.indexOf(api) !== -1) { fav = AP_FAVORED.slice(); dis = AP_DISFAVORED.slice(); }
  if (api === 'ARAM_PhenomenalEvil') { fav = AP_FAVORED.slice(); } // 예외: 징크스 포함 관측 — disfavored 미부여
  if (CRITSTATS.indexOf(api) !== -1) { fav = ['Marksman']; }
  if (api === 'ARAM_StuckInHereWithMe') { fav = ['Fighter', 'Tank', 'Assassin']; } // meleeCluster 불확실분 — 가중치만

  // (5) 개별 지시
  const op = OPS[api];
  if (op) {
    if (op.r) for (const k of Object.keys(op.r)) { r[k] = op.r[k]; changedFields.add(k); }
    if (op.dropProps) { delete r.abilityProps; changedFields.add('-abilityProps(화이트리스트로 대체)'); }
    if (op.drop) for (const k of op.drop) { if (r[k] !== undefined) { delete r[k]; changedFields.add('-' + k + '(근사 해제)'); } }
    if (op.note) r.note = op.note;
    if (op.fav) fav = op.fav.slice();
    if (op.dis) dis = op.dis.slice();
  }

  // (5b) ability-augment-map 이식 병합 — OPS(1차 스터디) 위에 3차 실매핑을 얹는다 (합집합, 결정론).
  const md = MAP_DERIVED[api];
  if (md) {
    // excluded(official/datamined/empirical) → spellExclude 합집합 (스킬 배열은 QWER 순 정렬)
    const seChamps = Object.keys(md.spellExclude).sort();
    if (seChamps.length > 0) {
      const merged = {};
      const base = (r.spellExclude && typeof r.spellExclude === 'object') ? r.spellExclude : {};
      for (const c of Object.keys(base)) merged[c] = base[c].slice();
      for (const c of seChamps) {
        if (!merged[c]) merged[c] = [];
        for (const k of md.spellExclude[c]) if (merged[c].indexOf(k) === -1) merged[c].push(k);
      }
      const SKILL_ORDER = ['Q', 'W', 'E', 'R'];
      const ordered = {};
      for (const c of Object.keys(merged).sort()) {
        ordered[c] = merged[c].slice().sort(function (x, y) { return SKILL_ORDER.indexOf(x) - SKILL_ORDER.indexOf(y); });
      }
      r.spellExclude = ordered;
      changedFields.add('spellExclude(map)');
      counts.mapSpellExclude += seChamps.reduce(function (n, c) { return n + md.spellExclude[c].length; }, 0);
    }
    // excluded 챔피언 단위 → championExclude 합집합
    if (md.championExclude.length > 0) {
      const list = (r.championExclude || []).slice();
      for (const c of md.championExclude) if (list.indexOf(c) === -1) { list.push(c); counts.mapChampionExclude++; }
      r.championExclude = list;
      changedFields.add('championExclude(map)');
    }
    // offered 스킬 명시분 → spellPin (지정 확정 — 풀 필터 아님. community 허용, note에 표기)
    const pinChamps = Object.keys(md.pins).sort();
    if (pinChamps.length > 0) {
      const pin = {};
      const communityPins = [];
      for (const c of pinChamps) {
        pin[c] = md.pins[c].skill;
        if (md.pins[c].confidence === 'community') communityPins.push(c + '=' + md.pins[c].skill);
      }
      r.spellPin = pin;
      changedFields.add('spellPin(' + pinChamps.length + '건)');
      counts.mapSpellPin += pinChamps.length;
      if (communityPins.length > 0) {
        // 재실행 결정론: 종전 실행이 남긴 동일 마커 suffix를 제거한 뒤 다시 부착
        const MARKER = ' ‖ spellPin 중 community 실측분';
        const base = r.note ? String(r.note).split(MARKER)[0] : '스킬 지정 확정 매핑(spellPin) — 근거: ability-augment-map.json';
        r.note = base + MARKER + '(위키·커뮤니티 — 전사 오차 가능): ' + communityPins.join(', ');
      }
    }
  }

  // (6) 재조립 — 키 순서: …tier 뒤 category, tags 뒤 favored/disfavored, restrictions는 마지막
  const rebuilt = {};
  for (const k of Object.keys(aug)) {
    if (k === 'category' || k === 'funTier' || k === 'favoredClasses' || k === 'disfavoredClasses' || k === 'restrictions') continue;
    rebuilt[k] = aug[k];
    if (k === 'tier') { rebuilt.category = category; rebuilt.funTier = funTier; }
    if (k === 'tags') {
      if (fav) rebuilt.favoredClasses = fav;
      if (dis) rebuilt.disfavoredClasses = dis;
    }
  }
  if (rebuilt.category === undefined) rebuilt.category = category; // tier 키가 없을 방어
  if (rebuilt.funTier === undefined) rebuilt.funTier = funTier;
  rebuilt.restrictions = orderedRestrictions(r);

  const idx = augData.augments.indexOf(aug);
  augData.augments[idx] = rebuilt;

  const gateFields = Array.from(changedFields).filter(function (f) { return f.indexOf('-') !== 0; });
  if (gateFields.length > 0) counts.restrAdded++;
  if (fav || dis) counts.weightAdded++;
  // 로그: 입력만으로 결정되는 선언적 조건 (재실행 시 동일 로그 보장)
  const fieldDesc = [];
  if (category !== 'normal') fieldDesc.push('category=' + category);
  Array.from(changedFields).forEach(function (f) { fieldDesc.push(f); });
  if (fav) fieldDesc.push('favoredClasses=' + fav.join('/'));
  if (dis) fieldDesc.push('disfavoredClasses=' + dis.join('/'));
  if (op && op.note) fieldDesc.push('note');
  if (fieldDesc.length > 0) {
    let why = (op && op.why) || (gateFields.length ? 'empirical(그룹 게이트)' : (fav || dis ? 'empirical(가중치)' : 'category 분류'));
    if (md && !(op && op.why)) why = 'ability-augment-map 이식' + (gateFields.length > 1 ? ' + ' + why : '');
    logRows.push({ apiName: api, nameKo: rebuilt.nameKo, fields: fieldDesc.join(', '), why: why });
  }
}

/* ------------------------------------------------------------------ */
/* 4. 저장                                                              */
/* ------------------------------------------------------------------ */

// 원본 포맷 유지: JSON.stringify(…, null, 1), 후행 개행 없음
fs.writeFileSync(AUG_PATH, JSON.stringify(augData, null, 1), 'utf8');

const lines = [];
lines.push('# enrich-augments 이식 로그');
lines.push('');
lines.push('- 생성: `node scripts/enrich-augments.cjs` (재실행 가능 — 수작업 편집 금지)');
lines.push('- 입력: `research/data/eligibility-notes.json` + `research/data/ability-augment-map.json` → 출력: `docs/data/augments.json`');
lines.push('- 원칙: confidence official/datamined/empirical → 이진 필터(restrictions), community → note까지만, 선호 층위 → favoredClasses/disfavoredClasses (근거: research/AUGMENT-POOLS-STUDY.md §3). 예외: restrictions.spellPin(지정 확정 매핑)은 풀 필터가 아니라 community 허용 — note에 표기 (real-mapping 계약)');
lines.push('');
lines.push('## 요약');
lines.push('');
lines.push('| 항목 | 값 |');
lines.push('|---|---|');
lines.push('| category=ability | ' + counts.ability + ' |');
lines.push('| category=quest | ' + counts.quest + ' |');
lines.push('| category=normal | ' + counts.normal + ' |');
lines.push('| funTier 분포 (S/A/B/C/D) | ' + funDist.S + '/' + funDist.A + '/' + funDist.B + '/' + funDist.C + '/' + funDist.D + ' |');
lines.push('| funTier 근거 미등재 유추분 (B/C 한정) | ' + funInferredCount + ' |');
lines.push('| 이진 restrictions 필드 보유(이번 이식으로 부여/갱신) | ' + counts.restrAdded + ' |');
lines.push('| 가중치 필드(favored/disfavoredClasses) 보유 | ' + counts.weightAdded + ' |');
lines.push('| map 이식: spellPin (챔피언×증강 지정 확정) | ' + counts.mapSpellPin + ' |');
lines.push('| map 이식: spellExclude 항목(챔피언×스킬) | ' + counts.mapSpellExclude + ' |');
lines.push('| map 이식: championExclude 신규 | ' + counts.mapChampionExclude + ' |');
lines.push('| map 이식 보류(사유 있음) | ' + mapLog.skip.length + ' |');
lines.push('| map pin 확정 불가(다중 스킬 적격) | ' + mapLog.conflict.length + ' |');
lines.push('');
lines.push('## ability-augment-map 이식 상세 (3차 실매핑, 306건 중)');
lines.push('');
lines.push('### excluded → 하드 필터 (' + (mapLog.spellExclude.length + mapLog.championExclude.length) + '건)');
lines.push('');
lines.push('| 증강 | 챔피언 | 스킬 | 필드 | confidence |');
lines.push('|---|---|---|---|---|');
for (const e of mapLog.championExclude) {
  lines.push('| ' + e.augment + ' | ' + e.champion + ' | — | championExclude | ' + e.confidence + ' |');
}
for (const e of mapLog.spellExclude) {
  lines.push('| ' + e.augment + ' | ' + e.champion + ' | ' + e.skill + ' | spellExclude | ' + e.confidence + ' |');
}
lines.push('');
lines.push('### 하드 필터 보류 (' + mapLog.skip.length + '건 — 각 사유)');
lines.push('');
for (const s of mapLog.skip) {
  lines.push('- `' + s.key + '` (' + s.confidence + '): ' + s.reason);
}
lines.push('');
lines.push('### offered(skill 명시) → spellPin (' + mapLog.pin.length + '건)');
lines.push('');
lines.push('| 증강 | 챔피언 | 스킬 | confidence |');
lines.push('|---|---|---|---|');
for (const p of mapLog.pin) {
  lines.push('| ' + p.augment + ' | ' + p.champion + ' | ' + p.skill + ' | ' + p.confidence + ' |');
}
lines.push('');
lines.push('### pin 확정 불가 — 다중 스킬 적격 (' + mapLog.conflict.length + '건, 지정은 ③무작위에 위임)');
lines.push('');
for (const c of mapLog.conflict) {
  lines.push('- ' + c.augment + ' × ' + c.champion + ': ' + c.skills.join('·'));
}
lines.push('');
lines.push('### 근사 게이트 완화 (offered 검증 기준 — 계약 "필터가 실제보다 좁으면 완화")');
lines.push('');
lines.push('- **ARAM_Quickstep meleeOnly 제거**: 원거리 켄넨 R offered(official, 26.12) 반증 → favoredClasses(Fighter/Tank) 강등.');
lines.push('- **TitansPulse meleeOnly 제거**: 원거리 아리·리산드라·블라디미르 offered(empirical, mayhemmeta 16챔프) 반증 → favoredClasses(Fighter/Tank) 강등.');
lines.push('- **ARAM_SkilledSniper rangedOnly 제거**: 근접 Locke Q offered(official, 26.15) 반증 → favoredClasses(Mage/Marksman) 강등.');
lines.push('- **Spin To Win 화이트리스트**: raw/15 §2-1 검증 수정본(22챔피언·28스킬)에서 스크립트 파생 — 챔피언 집합은 종전과 동일, 근거 등급을 community(위키 편집자 실측)로 정정하고 단일 QWER 스킬 확정 챔피언에는 spellPin 부여.');
lines.push('');
lines.push('## 판단 기록 (근사·보류)');
lines.push('');
lines.push('- **OceanSoul 미이식**: 마나 태그 계열이나 실측 6명 전원 등재 — STUDY §3-1 "보류" 지시대로 requiresMana 미부여.');
lines.push('- **adCrit/AP 계열은 가중치로만**: 실측은 구조적 부재(브랜드·말파이트·소라카 등)를 시사하나 DDragon tags가 하이브리드(이즈리얼 Marksman+Mage, 카타리나 Assassin+Mage)라 클래스 이진 제외는 오탐을 만든다 → favored/disfavored 가중치로 근사 (STUDY §3-2 정합). ARAM_PhenomenalEvil은 징크스 포함 관측이라 disfavored 미부여.');
lines.push('- **meleeCluster**: Upgrade_Immolate만 meleeOnly 유지 — TitansPulse·Quickstep은 신규 offered 반례로 게이트 완화(아래 "근사 게이트 완화"), Stuck in Here With Me는 실측 불확실(징크스 op.gg 등재)이라 종전대로 favoredClasses(Fighter/Tank/Assassin)만.');
lines.push('- **sniper 계열**: From Downtown(BangBang)만 rangedOnly 유지 (실제 조건은 장거리 스킬샷 보유로 추정) — Skilled Sniper는 Locke Q 공식 반례로 게이트 완화(아래 참조).');
lines.push('- **selfHealCircle 계열**: 조건을 "킷 내 회복 보유"로 추정 → abilityProps=heal.');
lines.push('- **Spin To Win**: 종전 abilityProps=spin 제거, 위키 명시 22챔피언 화이트리스트로 대체 (champions.json spin 속성 누락 리스크 회피).');
lines.push('- **excludeSpell 계열(야스오 E 등 7건)**: 챔피언 전체 제외가 아니라 스킬 슬롯 단위 부적격 → championExclude가 아닌 `restrictions.spellExclude`({챔피언id: [스킬키]})로 기록. draft.js의 enhancedSkill 지정에서 활용 가능(현재는 note 겸 기계가독 기록).');
lines.push('- **Bread 3종**: 슬롯 고정형 → `restrictions.slot`(Q/W/E) 기록. presentAugment가 아직 미사용(현재는 무작위 스킬 근사) — 후속 반영 후보.');
lines.push('- **아이템 조건부(루난→Draw Your Sword, 워모그→Vampirism)·팀 제한(Earthwake 2명)·맵 한정(Overextender)**: 1인 시뮬 범위 밖 → note로만.');
lines.push('- **quest 분류**: 위키 09 §4 목록 + descKo 퀘스트 구조 명시분(From Downtown, Ultra Hydra). 스킬 지정형 퀘스트 3종(Multishot/Pursuit of Haste/Pursuit of Power)은 겸용이지만 계약상 category=ability 우선.');
lines.push('- **Kalista×Dashing 효과 치환**: community 등급 → note로만.');
lines.push('');
lines.push('## funTier — 꿀잼 티어 (augment-fun-tier 계약)');
lines.push('');
lines.push('- 전 225종에 `funTier`(S/A/B/C/D) 부여 — 분포: S ' + funDist.S + ' / A ' + funDist.A + ' / B ' + funDist.B + ' / C ' + funDist.C + ' / D ' + funDist.D + '.');
lines.push('- 근거 우선순위: raw/13(aramgg KR T1~T5·인벤·디시) > raw/16 §4·§7·§8(스킬 증강 실측) > raw/07(영어권) > raw/06(한국 체감). 상충 시 한국 소스 우선. 라이브 26.17 대조(2026-09-03 WebFetch aramgg·arammayhem).');
lines.push('- S ' + funDist.S + '종의 근거 한 줄은 스크립트 `FUN_TIER` 상수 주석에 항목별 기재 (계약 요구).');
lines.push('- 근거 미등재 ' + funInferredCount + '종은 태그·등급·유사 증강 유추(`FUN_TIER_INFERRED`) — 계약상 A 이상 금지(B/C만), 비활성+무근거는 C.');
lines.push('- S 명단: ' + augData.augments.filter(function (a) { return a.funTier === 'S'; }).map(function (a) { return a.nameKo; }).join(', '));
lines.push('');
lines.push('## 증강별 변경 내역 (' + logRows.length + '건)');
lines.push('');
lines.push('| apiName | 이름 | 추가/변경 | 근거 |');
lines.push('|---|---|---|---|');
for (const row of logRows) {
  lines.push('| ' + row.apiName + ' | ' + row.nameKo + ' | ' + row.fields + ' | ' + row.why + ' |');
}
lines.push('');
fs.writeFileSync(LOG_PATH, lines.join('\n'), 'utf8');

console.log('[enrich-augments] category: ability=' + counts.ability + ' quest=' + counts.quest + ' normal=' + counts.normal);
console.log('[enrich-augments] funTier: S=' + funDist.S + ' A=' + funDist.A + ' B=' + funDist.B + ' C=' + funDist.C + ' D=' + funDist.D + ' (유추 ' + funInferredCount + '건)');
console.log('[enrich-augments] 이진 restrictions 부여/갱신: ' + counts.restrAdded + '건, 가중치 필드: ' + counts.weightAdded + '건');
console.log('[enrich-augments] map 이식: spellPin=' + counts.mapSpellPin + ' spellExclude=' + counts.mapSpellExclude
  + ' championExclude(신규)=' + counts.mapChampionExclude + ' 보류=' + mapLog.skip.length + ' pin충돌=' + mapLog.conflict.length);
console.log('[enrich-augments] 로그: scripts/enrich-augments-log.md (' + logRows.length + '행)');
