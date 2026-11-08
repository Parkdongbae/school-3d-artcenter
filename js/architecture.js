/* =========================================================
 * Arch: 미술관별 외관 · 로비 · 천장 스타일
 * ========================================================= */
(function () {
  const PI = Math.PI;
  const C = () => window.ART_CONFIG;

  /* ---------- 공통: 건물 외피 ---------- */
  // 정면(z=0)에 폭 6m 출입구, 측면/후면 벽, 지붕
  function shell(w, L, o) {
    const bw = L.BW / 2 + 0.35, bl = L.BL + 0.35, H = o.h, mat = o.mat, uv = o.uv || 4;
    const fm = o.frontMat || mat;
    // 정면
    if (!o.noFront) {
      const fw = o.frontW ? o.frontW / 2 : bw;
      w.wall(-fw, 0.2, -3.2, 0.2, o.frontH || H, fm, { thick: 0.4, uv, shadow: 'both' });
      w.wall(3.2, 0.2, fw, 0.2, o.frontH || H, fm, { thick: 0.4, uv, shadow: 'both' });
      w.wall(-3.2, 0.2, 3.2, 0.2, (o.frontH || H) - 4.4, fm, { thick: 0.4, uv, y0: 4.4, shadow: 'both' });
    }
    w.wall(-bw, o.leftOpenD ? -o.leftOpenD : 0.4, -bw, -bl, H, mat, { thick: 0.4, uv, shadow: 'both' });
    w.wall(bw, 0.4, bw, -bl, H, mat, { thick: 0.4, uv, shadow: 'both' });
    w.wall(-bw, -bl, bw, -bl, H, mat, { thick: 0.4, uv, shadow: 'both' });
    // 지붕 (로비 위를 비우는 옵션)
    const roofM = o.roofMat || w.M({ color: '#5a5955', rough: 0.9 });
    const rt = 0.4;
    if (o.lobbyOpen) {
      const lw = o.openW / 2, ld = o.openD;
      w.box(bw * 2, rt, bl - ld, roofM, 0, H, -ld - (bl - ld) / 2, { shadow: 'both' });
      w.box(bw - lw, rt, ld + 0.4, roofM, -(lw + bw) / 2, H, -ld / 2 + 0.2, { shadow: 'both' });
      w.box(bw - lw, rt, ld + 0.4, roofM, (lw + bw) / 2, H, -ld / 2 + 0.2, { shadow: 'both' });
    } else w.box(bw * 2, rt, bl + 0.4, roofM, 0, H, -bl / 2 + 0.2, { shadow: 'both' });
    // 처마 띠
    if (o.coping) { w.box(bw * 2 + 0.3, 0.35, 0.6, o.coping, 0, H, 0.3, { shadow: 'cast' }); }
  }
  function titleBanner(w, x, y, z, bw, bh, accent, ry = 0) {
    const pw = 1024, ph = Math.round(pw * bh / bw);
    const t = Tex.poster({ w: pw, h: ph, bg: accent, titleScale: bh / bw > 0.9 ? 0.085 : 0.13, logoScale: bh / bw > 0.9 ? 0.09 : 0.14 }); w.textures.push(t);
    return w.plane(bw, bh, w.M({ map: t, rough: 0.8 }), x, y, z, 0, ry, { order: 2 });
  }
  function nameplate(w, m, x, y, z, color = '#1a1a1a', ry = 0, wdt = 9) {
    return w.banner([{ text: m.name, size: 70, color }], wdt, wdt * 0.11, x, y, z, ry, { pw: 1024, ph: 112 });
  }
  function lampPosts(w, pts, color = '#ffd9a0') {
    const pole = w.M({ color: '#2b2b2b', metal: 0.7, rough: 0.4 }), head = w.Basic(color, 3);
    pts.forEach(([x, z]) => { w.cyl(0.06, 0.08, 4, 8, pole, x, 0, z, { shadow: 'cast' }); w.box(0.5, 0.12, 0.5, head, x, 4, z); w.seg(x, z, x + 0.01, z, 0.12); });
  }
  function sculpture(w, x, z, color, kind = 'arc') {
    const m = w.M({ color, rough: 0.35, metal: 0.4 });
    if (kind === 'arc') {
      for (let i = 0; i < 3; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(2.2 - i * 0.5, 0.18, 12, 48, PI * 1.2), m); t.position.set(x + i * 0.3, 0.1, z); t.rotation.set(0, i * 0.7, 0); w.shadow(t, 'both'); w.scene.add(t); }
      w.circleCollider(x, z, 2.4, 12);
    } else if (kind === 'figures') { // 군상(사람 무리)에서 영감을 받은 검은 형상
      const r = Tex.rng(42);
      for (let i = 0; i < 26; i++) {
        const a = r() * PI * 2, d = Math.sqrt(r()) * 6, px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d * 0.6, h = 1.4 + r() * 0.6;
        const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, h - 0.5, 4, 8), m); body.position.set(px, h / 2, pz); body.rotation.z = (r() - 0.5) * 0.6; w.shadow(body, 'both'); w.scene.add(body);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), m); head.position.set(px + Math.sin(-body.rotation.z) * h * 0.5, h + 0.05, pz); w.shadow(head, 'cast'); w.scene.add(head);
        [-1, 1].forEach(s => { const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.6, 3, 6), m); arm.position.set(px + s * 0.22, h * 0.72, pz); arm.rotation.z = s * (0.6 + r() * 1.8); w.scene.add(arm); });
      }
      w.circleCollider(x, z, 6.3, 18);
    }
  }
  function hanok(w, x, z, ry = 0) { // 미술관 옆 전통 건축의 분위기
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; w.scene.add(g);
    const stone = w.M({ map: w.tex('granite', 2, 1), rough: 0.9 }), wood = w.M({ color: '#7a3e2a', rough: 0.7 }), tile = w.M({ color: '#3d3f44', rough: 0.8 }), paper = w.M({ color: '#efe6d2', rough: 1 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(14, 0.8, 7), stone); base.position.y = 0.4; g.add(base);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 3, 10), wood); c.position.set(-6 + i * 2.4, 2.3, -2.5 + j * 5); g.add(c); }
    const wallM = new THREE.Mesh(new THREE.BoxGeometry(11.5, 2.6, 4.4), paper); wallM.position.y = 2.1; g.add(wallM);
    const beam = new THREE.Mesh(new THREE.BoxGeometry(13, 0.4, 5.4), wood); beam.position.y = 3.9; g.add(beam);
    const roofG = new THREE.CylinderGeometry(0.01, 1, 1, 4, 1); roofG.rotateY(PI / 4);
    const roof = new THREE.Mesh(roofG, tile); roof.scale.set(12.5, 2.2, 6.4); roof.position.y = 5.2; g.add(roof);
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(9, 0.35, 0.4), tile); ridge.position.y = 6.25; g.add(ridge);
    g.traverse(o => o.isMesh && w.shadow(o, 'both'));
    const c = Math.cos(ry), s = Math.sin(ry); const pts = [[-7, -3.5], [7, -3.5], [7, 3.5], [-7, 3.5]].map(([a, b]) => [x + a * c + b * s, z - a * s + b * c]);
    for (let i = 0; i < 4; i++) w.seg(pts[i][0], pts[i][1], pts[(i + 1) % 4][0], pts[(i + 1) % 4][1], 0.05);
  }
  function volume(w, x0, x1, z0, z1, y0, y1, mat, o = {}) { // 바닥면 없는 상자 (안에서 올려다봐도 막히지 않음)
    const h = y1 - y0, uv = o.uv || 4;
    w.wall(x0, z1, x1, z1, h, mat, { thick: 0.4, y0, uv, collide: false, shadow: 'both' }); w.wall(x0, z0, x1, z0, h, mat, { thick: 0.4, y0, uv, collide: false, shadow: 'both' });
    w.wall(x0, z0, x0, z1, h, mat, { thick: 0.4, y0, uv, collide: false, shadow: 'both' }); w.wall(x1, z0, x1, z1, h, mat, { thick: 0.4, y0, uv, collide: false, shadow: 'both' });
    if (!o.noTop) w.box((o.topX1 ?? x1) - x0 + 0.4, 0.4, z1 - z0 + 0.4, o.topMat || mat, (x0 + (o.topX1 ?? x1)) / 2, y1, (z0 + z1) / 2, { shadow: 'both' });
  }
  function scatter(n, fn, seed = 1) { const r = Tex.rng(seed), out = []; let guard = 0; while (out.length < n && guard++ < n * 30) { const p = fn(r); if (p) out.push(p); } return out; }
  function mountainsFor(w) {
    const s = w.m.sky; if (!s.mountains) return;
    const col = new THREE.Color(s.mountains).lerp(new THREE.Color(s.horizon), 0.45);
    const mat = new THREE.MeshBasicMaterial({ color: col, fog: false });
    const r = Tex.rng(9);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * PI * 2 + r() * 0.3, dist = 520 + r() * 160, rad = 110 + r() * 150, h = 70 + r() * 90;
      const geo = new THREE.ConeGeometry(rad, h, 10, 4); const p = geo.attributes.position;
      for (let k = 0; k < p.count; k++) if (p.getY(k) < h / 2 - 1) { p.setX(k, p.getX(k) * (0.75 + r() * 0.5)); p.setZ(k, p.getZ(k) * (0.75 + r() * 0.5)); }
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, mat); m.position.set(Math.sin(a) * dist, h / 2 - 12, -Math.cos(a) * dist); m.scale.y = 0.7; w.scene.add(m);
    }
    if (s.halla) { // 한라산
      const geo = new THREE.CylinderGeometry(60, 520, 150, 32, 4); const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color('#5d7d70').lerp(new THREE.Color(s.horizon), 0.35), fog: false }));
      m.position.set(-40, 63, -720); w.scene.add(m);
    }
  }
  function mirror(w, objs) { // 물에 비친 반사상 (y=0 기준 뒤집기)
    const g = new THREE.Group(); g.scale.y = -1; w.scene.add(g);
    objs.forEach(o => { if (!o) return; const c = o.clone(); c.castShadow = c.receiveShadow = false; g.add(c); });
    return g;
  }

  /* ---------- 로비 공통 ---------- */
  function lobbyBox(w, L, o = {}) {
    const lw = L.LW / 2, ld = L.LD, H = o.h || L.lobbyH, mat = o.wallMat || w.matWall, uv = o.uv || w.matWallUV;
    const wallH = o.wallH || H;
    w.floorRect(-lw, 0, lw, -ld, o.floorMat || w.floorMat(L.LW, L.LD), 0.002);
    // 앞벽 (출입구)
    if (!o.frontGlass) { w.wall(-lw, -0.15, -3.2, -0.15, wallH, mat, { uv }); w.wall(3.2, -0.15, lw, -0.15, wallH, mat, { uv }); w.wall(-3.2, -0.15, 3.2, -0.15, wallH - 4.4, mat, { uv, y0: 4.4 }); }
    // 옆벽
    if (!o.noLeft) w.wall(-lw - 0.15, 0, -lw - 0.15, -ld, wallH, mat, { uv });
    if (!o.noRight) w.wall(lw + 0.15, 0, lw + 0.15, -ld, wallH, mat, { uv });
    // 뒷벽 (복도 입구 8m)
    w.wall(-lw, -ld - 0.15, -4, -ld - 0.15, wallH, mat, { uv }); w.wall(4, -ld - 0.15, lw, -ld - 0.15, wallH, mat, { uv });
    w.wall(-4, -ld - 0.15, 4, -ld - 0.15, wallH - World.GALLERY_H, mat, { uv, y0: World.GALLERY_H });
    if (!o.noCeil) w.ceilRect(-lw, 0, lw, -ld, o.ceilMat || w.matCeil, H);
    w.aoStrip(-lw, -0.3, lw, -0.3, 0, -1); w.aoStrip(-lw, -ld, -4, -ld, 0, 1); w.aoStrip(4, -ld, lw, -ld, 0, 1);
    if (!o.noLeft) w.aoStrip(-lw, 0, -lw, -ld, 1, 0); if (!o.noRight) w.aoStrip(lw, 0, lw, -ld, -1, 0);
    w.door(0, 0.2, 6.4, 4.4, o.doorFrame || '#222');
    w.mapShapes.push({ type: 'rect', x0: -lw, z0: -ld, x1: lw, z1: 0, color: 'rgba(255,255,255,0.18)', label: '로비' });
  }
  // 환영 벽: 전시 제목 + 전시실 안내판 + 안내 데스크
  function welcome(w, L, o = {}) {
    const c = C(), I = w.m.interior, dark = !!I.dark, ink = o.ink || (dark ? '#f5f5f5' : '#151515');
    const lw = L.LW / 2, ld = L.LD, zb = -ld + 0.02;
    const tx = o.titleX ?? -(lw + 4) / 2 - 0.5;
    const TW = o.titleW || Math.min(10, lw - 4.5), ty = o.titleY || 3.4, tz = o.titleZ ?? zb, tr = o.titleRy || 0;
    const TH = TW * 0.5, pt = Tex.poster({ w: 1024, h: 512, ink, sub: dark ? '#bdbdbd' : '#5a5a5a', titleScale: 0.13, logoScale: 0.14, accentBar: null });
    w.textures.push(pt);
    w.plane(TW, TH, w.M({ map: pt, transparent: true, rough: 0.9, zone: 'in' }), tx + Math.sin(tr) * 0.03, ty + 0.3, tz + Math.cos(tr) * 0.03, 0, tr, { order: 2 });
    if (o.stand) stand(w, tx, tz, TW + 0.4, ty + 0.3 + TH / 2 + 0.2);
    if (o.panel && !tr) w.box(TW + 0.6, TH + 0.3, 0.05, w.M({ color: o.panel, rough: 0.9, zone: 'in' }), tx, ty + 0.3 - TH / 2 - 0.15, tz + 0.01);
    // 안내판
    const rooms = w.L.rooms.map(R => `${R.side === 0 ? '←' : '→'}  ${R.room.label}   ${R.room.artworks.length}점`);
    const lines = [{ text: '전시 안내', size: 56, color: ink }, { text: w.m.name + ' 모티프 가상관', size: 26, weight: 400, color: dark ? '#9a9a9a' : '#777', lh: 1.8 }]
      .concat((rooms.length ? rooms : ['전시실 준비 중']).slice(0, 14).map(t => ({ text: t, size: 32, weight: 500, color: ink, lh: 1.5 })));
    const dx = o.dirX ?? (lw + 4) / 2 + 0.5, bh = Math.max(3.2, 1.6 + lines.length * 0.28);
    const dr = o.dirRy || 0, dz0 = o.dirZ ?? zb;
    w.banner(lines, 4.2, bh, dx + Math.sin(dr) * 0.03, 0.6 + bh / 2 + 0.6, dz0 + Math.cos(dr) * 0.03, dr, { pw: 640, ph: Math.round(640 * bh / 4.2), zone: 'in', align: 'left', pad: 50 });
    if (o.stand) stand(w, dx, dz0, 4.6, 1.2 + bh + 0.2);
    // 데스크
    if (!o.noDesk) {
      const desk = w.M({ color: o.deskColor || (dark ? '#202024' : '#f2efe9'), rough: 0.5, zone: 'in' });
      const top = w.M({ color: o.deskTop || (dark ? '#59ffa8' : w.m.accent), rough: 0.4, zone: 'in' });
      const dz = o.deskZ ?? -ld * 0.42, dxx = o.deskX ?? lw - 5;
      w.box(4.2, 1.05, 1.0, desk, dxx, 0, dz, { collide: true });
      w.box(4.3, 0.05, 1.1, top, dxx, 1.05, dz);
      w.banner([{ text: 'INFORMATION', size: 40, color: dark ? '#ddd' : '#333', spacing: 6 }], 2.2, 0.28, dxx, 0.7, dz + 0.51, 0, { pw: 512, ph: 64, zone: 'in' });
    }
  }
  function stand(w, x, z, wd, ht) { // 자립형 안내판 몸체
    const m = w.M({ color: w.m.interior.dark ? '#1b1b1f' : '#f7f5f0', rough: 0.7, zone: 'in' });
    w.box(wd, ht, 0.12, m, x, 0, z - 0.06, { collide: true }); w.box(wd, 0.06, 0.6, w.matTrim, x, 0, z - 0.06);
  }
  function downlights(w, x0, z0, x1, z1, y, step = 3, color) {
    const n = []; for (let x = x0 + step / 2; x < x1; x += step) for (let z = z0 + step / 2; z < z1; z += step) n.push([x, z]);
    if (!n.length) return;
    const geo = new THREE.CircleGeometry(0.16, 16); geo.rotateX(PI / 2);
    const im = new THREE.InstancedMesh(geo, w.Basic(color || w.m.interior.light, 3), n.length); const d = new THREE.Object3D();
    n.forEach((p, i) => { d.position.set(p[0], y - 0.01, p[1]); d.updateMatrix(); im.setMatrixAt(i, d.matrix); }); w.scene.add(im);
  }
  function instBoxes(w, list, mat) { // [x,y,z,sx,sy,sz,ry]
    if (!list.length) return null;
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, list.length), d = new THREE.Object3D();
    list.forEach((b, i) => { d.position.set(b[0], b[1], b[2]); d.scale.set(b[3], b[4], b[5]); d.rotation.set(0, b[6] || 0, 0); d.updateMatrix(); im.setMatrixAt(i, d.matrix); });
    w.scene.add(im); return im;
  }

  /* =========================================================
   * 외관
   * ========================================================= */
  const exterior = {
    seoul(w, L) {
      w.buildGround();
      const terr = w.M({ map: w.tex('terracotta', 1, 1), rough: 0.8 });
      const gran = w.M({ map: w.tex('granite', 2, 1), color: '#dcd9d3', rough: 0.6 });
      const H = 8, bw = L.BW / 2 + 0.35;
      shell(w, L, { h: H, mat: terr, uv: 6, lobbyOpen: true, openW: L.LW, openD: L.LD, coping: w.M({ color: '#9a948a', rough: 0.6, metal: 0.2 }) });
      // 연회색 화강석 기단 + 고측창(높은 띠창)
      [[-bw, -3.3], [3.3, bw]].forEach(([a, b]) => w.wall(a, 0.42, b, 0.42, 1.3, gran, { thick: 0.08, uv: 4, collide: false }));
      const clere = w.M({ color: '#2b3a42', rough: 0.08, metal: 0.8, envI: 1.4 });
      [[-bw, -14.4], [14.4, bw]].forEach(([a, b]) => w.box(b - a - 1, 0.9, 0.06, clere, (a + b) / 2, 6.3, 0.44));
      [-1, 1].forEach(sx => w.box(0.06, 0.9, L.BL - 4, clere, sx * (bw + 0.22), 6.3, -L.BL / 2));
      // 서울박스: 로비 위 유리 상자
      const glass = w.glassMat('#b9d0d8', 0.2), mull = w.M({ color: '#2a2a2a', metal: 0.7, rough: 0.35 });
      const lw = L.LW / 2, ld = L.LD, top = L.lobbyH;
      [[-lw, 0.1, lw, 0.1], [-lw, -ld, lw, -ld], [-lw, 0.1, -lw, -ld], [lw, 0.1, lw, -ld]].forEach(([ax, az, bx, bz]) => {
        w.wall(ax, az, bx, bz, top - H, glass, { thick: 0.05, y0: H, collide: false });
        const len = Math.hypot(bx - ax, bz - az), n = Math.round(len / 2.4);
        for (let i = 0; i <= n; i++) { const t = i / n; w.box(0.12, top - H, 0.12, mull, ax + (bx - ax) * t, H, az + (bz - az) * t); }
      });
      w.box(L.LW, 0.06, ld, glass, 0, top, -ld / 2);
      for (let x = -lw; x <= lw + 0.01; x += 2.4) w.box(0.1, 0.25, ld, mull, x, top - 0.25, -ld / 2);
      // 미술관 마당(잔디)
      const lawn = w.M({ map: w.tex('grass', 6, 6), rough: 1 });
      w.floorRect(10, 6, 44, 34, lawn, 0.01, { shadow: 'recv' });
      w.mapShapes.push({ type: 'rect', x0: 10, z0: 6, x1: 44, z1: 34, color: 'rgba(120,180,90,0.35)' });
      // 옛 기무사 건물: 3층 붉은 벽돌 (거리 쪽 앞 건물)
      const brick = w.M({ map: w.tex('brick', 1, 1), rough: 0.9 });
      const bx0 = -31, bz0 = 18, bW = 22, bD = 12, bH = 12;
      w.box(bW, bH, bD, brick, bx0, 0, bz0, { collide: true, shadow: 'both' });
      { const uv = w.scene.children[w.scene.children.length - 1].geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * bW / 4, uv.getY(i) * bH / 4); }
      w.box(6, bH + 2, 1, brick, bx0, 0, bz0 + bD / 2 + 0.3, { shadow: 'both' });
      const win = w.M({ color: '#26323a', rough: 0.15, metal: 0.6 }), trim = w.M({ color: '#efe9de', rough: 0.7 });
      for (let fl = 0; fl < 3; fl++) for (let i = -4; i <= 4; i++) { if (Math.abs(i) < 1.2) continue; const x = bx0 + i * 2.2, y = 1.2 + fl * 3.6; w.box(1.3, 2.0, 0.1, trim, x, y - 0.1, bz0 + bD / 2 + 0.02); w.box(1.1, 1.8, 0.12, win, x, y, bz0 + bD / 2 + 0.04); }
      w.box(2.4, 3, 0.2, win, bx0, 0, bz0 + bD / 2 + 0.85); w.box(bW + 0.4, 0.4, bD + 0.4, trim, bx0, bH, bz0);
      // 종친부(전통 건물)와 큰 비술나무
      hanok(w, 36, -12, -PI / 2);
      w.trees([[30, 2, 1.9]], 'round', { leaf: '#5f8a44' });
      w.trees([[14, 10], [22, 10], [30, 10], [40, 10], [40, 30], [14, 30]], 'round');
      w.trees(scatter(40, r => { const x = (r() - 0.5) * 220, z = -r() * 160 - 10; return Math.abs(x) < L.BW / 2 + 8 && z > -L.BL - 8 ? null : [x, z]; }, 3), 'round', { noCollide: true });
      w.noGrass = [[10, 6, 44, 34]];
      titleBanner(w, 9.5, 4.0, 0.42, 5.5, 6.4, w.m.accent);
      nameplate(w, w.m, -9, 6.6, 0.42, '#4a3a2c', 0, 11);
      lampPosts(w, [[-6, 14], [6, 14], [-6, 26], [6, 26]]);
      w.bench(-4, 40, 0, 3, 'out'); w.bench(4, 40, 0, 3, 'out');
      w.spawn = { pos: new THREE.Vector3(0, 0, 46), yaw: 0 };
    },
    gwacheon(w, L) {
      w.buildGround();
      const rough = w.M({ map: w.tex('stoneBlocks', 1, 1), color: '#f0d3c2', rough: 0.95 });   // 괴산석 분홍빛 할석
      const smooth = w.M({ map: w.tex('granite', 1, 1), color: '#ecc9b6', rough: 0.6 });
      const H = 9, bw = L.BW / 2 + 0.35;
      shell(w, L, { h: H, mat: rough, uv: 7, lobbyOpen: true, openW: L.LW + 1.4, openD: L.LD, coping: w.M({ color: '#c9a896', rough: 0.8 }) });
      // 램프코어 원통 (매끈한 돌)
      const R = L.LW / 2 + 0.6, cz = -L.LD / 2;
      const towerM = w.M({ map: w.tex('granite', 8, 2), color: '#ecc9b6', rough: 0.6 });
      w.cyl(R, R, L.lobbyH + 2 - H, 56, towerM, 0, H, cz, { shadow: 'both', open: true }); w.cyl(R, R, 0.3, 56, w.M({ color: '#a8907e' }), 0, L.lobbyH + 1.7, cz);
      w.cyl(R + 0.4, R + 0.4, 0.8, 56, w.M({ color: '#c9a896', rough: 0.8 }), 0, L.lobbyH + 1.6, cz, { shadow: 'cast' });
      const win = w.M({ color: '#1d242a', rough: 0.15, metal: 0.6 });
      for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2 + PI / 8; w.box(0.7, 2.4, 0.3, win, Math.sin(a) * (R - 0.05), L.lobbyH - 3, cz + Math.cos(a) * (R - 0.05), { ry: a }); }
      // 산사처럼 층층이 쌓인 돌 단(段)
      [-1, 1].forEach(sx => {
        for (let i = 0; i < 4; i++) {
          const wdt = 14 - i * 2.5, h = 7.5 - i * 1.8, x = sx * (bw + 5 + i * 5.5);
          w.box(wdt, h, 26 - i * 4, rough, x, 0, -9 + i * 1.5, { collide: true, shadow: 'both' });
          w.box(wdt + 0.4, 0.35, 26 - i * 4 + 0.4, smooth, x, h, -9 + i * 1.5, { shadow: 'cast' });
        }
      });
      // 반영못 + 조각 잔디정원
      w.water(-44, 16, -9, 38, 0.04, '#33454a'); w.water(9, 16, 44, 38, 0.04, '#33454a');
      [[-44, -9], [9, 44]].forEach(([a, b]) => { w.seg(a, 16, b, 16, 0.15); w.seg(a, 38, b, 38, 0.15); w.seg(a, 16, a, 38, 0.15); w.seg(b, 16, b, 38, 0.15);
        w.box(b - a, 0.3, 0.4, smooth, (a + b) / 2, 0, 16, { shadow: 'both' }); w.box(b - a, 0.3, 0.4, smooth, (a + b) / 2, 0, 38, { shadow: 'both' }); });
      const lawn = w.M({ map: w.tex('grass', 6, 4), rough: 1 }); w.floorRect(-46, 42, -12, 66, lawn, 0.01, { shadow: 'recv' }); w.floorRect(12, 42, 46, 66, lawn, 0.01, { shadow: 'recv' });
      sculptures(w, [[-36, 50, 'bronze', '#7a5a34'], [-22, 58, 'arc', '#b8352b'], [24, 50, 'stack', '#6d6a64'], [36, 60, 'column', '#d9d2c6']]);
      titleBanner(w, 0, 5.2, 0.42, 6.0, 3.4, w.m.accent);
      nameplate(w, w.m, 0, 7.8, 0.42, '#5a3f30', 0, 10);
      mountainsFor(w);
      w.trees(scatter(70, r => { const x = (r() - 0.5) * 260, z = (r() - 0.5) * 260; return (Math.abs(x) < 70 && z > -L.BL - 10 && z < 70) ? null : [x, z]; }, 5), 'pine', { noCollide: true });
      w.trees([[-8, 44], [8, 44], [-8, 60], [8, 60]], 'round');
      lampPosts(w, [[-5, 12], [5, 12], [-5, 28], [5, 28]]);
      w.spawn = { pos: new THREE.Vector3(0, 0, 56), yaw: 0 };
    },
    cheongju(w, L) {
      w.plazaW = 130; w.buildGround();
      const conc = w.M({ map: w.tex('concrete', 1, 1), color: '#f1f0ec', rough: 0.85 });   // 흰·연회색 옛 공장 콘크리트
      const H = 20, span = 60, bw = L.BW / 2 + 0.35;
      shell(w, L, { h: H, mat: conc, uv: 4, noFront: true });
      // 길이 120m의 긴 상자: 양옆 연장
      [-1, 1].forEach(sx => w.box(span - bw, H, 33, conc, sx * (bw + (span - bw) / 2), 0, -16.6, { collide: true, shadow: 'both' }));
      w.box(span * 2, 0.4, 3.9, conc, 0, H, 1.65, { shadow: 'both' });
      // 1층: 유리벽 + 앞쪽 기둥 회랑, 위층은 창이 거의 없는 흰 상자
      glassFront(w, -span, span, 5.5, 0, true, 0.2);
      const up = w.wall(-span, 3.4, span, 3.4, H - 5.5, conc, { thick: 0.4, uv: 4, y0: 5.5, collide: false, shadow: 'both' });
      w.box(span * 2, 0.5, 3.6, conc, 0, 5.2, 1.8, { shadow: 'both' });
      const col = w.M({ color: '#e7e5df', rough: 0.8 });
      for (let x = -span + 3; x <= span - 3; x += 6) { if (Math.abs(x) < 3.5) continue; w.box(0.7, 5.2, 0.7, col, x, 0, 3.0, { collide: true, shadow: 'both' }); }
      [-1, 1].forEach(sx => w.wall(sx * span, 0.2, sx * span, 3.6, H - 5.5, conc, { thick: 0.4, y0: 5.5, collide: false }));
      const slit = w.M({ color: '#3a4044', rough: 0.2, metal: 0.5 });
      for (let x = -span + 8; x < span - 8; x += 16) w.box(5, 0.35, 0.06, slit, x, 13, 3.62);
      // 외벽의 휘어진 대형 디지털 사이니지 (전시 포스터 표시)
      const pt = Tex.poster({ w: 1024, h: 440, bg: '#16181c', titleScale: 0.15, logoScale: 0.14 }); w.textures.push(pt);
      const sg = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 6.5, 32, 1, true, -0.85, 1.7), new THREE.MeshBasicMaterial({ map: pt, toneMapped: true }));
      sg.position.set(38, 14, 3.6 - 9 + 0.3 + 0.0); sg.scale.set(1, 1, 1); w.scene.add(sg);
      sg.position.z = 3.85 - 9 * Math.cos(0.85);
      w.box(15.8, 0.3, 1.2, w.M({ color: '#202226', metal: 0.6 }), 38, 10.6, 3.8); w.box(15.8, 0.3, 1.2, w.M({ color: '#202226', metal: 0.6 }), 38, 17.25, 3.8);
      titleBanner(w, -14, 9.5, 3.66, 7, 4.2, w.m.accent);
      w.banner([{ text: w.m.name, size: 80, color: '#3a3a38' }], 13, 1.15, -14, 15.2, 3.66, 0, { pw: 1024, ph: 90 });
      w.trees(scatter(40, r => { const x = (r() - 0.5) * 260, z = (r() - 0.5) * 220; return (Math.abs(x) < 70 && z > -L.BL - 10 && z < 70) ? null : [x, z]; }, 7), 'round', { noCollide: true });
      w.trees([[-40, 26], [-24, 30], [24, 30], [40, 26]], 'round');
      lampPosts(w, [[-10, 20], [10, 20], [-10, 36], [10, 36]]);
      w.spawn = { pos: new THREE.Vector3(0, 0, 50), yaw: 0 };
    },
    daegu(w, L) {
      w.plazaW = 130; w.buildGround();
      const gran = w.M({ map: w.tex('granite', 1, 1), color: '#dedcd6', rough: 0.6 });   // 밝은 회색 화강석
      const H = 10, bw = L.BW / 2 + 0.35;
      shell(w, L, { h: H, mat: gran, uv: 5, noFront: true, lobbyOpen: true, openW: L.LW + 0.6, openD: L.LD + 0.2 });
      const glassBand = w.M({ color: '#2a3a44', rough: 0.06, metal: 0.8, envI: 1.4 });
      // 가운데 정면: 유리 아래 + 돌 위
      w.wall(-bw, 0.25, -3.2, 0.25, 4.5, glassBand, { thick: 0.15 }); w.wall(3.2, 0.25, bw, 0.25, 4.5, glassBand, { thick: 0.15 });
      w.wall(-bw, 0.3, bw, 0.3, H - 4.5, gran, { thick: 0.6, y0: 4.5, uv: 5, collide: false, shadow: 'both' });
      // 경사지에 엇갈려 겹쳐 놓인 긴 매스들
      const bars = [[-62, -bw, -34, -2, 8], [bw, 64, -30, 5, 11], [-48, -bw, -2, 6, 5], [bw, 44, 5, 12, 4.2]];
      bars.forEach(([x0, x1, z0, z1, h]) => {
        w.box(x1 - x0, h, z1 - z0, gran, (x0 + x1) / 2, 0, (z0 + z1) / 2, { collide: true, shadow: 'both' });
        w.box(x1 - x0 - 2, Math.min(2.2, h - 1.5), 0.08, glassBand, (x0 + x1) / 2, h - Math.min(2.2, h - 1.5) - 0.8, z1 + 0.04);
      });
      // 어미홀 볼륨
      const hall = w.M({ map: w.tex('granite', 2, 2), color: '#ecebe7', rough: 0.7 });
      volume(w, -L.LW / 2 - 0.3, L.LW / 2 + 0.3, -L.LD - 0.3, 0.3, H, L.lobbyH + 1.5, hall);
      const fins = []; for (let x = -L.LW / 2; x <= L.LW / 2; x += 1.2) fins.push([x, H + (L.lobbyH + 1.5 - H) / 2, 0.45, 0.15, L.lobbyH + 1.5 - H, 0.5]);
      const fm = instBoxes(w, fins, w.M({ color: '#f4f2ee', rough: 0.7 })); w.shadow(fm, 'cast');
      // 입구 마당의 상징적인 유리 큐브 (안에서 은은하게 빛남)
      const cx = -16, cz = 16, cs = 8;
      const cg = w.glassMat('#dfeef2', 0.28), mull = w.M({ color: '#d0d4d6', metal: 0.8, rough: 0.3 });
      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([a, b]) => { if (a) w.wall(cx + a * cs / 2, cz - cs / 2, cx + a * cs / 2, cz + cs / 2, cs, cg, { thick: 0.05 }); else w.wall(cx - cs / 2, cz + b * cs / 2, cx + cs / 2, cz + b * cs / 2, cs, cg, { thick: 0.05 }); });
      w.box(cs, 0.08, cs, cg, cx, cs, cz);
      for (let i = 0; i <= 4; i++) { const t = -cs / 2 + i * cs / 4; [[t, -cs / 2], [t, cs / 2], [-cs / 2, t], [cs / 2, t]].forEach(([dx, dz]) => w.box(0.08, cs, 0.08, mull, cx + dx, 0, cz + dz)); }
      w.box(cs - 0.4, 0.05, cs - 0.4, w.Basic('#fff6e4', 1.6), cx, cs - 0.15, cz);
      // 넓은 잔디밭
      const lawn = w.M({ map: w.tex('grass', 6, 4), rough: 1 }); w.floorRect(10, 8, 62, 40, lawn, 0.01, { shadow: 'recv' }); w.noGrass = [[10, 8, 62, 40]];
      sculptures(w, [[30, 22, 'arc', '#c8643c'], [46, 30, 'stack', '#6d6a64']]);
      titleBanner(w, -11, 6.6, 0.65, 7.6, 3.3, w.m.accent);
      w.banner([{ text: w.m.name, size: 84, color: '#3a3a38' }], 9, 1.0, 11, 7.3, 0.65, 0, { pw: 1024, ph: 114 });
      mountainsFor(w);
      w.trees(scatter(80, r => { const x = (r() - 0.5) * 280, z = (r() - 0.5) * 280; return (Math.abs(x) < 74 && z > -L.BL - 10 && z < 64) ? null : [x, z]; }, 11), 'round', { noCollide: true });
      w.trees([[-40, 30], [-30, 40], [56, 46], [20, 46], [-50, 40]], 'round');
      w.spawn = { pos: new THREE.Vector3(0, 0, 50), yaw: 0 };
    },
    daejeon(w, L) {
      w.buildGround();
      const white = w.M({ color: '#e4e2dc', rough: 0.75, map: w.tex('plaster', 6, 6) });
      const H = 12;
      shell(w, L, { h: H, mat: white, uv: 6, coping: w.M({ color: '#e7e5df', rough: 0.7 }) });
      // 붓질 리듬처럼 간격이 달라지는 흰 루버
      const fins = [], bw = L.BW / 2; let x = -bw - 4;
      while (x < bw + 4) { const t = x * 0.35; const gap = 0.35 + (Math.sin(t) * 0.5 + 0.5) * 0.9; if (Math.abs(x) > 3.6) fins.push([x, H / 2, 0.9 + Math.sin(t * 1.7) * 0.25, 0.12, H, 0.9 + Math.cos(t) * 0.4]); x += gap; }
      const fm = instBoxes(w, fins, w.M({ color: '#f4f3ef', rough: 0.6 })); w.shadow(fm, 'both');
      w.box(L.BW + 9, 0.4, 2.4, w.M({ color: '#f4f3ef' }), 0, H, 1.0, { shadow: 'both' });
      w.box(L.BW + 9, 0.4, 2.4, w.M({ color: '#f4f3ef' }), 0, 4.6, 1.0, { shadow: 'both' });
      const dg = w.M({ color: '#2b3940', rough: 0.06, metal: 0.8, envI: 1.4 });
      [-1, 1].forEach(sx => w.box(L.BW / 2 - 4, 3.6, 0.06, dg, sx * (L.BW / 4 + 1.75), 0.6, 0.44)); w.box(L.BW - 1, 3.4, 0.06, dg, 0, 5.4, 0.44);
      // 한옥의 담과 마당을 재해석한 작은 정원들
      const wallW = w.M({ color: '#f1f0eb', rough: 0.8 });
      [[24, 20], [-30, 34]].forEach(([gx, gz]) => { [[-5, -5, 5, -5], [5, -5, 5, 5], [5, 5, -1.5, 5], [-5, 5, -5, -5]].forEach(([a, b, c, d]) => w.wall(gx + a, gz + b, gx + c, gz + d, 2.4, wallW, { thick: 0.3, shadow: 'both' }));
        w.floorRect(gx - 4.8, gz - 4.8, gx + 4.8, gz + 4.8, w.M({ map: w.tex('whiteGravel', 2, 2), rough: 1 }), 0.01); w.trees([[gx, gz, 1.0]], 'round', { leaf: '#6f9a48' }); });
      w.noGrass = [[19, 15, 29, 25], [-35, 29, -25, 39]];
      sculpture(w, -18, 22, '#141414', 'figures');
      titleBanner(w, 13, 1.0, 1.2, 5.6, 3.0, '#1b1b1b');
      w.banner([{ text: w.m.name, size: 80, color: '#1d1d1d' }], 8, 0.9, -7, 5.4, 2.25, 0, { pw: 1024, ph: 115 });
      const lawn = w.M({ map: w.tex('grass', 5, 5), rough: 1 });
      w.floorRect(10, 12, 40, 34, lawn, 0.01, { shadow: 'recv' });
      w.trees([[14, 30], [22, 30], [30, 30], [36, 20]], 'round');
      w.trees(scatter(50, r => { const x = (r() - 0.5) * 230, z = (r() - 0.5) * 230; return (Math.abs(x) < 46 && z > -L.BL - 10 && z < 60) ? null : [x, z]; }, 13), 'round', { noCollide: true });
      w.spawn = { pos: new THREE.Vector3(0, 0, 44), yaw: 0 };
    },
    busan(w, L) {
      w.buildGround();
      const green = w.M({ map: w.tex('plantWall', 1, 1), rough: 1, color: '#f4ffe8' });
      const beige = w.M({ map: w.tex('granite', 1, 1), color: '#e6dccb', rough: 0.7 });   // 인조 석회석·세라믹 패널
      const H = 13;
      shell(w, L, { h: H, mat: beige, uv: 5, frontH: H, roofMat: w.M({ color: '#3b3d3a' }), coping: w.M({ color: '#f0eee8', rough: 0.6 }) });
      // 정면을 덮은 거대한 수직정원
      { const bwq = L.BW / 2 + 0.35; const gw = w.wall(-bwq + 1, 0.55, bwq - 1, 0.55, H - 5.2, green, { thick: 0.3, uv: 6, y0: 4.9, collide: false, shadow: 'both' });
        w.wall(-bwq - 0.3, -2, -bwq - 0.3, -24, H - 5.2, green, { thick: 0.3, uv: 6, y0: 4.9, collide: false }); }
      // 1층 유리 띠
      const glassBand = w.M({ color: '#1d2a30', rough: 0.1, metal: 0.7, envI: 1.5 });
      const bw = L.BW / 2 + 0.35;
      w.box(bw - 3.2, 3.8, 0.2, glassBand, -(bw + 3.2) / 2, 0, 0.45); w.box(bw - 3.2, 3.8, 0.2, glassBand, (bw + 3.2) / 2, 0, 0.45);
      w.box(L.BW + 2, 0.3, 3, w.M({ color: '#ebe8e0', rough: 0.6 }), 0, 4.4, 1.6, { shadow: 'both' });
      // 습지와 갈대
      w.water(-80, 8, -26, 70, 0.03, '#3b4a52'); w.water(26, 8, 80, 70, 0.03, '#3b4a52');
      [-26, 26].forEach(x => w.seg(x, 8, x, 70, 0.1));
      const rt = w.tex('reeds', 1, 1);
      const reedM = new THREE.MeshStandardMaterial({ map: rt, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 1 }); reedM.envMap = w.envOut;
      const r = Tex.rng(21), list = [];
      for (let i = 0; i < (w.low ? 120 : 260); i++) { const s = r() > 0.5 ? 1 : -1; list.push([s * (27 + r() * 50), 8 + r() * 62, r() * PI]); }
      const geo = new THREE.PlaneGeometry(3, 1.5); geo.translate(0, 0.75, 0);
      const im = new THREE.InstancedMesh(geo, reedM, list.length), d = new THREE.Object3D();
      list.forEach((p, i) => { d.position.set(p[0], 0, p[1]); d.rotation.y = p[2]; const sc = 0.8 + r() * 0.6; d.scale.set(sc, sc, sc); d.updateMatrix(); im.setMatrixAt(i, d.matrix); }); w.scene.add(im);
      lampPosts(w, [[-6, 10], [6, 10], [-6, 22], [6, 22], [-6, 34], [6, 34], [-6, 46], [6, 46]], '#ffcf8a');
      titleBanner(w, -9.5, 8.7, 0.75, 6.0, 5.4, '#14171c');
      w.banner([{ text: w.m.name, size: 86, color: '#ffffff' }], 10, 1.2, 9, 10.2, 0.75, 0, { pw: 1024, ph: 123 });
      // 먼 바다
      w.water(-400, -400, 400, -160, 0.02, '#4a5866');
      w.spawn = { pos: new THREE.Vector3(0, 0, 50), yaw: 0 };
    },
    san(w, L) {
      w.plazaW = 8; w.buildGround();
      const stone = w.M({ map: w.tex('stoneBlocks', 1, 1), rough: 0.95, color: '#e8c79a' });   // 꿀빛 파주석
      const conc = w.M({ map: w.tex('concrete', 1, 1), rough: 0.9 });
      const H = 8;
      shell(w, L, { h: H, mat: stone, uv: 6, lobbyOpen: true, openW: L.LW + 0.6, openD: L.LD + 0.2, coping: w.M({ color: '#9d9384', rough: 0.9 }) });
      // 안쪽 콘크리트 상자가 돌벽 위로 솟음 (로비 위, 물의 중정은 하늘로 열림)
      volume(w, -L.LW / 2 - 0.3, L.LW / 2 + 0.3, -L.LD - 0.3, 0.3, H, L.lobbyH + 0.6, conc, { uv: 3.6, topX1: 5 });
      // 진입로: 돌길 + 양쪽 물의 정원
      const path = w.M({ map: w.tex('granitePaving', 1, 12), rough: 0.9 });
      w.floorRect(-3, 0.4, 3, 90, path, 0.02, { shadow: 'recv' });
      w.water(-34, 4, -3.4, 40, 0.04, '#24363a'); w.water(3.4, 4, 34, 40, 0.04, '#24363a');
      [[-34, 4, -3.4, 4], [-34, 40, -3.4, 40], [3.4, 4, 34, 4], [3.4, 40, 34, 40]].forEach(([a, b, c, d]) => w.box(Math.abs(c - a), 0.3, 0.4, w.M({ color: '#b2a998' }), (a + c) / 2, 0, b, { shadow: 'both' }));
      w.seg(-3.2, 4, -3.2, 40, 0.15); w.seg(3.2, 4, 3.2, 40, 0.15);
      // 돌담 진입 게이트
      [-1, 1].forEach(s => w.wall(s * 4.2, 58, s * 26, 58, 3.2, stone, { thick: 0.9, uv: 5, shadow: 'both' }));
      w.box(0.9, 3.2, 0.9, stone, -3.9, 0, 58, { collide: true, shadow: 'both' }); w.box(0.9, 3.2, 0.9, stone, 3.9, 0, 58, { collide: true, shadow: 'both' });
      // 꽃밭
      const flowers = []; const r = Tex.rng(31);
      for (let i = 0; i < (w.low ? 300 : 900); i++) { const s = r() > 0.5 ? 1 : -1; flowers.push([s * (4.5 + r() * 26), 0.15 + r() * 0.2, 60 + r() * 26, 0.25, 0.3, 0.25]); }
      const fl = instBoxes(w, flowers, w.M({ color: '#d77fa1', rough: 0.9 }));
      const leaves = flowers.map(f => [f[0] + 0.1, 0.08, f[2] + 0.1, 0.5, 0.16, 0.5]); instBoxes(w, leaves, w.M({ color: '#4e6b3a', rough: 1 }));
      // 자작나무 길
      const birch = []; for (let z = 44; z < 56; z += 2.2) birch.push([-5.2, z, 0.8], [5.2, z + 1.1, 0.8]);
      w.trees(birch, 'round', { trunk: '#ece8df', leaf: '#8db35a', seed: 9 });
      // 물의 정원의 붉은 강철 아치
      const red = w.M({ color: '#c0281f', rough: 0.4, metal: 0.4 });
      [[0, 0], [0.9, 0.6]].forEach(([o, rr], i) => { const t = new THREE.Mesh(new THREE.TorusGeometry(4.2 - i * 0.6, 0.22, 12, 48, PI), red); t.position.set(-18 + o, 0, 22); t.rotation.y = 0.4 + rr; w.shadow(t, 'both'); w.scene.add(t); });
      // 스톤가든: 신라 고분을 닮은 아홉 개의 돌 둔덕
      const sgM = w.M({ map: w.tex('stoneBlocks', 3, 2), color: '#cdb796', rough: 1 });
      for (let i = 0; i < 9; i++) { const a = i / 9 * PI * 2, rr = 14 + (i % 3) * 4, mx = 46 + Math.cos(a) * rr, mz = -L.BL / 2 + Math.sin(a) * rr; const m = new THREE.Mesh(new THREE.SphereGeometry(3 + (i % 3), 24, 12, 0, PI * 2, 0, PI / 2), sgM); m.scale.y = 0.55; m.position.set(mx, 0, mz); w.shadow(m, 'both'); w.scene.add(m); w.circleCollider(mx, mz, 3 + (i % 3), 12); }
      titleBanner(w, 10, 1.0, 0.42, 5.2, 3.0, '#3e443d');
      w.banner([{ text: w.m.name, size: 80, color: '#3a3833' }], 6.5, 0.8, -9, 5.6, 0.42, 0, { pw: 1024, ph: 126 });
      mountainsFor(w);
      w.trees(scatter(110, r => { const x = (r() - 0.5) * 260, z = (r() - 0.5) * 300; return (Math.abs(x) < 38 && z > -L.BL - 10 && z < 95) ? null : [x, z]; }, 17), 'pine', { noCollide: true });
      w.trees([[-30, 50], [30, 50], [-36, 70], [36, 70]], 'pine');
      w.spawn = { pos: new THREE.Vector3(0, 0, 86), yaw: 0 };
    },
    jeju(w, L) {
      // 연못 자리 비우기
      w.buildGround({ hole: [-46, 0.6, 46, 24], plaza: [-34, 24.4, 34, 70] });
      const basalt = w.M({ map: w.tex('basaltBlocks', 1, 1), rough: 0.95 });
      const conc = w.M({ map: w.tex('concrete', 1, 1), rough: 0.85, color: '#e2ded6' });
      const H = 10, bw = L.BW / 2 + 0.35, objs = [];
      shell(w, L, { h: H, mat: conc, uv: 4, noFront: true, roofMat: w.M({ color: '#55534f' }) });
      // 정면: 아래 현무암 + 위 콘크리트 + 가로 유리
      objs.push(w.wall(-bw - 12, 0.2, -3.2, 0.2, 4.4, basalt, { thick: 0.4, uv: 4, shadow: 'both' }));
      objs.push(w.wall(3.2, 0.2, bw + 12, 0.2, 4.4, basalt, { thick: 0.4, uv: 4, shadow: 'both' }));
      objs.push(w.wall(-bw - 12, 0.2, bw + 12, 0.2, H - 4.4, conc, { thick: 0.4, uv: 4, y0: 4.4, shadow: 'both' }));
      [-1, 1].forEach(s => objs.push(w.box(12, H, 14, conc, s * (bw + 6), 0, -6.8, { collide: true, shadow: 'both' })));
      const band = w.M({ color: '#203038', rough: 0.08, metal: 0.8, envI: 1.5 });
      objs.push(w.box((bw + 12) * 2, 1.2, 0.1, band, 0, 6.2, 0.45));
      objs.push(w.box((bw + 12) * 2 + 2, 0.5, 4, w.M({ color: '#ecebe6', rough: 0.6 }), 0, H, 1.8, { shadow: 'both' }));
      // 하늘을 담는 가는 기둥 열주
      const colM = w.M({ color: '#ecebe6', rough: 0.6 });
      for (let x = -bw - 11; x <= bw + 11; x += 2.6) { if (Math.abs(x) < 3.4) continue; objs.push(w.box(0.22, H, 0.22, colM, x, 0, 3.3, { shadow: 'both' })); }
      // 연못 + 다리
      w.water(-46, 0.6, 46, 24, -0.12, '#1d3a48', 0.62);
      const curb = w.M({ map: w.tex('basalt', 4, 1), rough: 0.9 });
      objs.push(w.box(92, 0.35, 0.5, curb, 0, -0.2, 24.2)); w.box(0.5, 0.35, 23.6, curb, -46.2, -0.2, 12.4); w.box(0.5, 0.35, 23.6, curb, 46.2, -0.2, 12.4);
      const deck = w.M({ map: w.tex('basaltPaving', 1, 4), rough: 0.9 });
      objs.push(w.box(6, 0.2, 23.8, deck, 0, -0.1, 12.5, { shadow: 'recv' }));
      [-3, 3].forEach(x => { w.seg(x, 0.6, x, 24, 0.12); w.box(0.08, 0.9, 23.8, w.glassMat('#cde', 0.25), x, 0.1, 12.5); });
      w.seg(-46, 24.4, -3, 24.4, 0.2); w.seg(3, 24.4, 46, 24.4, 0.2);
      // 연못 속 조형석
      const rk = w.M({ map: w.tex('basalt', 1, 1), rough: 1 }); const r = Tex.rng(51);
      for (let i = 0; i < 9; i++) { const s = r() > 0.5 ? 1 : -1; const g = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8 + r() * 1.2, 0), rk); g.position.set(s * (8 + r() * 34), 0, 4 + r() * 18); g.scale.y = 0.6; g.rotation.y = r() * 6; w.shadow(g, 'both'); w.scene.add(g); objs.push(g); }
      mirror(w, objs);
      titleBanner(w, -11, 4.8, 0.45, 6.4, 1.0 * 2.6, '#1f3540');
      w.banner([{ text: w.m.name, size: 80, color: '#2a2a28' }], 9, 1.0, 11, 7.6, 0.45, 0, { pw: 1024, ph: 114 });
      mountainsFor(w);
      w.trees([[-8, 28], [8, 28], [-8, 40], [8, 40], [-60, 30], [60, 30]], 'palm');
      w.trees(scatter(60, r => { const x = (r() - 0.5) * 240, z = (r() - 0.5) * 240; return (Math.abs(x) < 64 && z > -L.BL - 10 && z < 60) ? null : [x, z]; }, 19), 'round', { noCollide: true, leaf: '#4f7a46' });
      lampPosts(w, [[-5, 30], [5, 30], [-5, 44], [5, 44]]);
      w.spawn = { pos: new THREE.Vector3(0, 0, 50), yaw: 0 };
    }
  };

  /* =========================================================
   * 로비
   * ========================================================= */
  const lobbySize = {
    glassbox: { w: 28, d: 22 }, rotunda: { w: 28, d: 28 }, industrial: { w: 30, d: 24 }, grandhall: { w: 20, d: 40 },
    lightshaft: { w: 28, d: 22 }, mediawall: { w: 30, d: 24 }, concrete: { w: 26, d: 22 }, pond: { w: 28, d: 22 }
  };
  const lobby = {
    glassbox(w, L) {
      lobbyBox(w, L, { noCeil: true, wallH: 8 });
      welcome(w, L, {});
      // 현수 조형: 공중에 떠 있는 색면 판
      const r = Tex.rng(3), cols = ['#c8643c', '#f2d2a9', '#2f4858', '#e9e4da', '#86a69d'];
      for (let i = 0; i < 9; i++) {
        const m = w.M({ color: cols[i % 5], rough: 0.6, side: THREE.DoubleSide, zone: 'in' });
        const p = w.plane(2.2 + r() * 2, 0.8 + r() * 1.4, m, (r() - 0.5) * 14, 7 + r() * 4, -6 - r() * 12, 0, r() * PI);
        const base = p.position.y, ph = r() * 6; w.updaters.push((dt, t) => { p.rotation.y += dt * 0.06; p.position.y = base + Math.sin(t * 0.5 + ph) * 0.15; });
      }
      // 큐브 의자
      for (let i = 0; i < 6; i++) w.box(1.2, 0.45, 1.2, w.M({ color: '#2b2b2b', rough: 0.7, zone: 'in' }), -8 + (i % 3) * 2.2, 0, -12 - Math.floor(i / 3) * 2.2, { collide: true });
    },
    rotunda(w, L) {
      const R = L.LW / 2, cz = -L.LD / 2, H = L.lobbyH;
      w.floorRect(-R - 1, 0, R + 1, -L.LD, w.M({ map: w.tex('granite', 6, 6), rough: 0.5, zone: 'in', envI: 0.8 }), 0.002);
      // 원형 벽 (앞: 출입구 / 뒤: 복도 입구)
      const n = 40, mat = w.matWall;
      for (let i = 0; i < n; i++) {
        const a0 = i / n * PI * 2, a1 = (i + 1) / n * PI * 2, am = (a0 + a1) / 2;
        const x0 = Math.sin(a0) * R, z0 = cz + Math.cos(a0) * R, x1 = Math.sin(a1) * R, z1 = cz + Math.cos(a1) * R;
        const mx = Math.sin(am) * R, mz = cz + Math.cos(am) * R;
        if (Math.abs(mx) < 3.3 && mz > cz) { w.wall(x0, z0, x1, z1, H - 4.4, mat, { y0: 4.4, collide: false }); continue; }
        if (Math.abs(mx) < 4.2 && mz < cz) { w.wall(x0, z0, x1, z1, H - World.GALLERY_H, mat, { y0: World.GALLERY_H, collide: false }); continue; }
        w.wall(x0, z0, x1, z1, H, mat, { thick: 0.35 });
      }
      // 입구 통로 (원과 정면 사이)
      [-1, 1].forEach(s => { w.wall(s * 3.3, 0, s * 3.3, cz + Math.sqrt(R * R - 3.3 * 3.3) - 0.2, 4.4, mat); w.wall(s * 4.2, -L.LD - 0.3, s * 4.2, cz - Math.sqrt(R * R - 4.2 * 4.2) + 0.2, World.GALLERY_H, mat); });
      w.ceilRect(-3.3, 0, 3.3, cz + R - 0.6, w.matCeil, 4.4);
      w.door(0, 0.2, 6.4, 4.4, '#3a3027');
      // 나선 램프 + 유리 난간
      const rampM = w.M({ color: '#ece7de', rough: 0.8, zone: 'in' }), rail = w.glassMat('#cfdde0', 0.25);
      const steps = 120, turns = 1.45, h0 = 2.6, h1 = H - 3, a0 = 0.35;
      for (let i = 0; i < steps; i++) {
        const t = i / steps, a = a0 + t * turns * PI * 2, y = h0 + (h1 - h0) * t;
        const da = turns * PI * 2 / steps, rr = R - 1.3;
        const seg = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, rr * da + 0.05), rampM);
        seg.position.set(Math.sin(a) * rr, y, cz + Math.cos(a) * rr); seg.rotation.y = a + PI / 2; w.scene.add(seg);
        const g = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.0, (R - 2.5) * da + 0.05), rail); g.position.set(Math.sin(a) * (R - 2.5), y + 0.65, cz + Math.cos(a) * (R - 2.5)); g.rotation.y = a; w.scene.add(g);
      }
      // 중앙 미디어 기둥 (색이 천천히 변하는 화면 탑)
      const screens = []; const levels = 9;
      for (let i = 0; i < levels; i++) for (let k = 0; k < 6; k++) {
        const m = new THREE.MeshBasicMaterial({ color: '#ffffff' }); const a = k / 6 * PI * 2;
        const sc = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.95, 0.5), [w.M({ color: '#2b2b2b', zone: 'in' }), w.M({ color: '#2b2b2b', zone: 'in' }), w.M({ color: '#2b2b2b', zone: 'in' }), w.M({ color: '#2b2b2b', zone: 'in' }), m, w.M({ color: '#2b2b2b', zone: 'in' })]);
        const rr = 1.15 - Math.abs(i - levels / 2) * 0.04; sc.position.set(Math.sin(a) * rr, 0.6 + i * 1.0, cz + Math.cos(a) * rr); sc.rotation.y = a; w.scene.add(sc);
        screens.push({ m, i, k });
      }
      w.circleCollider(0, cz, 2.0, 12);
      const col = new THREE.Color();
      w.updaters.push((dt, t) => screens.forEach(s => { col.setHSL((t * 0.03 + s.i * 0.07 + s.k * 0.02) % 1, 0.65, 0.45 + 0.15 * Math.sin(t * 1.5 + s.i + s.k)); s.m.color.copy(col).multiplyScalar(1.6); }));
      // 천창
      const ring = new THREE.Mesh(new THREE.RingGeometry(R * 0.35, R + 0.2, 64), w.matCeil); ring.rotation.x = PI / 2; ring.position.set(0, H, cz); w.scene.add(ring);
      const oc = new THREE.Mesh(new THREE.CircleGeometry(R * 0.35, 48), w.Basic('#fff8ec', 2.2)); oc.rotation.x = PI / 2; oc.position.set(0, H + 0.02, cz); w.scene.add(oc);
      for (let i = 0; i < 12; i++) { const a = i / 12 * PI; const b = new THREE.Mesh(new THREE.BoxGeometry(R * 0.7, 0.25, 0.12), w.matTrim); b.position.set(0, H - 0.15, cz); b.rotation.y = a; w.scene.add(b); }
      welcome(w, L, { titleX: -6.6, titleZ: cz + 2.5, dirX: 6.6, dirZ: cz + 2.5, noDesk: true, titleY: 2.4, stand: true, titleW: 6 });
      w.mapShapes.push({ type: 'circle', x: 0, z: cz, r: R, color: 'rgba(255,255,255,0.18)', label: '로비' });
    },
    industrial(w, L) {
      const brick = w.M({ map: w.tex('concrete', 1, 1), color: '#e9e7e2', rough: 0.9, zone: 'in' });   // 옛 공장 콘크리트 벽
      lobbyBox(w, L, { wallMat: brick, uv: 3.6, ceilMat: w.M({ color: '#3a3c3f', rough: 0.9, zone: 'in' }) });
      welcome(w, L, { ink: '#f4efe8', deskColor: '#2a2c2f', deskTop: '#e2e2de' });
      // 제목 벽 뒤 흰 패널
      w.box(10.5, 4.5, 0.08, w.M({ color: '#2a2c2f', rough: 0.8, zone: 'in' }), -(L.LW / 2 + 4) / 2 - 0.5, 1.2, -L.LD + 0.01);
      w.box(4.6, 5.4, 0.08, w.M({ color: '#2a2c2f', rough: 0.8, zone: 'in' }), (L.LW / 2 + 4) / 2 + 0.5, 0.4, -L.LD + 0.01);
      Arch.ceiling(w, { x0: -L.LW / 2, x1: L.LW / 2, z0: -L.LD, z1: 0 }, 'truss', L.lobbyH, 0);
      // 개방형 수장고 선반
      const steel = w.M({ color: '#3a3d40', metal: 0.7, rough: 0.4, zone: 'in' });
      const crateM = w.M({ map: w.tex('wood', 1, 1), color: '#d9c3a0', rough: 0.8, zone: 'in' }), wrapM = w.M({ color: '#e8e6e1', rough: 0.6, zone: 'in' });
      const r = Tex.rng(8);
      [-1, 1].forEach(s => {
        const x = s * (L.LW / 2 - 1.2);
        for (let z = -3; z > -L.LD + 3; z -= 4.2) {
          [[0, 0], [0, 4.2]].forEach(() => { });
          for (const dz of [-1.9, 1.9]) w.box(0.12, 6.5, 0.12, steel, x, 0, z + dz);
          for (let lv = 0; lv < 4; lv++) {
            w.box(1.6, 0.08, 4, steel, x, 0.3 + lv * 1.6, z);
            for (let k = 0; k < 2; k++) if (r() > 0.25) { const bh = 0.6 + r() * 0.7; w.box(1.2, bh, 1.2 + r() * 0.6, r() > 0.5 ? crateM : wrapM, x, 0.38 + lv * 1.6, z - 1 + k * 2); }
          }
          w.boxCollider(x - 0.8, x + 0.8, z - 2, z + 2);
          // 보이는 수장고: 선반 앞 유리
          w.box(0.05, 6.6, 4.1, w.glassMat('#cfdcdf', 0.18), x - s * 1.0, 0, z);
        }
      });
      // 노출 콘크리트 기둥
      for (let z = -6; z > -L.LD + 2; z -= 6) [-7, 7].forEach(x => w.box(0.8, L.lobbyH, 0.8, w.M({ map: w.tex('concrete', 1, 2), color: '#dcdad5', rough: 0.9, zone: 'in' }), x, 0, z, { collide: true }));
      // 바닥의 노란 안전선
      const yl = w.Basic('#d9b23a', 0.9);
      [-1, 1].forEach(s => w.floorRect(s * (L.LW / 2 - 2.3) - 0.06, -1, s * (L.LW / 2 - 2.3) + 0.06, -L.LD + 1, yl, 0.006));
    },
    grandhall(w, L) {
      lobbyBox(w, L, {});
      welcome(w, L, { titleX: -L.LW / 2 + 0.17, titleZ: -L.LD * 0.5, titleRy: PI / 2, dirX: L.LW / 2 - 0.17, dirZ: -L.LD * 0.35, dirRy: -PI / 2, deskX: 5, deskZ: -6, titleY: 4 });
      // 긴 천창
      [-5, 0, 5].forEach(x => { w.plane(1.6, L.LD - 4, w.Basic('#ffffff', 2.4), x, L.lobbyH - 0.02, -L.LD / 2, PI / 2, 0); });
      // 세로 빛 슬릿
      [-1, 1].forEach(s => { for (let z = -4; z > -L.LD + 3; z -= 6) w.plane(0.12, L.lobbyH - 3, w.Basic('#fffaf0', 2.2), s * (L.LW / 2 - 0.01), (L.lobbyH - 3) / 2 + 1.5, z, 0, -s * PI / 2); });
      // 공중에 매달린 대형 설치작품 (색 구슬 물결)
      const n = w.low ? 160 : 320, r = Tex.rng(17);
      const geo = new THREE.SphereGeometry(0.32, 16, 12), mat = w.M({ color: '#ffffff', rough: 0.35, metal: 0.1, zone: 'in' });
      const im = new THREE.InstancedMesh(geo, mat, n), d = new THREE.Object3D(), pal = ['#e94f37', '#f6c445', '#3f88c5', '#44bba4', '#f2f2f2', '#393e41'];
      const pts = [];
      for (let i = 0; i < n; i++) { const gx = (i % 16) / 15 - 0.5, gz = Math.floor(i / 16) / (n / 16 - 1) - 0.5; pts.push([gx * 14 + (r() - 0.5) * 0.4, gz * (L.LD - 10) - L.LD / 2, r()]); im.setColorAt(i, new THREE.Color(pal[Math.floor(r() * pal.length)])); }
      const wires = []; pts.forEach(p => wires.push(p[0], L.lobbyH, p[1], p[0], 0, p[1]));
      const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wires, 3));
      const wl = new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: '#999', transparent: true, opacity: 0.35 })); w.scene.add(wl);
      w.scene.add(im);
      const upd = (t) => { pts.forEach((p, i) => { const y = 9 + Math.sin(p[0] * 0.45 + p[1] * 0.18 + t * 0.6) * 2.2 + p[2] * 0.6; d.position.set(p[0], y, p[1]); d.updateMatrix(); im.setMatrixAt(i, d.matrix); wires[i * 6 + 4] = y; }); im.instanceMatrix.needsUpdate = true; wg.attributes.position.array.set(wires); wg.attributes.position.needsUpdate = true; };
      upd(0); w.updaters.push((dt, t) => upd(t));
      for (let z = -10; z > -L.LD + 6; z -= 10) w.bench(-4, z, PI / 2, 3);
    },
    lightshaft(w, L) {
      lobbyBox(w, L, { noCeil: true });
      const lw = L.LW / 2, H = L.lobbyH;
      w.ceilRect(-lw, 0, lw, -L.LD, w.Basic('#ffffff', 2.0), H + 0.6);
      Arch.ceiling(w, { x0: -lw, x1: lw, z0: -L.LD, z1: 0 }, 'louver', H, 0);
      [-lw, lw].forEach(x => w.wall(x + (x < 0 ? -0.15 : 0.15), 0, x + (x < 0 ? -0.15 : 0.15), -L.LD, 0.6, w.matWall, { y0: H, collide: false }));
      w.wall(-lw, -0.15, lw, -0.15, 0.6, w.matWall, { y0: H, collide: false }); w.wall(-lw, -L.LD - 0.15, lw, -L.LD - 0.15, 0.6, w.matWall, { y0: H, collide: false });
      // 비스듬한 빛줄기
      const bt = w.tex('beam', 1, 1, false), sd = w.sunDir;
      for (let i = 0; i < 7; i++) {
        const m = new THREE.MeshBasicMaterial({ color: '#fffaf0', alphaMap: bt, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
        const x = -9 + i * 3, len = H / 0.8;
        const p = w.plane(1.4, len, m, x + 1.5, H / 2, -L.LD / 2 + 1.5, 0, 0, { order: 3 }); p.rotation.set(0, 0, 0); p.rotation.x = -0.35; p.rotation.z = 0.25; p.rotation.y = 0;
        const fl = w.lightPool(x + 1.5 + Math.tan(0.25) * H / 2, 0.02, -L.LD / 2 + 1.5 + Math.tan(0.35) * H / 2, 0, 1.8, 3.2, 0.35); fl.rotation.set(-PI / 2, 0, 0);
      }
      // 문자추상 느낌의 먹 벽화
      const c = Tex.canvas(1024, 512), x = c.getContext('2d'), r = Tex.rng(29);
      x.fillStyle = '#fbfbf9'; x.fillRect(0, 0, 1024, 512); x.strokeStyle = '#141414'; x.lineCap = 'round';
      for (let k = 0; k < 18; k++) {
        const cx = 60 + (k % 9) * 108, cy = 140 + Math.floor(k / 9) * 230;
        for (let s = 0; s < 4; s++) { x.lineWidth = 8 + r() * 22; x.globalAlpha = 0.75 + r() * 0.25; x.beginPath(); const a = r() * 6.28; x.moveTo(cx + Math.cos(a) * 40, cy + Math.sin(a) * 50); x.quadraticCurveTo(cx + (r() - .5) * 90, cy + (r() - .5) * 90, cx + Math.cos(a + 2.5) * 42, cy + Math.sin(a + 2.5) * 55); x.stroke(); }
        x.globalAlpha = 1;
      }
      const mt = new THREE.CanvasTexture(c); mt.colorSpace = THREE.SRGBColorSpace; w.textures.push(mt);
      w.plane(12, 6, w.M({ map: mt, rough: 0.9, zone: 'in' }), -lw + 0.17, 4.2, -L.LD / 2, 0, PI / 2, { order: 2 });
      welcome(w, L, { deskColor: '#ffffff', deskTop: '#151515' });
    },
    mediawall(w, L) {
      lobbyBox(w, L, {});
      const lw = L.LW / 2, H = L.lobbyH;
      // 대형 LED 벽 (셰이더)
      const mat = new THREE.ShaderMaterial({
        uniforms: { t: { value: 0 } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
        fragmentShader: `uniform float t; varying vec2 vUv;
          void main(){ vec2 p=vUv*vec2(3.,1.); float v=sin(p.x*3.+t*.6)+sin(p.y*5.-t*.4)+sin((p.x+p.y)*4.+t*.3)+sin(length(p-vec2(1.5,.5))*8.-t);
            vec3 c=.5+.5*cos(vec3(0.,2.,4.)+v*1.2+t*.2); c=mix(c,vec3(.15,.95,.6),.25);
            c=pow(c,vec3(1.8)); vec2 g=fract(vUv*vec2(360.,110.)); float px=step(.1,g.x)*step(.1,g.y);
            gl_FragColor=vec4(c*mix(.72,1.,px)*1.25,1.);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`
      });
      const sw = L.LW - 2;
      w.plane(sw, H - 6.2, mat, 0, (H - 6.2) / 2 + 5.9, -L.LD + 0.03, 0, 0, { order: 2 }); // 뒷벽 위쪽 가득
      w.updaters.push((dt, t) => { mat.uniforms.t.value = t; });
      // 네온 바닥선
      const neon = w.Basic('#59ffa8', 2.2);
      [-1, 1].forEach(s => w.floorRect(s * (lw - 0.4) - 0.04, -0.5, s * (lw - 0.4) + 0.04, -L.LD + 0.5, neon, 0.006));
      w.floorRect(-lw + 0.4, -L.LD + 0.46, lw - 0.4, -L.LD + 0.54, neon, 0.006);
      w.ceilRect(-lw, 0, lw, -L.LD, w.matCeil, H);
      downlights(w, -lw, -L.LD, lw, 0, H, 4, '#f4f1ff');
      // 걸린 화분 구름
      const leaf = w.M({ map: w.tex('plantWall', 1, 1), rough: 1, zone: 'in', color: '#cfe0c0' }); const r = Tex.rng(4);
      for (let i = 0; i < 14; i++) { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8 + r() * 0.8, 1), leaf); s.position.set((r() - 0.5) * 16, 7 + r() * 3, -6 - r() * 12); w.scene.add(s); }
      welcome(w, L, {});
      // 입구 정면 방향(뒤쪽)에 미디어벽이 보이도록 안내
      w.plane(sw, 0.06, neon, 0, 5.75, -L.LD + 0.04, 0, 0, { order: 3 });
    },
    concrete(w, L) {
      const conc = w.M({ map: w.tex('concrete', 1, 1), rough: 0.9, zone: 'in' });
      lobbyBox(w, L, { wallMat: conc, uv: 3.6, noCeil: true, noRight: true, floorMat: w.M({ map: w.tex('stonePaving', 4, 4), rough: 0.8, zone: 'in' }) });
      const lw = L.LW / 2, H = L.lobbyH, cx0 = 5;
      // 천장 (오른쪽 물의 중정은 하늘로 열림) + 빛 슬릿
      w.ceilRect(-lw, 0, cx0, -L.LD, w.M({ map: w.tex('concrete', 3, 3), rough: 0.9, zone: 'in' }), H);
      w.plane(0.25, L.LD - 2, w.Basic('#fff6e6', 3), -3, H - 0.01, -L.LD / 2, PI / 2, 0);
      w.plane(L.LW / 2 + 3, 0.25, w.Basic('#fff6e6', 3), (-lw + cx0) / 2, H - 0.01, -L.LD / 2, PI / 2, 0);
      // 유리벽과 중정
      w.wall(cx0, -2, cx0, -L.LD + 2, H, w.glassMat('#c8d4d2', 0.18), { thick: 0.05 });
      w.wall(cx0, 0, cx0, -2, H, conc, { uv: 3.6 }); w.wall(cx0, -L.LD + 2, cx0, -L.LD, H, conc, { uv: 3.6 });
      w.wall(lw + 0.15, 0, lw + 0.15, -L.LD, H, conc, { uv: 3.6 });
      w.water(cx0 + 0.1, -0.3, lw, -L.LD, 0.05, '#2d3d40');
      w.box(lw - cx0, 0.3, L.LD, w.M({ color: '#3a3f40', rough: 1 }), (lw + cx0) / 2, -0.32, -L.LD / 2);
      const r = Tex.rng(12); const rk = w.M({ map: w.tex('granite', 1, 1), rough: 0.9, zone: 'in' });
      for (let i = 0; i < 4; i++) { const g = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5 + r() * 0.6, 0), rk); g.position.set(cx0 + 2 + r() * (lw - cx0 - 3), 0.1, -3 - r() * (L.LD - 6)); g.scale.y = 0.55; w.scene.add(g); }
      w.wall(cx0, -0.15, lw, -0.15, H, conc, { uv: 3.6 }); w.wall(cx0, -L.LD - 0.15, lw, -L.LD - 0.15, H, conc, { uv: 3.6 });
      welcome(w, L, { dirX: -lw + 0.17, dirZ: -L.LD * 0.62, dirRy: PI / 2, deskX: -6, deskZ: -4, deskColor: '#8f8b84', deskTop: '#3d3a36' });
      // 나무 의자
      w.bench(0, -11, 0, 3, 'in', '#6f5642');
    },
    pond(w, L) {
      lobbyBox(w, L, { noLeft: true, ceilMat: w.M({ map: w.tex('wood', 6, 6), rough: 0.8, zone: 'in' }) });
      const lw = L.LW / 2, H = L.lobbyH;
      // 왼쪽: 유리 너머 현무암 중정
      const cx = -lw + 7;
      w.wall(cx, -2, cx, -L.LD + 2, H, w.glassMat('#c9d8dc', 0.16), { thick: 0.05 });
      const bas = w.M({ map: w.tex('basaltBlocks', 1, 1), rough: 0.95, zone: 'in' });
      w.wall(cx, 0, cx, -2, H, bas, { uv: 4 }); w.wall(cx, -L.LD + 2, cx, -L.LD, H, bas, { uv: 4 });
      w.wall(-lw - 0.15, 0, -lw - 0.15, -L.LD, H, bas, { uv: 4 });
      w.water(-lw, -0.3, cx - 0.1, -L.LD, 0.05, '#1f3c48');
      const r = Tex.rng(33), rk = w.M({ map: w.tex('basalt', 1, 1), rough: 1, zone: 'in' });
      for (let i = 0; i < 5; i++) { const g = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4 + r() * 0.6, 0), rk); g.position.set(-lw + 1 + r() * 5, 0.05, -3 - r() * (L.LD - 6)); g.scale.y = 0.6; w.scene.add(g); }
      w.trees([[-lw + 3.5, -L.LD / 2]], 'round', { noCollide: true });
      // 천장 위 중정은 열림: 나무 천장 덮개 제거 대신 하늘 패널
      w.ceilRect(-lw, 0, cx, -L.LD, w.Basic('#ffffff', 1.6), H + 0.01);
      downlights(w, cx, -L.LD, lw, 0, H, 3);
      welcome(w, L, { titleX: lw - 0.17, titleZ: -L.LD * 0.55, titleRy: -PI / 2, deskX: 4, deskZ: -5, deskColor: '#7a5c44', deskTop: '#2d2c2a' });
    }
  };

  /* =========================================================
   * 천장 스타일 (전시실·로비 공용)
   * ========================================================= */
  function ceiling(w, rect, type, H, side) {
    const { x0, x1, z0, z1 } = rect, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, wx = x1 - x0, wz = z1 - z0;
    const light = w.matLight;
    const along = wz >= wx ? 'z' : 'x';
    if (type === 'grid' || type === 'coffer') {
      const step = type === 'grid' ? 3 : 3.5, sz = type === 'grid' ? 1.2 : 2.2, pts = [];
      for (let x = x0 + step / 2; x < x1 - 0.5; x += step) for (let z = z0 + step / 2; z < z1 - 0.5; z += step) pts.push([x, z]);
      const geo = new THREE.PlaneGeometry(sz, sz); geo.rotateX(PI / 2);
      const im = new THREE.InstancedMesh(geo, light, pts.length), d = new THREE.Object3D();
      pts.forEach((p, i) => { d.position.set(p[0], H - 0.02, p[1]); d.updateMatrix(); im.setMatrixAt(i, d.matrix); }); w.scene.add(im);
      if (type === 'coffer') { const b = []; for (let x = x0; x <= x1 + 0.01; x += step) b.push([x, H - 0.35, cz, 0.25, 0.7, wz, 0]); for (let z = z0; z <= z1 + 0.01; z += step) b.push([cx, H - 0.35, z, wx, 0.7, 0.25, 0]); instBoxes(w, b, w.matCeil); }
    } else if (type === 'truss') {
      const steel = w.M({ color: '#2d2f33', metal: 0.7, rough: 0.4, zone: 'in' }), b = [], lamps = [];
      if (along === 'z') { for (let z = z0 + 2; z < z1; z += 4) { b.push([cx, H - 0.25, z, wx, 0.2, 0.2], [cx, H - 1.4, z, wx, 0.16, 0.16]); for (let x = x0 + 1; x < x1; x += 2) { b.push([x, H - 0.8, z, 0.08, 1.2, 0.08]); } for (let x = x0 + 2.5; x < x1 - 1; x += 4) lamps.push([x, z + 2]); } }
      else { for (let x = x0 + 2; x < x1; x += 4) { b.push([x, H - 0.25, cz, 0.2, 0.2, wz], [x, H - 1.4, cz, 0.16, 0.16, wz]); for (let z = z0 + 1; z < z1; z += 2) b.push([x, H - 0.8, z, 0.08, 1.2, 0.08]); for (let z = z0 + 2.5; z < z1 - 1; z += 4) lamps.push([x + 2, z]); } }
      instBoxes(w, b, steel);
      const shade = new THREE.ConeGeometry(0.4, 0.35, 16, 1, true); const shM = w.M({ color: '#3b3e42', metal: 0.6, rough: 0.4, side: THREE.DoubleSide, zone: 'in' });
      const disc = new THREE.CircleGeometry(0.3, 16); disc.rotateX(PI / 2);
      const s1 = new THREE.InstancedMesh(shade, shM, lamps.length), s2 = new THREE.InstancedMesh(disc, w.Basic('#ffe2b0', 3), lamps.length), d = new THREE.Object3D();
      const cords = [];
      lamps.forEach((p, i) => { d.position.set(p[0], H - 2.2, p[1]); d.updateMatrix(); s1.setMatrixAt(i, d.matrix); d.position.y = H - 2.37; d.updateMatrix(); s2.setMatrixAt(i, d.matrix); cords.push(p[0], H, p[1], p[0], H - 2.05, p[1]); });
      w.scene.add(s1, s2);
      const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(cords, 3)); w.scene.add(new THREE.LineSegments(cg, new THREE.LineBasicMaterial({ color: '#222' })));
    } else if (type === 'slot') {
      if (along === 'z') for (let x = x0 + 2; x < x1 - 1; x += 3) w.plane(0.18, wz - 1.5, light, x, H - 0.02, cz, PI / 2, 0);
      else for (let z = z0 + 2; z < z1 - 1; z += 3) w.plane(wx - 1.5, 0.18, light, cx, H - 0.02, z, PI / 2, 0);
    } else if (type === 'louver') {
      w.ceilRect(x0 + 0.5, z0 + 0.5, x1 - 0.5, z1 - 0.5, light, H - 0.01);
      const b = []; if (along === 'z') for (let z = z0 + 0.3; z < z1; z += 0.55) b.push([cx, H - 0.35, z, wx - 0.4, 0.7, 0.05]); else for (let x = x0 + 0.3; x < x1; x += 0.55) b.push([x, H - 0.35, cz, 0.05, 0.7, wz - 0.4]);
      instBoxes(w, b, w.M({ color: '#ffffff', rough: 0.8, zone: 'in' }));
    } else if (type === 'black') {
      const b = []; if (along === 'z') for (let x = x0 + 2; x < x1; x += 3.3) b.push([x, H - 0.06, cz, 0.06, 0.06, wz - 1]); else for (let z = z0 + 2; z < z1; z += 3.3) b.push([cx, H - 0.06, z, wx - 1, 0.06, 0.06]);
      instBoxes(w, b, w.M({ color: '#3a3a3e', metal: 0.8, rough: 0.3, zone: 'in' }));
      downlights(w, x0, z0, x1, z1, H, 4.5, '#9ad');
    } else if (type === 'concrete') {
      if (along === 'z') w.plane(0.3, wz - 2, w.Basic('#fff3e0', 2.6), cx, H - 0.01, cz, PI / 2, 0); else w.plane(wx - 2, 0.3, w.Basic('#fff3e0', 2.6), cx, H - 0.01, cz, PI / 2, 0);
    } else if (type === 'wood') {
      downlights(w, x0, z0, x1, z1, H, 3);
    } else if (CEIL2[type]) CEIL2[type](w, rect, H);
  }

  /* =========================================================
   * 추가 미술관: 인천 · 전북 · 광주 · 경남
   * ========================================================= */
  function quad(w, p, mat, o = {}) { // p: 4개의 [x,y,z] (반시계)
    const g = new THREE.BufferGeometry(), u = o.uv || [1, 1];
    g.setAttribute('position', new THREE.Float32BufferAttribute([...p[0], ...p[1], ...p[2], ...p[0], ...p[2], ...p[3]], 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, u[0], 0, u[0], u[1], 0, 0, u[0], u[1], 0, u[1]], 2));
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); w.shadow(m, o.shadow || 'both'); w.scene.add(m); return m;
  }
  function tri(w, a, b, c, mat, o = {}) {
    const g = new THREE.BufferGeometry(), s = o.uvScale || 0.25;
    g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c], 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([a[0] * s, a[1] * s, b[0] * s, b[1] * s, c[0] * s, c[1] * s], 2));
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); w.shadow(m, 'both'); w.scene.add(m); return m;
  }
  // 박공지붕 (z 방향으로 길게), 바닥면 없음
  function gable(w, x0, x1, z0, z1, y, rise, roofM, endM, oh = 0.5) {
    const xm = (x0 + x1) / 2, top = y + rise, ex = (x1 - x0) / 2 + oh, drop = rise * oh / ((x1 - x0) / 2);
    const len = Math.abs(z1 - z0), slope = Math.hypot(ex, rise + drop);
    quad(w, [[xm - ex, y - drop, z1 + oh], [xm - ex, y - drop, z0 - oh], [xm, top, z0 - oh], [xm, top, z1 + oh]], roofM, { uv: [len / 3, slope / 3] });
    quad(w, [[xm + ex, y - drop, z0 - oh], [xm + ex, y - drop, z1 + oh], [xm, top, z1 + oh], [xm, top, z0 - oh]], roofM, { uv: [len / 3, slope / 3] });
    if (endM) { tri(w, [x0, y, z1], [x1, y, z1], [xm, top, z1], endM); tri(w, [x1, y, z0], [x0, y, z0], [xm, top, z0], endM); }
  }
  function warehouse(w, x, z, wd, dp, h, rise, brick, roofM, ry) { // 작은 창고 동
    const hw = wd / 2, hd = dp / 2;
    w.box(wd, h, dp, brick, x, 0, z, { collide: true, shadow: 'both' });
    gable(w, x - hw, x + hw, z - hd, z + hd, h, rise, roofM, brick, 0.4);
    const door = w.M({ map: w.tex('wood', 1, 1), color: '#e8b53c', rough: 0.7 });
    w.box(2.6, 3.2, 0.12, door, x, 0, z + hd + 0.04); w.box(2.8, 0.18, 0.18, w.M({ color: '#3a2a1c' }), x, 3.2, z + hd + 0.06);
  }
  function sculptures(w, list) { // 조각정원
    list.forEach(([x, z, kind, color]) => {
      const m = w.M({ color, rough: kind === 'bronze' ? 0.35 : 0.6, metal: kind === 'bronze' ? 0.8 : 0.1 });
      const base = w.M({ color: '#cfc9bf', rough: 0.9 });
      w.box(1.6, 0.5, 1.6, base, x, 0, z, { collide: true, shadow: 'both' });
      if (kind === 'stack') { for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55 - i * 0.08, 0), m); s.position.set(x + (i % 2 ? 0.08 : -0.06), 0.9 + i * 0.75, z); s.scale.y = 0.75; s.rotation.y = i; w.shadow(s, 'both'); w.scene.add(s); } }
      else if (kind === 'bronze') { const t = new THREE.Mesh(new THREE.TorusKnotGeometry(0.7, 0.18, 96, 12, 2, 3), m); t.position.set(x, 1.6, z); w.shadow(t, 'both'); w.scene.add(t); }
      else if (kind === 'column') { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 3.4, 6), m); c.position.set(x, 2.2, z); c.rotation.z = 0.12; w.shadow(c, 'both'); w.scene.add(c); }
      else { const b = new THREE.Mesh(new THREE.TorusGeometry(1, 0.12, 10, 40, PI * 1.5), m); b.position.set(x, 1.6, z); b.rotation.y = 0.6; w.shadow(b, 'both'); w.scene.add(b); }
    });
  }
  function glassFront(w, x0, x1, h, y0 = 0, door = true, z = 0.2) { // 멀리언 있는 유리벽
    const glass = w.glassMat('#b9cdd4', 0.22), mull = w.M({ color: '#2b2d30', metal: 0.7, rough: 0.35 });
    const pieces = door && x0 < -3.2 && x1 > 3.2 ? [[x0, -3.2], [3.2, x1]] : [[x0, x1]];
    pieces.forEach(([a, b]) => w.wall(a, z, b, z, h - y0, glass, { thick: 0.05, y0 }));
    if (door && x0 < -3.2 && x1 > 3.2) w.wall(-3.2, z, 3.2, z, h - 4.4, glass, { thick: 0.05, y0: 4.4, collide: false });
    const n = Math.max(1, Math.round((x1 - x0) / 2.4));
    for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; if (door && Math.abs(x) < 3.1) continue; w.box(0.1, h - y0, 0.14, mull, x, y0, z); }
    for (let y = y0 + 4.4; y < h - 0.5; y += 4.4) w.box(x1 - x0, 0.1, 0.14, mull, (x0 + x1) / 2, y, z);
    w.box(x1 - x0, 0.2, 0.2, mull, (x0 + x1) / 2, h - 0.2, z);
  }
  function hill(w, x, z, rx, h, rz, color = '#6f8f4e') {
    const g = new THREE.SphereGeometry(1, 40, 20, 0, PI * 2, 0, PI / 2), p = g.attributes.position, r = Tex.rng(Math.round(x + z));
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setY(i, y * (0.9 + r() * 0.2)); }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, w.M({ map: w.tex('grass', 30, 30), color, rough: 1 })); m.scale.set(rx, h, rz); m.position.set(x, -0.5, z); w.shadow(m, 'recv'); w.scene.add(m);
    return m;
  }

  Object.assign(exterior, {
    incheon(w, L) {
      w.buildGround();
      const brick = w.M({ map: w.tex('brick', 1, 1), rough: 0.9, color: '#e6c6b8' });
      const slate = w.M({ color: '#4b4f55', rough: 0.65, metal: 0.2, side: THREE.DoubleSide });
      const brickD = w.M({ map: w.tex('brick', 0.3, 0.3), rough: 0.9, color: '#e6c6b8', side: THREE.DoubleSide });
      const H = 7, bw = L.BW / 2 + 0.35, cl = L.LW / 2 + 0.3;
      shell(w, L, { h: H, mat: brick, uv: 4, lobbyOpen: true, openW: L.LW + 0.6, openD: L.LD + 0.2 });
      // 박공지붕 세 동 (가운데 동이 로비)
      gable(w, -cl, cl, -L.BL - 0.35, 0.4, H, 3.6, slate, brickD);
      gable(w, -bw, -cl, -L.BL - 0.35, 0.4, H, 1.8, slate, brickD);
      gable(w, cl, bw, -L.BL - 0.35, 0.4, H, 1.8, slate, brickD);
      // 노란 나무 문 + 둥근 환기창
      const door = w.M({ map: w.tex('wood', 1, 1), color: '#e8b53c', rough: 0.7 }), dark = w.M({ color: '#2a2622', rough: 0.4 });
      [-10, -5.5, 5.5, 10].forEach(x => { w.box(2.8, 3.6, 0.15, door, x, 0, 0.45); w.box(3.0, 0.2, 0.25, dark, x, 3.6, 0.47); w.box(0.08, 3.6, 0.17, dark, x, 0, 0.47); });
      const ring = new THREE.Mesh(new THREE.CircleGeometry(0.9, 24), dark); ring.position.set(0, H + 2.3, 0.42); ring.scale.setScalar(0.7); w.scene.add(ring);
      w.box(L.BW + 1, 0.3, 0.5, w.M({ color: '#d8cfc3', rough: 0.8 }), 0, H - 0.3, 0.45);
      // 광장 양옆 창고
      warehouse(w, -27, 18, 10, 18, 5, 2.4, brick, slate, 0); warehouse(w, 27, 18, 10, 18, 5, 2.4, brick, slate, 0);
      { const pl = w.M({ map: w.tex('plaster', 2, 2), color: '#efe8da', rough: 0.85 }), tile = w.M({ color: '#4a4c50', rough: 0.7, side: THREE.DoubleSide });   // 옛 일본우선 사무소 (회벽 + 기와 박공)
        w.box(10, 5.5, 9, pl, -27, 0, 42, { collide: true, shadow: 'both' }); gable(w, -32, -22, 37.5, 46.5, 5.5, 2.6, tile, pl, 0.5);
        const dark = w.M({ color: '#2b2f33', rough: 0.3 }); [-30, -27, -24].forEach(x => { w.box(1.1, 1.8, 0.1, dark, x, 2.6, 46.55); }); w.box(1.6, 2.4, 0.1, w.M({ color: '#5a3d2a' }), -27, 0, 46.55); }
      titleBanner(w, 0, 5.7, 0.48, 4.6, 2.2, w.m.accent);
      w.banner([{ text: w.m.name, size: 80, color: '#f3e7dc' }], 6, 0.65, 0, H + 0.75, 0.47, 0, { pw: 1024, ph: 110, bg: '#3a2a20' });
      // 항구: 먼 바다와 크레인
      w.water(-500, -500, 500, -170, 0.02, '#4d5d68');
      const crane = w.M({ color: '#c8443a', rough: 0.6, metal: 0.4 });
      [[-90, -190], [-40, -200], [60, -195]].forEach(([x, z]) => { [[-3, -3], [3, -3], [-3, 3], [3, 3]].forEach(([a, b]) => w.box(0.6, 26, 0.6, crane, x + a, 0, z + b)); w.box(48, 1.4, 1.4, crane, x + 8, 26, z); w.box(8, 3, 8, w.M({ color: '#ececec' }), x, 23, z); });
      lampPosts(w, [[-6, 12], [6, 12], [-6, 28], [6, 28]], '#ffd59a');
      w.trees([[-18, 34], [18, 34], [18, 46]], 'round');
      w.trees(scatter(30, r => { const x = (r() - 0.5) * 200, z = 60 + r() * 100; return [x, z]; }, 23), 'round', { noCollide: true });
      w.spawn = { pos: new THREE.Vector3(0, 0, 46), yaw: 0 };
    },
    jeonbuk(w, L) {
      w.buildGround();
      const white = w.M({ color: '#ece9e2', rough: 0.8, map: w.tex('plaster', 6, 6) });
      const stone = w.M({ map: w.tex('stoneBlocks', 1, 1), rough: 0.9, color: '#cbbfae' });
      const H = 9, bw = L.BW / 2 + 0.35;
      shell(w, L, { h: H, mat: white, uv: 6, leftOpenD: L.LD + 0.4, coping: w.M({ color: '#7b6f60', rough: 0.7 }) });
      // 아래 돌 띠
      [[-bw, -3.3], [3.3, bw]].forEach(([a, b]) => w.wall(a, 0.42, b, 0.42, 3.0, stone, { thick: 0.1, uv: 6, collide: false }));
      w.wall(-bw - 0.22, -L.LD - 0.4, -bw - 0.22, -L.BL - 0.35, 3.0, stone, { thick: 0.1, uv: 6, collide: false });
      // 왼쪽(저수지 쪽) 로비 유리벽 바깥 기둥
      const col = w.M({ color: '#7b6f60', rough: 0.6 });
      for (let z = 0; z >= -L.LD; z -= 4) w.box(0.4, H, 0.4, col, -bw - 0.4, 0, z, { collide: true, shadow: 'both' });
      w.box(1.6, 0.4, L.LD + 1, col, -bw - 0.6, H, -L.LD / 2, { shadow: 'both' });
      // 모악산 (바로 뒤로 솟은 큰 산)
      const sk = w.m.sky;
      const mt = new THREE.Mesh(new THREE.ConeGeometry(230, 150, 18, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color('#58704e').lerp(new THREE.Color(sk.horizon), 0.25), fog: false }));
      { const p = mt.geometry.attributes.position, r = Tex.rng(77); for (let i = 0; i < p.count; i++) if (p.getY(i) < 74) { p.setX(i, p.getX(i) * (0.85 + r() * 0.3)); p.setZ(i, p.getZ(i) * (0.85 + r() * 0.3)); } mt.geometry.computeVertexNormals(); }
      mt.position.set(60, 55, -330); mt.scale.set(1.3, 1, 0.8); w.scene.add(mt);
      mountainsFor(w);
      // 구이저수지
      w.water(-260, -160, -26, 120, 0.03, '#35505a');
      w.seg(-25.5, -160, -25.5, 120, 0.2);
      w.box(0.6, 0.3, 280, w.M({ color: '#a59d90' }), -25.8, 0, -20);
      // 조각정원
      const lawn = w.M({ map: w.tex('grass', 5, 5), rough: 1 }); w.floorRect(14, 8, 44, 40, lawn, 0.01, { shadow: 'recv' });
      sculptures(w, [[20, 14, 'stack', '#6d6a64'], [32, 18, 'bronze', '#8a6a3e'], [24, 30, 'column', '#b8b2a6'], [38, 32, 'arc', '#a33a2c']]);
      titleBanner(w, 11, 5.2, 0.5, 6.4, 3.4, w.m.accent);
      w.banner([{ text: w.m.name, size: 80, color: '#3c342b' }], 8, 0.9, -9, 6.2, 0.5, 0, { pw: 1024, ph: 115 });
      w.trees(scatter(80, r => { const x = (r() - 0.3) * 260, z = (r() - 0.5) * 260; return (x < -24 || (Math.abs(x) < 50 && z > -L.BL - 10 && z < 60)) ? null : [x, z]; }, 29), 'round', { noCollide: true, leaf: '#c98a3e' });
      w.trees([[48, 12], [48, 26], [12, 44], [30, 46]], 'round', { leaf: '#d4973f' });
      const cherry = []; for (let z = -50; z < 70; z += 7) cherry.push([-29, z + (z % 2), 0.9]);
      w.trees(cherry, 'round', { leaf: '#e7a9bd', seed: 4 });
      lampPosts(w, [[-5, 14], [5, 14], [-5, 30], [5, 30]]);
      w.spawn = { pos: new THREE.Vector3(-2, 0, 46), yaw: 0.12 };
    },
    gwangju(w, L) {
      w.buildGround();
      const stone = w.M({ map: w.tex('granite', 1, 1), color: '#efe9df', rough: 0.75 });
      const H = 9, bw = L.BW / 2 + 0.35;
      shell(w, L, { h: H, mat: stone, uv: 5, lobbyOpen: true, openW: L.LW + 0.6, openD: L.LD + 0.2, coping: w.M({ color: '#d4cdc1' }) });
      // 가로 띠창
      const band = w.M({ color: '#24323a', rough: 0.1, metal: 0.75, envI: 1.4 });
      [5.4, 7.4].forEach(y => { w.box(bw - 3.6, 0.9, 0.1, band, -(bw + 3.6) / 2, y, 0.42); w.box(bw - 3.6, 0.9, 0.1, band, (bw + 3.6) / 2, y, 0.42); });
      // 서쪽: 노을을 비추는 큰 유리 커튼월, 동쪽 광장 쪽: 사람 크기로 나뉜 돌 면
      w.wall(-bw - 0.3, 0.4, -bw - 0.3, -L.BL - 0.3, H, w.glassMat('#c48a5a', 0.55), { thick: 0.06, collide: false });
      for (let z = -2; z > -L.BL; z -= 4) w.box(0.1, H, 0.12, w.M({ color: '#2b2d30', metal: 0.7 }), -bw - 0.36, 0, z);
      for (let x = -bw + 3; x < bw - 1; x += 3.4) if (Math.abs(x) > 4) w.box(0.14, H - 0.6, 0.06, w.M({ color: '#cfc6b6', rough: 0.8 }), x, 0.3, 0.44);
      // 야외 공연장
      w.box(10, 0.8, 7, stone, 30, 0, 14, { collide: true, shadow: 'both' });
      [[25.4, 10.8], [34.6, 10.8], [25.4, 17.2], [34.6, 17.2]].forEach(([x, z]) => w.box(0.25, 5, 0.25, w.M({ color: '#3a3d40', metal: 0.6 }), x, 0.8, z, { shadow: 'cast' }));
      w.box(10.6, 0.25, 7.6, w.M({ color: '#f2efe8', rough: 0.6 }), 30, 5.8, 14, { shadow: 'both' });
      // 로비 위 유리 볼륨
      volume(w, -L.LW / 2 - 0.3, L.LW / 2 + 0.3, -L.LD - 0.3, 0.3, H, L.lobbyH + 0.8, w.glassMat('#c2d6dc', 0.3), { topMat: w.M({ color: '#d4cdc1' }) });
      // 공원의 배경이 되는 언덕
      hill(w, 10, -L.BL - 60, 150, 34, 70);
      w.trees(scatter(40, r => [(r() - 0.5) * 220, -L.BL - 20 - r() * 20], 31), 'round', { noCollide: true });
      // 하늘다리
      const deck = w.M({ color: '#d9d4cb', rough: 0.7 }), steel = w.M({ color: '#555b61', metal: 0.7, rough: 0.4 }), rail = w.glassMat('#cfe0e4', 0.3);
      const P = t => { const a = [-18, 4.2, 56], b = [-30, 7, 20], c = [-46, 7.5, -20], d = [-90, 8, -60]; const u = 1 - t; return [0, 1, 2].map(i => u * u * u * a[i] + 3 * u * u * t * b[i] + 3 * u * t * t * c[i] + t * t * t * d[i]); };
      const N = 40;
      for (let i = 0; i < N; i++) {
        const p0 = P(i / N), p1 = P((i + 1) / N), mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2, mz = (p0[2] + p1[2]) / 2;
        const len = Math.hypot(p1[0] - p0[0], p1[2] - p0[2]), ang = Math.atan2(p1[0] - p0[0], p1[2] - p0[2]);
        const g = new THREE.Group(); g.position.set(mx, my, mz); g.rotation.y = ang; w.scene.add(g);
        const dk = new THREE.Mesh(new THREE.BoxGeometry(4, 0.35, len + 0.05), deck); w.shadow(dk, 'both'); g.add(dk);
        const bm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, len + 0.05), steel); bm.position.y = -0.45; g.add(bm);
        [-1, 1].forEach(s => { const r = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.1, len), rail); r.position.set(s * 1.95, 0.7, 0); g.add(r); const h = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, len), steel); h.position.set(s * 1.95, 1.25, 0); g.add(h); });
        if (i % 4 === 2) { w.cyl(0.35, 0.35, my - 0.7, 12, steel, mx, 0, mz, { collide: true, shadow: 'cast' }); }
      }
      // 광장의 색 조형물
      const cols = ['#e94f37', '#f6c445', '#3f88c5', '#44bba4', '#ffffff'], r = Tex.rng(5);
      for (let i = 0; i < 7; i++) { const m = w.M({ color: cols[i % 5], rough: 0.5 }); w.box(1.4 - i * 0.08, 0.9, 1.4 - i * 0.08, m, 14 + (r() - 0.5) * 0.3, i * 0.9, 28, { ry: i * 0.35, shadow: 'both' }); }
      w.circleCollider(14, 28, 1.1, 10);
      titleBanner(w, 12, 3.6, 0.48, 6.4, 3.6, w.m.accent);
      w.banner([{ text: w.m.name, size: 80, color: '#3b3a36' }], 8, 0.9, -11, 3.4, 0.48, 0, { pw: 1024, ph: 115 });
      w.trees([[-12, 30], [12, 40], [28, 30], [30, 46], [-30, 44]], 'round');
      w.trees(scatter(50, r => { const x = (r() - 0.5) * 240, z = (r() - 0.5) * 200; return (Math.abs(x) < 50 && z > -L.BL - 10 && z < 60) ? null : [x, z]; }, 37), 'round', { noCollide: true });
      lampPosts(w, [[-5, 14], [5, 14], [-5, 30], [5, 30]]);
      w.spawn = { pos: new THREE.Vector3(4, 0, 50), yaw: 0.08 };
    },
    gyeongnam(w, L) {
      w.plazaW = 100; w.buildGround();
      const stone = w.M({ map: w.tex('plaster', 4, 4), color: '#f2f0eb', rough: 0.75 });   // 하얀 건물
      const H = 10, bw = L.BW / 2 + 0.35, cl = L.LW / 2 + 0.3, top = L.lobbyH + 1;
      shell(w, L, { h: H, mat: stone, uv: 5, noFront: true, lobbyOpen: true, openW: L.LW + 0.6, openD: L.LD + 0.2 });
      // 정면: 가운데 유리 아트리움 + 양옆 돌 덩어리
      w.wall(-bw - 8, 0.2, -cl, 0.2, H, stone, { thick: 0.4, uv: 5, shadow: 'both' });
      w.wall(cl, 0.2, bw + 8, 0.2, H, stone, { thick: 0.4, uv: 5, shadow: 'both' });
      [-1, 1].forEach(s => w.box(8, H, 14, stone, s * (bw + 4), 0, -6.8, { collide: true, shadow: 'both' }));
      glassFront(w, -cl, cl, top, 0, true, 0.25);
      volume(w, -cl, cl, -L.LD - 0.3, 0.3, H, top, w.glassMat('#c2d6dc', 0.25), { topMat: w.M({ color: '#cfc6b8' }) });
      w.box(L.LW + 2.4, 0.5, 2.4, w.M({ color: '#3a3d40', metal: 0.5, rough: 0.4 }), 0, top, 0.6, { shadow: 'both' });
      // 위층이 물러나며 만든 조각 테라스
      [-1, 1].forEach(sx => { w.box(bw - cl + 2, 3.6, 10, stone, sx * (cl + (bw - cl) / 2 + 0.5), H, -L.LD - 6, { shadow: 'both' }); w.box(bw - cl + 8, 1.1, 0.15, w.glassMat('#d0dde0', 0.35), sx * (cl + (bw - cl + 8) / 2 - 1), H, -2.4); });
      // 큰 두상 조각
      { const hm = w.M({ color: '#9a8e7e', rough: 0.55, metal: 0.2 }); const head = new THREE.Mesh(new THREE.SphereGeometry(1.6, 40, 30), hm); head.scale.set(0.8, 1.15, 0.95); head.position.set(-30, 2.7, 22); w.shadow(head, 'both'); w.scene.add(head); w.box(2.2, 0.9, 2.2, w.M({ color: '#cfc9bf' }), -30, 0, 22, { collide: true }); }
      // 정면 돌 면의 세로 홈
      for (let x = cl + 1.5; x < bw + 8; x += 3) [-1, 1].forEach(s => w.box(0.12, H - 1, 0.1, w.M({ color: '#d9d5cc' }), s * x, 0.5, 0.42));
      // 조각공원
      const lawn = w.M({ map: w.tex('grass', 5, 5), rough: 1 });
      w.floorRect(-46, 6, -16, 40, lawn, 0.01, { shadow: 'recv' }); w.floorRect(16, 6, 46, 40, lawn, 0.01, { shadow: 'recv' });
      sculptures(w, [[-36, 14, 'bronze', '#7a5a34'], [-24, 26, 'arc', '#2f5d8c'], [-38, 34, 'stack', '#5d5a55'], [24, 14, 'column', '#bdb6aa'], [36, 28, 'arc', '#c8643c']]);
      titleBanner(w, -(cl + bw + 8) / 2, 4.6, 0.45, 7, 4, w.m.accent);
      w.banner([{ text: w.m.name, size: 80, color: '#3a352e' }], 9, 1.0, (cl + bw + 8) / 2, 7.4, 0.45, 0, { pw: 1024, ph: 114 });
      mountainsFor(w);
      w.trees([[-20, 44], [20, 44], [-44, 44], [44, 44], [-46, 8], [46, 8]], 'round');
      w.trees(scatter(60, r => { const x = (r() - 0.5) * 260, z = (r() - 0.5) * 240; return (Math.abs(x) < 52 && z > -L.BL - 10 && z < 60) ? null : [x, z]; }, 41), 'round', { noCollide: true });
      lampPosts(w, [[-6, 14], [6, 14], [-6, 30], [6, 30]]);
      w.spawn = { pos: new THREE.Vector3(0, 0, 48), yaw: 0 };
    }
  });

  Object.assign(lobbySize, { warehouse: { w: 30, d: 24 }, panorama: { w: 36, d: 24 }, garden: { w: 30, d: 24 }, bridgevoid: { w: 28, d: 26 } });

  Object.assign(lobby, {
    warehouse(w, L) {
      const brick = w.M({ map: w.tex('brick', 1, 1), rough: 0.9, color: '#e6c6b8', zone: 'in' });
      lobbyBox(w, L, { wallMat: brick, uv: 4, wallH: 7, noCeil: true, floorMat: w.M({ map: w.tex('woodStrip', 5, 4), color: '#a98564', rough: 0.6, zone: 'in' }) });
      const lw = L.LW / 2, ld = L.LD, H0 = 7, rise = 3.3;
      // 나무 박공 천장 + 트러스
      const wood = w.M({ map: w.tex('wood', 6, 3), color: '#d9b48a', rough: 0.8, side: THREE.DoubleSide, zone: 'in' });
      quad(w, [[-lw, H0, 0], [-lw, H0, -ld], [0, H0 + rise, -ld], [0, H0 + rise, 0]], wood, { uv: [1, 1], shadow: 'none' });
      quad(w, [[lw, H0, -ld], [lw, H0, 0], [0, H0 + rise, 0], [0, H0 + rise, -ld]], wood, { uv: [1, 1], shadow: 'none' });
      const brickD = w.M({ map: w.tex('brick', 0.3, 0.3), rough: 0.9, color: '#e6c6b8', side: THREE.DoubleSide, zone: 'in' });
      tri(w, [-lw, H0, -0.2], [lw, H0, -0.2], [0, H0 + rise, -0.2], brickD); tri(w, [-lw, H0, -ld - 0.05], [lw, H0, -ld - 0.05], [0, H0 + rise, -ld - 0.05], brickD);
      const beam = w.M({ color: '#6b4a2e', rough: 0.7, zone: 'in' }), b = [];
      const ang = Math.atan2(rise, lw), rl = Math.hypot(lw, rise);
      for (let z = -2; z > -ld + 1; z -= 3.5) {
        b.push([0, H0 - 0.12, z, L.LW, 0.25, 0.25, 0]);
        b.push([0, H0 + rise / 2, z, 0.18, rise, 0.18, 0]);
        [-1, 1].forEach(s => { const m = new THREE.Mesh(new THREE.BoxGeometry(rl, 0.22, 0.22), beam); m.position.set(s * lw / 2, H0 + rise / 2 - 0.12, z); m.rotation.z = s < 0 ? ang : -ang; w.scene.add(m); });
      }
      instBoxes(w, b, beam);
      // 펜던트 조명
      const shade = w.M({ color: '#2e2b28', metal: 0.5, rough: 0.4, side: THREE.DoubleSide, zone: 'in' });
      for (let z = -3.75; z > -ld + 1; z -= 3.5) [-7, 7].forEach(x => { const c = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.4, 16, 1, true), shade); c.position.set(x, 4.8, z); w.scene.add(c); const d = new THREE.Mesh(new THREE.CircleGeometry(0.36, 16), w.Basic('#ffdcaa', 3)); d.rotation.x = PI / 2; d.position.set(x, 4.62, z); w.scene.add(d); });
      // 노란 문 장식 (옆벽)
      const door = w.M({ map: w.tex('wood', 1, 1), color: '#e8b53c', rough: 0.7, zone: 'in' });
      [-1, 1].forEach(s => [-6, -16].forEach(z => w.box(0.12, 3.8, 3, door, s * (lw - 0.02), 0, z)));
      // 긴 나무 테이블
      w.box(6, 0.08, 1.4, w.M({ map: w.tex('wood', 2, 1), color: '#b88b5e', rough: 0.5, zone: 'in' }), 0, 0.8, -9, { collide: true });
      [-2.7, 2.7].forEach(x => w.box(0.1, 0.8, 1.2, beam, x, 0, -9));
      welcome(w, L, { ink: '#2a1e16', panel: '#f4ede3', deskColor: '#6b4a2e', deskTop: '#e8b53c' });
    },
    panorama(w, L) {
      lobbyBox(w, L, { noLeft: true, floorMat: w.M({ map: w.tex('woodStrip', 6, 4), color: '#d9b994', rough: 0.55, zone: 'in' }) });
      const lw = L.LW / 2, ld = L.LD, H = L.lobbyH;
      // 저수지 쪽 통유리
      const glass = w.glassMat('#c7d8dc', 0.12), mull = w.M({ color: '#3a3530', metal: 0.5, rough: 0.4, zone: 'in' });
      w.wall(-lw - 0.15, 0, -lw - 0.15, -ld, H, glass, { thick: 0.05 });
      for (let z = 0; z >= -ld; z -= 3) w.box(0.14, H, 0.14, mull, -lw - 0.15, 0, z);
      w.box(0.14, 0.1, ld, mull, -lw - 0.15, 3.2, -ld / 2);
      Arch.ceiling(w, { x0: -lw, x1: lw, z0: -ld, z1: 0 }, 'vault', H, 0);
      // 창을 바라보는 긴 의자
      for (let z = -4; z > -ld + 3; z -= 5) w.bench(-lw + 4, z, PI / 2, 3.4, 'in', '#7a5a3c');
      // 따뜻한 펜던트 구름
      const r = Tex.rng(11), glow = w.Basic('#ffd9a8', 2.2);
      for (let i = 0; i < 22; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.22 + r() * 0.2, 16, 12), glow); const x = -2 + (r() - 0.5) * 10, z = -ld / 2 + (r() - 0.5) * 10, y = 4.5 + r() * 3; s.position.set(x, y, z); w.scene.add(s);
        const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute([x, H, z, x, y, z], 3)); w.scene.add(new THREE.Line(cg, new THREE.LineBasicMaterial({ color: '#555' }))); }
      welcome(w, L, { deskX: lw - 5, deskZ: -6 });
    },
    garden(w, L) {
      lobbyBox(w, L, { noCeil: true, floorMat: w.M({ map: w.tex('stonePaving', 5, 4), color: '#efe9df', rough: 0.8, zone: 'in' }) });
      const lw = L.LW / 2, ld = L.LD, H = L.lobbyH;
      w.ceilRect(-lw, 0, lw, -ld, w.M({ map: w.tex('wood', 8, 6), color: '#f0d9bb', rough: 0.85, zone: 'in' }), H);
      // 둥근 빛우물 아래 실내 정원
      const wells = [[-6, -8], [6, -8], [-4, -17.5]];
      const bt = w.tex('beam', 1, 1, false), soil = w.M({ map: w.tex('grass', 2, 2), rough: 1, zone: 'in' }), rim = w.M({ color: '#cfc6b8', rough: 0.8, zone: 'in' });
      wells.forEach(([x, z], i) => {
        const disc = new THREE.Mesh(new THREE.CircleGeometry(2.2, 40), w.Basic('#fff8ea', 2.6)); disc.rotation.x = PI / 2; disc.position.set(x, H - 0.02, z); w.scene.add(disc);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(2.25, 0.08, 8, 48), w.matTrim); ring.rotation.x = PI / 2; ring.position.set(x, H - 0.05, z); w.scene.add(ring);
        const cone = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.6, H, 32, 1, true), new THREE.MeshBasicMaterial({ color: '#fff6e0', alphaMap: bt, transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
        cone.position.set(x, H / 2, z); cone.geometry.attributes.uv.array.forEach((v, k, arr) => { if (k % 2 === 0) arr[k] = 0.5; }); w.scene.add(cone);
        w.cyl(2.4, 2.4, 0.55, 40, rim, x, 0, z, { collide: true });
        const g = new THREE.Mesh(new THREE.CircleGeometry(2.3, 40), soil); g.rotation.x = -PI / 2; g.position.set(x, 0.56, z); w.scene.add(g);
        w.lightPool(x, 0.58, z, 0, 5, 5, 0.25).rotation.set(-PI / 2, 0, 0);
      });
      w.trees(wells.map(([x, z]) => [x, z, 1.05]), 'round', { noCollide: true, leaf: '#6f9a4a' });
      // 정원 둘레 의자
      w.bench(-6, -4.6, 0, 2.6); w.bench(6, -4.6, 0, 2.6); w.bench(-4, -14.1, 0, 2.6);
      welcome(w, L, { titleX: -lw + 0.17, titleZ: -ld * 0.55, titleRy: PI / 2, dirX: lw - 0.17, dirZ: -ld * 0.62, dirRy: -PI / 2, deskX: lw - 4.5, deskZ: -4 });
    },
    bridgevoid(w, L) {
      lobbyBox(w, L, { noCeil: true, frontGlass: true, floorMat: w.M({ map: w.tex('granite', 5, 5), color: '#efeae2', rough: 0.45, zone: 'in', envI: 0.9 }) });
      const lw = L.LW / 2, ld = L.LD, H = L.lobbyH, y2 = 5.2;
      // 천창
      w.ceilRect(-lw, 0, lw, -ld, w.matCeil, H);
      Arch.ceiling(w, { x0: -lw + 5, x1: lw - 5, z0: -ld + 4, z1: -4 }, 'grid', H, 0);
      // 양옆 2층 발코니 + 가운데를 가로지르는 브리지
      const slab = w.M({ color: '#f4f2ee', rough: 0.8, zone: 'in' }), rail = w.glassMat('#d3e0e3', 0.25), steel = w.M({ color: '#2f3236', metal: 0.7, rough: 0.35, zone: 'in' });
      [-1, 1].forEach(s => {
        const x = s * (lw - 2.2);
        w.box(4.4, 0.45, ld - 6, slab, x, y2 - 0.45, -ld / 2 - 1);
        w.box(0.04, 1.1, ld - 6, rail, x - s * 2.2, y2, -ld / 2 - 1); w.box(0.08, 0.06, ld - 6, steel, x - s * 2.2, y2 + 1.1, -ld / 2 - 1);
        for (let z = -5; z > -ld + 3; z -= 5) w.cyl(0.18, 0.18, y2 - 0.45, 12, steel, x - s * 1.6, 0, z, { collide: true });
      });
      const bz = -ld / 2;
      w.box(L.LW - 8.8, 0.4, 3, slab, 0, y2 - 0.4, bz);
      [-1, 1].forEach(s => { w.box(L.LW - 8.8, 1.1, 0.04, rail, 0, y2, bz + s * 1.5); w.box(L.LW - 8.8, 0.06, 0.08, steel, 0, y2 + 1.1, bz + s * 1.5); });
      w.box(L.LW - 8.8, 0.25, 0.5, steel, 0, y2 - 0.65, bz);
      // 계단 (뒤쪽 왼편, 발코니로)
      const stepM = w.M({ color: '#e9e5de', rough: 0.7, zone: 'in' }), n = 16;
      for (let i = 0; i < n; i++) w.box(2.4, y2 / n * (i + 1), 0.4, stepM, -lw + 5.6, 0, -6 - i * 0.4);
      w.boxCollider(-lw + 4.4, -lw + 6.8, -6 - n * 0.4, -5.8);
      welcome(w, L, { titleY: 2.6, deskX: 4, deskZ: -5 });
    }
  });

  // 추가 천장 스타일
  const CEIL2 = {
    beams(w, rect, H) { // 노출 목조 보
      const { x0, x1, z0, z1 } = rect, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, b = [];
      if (z1 - z0 >= x1 - x0) for (let z = z0 + 0.8; z < z1; z += 1.6) b.push([cx, H - 0.2, z, x1 - x0, 0.4, 0.22]);
      else for (let x = x0 + 0.8; x < x1; x += 1.6) b.push([x, H - 0.2, cz, 0.22, 0.4, z1 - z0]);
      instBoxes(w, b, w.M({ color: '#7a5434', rough: 0.75, zone: 'in' }));
      downlights(w, x0, z0, x1, z1, H - 0.4, 3.2, '#ffe4bd');
    },
    vault(w, rect, H) { // 완만한 볼트 천장
      const { x0, x1, z0, z1 } = rect, wx = x1 - x0, wz = z1 - z0, alongZ = wz >= wx;
      const span = alongZ ? wx : wz, len = alongZ ? wz : wx, r = span / 2, dep = Math.min(1.4, r * 0.22), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      const mat = w.M({ color: '#f7f4ee', rough: 0.95, side: THREE.BackSide, zone: 'in', emissive: '#f7f1e6', emissiveI: 0.55 });
      let m;
      if (alongZ) { m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 32, 1, true, -PI / 2, PI), mat); m.scale.set(1, 1, dep / r); m.rotation.x = -PI / 2; }
      else { m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 32, 1, true, 0, PI), mat); m.scale.set(dep / r, 1, 1); m.rotation.z = PI / 2; }
      m.position.set(cx, H - dep, cz); w.scene.add(m);
      if (alongZ) { w.plane(0.25, len - 1, w.matLight, cx, H - 0.03, cz, PI / 2, 0); [-1, 1].forEach(s => w.plane(0.12, len, w.matLight, cx + s * (r - 0.1), H - dep - 0.02, cz, PI / 2, 0)); }
      else { w.plane(len - 1, 0.25, w.matLight, cx, H - 0.03, cz, PI / 2, 0); [-1, 1].forEach(s => w.plane(len, 0.12, w.matLight, cx, H - dep - 0.02, cz + s * (r - 0.1), PI / 2, 0)); }
    },
    circles(w, rect, H) { // 둥근 빛우물
      const { x0, x1, z0, z1 } = rect, pts = [];
      for (let x = x0 + 2.5; x < x1 - 1; x += 4.5) for (let z = z0 + 2.5; z < z1 - 1; z += 4.5) pts.push([x, z]);
      const geo = new THREE.CircleGeometry(0.8, 32); geo.rotateX(PI / 2);
      const im = new THREE.InstancedMesh(geo, w.matLight, pts.length), d = new THREE.Object3D();
      const rg = new THREE.TorusGeometry(0.85, 0.05, 6, 32); rg.rotateX(PI / 2);
      const im2 = new THREE.InstancedMesh(rg, w.matTrim, pts.length);
      pts.forEach((p, i) => { d.position.set(p[0], H - 0.02, p[1]); d.updateMatrix(); im.setMatrixAt(i, d.matrix); d.position.y = H - 0.04; d.updateMatrix(); im2.setMatrixAt(i, d.matrix); });
      w.scene.add(im, im2);
    },
    cove(w, rect, H) { // 가장자리 간접조명 + 내려온 가운데 판
      const { x0, x1, z0, z1 } = rect, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, wx = x1 - x0, wz = z1 - z0;
      w.box(wx - 2.4, 0.3, wz - 2.4, w.M({ color: '#f6f5f2', rough: 0.9, zone: 'in' }), cx, H - 0.6, cz);
      const glow = w.Basic(w.m.interior.light, 2.0);
      w.plane(wx - 2.4, 0.5, glow, cx, H - 0.01, z0 + 0.95, PI / 2, 0); w.plane(wx - 2.4, 0.5, glow, cx, H - 0.01, z1 - 0.95, PI / 2, 0);
      w.plane(0.5, wz - 2.4, glow, x0 + 0.95, H - 0.01, cz, PI / 2, 0); w.plane(0.5, wz - 2.4, glow, x1 - 0.95, H - 0.01, cz, PI / 2, 0);
    }
  };

  window.Arch = { exterior, lobby, lobbySize, ceiling, shell, welcome };
})();
