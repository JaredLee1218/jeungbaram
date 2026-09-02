# 증강 풀 스터디 — 마스터 보고서 (역할군 편향 & 능력 증강 티어)

- 작성일: 2026-09-02 (라이브 패치 26.17)
- 대상: 칼바람 아수라장 / ARAM: Mayhem (무작위 총력전: 아수라장, "증바람")
- 원본(전부 독립 재검증 거침 — 재검증에서 못 재현한 항목은 각 문서에 ⚠️ 미검증으로 표기): [03-champion-augment-pools.md](raw/03-champion-augment-pools.md) · [09-ability-augments.md](raw/09-ability-augments.md) · [10-eligibility-datamine.md](raw/10-eligibility-datamine.md) · [11-empirical-pools.md](raw/11-empirical-pools.md) · [12-class-weighting.md](raw/12-class-weighting.md) · [13-kr-pools-community.md](raw/13-kr-pools-community.md)
- 기계가독 산출물: [data/eligibility-notes.json](data/eligibility-notes.json)

---

## 1. 두 핵심 질문의 답

### Q1. "원딜에겐 원딜용, 법사에겐 법사용" — 역할군별 증강 편향의 실제 메커니즘

**현재 최선의 이해: 편향은 단일 규칙이 아니라 5개 층위의 중첩이다.** 공식 확인(강연·패치노트) + 데이터마이닝(kiwi.bin) + 통계 역추적(6챔피언 실측) + 커뮤니티 실측이 전부 같은 그림을 가리킨다.

| 층위 | 메커니즘 | 근거 등급 | 원본 |
|---|---|---|---|
| ① 클래스 풀 4단계 | 클래스(인챈터/마크스맨/메이지/탱커 + 패치노트의 fighters)별로 전체 증강 풀을 **Optimal(드묾)/Viable(자주)/Average(자주·무난)/Invalid(완전 제외)** 로 분류해 제시 빈도를 차등. 원출처는 게임스컴 데브 2026 공개 강연(Riot 시니어 디자이너 Noor Amin). 챔피언별 사용 가능 증강 수를 1D 배열로 관리, 소외 클래스용 증강 별도 제작 | 공식확인 | [12 §0·§3](raw/12-class-weighting.md), [03 §2-4](raw/03-champion-augment-pools.md) |
| ② Invalid = 완전 제외의 실체 | 챔피언별 증강 풀은 실제로 다르다. 6명 실측: 합집합 222종 중 전원 공통은 **59종(26.6%)뿐**. 부재가 계열 단위로 정확히 갈라짐 — AD/크리는 브랜드·말파이트·소라카에 0건(예: Blunt Force), 크리 코어 Critical Missile은 징크스 픽률 28.65%인데 말파이트·제드·다리우스에 0건, AP는 징크스·제드·다리우스에 0건, **마나 3종은 기력 챔피언 제드에게만 부재**, 이동기 5종은 대시 보유자만, 아군 힐/실드는 소라카만. 풀 크기도 비대칭(말파이트 최대 193 / 징크스 최소 169) | 실측추정(강) | [11 §2~§4](raw/11-empirical-pools.md) |
| ③ 개별 게이트(클래스/킷/아이템) | 서포트 전용 Mercy's Strike(26.15 공식 버그픽스로 게이트 실존 확인 — 위키 미문서화), 원거리 전용 Draw Your Sword(+루난 제외), 워모그→Vampirism 제외, Vampirism↔Perseverance 상호배제(V26.06), Earthwake 팀당 2명, Overextender 맵 한정, 스몰더→Combusting Interest 제외(26.14), 갱플랭크→Executioner 제외(26.01) | 공식확인 | [12 §5](raw/12-class-weighting.md), [03 §1](raw/03-champion-augment-pools.md) |
| ④ 스킬 단위 필터(스킬 증강) | 스킬 증강은 드로우 풀 진입 전에 "증강×스킬 조합" 단위로 챔피언별 필터링("filtered to each player's champion before entering the draw pool"). 버그픽스 문구가 스킬 슬롯 단위(Yasuo E, Akshan E, Draven Q, Illaoi E, Malphite W, Katarina E, Shaco E…). 26.12 핫픽스가 무의미 조합 450+개 제거("dead draws"), 26.13부터 "챔피언이 실질적으로 이점을 얻는 스킬"로 큐레이션 명문화. 범용 증강에도 스킬 단위 필터 적용 사례: 토글 Q인 징크스만 Bread And Butter(Q가속) 제외 | 공식확인 + 실측추정 | [09 §5~§6](raw/09-ability-augments.md), [11 §4-2](raw/11-empirical-pools.md) |
| ⑤ 중앙 RNG 튜닝 | "Augment RNG system"이 존재하며 패치마다 조정(26.14 공식: 같은 종류 반복 제시 완화). 진행 트랙 레벨 9 = 스킬 증강 등장 확률 증가(계정 단위, 수치 비공개) | 공식확인 | [12 §0-5](raw/12-class-weighting.md), [09 §2](raw/09-ability-augments.md) |

**데이터마이닝이 보여준 구현 구조**: 클라이언트(kiwi.bin.json, AugmentData 222종)에는 챔피언 목록·조건식·가중치 필드가 **전혀 없고**, 대신 3종의 카테고리 태그만 있다 — `mAugmentTags`(요구 메커니즘: 마나=8, 대시=32, 궁극기=1024, 아군 대상=4096 등 — 아레나 공식 예외 카테고리와 사실상 1:1), `mBuildTags`(역할 축: 서포터=8, 메이지=32, 원딜=64, 탱커=256, 치명타=512 등), `augmentgroups.bin`(기능 그룹 66종). 아레나의 쉬바나 전용 증강조차 클라이언트에 챔피언 필드가 없으므로, **챔피언×증강 매칭과 4단계 가중치 판정은 100% 서버 전용**이다. 즉 편향의 공식은 "증강 태그 × 챔피언 클래스 × 서버측 가중치"로 요약되며, 태그까지는 관측 가능하고 결합 로직은 비공개다. → [10 §1·§6](raw/10-eligibility-datamine.md)

**주의할 뉘앙스 3가지**:
- 필터 입도는 **혼합형**이다: 스탯 계열은 클래스 단위(크리→원딜 외 Invalid), 스킬 증강은 스킬 단위, 일부는 킷 속성 단위(회전/투사체/넉백). 순수 킷 기반으로 설명 안 되는 반례(속박 E 보유 징크스가 Cruelty 부재, 원거리 브랜드·소라카가 Draw Your Sword 부재)가 있어 **클래스 기반 오버라이드가 명문 조건 위에 한 겹 더 있는 것으로 추정**된다. → [11 §4](raw/11-empirical-pools.md)
- Invalid(제외)와 가중치(Optimal/Viable/Average)는 통계로 구분 가능한 층위가 다르다: 완전 부재만 깨끗하게 검출되고, 가중치는 픽률에 제시율×선택률로 섞여서만 보인다. 크리 스탯류(Deft 등)는 op.gg상 전원 제공이지만 실픽은 원딜 집중 — **제외가 아닌 가중치 영역**. → [11 §1-3·§5](raw/11-empirical-pools.md)
- 유저의 "역할에 안 맞는 증강 떴는데?" 반례 경험의 상당수는 26.13~26.15에 순차 수정된 **게이트 누수 버그**(블라디미르에게 Mercy's Strike 등)로 설명 가능하다. → [12 §6-5](raw/12-class-weighting.md)

### Q2. 능력(스킬) 증강의 티어 체계

**답: 별도 티어가 아니다. 실버/골드/프리즘 전 등급을 가로지르는 '카테고리'다.** (한국 공식 명칭 "스킬 증강")

1. **등급 분포** — 게임 데이터(kiwi.bin의 스킬 증강 플래그 `{e3a02eac}`=true) 기준 30종 = **실버 7 / 골드 17 / 프리즘 6**(슬롯 고정형 빵 3종·비활성 4종 포함). 위키 모듈 기준으로는 27종(스킬 강화형 24 + 스킬 지정 퀘스트형 3, 활성 실버 8/골드 9/프리즘 6). 아이콘도 등급별 범용 아이콘(`genericabilityaugmenticon_{silver|gold|prismatic}`)을 다수 공유. → [09 §0·§3](raw/09-ability-augments.md), [10 §1.6](raw/10-eligibility-datamine.md)
2. **제시 방식은 일반 증강과 동일** — 레벨 3/7/11/15 화면에서 같은 티어 규칙(화면당 전원 동일 등급)으로 섞여 나온다. 전용 화면·분류 열·별도 위키 페이지 없음. → [09 §2](raw/09-ability-augments.md)
3. **강화 대상 스킬은 시스템이 사전 지정** — 플레이어가 고르는 게 아니라 "증강×스킬 조합"이 미리 만들어져 카드에 챔피언 초상화+스킬 아이콘으로 표시된다(게임플 사전 체험기 관찰: 굶주린 속박이 빅토르 W/레넥톤 W에 각각 바인딩). 궁극기도 대상 가능(Chain Reaction 250%, Terrain'd 300% 보정). → [09 §5](raw/09-ability-augments.md), [13 §1-2](raw/13-kr-pools-community.md)
4. **퀘스트 증강도 같은 구조** — 실버~프리즘에 걸친 카테고리이고 26.12에 다단계형 도입(Multishot 6단계, Pursuit of Haste 2단계, Poro Stampede 9단계). 능력·퀘스트 겸용 공식 확인. → [09 §4](raw/09-ability-augments.md)
5. **등장 확률의 별도 보정** — 진행 트랙 레벨 9 보상이 스킬 증강 등장 확률을 올리고(수치 비공개), 26.13 이전엔 3·4번째 화면 등장률이 크게 낮은 버그가 있었다(공식 수정). 즉 "등급은 일반 증강과 동일 + 등장 확률만 별도 보정 가능한 부류". → [09 §2·§6](raw/09-ability-augments.md)
6. **체감 티어(성능)는 최하위권** — 한국 실측 승률 44~49%·픽률 2% 미만, 나무위키 "선택 자체가 의미없는 증강 다수" 평가와 일치. 단순·즉발형(Pursuit of Power, BONK!)만 성적 양호. → [13 §2-3](raw/13-kr-pools-community.md), [09 §8](raw/09-ability-augments.md)
7. **미확정** — Terror/BONK!/Pursuit of Power 3종은 26.12 공식노트(프리즘/골드/실버) vs 위키 모듈(실버/실버/골드) vs 게임 데이터(골드/골드/골드)가 3원 상충. 본 프로젝트 데이터(augments.json)는 게임 파일 티어를 채택. → [09 §7-1](raw/09-ability-augments.md)

---

## 2. 증거 등급표

등급 정의 — **공식확인**: 라이엇 공식 문서·강연 보도(교차 확인) / **데이터확인**: 게임 파일 직접 파싱 / **실측추정**: 통계 역추적(제시율이 아닌 픽 기록 기반 추론) / **커뮤니티설**: 교차 검증 안 된 커뮤니티 서술.

| # | 결론 | 등급 | 원본 |
|---|---|---|---|
| 1 | 증강 드로우 풀은 챔피언별로 사전 필터링된다("filtered to each player's champion before entering the draw pool") | 공식확인 | [03 §2](raw/03-champion-augment-pools.md) |
| 2 | 클래스별 풀을 Optimal/Viable/Average/Invalid 4단계로 나눠 제시 빈도 차등(게임스컴 데브 2026, Noor Amin) | 공식확인 | [12 §3](raw/12-class-weighting.md) |
| 3 | 4단계의 분류 단위는 챔피언이 아니라 **클래스**(인챈터/마크스맨/메이지/탱커) | 공식확인 | [12 §0-2](raw/12-class-weighting.md) |
| 4 | 스킬 증강은 별도 티어가 아니라 실버/골드/프리즘을 가로지르는 카테고리 | 공식확인 + 데이터확인 | [09 §0](raw/09-ability-augments.md), [10 §1.6](raw/10-eligibility-datamine.md) |
| 5 | 스킬 증강은 "챔피언이 쓸 수 있는 것만" 제시("You'll only ever receive Ability Augments that are usable for your champion") | 공식확인 | [09 §1](raw/09-ability-augments.md), [12 §5](raw/12-class-weighting.md) |
| 6 | 스킬 증강 게이트는 스킬 슬롯 단위로 관리(버그픽스 문구: Yasuo E, Akshan E, Malphite W…) | 공식확인 | [09 §5](raw/09-ability-augments.md), [12 §5](raw/12-class-weighting.md) |
| 7 | 서포트 전용 클래스 게이트가 코드에 실존(Mercy's Strike, 26.15 버그픽스) — 위키 미문서화 게이트가 더 있다 | 공식확인 | [12 §0-4](raw/12-class-weighting.md) |
| 8 | 제시 확률은 "Augment RNG system"으로 중앙 제어·상시 튜닝(26.14) | 공식확인 | [12 §0-5](raw/12-class-weighting.md) |
| 9 | 진행 트랙 L9 = 스킬 증강 등장 확률 증가(계정 단위 가중치) | 공식확인 | [09 §2](raw/09-ability-augments.md) |
| 10 | 클라이언트 데이터에 챔피언×증강 매핑·가중치·조건식 필드 없음 → 판정은 100% 서버측 | 데이터확인 | [10 §1.2·§4](raw/10-eligibility-datamine.md) |
| 11 | 증강별 카테고리 태그(mAugmentTags/mBuildTags/augmentgroups)는 클라이언트에 존재하며 아레나 예외 카테고리와 1:1 대응 | 데이터확인 (서버 사용 여부는 미확증) | [10 §1.3~§1.4·§5.2](raw/10-eligibility-datamine.md) |
| 12 | 게임 데이터 기준 스킬 증강 30종 = 실버 7/골드 17/프리즘 6 | 데이터확인 | [10 §1.6](raw/10-eligibility-datamine.md) |
| 13 | Invalid 완전 제외의 실측: 챔피언 6명 중 전원 공통 증강은 222종 중 59종뿐, 부재가 계열 단위(AD/AP/마나/대시/아군힐/CC/저격)로 갈라짐 | 실측추정(강 — 양 독립 소스 일치, 표본 3만~10.8만 게임) | [11 §2~§3](raw/11-empirical-pools.md) |
| 14 | 마나 증강 3종은 기력 챔피언(제드)에게 제외 — 아수라장에서도 마나 필터 작동 | 실측추정(강) | [11 §3-3](raw/11-empirical-pools.md) |
| 15 | 실제 필터는 명문 조건보다 좁은 클래스 기반 오버라이드 포함(Draw Your Sword가 원거리 브랜드·소라카에도 부재, Cruelty가 속박 보유 징크스에 부재) | 실측추정 | [11 §4-1·§4-4](raw/11-empirical-pools.md) |
| 16 | 스킬 단위 dead draw 필터가 범용 증강에도 적용(토글 Q 징크스만 Bread And Butter 제외) | 실측추정(강) | [11 §4-2](raw/11-empirical-pools.md) |
| 17 | 아레나 제외 명단의 직접 재사용 증거는 없음 — 개념만 계승해 클래스 풀 + 스킬 태그로 재구현 | 실측추정 | [12 §7](raw/12-class-weighting.md) |
| 18 | 크리 스탯류는 전원 제공 + 원딜만 픽 — 제외가 아닌 가중치·선호 층위 | 실측추정(약 — 제시율/선택률 분리 불가) | [11 §3-1](raw/11-empirical-pools.md) |
| 19 | 나무위키의 킷 기반 제외 표(AD↔AP↔마나↔이동기…) — 아레나 기준 표일 가능성 높고 아수라장 적용 여부 불명확 | 커뮤니티설 (단 실측 패턴과는 정합) | [13 §1-1](raw/13-kr-pools-community.md) |
| 20 | Terror/BONK!/Pursuit of Power의 라이브 티어(3소스 상충) | 미확정 | [09 §7-1](raw/09-ability-augments.md) |
| 21 | 스킬 증강의 성능은 최하위권(한국 실측 승률 44~49%, "복붙 도입" 비판 — 단 Pursuit of Power·BONK!는 arammayhem 집계 51~52%로 예외) | 실측추정 + 커뮤니티설 | [13 §2-3](raw/13-kr-pools-community.md), [09 §8](raw/09-ability-augments.md) |
| 22 | Optimal/Viable/Average의 실제 확률 수치, 챔피언→클래스 매핑 전모 | 미공개 (어느 등급도 아님) | [12 §8](raw/12-class-weighting.md) |

---

## 3. 시뮬레이터 반영 방안 — draft.js 근사 필터 개선

현재 [docs/js/draft.js](../docs/js/draft.js)의 `eligibleAugments()`는 `enabled` + `restrictions{rangedOnly, meleeOnly, requiresMana, abilityProps(OR), abilityPropsAll(AND)}`를 챔피언 속성과 대조하는 이진 필터다. 개선 원료는 [data/eligibility-notes.json](data/eligibility-notes.json)에 정리했다.

### 3-1. 정확히 반영 가능한 것 (이진 필터 — 근거 official/datamined)

| 항목 | 구현 |
|---|---|
| 마나 게이트 | `ARAM_Overflow / ARAM_Juiced / ARAM_MindtoMatter`에 `requiresMana: true` — 실측(제드)·데이터(mAugmentTags=8)·아레나 공식이 삼중 일치. OceanSoul은 실측상 전원 등재라 보류 |
| 원거리 전용 | `ARAM_DrawYourSword`에 `rangedOnly: true`(공식) + 클래스 좁힘(아래 가중치 항목) |
| 서포트 전용 | `MercysStrike` — 챔피언 `tags`에 Support 없는 경우 제외(26.15 공식 게이트). 아군 힐/실드 계열 6종(Sonic Boom 등)도 동일 처리(실측 근거) |
| 스킬 증강 킷 조건 | eligibility-notes의 `requiredProps`를 `restrictions.abilityPropsAll`로 이식: Chain Reaction=knockback, Spell Split·Multishot=projectile, Tripleshot=targeted+projectile, Ravenous Bind=immobilize, Terrain'd=terrain, Bolstered=shield 등. **champions.json abilityProps에 immobilize/terrain/empoweredAttack/durationEffect 속성 추가 필요** |
| 대시 게이트 | Dashing/Earthwake/Outlaw's Grit/Shadow Runner/Swift and Safe에 `abilityProps: ['dash']`(OR) — 실측 5종 완전 일치 패턴 |
| 속박 게이트 | Cruelty/Slap Around/Soul Eater/Impassable/Courage of the Colossus에 immobilize 요구 |
| Spin To Win | 위키의 적격 챔피언 명시 목록을 화이트리스트로 그대로 이식(가장 정확한 케이스) |
| 챔피언 단위 예외 | 스몰더×Combusting Interest, 징크스×Bread And Butter 등 eligibility-notes `championSpecific`을 소규모 예외 테이블로 |
| 상호배제·아이템·팀 제한 | Vampirism↔Perseverance(현재 비활성이라 무의미), 루난→DYS 제외, Earthwake 팀당 2명(1인 시뮬이면 생략 가능) |

### 3-2. 가중치로 근사할 것 (확률 조정 — 수치는 비공개이므로 추정 파라미터)

- **클래스×태그 가중치**: 증강 `tags`(이미 augments.json에 있음: ad/ap/tank/cc 등)와 챔피언 `tags`(Marksman/Mage/Tank/Support/Fighter/Assassin)를 매칭해 Optimal/Viable/Average를 3단 가중치(예: 2.0/1.0/0.6)로 근사. Invalid에 해당하는 명백한 미스매치(크리→법사 등)는 §3-1의 이진 제외로. 크리 스탯류(Deft 등)는 제외하지 말고 원딜 가중치만 높일 것(실측 근거: op.gg 전원 등재).
- **진행 트랙 L9**: 스킬 증강 카테고리에 등장 확률 보정 계수(토글 옵션, 기본 off).
- **등급 확률**: 현행 `DEFAULT_TIER_WEIGHTS`(0.45/0.35/0.20 추정치) 유지 — 공식 수치 없음. V25.23 "초반 실버 빈도 하향" 이력만 반영 여지.

### 3-3. 불가능한 것 (근사 한계 명시)

- **챔피언×증강 정확한 풀·가중치 수치**: 100% 서버 전용([10 §1.2](raw/10-eligibility-datamine.md)). 어떤 데이터마이닝으로도 재현 불가 — 시뮬레이터는 영원히 근사.
- **스킬 지정 규칙**: 적격 스킬이 여럿일 때 어느 스킬에 바인딩되는지(무작위/가중치) 미공개. 시뮬레이터는 "적격 스킬 중 무작위" 근사 + 근사임을 명시.
- **스킬 단위 결합 판정**: champions.json의 abilityProps는 챔피언 전 스킬의 합집합이라, "같은 스킬 하나가 targeted+projectile" 같은 AND 판정은 원리적으로 과잉 포함이 생긴다(현행 draft.js 주석의 한계 그대로). 정밀화하려면 스킬(Q/W/E/R)별 속성 배열로 champions.json을 확장해야 함.
- **제거된 450+ 조합 목록, 26.14 RNG 조정의 구체 내용**: 비공개.
- **제시율 검증**: 매치 API에 제시 선택지가 기록되지 않아, 어떤 개선을 해도 실게임 제시율과의 정량 대조는 불가([13 §4](raw/13-kr-pools-community.md)).

### 3-4. 권장 작업 순서

1. champions.json에 신규 abilityProps 4종(immobilize/terrain/empoweredAttack/durationEffect) 추가 + 스킬별 속성 분리 검토
2. eligibility-notes.json의 `abilityAugments[].requiredProps` → augments.json `restrictions`로 이식(스크립트화)
3. classBias의 이진 제외(마나/대시/속박/아군힐/AD·AP 코어)를 restrictions로 이식 — confidence가 empirical 이상인 것만
4. 클래스×태그 가중치 레이어를 `drawAugment()`에 추가(후보 균등 추출 → 가중 추출)
5. championSpecific 예외 테이블 추가
6. 모든 근사에 현행 스타일대로 `⚠ 근사` 주석 + 근거 파일 링크

---

## 4. 미해결 질문

**시스템 핵심 (답이 나오면 시뮬레이터 정확도가 바뀌는 것)**
1. Optimal/Viable/Average의 실제 등장 가중치 수치와 챔피언→클래스 매핑 전모 — 서버 전용, 게임스컴 강연 녹화본/슬라이드 입수가 유일한 추가 단서 후보. → [12 §8](raw/12-class-weighting.md)
2. 적격 스킬이 여럿일 때 어느 스킬이 지정되는가(무작위 vs 스킬별 가중치). → [09 §9](raw/09-ability-augments.md)
3. mAugmentTags/mBuildTags/augmentgroups가 실제 드로우 계산에 쓰이는지, UI·통계용인지. → [10 §8](raw/10-eligibility-datamine.md)
4. 티어별·화면별 등장 확률 수치와 L9 트랙 보상의 증가 폭. → [09 §9](raw/09-ability-augments.md)

**개별 사실 확인 (인게임/추가 표본으로 해소 가능)**
5. Terror/BONK!/Pursuit of Power의 실제 라이브 티어(3소스 상충). → [09 §7-1](raw/09-ability-augments.md)
6. 마나 필터의 무자원(가렌·문도 등) 일반화, Windspeaker's/Circle of Death의 셀프힐 인정 조건, BONK!의 정확한 조건, Cruelty×징크스 제외 사유. → [11 §6](raw/11-empirical-pools.md)
7. 나무위키 킷 기반 제외 표의 아수라장 적용 여부(아레나 V13.17 표의 이식인지). → [13 §6](raw/13-kr-pools-community.md)
8. op.gg 신규 "???" 증강의 정체, op.gg 목록 생성 방식(픽 기반 vs 자체 메타데이터). → [11 §6](raw/11-empirical-pools.md)
9. Quickstep의 현재 적격 조건, Tooth Fairy 퀘스트 구조, One Trick Pony 제거·Bolstered 추가 경위, 비활성 4종의 재활성화 계획. → [09 §9](raw/09-ability-augments.md)
10. 제거된 450+ 조합의 전체 목록, 미해독 해시 필드({e3a02eac} 등)의 원래 이름. → [10 §8](raw/10-eligibility-datamine.md)

**접근 차단으로 미확인**
11. Reddit의 라이엇 코멘트 존재 여부, ed_corte X 게시물 전문, 아카라이브·펨코 글 본문, Vampirism 26.17 제거의 공식 기록. → [12 §8](raw/12-class-weighting.md), [13 §6](raw/13-kr-pools-community.md)
