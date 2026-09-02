# 증바람 시뮬레이터 — 구현 계획

> 2026-09-02 수립. 근거: [research/STUDY.md](research/STUDY.md)

## 목표

챔피언을 고르면 실제 게임과 같은 규칙(레벨 3/7/11/15 총 4라운드, 매 라운드 3개 제시 + 슬롯별 1회 리롤 = 최대 6개, 화면당 동일 등급, 1·2라운드 연속 실버 금지, 황금 리롤)으로 증강 드래프트를 시뮬레이션하고, 뽑힌 증강 조합에 맞는 **꿀잼 플레이스타일·스킬·아이템**을 추천하는 웹 페이지. **모바일 우선 반응형.**

## 기술 선택과 이유

| 항목 | 선택 | 이유 |
|---|---|---|
| 호스팅 | **GitHub Pages** (무료) | 정적 사이트 무료 호스팅 + `https://<계정>.github.io/jeungbaram/` 무료 도메인 |
| 스택 | **순수 HTML/CSS/JS (ES 모듈), 빌드 없음** | 이 PC의 Node가 v14로 오래됨 → 빌드 체인 배제. Pages에 폴더 그대로 올리면 끝. 의존성 0 |
| 데이터 | **정적 JSON** (빌드 타임에 수집) | 증강 225종 메타데이터는 CommunityDragon(KIWI)+공식 위키에서 무료 확보 검증됨. 서버 불필요 |
| 이미지 | CDragon/DDragon CDN 핫링크 | 저장소 용량 0, 패치 추적 용이 |
| 웹 루트 | `docs/` 폴더 | GitHub Pages "main 브랜치 /docs" 배포가 설정 한 번으로 끝남 |

제약: 모든 리소스 경로는 **상대 경로** (Pages가 `/jeungbaram/` 하위 경로라서).

## 데이터 계약 (팀원 간 인터페이스)

- `docs/data/augments.json` — 증강 225종: id, apiName, nameKo/En, tier(silver/gold/prismatic), descKo, icon URL, enabled, restrictions(원거리 전용·스킬 속성 요구 등)
- `docs/data/champions.json` — 챔피언 173명 ko_KR: id, key, nameKo, tags, partype, ranged, 스킬 요약, icon URL
- `docs/data/items.json` — ARAM 구매 가능 주요 아이템: id, nameKo, tags, icon URL
- `docs/data/synergies.json` — 조합 시드(연구 06·07에서 큐레이션): 정확 조합(챔피언×증강→왜 꿀잼·아이템·스킬) + 태그 규칙
- `docs/js/draft.js` — 순수 함수 드래프트 엔진 (시드 가능 RNG)
- `docs/js/recommend.js` — (챔피언, 증강[]) → 추천 결과
- `docs/js/app.js` + `docs/index.html` + `docs/css/app.css` — UI

## 단계와 팀 편성

| 단계 | 팀원 | 산출물 |
|---|---|---|
| 1. 데이터 (병렬) | A1 증강 수집 | augments.json (+재수집 스크립트 `scripts/`) |
| | A2 챔피언·아이템 수집 | champions.json, items.json |
| | A3 시너지 큐레이션 | synergies.json (연구 06·07·03 기반) |
| 2. 로직 (1과 병렬) | B1 드래프트 엔진 | draft.js + 규칙 문서화 |
| | B2 추천 엔진 | recommend.js |
| | B3 UI | index.html, app.css, app.js (모바일 우선) |
| 3. 통합 | C1 | 모듈 연결, 인터페이스 불일치 해소 |
| 4. 검증 (병렬) | D1 규칙 감사 | draft.js vs research/raw/01·03 대조, 직접 수정 |
| | D2 데이터 무결성 | 225종 완전성·한국어·아이콘 URL 표본 검사 |
| | D3 UI·모바일 리뷰 | 반응형·터치·접근성 점검, 직접 수정 |
| 5. 마감 | E1 스모크 테스트 | 로컬 서버 기동 + 로직 유닛 체크 |
| 6. 배포 | (인라인) | git init·커밋·README·배포 가이드. **GitHub push만 사용자 인증 필요** |

## 알려진 근사치 (정직하게 UI에 표기)

- 등급 등장 확률: 라이엇 비공개 → 추정 가중치 사용, 설정에서 조정 가능
- 챔피언별 증강 필터: 공식 확인된 명문화 제한 + 스킬 속성 태그 기반 **근사** (정확한 매핑은 비공개)
