const fs = require('fs');
const { PNG } = require('pngjs');
const jpeg = require('jpeg-js');

// Nearest/Bilinear Downsampler
function resizeImageData(srcData, srcW, srcH, dstW, dstH) {
  const dstData = Buffer.alloc(dstW * dstH * 4);
  const xRatio = srcW / dstW;
  const yRatio = srcH / dstH;

  for (let y = 0; y < dstH; y++) {
    for (let x = 0; x < dstW; x++) {
      const srcX = Math.min(Math.floor(x * xRatio), srcW - 1);
      const srcY = Math.min(Math.floor(y * yRatio), srcH - 1);
      const srcIdx = (srcY * srcW + srcX) * 4;
      const dstIdx = (y * dstW + x) * 4;

      dstData[dstIdx] = srcData[srcIdx];
      dstData[dstIdx + 1] = srcData[srcIdx + 1];
      dstData[dstIdx + 2] = srcData[srcIdx + 2];
      dstData[dstIdx + 3] = srcData[srcIdx + 3];
    }
  }
  return dstData;
}

// 1. Optimize stone_blank.png to 256x290
try {
  const stoneBuf = fs.readFileSync('c:/Users/PC/Desktop/Fal/src/assets/runes/stone_blank.png');
  const srcPng = PNG.sync.read(stoneBuf);
  const targetW = 256;
  const targetH = 290;
  const resizedData = resizeImageData(srcPng.data, srcPng.width, srcPng.height, targetW, targetH);
  const outPng = new PNG({ width: targetW, height: targetH });
  outPng.data = resizedData;
  fs.writeFileSync('c:/Users/PC/Desktop/Fal/src/assets/runes/stone_blank.png', PNG.sync.write(outPng));
  console.log('Optimized stone_blank.png to 256x290');
} catch (e) {
  console.error('Error optimizing stone_blank:', e);
}

// 2. Optimize pouch_closed.png to 380x380
try {
  const pouchBuf = fs.readFileSync('c:/Users/PC/Desktop/Fal/src/assets/runes/pouch_closed.png');
  const srcPng = PNG.sync.read(pouchBuf);
  const targetW = 380;
  const targetH = 380;
  const resizedData = resizeImageData(srcPng.data, srcPng.width, srcPng.height, targetW, targetH);
  const outPng = new PNG({ width: targetW, height: targetH });
  outPng.data = resizedData;
  fs.writeFileSync('c:/Users/PC/Desktop/Fal/src/assets/runes/pouch_closed.png', PNG.sync.write(outPng));
  console.log('Optimized pouch_closed.png to 380x380');
} catch (e) {
  console.error('Error optimizing pouch_closed:', e);
}

// 3. Optimize casting_mat.jpg to 512x512 with 80% quality
try {
  const matBuf = fs.readFileSync('c:/Users/PC/Desktop/Fal/src/assets/runes/casting_mat.jpg');
  const rawJpg = jpeg.decode(matBuf, { useTArray: true });
  const targetW = 512;
  const targetH = 512;
  const resizedData = resizeImageData(rawJpg.data, rawJpg.width, rawJpg.height, targetW, targetH);
  const encoded = jpeg.encode({ data: resizedData, width: targetW, height: targetH }, 80);
  fs.writeFileSync('c:/Users/PC/Desktop/Fal/src/assets/runes/casting_mat.jpg', encoded.data);
  console.log('Optimized casting_mat.jpg to 512x512');
} catch (e) {
  console.error('Error optimizing casting_mat:', e);
}

// Remove unused residue files in src/assets/runes
const unusedFiles = [
  'c:/Users/PC/Desktop/Fal/src/assets/runes/box_deck.jpg',
  'c:/Users/PC/Desktop/Fal/src/assets/runes/casting_cloth.jpg',
  'c:/Users/PC/Desktop/Fal/src/assets/runes/inspect_closeup.jpg',
  'c:/Users/PC/Desktop/Fal/src/assets/runes/pouch_closed.jpg',
  'c:/Users/PC/Desktop/Fal/src/assets/runes/stone_blank.jpg',
];

for (const f of unusedFiles) {
  if (fs.existsSync(f)) {
    fs.unlinkSync(f);
    console.log('Cleaned up unused file:', f);
  }
}
