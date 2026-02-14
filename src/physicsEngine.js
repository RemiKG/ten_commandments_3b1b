import { BALLOON_CONFIG, BASE_PHYSICS, createMazeSegments, LAYOUT } from "./config.js";
import { clamp, closestPointOnSegment, dot, length, normalize, valueNoise2D } from "./math.js";

const TOOL_RADIUS = LAYOUT.lensRadius * 1.45;

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
      temperature: 0,
    };

    this.trail = [];
    this.disabledWalls = new Map();
    this.tunnelPreview = null;

    this.pressureCooldown = 0;
    this.vacuumCooldown = 0;
  }

  update(dt, control = {}, particles = null) {
    const step = clamp(dt, 1 / 180, 1 / 25);
    this.time += step;

    this._updateDisabledWalls(step);
    this._decayToolCooldowns(step);
    this._resetDynamicBalloonState(step);

    if (control.applying) {
      this._applyToolEffect(control, step, particles);
    } else {
      this.tunnelPreview = null;
    }

    this._integrate(step);
    this._resolveWallCollisions();
    this._updateTrail(step);
  }

  _resetDynamicBalloonState(dt) {
    const b = this.balloon;

    b.targetRadius = BALLOON_CONFIG.baseRadius;
    b.density = 1;
    b.localDamping = 0;
    b.elasticity = BASE_PHYSICS.elasticity;

    b.temperature *= Math.exp(-dt * 1.35);
    b.tunnelGhost = Math.max(0, b.tunnelGhost - dt * 2.2);
  }

  _decayToolCooldowns(dt) {
    this.pressureCooldown = Math.max(0, this.pressureCooldown - dt);
    this.vacuumCooldown = Math.max(0, this.vacuumCooldown - dt);
  }

  _applyToolEffect(control, dt, particles) {
    const { activeTool, pointerX, pointerY, pointerPressed } = control;
    const b = this.balloon;

    switch (activeTool) {
      case "heat": {
        b.targetRadius = clamp(BALLOON_CONFIG.baseRadius * 1.24, BALLOON_CONFIG.minRadius, BALLOON_CONFIG.maxRadius);
        b.temperature = clamp(b.temperature + dt * 2.8, -1, 1);
        this._applyCursorRadialForce(pointerX, pointerY, dt, {
          inward: false,
          strength: 470,
          power: 1.2,
        });
        break;
      }
      case "cold": {
        b.targetRadius = clamp(BALLOON_CONFIG.baseRadius * 0.68, BALLOON_CONFIG.minRadius, BALLOON_CONFIG.maxRadius);
        b.density = 1.62;
        b.localDamping += 0.48;
        b.temperature = clamp(b.temperature - dt * 2.9, -1, 1);
        break;
      }
      case "mass": {
        this._applyMassField(pointerX, pointerY, dt, true);
        break;
      }
      case "darkEnergy": {
        this._applyMassField(pointerX, pointerY, dt, false);
        break;
      }
      case "highPressure": {
        this._applyCursorRadialForce(pointerX, pointerY, dt, {
          inward: false,
          strength: 950,
          power: 0.8,
        });

        if (pointerPressed || this.pressureCooldown <= 0) {
          this._applyImpulsePulse(pointerX, pointerY, false, 620);
          particles?.spawnPressureBurst(pointerX, pointerY, 1);
          this.pressureCooldown = 0.062;
        }
        break;
      }
      case "vacuum": {
        this._applyCursorRadialForce(pointerX, pointerY, dt, {
          inward: true,
          strength: 840,
          power: 0.8,
        });

        if (pointerPressed || this.vacuumCooldown <= 0) {
          this._applyImpulsePulse(pointerX, pointerY, true, 650);
          particles?.spawnVacuumSink(pointerX, pointerY, 1);
          this.vacuumCooldown = 0.053;
        }
        break;
      }
      case "tunneling": {
        b.localDamping += 2.15;

        const target = this._findNearestWall(pointerX, pointerY, 22);
        this.tunnelPreview = target;

        if (target) {
          this.disableWall(target.wall.id, 0.2);
        }

        if (this._isBalloonNearDisabledWall()) {
          b.tunnelGhost = 1;
          b.localDamping += 1.2;
        }
        break;
      }
      case "viscosity": {
        b.localDamping += 5.1;
        b.vx *= Math.exp(-dt * 4.6);
        b.vy *= Math.exp(-dt * 4.6);
        break;
      }
      case "elasticity": {
        b.elasticity = 1.04;
        b.density = 0.96;
        break;
      }
      case "entropy": {
        const n1 = valueNoise2D(this.time * 3.8, b.x * 0.012) - 0.5;
        const n2 = valueNoise2D(b.y * 0.011, this.time * 3.4) - 0.5;
        b.vx += n1 * 430 * dt;
        b.vy += n2 * 430 * dt;
        break;
      }
      default:
        break;
    }
  }

  _applyMassField(px, py, dt, attract) {
    const b = this.balloon;
    const dx = px - b.x;
    const dy = py - b.y;
    const dist = Math.hypot(dx, dy) || 1;
    const distSq = dist * dist;

    const direction = attract ? 1 : -1;
    const strength = (98000 / (distSq + 18000)) * direction;

    b.vx += (dx / dist) * strength * dt;
    b.vy += (dy / dist) * strength * dt;
  }

  _applyCursorRadialForce(px, py, dt, options) {
    const b = this.balloon;
    const dx = b.x - px;
    const dy = b.y - py;
    const dist = Math.hypot(dx, dy) || 1;

    const influence = clamp(1 - dist / TOOL_RADIUS, 0, 1);
    if (influence <= 0) {
      return;
    }

    const direction = options.inward ? -1 : 1;
    const nx = (dx / dist) * direction;
    const ny = (dy / dist) * direction;
    const force = options.strength * Math.pow(influence, options.power ?? 1);

    b.vx += nx * force * dt;
    b.vy += ny * force * dt;
  }

  _applyImpulsePulse(px, py, inward, magnitude) {
    const b = this.balloon;
    const dx = b.x - px;
    const dy = b.y - py;
    const dist = Math.hypot(dx, dy) || 1;

    const influence = clamp(1 - dist / (TOOL_RADIUS * 1.1), 0, 1);
    if (influence <= 0) {
      return;
    }

    const direction = inward ? -1 : 1;
    const nx = (dx / dist) * direction;
    const ny = (dy / dist) * direction;
    const impulse = magnitude * Math.pow(influence, 0.72);

    b.vx += nx * impulse;
    b.vy += ny * impulse;
  }

  _findNearestWall(px, py, maxDistance) {
    let best = null;

    for (const wall of this.walls) {
      if (wall.isFrame) {
        continue;
      }

      const cp = closestPointOnSegment(px, py, wall.a.x, wall.a.y, wall.b.x, wall.b.y);
      const dist = Math.hypot(px - cp.x, py - cp.y);
      if (dist > maxDistance) {
        continue;
      }

      if (!best || dist < best.distance) {
        best = {
          wall,
          point: cp,
          distance: dist,
        };
      }
    }

    return best;
  }

  _isBalloonNearDisabledWall() {
    const b = this.balloon;

    for (const wallId of this.disabledWalls.keys()) {
      const wall = this.walls.find((item) => item.id === wallId);
      if (!wall) {
        continue;
      }

      const cp = closestPointOnSegment(b.x, b.y, wall.a.x, wall.a.y, wall.b.x, wall.b.y);
      const dist = Math.hypot(b.x - cp.x, b.y - cp.y);
      if (dist < b.radius + 10) {
        return true;
      }
    }

    return false;
  }

  _integrate(dt) {
    const b = this.balloon;

    b.radius += (b.targetRadius - b.radius) * Math.min(dt * 6.4, 1);

    b.vy += BASE_PHYSICS.gravity * b.density * dt;

    const damping = Math.exp(-(BASE_PHYSICS.globalDamping + Math.max(0, b.localDamping)) * dt);
    b.vx *= damping;
    b.vy *= damping;

    const speed = length(b.vx, b.vy);
    if (speed > BASE_PHYSICS.maxSpeed) {
      const factor = BASE_PHYSICS.maxSpeed / speed;
      b.vx *= factor;
      b.vy *= factor;
    }

    b.x += b.vx * dt;
    b.y += b.vy * dt;
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
          const friction = wall.isFrame ? 0.995 : 0.992;
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

    if (!head || length(head.x - b.x, head.y - b.y) > 2.2) {
      this.trail.push({
        x: b.x,
        y: b.y,
        life: 1,
      });
    }

    for (const node of this.trail) {
      node.life -= dt * 0.56;
    }

    this.trail = this.trail.filter((node) => node.life > 0);

    if (this.trail.length > BALLOON_CONFIG.trailMaxPoints) {
      this.trail.splice(0, this.trail.length - BALLOON_CONFIG.trailMaxPoints);
    }
  }
}
