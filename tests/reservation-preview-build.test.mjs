import { test } from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

async function outputFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await outputFiles(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

test('운영 빌드에는 비공개 예약·복구 시안이 포함되지 않는다', async () => {
  const output = new URL('../out/', import.meta.url);
  await access(new URL('index.html', output));
  for (const path of ['reservation-preview.html', 'recovery-session-preview.html', 'admin-transfer-preview.html']) {
    await assert.rejects(access(new URL(path, output)), { code: 'ENOENT' });
  }
  const markers = ['DEVELOPMENT PREVIEW · FICTIONAL DATA · NO BOOKINGS', '가상 가격 변경 예시', '비공개 복구 세션 테스트', '관리자 입금 확인 · 가상 시안', 'riorio.reservation.attempt.v1'];
  const root = fileURLToPath(output);
  const files = await outputFiles(root);
  assert.ok(files.some((filename) => filename.endsWith('.js')), 'Build must contain JavaScript assets');
  for (const filename of files.filter((file) => ['.html', '.js', '.mjs', '.css', '.json', '.map', '.xml', '.txt'].includes(extname(file).toLowerCase()))) {
    const content = await readFile(filename, 'utf8');
    for (const marker of markers) assert.equal(content.includes(marker), false, `Private preview marker found in ${relative(root, filename)}`);
  }
});
