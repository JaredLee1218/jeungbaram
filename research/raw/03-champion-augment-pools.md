# 챔피언별 증강 등장 규칙 조사 — "각 챔피언에게 어떤 증강이 뜰 수 있는가"

- 조사일: 2026-09-02 (현재 라이브 패치 26.17)
- 대상 모드: **칼바람 아수라장 / ARAM: Mayhem** (한국 공식 명칭: "무작위 총력전: 아수라장", 커뮤니티 통칭 "증강 칼바람/증바람"). V25.21(2025-10 말)에 별도 큐로 라이브 출시. 비교 대상: **아레나(Arena)**.
- 주의: WebFetch 결과 일부는 요약 모델을 거친 것이므로, 원문 인용은 가능한 한 위키 원본 데이터(직접 다운로드한 wikitext/Lua)에서 확인한 것을 우선했다. 확인 불가한 것은 "미확인"으로 표시.
- **독립 검증(2026-09-02, 별도 검증자)**: 핵심 결론 1·4(챔피언별 필터링, Optimal/Viable/Average/Invalid 4단계·1D 배열·풀 196→300+), §1 공통 규칙(전원 동일 티어/실버 중복 금지/증강 1회 제시/레벨 3·7·11·15/진행 트랙 L1 골든 리롤·L9 스킬 증강 확률 증가), eligibility 표본(Draw Your Sword 원거리+루난, Earthwake 팀당 2명, Droppybara 팀당 1명, Overextender 도살자의 다리, Chain Reaction 넉백, Tripleshot 대상지정+미사일, Spin To Win 회전, Vampirism 워모그 제한·비활성)을 원 조사와 다른 소스(라이엇 공식 X 게시물 https://x.com/LeagueOfLegends/status/2067653613686600185 , IBTimes, Inven Global 원문 재조회, aramgg.com, arammayhem.com, u.gg)로 재확인 완료. 틀린 내용은 발견되지 않음. 재확인 실패분은 본문에 "⚠️ 미검증" 표시.

---

## 0. 핵심 결론 요약

1. **증강 풀은 전 챔피언 공통이 아니다.** 라이엇이 공식적으로 "증강 드로우 풀은 플레이어가 보기 전에 챔피언별로 필터링된다(Ability Augments are filtered to each player's champion before entering the draw pool)"고 밝혔다. 특히 26.12에 추가된 **스킬 증강(Ability Augments)은 해당 스킬 특성(미사일 보유, 넉백 보유, 대상 지정형 미사일, '회전' 스킬 등)을 가진 챔피언에게만 제시**된다.
2. 범용(스탯/효과형) 증강은 대부분 전 챔피언 공통이지만, **소수의 명시적 제한**이 있다: 원거리 전용(Draw Your Sword), 아이템 보유 시 제외(워모그→Vampirism 제외, 루난→Draw Your Sword 제외), 증강 상호배제(Vampirism↔Perseverance), 팀당 인원 제한(Earthwake 2명/Droppybara 1명), 맵 한정(Overextender=도살자의 다리 전용).
3. **아수라장에는 "특정 챔피언 전용" 증강이 (위키 문서 기준) 현재 없다**. 반면 **아레나에는 챔피언 전용 증강**(쉬바나·드레이븐·사일러스·자헨·유나라 등)과 **챔피언별 제외 목록**(AD/AP/마나/이동기/CC/포킹/궁극기 유무별 예외 리스트)이 공식 위키에 문서화되어 있다. 아수라장의 필터링 시스템은 아레나의 eligibility 개념을 계승·확장한 것이다.
4. **등장 확률/가중치**: 정확한 수치는 비공개. 다만 라이엇 개발자 인터뷰(Inven Global, 2026-08-24)에서 **챔피언별로 증강을 Optimal(드묾)/Viable/Average(자주)/Invalid(완전 제외) 4단계로 분류해 제시 빈도를 다르게 한다**고 확인했다. 또 진행 트랙(Mayhem Progression Track) 레벨 9 보상이 "**자기 챔피언 스킬을 강화하는 증강이 더 잘 나오게**" 하는 가중치 보상임이 공식 위키에 명시되어 있다.

---

## 1. 아수라장 증강 제공 방식(공통 규칙) — 공식 위키 기준

출처: https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem (원문 wikitext 직접 다운로드로 확인)

- 증강 선택 화면은 레벨 3(게임 시작)/7/11/15에 총 4회 제공. 화면당 3개 선택지.
- **"Every player is offered the same tier of augments in each selection screen; the tier itself is random each time."** — 같은 선택 라운드에서는 10명 전원이 같은 희귀도(실버/골드/프리즘)를 받고, 티어 자체는 매번 무작위.
- 1·2번째 선택 화면이 **둘 다 실버일 수는 없다**(명시된 유일한 티어 제약).
- **"Augments are offered only once; once an augment appears in a selection screen, it is not offered again in future ones."** — 한 번 선택지에 등장한 증강은 그 게임에서 다시 제시되지 않음(아레나와 다른 점).
- 리롤: 선택지당 1회(최대 6개 후보). 진행 트랙 레벨 1 달성 시 **골든 리롤**(실버/골드 선택에서 한 단계 높은 티어의 증강으로 교체) 확률 획득.
- 선택 화면은 상점 이용 가능 상태(사망 중이거나 우물)에서만 열림.

### 위키(Module:MayhemAugmentData/data)에 명시된 개별 증강의 등장 조건

출처: https://wiki.leagueoflegends.com/en-us/Module:MayhemAugmentData/data (Lua 원본 직접 다운로드, 총 225개 등재: 실버 64/골드 85/프리즘 76, 이 중 11개 "currently disabled")
목록 페이지: https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Augments

| 증강 | 조건/제한 (위키 원문) |
|---|---|
| **Draw Your Sword** (프리즘) | "This augment is only available for ranged champions." — **원거리 챔피언 전용**. 노트: "This augment is not offered if the champion has built Runaan's Hurricane." — **루난의 허리케인 보유 시 미제시** |
| **Vampirism** (골드, 현재 비활성) | "This augment is not offered if the champion has built Warmog's Armor." — **워모그 보유 시 미제시**. "This augment prevents the user from being offered the Perseverance augment." — **Perseverance와 상호배제** ⚠️ 미검증: 상호배제 노트는 독립 소스(arammayhem.com/augments/vampirism, 2026-09-02 조회)에서 재확인 실패 — 위키 Lua 원문에만 존재. 워모그 제한은 재확인됨. 참고: arammayhem.com은 Vampirism이 **26.17 패치에서 제거**되었다고 표기(비활성 시점 구체화) |
| **Perseverance** (골드, 현재 비활성) | "This augment prevents the user from being offered the Vampirism augment." |
| **Earthwake** (프리즘) | "This augment is only offered to up to 2 players on each team for a given game." — **팀당 최대 2명에게만 제시** |
| **Droppybara** (프리즘, 현재 비활성) | "This augment is only offered to up to 1 player on each team for a given game." — **팀당 최대 1명** |
| **Overextender** (골드) | "This augment is only available on the Butcher's Bridge map." — **도살자의 다리(칼바람 변형 맵) 전용** |
| **Dashing** (프리즘) | 대시/점멸 스킬에 175 스킬 가속. 노트: "**On Kalista, this augment instead grants her 125% bonus attack speed.**" — 칼리스타는 효과가 공속 125%로 **대체**됨(제외가 아니라 챔피언별 효과 치환; 출처 표기는 bilibili 실측 영상) |
| **Spin To Win** (실버) | "Your spinning abilities…" — **'회전' 속성 스킬 보유 챔피언에게만 의미**. 위키 노트에 **적격 스킬 목록** 명시: 아리(여우불·혼령 질주), 아무무(성질부리기), 암베사(난도질), 다리우스(대학살), 드레이븐(회전 도끼·비켜라·죽음의 소용돌이), 가렌(심판), 헤카림(습격), 잭스(반격), 카타리나(탐욕·죽음의 연꽃), 케인(수확의 일격), 릴리아(만개한 일격), 녹턴(그림자 칼날), 람머스(파워볼), 레넥톤(약자 사냥·썰고 토막내기), 렉사이(여왕의 진노), 리븐(부러진 날개), 사미라(칼날 소용돌이·지옥불 폭격), 사일러스(파열의 일격), 오공(회오리 공격), 트린다미어(회전베기), 신 짜오(초승달 베기), 제드(그림자 베기) + 검증 대기(Pending for test): 아크샨, 릴리아 E, 뽀삐 R 등 |
| 소환사 주문 대체형 (Biggest Snowball Ever, Flashbang, Flashy 등) | "If Mark is not equipped, you will be prompted to replace one of your summoner spells with Mark." — 표식 미보유 시 **교체 프롬프트**가 뜨므로 사실상 전 챔피언 제공(제한 아님) |

### 스킬 증강(Ability Augments)의 스킬 특성 기반 조건 (26.12 추가분, 위키 모듈 등재 원문)

- **Chain Reaction** (골드): "Upgrades one of your champion's abilities **that has a knock back effect**…" — 넉백 스킬 보유 필요
- **Spell Split** (프리즘): "Upgrades one of your champion's abilities **that has a missile**…" — 미사일(투사체) 스킬 필요
- **Tripleshot** (프리즘): "Upgrades one of your champion's abilities **that is unit-targeted and fires a missile**…" — 대상 지정+투사체 스킬 필요
- **Multishot / Pursuit of Haste / Pursuit of Power** (퀘스트형): "hit enemy champions with a specific ability('s missile)…" — 특정 스킬(투사체) 지정형
- **Siphon** (실버) / **Echo Cast** (프리즘) / **Snap Back** (내부 데이터에만 존재, 비활성 추정): "Upgrades one of your champion's abilities…" — 챔피언의 특정 스킬 하나를 지정해 강화
- **Bread And Butter/Jam/Cheese** (골드): Q/W/E 스킬에 100 스킬 가속 — 전 챔피언 공통(스킬 슬롯 기준)

> 정리: 위키의 일반 증강 225개 중 **명문화된 챔피언 조건은 소수**(원거리 전용 1종, 아이템 조건 2종, 팀 인원 제한 2종, 맵 한정 1종, 챔피언별 효과 치환 1종)이고, **스킬 증강 계열은 스킬 속성(투사체/넉백/대상지정/회전)에 의해 챔피언별로 필터링**된다.

---

## 2. "챔피언별 필터링"에 대한 공식(개발자) 확인

### 2-1. 26.12 개편: 스킬 증강은 "쓸 수 있는 챔피언에게만" 제시

- /dev: Augmentmaxxing ARAM: Mayhem (Riot Phlox, 2026-05-27): https://www.leagueoflegends.com/en-us/news/dev/dev-augmentmaxxing-aram-mayhem/
  - 원문(직접 다운로드로 확인): "Ability Augments are those that significantly enhance a single ability for a champion, providing the opportunity for a gameplay experience completely different from that of the champion originally." / Multishot 예시: "If you get this on Lux's Q, you can snare the entire enemy team in one Light Binding!"
  - 클래스 단위 밸런싱 언급: "if we find that melee champs are hard to find success with…, we'll take a look at the amount of movespeed being offered by Augments" / "adding new Augments, that way we can support classes of champions that feel underserved by the current Augment offering."
- esports.gg 26.12 가이드: "Ability Augments latch onto one of your champion's abilities and enhance it, and **you will only ever be offered ones that actually work on your champ**." — https://esports.gg/guides/league-of-legends/aram-mayhem-augments-26-12/ (직접 fetch는 403, 검색 스니펫 기준)

### 2-2. 26.12 핫픽스(2026-06-19): 450개+ 스킬 증강 조합 제거 — "필터링된 풀"과 "죽은 드로우"

- esports.gg: "Riot removes 450+ 'un-fun' Ability Augments from ARAM Mayhem" — https://esports.gg/news/league-of-legends/riot-removes-450-ability-augments/ (403, 스니펫 기준)
- IBTimes: https://www.ibtimes.com/league-legends-aram-mayhem-cuts-over-450-ability-augments-live-hotfix-3804331
  - "**Ability Augments are filtered to each player's champion before entering the draw pool.**" (드로우 풀이 챔피언별로 필터링됨을 명시)
  - 제거 이유: 챔피언 킷과 의미 있게 상호작용하지 않는 조합은 "**dead draws**"(범용 증강보다도 가치가 낮은 선택지)가 되기 때문. 예시로 다수 스킬에서 작동하지 않던 Pursuit of Haste, 루시안 돌진 같은 무의미한 스킬에 붙은 Echo Cast가 거론됨(검색 스니펫).
  - 발표: 라이엇 공식 계정/개발자 (X @ed_corte 게시물: https://x.com/ed_corte/status/2067698024776867879 , 공식 Threads: https://www.threads.com/@leagueoflegends/post/DZvB_H4iAKW ). IBTimes 요약 기준 발표자는 Eduardo "Riot Cadmus" Cortejoso(2026-06-19, 클라이언트 업데이트 없는 라이브 핫픽스) — 요약 모델 경유라 인명 표기는 미세 오류 가능성 있음.
- TechTimes 동일 보도(403): https://www.techtimes.com/articles/318717/20260619/league-legends-aram-mayhem-cuts-over-450-ability-augments-live-hotfix.htm

### 2-3. 26.13(2026-06-23): 적격성(eligibility) 개선

- arammayhem.com 패치 노트 정리: "**Ability Augments should now appear on spells that actually benefit each champion**" + 크리티컬 관련·후반 슬롯 스킬 증강 등장률 버그 수정 — https://arammayhem.com/patch-notes/ (팬사이트)
- 26.15(2026-07-28): 챔피언별 힐/실드/피해 예외(모드 전용 챔피언 보정) 다수 제거, "invalid offers" 관련 버그 수정 포함 21건 — 같은 출처.

### 2-4. 개발자 인터뷰: 챔피언별 1D 배열과 4단계 제시 빈도 분류

- Inven Global, "LoL 'ARAM: Mayhem' Reveals the Secrets of Augment Development" (2026-08-24, Riot 시니어 게임 디자이너 Noor Amin): https://www.invenglobal.com/articles/25082/lol-aram-mayhem-reveals-the-secrets-of-augment-development
  - "**they built a 1D array categorizing the number of available Augments per champion**" — 챔피언마다 사용 가능한 증강 수를 배열로 관리, 소외된 클래스용 전용 증강 제작.
  - 제시 빈도 4분류: "**'Optimal' Augments are rare options that create thrilling power moments; 'Viable' Augments appear often but aren't optimal; 'Average' Augments are frequently offered, solid options; and 'Invalid' Augments are unusable options filtered out completely from specific champion class pools.**" — 즉 **챔피언(클래스)별로 증강마다 등장 가중치 등급이 있고, Invalid는 아예 풀에서 제외**.
  - 증강 풀 규모: "the Augment pool grew from **196 at release to slightly over 300** today." (위키 모듈 등재 225개와 차이가 있음 — 스킬 증강의 챔피언별 변형/미문서화분 때문으로 추정, 미확인)

### 2-5. 특성(Trait) 시스템 — 있었다가 제거됨

- 아수라장 출시 시기엔 증강에 특성(세트) 시스템이 있었으나 **26.12에서 제거**: 위키 패치 히스토리 "V26.12 — Removed: Augment Trait System was removed. Added Ability and Quest Augments" — https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Patch_history
- 제거 이유(공식): 빌드 획일화(Homogenized Builds/Game Experience), 특성이 챔피언을 가림(Traits Outshined Champions), 개별 증강의 약화 — /dev Augmentmaxxing. Hotspawn 보도(2026-05-28): https://www.hotspawn.com/league-of-legends/news/aram-mayhem-is-getting-rid-of-traits
- 한국 보도: 게임플 "특성 제거, 챔피언 집중...확 바뀐 '증강 칼바람' 사전 체험기" — https://www.gameple.co.kr/news/articleView.html?idxno=215744 (26.12를 6/10 패치로 표기; 스킬 증강 카드에 챔피언 초상화+스킬 아이콘 표시, CC 스킬 연동 증강(빅토르 W·레넥톤 W 예시), 퀘스트 증강의 2단계 성장 구조 등)

---

## 3. 특정 챔피언 전용 / 특정 챔피언에게 안 뜨는 증강

### 3-1. 칼바람 아수라장 (Mayhem)

- **챔피언 전용 증강: 위키 문서 기준 현재 없음.** 다른 챔피언의 스킬을 주는 증강(Clown College=샤코 킷, Phenomenal Evil=베이가 패시브, Spin Me Right Round=아크샨 E 등)은 **모든 챔피언에게 등장 가능**한 범용 증강이다.
- 사실상의 챔피언 종속: **스킬 증강**은 킷 특성 필터로 인해 챔피언마다 등장 목록이 다르다(§1, §2). 커뮤니티 팬사이트 arammayhem.com의 증강별 통계에서도 챔피언별 편중이 실측된다(예: Mind to Matter 통계에 마나 챔피언만 등장).
- **안 뜨는 조건 정리(위키 명문화분)**: 근거리 챔피언→Draw Your Sword 불가 / 루난 보유→Draw Your Sword 제외 / 워모그 보유→Vampirism 제외 / Perseverance↔Vampirism 상호배제 / Earthwake 팀당 2명·Droppybara 팀당 1명 초과분 / 하울링 어비스(기본 맵)에서는 Overextender 없음(도살자의 다리 전용).
- **마나 증강(Mind to Matter, Overflow, Juiced 등)이 마나 없는 챔피언에게 뜨는지**: 아수라장 위키에는 명문화되어 있지 않음(아레나에는 명문화, §3-2). 팬사이트 arammayhem.com은 Mind to Matter를 "마나 없는 챔피언은 받을 수 없다"고 기술하고, 실측 통계도 마나 챔피언만 표시(https://arammayhem.com/augments/mind-to-matter/) — **정황상 아수라장도 동일하나 공식 문서로는 미확인**.
- **개인(계정)별 풀 차이**: 진행 트랙 보상으로 해금되는 증강들이 있어, 트랙 레벨에 따라 개인 풀이 다르다 — "Pat on the Back"(2), "Forged by the Master"(4), "Shark Bait"(6), "Hellbent"(8), "Shark Tempest"(10), "Spirit Bomb"(12) 등 (ARAM: Mayhem 위키, 원문 확인).
- 26.12 핫픽스로 **Quest: Support Main, Void Dash, Pat On The Back 일시 비활성** + 서포터/원딜 풀 조정(arammayhem.com 패치 노트). 위키 모듈 기준 현재 11종 "currently disabled"(Adamant, Vampirism, Perseverance, Droppybara, Clown College, 티모 계약 증강 등).

### 3-2. 아레나 (Arena) — 공식 위키에 문서화된 전용/제외 규칙

출처: https://wiki.leagueoflegends.com/en-us/Arena (원문 wikitext 직접 다운로드), https://wiki.leagueoflegends.com/en-us/Module:ArenaAugmentData/data (257개 등재)

**챔피언 전용 증강(위키 원문 "This augment is only available for {챔피언}"):**
- **Big Dragon Energy** — 쉬바나 전용 (나무위키: "거대한 용의 기운"). 독립 재확인: u.gg 보도 "Shyvana Gets the First Exclusive Augment in League of Legends Arena"(26.6 패치, 아레나 **최초의 챔피언 전용 증강**) — https://u.gg/lol/news/shyvana-gets-the-first-exclusive-augment-in-league-of-legends-arena
- **Blood Brother** — 드레이븐 전용(다리우스의 출혈 패시브를 얻는 이스터에그성 증강) (나무위키: "피를 나눈 형제")
- **Unshackled** — 사일러스 전용(아군에게 R 사용 가능) (나무위키: "해방")
- **Undying Guard** — 자헨 전용 (나무위키: "불멸의 경계")
- **Quest: Steel Your Heart** — 유나라 전용 + "can only be offered during the first two rounds where Augment selection is available"(첫 두 증강 라운드에만 제시) (나무위키: "퀘스트: 삼종신기"). ※ 아수라장의 동명 증강은 심장강철 아이템 퀘스트로 전혀 다른 범용 증강임(위키 모듈 확인).
- 나무위키 추가 기재: **진 전용 "천천히, 꾸준히"(버그로 현재 등장 안 함)**, **갱플랭크 전용 "노련한 저격수"** — 영문명 대응 미확인(위키 Lua 데이터에서 미발견; 나무위키 https://namu.wiki/w/리그%20오브%20레전드/증강 fetch 결과 기준)

**챔피언별 제외 목록("Augment Exceptions" 섹션, ※ V13.17 이후 갱신 안 됨 표기):**
아레나 위키 원문: "**Certain champions cannot receive augments with a specific stat or trait.**"

| 예외 범주 | 해당 증강 | 제외(또는 한정) 챔피언 수 | 챔피언 |
|---|---|---|---|
| **AD 스탯 예외** | The Brutalizer, Lightning Strikes, Blunt Force | 72명 제외 | Ahri, Alistar, Amumu, Anivia, Annie, Aurelion Sol, Azir, Bard, Brand, Braum, Cassiopeia, Cho'Gath, Diana, Ekko, Elise, Evelynn, Fiddlesticks, Fizz, Galio, Gwen, Heimerdinger, Hwei, Ivern, Janna, Karma, Karthus, Kassadin, LeBlanc, Leona, Lillia, Lissandra, Lulu, Lux, Malphite, Malzahar, Maokai, Milio, Mordekaiser, Morgana, Nami, Nautilus, Nunu, Orianna, Ornn, Rakan, Rammus, Rell, Renata Glasc, Rumble, Ryze, Sejuani, Seraphine, Singed, Sona, Soraka, Swain, Sylas, Syndra, Tahm Kench, Taliyah, Veigar, Vel'Koz, Vex, Viktor, Vladimir, Xerath, Yuumi, Zac, Ziggs, Zilean, Zoe, Zyra |
| **AP 스탯 예외** | Witchful Thinking, Phenomenal Evil, Eureka | 49명 제외 | Bel'Veth, Caitlyn, Camille, Darius, Draven, Dr. Mundo, Fiora, Gangplank, Garen, Gnar, Graves, Hecarim, Illaoi, Jayce, Jhin, Jinx, Kai'Sa, Kalista, Kayn, Kha'Zix, Kindred, Kled, K'Sante, Lee Sin, Naafiri, Nilah, Nocturne, Olaf, Ornn, Poppy, Pyke, Qiyana, Quinn, Rek'Sai, Renekton, Riven, Samira, Sett, Sion, Sivir, Talon, Trundle, Urgot, Vayne, Vi, Viego, Yone, Yorick, Zed |
| **마나 스탯 예외** | Mind to Matter | 26명 제외(마나 미보유/기력 등) | Aatrox, Akali, Bel'Veth, Dr. Mundo, Garen, Gnar, Katarina, Kennen, Kled, Lee Sin, Mordekaiser, Rek'Sai, Renekton, Rengar, Riven, Rumble, Sett, Shen, Shyvana, Tryndamere, Viego, Vladimir, Yasuo, Yone, Zac, Zed |
| **속박(Immobilize) 계열 예외** | Guilty Pleasure, Tormentor, Courage of the Colossus | 37명 제외(하드 CC 없는 챔피언) | Akali, Akshan, Corki, Dr. Mundo, Ezreal, Fiora, Gangplank, Garen, Graves, Gwen, Illaoi, Kai'Sa, Karthus, Kassadin, Katarina, Kayle, Kha'Zix, Kindred, Kog'Maw, Lucian, Master Yi, Miss Fortune, Naafiri, Nasus, Olaf, Rumble, Shyvana, Sivir, Talon, Teemo, Tryndamere, Twitch, Vladimir, Yorick, Yuumi, Zed, Zeri |
| **대시/점멸 계열 예외** | Earthwake, Outlaw's Grit, Shadow Runner, Dashing, Now You See Me | 73명 제외(이동기 없는 챔피언) | Anivia, Annie, Aphelios, Ashe, Blitzcrank, Brand, Cassiopeia, Cho'Gath, Darius, Draven, Dr. Mundo, Gangplank, Garen, Heimerdinger, Hwei, Ivern, Janna, Jhin, Jinx, Karma, Karthus, Kayle, Kog'Maw, Lillia, Lulu, Lux, Malzahar, Milio, Miss Fortune, Mordekaiser, Morgana, Nami, Nasus, Nautilus, Nunu, Olaf, Orianna, Renata Glasc, Rumble, Ryze, Senna, Seraphine, Singed, Sion, Sivir, Skarner, Sona, Soraka, Swain, Syndra, Taliyah, Talon, Taric, Teemo, Thresh, Trundle, Twisted Fate, Twitch, Udyr, Varus, Veigar, Vel'Koz, Vex, Viktor, Vladimir, Xayah, Xerath, Yorick, Yuumi, Ziggs, Zilean, Zoe, Zyra |
| **장거리 포킹 예외** | Trueshot Prodigy | 47명 제외(700+ 사거리 스킬샷 없는 챔피언 — 나무위키 서술) | Aatrox, Akali, Alistar, Amumu, Bel'Veth, Braum, Darius, Evelynn, Fiora, Fizz, Garen, Gwen, Hecarim, Jax, Kassadin, Katarina, Kled, K'Sante, Leona, Master Yi, Mordekaiser, Naafiri, Nautilus, Nilah, Nunu, Rammus, Rell, Renekton, Riven, Sejuani, Sett, Shen, Sion, Skarner, Taric, Trundle, Tryndamere, Udyr, Urgot, Vi, Viego, Vladimir, Warwick, Wukong, Yasuo, Yone, Zac |
| **궁극기 효과 예외** | Ultimate Revolution, Back to Basics | 4명 제외(전통적 궁극기 부재) | **Elise, Jayce, Nidalee, Udyr** |
| **아군 힐/실드 화이트리스트** | Sonic Boom, Virtuous Cycle | **이 27명만 받을 수 있음** | Alistar, Annie, Bard, Galio, Hwei, Ivern, Janna, Karma, Kayle, Lee Sin, Lulu, Lux, Milio, Morgana, Nami, Nidalee, Orianna, Rakan, Renata Glasc, Senna, Seraphine, Sona, Soraka, Sylas, Taric, Thresh, Yuumi |

- 아레나 기타 규칙: **Flee(도주) 주문을 대체하는 증강은 1인당 1개만** 받을 수 있음(Banner of Command, Blade Waltz, Castle, Clown College 등 15종 목록 명시). 각 증강은 **한 게임에서 서로 다른 플레이어 4명까지만** 등장 가능. 리롤/스킵한 선택지는 이후 다시 나올 수 있음(아수라장과 반대).
- 나무위키(리그 오브 레전드/증강) 서술 요지: "스탯형 증강은 킷과 안 맞는 챔피언에게 숨겨진다(AD 증강↔주문 위주 챔피언·브라움·오른 / AP 증강↔AD 챔피언·오른·카이사 / 마나 증강↔마나 없는 챔피언 / CC·이동기·장거리 스킬샷 증강↔해당 메커니즘 없는 챔피언)" — 공식 위키 예외 표와 일치. https://namu.wiki/w/리그%20오브%20레전드/증강

---

## 4. 아레나 방식과 같은가? (Q3)

**결론: 같은 계열의 시스템(챔피언별 eligibility 필터 + 등급제 + 리롤)이며, 아수라장은 아레나의 증강·필터 개념을 이식한 뒤 챔피언 단위 필터를 더 확장(스킬 증강)했다. 단, 세부 규칙은 다르다.**

| 항목 | 아레나 | 칼바람 아수라장 |
|---|---|---|
| 증강 획득 | 라운드 1/5/8/11 (4회) + 특수 슬롯 2 (최대 6개) | 레벨 3/7/11/15 (4회, 4~5개) |
| 티어 | 실버/골드/프리즘, 라운드마다 전원 동일 티어 | 동일 (실버/골드/프리즘, 전원 동일 티어, 1·2번째 화면 실버 중복 금지) |
| 챔피언별 필터 | 공식 문서화된 예외 목록(스탯/메커니즘별 제외, V13.17 기준) + 챔피언 전용 증강 | 개발자 확인: 드로우 풀 자체가 챔피언별 필터링(Invalid 등급은 완전 제외), 스킬 증강은 킷 조건 필수. 전용 증강은 없음 |
| 챔피언 전용 증강 | 있음(쉬바나·드레이븐·사일러스·자헨·유나라 등) | 위키 기준 없음 |
| 재등장 규칙 | 리롤/스킵한 증강 재등장 가능, 증강당 게임 내 4명 제한 | 한 번 제시된 증강은 그 게임에서 재등장 안 함, 일부 증강 팀당 1~2명 제한 |
| 계정 진행도 영향 | Fame 레벨로 증강 해금(Bodyguard 등) + 리롤 +1 | 진행 트랙으로 증강 해금 + 골든 리롤 + **레벨 9: 스킬 강화 증강 등장 확률 증가** |
| 유래 | — | 출시 시 아레나 인기 증강 다수 이식(지속 효과 제거 등 조정) — /dev: Bringing Mayhem to ARAM (2025-10-06) |

- 아수라장 초기(25.21~26.11)에는 여기에 **특성(세트) 시스템**이 얹혀 있었으나 26.12에 제거(§2-5).
- 나무위키 아수라장 문서도 "아레나의 증강과 동일한 성능(일부 제외/조정)"이라고 서술 — https://namu.wiki/w/무작위%20총력전:%20아수라장

---

## 5. 등장 확률/가중치에 대해 알려진 것 (Q4)

**공식 수치는 비공개.** 알려진 것:

1. **티어 확률**: "티어는 매번 무작위"이며 유일한 명시 제약은 1·2번째 화면 실버 중복 금지(공식 위키). 티어별 % 수치는 어떤 공식 문서에도 없음. (loltheory 가이드도 동일 확인: https://blog.loltheory.gg/aram-mayhem/ )
2. **챔피언별 가중치(개발자 공식 확인)**: Optimal(희귀·하이롤) / Viable(자주) / Average(자주·무난) / **Invalid(해당 챔피언 풀에서 완전 제외)** 4단계 분류 — Inven Global 인터뷰(2026-08-24). 구체적 확률값은 비공개.
3. **진행 트랙 가중치(공식 위키)**: 레벨 9 보상 = "Gain a higher chance of being offered an augment that upgrades one of your champion's abilities."(자기 챔피언 스킬 강화 증강의 등장 확률 증가) / 레벨 1 = 골든 리롤 확률 / 레벨 5 = 챔피언 선택 카드 3장("blessed card") 확률 증가 — https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem
4. **데이터마이닝**: 위키 모듈에 "Snap Back — This augment exists in the internal augment data but appears to be disabled."처럼 내부 데이터 기반 서술이 존재. 챔피언×증강 가중치 테이블 자체의 데이터마이닝 공개본은 이번 조사에서 발견하지 못함(미확인).
5. **커뮤니티 실측**: 팬사이트 arammayhem.com이 패치별 증강 픽률/승률과 챔피언별 통계를 집계(예: 26.17 기준 Draw Your Sword 승률 60.46%·픽률 15.75%, 그레이브즈/사미라/코르키 편중; Mind to Matter 통계에 마나 챔피언만 존재) — https://arammayhem.com/augments/draw-your-sword/ , https://arammayhem.com/augments/mind-to-matter/ . 픽률이 챔피언별로 크게 갈리는 것 자체가 풀 필터링·가중치의 간접 증거.
6. **커뮤니티 평가**: 나무위키 아수라장 문서는 26.12 스킬 증강이 "챔피언마다 스킬에 할당된 파워가 서로 다르다는 점을 고려하지 않고" 일괄 적용됐다고 비판(→ 이후 450+ 조합 제거로 이어진 문제의식과 일치). 26.12 신규 증강은 59종(실버 12/골드 26/프리즘 21, arammayhem.com 패치 노트 기준).

---

## 6. 타임라인 요약

| 시점 | 내용 |
|---|---|
| 2025-10-06 | /dev: Bringing Mayhem to ARAM — 모드 공개, "40+ 신규 증강 + 아레나 이식 증강" (https://www.leagueoflegends.com/en-us/news/dev/dev-bringing-mayhem-to-aram/) |
| V25.21 (2025-10 말) | 아수라장 라이브 출시(별도 큐), 증강+특성 시스템. 출시 시 증강 196개(Inven Global) |
| 2026-05-27/28 | /dev: Augmentmaxxing — 특성 제거 예고, 스킬/퀘스트 증강 발표 (Riot Phlox) |
| 26.12 (2026-06-09/10) | 특성 시스템 제거, 스킬 증강·퀘스트 증강 추가(신규 59종) |
| 2026-06-19 | 라이브 핫픽스: 부적합/버그 스킬 증강 조합 450개+ 제거("dead draws" 문제), 일부 증강 일시 비활성 |
| 26.13 (2026-06-23) | "스킬 증강이 실제로 이득이 되는 스킬에만 뜨도록" 적격성 개선 |
| 26.15 (2026-07-28) | 챔피언별 예외(보정) 다수 제거, invalid offers 버그 수정 |
| 2026-08-24 | Inven Global 개발 인터뷰 — 챔피언별 1D 배열, Optimal/Viable/Average/Invalid 분류 공개 |
| 26.17 (현재) | 위키 모듈 기준 일반 증강 225종 등재(11종 비활성), 전체 풀 300+ (Inven Global) |

---

## 7. 미확인 / 한계

- **티어(실버/골드/프리즘) 등장 확률의 정확한 수치** — 공식·데이터마이닝 모두 미발견.
- **챔피언×증강 Optimal/Viable/Average/Invalid 매핑의 실제 데이터** — 개발자가 존재만 확인, 공개본 없음. 위키도 아수라장용 챔피언별 제외 목록(아레나식 예외 표)을 아직 만들지 않음(패치 히스토리 페이지에 Outdated 태그).
- **아수라장에서 마나 증강(Mind to Matter 등)이 마나 없는 챔피언에게 제외되는지** — 아레나에는 공식 문서화, 아수라장은 팬사이트 서술+실측 통계 정황만(공식 미확인).
- 나무위키 기재 아레나 전용 증강 중 진 "천천히, 꾸준히", 갱플랭크 "노련한 저격수"의 영문명·현재 상태 — 위키 Lua 데이터에서 미발견(미확인).
- r/ARAM의 개별 스레드(실측 토론) — 검색 도구로 Reddit 본문 접근 불가(간접 인용만 확보).
- 아레나 예외 목록은 **V13.17(2023) 이후 미갱신**이라고 위키가 명시 — 현재 라이브와 다를 수 있음.
- 일부 수치/인명은 WebFetch 요약 모델 경유(IBTimes의 "Riot Cadmus"=ed_corte 표기 등)로 원문 대조 불가분 있음.

---

## 8. 출처 목록

**공식 위키 (원문 직접 다운로드로 검증)**
- ARAM: Mayhem — https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem
- ARAM: Mayhem/Augments — https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Augments
- Module:MayhemAugmentData/data — https://wiki.leagueoflegends.com/en-us/Module:MayhemAugmentData/data
- ARAM: Mayhem/Patch history — https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Patch_history
- Arena — https://wiki.leagueoflegends.com/en-us/Arena (Augment Exceptions 섹션)
- Module:ArenaAugmentData/data — https://wiki.leagueoflegends.com/en-us/Module:ArenaAugmentData/data

**라이엇 공식**
- /dev: Bringing Mayhem to ARAM (2025-10-06) — https://www.leagueoflegends.com/en-us/news/dev/dev-bringing-mayhem-to-aram/
- /dev: Augmentmaxxing ARAM: Mayhem (2026-05-27, Riot Phlox) — https://www.leagueoflegends.com/en-us/news/dev/dev-augmentmaxxing-aram-mayhem/
- 핫픽스 발표: https://x.com/ed_corte/status/2067698024776867879 , https://www.threads.com/@leagueoflegends/post/DZvB_H4iAKW
- Riot Support, ARAM: Mayhem Game Mode — https://support-leagueoflegends.riotgames.com/hc/en-us/articles/45460878435987

**언론/인터뷰**
- Inven Global (2026-08-24) — https://www.invenglobal.com/articles/25082/lol-aram-mayhem-reveals-the-secrets-of-augment-development
- IBTimes — https://www.ibtimes.com/league-legends-aram-mayhem-cuts-over-450-ability-augments-live-hotfix-3804331
- esports.gg — https://esports.gg/news/league-of-legends/riot-removes-450-ability-augments/ , https://esports.gg/guides/league-of-legends/aram-mayhem-augments-26-12/
- Hotspawn (2026-05-28) — https://www.hotspawn.com/league-of-legends/news/aram-mayhem-is-getting-rid-of-traits
- TechTimes (2026-06-19) — https://www.techtimes.com/articles/318717/20260619/league-legends-aram-mayhem-cuts-over-450-ability-augments-live-hotfix.htm
- 게임플 (한국) — https://www.gameple.co.kr/news/articleView.html?idxno=215744

**커뮤니티/팬사이트**
- arammayhem.com — https://arammayhem.com/ability-augments/ , https://arammayhem.com/patch-notes/ , https://arammayhem.com/augments/mind-to-matter/ , https://arammayhem.com/augments/draw-your-sword/
- blog.loltheory.gg — https://blog.loltheory.gg/aram-mayhem/
- 나무위키: 리그 오브 레전드/증강 — https://namu.wiki/w/리그%20오브%20레전드/증강 ; 무작위 총력전: 아수라장 — https://namu.wiki/w/무작위%20총력전:%20아수라장 ; 챔피언별 추천 조합 — https://namu.wiki/w/리그%20오브%20레전드/증강/챔피언별%20추천%20조합
- DC인사이드 칼바람 나락 갤러리(증강별 챔피언 팁) — https://gall.dcinside.com/mgallery/board/view/?id=howlingabyss&no=392368
- 에펨코리아 PBE 증강 정리 — https://www.fmkorea.com/9411413057
