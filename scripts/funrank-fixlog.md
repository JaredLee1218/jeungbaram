# funrank.json 수정 내역 (dex-recommended 계약 — 시그니처 풀 적격성)

funrank.json은 큐레이션 산출물이라 생성 스크립트가 없고, 수정은 이 로그에 근거와 함께 기록한다.

## 2026-09-03 — signatureAugments 풀 적격성 전수조사 (173명)

**계약**: 미리보기 패널(시그니처) ⊆ 꿀잼 사전(#dex recommended)이 성립하려면
signatureAugments가 그 챔피언의 조건부 풀(`draft.js eligibleAugments`)에 실존해야 한다.
풀 판정은 augments.json restrictions(실측·데이터마인 근거) 기준 — 커뮤니티 증언과
풀 모델이 상충하면 풀 모델을 따르고, 아래에 상충 사실을 남긴다.
영구 게이트: `scripts/validate-data.mjs` 6-5 (위반 시 exit 1).

**전수조사 결과**: 시그니처 보유 105명 / 시그니처 총 180건 중 **위반 4명 4건**. 나머지 169명 적합.

### 1. Yunara — ARAM_MasterofDuality(결투의 대가) 제거
- 위반: MasterofDuality는 `classRequired [Mage, Support]`(AP 코어 이진 제외 — 실측 empirical,
  raw/11 §3-2) 게이트인데 유나라는 Marksman(dmg=ad) → 풀 밖.
- 처리: **제거** (대체 불필요 — 잔존 시그니처 2건이 이미 근거 보유).
- 잔존 근거: ARAM_TapDancer = raw/06 ⑱ "징크스/유나라 + 탭 댄서",
  ARAM_DualWield = raw/06 §요약 "유나라: 결대+양잡" 중 양잡(쌍수) + combo "결투의 대가 유나라".
- 상충 기록: raw/06 §요약의 "유나라: 결대"는 커뮤니티 증언이지만 AP 코어 게이트(실측)와
  상충 — 풀 모델 우선. oneLiner의 "결대" 서술은 _meta 선례(밈 서술 보존)대로 유지.

### 2. Chogath — ARAM_escAPADe(마법사 (물리)) → ARAM_Quest_SteelYourHeart(강철 같은 심장) 대체
- 위반: escAPADe는 `championExclude`에 Chogath 명시(dmg=ap 59명 이진 제외 —
  mm 2026-09-03 실측 근거, class-tier-adjust.json poolGateCandidates) → 풀 밖.
- 처리: **대체** — ARAM_Quest_SteelYourHeart (풀 내, funTier S, 초가스 명시 combo
  "프로틴 서렌 세트"의 구성 증강).
- 대체 근거: raw/13 "문도·오른·탐 켄치·초가스=체력 증강" + "탱커는 퀘스트: 강철 심장이
  가장 사기"(온두콩두), raw/06 ⑬ "프로틴음료 + 탱크엔진 + 강철심장 + 인내심 = 서렌".
- 상충 기록: raw/06 ⑮ "초가스 + 마법사(물리)" 커뮤니티 조합은 실측 제외 게이트와 상충 —
  풀 모델 우선. oneLiner의 "물리 마법사" 서술은 밈 서술로 유지.

### 3. Maokai — ARAM_CircleofDeath(죽음의 순환) → ARAM_InfernalConduit(지옥의 전도체) 대체
- 위반: CircleofDeath는 `abilityProps [heal]` 게이트(근사: "킷 내 회복 스킬 보유" —
  실측 소라카·다리우스 근거, raw/11 §4-3)인데 마오카이 스킬 props에 heal 없음
  (패시브 회복은 스킬 아님) → 풀 밖.
- 처리: **대체** — ARAM_InfernalConduit (풀 내: restrictions 없음, funTier S).
- 대체 근거: raw/06 ① 전도체 절 "도트 AP + CC탱커(알리스타, **마오카이**)도 추천".
- 상충 기록: raw/06 ⑭ 사기증강 리스트 "마오카이=죽순"은 커뮤니티 증언이지만 heal 게이트
  (근사)와 상충 — 풀 모델 우선. oneLiner의 "죽순" 서술은 밈 서술로 유지.
  (게이트 자체가 "근사" 표기라 이후 실측으로 게이트가 완화되면 죽순 복원 검토.)

### 4. Vex — ARAM_Cruelty(잔혹 행위) 제거 (대체 없음 → 빈 배열)
- 위반: Cruelty는 `abilityProps [immobilize]` 게이트(하드 CC 스킬 보유 — kiwi.bin
  mAugmentTags=16 합치)인데 벡스 스킬 props에 immobilize 없음(공포는 패시브 연동이라
  스킬 태그 미보유) → 풀 밖.
- 처리: **제거, 대체 없음** — raw/06·07·13에서 벡스×다른 증강 근거 없음(벡스 언급은
  raw/06 §요약 잔혹 행위 한 건뿐). 지어내기 금지 원칙에 따라 빈 배열.
  사전 recommended는 2순위(문맥 S/A)로 채워지므로 빈 시그니처여도 1개 이상 보장.
- 상충 기록: raw/06 §요약 "벡스: 잔혹 행위"는 커뮤니티 증언이지만 immobilize 게이트와
  상충 — 풀 모델 우선. oneLiner의 "잔혹행위" 서술은 밈 서술로 유지.

### 부수 변경
- `_meta.method`에 풀 적격성 요구(2026-09-03 강화) 문장 추가.
- 죽은 combo 참조 정리는 이 로그 범위 밖: "피돼지 물리 마법사 초가스"(escAPADe)·
  "회복이 곧 딜, 죽순"의 Maokai는 사전/추천에서 자연 필터링됨(발동 불가 combo 미표시).
