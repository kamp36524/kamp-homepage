/* =====================================================================
   세미나 공용 데이터 (세미나 목록 배너 + 신청 페이지가 함께 사용)
   - 세미나를 추가/수정하려면 이 파일만 고치면 됩니다.
     · title    : 세미나 제목
     · status   : "open"(진행 중) | "ended"(종료)
     · poster   : 목록 배너용 포스터 이미지
     · summary  : 신청 페이지 상세(요약) 이미지
     · schedule : 일정 (배너 표시)
     · place    : 장소 (배너 표시)
     · fee      : 참가비 (배너 표시)
     · info     : 신청 페이지 안내 HTML
     · dates    : 신청 폼의 신청일 목록(중복 선택 가능)
   ===================================================================== */
window.SEMINARS_DATA = {
  "npl-intro": {
    title: "경매 & NPL 입문과정",
    status: "open",
    poster: "/images/seminar/seminar-4.png",
    summary: "/images/seminar/npl-intro-detail.png",
    schedule: "경매 8/24·8/31 · NPL 9/14·9/21 (오후 6:30~9:30)",
    place: "호텔 더 디자이너스 리즈강남프리미어 B1F",
    fee: "각 과정 2주 30만원 (부가세 포함) · 할인 별도",
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
      '<span class="info-sub">강남구 선릉로 806 · 유료 주차 가능</span></p>' +
      '<img class="info-map" src="/images/seminar/npl-intro-map.png" alt="오시는 길 지도" onerror="this.style.display=\'none\'">' +
      '<p><a href="https://map.kakao.com/?q=%ED%98%B8%ED%85%94%20%EB%8D%94%20%EB%94%94%EC%9E%90%EC%9D%B4%EB%84%88%EC%8A%A4%20%EB%A6%AC%EC%A6%88%EA%B0%95%EB%82%A8%ED%94%84%EB%A6%AC%EB%AF%B8%EC%96%B4" target="_blank" rel="noopener">카카오맵에서 위치 보기 →</a></p>',
    dates: [
      "경매 입문 과정 (8/24, 8/31)",
      "NPL 입문 과정 (9/14, 9/21)"
    ]
  }
};
