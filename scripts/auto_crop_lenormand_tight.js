const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const archiveDir = 'C:\\Users\\PC\\Desktop\\Kart_Desteleri_Arsivi\\01_Lenormand_Dondorf_Klasik_Kehanet_36_Kart';
const sheetPath = path.join(archiveDir, '04_das_spiel_der_hofnung_the_game_of_hope.png');
const outputDir = path.join(__dirname, '..', 'src', 'assets', 'cards', 'lenormand');

console.log('Loading high-res master sheet...');
const sheet = PNG.sync.read(fs.readFileSync(sheetPath));

// Approximate rough centers for 6x6 grid
const colStarts = [110, 740, 1360, 1970, 2580, 3210];
const colWidth = 580;
const rowStarts = [90, 880, 1670, 2450, 3240, 4030];
const rowHeight = 740;

function isWhiteBackground(r, g, b) {
  // Pure or near-pure white background from museum scanner
  return (r > 240 && g > 240 && b > 240) || (r > 230 && g > 230 && b > 230 && Math.abs(r - g) < 8 && Math.abs(g - b) < 8);
}

function processAndAutoCrop(colIndex, rowIndex, cardNum) {
  const roughX = colStarts[colIndex];
  const roughY = rowStarts[rowIndex];

  // 1. Extract rough slice
  const roughPng = new PNG({ width: colWidth, height: rowHeight });
  for (let y = 0; y < rowHeight; y++) {
    for (let x = 0; x < colWidth; x++) {
      const srcX = Math.min(sheet.width - 1, roughX + x);
      const srcY = Math.min(sheet.height - 1, roughY + y);
      const srcIdx = (srcY * sheet.width + srcX) * 4;
      const dstIdx = (y * colWidth + x) * 4;

      roughPng.data[dstIdx] = sheet.data[srcIdx];
      roughPng.data[dstIdx + 1] = sheet.data[srcIdx + 1];
      roughPng.data[dstIdx + 2] = sheet.data[srcIdx + 2];
      roughPng.data[dstIdx + 3] = sheet.data[srcIdx + 3];
    }
  }

  // 2. Find exact card boundary (Top, Bottom, Left, Right)
  let minX = 0;
  for (let x = 0; x < colWidth / 2; x++) {
    let nonWhiteCount = 0;
    for (let y = Math.floor(rowHeight * 0.2); y < rowHeight * 0.8; y++) {
      const idx = (y * colWidth + x) * 4;
      if (!isWhiteBackground(roughPng.data[idx], roughPng.data[idx + 1], roughPng.data[idx + 2])) {
        nonWhiteCount++;
      }
    }
    if (nonWhiteCount > rowHeight * 0.3) {
      minX = x;
      break;
    }
  }

  let maxX = colWidth - 1;
  for (let x = colWidth - 1; x > colWidth / 2; x--) {
    let nonWhiteCount = 0;
    for (let y = Math.floor(rowHeight * 0.2); y < rowHeight * 0.8; y++) {
      const idx = (y * colWidth + x) * 4;
      if (!isWhiteBackground(roughPng.data[idx], roughPng.data[idx + 1], roughPng.data[idx + 2])) {
        nonWhiteCount++;
      }
    }
    if (nonWhiteCount > rowHeight * 0.3) {
      maxX = x;
      break;
    }
  }

  let minY = 0;
  for (let y = 0; y < rowHeight / 2; y++) {
    let nonWhiteCount = 0;
    for (let x = Math.floor(colWidth * 0.2); x < colWidth * 0.8; x++) {
      const idx = (y * colWidth + x) * 4;
      if (!isWhiteBackground(roughPng.data[idx], roughPng.data[idx + 1], roughPng.data[idx + 2])) {
        nonWhiteCount++;
      }
    }
    if (nonWhiteCount > colWidth * 0.3) {
      minY = y;
      break;
    }
  }

  let maxY = rowHeight - 1;
  for (let y = rowHeight - 1; y > rowHeight / 2; y--) {
    let nonWhiteCount = 0;
    for (let x = Math.floor(colWidth * 0.2); x < colWidth * 0.8; x++) {
      const idx = (y * colWidth + x) * 4;
      if (!isWhiteBackground(roughPng.data[idx], roughPng.data[idx + 1], roughPng.data[idx + 2])) {
        nonWhiteCount++;
      }
    }
    if (nonWhiteCount > colWidth * 0.3) {
      maxY = y;
      break;
    }
  }

  // Adjust by 2px inside to remove any edge artifact
  const cropX = minX + 2;
  const cropY = minY + 2;
  const cropW = Math.max(10, maxX - minX - 4);
  const cropH = Math.max(10, maxY - minY - 4);

  // 3. Export tightly cropped card
  const finalCard = new PNG({ width: cropW, height: cropH });
  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const srcIdx = ((cropY + y) * colWidth + (cropX + x)) * 4;
      const dstIdx = (y * cropW + x) * 4;

      finalCard.data[dstIdx] = roughPng.data[srcIdx];
      finalCard.data[dstIdx + 1] = roughPng.data[srcIdx + 1];
      finalCard.data[dstIdx + 2] = roughPng.data[srcIdx + 2];
      finalCard.data[dstIdx + 3] = 255;
    }
  }

  const numStr = String(cardNum).padStart(2, '0');
  const outFile = path.join(outputDir, `lenormand_${numStr}.png`);
  fs.writeFileSync(outFile, PNG.sync.write(finalCard));
  console.log(`Auto-Cropped Card ${numStr}: ${cropW}x${cropH} (tight bounds)`);
}

let cardNum = 1;
for (let r = 0; r < 6; r++) {
  for (let c = 0; c < 6; c++) {
    processAndAutoCrop(c, r, cardNum);
    cardNum++;
  }
}
console.log('--- ALL 36 CARDS TIGHTLY AUTO-CROPPED WITH ZERO WHITE GAPS ---');
