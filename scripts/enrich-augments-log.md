# enrich-augments 이식 로그

- 생성: `node scripts/enrich-augments.cjs` (재실행 가능 — 수작업 편집 금지)
- 입력: `research/data/eligibility-notes.json` → 출력: `docs/data/augments.json`
- 원칙: confidence official/datamined/empirical → 이진 필터(restrictions), community → note까지만, 선호 층위 → favoredClasses/disfavoredClasses (근거: research/AUGMENT-POOLS-STUDY.md §3)

## 요약

| 항목 | 값 |
|---|---|
| category=ability | 30 |
| category=quest | 9 |
| category=normal | 186 |
| 이진 restrictions 필드 보유(이번 이식으로 부여/갱신) | 52 |
| 가중치 필드(favored/disfavoredClasses) 보유 | 29 |

## 판단 기록 (근사·보류)

- **OceanSoul 미이식**: 마나 태그 계열이나 실측 6명 전원 등재 — STUDY §3-1 "보류" 지시대로 requiresMana 미부여.
- **adCrit/AP 계열은 가중치로만**: 실측은 구조적 부재(브랜드·말파이트·소라카 등)를 시사하나 DDragon tags가 하이브리드(이즈리얼 Marksman+Mage, 카타리나 Assassin+Mage)라 클래스 이진 제외는 오탐을 만든다 → favored/disfavored 가중치로 근사 (STUDY §3-2 정합). ARAM_PhenomenalEvil은 징크스 포함 관측이라 disfavored 미부여.
- **meleeCluster 중 Stuck in Here With Me**: 실측 불확실(징크스 op.gg 등재) → meleeOnly 대신 favoredClasses(Fighter/Tank/Assassin)만.
- **sniper 계열(Skilled Sniper·From Downtown)**: 완전 제외 실측(원거리 3인만) → rangedOnly로 근사 (실제 조건은 장거리 스킬샷 보유로 추정).
- **selfHealCircle 계열**: 조건을 "킷 내 회복 보유"로 추정 → abilityProps=heal.
- **Spin To Win**: 종전 abilityProps=spin 제거, 위키 명시 22챔피언 화이트리스트로 대체 (champions.json spin 속성 누락 리스크 회피).
- **excludeSpell 계열(야스오 E 등 7건)**: 챔피언 전체 제외가 아니라 스킬 슬롯 단위 부적격 → championExclude가 아닌 `restrictions.spellExclude`({챔피언id: [스킬키]})로 기록. draft.js의 enhancedSkill 지정에서 활용 가능(현재는 note 겸 기계가독 기록).
- **Bread 3종**: 슬롯 고정형 → `restrictions.slot`(Q/W/E) 기록. presentAugment가 아직 미사용(현재는 무작위 스킬 근사) — 후속 반영 후보.
- **아이템 조건부(루난→Draw Your Sword, 워모그→Vampirism)·팀 제한(Earthwake 2명)·맵 한정(Overextender)**: 1인 시뮬 범위 밖 → note로만.
- **quest 분류**: 위키 09 §4 목록 + descKo 퀘스트 구조 명시분(From Downtown, Ultra Hydra). 스킬 지정형 퀘스트 3종(Multishot/Pursuit of Haste/Pursuit of Power)은 겸용이지만 계약상 category=ability 우선.
- **Kalista×Dashing 효과 치환**: community 등급 → note로만.

## 증강별 변경 내역 (91건)

| apiName | 이름 | 추가/변경 | 근거 |
|---|---|---|---|
| ARAM_ADAPt | 적응형 능력치 | favoredClasses=Mage/Support, disfavoredClasses=Marksman/Assassin/Fighter | empirical(가중치) |
| WardingWeapon | 적응형 와드 | category=ability, spellExclude, note | official — 26.15 버그픽스 |
| ARAM_BluntForce | 육중한 힘 | favoredClasses=Marksman/Fighter/Assassin, disfavoredClasses=Mage/Support/Tank | empirical(가중치) |
| DoubleDefense | 보강 | category=ability, abilityPropsAll=shield, note | official — 위키 원문 |
| ARAM_Deft | 능수능란 | favoredClasses=Marksman | empirical(가중치) |
| DoubleStrike | 2연속 공격 | category=ability, abilityPropsAll=empoweredAttack, note | official — 위키 원문 |
| ARAM_escAPADe | 마법사 (물리) | favoredClasses=Marksman/Fighter/Assassin, disfavoredClasses=Mage/Support/Tank | empirical(가중치) |
| ItsGoTime | 출발할 시간 | category=ability, abilityPropsAll=durationEffect, note | official — 위키 원문 |
| ARAM_Juiced | 도취 | requiresMana, note | empirical + datamined |
| ARAM_LightemUp | 불을 밝혀 | favoredClasses=Marksman | empirical(가중치) |
| ARAM_MindtoMatter | 정신 변환 | requiresMana, note | empirical + datamined |
| ARAM_ShadowRunner | 그림자 질주 | abilityProps=dash, note | empirical |
| ARAM_SustainingStrike | 흡수 | category=ability | category 분류 |
| ARAM_SlapAround | 우당탕탕 | abilityProps=immobilize, note | empirical + datamined |
| ARAM_SonicBoom | 음속 폭발 | classRequired=Support, note | empirical |
| ARAM_SpinToWin | 승리를 위한 회전 | championWhitelist, -abilityProps(화이트리스트로 대체), note | official — 위키 적격 목록 |
| TitansPulse | 확고한 의지로 | category=ability, meleeOnly, note | empirical — 근접 3인만(11 §3-8) |
| SwiftAndSafe | 빠르고 안전하게 | abilityProps=dash, note | empirical |
| ARAM_TankItOrLeaveIt | 확률적 방어 | favoredClasses=Marksman | empirical(가중치) |
| TrustyWeapon | 믿음직한 무기 | category=ability, spellExclude, note | official — 26.15 버그픽스 |
| ARAM_Typhoon | 태풍 | favoredClasses=Marksman/Fighter/Assassin, disfavoredClasses=Mage/Support/Tank | empirical(가중치) |
| ARAM_Upgrade_Collector | 징수의 총 업그레이드 | favoredClasses=Marksman/Fighter/Assassin, disfavoredClasses=Mage/Support/Tank | empirical(가중치) |
| Upgrade_DeathDance | 죽음의 무도 업그레이드 | favoredClasses=Marksman/Fighter/Assassin, disfavoredClasses=Mage/Support/Tank | empirical(가중치) |
| ARAM_Upgrade_Immolate | 불사르기 업그레이드 | meleeOnly, note | empirical — 근접 3인만(11 §3-8) |
| ARAM_Upgrade_ZH | 존야 업그레이드 | favoredClasses=Mage/Support, disfavoredClasses=Marksman/Assassin/Fighter | empirical(가중치) |
| ARAM_WitchfulThinking | 사악한 정신 | favoredClasses=Mage/Support, disfavoredClasses=Marksman/Assassin/Fighter | empirical(가중치) |
| ARAM_AllForYou | 너만을 위해 | classRequired=Support, note | empirical |
| ARAM_BigBrain | 전술적 대비 | favoredClasses=Mage/Support, disfavoredClasses=Marksman/Assassin/Fighter | empirical(가중치) |
| Bonk | 꽁! | category=ability, abilityPropsAll=empoweredAttack, note | official + empirical |
| ARAM_BreadAndButter | 빵과 버터 | category=ability, championExclude, slot, note | empirical — 양 소스 일치(11 §4-2) |
| ARAM_BreadAndCheese | 빵과 치즈 | category=ability, slot, note | official — 위키 원문 |
| ARAM_BreadAndJam | 빵과 잼 | category=ability, slot, note | official — 위키 원문 |
| ChainReaction | 연쇄 반응 | category=ability, abilityPropsAll=knockback, note | official — 위키 원문 |
| BloodMoneyBurn | 타오르는 이자 | championExclude, note | official — 26.14 패치노트 |
| CriticalMissile | 치명적 미사일 | favoredClasses=Marksman/Fighter/Assassin, disfavoredClasses=Mage/Support/Tank | empirical(가중치) |
| CriticalRhythm | 치명적 리듬 | favoredClasses=Marksman/Fighter/Assassin, disfavoredClasses=Mage/Support/Tank | empirical(가중치) |
| ARAM_BangBang | 로켓 배송 | category=quest, rangedOnly, note | empirical |
| ARAM_Impassable | 넘을 수 없는 벽 | abilityProps=immobilize, note | empirical + datamined |
| ARAM_ItsCritical | 치명적인 공격 | favoredClasses=Marksman | empirical(가중치) |
| LittleExtraHelp | 작은 도움 | category=ability, abilityPropsAll=empoweredAttack+durationEffect, note | official — 위키 원문 |
| MercysStrike | 자비의 일격 | category=ability, classRequired=Support, classRequired, note | official — 26.15 버그픽스 |
| ARAM_OutlawsGrit | 무법자의 투지 | abilityProps=dash, note | empirical |
| ARAM_Overflow | 범람 | requiresMana, note | empirical + datamined |
| ARAM_PhenomenalEvil | 극악무도 | favoredClasses=Mage/Support | empirical(가중치) |
| PressureCooker | 압력솥 | category=quest | category 분류 |
| ARAM_SpecializedRecursion | 가속 추구 | category=ability, spellExclude, note | official — 26.14/26.15 버그픽스 |
| SpecializedEmpowerment | 위력 추구 | category=ability, spellExclude, note | official — 26.15 버그픽스 |
| ARAM_Quest_SteelYourHeart | 강철 같은 심장 | category=quest | category 분류 |
| ARAM_Quickstep | 날쌘걸음 | category=ability, meleeOnly, note | empirical — 근접 3인만(11 §3-8) |
| DarkWind | 굶주린 속박 | category=ability, abilityPropsAll=immobilize, note | official — 위키 원문 |
| ARAM_RabbleRousing | 원기 회복 | category=ability | category 분류 |
| KeepGoing | 재장전 | category=ability, abilityPropsAll=durationEffect, note | official — 위키 원문 |
| ARAM_SkilledSniper | 노련한 저격수 | rangedOnly, note | empirical |
| SnapBack | 원상복구 | category=ability | category 분류 |
| SoulEater | 영혼의 포식자 | abilityProps=immobilize, note | empirical + datamined |
| Terraind | 지형 생성됨 | category=ability, abilityPropsAll=terrain, note | official — 위키 원문 |
| ARAM_Terror | 공포 | category=ability | category 분류 |
| ARAM_Upgrade_IE | 무한의 대검 업그레이드 | favoredClasses=Marksman/Fighter/Assassin, disfavoredClasses=Mage/Support/Tank | empirical(가중치) |
| Upgrade_Ravenous | 굶주린 히드라 업그레이드 | favoredClasses=Marksman/Fighter/Assassin, disfavoredClasses=Mage/Support/Tank | empirical(가중치) |
| Upgrade_SunderedSky | 갈라진 하늘 업그레이드 | favoredClasses=Marksman/Fighter/Assassin, disfavoredClasses=Mage/Support/Tank | empirical(가중치) |
| VoidDash | 공허 돌진 | category=ability, abilityPropsAll=dash, note | official — 위키 원문 |
| ARAM_Vulnerability | 취약 | favoredClasses=Marksman | empirical(가중치) |
| ARAM_WeeWooWeeWoo | 삐뽀삐뽀 | classRequired=Support, note | empirical |
| ARAM_CircleofDeath | 죽음의 순환 | abilityProps=heal, note | empirical(조건 해석은 추정) |
| ARAM_CourageoftheColossus | 거석상의 용기 | abilityProps=immobilize, note | empirical + datamined |
| ARAM_Cruelty | 잔혹 행위 | abilityProps=immobilize, note | empirical + datamined |
| ARAM_Dashing | 돌진 | abilityProps=dash, note | empirical + datamined |
| ARAM_DoubleTap | 한 발에 두 놈 | favoredClasses=Marksman | empirical(가중치) |
| ARAM_DrawYourSword | 검을 뽑아라 | rangedOnly, favoredClasses=Marksman, disfavoredClasses=Mage/Support, note | official(rangedOnly·루난) + empirical(클래스 좁힘 — 가중치) |
| ARAM_Earthwake | 대지의 각성 | abilityProps=dash, note | empirical + official(팀 제한) |
| Ability_SelfAOE_DoubleCast | 메아리 시전 | category=ability, note | empirical(약) — 이진 보류 |
| ARAM_EmpoweredByTheFaithful | 신념을 통한 강화 | classRequired=Support, note | empirical |
| EmpyreanPromise | 창공의 서약 | classRequired=Support, note | empirical |
| ARAM_Eureka | 유레카 | favoredClasses=Mage/Support, disfavoredClasses=Marksman/Assassin/Fighter | empirical(가중치) |
| ARAM_MasterofDuality | 결투의 대가 | favoredClasses=Mage/Support, disfavoredClasses=Marksman/Assassin/Fighter | empirical(가중치) |
| ARAM_Multishot | 다중 공격 | category=ability, abilityPropsAll=projectile, note | official(requiredProps) + datamined(벨코즈) |
| OminousPact | 불길한 서약 | favoredClasses=Mage/Support, disfavoredClasses=Marksman/Assassin/Fighter | empirical(가중치) |
| Overloaded | 과충전 | category=ability, spellExclude, note | official — 26.15 버그픽스 |
| Overkill | 바늘꽂이 | category=ability, abilityPropsAll=durationEffect, note | official — 위키 원문 |
| PoroCharge_Active | 포로 쇄도 | category=quest | category 분류 |
| ARAM_Quest_VoidImmolation | 이케시아의 몰락 | category=quest | category 분류 |
| Quest_Sneakerhead | 신발 수집가 | category=quest | category 분류 |
| ARAM_Quest_UrfsChampion | 우르프의 챔피언 | category=quest | category 분류 |
| ARAM_Quest_WoogletsWitchcap | 우글렛의 마녀 모자 | category=quest, favoredClasses=Mage/Support, disfavoredClasses=Marksman/Assassin/Fighter | empirical(가중치) |
| Missile_Split | 주문 분산 | category=ability, abilityPropsAll=projectile, note | official + empirical |
| ARAM_SpiritBomb | 영혼 폭탄 | classRequired=Support, note | empirical |
| ARAM_StuckInHereWithMe | 도망갈 수 없어 | favoredClasses=Fighter/Tank/Assassin | empirical(가중치) |
| ARAM_TapDancer | 탭 댄서 | favoredClasses=Marksman | empirical(가중치) |
| SpellVolley | 3연발 | category=ability, abilityPropsAll=targeted+projectile, note | official + empirical |
| Quest_UltraHydra | 궁극의 히드라 | category=quest, favoredClasses=Marksman/Fighter/Assassin, disfavoredClasses=Mage/Support/Tank | empirical(가중치) |
| ARAM_WindspeakersBlessing | 바람전달자의 축복 | abilityProps=heal, note | empirical(조건 해석은 추정) |
