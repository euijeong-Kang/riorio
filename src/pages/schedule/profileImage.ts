const MAX_INPUT_BYTES = 10 * 1024 * 1024;
const OUTPUT_SIZE = 512;

export async function prepareProfileImage(file: File): Promise<Blob> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('JPG, PNG, WEBP 사진만 선택할 수 있어요.');
  }
  if (file.size > MAX_INPUT_BYTES) throw new Error('10MB 이하 사진을 선택해 주세요.');

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('이 사진을 열 수 없어요. 다른 사진을 선택해 주세요.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    throw new Error('사진을 처리하지 못했어요.');
  }

  const sourceSize = Math.min(bitmap.width, bitmap.height);
  const sourceX = (bitmap.width - sourceSize) / 2;
  const sourceY = (bitmap.height - sourceSize) / 2;
  context.drawImage(bitmap, sourceX, sourceY, sourceSize, sourceSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.82));
  if (!blob) throw new Error('사진을 변환하지 못했어요.');
  return blob;
}
