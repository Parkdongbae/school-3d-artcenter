/* =========================================================
 * Post: 초고해상도용 후처리 (MSAA · 블룸 · 비네팅 · 미세 입자)
 *  - 장면을 HDR 렌더 타깃에 그린 뒤 밝은 부분을 번지게 합성
 * ========================================================= */
(function () {
  const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';
  class Post {
    constructor(renderer) {
      this.r = renderer;
      const opt = { type: THREE.HalfFloatType, colorSpace: THREE.LinearSRGBColorSpace };
      this.rtScene = new THREE.WebGLRenderTarget(4, 4, { ...opt, samples: 4 });
      this.rtA = new THREE.WebGLRenderTarget(4, 4, opt); this.rtB = new THREE.WebGLRenderTarget(4, 4, opt);
      this.rtC = new THREE.WebGLRenderTarget(4, 4, opt); this.rtD = new THREE.WebGLRenderTarget(4, 4, opt);
      this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); this.scene = new THREE.Scene(); this.scene.add(this.quad);
      this.bright = new THREE.ShaderMaterial({ uniforms: { t: { value: null }, th: { value: 1.5 } }, vertexShader: VS, toneMapped: false,
        fragmentShader: 'uniform sampler2D t; uniform float th; varying vec2 vUv; void main(){ vec3 c = texture2D(t, vUv).rgb; float l = max(c.r, max(c.g, c.b)); gl_FragColor = vec4(c * smoothstep(th, th * 1.8, l), 1.); }' });
      this.blur = new THREE.ShaderMaterial({ uniforms: { t: { value: null }, dir: { value: new THREE.Vector2() } }, vertexShader: VS, toneMapped: false,
        fragmentShader: `uniform sampler2D t; uniform vec2 dir; varying vec2 vUv;
          void main(){ vec3 c = texture2D(t, vUv).rgb * .227027;
            c += (texture2D(t, vUv + dir * 1.3846).rgb + texture2D(t, vUv - dir * 1.3846).rgb) * .3162162;
            c += (texture2D(t, vUv + dir * 3.2308).rgb + texture2D(t, vUv - dir * 3.2308).rgb) * .0702703;
            gl_FragColor = vec4(c, 1.); }` });
      this.comp = new THREE.ShaderMaterial({ uniforms: { tS: { value: null }, tB1: { value: null }, tB2: { value: null }, k: { value: 0.55 }, time: { value: 0 } }, vertexShader: VS,
        fragmentShader: `uniform sampler2D tS, tB1, tB2; uniform float k, time; varying vec2 vUv;
          float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
          void main(){ vec3 c = texture2D(tS, vUv).rgb + (texture2D(tB1, vUv).rgb * .6 + texture2D(tB2, vUv).rgb * .8) * k;
            float d = distance(vUv, vec2(.5)); c *= mix(1., .8, smoothstep(.42, .95, d));
            gl_FragColor = vec4(c, 1.);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
            gl_FragColor.rgb += (h(vUv * 1000. + time) - .5) * .012;
          }` });
      this.setSize(innerWidth, innerHeight);
    }
    setSize(w, h) {
      const pr = this.r.getPixelRatio(), W = Math.floor(w * pr), H = Math.floor(h * pr);
      this.rtScene.setSize(W, H);
      this.rtA.setSize(W >> 1, H >> 1); this.rtB.setSize(W >> 1, H >> 1);
      this.rtC.setSize(W >> 2, H >> 2); this.rtD.setSize(W >> 2, H >> 2);
    }
    pass(mat, target) { this.quad.material = mat; this.r.setRenderTarget(target); this.r.render(this.scene, this.cam); }
    render(scene, camera, t) {
      const r = this.r;
      r.setRenderTarget(this.rtScene); r.render(scene, camera);
      this.bright.uniforms.t.value = this.rtScene.texture; this.pass(this.bright, this.rtA);
      const b = this.blur.uniforms;
      b.t.value = this.rtA.texture; b.dir.value.set(1 / this.rtA.width, 0); this.pass(this.blur, this.rtB);
      b.t.value = this.rtB.texture; b.dir.value.set(0, 1 / this.rtA.height); this.pass(this.blur, this.rtA);
      b.t.value = this.rtA.texture; b.dir.value.set(2 / this.rtA.width, 0); this.pass(this.blur, this.rtC);
      b.t.value = this.rtC.texture; b.dir.value.set(0, 2 / this.rtC.height); this.pass(this.blur, this.rtD);
      b.t.value = this.rtD.texture; b.dir.value.set(2 / this.rtC.width, 0); this.pass(this.blur, this.rtC);
      b.t.value = this.rtC.texture; b.dir.value.set(0, 2 / this.rtC.height); this.pass(this.blur, this.rtD);
      const c = this.comp.uniforms; c.tS.value = this.rtScene.texture; c.tB1.value = this.rtA.texture; c.tB2.value = this.rtD.texture; c.time.value = t % 100;
      this.pass(this.comp, null);
    }
  }
  window.Post = Post;
})();
