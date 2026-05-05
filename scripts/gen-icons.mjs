// Generates minimal valid orange PNG icons without any dependencies
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../public/icons');
mkdirSync(outDir, { recursive: true });

// Minimal valid 1x1 orange PNG (base64 encoded)
// This is a real PNG file, just 1x1 pixel with orange color
const ORANGE_PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==',
  'base64'
);
writeFileSync(join(outDir, 'icon-192.png'), ORANGE_PNG_1PX);
writeFileSync(join(outDir, 'icon-512.png'), ORANGE_PNG_1PX);
console.log('Placeholder icons created. Replace with real icons for production.');
