const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');
const { PNG } = require('pngjs');

const archiveDir = 'C:\\Users\\PC\\Desktop\\Kart_Desteleri_Arsivi\\01_Lenormand_Dondorf_Klasik_Kehanet_36_Kart';
const files = fs.readdirSync(archiveDir);

console.log('--- IMAGE DIMENSIONS ---');
for (const f of files) {
  const fullPath = path.join(archiveDir, f);
  if (f.endsWith('.png')) {
    try {
      const data = fs.readFileSync(fullPath);
      const png = PNG.sync.read(data);
      console.log(`${f.padEnd(55)} -> ${png.width} x ${png.height} (${(data.length / (1024*1024)).toFixed(2)} MB)`);
    } catch (e) {
      console.log(`${f.padEnd(55)} -> PNG Error: ${e.message}`);
    }
  } else if (f.endsWith('.jpg') || f.endsWith('.jpeg')) {
    try {
      const data = fs.readFileSync(fullPath);
      const decoded = jpeg.decode(data, { maxMemoryUsageInMB: 2048 });
      console.log(`${f.padEnd(55)} -> ${decoded.width} x ${decoded.height} (${(data.length / (1024*1024)).toFixed(2)} MB)`);
    } catch (e) {
      console.log(`${f.padEnd(55)} -> JPG Error: ${e.message}`);
    }
  }
}
