/* =====================================================================
   세미나 신청 페이지 로직
   - URL 쿼리스트링(?id=...)으로 세미나를 선택합니다.
   - 아래 SEMINARS 객체에 세미나를 추가/수정하면 됩니다.
     · title   : 세미나 제목 (필수)
     · summary : 정보 요약 이미지 경로 (필수)
     · info    : 이미지 외에 노출할 텍스트(HTML 허용, 없으면 '' 또는 생략)
     · dates   : 신청 가능한 강의 일자 목록(중복 선택 가능). 빈 배열이면 날짜 선택 없이 신청.
   ===================================================================== */
const SEMINARS = {
  "npl-intro": {
    title: "경매 &amp; NPL 입문과정",
    summary: "/images/seminar/npl-intro-detail.png",
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
      "경매 입문 1주차 (8/24)",
      "경매 입문 2주차 (8/31)",
      "NPL 입문 1주차 (9/14)",
      "NPL 입문 2주차 (9/21)"
    ]
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const seminar = id && SEMINARS[id];

  const titleEl = document.querySelector("#seminar-title");
  const imgEl = document.querySelector("#seminar-summary");
  const infoEl = document.querySelector("#seminar-info-text");
  const dateList = document.querySelector("#date-list");
  const form = document.querySelector("#apply-form");
  const message = document.querySelector("#form-message");
  const idField = document.querySelector("#seminarId");
  const titleField = document.querySelector("#seminarTitle");

  // 잘못된 접근 처리
  if (!seminar) {
    titleEl.textContent = "세미나를 찾을 수 없습니다";
    dateList.innerHTML = '<p class="date-empty">신청할 세미나가 선택되지 않았습니다.</p>';
    infoEl.hidden = false;
    infoEl.innerHTML = '<a class="btn btn-outline" href="/seminar">세미나 목록으로 이동</a>';
    form.hidden = true;
    return;
  }

  // 세미나 정보 렌더링
  titleEl.innerHTML = seminar.title;
  document.title = seminar.title.replace(/&amp;/g, "&") + " 신청 | 한국자산관리원";

  if (seminar.summary) {
    imgEl.onerror = () => { imgEl.hidden = true; };
    imgEl.src = seminar.summary;
    imgEl.alt = seminar.title.replace(/&amp;/g, "&") + " 안내 이미지";
    imgEl.hidden = false;
  }

  if (seminar.info && seminar.info.trim()) {
    infoEl.innerHTML = seminar.info;
    infoEl.hidden = false;
  }

  idField.value = id;
  titleField.value = seminar.title.replace(/&amp;/g, "&");

  // 신청일 체크박스 렌더링
  const dates = Array.isArray(seminar.dates) ? seminar.dates : [];
  if (dates.length) {
    dateList.innerHTML = dates.map((d, i) => {
      const val = String(d);
      return '<label class="date-option">' +
             '<input type="checkbox" name="dates" value="' + escapeAttr(val) + '">' +
             '<span>' + escapeHtml(val) + '</span></label>';
    }).join("");
  } else {
    // 일자 목록이 없으면 날짜 선택 없이 신청
    dateList.innerHTML = '<p class="date-empty">별도 지정 일정 없이 신청이 접수됩니다.</p>';
  }

  // 결제 방법: 두 체크박스는 하나만 선택되도록 처리
  const payChecks = form.querySelectorAll('input[name="payment"]');
  payChecks.forEach((box) => {
    box.addEventListener("change", () => {
      if (box.checked) payChecks.forEach((o) => { if (o !== box) o.checked = false; });
    });
  });

  // 제출
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.className = "form-message";

    const endpoint = form.getAttribute("action");
    if (!endpoint) {
      showMessage(message, "error", "신청 접수 주소가 아직 연결되지 않았습니다. 관리자에게 문의해 주세요.");
      return;
    }

    // 기본 검증
    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    if (!name) return showMessage(message, "error", "이름을 입력해 주세요.");
    if (!phone) return showMessage(message, "error", "연락처를 입력해 주세요.");

    if (dates.length) {
      const checked = form.querySelectorAll('input[name="dates"]:checked');
      if (checked.length === 0) return showMessage(message, "error", "신청일을 하나 이상 선택해 주세요.");
    }
    if (!form.privacy_agreement.checked) {
      return showMessage(message, "error", "개인정보 수집·이용에 동의해 주세요.");
    }

    const submitButton = form.querySelector("button[type='submit']");
    submitButton.disabled = true;
    submitButton.textContent = "접수 중...";

    try {
      // Google Apps Script 웹앱은 CORS 응답 헤더를 제공하지 않으므로 no-cors로 전송합니다.
      // (응답 본문은 읽을 수 없어 opaque 처리되며, 데이터는 정상 전송됩니다.)
      // FormData(multipart) 대신 x-www-form-urlencoded 로 전송하면 Apps Script가
      // e.parameter / e.parameters 로 안정적으로 파싱합니다. (체크박스 다중값 유지)
      await fetch(endpoint, {
        method: "POST",
        body: new URLSearchParams(new FormData(form)),
        mode: "no-cors"
      });

      form.reset();
      showMessage(message, "success", "세미나 신청이 접수되었습니다. 확인 후 안내드리겠습니다.");
    } catch (error) {
      showMessage(message, "error", "접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "세미나 신청하기";
    }
  });
});

function showMessage(el, type, text) {
  el.className = "form-message show " + type;
  el.textContent = text;
}
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, "&quot;");
}
