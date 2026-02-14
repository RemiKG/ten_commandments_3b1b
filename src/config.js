export const WORLD_WIDTH = 1600;
export const WORLD_HEIGHT = 900;

export const COLORS = {
  background: "#050505",
  lineWhite: "#f5f5f5",
  dimWhite: "rgba(255,255,255,0.2)",
  glowWhite: "rgba(255,255,255,0.92)",
  heat: "#ff7a28",
  cold: "#8fd7ff",
  cyan: "#59ecff",
  purple: "#cd4cff",
};

export const LAYOUT = {
  title: {
    x: WORLD_WIDTH * 0.5,
    y: 36,
  },
  sidebar: {
    x: 12,
    y: 70,
    width: 88,
    height: 760,
    radius: 9,
    itemGap: 4,
    topPad: 8,
  },
  board: {
    x: 292,
    y: 66,
    width: 1240,
    height: 760,
  },
  lensRadius: 230,
  crosshairSize: 16,
};

export const BASE_PHYSICS = {
  gravity: 400,
  globalDamping: 0.12,
  elasticity: 0.85,
  maxSpeed: 980,
};

export const BALLOON_CONFIG = {
  baseRadius: 36,
  minRadius: 19,
  maxRadius: 54,
  trailMaxPoints: 190,
};

export const TOOLS = [
  { id: "heat", name: "Heat", glyph: "dT+", accent: "#ff7a28", category: "Thermo" },
  { id: "cold", name: "Cold", glyph: "dT-", accent: "#9fdfff", category: "Thermo" },
  { id: "mass", name: "Mass", glyph: "M", accent: "#59ecff", category: "Relativity" },
  { id: "darkEnergy", name: "Dark Energy", glyph: "L", accent: "#7feaff", category: "Relativity" },
  { id: "highPressure", name: "High Pressure", glyph: "P+", accent: "#f5f5f5", category: "Fluid" },
  { id: "vacuum", name: "Vacuum", glyph: "P-", accent: "#f5f5f5", category: "Fluid" },
  { id: "tunneling", name: "Tunneling", glyph: "Psi", accent: "#cd4cff", category: "Quantum" },
  { id: "viscosity", name: "Viscosity", glyph: "eta", accent: "#f5f5f5", category: "Material" },
  { id: "elasticity", name: "Elasticity", glyph: "k", accent: "#f5f5f5", category: "Material" },
  { id: "entropy", name: "Entropy", glyph: "S", accent: "#f5f5f5", category: "Material" },
];

export const TOOL_BY_ID = Object.fromEntries(TOOLS.map((tool) => [tool.id, tool]));

function point(x, y) {
  return { x, y };
}

export function createMazeSegments(board = LAYOUT.board) {
  const leftX = board.x + 140;
  const topY = board.y + 112;
  const bottomY = board.y + 646;

  const rightOuterX = board.x + board.width - 300;
  const rightInnerX = board.x + board.width - 136;
  const rightMidY = board.y + 392;

  return [
    { id: "frame_top", a: point(board.x, board.y), b: point(board.x + board.width, board.y), isFrame: true },
    {
      id: "frame_right",
      a: point(board.x + board.width, board.y),
      b: point(board.x + board.width, board.y + board.height),
      isFrame: true,
    },
    {
      id: "frame_bottom",
      a: point(board.x + board.width, board.y + board.height),
      b: point(board.x, board.y + board.height),
      isFrame: true,
    },
    { id: "frame_left", a: point(board.x, board.y + board.height), b: point(board.x, board.y), isFrame: true },
    { id: "left_vertical", a: point(leftX, topY), b: point(leftX, bottomY) },
    { id: "left_top", a: point(leftX, topY), b: point(leftX + 166, topY) },
    { id: "left_bottom", a: point(leftX, bottomY), b: point(leftX + 116, bottomY) },
    { id: "right_outer", a: point(rightOuterX, board.y), b: point(rightOuterX, bottomY) },
    { id: "right_top_inner", a: point(rightInnerX, topY), b: point(rightInnerX, rightMidY) },
    { id: "right_mid", a: point(rightOuterX, rightMidY), b: point(rightInnerX, rightMidY) },
    { id: "right_bottom", a: point(rightOuterX, bottomY), b: point(rightInnerX, bottomY) },
  ];
}
