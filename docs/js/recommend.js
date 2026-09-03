// docs/js/recommend.js — 증바람 추천 엔진 (ESM, DOM 접근 금지, 브라우저·Node 겸용 순수 로직)
//
// export function recommend({champion, picked, synergies, items, augments})
// 반환: { headline, playstyle, matchedCombos, items:[{id,nameKo,icon,reason}](최대 6),
//         skills, funScore(0~100), styleTags:[...] }
//
// export function displayTier(augment, champion, adjust)
// 전역 funTier를 챔피언 문맥(아키타입)으로 조정한 "표시 티어" — {tier, reason} 반환.
// adjust = docs/data/tier-adjust.json (없으면 전역 funTier 그대로, reason null — 하위 호환).
// 근거: research/data/class-tier-adjust.json 전수조사(2026-09-03, empirical) —
// 예: 태풍(전역 S)은 AP 딜러(아리)에게 C, 애쉬(AD 원딜)에게는 S 유지.
//
// export function routeTargets({champion, picked, candidate, synergies, augments, game, tierAdjust})
// "꿀조합을 진전시키는 증강 집합" T 산출 (SPEC-day2 §3-3) — 리롤 확률 어드바이저의 목표 집합.
// 콤보 미완성분(진행 중/candidate로 열리는 콤보의 아직 안 나온 구성 증강) ∪ S티어.
// S티어 판정은 tierAdjust가 주어지면 displayTier(문맥 티어) 기준 — 태풍이 아리의 목표
// 집합에 들어가는 오류를 막는다. tierAdjust 없으면 종전대로 전역 funTier 'S' (하위 호환).
// game(draft.js 상태)이 있으면 pool 교집합·used 제외를 적용한다. rng 미소비 순수 함수.
// 반환: { targets:Set, routeSet:Set, sTierSet:Set, combos:[{title, missing:[apiName]}],
//         candidateInRoute:boolean, candidateIsSTier:boolean }
// targets/routeSet/sTierSet은 apiName Set — draft.js hitProbability(dist, set)에 바로 넣는다.
//
// export function buildDossier({champion, synergies, items, augments, funrank, tierAdjust})
// 챔피언 꿀잼 사전(#dex 화면) 데이터 셰이퍼 (SPEC-day2 §2) — DOM 금지, 표시용 데이터만.
// 반환: { header, recommended, _ineligibleSignatures, combos, fallbackRoutes, abilityTable, exampleItems }
//  - recommended (dex-recommended 계약): 미리보기 패널의 시그니처와 사전이 같은 데이터를
//    보게 하는 추천 증강 목록 — ① funrank signatureAugments 중 이 챔피언 풀에 실존하는 것
//    (source:"signature") ② 풀에서 문맥 티어(displayTier) S인 증강 + A 보충(source:"stier"),
//    합계 최대 10개. 정렬: signature 먼저 → displayTier(S>A) → funTier → 이름.
//    풀에 없는 시그니처는 recommended에서 제외하고 _ineligibleSignatures로 보고(감사용).
//    tierAdjust 없으면 displayTier가 전역 funTier로 폴백, funrank 없으면 stier만 (방어적).
//  - combos: 이 챔피언에 적용 가능한(발동 가능한) combo 전부 — 시그니처·챔피언 명시 우선 정렬
//  - fallbackRoutes: combos 0건일 때만 tagRules 점수화(matchRules 재사용)로 일반 루트 2~3개
//  - abilityTable: eligibleAugments ∩ category==='ability' — 확정 스킬(fixed/fixedBy),
//    적격 후보(candidates, ③ 균등 p — 근사), 제외 스킬(excluded), 실측 배지(measured).
//    확정 판정은 draft.js skillOdds(=presentAugment ①②③ 공용 해소기) 재사용 — 드리프트 방지.
//  - exampleItems: fitScore 상위 범용 아이템 최대 8개
//
// export function previewAugment({champion, candidate, picked, synergies, items, augments})
// 드래프트 카드 1장(candidate)에 대한 "이걸 고르면?" 미리보기.
// 내부에서 recommend()를 (picked)와 (picked+[candidate]) 두 번 호출해 차분만 계산한다
// (rng 미사용 — 결정론이라 두 호출이 항상 같은 입력에 같은 결과).
// 반환: { route, styleTags(상위 1~2), newCombos:[{title,whyFun}](최대 2),
//         items:[{id,nameKo,icon}](최대 3, fitScore 반영), funDelta }
// newCombos = 후보를 포함해야 비로소 매칭되는 combo 중 candidate.apiName이
// combo.augments에 포함된 것만 (picked만으로 이미 매칭된 combo는 제외).
//
// 로직 순서:
//  ① synergies.combos에서 champion+picked 정확 매칭 (matchType any/all 준수)
//     — 매칭 combo의 whyFun/items/skills 최우선 반영, 여러 개면 styleTags 겹침 순 정렬
//  ② synergies.tagRules: picked 증강 tags 합집합 × champion.tags 교집합으로 점수화(priority 가중)
//  ③ 아이템 병합: combo 아이템 우선 → 규칙 아이템 → 태그 교집합 폴백. 최대 6개, 중복 제거, 각 reason 한 줄
//     — 규칙/폴백 아이템에는 class-fit 판정(fitScore) 적용: 챔피언 클래스·피해 유형과
//       하드 미스매치(0)인 아이템은 제외, 어중간(0.5)은 정렬 점수에 곱해 후순위로 민다.
//       champions에 챔피언이 명시된 combo 아이템만 큐레이션을 신뢰해 판정을 건너뛴다.
//  ④ funScore: 정확 매칭 수 + 태그 시너지 밀도 기반 0~100
//  ⑤ headline: styleTags 조합으로 한 줄 컨셉 생성. 매칭 0건이어도 champion tags 기반 기본 추천 반환.
//
// 방어적 파싱: 데이터 파일이 병렬 제작 중이므로 필드 누락/형식 불일치는 조용히 무시하고 진행한다.

// draft.js 공용 헬퍼 재사용 (SPEC-day2 §2-2 드리프트 방지 원칙):
//  - eligibleAugments: 사전·목표 집합의 "이 챔피언이 받을 수 있는 풀" 판정을 드래프트와 동일화
//  - skillOdds: 스킬 증강 확정/후보 판정을 presentAugment ①spellPin ②slot ③무작위와 동일화
//    (skillOdds는 game.champion만 읽는 순수 조회 — {champion}만 담은 셈 객체로 호출해도 계약상 동일)
import { eligibleAugments, skillOdds } from "./draft.js";

const MAX_ITEMS = 6;

// ---------------------------------------------------------------- 어휘 사전

// augments.json / items.json 공용 태그 → 한국어 표기 (아이템 reason 문구용)
const TAG_KO = {
  onhit: "적중 시 효과", as: "공격 속도", ad: "공격력", ap: "주문력", crit: "치명타",
  tank: "방어/체력", heal: "회복", shield: "보호막", move: "이동 속도", cc: "군중 제어",
  dash: "돌진", ult: "궁극기", summoner: "소환사 주문", gold: "골드", onkill: "처치 스노볼",
  aoe: "광역", dot: "지속 피해", execute: "처형", poke: "포킹", support: "지원",
  mana: "마나", quest: "퀘스트",
};

// 증강 태그 → 스타일 태그(한국어) — 매칭 0건 폴백용
const TAG_STYLE = {
  onhit: "온힛", as: "공속", ad: "공격력", ap: "주문력", crit: "치명타", tank: "탱킹",
  heal: "흡혈회복", shield: "보호막", move: "질주", cc: "CC연계", dash: "돌진",
  ult: "궁연발", summoner: "스펠장난", gold: "돈벌이", onkill: "스노볼", aoe: "광역딜",
  dot: "도트딜", execute: "처형", poke: "포킹", support: "지원", mana: "마나펑펑",
  quest: "존버",
};

// DDragon 챔피언 tags → 역할별 표현
const ROLE_STYLE = {
  Marksman: "평타캐리", Assassin: "암살", Mage: "폭딜마법", Tank: "철벽",
  Fighter: "난전", Support: "지원",
};
const ROLE_NOUN = {
  Marksman: "사수", Assassin: "암살자", Mage: "마법사", Tank: "탱커",
  Fighter: "전사", Support: "수호자",
};
const ROLE_PLAY = {
  Marksman: "뒤에서 평타로 꾸준히 딜을 누적하는 것이 기본입니다.",
  Assassin: "적 딜러만 노려 물고 빠지는 플레이가 핵심입니다.",
  Mage: "스킬 쿨마다 포킹을 넣고 한타에서 콤보를 쏟아부으세요.",
  Tank: "선봉에서 어그로를 끌고 아군이 딜할 공간을 만들어 주세요.",
  Fighter: "난전 한가운데서 계속 싸움을 걸어 이득을 보세요.",
  Support: "아군을 지키면서 변수 스킬로 한타를 설계하세요.",
};
// 역할별 어울리는 아이템 태그 (마지막 폴백 아이템 추천용)
const ROLE_ITEM_TAGS = {
  Marksman: ["as", "crit", "onhit", "ad"],
  Assassin: ["ad", "move", "execute", "crit"],
  Mage: ["ap", "mana", "poke", "aoe"],
  Tank: ["tank", "heal", "cc", "shield"],
  Fighter: ["ad", "tank", "heal", "onhit"],
  Support: ["support", "heal", "shield", "cc"],
};

// 대표 스타일 태그 → 완성형 헤드라인 (없으면 조합형으로 생성)
const STYLE_HEADLINE = {
  "무한딜": "무한딜 머신",
  "원콤": "원콤 암살자",
  "존버": "존버 후반 캐리",
  "질주": "멈추지 않는 폭주기관차",
  "탱킹": "안 죽는 좀비 탱커",
  "철벽": "안 죽는 철벽 요새",
  "흡혈": "피를 마시는 흡혈귀",
  "흡혈회복": "피를 마시는 흡혈귀",
  "포킹": "원거리 저격수",
  "광역딜": "한타 학살 기계",
  "스노볼": "킬 먹고 폭주하는 스노볼러",
  "온힛": "평타 한 대가 필살기",
  "궁연발": "궁극기 난사꾼",
  "돈벌이": "칼바람 재벌",
};

// ---------------------------------------------------------------- 유틸

function toArray(v) {
  return Array.isArray(v) ? v : [];
}
// {items:[...]} / {augments:[...]} / {combos:[...]} 래퍼와 맨 배열 둘 다 허용
function unwrap(v, key) {
  if (Array.isArray(v)) return v;
  if (v && Array.isArray(v[key])) return v[key];
  return [];
}
function isStr(v) {
  return typeof v === "string" && v.trim().length > 0;
}
function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}
function uniq(arr) {
  return Array.from(new Set(arr));
}

// picked는 증강 객체 배열이 정상이지만, apiName 문자열 배열이 와도 augments 목록으로 복원해 준다.
function normalizePicked(picked, augmentList) {
  const byName = new Map();
  for (const a of augmentList) {
    if (a && isStr(a.apiName)) byName.set(a.apiName, a);
  }
  const out = [];
  for (const p of toArray(picked)) {
    if (isStr(p)) {
      out.push(byName.get(p) || { apiName: p, tags: [] });
    } else if (p && typeof p === "object") {
      // tags가 없으면 augments 목록에서 보강
      if (!Array.isArray(p.tags) && isStr(p.apiName) && byName.has(p.apiName)) {
        out.push(byName.get(p.apiName));
      } else {
        out.push(p);
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------- ① combo 정확 매칭

// combo가 이 챔피언에게 적용 가능한가 (champions 비어 있음 = 모든 챔피언 허용).
// matchCombos에서 추출한 공용 판정 — routeTargets/buildDossier가 같은 답을 내게 한다.
function comboAppliesTo(combo, champId) {
  const champs = toArray(combo && combo.champions).filter(isStr);
  if (!champs.length) return true;
  if (!isStr(champId)) return false;
  return champs.some((c) => c.toLowerCase() === champId.toLowerCase());
}

function matchCombos(combos, champId, pickedNames) {
  const matched = [];
  combos.forEach((combo, idx) => {
    if (!combo || typeof combo !== "object") return;
    if (!comboAppliesTo(combo, champId)) return;
    const req = toArray(combo.augments).filter(isStr);
    if (!req.length) return; // 요구 증강이 없으면 "정확 매칭"이 아님
    const hit = req.filter((name) => pickedNames.has(name));
    const type = combo.matchType === "all" ? "all" : "any"; // 누락 시 any로 관대하게
    const pass = type === "all" ? hit.length === req.length : hit.length >= 1;
    if (!pass) return;
    matched.push({ combo, idx, hit: hit.length, specific: toArray(combo.champions).filter(isStr).length > 0 });
  });

  // 여러 개 매칭 시 styleTags 겹침(다른 매칭 combo들과 공유하는 태그 수) 순 정렬
  const tally = new Map();
  for (const m of matched) {
    for (const t of uniq(toArray(m.combo.styleTags).filter(isStr))) {
      tally.set(t, (tally.get(t) || 0) + 1);
    }
  }
  for (const m of matched) {
    m.overlap = uniq(toArray(m.combo.styleTags).filter(isStr))
      .reduce((s, t) => s + ((tally.get(t) || 1) - 1), 0);
  }
  matched.sort((a, b) =>
    (b.overlap - a.overlap) ||
    (b.hit - a.hit) ||
    ((b.specific ? 1 : 0) - (a.specific ? 1 : 0)) ||
    (a.idx - b.idx));
  return matched;
}

// ---------------------------------------------------------------- ② tagRules 점수화

function matchRules(rules, pickedTagSet, tagCounts, champTagSet) {
  const matched = [];
  rules.forEach((rule, idx) => {
    if (!rule || typeof rule !== "object") return;
    const aTags = toArray(rule.ifAugmentTags).filter(isStr);
    const cTags = toArray(rule.ifChampTags).filter(isStr);
    const aHit = aTags.filter((t) => pickedTagSet.has(t));
    if (aTags.length && !aHit.length) return; // 빈 배열 = 모두 허용
    if (cTags.length && !cTags.some((t) => champTagSet.has(t))) return;
    const priority = typeof rule.priority === "number" ? rule.priority : 1;
    // 밀도: 매칭된 태그를 실제로 들고 있는 picked 증강 수 합
    const density = aHit.reduce((s, t) => s + (tagCounts.get(t) || 0), 0);
    const score = priority * (1 + aHit.length) + density;
    matched.push({ rule, idx, score, aHit });
  });
  matched.sort((a, b) => (b.score - a.score) || (a.idx - b.idx));
  return matched;
}

// ---------------------------------------------------------------- ③-0 class-fit 판정

// fitScore(item, champ) — 아이템이 챔피언 클래스·피해 유형에 맞는지 3단계 판정.
//   1 = 적합 / 0.5 = 어중간(포함하되 정렬 점수에 곱해 후순위) / 0 = 하드 미스매치(추천 제외)
// 근거 축 두 가지:
//   · 역할: champion.tags (DDragon Marksman/Mage/Assassin/Fighter/Tank/Support)
//   · 피해 유형: champion.dmg ("ad"|"ap"|"mixed") — champions.json 신규 필드(병렬 제작 중).
//     방어: dmg가 없거나 형식이 다르면 mixed로 취급해 하드 배제를 만들지 않는다.
// 근사: 아이템 태그 기반 휴리스틱이며 실제 게임의 빌드 다양성(AP 나서스류 변신 컨셉)은
//       챔피언 명시 combo 예외(buildItems ①)로 보호한다. mixed 챔피언과 Fighter는
//       관대하게 판정해 0을 최소화한다. heal 태그는 단독 판정 금지 —
//       ad+heal(피바라기)은 ad 코어로, tank+heal(워모그)은 tank 단독으로 묶어서 본다.
function fitScore(item, champ) {
  const tags = new Set(toArray(item && item.tags).filter(isStr));
  const roles = champ ? toArray(champ.tags).filter(isStr) : [];
  const roleSet = new Set(roles);
  const dmg = champ && (champ.dmg === "ad" || champ.dmg === "ap") ? champ.dmg : "mixed";
  if (!tags.size) return 0.5; // 태그 없는 아이템은 판정 불가 — 어중간 (병렬 제작 중 방어)
  if (!roles.length) return 0.5; // 역할 정보 없는 챔피언은 하드 배제하지 않는다 (방어)

  const hasAP = tags.has("ap");
  // 근사: ad·crit·onhit(공속 동반 포함)을 "AD 계열 코어"로 묶는다
  const adSide = tags.has("ad") || tags.has("crit") || tags.has("onhit");

  // 1) support 계열(향로·구원류) → 주 역할이 Support인 챔피언 전용
  //    근사: DDragon tags[0]을 주 역할로 본다. 원딜(Marksman)은 애쉬(Marksman/Support)처럼
  //    부 역할이 Support여도 하드 미스매치(0) — "원딜에 support템"은 계약상 금지.
  //    그 외 부 역할 Support(브랜드/럭스류)는 어중간(0.5)으로 낮춘다.
  if (tags.has("support")) {
    if (roles[0] === "Support") return 1;
    if (roleSet.has("Marksman")) return 0;
    return roleSet.has("Support") ? 0.5 : 0;
  }
  // 2) tank 단독(워모그·가고일류: 피해 코어 태그가 전혀 없는 방어템) → Tank/Fighter만 적합
  //    Support(기사의 맹세류 제외분)는 어중간, 원딜/메이지/암살자는 하드 미스매치
  //    근사: 원딜은 부 역할 Support(애쉬)여도 탱단독템은 0 — Marksman이 우선한다.
  if (tags.has("tank") && !hasAP && !adSide) {
    if (roleSet.has("Tank") || roleSet.has("Fighter")) return 1;
    if (roleSet.has("Marksman")) return 0;
    return roleSet.has("Support") ? 0.5 : 0;
  }
  // 3) ap 코어(라바돈·존야류) → dmg가 ad 단독인 챔피언에게 하드 미스매치
  if (hasAP && !adSide) {
    if (dmg === "ad") return 0;
    return dmg === "ap" ? 1 : 0.5; // mixed는 어중간으로 살려 둔다
  }
  // 4) ad·crit·onhit 코어(피바라기·무한의 대검류) → dmg가 ap 단독이면 하드 미스매치
  if (adSide && !hasAP) {
    if (dmg === "ap") return 0;
    // 근사: crit은 평타 캐리 계열 전용 — Marksman/Assassin, 또는 탱커가 아닌 Fighter만.
    //       말파이트(Tank/Fighter) 같은 탱커 겸 전사에게는 치명타 코어를 주지 않는다.
    if (tags.has("crit")) {
      const critOk = roleSet.has("Marksman") || roleSet.has("Assassin") ||
        (roleSet.has("Fighter") && !roleSet.has("Tank"));
      if (!critOk) return 0;
    }
    if (dmg === "ad") return 1;
    // mixed: 평타/AD 계열 역할이면 적합, 그 외(순수 탱커·메이지·서폿)는 어중간
    return roleSet.has("Marksman") || roleSet.has("Assassin") || roleSet.has("Fighter")
      ? 1 : 0.5;
  }
  // 5) 그 외 — ad+ap 하이브리드(구인수류)와 move/mana/heal·shield 순수 유틸은 관대하게 통과.
  //    heal 태그 단독 판정 금지 계약이 여기서 지켜진다.
  return 1;
}

// ---------------------------------------------------------------- ③ 아이템 병합

function buildItems(matchedCombos, matchedRules, itemList, pickedTagSet, champ, champTags, champName) {
  const byId = new Map();
  for (const it of itemList) {
    if (it && it.id != null) byId.set(it.id, it);
  }
  const out = [];
  const seen = new Set();
  const add = (id, reason) => {
    if (out.length >= MAX_ITEMS || seen.has(id)) return;
    seen.add(id); // 데이터에 없는 id도 중복 시도는 막는다
    const it = byId.get(id);
    if (!it) return; // 아이템 데이터에 없으면 무시 (병렬 제작 중 방어)
    out.push({
      id: it.id,
      nameKo: isStr(it.nameKo) ? it.nameKo : String(it.id),
      icon: isStr(it.icon) ? it.icon : "",
      reason,
    });
  };

  // 1) combo 아이템 최우선 (매칭 순위대로)
  //    챔피언이 명시된 combo(m.specific)는 큐레이션을 신뢰해 fitScore를 무시한다
  //    (AP 나서스 같은 변신 컨셉 보호). champions가 빈(전 챔피언용) combo의
  //    아이템에만 class-fit 필터를 적용해 하드 미스매치(0)를 거른다.
  for (const m of matchedCombos) {
    const title = isStr(m.combo.title) ? m.combo.title : "시너지";
    for (const id of toArray(m.combo.items)) {
      if (!m.specific && fitScore(byId.get(id), champ) === 0) continue;
      add(id, `"${title}" 조합의 핵심 아이템`);
    }
  }
  // 2) 태그 규칙 아이템 — 규칙 점수 × fitScore 순으로 정렬해 채운다.
  //    fitScore 0은 하드 미스매치로 제외, 0.5는 점수에 곱해 후순위로 민다.
  const ruleEntries = [];
  matchedRules.forEach((m, ord) => {
    const why = m.aHit.length
      ? m.aHit.map((t) => TAG_KO[t] || t).join("·") + " 시너지와 맞물리는 아이템"
      : "증강 조합과 두루 어울리는 아이템";
    for (const id of toArray(m.rule.items)) {
      const fit = fitScore(byId.get(id), champ);
      if (fit === 0) continue;
      ruleEntries.push({ id, why, score: m.score * fit, ord });
    }
  });
  ruleEntries.sort((a, b) => (b.score - a.score) || (a.ord - b.ord));
  for (const e of ruleEntries) add(e.id, e.why);
  // 3) 폴백: (아이템 tags × picked 태그 교집합 수) × fitScore 큰 순 — 0은 제외
  if (out.length < MAX_ITEMS && pickedTagSet.size) {
    const scored = [];
    itemList.forEach((it, idx) => {
      if (!it || it.id == null || seen.has(it.id)) return;
      const shared = toArray(it.tags).filter((t) => pickedTagSet.has(t));
      if (!shared.length) return;
      const fit = fitScore(it, champ);
      if (fit === 0) return; // 클래스 하드 미스매치는 폴백에서도 제외
      scored.push({ it, idx, shared, w: shared.length * fit });
    });
    scored.sort((a, b) => (b.w - a.w) || (a.idx - b.idx));
    for (const s of scored) {
      if (out.length >= MAX_ITEMS) break;
      add(s.it.id, (TAG_KO[s.shared[0]] || s.shared[0]) + " 증강과 시너지가 나는 아이템");
    }
  }
  // 4) 그래도 부족하면 챔피언 역할 기반 기본 코어템
  //    근사: 부 역할(애쉬의 Support 등)의 역할 태그가 support/tank 계열 후보를 끌어올 수
  //    있으므로 여기서도 fitScore 0(하드 미스매치)은 최후순위로 민다. 다만 마지막
  //    안전망까지 조이면 빈손이 될 수 있어 완전히 버리지는 않는다 — fit>0 후보가
  //    모자랄 때만 fit 0 후보로 채운다(빈손 방지, 과잉 차단 없음).
  if (out.length < MAX_ITEMS && champTags.length) {
    const roleTags = new Set();
    for (const rt of champTags) {
      for (const t of ROLE_ITEM_TAGS[rt] || []) roleTags.add(t);
    }
    const scored = [];
    itemList.forEach((it, idx) => {
      if (!it || it.id == null || seen.has(it.id)) return;
      const shared = toArray(it.tags).filter((t) => roleTags.has(t));
      if (!shared.length) return;
      const fit = fitScore(it, champ);
      scored.push({ it, idx, n: shared.length, fit });
    });
    scored.sort((a, b) =>
      ((a.fit === 0 ? 1 : 0) - (b.fit === 0 ? 1 : 0)) || // fit 0은 항상 뒤로
      (b.n * (b.fit || 1) - a.n * (a.fit || 1)) ||
      (a.idx - b.idx));
    for (const s of scored) {
      if (out.length >= MAX_ITEMS) break;
      add(s.it.id, `${champName}의 기본 코어 아이템`);
    }
  }
  return out;
}

// ---------------------------------------------------------------- ④ funScore

function calcFunScore(matchedCombos, matchedRules, tagCounts, pickedCount) {
  const n = matchedCombos.length;
  const comboPts = n === 0 ? 0 : n === 1 ? 32 : n === 2 ? 44 : 50;
  // 태그 시너지 밀도: 여러 증강이 같은 태그를 공유할수록 가산
  let density = 0;
  for (const count of tagCounts.values()) {
    if (count >= 2) density += (count - 1) * 7;
  }
  density = Math.min(28, density);
  const rulePts = Math.min(12, matchedRules.length * 4);
  const base = pickedCount > 0 ? 10 : 6;
  return clamp(Math.round(base + comboPts + density + rulePts), 0, 100);
}

// ---------------------------------------------------------------- ⑤ headline / styleTags

function buildStyleTags(matchedCombos, champTags, tagCounts) {
  const tags = [];
  for (const m of matchedCombos) {
    for (const t of toArray(m.combo.styleTags).filter(isStr)) {
      if (!tags.includes(t)) tags.push(t);
    }
  }
  if (tags.length) return tags.slice(0, 4);
  // 폴백: 역할 스타일 + 가장 밀도 높은 picked 태그
  const out = [];
  if (champTags[0] && ROLE_STYLE[champTags[0]]) out.push(ROLE_STYLE[champTags[0]]);
  const sorted = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1]);
  for (const [t] of sorted) {
    const s = TAG_STYLE[t];
    if (s && !out.includes(s)) out.push(s);
    if (out.length >= 3) break;
  }
  if (!out.length) out.push("정석");
  return out;
}

function buildHeadline(styleTags, champTags) {
  const noun = ROLE_NOUN[champTags[0]] || "챔피언";
  const s0 = styleTags[0];
  if (s0 && STYLE_HEADLINE[s0]) return STYLE_HEADLINE[s0];
  if (s0 && styleTags[1]) return `${s0}·${styleTags[1]} ${noun}`;
  if (s0 && s0 !== "정석") return `${s0} ${noun}`;
  return `정석대로 강한 ${noun}`;
}

// ---------------------------------------------------------------- playstyle / skills

function buildPlaystyle(matchedCombos, matchedRules, champ, champTags, picked) {
  const pickedCount = picked.length;
  const parts = [];
  const top = matchedCombos[0];
  if (top && isStr(top.combo.whyFun)) parts.push(top.combo.whyFun.trim());
  // 정확 매칭 combo가 없어도 스킬 증강(category === "ability")을 뽑았다면
  // 강화된 스킬 중심 한 줄을 넣는다. category는 augments.json 신규 필드
  // (병렬 제작 중) — 필드가 없으면 조용히 생략하는 방어적 처리.
  if (
    !matchedCombos.length &&
    picked.some((a) => a && a.category === "ability")
  ) {
    parts.push(
      "스킬 증강을 뽑았으니 강화된 스킬 중심 운용이 핵심입니다 — 강화된 스킬의 쿨타임마다 각을 만들어 존재감을 키우세요."
    );
  }
  const rule = matchedRules[0];
  if (rule && isStr(rule.rule.playstyle)) parts.push(rule.rule.playstyle.trim());
  const rolePlay = ROLE_PLAY[champTags[0]];
  if (parts.length < 2 && rolePlay) parts.push(rolePlay);
  if (parts.length < 2) {
    parts.push(
      pickedCount > 0
        ? "뽑힌 증강의 태그가 겹치는 방향으로 아이템을 맞추면 화력이 배가됩니다."
        : "아직 증강이 없으니 챔피언 본연의 강점을 살리는 정석 플레이가 좋습니다.");
  }
  // 챔피언 속성 한 줄 (사거리/근접)
  if (parts.length < 4 && champ) {
    if (champ.ranged === true) {
      parts.push("원거리 사거리를 살려 안전한 거리에서 딜을 넣으세요.");
    } else if (champ.ranged === false) {
      parts.push("근접 챔피언이니 진입 각을 재다가 한 번에 들어가세요.");
    }
  }
  return parts.slice(0, 4).join(" ");
}

function buildSkills(matchedCombos, champ) {
  for (const m of matchedCombos) {
    if (isStr(m.combo.skills)) return m.combo.skills.trim();
  }
  const spells = champ ? toArray(champ.spells) : [];
  const ult = spells[3];
  if (ult && isStr(ult.nameKo)) {
    return `쿨이 짧은 스킬부터 아낌없이 굴리고, R '${ult.nameKo}'는 한타 개시나 마무리에 확실하게 쓰세요.`;
  }
  return "쿨타임이 짧은 스킬부터 아낌없이 굴리는 것이 칼바람의 정석입니다.";
}

// ---------------------------------------------------------------- 메인

export function recommend(input) {
  const opts = input && typeof input === "object" ? input : {};
  const champ = opts.champion && typeof opts.champion === "object" ? opts.champion : null;
  const champId = champ && isStr(champ.id) ? champ.id : "";
  const champName = champ && isStr(champ.nameKo) ? champ.nameKo : "챔피언";
  const champTags = champ ? toArray(champ.tags).filter(isStr) : [];
  const champTagSet = new Set(champTags);

  const augmentList = unwrap(opts.augments, "augments");
  const itemList = unwrap(opts.items, "items");
  const synergies = opts.synergies && typeof opts.synergies === "object" ? opts.synergies : {};
  const combos = unwrap(synergies, "combos");
  const tagRules = toArray(synergies.tagRules);

  const picked = normalizePicked(opts.picked, augmentList);
  const pickedNames = new Set(picked.map((a) => a.apiName).filter(isStr));

  // picked 증강 태그 합집합 + 태그별 밀도(몇 개의 증강이 들고 있나)
  const pickedTagSet = new Set();
  const tagCounts = new Map();
  for (const a of picked) {
    for (const t of uniq(toArray(a.tags).filter(isStr))) {
      pickedTagSet.add(t);
      tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
    }
  }

  // ① 정확 매칭  ② 태그 규칙
  const matchedCombos = matchCombos(combos, champId, pickedNames);
  const matchedRules = matchRules(tagRules, pickedTagSet, tagCounts, champTagSet);

  // ③~⑤ 산출물 조립
  const items = buildItems(matchedCombos, matchedRules, itemList, pickedTagSet, champ, champTags, champName);
  const funScore = calcFunScore(matchedCombos, matchedRules, tagCounts, picked.length);
  const styleTags = buildStyleTags(matchedCombos, champTags, tagCounts);
  const headline = buildHeadline(styleTags, champTags);
  const playstyle = buildPlaystyle(matchedCombos, matchedRules, champ, champTags, picked);
  const skills = buildSkills(matchedCombos, champ);

  return {
    headline,
    playstyle,
    matchedCombos: matchedCombos.map((m) => m.combo),
    items,
    skills,
    funScore,
    styleTags,
  };
}

// ---------------------------------------------------------------- 카드 미리보기

// previewAugment — 드래프트 카드 1장에 대한 "이걸 고르면?" 차분 미리보기.
// recommend()를 딱 두 번(before/after)만 호출해 조립한다 — 중복 구현 없음.
// 방어: 어떤 입력에서도 throw 없이 항상 같은 형태를 반환한다
// (route:"" 또는 recommend 폴백 문자열, 배열은 빈 배열, funDelta는 0).
export function previewAugment(input) {
  const empty = { route: "", styleTags: [], newCombos: [], items: [], funDelta: 0 };
  try {
    const opts = input && typeof input === "object" ? input : {};
    const candidate = opts.candidate;
    // candidate는 증강 객체가 정상이지만 apiName 문자열도 관대하게 허용 (picked와 동일 원칙)
    const candidateName = candidate && typeof candidate === "object" && isStr(candidate.apiName)
      ? candidate.apiName
      : (isStr(candidate) ? candidate : "");
    const picked = toArray(opts.picked);
    const base = {
      champion: opts.champion,
      synergies: opts.synergies,
      items: opts.items,
      augments: opts.augments,
    };

    const before = recommend(Object.assign({}, base, { picked }));
    const after = candidate == null
      ? before
      : recommend(Object.assign({}, base, { picked: picked.concat([candidate]) }));

    // 매칭은 단조 증가(증강이 늘면 매칭도 늘기만 함) — before에 이미 있던 combo는 신규가 아니다.
    // 두 호출이 같은 synergies 객체를 읽으므로 combo는 참조 동일성으로 비교할 수 있다.
    const beforeCombos = new Set(toArray(before.matchedCombos));
    const newCombos = [];
    for (const combo of toArray(after.matchedCombos)) {
      if (newCombos.length >= 2) break;
      if (!combo || typeof combo !== "object") continue;
      if (beforeCombos.has(combo)) continue; // picked만으로 이미 매칭 → 제외
      if (!toArray(combo.augments).some((n) => isStr(n) && n === candidateName)) continue;
      newCombos.push({
        title: isStr(combo.title) ? combo.title : "시너지",
        whyFun: isStr(combo.whyFun) ? combo.whyFun.trim() : "",
      });
    }

    return {
      route: isStr(after.headline) ? after.headline : "",
      styleTags: toArray(after.styleTags).filter(isStr).slice(0, 2),
      newCombos,
      items: toArray(after.items).slice(0, 3).map((it) => ({
        id: it && it.id != null ? it.id : null,
        nameKo: it && isStr(it.nameKo) ? it.nameKo : "",
        icon: it && isStr(it.icon) ? it.icon : "",
      })),
      funDelta: (typeof after.funScore === "number" ? after.funScore : 0) -
        (typeof before.funScore === "number" ? before.funScore : 0),
    };
  } catch (_) {
    return empty; // 미리보기는 부가 정보 — 어떤 오류도 UI를 깨뜨리지 않는다
  }
}

// ---------------------------------------------------------------- 클래스 문맥 표시 티어

// 티어 눈금 (tier-adjust.json _meta.tierScale과 동일 — 인덱스가 작을수록 좋음)
const DISPLAY_TIERS = ["S", "A", "B", "C", "D"];

/**
 * archetypeOf — 챔피언 → 아키타입 6종 결정론 유도.
 * research/data/class-tier-adjust.json _meta.archetypeDerivation 의사코드 그대로:
 *   t0=tags[0]; Support→support; Tank→tank; Marksman→(dmg==='ap'?apMage:adMarksman);
 *   Mage→apMage; Assassin→(dmg==='ap'?apMage:adAssassin); Fighter→(dmg==='ap'?apMage:fighter);
 *   폴백: dmg==='ap'?apMage:fighter
 * 근사: dmg는 DDragon info 격차 기반 근사(enrich-champions.cjs) — 알려진 오분류
 * (Qiyana·Belveth의 dmg='ap')는 조정표 원본 _meta 참조. dmg 누락 시 mixed 취급.
 */
function archetypeOf(champ) {
  const t0 = champ ? toArray(champ.tags).filter(isStr)[0] : "";
  const ap = !!champ && champ.dmg === "ap";
  if (t0 === "Support") return "support";
  if (t0 === "Tank") return "tank";
  if (t0 === "Marksman") return ap ? "apMage" : "adMarksman";
  if (t0 === "Mage") return "apMage";
  if (t0 === "Assassin") return ap ? "apMage" : "adAssassin";
  if (t0 === "Fighter") return ap ? "apMage" : "fighter";
  return ap ? "apMage" : "fighter";
}

/**
 * displayTier — 전역 funTier를 챔피언 문맥으로 조정한 "표시 티어" (표시·routeTargets 전용,
 * 풀 적격성(eligibleAugments)은 건드리지 않는다).
 *
 * 규칙 적용 순서 (tier-adjust.json _meta.ruleSemantics.combine 그대로):
 *  ① 시작 t = funTier 인덱스 (funTier가 없거나 어휘 밖이면 조정 불가 → {tier:null}).
 *  ② 매칭 규칙 전부 수집 — 증강 측 (tags ∩ ifAugmentTags ≠ ∅) AND (tags ∩ unlessAugmentTags = ∅),
 *     챔피언 측 (forDmg가 null이거나 champion.dmg === forDmg — mixed는 forDmg 지정 규칙에 미적용)
 *     AND (forClasses가 비었거나 archetypeOf(champion) ∈ forClasses)
 *     AND (unlessDmg가 없거나 champion.dmg !== unlessDmg — 예: AP 탱커는 ap-core-vs-tank 제외)
 *     AND (unlessChampionTags가 비었거나 champion.tags와 교집합 없음 — 예: Tank,Mage 말파이트는
 *          Mage 부태그 하이브리드라 AP 코어 강등 제외. 2026-09-03 V2 클래스 스위프 확장).
 *  ③ up/down 합산 반영 (up = 인덱스 감소 = 승급), 눈금 범위로 클램프.
 *  ④ 모든 cap 중 가장 낮은 상한(최대 인덱스) 적용 — cap은 강등만 한다.
 *  ⑤ perAugment.overrides[archetype]가 있으면 규칙 결과보다 우선 (예외 확정 지정).
 *
 * @param {Object} augment 증강 (funTier·tags 사용)
 * @param {Object} champion 챔피언 (tags·dmg 사용)
 * @param {Object} [adjust] tier-adjust.json 전체({rules, perAugment}) — 없으면 무조정
 * @returns {{tier: string|null, reason: string|null}}
 *   tier: 조정된 표시 티어 (funTier 없으면 null). reason: 조정이 실제로 일어났을 때
 *   결정적이었던 규칙/예외의 사유 한 줄 (무변경이면 null) — UI 툴팁·사전 각주용.
 * 순수 함수 — rng 미소비, 어떤 입력에도 throw 없음.
 */
export function displayTier(augment, champion, adjust) {
  const funTier = augment && isStr(augment.funTier) ? augment.funTier : null;
  const base = funTier === null ? -1 : DISPLAY_TIERS.indexOf(funTier);
  if (base === -1) return { tier: null, reason: null };
  try {
    const rules = adjust ? toArray(adjust.rules) : [];
    const perAugment = adjust ? toArray(adjust.perAugment) : [];
    if (!rules.length && !perAugment.length) return { tier: funTier, reason: null };

    const arch = archetypeOf(champion);
    const dmg = champion && (champion.dmg === "ad" || champion.dmg === "ap") ? champion.dmg : "mixed";
    const champTags = new Set(champion ? toArray(champion.tags).filter(isStr) : []);
    const tags = new Set(augment ? toArray(augment.tags).filter(isStr) : []);
    const apiName = augment && isStr(augment.apiName) ? augment.apiName : "";

    // ⑤ perAugment 예외가 있으면 규칙 계산 없이 그 값이 확정 (규칙 결과보다 우선)
    for (const p of perAugment) {
      if (!p || p.apiName !== apiName || !p.overrides) continue;
      const t = p.overrides[arch];
      if (isStr(t) && DISPLAY_TIERS.indexOf(t) !== -1) {
        return { tier: t, reason: t === funTier ? null : (isStr(p.reason) ? p.reason : null) };
      }
    }

    // ②~④ 규칙 매칭·합성
    let delta = 0; // up/down 합산 (음수 = 승급)
    let capIdx = -1; // 가장 낮은 상한(최대 인덱스)
    let deltaReason = null;
    let capReason = null;
    for (const r of rules) {
      if (!r || typeof r !== "object" || !isStr(r.adjust)) continue;
      const ifTags = toArray(r.ifAugmentTags).filter(isStr);
      if (!ifTags.some((t) => tags.has(t))) continue;
      if (toArray(r.unlessAugmentTags).filter(isStr).some((t) => tags.has(t))) continue;
      if (isStr(r.forDmg) && r.forDmg !== dmg) continue;
      const forClasses = toArray(r.forClasses).filter(isStr);
      if (forClasses.length && forClasses.indexOf(arch) === -1) continue;
      // 챔피언 측 제외 가드 (2026-09-03 V2 클래스 스위프 확장 — tier-adjust.json _meta 참조):
      // unlessDmg = 해당 dmg 챔피언에 미적용 (AP 탱커·아무무류는 AP 코어가 실빌드),
      // unlessChampionTags = 부태그 하이브리드 제외 (Tank,Mage 말파이트 — AP 원콤 실빌드,
      // mm 실측 유레카 1482게임 정상 제시).
      if (isStr(r.unlessDmg) && r.unlessDmg === dmg) continue;
      const unlessChampTags = toArray(r.unlessChampionTags).filter(isStr);
      if (unlessChampTags.length && unlessChampTags.some((t) => champTags.has(t))) continue;
      let m;
      if ((m = /^cap:([SABCD])$/.exec(r.adjust))) {
        const idx = DISPLAY_TIERS.indexOf(m[1]);
        if (idx > capIdx) { capIdx = idx; capReason = isStr(r.reason) ? r.reason : null; }
      } else if ((m = /^down:(\d+)$/.exec(r.adjust))) {
        delta += Number(m[1]);
        if (!deltaReason) deltaReason = isStr(r.reason) ? r.reason : null;
      } else if ((m = /^up:(\d+)$/.exec(r.adjust))) {
        delta -= Number(m[1]);
        if (!deltaReason) deltaReason = isStr(r.reason) ? r.reason : null;
      }
    }
    let idx = clamp(base + delta, 0, DISPLAY_TIERS.length - 1);
    let reason = idx !== base ? deltaReason : null;
    if (capIdx > idx) { idx = capIdx; reason = capReason; } // cap이 결정적이면 그 사유가 대표
    if (idx === base) return { tier: funTier, reason: null };
    return { tier: DISPLAY_TIERS[idx], reason };
  } catch (_) {
    return { tier: funTier, reason: null }; // 조정은 부가 정보 — 실패 시 전역 티어로 폴백
  }
}

// ---------------------------------------------------------------- 목표 집합 T (리롤 확률 어드바이저)

/**
 * routeTargets — "꿀조합을 진전시키는 증강 집합" T 산출 (SPEC-day2 §3-3).
 * previewAugment와 같은 콤보 매칭 어휘(comboAppliesTo·apiName 기준)를 재사용해,
 * champion+picked(+candidate) 기준으로 다음 두 집합의 합을 목표 T로 만든다:
 *  · routeSet — 진행 중/열리는 콤보의 미완성 구성 증강: 이 챔피언에게 적용 가능한 combo 중
 *    picked∪candidate와 1개 이상 겹치는 것(진행 중 루트)의 요구 증강에서
 *    이미 확보분(picked·candidate)·이미 노출분(game.used)·풀 밖(비적격)을 뺀 나머지.
 *  · sTierSet — funTier 'S' 증강(풀 내·미노출) — 콤보 밖에서도 "꿀잼 각"인 일반 목표.
 * 반환 Set은 draft.js hitProbability(dist, set)에 그대로 넣을 수 있다.
 *
 * 순수 함수: game을 변경하지 않고 rng를 소비하지 않는다. 어떤 입력에도 throw 없이
 * 항상 같은 형태를 반환한다 (previewAugment와 동일 방어 원칙).
 *
 * @param {Object} input { champion, picked, candidate?, synergies, augments, game?, tierAdjust? }
 *   - candidate: 드래프트 카드 1장 (증강 객체 또는 apiName 문자열) — 카드별 T 계산용.
 *     candidate 자신은 T에 넣지 않는다 (이미 화면에 노출된 카드는 리롤 목표가 아님).
 *   - game: draft.js 게임 상태 — pool(챔피언 조건부 풀)·used(노출분 제외)에만 접근.
 *     없으면 eligibleAugments(augments, champion)로 풀을 재산출한다 (드래프트와 동일 판정).
 *   - tierAdjust: tier-adjust.json — 주어지면 sTierSet·candidateIsSTier를 displayTier
 *     (챔피언 문맥 티어) 'S' 기준으로 판정한다. 없으면 전역 funTier 'S' (하위 호환).
 * @returns {{ targets: Set<string>, routeSet: Set<string>, sTierSet: Set<string>,
 *   combos: Array<{title: string, missing: Array<string>}>,
 *   candidateInRoute: boolean, candidateIsSTier: boolean }}
 *   - combos: routeSet의 근거 — 콤보별 미완성 증강 목록 (UI의 "잔여 m개" 셈·툴팁용)
 *   - candidateInRoute: candidate가 이 챔피언의 어느 콤보 구성원이면 true
 *     ("지금 먹으면 확정 — 리롤은 이 카드를 영구 소각" 비대칭 경고 §3-4-2 근거)
 *   - candidateIsSTier: candidate의 funTier가 'S'면 true
 */
export function routeTargets(input) {
  const empty = {
    targets: new Set(), routeSet: new Set(), sTierSet: new Set(),
    combos: [], candidateInRoute: false, candidateIsSTier: false,
  };
  try {
    const opts = input && typeof input === "object" ? input : {};
    const champ = opts.champion && typeof opts.champion === "object" ? opts.champion : null;
    const champId = champ && isStr(champ.id) ? champ.id : "";
    const augmentList = unwrap(opts.augments, "augments");
    const synergies = opts.synergies && typeof opts.synergies === "object" ? opts.synergies : {};
    const combos = unwrap(synergies, "combos");
    const game = opts.game && typeof opts.game === "object" ? opts.game : null;
    const tierAdjust = opts.tierAdjust && typeof opts.tierAdjust === "object" ? opts.tierAdjust : null;

    // 확보분: picked(+candidate) apiName — 이들은 목표가 아니다 (이미 손에 있거나 화면에 있음)
    const picked = normalizePicked(opts.picked, augmentList);
    const names = new Set(picked.map((a) => a.apiName).filter(isStr));
    const candidate = opts.candidate;
    const candidateName = candidate && typeof candidate === "object" && isStr(candidate.apiName)
      ? candidate.apiName
      : (isStr(candidate) ? candidate : "");
    if (candidateName) names.add(candidateName);

    // 풀: game.pool(드래프트가 이미 계산한 챔피언 조건부 풀) 우선,
    // 없으면 draft.js eligibleAugments로 동일 판정 재산출 (드리프트 방지).
    let poolList = [];
    if (game && Array.isArray(game.pool)) {
      poolList = game.pool;
    } else if (augmentList.length) {
      try { poolList = eligibleAugments(augmentList, champ); } catch (_) { poolList = []; }
    }
    const poolNames = new Set();
    for (const a of poolList) {
      if (a && isStr(a.apiName)) poolNames.add(a.apiName);
    }
    const usedSet = new Set(game && Array.isArray(game.used) ? game.used.filter(isStr) : []);

    // "아직 나올 수 있는" 판정: 확보분 아님 + 노출분 아님 + (풀을 알면) 풀 안
    // 방어: 풀 미산출(augments 미제공)이면 풀 교집합은 생략한다 — 빈손 오탐 방지.
    const available = (n) =>
      !names.has(n) && !usedSet.has(n) && (poolNames.size === 0 || poolNames.has(n));

    // ① routeSet — 진행 중 루트(콤보)의 미완성분
    const routeSet = new Set();
    const comboInfos = [];
    let candidateInRoute = false;
    for (const combo of combos) {
      if (!combo || typeof combo !== "object") continue;
      if (!comboAppliesTo(combo, champId)) continue;
      const req = toArray(combo.augments).filter(isStr);
      if (!req.length) continue;
      if (candidateName && req.indexOf(candidateName) !== -1) candidateInRoute = true;
      if (!req.some((n) => names.has(n))) continue; // 진행 0 콤보는 "진행 중 루트"가 아님 (§3-3)
      const missing = req.filter(available);
      if (!missing.length) continue; // 이미 완성(또는 잔여분 전부 소진) — 쫓을 것이 없음
      for (const n of missing) routeSet.add(n);
      comboInfos.push({ title: isStr(combo.title) ? combo.title : "시너지", missing });
    }

    // ② sTierSet — "이 챔피언에게 S"인 잔여분. tierAdjust가 있으면 displayTier(문맥 티어)
    //    기준 — 전역 S(태풍)가 AP 딜러의 목표 집합에 끼는 오류를 막는다. 없으면 종전대로
    //    전역 funTier 'S' (displayTier가 무조정 폴백하므로 동일 판정 — 하위 호환).
    const sTierSet = new Set();
    for (const a of poolList) {
      if (a && isStr(a.apiName) && available(a.apiName) &&
        displayTier(a, champ, tierAdjust).tier === "S") {
        sTierSet.add(a.apiName);
      }
    }

    // 합집합 T (routeSet 우선 순서 보존 — Set 삽입 순서 = 표시 순서)
    const targets = new Set(routeSet);
    for (const n of sTierSet) targets.add(n);

    let candidateIsSTier = false;
    if (candidateName) {
      let cand = (candidate && typeof candidate === "object") ? candidate : null;
      if (!cand || cand.funTier === undefined) {
        for (const a of augmentList) {
          if (a && a.apiName === candidateName) { cand = a; break; }
        }
      }
      // sTierSet과 동일 판정(displayTier) — 카드 배지와 목표 집합이 다른 답을 내지 않게 한다
      candidateIsSTier = !!cand && displayTier(cand, champ, tierAdjust).tier === "S";
    }

    return {
      targets,
      routeSet,
      sTierSet,
      combos: comboInfos,
      candidateInRoute,
      candidateIsSTier,
    };
  } catch (_) {
    return empty; // 확률 어드바이저는 부가 정보 — 어떤 오류도 UI를 깨뜨리지 않는다
  }
}

// ---------------------------------------------------------------- 챔피언 꿀잼 사전 (#dex)

const SKILL_KEYS = ["Q", "W", "E", "R"];

/** champion.spells에서 스킬 키의 한국어명 조회 (없으면 null) — 사전 표시용 */
function spellNameOf(champ, key) {
  const spells = (champ && Array.isArray(champ.spells)) ? champ.spells : [];
  for (const s of spells) {
    if (s && s.key === key) return isStr(s.nameKo) ? s.nameKo : null;
  }
  return null;
}

/**
 * buildDossier — 챔피언 꿀잼 사전(#dex/{챔피언id} 화면) 데이터 셰이퍼 (SPEC-day2 §2).
 * DOM 접근 금지 — 표시용 plain 데이터만 조립한다. rng 미소비, 어떤 입력에도 throw 없음.
 *
 * @param {Object} input { champion, synergies, items, augments, funrank?, tierAdjust? }
 *   funrank는 funrank.json 전체({ranks:[...]}) 또는 ranks 배열 — 없어도 동작(헤더만 빈약해짐).
 *   tierAdjust는 tier-adjust.json 전체 — 없으면 recommended의 문맥 티어가 전역 funTier로 폴백.
 * @returns {{
 *   header: { id, nameKo, title, icon, tags, funTier, funScore, oneLiner, signatureAugments },
 *   recommended: Array<{apiName, nameKo, tier, displayTier, icon, descKo,
 *     source: 'signature'|'stier'}>,
 *   _ineligibleSignatures: Array<string>,
 *   combos: Array<{ title, whyFun, matchType, skills, styleTags, source, signature,
 *     augments: Array<{apiName, nameKo, tier, funTier, category, eligible}>,
 *     items: Array<{id, nameKo, icon}> }>,
 *   fallbackRoutes: Array<{ title, playstyle, tags, items: Array<{id, nameKo, icon}> }>,
 *   abilityTable: Array<{ apiName, nameKo, tier, funTier, descKo,
 *     fixed: {key, nameKo}|null, fixedBy: 'pin'|'slot'|'only'|null,
 *     candidates: Array<{key, nameKo, p}>, excluded: Array<{key, nameKo, reason}>,
 *     measured: boolean }>,
 *   exampleItems: Array<{id, nameKo, icon, reason}>
 * }}
 *  - recommended (dex-recommended 계약): 시그니처(풀 내, source:'signature') →
 *    문맥 S(source:'stier') → 문맥 A 보충, 합계 최대 10개. 정렬은 signature 먼저 →
 *    displayTier(S>A) → funTier → 이름(ko). 풀 밖 시그니처는 _ineligibleSignatures로
 *    보고만 한다 — 미리보기 시그니처 ⊆ 사전 recommended 불변식의 셰이퍼 측 절반.
 *  - combos: comboAppliesTo(champion 필터) 통과 + 이 챔피언 풀로 발동 가능한 것만
 *    (all이면 요구 증강 전부, any면 1개 이상이 풀에 있어야 함). 정렬: funrank
 *    signatureAugments 포함 콤보 → 챔피언 명시 콤보 → 원래 순서 (§2-1 "시그니처 우선").
 *  - fallbackRoutes: combos 0건일 때만 채움 (§2-3) — tagRules를 matchRules(recommend의
 *    태그 점수화)로 재사용하되, picked 대신 "이 챔피언 풀의 증강 태그 전체"를 넣어
 *    "어떤 증강이 떠도 갈 수 있는 일반 루트"를 뽑는다. 상위 3개.
 *  - abilityTable의 확정 판정: draft.js skillOdds 재사용 (§2-2 — presentAugment
 *    ①spellPin ②slot ③무작위와 단일 해소기 공유, pin·exclude 충돌 시 ③ 강등 포함).
 *    fixed = 확률 1.0으로 지정되는 스킬. fixedBy: 'pin'(실측 확정 매핑)/'slot'(슬롯
 *    고정형)/'only'(적격 스킬이 하나뿐이라 결과적으로 확정). candidates의 p는
 *    ③ 균등 배정 확률 — 근사: 실제 지정 규칙은 비공개라 균등으로 근사 (draft.js 주석 참조).
 *  - measured("실측" 배지): 이 챔피언에 대한 restrictions.spellPin 또는 spellExclude
 *    항목이 있으면 true — 두 필드는 research/data/ability-augment-map.json 실측
 *    306건에서 이식된 것만 존재한다 (근거: research/ABILITY-AUGMENT-DATA.md §4).
 */
export function buildDossier(input) {
  const emptyHeader = {
    id: "", nameKo: "챔피언", title: "", icon: "", tags: [],
    funTier: null, funScore: null, oneLiner: "", signatureAugments: [],
  };
  const empty = {
    header: emptyHeader, recommended: [], _ineligibleSignatures: [],
    combos: [], fallbackRoutes: [], abilityTable: [], exampleItems: [],
  };
  try {
    const opts = input && typeof input === "object" ? input : {};
    const champ = opts.champion && typeof opts.champion === "object" ? opts.champion : null;
    const champId = champ && isStr(champ.id) ? champ.id : "";
    const champName = champ && isStr(champ.nameKo) ? champ.nameKo : "챔피언";
    const champTags = champ ? toArray(champ.tags).filter(isStr) : [];
    const champTagSet = new Set(champTags);

    const augmentList = unwrap(opts.augments, "augments");
    const itemList = unwrap(opts.items, "items");
    const synergies = opts.synergies && typeof opts.synergies === "object" ? opts.synergies : {};
    const combos = unwrap(synergies, "combos");
    const tagRules = toArray(synergies.tagRules);
    const ranks = unwrap(opts.funrank, "ranks");

    const byId = new Map();
    for (const it of itemList) {
      if (it && it.id != null) byId.set(it.id, it);
    }
    const augByName = new Map();
    for (const a of augmentList) {
      if (a && isStr(a.apiName)) augByName.set(a.apiName, a);
    }

    // 이 챔피언의 조건부 풀 — 드래프트와 동일 판정 (draft.js eligibleAugments 재사용)
    let pool = [];
    try { pool = eligibleAugments(augmentList, champ); } catch (_) { pool = []; }
    const poolNames = new Set();
    for (const a of pool) {
      if (a && isStr(a.apiName)) poolNames.add(a.apiName);
    }

    // ── 1) 헤더 (funrank 결합 — 없으면 챔피언 기본 정보만)
    let rank = null;
    for (const r of ranks) {
      if (r && r.id === champId) { rank = r; break; }
    }
    const signatureAugments = rank ? toArray(rank.signatureAugments).filter(isStr) : [];
    const header = {
      id: champId,
      nameKo: champName,
      title: champ && isStr(champ.title) ? champ.title : "",
      icon: champ && isStr(champ.icon) ? champ.icon : "",
      tags: champTags,
      funTier: rank && isStr(rank.tier) ? rank.tier : null,
      funScore: rank && typeof rank.funScore === "number" ? rank.funScore : null,
      oneLiner: rank && isStr(rank.oneLiner) ? rank.oneLiner.trim() : "",
      signatureAugments,
    };
    const sigSet = new Set(signatureAugments);

    // ── 1.5) 추천 증강 (dex-recommended 계약) — 미리보기 시그니처와 사전을 한 데이터로.
    // ① 시그니처 ∩ 풀 (source:"signature") — 풀 밖 시그니처는 recommended에서 제외하되
    //    _ineligibleSignatures로 보고 (감사용: validate-data 6-5 게이트가 0건을 강제).
    // ② 풀에서 문맥 티어(displayTier) S인 증강, A로 보충 (source:"stier") — 중복 제외.
    // 정렬: signature 먼저 → displayTier(S>A) → funTier → 이름(ko). 합계 최대 10개 —
    // signature(최대 3)가 정렬상 항상 앞이라 절단으로 밀려나지 않는다. 표시 전용·rng 미소비.
    const tierAdjust = opts.tierAdjust && typeof opts.tierAdjust === "object" ? opts.tierAdjust : null;
    const recTierIdx = (t) => {
      const i = DISPLAY_TIERS.indexOf(t);
      return i === -1 ? DISPLAY_TIERS.length : i; // 어휘 밖/null은 맨 뒤
    };
    const recEntry = (a, disp, source) => ({
      apiName: a.apiName,
      nameKo: isStr(a.nameKo) ? a.nameKo : a.apiName,
      tier: isStr(a.tier) ? a.tier : "",
      displayTier: disp,
      icon: isStr(a.icon) ? a.icon : "",
      descKo: isStr(a.descKo) ? a.descKo : "",
      source,
    });
    const recAll = []; // { e: 표시 항목, f: 전역 funTier(정렬 3키) }
    const recSeen = new Set();
    const _ineligibleSignatures = [];
    for (const n of signatureAugments) {
      if (!poolNames.has(n)) { _ineligibleSignatures.push(n); continue; }
      const a = augByName.get(n);
      if (!a || recSeen.has(n)) continue;
      recSeen.add(n);
      recAll.push({ e: recEntry(a, displayTier(a, champ, tierAdjust).tier, "signature"), f: a.funTier });
    }
    for (const a of pool) {
      if (!a || !isStr(a.apiName) || recSeen.has(a.apiName)) continue;
      const disp = displayTier(a, champ, tierAdjust).tier;
      if (disp !== "S" && disp !== "A") continue;
      recSeen.add(a.apiName);
      recAll.push({ e: recEntry(a, disp, "stier"), f: a.funTier });
    }
    recAll.sort((x, y) =>
      ((y.e.source === "signature" ? 1 : 0) - (x.e.source === "signature" ? 1 : 0)) ||
      (recTierIdx(x.e.displayTier) - recTierIdx(y.e.displayTier)) ||
      (recTierIdx(x.f) - recTierIdx(y.f)) ||
      String(x.e.nameKo).localeCompare(String(y.e.nameKo), "ko"));
    const recommended = recAll.slice(0, 10).map((r) => r.e);

    // ── 2) 꿀잼 조합 카드 목록 — 적용 가능 + 발동 가능한 combo 전부
    const comboEntries = [];
    combos.forEach((combo, idx) => {
      if (!combo || typeof combo !== "object") return;
      if (!comboAppliesTo(combo, champId)) return;
      const req = toArray(combo.augments).filter(isStr);
      if (!req.length) return;
      const augInfos = req.map((n) => {
        const a = augByName.get(n);
        return {
          apiName: n,
          nameKo: a && isStr(a.nameKo) ? a.nameKo : n,
          tier: a && isStr(a.tier) ? a.tier : "",
          funTier: a && isStr(a.funTier) ? a.funTier : "",
          category: a && isStr(a.category) ? a.category : "",
          eligible: poolNames.has(n), // 이 챔피언 풀에서 실제로 나올 수 있는가
        };
      });
      // 발동 가능성: all은 요구 증강 전부, any는 1개 이상이 풀에 있어야 사전에 싣는다
      const eligCount = augInfos.filter((x) => x.eligible).length;
      const type = combo.matchType === "all" ? "all" : "any";
      if (type === "all" ? eligCount < req.length : eligCount < 1) return;
      comboEntries.push({
        combo, idx, type, augInfos,
        signature: augInfos.some((x) => sigSet.has(x.apiName)),
        specific: toArray(combo.champions).filter(isStr).length > 0,
      });
    });
    // 정렬: 시그니처 콤보 → 챔피언 명시 콤보 → 원래 순서 (§2-1 "funScore/시그니처 우선")
    comboEntries.sort((a, b) =>
      ((b.signature ? 1 : 0) - (a.signature ? 1 : 0)) ||
      ((b.specific ? 1 : 0) - (a.specific ? 1 : 0)) ||
      (a.idx - b.idx));
    const comboOut = comboEntries.map((e) => {
      const c = e.combo;
      const comboItems = [];
      for (const id of toArray(c.items)) {
        const it = byId.get(id);
        if (!it) continue;
        // buildItems ①과 동일 정책: 챔피언 명시 combo는 큐레이션 신뢰(fitScore 무시),
        // 전 챔피언용 combo의 아이템만 하드 미스매치(0)를 거른다.
        if (!e.specific && fitScore(it, champ) === 0) continue;
        comboItems.push({
          id: it.id,
          nameKo: isStr(it.nameKo) ? it.nameKo : String(it.id),
          icon: isStr(it.icon) ? it.icon : "",
        });
      }
      return {
        title: isStr(c.title) ? c.title : "시너지",
        whyFun: isStr(c.whyFun) ? c.whyFun.trim() : "",
        matchType: e.type,
        skills: isStr(c.skills) ? c.skills.trim() : "",
        styleTags: toArray(c.styleTags).filter(isStr),
        source: isStr(c.source) ? c.source : "",
        signature: e.signature,
        augments: e.augInfos,
        items: comboItems,
      };
    });

    // ── 3) 콤보 0건 폴백 (§2-3) — tagRules 점수화 재사용으로 일반 루트 2~3개
    // picked가 없는 화면이므로 "이 챔피언 풀에 실재하는 증강 태그 전체"를 pickedTagSet
    // 자리에 넣는다: 규칙이 요구하는 태그의 증강이 풀에 하나도 없으면 그 루트는 이
    // 챔피언에게 애초에 불가능하므로 자연히 걸러지고, density(태그 보유 증강 수)는
    // "그 루트를 열어 줄 증강이 풀에 몇 개나 있나"로 읽혀 정렬 근거가 된다.
    let fallbackRoutes = [];
    if (!comboOut.length) {
      const poolTagSet = new Set();
      const poolTagCounts = new Map();
      for (const a of pool) {
        for (const t of uniq(toArray(a && a.tags).filter(isStr))) {
          poolTagSet.add(t);
          poolTagCounts.set(t, (poolTagCounts.get(t) || 0) + 1);
        }
      }
      const ruleMatches = matchRules(tagRules, poolTagSet, poolTagCounts, champTagSet);
      fallbackRoutes = ruleMatches.slice(0, 3).map((m) => {
        const label = m.aHit.slice(0, 2)
          .map((t) => TAG_STYLE[t] || TAG_KO[t] || t)
          .join("·");
        const routeItems = [];
        for (const id of toArray(m.rule.items)) {
          const it = byId.get(id);
          if (!it || fitScore(it, champ) === 0) continue; // 하드 미스매치 제외 (buildItems ②와 동일)
          routeItems.push({
            id: it.id,
            nameKo: isStr(it.nameKo) ? it.nameKo : String(it.id),
            icon: isStr(it.icon) ? it.icon : "",
          });
          if (routeItems.length >= 3) break;
        }
        return {
          title: (label || "정석") + " 루트",
          playstyle: isStr(m.rule.playstyle) ? m.rule.playstyle.trim() : "",
          tags: m.aHit.slice(),
          items: routeItems,
        };
      });
    }

    // ── 4) 스킬 증강 표 — eligibleAugments ∩ category==='ability' 전부 (풀 순서 유지)
    const abilityTable = [];
    for (const a of pool) {
      if (!a || a.category !== "ability") continue;
      const r = a.restrictions || {};
      // 확정/후보 판정은 draft.js skillOdds에 위임 — presentAugment와 단일 해소기 공유
      // (skillOdds는 game.champion만 읽으므로 {champion} 셈 객체로 호출)
      const odds = skillOdds({ champion: champ }, a);
      let fixedKey = null;
      for (const k of SKILL_KEYS) {
        if (odds[k] === 1) { fixedKey = k; break; }
      }
      // fixedBy는 표기용 주석일 뿐 판정은 위 odds가 전부다 (드리프트 방지):
      // pin이 그 키를 가리키면 'pin'(실측 확정), 아니면 slot이면 'slot', 그 외 확정은
      // "적격 스킬이 하나뿐"인 ③의 극단 케이스 → 'only'.
      const pinKey = (champId && r.spellPin && typeof r.spellPin[champId] === "string")
        ? r.spellPin[champId]
        : null;
      const slotKey = typeof r.slot === "string" ? r.slot : null;
      const fixedBy = fixedKey === null
        ? null
        : (pinKey === fixedKey ? "pin" : (slotKey === fixedKey ? "slot" : "only"));
      const candidates = [];
      if (fixedKey === null) {
        for (const k of SKILL_KEYS) {
          if (odds[k] > 0) candidates.push({ key: k, nameKo: spellNameOf(champ, k), p: odds[k] });
        }
      }
      const exKeys = (champId && r.spellExclude && Array.isArray(r.spellExclude[champId]))
        ? r.spellExclude[champId].filter((k) => SKILL_KEYS.indexOf(k) !== -1)
        : [];
      const excluded = exKeys.map((k) => ({
        key: k,
        nameKo: spellNameOf(champ, k),
        reason: isStr(r.note) ? r.note.trim() : "실측/공식 근거로 이 스킬은 강화 대상에서 제외",
      }));
      abilityTable.push({
        apiName: a.apiName,
        nameKo: isStr(a.nameKo) ? a.nameKo : a.apiName,
        tier: isStr(a.tier) ? a.tier : "",
        funTier: isStr(a.funTier) ? a.funTier : "",
        descKo: isStr(a.descKo) ? a.descKo : "",
        fixed: fixedKey === null ? null : { key: fixedKey, nameKo: spellNameOf(champ, fixedKey) },
        fixedBy,
        candidates,
        excluded,
        // "실측" 배지: 이 챔피언 항목이 spellPin/spellExclude에 있으면 실측 306건 이식분
        measured: pinKey !== null || exKeys.length > 0,
      });
    }

    // ── 5) 예시 아이템 — fitScore 상위 최대 8개 (조합 카드와 중복 허용 — 여긴 범용 추천)
    const roleTags = new Set();
    for (const rt of champTags) {
      for (const t of ROLE_ITEM_TAGS[rt] || []) roleTags.add(t);
    }
    const scored = [];
    itemList.forEach((it, idx) => {
      if (!it || it.id == null) return;
      const fit = fitScore(it, champ);
      if (fit === 0) return; // 클래스 하드 미스매치는 사전에서도 제외
      const shared = toArray(it.tags).filter((t) => roleTags.has(t));
      scored.push({ it, idx, fit, shared });
    });
    scored.sort((a, b) =>
      (b.fit - a.fit) ||
      (b.shared.length - a.shared.length) ||
      (a.idx - b.idx));
    const exampleItems = scored.slice(0, 8).map((s) => ({
      id: s.it.id,
      nameKo: isStr(s.it.nameKo) ? s.it.nameKo : String(s.it.id),
      icon: isStr(s.it.icon) ? s.it.icon : "",
      reason: s.shared.length
        ? (TAG_KO[s.shared[0]] || s.shared[0]) + " 계열 — " + champName + " 클래스와 잘 맞는 범용 추천"
        : "클래스 불문 두루 어울리는 범용 추천",
    }));

    return { header, recommended, _ineligibleSignatures, combos: comboOut, fallbackRoutes, abilityTable, exampleItems };
  } catch (_) {
    return empty; // 사전 화면은 참고서 — 어떤 오류도 UI를 깨뜨리지 않는다
  }
}
