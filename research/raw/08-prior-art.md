# 08. 기존 도구 조사 — 선행 사례와 차별점 (Prior Art)

- 조사일: 2026-09-02 (현재 LoL 패치 26.17 기준 데이터가 각 사이트에 표시됨)
- 조사 방법: WebSearch + WebFetch (영어/한국어 병행). u.gg, metasrc, bravery.lol, fmkorea는 직접 fetch가 403/429로 막혀 검색 스니펫으로 대체함 (해당 항목에 표기).
- 우리가 만들려는 것: **챔피언별 3+3 리롤 랜덤 증강 시뮬레이션 + 뽑힌 조합에 맞는 "꿀잼" 플레이스타일/아이템 추천**

---

## 0. 기준점: 실제 게임의 증강 선택 메커니즘 (시뮬레이터 정합성 근거)

LoL 공식 위키(ARAM: Mayhem) 기준:

- 증강은 **레벨 3, 7, 11, 15에서 총 4회** 선택. 매 선택마다 **3개 제시 중 1개 선택**.
- **선택 화면당 리롤 1회** 가능 — 리롤하면 같은 등급의 다른 증강으로 교체. 즉 실질적으로 **최대 3+3=6개 후보**를 보게 됨 → 우리 컨셉 "3+3 리롤"은 실제 게임 규칙과 정확히 일치.
- "Golden Reroll"이라는 특수 리롤로 **상위 희귀도** 증강을 받을 수도 있음.
- 같은 선택 화면에서는 **모든 플레이어에게 동일한 희귀도(실버/골드/프리즘)** 가 제시되며, 희귀도 자체는 매번 랜덤. 단 **1번째와 2번째 선택 화면이 둘 다 실버일 수는 없음** — 시뮬레이터의 희귀도 배정 로직에 반영해야 할 제약.
- 모드 출시: 2025-10-22 (Trials of Twilight Act II와 함께), 압도적으로 긍정적인 반응으로 운영 기간 연장됨. 2026-09 현재도 각 통계 사이트가 26.17 패치 데이터를 갱신 중이므로 라이브 상태로 판단(상시 모드 여부 자체는 미확인).
- 출처: https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem , 증강 전체 목록: https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Augments , 데이터 모듈: https://wiki.leagueoflegends.com/en-us/Module:MayhemAugmentData/data , 공식 안내: https://support-leagueoflegends.riotgames.com/hc/en-us/articles/45460878435987

2026-02-04 대규모 업데이트(게임플 기사): **신규 증강 45개 추가**, **9가지 테마별 "증강 세트"**(같은 세트 증강 2개 이상 모으면 단계별 보너스, 최대 4단계), **"아수라장 진척도 트랙"**(플레이할수록 신규 증강 해금 + 시작 골드/영약/보상). → 시뮬레이터가 "세트 시너지"까지 표현하면 차별화 요소가 하나 더 생김.
- 출처: https://www.gameple.co.kr/news/articleView.html?idxno=214955

---

## 1. Mayhem 증강 관련 해외 사이트별 제공 기능

### 1-1. arammayhem.com — 가장 기능이 많은 전업 사이트
- 챔피언 티어리스트(S+ GOD TIER 등 등급제, 챔피언별 승률 표시, 순위 변동 화살표), 챔피언별 빌드(Builds), 증강 승률/픽률(Augments — 예: Transmute: Prismatic 65.37% 승률 표시), 증강 세트(Augment Sets), **챔피언+증강 콤보 페이지(Combos — 예: Brand+Infernal Conduit, 시너지 설명 포함, 666개 큐레이션 콤보)**, 패치노트/스탯 변경 추적.
- **도구/미니게임 섹션이 존재** (https://arammayhem.com/games/ 확인, 총 9종):
  1. AramMayhemBTI / LeagueBTI — 성격 테스트류
  2. **Ryze Infinite Engine** — 라이즈 무한 스케일링 빌드 시뮬레이터(증강+아이템 설정, 루프 팩터 계산)
  3. **Vladimir Blood Lord Simulator** — 블라디 스택/아이템 조합 능력치 계산기
  4. Sett W Damage Calculator
  5. Augment Quiz(아이콘 보고 이름 맞추기), Speed Challenge(60초 증강 식별), Synergy Master(챔피언-최고승률 증강 매칭 게임), Rarity Challenge(등급 맞추기)
- **핵심: "랜덤 증강 드래프트/룰렛 시뮬레이터"는 없음.** 시뮬레이터는 특정 챔피언(라이즈/블라디)의 수치 계산기이고, 미니게임은 지식 퀴즈임. "재미 도구" 시장이 존재한다는 것을 이 사이트가 증명하지만, 우리 컨셉과 직접 겹치는 도구는 없음.
- 출처: https://arammayhem.com/ , https://arammayhem.com/games/ , https://arammayhem.com/augments/ , https://arammayhem.com/augments/stats/ , https://arammayhem.com/tools/ryze-simulator/ , https://arammayhem.com/build/swain/

### 1-2. u.gg — 데이터 사이언스 기반 통계 (직접 fetch 403, 스니펫 기반)
- 증강 티어리스트 페이지(패치별 상시 갱신, "data science approach"): https://u.gg/lol/aram-mayhem-augment-tier-list
- 모드 개요/티어리스트 뉴스 기사: https://u.gg/lol/news/aram-mayhem-tier-list
- **챔피언별 Mayhem 빌드+증강 페이지 존재** (예: "The best ARAM Mayhem Augments for Twitch are Critical Missile, Scopier Weapons, Blunt Force"): https://u.gg/lol/champions/aram-mayhem/twitch-aram-mayhem , https://u.gg/lol/champions/aram-mayhem/brand-aram-mayhem
- 시뮬레이터/룰렛 기능: 발견되지 않음(미확인이지만 언급 자체가 없음).

### 1-3. op.gg — 모드 허브 + 챔피언별 증강 탭 + 오버레이
- Mayhem 모드 허브(챔피언 티어리스트): https://op.gg/lol/modes/aram-mayhem
- 챔피언별 페이지에 Build/Runes/Skills/Items 탭 + **증강 탭**(All/Silver/Gold/Prism 필터): https://op.gg/lol/modes/aram-mayhem/ashe/augments , https://op.gg/lol/modes/aram-mayhem/rumble/augments
- 직접 fetch 시 증강 아이콘/이름과 필터 구조만 확인됨 — **증강별 승률 수치는 JS 렌더링이라 fetch로는 미확인**(구조상 제공할 가능성 높음).
- "A.R.A.M Mayhem 증강 티어 오버레이" **데스크톱 오버레이 다운로드**를 노출 — 인게임 선택 화면에서 티어를 띄워주는 방식.
- 시뮬레이터/룰렛: 없음.

### 1-4. METAsrc — 패치별 아카이브형 통계 (직접 fetch 403, 스니펫 기반)
- Mayhem 증강 티어리스트(티어 랭킹, 픽률, **희귀도 필터**, 게임 표본 수): https://www.metasrc.com/lol/mayhem/tier-list/augments
- 챔피언 티어리스트 + 패치별 과거 데이터 URL 보존(26.04, 26.06 등): https://www.metasrc.com/lol/mayhem/tier-list , https://www.metasrc.com/lol/mayhem
- **"Mayhem Classic-ish"라는 변형 모드 페이지도 별도 운영**(26.16): https://www.metasrc.com/lol/mayhem-classic/tier-list/augments → Mayhem이 변형 이벤트를 거치고 있다는 신호.
- 상위 증강 예시(26.17): Draw Your Sword(프리즘) 58.32%, High Roller 57.81%, Windspeaker's Blessing 57.02%.
- 시뮬레이터/룰렛: 없음.

### 1-5. Mobalytics — 전문가 큐레이션 티어리스트
- Mayhem 티어리스트(Game Experts가 수동 관리, 순수 통계가 아닌 큐레이션): https://mobalytics.gg/lol/tier-list/mayhem
- 모드 가이드: https://mobalytics.gg/lol/aram-mayhem
- 시뮬레이터/룰렛: 없음.

### 1-6. Blitz.gg — 인게임 오버레이가 핵심 차별점
- Mayhem 증강 티어리스트(hand-crafted): https://blitz.gg/lol/aram-mayhem-augments , 챔피언 티어리스트: https://blitz.gg/lol/tierlist/aram-mayhem
- 챔피언별 Mayhem 빌드+추천 증강(예: Garen — Back To Basics, Goliath, Mad Scientist): https://blitz.gg/lol/champions/Garen/aram-mayhem
- **데스크톱 앱 오버레이: 증강 선택 순간에 티어리스트를 인게임으로 표시** ("right in your game as you pick augments"). Arena 증강도 동일 지원: https://blitz.gg/overlays/lol , https://blitz.gg/lol/arena-augments
- 한국어 페이지도 있음(칼바람 대혼란 표기): https://blitz.gg/lol/champions/Leblanc/aram-mayhem
- 시뮬레이터/룰렛: 없음.

### 1-7. 기타 전업/니치 사이트
- **ARAMKit** (https://aramkit.com/en-US/augments): 증강별 승률/픽률/티어(S~D) + **스테이지(1~4)별, 희귀도별 집계** + 상위 레벨 구간 필터. 예: Draw Your Sword S 58.0%/1.4%, High Roller S 57.3%/4.3%. "Champion Fits" 표방(증강→어울리는 챔피언). 시뮬레이터 없음.
- **aramgg.com** (https://aramgg.com/en/augments): 패치 26.17, **207개 증강, 데이터 출처가 "Tencent China public statistics"** 라고 명시. 증강별 승률 + 추천 챔피언 아이콘 6개 표시. 빌드 상세설명·시뮬레이터 없음. 가이드 글도 운영: https://aramgg.com/en/blog/what-is-aram-mayhem-guide
- **mayhemmeta.com** (https://mayhemmeta.com/): 챔피언 S~D 티어, 승률순 Top 10 증강, 238,130게임 분석 표기, 패치별(26.15~26.17) 아카이브. 시뮬레이터 없음. 증강 페이지: https://mayhemmeta.com/augments
- **arammayhem.wiki** (https://arammayhem.wiki/tier-list): 승률/픽률 기반 증강 티어리스트, 희귀도 필터/검색.
- **aramtheory.com** (https://www.aramtheory.com/gold-augment-tierlist): 수기 가이드형 골드 증강 티어리스트.
- **games.gg** (https://games.gg/league-of-legends/guides/aram-mayhem-augment-tier-list-set-combos/), **esports.net** (https://www.esports.net/wiki/guides/lol-mayhem-augments-tier-list/), **sheepesports** (https://www.sheepesports.com/en/articles/aram-mayhem-how-to-play-tips-augment-suggestions-and-more/en), **aussyelo** (https://www.aussyelo.com/blog/aram-mayhem-guide-best-augments-tier-list): 기사/가이드형 티어리스트(도구 아님).

---

## 2. 한국어 사이트/자료

### 2-1. 증바람.com (xn--4i2by9f8qo.com) — 이 프로젝트의 기존 자산으로 추정
- 검색 결과 표기 기준: 증강별 승률·픽률·티어 + 챔피언 통계 + 전적검색, "op.gg에 없는 아수라장 전용 실시간 매치 데이터" 표방.
- 직접 fetch로 확인된 것: 챔피언 티어(픽률 대비 승률·표본 보정, OP/1~5티어), 기간 필터(최근 7/14/28일/전체), 메뉴(서포터 다운로드 / 증강 정보 / 커뮤니티 / 패치노트), 데이터는 Riot Match-V5 API 수집, 챔피언별 빌드 페이지(예: /champion/Smolder, /champion/Xayah).
- **"증바람 서포터"**: 전적검색 + **인게임 챔피언별 증강 추천 데스크톱 앱**(표본 보정 승률 기준 티어, 같은 등급 내 순위를 카드에 표시, 유저 실데이터 익명 수집): https://xn--4i2by9f8qo.com/download
- **시뮬레이터/룰렛 기능은 현재 없음** → 이번에 만들려는 것이 이 갭을 채움.
- 출처: https://xn--4i2by9f8qo.com/ , https://xn--4i2by9f8qo.com/download

### 2-2. aram-mayhem.com — 한국어 경쟁 사이트
- 한국어. 챔피언 티어, 증강 티어, 소환사 전적검색("내 기록 요약/진단"), 챔피언·증강·아이템·조합 통계, 일/월/패치 단위 스냅샷 비교, 아군·상대 챔피언/증강 연관 분석, 조합 추천, **칼바람 분석기 + OBS 방송용 오버레이 다운로드**까지 제공.
- 시뮬레이터/룰렛: 명시 없음.
- 출처: https://aram-mayhem.com/

### 2-3. 커뮤니티/위키 자료 (도구가 아닌 문서형)
- 나무위키: 증강 문서 트리 — 전체 개요(https://namu.wiki/w/리그%20오브%20레전드/증강), 프리즘 등 등급별 하위 문서, **"챔피언별 추천 조합" 문서**(https://namu.wiki/w/리그%20오브%20레전드/증강/챔피언별%20추천%20조합) — 크라우드 소싱 텍스트로 챔피언별 증강 조합을 정리. 직접 fetch 불가(차단)라 세부 구성은 미확인이나, "챔피언별 조합 추천"이라는 우리 기획의 문서형 선행 사례.
- 에펨코리아: "칼바람 증강 설명 사이트 꿀팁" 게시글(https://www.fmkorea.com/9088484275 — fetch 429로 본문 미확인), PBE 증강 시너지 정리글(https://www.fmkorea.com/9411413057) 등 — 유저들이 외부 사이트를 찾아 공유할 만큼 정보 수요가 큼.
- 개인 블로그 티어 정리: https://beforeforget.co.kr/450 , https://beforeforget.co.kr/462 (S/A/B/C/D 분류, 2026 메타).
- 참고: 한국 커뮤니티에서 이 모드를 "증바람"이라는 애칭으로 부르는 용례가 검색에서 다수 확인됨(예: fmkorea 게시글 제목 "PBE 아수라장 (증바람) 증강 시너지") — 도메인 네이밍과 검색 유입에 유리.

### 2-4. 한국어 "증강 시뮬레이터/룰렛" 검색 결과
- "증강 룰렛", "증강 시뮬레이터", "칼바람 대혼란 증강 시뮬레이터 룰렛" 등으로 검색했으나 **도구는 발견되지 않음**. 검색에 걸리는 "룰렛"은 전부 증강 이름 "눈덩이 룰렛(Snowball Roulette)"임.
- 결론: **한국어권에 랜덤 증강 시뮬레이터류 도구는 부재** (2026-09-02 검색 기준).

---

## 3. 랜덤/재미 도구 계열 (장르 선행 사례)

우리 기획의 "랜덤 뽑기+재미" DNA는 LoL 커뮤니티에서 오래된 장르임:

- **Ultimate Bravery** — 챔피언/역할/아이템/룬/스펠/스킬 순서를 전부 랜덤으로 뽑아 그대로 플레이하는 챌린지 문화 + 전용 생성기 사이트들:
  - https://bravery.lol/ (모던 리빌드, 모바일 대응, 최신 패치 자동 반영; 직접 fetch 403) / https://bravery.lol/classic/
  - https://ultimate-bravery.net/ (챔피언, 역할, 아이템 경로, 스펠, 룬, 스킬 순서 롤)
  - https://lols.gg/en/randomizer/bravery/
  - 오픈소스 구현: https://github.com/Bravify/Bravify
  - 장르 설명: https://customlol.fandom.com/wiki/Ultimate_Bravery
  - **증강(Mayhem/Arena) 랜덤 기능은 검색·스니펫 어디에서도 확인되지 않음** — 이 장르가 아직 증강 시대를 따라오지 못함.
- **League Roulette** (https://leagueroulette.com/): 역할별 챔피언 룰렛 + Riot API 매치 검증 + 승수 추적 + 글로벌 리더보드 + 업적. **증강 기능 없음**(직접 fetch로 확인). → "랜덤 뽑기를 기록/경쟁 요소와 묶는" UX 참고 사례.
- **l-randomizer** (https://l-randomizer.vercel.app/): 랜덤 챔피언 빌드+역할 생성기. 증강 없음.
- 참고: Riot이 Arena에 공식 "Bravery"(랜덤 챔피언) 모드를 넣었을 정도로 랜덤 플레이 수요는 공인됨: https://www.leagueoflegends.com/en-gb/news/dev/dev-leveling-up-arena/

---

## 4. Arena 모드 시절의 유사 도구

Arena(2v2v2v2, 2023~)도 증강 시스템을 쓰며, 도구 생태계는 Mayhem과 동일한 패턴(티어리스트+오버레이, 시뮬레이터 부재):

- METAsrc Arena 증강 티어리스트(26.17에도 갱신 중 — Arena도 라이브): https://www.metasrc.com/lol/arena/tier-list/augments
- Blitz Arena 증강 티어리스트 + 인게임 스탯 오버레이: https://blitz.gg/lol/arena-augments , https://blitz.gg/lol/tierlist/arena
- Mobalytics Arena 증강 가이드: https://mobalytics.gg/lol/guides/best-augments-arena-mode , https://mobalytics.gg/lol/guides/augments-in-arena-mode
- MetaBot.GG(193개 증강 분석): https://metabot.gg/en/league/arena/augments-tier-list , Facecheck: https://facecheck.gg/lol/arena/tier_list/augments
- **TierMaker 커뮤니티 티어리스트 템플릿**(유저가 직접 드래그해서 만드는 놀이형): https://tiermaker.com/categories/league-of-legends/arena-2024-all-augments-549745 — "증강으로 노는" 수요의 증거.
- Arena 증강 목록 위키: https://wiki.leagueoflegends.com/en-us/Arena/Augments
- **Arena 시절에도 "랜덤 증강 드래프트 시뮬레이터"는 발견되지 않음** ("arena augment randomizer/roulette/simulator" 검색 결과 없음).

참고(리스크 맥락 — TFT의 증강 통계 정책 역사): Riot은 TFT에서 증강 승률 통계를 두 차례 서드파티에서 차단(2023 Set 9 — 이후 Set 9.5에 철회, 2024-11 Set 13 — Mortdog가 "naive했다"며 방향 수정)한 전례가 있음. LoL 모드(Mayhem/Arena)는 현재 모든 대형 사이트가 증강 승률을 공개 중이므로 문제 없으나, **증강 '정답 통계' 의존형 기능은 정책 리스크가 0이 아님**. 반면 우리 시뮬레이터는 "랜덤 뽑기+재미 추천"이라 통계 차단 시에도 살아남는 구조.
- 출처: https://dotesports.com/tft/news/mortdog-admits-tfts-ban-on-augment-stats-sites-was-naive-as-riot-changes-course , https://x.com/Mortdog/status/1856785428852216007 , https://www.dexerto.com/league-of-legends/teamfight-tactics-runeterra-reforged-to-prevent-third-party-sites-from-sharing-data-2173352/

---

## 5. 겹침/틈 분석 (경쟁 매트릭스)

| 기능 | arammayhem.com | u.gg / op.gg / metasrc / blitz / mobalytics | aramkit / aramgg / mayhemmeta | 증바람.com(현재) | aram-mayhem.com | Ultimate Bravery류 | **우리 시뮬레이터** |
|---|---|---|---|---|---|---|---|
| 증강 티어리스트(승률/픽률) | O | O | O | O | O | X | (기존 데이터 재활용) |
| 챔피언별 추천 증강 | O (콤보 666개) | O | 부분적 | O (서포터 앱) | O | X | O |
| 인게임 오버레이 | X | O (op.gg/blitz) | X | O (서포터) | O (OBS용) | X | X |
| 챔피언 특화 수치 계산기 | O (라이즈/블라디/세트) | X | X | X | X | X | X |
| 증강 지식 퀴즈/미니게임 | O | X | X | X | X | X | (확장 여지) |
| **랜덤 3+3 리롤 드래프트 시뮬레이션** | **X** | **X** | **X** | **X** | **X** | **X** | **O (유일)** |
| **뽑힌 조합→꿀잼 플레이스타일 추천** | X | X | X | X | X | X | **O (유일)** |
| 조합→아이템 추천 | 부분적(콤보에 빌드) | 챔피언 단위만 | 부분적 | 챔피언 단위만 | 조합 추천 있음(정적) | 랜덤 아이템(무의미 랜덤) | **O (조합 반응형)** |
| 랜덤 챌린지 문화 지원 | X | X | X | X | X | O (챔피언/아이템만) | O (증강까지) |

### 비어 있는 틈 (우리의 차별점)
1. **랜덤 증강 드래프트 시뮬레이터 자체가 영어권·한국어권 통틀어 부재.** 모든 사이트가 "이미 나온 선택지 중 뭐가 좋냐(티어리스트/오버레이)"에 답할 뿐, "게임 밖에서 뽑기 경험을 재현"하는 도구는 없음. 실제 게임 규칙(4회 선택, 3+리롤3, 화면별 동일 희귀도, 1·2번째 연속 실버 금지, 골든 리롤)을 재현하면 그 자체로 유일한 도구.
2. **"조합 해석" 레이어 부재.** 기존 도구는 증강 1개 단위 승률이거나(통계 사이트) 챔피언+증강 1쌍 콤보(arammayhem.com)까지만 있음. "이번 판에 뽑힌 4개 증강 세트 전체 + 챔피언"을 입력으로 플레이스타일/아이템을 서술해주는 것은 없음. 2026-02 추가된 "증강 세트(테마 보너스)"를 해석에 쓰면 더 벌어짐.
3. **재미 지향 포지셔닝의 공백.** 통계 사이트는 "이기는 법", Ultimate Bravery는 "아무거나 랜덤"의 양극단. "랜덤이지만 그 랜덤을 재미있게 살리는 법을 알려주는" 중간 지대가 비어 있음.
4. **한국어권 특수성**: 한국어 도구는 통계형 2곳(증바람.com, aram-mayhem.com)뿐이고 재미형 도구는 전무. "증바람"이라는 커뮤니티 애칭 선점 효과도 있음.

### 겹치는 것 / 주의할 것
- 챔피언별 추천 증강 데이터 자체는 이미 다수 사이트가 제공 — **추천 '데이터'가 아니라 '뽑기 경험+조합 해석'이 제품이어야 함.**
- arammayhem.com이 이미 "재미 도구 섹션"을 운영 중이라, 그쪽이 룰렛류를 따라 만들 가능성은 있음(현재는 퀴즈/계산기뿐).
- TierMaker 템플릿처럼 "증강으로 놀고 싶다"는 수요는 확인되지만, 이를 게임 규칙 재현 수준으로 만든 곳은 없음.

---

## 6. 미확인 사항
- u.gg / metasrc / bravery.lol / fmkorea 게시글은 직접 fetch가 차단되어(403/429) 세부 UI·수치는 검색 스니펫 기반. 특히 u.gg 증강 티어리스트의 필터 구성, bravery.lol의 최신 기능 목록(증강 지원 여부)은 스니펫으로만 판단함.
- op.gg 챔피언별 증강 탭에 승률 수치가 실제로 표시되는지(JS 렌더링으로 fetch에서는 아이콘만 확인됨).
- ARAM: Mayhem이 공식 "상시 모드"로 전환됐는지 여부(위키는 "기간 연장"까지만 서술; 26.17 패치 데이터가 계속 나오는 것으로 라이브 상태는 확실).
- 나무위키 "챔피언별 추천 조합" 문서의 구체적 구성(차단으로 본문 미확인).
- 증바람.com이 이 프로젝트의 자체 사이트인지 제3자 사이트인지(작업 디렉터리명과 일치하여 자체 사이트로 추정했으나 미확인).
- 모바일 앱(Google Play/App Store)에 Mayhem 증강 시뮬레이터류가 있는지는 별도 스토어 검색을 하지 않아 미확인.
- 2026-02-04 업데이트 이후 리롤 횟수/골든 리롤 규칙에 변화가 있었는지(위키 서술이 최신 반영인지) 세부 미검증.
