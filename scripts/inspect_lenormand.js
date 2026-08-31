const fs = require('fs');
const path = require('path');

const archiveDir = 'C:\\Users\\PC\\Desktop\\Kart_Desteleri_Arsivi\\01_Lenormand_Dondorf_Klasik_Kehanet_36_Kart';

console.log('--- KART BILGILERI ---');
if (fs.existsSync(path.join(archiveDir, 'KART_BILGILERI_VE_FAL_REHBERI.txt'))) {
  console.log(fs.readFileSync(path.join(archiveDir, 'KART_BILGILERI_VE_FAL_REHBERI.txt'), 'utf8'));
}
