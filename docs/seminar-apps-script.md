# 세미나 신청 → Google Sheet 연동 설정 가이드

세미나 신청 폼(`seminar-apply.html`)에서 받은 신청 정보를 Google Sheet에 자동 저장하기 위한 설정입니다.
기존 상담 폼(`consult.html`)과 동일한 방식(Google Apps Script 웹앱)입니다.

## 1. Google Sheet 준비

1. 새 Google Sheet를 만듭니다. (예: `KAMP 세미나 신청`)
2. 1행에 아래 헤더를 입력합니다.

| 접수시각 | 세미나 | 이름 | 연락처 | 신청일 | 개인정보동의 |
|----------|--------|------|--------|--------|--------------|

## 2. Apps Script 작성

1. 그 Sheet에서 **확장 프로그램 → Apps Script** 를 엽니다.
2. 기본 코드를 지우고 아래 코드를 붙여넣습니다. (이 Sheet에 연결된 스크립트라 Sheet ID를 따로 넣지 않아도 됩니다.)

```javascript
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    var p = (e && e.parameter) ? e.parameter : {};
    // 신청일은 체크박스 다중 선택 → 배열로 들어옵니다.
    var dates = (e && e.parameters && e.parameters.dates) ? e.parameters.dates.join(', ') : '';

    sheet.appendRow([
      new Date(),                       // 접수시각
      p.seminarTitle || '',             // 세미나
      p.name || '',                     // 이름
      p.phone || '',                    // 연락처
      dates,                            // 신청일
      p.privacy_agreement ? '동의' : '' // 개인정보동의
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

1. 우측 상단 **배포 → 새 배포** 클릭
2. 유형 선택(톱니바퀴) → **웹 앱**
3. 설정
   - **실행 계정**: 나
   - **액세스 권한**: **모든 사용자** (익명 신청을 받으려면 필수)
4. **배포**를 누르고 권한을 승인합니다.
5. 생성된 **웹 앱 URL**을 복사합니다. (형식: `https://script.google.com/macros/s/XXXXXXXX/exec`)

> 코드를 수정할 때마다 **배포 → 배포 관리 → 편집(연필) → 버전: 새 버전 → 배포**로 갱신해야 반영됩니다.

## 4. 홈페이지에 URL 연결

`seminar-apply.html` 의 아래 부분에서 `action=""` 안에 복사한 URL을 넣습니다.

```html
<form id="apply-form" class="consult-form card" action="여기에_웹앱_URL_붙여넣기" method="POST" novalidate>
```

URL만 알려주시면 제가 대신 넣어 커밋해 드릴 수 있습니다.

## 5. 세미나 정보 수정 방법

세미나 목록/내용은 `js/seminar-apply.js` 상단의 `SEMINARS` 객체에서 관리합니다.

```javascript
const SEMINARS = {
  "npl-intro": {                              // ← 세미나 목록 카드 링크의 ?id= 값과 일치
    title: "경매 &amp; NPL 입문",             // 제목
    summary: "/images/seminar/seminar-4.png", // 정보 요약 이미지 경로
    info: "…설명 텍스트(HTML 가능, 없으면 '')…",
    dates: [                                   // 강의 일자 (중복 선택 가능, 빈 배열이면 날짜 선택 없음)
      "2026-09-06 (토) 14:00",
      "2026-09-13 (토) 14:00"
    ]
  }
  // 세미나를 추가하려면 새 id 항목을 넣고,
  // seminar.html 카드 링크를 href="/seminar-apply?id=새id" 로 연결하세요.
};
```

- **정보 요약 이미지**를 별도로 만들면 `/images/seminar/`에 올리고 `summary` 경로를 바꾸면 됩니다.
- **강의 일자(dates)** 는 실제 일정으로 교체해 주세요. (현재는 예시 값)
