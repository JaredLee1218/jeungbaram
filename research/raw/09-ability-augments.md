# 능력 증강(Ability Augments, 스킬 강화 증강) 전면 해부 — "스킬을 강화해주는 증강은 어떤 티어인가?" (Q2)

- 조사일: 2026-09-02 (라이브 패치 26.17)
- 대상 모드: 칼바람 아수라장 / ARAM: Mayhem (한국 공식 "무작위 총력전: 아수라장")
- 전제: 기존 스터디 03(챔피언별 필터링 공식 확인, Optimal/Viable/Average/Invalid 4단계 등)은 반복하지 않고, 그보다 깊이 들어간 내용만 다룬다.
- 방법: 공식 위키의 wikitext/Lua 원본( `?action=raw` )을 직접 다운로드해 파싱(전수 조사), 공식 패치 노트(영/한) 원문 인용, 팬사이트/언론 교차 검증. WebFetch 요약 경유 인용에는 그 사실을 표시.
- 독립 재검증: 2026-09-02, 별도 검증자가 위키 모듈 Lua 재다운로드·재파싱(225종=실버 64/골드 85/프리즘 76, "Upgrades one of…" 24종=실버 9/골드 10/프리즘 5 + 퀘스트형 3종 → 합계 27종=실버 9/골드 12/프리즘 6 재현 일치), V26.12 raw 신규 목록 직접 계수(실버 12/골드 26/프리즘 21=59 일치), 공식 26.13 노트 영/한·IBTimes·게임플·arammayhem 개별 페이지(흡수=실버, 꽁!=골드, 공포=프리즘, 위력 추구=실버) 재조회로 §0 핵심 결론("스킬 증강은 별도 티어가 아니라 3개 등급을 가로지르는 카테고리")을 독립 소스 2개 이상으로 확정. 수정 2건은 §2-2 예시 교체와 §8 통계 갱신뿐.

---

## 0. 핵심 결론 — 사용자 질문 Q2의 정답

**"스킬을 강화해주는 증강"(공식 한국어 명칭: 스킬 증강, 영문: Ability Augments)은 별도의 티어가 아니다. 실버/골드/프리즘 세 등급 모두에 걸쳐 존재하는 '카테고리'다.**

1. **등급 배치(위키 모듈 26.17 기준, 원본 Lua 전수 파싱)**: "챔피언의 스킬 중 하나를 강화(Upgrades one of your champion's abilities)" 형식의 증강 24종 + 스킬 지정형 퀘스트 증강 3종(Multishot, Pursuit of Haste, Pursuit of Power) = **총 27종**이 등재되어 있고, 분포는 대략 **실버 9 / 골드 12 / 프리즘 6**(비활성 4종 포함; §3 표 참조). 즉 실버 화면에서도, 골드 화면에서도, 프리즘 화면에서도 스킬 증강이 나올 수 있다.
   - 출처(원본): https://wiki.leagueoflegends.com/en-us/Module:MayhemAugmentData/data (총 225종 등재: 실버 64/골드 85/프리즘 76 — 이 중 스킬 증강이 위 27종)
2. **위키의 증강 목록 테이블 자체에 "능력 증강" 분류 열이 없다.** 목록 페이지(https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Augments )는 `Module:MayhemAugmentData`의 `augmentTable` 함수로 렌더링되는데, 열이 Augment/Effect/Tier 3개뿐이고 알파벳순 단일 테이블이다(모듈 소스 직접 확인). 능력 증강 여부는 설명문("Upgrades one of your champion's abilities…")으로만 구분된다. **별도 페이지( /Ability_Augments )도 존재하지 않는다**(fetch 시 빈 문서).
3. **제시 방식도 일반 증강과 동일**: 레벨 3/7/11/15의 4개 선택 화면에서 일반 증강과 섞여 나오고, "화면당 전원 동일 티어" 규칙을 그대로 따른다. 스킬 증강만 따로 나오는 화면·라운드는 없다.
4. 사용자 체감상 "가끔" 뜨는 이유(추정 아님, 문서화된 요인만): (a) 전체 225종 풀에서 스킬 증강은 27종(약 12%)에 불과, (b) 챔피언·스킬 적격성 필터로 후보가 더 줄어듦, (c) 26.13 이전에는 **3·4번째 증강 화면에서 스킬 증강 등장 확률이 크게 낮아지는 버그**가 있었음(공식 패치 노트, §6), (d) 진행 트랙 **레벨 9 보상을 찍은 계정만 등장 확률 증가** 혜택을 받음(§2).

---

## 1. 공식 정의와 용어 (영/한)

- 영문 공식: **Ability Augments**. 정의(라이엇 /dev, Riot Phlox, 2026-05-27): *"Ability Augments are those that significantly enhance a single ability for a champion, providing the opportunity for a gameplay experience completely different from that of the champion originally."*
  - https://www.leagueoflegends.com/en-us/news/dev/dev-augmentmaxxing-aram-mayhem/
- 한국 공식: **"스킬 증강"** (26.12 패치 노트 한국어판): *"챔피언의 스킬 중 하나를 직접 강화하는 증강으로, 해당 챔피언이 사용할 수 있는 스킬 증강만 획득할 수 있습니다."* (WebFetch 요약 경유 인용)
  - https://www.leagueoflegends.com/ko-kr/news/game-updates/league-of-legends-patch-26-12-notes/
- 영문 26.12 패치 노트(위키 V26.12 전사본, 원문 확인): *"Ability Augments are Augments that directly upgrade one of your champion's abilities. You'll only ever receive Ability Augments that are usable for your champion."*
  - https://wiki.leagueoflegends.com/en-us/V26.12
- **퀘스트 증강과의 관계(공식)**: *"And yes, an Augment can be both a Quest Augment and an Ability Augment! Want your Blitzcrank Q to fire three hooks after powering it up?"* — 카테고리는 상호 배타가 아니라 **겹칠 수 있다**(Multishot·Pursuit 계열이 그 사례). (V26.12 전사본 원문)
- 위키 본문에는 "Ability Augments" 전용 서술 섹션이 없고, 진행 트랙 레벨 9 보상 아이콘 파일명(`Ability Augments mayhem.png`)과 26.12 패치 히스토리 한 줄("Added Ability and Quest Augments")로만 카테고리명이 등장한다(원문 확인).

---

## 2. 어떤 조건에서 제시되는가

위키 원문( https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem , wikitext 직접 확인) 기준:

1. **화면/레벨**: 일반 증강과 동일하게 레벨 3(시작)/7/11/15의 4개 선택 화면, 화면당 3개 제시 + 선택지당 1회 리롤. 스킬 증강 전용 화면은 없다.
2. **티어 규칙 공유**: "Every player is offered the same tier of augments in each selection screen" — 그 화면이 실버면 실버 스킬 증강(흡수, 확고한 의지로 등)이, 프리즘이면 프리즘 스킬 증강(3연발, 주문 분산 등)이 후보가 된다. (검증 수정 2026-09-02: 실버 예시였던 '공포'는 티어 상충 3건 중 하나(§7-1)라 무상충 증강으로 교체. 참고로 같은 위키 원문에 "첫 번째·두 번째 화면이 한 게임에서 둘 다 실버일 수는 없다"는 규칙도 있음 — ARAM: Mayhem wikitext 재확인.)
3. **1회성**: "Augments are offered only once" — 한 번 선택지에 나온 증강은 그 게임에서 재등장하지 않는다. 따라서 **같은 스킬 증강을 다른 스킬 대상으로 두 번 제안받는 경우도 없다**(증강 단위 1회 규칙의 귀결; 스킬만 바꿔 재등장한 사례는 문서화된 바 없음 — 미확인 영역).
4. **진행 트랙 레벨 9(계정 단위 가중치)**: 원문 *"Gain a higher chance of being offered an augment that upgrades one of your champion's abilities."* — **레벨 9 보상을 받은 계정은 스킬 증강 등장 확률이 올라간다**. 수치는 비공개. (레벨 1=골든 리롤, 레벨 5=축복 카드와 같은 트랙의 보상 슬롯)
5. **3·4번째 화면 버그(과거)**: 26.13 공식 노트 원문 — *"Additionally, we resolved a bug that significantly reduced the chance of Ability Augments appearing in the third and fourth Augment slots."* 한국어판: *"세 번째 및 네 번째 증강 슬롯에 스킬 증강이 등장할 확률이 크게 낮아지던 버그를 수정했습니다."* — 26.12~26.13 사이에는 레벨 11/15 화면에서 스킬 증강이 비정상적으로 드물었다.
   - https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-13-notes/ (영/한 모두 WebFetch로 원문 인용 확보)
6. **챔피언 필터**: 드로우 풀 진입 전에 챔피언별로 필터링(스터디 03에서 확정, 반복 생략). 26.13부터는 스킬 단위로도 "실제로 이득이 되는 스킬"에만 붙는다(§6).

---

## 3. 종류 전체 목록 (위키 모듈 26.17 원본 기준, 전수)

한국어 이름의 근거: 26.12 패치 노트 영어판(위키 V26.12 전사본의 신규 증강 목록)과 한국어판(공식 사이트)의 **티어별 목록이 같은 순서·같은 개수(실버 12/골드 26/프리즘 21)**로 대응됨을 확인하고 1:1 매핑했다. 매핑의 독립 검증: 대마법사=Archmage·날쌘걸음=Quickstep(26.13 한국어 노트에서 티어 변경 표기로 직접 확인), 굶주린 속박=Ravenous Bind·가속 추구=Pursuit of Haste·곰 투하=DropBear·말랑 찰싹 손=Squishy Slappy Grab·방출 역장=Surge Field(게임플 기사 효과 서술 일치).

### 3-1. 스킬 강화형(설명이 "Upgrades one of your champion's …"인 24종)

| 영문 | 한국어 | 등급(위키 26.17) | 요구 스킬 속성 | 효과 요약 | 상태 |
|---|---|---|---|---|---|
| Siphon | 흡수 | 실버 | 없음(임의 스킬) | 그 스킬이 챔피언에게 입힌 최종 피해의 30% 회복 | 활성 |
| Adaptive Ward | 적응형 와드 | 실버 | 없음 | 스킬 적중 시 6초간 적응형 방어(방/마저 7~12) 중첩 | 활성 |
| Stay Resolute | 확고한 의지로 | 실버 | 없음 | 스킬이 챔피언에게 피해 시 **영구** 적응형 방어 무한 중첩(대상·시전당 5초 쿨). 첫 증강이 아니면 즉시 방/마저 +20 | 활성 |
| Trusty Weapon | 믿음직한 무기 | 실버 | 없음 | 적중 시 6초 '우정' 중첩, 중첩당 그 스킬 피해 +5% | 활성 |
| Terror | 공포 | 실버 ⚠️ | 없음 | 시전 시 주변 450 적 전원 1.75초 공포(30초 쿨) | 활성. ⚠️ 티어 상충: 26.12 공식 노트·KR판·arammayhem(26.17)은 **프리즘**, 위키 모듈은 실버 — §7 |
| It's Go Time | 출발할 시간 | 실버 | 지속시간형 효과 | 효과 지속 동안 이동 속도 +25~45% | 활성 |
| BONK! | 꽁! | 실버 ⚠️ | 강화 기본 공격 효과 | 강화 공격 피해 +30%, 그 피해의 30%를 주변에 확산 | 활성. ⚠️ 티어 상충: 26.12 노트·팬사이트는 **골드**, 위키는 실버 — §7 |
| Bolstered | (KR명 미확인) | 실버 | 보호막 효과 | 보호막을 대상 잃은 체력 비례(최대 60~70%) 강화 | 활성. 추가 시점 미확인(26.12 신규 목록·26.13~17 노트 모두에 없음) |
| Double Strike | (KR명 없음) | 실버 | 강화 기본 공격 효과 | 강화 공격이 온힛 효과 2회 적용 | **비활성**(내부 데이터만 존재, 위키 명시) |
| Rejuvenation | 원기 회복 | 골드 | 없음 | 시전 시 자힐(30~100+계수), 스킬 쿨타임이 길수록 최대 1.5배 | 활성 |
| Mercy's Strike | 자비의 일격 | 골드 | 없음 | 시전 시 다음 기본 공격 강화: 사거리 +300, 공속 +75%, 대상 최대 체력 3%(+힐·실드력 계수) 마법 피해 | 활성 |
| Quickstep | 날쌘걸음 | 골드 | 26.12 발표문은 "자가 대상 AoE 스킬"(가렌 E, 케넨 R 예시), 현 위키 서술엔 조건 없음(변경 여부 미확인) | 시전 시 커서 방향 350 대시 | 활성. 26.13에 **프리즘→골드** |
| Chain Reaction | 연쇄 반응 | 골드 | **넉백** 보유 | 넉백된 적이 적 챔피언/지형과 충돌 시 연쇄 피해+넉업(+지형은 스턴). **궁극기에 붙으면 피해 250%** | 활성. 26.16에 **프리즘→골드** |
| Ravenous Bind | 굶주린 속박 | 골드 | **속박(Immobilize)/그라운딩** 보유 | CC 대상에게 추가 마법 피해 + 자힐(스킬 쿨 비례 최대 +50%) | 활성 |
| Terrain'd | 지형 생성됨 | 골드 | **지형 생성** 스킬 | 지형 주변 적에게 마법 피해, **궁극기면 3배** | 활성 |
| Lil' Extra Help | 작은 도움 | 골드 | 일정 시간 기본 공격을 강화하는 스킬 | 효과 중 사거리 +150(원거리 100), 공속 +75%(원거리 40%) | 활성 |
| Void Dash | 공허 돌진 | 골드 | **대시** 보유 | 대시 도착지에 공허 지대(피해+35% 슬로우) | **비활성**(26.12 핫픽스 이후, 위키 명시) |
| Reload | (KR명 없음) | 골드 | 지속시간형 효과 | 지속 중 온힛마다 그 스킬 남은 쿨 0.15~0.35초 감소 | **비활성**(내부 데이터만) |
| Snap Back | (KR명 없음) | 골드 | 없음 | 재시전 시 시전 위치로 점멸+폭발 피해 | **비활성**(내부 데이터만) |
| Echo Cast | 메아리 시전 | 프리즘 | 없음 | 시전 시 분신 소환, 0.25초 후 같은 스킬을 따라 시전(분신 이속 1000, 최대 7초 — 위키 노트) | 활성 |
| Overloaded | 과충전 | 프리즘 | 없음 | **다른 스킬을 시전할 때마다 그 스킬 쿨 초기화** | 활성 |
| Pin Cushion | 바늘꽂이 | 프리즘 | 지속시간형 효과 | 지속 중 평타로 중첩 적립→종료 시 중첩당 물리 피해+이속 | 활성 |
| Spell Split | 주문 분산 | 프리즘 | **투사체(missile)** 보유 | 투사체가 명중/최대 사거리/재시전 시 좌우로 분열(중복 적중 30% 피해) | 활성 |
| Tripleshot | 3연발 | 프리즘 | **대상 지정 + 투사체** | 주 대상 인근 2명에게 추가 발사(중복 30%). 26.17에 "주 대상 인근 적 우선" 타겟팅 개선 | 활성 |

### 3-2. 스킬 지정형 퀘스트 증강(능력 증강 겸용 3종)

| 영문 | 한국어 | 등급(위키 26.17) | 구조 | 효과 |
|---|---|---|---|---|
| Multishot | 다중 공격 | 프리즘 | **6단계 퀘스트** | 지정 스킬의 투사체 적중 횟수 채우기. 필요 횟수 = 단계별 **50/250/700/2000/4000/8000 ÷ 스킬 기본 쿨타임**(내림, 최소 1). 단계당 투사체 +1(최대 총 7발), 전 투사체 부채꼴 발사, 중복 적중 30% 피해 |
| Pursuit of Haste | 가속 추구 | 골드 | **2단계 퀘스트** | 지정 스킬 10회/추가 20회(총 30회) 적중 → 그 스킬 쿨타임을 스킬 가속 80/누적 160 상당으로 감소 |
| Pursuit of Power | 위력 추구 | 골드 ⚠️ | 단일 퀘스트 | 지정 스킬 10회 적중 → 그 스킬 피해 +30%. ⚠️ 티어 상충: 26.12 노트·KR판·팬사이트는 **실버**, 위키는 골드 — §7 |

- 적중 카운트 공통 규칙(위키 원문): "counts up to 1 hit per champion per cast instance" — 한 번의 시전에서 챔피언 1명당 1히트만 인정.
- 활성 스킬 증강 합계: **실버 8 / 골드 9 / 프리즘 6 = 23종** (+비활성 4종).

### 3-3. 스킬 '슬롯' 고정형(참고 — 능력 증강의 전신)

| 영문 | 등급 | 효과 |
|---|---|---|
| Bread And Butter | 골드 | **Q 스킬**에 스킬 가속 100 |
| Bread And Jam | 골드 | **W 스킬**에 스킬 가속 100 |
| Bread And Cheese | 골드 | **E 스킬**에 스킬 가속 100 (3종 모두 모으면 'Bread Sandwich': 궁 가속 250 + 기본 스킬 가속 +50 — Augments 페이지 Notes 원문) |

/dev 글은 능력 증강 개념을 소개하며 "Mayhem엔 이런 류가 이미 있었다"고 Bread And Butter를 예로 들었다. 이들은 **특정 스킬이 아니라 슬롯(Q/W/E)을 지정**하므로 챔피언·스킬 적격성 필터가 필요 없는 원시형이다.

---

## 4. 퀘스트 증강(Quest Augments)의 등급 체계 — 같은 결론

퀘스트 증강도 **별도 티어가 아니라 실버/골드/프리즘을 가로지르는 카테고리**다. 위키 모듈 기준 현황:

| 증강 | 한국어 | 등급 | 구조 | 비고 |
|---|---|---|---|---|
| Multishot / Pursuit of Haste / Pursuit of Power | 다중 공격 / 가속 추구 / 위력 추구 | 프리즘 / 골드 / 골드⚠️ | 다단계·다단계·단일 | 능력 증강 겸용(§3-2) |
| Poro Stampede | 포로 쇄도 | 프리즘 | **9단계** | 포로 사랑 중첩 12→275 달성마다 포로 돌격 웨이브 +1(최대 10웨이브) |
| Pressure Cooker | 압력솥 | 골드 | **3단계** | 화상 누적 피해 1,500/13,500/28,500 달성 시 범위·중첩 속도 강화 |
| Quest: Steel Your Heart | (KR명 미확인) | 골드 | 단일 | 심장강철 획득+거대한 포식 300체력 → 획득량 +200%. ※아레나의 유나라 전용 동명 증강과는 전혀 다른 범용 증강 |
| Quest: Urf's Champion | (KR명 미확인) | 프리즘 | 단일 | 킬관여 18회 → 황금 뒤집개 |
| Quest: Wooglet's Witchcap | (KR명 미확인) | 프리즘 | 단일 | 라바돈+존야 → 우글렛의 마녀모자로 합성 |
| Quest: Icathia's Fall | (KR명 미확인) | 프리즘 | 단일 | 바미의 불씨 지급, 공허 불사르기 합성 |
| Quest: Sneakerhead | (KR명 미확인) | 프리즘 | 6개 신발 순차 퀘스트 | **비활성**(위키 명시). 보상: Jarvan I's |
| Quest: Support Main | 퀘스트: 서포터 주력 | 실버(26.12 노트 기준) | — | 26.12 추가 → **6/18 비활성**(IBTimes) → 현 위키 모듈에서 항목 자체가 사라짐(제거로 추정, 시점 미확인) |

- 26.12 공식 노트 원문: *"Previously, Quest Augments only had a single unlock threshold, but in this update we're introducing multi-tier Quest Augments that can evolve multiple times into even stronger versions."* — **다단계(multi-tier) 퀘스트는 26.12에서 처음 도입**. 기존 단일형(Steel Your Heart 등)은 UI에 진행도 표기가 추가됐다.
- ⚠️ Tooth Fairy(이빨의 요정, 골드): /dev 글에서는 "Quest: Tooth Fairy"로 퀘스트형으로 소개됐으나, 현 위키 등재판은 퀘스트 구조가 없는 상시 중첩 효과다(출시 전 변경 또는 위키 미반영 — 미확인).

---

## 5. 챔피언별 스킬 지정 규칙 — "어느 스킬이 강화되는가"

**핵심: 스킬은 플레이어가 고르는 것이 아니라, 시스템이 증강×스킬 조합을 미리 만들어 카드에 박아서 제시한다.**

1. **조합 단위 드로우**: 라이엇 공식 설명(IBTimes 전재) — *"Ability Augments are filtered to each player's champion before entering the draw pool."* 6/19 핫픽스가 제거한 것도 증강이 아니라 **"450개 이상의 능력 증강 조합(combinations)"**이다. 즉 드로우 풀의 원소가 '증강'이 아니라 '증강+특정 스킬' 쌍이다.
   - https://www.ibtimes.com/league-legends-aram-mayhem-cuts-over-450-ability-augments-live-hotfix-3804331
2. **카드 표기**: 게임플 사전 체험기(한국) — *"스킬 증강 카드 상단에 챔피언 초상화와 함께 적용되는 스킬 아이콘이 표시된다."* 선택 전에 어느 스킬이 강화되는지 보인다. (WebFetch 요약 경유 인용)
   - https://www.gameple.co.kr/news/articleView.html?idxno=215744
3. **게임 내 툴팁 언어**: 획득 후 툴팁은 대상 스킬을 "your chosen ability"로 지칭한다(팬사이트 arammayhem.com이 전재한 실게임 문구: Terror "Whenever you cast your chosen ability…", Spell Split "Your chosen ability missile splits in two…", Pursuit of Power "Hit enemy champions with your chosen ability…"). '선택된 스킬'은 시스템이 지정한 그 스킬을 뜻한다.
4. **스킬 단위 적격성이 실재한다는 공식 증거(버그픽스 문구가 스킬 슬롯 단위)**:
   - V26.14: "Fixed a bug where **Pursuit of Haste was offered to Yasuo E**." (야스오 E는 부적격인데 제시되던 버그)
   - V26.15: "Fixed a bug where **Pursuit of Haste and Pursuit of Power is offered to Akshan's (E)**." / "Fixed a bug where **Pursuit of Power is offered to Akshan's (E), Draven's (Q), Illaoi's (E), and Malphite's (W)**."
   - V26.15: "Fixed a bug where Locke's (E) second dash did not grant Pursuit of Power or Pursuit of Haste **quest progress**."
   - V26.14: "Fixed a bug where It's Go Time did not correctly grant bonus move speed with **Master Yi's E, Ashe's Q, and Twitch's Q**."
   - V26.16: "Fixed a bug where Archmage did not refund **Azir (W)** properly." / V26.17: "Fixed a bug where **Echo Cast** clone will cast spells in the wrong direction after reconnecting."
   - 출처: https://wiki.leagueoflegends.com/en-us/V26.14 , V26.15 , V26.16 , V26.17 (wikitext 직접 확인)
5. **궁극기(R)도 대상이 된다**: Chain Reaction("If the upgraded ability is an ultimate, this effect deals 250% damage")과 Terrain'd(궁이면 피해 3배)의 위키 원문이 궁 대상 보정을 명시. Quickstep의 26.12 예시도 케넨 **R**이었다.
6. **속성 필터(§3 표의 '요구 스킬 속성')**: 투사체/대상 지정+투사체/넉백/속박·그라운딩/보호막/지형 생성/지속시간형 효과/강화 기본 공격 등 스킬 태그 기반. 태그가 없는 증강(흡수, 과충전, 메아리 시전 등)은 원칙상 모든 스킬에 붙을 수 있으나, 26.12 핫픽스~26.13 이후로는 "챔피언이 실제로 이득을 보는 스킬"로 큐레이션된다(§6).
7. **적격 스킬 중 어느 것이 뽑히는지(무작위인지, 스킬별 가중치가 있는지)는 공개된 바 없다 — 미확인.** 스터디 03의 Optimal/Viable/Average/Invalid 4단계(Inven Global 인터뷰)가 증강×챔피언 수준의 가중치임은 확인됐지만, 스킬 슬롯 수준 가중치는 어떤 소스에도 없다.

---

## 6. 26.12 "dead draws" 450+ 핫픽스와 26.13 개선의 정확한 내용

### 6-1. 타임라인과 원문

| 날짜 | 내용 | 근거 |
|---|---|---|
| 2026-06-09/10 (26.12) | 스킬 증강·퀘스트 증강 추가(신규 59종: 실버 12/골드 26/프리즘 21), 특성 시스템 제거 | V26.12 전사본(신규 목록 원문 §7-2 참조) |
| 2026-06-18 | **Quest: Support Main, Void Dash, Pat On The Back 3종 임시 비활성** | IBTimes(발표 전날 선행 조치로 기록) |
| 2026-06-19 | **라이브 핫픽스(클라이언트 패치 없음): 스킬 증강 조합 450개 이상 제거.** 발표: Eduardo "Riot Cadmus" Cortejoso(공식 소셜 계정), 보충 설명: Riot Phlox | IBTimes; X 게시물 https://x.com/ed_corte/status/2067698024776867879 |
| 2026-06-23~ (26.13) | 제공 방식 개선 공식 노트 + 티어 변경 + 등장률 버그 2건 수정(아래) | 공식 26.13 노트(영/한) |

### 6-2. 핫픽스가 제거한 것 — "dead draws"의 정의

- IBTimes 전재(요약 경유): *"when augment combinations that do not meaningfully interact with a champion's kit remain in the draw pool, players experience those draws as dead outcomes — functionally worse than a generic augment."* — 킷과 의미 있게 상호작용하지 않는 조합은 **범용 증강만도 못한 죽은 선택지**가 되므로, 낮은 임팩트(low-impact)·부적합(poor-fit)·버그(buggy) 조합 450+건을 풀에서 뺐다. 제거된 조합의 구체적 전체 목록은 공개되지 않았다(미확인).
- 스터디 03에서 확보한 예시(반복 최소화): 다수 스킬에서 작동하지 않던 Pursuit of Haste, 루시안 돌진 등 무의미한 스킬에 붙은 Echo Cast.

### 6-3. 26.13 공식 노트 원문(verbatim, 영/한 대조)

영어판( https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-13-notes/ ):
> "In our recent hotfixes, we have meaningfully improved how Ability Augments are offered to champions." / "These augments are now offered on spells that champions benefit from." / "We also fixed issues where certain spells could incorrectly receive augments that didn't work on them." / "We also fixed an issue that prevented several critical strike-related Augments, such as Jeweled Gauntlet and It's Critical, from appearing as often as intended." / "Additionally, we resolved a bug that significantly reduced the chance of Ability Augments appearing in the third and fourth Augment slots."

한국어판( https://www.leagueoflegends.com/ko-kr/news/game-updates/league-of-legends-patch-26-13-notes/ ):
> "최근 긴급 수정을 통해 스킬 증강이 챔피언에게 제시되는 방식이 의미 있게 개선되었습니다." / "이제 챔피언이 실질적으로 이점을 얻을 수 있는 스킬 증강이 등장합니다." / "특정 스킬에 효과가 적용되지 않는 증강이 잘못 제시되던 문제도 수정했습니다." / "보석 건틀릿과 치명적인 공격 등 여러 치명타 관련 증강 등장 빈도를 의도한 수준에 맞게 수정했습니다." / "세 번째 및 네 번째 증강 슬롯에 스킬 증강이 등장할 확률이 크게 낮아지던 버그를 수정했습니다."

같은 26.13에서 스킬 증강 밸런스 조정: Archmage(대마법사) 골드→프리즘, Quickstep(날쌘걸음) 프리즘→골드, Pin Cushion 못 피해 20-30→20-60, Pressure Cooker 화상 2%→1.5% (V26.13 위키 전사본 원문).

### 6-4. 이후 패치의 스킬 증강 관련 변경(위키 전사본 원문 확인)

- **26.14**: Yasuo E 제시 버그 수정, It's Go Time 이속 미적용(마스터 이 E·애쉬 Q·트위치 Q) 수정 등.
- **26.15**: Akshan E/Draven Q/Illaoi E/Malphite W 부적격 제시 수정, Locke E 퀘스트 진행 수정. (arammayhem.com 정리 기준 이 패치에 "invalid offers" 관련 포함 21건 수정 — 스터디 03과 일치)
- **26.16**: **Chain Reaction 프리즘→골드**, Archmage 관련 버그 2건(베이가 W 미환급, 아지르 W) 수정. ※arammayhem 요약은 이 티어 변경을 26.14로 표기 — 위키 공식 전사본(26.16)을 우선.
- **26.17**: **Tripleshot 타겟팅 개선("Now prioritizes enemies nearby the main target")**, Echo Cast 재접속 후 분신 방향 버그 수정.

---

## 7. 소스 간 상충·특이사항 (정직 신고)

### 7-1. 티어 상충 3건 — ⚠️ 미확정

| 증강 | 26.12 공식 노트(영·한 일치) | arammayhem.com(26.17) | 위키 모듈(26.17, 2026-09-02 최종 수정) |
|---|---|---|---|
| Terror(공포) | 프리즘 | 프리즘 | **실버** |
| BONK!(꽁!) | 골드 | 골드 | **실버** |
| Pursuit of Power(위력 추구) | 실버 | 실버 | **골드** |

26.13~26.17 공식 패치 노트 전사본에는 이 3종의 티어 변경 기록이 없다. 위키 모듈은 오늘(2026-09-02)까지 활발히 편집되는 문서라 **미기재(undocumented) 라이브 변경을 반영했을 가능성**과 **위키 편집 오류 가능성**을 가릴 수 없다 — 미확인으로 남긴다. (참고: arammayhem 요약이 "Pursuit of Power는 26.13에 retired"라고 한 것은 26.15·26.16 공식 버그픽스에 계속 등장하고 위키에 활성 등재된 사실과 모순 → 팬사이트 요약 오류로 판단.)

### 7-2. 기타

- **One Trick Pony(특기 빼면 시체, 26.12 프리즘 신규)**: 현 위키 모듈에 항목이 없다. 제거로 추정되나 어느 패치 노트에도 기록이 없음 — 시점 미확인.
- **Bolstered**: 26.12 신규 목록에도, 26.13~26.17 노트에도 없는데 모듈에 실버로 등재 — 추가 경위 미확인(모듈 편집 이력에 2026-07-28 "Added a datamined augment", 2026-08-07 "Seems to be enabled actually" 코멘트가 있어 데이터마이닝→활성화 확인 경로로 추정되나 대상 증강 특정 불가).
- 비활성 스킬 증강 4종: Void Dash(핫픽스 이후), Double Strike·Reload·Snap Back(내부 데이터만 존재 — 위키가 "exists in the internal augment data but appears to be disabled"로 명시). 향후 활성화 가능성은 미확인.
- 26.12 신규 59종 전체 목록(영문)은 위키 V26.12에, 한국어 대응 목록은 공식 한국어 패치 노트에 있음(본 조사에서 둘 다 원문 확보; §3 매핑의 근거).

---

## 8. 실측 성능 참고(arammayhem.com, 26.16~26.17 집계 — 팬사이트, 요약 경유)

| 증강 | 승률 | 픽률 | 비고 |
|---|---|---|---|
| Pursuit of Power(위력 추구) | 51.78% | 27.98% | 전체 #48 — 스킬 증강 중 최고 픽률급 |
| BONK!(꽁!) | 52.24% | 10.46% | #132. 잘 맞는 챔피언: 베인·나서스·트런들(강화 평타 스킬 보유) |
| Spell Split(주문 분산) | 49.13% | 8.51% | #149, 26.17 집계(2026-09-02 검증자 재조회, arammayhem/augments/spell-split). 종전 기재치 49.48%(26.16 집계)는 현 사이트에서 재확인 불가 ⚠️ 미검증 |
| Terror(공포) | 47.17% | 2.62% | #199. 통계 상위: 문도·아트록스·마스터 이(스킬 태그 무관하게 널리 제시됨을 시사) |
| Multishot(다중 공격) | 46.47% | 6.34% | 26.17 집계(승률 2026-09-02 재검증 일치; 픽률은 검증 시 보충 — arammayhem/augments/multishot) |
| Tripleshot(3연발) | 49.35% | 4.76% | #177, 26.17 집계(2026-09-02 검증자 재조회, arammayhem/augments/tripleshot). 종전 기재치 46.34%/1.72%(26.16 집계, 타겟팅 개선 이전)는 현 사이트에서 재확인 불가 ⚠️ 미검증 |

- 시사점: 다단계 퀘스트·조건부 프리즘 스킬 증강(Multishot/Tripleshot)은 평균 승률이 낮고, 단순·즉발형(Pursuit of Power, BONK!)이 성적이 좋다. 나무위키 아수라장 문서의 커뮤니티 평가("챔피언별 성능 격차가 심하다")와 부합.

---

## 9. 미확인 / 한계

- 스킬 증강의 **티어별·화면별 등장 확률 수치**: 비공개(레벨 9 트랙 보상의 증가 폭 포함).
- 적격 스킬이 여럿일 때 **어느 스킬이 지정되는지의 규칙**(무작위/가중치): 미공개.
- 제거된 450+ 조합의 전체 목록: 미공개.
- 티어 상충 3건(§7-1)과 One Trick Pony 제거·Bolstered 추가 경위: 미확인.
- Tooth Fairy의 퀘스트 구조 유무(/dev 소개 vs 현 위키 서술 불일치): 미확인.
- Quickstep의 현재 적격 조건(26.12 "self-targeted AoE" → 현 위키 무조건 서술): 미확인.
- WebFetch 경유 인용(공식 KR 패치 노트, 게임플, IBTimes, arammayhem, 나무위키)은 요약 모델을 거쳤으므로 자구 단위 오차 가능성 있음. 위키 자료는 전부 원본(raw wikitext/Lua) 직접 확인.

---

## 10. 출처 목록

**공식 위키 — 원본 직접 다운로드·파싱**
- Module:MayhemAugmentData/data (Lua, 225종 전수) — https://wiki.leagueoflegends.com/en-us/Module:MayhemAugmentData/data
- Module:MayhemAugmentData (테이블 렌더러 — Tier 열만 존재함의 근거) — https://wiki.leagueoflegends.com/en-us/Module:MayhemAugmentData
- ARAM: Mayhem (선택 화면 규칙·진행 트랙 레벨 9 원문) — https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem
- ARAM: Mayhem/Augments — https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Augments
- ARAM: Mayhem/Old content (26.12 제거 증강 표) — https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Old_content
- V26.12~V26.17 패치 전사본 — https://wiki.leagueoflegends.com/en-us/V26.12 (V26.13/V26.14/V26.15/V26.16/V26.17 동일 형식)
- 모듈 편집 이력 API — https://wiki.leagueoflegends.com/en-us/api.php?action=query&prop=revisions&titles=Module:MayhemAugmentData/data

**라이엇 공식**
- /dev: Augmentmaxxing ARAM: Mayhem (2026-05-27) — https://www.leagueoflegends.com/en-us/news/dev/dev-augmentmaxxing-aram-mayhem/
- 패치 노트 26.12 (영) — https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-12-notes/ / (한) — https://www.leagueoflegends.com/ko-kr/news/game-updates/league-of-legends-patch-26-12-notes/
- 패치 노트 26.13 (영) — https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-13-notes/ / (한) — https://www.leagueoflegends.com/ko-kr/news/game-updates/league-of-legends-patch-26-13-notes/
- 핫픽스 발표 X 게시물 — https://x.com/ed_corte/status/2067698024776867879

**언론/커뮤니티**
- IBTimes (6/19 핫픽스 상세) — https://www.ibtimes.com/league-legends-aram-mayhem-cuts-over-450-ability-augments-live-hotfix-3804331
- 게임플 (26.12 사전 체험기 — 카드 UI 서술) — https://www.gameple.co.kr/news/articleView.html?idxno=215744
- arammayhem.com — https://arammayhem.com/ability-augments/ , https://arammayhem.com/patch-notes/ , https://arammayhem.com/augments/terror/ , https://arammayhem.com/augments/bonk/ , https://arammayhem.com/augments/pursuit-of-power/ , https://arammayhem.com/augments/tripleshot/ , https://arammayhem.com/augments/spell-split/ , https://arammayhem.com/augments/multishot/
- 나무위키: 무작위 총력전: 아수라장 — https://namu.wiki/w/무작위%20총력전:%20아수라장
- esports.gg 26.12 가이드(403, 검색 스니펫만) — https://esports.gg/guides/league-of-legends/aram-mayhem-augments-26-12/
