import Jimp from 'jimp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load the DEFAULT_COLORS array from src/colorConfig.js
async function loadPalette() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const configPath = path.join(__dirname, 'src', 'colorConfig.js');
  const text = await fs.readFile(configPath, 'utf8');
  const match = text.match(/DEFAULT_COLORS\s*=\s*(\[[^\]]+\])/);
  if (!match) throw new Error('DEFAULT_COLORS not found in colorConfig.js');
  // Convert single quotes to double quotes and parse JSON
  const arr = JSON.parse(match[1].replace(/'/g, '"'));
  return arr;
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

async function averageColor(imgPath) {
  const image = await Jimp.read(imgPath);
  let r = 0, g = 0, b = 0;
  const { data, width, height } = image.bitmap;
  const total = width * height;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  return [ Math.round(r / total), Math.round(g / total), Math.round(b / total) ];
}

export async function tagImages(imagePaths) {
  const palette = await loadPalette();
  const paletteRgb = palette.map(hexToRgb);
  const result = {};
  for (const imgPath of imagePaths) {
    const avg = await averageColor(imgPath);
    const [, s, l] = rgbToHsl(avg);
    let target = avg;
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
if (import.meta.url === fileURLToPath(process.argv[1])) {
  const paths = process.argv.slice(2);
  tagImages(paths)
    .then((map) => console.log(map))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
