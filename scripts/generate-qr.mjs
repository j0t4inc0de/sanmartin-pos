import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

const url = 'https://sanmartin.wearesamod.com/menu';
const outputDir = path.resolve('public');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateQRCodes() {
  // 1. Generate ultra crisp SVG (vector for print)
  const svgPath = path.join(outputDir, 'qr-sanmartin.svg');
  await QRCode.toFile(svgPath, url, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 2,
    color: {
      dark: '#0D0D0D', // Dark brand charcoal
      light: '#FFFFFF' // Clean high-contrast white
    },
    width: 1024
  });
  console.log(`Vector QR Code generated at: ${svgPath}`);

  // 2. Generate high-resolution 2048x2048 PNG
  const pngPath = path.join(outputDir, 'qr-sanmartin.png');
  await QRCode.toFile(pngPath, url, {
    type: 'png',
    errorCorrectionLevel: 'H',
    margin: 2,
    color: {
      dark: '#0D0D0D',
      light: '#FFFFFF'
    },
    width: 2048
  });
  console.log(`High-res PNG QR Code generated at: ${pngPath}`);
}

generateQRCodes().catch(console.error);
