document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#consult-form");
  const message = document.querySelector("#form-message");
  if (!form || !message) return;

  // 연락처: 입력 시 자동으로 010-0000-0000 형식으로 하이픈 삽입
  const phoneInput = form.phone;
  if (phoneInput) {
    phoneInput.addEventListener("input", () => {
      const d = phoneInput.value.replace(/\D/g, "").slice(0, 11);
      if (d.length < 4) phoneInput.value = d;
      else if (d.length < 8) phoneInput.value = d.slice(0, 3) + "-" + d.slice(3);
      else phoneInput.value = d.slice(0, 3) + "-" + d.slice(3, 7) + "-" + d.slice(7);
    });
  }

  let submitting = false;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitting) return;                 // 중복 제출 방지
    message.className = "form-message";

    const endpoint = form.getAttribute("action");
    if (!endpoint || endpoint.includes("REPLACE_WITH_YOUR_FORM_ID")) {
      return showMsg("error", "상담 접수 주소가 아직 연결되지 않았습니다. 관리자에게 문의해 주세요.");
    }

    // 기본 검증
    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    if (!name) return showMsg("error", "이름을 입력해 주세요.");
    const phoneDigits = phone.replace(/\D/g, "");
    if (!/^01[0-9]\d{7,8}$/.test(phoneDigits)) {
      return showMsg("error", "연락처를 010-0000-0000 형식으로 정확히 입력해 주세요.");
    }
    form.phone.value = phoneDigits.replace(/^(\d{3})(\d{3,4})(\d{4})$/, "$1-$2-$3");
    if (!form.category.value) return showMsg("error", "상담 분야를 선택해 주세요.");
    if (!form.content.value.trim()) return showMsg("error", "상담 내용을 입력해 주세요.");
    if (!form.privacy_agreement.checked) {
      return showMsg("error", "개인정보 수집·이용에 동의해 주세요.");
    }

    // 검증 통과 즉시 버튼 잠금(전송 전)
    const submitButton = form.querySelector("button[type='submit']");
    submitting = true;
    submitButton.disabled = true;
    submitButton.textContent = "접수 중...";

    try {
      // Apps Script 웹앱은 CORS 응답 헤더가 없으므로 no-cors로 전송(fire-and-forget).
      // x-www-form-urlencoded 로 보내면 체크박스 다중값(상담 목적)이 안정적으로 전달됩니다.
      await fetch(endpoint, {
        method: "POST",
        body: new URLSearchParams(new FormData(form)),
        mode: "no-cors"
      });
      form.reset();
      showMsg("success", "상담 신청이 접수되었습니다. 확인 후 연락드리겠습니다.");
    } catch (error) {
      showMsg("error", "접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      submitting = false;
      submitButton.disabled = false;
      submitButton.textContent = "상담 신청하기";
    }
  });

  function showMsg(type, text) {
    message.className = "form-message show " + type;
    message.textContent = text;
  }
});
