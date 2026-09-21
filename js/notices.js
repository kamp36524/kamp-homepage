/* =====================================================================
   공지사항 게시판 — Google Sheet 를 데이터 소스로 사용
   ---------------------------------------------------------------------
   · 시트 1행 헤더(정확히): 날짜 | 제목 | 내용 | 고정 | 이미지 | 분류
     (고정·이미지·분류 열은 선택)
   · 이미지 열: 상세 모달에 표시할 이미지 주소(/images/notice/파일.png 또는 https URL).
     줄바꿈/쉼표로 여러 장 가능. 비워두면 이미지 없이 표시.
   · 분류 열: 공지 카테고리(예: 공지/세미나/이벤트). 목록·미리보기·상세에 배지로 표시.
     비워두면 배지 없이 표시.
   · 시트를 "링크가 있는 모든 사용자: 뷰어"로 공유하면 읽을 수 있습니다.
   · 아래 CFG.sheetId 에 스프레드시트 ID를 넣으세요.
   ===================================================================== */
(function () {
  var CFG = {
    sheetId: "1ZzSS3VLhrPxN93C8w9EIVTIcTu3kf4UdAf7H97yLTfY", // 공지사항 스프레드시트
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
                  "/gviz/tq?headers=1&sheet=" + encodeURIComponent(CFG.sheetName);
        var query = new google.visualization.Query(url);
        query.send(function (resp) {
          if (!resp || resp.isError()) { fail(board, preview); return; }
          handle(toItems(resp.getDataTable()), board, preview);
        });
      } catch (e) { fail(board, preview); }
    }, function () { fail(board, preview); });
  });

  var _items = null;

  function handle(items, board, preview) {
    items.sort(sortNotices);
    _items = items;
    if (board) renderBoard(board, items);
    if (preview) renderPreview(preview, items.slice(0, CFG.previewCount));
    wirePopup();
  }

  // 홈 공지 팝업의 링크를 눌렀을 때 해당 공지글을 상세 모달로 바로 열기
  function wirePopup() {
    var triggers = document.querySelectorAll("[data-notice-open]");
    for (var i = 0; i < triggers.length; i++) {
      (function (t) {
        if (t.__wired) return; t.__wired = true;
        t.addEventListener("click", function (e) {
          var it = pickPopupNotice(_items);
          if (!it) return; // 공지 로드 전/없음 → href(/notices.html)로 이동
          e.preventDefault();
          var pop = document.getElementById("notice-popup");
          if (pop) pop.classList.remove("open");
          openModal(it);
        });
      })(triggers[i]);
    }
  }

  function pickPopupNotice(items) {
    if (!items || !items.length) return null;
    var kws = ["딥페이크", "사칭"];
    for (var i = 0; i < items.length; i++) {
      for (var k = 0; k < kws.length; k++) {
        if ((items[i].title || "").indexOf(kws[k]) >= 0) return items[i];
      }
    }
    for (var j = 0; j < items.length; j++) if (items[j].pinned) return items[j];
    return items[0];
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
    var iC = pick(idx, ["이미지", "사진", "image", "img"]);
    var cC = pick(idx, ["분류", "카테고리", "구분", "category"]);
    // 헤더 라벨 인식이 실패하면 열 순서(날짜|제목|내용|고정|이미지|분류)로 대체
    if (tC == null) {
      dC = cols > 0 ? 0 : null;
      tC = cols > 1 ? 1 : null;
      bC = cols > 2 ? 2 : null;
      pC = cols > 3 ? 3 : null;
      iC = cols > 4 ? 4 : null;
      cC = cols > 5 ? 5 : null;
    }
    var out = [];
    for (var r = 0; r < rows; r++) {
      var title = tC != null ? String(dt.getFormattedValue(r, tC) || "").trim() : "";
      if (!title) continue;
      if (title === "제목") continue; // 헤더 행이 데이터로 섞인 경우 방지
      out.push({
        date: dC != null ? String(dt.getFormattedValue(r, dC) || "").trim() : "",
        title: title,
        category: cC != null ? String(dt.getFormattedValue(r, cC) || "").trim() : "",
        body: bC != null ? String(dt.getValue(r, bC) == null ? "" : dt.getValue(r, bC)) : "",
        images: iC != null ? splitImages(dt.getFormattedValue(r, iC)) : [],
        pinned: pC != null ? isTrue(dt.getFormattedValue(r, pC)) : false,
        _sort: dC != null ? sortKey(dt.getValue(r, dC), dt.getFormattedValue(r, dC)) : 0
      });
    }
    return out;
  }
  function pick(idx, names) { for (var i = 0; i < names.length; i++) if (idx[names[i]] != null) return idx[names[i]]; return null; }
  // 이미지 셀: 줄바꿈/쉼표로 여러 개 구분.
  // http(s):// 는 그대로, 그 외(images/... , /images/...)는 앞에 / 를 붙여 절대경로화.
  function splitImages(s) {
    s = String(s == null ? "" : s).trim();
    if (!s) return [];
    return s.split(/[\n,]+/)
      .map(function (t) { return t.trim(); })
      .filter(Boolean)
      .map(function (t) { return /^https?:\/\//i.test(t) ? t : "/" + t.replace(/^\/+/, ""); });
  }
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
          (it.category ? '<span class="notice-cat">' + esc(it.category) + "</span>" : "") +
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
          (it.category ? '<span class="notice-cat">' + esc(it.category) + "</span>" : "") +
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
    renderCategory(modal, it.category);
    renderImages(modal, it.images);
    modal.querySelector(".nm-body").innerHTML = bodyHtml(it.body);
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
  }
  // 상세 모달 안에 분류(카테고리) 배지를 표시. HTML 수정 없이 제목 위에 주입.
  function renderCategory(modal, cat) {
    var host = modal.querySelector(".nm-cat");
    if (!host) {
      host = document.createElement("div");
      host.className = "nm-cat";
      var title = modal.querySelector(".nm-title");
      title.parentNode.insertBefore(host, title);
    }
    if (!cat) { host.hidden = true; host.textContent = ""; return; }
    host.hidden = false;
    host.innerHTML = '<span class="notice-cat">' + esc(cat) + "</span>";
  }

  // 상세 모달 안에 공지 이미지를 렌더링 (본문 위). HTML 수정 없이 컨테이너를 주입.
  function renderImages(modal, urls) {
    var host = modal.querySelector(".nm-image");
    if (!host) {
      host = document.createElement("div");
      host.className = "nm-image";
      var body = modal.querySelector(".nm-body");
      body.parentNode.insertBefore(host, body);
    }
    host.innerHTML = "";
    if (!urls || !urls.length) { host.hidden = true; return; }
    host.hidden = false;
    urls.forEach(function (u) {
      var img = document.createElement("img");
      img.src = u;
      img.alt = "공지 이미지";
      img.loading = "lazy";
      img.onerror = function () { img.remove(); };
      host.appendChild(img);
    });
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
    var out = esc(s).replace(/\r\n|\r|\n/g, "<br>");
    // http(s):// 링크, www. 링크, 그리고 스킴 없는 도메인(.com/.kr/.kakao 등)도 자동 링크
    var re = /(https?:\/\/[^\s<]+)|(www\.[^\s<]+)|([a-zA-Z0-9][a-zA-Z0-9.\-]*\.(?:com|net|org|io|me|tv|info|biz|kr|kakao)(?:\/[^\s<]*)?)/g;
    return out.replace(re, function (m) {
      var href = /^https?:\/\//i.test(m) ? m : "https://" + m;
      return '<a href="' + href + '" target="_blank" rel="noopener">' + m + "</a>";
    });
  }
})();
