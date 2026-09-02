# ARAM: Mayhem (무작위 총력전: 아수라장) — 모드 규칙·역사 조사

- 조사일: 2026-09-02 (현재 패치: 26.17, 2026-08-26 배포 추정)
- 조사자 메모: 영어 위키(wiki.leagueoflegends.com), 라이엇 공식 dev 블로그/패치노트, 나무위키, 인벤/OP.GG/게임메카 등 한·영 소스 교차 확인. WebFetch 요약 과정에서 왜곡 가능성이 있는 항목은 "미확인/주의"로 표기.

---

## 0. 기본 정보

- 영어명: **ARAM: Mayhem** / 한국명: **무작위 총력전: 아수라장**
- 커뮤니티 별칭: **증바람**(증강+칼바람), **증칼**, 그냥 "아수라장" — 나무위키가 "증강 선택과 칼바람 나락의 이름을 합쳐 증바람, 증칼, 또는 아수라장 등으로 불린다"고 기술. 커뮤니티(아카라이브 "증바람(아수라장) 원딜 팁", 통계 사이트 aram-mayhem.com의 "증바람 통계" 표기)에서도 통용 확인.
  - 출처: https://namu.wiki/w/%EB%AC%B4%EC%9E%91%EC%9C%84%20%EC%B4%9D%EB%A0%A5%EC%A0%84:%20%EC%95%84%EC%88%98%EB%9D%BC%EC%9E%A5 , https://arca.live/b/leagueoflegends/157466500 , https://aram-mayhem.com/
- 개요: 칼바람 나락(ARAM)에 아레나(Arena)식 **증강(Augment)** 시스템을 얹은 5v5 모드. 기존 칼바람과 **별도 큐**로 운영되며, 기존 칼바람 큐는 그대로 유지됨.
  - 출처: https://www.leagueoflegends.com/en-us/news/dev/dev-bringing-mayhem-to-aram/ , https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem
- 맵: 칼바람 나락(Howling Abyss) 기반. 위키에 따르면 도살자의 다리(Butcher's Bridge), 코샨의 교차로(Koeshin's Crossing) 등 ARAM 맵 스킨 변형에서도 진행. (맵 변형별 세부 차이는 미확인)
  - 출처: https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem
- 밴 없음(no bans). 챔피언은 일반 칼바람과 동일하게 무작위 배정 + 주사위/교환.
  - 출처: https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem (위키 요약 기준; 세부 문구는 재확인 권장)

---

## 1. 증강 제공 메커니즘 (정확한 규칙)

### 1-1. 선택 시점: 총 4회 — 레벨 3(게임 시작) / 7 / 11 / 15
- 영어 위키 원문 요지: "the first selection screen ensues at the start of the game (level 3) when spawning in, and the others upon achieving at least level 7, 11, and 15, respectively." — 즉 **첫 선택은 게임 시작 시(칼바람은 3레벨 시작이므로 레벨 3)**, 이후 **7 / 11 / 15레벨 도달 시** 총 4회.
  - 출처: https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem
- 나무위키도 "3 / 7 / 11 / 15 레벨마다 증강을 선택할 수 있다"로 일치.
  - 출처: https://namu.wiki/w/무작위%20총력전:%20아수라장
- ✅ 독립 재검증(2026-09-02, 검증자): 라이엇 공식 dev 블로그 원문 직접 열람 — "At the start of each match, you'll choose one of three augments to kick off your build. The next augments will be available at levels 7, 11, and 15." → 시작 시 1회 + 7/11/15, 총 4회(3택1) 확정. loltheory 가이드도 "unlock at the start of the game (level 3) and again at levels 7, 11, and 15"로 일치.
  - 출처: https://www.leagueoflegends.com/en-us/news/dev/dev-bringing-mayhem-to-aram/ (직접 열람) , https://blog.loltheory.gg/aram-mayhem/
- 참고: 출시 전 dev 블로그(2025-10)는 "레벨 7, 11, 15 + 시작 시 1회"로 안내했고, 특정 증강을 통해 4~5개까지 얻을 수 있다고 언급(5번째 슬롯을 여는 특수 증강 존재 — loltheory 가이드도 "a fifth slot occasionally available through special augments" 언급).
  - 출처: https://www.leagueoflegends.com/en-us/news/dev/dev-bringing-mayhem-to-aram/ , https://blog.loltheory.gg/aram-mayhem/

### 1-2. 선택 화면이 뜨는 조건 (죽었을 때/우물에서 선택)
- 영어 위키 원문 요지: 레벨 조건을 채워도 선택 화면은 **상점이 활성화된 상태**에서만 열린다 — 즉 **사망 중이거나, 리스폰 후 우물(상점 범위) 안에 있을 때** 선택 가능. 전투 중에는 강제로 화면이 뜨지 않음(게임을 멈추지 않음).
  - 출처: https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem
- 나무위키도 "레벨에 도달할 때마다 '빈 증강'이 제공되며, 우물 복귀 시 해당 칸만큼 증강 선택이 가능"으로 동일 취지.
  - 출처: https://namu.wiki/w/무작위%20총력전:%20아수라장

### 1-3. 선택지 수와 중복 규칙
- 매 선택 화면마다 **3개 중 1개 선택**.
- 한 번 선택지로 등장한 증강은 이후 선택 화면에 다시 나오지 않음("Augments are offered only once").
  - 출처: https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem , https://www.leagueoflegends.com/en-us/news/dev/dev-bringing-mayhem-to-aram/
- 버그 수정 이력: V26.01에서 같은 증강을 중복 획득하는 버그 수정, 26.03 핫픽스(2/5)에서 "같은 증강을 여러 번 선택할 수 있던 문제" 수정.
  - 출처: https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Patch_history

### 1-4. 리롤(다시 굴리기) 규칙
- **각 선택 화면에서 3개의 선택지(카드) 각각을 최대 1회씩 리롤 가능** → 한 화면에서 최대 6개의 증강을 볼 수 있음. 리롤 결과는 **같은 등급**의 다른 증강.
  - 영어 위키 원문 요지: "An augment offering can be rerolled once at most to receive a different augment of the same tier, for a total of six possible augment choices in a given selection screen."
  - 출처: https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem
  - 나무위키 일치: "매 선택마다 세 개의 선택지 모두 한 번씩 리롤을 돌릴 수 있다."
  - 출처: https://namu.wiki/w/무작위%20총력전:%20아수라장
  - ✅ 독립 재검증(2026-09-02, 검증자): Sheep Esports 플레이 가이드도 "players... can also reroll **each** augment, allowing up to six augment choices per selection screen"으로 **카드(슬롯)별 각 1회 리롤 → 화면당 최대 6개 노출**을 확인. 즉 "3개 제시 + 각 카드를 개별적으로 1회씩 리롤 가능(같은 등급 내) = 최대 6개 노출"이 정확한 메커니즘 (한 번에 6개가 동시에 보이는 게 아니라, 리롤한 카드가 새 증강으로 교체되는 방식). 위키 원문("An augment offering can be rerolled once at most... for a total of six possible augment choices in a given selection screen")도 직접 열람으로 문구 일치 확인.
    - 출처: https://www.sheepesports.com/en/articles/aram-mayhem-how-to-play-tips-augment-suggestions-and-more/en , https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem (직접 재열람)
- **아레나와 달리 팀 공유 리롤 재화가 아니라, 화면·슬롯 단위의 개인 리롤**임(팀 공유라는 서술은 어떤 소스에서도 발견되지 않음). 팀 공유 여부에 대한 명시적 반박 문구는 못 찾았으므로 "개인별, 화면당 슬롯별 1회"가 소스 상 사실이고, "팀 공유 아님"은 강한 추정(미확인 표기).
- **황금 리롤(Golden Reroll)**: 26.03에서 추가된 진행도(Progression Track) 보상. 이를 해금한 플레이어는 **실버/골드 등급이 제시되는 선택 화면에서 일정 확률로 '황금 리롤'을 받게 되며, 사용 시 현재 제시 등급보다 한 단계 높은 등급의 증강**을 받는다.
  - 출처: https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem , https://www.leagueoflegends.com/en-us/news/game-updates/patch-26-3-notes/ (진행도 13/31단계에서 황금 리롤 관련 보상, 핫픽스로 4단계 보상도 황금 리롤로 교체 — https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Patch_history )

---

## 2. 증강 등급 체계 (실버/골드/프리즘)

- 3개 등급: **실버(Silver) < 골드(Gold) < 프리즘(Prismatic)**. 실버가 가장 약하고 프리즘이 가장 희귀·강력. 아레나의 등급 체계와 동일.
  - 출처: https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem , https://namu.wiki/w/무작위%20총력전:%20아수라장
- **등급 배정 방식**: 각 선택 화면의 등급은 **매번 무작위**로 정해지며, **한 화면에서는 10명 전원이 같은 등급**의 증강을 제시받는다. 원문 요지: "Every player is offered the same tier of augments in each selection screen; the tier itself is random each time."
  - 출처: https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem
- **제약**: "첫 번째와 두 번째 선택 화면이 둘 다 실버 등급일 수는 없다"(The first and second selection screens cannot both offer Silver-tier augments).
  - 출처: https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem
- 시점별로 "몇 번째 화면 = 무슨 등급" 식의 고정 스케줄(예: 아레나의 라운드별 고정)이 있다는 서술은 없음 — **고정 스케줄이 아니라 무작위 + 위 제약**이 소스 상의 사실. (아수라장 초기 V25.23에서 "초반 실버 등급 등장 빈도 하향" 조정이 있었음 — 등급 확률 자체는 패치로 조정되는 값)
  - 출처: https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Patch_history
- 리롤은 같은 등급 내에서만 굴려지며, 등급 상승 수단은 황금 리롤(1-4 참조)뿐.

---

## 3. 출시부터 현재까지의 역사 (2025-10-22 → 2026-09-02)

### 3-1. 출시 (패치 25.21, 2025-10-22)
- 2025-10-22, "황혼의 시련(Trials of Twilight) Act II"와 함께 패치 25.21에서 출시. 기존 칼바람과 별도 큐.
  - 출처: https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem , https://www.leagueoflegends.com/en-us/news/dev/dev-bringing-mayhem-to-aram/
- 출시 시점 콘텐츠: 아레나에서 가져온 인기 증강 + **신규 증강 40여 종**, 도합 100종 이상. 설계상 "지속 효과(persistent)" 아레나 증강은 10인 한타 가독성을 위해 제외하고, 자동 발동(autocast) 증강은 "발동 빈도는 낮추고 한 방 임팩트를 키우는" 방향으로 조정.
  - 출처: https://www.leagueoflegends.com/en-us/news/dev/dev-bringing-mayhem-to-aram/
- 영감: 와일드 리프트의 증강 ARAM(AAA ARAM)과 아레나. (나무위키는 와일드 리프트 "마법공학 무작위 총력전"(2024년 시작)을 원형으로 언급 — WebFetch 요약 기준이라 세부 날짜는 미확인)
  - 출처: https://www.leagueoflegends.com/en-us/news/dev/dev-bringing-mayhem-to-aram/ , https://namu.wiki/w/무작위%20총력전:%20아수라장

### 3-2. 연장 (2025-12 ~ 2026-01)
- 원래 **2025 연간 사이클 종료(2026-01-06경)까지** 운영 예정이었으나 반응이 압도적으로 좋아 연장.
  - 출처: https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem
- 1차 연장: **2026-01-10 07:59 GMT까지** 연장 (클라이언트 미션 기한도 함께 연장, LoLDev 트윗).
  - 출처: https://x.com/LoLDev/status/2044070458702832100 , 검색 요약: https://www.escapistmagazine.com/news-lols-aram-mayhem-mode-extended/
- 2026-01-08 발표: **무기한 연장** + 26.03에서 대규모 업데이트 예고. 라이엇: "단기 성과보다 모드의 완성도와 게임플레이 품질을 높이는 것이 장기적으로 낫다고 판단."
  - 출처: https://www.invenglobal.com/articles/20062/riot-games-extends-lol-aram-mayhem-mode-teases-major-update-in-patch-2603 , https://www.sheepesports.com/en/lol/articles/aram-mayhem-extended-indefinitely-with-major-update-scheduled-on-february-4th/en
- 큐 중단(다운타임) 여부: 위키 패치 히스토리에 V26.01·V26.02 밸런스/버그픽스 항목이 존재하는 것으로 보아 **26.1~26.2 동안에도 큐가 계속 열려 있었던 것으로 보임**. 단, "한 번도 내려가지 않았다"는 명시 문구는 못 찾음(미확인). OP.GG 유저 글 제목("26.3 패치에 돌아옵니다")은 업데이트 예고 맥락으로 해석됨.
  - 출처: https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Patch_history , https://talk.op.gg/s/lol/user-news/7044304/

### 3-3. ★ 26.3 대규모 업데이트 ("1차 대격변", 2026-02-04경)
패치 26.03에서 모드 최대 규모 업데이트. Sheep Esports 기준 2026-02-04 적용.
- **신규 증강 45종** 추가(일부는 진행도 트랙으로 해금).
  - 출처: https://www.leagueoflegends.com/en-us/news/game-updates/patch-26-3-notes/ , https://www.inven.co.kr/webzine/news/?news=313333&site=lol ("신규 증강 45종 추가... 대규모 패치")
- **증강 세트(Augment Sets)** 도입 — 같은 테마의 증강 2~4개를 모으면 세트 보너스 발동. 9개 세트:
  - Deathknell(사망 시간 40% 감소), Firecracker(투사체가 2~3회 튕기며 원래 피해의 40~80%), High Roller(미니언이 능력치 모루 드랍, 골드/프리즘 업그레이드 확률 +50%), Stackosaurus Rex(중첩 효과 50~200% 증가), Wee Woo Wee Woo(이동속도 40~60% + 치유/보호막 효과 25~45%), Fully Automated(자동 발동 쿨다운 30% 감소·스킬 가속 연동), Archmage(스킬 사용 시 무작위 스킬 쿨다운 40% 환급), Make it Rain(증강/킬 골드 25~100% 증가), Snowday(눈덩이에 스킬 가속 50~150 + 추가 피해 30~100%)
  - 출처: https://www.leagueoflegends.com/en-us/news/game-updates/patch-26-3-notes/ , https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Patch_history
- **진행도 트랙(Mayhem Progression Track, 32단계)** 도입 — 보상: 신규 증강 해금, 아이콘/휘장 등 코스메틱, 시작 골드 +300(4단계→이후 핫픽스로 황금 리롤로 교체), **황금 리롤**(13·31단계) 등.
  - 출처: https://www.leagueoflegends.com/en-us/news/game-updates/patch-26-3-notes/ , https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Patch_history , https://www.inven.co.kr/webzine/news/?news=313333&site=lol ("진척도 패스는 총 32단계")
- **소환사 주문 자유화**: 점멸 강제 슬롯 폐지 — "원하는 소환사 주문을 자유롭게 선택 가능"해졌고, 소환사 주문을 부여하는 증강은 교체할 슬롯을 직접 고르게 됨.
  - 출처: https://www.leagueoflegends.com/en-us/news/game-updates/patch-26-3-notes/ , https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Patch_history
- 증강 삭제: Orbital Laser, Stackosaurus Rex(증강판), Upgrade: Cutlass 등 제거. Poro Blaster 팀당 1개 제한 등 너프.
  - 출처: https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Patch_history
- **미드패치 핫픽스**(적용 약 24시간 후): Riot Phlox — "새 아수라장 출시가 파워를 다소 과하게 잡아서, 여러 증강·세트의 상한을 끌어내린다." 일부 증강 등장 빈도 하향, 세트 너프, **무한 재귀(infinite recursion) 버그** 수정.
  - 출처: https://www.sheepesports.com/en/lol/articles/aram-mayhem-receives-a-mid-patch-update-during-26-03/en (검색 요약 경유; 원문 403)
- 이후 26.03 내 추가 핫픽스: 2/5(증강 카드 호버 지연 0.75→0.1초, 중복 선택 버그 수정, 진행도 4단계 보상→황금 리롤), 2/10(능력치 모루 요구 레벨 9→16, 옴니뱀프 조각 하향 등), 2/11(모루 재조정).
  - 출처: https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Patch_history
- 한국 매체 보도: 인벤 "신규 증강 45종 추가... 대규모 패치", 게임메카 "신규 증강·세트 추가, 롤 '증바람' 업데이트 적용 완료", 게임플 신규 증강 미리보기.
  - 출처: https://www.inven.co.kr/webzine/news/?news=313333&site=lol , https://www.gamemeca.com/en/view.php?gid=1771055 , https://www.gameple.co.kr/news/articleView.html?idxno=214908

### 3-4. 무기한 존속 확정 (2026-03-02 dev 업데이트)
- 라이엇: 아수라장은 **"정해진 종료일 없이(no end date in mind)"** 계속 운영하며, 유저 관심이 있는 한 신규 콘텐츠를 계속 추가하겠다고 발표.
  - 출처: https://dotesports.com/league-of-legends/news/lol-aram-mayhem-extended (본문 451로 직접 열람 불가, 검색 요약 경유)

### 3-5. 26.04 ~ 26.06 (2026-02 ~ 2026-03)
- V26.04: Divine Intervention 일시 비활성(Fully Automated 세트 버그), 각종 버그/툴팁 수정.
- V26.05: **넥서스 체력 5500→3000, 넥서스 포탑 체력 3000으로 증가**(게임 종반 마무리 조정), 신규 프리즘 증강 "Upgrade: Sword of Blossoming Dawn", 대규모 증강 밸런스 패스, Wee Woo Wee Woo 세트 리워크.
- V26.06: Make It Rain 세트를 코인 드랍 방식으로 재구성, 다수 증강 수정, 일부 챔피언(일라오이/세트/쉬바나/사이온/스웨인/우르곳/블라디미르) 모드 전용 피해 계수 조정.
  - 출처(공통): https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Patch_history

### 3-6. ★ 26.12 "2차 대격변" (dev 블로그 2026-05-27 공개, KR 적용 2026-06-10~11경)
- dev 블로그 "/dev: Augmentmaxxing ARAM: Mayhem": **트레잇(세트) 시스템 전면 폐지** — "빌드와 게임 경험을 획일화(homogenized)"시켰다는 이유. 인기 세트 효과는 단독 증강으로 재도입.
- **능력(스킬) 증강(Ability Augments)** 신설: 특정 스킬 하나를 크게 바꾸는 증강(예: Multishot, Chain Reaction).
- **퀘스트 증강(Quest Augments)** 신설: 조건 달성 시 보상(예: Quest: Tooth Fairy, Quest: Support Main).
- 모드 존속 재확인: "이미 올해와 내년(2027)의 향후 콘텐츠를 논의 중."
  - 출처: https://www.leagueoflegends.com/en-us/news/dev/dev-augmentmaxxing-aram-mayhem/ , https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Patch_history (V26.12: "Augment Trait System removed / Added Ability and Quest Augments")
- 한국 반응: 인벤 기획 기사 "[기획] 2차 대격변 거친 '증강 칼바람', 여전히 재밌잖아?" — 세트 삭제 + 스킬 증강(퀘스트형) 도입을 다루며, "1차 대격변에 비하면 꽤 밋밋", 특이점(캐리 급성장) 등장이 드물고 늦어져 평균 게임 시간이 2~3분 늘어난 느낌이라는 평. 스킬 증강은 챔피언별 효율 격차 문제로 호불호(나무위키도 유사 서술).
  - 출처: https://www.inven.co.kr/webzine/news/?news=317389&site=lol , https://namu.wiki/w/무작위%20총력전:%20아수라장
- 인벤 유저 가이드 "무작위 총력전: 아수라장 가이드 26.11 패치 업데이트"가 존재 — 26.11 전후로도 모드가 계속 서비스되었음을 방증.
  - 출처: https://www.inven.co.kr/board/lol/2766/50142

### 3-7. 26.13 ~ 26.17 (2026-07 ~ 2026-08, 현재)
- 26.13 시점 라이브 확인(“was live as of patch V26.13”).
  - 출처: https://blog.loltheory.gg/aram-mayhem/
- **26.17(2026-08-26)**: 파이터 경험 개선 지속 — 신규 파이터 증강 **Ultra Hydra**, **Upgrade: Death's Dance** 추가. 고빈도 불만(가독성 저해) ADC 증강 하향, **Double Tap 프리즘 등급으로 상향 이동**, 챔피언별 플레이스타일에 맞는 증강 풀 배정 개선.
  - 출처: https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-17-notes/ (검색 요약 경유), https://mobalytics.gg/lol/tier-list/mayhem (26.17 증강 티어리스트 존재)

---

## 4. 일반 칼바람과의 차이

| 항목 | 일반 칼바람 | 아수라장 |
|---|---|---|
| 증강 | 없음 | 레벨 3/7/11/15에 3택1, 총 4개(특수 증강으로 5개 가능) |
| 룬 | 있음 | **완전 비활성화** (키스톤 효과는 일부 증강으로만 획득) |
| 소환사 주문 | 점멸+선택 | 출시~26.02: 한 칸 점멸 고정 / **26.03부터 완전 자유** + 모드 전용 주문(증강 경유): Droppybara, Growth Spurt, Poltergeist, Poro Charge, When the Darkness Comes 등 |
| 탈진 | 사용 가능 | **비활성화** |
| 기본 능력치 | 표준 | 룬 부재 보상: 근접 +20~600 / 원거리 +20~400 기본 체력(레벨 비례), 전원 마나 재생 +10%, 근접 방어력·마저 +15 (원거리 보정 일부는 버그로 미적용 상태였다는 위키 기록 있음) |
| CC 대응 | 강인함 아이템/룬 | **콤보 브레이커(Combo Breaker)**: 연속되지 않은 CC를 맞을 때마다 강인함 중첩(3.25초 지속·갱신), 최근 7초 중 5초 이상 행동 불가 시 모든 CC 해제 + 3초간 CC 면역 (중첩당 강인함 %수치는 미확인) |
| 전용 아이템 | — | 능력치 모루(Stat Anvil, 750골드, 요구 레벨 9→26.03 핫픽스 후 16), Hextech Gunblade·Sword of Blossoming Dawn·Atma's Reckoning·Rite of Ruin 등 모드 전용/부활 아이템 |
| 치명타 초과 | — | 25.24부터: 100% 초과 치명타 확률 1%당 추가 AD 0.45 |
| 넥서스 | 표준 | 26.05부터 넥서스 체력 3000(포탑 3000) |
| 챔피언 밸런스 | ARAM 전용 계수 | ARAM 계수에 더해 **아수라장 전용 추가 조정**(예: 25.23 탱커류 조정, 26.06 일라오이·스웨인 등 피해 계수) |
| 맵/기본 구조 | 칼바람 나락 | 동일(눈덩이, 체력 유물, 3레벨 시작 등 ARAM 구조 유지) |

- 출처(종합): https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem , https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Patch_history , https://blog.loltheory.gg/aram-mayhem/ , https://www.leagueoflegends.com/en-us/news/game-updates/patch-26-3-notes/
- 증강 자체의 밸런스: 대부분 아레나와 동일 성능이나 5v5를 고려해 일부 너프/제외/추가(나무위키). 지속형 아레나 증강은 가독성 문제로 포팅 제외(dev 블로그).
  - 출처: https://namu.wiki/w/무작위%20총력전:%20아수라장 , https://www.leagueoflegends.com/en-us/news/dev/dev-bringing-mayhem-to-aram/

---

## 5. 현재 상태 (2026-09-02 기준)

- **큐 열려 있음**: 26.17 패치노트에 아수라장 밸런스 변경이 포함되고, u.gg/mobalytics/metasrc 등이 26.17 기준 아수라장 티어리스트·통계를 제공 중 → 현재(26.17) 라이브.
  - 출처: https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-17-notes/ , https://u.gg/lol/aram-mayhem-tier-list , https://mobalytics.gg/lol/tier-list/mayhem , https://www.metasrc.com/lol/mayhem
  - ✅ 독립 재검증(2026-09-02, 검증자): 통계 사이트 arammayhem.com(패치 26.17, 2026-08-27자 신규 증강 Ultra Hydra/Upgrade Death's Dance 데이터, "Daily Updates" 표기)과 aramgg.com(Version 26.17 · Daily Updates)이 26.17 기준 실시간 통계를 갱신 중 → 2026-09-02 현재 라이브로 재확인.
    - 출처: https://arammayhem.com/augments/ , https://aramgg.com/en/new-augments
- **공식 분류**: 엄밀히는 "상시 모드로 공식 전환" 선언은 확인되지 않음. 2026-01 무기한 연장 → 2026-03-02 "종료일 없음" 발표 → 26.12 dev 블로그에서 "2027년 콘텐츠까지 논의 중"으로, **사실상 상시 운영이지만 공식 명칭상으로는 '무기한 연장된 이벤트 큐'에 가까움** (loltheory 가이드도 "rotating Featured Game Mode, not permanent"로 분류). 나무위키는 "영구 모드화 논의 중"으로 기술.
  - 출처: https://dotesports.com/league-of-legends/news/lol-aram-mayhem-extended , https://www.leagueoflegends.com/en-us/news/dev/dev-augmentmaxxing-aram-mayhem/ , https://blog.loltheory.gg/aram-mayhem/ , https://namu.wiki/w/무작위%20총력전:%20아수라장
- 기존 일반 칼바람 큐도 병행 유지(출시 dev 블로그에서 약속).
  - 출처: https://www.leagueoflegends.com/en-us/news/dev/dev-bringing-mayhem-to-aram/
- 인기: 나무위키 요약 기준 "도입 후 반응 매우 긍정적", 기존 칼바람 유저 상당수가 아수라장으로 이동해 가장 인기 있는 큐가 되었다는 서술(구체 수치 "66% 이탈"은 WebFetch 요약 왜곡 가능성 있어 미확인 처리).
  - 출처: https://namu.wiki/w/무작위%20총력전:%20아수라장

---

## 6. 미확인 / 주의 사항

1. **콤보 브레이커의 중첩당 강인함 %수치** — 위키 원문에서 수치가 템플릿 변수로 렌더링돼 추출 실패. 지속 3.25초, "7초 중 5초 immobilize 시 해제+3초 면역"은 확인됨.
2. **리롤이 팀 공유가 아니라는 명시 문구** — 모든 소스가 개인·슬롯당 1회로 기술하나 "팀 공유 아님"을 직접 부정한 문장은 없음.
3. **26.1~26.2 사이 큐 다운타임 유무** — 패치 히스토리상 계속 라이브였던 정황이 강하나 명시 확인 없음.
4. **"상시 모드" 공식 선언** — 없음. "무기한, 종료일 미정"까지만 공식 확인.
5. 나무위키 경유 세부 수치("기존 칼바람 유저층 66% 이탈", 와일드 리프트 원형의 정확한 출시일 2024-08-09 등)는 WebFetch 요약 왜곡 가능성 있어 미확인.
6. 위키 패치 히스토리 V25.24의 "룬 조정(Hail of Blades 등)" 항목 — 아수라장은 룬 비활성 모드이므로 이 항목이 아수라장 전용 조정인지 ARAM 일반 조정의 혼입인지 미확인.
7. 26.12의 정확한 라이브 날짜(6/10~11은 인벤 기사 기준 KR 적용일 추정)와 26.17의 정확한 배포일(8/26은 검색 결과 기준).

---

## 7. 핵심 소스 목록

- 영어 위키 (모드 문서): https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem
- 영어 위키 (패치 히스토리): https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Patch_history
- 출시 dev 블로그 (2025-10): https://www.leagueoflegends.com/en-us/news/dev/dev-bringing-mayhem-to-aram/
- 26.12 dev 블로그: https://www.leagueoflegends.com/en-us/news/dev/dev-augmentmaxxing-aram-mayhem/
- 패치 26.3 노트: https://www.leagueoflegends.com/en-us/news/game-updates/patch-26-3-notes/
- 패치 26.17 노트: https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-17-notes/
- 나무위키: https://namu.wiki/w/무작위%20총력전:%20아수라장
- 인벤 26.3 보도: https://www.inven.co.kr/webzine/news/?news=313333&site=lol
- 인벤 26.12 기획: https://www.inven.co.kr/webzine/news/?news=317389&site=lol
- Inven Global 연장 보도: https://www.invenglobal.com/articles/20062/riot-games-extends-lol-aram-mayhem-mode-teases-major-update-in-patch-2603
- Sheep Esports 미드패치: https://www.sheepesports.com/en/lol/articles/aram-mayhem-receives-a-mid-patch-update-during-26-03/en
- dotesports 존속 보도: https://dotesports.com/league-of-legends/news/lol-aram-mayhem-extended
- LoLDev 연장 트윗: https://x.com/LoLDev/status/2044070458702832100
- loltheory 2026 가이드: https://blog.loltheory.gg/aram-mayhem/
- 게임메카: https://www.gamemeca.com/en/view.php?gid=1771055
- OP.GG 유저 소식: https://talk.op.gg/s/lol/user-news/7044304/
