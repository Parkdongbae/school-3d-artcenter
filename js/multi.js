/* =========================================================
 * 함께 관람하기: 아바타 + 대화
 *  - 같은 전시(같은 구글 시트)의 같은 미술관에 있는 사람끼리 서로 보이고 대화할 수 있습니다.
 *  - 가입 없이 공개 중계 서버(MQTT)로 연결하며, 내용은 암호화해서 보냅니다. 대화는 어디에도 저장되지 않습니다.
 *  - 끄기: 전시관 주소의 m=0 (함께 관람 끄기) · c=0 (대화만 끄기), 또는 js/config.js 의 multiplayer / chat
 * ========================================================= */
(function () {
  const $ = s => document.querySelector(s);
  const C = window.ART_CONFIG, D = window.ArtData, LS = D.LS;
  const LIB = 'https://cdn.jsdelivr.net/npm/mqtt@5.10.1/dist/mqtt.min.js';
  const BROKERS = ['wss://broker.emqx.io:8084/mqtt', 'wss://test.mosquitto.org:8081/mqtt', 'wss://broker.hivemq.com:8884/mqtt'];
  const APP_ID = 'parkdongbae/school-3d-artcenter';
  const AVATARS = [
    { e: '🐻', c: '#b5733c', n: '곰' }, { e: '🐰', c: '#e58fb1', n: '토끼' }, { e: '🐱', c: '#f0a53a', n: '고양이' }, { e: '🐶', c: '#8d6e63', n: '강아지' },
    { e: '🦊', c: '#e8672c', n: '여우' }, { e: '🐼', c: '#4a4f57', n: '판다' }, { e: '🐯', c: '#e0a020', n: '호랑이' }, { e: '🐸', c: '#55a84a', n: '개구리' },
    { e: '🐧', c: '#3b6fb6', n: '펭귄' }, { e: '🦄', c: '#9b6fd6', n: '유니콘' }, { e: '🐵', c: '#a0705a', n: '원숭이' }, { e: '🤖', c: '#5f8f9a', n: '로봇' }
  ];
  const NAME_MAX = 10, TEXT_MAX = 80, SEND_MS = 200, BEAT_MS = 3000, GONE_MS = 10000, MAX_PEERS = 60;
  const enabled = C.multiplayer !== false, chatOn = enabled && C.chat !== false;

  const M = { app: null, net: null, roomId: '', joinSeq: 0, peers: new Map(), group: null, profile: null, solo: false, lastSent: null, lastSendAt: 0, lastChatAt: 0, picked: 0, status: '' };
  try { M.profile = JSON.parse(LS.get('mp_profile', 'null')); } catch (e) { }

  const cleanName = v => { const n = String(v || '').replace(/[<>\r\n]/g, '').trim().slice(0, NAME_MAX); return !n || window.BadWords.has(n) ? '친구' : n; };
  const cleanText = v => { const t = String(v || '').replace(/[\r\n]+/g, ' ').trim().slice(0, TEXT_MAX); return window.BadWords.has(t) ? '(가려진 말)' : t; };
  const avatarOf = i => AVATARS[(i | 0) >= 0 && (i | 0) < AVATARS.length ? i | 0 : 0];

  /* ---------- 그림 (이름표 · 얼굴 · 말풍선) ---------- */
  function sprite(draw, w, h, worldH) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
    s.scale.set(worldH * w / h, worldH, 1); return s;
  }
  const FONT = '"Pretendard", "Noto Sans KR", "Malgun Gothic", sans-serif';
  function pill(g, w, h, fill) { const r = h / 2; g.fillStyle = fill; g.beginPath(); g.moveTo(r, 0); g.arcTo(w, 0, w, h, r); g.arcTo(w, h, 0, h, r); g.arcTo(0, h, 0, 0, r); g.arcTo(0, 0, w, 0, r); g.fill(); }
  function textSprite(text, o) {
    const m = document.createElement('canvas').getContext('2d'); m.font = `${o.weight || 700} ${o.px}px ${FONT}`;
    const w = Math.ceil(m.measureText(text).width) + o.px * 1.2, h = Math.ceil(o.px * 1.7);
    return sprite(g => { pill(g, w, h, o.bg); g.font = `${o.weight || 700} ${o.px}px ${FONT}`; g.fillStyle = o.fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + o.px * 0.05); }, w, h, o.h);
  }
  function faceSprite(av) {
    return sprite((g, w) => {
      g.fillStyle = '#fff'; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 6, 0, 7); g.fill();
      g.lineWidth = 10; g.strokeStyle = av.c; g.stroke();
      g.font = `${w * 0.6}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(av.e, w / 2, w / 2 + w * 0.04);
    }, 160, 160, 0.5);
  }
  function drop(o) { if (!o) return; o.parent && o.parent.remove(o); o.traverse(x => { if (x.geometry) x.geometry.dispose(); if (x.material) { x.material.map && x.material.map.dispose(); x.material.dispose(); } }); }

  /* ---------- 다른 사람의 아바타 ---------- */
  function buildMesh(p) {
    drop(p.mesh); p.mesh = null; p.bubble = null;
    if (!M.group) return;
    const av = avatarOf(p.a), g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.5, 4, 12), new THREE.MeshLambertMaterial({ color: av.c }));
    body.position.y = 0.5; body.castShadow = true; g.add(body);
    const face = faceSprite(av); face.position.y = 1.2; g.add(face);
    const tag = textSprite(p.name, { px: 40, h: 0.2, bg: 'rgba(16,17,20,.78)', fg: '#fff' }); tag.position.y = 1.62; g.add(tag);
    g.visible = p.has; g.position.set(p.x, 0, p.z);
    p.body = body; p.mesh = g; M.group.add(g);
  }
  function upsertPeer(id, v) {
    if (!v || typeof v !== 'object') return;
    let p = M.peers.get(id);
    const name = cleanName(v.n), a = v.a | 0;
    if (!p) { if (M.peers.size >= MAX_PEERS) return; p = { id, name, a, x: 0, z: 0, yaw: 0, tx: 0, tz: 0, has: false, walk: 0, lastChat: 0, seq: 0, seen: performance.now() }; M.peers.set(id, p); say(null, `${name} 님이 들어왔어요.`); buildMesh(p); }
    else if (p.name !== name || p.a !== a) { p.name = name; p.a = a; buildMesh(p); }
    renderCount();
  }
  function removePeer(id) {
    const p = M.peers.get(id); if (!p) return;
    drop(p.mesh); M.peers.delete(id); say(null, `${p.name} 님이 나갔어요.`); renderCount();
  }
  function onPos(d, id) {
    const p = M.peers.get(id); if (!p || !Array.isArray(d)) return;
    const x = +d[0], z = +d[1]; if (!isFinite(x) || !isFinite(z) || Math.abs(x) > 500 || Math.abs(z) > 500) return;
    p.tx = x; p.tz = z;
    if (!p.has || Math.hypot(x - p.x, z - p.z) > 6) { p.x = x; p.z = z; } // 처음이거나 순간이동
    p.has = true; if (p.mesh) p.mesh.visible = true;
  }
  function showBubble(p, text) {
    if (!p.mesh) return;
    drop(p.bubble);
    const b = textSprite(text.length > 22 ? text.slice(0, 21) + '…' : text, { px: 36, weight: 600, h: 0.2, bg: 'rgba(255,255,255,.95)', fg: '#16171a' });
    b.position.y = 1.9; p.mesh.add(b); p.bubble = b; p.bubbleUntil = performance.now() + 6000;
  }

  /* ---------- 연결 (공개 중계 서버 · 암호화) ---------- */
  //  - 학교 와이파이에서는 브라우저끼리 직접 연결(WebRTC)이 막히는 일이 많아, 웹소켓 중계(MQTT)를 씁니다.
  //  - 한 곳이 막히거나 쉬어도 되도록 여러 중계 서버에 함께 보내고, 받은 쪽에서 겹친 것을 버립니다.
  //  - 보내는 내용(이름·위치·대화)은 전시관 주소를 아는 사람만 풀 수 있게 암호화합니다 (AES-GCM).
  const te = new TextEncoder(), td = new TextDecoder();
  const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s); };
  const unb64 = str => { const s = atob(str), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
  const hex = buf => [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, '0')).join('');
  let mqttLib = null;
  function loadMqtt() {
    return mqttLib || (mqttLib = new Promise((res, rej) => {
      if (window.mqtt) return res(window.mqtt);
      const sc = document.createElement('script'); sc.src = LIB;
      sc.onload = () => window.mqtt ? res(window.mqtt) : rej(new Error('mqtt')); sc.onerror = () => { mqttLib = null; rej(new Error('mqtt')); };
      document.head.appendChild(sc);
    }));
  }
  function roomIdFor(museum) { return (C.sheetId || 'demo') + '/' + museum.id; }
  async function seal(key, obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, te.encode(JSON.stringify(obj))));
    const out = new Uint8Array(12 + ct.length); out.set(iv); out.set(ct, 12); return b64(out);
  }
  async function unseal(key, str) {
    const u = unb64(str); if (u.length < 30 || u.length > 2000) return null;
    return JSON.parse(td.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: u.subarray(0, 12) }, key, u.subarray(12))));
  }
  async function publish(obj, n = M.net, force) {
    if (!n) return;
    obj.i = n.id; obj.q = ++n.seq;
    let msg; try { msg = await seal(n.key, obj); } catch (e) { return; }
    if (M.net !== n && !force) return;
    n.clients.forEach(c => { if (c.connected) try { c.publish(n.topic, msg, { qos: 0 }); } catch (e) { } });
  }
  function leaveRoom() {
    M.joinSeq++;
    const n = M.net; M.roomId = ''; M.lastSent = null;
    if (n) {
      clearInterval(n.timer);
      M.net = null;
      publish({ t: 'b' }, n, true).finally(() => setTimeout(() => n.clients.forEach(c => { try { c.end(true); } catch (e) { } }), 300));
    }
    M.peers.forEach(p => drop(p.mesh)); M.peers.clear();
    setStatus(''); renderCount();
  }
  async function join() {
    const app = M.app; if (!enabled || M.solo || !M.profile || !app.museum) return;
    const id = roomIdFor(app.museum);
    if (M.roomId === id) return;
    leaveRoom(); M.roomId = id; const seq = M.joinSeq;
    if (!window.crypto || !crypto.subtle) { setStatus('이 주소(http)에서는 함께 관람을 쓸 수 없습니다'); return; }
    setStatus('함께 관람 연결하는 중…');
    try {
      const mqtt = await loadMqtt();
      const raw = await crypto.subtle.digest('SHA-256', te.encode(APP_ID + '|' + id));
      const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
      const topic = 's3dart/' + hex(await crypto.subtle.digest('SHA-256', te.encode('topic|' + APP_ID + '|' + id))).slice(0, 32);
      if (seq !== M.joinSeq) return;
      const n = M.net = { key, topic, id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4), seq: 0, clients: [], timer: 0, up: 0 };
      BROKERS.forEach(url => {
        const c = mqtt.connect(url, { clientId: 's3d_' + n.id + '_' + Math.random().toString(36).slice(2, 6), clean: true, keepalive: 30, reconnectPeriod: 5000, connectTimeout: 9000 });
        c.on('connect', () => { c.subscribe(topic, { qos: 0 }, () => { if (M.net === n) { setStatus(''); sendState(); } }); });
        c.on('message', (t, payload) => { if (M.net === n && t === topic) onNet(n, payload.toString()); });
        c.on('error', () => { });
        n.clients.push(c);
      });
      n.timer = setInterval(() => tick(n), SEND_MS);
      setTimeout(() => { if (M.net === n && !n.clients.some(c => c.connected)) setStatus('함께 관람에 연결하지 못했습니다 (혼자 관람 중)'); }, 12000);
    } catch (e) {
      console.warn('함께 관람 연결 실패:', e);
      if (seq === M.joinSeq) { M.roomId = ''; M.net = null; setStatus('함께 관람에 연결하지 못했습니다 (혼자 관람 중)'); }
    }
  }
  async function onNet(n, str) {
    let d; try { d = await unseal(n.key, str); } catch (e) { return; }
    if (!d || M.net !== n || typeof d.i !== 'string' || d.i === n.id || d.i.length > 20) return;
    let p = M.peers.get(d.i);
    if (p && !(d.q > p.seq)) return; // 여러 중계 서버로 온 같은 내용은 한 번만
    if (d.t === 'b') { if (p) removePeer(d.i); return; }
    if (d.t === 's') { const isNew = !p; upsertPeer(d.i, d); p = M.peers.get(d.i); if (isNew && p) sendState(); }
    if (!p) { if (M.peers.size < MAX_PEERS && performance.now() - (n.asked || 0) > 1500) { n.asked = performance.now(); publish({ t: 'q' }); } return; } // 모르는 사람 → 소개 부탁
    p.seq = d.q; p.seen = performance.now();
    if (d.t === 's' || d.t === 'p') onPos([d.x, d.z], d.i);
    else if (d.t === 'c') onChat(d.m, d.i);
    else if (d.t === 'q') { if (performance.now() - (n.told || 0) > 1000) { n.told = performance.now(); sendState(); } }
  }
  function myPos() { const P = M.app.player; return [Math.round(P.pos.x * 100) / 100, Math.round(P.pos.z * 100) / 100]; }
  function sendState() {
    if (!M.net || !M.profile || !M.app.world) return;
    const d = myPos(); M.lastSent = d; M.lastSendAt = M.lastBeat = performance.now();
    publish({ t: 's', n: M.profile.n, a: M.profile.a, x: d[0], z: d[1] });
  }
  function tick(n) {
    if (M.net !== n || !M.app.world) return;
    const now = performance.now();
    if (now - (M.lastBeat || 0) > BEAT_MS) sendState();
    else { const d = myPos(); if (!M.lastSent || M.lastSent[0] !== d[0] || M.lastSent[1] !== d[1]) { M.lastSent = d; M.lastSendAt = now; publish({ t: 'p', x: d[0], z: d[1] }); } }
    M.peers.forEach(p => { if (now - p.seen > GONE_MS) removePeer(p.id); });
  }

  /* ---------- 대화 ---------- */
  function say(name, text, mine) {
    const log = $('#chatLog'); if (!log || !chatOn) return;
    const row = document.createElement('div'); row.className = 'chat-row' + (name ? (mine ? ' mine' : '') : ' sys');
    if (name) { const b = document.createElement('b'); b.textContent = name; row.appendChild(b); }
    row.appendChild(document.createTextNode(text)); log.appendChild(row);
    while (log.children.length > 40) log.firstChild.remove();
    log.scrollTop = log.scrollHeight;
  }
  function onChat(t, id) {
    if (!chatOn) return;
    const p = M.peers.get(id), now = performance.now(); if (!p || typeof t !== 'string') return;
    if (now - p.lastChat < 700) return; p.lastChat = now; // 도배 방지
    const text = cleanText(t); if (!text) return;
    say(p.name, text); showBubble(p, text);
  }
  function sendChat() {
    const inp = $('#chatInput'), text = inp.value.replace(/[\r\n]+/g, ' ').trim().slice(0, TEXT_MAX); if (!text) return;
    const bad = window.BadWords.find(text);
    if (bad) { M.app.toast('고운 말을 써 주세요. 보낼 수 없는 표현이 들어 있습니다.'); return; }
    const now = performance.now(); if (now - M.lastChatAt < 1500) { M.app.toast('조금 천천히 보내 주세요.'); return; }
    if (!M.net || !M.net.clients.some(c => c.connected)) { M.app.toast(M.profile && !M.solo ? '아직 연결하는 중입니다. 잠시 뒤에 다시 보내 주세요.' : '먼저 이름과 아바타를 골라 주세요.'); if (!M.profile || M.solo) openPicker(); return; }
    M.lastChatAt = now; inp.value = '';
    publish({ t: 'c', m: text });
    say(M.profile.n, text, true);
  }

  /* ---------- 화면 ---------- */
  function setStatus(t) { M.status = t; const el = $('#chatStatus'); if (el) { el.textContent = t; el.hidden = !t; } }
  function renderCount() {
    const n = $('#peopleN'); if (n) n.textContent = String(M.peers.size + 1);
    const who = $('#avWho'); if (who) who.textContent = M.net && M.profile ? `지금 이 미술관에 함께 있는 사람: ${[M.profile.n + '(나)', ...[...M.peers.values()].map(p => p.name)].join(', ')}` : '';
  }
  function openPicker() {
    const p = M.profile || { n: '', a: Math.floor(Math.random() * AVATARS.length) };
    $('#avName').value = p.n; M.picked = p.a; $('#avMsg').textContent = '';
    $('#avGrid').innerHTML = AVATARS.map((a, i) => `<button type="button" data-i="${i}" title="${a.n}" style="--c:${a.c}">${a.e}</button>`).join('');
    const mark = () => $('#avGrid').querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.i === M.picked));
    $('#avGrid').onclick = e => { const b = e.target.closest('button'); if (b) { M.picked = +b.dataset.i; mark(); } };
    mark(); renderCount(); M.app.openModal('avatarModal');
    setTimeout(() => { if (!p.n) $('#avName').focus(); }, 100);
  }
  function savePicker() {
    const raw = $('#avName').value.replace(/[<>\r\n]/g, '').trim().slice(0, NAME_MAX), msg = $('#avMsg');
    if (!raw) { msg.className = 'upd-msg err'; msg.textContent = '이름을 적어 주세요.'; $('#avName').focus(); return; }
    if (window.BadWords.has(raw)) { msg.className = 'upd-msg err'; msg.textContent = '이 이름은 쓸 수 없습니다. 다른 이름을 적어 주세요.'; return; }
    M.profile = { n: raw, a: M.picked }; M.solo = false; LS.set('mp_profile', JSON.stringify(M.profile));
    M.app.closeModal('avatarModal'); document.body.classList.remove('mp-solo');
    if (M.net) sendState(); else join();
  }
  function goSolo() {
    M.solo = true; leaveRoom(); M.app.closeModal('avatarModal'); document.body.classList.add('mp-solo');
    M.app.toast('혼자 관람합니다. 오른쪽 위 👥 버튼으로 언제든 함께 관람할 수 있어요.');
  }

  window.Multi = {
    enabled, chatOn, AVATARS,
    init(app) {
      M.app = app;
      document.body.classList.toggle('mp-on', enabled); document.body.classList.toggle('mp-chat', chatOn);
      if (!enabled) return;
      $('#peopleBtn').onclick = () => openPicker();
      $('#avOk').onclick = () => savePicker();
      $('#avSolo').onclick = () => goSolo();
      $('#avName').addEventListener('keydown', e => { if (e.key === 'Enter') savePicker(); });
      if (!chatOn) return;
      $('#chatForm').addEventListener('submit', e => { e.preventDefault(); sendChat(); });
      $('#chatInput').addEventListener('keydown', e => { if (e.key === 'Escape') e.target.blur(); });
      addEventListener('keydown', e => {
        if (e.key !== 'Enter' || !app.museum || document.body.classList.contains('modal-open') || /INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName)) return;
        e.preventDefault(); $('#chatInput').focus();
      });
    },
    // 미술관에 들어왔을 때 (전시 갱신으로 다시 지을 때도 불림)
    enter() {
      if (!enabled) return;
      const w = M.app.world; if (!w) return;
      M.group = new THREE.Group(); w.scene.add(M.group);
      M.peers.forEach(p => { p.mesh = null; p.bubble = null; buildMesh(p); });
      if (M.solo) return;
      if (!M.profile) { setTimeout(() => { if (M.app.museum && !M.profile && !M.solo) openPicker(); }, 1200); return; }
      join();
    },
    leave() { M.group = null; if (enabled) leaveRoom(); const log = $('#chatLog'); if (log) log.innerHTML = ''; },
    update(dt) {
      if (!M.net) return;
      const now = performance.now(), cam = M.app.camera.position;
      M.peers.forEach(p => {
        if (!p.mesh || !p.has) return;
        const dx = p.tx - p.x, dz = p.tz - p.z, d = Math.hypot(dx, dz), k = Math.min(1, dt * 9);
        p.x += dx * k; p.z += dz * k;
        if (d > 0.03) { p.walk += dt * 10; p.mesh.rotation.y = Math.atan2(dx, dz); }
        p.mesh.position.set(p.x, d > 0.03 ? Math.abs(Math.sin(p.walk)) * 0.05 : 0, p.z);
        // 바로 코앞에 겹치면 시야를 가리지 않게 숨김
        p.mesh.visible = Math.hypot(p.x - cam.x, p.z - cam.z) > 0.45;
        if (p.bubble && now > p.bubbleUntil) { drop(p.bubble); p.bubble = null; }
      });
    },
    // 미니맵에 다른 사람 점 찍기
    drawMap(g, tx, tz) {
      M.peers.forEach(p => { if (!p.has) return; g.fillStyle = avatarOf(p.a).c; g.strokeStyle = '#fff'; g.lineWidth = 1; g.beginPath(); g.arc(tx(p.x), tz(p.z), 3.5, 0, 7); g.fill(); g.stroke(); });
    },
    _state: M
  };
})();
