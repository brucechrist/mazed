export function extractDominantColor(data) {
  const buckets = new Map();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const key = `${r >> 5},${g >> 5},${b >> 5}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { count: 0, r: 0, g: 0, b: 0 };
      buckets.set(key, bucket);
    }
    bucket.count++;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
  }
  let dominant = null;
  for (const bucket of buckets.values()) {
    if (!dominant || bucket.count > dominant.count) {
      dominant = bucket;
    }
  }
  return dominant
    ? [
        Math.round(dominant.r / dominant.count),
        Math.round(dominant.g / dominant.count),
        Math.round(dominant.b / dominant.count),
      ]
    : [0, 0, 0];
}
