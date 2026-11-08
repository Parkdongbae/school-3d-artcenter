/* =========================================================
 * Decor: 나무·조경, 실내 볼거리(조각·화분·슬라이드 화면·모자이크 벽),
 *        초고해상도 전용 실제 조명과 잔디
 * ========================================================= */
(function () {
  const W = World.prototype, PI = Math.PI;

  /* ---------- 지오메트리 합치기 ---------- */
  function merge(geos) {
    const parts = geos.map(g => (g.index ? g.toNonIndexed() : g));
    const n = parts.reduce((a, g) => a + g.attributes.position.count, 0);
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
    let o = 0;
    parts.forEach(g => {
      const c = g.attributes.position.count;
      pos.set(g.attributes.position.array, o * 3);
      if (g.attributes.normal) nor.set(g.attributes.normal.array, o * 3);
      if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
      o += c;
    });
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    return out;
  }
  function blob(r, detail, rnd, amt = 0.18) { // 울퉁불퉁한 잎 덩어리 (같은 위치의 정점은 같이 움직여 틈이 없음)
    const g = new THREE.IcosahedronGeometry(r, detail), p = g.attributes.position, v = new THREE.Vector3(), n = new THREE.Vector3();
    const sd = [rnd() * 10, rnd() * 10, rnd() * 10], nor = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i); n.copy(v).normalize();
      const k = 1 + Math.sin(n.x * 4.1 + sd[0]) * Math.sin(n.y * 3.7 + sd[1]) * Math.sin(n.z * 4.3 + sd[2]) * amt + Math.sin(n.x * 9 + n.z * 7 + sd[0]) * amt * 0.25;
      v.multiplyScalar(k); p.setXYZ(i, v.x, v.y, v.z); nor[i * 3] = n.x; nor[i * 3 + 1] = n.y; nor[i * 3 + 2] = n.z;
    }
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); return g;
  }
  function limb(x0, y0, z0, x1, y1, z1, r0, r1) {
    const a = new THREE.Vector3(x0, y0, z0), b = new THREE.Vector3(x1, y1, z1), len = a.distanceTo(b);
    const g = new THREE.CylinderGeometry(r1, r0, len, 7, 1); g.translate(0, len / 2, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    g.applyQuaternion(q); g.translate(x0, y0, z0); return g;
  }
  // 나무 한 그루의 (줄기, 잎) 지오메트리
  function treeGeo(kind, seed) {
    const r = Tex.rng(seed), trunk = [], leaf = [];
    if (kind === 'pine') {
      trunk.push(limb(0, 0, 0, 0, 7.5, 0, 0.26, 0.08));
      const tiers = 5;
      for (let i = 0; i < tiers; i++) {
        const t = i / tiers, rad = 2.3 * (1 - t * 0.78), h = 2.4 - t * 0.9;
        const c = new THREE.ConeGeometry(rad, h, 9, 2), p = c.attributes.position;
        for (let k = 0; k < p.count; k++) if (p.getY(k) < h / 2 - 0.01) { const s = 0.8 + r() * 0.45; p.setX(k, p.getX(k) * s); p.setZ(k, p.getZ(k) * s); p.setY(k, p.getY(k) - r() * 0.35); }
        c.computeVertexNormals(); c.rotateY(r() * 6); c.translate(0, 1.9 + i * 1.25, 0); leaf.push(c);
      }
    } else if (kind === 'palm') {
      let x = 0, z = 0; const lean = 0.06 + r() * 0.05, dir = r() * 6.28, seg = 7, h = 6.6;
      for (let i = 0; i < seg; i++) { const nx = x + Math.cos(dir) * lean * (i + 1) * 0.35, nz = z + Math.sin(dir) * lean * (i + 1) * 0.35; trunk.push(limb(x, i * h / seg, z, nx, (i + 1) * h / seg, nz, 0.22 - i * 0.015, 0.21 - i * 0.015)); x = nx; z = nz; }
      for (let i = 0; i < 9; i++) {
        const a = i / 9 * 6.28 + r() * 0.3, f = new THREE.PlaneGeometry(0.9, 3.4, 1, 6), p = f.attributes.position;
        for (let k = 0; k < p.count; k++) { const yy = p.getY(k) + 1.7; p.setZ(k, -(yy * yy) * 0.12); p.setY(k, yy); }
        f.rotateX(-PI / 2 + 0.5); f.rotateY(a); f.translate(x, h, z); f.computeVertexNormals(); leaf.push(f);
      }
    } else {
      const H = 3.0 + r() * 0.8;
      trunk.push(limb(0, 0, 0, 0, H, 0, 0.24, 0.15));
      const crown = [];
      for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28 + r(), out = 0.9 + r() * 0.8, y = H + 0.3 + r() * 1.4; trunk.push(limb(0, H - 0.4, 0, Math.cos(a) * out, y, Math.sin(a) * out, 0.1, 0.05)); crown.push([Math.cos(a) * (out + 0.3), y + 0.4, Math.sin(a) * (out + 0.3)]); }
      crown.push([0, H + 2.1, 0], [0.3, H + 1.2, -0.4]);
      crown.forEach(([cx, cy, cz]) => { const b = blob(1.0 + r() * 0.5, 2, r); b.translate(cx, cy, cz); leaf.push(b); });
    }
    return { trunk: merge(trunk), leaf: merge(leaf) };
  }

  // 기존 trees()를 더 풍성한 나무로 교체
  W.trees = function (list, kind = 'round', o = {}) {
    if (!list.length) return;
    const variants = 3, groups = [[], [], []];
    list.forEach((t, i) => groups[i % variants].push(t));
    const leafTex = this.tex(kind === 'palm' ? 'frond' : 'leaves', kind === 'palm' ? 1 : 2, kind === 'palm' ? 1 : 2);
    const tM = this.M({ map: this.tex('bark', 1, 3), color: o.trunk || (kind === 'palm' ? '#a08a70' : '#8a7462'), rough: 1 });
    const lM = this.M({ map: leafTex, color: o.leaf || (kind === 'pine' ? '#3f5f3c' : kind === 'palm' ? '#5c8a40' : '#6a9148'), rough: 0.9, side: kind === 'palm' ? THREE.DoubleSide : THREE.FrontSide, transparent: false });
    if (kind === 'palm') { lM.alphaTest = 0.4; }
    else { lM.bumpMap = leafTex; lM.bumpScale = 1.2; }
    const col = new THREE.Color(), d = new THREE.Object3D();
    groups.forEach((g, vi) => {
      if (!g.length) return;
      const geo = treeGeo(kind, 101 + vi * 37 + (o.seed || 0));
      const trunks = new THREE.InstancedMesh(geo.trunk, tM, g.length), leaves = new THREE.InstancedMesh(geo.leaf, lM, g.length), r = Tex.rng(g.length * 17 + vi);
      g.forEach((t, i) => {
        const s = t[2] || (0.85 + r() * 0.45);
        d.position.set(t[0], 0, t[1]); d.rotation.set(0, r() * 6.28, 0); d.scale.set(s, s * (0.9 + r() * 0.25), s); d.updateMatrix();
        trunks.setMatrixAt(i, d.matrix); leaves.setMatrixAt(i, d.matrix);
        col.setHSL(0.08 + r() * 0.08, 0.15, 0.85 + r() * 0.25); leaves.setColorAt(i, col);
        if (!o.noCollide) this.circleCollider(t[0], t[1], 0.35, 6);
      });
      this.shadow(trunks, 'both'); this.shadow(leaves, 'cast');
      this.scene.add(trunks, leaves);
    });
  };

  /* ---------- 실내 조형물 ---------- */
  const SCULPT_MATS = [
    w => w.M({ color: '#f1eee8', map: w.tex('plaster', 1, 1), rough: 0.32, zone: 'in', envI: 0.9 }),      // 대리석
    w => w.M({ color: '#8c6a3c', rough: 0.32, metal: 0.9, zone: 'in', envI: 1.2 }),                         // 청동
    w => w.M({ color: '#d9dcdf', rough: 0.12, metal: 1.0, zone: 'in', envI: 1.4 }),                         // 스테인리스
    w => w.M({ color: w.m.accent, rough: 0.28, metal: 0.1, zone: 'in', envI: 1.0 }),                        // 색 래커
    w => w.M({ color: '#2a2a2c', rough: 0.4, metal: 0.3, zone: 'in' })                                       // 검은 화강
  ];
  W.sculpture = function (x, z, seed, o = {}) {
    const r = Tex.rng(seed * 31 + 7), I = this.m.interior;
    const mat = SCULPT_MATS[Math.floor(r() * SCULPT_MATS.length)](this);
    const plinthM = this.M({ color: I.dark ? '#18181b' : '#f7f6f3', rough: 0.85, zone: 'in' });
    const ph = o.plinth ?? (0.9 + r() * 0.2), pw = 0.75;
    this.box(pw, ph, pw, plinthM, x, 0, z, { collide: true });
    const g = new THREE.Group(); g.position.set(x, ph, z); g.rotation.y = r() * 6.28; this.scene.add(g);
    const kind = Math.floor(r() * 6);
    let m;
    if (kind === 0) { m = new THREE.Mesh(new THREE.TorusKnotGeometry(0.28, 0.08, 160, 20, 2, 3), mat); m.position.y = 0.45; }
    else if (kind === 1) { m = new THREE.Group(); for (let i = 0; i < 5; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.22 - i * 0.025, 32, 20), mat); b.scale.y = 0.7; b.position.set((r() - 0.5) * 0.06, 0.15 + i * 0.27, (r() - 0.5) * 0.06); m.add(b); } }
    else if (kind === 2) { // 비틀린 기둥
      const geo = new THREE.BoxGeometry(0.22, 1.1, 0.22, 2, 40, 2), p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) { const y = p.getY(i), a = (y + 0.55) * 2.4, c = Math.cos(a), s = Math.sin(a), X = p.getX(i), Z = p.getZ(i); p.setX(i, X * c - Z * s); p.setZ(i, X * s + Z * c); }
      geo.computeVertexNormals(); m = new THREE.Mesh(geo, mat); m.position.y = 0.55;
    }
    else if (kind === 3) { m = new THREE.Group(); for (let i = 0; i < 3; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.3 - i * 0.04, 0.035, 16, 64), mat); t.rotation.set(i * 1.1, i * 0.7, 0); t.position.y = 0.42; m.add(t); } }
    else if (kind === 4) { // 추상적 두상
      m = new THREE.Group(); const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 40, 30), mat); head.scale.set(0.82, 1.15, 0.95); head.position.y = 0.55; m.add(head);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.25, 24), mat); neck.position.y = 0.25; m.add(neck);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.12, 32), mat); base.position.y = 0.06; m.add(base);
    }
    else { const geo = new THREE.TorusGeometry(0.34, 0.11, 24, 80, PI * 1.35); m = new THREE.Mesh(geo, mat); m.rotation.z = PI * 0.82; m.position.y = 0.38; }
    g.add(m);
    g.traverse(c => { if (c.isMesh) { c.castShadow = false; } });
    if (o.spin) { const sp = (r() - 0.5) * 0.2; this.updaters.push(dt => { g.rotation.y += dt * sp; }); }
    // 위에서 떨어지는 빛
    const pool = this.lightPool(x, 0.015, z, 0, 2.2, 2.2, I.dark ? 0.35 : 0.22); pool.rotation.set(-PI / 2, 0, 0);
    return g;
  };

  /* ---------- 화분 ---------- */
  W.plant = function (x, z, seed = 1, size = 1) {
    const r = Tex.rng(seed * 13 + 3), I = this.m.interior;
    const pot = this.M({ color: ['#e9e5de', '#2b2b2b', '#b5653e', '#8b8f86'][Math.floor(r() * 4)], rough: 0.7, zone: 'in' });
    this.cyl(0.32 * size, 0.24 * size, 0.6 * size, 24, pot, x, 0, z, { collide: true });
    const leafM = this.M({ map: this.tex('leaf', 1, 1), color: '#5f8f45', rough: 0.7, side: THREE.DoubleSide, zone: 'in' }); leafM.alphaTest = 0.45;
    const geos = [];
    for (let i = 0; i < 16; i++) {
      const a = r() * 6.28, h = (0.9 + r() * 0.9) * size, lean = 0.2 + r() * 0.5;
      const lf = new THREE.PlaneGeometry(0.36 * size, 0.6 * size, 1, 3), p = lf.attributes.position;
      for (let k = 0; k < p.count; k++) { const yy = p.getY(k) + 0.3 * size; p.setZ(k, yy * yy * 0.6); p.setY(k, yy); }
      lf.rotateX(-lean); lf.rotateY(a); lf.translate(Math.cos(a) * 0.08, 0.6 * size + h * 0.6, Math.sin(a) * 0.08); lf.computeVertexNormals(); geos.push(lf);
      geos.push(limb(0, 0.55 * size, 0, Math.cos(a) * 0.08, 0.6 * size + h * 0.6, Math.sin(a) * 0.08, 0.012, 0.01));
    }
    const m = new THREE.Mesh(merge(geos), leafM); m.position.set(x, 0, z); this.scene.add(m);
  };

  /* ---------- 작품 슬라이드 화면 (양면) ---------- */
  W.slideshow = function (x, z, ry = 0) {
    const I = this.m.interior, frameM = this.M({ color: '#141416', rough: 0.4, metal: 0.4, zone: 'in' });
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; this.scene.add(g);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.3, 0.16), frameM); post.position.y = 0.65; g.add(post);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.6), frameM); foot.position.y = 0.03; g.add(foot);
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.9, 1.75, 0.1), frameM); body.position.y = 2.15; g.add(body);
    const screens = [1, -1].map(s => {
      const mat = new THREE.MeshBasicMaterial({ color: '#000000' });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2.76, 1.61), mat); m.position.set(0, 2.15, s * 0.052); if (s < 0) m.rotation.y = PI; g.add(m);
      return mat;
    });
    const cap = Tex.text([{ text: '', size: 30 }], { w: 512, h: 64 }); this.textures.push(cap);
    const c = Math.cos(ry), sn = Math.sin(ry), hw = 1.45;
    this.seg(x - c * hw, z + sn * hw, x + c * hw, z - sn * hw, 0.08);
    let idx = Math.floor(Math.random() * 1000), t = 99, fade = 0, cur = null;
    const fit = (mat, tex) => { // 비율 유지
      const ar = tex.image ? tex.image.width / tex.image.height : 1, sr = 2.76 / 1.61;
      tex = tex.clone(); tex.needsUpdate = true; this.textures.push(tex);
      if (ar > sr) { tex.repeat.set(1, ar / sr); tex.offset.set(0, (1 - ar / sr) / 2); } else { tex.repeat.set(sr / ar, 1); tex.offset.set((1 - sr / ar) / 2, 0); }
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; return tex;
    };
    const black = new THREE.Color('#000000');
    this.updaters.push(dt => {
      t += dt; fade = Math.min(1, fade + dt * 1.5);
      screens.forEach(m => m.color.setScalar(fade * (I.dark ? 1.1 : 1.25)));
      if (t > 6) {
        const ready = this.artSlots.filter(s => s.texS || s.texL);
        if (!ready.length) return;
        t = 0; fade = 0; idx = (idx + 1) % ready.length;
        const tex = ready[idx].texL || ready[idx].texS;
        screens.forEach(m => { if (m.map && m.map !== tex) m.map.dispose(); m.map = fit(m, tex); m.needsUpdate = true; });
      }
    });
    return g;
  };

  /* ---------- 모두의 작품 모자이크 벽 ---------- */
  W.mosaic = function (x, z, ry, wdt, hgt) {
    const cv = Tex.canvas(1536, Math.round(1536 * hgt / wdt)), ctx = cv.getContext('2d'), I = this.m.interior;
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; this.textures.push(tex);
    const mat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: 0.35, roughness: 0.8 }); mat.envMap = this.envIn;
    this.plane(wdt, hgt, mat, x + Math.sin(ry) * 0.03, 0.6 + hgt / 2 + 0.4, z + Math.cos(ry) * 0.03, 0, ry, { order: 2 });
    this.banner([{ text: '모두의 작품', size: 64, color: I.dark ? '#eee' : '#1a1a1a' }, { text: `작품 ${this.ex.artworks.length}점이 모였습니다`, size: 30, weight: 400, color: I.dark ? '#aaa' : '#666' }], wdt * 0.6, 0.55, x + Math.sin(ry) * 0.03, 0.6 + hgt + 0.85, z + Math.cos(ry) * 0.03, ry, { pw: 1024, ph: 160, zone: 'in' });
    // 칸 배치는 전체 작품 수로 고정하고, 사진이 도착하는 대로 한 칸씩 그려 넣음
    const n = Math.max(1, this.artSlots.length), W2 = cv.width, H2 = cv.height;
    const cols = Math.ceil(Math.sqrt(n * W2 / H2)), rows = Math.ceil(n / cols), cw = W2 / cols, ch = H2 / rows, gap = Math.max(2, cw * 0.04);
    ctx.fillStyle = I.dark ? '#0e0e10' : '#f3f1ec'; ctx.fillRect(0, 0, W2, H2);
    ctx.fillStyle = I.dark ? '#1c1c20' : '#e4e0d8';
    for (let i = 0; i < n; i++) ctx.fillRect((i % cols) * cw + gap / 2, Math.floor(i / cols) * ch + gap / 2, cw - gap, ch - gap);
    const paint = () => {
      let changed = false;
      this.artSlots.forEach((s, i) => {
        const tex = s.texS || s.texL; if (s.mosaicDone || !tex || !tex.image) return;
        const img = tex.image, cx = (i % cols) * cw, cy = Math.floor(i / cols) * ch;
        const ar = img.width / img.height, tw = cw - gap, th = ch - gap; let sw = img.width, sh = img.height, sx = 0, sy = 0;
        if (ar > tw / th) { sw = img.height * tw / th; sx = (img.width - sw) / 2; } else { sh = img.width * th / tw; sy = (img.height - sh) / 2; }
        try { ctx.drawImage(img, sx, sy, sw, sh, cx + gap / 2, cy + gap / 2, tw, th); s.mosaicDone = true; changed = true; } catch (e) { }
      });
      if (changed) tex.needsUpdate = true;
    };
    let acc = 0; this.updaters.push(dt => { acc += dt; if (acc > 2) { acc = 0; paint(); } });
  };

  /* ---------- 초고해상도: 실제 스포트라이트가 가까운 작품을 비춤 ---------- */
  W.buildSpotPool = function () {
    const I = this.m.interior, n = 10;
    this.spots = [];
    for (let i = 0; i < n; i++) {
      const s = new THREE.SpotLight(I.light, 0, 9, 0.42, 0.65, 1.6);
      s.position.set(0, -50, 0); s.target.position.set(0, -60, 0);
      this.scene.add(s, s.target); this.spots.push(s);
    }
    let acc = 1;
    this.updaters.push((dt, t, p) => {
      acc += dt; if (acc < 0.35) return; acc = 0;
      const inside = this.app.inside > 0.3;
      const near = inside ? this.artSlots.map(s => [s, (s.x - p.x) ** 2 + (s.z - p.z) ** 2]).filter(a => a[1] < 22 * 22).sort((a, b) => a[1] - b[1]).slice(0, n) : [];
      this.spots.forEach((L, i) => {
        const a = near[i];
        if (!a) { L.intensity = 0; return; }
        const s = a[0];
        L.position.set(s.x + s.nx * 1.6, World.GALLERY_H - 0.35, s.z + s.nz * 1.6);
        L.target.position.set(s.x, 1.68, s.z); L.target.updateMatrixWorld();
        L.intensity = I.dark ? 26 : 18;
      });
    });
    // 가짜 빛 웅덩이는 은은하게
    this.artSlots.forEach(s => { s.pool.material.opacity *= 0.45; });
  };

  /* ---------- 초고해상도: 잔디 덤불 ---------- */
  W.grassTufts = function (count = 5000) {
    const tex = this.tex('grassTuft', 1, 1);
    const mat = new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1, color: this.m.id === 'busan' ? '#a8a070' : '#ffffff' }); mat.envMap = this.envOut;
    const g1 = new THREE.PlaneGeometry(0.7, 0.45); g1.translate(0, 0.22, 0); const g2 = g1.clone(); g2.rotateY(PI / 2);
    const geo = merge([g1, g2]);
    const im = new THREE.InstancedMesh(geo, mat, count), d = new THREE.Object3D(), r = Tex.rng(99), L = this.L;
    const pl = this.plazaRect || [-45, 0, 45, 70], water = this.waterRects || [];
    let k = 0, guard = 0;
    while (k < count && guard++ < count * 8) {
      const x = (r() - 0.5) * 160, z = -L.BL - 20 + r() * (L.BL + 110);
      if (x > pl[0] - 0.5 && x < pl[2] + 0.5 && z > pl[1] - 0.5 && z < pl[3] + 0.5) continue;
      if (Math.abs(x) < L.BW / 2 + 1.5 && z < 1 && z > -L.BL - 1) continue;
      if (water.some(w => x > w[0] - 0.5 && x < w[2] + 0.5 && z > w[1] - 0.5 && z < w[3] + 0.5)) continue;
      if (this.noGrass && this.noGrass.some(w => x > w[0] && x < w[2] && z > w[1] && z < w[3])) continue;
      d.position.set(x, 0, z); d.rotation.y = r() * 6.28; const s = 0.7 + r() * 0.8; d.scale.set(s, s, s); d.updateMatrix(); im.setMatrixAt(k++, d.matrix);
    }
    im.count = k; this.scene.add(im);
  };
})();
