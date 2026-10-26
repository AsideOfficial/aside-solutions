# 제품 화면 시안

제품마다 실제 프로그램처럼 보이는 하이파이 화면 시안을 HTML 한 장(`{slug}.html`)으로 만든다. `node scripts/render-mockups.mjs`가 이 파일을 webp로 구워 `public/images/products/`에 넣고, 빌드는 그 이미지를 목록 카드(`{slug}-card.webp`, 960×600)와 상세페이지(`{slug}.webp`, 1920×1200)에 쓴다. 시안이 없는 제품은 `src/visual.mjs`가 그리는 기본 화면을 쓴다.

```bash
node scripts/render-mockups.mjs price-guard              # 한 제품 굽기
node scripts/render-mockups.mjs                          # 전체 굽기
node scripts/render-mockups.mjs price-guard --preview tmp # 확인용 PNG만 tmp/에 저장
```

로컬 Chrome 또는 Edge가 필요하다(다른 경로는 `CHROME_PATH`). 굽는 것은 로컬에서만 하고, 결과 이미지를 커밋한다.

## 만드는 규칙

- **캔버스**: 1280×800 한 화면. 문서가 이보다 크면 굽기 스크립트가 경고한다. 스크롤·애니메이션 없음.
- **공용 파일**: `_kit.css`에는 리셋과 OS 창 틀(Windows 11, macOS, 브라우저, 휴대폰)만 있다. 앱 안쪽 디자인은 시안마다 직접 만든다. 같은 레이아웃을 돌려 쓰지 않는다.
- **제공 형태에 맞는 틀**: Windows 프로그램은 Windows 창, Windows·Mac 프로그램은 macOS 창, 웹 프로그램은 브라우저 창, 엑셀·구글 시트는 스프레드시트 화면. 알림을 받는 제품은 휴대폰을 겹쳐도 된다.
- **내용**: `data/products/{slug}.json`의 기능·설정(`screen`)·결과(`visual`)를 화면에 반영한다. 상품명·업체명·숫자는 그럴듯하게 지어낸 예시로 쓰고, 사람 이름과 연락처는 가린다(김○○, 010-****-1234).
- **하지 않는 것**: 실제 회사·서비스의 로고와 화면을 베끼지 않는다(판매처 이름을 글자로 쓰는 것은 된다). 남의 도메인을 지어내지 않는다(주소창은 `localhost` 또는 `solutions.asidepartners.kr` 아래 경로). 외부 이미지 파일을 쓰지 않는다(상품 사진은 CSS·SVG로 그린다). 스팸·탐지 회피·다계정처럼 제품 설명에서 뺀 기능을 화면에 넣지 않는다.
- **글꼴**: 아래 CDN만 쓴다. 클래식한 Windows 도구는 시스템 글꼴(`'Malgun Gothic'`, `'Segoe UI'`)도 좋다.
  - Pretendard: `https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css` → `'Pretendard Variable'`
  - SUIT: `https://cdn.jsdelivr.net/gh/sun-typeface/SUIT@2.0.5/fonts/variable/woff2/SUIT-Variable.css` → `'SUIT Variable'`
  - Spoqa Han Sans Neo: `https://spoqa.github.io/spoqa-han-sans/css/SpoqaHanSansNeo.css`
  - Google Fonts: IBM Plex Sans KR, Noto Sans KR, Inter, JetBrains Mono, Black Han Sans, Gowun Dodum
- **작게 봐도 읽히게**: 목록 카드에서는 이 화면이 가로 380px 정도로 줄어든다. 화면마다 한눈에 들어오는 중심 요소(큰 숫자, 차트, 지도, 캔버스 등)를 하나 둔다.
