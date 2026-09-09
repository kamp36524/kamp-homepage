/* 홈페이지 공지 팝업 (딥페이크 사칭 주의) */
document.addEventListener("DOMContentLoaded", () => {
  const KEY = "kamp-notice-deepfake-until";
  const popup = document.getElementById("notice-popup");
  if (!popup) return;

  // '오늘 하루 보지 않기'를 눌러 유효기간이 남아 있으면 표시하지 않음
  try {
    const until = localStorage.getItem(KEY);
    if (until && Number(until) > Date.now()) return;
  } catch (e) {}

  const hideBox = document.getElementById("notice-hide-today");

  function onKey(e) { if (e.key === "Escape") close(); }

  function open() {
    popup.classList.add("open");
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
  }

  function close() {
    if (hideBox && hideBox.checked) {
      try {
        const end = new Date();
        end.setHours(23, 59, 59, 999); // 오늘 자정까지 숨김
        localStorage.setItem(KEY, String(end.getTime()));
      } catch (e) {}
    }
    popup.classList.remove("open");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKey);
  }

  popup.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", close));
  open();
});
