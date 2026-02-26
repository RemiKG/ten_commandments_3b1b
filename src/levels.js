import { BOARD_RECT } from "./config.js";

function wall(id, x, y, w, h) {
  return { id, x, y, w, h, tunnelUntilMs: 0 };
}

export const RAINBOW = ["#ff3b3b", "#ff9b32", "#ffe054", "#48f06a", "#52a8ff", "#5d6bff", "#bf55ff"];
export const TRAIL_COLORS = [null, RAINBOW[0], RAINBOW[1], RAINBOW[2], RAINBOW[3], RAINBOW[4], "#8a5bff"];

const BX = BOARD_RECT.x;
const BY = BOARD_RECT.y;

function level1Walls() {
  return [
    wall("l1_v1", BX + 96, BY + 96, 6, 465),
    wall("l1_h1", BX + 96, BY + 96, 250, 6),
    wall("l1_v2", BX + 340, BY + 96, 6, 250),
    wall("l1_v3", BX + 460, BY + 96, 6, 248),
    wall("l1_h2", BX + 340, BY + 340, 230, 6),
    wall("l1_v4", BX + 676, BY + 96, 6, 380),
    wall("l1_v5", BX + 788, BY + 96, 6, 278),
    wall("l1_h3", BX + 676, BY + 374, 112, 6),
  ];
}

function level2Walls() {
  return [
    wall("l2_v1", BX + 112, BY + 82, 8, 480),
    wall("l2_h1", BX + 112, BY + 82, 256, 8),
    wall("l2_v2", BX + 364, BY + 82, 8, 250),
    wall("l2_h2", BX + 232, BY + 322, 140, 8),
    wall("l2_v3", BX + 232, BY + 322, 8, 212),
    wall("l2_v4", BX + 494, BY + 130, 8, 482),
    wall("l2_h3", BX + 494, BY + 130, 224, 8),
    wall("l2_v5", BX + 714, BY + 130, 8, 240),
    wall("l2_h4", BX + 594, BY + 370, 120, 8),
    wall("l2_v6", BX + 594, BY + 370, 8, 218),
    wall("l2_v7", BX + 806, BY + 90, 8, 280),
    wall("l2_h5", BX + 718, BY + 370, 96, 8),
  ];
}

function level3Walls() {
  return [
    wall("l3_v1", BX + 126, BY + 90, 8, 500),
    wall("l3_h1", BX + 126, BY + 90, 255, 8),
    wall("l3_v2", BX + 378, BY + 90, 8, 185),
    wall("l3_block1", BX + 420, BY + 246, 110, 110),
    wall("l3_block2", BX + 605, BY + 170, 120, 90),
    wall("l3_block3", BX + 610, BY + 400, 140, 120),
    wall("l3_v3", BX + 786, BY + 90, 8, 280),
    wall("l3_h2", BX + 698, BY + 370, 96, 8),
  ];
}

function level4Walls() {
  return [
    wall("l4_v1", BX + 104, BY + 90, 8, 500),
    wall("l4_h1", BX + 104, BY + 90, 252, 8),
    wall("l4_v2", BX + 352, BY + 90, 8, 212),
    wall("l4_h2", BX + 228, BY + 302, 132, 8),
    wall("l4_v3", BX + 228, BY + 302, 8, 220),
    wall("l4_h3", BX + 228, BY + 520, 192, 8),
    wall("l4_v4", BX + 420, BY + 220, 8, 308),
    wall("l4_h4", BX + 420, BY + 220, 212, 8),
    wall("l4_v5", BX + 628, BY + 220, 8, 170),
    wall("l4_dead", BX + 676, BY + 314, 126, 8),
    wall("l4_v6", BX + 802, BY + 90, 8, 316),
  ];
}

function level5Walls() {
  return [
    wall("l5_v1", BX + 108, BY + 88, 8, 500),
    wall("l5_h1", BX + 108, BY + 88, 254, 8),
    wall("l5_v2", BX + 358, BY + 88, 8, 190),
    wall("l5_h2", BX + 250, BY + 278, 116, 8),
    wall("l5_v3", BX + 250, BY + 278, 8, 250),
    wall("l5_h3", BX + 250, BY + 528, 250, 8),
    wall("l5_v4", BX + 498, BY + 226, 8, 310),
    wall("l5_h4", BX + 498, BY + 226, 205, 8),
    wall("l5_v5", BX + 698, BY + 226, 8, 135),
    wall("l5_h5", BX + 620, BY + 361, 84, 8),
    wall("l5_v6", BX + 620, BY + 361, 8, 206),
    wall("l5_v7", BX + 812, BY + 95, 8, 275),
    wall("l5_h6", BX + 706, BY + 370, 114, 8),
  ];
}

function level6Walls() {
  return [
    wall("l6_v1", BX + 110, BY + 88, 8, 500),
    wall("l6_h1", BX + 110, BY + 88, 250, 8),
    wall("l6_v2", BX + 356, BY + 88, 8, 250),
    wall("l6_h2", BX + 240, BY + 338, 124, 8),
    wall("l6_v3", BX + 240, BY + 338, 8, 220),
    wall("l6_h3", BX + 240, BY + 558, 212, 8),
    wall("l6_v4", BX + 448, BY + 190, 8, 376),
    wall("l6_h4", BX + 448, BY + 190, 260, 8),
    wall("l6_v5", BX + 704, BY + 190, 8, 202),
    wall("l6_tunnel", BX + 604, BY + 300, 8, 210),
    wall("l6_v6", BX + 812, BY + 92, 8, 280),
    wall("l6_h5", BX + 706, BY + 372, 114, 8),
  ];
}

function level7Walls() {
  return [
    wall("l7_v1", BX + 98, BY + 82, 8, 522),
    wall("l7_h1", BX + 98, BY + 82, 264, 8),
    wall("l7_v2", BX + 358, BY + 82, 8, 190),
    wall("l7_h2", BX + 246, BY + 272, 120, 8),
    wall("l7_v3", BX + 246, BY + 272, 8, 170),
    wall("l7_h3", BX + 246, BY + 442, 178, 8),
    wall("l7_v4", BX + 420, BY + 160, 8, 290),
    wall("l7_h4", BX + 420, BY + 160, 240, 8),
    wall("l7_v5", BX + 656, BY + 160, 8, 200),
    wall("l7_h5", BX + 552, BY + 360, 112, 8),
    wall("l7_v6", BX + 552, BY + 360, 8, 208),
    wall("l7_h6", BX + 552, BY + 568, 186, 8),
    wall("l7_v7", BX + 734, BY + 260, 8, 316),
    wall("l7_tunnel", BX + 708, BY + 108, 8, 148),
    wall("l7_v8", BX + 820, BY + 82, 8, 290),
    wall("l7_h7", BX + 708, BY + 372, 120, 8),
  ];
}

export function getLevelDefinitions() {
  return [
    {
      id: 1,
      name: "Level 1 - Red Rod",
      spawn: { x: BX + 165, y: BY + 195 },
      goal: { x: BX + 760, y: BY + 126, w: 16, h: 46 },
      rodColor: RAINBOW[0],
      trailColor: TRAIL_COLORS[0],
      walls: level1Walls(),
      hint: "Use Heat to arc into the upper-right pocket.",
    },
    {
      id: 2,
      name: "Level 2 - Orange Rod",
      spawn: { x: BX + 162, y: BY + 182 },
      goal: { x: BX + 778, y: BY + 122, w: 16, h: 46 },
      rodColor: RAINBOW[1],
      trailColor: TRAIL_COLORS[1],
      walls: level2Walls(),
      hint: "Use Cold in tight turns to slip through narrow corridors.",
    },
    {
      id: 3,
      name: "Level 3 - Yellow Rod",
      spawn: { x: BX + 160, y: BY + 520 },
      goal: { x: BX + 780, y: BY + 116, w: 16, h: 46 },
      rodColor: RAINBOW[2],
      trailColor: TRAIL_COLORS[2],
      walls: level3Walls(),
      hint: "Mass is weak but steady. Drop it outside to bend trajectory.",
    },
    {
      id: 4,
      name: "Level 4 - Green Rod",
      spawn: { x: BX + 160, y: BY + 514 },
      goal: { x: BX + 782, y: BY + 112, w: 16, h: 46 },
      rodColor: RAINBOW[3],
      trailColor: TRAIL_COLORS[3],
      walls: level4Walls(),
      hint: "High Pressure helps recover from dead-end momentum traps.",
    },
    {
      id: 5,
      name: "Level 5 - Blue Rod",
      spawn: { x: BX + 160, y: BY + 518 },
      goal: { x: BX + 784, y: BY + 114, w: 16, h: 46 },
      rodColor: RAINBOW[4],
      trailColor: TRAIL_COLORS[4],
      walls: level5Walls(),
      hint: "Vacuum pull aligns entries across offset chambers.",
    },
    {
      id: 6,
      name: "Level 6 - Indigo Rod",
      spawn: { x: BX + 164, y: BY + 522 },
      goal: { x: BX + 784, y: BY + 114, w: 16, h: 46 },
      rodColor: RAINBOW[5],
      trailColor: TRAIL_COLORS[5],
      walls: level6Walls(),
      hint: "Tunnel through the marked barrier, then control drag on exit.",
    },
    {
      id: 7,
      name: "Level 7 - Violet Rod",
      spawn: { x: BX + 160, y: BY + 524 },
      goal: { x: BX + 786, y: BY + 110, w: 16, h: 46 },
      rodColor: RAINBOW[6],
      trailColor: TRAIL_COLORS[6],
      walls: level7Walls(),
      hint: "Chain all tools cleanly. Lens mode can hide overlays when needed.",
    },
  ];
}
