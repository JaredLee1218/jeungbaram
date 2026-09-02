/**
 * scripts/test-montecarlo.mjs — 몬테카를로 스모크 (Node v14 호환)
 * 실행: node scripts/test-montecarlo.mjs   (실패 시 exit 1)
 *
 * 실데이터(docs/data/*.json)로 서로 다른 시드 30개 x 랜덤 챔피언 게임을
 * 4라운드 자동 진행(랜덤 리롤/황금 리롤 포함, 조작도 시드 결정적):
 *  - 에러 0건
 *  - 등급 규칙 위반 0건:
 *      (a) 1·2라운드 둘 다 실버 금지
 *      (b) 잔여 3개 이상이면 화면 3슬롯 동일 등급
 *      (c) 등급 값은 silver/gold/prismatic 중 하나
 *      (d) 게임 내 노출 증강 재등장(중복) 금지
 *      (e) 황금 리롤 시 등급 상승(잔여 있으면), 게임당 1회
 *      (f) 레벨 순서 3/7/11/15, 최종 picked 4개
 *  - 매 게임 recommend() 결과 생성 (headline/playstyle/items/skills/funScore)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createRng,
  newGame,
  nextRound,
  rerollSlot,
  goldenReroll,
  pickAugment,
  ROUND_LEVELS,
} from '../docs/js/draft.js';
import { recommend } from '../docs/js/recommend.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, '..', 'docs', 'data');
function loadJson(f) {
  return JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
}
const AUGMENTS = loadJson('augments.json').augments;
const CHAMPIONS = loadJson('champions.json').champions;
const ITEMS = loadJson('items.json').items;
const SYNERGIES = loadJson('synergies.json');

const TIERS = ['silver', 'gold', 'prismatic'];
const TIER_RANK = { silver: 0, gold: 1, prismatic: 2 };

let pass = 0;
let fail = 0;
const failures = [];
function check(cond, msg) {
  if (cond) { pass++; }
  else { fail++; failures.push(msg); console.error('  FAIL: ' + msg); }
}

function remainingByTier(game) {
  const used = {};
  for (const n of game.used) used[n] = true;
  const counts = { silver: 0, gold: 0, prismatic: 0 };
  for (const a of game.pool) if (!used[a.apiName]) counts[a.tier]++;
  return counts;
}

const SEEDS = [];
for (let i = 0; i < 30; i++) SEEDS.push(1000 + i * 7919); // 서로 다른 시드 30개

let errorCount = 0;
let gamesWithRecommend = 0;

for (let gi = 0; gi < SEEDS.length; gi++) {
  const seed = SEEDS[gi];
  const ctrl = createRng('ctrl-' + seed); // 조작(챔피언/리롤 선택)용 별도 결정적 RNG
  const champion = CHAMPIONS[Math.floor(ctrl() * CHAMPIONS.length)];
  const label = 'seed=' + seed + ' champ=' + champion.id;
  try {
    const g = newGame({ augments: AUGMENTS, champion: champion, seed: seed });
    const roundTiers = [];
    const levels = [];
    const seenNames = {};
    let goldenUsedThisGame = false;

    for (let r = 0; r < 4; r++) {
      const before = remainingByTier(g);
      const round = nextRound(g);
      levels.push(round.level);
      roundTiers.push(round.tier);

      // (c) 등급 값 유효
      check(TIERS.indexOf(round.tier) !== -1, label + ' r' + r + ': 유효 등급(' + round.tier + ')');
      // (b) 잔여 충분 시 3슬롯 동일 등급
      if (before[round.tier] >= 3) {
        check(round.slots.every(function (a) { return a.tier === round.tier; }),
          label + ' r' + r + ': 3슬롯 동일 등급 위반 (' + round.slots.map(function (a) { return a.tier; }).join(',') + ')');
      }
      // (d) 중복 금지 — 노출 즉시 기록
      for (const a of round.slots) {
        check(!seenNames[a.apiName], label + ' r' + r + ': 증강 재등장 ' + a.apiName);
        seenNames[a.apiName] = true;
      }

      // 랜덤 조작: 40% 확률 일반 리롤 1슬롯, 이후 25% 확률 황금 리롤(미사용 시)
      if (ctrl() < 0.4) {
        const si = Math.floor(ctrl() * 3);
        const oldTier = round.slots[si].tier;
        const newAug = rerollSlot(g, si);
        if (newAug) {
          // (d) 리롤로 나온 새 증강도 재등장 금지
          check(!seenNames[newAug.apiName] || newAug.apiName === round.slots[si].apiName,
            label + ' r' + r + ': 리롤 증강 재등장 ' + newAug.apiName);
          seenNames[newAug.apiName] = true;
          // (b) 일반 리롤은 같은 등급 유지 (해당 등급 잔여가 있었으면)
          if (before[oldTier] >= 4) {
            check(newAug.tier === oldTier,
              label + ' r' + r + ': 일반 리롤 등급 변경 (' + oldTier + '->' + newAug.tier + ')');
          }
        }
        const cur = g.rounds[g.rounds.length - 1];
        check(cur.rerolled[si] === true, label + ' r' + r + ': rerolled 플래그');
        // 같은 슬롯 재리롤은 예외여야 함
        let threw2 = false;
        try { rerollSlot(g, si); } catch (e) { threw2 = true; }
        check(threw2, label + ' r' + r + ': 슬롯 리롤 2회째 예외');
      }
      if (!g.goldenUsed && ctrl() < 0.25) {
        const si = Math.floor(ctrl() * 3);
        const cur0 = g.rounds[g.rounds.length - 1];
        const beforeTier = cur0.slots[si].tier;
        const beforeName = cur0.slots[si].apiName;
        const beforeRemain = remainingByTier(g);
        const upTier = beforeTier === 'silver' ? 'gold' : 'prismatic';
        const newAug = goldenReroll(g, si);
        goldenUsedThisGame = true;
        const cur = g.rounds[g.rounds.length - 1];
        // (e) 등급 상승: 상위 등급 잔여가 있었으면 반드시 상위 등급으로 교체
        if (newAug && beforeRemain[upTier] >= 1) {
          check(newAug.tier === upTier,
            label + ' r' + r + ': 황금 리롤 등급 상승 실패 (' + beforeTier + '->' + newAug.tier + ')');
        }
        if (newAug && newAug.apiName !== beforeName) {
          check(!seenNames[newAug.apiName], label + ' r' + r + ': 황금 리롤 증강 재등장 ' + newAug.apiName);
          seenNames[newAug.apiName] = true;
        }
        check(g.goldenUsed === true, label + ' r' + r + ': goldenUsed 플래그');
        check(cur.golden === si, label + ' r' + r + ': golden 슬롯 기록');
        // 황금 리롤 재시도는 예외여야 함
        let threw = false;
        try { goldenReroll(g, 0); } catch (e) { threw = true; }
        check(threw, label + ' r' + r + ': 황금 리롤 2회째 예외');
      }

      const cur = g.rounds[g.rounds.length - 1];
      const pi = Math.floor(ctrl() * cur.slots.length);
      pickAugment(g, pi);
    }

    // (a) 1·2라운드 둘 다 실버 금지
    check(!(roundTiers[0] === 'silver' && roundTiers[1] === 'silver'),
      label + ': 1·2라운드 연속 실버 (' + roundTiers.join(',') + ')');
    // (f) 레벨 순서·종료 상태
    check(JSON.stringify(levels) === JSON.stringify(ROUND_LEVELS), label + ': 레벨 순서 ' + levels.join('/'));
    check(g.finished === true, label + ': finished=true');
    check(g.picked.length === 4, label + ': picked 4개 (실제 ' + g.picked.length + ')');
    // picked 중복 금지
    const pickedNames = g.picked.map(function (a) { return a.apiName; });
    check(new Set(pickedNames).size === 4, label + ': picked 중복 없음');

    // 매 게임 추천 결과 생성
    const rec = recommend({
      champion: champion,
      picked: g.picked,
      synergies: SYNERGIES,
      items: ITEMS,
      augments: AUGMENTS,
    });
    const recOk = rec && typeof rec === 'object'
      && typeof rec.headline === 'string' && rec.headline.length > 0
      && typeof rec.playstyle === 'string' && rec.playstyle.length > 0
      && Array.isArray(rec.items) && rec.items.length > 0 && rec.items.length <= 6
      && rec.items.every(function (it) { return it && it.id !== undefined && it.nameKo && it.reason; })
      && typeof rec.skills === 'string' && rec.skills.length > 0
      && typeof rec.funScore === 'number' && rec.funScore >= 0 && rec.funScore <= 100
      && Array.isArray(rec.matchedCombos)
      && Array.isArray(rec.styleTags) && rec.styleTags.length > 0;
    check(recOk, label + ': recommend 결과 형태 불량 ' + JSON.stringify(rec && {
      headline: rec.headline, items: (rec.items || []).length, funScore: rec.funScore,
    }));
    if (recOk) gamesWithRecommend++;
  } catch (e) {
    errorCount++;
    fail++;
    failures.push(label + ': 예외 발생 — ' + (e && e.stack ? e.stack : e));
    console.error('  ERROR: ' + label + ' — ' + (e && e.message));
  }
}

console.log('\n게임 30회 중 에러 ' + errorCount + '건, 추천 생성 ' + gamesWithRecommend + '/30');
console.log('통과 ' + pass + ' / 실패 ' + fail);
if (errorCount > 0 || fail > 0 || gamesWithRecommend !== 30) {
  console.error('몬테카를로 스모크 실패');
  process.exit(1);
}
console.log('몬테카를로 스모크 통과');
