# 증바람

이 파일은 Claude Code가 이 저장소에서 작업할 때 참고하는 가이드입니다.
전체 작성 베스트 프랙티스: `C:/Users/Administrator/.claude/references/claude-md-best-practices.md`

## Project Overview

리그 오브 레전드 **무작위 총력전: 아수라장**(ARAM: Mayhem, 일명 "증바람" = 증강 + 칼바람) 시뮬레이션 웹 페이지.
증강이 3개 랜덤으로 제시되고 각 슬롯을 리롤할 수 있는 실제 게임의 랜덤 증강 선택을 시뮬레이션하고,
나온 증강 조합에 맞춰 챔피언별로 "개꿀잼" 플레이스타일·스킬·아이템을 추천해 주는 것이 목표.

- 스터디 자료: `research/STUDY.md` (마스터 보고서), `research/raw/` (주제별 원본 조사, 교차 검증됨)
<!-- 스택이 정해지면 기술 스택도 여기에 명시 -->

## Critical Constraints

- **의존성 0, 빌드 도구 금지** — 순수 정적 웹만. 강제 장치: package.json에 dependencies 없음 유지
- **docs/ 안에서는 상대 경로만** — GitHub Pages가 `/저장소명/` 하위 경로라 절대 경로(`/`)는 배포에서 깨짐
- **게임 규칙의 근사치는 코드 주석에 "근사:" 표기** — 등급 확률·황금 리롤 보유 모델 등 (검증 에이전트가 감사함)
- 외부 데이터 텍스트를 innerHTML에 꽂지 말 것 (XSS — textContent 사용)

## Development Commands

```
node scripts/serve.mjs      # 로컬 미리보기 http://localhost:8787 (주 명령)
node scripts/test-draft.mjs # 이하 Testing 섹션의 테스트 5종
```

빌드 단계 없음 — `docs/`가 곧 배포본. 이 PC의 Node는 v14.17.4 (fetch 없음, 모던 브라우저 문법은 docs/ 안에서만).

## Architecture

- `docs/` — GitHub Pages 웹 루트 (main 브랜치 /docs 배포). **상대 경로만 사용** (Pages 하위 경로 제약)
  - `js/draft.js` — 드래프트 엔진 (순수 함수, DOM 금지, 시드 재현 가능)
  - `js/recommend.js` — 추천 엔진 (combos 정확 매칭 → tagRules 점수화 → 폴백)
  - `js/app.js` + `index.html` + `css/app.css` — SPA UI (챔피언 선택 → 드래프트 → 결과)
  - `data/*.json` — augments(225) / champions(173) / items(117) / synergies(combos 70)
- `scripts/` — 테스트·검증·서버·데이터 갱신 절차 (Node v14 호환 필수)
- `research/` — 교차 검증된 스터디 자료. **게임 규칙 수정 시 반드시 `research/raw/01`·`03`과 대조할 것**
- 데이터 흐름: JSON 4종 fetch → draft.js(eligibleAugments 필터 → 4라운드) → recommend.js → UI

## Testing

```
node scripts/test-draft.mjs && node scripts/test-recommend.mjs && node scripts/test-e2e.mjs && node scripts/validate-data.mjs && node scripts/test-montecarlo.mjs && node scripts/test-fidelity.mjs
```

로직 변경 시 전부, 데이터 변경 시 validate-data + e2e 필수. 게임 규칙 관련 수정은 research/raw/01-mode-mechanics.md 기준으로 회귀 테스트를 추가할 것.

## Notes for AI Assistants

- 요청받은 것만 구현할 것 — 그 이상도 이하도 아니게.
- 의도적인 설계 결정은 "고치기" 전에 먼저 확인할 것.
<!-- 커밋 메시지 형식, 커뮤니케이션 선호 등이 정해지면 여기에 추가 -->

## Current Status

- 2026-09-02: 스터디 완료(`research/STUDY.md`) → v1 구현 완료. 테스트 5종 전부 통과(몬테카를로 30게임 규칙 위반 0). 로컬 검증 완료.
- 2026-09-02: GitHub 배포 완료 — https://jaredlee1218.github.io/jeungbaram/ (JaredLee1218/jeungbaram, Pages main /docs)
- 2026-09-02: 2차 심층 스터디 완료 — 역할군별 증강 풀·능력 증강 티어 (`research/AUGMENT-POOLS-STUDY.md` + `research/raw/09~13` + 기계가독 `research/data/eligibility-notes.json`)
- 다음 단계: eligibility-notes.json을 draft.js 필터/가중치에 반영 (STUDY §3의 6단계 작업 순서 참조 — champions.json에 immobilize 등 속성 추가 필요). 미커밋 상태.
<!-- 진행 상황이 생기면 완료 / 진행 중 / 다음 단계를 여기에 갱신 -->
