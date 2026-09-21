/* =====================================================================
   세미나 신청 페이지 로직
   - 세미나 데이터는 js/seminars-data.js (window.SEMINARS_DATA) 에서 관리합니다.
   - URL 쿼리스트링(?id=...)으로 세미나를 선택합니다.
   ===================================================================== */
const SEMINARS = window.SEMINARS_DATA || {};

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
  titleEl.textContent = seminar.title;
  document.title = seminar.title + " 신청 | 한국자산관리원";

  if (seminar.summary) {
    imgEl.onerror = () => { imgEl.hidden = true; };
    imgEl.src = seminar.summary;
    imgEl.alt = seminar.title + " 안내 이미지";
    imgEl.hidden = false;
  }

  if (seminar.info && seminar.info.trim()) {
    infoEl.innerHTML = seminar.info;
    infoEl.hidden = false;
  }

  idField.value = id;
  titleField.value = seminar.title;

  // 신청일 안내 문구 (세미나별)
  const hintEl = document.querySelector("#date-hint");
  if (hintEl && seminar.dateHint) hintEl.textContent = seminar.dateHint;

  // 입금 안내(계좌·결제) 영역: 세미나별로 표시 여부 결정
  const payBox = form.querySelector(".pay-box");
  if (payBox && seminar.payment !== true) payBox.hidden = true;

  // 안내 이미지(요약/지도) 클릭 시 크게 보기
  setupLightbox(document.querySelector(".seminar-apply-info"));

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

  // 연락처: 입력 시 자동으로 010-0000-0000 형식으로 하이픈 삽입
  const phoneInput = form.phone;
  phoneInput.addEventListener("input", () => {
    const d = phoneInput.value.replace(/\D/g, "").slice(0, 11);
    if (d.length < 4) phoneInput.value = d;
    else if (d.length < 8) phoneInput.value = d.slice(0, 3) + "-" + d.slice(3);
    else phoneInput.value = d.slice(0, 3) + "-" + d.slice(3, 7) + "-" + d.slice(7);
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

    // 연락처: 010 형식(휴대폰) 검증 후 하이픈 형태로 정규화하여 저장
    const phoneDigits = phone.replace(/\D/g, "");
    if (!/^01[0-9]\d{7,8}$/.test(phoneDigits)) {
      return showMessage(message, "error", "연락처를 010-0000-0000 형식으로 정확히 입력해 주세요.");
    }
    form.phone.value = phoneDigits.replace(/^(\d{3})(\d{3,4})(\d{4})$/, "$1-$2-$3");

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

// 안내 이미지 확대 보기(라이트박스): scope 안의 이미지를 클릭하면 원본을 크게 표시
function setupLightbox(scope) {
  if (!scope) return;
  var box = document.getElementById("img-lightbox");
  if (!box) {
    box = document.createElement("div");
    box.id = "img-lightbox";
    box.className = "img-lightbox";
    box.innerHTML = '<button type="button" class="img-lightbox-x" aria-label="닫기">&times;</button><img alt="확대 이미지">';
    document.body.appendChild(box);
    box.addEventListener("click", function (e) {
      if (e.target === box || e.target.classList.contains("img-lightbox-x")) closeLightbox();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeLightbox(); });
  }
  scope.addEventListener("click", function (e) {
    var t = e.target;
    if (t && t.tagName === "IMG" && !t.hidden && t.currentSrc !== "") {
      box.querySelector("img").src = t.currentSrc || t.src;
      box.classList.add("open");
      document.body.style.overflow = "hidden";
    }
  });
}
function closeLightbox() {
  var box = document.getElementById("img-lightbox");
  if (!box) return;
  box.classList.remove("open");
  document.body.style.overflow = "";
}
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, "&quot;");
}
