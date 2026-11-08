/* =========================================================
 * 데이터: 구글 시트 → 학생/작품/학급 구조
 * ========================================================= */
(function () {
  const C = window.ART_CONFIG;
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 저장 불가 환경 */ } }
  };

  function driveToImage(url) {
    if (!url) return '';
    url = String(url).trim().split(/[\s,]+/)[0];
    const m = url.match(/[?&]id=([a-zA-Z0-9_-]+)/) || url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/\/d\/([a-zA-Z0-9_-]{20,})/);
    if (m && /google/.test(url)) return 'https://lh3.googleusercontent.com/d/' + m[1];
    return url;
  }

  function parseClass(id) {
    const s = String(id || '').replace(/\D/g, '');
    if (s.length === 4 || s.length === 5) {
      const grade = parseInt(s[0], 10);
      const cls = s.length === 5 ? parseInt(s.substring(1, 3), 10) : parseInt(s[1], 10);
      if (grade > 0 && cls > 0) return { key: `${grade}-${String(cls).padStart(2, '0')}`, label: `${grade}학년 ${cls}반`, grade, cls };
    }
    return { key: '9-99', label: '특별 전시실', grade: 9, cls: 99 };
  }

  // 따옴표·줄바꿈을 모두 처리하는 CSV/TSV 파서
  function parseDelimited(text) {
    const delim = (text.split('\n')[0].match(/\t/g) || []).length > (text.split('\n')[0].match(/,/g) || []).length ? '\t' : ',';
    const rows = []; let row = []; let cur = ''; let q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) {
        if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
        else cur += ch;
      } else if (ch === '"') q = true;
      else if (ch === delim) { row.push(cur); cur = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(cur); rows.push(row); row = []; cur = '';
      } else cur += ch;
    }
    if (cur.length || row.length) { row.push(cur); rows.push(row); }
    return rows.map(r => r.map(c => c.trim())).filter(r => r.some(c => c));
  }

  function rowsToStudents(rows) {
    const students = new Map();
    const start = rows.length && /학번|타임|time/i.test(rows[0].join(' ')) ? 1 : 0;
    for (let i = start; i < rows.length; i++) {
      const c = rows[i];
      if (c.length < 3) continue;
      const sid = (c[1] || '').trim(), name = (c[2] || '').trim();
      if (!sid && !name) continue;
      const items = [];
      for (let s = 0; s < 10; s++) {
        const b = 3 + s * 3;
        if (b >= c.length) break;
        const title = c[b] || '', desc = c[b + 1] || '', img = driveToImage(c[b + 2] || '');
        if (title || img) items.push({ title, desc, img, slot: s + 1 });
      }
      if (!items.length) continue;
      // 같은 학번이 여러 번 제출하면 마지막 제출을 사용
      students.set(sid + '|' + name, { sid, name, time: c[0], items });
    }
    return [...students.values()];
  }

  function buildExhibition(students) {
    const classes = new Map();
    const artworks = [];
    students.sort((a, b) => a.sid.localeCompare(b.sid, 'ko', { numeric: true }));
    students.forEach(st => {
      const cl = parseClass(st.sid);
      if (!classes.has(cl.key)) classes.set(cl.key, { ...cl, students: [], artworks: [] });
      const room = classes.get(cl.key);
      const stu = { sid: st.sid, name: st.name, artworks: [] };
      st.items.forEach(it => {
        const id = `${st.sid || 'x'}_${st.name}_${it.slot}`;
        const art = {
          id, sid: st.sid, name: st.name, classKey: cl.key, classLabel: cl.label,
          title: it.title || `무제 ${it.slot}`, desc: it.desc || '', img: it.img,
          fileId: (String(it.img).match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/) || [])[1] || null,
          likes: parseInt(LS.get('likes_' + id, '0'), 10) || 0,
          liked: LS.get('liked_' + id, '') === '1',
          comments: JSON.parse(LS.get('comments_' + id, '[]'))
        };
        stu.artworks.push(art); room.artworks.push(art); artworks.push(art);
      });
      room.students.push(stu);
    });
    const rooms = [...classes.values()].sort((a, b) => a.key.localeCompare(b.key));
    return { rooms, artworks, studentCount: students.length };
  }

  // 예시 작품 (시트가 아직 연결되지 않았을 때 보이는 것 · 사이트 안의 그림만 사용)
  const SAMPLE = [
    { sid: '3101', name: '예시 학생', time: '', items: [
      { title: '봄의 교정', desc: '예시 작품입니다. 사이트 설정에서 구글 시트를 연결하면 학생 작품으로 바뀝니다.', img: 'assets/thumbs/seoul-960.jpg', slot: 1 },
      { title: '바다 위의 노을', desc: '예시 작품입니다.', img: 'assets/thumbs/busan-960.jpg', slot: 2 },
      { title: '물의 정원', desc: '예시 작품입니다.', img: 'assets/thumbs/jeju-960.jpg', slot: 3 }
    ] },
    { sid: '3201', name: '예시 친구', time: '', items: [
      { title: '붉은 벽돌 창고', desc: '예시 작품입니다.', img: 'assets/thumbs/incheon-960.jpg', slot: 1 },
      { title: '가을 숲', desc: '예시 작품입니다.', img: 'assets/thumbs/jeonbuk-960.jpg', slot: 2 }
    ] }
  ];

  async function fetchSheet(sheetId, gid) {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}&_=${Date.now()}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    if (/^\s*</.test(text)) throw new Error('시트가 공개되어 있지 않습니다');
    return text;
  }

  // 작품 사진 주소: 사이트에 내려받아 둔 축소본(assets/art) → 없으면 구글 서버 축소본 → 원본
  //  size: 'S' 긴 쪽 512px, 'L' 1280px, 'XL' 크게 보기
  function imgChain(art, size) {
    if (!art || !art.img) return [];
    const out = [], local = window.ART_LOCAL && art.fileId && window.ART_LOCAL[art.fileId];
    if (local) out.push(`assets/art/${art.fileId}-${size === 'S' ? 'S' : 'L'}.webp`);
    if (/googleusercontent\.com\/d\//.test(art.img)) out.push(art.img + '=' + ({ S: 's512', L: 's1280', XL: 's2400' }[size] || 's1280'));
    out.push(art.img);
    return out;
  }

  window.ArtData = {
    imgChain, imgSrc: (art, size) => imgChain(art, size)[0] || '',
    LS, driveToImage, parseClass, parseDelimited, rowsToStudents, buildExhibition, fetchSheet,
    sampleStudents: () => JSON.parse(JSON.stringify(SAMPLE)),
    settings() {
      return {
        sheetId: LS.get('sheet_id', C.sheetId), sheetGid: LS.get('sheet_gid', C.sheetGid),
        webhook: LS.get('comment_webhook_url', C.commentWebhookUrl)
      };
    },
    cacheCsv(text) { LS.set('cached_csv', text); },
    cachedCsv() { return LS.get('cached_csv', ''); }
  };
})();
