// scripts/test-recommend.mjs — recommend.js 합성 fixture 검증 (Node v14.17.4 호환)
// 실행: node scripts/test-recommend.mjs
// 케이스: ① combo 정확 매칭 ② tagRules 태그 규칙 ③ 매칭 0건 폴백 (+방어적 입력)
//
// 참고: 저장소에 package.json("type":"module")이 없어도 돌아가도록,
// docs/js/recommend.js 를 임시 .mjs 로 복사한 뒤 동적 import 한다.

import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.join(here, "..", "docs", "js", "recommend.js");
const tmpPath = path.join(os.tmpdir(), `jeungbaram-recommend-${process.pid}-${Date.now()}.mjs`);

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
  await fs.copyFile(srcPath, tmpPath);
  const mod = await import(pathToFileURL(tmpPath).href);
  const { recommend } = mod;
  ok(typeof recommend === "function", "recommend export 존재");

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

  // --- 결과 ---
  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error("테스트 실행 실패:", e);
    process.exitCode = 1;
  })
  .then(() => fs.unlink(tmpPath).catch(() => {}));
