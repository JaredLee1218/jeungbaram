// Node 14 CommonJS — CommunityDragon 챔피언 bin에서 스킬 단위 mSpellTags 추출
//
// 산출: scripts/_tmp/spelltags.json — 173명 × Q/W/E/R 슬롯별 Trait_* 태그 배열
//       + castTypes(슬롯별 mCastType — 1=대상 지정, 3=스킬샷, null=미보유).
//       enrich-champions.cjs가 이 파일을 읽어 spells[i].props를 재생성한다.
//
// mCastType 캘리브레이션(2026-09-03 실측 — bin 전수 대조):
//   1 = 유닛 대상 지정 (Annie Q·Brand R·Malphite Q·Veigar R·Kassadin Q 등 32슬롯 전부 대상 클릭형)
//   3 = 방향/위치 스킬샷 (Ezreal Q·Ashe R 등), 미보유(null) = 자기 시전·기타 606슬롯
//   근사: 대상 지정 스펠이라도 mCastType 미보유가 많아(라이즈 W 등) 부재 ≠ 비대상지정.
//   enrich-champions.cjs가 castType=1을 targeted의 게임 데이터 근거로 쓰고 키워드와 병합한다.
//
// 방법(research/raw/14-champion-bins.md §8 재현 절차 그대로):
//   1. docs/data/champions.json의 173명 id → alias = id.toLowerCase()
//   2. https://raw.communitydragon.org/latest/game/data/characters/{alias}/{alias}.bin.json
//      → scripts/_tmp/bins/{alias}.bin.json 캐시 (있으면 재다운로드 안 함 — 재실행 가능)
//   3. CharacterRecord(키 .../CharacterRecords/Root 우선)의 spellNames = Q/W/E/R 슬롯 순서
//   4. 전체 재귀 탐색으로 mSpellTags 보유 오브젝트 수집 → 최상위 bin 키가 spellNames[i]로
//      끝나면 해당 슬롯에 귀속(복수 매칭 시 태그 합집합)
//   5. 슬롯 미달(14-champion-bins.md §8: aphelios·bard·hwei·katarina·naafiri·nasus·
//      tryndamere·varus — 래퍼/변신 스킬명이 spellNames와 어긋나는 추출 휴리스틱 한계)은
//      SLOT_OVERRIDES로 수동 보정 (각 항목 근거 주석)
//
// 실행:
//   node scripts/fetch-spelltags.cjs           # 다운로드(캐시 우선) + 추출 + 저장
//   node scripts/fetch-spelltags.cjs --stats   # 태그 어휘·커버리지 통계만 출력(저장은 동일)
//
// 주의: Node v14 (fetch 없음) → curl.exe 사용. 총 ~15MB, 최초 1회만.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const TMP = path.join(__dirname, '_tmp');
const BINS = path.join(TMP, 'bins');
const OUT = path.join(TMP, 'spelltags.json');
const CHAMPS = path.join(__dirname, '..', 'docs', 'data', 'champions.json');
const BASE = 'https://raw.communitydragon.org/latest/game/data/characters/';
const STATS = process.argv.indexOf('--stats') !== -1;

// ---------- 슬롯 수동 보정 (research/raw/14-champion-bins.md §8의 미달 챔피언) ----------
// 값: 슬롯 → 매칭 이름(들). bin 최상위 키가 '/이름'으로 끝나거나, 그 엔트리 안의
// mScriptName이 일치하면 해당 키의 mSpellTags 합집합을 그 슬롯에 귀속.
// 전부 실제 bin을 열어 태그 보유 키를 전수 대조해 확정했다 (2026-09-03 실측):
//  - 나피리는 보정 불필요: spellNames가 슬롯 위치 순서로 정렬돼 있어(내부 파일명은
//    리워크 잔재로 W/R이 뒤바뀌어 있으나) 위치 기반 매칭이 올바로 귀속한다.
//  - 아펠리오스 E(무기 교체 큐)·바드 E(마법의 여행)·흐웨이 Q 서브 3종·카타리나 W·
//    나서스 W(시들다)·트린다미어 W(조롱)·바루스 W(역병 화살)는 게임 데이터 자체에
//    mSpellTags가 없음(전수 확인) → 보정 불가, enrich에서 키워드 폴백으로 처리.
const SLOT_OVERRIDES = {
  // 아펠리오스 Q: spellNames의 Q(ApheliosQ_ClientTooltipWrapper)는 태그가
  // Trait_SwapsIntoImmobilizingCCAbility뿐. 무기별 Q 실스펠 4종이 해시 키
  // ({b3ce4169} 등)에 존재(mScriptName으로 식별) → 합집합으로 Q 근사.
  // 근사: 크레센덤 Q는 태그 자체가 없어 4종 합집합 (실측: Gravitum=CC,
  // Infernum=AoE, Calibrum=투사체, Severum=힐+실드)
  Aphelios: {
    Q: ['ApheliosCalibrumQ', 'ApheliosSeverumQ', 'ApheliosGravitumQ', 'ApheliosInfernumQ'],
  },
  // 흐웨이: spellNames는 상위 스킬(HweiW 등)이나 태그는 서브 스펠 일부에만 있음.
  // 실측 태그 보유: HweiWQ(Boon)·HweiWW(Boon)·HweiEW(ImmobilizingCC)뿐 —
  // W·E는 해당 서브 합집합으로 귀속, Q 서브 3종(QQ/QW/QE)은 태그 없음.
  Hwei: {
    W: ['HweiWQ', 'HweiWW'],
    E: ['HweiEW'],
  },
};

// ---------- 유틸 ----------
function download(alias, cb) {
  const dest = path.join(BINS, alias + '.bin.json');
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) return cb(null, dest, false);
  const url = BASE + alias + '/' + alias + '.bin.json';
  execFile('curl.exe', ['-sS', '-f', '--retry', '2', '-o', dest, url],
    { windowsHide: true }, function (err) {
      if (err) {
        try { fs.unlinkSync(dest); } catch (e) { /* ignore */ }
        return cb(new Error(alias + ': ' + err.message));
      }
      cb(null, dest, true);
    });
}

/** 재귀 탐색 — mSpellTags 배열 보유 오브젝트의 태그를 전부 수집 */
function collectTags(node, acc) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) collectTags(node[i], acc);
    return;
  }
  if (Array.isArray(node.mSpellTags)) {
    for (const t of node.mSpellTags) {
      if (typeof t === 'string' && t && acc.indexOf(t) === -1) acc.push(t);
    }
  }
  for (const k in node) {
    if (k === 'mSpellTags') continue;
    collectTags(node[k], acc);
  }
}

/** bin 1개 파싱 → { spellNames, slots:{Q..R: [tags]|null}, castTypes:{Q..R: number|null}, others:{key:[tags]} } */
function parseBin(champId, raw) {
  const bin = JSON.parse(raw);
  // CharacterRecord: .../CharacterRecords/Root 우선 (변신 챔피언은 폼별 레코드가 병존)
  let record = null;
  for (const key in bin) {
    const v = bin[key];
    if (v && v.__type === 'CharacterRecord' && Array.isArray(v.spellNames)) {
      if (/\/CharacterRecords\/Root$/i.test(key)) { record = v; break; }
      if (!record) record = v;
    }
  }
  if (!record) throw new Error(champId + ': CharacterRecord 없음');
  const spellNames = record.spellNames.slice(0, 4);

  // 최상위 키별 태그 + 스크립트명 수집 (해시 키는 mScriptName으로만 식별 가능)
  const byKey = {};
  const namesByKey = {};
  for (const key in bin) {
    const acc = [];
    collectTags(bin[key], acc);
    if (acc.length) {
      byKey[key] = acc;
      const v = bin[key];
      namesByKey[key] = (v && typeof v.mScriptName === 'string') ? v.mScriptName.toLowerCase() : '';
    }
  }

  const SLOT_KEYS = ['Q', 'W', 'E', 'R'];
  const slots = {};
  const used = {};
  const lcByKey = Object.keys(byKey).map(function (k) { return [k, k.toLowerCase()]; });
  for (let i = 0; i < 4; i++) {
    const name = (spellNames[i] || '').toLowerCase();
    let tags = null;
    if (name) {
      for (const pair of lcByKey) {
        // spellNames 값은 "AsheQAbility/AsheQ" 접미사 또는 전체 경로 — endsWith로 판정
        if (pair[1] === name || pair[1].slice(-(name.length + 1)) === '/' + name) {
          tags = (tags || []).concat(byKey[pair[0]].filter(function (t) {
            return (tags || []).indexOf(t) === -1;
          }));
          used[pair[0]] = true;
        }
      }
    }
    slots[SLOT_KEYS[i]] = tags;
  }

  // 슬롯별 mCastType(+ 같은 스펠의 mMissileSpec 보유 여부) — 태그와 달리 mSpell 직속
  // 필드라 byKey(태그 보유 키)에 없는 스펠도 있으므로 bin 최상위 키 전체를 같은 접미사
  // 규칙으로 재탐색한다 (첫 정의값 사용 — 결정론).
  const castTypes = {};
  const missiles = {};
  const allKeysLc = Object.keys(bin).map(function (k) { return [k, k.toLowerCase()]; });
  function findCastType(name) {
    const lcName = name.toLowerCase();
    for (const pair of allKeysLc) {
      const v = bin[pair[0]];
      const nameHit = pair[1] === lcName || pair[1].slice(-(lcName.length + 1)) === '/' + lcName ||
        // 해시 키(수동 보정 스펠)는 mScriptName으로 식별
        (v && typeof v.mScriptName === 'string' && v.mScriptName.toLowerCase() === lcName);
      if (nameHit && v && v.mSpell && v.mSpell.mCastType !== undefined) {
        return { ct: v.mSpell.mCastType, missile: v.mSpell.mMissileSpec !== undefined };
      }
    }
    return null;
  }
  for (let i = 0; i < 4; i++) {
    // spellNames 값("AsheQAbility/AsheQ" 등)을 그대로 접미사 매칭 — 태그 귀속과 동일 규칙
    const name = (spellNames[i] || '');
    const got = name ? findCastType(name) : null;
    castTypes[SLOT_KEYS[i]] = got ? got.ct : null;
    missiles[SLOT_KEYS[i]] = got ? got.missile : false;
  }
  // 수동 보정 슬롯(아펠리오스 Q 등): 보정 이름 중 첫 정의값
  const ovCT = SLOT_OVERRIDES[champId];
  if (ovCT) {
    for (const slotKey in ovCT) {
      if (castTypes[slotKey] === null) {
        for (const suffix of ovCT[slotKey]) {
          const got = findCastType(suffix);
          if (got !== null) { castTypes[slotKey] = got.ct; missiles[slotKey] = got.missile; break; }
        }
      }
    }
  }

  // 수동 보정 (미달 8명)
  const ov = SLOT_OVERRIDES[champId];
  if (ov) {
    for (const slotKey in ov) {
      const tags = [];
      for (const suffix of ov[slotKey]) {
        const sfx = suffix.toLowerCase();
        for (const pair of lcByKey) {
          if (pair[1].slice(-(sfx.length + 1)) === '/' + sfx || pair[1] === sfx ||
              namesByKey[pair[0]] === sfx) {
            for (const t of byKey[pair[0]]) if (tags.indexOf(t) === -1) tags.push(t);
            used[pair[0]] = true;
          }
        }
      }
      if (tags.length) slots[slotKey] = tags;
      else console.warn('  경고: ' + champId + '.' + slotKey + ' SLOT_OVERRIDES 키 미발견');
    }
  }

  // 슬롯 미귀속 태그 보유 키 (디버깅·수동 보정 근거용)
  const others = {};
  for (const key in byKey) {
    if (!used[key]) others[key] = byKey[key];
  }
  return { spellNames: record.spellNames.slice(0, 4), slots: slots, castTypes: castTypes, missiles: missiles, others: others };
}

// ---------- 실행 ----------
if (!fs.existsSync(BINS)) fs.mkdirSync(BINS, { recursive: true });
const champs = JSON.parse(fs.readFileSync(CHAMPS, 'utf8')).champions;

const queue = champs.map(function (c) { return { id: c.id, alias: c.id.toLowerCase() }; });
const result = {};
let downloaded = 0, cached = 0;
const errors = [];

let inFlight = 0, idx = 0;
function pump() {
  while (inFlight < 6 && idx < queue.length) {
    const job = queue[idx++];
    inFlight++;
    download(job.alias, function (err, dest, wasDownload) {
      inFlight--;
      if (err) { errors.push(err.message); return pump(); }
      if (wasDownload) downloaded++; else cached++;
      try {
        result[job.id] = parseBin(job.id, fs.readFileSync(dest, 'utf8'));
      } catch (e) {
        errors.push(job.id + ' 파싱 실패: ' + e.message);
      }
      pump();
    });
  }
  if (inFlight === 0 && idx >= queue.length) finish();
}

function finish() {
  if (errors.length) {
    console.error('오류 ' + errors.length + '건:\n' + errors.join('\n'));
    process.exit(1);
  }
  // 커버리지 집계
  let slotTotal = 0, slotTagged = 0;
  const missingSlots = [];
  const vocab = {};
  for (const id in result) {
    const slots = result[id].slots;
    for (const k of ['Q', 'W', 'E', 'R']) {
      slotTotal++;
      if (slots[k] && slots[k].length) {
        slotTagged++;
        for (const t of slots[k]) vocab[t] = (vocab[t] || 0) + 1;
      } else {
        missingSlots.push(id + '.' + k);
      }
    }
  }
  const out = {
    _note: 'CommunityDragon latest 챔피언 bin의 SpellDataResource mSpellTags를 슬롯별로 추출 ' +
      '(생성: scripts/fetch-spelltags.cjs — 추출 휴리스틱·수동 보정은 스크립트 주석 참조). ' +
      '근사: 슬롯 귀속은 CharacterRecord.spellNames 접미사 매칭 + 미달 8명 수동 보정. ' +
      'castTypes = 슬롯별 mCastType(1=대상 지정, 3=스킬샷, null=미보유 — 부재 ≠ 비대상지정), ' +
      'missiles = 그 스펠의 mMissileSpec 보유 여부(castType과 같은 키에서 판독).',
    source: BASE + '{alias}/{alias}.bin.json',
    fetchedAt: new Date().toISOString().slice(0, 10),
    coverage: { champions: Object.keys(result).length, slotsTagged: slotTagged, slotsTotal: slotTotal },
    missingSlots: missingSlots,
    champions: result,
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1), 'utf8');
  console.log('bins: 다운로드 ' + downloaded + ' / 캐시 ' + cached);
  console.log('챔피언 ' + Object.keys(result).length + '명, 슬롯 태깅 ' + slotTagged + '/' + slotTotal);
  console.log('미달 슬롯(' + missingSlots.length + '): ' + (missingSlots.join(', ') || '없음'));
  if (STATS) {
    const rows = Object.keys(vocab).sort(function (a, b) { return vocab[b] - vocab[a]; });
    console.log('\n주 슬롯 태그 어휘 ' + rows.length + '종:');
    for (const t of rows) console.log('  ' + vocab[t] + '\t' + t);
  }
  console.log('wrote ' + OUT);
}

pump();
