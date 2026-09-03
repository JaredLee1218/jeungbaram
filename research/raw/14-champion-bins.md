# 14. 챔피언별 게임 데이터 bin 채굴 — 스킬 단위 적격성 태그 `mSpellTags` 발굴 (광맥 1)

- 조사일: 2026-09-03 / CommunityDragon `latest` = content-metadata `16.17.8104348+branch.releases-16-17.content.release` (라이브 26.17 상당; modespecificdata 주요 파일 mtime 2026-08-29)
- 방법: CommunityDragon 원본 파일을 **실제로 다운로드하여 로컬 전수 검색·파싱**(curl + Node.js 스크립트). 표기: ✅ = 직접 다운로드·파싱으로 확인, ❓ = 미확인/추정.
- 독립 검증 2026-09-03: 별도 세션에서 236개 bin·kiwi/augmentgroups/files.exported.txt·과거 스냅샷 9종·위키 V26.14를 전부 재fetch·재집계하여 대조. 핵심 주장(태그 어휘·발생 수·CreateTerrain 6명·NotBenefitFromHaste 3명·16.12 대확장·16.14 태그 추가·16.15 무변경·682/692 슬롯·파일 크기/개수) 재현 일치. 정정 4건: jade_lulu 404→200(모수 236), "augment 히트 전부 mTargetHeightAugment"→예외 명시, MoveBlock 주 슬롯 120→101, 라이브 주 슬롯 어휘 56→55(**이 마지막 정정은 2차 재검증에서 번복** — 아래 줄·§2.2). 각 위치에 [검증 2026-09-03] 주석.
- 재검증 2026-09-03 (2차, 또 다른 독립 세션): 236개 bin 전수 재다운로드·재집계, 스냅샷 diff(야스오 16.10/16.12/16.13/16.14, 애쉬 16.11→16.12, 말파이트·드레이븐 16.14→16.15), kiwi.bin.json(12,121,996B)·augmentgroups(78,175B)·files.exported.txt(57,025,213B)·modespecificdata 리스팅, 위키 V26.14("Pursuit of Haste was offered to Yasuo E.")·V26.15("Pursuit of Power is offered to Akshan's (E), Draven's (Q), Illaoi's (E), and Malphite's (W).") 전부 직접 재fetch — 본문 수치·목록(태그 62종 발생 수 전항목, CreateTerrain 6명, NotBenefitFromHaste 3명·주 슬롯 5, 682/692, §4 표, kiwi 973/spelltag 0/abilityaugment 11, jade_lulu 200·63,168B) 재현 일치. 단 1차 검증의 정정 1건을 번복: 라이브 주 슬롯 어휘는 55가 아니라 **56**(빈 문자열 `""`이 우디르 W 주 슬롯 `mSpellTags`에 실제 출현하므로 1차의 번복 근거가 오류 — §2.2). 추가 발견: 아이템 추천 모드명에 미기재 해시 `{20426d6f}` 24건 존재(§1).
- 선행 스터디와의 관계: 09(스킬 증강 30종, 시스템이 증강×스킬 조합을 사전 지정)와 10(kiwi.bin 해부 — "챔피언 매핑은 클라이언트에 없다" 잠정 결론)을 전제로 하고 반복하지 않는다. 이번 조사는 그 잠정 결론을 **챔피언 쪽 파일**에서 넘어서려는 시도이며, 결과는 "증강→챔피언 매핑은 여전히 없지만, **스킬→속성 태그는 클라이언트에 통째로 있다**"이다.

---

## 0. TL;DR

1. **챔피언 bin에 kiwi/증강 직접 후크는 없다.** 라이브 챔피언 173명 전원 + 미공개 jade_* 변형 63종 = 236개 `{champ}.bin.json` 전수 grep 결과, `kiwi`/`ARAM_`/`mayhem`/증강 해시(`{e3a02eac}`,`{330066e7}`,`{c38192bb}`)/`mSpellUpgrade` 히트 **0건**. "Augment" 문자열 히트는 대부분 투사체 높이 파라미터 `mTargetHeightAugment`이고, 나머지 예외도 전부 kiwi와 무관: 빙결 강화 룬 경로 `GlacialAugment`(다수 챔피언 아이템 추천 블록), 자야 `mOverrideHeightAugment`, 빅토르 고유 계산값 이름(`AugmentShieldBonus` 등 6건), 조이 W `ValidCastSpells`의 아레나(cherry) 증강 액티브 화이트리스트 12건(`Augment_WarmupRoutine` 등), 케인 툴팁 노이즈(§5-5). ✅ [검증 2026-09-03: 236개 전수 재다운로드·재grep — 원문 "히트 전부 mTargetHeightAugment"는 부정확하여 예외 명시로 수정. jade_lulu는 404가 아니라 200(63,168B, mtime 08-29)이어서 모수 235→236 정정]
2. **대발견: `mSpellTags`** — 각 챔피언 스킬의 `SpellDataResource`(`mSpell`) 안에 **스킬 단위 속성 태그 배열**이 있다. 어휘 62종(`Trait_ImmobilizingCCSpell`, `Trait_KnockBack`, `Trait_CreateTerrain`, `Trait_Shield`, `PositiveEffect_EmpowerAttack`, `Trait_AttackBuff_Duration`, `Trait_Ranged_*`(투사체 거동), `Trait_Ultimate`, `Trait_Low_Damage`, `Trait_NotBenefitFromHaste` 등). 스킬 증강 각각의 "요구 스킬 속성"(스터디 09 §3 표)과 어휘가 정확히 겹친다. ✅
3. **타임라인 실증(결정적)**: 이 태그 체계는 16.11 이전에도 좁은 어휘(CC/궁극기 계열)로 존재했으나, **16.12(= 라이브 26.12, 스킬 증강 도입 패치)에서 어휘가 대확장**됐고(야스오·애쉬 양쪽에서 재현), **16.14에서 야스오 Q·E에만 `Trait_NotBenefitFromHaste`가 추가**됐다 — 공식 26.14 패치 노트의 "Pursuit of Haste가 야스오 E에 제시되던 버그 수정"과 1:1 대응. **버그픽스가 곧 태그 편집**이었다는 것은 이 태그가 스킬 증강의 스킬 단위 적격성 판정의 **입력 데이터**임을 강하게 시사한다. ✅ (단, "서버가 이 태그만 쓴다"는 확증은 아님 — §6·§9)
4. **반대 방향(증강→요구 태그)은 여전히 클라이언트에 없다**: kiwi.bin.json(12.1MB) 재다운로드 후 `Trait_`/`PositiveEffect_` 전수 grep — 증강 정의가 요구 태그를 참조하는 필드는 없음(히트는 VFX/스킨 문자열과 증강 자체 스펠의 태그 몇 건뿐). augmentgroups.bin.json에도 0건. 즉 "어떤 증강이 어떤 태그를 요구하는가"의 매트릭스는 서버 전용이고, 위키 문서(09 §3)로만 재구성 가능. ✅
5. **전 챔피언 확장을 실제로 수행**: 라이브 173명 전원이 태그 보유, 주 스킬 슬롯(Q/W/E/R) 692개 중 682개 태깅(98.6%; 나머지는 특수 킷 + 추출 휴리스틱 한계, §8). 챔피언×스킬×태그 전체 데이터셋 추출 완료. ✅
6. 부수 확인: modespecificdata 디렉토리 재리스팅 — **09-02 조사 이후 신규 스킬 증강 파일 없음**(파일 세트 동일, `abilityaugmentspellmodifiers.bin.json` 여전히 150B/mtime 6-17). files.exported.txt(57MB) 재grep — `kiwi` 973건 전부 에셋/UI/유닛, `spelltag` 0건, 매핑 파일 없음. ✅

---

## 1. 어디를 어떻게 뒤졌나 (전수 기록)

| 대상 | URL 패턴 | 실측 |
|---|---|---|
| 챔피언 루트 bin | `https://raw.communitydragon.org/latest/game/data/characters/{champ}/{champ}.bin.json` | 대표 5명(yasuo 118KB, brand 67KB, ashe 100KB, malphite 50KB, ekko 65KB) → 이후 champion-summary의 236종 전부 시도, **236개 전부 확보**. 총 15MB ✅ [검증 2026-09-03: 원문의 "`jade_lulu`(id 60117)만 404" 주장은 재현 실패 — 직접 재fetch 시 HTTP 200, 63,168B, Last-Modified 2026-08-29(타 파일과 동일 배치). 유효한 CharacterRecord 포함 정상 bin] |
| 과거 패치 스냅샷 | `https://raw.communitydragon.org/{16.10~16.15}/game/data/characters/...` | yasuo 16.10~16.14, ashe 16.11~16.12, malphite·draven 16.14~16.15 ✅ |
| 모드 데이터 | `https://raw.communitydragon.org/json/latest/game/maps/modespecificdata/` (리스팅), kiwi.bin.json, augmentgroups.bin.json | 재리스팅 + 재다운로드 ✅ |
| 전체 파일 목록 | `https://raw.communitydragon.org/latest/cdragon/files.exported.txt` | 57,025,213바이트 전체 다운로드 후 로컬 grep ✅ |
| 검색 패턴 | `kiwi`(대소문자 무시), `augment`, `ARAM_`, `mayhem`, `mSpellUpgrade`, `ModeSpecificData`, `SpellModifier`, `mConditional*`, `mRequiredUnitTags`, `mSpellTags`, `mModeNameStringId`, 해시 `{e3a02eac}`/`{330066e7}`/`{c38192bb}`, `Trait_`/`PositiveEffect_` | 각 절 참조 ✅ |

### 챔피언 bin의 파일 구조 (5명 공통 확인)

- 최상위 키 = 오브젝트 경로(예: `Characters/Yasuo/Spells/YasuoQ1WrapperAbility/YasuoQ1Wrapper`).
- `CharacterRecord`: `spellNames` 배열이 **Q/W/E/R 슬롯 순서**로 스펠 경로 접미사를 지정(예: 애쉬 `["AsheQAbility/AsheQ","VolleyAbility/Volley","AsheSpiritOfTheHawkAbility/AsheSpiritOfTheHawk","EnchantedCrystalArrowAbility/EnchantedCrystalArrow"]`), `mCharacterPassiveSpell`이 패시브 경로. → 슬롯 매핑의 근거.
- `SpellObject.mSpell` = `SpellDataResource`(수치·투사체 `mMissileSpec`·타게터 등 실데이터) — **`mSpellTags`는 이 안의 필드**다.
- 그 외: AbilityObject(스킬 묶음), 영원의 석판(StatStone*), 아이템 추천(`mModeNameStringId`: CLASSIC 244/ARAM 163/cherry 78/`{ad33a648}` 62/`{20426d6f}` 24/SWIFTPLAY 5/NEXUSBLITZ 1 — 해시 모드명 `{ad33a648}`은 아수라장으로 추정 ❓, `{20426d6f}`는 2차 재검증(2026-09-03)에서 발견된 미해독 해시 ❓; SWIFTPLAY·NEXUSBLITZ는 2026-09-03 검증 시 전수 스캔에서 추가 확인).
- 스킬 증강 자체(카드·효과)는 챔피언 bin이 아니라 kiwi.bin.json에 있다(스터디 10). 챔피언 bin에는 증강 쪽으로 향하는 참조가 전혀 없다. ✅

---

## 2. `mSpellTags` — 구조와 전체 어휘

### 2.1 구조

```json
"Characters/Ekko/Spells/EkkoWAbility/EkkoW": {
  "mSpell": {
    "mSpellTags": ["Trait_ImmobilizingCCSpell","Trait_Shield","Trait_Target_Area","Trait_Ranged_Zone","Trait_AoE"],
    ...
  }, "__type": "SpellObject"
}
```

- 주 스킬(Q/W/E/R)뿐 아니라 서브 스펠(야스오 Q2/Q3 래퍼, 오른 R 돌진 등)과 일부 패시브·아이템 스펠(루난 추가 화살 `Trait_NonPrimaryAttack`)에도 붙는다.
- 태그는 게임플레이 문자열 그대로(해시 아님) — 기계 판독 즉시 가능.

### 2.2 어휘 전수 62종 (236개 bin 합산 발생 수) ✅

| 발생 수 | 태그 |
|---|---|
| 600 / 440 / 294 | Trait_DamageAbility / Trait_AoE / Trait_Ultimate |
| 265+10 | Trait_ImmobilizingCCSpell + Trait_ImmobilizingCCAbility (속박·에어본 계열) |
| 190 / 177 / 139 | Trait_SignatureSpell(시그니처 스킬) / PositiveEffect_MoveBlock(이동 중 시전 불가·대시류) / Trait_Low_Damage |
| 123 / 99 / 95 | PositiveEffect_Boon(아군 이로운 효과) / Trait_RecastOrReplaceSpell(재시전형) / Trait_AttackReset(평타 초기화) |
| 83 / 72 / 69 / 66 / 65 | Trait_PlayerSelectedDashDirection(방향 지정 대시) / Trait_ChannelSpell / Trait_DoT / Trait_ActiveHeal / Trait_AttackBuff_Duration(지속형 공격 강화) |
| 64 / 64 / 61 / 57 / 55 | Trait_Ranged_StopsFirstHit(첫 적중 소멸 투사체) / PositiveEffect_EmpowerAttack(강화 평타) / Trait_Strike / Trait_Shield / Trait_FreeRecast |
| 52 / 49 / 36 / 35 / 34 | Trait_Target_Area / Trait_Ranged_Piercing(관통 투사체) / PositiveEffect_Teleport / **Trait_KnockBack** / Trait_Melee_SmallWindup |
| 33 / 28 / 22 / 19 | Trait_Target_Directional / Trait_Ranged_Zone(장판형 원거리) / Trait_Ammo(충전형) / Trait_Parry |
| 15 / 14 / 14 / 13×4 | Trait_Untargetable / Trait_Melee_BigWindup / Trait_MultiTargetAttack / Trait_Invisibility·Trait_Toggle·Trait_SwapsIntoImmobilizingCCAbility·Trait_Transformation |
| 11 / 10×4 / 9×2 / 8×2 | SpecialCase_StasisLocked / Trait_CCImmune·Trait_Pet·Trait_ImmobilizingCCAbility·Trait_Upgrade / Trait_Trap·Trait_PassiveSlot / SpecialCase_CastNotTriggerTear·Trait_Immune |
| 7 / 6×3 / 5×2 | Trait_Camouflage / **Trait_CreateTerrain**·Trait_NoCooldown·Trait_ProjectileDestruction / Trait_NonPrimaryAttack·**Trait_NotBenefitFromHaste** |
| ≤4 | Trait_UltimateReactivation(4), Trait_CreateClone(4), Trait_SylasSpecialAttackOverride(3), Trait_SummonerSmite(3), Trait_Kinematic(2), SpecialCase_DelayedCooldown(2), Trait_PassiveShield(1), Trait_Silence(1), Trait_SelfHeal(1), SpecialCase_CastWhileTeleporting(1), `""`(빈 문자열 17 — 데이터 노이즈: evelynn·kaisa·udyr(W 주 슬롯)·jade_* 등) |

- 라이브 173명의 주 슬롯만 집계하면 어휘 56종 — 단 그중 1종은 빈 문자열 `""`(우디르 W의 데이터 노이즈)이므로 실질 어휘는 55종(나머지는 서브 스펠·jade 전용 출현). ✅ [재검증 2026-09-03(2차): 독립 재집계 56종으로 원문 56 재현 — 1차 검증의 "빈 문자열은 라이브 주 슬롯에 출현하지 않으므로 55" 정정은 오류였음. 실측: 우디르 W(`Characters/Udyr/Spells/UdyrWAbility/UdyrW`)의 `mSpellTags`=`["Trait_ActiveHeal","Trait_Shield",""]`. §4의 태그별 주 슬롯 수치는 2차 재집계에서도 전항목 일치(174+7/35/6/52/34/58/56/101/59·46·27/171/5/130)]
- [검증 2026-09-03: 위 표는 jade_lulu 편입(모수 235→236)으로 Ultimate 293→294, ImmobilizingCCSpell 263→265, PositiveEffect_Boon 120→123만 변동(jade_lulu의 기여가 정확히 Boon 3·ImmobilizingCCSpell 2·Ultimate 1). 나머지 발생 수는 독립 재집계와 전부 일치]

---

## 3. 예시 3건 (요구된 "구조·예시" — 슬롯 매핑 포함, 전부 실측)

### 예시 1 — 야스오: 태그 + 패치 히스토리가 버그픽스와 1:1

| 슬롯 | 스펠 | mSpellTags (16.17) |
|---|---|---|
| Q | YasuoQ1Wrapper | Trait_ImmobilizingCCAbility, Trait_DamageAbility, Trait_RecastOrReplaceSpell, Trait_Strike, Trait_Target_Directional, Trait_AoE, **Trait_NotBenefitFromHaste** |
| W | YasuoW | Trait_ProjectileDestruction |
| E | YasuoE | PositiveEffect_MoveBlock, Trait_DamageAbility, Trait_Low_Damage, **Trait_NotBenefitFromHaste** |
| R | YasuoR | Trait_Ultimate, PositiveEffect_MoveBlock, Trait_ImmobilizingCCSpell, Trait_DamageAbility, Trait_SignatureSpell, Trait_AoE |

- 16.13까지 Q·E에 NotBenefitFromHaste 없음 → **16.14에서 추가**(발생 0→2). 같은 패치의 공식 노트: "Fixed a bug where Pursuit of Haste was offered to Yasuo E"(스터디 09 §5-4). 가속 추구(Pursuit of Haste)는 "가속의 이득을 보는 스킬"이 적격인데, 야스오 Q/E는 쿨타임이 공속/고정식이라 부적격 — **수정이 곧 이 태그 추가**였다. ✅
- 이 태그 보유자는 전체에서 **야스오·요네·제리 3명뿐**(요네 Q/W, 제리 Q) — 전부 "쿨타임이 가속을 안 받는 스킬" 보유자로 알려진 챔피언. ✅

### 예시 2 — 에코: 보호막·장판·대시 태그

| 슬롯 | 스펠 | mSpellTags |
|---|---|---|
| Q | EkkoQ | Trait_DamageAbility, Trait_SignatureSpell, Trait_Ranged_Piercing, Trait_AoE |
| W | EkkoW | Trait_ImmobilizingCCSpell, **Trait_Shield**, Trait_Target_Area, Trait_Ranged_Zone, Trait_AoE |
| E | EkkoE | PositiveEffect_MoveBlock, Trait_AttackReset, **Trait_PlayerSelectedDashDirection**, Trait_DamageAbility, Trait_Strike |
| R | EkkoR | Trait_Ultimate, PositiveEffect_Teleport, Trait_DamageAbility, Trait_ActiveHeal, Trait_Untargetable, Trait_AoE |

→ 보강(Bolstered, 보호막 요구)=W, 공허 돌진(대시 요구)=E, 굶주린 속박(속박 요구)=W, 주문 분산(투사체)=Q가 태그만으로 도출된다.

### 예시 3 — `Trait_CreateTerrain` 보유자 전수 = 지형 생성됨(Terrain'd) 적격 목록과 일치

전체 236개 bin에서 이 태그 보유 챔피언은 정확히 6명: **애니비아(W Crystallize), 트런들(E TrundleCircle), 탈리야(R TaliyahR), 아지르(R AzirR), 자르반 4세(R JarvanIVCataclysm), 오른(Q OrnnQ)** — 지형 생성 스킬의 통념적 전체 목록과 일치하고, "궁극기면 피해 3배" 보정(09 §3) 대상인 탈리야/아지르/자르반 R이 그대로 식별된다. ✅

- 보너스: `Trait_KnockBack`(연쇄 반응의 넉백 요구) 보유 예 — 드레이븐 E(DravenDoubleShot), 트런들 E, 탈리야 W, 요네 R 등 35건. ✅

---

## 4. 태그 ↔ 스킬 증강 요구 속성 대응표 (스터디 09 §3와 결합)

| 스킬 증강(요구 속성) | 대응 태그(실측) | 라이브 주 슬롯 보유 수 |
|---|---|---|
| 굶주린 속박(속박/그라운딩) | Trait_ImmobilizingCCSpell(+Ability) | 174+7 |
| 연쇄 반응(넉백) | Trait_KnockBack | 35 |
| 지형 생성됨(지형 생성) | Trait_CreateTerrain | 6 |
| 보강 Bolstered(보호막) | Trait_Shield | 52 |
| 꽁!·2연속 공격(강화 평타) | PositiveEffect_EmpowerAttack (+Trait_AttackReset) | 34 |
| 출발할 시간·바늘꽂이·재장전(지속시간형 효과) | Trait_AttackBuff_Duration 등 지속형 태그 | 58 |
| 공허 돌진·날쌘걸음(대시/자가 AoE) | Trait_PlayerSelectedDashDirection / PositiveEffect_MoveBlock | 56 / 101† |
| 주문 분산·3연발·다중 공격(투사체) | Trait_Ranged_StopsFirstHit / _Piercing / _Zone (+`mMissileSpec` 실데이터) | 59/46/27 |
| 작은 도움(평타 강화 지속) | Trait_AttackBuff_Duration + PositiveEffect_EmpowerAttack | — |
| 연쇄 반응·지형 생성됨의 "궁이면 증폭" | Trait_Ultimate | 171 |
| 가속 추구 **제외** 조건 | Trait_NotBenefitFromHaste | 5 (야스오2·요네2·제리1) |
| 26.13 "실질 이득 스킬만" 큐레이션 | Trait_Low_Damage(130), Trait_NoCooldown, Trait_Ammo, Trait_Toggle, SpecialCase_* | — |

† PositiveEffect_MoveBlock은 대시류 외 정지 시전형에도 붙어 과포함 — 단독으로 대시 판정에 쓰기엔 부정확(❓). [검증 2026-09-03: 원문 120은 재현 안 됨 — 라이브 주 슬롯 보유 수 101로 정정(같은 휴리스틱으로 표의 다른 14개 수치는 전부 일치했으므로 120은 집계 오기로 판단; 참고로 라이브 전 스펠 발생 154, 보유 챔피언 88 어느 쪽도 120 아님)]

**주의**: 이 대응은 어휘 일치에 근거한 **재구성**이다. "증강 X가 태그 Y를 요구한다"는 명시 데이터는 클라이언트에 없다(§5). 근사: 시뮬레이터에 반영할 때는 위키 명문 요구 속성(09 §3) × 본 태그 데이터로 후보 스킬을 산출하되, 서버측 추가 큐레이션(450+ 조합 제거, 26.15류 예외)이 있어 **과포함 방향의 근사**임을 주석으로 남길 것.

---

## 5. 못 찾은 것 — 어디를 어떻게 뒤졌는데 없었다 (정직 신고)

1. **챔피언 bin 안의 증강 참조**: 236개 파일 전수 grep — `kiwi`(대소문자 무시) 0, `ARAM_` 0, `mayhem` 0, 증강 해시 `{e3a02eac}`/`{330066e7}`/`{c38192bb}` 0, `mSpellUpgrade` 0. "augment" 히트는 대부분 `mTargetHeightAugment`(투사체 높이·공통 물리 파라미터)이며, 예외는 전부 kiwi 무관(§0-1 목록: GlacialAugment 룬 경로·자야 mOverrideHeightAugment·빅토르 내부 계산값·조이 W의 cherry 증강 화이트리스트·케인 노이즈). ✅ [검증 2026-09-03: "전부 mTargetHeightAugment"에서 정정]
2. **증강→요구 태그 매트릭스**: kiwi.bin.json(12,121,996B, 2026-09-03 재다운로드) 전수 grep — `Trait_`/`PositiveEffect_` 히트는 스킨/VFX 문자열(Trait_YordleLord_* 등)과 증강 자체 스펠에 붙은 태그 소수(PositiveEffect_Boon 4, Trait_SummonerSpell 6 등)뿐. **AugmentData가 요구 태그를 참조하는 필드는 없다.** augmentgroups.bin.json(78,175B)에도 Trait_ 0건. → 스터디 10의 결론(증강×챔피언 매핑=서버) 유지, 단 "증강×스킬 속성" 판정의 **스킬 쪽 절반은 클라이언트에 있다**로 갱신. ✅
3. **스킬 증강 전용 신규 파일**: modespecificdata 재리스팅(2026-09-03) — 파일 세트가 스터디 10 §5 표와 동일(추가: 빈 파일 `wasd.bin.json` 15B·`firstblood.bin.json` 15B — 무관). `abilityaugmentspellmodifiers.bin.json`은 여전히 150B(mtime 2026-06-17, Siphon 툴팁 append 1건). `kiwi.bin` mtime 2026-08-29. **abilityaugments 유사명의 신규 데이터 파일 없음.** ✅
4. **files.exported.txt 재확인**(57MB 전체 다운로드 후 로컬 grep): `kiwi` 973건 — 전부 증강 VFX 파티클(`kiwi_augment_*`), 모드 유닛(kiwi_poroking/kiwi_tibbers/kiwi_viegosoul), UI 번들(kiwiaugmentselection, kiwiaugmentsettooltips, kiwiaugmentsettraittracker, kiwiplayeraugments, kiwiscoreboard, jade용 playerstats 등), 텍스처. `abilityaugment` 11건 — png 아이콘(genericabilityaugmenticon_{silver,gold,prismatic}), 파티클 2, 진행 트랙 보상 아이콘(rewards/kiwi/abilityaugments.png), 그리고 §5-3의 bin 2건뿐. `spelltag` 0건. **챔피언×증강×스킬 매핑 파일은 존재하지 않는다.** ✅
5. **노이즈 기록**: 케인 bin의 Q/E/R `mTooltipData.mFormat`이 엉뚱하게 증강 텍스처 경로(`Maps/ModeSpecificData/Augments/BiggestSnowballEver/.../Augment_CircleofDeath_alpha5.tex`)를 가리킴 — 데이터 입력 실수로 보이는 아티팩트(챔피언 bin에서 ModeSpecificData 문자열이 나오는 유일 사례, 메커니즘 아님 ❓). 이베른(넥서스 돌격 패시브)·사일러스(빼앗은 궁 계수 변환)의 `SpellModifier`는 스킬 증강과 같은 `__type`을 쓰는 **범용 모드별 스킬 수정자 체계**임을 보여준다(스킬 증강의 툴팁 수정자가 이 체계의 kiwi 인스턴스). ✅

---

## 6. 패치 히스토리 검증 (스냅샷 diff) ✅

| 스냅샷 | 야스오 mSpellTags | 관찰 |
|---|---|---|
| 16.10 / 16.11 | 8건, 어휘 좁음(Ultimate/ImmobilizingCC/MoveBlock/SwapsIntoImmobilizingCCSpell) | **태그 체계 자체는 스킬 증강 이전부터 존재**(다른 시스템용으로 추정 ❓) |
| **16.12** (26.12 = 스킬 증강 도입) | 9건, **대확장**: Q에 DamageAbility·RecastOrReplaceSpell·Strike·Target_Directional·AoE, E에 DamageAbility·Low_Damage, R에 SignatureSpell 등, W에 ProjectileDestruction 신설 | 애쉬도 동일 패턴(Q에 AttackBuff_Duration·NoCooldown, W에 StopsFirstHit·AoE, E에 Ammo 추가) — **도입 패치에서 전 스킬 재태깅** |
| 16.13 | 변화 없음 | — |
| **16.14** | Q·E에 **Trait_NotBenefitFromHaste 추가** | 공식 26.14 버그픽스("Pursuit of Haste offered to Yasuo E")의 실체 = 태그 편집 |
| 16.14→16.15 (말파이트·드레이븐) | **변화 없음** | 26.15 버그픽스("Pursuit of Power offered to Akshan E/Draven Q/Illaoi E/Malphite W")는 태그 무변경 → **서버측 예외 목록이 병존**한다는 증거 |

---

## 7. 챔피언 스킬 증강 판정의 전체 그림 (본 조사 후 갱신)

```
[클라이언트에 실재] 챔피언 스킬별 mSpellTags (62종 어휘, 전 챔피언)   ← 이번 발굴
[클라이언트에 실재] 증강별 mAugmentTags/mBuildTags/{e3a02eac} 등      ← 스터디 10
[서버 전용]        증강→요구 태그 매트릭스, Optimal/Viable/Average/Invalid 가중치,
                   조합 단위 제거 목록(450+), 26.15류 개별 예외        ← 여전히 미공개
```

- 유저가 보는 "증강×스킬 조합 카드"는 (증강 요구 속성) ⨯ (스킬 mSpellTags) 매칭의 결과물로 설명 가능하며, 그 재료의 절반(스킬 쪽)이 이번에 통째로 확보됐다.
- 26.12 도입 시 전 챔피언 스킬을 일괄 재태깅했고 이후 버그픽스 일부가 태그 편집으로 이뤄진다는 점에서, 이 태그는 **라이엇이 스킬 증강 시스템을 위해 능동 관리하는 라이브 데이터**다. ✅ (단독 용도 확증은 불가 ❓ — CC 표시 등 타 시스템 공용일 수 있음)

---

## 8. 전 챔피언 확장 방법 (실행 완료 — 재현 절차)

1. 챔피언 목록: `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-summary.json` → `id>0`인 236종의 `alias.toLowerCase()`가 디렉토리명(236종 전부 200 OK — 2026-09-03 검증: 원문의 jade_lulu 404 주장은 재현 안 됨, §1 표 참조).
2. 각 bin: `https://raw.communitydragon.org/latest/game/data/characters/{alias}/{alias}.bin.json` (개당 30~600KB, 총 ~15MB).
3. 파싱: 최상위 엔트리 순회 → `__type=="CharacterRecord"`의 `spellNames`(Q/W/E/R)·`mCharacterPassiveSpell` 확보 → 전체 재귀 탐색으로 `mSpellTags` 보유 오브젝트 수집 → bin 키가 `spellNames[i]`로 끝나면 해당 슬롯에 귀속.
4. 집계 결과(2026-09-03 실측): 라이브 173명 전원 태그 보유, 주 슬롯 682/692 태깅. 슬롯 미달 8명(aphelios·bard·hwei·katarina·naafiri·nasus·tryndamere·varus)은 대부분 래퍼/변신 스킬명이 spellNames와 어긋나는 **추출 휴리스틱 한계**(태그 자체는 others로 수집됨 — 예: 흐웨이 서브 스펠军). jade_* 63종(미공개 Jade 모드용 챔피언 변형, jade_lulu 포함)도 독자 태그 세트 보유(보너스 발견).
5. 시뮬레이터 반영 시(STUDY §3 6단계 작업과 연결): champions.json에 `immobilize/knockback/shield/terrain/dash/missile/empoweredAttack/durationEffect/notBenefitFromHaste` 속성을 이 데이터에서 생성해 넣으면 된다. 슬롯 미달 8명만 수동 보정.

---

## 9. 미확인 / 한계

1. mSpellTags가 스킬 증강 적격성 판정의 **유일한** 입력인지 — 확증 불가. 16.14 사례는 "입력이다"의 강한 증거지만, 16.15 사례는 태그 밖 서버 예외의 존재 증거. 즉 실제 게임의 조합 목록은 (태그 매칭) − (서버 예외) ± (미지 규칙). ❓
2. 증강별 요구 태그의 공식 명세 — 클라이언트 부재. 위키 서술(09 §3)로 재구성한 §4 대응표는 근사. ❓
3. `{ad33a648}`(아이템 추천의 해시 모드명)이 kiwi(아수라장)인지 — 정황상 유력하나 미해독. ❓
4. 태그 체계의 원용도(16.11 이전 좁은 어휘가 무엇을 위해 있었는지 — CC 표시기? 아이템 추천?) — 미확인. ❓
5. 빈 태그 `""` 17건, 야스오 16.10의 `Trait_SwapsIntoImmobilizingCCSpell`→16.12 소멸 등 정리되지 않은 데이터 흔적 — 의미 없음으로 판단하나 미확증. ❓
6. 본 조사 시점의 latest=16.17. 프롬프트의 "26.18 추정"과 달리 CDN은 아직 16.17 브랜치(content-metadata로 확인). 26.18 배포 시 태그 변경분 재수집 필요.

---

## 10. 출처 (전부 2026-09-03 직접 다운로드·파싱)

- 챔피언 bin(대표): https://raw.communitydragon.org/latest/game/data/characters/yasuo/yasuo.bin.json (brand/ashe/malphite/ekko 동형, 및 236종 전체)
- 과거 스냅샷: https://raw.communitydragon.org/16.10/game/data/characters/yasuo/yasuo.bin.json (16.11/16.12/16.13/16.14 동형), https://raw.communitydragon.org/16.14/game/data/characters/malphite/malphite.bin.json (16.15, draven 동형), https://raw.communitydragon.org/16.11/game/data/characters/ashe/ashe.bin.json (16.12 동형)
- 챔피언 목록: https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-summary.json
- 모드 데이터: https://raw.communitydragon.org/json/latest/game/maps/modespecificdata/ (리스팅), https://raw.communitydragon.org/latest/game/maps/modespecificdata/kiwi.bin.json , https://raw.communitydragon.org/latest/game/maps/modespecificdata/augmentgroups.bin.json , https://raw.communitydragon.org/latest/game/maps/modespecificdata/abilityaugmentspellmodifiers.bin.json
- 전체 파일 목록: https://raw.communitydragon.org/latest/cdragon/files.exported.txt
- 버전 확인: https://raw.communitydragon.org/latest/content-metadata.json (`16.17.8104348+branch.releases-16-17.content.release`)
- 대조한 공식 기록(재인용, 원문은 스터디 09): 26.14 야스오 E 버그픽스 — https://wiki.leagueoflegends.com/en-us/V26.14 , 26.15 4건 — https://wiki.leagueoflegends.com/en-us/V26.15
