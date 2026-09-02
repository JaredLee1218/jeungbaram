# 역할군별 가중치의 공식·준공식 증언 수집 — "왜 원딜에겐 원딜용 증강이 나오는가"

- 조사일: 2026-09-02 (라이브 패치 26.17)
- 대상 모드: 칼바람 아수라장 / ARAM: Mayhem (증바람)
- 선행 스터디: `D:/증바람/research/raw/03-champion-augment-pools.md` — 챔피언별 필터링 공식 확인, Optimal/Viable/Average/Invalid 4단계 존재, 명문화 제한 목록은 그쪽 참조. **본 문서는 그 반복 없이 "누가, 어디서, 정확히 뭐라고 말했는가"와 새로 발굴한 증거만 다룬다.**
- 표기 원칙: WebFetch는 요약 모델을 경유하므로, 요약 경유 인용은 "(요약 경유)"로 표시. 원문(raw wikitext/공식 페이지) 직접 확인분은 별도 표시 없음. 확인 불가는 "미확인".

---

## 0. 새로 확인된 핵심 사실 (03 파일에 없던 것)

1. **4단계 분류(Optimal/Viable/Average/Invalid)의 원출처가 특정됨**: 2026-08 게임스컴 데브(Gamescom Dev 2026) 공개 강연 — Riot 시니어 게임 디자이너 **Noor Amin**, 세션명 "**Bringing Mayhem to ARAM: Effective R&D Processes for Game Modes**". 인벤(한국어)과 Inven Global(영어)이 강연 취재기를 보도. 즉 "개발자 인터뷰"가 아니라 **공개 컨퍼런스 강연**이며, 라이엇이 대외적으로 발표한 준공식 정보다.
2. **분류 단위는 챔피언이 아니라 '클래스'**: 인벤 원문 "**각 클래스의 전체 증강 풀을 네 개의 하위 카테고리로 나눴다**" / Inven Global "The team divided **each class's full Augment pool** into these four subcategories". 강연에서 언급된 클래스 구분: **인챈터 / 마크스맨(원거리 물리) / 메이지 / 탱커** (+ 공식 패치노트가 별도로 "fighters" 버킷을 사용). → 유저 관찰(Q1)의 메커니즘은 "클래스별 풀 + 클래스별 빈도 등급"으로 공식 설명됨.
3. **등장 빈도의 정성적 서술은 있으나 수치는 없음**: Optimal="드물게 등장(rare)", Viable="자주 등장하지만 최적은 아님", Average="자주 나오는 무난한 옵션", Invalid="해당 클래스 풀에서 아예 필터링". 강연·기사 어디에도 확률 수치 없음(인벤 기사 재질의로 "수치 언급 없음" 확인).
4. **서포트 전용 게이트의 공식 증거 발굴**: 공식 26.15 패치노트 버그픽스 "**Fixed a bug where Mercy Strike could be offered to non-support champions in Mayhem like Vladimir.**" — Mercy's Strike(골드, 능력 증강)는 **서포트 챔피언에게만 제시되도록 게이트**되어 있고, 그 게이트가 새던 것을 버그로 수정. 이 제한은 공식 위키 모듈에 **미기재**(2026-09-02 Lua 원문 재다운로드로 확인) → **게임 내 실제 클래스 게이트는 위키 문서화보다 많다**는 것이 확정됨.
5. **"Augment RNG system"의 존재와 튜닝을 공식 인정**: 공식 26.14 패치노트 — "**we're adjusting the Augment RNG system a bit this patch, as we've seen that recently it's been offering the same kinds of Augments too often and makes games feel more samey / low variety. We'll be tuning this over the next few patches to get it just right**". → 제시 확률이 중앙 제어되는 시스템이고 패치 단위로 계속 조정된다는 공식 확인.
6. **공식 26.12 패치노트의 명문**: "**You'll only ever receive Ability Augments that are usable for your champion.**" (요약 경유) + 같은 패치노트에서 신규 증강 방향으로 "**This time around, we're giving extra attention to fighters and tanks.**" (요약 경유) → 클래스 버킷("파이터와 탱커용 증강")이 콘텐츠 설계 단위임을 공식 문서가 직접 사용.
7. **패치노트 전수 조사(26.01~26.17)로 eligibility 변경 이력 확정** — §5의 표. 특히 03 파일에서 "⚠️ 미검증"이던 **Vampirism↔Perseverance 상호배제가 V26.06에서 추가된 것**을 위키 패치 히스토리 원문에서 확인(검증 완료로 승격). [독립 재검증 2026-09-02: raw wikitext 재다운로드 결과 해당 두 줄("Now prevents the user from being offered the ''Vampirism/Perseverance'' augment")은 **V26.06 섹션** 소속 — 초안의 "V26.03 2/5 핫픽스" 기재는 오류라 정정함.] 또 03 파일 보충: Earthwake(2명)/Orbital Laser(1명)/Trueshot Prodigy(1명) 팀 제한은 **V25.24 추가 시점부터 달려 있던 조건**이고, Poro Blaster 팀당 1명은 26.03 핫픽스에서 소급 추가.
8. **챔피언 단위 명시 제외의 패치노트 선례**: V26.01 1월 9일 핫픽스 "**Executioner — Gangplank can no longer receive this augment due to an unintended interaction.**" (위키 패치 히스토리 원문) — Mayhem에서 특정 챔피언 1명을 콕 집어 풀에서 뺀 최초의 문서화 사례.
9. **Reddit의 라이엇 공식 코멘트는 확보 실패**: reddit.com이 검색 크롤러에서 차단되어 있고(도메인 접근 불가 오류 확인), 미러(redlib 3개 인스턴스)도 봇 차단. r/ARAM 실측 글 직접 인용 불가 — **미확인**으로 남김. 대신 라이엇의 준공식 채널은 X/Threads(ed_corte, 공식 계정)와 /dev 블로그였음을 확인.

---

## 1. Q1 답변 종합 — "원딜에겐 원딜용 증강" 편향의 공식 설명 구조

유저의 실제 플레이 관찰은 다음 4개 층위의 공식 확인된 메커니즘으로 설명된다:

| 층위 | 메커니즘 | 근거(출처) |
|---|---|---|
| 1. 클래스 풀 | 클래스(인챈터/마크스맨/메이지/탱커…)별로 전체 증강 풀을 Optimal(드묾)/Viable(자주)/Average(자주·무난)/Invalid(완전 제외)로 나눠 제시 빈도를 차등 | 게임스컴 데브 2026 강연(Noor Amin) — 인벤 https://www.inven.co.kr/webzine/news/?news=319873 , Inven Global https://www.invenglobal.com/articles/25082/lol-aram-mayhem-reveals-the-secrets-of-augment-development |
| 2. 개별 게이트 | 일부 증강은 클래스/챔피언/조건 게이트 명시(서포트 전용 Mercy's Strike, 원거리 전용 Draw Your Sword, 갱플랭크 제외 Executioner 등) | 공식 26.15 패치노트, 위키 모듈, 위키 패치 히스토리(§5) |
| 3. 스킬 증강 필터 | 능력 증강은 챔피언 킷에서 실제 작동하는 스킬에만 — "usable for your champion" | 공식 26.12 패치노트, IBTimes(draw pool 필터링), 26.12 핫픽스 450+ 제거 |
| 4. RNG 가중치 튜닝 | 제시 확률 자체가 "Augment RNG system"으로 중앙 제어되며 패치마다 조정(+ 진행 트랙 L9의 능력 증강 확률 증가 — 03 파일 참조) | 공식 26.14 패치노트 |

- 결론: **"원딜용/법사용/탱커용이 잘 나온다"는 관찰은 공식 시스템 구조와 정확히 일치**한다. 다만 "탱커에게 AD 증강이 0% 나온다" 같은 완전 배제는 Invalid로 분류된 조합에만 해당하고, Viable/Average로 분류된 범용 증강은 누구에게나 나온다(빈도만 다름).
- 클래스 목록의 전모(내부적으로 몇 개 클래스로 나누는지, 챔피언→클래스 매핑)는 **비공개 — 미확인**.

## 2. Q2 관련 — 이번 조사에서 걸린 능력 증강 등급 단서 (상세는 능력 증강 스터디 담당)

- 능력 증강은 전용 티어가 아니라 **실버~프리즘 전 등급에 분포**: Mercy's Strike가 "Upgrades one of your champion's abilities…" 계열의 **골드**임을 위키 모듈 원문으로 확인(https://wiki.leagueoflegends.com/en-us/Module:MayhemAugmentData/data). Siphon(실버)/Chain Reaction·Bread And Butter(골드)/Spell Split·Tripleshot·Echo Cast(프리즘)는 03 파일 §1 참조.
- 공식 26.13 패치노트: "**we resolved a bug that significantly reduced the chance of Ability Augments appearing in the third and fourth Augment slots.**" — **선택 라운드(슬롯)별로 능력 증강 등장 확률이 별도로 관리**된다는 간접 증거. (진행 트랙 L9 "능력 증강 확률 증가"와 같은 축.)

---

## 3. (조사항목 1) 4단계 분류 발언의 전문 인용

### 3-1. 영어 (Inven Global, 2026-08-24 게재)
출처: https://www.invenglobal.com/articles/25082/lol-aram-mayhem-reveals-the-secrets-of-augment-development (요약 경유)

> "'Optimal' Augments are rare options that create thrilling power moments; 'Viable' Augments appear often but aren't optimal; 'Average' Augments are frequently offered, solid options; and 'Invalid' Augments are unusable options filtered out completely from specific champion class pools."

> "The team divided each class's full Augment pool into these four subcategories as part of their design philosophy. The team identified which classes lacked or overflowed in the Optimal category and produced content to reinforce outlier classes."

> "Amin categorized champion roles into Enchanters, auto-attack-focused ranged physical Marksmen, skill-based magic Mages, and Tanks"

> "For instance, they adjusted Enchanters (roles supporting allies with heals, shields, and buffs) so they didn't feel unfun or, conversely, hit huge spikes too frequently."

> "To achieve this, they built a 1D array categorizing the number of available Augments per champion and crafted dedicated Augments for underserved classes." / "The Augment pool grew from 196 at release to slightly over 300 today."

### 3-2. 한국어 원문 (인벤, 2026-08-25)
출처: https://www.inven.co.kr/webzine/news/?news=319873 — "LoL '아수라장', 증강 개발의 비밀을 밝히다" (요약 경유)

> "'최적' 증강은 드물게 등장하지만 짜릿한 역할을 순간을 만들어내는 옵션이고, '쓸만한' 증강은 자주 등장하지만 최적은 아닌 옵션, '평범한' 증강은 자주 나오는 무난한 옵션, '무효' 증강은 특정 챔피언 클래스 풀에서 아예 필터링되는 사용 불가 옵션입니다."

> "챔피언별로 사용 가능한 증강 개수를 분류한 1차원 배열을 만들고, 소외된 클래스를 위한 증강을 별도로 제작했다 … 각 클래스의 전체 증강 풀을 네 개의 하위 카테고리로 나눴다."

> "팀은 어떤 클래스가 최적 카테고리에서 부족하거나 과도한지 파악해 이상치 클래스를 보강하는 콘텐츠를 제작했다. 예컨대 인챈터가 재미를 느끼지 못하거나 반대로 대박을 너무 자주 터뜨리지 않도록 조정하는 식이었다."

- 기사 성격: **게임스컴 2026 강연 취재기**(대면 인터뷰 아님). 등장 확률·가중치 **수치 언급 없음**(재질의로 확인).
- 강연 세션 확인: WN Hub "The initial speakers and sessions for Gamescom Dev 2026" — Noor Amin, "Bringing Mayhem to ARAM: Effective R&D Processes for Game Modes" — https://wnhub.io/news/other/item-50660 (동일 내용: https://mundogamer.community/en/articles/gamescom-dev-2026-reveals-first-speakers-and-sessions )
- 분류 "기준"에 대한 언급: 강연 보도 기준으로는 파워 순간(power moment) 창출 여부·무난함·사용 불가 여부라는 **디자인 판정**이며, 알고리즘 기준(승률 데이터 등)인지는 **미확인**.

### 3-3. /dev 블로그의 클래스 밸런싱 발언 (Riot Phlox, 2026-05-27)
출처: https://www.leagueoflegends.com/en-us/news/dev/dev-augmentmaxxing-aram-mayhem/

> "if we find that melee champs are hard to find success with because enemies are too fast, we'll take a look at the amount of movespeed being offered by Augments"

> "Another tool at our disposal is adding new Augments, that way we can support classes of champions that feel underserved by the current Augment offering."

---

## 4. (조사항목 2) 라이엇 개발자 계정의 SNS/Reddit 발언 수집

| 채널 | 발언자 | 내용 | 상태 |
|---|---|---|---|
| X https://x.com/ed_corte/status/2067698024776867879 | Eduardo "Riot Cadmus" Cortejoso | 26.12 핫픽스(450+ 능력 증강 조합 제거) 발표. 검색 스니펫상 서두: "We recently updated in ARAM: Mayhem to adjust some of …" | 전문 미확인(X 402 차단) |
| Threads https://www.threads.com/@leagueoflegends/post/DZvB_H4iAKW | LoL 공식 계정 | 동일 핫픽스 공지 | 전문 미확인 |
| esports.gg 보도 https://esports.gg/news/league-of-legends/riot-removes-450-ability-augments/ | Riot Cadmus 인용 | "We've got hotfixes live for ARAM: Mayhem to remove over 450 Ability Augments that weren't living up to the high-roll, high-fun promise of the mode." / "We think Ability Augments show a lot of promise" (요약 경유, 직접 fetch 403) | 간접 확보 |
| X 피드백 (esports.gg 보도 경유) | Riot Phlox 앞으로의 유저 피드백 | 유저들이 "some of the new augments end up being offered on spells that don't feel useful and feel like they're gumming up the pool"이라고 지적 → 450+ 제거로 이어짐 (요약 경유) | 간접 확보 |
| Reddit | — | **라이엇 계정의 augment pool/weighting 관련 Reddit 코멘트는 확보 실패.** reddit.com이 검색 도구에서 도메인 차단("The following domains are not accessible to our user agent: ['reddit.com']"), reddit JSON API·old.reddit·redlib 미러 3종 모두 봇 차단 확인 | **미확인** (존재 여부 자체를 판단할 수 없음) |

- 관찰: 아수라장 증강 시스템 관련 라이엇의 대외 발신은 /dev 블로그 → 패치노트 → X/Threads 순으로 이뤄졌고, 이번 조사 범위에서 Reddit AMA/코멘트 형태의 발신은 2차 보도에서도 발견되지 않았다(부재 증명은 아님).

---

## 5. (조사항목 5) 패치노트 eligibility 변경 전수 수집 (26.01~26.17 + 전사)

위키 패치 히스토리 원문(https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Patch_history — raw wikitext 직접 다운로드, 59KB)은 **V26.12에서 갱신 중단(Outdated 태그)**. 26.13 이후는 공식 패치노트로 보완.

| 버전 | eligibility 관련 변경 | 출처·확인 방식 |
|---|---|---|
| V25.23 (전사) | "Silver-tier augments will now appear less frequently in the first round" + 1·2라운드 실버 중복 금지 도입 | 위키 원문 |
| V25.24 (전사) | Earthwake(팀당 2명)/Orbital Laser(팀당 1명)/Trueshot Prodigy(팀당 1명) — **신규 추가 시점부터 팀 제한 부착** | 위키 원문 (03 파일의 서술 보강: 소급 제한이 아님) |
| V26.01 (1/9 핫픽스) | "Executioner — **Gangplank** can no longer receive this augment due to an unintended interaction." / Flashy 일시 비활성 / 동일 증강 중복 획득 버그 수정 | 위키 원문 |
| V26.03 (2/5 핫픽스) | "Poro Blaster — Now is limited to 1 player per team." | 위키 원문 (독립 재검증 2026-09-02: raw wikitext V26.03 2/5 핫픽스 섹션에서 확인) |
| V26.06 | "Perseverance — Now prevents the user from being offered the ''Vampirism'' augment." / "Vampirism — Now prevents the user from being offered the ''Perseverance'' augment." (**상호배제 추가 시점 확정 = V26.06** — 03 파일의 ⚠️ 미검증 항목 검증 완료. 초안은 V26.03 2/5 핫픽스로 오기재 → 독립 재검증에서 정정) | 위키 원문 (raw wikitext 섹션 대조, 2026-09-02) |
| V26.04~V26.05, V26.07~V26.11 | eligibility 변경 **없음** (V26.05에 관련 변경 1건: Consonance/Starlit Grace가 ''Vampirism'' 보유 아군을 타겟팅하지 않게 변경 — 제시(offer) eligibility가 아니라 효과 타겟팅이므로 제외) | 위키 원문 |
| V26.12 | 특성 제거 + 능력·퀘스트 증강 추가. 공식 패치노트: "**You'll only ever receive Ability Augments that are usable for your champion.**" / "This time around, we're giving extra attention to **fighters and tanks**." | 공식 https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-12-notes/ (요약 경유) |
| 26.12 라이브 핫픽스 (6/19) | 450+ 챔피언별 능력 증강 조합 제거("dead draws"), Quest: Support Main·Void Dash·Pat On The Back 일시 비활성 | X/Threads(§4), IBTimes https://www.ibtimes.com/league-legends-aram-mayhem-cuts-over-450-ability-augments-live-hotfix-3804331 , arammayhem.com |
| V26.13 | "In our recent hotfixes, we have meaningfully improved how Ability Augments are offered to champions. **These augments are now offered on spells that champions benefit from.** We also fixed issues where certain spells could incorrectly receive augments that didn't work on them." / 크리티컬 계열(Jeweled Gauntlet, It's Critical) 등장 빈도 버그 수정 / "resolved a bug that significantly reduced the chance of Ability Augments appearing in the **third and fourth Augment slots**" | 공식 https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-13-notes/ (요약 경유) |
| V26.14 | "Fixed a bug where **Smolder** could be offered Combusting Interest." / "Fixed a bug where Pursuit of Haste was offered to **Yasuo E**." / "**we're adjusting the Augment RNG system** a bit this patch, as we've seen that recently it's been offering the same kinds of Augments too often and makes games feel more samey / low variety. We'll be tuning this over the next few patches" / Twin Fire 비활성 | 공식 https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-14-notes/ (요약 경유) |
| V26.15 | "Fixed a bug where Overloaded could be offered to **Katarina's (E) and Shaco's (E)**." / "Fixed a bug where Pursuit of Haste and Pursuit of Power is offered to **Akshan's (E)**." / "Fixed a bug where Pursuit of Power is offered to **Akshan's (E), Draven's (Q), Illaoi's (E), and Malphite's (W)**." / "Fixed a bug where Warding Weapon could still be offered to Akshan's (E) in Mayhem." / "Fixed a bug where Trusty Weapon could still be offered to Akshan's (E) in Mayhem." / "**Fixed a bug where Mercy Strike could be offered to non-support champions in Mayhem like Vladimir.**" / "Pat on the Back — Can now be taken by multiple players on the same team" (팀 제한 해제) | 공식 https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-15-notes/ (요약 경유) |
| V26.16 | eligibility 변경 **없음** (신규 파이터용 골드 증강 2종 추가: Upgrade Sundered Sky, Upgrade Ravenous Hydra) | 공식 https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-16-notes/ (요약 경유) |
| V26.17 | eligibility 변경 없음. 클래스 버킷 커멘터리: "we're taking a look at some **high-frustration ADC Augments** … We're tuning them down to give opponents more room to react" / "we're continuing to focus on the **fighter experience**" / Double Tap 골드→프리즘 티어 이동(풀 구성 변화). ※ arammayhem.com은 Vampirism이 26.17에서 제거됐다고 표기 — 공식 패치노트에서는 미발견(**미확인**) | 공식 https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-17-notes/ (요약 경유), https://arammayhem.com/patch-notes/ |

**26.15 버그픽스 목록의 함의 (Q1 관련 최중요):**
- 능력 증강의 게이트는 "챔피언 단위"가 아니라 **스킬 단위**(Akshan E, Draven Q, Illaoi E, Malphite W…)로 관리된다.
- **클래스 게이트(서포트 전용 Mercy's Strike)가 실제 코드에 존재**하며, 새는 경우 버그로 취급되어 수정된다. 유저가 "역할에 안 맞는 증강을 봤다"는 반례 경험의 상당수는 **실존했던 게이트 누수 버그**로 설명 가능(26.13~26.15에 걸쳐 순차 수정).

---

## 6. (조사항목 3) 커뮤니티 실측 관찰 — 컨센서스와 반례

### 6-1. 접근 제약 고지
r/ARAM 등 Reddit 원글은 이번 조사 환경에서 **직접 접근 불가**(검색엔진 도메인 차단 + reddit JSON/old.reddit/redlib 미러 봇 차단 — 2026-09-02 실측). 아르카라이브도 403. 이하는 접근 가능한 커뮤니티·통계 사이트 기반.

### 6-2. 실측 통계가 보여주는 편향 (arammayhem.com, 패치 26.17 집계)
- **Mercy's Strike** (https://arammayhem.com/augments/mercys-strike/ ): 픽률 2.31%, 승률 48.82%. 통계에 잡힌 상위 챔피언 전원이 서포트/인챈터 계열 — Senna, Sona, Soraka, Karma, Renata Glasc, Nami (추천란: Bard, Ivern, Lulu, Janna 등). **26.15 서포트 게이트와 정합.**
- **Dual Wield** (https://arammayhem.com/augments/dual-wield/ ): 픽률 28.04%, 승률 56.46%. 상위 21챔피언 전원 평타 중심(Jinx, Tristana, Kalista, Yunara, Kindred, Aphelios, Sivir, Twitch, Vayne, Caitlyn, Senna, Akshan, Lucian, Master Yi, Kayle, Teemo, Quinn, Xin Zhao, Tryndamere, Ezreal, Thresh) — **메이지/인챈터 0명**.
- **Mind to Matter**: 통계에 마나 챔피언만 등장(03 파일 §3-1에서 기확인).
- ⚠️ 방법론 한계: 이 통계는 "제시된" 증강이 아니라 "선택된" 증강 기준이며 상위 N명만 노출 → **제시 편향과 선택 편향을 분리할 수 없음**. 완전 제외(Invalid)의 직접 증명은 아니고 정황 증거.

### 6-3. 커뮤니티 → 개발자 피드백 루프 (영어권)
- 26.12 직후 유저들이 Riot Phlox의 X로 "쓸모없는 스킬에 증강이 붙어 풀을 오염시킨다(gumming up the pool)"고 피드백 → 6/19 450+ 제거 핫픽스로 이어짐 — esports.gg https://esports.gg/news/league-of-legends/riot-removes-450-ability-augments/ (요약 경유). IBTimes 동일 취지 https://www.ibtimes.com/league-legends-aram-mayhem-cuts-over-450-ability-augments-live-hotfix-3804331 .
- 26.14 공식 패치노트가 "같은 종류의 증강이 너무 자주 나온다"는 체감(samey/low variety)을 언급하며 RNG 조정 — 커뮤니티 체감이 공식적으로 인정된 사례.

### 6-4. 한국 커뮤니티
- 조사 범위(DC인사이드 칼바람 갤러리 증강 팁 https://gall.dcinside.com/mgallery/board/view/?id=howlingabyss&no=392368 , 인벤 게시판 팁 글 https://www.inven.co.kr/board/lol/3369/2520743 , 블로그 가이드 https://beforeforget.co.kr/462 )에서는 **"역할군별로 다른 증강이 뜬다"는 시스템 차원의 관찰 서술을 발견하지 못함** — 대부분 "이 증강은 이 챔피언에게 좋다"는 픽 추천이며, 등장 확률·풀 구조 주장은 없음(각 글 재질의로 확인). 예외적으로 DC 글이 Draw Your Sword("검을 뽑아라")를 그레이브즈·사미라·우르곳 중심으로 서술 — 원거리 전용 게이트와 정합하는 체감.
- 나무위키 아수라장/증강 문서 계열도 아수라장용 클래스 제외 목록은 미작성(03 파일 §3-1 기확인과 동일).

### 6-5. 컨센서스 판정
- 컨센서스: "자기 챔피언/역할에 맞는 증강이 잘 나온다"는 체감은 통계 사이트·가이드의 챔피언 편중과 부합하고, 공식 시스템(§1)이 이를 설계 의도로 확인.
- 반례: "역할에 안 맞는 증강이 떴다"는 경험도 실재 — 26.13~26.15에서 수정된 **게이트 누수 버그들**(Vladimir에게 Mercy's Strike, Malphite W에 Pursuit of Power 등)이 그 실체였을 가능성이 높다. 또한 Viable/Average 등급의 범용 증강은 설계상 모든 클래스에 나온다.

---

## 7. (조사항목 4) 아레나 시절 클래스별 제외 목록의 Mayhem 적용 여부

**판정: "목록 자체의 재사용" 증거 없음. "개념(eligibility 시스템)의 계승·확장"만 확인. 부분적 반증 존재.**

| 논점 | 증거 | 방향 |
|---|---|---|
| 아레나 예외 표(AD 72명 제외 등)가 Mayhem 문서에 존재하는가 | Mayhem 위키(본문·모듈 Lua 원문 2026-09-02 재다운로드)에 클래스별 제외 표 없음. 명문화 제한은 03 파일의 소수 목록 그대로(신규 추가 없음 확인) | 직접 증거 없음 |
| Mayhem이 자체 필터 체계를 갖는가 | devcom 강연(클래스 풀 4분류), 26.12 "usable for your champion", 26.15 서포트 게이트, IBTimes "filtered to each player's champion before entering the draw pool" | **자체 체계 확인** (아레나 목록 의존 아님) |
| 아레나식 스탯 게이트(AD/AP 증강 제외)가 Mayhem에 있는가 | Mayhem의 스탯형 증강은 적응형(adaptive)·체력%·상대% 위주 설계라 아레나의 The Brutalizer(AD 고정)류와 직접 대응이 어려움. AD 성향 증강(Dual Wield)의 실측 픽 분포는 AA 챔피언에 극단 편중(§6-2)이나 제시 제외의 증명은 아님 | **미확인** |
| 목록 재사용의 반증 | ① 아레나 예외 표는 V13.17(2023) 이후 미갱신이라고 아레나 위키가 명시 — 이후 출시 챔피언(Yunara 등) 미포함이라 그대로 재사용 불가. ② Mayhem의 게이트는 스킬 단위(Akshan E…)로 관리됨이 26.15 버그픽스로 드러남 — 아레나의 챔피언 명단 방식과 관리 단위가 다름. ③ 아레나 챔피언 전용 증강(쉬바나 등)이 Mayhem에 부재 | 재사용설에 불리 |
| 개념 계승의 정황 | Mind to Matter(아레나: 마나 없는 26명 제외 명문화)가 Mayhem 실측에서도 마나 챔피언만 등장. Draw Your Sword 원거리 전용은 아레나의 ranged 게이트와 같은 문법 | 개념 계승 |

- 종합: 아레나의 "챔피언 명단식 제외"는 Mayhem에서 **클래스 풀 등급(Invalid) + 스킬 단위 태그 필터**로 재구현된 것으로 보인다. 명단의 이식 여부는 데이터마이닝 공개본이 없어 **미확인**.

---

## 8. 미확인 / 한계

- **확률 수치**: Optimal/Viable/Average의 실제 등장 가중치 수치 — 게임스컴 강연 포함 어디에도 공개 안 됨.
- **클래스 체계 전모**: 언급된 클래스는 인챈터/마크스맨/메이지/탱커(+패치노트의 fighters, ADC 표현)뿐. 전체 분류 수·챔피언 매핑 미공개.
- **Reddit**: 라이엇 계정 코멘트·r/ARAM 실측 스레드 직접 확인 불가(접근 차단). "코멘트가 없다"가 아니라 "확인 불가".
- **ed_corte X 게시물 전문**: X 접근 402. 서두 문장만 검색 스니펫으로 확보.
- **Vampirism의 26.17 제거**: arammayhem.com 표기만 있고 공식 패치노트에서 미발견.
- **26.16 "melee-exclusive augments" 폼스왑 버그픽스**: 1차 요약에 등장했으나 재질의에서 해당 문구 미확인 — 보류(실제 확인된 것은 Glass Cannon 폼스왑 피해 비율·Scoped Weapon 사거리 버그픽스).
- 공식 패치노트 인용은 전부 WebFetch 요약 모델 경유 — 어순·조사 수준의 미세 차이 가능. 위키 인용은 raw 원문 확인분.
- devcom 강연의 녹화본/슬라이드 원본 미발견 — 인벤·Inven Global 보도 의존.

---

## 9. 출처 목록

**공식 (Riot)**
- 패치노트 26.12: https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-12-notes/
- 패치노트 26.13: https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-13-notes/
- 패치노트 26.14: https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-14-notes/
- 패치노트 26.15: https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-15-notes/
- 패치노트 26.16: https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-16-notes/
- 패치노트 26.17: https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-17-notes/
- /dev: Augmentmaxxing ARAM: Mayhem (Riot Phlox): https://www.leagueoflegends.com/en-us/news/dev/dev-augmentmaxxing-aram-mayhem/
- /dev: Bringing Mayhem to ARAM (Riot Mindoori·Rioul·Wick): https://www.leagueoflegends.com/en-us/news/dev/dev-bringing-mayhem-to-aram/
- X (Riot Cadmus): https://x.com/ed_corte/status/2067698024776867879 / Threads: https://www.threads.com/@leagueoflegends/post/DZvB_H4iAKW

**공식 위키 (raw 원문 직접 확인)**
- 패치 히스토리: https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Patch_history
- 증강 데이터 모듈: https://wiki.leagueoflegends.com/en-us/Module:MayhemAugmentData/data

**강연·인터뷰 보도**
- 인벤(한국어, 게임스컴 데브 2026 강연 취재): https://www.inven.co.kr/webzine/news/?news=319873
- Inven Global(영어): https://www.invenglobal.com/articles/25082/lol-aram-mayhem-reveals-the-secrets-of-augment-development
- Gamescom Dev 2026 세션 공지: https://wnhub.io/news/other/item-50660 , https://mundogamer.community/en/articles/gamescom-dev-2026-reveals-first-speakers-and-sessions
- 게임플(라이엇 개발진 증강 칼바람 문답): https://www.gameple.co.kr/news/articleView.html?idxno=215029

**언론(핫픽스 보도)**
- esports.gg: https://esports.gg/news/league-of-legends/riot-removes-450-ability-augments/ , https://esports.gg/news/league-of-legends/league-of-legends-aram-mayhem-removes-traits-and-adds-ability-augments/
- IBTimes: https://www.ibtimes.com/league-legends-aram-mayhem-cuts-over-450-ability-augments-live-hotfix-3804331
- TechTimes: https://www.techtimes.com/articles/318717/20260619/league-legends-aram-mayhem-cuts-over-450-ability-augments-live-hotfix.htm

**커뮤니티·통계**
- arammayhem.com: https://arammayhem.com/patch-notes/ , https://arammayhem.com/augments/mercys-strike/ , https://arammayhem.com/augments/dual-wield/
- DC인사이드: https://gall.dcinside.com/mgallery/board/view/?id=howlingabyss&no=392368
- 인벤 게시판: https://www.inven.co.kr/board/lol/3369/2520743
- 기타 가이드(등장 메커니즘 서술 없음 확인용): https://elofactory.gg/en/blog/aram-mayhem-broken-champion-synergies , https://aramgg.com/en/blog/what-is-aram-mayhem-guide , https://beforeforget.co.kr/462
