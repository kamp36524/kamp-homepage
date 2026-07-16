document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#consult-form");
  const message = document.querySelector("#form-message");
  if (!form || !message) return;

  form.addEventListener("submit", async (event) => {
    const endpoint = form.getAttribute("action");

    if (!endpoint || endpoint.includes("REPLACE_WITH_YOUR_FORM_ID")) {
      event.preventDefault();
      message.className = "form-message show error";
      message.textContent = "상담 접수 주소가 아직 연결되지 않았습니다. consult.html의 Formspree 주소를 설정하세요.";
      return;
    }

    event.preventDefault();
    message.className = "form-message";
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
      message.className = "form-message show success";
      message.textContent = "상담 신청이 접수되었습니다. 확인 후 연락드리겠습니다.";
    } catch (error) {
      message.className = "form-message show error";
      message.textContent = "접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "상담 신청하기";
    }
  });
});
