import { BOARD_RECT } from "../src/config.js";
import { RAINBOW, TRAIL_COLORS, getLevelDefinitions } from "../src/levels.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const levels = getLevelDefinitions();
assert(levels.length === 7, `Expected 7 levels, found ${levels.length}`);

levels.forEach((level, index) => {
  assert(level.id === index + 1, `Level id mismatch at index ${index}`);
  assert(level.rodColor === RAINBOW[index], `Rod color mismatch for level ${level.id}`);
  assert(level.trailColor === TRAIL_COLORS[index], `Trail color mismatch for level ${level.id}`);
  assert(Array.isArray(level.walls) && level.walls.length >= 6, `Level ${level.id} has too few walls`);
  assert(level.spawn && Number.isFinite(level.spawn.x) && Number.isFinite(level.spawn.y), `Invalid spawn on level ${level.id}`);
  assert(level.goal && Number.isFinite(level.goal.x) && Number.isFinite(level.goal.y), `Invalid goal on level ${level.id}`);
});

const l1 = levels[0];
assert(l1.spawn.x < BOARD_RECT.x + BOARD_RECT.w * 0.4, "Level 1 spawn must be upper-left leaning");
assert(l1.spawn.y < BOARD_RECT.y + BOARD_RECT.h * 0.45, "Level 1 spawn must be upper-left leaning");
assert(l1.goal.x > BOARD_RECT.x + BOARD_RECT.w * 0.68, "Level 1 goal must be upper-right pocket");
assert(l1.goal.y < BOARD_RECT.y + BOARD_RECT.h * 0.4, "Level 1 goal must be upper-right pocket");

const tunnelLevels = [levels[5], levels[6]];
tunnelLevels.forEach((level) => {
  assert(level.walls.some((w) => w.id.includes("tunnel")), `Level ${level.id} must include a tunnel wall segment`);
});

console.log("verify-levels: PASS (7 levels, rainbow progression, tunnel levels, and level-1 layout vibe checks)");
