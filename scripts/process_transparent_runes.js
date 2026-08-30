const fs = require('fs');
const jpeg = require('jpeg-js');
const { PNG } = require('pngjs');

function removeCheckerboardAndBackground(jpgPath, pngPath, options = {}) {
  const jpegData = fs.readFileSync(jpgPath);
  const rawImage = jpeg.decode(jpegData, { useTArray: true });
  const { width, height, data } = rawImage;

  const png = new PNG({ width, height });

  // Options
  const {
    cornerThreshold = 80, // brightness or diff threshold
    detectChecker = true,
    padding = 0,
  } = options;

  // Let's create a transparency mask using BFS / Flood-Fill from all 4 borders
  const visited = new Uint8Array(width * height);
  const queue = [];

  function isBackgroundPixel(x, y) {
    const idx = (y * width + x) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    // Check for checkerboard gray/dark pattern (r, g, b close to each other, gray values around 30-140)
    // or black vignette (r < 40, g < 40, b < 40)
    // or neutral gray checkerboard (r,g,b are within 15 of each other and not brown/warm/icy blue)
    const isGray = Math.max(r, g, b) - Math.min(r, g, b) < 22;
    const isDark = (r + g + b) / 3 < 50;
    const isCheckerGray = isGray && (r + g + b) / 3 < 160;

    return isDark || isCheckerGray;
  }

  // Push border pixels
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
    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = ny * width + nx;
        if (!visited[nIdx]) {
          visited[nIdx] = 1;
          if (isBackgroundPixel(nx, ny)) {
            queue.push([nx, ny]);
          }
        }
      }
    }
  }

  // Also calculate distance or feathering for smooth edges
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const isBg = visited[y * width + x] === 1 && isBackgroundPixel(x, y);

      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = isBg ? 0 : 255;
    }
  }

  // Write PNG
  const buffer = PNG.sync.write(png);
  fs.writeFileSync(pngPath, buffer);
  console.log(`Saved transparent PNG: ${pngPath}`);
}

removeCheckerboardAndBackground(
  'c:/Users/PC/Desktop/Fal/src/assets/runes/stone_blank.jpg',
  'c:/Users/PC/Desktop/Fal/src/assets/runes/stone_blank.png'
);

removeCheckerboardAndBackground(
  'c:/Users/PC/Desktop/Fal/src/assets/runes/pouch_closed.jpg',
  'c:/Users/PC/Desktop/Fal/src/assets/runes/pouch_closed.png'
);
