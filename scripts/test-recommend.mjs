// scripts/test-recommend.mjs — recommend.js 합성 fixture 검증 (Node v14.17.4 호환)
// 실행: node scripts/test-recommend.mjs
// 케이스: ① combo 정확 매칭 ② tagRules 태그 규칙 ③ 매칭 0건 폴백 (+방어적 입력)
//         ④ class-fit(fitScore) ⑤ previewAugment ⑥ routeTargets(목표 집합 T)
//         ⑦ buildDossier(챔피언 꿀잼 사전 셰이퍼) — SPEC-day2 §2·§3-3
//         ⑧ displayTier(클래스 문맥 티어) — 실데이터(docs/data) 기반 전수조사 계약 검증
//         ⑨ buildDossier.recommended(추천 증강) — dex-recommended 계약 (시그니처 ∩ 풀
//           우선 + 문맥 S/A 보충, 풀 위반 시그니처 제외, 실데이터 173명 전수 회귀)
//
// 참고: 저장소에 package.json("type":"module")이 없어도 돌아가도록,
// docs/js/recommend.js 를 임시 디렉터리에 복사한 뒤 동적 import 한다.
// recommend.js가 './draft.js'를 import하므로(skillOdds 재사용 — SPEC-day2 §4 T2)
// draft.js도 함께 복사하고, .js를 ESM으로 읽히게 하는 package.json을 놓는다.

import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.join(here, "..", "docs", "js", "recommend.js");
const draftPath = path.join(here, "..", "docs", "js", "draft.js");
const tmpDir = path.join(os.tmpdir(), `jeungbaram-recommend-${process.pid}-${Date.now()}`);
const tmpPath = path.join(tmpDir, "recommend.js");

let pass = 0;
let fail = 0;
function ok(cond, label, detail) {
  if (cond) {
    pass += 1;
    console.log(`  ok  - ${label}`);
  } else {
    fail += 1;
    console.error(`  FAIL - ${label}` + (detail !== undefined ? ` :: ${JSON.stringify(detail)}` : ""));
  }
}

// ------------------------------------------------------------ 합성 fixture

const CHAMP_JAYCE = {
  id: "Jayce", key: 126, nameKo: "제이스", title: "미래의 수호자",
  tags: ["Fighter", "Marksman"], partype: "마나", usesMana: true, ranged: true, attackRange: 500,
  icon: "https://example.invalid/jayce.png",
  spells: [
    { key: "Q", nameKo: "천상의 강타", short: "도약 강타" },
    { key: "W", nameKo: "번개 질주", short: "공속 강화" },
    { key: "E", nameKo: "천둥 강타", short: "넉백" },
    { key: "R", nameKo: "수은 대포/망치", short: "형태 전환" },
  ],
  passiveKo: "형태 전환 시 추가 효과",
  abilityProps: ["projectile", "knockback"],
};

const CHAMP_ASHE = {
  id: "Ashe", key: 22, nameKo: "애쉬", title: "서리 궁수",
  tags: ["Marksman", "Support"], partype: "마나", usesMana: true, ranged: true, attackRange: 600,
  icon: "https://example.invalid/ashe.png",
  spells: [
    { key: "Q", nameKo: "궁사의 집중력", short: "공속 폭발" },
    { key: "W", nameKo: "일제 사격", short: "부채꼴 화살" },
    { key: "E", nameKo: "매 정찰병", short: "시야" },
    { key: "R", nameKo: "마법의 수정 화살", short: "글로벌 스턴" },
  ],
  passiveKo: "집중 공격",
  abilityProps: ["projectile", "global"],
};

const AUG_A = { apiName: "ARAM_LightningStrikes", nameKo: "번개 세례", tier: "gold", enabled: true, tags: ["onhit", "as"] };
const AUG_B = { apiName: "ARAM_UltRush", nameKo: "궁극기 폭주", tier: "prismatic", enabled: true, tags: ["ult", "aoe"] };
const AUG_C = { apiName: "ARAM_CritFrenzy", nameKo: "치명타 광란", tier: "gold", enabled: true, tags: ["crit", "as"] };
const AUG_D = { apiName: "ARAM_TankUp", nameKo: "철갑", tier: "silver", enabled: true, tags: ["tank", "shield"] };
const AUGMENTS = { patch: "26.17", augments: [AUG_A, AUG_B, AUG_C, AUG_D] };

const ITEMS = {
  version: "16.17.1",
  items: [
    { id: 1001, nameKo: "몰락한 왕의 검", tags: ["onhit", "ad", "as"], icon: "https://example.invalid/1001.png" },
    { id: 1002, nameKo: "구인수의 격노검", tags: ["onhit", "as"], icon: "https://example.invalid/1002.png" },
    { id: 1003, nameKo: "무한의 대검", tags: ["crit", "ad"], icon: "https://example.invalid/1003.png" },
    { id: 1004, nameKo: "가고일 돌갑옷", tags: ["tank", "shield"], icon: "https://example.invalid/1004.png" },
    { id: 1005, nameKo: "크라켄 학살자", tags: ["onhit", "as", "ad"], icon: "https://example.invalid/1005.png" },
    { id: 1006, nameKo: "루난의 허리케인", tags: ["onhit", "as", "aoe"], icon: "https://example.invalid/1006.png" },
    { id: 1007, nameKo: "라바돈의 죽음모자", tags: ["ap"], icon: "https://example.invalid/1007.png" },
  ],
};

const COMBO_JAYCE = {
  title: "번개 대포 제이스", champions: ["Jayce"],
  augments: ["ARAM_LightningStrikes", "ARAM_CritFrenzy"], matchType: "all",
  whyFun: "포탑처럼 서서 평타가 번개로 변합니다. 대포 폼 사거리에서 다 녹아요.",
  items: [1001, 1002], skills: "대포 폼 Q-E 가속 포격 후 평타 위주로 카이팅.",
  styleTags: ["무한딜", "온힛"], source: "kr",
};
const COMBO_ANYCHAMP = {
  title: "온힛 폭풍", champions: [],
  augments: ["ARAM_LightningStrikes"], matchType: "any",
  whyFun: "평타 한 대 한 대가 이벤트가 됩니다.",
  items: [1005], skills: "평타 사이사이 스킬 캔슬.",
  styleTags: ["온힛", "공속"], source: "en",
};
const COMBO_ALL_MISSING = {
  title: "매칭되면 안 되는 콤보(all인데 하나 부족)", champions: ["Jayce"],
  augments: ["ARAM_LightningStrikes", "ARAM_NotPicked"], matchType: "all",
  whyFun: "-", items: [1007], skills: "-", styleTags: ["원콤"], source: "kr",
};
const COMBO_OTHER_CHAMP = {
  title: "다른 챔피언 전용", champions: ["Teemo"],
  augments: ["ARAM_LightningStrikes"], matchType: "any",
  whyFun: "-", items: [1007], skills: "-", styleTags: ["도트딜"], source: "kr",
};

const TAG_RULES = [
  { ifAugmentTags: ["onhit"], ifChampTags: ["Marksman"], playstyle: "평타 위주 카이팅으로 온힛 효과를 최대한 굴리세요.", items: [1002, 1006], priority: 8 },
  { ifAugmentTags: ["tank"], ifChampTags: [], playstyle: "몸이 단단해지니 앞라인에서 버티세요.", items: [1004], priority: 3 },
  { ifAugmentTags: ["dot"], ifChampTags: [], playstyle: "매칭되면 안 되는 규칙.", items: [1007], priority: 10 },
];

const SYNERGIES = { combos: [COMBO_OTHER_CHAMP, COMBO_ALL_MISSING, COMBO_JAYCE, COMBO_ANYCHAMP], tagRules: TAG_RULES };

// ------------------------------------------------------------ class-fit 전용 fixture
// dmg("ad"|"ap"|"mixed")는 champions.json 신규 필드(병렬 제작 중) — 여기서는 합성으로 명시.
// 실데이터에 dmg가 없으면 recommend.js가 mixed로 취급하는 방어 동작도 아래에서 검증한다.

const CHAMP_ASHE_AD = {
  id: "Ashe", key: 22, nameKo: "애쉬", tags: ["Marksman"], dmg: "ad",
  ranged: true, attackRange: 600,
};
const CHAMP_BRAND = {
  id: "Brand", key: 63, nameKo: "브랜드", tags: ["Mage"], dmg: "ap",
  ranged: true, attackRange: 550,
};
const CHAMP_MALPHITE = {
  id: "Malphite", key: 54, nameKo: "말파이트", tags: ["Tank", "Fighter"], dmg: "mixed",
  ranged: false, attackRange: 125,
};
const CHAMP_NASUS = {
  id: "Nasus", key: 75, nameKo: "나서스", tags: ["Fighter", "Tank"], dmg: "ad",
  ranged: false, attackRange: 125,
};
const CHAMP_NODMG = { // dmg 필드 누락 → mixed 취급 방어 확인용
  id: "NoDmg", key: 999, nameKo: "무유형", tags: ["Marksman"], ranged: true,
};

const AUG_HEAL = { apiName: "ARAM_HealBloom", nameKo: "회복 만개", tier: "gold", enabled: true, tags: ["heal", "shield"] };
const AUG_AD = { apiName: "ARAM_BladeWaltz", nameKo: "칼춤", tier: "gold", enabled: true, tags: ["ad"] };
const AUG_AP2 = { apiName: "ARAM_ArcaneSurge", nameKo: "비전 쇄도", tier: "gold", enabled: true, tags: ["ap"] };
const AUGMENTS_FIT = { patch: "26.17", augments: [AUG_HEAL, AUG_AD, AUG_AP2, AUG_C, AUG_B] };

// 실제 items.json의 태그 조합을 본뜬 합성 아이템 (heal 단독 판정 금지 검증용 조합 포함)
const ITEMS_FIT = {
  version: "16.17.1",
  items: [
    { id: 2001, nameKo: "워모그의 갑옷", tags: ["tank", "heal"], icon: "" },
    { id: 2002, nameKo: "가고일 돌갑옷", tags: ["tank", "shield"], icon: "" },
    { id: 2003, nameKo: "구원", tags: ["ap", "heal", "shield", "mana", "support"], icon: "" },
    { id: 2004, nameKo: "피바라기", tags: ["ad", "heal", "shield"], icon: "" },
    { id: 2005, nameKo: "라바돈의 죽음모자", tags: ["ap"], icon: "" },
    { id: 2006, nameKo: "무한의 대검", tags: ["crit", "ad"], icon: "" },
    { id: 2007, nameKo: "몰락한 왕의 검", tags: ["onhit", "as", "ad", "heal", "cc"], icon: "" },
    { id: 2008, nameKo: "존야의 모래시계", tags: ["ap", "tank"], icon: "" },
    { id: 2009, nameKo: "정령의 형상", tags: ["tank", "heal", "move"], icon: "" },
  ],
};

const RULE_HEAL = { ifAugmentTags: ["heal"], ifChampTags: [], playstyle: "회복 증강을 살려 유지력을 극대화하세요.", items: [2001, 2003, 2004], priority: 5 };
const RULE_AD = { ifAugmentTags: ["ad"], ifChampTags: [], playstyle: "공격력 증강으로 화력을 끌어올리세요.", items: [2006, 2007, 2004], priority: 5 };
const RULE_CRIT = { ifAugmentTags: ["crit"], ifChampTags: [], playstyle: "치명타를 계속 굴리세요.", items: [2006], priority: 6 };
const RULE_AP = { ifAugmentTags: ["ap"], ifChampTags: [], playstyle: "주문력을 쌓으세요.", items: [2005, 2007], priority: 4 };

const COMBO_AP_NASUS = { // 챔피언 명시 combo — 큐레이션 신뢰(fitScore 무시) 검증용
  title: "AP 나서스", champions: ["Nasus"],
  augments: ["ARAM_UltRush"], matchType: "any",
  whyFun: "Q 대신 E와 R로 마법 피해를 쏟아붓는 변신 컨셉입니다.",
  items: [2005, 2008], skills: "E 선마 후 R 킨 상태로 E-평타 반복.",
  styleTags: ["주문력"], source: "kr",
};
const COMBO_ANY_AP = { // champions 빈 combo — fitScore 적용 대상 검증용
  title: "모두의 라바돈", champions: [],
  augments: ["ARAM_UltRush"], matchType: "any",
  whyFun: "궁 한 방이 커집니다.", items: [2005], skills: "궁 쿨마다 한 방.",
  styleTags: ["궁연발"], source: "en",
};

// ------------------------------------------------------------ 공통 반환 형태 검사

function checkShape(r, label) {
  ok(r && typeof r === "object", `${label}: 객체 반환`);
  ok(typeof r.headline === "string" && r.headline.length > 0, `${label}: headline 비어있지 않음`, r && r.headline);
  ok(typeof r.playstyle === "string" && r.playstyle.length > 0, `${label}: playstyle 비어있지 않음`);
  ok(Array.isArray(r.matchedCombos), `${label}: matchedCombos 배열`);
  ok(Array.isArray(r.items) && r.items.length <= 6, `${label}: items 배열(최대 6)`, r && r.items && r.items.length);
  ok((r.items || []).every((it) => it && it.id != null && typeof it.nameKo === "string" && typeof it.reason === "string" && it.reason.length > 0),
    `${label}: 아이템마다 id/nameKo/reason 존재`);
  ok(new Set((r.items || []).map((it) => it.id)).size === (r.items || []).length, `${label}: 아이템 중복 없음`);
  ok(typeof r.skills === "string" && r.skills.length > 0, `${label}: skills 비어있지 않음`);
  ok(typeof r.funScore === "number" && r.funScore >= 0 && r.funScore <= 100, `${label}: funScore 0~100`, r && r.funScore);
  ok(Array.isArray(r.styleTags) && r.styleTags.length > 0, `${label}: styleTags 비어있지 않음`, r && r.styleTags);
}

// ------------------------------------------------------------ 실행

async function main() {
  await fs.mkdir(tmpDir, { recursive: true });
  await fs.writeFile(path.join(tmpDir, "package.json"), '{"type":"module"}\n');
  await fs.copyFile(srcPath, tmpPath);
  await fs.copyFile(draftPath, path.join(tmpDir, "draft.js"));
  const mod = await import(pathToFileURL(tmpPath).href);
  // recommend가 import한 것과 같은 인스턴스의 draft 모듈 (케이스 6·7 대조용)
  const draftMod = await import(pathToFileURL(path.join(tmpDir, "draft.js")).href);
  const { recommend, previewAugment, routeTargets, buildDossier } = mod;
  ok(typeof recommend === "function", "recommend export 존재");
  ok(typeof previewAugment === "function", "previewAugment export 존재");
  ok(typeof routeTargets === "function", "routeTargets export 존재");
  ok(typeof buildDossier === "function", "buildDossier export 존재");

  // --- 케이스 1: combo 정확 매칭 (matchType all/any, 챔피언 필터, 겹침 순 정렬) ---
  console.log("\n[케이스 1] combo 정확 매칭");
  const r1 = recommend({
    champion: CHAMP_JAYCE,
    picked: [AUG_A, AUG_C, AUG_B],
    synergies: SYNERGIES,
    items: ITEMS,
    augments: AUGMENTS,
  });
  checkShape(r1, "case1");
  const titles = r1.matchedCombos.map((c) => c.title);
  ok(titles.includes("번개 대포 제이스"), "case1: all 매칭 combo 포함", titles);
  ok(titles.includes("온힛 폭풍"), "case1: 빈 champions(모든 챔피언) any 매칭 combo 포함", titles);
  ok(!titles.includes("매칭되면 안 되는 콤보(all인데 하나 부족)"), "case1: all인데 증강 부족한 combo 제외", titles);
  ok(!titles.includes("다른 챔피언 전용"), "case1: 다른 챔피언 combo 제외", titles);
  ok(r1.matchedCombos.length === 2, "case1: 정확히 2건 매칭", r1.matchedCombos.length);
  // combo 아이템이 최우선으로 앞에 온다 (1위 combo의 아이템이 items[0])
  const comboItemIds = [...COMBO_JAYCE.items, ...COMBO_ANYCHAMP.items];
  ok(comboItemIds.includes(r1.items[0].id), "case1: combo 아이템이 최우선", r1.items.map((i) => i.id));
  ok(r1.items.some((i) => i.id === 1001), "case1: 1위권 combo 아이템 포함", r1.items.map((i) => i.id));
  // skills는 매칭 combo의 skills를 반영
  ok(r1.skills === COMBO_JAYCE.skills || r1.skills === COMBO_ANYCHAMP.skills, "case1: skills가 combo에서 옴", r1.skills);
  // whyFun이 playstyle에 최우선 반영
  ok(r1.playstyle.includes(COMBO_JAYCE.whyFun) || r1.playstyle.includes(COMBO_ANYCHAMP.whyFun), "case1: whyFun 반영", r1.playstyle);
  // styleTags는 combo에서 옴 ("온힛"은 두 combo가 공유)
  ok(r1.styleTags.includes("온힛"), "case1: combo styleTags 반영", r1.styleTags);
  ok(r1.funScore >= 50, "case1: 매칭 2건이라 funScore 높음", r1.funScore);

  // 문자열 apiName 배열로 picked를 줘도 동작 (방어적 정규화)
  const r1s = recommend({
    champion: CHAMP_JAYCE,
    picked: ["ARAM_LightningStrikes", "ARAM_CritFrenzy"],
    synergies: SYNERGIES, items: ITEMS, augments: AUGMENTS,
  });
  ok(r1s.matchedCombos.some((c) => c.title === "번개 대포 제이스"), "case1: picked가 apiName 문자열이어도 매칭", r1s.matchedCombos.map((c) => c.title));

  // --- 케이스 2: combo 매칭 없음 → tagRules 점수화 ---
  console.log("\n[케이스 2] tagRules 태그 규칙");
  const r2 = recommend({
    champion: CHAMP_ASHE, // Jayce 전용 combo 매칭 안 됨
    picked: [AUG_C, AUG_D], // crit/as + tank/shield → onhit 규칙은 매칭 안 되고 tank 규칙만
    synergies: { combos: [COMBO_JAYCE, COMBO_OTHER_CHAMP], tagRules: TAG_RULES },
    items: ITEMS,
    augments: AUGMENTS,
  });
  checkShape(r2, "case2");
  ok(r2.matchedCombos.length === 0, "case2: combo 매칭 0건", r2.matchedCombos.length);
  ok(r2.items.some((i) => i.id === 1004), "case2: tank 규칙 아이템(1004) 포함", r2.items.map((i) => i.id));
  ok(!r2.items.some((i) => i.id === 1007), "case2: 매칭 안 된 dot 규칙 아이템(1007) 제외", r2.items.map((i) => i.id));
  ok(r2.playstyle.includes("앞라인에서 버티세요"), "case2: 매칭 규칙의 playstyle 반영", r2.playstyle);

  // priority 가중: onhit(priority 8) 규칙이 tank(priority 3)보다 먼저 아이템을 채움
  const r2b = recommend({
    champion: CHAMP_ASHE,
    picked: [AUG_A, AUG_D], // onhit 규칙(Marksman)과 tank 규칙 둘 다 매칭
    synergies: { combos: [], tagRules: TAG_RULES },
    items: ITEMS,
    augments: AUGMENTS,
  });
  const ids2b = r2b.items.map((i) => i.id);
  ok(ids2b.indexOf(1002) !== -1 && ids2b.indexOf(1004) !== -1, "case2: 두 규칙 아이템 모두 포함", ids2b);
  ok(ids2b.indexOf(1002) < ids2b.indexOf(1004), "case2: priority 높은 규칙 아이템이 먼저", ids2b);
  ok(r2b.playstyle.includes("카이팅"), "case2: 최고 점수 규칙 playstyle 우선", r2b.playstyle);
  ok(r2b.funScore < r1.funScore, "case2: 정확 매칭 없으니 case1보다 funScore 낮음", [r2b.funScore, r1.funScore]);

  // --- 케이스 3: 매칭 0건 폴백 (combo·규칙 모두 없음 / 데이터 자체가 빈약) ---
  console.log("\n[케이스 3] 빈 매칭 폴백");
  const r3 = recommend({
    champion: CHAMP_ASHE,
    picked: [AUG_B], // ult/aoe → 어떤 combo·규칙과도 매칭 안 됨
    synergies: { combos: [COMBO_JAYCE], tagRules: [TAG_RULES[2]] },
    items: ITEMS,
    augments: AUGMENTS,
  });
  checkShape(r3, "case3");
  ok(r3.matchedCombos.length === 0, "case3: 매칭 0건", r3.matchedCombos.length);
  ok(r3.items.length > 0, "case3: 그래도 champion tags 기반 아이템 추천", r3.items.map((i) => i.id));
  ok(r3.funScore > 0 && r3.funScore < 50, "case3: 낮지만 0은 아닌 funScore", r3.funScore);
  ok(r3.skills.includes("마법의 수정 화살"), "case3: 스킬 폴백이 챔피언 R 언급", r3.skills);

  // 방어: 인자가 거의 다 비어도 throw 없이 형태 유지
  const r3b = recommend({});
  checkShape(r3b, "case3-빈입력");
  const r3c = recommend({ champion: CHAMP_ASHE, picked: [], synergies: null, items: null, augments: null });
  checkShape(r3c, "case3-널데이터");
  ok(r3c.matchedCombos.length === 0, "case3: 널 데이터에서 매칭 0건");

  // --- 케이스 4: class-fit(fitScore) 레이어 ---
  console.log("\n[케이스 4] class-fit(fitScore) 레이어");

  // 4a. 애쉬(ad/Marksman) + heal 증강 → 탱단독·support템 미추천, ad+heal(피바라기)은 추천
  //     (heal 태그 단독 판정 금지: 규칙 ②와 폴백 ③ 양쪽에서 걸러지는지 확인)
  const r4a = recommend({
    champion: CHAMP_ASHE_AD,
    picked: [AUG_HEAL],
    synergies: { combos: [], tagRules: [RULE_HEAL] },
    items: ITEMS_FIT,
    augments: AUGMENTS_FIT,
  });
  checkShape(r4a, "case4a");
  const ids4a = r4a.items.map((i) => i.id);
  ok(ids4a.includes(2004), "case4a: ad+heal(피바라기)은 ad 원딜에게 추천", ids4a);
  ok(!ids4a.includes(2001), "case4a: tank+heal(워모그) 미추천 — 규칙 ②에서 제외", ids4a);
  ok(!ids4a.includes(2002), "case4a: tank 단독(가고일) 미추천 — 폴백 ③에서 제외", ids4a);
  ok(!ids4a.includes(2003), "case4a: support(구원) 미추천", ids4a);

  // 4b. 브랜드(ap/Mage) + ad 증강 → ad 코어템 전부 미추천, ap 코어템은 역할 폴백으로 등장
  const r4b = recommend({
    champion: CHAMP_BRAND,
    picked: [AUG_AD],
    synergies: { combos: [], tagRules: [RULE_AD] },
    items: ITEMS_FIT,
    augments: AUGMENTS_FIT,
  });
  checkShape(r4b, "case4b");
  const ids4b = r4b.items.map((i) => i.id);
  ok(!ids4b.includes(2006), "case4b: crit+ad(무한의 대검) 미추천", ids4b);
  ok(!ids4b.includes(2007), "case4b: onhit 코어(몰락한 왕의 검) 미추천", ids4b);
  ok(!ids4b.includes(2004), "case4b: ad+heal(피바라기) 미추천", ids4b);
  ok(ids4b.includes(2005), "case4b: ap 코어(라바돈)는 추천됨", ids4b);

  // 4c. 말파이트(mixed/Tank·Fighter) + crit 증강 → crit 코어템 미추천, 탱템은 정상 추천
  //     (근사: crit은 Marksman/Assassin 또는 탱커가 아닌 Fighter 전용)
  const r4c = recommend({
    champion: CHAMP_MALPHITE,
    picked: [AUG_C],
    synergies: { combos: [], tagRules: [RULE_CRIT] },
    items: ITEMS_FIT,
    augments: AUGMENTS_FIT,
  });
  const ids4c = r4c.items.map((i) => i.id);
  ok(!ids4c.includes(2006), "case4c: crit 코어(무한의 대검)는 탱커에게 미추천", ids4c);
  ok(ids4c.includes(2001), "case4c: 탱커에게 워모그는 정상 추천", ids4c);

  // 4d. 챔피언 명시 combo는 fitScore 무시 — AP 나서스(dmg ad인데 AP 코어템 큐레이션)
  const r4d = recommend({
    champion: CHAMP_NASUS,
    picked: [AUG_B],
    synergies: { combos: [COMBO_AP_NASUS], tagRules: [] },
    items: ITEMS_FIT,
    augments: AUGMENTS_FIT,
  });
  checkShape(r4d, "case4d");
  const ids4d = r4d.items.map((i) => i.id);
  ok(r4d.matchedCombos.length === 1, "case4d: AP 나서스 combo 매칭", r4d.matchedCombos.length);
  ok(ids4d.includes(2005), "case4d: 명시 combo의 라바돈은 dmg ad여도 추천(큐레이션 신뢰)", ids4d);
  ok(ids4d.includes(2008), "case4d: 명시 combo의 존야도 추천", ids4d);

  // 4e. champions 빈(전 챔피언용) combo의 아이템에는 fitScore 적용 — ad 나서스에게 라바돈 제외
  const r4e = recommend({
    champion: CHAMP_NASUS,
    picked: [AUG_B],
    synergies: { combos: [COMBO_ANY_AP], tagRules: [] },
    items: ITEMS_FIT,
    augments: AUGMENTS_FIT,
  });
  ok(r4e.matchedCombos.length === 1, "case4e: 전 챔피언용 combo 자체는 매칭됨", r4e.matchedCombos.length);
  ok(!r4e.items.map((i) => i.id).includes(2005), "case4e: 빈 champions combo의 라바돈은 dmg ad라 제외", r4e.items.map((i) => i.id));

  // 4f. dmg 필드 누락 → mixed 취급(방어): ap 아이템 하드 배제 없이 후순위(0.5 가중)로만 민다
  const r4f = recommend({
    champion: CHAMP_NODMG,
    picked: [AUG_AP2],
    synergies: { combos: [], tagRules: [RULE_AP] },
    items: ITEMS_FIT,
    augments: AUGMENTS_FIT,
  });
  const ids4f = r4f.items.map((i) => i.id);
  ok(ids4f.includes(2005), "case4f: dmg 없으면 mixed 취급 — ap 아이템 하드 배제 안 함", ids4f);
  ok(ids4f.indexOf(2007) < ids4f.indexOf(2005), "case4f: 어중간(0.5) 아이템은 적합(1) 아이템보다 후순위", ids4f);

  // 4g. 같은 규칙이라도 dmg가 ad로 명시되면 ap 코어는 하드 미스매치로 제외
  const r4g = recommend({
    champion: CHAMP_ASHE_AD,
    picked: [AUG_AP2],
    synergies: { combos: [], tagRules: [RULE_AP] },
    items: ITEMS_FIT,
    augments: AUGMENTS_FIT,
  });
  const ids4g = r4g.items.map((i) => i.id);
  ok(!ids4g.includes(2005), "case4g: dmg ad 명시 시 ap 코어(라바돈) 제외", ids4g);
  ok(ids4g.includes(2007), "case4g: 같은 규칙의 ad 계열 아이템은 유지", ids4g);

  // 4h. [검증자 회귀] 실데이터 애쉬는 tags가 ["Marksman","Support"] — 부 역할 Support여도
  //     원딜에게 support템·tank단독템은 하드 미스매치(0)여야 한다 (Marksman 우선 판정).
  //     스위프 감사에서 미카엘·구원·향로·태양불꽃 누출로 발견된 케이스의 고정 회귀.
  const CHAMP_ASHE_REAL = {
    id: "Ashe", key: 22, nameKo: "애쉬", tags: ["Marksman", "Support"], dmg: "ad",
    ranged: true, attackRange: 600,
  };
  //     역할 폴백 ④도 검증 대상: 부 역할 Support의 역할 태그(support/heal/shield)가
  //     미스매치 후보를 끌어와도, fit>0 후보가 있는 한 그쪽을 먼저 채워야 한다.
  const ITEMS_FIT_4H = {
    version: ITEMS_FIT.version,
    items: ITEMS_FIT.items.concat([
      { id: 2101, nameKo: "크라켄 학살자", tags: ["onhit", "as"], icon: "" },
      { id: 2102, nameKo: "유령 무희", tags: ["as", "crit", "move"], icon: "" },
      { id: 2103, nameKo: "징수의 총", tags: ["ad", "gold"], icon: "" },
    ]),
  };
  const r4h = recommend({
    champion: CHAMP_ASHE_REAL,
    picked: [AUG_HEAL],
    synergies: { combos: [], tagRules: [RULE_HEAL] },
    items: ITEMS_FIT_4H,
    augments: AUGMENTS_FIT,
  });
  const ids4h = r4h.items.map((i) => i.id);
  ok(!ids4h.includes(2003), "case4h: 부역할 Support 원딜에게도 support(구원) 미추천", ids4h);
  ok(!ids4h.includes(2001), "case4h: 부역할 Support 원딜에게도 tank단독(워모그) 미추천", ids4h);
  ok(!ids4h.includes(2002), "case4h: 부역할 Support 원딜에게도 tank단독(가고일) 미추천", ids4h);
  ok(!ids4h.includes(2009), "case4h: 부역할 Support 원딜에게도 tank단독(정령의 형상) 미추천", ids4h);
  ok(ids4h.includes(2004), "case4h: ad+heal(피바라기)은 그대로 추천", ids4h);

  // --- 케이스 5: previewAugment 카드 미리보기 ---
  console.log("\n[케이스 5] previewAugment 카드 미리보기");

  // 공통 형태 검사
  function checkPreviewShape(p, label) {
    ok(p && typeof p === "object", `${label}: 객체 반환`);
    ok(typeof p.route === "string", `${label}: route 문자열`, p && p.route);
    ok(Array.isArray(p.styleTags) && p.styleTags.length <= 2 &&
      p.styleTags.every((t) => typeof t === "string"), `${label}: styleTags 최대 2개 문자열`, p && p.styleTags);
    ok(Array.isArray(p.newCombos) && p.newCombos.length <= 2 &&
      p.newCombos.every((c) => c && typeof c.title === "string" && typeof c.whyFun === "string"),
      `${label}: newCombos 최대 2개 {title, whyFun}`, p && p.newCombos);
    ok(Array.isArray(p.items) && p.items.length <= 3 &&
      p.items.every((it) => it && it.id != null && typeof it.nameKo === "string" && typeof it.icon === "string"),
      `${label}: items 최대 3개 {id, nameKo, icon}`, p && p.items);
    ok(typeof p.funDelta === "number" && Number.isFinite(p.funDelta), `${label}: funDelta 숫자`, p && p.funDelta);
  }

  // 5a. 후보(AUG_C)로 인해 all-combo가 새로 매칭 → newCombos에 포함.
  //     picked만으로 이미 매칭된 combo(온힛 폭풍·이미 발동)는 candidate가 augments에
  //     들어 있어도 제외 — "새로" 매칭된 것만 잡는다.
  const COMBO_ANY_BOTH = { // any인데 picked(AUG_A)만으로 이미 매칭 — candidate 포함이어도 신규 아님
    title: "이미 발동", champions: [],
    augments: ["ARAM_LightningStrikes", "ARAM_CritFrenzy"], matchType: "any",
    whyFun: "이미 켜져 있던 조합입니다.", items: [1005], skills: "-", styleTags: ["온힛"], source: "kr",
  };
  const SYNERGIES_5 = { combos: [COMBO_OTHER_CHAMP, COMBO_ALL_MISSING, COMBO_JAYCE, COMBO_ANYCHAMP, COMBO_ANY_BOTH], tagRules: TAG_RULES };
  const p5a = previewAugment({
    champion: CHAMP_JAYCE, candidate: AUG_C, picked: [AUG_A],
    synergies: SYNERGIES_5, items: ITEMS, augments: AUGMENTS,
  });
  checkPreviewShape(p5a, "case5a");
  const titles5a = p5a.newCombos.map((c) => c.title);
  ok(titles5a.includes("번개 대포 제이스"), "case5a: 후보로 완성되는 all-combo가 newCombos에 포함", titles5a);
  ok(!titles5a.includes("온힛 폭풍"), "case5a: picked만으로 이미 매칭된 combo 제외(candidate 미포함형)", titles5a);
  ok(!titles5a.includes("이미 발동"), "case5a: candidate가 augments에 있어도 이미 매칭이면 제외", titles5a);
  ok(p5a.newCombos.every((c) => c.whyFun.length > 0), "case5a: newCombos에 whyFun 전달", p5a.newCombos);
  ok(p5a.funDelta > 0, "case5a: 새 combo 발동이라 funDelta 양수", p5a.funDelta);
  ok(typeof p5a.route === "string" && p5a.route.length > 0, "case5a: route 비어있지 않음", p5a.route);
  // funDelta 정합: recommend 두 번 호출의 실제 차분과 일치
  const fBefore5a = recommend({ champion: CHAMP_JAYCE, picked: [AUG_A], synergies: SYNERGIES_5, items: ITEMS, augments: AUGMENTS }).funScore;
  const fAfter5a = recommend({ champion: CHAMP_JAYCE, picked: [AUG_A, AUG_C], synergies: SYNERGIES_5, items: ITEMS, augments: AUGMENTS }).funScore;
  ok(p5a.funDelta === fAfter5a - fBefore5a, "case5a: funDelta = funScore(picked+후보) - funScore(picked)", [p5a.funDelta, fAfter5a - fBefore5a]);
  // route·styleTags·items는 "후보 포함" 추천을 그대로 반영
  const rAfter5a = recommend({ champion: CHAMP_JAYCE, picked: [AUG_A, AUG_C], synergies: SYNERGIES_5, items: ITEMS, augments: AUGMENTS });
  ok(p5a.route === rAfter5a.headline, "case5a: route = 후보 포함 headline", [p5a.route, rAfter5a.headline]);
  ok(JSON.stringify(p5a.styleTags) === JSON.stringify(rAfter5a.styleTags.slice(0, 2)), "case5a: styleTags = 후보 포함 상위 1~2개", p5a.styleTags);
  ok(JSON.stringify(p5a.items.map((i) => i.id)) === JSON.stringify(rAfter5a.items.slice(0, 3).map((i) => i.id)),
    "case5a: items = 후보 포함 추천 상위 3개 그대로", p5a.items.map((i) => i.id));

  // 5b. funDelta 부호: 아무 시너지도 안 내는 무태그 후보 → funDelta 0 (음수 방어 겸)
  const AUG_PLAIN = { apiName: "ARAM_Plain", nameKo: "맹물", tier: "silver", enabled: true, tags: [] };
  const p5b = previewAugment({
    champion: CHAMP_JAYCE, candidate: AUG_PLAIN, picked: [AUG_A],
    synergies: SYNERGIES_5, items: ITEMS, augments: AUGMENTS,
  });
  checkPreviewShape(p5b, "case5b");
  ok(p5b.funDelta === 0, "case5b: 시너지 없는 후보는 funDelta 0", p5b.funDelta);
  ok(p5b.newCombos.length === 0, "case5b: 신규 combo 없음", p5b.newCombos);

  // 5c. newCombos 최대 2개: 후보 하나로 any-combo 3개가 동시에 새로 매칭돼도 2개까지만
  const mk5c = (n) => ({
    title: `신규조합${n}`, champions: [], augments: ["ARAM_CritFrenzy"], matchType: "any",
    whyFun: `조합 ${n}`, items: [], skills: "-", styleTags: ["치명타"], source: "kr",
  });
  const p5c = previewAugment({
    champion: CHAMP_JAYCE, candidate: AUG_C, picked: [],
    synergies: { combos: [mk5c(1), mk5c(2), mk5c(3)], tagRules: [] },
    items: ITEMS, augments: AUGMENTS,
  });
  ok(p5c.newCombos.length === 2, "case5c: 신규 combo 3개여도 최대 2개", p5c.newCombos.map((c) => c.title));

  // 5d. items ≤3 + fitScore 준수: 애쉬(Marksman·Support, dmg ad) 후보 미리보기에
  //     탱단독템·support템이 없어야 한다 (case4h와 같은 계약을 미리보기 경로에서 재검증)
  const p5d = previewAugment({
    champion: CHAMP_ASHE_REAL, candidate: AUG_HEAL, picked: [],
    synergies: { combos: [], tagRules: [RULE_HEAL] },
    items: ITEMS_FIT_4H, augments: AUGMENTS_FIT,
  });
  checkPreviewShape(p5d, "case5d");
  const ids5d = p5d.items.map((i) => i.id);
  ok(ids5d.length > 0 && ids5d.length <= 3, "case5d: 아이템 1~3개", ids5d);
  ok(!ids5d.includes(2001) && !ids5d.includes(2002) && !ids5d.includes(2009), "case5d: 애쉬 미리보기에 탱단독템 없음", ids5d);
  ok(!ids5d.includes(2003), "case5d: 애쉬 미리보기에 support템 없음", ids5d);

  // 5e. 빈 picked(1라운드)에서도 동작: 전 챔피언 any-combo가 후보만으로 새로 매칭
  const p5e = previewAugment({
    champion: CHAMP_JAYCE, candidate: AUG_A, picked: [],
    synergies: SYNERGIES, items: ITEMS, augments: AUGMENTS,
  });
  checkPreviewShape(p5e, "case5e");
  ok(p5e.newCombos.some((c) => c.title === "온힛 폭풍"), "case5e: 빈 picked에서 후보 단독 매칭 combo 포착", p5e.newCombos);
  ok(p5e.funDelta > 0, "case5e: 빈 picked 대비 funDelta 양수", p5e.funDelta);

  // 5f. 데이터 누락 방어: 무엇이 빠져도 throw 없이 형태 유지
  checkPreviewShape(previewAugment({}), "case5f-빈입력");
  checkPreviewShape(previewAugment(), "case5f-무인자");
  checkPreviewShape(previewAugment({ champion: CHAMP_ASHE, candidate: AUG_A, picked: null, synergies: null, items: null, augments: null }), "case5f-널데이터");
  const p5fNoCand = previewAugment({ champion: CHAMP_ASHE, picked: [AUG_A], synergies: SYNERGIES, items: ITEMS, augments: AUGMENTS });
  checkPreviewShape(p5fNoCand, "case5f-후보없음");
  ok(p5fNoCand.funDelta === 0 && p5fNoCand.newCombos.length === 0, "case5f: 후보 없으면 차분 0·신규 combo 없음", p5fNoCand.funDelta);

  // --- 케이스 6: routeTargets 목표 집합 T (SPEC-day2 §3-3) ---
  console.log("\n[케이스 6] routeTargets 목표 집합");

  // S티어(funTier 'S') fixture — 기존 AUG_A~D에는 funTier가 없다(S 아님 취급 검증 겸)
  const AUG_S = { apiName: "ARAM_PrismParty", nameKo: "프리즘 파티", tier: "prismatic", funTier: "S", enabled: true, tags: ["aoe"] };
  const AUGMENTS_RT = { patch: "26.17", augments: [AUG_A, AUG_B, AUG_C, AUG_D, AUG_S] };

  function checkRouteShape(t, label) {
    ok(t && typeof t === "object", `${label}: 객체 반환`);
    ok(t.targets instanceof Set && t.routeSet instanceof Set && t.sTierSet instanceof Set,
      `${label}: targets/routeSet/sTierSet 전부 Set`);
    ok(Array.isArray(t.combos) && t.combos.every((c) => c && typeof c.title === "string" && Array.isArray(c.missing)),
      `${label}: combos [{title, missing[]}]`, t && t.combos);
    ok(typeof t.candidateInRoute === "boolean" && typeof t.candidateIsSTier === "boolean",
      `${label}: candidate 플래그 boolean`);
  }

  // 6a. picked=[번개 세례] → all-combo(번개 대포)의 미완성분(치명타 광란)이 routeSet에,
  //     S티어(프리즘 파티)가 sTierSet에, 합집합이 targets에 온다.
  const t6a = routeTargets({
    champion: CHAMP_JAYCE, picked: [AUG_A],
    synergies: SYNERGIES, augments: AUGMENTS_RT,
  });
  checkRouteShape(t6a, "case6a");
  ok(t6a.routeSet.has("ARAM_CritFrenzy"), "case6a: 진행 중 all-combo의 미완성분 포함", [...t6a.routeSet]);
  ok(!t6a.targets.has("ARAM_NotPicked"), "case6a: 풀에 없는(비적격) 콤보 증강은 제외", [...t6a.targets]);
  ok(!t6a.targets.has("ARAM_LightningStrikes"), "case6a: 이미 확보한(picked) 증강은 목표가 아님", [...t6a.targets]);
  ok(t6a.sTierSet.has("ARAM_PrismParty") && t6a.sTierSet.size === 1, "case6a: funTier 'S'만 sTierSet", [...t6a.sTierSet]);
  ok(t6a.targets.has("ARAM_CritFrenzy") && t6a.targets.has("ARAM_PrismParty") && t6a.targets.size === 2,
    "case6a: targets = routeSet ∪ sTierSet", [...t6a.targets]);
  ok(t6a.combos.length === 1 && t6a.combos[0].title === "번개 대포 제이스" &&
    JSON.stringify(t6a.combos[0].missing) === JSON.stringify(["ARAM_CritFrenzy"]),
    "case6a: 근거 콤보에 미완성 목록 수록 (완성된 any-combo는 제외)", t6a.combos);
  ok(!t6a.candidateInRoute && !t6a.candidateIsSTier, "case6a: candidate 없으면 플래그 false");

  // 6b. candidate가 루트를 완성하는 카드면 candidateInRoute=true, 그 카드 자신과
  //     완성된 콤보의 잔여분은 targets에서 빠진다 ("지금 먹으면 확정" 비대칭 경고 근거).
  const t6b = routeTargets({
    champion: CHAMP_JAYCE, picked: [AUG_A], candidate: AUG_C,
    synergies: SYNERGIES, augments: AUGMENTS_RT,
  });
  ok(t6b.candidateInRoute === true, "case6b: 콤보 구성원 카드 → candidateInRoute true");
  ok(!t6b.targets.has("ARAM_CritFrenzy"), "case6b: candidate 자신은 목표에서 제외", [...t6b.targets]);
  ok(t6b.routeSet.size === 0, "case6b: 루트 완성 → 미완성분 없음", [...t6b.routeSet]);
  const t6b2 = routeTargets({
    champion: CHAMP_JAYCE, picked: [AUG_A], candidate: AUG_S,
    synergies: SYNERGIES, augments: AUGMENTS_RT,
  });
  ok(t6b2.candidateIsSTier === true && t6b2.candidateInRoute === false,
    "case6b: S티어 카드 → candidateIsSTier true (콤보 구성원은 아님)");
  ok(!t6b2.targets.has("ARAM_PrismParty"), "case6b: S티어 candidate도 자기 자신은 목표에서 제외", [...t6b2.targets]);

  // 6c. game이 있으면 used(이미 노출분) 제외 + pool 교집합 적용
  const gameFake = { pool: AUGMENTS_RT.augments, used: ["ARAM_CritFrenzy"] };
  const t6c = routeTargets({
    champion: CHAMP_JAYCE, picked: [AUG_A],
    synergies: SYNERGIES, augments: AUGMENTS_RT, game: gameFake,
  });
  ok(!t6c.targets.has("ARAM_CritFrenzy") && t6c.combos.length === 0,
    "case6c: 이미 노출(used)된 증강은 목표에서 제외", [...t6c.targets]);
  const gameNarrow = { pool: [AUG_A, AUG_C], used: [] };
  const t6c2 = routeTargets({
    champion: CHAMP_JAYCE, picked: [AUG_A],
    synergies: SYNERGIES, augments: AUGMENTS_RT, game: gameNarrow,
  });
  ok(t6c2.targets.has("ARAM_CritFrenzy") && !t6c2.targets.has("ARAM_PrismParty"),
    "case6c: game.pool 밖(S티어 포함) 증강은 목표에서 제외", [...t6c2.targets]);

  // 6d. draft.js 실게임 통합: targets ⊆ pool − used 불변식 + hitProbability 계약
  //     (routeTargets의 Set을 draft.hitProbability에 그대로 넣을 수 있어야 한다)
  const game6d = draftMod.newGame({ augments: AUGMENTS_RT.augments, champion: CHAMP_JAYCE, seed: 123 });
  draftMod.nextRound(game6d);
  const t6d = routeTargets({
    champion: CHAMP_JAYCE, picked: [], synergies: SYNERGIES, augments: AUGMENTS_RT, game: game6d,
  });
  const poolNames6d = new Set(game6d.pool.map((a) => a.apiName));
  ok([...t6d.targets].every((n) => poolNames6d.has(n) && game6d.used.indexOf(n) === -1),
    "case6d: targets ⊆ pool − used (실게임 상태)", [...t6d.targets]);
  const dist6d = draftMod.rerollDistribution(game6d, 0);
  const hit6d = draftMod.hitProbability(dist6d, t6d.targets);
  const manual6d = dist6d.entries.reduce((s, e) => s + (t6d.targets.has(e.aug.apiName) ? e.p : 0), 0);
  ok(typeof hit6d === "number" && hit6d >= 0 && hit6d <= 1 && Math.abs(hit6d - manual6d) < 1e-12,
    "case6d: hitProbability(dist, targets Set) = Σp 수동 계산과 일치", [hit6d, manual6d]);

  // 6e. 방어: 어떤 입력에도 throw 없이 빈 형태
  checkRouteShape(routeTargets({}), "case6e-빈입력");
  checkRouteShape(routeTargets(), "case6e-무인자");
  const t6e = routeTargets({ champion: null, picked: null, candidate: null, synergies: null, augments: null, game: null });
  ok(t6e.targets.size === 0 && t6e.combos.length === 0, "case6e: 널 데이터 → 빈 목표", t6e.targets.size);

  // --- 케이스 7: buildDossier 챔피언 꿀잼 사전 셰이퍼 (SPEC-day2 §2) ---
  console.log("\n[케이스 7] buildDossier 챔피언 사전");

  // 스킬별 props가 있는 제이스 (③ 적격 스킬 필터 검증용 — 기존 fixture는 구스키마)
  const CHAMP_JAYCE_PROPS = Object.assign({}, CHAMP_JAYCE, {
    spells: [
      { key: "Q", nameKo: "천상의 강타", props: ["projectile"] },
      { key: "W", nameKo: "번개 질주", props: ["durationEffect"] },
      { key: "E", nameKo: "천둥 강타", props: ["projectile", "knockback"] },
      { key: "R", nameKo: "수은 대포/망치", props: [] },
    ],
  });
  // 스킬 증강 fixture — 확정 판정 4종(pin/slot/무작위/충돌) + 비활성 제외
  const AB_PIN = { apiName: "AB_Pin", nameKo: "핀 증강", tier: "gold", category: "ability", funTier: "A", enabled: true, tags: ["ap"], descKo: "W가 강해집니다.", restrictions: { spellPin: { Jayce: "W" } } };
  const AB_SLOT = { apiName: "AB_Slot", nameKo: "슬롯 증강", tier: "silver", category: "ability", enabled: true, tags: ["ad"], descKo: "Q 고정.", restrictions: { slot: "Q" } };
  const AB_RAND = { apiName: "AB_Rand", nameKo: "투사체 증강", tier: "gold", category: "ability", enabled: true, tags: ["poke"], descKo: "투사체 스킬 강화.", restrictions: { abilityPropsAll: ["projectile"] } };
  const AB_EX = { apiName: "AB_Ex", nameKo: "제외 증강", tier: "silver", category: "ability", enabled: true, tags: ["as"], descKo: "-", restrictions: { spellExclude: { Jayce: ["E"] }, note: "실측: 제이스 E 제외" } };
  const AB_CONF = { apiName: "AB_Conf", nameKo: "모순 증강", tier: "gold", category: "ability", enabled: true, tags: [], descKo: "-", restrictions: { spellPin: { Jayce: "E" }, spellExclude: { Jayce: ["E"] } } };
  const AB_OFF = { apiName: "AB_Off", nameKo: "꺼진 증강", tier: "gold", category: "ability", enabled: false, tags: [], descKo: "-" };
  const AUGMENTS_DEX = { patch: "26.17", augments: [AUG_A, AUG_C, AUG_S, AB_PIN, AB_SLOT, AB_RAND, AB_EX, AB_CONF, AB_OFF] };
  const FUNRANK_FIX = { ranks: [{ id: "Jayce", tier: "S+", funScore: 73, oneLiner: "빵 포킹 장인", signatureAugments: ["ARAM_CritFrenzy"] }] };

  function checkDossierShape(d, label) {
    ok(d && typeof d === "object", `${label}: 객체 반환`);
    ok(d.header && typeof d.header === "object" && typeof d.header.nameKo === "string", `${label}: header 존재`);
    ok(Array.isArray(d.combos), `${label}: combos 배열`);
    ok(Array.isArray(d.fallbackRoutes), `${label}: fallbackRoutes 배열`);
    ok(Array.isArray(d.abilityTable), `${label}: abilityTable 배열`);
    ok(Array.isArray(d.exampleItems) && d.exampleItems.length <= 8, `${label}: exampleItems 최대 8개`);
  }

  // 7a. 콤보 목록 — 적용 가능+발동 가능만, 시그니처 우선 정렬, 증강 해석
  const d7a = buildDossier({
    champion: CHAMP_JAYCE_PROPS, synergies: SYNERGIES, items: ITEMS,
    augments: AUGMENTS_DEX, funrank: FUNRANK_FIX,
  });
  checkDossierShape(d7a, "case7a");
  const titles7a = d7a.combos.map((c) => c.title);
  ok(JSON.stringify(titles7a) === JSON.stringify(["번개 대포 제이스", "온힛 폭풍"]),
    "case7a: 콤보 = 적용 가능 전부, 시그니처(치명타 광란 보유)·챔피언 명시 우선 정렬", titles7a);
  ok(!titles7a.includes("매칭되면 안 되는 콤보(all인데 하나 부족)"),
    "case7a: all인데 비적격 증강이 낀 콤보는 발동 불가 → 사전에서 제외", titles7a);
  ok(!titles7a.includes("다른 챔피언 전용"), "case7a: 다른 챔피언 콤보 제외", titles7a);
  const cJayce = d7a.combos[0];
  ok(cJayce.signature === true && cJayce.matchType === "all", "case7a: 시그니처 플래그·matchType 전달");
  ok(cJayce.augments.length === 2 && cJayce.augments[0].apiName === "ARAM_LightningStrikes" &&
    cJayce.augments[0].nameKo === "번개 세례" && cJayce.augments[0].tier === "gold" && cJayce.augments[0].eligible === true,
    "case7a: 구성 증강이 nameKo/tier/eligible로 해석됨", cJayce.augments[0]);
  ok(JSON.stringify(cJayce.items.map((i) => i.id)) === JSON.stringify([1001, 1002]),
    "case7a: 콤보 핵심 아이템 해석", cJayce.items.map((i) => i.id));
  ok(cJayce.whyFun.length > 0 && cJayce.skills.length > 0, "case7a: whyFun/skills 전달");
  ok(d7a.fallbackRoutes.length === 0, "case7a: 콤보가 있으면 폴백 루트 없음");
  // 헤더 — funrank 결합
  ok(d7a.header.id === "Jayce" && d7a.header.funTier === "S+" && d7a.header.funScore === 73 &&
    d7a.header.oneLiner === "빵 포킹 장인" && d7a.header.signatureAugments.includes("ARAM_CritFrenzy"),
    "case7a: 헤더에 funrank(티어·한줄·시그니처) 결합", d7a.header);

  // 7b. 스킬 증강 표 — 확정(pin/slot)·무작위 후보·충돌 강등·비활성 제외 + draft.skillOdds 정합
  const table7 = d7a.abilityTable;
  const rowOf = (n) => table7.find((r) => r.apiName === n);
  ok(JSON.stringify(table7.map((r) => r.apiName)) === JSON.stringify(["AB_Pin", "AB_Slot", "AB_Rand", "AB_Ex", "AB_Conf"]),
    "case7b: 표 = 적격 ability 전부(풀 순서), 비활성(AB_Off)·비ability 제외", table7.map((r) => r.apiName));
  const rPin = rowOf("AB_Pin");
  ok(rPin.fixed && rPin.fixed.key === "W" && rPin.fixed.nameKo === "번개 질주" &&
    rPin.fixedBy === "pin" && rPin.measured === true && rPin.candidates.length === 0,
    "case7b: spellPin → 확정 W(실측 배지)", rPin);
  const rSlot = rowOf("AB_Slot");
  ok(rSlot.fixed && rSlot.fixed.key === "Q" && rSlot.fixedBy === "slot" && rSlot.measured === false,
    "case7b: slot → 확정 Q (실측 배지는 아님)", rSlot);
  const rRand = rowOf("AB_Rand");
  ok(rRand.fixed === null &&
    JSON.stringify(rRand.candidates.map((c) => c.key)) === JSON.stringify(["Q", "E"]) &&
    rRand.candidates.every((c) => Math.abs(c.p - 0.5) < 1e-9),
    "case7b: abilityPropsAll → 적격 스킬(Q/E)만 균등 후보", rRand.candidates);
  const rEx = rowOf("AB_Ex");
  ok(JSON.stringify(rEx.candidates.map((c) => c.key)) === JSON.stringify(["Q", "W", "R"]) &&
    rEx.excluded.length === 1 && rEx.excluded[0].key === "E" && rEx.excluded[0].nameKo === "천둥 강타" &&
    rEx.excluded[0].reason.includes("실측") && rEx.measured === true,
    "case7b: spellExclude → 후보 제외 + excluded 사유·실측 배지", rEx);
  const rConf = rowOf("AB_Conf");
  ok(rConf.fixed === null && rConf.fixedBy === null &&
    JSON.stringify(rConf.candidates.map((c) => c.key)) === JSON.stringify(["Q", "W", "R"]),
    "case7b: pin·exclude 충돌 → 확정 무효화, ③ 강등 (draft 정책 미러)", rConf);
  // 드리프트 방지 계약: 표의 확정/후보 확률이 draft.skillOdds와 완전 일치
  let drift7 = 0;
  for (const row of table7) {
    const aug = AUGMENTS_DEX.augments.find((a) => a.apiName === row.apiName);
    const odds = draftMod.skillOdds({ champion: CHAMP_JAYCE_PROPS }, aug);
    const fromRow = { Q: 0, W: 0, E: 0, R: 0 };
    if (row.fixed) fromRow[row.fixed.key] = 1;
    else for (const c of row.candidates) fromRow[c.key] = c.p;
    for (const k of ["Q", "W", "E", "R"]) {
      if (Math.abs(fromRow[k] - odds[k]) > 1e-12) drift7++;
    }
  }
  ok(drift7 === 0, "case7b: 표의 확정·후보 확률 = draft.skillOdds (단일 해소기, 드리프트 0)", drift7);

  // 7c. 콤보 0건 폴백 — tagRules 점수화 재사용, 풀에 없는 태그 규칙은 자연 탈락
  const d7c = buildDossier({
    champion: CHAMP_ASHE,
    synergies: { combos: [COMBO_JAYCE], tagRules: TAG_RULES },
    items: ITEMS, augments: AUGMENTS,
  });
  checkDossierShape(d7c, "case7c");
  ok(d7c.combos.length === 0, "case7c: 이 챔피언 콤보 0건");
  ok(d7c.fallbackRoutes.length === 2 && d7c.fallbackRoutes.length <= 3,
    "case7c: 폴백 루트 2건 (dot 규칙은 풀에 dot 증강이 없어 탈락)", d7c.fallbackRoutes.map((r) => r.title));
  ok(d7c.fallbackRoutes[0].title === "온힛 루트" && d7c.fallbackRoutes[0].playstyle.includes("카이팅"),
    "case7c: 점수 높은 규칙(onhit·priority 8)이 첫 루트", d7c.fallbackRoutes[0]);
  ok(JSON.stringify(d7c.fallbackRoutes[0].items.map((i) => i.id)) === JSON.stringify([1002, 1006]),
    "case7c: 루트 아이템 해석(fitScore 통과분)", d7c.fallbackRoutes[0].items);
  ok(d7c.fallbackRoutes[1].title === "탱킹 루트" && d7c.fallbackRoutes[1].items.length === 0,
    "case7c: 원딜에게 탱단독템은 루트에서도 걸러짐(fitScore 0)", d7c.fallbackRoutes[1]);
  ok(d7c.header.funTier === null && d7c.header.oneLiner === "", "case7c: funrank 없으면 헤더 기본값");

  // 7d. 예시 아이템 — fitScore 0 제외, 역할 태그 겹침 순 정렬, 최대 8개
  const d7d = buildDossier({
    champion: CHAMP_ASHE_AD, synergies: { combos: [], tagRules: [] },
    items: ITEMS_FIT, augments: AUGMENTS_FIT,
  });
  const ids7d = d7d.exampleItems.map((i) => i.id);
  ok(JSON.stringify(ids7d) === JSON.stringify([2007, 2006, 2004]),
    "case7d: 예시템 = fit>0만, 역할 태그 겹침 많은 순", ids7d);
  ok(!ids7d.includes(2001) && !ids7d.includes(2003) && !ids7d.includes(2005),
    "case7d: 탱단독·support·AP코어는 ad 원딜 예시템에서 제외", ids7d);
  ok(d7d.exampleItems.every((i) => typeof i.reason === "string" && i.reason.length > 0),
    "case7d: 예시템마다 reason 존재");

  // 7e. 방어: 어떤 입력에도 throw 없이 형태 유지
  checkDossierShape(buildDossier({}), "case7e-빈입력");
  checkDossierShape(buildDossier(), "case7e-무인자");
  checkDossierShape(buildDossier({ champion: CHAMP_ASHE, synergies: null, items: null, augments: null, funrank: null }), "case7e-널데이터");

  // --- 케이스 8: displayTier 클래스 문맥 티어 (실데이터 — 전수조사 계약) ---
  // 근거: research/data/class-tier-adjust.json (2026-09-03 전수조사, empirical) →
  //       scripts/enrich-tier-adjust.cjs → docs/data/tier-adjust.json.
  // 사용자 증언 계약: "아리는 AP 챔피언인데 왜 S,A 증강이 공속이나 태풍 이런거야?" —
  // 전역 funTier(태풍 S)가 아리(AP 딜러)에게는 강등 표시되고, 애쉬(AD 원딜)에게는 유지돼야 한다.
  console.log("\n[케이스 8] displayTier 클래스 문맥 티어");
  ok(typeof mod.displayTier === "function", "displayTier export 존재");
  const { displayTier } = mod;

  const dataDir = path.join(here, "..", "docs", "data");
  const readJson = async (f) => JSON.parse(await fs.readFile(path.join(dataDir, f), "utf8"));
  const realAugs = (await readJson("augments.json")).augments;
  const realChamps = (await readJson("champions.json")).champions;
  const ADJUST = await readJson("tier-adjust.json");
  const champOf = (id) => realChamps.find((c) => c.id === id);
  const augOf = (n) => realAugs.find((a) => a.apiName === n);
  const AHRI = champOf("Ahri");       // tags [Mage,Assassin], dmg ap → apMage (하이브리드 태그여도 AP 문맥)
  const ASHE = champOf("Ashe");       // tags [Marksman,Support], dmg ad → adMarksman
  const MALPHITE = champOf("Malphite"); // tags [Tank,Mage], dmg mixed → tank
  const SORAKA = champOf("Soraka");   // tags [Support,Mage] → support
  ok(!!AHRI && !!ASHE && !!MALPHITE && !!SORAKA, "case8: 실데이터 챔피언 4명 로드");

  // 8a. 아리(apMage): 평타/크리/AD 코어 강등 — 문제 제기의 직접 케이스
  const d8Typhoon = displayTier(augOf("ARAM_Typhoon"), AHRI, ADJUST);
  ok(augOf("ARAM_Typhoon").funTier === "S" && d8Typhoon.tier === "C",
    "case8a: 태풍(전역 S) → 아리에게 C 강등", d8Typhoon);
  ok(typeof d8Typhoon.reason === "string" && d8Typhoon.reason.length > 0,
    "case8a: 강등 시 reason(조정 사유) 반환", d8Typhoon.reason);
  ok(displayTier(augOf("ARAM_SoulSiphon"), AHRI, ADJUST).tier === "C",
    "case8a: 영혼 흡수(crit, 전역 A) → 아리에게 C");
  ok(displayTier(augOf("ARAM_BluntForce"), AHRI, ADJUST).tier === "D",
    "case8a: 육중한 힘(ad, 전역 A) → 아리에게 D (cap:D)");
  // AP 스케일 가드: ap 태그 동반 증강은 강등하지 않는다
  ok(displayTier(augOf("ARAM_JeweledGauntlet"), AHRI, ADJUST).tier === "S",
    "case8a: 보석 건틀릿(crit+ap) → 아리에게 S 유지 (ap 가드)");
  ok(displayTier(augOf("ARAM_Eureka"), AHRI, ADJUST).tier === "S",
    "case8a: 유레카(ap) → 아리에게 S 유지");
  // perAugment 예외: 환영 무기(onhit)는 스킬 기반이라 규칙(cap:C)의 예외 — A로만 완화 강등
  const d8Ether = displayTier(augOf("ARAM_EtherealWeapon"), AHRI, ADJUST);
  ok(d8Ether.tier === "A" && typeof d8Ether.reason === "string" && d8Ether.reason.length > 0,
    "case8a: 환영 무기(전역 S) → 아리에게 A (perAugment 예외가 규칙 cap:C보다 우선)", d8Ether);

  // 8b. 애쉬(adMarksman): 평타 코어는 유지, AP 코어는 강등 ("제시되지만 나쁨" 실측)
  const d8AsheTyphoon = displayTier(augOf("ARAM_Typhoon"), ASHE, ADJUST);
  ok(d8AsheTyphoon.tier === "S" && d8AsheTyphoon.reason === null,
    "case8b: 태풍 → 애쉬에게 S 유지 (무변경이면 reason null)", d8AsheTyphoon);
  ok(displayTier(augOf("ARAM_Eureka"), ASHE, ADJUST).tier === "C",
    "case8b: 유레카(ap, 전역 S) → 애쉬에게 C (mm 실측 wr 44.92)");
  ok(displayTier(augOf("ARAM_JeweledGauntlet"), ASHE, ADJUST).tier === "B",
    "case8b: 보석 건틀릿 → 애쉬에게 B (perAugment 완화 강등, mm wr 39.82)");

  // 8c. 말파이트(tank, dmg mixed): 평타/크리·AD 코어 강등 — forDmg 없는 탱커 규칙이
  //     mixed에도 적용. AP 코어는 유지 (mm 실측: 유레카 1482게임 정상 제시 — AP 탱커 실존).
  //     ※ 과제 지시문의 "말파이트(AP 코어 강등)"는 조정표 원본과 상충 — 실측(keyEvidence
  //       malphite)은 AP 정상 제시라 강등 규칙이 없다. 실제 강등 대상(평타/AD 코어)로 검증.
  ok(displayTier(augOf("ARAM_Typhoon"), MALPHITE, ADJUST).tier === "C",
    "case8c: 태풍 → 말파이트(탱커)에게 C 강등");
  ok(displayTier(augOf("ARAM_BluntForce"), MALPHITE, ADJUST).tier === "C",
    "case8c: 육중한 힘(ad) → 말파이트에게 C (ad-core-vs-tank)");
  ok(displayTier(augOf("ARAM_Eureka"), MALPHITE, ADJUST).tier === "S",
    "case8c: 유레카(ap) → 말파이트에게 S 유지 (AP 탱커 실측 정상 제시)");

  // 8d. 서포터 승급(up:1): 서포터 전용 계열은 소라카에게 한 단계 위로
  const d8AllForYou = displayTier(augOf("ARAM_AllForYou"), SORAKA, ADJUST);
  ok(augOf("ARAM_AllForYou").funTier === "C" && d8AllForYou.tier === "B",
    "case8d: 너만을 위해(support, 전역 C) → 소라카에게 B 승급", d8AllForYou);

  // 8e. 하위 호환·방어: adjust 없으면 전역 funTier 그대로, 어떤 입력에도 throw 없음
  const d8NoAdj = displayTier(augOf("ARAM_Typhoon"), AHRI);
  ok(d8NoAdj.tier === "S" && d8NoAdj.reason === null, "case8e: adjust 없으면 전역 funTier 유지", d8NoAdj);
  ok(displayTier(null, null, null).tier === null, "case8e: null 증강 → {tier:null} (throw 없음)");
  ok(displayTier({ apiName: "X", tags: ["onhit"] }, AHRI, ADJUST).tier === null,
    "case8e: funTier 없는 증강 → {tier:null}");
  ok(displayTier(augOf("ARAM_Typhoon"), null, ADJUST).tier !== undefined,
    "case8e: 챔피언 null이어도 throw 없음");

  // 8f. routeTargets S 판정의 문맥 전환: tierAdjust를 주면 sTierSet·candidateIsSTier가
  //     displayTier 기준이 된다 — 태풍이 아리의 리롤 목표 집합에서 빠진다.
  const AUGS_8F = { augments: [augOf("ARAM_Typhoon"), augOf("ARAM_Eureka")] };
  const t8fOld = routeTargets({
    champion: AHRI, picked: [], synergies: { combos: [] }, augments: AUGS_8F,
  });
  ok(t8fOld.sTierSet.has("ARAM_Typhoon") && t8fOld.sTierSet.has("ARAM_Eureka"),
    "case8f: tierAdjust 없으면 종전대로 전역 S 전부 (하위 호환)", [...t8fOld.sTierSet]);
  const t8fNew = routeTargets({
    champion: AHRI, picked: [], synergies: { combos: [] }, augments: AUGS_8F, tierAdjust: ADJUST,
  });
  ok(!t8fNew.sTierSet.has("ARAM_Typhoon") && t8fNew.sTierSet.has("ARAM_Eureka"),
    "case8f: tierAdjust 적용 시 아리 목표 집합에서 태풍 제외·유레카 유지", [...t8fNew.sTierSet]);
  const t8fCand = routeTargets({
    champion: AHRI, picked: [], candidate: augOf("ARAM_Typhoon"),
    synergies: { combos: [] }, augments: AUGS_8F, tierAdjust: ADJUST,
  });
  ok(t8fCand.candidateIsSTier === false,
    "case8f: 태풍 카드는 아리에게 candidateIsSTier false (문맥 티어 C)");
  const t8fAshe = routeTargets({
    champion: ASHE, picked: [], candidate: augOf("ARAM_Typhoon"),
    synergies: { combos: [] }, augments: AUGS_8F, tierAdjust: ADJUST,
  });
  ok(t8fAshe.candidateIsSTier === true,
    "case8f: 같은 태풍 카드가 애쉬에게는 candidateIsSTier true (S 유지)");

  // --- 케이스 9: buildDossier.recommended 추천 증강 (dex-recommended 계약) ---
  // 미리보기 패널(시그니처)과 꿀잼 사전(#dex)이 같은 데이터를 보게 하는 신규 필드:
  // ① 시그니처 ∩ 풀(source:"signature") ② 문맥 S → A 보충(source:"stier"), 합계 최대 10.
  // 풀 밖 시그니처는 제외 + _ineligibleSignatures 보고. 정렬: signature → displayTier → funTier → 이름.
  console.log("\n[케이스 9] buildDossier.recommended 추천 증강");

  // 9a. 합성: 시그니처 우선 정렬 + 풀 위반 시그니처 제외 + 문맥 S→A 보충
  //     (tierAdjust 미전달 → displayTier가 전역 funTier로 폴백하는 계약도 겸사 검증)
  const REC_SIG_OK = { apiName: "REC_SigOk", nameKo: "시그 증강", tier: "prismatic", enabled: true, funTier: "B", tags: [], descKo: "시그 설명" };
  const REC_SIG_BAD = { apiName: "REC_SigBad", nameKo: "근접 전용 시그", tier: "gold", enabled: true, funTier: "S", tags: [], restrictions: { meleeOnly: true } };
  const REC_S_G = { apiName: "REC_S_G", nameKo: "가나다 증강", tier: "gold", enabled: true, funTier: "S", tags: [] };
  const REC_S_N = { apiName: "REC_S_N", nameKo: "나다라 증강", tier: "silver", enabled: true, funTier: "S", tags: [] };
  const REC_A1 = { apiName: "REC_A1", nameKo: "보충 증강", tier: "gold", enabled: true, funTier: "A", tags: [] };
  const REC_B1 = { apiName: "REC_B1", nameKo: "낮은 증강", tier: "gold", enabled: true, funTier: "B", tags: [] };
  const AUGMENTS_REC = { augments: [REC_B1, REC_A1, REC_S_N, REC_S_G, REC_SIG_BAD, REC_SIG_OK] };
  const FUNRANK_REC = { ranks: [{ id: "Ashe", tier: "S", funScore: 60, oneLiner: "-", signatureAugments: ["REC_SigOk", "REC_SigBad"] }] };
  const d9a = buildDossier({
    champion: CHAMP_ASHE, synergies: { combos: [], tagRules: [] }, items: ITEMS,
    augments: AUGMENTS_REC, funrank: FUNRANK_REC,
  });
  ok(Array.isArray(d9a.recommended) && Array.isArray(d9a._ineligibleSignatures),
    "case9a: recommended·_ineligibleSignatures 배열 반환");
  ok(JSON.stringify(d9a.recommended.map((r) => r.apiName)) === JSON.stringify(["REC_SigOk", "REC_S_G", "REC_S_N", "REC_A1"]),
    "case9a: 정렬 = 시그니처 먼저(문맥 B여도) → S(funTier→이름 순) → A 보충, B 미포함",
    d9a.recommended.map((r) => r.apiName));
  const r9sig = d9a.recommended[0];
  ok(r9sig.source === "signature" && r9sig.displayTier === "B" && r9sig.tier === "prismatic" &&
    r9sig.nameKo === "시그 증강" && r9sig.descKo === "시그 설명",
    "case9a: 항목 필드 계약(apiName/nameKo/tier/displayTier/descKo/source)", r9sig);
  ok(d9a.recommended.slice(1).every((r) => r.source === "stier"), "case9a: 2순위 항목은 전부 source stier");
  ok(JSON.stringify(d9a._ineligibleSignatures) === JSON.stringify(["REC_SigBad"]) &&
    !d9a.recommended.some((r) => r.apiName === "REC_SigBad"),
    "case9a: 풀 위반 시그니처(근접 전용 vs 원거리)는 recommended 제외 + _ineligibleSignatures 보고",
    d9a._ineligibleSignatures);

  // 9b. funrank 부재 → stier만 (방어적 계약)
  const d9b = buildDossier({
    champion: CHAMP_ASHE, synergies: { combos: [], tagRules: [] }, items: ITEMS, augments: AUGMENTS_REC,
  });
  ok(d9b.recommended.length === 3 && d9b.recommended.every((r) => r.source === "stier"),
    "case9b: funrank 없으면 시그니처 없이 문맥 S/A만", d9b.recommended.map((r) => r.apiName));
  ok(d9b._ineligibleSignatures.length === 0, "case9b: 시그니처 자체가 없으면 _ineligibleSignatures 빈 배열");

  // 9c. 합계 최대 10개 — 시그니처는 절단으로 밀려나지 않는다
  const many9 = [];
  for (let i = 0; i < 12; i++) {
    many9.push({ apiName: "REC_M" + i, nameKo: "많은 증강 " + ("0" + i).slice(-2), tier: "gold", enabled: true, funTier: "S", tags: [] });
  }
  const d9c = buildDossier({
    champion: CHAMP_ASHE, synergies: { combos: [], tagRules: [] }, items: ITEMS,
    augments: { augments: many9.concat([REC_SIG_OK]) }, funrank: FUNRANK_REC,
  });
  ok(d9c.recommended.length === 10, "case9c: 합계 최대 10개", d9c.recommended.length);
  ok(d9c.recommended[0].apiName === "REC_SigOk" && d9c.recommended[0].source === "signature",
    "case9c: 문맥 B 시그니처도 절단 대신 맨 앞 유지");

  // 9d. 실데이터: 럭스 시그니처(보석 건틀릿) — 두 화면 불일치 문제의 원 사례
  const realFunrank = await readJson("funrank.json");
  const LUX = champOf("Lux");
  ok(!!LUX, "case9d: 럭스 실데이터 로드");
  const d9d = buildDossier({
    champion: LUX, synergies: { combos: [], tagRules: [] }, items: [],
    augments: { augments: realAugs }, funrank: realFunrank, tierAdjust: ADJUST,
  });
  ok(d9d.recommended.length > 0 && d9d.recommended[0].apiName === "ARAM_JeweledGauntlet" &&
    d9d.recommended[0].source === "signature",
    "case9d: 럭스 recommended 맨 앞 = 보석 건틀릿(시그니처) — 미리보기와 사전 일치",
    d9d.recommended[0] && d9d.recommended[0].apiName);
  ok(d9d.recommended[0].displayTier === "S", "case9d: 보석 건틀릿 문맥 티어 S (apMage 럭스)");
  ok(d9d._ineligibleSignatures.length === 0, "case9d: 럭스 시그니처 풀 위반 0건");
  ok(d9d.recommended.filter((r) => r.source === "stier").every((r) => r.displayTier === "S" || r.displayTier === "A"),
    "case9d: 2순위 항목은 전부 문맥 S/A");
  ok(d9d.recommended.length <= 10, "case9d: 상한 10 준수", d9d.recommended.length);
  // 문맥 강등 반영: 태풍(전역 S)은 아리(apMage) recommended에 못 들어온다
  const d9Ahri = buildDossier({
    champion: AHRI, synergies: { combos: [], tagRules: [] }, items: [],
    augments: { augments: realAugs }, funrank: realFunrank, tierAdjust: ADJUST,
  });
  ok(!d9Ahri.recommended.some((r) => r.apiName === "ARAM_Typhoon"),
    "case9d: 태풍(전역 S → 아리 문맥 C)은 아리 recommended에 없음");

  // 9e. 실데이터 전수(173명): (b) 풀 내 시그니처 ⊆ recommended, (c) 전원 1개 이상,
  //     풀 위반 시그니처 0건 (scripts/funrank-fixlog.md 수정 반영 회귀 가드)
  let bad9Empty = 0, bad9Inel = 0, bad9Sig = 0;
  for (const c9 of realChamps) {
    const d9 = buildDossier({
      champion: c9, synergies: { combos: [], tagRules: [] }, items: [],
      augments: { augments: realAugs }, funrank: realFunrank, tierAdjust: ADJUST,
    });
    if (!d9.recommended.length) bad9Empty++;
    if (d9._ineligibleSignatures.length) bad9Inel++;
    const names9 = new Set(d9.recommended.map((r) => r.apiName));
    const entry9 = realFunrank.ranks.find((r) => r.id === c9.id);
    const pool9 = new Set(draftMod.eligibleAugments(realAugs, c9).map((a) => a.apiName));
    for (const s of (entry9 && entry9.signatureAugments) || []) {
      if (pool9.has(s) && !names9.has(s)) bad9Sig++;
    }
  }
  ok(bad9Empty === 0, "case9e: 173명 전원 recommended 1개 이상", bad9Empty);
  ok(bad9Inel === 0, "case9e: 풀 위반 시그니처 0건 (funrank-fixlog 수정 반영)", bad9Inel);
  ok(bad9Sig === 0, "case9e: 풀 내 시그니처 전부 recommended 포함 (미리보기 ⊆ 사전)", bad9Sig);

  // --- 결과 ---
  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error("테스트 실행 실패:", e);
    process.exitCode = 1;
  })
  .then(() => fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {}));
