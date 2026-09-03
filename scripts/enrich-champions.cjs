// Node 14 CommonJS — docs/data/champions.json 스킬별 props 부여 + abilityProps 재계산
//
// v2 (real-mapping 계약): 1차 소스가 게임 원본 태그로 바뀜.
//   1차: CommunityDragon 챔피언 bin의 mSpellTags (scripts/_tmp/spelltags.json —
//        scripts/fetch-spelltags.cjs 산출물. research/raw/14-champion-bins.md)
//        → TRAIT_MAP 번역표로 props 어휘 14종에 사상.
//        + bin의 mCastType=1(유닛 대상 지정)을 targeted의 게임 데이터 근거로 병합.
//   2차: 태그가 침묵하는 속성(global/spin 전부, targeted/projectile/dash 등 일부)은
//        종전의 DDragon ko_KR 스킬 설명 키워드 매칭을 폴백으로 병합.
//   출처는 spells[i].propsSource로 표기: "traits"(태그만) | "merged"(태그+키워드 병합)
//        | "keywords"(태그 없는 슬롯 — 게임 데이터 자체에 mSpellTags 부재 7슬롯 등).
//
// 근사: 태그→props 번역과 병합 정책은 어휘 일치에 근거한 재구성이다. "증강 X가 태그 Y를
//       요구한다"는 명시 데이터는 클라이언트에 없음(research/raw/14 §4 주의). 키워드 층은
//       종전과 같이 한국어 설명 기반 근사치(과잉/과소 태깅 가능).
//
// 실행:
//   node scripts/enrich-champions.cjs           # docs/data/champions.json 갱신
//   node scripts/enrich-champions.cjs --audit   # prop별 매칭 스킬 전수 출력(파일 미변경)
//   node scripts/enrich-champions.cjs --dry     # 파일 미변경, 통계만
//
// 입력: scripts/_tmp/championFull_ko.json (refresh-champions.md 절차로 재다운로드 가능)
//       scripts/_tmp/spelltags.json (node scripts/fetch-spelltags.cjs 로 생성)
'use strict';
const fs = require('fs');
const path = require('path');

const TMP = path.join(__dirname, '_tmp', 'championFull_ko.json');
const TAGS = path.join(__dirname, '_tmp', 'spelltags.json');
const OUT = path.join(__dirname, '..', 'docs', 'data', 'champions.json');
const AUDIT = process.argv.indexOf('--audit') !== -1;
const DRY = process.argv.indexOf('--dry') !== -1;

// ---------- 텍스트 정리 ----------
function strip(s) {
  if (!s) return '';
  return s
    .replace(/\{\{[^}]*\}\}/g, ' ') // 툴팁 변수 플레이스홀더 제거
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------- 어휘 (계약 순서 고정 — spells[i].props / abilityProps 정렬 기준) ----------
const VOCAB = [
  'projectile', 'dash', 'knockback', 'targeted', 'aoe', 'shield', 'heal',
  'stealth', 'global', 'spin', 'immobilize', 'terrain', 'empoweredAttack', 'durationEffect',
];

// ---------- Trait_* → props 번역표 (research/raw/14-champion-bins.md §2.2·§4) ----------
// 번역표에 없는 태그는 무시하되 실행 로그에 남긴다 (예: Trait_Ultimate·Trait_DamageAbility
// 같은 메타 태그, Trait_NotBenefitFromHaste처럼 어휘 14종 밖의 판정용 태그).
const TRAIT_MAP = {
  Trait_ImmobilizingCCSpell: 'immobilize',   // 속박·기절·에어본 계열 하드 CC (14 §4: 굶주린 속박 게이트)
  Trait_ImmobilizingCCAbility: 'immobilize',
  Trait_KnockBack: 'knockback',              // 연쇄 반응 게이트 (14 §3 예시3)
  Trait_CreateTerrain: 'terrain',            // 보유자 전수 6명 = 지형 생성됨 적격 목록 (14 §3 예시3)
  Trait_Shield: 'shield',                    // 보강(Bolstered) 게이트
  // Trait_PassiveShield(갈리오 W 1건)는 미사상 — 라이엇이 Trait_Shield와 구분해 둔 것을 존중
  Trait_ActiveHeal: 'heal',
  Trait_SelfHeal: 'heal',
  PositiveEffect_EmpowerAttack: 'empoweredAttack', // 꽁!·2연속 공격 게이트
  Trait_AttackBuff_Duration: 'durationEffect',     // 지속형 공격 강화 (출발할 시간류 게이트의 일부)
  Trait_PlayerSelectedDashDirection: 'dash', // 방향 지정 대시 (근사: 대상 지정 대시는 이 태그가 없어
                                             // 키워드 병합으로 보완 — 잭스 Q·리 신 Q 등)
  PositiveEffect_Teleport: 'dash',           // 근사: 블링크류(에코 R·카타리나 E) — 키워드 dash가
                                             // 순간이동·점멸을 포함해 온 관행과 일치시킴
  Trait_Ranged_StopsFirstHit: 'projectile',  // 첫 적중 소멸 투사체
  Trait_Ranged_Piercing: 'projectile',       // 관통 투사체
  Trait_Ranged_Zone: 'projectile',           // 근사: 장판형 원거리 — 14 §4가 투사체 증강 행에 포함
  Trait_AoE: 'aoe',
  Trait_Invisibility: 'stealth',
  Trait_Camouflage: 'stealth',
};

// 태그가 신뢰 가능한 속성 — 슬롯에 태그 데이터가 있으면 이 속성들의 키워드 판정은 버린다
// ("데이터가 스스로 말하게"). 실측 대조 결과 키워드 오탐 제거 효과가 큼:
//   terrain: 요릭 W(파괴 가능 벽) 탈락·아지르 R 추가 → 보유 6명 정확 일치 (계약 표본 기준)
//   immobilize: 애니 R(패시브 의존 기절)·둔화/그라운딩류 오탐 21건 탈락, 알리스타 W 등 25건 발굴
//   aoe: 실제 게임 태그가 키워드보다 압도적으로 완전(주 슬롯 413건)
const TRAIT_AUTHORITATIVE = ['immobilize', 'terrain', 'shield', 'heal', 'aoe', 'stealth'];
// 병합 속성 — 태그만으로는 과소(대상 지정 대시, 에어본 넉백, 지속 효과 일반)라 키워드와 합집합:
//   dash: Trait는 방향 지정형만 표기(잭스 Q 등 대상 지정 대시 누락 75건 확인)
//   knockback: Trait_KnockBack는 에어본(넉업)을 안 찍음 — 말파이트 R 실측 기준 키워드 유지
//   projectile/empoweredAttack/durationEffect: 태그 어휘가 부분 집합
//   targeted: 태그 어휘엔 없으나 bin의 mCastType=1(대상 지정 — fetch-spelltags.cjs 캘리브레이션
//     주석 참조)이 게임 데이터 근거. 근사: mCastType 미보유 스펠이 다수(라이즈 W 등)라
//     키워드·수동 보정과 병합 (SpellVolley 26.17 empirical 16챔피언이 전부 커버됨을 확인)
// global/spin: 태그·castType 어휘에 대응 없음 — 키워드 전담
const TRAIT_SILENT = VOCAB.filter(function (p) { return TRAIT_AUTHORITATIVE.indexOf(p) === -1; });

// ---------- 키워드 패턴 (한국어 원문 기준. 전부 "근사:" — 과잉/과소 태깅 가능) ----------
// 판정 원칙:
//  - immobilize = 하드 CC만(기절/속박/제압/매혹/공포/도발/수면/석화/끌기/에어본). 둔화·침묵은 제외
//    (근거: Ravenous Bind 등 immobilize 게이트 = 속박/그라운딩 계열 — eligibility-notes classBias.immobilize)
//  - 띄움(에어본)은 knockback + immobilize 둘 다로 판정 (말파이트 R 기준. 근사: 순수 밀치기는 knockback만)
//  - 조건부 CC(진 W 속박 등)도 포함 — 실제 게임도 진 W를 속박 게이트에 포함하는 것으로 근사
//  ※ v2: 태그 있는 슬롯에서는 TRAIT_AUTHORITATIVE 속성의 키워드 판정이 무시됨 (위 주석)
const PATTERNS = {
  // 투사체: "투사체를 막/파괴"(야스오 W·브라움 E 등 차단기)는 제외, "공중으로 날려"는 넉업 문구
  projectile: /투사체(?!를 ?(막|파괴|없애))|발사|쏘아|쏩니다|쏴|(?<!공중으로 )(?<!공중에 )날려|날린|내뿜|던지|던져|던집|던진|방출/,
  // 대시/도약/점멸. "순간이동" 포함(이즈리얼 E·카타리나 E·야스오 R 등 블링크).
  // 제외: "돌진을 막/저지"(뽀삐 W), "돌진하는 적"(대시 차단기), "돌진하거나"(탈리야 E 반응 지대)
  dash: /돌진(?!을 ?(막|저지))(?!하는 적)(?!하거나)|도약|뛰어들|뛰어올|뛰어넘|급습|돌격|질주|순간이동|점멸/,
  // "공중으로/공중에"는 CC 동사 결합형만 — "도끼가 공중으로 튕깁니다"(드레이븐 Q),
  // "공중으로 올라간 다음"(엘리스 E 자기 상승) 오탐 방지. 단독 "띄워"는 "구체를 띄워"(럭스 E)
  // 같은 오브젝트 배치 오탐이 있어 "띄워 올-" 결합형만. 미니언/몬스터 한정 밀치기(세주아니 W)는 제외
  knockback: /밀쳐|(?<!(미니언|몬스터)[^.]{0,12})밀어내|(?<!(미니언|몬스터)[^.]{0,12})밀어냅|띄워 ?올|공중(으로|에) ?(띄워|띄웁|띄운|날려|던져|떠오)/,
  // 대상 지정: "대상으로 지정할 수 없는"(언타게터블), "지정한 위치"(지면 지정),
  // "대상을 지정한 방향으로"(레나타 Q 재사용 투척)는 제외
  targeted: /지정한 (적|대상|아군)|지정된 (적|대상)|대상을 지정(?!할 수 없)(?!한 방향)|적 챔피언을 지정/,
  aoe: /광역|범위 내|주변의 적|주위의 적|주변 적|주위 적|근처 적|주변 유닛|주위 유닛|적들에게|자신을 중심으로|주위로 휘둘러|충격파|폭발하여|폭발하며/,
  shield: /보호막/,
  // 회복: 기력/마나 회복, "회복량/회복 효과"(수치 증폭)는 제외. 흡혈/생명력 흡수 포함(셀프힐 근사)
  heal: /(?<!(기력|마나|자원)[을를이가]? ?)회복(?! ?효과)(?!량)|치유|흡혈|생명력 흡수/,
  // 제외: "은신 상태가 아니-/은신하지 않-/은신한 유닛(적)을 드러-" — 은신 '해제' 문구(다이애나 Q·코그모 R·리 신 E 등)
  stealth: /은신(?! ?상태가 아[니닌닐])(?!하지 않)(?!한 (유닛|적))|투명|모습을 감추|위장/,
  // 전역 표현이 설명에 없는 전역 궁(애쉬 R 등)은 OVERRIDES로 보충.
  // "모든 적 챔피언"류 문구는 오탐이 많아(시비르 Q 관통, 파이크 R 영역) 패턴에 넣지 않음
  global: /전 지역|맵 어디|맵 어느 위치든|맵 전체|맵을 가로지|맵에 있는 모든|거리와 상관없이|거리와 관계없이|어디든지 이동|어디에서든|전장 어디/,
  spin: /회전/,
  // 하드 CC. "미니언…공포"(아트록스 R — 미니언 한정 공포)는 제외
  // 에어본(띄움)은 하드 CC로 포함. 미니언/몬스터 한정 CC(아트록스 R 공포, 클레드 E 끌기)는 제외
  immobilize: /기절|속박|구속|제압|매혹|도발|(?<!미니언[^.]{0,8})공포|수면|잠들|잠재|재웁|석화|(?<!(미니언|몬스터)[^.]{0,12})끌어당|끌려가|(제자리에 |못하도록 )?묶[입어는]|얼립|띄워 ?올|공중(으로|에) ?(띄워|띄웁|띄운|날려|던져|떠오)|이동 스킬을 사용할 수 없/,
  // 통과 가능한 벽(카서스 W·마오카이 R·럼블 R)과 스킬 장벽(녹턴 W "장벽")은 지형이 아님 —
  // v2: 태그 있는 슬롯은 Trait_CreateTerrain이 전담하므로 이 패턴은 태그 없는 슬롯 폴백 전용
  terrain: /(?<![장방])벽[을이] (만들|생성|세우|세워|세웁|소환)|벽으로 둘러|지나갈 수 없는 (벽|얼음)|얼음 벽|(용암|얼음|돌|바위) ?돌?기둥|지형을 (생성|만들)/,
  empoweredAttack: /다음 기본 공격|다음 공격|기본 공격[을이] 강화|강화된 기본 공격/,
  // durationEffect는 문장 단위 판정 (아래 hasDurationEffect) — "기본 지속 효과"(패시브 표기)와 구분
  durationEffect: null,
};

// 근사: durationEffect = "일정 시간 유지되는 효과를 만드는 스킬" — 같은 문장에
// [지속 시간 표현]과 [버프/소환/유지 표현]이 함께 있으면 참. 토글/전환 스킬도 참.
// (It's Go Time·Pin Cushion·Lil' Extra Help 게이트용 — eligibility-notes abilityAugments)
const DUR_MARK = /(초|분) ?동안|초간|잠시 동안|잠깐 동안|일정 시간|지속 ?시간 동안|동안 유지|동안 지속/;
const DUR_EFFECT = /증가|상승|오르|강화|얻습|얻고|얻으|변신|변합|유지되|유지됩|지속되|지속됩|소환|생성|활성화|충전|면역|흡수하는/;
const DUR_TOGGLE = /활성화\/비활성화|토글|전환합니다|변환합니다/;
function hasDurationEffect(text) {
  if (DUR_TOGGLE.test(text)) return true;
  const sentences = text.split(/(?<=[.!?])\s+/);
  for (let i = 0; i < sentences.length; i++) {
    if (DUR_MARK.test(sentences[i]) && DUR_EFFECT.test(sentences[i])) return true;
  }
  return false;
}

// ---------- dmg (피해 유형) ----------
// 근사: dmg = DDragon championFull info.attack/info.magic 비교로 산출한 주 피해 유형.
//   attack - magic >= 3 → 'ad', magic - attack >= 3 → 'ap', 그 외 → 'mixed'
//   (class-fit 계약 기준. info는 라이엇의 1~10 지표라 실제 빌드 성향과 다를 수 있음)
function computeDmg(info) {
  if (!info || typeof info.attack !== 'number' || typeof info.magic !== 'number') return 'mixed';
  if (info.attack - info.magic >= 3) return 'ad';
  if (info.magic - info.attack >= 3) return 'ap';
  return 'mixed';
}
// dmg 수동 보정 — info 격차 3 미만이라 mixed로 떨어지지만 실제 피해 유형이 명백한 챔피언만.
// (계약 표본 검증 기준. 근거 주석 필수)
const DMG_OVERRIDES = {
  // 에코: info attack 5/magic 7 → 격차 2로 mixed 판정되지만 전 스킬이 AP 계수인
  // AP 암살자 — 계약 표본이 ap를 요구 (class-fit 계약 표본 검증표)
  Ekko: 'ap',
};

// ---------- 수동 보정 (표본 대조로 확정한 항목만. add/remove 모두 근거 주석 필수) ----------
// key: "챔피언id.스킬키" → { add: [...], remove: [...] }
// v2 정리: 실제 태그가 같은 결론을 내는 항목은 제거했다 ("데이터가 스스로 말하게"):
//  - Zed.W add dash → 삭제 (실태그 Trait_PlayerSelectedDashDirection 보유 — 실측과 일치)
//  - Yasuo.W/Karthus.W/Maokai.R/Rumble.R/Ornn.E remove terrain → 삭제 (terrain은
//    태그 전담이 됐고 다섯 슬롯 모두 Trait_CreateTerrain 없음)
//  - Jhin.E remove stealth → 삭제 (stealth 태그 전담, 진 E에 Invisibility/Camouflage 없음)
// 남은 dash remove는 dash가 병합 속성(키워드 오탐 재유입)이라 여전히 필요하다.
const OVERRIDES = {
  // 애쉬 R: 전역 사거리인데 설명에 전역 표현 없음 → global 수동 추가 (표본 검증 기준)
  'Ashe.R': { add: ['global'] },
  // 전역/준전역 궁극기 — 설명 텍스트에 전역 표현이 없는 것들 수동 지정 (근사: LoL 위키 global 분류)
  'Draven.R': { add: ['global'] },
  'Ezreal.R': { add: ['global'] },
  'Gangplank.R': { add: ['global'] },
  'Pantheon.R': { add: ['global'] },
  'Shen.R': { add: ['global'] },
  'Nocturne.R': { add: ['global'] },
  // v2.1 정리: Brand.R·Malphite.Q add targeted → 삭제 (bin mCastType=1이 데이터로 말함)
  // 소라카 W: 아군 클릭 대상 회복인데 "지정" 표현 없고 bin에 mCastType도 미보유 →
  // targeted 수동 추가 유지 (표본 검증 기준)
  'Soraka.W': { add: ['targeted'] },
  // 애쉬 Q: 지속형 기본 공격 강화(연사 화살)인데 키워드("다음 기본 공격"류)가 침묵하고
  // 태그도 Trait_AttackBuff_Duration뿐(→durationEffect) — empoweredAttack 수동 추가.
  // Trait_AttackBuff_Duration→empoweredAttack 전역 번역은 Bonk/DoubleStrike 풀을 60여
  // 슬롯 과잉 확장하므로 채택 안 함. 근거: ability-augment-map.json LittleExtraHelp×Ashe Q
  // offered(empirical, mayhemmeta ≥100판) — real-mapping 계약 검증 기준 1
  'Ashe.Q': { add: ['empoweredAttack'] },
  // Spin To Win 위키 적격 목록 중 "회전" 키워드가 설명에 없는 스킬 (근거: eligibility-notes
  // otherRestrictions ARAM_SpinToWin — 아리 W·R, 다리우스 Q, 제드 E 명시. 전체 목록은
  // augments.json championWhitelist가 담당하므로 여기는 명시된 것만)
  'Darius.Q': { add: ['spin'] },
  'Zed.E': { add: ['spin'] },
  'Ahri.W': { add: ['spin'] },
  'Ahri.R': { add: ['spin'] },
  'Katarina.R': { add: ['spin'] }, // 죽음의 연꽃 — 위키 Spin 계열 통례 (근사)
  'Rammus.Q': { add: ['spin'] }, // 대회전(구르기) — 회전 취급 (근사). R의 "대회전 상태" 언급은 Q 참조라 제거
  'Rammus.R': { remove: ['spin'] },
  'Draven.W': { remove: ['spin'] }, // "회전 도끼를 회수하면" — Q 참조 문구
  // 스킬 텍스트가 다른 스킬/소환수/구체를 서술해 dash로 오탐된 것들 제거 (dash는 병합 속성이라
  // 키워드 오탐이 재유입됨 — v2에서도 유지)
  // 다리우스 R: "뛰어올라"로 dash 오탐 — 실측 대시 게이트 패턴 001100(말파이트 R·제드 W만)에서
  // 다리우스 R은 부적격 (근거: research/raw/11-empirical-pools.md §3-5, test-fidelity 기준2).
  // v2 확인: 실태그에도 대시류 태그 없음(MoveBlock뿐) — 실측·태그 결론 일치, 키워드 오탐만 차단
  'Darius.R': { remove: ['dash'] },
  'Jax.W': { remove: ['dash'] },      // "도약 공격 시" — Q 참조
  'Orianna.Q': { remove: ['dash'] },  // 구체가 돌진 — 챔피언 이동 아님
  'Teemo.W': { remove: ['dash'] },    // "전력으로 질주" — 이동 속도 증가일 뿐
  'Yorick.E': { remove: ['dash'] },   // "안개 망령은 …뛰어들" — 소환수 도약
  'Samira.Q': { remove: ['dash'] },   // "거침없는 질주 도중" — E 참조
};

// ---------- 실행 ----------
const full = JSON.parse(fs.readFileSync(TMP, 'utf8'));
if (!fs.existsSync(TAGS)) {
  console.error('scripts/_tmp/spelltags.json 없음 — 먼저 node scripts/fetch-spelltags.cjs 를 실행하세요.');
  process.exit(1);
}
const spellTags = JSON.parse(fs.readFileSync(TAGS, 'utf8')).champions;
const out = JSON.parse(fs.readFileSync(OUT, 'utf8'));

const auditRows = {}; // prop → ["Ashe R (마법의 수정화살)"...]
VOCAB.forEach(function (p) { auditRows[p] = []; });
const unknownTraits = {}; // 번역표 밖 태그 → 발생 수 (무시하되 로그)
const sourceDist = { traits: 0, merged: 0, keywords: 0 };

let missing = [];
for (const champ of out.champions) {
  const src = full.data[champ.id];
  if (!src) { missing.push(champ.id); continue; }
  champ.dmg = DMG_OVERRIDES[champ.id] || computeDmg(src.info);
  const union = [];
  const tagEntry = spellTags[champ.id];
  champ.spells.forEach(function (spell, i) {
    const s = src.spells[i];
    const text = s ? strip(s.description) + ' ' + strip(s.tooltip) : '';
    const slotTags = (tagEntry && tagEntry.slots && tagEntry.slots[spell.key]) || null;
    const tagged = Array.isArray(slotTags) && slotTags.length > 0;

    // 1층: 태그 번역
    const traitProps = [];
    if (tagged) {
      for (const t of slotTags) {
        const p = TRAIT_MAP[t];
        if (p) { if (traitProps.indexOf(p) === -1) traitProps.push(p); }
        else unknownTraits[t] = (unknownTraits[t] || 0) + 1;
      }
    }
    // 1층 보강: bin mCastType=1 = 유닛 대상 지정 (게임 데이터 — 태그와 같은 층위로 취급.
    // 캘리브레이션·근사 한계는 fetch-spelltags.cjs 주석 참조). 같은 스펠이 mMissileSpec을
    // 보유하면 projectile도 — SpellVolley의 공식 정의("unit-targeted and fires a missile",
    // raw/02 §Tripleshot)와 정확히 일치하는 게임 데이터 조합 (엘리스 Q·잔나 W가
    // 키워드 침묵으로 누락됐던 것을 26.17 empirical offered가 반증 — real-mapping 기준 1)
    const castType = tagEntry && tagEntry.castTypes ? tagEntry.castTypes[spell.key] : null;
    const hasMissile = !!(tagEntry && tagEntry.missiles && tagEntry.missiles[spell.key]);
    if (castType === 1) {
      if (traitProps.indexOf('targeted') === -1) traitProps.push('targeted');
      if (hasMissile && traitProps.indexOf('projectile') === -1) traitProps.push('projectile');
    }

    // 2층: 키워드 (태그 슬롯에선 TRAIT_AUTHORITATIVE 속성 판정을 버림)
    const kwCandidates = tagged ? TRAIT_SILENT : VOCAB;
    const kwProps = [];
    for (const prop of kwCandidates) {
      let hit = false;
      if (prop === 'durationEffect') hit = hasDurationEffect(text);
      else hit = PATTERNS[prop].test(text);
      if (hit) kwProps.push(prop);
    }

    const props = traitProps.slice();
    kwProps.forEach(function (p) { if (props.indexOf(p) === -1) props.push(p); });

    // 수동 보정 적용
    const ov = OVERRIDES[champ.id + '.' + spell.key];
    let ovAdded = false;
    if (ov) {
      (ov.add || []).forEach(function (p) {
        if (props.indexOf(p) === -1) { props.push(p); ovAdded = true; }
      });
      (ov.remove || []).forEach(function (p) {
        const idx = props.indexOf(p);
        if (idx !== -1) props.splice(idx, 1);
      });
    }
    props.sort(function (a, b) { return VOCAB.indexOf(a) - VOCAB.indexOf(b); });
    spell.props = props;

    // 출처 표기: 태그 없는 슬롯 = keywords / 태그 슬롯 = 전 props가 태그 유래면 traits,
    // 키워드·수동 보정이 1개라도 보태졌으면 merged
    const nonTrait = props.some(function (p) { return traitProps.indexOf(p) === -1; });
    spell.propsSource = !tagged ? 'keywords' : ((nonTrait || ovAdded) ? 'merged' : 'traits');
    sourceDist[spell.propsSource]++;

    props.forEach(function (p) {
      if (union.indexOf(p) === -1) union.push(p);
      auditRows[p].push(champ.id + ' ' + spell.key + ' (' + spell.nameKo + ')');
    });
  });
  union.sort(function (a, b) { return VOCAB.indexOf(a) - VOCAB.indexOf(b); });
  champ.abilityProps = union; // 계약: abilityProps = 전 스킬 props 합집합 (패시브 미포함)
}

if (missing.length) {
  console.error('DDragon 데이터에 없는 챔피언: ' + missing.join(', '));
  process.exit(1);
}

out._note = 'spells[i].props는 CommunityDragon 챔피언 bin의 스킬 태그(mSpellTags — research/raw/14-champion-bins.md)와 mCastType=1(대상 지정 → targeted)을 1차 소스로 번역하고, 태그가 침묵하는 속성(global/spin 전부와 targeted/dash/knockback/projectile/empoweredAttack/durationEffect 일부)은 DDragon ko_KR 설명 키워드 매칭을 폴백 병합한 근사치(생성: scripts/enrich-champions.cjs ← scripts/fetch-spelltags.cjs. 번역표·병합 정책·수동 보정은 스크립트 주석 참조). 출처는 spells[i].propsSource(traits|merged|keywords)로 표기. abilityProps = 전 스킬 props 합집합(패시브 미포함). immobilize/terrain/shield/heal/aoe/stealth는 게임 태그 전담(태그 없는 7슬롯만 키워드). short/passiveKo는 설명 요약 발췌. dmg(ad/ap/mixed)는 DDragon info.attack/magic 격차 3 기준 근사치(수동 보정: 에코=ap).';

if (AUDIT) {
  for (const p of VOCAB) {
    console.log('\n=== ' + p + ' (' + auditRows[p].length + ') ===');
    console.log(auditRows[p].join('\n'));
  }
  process.exit(0);
}

// 통계
const dist = {};
VOCAB.forEach(function (p) {
  dist[p] = {
    spells: auditRows[p].length,
    champions: out.champions.filter(function (c) { return c.abilityProps.indexOf(p) !== -1; }).length,
  };
});
const noProps = out.champions.filter(function (c) { return c.abilityProps.length === 0; }).map(function (c) { return c.id; });
console.log('champions: ' + out.champions.length);
console.log('prop\tspells\tchampions');
VOCAB.forEach(function (p) { console.log(p + '\t' + dist[p].spells + '\t' + dist[p].champions); });
console.log('propsSource 분포: ' + JSON.stringify(sourceDist));
console.log('abilityProps 빈 챔피언: ' + (noProps.length ? noProps.join(', ') : '없음'));
const ut = Object.keys(unknownTraits).sort(function (a, b) { return unknownTraits[b] - unknownTraits[a]; });
console.log('번역표 밖 태그(무시, ' + ut.length + '종): ' + ut.map(function (t) { return t + '×' + unknownTraits[t]; }).join(', '));
const dmgDist = {};
out.champions.forEach(function (c) { dmgDist[c.dmg] = (dmgDist[c.dmg] || 0) + 1; });
console.log('dmg 분포: ' + JSON.stringify(dmgDist));

if (!DRY) {
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1), 'utf8');
  console.log('\nwrote ' + OUT);
}
