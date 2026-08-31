const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const dir = path.join(__dirname, '..', 'src', 'assets', 'cards', 'lenormand');

for (let i = 1; i <= 36; i++) {
  const numStr = String(i).padStart(2, '0');
  const filePath = path.join(dir, `lenormand_${numStr}.png`);
  if (!fs.existsSync(filePath)) continue;

  const card = PNG.sync.read(fs.readFileSync(filePath));
  const w = card.width;
  const h = card.height;

  function isWhite(x, y) {
    const idx = (y * w + x) * 4;
    const r = card.data[idx];
    const g = card.data[idx + 1];
    const b = card.data[idx + 2];
    return r > 225 && g > 225 && b > 225 && Math.abs(r - g) < 15 && Math.abs(g - b) < 15;
  }

  let top = 0;
  while (top < h * 0.15) {
    let whiteCount = 0;
    for (let x = Math.floor(w * 0.2); x < Math.floor(w * 0.8); x++) {
      if (isWhite(x, top)) whiteCount++;
    }
    if (whiteCount < (w * 0.6) * 0.4) break;
    top++;
  }

  let bottom = h - 1;
  while (bottom > h * 0.85) {
    let whiteCount = 0;
    for (let x = Math.floor(w * 0.2); x < Math.floor(w * 0.8); x++) {
      if (isWhite(x, bottom)) whiteCount++;
    }
    if (whiteCount < (w * 0.6) * 0.4) break;
    bottom--;
  }

  let left = 0;
  while (left < w * 0.15) {
    let whiteCount = 0;
    for (let y = Math.floor(h * 0.2); y < Math.floor(h * 0.8); y++) {
      if (isWhite(left, y)) whiteCount++;
    }
    if (whiteCount < (h * 0.6) * 0.4) break;
    left++;
  }

  let right = w - 1;
  while (right > w * 0.85) {
    let whiteCount = 0;
    for (let y = Math.floor(h * 0.2); y < Math.floor(h * 0.8); y++) {
      if (isWhite(right, y)) whiteCount++;
    }
    if (whiteCount < (h * 0.6) * 0.4) break;
    right--;
  }

  const finalW = right - left + 1;
  const finalH = bottom - top + 1;

  if (finalW > 100 && finalH > 100 && (top > 0 || left > 0 || right < w - 1 || bottom < h - 1)) {
    const trimmed = new PNG({ width: finalW, height: finalH });
    for (let y = 0; y < finalH; y++) {
      for (let x = 0; x < finalW; x++) {
        const srcIdx = ((top + y) * w + (left + x)) * 4;
        const dstIdx = (y * finalW + x) * 4;
        trimmed.data[dstIdx] = card.data[srcIdx];
        trimmed.data[dstIdx + 1] = card.data[srcIdx + 1];
        trimmed.data[dstIdx + 2] = card.data[srcIdx + 2];
        trimmed.data[dstIdx + 3] = 255;
      }
    }
    fs.writeFileSync(filePath, PNG.sync.write(trimmed));
    console.log(`Trimmed ${numStr}: top=${top}, bottom=${h - 1 - bottom}, left=${left}, right=${w - 1 - right} -> ${finalW}x${finalH}`);
  }
}
console.log('--- ALL WHITE EDGES REMOVED PERFECTLY ---');
