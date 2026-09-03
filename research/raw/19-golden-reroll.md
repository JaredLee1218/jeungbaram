# 19. 황금 리롤(Golden Reroll / 금빛·황금 새로고침) 실제 메커니즘 확정 조사

- 조사일: 2026-09-03 (라이브 패치 26.17) / 조사자: A1 (황금 리롤 조사관)
- 계기: **사용자(실제 플레이어) 증언** — "황금 리롤은 게임당 1회를 우리가 선택하는게 아니라, 게임내 자동으로 리롤되는거야."
  → 현행 시뮬레이터 모델(플레이어가 게임당 1회 버튼으로 슬롯 지정 발동)은 **잘못됨**. 본 문서가 교체 모델을 확정한다.
- 방법: raw/01 §1-4·§6, raw/17 §3-1 재독 + WebSearch/WebFetch 재조사(영어 위키·loltheory·공식 KR 26.3 노트·나무위키·Riot Phlox X·GameGrin). 사용자 증언과 상충하는 소스는 사용자 증언 우선 원칙 적용.

---

## 0. TL;DR — 확정 모델 한 줄 요약

**황금 리롤은 플레이어가 보유·발동하는 자원이 아니다. 진행도 트랙 보상으로 해금되는 "확률"이며, 실버/골드 등급 선택 화면에서 리롤할 때 낮은 확률(합산 수치 비공개, 트랙 4단계 몫만 공식 +1%)로 자동 발동되어, 그 리롤 결과가 동급이 아닌 한 단계 높은 등급의 증강으로 나온다.** 게임당 횟수 제한 없음(한 게임 3회 실측 사례 존재). 프리즘 화면에서는 발동하지 않는다.

---

## 1. 수집한 증거 (소스별 원문)

### 1-1. 사용자 증언 (최우선 근거)
- "황금 리롤은 게임당 1회를 우리가 선택하는게 아니라, 게임내 자동으로 리롤되는거야."
- 확정되는 사실: ① 게임당 1회 아님 ② 플레이어가 선택(발동)하는 자원이 아님 ③ 자동 발동.

### 1-2. 라이엇 공식
- **지원 페이지**(support.riotgames.com, raw/17 §3-1에서 확보): *"Golden Re-roll (increased chance to re-roll a higher tier Augment)"* — 효과의 방향 = "리롤 시 상위 티어가 나올 확률 증가". 수치 비공개.
- **공식 KR 패치 26.3 노트**(WebFetch 요약 경유 — 자구 오차 가능) 진척도 트랙 보상:
  - 4단계: "시작 골드 300 ⇒ 금빛 새로고침" (미드패치 핫픽스로 교체)
  - 13단계: "황금 새로고침 — 증강 새로고침 시 높은 등급의 증강이 나올 수 있습니다"
  - 31단계: "금빛 새로고침 — 새로고침 시 높은 등급의 증강이 나올 확률이 증가합니다"
  - → 공식 문언 자체가 **"새로고침(리롤) 시" 확률 발동**으로 기술. 트랙 단계가 오르면 **확률이 증가**(누적형).
- **Riot Phlox X (2026-02, 26.03 핫픽스 보충)** — 유일한 공식 수치: *"We've adjusted the gold reward in the progression track to be a **1% chance of a golden reroll**. We agree that start of game gold wasn't the best reward here."*
  - → 트랙 4단계 보상의 몫 = **+1%p**. (1·13·31단계 몫과 합산 총량은 비공개)

### 1-3. 영어 위키 (wiki.leagueoflegends.com, 직접 fetch — 원문 인용)
- *"Golden Rerolls are also unlocked after claiming the level 1 reward of the progression track. Players who have obtained this reward have a chance to receive a Golden Reroll in selections offering **Silver- or Gold-tier** augments. This special type of reroll will be made available for **one of the offerings** in the selection, and can be used to receive an augment **one tier higher** than the current one."*
- 트랙 1단계 보상 문구: *"Gain a chance to receive a Golden Reroll in an augment selection screen."*
- 위키의 현행 트랙 표에서 황금 리롤 명시 보상은 1단계뿐(직접 fetch 확인) — 26.3 노트의 4/13/31단계 기술과 다름. 트랙 개편 또는 위키 요약 누락으로 추정(§4 미확인).
- 일반 리롤 규칙(재확인): *"An augment offering can be rerolled once at most to receive a different augment of the same tier, for a total of six possible augment choices in a given selection screen."*

### 1-4. loltheory 가이드 (직접 fetch)
- *"any selection screen offering Silver- or Gold-tier augments has a chance to put a Golden Reroll on one of its offerings, which upgrades that augment one tier higher instead of swapping it for another of the same tier."* — 위키와 동일 취지: 실버/골드 화면 한정, 슬롯 1개, 동급 교체 대신 +1등급.

### 1-5. 나무위키 (직접 fetch)
- 진척도 보상 항목에서 명칭 "**금빛 새로고침**": *"낮은 확률로 1회에 한해 새로고침 시 상위 등급의 증강을 뽑을 수 있는 기회를 얻음"* — "낮은 확률" + "새로고침 시" 발동 + "1회에 한해"(1회의 리롤에 적용된다는 뜻으로 해석 — 게임당 1회 해석은 아래 1-6 실측과 모순이라 기각).

### 1-6. 커뮤니티 실측 (빈도의 방증)
- YouTube: "**산삼보다 귀한 황금리롤이 한 판에 3번이 뜨는** 유효 4프리즘 제드 [칼바람 아수라장]" (https://www.youtube.com/watch?v=kuuVbhomie0)
  - → ① 게임당 1회 제한 없음(한 게임 3회 실측) ② 그러나 "산삼보다 귀한" = 매우 드묾(영상 소재가 될 정도) → 발동 확률은 낮은 한 자릿수 %대로 추정.
- 한국 커뮤니티에서 발동 확률 수치를 측정·공개한 글: 발견하지 못함.

### 1-7. 소스 간 상충과 판정
- **위키·loltheory**: "화면 생성 시 슬롯 1개에 황금 리롤이 부여되어 보인다"(사전 부여형) vs **공식 효과 문언·지원 페이지·Phlox·나무위키·사용자 증언**: "리롤 시 확률로 상위 등급이 나온다"(리롤 시점 발동형).
- 판정: **리롤 시점 발동형 채택**. 근거: (a) 사용자 증언 "자동으로 리롤되는거야" 최우선, (b) 공식 1차 소스(지원 페이지·패치노트·Phlox) 문언이 전부 "리롤 시 확률", (c) 사전 부여형은 위키 편집자의 UI 관찰 기술로 보이며, 자동 모델 시뮬레이터에서는 두 형태의 결과 분포 차이가 미미(플레이어가 황금 표시를 보고 슬롯을 고르는 전략 여지 유무 차이인데, 우리 모델은 어차피 자동). 사전 부여형 가능성은 §4에 미확인으로 남긴다.
- **"화면당 최대 1회" 여부**: 위키가 "a Golden Reroll"(단수)로 기술 → 화면당 최대 1회로 근사. 반례 실측 없음.

---

## 2. ★ 확정 모델 (시뮬레이터 구현 규칙 — 이대로 코딩)

명칭: **자동 황금 리롤 (G-AUTO)**. 전제: 시뮬레이션 대상 플레이어는 진행도 트랙에서 황금 리롤을 해금한 상태(1단계 보상은 사실상 전원 보유).

1. **플레이어 액션에서 황금 리롤 제거.** 액션은 리롤(슬롯당 최대 1회)과 선택뿐 — 기존과 동일.
2. **발동 판정**: 플레이어가 슬롯을 리롤하는 순간, 시드 RNG로 판정한다.
   - 조건: 현재 선택 화면의 등급이 **실버 또는 골드**일 것 (프리즘 화면은 판정 없이 항상 동급 리롤).
   - 조건: 이 화면에서 **아직 황금 리롤이 발동한 적 없음** (근사: 화면당 최대 1회 — 위키 단수 표현 근거).
   - 두 조건 충족 시 확률 **g**로 발동.
3. **발동 효과**: 그 리롤의 결과 증강을 동급 풀이 아니라 **화면 등급+1 등급의 적격 풀**에서 뽑는다 (실버 화면→골드 증강, 골드 화면→프리즘 증강). 미발동 시 기존대로 동급 풀.
4. **기존 리롤 규칙 불변**: 슬롯당 최대 1회 리롤, 화면당 최대 6종 노출, "한 번 제시된 증강은 재등장 없음"(황금 리롤로 나온 상급 증강도 동일하게 제시 이력에 기록).
5. **게임당 횟수 제한 없음** — 화면마다 독립 판정 (한 게임 3회 실측 사례, §1-6).
6. **결정론(시드 재현)**: 발동 판정의 RNG 소비는 리롤 액션마다 **고정 횟수(1 draw)** 로 소비한다 — 프리즘 화면·발동 후 화면 등 판정이 불필요한 리롤에서도 동일하게 소비하거나, 소비 규칙을 결정적으로 고정해 주석으로 명시(구현팀 재량이되 리플레이 일관성 필수). 판정 draw → 결과 증강 draw 순서 고정.
7. **확률 API(rerollDistribution 등)**: 혼합 분포로 갱신 —
   - 판정 가능 상태(실버/골드 화면·화면 내 미발동): `P(a) = (1-g)·P_동급(a) + g·P_상급(a)`
   - 프리즘 화면 또는 화면 내 발동 이력 있음: `P(a) = P_동급(a)`
   - routeTargets류 "S 획득 확률" 계산도 같은 혼합을 사용.
8. **UI**:
   - 황금 리롤 버튼 제거.
   - 발동 시 교체된 카드에 "✨ 황금 리롤!" 배지 + 반짝 애니메이션(`prefers-reduced-motion` 시 애니메이션 없이 정적 배지).
   - 확률 스트립의 황금 항목 → "리롤 시 상급 등급 확률 g%"로 재구성.
9. **공유 URL 하위 호환**: 구버전 URL의 `g` 액션은 **무시(no-op)** 처리 + 주석("구버전 플레이어 발동식 황금 리롤 액션 — 26-09-03 자동 발동 모델 전환으로 폐기, 크래시 방지 위해 무시"). 재해석(일반 리롤로 치환)은 RNG 소비 순서를 흔들어 금지. 신규 URL은 자동 발동이 시드에 내재되므로 황금 액션 인코딩 자체가 사라진다.

---

## 3. 근사 파라미터 (전부 "근사:" 표기 + 설정 가능 상수로)

| 파라미터 | 채택값 | 근거/한계 |
|---|---|---|
| **g** — 리롤 시 황금 발동 확률 | **0.04 (4%)**, 상수 `GOLDEN_REROLL_CHANCE`로 설정 가능 | 근사: 공식 수치는 트랙 4단계 몫 "+1%"(Riot Phlox)뿐. 트랙 여러 단계(1·4·13·31)에서 해금·증가하는 누적형이며 합산 총량 비공개 → 트랙 완주 유저 가정으로 1%×수 단계 합산치를 4%로 추정. 커뮤니티 체감("산삼보다 귀함", 게임당 3회는 영상 소재감)과 부합: g=4%일 때 게임당 1회 이상 ≈ 최대 ~11%(적격 화면 3곳×리롤 전부 사용 가정), 3회 발동은 ~0.006% 수준 |
| 화면당 최대 1회 제한 | 있음 | 근사: 위키 "a Golden Reroll" 단수 표현. 반례 실측 없음. 제거해도 분포 영향 미미(g가 작아서) |
| 발동 형태 = 리롤 시점 판정 (사전 부여형 아님) | 리롤 시점 | 사용자 증언 + 공식 문언 우선. 위키의 "슬롯 사전 부여" 서술은 미확인 변형으로 보류(§4) — 자동 모델에서는 결과 분포 사실상 동일 |
| 트랙 진행도별 g 차등 | 모델링 안 함 (단일 g) | 시뮬레이터는 "해금 완료 유저" 단일 페르소나. 필요 시 g만 조절 |

---

## 4. 미확인 / 후속 트리거

1. **g의 실제 합산 수치** — 공식 비공개. 커뮤니티 대규모 실측도 발견 못 함. (Phlox 1%는 4단계 몫만)
2. 트랙 보상 구성의 현행 상태 — 26.3 노트(4/13/31단계) vs 현행 위키(1단계만 명시)의 불일치. 트랙 개편 여부 미확인. 시뮬레이터엔 영향 없음(단일 g 모델).
3. 사전 부여형(화면 생성 시 슬롯 1개에 황금 표시) 가능성 — 위키·loltheory 서술. 클라이언트 실화면 증거 미확보. 채택 모델과의 차이는 플레이어 전략 여지뿐(자동 모델에선 무의미).
4. 프리즘 화면 완전 배제의 직접 문언 — 위키·loltheory가 "Silver- or Gold-tier" 한정으로 기술(강한 근거)하나 "프리즘에선 절대 없음"의 명시 부정문은 없음. (프리즘 위 등급이 없으므로 논리상으로도 배제)
5. 황금 리롤로 나온 증강의 풀 회계(제시 이력 기록) — 일반 규칙("Augments are offered only once")의 적용을 가정. 반례 없음.
6. 26.18(9/10) 이후 황금 리롤 관련 변경 여부 — 패치 프리뷰상 언급 없음(raw/17 §1).

---

## 5. 출처

- 사용자(실제 플레이어) 증언 — 2026-09-03, 본 프로젝트 대화 (최우선 근거)
- 영어 위키 ARAM: Mayhem (황금 리롤·리롤 규칙·트랙 1단계 보상 원문, 직접 fetch): https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem
- Riot Phlox X — 트랙 4단계 = "1% chance of a golden reroll" (유일한 공식 수치): https://x.com/RiotPhlox/status/2019601265681191246
- 공식 KR 패치 26.3 노트 — 트랙 4/13/31단계 문언 (WebFetch 요약 경유): https://www.leagueoflegends.com/ko-kr/news/game-updates/patch-26-3-notes/
- 라이엇 지원 페이지 — "Golden Re-roll (increased chance to re-roll a higher tier Augment)" (raw/17 §3-1, r.jina.ai 경유): https://support.riotgames.com/en-us/league-of-legends/events/league-of-legends-aram-mayhem-game-mode
- loltheory 2026 가이드 (직접 fetch): https://blog.loltheory.gg/aram-mayhem/
- 나무위키 무작위 총력전: 아수라장 — "금빛 새로고침" 문언 (직접 fetch): https://namu.wiki/w/무작위%20총력전:%20아수라장
- GameGrin — 트랙에 Golden Reroll / Golden Reroll +(increased chance) 2종 존재 (r.jina.ai 경유): https://www.gamegrin.com/news/league-of-legends-releases-free-battle-pass-for-aram-mayhem-extension/
- YouTube — 한 게임 3회 발동 실측(게임당 1회 아님의 방증): https://www.youtube.com/watch?v=kuuVbhomie0
- 선행 조사: research/raw/01-mode-mechanics.md §1-4·§6, research/raw/17-official-latest.md §3-1
