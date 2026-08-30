const fs = require('fs');
const jpeg = require('jpeg-js');
const { PNG } = require('pngjs');

const raw = jpeg.decode(fs.readFileSync('C:/Users/PC/.gemini/antigravity-ide/brain/351560ee-0b3e-42b1-96fb-96b1fc56b13c/rune_pouch_solid_1788128785515.jpg'), { useTArray: true });
const { width, height, data } = raw;

const png = new PNG({ width, height });

// Clean Flood-Fill starting from top/left/right corners to only remove outer black
const visited = new Uint8Array(width * height);
const queue = [];

function isOuterBlack(x, y) {
  const idx = (y * width + x) * 4;
  const r = data[idx];
  const g = data[idx + 1];
  const b = data[idx + 2];
  // Outer pure black/near black
  return r < 20 && g < 20 && b < 20;
}

for (let x = 0; x < width; x++) {
  queue.push([x, 0], [x, height - 1]);
  visited[0 * width + x] = 1;
  visited[(height - 1) * width + x] = 1;
}
for (let y = 0; y < height; y++) {
  queue.push([0, y], [width - 1, y]);
  visited[y * width + 0] = 1;
  visited[y * width + (width - 1)] = 1;
}

let head = 0;
while (head < queue.length) {
  const [cx, cy] = queue[head++];
  const neighbors = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
  for (const [nx, ny] of neighbors) {
    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
      const nIdx = ny * width + nx;
      if (!visited[nIdx]) {
        visited[nIdx] = 1;
        if (isOuterBlack(nx, ny)) {
          queue.push([nx, ny]);
        }
      }
    }
  }
}

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const isBg = visited[y * width + x] === 1 && isOuterBlack(x, y);

    png.data[idx] = r;
    png.data[idx + 1] = g;
    png.data[idx + 2] = b;
    png.data[idx + 3] = isBg ? 0 : 255;
  }
}

fs.writeFileSync('c:/Users/PC/Desktop/Fal/src/assets/runes/pouch_closed.png', PNG.sync.write(png));
console.log('Processed solid realistic pouch_closed.png!');
