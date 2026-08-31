const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');
const { PNG } = require('pngjs');

const archiveDir = 'C:\\Users\\PC\\Desktop\\Kart_Desteleri_Arsivi\\01_Lenormand_Dondorf_Klasik_Kehanet_36_Kart';

console.log('Inspecting sheets in Lenormand archive...');
// Let's check 04_das_spiel_der_hofnung_the_game_of_hope.png
const pngPath = path.join(archiveDir, '04_das_spiel_der_hofnung_the_game_of_hope.png');
if (fs.existsSync(pngPath)) {
  const stat = fs.statSync(pngPath);
  console.log(`04: ${stat.size} bytes`);
}
