// 제품 데이터(data/products/*.json) 형식 검사. 사용법: node scripts/validate-products.mjs [파일...]
import { readFile, readdir } from 'node:fs/promises';
import { basename, join } from 'node:path';

const CATEGORIES = JSON.parse(await readFile('data/categories.json', 'utf8')).map((c) => c.id);
const TYPES = ['Windows 프로그램', '웹 프로그램', '엑셀 프로그램', '크롬 확장 프로그램', 'Windows·Mac 프로그램', '구글 스프레드시트'];
const BANNED = ['크몽', 'kmong', '즉시 다운로드', '바로 다운로드', '1위 보장', '매출 보장', '노출 보장', '상위노출 보장', '수익 보장', '최고의', '업계 최초', '100%'];

const len = (s) => [...String(s ?? '')].length;

// 가격 규칙: 벤치마크(시장) 패키지 가격의 약 90%를 깔끔한 단위로 내림한다.
export const ourPrice = (market) => {
  const t = market * 0.9;
  const unit = t < 10000 ? 500 : t < 300000 ? 1000 : 10000;
  return Math.floor(t / unit) * unit;
};

function check(p, file) {
  const errors = [];
  const err = (m) => errors.push(m);
  const str = (path, value, max, { optional = false } = {}) => {
    if (value === null || value === undefined) {
      if (!optional) err(`${path}: 필수 값 없음`);
      return;
    }
    if (typeof value !== 'string' || !value.trim()) return err(`${path}: 빈 문자열 또는 문자열 아님`);
    if (len(value) > max) err(`${path}: ${len(value)}자 (최대 ${max}자) — "${value}"`);
  };
  const list = (path, value, min, max) => {
    if (!Array.isArray(value)) return err(`${path}: 배열 아님`), false;
    if (value.length < min || value.length > max) err(`${path}: ${value.length}개 (${min}~${max}개)`);
    return true;
  };
  const pairs = (path, value, min, max, tMax, dMax, [t, d] = ['title', 'desc']) => {
    if (list(path, value, min, max)) value.forEach((x, i) => { str(`${path}[${i}].${t}`, x?.[t], tMax); str(`${path}[${i}].${d}`, x?.[d], dMax); });
  };

  if (p.slug !== basename(file, '.json')) err(`slug(${p.slug})가 파일명과 다름`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug ?? '')) err('slug: 영소문자·숫자·하이픈만');
  if (!CATEGORIES.includes(p.category)) err(`category: ${p.category} (허용: ${CATEGORIES.join(', ')})`);
  str('name', p.name, 12);
  str('fullName', p.fullName, 30);
  str('badge', p.badge, 6, { optional: true });
  str('hook', p.hook, 32);
  str('subhook', p.subhook, 120);
  str('summary', p.summary, 45);
  if (list('keywords', p.keywords, 3, 6)) p.keywords.forEach((k, i) => str(`keywords[${i}]`, k, 16));
  pairs('pains', p.pains, 3, 3, 18, 90);
  pairs('features', p.features, 4, 6, 18, 90);
  pairs('steps', p.steps, 3, 3, 14, 70);
  if (list('targets', p.targets, 3, 5)) p.targets.forEach((t, i) => str(`targets[${i}]`, t, 40));
  str('before', p.before, 70);
  str('after', p.after, 70);
  if (!TYPES.includes(p.specs?.type)) err(`specs.type: ${p.specs?.type} (허용: ${TYPES.join(' / ')})`);
  str('specs.env', p.specs?.env, 50);
  str('specs.needs', p.specs?.needs, 50, { optional: true });
  pairs('faq', p.faq, 3, 4, 40, 140, ['q', 'a']);
  str('notice', p.notice, 160, { optional: true });
  if (!Array.isArray(p.benchmark?.gigIds) || !Number.isInteger(p.benchmark?.reviews)) err('benchmark: { gigIds: number[], reviews: number } 필요');

  const v = p.visual ?? {};
  str('visual.window', v.window, 26);
  switch (v.type) {
    case 'table':
      if (list('visual.columns', v.columns, 3, 4)) v.columns.forEach((c, i) => str(`visual.columns[${i}]`, c, 7));
      if (list('visual.rows', v.rows, 3, 5)) v.rows.forEach((r, i) => {
        if (!Array.isArray(r) || r.length !== v.columns?.length) return err(`visual.rows[${i}]: 칸 수가 columns와 다름`);
        r.forEach((c, j) => str(`visual.rows[${i}][${j}]`, c, 9));
      });
      str('visual.highlight', v.highlight, 18);
      break;
    case 'dashboard':
      if (list('visual.kpis', v.kpis, 3, 3)) v.kpis.forEach((k, i) => { str(`visual.kpis[${i}].label`, k?.label, 8); str(`visual.kpis[${i}].value`, k?.value, 9); });
      if (list('visual.series', v.series, 7, 12) && !v.series.every((n) => Number.isFinite(n) && n >= 0 && n <= 100)) err('visual.series: 0~100 숫자만');
      str('visual.chartLabel', v.chartLabel, 16);
      break;
    case 'chat':
      if (list('visual.messages', v.messages, 3, 5)) v.messages.forEach((m, i) => {
        if (!['me', 'them'].includes(m?.from)) err(`visual.messages[${i}].from: me|them`);
        str(`visual.messages[${i}].text`, m?.text, 28);
      });
      break;
    case 'alerts':
      if (list('visual.items', v.items, 3, 4)) v.items.forEach((a, i) => { str(`visual.items[${i}].title`, a?.title, 22); str(`visual.items[${i}].meta`, a?.meta, 16); str(`visual.items[${i}].tag`, a?.tag, 5); });
      break;
    case 'flow':
      if (list('visual.steps', v.steps, 3, 4)) v.steps.forEach((s, i) => str(`visual.steps[${i}]`, s, 8));
      if (list('visual.logs', v.logs, 2, 3)) v.logs.forEach((s, i) => str(`visual.logs[${i}]`, s, 24));
      str('visual.status', v.status, 20);
      break;
    case 'gallery':
      if (list('visual.tiles', v.tiles, 6, 6)) v.tiles.forEach((s, i) => str(`visual.tiles[${i}]`, s, 6));
      str('visual.status', v.status, 20);
      break;
    default:
      err(`visual.type: ${v.type} (table|dashboard|chat|alerts|flow|gallery)`);
  }

  const market = p.benchmark?.packages ?? {};
  if (list('pricing.plans', p.pricing?.plans, 1, 3)) {
    const tiers = p.pricing.plans.map((x) => x.tier);
    if (new Set(tiers).size !== tiers.length) err('pricing.plans: tier 중복');
    p.pricing.plans.forEach((x, i) => {
      const at = `pricing.plans[${i}]`;
      if (!(x.tier in market)) return err(`${at}.tier: ${x.tier} (benchmark.packages에 있는 ${Object.keys(market).join('/')} 중 하나)`);
      if (x.price !== ourPrice(market[x.tier])) err(`${at}.price: ${x.price} → 규칙상 ${ourPrice(market[x.tier])}이어야 함 (시장가 ${market[x.tier]})`);
      str(`${at}.name`, x.name, 14);
      if (list(`${at}.features`, x.features, 1, 4)) x.features.forEach((f, j) => str(`${at}.features[${j}]`, f, 26));
    });
  }
  str('pricing.note', p.pricing?.note, 60, { optional: true });

  const s = p.screen ?? {};
  if (!/^\d+\.\d+(\.\d+)?$/.test(s.version ?? '')) err('screen.version: 예) 2.4.1');
  if (list('screen.toolbar', s.toolbar, 3, 5)) s.toolbar.forEach((t, i) => str(`screen.toolbar[${i}]`, t, 6));
  if (list('screen.settings', s.settings, 4, 6)) s.settings.forEach((x, i) => { str(`screen.settings[${i}].label`, x?.label, 8); str(`screen.settings[${i}].value`, x?.value, 16); });
  if (list('screen.options', s.options, 2, 4)) s.options.forEach((x, i) => {
    str(`screen.options[${i}].label`, x?.label, 14);
    if (typeof x?.on !== 'boolean') err(`screen.options[${i}].on: true|false`);
  });
  if (list('screen.logs', s.logs, 3, 5)) s.logs.forEach((l, i) => {
    str(`screen.logs[${i}]`, l, 34);
    if (!/^\d{2}:\d{2}(:\d{2})?\s/.test(l ?? '')) err(`screen.logs[${i}]: "HH:MM:SS  내용" 형식`);
  });
  if (list('screen.status', s.status, 2, 4)) s.status.forEach((t, i) => str(`screen.status[${i}]`, t, 14));
  if (s.moreRows !== undefined) {
    if (v.type !== 'table') err('screen.moreRows: visual.type이 table일 때만');
    else if (list('screen.moreRows', s.moreRows, 1, 5)) s.moreRows.forEach((r, i) => {
      if (!Array.isArray(r) || r.length !== v.columns?.length) return err(`screen.moreRows[${i}]: 칸 수가 columns와 다름`);
      r.forEach((c, j) => str(`screen.moreRows[${i}][${j}]`, c, 9));
    });
  }

  const text = JSON.stringify({ ...p, benchmark: undefined });
  for (const word of BANNED) if (text.toLowerCase().includes(word.toLowerCase())) err(`금지 표현 포함: "${word}"`);
  return errors;
}

const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : (await readdir('data/products')).filter((f) => f.endsWith('.json')).map((f) => join('data/products', f));

// 브랜드명은 전체 제품에서 겹치면 안 된다.
const owners = new Map();
for (const f of (await readdir('data/products')).filter((f) => f.endsWith('.json'))) {
  try {
    const { name } = JSON.parse(await readFile(join('data/products', f), 'utf8'));
    owners.set(name, [...(owners.get(name) ?? []), basename(f, '.json')]);
  } catch {}
}

let failed = 0;
for (const file of files) {
  let errors;
  try {
    const p = JSON.parse(await readFile(file, 'utf8'));
    errors = check(p, file);
    const same = (owners.get(p.name) ?? []).filter((s) => s !== p.slug);
    if (same.length) errors.push(`name "${p.name}"이 다른 제품과 겹침: ${same.join(', ')}`);
  } catch (e) {
    errors = [`JSON 파싱 실패: ${e.message}`];
  }
  if (errors.length) {
    failed++;
    console.log(`✗ ${file}\n  - ${errors.join('\n  - ')}`);
  }
}
console.log(`${files.length - failed}/${files.length} 통과`);
process.exit(failed ? 1 : 0);
