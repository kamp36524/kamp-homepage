/* =====================================================================
   공지사항 게시판 — Google Sheet 를 데이터 소스로 사용
   ---------------------------------------------------------------------
   · 시트 1행 헤더(정확히): 날짜 | 제목 | 내용 | 고정   (고정 열은 선택)
   · 시트를 "링크가 있는 모든 사용자: 뷰어"로 공유하면 읽을 수 있습니다.
   · 아래 CFG.sheetId 에 스프레드시트 ID를 넣으세요.
   ===================================================================== */
(function () {
  var CFG = {
    sheetId: "",            // TODO: 공지사항 스프레드시트 ID
    sheetName: "공지사항",   // 탭(시트) 이름
    previewCount: 3         // 홈 미리보기 개수
  };

  document.addEventListener("DOMContentLoaded", function () {
    var board = document.getElementById("notice-list");
    var preview = document.getElementById("notice-preview-list");
    if (!board && !preview) return;

    // 렌더링 테스트용 mock (운영에는 영향 없음)
    if (window.__NOTICES_MOCK__) {
      handle(window.__NOTICES_MOCK__.slice(), board, preview);
      return;
    }

    if (!CFG.sheetId) {
      setMsg(board, "공지사항을 준비 중입니다.");
      setMsg(preview, "공지사항을 준비 중입니다.");
      return;
    }

    loadCharts(function () {
      try {
        var url = "https://docs.google.com/spreadsheets/d/" + CFG.sheetId +
                  "/gviz/tq?sheet=" + encodeURIComponent(CFG.sheetName);
        var query = new google.visualization.Query(url);
        query.send(function (resp) {
          if (!resp || resp.isError()) { fail(board, preview); return; }
          handle(toItems(resp.getDataTable()), board, preview);
        });
      } catch (e) { fail(board, preview); }
    }, function () { fail(board, preview); });
  });

  function handle(items, board, preview) {
    items.sort(sortNotices);
    if (board) renderBoard(board, items);
    if (preview) renderPreview(preview, items.slice(0, CFG.previewCount));
  }

  /* ---------- Google Charts 로더 ---------- */
  function loadCharts(onReady, onErr) {
    function ready() {
      google.charts.load("current", { packages: ["corechart"] });
      google.charts.setOnLoadCallback(onReady);
    }
    if (window.google && window.google.charts) return ready();
    var s = document.createElement("script");
    s.src = "https://www.gstatic.com/charts/loader.js";
    s.onload = ready;
    s.onerror = onErr;
    document.head.appendChild(s);
  }

  /* ---------- 데이터 변환 ---------- */
  function toItems(dt) {
    var cols = dt.getNumberOfColumns(), rows = dt.getNumberOfRows(), idx = {};
    for (var c = 0; c < cols; c++) idx[(dt.getColumnLabel(c) || "").trim()] = c;
    var dC = pick(idx, ["날짜", "일자", "date"]);
    var tC = pick(idx, ["제목", "title"]);
    var bC = pick(idx, ["내용", "본문", "content"]);
    var pC = pick(idx, ["고정", "중요", "pin"]);
    var out = [];
    for (var r = 0; r < rows; r++) {
      var title = tC != null ? String(dt.getFormattedValue(r, tC) || "").trim() : "";
      if (!title) continue;
      out.push({
        date: dC != null ? String(dt.getFormattedValue(r, dC) || "").trim() : "",
        title: title,
        body: bC != null ? String(dt.getValue(r, bC) == null ? "" : dt.getValue(r, bC)) : "",
        pinned: pC != null ? isTrue(dt.getFormattedValue(r, pC)) : false,
        _sort: dC != null ? sortKey(dt.getValue(r, dC), dt.getFormattedValue(r, dC)) : 0
      });
    }
    return out;
  }
  function pick(idx, names) { for (var i = 0; i < names.length; i++) if (idx[names[i]] != null) return idx[names[i]]; return null; }
  function isTrue(v) { v = String(v || "").trim().toLowerCase(); return v === "y" || v === "true" || v === "1" || v === "o" || v === "고정" || v === "중요" || v === "✓"; }
  function sortKey(v, f) {
    if (v instanceof Date) return v.getTime();
    var t = Date.parse(f || v); return isNaN(t) ? 0 : t;
  }
  function sortNotices(a, b) {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b._sort - a._sort;
  }

  /* ---------- 렌더링 ---------- */
  function renderBoard(el, items) {
    if (!items.length) { setMsg(el, "등록된 공지사항이 없습니다."); return; }
    el.innerHTML = "";
    items.forEach(function (it) {
      var li = document.createElement("li");
      li.className = "notice-item" + (it.pinned ? " pinned" : "");
      li.innerHTML =
        '<button type="button" class="notice-item-btn">' +
          (it.pinned ? '<span class="notice-pin">고정</span>' : "") +
          '<span class="notice-item-title">' + esc(it.title) + "</span>" +
          '<span class="notice-item-date">' + esc(it.date) + "</span>" +
        "</button>";
      li.querySelector("button").addEventListener("click", function () { openModal(it); });
      el.appendChild(li);
    });
  }

  function renderPreview(el, items) {
    if (!items.length) { setMsg(el, "등록된 공지사항이 없습니다."); return; }
    el.innerHTML = "";
    items.forEach(function (it) {
      var li = document.createElement("li");
      li.innerHTML =
        '<a href="/notices.html">' +
          (it.pinned ? '<span class="notice-pin">고정</span>' : "") +
          '<span class="notice-item-title">' + esc(it.title) + "</span>" +
          '<span class="notice-item-date">' + esc(it.date) + "</span>" +
        "</a>";
      el.appendChild(li);
    });
  }

  /* ---------- 상세 모달 ---------- */
  function openModal(it) {
    var modal = document.getElementById("notice-modal");
    if (!modal) return;
    modal.querySelector(".nm-title").textContent = it.title;
    modal.querySelector(".nm-date").textContent = it.date;
    modal.querySelector(".nm-body").innerHTML = bodyHtml(it.body);
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
  }
  function closeModal() {
    var modal = document.getElementById("notice-modal");
    if (!modal) return;
    modal.classList.remove("open");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKey);
  }
  function onKey(e) { if (e.key === "Escape") closeModal(); }
  document.addEventListener("DOMContentLoaded", function () {
    var modal = document.getElementById("notice-modal");
    if (!modal) return;
    modal.querySelectorAll("[data-close]").forEach(function (el) { el.addEventListener("click", closeModal); });
  });

  /* ---------- 유틸 ---------- */
  function setMsg(el, msg) { if (el) el.innerHTML = '<li class="notice-empty">' + esc(msg) + "</li>"; }
  function fail(board, preview) { setMsg(board, "공지사항을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."); setMsg(preview, "공지사항을 불러오지 못했습니다."); }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function bodyHtml(s) {
    return esc(s).replace(/\r\n|\r|\n/g, "<br>")
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  }
})();
