const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const archiveDir = 'C:\\Users\\PC\\Desktop\\Kart_Desteleri_Arsivi\\01_Lenormand_Dondorf_Klasik_Kehanet_36_Kart';
const sheetPath = path.join(archiveDir, '04_das_spiel_der_hofnung_the_game_of_hope.png');
const outputDir = path.join(__dirname, '..', 'src', 'assets', 'cards', 'lenormand');

const sheetBuffer = fs.readFileSync(sheetPath);
const sheet = PNG.sync.read(sheetBuffer);

console.log(`Sheet Size: ${sheet.width} x ${sheet.height}`);

// Let's find the sheet's card grid:
// Margins: Top ~ 730, Bottom ~ 4780 (h: 4050, 6 rows -> rowH ~ 675)
// Margins: Left ~ 930, Right ~ 3850 (w: 2920, 6 cols -> colW ~ 486)

const startX = 930;
const startY = 730;
const cardW = 485;
const cardH = 675;

function slicePreciseCard(col, row, cardNum) {
  const x0 = startX + col * cardW;
  const y0 = startY + row * cardH;

  const cardPng = new PNG({ width: cardW, height: cardH });

  for (let y = 0; y < cardH; y++) {
    for (let x = 0; x < cardW; x++) {
      const srcX = x0 + x;
      const srcY = y0 + y;
      const srcIdx = (srcY * sheet.width + srcX) * 4;
      const dstIdx = (y * cardW + x) * 4;

      cardPng.data[dstIdx] = sheet.data[srcIdx];
      cardPng.data[dstIdx + 1] = sheet.data[srcIdx + 1];
      cardPng.data[dstIdx + 2] = sheet.data[srcIdx + 2];
      cardPng.data[dstIdx + 3] = sheet.data[srcIdx + 3];
    }
  }

  const numStr = String(cardNum).padStart(2, '0');
  const outFile = path.join(outputDir, `lenormand_${numStr}.png`);
  fs.writeFileSync(outFile, PNG.sync.write(cardPng));
}

let cardCount = 1;
for (let r = 0; r < 6; r++) {
  for (let c = 0; c < 6; c++) {
    slicePreciseCard(c, r, cardCount);
    cardCount++;
  }
}
console.log('--- PRECISE 36 LENORMAND CARDS SLICED ---');
