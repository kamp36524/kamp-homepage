/* 세미나 목록 페이지 — 진행 중인 세미나 배너를 공용 데이터로 채웁니다.
   (진행 중 세미나가 여러 개면 모두 표시) */
document.addEventListener("DOMContentLoaded", function () {
  var wrap = document.getElementById("active-seminars");
  if (!wrap) return;

  var all = window.SEMINARS_DATA || {};
  var open = [], ended = [];
  for (var k in all) {
    if (!all[k]) continue;
    if (all[k].status === "open") open.push({ id: k, s: all[k] });
    else if (all[k].status === "ended") ended.push({ id: k, s: all[k] });
  }

  // 진행 중인 세미나가 없으면 섹션 숨김
  if (!open.length) {
    var section = wrap.closest("section");
    if (section) section.hidden = true;
  } else {
    wrap.innerHTML = "";
    open.forEach(function (o) { wrap.appendChild(buildCard(o.id, o.s)); });
  }

  // 종료된 세미나를 '지난 세미나' 목록 앞쪽에 카드로 추가
  var pastWrap = document.getElementById("past-seminars");
  if (pastWrap && ended.length) {
    ended.forEach(function (o) { pastWrap.insertBefore(buildPastCard(o.id, o.s), pastWrap.firstChild); });
  }

  function buildCard(id, s) {
    var a = document.createElement("a");
    a.className = "seminar-feature card";
    a.setAttribute("href", "/seminar-apply?id=" + id);
    a.innerHTML =
      '<div class="feature-image">' +
        '<img src="' + attr(s.poster) + '" alt="' + attr(s.title) + '">' +
      "</div>" +
      '<div class="feature-body">' +
        '<span class="feature-badge">진행 중 · 신청 접수</span>' +
        '<h3 class="feature-title">' + esc(s.title) + "</h3>" +
        '<ul class="feature-meta">' +
          row("일정", s.schedule) +
          row("장소", s.place) +
          row("참가비", s.fee) +
        "</ul>" +
        '<span class="btn btn-primary feature-cta">신청하기 →</span>' +
      "</div>";
    // 포스터(썸네일) 이미지가 없으면 상세 이미지로 대체
    var img = a.querySelector(".feature-image img");
    if (img && s.summary && s.summary !== s.poster) {
      img.onerror = function () { img.onerror = null; img.src = s.summary; };
    }
    return a;
  }

  // 지난 세미나 카드(종료) — 이미지 + 종료 배지, 클릭 시 상세(안내 이미지) 보기
  function buildPastCard(id, s) {
    var a = document.createElement("a");
    a.className = "seminar-card seminar-end is-link";
    a.setAttribute("href", "/seminar-apply?id=" + id);
    a.innerHTML =
      '<div class="seminar-image">' +
        '<img src="' + attr(s.poster || s.summary || "") + '" alt="' + attr(s.title) + '">' +
        '<span class="seminar-status ended">종료</span>' +
      "</div>";
    return a;
  }

  function row(label, val) {
    if (!val) return "";
    return "<li><b>" + esc(label) + "</b><span>" + esc(val) + "</span></li>";
  }
  function esc(t) {
    return String(t == null ? "" : t)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function attr(t) { return esc(t).replace(/"/g, "&quot;"); }
});
