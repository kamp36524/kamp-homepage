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
3. 저장합니다. (이 스크립트는 새 탭 `세미나신청` 을 자동으로 만들어 기록합니다. 상담 폼과는 완전히 분리됩니다.)

```javascript
var SHEET_ID = '1iJyFYgTjymPwo45TEbbZia5U-gfLO_o1bdL-X-91vI4'; // 신청 저장용 문서
var TAB_RAW = '세미나신청';   // 원본: 한 신청 = 한 행 (신청일 여러 개는 한 칸에)
var TAB_BYDATE = '일자별신청'; // 정리: 신청일마다 한 행 (신청일 기준 정렬)

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

    // 1) 원본 로그: 한 신청 = 한 행
    var raw = getSheet_(ss, TAB_RAW, ['접수시각', '세미나', '이름', '연락처', '신청일', '결제방법', '개인정보동의']);
    raw.appendRow([now, p.seminarTitle || '', p.name || '', p.phone || '', dateArr.join(', '), payment, agree]);

    // 2) 일자별 정리: 선택한 신청일마다 한 행씩 → 신청일 기준 정렬
    var byDate = getSheet_(ss, TAB_BYDATE, ['신청일', '세미나', '이름', '연락처', '결제방법', '접수시각']);
    var list = dateArr.length ? dateArr : [''];
    list.forEach(function (d) {
      byDate.appendRow([d, p.seminarTitle || '', p.name || '', p.phone || '', payment, now]);
    });
    if (byDate.getLastRow() > 2) {
      byDate.getRange(2, 1, byDate.getLastRow() - 1, byDate.getLastColumn()).sort({ column: 1, ascending: true });
    }

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
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
  var sh = getSheet_(ss, TAB_RAW, ['접수시각', '세미나', '이름', '연락처', '신청일', '결제방법', '개인정보동의']);
  sh.appendRow([new Date(), '(연결 테스트)', '테스트', '-', '-', '-', '-']);
}
```

> **먼저 `test()` 함수를 실행(▶)해 권한을 승인하세요.** 실행 후 그 문서에 탭과 테스트 행이 생기면 스크립트–시트 연결이 정상입니다. (테스트 행은 지우시면 됩니다.)
>
> **신청일별 정리:** 신청이 들어오면 `세미나신청`(원본)에 한 행, `일자별신청`에는 **선택한 날짜마다 한 행**씩 쌓이고 신청일 기준으로 자동 정렬됩니다. 각 강의일자별 참석자 명단은 `일자별신청` 탭에서 확인하세요.

## 3. 웹앱으로 배포

1. 우측 상단 **배포 → 새 배포** → 유형 **웹 앱**
2. **실행 계정: 나** / **액세스 권한: 모든 사용자**
3. **배포** 후 권한 승인 → 생성된 **웹 앱 URL**(`.../exec`) 복사
   - 처음 실행 시 다른 문서(스프레드시트)에 접근하는 권한을 승인해야 합니다.

> 코드 수정 시 **배포 → 배포 관리 → 편집(연필) → 새 버전 → 배포**로 갱신해야 반영됩니다.

## 문제 해결 (신청은 되는데 시트에 안 쌓일 때)

`세미나신청` 탭조차 안 생긴다면 아래를 순서대로 확인하세요.

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
