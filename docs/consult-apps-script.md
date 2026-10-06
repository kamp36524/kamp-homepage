# 상담 신청 폼 → Google Sheet 저장 (확장 항목) 가이드

상담 폼(`consult.html`)이 **구조화 개편**되면서 전송 항목이 늘었습니다.
이 항목들이 시트에 저장되려면 **상담용 Apps Script의 `doPost`가 새 항목을 기록**하도록 업데이트해야 합니다.
(업데이트 전에는 이름·연락처·분야·상담내용만 저장되고 **새 항목은 버려집니다.**)

## 전송되는 항목 (input name)

| name | 의미 | name | 의미 |
|------|------|------|------|
| `name` | 이름 | `consult_method` | 상담 방식(방문/전화/화상) |
| `phone` | 연락처 | `purpose` | 상담 목적 **(복수 값)** |
| `age` | 연령대 | `house_count` | 현재 주택 수 |
| `income` | 연 소득대 | `property_count` | 보유 부동산 수 |
| `category` | 상담 분야 | `asset_size` | 보유 자산 규모 |
| `consult_date` | 상담 희망 날짜 | `cash_available` | 투자 가능 현금 |
| `consult_time` | 희망 시간대 | `source` | 유입 경로 |
| `content` | 상담 내용 | `privacy_agreement` | 개인정보 동의 |

> `purpose`(상담 목적)는 체크박스 복수 선택이라 값이 여러 개일 수 있어, `e.parameters.purpose`(배열)로 받습니다.

## 업데이트할 `doPost` 코드

상담용 Apps Script 프로젝트에서 **기존 `doPost`를 아래로 교체**하세요. (맨 위 `SLACK_WEBHOOK_URL`은 기존 값을 그대로 두면 됩니다.)

```javascript
var SLACK_WEBHOOK_URL = '기존에_쓰시던_슬랙_웹훅_URL_그대로';
var HEADERS = ['접수시각','이름','연락처','연령대','소득대','상담분야','희망날짜','희망시간대',
               '상담방식','상담목적','주택수','보유부동산수','자산규모','투자가능현금','유입경로','상담내용','개인정보동의'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS); // 빈 시트면 헤더 1회 생성

    var d = e.parameter || {};
    var purpose = (e.parameters && e.parameters.purpose) ? e.parameters.purpose.join(', ') : '';
    var agree = d.privacy_agreement ? '동의' : '';

    sheet.appendRow([
      new Date(), d.name || '', d.phone || '', d.age || '', d.income || '', d.category || '',
      d.consult_date || '', d.consult_time || '', d.consult_method || '', purpose,
      d.house_count || '', d.property_count || '', d.asset_size || '', d.cash_available || '',
      d.source || '', d.content || '', agree
    ]);

    // 알림 메일
    var hopeDate = ((d.consult_date || '') + ' ' + (d.consult_time || '')).trim();
    var body =
      '이름: ' + (d.name || '-') + '\n' +
      '연락처: ' + (d.phone || '-') + '\n' +
      '상담 분야: ' + (d.category || '-') + '\n' +
      '상담 목적: ' + (purpose || '-') + '\n' +
      '희망 일시: ' + (hopeDate || '-') + '\n' +
      '상담 방식: ' + (d.consult_method || '-') + '\n' +
      '연령대: ' + (d.age || '-') + ' / 소득대: ' + (d.income || '-') + '\n' +
      '주택 수: ' + (d.house_count || '-') + ' / 보유 부동산: ' + (d.property_count || '-') + '\n' +
      '자산 규모: ' + (d.asset_size || '-') + ' / 투자 가능 현금: ' + (d.cash_available || '-') + '\n' +
      '유입 경로: ' + (d.source || '-') + '\n' +
      '상담 내용:\n' + (d.content || '-');
    MailApp.sendEmail('kamp36524@gmail.com', '[상담신청] ' + (d.name || ''), body);

    notifySlack_(d, purpose);

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function notifySlack_(p, purpose) {
  if (!SLACK_WEBHOOK_URL) return;
  try {
    var now = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm');
    var hopeDate = ((p.consult_date || '') + ' ' + (p.consult_time || '')).trim();
    var text =
      '*📩 새 상담 신청*\n' +
      '• 이름: ' + (p.name || '-') + '\n' +
      '• 연락처: ' + (p.phone || '-') + '\n' +
      '• 상담 분야: ' + (p.category || '-') + '\n' +
      '• 상담 목적: ' + (purpose || '-') + '\n' +
      '• 희망 일시: ' + (hopeDate || '-') + '\n' +
      '• 상담 방식: ' + (p.consult_method || '-') + '\n' +
      '• 상담 내용: ' + (p.content || '-') + '\n' +
      '• 접수 시각: ' + now;
    UrlFetchApp.fetch(SLACK_WEBHOOK_URL, {
      method: 'post', contentType: 'application/json',
      payload: JSON.stringify({ text: text }), muteHttpExceptions: true
    });
  } catch (err) { /* 알림 실패가 접수를 막지 않도록 무시 */ }
}
```

## 배포

코드 교체 후 **배포 → 배포 관리 → 편집(✏️) → 버전: 새 버전 → 배포**. (URL 그대로 유지되어 홈페이지는 손댈 것 없음)

## 기존 시트 관련 주의

- 지금 상담 시트에는 **예전 형식(이름·연락처·분야·내용)** 행이 이미 들어있습니다.
- 새 코드는 **열 구성이 17개로 늘어나므로**, 기존 행과 열이 어긋나 보일 수 있습니다.
- 깔끔하게 하려면 다음 중 하나를 권장합니다.
  1. **새 탭을 만들고** 그 탭을 첫 번째 시트로 두거나(코드가 `getSheets()[0]` 사용), 또는
  2. 기존 데이터를 백업 후 **첫 행에 위 `HEADERS`를 넣어** 정렬을 맞추기.
- 새로 시작하는 빈 시트라면 코드가 **헤더를 자동 생성**합니다.
