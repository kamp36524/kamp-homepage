/* 세미나 목록 페이지 — 진행 중 세미나 배너를 공용 데이터로 채웁니다. */
document.addEventListener("DOMContentLoaded", function () {
  var feat = document.getElementById("active-seminar");
  if (!feat) return;

  var all = window.SEMINARS_DATA || {};
  var id = null, s = null;
  for (var k in all) {
    if (all[k] && all[k].status === "open") { id = k; s = all[k]; break; }
  }

  // 진행 중인 세미나가 없으면 배너 숨김
  if (!s) { feat.hidden = true; return; }

  feat.setAttribute("href", "/seminar-apply?id=" + id);

  var img = feat.querySelector(".feature-image img");
  if (img) { img.src = s.poster || ""; img.alt = s.title || ""; }

  var titleEl = feat.querySelector(".feature-title");
  if (titleEl) titleEl.textContent = s.title || "";

  var meta = feat.querySelector(".feature-meta");
  if (meta) {
    meta.innerHTML =
      row("일정", s.schedule) +
      row("장소", s.place) +
      row("참가비", s.fee);
  }

  function row(label, val) {
    if (!val) return "";
    return "<li><b>" + esc(label) + "</b><span>" + esc(val) + "</span></li>";
  }
  function esc(t) {
    return String(t == null ? "" : t)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
});
