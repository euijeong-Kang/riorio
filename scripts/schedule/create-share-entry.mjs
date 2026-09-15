import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const outputRoot = path.resolve("out");
const sourcePath = path.join(outputRoot, "index.html");
const shareImage = "https://riorio.co.kr/images/schedule-share.png?v=20260915";

let html = await readFile(sourcePath, "utf8");

const replace = (pattern, value, label) => {
  if (!pattern.test(html)) {
    throw new Error(`Could not find ${label} in ${sourcePath}`);
  }
  html = html.replace(pattern, value);
};

replace(/<title>[^<]*<\/title>/, "<title>리오리오 직원 근무표</title>", "title");
replace(
  /<meta name="description" content="[^"]*" \/>/,
  '<meta name="description" content="이번 주 출근일과 출퇴근 시간을 한눈에 확인하세요." />',
  "description",
);
replace(/<meta property="og:url" content="[^"]*" \/>/, '<meta property="og:url" content="https://riorio.co.kr/schedule/" />', "og:url");
replace(/<meta property="og:title" content="[^"]*" \/>/, '<meta property="og:title" content="리오리오 직원 근무표" />', "og:title");
replace(/<meta property="og:description" content="[^"]*" \/>/, '<meta property="og:description" content="이번 주 출근일과 출퇴근 시간을 한눈에 확인하세요." />', "og:description");
replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${shareImage}" />`, "og:image");
replace(/<meta property="og:image:width" content="[^"]*" \/>/, '<meta property="og:image:width" content="1200" />', "og:image:width");
replace(/<meta property="og:image:height" content="[^"]*" \/>/, '<meta property="og:image:height" content="630" />', "og:image:height");
replace(/<meta property="og:site_name" content="[^"]*" \/>/, '<meta property="og:site_name" content="RIORIO CREW" />', "og:site_name");
replace(/<meta property="twitter:url" content="[^"]*" \/>/, '<meta property="twitter:url" content="https://riorio.co.kr/schedule/" />', "twitter:url");
replace(/<meta property="twitter:title" content="[^"]*" \/>/, '<meta property="twitter:title" content="리오리오 직원 근무표" />', "twitter:title");
replace(/<meta property="twitter:description" content="[^"]*" \/>/, '<meta property="twitter:description" content="이번 주 출근일과 출퇴근 시간을 한눈에 확인하세요." />', "twitter:description");
replace(/<meta property="twitter:image" content="[^"]*" \/>/, `<meta property="twitter:image" content="${shareImage}" />`, "twitter:image");
replace(/<meta property="kakao:title" content="[^"]*" \/>/, '<meta property="kakao:title" content="리오리오 직원 근무표" />', "kakao:title");
replace(/<meta property="kakao:description" content="[^"]*" \/>/, '<meta property="kakao:description" content="이번 주 출근일과 출퇴근 시간을 한눈에 확인하세요." />', "kakao:description");
replace(/<meta property="kakao:image" content="[^"]*" \/>/, `<meta property="kakao:image" content="${shareImage}" />`, "kakao:image");
replace(/<link rel="canonical" href="[^"]*" \/>/, '<link rel="canonical" href="https://riorio.co.kr/schedule/" />', "canonical URL");
replace(
  /<meta name="viewport" content="[^"]*" \/>/,
  '$&\n    <meta name="robots" content="noindex, nofollow, noarchive" />\n    <meta property="og:image:type" content="image/png" />\n    <meta property="og:image:alt" content="리오리오 직원 근무표 안내 카드" />',
  "viewport insertion point",
);

for (const route of ["schedule", "schedule/login", "schedule/admin"]) {
  const directory = path.join(outputRoot, ...route.split("/"));
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, "index.html"), html, "utf8");
}

console.log("Created schedule-specific share entries.");
