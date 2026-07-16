# 한국자산관리원 홈페이지 프로젝트

GitHub + Cloudflare Pages 환경에 맞춘 정적 반응형 홈페이지입니다.

## 구성
- `index.html`: 홈
- `greeting.html`: 인사말
- `experts.html`: 전문가 그룹
- `services.html`: 서비스 소개
- `location.html`: 오시는 길
- `consult.html`: 상담 신청
- `components/header.html`, `components/footer.html`: 공통 헤더·푸터
- `css/`: 공통 및 페이지 스타일
- `js/include.js`: 헤더·푸터 불러오기와 모바일 메뉴
- `js/form.js`: 상담 폼 전송 처리

## 반드시 수정할 부분
1. `components/header.html`
   - 자료실 주소 `https://example.com`을 실제 자료실 주소로 변경
2. `components/footer.html`, `location.html`
   - 주소, 전화번호, 이메일 변경
3. 이미지 교체
   - `images/home/company-intro.svg`
   - `images/home/vision-bg.svg`
   - `images/greeting/director.svg`
   - `images/experts/expert-*.svg`
   - `images/services/service-*.svg`
4. 상담 폼 연결
   - Formspree 가입 후 발급받은 주소를 `consult.html`의
     `https://formspree.io/f/REPLACE_WITH_YOUR_FORM_ID` 대신 입력

## 로컬 확인
`index.html`을 더블클릭하면 fetch 보안 정책으로 공통 헤더가 보이지 않을 수 있습니다.
VS Code Live Server 또는 아래 명령을 사용하세요.

```bash
python -m http.server 8000
```

브라우저에서 `http://localhost:8000` 접속

## Cloudflare Pages
GitHub 저장소에 전체 파일을 업로드한 뒤 Cloudflare Pages에서 저장소를 연결합니다.
정적 HTML 프로젝트이므로 빌드 명령은 비워두고, 출력 디렉터리는 `/` 또는 저장소 루트를 사용합니다.
