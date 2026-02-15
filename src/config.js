import { ASSET_V2 } from "./assetsV2.js";

export const WORLD_WIDTH = 1600;
export const WORLD_HEIGHT = 900;

export const VISUAL_MODES = {
  normal: "normal",
  hacker: "hacker",
};

export const COLORS = {
  hackerBackground: "#050505",
  lineWhite: "#f5f5f5",
  neonPink: "#ff49d2",
  neonPurple: "#7f38ff",
  neonBlue: "#66e3ff",
  neonOrange: "#ff8a3a",
  neonIce: "#8fd7ff",
};

export const LAYOUT = {
  title: {
    x: WORLD_WIDTH * 0.5,
    y: 38,
  },
  sidebar: {
    x: 12,
    y: 70,
    width: 112,
    height: 760,
    radius: 12,
    itemGap: 8,
    topPad: 10,
  },
  modeToggle: {
    x: 12,
    y: 840,
    width: 224,
    height: 44,
    radius: 10,
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
  gravity: 0,
  globalDamping: 0.12,
  elasticity: 0.85,
  maxSpeed: 980,
};

export const CAT_CONFIG = {
  baseRadius: 34,
  minRadius: 20,
  maxRadius: 56,
  trailMaxPoints: 190,
};

export const TOOLS = [
  {
    id: "heat",
    name: "Heat",
    accent: COLORS.neonOrange,
    durationSec: 2,
    ammo: 5,
    dropRadius: 180,
    iconPath: ASSET_V2.images.toolHeat,
    sfxPath: ASSET_V2.audio.heat,
    title: "Power: Heat",
  },
  {
    id: "cold",
    name: "Cold",
    accent: COLORS.neonIce,
    durationSec: 2,
    ammo: 5,
    dropRadius: 170,
    iconPath: ASSET_V2.images.toolCold,
    sfxPath: ASSET_V2.audio.cold,
    title: "Power: Cold",
  },
  {
    id: "gravity",
    name: "Gravity",
    accent: COLORS.neonBlue,
    durationSec: 7,
    ammo: 4,
    dropRadius: 220,
    iconPath: ASSET_V2.images.toolGravity,
    sfxPath: ASSET_V2.audio.gravity,
    title: "Power: Gravity",
  },
  {
    id: "highPressure",
    name: "High Pressure",
    accent: "#ffffff",
    durationSec: 0.5,
    ammo: 7,
    dropRadius: 190,
    iconPath: ASSET_V2.images.toolHighPressure,
    sfxPath: ASSET_V2.audio.heat,
    title: "Power: High Pressure",
  },
  {
    id: "vacuum",
    name: "Vacuum",
    accent: "#dff2ff",
    durationSec: 0.5,
    ammo: 7,
    dropRadius: 190,
    iconPath: ASSET_V2.images.toolVacuum,
    sfxPath: ASSET_V2.audio.vacuum,
    title: "Power: Vacuum",
  },
  {
    id: "quantumTunneling",
    name: "Quantum Tunneling",
    accent: COLORS.neonPurple,
    durationSec: 2.2,
    ammo: 4,
    dropRadius: 46,
    iconPath: ASSET_V2.images.toolQuantumTunneling,
    sfxPath: ASSET_V2.audio.quantum,
    title: "Power: Quantum Tunneling",
  },
];

export const TOOL_BY_ID = Object.fromEntries(TOOLS.map((tool) => [tool.id, tool]));

export const STAGES = [
  {
    id: 1,
    rodColor: "#ff3945",
    trailColorA: "rgba(255, 80, 110, 0.85)",
    trailColorB: "rgba(255, 172, 210, 0.2)",
  },
  {
    id: 2,
    rodColor: "#ff9238",
    trailColorA: "rgba(255, 170, 80, 0.85)",
    trailColorB: "rgba(255, 220, 165, 0.2)",
  },
  {
    id: 3,
    rodColor: "#ffe142",
    trailColorA: "rgba(255, 230, 90, 0.85)",
    trailColorB: "rgba(255, 250, 180, 0.2)",
  },
  {
    id: 4,
    rodColor: "#4dff74",
    trailColorA: "rgba(120, 255, 150, 0.85)",
    trailColorB: "rgba(205, 255, 215, 0.2)",
  },
  {
    id: 5,
    rodColor: "#45d7ff",
    trailColorA: "rgba(85, 220, 255, 0.85)",
    trailColorB: "rgba(180, 245, 255, 0.2)",
  },
  {
    id: 6,
    rodColor: "#b770ff",
    trailColorA: "rgba(180, 125, 255, 0.85)",
    trailColorB: "rgba(230, 205, 255, 0.2)",
  },
];

let dropCounter = 0;

export function createPowerDrop(toolId, x, y, time = 0) {
  const tool = TOOL_BY_ID[toolId];
  if (!tool) {
    return null;
  }

  dropCounter += 1;
  return {
    id: `${toolId}_${dropCounter}`,
    toolId,
    x,
    y,
    radius: tool.dropRadius,
    duration: tool.durationSec,
    remaining: tool.durationSec,
    createdAt: time,
    pulseCooldown: 0,
    targetWallId: null,
  };
}

export function initialAmmoState() {
  const state = {};
  for (const tool of TOOLS) {
    state[tool.id] = tool.ammo;
  }
  return state;
}

export function maxAmmoTotal() {
  return TOOLS.reduce((sum, tool) => sum + tool.ammo, 0);
}

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
