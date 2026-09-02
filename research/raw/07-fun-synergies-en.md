# 영어권 ARAM Mayhem 시너지·티어 정보 조사 (raw)

- 조사일: 2026-09-02 (현재 LoL 패치 26.17 기준 데이터가 대부분)
- 조사 방법: WebSearch + WebFetch (영어권 소스 중심)
- 주의: WebFetch는 요약 모델을 거치므로 세부 수치는 ±오차 가능성 있음. 수치가 상충하는 곳은 본문에 병기함.
- Reddit(reddit.com)은 크롤러 차단으로 직접 접근 불가 → 간접 인용/미확인으로 표기 (하단 "미확인" 참조)

---

## 0. 모드 기본 사항 (영어권 소스 종합)

- ARAM: Mayhem은 Arena/TFT의 증강(Augment) 시스템을 칼바람 나락(Howling Abyss)에 이식한 모드. (u.gg news, https://u.gg/lol/news/aram-mayhem-tier-list)
- 출시일: 2025-10-22, "역대 로테이션 모드 중 가장 인기 있는 축" — EloFactory 블로그 주장 (https://elofactory.gg/en/blog/aram-mayhem-broken-champion-synergies) ※ 타 소스 교차 확인 못함 → 준(準)확인
- 증강 선택 시점:
  - u.gg: "레벨 7, 11, 15에서 증강 획득, 총 4~5개" (https://u.gg/lol/aram-mayhem-augment-tier-list 검색 스니펫)
  - EloFactory/Aussyelo: "레벨 1, 7, 11, 15의 4회, 죽어서 부활 대기 중일 때만 선택 가능" — Aussyelo 원문: "You can only pick augments when you're dead. If you're playing Soraka and somehow haven't died by level 11, you're sitting on fewer augments." (https://www.aussyelo.com/blog/aram-mayhem-guide-best-augments-tier-list)
  - → 정확한 횟수/시점은 소스 간 상충. **미확인**으로 두되 "레벨 1(또는 시작)+7/11/15, 사망 시 선택" 쪽이 다수설.
- 증강 등급: Silver(스탯) < Gold(쿨감·키스톤류) < Prismatic(궁 초기화·게임 체인저). 같은 선택 화면에서 등급은 모두에게 동일하게 랜덤. 리롤 가능(화면당 최대 6개까지 볼 수 있음). (sheepesports 검색 스니펫, https://www.sheepesports.com/us/all/articles/aram-mayhem-how-to-play-tips-augment-suggestions-and-more/en — 본문 fetch는 403/CAPTCHA로 차단, 스니펫 기반)
- 룬 비활성화, 점멸 고정(스펠 1개만 선택, Exhaust 불가), 전용 아이템(Atma's Reckoning, The Golden Spatula, Stormrazor)과 전용 스펠(Poltergeist, Laser Heal) 존재. (sheepesports 스니펫, 위 URL) ※ 세부는 본문 확인 불가 → 준확인
- 영어권 커뮤니티/사이트에서 증강을 "hex"라고 부르는 용례가 있음(특히 arammayhem.com 콤보 설명). Tank Engine, Cruelty, Dual Wield, Tap Dancer, Dusk and Dawn, Overlord's Bloodmail, Twin Flames 등이 "hex"로 불림 — 증강과 별개 시스템인지 여부는 **미확인** (https://arammayhem.com/combo/)

---

## 1. 통계 사이트 구조 분석

### 1-1. arammayhem.com (https://arammayhem.com/)
전용 통계+공략 사이트. 패치 26.17 기준. 구성:

- **챔피언 통계**: 172개 챔피언의 승률/픽률. 상위: Yasuo 56.64%, Gwen 56.37%, Lillia 55.99%.
- **챔피언 티어리스트**: 5단계 — S+ "God Tier" 7명(Teemo, Yasuo, Aurelion Sol 등), S 19명(Kayn, Lillia 등), A 26명, B 17명, C 103명.
- **증강 통계**: 총 199개 증강의 승률/픽률/랭킹. 등급 필터: Prismatic 69개 / Gold 73개 / Silver 57개 / 삭제(legacy) 58개. 증강별 상세 페이지(/augments/이름/)에 효과 원문, 승률·픽률 변동(↑↓), 패치 내 순위, 추천 챔피언 6명까지 표시.
  - 예시(개별 페이지 확인): Mystic Punch — Prismatic, 효과 "Basic attacks on-hit reduce the cooldowns of your abilities by 1.25 seconds", 승률 54.99%, 픽률 28.01%, 26.17 기준 47위, 추천: Yasuo, Fiora, Master Yi, Yone, Hecarim 등 (https://arammayhem.com/augments/mystic-punch/)
  - 메인 페이지 기준 승률 상위 증강: Transmute: Prismatic 65.37%, High Roller 64.55%, Shrink Engine 61.59% (※ /augments/ 목록 페이지 재확인 시 Transmute: Prismatic 64.15%, Shrink Engine 56.44% 등으로 다소 다름 — 패치 구간 차이 또는 추출 오차, 정확 수치는 사이트 직접 확인 필요)
  - Tap Dancer 53.57% WR(26.16), Double Tap 49.83% WR(26.17) 같은 식으로 개별 증강 페이지 타이틀에 승률 노출 (검색 스니펫)
- **콤보(시너지) 섹션** (https://arammayhem.com/combo/): 챔피언+증강(+아이템) 콤보 666개 가이드. 각 콤보에 "왜 강한가" 설명. 증강별 콤보 모음 페이지도 있음(/combo/augment/dual-wield/ 등).
- **기타**: 패치노트/메타 추적, Ryze 시뮬레이터·Vladimir 시뮬레이터·데미지 계산기 등 인터랙티브 도구.

### 1-2. u.gg
- **챔피언 티어리스트** (https://u.gg/lol/aram-mayhem-tier-list): 패치 26.17. "data science approach" 표방. 티어 S+~D. 직접 fetch는 403이라 프록시 경유로 확인 — S+ 7명: Jinx, Sett, Aurelion Sol, Kayle, Seraphine, Yunara, Lillia. S: Morgana, Yone, Master Yi, Viktor, Singed, Brand, Ahri, Zaahen, Aphelios, Bel'Veth, Yasuo, Teemo, Heimerdinger 등. (승률/픽률 수치는 JS 렌더링이라 추출 안 됨)
  - ※ 다른 검색 스니펫에서는 "S+: Jinx, Caitlyn, Brand, Miss Fortune / S: Lux, Blitzcrank, Twitch, Karthus"로 나온 시점도 있음 — 패치별 변동.
- **증강 티어리스트** (https://u.gg/lol/aram-mayhem-augment-tier-list): 패치 26.17, 등급(Prismatic/Gold/Silver)·지역·패치 필터. Prismatic 상위 나열: High Roller, Dual Wield, Infernal Conduit, Giant Slayer, Mad Scientist, Eureka, Ultra Hydra, Goliath, Draw Your Sword, Infinite Recursion, DropBear, Back To Basics, Wooglet's Witchcap, Final Form, Hand of Baron, Tap Dancer, Windspeaker's Blessing, Scopiest Weapons, Omni Soul, Spirit Bomb.
- **뉴스 기사** "ARAM: Mayhem - Tier List, Augments, Overview, Patch 26.8" (https://u.gg/lol/news/aram-mayhem-tier-list): 모드 개요 + 등급별 S티어 증강 추천:
  - Prismatic: Scopiest Weapons, Biggest Snowball Ever, Ultimate Revolution, Ultimate Awakening, Jeweled Gauntlet, Infernal Conduit, Goliath, Fey Magic
  - Gold: Apex Inventor, Firebrand, Flashy, Soul Siphon, From Beginning to End
  - Silver: Buff Buddies, Scoped Weapon, Tank It Or Leave It, Witchful Thinking, Blunt Force
  - 기사 내 시너지 언급: DoT 챔피언(Brand, Lillia, Cassiopeia)+Infernal Conduit, 원거리 챔피언+Scopiest Weapons("Senna나 Caitlyn이 어그로 없이 포탑을 침") (검색 스니펫 종합)

### 1-3. op.gg (https://op.gg/lol/modes/aram-mayhem)
- 모드별 페이지(랭크/아람/아레나/모드 전환 탭) 안에 ARAM: Mayhem 챔피언 티어리스트 + 증강 가이드.
- 170+ 챔피언 목록·티어 분류, 챔피언별 빌드 추천, 지역별 데이터.
- 증강 섹션: 증강별로 "최적 챔피언" 제시 — 예: Transmute: Prismatic("랜덤 프리즈매틱 증강 획득") → Jhin, Brand, Karthus / Phenomenal Evil("적 챔피언에게 피해 시 AP 1 영구 획득") → Brand, Karthus, Aurelion Sol.
- "Augment tier overlay"(오버레이 다운로드) 제공 — 게임 중 증강 선택 화면에 티어 표시해 주는 기능으로 보임.

### 1-4. 기타 영어권 통계/티어 사이트
- **blitz.gg** (https://blitz.gg/lol/aram-mayhem-augments, https://blitz.gg/lol/tierlist/aram-mayhem): 등급별(Prismatic/Gold) + S~D 레터 티어. Prismatic S: Eureka(AP의 30%만큼 스킬가속), Goliath(+35% 체력, +15% 적응형 능력치), High Roller(적 처치 시 스탯 모루 드랍 확률), Infinite Recursion(스킬가속 60+킬관여당 3), Jeweled Gauntlet(스킬 치명타). Gold S: Critical Missile, Magic Missile, Phenomenal Evil, Recursion(스킬가속 60), Scopier Weapons.
- **aramnerfs.com** (https://aramnerfs.com/mayhem/augments): 패치 26.15, S+~D 티어, 클래스/등급 필터. S+: Eureka, Jeweled Gauntlet, Tank Engine. S: Transmute: Prismatic, Infernal Conduit, Pressure Cooker. A: Symphony of War, En Passant, Surge Field. **주의 고지 명시**: "Riot restricts direct ARAM: Mayhem match data" → 크로스 모드 통계+에디터 큐레이션 기반.
- **aramgg.com** (https://aramgg.com/en): S+~C 티어, 172챔피언, **데이터 출처를 '텐센트 중국 서버 공개 통계'라고 명시**, 일일 갱신. 26.17 S+ 예시: Yasuo 56.64%, Aurelion Sol 54.45%, Teemo 53.45%, Caitlyn 52.90%, Brand 52.70%. 챔피언별 추천 증강 3개(등급 포함) 표시.
- **mobalytics.gg** (https://mobalytics.gg/lol/tier-list/mayhem): 전 증강 티어리스트, "Game Experts가 패치마다 갱신"(검색 스니펫; 직접 fetch 403).
- **metasrc.com** (https://www.metasrc.com/lol/mayhem/tier-list, /tier-list/augments): 26.17 챔피언·증강 티어리스트 존재(구조 상세 미확인).
- **aramtheory.com** (https://www.aramtheory.com/champion-tips): 챔피언별 Best Silver/Gold/Prismatic 증강 3개씩 추천하는 팁 모음(100+ 챔피언). 예: Ahri → Silver: Homeguard/Escape Plan/Hextech Soul, Gold: Tooth Fairy/Nightstalking/Phenomenal Evil, Prismatic: Eureka/Giant Slayer/Jeweled Gauntlet.

---

## 2. Reddit (r/ARAM, r/leagueoflegends) 조사 결과

- **직접 접근 실패**: reddit.com(www/old 모두)은 WebFetch 차단 + 검색 API에서 도메인 자체가 접근 불가("domains are not accessible to our user agent"). 프록시 경유도 403.
- 따라서 r/ARAM·r/leagueoflegends의 구체적 인기 글 제목/추천수/여론은 **미확인**.
- 간접 정보:
  - EloFactory 블로그가 커뮤니티에서 회자되는 "아무도 말 안 하는 부서진 시너지"를 정리 (https://elofactory.gg/en/blog/aram-mayhem-broken-champion-synergies) — 아래 3장에 반영.
  - 여러 서드파티 글이 "출시 후 가장 인기 있는 로테이션 모드 중 하나"라는 커뮤니티 반응을 전함 (동일 EloFactory 글).
  - 유튜브에는 "Instantly Melting Tanks: Dual Wield + Double Tap Xayah | ARAM Mayhem" (https://www.youtube.com/watch?v=-XPM7qjYeO0) 등 콤보 하이라이트 영상 다수.

---

## 3. 가이드류의 증강 추천 종합

### 3-1. sheepesports (https://www.sheepesports.com/us/all/articles/aram-mayhem-how-to-play-tips-augment-suggestions-and-more/en)
※ 본문 403/CAPTCHA — 검색 스니펫 기반, 준확인.
- 증강 = "개선 효과·스탯 증가·새 보조 능력"을 주는 버프, Silver→Prismatic으로 강해짐. 화면당 3개 제시+개별 리롤 → 최대 6개 중 선택.
- 추천 증강 예시:
  - **Buff Buddies**: Crest of Cinders(빨강 강화)+Crest of Insight(파랑 강화) 영구 부여
  - **Scoped Weapons**: 근접 +75 / 원거리 +50 사거리
  - **Augmented Power**: 치명타 확률 100%만큼 Critical Defend Chance(최대 50%) — 명칭·효과 스니펫 기반, 원문 재확인 필요
- 모드 차이: 룬 없음, 점멸 고정, 전용 아이템/스펠(위 0장 참조).

### 3-2. esports.net (https://www.esports.net/wiki/guides/lol-mayhem-augments-tier-list/)
- 개별 증강: Prismatic 상위 — Scopiest Weapons, Biggest Snowball Ever, Jeweled Gauntlet, Infernal Conduit, Ultimate Revolution / Gold — From Beginning to End, Soul Siphon, It's Critical, Restless Restoration, Quest: Urf's Champion / Silver — Scoped Weapon, Deft, Leg Day, Heavy Hitter, Witchful Thinking.
- **증강 "세트(Set)" 티어** (Mayhem 고유: 같은 세트 증강 2~4개 모으면 보너스):
  - S: Snowday("눈덩이는 항상 쓸 수 있어 범용 가치"), Make it Rain, Stackasaurus Rex
  - A: Firecracker, Wee Woo Wee Woo, Archmage ("챔피언과 맞아야 함")
  - B: Fully Automated, High Roller
  - C: Deathknell ("보너스는 실재하나 'die to win' 패턴")
- 챔피언 페어링: Ultimate Revolution → Amumu, Lillia, Malphite, Mordekaiser / Soul Siphon → Yasuo, Yone / Heavy Hitter → Tahm Kench, Cho'Gath, Dr. Mundo.

### 3-3. games.gg (https://games.gg/league-of-legends/guides/aram-mayhem-augment-tier-list-set-combos/)
- **Biggest Snowball Ever**: "모드 최강 단일 증강 논쟁 후보" — 눈덩이에 100 스킬가속+대미지+CC.
- **Ultimate Revolution**: 궁 사용 후 재충전 → 한 한타에 궁 2번.
- **Jeweled Gauntlet**: 스킬 치명타 — 고AP 챔피언에서 "특히 부서짐".
- Gold: From Beginning to End(Dark Harvest+First Strike 동시), Soul Siphon(치명타 시 12% 회복+치확 25%), Executioner(챔피언 처치 관여 시 스킬 쿨 초기화).
- 세트: Snowday("모드 최고 세트", 2~4피스로 스케일), Make it Rain(골드 획득 +15~50%), Stackosaurus Rex(스택 효과 +50~200% — "스택 챔피언에게 자동 승리 조건").
- 페어링: Veigar+Jeweled Gauntlet+Stackosaurus Rex(1000+ AP), Brand/Lillia+Infernal Conduit, Yasuo/Yone+Soul Siphon, Amumu/Leona+Biggest Snowball Ever.

### 3-4. aussyelo.com (https://www.aussyelo.com/blog/aram-mayhem-guide-best-augments-tier-list) — 패치 26.4 가이드
- Prismatic: Biggest Snowball Ever(눈덩이 핵폭탄化+100 스킬가속), Scopiest Weapons(근접 +250 / 원거리 +150 사거리), Ultimate Revolution, Infernal Conduit(무한 스택 화상+틱당 쿨감).
- Gold: From Beginning to End, Soul Siphon.
- 세트 9종 존재. S: Snowday(4피스 시 눈덩이 스킬가속 150), Make it Rain(골드 2배 경제), Stackasaurus Rex(최대 200% 스택 증폭) / A: Firecracker(미사일 바운스), Wee Woo Wee Woo(인챈터 강화, Sona로 "45% 추가 치유·보호막 강화"), Archmage(스킬 쿨 환급).
- 챔피언 티어: S — Veigar(Stackasaurus Rex로 "20분에 1500+ AP"), Senna(안개 스택 증폭→무한 사거리, Scopiest Weapons면 "자기 우물에서 적을 때림"), Amumu(Ultimate Revolution 더블 궁+눈덩이 이니시), Sona(Wee Woo Wee Woo). A — Brand(Infernal Conduit), Smolder(Stackasaurus Rex), Miss Fortune(Firecracker), Lux(Jeweled Gauntlet).
- 비추천: **Yuumi("죽지 않아서 증강을 못 고름")**, Udyr, Trundle.

### 3-5. EloFactory (https://elofactory.gg/en/blog/aram-mayhem-broken-champion-synergies)
- Brand+Infernal Conduit(+Ethereal Weapon으로 화상에 BotRK 온힛까지), Kassadin+Overflow+Eureka(초과 마나→AP→쿨감 무한 루프, Dashing 증강으로 대시 스킬가속 175 추가), Zac+Circle of Death(부활 풀회복=대형 AoE 폭발, Protein Shake로 증폭), Yasuo/Yone+Critical Healing(치명타 피해 12% 회복)+Soul Siphon, Gangplank+Back to Basics(기본기 강화로 술통 원콤), Archmage 세트(Brand/Kassadin/Ryze).

---

## 4. 유명 챔피언+증강(+아이템) 조합 — 30개
출처: arammayhem.com 콤보 섹션 (https://arammayhem.com/combo/) 전수 + EloFactory/Aussyelo 보강. 각 항목 "왜 강한가/재밌는가" 포함. 개별 콤보 상세 페이지 URL 패턴: arammayhem.com/combo/{champ}-{augment}/ (예: https://arammayhem.com/combo/hecarim-ethereal-weapon/, https://arammayhem.com/combo/vayne-dual-wield/)

1. **판테온 + Quest: Steel Your Heart** (+체력템): W가 추가 체력 계수를 얻음 — 약 25,000 HP 도달 시 W가 최대체력 100% 물리 피해. 체력만 쌓으면 원버튼 처형.
2. **우디르 + Ethereal Weapon**: 각성 R이 최대체력 비례 마법 피해 — AP 스택 후 %피해로 녹임.
3. **우디르 + Scopiest Weapons**: 각성 Q 강화 평타가 최대체력 비례 물리 피해 — 즉시 삭제 상한이 AP보다 높지만 짧은 사거리가 약점.
4. **오로라 + Ethereal Weapon** (+AP/마관): 패시브 3링이 최대체력 % 마법 피해 — 800 AP에서 20%+ 최대체력. Ethereal Weapon 다중 프록으로 탱커도 못 버티는 폭딜.
5. **루시안 + Jeweled Gauntlet** (+무한의 대검, Vulnerable): 궁이 치명타 — Vulnerable+IE 곱연산으로 "풀궁이 화면을 청소".
6. **브랜드 + Infernal Conduit**: 화상 틱마다 쿨감 — 5v5 Mayhem에서 다수 화상 = 사실상 무한 캐스팅.
7. **요네 + Mystic Punch** (+몰락): 평타 온힛마다 모든 쿨 1.25초 감소. Q가 평타 판정이라 1.33초 Q쿨 = 무한 Q. 몰락으로 보호막 상시 유지.
8. **바루스 + Ethereal Weapon** (+마관, 내셔): W 패시브 3중첩이 최대체력 비례 마법 피해 — 약 600 AP에서 3스택 = 체력 100% 마법 피해.
9. **헤카림 + Ethereal Weapon (+Mystic Punch)**: 스킬이 온힛을 발동→온힛이 쿨 환급 — 무한 스킬 사이클. "조립은 어렵지만 완성되면 게임 끝".
10. **피오라 + Quest: Steel Your Heart** (+하트스틸, Tank Engine, Overlord's Bloodmail): 무한 체력 스택→체력을 AD로 변환, 약 2500 AD에서 급소 1회 = 최대체력 100% 고정 피해.
11. **피오라 + Mystic Punch** (+Slow and Steady): Q 쿨 삭제로 무한 기동 + E 상시 유지, 변환된 AD를 전부 활용.
12. **마스터 이 + Mystic Punch** (+정수 약탈자): 스킬가속 190+ 임계 도달 시 Q 사실상 무쿨 — 무한 알파(비표적화+모든 공격 회피).
13. **질리언 + Mind to Matter (Archmage 세트)**: Q가 W쿨을, W가 Q쿨을 서로 감소 — 스킬가속 110에서 무한 QW 폭탄 체인 CC.
14. **베인 + Fan The Hammer** (+Dual Wield, Tap Dancer, 루난): 평타 1회에 온힛 5회+3링 프록 2회 — 평타 한 방에 은화살 다중 프록으로 체력 대부분 삭제. (동류: Xayah+Dual Wield+Double Tap 유튜브 영상, https://www.youtube.com/watch?v=-XPM7qjYeO0)
15. **제이스 + Slow And Steady**: 공속→AD 변환 증강. 망치 W의 2.5 공속이 전부 AD로 — "1레벨에 집으면 3분 카운트다운 뒤 사람이 지워짐".
16. **갈리오 + Soul Eater**: W가 물리+마법 피해 모두 감소 — AP/MR/HP 스택 시 감쇄 100% 도달, 도발 후 사실상 무적.
17. **잭스 + Mystic Punch** (+Dusk and Dawn): 쿨 삭제로 E(반격) 상시 유지 — 영구 회피 탱커.
18. **갱플랭크 + Back To Basics**: 기본 스킬 대폭 강화로 술통 원샷 — 술통 자체가 방어구 관통 40% 내장이라 탱커도 아픔.
19. **블라디미르 + Infernal Conduit** (+잃어버린 양피지 계열): 쿨 환급으로 스킬가속 160+에서 W(피의 웅덩이)가 2인 이상 적중 시 끊김 없이 재사용 — 무한 W.
20. **야스오 + Mystic Punch** (+몰락): Q=평타 판정, 1.33초 쿨에서 무한 Q + 몰락 보호막 유지. (야스오는 arammayhem 전체 승률 1위 56.64%, https://arammayhem.com/)
21. **라이즈 + ADAPt** (+눈물 계열): AP-마나 교차 스케일로 마나/HP/AD 변환 루프 — 무한 스탯 성장 시뮬레이터(사이트에 전용 Ryze 시뮬레이터 존재).
22. **블리츠크랭크 + Ethereal Weapon** (+Dusk and Dawn, Twin Flames): R 패시브 번개가 온힛 프록→온힛이 다시 패시브 프록 — 무한 연쇄 번개+에어본 루프.
23. **트린다미어 + Circle of Death** (+AP/마관): 회복량을 마법 피해로 변환 — Q의 큰 AP 계수로 후반 Q 3000+ 딜, 누르면 주변 스쿼시 삭제.
24. **미스 포츈 + Mind to Matter**: W·E 짧은 쿨을 서로 환급 — 스킬가속 200+에서 전 화면 탄막.
25. **피들스틱 + ADAPt**: Q가 최대체력 % 마법 피해(공포 대상 2배) — 1467 AP에서 공포+Q = 체력 100%. 부쉬 플레이와 결합.
26. **나르 + Fan The Hammer** (+Dual Wield, Tap Dancer, 루난): 미니 나르 W(100% AP 계수+14% 최대체력 피해)를 평타당 온힛 5회로 다중 프록 — 평타 한 방 삭제.
27. **그라가스 + ADAPt**: W의 AP 비례 피해 감소+채널 후 2.5초 무적 — 2050 AP에서 감쇄 100%.
28. **모데카이저 + Circle of Death** (+마관, Executioner, Protein Shake): 회복의 70%를 피해로 — W 보호막→회복 스케일로 풀회복 한 번에 스쿼시 삭제. W가 준 피해만큼 회색 체력을 얻어 Executioner와 함께 W 무한 스팸. 옴니뱀프 아이템은 CoD 판정을 덮어써서 금지.
29. **아우렐리온 솔 + Shrink Engine**: 패시브 스택이 E 처형선을 올림 — 3653스택에서 체력 100% 처형. 극후반 스케일링 로망 콤보.
30. **렐 + Cruelty + Tank Engine**: "렐의 hex 풀이 유난히 깔끔" — 극한 CC+지속딜로 1v5 플레이. (EloFactory/arammayhem 공통 언급)

### 보너스(가이드발 페어링, 4장과 중복 없는 것)
- **베이가 + Stackasaurus Rex(세트) + Jeweled Gauntlet**: 스택 증폭으로 20분 1500+ AP, 스킬 치명타로 W 원콤. (aussyelo, games.gg)
- **세나 + Stackasaurus Rex + Scopiest Weapons**: 안개 스택 증폭→사거리 무한 증가, "우물에서 저격". (aussyelo)
- **아무무 + Ultimate Revolution + Biggest Snowball Ever**: 한타당 궁 2번+눈덩이 핵. (aussyelo, games.gg)
- **카사딘 + Overflow + Eureka (+Dashing)**: 마나→AP→쿨감 무한 루프, 리프트워크 스팸. (EloFactory)
- **자크 + Circle of Death (+Protein Shake)**: 부활 풀회복 = 광역 폭발. (EloFactory)
- **소나 + Wee Woo Wee Woo 세트**: 치유·보호막 45% 증폭 인챈터 캐리. (aussyelo)

---

## 5. 미확인 / 한계

- Reddit r/ARAM, r/leagueoflegends의 실제 인기 글(제목·추천수·댓글 여론)은 크롤러 차단으로 직접 확인 불가.
- sheepesports 본문(403/CAPTCHA) — 증강 추천은 검색 스니펫 기반이라 일부 명칭/효과(예: Augmented Power) 원문 대조 필요.
- 증강 선택 시점(레벨 1 포함 여부, 총 4개 vs 4~5개) 소스 간 상충.
- arammayhem.com의 개별 수치는 요약 추출 과정의 오차 가능성(특히 /augments/ 목록의 승률 표) — 사이트 직접 확인 권장.
- "hex"(Tank Engine, Dual Wield 등)가 증강의 별칭인지 별도 시스템(전용 아이템?)인지 명확한 정의 소스를 찾지 못함.
- Riot이 Mayhem 매치 데이터를 API로 제한한다는 aramnerfs 고지 ↔ aramgg는 "텐센트 중국 통계" 사용 — 각 사이트 데이터 출처 신뢰도는 상이함.
