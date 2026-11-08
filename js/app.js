/* =========================================================
 * App: 첫 화면, 3D 관람 조작, 작품 감상, 데이터 동기화
 * ========================================================= */
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const D = window.ArtData, C = window.ART_CONFIG, LS = D.LS;
  const EYE = 1.62, RADIUS = 0.35;

  /* ---------- 미술관 카드용 실루엣 ---------- */
  const SIL = {
    seoul: '<rect x="20" y="70" width="160" height="34" fill="#a85434"/><rect x="66" y="40" width="70" height="30" fill="#cfe3ea" opacity=".8" stroke="#333" stroke-width="1.5"/><path d="M68 40v30M86 40v30M104 40v30M122 40v30" stroke="#333" stroke-width="1"/><rect x="0" y="104" width="200" height="16" fill="#8aa56b"/><path d="M150 80l14-10 14 10z" fill="#3d3f44"/><rect x="152" y="80" width="24" height="14" fill="#efe6d2"/>',
    gwacheon: '<path d="M0 90 L40 55 L80 80 L120 50 L170 78 L200 60 V120 H0Z" fill="#7f9a8a" opacity=".55"/><rect x="20" y="78" width="160" height="28" fill="#b9ab95"/><rect x="70" y="50" width="60" height="56" rx="2" fill="#c2b49c"/><ellipse cx="100" cy="50" rx="30" ry="6" fill="#a99a82"/><path d="M78 60h6M90 60h6M102 60h6M114 60h6" stroke="#333" stroke-width="3"/>',
    cheongju: '<rect x="14" y="44" width="172" height="64" fill="#e9e8e3"/><g fill="#1f2a30" stroke="#e9e4da" stroke-width="1.5"><rect x="24" y="54" width="14" height="18"/><rect x="48" y="54" width="14" height="18"/><rect x="72" y="54" width="14" height="18"/><rect x="114" y="54" width="14" height="18"/><rect x="138" y="54" width="14" height="18"/><rect x="162" y="54" width="14" height="18"/><rect x="24" y="80" width="14" height="18"/><rect x="48" y="80" width="14" height="18"/><rect x="138" y="80" width="14" height="18"/><rect x="162" y="80" width="14" height="18"/></g><rect x="78" y="84" width="44" height="24" fill="#cfe0e6" opacity=".7" stroke="#2b2d30" stroke-width="2"/>',
    daegu: '<path d="M0 92 Q50 70 100 88 T200 80 V120 H0Z" fill="#8aa0a8" opacity=".5"/><rect x="0" y="80" width="200" height="26" fill="#6f6c68"/><rect x="0" y="94" width="200" height="12" fill="#26323a"/><rect x="76" y="44" width="48" height="36" fill="#e4e2dd"/><path d="M80 44v36M88 44v36M96 44v36M104 44v36M112 44v36M120 44v36" stroke="#fff" stroke-width="2"/><rect x="40" y="90" width="120" height="3" fill="#f1efea"/>',
    daejeon: '<rect x="20" y="52" width="160" height="56" fill="#f2f1ec"/><g stroke="#fff" stroke-width="3"><path d="M26 52v56M34 52v56M40 52v56M52 52v56M70 52v56M76 52v56M80 52v56M98 52v56M120 52v56M126 52v56M140 52v56M160 52v56M166 52v56M172 52v56"/></g><g fill="#141414"><circle cx="40" cy="104" r="2"/><rect x="38" y="106" width="4" height="10"/><circle cx="50" cy="102" r="2"/><rect x="48" y="104" width="4" height="12"/><circle cx="58" cy="105" r="2"/><rect x="56" y="107" width="4" height="9"/></g>',
    busan: '<rect x="18" y="46" width="164" height="62" fill="#3f7a32"/><g fill="#7fb04a" opacity=".7"><circle cx="40" cy="60" r="6"/><circle cx="80" cy="70" r="8"/><circle cx="130" cy="58" r="7"/><circle cx="160" cy="76" r="6"/><circle cx="60" cy="86" r="5"/></g><rect x="18" y="92" width="164" height="16" fill="#1d2a30"/><path d="M0 120 L10 96 M14 120 L22 98 M178 120 L186 96 M192 120 L198 100" stroke="#c9a36b" stroke-width="2"/>',
    san: '<path d="M0 80 L50 40 L90 70 L140 36 L200 70 V120 H0Z" fill="#6f8576" opacity=".55"/><rect x="40" y="62" width="120" height="34" fill="#d1c4ad"/><rect x="60" y="52" width="80" height="12" fill="#bdbab3"/><rect x="0" y="96" width="200" height="24" fill="#24363a"/><rect x="94" y="96" width="12" height="24" fill="#bfb7a8"/><rect x="40" y="96" width="120" height="10" fill="#d1c4ad" opacity=".35"/>',
    incheon: '<rect x="0" y="40" width="200" height="40" fill="#8aa3b8" opacity=".45"/><path d="M60 40h8v40h-8zM140 44h6v36h-6z" fill="#c8443a" opacity=".7"/><path d="M40 60L100 36L160 60V106H40Z" fill="#a85a40"/><path d="M14 74L38 62L62 74V106H14ZM138 74L162 62L186 74V106H138Z" fill="#9b4f37"/><g fill="#e8b53c"><rect x="56" y="84" width="12" height="22"/><rect x="132" y="84" width="12" height="22"/><rect x="30" y="88" width="10" height="18"/><rect x="160" y="88" width="10" height="18"/></g><circle cx="100" cy="54" r="5" fill="#2a2622"/>',
    jeonbuk: '<path d="M40 70 Q120 0 200 66 V120 H40Z" fill="#58704e" opacity=".75"/><rect x="0" y="92" width="70" height="28" fill="#35505a"/><rect x="50" y="64" width="130" height="40" fill="#ece9e2"/><rect x="50" y="92" width="130" height="12" fill="#cbbfae"/><rect x="50" y="64" width="40" height="40" fill="#b9cdd4" opacity=".85"/><circle cx="160" cy="104" r="8" fill="#d08a3c"/><circle cx="186" cy="100" r="10" fill="#c97a2e"/>',
    gwangju: '<ellipse cx="110" cy="86" rx="130" ry="40" fill="#6f8f4e"/><rect x="40" y="66" width="120" height="38" fill="#efe9df"/><rect x="40" y="76" width="120" height="5" fill="#24323a"/><rect x="40" y="88" width="120" height="5" fill="#24323a"/><rect x="74" y="52" width="52" height="14" fill="#c2d6dc" opacity=".9"/><path d="M0 70 Q40 60 70 40" stroke="#d9d4cb" stroke-width="5" fill="none"/><g fill="#e94f37"><rect x="150" y="96" width="8" height="8"/></g><rect x="150" y="88" width="8" height="8" fill="#f6c445"/><rect x="150" y="80" width="8" height="8" fill="#3f88c5"/>',
    gyeongnam: '<path d="M0 84 Q60 64 120 80 T200 76 V120 H0Z" fill="#7d9389" opacity=".5"/><rect x="20" y="62" width="160" height="44" fill="#d9cfc0"/><rect x="68" y="44" width="64" height="62" fill="#b9cdd4" opacity=".9"/><path d="M78 44v62M88 44v62M100 44v62M112 44v62M122 44v62M68 66h64M68 86h64" stroke="#2b2d30" stroke-width="1.2"/><rect x="64" y="42" width="72" height="4" fill="#3a3d40"/><circle cx="34" cy="108" r="4" fill="#7a5a34"/><circle cx="168" cy="108" r="4" fill="#c8643c"/>',
    jeju: '<path d="M10 70 Q100 10 190 70 Z" fill="#6d8c7c" opacity=".55"/><rect x="20" y="62" width="160" height="16" fill="#e2ded6"/><rect x="20" y="78" width="160" height="16" fill="#3a3936"/><rect x="0" y="94" width="200" height="26" fill="#1d3a48"/><rect x="20" y="94" width="160" height="12" fill="#e2ded6" opacity=".25"/><rect x="94" y="94" width="12" height="26" fill="#55534f"/>'
  };

  class App {
    constructor() {
      this.isMobile = matchMedia('(pointer: coarse)').matches || /Mobi|Android|iPad|iPhone/i.test(navigator.userAgent);
      const q = LS.get('quality', 'auto');
      this.quality = q === 'auto' ? (this.isMobile ? 'low' : 'high') : q;
      this.lowQuality = this.quality === 'low'; this.ultra = this.quality === 'ultra';
      try { if (sessionStorage.getItem('admin') === '1' || /[?&]admin\b/.test(location.search)) document.body.classList.add('admin'); } catch (e) { }
      this.keys = {}; this.player = { pos: new THREE.Vector3(), yaw: 0, pitch: 0, bob: 0 };
      this.inside = 0; this.world = null; this.ex = null; this.museum = null;
      this.moveTarget = null; this.glide = null; this.joy = { x: 0, y: 0 };
      this.raycaster = new THREE.Raycaster();
      this.lastCsv = '';
      this.logoReady = new Promise(res => {
        if (!C.logo) return res();
        const img = window.LOGO_IMG = new Image(); img.onload = img.onerror = () => res(); img.src = location.protocol === 'file:' ? (window.LOGO_DATA || C.logo) : C.logo; // 서버에서는 assets/logo.png 를 그대로 사용
        setTimeout(res, 2500);
      });
      document.title = C.exhibitionTitle + ' · 3D 전시관';
      this.music = new Music(); this.music.setMuted(LS.get('music_muted', '0') === '1');
      const wake = () => this.music.start();
      addEventListener('pointerdown', wake); addEventListener('keydown', wake); addEventListener('touchstart', wake);
      this.initRenderer(); this.initUI(); this.initControls(); this.loadData();
      this.clock = new THREE.Clock();
      this.loop();
    }

    /* ---------- 렌더러 ---------- */
    initRenderer() {
      const r = this.renderer = new THREE.WebGLRenderer({ antialias: this.quality === 'high', powerPreference: 'high-performance' });
      const dpr = window.devicePixelRatio || 1;
      let pr = this.lowQuality ? Math.min(dpr, 1.25) : this.ultra ? Math.min(Math.max(dpr, 1.5), 2.5) : Math.min(dpr, 2);
      if (this.ultra) { const max = 3840 * 2160; while (pr > 1 && innerWidth * innerHeight * pr * pr > max) pr -= 0.25; }
      r.setPixelRatio(pr);
      r.setSize(innerWidth, innerHeight);
      r.toneMapping = THREE.ACESFilmicToneMapping; r.outputColorSpace = THREE.SRGBColorSpace;
      r.shadowMap.enabled = !this.lowQuality; r.shadowMap.type = THREE.PCFSoftShadowMap;
      $('#stage').appendChild(r.domElement);
      this.camera = new THREE.PerspectiveCamera(this.isMobile ? 72 : 64, innerWidth / innerHeight, 0.05, 2000);
      this.camera.rotation.order = 'YXZ';
      if (this.ultra) this.post = new Post(r);
      addEventListener('resize', () => { r.setSize(innerWidth, innerHeight); if (this.post) this.post.setSize(innerWidth, innerHeight); this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix(); this.drawMinimapBase(); });
    }

    /* ---------- 데이터 ---------- */
    loadData() {
      const cached = D.cachedCsv();
      if (cached) this.applyCsv(cached, true); else this.applyStudents(D.sampleStudents());
      this.renderLanding();
      const first = this.sync(false);
      this.startAutoSync();
      // 주소창 #seoul 처럼 바로 입장
      const h = decodeURIComponent(location.hash.replace('#', ''));
      const m = MUSEUMS.find(x => x.id === h);
      if (m) Promise.race([first, new Promise(r => setTimeout(r, 3500))]).then(() => this.enter(m));
    }
    applyStudents(students) { this.ex = D.buildExhibition(students); }
    applyCsv(text, quiet) {
      const st = D.rowsToStudents(D.parseDelimited(text));
      if (!st.length) { if (!quiet) this.toast('읽을 수 있는 응답이 없습니다.'); return false; }
      this.applyStudents(st); this.lastCsv = text; return true;
    }
    /* 자동 확인: 정해진 간격마다, 탭이 보일 때만, 실패하면 간격을 늘려 쉬었다가 다시 */
    startAutoSync() {
      if (!C.autoSync) return;
      const base = Math.max(30, C.autoSyncSeconds || 120) * 1000;
      this.syncFails = 0; this.lastSyncAt = Date.now();
      const next = () => {
        clearTimeout(this.syncTimer);
        const wait = Math.min(base * Math.pow(2, this.syncFails), 30 * 60000); // 실패하면 2배, 4배… 최대 30분
        this.syncTimer = setTimeout(tick, wait);
      };
      const tick = async () => {
        if (document.hidden || LS.get('auto_sync', '1') !== '1') { this.syncDue = true; return next(); } // 숨은 탭은 건너뜀
        this.syncDue = false; this.lastSyncAt = Date.now();
        const ok = await this.sync(true);
        this.syncFails = ok ? 0 : Math.min(this.syncFails + 1, 5);
        next();
      };
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && this.syncDue && Date.now() - this.lastSyncAt > base) { clearTimeout(this.syncTimer); tick(); }
      });
      next();
    }
    async sync(background) {
      const s = D.settings();
      try {
        const text = await D.fetchSheet(s.sheetId, s.sheetGid);
        if (text === this.lastCsv) { if (!background) this.setSyncState('ok'); return true; }
        const before = this.ex ? this.ex.artworks.length : 0, sigBefore = this.sig(), oldEx = this.ex;
        if (!this.applyCsv(text, background)) return true;
        if (this.sig() === sigBefore) { this.ex = oldEx; D.cacheCsv(text); this.setSyncState('ok'); return true; }
        D.cacheCsv(text); this.setSyncState('ok');
        const diff = this.ex.artworks.length - before;
        if (this.world) {
          this.toast(diff > 0 ? `새 작품 ${diff}점이 도착했습니다.` : '전시 내용이 바뀌었습니다.', { label: '전시 갱신', fn: () => this.rebuild() }, 9000);
        } else this.renderLanding();
        return true;
      } catch (e) {
        this.setSyncState('fail');
        if (!background) console.warn('시트 동기화 실패:', e);
        return false;
      }
    }
    sig() { return this.ex ? this.ex.artworks.map(a => a.id + a.title + a.img + a.desc).join('|') : ''; }
    setSyncState(s) { const el = $('#syncDot'); if (el) { el.dataset.state = s; el.title = s === 'ok' ? '구글 시트와 연결됨' : '시트 연결 실패 — 마지막 저장본 표시 중'; } }

    /* ---------- 첫 화면 ---------- */
    renderLanding() {
      const ex = this.ex;
      $('#heroTitle').innerHTML = (C.exhibitionTitleLines || [C.exhibitionTitle]).map(esc).join('<br>');
      $('#setupBanner').hidden = !Setup.needsSetup();
      const hl = $('#heroLogo'); if (C.logo) { hl.src = C.logo; hl.hidden = false; } else hl.hidden = true;
      $('#heroSub').textContent = C.exhibitionSubtitle;
      $('#heroMeta').textContent = [C.schoolName, C.exhibitionPeriod].filter(Boolean).join(' · ');
      $('#heroStats').innerHTML = `<span><b>${ex.rooms.length}</b>개 전시실</span><span><b>${ex.studentCount}</b>명의 작가</span><span><b>${ex.artworks.length}</b>점의 작품</span>`;
      const grid = $('#museumGrid');
      grid.innerHTML = MUSEUMS.map((m, i) => `
        <button class="mcard" data-id="${m.id}" style="--accent:${m.accent};--top:${m.sky.top};--hor:${m.sky.horizon};animation-delay:${i * 60}ms">
          <div class="mcard-art"><svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMax slice">${SIL[m.id]}</svg><img src="assets/thumbs/${m.id}-960.jpg" srcset="assets/thumbs/${m.id}-960.jpg 960w, assets/thumbs/${m.id}.jpg 1920w" sizes="(max-width: 600px) 100vw, 400px" alt="${esc(m.name)} 가상 전시관 외관" loading="lazy" onerror="this.remove()"><span class="mcard-region">${m.region}</span><span class="mcard-time">${m.sky.time}</span></div>
          <div class="mcard-body">
            <h3>${esc(m.name)}</h3>
            <p class="mcard-city">${esc(m.city)} · ${m.year}${m.architect && m.architect !== '-' ? ' · ' + esc(m.architect) : ''}</p>
            <div class="mcard-tags">${m.keywords.map(k => `<span>${esc(k)}</span>`).join('')}</div>
            <span class="mcard-go">입장하기 →</span>
          </div>
        </button>`).join('');
      $$('.mcard', grid).forEach(b => b.onclick = () => this.enter(MUSEUMS.find(m => m.id === b.dataset.id)));
    }

    /* ---------- 미술관 입장 ---------- */
    async enter(museum, keepPose) {
      this.museum = museum;
      const ld = $('#loading');
      $('#loadName').textContent = museum.name;
      $('#loadRegion').textContent = museum.region + ' · ' + museum.city;
      $('#loadDesc').textContent = museum.desc;
      $('#loadBar').style.width = '8%';
      ld.style.setProperty('--accent', museum.accent);
      ld.style.setProperty('--bgimg', `url("${new URL(`assets/thumbs/${museum.id}.jpg`, location.href).href}")`);
      ld.classList.add('show');
      await this.logoReady;
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (this.world) { this.world.dispose(); this.world = null; }
      const w = new World(this, museum, this.ex);
      try { w.build(p => { $('#loadBar').style.width = (p * 100) + '%'; }); }
      catch (e) { console.error(e); this.toast('미술관을 짓는 중 오류가 났습니다: ' + e.message); }
      this.world = w;
      this.renderer.compile(w.scene, this.camera);
      if (keepPose) { /* 위치 유지 */ } else {
        this.player.pos.copy(w.spawn.pos); this.player.yaw = w.spawn.yaw; this.player.pitch = 0.02;
      }
      this.inside = this.player.pos.z < -1 ? 1 : 0; w.setInside(this.inside);
      $('#loadBar').style.width = '100%';
      $('#landing').classList.add('hide'); document.body.classList.add('in-museum');
      $('#hudName').textContent = museum.name; $('#hudRegion').textContent = museum.region;
      document.documentElement.style.setProperty('--accent', museum.accent);
      { const c = new THREE.Color(museum.accent); const lum = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; document.documentElement.style.setProperty('--accent-ink', lum > 0.35 ? '#141414' : '#ffffff'); }
      this.fillRoomSelect(); this.drawMinimapBase();
      history.replaceState(null, '', '#' + museum.id);
      setTimeout(() => ld.classList.remove('show'), 250);
      if (!keepPose) setTimeout(() => this.toast(this.isMobile ? '왼쪽 조이스틱으로 걷고, 화면을 끌어 둘러보세요.' : 'W A S D 로 걷고, 마우스를 끌어 둘러보세요. 작품을 누르면 크게 볼 수 있어요.', null, 6000), 900);
    }
    rebuild() { if (!this.museum) return; const pose = { p: this.player.pos.clone(), y: this.player.yaw, pi: this.player.pitch }; this.enter(this.museum, true).then(() => { this.player.pos.copy(pose.p); this.player.yaw = pose.y; this.player.pitch = pose.pi; }); }
    leave() {
      this.music.setTarget(0);
      if (this.world) { this.world.dispose(); this.world = null; }
      this.museum = null; history.replaceState(null, '', location.pathname);
      $('#landing').classList.remove('hide'); document.body.classList.remove('in-museum');
      this.renderLanding(); this.closeAll();
    }
    fillRoomSelect() {
      const sel = $('#roomSelect'), w = this.world;
      sel.innerHTML = w.anchors.map((a, i) => `<option value="${i}">${a.key === 'outside' ? '🌳 ' : a.key === 'lobby' ? '🏛 ' : '🖼 '}${esc(a.label)}${a.room ? ` (${a.room.artworks.length}점)` : ''}</option>`).join('');
      sel.value = '';
      sel.onchange = () => { const a = w.anchors[+sel.value]; if (a) this.teleport(a.pos, a.yaw); sel.blur(); };
    }
    teleport(pos, yaw, pitch = 0) {
      const f = $('#fade'); f.classList.add('on');
      setTimeout(() => { this.player.pos.set(pos.x, 0, pos.z); this.player.yaw = yaw; this.player.pitch = pitch; this.moveTarget = null; this.glide = null; f.classList.remove('on'); }, 280);
    }
    goEntrance() {
      // 입구까지 걸어가기 (문 앞 → 로비)
      this.moveTarget = { x: 0, z: 3, then: { x: 0, z: -7 } };
    }

    /* ---------- 조작 ---------- */
    initControls() {
      const cv = this.renderer.domElement;
      const typing = e => /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || document.body.classList.contains('modal-open');
      addEventListener('keydown', e => {
        if (e.key === 'F9') { e.preventDefault(); this.toggleAdmin(); return; }
        if (e.key === 'Escape') { this.closeAll(); return; }
        if (e.code === 'KeyM' && !typing(e)) { this.toggleMute(); return; }
        if (typing(e)) return;
        this.keys[e.code] = true;
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
        if (/^Key[WASD]$|^Arrow/.test(e.code)) { this.moveTarget = null; this.glide = null; }
      });
      addEventListener('keyup', e => { this.keys[e.code] = false; });
      addEventListener('blur', () => { this.keys = {}; });
      // 마우스/터치 끌어서 둘러보기 + 탭/클릭
      let drag = null;
      cv.addEventListener('pointerdown', e => {
        if (e.pointerType === 'touch' && e.clientX < innerWidth * 0.42 && e.clientY > innerHeight * 0.45) return; // 조이스틱 영역
        drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false, t: performance.now() };
        cv.setPointerCapture(e.pointerId);
      });
      cv.addEventListener('pointermove', e => {
        if (drag && e.pointerId === drag.id) {
          const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
          if (Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) > 6) drag.moved = true;
          const k = e.pointerType === 'touch' ? 0.005 : 0.0032;
          this.player.yaw -= dx * k; this.player.pitch = Math.max(-1.2, Math.min(1.2, this.player.pitch + dy * k));
          if (drag.moved) this.glide = null;
          cv.style.cursor = 'grabbing';
        } else if (e.pointerType === 'mouse') this.hover(e);
      });
      const up = e => {
        if (drag && e.pointerId === drag.id) { if (!drag.moved && performance.now() - drag.t < 450) this.click(e); drag = null; cv.style.cursor = ''; }
      };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', () => { drag = null; });
      cv.addEventListener('wheel', e => { if (!this.world) return; e.preventDefault(); const f = -Math.sign(e.deltaY) * 0.9; this.tryMove(-Math.sin(this.player.yaw) * f, -Math.cos(this.player.yaw) * f); }, { passive: false });
      // 가상 조이스틱
      const pad = $('#joy'), knob = $('#joyKnob'); let jid = null, jc = null;
      const jstart = e => { jid = e.pointerId; const r = pad.getBoundingClientRect(); jc = { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width / 2 }; pad.setPointerCapture(e.pointerId); jmove(e); this.moveTarget = null; this.glide = null; };
      const jmove = e => { if (e.pointerId !== jid) return; let dx = e.clientX - jc.x, dy = e.clientY - jc.y; const d = Math.hypot(dx, dy), m = jc.r * 0.8; if (d > m) { dx *= m / d; dy *= m / d; } knob.style.transform = `translate(${dx}px,${dy}px)`; this.joy = { x: dx / m, y: dy / m }; };
      const jend = e => { if (e.pointerId !== jid) return; jid = null; knob.style.transform = ''; this.joy = { x: 0, y: 0 }; };
      pad.addEventListener('pointerdown', jstart); pad.addEventListener('pointermove', jmove); pad.addEventListener('pointerup', jend); pad.addEventListener('pointercancel', jend);
    }
    pick(e) {
      const v = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
      this.raycaster.setFromCamera(v, this.camera); this.raycaster.far = 60;
      return this.raycaster.intersectObjects(this.world.clickables, false)[0];
    }
    hover(e) {
      if (!this.world || this._hoverT && performance.now() - this._hoverT < 60) return; this._hoverT = performance.now();
      const hit = this.pick(e), tip = $('#tip');
      if (hit && hit.distance < 25) { this.renderer.domElement.style.cursor = 'pointer'; const a = hit.object.userData.art; tip.innerHTML = `<b>${esc(a.title)}</b><span>${esc(a.name)} · ${esc(a.sid)}</span>`; tip.style.transform = `translate(${e.clientX + 16}px,${e.clientY + 14}px)`; tip.classList.add('show'); }
      else { this.renderer.domElement.style.cursor = ''; tip.classList.remove('show'); }
    }
    click(e) {
      if (!this.world) return;
      const hit = this.pick(e);
      if (hit && hit.distance < 30) { this.focusArt(hit.object.userData.art, true); return; }
      // 바닥을 누르면 그곳으로 걸어감
      const v = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
      this.raycaster.setFromCamera(v, this.camera);
      const p = new THREE.Vector3(); const ok = this.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p);
      if (ok && p.distanceTo(this.player.pos) < 40) { this.moveTarget = { x: p.x, z: p.z }; this.ping(p); }
    }
    ping(p) {
      if (!this.world) return;
      const m = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.32, 32), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; m.position.set(p.x, 0.03, p.z); this.world.scene.add(m);
      const t0 = performance.now(), anim = () => { const t = (performance.now() - t0) / 700; if (t > 1 || !this.world) { m.parent && m.parent.remove(m); m.geometry.dispose(); m.material.dispose(); return; } m.scale.setScalar(1 + t * 1.5); m.material.opacity = 0.9 * (1 - t); requestAnimationFrame(anim); }; anim();
    }
    focusArt(art, openAfter) {
      const s = art.slot; if (!s || !this.world) { this.openArt(art); return; }
      const dist = Math.max(2.2, s.h * 1.5 + 0.9);
      const to = new THREE.Vector3(s.x + s.nx * dist, 0, s.z + s.nz * dist);
      const yaw = Math.atan2(s.nx, s.nz), pitch = Math.atan2(1.68 - EYE, dist) * -1;
      this.moveTarget = null;
      this.glide = { from: this.player.pos.clone(), to, y0: this.player.yaw, y1: yaw, p0: this.player.pitch, p1: -pitch * 0 + 0.0, t: 0, dur: Math.min(1.6, 0.6 + to.distanceTo(this.player.pos) * 0.05), done: openAfter ? () => this.openArt(art) : null };
    }
    tryMove(dx, dz) {
      const p = this.player.pos, steps = Math.ceil(Math.hypot(dx, dz) / 0.25) || 1;
      for (let i = 0; i < steps; i++) { p.x += dx / steps; p.z += dz / steps; this.world.collide(p, RADIUS); }
    }

    /* ---------- 루프 ---------- */
    loop() {
      requestAnimationFrame(() => this.loop());
      const dt = Math.min(0.05, this.clock.getDelta());
      const w = this.world; if (!w) return;
      const P = this.player, k = this.keys;
      // 이동 입력
      let f = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0) - this.joy.y;
      let s = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0) + this.joy.x;
      if (k.ArrowLeft) P.yaw += dt * 1.8; if (k.ArrowRight) P.yaw -= dt * 1.8;
      if (k.KeyQ) P.yaw += dt * 1.8; if (k.KeyE) P.yaw -= dt * 1.8;
      const run = k.ShiftLeft || k.ShiftRight || Math.hypot(this.joy.x, this.joy.y) > 0.95;
      let speed = (run ? 6.2 : 3.4) * dt, moving = false;
      if (this.glide) {
        const g = this.glide; g.t += dt / g.dur; const t = Math.min(1, g.t), e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        P.pos.lerpVectors(g.from, g.to, e);
        let dy = g.y1 - g.y0; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); P.yaw = g.y0 + dy * e; P.pitch = g.p0 + (g.p1 - g.p0) * e;
        if (t >= 1) { const done = g.done; this.glide = null; done && done(); }
      } else if (f || s) {
        const l = Math.hypot(f, s); if (l > 1) { f /= l; s /= l; }
        const sy = Math.sin(P.yaw), cy = Math.cos(P.yaw);
        this.tryMove((-sy * f + cy * s) * speed, (-cy * f - sy * s) * speed); moving = true;
      } else if (this.moveTarget) {
        const t = this.moveTarget, dx = t.x - P.pos.x, dz = t.z - P.pos.z, d = Math.hypot(dx, dz);
        if (d < 0.25) { this.moveTarget = t.then || null; }
        else {
          const want = Math.atan2(-dx, -dz); let dy = want - P.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); P.yaw += dy * Math.min(1, dt * 5);
          const before = P.pos.clone(), st = Math.min(d, speed * 1.1); this.tryMove(dx / d * st, dz / d * st); moving = true;
          if (before.distanceTo(P.pos) < st * 0.2) { t.stuck = (t.stuck || 0) + dt; if (t.stuck > 0.5) this.moveTarget = null; }
        }
      }
      P.bob += moving ? dt * (run ? 11 : 8) : 0;
      const bobY = moving ? Math.sin(P.bob) * 0.025 : 0;
      this.camera.position.set(P.pos.x, EYE + bobY, P.pos.z);
      this.camera.rotation.set(P.pitch * -1 * -1, P.yaw, 0);
      this.camera.rotation.x = -P.pitch;
      // 실내/실외 전환
      const L = w.L, inX = Math.abs(P.pos.x) < L.BW / 2 + 0.5;
      const targetIn = inX ? THREE.MathUtils.smoothstep(-P.pos.z, -1.2, 2.5) : 0;
      this.inside += (targetIn - this.inside) * Math.min(1, dt * 3);
      w.setInside(this.inside);
      const inLobby = P.pos.z < 0.3 && P.pos.z > -L.LD && inX;
      this.music.setTarget(this.inside * (inLobby ? 1 : 0.35));
      w.update(dt, P.pos);
      if (this.post) this.post.render(w.scene, this.camera, this.clock.elapsedTime); else this.renderer.render(w.scene, this.camera);
      // HUD
      const outside = P.pos.z > 2.5;
      $('#enterBtn').classList.toggle('show', outside && !this.moveTarget && !this.glide);
      this.drawMinimap();
      this.updateRoomLabel();
    }
    updateRoomLabel() {
      const w = this.world, p = this.player.pos; let label = p.z > 0.3 ? '미술관 앞' : '로비';
      if (p.z < -w.L.LD) label = '복도';
      for (const R of w.L.rooms) if (R.rect && p.x > R.rect.x0 && p.x < R.rect.x1 && p.z > R.rect.z0 && p.z < R.rect.z1) { label = R.room.label; break; }
      if (label !== this._lbl) { this._lbl = label; $('#hudRoom').textContent = label; }
    }

    /* ---------- 미니맵 ---------- */
    drawMinimapBase() {
      const cv = $('#minimap'); if (!cv || !this.world) return;
      const dpr = Math.min(2, devicePixelRatio), W = cv.clientWidth, H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr;
      const L = this.world.L, spawnZ = this.world.spawn.pos.z;
      const x0 = -Math.max(L.BW / 2, 26) - 4, x1 = -x0, z0 = -L.BL - 3, z1 = spawnZ + 4;
      const sc = Math.min(W / (x1 - x0), H / (z1 - z0));
      this.map = { x0, z0, z1, sc, ox: (W - (x1 - x0) * sc) / 2, oy: (H - (z1 - z0) * sc) / 2, dpr, W, H };
      const base = document.createElement('canvas'); base.width = cv.width; base.height = cv.height; const g = base.getContext('2d'); g.scale(dpr, dpr);
      const tx = x => this.map.ox + (x - x0) * sc, tz = z => this.map.oy + (z1 - z) * sc;
      this.world.mapShapes.forEach(s => {
        g.fillStyle = s.color;
        if (s.type === 'rect') { const X = tx(Math.min(s.x0, s.x1)), Y = tz(Math.max(s.z0, s.z1)), w = Math.abs(s.x1 - s.x0) * sc, h = Math.abs(s.z1 - s.z0) * sc; g.fillRect(X, Y, w, h); if (s.stroke) { g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1; g.strokeRect(X, Y, w, h); } }
        else if (s.type === 'circle') { g.beginPath(); g.arc(tx(s.x), tz(s.z), s.r * sc, 0, 7); g.fill(); }
      });
      g.font = '600 10px "Noto Sans KR", sans-serif'; g.fillStyle = 'rgba(255,255,255,0.85)'; g.textAlign = 'center'; g.textBaseline = 'middle';
      this.world.L.rooms.forEach(R => { if (!R.rect) return; const cx = tx((R.rect.x0 + R.rect.x1) / 2), cy = tz((R.rect.z0 + R.rect.z1) / 2); g.fillText(R.room.label.replace('학년 ', '-').replace('반', ''), cx, cy); });
      g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillText('입구', tx(0), tz(0) + 8);
      this.mapBase = base; this.mapTx = tx; this.mapTz = tz;
      cv.onclick = e => {
        const r = cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
        const wx = x0 + (mx - this.map.ox) / sc, wz = z1 - (my - this.map.oy) / sc;
        const R = this.world.L.rooms.find(R => R.rect && wx > R.rect.x0 && wx < R.rect.x1 && wz > R.rect.z0 && wz < R.rect.z1);
        const a = R ? this.world.anchors.find(a => a.room === R.room) : (wz > 0 ? this.world.anchors[0] : this.world.anchors[1]);
        if (a) this.teleport(a.pos, a.yaw);
      };
    }
    drawMinimap() {
      const cv = $('#minimap'); if (!this.mapBase || !cv.width) return;
      const g = cv.getContext('2d'), m = this.map, P = this.player;
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g.drawImage(this.mapBase, 0, 0);
      g.scale(m.dpr, m.dpr);
      const x = this.mapTx(P.pos.x), y = this.mapTz(P.pos.z);
      g.save(); g.translate(x, y); g.rotate(-P.yaw);
      g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 26, -Math.PI / 2 - 0.6, -Math.PI / 2 + 0.6); g.fill();
      g.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#e6b85c';
      g.beginPath(); g.moveTo(0, -7); g.lineTo(5, 5); g.lineTo(0, 2.5); g.lineTo(-5, 5); g.closePath(); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 1.2; g.stroke(); g.restore();
    }

    /* ---------- 작품 상세 ---------- */
    openArt(art) {
      this.cur = art;
      const m = $('#artModal');
      const chain = D.imgChain(art, 'XL'); let ci = 0; const im = $('#artImg');
      im.onerror = () => { if (++ci < chain.length) im.src = chain[ci]; };
      im.src = chain[0] || '';
      $('#artImgWrap').classList.toggle('noimg', !art.img);
      $('#artTitle').textContent = art.title;
      $('#artArtist').textContent = `${art.name}`;
      $('#artMeta').textContent = `${art.sid} · ${art.classLabel}`;
      $('#artDesc').textContent = art.desc || '작품 설명이 없습니다.';
      const list = this.ex.artworks, i = list.indexOf(art);
      $('#artIndex').textContent = `${i + 1} / ${list.length}`;
      this.renderLikes(); this.renderComments();
      $('#cmtId').value = LS.get('my_sid', ''); $('#cmtName').value = LS.get('my_name', '');
      this.openModal('artModal');
    }
    stepArt(d) {
      const list = this.ex.artworks; if (!this.cur) return;
      const a = list[(list.indexOf(this.cur) + d + list.length) % list.length];
      this.openArt(a);
      if (this.world && a.slot) { const s = a.slot, dist = Math.max(2.2, s.h * 1.5 + 0.9); this.player.pos.set(s.x + s.nx * dist, 0, s.z + s.nz * dist); this.player.yaw = Math.atan2(s.nx, s.nz); this.player.pitch = 0; }
    }
    renderLikes() { const a = this.cur, b = $('#likeBtn'); b.classList.toggle('on', a.liked); $('#likeCount').textContent = a.likes; }
    toggleLike() {
      const a = this.cur; a.liked = !a.liked; a.likes = Math.max(0, a.likes + (a.liked ? 1 : -1));
      LS.set('likes_' + a.id, a.likes); LS.set('liked_' + a.id, a.liked ? '1' : ''); this.renderLikes();
      if (a.liked) { const b = $('#likeBtn'); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
    }
    renderComments() {
      const a = this.cur, el = $('#cmtList');
      $('#cmtCount').textContent = a.comments.length;
      // 예전에 저장된 감상평에 비속어가 있으면 가려서 보여 줌
      const bad = c => window.BadWords && (BadWords.has(c.text) || BadWords.has(c.name));
      el.innerHTML = a.comments.length ? a.comments.slice().reverse().map(c => bad(c)
        ? `<li class="hidden-cmt">부적절한 표현이 있어 가려진 감상평입니다.</li>`
        : `<li><div><b>${esc(c.name)}</b> <span>${esc(c.sid)}</span> <time>${esc(c.date)}</time></div><p>${esc(c.text)}</p></li>`).join('') : '<li class="empty">첫 번째 감상평을 남겨 주세요.</li>';
    }
    async addComment(e) {
      e.preventDefault();
      const sid = $('#cmtId').value.trim(), name = $('#cmtName').value.trim(), text = $('#cmtText').value.trim();
      if (!sid || !name) { this.toast('학번과 이름을 입력해 주세요.'); return; }
      if (!text) { this.toast('감상평을 입력해 주세요.'); return; }
      if (window.BadWords && (BadWords.has(text) || BadWords.has(name))) {
        this.toast('바르고 고운 말로 감상평을 남겨 주세요. 욕설이나 비속어가 들어 있어 저장하지 않았어요.', null, 5000);
        const f = $('#cmtForm'); f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake');
        return;
      }
      const a = this.cur, c = { sid, name, text, date: new Date().toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' }) };
      a.comments.push(c); LS.set('comments_' + a.id, JSON.stringify(a.comments)); LS.set('my_sid', sid); LS.set('my_name', name);
      const all = JSON.parse(LS.get('all_comments', '[]')); all.push({ ...c, artId: a.id, artTitle: a.title, artist: a.name, artistSid: a.sid, room: a.classLabel }); LS.set('all_comments', JSON.stringify(all));
      $('#cmtText').value = ''; this.renderComments();
      const hook = D.settings().webhook;
      if (hook) { try { await fetch(hook, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ ...c, artId: a.id, artTitle: a.title, artist: a.name, artistSid: a.sid, room: a.classLabel }) }); this.toast('감상평이 등록되었습니다. (구글 시트 전송)'); } catch (err) { this.toast('감상평은 저장했지만 시트 전송에 실패했습니다.'); } }
      else this.toast('감상평이 등록되었습니다.');
    }

    /* ---------- 2D 목록 보기 ---------- */
    openList() {
      const q = $('#listSearch'); q.value = ''; this.renderList(''); this.openModal('listModal'); if (!this.isMobile) setTimeout(() => q.focus(), 50);
    }
    renderList(q) {
      q = q.trim().toLowerCase();
      const html = this.ex.rooms.map(R => {
        const arts = R.artworks.filter(a => !q || [a.title, a.name, a.sid, a.desc].join(' ').toLowerCase().includes(q));
        if (!arts.length) return '';
        return `<section><h4>${esc(R.label)} <small>${arts.length}점</small></h4><div class="cards">${arts.map(a => `
          <button class="card" data-id="${esc(a.id)}"><div class="thumb">${a.img ? `<img src="${esc(D.imgSrc(a, 'S'))}" loading="lazy" alt="" onerror="this.onerror=null;this.src='${esc(D.imgChain(a, 'S').slice(-1)[0])}'">` : ''}</div>
          <div class="cbody"><b>${esc(a.title)}</b><span>${esc(a.name)} · ${esc(a.sid)}</span></div></button>`).join('')}</div></section>`;
      }).join('');
      $('#listBody').innerHTML = html || '<p class="empty">검색 결과가 없습니다.</p>';
      $$('#listBody .card').forEach(b => b.onclick = () => {
        const a = this.ex.artworks.find(x => x.id === b.dataset.id); this.closeModal('listModal');
        if (this.world && a.slot) { const s = a.slot, dist = Math.max(2.2, s.h * 1.5 + 0.9); this.teleport(new THREE.Vector3(s.x + s.nx * dist, 0, s.z + s.nz * dist), Math.atan2(s.nx, s.nz)); setTimeout(() => this.openArt(a), 420); }
        else this.openArt(a);
      });
    }

    /* ---------- 데이터 관리 ---------- */
    openData() {
      const s = D.settings();
      $('#setSheet').value = s.sheetId; $('#setGid').value = s.sheetGid; $('#setHook').value = s.webhook;
      $('#setAuto').checked = LS.get('auto_sync', '1') === '1';
      try { $('#updPass').value = sessionStorage.getItem('upd_pass') || ''; } catch (e) { }
      const secTxt = s => s >= 60 ? `${Math.round(s / 60)}분` : `${s}초`;
      this.renderBadWordsNow();
      $('#gsNow').innerHTML = `지금 사이트 설정: <b>${C.autoSync ? `켜짐 · ${secTxt(C.autoSyncSeconds || 120)}마다` : '꺼짐'}</b>`;
      $('#gsOn').value = C.autoSync ? 'true' : 'false';
      { const v = String(C.autoSyncSeconds || 120); if (![...$('#gsSec').options].some(o => o.value === v)) $('#gsSec').add(new Option(secTxt(+v), v)); $('#gsSec').value = v; }
      { const site = C.commentWebhookUrl || '', dev = LS.get('comment_webhook_url', '');
        $('#hookNow').innerHTML = site ? '지금 모든 기기 주소: <b>설정됨</b> (감상평이 시트로 모입니다)' + (dev && dev !== site ? ' · 이 기기는 다른 주소를 씁니다' : '') : '지금 모든 기기 주소: <b>없음</b>' + (dev ? ' · 이 기기에서만 시트로 보냅니다' : ' (감상평은 각 기기에만 저장)'); }
      $('#dataStats').textContent = `현재 ${this.ex.rooms.length}개 전시실 · 학생 ${this.ex.studentCount}명 · 작품 ${this.ex.artworks.length}점`;
      this.openModal('dataModal');
    }
    saveData() {
      LS.set('sheet_id', $('#setSheet').value.trim() || C.sheetId); LS.set('sheet_gid', $('#setGid').value.trim() || C.sheetGid);
      LS.set('comment_webhook_url', $('#setHook').value.trim()); LS.set('auto_sync', $('#setAuto').checked ? '1' : '0');
      this.closeModal('dataModal'); this.toast('설정을 저장했습니다.');
      this.lastCsv = ''; this.sync(false);
    }
    pasteData() {
      const t = $('#pasteArea').value; if (!t.trim()) { this.toast('붙여넣은 내용이 없습니다.'); return; }
      if (this.applyCsv(t)) { D.cacheCsv(t); this.closeModal('dataModal'); this.toast(`불러왔습니다: 작품 ${this.ex.artworks.length}점`); this.world ? this.rebuild() : this.renderLanding(); }
    }
    exportComments() {
      const all = JSON.parse(LS.get('all_comments', '[]'));
      if (!all.length) { this.toast('저장된 감상평이 없습니다.'); return; }
      const head = ['작성일시', '작성자 학번', '작성자 이름', '감상평', '작품', '작가', '작가 학번', '전시실'];
      const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
      const csv = '﻿' + [head.map(q).join(','), ...all.map(c => [c.date, c.sid, c.name, c.text, c.artTitle, c.artist, c.artistSid, c.room].map(q).join(','))].join('\r\n');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = '감상평_' + new Date().toISOString().slice(0, 10) + '.csv'; a.click();
    }

    /* ---------- UI 공통 ---------- */
    initUI() {
      $('#backBtn').onclick = () => this.leave();
      $('#listBtn').onclick = () => this.openList();
      $('#dataBtn').onclick = () => this.openData();
      $('#landData').onclick = () => this.openData();
      $('#landList').onclick = () => this.openList();
      $('#infoBtn').onclick = () => this.openInfo();
      $('#muteBtn').onclick = () => this.toggleMute();
      this.renderMute();
      $('#landInfo').onclick = () => this.openInfo();
      $('#enterBtn').onclick = () => this.goEntrance();
      $('#listSearch').oninput = e => this.renderList(e.target.value);
      $('#likeBtn').onclick = () => this.toggleLike();
      $('#cmtForm').onsubmit = e => this.addComment(e);
      $('#prevArt').onclick = () => this.stepArt(-1); $('#nextArt').onclick = () => this.stepArt(1);
      $('#saveData').onclick = () => this.saveData(); $('#pasteBtn').onclick = () => this.pasteData();
      $('#exportBtn').onclick = () => this.exportComments(); $('#syncNow').onclick = () => { this.lastCsv = ''; this.sync(false).then(() => this.toast('구글 시트를 다시 확인했습니다.')); };
      $('#gsApply').onclick = () => this.applyGlobalSync();
      $('#hookApply').onclick = () => this.applyHook();
      $('#gasCopy').onclick = async () => {
        const code = $('#gasCode').textContent;
        try { await navigator.clipboard.writeText(code); }
        catch (e) { const r = document.createRange(); r.selectNodeContents($('#gasCode')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('copy'); }
        $('#gasCopy').textContent = '복사했습니다 ✓'; setTimeout(() => $('#gasCopy').textContent = '코드 복사', 2000);
      };
      $('#bwApply').onclick = () => this.applyBadWords();
      $('#openSetup').onclick = () => { this.closeModal('dataModal'); Setup.open(); };
      $('#setupStart').onclick = () => Setup.open();
      Setup.init();
      $('#bwTest').oninput = e => {
        const t = e.target.value.trim(), m = $('#bwTestMsg');
        if (!t) { m.textContent = ''; m.className = 'upd-msg'; return; }
        const w = window.BadWords && BadWords.find(t);
        m.className = 'upd-msg ' + (w ? 'err' : 'ok');
        m.textContent = w ? `걸러집니다 (걸린 단어: ${w})` : '통과합니다 (저장됩니다)';
      };
      $('#updRun').onclick = () => this.updateImages('run');
      $('#updStatus').onclick = () => this.updateImages('status');
      $('#sampleBtn').onclick = () => { this.applyStudents(D.sampleStudents()); this.closeModal('dataModal'); this.world ? this.rebuild() : this.renderLanding(); };
      $$('[data-close]').forEach(b => b.onclick = () => this.closeModal(b.closest('.modal').id));
      $$('.modal').forEach(m => m.addEventListener('pointerdown', e => { if (e.target === m) this.closeModal(m.id); }));
      addEventListener('keydown', e => { if (!$('#artModal').classList.contains('show') || /INPUT|TEXTAREA/.test(e.target.tagName)) return; if (e.key === 'ArrowLeft') this.stepArt(-1); if (e.key === 'ArrowRight') this.stepArt(1); });
      if (this.isMobile) document.body.classList.add('touch');
    }
    openInfo() {
      const m = this.museum;
      const museumHtml = m ? `<p class="eyebrow">${esc(m.region)} · ${esc(m.city)}</p><h3>${esc(m.name)}</h3><p class="lead">${esc(m.desc)}</p>
        <dl><dt>개관</dt><dd>${m.year}</dd><dt>설계</dt><dd>${esc(m.architect)}</dd><dt>키워드</dt><dd>${m.keywords.map(esc).join(', ')}</dd><dt>시간대</dt><dd>${m.sky.time}</dd></dl>
        <p class="note">이 공간은 실제 미술관의 건축적 특징에서 영감을 받아 만든 교육용 가상 전시관이며, 해당 미술관과는 관계가 없습니다.</p>` : `<p class="eyebrow">GUIDE</p><h3>관람 안내</h3>`;
      const cur = LS.get('quality', 'auto');
      const opts = [['auto', '자동', this.isMobile ? '기기에 맞춤 (지금: 낮음)' : '기기에 맞춤 (지금: 높음)'], ['low', '낮음', '저사양 PC·휴대폰'], ['high', '높음', '그림자·부드러운 경계'], ['ultra', '초고해상도', '고해상도 + 실제 조명 + 빛 번짐 효과']];
      $('#infoBody').innerHTML = museumHtml + `
        <h4>화질</h4>
        <div class="quality">${opts.map(([v, t, d]) => `<button data-q="${v}" class="${cur === v ? 'on' : ''}"><b>${t}</b><span>${d}</span></button>`).join('')}</div>
        <p class="note">초고해상도는 성능이 좋은 PC에서 권장합니다. 화면이 끊기면 한 단계 낮춰 주세요. 바꾸면 화면을 다시 불러옵니다.</p>
        <h4>조작 방법</h4><ul class="keys"><li><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / 방향키 — 걷기 (<kbd>Shift</kbd> 달리기)</li><li>마우스 끌기 — 둘러보기 · 휠 — 앞뒤 이동</li><li>바닥 클릭 — 그곳으로 걸어가기</li><li>작품 클릭 — 가까이 가서 크게 보기</li><li>미니맵 클릭 — 전시실로 순간이동</li><li>태블릿·휴대폰 — 왼쪽 아래 조이스틱으로 걷기, 화면을 끌어 둘러보기</li></ul>`;
      $$('#infoBody .quality button').forEach(b => b.onclick = () => {
        if (b.dataset.q === cur) { this.closeModal('infoModal'); return; }
        LS.set('quality', b.dataset.q); location.reload();
      });
      this.openModal('infoModal');
    }
    toggleMute() {
      const m = !this.music.muted; this.music.setMuted(m); LS.set('music_muted', m ? '1' : '0'); this.renderMute();
      this.toast(m ? '배경음악을 껐습니다. (M 키로 다시 켜기)' : '배경음악을 켰습니다. 로비에서 가장 잘 들려요.');
    }
    renderMute() {
      const b = $('#muteBtn'), m = this.music.muted;
      b.classList.toggle('muted', m); b.title = m ? '배경음악 켜기 (M)' : '배경음악 끄기 (M)'; b.setAttribute('aria-label', b.title);
    }
    /* ---------- 작품 사진 업데이트 (Vercel 서버 기능 → GitHub Actions) ---------- */
    async updateImages(action) {
      const msg = $('#updMsg'), pass = $('#updPass').value.trim();
      const say = (t, cls = '') => { msg.className = 'upd-msg ' + cls; msg.innerHTML = t; };
      if (location.protocol === 'file:') { say('이 기능은 Vercel에 배포된 사이트 주소에서만 작동합니다.', 'err'); return; }
      if (!pass) { say('관리자 비밀번호를 입력해 주세요.', 'err'); return; }
      try { sessionStorage.setItem('upd_pass', pass); } catch (e) { }
      const call = async act => {
        const r = await fetch('/api/update-images', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pass, action: act }) });
        if (r.status === 404) throw new Error('서버 기능을 찾을 수 없습니다. Vercel에 배포된 주소에서 사용해 주세요.');
        const txt = await r.text(); let j = {}; try { j = JSON.parse(txt); } catch (e) { }
        if (!r.ok) {
          if (j.error) throw new Error(j.error);
          const code = (txt.match(/[A-Z][A-Z_]{6,}/) || [])[0];
          throw new Error(`HTTP ${r.status}${code ? ' · ' + code : ''} — 서버 기능이 실행되지 못했습니다. Vercel → 프로젝트 → Logs에서 /api/update-images 오류를 확인해 주세요.`);
        }
        return j;
      };
      const label = run => {
        if (!run) return '아직 실행한 작업이 없습니다.';
        const t = new Date(run.createdAt).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' });
        const st = run.status !== 'completed' ? (run.status === 'queued' ? '대기 중' : '진행 중') : (run.conclusion === 'success' ? '완료' : '실패');
        return `${t} 시작 · <b>${st}</b> · <a href="${run.url}" target="_blank" rel="noopener">GitHub에서 보기</a>`;
      };
      clearTimeout(this._updTimer);
      try {
        if (action === 'run') {
          $('#updRun').disabled = true; say('작업을 요청하는 중...');
          const started = Date.now(); await call('run');
          say('작업을 시작했습니다. 진행 상황을 확인하는 중...', 'busy');
          const poll = async () => {
            try {
              const j = await call('status'), run = j.run;
              const fresh = run && new Date(run.createdAt).getTime() > started - 60000;
              if (!fresh || run.status !== 'completed') { say((fresh ? label(run) : '작업이 곧 시작됩니다...') + '<br><small>사진이 많으면 몇 분 걸릴 수 있어요. 이 창을 닫아도 작업은 계속됩니다.</small>', 'busy'); if (Date.now() - started < 30 * 60000) this._updTimer = setTimeout(poll, 8000); else $('#updRun').disabled = false; return; }
              $('#updRun').disabled = false;
              if (run.conclusion === 'success') say(label(run) + '<br>사진 저장이 끝났습니다. 1~2분 뒤 사이트가 새로 배포되면 적용됩니다.', 'ok');
              else say(label(run) + '<br>작업이 실패했습니다. GitHub에서 기록을 확인해 주세요.', 'err');
            } catch (e) { $('#updRun').disabled = false; say(e.message, 'err'); }
          };
          this._updTimer = setTimeout(poll, 5000);
        } else {
          say('확인하는 중...'); const j = await call('status'); say(label(j.run), j.run && j.run.status !== 'completed' ? 'busy' : '');
        }
      } catch (e) { $('#updRun').disabled = false; say(e.message, 'err'); }
    }
    async applyGlobalSync() {
      const msg = $('#gsMsg'), pass = $('#updPass').value.trim();
      const say = (t, cls = '') => { msg.className = 'upd-msg ' + cls; msg.innerHTML = t; };
      if (location.protocol === 'file:') { say('이 기능은 Vercel에 배포된 사이트 주소에서만 작동합니다.', 'err'); return; }
      if (!pass) { say('맨 위 "관리자 비밀번호" 칸에 비밀번호를 입력해 주세요.', 'err'); return; }
      const on = $('#gsOn').value === 'true', sec = +$('#gsSec').value;
      const post = async payload => {
        const r = await fetch('/api/update-images', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pass, ...payload }) });
        if (r.status === 404) throw new Error('서버 기능을 찾을 수 없습니다. Vercel에 배포된 주소에서 사용해 주세요.');
        const txt = await r.text(); let j = {}; try { j = JSON.parse(txt); } catch (e) { }
        if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
        return j;
      };
      clearTimeout(this._gsTimer); $('#gsApply').disabled = true;
      try {
        say('설정 변경을 요청하는 중...');
        const started = Date.now(); await post({ action: 'settings', autoSync: on, seconds: sec });
        try { sessionStorage.setItem('upd_pass', pass); } catch (e) { }
        const poll = async () => {
          try {
            const j = await post({ action: 'status', job: 'settings' }), run = j.run;
            const fresh = run && new Date(run.createdAt).getTime() > started - 60000;
            if (!fresh || run.status !== 'completed') { say('GitHub이 설정을 고치는 중...', 'busy'); if (Date.now() - started < 10 * 60000) this._gsTimer = setTimeout(poll, 6000); else $('#gsApply').disabled = false; return; }
            $('#gsApply').disabled = false;
            if (run.conclusion === 'success') say(`설정을 저장했습니다: <b>${on ? `켜짐 · ${sec >= 60 ? sec / 60 + '분' : sec + '초'}마다` : '꺼짐'}</b>. 1~2분 뒤 배포가 끝나면 모든 기기에 적용됩니다. <a href="${run.url}" target="_blank" rel="noopener">GitHub에서 보기</a>`, 'ok');
            else say(`설정 변경이 실패했습니다. <a href="${run.url}" target="_blank" rel="noopener">GitHub에서 기록 보기</a>`, 'err');
          } catch (e) { $('#gsApply').disabled = false; say(e.message, 'err'); }
        };
        this._gsTimer = setTimeout(poll, 5000);
      } catch (e) { $('#gsApply').disabled = false; say(e.message, 'err'); }
    }
    async applyHook() {
      const msg = $('#hookMsg'), pass = $('#updPass').value.trim(), url = $('#setHook').value.trim();
      const say = (t, cls = '') => { msg.className = 'upd-msg ' + cls; msg.innerHTML = t; };
      if (url && !/^https:\/\/script\.google\.com\/(macros|a\/macros\/[A-Za-z0-9.-]+)\/s\/[A-Za-z0-9_-]+\/exec$/.test(url)) { say('주소 형식이 맞지 않습니다. 배포 화면의 <b>웹 앱 URL</b>(https://script.google.com/…/exec)을 그대로 붙여넣어 주세요. (라이브러리 주소·편집기 주소가 아닙니다)', 'err'); return; }
      if (location.protocol === 'file:') { say('이 기능은 Vercel에 배포된 사이트 주소에서만 작동합니다. 이 기기에서만 쓰려면 아래 <b>저장</b>을 누르세요.', 'err'); return; }
      if (!pass) { say('맨 위 "관리자 비밀번호" 칸에 비밀번호를 입력해 주세요.', 'err'); return; }
      const post = async payload => {
        const r = await fetch('/api/update-images', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pass, ...payload }) });
        if (r.status === 404) throw new Error('서버 기능을 찾을 수 없습니다. Vercel에 배포된 주소에서 사용해 주세요.');
        const txt = await r.text(); let j = {}; try { j = JSON.parse(txt); } catch (e) { }
        if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
        return j;
      };
      clearTimeout(this._hookTimer); $('#hookApply').disabled = true;
      try {
        say('저장을 요청하는 중...');
        const started = Date.now(); await post({ action: 'config', config: { hook: url } });
        try { sessionStorage.setItem('upd_pass', pass); } catch (e) { }
        LS.set('comment_webhook_url', url); // 이 기기에는 바로 적용
        const poll = async () => {
          try {
            const j = await post({ action: 'status', job: 'config' }), run = j.run;
            const fresh = run && new Date(run.createdAt).getTime() > started - 60000;
            if (!fresh || run.status !== 'completed') { say('이 기기에는 바로 적용했습니다. GitHub이 모든 기기용 주소를 저장하는 중...', 'busy'); if (Date.now() - started < 10 * 60000) this._hookTimer = setTimeout(poll, 6000); else $('#hookApply').disabled = false; return; }
            $('#hookApply').disabled = false;
            if (run.conclusion === 'success') say(`${url ? '주소를 저장했습니다' : '주소를 지웠습니다'}. 1~2분 뒤 배포가 끝나면 모든 기기에 적용됩니다. ${url ? '감상평을 하나 써 보고 시트에 한 줄이 생기는지 확인해 보세요. ' : ''}<a href="${run.url}" target="_blank" rel="noopener">GitHub에서 보기</a>`, 'ok');
            else say(`저장에 실패했습니다. <a href="${run.url}" target="_blank" rel="noopener">GitHub에서 기록 보기</a>`, 'err');
          } catch (e) { $('#hookApply').disabled = false; say(e.message, 'err'); }
        };
        this._hookTimer = setTimeout(poll, 5000);
      } catch (e) { $('#hookApply').disabled = false; say(e.message, 'err'); }
    }
    renderBadWordsNow() {
      const c = window.BADWORDS_CUSTOM || { words: [], allow: [] }, chip = a => a.length ? a.map(w => `<span class="chip">${esc(w)}</span>`).join('') : '<span class="muted">없음</span>';
      $('#bwNow').innerHTML = `기본 목록 ${window.BadWords ? BadWords.baseCount : 0}개 + 추가한 비속어 ${c.words.length}개<div class="chips">${chip(c.words)}</div>정상 단어로 허용한 말 ${c.allow.length}개<div class="chips">${chip(c.allow)}</div>`;
    }
    async applyBadWords() {
      const msg = $('#bwMsg'), pass = $('#updPass').value.trim();
      const say = (t, cls = '') => { msg.className = 'upd-msg ' + cls; msg.innerHTML = t; };
      const words = $('#bwAdd').value.trim(), allow = $('#bwAllow').value.trim(), remove = $('#bwRemove').value.trim();
      if (location.protocol === 'file:') { say('이 기능은 Vercel에 배포된 사이트 주소에서만 작동합니다.', 'err'); return; }
      if (!pass) { say('맨 위 "관리자 비밀번호" 칸에 비밀번호를 입력해 주세요.', 'err'); return; }
      if (!words && !allow && !remove) { say('추가하거나 지울 단어를 입력해 주세요.', 'err'); return; }
      const post = async payload => {
        const r = await fetch('/api/update-images', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pass, ...payload }) });
        if (r.status === 404) throw new Error('서버 기능을 찾을 수 없습니다. Vercel에 배포된 주소에서 사용해 주세요.');
        const txt = await r.text(); let j = {}; try { j = JSON.parse(txt); } catch (e) { }
        if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
        return j;
      };
      // 이 기기에 먼저 적용 (화면에서 바로 확인 가능)
      const split = s => s.split(/[,\n]+/).map(w => w.replace(/["'`\\<>]/g, '').replace(/\s+/g, '').toLowerCase()).filter(Boolean);
      const cur = window.BADWORDS_CUSTOM || { words: [], allow: [] }, rm = new Set(split(remove));
      const next = { words: [...new Set([...cur.words, ...split(words)])].filter(w => !rm.has(w)).sort(), allow: [...new Set([...cur.allow, ...split(allow)])].filter(w => !rm.has(w)).sort() };
      clearTimeout(this._bwTimer); $('#bwApply').disabled = true;
      try {
        say('목록 변경을 요청하는 중...');
        const started = Date.now(); await post({ action: 'words', addWords: words, addAllow: allow, remove });
        if (window.BadWords) BadWords.reload(next); this.renderBadWordsNow(); this.renderComments && this.cur && this.renderComments();
        $('#bwAdd').value = $('#bwAllow').value = $('#bwRemove').value = '';
        const poll = async () => {
          try {
            const j = await post({ action: 'status', job: 'words' }), run = j.run;
            const fresh = run && new Date(run.createdAt).getTime() > started - 60000;
            if (!fresh || run.status !== 'completed') { say('이 기기에는 바로 적용했습니다. GitHub이 모든 기기용 목록을 저장하는 중...', 'busy'); if (Date.now() - started < 10 * 60000) this._bwTimer = setTimeout(poll, 6000); else $('#bwApply').disabled = false; return; }
            $('#bwApply').disabled = false;
            if (run.conclusion === 'success') say(`저장했습니다. 1~2분 뒤 배포가 끝나면 모든 기기에 적용됩니다. <a href="${run.url}" target="_blank" rel="noopener">GitHub에서 보기</a>`, 'ok');
            else say(`저장에 실패했습니다. <a href="${run.url}" target="_blank" rel="noopener">GitHub에서 기록 보기</a>`, 'err');
          } catch (e) { $('#bwApply').disabled = false; say(e.message, 'err'); }
        };
        this._bwTimer = setTimeout(poll, 5000);
      } catch (e) { $('#bwApply').disabled = false; say(e.message, 'err'); }
    }
    toggleAdmin() {
      const on = !document.body.classList.contains('admin');
      document.body.classList.toggle('admin', on);
      try { sessionStorage.setItem('admin', on ? '1' : '0'); } catch (e) { }
      this.toast(on ? '관리자 메뉴를 표시합니다. (F9로 숨기기)' : '관리자 메뉴를 숨겼습니다.');
      if (on) this.openData(); else this.closeModal('dataModal');
    }
    openModal(id) { $('#' + id).classList.add('show'); document.body.classList.add('modal-open'); this.keys = {}; }
    closeModal(id) { $('#' + id).classList.remove('show'); if (!$$('.modal.show').length) document.body.classList.remove('modal-open'); }
    closeAll() { $$('.modal.show').forEach(m => this.closeModal(m.id)); }
    toast(msg, action, ms = 3800) {
      const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = `<span>${esc(msg)}</span>`;
      if (action) { const b = document.createElement('button'); b.textContent = action.label; b.onclick = () => { action.fn(); t.remove(); }; t.appendChild(b); }
      $('#toasts').appendChild(t); requestAnimationFrame(() => t.classList.add('show'));
      setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, ms);
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    if (!window.THREE) { document.body.innerHTML = '<p style="padding:40px;color:#fff">3D 라이브러리를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.</p>'; return; }
    window.app = new App();
  });
})();
