import { LAYOUT } from "../src/config.js";
import { PhysicsEngine } from "../src/physicsEngine.js";
import { closestPointOnSegment } from "../src/math.js";

const engine = new PhysicsEngine();
const dt = 1 / 60;

for (let i = 0; i < 2400; i += 1) {
  engine.update(dt);

  const b = engine.balloon;

  if (!Number.isFinite(b.x) || !Number.isFinite(b.y) || !Number.isFinite(b.vx) || !Number.isFinite(b.vy)) {
    throw new Error(`non-finite state at step ${i}`);
  }

  const left = LAYOUT.board.x + b.radius - 0.01;
  const right = LAYOUT.board.x + LAYOUT.board.width - b.radius + 0.01;
  const top = LAYOUT.board.y + b.radius - 0.01;
  const bottom = LAYOUT.board.y + LAYOUT.board.height - b.radius + 0.01;

  if (b.x < left || b.x > right || b.y < top || b.y > bottom) {
    throw new Error(`balloon escaped board at step ${i}`);
  }

  for (const wall of engine.walls) {
    if (wall.isFrame || engine.disabledWalls.has(wall.id)) {
      continue;
    }
    const cp = closestPointOnSegment(b.x, b.y, wall.a.x, wall.a.y, wall.b.x, wall.b.y);
    const dx = b.x - cp.x;
    const dy = b.y - cp.y;
    const dist = Math.hypot(dx, dy);
    if (dist < b.radius - 0.8) {
      throw new Error(`wall penetration on ${wall.id} at step ${i}`);
    }
  }
}

console.log("physics-smoke: ok");
