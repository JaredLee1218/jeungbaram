# 15. 광맥 2: 공식 위키 스킬 증강 문서화 현황 + 패치 히스토리 전수 채굴 (V26.12~현재)

- 조사일: 2026-09-03 / 라이브 패치 26.17 (26.18은 위키·공식 모두 미발행 — §4)
- 방법: 위키 raw wikitext/Lua 직접 다운로드(`?action=raw`, api.php) 후 전수 grep·파싱. 패치 전사본 V26.12~V26.17의 ARAM: Mayhem 절 + Hotfixes 절 전문 확인. 공식 패치노트는 WebFetch(요약 모델 경유, 해당 시 표기).
- 선행 스터디(09, 10)와의 관계: 09가 표본으로 인용한 버그픽스 문구를 **전수**로 확장(신규 수집 다수). 10의 잠정 결론("클라이언트에 챔피언 매핑 없음")은 유지되나, **위키 편집자 실측 기반의 챔피언×스킬 목록이 위키에 생기기 시작**했음을 새로 확인(§2).
- 표기: 원문은 전부 위키 전사본(raw 직접 확인)이며, 요약 경유 인용만 별도 표시.
- 독립 검증(2026-09-03, curl 재fetch): §3 인용 전 문구 verbatim 일치·절 소속 일치, 모듈 네임스페이스 687페이지 재열람 일치, 15종 missing·V26.18 404(위키·공식) 재확인. 수치 오류 2건(§0-3 스킬 집계, §0-4/§3-2 긍정·부정 배분)과 출처 필드 부정확 2건(§1-1 Earthwake·Droppybara)을 수정 — 각 위치의 주석 참조.

---

## 0. TL;DR

1. **스킬 증강 개별 위키 문서는 여전히 없다.** Multishot/Tripleshot/Spell Split/Echo Cast/Siphon/Terror/BONK!/Pursuit of Haste/Pursuit of Power/Quickstep/Chain Reaction/Overloaded/Pin Cushion/Mercy's Strike/Ravenous Bind 15종 api.php titles 조회 → 전부 missing, 리다이렉트도 없음.
2. **스킬 매핑 전용 모듈도 없다.** Module 네임스페이스(828) 전수 687페이지 열람 → Mayhem 관련은 `Module:MayhemAugmentData`(+/data, /doc)뿐. 데이터 모듈 필드도 여전히 description(225)/tier(225)/notes(29)/questinfo(4) 4종 — 구조화된 champions/abilities 필드 신설 없음(2026-09-02 최종 편집판 기준).
3. **그러나 신규 광맥 발견: `Spin To Win` 항목의 notes에 위키 편집자들이 "Eligible Abilities" 챔피언×스킬 목록을 실측으로 축적 중** — 22챔피언 28스킬 확정 + 5스킬 "Pending for test"<!-- 검증 수정(2026-09-03): 원문 "23챔피언 30스킬"은 집계 오류. raw 재fetch 후 재계산 결과 §2-1 표와 동일한 22챔피언·28스킬(아리2·아무무1·암베사1·다리우스1·드레이븐3·가렌1·헤카림1·잭스1·카타리나2·케인1·릴리아1·녹턴1·람머스1·레넥톤2·렉사이1·리븐1·사미라2·사일러스1·오공1·트린다미어1·신짜오1·제드1=28) -->. 위키 최초의 아수라장 증강×스킬 적격 목록(§2). 단 `{{Editors needed}}`(미완성) 태그가 붙은 커뮤니티 실측이지 공식 데이터가 아님.
4. **패치 히스토리 전수 채굴로 챔피언×스킬×증강 명시 기록 43건 확보**(긍정 30 / 부정 13 — §3-2 표 말미의 로크 P 부정 1건 포함)<!-- 검증 수정(2026-09-03): §3-1 부정 12건 + §3-2의 부정 표기 로크 P 1건 = 부정 13, 긍정은 §3-2의 나머지 30건. 원문 "긍정 31 / 부정 12"는 자체 표 라벨과 불일치 --> — §3 표. 09 스터디가 인용했던 ~10건 대비 4배 이상. 특히 V26.15에서 "Mercy's Strike는 **서포트 챔피언 전용**"이라는 챔피언 클래스 단위 적격 규칙이 버그픽스 문구로 처음 노출됨.
5. 26.17 아수라장 절 전문 확보(영문 위키 전사본 + 공식 KR 노트, §4) — 스킬 증강 관련은 Tripleshot 타겟팅 개선뿐, 신규 증강은 Ultra Hydra(궁극의 히드라)·Upgrade Death's Dance(죽음의 무도 업그레이드) 2종(둘 다 아이템 증강). **26.18은 2026-09-03 현재 위키 V26.18 문서(404/missing)·공식 노트(404) 모두 미발행.**

---

## 1. 위키의 스킬 증강 문서화 현황 (과제 1)

| 확인 항목 | 결과 | 근거 |
|---|---|---|
| 스킬 증강 개별 문서(15종 표본) | **전부 없음**(missing, 리다이렉트 없음) | api.php titles 일괄 조회: Multishot, Tripleshot, Spell Split, Echo Cast, Siphon, Terror, BONK!, Pursuit of Haste, Pursuit of Power, Quickstep, Chain Reaction, Overloaded, Pin Cushion, Mercy's Strike, Ravenous Bind |
| Module: 네임스페이스 전수(687페이지, continuation 포함) | Mayhem 관련 모듈은 `MayhemAugmentData`(+/data, /data/doc, /doc)뿐. **스킬 매핑 신규 모듈 없음** | https://wiki.leagueoflegends.com/en-us/api.php?action=query&list=allpages&apnamespace=828 |
| Module:MayhemAugmentData/data 필드 | **여전히 4종**: description 225 / tier 225 / notes 29 / questinfo 4. 총 225항목(변동 없음). 최종 편집 2026-09-02T02:16Z | ?action=raw + prop=revisions |
| Module:MayhemAugmentData/data/doc | 스키마 문서에 description/tier만 안내 — eligibility 필드 계획 흔적 없음 | ?action=raw |
| ARAM: Mayhem/Augments 페이지 | 구조 그대로(`{{ARAM Mayhem augment table}}` = 모듈 렌더, Augment/Effect/Tier 3열). 적격 챔피언/스킬 표 절 없음. Notes 절은 Bread 3종 합체·화상 중첩 규칙 등만 | ?action=raw |
| ARAM: Mayhem 본문 | 스킬 증강 관련 신규 절 없음. 진행 트랙 레벨 9 문구 동일("Gain a higher chance of being offered an augment that upgrades one of your champion's abilities.") | ?action=raw |
| ARAM: Mayhem/Patch history 서브페이지 | 존재하나 `{{Outdated}}` 태그 — 최신 항목이 V26.12 시점에서 멈춤(그 이전 V25.21~V26.06 위주). V26.12 이후 채굴 가치는 본 패치 전사본이 대체 | https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Patch_history?action=raw |

### 1-1. 데이터 모듈 notes에서 나온 챔피언 단위 기록(전수 — ci/ai 템플릿·"offered" 검색 히트 10항목 중 매핑 가치가 있는 것)

| 증강 | 기록 | 성격 |
|---|---|---|
| Dashing | "On {{ci|Kalista}}, this augment instead grants her 125% bonus attack speed." | 칼리스타 챔피언 단위 효과 치환(긍정 — 칼리스타도 대상) |
| Stuck in Here With Me | "On {{ci|Katarina}}, this augment will activate at the start of R channel." | 카타리나 R 발동 타이밍 특례(긍정) |
| Spin To Win | **Eligible Abilities 목록** — §2 | 챔피언×스킬 적격 목록 |
| Vampirism | Warmog's 보유 시 미제시 + Perseverance와 상호 배제(양방향 notes) | 아이템/증강 조건(현재 둘 다 비활성) |
| Draw Your Sword | Runaan's 보유 시 미제시(기존 확인 사항) | 아이템 조건 |
| Earthwake | 팀당 최대 2명 제시(기존 확인 사항) — notes가 아니라 **description 말미 문구**("only offered to up to 2 players on each team") | 인원 조건 |
| Droppybara | 팀당 최대 1명 + 현재 비활성 — notes가 아니라 **description 말미 문구** | 인원 조건 |

---

## 2. 신규 발굴: Spin To Win의 "Eligible Abilities" 챔피언×스킬 목록

출처: https://wiki.leagueoflegends.com/en-us/Module:MayhemAugmentData/data?action=raw 의 `["Spin To Win"]` notes (2026-09-03 fetch, 원문 그대로 파싱).

- 증강 개요: Spin To Win(실버) — "Your spinning abilities(회전 속성 스킬) deal 30% increased damage and have their cooldown reduced equivalent to 30 ability haste." **스킬 증강({e3a02eac} 플래그 30종)은 아니고** Dashing류의 카테고리형 증강이지만, "회전 스킬 보유"라는 챔피언 적격성이 있는 증강이라 매핑 가치가 큼.
- ⚠️ 주의: notes 앞머리에 `{{Editors needed|This note is not fully complete...|There are a lot of abilities that would not usually spin...}}` — **위키 편집자 실측·미완성 목록**이다. 공식 그라운드트루스 아님.

### 2-1. 확정 목록(Eligible Abilities로 등재된 것, 스킬 슬롯은 본 조사에서 스킬명→슬롯 대응)

| 챔피언 | 스킬 | 스킬명(원문) |
|---|---|---|
| 아리 | W, R | Fox-Fire, Spirit Rush |
| 아무무 | E | Tantrum |
| 암베사 | Q | Lacerate |
| 다리우스 | Q | Decimate |
| 드레이븐 | Q, E, R | Spinning Axe, Stand Aside, Whirling Death |
| 가렌 | E | Judgment |
| 헤카림 | Q | Rampage |
| 잭스 | E | Counter Strike |
| 카타리나 | P, R | Voracity, Death Lotus |
| 케인 | Q | Reaping Slash |
| 릴리아 | P | Blooming Blows |
| 녹턴 | P | Umbra Blades |
| 람머스 | Q | Powerball |
| 레넥톤 | Q, E | Cull the Meek, Slice and Dice |
| 렉사이 | Q | Queen's Wrath |
| 리븐 | Q | Broken Wings |
| 사미라 | W, R | Blade Whirl, Inferno Trigger |
| 사일러스 | P | Petricite Burst |
| 오공 | R | Cyclone |
| 트린다미어 | E | Spinning Slash |
| 신 짜오 | R | Crescent Guard |
| 제드 | E | Shadow Slash |

### 2-2. "Pending for test"(편집자 미검증 후보)

| 챔피언 | 스킬 | 스킬명 | 비고 |
|---|---|---|---|
| 아크샨 | Q, E | Avengerang, Heroic Swing | **아레나 시절 방증**: V25.07 Arena 절 "Akshan – Avengerang – Bug Fix: Can now benefit from the Spin to Win augment."(위키 전사본 원문) — 아레나에서는 Q 적격이 공식 확인됨. 아수라장 이식 여부만 미확인 |
| 릴리아 | W, E | Watch Out! Eep!, Swirlseed | |
| 포피 | R | Keeper's Verdict | |

- 참고: 패시브(카타리나 P, 릴리아 P, 녹턴 P, 사일러스 P)까지 목록에 포함 — "spinning abilities"가 스킬 슬롯을 가리지 않음을 시사.

---

## 3. 패치 히스토리 전수 채굴 — 챔피언×스킬×증강 명시 기록 (V26.12~V26.17, 공식 그라운드트루스)

방법: V26.12~V26.17 전사본 raw 전문에서 ARAM: Mayhem 절 + Hotfixes 절을 통독하고, `offered` / `Mayhem` / `(Q|W|E|R|P)` 패턴 교차 grep으로 누락 검증(전수). V26.13의 아수라장 버그픽스 3건에는 챔피언×스킬 언급 없음. V26.12·26.16·26.17에는 아수라장 관련 Hotfix 절 없음(V26.13 6/25 핫픽스=Neeko 표식, V26.15 7/29 핫픽스=Thresh E — 모두 증강 무관). 6/19 라이브 핫픽스(450+ 조합 제거)는 위키 전사본에 미기재(09 스터디의 IBTimes/X 출처가 유일).

- 해석 규약: **부정** = "제시되면 안 되는데 제시되던 버그 수정" → 그 조합은 시스템상 부적격(제외 목록에 반영 가능). **긍정** = "적격/작동해야 하는데 오작동하던 버그 수정" 또는 공식 예시 → 그 조합은 적격(존재 증명).
- 출처 URL(공통): https://wiki.leagueoflegends.com/en-us/V26.12 ~ /V26.17 (?action=raw 직접 확인)

### 3-1. 부정(제외) 기록 — 12건

| 챔피언 | 스킬 | 증강 | 긍정/부정 | 패치 | 원문(verbatim) |
|---|---|---|---|---|---|
| 야스오 | E | Pursuit of Haste(가속 추구) | 부정 | V26.14 | "Fixed a bug where Pursuit of Haste was offered to Yasuo E." |
| 스몰더 | (챔피언 단위) | Combusting Interest | 부정 | V26.14 | "Fixed a bug where Smolder could be offered Combusting Interest." |
| 카타리나 | E | Overloaded(과충전) | 부정 | V26.15 | "Fixed a bug where Overloaded could be offered to Katarina's (E) and Shaco's (E)." |
| 샤코 | E | Overloaded(과충전) | 부정 | V26.15 | (위와 동일 문장) |
| 아크샨 | E | Pursuit of Haste(가속 추구) | 부정 | V26.15 | "Fixed a bug where Pursuit of Haste and Pursuit of Power is offered to Akshan's (E)." |
| 아크샨 | E | Pursuit of Power(위력 추구) | 부정 | V26.15 | (위 문장 + 아래 문장 이중 기재) |
| 드레이븐 | Q | Pursuit of Power(위력 추구) | 부정 | V26.15 | "Fixed a bug where Pursuit of Power is offered to Akshan's (E), Draven's (Q), Illaoi's (E), and Malphite's (W)." |
| 일라오이 | E | Pursuit of Power(위력 추구) | 부정 | V26.15 | (동일 문장) |
| 말파이트 | W | Pursuit of Power(위력 추구) | 부정 | V26.15 | (동일 문장) |
| 아크샨 | E | Adaptive Ward/Warding Weapon(적응형 와드) | 부정 | V26.15 | "Fixed a bug where Warding Weapon could still be offered to Akshan's (E) in Mayhem." |
| 아크샨 | E | Trusty Weapon(믿음직한 무기) | 부정 | V26.15 | "Fixed a bug where Trusty Weapon could still be offered to Akshan's (E) in Mayhem." |
| 블라디미르 등 비서포터 전체 | (챔피언 클래스 단위) | Mercy's Strike(자비의 일격) | 부정 | V26.15 | "Fixed a bug where Mercy Strike could be offered to non-support champions in Mayhem like Vladimir." |

- **핵심 발견 1**: Mercy's Strike 문구는 "**서포트 챔피언에게만** 제시되는 것이 의도"임을 공식적으로 노출 — 스킬 증강에 챔피언 클래스 게이트가 실재한다는 최초의 패치노트 명문.
- **핵심 발견 2**: 아크샨 E(Heroic Swing)는 26.15 한 패치에서 **4종 증강**(가속 추구·위력 추구·적응형 와드·믿음직한 무기)에서 일괄 제외 — 특정 스킬이 스킬 증강 풀 전반에서 통째로 부적격 처리될 수 있음을 시사. "속성 태그 없는(임의 스킬) 증강"인 적응형 와드·믿음직한 무기조차 제외된 점이 중요(스킬 단위 블랙리스트의 존재 방증).

### 3-2. 긍정(적격/작동) 기록 — 30건 + 부정 1건(표 말미 로크 P)<!-- 검증 수정(2026-09-03): 표는 31행이나 마지막 로크 P 행이 부정 라벨 — 건수 표기를 표 내용과 일치시킴 -->

| 챔피언 | 스킬 | 증강 | 긍정/부정 | 패치 | 원문(verbatim) |
|---|---|---|---|---|---|
| 가렌 | E | Quickstep(날쌘걸음) | 긍정(공식 예시) | V26.12 | "For example: Quick Step – Casting your self-targeted AoE ability makes you dash forward (Yes, Garen E and Kennen R are very happy about this!)" |
| 케넨 | R | Quickstep(날쌘걸음) | 긍정(공식 예시) | V26.12 | (동일 문장) |
| 블리츠크랭크 | Q | Multishot(다중 공격) | 긍정(공식 예시) | V26.12 | "Want your Blitzcrank Q to fire three hooks after powering it up? Good luck escaping that!" |
| 마스터 이 | E | It's Go Time(출발할 시간) | 긍정 | V26.14 | "Fixed a bug where It's Go Time did not correctly grant bonus move speed with Master Yi's E, Ashe's Q, and Twitch's Q." |
| 애쉬 | Q | It's Go Time(출발할 시간) | 긍정 | V26.14 | (동일 문장) |
| 트위치 | Q | It's Go Time(출발할 시간) | 긍정 | V26.14 | (동일 문장) |
| 벨코즈 | Q | Skilled Sniper† | 긍정 | V26.15 | "Fixed a bug where Vel'Koz's (Q) first hit failed to trigger Skilled Sniper." |
| 벨코즈 | Q(분열) | Skilled Sniper† | 긍정 | V26.16 | "Fixed a bug where Skilled Sniper did not trigger on Vel'Koz's split Q." |
| 애니비아 | Q | Skilled Sniper† | 긍정 | V26.15 | "Fixed a bug where Anivia's (Q) failed to trigger Skilled Sniper when passing through units." |
| 로크(Locke) | Q | Skilled Sniper† | 긍정 | V26.15 | "Fixed a bug where Locke's (Q) received a refund in between ammo for Skilled Sniper." |
| 모르가나 | R | Echo Cast(메아리 시전) | 긍정 | V26.15 | "Fixed an issue where Morgana's (R) Echo cast always sends the clone towards the bottom of the screen." |
| 에코 | Q | Spell Split(주문 분산) | 긍정 | V26.15 | "Fixed a bug where Ekko's (Q) failed to split with Spell Split on missile end." |
| 니달리 | Q(인간) | Spell Split/Missile Split(주문 분산) | 긍정 | V26.15 | "Fixed a bug where Nidalee's human-form Javelin Toss (Q) did not trigger Missile Split in Mayhem if the augment was selected while in cougar form." |
| 밀리오 | W | Quest: Support Main† | 긍정 | V26.15 | "Fixed a bug where Milio's (W) did not grant Support Main quest progress in Mayhem when healing themself or allies." |
| 로크 | E(2단 대시) | Pursuit of Power·Pursuit of Haste | 긍정 | V26.15 | "Fixed a bug where Locke's (E) second dash did not grant Pursuit of Power or Pursuit of Haste quest progress in Mayhem." |
| 마스터 이 | Q | Dashing† | 긍정 | V26.15 | "Fixed a bug where Master Yi's (Q) and Viego's (R) could retain Dashing's Ability Haste in Mayhem after taking Pandora's Box." |
| 비에고 | R | Dashing† | 긍정 | V26.15 | (동일 문장) |
| 리 신 | Q | Dashing† | 긍정 | V26.16 | "Fixed a bug where Dashing did not apply to Lee Sin Q, Kled Q, and Rek'Sai E." |
| 클레드 | Q | Dashing† | 긍정 | V26.16 | (동일 문장) |
| 렉사이 | E | Dashing† | 긍정 | V26.16 | (동일 문장) |
| 베이가 | W | Archmage(대마법사)† | 긍정 | V26.16 | "Fixed a bug where Veigar's W in ARAM Mayhem did not trigger Archmage's cooldown refund effect." |
| 아지르 | W | Archmage(대마법사)† | 긍정 | V26.16 | "Fixed a bug where Archmage did not refund Azir (W) properly." |
| 블리츠크랭크 | E | Marksmage† | 긍정 | V26.16 | "Fixed a bug where Marksmage did not apply its damage to certain empowered attacks in Mayhem, including Blitzcrank (E), Nasus (Q), and Trundle (Q)." |
| 나서스 | Q | Marksmage† | 긍정 | V26.16 | (동일 문장) |
| 트런들 | Q | Marksmage† | 긍정 | V26.16 | (동일 문장) |
| 애니 | R | Ultimate Revolution† | 긍정 | V26.16 | "Fixed a bug where Annie's (R) would go on cooldown if the first Tibbers died when having Ultimate Revolution." |
| 볼리베어 | R | Echo Cast(메아리 시전) | 긍정 | V26.16 | "Fixed a bug where Volibear (R)'s turret-disabling debuff applied by the Echo Cast version visually refreshes while the duration does not." |
| 벨베스 | E | Dropkick† | 긍정 | V26.16 | "Fixed a bug where Bel'Veth (E) fails to trigger Drop Kick's execution." |
| 모르데카이저 | R | Stuck in Here With Me† | 긍정(타이밍 수정) | V26.17 | "Fixed a bug where Stuck in Here With Me triggers after Mordekaiser's (R) ended." |
| 사이온 | (사망 형태) | Squishy Slappy Grab† | 긍정(상호작용) | V26.17 | "Fixed a bug where Squishy Slappy Grab triggered immediately after Sion died instead of refreshing after 35 seconds." |
| 로크 | P | Pursuit of Power(위력 추구) | 부정(효과 오적용 — P는 비대상) | V26.16 | "Fixed a bug where Pursuit of Power affected Locke (P) damage after its quest was completed." |

- † 표기: {e3a02eac} 스킬 증강 플래그 30종(스터디 10)에 속하지 않는 일반/카테고리 증강이지만, 스킬 단위 연동이 명시된 기록이라 함께 수집(추천 엔진의 챔피언×증강 시너지 데이터로 동일하게 사용 가능). 무표기는 스킬 증강 본류.
- 참고(비매핑): V26.15에는 아수라장 챔피언 단위 밸런스 표(아리~직스 30종 내외의 피해/힐 모디파이어 정규화)도 있음 — 증강 매핑은 아니라 본 표에서 제외.
- 참고(아레나 절 혼동 주의): V26.12의 "Trickster Demon…Jhin's Lotus Trap (E)", "Dashing…retaining Ability Haste" 등 유사 문구는 **Arena 절** 소속이라 제외했다(전수 grep 시 절 경계 확인 완료).

---

## 4. 26.17·26.18 패치노트 아수라장 절 (과제 3)

### 4-1. V26.17 (2026-08-25 배포 — 공식 노트 명기) — 위키 전사본 전문

출처: https://wiki.leagueoflegends.com/en-us/V26.17?action=raw / 공식(요약 경유): https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-17-notes/ (도입부 "we're continuing to focus on the fighter experience")

```
=== ARAM: Mayhem ===
* Augments
** Critical Missile
*** Missile Amount: 1 / 2 / 3 / 4 based on crit chance ⇒ 1 / 2 / 3 based on crit chance
** Double Tap
*** Tier: Gold ⇒ Prismatic
** Tripleshot
*** Targeting: Now prioritizes enemies nearby the main target
** Ultra Hydra
*** New Effect: Gain a Tiamat when completing a Hydra Item
*** New Quest: Gain Ravenous Hydra, Profane Hydra and Titanic Hydra
*** New Reward: Gain Ultra Hydra
** Upgrade Death's Dance
*** New Effect: Gain 250 Gold. 40%/15% of damage taken is dealt to you over 3 seconds. Heal 125% bonus AD instantly when scoring a takedown.
** Upgrade Infinity Edge
*** Critical Strike Chance: Removed
** Upgrade Ravenous
*** Effect: Cleave effect also trigger on minions
*** Life Steal on Ravenous Hydra: 18% ⇒ 20%
* Bugfixes
** Fixed a bug where Squishy Slappy Grab triggered immediately after Sion died instead of refreshing after 35 seconds.
** Fixed a bug where Stuck in Here With Me triggers after Mordekaiser's (R) ended.
** Fixed a bug where Echo Cast clone will cast spells in the wrong direction after reconnecting.
** Fixed a bug where Archmage put ammo spells on cooldown when casting other spells.
** Fixed a bug where teammates' burn and damage over time also grant Gold after Blood Money Burn triggers.
** Fixed a bug where High Roller failed to trigger on certain champions.
```

- 스킬 증강 관련 요점: 신규 스킬 증강 없음. Tripleshot(3연발) 타겟팅 개선, Echo Cast 재접속 버그·Archmage 탄환 스킬 버그 수정. 신규 증강 2종(Ultra Hydra, Upgrade Death's Dance)은 아이템 계열.
- 한국어 공식 노트 대응(요약 경유, https://www.leagueoflegends.com/ko-kr/news/game-updates/league-of-legends-patch-26-17-notes/ ): 치명적 미사일(Critical Missile), **한 발에 두 놈**(Double Tap, 골드→프리즘), 3연발(Tripleshot, "주 대상 주변의 적을 우선합니다"), **궁극의 히드라**(Ultra Hydra), **죽음의 무도 업그레이드**, **무한의 대검 업그레이드**, **굶주린 히드라 업그레이드**. (KR 페이지에는 버그 수정 목록이 실리지 않음 — 요약 경유 확인)

### 4-2. V26.18 — 미발행 (2026-09-03 현재)

- 위키: `V26.18` 문서 없음(api.php titles 조회 missing, ?action=raw 404). V26.19·V26.S3.1도 없음.
- 공식: https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-18-notes/ → HTTP 404.
- 결론: 오늘 기준 라이브는 26.17이며 26.18 노트는 아직 공개 전. 발행 시 §3 규약대로 아수라장 절 버그픽스를 재채굴할 것.

---

## 5. 이 광맥이 주는 시스템 지식(스터디 09·10 결론에의 증분)

1. **스킬 단위 블랙리스트 실재**: 아크샨 E가 "임의 스킬" 계열 증강(적응형 와드·믿음직한 무기)에서까지 제외된 것은, 속성 태그 매칭과 별개로 **스킬 단위 제외 목록**이 서버에 있음을 뜻한다(10 스터디의 태그-매칭 가설 보완).
2. **챔피언 클래스 게이트 실재**: Mercy's Strike "non-support champions… like Vladimir" 문구 — 스킬 증강에도 챔피언 클래스(서포터) 조건이 걸린 사례. LCU roles 데이터와 결합 시 시뮬레이터 필터에 즉시 적용 가능.
3. **긍정 기록의 가치**: 버그픽스의 "X's (S) did not work with A" 문구는 그 조합이 **적격 풀에 실제로 존재**한다는 공식 증명이다(예: 모르가나 R×메아리 시전, 에코 Q×주문 분산, 니달리 인간 Q×주문 분산, 케넨 R×날쌘걸음).
4. **위키의 방향성**: 구조화 필드 대신 notes 자유 텍스트에 실측 목록이 자라는 중(Spin To Win이 첫 사례). 향후 다른 증강 항목에도 유사 목록이 붙는지 Module:MayhemAugmentData/data 리비전을 주기 감시할 가치가 있음(최종 편집 2026-09-02 — 활발).

---

## 6. 미확인 / 한계

- Spin To Win Eligible Abilities는 위키 편집자 실측(`{{Editors needed}}` 미완성 명시) — 공식 확인 아님. "Pending for test" 5스킬은 미검증.
- Spin To Win의 아수라장 추가 시점: V26.12 신규 목록·26.13~26.17 노트 어디에도 없음(아레나에는 V25.07 이전부터 존재). 이식/활성 경위 미확인.
- 6/19 라이브 핫픽스(450+ 조합 제거)의 구체 목록: 위키 전사본에도 없음(기존 결론 유지 — 비공개).
- 부정 기록은 "그 조합이 부적격"까지만 말한다. 같은 챔피언의 다른 스킬 적격 여부(예: 야스오 Q에 가속 추구가 붙는지)는 어떤 기록에도 없음.
- WebFetch 경유 인용(공식 26.17 EN 도입부·KR 전문)은 요약 모델을 거침 — 자구 오차 가능. 위키 자료는 전부 raw 직접 확인.
- V26.15 아수라장 절의 챔피언 밸런스 정규화(30종 내외)는 본 문서 범위 밖 — 필요 시 별도 채굴.

---

## 7. 출처 목록 (2026-09-03 직접 fetch, 별도 표시 없으면 raw 원문)

**위키 (CC BY-SA 3.0)**
- 패치 전사본 — https://wiki.leagueoflegends.com/en-us/V26.12?action=raw (V26.13/V26.14/V26.15/V26.16/V26.17 동일 형식; V26.18은 404)
- V25.07(아레나 Spin to Win 방증) — https://wiki.leagueoflegends.com/en-us/V25.07?action=raw
- Module:MayhemAugmentData/data — https://wiki.leagueoflegends.com/en-us/Module:MayhemAugmentData/data?action=raw (+ /doc, prop=revisions 편집 이력)
- ARAM: Mayhem — https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem?action=raw
- ARAM: Mayhem/Augments — https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Augments?action=raw
- ARAM: Mayhem/Patch history — https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Patch_history?action=raw
- 모듈 네임스페이스 전수·문서 존재 조회 — https://wiki.leagueoflegends.com/en-us/api.php (list=allpages&apnamespace=828, titles=…, list=search)

**라이엇 공식 (WebFetch 요약 경유)**
- 패치 노트 26.17 (영) — https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-17-notes/ (배포일 2026-08-25 명기)
- 패치 노트 26.17 (한) — https://www.leagueoflegends.com/ko-kr/news/game-updates/league-of-legends-patch-26-17-notes/
- 패치 노트 26.18 (영) — 404 확인
