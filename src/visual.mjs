// 제품 데이터(visual + screen)로 "실제 프로그램 화면" SVG를 만든다.
// <img>로 삽입되므로 웹폰트 대신 시스템 한글 폰트를 쓴다.

export const ACCENTS = {
  commerce: '#3B6BFF',
  resale: '#8B5CF6',
  marketing: '#EC4899',
  message: '#14B8A6',
  data: '#F59E0B',
  office: '#22C55E',
  creator: '#F43F5E',
};

const W = 1280;
const H = 800;
const SIDE = 300;
const FONT = "'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif";
const MONO = "Consolas,'D2Coding','Malgun Gothic',monospace";
const INK = '#1B2340';
const INK2 = '#4A5470';
const MUTED = '#7A8399';
const LINE = '#E3E7EF';
const FRAME = '#CDD3DF';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const clip = (s, n) => ([...String(s ?? '')].length > n ? [...String(s)].slice(0, n - 1).join('') + '…' : String(s ?? ''));
// 맑은 고딕 기준 폭 어림: 한글 0.92em, 공백 0.3em, 영문·숫자 0.56em. 굵은 글씨는 7% 넓게.
const measure = (s, size, bold = false) => [...String(s)].reduce((w, c) => w + size * (c === ' ' ? 0.3 : c.charCodeAt(0) > 0x2e80 ? 0.92 : 0.56), 0) * (bold ? 1.07 : 1);

const text = (x, y, s, { size = 14, weight = 400, fill = INK, anchor = 'start', family } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${family ? ` font-family="${family}"` : ''}>${esc(s)}</text>`;

const pill = (x, y, label, accent, { size = 12, solid = false, alpha = 0.14 } = {}) => {
  const w = measure(label, size, true) + 22;
  return `<rect x="${x}" y="${y}" width="${w}" height="${size + 13}" rx="${(size + 13) / 2}" fill="${accent}" fill-opacity="${solid ? 1 : alpha}"/>`
    + text(x + w / 2, y + size + 3, label, { size, weight: 700, fill: solid ? '#fff' : accent, anchor: 'middle' });
};

const check = (x, y, color, size = 1) => `<path d="M${x} ${y} l${4 * size} ${4 * size} l${8 * size} -${9 * size}" stroke="${color}" stroke-width="${2.2 * size}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;

// ── 본문 영역(box 안에 그림) ─────────────────────────────

function table(v, a, b, extra = []) {
  const rows = [...v.rows, ...extra];
  const cols = v.columns.length;
  const first = b.w * (cols === 4 ? 0.34 : 0.4);
  const rest = (b.w - first) / (cols - 1);
  const xs = v.columns.map((_, i) => b.x + (i === 0 ? 0 : first + rest * (i - 1)));
  const rowH = Math.min(52, (b.h - 40 - 58) / rows.length);
  let out = `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="38" rx="8" fill="${a}" fill-opacity=".08"/>`;
  out += v.columns.map((c, i) => text(xs[i] + 16, b.y + 24, clip(c, 7), { size: 13, weight: 700, fill: a })).join('');
  rows.forEach((row, r) => {
    const y = b.y + 38 + r * rowH;
    if (r % 2 === 1) out += `<rect x="${b.x}" y="${y}" width="${b.w}" height="${rowH}" fill="#F7F8FB"/>`;
    out += `<line x1="${b.x}" y1="${y + rowH}" x2="${b.x + b.w}" y2="${y + rowH}" stroke="${LINE}"/>`;
    row.forEach((cell, i) => {
      const ty = y + rowH / 2 + 5;
      if (i === cols - 1) out += pill(xs[i] + 12, ty - 17, clip(cell, 9), a, { alpha: r % 2 ? 0.1 : 0.16 });
      else out += text(xs[i] + 16, ty, clip(cell, 9), { size: 14, weight: i === 0 ? 700 : 400, fill: i === 0 ? INK : INK2 });
    });
  });
  const label = clip(v.highlight, 18);
  const hw = measure(label, 13, true) + 50;
  const hy = b.y + b.h - 36;
  out += `<rect x="${b.x + b.w - hw}" y="${hy}" width="${hw}" height="34" rx="17" fill="${a}"/>`;
  out += check(b.x + b.w - hw + 16, hy + 17, '#fff');
  out += text(b.x + b.w - hw + 36, hy + 22, label, { size: 13, weight: 700, fill: '#fff' });
  out += text(b.x, hy + 22, `${rows.length}개 항목 표시 중`, { size: 12, fill: MUTED });
  return out;
}

function dashboard(v, a, b) {
  const gap = 14;
  const bw = (b.w - gap * 2) / 3;
  let out = v.kpis.map((k, i) => {
    const x = b.x + i * (bw + gap);
    return `<rect x="${x}" y="${b.y}" width="${bw}" height="96" rx="12" fill="${i === 0 ? a : '#F4F6FA'}"/>`
      + text(x + 20, b.y + 32, clip(k.label, 8), { size: 13, fill: i === 0 ? '#ffffffd0' : MUTED })
      + text(x + 20, b.y + 74, clip(k.value, 9), { size: 30, weight: 700, fill: i === 0 ? '#fff' : INK });
  }).join('');
  const cy = b.y + 124;
  out += text(b.x, cy + 6, clip(v.chartLabel, 16), { size: 14, weight: 700 });
  out += pill(b.x + b.w - 116, cy - 12, '최근 데이터', a);
  const n = v.series.length;
  const g = 12;
  const barW = (b.w - g * (n - 1)) / n;
  const base = b.y + b.h - 6;
  const top = cy + 30;
  const maxH = base - top;
  for (let i = 1; i <= 3; i++) out += `<line x1="${b.x}" y1="${base - (i * maxH) / 3}" x2="${b.x + b.w}" y2="${base - (i * maxH) / 3}" stroke="${LINE}" stroke-dasharray="3 5"/>`;
  v.series.forEach((s, i) => {
    const h = Math.max(6, (s / 100) * maxH);
    out += `<rect x="${b.x + i * (barW + g)}" y="${base - h}" width="${barW}" height="${h}" rx="6" fill="${a}" fill-opacity="${i === n - 1 ? 1 : 0.25 + (0.5 * i) / n}"/>`;
  });
  out += `<line x1="${b.x}" y1="${base}" x2="${b.x + b.w}" y2="${base}" stroke="${INK}" stroke-opacity=".25"/>`;
  return out;
}

function chat(v, a, b) {
  let y = b.y + 4;
  let out = '';
  const step = Math.min(64, (b.h - 70) / v.messages.length);
  for (const m of v.messages) {
    const s = clip(m.text, 28);
    const w = Math.min(measure(s, 15) + 36, b.w * 0.75);
    const x = m.from === 'me' ? b.x + b.w - w : b.x;
    out += `<rect x="${x}" y="${y}" width="${w}" height="44" rx="20" fill="${m.from === 'me' ? a : '#EEF1F6'}"/>`;
    out += text(x + 18, y + 28, s, { size: 15, fill: m.from === 'me' ? '#fff' : INK });
    y += step;
  }
  const iy = b.y + b.h - 48;
  out += `<rect x="${b.x}" y="${iy}" width="${b.w}" height="46" rx="23" fill="#fff" stroke="${LINE}"/>`;
  out += text(b.x + 22, iy + 28, '예약 메시지 입력…', { size: 14, fill: MUTED });
  out += `<circle cx="${b.x + b.w - 24}" cy="${iy + 23}" r="16" fill="${a}"/><path d="M${b.x + b.w - 31} ${iy + 23} h13 m-5 -5 l5 5 l-5 5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  return out;
}

function alerts(v, a, b) {
  const gap = 12;
  const h = Math.min(84, (b.h - gap * (v.items.length - 1)) / v.items.length);
  return v.items.map((it, i) => {
    const y = b.y + i * (h + gap);
    const cy = y + h / 2;
    const tag = clip(it.tag, 5);
    const tw = measure(tag, 12, true) + 22;
    return `<rect x="${b.x}" y="${y}" width="${b.w}" height="${h}" rx="12" fill="${i === 0 ? '#fff' : '#F7F8FB'}" stroke="${i === 0 ? a : LINE}" stroke-width="${i === 0 ? 1.6 : 1}"/>`
      + `<circle cx="${b.x + 38}" cy="${cy}" r="20" fill="${a}" fill-opacity="${i === 0 ? 1 : 0.14}"/>`
      + `<path d="M${b.x + 30} ${cy + 6} h16 l-2 -3 v-7 a6 6 0 0 0 -12 0 v7 z M${b.x + 35} ${cy + 9} h6" stroke="${i === 0 ? '#fff' : a}" stroke-width="1.8" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`
      + text(b.x + 74, cy - 4, clip(it.title, 22), { size: 16, weight: 700 })
      + text(b.x + 74, cy + 18, clip(it.meta, 16), { size: 13, fill: MUTED })
      + `<rect x="${b.x + b.w - 18 - tw}" y="${cy - 13}" width="${tw}" height="26" rx="13" fill="${a}" fill-opacity=".12"/>`
      + text(b.x + b.w - 18 - tw / 2, cy + 5, tag, { size: 12, weight: 700, fill: a, anchor: 'middle' });
  }).join('');
}

function flow(v, a, b) {
  const n = v.steps.length;
  const gap = 34;
  const bw = (b.w - gap * (n - 1)) / n;
  let out = '';
  v.steps.forEach((s, i) => {
    const x = b.x + i * (bw + gap);
    const done = i < n - 1;
    out += `<rect x="${x}" y="${b.y}" width="${bw}" height="76" rx="12" fill="${done ? a : '#fff'}" fill-opacity="${done ? 0.1 : 1}" stroke="${a}" stroke-width="${done ? 0 : 2}"/>`;
    out += `<circle cx="${x + 22}" cy="${b.y + 22}" r="10" fill="${a}" fill-opacity="${done ? 1 : 0.2}"/>`;
    if (done) out += check(x + 17, b.y + 22, '#fff', 0.8);
    out += text(x + 16, b.y + 58, clip(s, 8), { size: 15, weight: 700, fill: done ? INK : a });
    out += text(x + bw - 14, b.y + 27, done ? '완료' : '진행 중', { size: 11, weight: 700, fill: done ? MUTED : a, anchor: 'end' });
    if (i < n - 1) out += `<path d="M${x + bw + 8} ${b.y + 38} h18 m-6 -6 l6 6 l-6 6" stroke="${a}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  });
  const ly = b.y + 98;
  const lh = Math.min(48 + v.logs.length * 34, b.h - 98 - 70);
  out += `<rect x="${b.x}" y="${ly}" width="${b.w}" height="${lh}" rx="12" fill="#F4F6FA" stroke="${LINE}"/>`;
  out += text(b.x + 20, ly + 28, '처리 내역', { size: 12, weight: 700, fill: MUTED });
  v.logs.forEach((l, i) => {
    out += check(b.x + 22, ly + 56 + i * 34, a, 0.85);
    out += text(b.x + 44, ly + 61 + i * 34, clip(l, 24), { size: 14, fill: INK });
  });
  const py = b.y + b.h - 34;
  out += text(b.x, py - 12, clip(v.status, 20), { size: 14, weight: 700 });
  out += text(b.x + b.w, py - 12, '72%', { size: 13, weight: 700, fill: a, anchor: 'end' });
  out += `<rect x="${b.x}" y="${py}" width="${b.w}" height="12" rx="6" fill="${LINE}"/><rect x="${b.x}" y="${py}" width="${b.w * 0.72}" height="12" rx="6" fill="${a}"/>`;
  return out;
}

function gallery(v, a, b) {
  const gap = 16;
  const tw = (b.w - gap * 2) / 3;
  const th = (b.h - 70 - gap) / 2;
  let out = '';
  v.tiles.forEach((t, i) => {
    const x = b.x + (i % 3) * (tw + gap);
    const y = b.y + Math.floor(i / 3) * (th + gap);
    out += `<rect x="${x}" y="${y}" width="${tw}" height="${th}" rx="10" fill="url(#g${i % 3})"/>`;
    out += `<circle cx="${x + tw * 0.7}" cy="${y + th * 0.36}" r="${18 + (i % 3) * 5}" fill="#fff" fill-opacity=".55"/>`;
    out += `<path d="M${x} ${y + th - 30} l${tw * 0.32} -40 l${tw * 0.24} 26 l${tw * 0.18} -16 l${tw * 0.26} 30 v${0} V${y + th - 10} a10 10 0 0 1 -10 10 H${x + 10} a10 10 0 0 1 -10 -10 z" fill="#fff" fill-opacity=".35"/>`;
    const label = clip(t, 6);
    const lw = measure(label, 12, true) + 20;
    out += `<rect x="${x + 12}" y="${y + th - 36}" width="${lw}" height="24" rx="12" fill="#fff"/>`;
    out += text(x + 12 + lw / 2, y + th - 19, label, { size: 12, weight: 700, anchor: 'middle' });
    if (i < 4) out += `<circle cx="${x + tw - 20}" cy="${y + 20}" r="11" fill="#fff"/>` + check(x + tw - 26, y + 20, a, 0.8);
  });
  const py = b.y + b.h - 26;
  out += text(b.x, py - 12, clip(v.status, 20), { size: 14, weight: 700 });
  out += `<rect x="${b.x}" y="${py}" width="${b.w}" height="12" rx="6" fill="${LINE}"/><rect x="${b.x}" y="${py}" width="${b.w * 0.66}" height="12" rx="6" fill="${a}"/>`;
  return out;
}

const BODIES = { table, dashboard, chat, alerts, flow, gallery };

// ── 프로그램 창 틀 ─────────────────────────────

const ICONS = [
  [/중지|정지|멈춤/, (x, y) => `<rect x="${x - 5}" y="${y - 5}" width="10" height="10" rx="2" fill="currentColor"/>`],
  [/새로|갱신|동기화/, (x, y) => `<path d="M${x + 6} ${y - 3} a6.5 6.5 0 1 0 1 5 M${x + 6} ${y - 8} v5 h-5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>`],
  [/저장|엑셀|내보|다운|백업/, (x, y) => `<path d="M${x} ${y - 7} v10 m-5 -5 l5 5 l5 -5 M${x - 7} ${y + 7} h14" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`],
  [/설정|옵션/, (x, y) => `<circle cx="${x}" cy="${y}" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="${x}" cy="${y}" r="7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-dasharray="3 2.5"/>`],
  [/불러|열기|추가|업로드|등록/, (x, y) => `<path d="M${x - 7} ${y + 6} v-11 h5 l2 2 h7 v9 z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/>`],
  [/미리|보기|확인|검색|조회/, (x, y) => `<circle cx="${x - 1}" cy="${y - 1}" r="5.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M${x + 3} ${y + 3} l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`],
];
const PLAY = (x, y) => `<path d="M${x - 4} ${y - 6} l10 6 l-10 6 z" fill="currentColor"/>`;
const DOT = (x, y) => `<circle cx="${x}" cy="${y}" r="3.5" fill="currentColor"/>`;

function toolbar(labels, a) {
  let x = 16;
  let out = '';
  labels.forEach((label, i) => {
    const primary = i === 0;
    const icon = primary ? PLAY : (ICONS.find(([re]) => re.test(label))?.[1] ?? DOT);
    const w = measure(label, 13, true) + 50;
    out += `<g color="${primary ? '#fff' : INK2}"><rect x="${x}" y="74" width="${w}" height="32" rx="7" fill="${primary ? a : '#fff'}" stroke="${primary ? a : FRAME}"/>`;
    out += icon(x + 19, 90) + text(x + 34, 95, label, { size: 13, weight: 700, fill: primary ? '#fff' : INK }) + '</g>';
    x += w + 8;
    if (i === 0) { out += `<line x1="${x + 2}" y1="78" x2="${x + 2}" y2="102" stroke="${LINE}"/>`; x += 12; }
  });
  return out;
}

function sidebar(s, a) {
  let out = `<rect x="0" y="116" width="${SIDE}" height="${H - 116 - 30}" fill="#F7F8FA"/><line x1="${SIDE}" y1="116" x2="${SIDE}" y2="${H - 30}" stroke="${LINE}"/>`;
  out += text(20, 146, '설정', { size: 13, weight: 700, fill: MUTED });
  let y = 164;
  for (const f of s.settings) {
    out += text(20, y + 12, clip(f.label, 8), { size: 12, fill: INK2 });
    out += `<rect x="20" y="${y + 20}" width="${SIDE - 40}" height="32" rx="6" fill="#fff" stroke="${FRAME}"/>`;
    out += text(32, y + 41, clip(f.value, 16), { size: 13, fill: INK });
    out += `<path d="M${SIDE - 38} ${y + 34} l4 4 l4 -4" stroke="${MUTED}" stroke-width="1.5" fill="none"/>`;
    y += 62;
  }
  y += 10;
  out += text(20, y + 12, '옵션', { size: 13, weight: 700, fill: MUTED });
  y += 26;
  for (const o of s.options) {
    out += `<rect x="20" y="${y}" width="18" height="18" rx="4" fill="${o.on ? a : '#fff'}" stroke="${o.on ? a : FRAME}"/>`;
    if (o.on) out += check(24, y + 9, '#fff', 0.7);
    out += text(48, y + 14, clip(o.label, 14), { size: 13, fill: INK });
    y += 30;
  }
  out += `<rect x="20" y="${H - 30 - 58}" width="${SIDE - 40}" height="38" rx="8" fill="#fff" stroke="${FRAME}"/>`;
  out += text(SIDE / 2, H - 30 - 34, '설정 저장', { size: 13, weight: 700, fill: INK2, anchor: 'middle' });
  return out;
}

function logPanel(logs, a) {
  const y0 = 600;
  let out = `<rect x="${SIDE}" y="${y0}" width="${W - SIDE}" height="${H - 30 - y0}" fill="#141925"/>`;
  out += `<rect x="${SIDE}" y="${y0}" width="${W - SIDE}" height="30" fill="#1B2130"/>`;
  out += text(SIDE + 20, y0 + 20, '실행 로그', { size: 12, weight: 700, fill: '#AEB6C8' });
  out += `<circle cx="${W - 28}" cy="${y0 + 15}" r="4" fill="#22C55E"/>` + text(W - 40, y0 + 19, '실시간', { size: 11, fill: '#AEB6C8', anchor: 'end' });
  logs.forEach((l, i) => {
    const m = /^(\d{2}:\d{2}(?::\d{2})?)\s+(.*)$/.exec(l) ?? [null, '', l];
    const y = y0 + 58 + i * 26;
    out += text(SIDE + 20, y, m[1], { size: 13, fill: '#6B7489', family: MONO });
    out += text(SIDE + 104, y, clip(m[2], 40), { size: 13, fill: i === logs.length - 1 ? '#fff' : '#D5DAE5', family: MONO });
  });
  out += `<rect x="${SIDE + 20}" y="${y0 + 58 + logs.length * 26 - 12}" width="8" height="15" fill="${a}"/>`;
  return out;
}

function statusBar(status, version, a) {
  const y = H - 30;
  let out = `<rect x="0" y="${y}" width="${W}" height="30" fill="#F1F3F7"/><line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${LINE}"/>`;
  let x = 16;
  status.forEach((s, i) => {
    if (i === 0) {
      out += `<circle cx="${x + 5}" cy="${y + 15}" r="4.5" fill="${/대기|중지/.test(s) ? '#F59E0B' : '#22C55E'}"/>`;
      x += 16;
    }
    out += text(x, y + 20, clip(s, 14), { size: 12, weight: i === 0 ? 700 : 400, fill: i === 0 ? INK : INK2 });
    x += measure(clip(s, 14), 12, i === 0) + 26;
    if (i < status.length - 1) out += `<line x1="${x - 13}" y1="${y + 8}" x2="${x - 13}" y2="${y + 22}" stroke="${FRAME}"/>`;
  });
  out += text(W - 16, y + 20, `v${version}`, { size: 12, fill: MUTED, anchor: 'end' });
  return out;
}

// 2차 데이터(screen)가 아직 없는 제품도 그릴 수 있게 기본값을 둔다.
function screenOf(p) {
  const s = p.screen ?? {};
  return {
    version: s.version ?? '1.0.0',
    toolbar: s.toolbar ?? ['시작', '중지', '저장'],
    settings: s.settings ?? [{ label: '사용 환경', value: clip(p.specs.env, 16) }, { label: '준비물', value: clip(p.specs.needs ?? '없음', 16) }, { label: '실행 주기', value: '수동 실행' }, { label: '저장 위치', value: '바탕화면' }],
    options: s.options ?? [{ label: '완료 시 알림', on: true }, { label: '시작 시 자동 실행', on: false }],
    logs: s.logs ?? ['09:00:00  프로그램 준비 완료'],
    status: s.status ?? ['대기 중'],
    moreRows: s.moreRows ?? [],
  };
}

export function renderScreen(p) {
  const a = ACCENTS[p.category] ?? ACCENTS.commerce;
  const v = p.visual;
  const s = screenOf(p);
  const [, viewName = v.window] = v.window.split(' · ');
  const box = { x: SIDE + 28, y: 182, w: W - SIDE - 56, h: 396 };
  const body = v.type === 'table' ? table(v, a, box, s.moreRows) : BODIES[v.type](v, a, box);
  const tabs = [viewName, '작업 기록', '통계'];
  let tx = SIDE + 28;
  const tabSvg = tabs.map((t, i) => {
    const label = clip(t, 14);
    const w = measure(label, 13, i === 0);
    const out = text(tx, 148, label, { size: 13, weight: i === 0 ? 700 : 400, fill: i === 0 ? INK : MUTED })
      + (i === 0 ? `<rect x="${tx}" y="160" width="${w}" height="3" rx="1.5" fill="${a}"/>` : '');
    tx += w + 30;
    return out;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="${FONT}">
<defs>
<clipPath id="win"><rect width="${W}" height="${H}" rx="12"/></clipPath>
<linearGradient id="g0" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}" stop-opacity=".9"/><stop offset="1" stop-color="${a}" stop-opacity=".45"/></linearGradient>
<linearGradient id="g1" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="${INK}" stop-opacity=".8"/><stop offset="1" stop-color="${a}" stop-opacity=".6"/></linearGradient>
<linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE14D"/><stop offset="1" stop-color="${a}" stop-opacity=".7"/></linearGradient>
</defs>
<g clip-path="url(#win)">
<rect width="${W}" height="${H}" fill="#fff"/>
<rect width="${W}" height="38" fill="#EEF1F5"/>
<rect x="14" y="10" width="18" height="18" rx="5" fill="${a}"/>
${text(23, 24, [...p.name][0], { size: 11, weight: 700, fill: '#fff', anchor: 'middle' })}
${text(42, 24, `${p.name} ${s.version}`, { size: 13, weight: 700, fill: INK })}
${text(42 + measure(`${p.name} ${s.version}`, 13, true) + 10, 24, `— ${clip(viewName, 18)}`, { size: 13, fill: MUTED })}
<path d="M${W - 118} 19 h11 M${W - 76} 13 h11 v11 h-11 z M${W - 32} 13 l11 11 m0 -11 l-11 11" stroke="#7A8399" stroke-width="1.4" fill="none"/>
<rect y="38" width="${W}" height="26" fill="#fff"/>
${['파일(F)', '편집(E)', '보기(V)', '도구(T)', '도움말(H)'].map((m, i) => text(18 + i * 72, 56, m, { size: 12, fill: INK2 })).join('')}
<rect y="64" width="${W}" height="52" fill="#FAFBFC"/><line x1="0" y1="64" x2="${W}" y2="64" stroke="${LINE}"/><line x1="0" y1="116" x2="${W}" y2="116" stroke="${LINE}"/>
${toolbar(s.toolbar, a)}
${pill(W - 196, 78, s.status[0], /대기|중지/.test(s.status[0]) ? '#F59E0B' : '#16A34A')}
${text(W - 18, 95, (/^(\d{2}:\d{2}(:\d{2})?)/.exec(s.logs.at(-1)) ?? ['09:00'])[0], { size: 13, weight: 700, fill: INK2, anchor: 'end', family: MONO })}
${sidebar(s, a)}
<line x1="${SIDE}" y1="166" x2="${W}" y2="166" stroke="${LINE}"/>
${tabSvg}
${body}
${logPanel(s.logs, a)}
${statusBar(s.status, s.version, a)}
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="none" stroke="${FRAME}"/>
</svg>
`;
}
