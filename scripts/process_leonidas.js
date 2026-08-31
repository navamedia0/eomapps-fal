const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');
const { PNG } = require('pngjs');

const inputPath = path.join(__dirname, 'temp_skin.jpg');
const outputPath = path.join(__dirname, '..', 'src', 'assets', 'avatar', 'skin_leonidas.png');

const jpegData = fs.readFileSync(inputPath);
const rawData = jpeg.decode(jpegData, { useTArray: true, formatAsRGBA: true });
const width = rawData.width;
const height = rawData.height;

const png = new PNG({ width, height });

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 4;
    const r = rawData.data[idx];
    const g = rawData.data[idx + 1];
    const b = rawData.data[idx + 2];

    // High quality chroma-key for green background
    const isPureGreen = g > 130 && r < 140 && b < 140 && (g - Math.max(r, b) > 40);
    const isBrightGreen = g > 170 && (g - r > 30) && (g - b > 30);
    const isShadowGreen = g > 60 && g > r * 1.25 && g > b * 1.25 && (r < 110 && b < 110);

    if (isPureGreen || isBrightGreen || isShadowGreen) {
      png.data[idx] = 0;
      png.data[idx + 1] = 0;
      png.data[idx + 2] = 0;
      png.data[idx + 3] = 0;
    } else {
      let cleanG = g;
      if (g > Math.max(r, b) && g > 80 && (g - Math.max(r, b) > 15)) {
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
console.log('Successfully saved transparent skin to:', outputPath);
