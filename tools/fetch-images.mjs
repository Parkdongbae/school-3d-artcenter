/* =========================================================
 * 학생 작품 사진 일괄 축소·내려받기 도구
 *
 *  - 구글 설문 시트에 올라온 사진을 구글 서버에 "작게 줄여서" 요청해 내려받습니다.
 *    (구글 드라이브의 원본 사진은 전혀 바뀌지 않습니다)
 *  - 사진마다 두 가지 크기를 만듭니다.
 *      assets/art/<파일ID>-S.webp  : 긴 쪽 512px  (멀리서 보일 때, 작품 목록)
 *      assets/art/<파일ID>-L.webp  : 긴 쪽 1280px (가까이 갔을 때, 크게 보기)
 *  - 다 받으면 js/art-local.js 를 만들어 사이트가 이 사진을 쓰도록 연결합니다.
 *  - 이미 받은 사진은 건너뛰므로, 새 제출이 생기면 다시 실행하면 됩니다.
 *
 * 실행:  node tools/fetch-images.mjs          (Node.js 18 이상)
 *        node tools/fetch-images.mjs --clean  (시트에서 지워진 사진 파일도 정리)
 * ========================================================= */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets', 'art');
const SIZES = [['S', 's512-rw-l72'], ['L', 's1280-rw-l75']];
const CONCURRENCY = 2;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// js/config.js 에서 시트 정보 읽기
const cfg = fs.readFileSync(path.join(ROOT, 'js', 'config.js'), 'utf8');
const sheetId = (cfg.match(/sheetId:\s*'([^']+)'/) || [])[1];
const gid = (cfg.match(/sheetGid:\s*'([^']+)'/) || [])[1] || '0';
if (!sheetId) { console.error('js/config.js 에서 sheetId 를 찾지 못했습니다.'); process.exit(1); }

function parseCsv(text) {
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cur); cur = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += ch;
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  return rows;
}
const fileIdOf = url => { const m = String(url || '').match(/[?&]id=([a-zA-Z0-9_-]+)/) || String(url || '').match(/\/d\/([a-zA-Z0-9_-]{20,})/); return m ? m[1] : null; };

async function download(id, tag, opt) {
  const file = path.join(OUT, `${id}-${tag}.webp`);
  if (fs.existsSync(file) && fs.statSync(file).size > 0) return 'skip';
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      const res = await fetch(`https://lh3.googleusercontent.com/d/${id}=${opt}`);
      if (res.status === 429 || res.status >= 500) { await sleep(4000 * attempt); continue; }
      if (!res.ok) return `실패(HTTP ${res.status}) — 드라이브 공유 권한을 확인하세요`;
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(file, buf);
      return 'ok';
    } catch (e) { await sleep(3000 * attempt); }
  }
  return '실패(여러 번 다시 시도했지만 받지 못함)';
}

const main = async () => {
  console.log('구글 시트를 읽는 중...');
  const res = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`);
  if (!res.ok) { console.error('시트를 읽지 못했습니다. 시트 공유 설정(링크가 있는 모든 사용자: 뷰어)을 확인하세요.'); process.exit(1); }
  const rows = parseCsv(await res.text());
  const ids = new Set();
  rows.slice(1).forEach(c => { for (let b = 5; b < c.length; b += 3) { const id = fileIdOf(c[b]); if (id) ids.add(id); } });
  console.log(`사진 ${ids.size}장을 찾았습니다.`);
  fs.mkdirSync(OUT, { recursive: true });

  const list = [...ids], fails = []; let done = 0, got = 0;
  const worker = async () => {
    while (list.length) {
      const id = list.shift();
      for (const [tag, opt] of SIZES) {
        const r = await download(id, tag, opt);
        if (r === 'ok') { got++; await sleep(250); } else if (r !== 'skip') fails.push(`${id} (${tag}): ${r}`);
      }
      done++;
      process.stdout.write(`\r진행: ${done}/${ids.size}`);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log('');

  if (process.argv.includes('--clean')) {
    let removed = 0;
    for (const f of fs.readdirSync(OUT)) { const id = f.replace(/-(S|L)\.webp$/, ''); if (!ids.has(id)) { fs.unlinkSync(path.join(OUT, f)); removed++; } }
    if (removed) console.log(`시트에 없는 사진 파일 ${removed}개를 정리했습니다.`);
  }

  // 두 크기가 모두 있는 사진만 연결
  // (내용이 같으면 파일도 똑같이 만들어, 새 사진이 없을 때 불필요한 커밋이 생기지 않게 함)
  const ok = [...ids].filter(id => SIZES.every(([t]) => fs.existsSync(path.join(OUT, `${id}-${t}.webp`)))).sort();
  const js = `/* tools/fetch-images.mjs 가 만든 파일입니다. 직접 고치지 마세요. */\nwindow.ART_LOCAL = ${JSON.stringify(Object.fromEntries(ok.map(id => [id, 1])))};\n`;
  fs.writeFileSync(path.join(ROOT, 'js', 'art-local.js'), js);
  const mb = fs.readdirSync(OUT).reduce((a, f) => a + fs.statSync(path.join(OUT, f)).size, 0) / 1048576;
  console.log(`새로 받은 파일 ${got}개 · 연결된 사진 ${ok.length}장 · 전체 ${mb.toFixed(1)}MB`);
  if (fails.length) { console.log(`\n받지 못한 사진 ${fails.length}건 (이 사진들은 사이트에서 구글 드라이브로 바로 불러옵니다):`); fails.slice(0, 20).forEach(f => console.log(' - ' + f)); }
  console.log('\n끝났습니다. GitHub 에 올리면(Vercel 자동 배포) 줄인 사진이 적용됩니다.');
};
main();
