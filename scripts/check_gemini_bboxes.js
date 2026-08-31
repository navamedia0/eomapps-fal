const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const avatarDir = path.join(__dirname, '..', 'src', 'assets', 'avatar');

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
  return { minX, maxX, minY, maxY, width: maxX - minX + 1, height: maxY - minY + 1, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
}

const files = fs.readdirSync(avatarDir).filter(f => f.endsWith('.png'));
console.log('--- GEMINI AVATAR BOUNDING BOXES (1024x1024) ---');
for (const f of files) {
  const png = PNG.sync.read(fs.readFileSync(path.join(avatarDir, f)));
  const bbox = getBBox(png);
  console.log(`${f.padEnd(28)} -> bbox: y[${bbox.minY}..${bbox.maxY}] (h:${bbox.height}), x[${bbox.minX}..${bbox.maxX}] (w:${bbox.width}) | center: (${Math.round(bbox.cx)}, ${Math.round(bbox.cy)})`);
}
