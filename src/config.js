export const CANVAS_WIDTH = 1408;
export const CANVAS_HEIGHT = 768;

export const SIDEBAR_WIDTH = 108;
export const TITLE_HEIGHT = 52;

export const BOARD_RECT = {
  x: 258,
  y: 56,
  w: 890,
  h: 656,
};

export const COLORS = {
  bgNormal: "#070510",
  bgHacker: "#050505",
  wallStroke: "rgba(255,255,255,0.95)",
  text: "#ececf6",
};

export const MODES = {
  NORMAL: "normal",
  HACKER: "hacker",
};

export const MODE_TOGGLE_RECT = {
  x: 1188,
  y: 14,
  w: 198,
  h: 30,
};

export const TOOL_IDS = ["heat", "cold", "mass", "highPressure", "vacuum", "tunneling"];

export const TOOL_META = {
  heat: { id: "heat", label: "Heat", shortLabel: "\u0394T+", equation: "\u0394L = \u03b1L\u2080\u0394T", accent: "#ff8b3e" },
  cold: { id: "cold", label: "Cold", shortLabel: "\u0394T-", equation: "\u0394T < 0", accent: "#98d9ff" },
  mass: { id: "mass", label: "Mass", shortLabel: "M", equation: "F = Gm\u2081m\u2082/r\u00b2", accent: "#5be7ff" },
  highPressure: { id: "highPressure", label: "High P", shortLabel: "P+", equation: "\u0394P = F/A", accent: "#f7f7f7" },
  vacuum: { id: "vacuum", label: "Vacuum", shortLabel: "P-", equation: "\u2207\u00b7v < 0", accent: "#ffffff" },
  tunneling: { id: "tunneling", label: "Tunnel", shortLabel: "\u03a8", equation: "P \u221d e^(-2\u03baL)", accent: "#cd4cff" },
};

export const SIDEBAR_LAYOUT = {
  x: 12,
  y: 56,
  w: 76,
  itemH: 63,
  gap: 0,
  innerPad: 6,
};

export const CAT = {
  baseRadius: 22,
  maxSpeed: 330,
  accel: 800,
  drag: 0.9,
};

export const HACKER_LENS_RADIUS = 152;
