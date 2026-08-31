const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const brainDir = path.join('C:', 'Users', 'PC', '.gemini', 'antigravity-ide', 'brain', 'd39d7b93-aea6-4314-97bb-5b3763654686');
const avatarDir = path.join(__dirname, '..', 'src', 'assets', 'avatar');
const canvasSize = 1024;

// Re-generate transparent PNGs fresh from JPGs
require('./process_generated_items.js');

function getBBox(png) {
  let minX = png.width, maxX = 0, minY = png.height, maxY = 0;
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const idx = (y * png.width + x) * 4;
      if (png.data[idx + 3] > 20) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, maxX, minY, maxY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

// Adjusted coordinates so hat sits properly above eyes & hair:
const itemPlacements = {
  'avatar_hat_star.png': { targetY: 0, targetHeight: 330, targetCenterX: 512 },
  'avatar_hat_crescent.png': { targetY: 55, targetHeight: 175, targetCenterX: 512 },
  'avatar_hat_flowercrown.png': { targetY: 50, targetHeight: 180, targetCenterX: 512 },

  'avatar_cape_starry.png': { targetY: 430, targetHeight: 520, targetCenterX: 512 },
  'avatar_cape_shadow.png': { targetY: 430, targetHeight: 520, targetCenterX: 512 },
  'avatar_cape_royal.png': { targetY: 430, targetHeight: 520, targetCenterX: 512 },

  'avatar_outfit_mystic.png': { targetY: 430, targetHeight: 460, targetCenterX: 512 },
  'avatar_outfit_scholar.png': { targetY: 430, targetHeight: 460, targetCenterX: 512 },
};

function alignItem(filename, placement) {
  const filePath = path.join(avatarDir, filename);
  if (!fs.existsSync(filePath)) return;

  const srcPng = PNG.sync.read(fs.readFileSync(filePath));
  const bbox = getBBox(srcPng);

  const scale = placement.targetHeight / bbox.height;
  const scaledWidth = Math.round(bbox.width * scale);
  const scaledHeight = placement.targetHeight;

  const startX = Math.round(placement.targetCenterX - scaledWidth / 2);
  const startY = placement.targetY;

  const outPng = new PNG({ width: canvasSize, height: canvasSize });

  for (let y = 0; y < scaledHeight; y++) {
    const destY = startY + y;
    if (destY < 0 || destY >= canvasSize) continue;

    const srcY = bbox.minY + Math.floor(y / scale);
    if (srcY < 0 || srcY >= srcPng.height) continue;

    for (let x = 0; x < scaledWidth; x++) {
      const destX = startX + x;
      if (destX < 0 || destX >= canvasSize) continue;

      const srcX = bbox.minX + Math.floor(x / scale);
      if (srcX < 0 || srcX >= srcPng.width) continue;

      const srcIdx = (srcY * srcPng.width + srcX) * 4;
      const dstIdx = (destY * canvasSize + destX) * 4;

      outPng.data[dstIdx] = srcPng.data[srcIdx];
      outPng.data[dstIdx + 1] = srcPng.data[srcIdx + 1];
      outPng.data[dstIdx + 2] = srcPng.data[srcIdx + 2];
      outPng.data[dstIdx + 3] = srcPng.data[srcIdx + 3];
    }
  }

  fs.writeFileSync(filePath, PNG.sync.write(outPng));
  console.log(`Aligned & Saved: ${filename}`);
}

for (const [filename, placement] of Object.entries(itemPlacements)) {
  alignItem(filename, placement);
}

// Composite test preview
const cape = PNG.sync.read(fs.readFileSync(path.join(avatarDir, 'avatar_cape_starry.png')));
const base = PNG.sync.read(fs.readFileSync(path.join(avatarDir, 'base_female.png')));
const outfit = PNG.sync.read(fs.readFileSync(path.join(avatarDir, 'avatar_outfit_mystic.png')));
const hat = PNG.sync.read(fs.readFileSync(path.join(avatarDir, 'avatar_hat_crescent.png')));

const composite = new PNG({ width: canvasSize, height: canvasSize });
for (let i = 0; i < canvasSize * canvasSize * 4; i += 4) {
  composite.data[i] = 30;
  composite.data[i + 1] = 17;
  composite.data[i + 2] = 64;
  composite.data[i + 3] = 255;
}

function blendLayer(layer) {
  for (let i = 0; i < canvasSize * canvasSize * 4; i += 4) {
    const a = layer.data[i + 3] / 255;
    if (a > 0) {
      composite.data[i] = Math.round(composite.data[i] * (1 - a) + layer.data[i] * a);
      composite.data[i + 1] = Math.round(composite.data[i + 1] * (1 - a) + layer.data[i + 1] * a);
      composite.data[i + 2] = Math.round(composite.data[i + 2] * (1 - a) + layer.data[i + 2] * a);
    }
  }
}

blendLayer(cape);
blendLayer(base);
blendLayer(outfit);
blendLayer(hat);

const previewPath = path.join('C:', 'Users', 'PC', '.gemini', 'antigravity-ide', 'brain', 'd39d7b93-aea6-4314-97bb-5b3763654686', 'gemini_avatar_test.png');
fs.writeFileSync(previewPath, PNG.sync.write(composite));
console.log('Preview saved to:', previewPath);
