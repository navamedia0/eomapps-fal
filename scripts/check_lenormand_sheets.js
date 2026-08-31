const fs = require('fs');
const path = require('path');

const archiveDir = 'C:\\Users\\PC\\Desktop\\Kart_Desteleri_Arsivi\\01_Lenormand_Dondorf_Klasik_Kehanet_36_Kart';
const files = fs.readdirSync(archiveDir);

console.log('--- ALL FILES IN LENORMAND ARCHIVE ---');
files.forEach(f => {
  const stat = fs.statSync(path.join(archiveDir, f));
  console.log(`${f.padEnd(55)} -> ${(stat.size / (1024*1024)).toFixed(2)} MB`);
});
