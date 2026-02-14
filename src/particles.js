import { randomRange } from "./math.js";

export class ParticleSystem {
  constructor() {
    this.items = [];
  }

  spawnPressureBurst(x, y, strength = 1) {
    const count = Math.floor(32 * strength);
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = randomRange(260, 680) * strength;
      this.items.push({
        kind: "pressure",
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        age: 0,
        life: randomRange(0.25, 0.62),
        size: randomRange(0.8, 2.2),
        alpha: randomRange(0.48, 0.95),
      });
    }
  }

  spawnVacuumSink(x, y, strength = 1) {
    const count = Math.floor(46 * strength);
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = randomRange(85, 350);
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;

      const inwardAngle = Math.atan2(y - py, x - px);
      const speed = randomRange(240, 760) * strength;

      this.items.push({
        kind: "vacuum",
        x: px,
        y: py,
        vx: Math.cos(inwardAngle) * speed,
        vy: Math.sin(inwardAngle) * speed,
        tx: x,
        ty: y,
        age: 0,
        life: randomRange(0.3, 0.74),
        size: randomRange(0.9, 2.4),
        alpha: randomRange(0.55, 1),
      });
    }
  }

  update(dt) {
    for (const particle of this.items) {
      particle.age += dt;

      if (particle.kind === "vacuum") {
        const dx = particle.tx - particle.x;
        const dy = particle.ty - particle.y;
        const dist = Math.hypot(dx, dy) || 1;
        const accel = 640 / (dist * 0.25 + 40);
        particle.vx += (dx / dist) * accel;
        particle.vy += (dy / dist) * accel;
      }

      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 0.984;
      particle.vy *= 0.984;
    }

    this.items = this.items.filter((particle) => particle.age < particle.life);
  }
}
