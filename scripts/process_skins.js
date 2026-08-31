const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');
const { PNG } = require('pngjs');

const inputDir = 'C:\\Users\\PC\\Desktop\\avatar\\skins';
const outputDir = path.join(__dirname, '..', 'src', 'assets', 'avatar');

if (!fs.existsSync(inputDir)) {
  fs.mkdirSync(inputDir, { recursive: true });
}

function processSkin(inputPath, outputPath) {
  let rawData, width, height;

  if (inputPath.endsWith('.jpg') || inputPath.endsWith('.jpeg')) {
    const jpegData = fs.readFileSync(inputPath);
    rawData = jpeg.decode(jpegData, { useTArray: true, formatAsRGBA: true });
    width = rawData.width;
    height = rawData.height;
  } else if (inputPath.endsWith('.png')) {
    const pngData = PNG.sync.read(fs.readFileSync(inputPath));
    rawData = pngData;
    width = pngData.width;
    height = pngData.height;
  } else {
    return;
  }

  const png = new PNG({ width, height });

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = rawData.data[idx];
      const g = rawData.data[idx + 1];
      const b = rawData.data[idx + 2];
      const a = rawData.data[idx + 3] ?? 255;

      if (a === 0) {
        png.data[idx] = 0;
        png.data[idx + 1] = 0;
        png.data[idx + 2] = 0;
        png.data[idx + 3] = 0;
        continue;
      }

      // Check green background
      const isPureGreen = g > 130 && r < 140 && b < 140 && (g - Math.max(r, b) > 40);
      const isBrightGreen = g > 180 && (g - r > 30) && (g - b > 30);
      const isShadowGreen = g > 70 && g > r * 1.3 && g > b * 1.3 && (r < 100 && b < 100);

      // Check pure white or transparent
      const isPureWhite = r > 248 && g > 248 && b > 248;

      if (isPureGreen || isBrightGreen || isShadowGreen || isPureWhite) {
        png.data[idx] = 0;
        png.data[idx + 1] = 0;
        png.data[idx + 2] = 0;
        png.data[idx + 3] = 0;
      } else {
        let cleanG = g;
        if (g > Math.max(r, b) && g > 90) {
          cleanG = Math.round((Math.max(r, b) + g) / 2);
        }
        png.data[idx] = r;
        png.data[idx + 1] = cleanG;
        png.data[idx + 2] = b;
        png.data[idx + 3] = 255;
      }
    }
  }

  fs.writeFileSync(outputPath, PNG.sync.write(png));
  console.log(`Successfully Processed Skin: ${path.basename(outputPath)}`);
}

const files = fs.readdirSync(inputDir);
for (const file of files) {
  const src = path.join(inputDir, file);
  const ext = path.extname(file);
  const name = path.basename(file, ext);
  const dst = path.join(outputDir, `${name}.png`);
  processSkin(src, dst);
}
