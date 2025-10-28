export default function hexToHue(hex) {
  if (typeof hex !== "string") {
    return null;
  }

  const clean = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(clean)) {
    return null;
  }

  const normalized = clean.length === 3
    ? clean
        .split("")
        .map((char) => `${char}${char}`)
        .join("")
    : clean;

  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  if (delta === 0) {
    return 0;
  }

  let hue;
  switch (max) {
    case r:
      hue = ((g - b) / delta) % 6;
      break;
    case g:
      hue = (b - r) / delta + 2;
      break;
    default:
      hue = (r - g) / delta + 4;
      break;
  }

  const result = Math.round(hue * 60);
  return result < 0 ? result + 360 : result;
}

