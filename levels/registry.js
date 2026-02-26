// ============================================================
// LEVEL REGISTRY — placement data for each level
// ============================================================
// Each entry defines:
//   catSpawn:  { x, y }   — where the cat starts (relative to BOARD)
//   catVel:    { vx, vy } — initial velocity
//   goalRod:   { x, y, h } — neon stick position (absolute canvas coords)
//   rodColor:  from ROD_COLORS (auto by level index)
//   trailColor: from TRAIL_COLORS (auto by level index)

const LEVEL_PLACEMENTS = {
  1: {
    // T-shaped wall demo — cat starts left of the T, rod starts right of the T
    catSpawn:  { x: BOARD.x + 11 * 40, y: BOARD.y + 10 * 40 },
    catVel:    { vx: 30, vy: 20 },
    goalRod:   { x: BOARD.x + 20 * 40, y: BOARD.y + 10 * 40, h: 60 },
    toolCounts: { heat: 1, cold: 1, mass: 1, highPressure: 1, vacuum: 1, tunneling: 1 },
  },
  2: {
    // Cat spawns INSIDE the nested box (trapped) — use heat to expand and escape
    catSpawn:  { x: BOARD.x + 22 * 40, y: BOARD.y + 11 * 40 },
    catVel:    { vx: 20, vy: -15 },
    goalRod:   { x: BOARD.x + BOARD.w * 0.08, y: BOARD.y + BOARD.h * 0.08, h: 60 },
    toolCounts: { heat: 2, cold: 3, mass: 1, highPressure: 1, vacuum: 1, tunneling: 5 },
  },
  3: {
    // Spiral maze — cat starts in center, rod just outside spiral opening
    catSpawn:  { x: BOARD.x + 15 * 40, y: BOARD.y + 11 * 40 },
    catVel:    { vx: 20, vy: -15 },
    goalRod:   { x: BOARD.x + 27 * 40, y: BOARD.y + 2 * 40, h: 60 },
    toolCounts: { heat: 1, cold: 1, mass: 3, highPressure: 2, vacuum: 1, tunneling: 4 },
  },
  4: {
    // Dead-end pockets — pressure pushes to escape
    catSpawn:  { x: BOARD.x + 4 * 40, y: BOARD.y + 10 * 40 },
    catVel:    { vx: 50, vy: -20 },
    goalRod:   { x: BOARD.x + BOARD.w * 0.88, y: BOARD.y + BOARD.h * 0.5, h: 60 },
    toolCounts: { heat: 1, cold: 1, mass: 1, highPressure: 4, vacuum: 1, tunneling: 0 },
  },
  5: {
    // Offset chambers — vacuum pulls across gaps
    catSpawn:  { x: BOARD.x + BOARD.w * 0.82, y: BOARD.y + BOARD.h * 0.1 },
    catVel:    { vx: -40, vy: 30 },
    goalRod:   { x: BOARD.x + BOARD.w * 0.12, y: BOARD.y + BOARD.h * 0.88, h: 60 },
    toolCounts: { heat: 1, cold: 1, mass: 1, highPressure: 1, vacuum: 4, tunneling: 0 },
  },
  6: {
    // Concentric walls — must tunnel through
    catSpawn:  { x: BOARD.x + 14 * 40, y: BOARD.y + 9 * 40 },
    catVel:    { vx: -20, vy: -20 },
    goalRod:   { x: BOARD.x + BOARD.w * 0.92, y: BOARD.y + BOARD.h * 0.06, h: 60 },
    toolCounts: { heat: 1, cold: 1, mass: 1, highPressure: 1, vacuum: 1, tunneling: 3 },
  },
  7: {
    // Multi-room maze — combine all tools
    catSpawn:  { x: BOARD.x + 3 * 40, y: BOARD.y + 3 * 40 },
    catVel:    { vx: 45, vy: 45 },
    goalRod:   { x: BOARD.x + BOARD.w * 0.88, y: BOARD.y + BOARD.h * 0.88, h: 60 },
    toolCounts: { heat: 2, cold: 2, mass: 2, highPressure: 2, vacuum: 2, tunneling: 2 },
  },
};

function getLevelPlacement(n) {
  return LEVEL_PLACEMENTS[n] || LEVEL_PLACEMENTS[1];
}
