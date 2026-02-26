// ─── CONSTANTS ───────────────────────────────────────────────
const W = 1500, H = 1000;
const BOARD = { x: 160, y: 60, w: 1180, h: 880 };
const SIDEBAR = { x: 17, y: 111, w: 126, h: 778, r: 10, gap: 2, pad: 6 };
const LENS_R = 230;
const TOOL_R = LENS_R * 1.45;
const MAX_SPEED = 980;
const BASE_DAMP = 0.60;
const BASE_ELAST = 0.85;
const BASE_RAD = 36;
const BASE_MASS = 5;
const TRAIL_MAX = 95;
const DEFAULT_WALL_WIDTH = 20;
const HACKER_CB_RECT = { x: W - 180, y: 10, w: 168, h: 30 };

// Rainbow rod colors per level
const ROD_COLORS = [
  "#ff3333",  // Level 1 - Red
  "#ff8800",  // Level 2 - Orange
  "#ffdd00",  // Level 3 - Yellow
  "#33dd55",  // Level 4 - Green
  "#3399ff",  // Level 5 - Blue
  "#5533cc",  // Level 6 - Indigo
  "#aa33ff"   // Level 7 - Violet
];
const TRAIL_COLORS = [
  null,        // Level 1 - no trail
  "#ff3333",  // Level 2 - Red
  "#ff8800",  // Level 3 - Orange
  "#ffdd00",  // Level 4 - Yellow
  "#33dd55",  // Level 5 - Green
  "#3399ff",  // Level 6 - Blue
  "#7744ee"   // Level 7 - Violet/Indigo
];

// ─── MATH HELPERS ────────────────────────────────────────────
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
function dot(ax, ay, bx, by) { return ax * bx + ay * by; }
function wallWidth(w) {
  const raw = w && typeof w.width === "number" ? w.width : DEFAULT_WALL_WIDTH;
  return Math.max(2, raw);
}
function wallHalfWidth(w) { return wallWidth(w) * 0.5; }
function closestPt(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
  return { x: ax + dx * t, y: ay + dy * t };
}
function pointInBoard(x, y) { return x >= BOARD.x && y >= BOARD.y && x <= BOARD.x + BOARD.w && y <= BOARD.y + BOARD.h; }
function sidebarRect(i) {
  const ih = (SIDEBAR.h - SIDEBAR.pad * 2 - SIDEBAR.gap * (TOOLS.length - 1)) / TOOLS.length;
  return { x: SIDEBAR.x, y: SIDEBAR.y + SIDEBAR.pad + i * (ih + SIDEBAR.gap), w: SIDEBAR.w, h: ih };
}
function ptInRect(x, y, r) { return x >= r.x && y >= r.y && x <= r.x + r.w && y <= r.y + r.h; }
function withAlpha(c, a) {
  if (c.startsWith("rgba(")) { const p = c.slice(5, -1).split(","); return `rgba(${p[0]},${p[1]},${p[2]},${a})`; }
  return `rgba(255,255,255,${a})`;
}
function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
