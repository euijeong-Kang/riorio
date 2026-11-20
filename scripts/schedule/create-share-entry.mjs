import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const outputRoot = path.resolve('out');
const sourcePath = path.join(outputRoot, 'index.html');
const shareImage = 'https://riorio.co.kr/images/schedule-share.png?v=20260915';
const title = '리오리오 직원 근무표';
const description = '이번 주 출근일과 출퇴근 시간을 한눈에 확인하세요.';
const url = 'https://riorio.co.kr/schedule/';

let html = await readFile(sourcePath, 'utf8');
if (!html.includes('</head>') || !html.includes('<div id="root">')) {
  throw new Error(`Missing HTML entry points in ${sourcePath}`);
}
html = html
  .replace(/<title>[^<]*<\/title>/g, '')
  .replace(/<meta\s+(?:name="(?:description|robots)"|property="(?:og:|twitter:|kakao:)[^"]*")[^>]*\/?\s*>/g, '')
  .replace(/<link\s+rel="(?:canonical|alternate)"[^>]*\/?\s*>/g, '')
  .replace(/<div id="root">[\s\S]*?<\/div>\s*<\/body>/, '<div id="root"></div>\n  </body>');

const metadata = `<title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="robots" content="noindex, nofollow, noarchive" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${shareImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:alt" content="리오리오 직원 근무표 안내 카드" />
    <meta property="og:site_name" content="RIORIO CREW" />
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${url}" />
    <meta property="twitter:title" content="${title}" />
    <meta property="twitter:description" content="${description}" />
    <meta property="twitter:image" content="${shareImage}" />
    <meta property="kakao:title" content="${title}" />
    <meta property="kakao:description" content="${description}" />
    <meta property="kakao:image" content="${shareImage}" />`;
html = html.replace('</head>', `${metadata}\n  </head>`);

for (const route of ['schedule', 'schedule/login', 'schedule/admin']) {
  const directory = path.join(outputRoot, ...route.split('/'));
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'index.html'), html, 'utf8');
}

console.log('Created schedule-specific share entries.');
