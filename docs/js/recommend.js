// docs/js/recommend.js — 증바람 추천 엔진 (ESM, DOM 접근 금지, 브라우저·Node 겸용 순수 로직)
//
// export function recommend({champion, picked, synergies, items, augments})
// 반환: { headline, playstyle, matchedCombos, items:[{id,nameKo,icon,reason}](최대 6),
//         skills, funScore(0~100), styleTags:[...] }
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

function matchCombos(combos, champId, pickedNames) {
  const matched = [];
  combos.forEach((combo, idx) => {
    if (!combo || typeof combo !== "object") return;
    const champs = toArray(combo.champions).filter(isStr);
    // champions 비어 있음 = 모든 챔피언 허용
    if (champs.length) {
      if (!isStr(champId)) return;
      const ok = champs.some((c) => c.toLowerCase() === champId.toLowerCase());
      if (!ok) return;
    }
    const req = toArray(combo.augments).filter(isStr);
    if (!req.length) return; // 요구 증강이 없으면 "정확 매칭"이 아님
    const hit = req.filter((name) => pickedNames.has(name));
    const type = combo.matchType === "all" ? "all" : "any"; // 누락 시 any로 관대하게
    const pass = type === "all" ? hit.length === req.length : hit.length >= 1;
    if (!pass) return;
    matched.push({ combo, idx, hit: hit.length, specific: champs.length > 0 });
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
