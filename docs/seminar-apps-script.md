# 세미나 신청 → (기존) Google Sheet 저장 설정 가이드

세미나 신청 폼(`seminar-apply.html`)에서 받은 정보를 **기존에 쓰시던 Google Sheet 문서에 새 탭으로** 저장합니다.
기존 상담 폼 연동을 건드리지 않도록, **별도의 독립 Apps Script**를 하나 더 만들어 같은 스프레드시트에 기록하는 방식입니다.

## 1. 준비

저장할 문서는 아래로 지정되어 있습니다. (스크립트에 이미 반영됨)

```
https://docs.google.com/spreadsheets/d/1iJyFYgTjymPwo45TEbbZia5U-gfLO_o1bdL-X-91vI4/edit
```

> **공유 권한은 따로 필요 없습니다.** 이 문서를 편집할 수 있는 본인 구글 계정으로 아래 스크립트를 만들면 됩니다.
> 웹앱을 "실행 계정: 나(Me)"로 배포하므로, 신청자(익명)나 외부에 문서를 공개할 필요가 없습니다.

## 2. 독립 Apps Script 만들기

1. 위 문서를 편집할 수 있는 **본인 구글 계정으로 로그인**한 상태에서 https://script.google.com 접속 → **새 프로젝트**
2. 아래 코드를 그대로 붙여넣습니다. (SHEET_ID가 이미 채워져 있습니다.)
3. 저장합니다. (이 스크립트는 **강의명으로 된 탭**을 자동으로 만들어, 신청일마다 한 행씩 기록합니다. 상담 폼과는 완전히 분리됩니다.)

```javascript
var SHEET_ID = '1iJyFYgTjymPwo45TEbbZia5U-gfLO_o1bdL-X-91vI4'; // 신청 저장용 문서
var CAPACITY = 20; // 신청일(회차)별 정원. 0 또는 음수면 제한 없음.

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var p = (e && e.parameter) ? e.parameter : {};
    var dateArr = (e && e.parameters && e.parameters.dates) ? e.parameters.dates : [];
    var payment = (e && e.parameters && e.parameters.payment) ? e.parameters.payment.join(', ') : '';
    var now = new Date();
    var agree = p.privacy_agreement ? '동의' : '';

    // 탭 이름 = 강의명. 신청일마다 한 행씩 쌓고 신청일 기준으로 정렬.
    var tabName = (p.seminarTitle || '세미나신청').substring(0, 90);
    var sheet = getSheet_(ss, tabName, ['신청일', '이름', '연락처', '결제방법', '개인정보동의', '접수시각']);

    // 현재 신청일별 신청 수 집계 (정원 확인용)
    var tally = countByDate_(sheet);

    var list = dateArr.length ? dateArr : [''];
    var accepted = [], full = [];
    list.forEach(function (d) {
      var key = String(d).trim();
      // 정원 초과한 날짜는 저장하지 않음 (동시 신청도 Lock 안에서 처리되어 초과 없음)
      if (CAPACITY > 0 && key && (tally[key] || 0) >= CAPACITY) { full.push(d); return; }
      sheet.appendRow([d, p.name || '', p.phone || '', payment, agree, now]);
      if (key) tally[key] = (tally[key] || 0) + 1;
      accepted.push(d);
    });
    if (sheet.getLastRow() > 2) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).sort({ column: 1, ascending: true });
    }

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success', accepted: accepted, full: full }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// 홈페이지가 '마감된 날짜' 목록만 조회하는 통로 (개인정보는 반환하지 않음, JSONP)
function doGet(e) {
  var p = (e && e.parameter) ? e.parameter : {};
  var callback = p.callback || 'callback';
  var out = { full: [] };
  try {
    if (p.action === 'seats' && CAPACITY > 0) {
      var tabName = (p.seminarTitle || '').substring(0, 90);
      var ss = SpreadsheetApp.openById(SHEET_ID);
      var sheet = tabName ? ss.getSheetByName(tabName) : null;
      if (sheet) {
        var tally = countByDate_(sheet);
        Object.keys(tally).forEach(function (d) {
          if (tally[d] >= CAPACITY) out.full.push(d); // 마감된 날짜만
        });
      }
    }
  } catch (err) {
    out.error = String(err);
  }
  return ContentService
    .createTextOutput(callback + '(' + JSON.stringify(out) + ')')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

// 신청일(1열) 기준 신청 수 집계
function countByDate_(sheet) {
  var tally = {};
  var last = sheet.getLastRow();
  if (last > 1) {
    var col = sheet.getRange(2, 1, last - 1, 1).getValues();
    col.forEach(function (r) {
      var d = String(r[0] || '').trim();
      if (d) tally[d] = (tally[d] || 0) + 1;
    });
  }
  return tally;
}

function getSheet_(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
  }
  return sh;
}

// 권한 승인 + 연결 확인용. 편집기에서 이 함수를 한 번 실행(▶)하세요.
function test() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = getSheet_(ss, '경매 & NPL 입문과정', ['신청일', '이름', '연락처', '결제방법', '개인정보동의', '접수시각']);
  sh.appendRow(['(연결 테스트)', '테스트', '-', '-', '-', new Date()]);
}
```

> **정원 마감 동작:** 신청일별 신청 수가 `CAPACITY`(기본 20)에 도달하면, 그 날짜는 더 이상 저장되지 않습니다. 동시 신청도 `LockService` 잠금 안에서 순서대로 처리되어 **21명이 쌓이지 않습니다.**
> 홈페이지는 `doGet`(집계 통로)에서 **마감된 날짜 목록만** 받아 해당 날짜를 "마감"으로 표시합니다. (이름·연락처 등 개인정보는 반환하지 않습니다.)
> 정원을 바꾸려면 맨 위 `var CAPACITY = 20;` 값을, 제한을 없애려면 `0` 으로 바꾸면 됩니다.

> **먼저 `test()` 함수를 실행(▶)해 권한을 승인하세요.** 실행 후 그 문서에 탭과 테스트 행이 생기면 스크립트–시트 연결이 정상입니다. (테스트 행은 지우시면 됩니다.)
>
> **정리 방식:** 신청이 들어오면 **강의명(예: `경매 & NPL 입문과정`)으로 된 탭**에, 선택한 **신청일마다 한 행**씩 쌓이고 신청일 기준으로 자동 정렬됩니다. (별도 원본/요약 탭은 만들지 않습니다.) 강의가 여러 개면 각 강의명 탭이 따로 생성됩니다.

## 3. 웹앱으로 배포

1. 우측 상단 **배포 → 새 배포** → 유형 **웹 앱**
2. **실행 계정: 나** / **액세스 권한: 모든 사용자**
3. **배포** 후 권한 승인 → 생성된 **웹 앱 URL**(`.../exec`) 복사
   - 처음 실행 시 다른 문서(스프레드시트)에 접근하는 권한을 승인해야 합니다.

> 코드 수정 시 **배포 → 배포 관리 → 편집(연필) → 새 버전 → 배포**로 갱신해야 반영됩니다.

## 문제 해결 (신청은 되는데 시트에 안 쌓일 때)

강의명 탭조차 안 생긴다면 아래를 순서대로 확인하세요.

1. **권한 승인** — 편집기에서 위 `test()` 함수를 **실행(▶)**. 권한창이 뜨면 모두 허용.
   → 탭과 테스트 행이 생기면 시트 연결 정상. (안 생기면 로그인 계정이 그 문서 편집 권한이 있는지 확인)
2. **새 버전으로 재배포** — 코드를 붙여넣은 뒤 **배포 → 배포 관리 → 편집(연필) → 버전: 새 버전 → 배포**.
   (이걸 안 하면 `/exec` 가 `doPost` 없는 옛 버전을 실행합니다.)
3. **실행 로그 확인** — 편집기 왼쪽 **실행(Executions)** 에서 홈페이지로 신청했을 때 `doPost` 기록이 있는지 확인.
   - 기록 없음 → 2번(재배포) 문제
   - 기록 있으나 실패 → 1번(권한) 문제

## 4. 홈페이지에 URL 연결

`seminar-apply.html` 의 아래 부분 `action=""` 에 복사한 URL을 넣습니다. (URL만 주시면 제가 넣어 드립니다.)

```html
<form id="apply-form" class="consult-form card" action="여기에_웹앱_URL" method="POST" novalidate>
```

---

## (대안) 상담 폼과 같은 스크립트/URL을 재사용하고 싶다면

기존 상담 Apps Script의 `doPost` 를 아래처럼 분기 처리하면 URL 하나로 상담·세미나를 모두 받을 수 있습니다.
다만 기존 상담 기록 로직을 직접 수정해야 하므로, 위의 **독립 스크립트 방식(권장)** 이 더 안전합니다.

```javascript
function doPost(e) {
  var p = e.parameter || {};
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (p.formType === 'seminar') {
    var sh = ss.getSheetByName('세미나신청') || ss.insertSheet('세미나신청');
    if (sh.getLastRow() === 0) sh.appendRow(['접수시각','세미나','이름','연락처','신청일','결제방법','개인정보동의']);
    var dates = (e.parameters.dates || []).join(', ');
    var payment = (e.parameters.payment || []).join(', ');
    sh.appendRow([new Date(), p.seminarTitle||'', p.name||'', p.phone||'', dates, payment, p.privacy_agreement?'동의':'']);
  } else {
    /* ↓↓↓ 기존 상담 저장 로직을 그대로 두세요 ↓↓↓ */
  }
  return ContentService.createTextOutput(JSON.stringify({result:'success'})).setMimeType(ContentService.MimeType.JSON);
}
```

---

## 세미나 정보 수정 방법

`js/seminar-apply.js` 상단 `SEMINARS` 객체에서 관리합니다.

- `summary`: 상세 이미지 경로 (`/images/seminar/npl-intro-detail.png`)
- `info`: 이미지 아래 안내 텍스트(HTML)
- `dates`: 신청 가능한 강의 일자 (중복 선택 가능)

## 필요한 이미지 파일

아래 파일을 `images/seminar/` 에 올리면 자동으로 노출됩니다. (없어도 페이지는 정상 동작)

- `npl-intro-detail.png` — 세미나 상세(요약) 이미지 **(필수)**
- `npl-intro-map.png` — 오시는 길 지도 이미지 (선택, 없으면 지도 링크만 표시)
