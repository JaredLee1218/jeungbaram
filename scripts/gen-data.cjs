// Node 14 CommonJS — generate docs/data/champions.json + docs/data/items.json
// Usage (scripts/refresh-champions.md 참고):
//   1) scripts/_tmp/ 에 championFull_ko.json, item_ko.json 다운로드 (curl)
//   2) node scripts/gen-data.js [DDragon버전]   (기본 16.17.1)
const fs = require('fs');
const path = require('path');

const P = path.join(__dirname, '_tmp') + path.sep;
const OUT = path.join(__dirname, '..', 'docs', 'data') + path.sep;
const VERSION = process.argv[2] || '16.17.1';

fs.mkdirSync(OUT, { recursive: true });

// ---------- helpers ----------
function stripHtml(s) {
  if (!s) return '';
  return s
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

// first sentence(s) up to 80 chars; hard-truncate with ellipsis if needed
function shortSummary(desc, max) {
  max = max || 80;
  const text = stripHtml(desc);
  if (!text) return '';
  // split into sentences on Korean sentence enders
  const parts = text.split(/(?<=[.!?])\s+/);
  let out = '';
  for (const p of parts) {
    if (!out) { out = p; continue; }
    if ((out + ' ' + p).length <= max) out = out + ' ' + p;
    else break;
  }
  if (out.length > max) out = out.slice(0, max - 1).replace(/[,\s.]+$/, '') + '…';
  return out;
}

// ---------- champions ----------
const full = JSON.parse(fs.readFileSync(P + 'championFull_ko.json', 'utf8'));
const champs = full.data;

const PROP_PATTERNS = [
  ['dash',       /돌진|도약|뛰어들|뛰어올|뛰어넘|급습/],
  ['projectile', /투사체|발사|던지|던져|던집|던진|쏘아|쏩니다|날려|날린|내뿜/],
  ['knockback',  /밀쳐|띄워|띄웁|띄운|밀어내|밀어냅|공중으로/],
  ['shield',     /보호막/],
  ['heal',       /체력을 회복|회복시|회복하|치유/],
  ['stealth',    /은신|투명/],
  ['aoe',        /광역|범위 내|주변의 적|주위의 적|주변 적|근처 적|적들에게/],
  ['targeted',   /지정한 적|지정한 대상|대상으로 지정|지정된 적/],
  ['spin',       /회전/],
  ['global',     /전 지역|맵 어디|맵 전체|(?<!경로상의 )모든 적 챔피언|거리와 상관없이|어디든지 이동/],
];

const SPELL_KEYS = ['Q', 'W', 'E', 'R'];
const champions = [];
const champErrors = [];

for (const cid of Object.keys(champs)) {
  const c = champs[cid];
  if (!c.spells || c.spells.length !== 4) champErrors.push(cid + ': spells=' + (c.spells ? c.spells.length : 0));
  const spellTexts = (c.spells || []).map(s => stripHtml(s.description)).join(' ')
    + ' ' + stripHtml(c.passive && c.passive.description);
  const abilityProps = [];
  for (const [prop, re] of PROP_PATTERNS) {
    if (re.test(spellTexts)) abilityProps.push(prop);
  }
  champions.push({
    id: c.id,
    key: parseInt(c.key, 10),
    nameKo: c.name,
    title: c.title,
    tags: c.tags,
    partype: c.partype,
    usesMana: c.partype === '마나',
    ranged: c.stats.attackrange >= 300,
    attackRange: c.stats.attackrange,
    icon: 'https://ddragon.leagueoflegends.com/cdn/' + VERSION + '/img/champion/' + c.id + '.png',
    spells: (c.spells || []).slice(0, 4).map((s, i) => ({
      key: SPELL_KEYS[i],
      nameKo: s.name,
      short: shortSummary(s.description, 80),
    })),
    passiveKo: (c.passive ? c.passive.name + ': ' + shortSummary(c.passive.description, 60) : ''),
    abilityProps: abilityProps,
  });
}
champions.sort((a, b) => (a.id < b.id ? -1 : 1));

const champOut = {
  _note: 'abilityProps는 스킬(Q/W/E/R)+패시브 한국어 설명 텍스트의 키워드 매칭으로 근사 판정한 값이며 실제 게임 메커니즘과 다를 수 있음(예: 돌진/도약→dash, 투사체/발사→projectile). short/passiveKo는 설명 요약 발췌.',
  version: VERSION,
  champions: champions,
};
fs.writeFileSync(OUT + 'champions.json', JSON.stringify(champOut, null, 1), 'utf8');

// ---------- items ----------
const itemRaw = JSON.parse(fs.readFileSync(P + 'item_ko.json', 'utf8'));
const idata = itemRaw.data;

// curated extras: tier-2 boots, ARAM Guardian starters, ARAM-only Lifeline
const EXTRA_IDS = [3006, 3009, 3020, 3047, 3111, 3158, 3008, 2051, 3112, 3177, 3184, 4003];

function itemTags(it) {
  const dd = it.tags || [];
  const desc = stripHtml(it.description || '');
  const t = new Set();
  if (dd.includes('CriticalStrike') || /치명타/.test(desc)) t.add('crit');
  if (dd.includes('OnHit') || /적중 시/.test(desc)) t.add('onhit');
  if (dd.includes('AttackSpeed') || /공격 속도/.test(desc)) t.add('as');
  if (dd.includes('Damage') || dd.includes('ArmorPenetration')) t.add('ad');
  if (dd.includes('SpellDamage') || dd.includes('MagicPenetration')) t.add('ap');
  if (dd.includes('Armor') || dd.includes('SpellBlock') ||
      (dd.includes('Health') && !dd.includes('Damage') && !dd.includes('SpellDamage') && !dd.includes('AttackSpeed'))) t.add('tank');
  if (dd.includes('LifeSteal') || dd.includes('SpellVamp') || /흡혈|체력을 회복|회복시|치유/.test(desc)) t.add('heal');
  if (/보호막/.test(desc)) t.add('shield');
  if (dd.includes('Boots') || dd.includes('NonbootsMovement') || /이동 속도/.test(desc)) t.add('move');
  if (/둔화|기절|속박|침묵|도발|공중으로|이동 불가/.test(desc)) t.add('cc');
  if (dd.includes('Mana') || dd.includes('ManaRegen')) t.add('mana');
  if (/광역|주변/.test(desc)) t.add('aoe');
  if (/지속 피해를 입|화상|불태|걸쳐 .{0,12}피해/.test(desc)) t.add('dot');
  if (/처형/.test(desc)) t.add('execute');
  if (/처치 시|처치하면|처치할 때/.test(desc)) t.add('onkill');
  if (dd.includes('GoldPer') || /골드를 획득|골드 획득/.test(desc)) t.add('gold');
  if (/아군/.test(desc)) t.add('support');
  if (/돌진|도약/.test(desc)) t.add('dash');
  return Array.from(t);
}

const items = [];
const seenNames = new Set();
for (const id of Object.keys(idata)) {
  const it = idata[id];
  const idNum = parseInt(id, 10);
  if (idNum >= 10000) continue;                       // mode-prefixed variants (12x/22x/32x/771x)
  if (!it.maps || it.maps['12'] !== true) continue;   // ARAM flag
  if (!it.gold || !it.gold.purchasable) continue;
  if (it.inStore === false || it.hideFromAll === true) continue;
  if (it.requiredChampion || it.consumed === true) continue;
  const completed = (!it.into || it.into.length === 0) && (it.from && it.from.length > 0);
  if (!completed && EXTRA_IDS.indexOf(idNum) === -1) continue;
  if (seenNames.has(it.name)) continue; // dedupe by name
  seenNames.add(it.name);
  items.push({
    id: idNum,
    nameKo: it.name,
    tags: itemTags(it),
    icon: 'https://ddragon.leagueoflegends.com/cdn/' + VERSION + '/img/item/' + idNum + '.png',
    _gold: it.gold.total,
  });
}
items.sort((a, b) => b._gold - a._gold || a.id - b.id);
items.forEach(i => { delete i._gold; });

const itemOut = {
  _note: 'ARAM(map12) 구매 가능 완성 아이템 + 2단계 신발 + 수호자 시작템 큐레이션. tags는 설명 텍스트 키워드 기반 근사치(augments.json과 동일 어휘).',
  version: VERSION,
  items: items,
};
fs.writeFileSync(OUT + 'items.json', JSON.stringify(itemOut, null, 1), 'utf8');

// ---------- validation report ----------
const report = {
  champions: champions.length,
  championErrors: champErrors,
  usesMana: champions.filter(c => c.usesMana).length,
  ranged: champions.filter(c => c.ranged).length,
  emptyShorts: champions.reduce((n, c) => n + c.spells.filter(s => !s.short).length, 0),
  longShorts: champions.reduce((n, c) => n + c.spells.filter(s => s.short.length > 80).length, 0),
  noProps: champions.filter(c => c.abilityProps.length === 0).map(c => c.id),
  propFreq: PROP_PATTERNS.reduce((o, [p]) => { o[p] = champions.filter(c => c.abilityProps.includes(p)).length; return o; }, {}),
  items: items.length,
  itemTagFreq: {},
  itemsNoTags: items.filter(i => i.tags.length === 0).map(i => i.id + ' ' + i.nameKo),
};
items.forEach(i => i.tags.forEach(t => { report.itemTagFreq[t] = (report.itemTagFreq[t] || 0) + 1; }));
console.log(JSON.stringify(report, null, 1));

// spot checks
const spot = ['Aatrox', 'Ashe', 'Yasuo', 'Locke', 'Zaahen', 'MonkeyKing', 'KSante'];
for (const s of spot) {
  const c = champions.find(x => x.id === s);
  if (!c) { console.log('MISSING', s); continue; }
  console.log(s, '|', c.nameKo, '| key', c.key, '| mana:', c.usesMana, '| ranged:', c.ranged, c.attackRange, '| props:', c.abilityProps.join(','));
  console.log('  Q:', c.spells[0].nameKo, '-', c.spells[0].short);
  console.log('  P:', c.passiveKo);
}
