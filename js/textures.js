/* =========================================================
 * 절차적 텍스처 (이미지 파일 없이 캔버스로 생성)
 * ========================================================= */
(function () {
  const cache = new Map();
  let maxAniso = 4;

  function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }

  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; }

  // 타일링되는 value noise
  function noiseField(size, cells, seed) {
    const r = rng(seed), g = [];
    for (let i = 0; i < cells * cells; i++) g.push(r());
    const out = new Float32Array(size * size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const fx = x / size * cells, fy = y / size * cells;
      const x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const a = g[(y0 % cells) * cells + (x0 % cells)], b = g[(y0 % cells) * cells + ((x0 + 1) % cells)];
      const c = g[((y0 + 1) % cells) * cells + (x0 % cells)], d = g[((y0 + 1) % cells) * cells + ((x0 + 1) % cells)];
      out[y * size + x] = (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
    }
    return out;
  }
  function fbm(size, seed, oct = 4, base = 4) {
    const out = new Float32Array(size * size); let amp = 1, tot = 0;
    for (let o = 0; o < oct; o++) {
      const n = noiseField(size, base << o, seed + o * 31);
      for (let i = 0; i < out.length; i++) out[i] += n[i] * amp;
      tot += amp; amp *= 0.5;
    }
    for (let i = 0; i < out.length; i++) out[i] /= tot;
    return out;
  }
  function hex(c) { const v = parseInt(c.replace('#', ''), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; }

  // 기본 색 + 노이즈로 채우기
  function noisyFill(ctx, size, color, amount, seed, oct, base) {
    const n = fbm(size, seed, oct || 4, base || 4), [r, g, b] = hex(color);
    const img = ctx.createImageData(size, size);
    for (let i = 0; i < n.length; i++) {
      const k = 1 + (n[i] - 0.5) * amount;
      img.data[i * 4] = r * k; img.data[i * 4 + 1] = g * k; img.data[i * 4 + 2] = b * k; img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }
  function speckle(ctx, size, count, colors, rmax, seed) {
    const r = rng(seed);
    for (let i = 0; i < count; i++) {
      ctx.fillStyle = colors[Math.floor(r() * colors.length)];
      ctx.globalAlpha = 0.3 + r() * 0.7;
      const rad = 0.4 + r() * rmax;
      ctx.beginPath(); ctx.arc(r() * size, r() * size, rad, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function toTex(c, repeat, srgb = true) {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (repeat) t.repeat.set(repeat[0], repeat[1]);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = maxAniso;
    return t;
  }

  const makers = {
    plaster() { const s = 512, c = canvas(s), x = c.getContext('2d'); noisyFill(x, s, '#ffffff', 0.06, 3, 5, 4); return c; },
    concrete() {
      const s = 1024, c = canvas(s), x = c.getContext('2d'); noisyFill(x, s, '#c4c1bb', 0.22, 11, 6, 3);
      speckle(x, s, 2500, ['#8e8b85', '#d8d5cf'], 1.2, 5);
      // 거푸집 패널 줄눈 + 폼타이 구멍 (안도 스타일 600x900 비율)
      x.strokeStyle = 'rgba(70,68,64,0.35)'; x.lineWidth = 2;
      for (let i = 0; i <= 2; i++) { x.beginPath(); x.moveTo(i * s / 2, 0); x.lineTo(i * s / 2, s); x.stroke(); }
      for (let j = 0; j <= 3; j++) { x.beginPath(); x.moveTo(0, j * s / 3); x.lineTo(s, j * s / 3); x.stroke(); }
      for (let i = 0; i < 2; i++) for (let j = 0; j < 3; j++) for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
        const cx = i * s / 2 + s / 2 * (0.25 + a * 0.5), cy = j * s / 3 + s / 3 * (0.25 + b * 0.5);
        const g = x.createRadialGradient(cx, cy, 0, cx, cy, 11); g.addColorStop(0, 'rgba(40,38,35,0.85)'); g.addColorStop(0.55, 'rgba(70,68,64,0.5)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = g; x.beginPath(); x.arc(cx, cy, 11, 0, 7); x.fill();
      }
      return c;
    },
    concreteFloor() { const s = 1024, c = canvas(s), x = c.getContext('2d'); noisyFill(x, s, '#d6d3ce', 0.18, 21, 6, 2); speckle(x, s, 1800, ['#a9a59f', '#eceae6'], 1, 8);
      x.strokeStyle = 'rgba(60,60,60,0.25)'; x.lineWidth = 2; x.strokeRect(0, 0, s, s); return c; },
    woodStrip() {
      const s = 1024, c = canvas(s), x = c.getContext('2d'), r = rng(41); x.fillStyle = '#c9a57c'; x.fillRect(0, 0, s, s);
      const pw = s / 8;
      for (let i = 0; i < 8; i++) {
        let y = 0;
        while (y < s) {
          const len = 200 + r() * 420, sh = (r() - 0.5) * 40;
          x.fillStyle = `rgb(${200 + sh},${160 + sh * 0.8},${118 + sh * 0.6})`; x.fillRect(i * pw + 1, y + 1, pw - 2, len - 2);
          x.globalAlpha = 0.18; x.strokeStyle = '#6b4a2b';
          for (let k = 0; k < 10; k++) { x.beginPath(); const xx = i * pw + r() * pw; x.moveTo(xx, y); x.bezierCurveTo(xx + (r() - .5) * 14, y + len * .3, xx + (r() - .5) * 14, y + len * .7, xx + (r() - .5) * 8, y + len); x.lineWidth = 0.5 + r() * 1.6; x.stroke(); }
          x.globalAlpha = 1; y += len;
        }
      }
      return c;
    },
    herringbone() {
      const s = 1024, c = canvas(s), x = c.getContext('2d'), r = rng(77); x.fillStyle = '#5a3d27'; x.fillRect(0, 0, s, s);
      const w = 32, l = 128;
      for (let row = -8; row < 40; row++) for (let col = -4; col < 12; col++) {
        for (let k = 0; k < 2; k++) {
          x.save(); const bx = col * l + row * w, by = row * w;
          x.translate(bx % (s + l), by); x.rotate(k ? -Math.PI / 4 : Math.PI / 4);
          const sh = (r() - .5) * 36; x.fillStyle = `rgb(${150 + sh},${104 + sh * .8},${66 + sh * .6})`;
          x.fillRect(0, 0, l * 0.7 - 2, w * 0.7 - 2); x.restore();
        }
      }
      return c;
    },
    granite() { const s = 1024, c = canvas(s), x = c.getContext('2d'); noisyFill(x, s, '#bdb6aa', 0.15, 51, 5, 8); speckle(x, s, 9000, ['#5b5650', '#e8e2d8', '#8c857b', '#2f2c29'], 1.6, 9);
      x.strokeStyle = 'rgba(50,45,40,0.35)'; x.lineWidth = 3; for (let i = 0; i <= 2; i++) { x.beginPath(); x.moveTo(0, i * s / 2); x.lineTo(s, i * s / 2); x.stroke(); x.beginPath(); x.moveTo(i * s / 2, 0); x.lineTo(i * s / 2, s); x.stroke(); } return c; },
    stoneBlocks() {
      const s = 1024, c = canvas(s), x = c.getContext('2d'), r = rng(61); noisyFill(x, s, '#b7ab98', 0.2, 62, 5, 6);
      const rows = 8, hgt = s / rows;
      for (let j = 0; j < rows; j++) { let xx = (j % 2) * 60; while (xx < s + 200) { const w = 120 + r() * 160; const sh = (r() - .5) * 30;
        x.fillStyle = `rgba(${150 + sh},${138 + sh},${118 + sh},0.55)`; x.fillRect(xx + 3, j * hgt + 3, w - 6, hgt - 6); xx += w; } }
      speckle(x, s, 4000, ['#6b6152', '#ddd3c2'], 1.4, 63);
      x.strokeStyle = 'rgba(60,50,40,0.5)'; x.lineWidth = 4; for (let j = 0; j <= rows; j++) { x.beginPath(); x.moveTo(0, j * hgt); x.lineTo(s, j * hgt); x.stroke(); }
      return c;
    },
    brick() { // 실제 비율(약 23×7.5cm)의 벽돌 + 줄눈 + 얼룩
      const s = 1024, c = canvas(s), x = c.getContext('2d'), r = rng(91); noisyFill(x, s, '#b9b1a5', 0.15, 92, 4, 8);
      const rows = 48, cols = 16, bh = s / rows, bw = s / cols;
      for (let j = 0; j < rows; j++) for (let i = -1; i <= cols; i++) {
        const sh = (r() - .5) * 38, bx = i * bw + (j % 2) * bw / 2, burnt = r() < 0.12 ? -35 : 0;
        x.fillStyle = `rgb(${158 + sh + burnt},${78 + sh * .55 + burnt * .6},${58 + sh * .45 + burnt * .5})`; x.fillRect(bx + 1.5, j * bh + 1.5, bw - 3, bh - 3);
      }
      const n = fbm(s, 93, 5, 3), img = x.getImageData(0, 0, s, s);
      for (let i = 0; i < n.length; i++) { const k = 0.82 + n[i] * 0.36; img.data[i * 4] *= k; img.data[i * 4 + 1] *= k; img.data[i * 4 + 2] *= k; }
      x.putImageData(img, 0, 0); speckle(x, s, 6000, ['#3a2018', '#d8a28a', '#6b3a2a'], 0.9, 94);
      return c;
    },
    terracotta() { // 가로로 긴 도자 패널 (얇은 줄눈)
      const s = 1024, c = canvas(s), x = c.getContext('2d'), r = rng(19); x.fillStyle = '#8a7056'; x.fillRect(0, 0, s, s);
      const rows = 20, h = s / rows;
      for (let j = 0; j < rows; j++) { let xx = -(j % 4) * 90; while (xx < s) { const w = 300 + r() * 220, sh = (r() - .5) * 22;
        const pal = [[201, 168, 130], [212, 180, 142], [191, 156, 120], [220, 193, 158]][Math.floor(r() * 4)];
        x.fillStyle = `rgb(${pal[0] + sh},${pal[1] + sh * .8},${pal[2] + sh * .6})`; x.fillRect(xx + 1.5, j * h + 1.5, w - 3, h - 3); xx += w; } }
      const n = fbm(s, 20, 5, 4), img = x.getImageData(0, 0, s, s);
      for (let i = 0; i < n.length; i++) { const k = 0.88 + n[i] * 0.24; img.data[i * 4] *= k; img.data[i * 4 + 1] *= k; img.data[i * 4 + 2] *= k; }
      x.putImageData(img, 0, 0); return c;
    },
    basalt() { const s = 1024, c = canvas(s), x = c.getContext('2d'); noisyFill(x, s, '#4a4946', 0.35, 71, 6, 6);
      const r = rng(72); for (let i = 0; i < 2200; i++) { x.fillStyle = r() > .5 ? 'rgba(15,15,15,0.8)' : 'rgba(30,28,26,0.6)'; x.beginPath(); x.arc(r() * s, r() * s, 1 + r() * 4.5, 0, 7); x.fill(); } return c; },
    basaltBlocks() {
      const s = 1024, c = canvas(s), x = c.getContext('2d'), r = rng(73); x.drawImage(makers.basalt(), 0, 0);
      const rows = 7, h = s / rows; x.strokeStyle = 'rgba(10,10,10,0.7)'; x.lineWidth = 6;
      for (let j = 0; j < rows; j++) { let xx = -r() * 100; x.beginPath(); x.moveTo(0, j * h); x.lineTo(s, j * h + (r() - .5) * 10); x.stroke();
        while (xx < s) { xx += 120 + r() * 200; x.beginPath(); x.moveTo(xx, j * h); x.lineTo(xx + (r() - .5) * 20, j * h + h); x.stroke(); } }
      return c;
    },
    terrazzo() { const s = 1024, c = canvas(s), x = c.getContext('2d'); noisyFill(x, s, '#efece6', 0.06, 81, 4, 4); speckle(x, s, 7000, ['#bdb6aa', '#8e8a82', '#d9cfbf', '#6d6a64', '#c7b9a3'], 3.2, 82); return c; },
    polishedDark() { const s = 512, c = canvas(s), x = c.getContext('2d'); noisyFill(x, s, '#2c2d31', 0.25, 85, 5, 3); speckle(x, s, 800, ['#45464c', '#1a1a1d'], 1, 86); return c; },
    stonePaving() { const s = 1024, c = canvas(s), x = c.getContext('2d'), r = rng(101); noisyFill(x, s, '#b3aea5', 0.18, 102, 5, 6);
      const n = 8, w = s / n; for (let j = 0; j < n * 2; j++) { const off = (j % 2) * w / 2; for (let i = -1; i <= n; i++) { const sh = (r() - .5) * 28;
        x.fillStyle = `rgba(${170 + sh},${165 + sh},${155 + sh},0.6)`; x.fillRect(i * w + off + 2, j * w / 2 + 2, w - 4, w / 2 - 4); } }
      speckle(x, s, 3000, ['#7c776f', '#d9d4ca'], 1.1, 103); return c; },
    granitePaving() { const s = 1024, c = canvas(s), x = c.getContext('2d'); x.drawImage(makers.granite(), 0, 0);
      x.strokeStyle = 'rgba(40,36,32,0.5)'; x.lineWidth = 4; for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * s / 4, 0); x.lineTo(i * s / 4, s); x.stroke(); x.beginPath(); x.moveTo(0, i * s / 4); x.lineTo(s, i * s / 4); x.stroke(); } return c; },
    basaltPaving() { const s = 1024, c = canvas(s), x = c.getContext('2d'); x.drawImage(makers.basalt(), 0, 0);
      x.strokeStyle = 'rgba(160,160,155,0.35)'; x.lineWidth = 5; for (let i = 0; i <= 3; i++) { x.beginPath(); x.moveTo(i * s / 3, 0); x.lineTo(i * s / 3, s); x.stroke(); x.beginPath(); x.moveTo(0, i * s / 3); x.lineTo(s, i * s / 3); x.stroke(); } return c; },
    asphalt() { const s = 512, c = canvas(s), x = c.getContext('2d'); noisyFill(x, s, '#5f5d5a', 0.3, 111, 6, 8); speckle(x, s, 3000, ['#3a3937', '#8a8780'], 1, 112); return c; },
    whiteGravel() { const s = 512, c = canvas(s), x = c.getContext('2d'); noisyFill(x, s, '#dcd8d0', 0.1, 121, 4, 8); speckle(x, s, 6000, ['#ffffff', '#b8b2a7', '#9a958c'], 2.2, 122); return c; },
    grass() { const s = 1024, c = canvas(s), x = c.getContext('2d'); noisyFill(x, s, '#5f7f3e', 0.45, 131, 6, 6);
      const r = rng(132); for (let i = 0; i < 26000; i++) { const g = 80 + r() * 90; x.strokeStyle = `rgba(${g * .55},${g},${g * .35},0.55)`; x.lineWidth = 1; const xx = r() * s, yy = r() * s; x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx + (r() - .5) * 3, yy - 3 - r() * 5); x.stroke(); } return c; },
    deck() { const s = 1024, c = canvas(s), x = c.getContext('2d'), r = rng(141); x.fillStyle = '#4a3a2c'; x.fillRect(0, 0, s, s);
      const n = 10, h = s / n; for (let j = 0; j < n; j++) { const sh = (r() - .5) * 30; x.fillStyle = `rgb(${128 + sh},${100 + sh},${76 + sh})`; x.fillRect(0, j * h + 3, s, h - 6);
        x.globalAlpha = .2; for (let k = 0; k < 14; k++) { x.strokeStyle = '#2b2015'; x.beginPath(); const yy = j * h + 4 + r() * (h - 8); x.moveTo(0, yy); x.lineTo(s, yy + (r() - .5) * 6); x.stroke(); } x.globalAlpha = 1; } return c; },
    plantWall() {
      const s = 1024, c = canvas(s), x = c.getContext('2d'), r = rng(151); noisyFill(x, s, '#2f4f26', 0.5, 152, 5, 6);
      const greens = ['#3f7a32', '#5c9a3b', '#2d5e2a', '#7fb04a', '#4c8a3f', '#a7c25a', '#285024', '#6a8f3a'];
      for (let i = 0; i < 9000; i++) {
        x.fillStyle = greens[Math.floor(r() * greens.length)]; x.globalAlpha = 0.65 + r() * 0.35;
        x.save(); x.translate(r() * s, r() * s); x.rotate(r() * Math.PI * 2);
        x.beginPath(); x.ellipse(0, 0, 4 + r() * 12, 2 + r() * 5, 0, 0, 7); x.fill(); x.restore();
      }
      for (let i = 0; i < 260; i++) { x.fillStyle = ['#d9c44a', '#c97b8e', '#e8e3d0', '#b05a3c'][Math.floor(r() * 4)]; x.globalAlpha = .8; x.beginPath(); x.arc(r() * s, r() * s, 1.5 + r() * 3, 0, 7); x.fill(); }
      x.globalAlpha = 1; return c;
    },
    reeds() {
      const s = 512, c = canvas(s, 256), x = c.getContext('2d'), r = rng(161);
      for (let i = 0; i < 900; i++) { const xx = r() * s, h = 120 + r() * 130, g = 120 + r() * 80;
        x.strokeStyle = `rgba(${g},${g * .85},${g * .5},0.9)`; x.lineWidth = 1 + r() * 1.5; x.beginPath(); x.moveTo(xx, 256); x.quadraticCurveTo(xx + (r() - .5) * 20, 256 - h * .6, xx + (r() - .5) * 30, 256 - h); x.stroke();
        if (r() > .6) { x.fillStyle = `rgba(${g + 40},${g + 20},${g - 20},0.8)`; x.beginPath(); x.ellipse(xx + (r() - .5) * 30, 256 - h, 3, 9, 0, 0, 7); x.fill(); } }
      return c;
    },
    waterNormal() {
      const s = 512, c = canvas(s), x = c.getContext('2d'); const n = fbm(s, 171, 5, 4), n2 = fbm(s, 177, 4, 8);
      const img = x.createImageData(s, s), h = (i) => n[i] * 0.7 + n2[i] * 0.3;
      for (let yy = 0; yy < s; yy++) for (let xx = 0; xx < s; xx++) {
        const i = yy * s + xx, dx = h(yy * s + ((xx + 1) % s)) - h(i), dy = h(((yy + 1) % s) * s + xx) - h(i);
        img.data[i * 4] = 128 + dx * 900; img.data[i * 4 + 1] = 128 + dy * 900; img.data[i * 4 + 2] = 255; img.data[i * 4 + 3] = 255;
      }
      x.putImageData(img, 0, 0); return c;
    },
    wood() { const s = 1024, c = canvas(s), x = c.getContext('2d'), r = rng(181); x.fillStyle = '#a37a52'; x.fillRect(0, 0, s, s);
      const n = 12, w = s / n; for (let i = 0; i < n; i++) { const sh = (r() - .5) * 30; x.fillStyle = `rgb(${170 + sh},${126 + sh},${86 + sh})`; x.fillRect(i * w + 2, 0, w - 4, s);
        x.globalAlpha = .2; for (let k = 0; k < 12; k++) { x.strokeStyle = '#5a3a1f'; x.beginPath(); const xx = i * w + r() * w; x.moveTo(xx, 0); x.bezierCurveTo(xx + 8, s * .3, xx - 8, s * .6, xx, s); x.stroke(); } x.globalAlpha = 1; } return c; },
    leaves() { // 잎 덩어리 무늬 (밝기만, 색은 재질 색으로)
      const s = 512, c = canvas(s), x = c.getContext('2d'), r = rng(201); noisyFill(x, s, '#9a9a9a', 0.5, 202, 5, 6);
      for (let i = 0; i < 5000; i++) { const g = 90 + r() * 165; x.fillStyle = `rgb(${g},${g},${g})`; x.save(); x.translate(r() * s, r() * s); x.rotate(r() * 6.28); x.beginPath(); x.ellipse(0, 0, 3 + r() * 6, 1.5 + r() * 3, 0, 0, 7); x.fill(); x.restore(); }
      return c;
    },
    bark() { const s = 256, c = canvas(s, 512), x = c.getContext('2d'), r = rng(211); x.fillStyle = '#8a7a6a'; x.fillRect(0, 0, s, 512);
      for (let i = 0; i < 260; i++) { const g = 70 + r() * 90; x.strokeStyle = `rgba(${g},${g * 0.9},${g * 0.8},0.6)`; x.lineWidth = 1 + r() * 4; const xx = r() * s; x.beginPath(); x.moveTo(xx, r() * 512); x.lineTo(xx + (r() - .5) * 8, r() * 512); x.stroke(); }
      return c; },
    frond() { // 야자 잎 (알파)
      const c = canvas(128, 512), x = c.getContext('2d'); x.clearRect(0, 0, 128, 512); x.strokeStyle = '#d8e6c8'; x.lineWidth = 6; x.beginPath(); x.moveTo(64, 512); x.lineTo(64, 0); x.stroke();
      for (let y = 10; y < 500; y += 9) { const w = 60 * Math.sin(Math.PI * (1 - y / 512)) + 6; x.strokeStyle = `rgba(230,240,215,1)`; x.lineWidth = 4; x.beginPath(); x.moveTo(64, y); x.lineTo(64 - w, y + 26); x.moveTo(64, y); x.lineTo(64 + w, y + 26); x.stroke(); }
      return c; },
    leaf() { // 화분 잎 (알파)
      const c = canvas(128, 256), x = c.getContext('2d'); x.clearRect(0, 0, 128, 256);
      const g = x.createLinearGradient(0, 0, 128, 0); g.addColorStop(0, '#c9dcb4'); g.addColorStop(0.5, '#f2f7ea'); g.addColorStop(1, '#c9dcb4');
      x.fillStyle = g; x.beginPath(); x.moveTo(64, 250); x.bezierCurveTo(-10, 170, 10, 40, 64, 4); x.bezierCurveTo(118, 40, 138, 170, 64, 250); x.fill();
      x.strokeStyle = 'rgba(120,150,100,0.8)'; x.lineWidth = 3; x.beginPath(); x.moveTo(64, 250); x.lineTo(64, 10); x.stroke(); return c; },
    grassTuft() { // 잔디 덤불 (알파)
      const c = canvas(256, 160), x = c.getContext('2d'), r = rng(221); x.clearRect(0, 0, 256, 160);
      for (let i = 0; i < 140; i++) { const xx = 10 + r() * 236, h = 50 + r() * 105, g = 90 + r() * 90; x.strokeStyle = `rgb(${g * 0.6},${g},${g * 0.4})`; x.lineWidth = 1.5 + r() * 2.5; x.beginPath(); x.moveTo(xx, 160); x.quadraticCurveTo(xx + (r() - .5) * 20, 160 - h * 0.5, xx + (r() - .5) * 40, 160 - h); x.stroke(); }
      return c; },
    lightPool() { // 벽에 맺히는 스포트라이트 빛 웅덩이 (흑백 = 알파맵)
      const s = 256, c = canvas(s), x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, s, s);
      const g = x.createRadialGradient(s / 2, s * 0.4, 0, s / 2, s * 0.5, s / 2);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, '#9a9a9a'); g.addColorStop(0.65, '#262626'); g.addColorStop(1, '#000000');
      x.fillStyle = g; x.fillRect(0, 0, s, s); return c;
    },
    beam() { // 빛줄기
      const c = canvas(64, 256), x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, 64, 256);
      for (let i = 0; i < 64; i++) { const h = 1 - Math.abs(i - 31.5) / 32, v = Math.pow(h, 1.5);
        const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, `rgb(${v * 200},${v * 200},${v * 200})`); g.addColorStop(1, '#000'); x.fillStyle = g; x.fillRect(i, 0, 1, 256); }
      return c;
    },
    contactShadow() { // 벽-바닥 접합부 그림자
      const c = canvas(8, 128), x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 128);
      g.addColorStop(0, '#8c8c8c'); g.addColorStop(0.4, '#262626'); g.addColorStop(1, '#000'); x.fillStyle = g; x.fillRect(0, 0, 8, 128); return c;
    },
    blob() { const s = 128, c = canvas(s), x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, s, s); const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      g.addColorStop(0, '#999'); g.addColorStop(1, '#000'); x.fillStyle = g; x.fillRect(0, 0, s, s); return c; }
  };

  window.Tex = {
    init(renderer) { maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy()); },
    get(name, repeat, srgb = true) {
      if (!cache.has(name)) cache.set(name, makers[name]());
      return toTex(cache.get(name), repeat, srgb);
    },
    canvas, rng,
    // 글자 텍스처 (현수막, 벽면 레터링, 명패)
    text(lines, opt = {}) {
      const w = opt.w || 1024, h = opt.h || 256, c = canvas(w, h), x = c.getContext('2d');
      if (opt.bg) { x.fillStyle = opt.bg; x.fillRect(0, 0, w, h); }
      x.textAlign = opt.align || 'center'; x.textBaseline = 'middle';
      const ax = opt.align === 'left' ? (opt.pad || 40) : opt.align === 'right' ? w - (opt.pad || 40) : w / 2;
      let y = opt.top || h / 2 - (lines.length - 1) * (lines[0].size || 60) * 0.6;
      lines.forEach(l => {
        x.font = `${l.weight || 700} ${l.size || 60}px ${l.font || '"Noto Sans KR", sans-serif'}`;
        x.fillStyle = l.color || opt.color || '#111';
        if (l.spacing) { try { x.letterSpacing = l.spacing + 'px'; } catch (e) { } }
        let t = l.text; while (x.measureText(t).width > w - 60 && t.length > 2) t = t.slice(0, -2) + '…';
        x.fillText(t, ax, y); y += (l.size || 60) * (l.lh || 1.35);
        try { x.letterSpacing = '0px'; } catch (e) { }
      });
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; return t;
    },
    // 전시 포스터 (로고 + 제목 여러 줄 + 부제) — 글자가 넘치면 자동으로 줄임
    poster(o) {
      const w = o.w || 1024, h = o.h || 512, c = canvas(w, h), x = c.getContext('2d'), C = window.ART_CONFIG;
      if (o.bg) { x.fillStyle = o.bg; x.fillRect(0, 0, w, h); }
      const pad = w * 0.07, maxW = w - pad * 2, ink = o.ink || '#fff', sub = o.sub || 'rgba(255,255,255,0.8)';
      const lines = o.lines || C.exhibitionTitleLines || [C.exhibitionTitle];
      let logo = window.LOGO_IMG && window.LOGO_IMG.complete && window.LOGO_IMG.naturalWidth ? window.LOGO_IMG : null;
      if (logo && logo._safe === undefined) { // 다른 출처 이미지면 캔버스가 오염되어 텍스처가 검게 됨 → 로고 생략
        try { const tc = canvas(4, 4), tx = tc.getContext('2d'); tx.drawImage(logo, 0, 0, 4, 4); tx.getImageData(0, 0, 1, 1); logo._safe = true; } catch (e) { logo._safe = false; }
      }
      if (logo && !logo._safe) logo = null;
      const fit = (t, size, weight, font) => { let s = size; do { x.font = `${weight} ${s}px ${font}`; if (x.measureText(t).width <= maxW) break; s -= 2; } while (s > 10); return s; };
      const serif = '"Noto Serif KR", serif', sans = '"Noto Sans KR", sans-serif';
      let ts = h * (o.titleScale || 0.15); lines.forEach(l => { ts = Math.min(ts, fit(l, ts, 900, serif)); });
      const logoH = logo && o.logo !== false ? h * (o.logoScale || 0.15) : 0;
      const subS = o.subtitle === false ? 0 : Math.min(h * 0.055, fit(C.exhibitionSubtitle, h * 0.055, 400, sans));
      const meta = o.meta === false ? '' : [C.schoolName, C.exhibitionPeriod].filter(Boolean).join('  ·  ');
      const metaS = meta ? h * 0.045 : 0;
      const total = (logoH ? logoH + h * 0.06 : 0) + lines.length * ts * 1.22 + (subS ? subS * 1.9 : 0) + (metaS ? metaS * 1.8 : 0);
      let y = (h - total) / 2;
      const align = o.align || 'center', ax = align === 'left' ? pad : w / 2;
      x.textAlign = align; x.textBaseline = 'top';
      if (logoH) {
        const lw = logoH * logo.naturalWidth / logo.naturalHeight, lx = align === 'left' ? pad : (w - lw) / 2, r = logoH * 0.12, pp = logoH * 0.12;
        x.fillStyle = '#ffffff'; x.beginPath(); if (x.roundRect) x.roundRect(lx - pp, y - pp, lw + pp * 2, logoH + pp * 2, r); else x.rect(lx - pp, y - pp, lw + pp * 2, logoH + pp * 2); x.fill();
        x.drawImage(logo, lx, y, lw, logoH); y += logoH + h * 0.06;
      }
      x.fillStyle = ink; lines.forEach(l => { x.font = `900 ${ts}px ${serif}`; x.fillText(l, ax, y); y += ts * 1.22; });
      if (subS) { y += subS * 0.6; x.font = `400 ${subS}px ${sans}`; x.fillStyle = sub; x.fillText(C.exhibitionSubtitle, ax, y); y += subS * 1.3; }
      if (metaS) { y += metaS * 0.5; x.font = `500 ${metaS}px ${sans}`; x.fillStyle = sub; x.fillText(meta, ax, y); }
      if (o.accentBar) { x.fillStyle = o.accentBar; x.fillRect(align === 'left' ? pad : w / 2 - w * 0.04, h * 0.06, w * 0.08, Math.max(3, h * 0.01)); }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; return t;
    },
    placeholder(title, i) {
      const s = 768, c = canvas(s), x = c.getContext('2d');
      const pal = [['#e9e4da', '#c8643c'], ['#e6ebe8', '#3d8c5a'], ['#ece6f0', '#6b4c9a'], ['#f0e9df', '#2f5d73'], ['#eee', '#222']][i % 5];
      x.fillStyle = pal[0]; x.fillRect(0, 0, s, s);
      const r = rng(i * 97 + 13); x.globalAlpha = 0.85;
      for (let k = 0; k < 6; k++) { x.fillStyle = k % 2 ? pal[1] : '#1d1d1d'; x.beginPath(); x.arc(r() * s, r() * s, 40 + r() * 160, 0, 7); x.globalAlpha = 0.12 + r() * 0.25; x.fill(); }
      x.globalAlpha = 1; x.fillStyle = '#1d1d1d'; x.textAlign = 'center'; x.font = '700 46px "Noto Sans KR", sans-serif'; x.fillText(title || '작품 준비 중', s / 2, s / 2);
      x.font = '400 26px "Noto Sans KR", sans-serif'; x.fillStyle = '#555'; x.fillText('이미지를 불러오는 중입니다', s / 2, s / 2 + 56);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
    }
  };
})();
