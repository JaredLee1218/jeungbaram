# 통계 사이트 역추적: 챔피언별 실제 증강 풀의 실측 증거 (Q1 실증)

- 조사일: 2026-09-02, 대상 패치: 26.17 (arammayhem.net·mayhemmeta.com 표기 기준; op.gg는 집계 기간 미표기)
- 대상: ARAM: Mayhem(무작위 총력전: 아수라장), 역할군 대표 6명 — **징크스(원딜) / 브랜드(법사) / 말파이트(탱커) / 제드(암살자·기력) / 소라카(서포터) / 다리우스(전사)**
- 방법: 각 사이트의 챔피언별 증강 통계 페이지 HTML을 직접 다운로드(curl)하여 서버렌더링된 증강 목록·픽률·승률·게임 수를 파싱, 6명 간 집합 연산(교집합/차집합) 수행. "챔피언 A의 통계에 없는 증강 = A의 풀에서 제외됐을 가능성"이라는 역추적 논리.
- 선행 스터디(03-champion-augment-pools.md)에서 이미 확인한 것: 라이엇의 챔피언별 필터링 공식 확인, Optimal/Viable/Average/Invalid 4단계, 명문화 제한 소수. **이 문서는 그 "Invalid(완전 제외)"가 실제 데이터에 어떻게 찍히는지를 실측으로 보인다.**

---

## 0. 핵심 결론 요약

1. **챔피언별 증강 풀 차이는 실측 통계에 뚜렷하게 찍힌다.** 관측된 전체 증강 합집합 222종(6명 기준) 중, 6명 모두에게 통계가 잡힌 증강은 **양 소스 공통 기준 59종(26.6%)** 뿐이다. 나머지는 챔피언에 따라 있거나 없다.
2. 부재 패턴은 무작위가 아니라 **스탯·메커니즘 계열 단위로 깔끔하게 갈라진다**: AD/크리 계열은 브랜드·말파이트·소라카에 없음, AP 계열은 징크스·제드·다리우스에 없음, **마나 계열은 기력 챔피언인 제드에게만 없음**, 아군 힐/실드 계열은 소라카에게만 있음, 이동기(대시) 계열은 대시 보유자인 말파이트·제드에게만 있음, 저격(600+ 사거리) 계열은 징크스·브랜드·소라카에게만 있음. → **개발자가 말한 "클래스 풀에서 Invalid 완전 제외"의 실체가 바로 이것** — 사용자의 "원딜에겐 원딜용, 법사에겐 법사용" 체감의 직접 증거.
3. 표본이 충분히 커서(챔피언당 추정 3만~10.8만 게임) 우연한 미관측으로는 설명이 안 된다. 다른 챔피언에게서 픽률 3%~29%씩 나오는 증강이 특정 챔피언 통계에 **두 독립 소스 모두 0건**인 사례가 53종 이상 — 구조적 제외로 판정.
4. 위키 명문 조건보다 실제 필터가 **더 좁은** 사례 발견: 원거리 전용으로 명문화된 Draw Your Sword가 원거리인 브랜드·소라카에게도 전혀 안 잡힘(→ 사실상 "공격/평타 클래스 전용"으로 추정). 반대로 킷 조건이 예상과 어긋나는 사례도 있음(속박 스킬(E)이 있는 징크스에게 속박 증강 Cruelty 부재, 힐 없는 다리우스에게 Windspeaker's Blessing 존재 — 셀프힐(Q) 인정 추정).
5. 풀 크기 자체도 챔피언마다 다르다: 관측 기준 **말파이트가 최대(op.gg 193종), 징크스가 최소(169종)**. 탱커+AP 하이브리드는 탱커·AP 계열을 모두 받는 반면, 순수 크리 원딜은 전용(크리) 계열을 받는 대신 제외 계열이 가장 많았다(양 소스 공통 부재 53종).

---

## 1. 조사 방법과 소스 신뢰성

### 1-1. 사용 소스와 수집 방식

| 소스 | URL 패턴 | 수집물 | 챔피언당 등재 수 | 비고 |
|---|---|---|---|---|
| **arammayhem.net** (이하 AMNET) | `https://www.arammayhem.net/champion-stats/{id}-{이름}/augments/` ("Hextech table") | 증강명·희귀도·승률·픽률·게임 수 전체 표 (SSR HTML) | 107~136종 | 패치 26.17 표기. 픽률 0.05%짜리 행까지 등재 → 사실상 "픽 기록이 있는 전부" (독립 재fetch 검증 2026-09-02: 징크스 Dimension Shift 0.05%, 브랜드 Dimension Shift 0.06% 등 등재 확인 — 초안의 "0.18%"보다 커트라인이 더 낮음) |
| **mayhemmeta.com** (이하 MM) | `https://mayhemmeta.com/champions/{이름}` | Next.js flight 데이터 내 전체 증강 rows JSON | 107~136종 | 최소 게임 수 4~15까지 등재. **행 수·증강 ID 체계(예: Critical Missile=1356)가 AMNET과 일치 → 같은 데이터 계열로 판정, 독립 소스로 취급하지 않음** |
| **op.gg** | `https://op.gg/lol/modes/aram-mayhem/{이름}/augments` | SSR된 챔피언별 증강 목록(이름만; 수치는 클라이언트 로딩) | 169~193종 | 집계 기간 미상(더 긴 창으로 추정 — 현재 비활성인 Adamant·Droppybara·Clown College 등도 등재). AMNET 계열과 **독립** |
| arammayhem.com | `https://arammayhem.com/champions/{이름}` | 추천 증강만 노출(전체 표 없음) | ~18종 | 챔피언별 전체 통계 페이지가 없어 **본 분석에서 제외** (선행 스터디에서 증강별 페이지는 활용) |

- 참고: 과제에 명시된 arammayhem.com은 큐레이션 사이트라 역추적에 부적합했고, 동일 목적의 **arammayhem.net(다른 사이트)** 이 완전한 챔피언별 통계 표를 제공해 이를 주력으로 사용했다. u.gg·blitz.gg·metasrc는 JS 렌더링 의존이 커서 미사용.
- 유효 독립 소스는 **2계열**: (A) AMNET/MM 계열, (B) op.gg. 이하 "양 소스"는 이 2계열을 뜻한다.

### 1-2. 표본 크기 (게임 수 역산)

증강별 `게임 수 ÷ 픽률`로 챔피언 총 게임 수를 역산(중앙값):

| 챔피언 | AMNET 추정 게임 수 | MM 추정 게임 수 | AMNET 메타 정보(26.17) |
|---|---|---|---|
| 징크스 | ~82,000 | ~27,000 | T2, 승률 52.43%, 픽률 10.35% |
| 브랜드 | ~108,000 | ~30,000 | T1, 52.82%, 13.77% |
| 말파이트 | ~80,000 | ~21,700 | T5, 47.32%, 10.30% |
| 제드 | ~64,000 | ~17,100 | T3, 49.71%, 7.72% |
| 소라카 | ~30,000 | ~15,000 | T5, 50.00%, 3.85% |
| 다리우스 | ~57,000 | ~12,100 | T5, 48.10%, 7.30% |

→ 가장 작은 소라카도 3만 게임. 게임당 증강 4개 선택·선택지 12~18개 노출 구조에서, **풀에 실제로 존재하는 증강이 이 표본에서 픽 0건일 확률은 사실상 0** (독립 재검증 실측: AMNET 최저 등재 픽률은 0.05~0.06% 수준까지 내려가므로 등재 커트라인은 극히 낮음. 단, 픽률 0.2% 미만 행은 픽률·게임 수 열이 서로 불일치하는 경우가 있어(예: 다리우스 Hide on Bush 0.07%·282게임 → 역산 시 총 게임 수와 모순) 저픽률 행의 개별 수치 신뢰도는 낮음 — 존부 판정에는 영향 없음). 따라서 "양 소스 모두 부재"는 구조적 제외의 강한 증거다.

### 1-3. 신뢰도 판정 규칙 (본 문서 전체에 적용)

| 관측 상태 | 해석 | 신뢰도 |
|---|---|---|
| **AMNET·op.gg 모두 부재** + 다른 챔피언에게 픽률 높음(≥3%) | **구조적 제외(Invalid)** | 높음 |
| AMNET·op.gg 모두 부재 + 계열 전체가 동일 패턴(예: 대시 5종 동일) | 구조적 제외 | 높음(계열 일관성 보강) |
| AMNET 부재·op.gg 등재 | 풀에는 있으나 극히 드물게 제시(Optimal급 희귀)되거나 아무도 안 뽑음, 혹은 **과거 패치(필터 강화 전) 잔재** | 낮음 — 구조적 제외라 단정 불가 |
| op.gg만 등재 + 현재 비활성 증강(Adamant 등) | 과거 데이터 잔재 | — |

핵심 함의: 통계 사이트는 **픽(선택)** 만 기록하므로, "제시됐지만 안 뽑힌 것"과 "아예 제시 안 된 것"을 완전히는 구분 못 한다. 완전 부재(Invalid)만 깨끗하게 검출되고, Optimal/Viable/Average 간 **가중치 차이는 픽률에 섞여서만**(제시율×선택률) 보인다.

---

## 2. 결과 (1): 6명 전원 공통 증강

- 관측 합집합: **222종** (양 소스 합산; AMNET만 기준 197종, op.gg만 기준 222종)
- 6명 전원에게 잡힌 증강: **AMNET 기준 59종 / op.gg 기준 130종 / 양 소스 모두 전원 등재 59종**
  - 차이 이유: op.gg는 커트라인·집계 창이 느슨해 "이론상 전원 제공 + 특정 역할군만 실제로 뽑는" 증강(예: 크리 스탯 계열 Deft·Vulnerability·Tap Dancer가 op.gg에선 6명 전원, AMNET에선 징크스만)이 전원 등재로 잡힘.
- 양 소스 공통 59종의 성격: **역할 무관 범용** — 스탯류(Stats!, Stats on Stats!, Stats on Stats on Stats!, Goldrend, With Haste), 원소 영혼(Infernal/Mountain/Ocean/Omni Soul), 눈덩이류(Biggest Snowball Ever, Holy Snowball, Snowblast, Snowday, Poro Stampede), 골드/변환류(Transmute: Chaos/Gold/Prismatic, King Me, High Roller, Pandora's Box), 궁극기류(Ult Bot, Ultimate Awakening/Revolution/Unstoppable), 아이템류(Upgrade Sheen, Jeweled Gauntlet, Mad Scientist), 스킬가속 W/E(Bread And Jam, Bread and Cheese — 단 **Q 대상인 Bread And Butter는 징크스 제외**, §4-2), 기타(Dimension Shift, Hide on Bush, Urf's Champion, Overextender 등).
- 즉 사용자가 어떤 챔피언을 잡아도 매 게임 마주치는 "공용 배경 풀"은 이 ~59종(+전원 제공이되 역할별 선호가 갈리는 수십 종)이고, 나머지는 역할군·킷에 따라 켜지고 꺼진다.

---

## 3. 결과 (2): 역할군(계열)별로만 나타나는 증강 — 차집합 클러스터

패턴 표기: `징브말제소다` 순서, 1=통계 존재 / 0=부재. 왼쪽=AMNET, 오른쪽=op.gg. 두 소스가 일치하는 것을 우선 수록(일치=신뢰도 높음).

### 3-1. AD/크리티컬 계열 → AD 트리오(징크스·제드·다리우스) 전용

| 증강 | AMNET | op.gg | 효과 요지 | 최고 픽률 | 판정 |
|---|---|---|---|---|---|
| Blunt Force | 100101 | 100101 | AD 20% 증가 | 제드 12.6% | **구조적: 브·말·소 제외** (높음) |
| Upgrade Collector | 100101 | 100101 | 수집가 업그레이드 | 징크스 10.1% | 동상 (높음) |
| Ultra Hydra | 100101 | 100101 | 히드라 업그레이드 | 제드 4.7% | 동상 (높음) |
| Upgrade Death's Dance | 000101 | 000101 | 죽무 업그레이드 | 다리우스 9.4% | 근접 AD 2인만 (높음) |
| Spin To Win | 000101 | 000101 | '회전' 스킬 가속+피해 30% | 다리우스 10.5% | **킷 조건**: 6명 중 회전 스킬 보유는 제드 E·다리우스 Q뿐 — 위키 적격 목록과 정확히 일치 (높음) |
| Upgrade Sundered Sky | 000101 | 101101 | 균열된 하늘 업그레이드 | 다리우스 5.5% | 브·소 제외 확실, 징크스는 op.gg에만 (중간) |
| Upgrade Ravenous Hydra | 100101 | 101101 | 굶주린 히드라 | 제드 6.5% | 브·소 제외 (높음) |
| escAPADe | 100101 | 111101 | **AP→AD 변환** | 제드 6.1% | AMNET 기준 AD 트리오만 — ADAPt의 거울상 (중간) |
| Upgrade Infinity Edge | 100000 | 100101 | 무한의 대검 | 징크스 19.9% | **브·말·소 제외 확실**(양 소스), 제·다는 op.gg에만 (높음) |
| Critical Missile | 100000 | 110010 | 크리 시 미사일 발사+크리 25% | 징크스 **28.65%** | **말·제·다 제외 확실**. 픽률 28.65%짜리가 0건 = 최강급 구조적 증거 (높음) |
| Critical Rhythm | 100000 | 101100 | 크리 계열 | 징크스 15.6% | 브·소·다 제외 (높음) |
| Draw Your Sword | 100000 | **100000** | 원거리→근접 전환+AD/흡혈 | 징크스 2.6% | §4-1 참조 — **원거리인 브랜드·소라카에도 없음** (높음) |
| Typhoon | 100000 | 110111 | 평타 추가 미사일(온힛) | 징크스 8.6% | **말파이트만 양 소스 부재** — 평타 클래스 외 제외로 추정 (중간) |
| Dual Wield / Fan The Hammer / Crit 'n Cast / Endless Decimation / Hellbent / Rite of Ascension | 대체로 100x01 | 111101 | 평타/전투 계열 | 징 16.7% / 징 12.4% / … | **공통점: 소라카만 양 소스 부재** — §5-5 (높음) |
| Tap Dancer, Vulnerability, Deft, Double Tap, It's Critical, Light 'Em Up!, Tank It Or Leave It | 100000 | **111111** | 크리/평타 스탯 | 징 11.2% / 19.1% / 13.2% / 10.6%… | op.gg엔 전원 등재 → **제외가 아니라 "징크스만 뽑는"** 계열. 가중치·선호 효과 (낮음~중간) |

### 3-2. AP 계열 → 마법사 트리오(브랜드·말파이트·소라카) 전용

| 증강 | AMNET | op.gg | 효과 요지 | 최고 픽률 | 판정 |
|---|---|---|---|---|---|
| ADAPt | 011010 | 011010 | **AD→AP 변환** | 브랜드 7.3% | **구조적: 징·제·다 제외** (높음) |
| Eureka | 011010 | 011010 | (AP 기반) 스킬 가속 | 브랜드 11.5% | 동상 (높음) |
| Big Brain | 011010 | 011010 | 보호막(AP 스케일) | 말파이트 3.0% | 동상 (높음) |
| Master of Duality | 011010 | 011010 | AP 하이브리드 | 말파이트 0.9% | 동상 (높음, 픽률 낮아 보조 증거) |
| Ominous Pact | 011010 | 011010 | AP 계열 | 브랜드 1.6% | 동상 (높음, 계열 일관성) |
| Wooglet's Witchcap | 011010 | 011010 | AP 모자 아이템 | 브랜드 3.4% | 동상 (높음) |
| Witchful Thinking | 011010 | 011110 | +AP | 말파이트 5.9% | 징·다 제외 확실. **제드가 op.gg에만 있음**(과거 패치 잔재 추정) (중간) |
| Upgrade Zhonya's | 011010 | 011110 | 존야 업그레이드 | 브랜드 4.7% | 징·다 제외 (높음) |
| Phenomenal Evil | 111010 | 111010 | 스킬 적중당 AP 영구 +1 | 브랜드 12.8% | **제드·다리우스 제외, 징크스 포함**(!) — AP 예외가 "AD 근접"만 찍는 사례. 징크스가 왜 포함인지는 미확인 (높음) |
| Zealot | 101000 | 111010 | 크리+공속(?) | 징크스 4.3% | 제드·다리우스 제외 (중간) |
| Warlock Juicebox / Ice Cold | 011010 | **111111** | AP 계열 | 브 15.4% / 브 13.6% | op.gg 전원 등재 → 제외 아닌 선호/가중치 차이 (낮음) |

### 3-3. 마나 계열 → 기력 챔피언(제드)만 정확히 제외

| 증강 | AMNET | op.gg | 효과 요지 | 판정 |
|---|---|---|---|---|
| Mind to Matter | 011011 | 111011 | (마나 기반) 체력 획득 | **제드만 양 소스 부재** (높음) |
| Overflow | 011010 | 111011 | 마나 소모 2배·효과 증폭 | **제드만 양 소스 부재** (높음) |
| Juiced | 111011 | 111011 | 온힛 마나 소모 마법 피해 | **제드만 양 소스 모두 부재** (높음) |

→ 6명 중 마나 미사용은 제드(기력)뿐이고, 마나 증강 3종이 모두 제드에게만 없다. **선행 스터디의 미확인 항목("아수라장에서 마나 증강이 마나 없는 챔피언에게 제외되는지 — 공식 미확인")이 실측으로 확인됨** (단, 표본이 기력 1명이므로 아트록스류 무자원 챔피언까지 일반화는 추가 확인 필요).

### 3-4. 아군 힐/실드 계열 → 소라카 전용 (서포터 전용 풀의 실체)

| 증강 | AMNET | op.gg | 효과 요지 | 소라카 픽률 | 판정 |
|---|---|---|---|---|---|
| Sonic Boom | 000010 | 000010 | 아군 강화/힐/실드 시 고정 피해+둔화 | **14.8%** | **구조적: 나머지 5명 전원 제외** (높음). 아레나의 27명 화이트리스트 방식 계승 정황 |
| Wee Woo Wee Woo | 000010 | 000010 | 아군 잃은 체력 기반 이속·힐 증폭 | 12.3% | 동상 (높음) |
| Empowered By The Faithful | 000010 | 000010 | 축복 아군 피해→충격파 처형 | 10.8% | 동상 (높음) |
| Mercy's Strike | 000010 | 000010 | 아군 힐/실드 후 강화 평타 | 5.1% | 동상 (높음) |
| All For You | 000010 | 001010 | 아군 대상 힐/실드 30% 증폭 | 15.3% | 소라카 외엔 op.gg 말파이트뿐 (높음) |
| Spirit Bomb | 000010 | 000011 | 힐/실드 축적→원기옥 | 12.9% | 다리우스가 op.gg에만 (중간) |
| Empyrean Promise | 000010 | 000011 | 힐실드 파워+아군 순간이동 소환사 주문 | 5.2% | 동상 (중간) |
| Support Main (퀘스트) | 000000 | 000010 | 서포터 퀘스트 | — | 26.12 핫픽스로 비활성 — op.gg 잔재. 활성 당시 소라카만 (중간) |
| First-Aid Kit / Protein Shake / Laser Heal | 000010 | 011011 등 | 힐실드 파워 스탯류 | 21.9% / 9.0% | **징크스·제드만 일관 제외** — "힐/실드 무관 클래스"만 자르는 느슨한 필터로 추정 (중간) |
| Windspeaker's Blessing | 000011 | 000011 | 힐/실드가 방어력·마저 부여 | 7.0% | **소라카+다리우스** — §4-3 (높음, 해석은 미확인) |
| Circle of Death | 000011 | 000011 | 자신의 힐·재생 70%만큼 마법 피해 | 7.5% | 동상 — 셀프힐(다리우스 Q) 인정 추정 (높음, 해석은 추정) |
| Ravenous Bind | 010010 | 110011 | 속박 스킬에 피해+힐 부여 | 5.0% | 말파이트·제드 제외(속박 스킬 조건, §3-6) (중간) |

### 3-5. 이동기(대시) 계열 → 대시 보유자(말파이트 R·제드 W)만

| 증강 | AMNET | op.gg | 판정 |
|---|---|---|---|
| Dashing | 001100 | 001100 | **구조적: 징·브·소·다 제외** (높음) |
| Earthwake | 001100 | 001100 | 동상 (높음) |
| Outlaw's Grit | 001100 | 001100 | 동상 (높음) |
| Shadow Runner | 001100 | 001100 | 동상 (높음) |
| Swift and Safe | 001100 | 001100 | 동상 (높음) |
| Void Dash (비활성) | 000000 | 000100 | 활성 당시 제드만 관측 — 말파이트 R 대시는 이 퀘스트엔 미인정? (미확인) |

→ 5종이 **완벽히 동일한 패턴**으로 양 소스 일치. 6명 중 대시/점멸 스킬 보유는 말파이트(R)·제드(W)뿐. 아레나의 "이동기 없는 73명 제외 리스트"(선행 스터디 §3-2: 징크스·브랜드·소라카·다리우스 모두 그 리스트에 있음)와 정확히 합치 — **아레나식 이동기 예외가 아수라장에도 살아있음을 실측 확인**.

### 3-6. CC(속박/접지) 계열 → 하드 CC 보유자 중심 (단, 예외 있음)

| 증강 | AMNET | op.gg | 효과 요지 | 판정 |
|---|---|---|---|---|
| Cruelty | 011001 | 011011 | 속박/접지 시 혜성 소환 | 브·말·(소)·다 — **제드 제외 확실**(속박 없음 ✓). **징크스도 양 소스 부재** — E(불꽃 아가리)가 속박인데도 없음. §4-4 (제드 높음 / 징크스 관측 확실·이유 미확인) |
| Slap Around | 011001 | 111011 | 속박/접지당 적응형 능력치 스택 | 제드만 양 소스 부재 (높음) |
| Soul Eater | 011001 | 111011 | 속박 시 최대 체력 획득 | 제드만 양 소스 부재 (높음) |
| Impassable | 011001 | 111011 | 여진+빙결 강화 룬 획득 | 제드만 양 소스 부재 (높음) |
| Courage of the Colossus | 011001 | 111011 | 속박 시 보호막 | 제드만 양 소스 부재 (높음) |
| Ravenous Bind | 010010 | 110011 | 속박 '스킬 증강'형 | 말파이트·제드 부재 — 말파이트 궁(에어본)은 부적격 스킬로 추정 (중간) |

→ "속박 계열은 제드(하드 CC 없음)에게 안 뜬다"는 아레나 예외(제드가 실제로 그 37명 리스트에 있음)와 합치.

### 3-7. 저격/포킹 계열 → 장거리 3인(징크스·브랜드·소라카)

| 증강 | AMNET | op.gg | 효과 요지 | 판정 |
|---|---|---|---|---|
| Skilled Sniper | 110010 | 110010 | 600+ 거리 적중 시 쿨다운 80% 환급 | **말·제·다 제외** (높음) |
| From Downtown | 110010 | 111110 | 저격 시 지연 폭발 | 다리우스 제외 확실, 말·제는 op.gg 등재 (중간) |

### 3-8. 근접/탱커/전사 계열

| 증강 | AMNET | op.gg | 효과 요지 | 판정 |
|---|---|---|---|---|
| BONK! | 000001 | 000001 | "?로 강화된 평타/스킬" 30% 추가 피해 | **다리우스 전용**(6명 중). 강화 평타 스킬(W) 조건 추정 — 근접 전체가 아님 (관측 높음/조건 미확인) |
| Stay Resolute | 001101 | 001101 | 스킬 적중 시 방어력/마저 (스킬 증강형) | **말·제·다 전용, 징·브·소 제외** (높음) |
| Quickstep | 001001 | 001101 | "?" 스킬 사용 시 커서 방향 대시 부여 | 징·브·소 제외 (높음) |
| Upgrade Immolate | 001001 | 001101 | 불사르기(탱커 아이템) 골드 | 징·브·소 제외 (높음) |
| Icathia's Fall | 000000(26.17 비활성 추정) | 001101 | — | op.gg 기준 근접 3인만 (중간) |
| Stuck In Here With Me | 001001 | 101101 | 궁 사용 후 피해감소+도발 | 브·소 제외 (중간) |
| Dropkick | 001011 | 111111 | 체력 비례 처형+넉백 | AMNET 기준 말·소·다(픽 10~12.7%), op.gg 전원 — 제외 아닌 선호 (낮음) |
| Celestial Body / Heavy Hitter / Dawnbringer's Resolve / Titan's Resolve / Goliath / Divine Intervention | 001011 등 | 111111 | 탱킹 스탯류 | op.gg 전원 등재 → **제공은 전원, 픽은 탱커·전사·(소라카)** — 가중치/선호 영역 (낮음) |

### 3-9. 스킬 증강(Ability Augments) — 킷 조건 필터의 실측 (Q2 연계)

| 증강 | 희귀도(실측) | AMNET | op.gg | 킷 조건 해석 |
|---|---|---|---|---|
| Multishot (퀘스트) | 프리즘 | 010100 | 010100 | 투사체 스킬 지정형 — 브랜드·제드만. **징크스는 W/R이 투사체인데도 양 소스 부재**(26.12 핫픽스의 450개 "dead draw" 제거에 포함됐을 가능성, 미확인) |
| Spell Split | 프리즘 | 010100 | 010100 | 투사체 분열 — 동일 패턴 (높음) |
| Tripleshot | 프리즘 | 011000 | 011000 | **대상 지정+투사체** — 브랜드(R)·말파이트(Q)만. 나머지 4명은 대상지정 투사체 스킬 없음 ✓ (높음) |
| Echo Cast | 프리즘 | 001011 | 001111 | 스킬 복제 시전 — 말·소·다(+op.gg 제드). **징크스·브랜드 제외** (중간) |
| Bread And Butter (Q 가속) | 골드 | 011111 | 011111 | **징크스만 제외** — §4-2 (높음) |
| Bread And Jam / Bread and Cheese (W/E 가속) | 골드 | 111111 | 111111 | 전원 공통 ✓ |
| Spin To Win | **실버** | 000101 | 000101 | 회전 스킬 — 제드 E·다리우스 Q (높음) |
| Siphon | 실버(위키) | 000000 | 111101 | 26.17 통계엔 6명 전원 부재(비활성/개편 추정) — op.gg 잔재 기준 소라카만 제외였음 (미확인) |
| Pursuit of Haste / Pursuit of Power (퀘스트) | 골드 | 011111 | 111111 | AMNET 기준 징크스만 부재하나 op.gg엔 있음 — 희귀 제시 또는 저선호 (낮음) |

→ 스킬 증강의 희귀도는 실버(Spin To Win)~골드(Bread류, 퀘스트류, BONK!)~프리즘(Multishot/Spell Split/Tripleshot/Echo Cast)에 걸쳐 있고, 등장 자체가 챔피언 킷으로 강하게 필터링됨을 실측으로 재확인.

---

## 4. 결과 (3): 특기할 개별 발견

### 4-1. Draw Your Sword — 위키 명문 조건("원거리 전용")보다 실제 필터가 좁다
- 효과(실측 툴팁): "You are now melee. Gain 24% AD, 24% HP, 20% AS, 20% Lifesteal, 20% MS…" — 원거리를 포기하고 근접이 되는 프리즘 증강.
- 위키: "원거리 챔피언 전용". 그런데 원거리인 **브랜드·소라카의 통계에 양 소스 모두 0건** (징크스만 100000/100000).
- 해석: 명문 조건(원거리) 위에 **클래스 필터(마법사·서포터에겐 Invalid)** 가 한 겹 더 있는 것으로 추정 — 개발자의 "specific champion class pools" 발언과 정합. 브랜드·소라카가 근접 전환 증강을 받아봐야 dead draw이기 때문. (관측 확실 / 메커니즘 해석은 추정)

### 4-2. Bread And Butter — 징크스만 제외되는 이유: 토글 Q
- Q에 스킬 가속 100을 주는 골드 증강이 6명 중 **징크스에게만 양 소스 부재**(011111/011111). W/E 버전(Bread And Jam/Cheese)은 징크스 포함 전원 등재.
- 징크스 Q(스위처루!)는 쿨다운이 사실상 없는 토글 스킬 → Q 가속은 완전한 dead draw → 필터링. **"스킬 단위 dead draw 제거"(26.12 핫픽스)가 범용 증강에도 적용됨을 보여주는 가장 깨끗한 사례.** (관측 확실 / 이유는 추정)

### 4-3. Windspeaker's Blessing & Circle of Death — 소라카+다리우스라는 기묘한 조합
- 힐/실드 연계 증강 2종이 양 소스 일치로 소라카·다리우스에게만 등재(000011/000011).
- 다리우스는 아군 힐이 없지만 Q에 셀프힐이 있음 → 필터 조건이 "아군 힐"이 아니라 **"킷에 (셀프 포함) 회복 보유"** 로 추정. 말파이트 패시브(자기 실드)는 인정 안 되는 듯(부재). Circle of Death는 "your healing and Health Regen deal damage"라 셀프힐 다리우스와 시너지가 실제로 있음. (관측 확실 / 조건 해석은 추정, 미확인)

### 4-4. Cruelty — 속박 스킬이 있는 징크스가 제외되는 반례
- 속박/접지 시 혜성을 떨어뜨리는 프리즘 증강. 징크스는 E가 속박(불꽃 아가리)인데도 **양 소스 모두 부재**. 같은 속박 계열(Slap Around, Soul Eater, Impassable, Courage of the Colossus)은 op.gg에서 징크스 등재.
- 해석 후보: (a) 원딜 클래스 풀에서 Cruelty만 Invalid 처리(클래스 기반 필터), (b) Cruelty의 적격 스킬 태그가 징크스 E와 안 맞음. 확정 불가 — **필터가 순수 킷 기반이 아니라 클래스 기반일 수 있다는 단서**. (미확인)

### 4-5. 풀 크기 비대칭 — "탱커가 가장 넓고, 크리 원딜이 가장 좁다"
| 챔피언 | op.gg 등재 | AMNET 등재 | 양 소스 공통 부재(222종 대비) |
|---|---|---|---|
| 말파이트 | **193** | **136** | **29** |
| 다리우스 | 185 | 135 | 37 |
| 브랜드 | 179 | 116 | 43 |
| 제드 | 178 | 107 | 44 |
| 소라카 | 178 | 114 | 44 |
| 징크스 | 169 | 108 | **53** |

- (독립 재검증 2026-09-02 후속 재fetch: op.gg 등재 수는 징크스 170·브랜드 180·말파이트 194·제드 179·소라카 179·다리우스 185, 합집합 223으로 소폭 변동 — 주 원인은 op.gg에 새로 등재된 정체불명 증강 "???"(징·브·말·제 4명 목록에 존재). AMNET 등재 수(108/116/136/107/114/135), 양 소스 공통 부재 수(53/43/29/44/44), AMNET 합집합 197·전원 공통 59종·op.gg 전원 공통 130종은 모두 그대로 재현됨. 다리우스 공통 부재만 "???" 포함 시 38로 +1. **순위(말파이트 최대·징크스 최소)와 부재 분석 결론은 불변**, op.gg 목록이 당일 내에도 변동함을 확인.)
- 말파이트는 탱커 계열+AP 계열+속박 계열+이동기 계열을 모두 받아 풀이 가장 넓다. 징크스는 크리 전용 계열을 받는 대신 AP·힐·탱커·CC·이동기 계열이 모두 잘려 풀이 가장 좁다. 개발자 인터뷰의 "챔피언별 사용 가능 증강 수 1D 배열 관리·소외 클래스용 증강 제작" 발언과 정합.

### 4-6. 챔피언별 "양 소스 공통 부재" 목록 (다른 3명 이상에게는 존재하는 것만)

- **징크스(25종)**: ADAPt, Adamant†, Big Brain, Bounce of the Poro King, **Bread And Butter**, Cruelty, DropBear, Echo Cast, Eureka, First-Aid Kit, Flashbang, Grandma's Chili Oil, Icathia's Fall, Laser Heal, Marksmage, Master of Duality, Ominous Pact, Protein Shake, Quickstep, Stackosaurus Rex, Stay Resolute, Upgrade Immolate, Upgrade Zhonya's, Witchful Thinking, Wooglet's Witchcap
- **브랜드(18종)**: Adaptive Ward, Blunt Force, Critical Rhythm, Echo Cast, Icathia's Fall, Mighty Shield, Prom Queen, Quickstep, Stay Resolute, Stuck In Here With Me, Trusty Weapon, Ultra Hydra, Upgrade Collector, Upgrade Immolate, Upgrade Infinity Edge, Upgrade Ravenous Hydra, Upgrade Sundered Sky, Upgrade Sword of Blossoming Dawn
- **말파이트(10종)**: Adaptive Ward, Blunt Force, Critical Missile, Ravenous Bind, Skilled Sniper, Typhoon, Ultra Hydra, Upgrade Collector, Upgrade Infinity Edge, Upgrade Sword of Blossoming Dawn
- **제드(25종)**: ADAPt, Adamant†, Big Brain, Courage of the Colossus, Critical Missile, Cruelty, Droppybara†, Eureka, First-Aid Kit, Grandma's Chili Oil, Impassable, **Juiced, Mind to Matter, Overflow**(마나 3종), Master of Duality, Mighty Shield, Ominous Pact, Phenomenal Evil, Protein Shake, Ravenous Bind, Skilled Sniper, Slap Around, Soul Eater, Wooglet's Witchcap, Zealot
- **소라카(26종)**: Blunt Force, Bounce of the Poro King, Clown College†, Crit 'n Cast, Critical Rhythm, Dual Wield, Endless Decimation, Fan The Hammer, Fey Magic, Flashbang, Hellbent, Icathia's Fall, Prom Queen, Quickstep, Rite of Ascension, Siphon, Stackosaurus Rex, Stay Resolute, Stuck In Here With Me, Ultra Hydra, Upgrade Collector, Upgrade Immolate, Upgrade Infinity Edge, Upgrade Ravenous Hydra, Upgrade Sundered Sky, escAPADe
- **다리우스(17종)**: ADAPt, Adaptive Ward, Big Brain, Critical Missile, Critical Rhythm, Eureka, From Downtown, Grandma's Chili Oil, Laser Heal, Master of Duality, Ominous Pact, Phenomenal Evil, Skilled Sniper, Upgrade Zhonya's, Witchful Thinking, Wooglet's Witchcap, Zealot
- († = 현재 비활성 증강이라 다른 원인 가능)
- 요약: 징크스 부재분 = AP+힐+탱커+스킬증강 / 브랜드·소라카 부재분 = AD+크리+근접 / 말파이트 부재분 = AD+크리+저격뿐(최소) / 제드 부재분 = AP+마나+CC+힐 / 다리우스 부재분 = AP+크리+저격. **부재 목록 자체가 역할군 정의서처럼 읽힌다.**

---

## 5. Q1에 대한 종합 답변(실측 관점)

1. **"원딜에겐 원딜용, 법사에겐 법사용" 체감의 1차 원인은 Invalid 완전 제외가 맞다** — 크리/AD 계열이 법사·서포터·탱커의 수만 게임 통계에 0건, AP 계열이 AD 챔피언 통계에 0건으로 찍히는 것이 그 실체. 아레나의 명문화된 예외 리스트(AD 72명/AP 49명/마나 26명/CC 37명/이동기 73명 제외 등)와 이번 6명의 부재 패턴이 전부 합치하므로, **아수라장 필터는 아레나 예외 체계의 계승·확장이라는 선행 결론이 실측으로 뒷받침됨**.
2. **2차 원인은 가중치(Optimal/Viable/Average)와 선호의 결합** — op.gg 기준 전원에게 제공되는 크리 스탯류(Deft, Vulnerability 등)·탱킹 스탯류(Celestial Body 등)도 실제 픽은 해당 역할군에 집중된다. 통계로는 제시율과 선택률을 분리할 수 없어, 이 층위의 "잘 나온다" 체감(예: 레벨 9 트랙 보상의 스킬 증강 확률 증가)은 실측으로 정량화 불가.
3. 필터의 입도는 **혼합형**: 스탯 계열은 클래스(역할군) 단위로(크리→원딜 외 Invalid), 스킬 증강·일부 범용 증강은 스킬 단위로(토글 Q 제외, 회전/투사체/대상지정 조건) 걸린다. 순수 킷 기반이라면 설명 안 되는 사례(징크스 E 속박에도 Cruelty 부재)가 있어 클래스 기반 오버라이드가 존재하는 것으로 추정.

---

## 6. 한계·미확인

- 통계 사이트는 **픽만 기록** — "제시됐지만 0픽"과 "미제시"의 구분은 확률적 추론(표본 크기)에 의존. 픽률 1% 미만 증강의 부재 판정은 계열 일관성으로 보강했으나 개별 건은 오판 가능.
- op.gg의 챔피언별 증강 목록 생성 방식(실측 픽 기반인지, 자체 풀 메타데이터 기반인지)은 미공개 — 다만 챔피언마다 목록이 다르고(169~193종) Draw Your Sword가 징크스 페이지에만 있는 등 챔피언 특이적임은 확실. op.gg 수치(픽률·승률)는 클라이언트 로딩이라 이번엔 목록만 사용. **또한 op.gg 목록은 당일 내에도 변동함이 확인됨**(독립 재fetch에서 신규 증강 "???" 등재로 4~5명 목록이 +1 — §4-5 검증 노트): op.gg 정확 등재 수는 시점 의존적이므로 ±1~2 오차로 읽어야 한다.
- AMNET(arammayhem.net)과 mayhemmeta.com은 행 수·증강 ID가 일치해 동일 데이터 계열로 판정 — 실질 독립 소스는 2계열뿐. arammayhem.com(선행 스터디에서 쓴 팬사이트)과 arammayhem.net의 관계는 미확인(별개 도메인·별개 UI).
- 6명 표본이므로 역할군 내 일반화(예: 모든 기력/무자원 챔피언의 마나 제외, 모든 서포터의 Sonic Boom 화이트리스트)는 추가 챔피언 확인 필요.
- 비활성 증강(Adamant, Droppybara, Clown College, Siphon(추정), Icathia's Fall(추정) 등)의 부재는 챔피언 필터와 무관할 수 있어 † 표시로 분리.
- Windspeaker's/Circle of Death의 다리우스 포함, BONK!의 다리우스 한정, Cruelty의 징크스 제외, Phenomenal Evil의 징크스 포함 — 관측은 확실하나 **필터 조건의 정확한 정의는 미확인**.

---

## 7. 출처

**독립 검증 기록 (2026-09-02, 별도 세션에서 전 페이지 재fetch·재파싱)**
- 재검증 완료: AMNET 6개 표 행 수(108/116/136/107/114/135) 전부 일치, 패턴 표본 25종+(Draw Your Sword 100000/100000, 마나 3종 제드 단독 부재, 말파이트의 크리·저격·원거리 계열 부재, Dashing 001100, Sonic Boom 000010, Bread And Butter 011111, Phenomenal Evil 111010, Deft·Tap Dancer류 100000/111111 등) 전부 일치, 인용 픽률 20여 건(Critical Missile 28.65% 포함) 일치, 합집합·교집합(197/59/130/59) 재계산 일치, 위키 Draw Your Sword 원문("This augment is only available for ranged champions") 확인, MM 증강 ID 1356=Critical Missile로 AMNET과 동일 ID 체계 확인. 수정 사항: 최저 등재 픽률 0.18%→0.05%, Stackosaurex→Stackosaurus Rex 표기, op.gg 등재 수 당일 변동 주석. MM의 게임 수 추정치(§1-2 우측 열)와 MM 행 수 107~136은 이번 재검증 범위 밖(AMNET 열만 재확인).

**1차 데이터 (2026-09-02 직접 다운로드·파싱)**
- arammayhem.net 챔피언별 Hextech 증강 표 — https://www.arammayhem.net/champion-stats/222-jinx/augments/ , https://www.arammayhem.net/champion-stats/63-brand/augments/ , https://www.arammayhem.net/champion-stats/54-malphite/augments/ , https://www.arammayhem.net/champion-stats/238-zed/augments/ , https://www.arammayhem.net/champion-stats/16-soraka/augments/ , https://www.arammayhem.net/champion-stats/122-darius/augments/
- op.gg 아수라장 챔피언별 증강 페이지 — https://op.gg/lol/modes/aram-mayhem/jinx/augments (brand/malphite/zed/soraka/darius 동일 패턴)
- mayhemmeta.com 챔피언 페이지(flight JSON) — https://mayhemmeta.com/champions/jinx (외 5명 동일 패턴)
- arammayhem.com 챔피언 페이지(추천만 노출, 분석 제외 판단 근거) — https://arammayhem.com/champions/jinx/

**해석 프레임(선행 스터디 재인용)**
- Inven Global 개발자 인터뷰(Optimal/Viable/Average/Invalid, 1D 배열) — https://www.invenglobal.com/articles/25082/lol-aram-mayhem-reveals-the-secrets-of-augment-development
- IBTimes(챔피언별 드로우 풀 필터링, 450+ dead draw 제거) — https://www.ibtimes.com/league-legends-aram-mayhem-cuts-over-450-ability-augments-live-hotfix-3804331
- LoL 공식 위키 ARAM: Mayhem/Augments·MayhemAugmentData — https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Augments , https://wiki.leagueoflegends.com/en-us/Module:MayhemAugmentData/data
- 아레나 예외 리스트 비교 기준 — https://wiki.leagueoflegends.com/en-us/Arena

**한국어 커뮤니티(정황 보조)**
- 게임플 26.12 체험기(스킬 증강 챔피언 필터 UI) — https://www.gameple.co.kr/news/articleView.html?idxno=215744
- 나무위키 무작위 총력전: 아수라장 — https://namu.wiki/w/무작위%20총력전:%20아수라장
- 온두콩두 블로그(챔피언별 증강 팁 — 원딜용 증강 체감 서술) — https://drhot552.github.io/게임/칼바람-나락-아수라장-기간-연장-및-챔피언-별-증강-팁-정규모드로-꼭-필요한-모드/
