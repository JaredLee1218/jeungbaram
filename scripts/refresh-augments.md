# augments.json 수동 갱신 절차

`docs/data/augments.json`을 새 패치에 맞춰 갱신하는 방법. (최종 갱신: 2026-09-02, 패치 26.17 기준)

## 1. 받아올 소스 (전부 인증 불필요, 2026-09-02 전수 200 확인)

| 무엇 | URL | 용도 |
|---|---|---|
| 증강 마스터 레지스트리(한국어) | `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/ko_kr/v1/cherry-augments.json` | apiName(`augmentNameId`) ↔ **한국어 이름**(`nameTRA`) ↔ id. 이름이 cherry지만 Mayhem(KIWI) 포함 전 모드 공용 |
| 증강 마스터 레지스트리(영어) | 같은 URL의 `global/default/` 버전 | 영어 표시명 ↔ apiName 매칭용 |
| 모드별 증강 목록 | `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/augment-lists.json` | `modeName: "KIWI"` 항목 = 현재 게임 파일의 Mayhem 증강 목록(경로 마지막 토큰이 apiName) |
| 증강 전체 정의(12MB) | `https://raw.communitydragon.org/latest/game/maps/modespecificdata/kiwi.bin.json` | `__type: "AugmentData"` 엔트리에서 **등급**(`rarity` 0=silver/1=gold/2=prismatic), **아이콘 경로**(`AugmentLargeIconPath`), 번역 키(`NameTra`/`DescriptionTra`) |
| 한국어 스트링테이블(36MB) | `https://raw.communitydragon.org/latest/game/ko_kr/data/menu/en_us/lol.stringtable.json` | 번역 키 → 한국어 문자열. **키는 전부 소문자로 조회**(예: `Kiwi_Sonata_Name` → `kiwi_sonata_name`). 경로에 `en_us`가 있어도 내용은 한국어 |
| 위키 증강 카탈로그(영어) | `https://wiki.leagueoflegends.com/en-us/Module:MayhemAugmentData/data?action=raw` | 225종 전체 목록 + 등급 + **비활성 여부**("This augment is currently disabled" 문구) + 효과 설명 원문. CC BY-SA 3.0 |
| Arena 증강 데이터 | `https://wiki.leagueoflegends.com/en-us/Module:ArenaAugmentData/data?action=raw` | `arenaOrigin` 판정(이름 정규화 대조) |

패치 고정이 필요하면 `latest` 대신 `https://raw.communitydragon.org/26.17/...`처럼 버전을 명시(단, cdragon 경로 버전은 `16.17` 형식일 수 있음 — ddragon `versions.json`으로 확인).

## 2. 갱신 규칙 (현재 파일이 만들어진 방식)

1. **위키 모듈(225종)이 목록·비활성의 1차 소스**, CDragon이 apiName·한국어명·아이콘·등급의 소스.
2. 영어 표시명(위키 키 ↔ 레지스트리 `nameTRA`)을 정규화(소문자, 영숫자만)해서 조인. 후보가 여럿이면 KIWI 목록에 있는 것 우선.
3. 표시명이 달라 수동 매핑한 8건(빌드 스크립트의 `apiOverride`):
   - Quest: Steel Your Heart→`ARAM_Quest_SteelYourHeart`, Quest: Urf's Champion→`ARAM_Quest_UrfsChampion`, Quest: Wooglet's Witchcap→`ARAM_Quest_WoogletsWitchcap`, Quest: Sneakerhead→`Quest_Sneakerhead`, Quest: Icathia's Fall→`ARAM_Quest_VoidImmolation`, Mountain Soul→`ARAM_MountainSoul`, Droppybara→`Dropybara_Active`, Final City Transit→`TrainOfTheDead`
4. **등급은 게임 파일(kiwi.bin.json) 우선.** 26.17 기준 위키와 2건 불일치: BONK!, Terror(위키 실버/게임 골드 → 골드 채택).
5. **아이콘**: `AugmentLargeIconPath`를 소문자로 바꾸고 `.tex`→`.png`, 앞에 `https://raw.communitydragon.org/latest/game/` 붙임. 스킬(Ability) 증강 다수는 공용 아이콘(`genericabilityaugmenticon_{silver|gold|prismatic}.png`)을 씀 — 정상.
6. 게임 파일에 없는 증강 4종(Guilty Pleasure, Clown College, Droppybara, Final City Transit — 뒤 3종은 비활성)은 레지스트리의 `augmentSmallIconPath`에서 `_small`→`_large` 치환으로 아이콘 생성. **Droppybara·Final City Transit는 레지스트리 아이콘 자체가 다른 증강 것(placeholder)이므로 재등장 시 재확인.**
7. `enabled: false` = 위키 비활성 11종 + 미출시(내부 데이터 전용) 3종(Snap Back=`SnapBack`, Double Strike=`DoubleStrike`, Reload=`KeepGoing`).
8. `descKo`는 위키 효과 텍스트를 한국어로 요약 정리한 수작업 필드(스트링테이블 요약은 `@변수@` 플레이스홀더가 남아 그대로 못 씀). `tags`/`restrictions`도 수작업 — **새 증강이 추가되면 이 세 필드는 직접 작성해야 함**(restrictions 근거: `research/raw/03-champion-augment-pools.md`).

## 3. 갱신 시 체크리스트

1. `augment-lists.json`의 KIWI 목록 개수/구성이 바뀌었는지 diff → 추가·삭제 증강 파악.
2. 위키 모듈 재다운로드 → 비활성 문구 변화 반영(`enabled`).
3. kiwi.bin.json에서 등급/아이콘 재추출, 새 아이콘 URL은 실제 요청으로 200 확인.
4. `patch` 필드 갱신(현 라이브 패치는 ddragon `https://ddragon.leagueoflegends.com/api/versions.json`의 최신 버전 - 10, 예: 16.17.1 → 26.17).
5. 산출 검증: 총 개수, 등급 분포, `apiName` 중복 없음, 모든 아이콘 200.

참고: 경기 통계(승률 등)는 Riot API가 Mayhem을 403으로 차단해 얻을 수 없음(`research/raw/04-data-api.md` 참조).
