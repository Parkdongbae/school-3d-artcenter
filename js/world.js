/* =========================================================
 * World: 하나의 미술관(외부 + 로비 + 복도 + 학급 전시실)을 짓는 엔진
 *  좌표계: 입구 정면 = z 0, 건물은 -z 방향으로, 광장은 +z 방향
 * ========================================================= */
(function () {
  const V3 = THREE.Vector3;
  const GALLERY_H = 5.6;
  const SPINE_HW = 4;     // 복도 반폭
  const ROOM_D = 14;      // 전시실 깊이
  const ART_SLOT = 2.9, LABEL_SLOT = 1.6, CORNER = 0.9;

  class World {
    constructor(app, museum, exhibition) {
      this.app = app; this.renderer = app.renderer; this.m = museum; this.ex = exhibition;
      this.scene = new THREE.Scene();
      this.colliders = []; this.clickables = []; this.updaters = []; this.doors = [];
      this.artSlots = []; this.anchors = []; this.mapShapes = []; this.textures = [];
      this.loadQueue = []; this.loading = 0;
      this.low = app.lowQuality; this.ultra = !!app.ultra;
      this.time = 0;
    }

    /* ---------- 공통 헬퍼 ---------- */
    M(o = {}) {
      const mat = new THREE.MeshStandardMaterial({
        color: o.color || '#ffffff', map: o.map || null, roughness: o.rough ?? 0.85, metalness: o.metal ?? 0,
        transparent: !!o.transparent, opacity: o.opacity ?? 1, side: o.side || THREE.FrontSide,
        emissive: o.emissive || '#000000', emissiveIntensity: o.emissiveI ?? 1, emissiveMap: o.emissiveMap || null,
        normalMap: o.normalMap || null, depthWrite: o.depthWrite ?? true
      });
      mat.envMap = (o.zone === 'in' ? this.envIn : this.envOut) || null;
      mat.envMapIntensity = o.envI ?? (o.zone === 'in' ? 0.55 : 1);
      return mat;
    }
    Basic(color, mult = 1, o = {}) {
      const c = new THREE.Color(color).multiplyScalar(mult);
      return new THREE.MeshBasicMaterial({ color: c, transparent: !!o.transparent, opacity: o.opacity ?? 1, map: o.map || null, side: o.side || THREE.FrontSide, fog: o.fog ?? true, depthWrite: o.depthWrite ?? true, blending: o.blending || THREE.NormalBlending });
    }
    tex(name, rx = 1, ry = 1, srgb = true) { const t = Tex.get(name, [rx, ry], srgb); this.textures.push(t); return t; }
    shadow(mesh, o) {
      if (this.low) return mesh;
      if (o === 'cast' || o === 'both') mesh.castShadow = true;
      if (o === 'recv' || o === 'both') mesh.receiveShadow = true;
      return mesh;
    }
    add(mesh, parent) { (parent || this.scene).add(mesh); return mesh; }
    box(w, h, d, mat, x, y, z, o = {}) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y + h / 2, z); if (o.ry) m.rotation.y = o.ry;
      this.shadow(m, o.shadow); this.add(m, o.parent);
      if (o.collide) this.boxCollider(x - w / 2, x + w / 2, z - d / 2, z + d / 2, o.ry);
      return m;
    }
    cyl(rt, rb, h, seg, mat, x, y, z, o = {}) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1, !!o.open, o.thetaStart || 0, o.thetaLen || Math.PI * 2), mat);
      m.position.set(x, y + h / 2, z); this.shadow(m, o.shadow); this.add(m, o.parent);
      if (o.collide) this.circleCollider(x, z, Math.max(rt, rb), 16);
      return m;
    }
    plane(w, h, mat, x, y, z, rx = 0, ry = 0, o = {}) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      m.position.set(x, y, z); m.rotation.set(rx, ry, 0, 'YXZ'); this.shadow(m, o.shadow); this.add(m, o.parent);
      if (o.order != null) m.renderOrder = o.order;
      return m;
    }
    floorRect(x0, z0, x1, z1, mat, y = 0, o = {}) {
      return this.plane(Math.abs(x1 - x0), Math.abs(z1 - z0), mat, (x0 + x1) / 2, y, (z0 + z1) / 2, -Math.PI / 2, 0, o);
    }
    ceilRect(x0, z0, x1, z1, mat, y) { return this.plane(Math.abs(x1 - x0), Math.abs(z1 - z0), mat, (x0 + x1) / 2, y, (z0 + z1) / 2, Math.PI / 2, 0); }

    /* ---------- 충돌 (선분 + 두께) ---------- */
    seg(ax, az, bx, bz, t = 0.1, tag) { const c = { ax, az, bx, bz, t, on: true, tag }; this.colliders.push(c); return c; }
    boxCollider(x0, x1, z0, z1, ry) {
      if (ry) { // 회전 박스
        const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, hw = (x1 - x0) / 2, hd = (z1 - z0) / 2, c = Math.cos(ry), s = Math.sin(ry);
        const p = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([a, b]) => [cx + a * c + b * s, cz - a * s + b * c]);
        for (let i = 0; i < 4; i++) this.seg(p[i][0], p[i][1], p[(i + 1) % 4][0], p[(i + 1) % 4][1], 0.02);
        return;
      }
      this.seg(x0, z0, x1, z0, 0.02); this.seg(x1, z0, x1, z1, 0.02); this.seg(x1, z1, x0, z1, 0.02); this.seg(x0, z1, x0, z0, 0.02);
    }
    circleCollider(x, z, r, n = 20) { for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, b = (i + 1) / n * Math.PI * 2; this.seg(x + Math.cos(a) * r, z + Math.sin(a) * r, x + Math.cos(b) * r, z + Math.sin(b) * r, 0.05); } }
    collide(p, r) {
      for (let it = 0; it < 3; it++) {
        for (const c of this.colliders) {
          if (!c.on) continue;
          const dx = c.bx - c.ax, dz = c.bz - c.az, L2 = dx * dx + dz * dz || 1e-6;
          let t = ((p.x - c.ax) * dx + (p.z - c.az) * dz) / L2; t = Math.max(0, Math.min(1, t));
          const qx = c.ax + dx * t, qz = c.az + dz * t, ex = p.x - qx, ez = p.z - qz, d = Math.hypot(ex, ez), min = r + c.t;
          if (d < min) {
            if (d > 1e-5) { p.x = qx + ex / d * min; p.z = qz + ez / d * min; }
            else { p.x += -dz / Math.sqrt(L2) * min; p.z += dx / Math.sqrt(L2) * min; }
          }
        }
      }
    }

    /* ---------- 벽 ---------- */
    wall(ax, az, bx, bz, h, mat, o = {}) {
      const th = o.thick ?? 0.3, len = Math.hypot(bx - ax, bz - az), y0 = o.y0 || 0;
      if (len < 0.01) return null;
      const m = new THREE.Mesh(new THREE.BoxGeometry(len, h, th), mat);
      m.position.set((ax + bx) / 2, y0 + h / 2, (az + bz) / 2);
      m.rotation.y = -Math.atan2(bz - az, bx - ax);
      this.shadow(m, o.shadow); this.add(m);
      if (o.collide !== false && y0 < 1.8) this.seg(ax, az, bx, bz, th / 2);
      if (o.uv) { // 텍스처 반복을 실제 크기에 맞춤
        const uv = m.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * len / o.uv, uv.getY(i) * h / o.uv);
      }
      return m;
    }
    // 바닥 접합부의 은은한 그림자 띠
    aoStrip(ax, az, bx, bz, nx, nz, w = 0.7, opacity = 0.5) {
      if (!this._aoMat) { this._aoTex = this.tex('contactShadow', 1, 1, false); this._aoMat = new THREE.MeshBasicMaterial({ color: 0x000000, alphaMap: this._aoTex, transparent: true, opacity, depthWrite: false }); }
      const len = Math.hypot(bx - ax, bz - az);
      const m = this.plane(len, w, this._aoMat, (ax + bx) / 2 + nx * w / 2, 0.012, (az + bz) / 2 + nz * w / 2, -Math.PI / 2, Math.atan2(nx, nz));
      m.renderOrder = 1; return m;
    }

    /* ---------- 하늘·환경 ---------- */
    buildSky() {
      const s = this.m.sky;
      const sunDir = new V3(...s.sun).normalize();
      const mat = new THREE.ShaderMaterial({
        side: THREE.BackSide, depthWrite: false, fog: false,
        uniforms: { top: { value: new THREE.Color(s.top) }, hor: { value: new THREE.Color(s.horizon) }, sunC: { value: new THREE.Color(s.sunColor) }, sunDir: { value: sunDir }, cloud: { value: s.clouds ?? 0.55 } },
        vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); gl_Position.z = gl_Position.w; }',
        fragmentShader: `uniform vec3 top,hor,sunC,sunDir; uniform float cloud; varying vec3 vD;
          float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
          float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
          float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p*=2.03;a*=.5;}return v;}
          void main(){ vec3 d=normalize(vD); float y=max(d.y,0.);
            vec3 c=mix(hor,top,pow(y,.5));
            if(d.y<0.) c=mix(hor,hor*.75,min(-d.y*3.,1.));
            float sd=max(dot(d,sunDir),0.);
            c+=sunC*(pow(sd,6.)*.22+pow(sd,60.)*.35)+sunC*smoothstep(.9994,.9997,sd)*3.;
            if(d.y>0.){ vec2 uv=d.xz/(d.y+.12)*1.6; float cl=smoothstep(.5,.85,fbm(uv+vec2(3.,7.)))*cloud*smoothstep(0.,.25,d.y);
              vec3 cc=mix(vec3(1.),sunC,.35)*(.85+.3*sd); c=mix(c,cc,cl*.85); }
            gl_FragColor=vec4(c,1.);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`
      });
      const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), mat);
      sky.renderOrder = -10; this.scene.add(sky);
      // PMREM 환경맵: 실외(하늘) / 실내(갤러리 조명)
      const pm = new THREE.PMREMGenerator(this.renderer);
      const skyScene = new THREE.Scene(); const sky2 = sky.clone(); sky2.material = mat.clone();
      sky2.material.fragmentShader = sky2.material.fragmentShader.replace('#include <tonemapping_fragment>', '').replace('#include <colorspace_fragment>', '');
      skyScene.add(sky2);
      const g = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshBasicMaterial({ color: new THREE.Color(s.horizon).multiplyScalar(0.45) }));
      g.rotation.x = -Math.PI / 2; g.position.y = -2; skyScene.add(g);
      this.envOut = pm.fromScene(skyScene, 0.02).texture;
      const room = new THREE.Scene(), I = this.m.interior;
      room.add(new THREE.Mesh(new THREE.BoxGeometry(20, 8, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color(I.dark ? '#202024' : I.wall).multiplyScalar(I.dark ? 1 : 0.75), side: THREE.BackSide })));
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.MeshBasicMaterial({ color: new THREE.Color(I.light).multiplyScalar(I.dark ? 2 : 4) })); p.rotation.x = Math.PI / 2; p.position.set(i * 6, 3.9, j * 6); room.add(p); }
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color(I.floorTint).multiplyScalar(0.6) })); fl.rotation.x = -Math.PI / 2; fl.position.y = -3.9; room.add(fl);
      this.envIn = pm.fromScene(room, 0.03).texture;
      pm.dispose();
      this.scene.fog = new THREE.Fog(s.fog, 30, s.fogD || 260);
      this.sunDir = sunDir;
    }

    buildLights() {
      const s = this.m.sky, I = this.m.interior;
      this.hemi = new THREE.HemisphereLight(s.top, '#8a7d6a', s.hemi); this.scene.add(this.hemi);
      const sun = new THREE.DirectionalLight(s.sunColor, s.sunI); sun.position.copy(this.sunDir).multiplyScalar(120); sun.target.position.set(0, 0, 0);
      if (!this.low) {
        sun.castShadow = true; const sc = sun.shadow.camera; sc.left = -75; sc.right = 75; sc.top = 75; sc.bottom = -75; sc.near = 1; sc.far = 400;
        const ms = this.ultra ? 4096 : 2048; sun.shadow.mapSize.set(ms, ms); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
      }
      this.scene.add(sun, sun.target); this.sun = sun;
      this.inHemi = new THREE.HemisphereLight(I.light, I.floorTint, 0); this.scene.add(this.inHemi);
      this.inDir = new THREE.DirectionalLight(I.light, 0); this.inDir.position.set(3, 10, 4); this.scene.add(this.inDir);
      this.inAmb = new THREE.AmbientLight(I.light, 0); this.scene.add(this.inAmb);
    }
    // 실내/실외 노출 전환 (f: 0=밖, 1=안)
    setInside(f) {
      const s = this.m.sky, I = this.m.interior, dark = !!I.dark;
      this.sun.intensity = s.sunI * (1 - f * 0.92);
      this.hemi.intensity = s.hemi * (1 - f * 0.8);
      this.inHemi.intensity = f * (dark ? 0.45 : 0.62);
      this.inDir.intensity = f * (dark ? 0.2 : 0.45);
      this.inAmb.intensity = f * (dark ? 0.12 : 0.18);
      this.renderer.toneMappingExposure = 1.0 - f * (dark ? 0.0 : 0.16);
      const fogFar = (s.fogD || 260);
      this.scene.fog.near = 30 + f * 200; this.scene.fog.far = fogFar + f * 600;
    }

    /* ---------- 지형·자연 ---------- */
    buildGround(o = {}) {
      const gm = this.m.ground;
      const big = this.M({ map: this.tex('grass', 1, 1), color: this.m.id === 'busan' ? '#9a9a6a' : '#ffffff', rough: 1 });
      const S = 800, rp = 1 / 13;
      const rect = (x0, z0, x1, z1) => { if (x1 - x0 < 0.01 || z1 - z0 < 0.01) return; const m = big.clone(); m.map = big.map.clone(); m.map.repeat.set((x1 - x0) * rp, (z1 - z0) * rp); m.map.needsUpdate = true; this.textures.push(m.map); this.shadow(this.floorRect(x0, z0, x1, z1, m, -0.02), 'recv'); };
      if (o.hole) { const [hx0, hz0, hx1, hz1] = o.hole; rect(-S, -S, S, hz0); rect(-S, hz1, S, S); rect(-S, hz0, hx0, hz1); rect(hx1, hz0, S, hz1); }
      else rect(-S, -S, S, S);
      if (gm !== 'grass') {
        const [px0, pz0, px1, pz1] = o.plaza || [-(this.plazaW || 90) / 2, 0, (this.plazaW || 90) / 2, 70];
        const ts = gm === 'deck' ? 3.2 : 6.5; const pz = this.M({ map: this.tex(gm, (px1 - px0) / ts, (pz1 - pz0) / ts), color: gm === 'deck' ? '#d9cbb8' : '#ffffff', rough: gm === 'deck' ? 0.75 : 0.9 });
        this.plazaRect = [px0, pz0, px1, pz1];
        this.shadow(this.floorRect(px0, pz0, px1, pz1, pz, 0), 'recv');
        this.mapShapes.push({ type: 'rect', x0: px0, z0: pz0, x1: px1, z1: pz1, color: 'rgba(255,255,255,0.06)' });
      }
    }
    mountains(color, opt = {}) {
      const mat = new THREE.MeshBasicMaterial({ color, fog: true });
      const r = Tex.rng(opt.seed || 7);
      for (let i = 0; i < (opt.count || 14); i++) {
        const a = (i / (opt.count || 14)) * Math.PI * 2 + r() * 0.3;
        if (opt.backOnly && Math.cos(a) > 0.2) continue;
        const dist = 330 + r() * 160, rad = 90 + r() * 120, h = 50 + r() * 70;
        const geo = new THREE.ConeGeometry(rad, h, 9, 3); const pos = geo.attributes.position;
        for (let k = 0; k < pos.count; k++) { const y = pos.getY(k); if (y < h / 2 - 1) { pos.setX(k, pos.getX(k) * (0.8 + r() * 0.4)); pos.setZ(k, pos.getZ(k) * (0.8 + r() * 0.4)); pos.setY(k, y + (r() - 0.5) * 8); } }
        geo.computeVertexNormals();
        const m = new THREE.Mesh(geo, mat); m.position.set(Math.sin(a) * dist, h / 2 - 8, -Math.cos(a) * dist); m.scale.y = 0.75; this.scene.add(m);
      }
    }
    trees(list, kind = 'round', o = {}) {
      if (!list.length) return;
      const trunkG = new THREE.CylinderGeometry(0.12, 0.2, 1, 6); trunkG.translate(0, 0.5, 0);
      let leafG;
      if (kind === 'pine') { leafG = new THREE.ConeGeometry(1.5, 4.5, 7); leafG.translate(0, 4.2, 0); }
      else if (kind === 'palm') { leafG = new THREE.ConeGeometry(2.4, 1.2, 8, 1, true); leafG.translate(0, 6.2, 0); }
      else { leafG = new THREE.IcosahedronGeometry(1.9, 1); const p = leafG.attributes.position; const r = Tex.rng(5); for (let i = 0; i < p.count; i++) { p.setXYZ(i, p.getX(i) * (0.85 + r() * 0.3), p.getY(i) * (0.8 + r() * 0.3), p.getZ(i) * (0.85 + r() * 0.3)); } leafG.computeVertexNormals(); leafG.translate(0, 4.2, 0); }
      const tM = this.M({ color: kind === 'palm' ? '#7a6248' : '#5b4634', rough: 1 });
      const lM = this.M({ color: o.leaf || (kind === 'pine' ? '#3d5a3a' : kind === 'palm' ? '#4d7a3a' : '#5d8040'), rough: 0.95, side: kind === 'palm' ? THREE.DoubleSide : THREE.FrontSide });
      const trunks = new THREE.InstancedMesh(trunkG, tM, list.length), leaves = new THREE.InstancedMesh(leafG, lM, list.length);
      const d = new THREE.Object3D(), col = new THREE.Color(), r = Tex.rng(list.length * 13);
      list.forEach((t, i) => {
        const s = t[2] || (0.8 + r() * 0.5);
        d.position.set(t[0], 0, t[1]); d.rotation.set(0, r() * 6.28, 0); d.scale.set(s, kind === 'palm' ? 6.2 * s : (kind === 'pine' ? 3 : 3.2) * s, s); d.updateMatrix(); trunks.setMatrixAt(i, d.matrix);
        d.scale.set(s, s, s); d.updateMatrix(); leaves.setMatrixAt(i, d.matrix);
        col.setHSL(0.25 + r() * 0.06, 0.35 + r() * 0.15, 0.85 + r() * 0.3); leaves.setColorAt(i, col);
        if (!o.noCollide) this.circleCollider(t[0], t[1], 0.35, 6);
      });
      this.shadow(trunks, 'cast'); this.shadow(leaves, 'cast');
      this.scene.add(trunks, leaves);
    }
    water(x0, z0, x1, z1, y = 0.05, color = '#20343a', opacity = 1) {
      const n = this.tex('waterNormal', (x1 - x0) / 8, (z1 - z0) / 8, false);
      const mat = this.M({ color, rough: 0.04, metal: 0.0, normalMap: n, envI: 1.1, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });
      mat.normalScale = new THREE.Vector2(0.35, 0.35);
      const m = this.floorRect(x0, z0, x1, z1, mat, y);
      this.updaters.push(dt => { n.offset.x += dt * 0.012; n.offset.y += dt * 0.008; });
      (this.waterRects = this.waterRects || []).push([x0, z0, x1, z1]);
      this.mapShapes.push({ type: 'rect', x0, z0, x1, z1, color: 'rgba(90,150,200,0.45)' });
      return m;
    }
    glassMat(tint = '#a9c3cc', op = 0.22) { return this.M({ color: tint, rough: 0.04, metal: 0.85, transparent: true, opacity: op, depthWrite: false, envI: 1.4, side: THREE.DoubleSide }); }
    bench(x, z, ry = 0, len = 2.4, zone = 'in', color = '#8a6a4a') {
      const wood = this.M({ color, map: this.tex('wood', 1, 1), rough: 0.6, zone });
      const metal = this.M({ color: '#2a2a2a', rough: 0.4, metal: 0.8, zone });
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; this.scene.add(g);
      const seat = new THREE.Mesh(new THREE.BoxGeometry(len, 0.08, 0.55), wood); seat.position.y = 0.45; g.add(seat);
      [-1, 1].forEach(s => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.42, 0.5), metal); l.position.set(s * (len / 2 - 0.2), 0.21, 0); g.add(l); });
      const c = Math.cos(ry), sn = Math.sin(ry); const hw = len / 2, hd = 0.3;
      const p = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([a, b]) => [x + a * c + b * sn, z - a * sn + b * c]);
      for (let i = 0; i < 4; i++) this.seg(p[i][0], p[i][1], p[(i + 1) % 4][0], p[(i + 1) % 4][1], 0.02);
      return g;
    }
    // 자동문 (유리 두 짝이 옆으로 열림)
    door(x, z, width = 6, height = 4, frameColor = '#222') {
      const glass = this.glassMat('#b8cdd4', 0.3), fr = this.M({ color: frameColor, metal: 0.7, rough: 0.35 });
      const half = width / 2, panels = [];
      [-1, 1].forEach(s => {
        const g = new THREE.Group(); g.position.set(x + s * half / 2, 0, z);
        const p = new THREE.Mesh(new THREE.BoxGeometry(half, height, 0.04), glass); p.position.y = height / 2; g.add(p);
        const b = new THREE.Mesh(new THREE.BoxGeometry(half, 0.08, 0.08), fr); b.position.y = height - 0.04; g.add(b);
        const b2 = b.clone(); b2.position.y = 0.04; g.add(b2);
        const v = new THREE.Mesh(new THREE.BoxGeometry(0.06, height, 0.08), fr); v.position.set(-s * half / 2, height / 2, 0); g.add(v);
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.2, 0.05), this.M({ color: '#c9c9c9', metal: 1, rough: 0.2 })); handle.position.set(-s * (half / 2 - 0.15), 1.1, 0.06); g.add(handle);
        this.scene.add(g); panels.push({ g, s, base: x + s * half / 2 });
      });
      const col = this.seg(x - half, z, x + half, z, 0.05, 'door');
      const d = { x, z, half, panels, col, open: 0 }; this.doors.push(d);
      // 문 위 상인방
      this.box(width + 0.4, 0.3, 0.3, fr, x, height, z);
      return d;
    }
    // 현수막 / 사인
    banner(lines, w, h, x, y, z, ry = 0, o = {}) {
      const t = Tex.text(lines, { w: o.pw || 512, h: o.ph || Math.round((o.pw || 512) * h / w), bg: o.bg, color: o.color, align: o.align, pad: o.pad });
      this.textures.push(t);
      const mat = o.emissive ? new THREE.MeshBasicMaterial({ map: t, transparent: !o.bg, toneMapped: true }) : this.M({ map: t, transparent: !o.bg, rough: 0.8, zone: o.zone });
      return this.plane(w, h, mat, x, y, z, 0, ry, { order: 2 });
    }

    /* ---------- 배치 계산 ---------- */
    planLayout() {
      const I = this.m.interior, rooms = this.ex.rooms;
      const lobby = Arch.lobbySize[this.m.lobby] || { w: 30, d: 24 };
      const L = { LW: lobby.w, LD: lobby.d, H: GALLERY_H, lobbyH: I.lobbyH, rooms: [], cursor: [0, 0] };
      const z0 = -L.LD - 0.6;
      rooms.forEach(room => {
        const items = [];
        room.students.forEach(st => { items.push({ type: 'label', st, w: LABEL_SLOT }); st.artworks.forEach(a => items.push({ type: 'art', art: a, w: ART_SLOT })); });
        let W = 12;
        while (W < 400 && !this.fitRoom(W, items, true)) W += 1.5;
        const side = L.cursor[0] <= L.cursor[1] ? 0 : 1;
        const zTop = z0 - L.cursor[side], zc = zTop - W / 2;
        L.cursor[side] += W + 0.6;
        L.rooms.push({ room, items, W, side, zc, zTop, zBot: zTop - W });
      });
      L.spineEnd = z0 - Math.max(12, L.cursor[0], L.cursor[1]) - 4;
      L.BW = Math.max(L.LW, 2 * (SPINE_HW + ROOM_D) + 0.6);
      L.BL = -L.spineEnd + 0.3;
      this.L = L;
      return L;
    }
    // 방 로컬 좌표의 걸이 벽 목록 (문 벽 z=0, 안쪽 -z)
    roomRuns(W) {
      const D = ROOM_D, h = W / 2, runs = [];
      runs.push({ a: [-h, -0.0], b: [-h, -D], n: [1, 0] });         // 왼쪽 벽 (문→안)
      runs.push({ a: [-h, -D], b: [h, -D], n: [0, 1] });            // 안쪽 벽
      runs.push({ a: [h, -D], b: [h, 0], n: [-1, 0] });             // 오른쪽 벽
      if (W >= 36) {                                                  // 가운데 가벽(양면)
        runs.push({ a: [h - 5, -D / 2], b: [-h + 5, -D / 2], n: [0, 1], partition: true });
        runs.push({ a: [-h + 5, -D / 2], b: [h - 5, -D / 2], n: [0, -1], partition: true });
      }
      runs.push({ a: [h, -0.15], b: [2.2, -0.15], n: [0, -1] });             // 문 벽 오른쪽
      runs.push({ a: [-2.2, -0.15], b: [-h, -0.15], n: [0, -1] });           // 문 벽 왼쪽
      return runs;
    }
    fitRoom(W, items, test) {
      const runs = this.roomRuns(W), placed = [];
      let ri = 0, used = CORNER;
      for (const it of items) {
        while (ri < runs.length) {
          const r = runs[ri], len = Math.hypot(r.b[0] - r.a[0], r.b[1] - r.a[1]);
          if (used + it.w <= len - CORNER + 0.01) break;
          ri++; used = CORNER;
        }
        if (ri >= runs.length) return false;
        const r = runs[ri], len = Math.hypot(r.b[0] - r.a[0], r.b[1] - r.a[1]);
        const t = (used + it.w / 2) / len;
        placed.push({ it, run: r, lx: r.a[0] + (r.b[0] - r.a[0]) * t, lz: r.a[1] + (r.b[1] - r.a[1]) * t });
        used += it.w;
      }
      return test ? true : placed;
    }

    /* ---------- 전체 짓기 ---------- */
    build(onProgress) {
      const r = this.renderer; Tex.init(r);
      this.buildSky(); onProgress && onProgress(0.2);
      this.buildLights();
      const L = this.planLayout();
      const ext = Arch.exterior[this.m.exterior];
      this.plazaW = 90;
      ext(this, L); onProgress && onProgress(0.55);
      this.buildInteriorMaterials();
      Arch.lobby[this.m.lobby](this, L); onProgress && onProgress(0.7);
      this.buildSpine(L);
      L.rooms.forEach((R, i) => this.buildRoom(R, i)); onProgress && onProgress(0.9);
      this.buildFinale(L);
      if (this.ultra) this.buildSpotPool();
      if (!this.low) this.grassTufts(this.ultra ? 9000 : 3500);
      // 위치 앵커
      this.anchors.unshift({ key: 'lobby', label: '로비', pos: new V3(0, 0, -6), yaw: 0 });
      this.anchors.unshift({ key: 'outside', label: '미술관 앞', pos: this.spawn.pos.clone(), yaw: this.spawn.yaw });
      this.mapShapes.push({ type: 'rect', x0: -L.BW / 2, z0: -L.BL, x1: L.BW / 2, z1: 0, color: 'rgba(255,255,255,0.10)', stroke: true });
      this.setInside(0);
    }

    buildInteriorMaterials() {
      const I = this.m.interior;
      this.matWall = this.M({ color: I.wall, map: I.concreteWalls ? this.tex('concrete', 1, 1) : this.tex('plaster', 3, 3), rough: 0.92, zone: 'in' });
      this.matWallUV = I.concreteWalls ? 3.6 : 4; // wall() uv 단위
      const fmap = this.tex(I.floor, 1, 1);
      this.matFloor = this.M({ color: new THREE.Color('#ffffff').lerp(new THREE.Color(I.floorTint), 0.55), map: fmap, rough: I.floor === 'polishedDark' ? 0.25 : I.floor === 'woodStrip' ? 0.55 : 0.6, zone: 'in', envI: I.floor === 'polishedDark' ? 1.2 : 0.6 });
      this.matCeil = this.M({ color: I.dark ? '#121214' : (I.ceiling === 'concrete' ? '#bdbab3' : I.ceiling === 'wood' ? '#ffffff' : '#f6f5f2'), map: I.ceiling === 'concrete' ? this.tex('concrete', 4, 4) : I.ceiling === 'wood' ? this.tex('wood', 8, 8) : null, rough: 0.95, zone: 'in' });
      this.matTrim = this.M({ color: I.trim, rough: 0.5, metal: 0.2, zone: 'in' });
      this.matLight = this.Basic(I.light, I.dark ? 1.6 : 2.4);
    }
    floorMat(w, d) { const m = this.matFloor.clone(); m.map = this.matFloor.map.clone(); m.map.needsUpdate = true; const s = this.m.interior.floor === 'woodStrip' ? 6 : 5; m.map.repeat.set(w / s, d / s); this.textures.push(m.map); return m; }
    iwall(ax, az, bx, bz, h, o = {}) { return this.wall(ax, az, bx, bz, h, o.mat || this.matWall, { thick: o.thick ?? 0.3, uv: this.matWallUV, collide: o.collide, y0: o.y0 }); }

    /* ---------- 복도(스파인) ---------- */
    buildSpine(L) {
      const z0 = -L.LD, z1 = L.spineEnd, H = L.H, I = this.m.interior;
      // 바닥과 천장은 건물 뒤쪽 전체를 덮음
      const bw = L.BW / 2;
      this.floorRect(-bw, z0, bw, z1, this.floorMat(L.BW, z0 - z1), 0.001);
      this.ceilRect(-bw, z0, bw, z1, this.matCeil, H);
      // 복도 천장 빛 띠
      const len = z0 - z1;
      this.plane(1.2, len - 2, this.matLight, 0, H - 0.02, (z0 + z1) / 2, Math.PI / 2, 0);
      [-1, 1].forEach(s => this.plane(0.15, len - 2, this.matTrim, s * 0.75, H - 0.03, (z0 + z1) / 2, Math.PI / 2, 0));
      // 복도 벽 (문 자리 비움)
      [-1, 1].forEach(s => {
        const side = s < 0 ? 0 : 1, x = s * SPINE_HW;
        const gaps = L.rooms.filter(R => R.side === side).map(R => [R.zc + 1.8, R.zc - 1.8]).sort((a, b) => b[0] - a[0]);
        let cur = z0;
        gaps.forEach(([ga, gb]) => { this.iwall(x, cur, x, ga, H); this.aoStrip(x, cur, x, ga, -s, 0); this.iwall(x, ga, x, gb, H - 3.6, { y0: 3.6, collide: false }); cur = gb; });
        this.iwall(x, cur, x, z1, H); this.aoStrip(x, cur, x, z1, -s, 0);
      });
      this.iwall(-SPINE_HW, z1, SPINE_HW, z1, H);
      // 벤치·식물
      let k = 0;
      for (let z = z0 - 7; z > z1 + 5; z -= 7, k++) {
        const kind = k % 3;
        if (kind === 0) this.slideshow(0, z, 0);
        else if (kind === 1) this.sculpture(0, z, k + this.m.id.length, { spin: true });
        else this.bench(0, z, 0, 2.6, 'in', I.dark ? '#3a3a3a' : '#9b7b58');
      }
      // 복도 입구 양쪽: 모두의 작품 모자이크 + 참여 작가 명단
      const firstL = L.rooms.find(R => R.side === 0), firstR = L.rooms.find(R => R.side === 1);
      const segL = firstL ? z0 - (firstL.zc + 1.8) : z0 - z1, segR = firstR ? z0 - (firstR.zc + 1.8) : z0 - z1;
      if (segL > 3) { const wd = Math.min(segL - 0.8, 6.5); this.mosaic(-SPINE_HW + 0.15, z0 - segL / 2, Math.PI / 2, wd, wd * 0.56); }
      if (segR > 3) { const wd = Math.min(segR - 0.8, 6.5); this.namesWall(SPINE_HW - 0.15, z0 - segR / 2, -Math.PI / 2, wd, wd * 0.62); }
      // 전시실 문 옆 화분
      L.rooms.forEach((R, i) => this.plant((R.side === 0 ? -1 : 1) * (SPINE_HW - 0.55), R.zc - 2.6, i + 1, 1));
      this.mapShapes.push({ type: 'rect', x0: -SPINE_HW, z0: z1, x1: SPINE_HW, z1: z0, color: 'rgba(255,255,255,0.16)' });
    }
    buildFinale(L) {
      const I = this.m.interior, C = window.ART_CONFIG;
      { const t = Tex.poster({ w: 1024, h: 512, ink: I.dark ? '#f2f2f2' : '#1a1a1a', sub: I.dark ? '#bbb' : '#555', titleScale: 0.12, logoScale: 0.13 }); this.textures.push(t);
        this.plane(6.4, 3.2, this.M({ map: t, transparent: true, rough: 0.9, zone: 'in' }), 0, 3.0, L.spineEnd + 0.17, 0, 0, { order: 2 });
        this.banner([{ text: '끝까지 관람해 주셔서 고맙습니다', size: 34, weight: 500, color: I.dark ? '#ddd' : '#444' }], 5, 0.4, 0, 1.15, L.spineEnd + 0.17, 0, { pw: 1024, ph: 82, zone: 'in' }); }
      this.lightPool(0, 3.0, L.spineEnd + 0.16, 0, 8, 5, 0.6);
    }

    namesWall(x, z, ry, wdt, hgt) {
      const I = this.m.interior, ink = I.dark ? '#f2f2f2' : '#1a1a1a', sub = I.dark ? '#9a9a9a' : '#777';
      const cv = Tex.canvas(1536, Math.round(1536 * hgt / wdt)), c = cv.getContext('2d'), Wd = cv.width, Hd = cv.height;
      const names = []; this.ex.rooms.forEach(R => R.students.forEach(st => names.push(`${st.sid} ${st.name}`)));
      c.textBaseline = 'top'; c.fillStyle = ink; c.font = `900 ${Hd * 0.09}px "Noto Serif KR", serif`; c.fillText('참여 작가', Wd * 0.05, Hd * 0.05);
      c.font = `400 ${Hd * 0.035}px "Noto Sans KR", sans-serif`; c.fillStyle = sub; c.fillText(`${names.length}명의 졸업생이 함께했습니다`, Wd * 0.05, Hd * 0.17);
      const top = Hd * 0.26, avail = Hd * 0.7; let fs = Hd * 0.05, cols = 1, rows = 1;
      for (; fs > 8; fs -= 1) { rows = Math.floor(avail / (fs * 1.55)); cols = Math.ceil(names.length / Math.max(1, rows)); c.font = `500 ${fs}px "Noto Sans KR", sans-serif`; const cw = Math.max(...names.map(n => c.measureText(n).width), 10) + fs * 1.5; if (cols * cw <= Wd * 0.9) break; }
      c.fillStyle = ink; c.font = `500 ${fs}px "Noto Sans KR", sans-serif`;
      const colW = Wd * 0.9 / Math.max(cols, 1);
      names.forEach((n, i) => c.fillText(n, Wd * 0.05 + Math.floor(i / rows) * colW, top + (i % rows) * fs * 1.55));
      const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; this.textures.push(t);
      this.plane(wdt, hgt, this.M({ map: t, transparent: true, rough: 0.9, zone: 'in' }), x + Math.sin(ry) * 0.03, 0.9 + hgt / 2, z + Math.cos(ry) * 0.03, 0, ry, { order: 2 });
    }

    /* ---------- 학급 전시실 ---------- */
    buildRoom(R, idx) {
      const I = this.m.interior, H = GALLERY_H, W = R.W, D = ROOM_D, s = R.side === 0 ? -1 : 1;
      // 로컬(lx, lz) → 월드
      const toW = (lx, lz) => R.side === 0 ? [-SPINE_HW + lz, R.zc - lx] : [SPINE_HW - lz, R.zc + lx];
      const toWn = (nx, nz) => R.side === 0 ? [nz, -nx] : [-nz, nx];
      const wl = (a, b, h = H, o) => { const A = toW(...a), B = toW(...b); return this.iwall(A[0], A[1], B[0], B[1], h, o); };
      // 벽
      const hw = W / 2;
      wl([-hw - 0.15, 0], [-hw - 0.15, -D - 0.15]); wl([hw + 0.15, 0], [hw + 0.15, -D - 0.15]);
      const ACC = ['#e8dfd0', '#d6e2dc', '#e5d3cb', '#d9dde8', '#e9e2c6', '#d5ddcf', '#ead6db', '#d3dde3'];
      const backM = I.dark || I.concreteWalls ? this.matWall : this.M({ color: ACC[idx % ACC.length], map: this.tex('plaster', 3, 3), rough: 0.92, zone: 'in' });
      wl([-hw - 0.15, -D - 0.15], [hw + 0.15, -D - 0.15], H, { mat: backM });
      { const [lx, lz] = toW(0, -D + 0.02), [nx, nz] = toWn(0, 1);
        this.banner([{ text: R.room.label, size: 150, color: I.dark ? '#ffffff' : '#1b1b1b' }], 6, 1.0, lx, 4.45, lz, Math.atan2(nx, nz), { pw: 1024, ph: 171, zone: 'in' }); }
      // 바닥 그림자 띠 + 걸레받이
      this.roomRuns(W).forEach(run => {
        const A = toW(...run.a), B = toW(...run.b), n = toWn(...run.n);
        if (!run.partition) this.aoStrip(A[0], A[1], B[0], B[1], n[0], n[1], 0.6, 0.4);
      });
      if (W >= 36) { // 가벽
        const A = toW(-hw + 5, -D / 2), B = toW(hw - 5, -D / 2);
        this.wall(A[0], A[1], B[0], B[1], 3.6, this.matWall, { thick: 0.35, uv: this.matWallUV });
        const n = toWn(0, 1); this.aoStrip(A[0], A[1], B[0], B[1], n[0], n[1], 0.5, 0.35); this.aoStrip(B[0], B[1], A[0], A[1], -n[0], -n[1], 0.5, 0.35);
      }
      // 천장 장식/조명
      const [ax, az] = toW(-hw, 0), [bx, bz] = toW(hw, -D);
      const rect = { x0: Math.min(ax, bx), x1: Math.max(ax, bx), z0: Math.min(az, bz), z1: Math.max(az, bz) };
      Arch.ceiling(this, rect, I.ceiling, H, R.side);
      // 문 위 사인 (복도 쪽 + 방 안쪽)
      const dx = s * SPINE_HW, signC = I.dark ? '#f4f4f4' : '#1b1b1b';
      const roomLbl = R.room.label, sub = `학생 ${R.room.students.length}명 · 작품 ${R.room.artworks.length}점`;
      this.banner([{ text: roomLbl, size: 84, color: signC }, { text: sub, size: 34, weight: 400, color: I.dark ? '#aaa' : '#666' }], 3.6, 1.15, dx - s * 0.17, 4.55, R.zc, -s * Math.PI / 2, { pw: 1024, ph: 328, zone: 'in' });
      this.banner([{ text: roomLbl, size: 90, color: signC }], 3.2, 0.8, dx + s * 0.17, 4.5, R.zc, s * Math.PI / 2, { pw: 1024, ph: 256, zone: 'in' });
      // 문틀
      const df = this.matTrim;
      [[1.8], [-1.8]].forEach(([o]) => this.box(0.34, 3.6, 0.12, df, dx, 0, R.zc + o));
      this.box(0.34, 0.12, 3.72, df, dx, 3.54, R.zc);
      // 작품 배치
      const placed = this.fitRoom(W, R.items, false);
      placed.forEach(p => {
        const [x, z] = toW(p.lx, p.lz), [nx, nz] = toWn(...p.run.n);
        const ry = Math.atan2(nx, nz);
        const off = p.run.partition ? 0.18 : 0.004;
        if (p.it.type === 'label') this.studentPanel(p.it.st, x + nx * off, z + nz * off, ry, R.room);
        else this.artFrame(p.it.art, x + nx * off, z + nz * off, ry, nx, nz);
      });
      // 벤치
      if (W >= 36) { const [bxx, bzz] = toW(0, -D / 2 + 2.4); const [bx2, bz2] = toW(0, -D / 2 - 2.4); this.bench(bxx, bzz, R.side === 0 ? Math.PI / 2 : -Math.PI / 2); this.bench(bx2, bz2, R.side === 0 ? Math.PI / 2 : -Math.PI / 2); }
      else { const [bxx, bzz] = toW(0, -D / 2); this.bench(bxx, bzz, R.side === 0 ? Math.PI / 2 : -Math.PI / 2, 2.8); }
      { const [sx, sz] = toW((idx % 2 ? 1 : -1) * Math.min(W / 4, 6), -D / 2); this.sculpture(sx, sz, idx * 7 + 3); }
      // 앵커 & 미니맵
      const [enx, enz] = toW(0, -3.2);
      this.anchors.push({ key: R.room.key, label: R.room.label, pos: new V3(enx, 0, enz), yaw: Math.atan2(-toWn(0, -1)[0], -toWn(0, -1)[1]), room: R.room });
      this.mapShapes.push({ type: 'rect', ...{ x0: rect.x0, z0: rect.z0, x1: rect.x1, z1: rect.z1 }, color: 'rgba(255,255,255,0.22)', label: R.room.label });
      R.rect = rect;
    }

    lightPool(x, y, z, ry, w, h, op = 0.5) {
      if (!this._poolTex) this._poolTex = this.tex('lightPool', 1, 1, false);
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(this.m.interior.light), alphaMap: this._poolTex, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending });
      return this.plane(w, h, mat, x, y, z, 0, ry, { order: 1 });
    }

    studentPanel(st, x, z, ry, room) {
      const I = this.m.interior, dark = !!I.dark;
      const t = Tex.text([
        { text: st.name, size: 92, color: dark ? '#ffffff' : '#141414' },
        { text: st.sid, size: 40, weight: 500, color: dark ? '#9ef0c3' : this.m.accent },
        { text: `작품 ${st.artworks.length}점`, size: 34, weight: 400, color: dark ? '#aaa' : '#666' }
      ], { w: 512, h: 512, top: 150 });
      this.textures.push(t);
      const m = this.plane(1.1, 1.1, this.M({ map: t, transparent: true, rough: 0.9, zone: 'in' }), x, 1.75, z, 0, ry, { order: 2 });
      this.plane(0.5, 0.025, this.Basic(this.m.accent, 1), x + Math.sin(ry) * 0.003, 2.34, z + Math.cos(ry) * 0.003, 0, ry, { order: 2 });
      this.anchorsArtist = this.anchorsArtist || [];
      this.anchorsArtist.push({ st, x, z, ry, room });
      return m;
    }

    artFrame(art, x, z, ry, nx, nz) {
      const I = this.m.interior, dark = !!I.dark;
      const g = new THREE.Group(); g.position.set(x, 1.68, z); g.rotation.y = ry; this.scene.add(g);
      const frameM = this.M({ color: I.trim, rough: 0.45, metal: dark ? 0.6 : 0.15, zone: 'in' });
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 0.06), frameM); frame.position.z = 0.03; g.add(frame);
      const matM = this.M({ color: dark ? '#0e0e10' : '#fbfaf7', rough: 0.95, zone: 'in' });
      const mat = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), matM); mat.position.z = 0.061; g.add(mat);
      const imgM = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.75, metalness: 0, emissive: '#ffffff', emissiveIntensity: dark ? 0.85 : 0.45 });
      if (!this._phTex) { this._phTex = Tex.placeholder('', 0); this.textures.push(this._phTex); } // 모든 작품이 함께 쓰는 '불러오는 중' 그림
      imgM.map = this._phTex; imgM.emissiveMap = this._phTex;
      const img = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), imgM); img.position.z = 0.063; g.add(img);
      img.userData.art = art; frame.userData.art = art; this.clickables.push(img, frame);
      // 캡션 (가까이 갈 때만 글자 그림을 만들어 메모리 절약)
      const capM = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.1875), this.M({ transparent: true, rough: 0.9, zone: 'in' })); g.add(capM); capM.position.z = 0.004; capM.visible = false;
      capM.userData.art = art; this.clickables.push(capM);
      // 빛 웅덩이 + 조명기구
      if (!this._poolTex) this._poolTex = this.tex('lightPool', 1, 1, false);
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(I.light), alphaMap: this._poolTex, transparent: true, opacity: dark ? 0.4 : 0.32, depthWrite: false, blending: THREE.AdditiveBlending }));
      pool.position.set(0, 0.25, 0.002); pool.renderOrder = 1; g.add(pool);
      const can = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.22, 12), this.M({ color: dark ? '#111' : '#e8e8e8', rough: 0.4, metal: 0.4, zone: 'in' }));
      can.position.set(0, GALLERY_H - 1.68 - 0.3, 1.6); can.rotation.x = 0.75; g.add(can);
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.06, 12), this.Basic(I.light, 3)); lens.position.set(0, -0.112, 0); lens.rotation.x = Math.PI / 2; can.add(lens);
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.2, 4), can.material); rod.position.set(0, GALLERY_H - 1.68 - 0.1, 1.6); g.add(rod);

      const slot = { art, g, frame, mat, img, cap: capM, pool, x, z, ry, nx, nz, w: 1.2, h: 1.2, loaded: false };
      this.artSlots.push(slot);
      art.slot = slot;
      this.sizeArt(slot, 1.25, 1.25);
    }
    sizeArt(s, w, h) {
      const dark = !!this.m.interior.dark, f = 0.045, mt = dark ? 0.02 : Math.min(w, h) * 0.12;
      s.w = w; s.h = h;
      s.img.scale.set(w, h, 1); s.mat.scale.set(w + mt * 2, h + mt * 2, 1); s.frame.scale.set(w + mt * 2 + f * 2, h + mt * 2 + f * 2, 1);
      s.cap.position.set(w / 2 + mt + f + 0.36, -0.42, 0.004);
      s.pool.scale.set(w + 1.5, h + 2.0, 1);
    }
    // 작품 사진 관리: 멀면 작은 사진(S), 가까우면 큰 사진(L), 아주 멀면 메모리에서 비움
    //  → 작품이 500점이어도 그래픽 메모리가 일정하게 유지됨
    pumpLoads(pos) {
      const NEAR_L = 7, FAR_L = 13, NEAR_S = 45, FAR_S = 62, CAP_ON = 20, CAP_OFF = 34, MAX = 3;
      const need = [];
      for (const s of this.artSlots) {
        const d = Math.hypot(s.x - pos.x, s.z - pos.z);
        // 캡션
        if (d < CAP_ON && !s.capTex) this.makeCaption(s);
        else if (d > CAP_OFF && s.capTex) { s.cap.material.map = null; s.cap.material.needsUpdate = true; s.capTex.dispose(); s.capTex = null; s.cap.visible = false; }
        if (!s.art.img) continue;
        // 놓아주기
        if (d > FAR_L && s.texL) { this.applyTex(s, s.texS || null); s.texL.dispose(); s.texL = null; }
        if (d > FAR_S && s.texS && !s.texL) { this.applyTex(s, null); s.texS.dispose(); s.texS = null; }
        // 받아야 할 것
        if (d < NEAR_S && !s.texS && !s.busyS && !s.failS) need.push([d < 15 ? d : d + 30, s, 'S']);
        if (d < NEAR_L && !s.texL && !s.busyL && !s.failL) need.push([d - 5, s, 'L']);
      }
      need.sort((a, b) => a[0] - b[0]);
      for (const [, s, lv] of need) { if (this.loading >= MAX) break; this.loadLevel(s, lv); }
    }
    loadLevel(s, lv) {
      const chain = ArtData.imgChain(s.art, lv), key = 'tries' + lv, idx = Math.min(s[key] || 0, chain.length - 1);
      s['busy' + lv] = true; this.loading++;
      const loader = new THREE.TextureLoader(); loader.setCrossOrigin('anonymous');
      loader.load(chain[idx], tex => {
        this.loading--; s['busy' + lv] = false;
        if (this.disposed) { tex.dispose(); return; }
        tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = lv === 'L' ? 8 : 4;
        const d = Math.hypot(s.x - this.app.player.pos.x, s.z - this.app.player.pos.z);
        if (lv === 'L') { if (d > 13) { tex.dispose(); return; } s.texL = tex; this.applyTex(s, tex); }
        else { if (d > 62) { tex.dispose(); return; } s.texS = tex; if (!s.texL) this.applyTex(s, tex); }
      }, undefined, () => {
        this.loading--; s['busy' + lv] = false; s[key] = (s[key] || 0) + 1;
        if (s[key] >= chain.length + 2) { s['fail' + lv] = true; return; }
        s['busy' + lv] = true; // 잠시 쉬었다가 다음 주소로 다시
        setTimeout(() => { s['busy' + lv] = false; }, 1200 * s[key] + Math.random() * 800);
      });
    }
    applyTex(s, tex) {
      const m = s.img.material, t = tex || this._phTex;
      m.map = t; m.emissiveMap = t; m.needsUpdate = true;
      s.loaded = !!tex;
      if (tex && tex.image && tex.image.width) {
        const ar = tex.image.width / tex.image.height; let w = 1.6, h = 1.6 / ar; if (h > 1.6) { h = 1.6; w = 1.6 * ar; }
        s.art.aspect = ar; this.sizeArt(s, w, h);
      }
    }
    makeCaption(s) {
      const dark = !!this.m.interior.dark, art = s.art;
      const t = Tex.text([{ text: art.title, size: 44, color: dark ? '#f2f2f2' : '#151515' }, { text: `${art.name} · ${art.sid}`, size: 30, weight: 400, color: dark ? '#b8b8b8' : '#555' }], { w: 512, h: 192, align: 'left', pad: 24 });
      s.capTex = t; s.cap.material.map = t; s.cap.material.needsUpdate = true; s.cap.visible = true;
    }

    update(dt, playerPos) {
      this.time += dt;
      for (const d of this.doors) {
        const near = Math.hypot(playerPos.x - d.x, playerPos.z - d.z) < 6.5;
        d.open += ((near ? 1 : 0) - d.open) * Math.min(1, dt * 4);
        d.panels.forEach(p => { p.g.position.x = p.base + p.s * d.open * d.half * 0.95; });
        d.col.on = d.open < 0.6;
      }
      for (const u of this.updaters) u(dt, this.time, playerPos);
      if (((this.time * 4) | 0) !== this._lastPump) { this._lastPump = (this.time * 4) | 0; this.pumpLoads(playerPos); }
    }

    dispose() {
      this.disposed = true;
      this.artSlots.forEach(s => { ['texS', 'texL', 'capTex'].forEach(k => { if (s[k]) s[k].dispose(); }); });
      this.scene.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
      });
      this.textures.forEach(t => t.dispose && t.dispose());
      if (this.envIn) this.envIn.dispose(); if (this.envOut) this.envOut.dispose();
    }
  }

  World.GALLERY_H = GALLERY_H; World.SPINE_HW = SPINE_HW; World.ROOM_D = ROOM_D;
  window.World = World;
})();
