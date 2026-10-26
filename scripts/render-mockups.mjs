// design/mockups/{slug}.html(제품별 하이파이 화면 시안)을 public/images/products/의 webp 이미지로 굽는다.
// 사용법: node scripts/render-mockups.mjs [slug...] [--preview 폴더]
//   slug를 생략하면 시안 전체를 굽는다.
//   --preview 폴더: 확인용 PNG(1280×800)만 그 폴더에 저장하고 public/은 건드리지 않는다.
// 로컬 Chrome 또는 Edge를 headless로 띄워 DevTools 프로토콜로 캡처한다(의존성 없음, Node 22+). 경로는 CHROME_PATH로 바꿀 수 있다.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const W = 1280;
const H = 800;
// 상세페이지용(1.5배)과 목록 카드용(0.75배) 두 벌을 만든다.
const SHOTS = [
  { suffix: '', scale: 1.5, quality: 84 },
  { suffix: '-card', scale: 0.75, quality: 82 },
];
const BROWSERS = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

const args = process.argv.slice(2);
const at = args.indexOf('--preview');
const previewDir = at >= 0 ? args.splice(at, 2)[1] : null;
const all = (await readdir('design/mockups')).filter((f) => f.endsWith('.html') && !f.startsWith('_')).map((f) => basename(f, '.html'));
const slugs = args.length ? args : all;
const missing = slugs.filter((s) => !all.includes(s));
if (missing.length) throw new Error(`시안 파일 없음: ${missing.map((s) => `design/mockups/${s}.html`).join(', ')}`);

const exe = BROWSERS.filter(Boolean).find((p) => existsSync(p));
if (!exe) throw new Error('Chrome 또는 Edge를 찾지 못했습니다. CHROME_PATH 환경 변수로 실행 파일 경로를 지정하세요.');

const profile = await mkdtemp(join(tmpdir(), 'mockup-'));
const browser = spawn(exe, [
  '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--force-color-profile=srgb', 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });

try {
  const endpoint = await new Promise((ok, fail) => {
    let log = '';
    browser.stderr.on('data', (d) => {
      log += d;
      const m = log.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) ok(m[1]);
    });
    browser.on('exit', (code) => fail(new Error(`브라우저가 종료됨 (${code})\n${log}`)));
    setTimeout(() => fail(new Error('브라우저 시작 시간 초과')), 20000);
  });

  // 최소한의 DevTools 프로토콜 클라이언트
  // 브라우저가 주소를 알린 직후에는 연결을 거절할 때가 있어(여러 개를 동시에 띄우면 특히) 몇 번 다시 시도한다.
  let ws;
  for (let attempt = 1; ; attempt++) {
    ws = new WebSocket(endpoint);
    const opened = await new Promise((ok) => { ws.onopen = () => ok(true); ws.onerror = () => ok(false); });
    if (opened) break;
    if (attempt === 10) throw new Error(`DevTools 연결 실패: ${endpoint}`);
    await new Promise((r) => setTimeout(r, 500));
  }
  let seq = 0;
  const pending = new Map();
  const waiters = [];
  ws.onmessage = ({ data }) => {
    const msg = JSON.parse(data);
    if (msg.id) {
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      return msg.error ? p.fail(new Error(`${p.method}: ${msg.error.message}`)) : p.ok(msg.result);
    }
    const i = waiters.findIndex((w) => w.method === msg.method);
    if (i >= 0) waiters.splice(i, 1)[0].ok(msg.params);
  };
  const send = (method, params = {}, sessionId) => new Promise((ok, fail) => {
    const id = ++seq;
    pending.set(id, { ok, fail, method });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
  const once = (method) => new Promise((ok) => waiters.push({ method, ok }));

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const cmd = (method, params) => send(method, params, sessionId);
  const evaluate = async (expression) => (await cmd('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result.value;
  const metrics = (scale) => cmd('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: scale, mobile: false });
  const settle = (ms) => evaluate(`document.fonts.ready.then(() => new Promise((r) => setTimeout(r, ${ms})))`);

  await cmd('Page.enable');
  await cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  if (previewDir) await mkdir(previewDir, { recursive: true });

  for (const slug of slugs) {
    await metrics(1);
    const loaded = once('Page.loadEventFired');
    await cmd('Page.navigate', { url: pathToFileURL(resolve(`design/mockups/${slug}.html`)).href });
    await loaded;
    await settle(500);

    // 캔버스(1280×800) 밖으로 넘친 요소가 있으면 알려 준다.
    const size = await evaluate('[document.documentElement.scrollWidth, document.documentElement.scrollHeight]');
    if (size[0] > W || size[1] > H) console.warn(`  ! ${slug}: 문서 크기 ${size.join('×')} — 1280×800을 넘습니다`);

    if (previewDir) {
      const { data } = await cmd('Page.captureScreenshot', { format: 'png' });
      await writeFile(join(previewDir, `${slug}.png`), Buffer.from(data, 'base64'));
      console.log(`✓ ${slug} → ${join(previewDir, `${slug}.png`)}`);
      continue;
    }
    const sizes = [];
    for (const shot of SHOTS) {
      await metrics(shot.scale);
      await settle(150);
      const { data } = await cmd('Page.captureScreenshot', { format: 'webp', quality: shot.quality });
      const file = `public/images/products/${slug}${shot.suffix}.webp`;
      await writeFile(file, Buffer.from(data, 'base64'));
      sizes.push(`${Math.round(Buffer.byteLength(data, 'base64') / 1024)}KB`);
    }
    console.log(`✓ ${slug} (${sizes.join(' / ')})`);
  }
  ws.close();
} finally {
  browser.kill();
  await new Promise((r) => setTimeout(r, 300));
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}
