import { BALLOON_CONFIG, BASE_PHYSICS, createMazeSegments, LAYOUT } from "./config.js";
import { clamp, closestPointOnSegment, dot, length, normalize } from "./math.js";

export class PhysicsEngine {
  constructor() {
    this.walls = createMazeSegments();
    this.time = 0;

    this.balloon = {
      x: LAYOUT.board.x + LAYOUT.board.width * 0.5,
      y: LAYOUT.board.y + LAYOUT.board.height * 0.52,
      vx: -48,
      vy: -34,
      radius: BALLOON_CONFIG.baseRadius,
      targetRadius: BALLOON_CONFIG.baseRadius,
      density: 1,
      localDamping: 0,
      elasticity: BASE_PHYSICS.elasticity,
      tunnelGhost: 0,
    };

    this.trail = [];
    this.disabledWalls = new Map();
  }

  update(dt) {
    const step = clamp(dt, 1 / 180, 1 / 25);
    const b = this.balloon;

    this.time += step;
    this._updateDisabledWalls(step);

    b.radius += (b.targetRadius - b.radius) * Math.min(step * 6, 1);

    b.vy += BASE_PHYSICS.gravity * b.density * step;

    const damping = Math.exp(-(BASE_PHYSICS.globalDamping + b.localDamping) * step);
    b.vx *= damping;
    b.vy *= damping;

    const speed = length(b.vx, b.vy);
    if (speed > BASE_PHYSICS.maxSpeed) {
      const factor = BASE_PHYSICS.maxSpeed / speed;
      b.vx *= factor;
      b.vy *= factor;
    }

    b.x += b.vx * step;
    b.y += b.vy * step;

    this._resolveWallCollisions();
    this._updateTrail(step);
  }

  _updateDisabledWalls(dt) {
    for (const [wallId, ttl] of this.disabledWalls.entries()) {
      const next = ttl - dt;
      if (next <= 0) {
        this.disabledWalls.delete(wallId);
      } else {
        this.disabledWalls.set(wallId, next);
      }
    }
  }

  disableWall(wallId, seconds) {
    if (!wallId) {
      return;
    }
    this.disabledWalls.set(wallId, Math.max(this.disabledWalls.get(wallId) || 0, seconds));
  }

  _resolveWallCollisions() {
    const b = this.balloon;

    for (let iteration = 0; iteration < 4; iteration += 1) {
      let hadCollision = false;

      for (const wall of this.walls) {
        if (this.disabledWalls.has(wall.id)) {
          continue;
        }

        const hit = closestPointOnSegment(b.x, b.y, wall.a.x, wall.a.y, wall.b.x, wall.b.y);
        let dx = b.x - hit.x;
        let dy = b.y - hit.y;
        let dist = Math.hypot(dx, dy);

        if (dist >= b.radius) {
          continue;
        }

        hadCollision = true;

        let nx;
        let ny;

        if (dist > 0.0001) {
          nx = dx / dist;
          ny = dy / dist;
        } else {
          const tangent = normalize(wall.b.x - wall.a.x, wall.b.y - wall.a.y);
          nx = -tangent.y;
          ny = tangent.x;
          const side = dot(b.x - wall.a.x, b.y - wall.a.y, nx, ny);
          if (side < 0) {
            nx *= -1;
            ny *= -1;
          }
          dist = 0;
        }

        const penetration = b.radius - dist;
        b.x += nx * penetration;
        b.y += ny * penetration;

        const normalVelocity = dot(b.vx, b.vy, nx, ny);
        if (normalVelocity < 0) {
          b.vx -= (1 + b.elasticity) * normalVelocity * nx;
          b.vy -= (1 + b.elasticity) * normalVelocity * ny;

          const tx = -ny;
          const ty = nx;
          const tangentVelocity = dot(b.vx, b.vy, tx, ty);
          const friction = wall.isFrame ? 0.995 : 0.99;
          b.vx -= tangentVelocity * (1 - friction) * tx;
          b.vy -= tangentVelocity * (1 - friction) * ty;
        }
      }

      if (!hadCollision) {
        break;
      }
    }
  }

  _updateTrail(dt) {
    const b = this.balloon;
    const head = this.trail[this.trail.length - 1];

    if (!head || length(head.x - b.x, head.y - b.y) > 2.25) {
      this.trail.push({
        x: b.x,
        y: b.y,
        life: 1,
      });
    }

    for (const node of this.trail) {
      node.life -= dt * 0.54;
    }

    this.trail = this.trail.filter((node) => node.life > 0);

    if (this.trail.length > BALLOON_CONFIG.trailMaxPoints) {
      this.trail.splice(0, this.trail.length - BALLOON_CONFIG.trailMaxPoints);
    }
  }
}
