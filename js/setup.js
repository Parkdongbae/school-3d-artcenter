/* =========================================================
 * Setup: 사이트 설정 화면 (처음 설정 마법사 / F9 → 사이트 설정)
 *  - 구글 시트 주소를 통째로 붙여넣으면 ID·탭 번호를 찾아 연결을 확인
 *  - 전시 제목·학교·기간·로고를 입력하고 미리 보기
 *  - 저장하면 서버 기능 → GitHub 작업이 js/config.js 를 고쳐 다시 배포
 * ========================================================= */
(function () {
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const C = window.ART_CONFIG, D = window.ArtData, LS = D.LS;
  const DRAFT = 'setup_draft';

  const needsSetup = () => !C.sheetId || /여기에|SHEET_ID/i.test(C.sheetId);

  function parseSheetUrl(u) {
    u = String(u || '').trim();
    if (/forms\.gle|docs\.google\.com\/forms/.test(u)) return { error: '설문지 주소가 아니라, 응답이 쌓이는 "구글 시트" 주소를 넣어 주세요. (설문지 → 응답 → 시트 아이콘으로 연 화면의 주소)' };
    const id = (u.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]{20,})/) || [])[1] || (/^[a-zA-Z0-9_-]{30,}$/.test(u) ? u : '');
    if (!id) return { error: '구글 시트 주소를 찾지 못했습니다. 주소창의 주소 전체(https://docs.google.com/spreadsheets/d/…)를 붙여넣어 주세요.' };
    const gid = (u.match(/[#?&]gid=(\d+)/) || [])[1] || '0';
    return { id, gid };
  }

  const S = { logo: '', logoChanged: false, info: null, sheetOk: false };

  function draft() {
    return {
      sheetUrl: $('#suSheet').value.trim(), line1: $('#suLine1').value.trim(), line2: $('#suLine2').value.trim(),
      subtitle: $('#suSub').value.trim(), school: $('#suSchool').value.trim(), period: $('#suPeriod').value.trim(),
      logo: S.logoChanged ? S.logo : undefined
    };
  }
  function saveDraft() { try { const d = draft(); delete d.logo; localStorage.setItem(DRAFT, JSON.stringify(d)); } catch (e) { } }

  function fill() {
    let d = {}; try { d = JSON.parse(localStorage.getItem(DRAFT) || '{}'); } catch (e) { }
    const lines = C.exhibitionTitleLines || [C.exhibitionTitle];
    $('#suSheet').value = d.sheetUrl ?? (needsSetup() ? '' : `https://docs.google.com/spreadsheets/d/${C.sheetId}/edit#gid=${C.sheetGid || 0}`);
    $('#suLine1').value = d.line1 ?? lines[0] ?? '';
    $('#suLine2').value = d.line2 ?? lines[1] ?? '';
    $('#suSub').value = d.subtitle ?? C.exhibitionSubtitle ?? '';
    $('#suSchool').value = d.school ?? C.schoolName ?? '';
    $('#suPeriod').value = d.period ?? C.exhibitionPeriod ?? '';
    try { $('#suPass').value = sessionStorage.getItem('upd_pass') || ''; } catch (e) { }
    S.logo = ''; S.logoChanged = false; $('#suNoLogo').checked = !C.logo;
    $('#suLogoPrev').innerHTML = C.logo ? `<img src="${esc(C.logo)}" alt="">` : '<span>로고 없음</span>';
    $('#suSheetMsg').textContent = ''; $('#suSaveMsg').textContent = '';
    preview();
  }

  // 현수막 미리 보기 (3D 미술관에 걸리는 것과 같은 그림)
  let pvTimer = 0;
  function preview() {
    clearTimeout(pvTimer);
    pvTimer = setTimeout(() => {
      const bak = { t: C.exhibitionTitle, l: C.exhibitionTitleLines, s: C.exhibitionSubtitle, n: C.schoolName, p: C.exhibitionPeriod, img: window.LOGO_IMG };
      const d = draft();
      C.exhibitionTitleLines = [d.line1, d.line2].filter(Boolean); if (!C.exhibitionTitleLines.length) C.exhibitionTitleLines = ['전시 제목'];
      C.exhibitionTitle = C.exhibitionTitleLines.join(' '); C.exhibitionSubtitle = d.subtitle; C.schoolName = d.school; C.exhibitionPeriod = d.period;
      const show = img => {
        window.LOGO_IMG = img;
        const t = Tex.poster({ w: 1024, h: 560, bg: (window.app && app.museum && app.museum.accent) || '#c8643c', titleScale: 0.13, logoScale: 0.14 });
        $('#suPoster').src = t.image.toDataURL('image/png'); t.dispose();
        Object.assign(C, { exhibitionTitle: bak.t, exhibitionTitleLines: bak.l, exhibitionSubtitle: bak.s, schoolName: bak.n, exhibitionPeriod: bak.p }); window.LOGO_IMG = bak.img;
      };
      if ($('#suNoLogo').checked) show(null);
      else if (S.logoChanged && S.logo) { const im = new Image(); im.onload = () => show(im); im.src = S.logo; }
      else show(bak.img);
    }, 150);
  }

  // 로고: 작게 줄여서 글자 데이터로 (GitHub 작업에 실어 보낼 수 있는 크기)
  function readLogo(file) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => {
        const im = new Image();
        im.onload = () => {
          let maxW = 600, maxH = 220, out = '';
          for (let tries = 0; tries < 6; tries++) {
            const k = Math.min(1, maxW / im.width, maxH / im.height), c = document.createElement('canvas');
            c.width = Math.max(1, Math.round(im.width * k)); c.height = Math.max(1, Math.round(im.height * k));
            c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
            out = c.toDataURL('image/png');
            if (out.length > 55000) out = c.toDataURL('image/webp', 0.9);
            if (out.length <= 55000 && out.startsWith('data:image/')) break;
            maxW *= 0.8; maxH *= 0.8;
          }
          out.length <= 58000 ? res(out) : rej(new Error('그림이 너무 복잡해 줄이지 못했습니다. 더 단순한 로고를 골라 주세요.'));
        };
        im.onerror = () => rej(new Error('그림 파일을 읽지 못했습니다.'));
        im.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }

  async function checkSheet() {
    const m = $('#suSheetMsg'), p = parseSheetUrl($('#suSheet').value);
    S.sheetOk = false;
    if (p.error) { m.className = 'upd-msg err'; m.textContent = p.error; return null; }
    m.className = 'upd-msg busy'; m.textContent = '시트를 읽는 중…';
    try {
      const text = await D.fetchSheet(p.id, p.gid);
      const st = D.rowsToStudents(D.parseDelimited(text));
      const arts = st.reduce((a, s) => a + s.items.length, 0);
      m.className = 'upd-msg ok';
      m.innerHTML = st.length ? `✅ 연결되었습니다! 학생 <b>${st.length}명</b>, 작품 <b>${arts}점</b>을 읽었습니다.` : '✅ 연결되었습니다. 아직 응답이 없어요 (설문지에서 시험 제출을 해 보세요).';
      S.sheetOk = true; saveDraft(); return p;
    } catch (e) {
      m.className = 'upd-msg err';
      m.innerHTML = '시트를 읽지 못했습니다. 시트 오른쪽 위 <b>공유 → 일반 액세스 → "링크가 있는 모든 사용자"(뷰어)</b>로 바꿨는지 확인해 주세요.';
      return null;
    }
  }

  async function api(payload) {
    const r = await fetch('/api/update-images', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (r.status === 404) throw new Error('NOAPI');
    const t = await r.text(); let j = {}; try { j = JSON.parse(t); } catch (e) { }
    if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
    return j;
  }

  // 저장 준비 상태 (관리자 비밀번호·접근 키가 Vercel 에 들어 있는지)
  async function loadInfo() {
    const box = $('#suReady');
    if (location.protocol === 'file:') { box.innerHTML = '<div class="box warn small">파일로 직접 연 화면에서는 저장할 수 없습니다. Vercel에 배포된 사이트 주소에서 열어 주세요.</div>'; return; }
    try { S.info = await api({ action: 'info' }); }
    catch (e) { box.innerHTML = '<div class="box warn small">서버 기능을 찾지 못했습니다. Vercel에 배포된 사이트 주소에서 열어 주세요.</div>'; S.info = null; return; }
    const i = S.info, need = [];
    if (!i.hasPassword) need.push('pw');
    if (!i.hasToken) need.push('token');
    if (!need.length) { box.innerHTML = '<div class="box tip small">✅ 저장할 준비가 되었습니다. 관리자 비밀번호를 넣고 저장하세요.</div>'; return; }
    // Vercel 화면 바로 가기 (팀·프로젝트 이름을 알면 그 화면으로, 모르면 프로젝트 고르는 화면으로)
    const vBase = i.vercelTeam && i.vercelProject ? `https://vercel.com/${encodeURIComponent(i.vercelTeam)}/${encodeURIComponent(i.vercelProject)}` : '';
    const vPick = 'https://vercel.com/d?to=%2F%5Bteam%5D%2F%5Bproject%5D%2Fsettings%2Fenvironment-variables&title=Environment+Variables';
    const vEnv = vBase ? vBase + '/settings/environment-variables' : vPick;
    const vDep = vBase ? vBase + '/deployments' : 'https://vercel.com/d?to=%2F%5Bteam%5D%2F%5Bproject%5D%2Fdeployments&title=Deployments';
    const tokenUrl = 'https://github.com/settings/personal-access-tokens/new?' + new URLSearchParams({ name: ('3D 전시관 관리 (' + i.repo + ')').slice(0, 40), description: '3D 학생 작품 전시관의 사이트 설정·사진 업데이트 버튼용', target_name: i.owner, expires_in: '366', actions: 'write', contents: 'write', workflows: 'write' }).toString();
    box.innerHTML = `<div class="box warn small su-guide">
      <div class="bt">🔑 저장하려면 한 번만 준비가 필요해요 (약 5분)</div>
      ${need.includes('pw') ? `<p>Vercel에 <b>ADMIN_PASSWORD</b>(관리자 비밀번호)가 없습니다. <a href="${vEnv}" target="_blank" rel="noopener">환경 변수 화면</a>에서 Add Environment Variable → Key <b>ADMIN_PASSWORD</b>로 함께 넣어 주세요.</p>` : ''}
      ${need.includes('token') ? `<ol>
        <li><a class="btnlike g" href="${tokenUrl}" target="_blank" rel="noopener">① GitHub 접근 키 만들기 (새 창)</a><br>
          이름·기간·권한(Actions · Contents · Workflows 쓰기)은 미리 채워져 있어요. <b>Repository access → Only select repositories → <code>${esc(i.repo)}</code></b>를 고르고 맨 아래 <b>Generate token</b> → 나온 키(github_pat_…)를 <b>복사</b>하세요.</li>
        <li><a class="btnlike k" href="${vEnv}" target="_blank" rel="noopener">② Vercel 환경 변수 화면 열기 (새 창)</a><br>
          ⓐ 오른쪽 위 <b>Add Environment Variable</b> 버튼 클릭 → ⓑ Key에 <b>GITHUB_TOKEN</b> → ⓒ Value에 복사한 키 붙여넣기 → ⓓ <b>Save</b>
          <div class="muted small">화면이 안 열리면: <a href="${vPick}" target="_blank" rel="noopener">여기</a>를 눌러 내 프로젝트를 고르거나, Vercel → 이 프로젝트 → 위쪽 <b>Settings</b> 탭 → <b>Environment Variables</b>로 들어가세요.</div></li>
        <li><a class="btnlike k" href="${vDep}" target="_blank" rel="noopener">③ Vercel 배포 화면 열기 (새 창)</a><br>
          맨 위 배포 줄 오른쪽 <b>⋯</b> → <b>Redeploy</b> → 다시 <b>Redeploy</b>를 누르고 1분 기다립니다.</li>
        <li>이 화면으로 돌아와 <button class="ghost" id="suRecheck">다시 확인</button>을 누르세요. 입력한 내용은 그대로 남아 있어요.</li></ol>` : ''}
    </div>`;
    const rc = $('#suRecheck'); if (rc) rc.onclick = () => loadInfo();
  }

  async function save() {
    const msg = $('#suSaveMsg'), say = (t, c = '') => { msg.className = 'upd-msg ' + c; msg.innerHTML = t; };
    const p = await checkSheet(); if (!p) { say('먼저 ① 구글 시트 연결을 확인해 주세요.', 'err'); return; }
    const d = draft();
    if (!d.line1) { say('② 전시 제목(첫째 줄)을 입력해 주세요.', 'err'); return; }
    const pass = $('#suPass').value.trim(); if (!pass) { say('관리자 비밀번호를 입력해 주세요.', 'err'); return; }
    try { sessionStorage.setItem('upd_pass', pass); } catch (e) { }
    const config = { title: [d.line1, d.line2].filter(Boolean).join(' '), line1: d.line1, line2: d.line2, subtitle: d.subtitle, school: d.school, period: d.period, sheetId: p.id, sheetGid: p.gid };
    const logo = $('#suNoLogo').checked ? (C.logo ? 'remove' : '') : (S.logoChanged ? S.logo : '');
    $('#suSave').disabled = true; clearTimeout(S.timer);
    try {
      say('저장을 요청하는 중…');
      const started = Date.now(); await api({ password: pass, action: 'config', config, logo });
      const poll = async () => {
        try {
          const j = await api({ password: pass, action: 'status', job: 'config' }), run = j.run;
          const fresh = run && new Date(run.createdAt).getTime() > started - 60000;
          if (!fresh || run.status !== 'completed') { say('GitHub이 설정을 저장하는 중… (1분 정도)', 'busy'); if (Date.now() - started < 10 * 60000) S.timer = setTimeout(poll, 5000); else $('#suSave').disabled = false; return; }
          $('#suSave').disabled = false;
          if (run.conclusion === 'success') {
            try { localStorage.removeItem(DRAFT); } catch (e) { }
            say(`🎉 저장했습니다! 사이트가 새로 배포되는 1~2분 뒤에 <button class="ghost" onclick="location.reload()">새로고침</button> 하면 우리 학교 전시관으로 바뀝니다. <a href="${run.url}" target="_blank" rel="noopener">GitHub 기록</a>`, 'ok');
          } else say(`저장에 실패했습니다. <a href="${run.url}" target="_blank" rel="noopener">GitHub 기록 보기</a>`, 'err');
        } catch (e) { $('#suSave').disabled = false; say(e.message, 'err'); }
      };
      S.timer = setTimeout(poll, 4000);
    } catch (e) {
      $('#suSave').disabled = false;
      if (e.message === 'NOAPI') say('서버 기능을 찾지 못했습니다. Vercel에 배포된 사이트 주소에서 열어 주세요.', 'err');
      else { say(e.message, 'err'); if (/환경 변수|접근 키/.test(e.message)) loadInfo(); }
    }
  }

  // 저장하지 않고 이 기기에서만 먼저 보기
  async function tryHere() {
    const p = await checkSheet(); if (!p) return;
    const d = draft();
    C.exhibitionTitleLines = [d.line1, d.line2].filter(Boolean); C.exhibitionTitle = C.exhibitionTitleLines.join(' ');
    C.exhibitionSubtitle = d.subtitle; C.schoolName = d.school; C.exhibitionPeriod = d.period; C.sheetId = p.id; C.sheetGid = p.gid;
    if ($('#suNoLogo').checked) { C.logo = ''; window.LOGO_IMG = null; }
    else if (S.logoChanged) { C.logo = S.logo; const im = new Image(); im.src = S.logo; window.LOGO_IMG = im; }
    LS.set('sheet_id', p.id); LS.set('sheet_gid', p.gid);
    app.closeModal('setupModal'); app.lastCsv = ''; await app.sync(false);
    if (app.museum) app.rebuild(); else app.renderLanding();
    app.toast('이 기기에서만 미리 보는 중입니다. 모든 기기에 적용하려면 사이트 설정에서 저장하세요.', null, 7000);
  }

  function open() {
    fill(); app.openModal('setupModal'); loadInfo();
  }

  function init() {
    ['#suLine1', '#suLine2', '#suSub', '#suSchool', '#suPeriod'].forEach(s => $(s).addEventListener('input', () => { preview(); saveDraft(); }));
    $('#suSheet').addEventListener('change', () => { saveDraft(); checkSheet(); });
    $('#suCheck').onclick = () => checkSheet();
    $('#suNoLogo').onchange = () => preview();
    $('#suLogo').onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      try { S.logo = await readLogo(f); S.logoChanged = true; $('#suNoLogo').checked = false; $('#suLogoPrev').innerHTML = `<img src="${S.logo}" alt="">`; preview(); }
      catch (err) { app.toast(err.message); }
    };
    $('#suSave').onclick = () => save();
    $('#suTry').onclick = () => tryHere();
  }

  window.Setup = { open, init, needsSetup, parseSheetUrl };
})();
