/* =========================================================
 * 사이트 설정 저장 (GitHub Actions 에서 실행)
 *  환경 변수
 *   SETTINGS : {"title","line1","line2","subtitle","school","period","sheetId","sheetGid"} (JSON, 없는 항목은 그대로 둠)
 *   LOGO     : '' (그대로) | 'remove' (로고 지우기) | data:image/png;base64,... (새 로고)
 *  → js/config.js, assets/logo.*, js/logo.js 를 고침
 * ========================================================= */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CFG = path.join(ROOT, 'js', 'config.js');
const LOGOJS = path.join(ROOT, 'js', 'logo.js');

let s = {};
try { s = JSON.parse(process.env.SETTINGS || '{}'); } catch (e) { console.error('설정 값을 읽지 못했습니다.'); process.exit(1); }
const clean = (v, max = 60) => String(v ?? '').normalize('NFC').replace(/[\\'"`<>\r\n\t]/g, '').trim().slice(0, max);
const has = k => Object.prototype.hasOwnProperty.call(s, k);

let cfg = fs.readFileSync(CFG, 'utf8');
const set = (key, valueJs) => {
  const re = new RegExp(`^(\\s*${key}:\\s*)(\\[[^\\]]*\\]|'[^']*')(,?)`, 'm');
  if (!re.test(cfg)) { console.warn(`config.js 에서 ${key} 를 찾지 못했습니다.`); return; }
  cfg = cfg.replace(re, (m, a, b, c) => `${a}${valueJs}${c}`);
};
const q = v => `'${v}'`;
const changed = [];

if (has('title') && clean(s.title)) { set('exhibitionTitle', q(clean(s.title, 80))); changed.push('전시 제목'); }
if (has('line1') || has('line2')) {
  const l1 = clean(s.line1, 40), l2 = clean(s.line2, 40);
  const arr = [l1, l2].filter(Boolean);
  if (arr.length) { set('exhibitionTitleLines', `[${arr.map(q).join(', ')}]`); changed.push('현수막 줄'); }
}
if (has('subtitle')) { set('exhibitionSubtitle', q(clean(s.subtitle, 80))); changed.push('부제'); }
if (has('school')) { set('schoolName', q(clean(s.school, 40))); changed.push('학교 이름'); }
if (has('period')) { set('exhibitionPeriod', q(clean(s.period, 40))); changed.push('전시 기간'); }
if (has('sheetId')) {
  const id = String(s.sheetId || '').trim();
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(id)) { console.error('시트 ID 형식이 올바르지 않습니다.'); process.exit(1); }
  set('sheetId', q(id)); changed.push('시트 ID');
}
if (has('sheetGid')) {
  const gid = String(s.sheetGid ?? '0').trim() || '0';
  if (!/^\d{1,12}$/.test(gid)) { console.error('탭 번호(gid)는 숫자여야 합니다.'); process.exit(1); }
  set('sheetGid', q(gid)); changed.push('탭 번호');
}

// 로고
const L = String(process.env.LOGO || '').trim();
const removeOld = () => { for (const f of ['logo.png', 'logo.jpg', 'logo.webp']) { const p = path.join(ROOT, 'assets', f); if (fs.existsSync(p)) fs.unlinkSync(p); } };
const logoJs = data => `/* 학교 로고를 글자로 바꾼 것 (파일로 직접 열 때만 사용). 서버에서는 assets/logo.* 를 씁니다. */\nwindow.LOGO_DATA = ${data ? JSON.stringify(data) : "''"};\n`;
if (L === 'remove') {
  removeOld(); set('logo', "''"); fs.writeFileSync(LOGOJS, logoJs('')); changed.push('로고 지움');
} else if (L) {
  const m = L.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!m) { console.error('로고 그림 형식이 올바르지 않습니다 (PNG·JPG·WEBP).'); process.exit(1); }
  const ext = m[1] === 'jpeg' ? 'jpg' : m[1], buf = Buffer.from(m[2], 'base64');
  if (buf.length > 200 * 1024) { console.error('로고 그림이 너무 큽니다.'); process.exit(1); }
  removeOld(); fs.writeFileSync(path.join(ROOT, 'assets', `logo.${ext}`), buf);
  set('logo', q(`assets/logo.${ext}`)); fs.writeFileSync(LOGOJS, logoJs(L)); changed.push('로고');
}

fs.writeFileSync(CFG, cfg);
console.log('바꾼 항목:', changed.join(', ') || '없음');
