/* =========================================================
 * Vercel 서버 기능: 작품 사진 업데이트
 *  POST /api/update-images  { password, action: 'run' | 'status' }
 *   - run    : GitHub Actions 의 "작품 사진 업데이트" 작업을 실행
 *   - status : 가장 최근 작업의 진행 상태 (job: 'images' | 'settings')
 *   - settings : 모든 기기 자동 확인 설정 변경 { autoSync: true|false, seconds }
 *   - words    : 감상평 비속어 목록 고치기 { addWords, addAllow, remove } (쉼표 구분)
 *
 * Vercel 프로젝트 환경 변수 (Settings → Environment Variables)
 *   ADMIN_PASSWORD : 데이터 관리 화면에서 입력할 관리자 비밀번호
 *   GITHUB_TOKEN   : 이 저장소에만 "Actions: Read and write" 권한이 있는 GitHub 접근 키
 *   GITHUB_REPO    : (선택) 비워 두면 Vercel 에 연결된 GitHub 저장소를 자동으로 사용
 * ========================================================= */
const crypto = require('crypto');

const WORKFLOWS = { images: 'fetch-images.yml', settings: 'site-settings.yml', words: 'badwords.yml', config: 'site-config.yml' };
const env = k => String(process.env[k] || '').trim(); // 붙여넣을 때 섞인 공백·줄바꿈 제거

// 접근 키 정리: GitHub 접근 키는 영문·숫자·밑줄(_)로만 이루어져 있으므로
// 붙여넣을 때 함께 들어오기 쉬운 것들(공백, 줄바꿈, 보이지 않는 글자, 따옴표, "GITHUB_TOKEN=", "Bearer ")을 걸러 냄
function cleanToken(raw) {
  let t = String(raw || '').replace(/[\s\u00a0\u200b-\u200f\u2028\u2029\u202f\u2060\ufeff]/g, '');
  t = t.replace(/^(GITHUB_TOKEN=|Bearer|token)/i, '').replace(/^["'`“”‘’]+|["'`“”‘’]+$/g, '');
  return t;
}
function tokenProblem(t) {
  if (!t) return 'GITHUB_TOKEN 값이 비어 있습니다.';
  const bad = [...new Set(t.replace(/[A-Za-z0-9_]/g, ''))];
  const kind = c => /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(c) ? `한글 '${c}'` : (c.charCodeAt(0) > 126 ? `특수문자 U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}` : `'${c}'`);
  const head = /^github_pat_|^gh[pousr]_/.test(t) ? '' : ' 값이 github_pat_ (또는 ghp_)로 시작하지 않습니다.';
  if (bad.length) return `GITHUB_TOKEN 값에 접근 키에 없는 글자가 섞여 있습니다: ${bad.slice(0, 4).map(kind).join(', ')} (전체 ${t.length}자).${head} Vercel에서 값을 지우고 접근 키만 다시 붙여넣은 뒤 Redeploy 해 주세요.`;
  if (head) return 'GITHUB_TOKEN' + head + ' 접근 키를 정확히 붙여넣었는지 확인해 주세요.';
  return '';
}

function same(a, b) {
  const x = crypto.createHash('sha256').update(String(a || '')).digest();
  const y = crypto.createHash('sha256').update(String(b || '')).digest();
  return crypto.timingSafeEqual(x, y);
}

// 저장소 이름: 직접 지정 → Vercel 이 알려 주는 연결 저장소 → 기본값
function repoName() {
  const auto = env('VERCEL_GIT_REPO_OWNER') && env('VERCEL_GIT_REPO_SLUG') ? `${env('VERCEL_GIT_REPO_OWNER')}/${env('VERCEL_GIT_REPO_SLUG')}` : '';
  return env('GITHUB_REPO') || auto || '';
}
async function gh(path, opt = {}) {
  const repo = repoName();
  const res = await fetch(`https://api.github.com/repos/${repo}${path}`, {
    ...opt,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${cleanToken(process.env.GITHUB_TOKEN)}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': '3d-artcenter',
      ...(opt.body ? { 'Content-Type': 'application/json' } : {})
    }
  });
  const text = await res.text();
  let data = null; try { data = text ? JSON.parse(text) : null; } catch (e) { }
  return { ok: res.ok, status: res.status, data };
}

// ---------- 자동 작업 파일 설치 ----------
// Vercel 배포 버튼으로 복사한 저장소에는 .github/workflows 폴더가 빠져 있으므로,
// 처음 쓸 때 공개 원본 저장소에서 작업 파일을 받아 설치합니다.
// (접근 키에 Contents · Workflows 쓰기 권한이 필요)
const TEMPLATE_RAW = 'https://raw.githubusercontent.com/Parkdongbae/school-3d-artcenter/main/.github/workflows/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function installWorkflows() {
  const slug = repoName().split('/')[1];
  const repo = await gh('');
  if (!repo.ok) return { error: repo.status === 404 || repo.status === 403 ? `접근 키로 ${slug} 저장소에 들어갈 수 없습니다. 접근 키를 만들 때 Repository access에서 ${slug} 저장소를 선택했는지 확인해 주세요 (${repo.status}).` : why(repo.status, repo.data, '저장소 정보를 읽지 못했습니다') };
  const branch = (repo.data && repo.data.default_branch) || 'main';
  const have = await gh('/actions/workflows');
  const names = new Set(((have.data && have.data.workflows) || []).map(w => String(w.path).split('/').pop()));
  let added = 0;
  for (const f of Object.values(WORKFLOWS)) {
    if (names.has(f)) continue;
    const src = await fetch(TEMPLATE_RAW + f);
    if (!src.ok) return { error: `원본 저장소에서 작업 파일(${f})을 받지 못했습니다 (${src.status}).` };
    const text = await src.text();
    const cur = await gh(`/contents/.github/workflows/${f}?ref=${branch}`);
    const put = await gh(`/contents/.github/workflows/${f}`, { method: 'PUT', body: JSON.stringify({ message: `관리 기능 설치: ${f}`, content: Buffer.from(text, 'utf8').toString('base64'), branch, ...(cur.ok && cur.data && cur.data.sha ? { sha: cur.data.sha } : {}) }) });
    if (!put.ok) return { error: put.status === 403 || put.status === 404 ? '관리 기능(자동 작업 파일)을 설치하지 못했습니다. 접근 키의 권한에 "Contents"와 "Workflows"를 Read and write로 추가해 주세요. (사이트 설정 화면의 접근 키 만들기 버튼으로 새로 만들면 미리 채워져 있습니다)' : why(put.status, put.data, '관리 기능을 설치하지 못했습니다') };
    added++;
  }
  return { added };
}
// 작업 실행 (작업 파일이 없으면 설치 후 다시 시도)
async function dispatch(file, inputs) {
  const body = JSON.stringify(inputs ? { ref: 'main', inputs } : { ref: 'main' });
  let r = await gh(`/actions/workflows/${file}/dispatches`, { method: 'POST', body });
  if (r.status !== 404) return r;
  const ins = await installWorkflows();
  if (ins.error) return { ok: false, status: 412, error: ins.error };
  for (let i = 0; i < 8; i++) { // 새로 설치한 작업이 GitHub에 등록될 때까지 잠깐 기다림
    await sleep(2500);
    r = await gh(`/actions/workflows/${file}/dispatches`, { method: 'POST', body });
    if (r.status !== 404) return r;
  }
  return r;
}
function fail(res, r, what) { return res.status(r.status === 412 ? 412 : 502).json({ error: r.error || why(r.status, r.data, what) }); }

function why(status, data, what) {
  const m = data && data.message ? ` — GitHub: ${data.message}` : '';
  if (status === 401) return `${what}: GitHub 접근 키가 올바르지 않거나 만료되었습니다 (401)${m}`;
  if (status === 403) return `${what}: 접근 키 권한이 부족합니다. Actions · Contents · Workflows를 모두 Read and write로 해 주세요 (403)${m}`;
  if (status === 404) return `${what}: 저장소나 작업 파일을 찾지 못했습니다. 접근 키를 만들 때 ${repoName().split('/')[1]} 저장소를 선택했는지 확인하세요 (404)${m}`;
  return `${what} (HTTP ${status})${m}`;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST 요청만 받습니다.' });
    let body0 = req.body;
    if (typeof body0 === 'string') { try { body0 = JSON.parse(body0); } catch (e) { body0 = {}; } }
    // 처음 설정 화면용: 무엇이 준비되었는지만 알려 줌 (비밀 값은 절대 내보내지 않음)
    if (body0 && body0.action === 'info') {
      const [owner, slug] = repoName().split('/');
      // Vercel 팀 이름: 배포 주소(프로젝트-해시9자리-팀.vercel.app)에서 찾아냄 → 설정 화면 바로 가기 링크용
      const vurl = env('VERCEL_URL'), team = (vurl.match(/-[a-z0-9]{9}-([a-z0-9-]+)\.vercel\.app$/) || [])[1] || '';
      return res.status(200).json({ ok: true, owner, repo: slug, hasPassword: !!env('ADMIN_PASSWORD'), hasToken: !!env('GITHUB_TOKEN'), connected: !!(env('VERCEL_GIT_REPO_OWNER') || env('GITHUB_REPO')), vercelTeam: team, vercelProject: env('VERCEL_PROJECT_NAME') || slug || '', vercelUrl: vurl });
    }
    const missing = ['ADMIN_PASSWORD', 'GITHUB_TOKEN'].filter(k => !env(k));
    if (missing.length) return res.status(500).json({ error: `Vercel 환경 변수 ${missing.join(', ')} 가(이) 설정되지 않았습니다. 설정 후 Redeploy 해 주세요.` });

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};
    if (!same(String(body.password || '').trim(), env('ADMIN_PASSWORD'))) {
      await new Promise(r => setTimeout(r, 800)); // 비밀번호 마구 넣어 보기 방지
      return res.status(401).json({ error: '관리자 비밀번호가 맞지 않습니다.' });
    }
    // (비밀번호가 맞은 관리자에게만 설정 문제를 알려 줌)
    const tp = tokenProblem(cleanToken(process.env.GITHUB_TOKEN));
    if (tp) return res.status(500).json({ error: tp });

    const WORKFLOW = WORKFLOWS[body.job] || WORKFLOWS.images;
    if (body.action === 'settings') {
      const sec = Math.max(30, Math.min(3600, parseInt(body.seconds, 10) || 120));
      const inputs = { autosync: body.autoSync ? 'true' : 'false', seconds: String(sec) };
      const r = await dispatch(WORKFLOWS.settings, inputs);
      if (!r.ok) return fail(res, r, '설정 변경 작업을 시작하지 못했습니다');
      return res.status(200).json({ ok: true, startedAt: new Date().toISOString(), inputs });
    }
    if (body.action === 'config') {
      const c = body.config || {}, out = {};
      const BAD = new RegExp('["\'`<>\\\\\\r\\n]', 'g'); // 따옴표·꺾쇠·역슬래시·줄바꿈 제거
      for (const k of ['title', 'line1', 'line2', 'subtitle', 'school', 'period', 'sheetId', 'sheetGid']) if (c[k] !== undefined) out[k] = String(c[k]).replace(BAD, '').slice(0, 100);
      const HOOK = /^https:\/\/script\.google\.com\/(macros|a\/macros\/[A-Za-z0-9.-]+)\/s\/[A-Za-z0-9_-]+\/exec$/;
      if (c.hook !== undefined) { const h = String(c.hook).trim(); if (h && (h.length > 300 || !HOOK.test(h))) return res.status(400).json({ error: '웹 앱 주소 형식이 올바르지 않습니다.' }); out.hook = h; }
      const logo = String(body.logo || '');
      if (logo && logo !== 'remove' && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(logo)) return res.status(400).json({ error: '로고 그림 형식이 올바르지 않습니다.' });
      if (logo.length > 60000) return res.status(400).json({ error: '로고 그림이 너무 큽니다. 더 작은 그림을 골라 주세요.' });
      const r = await dispatch(WORKFLOWS.config, { settings: JSON.stringify(out), logo });
      if (!r.ok) return fail(res, r, '설정 저장 작업을 시작하지 못했습니다');
      return res.status(200).json({ ok: true, startedAt: new Date().toISOString() });
    }
    if (body.action === 'words') {
      const clip = v => String(v || '').replace(/["'`\\<>]/g, '').slice(0, 1000);
      const inputs = { add_words: clip(body.addWords), add_allow: clip(body.addAllow), remove: clip(body.remove) };
      if (!inputs.add_words && !inputs.add_allow && !inputs.remove) return res.status(400).json({ error: '추가하거나 지울 단어를 입력해 주세요.' });
      const r = await dispatch(WORKFLOWS.words, inputs);
      if (!r.ok) return fail(res, r, '비속어 목록 작업을 시작하지 못했습니다');
      return res.status(200).json({ ok: true, startedAt: new Date().toISOString() });
    }
    if (body.action === 'run') {
      const r = await dispatch(WORKFLOW);
      if (!r.ok) return fail(res, r, 'GitHub 작업을 시작하지 못했습니다');
      return res.status(200).json({ ok: true, startedAt: new Date().toISOString() });
    }

    const r = await gh(`/actions/workflows/${WORKFLOW}/runs?per_page=1`);
    if (r.status === 404) return res.status(200).json({ ok: true, run: null }); // 아직 작업 파일이 설치되지 않음
    if (!r.ok) return res.status(502).json({ error: why(r.status, r.data, 'GitHub 상태를 읽지 못했습니다') });
    const run = r.data && r.data.workflow_runs && r.data.workflow_runs[0];
    return res.status(200).json({
      ok: true,
      run: run ? { status: run.status, conclusion: run.conclusion, createdAt: run.created_at, updatedAt: run.updated_at, url: run.html_url } : null
    });
  } catch (e) {
    // 어떤 오류든 화면에 원인이 보이도록 (접근 키 값은 절대 내보내지 않음)
    return res.status(500).json({ error: '서버 기능 오류: ' + String(e && e.message || e).replace(/gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+/g, '***') });
  }
};
