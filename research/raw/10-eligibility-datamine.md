# 10. 게임 데이터 파일에서 eligibility/가중치 필드 발굴 (데이터마이닝)

- 조사일: 2026-09-02 / 라이브 패치 26.17 (CommunityDragon `latest` 기준, 대상 파일 mtime 2026-08-29)
- 방법: CommunityDragon 원본 파일을 **실제로 다운로드하여 전수 파싱**(Node.js). 표기: ✅ = 파일을 직접 받아 파싱/집계로 확인, ❓ = 미확인/추정.
- 선행 스터디(03, 04)에서 이미 확인한 내용(챔피언별 필터링의 존재, Optimal/Viable/Average/Invalid 4단계, 명문화 제한 목록, 파일 URL 체계)은 반복하지 않고, **파일 내부 필드 수준**으로 들어간다.

---

## 0. TL;DR — 이번 발굴의 핵심

1. **`kiwi.bin.json`의 증강 정의(AugmentData 222개)에는 챔피언 목록·조건식·등장 가중치 필드가 전혀 없다.** 있는 것은 3종의 **카테고리 태그**(mAugmentTags/mBuildTags 비트마스크, AugmentDisplayTags 배열)와 5종의 미해독 해시 필드뿐. ✅
2. 그 대신 **mAugmentTags 비트마스크가 아레나의 공식 예외 카테고리(AD/AP/마나/이동기/궁극기/아군 힐·실드 등)와 사실상 1:1로 대응**하는 "요구 메커니즘" 태그임을 비트 분해로 확인했다. 예: 값 8 = 마나 요구(Overflow/Juiced/Mind to Matter/Ocean Soul 정확히 4개), 값 32 = 대시 요구(아레나 대시 예외 5종과 동일 계열 8개), 값 1024 = 궁극기 관련 7개. ✅
3. **신규 발견 파일 `augmentgroups.bin.json`**: 증강을 66개 그룹으로 묶은 별도 파일. 그룹 ID 일부는 평문("AH", "AP", "AS", "Armor", "Mana", "CritChance", "Omnivamp", "SnowBall"…), 49개는 미해독 해시. 챔피언 매핑은 없음(증강→그룹 방향만). ✅
4. **미해독 해시 필드 `{e3a02eac}`(bool)가 26.12 "스킬 증강(Ability Augment)" 플래그**임을 실증: true인 30개가 전부 스킬 증강이고, 30개 중 21개의 아이콘이 `genericabilityaugmenticon_{silver|gold|prismatic}`(등급별 범용 스킬증강 아이콘)이다(나머지 9개 — Bonk, Terror, SpecializedEmpowerment, Terraind, Overkill, DarkWind, RabbleRousing, KeepGoing, DoubleStrike — 는 전용/재사용 아이콘; 독립 재검증 실측으로 수치 보정). **스킬 증강 30종의 등급 분포 = 실버 7 / 골드 17 / 프리즘 6** → 스킬 증강은 별도 티어가 아니라 기존 3등급에 분산(Q2의 데이터 근거). ✅
5. `cherry-augments.json`은 6개 필드(id/augmentNameId/nameTRA/simpleNameTRA/augmentSmallIconPath/rarity)뿐 — eligibility 정보 전무. ✅
6. 위키 Lua 모듈도 마찬가지: Mayhem 모듈 필드는 `description/tier/notes/questinfo` 4종, Arena 모듈은 `description/tier/level1/level2/level3/notes` 6종. **champions/classes/eligibility 구조화 필드는 양쪽 다 없음**(전부 자유 텍스트). ✅
7. 아레나의 챔피언 전용 증강 **Big Dragon Energy(쉬바나 전용)조차 클라이언트 데이터에는 챔피언 필드가 없다**(cherry.bin.json 실물 확인) → **챔피언별 eligibility/가중치 판정은 100% 서버측**이라는 강한 증거. ✅
8. 게임 파일 전체 목록(files.exported.txt, 5,700만 바이트) 전수 grep 결과 **챔피언×증강 매핑 파일은 존재하지 않는다**. ✅

---

## 1. `kiwi.bin.json` 해부 (과제 1)

URL: https://raw.communitydragon.org/latest/game/maps/modespecificdata/kiwi.bin.json (12.1MB) ✅

### 1.1 파일 전체 구조

최상위 키 1,408개(경로형 키 → 객체). `__type` 히스토그램:

| __type | 개수 | 내용 |
|---|---|---|
| VfxSystemDefinitionData | 623 | 증강 이펙트(VFX) |
| SpellObject | 398 | 증강의 스펠 정의(수치 DataValues 포함) |
| **AugmentData** | **222** | **증강 본체** |
| ResourceResolver | 142 | 리소스 매핑 |
| {8d31b69b} | 12 | 퀘스트 증강의 퀘스트 정의(QuestName/Milestones 필드 보유) |
| TooltipFormat | 4 | 툴팁 템플릿 |
| {a0ffdf09} | 1 | 퀘스트 12종 경로 목록(ModesQuests/*) |
| {eb5adb26} | 1 | **증강 222개 전체 매니페스트 목록**(전수 대조: AugmentData 222개와 정확히 일치, 누락/초과 0) |
| 기타 | 4 | 텍스처/머티리얼 |

### 1.2 AugmentData 필드 전수 (222개 대상 보유 수)

| 필드 | 보유 수/222 | 의미 | 실제 값 예시 3개 |
|---|---|---|---|
| AugmentNameId | 222 | 내부 문자열 id | `"ARAM_BigBrain"`, `"ChainReaction"`, `"Sonata"` |
| NameTra | 222 | 이름 번역 키 | `"Kiwi_ARAM_BigBrain_Name"`, `"Kiwi_ChainReaction_Name"`, `"Kiwi_Sonata_Name"` |
| DescriptionTra | 222 | 요약 번역 키 | `"Kiwi_BigBrain_Summary"`, `"Kiwi_ChainReaction_Summary"`, `"Cherry_Dashing_Tooltip"`(아레나 키 재사용 사례) |
| AugmentTooltipTra | 222 | 툴팁 번역 키 | `"Kiwi_BigBrain_Tooltip"`, `"Kiwi_ChainReaction_Tooltip"`, `"Kiwi_ARAM_Augment_Multshot_Tooltip"` |
| RootSpell | 222 | 메인 스펠 경로 | `"Maps/ModeSpecificData/Augments/ARAM_BigBrain/Augment_ARAM_BigBrain"` 등 |
| AugmentLargeIconPath / AugmentSmallIconPath | 222 | 아이콘 | `"assets/ux/cherry/augments/icons/bigbrain_large.tex"`, `"assets/ux/kiwi/augments/icons/sonata_small.tex"`, `"assets/ux/kiwi/augments/icons/genericabilityaugmenticon_gold.tex"`(스킬 증강 범용 아이콘) |
| AugmentPlatformId | 222 | 숫자 id (= cherry-augments.json의 id) | `1180`(BigBrain), `2078`(ChainReaction), `2055`(Multishot) |
| AugmentDisplayTags | 218 | **UI 표시 카테고리 enum 배열**(§1.5) | `[3]`(BigBrain), `[1]`(ChainReaction), `[1,9]`(Multishot) |
| rarity | 160 | 등급: 생략/0=실버, 1=골드, 2=프리즘 | `1`(BigBrain=골드), `2`(DrawYourSword=프리즘), (생략)(ADAPt=실버) |
| ResourceResolver | 142 | 리소스 경로 | `".../ARAM_BigBrain/Resources"` 등 |
| mBuildTags | 117 | **빌드/역할 축 비트마스크**(§1.4) | `32`(BigBrain), `64`(DrawYourSword), `256+…=296`(Adamant) |
| AdditionalSpells | 103 | 부속 스펠 경로 배열 | BigBrain: `[".../Augment_ARAM_BigBrain_Cooldown"]`, Multishot: `[".../Augment_ARAM_Multishot_Velkoz"]`, Sonata: Sona W/E 6종 |
| mAugmentTags | 84 | **요구 메커니즘 비트마스크**(§1.3) | `2`(BigBrain=AP), `8`(MindtoMatter=마나), `32`(Dashing=대시) |
| {e3a02eac} | 30 | (미해독 해시) **스킬 증강 플래그**(§1.6) | `true`(ChainReaction), `true`(Missile_Split), `true`(SnapBack) |
| {3696d198} | 17 | (미해독) 대체 요약 loc키 래퍼 | `{"{c4182067}":"Kiwi_Juiced_Tooltip"}`, `{"…":"Kiwi_FinalForm_Tooltip"}`, `{"…":"Kiwi_OminousPact_Summary"}` |
| {791eb92e} | 16 | (미해독) 최대 단계(capstone) 요약 오버라이드 | GetExcited: `Cherry_ARAM_GetExcited_Max_Summary`, Juiced: `Cherry_ARAM_Juiced_Capstone`, CriticalRhythm: `Cherry_CriticalRhythm_Max_Summary` |
| {3ed971bd} | 12 | (미해독) **퀘스트 링크**(12개 퀘스트 증강에만 존재, {a0ffdf09}의 퀘스트 12종과 일치) | Multishot→`{a893ee00}`, SupportMain→`{a871f811}`, Quest_SteelYourHeart→`{9d88f5d1}` |
| Enabled | 7 | 비활성 플래그(false만 존재) | `false`: ARAM_QuantumComputing, SnowballUpgrade, ARAM_Perseverance, ARAM_LittleDevil, VoidDash, Vampirism, Adamant (7종) |
| {ed593c9c} | 4 | (미해독) 증강을 부여/변환하는 증강 표시로 추정 | `true`: ARAM_TransmuteGold, ARAM_TransmuteChaos, ARAM_TransmutePrismatic, ARAM_PandorasBox |

**결정적 부재(전수 확인)**: 챔피언 이름/ID 목록 필드 없음, 조건식(원거리 전용·아이템 조건·팀 인원 제한 등) 필드 없음, rarity 외의 **가중치·확률 필드 없음**. 파일 전체 고유 JSON 키(독립 재검증 실측: 경로형 키 제외 1,412개, 경로형 포함 2,804개 — 원문의 1,247개는 집계 기준 차이로 재현 안 됨)를 뽑아 `eligib/champion/class/weight/filter/require/invalid/optimal/viable/pool` 패턴으로 검색해도 증강 관련 히트는 없다(히트된 것은 스펠 내부의 `mRequiredUnitTags`/`mConditionalCalculationRequirements`/`mSpellRevealsChampion`, VFX의 `bindWeight`/`Filtering` 등 무관 필드뿐 — 재검증에서도 결론 동일). ✅
→ 위키에 명문화된 제한("원거리 전용", "루난 보유 시 제외", "팀당 2명", "워모그 제외" 등)과 개발자가 밝힌 Optimal/Viable/Average/Invalid 분류는 **클라이언트 데이터에 전혀 실려 있지 않다 = 서버 전용 로직**.

또한 스펠 쪽도 마찬가지다. 예: Dashing의 RootSpell(`Augment_ARAM_Dashing`)은 `DataValues: Haste=175`와 툴팁 키만 담고 실제 동작은 `mScriptName`(서버 스크립트)이 처리 — 위키에 기록된 "칼리스타는 공속 125%로 치환" 같은 챔피언별 치환도 클라이언트 파일에는 없다(kiwi.bin.json 내 Kalista 문자열은 VFX 텍스처 4건뿐). ✅

### 1.3 mAugmentTags 비트 분해 — "요구 메커니즘" 태그 (Q1 관련 핵심)

84개 증강이 보유. 비트값별 소속 전수(합성값은 비트별로 분해):

| 비트값 | 개수 | 소속 증강(전체) | 해석(아레나 예외 카테고리 대응) |
|---|---|---|---|
| 2 | 18 | Firefox, Cruelty, ADAPt, OminousPact, CircleofDeath, Zealot, MasterofDuality, Upgrade_Sheen, DarkWind, Marksmage, BigBrain, PhenomenalEvil, WitchfulThinking, Quest_WoogletsWitchcap, Eureka, Twinfire, Upgrade_ZH, DropBear | **AP 계열** — 아레나 AP 예외 증강(Witchful Thinking/Phenomenal Evil/Eureka)이 정확히 포함 |
| 4 | 13 | FanTheHammer, PressureCooker, DrawYourSword, DualWield, MasterofDuality, Upgrade_Sheen, Upgrade_IE, CriticalRhythm, Upgrade_Collector, Typhoon, ShrinkRay, BluntForce, escAPADe | **AD/치명타 계열** — 아레나 AD 예외 증강(Blunt Force) 포함 |
| 8 | 4 | Overflow, Juiced, MindtoMatter, OceanSoul | **마나 요구** — 아레나 마나 예외(Mind to Matter)와 대응. 정확히 마나 증강 4종만 |
| 16 | 8 | Impassable, Cruelty, DoubleDefense, CourageoftheColossus, DarkWind, Adamant, SoulEater, SlapAround | **속박/방어 계열** — 아레나 Immobilize 예외(Courage of the Colossus) 포함. Adamant/SlapAround도 속박 트리거형 |
| 32 | 8 | ShadowRunner, SwiftAndSafe, Flashbang, Dashing, OutlawsGrit, Earthwake, Quickstep, Nightstalking | **대시/점멸 요구** — 아레나 대시 예외 5종(Earthwake, Outlaw's Grit, Shadow Runner, Dashing) 전원 포함 |
| 64 | 11 | EmpyreanPromise, SnowballUpgrade, DimensionShift_Active, BiggestSnowballEver, GrowthSpurt, YouSpinMeRightRound, Poltergeist, GoldenSnowball, Flash2, BladeWaltz, PinballSnowball | **소환사 주문(표식/눈덩이) 교체형** |
| 128 | 2 | SkilledSniper, BangBang | 장거리 저격형(아레나 Trueshot Prodigy식 포킹 카테고리 추정 ❓) |
| 256 | 5 | DrawYourSword, SkilledSniper, BangBang, CriticalMissile, CriticalRhythm | **원거리 전용 추정** — 명문화된 원거리 전용 Draw Your Sword 포함 ❓ |
| 512 | 5 | FinalForm, PromQueen, Upgrade_Immolate, Quest_VoidImmolation, StuckInHereWithMe | 해석 불명 ❓ (내연 2종 포함) |
| 1024 | 7 | ItsKillingTime, FeyMagic, UltimateRevolution, UltimateUnstoppable, UltimateAwakening, CantTouchThis, BacktoBasics | **궁극기 요구** — 아레나 궁극기 예외 증강(Ultimate Revolution/Back to Basics) 정확히 포함 |
| 2048 | 7 | EmpyreanPromise, MightyShield, SpecializedEmpowerment, CircleofDeath, WindspeakersBlessing, SpecializedRecursion, FirstAidKit | **힐/실드 계열** |
| 4096 | 7 | Sonata, EmpyreanPromise, AllForYou, EmpoweredByTheFaithful, ProteinShake, SupportMain, SonicBoom | **아군 대상(서포트) 계열** — 아레나 아군 힐/실드 화이트리스트 증강(Sonic Boom) 포함 |

- 합성값 예: Draw Your Sword = 260(4+256, AD+원거리), Cruelty = 18(2+16), EmpyreanPromise = 6208(64+2048+4096).
- **의의**: 아레나 위키의 "Augment Exceptions" 표(스탯/메커니즘별 제외 목록)와 카테고리가 거의 1:1로 겹친다. 즉 이 비트마스크가 "이 증강이 요구하는 챔피언 메커니즘"을 기술하는 태그이며, 서버가 챔피언의 해당 메커니즘 보유 여부와 대조해 필터링하는 데 쓰일 개연성이 높다. 단, **실제 서버 사용 여부는 데이터만으로는 확증 불가** ❓ (매치 데이터 403이라 실측 대조도 불가).

### 1.4 mBuildTags 비트 분해 — "빌드/역할 축" 태그 (Q1의 역할군 편향과 직결)

117개 증강이 보유. 주요 비트(소속 예시 일부):

| 비트값 | 개수 | 소속 예시 | 해석(추정) |
|---|---|---|---|
| 2 | 28 | GiantSlayer, ItsKillingTime, KillSecured, Nightstalking, BladeWaltz, Dashing, Quickstep, GlassCannon, escAPADe | 킬 각/기동 — 암살자·스커미셔 축 ❓ |
| 8 | 24 | Sonata, Impassable, DoubleDefense, AllForYou, ProteinShake, WindspeakersBlessing, SupportMain, SonicBoom, FirstAidKit | **서포터 축** |
| 16 | 21 | InfernoTriggered, PressureCooker, KingMe, Goliath, Vampirism, InfernalSoul | 지속딜/난전(브루저) 축 ❓ |
| 32 | 31 | Firefox, MagicMissile, ADAPt, MindtoMatter, Marksmage, BigBrain, PhenomenalEvil, WitchfulThinking, Eureka, Upgrade_ZH | **메이지(AP) 축** |
| 64 | 28 | FanTheHammer, Scoped/Scopier/ScopiestWeapons, DrawYourSword, DualWield, Zealot, Firebrand, TapDancer, Typhoon, Deft | **원딜/평타(on-hit) 축** |
| 128 | 7 | OkBoomerang, FromBeginningToEnd, SkilledSniper, BangBang | 포킹 축 ❓ |
| 256 | 32 | MountainSoul, CourageoftheColossus, TankEngine, HeavyHitter, Impassable, Goliath, Erosion, Adamant, SoulEater | **탱커 축** |
| 512 | 16 | CritNCast, Upgrade_IE, DoubleTap, Twinfire, ItsCritical, CriticalRhythm, JeweledGauntlet | **치명타 축** |
| 1024 | 7 | Sonata, Firefox, OkBoomerang, SharkTempest, QuantumComputing, PromQueen, DivineIntervention | 자동 시전/주기형 ❓ |
| 2048 | 20 | InfiniteRecursion, Overflow, ADAPt, MindtoMatter, WithHaste, EtherealWeapon, LightemUp | 스킬 스케일링/가속 축 ❓ |

- **의의(Q1)**: "원딜용/법사용/탱커용 증강"이라는 체감과 정확히 같은 축의 태그가 **클라이언트 데이터에 증강별로 박혀 있다**. 다만 이 태그를 챔피언과 잇는 매핑(어떤 챔피언이 어떤 축인지, 축별 가중치가 얼마인지)은 클라이언트에 없다. 챔피언 쪽 클래스 데이터로는 LCU 챔피언 파일의 `roles`(예: 아리 = `["mage","assassin"]`), `tacticalInfo`(damageType kMagic / attackType ranged), `playstyleInfo`(damage/durability/crowdControl/mobility/utility 1~3점)가 존재한다(https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/ko_kr/v1/champions/103.json ✅). 서버가 이런 클래스 정보와 위 태그·Optimal/Viable/Average/Invalid 분류(Inven Global 인터뷰)를 조합하는 구조로 추정되나, 결합 로직 자체는 비공개 ❓.

### 1.5 AugmentDisplayTags — UI 표시 카테고리 enum

값은 0~9 정수 배열. 라벨 문자열은 스트링테이블에 존재(아레나 Cherry 네임스페이스를 공용): `cherry_augmentdisplaytag_*` ✅

| 키 | 영어 | 한국어 |
|---|---|---|
| …_damage | Damage | 피해량 |
| …_resilience | Resilience | 저항 |
| …_speed | Speed | 속도 |
| …_utility | Utility | 보조 |
| …_ally | Ally | 아군 |
| …_economy | Economy | 골드 관리 |
| …_quest | Quest | 퀘스트 |
| …_questline | Questline | 연계 퀘스트 |
| …_general | General | 일반 |
| …_statanvil | Stat Anvil | 능력치 모루 |
| …_classicish | Classic-ish | 클래식 스타일 |

enum 인덱스↔라벨 매핑은 파일에 없어 **데이터 상관으로 추론**(kiwi 222개 + 아레나 라이브 44개 교차):

| 인덱스 | 추정 라벨 | 근거(소속 증강) | 확신도 |
|---|---|---|---|
| 0 | Ally(아군) | WeeWooWeeWoo, SpiritBomb, AllForYou, SupportMain, SonicBoom | 중 |
| 1 | Damage(피해량) | 아레나: WildFire, ChromaFlux, GlassCannon / kiwi 56종 | 높음 |
| 2 | General(일반) | 아레나: RiceAnd* 3종, TrashToTreasure, BigDragonEnergy | 중(Stat Anvil일 가능성 잔존) |
| 3 | Resilience(저항) | 아레나: Adamant, DemonicClasp / kiwi: DoubleDefense, MountainSoul | 높음 |
| 4 | Speed(속도) | 아레나: SpeedDemon, WindBeneathBlade / kiwi: LegDay, Dashing, Flashy | 높음 |
| 5 | Utility(보조) | 아레나: VeilOfWarding, TransmuteSilver / kiwi: Overextender, SnowballUpgrade | 높음 |
| 6 | (현 데이터 미출현) | — | ❓ |
| 7 | Economy(골드 관리) | 아레나: RagsToRiches, Scavenger / kiwi: HighRoller, YowchMyCoins, BloodMoneyBurn | 높음 |
| 8 | Quest(퀘스트) | Quest_VoidImmolation, Quest_SteelYourHeart, Quest_UrfsChampion, SupportMain 등 퀘스트 전부 | 높음 |
| 9 | Questline(연계 퀘스트) | PressureCooker, PoroCharge, Multishot, SpecializedRecursion(다단계 퀘스트만) | 중 |

### 1.6 `{e3a02eac}` = 스킬 증강(Ability Augment) 플래그 — Q2의 데이터 근거

true인 30개 전수(한국어 이름은 ko 스트링테이블 실측 ✅):

| 등급 | 개수 | 목록 (내부명 → 한국어) |
|---|---|---|
| 실버 | 7 | TitansPulse→확고한 의지로, ItsGoTime→출발할 시간, DoubleDefense→보강, ARAM_SustainingStrike→흡수, WardingWeapon→적응형 와드, DoubleStrike→2연속 공격, TrustyWeapon→믿음직한 무기 |
| 골드 | 17 | SnapBack→원상복구, Bonk→꽁!, ARAM_Terror→공포, ARAM_BreadAndButter→빵과 버터, SpecializedEmpowerment→위력 추구, MercysStrike→자비의 일격, VoidDash→공허 돌진, Terraind→지형 생성됨, ARAM_Quickstep→날쌘걸음, DarkWind→굶주린 속박, LittleExtraHelp→작은 도움, ChainReaction→연쇄 반응, ARAM_RabbleRousing→원기 회복, KeepGoing→재장전, ARAM_BreadAndCheese→빵과 치즈, ARAM_SpecializedRecursion→가속 추구, ARAM_BreadAndJam→빵과 잼 |
| 프리즘 | 6 | Missile_Split→주문 분산, Ability_SelfAOE_DoubleCast→메아리 시전, Overloaded→과충전, Overkill→바늘꽂이, ARAM_Multishot→다중 공격, SpellVolley→3연발 |

- 플래그 해석의 증거: (a) 30종 모두 26.12에 도입된 "스킬을 강화/지정하는" 증강 계열이다. (b) 이 중 다수의 아이콘 경로가 `genericabilityaugmenticon_silver/gold/prismatic.tex` — **등급별 범용 '스킬 증강' 아이콘**을 공유한다(예: ChainReaction=gold, Multishot=prismatic). (c) `abilityaugmentspellmodifiers.bin`이라는 파일명이 별도로 존재(§5.3). 필드의 원래 이름은 미해독이지만 의미는 사실상 확정적.
- **Q2 답의 데이터 측면**: 스킬 증강은 전용 티어가 아니라 **실버/골드/프리즘 3등급에 분산**되어 있으며(7/17/6), 다른 증강과 같은 rarity 체계를 쓴다. 진행 트랙 레벨 9의 "스킬 강화 증강 등장 확률 증가"(03 스터디)까지 합치면, 스킬 증강은 "등급은 일반 증강과 동일 + 등장 확률만 별도 보정 가능한 부류"다.
- 참고: 03 스터디에서 언급된 스킬 증강 계열 중 Tripleshot=SpellVolley(3연발), Spell Split=Missile_Split(주문 분산), Echo Cast=Ability_SelfAOE_DoubleCast(메아리 시전), Siphon=ARAM_SustainingStrike(흡수), Pursuit of Haste/Power=ARAM_SpecializedRecursion/SpecializedEmpowerment로 내부명이 대응됨을 확인. ✅

### 1.7 챔피언 이름이 등장하는 유일한 지점들

AugmentData의 스펠 경로에 챔피언 이름이 들어가는 경우를 전수 검색한 결과: ✅
- **다른 챔피언의 스킬을 빌려오는 증강**: Sonata(소나 W/E 스펠 6종 내장), ARAM_FeyMagic(룰루 W: `Augment_ARAM_FeyMagic_LuluWTwo`), ARAM_QuantumComputing(카밀 W 3종: `..._CamilleW`, `..._CamilleWConeSlashCharge/Slow`) — 이는 "모든 챔피언에게 해당 스킬을 주는" 범용 증강이지 챔피언 제한이 아니다.
- **챔피언별 예외 스펠 단 1건**: `ARAM_Multishot`의 AdditionalSpells에 `Augment_ARAM_Multishot_Velkoz`(벨코즈 전용 처리) — 클라이언트 데이터에서 발견되는 **유일한 챔피언 이름 지정형 증강 예외**.
- 그 외 챔피언 이름은 전부 VFX 텍스처 재사용(예: `Kalista_Base_Glow.tex`)으로 의미 없음.

---

## 2. `cherry-augments.json` 해부 (과제 2)

URL: https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/cherry-augments.json (657개 엔트리) ✅

657개 전 엔트리가 **정확히 6개 필드만** 가진다(전수 대조, 필드 누락/추가 0):

| 필드 | 657/657 | 값 예시 3개 |
|---|---|---|
| id | ✅ | `1205`(ARAM_ADAPt), `1134`(ARAM_DrawYourSword), `1420`(Sonata) |
| augmentNameId | ✅ | `"ARAM_ADAPt"`, `"ARAM_DrawYourSword"`, `"Sonata"` |
| nameTRA | ✅ | `"ADAPt"`, `"Draw Your Sword"`, `"Sonata"` (로케일별 번역됨) |
| simpleNameTRA | ✅ | `""`, `""`, `""` (657개 중 627개 빈 문자열, 30개만 값 보유 — 독립 재검증 실측) |
| augmentSmallIconPath | ✅ | `"/lol-game-data/assets/ASSETS/UX/Cherry/Augments/Icons/ADAPt_small.png"`, `".../DrawYourSword_small.png"`, `".../Kiwi/Augments/Icons/Sonata_small.png"` |
| rarity | ✅ | `"kSilver"`, `"kPrismatic"`, `"kGold"` (전체 분포: kSilver 195/kGold 228/kPrismatic 195/kEventChoice 25/kBronze 14) |

**결론: 클래스 태그·챔피언 목록·조건·가중치 계열 필드 전무.** 이 파일은 순수한 id↔이름↔아이콘↔등급 레지스트리다.

---

## 3. 위키 `Module:MayhemAugmentData/data` Lua 필드 전수 (과제 3)

URL: https://wiki.leagueoflegends.com/en-us/Module:MayhemAugmentData/data?action=raw (225개 등재) ✅

증강별 필드는 **4종이 전부**:

| 필드 | 사용 수/225 | 내용 | 값 예시 |
|---|---|---|---|
| description | 225 | 위키텍스트 설명 | ADAPt: `"Convert '''all''' of your {{as|'''bonus''' attack damage}} into..."` |
| tier | 225 | `"Silver"`/`"Gold"`/`"Prismatic"` | Draw Your Sword: `"Prismatic"` |
| notes | 29 | 자유 텍스트 노트(제한/버그/상호작용) | Draw Your Sword: `"This augment is not offered if the champion has built {{ii|Runaan's Hurricane}}."` |
| questinfo | 4 | 퀘스트 증강의 단계 표(위키테이블) | Multishot 등: `{| class="article-table" !Tier !Quest !Reward ...` |

- **champions/classes/eligibility 구조화 필드 없음.** 제한 사항은 전부 description 말미(`''This augment is only available for {{tip|ranged}} champions.''`, Earthwake의 `"only offered to up to 2 players on each team"`) 또는 notes의 **영문 자유 텍스트**로만 존재한다 → 기계 판독 불가, 파서로 정규식 추출해야 함.

---

## 4. `Module:ArenaAugmentData/data`와의 구조 비교 (과제 4)

URL: https://wiki.leagueoflegends.com/en-us/Module:ArenaAugmentData/data?action=raw (257개 등재) ✅

| 필드 | 사용 수/257 | Mayhem 모듈과의 차이 |
|---|---|---|
| description | 257 | 동일(위키텍스트) |
| tier | 257 | 동일 |
| **level1 / level2 / level3** | 각 257 | **아레나 전용**: 증강 레벨(구매 단계)별 수치. Mayhem 모듈에는 없음(아수라장 증강은 단계 없음) |
| notes | 23 | 동일(자유 텍스트). 이외 단수형 `note` 필드 1건 존재(오타성 — 독립 재검증에서 발견) |

- **아레나 모듈에도 champions/classes/eligibility 구조화 필드는 없다.** 챔피언 전용 정보조차 description 내 자유 텍스트: `"''This augment is only available for {{ci|Shyvana}}.''"` (Big Dragon Energy). `"only available for"` 패턴 전수 검색 결과 6건: Shyvana / Draven / ranged champions / Yunara(첫 두 라운드 한정) / Zaahen / Sylas. ✅
- 아레나의 챔피언별 제외 목록(AD/AP/마나/CC/대시/포킹/궁극기/힐실드 화이트리스트)은 모듈이 아니라 **Arena 본문 문서의 "Augment Exceptions" 위키테이블**에만 있다(03 스터디 §3-2) — 즉 위키 차원에서도 eligibility는 데이터 모듈 밖의 수기 문서.
- **게임 데이터 차원의 비교(cherry.bin.json ✅)**: https://raw.communitydragon.org/latest/game/maps/modespecificdata/cherry.bin.json 의 AugmentData 44개(아레나 현행 로테이션)는 kiwi와 **동일 계열의 필드 스키마**(mAugmentTags/mBuildTags/AugmentDisplayTags/{ed593c9c}/{3696d198}/{791eb92e} 등 공유). 단 `{e3a02eac}`(스킬 증강 플래그)와 `{3ed971bd}`(퀘스트 링크)는 아레나 현행 44개에는 출현하지 않는다(독립 재검증 실측 — 해당 부류 증강이 현 로테이션에 없기 때문일 수 있으며, "완전히 동일한 스키마"라는 원문 표현은 과대 기술이라 정정). 결정적으로 **쉬바나 전용 Big Dragon Energy의 엔트리에도 챔피언 필드가 전혀 없다**: `{"AugmentNameId":"BigDragonEnergy","mBuildTags":64,"AugmentDisplayTags":[2],"rarity":1,"AugmentPlatformId":387,...}` → 챔피언 전용 판정마저 서버측. 아수라장 필터링이 아레나와 같은 (비공개) 서버 시스템 계열임을 데이터 스키마 동일성이 뒷받침한다.

---

## 5. modespecificdata 디렉토리 탐색 — 추가 KIWI 관련 파일 (과제 5)

디렉토리 리스팅(JSON): https://raw.communitydragon.org/json/latest/game/maps/modespecificdata/ ✅

| 파일 | 크기 | 내용 |
|---|---|---|
| kiwi.bin.json | 12.1MB | 아수라장 증강 222 (§1) |
| kiwi_jade.bin.json | 10.5MB | 미공개 Jade 변형용 188 (04 스터디 참조) |
| cherry.bin.json | 2.0MB | 아레나 현행 증강 44 (§4) |
| **augmentgroups.bin.json** | 78KB | **증강 그룹 66종 (§5.2, 신규 발굴)** |
| **abilityaugmentspellmodifiers.bin.json** | 150B | 스킬 증강 스펠 수정자 (§5.3) |
| augmentoperators.bin.json | 15B | 빈 파일(`{"__linked":[]}` 수준) |
| aram.bin.json | 173KB | 기본 칼바람 모드 데이터 |
| jade.bin.json / ruby.bin.json / ultbook.bin.json / urf.bin.json / swiftplay.bin.json / classic.bin.json 등 | — | 타 모드 |
| classic/, ruby/, ultbook/ | — | 하위 디렉토리 |

**챔피언별 증강 매핑 파일은 이 디렉토리에도, 게임 파일 전체 목록에도 없다**: files.exported.txt(https://raw.communitydragon.org/latest/cdragon/files.exported.txt)를 `eligib|augment.?pool|champion.?augment|augment.?champion|augment.?weight` 패턴으로 전수 grep → 증강 관련 히트 0(무관한 클라이언트 UI 자원 3건뿐 — 아이콘 png 2건 + 미션 사운드 ogg 1건, 독립 재검증 실측). `kiwi` 패턴 히트는 UI 번들(kiwiaugmentselection, kiwiplayeraugments, kiwiscoreboard 등)과 모드 전용 유닛(kiwi_poroking, kiwi_tibbers 등)뿐. ✅

### 5.2 augmentgroups.bin.json — 신규 발굴 파일 상세

URL: https://raw.communitydragon.org/latest/game/maps/modespecificdata/augmentgroups.bin.json ✅

- 구조: `{그룹해시: {"ID": <문자열 또는 해시>, "augments": [{"Augment": "Maps/ModeSpecificData/Augments/<이름>"}...], "__type":"{fead7e9b}"}}` — 그룹 66개(빈 그룹 4개 포함). **모드 공용**(kiwi 증강과 아레나 전용 증강이 함께 등장).
- ID가 평문으로 해독된 그룹 17종: **AH, AP, AS, MR, MS, Armor, ArmorPen, MagicPen, CritChance, Omnivamp, LifeSteal, Spellvamp, Mana, Health, Peel, SnowBall, AD** — 스탯/기능 이름 그대로.
- 그룹 실례 3건(전체 멤버):
  - `ID: "Mana"` (3종): ARAM_Juiced, ARAM_MindtoMatter, ARAM_Overflow — 마나 증강 정확히 3개.
  - `ID: "AH"` (18종): ARAM_Archmage, ARAM_BacktoBasics, BreadAndButter/Cheese/Jam, InfiniteRecursion, Overloaded, ARAM_Purist_Caster, ARAM_SpecializedRecursion, Quest_UrfsChampion, ARAM_Recursion, ShrinkEngine, ARAM_SpinToWin, SurgeField, ARAM_InfernoTriggered, Twinfire, UltimateAwakening, ARAM_WithHaste — 스킬 가속 부여 증강.
  - `ID: {56299123}`(해시, 12종): Adamant, ChainReaction, CourageoftheColossus, Cruelty, FeyMagic, GuiltyPleasure, Impassable, DarkWind, SlapAround, SoulEater, SquishySlappyGrab, Terror — 전원 CC(속박/공포/넉백) 연동 증강 → "CC 그룹"으로 추정 ❓.
  - 그 외 해석 가능한 해시 그룹: 대시 그룹({f7c80e19}: Dashing, Earthwake, OutlawsGrit, Quickstep, ShadowRunner, SnapBack, SwiftAndSafe, VoidDash — mAugmentTags 32와 겹침+스킬증강 2종), 궁극기 그룹({73f04b68}), 골드 그룹({b945e5f7}: Donation, FromBeginningToEnd, Goldrend, HighRoller, YowchMyCoins), 미사일 그룹({70692c6f}), 사망 시 발동 그룹({2b5a8648}), 아이템 강화 그룹({9579774e}: Upgrade_* 10종), 소환사 주문 교체 그룹({8ae6ed2e}) 등.
- **용도는 미확인** ❓: eligibility 필터의 재료일 수도, 전적/추천 UI·통계 집계용일 수도 있다. 그룹→증강 방향만 있고 챔피언 연결은 없다.

### 5.3 abilityaugmentspellmodifiers.bin.json

내용 전체(150바이트): `{"{330066e7}":{"mModifierID":"{c38192bb}","DescriptionAppendTra":"Kiwi_SustainingStrike_SpellModifier_Append","__type":"SpellModifier"},"__linked":[]}` — 스킬 증강 "흡수(Siphon)"가 대상 스킬 툴팁에 덧붙이는 문구("Heals you for 100% of the damage dealt...") 1건만 등재. **스킬 증강이 어느 챔피언의 어느 스킬에 붙는지의 매핑은 이 파일에도 없다** — 스킬의 속성(미사일/넉백/대상지정 등) 판정 역시 서버측으로 보인다. ✅

---

## 6. 두 핵심 질문에 대한 데이터마이닝 관점의 종합

### Q1. 역할군별 편향("원딜엔 원딜용, 법사엔 법사용")의 메커니즘

- **클라이언트 데이터에 있는 것**: 증강별 역할/메커니즘 태그 3종(mAugmentTags=요구 메커니즘, mBuildTags=빌드 축, augmentgroups=기능 그룹) + 챔피언별 클래스 데이터(roles/tacticalInfo/playstyleInfo). 즉 "이 증강은 어떤 역할·메커니즘용인가"는 태그로 완전히 기술되어 있다.
- **클라이언트 데이터에 없는 것**: 챔피언×증강 매핑, 등장 가중치, 조건식. 아레나의 챔피언 전용 증강조차 데이터에 챔피언 표기가 없으므로, **매칭·가중치(Optimal/Viable/Average/Invalid) 전체가 서버 전용**이다. 유저가 체감하는 역할군 편향은 "증강 태그 × 챔피언 클래스 × 서버측 4단계 가중치"의 결과로 설명되지만, 서버 로직 자체는 이번 발굴 범위 밖(비공개).
- 예외적으로 클라이언트에서 관측 가능한 챔피언 단위 흔적은 Multishot의 벨코즈 전용 스펠 1건뿐.

### Q2. 스킬 증강의 등급 체계

- 스킬 증강은 `{e3a02eac}: true` 플래그 30종으로 식별되며, **별도 티어 없이 실버 7/골드 17/프리즘 6으로 일반 등급에 분산**. 아이콘도 등급별 범용 아이콘(genericabilityaugmenticon_실버/골드/프리즘)을 씀 → 게임 UI에서 "실버/골드/프리즘 스킬 증강"으로 보이는 것이 데이터로 확인된다.
- 퀘스트형 스킬 증강(Multishot, Pursuit of Haste/Power 등)은 추가로 퀘스트 링크 필드({3ed971bd})와 AugmentDisplayTags의 Quest/Questline 카테고리를 가진다.

---

## 7. 미해독 해시 필드 명명 시도 (기록)

- CommunityDragon은 bin 필드명을 FNV-1a 32비트 해시(소문자화)로 저장하며, 커뮤니티 해시테이블에 없는 이름은 `{xxxxxxxx}`로 표기된다(참고: https://github.com/CommunityDragon/Docs , https://github.com/communitydragon/cdtb ).
- 본 조사에서 도메인 특화 후보 단어 ~8,200개(단어+접두사 m/is/has/requires+2그램 합성)로 FNV-1a 브루트포스를 수행했으나 **0건 적중** — {e3a02eac}, {ed593c9c}, 그룹 ID 해시 49종 등은 커뮤니티 미해독 상태 그대로다. ⚠️ 미검증(원 리서처 자체 실험으로, 독립 검증에서는 재현하지 않음) 의미는 위와 같이 값 분포로 역추론했다(이름 자체는 미확인 ❓).

---

## 8. 미확인 / 한계

1. mAugmentTags/mBuildTags/augmentgroups가 실제 드로우(eligibility/가중치) 계산에 쓰이는지, 아니면 UI·통계용인지 — **서버 코드 없이는 확증 불가**(추정 근거는 아레나 예외 카테고리와의 일치뿐).
2. Optimal/Viable/Average/Invalid의 실제 수치·챔피언 매핑 — 클라이언트/CDN 어디에도 없음(서버 전용 확정적).
3. mAugmentTags 값 512 그룹(FinalForm/PromQueen/Upgrade_Immolate/Quest_VoidImmolation/StuckInHereWithMe)의 의미.
4. AugmentDisplayTags 인덱스 2/6/9의 라벨 확정(2=General, 9=Questline은 추론).
5. 해시 그룹 ID 49종의 원래 이름.
6. 스킬 증강이 챔피언의 "어느 스킬"에 적용 가능한지의 판정 데이터 — 챔피언 스펠 bin의 속성(미사일 유무 등)에서 서버가 도출하는 것으로 추정되나 명시적 매핑 파일은 미발견.
7. 위키 225 vs 게임 파일 222의 차이 3종의 정확한 명단 대조(이번 범위 외).

---

## 9. 출처 (전부 2026-09-02 직접 fetch·파싱)

**CommunityDragon (게임 데이터 원본)**
- kiwi.bin.json — https://raw.communitydragon.org/latest/game/maps/modespecificdata/kiwi.bin.json
- cherry.bin.json — https://raw.communitydragon.org/latest/game/maps/modespecificdata/cherry.bin.json
- augmentgroups.bin.json — https://raw.communitydragon.org/latest/game/maps/modespecificdata/augmentgroups.bin.json
- abilityaugmentspellmodifiers.bin.json — https://raw.communitydragon.org/latest/game/maps/modespecificdata/abilityaugmentspellmodifiers.bin.json
- 디렉토리 리스팅(JSON) — https://raw.communitydragon.org/json/latest/game/maps/modespecificdata/
- cherry-augments.json — https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/cherry-augments.json
- 스트링테이블(en/ko) — https://raw.communitydragon.org/latest/game/en_us/data/menu/en_us/lol.stringtable.json , https://raw.communitydragon.org/latest/game/ko_kr/data/menu/en_us/lol.stringtable.json
- 챔피언 데이터(roles/tacticalInfo/playstyleInfo) — https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/ko_kr/v1/champions/103.json
- 게임 파일 전체 목록 — https://raw.communitydragon.org/latest/cdragon/files.exported.txt
- UI 번들 예 — https://raw.communitydragon.org/latest/game/clientstates/gameplay/ux/lol/kiwi/kiwiaugmentselection/uibase.cdtb.bin.json
- CDragon 문서/툴킷(해시 체계) — https://github.com/CommunityDragon/Docs , https://github.com/communitydragon/cdtb

**LoL 공식 위키 (CC BY-SA 3.0)**
- Module:MayhemAugmentData/data — https://wiki.leagueoflegends.com/en-us/Module:MayhemAugmentData/data?action=raw
- Module:ArenaAugmentData/data — https://wiki.leagueoflegends.com/en-us/Module:ArenaAugmentData/data?action=raw
- Arena(Augment Exceptions 표) — https://wiki.leagueoflegends.com/en-us/Arena

**맥락(선행 스터디에서 검증된 2차 소스)**
- Inven Global 개발자 인터뷰(Optimal/Viable/Average/Invalid, champion class pools) — https://www.invenglobal.com/articles/25082/lol-aram-mayhem-reveals-the-secrets-of-augment-development
- IBTimes(스킬 증강의 챔피언별 사전 필터링) — https://www.ibtimes.com/league-legends-aram-mayhem-cuts-over-450-ability-augments-live-hotfix-3804331
- Data Dragon 챔피언 목록(교차 검색용) — https://ddragon.leagueoflegends.com/cdn/16.17.1/data/en_US/champion.json

---

## 10. 독립 검증 기록 (2026-09-02, 별도 검증자)

원문과 별개로 §9의 원본 URL들을 **전부 직접 재fetch·재파싱**(Node.js, 원 리서처와 별도 다운로드본)하여 대조했다.

- **일치 확인(수치 단위 재현)**: kiwi.bin.json 최상위 1,408키·__type 히스토그램·AugmentData 222개·필드별 보유 수 전항(84/117/160/30/17/16/12/7/4 등), mAugmentTags 12개 비트의 소속 증강 명단 전수, mBuildTags 비트별 개수, {e3a02eac}=true 30종 명단과 실버7/골드17/프리즘6 분포, Enabled=false 7종, {ed593c9c} 4종, AugmentPlatformId 표본(1180/2078/2055), 합성값 표본(DrawYourSword=260, Cruelty=18, EmpyreanPromise=6208, Adamant mBuildTags=296), Kalista 문자열 4건(전부 .tex), Multishot의 Velkoz 전용 AdditionalSpell, Sonata 소나 스펠 6종·FeyMagic LuluWTwo·QuantumComputing CamilleW 3종, Dashing(Haste=175·mScriptName·Cherry_Dashing_Tooltip), AugmentDisplayTags 값 0~9·인덱스 6 미출현·인덱스 상관 예시(cherry: WildFire[1], Adamant[3], SpeedDemon[4], VeilOfWarding[5], RagsToRiches[7], BigDragonEnergy/TrashToTreasure[2]), cherry-augments.json 657개·6필드 고정·rarity 분포(195/228/195/25/14)·id 표본(1205/1134/1420), cherry.bin AugmentData 44개·BigDragonEnergy 엔트리 원문 그대로(챔피언 필드 없음), augmentgroups.bin.json 66그룹·평문 ID 17종 명단·해시 49종·빈 그룹 4·Mana=3/AH=18/{56299123}=12/대시 8/골드 5, abilityaugmentspellmodifiers 150바이트 내용 전문, augmentoperators=`{"__linked":[]}`, 디렉토리 리스팅 파일·크기 전부, kiwi_jade AugmentData 188개, 위키 Mayhem 모듈 225개·4필드(225/225/29/4)·"ranged 전용"/"팀당 2명" 문구, Arena 모듈 257개·level1~3 각 257·notes 23·"only available for" 6건(Shyvana/Draven/ranged/Yunara/Zaahen/Sylas), 챔피언 103(아리) roles/tacticalInfo/playstyleInfo, ko 스트링테이블의 cherry_augmentdisplaytag_* 11종 라벨과 스킬 증강 한국어명 표본(연쇄 반응/꽁!/다중 공격/3연발/흡수), files.exported.txt 패턴 grep 결과, 파일 mtime(Last-Modified: 2026-08-29) 및 content-metadata version 16.17.
- **정정 3건**(본문에 반영): ① TL;DR 4의 아이콘 서술 — generic 아이콘은 30개 중 21개(9개는 전용/재사용). ② §4 cherry.bin "완전히 동일한 필드 스키마" — {e3a02eac}/{3ed971bd}는 cherry 44개에 미출현이므로 "동일 계열(부분집합)"로 정정. ③ §1.2 고유 키 1,247개 — 재현 불가(실측 1,412/2,804), 결론(eligibility 필드 부재)은 동일.
- **정밀도 보정 3건**: simpleNameTRA 30/657 비어있지 않음, files.exported grep 히트는 아이콘 2+사운드 1, Arena 모듈에 단수형 `note` 필드 1건.
- **미검증으로 남긴 것**: §7 FNV 브루트포스(원 리서처 자체 실험). 그 외 서버측 로직 추정(§1.3/§1.4/§5.2의 "용도" 해석)은 원문이 이미 ❓로 표기한 추정이며 데이터로 반증되지 않음.
