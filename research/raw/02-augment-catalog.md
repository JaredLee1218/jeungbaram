# ARAM: Mayhem(무작위 총력전: 아수라장) 증강 전체 목록

- 조사일: 2026-09-02 (현재 2026 시즌 / 패치 26.x대. 위키 데이터 모듈은 2026 Pandemonium Act 2(V26.12 이후) 기준의 현재 증강 풀을 반영)
- 게임 모드 공식 명칭: **ARAM: Mayhem** / 한국 서버 명칭: **무작위 총력전: 아수라장** (출처: [op.gg 아수라장 페이지](https://op.gg/ko/lol/modes/aram-mayhem))
- 모드 출시: 2025-10-22 (V25.21, Trials of Twilight Act II와 함께). 호평으로 운영이 연장되어 2026-09 현재도 제공 중이며 26.17까지 밸런스 패치가 확인됨 (출처: [LoL Wiki - ARAM: Mayhem](https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem), [Riot 지원 페이지](https://support-leagueoflegends.riotgames.com/hc/en-us/articles/45460878435987-League-of-Legends-ARAM-Mayhem-Game-Mode), [mobalytics 패치 추적](https://mobalytics.gg/lol/guides/aram-mayhem-patch-notes))

## 1. 요약 통계 (현재 증강 풀)

| 항목 | 값 |
|---|---|
| 전체 증강 수 (위키 데이터 모듈 기준) | **225개** |
| 실버(Silver) | 64개 |
| 골드(Gold) | 85개 |
| 프리즘(Prismatic) | 76개 |
| Arena(투기장)에 동명 증강 존재(유래 추정) | 128개 |
| Mayhem 전용(Arena에 없는 이름) | 97개 |
| 현재 비활성화(currently disabled) | 11개 |
| 미출시(내부 데이터에만 존재) | 3개 |

- 주 출처: [LoL 공식 위키 ARAM: Mayhem/Augments](https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Augments) 및 그 데이터 원본 [Module:MayhemAugmentData/data](https://wiki.leagueoflegends.com/en-us/Module:MayhemAugmentData/data) (MediaWiki API로 전체 추출, 225개 전수 수록)
- 한국어 증강명 출처: [op.gg 아수라장(한국어)](https://op.gg/ko/lol/modes/aram-mayhem) 내장 데이터(139개로 기록되었으나 2026-09-02 독립 재추출 시 name/key/rarity 레코드 138개 확인 — 시점 차 또는 집계 방식 차이로 추정), [CommunityDragon 한국어 게임 스트링테이블](https://raw.communitydragon.org/latest/game/ko_kr/data/menu/en_us/lol.stringtable.json)과 [영문 스트링테이블](https://raw.communitydragon.org/latest/game/en_us/data/menu/en_us/lol.stringtable.json) 키 대조, [CommunityDragon 증강 데이터(ko_kr)](https://raw.communitydragon.org/latest/cdragon/arena/ko_kr.json)
- 효과 설명은 위키 영문 설명을 정리한 것. "(레벨 비례)"는 레벨에 따라 값이 변한다는 표기({{pp}} 템플릿), "A (근접) / B (원거리)"는 근접/원거리 챔피언별 수치. " / "는 원문 줄바꿈.

## 2. 증강 전체 목록 (225개)

**구분** 열 안내: "Arena 유래" = 동명 증강이 Arena(투기장) [증강 데이터](https://wiki.leagueoflegends.com/en-us/Module:ArenaAugmentData/data)에 존재(이름 기준 대조, 수치는 Mayhem용으로 조정된 경우 많음) / "Mayhem 전용" = Arena에 없는 이름 / "26.3 신규" = V26.03 패치 추가 / "비활성화" = 위키 기준 현재 비활성화.

### 실버 (64개)

| 이름(EN) | 이름(KR) | 구분 | 효과 |
|---|---|---|---|
| Adamant | 단호함 | Arena 유래, 비활성화 | Immobilizing or grounding an enemy champion grants 10 bonus armor and bonus magic resistance for 10 seconds, stacking up to 10 times for a total of 100 bonus resistances, and refreshing on subsequent triggers (5 second cooldown per cast instance). |
| ADAPt | 적응형 능력치 | Arena 유래 | Convert all of your bonus attack damage into ability power at a rate of 1 ability power per 0.6 bonus attack damage. Additionally, increase your ability power by 15%. |
| Adaptive Ward | 적응형 와드 | Mayhem 전용 | Upgrades one of your champion's abilities, empowering the ability to grant you 7 to 12 (레벨 비례) bonus armor or bonus magic resistance for 6 seconds when it hits an enemy champion (4 second cooldown). This effect can stack up to a number of times. / / The resistance type granted is based on the target's adaptive type: bonus armor for physical and bonus magic resistance for magic. |
| Blunt Force | 육중한 힘 | Arena 유래 | Increases attack damage by 20%. |
| Bolstered | 보강 | Mayhem 전용 | Upgrades one of your champion's abilities that has a shield effect, increasing the strength of the ability's shield by 0 to 60 for 11% (target's missing health 비례). |
| BONK! | 꽁! | Mayhem 전용 | Upgrades one of your champion's abilities that has an empowered basic attack effect, further enhancing the attack to deal 30% increased damage to the target and 30% of its damage to nearby enemies. |
| Crit 'n Cast | 치명적 가속 | 26.3 신규, Mayhem 전용 | Gain ability haste equal to 40% of your critical strike chance. |
| Deft | 능수능란 | Arena 유래 | Grants 60% bonus attack speed. |
| Dive Bomber | 폭격기 | Arena 유래 | Upon death, you explode to deal true damage equal to 20% of the target's maximum health to enemies within 500 units. |
| Don't Blink | 속전속결 | Arena 유래 | Deal 1% increased damage per 10 movement speed you have more than the target. |
| Don't Change the Channel | 채널 고정 | Mayhem 전용 | For every second that you channel an ability, you gain a 50 to 200 (레벨 비례) (+ 50% AD) (+ 25% AP) (+ 10% bonus health) shield. The shield quickly decays once you stop channeling. |
| Double Strike | 2연속 공격 | Mayhem 전용, 미출시(데이터만 존재) | Upgrades one of your champion's abilities that has an empowered basic attack effect, further enhancing the attack to apply on-hit effects to targets it hits a second time. |
| Erosion | 부식 | Arena 유래 | Each instance of damage dealt to an enemy reduces their armor and magic resistance by 1.5% for 4 seconds, stacking up to 20 times for a total of 30% resistances reduction. |
| EscAPADe | 마법사 (물리) | Arena 유래 | Convert all of your ability power into bonus attack damage at a rate of 1 bonus attack damage per 1.66 ability power. Additionally, increase your total attack damage by 15%. |
| Escape Plan | 도주 계획 | Arena 유래 | Upon dropping below 35% of your maximum health, gain a shield for 65% of your maximum health, 150% bonus movement speed, and reduced size (75 second cooldown). These effects all decay over 5.5 seconds. |
| Firefox | 불여우 | 26.3 신규, Arena 유래 | Automatically cast a modified version of Fox-Fire, gaining 25% bonus movement speed that decays over 2 seconds and conjuring 3 flames that orbit you clockwise for up to 2.5 seconds at a radius of cr 150 units. The flames will fly toward the nearest visible enemies within cr 550 units, dealing 35 to 160 (레벨 비례) (+ 25% bonus AD (+ 25% AP) adaptive damage, reduced to35*0.3 to 160*0.3 (레벨 비례) (+ 25*0.3% bonus AD (+ 25*0.3% AP)for enemies hit by subsequent flames from the same cast (7 second cooldown). |
| First-Aid Kit | 응급처치 키트 | Arena 유래 | Grants 20% heal and shield power. |
| Flash 2 | 점멸 2 | Mayhem 전용 | Replace a summoner spell with Flash. Additionally, gain 70 summoner spell haste. |
| Flashbang | 점멸탄 | Arena 유래 | Using Flash creates an explosion around the blink location that deals 70 to 240 (레벨 비례) (+ 70% AD) (+ 60% AP) magic damage to nearby enemies and slows them by 35% for 1.25 seconds. Additionally, the cooldown of your Flash resets upon your death. / / If Flash is not equipped, you will be prompted to replace one of your summoner spells with Flash. |
| Forged By The Master | 장인의 솜씨 | Mayhem 전용 | Increases the damage dealt by your item effects and augments by 45%. |
| Goredrink | 선혈포식 | Arena 유래 | Gain 15% omnivamp. |
| Guilty Pleasure | 죄책감의 쾌락 | Arena 유래 | Immobilizing or grounding an enemy champion heals you for 30 to 250 (레벨 비례) (+ 1.5% maximum health) (5 second cooldown per cast instance). |
| Heavy Hitter | 강타자 | Arena 유래 | Basic attacks deal bonus physical damage equal to 3.5% of your maximum health. |
| Hextech Soul | 마법공학의 영혼 | 26.3 신규, Arena 유래 | Grants the Hextech Dragon Soul, or a different Dragon Soul if you aleady have it. |
| Homeguard | 민병대 | Arena 유래 | Gain 100% bonus movement speed. This bonus is lost for 6 seconds after taking damage from champions. |
| Ice Cold | 차가운 냉기 | Arena 유래 | Your slowing effects reduce the movement speed of targets by an additional 75. |
| Infernal Soul | 지옥불 영혼 | Arena 유래 | Grants the Infernal Dragon Soul, or a different Dragon Soul if you aleady have it. |
| It's Go Time | 출발할 시간 | Mayhem 전용 | Upgrades one of your champion's abilities that has a duration-based effect, empowering the ability to grant 25 to 45% (레벨 비례) bonus movement speed for the effect's duration. |
| Juiced | 도취 | 26.3 신규, Arena 유래 | Basic attacks on-hit against enemy champions consume 2.5% of your maximum mana to deal bonus magic damage equal to 4.5% of your maximum mana. This damage can critically strike for 100% bonus damage. |
| Kill Secured | 확보된 킬 | 26.3 신규, Arena 유래 | Gain 60% bonus movement speed towards enemy champions below 40% of their maximum health. |
| Leg Day | 하체 운동의 날 | Arena 유래 | Gain 50 bonus movement speed and 40% slow resist. |
| Light 'em Up! | 불을 밝혀 | Arena 유래 | Basic attacks generate a stack, up to 4. The fourth stack consumes them all to quickly launch 4 missiles at the target that each deal 11 to 80 (레벨 비례) (+ 35% bonus AD) (+ 19% AP) bonus magic damage on-hit, for a total of 11*4 to 80*4 (레벨 비례) (+ 35*4% bonus AD) (+ 19*4% AP). |
| Mighty Shield | 강력한 방패 | Mayhem 전용 | Gain 40 to 100 (레벨 비례) adaptive force for 3 seconds upon gaining a shield (5 second cooldown). |
| Mind to Matter | 정신 변환 | Arena 유래 | Grants bonus health equal to 50% maximum mana. |
| Mountain Soul | 대지의 영혼 | Arena 유래 | Grants the Mountain Dragon Soul, or a different Dragon Soul if you aleady have it. |
| Ocean Soul | 바다의 영혼 | Arena 유래 | Grants the Ocean Dragon Soul, which has a modified base heal value of 100, or a different Dragon Soul if you aleady have it. |
| Poltergeist | 폴터가이스트 | Mayhem 전용 | Replace a summoner spell with Poltergeist. / / Poltergeist: (Poltergeist 주문 효과 — 위키 SpellData 문서 참조) |
| Purist - Caster | 순수주의자 - 마법사 | 26.3 신규, Arena 유래 | Convert all of your bonus attack speed into ability haste at a rate of 0.65 ability haste per 1% bonus attack speed. Additionally, your abilities' total cooldowns are reduced by 10%. |
| Scoped Weapons | 조준경 부착 | Arena 유래 | Gain 75 (근접) / 50 (원거리) bonus attack range. |
| Shadow Runner | 그림자 질주 | Arena 유래 | After dashing, blinking, or exiting stealth, gain 300 bonus movement speed for 2 seconds. |
| Siphon | 흡수 | Mayhem 전용 | Upgrades one of your champion's abilities, empowering the ability to heal you for 30% of its post-mitigation damage dealt to enemy champions. |
| Slap Around | 우당탕탕 | Arena 유래 | Immobilizing or grounding an enemy champion grants you 10 (적응형), stacking infinitely (5 second cooldown per cast instance). Lose 50% of stacks on death. |
| Snowday | 눈 오는 날 | Mayhem 전용 | Your Mark deals bonus magic damage equal to 100% of its damage and has its cooldown reduced equivalent to 100 ability haste. / / If Mark is not equipped, you will be prompted to replace one of your summoner spells with Mark. |
| Sonic Boom | 음속 폭발 | Arena 유래 | Granting a buff, heal, or shield to your ally deals 30 to 150 (레벨 비례) true damage to enemies within 450 units of them and slows targets by 30% for 2 seconds (2 second cooldown). |
| Spin Me Right Round | 빙글빙글 | 26.3 신규, Arena 유래 | Replace a summoner spell with Heroic Swing (10 second cooldown, starts post-effect). / / Heroic Swing - Active: You can activate Heroic Swing three times before the ability goes on cooldown, and you can use the third cast only after 0.5 seconds of the second cast. An attack or movement command may be inputted to use the second and third casts. / / First Cast: Fire a hook in the target direction that embeds in the first terrain hit for 2 seconds. Heroic Swing's second cast can be used while the hook is attached. If the hook fails to attach or you become immobilized, grounded, or polymorphed within the duration, Heroic Swing is cancelled and placed on full cooldown. / / Second Cast: Swing around the terrain in either a clockwise or counterclockwise direction based on the position of the cursor relative to your facing direction, stopping upon colliding with an enemy champion or terrain. While swinging, fire at the nearest visible enemy within your attack range (minimum 400 units) every 0.2 to deal them 15 to 75 (레벨 비례) (+ 15% AD) x (1 + 0.3 per 100% bonus attack speed) physical damage and apply on-hit effects for each shot, with on-hit damage reduced to 25% effectiveness. The dash will be interrupted if you are affected by any immobilizing or polymorphing crowd control during the dash. / / Third Cast: End the swing by jumping to the target location and fire one last shot at a nearby visible enemy. |
| Spin To Win | 승리를 위한 회전 | Arena 유래 | Your spinning abilities deal 30% increased damage and have their cooldown reduced equivalent to 30 ability haste. |
| Stackosaurus Rex | 다단 중첩 | Arena 유래 | Increase the number of permanent stacks you gain from abilities by 100%. |
| Stats! | 능력치! | 26.3 신규, Arena 유래 | Gain 2 Stat Anvils. |
| Stay Resolute | 확고한 의지로 | Mayhem 전용 | Upgrades one of your champion's abilities, empowering the ability to grant you 1 to 3 for 3 (레벨 비례) bonus armor or bonus magic resistance permanently when it damages an enemy champion, stacking infinitely (5 second cooldown per target per cast instance). / / The resistance type granted is based on the target's adaptive type: bonus armor for physical and bonus magic resistance for magic. / / If this is not your first augment, gain 20 bonus armor and bonus magic resistance. |
| Swift and Safe | 빠르고 안전하게 | Mayhem 전용 | After dashing or blinking, gain a shield that lasts for 2 seconds and absorbs 65 to 290 (레벨 비례) (+ 65% AD) (+ 26% AP) damage (5 second cooldown). |
| Tank It Or Leave It | 확률적 방어 | Arena 유래 | Gain Critical Defend Chance equal to 100% critical strike chance, up to 50%. Additionally, gain 25% critical strike chance. / / Critical Defend Chance: Grants you a chance to reduce an instance of damage taken by 20% (5 second cooldown per enemy spell cast instance). |
| Terror | 공포 | Mayhem 전용 | Upgrades one of your champion's abilities, empowering the ability's cast to fear all enemies within 450 units of you for 1.75 seconds (30 second cooldown). |
| Transmute: Gold | 전환: 골드 | Arena 유래 | Gain one random Gold-tier augment. |
| Trusty Weapon | 믿음직한 무기 | Mayhem 전용 | Upgrades one of your champion's abilities, empowering the ability to generate a Friendship stack for 6 seconds when it hits an enemy champion. For each Friendship stack you have, the ability deals 5% increased damage. This effect can stack up to a number of times. |
| Twin Fire | 쌍둥이 불꽃 | 26.3 신규, Arena 유래 | Damaging abilities against enemy champions launch 1 (+ 1 per 33.33% critical strike chance) missiles at the target that each deal 10 to 30 (레벨 비례) (+ 7% bonus AD) (+ 7% AP) magic damage (5 second cooldown). Additionally, gain 25% critical strike chance. |
| Typhoon | 태풍 | Arena 유래 | Basic attacks launch a missile at a nearby enemy, prioritizing champions, that deals 30% AD physical damage and applies on-hit effects. |
| Ultimate Unstoppable | 궁극의 저지 불가 | Arena 유래 | Casting your ultimate ability grants you crowd control immunity for 3 seconds (8 second cooldown). |
| Upgrade Collector | 징수의 총 업그레이드 | Arena 유래 | Upgrades The Collector, empowering Death to have its execution threshold increased by 0.5% each time you kill an enemy champion, capped at a threshold of 12.5% of the target's maximum health, and Taxes to generate a further 25 골드 (total 50 골드) from kills. Additionally, gain 250 골드. |
| Upgrade Death's Dance | 죽음의 무도 업그레이드 | Mayhem 전용 | Upgrades Death's Dance, empowering Ignore Pain with an increased damage reduction of 40% (근접) / 15% (원거리) and Defy with an increased heal AD ratio of 125% bonus AD. Defy's healing is also granted instantly upon the passive effect being triggered rather than over 2 seconds. Additionally, gain 250 골드. |
| Upgrade Immolate | 불사르기 업그레이드 | Mayhem 전용 | Upgrades Bami's Cinder, Hollow Radiance, Sunfire Aegis, and Void Immolation, empowering Immolate to additionally grant you 12 골드 per tick for each enemy champion afflicted by its effect. Additionally, gain 250 골드. |
| Upgrade Zhonya's | 존야 업그레이드 | Mayhem 전용 | Upgrades Seeker's Armguard, Wooglet's Witchcap, and Zhonya's Hourglass, empowering Stasis to cleanse you of all crowd control and allow you to move during its active effect, during which time you also gain 50% bonus movement speed. Additionally, the cooldown of Zhonya's Hourglass Stasis is reduced to 45 seconds. |
| Veil of Warding | 감시의 장막 | Arena 유래 | Grants a spell shield that blocks the next hostile ability (30 second cooldown, timer does not restart from champion damage taken). |
| Witchful Thinking | 사악한 정신 | Arena 유래 | Grants 20 to 80 (레벨 비례) ability power. |
| Zealot | 광신자 | 26.3 신규, Arena 유래 | Gain 35% (+ 5% per 100 AP) bonus attack speed and 25% (+ 5% per 100 AP) critical strike chance. |

### 골드 (85개)

| 이름(EN) | 이름(KR) | 구분 | 효과 |
|---|---|---|---|
| All For You | 너만을 위해 | Arena 유래 | Your heals and shields on allied champions are increased in effectiveness by 30%. |
| Apex Inventor | 최첨단 발명가 | Arena 유래 | Grants 100 item haste, which is equivalent to 50% cooldown reduction for items. |
| Big Brain | 전술적 대비 | Arena 유래 | Gain a shield that absorbs damage equal to 300% AP and lasts until destroyed. Shield is replenished upon respawn and every 70 seconds. |
| Bread And Butter | 빵과 버터 | Arena 유래 | Your champion's first basic ability (Q) gains 100 ability haste. |
| Bread And Cheese | 빵과 치즈 | Arena 유래 | Your champion's third basic ability (E) gains 100 ability haste. |
| Bread And Jam | 빵과 잼 | Arena 유래 | Your champion's second basic ability (W) gains 100 ability haste. |
| Celestial Body | 천상의 신체 | Arena 유래 | Gain 1500 bonus health, but reduce your damage output by 10%. |
| Chain Reaction | 연쇄 반응 | Mayhem 전용 | Upgrades one of your champion's abilities that has a knock back effect, empowering the ability to trigger a chain reaction effect when displaced champions hit other champions or terrain within 200 units. If a knocked back champion collides with another enemy champion during their displacement, the champions they collided with are dealt 100 to 400 (레벨 비례) magic damage and knocked up for 0.5 seconds. If they collide with terrain during their displacement, they will rebound to take 150 to 800 (레벨 비례) magic damage and become knocked up for 0.75 seconds and stunned for 0.5 seconds. The knock up duration is increased to up to 1.1 seconds based on how long the ability's cooldown is. / / If the upgraded ability is an ultimate, this effect deals 250% damage, increasing the champion collision damage to 100*2.5 to 400*2.5 (레벨 비례) and the terrain collision damage to 150*2.5 to 800*2.5 (레벨 비례). |
| Combusting Interest | 타오르는 이자 | Mayhem 전용 | Gain 1 to 3 (레벨 비례) (+ 0.75% of damage dealt) gold 골드 for each tick of damage dealt to enemy champions with damage over time effects. |
| Critical Healing | 치명적 치유 | Arena 유래 | Your heals and shields now have a chance equal to your critical strike chance to increase in effectiveness by 40% (5 second cooldown per cast instance). Additionally, gain 25% critical strike chance. |
| Critical Missile | 치명적 미사일 | 26.3 신규, Mayhem 전용 | Critical strikes against enemy champions launch 1 (+ 1 per 50% critical strike chance) missiles at the target that each deal 15 to 65 (레벨 비례) magic damage. Additionally, gain 25% critical strike chance. |
| Critical Rhythm | 치명적 리듬 | Arena 유래 | Your critical strikes grant you 6% bonus attack speed for 6 seconds, stacking up to 10 times for a total of 60%. Additionally, gain 25% critical strike chance. |
| Dawnbringer's Resolve | 빛의 인도자 결의 | Arena 유래 | Upon dropping below 50% maximum health, you are healed for30% of your maximum healthover 3 seconds (45 second cooldown, reset upon death). |
| Divine Intervention | 신성한 중재 | Arena 유래 | Automatically cast Cosmic Radiance, calling down a protective star upon you that descends over 2.5 seconds. Afterwards, you and all allied champions within cr 400 units become invulnerable for 2.5 seconds (35 second cooldown). |
| Donation | 후원 | 26.3 신규, Arena 유래 | Gain 1750 골드 upon acquiring this augment. |
| Endless Decimation | 끝없는 학살 | Mayhem 전용 | While in combat, automatically cast an improved version of Q, winding up over 1.25 seconds to slash in a cr 460 radius around you. The slash deals 100 to 400 (레벨 비례) (+ 60% AD) (+ 40% AP) physical damage to enemies within the area (8 second cooldown). Enemies within the cr 240 inner radius of the slash take50% damage.Additionally, for each enemy champion hit along the outer edge, you heal for 18% of your missing health and the cooldown of this effect is reduced by 10%, down to a minimum of 3 seconds. |
| Ethereal Weapon | 환영 무기 | Arena 유래 | Your abilities apply on-hit effects (1 second cooldown per target). |
| Final City Transit | 최후의 도시 대중교통 | 26.3 신규, Mayhem 전용, 비활성화 | Upon death, you summon a train over 1 second that launches towards your killer at full speed, travelling in their direction at a global distance and dealing 150 to 750 (레벨 비례) (+ 65% bonus AD) (+ 50% AP) (+ 15% maximum health) physical damage to enemies it passes through. / / The train is summoned a slight distance away from the front of your killer, based on their facing direction at the time of your death, and launches towards the position they were located at the time of your death. |
| Firebrand | 화염 낙인 | Arena 유래 | Basic attacks apply a Burn for 5 seconds that deals bonus magic damage equal to2/5% of the target's maximum health per second.This Burn stacks infinitely and refreshes with each application. |
| Flashy | 점멸 난사 | Arena 유래 | Your Flash now has 3 charges with a 2-second cooldown between casts (120 seconds recharge time for all 3 charges). / / If Flash is not equipped, you will be prompted to replace one of your summoner spells with Flash. |
| From Beginning to End | 시작부터 끝까지 | Arena 유래 | Gain the Dark Harvest and First Strike keystone runes. |
| From Downtown | 로켓 배송 | Mayhem 전용 | Quest: Hit enemy champions with abilities while located at least er 600 units away from them (at the time of the hit) 15 times (counts up to 1 hit per champion per cast instance). / / Reward: Upon completing your Quest, hitting enemy champions with abilities while located at least er 600 units away from them at the time of the hit fires a meteor to their current location, which upon landing deals 75 to 200 (레벨 비례) (+ 50% bonus AD) (+ 20% AP) magic damage to enemies within the area (8 second cooldown per target per cast instance). The meteor's damage and radius are increased based on your distance to the target at the time of the ability hit, increasing its damage by 0 to 230 for 11% (레벨 비례) and setting its radius to 150;225;337.5;506.3;759.4;1139.1;1708.6 (레벨 비례) units. / / Maximum meteor damage is 75*2.3 to 200*2.3 (레벨 비례) (+ 50*2.3% bonus AD) (+ 20*2.3% AP). |
| Get Excited | 신난다! | Arena 유래 | Scoring a champion takedown grants you 100% bonus movement speed and 15% total attack speed for 4 seconds. |
| Growth Spurt | 급속 성장 | 26.3 신규, Arena 유래 | Replace a summoner spell with Growth Spurt. / / Growth Spurt: (Growth Spurt 주문 효과 — 위키 SpellData 문서 참조) |
| Hide on Bush | Hide on bush | Mayhem 전용 | While in brush, you deal 20% increased damage. This effect lingers for 2 seconds after leaving brush. |
| Impassable | 넘을 수 없는 벽 | Arena 유래 | Gain the Aftershock and Glacial Augment keystone runes. |
| It's Critical | 치명적인 공격 | Arena 유래 | Grants 50% critical strike chance. |
| It's Killing Time | 처형 시간 | Arena 유래 | Upon casting your ultimate ability, you apply Death Mark to all enemy champions (8 second cooldown). The mark stores 40% of all post-mitigation damage you deal to the affected target, detonating after 5 seconds to deal true damage equal to the damage stored against them. |
| Lil' Extra Help | 작은 도움 | Mayhem 전용 | Upgrades one of your champion's abilities that has an effect which empowers your basic attacks for a duration, further enhancing the attacks by granting you 150 (근접) / 100 (원거리) bonus attack range and 75% (근접) / 40% (원거리) bonus attack speed while the effect is active. |
| Magic Missile | 마법 미사일 | Arena 유래 | Dealing damage to an enemy champion with an ability fires 3 missiles at them that each deal true damage equal to 0.33% of the target's maximum health, increased to up to 1% based on distance travelled (maximum damage reached at 1000 units). This effect can only trigger once every 6 seconds from the same cast. |
| Marksmage | 마법 명사수 | Arena 유래 | Basic attacks deal bonus physical damage equal to 75% AP. |
| Mercy's Strike | 자비의 일격 | Mayhem 전용 | Upgrades one of your champion's abilities, empowering the ability's cast to enhance your next basic attack. The enhanced attack has 300 bonus range, gains 75% bonus attack speed, and deals bonus magic damage equal to 3% (+ 2% per 10% heal and shield power) of the target's maximum health. If the target is a turret, the damage is modified to 2.5% of the target's maximum health bonus magic damage. |
| Minionmancer | 소환술사 | Arena 유래 | Your pets deal 40% increased damage as well as gain 40% bonus health and size. |
| Nature is Healing | 자연의 회복 | Mayhem 전용 | Upon entering a patch of brush, you are healed for40 to 300 (레벨 비례) (+ 15% of your missing health)over 1.5 seconds (20 second cooldown per brush patch). |
| Nightstalking | 밤의 추적 | Mayhem 전용 | Scoring a takedown against an enemy champion within 3 seconds of damaging them renders you invisible for 1.5 seconds, during which you also gain 40% bonus movement speed. Attacking or casting abilites ends the stealth immediately. |
| OK Boomerang | 부메랑 투척 | Arena 유래 | Automatically cast an improved version of Boomerang Blade at the closest nearby enemy champion within 1250 units, dealing 40 to 200 (레벨 비례) (+ 30% bonus AD) (+ 20% AP) adaptive damage to enemies hit (10 second cooldown). |
| Our Healing | 우리의 치유 | Mayhem 전용 | Whenever a nearby unit is healed (excluding yourself), you heal yourself equal to 15% of the amount they healed, doubled to 30% from the heals of enemies. |
| Outlaw's Grit | 무법자의 투지 | Arena 유래 | Dashing or blinking grants 12 bonus armor and bonus magic resistance for 15 seconds, stacking up to 5 times for a total of 60 bonus resistances, and refreshing on subsequent triggers. |
| Overextender | 무리한 진입 | Mayhem 전용 | Your launch with the Cannon Launcher is now empowered, increasing the launch range by 12,000 units and the impact damage by 50%, as well as the travel speed by a significant amount. Additionally, your Recall is now functional and is upgraded to Empowered Recall. / / This augment is only available on the Butcher's Bridge map. / / Total launch range is 18,500 units, reduced to 16,500 after your team's Outer turret is destroyed. Increased impact damage is 120*1.5 to 460*1.5 (레벨 비례) magic damage. |
| Overflow | 범람 | Arena 유래 | Your abilities' mana costs are doubled, but you also gain 10% (+ 0.5% per 100 maximum mana) increased damage as well as self and outgoing healing and shielding. |
| Pat On The Back | 격려하기 | Mayhem 전용 | Whenever you are within 200 units of an allied champion, they pat you on the back, granting you a 50 to 150 (레벨 비례) (+ 25% bonus movement speed) shield and 30% bonus movement speed for 3 seconds (9 second cooldown). Subsequent passes only refresh the duration of the effects. |
| Perseverance | 인내심 | Arena 유래, 비활성화 | Grants 1000% base health regeneration, increased to 2000% while below 25% maximum health. |
| Phenomenal Evil | 극악무도 | 26.3 신규, Arena 유래 | Gain Phenomenal Evil Power. / / Phenomenal Evil Power: Generate a permanent stack of Phenomenal Evil each time you damage an enemy champion with ability damage. This effect cannot trigger more than once every second globally and once every 3 seconds from the same cast instance. For each stack, gain 1 ability power. / / If this is not your first augment, start with 40 Phenomenal Evil stacks, granting you 40 ability power. |
| Pinball | 핀볼 | 26.3 신규, Arena 유래 | Your Mark is empowered to instead throw a pinball, which deals 100 to 500 (레벨 비례) bonus true damage and ricochets off of terrain that it collides with. Each time the pinball ricochets, its remaining travel distance is reset, it increases in radius by 25%, deals 20% increased damage, and reduces Mark remaining cooldown by 30%. The pinball can ricochet up to 4 times, for a maximum radius increase of 100% and a damage increase of 80%. Additionally, your Mark cooldown is reduced equivalent to 50 ability haste. / / If Mark is not equipped, you will be prompted to replace one of your summoner spells with Mark. |
| Porcupine | 고슴도치 | Mayhem 전용 | You build up a burst of needles from within you when taking damage from enemy champions, storing up to 400 to 3900 (레벨 비례) pre-mitigation damage taken. After reaching the maximum damage stored, you consume the stored damage to burst the needles outward in a 400 radius, dealing 75 to 200 (레벨 비례) (+ 125% bonus armor) (+ 125% bonus magic resistance) physical damage to enemies hit and slowing them by 30% for 2 seconds. |
| Pressure Cooker | 압력솥 | Mayhem 전용 | Surrounds you in flames, causing you to apply a Burn every second to enemy champions within 300 units for 3 seconds that deals magic damage equal to0.5% of your maximum health per second.This Burn stacks infinitely and refreshes with each application. / / Additionally, you are assigned with quests that require you to deal a certain amount of damage with the Burn effect against enemy champions. There are three quest tiers, and each completed tier grants you a reward that improves Pressure Cooker's effect. |
| Pursuit of Haste | 가속 추구 | Mayhem 전용 | Assigns quests that require you to hit enemy champions with a specific ability a number of times (counts up to 1 hit per champion per cast instance). There are two quest tiers, and each completed tier rewards you with ability haste on the ability. |
| Pursuit of Power | 위력 추구 | Mayhem 전용 | Quest: Hit an enemy champion with a specific ability 10 times (counts up to 1 hit per champion per cast instance). / / Reward: Upon completing your Quest, increase the damage of the ability by 30%. |
| Quest: Steel Your Heart | 강철 같은 심장 | Arena 유래 | Quest: Obtain Heartsteel and accumulate over 300 bonus health from Colossal Consumption. / / Reward: Upon completing your Quest, increase the bonus health gained from Heartsteel Colossal Consumption by 200%. |
| Quickstep | 날쌘걸음 | Mayhem 전용 | Upgrades one of your champion's abilities, empowering the ability's cast to cause you to dash up to 350 units towards your cursor. |
| Ravenous Bind | 굶주린 속박 | Mayhem 전용 | Upgrades one of your champion's abilities that has a immobilizing or grounding effect, empowering the ability to deal 15 to 90 (레벨 비례) (+ 10% AP) (+ 0.5% of your maximum health) magic damage to affected targets and heal you for 50 to 200 (레벨 비례) (+ 5% AP) (+ 10% bonus health). The heal is increased by up to 50% based on how long the ability's cooldown is. |
| Recursion | 되풀이 | Arena 유래 | Grants 60 ability haste. |
| Rejuvenation | 원기 회복 | Mayhem 전용 | Upgrades one of your champion's abilities, empowering the ability's cast to heal you for 30 to 100 (레벨 비례) (+ 25% bonus AD) (+ 15% AP) (+ 5% bonus health). This is increased by up to 50% based on how long the ability's cooldown is, for a maximum heal of 30*1.5 to 100*1.5 (레벨 비례) (+ 25*1.5% bonus AD) (+ 15*1.5% AP) (+ 5*1.5% bonus health). |
| Reload | 재장전 | Mayhem 전용, 미출시(데이터만 존재) | Upgrades one of your champion's abilities that has a duration-based effect, causing basic attacks on-hit during the ability to reduce its remaining cooldown by 0.15 to 0.35 (레벨 비례) seconds. |
| Scopier Weapons | 상급 조준경 부착 | Arena 유래 | Gain 200 (근접) / 100 (원거리) bonus attack range. |
| Searing Dawn | 타오르는 새벽 | Arena 유래 | Gain Sunlight. / / Sunlight: Your damaging abilities mark enemies, causing them to take 40 to 200 (레벨 비례) bonus magic damage from your ally's next basic attack or ability hit against them (0.75-second cooldown per target). |
| Shark Bait | 상어 미끼 | Mayhem 전용 | Upon taking fatal damage, you become a Shark Bait, causing you to enter a zombie state for 3.5 seconds, during which your movement speed is set to a static 400, you gain ghosting, and enemies within 400 units of you are slowed by 40%. At the end of the duration, a massive shark emerges from beneath you that lets out a powerful chomp (400 radius), dealing 120 to 350 (레벨 비례) (+ 30% of target's missing health) magic damage to all enemies within the area and knocking them up for 1 second. / / While under the zombie state, you are able to move and become invulnerable, untargetable, and immune to crowd control, but you are also rendered unable to declare basic attacks, cast abilities, use summoner spells, and activate items. |
| Shark Tempest | 상어 폭풍 | Mayhem 전용 | Your Mark is empowered to circle sharks around it in a 300 radius, dealing 50 to 100 (레벨 비례) magic damage to enemies it passes through as it travels and slowing targets hit by 30% for 1 second. If the missile hits an enemy champion, the sharks circle around their location in a 425 radius instead for 3 seconds, dealing25 to 75 (레벨 비례) (+ 20% bonus AD) (+ 12% AP) magic damage every secondto enemies within the area and slowing them by 30% for 3 seconds. / / If Mark is not equipped, you will be prompted to replace one of your summoner spells with Mark. |
| Shrink Engine | 축소 엔진 | 26.3 신규, Arena 유래 | Scoring a champion takedown generates a stack, stacking infinitely. For each stack, gain 8 ability haste and 1% bonus movement speed, and reduce your size by 4%. Lose 65% of stacks on death. / / Size reduction is capped at 80% (20 stacks). |
| Shrink Ray | 감쇠 광선 | Arena 유래 | Basic attacks on-hit reduce the target's damage dealt by 15% for 3 seconds, refreshing with each hit. Their size is also reduced significantly for the duration. |
| Skilled Sniper | 노련한 저격수 | Arena 유래 | Hitting an enemy champion with a basic ability while located at least er 600 units away from them at the time of the hit reduces its current cooldown by 80% of its total cooldown, modified to 65% for damage over time abilities. |
| Snap Back | 원상복구 | Mayhem 전용, 미출시(데이터만 존재) | Upgrades one of your champion's abilities, empowering the ability with a recast. Using the recast causes you to blink back to your original casting position of the ability and explode to deal 100 to 300 (레벨 비례) (+ 20% AD) (+ 20% AP) magic damage to nearby enemies. |
| Snowball Upgrade | 눈덩이 업그레이드 | Mayhem 전용, 비활성화 | Your Mark is empowered to hail a snowstorm at the location where the target was hit for 2 seconds, granting sight of the area and dealing200 (+ 200% bonus AD) (+ 120% AP) magic damageto enemies within over the duration, as well as slowing them by 50% (+ 6% per 100 AP). Additionally, your Mark cooldown is reduced equivalent to 50 ability haste. / / If Mark is not equipped, you will be prompted to replace one of your summoner spells with Mark. |
| Snowblast | 눈 폭발 | Mayhem 전용 | Empowers the Dash spell from Mark to deal 100% increased damage and upon arrival cause you to knock up the target for 0.5 seconds and knock back nearby enemies. Additionally, your Mark cooldown is reduced equivalent to 100 ability haste. / / If Mark is not equipped, you will be prompted to replace one of your summoner spells with Mark. |
| Sonata | 소나타 | 26.3 신규, Mayhem 전용 | Alternate between automatically casting a modified version of Aria of Perseverance and modified Song of Celerity, with the former being cast first (10 second cooldown). / / Aria of Perseverance: Heal yourself for 60 (+ 60% AP) and send out a tone to the most wounded allied champion within 1000 units that heals them for the same amount. Additionally, generate an aura that grants you and tagged allied champions a 80 (+ 40% AP) shield for 1.5 seconds. / / Song of Celerity: Gain 30% bonus movement speed for 7 seconds. If you take damage during this time, the duration ends prematurely once or if 3 seconds have elapsed. Additionally, generate an aura that grants tagged allied champions 20% bonus movement speed for 3 seconds. |
| Soul Eater | 영혼의 포식자 | 26.3 신규, Mayhem 전용 | Immobilizing or grounding an enemy champion grants you 20 bonus health, stacking infinitely (5 second cooldown per cast instance). / / If this is not your first augment, gain 300 bonus health. |
| Soul Siphon | 영혼 흡수 | Arena 유래 | Heal for 12% of the post-mitigation damage dealt by your critical strikes. Additionally, gain 25% critical strike chance. |
| Spiritual Purification | 영혼의 정화 | Mayhem 전용 | Scoring a champion takedown causes the area around the slain champion to explode in a 500 unit radius, dealing adaptive damage to enemies within equal to 15% of their current health and leaving behind a zone for 1.5 seconds that slows enemies within by 60%. |
| Stats on Stats! | 능력치 더하기 능력치! | 26.3 신규, Arena 유래 | Gain 3 Stat Anvils, with a higher chance of obtaining Gold- and Prismatic-tier anvils. |
| Tank Engine | 탱크 엔진 | Arena 유래 | Scoring a champion takedown generates a stack, stacking infinitely. For each stack, increase your maximum health and size by 5%. Lose 65% of stacks on death. |
| Terrain'd | 지형 생성됨 | Mayhem 전용 | Upgrades one of your champion's abilities that spawns terrain, empowering the ability to deal 20 to 180 (레벨 비례) (+ 20% AP) magic damage to enemies near the terrain. This damage is increasedby 200%if the ability is an ultimate. |
| Thread the Needle | 바늘에 실 끼우기 | Arena 유래 | Grants 18% armor penetration and magic penetration. |
| Tooth Fairy | 이빨 요정 | Mayhem 전용 | When you deal damage to an enemy champion equal to or more than 25% of their maximum health within 2.5 seconds, they drop a Tooth on the ground (4 second cooldown per target). You can pick up this Tooth by moving over it, granting you a Dental Records stack. For each stack, you gain 3 lethality and flat magic penetration. |
| Transmute: Prismatic | 전환: 프리즘 | Arena 유래 | Gain one random Prismatic-tier augment. |
| Upgrade Infinity Edge | 무한의 대검 업그레이드 | Mayhem 전용 | Upgrades Infinity Edge, empowering it to gain Sword of the Divine Excoriate. Additionally, gain 500 골드. / / Excoriate: Gain a random amount of bonus critical strike damage that scales up to 50% of your critical strike chance, with the value of this amount changing every 0.25 seconds. |
| Upgrade Ravenous Hydra | 굶주린 히드라 업그레이드 | Mayhem 전용 | Upgrades Ravenous Hydra, increasing its life steal stat to 20% and empowering Cleave to trigger its effect on ability hits against enemies (1 second cooldown per ability). Additionally, gain 500 골드. |
| Upgrade Sheen | 광휘의 검 업그레이드 | Mayhem 전용 | Upgrades all Spellblade items, empowering the passive effect to deal additional bonus physical damage equal to 4% of the target's maximum health and heal you for 3.5% of your maximum health. Additionally, gain 250 골드. |
| Upgrade Sundered Sky | 갈라진 하늘 업그레이드 | Mayhem 전용 | Upgrades Sundered Sky, empowering Lightshield Strike with an increased heal health ratio of 9% of your missing health and a reduced cooldown of 5 seconds. Additionally, gain 500 골드. |
| Vampirism | 흡혈병 | Mayhem 전용, 비활성화 | You can no longer be healed by allies and your health regeneration is set to 0. Gain 25% omnivamp. |
| Void Dash | 공허 돌진 | Mayhem 전용, 비활성화 | Upgrades one of your champion's abilities that has a dash, empowering the ability to spawn a void zone (250 radius) at the dash's destination after a 0.3-second delay. Enemy champions within the zone are dealt 80 to 400 (레벨 비례) (+ 100% ability haste) magic damage and are slowed by 35% for 1 second. |
| Vulnerability | 취약 | Arena 유래 | Damage dealt by items and damage over time effects can now critically strike for (145% + bonus critical damage) damage (5 second cooldown per cast instance). Additionally, gain 25% critical strike chance. / / If both Jeweled Gauntlet and Vulnerability are equipped, only rolls the critical strike chance of the augment that has the higher critical damage (or either if equal). |
| Warlock Juicebox | 마도사의 주스 상자 | Mayhem 전용 | Gain 10% (+ 3% per 100 AP) omnivamp. |
| Wee Woo Wee Woo | 삐뽀삐뽀 | Mayhem 전용 | Gain 0 to 50 for 11% (target's missing health 비례) (based on target ally's missing health) bonus movement speed while facing toward nearby allied champions, lingering for 2 seconds after no longer facing them. Your heals and shields are also increased by 0 to 50 for 11% (target's missing health 비례). |
| With Haste | 속행 | Arena 유래 | Grants bonus movement speed equal to 70% ability haste. |
| Yowch, My Coins! | 으악, 내 동전! | Mayhem 전용 | Enemy champions that you score a takedown against drop 6 to 10 (레벨 비례) coins, with each coin landing 500 units away from the location of their death and lasting 10 seconds. You or allied champions can collect the coins by moving over them, granting 15 골드 for each coin collected. |

### 프리즘 (76개)

| 이름(EN) | 이름(KR) | 구분 | 효과 |
|---|---|---|---|
| Archmage | 대마법사 | Mayhem 전용 | Whenever you cast an ability, refund the cooldown of another, randomly selected ability by 30% of the casted ability's cooldown. |
| Back to Basics | 기본으로 돌아가기 | Arena 유래 | Your champion abilities deal 35% increased damage and you gain 70 ability haste and 35% increased healing and shielding from all sources, but your ultimate ability is permanently sealed. |
| Biggest Snowball Ever | 데굴데굴 눈덩이! | Mayhem 전용 | Upgrades your Mark into a massive snowball, empowering it with an increased size radius and the ability to pass through non-champions. The snowball additionally explodes upon impact of the target hit to deal 200 to 350 (레벨 비례) (+ 100% bonus AD) (+ 60% AP) magic damage to all nearby enemies, knock them up for 0.75 seconds, and slow them by 20% for 2 seconds. Additionally, your Mark cooldown is reduced equivalent to 100 ability haste. / / If Mark is not equipped, you will be prompted to replace one of your summoner spells with Mark. Non-champions hit by the snowball are stunned for 1.25 seconds. |
| Blade Waltz | 검무 | Arena 유래 | Replace a summoner spell with Blade Waltz. / / Blade Waltz: Blink to the target enemy champion. You then blink to the nearest other enemy champion every 0.25 seconds over the next 1.75 seconds, blinking up to 7 additional times. The last blink targets the primary target. Each time you blink to an enemy, deal 30 to 150 (레벨 비례) (+ 10% bonus AD) (+ 6% AP) physical damage to them and apply on-hit effects at 50% effectiveness, up to a total of 30*6 to 150*6 (레벨 비례) (+ 10*6% bonus AD) (+ 6*6% AP) (45 second cooldown). / / While Blade Waltz is active, you are untargetable and unable to act. This effect will end prematurely if there are no longer any nearby valid targets to blink to. An enemy can be blinked to more than once if there are no other valid targets in range. |
| Can't Touch This | 난공불락 | Arena 유래 | Casting your ultimate grants you invulnerability for 2 seconds (8 second cooldown). |
| Circle of Death | 죽음의 순환 | Arena 유래 | Healing and health regeneration you do causes you to deal 70% of that value in magic damage to the nearest enemy champion within 1000 units. |
| Clown College | 광대 대학 | Arena 유래, 비활성화 | Gain Shaco Backstab, Deceive and Hallucinate explosion. Replace a summoner spell with Deceive. / / Passive - Backstab: Your basic attacks deal 20 to 35 (레벨 비례) (+ 50% bonus AD) (+ 35% AP) bonus physical damage on-hit when hitting an enemy from behind. / / Active - Deceive: Become invisible for up to 3 seconds and blink to the target location within 400 units after a 0.125-second delay. Your next basic attack while in stealth deals 100 (+ 150% bonus AD) (+ 55% AP) bonus physical damage, increased to100*1.55 (+ 150*1.55% bonus AD) (+ 55*1.55% AP) bonus physical damageif Backstab was applied (45 second cooldown). / / Passive - Hallucinate Death: Upon your death, release an explosion in a cr 350 radius of your death location, dealing magic damage equal to 25% of target's maximum health to enemies within the area. Additionally, you deploy a Jack in the Box at the location of your death that instantly fears nearby enemies for 1 second. This box does not attack but lasts for 3 seconds. |
| Courage of the Colossus | 거석상의 용기 | Arena 유래 | Immobilizing or grounding an enemy champion grants a shield for 3 seconds that absorbs 150 to 450 (레벨 비례) (+ 4% maximum health) damage (5 second cooldown per cast instance). Shields can stack between multiple triggers of this effect, though not refreshing the duration of previous shields. |
| Cruelty | 잔혹 행위 | Mayhem 전용 | Immobilizing or grounding an enemy champion summons a comet above them that lands at their current location after 1 second, dealing 50 to 150 (레벨 비례) (+ 40% AP) (+ 4% of your maximum health) magic damage to enemies within a 300 radius (6 second cooldown per cast instance). / / For displacement effects, the comet will be summoned at the displacement's end location. |
| Dashing | 돌진 | Arena 유래 | Abilities with dashes or blinks gain 175 ability haste. |
| Devil on Your Shoulder | 어깨 위의 악마 | 26.3 신규, Arena 유래, 비활성화 | Forge a pact with Teemo, who drains 0.5% of your current health every second, increased to 5% if there are enemy champions within 1000 units. In return, you deal 20% bonus true damage and your basic attacks and abilities summon a Life Remnant nearby for 5 seconds (0.75-second spawn cooldown). You can absorb a Life Remnant by moving over it, healing you for 50 to 150 (레벨 비례) (+ 50% bonus AD) (+ 25% AP) and granting you 15% bonus movement speed. |
| Dimension Shift | 차원 이동 | Mayhem 전용 | Replace a summoner spell with When the Darkness Comes. / / When the Darkness Comes: (When the Darkness Comes 주문 효과 — 위키 SpellData 문서 참조) / / The Dark Realm is a battlefield that exists outside of the normal realm in an alternate dimension. It exists only for units hit by the cosmic light. The realm includes any terrain features that would exist in the map of the normal realm, including structures, walls, and brushes. / / Units between realms see each other as glowing stars, considering each other dead and negating any interactions between each other. Only units that were hit by the light will enter the realm; other units cannot follow them. Everything that occurs inside the Dark Realm is hidden to units outside of it, and vice versa. / / Structures exist in all realms at the same time, but champions in the Dark Realm can only deal 1 damage to them per damage instance. Turrets will behave normally as if all units were in the same realm. Pets still inside the Dark Realm are killed at its end. |
| Double Tap | 한 발에 두 놈 | 26.3 신규, Arena 유래 | Basic attacks that critically strike apply on-hit effects an additional time. Additionally, gain 25% critical strike chance. |
| Draw Your Sword | 검을 뽑아라 | Arena 유래 | Become melee, modifying your attack range to 200 (+ 100% bonus attack range from augments) units. Additionally, gain 24% bonus attack damage, 20% bonus attack speed, 24% bonus health, 20% bonus movement speed, and 20% life steal. These bonuses are increased by 0 to 100 for 11% (champion's default attack range 비례). / / This augment is only available for ranged champions. |
| DropBear | 곰 투하 | Mayhem 전용 | Upon death, you summon Tibbers who drops from above and lands onto the location of your death over 0.5 seconds. Upon landing, he deals 250 to 750 (레벨 비례) (+ 100% AP) (+ 2 per 1 flat magic penetration) (+ 5 per 1% magic penetration) magic damage to nearby enemies and stuns them for 1.5 seconds. Tibbers then chases after and targets the enemy champion that killed you, attacking them once he is in range. / / Tibbers has all of your augments and lasts for up to 8 to 20 (레벨 비례) seconds. He gains 80 to 100% (레벨 비례) bonus attack speed and deals 25 to 150 (레벨 비례) (+ 50% AP) magic damage every second to enemies within 350 units of him. His stats are: / • 1000 to 6500 (레벨 비례) (+ 15% maximum health) (+ 150% AP) health (rapidly decays over his lifetime) • 50 to 300 (레벨 비례) (+ 75% AD) physical damage (basic attack damage) • 1.00 attack speed • 150 attack range • 50 armor • 50 magic resistance • 200 to 300 (레벨 비례) (+ 20% movement speed) movement speed |
| Dropkick | 드롭킥 | 26.3 신규, Mayhem 전용 | Your basic attacks and abilities execute enemy champions below 4% (+ 5.5% per 100 base AD) (+ 1% per 1000 bonus health) of their maximum health, which causes their corpse to be sent flying away in a line. Upon collision with an enemy champion or terrain, the target's corpse explodes to deal 150 to 500 (레벨 비례) (+ 100% bonus armor) (+ 100% bonus magic resistance) magic damage to nearby enemies. Successful executions heal you for 100 to 300 (레벨 비례) (+ 25% bonus health). / / The execution may also be triggered by the explosion and ignores shields. |
| Droppybara | 카피바라 폭격 | 26.3 신규, Mayhem 전용, 비활성화 | Replace a summoner spell with Droppybara. / / Droppybara: (Droppybara 주문 효과 — 위키 SpellData 문서 참조) (팀당 최대 1명에게만 제공) |
| Dual Wield | 양손잡이 | Arena 유래 | Your basic attacks launch a bolt at the target that fires after a 0.225-second delay on-attack, deals 40% of the triggering attack's pre-mitigation damage, and applies on-hit effects at 40% effectiveness. Additionally, increase your total attack speed by 10%. |
| Earthwake | 대지의 각성 | Arena 유래 | Dashing or blinking causes you to leave behind a trail cr from the location you moved to your destination that detonates after 0.75 seconds in a 300 radius, dealing 90 to 250 (레벨 비례) (+ 125% bonus AD) (+ 60% AP) physical damage per explosion to enemies hit, reduced to 70% against minions. Enemies can be affected only once every second from all cast instances, and the effect is not triggered if you move beyond 2000 units with the dash or blink. (팀당 최대 2명에게만 제공) |
| Echo Cast | 메아리 시전 | Mayhem 전용 | Upgrades one of your champion's abilities, empowering the ability's cast to summon a clone of your champion that is untargetable and moves up to 500 units towards your cursor. The clone then casts the ability it was summoned from after a 0.25-second delay, mimicking the active effects of the casted spell and disappearing after it finishes casting. |
| Empowered By The Faithful | 신념을 통한 강화 | 26.3 신규, Mayhem 전용 | Granting a heal or shield to an allied champion blesses them for 8 seconds. Whenever a blessed ally damages an enemy champion, you generate a stack of Devotion, stacking up to 50 times. Upon reaching maximum stacks, you unleash a shockwave that deals 50 to 300 (레벨 비례) (+ 750% heal and shield power) magic damage to nearby enemies. Enemy champions damaged below a percentage of their maximum health equal to 25% of your heal and shield power are executed. |
| Empyrean Promise | 창공의 서약 | Mayhem 전용 | Replace a summoner spell with Empyrean Promise Vigilance active. Additionally, gain 15% heal and shield power. / / Active - Vigilance: After a 0.25-second delay, dash to the current location of the target allied champion and gain a 100 to 250 (레벨 비례) (+ 100% AP) (+ 10% bonus health) shield for 3 seconds. Upon arrival, grant the ally the same shield (20 second cooldown; 2000 range). |
| En Passant | 앙파상 | Mayhem 전용 | You can now identify the Vitals of enemy champions within 2000 units, marked as an arc around them and pointing towards a specific direction. Dealing damage to a target with a basic attack or ability while you are facing in the direction of their exposed Vital will consume it, dealing bonus true damage equal to 6% (+ 1.5% per En Passant stack) of the target's maximum health, healing you for 50 to 200 (레벨 비례) (+ 5% missing health), and granting you 50% (+ 5% per En Passant stack) bonus movement speed that decays over 2 seconds. Consuming a target's Vital also grants you an En Passant stack for 8 seconds, refreshing on subsequent Vital triggers and stacking up a number of times. Each En Passant stack increases the consumed Vital damage and bonus movement speed. / / Vitals on targets become exposed instantly once you are within range and remain exposed until you die. Once a target's Vital is consumed, you identify a new Vital on them pointing in a different direction from the previous after 4 seconds. |
| Eureka | 유레카 | Arena 유래 | Gain ability haste equal to 30% AP. |
| Fan the Hammer | 탄환 세례 | Arena 유래 | Your next basic attack against an enemy champion in each cardinal direction within 750 range additionally on-attack fires 5 missiles at the target that each deal 8 to 51 (레벨 비례) (+ 14% bonus AD) physical damage, for a total of 8*5 to 51*5 (레벨 비례) (+ 14*5% bonus AD) physical damage (5 second cooldown per direction). Missiles' damage is increased by 0 to 50 for 11% (distance travelled 비례). Each missile can critically strike for 200% (기본 치명타 피해 100%) damage and applies on-hit effects at 20% effectiveness. |
| Fey Magic | 요정 마법 | Arena 유래 | Damaging enemies with your ultimate ability polymorphs them into harmless critters for 2 seconds, during which their base movement speed is reduced by 60, and disarms them for the same duration (15 second cooldown per target). |
| Final Form | 최종 형태 | Arena 유래 | Casting your ultimate ability empowers you for 10 seconds, causing you to gain a shield for 50% of your maximum health, 20% omnivamp, and 30% bonus movement speed for the duration (20 second cooldown). |
| Giant Slayer | 거인 학살자 | Arena 유래 | Become tiny, reducing your size by 75% and granting you 20% bonus movement speed. Additionally, deal 10;15;25;30% (target's size 비례) bonus damage against enemy champions with greater size than you. |
| Glass Cannon | 유리 대포 | Arena 유래 | You gain a health threshold equal to 70% maximum health which cannot be modified nor exceeded by any means. In return, you deal bonus true damage equal to 25% (근접) / 15% (원거리) of all of the damage you deal pre-mitigation. |
| Goldrend | 골드 강탈 | Mayhem 전용 | Damaging basic attacks or abilities against enemy champions deal 50 to 150 (레벨 비례) (+ 40% bonus AD) (+ 20% AP) bonus magic damage, and grant you 30 골드 and 25% bonus movement speed for 1.5 seconds (30 second cooldown per champion). |
| Goliath | 거인 | Arena 유래 | Grants 35% bonus health, 15% adaptive force, and 50% increased size. |
| Hand of Baron | 남작의 도움 | 26.3 신규, Mayhem 전용 | Gain a modified Hand of Baron, which only grants 25% increased adaptive force and greatly empowers nearby allied minions. |
| Hellbent | 열의 | Mayhem 전용 | Generate a stack of Revivemaxxing for each enemy champion you hit with basic attacks or abilities, lasting for 6 seconds, refreshing on subsequent hits, and stacking up to 10 times. At maximum stacks, you become Hellbent. / / Hellbent: Upon taking lethal damage, you enter resurrection for 4 seconds, during which you are invulnerable, untargetable, and unable to act. Afterwards, you revive with 35 to 75% (레벨 비례) of your maximum health (90 second cooldown). Additionally, you become empowered for the next 15 seconds, granting you 25*0.6 to 200*0.6 (레벨 비례) bonus Attack Damage or 25 to 200 (레벨 비례) Ability Power (Adaptive), 20 to 40% (레벨 비례) bonus movement speed while facing toward nearby enemy champions, and 15 to 30% (레벨 비례) omnivamp for the duration. |
| High Roller | 도박꾼 | Mayhem 전용 | Nearby enemies that die have a 1.5% chance to drop a Stat Anvil at the location of their death. You can pick up dropped anvils by moving over them. The obtained Stat Anvils will be consumed once the shop is enabled again (after your death). |
| Holy Snowball | 신성한 눈덩이 | 26.3 신규, Mayhem 전용 | After using the Dash spell from Mark, you become invulnerable for 1.5 seconds upon arrival. Additionally, your Mark cooldown is reduced equivalent to 100 ability haste. / / If Mark is not equipped, you will be prompted to replace one of your summoner spells with Mark. |
| Infernal Conduit | 지옥의 전도체 | Arena 유래 | Your ability hits against champions apply a Burn for 3 seconds that deals6/3 to 60/3 (레벨 비례) (+ 4.6% bonus AD) (+ 6/3% AP) bonus magic damage per second(1 second cooldown per cast instance). This Burn stacks infinitely and refreshes with each application. / / Additionally, all of your Burn effects reduce the cooldowns of all your basic abilities by 0.08 seconds for each tick of damage they deal to a target. |
| Infinite Recursion | 무한 반복 | 26.3 신규, Mayhem 전용 | Gain 60 ability haste, increased by 3 each time you score a champion takedown. |
| Jeweled Gauntlet | 보석 건틀릿 | Arena 유래 | Your abilities can now critically strike for (145% + bonus critical damage) damage. Additionally, gain 25% (+ 4.5% per 100 AP) critical strike chance. / / If both Jeweled Gauntlet and Vulnerability are equipped, only rolls the critical strike chance of the augment that has the higher critical damage (or either if equal). |
| King Me | 나는 왕이다 | Mayhem 전용 | Upon entering the enemy team's gate or Catapult for the first time, either of which are located near their spawn, you become Kinged, causing you to gain one random Prismatic-tier augment and the first eligible Legendary item in your inventory to be upgraded with improved stats. The gold value of all upgradeable stats on the item is increased by exactly 1000 골드. / / King Me prioritize upgrading the first Legendary item eligible for a upgrade based on its position in the inventory, detecting each slot until an eligible item is found. |
| Mad Scientist | 미친 과학자 | Arena 유래 | Upon acquiring this augment and each time you respawn, gain either 30% adaptive force, 20% bonus health, and 40% increased size or 70 ability haste, 40% bonus movement speed, and 40% reduced size. |
| Master of Duality | 결투의 대가 | Arena 유래 | Basic attacks on-hit grant 6 to 18 (레벨 비례) ability power and damaging abilities once per cast instance grant 3 to 9 (레벨 비례) bonus attack damage, lasting for 5 seconds, with the duration of both refreshing on subsequent hits, and stacking infinitely. |
| Multishot | 다중 공격 | Mayhem 전용 | Assigns quests that require you to hit enemy champions with a specific ability's missile a number of times (counts up to 1 hit per champion per cast instance). There are six quest tiers, and each completed tier rewards you with an additional missile fired on the ability's cast. The reward effect also modifies the ability to fire all of its missiles in a cone. Subsequent missile hits from the same cast against the same enemy deal 30% damage. / / Hit requirements as denoted below are rounded down to whole numbers, with a minimum value of 1. |
| Mystic Punch | 신비한 주먹 | Arena 유래 | Basic attacks on-hit reduce the remaining cooldowns of your abilities by 1.25 seconds. |
| Ominous Pact | 불길한 서약 | Arena 유래 | Your abilities now have a health cost of 5% current health to cast them. In return, you gain ability power based on your missing health, up to 75 to 150 (레벨 비례) at 70% missing health, 0 to 50 for 11% (missing health 비례) bonus movement speed, and 0 to 20 for 11% (missing health 비례) omnivamp. |
| Omni Soul | 전능의 영혼 | Arena 유래 | Grants 3 random Dragon Souls. |
| Overloaded | 과충전 | Mayhem 전용 | Upgrades one of your champion's abilities, empowering the ability to have its cooldown reset whenever you cast a different ability. |
| Pandora's Box | 판도라의 상자 | Arena 유래 | Gain one random Prismatic-tier augment. Additionally, your current augments transform into an equal number of completely random Prismatic-tier ones. |
| Pin Cushion | 고슴도치 | Mayhem 전용 | Upgrades one of your champion's abilities that has a duration-based effect, empowering it to cause basic attacks during the ability's effect to apply stacks against enemy champions. At the end of the ability's duration, the stacks on all targets are consumed, dealing 20 to 60 (레벨 비례) physical damage for each stack on the target. If this effect would deal lethal damage to the target, the stacks are consumed immediately. Additionally, gain 10 bonus movement speed per stack consumed from each target. |
| Poro Stampede | 포로 쇄도 | Mayhem 전용 | Poro-Snaxes will now randomly appear around you every 25 to 15 (레벨 비례) seconds. You can pick up a Poro-Snax by moving over it, granting you a Poro-Snax charge. Poro-Snaxes will not spawn while you are at the maximum number of Poro-Snax charges (2). Feeding a Poro with a Poro-Snax generates a stack of Poro Love. At 5 stacks, you are granted the Poro Charge summoner spell and are prompted to replace one of your summoner spells with it. You are then assigned with quests that require you to reach a certain amount of Poro Love stacks. There are nine quest tiers, and each completed tier rewards you with an additional Poro wave for Poro Charge. / / Poro Charge: (Poro Charge 주문 효과 — 위키 SpellData 문서 참조) |
| Prom Queen | 퀸카 | 26.3 신규, Mayhem 전용 | Automatically cast a modified version of The Quickness, empowering you to break into a captivating sprint for 6 seconds. While empowered, you gain ghosting and 50% bonus movement speed, and enemies you collide with are knocked down and become charmed for 1.5 seconds (35 second cooldown). / / A sparkly tiara will descend upon you 2.5 seconds before the effect activates. |
| Protein Shake | 프로틴 음료 | Arena 유래 | Gain 25% (+ 35% per 100 bonus armor) (+ 35% per 100 bonus magic resistance) heal and shield power. |
| Quantum Computing | 양자 연산 | Arena 유래, 비활성화 | Automatically cast an improved version of Tactical Sweep when an enemy champion is within 650 units of you, winding up over 0.75 seconds to slash in a 650 radius around you. The slash deals 200 to 350 (레벨 비례) (+ 75% bonus AD) (+ 45% AP) physical damage to enemies within the area (30 second cooldown). Enemies hit by the outer edge of the circle take bonus physical damage equal to 10% (+ 2.5% per 100 bonus AD) (+ 1.6% per 100 AP) (+ 0.1% per 100 bonus health) of their maximum health and are slowed by 80% decaying over 2 seconds. Additionally, you are healed for 80% of the bonus post-mitigation damage against enemy champions hit by the outer edge. |
| Quest: Icathia's Fall | 이케시아의 몰락 | 26.3 신규, Arena 유래 | Gain Bami's Cinder. You can now purchase Hollow Radiance and Sunfire Aegis in spite of the item limit imposed by Immolate. / / Quest: Obtain Hollow Radiance and Sunfire Aegis. / / Reward: Upon completing your Quest, convert the items you obtained for the quest into Void Immolation. |
| Quest: Sneakerhead | 신발 수집가 | Mayhem 전용, 비활성화 | Assigns quests that require you to perform specific tasks while equipped with a particular Boots item, which is granted to you for free during its respective quest. Finish the following quests, which are assigned to you in a random order: / • Quest - Berserker's Greaves: Basic attack 25 times. • Quest - Boots of Swiftness: Run 300 steps. • Quest - Ionian Boots of Lucidity: Cast 20 abilities. • Quest - Mercury's Treads: Become afflicted by crowd control 5 times. • Quest - Plated Steelcaps: Reduce a total of 200 damage with Plating. • Quest - Sorcerer's Shoes: Deal a total of 1500 damage with abilities. / Reward: Upon completing all of the above quests, you receive Jarvan I's. / / You cannot purchase any Boots items while equipped with this augment. If you already have a Boots item, it is replaced by the Boots granted by this effect. Boots items gained from this effect cannot be sold. |
| Quest: Urf's Champion | 우르프의 챔피언 | Arena 유래 | Quest: Score 18 champion takedowns. / / Reward: Upon completing your Quest, you receive The Golden Spatula. / / If your inventory is full at the time of quest completion, the item will be granted as soon as a slot in the inventory is available. |
| Quest: Wooglet's Witchcap | 우글렛의 마녀 모자 | Arena 유래 | Gain a Needlessly Large Rod. / / Quest: Obtain Rabadon's Deathcap and Zhonya's Hourglass. / / Reward: Upon completing your Quest, convert the items you obtained for the quest into Wooglet's Witchcap. |
| Rite of Ascension | 초월 의식 | Mayhem 전용 | Scoring a takedown against an enemy champion within 3 seconds of damaging them causes them to leave behind their Essence for 8 seconds. You can basic attack the Essence within 400 units to consume it: causing you to blink to its location after winding up for 1.25 seconds, during which you are untargetable (except to turrets), displacement immune, and unable to act. Upon consumption of the Essence, you gain 100% bonus movement speed decaying over 2 seconds, heal yourself for 75 to 300 (레벨 비례) (+ 50% bonus AD) (+ 25% AP), and reset the cooldowns of your basic abilities. The heal is increased by 0 to 100 for 11% (your missing health 비례), for a maximum heal of 75*2 to 300*2 (레벨 비례) (+ 50*2% bonus AD) (+ 25*2% AP). |
| Scopiest Weapons | 최상급 조준경 부착 | Arena 유래 | Gain 250 (근접) / 150 (원거리) bonus attack range. |
| Spell Split | 주문 분산 | Mayhem 전용 | Upgrades one of your champion's abilities that has a missile, empowering the ability's missile to split in two over 0.25 seconds upon hitting an enemy, at maximum range, or when recast. Each of the split missiles fire perpendicularly in opposite directions and apply the same effects to enemies they hit. Subsequent missile hits from the same cast against the same enemy deal 30% damage. / / Recast can be used after 0.15 seconds of the initial cast. |
| Spirit Bomb | 영혼 폭탄 | Mayhem 전용 | Your healing and shielding on yourself or allies builds up a Spirit Bomb on top of you. Once you have healed and shielded a combined total of 200 to 2000 (레벨 비례), you toss the Spirit Bomb onto the most wounded allied champion over 1.1 seconds. Upon impact, the Spirit Bomb explodes in a 475 radius to heal allied champions within the area for 5 to 15% (레벨 비례) (+ 3% per 100 AP) of their missing health and grants them a shield for 2 seconds that absorbs damage equal to 10 to 25% (레벨 비례) (+ 2% per 100 AP) of their current health. / / Healing and shielding from this effect do not count toward the Spirit Bomb's trigger condition. |
| Squishy Slappy Grab | 말랑 찰싹 손 | Mayhem 전용 | When an enemy champion is within 450 units of you, after a 1.5-second delay, you send out Squishy Slappy Hands that latch onto all nearby enemy champions within 800 units, forming a tether between yourself and each target for 4 seconds (35 second cooldown). While the tethers persist (950 tether radius), your next basic attack is empowered to pull all tethered enemies toward you, dealing 30 to 100 (레벨 비례) (+ 10% bonus health) magic damage to affected targets and stunning them for 0.25 seconds after the pull ends. Targets are pulled over 450 units, reduced to 350 for those farther away from you. Additionally, you gain a 35 to 150 (레벨 비례) (+ 50% bonus armor) (+ 50% bonus magic resistance) shield for each pulled enemy. |
| Stats on Stats on Stats! | 능력치 더하기 능력치 더하기 능력치! | 26.3 신규, Arena 유래 | Gain 4 Stat Anvils, with a higher chance of obtaining Gold- and Prismatic-tier anvils. Additionally, on the next round of augment selection, you gain an additional reroll per augment slot. |
| Stuck in Here With Me | 도망갈 수 없어 | 26.3 신규, Arena 유래 | Casting your ultimate ability grants you an aura for 2 seconds, growing in size over the duration to up to 500 units. After the duration, you taunt all enemies within the aura for 2 seconds and gain 50% damage reduction for the same duration (30 second cooldown). Additionally, gain 30 ultimate haste. / / Aura is activated once the ultimate's effect starts or has elapsed. |
| Surge Field | 방출 역장 | Mayhem 전용 | Upon casting your ultimate ability, you spawn a surge zone beneath you that has a 300 radius. While you are within the zone, you gain 50 ability haste and 40% bonus movement speed, and your damage dealt to enemy champions fires missiles at them that deal 20% of the triggering damage instance pre-mitigation as bonus magic damage. The missile effect cannot trigger from itself. / / The zone lasts indefinitely as long as you stay within its radius. If you leave the zone's radius for the first time, it moves to your current location. Exiting the zone a second time causes it to disappear if you do not re-enter the area within 1.25 seconds. |
| Symphony of War | 전장의 교향곡 | Arena 유래 | Gain the Conqueror and Lethal Tempo keystone runes. |
| Tap Dancer | 탭 댄서 | Arena 유래 | Basic attacks on-hit against enemy champions and minions grant 10 bonus movement speed, lasting for 5 seconds, refreshing on subsequent triggers, and stacking infinitely. Additionally, gain bonus attack speed equal to 10% total movement speed. |
| Titan's Resolve | 거인의 결의 | Mayhem 전용 | You generate a stack of Juggernauting for each instance of damage you deal or take (excluding damage over time), lasting for 6 seconds and refreshing on subsequent damage dealt or taken. For every 10 stacks of Juggernauting, you gain 25*0.6 to 75*0.6 (레벨 비례) bonus Attack Damage or 25 to 75 (레벨 비례) Ability Power (Adaptive), 5 to 10 (레벨 비례) bonus armor and bonus magic resistance, 10% increased size, and 8% tenacity. / / Stacks expire one by one when the duration ends, with the decay rate being faster the more stacks you have. |
| Transmute: Chaos | 전환: 혼돈 | Arena 유래 | Gain two completely random augments, excluding the other two offerings in your current assortment. |
| Triggered Inferno | 지옥불 난사 발동 | 26.3 신규, Mayhem 전용 | Your damaging basic attacks and abilities against at least one enemy champion unique from the previous damaging hit made against champions generate a stack of Style for 6 seconds, refreshing on subsequent unique or non-unique hits and stacking up to 7 times. For each stack, gain 4.25 to 5 for 4% (레벨 비례) bonus movement speed, up to a maximum of 4.25*7 to 5*7 for 4% (레벨 비례). / / Upon reaching maximum Style stacks, you unleash a torrent of shots for 2.25, during which you rapidly shoot at nearby enemies over 2 at sporadic times in 0.2-second intervals each (up to 10 times per enemy), dealing 20 to 40 (레벨 비례) (+ 40% AD) (+ 25% AP) physical damage with each shot, reduced by 75% against minions. Enemies below 30% of their maximum health are critically struck fordouble damage(15 second cooldown). This effect ends prematurely if you become affected by cast-inhibiting crowd control. / / Style stacks are represented by grades (→→→→→→). The stacks are consumed at the end of the shooting effect. Shot damage applies life steal. |
| Tripleshot | 3연발 | Mayhem 전용 | Upgrades one of your champion's abilities that is unit-targeted and fires a missile, empowering the ability to fire its missiles at two additional enemies near the primary target. Subsequent hits from the same cast against the same enemy deal 30% damage. |
| Ult Bot | 궁극기 봇 | Mayhem 전용 | Your ability haste now only applies to the cooldown of your ultimate ability. In return, you gain 100 ability haste and your ability haste is 50% more effective. |
| Ultimate Awakening | 궁극의 각성 | Mayhem 전용 | Casting your ultimate ability resets the cooldowns of all your basic abilities and grants you 300 basic ability haste for 15 seconds (20 second cooldown). Additionally, gain 30 ultimate haste. |
| Ultimate Revolution | 궁극기 대변혁 | Arena 유래 | Casting your ultimate ability resets its cooldown once its effect starts or has elapsed (75 second cooldown, reset upon death). |
| Ultra Hydra | 궁극의 히드라 | Mayhem 전용 | You can now purchase Tiamat, Profane Hydra, Ravenous Hydra, and Titanic Hydra in spite of the item limit imposed by Hydra. Purchasing a Legendary-tier Hydra item (excluding Stridebreaker) grants you a Tiamat for free. / / Quest: Obtain Profane Hydra, Ravenous Hydra, and Titanic Hydra. / / Reward: Upon completing your Quest, convert the items you obtained for the quest into Ultra Hydra. |
| Upgrade Sword of Blossoming Dawn | 꽃피는 새벽의 검 업그레이드 | Arena 유래 | Upgrades Sword of Blossoming Dawn, empowering Peppermint to have its healing increased by 250%. Additionally, you gain 100% bonus attack speed. |
| Windspeaker's Blessing | 바람전달자의 축복 | Mayhem 전용 | Your or allies' heals and shields on yourself, or your heals and shields on allies, grant the target 30 to 60 (레벨 비례) bonus armor and bonus magic resistance for 3 seconds. |


## 3. 26.3(V26.03) 패치의 증강 추가/변경

출처: [LoL Wiki - ARAM: Mayhem/Patch history](https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Patch_history), [공식 패치 26.3 노트](https://www.leagueoflegends.com/en-us/news/game-updates/patch-26-3-notes/), [인벤 기사(신규 증강 45종 추가)](https://www.inven.co.kr/webzine/news/?news=313333&site=lol), [Sheep Esports](https://www.sheepesports.com/us/articles/aram-mayhem-receives-a-mid-patch-update-during-26-03/en), [esports-news.co.uk](https://esports-news.co.uk/2026/02/03/league-of-legends-patch-26-3-brings-mel-rework-and-mayhem-update/)

### 3-1. 신규 추가 증강 — 위키 패치 노트 나열 기준 46종 (언론 보도는 "45종", 1종 차이의 원인은 미확인)

| 이름(EN) | 이름(KR) | 등급 | 현재 상태(2026-09 기준) |
|---|---|---|---|
| ??? | ??? | 프리즘 | V26.12에서 삭제 |
| Bounce of the Poro King | 포로 왕의 바운스 | 프리즘 | V26.12에서 삭제 |
| Crack Open That Egg | 알 깨기 | 실버 | V26.12에서 삭제 |
| Crit 'n Cast | 치명적 가속 | 실버 | 현재 제공 중 |
| Critical Missile | 치명적 미사일 | 골드 | 현재 제공 중 |
| Devil on Your Shoulder | 어깨 위의 악마 | 프리즘 | 현존(비활성화 상태) |
| Donation | 후원 | 골드 | 현재 제공 중 |
| Double Tap | 한 발에 두 놈 | 프리즘 | 현재 제공 중 |
| Dropkick | 드롭킥 | 프리즘 | 현재 제공 중 |
| Droppybara | 카피바라 폭격 | 프리즘 | 현존(비활성화 상태) |
| Empowered By The Faithful | 신념을 통한 강화 | 프리즘 | 현재 제공 중 |
| Final City Transit | 최후의 도시 대중교통 | 골드 | 현존(비활성화 상태) |
| Firefox | 불여우 | 실버 | 현재 제공 중 |
| Grandma's Chili Oil | 할머니의 고추기름 | 골드 | V26.12에서 삭제 |
| Growth Spurt | 급속 성장 | 골드 | 현재 제공 중 |
| Hand of Baron | 남작의 도움 | 프리즘 | 현재 제공 중 |
| Heads Up Cupcake! | 컵케이크 조심해! | 프리즘 | V26.12에서 삭제 |
| Hextech Soul | 마법공학의 영혼 | 실버 | 현재 제공 중 |
| Holy Snowball | 신성한 눈덩이 | 프리즘 | 현재 제공 중 |
| Triggered Inferno | 지옥불 난사 발동 | 프리즘 | 현재 제공 중 |
| Infinite Recursion | 무한 반복 | 프리즘 | 현재 제공 중 |
| Juiced | 도취 | 실버 | 현재 제공 중 |
| Kill Secured | 확보된 킬 | 실버 | 현재 제공 중 |
| Laser Eyes | 눈알 광선 | 미확인 | 현재 목록에 없음(삭제 기록도 없음, 미확인) |
| Phenomenal Evil | 극악무도 | 골드 | 현재 제공 중 |
| Pinball | 핀볼 | 골드 | 현재 제공 중 |
| Poro Blaster | 포로 발사기 | 골드 | V26.12에서 삭제 |
| Prom Queen | 퀸카 | 프리즘 | 현재 제공 중 |
| Purist - Caster | 순수주의자 - 마법사 | 실버 | 현재 제공 중 |
| Quest: Icathia's Fall | 이케시아의 몰락 | 프리즘 | 현재 제공 중 |
| Red Envelopes | 붉은 봉투 | 골드 | V26.12에서 삭제 |
| Shrink Engine | 축소 엔진 | 골드 | 현재 제공 중 |
| Sonata | 소나타 | 골드 | 현재 제공 중 |
| Soul Eater | 영혼의 포식자 | 골드 | 현재 제공 중 |
| Speed Demon | 질주하는 악마 | 실버 | V26.12에서 삭제 |
| Spin Me Right Round | 빙글빙글 | 실버 | 현재 제공 중 |
| Stats! | 능력치! | 실버 | 현재 제공 중 |
| Stats on Stats! | 능력치 더하기 능력치! | 골드 | 현재 제공 중 |
| Stats on Stats on Stats! | 능력치 더하기 능력치 더하기 능력치! | 프리즘 | 현재 제공 중 |
| Stuck in Here With Me | 도망갈 수 없어 | 프리즘 | 현재 제공 중 |
| Twin Fire | 쌍둥이 불꽃 | 실버 | 현재 제공 중 |
| Upgrade Thornmail | 가시 갑옷 업그레이드 | 실버 | V26.12에서 삭제 |
| Virtuous Cycle | 선순환 | 실버 | V26.12에서 삭제 |
| Void Rift | 공허 균열 | 프리즘 | V26.12에서 삭제 |
| Weighted Popoffs | 중량 폭주 | 실버 | V26.12에서 삭제 |
| Zealot | 광신자 | 실버 | 현재 제공 중 |

주: 패치 노트 표기 "Inferno Triggered"는 현재 위키에서 "Triggered Inferno"(지옥불 난사 발동)로, "Empowered By The Faith"는 "Empowered By The Faithful"로 기재됨. 26.3에서 추가된 증강 중 상당수(붉은 봉투, 포로 발사기, 질주하는 악마 등 13종)는 이후 V26.12 개편에서 삭제됨.

### 3-2. 삭제된 증강 (V26.03 시점)

- **Orbital Laser** (궤도형 레이저, 프리즘) — Arena 유래 증강, 26.3에서 제거
- **Stackasaurus Rex** (다단 중첩) — 제거 후 동명의 "Stackosaurus Rex" 증강 세트로 전환 (패치 노트와 위키 문서 간 철자 상이: Stacka-/Stacko-)
- **Upgrade: Cutlass** — 제거 (한국어명 미확인)

### 3-3. 증강 세트(Augment Sets) 도입 — 9종 (V26.12에서 폐지됨)

같은 세트의 증강을 여러 개 모으면 추가 보너스가 발동하는 TFT 특성식 시스템. 한국어 세트명은 게임 클라이언트 스트링테이블 기준.

| 세트(EN) | 세트(KR) | 소속 증강 | 보너스 요약 |
|---|---|---|---|
| Archmage | 대마법사 | Overflow, Mind to Matter, Buff Buddies, Juiced, Ocean Soul | (2) 스킬 시전 시 다른 무작위 스킬 쿨다운 40% 환급 |
| Dive Bomb Set | 급강하 세트 | Clown College, Final City Transit, Self Destruct, Dive Bomber | (2) 부활 대기시간 40% 감소 |
| Firecracker Set | 폭죽 세트 | Fan the Hammer, Magic Missile, Critical Missile, Light 'em Up!, Typhoon, Twin Fire | (2) 폭죽 투사체 2회 추가 튕김·원래 피해의 40% / (4) 3회·80% |
| Fully Automated | 완전 자동화 | Prom Queen, Quantum Computing, OK Boomerang, Sonata, Divine Intervention, Self Destruct, Frost Wraith, Firefox | (2) 자동 발동 증강 쿨다운 30% 감소 / (3) 쿨다운이 스킬 가속의 영향을 받음 |
| High Roller | 도박꾼 | Transmute: Chaos, Pandora's Box, Stats on Stats on Stats!, Transmute: Prismatic, Stats on Stats!, Transmute: Gold, Stats! | (2) 적 미니언 처치 시 9% 확률로 능력치 모루 드랍 / (3)(4) 골드·프리즘 모루 확률 +20%/+50% |
| Make it Rain | 골드는 비를 타고 | Goldrend, Heads Up Cupcake!, Donation, Red Envelopes, From Beginning to End, Upgrade: Immolate, Upgrade: Collector | (2) 증강·킬 골드 +25% / (3) +50% / (4) +100% |
| Snowday | 눈 오는 날 | Biggest Snowball Ever, Holy Snowball, Snowball Upgrade, Pinball, Snowball Roulette | (2) 표식(눈덩이) 피해 +30%·스킬가속 50 / (3) +50%·100 / (4) +100%·150 |
| Stackosaurus Rex | 다단 중첩 | Infinite Recursion, Master of Duality, Tap Dancer, Soul Eater, Quest: Steel Your Heart, Phenomenal Evil, Shrink Engine, Upgrade: Hubris, Slap Around | (2) 중첩 획득량 +50% / (3) +100% / (4) +200% |
| Wee Woo Wee Woo | 삐뽀삐뽀 | Windspeaker's Blessing, I'm a Baby Kitty Where is Mama, Upgrade: Mikael's Blessing, All For You, Critical Healing, Sonata, First-Aid Kit | (2~4) 체력 낮은 아군 방향 이동 시 이동 속도·회복 및 보호막 효과 증가 |

참고: 인벤 기사는 일부 세트명을 "죽음의 종소리(Dive Bomb), 불꽃놀이(Firecracker)" 등으로 번역했으나 실제 클라이언트 문자열은 "급강하 세트", "폭죽 세트"임. 이 세트 시스템(위키 표기 "Augment Trait System")은 **V26.12에서 제거**되었고, 세트 보너스 일부는 개별 증강(예: 현재의 Stackosaurus Rex 실버 증강)으로 흡수됨.

### 3-4. Mayhem 진척도 트랙(Progression Track) 도입 — 32레벨

게임 플레이로 Mayhem XP를 얻어 레벨업, 레벨별로 증강 해금·꾸미기 보상 획득. 증강 해금 레벨: 1(Red Envelopes), 2(Weighted Popoffs), 5(Growth Spurt), 7(Donation), 8(Bounce of the Poro King), 10(Speed Demon), 12(Shrink Engine), 14(Crack Open That Egg), 16(Void Immolation — 명칭상 Quest: Icathia's Fall의 보상 아이템과 연관 추정, 미확인), 19(Inferno Triggered), 21(Thornmail Upgrade), 24(Dropkick), 25(Sonata), 27(Stuck in Here with Me), 29(Empowered By The Faith), 32(???). 기타 레벨은 골드 리롤, 시작 골드 +300, 모루 교환권, 엘릭서, 아이콘/감정표현 보상. 이 트랙 1기(Set 1)는 이후 종료되어 위키 [Old content](https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Old_content) 문서로 이동됨.

### 3-5. 기타 26.3 본패치 변경

- 소환사 주문: 점멸 강제 장착 해제, 증강으로 얻는 소환사 주문의 교체 슬롯 선택 가능
- 밸런스 상향: Cerberus(칼날비 공속 140%→200% 등), Empyrean Promise(쿨다운 30→20초 등), From Beginning to End(선제공격 골드/피해↑), Goldrend(골드 15→30), Laser Heal(회복↑·쿨다운 45→30초), Lightning Strike(온힛 해금 공속 3.5→1.75), Mystic Punch(쿨다운 감소 20%→1.25초)
- 버그 수정: Infernal Conduit, Marksmage, Slow and Steady, Ultimate Revolution 등

### 3-6. 26.3 핫픽스 3회 (2/5, 2/10, 2/11)

- **2월 5일**: 증강 카드 호버 지연 0.75→0.1초, 진척도 4레벨 보상 변경. 너프: Devil On Your Shoulder(체력 소모·추가 고정 피해), Poro Blaster(소환 3→5초, 팀당 1명 제한), Heads Up Cupcake!, Kill Secured(이속 100%→60%), Speed Demon(이속 350→200), Archmage/Dive Bomb/Firecracker/Make it Rain 세트 보너스 하향
- **2월 10일**: Stat Anvil(능력치 모루) 관련 대규모 버그 수정 및 하향(모든 피해 흡혈 파편 등), Stats!/Stats on Stats!/Stats on Stats on Stats! **버그로 임시 비활성화**(부여 모루 수도 각각 감소), Donation 골드 2500→1750, Hand of Baron 적응형 25%(33%에서), Red Envelopes·Shrink Engine·Vampirism(30%→25%)·Firecracker/High Roller/Wee Woo Wee Woo 세트 하향
- **2월 11일**: Stat Anvil 구매 가능 레벨 9→16

## 4. Arena(투기장) 유래 vs Mayhem 신규 구분

- 방법: LoL 위키 [Arena 증강 데이터 모듈](https://wiki.leagueoflegends.com/en-us/Module:ArenaAugmentData/data)(255개)과 이름 정규화 대조. **이름이 같아도 수치/세부 효과는 Mayhem용으로 조정된 경우가 많음**.
- 결과: 현재 225개 중 **128개가 Arena에 동명 증강 존재(유래 추정)**, **97개는 Mayhem 전용 이름**. 개별 구분은 2번 표의 "구분" 열 참조.
- 한계: 이름을 바꿔 이식된 증강(예: Arena의 유사 효과 변형)은 이 방법으로 잡히지 않음 — 미확인.

## 5. 삭제/비활성화 증강 현황

### 5-1. 모드 운영 중 삭제된 증강 (위키 [Old content](https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Old_content) 및 [Patch history](https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Patch_history) 기준, 총 44종)

| 이름(EN) | 이름(KR) | 등급 | 삭제 시점 |
|---|---|---|---|
| ??? | ??? | 프리즘 | V26.12 |
| Bounce of the Poro King | 포로 왕의 바운스 | 프리즘 | V26.12 |
| Buff Buddies | 쌍버프 | 실버 | V26.12 |
| Cerberus | 케르베로스 | 프리즘 | V26.12 |
| Cheating | 부정 행위 | 골드 | V26.12 |
| Crack Open That Egg | 알 깨기 | 실버 | V26.12 |
| Demon's Dance | 악마의 춤 | 프리즘 | V26.12 |
| Executioner | 처형자 | 골드 | V26.12 |
| Feel the Burn | 저주의 화염 | 프리즘 | V26.12 |
| Frost Wraith | 서리 망령 | 실버 | V26.12 |
| Gash | 깊은 상처 | 프리즘 | V26.12 |
| Grandma's Chili Oil | 할머니의 고추기름 | 골드 | V26.12 |
| Hat on a Hat | 모자 겹쳐쓰기 | 실버 | V26.12 |
| Holy Fire | 신성한 불길 | 골드 | V26.12 |
| I'm a Baby Kitty Where is Mama | 엄마 찾는 아기 고양이 | 프리즘 | V26.12 |
| Keystone Conjurer | 핵심 룬 요술사 | 골드 | V26.12 |
| Laser Heal | 체력 회복 광선 | 프리즘 | V26.12 |
| Lightning Strikes | 벼락 | 골드 | V26.12 |
| Poro Blaster | 포로 발사기 | 골드 | V26.12 |
| Rabble Rousing | 원기 회복 | 골드 | V26.12 |
| Red Envelopes | 붉은 봉투 | 골드 | V26.12 |
| ReEnergize | 재충전 | 실버 | V26.12 |
| Repulsor | 반발 | 실버 | V26.12 |
| Restless Restoration | 끊임없는 회복 | 골드 | V26.12 |
| Self Destruct | 자폭 | 실버 | V26.12 |
| Slow and Steady | 천천히, 꾸준히 | 골드 | V26.12 |
| Snowball Roulette | 눈덩이 룰렛 | 골드 | V26.12 |
| Speed Demon | 질주하는 악마 | 실버 | V26.12 |
| The Brutalizer | 야수화 | 실버 | V26.12 |
| Tormentor | 고문자 | 실버 | V26.12 |
| Trueshot Prodigy | 정조준 일격 신동 | 프리즘 | V26.12 |
| Twice Thrice | 두 배 세 배 | 골드 | V26.12 |
| Upgrade Hubris | 오만 업그레이드 | 골드 | V26.12 |
| Upgrade Mikael's Blessing | 미카엘의 축복 업그레이드 | 프리즘 | V26.12 |
| Upgrade Thornmail | 가시 갑옷 업그레이드 | 실버 | V26.12 |
| Void Rift | 공허 균열 | 프리즘 | V26.12 |
| Heads Up Cupcake! | 컵케이크 조심해! | 프리즘 | V26.12 |
| Weighted Popoffs | 중량 폭주 | 실버 | V26.12 |
| Wind Beneath Blade | 칼날 아래 바람 | 실버 | V26.12 |
| Orbital Laser | 궤도형 레이저 | 프리즘 | V26.03 |
| Stackosaurus Rex | 다단 중첩 | 실버 | V26.03 (V26.03에서 삭제→세트로 전환→세트 폐지 후 현재 실버 증강으로 재등장) |
| Upgrade: Cutlass | 미확인 | 실버 | V26.03 |
| Fetch | 물어 와 | 실버 | V26.12 |
| Virtuous Cycle | 선순환 | 실버 | V26.12 |

- "Laser Eyes"(눈알 광선)는 26.3 추가 목록에 있으나 현재 증강 목록에도, 삭제 목록에도 없음 — 상태 미확인.
- V26.12 개편(위키 표기 "2026 Pandemonium Act 2 업데이트")에서 증강 세트 폐지와 함께 41종이 일괄 삭제되고 "Ability/Quest 증강"이 추가됨(추가분의 정확한 목록은 위키에 기록되지 않아 미확인).

### 5-2. 현재 "비활성화(currently disabled)"로 표기된 증강 (11개, 위키 기준)

- **Adamant** (단호함, 실버)
- **Perseverance** (인내심, 골드)
- **Snowball Upgrade** (눈덩이 업그레이드, 골드)
- **Vampirism** (흡혈병, 골드)
- **Clown College** (광대 대학, 프리즘)
- **Quantum Computing** (양자 연산, 프리즘)
- **Quest: Sneakerhead** (신발 수집가, 프리즘)
- **Devil on Your Shoulder** (어깨 위의 악마, 프리즘)
- **Droppybara** (카피바라 폭격, 프리즘)
- **Final City Transit** (최후의 도시 대중교통, 골드)
- **Void Dash** (공허 돌진, 골드)

주: Stats! 계열 3종은 26.3 핫픽스에서 "버그로 임시 비활성화"가 명시됨. 나머지는 위키에 비활성화로만 표기되어 개별 시점·사유는 미확인.

### 5-3. 내부 데이터에만 존재하고 실제 제공되지 않는 것으로 보이는 증강 (3개)

- **Snap Back** (원상복구, 골드)
- **Double Strike** (2연속 공격, 실버)
- **Reload** (재장전, 골드)

## 6. 26.3 이후 증강 관련 주요 변경(참고)

- **V26.04**: 증강 "Upgrade Sword of Blossoming Dawn"(꽃피는 새벽의 검 업그레이드, 프리즘) 추가. 세트 아이콘 HUD 표시 제거, 넥서스 체력 조정 등
- **V26.06**: 챔피언별 밸런스 계수 조정, 증강 관련 버그 수정 다수
- **V26.12**: 증강 세트(Augment Trait System) **폐지**, 41종 일괄 삭제, Ability/Quest 증강 추가, Blade Waltz·Draw Your Sword·Spin Me Right Round 조정
- 위키 패치 히스토리에는 {{Outdated}} 표기가 있어 26.13 이후 기록은 불완전할 수 있음. 커뮤니티 추적 사이트([arammayhem.com](https://arammayhem.com/patch-notes/), [mobalytics](https://mobalytics.gg/lol/guides/aram-mayhem-patch-notes))는 26.17까지 갱신 확인.

## 7. 비고/데이터 품질 메모

- 위키 모듈 등급과 op.gg 표기가 다른 사례 1건: **Terror**(위키 실버 / op.gg 골드) — 어느 쪽이 최신인지 미확인. (2026-09-02 독립 재검증: 양측 데이터를 직접 재추출한 결과 불일치가 실재함을 확인 — 위키 모듈 tier="Silver", op.gg rarity=4(골드). 이 1건 외 op.gg 수록 138종 전수 대조에서 등급 불일치 없음.)
- **Rejuvenation**(원기 회복)은 26.12 이전의 "Rabble Rousing"(원기 회복, 동일 내부키 RabbleRousing)을 Ability 증강으로 재작업한 것으로 보임(내부 키·한국어명 동일, 효과 상이) — 재작업 여부 자체는 미확인. (2026-09-02 재검증: op.gg 라이브 데이터에서 "원기 회복"이 내부 키 `ARAM_RabbleRousing`으로 제공됨을 독립 확인 — "내부 키 동일" 주장은 검증됨.)
- "Hide on Bush"는 한국 클라이언트에서도 영문 그대로 "Hide on bush"(페이커 밈 유래).
- Double Strike(2연속 공격), Ultra Hydra(궁극의 히드라) 등 미출시/특수 증강의 한국어 명칭은 동일 문자열 키의 클라이언트 번역에서 유추한 것으로, 게임 내 실제 노출 여부는 미확인.
- Quest: Sneakerhead의 보상 "Jarvan I's"는 위키 원문 아이템 링크 축약(전체 아이템명 미확인). 이 증강은 현재 비활성화 상태.
- 진척도 트랙 해금 증강 중 다수가 26.12에서 삭제되어, 현재 트랙 구성은 위 26.3 시점 기록과 다를 수 있음(현행 트랙 구성은 미확인).

## 8. 출처 전체 목록

- https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Augments (증강 목록 페이지)
- https://wiki.leagueoflegends.com/en-us/Module:MayhemAugmentData/data (증강 원본 데이터 모듈, 225개 전수)
- https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem (모드 개요, 출시일/운영 정보)
- https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Patch_history (V25.21~V26.12 패치 히스토리)
- https://wiki.leagueoflegends.com/en-us/ARAM:_Mayhem/Old_content (삭제된 증강·세트·진척도 트랙 아카이브)
- https://wiki.leagueoflegends.com/en-us/Module:ArenaAugmentData/data (Arena 증강 데이터, 유래 대조용)
- https://op.gg/ko/lol/modes/aram-mayhem (한국어 증강명·설명·티어 통계)
- https://raw.communitydragon.org/latest/game/ko_kr/data/menu/en_us/lol.stringtable.json (한국어 클라이언트 문자열)
- https://raw.communitydragon.org/latest/game/en_us/data/menu/en_us/lol.stringtable.json (영어 클라이언트 문자열, 키 대조)
- https://raw.communitydragon.org/latest/cdragon/arena/ko_kr.json (증강 한국어 데이터)
- https://www.leagueoflegends.com/en-us/news/game-updates/patch-26-3-notes/ (공식 26.3 패치 노트)
- https://www.inven.co.kr/webzine/news/?news=313333&site=lol (인벤: 신규 증강 45종 추가)
- https://www.sheepesports.com/us/articles/aram-mayhem-receives-a-mid-patch-update-during-26-03/en (26.3 중간 업데이트 보도)
- https://esports-news.co.uk/2026/02/03/league-of-legends-patch-26-3-brings-mel-rework-and-mayhem-update/ (26.3 보도)
- https://support-leagueoflegends.riotgames.com/hc/en-us/articles/45460878435987-League-of-Legends-ARAM-Mayhem-Game-Mode (Riot 지원: 운영 기간)
- https://arammayhem.com/patch/26-3/ , https://arammayhem.com/patch-notes/ (커뮤니티 패치 추적, 26.17까지 갱신 확인)
- https://mobalytics.gg/lol/guides/aram-mayhem-patch-notes (패치 추적)
- https://namu.wiki/w/%EB%AC%B4%EC%9E%91%EC%9C%84%20%EC%B4%9D%EB%A0%A5%EC%A0%84:%20%EC%95%84%EC%88%98%EB%9D%BC%EC%9E%A5 (나무위키 "무작위 총력전: 아수라장" — 접속은 가능하나 개별 증강명 목록이 초기 HTML에 포함되지 않아(JS 렌더링) 한국어명 대조에는 미사용)
