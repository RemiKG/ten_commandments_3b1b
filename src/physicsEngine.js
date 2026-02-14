import { BASE_CONFIG, WORLD_HEIGHT, WORLD_WIDTH } from "./config.js";
import { clamp } from "./math.js";

export class PhysicsEngine {
  constructor() {
    this.balloon = {
      x: WORLD_WIDTH * 0.45,
      y: WORLD_HEIGHT * 0.55,
      vx: 120,
      vy: -40,
      radius: 34,
    };
  }

  update(dt) {
    const b = this.balloon;
    b.vy += BASE_CONFIG.gravity * 22 * dt;
    b.vx *= 1 - BASE_CONFIG.drag * dt * 60;
    b.vy *= 1 - BASE_CONFIG.drag * dt * 60;
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    if (b.x - b.radius < 0 || b.x + b.radius > WORLD_WIDTH) {
      b.vx *= -BASE_CONFIG.bounce;
      b.x = clamp(b.x, b.radius, WORLD_WIDTH - b.radius);
    }

    if (b.y - b.radius < 0 || b.y + b.radius > WORLD_HEIGHT) {
      b.vy *= -BASE_CONFIG.bounce;
      b.y = clamp(b.y, b.radius, WORLD_HEIGHT - b.radius);
    }
  }
}
