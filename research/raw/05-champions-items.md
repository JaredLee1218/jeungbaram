# 05. 챔피언·아이템 기초 데이터 조사 (시뮬레이터의 뼈대)

- 조사일: 2026-09-02
- 기준 데이터: Data Dragon **16.17.1** (versions.json 실측) = 라이브 패치 **26.17** 추정(아래 버전 매핑 참고)
- 실측 방법: ddragon/cdragon JSON을 직접 다운로드하여 로컬 파싱(챔피언 수, 아이템 맵 플래그, ko_KR 등은 전부 실제 데이터 기준)
- 독립 검증(2026-09-02): versions.json 최신 16.17.1, ko_KR champion.json 200 OK·173명, item.json 868항목, 위키 Lua 모듈 aram 블록 161명(키 빈도 8종 전부 일치), maps.json map12="Random Map" — 전부 독립 재fetch로 확인. 수정 2건: §3-1 맵별 수치 의미 보정, §3-3(e) 26.03/26.12 Trait 사실관계 정정

---

## 1. Data Dragon 최신 버전과 챔피언 총원

### 1-1. 최신 버전 (실제 fetch 결과)

`https://ddragon.leagueoflegends.com/api/versions.json` 을 2026-09-02에 실제 fetch한 결과, 배열 첫 10개:

```
"16.17.1", "16.16.1", "16.15.1", "16.14.1", "16.13.1",
"16.12.1", "16.11.1", "16.10.1", "16.9.1", "16.8.1"
```

- **최신 Data Dragon 버전 = `16.17.1`**
- 출처: https://ddragon.leagueoflegends.com/api/versions.json (직접 fetch)

**버전 매핑 주의(중요):** 2025년부터 라이엇은 클라이언트/패치노트 표기를 "시즌 연도" 기반(25.x, 26.x)으로 바꿨지만, **Data Dragon 내부 버전은 기존 연번(15.x, 16.x)을 유지**한다. 즉 `DDragon 16.17.1 ≈ 라이브 패치 26.17`이다(오프셋 10).
- 정황 근거 1: ARAM 밸런스 사이트가 "Patch 26.15" 표기 사용 — https://www.aramnerfs.com/
- 정황 근거 2: 언론이 "patch 26.03" 표기 사용 — https://www.invenglobal.com/articles/20062/riot-games-extends-lol-aram-mayhem-mode-teases-major-update-in-patch-2603
- 정황 근거 3: deeplol이 "패치 16.17의 칼바람 나락 밸런스 조정" 표기(ddragon 번호 그대로 사용) — https://www.deeplol.gg/
- ※ "26.17 = 16.17.1"의 1:1 대응 자체는 라이엇 공식 문서로 재확인하지 못함 → **강한 추정(오프셋 10 규칙은 2025 시즌부터 일관)**

### 1-2. 챔피언 총원: **173명** (실측)

`https://ddragon.leagueoflegends.com/cdn/16.17.1/data/en_US/champion.json` 을 내려받아 `data` 키 개수를 직접 센 결과 **173**. ko_KR 파일도 동일하게 173.
- 출처: https://ddragon.leagueoflegends.com/cdn/16.17.1/data/en_US/champion.json (직접 파싱)
- 참고(웹): 173명 표기 — https://blog.loltheory.gg/league-of-legends-champions-by-release-date/ / LoL 위키 챔피언 목록 — https://wiki.leagueoflegends.com/en-us/List_of_champions

### 1-3. 최신 챔피언 (최근 2년, 실측 + 웹 검증)

| 챔피언 | 한국어명(실측 ko_KR) | key | 태그 | 출시 |
|---|---|---|---|---|
| **Locke** | 로크 '잿빛 퇴마사' | 805 | Assassin/Mage | **2026-06-24, 패치 26.13** — 2026년 유일한 신챔피언 |
| Zaahen | 자헨 '저물지 않는 자' | 904 | Fighter | 2025년 11월 |
| Yunara | 유나라 '꺾이지 않는 신념' | 804 | Marksman | 2025년 7월 |
| Mel | 멜 '영혼의 반향' | 800 | Mage/Support | 2025년 1월 |
| Ambessa | 암베사 '전장의 우두머리' | 799 | Fighter/Assassin | 2024년 11월 |
| Aurora | 오로라 '세계의 경계에 선 마녀' | 893 | Mage/Assassin | 2024년 7월 |

- Locke 출시일/역할 출처: https://esports.gg/news/league-of-legends/league-of-legends-locke-release-date-and-abilities/ , https://www.gamegrin.com/news/new-league-of-legends-champion-locke-officially-launches/
- Zaahen/Yunara 출시 시기 출처: https://escorenews.com/en/lol/news/73374-riot-reveals-new-champion-zaahen-s-release-date-and-time-gameplay-and-abilities , https://mobalytics.gg/lol/guides/new-champion-tracker
- "2026년 신챔은 Locke 하나" 출처: https://gfuel.com/blogs/news/who-is-the-new-league-of-legends-champion-in-2026 (다음 챔피언 Norra는 와일드 리프트 확정/PC는 추측 단계 — 미확인)
- ※ `key`(숫자 ID)는 출시 순서와 무관함(예: Naafiri=950, Briar=233). 출시일 정렬이 필요하면 위키/외부 목록 사용.

---

## 2. 챔피언 데이터 구조 (champion.json) 와 ko_KR 지원

### 2-1. 요약본 `champion.json` (전 챔피언 1파일, ~159KB)

URL: `https://ddragon.leagueoflegends.com/cdn/{버전}/data/{로케일}/champion.json`

실측한 챔피언별 필드(Aatrox 예):
```
version, id, key, name, title, blurb, info, image, tags, partype, stats
```
- `id`: 문자열 ID("Aatrox", "KSante" — 이미지 파일명과 일치), `key`: 숫자 ID 문자열("266")
- `tags`: 역할 분류 — Fighter / Tank / Mage / Assassin / Marksman / Support (복수 가능)
- `partype`: 자원 종류(마나/기력/분노/피의 샘 등 — 로케일 번역됨)
- `info`: attack/defense/magic/difficulty (0~10 지표)
- `stats` (20개 키, 기본 스탯+성장): `hp, hpperlevel, mp, mpperlevel, movespeed, armor, armorperlevel, spellblock, spellblockperlevel, attackrange, hpregen, hpregenperlevel, mpregen, mpregenperlevel, crit, critperlevel, attackdamage, attackdamageperlevel, attackspeedperlevel, attackspeed`
- `image`: `{full: "Aatrox.png", sprite: "champion0.png", group: "champion", x, y, w, h}` (스프라이트 시트 좌표 포함)
- **주의: 요약본에는 스킬(spells) 정보가 없음** → 스킬은 아래 개별 파일 또는 `championFull.json` 사용

### 2-2. 챔피언 개별 상세 `champion/{Id}.json` (실측: ko_KR Aatrox, ~13KB)

URL: `https://ddragon.leagueoflegends.com/cdn/16.17.1/data/ko_KR/champion/Aatrox.json`

최상위 필드: `id, key, name, title, image, skins, lore, blurb, allytips, enemytips, tags, partype, info, stats, spells, passive, recommended`
- `spells`: Q/W/E/R 4개 배열. 각 스킬 필드:
  `id, name, description, tooltip, leveltip, maxrank, cooldown, cooldownBurn, cost, costBurn, datavalues, effect, effectBurn, vars, costType, maxammo, range, rangeBurn, image, resource`
  - 예: AatroxQ — 쿨다운 `14/12/10/8/6`, 이름 "다르킨의 검"(ko), 이미지 `AatroxQ.png`
  - **주의**: `tooltip`에 `{{ qdamage }}` 같은 미치환 플레이스홀더가 남아 있음(계수 수치는 ddragon만으로 완전 복원 불가 — 시뮬레이터에서 실제 데미지 공식을 쓰려면 CommunityDragon의 champion .bin이나 위키 데이터 필요)
- `passive`: `{name, description, image}` — 예: "사신 태세", `Aatrox_Passive.png`
- `skins`: 스킨 배열(`num`이 스플래시 파일명 접미사)
- 전 챔피언 상세를 한 번에: `championFull.json` (동일 경로, 대용량)

### 2-3. 한국어(ko_KR) 지원: **완전 지원 (실측 확인)**

- 지원 로케일 목록: `https://ddragon.leagueoflegends.com/cdn/languages.json` (실제 fetch) → 28개 로케일, **`ko_KR` 포함**:
  `["ar_AE","en_US","cs_CZ","de_DE","el_GR","en_AU","en_GB","en_PH","en_SG","es_AR","es_ES","es_MX","fr_FR","hu_HU","id_ID","it_IT","ja_JP","ko_KR","pl_PL","pt_BR","ro_RO","ru_RU","th_TH","tr_TR","vi_VN","zh_CN","zh_MY","zh_TW"]`
- ko_KR champion.json 실측: 이름·칭호·blurb·partype 전부 한국어 (아트록스 '다르킨의 검', 자원 '피의 샘' 등). 173명 전원 존재.
- 스킬 이름/툴팁/팁도 한국어(개별 파일 실측). item.json ko_KR도 HTTP 200 확인.
- 출처: https://ddragon.leagueoflegends.com/cdn/16.17.1/data/ko_KR/champion.json , https://ddragon.leagueoflegends.com/cdn/16.17.1/data/ko_KR/champion/Aatrox.json (직접 fetch)

---

## 3. 아이템 시스템 개요와 item.json 구조, 칼바람 전용 아이템/규칙

### 3-1. item.json 구조 (실측: 16.17.1 en_US, 687KB)

URL: `https://ddragon.leagueoflegends.com/cdn/{버전}/data/{로케일}/item.json`

- 최상위: `type, version, basic, data, groups, tree`
  - `basic`: 아이템 기본 템플릿(모든 필드의 기본값): `name, rune, gold, group, description, colloq, plaintext, consumed, stacks, depth, consumeOnFull, from, into, specialRecipe, inStore, hideFromAll, requiredChampion, requiredAlly, stats, tags, maps`
  - `groups`: 동시 보유 제한 그룹(예: `{"id":"HuntersTalismanGroup","MaxGroupOwnable":"1"}`)
  - `tree`: 상점 카테고리 트리(START/TOOLS/DEFENSE/ATTACK/MAGIC/MOVEMENT...)
- **아이템 항목 수: 868개** (실측 — 모드별 변형/비매품 포함)
- 아이템별 필드(Infinity Edge 3031 예):
  - `gold`: `{base: 725, purchasable: true, total: 3500, sell: 2450}`
  - `from`: 하위 재료 ID 배열(`1038,1037,1018`), `into`: 상위 아이템, `depth`: 조합 깊이
  - `tags`: `CriticalStrike, Damage` 등
  - `stats`: `{FlatCritChanceMod: 0.25, FlatPhysicalDamageMod: 75}` — ※ 고유 효과(passive)는 stats에 없고 description 텍스트에만 존재
  - `maps`: **맵별 구매 가능 플래그** — `{"11": true, "12": true, "22": false, "30": false, "453": true}`

### 3-2. 맵 ID (cdragon maps.json 실측)

| 맵 ID | 이름 | 비고 |
|---|---|---|
| 11 | Summoner's Rift | 소환사의 협곡 |
| 12 | **"Random Map"** (Howling Abyss 설명) | **ARAM — 2025년 6월부터 맵 3종 로테이션이라 이름이 'Random Map'으로 변경됨** |
| 22 | Teamfight Tactics | 롤토체스 |
| 30 | Arena | 아레나(2v2v2v2) |
| 453 | Classic Rift | "초창기 롤을 재현한 클래식 협곡" 모드 (mapStringId: JD) |

- 출처: https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/maps.json (직접 fetch)
- 맵별 `maps` 플래그 활성 아이템 수(실측): map11=316, **map12(ARAM)=404**, map30=232, map453=416, map22=0
  - ※ 검증자 주(2026-09-02 재실측): 위 수치는 `maps` 플래그 기준이며 **"구매 가능" 필터가 아님**. `gold.purchasable == true`까지 걸면 map11=254, map12=344, map30=187, map453=354, map22=0 (16.17.1 item.json 직접 재파싱으로 확인)

### 3-3. 칼바람(ARAM, map 12) 전용 아이템/규칙 — **있음 (실측)**

**(a) ARAM에서만 구매 가능(maps 12=true, 11=false) — 165개 항목.** 대표:
- `4003 Lifeline` (1600G), `4004 Spectral Cutlass` (2800G) — ARAM 전용 완성 아이템
- `12xxxx` 접두 변형: `123430 Rite of Ruin`, `124011 Sword of Blossoming Dawn`, `126697 Hubris` — **원본 ID 앞에 '12'를 붙인 ARAM 전용 수치 조정판**
- `22xxxx` 접두 변형(아레나 계열이지만 map12에도 켜짐): `223084 Heartsteel` (2500G — SR판 3084는 3000G), `223069 Void Immolation`, `226668 Ultra Hydra`, `228002 Wooglet's Witchcap`, `220008 Anvil Voucher`(750G, 비매품 — 모루 시스템용)
- `771xxx` 접두 변형(Classic Rift용이나 map12에도 플래그 켜짐): `771001 Boots of Speed`(325G), `771036 Long Sword`(400G) 등 구식 아이템 복각판
- 기타: `1500 Penetrating Bullets`(포탑 아이템), `6032 Stat Bonus` 등 시스템 아이템 포함

**(b) SR에는 있지만 ARAM에서 비활성(11=true, 12=false) — 77개 항목.** 대표:
- 정글 아이템 전부(1101~1107), `2055 Control Ward`, `1082 Dark Seal`, `1083 Cull`, `2033 Corrupting Potion`, `3041 Mejai's Soulstealer`, `3026 Guardian Angel`
- `32xxxx` 접두 SR 전용 변형: `323070 Tear of the Goddess`, `323003 Archangel's`, `323004 Manamune`, `323075 Thornmail`, `323110 Frozen Heart`, `323107 Redemption`, `323190 Locket` 등 — **마나/탱/서폿 아이템의 SR 전용 조정판** (단, 같은 이름의 기본 ID판(3070 등)은 maps 12=true로 남아 있음 — 이중 항목 존재. 실제 인게임 노출은 게임 로직이 결정하므로 maps 플래그만 맹신하지 말 것)
- 신발 업그레이드 계열(3170~3176 등)도 ARAM 비활성

**(c) ARAM 상징 아이템(위키 기준 ARAM 전용): Guardian's Blade/Hammer/Horn/Orb, Lifeline, Spectral Cutlass, Cappa Juice, Poro-Snax(장신구 자동 장착)**
- 출처: https://wiki.leagueoflegends.com/en-us/ARAM
- 실측 ID: 2051 Guardian's Horn(950G), 3112 Guardian's Orb(950G), 3177 Guardian's Blade(950G), 3184 Guardian's Hammer(950G), 2141 Cappa Juice(300G), 2052 Poro-Snax(0G)
- ※ 이들 Guardian 계열은 item.json에서 maps 11도 true로 표시됨 — **maps 플래그는 "기술적 활성화"일 뿐 실제 상점 노출과 다를 수 있음** (위키는 ARAM 전용으로 분류)

**(d) 2026 현재 ARAM 규칙 (LoL 위키 기준):**
- 맵: **Howling Abyss / Butcher's Bridge / Koeshin's Crossing 3종 무작위 로테이션** (2025년 6월 도입, 챔피언도 맵도 랜덤)
- 시작 골드 **1400G**, 1:00부터 10초당 60G 수동 골드
- 귀환 불가, 체력 유물(Health Relic)로 회복
- **상점은 상점 근처에 있을 때만 이용 가능. 상점 구역을 벗어나거나 전투에 들어가면 구매 잠금** (2025~26 신규 규칙)
- 챔피언 선택 개편: 리롤 방식에서 "가능한 챔피언 전부를 한 번에 보여주는" 방식으로 변경
- 출처: https://wiki.leagueoflegends.com/en-us/ARAM

**(e) ARAM: Mayhem (무작위 총력전: 아수라장) — 별도 큐:**
- 2025-10-22(v25.21) 출시된 **증강(augment) 지원 ARAM 변형 모드**. 일반 ARAM은 그대로 유지되고 Mayhem은 별도 큐
- 반응이 좋아 연장 → **2026-01-06부로 사실상 상시(permanent) 모드화** ⚠️ 미검증(2026-01-06이라는 날짜는 단일 출처 esports-news.co.uk뿐 — 독립 소스에서는 26.03 "Mayhem 2.0"이 "full-featured permanent mode"화 시점으로 기술됨: https://arammayhem.com/patch/26-3/ ), 전담 팀이 2027년까지 업데이트 계획(독립 확인: hotspawn.com "content planned for this year and the next one")
- 패치 26.03(2026-02-04) "ARAM Mayhem 2.0" 대규모 개편: **Trait(시너지) 시스템·진행도(32레벨 보상) 도입 + 신규 증강 45개 추가** — Trait "제거"가 아니라 도입임 [검증자 수정, 출처: https://arammayhem.com/patch/26-3/ ]
- **Trait 제거는 패치 26.12(2026년 6월경)**: Trait를 없애고 Ability Augment/Quest Augment 도입, 신규 증강 59개(Silver 12/Gold 26/Prismatic 21) 추가 [검증자 수정, 출처: https://tech.yahoo.com/gaming/articles/league-legends-aram-mayhem-patch-210835227.html , https://esports.gg/guides/league-of-legends/aram-mayhem-augments-26-12/ ]
- **아레나처럼 750골드로 "능력치 모루(Anvil Voucher, 아이템 ID 220008)"를 구매하는 시스템 존재** (나무위키 검색 스니펫 + item.json 실측 750G 일치)
- 출처: https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem , https://www.invenglobal.com/articles/20062/riot-games-extends-lol-aram-mayhem-mode-teases-major-update-in-patch-2603 , https://esports-news.co.uk/2026/01/07/aram-mayhem-staying-in-league-of-legends-possibly-permanent/ , https://namu.wiki/w/무작위%20총력전:%20아수라장 (fetch 불가, 검색 스니펫), https://support-leagueoflegends.riotgames.com/hc/en-us/articles/45460878435987-League-of-Legends-ARAM-Mayhem-Game-Mode

---

## 4. ARAM 챔피언 밸런스 조정(버프/너프 %) 데이터 제공 여부

### 4-1. 결론 요약

- **라이엇 공식 API/Data Dragon: 제공 안 함.**
- **CommunityDragon(cdragon) 게임 파일: 현재는 안 들어 있음 (실측 확인).**
  - `latest/game/data/maps/shipping/map12/map12.bin.json` (7.2MB)을 내려받아 검색 — 챔피언 참조는 전부 VFX 에셋이고 `DamageDealt/Scalar` 류 밸런스 필드 없음
  - `latest/game/data/characters/aatrox/aatrox.bin.json` — "ARAM" 문자열은 스펠 랭크업 추천(`RecSpellRankUpInfo`) 1건뿐
  - `latest/cdragon/` 가공 데이터 디렉터리에는 `arena`, `tft`만 존재(aram 없음)
  - (ARAM 밸런스는 수년 전부터 서버 측에서 핫픽스 가능하게 운영되는 것으로 알려져 있어 클라이언트 파일에 없는 것과 부합 — 이 운영 방식 자체는 미확인/정황)
- **가장 좋은 기계 판독 소스: LoL 공식 위키의 Lua 데이터 모듈** ⭐
  - `https://wiki.leagueoflegends.com/en-us/Module:ChampionData/data?action=raw` (392KB Lua 테이블, 직접 fetch 성공)
  - 챔피언별 `["aram"]` 블록 실측: **161명이 조정치 보유**. 키 빈도(실측):
    - `dmg_dealt` 143명 (가하는 피해 배율, 예 1.05 = +5%)
    - `dmg_taken` 138명 (받는 피해 배율, 예 0.95 = -5%)
    - `healing` 27명, `ability_haste` 23명, `tenacity` 17명, `shielding` 13명, `total_as` 8명(총 공속), `energyregen_mod` 4명(기력 재생)
  - 예: `{dmg_dealt=1.05, dmg_taken=1}`, `{dmg_dealt=1, dmg_taken=0.95, energyregen_mod=1.2, tenacity=1.2}`
  - 같은 모듈에 `urf`, `ofa`(단일소환사), `ar` 등 다른 모드 조정치도 포함 → 시뮬레이터에서 Lua 테이블 파싱해서 쓰면 됨
- **스킬 단위 ARAM 개별 조정(수치 변경)**: `https://wiki.leagueoflegends.com/en-us/Template:Map_changes/data/aram?action=raw` — 위키텍스트(서술형)라 파싱 난도 높음. 예: "Akali I: AP ratio changed to 65% AP", "Zilean R: Heal AP ratio 250% AP"

### 4-2. 커뮤니티 사이트(교차검증/편의용)

- https://www.aramnerfs.com/ — 패치 26.15 기준. 예시 실측: Kalista +10% 딜/-10% 받피, Bel'Veth +5%/-5%+비틀거림저항20%, Akali -5% 받피/+20% 기력재생/+20% 비틀거림 저항, Ahri 치유 -10%, Lux -10% 딜/+10% 받피/-10% 실드. "공식 패치노트를 매 패치 반영"이라고 명시
- https://arammayhem.com/aram-balance/ — 챔피언/아이템/룬 조정 종합
- https://www.aramonly.com/aram-changes/ , https://buffit.lol/gamemode/aram/champions/all , https://leagueoflegendstools.com/data/aram-buffs/
- (Fandom 구위키) https://leagueoflegends.fandom.com/wiki/ARAM — 현재는 wiki.leagueoflegends.com이 공식 위키

**시뮬레이터 권장안:** 위키 `Module:ChampionData/data`(Lua)를 주 소스로 파싱 + 패치노트/aramnerfs로 교차검증. 라이엇 쪽 공식 피드는 없다는 전제로 설계할 것.

---

## 5. 이미지 URL 규칙 (전부 HTTP 200 실측 검증됨)

### 5-1. Data Dragon (버전 종속 — `{v}` = 예: 16.17.1)

| 종류 | URL 패턴 | 검증 |
|---|---|---|
| 챔피언 초상화(정사각 120x120) | `https://ddragon.leagueoflegends.com/cdn/{v}/img/champion/{챔피언Id}.png` (예: Aatrox.png) | 200, image/png, 25,644B |
| 스킬 아이콘 | `https://ddragon.leagueoflegends.com/cdn/{v}/img/spell/{스킬image.full}` (예: AatroxQ.png) | 200 |
| 패시브 아이콘 | `https://ddragon.leagueoflegends.com/cdn/{v}/img/passive/{passive.image.full}` (예: Aatrox_Passive.png) | 200 |
| 아이템 아이콘 | `https://ddragon.leagueoflegends.com/cdn/{v}/img/item/{아이템ID}.png` (예: 1001.png) | 200 |
| 스프라이트 시트 | `https://ddragon.leagueoflegends.com/cdn/{v}/img/sprite/{sprite}` (예: champion0.png — image.x/y/w/h로 크롭) | 200 |

### 5-2. Data Dragon (버전 무관)

| 종류 | URL 패턴 | 검증 |
|---|---|---|
| 스플래시 아트 | `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/{챔피언Id}_{skinNum}.jpg` (예: Aatrox_0.jpg) | 200, image/jpeg, 129,013B |
| 로딩 화면 | `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/{챔피언Id}_{skinNum}.jpg` | 200 |

- 파일명 규칙: champion.json의 `id` 필드 그대로 사용(공백/특수문자 제거형 — `KSante`, `MonkeyKing`(=오공), `Fiddlesticks` 등 표기 주의). `skinNum`은 개별 챔피언 JSON의 `skins[].num`.
- 스킬 아이콘 파일명은 스킬 `image.full`을 그대로 쓰는 것이 안전(스킬 id와 대체로 같지만 예외 존재 가능).

### 5-3. CommunityDragon 대안 CDN (버전 별칭 `latest` 지원, 실측 200)

- 초상화: `https://cdn.communitydragon.org/latest/champion/{챔피언Id 또는 key}/square` (실측 200)
- 같은 체계로 `/splash-art`, `/splash-art/centered`, `/tile`, `/portrait` 등 제공 — 문서: https://github.com/communitydragon/docs/blob/master/assets.md
- raw 게임 데이터: `https://raw.communitydragon.org/latest/...` (map/champion .bin.json 등, 본 조사에서 직접 사용)

---

## 6. 시뮬레이터 설계에 주는 시사점 (요약)

1. **뼈대 데이터**: ddragon 16.17.1 `champion.json`(173명, ko_KR 완비) + `championFull.json`(스킬) + `item.json`(868항목, maps 플래그로 ARAM 필터) 조합이면 로스터/아이템 DB는 충분.
2. **ARAM 아이템 풀**: `maps["12"] == true && gold.purchasable == true` 필터가 1차 근사. 단 12xxxx/22xxxx/771xxx 접두 변형 ID와 이중 항목(3070 vs 323070) 때문에 **접두 규칙 정규화 + 위키 교차검증 필요**.
3. **ARAM 챔피언 밸런스(%)**: 라이엇 공식 피드 없음 → **위키 Lua 모듈 파싱이 사실상 표준** (dmg_dealt/dmg_taken 등 8종 키, 161명).
4. **스킬 실수치(계수)**: ddragon 툴팁은 플레이스홀더 미치환 → 정밀 데미지 계산이 필요하면 cdragon `characters/{name}/{name}.bin.json` 파싱 또는 위키 데이터 필요.
5. **모드 지형 변화**: 2026 현재 ARAM은 맵 3종 로테이션 + 상점 규칙 변경, 별도 큐로 증강 모드 'ARAM: Mayhem(아수라장)'이 상시 운영(모루 750G 포함). 시뮬레이터가 "칼바람"을 다룬다면 일반 ARAM과 Mayhem을 구분해야 함.

---

## 미확인 사항

- DDragon `16.17.1` ↔ 라이브 패치 `26.17`의 1:1 대응 (오프셋 10 규칙은 정황상 확실하나 공식 문서 미확인)
- ARAM 밸런스가 서버 측 핫픽스로 운영된다는 내부 메커니즘 (클라이언트 파일 부재는 실측했으나 운영 방식 자체는 공식 확인 못 함)
- item.json `maps` 플래그와 실제 인게임 상점 노출의 정확한 일치 여부 (Guardian 계열이 maps11=true로 나오는 등 불일치 정황)
- ARAM: Mayhem이 "영구 모드"로 공식 선언됐는지 vs "무기한 연장"인지의 정확한 표현 (2027년까지 업데이트 계획은 확인)
- 다음 신챔피언 Norra의 PC 출시 여부 (와일드 리프트만 확정, PC는 커뮤니티 추측)
- 771xxx(Classic Rift) 아이템이 map12에도 플래그가 켜져 있는 이유 (데이터상 사실이나 의도 미확인)
- ARAM: Mayhem 증강 목록의 기계 판독 데이터 소스 (cdragon `/cdragon/`에는 arena만 존재; arammayhem.com 등 커뮤니티 소스만 확인)
