/* =========================================================
 * 쉬운 방법: "전시관 주소" 하나로 여는 전시관
 *  - 주소 뒤에 붙은 값(?s=구글시트ID&t=제목…)을 읽어 전시 설정을 바꿉니다.
 *  - 가입·배포·접근 키 없이, 사이트 설정 화면에서 만든 주소만 학생에게 알려 주면 됩니다.
 *
 *   s   구글 시트 ID (필수)      gid 시트 탭 번호
 *   t   전시 제목 첫째 줄        t2  전시 제목 둘째 줄
 *   sub 부제                     n   학교 이름        p  전시 기간
 *   g   학교 로고 (구글 드라이브 파일 ID)
 *   h   감상평을 모을 Apps Script 웹 앱 주소
 *   m=0 함께 관람(아바타) 끄기   c=0 대화(채팅)만 끄기
 * ========================================================= */
(function () {
  const C = window.ART_CONFIG;
  const HOOK = /^https:\/\/script\.google\.com\/(macros|a\/macros\/[A-Za-z0-9.-]+)\/s\/[A-Za-z0-9_-]+\/exec$/;
  const ID = /^[a-zA-Z0-9_-]{20,80}$/;
  const clean = (v, n) => String(v || '').replace(/[<>\r\n]/g, '').trim().slice(0, n);

  // 구글 드라이브 주소(또는 파일 ID) → 파일 ID
  function driveId(u) {
    u = String(u || '').trim();
    if (ID.test(u)) return u;
    if (!/google\.com|googleusercontent\.com/.test(u)) return '';
    const m = u.match(/\/file\/d\/([a-zA-Z0-9_-]{20,})/) || u.match(/[?&]id=([a-zA-Z0-9_-]{20,})/) || u.match(/\/d\/([a-zA-Z0-9_-]{20,})/);
    return m ? m[1] : '';
  }
  const logoUrl = id => 'https://lh3.googleusercontent.com/d/' + id + '=s600';

  // 전시관 주소 만들기 (사이트 설정 화면에서 사용)
  function build(o) {
    const q = new URLSearchParams();
    q.set('s', o.sheetId);
    if (o.sheetGid && o.sheetGid !== '0') q.set('gid', o.sheetGid);
    if (o.line1) q.set('t', o.line1);
    if (o.line2) q.set('t2', o.line2);
    if (o.subtitle) q.set('sub', o.subtitle);
    if (o.school) q.set('n', o.school);
    if (o.period) q.set('p', o.period);
    if (o.logoId) q.set('g', o.logoId);
    if (o.hook) q.set('h', o.hook);
    if (o.multi === false) q.set('m', '0'); else if (o.chat === false) q.set('c', '0');
    return location.origin + location.pathname + '?' + q.toString();
  }

  const q = new URLSearchParams(location.search);
  const s = q.get('s') || '';
  const linkMode = ID.test(s);
  if (linkMode) {
    C.linkMode = true;
    C.sheetId = s;
    C.sheetGid = /^\d+$/.test(q.get('gid') || '') ? q.get('gid') : '0';
    const lines = [clean(q.get('t'), 30), clean(q.get('t2'), 30)].filter(Boolean);
    C.exhibitionTitleLines = lines.length ? lines : ['학생 작품 전시회'];
    C.exhibitionTitle = C.exhibitionTitleLines.join(' ');
    C.exhibitionSubtitle = clean(q.get('sub'), 60);
    C.schoolName = clean(q.get('n'), 30);
    C.exhibitionPeriod = clean(q.get('p'), 30);
    const g = driveId(q.get('g'));
    C.logo = g ? logoUrl(g) : '';
    C.logoId = g;
    const h = String(q.get('h') || '').trim();
    C.commentWebhookUrl = HOOK.test(h) ? h : '';
    C.autoSync = true;
    C.multiplayer = q.get('m') !== '0';
    C.chat = C.multiplayer && q.get('c') !== '0';
    // 한 사이트를 여러 학교가 함께 쓰므로, 좋아요·감상평 등은 학교(시트)별로 따로 저장
    C.storeKey = s.slice(0, 16);
  }
  // 서버 기능(Vercel)이 없는 곳: 주소로 연 전시관, GitHub Pages, 파일로 직접 연 화면
  C.noServer = linkMode || /\.github\.io$/.test(location.hostname) || location.protocol === 'file:';
  document.documentElement.classList.toggle('link-mode', linkMode);
  document.documentElement.classList.toggle('no-server', C.noServer);

  window.ArtLink = { build, driveId, logoUrl, HOOK, wantsMaker: q.has('make') };
})();
