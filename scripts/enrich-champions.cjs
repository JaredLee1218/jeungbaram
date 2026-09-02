// Node 14 CommonJS — docs/data/champions.json 스킬별 props 부여 + abilityProps 재계산
//
// 근사: spells[i].props는 DDragon championFull ko_KR의 스킬 설명(description+tooltip)
//       한국어 키워드 매칭으로 판정한 근사치다. 실제 게임의 챔피언×스킬 적격 태그는
//       100% 서버 전용이라 재현 불가(research/raw/10-eligibility-datamine.md §1.2).
//       설계 근거: research/AUGMENT-POOLS-STUDY.md §3, research/data/eligibility-notes.json
//
// 실행:
//   node scripts/enrich-champions.cjs           # docs/data/champions.json 갱신
//   node scripts/enrich-champions.cjs --audit   # prop별 매칭 스킬 전수 출력(파일 미변경)
//   node scripts/enrich-champions.cjs --dry     # 파일 미변경, 통계만
//
// 입력: scripts/_tmp/championFull_ko.json (없으면 refresh-champions.md 절차로 재다운로드:
//   https://ddragon.leagueoflegends.com/cdn/16.17.1/data/ko_KR/championFull.json)
'use strict';
const fs = require('fs');
const path = require('path');

const TMP = path.join(__dirname, '_tmp', 'championFull_ko.json');
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

// ---------- 키워드 패턴 (한국어 원문 기준. 전부 "근사:" — 과잉/과소 태깅 가능) ----------
// 판정 원칙:
//  - immobilize = 하드 CC만(기절/속박/제압/매혹/공포/도발/수면/석화/끌기/에어본). 둔화·침묵은 제외
//    (근거: Ravenous Bind 등 immobilize 게이트 = 속박/그라운딩 계열 — eligibility-notes classBias.immobilize)
//  - 띄움(에어본)은 knockback + immobilize 둘 다로 판정 (말파이트 R 기준. 근사: 순수 밀치기는 knockback만)
//  - 조건부 CC(진 W 속박 등)도 포함 — 실제 게임도 진 W를 속박 게이트에 포함하는 것으로 근사
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
  // 통과 가능한 벽(카서스 W·마오카이 R·럼블 R)과 스킬 장벽(녹턴 W "장벽")은 지형이 아님 — 제외/OVERRIDES.
  // 기둥은 색·재질 명시형만(트런들 E 얼음 기둥, 오른 Q 용암 기둥). 브랜드 W "화염 기둥"은 지형 아님
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

// ---------- 수동 보정 (표본 대조로 확정한 항목만. add/remove 모두 근거 주석 필수) ----------
// key: "챔피언id.스킬키" → { add: [...], remove: [...] }
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
  // 제드 W: 그림자는 질주하지만 제드 본인 이동은 재사용 위치 교대(블링크).
  // 실측에서 대시 게이트 증강 5종이 정확히 "말파이트 R·제드 W"에 바인딩됨 → 게임은 제드 W를
  // 대시로 취급. dash로 판정한다 (근거: research/raw/11-empirical-pools.md §3-5)
  'Zed.W': { add: ['dash'] },
  // Tripleshot(targeted+projectile AND) 실측 적격 = 브랜드 R·말파이트 Q 뿐 —
  // 두 스킬 다 대상 클릭형인데 설명에 "지정" 표현 없음 → targeted 수동 추가
  // (근거: eligibility-notes abilityAugments SpellVolley, research/raw/11 §3-9)
  'Brand.R': { add: ['targeted'] },
  'Malphite.Q': { add: ['targeted'] },
  // 소라카 W: 아군 클릭 대상 회복인데 "지정" 표현 없음 → targeted 수동 추가 (표본 검증 기준)
  'Soraka.W': { add: ['targeted'] },
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
  // 야스오 W: "투사체를 막아주는 벽" — 이동 불가 지형이 아니므로 terrain 제거
  'Yasuo.W': { remove: ['terrain'] },
  // 통과 가능한 벽/피해 지대 — 이동 차단 지형이 아니므로 terrain 제거
  'Karthus.W': { remove: ['terrain'] },   // "통행 가능한 벽" 명시
  'Maokai.R': { remove: ['terrain'] },    // 전진하는 속박 벽 — 통과 가능
  'Rumble.R': { remove: ['terrain'] },    // "화염의 벽" — 피해 지대
  'Ornn.E': { remove: ['terrain'] },      // "용암 기둥…파괴합니다" — 지형 파괴 문구(Q 참조)
  // 진 E: "은신 상태에 있다가"는 함정의 비가시성 서술 — 챔피언 은신이 아니므로 제거
  'Jhin.E': { remove: ['stealth'] },
  // 스킬 텍스트가 다른 스킬/소환수/구체를 서술해 dash로 오탐된 것들 제거
  'Jax.W': { remove: ['dash'] },      // "도약 공격 시" — Q 참조
  'Orianna.Q': { remove: ['dash'] },  // 구체가 돌진 — 챔피언 이동 아님
  'Teemo.W': { remove: ['dash'] },    // "전력으로 질주" — 이동 속도 증가일 뿐
  'Yorick.E': { remove: ['dash'] },   // "안개 망령은 …뛰어들" — 소환수 도약
  'Samira.Q': { remove: ['dash'] },   // "거침없는 질주 도중" — E 참조
};

// ---------- 실행 ----------
const full = JSON.parse(fs.readFileSync(TMP, 'utf8'));
const out = JSON.parse(fs.readFileSync(OUT, 'utf8'));
const SPELL_KEYS = ['Q', 'W', 'E', 'R'];

const auditRows = {}; // prop → ["Ashe R (마법의 수정화살)"...]
VOCAB.forEach(function (p) { auditRows[p] = []; });

let missing = [];
for (const champ of out.champions) {
  const src = full.data[champ.id];
  if (!src) { missing.push(champ.id); continue; }
  const union = [];
  champ.spells.forEach(function (spell, i) {
    const s = src.spells[i];
    const text = s ? strip(s.description) + ' ' + strip(s.tooltip) : '';
    const props = [];
    for (const prop of VOCAB) {
      let hit = false;
      if (prop === 'durationEffect') hit = hasDurationEffect(text);
      else hit = PATTERNS[prop].test(text);
      if (hit) props.push(prop);
    }
    // 수동 보정 적용
    const ov = OVERRIDES[champ.id + '.' + spell.key];
    if (ov) {
      (ov.add || []).forEach(function (p) { if (props.indexOf(p) === -1) props.push(p); });
      (ov.remove || []).forEach(function (p) {
        const idx = props.indexOf(p);
        if (idx !== -1) props.splice(idx, 1);
      });
    }
    props.sort(function (a, b) { return VOCAB.indexOf(a) - VOCAB.indexOf(b); });
    spell.props = props;
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

out._note = 'spells[i].props와 abilityProps(=전 스킬 props 합집합, 패시브 미포함)는 DDragon ko_KR 스킬 설명(description+tooltip) 한국어 키워드 매칭으로 판정한 근사치이며 실제 게임 메커니즘과 다를 수 있음(생성: scripts/enrich-champions.cjs — 판정 규칙·수동 보정 주석 참조). immobilize는 하드 CC만(둔화·침묵 제외)이며 조건부 CC(진 W 속박 등)도 포함. short/passiveKo는 설명 요약 발췌.';

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
console.log('abilityProps 빈 챔피언: ' + (noProps.length ? noProps.join(', ') : '없음'));

if (!DRY) {
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1), 'utf8');
  console.log('\nwrote ' + OUT);
}
