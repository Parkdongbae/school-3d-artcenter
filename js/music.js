/* =========================================================
 * Music: 로비용 잔잔한 배경음악 (음원 파일 없이 브라우저에서 직접 합성)
 *  - 부드러운 화음(패드) + 가끔 울리는 피아노 같은 음 + 잔향
 *  - 저작권 걱정 없는 자체 생성 음악
 * ========================================================= */
(function () {
  const CHORDS = [ // 반음 단위 (C4 = 0)
    [-12, 0, 4, 7, 11],     // Cmaj7
    [-15, -3, 0, 4, 7],     // Am7
    [-19, -7, -3, 0, 4],    // Fmaj7
    [-17, -5, -1, 2, 9],    // G6
  ];
  const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21]; // C 펜타토닉
  const hz = s => 261.63 * Math.pow(2, s / 12);

  class Music {
    constructor() { this.ctx = null; this.level = 0; this.target = 0; this.muted = false; this.started = false; }
    // 사용자 조작 뒤에만 소리를 낼 수 있음 (브라우저 자동재생 정책)
    start() {
      if (this.started) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      const ctx = this.ctx = new AC(); this.started = true;
      this.master = ctx.createGain(); this.master.gain.value = 0; this.master.connect(ctx.destination);
      // 잔향 (짧은 홀 느낌의 임펄스 응답을 직접 생성)
      const len = ctx.sampleRate * 3.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
      this.verb = ctx.createConvolver(); this.verb.buffer = ir;
      const wet = ctx.createGain(); wet.gain.value = 0.55; this.verb.connect(wet); wet.connect(this.master);
      this.dry = ctx.createGain(); this.dry.gain.value = 0.6; this.dry.connect(this.master); this.dry.connect(this.verb);
      this.lp = ctx.createBiquadFilter(); this.lp.type = 'lowpass'; this.lp.frequency.value = 1400; this.lp.Q.value = 0.3; this.lp.connect(this.dry);
      this.chordIdx = 0; this.nextChord = ctx.currentTime + 0.1; this.nextNote = ctx.currentTime + 2;
      this.timer = setInterval(() => this.schedule(), 200);
      document.addEventListener('visibilitychange', () => { if (!this.ctx) return; document.hidden ? this.ctx.suspend() : this.ctx.resume(); });
    }
    pad(freq, t, dur) {
      const ctx = this.ctx, g = ctx.createGain();
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.045, t + 2.5); g.gain.setValueAtTime(0.045, t + dur - 2.5); g.gain.linearRampToValueAtTime(0, t + dur + 1.5);
      g.connect(this.lp);
      [-4, 4].forEach(det => { const o = ctx.createOscillator(); o.type = det < 0 ? 'sine' : 'triangle'; o.frequency.value = freq; o.detune.value = det; o.connect(g); o.start(t); o.stop(t + dur + 1.6); });
    }
    pluck(freq, t, vel = 1) {
      const ctx = this.ctx, g = ctx.createGain();
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.09 * vel, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0008, t + 3.5);
      g.connect(this.dry);
      [[1, 1], [2, 0.35], [3, 0.12]].forEach(([m, a]) => { const o = ctx.createOscillator(), og = ctx.createGain(); o.type = 'sine'; o.frequency.value = freq * m; og.gain.value = a; o.connect(og); og.connect(g); o.start(t); o.stop(t + 3.6); });
    }
    schedule() {
      const ctx = this.ctx, now = ctx.currentTime;
      // 음량 부드럽게 따라가기
      const tgt = this.muted ? 0 : this.target;
      this.level += (tgt - this.level) * 0.12;
      this.master.gain.setTargetAtTime(this.level * 0.9, now, 0.25);
      if (this.level < 0.001 && tgt === 0) return; // 꺼져 있을 땐 새 음을 만들지 않음
      if (now + 0.5 > this.nextChord) {
        const ch = CHORDS[this.chordIdx % CHORDS.length], dur = 9;
        ch.forEach(s => this.pad(hz(s), this.nextChord, dur));
        this.chordIdx++; this.nextChord += dur - 1;
      }
      if (now + 0.5 > this.nextNote) {
        const base = CHORDS[(this.chordIdx + 3) % CHORDS.length][1];
        const s = SCALE[Math.floor(Math.random() * SCALE.length)] + (base > -5 ? 0 : -12) + 12;
        this.pluck(hz(s), this.nextNote, 0.6 + Math.random() * 0.4);
        if (Math.random() < 0.35) this.pluck(hz(s + (Math.random() < 0.5 ? 5 : 7)), this.nextNote + 0.45, 0.5);
        this.nextNote += 1.6 + Math.random() * 2.8;
      }
    }
    setTarget(v) { this.target = Math.max(0, Math.min(1, v)); }
    setMuted(m) { this.muted = m; }
  }
  window.Music = Music;
})();
