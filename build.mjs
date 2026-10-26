// 정적 사이트 빌드: data/의 제품 데이터로 dist/에 페이지와 화면 예시 이미지를 만든다.
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { renderHome, renderProduct, render404 } from './src/render.mjs';
import { renderScreen } from './src/visual.mjs';

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const site = await readJson('data/site.json');
const categories = await readJson('data/categories.json');

const files = (await readdir('data/products')).filter((f) => f.endsWith('.json'));
const products = await Promise.all(files.map((f) => readJson(join('data/products', f))));

// 제품 화면 이미지(design/mockups 시안을 구운 것 등)가 public/images/products/{slug}.(webp|png|jpg)에 있으면 기본 SVG 화면 대신 쓴다.
// {slug}-card.webp(작은 판)가 있으면 목록 카드와 작은 화면에 쓴다.
for (const p of products) {
  const ext = ['webp', 'png', 'jpg'].find((e) => existsSync(`public/images/products/${p.slug}.${e}`));
  if (ext) p.image = `/images/products/${p.slug}.${ext}`;
  if (ext && existsSync(`public/images/products/${p.slug}-card.webp`)) p.cardImage = `/images/products/${p.slug}-card.webp`;
}

// 히어로 배경: public/images/hero.(webp|jpg|png)가 있으면 기본 SVG 배경 대신 쓴다.
const heroExt = ['webp', 'jpg', 'png'].find((e) => existsSync(`public/images/hero.${e}`));
if (heroExt) site.heroImage = `/images/hero.${heroExt}`;

// 벤치마크 리뷰 수(시장 인기)가 많은 순으로 나열한다.
products.sort((a, b) => b.benchmark.reviews - a.benchmark.reviews || a.name.localeCompare(b.name, 'ko'));

await rm('dist', { recursive: true, force: true });
await mkdir('dist/images/screens', { recursive: true });
await cp('public', 'dist', { recursive: true });
await cp('src/assets', 'dist/assets', { recursive: true });

const write = async (path, content) => {
  await mkdir(join('dist', path, '..'), { recursive: true });
  await writeFile(join('dist', path), content);
};

await write('index.html', renderHome({ site, categories, products }));
await write('404.html', render404({ site }));
for (const product of products) {
  const related = products.filter((p) => p.category === product.category && p.slug !== product.slug).slice(0, 4);
  await write(`products/${product.slug}/index.html`, renderProduct({ site, categories, product, related }));
  await write(`images/screens/${product.slug}.svg`, renderScreen(product));
}

const urls = ['/', ...products.map((p) => `/products/${p.slug}/`)];
await write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${site.url}${u}</loc></url>`).join('\n')}\n</urlset>\n`);

console.log(`빌드 완료: 제품 ${products.length}개, 페이지 ${products.length + 2}개`);
