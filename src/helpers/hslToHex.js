export default function hslToHex(h, s, l) {
  const hue = Number.isFinite(Number(h)) ? Number(h) : 0;
  const saturation = Math.max(0, Math.min(100, Number.isFinite(Number(s)) ? Number(s) : 0));
  const lightness = Math.max(0, Math.min(100, Number.isFinite(Number(l)) ? Number(l) : 0));

  const sNorm = saturation / 100;
  const lNorm = lightness / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (hue < 60) {
    r = c;
    g = x;
  } else if (hue < 120) {
    r = x;
    g = c;
  } else if (hue < 180) {
    g = c;
    b = x;
  } else if (hue < 240) {
    g = x;
    b = c;
  } else if (hue < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const toHex = (value) => {
    const channel = Math.round((value + m) * 255);
    return channel.toString(16).padStart(2, "0");
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toLowerCase();
}

