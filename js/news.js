/* =====================================================================
   KAMP 소식 — Google Sheet 를 데이터 소스로 사용하는 갤러리
   ---------------------------------------------------------------------
   · 시트 1행 헤더(정확히): 날짜 | 제목 | 분류 | 내용 | 이미지 | 동영상
       - 분류/내용/이미지/동영상 열은 선택
       - 이미지: images/news/파일.jpg (맨 앞 / 는 있어도 없어도 됨) 또는 https URL.
                 줄바꿈/쉼표로 여러 장. 첫 번째 이미지가 카드 대표(썸네일)로 쓰입니다.
                 번호 범위 문법 지원: images/news/name_[1-10].jpg → 1~10 자동 확장.
       - 동영상: 유튜브 링크. 줄바꿈/쉼표로 여러 개 가능.
   · 시트를 "링크가 있는 모든 사용자: 뷰어"로 공유하면 읽을 수 있습니다.
   · 아래 CFG.sheetId 에 스프레드시트 ID를 넣으세요. (비어 있으면 준비 중 안내)
   ===================================================================== */
(function () {
  var CFG = {
    sheetId: "1ZzSS3VLhrPxN93C8w9EIVTIcTu3kf4UdAf7H97yLTfY",  // 공지사항 문서(소식 탭)
    sheetName: "소식"     // 탭(시트) 이름
  };

  document.addEventListener("DOMContentLoaded", function () {
    var grid = document.getElementById("news-list");
    if (!grid) return;

    // 렌더링 테스트용 mock (운영에는 영향 없음)
    if (window.__NEWS_MOCK__) {
      handle(window.__NEWS_MOCK__.slice(), grid);
      return;
    }

    if (!CFG.sheetId) {
      setMsg(grid, "소식을 준비 중입니다.");
      return;
    }

    loadCharts(function () {
      try {
        var url = "https://docs.google.com/spreadsheets/d/" + CFG.sheetId +
                  "/gviz/tq?headers=1&sheet=" + encodeURIComponent(CFG.sheetName);
        var query = new google.visualization.Query(url);
        query.send(function (resp) {
          if (!resp || resp.isError()) { fail(grid); return; }
          handle(toItems(resp.getDataTable()), grid);
        });
      } catch (e) { fail(grid); }
    }, function () { fail(grid); });
  });

  function handle(items, grid) {
    items.sort(function (a, b) { return b._sort - a._sort; });
    renderGrid(grid, items);
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
    var cC = pick(idx, ["분류", "카테고리", "구분", "category"]);
    var bC = pick(idx, ["내용", "본문", "content"]);
    var iC = pick(idx, ["이미지", "사진", "image", "img"]);
    var vC = pick(idx, ["동영상", "영상", "비디오", "video", "youtube"]);
    // 헤더 라벨 인식 실패 시 열 순서(날짜|제목|분류|내용|이미지|동영상)로 대체
    if (tC == null) {
      dC = cols > 0 ? 0 : null;
      tC = cols > 1 ? 1 : null;
      cC = cols > 2 ? 2 : null;
      bC = cols > 3 ? 3 : null;
      iC = cols > 4 ? 4 : null;
      vC = cols > 5 ? 5 : null;
    }
    var out = [];
    for (var r = 0; r < rows; r++) {
      var title = tC != null ? String(dt.getFormattedValue(r, tC) || "").trim() : "";
      if (!title || title === "제목") continue;
      out.push({
        date: dC != null ? String(dt.getFormattedValue(r, dC) || "").trim() : "",
        title: title,
        category: cC != null ? String(dt.getFormattedValue(r, cC) || "").trim() : "",
        body: bC != null ? String(dt.getValue(r, bC) == null ? "" : dt.getValue(r, bC)) : "",
        images: iC != null ? splitUrls(dt.getFormattedValue(r, iC)) : [],
        videos: vC != null ? splitYoutube(dt.getFormattedValue(r, vC)) : [],
        _sort: dC != null ? sortKey(dt.getValue(r, dC), dt.getFormattedValue(r, dC)) : 0
      });
    }
    return out;
  }
  function pick(idx, names) { for (var i = 0; i < names.length; i++) if (idx[names[i]] != null) return idx[names[i]]; return null; }
  function splitUrls(s) {
    s = String(s == null ? "" : s).trim();
    if (!s) return [];
    var out = [];
    s.split(/[\n,]+/).forEach(function (raw) {
      var t = raw.trim();
      if (!t) return;
      // 번호 범위 문법 예) 260914_hundai_[1-10].jpg → 1~10 자동 확장
      expandRange(t).forEach(function (u) {
        var p = normalizePath(u);
        if (p) out.push(p);
      });
    });
    return out;
  }
  // http(s):// 는 그대로, 그 외(images/... , /images/...)는 앞에 / 를 붙여 절대경로화
  function normalizePath(t) {
    if (!t) return "";
    if (/^https?:\/\//i.test(t)) return t;
    return "/" + t.replace(/^\/+/, "");
  }
  // "a_[1-10].jpg" → ["a_1.jpg", ... , "a_10.jpg"] (없으면 원본 그대로 1개)
  function expandRange(t) {
    var m = t.match(/\[(\d+)\s*[-~]\s*(\d+)\]/);
    if (!m) return [t];
    var start = parseInt(m[1], 10), end = parseInt(m[2], 10);
    if (isNaN(start) || isNaN(end)) return [t];
    // 시작값이 0으로 시작하면(예: [01-10]) 자릿수 맞춰 0 채움
    var pad = (m[1].charAt(0) === "0" && m[1].length > 1) ? m[1].length : 0;
    var step = start <= end ? 1 : -1, res = [];
    for (var n = start; step > 0 ? n <= end : n >= end; n += step) {
      var num = String(Math.abs(n));
      while (pad && num.length < pad) num = "0" + num;
      res.push(t.replace(m[0], num));
      if (res.length > 200) break; // 안전장치
    }
    return res;
  }
  function splitYoutube(s) {
    s = String(s == null ? "" : s).trim();
    if (!s) return [];
    return s.split(/[\n,\s]+/).map(function (t) { return youtubeId(t.trim()); })
      .filter(function (id) { return !!id; });
  }
  // 다양한 유튜브 URL 형태에서 영상 ID 추출
  function youtubeId(u) {
    if (!u) return "";
    var m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([A-Za-z0-9_-]{11})/);
    if (m) return m[1];
    if (/^[A-Za-z0-9_-]{11}$/.test(u)) return u; // ID만 입력한 경우
    return "";
  }
  function sortKey(v, f) {
    if (v instanceof Date) return v.getTime();
    var t = Date.parse(f || v); return isNaN(t) ? 0 : t;
  }

  /* ---------- 갤러리 렌더링 ---------- */
  function renderGrid(el, items) {
    if (!items.length) { setMsg(el, "등록된 소식이 없습니다."); return; }
    el.innerHTML = "";
    items.forEach(function (it) {
      var thumb = it.images[0] || (it.videos[0] ? "https://img.youtube.com/vi/" + it.videos[0] + "/hqdefault.jpg" : "");
      var card = document.createElement("button");
      card.type = "button";
      card.className = "news-card";
      card.innerHTML =
        '<div class="news-thumb">' +
          (thumb
            ? '<img src="' + esc(thumb) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">'
            : '<span class="news-thumb-empty">KAMP</span>') +
          (it.videos.length ? '<span class="news-play" aria-hidden="true">▶</span>' : "") +
        "</div>" +
        '<div class="news-card-body">' +
          (it.category ? '<span class="notice-cat">' + esc(it.category) + "</span>" : "") +
          '<h3 class="news-card-title">' + esc(it.title) + "</h3>" +
          '<span class="news-card-date">' + esc(it.date) + "</span>" +
        "</div>";
      card.addEventListener("click", function () { openModal(it); });
      el.appendChild(card);
    });
  }

  /* ---------- 상세 모달 ---------- */
  function openModal(it) {
    var modal = document.getElementById("news-modal");
    if (!modal) return;
    setText(modal, ".nw-cat", "");
    var catHost = modal.querySelector(".nw-cat");
    catHost.innerHTML = it.category ? '<span class="notice-cat">' + esc(it.category) + "</span>" : "";
    catHost.hidden = !it.category;
    setText(modal, ".nm-title", it.title);
    setText(modal, ".nw-date", it.date);
    modal.querySelector(".nw-media").innerHTML = mediaHtml(it);
    modal.querySelector(".nw-body").innerHTML = bodyHtml(it.body);
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
  }
  function mediaHtml(it) {
    var html = "";
    it.videos.forEach(function (id) {
      html += '<div class="nw-video"><iframe src="https://www.youtube.com/embed/' + id +
              '" title="유튜브 영상" frameborder="0" ' +
              'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ' +
              'allowfullscreen loading="lazy"></iframe></div>';
    });
    it.images.forEach(function (u) {
      html += '<img class="nw-img" src="' + esc(u) + '" alt="소식 이미지" loading="lazy" ' +
              'onerror="this.style.display=\'none\'">';
    });
    return html;
  }
  function closeModal() {
    var modal = document.getElementById("news-modal");
    if (!modal) return;
    modal.classList.remove("open");
    modal.querySelector(".nw-media").innerHTML = ""; // iframe 정지(재생 중단)
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKey);
  }
  function onKey(e) { if (e.key === "Escape") closeModal(); }
  document.addEventListener("DOMContentLoaded", function () {
    var modal = document.getElementById("news-modal");
    if (!modal) return;
    modal.querySelectorAll("[data-close]").forEach(function (el) { el.addEventListener("click", closeModal); });
  });

  /* ---------- 유틸 ---------- */
  function setText(root, sel, t) { var el = root.querySelector(sel); if (el) el.textContent = t; }
  function setMsg(el, msg) { if (el) el.innerHTML = '<p class="news-empty">' + esc(msg) + "</p>"; }
  function fail(grid) { setMsg(grid, "소식을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."); }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function bodyHtml(s) {
    var out = esc(s).replace(/\r\n|\r|\n/g, "<br>");
    var re = /(https?:\/\/[^\s<]+)|(www\.[^\s<]+)|([a-zA-Z0-9][a-zA-Z0-9.\-]*\.(?:com|net|org|io|me|tv|info|biz|kr|kakao)(?:\/[^\s<]*)?)/g;
    return out.replace(re, function (m) {
      var href = /^https?:\/\//i.test(m) ? m : "https://" + m;
      return '<a href="' + href + '" target="_blank" rel="noopener">' + m + "</a>";
    });
  }
})();
