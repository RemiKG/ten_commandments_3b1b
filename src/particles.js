import { randomRange } from "./math.js";

export class ParticleSystem {
  constructor() {
    this.items = [];
  }

  spawnBurst({ x, y, count, speedMin, speedMax, lifeMin, lifeMax, inward = false, color = "rgba(255,255,255,0.9)" }) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = randomRange(speedMin, speedMax);
      const sign = inward ? -1 : 1;
      this.items.push({
        x,
        y,
        vx: Math.cos(angle) * speed * sign,
        vy: Math.sin(angle) * speed * sign,
        life: randomRange(lifeMin, lifeMax),
        age: 0,
        color,
      });
    }
  }

  update(dt) {
    for (const particle of this.items) {
      particle.age += dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 0.99;
      particle.vy *= 0.99;
    }

    this.items = this.items.filter((particle) => particle.age < particle.life);
  }
}
