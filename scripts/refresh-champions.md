# 챔피언·아이템 데이터 갱신 절차 (docs/data/champions.json, items.json)

- 생성기: `scripts/gen-data.cjs` (Node 14+, 의존성 0 — 루트 package.json이 `"type":"module"`이라 확장자 .cjs 필수)
- 데이터 소스: Riot Data Dragon ko_KR (검증 근거: `research/raw/05-champions-items.md`)
- 마지막 갱신: 2026-09-02, DDragon **16.17.1** (≈ 라이브 패치 26.17, 챔피언 173명 / 아이템 116개)

## 갱신 절차

1. 최신 DDragon 버전 확인 (배열 첫 원소):
   ```
   curl -s https://ddragon.leagueoflegends.com/api/versions.json
   ```
   ※ 2025년 이후 DDragon 내부 버전(16.x)과 라이브 패치 표기(26.x)는 오프셋 10 관계.

2. 원본 다운로드 → `scripts/_tmp/` (gitignore 대상, 파일명 고정):
   ```
   cd scripts && mkdir -p _tmp
   curl -sS -o _tmp/championFull_ko.json "https://ddragon.leagueoflegends.com/cdn/{버전}/data/ko_KR/championFull.json"
   curl -sS -o _tmp/item_ko.json         "https://ddragon.leagueoflegends.com/cdn/{버전}/data/ko_KR/item.json"
   ```
   - `championFull.json`(~2.5MB)은 요약본 champion.json과 달리 173명 전원의 spells/passive를 1파일에 담고 있어 개별 champion/{Id}.json 173회 fetch가 불필요.

3. 생성 (리포지토리 루트에서):
   ```
   node scripts/gen-data.cjs {버전}     # 예: node scripts/gen-data.cjs 16.18.1
   ```
   - `docs/data/champions.json`, `docs/data/items.json`을 덮어쓰고 stdout에 검증 리포트(JSON) + 스팟체크 출력.

4. 리포트 확인 체크리스트:
   - `champions` == versions.json 시점의 총원(16.17.1 기준 173) / `championErrors` 빈 배열
   - `longShorts` 0, `emptyShorts` 0, `noProps` 빈 배열(비면 키워드 패턴 보강 필요)
   - `items` 60~120 범위 / `itemsNoTags` 빈 배열
   - 아이콘 URL 샘플 2~3개 `curl -I`로 200 확인 (특히 신규 챔피언/신규 아이템)

## 변환 규칙 요약 (계약 준수 사항)

- `usesMana` = `partype === "마나"` (기력/분노/피의 샘 등은 false)
- `ranged` = `stats.attackrange >= 300` (예: 라칸 300 → ranged)
- `spells[].short`·`passiveKo` = 설명(HTML 제거)에서 문장 단위로 80자(패시브 60자) 이내 발췌, 초과 시 말줄임
- `abilityProps` = 스킬+패시브 한국어 설명의 **키워드 매칭 근사치** (파일 `_note`에 명시):
  돌진/도약→dash, 투사체/발사/던지→projectile, 밀쳐/띄워/공중으로→knockback, 보호막→shield,
  회복시/치유→heal, 은신/투명→stealth, 광역/주변→aoe, 지정한 적→targeted, 회전→spin,
  모든 적 챔피언/거리와 상관없이→global. 실제 메커니즘과 다를 수 있음(현재 global=Karthus·Mel·Nocturne·TwistedFate 4명 등).
- 아이템 필터: `id < 10000`(12xxxx/22xxxx/32xxxx/771xxx 모드 변형 제외) && `maps["12"]==true`
  && `gold.purchasable` && `inStore!==false` && `requiredChampion 없음` && `consumed 아님` &&
  **완성템**(`into` 없음 && `from` 있음) — 여기에 EXTRA_IDS(2단계 신발 7종, 수호자 시작템 4종, ARAM 전용 생명선 4003) 추가, 이름 중복 제거.
- 아이템 `tags` = augments.json과 동일 어휘(onhit/as/ad/ap/crit/tank/heal/shield/move/cc/mana/aoe/dot/execute/onkill/gold/support/dash)를 DDragon tags + 설명 키워드로 근사 부여.

## 주의사항

- 새 패치에서 챔피언이 추가되면 자동 포함되지만, 신규 자원 타입(partype)이 "마나"가 아닌 표기로 나오면 usesMana 규칙 재검토.
- 아이템 대격변(시즌 개편) 시 EXTRA_IDS의 신발/수호자 ID가 삭제·변경될 수 있음 — 리포트의 items 수가 60 미만/120 초과면 큐레이션 기준 조정.
- DDragon 스킬 툴팁의 수치 플레이스홀더({{ qdamage }})는 복원 불가라 short에는 수치가 없음 — 의도된 동작.
- champions.json ~239KB, items.json ~22KB (GitHub Pages 정적 서빙 문제 없음).
