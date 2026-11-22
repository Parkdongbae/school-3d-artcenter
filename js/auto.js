/* =========================================================
 * 자동 관람: 미술관으로 걸어 들어가, 작품을 무작위로 골라 하나씩 둘러봅니다.
 *  - 오른쪽 위 ▶ 버튼으로 켜고 끕니다. 직접 움직이면(키보드·마우스·조이스틱) 바로 꺼집니다.
 *  - 주소에 auto=1 을 붙이면 미술관에 들어갈 때 자동으로 시작합니다. (복도 TV·전자 칠판에 틀어 둘 때)
 *    예) …/?s=시트ID&t=제목&auto=1#seoul
 * ========================================================= */
(function () {
  const $ = s => document.querySelector(s);
  const VIEW_SEC = 7, WALK_SPEED = 2.4;
  const A = { app: null, on: false, state: 'idle', timer: 0, seen: [], wait: 0 };

  function roomKeyAt(w, p) {
    for (const R of w.L.rooms) if (R.rect && p.x > R.rect.x0 && p.x < R.rect.x1 && p.z > R.rect.z0 && p.z < R.rect.z1) return R.room.key;
    return '';
  }
  function caption(html) { const el = $('#autoText'); if (el) el.innerHTML = html; }
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function pickArt() {
    const all = A.app.ex.artworks.filter(a => a.slot);
    if (!all.length) return null;
    let pool = all.filter(a => !A.seen.includes(a.id));
    if (!pool.length) { A.seen = A.seen.slice(-1); pool = all.filter(a => !A.seen.includes(a.id)); if (!pool.length) pool = all; } // 다 봤으면 처음부터 다시
    const art = pool[Math.floor(Math.random() * pool.length)];
    A.seen.push(art.id); return art;
  }
  // 작품 앞까지 걸어가서 바라보기
  function walkTo(art) {
    const app = A.app, s = art.slot, P = app.player; if (!s || !app.world) return next();
    const dist = Math.max(2.2, s.h * 1.5 + 0.9);
    const to = new THREE.Vector3(s.x + s.nx * dist, 0, s.z + s.nz * dist);
    const d = to.distanceTo(P.pos);
    A.state = 'walk'; app.moveTarget = null;
    caption(`다음 작품으로 가는 중… <b>${esc(art.title)}</b>`);
    app.glide = {
      from: P.pos.clone(), to, y0: P.yaw, y1: Math.atan2(s.nx, s.nz), p0: P.pitch, p1: 0, t: 0, dur: Math.min(7, Math.max(1.4, d / WALK_SPEED)),
      done: () => { if (!A.on) return; A.state = 'view'; A.timer = VIEW_SEC; caption(`<b>${esc(art.title)}</b> — ${esc(art.name)} <span>${esc(art.classLabel)}</span>`); }
    };
  }
  function next() {
    const app = A.app, w = app.world; if (!A.on || !w) return;
    const art = pickArt();
    if (!art) { stop(); app.toast('아직 전시된 작품이 없습니다.'); return; }
    if (roomKeyAt(w, app.player.pos) === art.classKey) return walkTo(art);
    // 다른 전시실: 그 전시실 입구로 옮겨 간 뒤 걸어감
    const anchor = w.anchors.find(a => a.room && a.key === art.classKey);
    if (!anchor) return walkTo(art);
    A.state = 'move'; A.wait = 0.75; A.pending = art;
    caption(`<b>${esc(art.classLabel)}</b> 전시실로 가는 중…`);
    app.teleport(anchor.pos, anchor.yaw);
  }
  function start() {
    const app = A.app; if (!app.world || A.on) return;
    if (!app.ex.artworks.some(a => a.slot)) { app.toast('아직 전시된 작품이 없습니다.'); return; }
    A.on = true; A.seen = []; document.body.classList.add('auto-on');
    app.closeAll();
    if (app.player.pos.z > 0.3) { A.state = 'enter'; A.timer = 25; caption('미술관으로 걸어 들어가는 중…'); app.glide = null; app.goEntrance(); }
    else next();
  }
  function stop(quiet) {
    if (!A.on) return;
    A.on = false; A.state = 'idle'; A.pending = null; document.body.classList.remove('auto-on');
    const app = A.app; if (app.glide && app.glide.done) app.glide = null; app.moveTarget = null;
    if (!quiet) app.toast('자동 관람을 멈췄습니다.');
  }

  window.AutoTour = {
    get on() { return A.on; },
    start, stop, toggle() { A.on ? stop() : start(); },
    init(app) {
      A.app = app;
      $('#autoBtn').onclick = () => this.toggle();
      $('#autoStop').onclick = () => stop();
      // 직접 움직이면 자동 관람을 끔
      addEventListener('keydown', e => { if (A.on && /^Key[WASDQE]$|^Arrow/.test(e.code) && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) stop(); });
      app.renderer.domElement.addEventListener('pointerdown', () => stop());
      ['#joy', '#minimap'].forEach(s => { const el = $(s); if (el) el.addEventListener('pointerdown', () => stop(), true); });
      $('#roomSelect').addEventListener('change', () => stop());
      this.wanted = /[?&]auto=1\b/.test(location.search);
    },
    // 미술관에 들어왔을 때: 주소에 auto=1 이 있으면 바로 시작
    enter() { if (this.wanted && !A.on) setTimeout(() => { if (A.app.world && !document.body.classList.contains('modal-open')) start(); }, 1500); },
    update(dt) {
      if (!A.on) return;
      const app = A.app, P = app.player;
      if (document.body.classList.contains('modal-open')) return; // 창이 열려 있는 동안은 잠시 멈춤
      if (A.state === 'enter') {
        A.timer -= dt;
        if (!app.moveTarget) { if (P.pos.z < -1) next(); else if (A.timer < 23) { const lobby = app.world.anchors.find(a => a.key === 'lobby'); if (lobby) P.pos.set(lobby.pos.x, 0, lobby.pos.z); next(); } }
        else if (A.timer <= 0) { app.moveTarget = null; }
      } else if (A.state === 'move') {
        A.wait -= dt; if (A.wait <= 0) { const art = A.pending; A.pending = null; art ? walkTo(art) : next(); }
      } else if (A.state === 'walk') {
        if (!app.glide) next(); // 걷다가 끊겼으면 다음 작품으로
      } else if (A.state === 'view') {
        A.timer -= dt; P.yaw += Math.sin(A.timer * 0.9) * dt * 0.02; // 살짝 둘러보는 느낌
        if (A.timer <= 0) next();
      }
    }
  };
})();
