// ============================================================
// LEVEL DEFINITIONS
// ============================================================
//
// Use this file to design levels in ASCII style.
//
// Legend (default in this file):
//   "/" = border cell (frame collision)
//   "A" = normal wall
//   "S" = special wall (solid gate)
//   "T" = special wall (tunnel-friendly rail)
//   " " = empty space
//
// Pattern example:
// //////////////////////////////////////////////////////////
// /A                                                      /
// /A                 AAAAAAAAAAAAA                        /
// /A                                                      /
// //////////////////////////////////////////////////////////
//
// Notes:
// - Keep rows aligned for readability.
// - Duplicate an existing defineLevel(...) block to create new levels.
// - parseAsciiMap(...) removes indentation so you can keep code neat.
// ============================================================

const LEVEL_GRID = {
  origin: [BOARD.x, BOARD.y],
  cell: 40
};

const BASE_ASCII_LEGEND = {
  "/": { props: { isFrame: true, canTunnel: false, width: DEFAULT_WALL_WIDTH, friction: 0.995 } },
  "A": { props: { width: DEFAULT_WALL_WIDTH } },
  "S": {
    kind: "special",
    props: { width: 22, canTunnel: false, color: "#ffd67a", dash: [10, 6], meta: { kind: "gate" } }
  },
  "T": {
    kind: "special",
    props: {
      width: 18,
      canTunnel: true,
      friction: 0.99,
      elasticity: 1.02,
      color: "#fff1a0",
      dash: [6, 4],
      meta: { kind: "rail" }
    }
  }
};

function legendWith(overrides = {}) {
  return { ...BASE_ASCII_LEGEND, ...overrides };
}

// Individual levels are loaded from levels/*.js
// setLevel is called from game.js after all level scripts are loaded.
