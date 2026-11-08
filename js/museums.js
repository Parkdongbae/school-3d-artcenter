/* =========================================================
 * 지역별 대표 미술관 정의
 *  - 실제 건축물의 특징(재료·공간 구성)에서 영감을 받은 가상 공간입니다.
 *  - 각 미술관의 로고·상표는 사용하지 않습니다.
 * ========================================================= */
window.MUSEUMS = [
  {
    id: 'seoul', region: '서울', city: '서울 종로구',
    name: '국립현대미술관 서울관', short: '서울관',
    year: '2013', architect: '민현준',
    keywords: ['마당', '서울박스', '연갈색 테라코타'],
    desc: '경복궁 옆에 자리한 미술관입니다. 정해진 기능이 없는 빈 "마당"을 먼저 놓고 그 둘레에 전시실을 배치한 것이 설계의 핵심입니다. 옛 기와를 현대적으로 해석한 연갈색 테라코타 패널과 연회색 화강석으로 마감했고, 옛 기무사 붉은 벽돌 건물과 종친부를 품고 있습니다. 이 가상관은 낮게 퍼진 건물, 마당, 유리 중앙홀(서울박스)을 모티프로 했습니다.',
    accent: '#c8643c',
    sky: { top: '#5d8fd0', horizon: '#dfe9f2', sun: [0.45, 0.62, 0.55], sunColor: '#fff3df', sunI: 3.2, hemi: 1.1, fog: '#d7e3ee', fogD: 260, time: '맑은 낮' },
    ground: 'stonePaving', exterior: 'seoul', lobby: 'glassbox',
    interior: { wall: '#f4f2ee', floor: 'concreteFloor', floorTint: '#bdb8b0', ceiling: 'grid', light: '#fff6ea', trim: '#2b2b2b', lobbyH: 13 }
  },
  {
    id: 'gwacheon', region: '경기', city: '경기 과천시',
    name: '국립현대미술관 과천관', short: '과천관',
    year: '1986', architect: '김태수',
    keywords: ['원형 램프', '회랑', '청계산'],
    desc: '청계산 자락에 1986년 문을 연 미술관입니다. 건물 중앙의 원형 공간을 감싸며 올라가는 램프, 회랑과 브리지가 특징입니다. 산사(山寺)처럼 층층이 쌓인 단 위에 분홍빛 괴산석으로 마감했고, 앞에는 반영못과 조각정원이 있습니다. 이 가상관은 돌 단과 원통형 램프코어, 둥근 중앙홀을 모티프로 했습니다.',
    accent: '#8a6f4d',
    sky: { top: '#6f9fd8', horizon: '#eef1ea', sun: [-0.5, 0.5, 0.6], sunColor: '#fff0d6', sunI: 3.0, hemi: 1.1, fog: '#dfe6e3', fogD: 240, time: '상쾌한 아침', mountains: '#7f9a8a' },
    ground: 'granitePaving', exterior: 'gwacheon', lobby: 'rotunda',
    interior: { wall: '#f1ede6', floor: 'granite', floorTint: '#cfc6b8', ceiling: 'coffer', light: '#fff1dc', trim: '#6b5a45', lobbyH: 16 }
  },
  {
    id: 'incheon', region: '인천', city: '인천 중구 해안동',
    name: '인천아트플랫폼', short: '인천아트플랫폼',
    year: '2009', architect: '황순우 (재생 설계)',
    keywords: ['개항장', '붉은 벽돌 창고', '박공지붕'],
    desc: '1883년 개항 이후 창고와 상업시설이 들어섰던 개항장 일대의 근대 건물 13개 동을 고쳐 만든 예술 공간입니다. 원형을 최대한 살리면서 붉은 벽돌과 박공지붕으로 통일감을 주었고, 노란 나무 문이 인상적입니다. 2009년 9월 문을 열었습니다. (인천시립미술관은 인천뮤지엄파크에 2028년 개관 예정입니다.) 이 가상관은 박공지붕 벽돌 창고, 회벽의 옛 사무소 건물, 항구 풍경을 모티프로 했습니다.',
    accent: '#b5543a',
    sky: { top: '#7f9bb8', horizon: '#e9e4dc', sun: [-0.55, 0.45, 0.55], sunColor: '#ffe9cc', sunI: 2.9, hemi: 1.0, fog: '#dcd9d2', fogD: 250, time: '항구의 오후' },
    ground: 'granitePaving', exterior: 'incheon', lobby: 'warehouse',
    interior: { wall: '#f1ece4', floor: 'woodStrip', floorTint: '#9c7656', ceiling: 'beams', light: '#ffeacc', trim: '#3a2a20', lobbyH: 10.3 }
  },
  {
    id: 'cheongju', region: '충북', city: '충북 청주시',
    name: '국립현대미술관 청주관', short: '청주관',
    year: '2018', architect: '옛 연초제조창 재생',
    keywords: ['담배공장', '흰 콘크리트 상자', '보이는 수장고'],
    desc: '옛 연초제조창(담배공장) 건물을 고쳐 2018년 문을 연 미술관입니다. 소장품을 보관하면서 보여 주는 "개방형 수장고"로 알려져 있습니다. 길이 약 120m의 5층 콘크리트 건물을 흰색·연회색으로 고쳤고, 1층에는 기둥이 줄지어 선 긴 회랑이 있습니다. 이 가상관은 흰 상자 같은 외관, 회랑, 곡면 디지털 사이니지, 보이는 수장고를 모티프로 했습니다.',
    accent: '#5c6670',
    sky: { top: '#7aa3cf', horizon: '#f2e6d4', sun: [0.6, 0.38, 0.5], sunColor: '#ffe2b8', sunI: 3.0, hemi: 1.0, fog: '#e9dfd0', fogD: 230, time: '따뜻한 오후' },
    ground: 'asphalt', exterior: 'cheongju', lobby: 'industrial',
    interior: { wall: '#ece7df', floor: 'concreteFloor', floorTint: '#9c968d', ceiling: 'truss', light: '#ffe6c2', trim: '#3a3a3a', brick: true, lobbyH: 12 }
  },
  {
    id: 'jeonbuk', region: '전북', city: '전북 완주군 구이면',
    name: '전북도립미술관', short: '전북도립미술관',
    year: '2004', architect: '-',
    keywords: ['모악산', '구이저수지', '조각정원'],
    desc: '모악산 자락에 2004년 문을 연 미술관입니다. 뒤로는 모악산 능선이, 앞으로는 구이저수지의 물가 풍경이 펼쳐지며 야외 조각정원이 있습니다. 저수지 둘레에는 벚나무가 있습니다. 이 가상관은 산을 등지고 저수지를 바라보는 통유리 로비와 가을빛 숲, 벚나무 길을 모티프로 했습니다.',
    accent: '#a0612e',
    sky: { top: '#5f92cf', horizon: '#efe8da', sun: [0.55, 0.45, 0.6], sunColor: '#ffe6c0', sunI: 3.0, hemi: 1.05, fog: '#e4e0d6', fogD: 280, time: '가을 오후', mountains: '#6e7f5a' },
    ground: 'stonePaving', exterior: 'jeonbuk', lobby: 'panorama',
    interior: { wall: '#f4f1eb', floor: 'woodStrip', floorTint: '#c8a57f', ceiling: 'vault', light: '#fff1dc', trim: '#5a4632', lobbyH: 8.6 }
  },
  {
    id: 'gwangju', region: '광주', city: '광주 북구 중외공원',
    name: '광주시립미술관', short: '광주시립미술관',
    year: '2007 (본관)', architect: '홍순재 · 도시건축J-FORM',
    keywords: ['중외공원', '하늘다리', '문화벨트'],
    desc: '중외공원 안에 2007년 새로 지은 본관입니다. 설계자는 미술관을 공원의 중심이 아닌 "배경"으로 보고, 공원의 문예회관과 박물관을 잇는 문화벨트가 되도록 배치했습니다. 2024년에는 예술의전당과 미술관을 잇는 347m 하늘다리가 생겼습니다. 밝은 석회석과 노을을 비추는 서쪽 유리 커튼월, 광장과 야외 공연장이 있습니다. 이 가상관은 언덕을 등진 낮은 건물, 하늘다리, 빛우물 아래 실내 정원을 모티프로 했습니다.',
    accent: '#2f7d6d',
    sky: { top: '#5b8fd0', horizon: '#f1e7d6', sun: [-0.6, 0.35, 0.5], sunColor: '#ffdcae', sunI: 3.0, hemi: 1.0, fog: '#e6dfd2', fogD: 260, time: '늦은 오후' },
    ground: 'granitePaving', exterior: 'gwangju', lobby: 'garden',
    interior: { wall: '#f5f3ef', floor: 'concreteFloor', floorTint: '#cfc8bd', ceiling: 'circles', light: '#fff4e4', trim: '#2b2b2b', lobbyH: 11 }
  },
  {
    id: 'daegu', region: '대구', city: '대구 수성구',
    name: '대구미술관', short: '대구미술관',
    year: '2011', architect: '희림',
    keywords: ['어미홀', '높이 18m', '유리 큐브'],
    desc: '2011년 대구대공원 안에 문을 연 미술관입니다. 건물 중앙에 높이 약 18m, 길이 50m가 넘는 거대한 "어미홀"이 있어 대형 설치 작품 전시에 쓰입니다. 밝은 화강석과 유리로 된 긴 매스들이 경사지에 엇갈려 놓여 있고, 입구 마당에는 상징적인 유리 큐브가 있습니다. 이 가상관은 겹쳐진 긴 건물, 유리 큐브, 거대한 중앙홀을 모티프로 했습니다.',
    accent: '#3f6e8c',
    sky: { top: '#4f86c9', horizon: '#e4ecf3', sun: [-0.3, 0.7, 0.5], sunColor: '#ffffff', sunI: 3.4, hemi: 1.1, fog: '#dce6ee', fogD: 260, time: '쾌청한 한낮', mountains: '#8aa0a8' },
    ground: 'stonePaving', exterior: 'daegu', lobby: 'grandhall',
    interior: { wall: '#f2f2f0', floor: 'woodStrip', floorTint: '#b99a74', ceiling: 'slot', light: '#fffaf2', trim: '#222', lobbyH: 18 }
  },
  {
    id: 'daejeon', region: '대전', city: '대전 서구',
    name: '이응노미술관', short: '이응노미술관',
    year: '2007', architect: '로랑 보두앵',
    keywords: ['문자추상', '흰 콘크리트', '빛'],
    desc: '고암 이응노 화백을 기리는 미술관으로, 프랑스 건축가 로랑 보두앵이 설계했습니다. 화가의 작품에서 건물의 영감을 얻었다고 알려져 있습니다. 평면은 그림 속 글자 「壽」에서 왔고, 한옥의 담과 마당을 재해석한 작은 정원들이 전시실과 이어집니다. 이 가상관은 흰 루버와 유리, 담장 정원, 쏟아지는 빛줄기를 모티프로 했습니다.',
    accent: '#2a2a2a',
    sky: { top: '#4f8fd6', horizon: '#e3ecf2', sun: [0.75, 0.5, 0.25], sunColor: '#fff6e8', sunI: 3.0, hemi: 0.85, fog: '#dde7ee', fogD: 260, time: '눈부신 낮' },
    ground: 'whiteGravel', exterior: 'daejeon', lobby: 'lightshaft',
    interior: { wall: '#fbfbf9', floor: 'terrazzo', floorTint: '#e6e2db', ceiling: 'louver', light: '#ffffff', trim: '#111', lobbyH: 11 }
  },
  {
    id: 'gyeongnam', region: '경남', city: '경남 창원시',
    name: '경남도립미술관', short: '경남도립미술관',
    year: '2004', architect: '-',
    keywords: ['중앙홀', '브리지', '전면 유리'],
    desc: '경남도청 바로 옆에 자리한 도립미술관입니다. 1층 중앙홀을 중심으로 전시실이 놓이고, 2층은 중앙의 빈 공간(보이드)을 가로지르는 브리지를 사이에 두고 전시실이 나뉩니다. 전면 유리 너머로 창원 시내가 내려다보입니다. 하얀 건물로, 위층에는 야외 조각 테라스가 있고 뒤로 정병산이 보입니다. 이 가상관은 유리 아트리움과 2층 브리지, 조각 테라스와 조각공원을 모티프로 했습니다.',
    accent: '#3a5f8a',
    sky: { top: '#4d86cc', horizon: '#e6eef3', sun: [0.4, 0.62, 0.55], sunColor: '#fffaf0', sunI: 3.2, hemi: 1.1, fog: '#dce7ee', fogD: 280, time: '청명한 아침', mountains: '#7d9389' },
    ground: 'stonePaving', exterior: 'gyeongnam', lobby: 'bridgevoid',
    interior: { wall: '#f3f2ef', floor: 'granite', floorTint: '#ddd8cf', ceiling: 'cove', light: '#fffaf2', trim: '#26303a', lobbyH: 13 }
  },
  {
    id: 'busan', region: '부산', city: '부산 사하구 을숙도',
    name: '부산현대미술관', short: '부산현대미술관',
    year: '2018', architect: '수직정원: 패트릭 블랑',
    keywords: ['수직정원', '을숙도', '뉴미디어'],
    desc: '낙동강 하구 을숙도에 2018년 문을 연 미술관입니다. 식물학자 패트릭 블랑이 부산의 자생 식물 170여 종을 심은 거대한 수직정원이 외벽을 덮고 있습니다. 베이지색 석재 패널의 큰 상자 건물 정면을 수직정원이 덮어, 멀리서 보면 초록 비단에 싸인 상자처럼 보입니다. 이 가상관은 초록 외벽과 노을빛 하구, 미디어아트 전시장을 모티프로 했습니다.',
    accent: '#3d8c5a',
    sky: { top: '#2b3f73', horizon: '#f2a46b', sun: [0.8, 0.12, -0.2], sunColor: '#ffb27a', sunI: 2.6, hemi: 0.75, fog: '#c99a86', fogD: 220, time: '노을 지는 저녁' },
    ground: 'deck', exterior: 'busan', lobby: 'mediawall',
    interior: { wall: '#1c1d22', floor: 'polishedDark', floorTint: '#2a2b30', ceiling: 'black', light: '#f4f1ff', trim: '#59ffa8', dark: true, lobbyH: 12 }
  },
  {
    id: 'san', region: '강원', city: '강원 원주시',
    name: '뮤지엄 산', short: '뮤지엄 산',
    year: '2013', architect: '안도 다다오',
    keywords: ['노출 콘크리트', '워터가든', '스톤가든'],
    desc: '원주 산자락에 자리한 미술관으로 건축가 안도 다다오가 설계했습니다. 물 위에 떠 있는 듯한 건물, 돌로 쌓은 벽, 노출 콘크리트가 특징입니다. 꽃밭–자작나무 길–물의 정원–본관–스톤가든으로 이어지는 긴 산책길과 꿀빛 파주석 벽이 특징입니다. 이 가상관은 그 진입 순서와 빛이 스미는 콘크리트 공간을 모티프로 했습니다.',
    accent: '#6d7a6a',
    sky: { top: '#8aa4bd', horizon: '#e7ebe8', sun: [-0.55, 0.42, 0.45], sunColor: '#fff2dc', sunI: 2.8, hemi: 1.0, fog: '#d9e0dd', fogD: 200, time: '안개 낀 아침', mountains: '#6f8576' },
    ground: 'grass', exterior: 'san', lobby: 'concrete',
    interior: { wall: '#bdbab3', floor: 'woodStrip', floorTint: '#7a6250', ceiling: 'concrete', light: '#fff0d8', trim: '#3d3a36', concreteWalls: true, lobbyH: 10 }
  },
  {
    id: 'jeju', region: '제주', city: '제주 제주시',
    name: '제주도립미술관', short: '제주도립미술관',
    year: '2009', architect: '간삼건축',
    keywords: ['연못', '제주석', '한라산'],
    desc: '한라산을 배경으로 2009년 문을 연 미술관입니다. 제주석과 노출 콘크리트로 지었고, 건물 앞을 얕은 연못이 감싸고 있습니다. 하늘을 담는 가는 기둥의 열주가 있습니다. 이 가상관은 물에 비친 건물, 열주, 검은 현무암, 한라산 풍경을 모티프로 했습니다.',
    accent: '#2f5d73',
    sky: { top: '#3f86d6', horizon: '#e2f0f6', sun: [0.35, 0.6, 0.6], sunColor: '#fff8ea', sunI: 3.3, hemi: 1.15, fog: '#d6e8f0', fogD: 300, time: '바닷바람 부는 낮', mountains: '#6d8c7c', halla: true },
    ground: 'basaltPaving', exterior: 'jeju', lobby: 'pond',
    interior: { wall: '#f3f1ec', floor: 'basalt', floorTint: '#5c5b58', ceiling: 'wood', light: '#fff4e2', trim: '#2d2c2a', lobbyH: 9 }
  }
];
