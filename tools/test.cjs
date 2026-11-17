// 키트 시험:  node tools/test.cjs
// 1) 두 판의 공통 파일이 같은가  2) 예시 데이터 점검  3) AI 답 읽기(글 → 데이터)  4) 예시 게임을 끝까지 자동 실행
// 5) 만들기 도우미: 붙여 넣기 → 점검 → 내보내기 → 내보낸 파일 실행.  4, 5는 Playwright가 있을 때만 한다.
const path = require('node:path'), fs = require('node:fs'), vm = require('node:vm'), os = require('node:os');
const { execFileSync } = require('node:child_process');
const kit = path.resolve(__dirname, '..');
let fail = 0;
const ok = (c, m) => { console.log((c ? '  통과  ' : '  실패  ') + m); if (!c) fail++; };
const loadData = (dir) => {
  const ctx = { window: {} }; ctx.window.DATA = {}; vm.createContext(ctx);
  const text = ['settings.js', 'story1.js'].map((f) => fs.readFileSync(path.join(dir, 'my-game', f), 'utf8')).join('\n');
  vm.runInContext('var DATA = window.DATA;' + text, ctx);
  return { text, data: JSON.parse(JSON.stringify(ctx.window.DATA)) };
};

(async () => {
  console.log('두 판 맞춤');
  try { execFileSync('node', [path.join(kit, 'tools/sync.mjs'), '--check'], { stdio: 'pipe' }); ok(true, '공통 파일이 같다'); } catch (e) { ok(false, '공통 파일이 다르다 → node tools/sync.mjs'); }

  globalThis.KIT_DEFAULTS = require(path.join(kit, 'general/engine/js/defaults.js'));
  const check = require(path.join(kit, 'general/engine/js/check.js'));
  const { parse, stringify } = require(path.join(kit, 'general/engine/js/parse.js'));
  for (const ed of ['general', 'history']) {
    console.log(ed + ': 데이터');
    const { text, data } = loadData(path.join(kit, ed));
    const issues = check(data).filter((i) => i.수준 !== '참고');
    ok(!issues.length, '예시 데이터에 오류와 주의가 없다' + (issues.length ? ' → ' + issues[0].곳 + ': ' + issues[0].글 : ''));
    const r = parse('네, 만들었어요!\n```js\n' + text + '\n```\n확인해 보세요.');
    ok(!r.errors.length && JSON.stringify(r.data) === JSON.stringify(data), '채팅에서 복사한 글을 읽으면 같은 데이터가 된다');
    ok(JSON.stringify(parse(stringify(data).all).data) === JSON.stringify(data), '데이터를 글로 바꿨다가 다시 읽어도 같다');
    const cut = parse(text.slice(0, Math.floor(text.length * 0.6)));
    ok(cut.errors.length === 1 && /끊긴/.test(cut.errors[0].도움), '끊긴 글은 끊겼다고 알려 준다');
    const bad = JSON.parse(JSON.stringify(data));
    bad.ep1.막[0].내용.push({ 대사: '말하는 사람이 없는 대사' }, { 말: '없는사람', 대사: '안녕' }, { 표정: '미소', 말: Object.keys(data.게임.인물)[1], 대사: '순서가 바뀐 명령' }, { 증거획득: 'no_such' });
    const bi = check(bad);
    ok(bi.some((i) => i.수준 === '오류' && /no_such/.test(i.글)) && bi.some((i) => /말하는 사람이 없/.test(i.도움)) && bi.some((i) => /없는사람/.test(i.글)) && !bi.some((i) => /모르는 명령이에요: '표정'/.test(i.글)), '틀린 데이터의 문제를 찾아낸다');
    // 이름바꾸기: 모든 인물 이름을 바꿔도 점검을 통과하고, 옛 이름이 대사에 남지 않는다
    const renamed = JSON.parse(JSON.stringify(data)), people = Object.keys(renamed.게임.인물);
    renamed.게임.이름바꾸기 = Object.fromEntries(people.map((n, i) => [n, ['가람', '나윤', '다솔', '라온', '마루', '바다', '사랑', '아라', '자람', '하랑', '한결', '보람'][i] || n + '새']));
    const renIssues = check(JSON.parse(JSON.stringify(renamed))).filter((i) => i.수준 !== '참고');
    globalThis.KIT_DEFAULTS.renameData(renamed);
    const left = [];
    const scan = (v) => { if (typeof v === 'string') { for (const n of people) if (new RegExp('(^|[^가-힣])' + n + '(?![가-힣]*색)').test(v) && !/^(characters|backgrounds|evidence)\//.test(v)) left.push(n + ': ' + v.slice(0, 40)); } else if (v && typeof v === 'object') Object.values(v).forEach(scan); };
    scan(Object.fromEntries(Object.entries(renamed).filter(([k]) => k !== '게임')));
    ok(!renIssues.length && !renamed.게임.이름바꾸기 && !people.some((n) => renamed.게임.인물[n]) && !left.length, '이름바꾸기로 인물 ' + people.length + '명의 이름을 모두 바꿀 수 있다' + (renIssues.length ? ' → ' + renIssues[0].글 : left.length ? ' → 남은 이름 ' + left[0] : ''));
    const guide = fs.readFileSync(path.join(kit, ed, 'ai/guide.js'), 'utf8');
    ok(guide.includes(JSON.stringify(fs.readFileSync(path.join(kit, ed, 'ai/AI_지침.md'), 'utf8')).slice(1, 200)), 'ai/guide.js 가 지금 지침으로 만들어져 있다');
  }

  console.log('이름바꾸기: 조사 맞추기');
  const R = (t, m) => globalThis.KIT_DEFAULTS.renameText(t, m);
  const cases = [
    ['지우야, 큰일이야!', { 지우: '신중한' }, '신중한아, 큰일이야!'], ['한결이가 하늘이의 잘못이라고', { 한결: '레테', 하늘: '민서' }, '레테가 민서의 잘못이라고'],
    ['신중한은 레테를 보았다', { 신중한: '지우', 레테: '한결' }, '지우는 한결을 보았다'], ['**하늘**이지.', { 하늘: '민서' }, '**민서**지.'],
    ['하늘색 후드티', { 하늘: '민서' }, '하늘색 후드티'], ['글씨를 지우고', { 지우: '신중한' }, '글씨를 지우고'], ['한나랑 같이', { 한나: '도윤' }, '도윤이랑 같이'],
  ];
  const bad = cases.filter(([t, m, want]) => R(t, m) !== want);
  ok(!bad.length, '조사(은/는, 이/가, 아/야, 이랑/랑 …)를 새 이름에 맞춘다' + (bad.length ? ' → ' + bad[0][0] + ' → ' + R(bad[0][0], bad[0][1]) : ''));

  let chromium;
  try { ({ chromium } = require('playwright')); } catch (e) { console.log('Playwright가 없어서 브라우저 시험은 건너뜁니다.'); }
  if (chromium) {
    const b = await chromium.launch();
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-test-'));
    for (const ed of ['general', 'history']) {
      console.log(ed + ': 브라우저');
      const dir = path.join(kit, ed);
      const ctx = await b.newContext({ viewport: { width: 1100, height: 800 }, acceptDownloads: true });
      const errs = [];
      const watch = (p) => p.on('pageerror', (e) => errs.push(e.message));
      const g = await ctx.newPage(); watch(g);
      await g.goto('file://' + path.join(dir, 'index.html') + '?auto');
      const res = await g.waitForFunction(() => window.KIT_AUTO_RESULT, null, { timeout: 60000 }).then((h) => h.jsonValue()).catch(() => null);
      ok(res && res.ok, '예시 게임이 끝까지 자동 실행된다' + (res && !res.ok ? ' → ' + JSON.stringify(res.문제[0]) : ''));
      const t = await ctx.newPage(); watch(t);
      await t.goto('file://' + path.join(dir, 'index.html'));
      await t.waitForSelector('.title-screen .menu button', { timeout: 30000 }).catch(() => {});
      const menu = await t.$$eval('.title-screen .menu button', (bs) => bs.map((b) => b.textContent));
      ok(menu.length >= 2 && !menu.some((x) => /만 하기/.test(x)), '처음 화면에 [시작하기] [이어하기]만 있다 (' + menu.join(', ') + ')');
      await t.close();
      const m = await ctx.newPage(); watch(m);
      await m.goto('file://' + path.join(dir, 'maker.html'));
      ok(await m.isVisible('#guide'), '만들기 도우미를 처음 열면 사용법이 나온다');
      ok(/court-game-kit\/index\.html$|\/index\.html$/.test(await m.evaluate(() => document.querySelector('#home').href)) || dir.indexOf('court-game-kit') < 0, '「만들기 도우미」를 누르면 키트 첫 화면으로 간다');
      await m.click('#btn-start'); await m.click('#btn-example');
      // 설계서: 칸마다 AI에게 물어볼 글 (수업 정보와 선생님 메모가 들어간다), AI 답 다듬기
      const ask = await m.evaluate(() => {
        const K = window.KIT_MAKER, f = K.fields.find((x) => x.물어보기);
        return { n: K.fields.filter((x) => x.물어보기).length, tools: document.querySelectorAll('.ask-tools').length, p: K.fieldPrompt(f), memo: String(K.S.form[f.id] || '').split('\n')[0], ctx: String(K.S.form[K.fields[0].id]),
          clean: K.cleanAnswer('네, 여기 있어요!\n\n1. **첫째** 내용\n2. 둘째 내용\n* 셋째\n\n도움이 되었길 바라요.', false) };
      });
      ok(ask.n > 0 && ask.tools === ask.n && ask.p.includes(ask.ctx) && ask.p.includes(ask.memo) && ask.clean === '- 첫째 내용\n- 둘째 내용\n- 셋째', '설계서: 칸 ' + ask.n + '개마다 AI에게 물어볼 글을 만들고, AI의 답을 목록으로 다듬는다');
      const subs = await m.locator('#form .fpage').count();
      for (let i = 0; i < subs; i++) await m.click('#btn-next');
      ok(await m.isVisible('#s2'), '[다음]으로 설계서 ' + subs + '쪽을 넘기면 2단계(AI에게 주기)가 된다');
      const prompt = await m.inputValue('#prompt');
      ok(/AI 지침/.test(prompt) && /데이터 형식/.test(prompt) && /수업 설계서/.test(prompt) && /사실 검증표/.test(prompt) && (ed !== 'history' || (/역사 수업용 추가 지침/.test(prompt) && /역사적 사실 검증/.test(prompt) && (await m.getAttribute('#opt-check', 'aria-disabled')) === 'true' && await m.isChecked('#opt-check'))), '만들기 도우미가 AI에게 줄 글을 만든다 (' + prompt.length + '자)');
      await m.click('#btn-next');
      await m.fill('#paste', loadData(dir).text);
      await m.click('#btn-check');
      await m.waitForFunction(() => /끝까지 실행됐어요|실행 중 문제|읽지 못했어요/.test(document.querySelector('#result').textContent), null, { timeout: 60000 }).catch(() => {});
      ok(/끝까지 실행됐어요/.test(await m.textContent('#result')), '만들기 도우미의 점검과 자동 실행을 통과한다');
      // 4단계: 그림 칸마다 그림 AI에 줄 글, 단색 배경 지우기
      await m.click('#steps [data-go="4"]');
      const img = await m.evaluate(() => {
        const K = window.KIT_MAKER, sl = K.imageSlots(), first = sl.chars[0], next = sl.chars.find((c) => !c.first);
        const c = document.createElement('canvas'); c.width = 200; c.height = 200;
        const x = c.getContext('2d'); x.fillStyle = '#ff00ff'; x.fillRect(0, 0, 200, 200); x.fillStyle = '#3366aa'; x.fillRect(60, 40, 80, 160);
        const cut = K.cutFlatBackground(c), px = (a, b) => x.getImageData(a, b, 1, 1).data[3];
        return { slots: document.querySelectorAll('#images .slot').length, buttons: [...document.querySelectorAll('#images .slot button')].filter((b) => b.textContent === '프롬프트').length,
          p1: K.promptFor(first), p2: next ? K.promptFor(next) : '앞에서 그린', style: document.querySelector('#img-style').value, cut, corner: px(5, 5), body: px(100, 100) };
      });
      ok(img.slots > 0 && img.buttons === img.slots && img.p1.includes(img.style) && img.p1.includes('정사각형') && /앞에서 그린/.test(img.p2), '4단계: 그림 칸 ' + img.slots + '개마다 그림 AI에 줄 글이 있다');
      ok(img.cut && img.corner === 0 && img.body === 255, '4단계: 인물 그림의 단색 배경을 지운다');
      await m.click('#steps [data-go="5"]');
      const [dl] = await Promise.all([m.waitForEvent('download'), m.click('#btn-export')]);
      const file = path.join(tmp, ed + '.html');
      await dl.saveAs(file);
      const x = await ctx.newPage(); watch(x);
      await x.goto('file://' + file + '#auto');
      const res2 = await x.waitForFunction(() => window.KIT_AUTO_RESULT, null, { timeout: 60000 }).then((h) => h.jsonValue()).catch(() => null);
      ok(res2 && res2.ok, '내보낸 게임 파일 하나(' + Math.round(fs.statSync(file).size / 1024) + 'KB)가 끝까지 실행된다');
      ok(!errs.length, '화면 오류가 없다' + (errs.length ? ' → ' + errs[0] : ''));
      await ctx.close();
    }
    // 역사판: 기본 예시(원작 제1화)의 그림이 모두 있는가, 짧은 예시를 ?game= 으로 열어 끝까지 실행
    console.log('history: 원작 제1화 그림, 짧은 예시');
    const e = await b.newPage();
    const eerrs = []; e.on('pageerror', (x) => eerrs.push(x.message));
    await e.goto('file://' + path.join(kit, 'history/index.html') + '?auto');
    await e.waitForFunction(() => window.KIT_AUTO_RESULT, null, { timeout: 90000 }).catch(() => {});
    const miss = await e.evaluate(() => [...G.missing].filter((k) => !/^evidence\/(mobilization_law|hashima_photo)$/.test(k)));
    ok(!miss.length, '원작 제1화의 그림이 모두 있다' + (miss.length ? ' → 없음: ' + miss.join(', ') : ''));
    const ex = 'examples/daedong-map';
    const exIssues = (() => { const ctx = { window: {} }; ctx.window.DATA = {}; vm.createContext(ctx); for (const f of ['settings.js', 'story1.js']) vm.runInContext('var DATA = window.DATA;' + fs.readFileSync(path.join(kit, 'history', ex, f), 'utf8'), ctx); return check(JSON.parse(JSON.stringify(ctx.window.DATA))).filter((i) => i.수준 !== '참고'); })();
    ok(!exIssues.length, '짧은 예시 데이터에 오류와 주의가 없다' + (exIssues.length ? ' → ' + exIssues[0].글 : ''));
    await e.goto('file://' + path.join(kit, 'history/index.html') + '?game=' + ex + '&auto');
    const res3 = await e.waitForFunction(() => window.KIT_AUTO_RESULT, null, { timeout: 90000 }).then((h) => h.jsonValue()).catch(() => null);
    ok(res3 && res3.ok && !eerrs.length, '짧은 예시가 끝까지 자동 실행된다' + (res3 && !res3.ok ? ' → ' + JSON.stringify(res3.문제[0]) : ''));
    await b.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log(fail ? '\n실패 ' + fail + '개' : '\n모두 통과');
  process.exit(fail ? 1 : 0);
})();
