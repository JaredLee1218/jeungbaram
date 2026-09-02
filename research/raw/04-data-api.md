# 04. 증강/챔피언/아이템 데이터를 프로그램으로 가져오는 방법 (ARAM: Mayhem)

조사일: 2026-09-02 / 현재 라이브 패치: 26.17 (Data Dragon 버전 16.17.1)
표기: ✅ = 이번 조사에서 실제 HTTP 요청으로 작동 확인(2026-09-02), ❓ = 미확인/존재하지 않음/추정

> 독립 검증(2026-09-02, 별도 검증자): 주요 ✅ 엔드포인트를 전부 재-fetch하여 200 확인(queues.json 2400 항목, cherry-augments 657개/ARAM_ADAPt id 1205, augment-lists CHERRY 44/KIWI 222/KIWI_JADE 188, kiwi.bin.json AugmentData 222개·rarity 매핑 불일치 0, ko 스트링테이블 실측 문자열, 위키 모듈 225개(64/85/76), cdragon 디렉토리 arena·tft만 존재, GitHub #1109 인용문·날짜 전부 원문 일치, #1154 open, aramstats 공지 확인). 수정 1건: 영어 스트링테이블 경로(3.4 참조).

---

## 0. TL;DR

- **Riot 공식 match-v5로는 ARAM: Mayhem 경기 데이터를 가져올 수 없다.** 경기 자체가 의도적으로 403 차단됨(2025-10-22 출시 직후부터, 2026-03-31 시점에도 여전히 비공개). 큐 ID는 공식 문서상 **2400**.
- **증강 메타데이터(이름/아이콘/희귀도/설명)는 CommunityDragon에서 전부 얻을 수 있다.** ARAM Mayhem의 내부 코드네임은 **KIWI**. 핵심 파일 3개:
  - `v1/cherry-augments.json` — id↔이름↔아이콘↔희귀도 통합 레지스트리(Mayhem 222개 전부 포함, ko_kr 로케일 지원) ✅
  - `game/maps/modespecificdata/kiwi.bin.json` — 증강 222개의 전체 정의(설명 키, 스펠 데이터 포함) ✅
  - `game/ko_kr/data/menu/en_us/lol.stringtable.json` — 한국어 번역 문자열 ✅
- 챔피언/아이템은 Data Dragon(공식) + CommunityDragon 둘 다 정상 작동 ✅.
- 증강 "설명 텍스트"를 쉽게 얻으려면 **LoL 공식 위키의 Lua 데이터 모듈**(`Module:MayhemAugmentData/data`, 225개, CC BY-SA 3.0)이 가장 편한 지름길 ✅.
- 통계(승률/픽률)는 공식 경로가 없음. arammayhem.com/u.gg/op.gg 등이 통계를 내고 있으나 수집 방법은 비공개(자사 데스크톱 앱의 클라이언트 수집으로 추정 ❓).

---

## 1. Riot 공식 API (match-v5)

### 1.1 queueId — 확정

- ✅ **공식 static 문서 `queues.json`에 queueId 2400 = "ARAM: Mayhem" / map "Howling Abyss" 로 등재됨.**
  - URL: https://static.developer.riotgames.com/docs/lol/queues.json (HTTP 200, 직접 확인)
  - 마지막 항목: `{"queueId": 2400, "map": "Howling Abyss", "description": "ARAM: Mayhem", "notes": null}` (참고로 2300 = Brawl)
- ✅ 클라이언트 데이터(CommunityDragon `v1/queues.json`)에는 Mayhem 계열 큐가 더 많이 정의되어 있음 (직접 파싱 확인):
  - **2400, 2401, 2403, 2405** — "ARAM: Mayhem" (pickMode: `AllRandomPickStrategy`, gameSelectModeGroup: `kARAM`)
  - **2410** — "ARAM: Mayhem Tournament"
  - **2450** — "ARAM: Mayhem Classic-ish" (isLimitedTimeQueue: true), **3280** — 동명 큐
  - **3240, 3270** — "ARAM: Mayhem" (용도 불명 ❓)
  - URL: https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/queues.json
  - 실제 라이브 매치가 어느 번호를 쓰는지는 경기 데이터가 403이라 교차 검증 불가 ❓ (공식 문서 기준 2400이 정답일 가능성이 가장 높음)
- ✅ 공식 `gameModes.json`(https://static.developer.riotgames.com/docs/lol/gameModes.json)에는 KIWI/MAYHEM은 물론 CHERRY(Arena)도 아직 없음 — 문서가 오래됨. 최신 등재는 SWIFTPLAY, BRAWL까지.

### 1.2 match-v5가 Mayhem 경기를 기록하는가 — **아니오 (의도적 차단)**

- ✅ GitHub 공식 developer-relations 이슈 #1109 "[BUG][LoL][match-v5] ARAM: Mayhem matches return 403 Forbidden" (2025-10-22 개설, 2025-12-18 closed):
  - URL: https://github.com/RiotGames/developer-relations/issues/1109 (GitHub API로 본문+댓글 전체 확인)
  - 댓글 타임라인 (원문 인용):
    - 1337MARCEL (2025-10-22): "Asked Riot about it yesterday and they said it's unfortunately **intended**."
    - geozukunft (2025-11-10): "Riot confirmed that ARAM: Mayhem data is **not publicly available**. People can check it out in the client but that's it"
    - geozukunft (2025-11-11): "...going forward they seem to **no longer intend to make the data for new rotating game modes publicly available**" (Doom Bots도 공지 없이 차단됐었다고 언급)
    - lucasMesquitaBorges (2025-12-18, 이슈 종료 코멘트): "Expected behavior. **Mayhem matches are private.**"
    - Cypherous (2026-03-31): "No, its private, **there are no plans for that to change** that anyone is aware of"
  - 차단 이유(커뮤니티 전언): 집계 사이트가 승률 메타를 "풀어버리는" 것을 막고 실험적 플레이를 유도하기 위함.
- ✅ 완화 요청 이슈 #1154 "Release ARAM Mayhem match data on API without win/loss stats" — 승패 제외하고 증강/아이템/KDA만이라도 달라는 요청. Riot 스태프 공식 답변 없음, 미해결.
  - URL: https://github.com/RiotGames/developer-relations/issues/1154
- ✅ 서드파티 실증: aramstats.lol 공지(2026-06-23): "Aramstats is currently unable to provide data for Mayhem games due to it being unavailable in the Riot API."
  - URL: https://aramstats.lol/updates
- 결론: **개인 API 키로도, 프로덕션 키로도 Mayhem matchId 조회는 403.** (이번 조사에서는 API 키 없이 문헌으로만 확인 — 직접 호출은 ❓)

### 1.3 playerAugment 필드

- ✅ match-v5 ParticipantDto에는 `playerAugment1` ~ `playerAugment6` 필드가 존재 (Arena용으로 추가된 필드; `playerSubteamId`, `subteamPlacement`도 존재).
  - 확인 소스: 커뮤니티 유지 공식 스키마 미러 https://raw.githubusercontent.com/MingweiSamuel/riotapi-schema/gh-pages/openapi-3.0.0.min.json (직접 grep 확인)
  - 공식 레퍼런스: https://developer.riotgames.com/apis#match-v5 (JS 렌더링 페이지라 fetch 확인은 못함 ❓ — 독립 검증 2026-09-02에서도 동일하게 페이지 내용 확인 불가)
  - ✅ 보강(독립 검증 2026-09-02): 스키마 미러 live 파일에서 `playerAugment1`~`playerAugment6`, `playerSubteamId`, `subteamPlacement` 전부 grep 재확인. 추가 근거: 공식 developer-relations 이슈 #754 "[BUG][DOCS] undocumented match-v5.ParticipantDto fields"(open)에 playerAugment1~4가 문서 누락 필드로, 2024-06-11 업데이트로 playerAugment5/6이 응답에 추가됐다고 기록됨 — 즉 **실제 응답에는 존재하지만 공식 레퍼런스 문서에는 누락되어 있을 수 있음**. https://github.com/RiotGames/developer-relations/issues/754
- ❓ **Mayhem 경기에서 이 필드가 채워지는지는 확인 불가** — 경기 자체가 403이므로. (Arena에서는 이 필드에 augment id가 들어가며, 그 id는 아래 CommunityDragon `AugmentPlatformId`/`id`와 동일 체계)
- 참고: Arena조차 증강 메타데이터 매핑이 공식 제공되지 않아 이슈 제기됨: https://github.com/riotgames/developer-relations/issues/1157

### 1.4 우회로: 로컬 클라이언트 (참고)

- LCU(League Client API, 로컬 lockfile 인증): Riot 확인 코멘트대로 "클라이언트에서는 볼 수 있음" — 즉 로컬에서 본인 계정의 Mayhem 전적(증강 포함)을 LCU 전적 엔드포인트로 읽는 것은 가능할 것으로 보임 ❓(이번 조사에서 미실증. 클라이언트 실행 필요, 본인 전적 한정, 비공식 인터페이스).
- Live Client Data API (`https://127.0.0.1:2999/liveclientdata/allgamedata`, 게임 실행 중): Mayhem에서 증강 노출 여부 ❓ 미확인.
- op.gg가 "A.R.A.M Mayhem Augment Tier Overlay"(데스크톱 앱 오버레이)를 제공하는 것으로 보아 앱들이 클라이언트에서 데이터를 읽는 것은 실무적으로 성립하는 접근 (https://op.gg/lol/modes/aram-mayhem).

---

## 2. Data Dragon (공식 정적 데이터 CDN)

- ✅ 버전 목록: https://ddragon.leagueoflegends.com/api/versions.json → 현재 최신 `"16.17.1"` (게임 패치 26.17에 대응. 2025년부터 패치명은 25.x/26.x, ddragon 버전은 15.x/16.x로 10 차이가 남 — 주의)
- ✅ 챔피언 (한국어): https://ddragon.leagueoflegends.com/cdn/16.17.1/data/ko_KR/champion.json (200, 214KB)
- ✅ 챔피언 전체(스킬 포함): https://ddragon.leagueoflegends.com/cdn/16.17.1/data/ko_KR/championFull.json (200, 2.5MB) — 개별 챔피언은 `champion/Ahri.json`
- ✅ 아이템 (한국어): https://ddragon.leagueoflegends.com/cdn/16.17.1/data/ko_KR/item.json (200, 731KB)
- ✅ 이미지: https://ddragon.leagueoflegends.com/cdn/16.17.1/img/champion/Ahri.png (200) — 아이템은 `img/item/{id}.png`
- ❌ **증강 데이터는 Data Dragon에 없음.** Arena 증강도 처음부터 ddragon에 실리지 않았고, Mayhem 증강도 없음. `https://static.developer.riotgames.com/docs/lol/augments.json` 은 403 AccessDenied (직접 확인 — 존재하지 않음).
- 문서: https://riot-api-libraries.readthedocs.io/en/latest/ddragon.html

---

## 3. CommunityDragon — 핵심. Mayhem 증강 데이터가 전부 여기 있다

기본 지식: `raw.communitydragon.org/{patch|latest|pbe}/...`. 클라이언트(LCU) 데이터는 `/plugins/rcp-be-lol-game-data/`, 게임 파일은 `/game/`. `lol-game-data` 에셋 경로는 **소문자로 바꿔** `plugins/rcp-be-lol-game-data/global/default/` 뒤에 붙이면 URL이 된다. (문서: https://www.communitydragon.org/documentation/assets)

### 3.1 내부 코드네임: KIWI

- ✅ ARAM: Mayhem의 내부 코드네임은 **Kiwi** (Arena=Cherry, Swarm=Strawberry에 이은 과일 네이밍). 출처: LoL 공식 위키 https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem + 아래 파일들의 실데이터로 교차 확인.
- ✅ 증거: 게임 파일에 `game/clientstates/gameplay/ux/lol/kiwi/kiwiplayeraugments...`, `kiwiaugmentselection...` UI 번들 존재 (files.exported.txt에서 확인), `v1/kiwi-hub.json` 존재(현재 내용은 빈 파일 2바이트).

### 3.2 증강 목록/레지스트리 (플러그인 데이터, JSON)

- ✅ **`augment-lists.json` — 모드별 증강 목록** (직접 파싱 확인)
  - URL: https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/augment-lists.json
  - 구조: `[{ "modeName": "CHERRY"|"KIWI"|"KIWI_JADE", "augmentList": ["Maps/ModeSpecificData/Augments/ARAM_BigBrain", ...] }]`
  - 개수: CHERRY 44 / **KIWI 222** / KIWI_JADE 188 ("KIWI_JADE"는 미공개 신모드 'Jade'용 변형 목록으로 보임 ❓ — Jade 모드 자체가 공개 정보 없음. queues.json에 "1v1~5v5 Jade", "Jade Sydney" 큐 다수, `v1/jade-champions.json`, `jade-items.json` 등 존재)
- ✅ **`cherry-augments.json` — 증강 마스터 레지스트리 (이름이 cherry지만 Mayhem 포함 전 모드 공용)** (직접 파싱 확인)
  - URL(영어): https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/cherry-augments.json (200, 142KB)
  - URL(한국어): https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/ko_kr/v1/cherry-augments.json (200, 한국어 이름 확인: ADAPt→"적응형 능력치")
  - 총 657개 엔트리. 엔트리 구조:
    ```json
    {
      "id": 1205,                        // = match-v5 playerAugment 계열 id = AugmentPlatformId
      "augmentNameId": "ARAM_ADAPt",     // 내부 문자열 id
      "nameTRA": "ADAPt",                // 표시 이름 (로케일별)
      "simpleNameTRA": "",
      "augmentSmallIconPath": "/lol-game-data/assets/ASSETS/UX/Cherry/Augments/Icons/ADAPt_small.png",
      "rarity": "kSilver"                // kBronze|kSilver|kGold|kPrismatic|kEventChoice
    }
    ```
  - **KIWI 222개 증강의 augmentNameId가 전부 이 파일에 존재함을 집합 비교로 확인** (차집합 0). Mayhem 증강 id 범위는 1001~12317 산재.
  - 전체 희귀도 분포(657개): kSilver 195, kGold 228, kPrismatic 195, kEventChoice 25, kBronze 14.
  - 한계: **설명(툴팁) 텍스트가 없음.** 설명은 3.3 + 3.4로 해결.

### 3.3 증강 전체 정의 (게임 bin → JSON 변환본)

- ✅ **`kiwi.bin.json` — Mayhem 증강 222개의 완전한 정의** (12.1MB, 직접 다운로드/파싱 확인)
  - URL: https://raw.communitydragon.org/latest/game/maps/modespecificdata/kiwi.bin.json
  - 패치 고정 버전도 작동: https://raw.communitydragon.org/16.17/game/maps/modespecificdata/kiwi.bin.json ✅
  - `"__type":"AugmentData"` 엔트리 222개. 예시 (ARAM_BigBrain):
    ```json
    {
      "AugmentNameId": "ARAM_BigBrain",
      "NameTra": "Kiwi_ARAM_BigBrain_Name",        // 번역 키
      "DescriptionTra": "Kiwi_BigBrain_Summary",   // 번역 키 (설명)
      "AugmentTooltipTra": "Kiwi_BigBrain_Tooltip",
      "RootSpell": "Maps/.../Augment_ARAM_BigBrain",  // 수치(@Cooldown@ 등)의 원천
      "AdditionalSpells": [...],
      "mAugmentTags": 2, "mBuildTags": 32,
      "AugmentLargeIconPath": "assets/ux/cherry/augments/icons/bigbrain_large.tex",
      "AugmentSmallIconPath": "assets/ux/cherry/augments/icons/bigbrain_small.tex",
      "AugmentDisplayTags": [3],
      "rarity": 1,                                  // 0(생략)=Silver, 1=Gold, 2=Prismatic
      "AugmentPlatformId": 1180                     // = cherry-augments.json의 id
    }
    ```
  - ✅ rarity 정수↔문자열 매핑을 222개 전수 대조로 확인: **0/생략=kSilver(62), 1=kGold(86), 2=kPrismatic(74)** — 어긋나는 항목 0개.
  - 스펠 데이터(RootSpell 하위)에 쿨다운·계수 등 실수치가 들어 있어, 툴팁의 `@변수@`를 채우려면 이 파일 안의 스펠 정의를 파싱해야 함(난이도 높음).
- ✅ `kiwi_jade.bin.json` (10.5MB): https://raw.communitydragon.org/latest/game/maps/modespecificdata/kiwi_jade.bin.json — 같은 구조, Jade 모드용 188개 대상 ❓(모드 미공개).
- 참고: Arena용은 `cherry.bin.json`이 아니라 예전부터 가공본이 따로 있음(3.5).

### 3.4 번역 문자열 (설명 텍스트의 실체)

- ✅ **한국어 스트링테이블**: https://raw.communitydragon.org/latest/game/ko_kr/data/menu/en_us/lol.stringtable.json (200, 35.6MB — 경로에 `en_us`가 들어가지만 내용은 ko_kr임에 주의. 직접 확인)
  - 구조: `{"entries": {"<소문자 번역 키>": "<텍스트>"}}` — **키가 전부 소문자로 변환되어 있음**: `Kiwi_ARAM_Sonata_Summary` → `kiwi_aram_sonata_summary`
  - 실측 예:
    - `"kiwi_sonata_name": "소나타"`
    - `"kiwi_aram_legday_name": "하체 운동의 날"`
    - `"kiwi_aram_sonata_summary": "@Cooldown@초마다 <spellName>인내의 아리아</spellName>와 <spellName>기민함의 노래</spellName>를 번갈아 <keywordMajor>자동 사용</keywordMajor>합니다..."` — `@Cooldown@` 같은 플레이스홀더는 kiwi.bin.json의 스펠 데이터에서 값을 가져와야 완성됨
  - ✅ **영어 스트링테이블**: https://raw.communitydragon.org/latest/game/en_us/data/menu/en_us/lol.stringtable.json (200, `"kiwi_sonata_name":"Sonata"` 확인 — 독립 검증 2026-09-02). 한국어와 같은 `game/<locale>/data/menu/en_us/lol.stringtable.json` 패턴. ⚠️ 로케일 디렉토리를 생략한 기본 경로(`game/data/menu/en_us/lol.stringtable.json`)는 **404** — 직접 fetch로 확인(2026-09-02), 반드시 로케일 디렉토리(`en_us/`)를 포함할 것.

### 3.5 "친절한 가공본"(arena/en_us.json 스타일)은 Mayhem용이 **없다**

- ✅ Arena용 가공본은 존재: https://raw.communitydragon.org/latest/cdragon/arena/en_us.json (200, 521KB — 설명까지 병합된 친절한 JSON. 한국어판 https://raw.communitydragon.org/latest/cdragon/arena/ko_kr.json 도 200)
  - 단, 이 파일에 "ARAM_" 증강은 0개 — **Arena 전용**임을 직접 확인.
- ❌ `latest/cdragon/` 및 `pbe/cdragon/` 디렉토리에는 `arena/`와 `tft/`만 있고 **`mayhem/`·`kiwi/` 가공본은 없음** (디렉토리 리스팅 직접 확인, 2026-09-02 기준).
- 즉 Mayhem은 3.2+3.3+3.4를 직접 조합해야 한다.

### 3.6 챔피언/아이템/스킬 (CommunityDragon)

- ✅ 챔피언 요약: https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/ko_kr/v1/champion-summary.json (200)
- ✅ 챔피언 상세(스킬 포함, 한국어): https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/ko_kr/v1/champions/103.json (200, "아리" 확인)
- ✅ 아이템(한국어): https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/ko_kr/v1/items.json (200, 720KB)
- 기타: `v1/perks.json`(룬), `v1/summoner-spells.json`, `v1/maps.json`, `v1/queues.json` 등 동일 디렉토리에 존재 (리스팅 확인)
- 디렉토리 인덱스: https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/ ✅

---

## 4. 증강 아이콘 이미지 에셋 경로

두 가지 경로 체계가 모두 작동 (Mayhem 신규 증강 아이콘은 `kiwi/` 폴더, Arena에서 재사용된 증강은 `cherry/` 폴더):

- ✅ 플러그인 경로 (cherry-augments.json의 `augmentSmallIconPath`를 소문자 변환):
  - https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/ux/cherry/augments/icons/adapt_small.png (200, image/png)
  - https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/ux/kiwi/augments/icons/sonata_small.png (200)
- ✅ 게임 경로 (kiwi.bin.json의 `Augment{Large|Small}IconPath`에서 `.tex`→`.png`로 바꿔 `/latest/game/` 밑에):
  - https://raw.communitydragon.org/latest/game/assets/ux/kiwi/augments/icons/sonata_large.png (200, 9.3KB)
  - https://raw.communitydragon.org/latest/game/assets/ux/cherry/augments/icons/adapt_large.png (200)
- 규칙 요약: bin의 `assets/ux/kiwi/augments/icons/X_large.tex` → `https://raw.communitydragon.org/latest/game/` + 소문자 경로 + 확장자 `.png`.
- 아이콘 크기: `_small`(선택 UI용), `_large` 2종.

---

## 5. 커뮤니티 정리 데이터

### 5.1 LoL 공식 위키 (최고의 지름길) ✅

- ✅ **`Module:MayhemAugmentData/data`** — 증강 이름→{설명(위키텍스트), tier} Lua 테이블. **225개** (Silver 64 / Gold 85 / Prismatic 76; 게임 파일 222개와의 차이는 비활성화/로테이션 증강 포함 때문으로 추정 ❓)
  - Raw 취득 (200, 111KB 직접 확인): https://wiki.leagueoflegends.com/en-us/Module:MayhemAugmentData/data?action=raw
  - MediaWiki API도 작동 (200 직접 확인): https://wiki.leagueoflegends.com/en-us/api.php?action=query&titles=Module:MayhemAugmentData/data&prop=revisions&rvprop=content&rvslots=main&format=json
  - 사람이 보는 페이지: https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Augments
  - 라이선스: **CC BY-SA 3.0** (페이지 푸터에서 직접 확인) — 출처표시+동일조건변경허락 지키면 사용 가능
  - 단점: 설명이 위키텍스트 템플릿({{as|...}}, {{tip|...}}) 형태라 렌더링 파서 필요, 영어만 있음, 숫자 id 매핑 없음(이름으로 cherry-augments.json과 조인해야 함).

### 5.2 통계 사이트 (승률/픽률) — 전부 수집 방법 비공개

- arammayhem.com — 패치 26.17 기준 증강 199개 승률/픽률, 챔피언 172개 빌드 게시. **데이터 출처/표본/방법론 미공개** ❓ (https://arammayhem.com/augments/stats/ 직접 확인). GitHub의 arammayhem/aram-mayhem-data 레포는 SEO용 링크 인덱스일 뿐 실데이터 없음 (https://github.com/arammayhem/aram-mayhem-data 확인).
- u.gg — ARAM Mayhem 증강 티어리스트 https://u.gg/lol/aram-mayhem-augment-tier-list, 챔피언 티어 https://u.gg/lol/aram-mayhem-tier-list (26.17)
- op.gg — https://op.gg/lol/modes/aram-mayhem + 데스크톱 앱 "Augment Tier Overlay"
- blitz.gg — https://blitz.gg/lol/aram-mayhem-augments
- aramgg.com — https://aramgg.com/en/new-augments, "매일 갱신되는 매치 통계" 주장
- **API가 403인데 이들이 승률을 내는 방법**: 공식 설명 없음. 자사 데스크톱 앱 사용자들의 클라이언트(LCU 전적/게임 종료 화면)에서 수집하는 것으로 추정 ❓ — op.gg·blitz·u.gg 모두 상시 실행형 데스크톱 앱 보유. 이 사이트들의 데이터를 API로 받아올 공개 엔드포인트는 없음 ❓.
- 반례: aramstats.lol은 Riot API만 쓰기 때문에 "Mayhem 데이터 제공 불가"라고 명시 (https://aramstats.lol/updates, 2026-06-23).

### 5.3 개발자 참고 자료

- DarkIntaqt의 Arena 증강 ID 매핑 가이드 (방법론이 Mayhem에도 그대로 적용됨, Mayhem 자체는 다루지 않음): https://darkintaqt.com/blog/arena-augments
- Riot API 스키마 미러 (playerAugment1~6 확인용): https://github.com/MingweiSamuel/riotapi-schema → https://raw.githubusercontent.com/MingweiSamuel/riotapi-schema/gh-pages/openapi-3.0.0.min.json ✅
- Meraki Analytics 보강 데이터(아이템/챔피언, 증강 없음): https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/items.json ✅ (200 확인)
- CommunityDragon 문서/툴킷: https://github.com/CommunityDragon/Docs , https://github.com/communitydragon/cdtb
- ❓ Mayhem 증강을 정리한 독립 GitHub 데이터 레포는 검색으로 발견하지 못함 (2026-09-02 기준 — namu.wiki는 조사 대상에서 유의미한 결과 없음).

---

## 6. 라이선스 / 이용 조건

| 소스 | 조건 | 근거 |
|---|---|---|
| Riot API / Data Dragon | 개발자 포털 가입 + 제품 등록/심사 필요(프로덕션). "isn't endorsed by Riot Games..." 고지 필수. 유료장벽 뒤에 데이터 잠금 금지, 무료 티어 필수, 게임 제작·도박·치트 금지 | https://developer.riotgames.com/policies/general ✅ |
| Data Dragon 정적 파일 | 위 정책의 "approved static assets"로 명시(Data Dragon, TFT/LOR Assets) — API 키 없이 다운로드 가능하나 이용은 같은 정책 적용 | 동일 |
| CommunityDragon | 비공식 커뮤니티 프로젝트. 에셋 저작권은 Riot에 있으며 Riot "Legal Jibber Jabber"(팬 콘텐츠 정책) 하에서 운영. "Riot Games does not endorse or sponsor this project". 별도 키 불필요. 대량 다운로드 시 patch 고정 URL 권장(`/16.17/`) | https://www.communitydragon.org/documentation/assets ✅, https://www.riotgames.com/en/legal |
| LoL 공식 위키 | 텍스트 **CC BY-SA 3.0** (출처 표시 + 동일 라이선스 유지). 게임 이미지 자체는 Riot 저작물 | 위키 푸터 ✅ |
| 통계 사이트(op.gg 등) | 각사 약관. 무단 스크래핑은 약관 위반 소지. 공개 API 없음 | ❓ |

---

## 7. 실전 권장 파이프라인 (요약)

1. **증강 마스터 테이블 만들기**: `cherry-augments.json`(ko_kr) 657개 중 `augment-lists.json`의 KIWI 222개 목록으로 필터 → `{id, augmentNameId, 한국어이름, 아이콘, 희귀도}` 확보. (모두 ✅ 검증된 URL)
2. **설명 붙이기 (택1)**:
   - (쉬움) 위키 `Module:MayhemAugmentData/data` raw를 이름으로 조인 — 영어, CC BY-SA 3.0, 위키텍스트 파싱 필요.
   - (정확·한국어) `kiwi.bin.json`의 `DescriptionTra` 키를 소문자화 → `ko_kr .../lol.stringtable.json`의 entries에서 조회 → `@변수@`는 kiwi.bin.json 스펠 데이터로 치환.
3. **아이콘**: `https://raw.communitydragon.org/latest/game/` + 소문자화한 IconPath(.tex→.png).
4. **챔피언/아이템**: Data Dragon 16.17.1 (ko_KR) 또는 cdragon ko_kr v1.
5. **경기/통계 데이터**: 공식 경로 없음(403). 본인 전적은 로컬 LCU로 시도(❓), 대규모 통계는 현재 불가능하거나 자체 클라이언트 수집 필요.
6. 패치가 바뀌면 `latest` 대신 `https://raw.communitydragon.org/16.17/...` 처럼 버전 고정 후 갱신 감지(ddragon versions.json 폴링).

---

## 8. 미확인 사항 (open questions)

1. Mayhem 경기가 match-v5에서 열릴 경우 `playerAugment1~6`에 실제로 증강 id가 들어가는지 (경기 데이터가 403이라 실증 불가).
2. 라이브 큐가 2400/2401/2403/2405 중 정확히 어떤 번호로 기록되는지 (공식 문서상 2400만 등재).
3. arammayhem.com·u.gg·op.gg의 승률 데이터 수집 방법 (데스크톱 앱 클라이언트 수집 추정, 공식 확인 없음).
4. LCU 로컬 API로 본인 Mayhem 전적(증강 포함)을 읽을 수 있는지의 실증 및 정확한 엔드포인트.
5. Live Client Data API(포트 2999)에 게임 중 증강 정보가 노출되는지.
6. "KIWI_JADE"/"Jade" 모드의 정체 (공개 정보 전무 — 미출시 모드로 추정).
7. ~~영어 스트링테이블의 정확한 기본 경로~~ → **해결됨(독립 검증 2026-09-02)**: `https://raw.communitydragon.org/latest/game/en_us/data/menu/en_us/lol.stringtable.json` (200). 로케일 생략 경로(`game/data/menu/...`)는 404.
8. 위키 225개 vs 게임 파일 222개 증강 수 차이의 정확한 사유 (비활성 증강 포함 여부).
