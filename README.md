# Aside Solutions (solutions.asidepartners.kr)

에이사이드파트너스의 신규 사업 페이지. 검증된 업무 자동화 프로그램 50종을 시장가보다 합리적인 가격에 소개하고, 모든 주문은 메일(solutions@asidepartners.kr)로 받는다.

- 사업 방식: 프리랜서 마켓에서 많이 팔린 프로그램과 같은 기능의 제품을 올려 두고, 주문이 오면 고객 환경에 맞춰 제작·세팅해 전달한다.
- 서비스명은 영문 `Aside Solutions`를 기본으로 쓴다(한글 표기가 필요하면 에이사이드 솔루션즈). 로고는 `public/brand/`의 Aside 워드마크 + "Solutions".
- 빌드 설정: Framework Preset `Other`, Build Command `npm run build`, Output Directory `dist`.
- 저장소: https://github.com/AsideOfficial/aside-solutions (공개). Vercel Hobby는 비공개 저장소에서 계정 주인 외 커밋의 배포를 막으므로 공개 저장소로 운영한다.
- 현재 상태: 오픈 전. 검색 노출 차단(`noindex`)을 켜 둔 상태다.

## 구조

```
data/
  site.json            사이트 이름·도메인·메일·사업자 정보·히어로 구성
  categories.json      분야 7개 (한글명, 영문명, 묶음)
  products/{slug}.json 제품 1개 = 파일 1개 (카피, 화면 데이터, 가격 플랜)
src/
  render.mjs           홈·상세·404 HTML 템플릿
  visual.mjs           시안 이미지가 없는 제품용 기본 화면 SVG 생성 (visual + screen 데이터)
  assets/              styles.css, app.js(분야 필터·검색·메일 주소 복사·헤더)
design/mockups/        제품별 하이파이 화면 시안 (HTML 한 장씩) — 규칙은 design/mockups/README.md
public/                그대로 복사되는 정적 파일 (로고, 파비콘, 히어로 배경, 제품 화면 이미지)
scripts/validate-products.mjs  제품 데이터 검사 (글자 수, 금지 표현, 이름 중복, 가격 규칙)
scripts/render-mockups.mjs     시안 HTML → public/images/products/ webp 굽기 (로컬 Chrome·Edge 사용)
build.mjs              data → dist/ 정적 페이지 생성 (의존성 없음)
```

```bash
npm run validate   # 제품 데이터 검사
npm run build      # dist/ 생성
```

## 제품 데이터

- `visual`: 화면 가운데 결과 영역(표·대시보드·알림·채팅·흐름·갤러리 중 하나).
- `screen`: 프로그램 창의 나머지(버전, 툴바, 설정 패널, 체크박스, 실행 로그, 상태 표시줄, 표 추가 행).
- `pricing.plans`: 플랜 1~3개. **가격 규칙**: `benchmark.packages`(같은 기능 시장 상품의 패키지 가격)의 90%를 내림한다 — 1만 원 미만은 500원, 30만 원 미만은 1,000원, 그 이상은 1만 원 단위. 검사기가 이 규칙을 확인한다. 모든 가격은 **부가세 포함**으로 표시한다(시장 가격도 부가세 포함 기준).
- `benchmark`: 시장 벤치마크 정보(사이트에 노출되지 않음). 목록은 `reviews`가 많은 순으로 나열된다.

## 제품 화면 이미지

- 제품마다 `design/mockups/{slug}.html`에 실제 프로그램처럼 보이는 하이파이 시안을 두고, `node scripts/render-mockups.mjs [slug]`로 구워 `public/images/products/{slug}.webp`(상세, 1920 × 1200)와 `{slug}-card.webp`(목록 카드, 960 × 600)를 만든다. 결과 이미지를 커밋한다.
- 다른 도구로 만든 이미지를 쓰려면 `public/images/products/{slug}.webp|png|jpg`에 넣으면 된다(권장 1280 × 800 비율). 이미지가 없으면 `src/visual.mjs`의 기본 화면을 쓴다.
- 히어로 배경: `public/images/hero.webp|jpg|png`를 넣으면 기본 SVG 배경(`public/images/hero-bg.svg`) 대신 쓴다(권장 1920 × 1080 이상, 아래쪽이 어두운 이미지).

## 배포

### 자동 배포 (GitHub Actions → Vercel)

`main`에 푸시하면 `.github/workflows/deploy.yml`이 검사 → 빌드 → Vercel 프로덕션 배포를 한다. Vercel의 Git 연동은 쓰지 않는다. 저장소에 시크릿 3개가 있어야 동작하며, 없으면 워크플로가 어떤 시크릿이 빠졌는지 알려 주고 멈춘다.

1. **VERCEL_TOKEN**: https://vercel.com/account/tokens 에서 만든다. 토큰은 팀(`aside1`) 설정이 아니라 **개인 계정 설정**에 있으므로, 대시보드 왼쪽 위 선택기를 개인 계정으로 두고 연다. 이름 입력 → Scope에서 `aside1` → All Projects → 만료 선택 → Create. 값은 한 번만 보인다.
2. **VERCEL_ORG_ID**: Vercel → `aside1` 팀 Settings → General → Team ID (`team_…`).
3. **VERCEL_PROJECT_ID**: Vercel → `aside-solutions` 프로젝트 Settings → General → Project ID (`prj_…`).
   - 2·3은 `vercel link --scope aside1 --project aside-solutions` 실행 후 생기는 `.vercel/project.json`의 `orgId`, `projectId`와 같다.
4. GitHub 저장소 → Settings → Secrets and variables → Actions → New repository secret으로 위 3개를 등록한다.
5. Actions 탭 → Deploy → Run workflow로 바로 배포하거나, `main`에 푸시한다.

PR에서는 `.github/workflows/ci.yml`이 검사와 빌드만 한다.

### 수동 배포 (시크릿 등록 전)

최신 `main`을 받은 뒤 Aside 계정으로 `vercel deploy --prod --scope aside1`을 실행한다. Aside 작업용 Mac에서는 개인 인증과 분리된 `--global-config "$HOME/Library/Application Support/Aside/vercel-cli"`를 추가한다.

## 연결 현황 (2026-10-26 확인)

- 연결된 주소: https://solutions.asidepartners.kr (기본 주소: https://aside-solutions.vercel.app)
- Vercel 프로젝트: https://vercel.com/aside1/aside-solutions
- 예스닉 CNAME: `solutions` → `fd7557f35ed0b2ce.vercel-dns-017.com`. Vercel Valid Configuration 및 HTTPS 200 확인. 기존 루트 A 레코드·네임서버 유지.
- 업무 메일은 `solutions@asidepartners.kr`로 확정했고 Google Workspace 결제·도메인 인증·메일함 개설이 진행 중이다. 메일함이 열리기 전까지는 사이트의 문의 메일이 도착하지 않는다.
- 사용자 선택에 따라 유료 업그레이드 없이 Aside Hobby의 기존 설정을 유지했다.

## 운영 전 확인할 것

- 푸터 사업자 정보는 `data/site.json`의 `business`에서 나온다. aside.ai.kr과 같게 상호(에이사이드)·사업자등록번호·전화를 넣었다. 대표자·주소·통신판매업 신고번호는 비어 있으며, 채우면 푸터에 바로 표시된다(전자상거래법상 판매 페이지 표시 항목).
- 정식 오픈 시 `vercel.json`의 `X-Robots-Tag`와 `src/render.mjs`의 `robots` 메타태그를 지워 검색 노출을 연다.
- Hobby 플랜은 비상업용 전용이므로 실제 판매를 시작하기 전에 Pro 플랜 전환을 검토한다.
