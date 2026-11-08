/* =========================================================
 * 감상평 비속어 목록 고치기 (GitHub Actions 에서 실행)
 *  환경 변수 ADD_WORDS / ADD_ALLOW / REMOVE  (쉼표·줄바꿈으로 구분)
 *  → js/badwords-custom.js 를 고침
 * ========================================================= */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'js', 'badwords-custom.js');

const split = s => String(s || '').split(/[,\n\r]+/)
  .map(w => w.normalize('NFC').replace(/["'`\\<>]/g, '').replace(/\s+/g, '').toLowerCase().trim())
  .filter(w => w && w.length <= 30);

let cur = { words: [], allow: [] };
if (fs.existsSync(FILE)) {
  const m = fs.readFileSync(FILE, 'utf8').match(/BADWORDS_CUSTOM\s*=\s*(\{[\s\S]*\});/);
  if (m) try { cur = { words: [], allow: [], ...JSON.parse(m[1]) }; } catch (e) { }
}
const add = split(process.env.ADD_WORDS), allow = split(process.env.ADD_ALLOW), remove = new Set(split(process.env.REMOVE));
const words = [...new Set([...cur.words, ...add])].filter(w => !remove.has(w)).sort().slice(0, 1000);
const allows = [...new Set([...cur.allow, ...allow])].filter(w => !remove.has(w)).sort().slice(0, 1000);

const out = `/* F9 → 데이터 관리 → "감상평 비속어 관리"에서 고친 목록입니다. (GitHub 이 자동으로 만듭니다) */\n` +
  `window.BADWORDS_CUSTOM = ${JSON.stringify({ words, allow: allows }, null, 1)};\n`;
fs.writeFileSync(FILE, out);
console.log(`추가 비속어 ${words.length}개 · 정상 단어(예외) ${allows.length}개`);
console.log('추가:', add.join(', ') || '-', '| 예외 추가:', allow.join(', ') || '-', '| 삭제:', [...remove].join(', ') || '-');
