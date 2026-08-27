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
    title: "경매 &amp; NPL 입문",
    summary: "/images/seminar/seminar-4.png",
    info: "부동산 경매·NPL 투자의 기초부터 실전 감각까지 한 번에 잡는 입문 과정입니다.<br>아래에서 참석 가능한 일정을 선택해 신청해 주세요.",
    // TODO: 실제 강의 일자로 교체하세요.
    dates: [
      "2026-09-06 (토) 14:00",
      "2026-09-13 (토) 14:00",
      "2026-09-20 (토) 14:00"
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
      const response = await fetch(endpoint, {
        method: "POST",
        body: new FormData(form),
        headers: { "Accept": "application/json" }
      });
      if (!response.ok) throw new Error("접수 실패");

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
