import Jimp from 'jimp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractDominantColor } from './src/dominantColor.js';

// Load palette from shared JSON file
async function loadPalette() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const palettePath = path.join(__dirname, 'palette.json');
  try {
    const text = await fs.readFile(palettePath, 'utf8');
    return JSON.parse(text);
  } catch {
    return ['#ffffff', '#f1c40f', '#e74c3c', '#27ae60', '#2980b9', '#8e44ad', '#000000'];
  }
}

function hexToRgb(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  return [ (bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255 ];
}

function distance(a, b) {
  return Math.sqrt(
    (a[0] - b[0]) ** 2 +
    (a[1] - b[1]) ** 2 +
    (a[2] - b[2]) ** 2
  );
}

function rgbToHsl([r, g, b]) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h, s, l];
}

async function dominantColor(imgPath) {
  const image = await Jimp.read(imgPath);
  return extractDominantColor(image.bitmap.data);
}

export async function tagImages(imagePaths) {
  const palette = await loadPalette();
  const paletteRgb = palette.map(hexToRgb);
  const result = {};
  for (const imgPath of imagePaths) {
    const dom = await dominantColor(imgPath);
    const [, s, l] = rgbToHsl(dom);
    let target = dom;
    if (s < 0.2) {
      target = l < 0.2 ? [0, 0, 0] : l > 0.8 ? [255, 255, 255] : [128, 128, 128];
    }
    let bestIndex = 0;
    let min = Infinity;
    for (let i = 0; i < paletteRgb.length; i++) {
      const d = distance(target, paletteRgb[i]);
      if (d < min) {
        min = d;
        bestIndex = i;
      }
    }
    result[imgPath] = palette[bestIndex];
  }
  return result;
}

// CLI usage: node tagImages.mjs img1.jpg img2.png
if (fileURLToPath(import.meta.url) === process.argv[1]) {
  const paths = process.argv.slice(2);
  tagImages(paths)
    .then((map) => console.log(map))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
