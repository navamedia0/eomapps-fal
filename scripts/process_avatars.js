const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');
const { PNG } = require('pngjs');

const brainDir = 'C:\\Users\\PC\\.gemini\\antigravity-ide\\brain\\d39d7b93-aea6-4314-97bb-5b3763654686';
const targetDir = 'C:\\Users\\PC\\Desktop\\Fal\\src\\assets\\avatar';

const files = [
  { src: 'base_female_1788137861032.jpg', dest: 'base_female.png' },
  { src: 'blink_female_1788137874690.jpg', dest: 'blink_female.png' },
  { src: 'base_male_1788137890585.jpg', dest: 'base_male.png' },
  { src: 'blink_male_1788137905065.jpg', dest: 'blink_male.png' }
];

function processImage(srcFile, destFile) {
  const srcPath = path.join(brainDir, srcFile);
  const destPath = path.join(targetDir, destFile);

  const jpegData = fs.readFileSync(srcPath);
  const rawData = jpeg.decode(jpegData, { useTArray: true, formatAsRGBA: true });
  const { width, height, data } = rawData;

  const png = new PNG({ width, height });

  // Flood fill / intelligent color distance from pure green (#3cae4e, #47b855, #00FF00 etc.)
  // Let's sample corners to get exact green background background color:
  let bgR = 0, bgG = 0, bgB = 0, samples = 0;
  const cornerCoords = [
    [5, 5], [width - 6, 5], [5, height - 6], [width - 6, height - 6],
    [width / 2 | 0, 5], [5, height / 2 | 0], [width - 6, height / 2 | 0]
  ];
  for (const [cx, cy] of cornerCoords) {
    const idx = (cy * width + cx) * 4;
    bgR += data[idx];
    bgG += data[idx + 1];
    bgB += data[idx + 2];
    samples++;
  }
  bgR /= samples; bgG /= samples; bgB /= samples;
  console.log(`[${srcFile}] Detected background RGB:`, Math.round(bgR), Math.round(bgG), Math.round(bgB));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      let r = data[idx];
      let g = data[idx + 1];
      let b = data[idx + 2];

      // Green dominance calculation
      // For green screen: g is significantly higher than r and b
      const maxRB = Math.max(r, b);
      const greenDiff = g - maxRB;

      let alpha = 255;

      // Color distance from detected bg
      const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);

      // Also check bottom shadow oval if any
      // The shadow under feet might have a slight darker green tone (r ~ 40, g ~ 150, b ~ 70)
      const isShadowGreen = (y > height * 0.85) && (g > r * 1.3) && (g > b * 1.3) && (g > 100);

      if (greenDiff > 45 || dist < 70 || isShadowGreen) {
        // Fully transparent background
        alpha = 0;
        r = 0; g = 0; b = 0;
      } else if (greenDiff > 15) {
        // Edge transition / anti-aliasing
        const t = (greenDiff - 15) / 30; // 0 to 1
        alpha = Math.round(255 * (1 - t));
        // Despill green
        g = Math.min(g, maxRB);
      } else {
        // Solid pixel, despill any slight green fringe
        if (g > maxRB) {
          g = maxRB;
        }
      }

      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = alpha;
    }
  }

  // Write PNG
  const buffer = PNG.sync.write(png);
  fs.writeFileSync(destPath, buffer);
  console.log(`Saved transparent PNG -> ${destPath} (${width}x${height})`);
}

for (const f of files) {
  processImage(f.src, f.dest);
}
