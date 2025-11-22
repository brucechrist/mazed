const fs = require('fs');
const path = require('path');

const defaultPalette = require('./palette.default.json');

const palettePath = path.join(__dirname, 'palette.json');
const HEX_COLOR_PATTERN = /^#?[0-9a-f]{3,8}$/i;

const normalizePaletteList = (colors) => {
  if (!Array.isArray(colors)) return null;
  const normalized = [];
  for (const color of colors) {
    if (typeof color !== 'string') continue;
    const trimmed = color.trim();
    if (!trimmed) continue;
    const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
    if (!HEX_COLOR_PATTERN.test(withHash)) continue;
    const lower = withHash.toLowerCase();
    if (!normalized.includes(lower)) {
      normalized.push(lower);
    }
  }
  return normalized.length ? normalized : null;
};

const writePalette = (palette) => {
  fs.writeFileSync(
    palettePath,
    JSON.stringify(palette, null, 2) + '\n',
    'utf8'
  );
};

(() => {
  try {
    const text = fs.readFileSync(palettePath, 'utf8');
    const parsed = JSON.parse(text);
    const normalized = normalizePaletteList(parsed);
    if (normalized) {
      if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
        writePalette(normalized);
      }
      return;
    }
  } catch {
    // fall through to restore default palette
  }
  writePalette(defaultPalette);
})();
