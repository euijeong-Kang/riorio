import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const pages = [
  ['', 'home', false, 'RIORIO | Spanish Casual Dining', '리오리오의 메뉴와 방문 안내, 특별 행사 소식을 만나보세요.'],
  ['en', 'home', true, 'RIORIO | Spanish Casual Dining', 'Explore the menu, visit information and special events at RIORIO.'],
  ['events', 'events', false, '행사 안내 | RIORIO', '리오리오의 특별 행사 소식을 확인하세요.'],
  ['en/events', 'events', true, 'Events | RIORIO', 'Discover special events at RIORIO.'],
  ['events/christmas-2026', 'christmas', false, '2026 크리스마스 코스 | RIORIO', '리오리오 크리스마스 코스와 예약 준비 안내.'],
  ['en/events/christmas-2026', 'christmas', true, 'Christmas Course 2026 | RIORIO', 'Explore the RIORIO Christmas course and reservation information.'],
];
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { default: PublicPage } = await server.ssrLoadModule('/src/pages/public/page.tsx');
  const { default: HomePage } = await server.ssrLoadModule('/src/pages/home/page.tsx');
  const template = await readFile('out/index.html', 'utf8');
  for (const [path, kind, english, title, description] of pages) {
    const url = `https://riorio.co.kr/${path}${path ? '/' : ''}`;
    const counterpart = english ? path.replace(/^en\/?/, '') : `en${path ? `/${path}` : ''}`;
    const counterpartUrl = `https://riorio.co.kr/${counterpart}${counterpart ? '/' : ''}`;
    const markup = renderToString(createElement(StaticRouter, { location: `/${path}` }, createElement(kind === 'home' ? HomePage : PublicPage, { kind, english })));
    const metadata = `<title>${escape(title)}</title><meta name="description" content="${escape(description)}"><link rel="canonical" href="${url}"><link rel="alternate" hreflang="${english ? 'en' : 'ko'}" href="${url}"><link rel="alternate" hreflang="${english ? 'ko' : 'en'}" href="${counterpartUrl}"><meta property="og:type" content="website"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="https://riorio.co.kr/images/share-home.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(title)}"><meta name="twitter:description" content="${escape(description)}"><meta name="twitter:image" content="https://riorio.co.kr/images/share-home.jpg">`;
    const html = template.replace('<html lang="ko">', `<html lang="${english ? 'en' : 'ko'}">`)
      .replace(/<title>[^<]*<\/title>/g, '')
      .replace(/<meta\s+(?:name="(?:description|twitter:[^"]*)"|property="(?:og:|twitter:|kakao:)[^"]*")[^>]*\/?\s*>/g, '')
      .replace(/<link\s+rel="canonical"[^>]*\/?\s*>/g, '')
      .replace('</head>', `${metadata}</head>`)
      .replace('<div id="root"></div>', `<div id="root">${markup}</div>`);
    const output = join('out', path, 'index.html');
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, html);
  }
  await writeFile('out/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(([path]) => `<url><loc>https://riorio.co.kr/${path}${path ? '/' : ''}</loc></url>`).join('')}</urlset>`);
} finally {
  await server.close();
}
