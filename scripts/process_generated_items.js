const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');
const { PNG } = require('pngjs');

const brainDir = path.join('C:', 'Users', 'PC', '.gemini', 'antigravity-ide', 'brain', 'd39d7b93-aea6-4314-97bb-5b3763654686');
const targetDir = path.join(__dirname, '..', 'src', 'assets', 'avatar');

const generatedFiles = {
  avatar_hat_star: 'avatar_hat_star_1788164121955.jpg',
  avatar_hat_crescent: 'avatar_hat_crescent_1788164083375.jpg',
  avatar_hat_flowercrown: 'avatar_hat_flowercrown_1788164103814.jpg',
  avatar_cape_starry: 'avatar_cape_starry_1788164140066.jpg',
  avatar_cape_shadow: 'avatar_cape_shadow_1788164160419.jpg',
  avatar_cape_royal: 'avatar_cape_royal_1788164179593.jpg',
  avatar_outfit_mystic: 'avatar_outfit_mystic_1788164200365.jpg',
  avatar_outfit_scholar: 'avatar_outfit_scholar_1788164221290.jpg',
};

function removeGreenScreen(jpgPath, pngPath) {
  const jpegData = fs.readFileSync(jpgPath);
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

      const isPureGreen = g > 130 && r < 140 && b < 140 && (g - Math.max(r, b) > 40);
      const isBrightGreen = g > 180 && (g - r > 30) && (g - b > 30);
      const isShadowGreen = g > 70 && g > r * 1.3 && g > b * 1.3 && (r < 100 && b < 100);

      if (isPureGreen || isBrightGreen || isShadowGreen) {
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

  const buffer = PNG.sync.write(png);
  fs.writeFileSync(pngPath, buffer);
  console.log(`Processed & Saved: ${pngPath}`);
}

for (const [key, filename] of Object.entries(generatedFiles)) {
  const src = path.join(brainDir, filename);
  const dst = path.join(targetDir, `${key}.png`);
  if (fs.existsSync(src)) {
    removeGreenScreen(src, dst);
  }
}
