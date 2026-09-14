# 상담 신청 → Slack 알림 설정 가이드

상담 신청(`consult.html`)이 접수되면 지정한 **Slack 채널로 알림**이 오도록 설정합니다.

## 동작 방식

홈페이지 상담 폼은 **Google Apps Script 웹앱**으로 접수됩니다.
그래서 알림도 그 Apps Script 안에서 Slack으로 보내면 됩니다.
(홈페이지 HTML/JS는 수정할 필요가 없습니다.)

```
[방문자] → 상담 폼 제출 → [Apps Script doPost] → 시트 저장 + Slack 알림 전송 → [Slack 채널]
```

---

## 1단계 · Slack Incoming Webhook URL 만들기

알림을 받을 채널로 메시지를 보낼 수 있는 **Webhook URL**을 발급합니다.

1. https://api.slack.com/apps 접속 → **Create New App** → **From scratch**
2. 앱 이름(예: `상담알림`) 입력, 알림 받을 **워크스페이스** 선택 → **Create App**
3. 왼쪽 메뉴 **Incoming Webhooks** → 상단 토글을 **On**
4. 아래 **Add New Webhook to Workspace** 클릭
5. 알림을 받을 **채널 선택**(예: `#상담신청`) → **허용(Allow)**
6. 생성된 **Webhook URL** 복사 — `hooks.slack.com/services/...` 로 시작하는 긴 주소입니다.
   (`https://hooks.slack.com/services/` 뒤에 `팀ID / 봇ID / 토큰` 세 부분이 `/` 로 이어진 형태)

> 이 URL은 비밀번호와 같습니다. 외부에 공개하지 마세요. (홈페이지 코드에는 넣지 않고, Apps Script 안에만 넣습니다.)

---

## 2단계 · 상담 Apps Script에 알림 코드 추가

상담 폼을 저장하는 **기존 Apps Script 프로젝트**를 엽니다.
(consult.html 의 `action` 에 연결된 웹앱 스크립트)

### (1) 맨 위에 Webhook URL 상수 추가

```javascript
var SLACK_WEBHOOK_URL = '여기에_1단계에서_복사한_URL';
```

### (2) 알림 전송 함수 추가 (파일 아무 곳에나 붙여넣기)

```javascript
function notifySlack_(p) {
  if (!SLACK_WEBHOOK_URL) return;
  try {
    var now = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm');
    var text =
      '*📩 새 상담 신청*\n' +
      '• 이름: ' + (p.name || '-') + '\n' +
      '• 연락처: ' + (p.phone || '-') + '\n' +
      '• 상담 분야: ' + (p.category || '-') + '\n' +
      '• 상담 내용: ' + (p.content || '-') + '\n' +
      '• 접수 시각: ' + now;

    UrlFetchApp.fetch(SLACK_WEBHOOK_URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ text: text }),
      muteHttpExceptions: true
    });
  } catch (err) {
    // 알림 실패가 상담 접수 자체를 막지 않도록 오류는 무시
  }
}
```

### (3) `doPost` 안에서 호출

시트에 저장하는 코드 **바로 다음**에 한 줄만 추가합니다.

```javascript
function doPost(e) {
  var p = (e && e.parameter) ? e.parameter : {};

  // ... (기존 시트 저장 로직 그대로) ...

  notifySlack_(p);   // ← 이 한 줄 추가

  return ContentService
    .createTextOutput(JSON.stringify({ result: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

> 상담 폼의 입력 항목 이름(`name`, `phone`, `category`, `content`)은 `consult.html` 과 동일해야 합니다. (현재 홈페이지 기준으로 맞춰져 있습니다.)

---

## 3단계 · 새 버전으로 재배포

코드를 저장한 뒤 반드시 새 버전으로 배포해야 반영됩니다.

**배포 → 배포 관리 → 편집(연필) → 버전: 새 버전 → 배포**

> URL(`/exec`)은 그대로 유지되므로 홈페이지 쪽은 바꿀 것이 없습니다.

---

## 4단계 · 테스트

1. 홈페이지 상담 폼(`/consult`)에서 테스트로 한 건 신청해 봅니다.
2. 선택한 Slack 채널에 알림이 오는지 확인합니다.

### 알림이 안 올 때

- **권한 승인** — Apps Script 편집기에서 `notifySlack_` 관련 코드를 처음 실행하면 외부 요청(UrlFetchApp) 권한 승인이 필요할 수 있습니다. `doPost`가 한 번 실행되면 승인창이 뜨니 허용하세요.
- **재배포** — 2단계 코드를 넣고 **새 버전으로 배포**했는지 확인. (재배포 안 하면 옛 코드가 계속 실행됩니다.)
- **Webhook URL** — 오타 없이 정확히 붙여넣었는지, 채널이 삭제/보관되지 않았는지 확인.
- **실행 로그** — 편집기 왼쪽 **실행(Executions)** 에서 `doPost` 실행 기록과 오류 메시지를 확인.

---

## 참고 · 세미나 신청도 Slack 알림을 원하면

세미나 신청(`seminar-apply.html`)은 별도 Apps Script(`docs/seminar-apps-script.md`)로 저장됩니다.
같은 방식으로 그 스크립트에도 `SLACK_WEBHOOK_URL` + `notifySlack_()` 를 추가하고 `doPost` 안에서 호출하면 됩니다.
세미나용은 항목이 다르므로 메시지 본문만 아래처럼 바꾸세요.

```javascript
var text =
  '*🎫 새 세미나 신청*\n' +
  '• 강의: ' + (p.seminarTitle || '-') + '\n' +
  '• 이름: ' + (p.name || '-') + '\n' +
  '• 연락처: ' + (p.phone || '-') + '\n' +
  '• 신청일: ' + ((e.parameters.dates || []).join(', ') || '-') + '\n' +
  '• 결제방법: ' + ((e.parameters.payment || []).join(', ') || '-');
```
