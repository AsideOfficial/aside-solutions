// 정적 페이지 HTML 템플릿. build.mjs가 데이터를 넣어 호출한다.
import { ACCENTS } from './visual.mjs';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const ORDER_STEPS = [
  ['메일로 주문', '원하는 프로그램과 플랜, 사용 환경을 적어 보내 주세요.'],
  ['확인 회신', '사용 환경과 필요한 기능을 확인하고 전달 일정을 알려 드립니다.'],
  ['결제', '안내받은 금액을 결제하시면 세팅을 시작합니다.'],
  ['세팅해서 전달', '고객님 환경에 맞춰 세팅한 프로그램과 사용 설명서를 보내 드립니다.'],
  ['사용 지원', '쓰다가 막히는 부분은 메일로 물어보세요.'],
];

const COMMON_FAQ = [
  ['결제하면 바로 다운로드할 수 있나요?', '주문 메일을 받으면 사용 환경과 필요한 기능을 확인한 뒤, 고객님 환경에 맞춰 세팅해서 전달합니다. 전달 일정은 확인 회신 때 안내해 드립니다.'],
  ['표시된 가격이 최종 가격인가요?', '모든 가격은 부가세 포함 금액이며, 기본 구성 기준입니다. 계정 수를 늘리거나 기능을 추가하면 달라질 수 있고, 그 경우 결제 전에 먼저 안내해 드립니다.'],
  ['기능을 추가하거나 바꿀 수 있나요?', '네. 필요한 기능을 메일에 적어 주시면 함께 검토해서 견적에 반영합니다.'],
  ['찾는 프로그램이 목록에 없어요.', '원하는 기능을 메일로 알려 주세요. 비슷한 프로그램을 맞춤 제작할 수 있는지 검토해 회신드립니다.'],
];

// ── 작은 도우미들 ─────────────────────────────

const won = (n) => `${n.toLocaleString('ko-KR')}원`;
const plansOf = (p) => p.pricing?.plans ?? [];
const cheapest = (p) => plansOf(p).reduce((m, x) => (!m || x.price < m.price ? x : m), null);

export function mailto(site, subject, body) {
  return `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function orderMail(site, p, plan) {
  const what = p ? `${p.name}${plan ? ` · ${plan.name}` : ''}` : '';
  const subject = p ? `[구매 문의] ${what}${plan ? ` (${won(plan.price)})` : ''}` : `[문의] ${site.name} 프로그램 문의`;
  const body = [
    p ? `안녕하세요, ${what} 구매 문의드립니다.` : '안녕하세요, 프로그램 구매 문의드립니다.',
    '',
    '1. 성함 / 회사명:',
    '2. 연락처:',
    p ? '3. 사용 환경 (예: Windows 11 PC 1대):' : '3. 관심 있는 프로그램 또는 필요한 기능:',
    '4. 필요한 규모 (예: 계정 수, 관리 상품 수):',
    '5. 추가로 필요한 기능이나 궁금한 점:',
    '',
  ].join('\n');
  return { subject, body, href: mailto(site, subject, body) };
}

// 마지막 글자 받침 유무로 조사를 고른다. 예: josa('프라이스가드', '를', '을') → '프라이스가드를'
function josa(word, withoutFinal, withFinal) {
  const code = String(word).trim().slice(-1).charCodeAt(0) - 0xac00;
  const hasFinal = code >= 0 && code <= 11171 ? code % 28 !== 0 : /[013678lmn]$/i.test(word);
  return word + (hasFinal ? withFinal : withoutFinal);
}

const imageOf = (p) => p.image ?? `/images/screens/${p.slug}.svg`;
// 큰 화면 이미지: 작은 판이 있으면 화면 폭에 맞춰 고르게 한다.
const shotSrc = (p, sizes) => p.cardImage
  ? `src="${esc(p.image)}" srcset="${esc(p.cardImage)} 960w, ${esc(p.image)} 1920w" sizes="${sizes}"`
  : `src="${esc(imageOf(p))}"`;

const ICON_PATHS = {
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  check: '<path d="m5 12 4 4 10-10"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  sheet: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16M4 15h16M10 3v18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  tag: '<path d="M3 12V3h9l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 17-5-5-9 8"/>',
  send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
  book: '<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
};
const icon = (name, cls = 'ico') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICON_PATHS[name] ?? ICON_PATHS.check}</svg>`;

// 기능 제목·설명의 낱말로 아이콘을 고른다.
const FEATURE_ICONS = [
  [/알림|알려|텔레그램|공지/, 'bell'], [/엑셀|CSV|시트|장부|대장/, 'sheet'], [/예약|주기|시간|24시간|스케줄/, 'clock'],
  [/AI|GPT|자동 생성|요약/, 'spark'], [/분석|통계|차트|매출|판매량|순위|추적/, 'chart'], [/차단|방어|보호|하한|안전|동의/, 'shield'],
  [/이미지|썸네일|사진|도면/, 'image'], [/발송|전송|메시지|문자|업로드/, 'send'], [/수집|검색|조회|찾/, 'search'], [/설정|규칙|조건|옵션/, 'gear'],
  [/대량|일괄|여러|한 번에/, 'layers'],
];
const featureIcon = (f) => FEATURE_ICONS.find(([re]) => re.test(`${f.title} ${f.desc}`))?.[1] ?? 'bolt';

const btn = (href, label, ico = 'arrow') => `<a class="btn" href="${esc(href)}"><span>${esc(label)}</span><span class="btn-ico">${icon(ico)}</span></a>`;
const ghost = (href, label, ico) => `<a class="btn-ghost" href="${esc(href)}">${ico ? icon(ico) : ''}<span>${esc(label)}</span></a>`;
const copyBtn = (email) => `<button class="btn-ghost" type="button" data-copy="${esc(email)}">${icon('mail')}<span>메일 주소 복사</span></button>`;

// 두 줄 헤드라인: 얇은 줄 + 굵은 줄
const headline = (thin, bold, { tag = 'h2', id = '', cls = '' } = {}) =>
  `<${tag} class="hl ${cls}"${id ? ` id="${id}"` : ''}>${thin ? `<span class="hl-thin">${esc(thin)}</span>` : ''}<span class="hl-bold">${esc(bold)}</span></${tag}>`;

// 쉼표 앞은 얇게, 뒤는 굵게 (쉼표가 없으면 전부 굵게)
function splitHook(hook) {
  const i = hook.search(/[,，?]\s/);
  return i > 0 ? [hook.slice(0, i + 1), hook.slice(i + 2)] : ['', hook];
}

// ── 레이아웃 ─────────────────────────────

function layout(site, { title, description, path, body, accent, mail = orderMail(site), sticky = '', bodyClass = '' }) {
  const fullTitle = title ? `${title} | ${site.name}` : `${site.name} — 검증된 업무 자동화 프로그램`;
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#000000">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(site.url + path)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(site.url + path)}">
<meta property="og:locale" content="ko_KR">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Albert+Sans:wght@300;500;700&display=swap">
<link rel="stylesheet" href="/assets/styles.css">
</head>
<body class="${bodyClass}"${accent ? ` style="--accent:${accent}"` : ''}>
<a class="skip" href="#main">본문 바로가기</a>
<header class="site-header">
  <div class="wrap header-inner">
    ${logo(site)}
    <nav class="nav" aria-label="주요 메뉴">
      <a href="/#catalog">프로그램</a>
      <a href="/#why">왜 Aside인가</a>
      <a href="/#order">주문 방법</a>
      <a href="/#faq">FAQ</a>
    </nav>
    <a class="btn btn-sm" href="${esc(mail.href)}"><span>메일 문의</span><span class="btn-ico">${icon('mail')}</span></a>
  </div>
</header>
<main id="main">
${body}
</main>
${footer(site)}
${sticky}
<script src="/assets/app.js" defer></script>
</body>
</html>
`;
}

const logo = (site) => `<a class="logo" href="/" aria-label="${esc(site.name)} 홈"><img src="/brand/aside-logo-white.svg" alt="" width="92" height="28"><span>Solutions</span></a>`;

function footer(site) {
  const b = site.business ?? {};
  const rows = [
    ['상호', b.name || site.company],
    ['대표', b.ceo],
    ['사업자등록번호', b.registrationNumber],
    ['통신판매업 신고번호', b.mailOrderNumber],
    ['주소', b.address],
    ['전화', b.phone],
    ['이메일', site.email],
  ].filter(([, v]) => v);
  return `<footer class="site-footer">
  <div class="wrap footer-top">
    <div class="footer-brand">
      <p class="footer-powered">Powered by Aside Partners</p>
      ${headline('검증된 업무 자동화,', '시장가보다 합리적으로', { tag: 'p', cls: 'hl-sm' })}
      ${logo(site)}
    </div>
    <nav class="footer-links" aria-label="바로가기">
      <div><p>Programs</p><a href="/?category=commerce#catalog">셀러</a><a href="/?category=resale#catalog">리셀</a><a href="/?category=marketing#catalog">마케팅</a><a href="/?category=message#catalog">메시지</a></div>
      <div><p>&nbsp;</p><a href="/?category=data#catalog">데이터</a><a href="/?category=office#catalog">업무</a><a href="/?category=creator#catalog">방송</a></div>
      <div><p>Support</p><a href="/#order">주문 방법</a><a href="/#faq">자주 묻는 질문</a><a href="mailto:${esc(site.email)}">메일 문의</a></div>
    </nav>
  </div>
  <div class="wrap footer-bottom">
    <dl class="footer-biz">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${k === '이메일' ? `<a href="mailto:${esc(v)}">${esc(v)}</a>` : k === '전화' ? `<a href="tel:${esc(v.replaceAll('-', ''))}">${esc(v)}</a>` : esc(v)}</dd></div>`).join('')}</dl>
    <p>© ${new Date().getFullYear()} Aside. All rights reserved.</p>
  </div>
</footer>`;
}

// ── 공용 섹션 ─────────────────────────────

function orderSection() {
  return `<section class="section order" id="order" aria-labelledby="order-title">
  <div class="wrap">
    <div class="intro center">
      <p class="eyebrow">How to order</p>
      ${headline('장바구니도 회원가입도 없이', '주문은 메일 한 통이면 됩니다', { id: 'order-title' })}
    </div>
    <ol class="timeline">
      ${ORDER_STEPS.map(([t, d]) => `<li><strong>${esc(t)}</strong><span>${esc(d)}</span></li>`).join('\n      ')}
    </ol>
  </div>
</section>`;
}

const faqList = (items) => `<div class="faq">${items.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;

function mailSection(site, mail, { thin, bold, lead }) {
  return `<section class="mailbox" aria-labelledby="mailbox-title">
  <div class="wrap mailbox-inner">
    <div>
      <p class="eyebrow">Next step</p>
      ${headline(thin, bold, { id: 'mailbox-title' })}
      <p class="lead">${esc(lead)}</p>
      <div class="actions">${btn(mail.href, '메일로 문의하기', 'mail')}${copyBtn(site.email)}</div>
      <p class="mailbox-addr">${esc(site.email)}</p>
    </div>
    <figure class="mail-preview" aria-label="문의 메일 양식 예시">
      <div class="mail-bar"><span></span><span></span><span></span><em>새 메시지</em></div>
      <div class="mail-head"><span>받는 사람</span>${esc(site.email)}</div>
      <div class="mail-head"><span>제목</span>${esc(mail.subject)}</div>
      <pre>${esc(mail.body)}</pre>
    </figure>
  </div>
</section>`;
}

function card(p, categories) {
  const cat = categories.find((c) => c.id === p.category);
  const low = cheapest(p);
  const search = [p.name, p.fullName, p.summary, p.hook, p.subhook, ...p.keywords, ...p.features.map((f) => `${f.title} ${f.desc}`)].join(' ').toLowerCase();
  return `<li class="card" data-category="${esc(p.category)}" data-search="${esc(search)}" style="--accent:${ACCENTS[p.category]}">
  <a href="/products/${esc(p.slug)}/">
    <div class="cover${p.image ? ' cover-photo' : ''}">
      <img src="${esc(p.cardImage ?? imageOf(p))}" alt="${esc(p.name)} 프로그램 화면" width="1280" height="800" loading="lazy">
    </div>
    <div class="card-body">
      <p class="card-cat"><span class="dot" aria-hidden="true"></span>${esc(cat?.short)}${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ''}</p>
      <h3>${esc(p.name)}</h3>
      <p class="card-full">${esc(p.fullName)}</p>
      <p class="card-summary">${esc(p.summary)}</p>
      ${low ? `<p class="card-price"><strong>${esc(won(low.price))}</strong><span>부터 · ${esc(low.name)}</span><i class="br" aria-hidden="true"></i><span class="vat">부가세 포함</span></p>` : ''}
    </div>
  </a>
</li>`;
}

// 히어로 양옆에 떠 있는 제품 UI 카드
const pulseOf = (p) => {
  const v = p.visual;
  switch (v.type) {
    case 'table': return v.highlight;
    case 'alerts': return v.items[0].title;
    case 'dashboard': return `${v.kpis[0].label} ${v.kpis[0].value}`;
    case 'chat': return [...v.messages].reverse().find((m) => m.from === 'me')?.text ?? v.messages[0].text;
    default: return v.status;
  }
};

function heroCards(site, products) {
  const by = (s) => products.find((p) => p.slug === s);
  const toasts = (site.hero?.toasts ?? []).map(by).filter(Boolean);
  const table = by(site.hero?.window);
  const kpi = by(site.hero?.kpi);
  const left = `<div class="float float-left" aria-hidden="true">
    <div class="ui ui-head">Today's automation</div>
    ${toasts.slice(0, 3).map((p, i) => `<div class="ui ui-item" style="--accent:${ACCENTS[p.category]}">
      <div><strong>${esc(p.name)}</strong><span>${esc(pulseOf(p))}</span><em>${['방금', '3분 전', '12분 전'][i]}</em></div>
      <b>완료</b>
    </div>`).join('')}
  </div>`;
  const right = `<div class="float float-right" aria-hidden="true">
    <div class="ui ui-tabs">${icon('grid')}<span class="on">전체</span><span>셀러</span><span>마케팅</span></div>
    ${kpi ? `<div class="ui ui-kpi" style="--accent:${ACCENTS[kpi.category]}"><span>${esc(kpi.visual.kpis[0].label)}</span><strong>${esc(kpi.visual.kpis[0].value)}</strong><em>${esc(kpi.name)} · ${esc(kpi.visual.kpis[1].label)} ${esc(kpi.visual.kpis[1].value)}</em></div>` : ''}
    ${table ? `<div class="ui ui-table" style="--accent:${ACCENTS[table.category]}">
      <strong>${esc(table.name)}</strong>
      ${table.visual.rows.slice(0, 3).map((r) => `<div><span>${esc(r[0])}</span><b>${esc(r[r.length - 1])}</b></div>`).join('')}
      <em>${icon('check')}${esc(table.visual.highlight)}</em>
    </div>` : ''}
  </div>`;
  return left + right;
}

// ── 홈 ─────────────────────────────

export function renderHome({ site, categories, products }) {
  const mail = orderMail(site);
  const counts = Object.fromEntries(categories.map((c) => [c.id, products.filter((p) => p.category === c.id).length]));
  const feature = products.find((p) => p.slug === site.hero?.window) ?? products[0];
  const groups = [
    ['sales', 'Commerce & Marketing', '판매·마케팅 자동화'],
    ['ops', 'Data & Operations', '데이터·업무·방송 자동화'],
  ];
  const body = `
<section class="hero"${site.heroImage ? ` style="--hero-image:url('${esc(site.heroImage)}')"` : ''}>
  ${heroCards(site, products)}
  <div class="wrap hero-inner">
    <p class="hero-kicker">시장에서 검증된 업무 자동화 프로그램 ${products.length}종</p>
    ${headline('남들은 이미 쓰는 자동화 프로그램,', '메일 한 통이면 내 것이 됩니다', { tag: 'h1' })}
    <p class="hero-lead">스마트스토어 최저가 방어부터 KREAM 입찰 관리, 나라장터 공고 알림까지. <br>이미 많이 팔린 기능을 <b>시장가보다 합리적인 가격</b>에, 내 PC에 맞춰 세팅해 드립니다.</p>
    <div class="actions center">${btn('#catalog', '프로그램 둘러보기')}${ghost(mail.href, '메일로 문의', 'mail')}</div>
  </div>
</section>

<section class="section split" aria-labelledby="proven-title">
  <div class="wrap split-inner">
    <div class="split-copy">
      <p class="eyebrow">Proven by market</p>
      ${headline('시장에서 이미 팔리고 있는', '검증된 기능만 골랐습니다', { id: 'proven-title' })}
      <p class="lead">프리랜서 마켓에서 리뷰와 판매가 꾸준히 쌓인 업무 자동화 프로그램을 분석해, 같은 기능을 갖춘 ${products.length}종으로 정리했습니다. 무엇을 자동화할지 고민하는 시간부터 줄여 드립니다.</p>
      <div class="actions">${btn('#catalog', '프로그램 살펴보기')}${ghost(`/products/${feature.slug}/`, `${feature.name} 보기`, 'book')}</div>
    </div>
    <div class="split-visual ring-red">
      <span class="ring" aria-hidden="true"></span>
      <img ${shotSrc(feature, '(max-width: 900px) 100vw, 640px')} alt="${esc(feature.name)} 프로그램 화면" width="1280" height="800" loading="lazy">
    </div>
  </div>
</section>

<section class="section split reverse" aria-labelledby="setup-title">
  <div class="wrap split-inner">
    <div class="split-copy">
      <p class="eyebrow">Set up for you</p>
      ${headline('설치 파일만 보내지 않습니다', '내 PC에 맞춰 세팅해 드립니다', { id: 'setup-title' })}
      <p class="lead">주문 메일에 사용 환경을 적어 주시면, 고객님 PC와 계정에 맞춰 세팅한 프로그램과 사용 설명서를 함께 보내 드립니다. 쓰다가 막히는 부분은 메일로 물어보세요.</p>
      <div class="actions">${btn('#order', '주문 방법 보기')}${ghost(mail.href, '메일로 문의', 'mail')}</div>
    </div>
    <div class="split-visual ring-violet">
      <span class="orb" aria-hidden="true"></span>
      <figure class="mail-preview mail-float" aria-label="주문 메일 예시">
        <div class="mail-bar"><span></span><span></span><span></span><em>새 메시지</em></div>
        <div class="mail-head"><span>받는 사람</span>${esc(site.email)}</div>
        <div class="mail-head"><span>제목</span>[구매 문의] ${esc(feature.name)} · ${esc(cheapest(feature)?.name ?? '기본 구성')}</div>
        <pre>1. 성함 / 회사명: 바른상회 김대표
2. 사용 환경: Windows 11 PC 1대
3. 필요한 규모: 관리 상품 120개</pre>
      </figure>
      <div class="ui ui-item ui-done" style="--accent:${ACCENTS.message}"><div><strong>세팅 완료</strong><span>프로그램과 사용 설명서를 보냈습니다</span></div><b>전달</b></div>
    </div>
  </div>
</section>

<section class="section catalog-map" aria-labelledby="map-title">
  <div class="wrap">
    <div class="intro">
      <p class="eyebrow">Integrated catalog</p>
      ${headline('셀러부터 사무실까지', `${categories.length}개 분야, ${products.length}가지 자동화`, { id: 'map-title' })}
      <p class="lead">스토어 운영, 리셀, 마케팅, 고객 메시지부터 데이터 수집과 사무 업무, 방송까지. 반복되는 일을 분야별로 골라 보세요.</p>
    </div>
    <div class="glass-grid">
      ${groups.map(([g, en, ko], gi) => `<div class="glass">
        <p class="glass-title">${esc(en)}</p>
        <p class="glass-bar g${gi}">${esc(ko)}</p>
        <div class="glass-cols">
          ${categories.filter((c) => c.group === g).map((c) => `<div class="glass-cat" style="--accent:${ACCENTS[c.id]}">
            <a class="glass-cat-name" href="/?category=${esc(c.id)}#catalog"><span class="dot"></span>${esc(c.name)} <em>${counts[c.id]}</em></a>
            <ul>${products.filter((p) => p.category === c.id).slice(0, 4).map((p) => `<li><a href="/products/${esc(p.slug)}/"><b>${esc(p.name)}</b><span>${esc(p.fullName)}</span></a></li>`).join('')}</ul>
          </div>`).join('')}
        </div>
      </div>`).join('')}
    </div>
  </div>
</section>

<section class="section catalog" id="catalog" aria-labelledby="catalog-title">
  <div class="wrap">
    <div class="intro center">
      <p class="eyebrow">Programs</p>
      ${headline('어떤 일을 자동으로', '맡기고 싶으세요?', { id: 'catalog-title' })}
    </div>
    <div class="catalog-tools">
      <div class="chips" role="group" aria-label="분야 선택">
        <button type="button" class="chip" aria-pressed="true" data-filter="all">전체 <span>${products.length}</span></button>
        ${categories.map((c) => `<button type="button" class="chip" aria-pressed="false" data-filter="${esc(c.id)}" style="--accent:${ACCENTS[c.id]}">${esc(c.short)} <span>${counts[c.id]}</span></button>`).join('\n        ')}
      </div>
      <label class="search">${icon('search')}<span class="visually-hidden">프로그램 검색</span><input type="search" placeholder="하고 싶은 일 검색 (예: 가격, 카톡, 재고)" data-search-input></label>
    </div>
    <p class="result-count" aria-live="polite" data-result-count>${products.length}개 프로그램</p>
    <ul class="grid" data-grid>
      ${products.map((p) => card(p, categories)).join('\n')}
    </ul>
    <div class="empty" data-empty hidden>
      <p>딱 맞는 프로그램이 없나요? 하고 싶은 일을 메일로 알려 주시면 맞춤 제작을 검토해 드립니다.</p>
      ${btn(mail.href, '원하는 기능 문의하기', 'mail')}
    </div>
  </div>
</section>

<section class="section why" id="why" aria-labelledby="why-title">
  <div class="wrap">
    <div class="intro center">
      <p class="eyebrow">Why Aside Solutions</p>
      ${headline('검증된 기능에 더해', '합리적인 가격과 세팅까지', { id: 'why-title' })}
    </div>
    <div class="value-grid">
      <div class="value">${icon('tag')}<h3>시장가보다 합리적인 가격</h3><p>같은 기능의 시장 판매가를 기준으로, 모든 제품의 가격을 더 낮게 정했습니다.</p></div>
      <div class="value">${icon('gear')}<h3>내 환경에 맞춘 세팅</h3><p>PC, 계정, 업무 방식에 맞춰 세팅하고 사용 설명서까지 함께 드립니다.</p></div>
      <div class="value">${icon('layers')}<h3>필요한 기능은 추가</h3><p>"이 기능 하나만 더 있으면" 싶은 부분은 메일로 말씀해 주세요. 견적에 반영합니다.</p></div>
      <div class="value">${icon('mail')}<h3>메일 한 통으로 주문</h3><p>회원가입도 장바구니도 없습니다. 원하는 프로그램과 플랜만 적어 보내 주세요.</p></div>
    </div>
  </div>
</section>

<section class="stats" aria-labelledby="stats-title">
  <span class="streaks" aria-hidden="true"></span>
  <div class="wrap stats-inner">
    <div>
      <p class="eyebrow">Aside Solutions</p>
      ${headline('업무 자동화를 고르는', '가장 빠른 방법', { id: 'stats-title' })}
      <p class="lead">무엇을 자동화할 수 있는지 찾고, 가격을 비교하고, 개발자를 수소문하던 시간을 줄여 드립니다.</p>
    </div>
    <dl class="stat-list">
      <div><dt>${products.length}</dt><dd>바로 주문 가능한 프로그램</dd></div>
      <div><dt>${categories.length}</dt><dd>업무 분야</dd></div>
      <div><dt>10%</dt><dd>시장가보다 낮춘 가격 (약)</dd></div>
    </dl>
  </div>
</section>

${orderSection()}

<section class="section" id="faq" aria-labelledby="faq-title">
  <div class="wrap narrow">
    <div class="intro center">
      <p class="eyebrow">FAQ</p>
      ${headline('', '자주 묻는 질문', { id: 'faq-title' })}
    </div>
    ${faqList(COMMON_FAQ)}
  </div>
</section>

${mailSection(site, mail, { thin: '반복하던 일, 이제', bold: '프로그램에게 맡기세요', lead: '찾는 프로그램이 목록에 없어도 괜찮습니다. 어떤 일을 자동화하고 싶은지 적어 보내 주시면 검토해서 회신드립니다.' })}

<section class="bigtype" aria-label="Automate every routine">
  <p><span>AUTOMATE</span><span>EVERY</span><span>R<i aria-hidden="true"></i>UTINE</span></p>
</section>
`;
  return layout(site, { title: '', description: site.description, path: '/', body, bodyClass: 'home' });
}

// ── 제품 상세 ─────────────────────────────

export function renderProduct({ site, categories, product: p, related }) {
  const cat = categories.find((c) => c.id === p.category);
  const accent = ACCENTS[p.category];
  const mail = orderMail(site, p);
  const plans = plansOf(p);
  const low = cheapest(p);
  const [thin, bold] = splitHook(p.hook);
  const specs = [
    ['제공 형태', p.specs.type],
    ['사용 환경', p.specs.env],
    ['준비하실 것', p.specs.needs ?? '별도 준비물 없음'],
    ['전달', '주문 확인 후 맞춤 세팅하여 전달'],
  ];
  const featured = plans.length === 3 ? 1 : -1;
  const body = `
<section class="p-hero">
  <span class="p-glow" aria-hidden="true"></span>
  <div class="wrap">
    <nav class="crumbs" aria-label="현재 위치"><a href="/#catalog">프로그램</a><span aria-hidden="true">/</span><a href="/?category=${esc(p.category)}#catalog">${esc(cat?.name)}</a></nav>
    <div class="p-hero-copy">
      <p class="p-name"><span class="dot" aria-hidden="true"></span><strong>${esc(p.name)}</strong><span>${esc(p.fullName)}</span></p>
      ${headline(thin, bold, { tag: 'h1' })}
      <p class="lead">${esc(p.subhook)}</p>
      ${low ? `<p class="p-price"><strong>${esc(won(low.price))}</strong><span>부터 · ${esc(low.name)} · 부가세 포함</span></p>` : ''}
      <div class="actions center">${btn(mail.href, '구매 문의하기', 'mail')}${plans.length ? ghost('#pricing', '가격 플랜 보기', 'tag') : ''}</div>
    </div>
  </div>
  <figure class="wrap p-shot">
    <img ${shotSrc(p, '(max-width: 1200px) 100vw, 1160px')} alt="${esc(p.name)} 프로그램 화면" width="1280" height="800">
    <figcaption>${esc(p.name)} 화면 예시 · 실제 화면은 세팅 환경에 따라 다를 수 있습니다.</figcaption>
  </figure>
</section>

<section class="section pains" aria-labelledby="pains-title">
  <div class="wrap">
    <div class="intro">
      <p class="eyebrow">Problem</p>
      ${headline('매일 반복되는', '이런 상황, 익숙하시죠?', { id: 'pains-title' })}
    </div>
    <div class="pain-grid">
      ${p.pains.map((x) => `<div class="pain"><h3>${esc(x.title)}</h3><p>${esc(x.desc)}</p></div>`).join('\n      ')}
    </div>
    <div class="ba">
      <div class="ba-before"><p class="ba-label">지금까지는</p><p>${esc(p.before)}</p></div>
      <div class="ba-after"><p class="ba-label">${esc(josa(p.name, '를', '을'))} 쓰면</p><p>${esc(p.after)}</p></div>
    </div>
  </div>
</section>

<section class="section features" aria-labelledby="features-title">
  <div class="wrap">
    <div class="intro center">
      <p class="eyebrow">Features</p>
      ${headline(`${josa(p.name, '가', '이')}`, '대신 해 드리는 일', { id: 'features-title' })}
    </div>
    <div class="feature-grid">
      ${p.features.map((f) => `<div class="feature">${icon(featureIcon(f))}<h3>${esc(f.title)}</h3><p>${esc(f.desc)}</p></div>`).join('\n      ')}
    </div>
  </div>
</section>

${plans.length ? `<section class="section pricing" id="pricing" aria-labelledby="pricing-title">
  <div class="wrap">
    <div class="intro center">
      <p class="eyebrow">Pricing</p>
      ${headline('시장가보다 합리적인', `${p.name} 가격`, { id: 'pricing-title' })}
    </div>
    <div class="plan-grid n${plans.length}">
      ${plans.map((pl, i) => `<div class="plan${i === featured ? ' plan-featured' : ''}">
        ${i === featured ? '<p class="plan-tag">추천</p>' : ''}
        <h3>${esc(pl.name)}</h3>
        <p class="plan-price"><strong>${esc(pl.price.toLocaleString('ko-KR'))}</strong><span>원</span><span class="vat">부가세 포함</span></p>
        <ul>${pl.features.map((f) => `<li>${icon('check')}${esc(f)}</li>`).join('')}</ul>
        ${btn(orderMail(site, p, pl).href, '이 플랜으로 문의', 'mail')}
      </div>`).join('\n      ')}
    </div>
    <p class="plan-note">${p.pricing.note ? `${esc(p.pricing.note)} · ` : ''}표시 가격은 부가세 포함, 기본 구성 기준입니다. 계정 수·기능 추가에 따라 달라질 수 있으며, 결제 전에 먼저 안내해 드립니다.</p>
  </div>
</section>` : ''}

<section class="section steps" aria-labelledby="steps-title">
  <div class="wrap">
    <div class="intro center">
      <p class="eyebrow">How it works</p>
      ${headline('설치부터 실행까지', '세 단계면 충분합니다', { id: 'steps-title' })}
    </div>
    <ol class="step-list">
      ${p.steps.map((x) => `<li><h3>${esc(x.title)}</h3><p>${esc(x.desc)}</p></li>`).join('\n      ')}
    </ol>
  </div>
</section>

<section class="section fit" aria-label="추천 대상과 제품 정보">
  <div class="wrap fit-grid">
    <div>
      <p class="eyebrow">For you</p>
      ${headline('', '이런 분께 추천합니다')}
      <ul class="checks">${p.targets.map((t) => `<li>${icon('check')}${esc(t)}</li>`).join('')}</ul>
    </div>
    <div>
      <p class="eyebrow">Spec</p>
      ${headline('', '제품 정보')}
      <dl class="spec">${specs.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      ${p.notice ? `<p class="notice">${esc(p.notice)}</p>` : ''}
    </div>
  </div>
</section>

${orderSection()}

<section class="section" aria-labelledby="faq-title">
  <div class="wrap narrow">
    <div class="intro center">
      <p class="eyebrow">FAQ</p>
      ${headline('', '자주 묻는 질문', { id: 'faq-title' })}
    </div>
    ${faqList([...p.faq.map((x) => [x.q, x.a]), ...COMMON_FAQ.slice(0, 2)])}
  </div>
</section>

${mailSection(site, mail, { thin: `${p.name},`, bold: '메일로 바로 문의하세요', lead: '버튼을 누르면 양식이 채워진 메일 창이 열립니다. 확인 후 전달 일정과 결제 방법을 회신드립니다.' })}

${related.length ? `<section class="section related" aria-labelledby="related-title">
  <div class="wrap">
    <div class="intro">
      <p class="eyebrow">More in ${esc(cat?.en)}</p>
      ${headline('', `함께 많이 찾는 ${cat?.short} 프로그램`, { id: 'related-title' })}
    </div>
    <ul class="grid grid-4">${related.map((r) => card(r, categories)).join('\n')}</ul>
  </div>
</section>` : ''}
`;
  const sticky = `<div class="buybar">
  <span class="buybar-name"><strong>${esc(p.name)}</strong><span>${low ? `${esc(won(low.price))}부터 · 부가세 포함` : '메일로 가격 안내'}</span></span>
  ${btn(mail.href, '구매 문의', 'mail')}
</div>`;
  return layout(site, { title: `${p.name} — ${p.fullName}`, description: `${p.hook}. ${p.subhook}`, path: `/products/${p.slug}/`, body, accent, mail, sticky, bodyClass: 'product' });
}

export function render404({ site }) {
  const body = `<section class="section notfound"><div class="wrap narrow">
  ${headline('주소가 바뀌었거나 없는 페이지입니다', '페이지를 찾을 수 없습니다', { tag: 'h1' })}
  <div class="actions center">${btn('/#catalog', '전체 프로그램 보기')}</div>
</div></section>`;
  return layout(site, { title: '페이지를 찾을 수 없습니다', description: site.description, path: '/404', body });
}
