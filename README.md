# 증바람 시뮬레이터 ⚔️

리그 오브 레전드 **무작위 총력전: 아수라장**(ARAM: Mayhem, 일명 "증바람")의 증강 드래프트를 실제 게임 규칙 그대로 시뮬레이션하고, 뽑힌 조합에 맞는 **꿀잼 플레이스타일·스킬·아이템**을 추천해 주는 웹 페이지입니다. 모바일에서도 잘 돌아갑니다.

## 뭘 할 수 있나

1. 챔피언 173명 중 하나를 고른다 (한국어 검색·역할 필터)
2. 실제 게임과 같은 규칙으로 증강을 뽑는다
   - 레벨 3/7/11/15, 총 4라운드 × 3개 중 1개 선택
   - 슬롯별 1회 리롤 (같은 등급) — 한 라운드에 최대 6개 열람
   - 황금 리롤 1회 (한 단계 높은 등급)
   - 화면당 동일 등급, 1·2라운드 연속 실버 금지, 게임 내 재등장 금지
   - 챔피언별 증강 필터 (원거리 전용, 마나 필요, 스킬 속성 조건 등)
3. 4증강 조합에 맞는 추천을 받는다 — 커뮤니티 검증 꿀조합 70종 + 태그 규칙 기반
4. URL로 공유하면 같은 드래프트가 재현된다 (시드 기반)

## 로컬에서 실행

```
node scripts/serve.mjs
```

→ http://localhost:8787 (의존성 설치 불필요, Node 14+)

## 테스트

```
node scripts/test-draft.mjs        # 드래프트 엔진 규칙 검증 (60)
node scripts/test-recommend.mjs    # 추천 엔진 (76)
node scripts/test-e2e.mjs          # 실데이터 통합 (39)
node scripts/validate-data.mjs     # 데이터 교차 무결성
node scripts/test-montecarlo.mjs   # 랜덤 시뮬레이션 30게임 규칙 위반 검사
```

## GitHub Pages 무료 배포

이 저장소는 빌드 없이 `docs/` 폴더가 곧 사이트입니다.

1. GitHub에 저장소를 만들고 push:
   ```
   git remote add origin https://github.com/<내계정>/jeungbaram.git
   git push -u origin main
   ```
2. 저장소 **Settings → Pages → Build and deployment**에서
   Source: *Deploy from a branch*, Branch: **main** / **/docs** 선택 → Save
3. 1~2분 뒤 `https://<내계정>.github.io/jeungbaram/` 에서 접속 (무료 도메인)

## 데이터 출처와 갱신

- 증강 225종: [CommunityDragon](https://raw.communitydragon.org) (내부 코드네임 KIWI) + [LoL 공식 위키](https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Augments) — 갱신 절차는 `scripts/refresh-augments.md`
- 챔피언/아이템: Riot [Data Dragon](https://developer.riotgames.com/docs/lol#data-dragon) 16.17.1 ko_KR — `scripts/refresh-champions.md`
- 꿀조합: 한국·영어권 커뮤니티 조사 (`research/` 폴더 참조)
- 등급 등장 확률과 챔피언별 필터는 라이엇 비공개 → **추정치**이며 페이지에 고지됩니다.

증바람 시뮬레이터는 Riot Games와 무관한 팬 프로젝트입니다. League of Legends는 Riot Games, Inc.의 상표입니다.
