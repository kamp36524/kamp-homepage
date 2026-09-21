/* =====================================================================
   세미나 공용 데이터 (세미나 목록 배너 + 신청 페이지가 함께 사용)
   - 세미나를 추가/수정하려면 이 파일만 고치면 됩니다.
     · title    : 세미나 제목 (신청 시 구글 시트 탭 이름으로도 사용)
     · status   : "open"(진행 중) | "ended"(종료)
     · poster   : 목록 배너용 포스터 이미지
     · summary  : 신청 페이지 상세(요약) 이미지
     · schedule : 일정 (배너 표시)
     · place    : 장소 (배너 표시, 비우면 숨김)
     · fee      : 참가비 (배너 표시, 비우면 숨김)
     · payment  : true 면 신청 폼에 입금 안내(계좌·결제) 표시. false/생략 시 숨김
     · dateHint : 신청일 선택 안내 문구 (생략 시 기본 문구)
     · info     : 신청 페이지 안내 HTML
     · dates    : 신청 폼의 신청일 목록(중복 선택 가능)
   ===================================================================== */
window.SEMINARS_DATA = {
  "vip-tax-forum": {
    title: "VIP 프라이빗 자산 포럼",
    status: "open",
    poster: "/images/seminar/vip-tax-forum-thumb.png",
    summary: "/images/seminar/vip-tax-forum.webp",
    schedule: "9월 28일 · 29일 · 30일 (오후 3시~5시)",
    place: "호텔 더 디자이너스 리즈강남프리미어 B1F",
    fee: "1회 3만원 (부가세 포함)",
    payment: true,
    dateHint: "(참석 가능한 날짜를 선택해 주세요 · 중복 선택 가능 · 매 회차 오후 3시~5시)",
    info:
      '<h3>8.3 세제개편, 오늘 못다한 이야기</h3>' +
      '<p>변화하는 세법 가이드라인 분석 및 맞춤형 실전 자산 방어 전략</p>' +
      '<h3>세미나 주제</h3>' +
      '<ul>' +
        '<li><b>양도소득세</b> — 다주택 중과 배제 및 비과세 절세 플랜</li>' +
        '<li><b>취&middot;등록세</b> — 개편 기준 매입 전략 및 세부담 완화 솔루션</li>' +
        '<li><b>증여 &amp; 상속</b> — 세대간 사전 증여 및 합법적 자산 이전</li>' +
      '</ul>' +
      '<h3>일정</h3>' +
      '<p>9월 28일 · 29일 · 30일<br>' +
      '<span class="info-sub">매 회차 오후 3시 시작 · 약 2시간 진행 (오후 3시~5시)</span></p>' +
      '<h3>진행 방식</h3>' +
      '<p>핵심 세미나 + 1:1 심층 상담<br>' +
      '<span class="info-sub">참석자 전원 1:1 맞춤형 특별 컨설팅 제공</span></p>' +
      '<h3>강의 참가비</h3>' +
      '<p><b>1회 3만원</b> (부가세 포함)</p>' +
      '<h3>모집 인원</h3>' +
      '<p>단 20명 한정 (선착순 마감)</p>' +
      '<p class="info-note">* 고밀도 1:1 상담 품질 유지를 위해 20명 충원 시 조기 마감됩니다.</p>' +
      '<h3>오시는 길</h3>' +
      '<p>호텔 더 디자이너스 리즈강남프리미어 B1F [Joie de Vivre]<br>' +
      '<span class="info-sub">강남구 봉은사로 113 · 유료 주차 가능</span></p>' +
      '<img class="info-map" src="/images/seminar/seminar_location.jpeg" alt="오시는 길 지도" onerror="this.style.display=\'none\'">' +
      '<p><a href="https://map.kakao.com/?q=%ED%98%B8%ED%85%94%20%EB%8D%94%20%EB%94%94%EC%9E%90%EC%9D%B4%EB%84%88%EC%8A%A4%20%EB%A6%AC%EC%A6%88%EA%B0%95%EB%82%A8%ED%94%84%EB%A6%AC%EB%AF%B8%EC%96%B4" target="_blank" rel="noopener">카카오맵에서 위치 보기 →</a></p>' +
      '<h3>신청 및 문의</h3>' +
      '<p>홈페이지에서 바로 신청하실 수 있으며, 고종완과 함께 오픈채팅방에서도 신청 가능합니다.<br>' +
      '<a href="https://open.kakao.com/o/g1mUmyui" target="_blank" rel="noopener">open.kakao.com/o/g1mUmyui</a></p>',
    dates: [
      "9월 28일",
      "9월 29일",
      "9월 30일"
    ]
  },

  "npl-intro": {
    title: "경매 & NPL 입문과정",
    status: "open",
    poster: "/images/seminar/seminar-4.png",
    summary: "/images/seminar/npl-intro-detail.png",
    schedule: "경매 8/24·8/31 · NPL 9/14·9/21 (오후 6시 30분~8시 30분)",
    place: "호텔 더 디자이너스 리즈강남프리미어 B1F",
    fee: "각 과정 2주 30만원 (부가세 포함) · 할인 별도",
    payment: true,
    dateHint: "(중복 선택 가능 · 매 회차 오후 6시 30분~8시 30분)",
    info:
      '<h3>강의 참가비</h3>' +
      '<ul>' +
        '<li>경매 입문과정 2주 <b>30만원</b> (부가세 포함)</li>' +
        '<li>NPL 입문과정 2주 <b>30만원</b> (부가세 포함)</li>' +
      '</ul>' +
      '<p class="info-note">* 고함방 오픈채팅방 참여자 대상 각 과정 50% 할인 (15만원)<br>' +
      '* 공인중개사 대상 각 과정 80% 할인 (6만원)</p>' +
      '<h3>정원</h3>' +
      '<p>각 20명 (선착순)</p>' +
      '<h3>&ldquo;고종완과 함께&rdquo; 오픈채팅방</h3>' +
      '<p><a href="https://open.kakao.com/o/g1mUmyui" target="_blank" rel="noopener">open.kakao.com/o/g1mUmyui</a></p>' +
      '<h3>오시는 길</h3>' +
      '<p>호텔 더 디자이너스 리즈강남프리미어 B1F [Joie de Vivre]<br>' +
      '<span class="info-sub">강남구 봉은사로 113 · 유료 주차 가능</span></p>' +
      '<img class="info-map" src="/images/seminar/seminar_location.jpeg" alt="오시는 길 지도" onerror="this.style.display=\'none\'">' +
      '<p><a href="https://map.kakao.com/?q=%ED%98%B8%ED%85%94%20%EB%8D%94%20%EB%94%94%EC%9E%90%EC%9D%B4%EB%84%88%EC%8A%A4%20%EB%A6%AC%EC%A6%88%EA%B0%95%EB%82%A8%ED%94%84%EB%A6%AC%EB%AF%B8%EC%96%B4" target="_blank" rel="noopener">카카오맵에서 위치 보기 →</a></p>',
    dates: [
      "경매 입문 과정 (8/24, 8/31)",
      "NPL 입문 과정 (9/14, 9/21)"
    ]
  }
};
