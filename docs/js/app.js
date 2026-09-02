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

var SCREENS = ["loading", "error", "select", "draft", "result"];

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
    "이 챔피언으로 드래프트 시작</button></div>";
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
      return (
        '<div class="aug-slot">' +
        '<button type="button" class="aug-card tier-' + esc(augTier) +
        '" data-slot="' + i + '" aria-label="' + esc(aug.nameKo) + " 선택\">" +
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
