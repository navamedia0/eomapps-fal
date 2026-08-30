const fs = require('fs');
const { PNG } = require('pngjs');

const data = fs.readFileSync('c:/Users/PC/Desktop/Fal/src/assets/runes/pouch_closed.png');
const png = PNG.sync.read(data);

let minX = png.width, maxX = 0, minY = png.height, maxY = 0;
for (let y = 0; y < png.height; y++) {
  for (let x = 0; x < png.width; x++) {
    const idx = (y * png.width + x) * 4;
    const a = png.data[idx + 3];
    if (a > 20) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

console.log({ minX, maxX, minY, maxY, pouchW: maxX - minX, pouchH: maxY - minY });

const cropW = maxX - minX + 20;
const cropH = maxY - minY + 20;
const cropped = new PNG({ width: cropW, height: cropH });

for (let y = 0; y < cropH; y++) {
  for (let x = 0; x < cropW; x++) {
    const srcX = minX - 10 + x;
    const srcY = minY - 10 + y;
    const tgtIdx = (y * cropW + x) * 4;

    if (srcX >= 0 && srcX < png.width && srcY >= 0 && srcY < png.height) {
      const srcIdx = (srcY * png.width + srcX) * 4;
      cropped.data[tgtIdx] = png.data[srcIdx];
      cropped.data[tgtIdx + 1] = png.data[srcIdx + 1];
      cropped.data[tgtIdx + 2] = png.data[srcIdx + 2];
      cropped.data[tgtIdx + 3] = png.data[srcIdx + 3];
    } else {
      cropped.data[tgtIdx + 3] = 0;
    }
  }
}

fs.writeFileSync('c:/Users/PC/Desktop/Fal/src/assets/runes/pouch_closed.png', PNG.sync.write(cropped));
console.log('Cropped pouch_closed.png!');
