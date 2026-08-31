const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const archiveDir = 'C:\\Users\\PC\\Desktop\\Kart_Desteleri_Arsivi\\01_Lenormand_Dondorf_Klasik_Kehanet_36_Kart';
const sheetPath = path.join(archiveDir, '04_das_spiel_der_hofnung_the_game_of_hope.png');
const outputDir = path.join(__dirname, '..', 'src', 'assets', 'cards', 'lenormand');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Reading 04_das_spiel_der_hofnung_the_game_of_hope.png (30MB)...');
const sheetBuffer = fs.readFileSync(sheetPath);
const sheet = PNG.sync.read(sheetBuffer);

console.log(`Sheet Size: ${sheet.width} x ${sheet.height}`);

// 6 columns x 6 rows = 36 cards
const cols = 6;
const rows = 6;

// Estimate card width and height (with slight margins)
const cardW = Math.floor(sheet.width / cols);
const cardH = Math.floor(sheet.height / rows);

console.log(`Each card approx: ${cardW} x ${cardH} px`);

// Slice card 1 as a test
function sliceCard(col, row, cardNum) {
  const startX = col * cardW;
  const startY = row * cardH;

  const cardPng = new PNG({ width: cardW, height: cardH });

  for (let y = 0; y < cardH; y++) {
    for (let x = 0; x < cardW; x++) {
      const srcIdx = ((startY + y) * sheet.width + (startX + x)) * 4;
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
  console.log(`Sliced & Saved: lenormand_${numStr}.png (${cardW}x${cardH})`);
}

let cardCount = 1;
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    sliceCard(c, r, cardCount);
    cardCount++;
  }
}
console.log('--- ALL 36 LENORMAND CARDS SLICED SUCCESSFULLY ---');
