/* =========================================================
 * 감상평 비속어 거르기
 *  - 아래 목록의 단어가 들어 있으면 감상평(작성자 이름 포함)을 저장하지 않습니다.
 *  - 띄어쓰기·숫자·기호를 섞은 경우(예: "시 1 발", "씨.발")도 잡습니다.
 *  - 단어 추가·예외는 F9 → 데이터 관리 → "감상평 비속어 관리"에서 할 수 있습니다.
 *    (그 목록은 js/badwords-custom.js 에 저장됩니다)
 * ========================================================= */
(function () {
  // 비속어 (띄어쓰기 없이, 소문자로 적기)
  const WORDS = [
    // 욕설
    '시발', '씨발', '씨빨', '씨팔', '시팔', '시펄', '씨펄', '쓰발', '쓰벌', '씌발', '시벌', '씨벌', '슈발', '쉬발', '싀발', 'ㅆ발', 'ㅅ발', '시이발', '씨이발', '씨바알', '십발', '십팔놈', '십팔년', '씨부랄', '씨부럴', '시부랄', '시부럴',
    '씹새', '씹년', '씹놈', '씹할', '씹창', '씹물', '씹질', '십새', '쌉새', '썅', '쌍년', '쌍놈', '쌍노무', '상놈의',
    '병신', '븅신', '빙신', '병쉰', '병싄', '뷰웅신', '븽신', '등신', '머저리', '찐따', '또라이', '돌아이',
    '좆', '좃', '좇같', 'ㅈ같', '존나', '존니', '존내', '졸라', '졸래', '조낸', '좆나', '좆까', '좃까', '좆밥', '좆같', '좃같', '존맛탱',
    '개새끼', '개색기', '개색끼', '개쌔끼', '개쉐끼', '개세끼', '개새기', '개섀끼', '개쉑', '개색휘', '개시키', '개자식', '개놈', '개년', '개같', '개소리', '개지랄', '개빡', '개좆', '개씹',
    '새끼야', '새꺄', '쉐끼', '쌔끼', '느금', '느개비', '니애미', '니애비', '니미', '니엄창', '엠창', '엠생', '애미뒤', '애비뒤', '애미없', '애비없', '부모없', '호로자식', '호로새', '후레자식', '후레새',
    '지랄', '염병', '옘병', '엿먹', '엿이나', '뒈져', '뒤져라', '뒤지고싶', '죽여버', '죽일놈', '죽을래', '꺼지세요', '꺼져라', '닥쳐', '닥치라', '닥치세', '아가리',
    '미친놈', '미친년', '미친새', '미친것', '미친개', '미친색', '미친쉐', '미쳤냐', '정신병자', '저능아', '빡대가리', '돌대가리', '대가리깨', '골빈',
    '한남충', '김치녀', '맘충', '급식충', '틀딱', '꼴페미', '페미년', '일베충', '메갈년', '짱깨', '쪽바리', '깜둥이',
    '창녀', '창놈', '걸레년', '화냥', '갈보', '섹스', '야동', '딸딸이', '자위', '보지털', '자지털', '보짓', '자짓', '젖꼭지', '빠구리', '떡치', '강간', '성폭행',
    // 초성·자모로 쓴 욕
    'ㅅㅂ', 'ㅆㅂ', 'ㅅㅃ', 'ㅆㅃ', 'ㅂㅅ', 'ㅄ', 'ㅂㅆ', 'ㅈㄹ', 'ㅈㄴ', 'ㅈ까', 'ㄱㅅㄲ', 'ㅅㄲ', 'ㅆㄹㄱ', 'ㄷㅊ', 'ㄲㅈ', 'ㅁㅊ', 'ㅗㅗ', 'ㅅㅍ', 'ㅆㅍ', 'ㄴㄱㅁ', 'ㅈㄲ',
    // 영어
    'fuck', 'fuk', 'fck', 'fxck', 'phuck', 'shit', 'bitch', 'biatch', 'asshole', 'bastard', 'dick', 'pussy', 'cunt', 'motherf', 'mofo', 'wtf', 'stfu', 'gtfo', 'nigg', 'retard', 'slut', 'whore', 'porn', 'sex', 'jerkoff', 'dumbass', 'jackass',
    // 손가락 욕 이모지
    String.fromCodePoint(0x1F595)
  ];
  // 비속어처럼 보이지만 정상인 말 (먼저 지운 뒤 검사)
  const ALLOW = [
    '시발점', '시발역', '시발택시', '시발자동차', '수박씨발라', '참외씨발라', '호박씨발라', '해바라기씨발라', '씨발라먹',
    '등신대', '등신불', '병신춤', '십팔번', '미친듯이', '미친듯', '자위대', '자위권', '정당방위', '강간죄',
    'sussex', 'essex', 'middlesex', 'sextet', 'dickens', 'dickinson'
  ];

  // 보이지 않는 글자 (폭 없는 공백 등)
  const INVISIBLE = new RegExp('[' + [0x200b, 0x200c, 0x200d, 0x200e, 0x200f, 0x2060, 0xfeff].map(c => String.fromCharCode(c)).join('') + ']', 'g');
  const FINGER = String.fromCodePoint(0x1F595);
  // 띄어쓰기·숫자·기호 제거 (한글, 한글 자모, 영어, 손가락 이모지만 남김)
  function squash(s) {
    let t = String(s || '').toLowerCase().normalize('NFC').replace(INVISIBLE, '');
    const keepFinger = t.includes(FINGER);
    t = t.replace(/[^a-z가-힣ㄱ-ㅎㅏ-ㅣ]/g, '');
    return keepFinger ? t + FINGER : t;
  }
  // 기본 목록 + F9에서 추가한 목록(js/badwords-custom.js)
  let list = [], allow = [];
  function build(custom) {
    const c = custom || window.BADWORDS_CUSTOM || {};
    list = [...new Set(WORDS.concat(c.words || []).map(squash).filter(Boolean))];
    allow = [...new Set(ALLOW.concat(c.allow || []).map(squash).filter(Boolean))].sort((a, b) => b.length - a.length);
  }
  build();

  // 찾으면 걸린 단어를, 없으면 null
  function find(text) {
    let t = squash(text);
    if (!t) return null;
    allow.forEach(a => { t = t.split(a).join('_'); });
    // 영어는 글자를 늘여 쓴 경우(fuuuck)도 잡기 위해 반복 글자를 줄인 것도 함께 검사
    const t2 = t.replace(/([a-z])\1+/g, '$1');
    for (const w of list) {
      if (t.includes(w)) return w;
      if (/^[a-z]+$/.test(w) && t2.includes(w.replace(/([a-z])\1+/g, '$1'))) return w;
    }
    return null;
  }
  window.BadWords = {
    find, has: t => !!find(t),
    get count() { return list.length; },
    baseCount: WORDS.length,
    squash,
    // 이 기기에 바로 적용 (배포가 끝나기 전에도 선생님 화면에서 확인 가능)
    reload(custom) { if (custom) window.BADWORDS_CUSTOM = custom; build(custom); }
  };
})();
