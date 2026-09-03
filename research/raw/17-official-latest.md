# 17. 공식 소스 최신 동향 (26.15~26.18) — 광맥 4

- 조사일: 2026-09-03 / 라이브 패치 **26.17**(2026-08-25 배포). **26.18은 2026-09-10(목) 배포 예정 — 아직 미발행**
- 방법: 공식 패치 노트(en/ko)·지원 문서·dev 글은 WebFetch(요약 모델 경유 — 자구 오차 가능성 있음, 각 항목에 표기), CommunityDragon 라이브/PBE 파일은 **직접 다운로드·Node 파싱(diff 실측 ✅)**
- 선행 자료와의 관계: raw/09(스킬 증강 30종)·raw/10(kiwi.bin 해부)의 내용은 반복하지 않고, 26.15 이후의 "변화"와 새로 확보한 사실만 다룬다.

---

## 0. TL;DR — augments.json(26.17 스냅샷) 갱신 필요 판정

**판정: 현시점(2026-09-03) 갱신 불필요. 단 9/10의 26.18 노트 공개 직후 재확인 필요(신규 증강 1종 'Clown College'가 PBE에서 실측됨).**

| 검증 항목 | 결과 |
|---|---|
| 26.16 신규 2종(갈라진 하늘 업그레이드, 굶주린 히드라 업그레이드) | 로컬 augments.json에 존재 ✅ (Upgrade_SunderedSky L2581, Upgrade Ravenous Hydra L2536) |
| 26.17 신규 2종(궁극의 히드라, 죽음의 무도 업그레이드) | 존재 ✅ (Quest_UltraHydra L4041 tier=prismatic, Upgrade_DeathDance L1026) |
| 26.17 티어 변경(한 발에 두 놈/Double Tap 골드→프리즘) | 반영됨 ✅ (ARAM_DoubleTap L2950 "tier": "prismatic") |
| 26.17 수치 변경(치명적 미사일 1/2/3/4→1/2/3발) | 반영됨 ✅ (L1375 설명이 기본 1발+치확 50%당 +1발 = 최대 3발) |
| 26.17 이후 라이브 핫픽스(아수라장 대상) | **발견 없음**(뉴스·팬사이트 검색 기준, 2026-09-03) — 미확인이 아니라 "보도된 것 없음" |
| PBE(26.18 사이클) kiwi.bin 필드 변경 | **기존 222종 전부 변경 0** — rarity/Enabled/태그류 diff 실측 ✅ (§5) |
| PBE 신규 증강 | **ARAM_ClownCollege(광대 대학, 프리즘) 1종 추가** — 출시 패치(26.18 vs 26.19) 미확정 (§5) |
| 스킬 증강 "시스템" 변경(지정 규칙·제시 방식) | 26.15~26.17 구간 **시스템 수준 변경 없음** — 버그픽스·밸런스·신규 증강뿐 (§1) |

---

## 1. 공식 패치 노트 26.15~26.17 아수라장 섹션 (영/한 대조)

전부 WebFetch 요약 경유(자구 오차 가능). 영어판/한국어판 URL은 §8.

### 26.15 (2026-07-28)

- **개발자 코멘트(시스템 변경)**: 챔피언 피해량 보정치(damage modifier)가 종전에는 스킬·기본 공격에만 적용 → 이제 **아이템·증강 피해에도 적용**. 한국어판 원문: *"챔피언 피해량 보정치는 챔피언의 스킬과 기본 공격 피해량에만 적용되었습니다. 즉, 아이템 및 증강 피해량은 조정 수치의 영향을 받지 않아, 챔피언이 과도한 성능을 발휘하는 극단적인 일부 사례가 발생하곤 했습니다."* — 아수라장 밸런스의 기반 시스템 변경(증강 선택지 자체에는 영향 없음).
- 증강 조정: 치명적 미사일 미사일당 피해 20/40/60/80/100 → 15/32.5/50/67.5/85, **연쇄 반응에 "궁극기면 피해 250%" 보정 신설**(raw/09 §3-1 표의 해당 서술이 이 패치에서 추가된 것), 자비의 일격에 포탑 상호작용(최대 체력 2.5%) 추가, 적응형 와드 저항 증가, 말랑 찰싹 손 쿨 35초로 감소, 곰 투하 기절 1.5초 → 0.5초.
- 스킬 증강 관련 버그픽스(챔피언×스킬 단위 — 매핑 증거): **로크 Q·E × 노련한 저격수 쿨 반환 오류**, 아크샨 E 부적격 제시(raw/09 §5-4와 일치), 판도라의 상자 후 돌진 증강 스킬 가속 중복, "여러 챔피언에 부적절한 증강이 제시되던 버그" 수정.
- 모드 일정/로드맵 언급: 없음.

### 26.16 (2026-08-11)

- **신규 골드 증강 2종**: **갈라진 하늘 업그레이드**(Upgrade Sundered Sky — 대상별 아이템 쿨 5초, 잃은 체력 비례 회복 9%), **굶주린 히드라 업그레이드**(Upgrade Ravenous Hydra — 스킬 사용 시 쪼개기 발동, 생흡 18%). 개발자 코멘트: *"전사를 개선하는 데 중점"* — 한타에서 전사 지속력 강화 목적.
- 티어 변경: **연쇄 반응 프리즘 → 골드**(raw/09 §6-4와 일치).
- 기타: Now You See Me 2단계가 이전 위치에 분신 소환, Nature is Healing 부시별 독립 쿨로 재구성.
- 버그픽스 11건(한국어판 나열): 퀘스트 완료 후 위력 추구, **베이가 W × 대마법사**, **아지르 W 쿨(대마법사)**, 강화 기본 공격의 마법 명사수, 애니 티버 부활 지속효과, 열의 쿨, 사미라·리산드라 기본 지속효과, 돌진 증강 미적용, **벨코즈 × 노련한 저격수**, Glass Cannon 폼체인지 챔피언 피해 비율 등.
- 모드 일정/로드맵 언급: 없음.

### 26.17 (2026-08-25) — 현 라이브

- **신규 증강 2종**: **궁극의 히드라**(Ultra Hydra, 프리즘 퀘스트 — 히드라 아이템 제한 무시, 3종 히드라 수집 → 울트라 히드라 합성), **죽음의 무도 업그레이드**(Upgrade Death's Dance, 골드 — 250골드 + 받은 피해 40%/15% 3초 분산 + 처치 관여 시 추가 AD 125% 즉시 회복).
- 개발자 코멘트: *"continuing to focus on the fighter experience"* + 원딜 옵션 하향 — *"We're tuning them down to give opponents more room to react and make team fights easier to read."*
- 밸런스: **치명적 미사일 발수 1/2/3/4 → 1/2/3**(치확 기준), **한 발에 두 놈(Double Tap) 골드 → 프리즘**, 3연발 타겟팅 개선(주 대상 인근 우선 — raw/09 §6-4 기재분), 무한의 대검 업그레이드에서 치명타 확률 제거, 굶주린 히드라 업그레이드 생흡 18% → 20% + 미니언에도 쪼개기, Serve Beyond Death 지속 3/6초 → 4/8초.
- 버그픽스 4건: 사이온, 모데카이저, 메아리 시전(재접속 분신 방향 — raw/09 기재분), 대마법사.
- 모드 일정/로드맵 언급: 없음.

### 26.18 (2026-09-10 예정) — 미발행

- 공식 노트 URL은 현재 404(직접 확인). 배포일 9/10(목)은 lolnow.gg 패치 일정 페이지 기준.
- **패치 프리뷰(Phroxzon, X 요약 기사들)**: "안정화(stabilization) 패치" — 챔피언 13종 버프/너프(카시오페아 조정, 세라핀·신드라·바드·제리 너프, 아우렐리온 솔·비에고·마스터 이 등 버프), 구인수 재조정. **아수라장/증강 언급 없음**. Worlds 2026은 **패치 26.20**에서 진행.

---

## 2. 신규 모드 변형: "무작위 총력전: 아수라장 클래식 스타일" (ARAM: Mayhem Classic-ish)

**26.15 기간 중 출시된 한정 변형 모드. 이미 종료됨(8/24). 표준 아수라장·우리 augments.json에는 영향 없음.**

- 발표: 2026-07-14 개발 업데이트(Pabro & Meddler). 원문: *"ARAM: Mayhem Classic-ish will launch alongside League Classic as a limited-time mode with its own queue."* / *"Only the 60 champions available in Classic will be playable, though they'll use their modern versions."* — 클래식풍 맵 + 클래식 아이템 + **"Classic-themed Augments"**.
- 운영 기간(지원 문서): **2026-07-29 08:00 PT ~ 2026-08-24 23:59 PT** (종료 확인). 각 팀이 별도 챔피언 풀 → 미러전 가능.
- 증강 풀(지원 문서 원문): *"While many ARAM: Mayhem Augments remain unchanged, we've adapted several to fit the Classic experience."* + **Classic-ish 전용 신규 증강 존재**. 증강 선택 시점: *"while your champion is dead or newly respawned"*.
- Meddler 발언(모던 킷 유지 이유, insider-gaming 전재): *"Augments are all built (and tested) to work with modern kits, hence the need to use those in this case. We wanted to offer a version of Mayhem that was more accessible to Classic players, but didn't want to pull a lot of development time away from Classic itself."*
- 한국 공식 명칭: **"무작위 총력전: 아수라장 클래식 스타일"** (공식 유튜브 쇼츠 제목·op.gg 모드 페이지 URL로 확인).
- **데이터마인 연결(raw/10 보강)**: raw/10 §1.5에서 발견한 AugmentDisplayTags 라벨 `Classic-ish(클래식 스타일)`가 바로 이 모드용 카테고리였음이 확인됨. 단 `kiwi_jade.bin.json`(188종)이 Classic-ish의 데이터인지는 **미확인**(파일명 코드네임 jade와 모드의 관계 미공개).

---

## 3. 라이엇 지원 페이지 (support.riotgames.com)

두 문서 모두 JS 렌더링이라 직접 fetch 불가 → **r.jina.ai 프록시 경유**로 본문 확보(프록시 렌더링 경유 인용 — 자구 오차 가능성 표기).

### 3-1. "League of Legends - ARAM: Mayhem Game Mode" (마지막 갱신일 표기 없음)

- 모드 지위: **"ARAM: Mayhem will stick around until further notice."** — 종료일 없이 상시 운영(공식 문서 기준). 원래 한정 모드였다가 연장된 이력(26.03 연장 발표, Inven Global 보도)과 일관.
- 증강 선택: *"Choose your first augment at the start of the game"* + *"Receive additional augments at champion level 3, 7, 11, and 15."* ⚠️ 문면상 "시작+4회"로 읽히나, 위키·기존 스터디(raw/01·09)는 "레벨 3(시작)/7/11/15의 4회"로 기술 — ARAM 시작 레벨이 3이므로 같은 것을 다르게 쓴 표현일 가능성이 높지만 **표기 상충으로 기록(미확정)**. 시뮬레이터는 기존 4회 모델 유지.
- **선택 시점 제한**: *"You can only choose your augments when your champion is dead."* — 사망(부활 직후 포함, Classic-ish 문서 표현) 중에만 선택 화면 조작 가능. 드래프트 결과물 자체에는 영향 없음(시뮬레이터 무관), 게임 규칙 문서화 차원에서 기록.
- **황금 리롤 정의(공식)**: *"Golden Re-roll (increased chance to re-roll a higher tier Augment)"* — **draft.js의 황금 리롤 "근사:" 모델과 대조할 공식 준거**. "상위 티어 증강으로 리롤될 확률 증가"라는 효과 방향이 공식 확인됨(수치는 여전히 비공개).
- 스킬 증강 서술: *"modify the performance of your champion's abilities, enhancing their stats, altering their effects or, straight-up pushing them into berserker mode."* + 예시 *"Have you ever seen Annie's Disintegrate (Q) turn into a triple projectile?"* — **애니 Q(붕괴) × 투사체 3연발화**가 공식 예시로 추가 확보(증강명은 문서에 명시 없음 — 3연발(Tripleshot) 또는 다중 공격(Multishot)으로 추정, 특정은 미확인).
- 진행 트랙: 32개 마일스톤, 전부 무료(유료 패스 없음). "Reroll Augments 20 times in ARAM: Mayhem" 류의 XP 목표 존재.
- 정식(canonical) URL: Zendesk 원본 https://support-leagueoflegends.riotgames.com/hc/en-us/articles/45460878435987 → https://support.riotgames.com/en-us/league-of-legends/events/league-of-legends-aram-mayhem-game-mode 로 301.

### 3-2. "LoL Classic – ARAM: Mayhem Classic-ish" (마지막 갱신: 2026-07-21 19:00)

- §2에 반영. 추가로: *"This mode is not replacing standard ARAM: Mayhem; it's simply a Classic-ish way to experience the chaos!"* / FAQ: 스킨 부스트 구매 가능하나 환불 불가.

---

## 4. 개발자 채널 — 스킬 증강 지정 규칙 관련 발언 (신규 확보분)

- **Riot Phlox(6/19 핫픽스 보충, esports.gg 전재 — X 게시물 요약 기사)**: *"We know that some of these just didn't quite hit the mark, and some are just buggy"* / *"Right now, you're also just getting too many of these Augments, too often and they're just not exciting when you get them on spells that don't fit well"* — "스킬 단위로 잘 맞지 않는(don't fit well) 조합"이라는 표현으로, 조합(증강×스킬)이 사전 지정 단위임을 재확인. **Riot Cadmus**: *"We think [Ability Augments] show a lot of promise."*
- **공식 예시로 확정된 챔피언×증강×스킬 매핑(esports.gg 26.12 기사 + 지원 문서)**:
  - **블리츠크랭크 Q(로켓 손) × 다중 공격(Multishot)** — "한 훅으로 팀 절반 이상을 끌어올 수 있다"
  - **벨코즈 Q(플라즈마 분열) × 다중 공격(Multishot)** — "3발이 나가고 각 투사체가 분열" → **raw/10 §1.7에서 실측한 유일한 챔피언 전용 스펠 `Augment_ARAM_Multishot_Velkoz`와 정확히 부합**(데이터↔공식 발언 교차 확증)
  - **애니 Q(붕괴) × 투사체 3연발화**(지원 문서 예시 — 증강명 특정은 미확인)
- 26.15/26.16 버그픽스에서 추가된 상호작용 매핑(스킬 증강은 아니지만 증강×스킬 단위 증거): 로크 Q·E × 노련한 저격수(쿨 반환), 벨코즈 × 노련한 저격수, 베이가 W·아지르 W × 대마법사.
- **2026-07-14 이후 스킬 증강 지정 규칙에 대한 신규 개발자 발언: 발견하지 못함**(dev 블로그·X 요약 기사 검색 기준 — 미확인).

### 모드 로드맵 (2027 계획 언급의 후속)

- 타임라인: 26.03에서 모드 연장+대형 업데이트 예고(Inven Global) → 6/2경 개발 업데이트 "추가 업데이트 예정, 종료일 미정"(GameGrin, jina 경유) → 26.12 대개편(스킬/퀘스트 증강) → **7/14 개발 업데이트(Pabro & Meddler)**: *"At Worlds we'll give a little peek into some future plans for 2027 and beyond."* — **2027 로드맵의 일부가 Worlds 2026(패치 26.20 시기, 10월경)에서 공개 예정**. 커뮤니티 블로그(loltheory)도 "2027년까지 업데이트 계획"으로 정리.
- 후속 조사 트리거: Worlds 시점의 dev 발표(아수라장 2027 계획)를 추적할 것.

---

## 5. PBE 데이터마이닝 — 26.18~26.19 예고 (직접 실측 ✅)

- **Surrender@20은 2022-11 이후 갱신 중단 상태**(라벨 페이지 직접 확인 — 최신 글이 2022년) → PBE 기사 소스로 부적합. 현역 커버리지는 junglediff.net 등.
- **junglediff 26.18 PBE 업데이트(8/25)**: 아수라장/증강 관련 콘텐츠 **0** — 스킨(Risen Legend 트리스타나·오리아나)·아이콘·클래식 베이스 스킨 위주.
- **직접 diff(본 조사 실측 ✅)**: CommunityDragon `latest`(kiwi.bin mtime 8/29, 12,121,996B) vs `pbe`(mtime **9/1**, 12,177,617B)를 내려받아 AugmentData 전수 대조:
  - AugmentData **222 → 223**. 기존 222종의 rarity/Enabled/스킬증강 플래그/mAugmentTags/mBuildTags/AugmentDisplayTags **변경 0**. 제거 0.
  - **신규 1종: `ARAM_ClownCollege` — 광대 대학 (Clown College)**. 프리즘(rarity 2), 활성, 스킬 증강 아님({e3a02eac} 없음), mBuildTags 2(킬각/기동 축), AugmentDisplayTags [5]=Utility(보조), AugmentPlatformId 1310. AdditionalSpells: `..._Backstab`, `..._Deceive`.
  - 효과(PBE 스트링테이블 ko_kr 실측, `cherry_clowncollege_tooltip`): *"속임수 소환사 주문을 얻습니다. 암습 지속 효과를 얻습니다. 사망 시, 폭발하는 상자를 생성하여 엄청난 고정 피해를 입히고 주변 적을 공포에 빠뜨립니다."* — 샤코 컨셉(속임수=투명+순간이동, 암습=배후 추가 피해, 죽음 상자). **아레나의 동명 증강(ClownCollege, id 310)의 아수라장 이식판**(툴팁 키가 Cherry_* 재사용, 아이콘 동일).
  - 참고: `ARAM_ClownCollege`(id 1310)는 **라이브 cherry-augments.json 레지스트리(657종)에 이미 등재**되어 있으나 라이브 kiwi.bin에는 없음 — 레지스트리 선등록 상태였고 PBE에서 본체가 추가된 것.
  - **augmentgroups.bin.json도 변화**(라이브 62 → PBE 63 비어있지 않은 그룹): 신규 그룹 `{0c7ef8ce}`(9종: ADAPt, BacktoBasics, DrawYourSword, LittleDevil, Overflow, Purist_Caster, escAPADe, SkipTheBasics, Vampirism — 의미 미확인 ❓); CC 그룹 `{56299123}`에서 SquishySlappyGrab 제외, **ARAM_JeweledGauntlet이 4개 그룹에서 제외**, `{99d70c96}`에서 PhenomenalEvil·TankEngine·BurstingTeeth 제외 — 적격성/밸런스 변경의 전조일 수 있으나 용도 자체가 미확인(raw/10 §5.2)이므로 **해석 유보**.
- **판정**: Clown College는 26.18(9/10) 또는 26.19 출시로 추정 — 26.18 공식 프리뷰에 아수라장 언급이 없어 **출시 패치 미확정**. 9/10 노트에서 확인할 것.

---

## 6. augments.json 갱신 액션 플랜

1. **지금**: 변경 없음(§0 판정). 커밋 불필요.
2. **2026-09-10 이후**: 26.18 공식 노트(en/ko) 아수라장 섹션 확인 →
   - Clown College(광대 대학, 프리즘, category normal, arenaOrigin true) 추가 여부 반영
   - 있을 수 있는 밸런스/티어 변경 반영(프리뷰상 없음이 기본 시나리오)
3. **상시**: raw/09 §7-1의 티어 상충 3건(공포/꽁!/위력 추구)은 26.15~26.17 공식 노트에서도 언급 없음 — **여전히 미해소**. PBE diff에서도 rarity 변경 0이므로 게임 데이터 기준(raw/10 §1.6: 공포=골드, 꽁!=골드, 위력 추구=골드)이 현행 유지로 보인다(위키 모듈과의 상충은 위키 편집 이슈일 가능성이 높아짐 — 단정은 유보).
4. **10월(Worlds)**: 아수라장 2027 로드맵 발표 추적.

---

## 7. 미확인 / 한계

- 26.18 공식 노트 미발행(9/10 예정) → 아수라장 섹션 유무·내용 미확인.
- Clown College의 출시 패치(26.18 vs 26.19)와 최종 스펙(PBE는 변경될 수 있음).
- PBE augmentgroups 변경(신규 그룹 {0c7ef8ce}, JeweledGauntlet 제외 등)의 의미 — 그룹 파일의 용도 자체가 미확인.
- 지원 문서의 증강 화면 횟수 표기("시작+3/7/11/15")와 위키("3/7/11/15 4회")의 상충 — ARAM 시작 레벨 3을 고려하면 동일 사실의 표기 차로 추정되나 미확정.
- 7/14 이후 스킬 증강 지정 규칙에 대한 신규 개발자 발언 부재 — "없다"가 아니라 "발견하지 못함".
- Worlds에서 공개될 2027 로드맵의 내용.
- kiwi_jade.bin.json과 Classic-ish 모드의 관계.
- WebFetch 요약 경유 인용(패치 노트 영/한, 지원 문서, esports.gg, insider-gaming, GameGrin)과 r.jina.ai 프록시 경유 인용은 자구 단위 오차 가능. CommunityDragon diff·로컬 augments.json 대조·26.18 노트 404 확인은 직접 실측.

---

## 8. 출처 목록

**공식 패치 노트**
- 26.15 (영) — https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-15-notes/ / (한) — https://www.leagueoflegends.com/ko-kr/news/game-updates/league-of-legends-patch-26-15-notes/
- 26.16 (영) — https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-16-notes/ / (한) — https://www.leagueoflegends.com/ko-kr/news/game-updates/league-of-legends-patch-26-16-notes/
- 26.17 (영) — https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-17-notes/ / (한) — https://www.leagueoflegends.com/ko-kr/news/game-updates/league-of-legends-patch-26-17-notes/
- 26.18 (404 확인, 2026-09-03) — https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-18-notes/
- 패치 일정(26.18=9/10) — https://lolnow.gg/patch-notes/

**라이엇 공식 dev/지원**
- 개발 업데이트 TL;DW: Classic, Mayhem & More (2026-07-14, Pabro & Meddler — Classic-ish 발표, 2027 로드맵 Worlds 예고) — https://www.leagueoflegends.com/en-us/news/dev/tldw-classic-mayhem-more-dev-update/
- 지원 문서: ARAM: Mayhem Game Mode — https://support.riotgames.com/en-us/league-of-legends/events/league-of-legends-aram-mayhem-game-mode (Zendesk 원본: https://support-leagueoflegends.riotgames.com/hc/en-us/articles/45460878435987 )
- 지원 문서: ARAM: Mayhem Classic-ish — https://support.riotgames.com/en-us/league-of-legends/events/aram-mayhem-classicish-game-mode
- /dev: Augmentmaxxing (선행 raw/09 참조) — https://www.leagueoflegends.com/en-us/news/dev/dev-augmentmaxxing-aram-mayhem/

**26.18 프리뷰 (X 요약 기사)**
- insider-gaming — https://insider-gaming.com/lol-patch-26-18-preview-cassio-syndra-bard/
- sportskeeda — https://www.sportskeeda.com/esports/league-legends-patch-26-18-preview
- escorenews(Phroxzon "stabilization patch", Worlds=26.20) — https://escorenews.com/en/lol/news/80829-league-of-legends-patch-notes-26-18-16-18-preview-cassiopeia-adjustments-nerfs-to-seraphine-bard-zeri

**개발자 발언 전재 기사**
- esports.gg: Riot removes 450+ "un-fun" Ability Augments (Phlox·Cadmus 인용, 2026-06-19) — https://esports.gg/news/league-of-legends/riot-removes-450-ability-augments/
- esports.gg: removes traits and adds ability augments (Multishot 블리츠/벨코즈 예시) — https://esports.gg/news/league-of-legends/league-of-legends-aram-mayhem-removes-traits-and-adds-ability-augments/ (403 — 검색 스니펫 경유)
- insider-gaming: Classic-ish confirmed (Meddler 인용) — https://insider-gaming.com/aram-mayhem-classic-ish-confirmed-for-league-of-legends/
- X: @LeagueOfLeaks Classic-ish 요약 — https://x.com/LeagueOfLeaks/status/2077048548881772602
- GameGrin: future support (6/2 dev update 요약) — https://www.gamegrin.com/news/league-of-legends-announces-future-support-for-aram-mayhem/
- Inven Global: 26.03 연장+대형 업데이트 예고 — https://www.invenglobal.com/articles/20062/riot-games-extends-lol-aram-mayhem-mode-teases-major-update-in-patch-2603
- loltheory 블로그(2027까지 업데이트 계획 정리) — https://blog.loltheory.gg/league-of-legends-game-modes/

**Classic-ish 한국 소스**
- 공식 유튜브 쇼츠 "무작위 총력전: 아수라장 클래식 스타일이 왔습니다" — https://www.youtube.com/shorts/WhZTy1iamQM
- op.gg 모드 페이지 — https://op.gg/lol/modes/aram-mayhem-classic
- 다음(뉴스1 전재) 클래식 출시 — https://v.daum.net/v/20260715000209425

**PBE / 데이터**
- junglediff 26.18 PBE (8/25, Mayhem 콘텐츠 없음) — https://www.junglediff.net/2026/08/25/26-18-pbe-update-25-08-2026/
- Surrender@20 PBE 라벨(2022-11 이후 중단 확인) — https://www.surrenderat20.net/search/label/PBE
- CommunityDragon 라이브 kiwi.bin — https://raw.communitydragon.org/latest/game/maps/modespecificdata/kiwi.bin.json (mtime 2026-08-29)
- CommunityDragon PBE kiwi.bin — https://raw.communitydragon.org/pbe/game/maps/modespecificdata/kiwi.bin.json (mtime 2026-09-01)
- PBE 디렉토리 리스팅 — https://raw.communitydragon.org/json/pbe/game/maps/modespecificdata/
- PBE cherry-augments (ko/en) — https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/ko_kr/v1/cherry-augments.json (en은 default)
- 라이브 cherry-augments — https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/cherry-augments.json
- PBE 스트링테이블(en/ko) — https://raw.communitydragon.org/pbe/game/en_us/data/menu/en_us/lol.stringtable.json , https://raw.communitydragon.org/pbe/game/ko_kr/data/menu/en_us/lol.stringtable.json
- augmentgroups 라이브/PBE — https://raw.communitydragon.org/latest/game/maps/modespecificdata/augmentgroups.bin.json , https://raw.communitydragon.org/pbe/game/maps/modespecificdata/augmentgroups.bin.json

**팬사이트 집계(교차 확인용)**
- arammayhem.com 패치 노트 집계(26.17이 최신, 8/25) — https://arammayhem.com/patch-notes/
- arammayhem.com Ultra Hydra — https://arammayhem.com/augments/ultra-hydra/
