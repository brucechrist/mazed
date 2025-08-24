export function rgbToLab([r, g, b]) {
  r /= 255;
  g /= 255;
  b /= 255;

  r = r > 0.04045 ? ((r + 0.055) / 1.055) ** 2.4 : r / 12.92;
  g = g > 0.04045 ? ((g + 0.055) / 1.055) ** 2.4 : g / 12.92;
  b = b > 0.04045 ? ((b + 0.055) / 1.055) ** 2.4 : b / 12.92;

  const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
  const y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
  const z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;

  const xr = x / 0.95047;
  const yr = y / 1.0;
  const zr = z / 1.08883;

  const fx = xr > 0.008856 ? Math.cbrt(xr) : (7.787 * xr) + 16 / 116;
  const fy = yr > 0.008856 ? Math.cbrt(yr) : (7.787 * yr) + 16 / 116;
  const fz = zr > 0.008856 ? Math.cbrt(zr) : (7.787 * zr) + 16 / 116;

  const L = (116 * fy) - 16;
  const a = 500 * (fx - fy);
  const bVal = 200 * (fy - fz);
  return [L, a, bVal];
}

function ciede2000(lab1, lab2) {
  const [L1, a1, b1] = lab1;
  const [L2, a2, b2] = lab2;

  const kL = 1;
  const kC = 1;
  const kH = 1;

  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const meanC = (C1 + C2) / 2;
  const meanC7 = Math.pow(meanC, 7);
  const G = 0.5 * (1 - Math.sqrt(meanC7 / (meanC7 + Math.pow(25, 7))));

  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.sqrt(a1p * a1p + b1 * b1);
  const C2p = Math.sqrt(a2p * a2p + b2 * b2);

  const h1p = Math.atan2(b1, a1p) + (Math.atan2(b1, a1p) < 0 ? 2 * Math.PI : 0);
  const h2p = Math.atan2(b2, a2p) + (Math.atan2(b2, a2p) < 0 ? 2 * Math.PI : 0);

  const dLp = L2 - L1;
  const dCp = C2p - C1p;

  let dhp = 0;
  if (C1p * C2p !== 0) {
    const dh = h2p - h1p;
    if (dh > Math.PI) dhp = dh - 2 * Math.PI;
    else if (dh < -Math.PI) dhp = dh + 2 * Math.PI;
    else dhp = dh;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(dhp / 2);

  const Lp = (L1 + L2) / 2;
  const Cp = (C1p + C2p) / 2;

  let hp = h1p + h2p;
  if (C1p * C2p !== 0) {
    if (Math.abs(h1p - h2p) > Math.PI) {
      hp += 2 * Math.PI;
    }
    hp /= 2;
  }

  const T =
    1 -
    0.17 * Math.cos(hp - Math.PI / 6) +
    0.24 * Math.cos(2 * hp) +
    0.32 * Math.cos(3 * hp + Math.PI / 30) -
    0.20 * Math.cos(4 * hp - (63 * Math.PI) / 180);

  const dTheta =
    (30 * Math.PI / 180) *
    Math.exp(-(((hp * 180 / Math.PI - 275) / 25) ** 2));
  const R_C = 2 * Math.sqrt(Math.pow(Cp, 7) / (Math.pow(Cp, 7) + Math.pow(25, 7)));
  const S_L = 1 + (0.015 * (Lp - 50) * (Lp - 50)) / Math.sqrt(20 + (Lp - 50) * (Lp - 50));
  const S_C = 1 + 0.045 * Cp;
  const S_H = 1 + 0.015 * Cp * T;
  const R_T = -Math.sin(2 * dTheta) * R_C;

  const dE = Math.sqrt(
    (dLp / (kL * S_L)) ** 2 +
    (dCp / (kC * S_C)) ** 2 +
    (dHp / (kH * S_H)) ** 2 +
    R_T * (dCp / (kC * S_C)) * (dHp / (kH * S_H))
  );
  return dE;
}

export function colorDiff(rgb1, rgb2) {
  return ciede2000(rgbToLab(rgb1), rgbToLab(rgb2));
}
