// 법정 추리 수업 게임 키트 · 원작 「기억의 법정」 (c) BONSSAM · CC BY-NC-SA 4.0 (이용_안내.md)
// 기본 도구: 설정 읽기, 그림 불러오기(없으면 자리 그림), 소리, 저장
// 이 폴더(engine/)는 고치지 않아도 된다. 내 게임은 my-game/ 폴더의 파일만 고치면 된다.
(function () {
  const G = (window.G = window.G || {});
  window.DATA = window.DATA || {};

  // 이 엔진은 「기억의 법정」(BONSSAM)의 엔진을 바탕으로 만들었다. 이용 조건: CC BY-NC-SA 4.0 (이용_안내.md)
  // 이 표시는 게임의 설정 화면 아래에 작게 나온다. 지우지 않는다 (출처 표시).
  G.KIT = { 이름: '법정 추리 수업 게임 키트', 판: '1.0.0', 원작: '「기억의 법정」 BONSSAM', 조건: 'CC BY-NC-SA 4.0' };

  G.$ = (s, r = document) => r.querySelector(s);
  G.h = (tag, attrs = {}, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'style') e.style.cssText = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      e.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return e;
  };
  G.sleep = (ms) => new Promise((r) => setTimeout(r, G.fast ? Math.min(ms, 30) : ms));
  G.nextFrame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  G.list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  G.esc = esc;

  // ─────────── 기본값 (engine/js/defaults.js) ───────────
  const { EXPR, EXPR_EMOJI, SEATS, KINDS, THEMES, FONTS, FONT_FILES, TITLE_FONTS, TITLE_FONT_FILES, SOUNDS } = window.KIT_DEFAULTS;
  G.cmdKey = window.KIT_DEFAULTS.cmdKey;

  // ─────────── 설정 읽기 ───────────
  // my-game/settings.js 의 DATA.게임 을 읽어 기본값과 합친다. 빠진 칸은 기본값으로 채운다.
  function hex(c) { const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(c || '').trim()); if (!m) return null; let s = m[1]; if (s.length === 3) s = s.replace(/./g, '$&$&'); return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16)); }
  function mix(a, b, t) { const A = hex(a) || [19, 34, 74], B = hex(b) || [0, 0, 0]; return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); }
  G.mix = mix;

  G.setup = () => {
    KIT_DEFAULTS.renameData(DATA); // 설정의 이름바꾸기: 모든 글에서 인물 이름을 바꾼다
    const g = DATA.게임 || {};
    const merge2 = (base, add) => { const o = {}; for (const k of Object.keys(base)) o[k] = Object.assign({}, base[k]); for (const [k, v] of Object.entries(add || {})) o[k] = Object.assign({}, o[k] || {}, typeof v === 'string' ? { 이름: v } : v); return o; };
    const C = (G.cfg = {
      제목: g.제목 || '나의 법정 추리 게임', 부제: g.부제 || '', 만든이: g.만든이 || '', 아이디: g.아이디 || '',
      주인공: g.주인공 || null, 조수: g.조수 || null,
      외침: Object.assign({ 추궁: '잠깐만요!', 제시: '반박합니다!' }, g.외침),
      버튼: Object.assign({ 추궁: '더 묻기', 제시: '증거 제시', 기록: '사건 기록', 이동: '장소 이동', 자세히: '자세히 보기' }, g.버튼),
      말: Object.assign({ 증언시작: '증언 시작', 재판연기: '재판 연기', 힌트: '힌트', 알아두기: '알아두기', 새기록: '새 기록!', 갱신: '기록 갱신!', 기록제목: '사건 기록', 제시제목: '제시할 증거를 고르세요' }, g.말),
      신뢰도: Object.assign({ 칸: 5, 이름: '신뢰도', 아이콘: '' }, g.신뢰도),
      기록종류: merge2(KINDS, g.기록종류),
      표정: Object.assign({}, EXPR, DATA.표정, g.표정),
      인물: Object.fromEntries(Object.entries(Object.assign({}, DATA.인물, g.인물)).map(([n, c]) => [n, Object.assign({}, c)])),
      배경: Object.assign({ '검은 화면': { 그림: null } }, DATA.배경, g.배경),
      법정자리: merge2(SEATS, Object.assign({}, DATA.법정자리, g.법정자리)),
      소리: {
        BGM: Object.assign({}, SOUNDS.BGM, (DATA.소리 || {}).BGM, (g.소리 || {}).BGM),
        효과음: Object.assign({}, SOUNDS.효과음, (DATA.소리 || {}).효과음, (g.소리 || {}).효과음),
        꾸밈음량: Object.assign({}, SOUNDS.꾸밈음량, (DATA.소리 || {}).꾸밈음량, (g.소리 || {}).꾸밈음량),
      },
      저장주소: g.저장주소 || (DATA.설정 || {}).GAS주소 || '',
      학생정보: g.학생정보 || ['반', '번호', '이름'],
      자리그림: ['실루엣', '이모지'].includes(g.자리그림) ? g.자리그림 : '얼굴', // 그림이 없을 때 인물: '얼굴'(단순한 그림 얼굴) | '실루엣'(차분한 그림자) | '이모지'(이모지 얼굴)
      화선택: g.화선택 || '자유', // '자유': 처음 화면에서 화를 고른다 / '코드': 선생님이 알려 준 코드를 넣는다 / '순서': 앞 화를 끝내야 다음 화
      처음화면그림: g.처음화면그림 || null,
      제목그림: typeof g.제목그림 === 'string' ? g.제목그림 : null, // 처음 화면에 글자 제목 대신 띄울 그림
    });
    for (const [n, c] of Object.entries(C.인물)) { if (!c.자리) c.자리 = '증언대'; if (!c.파일) c.파일 = 'char_' + n; }
    for (const k of Object.keys(C.배경)) if (typeof C.배경[k] === 'string') C.배경[k] = { 그림: C.배경[k] };
    // 테마: 이름 또는 { 바탕, 포인트, 글꼴 }
    const t = typeof g.테마 === 'string' ? { 이름: g.테마 } : g.테마 || {};
    const preset = THEMES[t.이름] || THEMES['남색금빛'];
    const base = hex(t.바탕) ? t.바탕 : preset[0], point = hex(t.포인트) ? t.포인트 : preset[1];
    C.테마색 = { 바탕: base, 포인트: point };
    const root = document.documentElement.style;
    root.setProperty('--navy', mix(base, '#ffffff', 0.06));
    root.setProperty('--navy-deep', mix(base, '#000000', 0.45));
    root.setProperty('--navy-black', mix(base, '#000000', 0.78));
    root.setProperty('--gold', point);
    root.setProperty('--gold-light', mix(point, '#ffffff', 0.55));
    root.setProperty('--gold-dark', mix(point, '#000000', 0.45));
    root.setProperty('--on-gold', mix(base, '#000000', 0.6));
    const font = FONTS[t.글꼴] ? t.글꼴 : FONTS[g.글꼴] ? g.글꼴 : '고딕'; // 대사 글꼴. 적지 않으면 고딕(페이퍼로지)
    const tf = [t.제목글꼴, g.제목글꼴].find((k) => TITLE_FONTS[k] || FONTS[k]) || '클래식'; // 제목 글꼴
    root.setProperty('--font', FONTS[font]);
    root.setProperty('--title-font', TITLE_FONTS[tf] || FONTS[tf]);
    // 글꼴 파일은 인터넷에서 받는다 (기다리지 않고 받는 대로 바뀐다. 못 받으면 기기 글꼴)
    const loads = [];
    for (const href of [FONT_FILES[font], TITLE_FONT_FILES[tf] || FONT_FILES[tf]]) {
      if (!href || [...document.querySelectorAll('link[data-kit-font]')].some((l) => l.href === href)) continue;
      const link = document.createElement('link');
      link.rel = 'stylesheet'; link.href = href; link.setAttribute('data-kit-font', '');
      loads.push(new Promise((ok) => { link.onload = link.onerror = ok; }));
      document.head.append(link);
    }
    // 글꼴 목록(CSS)을 받을 때까지 (인터넷이 없으면 곧 끝난다. 길어도 2.5초)
    G.fontsReady = Promise.race([Promise.all(loads), new Promise((ok) => setTimeout(ok, 2500))]);
    for (const [k, v] of Object.entries(C.기록종류)) root.setProperty('--k-' + G.kindKey(k), v.색 || '#e8b84a');
    document.title = C.제목;
    STORE = 'kit-' + (C.아이디 || C.제목).replace(/\s+/g, '_');
    try { Object.assign(G.settings, JSON.parse(localStorage.getItem(STORE + '-settings') || '{}')); } catch (e) {}
    return C;
  };
  // 기록 종류 이름 → css 에 쓸 수 있는 글자 (빨강 → red …)
  const KIND_KEYS = { 빨강: 'red', 파랑: 'blue', 초록: 'green', 노랑: 'yellow', 보라: 'purple', 개념: 'concept' };
  G.kindKey = (k) => KIND_KEYS[k] || 'x' + Array.from(String(k)).map((c) => c.codePointAt(0).toString(36)).join('');
  G.kindOf = (ev) => { const K = G.cfg.기록종류; return K[ev && ev.색] ? ev.색 : '파랑'; };
  G.kind = (ev) => G.cfg.기록종류[G.kindOf(ev)];

  // 모든 화 (my-game/story1.js … 의 DATA.ep1 …): 번호 순서
  G.episodes = () => Object.values(DATA).filter((d) => d && Array.isArray(d.막) && d.번호 != null).sort((a, b) => a.번호 - b.번호);

  // ─────────── 글 꾸미기 ───────────
  // **강조** 는 굵게, 🟥🟦🟩🟨🟪 는 작은 색 네모로 (기기 글꼴에 따라 깨지지 않게)
  const GEM = { '🟥': '빨강', '🟦': '파랑', '🟩': '초록', '🟨': '노랑', '🟪': '보라' };
  G.GEM = GEM;
  G.gemHtml = (ch, more = '') => '<span class="gem' + more + '" style="background:var(--k-' + G.kindKey(GEM[ch]) + ')"></span>';
  G.mdBold = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/🟥|🟦|🟩|🟨|🟪/gu, (m) => G.gemHtml(m));

  // ─────────── 그림 ───────────
  // key 예: 'characters/detective_smile'. 한 파일 게임은 파일 안의 그림(EMBED_IMG)을, 폴더 게임은 my-game/images/ 를 쓴다.
  // 그림이 없으면 자리 그림(이모지 얼굴, 색 배경)을 대신 띄운다. 나중에 그림 파일을 넣으면 코드를 고치지 않아도 바뀐다.
  G.imgBase = 'my-game/images/';
  const imgCache = {};
  G.missing = new Set();
  function findImg(key) {
    if (imgCache[key]) return imgCache[key];
    const E = window.EMBED_IMG;
    if (E && E[key]) return (imgCache[key] = Promise.resolve(E[key]));
    if (window.KIT_SINGLE) return (imgCache[key] = Promise.resolve(null)); // 한 파일 게임: 밖에서 찾지 않는다
    imgCache[key] = new Promise((resolve) => {
      const tries = ['.webp', '.png', '.jpg', '.svg'].map((x) => G.imgBase + key + x);
      const next = () => {
        const url = tries.shift();
        if (!url) { resolve(null); return; }
        const im = new Image();
        im.onload = () => resolve(url);
        im.onerror = next;
        im.src = url;
      };
      next();
    });
    return imgCache[key];
  }
  G.loadImg = async (key) => {
    if (!key || typeof key !== 'string') return '';
    const url = await findImg(key);
    if (url) return url;
    // 인물 그림: 그 표정 그림이 없으면 기본 표정 그림을 쓴다
    const m = /^characters\/(.+)_([a-z0-9_]+)$/i.exec(key);
    if (m && m[2] !== 'default') {
      const who = Object.values(G.cfg.인물).find((c) => key.startsWith('characters/' + c.파일 + '_'));
      if (who) { const d = await findImg('characters/' + who.파일 + '_default'); if (d) return d; }
    }
    G.missing.add(key);
    return (await placeholderWithText(key)) || G.placeholder(key);
  };

  // ─────────── 자리 그림 (그림이 없을 때) ───────────
  // 그림 파일이 없으면 코드로 그린 그림을 쓴다: 인물(단순한 그림 얼굴), 법정, 장소, 증거 카드.
  // 테마 색(바탕, 포인트)을 따라가서 게임마다 색이 맞는다.
  const svgUrl = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  // 그림(SVG) 속 글자는 웹 글꼴을 쓸 수 없어서 기기의 고딕으로 쓴다. 장소 이름 팻말은 그림 밖(화면 글자)으로 띄운다
  const FONT = 'font-family="Apple SD Gothic Neo, Malgun Gothic, Noto Sans KR, sans-serif"';
  const EMOJI = 'font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif"';
  const INK = '#2a2230', LINE = 'rgba(20,16,28,.55)';
  const hashOf = (s) => { let x = 7; for (const ch of String(s)) x = (x * 31 + ch.codePointAt(0)) >>> 0; return x; };
  const pickBy = (list, s, salt) => list[hashOf(salt + s) % list.length];
  function hslHex(h, s, l) { s /= 100; l /= 100; const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)); return '#' + [f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join(''); }
  const nameColor = (name) => hslHex(hashOf(name) % 360, 38, 40);
  const themeColors = () => { const t = (G.cfg && G.cfg.테마색) || {}; return { base: hex(t.바탕) ? t.바탕 : '#13224a', point: hex(t.포인트) ? t.포인트 : '#e8b84a' }; };

  // 인물: 표정마다 눈, 눈썹, 입, 덧붙임
  const FACE = {
    default: ['dot', 'soft', 'smile'], smile: ['happy', 'soft', 'grin'], surprised: ['wide', 'up', 'o'], think: ['side', 'one', 'hmm'],
    flustered: ['wide', 'worry', 'wave', 'blush sweat'], serious: ['dot', 'low', 'flat'], sad: ['down', 'worry', 'frown', 'tear'],
    angry: ['dot', 'angry', 'shout'], confident: ['half', 'up', 'smirk'], determined: ['dot', 'angry', 'tight'], worried: ['dot', 'worry', 'frownS'],
    relieved: ['closed', 'worry', 'smile'], smirk: ['half', 'one', 'smirk'], scared: ['wide', 'worry', 'waveO', 'sweat'], stern: ['half', 'low', 'flat'],
    grateful: ['happy', 'worry', 'smile', 'blush tear'], awkward: ['dot', 'worry', 'waveS', 'sweat'], sorry: ['closed', 'worry', 'frownS'],
    blank: ['dot', 'none', 'flat'], tired: ['half', 'worry', 'open'],
  };
  function drawFace(expr) {
    const [eye, brow, mouth, extra = ''] = FACE[expr] || FACE.default;
    const L = 458, R = 566, Y = 338, M = 424, out = [];
    const st = (w) => `fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
    const brows = {
      soft: [`M${L - 30} 286 Q${L} 274 ${L + 28} 284`, `M${R - 28} 284 Q${R} 274 ${R + 30} 286`],
      up: [`M${L - 30} 270 Q${L} 252 ${L + 28} 264`, `M${R - 28} 264 Q${R} 252 ${R + 30} 270`],
      low: [`M${L - 30} 292 L${L + 28} 296`, `M${R - 28} 296 L${R + 30} 292`],
      angry: [`M${L - 30} 280 L${L + 28} 302`, `M${R - 28} 302 L${R + 30} 280`],
      worry: [`M${L - 30} 296 L${L + 26} 276`, `M${R - 26} 276 L${R + 30} 296`],
      one: [`M${L - 30} 290 L${L + 28} 292`, `M${R - 28} 272 Q${R} 254 ${R + 30} 266`],
    }[brow] || [];
    brows.forEach((d) => out.push(`<path d="${d}" ${st(11)}/>`));
    for (const x of [L, R]) out.push({
      dot: `<ellipse cx="${x}" cy="${Y}" rx="13" ry="17" fill="${INK}"/><circle cx="${x + 4}" cy="${Y - 6}" r="4" fill="#fff"/>`,
      happy: `<path d="M${x - 20} ${Y + 6} Q${x} ${Y - 20} ${x + 20} ${Y + 6}" ${st(10)}/>`,
      closed: `<path d="M${x - 20} ${Y - 2} Q${x} ${Y + 16} ${x + 20} ${Y - 2}" ${st(10)}/>`,
      down: `<ellipse cx="${x}" cy="${Y + 4}" rx="12" ry="14" fill="${INK}"/><path d="M${x - 20} ${Y - 10} L${x + 20} ${Y - 6}" ${st(7)}/>`,
      wide: `<circle cx="${x}" cy="${Y}" r="22" fill="#fff" stroke="${INK}" stroke-width="7"/><circle cx="${x}" cy="${Y + 2}" r="8" fill="${INK}"/>`,
      half: `<ellipse cx="${x}" cy="${Y + 4}" rx="13" ry="12" fill="${INK}"/><path d="M${x - 22} ${Y - 4} L${x + 22} ${Y - 4}" ${st(9)}/>`,
      side: `<ellipse cx="${x + 8}" cy="${Y - 2}" rx="12" ry="16" fill="${INK}"/>`,
    }[eye] || '');
    const lip = `fill="#7a2f36" stroke="${INK}" stroke-width="7" stroke-linejoin="round"`;
    out.push({
      smile: `<path d="M486 ${M} Q512 ${M + 18} 538 ${M}" ${st(9)}/>`,
      grin: `<path d="M478 ${M - 6} Q512 ${M - 4} 546 ${M - 6} Q540 ${M + 32} 512 ${M + 32} Q484 ${M + 32} 478 ${M - 6} Z" ${lip}/><path d="M490 ${M + 18} Q512 ${M + 8} 534 ${M + 18}" fill="none" stroke="#e98a8f" stroke-width="7" stroke-linecap="round"/>`,
      o: `<ellipse cx="512" cy="${M + 6}" rx="16" ry="21" ${lip}/>`,
      hmm: `<path d="M494 ${M + 6} L532 ${M}" ${st(9)}/>`,
      wave: `<path d="M482 ${M + 4} q10 -10 20 0 t20 0 t20 0" ${st(8)}/>`,
      waveS: `<path d="M484 ${M} Q512 ${M + 14} 540 ${M - 4}" ${st(8)}/>`,
      waveO: `<path d="M486 ${M + 14} Q512 ${M - 14} 538 ${M + 14} Q512 ${M + 6} 486 ${M + 14} Z" ${lip}/>`,
      flat: `<path d="M490 ${M + 4} L534 ${M + 4}" ${st(9)}/>`,
      tight: `<path d="M494 ${M + 6} L530 ${M + 6}" ${st(11)}/>`,
      frown: `<path d="M486 ${M + 14} Q512 ${M - 6} 538 ${M + 14}" ${st(9)}/>`,
      frownS: `<path d="M492 ${M + 10} Q512 ${M} 532 ${M + 10}" ${st(8)}/>`,
      shout: `<path d="M482 ${M + 20} Q512 ${M - 10} 542 ${M + 20} Z" ${lip}/>`,
      smirk: `<path d="M488 ${M + 6} Q520 ${M + 12} 542 ${M - 8}" ${st(9)}/>`,
      open: `<ellipse cx="512" cy="${M + 6}" rx="14" ry="9" fill="#7a2f36" stroke="${INK}" stroke-width="6"/>`,
    }[mouth] || '');
    if (extra.includes('blush')) out.push(`<ellipse cx="${L - 14}" cy="392" rx="28" ry="13" fill="#ef7f86" opacity=".38"/><ellipse cx="${R + 14}" cy="392" rx="28" ry="13" fill="#ef7f86" opacity=".38"/>`);
    if (extra.includes('tear')) out.push(`<path d="M${R + 4} 360 q-12 26 0 34 q12 -8 0 -34 Z" fill="#8fd0ff" stroke="${INK}" stroke-width="4"/>`);
    if (extra.includes('sweat')) out.push(`<path d="M640 240 q-18 30 0 42 q18 -12 0 -42 Z" fill="#a9e0ff" stroke="${INK}" stroke-width="5"/>`);
    return out.join('');
  }
  // 생김새 글에서 머리 모양, 머리 색, 안경, 수염을 짐작한다 (적혀 있지 않으면 이름으로 정한다)
  function looks(name, desc) {
    const d = String(desc || '');
    const style = /긴\s*머리|긴머리|장발/.test(d) ? 'long' : /단발/.test(d) ? 'bob' : /묶|포니|올림|쪽진|상투/.test(d) ? 'bun' : /넘긴|가르마/.test(d) ? 'side' : /짧은|스포츠|까까/.test(d) ? 'short' : pickBy(['short', 'side', 'bob', 'long', 'bun', 'side'], name, 'h');
    const grey = /흰\s*머리|백발|은발|할머니|할아버지|노인|회색\s*머리/.test(d);
    const hair = grey ? '#c9c4bb' : /갈색|밤색/.test(d) ? '#5b3a24' : /금발|노란\s*머리/.test(d) ? '#c9a24a' : pickBy(['#2a211d', '#33251d', '#1f1c24', '#4a3226', '#2c2626'], name, 'c');
    const skin = pickBy(['#f3d6bd', '#ecc8a8', '#e4b994', '#f6dcc8', '#dcae88'], name, 's');
    return { style, hair, skin, glasses: /안경/.test(d), beard: /수염/.test(d) };
  }
  const HAIR_BACK = {
    long: 'M338 330 C318 150 440 112 512 112 C590 112 706 150 686 330 L704 650 C650 684 600 660 588 610 L436 610 C424 660 374 684 320 650 Z',
    bob: 'M346 330 C326 160 440 120 512 120 C588 120 698 160 678 330 L690 486 C650 508 612 500 596 478 L428 478 C412 500 374 508 334 486 Z',
  };
  const HAIR_FRONT = {
    short: 'M364 334 C344 190 430 136 512 136 C602 136 684 192 660 334 C646 262 604 228 560 220 C520 248 452 250 410 236 C386 260 370 294 364 334 Z',
    side: 'M362 344 C334 180 440 128 522 132 C614 136 694 200 662 344 C652 282 624 242 592 226 C520 210 418 250 362 344 Z',
    bob: 'M366 324 C356 196 440 146 512 146 C592 146 668 196 658 324 C622 262 562 234 512 234 C462 234 402 262 366 324 Z',
    long: 'M364 330 C352 196 440 140 512 140 C592 140 672 196 660 330 C636 274 592 240 540 232 C514 262 452 268 404 258 C384 280 370 304 364 330 Z',
    bun: 'M366 326 C354 196 440 146 512 146 C590 146 670 196 658 326 C632 262 584 232 512 230 C440 232 392 262 366 326 Z',
  };
  const TORSO = 'M168 1024 C176 812 246 648 404 606 L620 606 C778 648 848 812 856 1024 Z';
  const HEAD = 'M374 318 C374 190 440 158 512 158 C584 158 650 190 650 318 C650 420 600 494 512 494 C424 494 374 420 374 318 Z';
  function outfit(kind, color) {
    const dark = mix(color, '#000000', 0.38), shade = mix(color, '#000000', 0.18);
    const base = `<path d="${TORSO}" fill="${kind === 'robe' ? '#1f1e27' : color}" stroke="${LINE}" stroke-width="6"/>`;
    if (kind === 'suit') return base + `<path d="M452 606 L512 780 L572 606 Z" fill="#f4f1ea"/>`
      + `<path d="M498 644 L526 644 L536 770 L512 812 L488 770 Z" fill="${mix(color, '#b8892b', 0.55)}" stroke="${LINE}" stroke-width="4"/>`
      + `<path d="M452 606 L394 622 L474 860 L512 780 Z" fill="${shade}" stroke="${LINE}" stroke-width="5" stroke-linejoin="round"/>`
      + `<path d="M572 606 L630 622 L550 860 L512 780 Z" fill="${shade}" stroke="${LINE}" stroke-width="5" stroke-linejoin="round"/><path d="M512 860 L512 1024" stroke="${dark}" stroke-width="6"/>`;
    if (kind === 'robe') return base + `<path d="M440 606 L512 700 L584 606 Z" fill="#f4f1ea" stroke="${LINE}" stroke-width="4"/>`
      + `<path d="M490 690 L534 690 L530 790 L494 790 Z" fill="#f4f1ea" stroke="${LINE}" stroke-width="4"/>`
      + `<path d="M404 606 C430 720 462 900 470 1024 M620 606 C594 720 562 900 554 1024" fill="none" stroke="#33323f" stroke-width="10"/>`;
    return base + `<path d="M432 608 Q512 690 592 608" fill="none" stroke="${dark}" stroke-width="16" stroke-linecap="round"/>`
      + `<path d="M300 760 C320 860 330 940 334 1024 M724 760 C704 860 694 940 690 1024" fill="none" stroke="${shade}" stroke-width="8" opacity=".8"/>`;
  }
  // 옛 방식: 이모지 얼굴 (설정의 자리그림: '이모지')
  function emojiPerson(name, c, e, color) {
    const body = 'M222 1024 C222 640 340 470 512 470 C684 470 802 640 802 1024 Z';
    const badge = c.이모지 ? `<circle cx="512" cy="640" r="84" fill="rgba(255,255,255,.92)" stroke="rgba(0,0,0,.3)" stroke-width="6"/><text x="512" y="644" ${EMOJI} font-size="108" text-anchor="middle" dominant-baseline="central">${esc(c.이모지)}</text>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
      <defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(255,255,255,.12)"/><stop offset="1" stop-color="rgba(0,0,0,.5)"/></linearGradient></defs>
      <path d="${body}" fill="${color}"/><path d="${body}" fill="url(#b)"/><path d="${body}" fill="none" stroke="rgba(0,0,0,.4)" stroke-width="8"/>
      <circle cx="512" cy="270" r="180" fill="#ffd66e" stroke="rgba(0,0,0,.35)" stroke-width="8"/>
      <text x="512" y="270" ${EMOJI} font-size="368" text-anchor="middle" dominant-baseline="central">${EXPR_EMOJI[e] || EXPR_EMOJI.default}</text>${badge}</svg>`;
  }
  function charOf(file) {
    let name = file, c = {}, e = 'default';
    for (const [n, cc] of Object.entries(G.cfg.인물)) if (file.startsWith(cc.파일 + '_') || file === cc.파일) { name = n; c = cc; e = file.slice(cc.파일.length + 1) || 'default'; }
    return { name, c, e };
  }
  function charPlaceholder(file, withText = true) {
    const { name, c, e } = charOf(file);
    const color = hex(c.색) ? c.색 : nameColor(name);
    const mode = G.cfg.자리그림;
    if (mode === '이모지' && e !== 'back') return emojiPerson(name, c, e, color);
    // 단순한 그림 얼굴. 실루엣: 표정 없이 차분한 그림자 (무거운 주제에 어울린다). 뒷모습은 얼굴 없이 머리
    const lk = looks(name, c.생김새), mono = mode === '실루엣', back = e === 'back';
    const kind = c.자리 === '재판장석' ? 'robe' : c.자리 === '검사석' || c.자리 === '변호인석' ? 'suit' : 'casual';
    const skin = mono ? mix(color, '#0b0d18', 0.55) : lk.skin, hairC = mono ? mix(color, '#0b0d18', 0.7) : lk.hair;
    const p = [`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">`,
      `<defs><linearGradient id="sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".10"/><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient></defs>`,
      // 그림 인물과 크기, 머리 위치를 맞춘다 (얼굴 가운데가 위에서 4분의 1쯤)
      '<g transform="translate(512 275) scale(1.15) translate(-512 -330)">'];
    if (HAIR_BACK[lk.style]) p.push(`<path d="${HAIR_BACK[lk.style]}" fill="${hairC}" stroke="${LINE}" stroke-width="6"/>`);
    p.push(`<path d="M454 470 L454 618 Q512 656 570 618 L570 470 Z" fill="${mix(skin, '#7a4a3a', 0.18)}"/>`);
    p.push(mono ? `<path d="${TORSO}" fill="${mix(color, '#0b0d18', 0.45)}" stroke="${LINE}" stroke-width="6"/>` : outfit(kind, color));
    p.push(`<path d="${TORSO}" fill="url(#sh)"/>`);
    p.push(`<ellipse cx="376" cy="338" rx="22" ry="34" fill="${skin}" stroke="${LINE}" stroke-width="6"/><ellipse cx="648" cy="338" rx="22" ry="34" fill="${skin}" stroke="${LINE}" stroke-width="6"/>`);
    p.push(`<path d="${HEAD}" fill="${back ? hairC : skin}" stroke="${LINE}" stroke-width="6"/>`);
    if (lk.style === 'bun') p.push(`<circle cx="512" cy="${back ? 162 : 152}" r="58" fill="${hairC}" stroke="${LINE}" stroke-width="6"/>`);
    if (!back) {
      p.push(`<path d="${HAIR_FRONT[lk.style]}" fill="${hairC}" stroke="${LINE}" stroke-width="6" stroke-linejoin="round"/>`);
      if (!mono) {
        p.push(drawFace(e));
        if (lk.glasses) p.push(`<g fill="rgba(255,255,255,.18)" stroke="${INK}" stroke-width="7"><rect x="414" y="306" width="88" height="66" rx="22"/><rect x="522" y="306" width="88" height="66" rx="22"/></g><path d="M502 330 Q512 322 522 330" fill="none" stroke="${INK}" stroke-width="7"/>`);
        if (lk.beard) p.push(`<path d="M430 420 C450 500 574 500 594 420 C570 452 454 452 430 420 Z" fill="${hairC}" opacity=".9"/>`);
      } else p.push(`<rect x="332" y="700" width="360" height="84" rx="42" fill="rgba(8,12,26,.72)"/>` + (withText ? `<text x="512" y="744" ${FONT} font-size="${name.length > 5 ? 40 : 50}" font-weight="700" fill="#fff" text-anchor="middle" dominant-baseline="central">${esc(name)}</text>` : ''));
    }
    p.push('</g></svg>');
    return p.join('');
  }

  // 법정: 나무 벽판과 테마 색의 벽, 포인트 색의 저울 문장
  const WOOD = '#6b4529', WOOD_DARK = '#3a2516', WOOD_LIGHT = '#8c5e38';
  function scalesMark(cx, cy, s, color) {
    return `<g transform="translate(${cx} ${cy}) scale(${s})" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M0 -90 L0 90 M-46 92 L46 92 M-100 -60 L100 -60"/><circle cx="0" cy="-96" r="9" fill="${color}"/>
      <path d="M-100 -60 L-132 10 M-100 -60 L-68 10 M-142 10 Q-100 52 -58 10 Z"/><path d="M100 -60 L68 10 M100 -60 L132 10 M58 10 Q100 52 142 10 Z"/></g>`;
  }
  function courtWall(base, point) {
    const wall = mix(base, '#000000', 0.25), wallDark = mix(base, '#000000', 0.62);
    const panels = [...Array(6)].map((_, i) => { const x = 40 + i * 248; return `<rect x="${x}" y="120" width="208" height="430" rx="6" fill="none" stroke="${mix(wall, '#ffffff', 0.08)}" stroke-width="6"/><rect x="${x + 18}" y="138" width="172" height="394" rx="4" fill="${mix(wall, '#000000', 0.12)}"/>`; }).join('');
    const pillars = [...Array(7)].map((_, i) => `<rect x="${i * 248 + 4}" y="0" width="32" height="700" fill="${WOOD_DARK}"/><rect x="${i * 248 + 8}" y="0" width="6" height="700" fill="${WOOD_LIGHT}" opacity=".5"/>`).join('');
    const wains = `<rect x="0" y="580" width="1536" height="300" fill="#5a3a24"/><rect x="0" y="580" width="1536" height="22" fill="${WOOD_LIGHT}"/><rect x="0" y="602" width="1536" height="8" fill="${point}" opacity=".55"/>`
      + [...Array(8)].map((_, i) => `<rect x="${i * 196 + 24}" y="640" width="160" height="200" rx="6" fill="none" stroke="${WOOD_DARK}" stroke-width="8"/>`).join('');
    return `<defs><linearGradient id="wl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${wallDark}"/><stop offset=".6" stop-color="${wall}"/></linearGradient>
      <radialGradient id="lt" cx=".5" cy=".3" r=".7"><stop offset="0" stop-color="#ffe7b0" stop-opacity=".22"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <linearGradient id="fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1c13"/><stop offset="1" stop-color="#120c08"/></linearGradient></defs>
      <rect width="1536" height="1024" fill="url(#wl)"/>${panels}${pillars}${wains}<rect x="0" y="880" width="1536" height="144" fill="url(#fl)"/>`;
  }
  // 나무 책상 앞면 (윗면 띠, 포인트 색 줄, 판 무늬)
  const deskFront = (x, w, y, point, h = 1024 - y) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${WOOD}" stroke="${WOOD_DARK}" stroke-width="8"/><rect x="${x}" y="${y}" width="${w}" height="30" fill="${WOOD_LIGHT}"/><rect x="${x}" y="${y + 30}" width="${w}" height="8" fill="${point}" opacity=".6"/>`
    + [...Array(Math.max(1, Math.round(w / 260)))].map((_, i, a) => { const pw = w / a.length; return `<rect x="${x + i * pw + 26}" y="${y + 66}" width="${pw - 52}" height="${Math.max(20, h - 90)}" rx="8" fill="none" stroke="${WOOD_DARK}" stroke-width="8"/>`; }).join('');
  function courtPlaceholder(seat, desk) {
    const { base, point } = themeColors();
    const open = '<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 1536 1024">';
    if (desk) {
      const shape = seat === '증언대' ? deskFront(468, 600, 790, point)
        : seat === '피고석' ? `<rect x="0" y="800" width="1536" height="28" fill="${WOOD_LIGHT}" stroke="${WOOD_DARK}" stroke-width="6"/>${[...Array(16)].map((_, i) => `<rect x="${20 + i * 98}" y="828" width="30" height="196" rx="6" fill="${WOOD}" stroke="${WOOD_DARK}" stroke-width="5"/>`).join('')}`
        : deskFront(-10, 1556, 780, point);
      return open + shape + '</svg>';
    }
    const deep = mix(base, '#000000', 0.45);
    let extra = '';
    if (seat === '전경') { // 정면에서 본 법정: 높은 재판장석, 증언대, 좌우 책상, 가운데 길
      extra = `<rect x="0" y="700" width="1536" height="324" fill="url(#fl)"/><path d="M640 1024 L712 700 L824 700 L896 1024 Z" fill="${mix(base, '#000000', 0.2)}" opacity=".85"/>`
        + `<circle cx="768" cy="200" r="104" fill="${deep}" stroke="${point}" stroke-width="10"/>${scalesMark(768, 212, 0.72, point)}`
        + `<rect x="688" y="318" width="160" height="110" rx="14" fill="#2b1a10" stroke="${WOOD_DARK}" stroke-width="6"/>`
        + deskFront(418, 700, 400, point, 300)
        + `<rect x="418" y="700" width="700" height="18" fill="${WOOD_DARK}"/>`
        + `<rect x="688" y="740" width="160" height="150" fill="${WOOD}" stroke="${WOOD_DARK}" stroke-width="7"/><rect x="676" y="728" width="184" height="22" fill="${WOOD_LIGHT}" stroke="${WOOD_DARK}" stroke-width="5"/>`
        + `<path d="M0 800 L470 760 L470 900 L0 980 Z" fill="${WOOD}" stroke="${WOOD_DARK}" stroke-width="8"/><path d="M0 800 L470 760 L470 784 L0 826 Z" fill="${WOOD_LIGHT}"/>`
        + `<path d="M1536 800 L1066 760 L1066 900 L1536 980 Z" fill="${WOOD}" stroke="${WOOD_DARK}" stroke-width="8"/><path d="M1536 800 L1066 760 L1066 784 L1536 826 Z" fill="${WOOD_LIGHT}"/>`;
    } else if (seat === '재판장석') {
      extra = `<circle cx="768" cy="130" r="92" fill="${deep}" stroke="${point}" stroke-width="10"/>${scalesMark(768, 140, 0.62, point)}`
        + `<path d="M180 0 L320 0 L300 700 L200 700 Z M1356 0 L1216 0 L1236 700 L1336 700 Z" fill="${mix(base, '#000000', 0.35)}" opacity=".9"/>`
        + `<rect x="0" y="700" width="1536" height="324" fill="${WOOD}" stroke="${WOOD_DARK}" stroke-width="8"/><rect x="0" y="700" width="1536" height="34" fill="${WOOD_LIGHT}"/><rect x="0" y="734" width="1536" height="9" fill="${point}" opacity=".6"/>`
        + [...Array(5)].map((_, i) => `<rect x="${i * 307 + 30}" y="780" width="247" height="220" rx="8" fill="none" stroke="${WOOD_DARK}" stroke-width="9"/>`).join('');
    } else if (seat === '증언대') {
      extra = `<rect x="588" y="110" width="360" height="460" rx="8" fill="${deep}" stroke="${point}" stroke-width="6" opacity=".92"/>`
        + `<path d="M618 110 C640 260 660 420 640 570 M918 110 C896 260 876 420 896 570" fill="none" stroke="${mix(base, '#000000', 0.2)}" stroke-width="22" opacity=".8"/>`;
    } else if (seat === '변호인석' || seat === '검사석') {
      const x = seat === '변호인석' ? 1180 : 116;
      extra = `<rect x="${x}" y="150" width="240" height="380" rx="8" fill="${deep}" stroke="${point}" stroke-width="5" opacity=".9"/>`
        + [...Array(5)].map((_, i) => `<rect x="${x + 22}" y="${184 + i * 68}" width="${196 - (i % 2) * 40}" height="12" rx="6" fill="${point}" opacity=".28"/>`).join('');
    }
    return open + courtWall(base, point) + extra + '<rect width="1536" height="1024" fill="url(#lt)"/></svg>';
  }
  // 장소: 벽, 창, 바닥, 장소 이름 팻말 (색과 이모지는 설정의 배경에서)
  function placePlaceholder(name, b) {
    const cols = Array.isArray(b.색) ? b.색 : [b.색];
    const c0 = hex(cols[0]) ? cols[0] : nameColor(name), c1 = hex(cols[1]) ? cols[1] : mix(c0, '#000000', 0.75);
    const floor = mix(c0, '#000000', 0.55), frame = mix(c0, '#000000', 0.35);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 1536 1024">
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(c0, '#ffffff', 0.06)}"/><stop offset="1" stop-color="${c1}"/></linearGradient>
      <linearGradient id="w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff8e0" stop-opacity=".55"/><stop offset="1" stop-color="#fff8e0" stop-opacity=".08"/></linearGradient>
      <radialGradient id="v" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient></defs>
      <rect width="1536" height="1024" fill="url(#g)"/>
      <rect x="980" y="110" width="400" height="330" rx="10" fill="url(#w)" stroke="${frame}" stroke-width="14"/><path d="M1180 110 L1180 440 M980 275 L1380 275" stroke="${frame}" stroke-width="12"/>
      <path d="M1000 440 L760 1024 L1536 1024 L1536 700 Z" fill="#fff8e0" opacity=".06"/>
      <rect x="0" y="640" width="1536" height="14" fill="${mix(c0, '#000000', 0.4)}"/><rect x="0" y="654" width="1536" height="370" fill="${floor}"/>
      ${[...Array(9)].map((_, i) => `<path d="M${768 + (i - 4) * 120} 654 L${768 + (i - 4) * 420} 1024" stroke="${mix(floor, '#000000', 0.25)}" stroke-width="5"/>`).join('')}
      <rect width="1536" height="1024" fill="url(#v)"/></svg>`;
  }
  // 증거 카드: 위 띠는 기록 종류의 색
  function evidencePlaceholder(name, icon, color, withText = true) {
    const size = name.length > 12 ? 42 : name.length > 8 ? 52 : 62;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="768" height="768" viewBox="0 0 768 768">
      <defs><linearGradient id="p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8f1df"/><stop offset="1" stop-color="#e9dcbc"/></linearGradient></defs>
      <rect x="78" y="66" width="628" height="660" rx="18" fill="rgba(0,0,0,.25)"/>
      <rect x="70" y="56" width="628" height="660" rx="18" fill="url(#p)" stroke="#8a6a3a" stroke-width="8"/>
      <path d="M70 126 L70 74 Q70 56 88 56 L680 56 Q698 56 698 74 L698 126 Z" fill="${color}"/>
      ${[0, 1, 2].map((i) => `<path d="M140 ${566 + i * 44} L628 ${566 + i * 44}" stroke="#c9b48a" stroke-width="4"/>`).join('')}
      <circle cx="384" cy="300" r="128" fill="#fffaf0" stroke="#c9b48a" stroke-width="6"/>
      <text x="384" y="306" ${EMOJI} font-size="150" text-anchor="middle" dominant-baseline="central">${esc(icon || '📄')}</text>
      ${withText ? `<text x="384" y="500" ${FONT} font-size="${size}" font-weight="700" fill="#3b2a0e" text-anchor="middle">${esc(name)}</text>` : ''}</svg>`;
  }
  function evidenceOf(key, file) {
    // 지금 하는 화의 증거를 먼저 찾는다. 그림 이름을 적지 않은 증거는 'evidence/증거이름' 으로 찾는다
    const eps = [G.ep, ...G.episodes()].filter(Boolean);
    const all = eps.flatMap((d) => Object.entries(d.증거 || {}));
    const ev = (all.find(([id, e]) => e.그림 === key || e.자세히 === key || (!e.그림 && 'evidence/' + id === key)) || [])[1];
    const kd = ev && G.kind(ev), kc = kd && kd.색;
    return { name: ev ? ev.이름 : file, icon: ev && ev.아이콘, color: hex(kc) ? kc : '#3d6fd6' };
  }
  // 그림 속 이름을 게임 글꼴로: 그림(SVG) 속 글자는 웹 글꼴을 쓸 수 없어서, 글자 없이 그린 그림을 캔버스에 옮기고
  // 이름은 화면의 글꼴(--font)로 쓴다. 안 되면 null (그림 속 글자 그대로 쓴다)
  const madeUrls = new Set(), madeCache = {};
  G.fontsReady = Promise.resolve();
  function twoLines(t) {
    const spaces = [...t].map((ch, i) => (ch === ' ' ? i : -1)).filter((i) => i > 0), mid = t.length / 2;
    const at = spaces.length ? spaces.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid))[0] : Math.ceil(mid);
    return [t.slice(0, at).trim(), t.slice(at).trim()];
  }
  async function withGameText(svg, w, h, items) {
    try {
      await G.fontsReady;
      const fam = getComputedStyle(document.documentElement).getPropertyValue('--font').trim() || 'sans-serif';
      await Promise.all(items.map((it) => document.fonts.load(it.weight + ' ' + it.size + 'px ' + fam).catch(() => {})));
      const im = new Image();
      im.src = svgUrl(svg);
      await im.decode();
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      const x = cv.getContext('2d');
      x.drawImage(im, 0, 0, w, h);
      x.textAlign = 'center'; x.textBaseline = 'middle';
      for (const it of items) {
        let size = it.size;
        const setFont = () => { x.font = it.weight + ' ' + size + 'px ' + fam; };
        setFont();
        while (x.measureText(it.text).width > it.maxW && size > it.min) { size -= 2; setFont(); }
        const lines = x.measureText(it.text).width > it.maxW ? twoLines(it.text) : [it.text];
        x.fillStyle = it.color;
        lines.forEach((l, i) => x.fillText(l, it.x, it.y + (i - (lines.length - 1) / 2) * size * 1.18));
      }
      let out = cv.toDataURL('image/webp', 0.9);
      if (!out.startsWith('data:image/webp')) out = cv.toDataURL('image/png');
      madeUrls.add(out);
      return out;
    } catch (err) { return null; }
  }
  function placeholderWithText(key) {
    if (key in madeCache) return madeCache[key];
    const dir = key.slice(0, key.indexOf('/')), file = key.slice(key.indexOf('/') + 1);
    let job = null;
    if (dir === 'evidence') {
      const e = evidenceOf(key, file);
      job = withGameText(evidencePlaceholder(e.name, e.icon, e.color, false), 768, 768, [{ text: e.name, x: 384, y: 482, size: 62, min: 38, weight: 700, color: '#3b2a0e', maxW: 560 }]);
    } else if (dir === 'characters' && G.cfg.자리그림 === '실루엣') {
      const ch = charOf(file);
      if (ch.e !== 'back') job = withGameText(charPlaceholder(file, false), 1024, 1024, [{ text: ch.name, x: 512, y: 750, size: 54, min: 30, weight: 700, color: '#fff', maxW: 380 }]);
    }
    return (madeCache[key] = job);
  }
  G.placeholder = (key) => {
    const [dir, file] = [key.slice(0, key.indexOf('/')), key.slice(key.indexOf('/') + 1)];
    if (dir === 'characters') return svgUrl(charPlaceholder(file));
    if (dir === 'backgrounds') {
      for (const [seat, z] of Object.entries(G.cfg.법정자리)) { if (z.배경 === key) return svgUrl(courtPlaceholder(seat, false)); if (z.책상 === key) return svgUrl(courtPlaceholder(seat, true)); }
      const found = Object.entries(G.cfg.배경).find(([n, b]) => b.그림 === key || b.책상 === key || (!b.그림 && 'backgrounds/' + n === key));
      if (found && found[1].책상 === key) return ''; // 앞그림(책상)은 없으면 그리지 않는다
      return svgUrl(placePlaceholder(found ? found[0] : file, found ? found[1] : {}));
    }
    if (dir === 'evidence') { const e = evidenceOf(key, file); return svgUrl(evidencePlaceholder(e.name, e.icon, e.color)); }
    return '';
  };
  // 그림이 없는 장소 배경이면 팻말에 쓸 이름과 이모지를 돌려준다
  G.placeSign = (name, key) => { const b = G.cfg.배경[name]; return b && !b.법정 && key && G.missing.has(key) ? { 이름: name, 이모지: b.이모지 || '' } : null; };
  G.isPlaceholder = (url) => typeof url === 'string' && (url.startsWith('data:image/svg+xml') || madeUrls.has(url));
  G.setImg = async (el, key) => {
    el.dataset.key = key || '';
    if (!key) { el.hidden = true; el.removeAttribute('src'); return; }
    const url = await G.loadImg(key);
    if (el.dataset.key !== key) return; // 그사이 다른 그림으로 바뀜
    if (!url) { el.hidden = true; return; }
    el.src = url;
    el.hidden = false;
  };
  // 다른 그림으로 바꿀 때 옛 그림이 잠깐 보이지 않게 먼저 지우고 새 그림을 불러온다
  G.swapImg = (el, key) => {
    if (el.dataset.key !== (key || '')) { el.removeAttribute('src'); el.hidden = true; }
    return G.setImg(el, key);
  };
  G.imgEl = (key, cls) => { const el = G.h('img', { class: cls || null, alt: '' }); G.setImg(el, key); return el; };
  G.preload = (keys, onProgress) => {
    const list = [...new Set(keys.filter((k) => k && typeof k === 'string'))];
    let done = 0;
    return Promise.all(list.map((k) => G.loadImg(k).then(() => { done++; onProgress && onProgress(done, list.length); })));
  };

  // 인물 찾기. 화 데이터의 인물(G.ep.인물)에 적은 칸은 그 화에서만 바뀐다
  G.who = (name) => {
    const base = G.cfg.인물[name];
    const over = G.ep && G.ep.인물 && G.ep.인물[name];
    return over ? Object.assign({}, base, over) : base;
  };
  G.seatOf = (name) => (G.who(name) || {}).자리;
  G.charKey = (name, expr) => {
    const c = G.who(name);
    if (!c) return null;
    return 'characters/' + c.파일 + '_' + (G.cfg.표정[expr || '기본'] || 'default');
  };
  // 얼굴만 동그랗게 잘라 보여 주기 (대사창 옆 얼굴, 힌트 창, 증거 카드)
  // 인물.얼굴 = [가운데 x, 가운데 y, 반지름] (그림 1024×1024 기준). 적지 않으면 자리 그림의 얼굴 자리를 쓴다
  G.applyFace = (el, name, expr) => {
    const c = G.who(name);
    const key = G.charKey(name, expr);
    if (!c || !key) { el.style.backgroundImage = ''; return; }
    el.dataset.key = key;
    G.loadImg(key).then((url) => {
      if (el.dataset.key !== key) return;
      const [cx, cy, r] = (!G.isPlaceholder(url) && c.얼굴) || [512, 270, 200];
      el.style.backgroundSize = (1024 / (2 * r)) * 100 + '%';
      el.style.backgroundPosition = ((cx - r) / (1024 - 2 * r)) * 100 + '% ' + ((cy - r) / (1024 - 2 * r)) * 100 + '%';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.backgroundImage = url ? 'url("' + url + '")' : '';
    });
  };

  // ─────────── 설정(학생이 바꾸는 것) ───────────
  let STORE = 'kit';
  G.settings = { speed: '보통', bgm: 0.8, se: 0.9 };
  G.saveSettings = () => { try { localStorage.setItem(STORE + '-settings', JSON.stringify(G.settings)); } catch (e) {} };

  // ─────────── 소리 ───────────
  // my-game/audio/ 에 설정의 소리 표에 적은 이름으로 파일을 넣으면 소리가 난다. 파일이 없으면 조용히 넘어간다.
  G.audioBase = 'my-game/audio/';
  const audioExt = {}; // path → 찾은 주소, 또는 false(없음)
  function embeddedAudio(path) {
    const E = window.EMBED_AUDIO;
    if (!E || !E[path]) return null;
    if (E[path].startsWith('data:')) {
      const [head, b64] = E[path].split(',');
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      E[path] = URL.createObjectURL(new Blob([bytes], { type: head.slice(5).split(';')[0] }));
    }
    return E[path];
  }
  function playAudio(path, volume, loop) {
    return new Promise((resolve) => {
      if (!path || audioExt[path] === false) { resolve(null); return; }
      const inFile = embeddedAudio(path);
      if (!inFile && window.KIT_SINGLE) { audioExt[path] = false; resolve(null); return; }
      const tries = audioExt[path] ? [audioExt[path]] : inFile ? [inFile] : ['mp3', 'ogg', 'wav', 'm4a'].map((x) => G.audioBase + path + '.' + x);
      const next = () => {
        const url = tries.shift();
        if (!url) { audioExt[path] = false; resolve(null); return; }
        const a = new Audio();
        a.loop = !!loop;
        a.volume = Math.max(0, Math.min(1, volume));
        a.addEventListener('error', next, { once: true });
        a.addEventListener('playing', () => { audioExt[path] = url; }, { once: true });
        a.src = url;
        a.play().then(() => resolve(a)).catch((e) => { if (e && e.name === 'NotAllowedError') resolve(a); });
      };
      next();
    });
  }
  // '조사 음악 (잔잔하게)' → { 이름: '조사 음악', 꾸밈: '잔잔하게' }
  function splitName(table, full) {
    if (table[full]) return { 이름: full, 꾸밈: null };
    const m = String(full).match(/^(.*?)\s*\(([^)]*)\)\s*$/);
    if (m && table[m[1]]) return { 이름: m[1], 꾸밈: m[2] };
    return { 이름: full, 꾸밈: null };
  }
  G.audio = {
    current: null, el: null, baseVol: 1, playing: new Set(),
    async bgm(full) {
      if (!full || full === '멈춤' || /^없음/.test(full)) { this.stop(); this.current = null; return; }
      const { 이름, 꾸밈 } = splitName(G.cfg.소리.BGM, full);
      const path = G.cfg.소리.BGM[이름];
      const vol = (꾸밈 && G.cfg.소리.꾸밈음량[꾸밈]) || 0.8;
      if (this.current === 이름 && this.el) { this.baseVol = vol; this.el.volume = vol * G.settings.bgm; return; }
      this.stop();
      this.current = 이름;
      if (!path) return;
      this.baseVol = vol;
      const a = await playAudio(path, vol * G.settings.bgm, true);
      if (!a) return;
      if (this.current !== 이름) { a.pause(); return; }
      this.el = a;
    },
    stop() { if (this.el) { this.el.pause(); this.el = null; } },
    refreshVolume() { if (this.el) this.el.volume = this.baseVol * G.settings.bgm; },
    async se(full) {
      if (full === '멈춤') { this.playing.forEach((a) => a.pause()); this.playing.clear(); return; }
      const { 이름, 꾸밈 } = splitName(G.cfg.소리.효과음, full);
      const path = G.cfg.소리.효과음[이름];
      if (!path) return;
      const vol = (꾸밈 && G.cfg.소리.꾸밈음량[꾸밈]) || 0.85;
      const a = await playAudio(path, vol * G.settings.se, false);
      if (!a) return;
      this.playing.add(a);
      a.addEventListener('ended', () => this.playing.delete(a));
    },
    // 계속 되풀이되는 효과음 (빗소리 등). stopLoop()로 멈춘다
    async loop(full) {
      if (this.loopName === full) return;
      this.stopLoop();
      this.loopName = full;
      const { 이름, 꾸밈 } = splitName(G.cfg.소리.효과음, full);
      const path = G.cfg.소리.효과음[이름];
      if (!path) return;
      const a = await playAudio(path, ((꾸밈 && G.cfg.소리.꾸밈음량[꾸밈]) || 0.6) * G.settings.se, true);
      if (!a) return;
      if (this.loopName !== full) { a.pause(); return; }
      this.loopEl = a;
    },
    stopLoop() { this.loopName = null; if (this.loopEl) { this.loopEl.pause(); this.loopEl = null; } },
    blip() { // 대사 글자음 (파일이 있을 때만)
      const path = G.cfg.소리.효과음['대사 글자음'];
      if (typeof audioExt[path] === 'string') playAudio(path, 0.35 * G.settings.se, false);
      else if (audioExt[path] === undefined && !this.probed) { this.probed = true; playAudio(path, 0, false); }
    },
  };

  // ─────────── 저장 (이 기기의 브라우저에 남는다) ───────────
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(STORE + k) || 'null') ?? d; } catch (e) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(STORE + k, JSON.stringify(v)); } catch (e) {} };
  G.store = {
    load: () => read('-save', null),
    write: (data) => write('-save', data),
    clear() { try { localStorage.removeItem(STORE + '-save'); } catch (e) {} },
    // 끝까지 한 화 (화선택이 '순서'일 때 다음 화를 연다)
    cleared: () => read('-cleared', []),
    markCleared(n) { const c = this.cleared(); if (!c.includes(n)) { c.push(n); write('-cleared', c); } },
    notes: () => read('-notes', []),
    addNote(row) { const all = this.notes(); all.push(row); write('-notes', all.slice(-200)); },
  };
})();
