// 기본값 표: 게임(core.js), 점검(check.js), 만들기 도우미(maker.html)가 함께 쓴다.
// 여기 적힌 것은 my-game/settings.js 에서 바꾸거나 더할 수 있다.
(function (root) {
  const D = {};

  // 표정 이름(한글) → 그림 파일 뒷부분. 인물 그림 파일 이름은 "파일_표정.png" (예: sora_smile.png)
  D.EXPR = {
    '기본': 'default', '미소': 'smile', '웃음': 'smile', '놀람': 'surprised', '생각': 'think', '당황': 'flustered',
    '진지': 'serious', '슬픔': 'sad', '분노': 'angry', '화남': 'angry', '자신감': 'confident', '결의': 'determined',
    '걱정': 'worried', '안도': 'relieved', '비웃음': 'smirk', '겁먹음': 'scared', '엄숙': 'stern', '감사': 'grateful',
    '난처함': 'awkward', '미안함': 'sorry', '무표정': 'blank', '지침': 'tired', '뒷모습': 'back',
  };
  // 그림이 없을 때 자리 그림의 얼굴로 쓰는 이모지
  D.EXPR_EMOJI = {
    default: '🙂', smile: '😊', surprised: '😲', think: '🤔', flustered: '😳', serious: '😐', sad: '😢', angry: '😠',
    confident: '😎', determined: '😤', worried: '😟', relieved: '😌', smirk: '😏', scared: '😨', stern: '🧐',
    grateful: '🥹', awkward: '😅', sorry: '😔', blank: '😶', tired: '😩', back: '👤',
  };
  // 법정 자리: 말하는 사람의 자리로 화면이 바뀐다. 그림 이름은 my-game/images/ 기준 (없으면 자리 그림)
  D.SEATS = {
    '변호인석': { 배경: 'backgrounds/court_defense', 책상: 'backgrounds/court_defense_desk' },
    '검사석': { 배경: 'backgrounds/court_prosecution', 책상: 'backgrounds/court_prosecution_desk' },
    '증언대': { 배경: 'backgrounds/court_witness', 책상: 'backgrounds/court_witness_desk' },
    '피고석': { 배경: 'backgrounds/court_defendant', 책상: 'backgrounds/court_defendant_desk' },
    '재판장석': { 배경: 'backgrounds/court_judge', 책상: null },
    '전경': { 배경: 'backgrounds/court_wide', 책상: null },
  };
  // 기록 종류: 증거 카드의 색. 이름과 성격을 수업에 맞게 바꿀 수 있다
  //   오답벌칙없음: 잘못 제시해도 신뢰도가 줄지 않는다 / 제시연출: '차분'(음악이 멈추고 화면이 차분해짐), '빛'(화면에 빛이 번짐)
  //   읽기전용: 제시할 수 없고 읽기만 하는 카드 (용어 풀이)
  D.KINDS = {
    파랑: { 이름: '증거', 표시: '🟦', 색: '#3d6fd6' },
    빨강: { 이름: '피해 기록', 표시: '🟥', 색: '#c9412f', 오답벌칙없음: true, 제시연출: '차분' },
    초록: { 이름: '선택 기록', 표시: '🟩', 색: '#3fa45b', 제시연출: '빛' },
    노랑: { 이름: '자료', 표시: '🟨', 색: '#d9a520' },
    보라: { 이름: '기록', 표시: '🟪', 색: '#8a5cd6' },
    개념: { 이름: '개념 카드', 표시: '', 색: '#e8b84a', 읽기전용: true },
  };
  // 색 테마: [바탕, 포인트]
  D.THEMES = {
    '남색금빛': ['#13224a', '#e8b84a'], '칠판': ['#1d4536', '#f0e2a8'], '노을': ['#4a2238', '#ffb86b'],
    '바다': ['#0f4658', '#9fe3ff'], '먹빛': ['#2b2b30', '#e6e2d6'], '숲': ['#243b22', '#c9e27a'],
  };
  // 글꼴: 학교 안심(KERIS) 오픈 폰트. 인터넷이 되면 받아 쓰고, 안 되면 기기 글꼴로 나온다
  //   파일은 「한글 OFL 폰트 창고」(github.com/maker-SSAM/korean-ofl-fonts) 의 v1.0.0 을 jsDelivr 로 받는다
  const OFL = 'https://cdn.jsdelivr.net/gh/maker-SSAM/korean-ofl-fonts@v1.0.0/fonts/';
  D.FONTS = { // 대사, 이름표, 버튼
    '고딕': '"Paperlogy", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "맑은 고딕", sans-serif',
    '명조': '"Nanum Myeongjo", "나눔명조", "AppleMyungjo", "Batang", "바탕", serif',
  };
  D.FONT_FILES = {
    '고딕': OFL + 'paperlogy/paperlogy.css', // 페이퍼로지 (OFL)
    '명조': 'https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&display=swap', // 나눔명조 (OFL)
  };
  D.TITLE_FONTS = { // 처음 화면 제목, 외침, 판결. '고딕', '명조' 를 적으면 대사 글꼴의 굵은 글자
    '클래식': '"Cafe24 ClassicType", "Nanum Myeongjo", "AppleMyungjo", "Batang", serif',
  };
  D.TITLE_FONT_FILES = { '클래식': OFL + 'cafe24-classictype/cafe24-classictype.css' }; // 카페24 클래식타입 (카페24 라이선스, OFL)
  // 엔진이 스스로 내는 효과음 이름 (my-game/audio/ 에 이 파일이 있으면 소리가 난다)
  D.SOUNDS = {
    BGM: {},
    효과음: {
      '증거 획득음': 'se/evidence_get', '증거 제출음': 'se/evidence_present', '증거 갱신음': 'se/evidence_update', '증언 수정음': 'se/testimony_update',
      '신뢰도 감소음': 'se/penalty', '대사 글자음': 'se/text_blip', '외침': 'se/shout', '망치 소리': 'se/gavel', '쾅': 'se/slam',
    },
    꾸밈음량: { '잔잔하게': 0.55, '낮게': 0.5, '조용하게': 0.45, '작게': 0.4, '아주 작게': 0.3, '크게': 1, '가장 크게': 1, '다시': 0.8 },
  };

  // 명령 이름 (ai/데이터_형식.md 와 같아야 한다)
  D.COMMANDS = ['구간', '배경', 'BGM', '효과음', '말', '대기', '인물숨기기', '연출', '컷', '자막', '외침', '띠', '증거획득', '증거갱신', '확대', '인용',
    '증거보이기', '증거제출', '선택지', '안내창', '보이기', '등장', '퇴장', '사진', '화제목', '부제목', '이름표', '종이', '재판', '판결', '기록카드', '표', '연표',
    '쓰기', '다음화', '끝', '증언', '반격', '조사파트'];
  D.EFFECTS = ['흔들림', '크게 흔들림', '반짝', '암전', '암전 끝', '휘청', '정적', '차분하게', '차분함 끝', '빛', '빛 끝', '비', '비 그침', '회상', '회상 끝', '어둡게', '밝게'];
  D.WRITE_TYPES = ['증거', '고르기', '인물', '한줄', '길게', '답장'];

  // 명령의 종류: 명령 이름 가운데 맨 먼저 적힌 것 (AI가 { 표정, 말, 대사 } 처럼 순서를 바꿔 써도 '말'로 알아본다)
  D.cmdKey = (c) => {
    const keys = Object.keys(c || {});
    return keys.find((k) => D.COMMANDS.includes(k)) || keys[0];
  };
  D.list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);


  // ─────────── 인물 이름 바꾸기 (설정의 이름바꾸기) ───────────
  // 이야기는 그대로 두고, 게임을 시작할 때 모든 글과 이름표에서 이름을 바꾼다. 뒤에 붙은 조사(은/는, 이/가 …)도 새 이름에 맞춘다.
  // 이름이 다른 낱말의 일부일 때(하늘 → 하늘색)는 바꾸지 않는다.
  const HANGUL = /[가-힣]/;
  const jong = (s) => { s = String(s); const c = s.charCodeAt(s.length - 1); return c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 : /[lmnr]$/i.test(s) ? 1 : 0; };
  // [받침 있을 때, 없을 때]. 이름 뒤의 '야' 는 부르는 말(지우야 → 신중한아)로 본다
  const JOSA = [['이에요', '예요'], ['이었', '였'], ['이라고', '라고'], ['이라는', '라는'], ['이랑', '랑'], ['이나', '나'], ['아', '야'], ['이야', '야'], ['이지', '지'], ['이다', '다'], ['이고', '고'], ['이니까', '니까'], ['이면', '면'], ['이라서', '라서'], ['이요', '요'], ['으로', '로'], ['은', '는'], ['을', '를'], ['과', '와'], ['이', '가']];
  // '지우다, 지우고' 처럼 이름이 낱말의 앞부분일 수 있어서, 이지·이다·이고·이니까·이면·이라서 는 '이' 가 붙은 모양일 때만 이름으로 본다
  const COP = new Set(['이지', '이다', '이고', '이니까', '이면', '이라서']);
  const FIXED = ['입니다', '입니까', '이시', '에게', '한테', '께서', '께', '의', '도', '만', '처럼', '보다', '부터', '까지', '하고', '에서', '에', '님', '씨', '네', '들'];
  function nameTail(t, j0, old, neu) {
    // **굵게** 로 감싼 이름: 닫는 ** 뒤의 조사를 본다 (**하늘**이지 → **민서**지)
    const mark = t.startsWith('**', j0) ? '**' : '', j = j0 + mark.length;
    const r = tailAt(t, j, old, neu + mark);
    return r || (mark ? { text: neu, to: j0 } : null);
  }
  function tailAt(t, j, old, neu) {
    const end = (k) => k >= t.length || !HANGUL.test(t[k]);
    const nj = jong(neu.replace(/\*+$/, ''));
    const pick = (a, v) => (a === '으로' ? (nj && nj !== 8 ? a : v) : nj ? a : v);
    for (const [a, v] of JOSA) if (a.length > 1 && a[0] === '이' && t.startsWith(a, j) && (a === '이었' || end(j + a.length))) return { text: neu + pick(a, v), to: j + a.length }; // 이에요, 이었, 이랑 …
    if (jong(old) && t[j] === '이') { // 별명처럼 붙인 '이' (한결이가, 하늘이의, 한결이 말)
      const k = j + 1;
      if (end(k)) return { text: neu + (nj ? '이' : ''), to: k };
      for (const [a, v] of JOSA) if (v !== '가' && t.startsWith(v, k) && end(k + v.length)) return { text: neu + (nj ? '이' + v : v), to: k + v.length };
      if (t.startsWith('가', k) && end(k + 1)) return { text: neu + (nj ? '이가' : '가'), to: k + 1 };
      if (FIXED.some((f) => t.startsWith(f, k))) return { text: neu + (nj ? '이' : ''), to: k };
    }
    for (const [a, v] of JOSA) for (const form of COP.has(a) ? [a] : [a, v]) if (t.startsWith(form, j) && (a === '이었' || end(j + form.length))) return { text: neu + pick(a, v), to: j + form.length };
    if (FIXED.some((f) => t.startsWith(f, j))) return { text: neu, to: j };
    if (end(j)) return { text: neu, to: j };
    return null; // 다른 낱말의 일부
  }
  function renameText(t, map, olds) {
    let out = '', i = 0;
    while (i < t.length) {
      let hit = null;
      if (i === 0 || !HANGUL.test(t[i - 1])) for (const o of olds) if (t.startsWith(o, i)) { hit = nameTail(t, i + o.length, o, map[o]); if (hit) break; }
      if (hit) { out += hit.text; i = hit.to; } else { out += t[i]; i++; }
    }
    return out;
  }
  D.renameText = (t, map) => renameText(String(t), map, Object.keys(map).sort((a, b) => b.length - a.length));
  // DATA 를 그 자리에서 바꾼다. 다 바꾼 뒤 이름바꾸기는 지운다 (두 번 바꾸지 않게)
  D.renameData = (DATA) => {
    const g = DATA && DATA.게임, map0 = g && g.이름바꾸기;
    if (!g || !map0 || typeof map0 !== 'object' || Array.isArray(map0)) return DATA;
    delete g.이름바꾸기;
    const map = {};
    for (const [o, n] of Object.entries(map0)) if (typeof n === 'string' && n.trim() && n.trim() !== o) map[o] = n.trim();
    const olds = Object.keys(map).sort((a, b) => b.length - a.length);
    if (!olds.length) return DATA;
    for (const o of olds) { const c = g.인물 && g.인물[o]; if (c && typeof c === 'object' && !c.파일) c.파일 = 'char_' + o; } // 그림 파일 이름은 그대로
    const walk = (v) => {
      if (typeof v === 'string') return renameText(v, map, olds);
      if (Array.isArray(v)) return v.map(walk);
      if (v && typeof v === 'object') { const o = {}; for (const [k, x] of Object.entries(v)) o[renameText(k, map, olds)] = walk(x); return o; }
      return v;
    };
    for (const k of Object.keys(DATA)) DATA[k] = walk(DATA[k]);
    return DATA;
  };

  root.KIT_DEFAULTS = D;
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(typeof window !== 'undefined' ? window : globalThis);
