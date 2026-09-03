/* ============================================================
 * 증바람 시뮬레이터 — UI 컨트롤러 (B3)
 *
 * 화면 3개 SPA: ① 챔피언 선택 → ② 증강 드래프트 → ③ 결과/추천.
 * draft.js / recommend.js / data/*.json 은 공용 인터페이스 계약을
 * 그대로 신뢰하고 import 한다 (병렬 제작 — 통합은 C1 담당).
 *
 * data/funrank.json 은 선택 데이터 (꿀잼 티어·정렬·oneLiner):
 * 부재/파싱 실패 시 관련 UI(배지·정렬 칩·미리보기·결과 티어 줄)를
 * 전부 생략하고 기존 4종 데이터만으로 동일하게 동작한다 (방어적).
 * augments.json의 funTier(S~D, F1 병렬 생성 중)도 선택 필드:
 * 부재 시 드래프트 카드는 기존 희귀 등급 테두리로 폴백한다.
 *
 * 공유 URL 형식: ?champ=<id>&seed=<정수>&picks=<라운드별 액션>-...&l9=1(선택)
 *   - 액션 2글자: p<슬롯>=선택, r<슬롯>=일반 리롤, g<슬롯>=황금 리롤
 *   - 예: picks=p2-r0p1-g2p0-p1
 *   - 리롤도 RNG를 소모하므로, 픽 인덱스와 함께 리롤 액션까지
 *     기록해야 같은 seed에서 같은 결과가 재현된다.
 *   - l9=1: 진행도 트랙 Lv9 보정(스킬 증강 확률 ↑) 켠 게임.
 *     하위 호환: 파라미터가 없으면 off (기존 공유 URL 재현성 유지).
 *
 * 검증 노트: Node v14.17.4에서 이 파일의 .mjs 사본으로
 * `node --check` 구문 검사를 통과함 (ESM import 포함). 단 v14에는
 * fetch/DOM이 없으므로 실행 검증은 불가 — 브라우저 통합은 C1 담당.
 * top-level await는 의도적으로 쓰지 않았다 (구형 브라우저 호환).
 * ============================================================ */

import {
  newGame,
  nextRound,
  rerollSlot,
  goldenReroll,
  pickAugment,
} from "./draft.js";
import { recommend } from "./recommend.js";
/* previewAugment는 F1이 병렬 구현 중인 신규 export — named import는
 * export 부재 시 모듈 로드 자체가 깨지므로(SyntaxError) 네임스페이스로
 * 받아 typeof 체크한다. 부재 시 미리보기 스트립만 조용히 생략된다.
 * routeTargets(T2 병렬 작업 중)도 같은 이유로 네임스페이스 + typeof 방어. */
import * as recommendApi from "./recommend.js";
/* 확률 조회 API(drawDistribution/rerollDistribution/goldenDistribution/
 * hitProbability/skillOdds/remainingByTier — T1 완료분)도 네임스페이스로 받아
 * typeof 방어한다. 전부 순수 조회(rng 미소비)라 호출이 드래프트 결정론을
 * 건드리지 않는다 — 시드 재현 불변. */
import * as draftApi from "./draft.js";

/* ---------------- 상수 ---------------- */

var ROLE_CHIPS = [
  { key: null, label: "전체" },
  { key: "Fighter", label: "전사" },
  { key: "Mage", label: "마법사" },
  { key: "Marksman", label: "원거리" },
  { key: "Assassin", label: "암살자" },
  { key: "Tank", label: "탱커" },
  { key: "Support", label: "서포터" },
];

var TIER_LABEL = { silver: "실버", gold: "골드", prismatic: "프리즘" };
var ROUND_LEVELS = [3, 7, 11, 15];
var TOTAL_ROUNDS = 4;

/* 꿀잼 티어(funrank.json) → CSS 클래스 접미사.
 * 어휘 밖 티어는 매핑 실패 → 배지를 그리지 않는다 (방어적).
 * "S+"를 클래스명에 그대로 넣지 않기 위한 화이트리스트이기도 하다. */
var FUN_TIER_CLASS = { "S+": "splus", "S": "s", "A": "a", "B": "b", "C": "c" };

/* 증강 꿀잼 티어(augments.json의 funTier — F1 병렬 생성 중) → CSS 접미사.
 * 챔피언용 FUN_TIER_CLASS(S+ 포함)와 어휘가 달라 별도 상수(S~D).
 * 어휘 밖/부재 시 매핑 실패 → 티어 테두리·칩을 그리지 않고
 * 기존 희귀 등급 테두리로 폴백한다 (방어적). */
var AUG_FUN_TIER_CLASS = { S: "s", A: "a", B: "b", C: "c", D: "d" };

var SORT_CHIPS = [
  { key: "name", label: "이름순" },
  { key: "fun", label: "꿀잼순" },
];

/* ---------------- 상태 ---------------- */

var state = {
  data: null, // { augments, champions, items, synergies, funrank(옵션: id→항목 맵 | null) }
  champion: null, // 선택한 챔피언 객체
  seed: null, // 이번 게임 시드
  game: null, // draft.js 게임 상태 (plain object)
  round: null, // 현재 라운드 { level, tier, slots, rerolled }
  goldenUsed: false, // 황금 리롤 사용 여부 (UI 측 추적)
  goldenArmed: false, // 황금 리롤 슬롯 선택 대기 중
  actions: [], // 라운드별 액션 로그 [["p2"], ["r0","p1"], ...]
  search: "",
  roleFilter: null,
  sortMode: "name", // "name"(기존 순서) | "fun"(funScore 내림차순) — 새로고침 시 초기화돼도 무방
  previewChampId: null, // 선택 화면 미리보기 중인 챔피언 id (funrank 있을 때만 사용)
  trackL9: false, // 진행도 트랙 Lv9 보정 (기본 off — 근사: research/AUGMENT-POOLS-STUDY.md §3-2)
  /* 라운드 확률 스트립 펼침 상태 (렌더 간 유지). 모바일(640px 미만)은 기본 접힘 —
   * 카드 위 과밀 방지 (§3-4-1). 접혀도 요약 줄(mini)로 핵심 숫자는 보인다. */
  oddsOpen: (function () {
    try {
      return !window.matchMedia("(max-width: 639.98px)").matches;
    } catch (err) {
      return true; // matchMedia 미지원 환경 방어 — 펼침 기본
    }
  })(),
  dexChampId: null, // 꿀잼 사전(#dex/{id})에 떠 있는 챔피언 id (null = 사전 화면 아님)
  dexOpenedByApp: false, // 사전을 앱 내 버튼으로 열었나 (true면 뒤로가기 = history.back)
};

/* ---------------- DOM 헬퍼 ---------------- */

function $(sel) {
  return document.querySelector(sel);
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    switch (c) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      default: return "&#39;";
    }
  });
}

var SCREENS = ["loading", "error", "select", "dex", "draft", "result"];

function showScreen(name) {
  SCREENS.forEach(function (s) {
    var el = $("#screen-" + s);
    if (el) el.hidden = s !== name;
  });
  window.scrollTo(0, 0);
}

var toastTimer = null;
function toast(msg) {
  var el = $("#toast");
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    el.hidden = true;
  }, 2200);
}

function showError(msg) {
  $("#error-msg").textContent = msg;
  showScreen("error");
}

/* 이미지 로드 실패 시 깨진 아이콘 숨김 (error는 버블링 안 되므로 캡처) */
document.addEventListener(
  "error",
  function (e) {
    var t = e.target;
    if (t && t.tagName === "IMG") t.classList.add("img-broken");
  },
  true
);

/* ---------------- 데이터 로드 ---------------- */

function fetchJson(path) {
  return fetch(path).then(function (res) {
    if (!res.ok) throw new Error(path + " (HTTP " + res.status + ")");
    return res.json();
  });
}

function loadData() {
  /* funrank.json은 선택 데이터 (병렬 제작 중) — 개별 catch로 감싸
   * 파일 부재/파싱 실패여도 나머지 4종만으로 앱이 뜬다 (방어적). */
  var funrankPromise = fetchJson("./data/funrank.json").catch(function (err) {
    console.warn("funrank.json 로드 실패 — 꿀잼 랭킹 기능 없이 동작합니다.", err);
    return null;
  });
  return Promise.all([
    fetchJson("./data/augments.json"),
    fetchJson("./data/champions.json"),
    fetchJson("./data/items.json"),
    fetchJson("./data/synergies.json"),
    funrankPromise,
  ]).then(function (results) {
    return {
      augments: results[0].augments || [],
      champions: results[1].champions || [],
      items: results[2].items || [],
      synergies: results[3] || { combos: [], tagRules: [] },
      funrank: buildFunrank(results[4]),
    };
  });
}

/* funrank.json 원본 → id→항목 맵. 스키마가 어긋나면 null (기능 통째로 off) */
function buildFunrank(raw) {
  if (!raw || !Array.isArray(raw.ranks) || raw.ranks.length === 0) return null;
  var map = {};
  var count = 0;
  raw.ranks.forEach(function (r) {
    if (!r || typeof r !== "object" || !r.id) return;
    map[r.id] = r;
    count++;
  });
  return count > 0 ? map : null;
}

/* 챔피언 id → funrank 항목 (없으면 null — 호출부는 전부 null 허용) */
function funEntry(champId) {
  var fr = state.data && state.data.funrank;
  if (!fr) return null;
  var e = fr[champId];
  return e && typeof e === "object" ? e : null;
}

function funScoreOf(champ) {
  var e = funEntry(champ.id);
  var n = e ? Number(e.funScore) : NaN;
  return isFinite(n) ? n : -1; // 점수 없는 챔피언은 꿀잼순에서 맨 뒤
}

/* 증강 꿀잼 티어 칩 HTML ("" = 칩 없음).
 * labeled=false: 드래프트 카드용 — 카드 버튼 aria-label이 "꿀잼 티어 S"를
 *   이미 낭독하므로 칩 글자는 aria-hidden (중복 낭독 방지).
 * labeled=true: 결과 상세 카드용 — 낭독해 줄 상위 라벨이 없어
 *   칩 자체에 접근성 이름을 붙인다. */
function augFunChipHtml(funTier, labeled) {
  var cls = AUG_FUN_TIER_CLASS[funTier];
  if (!cls) return "";
  var aria = labeled
    ? ' role="img" aria-label="꿀잼 티어 ' + esc(funTier) + '"'
    : ' aria-hidden="true"';
  return (
    '<span class="fun-chip fun-chip-' + cls + '"' + aria + ">" +
    esc(funTier) + "</span>"
  );
}

/* 꿀잼 티어 배지 HTML ("" = 배지 없음) */
function funTierBadgeHtml(entry) {
  var cls = entry && FUN_TIER_CLASS[entry.tier];
  if (!cls) return "";
  return (
    '<span class="fun-tier-badge fun-tier-' + cls + '">' + esc(entry.tier) + "</span>"
  );
}

/* ---------------- draft.js 반환 형태 방어 ----------------
 * 계약상 nextRound는 { level, tier, slots, rerolled }를 반환하지만,
 * 구현이 game을 반환하거나 game.round만 갱신할 가능성에도 대비한다. */

function extractRound(returned) {
  var candidates = [
    returned,
    returned && returned.round,
    returned && returned.currentRound,
    state.game && state.game.round,
    state.game && state.game.currentRound,
  ];
  for (var i = 0; i < candidates.length; i++) {
    var c = candidates[i];
    if (c && Array.isArray(c.slots) && c.slots.length > 0) return c;
  }
  return null;
}

function gameFinished() {
  var g = state.game;
  if (!g) return false;
  if (g.finished) return true;
  return Array.isArray(g.picked) && g.picked.length >= TOTAL_ROUNDS;
}

function pickedCount() {
  var g = state.game;
  return g && Array.isArray(g.picked) ? g.picked.length : 0;
}

/* picked 항목이 apiName 문자열일 수도, 증강 객체일 수도 있다 */
function resolvedPicks() {
  var g = state.game;
  var picked = g && Array.isArray(g.picked) ? g.picked : [];
  var augments = state.data ? state.data.augments : [];
  return picked.map(function (p) {
    if (p && typeof p === "object" && p.apiName) return p;
    var found = augments.filter(function (a) {
      return a.apiName === p;
    })[0];
    return (
      found || { apiName: String(p), nameKo: String(p), tier: "silver", descKo: "", icon: "" }
    );
  });
}

/* ---------------- 게임 진행 ---------------- */

function newSeed() {
  return Math.floor(Math.random() * 2147483647);
}

function startGame(champion, seed) {
  state.champion = champion;
  state.seed = seed;
  state.goldenUsed = false;
  state.goldenArmed = false;
  state.actions = [];
  state.round = null;
  previewCache.clear(); // 게임 단위 캐시 — 챔피언이 바뀌면 무효

  try {
    state.game = newGame({
      augments: state.data.augments,
      champion: champion,
      seed: seed,
      /* 진행도 트랙 Lv9 보정 — draft.js가 아직 이 옵션을 모르면 조용히 무시된다 (방어적).
       * 근사: 실제 증가 폭 비공개 (research/AUGMENT-POOLS-STUDY.md §3-2) */
      trackL9: !!state.trackL9,
    });
    advanceRound();
    return true;
  } catch (err) {
    console.error(err);
    showError("드래프트를 시작하지 못했습니다.\n" + (err && err.message ? err.message : ""));
    return false;
  }
}

function advanceRound() {
  var ret = nextRound(state.game);
  state.round = extractRound(ret);
  state.actions.push([]);
  if (!state.round) {
    throw new Error("draft.js nextRound()에서 라운드 정보를 받지 못했습니다.");
  }
}

function currentActions() {
  return state.actions[state.actions.length - 1];
}

function doReroll(i, silent) {
  var r = state.round;
  if (!r) return;
  if (r.rerolled && r.rerolled[i]) {
    if (!silent) toast("이 슬롯은 이미 리롤했습니다.");
    return;
  }
  try {
    var ret = rerollSlot(state.game, i);
    state.round = extractRound(ret) || state.round;
    currentActions().push("r" + i);
  } catch (err) {
    console.error(err);
    if (!silent) toast("리롤할 수 없습니다.");
    return;
  }
  if (!silent) renderDraft();
}

function doGolden(i, silent) {
  if (state.goldenUsed || (state.game && state.game.goldenUsed)) {
    if (!silent) toast("황금 리롤은 게임당 1회입니다.");
    return;
  }
  try {
    var ret = goldenReroll(state.game, i);
    state.round = extractRound(ret) || state.round;
    state.goldenUsed = true;
    state.goldenArmed = false;
    currentActions().push("g" + i);
  } catch (err) {
    console.error(err);
    if (!silent) toast("황금 리롤을 사용할 수 없습니다.");
    return;
  }
  if (!silent) {
    toast("✨ 황금 리롤! 한 단계 높은 등급으로 교체되었습니다.");
    renderDraft();
  }
}

function doPick(i, silent) {
  try {
    pickAugment(state.game, i);
    currentActions().push("p" + i);
  } catch (err) {
    console.error(err);
    if (!silent) toast("선택할 수 없습니다.");
    return;
  }
  state.goldenArmed = false;
  if (gameFinished()) {
    if (!silent) renderResult();
  } else {
    try {
      advanceRound();
    } catch (err) {
      console.error(err);
      showError(
        "다음 라운드를 시작하지 못했습니다.\n" +
          (err && err.message ? err.message : "")
      );
      return;
    }
    if (!silent) renderDraft();
  }
}

/* ---------------- 공유 URL ---------------- */

function buildShareUrl() {
  var params = new URLSearchParams();
  params.set("champ", state.champion.id);
  params.set("seed", String(state.seed));
  params.set(
    "picks",
    state.actions
      .map(function (a) {
        return a.join("");
      })
      .filter(function (s) {
        return s.length > 0;
      })
      .join("-")
  );
  /* 하위 호환: trackL9 off면 파라미터를 아예 넣지 않는다 —
   * 기존 공유 URL(파라미터 없음)은 off로 재현된다. */
  if (state.trackL9) params.set("l9", "1");
  return (
    location.origin + location.pathname + "?" + params.toString()
  );
}

function syncUrl() {
  try {
    history.replaceState(null, "", buildShareUrl());
  } catch (err) {
    /* file:// 등에서 replaceState가 막혀도 치명적이지 않음 */
  }
}

function clearUrl() {
  try {
    history.replaceState(null, "", location.pathname);
  } catch (err) {
    /* 무시 */
  }
}

/* URL 파라미터로 게임 재현. 성공하면 true */
function replayFromParams(params) {
  var champId = params.get("champ");
  var seed = Number(params.get("seed"));
  var picksStr = params.get("picks") || "";
  if (!champId || !isFinite(seed)) return false;

  var champion = state.data.champions.filter(function (c) {
    return c.id === champId;
  })[0];
  if (!champion) {
    toast("공유된 챔피언을 찾을 수 없습니다.");
    return false;
  }
  /* l9 파라미터 → trackL9 복원 (없으면 off — 기존 URL 하위 호환) */
  state.trackL9 = params.get("l9") === "1";
  syncL9Toggle();
  if (!startGame(champion, seed)) return false;

  var rounds = picksStr ? picksStr.split("-") : [];
  for (var ri = 0; ri < rounds.length; ri++) {
    if (gameFinished()) break;
    var acts = rounds[ri].match(/[rgp][0-2]/g) || [];
    for (var ai = 0; ai < acts.length; ai++) {
      var type = acts[ai].charAt(0);
      var slot = Number(acts[ai].charAt(1));
      if (type === "r") doReroll(slot, true);
      else if (type === "g") doGolden(slot, true);
      else if (type === "p") {
        doPick(slot, true);
        break;
      }
    }
  }

  if (gameFinished()) renderResult();
  else renderDraft();
  return true;
}

function copyShareUrl() {
  var url = buildShareUrl();
  var done = function () {
    toast("공유 링크가 복사되었습니다!");
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(done, function () {
      fallbackCopy(url, done);
    });
  } else {
    fallbackCopy(url, done);
  }
}

function fallbackCopy(text, done) {
  var ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  var ok = false;
  try {
    ok = document.execCommand("copy");
  } catch (err) {
    ok = false;
  }
  document.body.removeChild(ta);
  if (ok) done();
  else window.prompt("아래 링크를 직접 복사하세요:", text);
}

/* ---------------- ① 챔피언 선택 화면 ---------------- */

function renderRoleChips() {
  var wrap = $("#role-chips");
  wrap.innerHTML = "";
  ROLE_CHIPS.forEach(function (chip) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "chip" + (state.roleFilter === chip.key ? " active" : "");
    btn.textContent = chip.label;
    btn.addEventListener("click", function () {
      state.roleFilter = state.roleFilter === chip.key ? null : chip.key;
      renderRoleChips();
      renderChampGrid();
    });
    wrap.appendChild(btn);
  });
}

/* 정렬 칩 — funrank가 없으면 통째로 숨긴다 (기존 동작 유지) */
function renderSortChips() {
  var wrap = $("#sort-chips");
  if (!wrap) return;
  if (!(state.data && state.data.funrank)) {
    wrap.hidden = true;
    wrap.innerHTML = "";
    return;
  }
  wrap.hidden = false;
  wrap.innerHTML = "";
  SORT_CHIPS.forEach(function (chip) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip" + (state.sortMode === chip.key ? " active" : "");
    btn.textContent = chip.label;
    btn.addEventListener("click", function () {
      if (state.sortMode === chip.key) return;
      state.sortMode = chip.key;
      renderSortChips();
      renderChampGrid();
    });
    wrap.appendChild(btn);
  });
}

function filteredChampions() {
  var q = state.search.trim().toLowerCase();
  var list = state.data.champions.filter(function (c) {
    if (state.roleFilter) {
      var tags = c.tags || [];
      if (tags.indexOf(state.roleFilter) === -1) return false;
    }
    if (q) {
      var ko = (c.nameKo || "").toLowerCase();
      var en = (c.id || "").toLowerCase();
      if (ko.indexOf(q) === -1 && en.indexOf(q) === -1) return false;
    }
    return true;
  });
  /* 꿀잼순: funScore 내림차순, 동점은 한글 이름순 (funrank 없으면 도달 불가) */
  if (state.sortMode === "fun" && state.data.funrank) {
    list.sort(function (a, b) {
      var d = funScoreOf(b) - funScoreOf(a);
      if (d !== 0) return d;
      return String(a.nameKo || "").localeCompare(String(b.nameKo || ""), "ko");
    });
  }
  return list;
}

function renderChampGrid() {
  var grid = $("#champ-grid");
  var champs = filteredChampions();
  $("#champ-empty").hidden = champs.length > 0;

  var html = champs
    .map(function (c) {
      var entry = funEntry(c.id);
      return (
        '<button type="button" class="champ-cell' +
        (state.previewChampId === c.id ? " selected" : "") +
        '" data-id="' +
        esc(c.id) +
        '" aria-label="' +
        esc(c.nameKo) +
        ' 선택">' +
        funTierBadgeHtml(entry) +
        '<img class="champ-icon" src="' +
        esc(c.icon) +
        '" alt="" loading="lazy" decoding="async" width="56" height="56">' +
        '<span class="champ-name">' +
        esc(c.nameKo) +
        "</span></button>"
      );
    })
    .join("");
  grid.innerHTML = html;
}

function champById(id) {
  return state.data.champions.filter(function (c) {
    return c.id === id;
  })[0];
}

/* 시그니처 증강 칩들 — augments.json에 실존하는 apiName만 그린다 (방어적) */
function sigAugsHtml(entry) {
  var list =
    entry && Array.isArray(entry.signatureAugments) ? entry.signatureAugments : [];
  if (!list.length) return "";
  var augments = state.data.augments;
  var rows = [];
  list.slice(0, 3).forEach(function (apiName) {
    var a = augments.filter(function (x) {
      return x.apiName === apiName;
    })[0];
    if (!a) return;
    rows.push(
      '<span class="sig-aug">' +
        '<img src="' + esc(a.icon) +
        '" alt="" loading="lazy" decoding="async" width="24" height="24">' +
        "<span>" + esc(a.nameKo) + "</span></span>"
    );
  });
  if (!rows.length) return "";
  return '<div class="sig-augs" aria-label="시그니처 증강">' + rows.join("") + "</div>";
}

/* 챔피언 미리보기 패널 (드래프트 시작 전 oneLiner + 시그니처 증강) */
function renderChampPreview() {
  var panel = $("#champ-preview");
  if (!panel) return;
  var champion = state.previewChampId ? champById(state.previewChampId) : null;
  var entry = champion ? funEntry(champion.id) : null;
  if (!champion || !entry) {
    panel.hidden = true;
    panel.innerHTML = "";
    return;
  }
  panel.innerHTML =
    '<div class="champ-preview-head">' +
    '<img src="' + esc(champion.icon) +
    '" alt="" loading="lazy" decoding="async" width="44" height="44">' +
    '<div class="champ-preview-title">' +
    '<span class="champ-preview-name">' + esc(champion.nameKo) + "</span>" +
    funTierBadgeHtml(entry) +
    "</div>" +
    '<button type="button" class="link-btn champ-preview-close" data-action="close"' +
    ' aria-label="미리보기 닫기">✕</button>' +
    "</div>" +
    (entry.oneLiner
      ? '<p class="champ-oneliner">' + esc(entry.oneLiner) + "</p>"
      : "") +
    sigAugsHtml(entry) +
    '<div class="champ-preview-actions">' +
    '<button type="button" class="btn btn-primary" data-action="start">' +
    "이 챔피언으로 드래프트 시작</button>" +
    '<button type="button" class="btn btn-dex" data-action="dex">' +
    "📖 꿀잼 사전 보기</button></div>";
  panel.hidden = false;
}

function onChampGridClick(e) {
  var cell = e.target.closest ? e.target.closest(".champ-cell") : null;
  if (!cell) return;
  var id = cell.getAttribute("data-id");
  var champion = champById(id);
  if (!champion) return;
  /* funrank 항목이 있으면 탭 → 미리보기(oneLiner) 먼저,
   * 없으면 기존처럼 즉시 드래프트 시작 (방어적 폴백) */
  var entry = funEntry(champion.id);
  if (entry) {
    state.previewChampId = champion.id;
    renderChampPreview();
    renderChampGrid();
    var panel = $("#champ-preview");
    if (panel && panel.scrollIntoView) {
      try {
        panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } catch (err) {
        /* 구형 브라우저: 옵션 객체 미지원이어도 치명적이지 않음 */
      }
    }
    return;
  }
  if (startGame(champion, newSeed())) {
    clearUrl();
    renderDraft();
  }
}

function onChampPreviewClick(e) {
  var btn = e.target.closest ? e.target.closest("[data-action]") : null;
  if (!btn) return;
  var action = btn.getAttribute("data-action");
  if (action === "close") {
    state.previewChampId = null;
    renderChampPreview();
    renderChampGrid();
    return;
  }
  if (action === "start") {
    var champion = state.previewChampId ? champById(state.previewChampId) : null;
    if (!champion) return;
    if (startGame(champion, newSeed())) {
      clearUrl();
      renderDraft();
    }
    return;
  }
  if (action === "dex") {
    var dexChamp = state.previewChampId ? champById(state.previewChampId) : null;
    if (dexChamp) openDex(dexChamp.id);
  }
}

function syncL9Toggle() {
  var el = $("#toggle-l9");
  if (el) el.checked = !!state.trackL9;
}

function showSelectScreen() {
  state.goldenArmed = false;
  state.previewChampId = null;
  renderRoleChips();
  renderSortChips();
  renderChampGrid();
  renderChampPreview();
  syncL9Toggle();
  showScreen("select");
}

/* ---------------- ①-b 챔피언 꿀잼 사전 (#dex/{챔피언id}) ----------------
 * SPEC-day2 §2 + 결정2: 별도 화면 + 해시 라우팅. 진입은 미리보기 패널의
 * "꿀잼 사전 보기" 버튼(v1 단일 진입점), 뒤로가기는 브라우저 히스토리.
 * 데이터는 전부 기존 로드분에서 파생 (신규 파일 없음 — §2-2). */

/* DDragon tags → 한국어 (ROLE_CHIPS 라벨 재사용) */
function roleLabel(tag) {
  for (var i = 0; i < ROLE_CHIPS.length; i++) {
    if (ROLE_CHIPS[i].key === tag) return ROLE_CHIPS[i].label;
  }
  return tag;
}

/* 콤보 0건 폴백 루트 제목용 태그 한국어 표기
 * (recommend.js TAG_STYLE은 미수출 — UI 문구용 로컬 사본) */
var DEX_TAG_KO = {
  onhit: "온힛", as: "공속", ad: "공격력", ap: "주문력", crit: "치명타",
  tank: "탱킹", heal: "흡혈·회복", shield: "보호막", move: "질주", cc: "CC 연계",
  dash: "돌진", ult: "궁극기", summoner: "스펠", gold: "골드", onkill: "스노볼",
  aoe: "광역딜", dot: "도트딜", execute: "처형", poke: "포킹", support: "지원",
  mana: "마나", quest: "퀘스트",
};

function augByName(apiName) {
  return state.data.augments.filter(function (a) {
    return a.apiName === apiName;
  })[0];
}

function openDex(champId) {
  state.dexOpenedByApp = true;
  var target = "#dex/" + encodeURIComponent(champId);
  if (location.hash === target) {
    showDexById(champId);
    return;
  }
  /* 해시 변경 → hashchange 핸들러가 렌더. 히스토리에 쌓여 브라우저 뒤로가기가 곧 닫기. */
  location.hash = target;
}

function parseDexHash() {
  var m = (location.hash || "").match(/^#dex\/(.+)$/);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch (err) {
    return m[1];
  }
}

function showDexById(champId) {
  var champ = champById(champId);
  if (!champ) {
    toast("사전에서 챔피언을 찾을 수 없습니다.");
    try {
      history.replaceState(null, "", location.pathname + location.search);
    } catch (err) {
      /* 무시 */
    }
    return false;
  }
  state.dexChampId = champ.id;
  renderDex(champ);
  return true;
}

function onHashChange() {
  if (!state.data) return; // 데이터 로드 전 해시 변경은 init이 처리
  var id = parseDexHash();
  if (id) {
    showDexById(id);
    return;
  }
  /* dex 해시가 사라짐(뒤로가기/닫기) → 이전 화면 복귀 */
  if (state.dexChampId) {
    var backId = state.dexChampId;
    state.dexChampId = null;
    state.dexOpenedByApp = false;
    restoreAfterDex(backId);
  }
}

/* 사전을 닫은 뒤 어디로 돌아가나: 진행 중 드래프트 > 결과 > 선택 화면.
 * 선택 화면 복귀 시 사전에서 보던 챔피언을 미리보기 패널로 유지한다
 * (showSelectScreen은 previewChampId를 지우므로 직접 렌더). */
function restoreAfterDex(champId) {
  if (state.game && state.round && !gameFinished()) {
    renderDraft();
    return;
  }
  if (state.game && gameFinished()) {
    renderResult();
    return;
  }
  if (champId && funEntry(champId)) state.previewChampId = champId;
  renderRoleChips();
  renderSortChips();
  renderChampGrid();
  renderChampPreview();
  syncL9Toggle();
  showScreen("select");
}

function onDexBackClick() {
  if (state.dexOpenedByApp) {
    /* 앱 안에서 연 경우: 히스토리 엔트리까지 청소 — hashchange가 복귀 처리 */
    history.back();
    return;
  }
  /* 직접 링크(#dex/{id})로 들어온 경우: 해시만 지우고 선택 화면으로 */
  var backId = state.dexChampId;
  state.dexChampId = null;
  try {
    history.replaceState(null, "", location.pathname + location.search);
  } catch (err) {
    /* 무시 */
  }
  restoreAfterDex(backId);
}

function renderDex(champ) {
  var body = $("#dex-body");
  if (!body) return;
  var html = dexHeadHtml(champ);

  /* T2 buildDossier(사전 데이터 셰이퍼) 우선 — typeof 방어, 부재/실패 시 로컬 폴백.
   * funrank는 state.data.funrank가 id→항목 맵이라 이 챔피언 항목만 ranks로 되감아 준다. */
  var dossier = null;
  if (typeof recommendApi.buildDossier === "function") {
    try {
      var entry = funEntry(champ.id);
      dossier = recommendApi.buildDossier({
        champion: champ,
        synergies: state.data.synergies,
        items: state.data.items,
        augments: state.data.augments,
        funrank: { ranks: entry ? [entry] : [] },
      });
      if (!dossier || !dossier.header || dossier.header.id !== champ.id) dossier = null;
    } catch (err) {
      dossier = null;
    }
  }

  if (dossier) {
    html += dexDossierCombosHtml(dossier);
    html += dexDossierAbilityHtml(dossier.abilityTable);
    html += dexDossierItemsHtml(dossier.exampleItems);
  } else {
    /* 로컬 폴백 — buildDossier 부재/실패 시에도 사전이 뜬다 (동일 섹션 구성) */
    var pool = [];
    try {
      pool =
        typeof draftApi.eligibleAugments === "function"
          ? draftApi.eligibleAugments(state.data.augments, champ)
          : [];
    } catch (err) {
      pool = [];
    }
    html += dexCombosHtml(champ, pool);
    html += dexAbilityHtml(champ, pool);
    html += dexItemsHtml(champ);
  }

  /* 정직성 캡션 1회 (§2-1-5) */
  html +=
    '<p class="dex-caption">시뮬레이터 기준 — 실제 풀·가중치는 서버 전용입니다.</p>';
  body.innerHTML = html;
  showScreen("dex");
}

/* ---- buildDossier 결과 렌더러 (T2 데이터 셰이퍼 경로) ---- */

function dexDossierComboCardHtml(c) {
  var chips = (c.augments || [])
    .map(function (info) {
      var a = augByName(info.apiName);
      var un = info.eligible ? "" : " unavailable";
      return (
        '<span class="sig-aug dex-aug-chip tier-' + esc(info.tier || "silver") + un + '"' +
        (un ? ' title="이 챔피언은 받을 수 없는 증강"' : "") + ">" +
        (a && a.icon
          ? '<img src="' + esc(a.icon) +
            '" alt="" loading="lazy" decoding="async" width="24" height="24">'
          : "") +
        "<span>" + esc(info.nameKo) + "</span></span>"
      );
    })
    .join("");
  var icons = (c.items || [])
    .slice(0, 4)
    .map(function (it) {
      if (!it || !it.icon) return "";
      return (
        '<img src="' + esc(it.icon) + '" alt="' + esc(it.nameKo || "") +
        '" title="' + esc(it.nameKo || "") +
        '" loading="lazy" decoding="async" width="30" height="30">'
      );
    })
    .join("");
  return (
    '<div class="combo-card dex-combo">' +
    '<p class="combo-title">' + esc(c.title || "시너지") +
    (c.signature ? ' <span class="dex-badge-sig">시그니처</span>' : "") + "</p>" +
    (c.whyFun ? '<p class="combo-why">' + esc(c.whyFun) + "</p>" : "") +
    (chips ? '<div class="sig-augs dex-combo-augs">' + chips + "</div>" : "") +
    (icons
      ? '<div class="dex-combo-items"><span class="dex-items-label">핵심템</span>' +
        icons + "</div>"
      : "") +
    (c.skills ? '<p class="dex-combo-skills">🎯 ' + esc(c.skills) + "</p>" : "") +
    "</div>"
  );
}

function dexDossierCombosHtml(dossier) {
  var html = '<div class="rec-card dex-section"><h3>꿀잼 조합</h3>';
  if (dossier.combos && dossier.combos.length) {
    html +=
      '<div class="item-list">' +
      dossier.combos.map(dexDossierComboCardHtml).join("") +
      "</div>";
  } else {
    /* 콤보 0건 폴백 (§2-3) — buildDossier의 tagRules 기반 범용 루트 */
    html +=
      '<p class="dex-empty-note">이 챔피언은 전용 콤보가 아직 없어요 — 범용 루트를 추천합니다.</p>' +
      (dossier.fallbackRoutes || [])
        .map(function (fr) {
          var icons = (fr.items || [])
            .slice(0, 3)
            .map(function (it) {
              if (!it || !it.icon) return "";
              return (
                '<img src="' + esc(it.icon) + '" alt="' + esc(it.nameKo || "") +
                '" title="' + esc(it.nameKo || "") +
                '" loading="lazy" decoding="async" width="30" height="30">'
              );
            })
            .join("");
          return (
            '<div class="combo-card dex-combo dex-combo-generic">' +
            '<p class="combo-title">' + esc(fr.title || "정석 루트") + "</p>" +
            (fr.playstyle ? '<p class="combo-why">' + esc(fr.playstyle) + "</p>" : "") +
            (icons
              ? '<div class="dex-combo-items"><span class="dex-items-label">예시템</span>' +
                icons + "</div>"
              : "") +
            "</div>"
          );
        })
        .join("");
  }
  html += "</div>";
  return html;
}

function dexDossierAbilityHtml(table) {
  if (!Array.isArray(table) || !table.length) return "";
  var rows = table
    .map(function (row) {
      var a = augByName(row.apiName);
      var target = "";
      if (row.fixed && row.fixed.key) {
        target =
          '<span class="dex-skill-fixed">' + esc(row.fixed.key) + " 강화 (확정)" +
          (row.fixed.nameKo ? " · " + esc(row.fixed.nameKo) : "") + "</span>";
      } else if (Array.isArray(row.candidates) && row.candidates.length) {
        target =
          '<span class="dex-skill-random">' +
          esc(
            row.candidates
              .map(function (c2) {
                return c2.key;
              })
              .join("/")
          ) +
          " 중 무작위 지정 — 근사</span>";
      } else {
        target = '<span class="dex-skill-random">Q/W/E/R 중 지정</span>';
      }
      var exHtml = (row.excluded || [])
        .map(function (ex) {
          return (
            '<span class="dex-skill-excluded" title="' + esc(ex.reason || "") + '">' +
            esc(ex.key) + (ex.nameKo ? " " + esc(ex.nameKo) : "") + " 제외</span>"
          );
        })
        .join(" ");
      return (
        '<div class="dex-skill-row">' +
        (a && a.icon
          ? '<img src="' + esc(a.icon) +
            '" alt="" loading="lazy" decoding="async" width="34" height="34">'
          : "") +
        '<div class="dex-skill-info">' +
        '<span class="dex-skill-name">' + esc(row.nameKo) +
        ' <span class="result-detail-tier tier-' + esc(row.tier || "silver") + '">' +
        esc(TIER_LABEL[row.tier] || row.tier || "") + "</span>" +
        (row.measured ? ' <span class="dex-badge-measured">실측</span>' : "") +
        "</span>" +
        '<span class="dex-skill-target">' + target + (exHtml ? " " + exHtml : "") +
        "</span>" +
        "</div></div>"
      );
    })
    .join("");
  return (
    '<div class="rec-card dex-section"><h3>스킬 증강 — 어느 스킬이 강화되나</h3>' +
    '<div class="dex-skill-table">' + rows + "</div>" +
    '<p class="dex-note">"확정"은 게임 원본 매핑(spellPin/slot — 실측 근거) 기준, ' +
    "무작위 표기는 적격 스킬 중 균등 지정 근사입니다. 취소선은 실측/공식 근거로 " +
    "강화 대상에서 제외된 스킬.</p></div>"
  );
}

function dexDossierItemsHtml(items) {
  if (!Array.isArray(items) || !items.length) return "";
  return (
    '<div class="rec-card dex-section"><h3>예시 아이템 (범용 추천)</h3>' +
    '<div class="item-list">' +
    items
      .slice(0, 8)
      .map(function (it) {
        return (
          '<div class="item-row">' +
          '<img src="' + esc(it.icon || "") +
          '" alt="" loading="lazy" decoding="async" width="44" height="44">' +
          '<div class="item-info"><div class="item-name">' + esc(it.nameKo || "") +
          "</div>" +
          (it.reason ? '<div class="item-reason">' + esc(it.reason) + "</div>" : "") +
          "</div></div>"
        );
      })
      .join("") +
    "</div></div>"
  );
}

function dexHeadHtml(champ) {
  var entry = funEntry(champ.id);
  var tags = (champ.tags || [])
    .map(function (t) {
      return '<span class="style-tag">' + esc(roleLabel(t)) + "</span>";
    })
    .join("");
  return (
    '<div class="dex-head">' +
    '<img src="' + esc(champ.icon) +
    '" alt="" loading="lazy" decoding="async" width="64" height="64">' +
    '<div class="dex-head-meta">' +
    '<div class="dex-head-title"><span class="dex-name">' + esc(champ.nameKo) +
    "</span>" + funTierBadgeHtml(entry) + "</div>" +
    (tags ? '<div class="style-tags dex-role-tags">' + tags + "</div>" : "") +
    (entry && entry.oneLiner
      ? '<p class="champ-oneliner">' + esc(entry.oneLiner) + "</p>"
      : "") +
    "</div></div>"
  );
}

/* 이 챔피언에 적용 가능한 combo 전부 (§2-1-2): 챔피언 명시 combo 우선,
 * 전 챔피언용 combo는 구성 증강을 이 챔피언이 받을 수 있을 때만. */
function dexApplicableCombos(champ, poolNames) {
  var syn = state.data.synergies;
  var combos = syn && Array.isArray(syn.combos) ? syn.combos : [];
  var champIdLc = String(champ.id || "").toLowerCase();
  var out = [];
  combos.forEach(function (combo, idx) {
    if (!combo || !Array.isArray(combo.augments) || !combo.augments.length) return;
    var champs = Array.isArray(combo.champions) ? combo.champions : [];
    var specific = champs.length > 0;
    if (
      specific &&
      !champs.some(function (c) {
        return String(c).toLowerCase() === champIdLc;
      })
    )
      return;
    var avail = combo.augments.filter(function (n) {
      return poolNames[n];
    });
    var ok =
      combo.matchType === "all" ? avail.length === combo.augments.length : avail.length >= 1;
    if (!ok) return;
    out.push({ combo: combo, idx: idx, specific: specific });
  });
  /* 시그니처(챔피언 명시) 우선, 그 외 원본 순서 유지 */
  out.sort(function (a, b) {
    return ((b.specific ? 1 : 0) - (a.specific ? 1 : 0)) || (a.idx - b.idx);
  });
  return out;
}

function dexItemIconsHtml(ids, label, max) {
  var icons = (Array.isArray(ids) ? ids : [])
    .slice(0, max)
    .map(function (id) {
      var it = itemById(id);
      if (!it || !it.icon) return "";
      return (
        '<img src="' + esc(it.icon) + '" alt="' + esc(it.nameKo || "") +
        '" title="' + esc(it.nameKo || "") +
        '" loading="lazy" decoding="async" width="30" height="30">'
      );
    })
    .join("");
  if (!icons) return "";
  return (
    '<div class="dex-combo-items"><span class="dex-items-label">' + esc(label) +
    "</span>" + icons + "</div>"
  );
}

function dexComboCardHtml(m, poolNames) {
  var combo = m.combo;
  var chips = combo.augments
    .map(function (n) {
      var a = augByName(n);
      if (!a) return "";
      var un = poolNames[n] ? "" : " unavailable";
      return (
        '<span class="sig-aug dex-aug-chip tier-' + esc(a.tier || "silver") + un + '"' +
        (un ? ' title="이 챔피언은 받을 수 없는 증강"' : "") + ">" +
        '<img src="' + esc(a.icon) +
        '" alt="" loading="lazy" decoding="async" width="24" height="24">' +
        "<span>" + esc(a.nameKo) + "</span></span>"
      );
    })
    .join("");
  return (
    '<div class="combo-card dex-combo">' +
    '<p class="combo-title">' + esc(combo.title || "시너지") +
    (m.specific ? ' <span class="dex-badge-sig">시그니처</span>' : "") + "</p>" +
    (combo.whyFun ? '<p class="combo-why">' + esc(combo.whyFun) + "</p>" : "") +
    (chips ? '<div class="sig-augs dex-combo-augs">' + chips + "</div>" : "") +
    dexItemIconsHtml(combo.items, "핵심템", 4) +
    "</div>"
  );
}

function dexCombosHtml(champ, pool) {
  var poolNames = {};
  pool.forEach(function (a) {
    if (a && a.apiName) poolNames[a.apiName] = true;
  });
  var matched = dexApplicableCombos(champ, poolNames);
  var html = '<div class="rec-card dex-section"><h3>꿀잼 조합</h3>';
  if (matched.length) {
    html +=
      '<div class="item-list">' +
      matched
        .map(function (m) {
          return dexComboCardHtml(m, poolNames);
        })
        .join("") +
      "</div>";
  } else {
    /* 콤보 0건 폴백 (§2-3): tagRules 기반 범용 루트 2~3개로 기대를 배신하지 않는다 */
    html +=
      '<p class="dex-empty-note">이 챔피언은 전용 콤보가 아직 없어요 — 범용 루트를 추천합니다.</p>' +
      dexFallbackRoutesHtml(champ);
  }
  html += "</div>";
  return html;
}

function dexFallbackRoutesHtml(champ) {
  var syn = state.data.synergies;
  var rules = syn && Array.isArray(syn.tagRules) ? syn.tagRules : [];
  var champTags = champ.tags || [];
  var scored = [];
  rules.forEach(function (rule, idx) {
    if (!rule || typeof rule !== "object") return;
    var cTags = Array.isArray(rule.ifChampTags) ? rule.ifChampTags : [];
    if (
      cTags.length &&
      !cTags.some(function (t) {
        return champTags.indexOf(t) !== -1;
      })
    )
      return;
    scored.push({
      rule: rule,
      idx: idx,
      pr: typeof rule.priority === "number" ? rule.priority : 1,
    });
  });
  scored.sort(function (a, b) {
    return (b.pr - a.pr) || (a.idx - b.idx);
  });
  return scored
    .slice(0, 3)
    .map(function (s) {
      var aTags = Array.isArray(s.rule.ifAugmentTags) ? s.rule.ifAugmentTags : [];
      var title =
        aTags
          .map(function (t) {
            return DEX_TAG_KO[t] || t;
          })
          .join("·") || "정석";
      return (
        '<div class="combo-card dex-combo dex-combo-generic">' +
        '<p class="combo-title">' + esc(title) + " 루트</p>" +
        (s.rule.playstyle
          ? '<p class="combo-why">' + esc(s.rule.playstyle) + "</p>"
          : "") +
        dexItemIconsHtml(s.rule.items, "예시템", 3) +
        "</div>"
      );
    })
    .join("");
}

/* 스킬 증강 표 (§2-1-3 — 스킬 증강 강조 요구의 본체).
 * "확정" 판정은 draft.js skillOdds(=presentAugment ①spellPin ②slot과 동일
 * 해소기 공유)를 그대로 사용해 사전과 드래프트가 같은 답을 낸다 (§2-2 드리프트 방지).
 * skillOdds는 game.champion만 읽는 순수 조회라 {champion} 라이트 객체로 호출한다. */
function dexAbilityHtml(champ, pool) {
  var abilities = pool.filter(function (a) {
    return a && a.category === "ability";
  });
  if (!abilities.length) return "";
  var spellName = {};
  (champ.spells || []).forEach(function (s) {
    if (s && s.key) spellName[s.key] = s.nameKo || "";
  });
  var rows = abilities
    .map(function (a) {
      var r = a.restrictions || {};
      var odds = null;
      try {
        odds =
          typeof draftApi.skillOdds === "function"
            ? draftApi.skillOdds({ champion: champ }, a)
            : null;
      } catch (err) {
        odds = null;
      }
      var fixedKey = null;
      var cands = [];
      if (odds) {
        ["Q", "W", "E", "R"].forEach(function (k) {
          if (odds[k] === 1) fixedKey = k;
          else if (odds[k] > 0) cands.push(k);
        });
      }
      var target = "";
      if (fixedKey) {
        target =
          '<span class="dex-skill-fixed">' + esc(fixedKey) + " 강화 (확정)" +
          (spellName[fixedKey] ? " · " + esc(spellName[fixedKey]) : "") + "</span>";
      } else if (cands.length) {
        /* 근사: 적격 스킬 중 무작위 지정은 실제 규칙 비공개라서의 균등 근사 (draft.js ③) */
        target =
          '<span class="dex-skill-random">' + esc(cands.join("/")) +
          " 중 무작위 지정 — 근사</span>";
      } else {
        target = '<span class="dex-skill-random">Q/W/E/R 중 지정</span>';
      }
      /* "실측" 배지: spellPin(실측 306건 기반 확정 매핑)이 실제로 판정에 쓰인 행만 */
      var measured =
        !!fixedKey &&
        !!(r.spellPin && r.spellPin[champ.id] === fixedKey);
      var excluded =
        r.spellExclude && Array.isArray(r.spellExclude[champ.id])
          ? r.spellExclude[champ.id]
          : [];
      var exHtml = excluded.length
        ? '<span class="dex-skill-excluded">제외: ' + esc(excluded.join(", ")) + "</span>"
        : "";
      return (
        '<div class="dex-skill-row">' +
        '<img src="' + esc(a.icon) +
        '" alt="" loading="lazy" decoding="async" width="34" height="34">' +
        '<div class="dex-skill-info">' +
        '<span class="dex-skill-name">' + esc(a.nameKo) +
        ' <span class="result-detail-tier tier-' + esc(a.tier || "silver") + '">' +
        esc(TIER_LABEL[a.tier] || a.tier || "") + "</span>" +
        (measured ? ' <span class="dex-badge-measured">실측</span>' : "") +
        "</span>" +
        '<span class="dex-skill-target">' + target + " " + exHtml + "</span>" +
        "</div></div>"
      );
    })
    .join("");
  return (
    '<div class="rec-card dex-section"><h3>스킬 증강 — 어느 스킬이 강화되나</h3>' +
    '<div class="dex-skill-table">' + rows + "</div>" +
    '<p class="dex-note">"확정"은 게임 원본 매핑(spellPin/slot — 실측 근거) 기준, ' +
    "무작위 표기는 적격 스킬 중 균등 지정 근사입니다.</p></div>"
  );
}

/* 예시 아이템 (§2-1-4): recommend()의 빈 picked 호출 = 역할 기반 범용 추천
 * (fitScore 하드 미스매치 제외가 recommend 내부에서 적용된다) */
function dexItemsHtml(champ) {
  var rec = null;
  try {
    rec = recommend({
      champion: champ,
      picked: [],
      synergies: state.data.synergies,
      items: state.data.items,
      augments: state.data.augments,
    });
  } catch (err) {
    rec = null;
  }
  var items = rec && Array.isArray(rec.items) ? rec.items : [];
  if (!items.length) return "";
  return (
    '<div class="rec-card dex-section"><h3>예시 아이템 (범용 추천)</h3>' +
    '<div class="item-list">' +
    items
      .slice(0, 8)
      .map(function (it) {
        var full = it.icon ? it : itemById(it.id) || it;
        return (
          '<div class="item-row">' +
          '<img src="' + esc(full.icon || "") +
          '" alt="" loading="lazy" decoding="async" width="44" height="44">' +
          '<div class="item-info"><div class="item-name">' +
          esc(it.nameKo || full.nameKo || "") + "</div>" +
          (it.reason ? '<div class="item-reason">' + esc(it.reason) + "</div>" : "") +
          "</div></div>"
        );
      })
      .join("") +
    "</div></div>"
  );
}

/* ---------------- ② 드래프트 화면 ---------------- */

function renderProgress() {
  var wrap = $("#draft-progress");
  var current = pickedCount(); // 0-base 현재 라운드 인덱스
  var html = "";
  for (var i = 0; i < TOTAL_ROUNDS; i++) {
    var cls = i < current ? "done" : i === current ? "current" : "todo";
    var mark = i < current ? "✔ " : "";
    html +=
      '<li class="step ' + cls + '">' +
      '<span class="step-round">' + mark + (i + 1) + "라운드</span>" +
      '<span class="step-level">Lv.' + ROUND_LEVELS[i] + "</span></li>";
  }
  wrap.innerHTML = html;
}

function renderHistoryBar() {
  var bar = $("#history-bar");
  var picks = resolvedPicks();
  var html = "";
  for (var i = 0; i < TOTAL_ROUNDS; i++) {
    var p = picks[i];
    if (p) {
      /* 스킬 증강이면 강화 대상 스킬을 title로 노출 (필드 없으면 이름만 — 방어적) */
      var histTitle =
        p.nameKo +
        (p.enhancedSkill && p.enhancedSkill.key
          ? " (" + p.enhancedSkill.key + " 강화)"
          : "");
      html +=
        '<div class="history-item tier-' + esc(p.tier || "silver") + '" title="' +
        esc(histTitle) + '">' +
        '<img src="' + esc(p.icon) + '" alt="' + esc(p.nameKo) +
        '" loading="lazy" decoding="async"></div>';
    } else {
      html += '<div class="history-item empty" aria-hidden="true">' + (i + 1) + "</div>";
    }
  }
  bar.innerHTML = html;
}

/* ---------- 픽 미리보기 스트립 ("이걸 고르면?") ----------
 * 카드 1장(candidate)에 대해 previewAugment 차분 결과를 압축 표시.
 * - previewAugment 부재(typeof)·호출 실패·형태 불량이면 "" 반환
 *   → 기존 카드 그대로 (방어적)
 * - 카드가 <button>이므로 내부는 phrasing content(span/img)만 사용
 * - 리롤/황금 리롤/라운드 진행 후 재계산: 세 경로 모두 renderDraft()가
 *   카드 HTML을 통째로 다시 만들므로 여기서 자동으로 재계산된다.
 * - 메모 캐시: 키 = picked 증강 이름들 + 후보 이름. 리롤 시 바뀐 슬롯 1장만
 *   실제 계산되고 나머지 2장은 캐시 히트 (라운드 진행 시 picked가 바뀌어
 *   자연히 전 슬롯 재계산). 같은 게임 안에서 증강은 중복 제시되지 않으므로
 *   apiName 키로 충분하다. 새 게임 시작 시 startGame()에서 비운다.
 * - 반환은 { html, newCombo } 객체: newCombo(이 후보로 새 조합 가동 여부)는
 *   카드 꿀잼 티어 "S" 승격 판정에 재사용된다 — previewAugment를 티어 판정용으로
 *   중복 호출하지 않기 위함 (호출 1회/슬롯 유지). */

var previewCache = new Map();

var PREVIEW_NONE = { html: "", newCombo: false };

function cachePreview(key, info) {
  if (key) previewCache.set(key, info);
  return info;
}

function previewInfo(candidate) {
  if (typeof recommendApi.previewAugment !== "function") return PREVIEW_NONE;
  if (!candidate || !state.champion || !state.data) return PREVIEW_NONE;
  var picks = resolvedPicks();
  var cacheKey = "";
  if (typeof candidate.apiName === "string" && candidate.apiName) {
    cacheKey =
      picks
        .map(function (p) {
          return p && p.apiName;
        })
        .join(",") +
      "|" +
      candidate.apiName;
    if (previewCache.has(cacheKey)) return previewCache.get(cacheKey);
  }
  var pv = null;
  try {
    pv = recommendApi.previewAugment({
      champion: state.champion,
      candidate: candidate,
      picked: picks,
      synergies: state.data.synergies,
      items: state.data.items,
      augments: state.data.augments,
    });
  } catch (err) {
    console.warn("previewAugment 실패 — 미리보기 생략", err);
    return PREVIEW_NONE;
  }
  if (!pv || typeof pv !== "object") return cachePreview(cacheKey, PREVIEW_NONE);

  /* 티어 승격 시그널: 이 후보를 골라야 새로 가동되는 조합이 1개 이상 */
  var newCombo = Array.isArray(pv.newCombos) && pv.newCombos.length > 0;

  var rows = "";

  /* 1행: 꿀잼 루트 방향 + funDelta 배지 (0 이하면 배지 생략) */
  var route = typeof pv.route === "string" ? pv.route : "";
  var delta = Math.round(Number(pv.funDelta));
  var deltaBadge =
    isFinite(delta) && delta > 0
      ? '<span class="aug-preview-delta">🍯+' + delta + "</span>"
      : "";
  if (route) {
    rows +=
      '<span class="aug-preview-route">' +
      '<span class="aug-preview-route-text">→ ' + esc(route) + "</span>" +
      deltaBadge +
      "</span>";
  }

  /* 2행: 이 후보를 골라야 새로 가동되는 조합 — 과밀 방지로 최대 1개 */
  var combo = Array.isArray(pv.newCombos) ? pv.newCombos[0] : null;
  if (combo && combo.title) {
    rows +=
      '<span class="aug-preview-combo">⚡ ‘' + esc(combo.title) +
      "’ 조합 가동!</span>";
  }

  /* 3행: 예시 아이템 아이콘 최대 3개 */
  var itemsHtml = (Array.isArray(pv.items) ? pv.items : [])
    .slice(0, 3)
    .map(function (it) {
      if (!it || !it.icon) return "";
      return (
        '<img src="' + esc(it.icon) + '" alt="' + esc(it.nameKo || "") +
        '" loading="lazy" decoding="async" width="24" height="24">'
      );
    })
    .join("");
  if (itemsHtml) {
    rows +=
      '<span class="aug-preview-items">' +
      '<span class="aug-preview-items-label">예시 빌드</span>' +
      itemsHtml +
      "</span>";
  }

  if (!rows) return cachePreview(cacheKey, { html: "", newCombo: newCombo });
  /* 카드 버튼에 aria-label이 이미 있어 접근성 이름은 중복되지 않지만,
   * 콘텐츠 낭독 중복을 피하기 위해 정보성 스트립은 aria-hidden 처리 */
  return cachePreview(cacheKey, {
    html: '<span class="aug-preview" aria-hidden="true">' + rows + "</span>",
    newCombo: newCombo,
  });
}

/* ---------- 리롤 확률 어드바이저 (SPEC-day2 §3) ----------
 * draft.js의 순수 조회 API(T1: drawDistribution/rerollDistribution/
 * goldenDistribution/hitProbability/remainingByTier)만 사용한다 — 전부
 * rng 미소비라 확률 표시가 시드 결정론(드로우 바이트)을 절대 바꾸지 않는다.
 * API 부재 시(typeof 방어) 스트립·카드 확률 줄을 통째로 생략한다.
 * 정직성: 표시되는 모든 %는 "시뮬레이터 모델 기준"이다 — weightFor 계수
 * (2.0/0.6/1.5)·tierWeights가 전부 근사 상수라서 (draft.js 주석 참조).
 * "시뮬 기준" 캡션은 라운드 스트립 끝에 1회만 노출한다. */

function oddsReady() {
  return !!(
    state.game &&
    typeof draftApi.drawDistribution === "function" &&
    typeof draftApi.remainingByTier === "function"
  );
}

/* 정수 % 표기 규율 (§3-6): 1% 미만은 "<1%" — 소수점 가짜 정밀도 금지 */
function fmtPct(p) {
  if (!isFinite(p) || p <= 0) return "0%";
  if (p < 0.01) return "<1%";
  return Math.round(p * 100) + "%";
}

/* 분포 entries에서 술어 적중 p 합 — hitProbability 부재 시 동일 정의 로컬 폴백 */
function sumHit(dist, pred) {
  if (typeof draftApi.hitProbability === "function") {
    try {
      return draftApi.hitProbability(dist, pred);
    } catch (err) {
      /* 아래 로컬 폴백 */
    }
  }
  if (!dist || !Array.isArray(dist.entries)) return 0;
  var s = 0;
  for (var i = 0; i < dist.entries.length; i++) {
    if (pred(dist.entries[i].aug)) s += dist.entries[i].p;
  }
  return s;
}

/* 근사: 증강에는 수치 funScore가 없고 funTier(S~D)만 있어, 밴드 힌트(§3-5)의
 * E[리롤 funScore] 계산용으로 티어를 0~100 스케일 스칼라로 근사한다.
 * 티어 부재/어휘 밖은 중립값 55(B급 상당)로 취급 — 근사 상수. */
var AUG_FUNTIER_SCORE = { S: 85, A: 70, B: 55, C: 40, D: 25 };

function augFunScore(aug) {
  var s = aug && AUG_FUNTIER_SCORE[aug.funTier];
  return typeof s === "number" ? s : 55;
}

/* 목표 집합 T (§3-3): 이 카드가 여는 루트(매칭 combo들)의 구성 증강 중
 * 아직 안 나온 것(game.pool − game.used)의 apiName Set + "이 카드가 루트 구성원인가".
 * T2의 routeTargets(recommend.js)가 있으면 그것을 신뢰하고(typeof 방어 —
 * routeSet: 루트 미완성분 Set, candidateInRoute: 비대칭 경고 근거),
 * 없으면 스펙 정의를 로컬로 미러한다 (inRoute는 pv.newCombo로 근사). */
function routeInfoFor(pv, candidate) {
  if (typeof recommendApi.routeTargets === "function") {
    try {
      var rt = recommendApi.routeTargets({
        champion: state.champion,
        picked: resolvedPicks(),
        candidate: candidate,
        synergies: state.data.synergies,
        augments: state.data.augments,
        game: state.game,
      });
      if (rt && rt.routeSet && typeof rt.routeSet.has === "function") {
        return { T: rt.routeSet, inRoute: !!rt.candidateInRoute };
      }
      if (rt && typeof rt.has === "function") {
        return { T: rt, inRoute: !!(pv && pv.newCombo) };
      }
    } catch (err) {
      /* 로컬 폴백 */
    }
  }
  return { T: localRouteTargets(candidate), inRoute: !!(pv && pv.newCombo) };
}

function localRouteTargets(candidate) {
  var out = new Set();
  var g = state.game;
  var syn = state.data && state.data.synergies;
  var combos = syn && Array.isArray(syn.combos) ? syn.combos : [];
  if (!g || !state.champion || !combos.length) return out;
  var champIdLc = String(state.champion.id || "").toLowerCase();
  var pickedNames = {};
  resolvedPicks().forEach(function (p) {
    if (p && p.apiName) pickedNames[p.apiName] = true;
  });
  if (candidate && candidate.apiName) pickedNames[candidate.apiName] = true;
  /* 리롤로 아직 얻을 수 있는 증강 = pool − used (사용자 멘탈 모델 "나온 것/안 나온 것") */
  var usedSet = {};
  (g.used || []).forEach(function (n) {
    usedSet[n] = true;
  });
  var remaining = {};
  (g.pool || []).forEach(function (a) {
    if (a && a.apiName && !usedSet[a.apiName]) remaining[a.apiName] = true;
  });
  combos.forEach(function (combo) {
    if (!combo || !Array.isArray(combo.augments) || !combo.augments.length) return;
    var champs = Array.isArray(combo.champions) ? combo.champions : [];
    if (
      champs.length &&
      !champs.some(function (c) {
        return String(c).toLowerCase() === champIdLc;
      })
    )
      return;
    var hit = combo.augments.filter(function (n) {
      return pickedNames[n];
    });
    var pass =
      combo.matchType === "all" ? hit.length === combo.augments.length : hit.length >= 1;
    if (!pass) return;
    combo.augments.forEach(function (n) {
      if (remaining[n]) out.add(n);
    });
  });
  return out;
}

/* "먹을까/리롤할까" 3밴드 힌트 (§3-5 — 결정1로 v1 활성화, "힌트" 라벨 명시).
 * d = E[리롤 funScore] − funScore(현재 카드).
 * 근사: 임계 ±8은 funScore 0~100 스케일의 근사 상수 (SPEC-day2 §3-5).
 * 단정 어미 금지("~각" 유지) — 근사 가중치 위의 판단임을 톤으로 전달.
 * 현재 카드가 진행 중 루트의 구성원이면 밴드와 무관하게 "먹는 각(루트 확정)" 우선. */
function bandHint(dist, aug, inRoute) {
  if (inRoute) return { cls: "eat", label: "먹는 각 (루트 확정)" };
  if (!dist || !Array.isArray(dist.entries) || !dist.entries.length) return null;
  var e = 0;
  for (var i = 0; i < dist.entries.length; i++) {
    e += dist.entries[i].p * augFunScore(dist.entries[i].aug);
  }
  var d = e - augFunScore(aug);
  if (d > 8) return { cls: "reroll", label: "리롤 각 ▲" };
  if (d < -8) return { cls: "eat", label: "먹는 각 ▼" };
  return { cls: "even", label: "반반 ―" };
}

/* 카드별 확률 1줄 (§3-4-2) — 픽 미리보기 스트립에 이어붙는 12px 컴팩트 줄.
 * 슬롯 리롤 소진(rerolled[i]) 시 줄 제거 (§3-4-4). API 부재/실패 시 "" (방어적). */
function cardOddsHtml(aug, i, pv) {
  if (!oddsReady()) return "";
  var r = state.round;
  if (!r || (r.rerolled && r.rerolled[i])) return "";
  var dist = null;
  try {
    dist =
      typeof draftApi.rerollDistribution === "function"
        ? draftApi.rerollDistribution(state.game, i)
        : null;
  } catch (err) {
    dist = null;
  }
  if (!dist || !Array.isArray(dist.entries) || !dist.entries.length) return "";

  var route = routeInfoFor(pv, aug);
  var T = route.T;
  /* 이 카드가 루트(콤보) 구성원 — 비대칭 경고 대상 (§3-4-2) */
  var inRoute = route.inRoute;
  var rows = "";

  if (T.size > 0) {
    var pT = sumHit(dist, function (a) {
      return T.has(a.apiName);
    });
    var m = 0;
    for (var k = 0; k < dist.entries.length; k++) {
      if (T.has(dist.entries[k].aug.apiName)) m++;
    }
    if (inRoute) {
      /* 비대칭 경고 (§3-4-2): 먹기는 확정, 리롤은 이 카드를 영구 소각 */
      rows +=
        '<span class="aug-odds-warn">지금 먹으면 확정 — 리롤은 이 카드를 영구 소각하고 ' +
        esc(fmtPct(pT)) + "에 거는 것</span>";
    } else if (m > 0) {
      rows +=
        '<span class="aug-odds-route">→ 이 루트 증강이 리롤에서 또 나올 확률 ' +
        esc(fmtPct(pT)) + " (잔여 " + m + "개)</span>";
    }
  } else if (inRoute) {
    rows +=
      '<span class="aug-odds-warn">지금 먹으면 확정 — 리롤은 이 카드를 영구 소각</span>';
  }

  var hint = bandHint(dist, aug, inRoute);
  if (hint) {
    rows +=
      '<span class="odds-hint odds-hint-' + hint.cls + '">힌트 · ' +
      esc(hint.label) + "</span>";
  }
  if (!rows) return "";
  /* 카드 낭독 과밀 방지: 미리보기 스트립과 동일하게 정보성 줄은 aria-hidden */
  return '<span class="aug-odds" aria-hidden="true">' + rows + "</span>";
}

/* 라운드 확률 스트립 (§3-4-1): 등급 배지 아래 1개 — 라운드 공통 정보만.
 * 리롤 분포는 같은 등급·같은 used라 라운드 공통이다 (황금 리롤로 등급이 오른
 * 슬롯만 예외 — 그 슬롯은 카드별 줄이 rerollDistribution으로 따로 계산).
 * <details>로 접을 수 있게 (모바일 과밀 방지) — 펼침 상태는 state.oddsOpen에 유지. */
function renderOddsStrip() {
  var wrap = $("#odds-strip");
  if (!wrap) return;
  var r = state.round;
  if (!oddsReady() || !r || !Array.isArray(r.slots) || !r.slots.length) {
    wrap.innerHTML = "";
    return;
  }
  var dist = null;
  try {
    dist = draftApi.drawDistribution(state.game, r.tier);
  } catch (err) {
    dist = null;
  }
  if (!dist || !Array.isArray(dist.entries) || !dist.entries.length) {
    wrap.innerHTML = "";
    return;
  }
  var counts = null;
  try {
    counts = draftApi.remainingByTier(state.game);
  } catch (err) {
    counts = null;
  }
  var total = counts
    ? (counts.silver || 0) + (counts.gold || 0) + (counts.prismatic || 0)
    : 0;

  var tierLabel = TIER_LABEL[dist.resolvedTier] || dist.resolvedTier || "";
  var pFunS = sumHit(dist, function (a) {
    return a.funTier === "S";
  });
  var pAbility = sumHit(dist, function (a) {
    return a.category === "ability";
  });

  /* 접힌 상태에서도 핵심 숫자가 보이는 요약 줄 */
  var mini =
    "꿀잼S " + fmtPct(pFunS) + " · 스킬 " + fmtPct(pAbility) +
    " · 남은 " + tierLabel + " " + dist.entries.length + "개";

  var body =
    '<p class="odds-line">리롤하면 <strong>' + esc(tierLabel) + "</strong> " +
    dist.entries.length + "개 중 1개 — 꿀잼 S급 " + esc(fmtPct(pFunS)) +
    " · 스킬 증강 " + esc(fmtPct(pAbility)) + "</p>";

  if (counts) {
    body +=
      '<p class="odds-line odds-line-pool">남은 풀 — 실버 ' + (counts.silver || 0) +
      " · 골드 " + (counts.gold || 0) + " · 프리즘 " + (counts.prismatic || 0) +
      " (전체 " + total + "개)</p>";
  }

  /* 황금 리롤 줄 — 사용 전에만 (§1-2 결정: 상위 등급 풀 기준이라 일반 리롤과 답이 다름).
   * 사용 후에는 줄 제거 (§3-4-4 소진 처리). */
  var goldenSpent = state.goldenUsed || (state.game && state.game.goldenUsed);
  if (!goldenSpent && typeof draftApi.goldenDistribution === "function") {
    var gi = 0;
    for (var i = 0; i < r.slots.length; i++) {
      if (r.slots[i] && r.slots[i].tier === r.tier) {
        gi = i;
        break;
      }
    }
    var gd = null;
    try {
      gd = draftApi.goldenDistribution(state.game, gi);
    } catch (err) {
      gd = null;
    }
    if (gd && Array.isArray(gd.entries) && gd.entries.length) {
      var gLabel = TIER_LABEL[gd.resolvedTier] || gd.resolvedTier || "";
      body +=
        '<p class="odds-line odds-line-golden">✨ 황금 리롤 시 <strong>' + esc(gLabel) +
        "</strong> " + gd.entries.length + "개 중 1개 — 꿀잼 S급 " +
        esc(fmtPct(sumHit(gd, function (a) { return a.funTier === "S"; }))) +
        " · 스킬 증강 " +
        esc(fmtPct(sumHit(gd, function (a) { return a.category === "ability"; }))) +
        "</p>";
    }
  }

  /* 재등장 금지 규칙(시뮬 내 정확) + 정직성 캡션 — "시뮬 기준" 고지는 여기 1회 (§3-6) */
  body +=
    '<p class="odds-caption">한 번 화면에 나온 카드는 이번 판에 다시 안 나와요 · ' +
    "모든 %는 시뮬 기준 (가중치는 근사 상수)</p>";

  wrap.innerHTML =
    '<details class="odds-strip"' + (state.oddsOpen ? " open" : "") + ">" +
    '<summary><span class="odds-summary-title">📊 리롤 확률</span>' +
    '<span class="odds-strip-mini">' + esc(mini) + "</span></summary>" +
    body +
    "</details>";
}

function renderDraft() {
  var r = state.round;
  if (!r) {
    showError("라운드 정보가 없습니다. 처음부터 다시 시도해 주세요.");
    return;
  }
  var tier = r.tier || "silver";

  renderProgress();

  /* 챔피언 + 레벨 */
  var c = state.champion;
  $("#draft-champ").innerHTML =
    '<img src="' + esc(c.icon) + '" alt="" loading="lazy" decoding="async">' +
    '<div><span class="draft-champ-name">' + esc(c.nameKo) + "</span>" +
    '<span class="draft-champ-level">레벨 ' + esc(r.level) + " 증강 선택</span></div>";

  /* 등급 배지 */
  var badge = $("#tier-badge");
  badge.className = "tier-badge tier-" + tier;
  badge.textContent = TIER_LABEL[tier] || tier;

  /* 라운드 확률 스트립 — 리롤/황금 리롤/라운드 진행 시 renderDraft 전체 재렌더로 자동 갱신 */
  renderOddsStrip();

  /* 카드 3장 */
  var cardsHtml = (r.slots || [])
    .map(function (aug, i) {
      if (!aug) return "";
      var augTier = aug.tier || tier;
      var rerolledThis = r.rerolled && r.rerolled[i];
      /* 방어적 파싱: category/enhancedSkill은 draft.js 신규 필드 (F3 병렬 작업 중).
       * 필드가 없으면 배지·강화 스킬 줄을 그리지 않는다. */
      var isAbility = aug.category === "ability";
      var enh =
        aug.enhancedSkill && aug.enhancedSkill.key ? aug.enhancedSkill : null;
      /* 미리보기 계산 1회 — html(스트립)과 newCombo(티어 승격 시그널) 둘 다 사용 */
      var pv = previewInfo(aug);
      /* 카드 최종 꿀잼 티어: funTier(F1 병렬 생성 중) 기본, 단 새 조합이
       * 1개 이상 가동되면 "S" 승격 (조합 발동이 최고 시그널).
       * funTier 부재/어휘 밖 + 승격 없음 → null → 티어 테두리·칩 없이
       * 기존 희귀 등급(tier-*) 테두리 그대로 (방어적 폴백). */
      var funTier = pv.newCombo
        ? "S"
        : AUG_FUN_TIER_CLASS[aug.funTier]
          ? aug.funTier
          : null;
      var funCls = funTier ? " aug-fun-" + AUG_FUN_TIER_CLASS[funTier] : "";
      return (
        '<div class="aug-slot">' +
        '<button type="button" class="aug-card tier-' + esc(augTier) + funCls +
        '" data-slot="' + i + '" aria-label="' + esc(aug.nameKo) + " 선택" +
        (funTier ? ", 꿀잼 티어 " + esc(funTier) : "") + '">' +
        augFunChipHtml(funTier, false) +
        '<img class="aug-icon" src="' + esc(aug.icon) +
        '" alt="" loading="lazy" decoding="async" width="64" height="64">' +
        '<span class="aug-tier-label">' + esc(TIER_LABEL[augTier] || augTier) + "</span>" +
        (isAbility ? '<span class="aug-badge-ability">스킬 증강</span>' : "") +
        '<span class="aug-name">' + esc(aug.nameKo) + "</span>" +
        (enh
          ? '<span class="aug-enhanced">' + esc(enh.key) + " 강화" +
            (enh.nameKo ? " · " + esc(enh.nameKo) : "") + "</span>"
          : "") +
        '<span class="aug-desc">' + esc(aug.descKo) + "</span>" +
        pv.html +
        cardOddsHtml(aug, i, pv) +
        "</button>" +
        '<button type="button" class="btn btn-reroll" data-slot="' + i +
        '" aria-label="' + esc(aug.nameKo) + " 리롤\"" +
        (rerolledThis ? " disabled" : "") + ">" +
        (rerolledThis ? "리롤 사용됨" : "🔄 리롤") +
        "</button></div>"
      );
    })
    .join("");
  $("#aug-cards").innerHTML = cardsHtml;
  $("#aug-cards").classList.toggle("golden-armed", state.goldenArmed);

  /* 황금 리롤 */
  var goldenSpent = state.goldenUsed || (state.game && state.game.goldenUsed);
  var btnGolden = $("#btn-golden");
  btnGolden.disabled = !!goldenSpent;
  btnGolden.classList.toggle("armed", state.goldenArmed);
  btnGolden.textContent = goldenSpent
    ? "✨ 황금 리롤 사용됨"
    : state.goldenArmed
      ? "✨ 슬롯 선택 중..."
      : "✨ 황금 리롤 (게임당 1회)";
  $("#golden-hint").hidden = !state.goldenArmed;

  renderHistoryBar();
  showScreen("draft");
}

function onAugCardsClick(e) {
  var target = e.target;
  var rerollBtn = target.closest ? target.closest(".btn-reroll") : null;
  if (rerollBtn) {
    doReroll(Number(rerollBtn.getAttribute("data-slot")), false);
    return;
  }
  var card = target.closest ? target.closest(".aug-card") : null;
  if (!card) return;
  var slot = Number(card.getAttribute("data-slot"));
  if (state.goldenArmed) {
    doGolden(slot, false);
  } else {
    doPick(slot, false);
  }
}

function toggleGoldenArmed() {
  if (state.goldenUsed || (state.game && state.game.goldenUsed)) return;
  state.goldenArmed = !state.goldenArmed;
  renderDraft();
}

/* ---------------- ③ 결과 화면 ---------------- */

function itemById(id) {
  return state.data.items.filter(function (it) {
    return String(it.id) === String(id);
  })[0];
}

function styleTagsHtml(tags) {
  if (!tags || !tags.length) return "";
  return (
    '<div class="style-tags">' +
    tags
      .map(function (t) {
        return '<span class="style-tag">#' + esc(t) + "</span>";
      })
      .join("") +
    "</div>"
  );
}

function renderResult() {
  var picks = resolvedPicks();
  var c = state.champion;

  /* 꿀잼 티어 한 줄 — funrank 항목이 없으면 아예 그리지 않는다 (방어적) */
  var funEntryForChamp = funEntry(c.id);
  var funTierLine = "";
  if (funEntryForChamp && FUN_TIER_CLASS[funEntryForChamp.tier]) {
    funTierLine =
      '<div class="result-fun-tier">이 챔피언 꿀잼 티어: ' +
      funTierBadgeHtml(funEntryForChamp) +
      "</div>";
  }

  /* 요약: 챔피언 + 꿀잼 티어 + 4증강 */
  $("#result-summary").innerHTML =
    '<div class="result-champ">' +
    '<img src="' + esc(c.icon) + '" alt="" loading="lazy" decoding="async">' +
    '<div class="result-champ-name">' + esc(c.nameKo) +
    '<span class="result-champ-title">' + esc(c.title || "") + "</span></div></div>" +
    funTierLine +
    '<div class="result-augs">' +
    picks
      .map(function (p) {
        return (
          '<div class="result-aug">' +
          '<div class="history-item tier-' + esc(p.tier || "silver") + '">' +
          '<img src="' + esc(p.icon) + '" alt="" loading="lazy" decoding="async"></div>' +
          '<span class="result-aug-name">' + esc(p.nameKo) + "</span>" +
          (p.enhancedSkill && p.enhancedSkill.key
            ? '<span class="result-aug-skill">' + esc(p.enhancedSkill.key) + " 강화</span>"
            : "") +
          "</div>"
        );
      })
      .join("") +
    "</div>" +
    /* 선택 증강 상세 — 픽마다 카드 1장. descKo가 없으면(리플레이 폴백 객체) 설명 문단만 생략 */
    '<div class="result-aug-details">' +
    picks
      .map(function (p) {
        var tier = esc(p.tier || "silver");
        /* 태그 줄 맨 앞에 꿀잼 티어 칩 — funTier 부재/어휘 밖이면 "" (방어적).
         * 결과 화면은 드래프트가 끝난 뒤라 newCombos 승격은 적용하지 않는다. */
        var tags =
          augFunChipHtml(p.funTier, true) +
          '<span class="result-detail-tier tier-' + tier + '">' +
          esc(TIER_LABEL[p.tier] || p.tier || "") +
          "</span>" +
          (p.category === "ability"
            ? '<span class="result-detail-badge">스킬 증강</span>'
            : "") +
          (p.enhancedSkill && p.enhancedSkill.key
            ? '<span class="result-detail-skill">' +
              esc(p.enhancedSkill.key) +
              " 강화" +
              (p.enhancedSkill.nameKo ? " · " + esc(p.enhancedSkill.nameKo) : "") +
              "</span>"
            : "");
        return (
          '<div class="result-aug-detail tier-' + tier + '">' +
          '<div class="result-detail-head">' +
          '<div class="history-item tier-' + tier + '">' +
          '<img src="' + esc(p.icon) + '" alt="" loading="lazy" decoding="async"></div>' +
          '<div class="result-detail-meta">' +
          '<span class="result-detail-name">' + esc(p.nameKo) + "</span>" +
          '<span class="result-detail-tags">' + tags + "</span>" +
          "</div></div>" +
          (p.descKo
            ? '<p class="result-detail-desc">' + esc(p.descKo) + "</p>"
            : "") +
          "</div>"
        );
      })
      .join("") +
    "</div>";

  /* 추천 엔진 호출 (실패해도 요약은 보여준다) */
  var rec = null;
  try {
    rec = recommend({
      champion: c,
      picked: picks,
      synergies: state.data.synergies,
      items: state.data.items,
      augments: state.data.augments,
    });
  } catch (err) {
    console.error(err);
  }

  var body = "";
  if (!rec) {
    body =
      '<div class="rec-card"><p class="error-msg">추천 결과를 계산하지 못했습니다. ' +
      "새로고침 후 다시 시도해 주세요.</p></div>";
  } else {
    var fun = Math.max(0, Math.min(100, Math.round(Number(rec.funScore) || 0)));

    /* 헤드라인 + 꿀잼 게이지 */
    body +=
      '<div class="rec-card">' +
      '<p class="rec-headline">' + esc(rec.headline || "") + "</p>" +
      styleTagsHtml(rec.styleTags) +
      "</div>";

    body +=
      '<div class="rec-card"><h3>꿀잼 지수</h3>' +
      '<div class="fun-gauge-wrap">' +
      '<div class="fun-gauge"><div class="fun-gauge-fill" style="width:' + fun + '%"></div></div>' +
      '<span class="fun-gauge-num">' + fun + "<small>/100</small></span>" +
      "</div></div>";

    /* 플레이스타일 */
    if (rec.playstyle) {
      body +=
        '<div class="rec-card"><h3>플레이스타일</h3><p>' +
        esc(rec.playstyle) + "</p></div>";
    }

    /* 조합 카드 (whyFun) */
    if (rec.matchedCombos && rec.matchedCombos.length) {
      body +=
        '<div class="rec-card"><h3>발견한 꿀잼 조합</h3>' +
        '<div class="item-list">' +
        rec.matchedCombos
          .map(function (combo) {
            return (
              '<div class="combo-card">' +
              '<p class="combo-title">' + esc(combo.title || "") + "</p>" +
              '<p class="combo-why">' + esc(combo.whyFun || "") + "</p>" +
              styleTagsHtml(combo.styleTags) +
              "</div>"
            );
          })
          .join("") +
        "</div></div>";
    }

    /* 아이템 (최대 6개) */
    if (rec.items && rec.items.length) {
      body +=
        '<div class="rec-card"><h3>추천 아이템</h3><div class="item-list">' +
        rec.items
          .slice(0, 6)
          .map(function (it) {
            var full = it.icon ? it : itemById(it.id) || it;
            return (
              '<div class="item-row">' +
              '<img src="' + esc(full.icon || "") +
              '" alt="" loading="lazy" decoding="async" width="44" height="44">' +
              '<div class="item-info">' +
              '<div class="item-name">' + esc(it.nameKo || (full && full.nameKo) || "") + "</div>" +
              '<div class="item-reason">' + esc(it.reason || "") + "</div>" +
              "</div></div>"
            );
          })
          .join("") +
        "</div></div>";
    }

    /* 스킬 운용 */
    if (rec.skills) {
      body +=
        '<div class="rec-card"><h3>스킬 운용</h3><p>' +
        esc(rec.skills) + "</p></div>";
    }
  }

  $("#result-body").innerHTML = body;
  syncUrl();
  showScreen("result");
}

/* ---------------- 초기화 ---------------- */

function bindEvents() {
  var searchTimer = null;
  $("#champ-search").addEventListener("input", function (e) {
    state.search = e.target.value || "";
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(renderChampGrid, 120);
  });

  var l9Toggle = $("#toggle-l9");
  if (l9Toggle) {
    l9Toggle.addEventListener("change", function (e) {
      state.trackL9 = !!e.target.checked;
    });
  }

  $("#champ-grid").addEventListener("click", onChampGridClick);
  var previewPanel = $("#champ-preview");
  if (previewPanel) previewPanel.addEventListener("click", onChampPreviewClick);
  $("#aug-cards").addEventListener("click", onAugCardsClick);

  /* 꿀잼 사전: 해시 라우팅(#dex/{id}) + 뒤로가기 버튼 */
  window.addEventListener("hashchange", onHashChange);
  var dexBack = $("#btn-dex-back");
  if (dexBack) dexBack.addEventListener("click", onDexBackClick);

  /* 라운드 확률 스트립 접기/펼치기 상태 기억 — <details> 기본 토글에 편승.
   * 클릭 시점엔 아직 토글 전이므로 새 상태 = !open. (innerHTML 재생성 대비
   * 래퍼에 위임 바인딩) */
  var oddsWrap = $("#odds-strip");
  if (oddsWrap) {
    oddsWrap.addEventListener("click", function (e) {
      var s = e.target.closest ? e.target.closest("summary") : null;
      if (!s || !s.parentNode) return;
      state.oddsOpen = !s.parentNode.open;
    });
  }
  $("#btn-golden").addEventListener("click", toggleGoldenArmed);
  $("#btn-golden-cancel").addEventListener("click", function () {
    state.goldenArmed = false;
    renderDraft();
  });

  $("#btn-share").addEventListener("click", copyShareUrl);
  $("#btn-again").addEventListener("click", function () {
    if (state.champion && startGame(state.champion, newSeed())) {
      clearUrl();
      renderDraft();
    }
  });
  $("#btn-restart").addEventListener("click", function () {
    state.game = null;
    state.round = null;
    state.champion = null;
    clearUrl();
    showSelectScreen();
  });
}

var eventsBound = false;

function init() {
  showScreen("loading");
  loadData().then(
    function (data) {
      state.data = data;
      if (!eventsBound) {
        bindEvents();
        eventsBound = true;
      }
      /* 공유 URL 재현 시도 → 실패하면 챔피언 선택 화면 */
      var params = new URLSearchParams(location.search);
      var replayed = false;
      if (params.get("champ")) {
        try {
          replayed = replayFromParams(params);
        } catch (err) {
          console.error(err);
          replayed = false;
        }
      }
      /* 직접 링크로 #dex/{id} 진입 (게임 재현이 없을 때만 — 재현이 우선) */
      if (!replayed) {
        var dexId = parseDexHash();
        if (dexId) {
          state.dexOpenedByApp = false;
          if (showDexById(dexId)) return;
        }
      }
      if (!replayed) showSelectScreen();
    },
    function (err) {
      console.error(err);
      showError(
        "데이터를 불러오지 못했습니다.\n네트워크 연결을 확인한 뒤 다시 시도해 주세요.\n(" +
          (err && err.message ? err.message : "알 수 없는 오류") +
          ")"
      );
    }
  );
}

/* 재시도 버튼은 데이터 로드 실패 시에도 동작해야 하므로
 * bindEvents(성공 경로에서만 실행)가 아니라 여기서 1회 바인딩한다. */
$("#btn-retry").addEventListener("click", init);

init();
