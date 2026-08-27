# 세미나 신청 → (기존) Google Sheet 저장 설정 가이드

세미나 신청 폼(`seminar-apply.html`)에서 받은 정보를 **기존에 쓰시던 Google Sheet 문서에 새 탭으로** 저장합니다.
기존 상담 폼 연동을 건드리지 않도록, **별도의 독립 Apps Script**를 하나 더 만들어 같은 스프레드시트에 기록하는 방식입니다.

## 1. 스프레드시트 ID 확인

기존에 쓰시는 Google Sheet를 열고 주소에서 ID를 복사합니다.

```
https://docs.google.com/spreadsheets/d/★여기가_스프레드시트_ID★/edit
```

## 2. 독립 Apps Script 만들기

1. https://script.google.com 접속 → **새 프로젝트**
2. 아래 코드를 붙여넣고, `SHEET_ID` 에 위에서 복사한 ID를 넣습니다.
3. 저장합니다. (이 스크립트는 새 탭 `세미나신청` 을 자동으로 만들어 기록합니다. 상담 폼과는 완전히 분리됩니다.)

```javascript
var SHEET_ID = '여기에_스프레드시트_ID';
var TAB_NAME = '세미나신청';

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(TAB_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(TAB_NAME);
      sheet.appendRow(['접수시각', '세미나', '이름', '연락처', '신청일', '결제방법', '개인정보동의']);
    }
    var p = (e && e.parameter) ? e.parameter : {};
    var dates = (e && e.parameters && e.parameters.dates) ? e.parameters.dates.join(', ') : '';
    var payment = (e && e.parameters && e.parameters.payment) ? e.parameters.payment.join(', ') : '';

    sheet.appendRow([
      new Date(),
      p.seminarTitle || '',
      p.name || '',
      p.phone || '',
      dates,
      payment,
      p.privacy_agreement ? '동의' : ''
    ]);

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
```

## 3. 웹앱으로 배포

1. 우측 상단 **배포 → 새 배포** → 유형 **웹 앱**
2. **실행 계정: 나** / **액세스 권한: 모든 사용자**
3. **배포** 후 권한 승인 → 생성된 **웹 앱 URL**(`.../exec`) 복사
   - 처음 실행 시 다른 문서(스프레드시트)에 접근하는 권한을 승인해야 합니다.

> 코드 수정 시 **배포 → 배포 관리 → 편집(연필) → 새 버전 → 배포**로 갱신해야 반영됩니다.

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
