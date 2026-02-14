export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function length(x, y) {
  return Math.hypot(x, y);
}

export function normalize(x, y) {
  const len = Math.hypot(x, y) || 1;
  return { x: x / len, y: y / len, len };
}

export function dot(ax, ay, bx, by) {
  return ax * bx + ay * by;
}

export function closestPointOnSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const denom = abx * abx + aby * aby || 1;
  const t = clamp((apx * abx + apy * aby) / denom, 0, 1);
  return {
    x: ax + abx * t,
    y: ay + aby * t,
    t,
  };
}

export function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function smoothStep01(t) {
  return t * t * (3 - 2 * t);
}

function hash2(x, y) {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

export function valueNoise2D(x, y) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;

  const tx = x - x0;
  const ty = y - y0;

  const n00 = hash2(x0, y0);
  const n10 = hash2(x1, y0);
  const n01 = hash2(x0, y1);
  const n11 = hash2(x1, y1);

  const ux = smoothStep01(tx);
  const uy = smoothStep01(ty);

  const nx0 = lerp(n00, n10, ux);
  const nx1 = lerp(n01, n11, ux);
  return lerp(nx0, nx1, uy);
}
