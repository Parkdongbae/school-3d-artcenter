/* =========================================================
 * 로비 소장품: 로비의 빈 벽에 큰 그림을 걸고, 빈 자리에 조형물을 놓습니다.
 *  - 미술관마다 로비 모양이 달라서, 벽이 실제로 비어 있는지 빛줄기(raycast)로 확인한 뒤에 겁니다.
 *  - 그림은 assets/lobby/*.jpg (전시관을 위해 새로 만든 그림 · 실제 작가의 작품이 아닙니다)
 *  - 학생 작품이 아니므로 작품 목록·좋아요·감상평에는 들어가지 않습니다.
 * ========================================================= */
(function () {
  const W = World.prototype, PI = Math.PI, V3 = THREE.Vector3;
  // ar = 가로 ÷ 세로
  const PIECES = [
    { f: '01', t: '푸른 호흡', ar: 1 }, { f: '02', t: '안개 낀 강', ar: 1.5 }, { f: '03', t: '둥근 것들의 대화', ar: 0.714 }, { f: '04', t: '노을의 층', ar: 0.707 },
    { f: '05', t: '봄날의 운동장', ar: 1 }, { f: '06', t: '흰 결', ar: 1 }, { f: '07', t: '밤의 물빛', ar: 1.5 }, { f: '08', t: '초록 정물', ar: 1 }
  ];
  const MAX_WALL = 6;

  // 큰 그림 한 점 (x,z = 벽면 위의 점, n = 벽에서 방 안쪽을 향하는 방향)
  W.lobbyPiece = function (pc, x, y, z, nx, nz, maxW, maxH) {
    const I = this.m.interior, dark = !!I.dark;
    let w = Math.min(maxW, maxH * pc.ar), h = w / pc.ar;
    const ry = Math.atan2(nx, nz), g = new THREE.Group(); g.position.set(x + nx * 0.02, y, z + nz * 0.02); g.rotation.y = ry; this.scene.add(g);
    const f = 0.07, depth = 0.09;
    const frameM = this.M({ color: dark ? '#0c0c0e' : (pc.ar < 1 ? '#3b2f26' : '#15151a'), rough: 0.4, metal: dark ? 0.5 : 0.15, zone: 'in' });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w + f * 2, h + f * 2, depth), frameM); frame.position.z = depth / 2; g.add(frame);
    const drop = new THREE.Mesh(new THREE.PlaneGeometry((w + f * 2) * 1.16, (h + f * 2) * 1.16), this.dropMat()); drop.position.set(0.04, -0.09, 0.002); drop.renderOrder = 1; g.add(drop);
    const imgM = new THREE.MeshStandardMaterial({ color: '#d8d6d0', roughness: 0.7, metalness: 0, emissive: '#ffffff', emissiveIntensity: 0 });
    const img = new THREE.Mesh(new THREE.PlaneGeometry(w, h), imgM); img.position.z = depth + 0.002; g.add(img);
    new THREE.TextureLoader().load(`assets/lobby/${pc.f}.jpg`, tex => {
      if (this.disposed) { tex.dispose(); return; }
      tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; this.textures.push(tex);
      imgM.color.set('#ffffff'); imgM.map = tex; imgM.emissiveMap = tex; imgM.emissiveIntensity = dark ? 0.8 : 0.42; imgM.needsUpdate = true;
    });
    // 빛 웅덩이 + 설명 판
    const pool = this.lightPool(0, 0, 0, 0, w + 2.6, h + 3.2, dark ? 0.42 : 0.3); this.scene.remove(pool); pool.position.set(0, 0.5, 0.004); pool.rotation.set(0, 0, 0); g.add(pool);
    const cap = Tex.text([{ text: pc.t, size: 46, color: dark ? '#f2f2f2' : '#151515' }, { text: '로비 소장품 · 전시관을 위해 새로 만든 그림', size: 24, weight: 400, color: dark ? '#b8b8b8' : '#666' }], { w: 640, h: 160, align: 'left', pad: 24 });
    this.textures.push(cap);
    const cm = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.21), this.M({ map: cap, transparent: true, rough: 0.9, zone: 'in' })); cm.position.set(w / 2 + f + 0.56, -h / 2 + 0.2, 0.004); cm.renderOrder = 2; g.add(cm);
    return g;
  };

  W.buildLobbyArt = function (L) {
    const lw = L.LW / 2, ld = L.LD, seed = Math.max(0, MUSEUMS.findIndex(m => m.id === this.m.id));
    const order = PIECES.map((p, i) => PIECES[(i * 3 + seed) % PIECES.length]); // 미술관마다 다른 순서
    this.scene.updateMatrixWorld(true);
    const solids = []; this.scene.traverse(o => { if (o.isMesh && o.visible) solids.push(o); });
    const ray = new THREE.Raycaster(), o3 = new V3(), d3 = new V3();
    const cast = (x, y, z, dx, dz, far) => { o3.set(x, y, z); d3.set(dx, 0, dz); ray.set(o3, d3); ray.far = far; return ray.intersectObjects(solids, false)[0]; };
    // 벽 찾기: (ox,oz)에서 (dx,dz) 쪽으로 쏘아, 폭 wd·높이 ht 범위가 모두 같은 평평한 빈 벽인지 확인
    const probe = (ox, oz, dx, dz, wd, ht, cy) => {
      const first = cast(ox, cy, oz, dx, dz, 14); if (!first) return null;
      const dist = first.distance, tx = -dz, tz = dx;
      const isWall = h => { if (!h || Math.abs(h.distance - dist) > 0.06) return false; const m = Array.isArray(h.object.material) ? h.object.material[0] : h.object.material; return h.object.geometry.type === 'BoxGeometry' && m.isMeshStandardMaterial && !m.transparent && !m.emissiveMap; };
      for (const u of [-0.55, -0.28, 0, 0.28, 0.55]) for (const v of [-0.55, 0, 0.55]) if (!isWall(cast(ox + tx * u * wd, cy + v * ht, oz + tz * u * wd, dx, dz, dist + 1))) return null;
      // 그림 앞 2.6m 안에 가구가 없어야 함 (허리 높이에서 확인)
      for (const u of [-0.4, 0, 0.4]) { const h = cast(ox + dx * (dist - 2.6) + tx * u * wd, 0.6, oz + dz * (dist - 2.6) + tz * u * wd, dx, dz, 3); if (!h || h.distance < 2.5) return null; }
      return { x: ox + dx * dist, z: oz + dz * dist };
    };
    let k = 0; const placed = [];
    const tryWall = (ox, oz, dx, dz, room) => {
      if (k >= MAX_WALL) return;
      const pc = order[k % order.length], maxW = Math.min(room, pc.ar >= 1 ? 4.6 : 2.7), maxH = pc.ar >= 1 ? 3.1 : 3.5;
      const w = Math.min(maxW, maxH * pc.ar), h = w / pc.ar, cy = 1.15 + h / 2 + 0.35;
      if (w < 1.8) return;
      const p = probe(ox, oz, dx, dz, w + 0.5, h + 0.4, cy); if (!p) return;
      if (Math.abs(p.x) > lw + 1.2 || p.z > 0.2 || p.z < -ld - 1.2) return; // 로비 벽만
      if (placed.some(q => Math.hypot(q.x - p.x, q.z - p.z) < 4.5)) return;
      this.lobbyPiece(pc, p.x, cy, p.z, -dx, -dz, w, h); placed.push(p); k++;
    };
    // 후보: 입구 양옆 벽 → 옆벽(앞·뒤) → 뒷벽 바깥쪽
    const fx = (lw + 3.2) / 2;
    tryWall(-fx, -4.5, 0, 1, lw - 3.2 - 1.6); tryWall(fx, -4.5, 0, 1, lw - 3.2 - 1.6);
    [-ld * 0.3, -ld * 0.68].forEach(z => { tryWall(-lw + 5, z, -1, 0, ld * 0.3); tryWall(lw - 5, z, 1, 0, ld * 0.3); });
    [-ld * 0.5].forEach(z => { tryWall(-lw + 5, z, -1, 0, ld * 0.3); tryWall(lw - 5, z, 1, 0, ld * 0.3); });

    // 빈 바닥 찾기 (충돌선에서 r 이상 떨어진 곳)
    const clear = (x, z, r) => {
      for (const c of this.colliders) {
        const ex = c.bx - c.ax, ez = c.bz - c.az, L2 = ex * ex + ez * ez || 1e-6; let t = ((x - c.ax) * ex + (z - c.az) * ez) / L2; t = Math.max(0, Math.min(1, t));
        if (Math.hypot(x - (c.ax + ex * t), z - (c.az + ez * t)) < r + c.t) return false;
      }
      return !(this.waterRects || []).some(w => x > w[0] - r && x < w[2] + r && z > w[1] - r && z < w[3] + r);
    };
    const floorAt = (x, z) => { o3.set(x, 2.5, z); d3.set(0, -1, 0); ray.set(o3, d3); ray.far = 3; const h = ray.intersectObjects(solids, false)[0]; return h && Math.abs(h.point.y) < 0.05; }; // 평평한 바닥(화단·물 위가 아님)

    // 벽에 걸 자리가 모자라면 자립 벽(양면)에 건다
    if (k < 3) {
      const spots = [[-lw * 0.5, -ld * 0.42, PI / 2], [lw * 0.5, -ld * 0.42, -PI / 2], [-lw * 0.5, -ld * 0.72, PI / 2], [lw * 0.5, -ld * 0.72, -PI / 2]];
      for (const [x, z, ry] of spots) {
        if (k >= 4) break;
        if (!clear(x, z, 2.9) || !floorAt(x, z)) continue;
        const pc = order[k % order.length], h = pc.ar >= 1 ? 2.3 : 2.9, w = h * pc.ar, sw = w + 1.2, sh = h + 1.5;
        const slab = this.M({ color: this.m.interior.dark ? '#1b1b1f' : '#f6f4ef', map: this.tex('plaster', 2, 2), rough: 0.9, zone: 'in' });
        this.box(0.36, sh, sw, slab, x, 0, z, { collide: true });
        this.box(0.44, 0.08, sw + 0.08, this.matTrim, x, 0, z);
        const s = Math.sign(Math.sin(ry)); // 가운데 통로 쪽 면
        this.lobbyPiece(pc, x + s * 0.18, 0.75 + h / 2 + 0.2, z, s, 0, w, h); k++;
        const pc2 = order[k % order.length]; if (pc2.ar >= 1 === pc.ar >= 1) { this.lobbyPiece(pc2, x - s * 0.18, 0.75 + h / 2 + 0.2, z, -s, 0, w, w / pc2.ar > h ? h * pc2.ar : w); k++; }
        this.mapShapes.push({ type: 'rect', x0: x - 0.2, z0: z - sw / 2, x1: x + 0.2, z1: z + sw / 2, color: 'rgba(255,255,255,0.3)' });
      }
    }
    // 큰 조형물 두 점 (뒤쪽 구석 → 앞쪽 구석 순으로 빈 곳에)
    let sc = 0;
    for (const [x, z] of [[-lw + 2.6, -ld + 2.8], [lw - 2.6, -ld + 2.8], [-lw + 2.6, -2.8], [lw - 2.6, -2.8], [-lw * 0.45, -ld * 0.55], [lw * 0.45, -ld * 0.55]]) {
      if (sc >= 2) break;
      if (!clear(x, z, 1.5) || !floorAt(x, z) || placed.some(q => Math.hypot(q.x - x, q.z - z) < 3.4)) continue;
      const g = this.sculpture(x, z, seed * 5 + sc * 11 + 2, { plinth: 0.5 }); g.scale.setScalar(2.5); sc++;
    }
    this.lobbyArtCount = k;
  };
})();
