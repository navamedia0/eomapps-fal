const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const archiveDir = 'C:\\Users\\PC\\Desktop\\Kart_Desteleri_Arsivi\\01_Lenormand_Dondorf_Klasik_Kehanet_36_Kart';
const sheetPath = path.join(archiveDir, '04_das_spiel_der_hofnung_the_game_of_hope.png');
const outputDir = path.join(__dirname, '..', 'src', 'assets', 'cards', 'lenormand');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Reading high-res master sheet...');
const sheet = PNG.sync.read(fs.readFileSync(sheetPath));

// Column start X coordinates (measured from 3900px width)
const colStarts = [140, 770, 1390, 2000, 2610, 3240];
const colWidth = 530;

// Row start Y coordinates (measured from 4900px height)
const rowStarts = [120, 910, 1700, 2480, 3270, 4060];
const rowHeight = 710;

function sliceCard(colIndex, rowIndex, cardNum) {
  const startX = colStarts[colIndex];
  const startY = rowStarts[rowIndex];

  const card = new PNG({ width: colWidth, height: rowHeight });

  for (let y = 0; y < rowHeight; y++) {
    for (let x = 0; x < colWidth; x++) {
      const srcX = startX + x;
      const srcY = startY + y;
      const srcIdx = (srcY * sheet.width + srcX) * 4;
      const dstIdx = (y * colWidth + x) * 4;

      card.data[dstIdx] = sheet.data[srcIdx];
      card.data[dstIdx + 1] = sheet.data[srcIdx + 1];
      card.data[dstIdx + 2] = sheet.data[srcIdx + 2];
      card.data[dstIdx + 3] = sheet.data[srcIdx + 3];
    }
  }

  const numStr = String(cardNum).padStart(2, '0');
  const outFile = path.join(outputDir, `lenormand_${numStr}.png`);
  fs.writeFileSync(outFile, PNG.sync.write(card));
  console.log(`Sliced: lenormand_${numStr}.png (Card ${cardNum})`);
}

let cardNum = 1;
for (let r = 0; r < 6; r++) {
  for (let c = 0; c < 6; c++) {
    sliceCard(c, r, cardNum);
    cardNum++;
  }
}
console.log('--- ALL 36 LENORMAND CARDS PERFECTLY SLICED & SAVED ---');
