const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const archiveDir = 'C:\\Users\\PC\\Desktop\\Kart_Desteleri_Arsivi\\01_Lenormand_Dondorf_Klasik_Kehanet_36_Kart';
const sheetPath = path.join(archiveDir, '04_das_spiel_der_hofnung_the_game_of_hope.png');

const sheetBuffer = fs.readFileSync(sheetPath);
const sheet = PNG.sync.read(sheetBuffer);

console.log(`Sheet Size: ${sheet.width} x ${sheet.height}`);

// Let's create a thumbnail 400x500 to find the coordinates easily
const thumbW = 390;
const thumbH = 490;
const thumb = new PNG({ width: thumbW, height: thumbH });

for (let y = 0; y < thumbH; y++) {
  for (let x = 0; x < thumbW; x++) {
    const srcX = x * 10;
    const srcY = y * 10;
    const srcIdx = (srcY * sheet.width + srcX) * 4;
    const dstIdx = (y * thumbW + x) * 4;

    thumb.data[dstIdx] = sheet.data[srcIdx];
    thumb.data[dstIdx + 1] = sheet.data[srcIdx + 1];
    thumb.data[dstIdx + 2] = sheet.data[srcIdx + 2];
    thumb.data[dstIdx + 3] = sheet.data[srcIdx + 3];
  }
}

const thumbPath = path.join('C:', 'Users', 'PC', '.gemini', 'antigravity-ide', 'brain', 'd39d7b93-aea6-4314-97bb-5b3763654686', 'lenormand_sheet_thumb.png');
fs.writeFileSync(thumbPath, PNG.sync.write(thumb));
console.log('Thumbnail saved:', thumbPath);
