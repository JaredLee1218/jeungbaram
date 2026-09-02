// 정적 서빙 무결성 체크 (Node 14)
// - index.html이 참조하는 로컬 리소스(js/css/data) 실재 확인
// - data/*.json 4종 파싱 확인
// - js/*.js 의 import 경로 실재 확인
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS = path.join(__dirname, '..', 'docs');
let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('  ok  - ' + msg); }
  else { fail++; console.log('  FAIL- ' + msg); }
}

// 1. index.html 로컬 참조
const html = fs.readFileSync(path.join(DOCS, 'index.html'), 'utf8');
const refs = [];
const attrRe = /(?:src|href)\s*=\s*["']([^"']+)["']/g;
let m;
while ((m = attrRe.exec(html)) !== null) refs.push(m[1]);
const local = refs.filter(r => !/^(https?:)?\/\//.test(r) && !r.startsWith('data:') && !r.startsWith('#') && !r.startsWith('mailto:'));
console.log('[index.html 로컬 참조 ' + local.length + '건]');
for (const r of local) {
  const p = path.join(DOCS, r.split('?')[0].split('#')[0]);
  ok(fs.existsSync(p), 'index.html -> ' + r);
}

// 2. JSON 4종 파싱
console.log('[data JSON 파싱]');
for (const f of ['augments.json', 'champions.json', 'items.json', 'synergies.json']) {
  const p = path.join(DOCS, 'data', f);
  try {
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    ok(j !== null && typeof j === 'object', f + ' 파싱 OK');
  } catch (e) {
    ok(false, f + ' 파싱 실패: ' + e.message);
  }
}

// 3. js/*.js import 경로
console.log('[js import 경로]');
const jsDir = path.join(DOCS, 'js');
for (const f of fs.readdirSync(jsDir).filter(x => x.endsWith('.js'))) {
  const src = fs.readFileSync(path.join(jsDir, f), 'utf8');
  const impRe = /(?:import[\s\S]*?from\s*|import\s*\(\s*|export[\s\S]*?from\s*)["']([^"']+)["']/g;
  let im, count = 0;
  while ((im = impRe.exec(src)) !== null) {
    const spec = im[1];
    if (!spec.startsWith('.') && !spec.startsWith('/')) continue;
    count++;
    const p = path.resolve(jsDir, spec.split('?')[0]);
    ok(fs.existsSync(p), f + ' -> ' + spec);
  }
  if (count === 0) console.log('  (info) ' + f + ': 로컬 import 없음');
}

// 3b. fetch 경로도 확인
console.log('[js fetch 경로]');
for (const f of fs.readdirSync(jsDir).filter(x => x.endsWith('.js'))) {
  const src = fs.readFileSync(path.join(jsDir, f), 'utf8');
  const fRe = /fetch\s*\(\s*["'`]([^"'`]+)["'`]/g;
  let fm;
  while ((fm = fRe.exec(src)) !== null) {
    const spec = fm[1];
    if (/^(https?:)?\/\//.test(spec)) continue;
    const p = spec.startsWith('.') ? path.resolve(jsDir, spec) : path.join(DOCS, spec);
    ok(fs.existsSync(p), f + ' fetch -> ' + spec);
  }
}

console.log('\n통과 ' + pass + ' / 실패 ' + fail);
if (fail > 0) process.exit(1);
console.log('정적 무결성 체크 통과');
