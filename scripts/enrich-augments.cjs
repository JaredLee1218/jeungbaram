#!/usr/bin/env node
/**
 * enrich-augments.cjs — research/data/eligibility-notes.json 의 조사 결과를
 * docs/data/augments.json 에 이식하는 변환 스크립트 (재실행 가능·결정론).
 *
 * 실행: node scripts/enrich-augments.cjs   (Node v14 호환, 의존성 0)
 * 산출: docs/data/augments.json 갱신 + scripts/enrich-augments-log.md 로그
 *
 * 이식 원칙 (근거: research/AUGMENT-POOLS-STUDY.md §3):
 *  - confidence가 official/datamined/empirical 인 것만 이진 필터(restrictions)로,
 *    community 는 note/가중치까지만.
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
const LOG_PATH = path.join(__dirname, 'enrich-augments-log.md');

const augData = JSON.parse(fs.readFileSync(AUG_PATH, 'utf8'));
const notes = JSON.parse(fs.readFileSync(NOTES_PATH, 'utf8'));

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

// Spin To Win 화이트리스트 — 위키 명시 적격 스킬 목록의 챔피언 (official).
// 근거: research/raw/03-champion-augment-pools.md §1 (검증 대기분 아크샨·뽀삐 R 등은 미포함).
const SPIN_WHITELIST = [
  'Ahri', 'Ambessa', 'Amumu', 'Darius', 'Draven', 'Garen', 'Hecarim', 'Jax',
  'Katarina', 'Kayn', 'Lillia', 'MonkeyKing', 'Nocturne', 'Rammus', 'Renekton',
  'RekSai', 'Riven', 'Samira', 'Sylas', 'Tryndamere', 'XinZhao', 'Zed',
];

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

// classBias(sniper, empirical) — 원거리 3인만 등재/근접 3인 부재 → rangedOnly로 근사
const SNIPER_GATE = ['ARAM_SkilledSniper', 'ARAM_BangBang'];

// classBias(selfHealCircle, empirical) — 조건을 "킷 내 회복 보유"로 추정 → abilityProps=heal
const SELFHEAL_GATE = ['ARAM_WindspeakersBlessing', 'ARAM_CircleofDeath'];

// classBias(meleeCluster, empirical) — 근접 3인만 등재 확실분 → meleeOnly.
// ARAM_StuckInHereWithMe 는 실측 불확실(징크스 op.gg 등재)이라 가중치로만.
const MELEE_GATE = ['TitansPulse', 'ARAM_Quickstep', 'ARAM_Upgrade_Immolate'];

// classBias(mana, empirical+datamined) — 소모 연동 3종만. 근사 아님(삼중 일치).
// ⚠ ARAM_OceanSoul 은 실측 전원 등재(STUDY §3-1 "보류")라 이식하지 않는다.
const MANA_GATE = ['ARAM_Overflow', 'ARAM_Juiced', 'ARAM_MindtoMatter'];

/**
 * 증강별 개별 이식 지시.
 * r: restrictions에 병합할 필드 / note: restrictions.note 전체 교체(결정론·재실행 안전)
 * fav/dis: 최상위 favoredClasses/disfavoredClasses / dropProps: restrictions.abilityProps 제거
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
    note: '스킬 슬롯 단위 게이트: 야스오 E(26.14)·아크샨 E(26.15) 부적격 (공식 버그픽스). 근거: eligibility-notes.json championSpecific',
    why: 'official — 26.14/26.15 버그픽스',
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
    dropProps: true, // 종전 abilityProps:['spin'] 제거 — 위키 명시 목록이 더 정확 (champions.json spin 속성 누락 리스크 회피)
    note: '위키 명시 적격 스킬 목록의 챔피언 화이트리스트 (공식 — 아리 W·R, 다리우스 Q, 가렌 E, 제드 E 등 22명). 검증 대기분(아크샨·뽀삐 R 등)은 미포함. 근거: STUDY §3-1, research/raw/03-champion-augment-pools.md §1',
    why: 'official — 위키 적격 목록',
  },

  /* --- 스킬 증강 requiredProps 외 개별 노트 --- */
  TitansPulse: {
    note: '근사: 실측에서 근접 3인(말파이트·제드·다리우스)에게만 등재 — 근접 클래스 게이트로 추정해 meleeOnly로 이식. 근거: eligibility-notes.json classBias(meleeCluster), research/raw/11-empirical-pools.md §3-8',
    why: 'empirical — 근접 3인만(11 §3-8)',
  },
  ARAM_Quickstep: {
    note: '근사: 실측에서 근접 3인에게만 등재 → meleeOnly로 이식. 26.12 발표 조건(자가 대상 AoE)은 현행 여부 미확인이라 미이식. 근거: eligibility-notes.json classBias(meleeCluster)·abilityAugments',
    why: 'empirical — 근접 3인만(11 §3-8)',
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
  SpellVolley: { note: '대상 지정이면서 투사체인 같은 스킬 하나 필요 (스킬 단위 AND — spells[i].props 기반 판정, 구스키마면 합집합 폴백). 실측: 브랜드 R·말파이트 Q만(위키 적격 목록과 일치). 근거: eligibility-notes.json abilityAugments', why: 'official + empirical' },

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
  ARAM_SkilledSniper: { note: '근사: 장거리(600+) 스킬샷 계열 — 실측에서 원거리 3인만 등재·근접 3인 부재 → rangedOnly로 근사. 근거: eligibility-notes.json classBias(sniper), research/raw/11-empirical-pools.md §3-7', why: 'empirical' },
  ARAM_BangBang: { note: '근사: 장거리(600+) 스킬샷 계열 — 실측에서 원거리 3인만 등재·근접 3인 부재 → rangedOnly로 근사. 근거: eligibility-notes.json classBias(sniper), research/raw/11-empirical-pools.md §3-7', why: 'empirical' },
  ARAM_WindspeakersBlessing: { note: '근사: 실측에서 소라카+다리우스(셀프힐 Q)만 등재 — 조건을 "킷 내 회복 보유"로 추정해 abilityProps=heal로 이식. 근거: eligibility-notes.json classBias(selfHealCircle), research/raw/11-empirical-pools.md §4-3', why: 'empirical(조건 해석은 추정)' },
  ARAM_CircleofDeath: { note: '근사: 실측에서 소라카+다리우스(셀프힐 Q)만 등재 — 조건을 "킷 내 회복 보유"로 추정해 abilityProps=heal로 이식. 근거: eligibility-notes.json classBias(selfHealCircle), research/raw/11-empirical-pools.md §4-3', why: 'empirical(조건 해석은 추정)' },
};

/* ------------------------------------------------------------------ */
/* 3. 적용                                                              */
/* ------------------------------------------------------------------ */

const RESTR_KEY_ORDER = ['rangedOnly', 'meleeOnly', 'requiresMana', 'classRequired', 'classExcluded',
  'championWhitelist', 'championExclude', 'abilityProps', 'abilityPropsAll', 'spellExclude', 'slot', 'note'];

const logRows = []; // { apiName, nameKo, category, fields:[], why }
const counts = { ability: 0, quest: 0, normal: 0, restrAdded: 0, weightAdded: 0 };

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
    if (op.note) r.note = op.note;
    if (op.fav) fav = op.fav.slice();
    if (op.dis) dis = op.dis.slice();
  }

  // (6) 재조립 — 키 순서: …tier 뒤 category, tags 뒤 favored/disfavored, restrictions는 마지막
  const rebuilt = {};
  for (const k of Object.keys(aug)) {
    if (k === 'category' || k === 'favoredClasses' || k === 'disfavoredClasses' || k === 'restrictions') continue;
    rebuilt[k] = aug[k];
    if (k === 'tier') rebuilt.category = category;
    if (k === 'tags') {
      if (fav) rebuilt.favoredClasses = fav;
      if (dis) rebuilt.disfavoredClasses = dis;
    }
  }
  if (rebuilt.category === undefined) rebuilt.category = category; // tier 키가 없을 방어
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
    logRows.push({ apiName: api, nameKo: rebuilt.nameKo, fields: fieldDesc.join(', '), why: (op && op.why) || (gateFields.length ? 'empirical(그룹 게이트)' : (fav || dis ? 'empirical(가중치)' : 'category 분류')) });
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
lines.push('- 입력: `research/data/eligibility-notes.json` → 출력: `docs/data/augments.json`');
lines.push('- 원칙: confidence official/datamined/empirical → 이진 필터(restrictions), community → note까지만, 선호 층위 → favoredClasses/disfavoredClasses (근거: research/AUGMENT-POOLS-STUDY.md §3)');
lines.push('');
lines.push('## 요약');
lines.push('');
lines.push('| 항목 | 값 |');
lines.push('|---|---|');
lines.push('| category=ability | ' + counts.ability + ' |');
lines.push('| category=quest | ' + counts.quest + ' |');
lines.push('| category=normal | ' + counts.normal + ' |');
lines.push('| 이진 restrictions 필드 보유(이번 이식으로 부여/갱신) | ' + counts.restrAdded + ' |');
lines.push('| 가중치 필드(favored/disfavoredClasses) 보유 | ' + counts.weightAdded + ' |');
lines.push('');
lines.push('## 판단 기록 (근사·보류)');
lines.push('');
lines.push('- **OceanSoul 미이식**: 마나 태그 계열이나 실측 6명 전원 등재 — STUDY §3-1 "보류" 지시대로 requiresMana 미부여.');
lines.push('- **adCrit/AP 계열은 가중치로만**: 실측은 구조적 부재(브랜드·말파이트·소라카 등)를 시사하나 DDragon tags가 하이브리드(이즈리얼 Marksman+Mage, 카타리나 Assassin+Mage)라 클래스 이진 제외는 오탐을 만든다 → favored/disfavored 가중치로 근사 (STUDY §3-2 정합). ARAM_PhenomenalEvil은 징크스 포함 관측이라 disfavored 미부여.');
lines.push('- **meleeCluster 중 Stuck in Here With Me**: 실측 불확실(징크스 op.gg 등재) → meleeOnly 대신 favoredClasses(Fighter/Tank/Assassin)만.');
lines.push('- **sniper 계열(Skilled Sniper·From Downtown)**: 완전 제외 실측(원거리 3인만) → rangedOnly로 근사 (실제 조건은 장거리 스킬샷 보유로 추정).');
lines.push('- **selfHealCircle 계열**: 조건을 "킷 내 회복 보유"로 추정 → abilityProps=heal.');
lines.push('- **Spin To Win**: 종전 abilityProps=spin 제거, 위키 명시 22챔피언 화이트리스트로 대체 (champions.json spin 속성 누락 리스크 회피).');
lines.push('- **excludeSpell 계열(야스오 E 등 7건)**: 챔피언 전체 제외가 아니라 스킬 슬롯 단위 부적격 → championExclude가 아닌 `restrictions.spellExclude`({챔피언id: [스킬키]})로 기록. draft.js의 enhancedSkill 지정에서 활용 가능(현재는 note 겸 기계가독 기록).');
lines.push('- **Bread 3종**: 슬롯 고정형 → `restrictions.slot`(Q/W/E) 기록. presentAugment가 아직 미사용(현재는 무작위 스킬 근사) — 후속 반영 후보.');
lines.push('- **아이템 조건부(루난→Draw Your Sword, 워모그→Vampirism)·팀 제한(Earthwake 2명)·맵 한정(Overextender)**: 1인 시뮬 범위 밖 → note로만.');
lines.push('- **quest 분류**: 위키 09 §4 목록 + descKo 퀘스트 구조 명시분(From Downtown, Ultra Hydra). 스킬 지정형 퀘스트 3종(Multishot/Pursuit of Haste/Pursuit of Power)은 겸용이지만 계약상 category=ability 우선.');
lines.push('- **Kalista×Dashing 효과 치환**: community 등급 → note로만.');
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
console.log('[enrich-augments] 이진 restrictions 부여/갱신: ' + counts.restrAdded + '건, 가중치 필드: ' + counts.weightAdded + '건');
console.log('[enrich-augments] 로그: scripts/enrich-augments-log.md (' + logRows.length + '행)');
