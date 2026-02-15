import { CAT_SPAWN, createMazeSegments, LAYOUT, BASE_PHYSICS, CAT_CONFIG } from "./config.js";
import { clamp, closestPointOnSegment, dot, length, normalize } from "./math.js";
import { ThermoAutomata } from "./thermoAutomata.js";

const BASE_HEFT = 5;

export class PhysicsEngine {
  constructor() {
    this.walls = createMazeSegments();
    this.time = 0;

    this.thermo = new ThermoAutomata(LAYOUT.board, 20);
    this.thermoSample = this.thermo.sample(
      LAYOUT.board.x + LAYOUT.board.width * 0.5,
      LAYOUT.board.y + LAYOUT.board.height * 0.5,
    );

    this.cat = {
      x: CAT_SPAWN.x,
      y: CAT_SPAWN.y,
      vx: -48,
      vy: -34,
      radius: CAT_CONFIG.baseRadius,
      targetRadius: CAT_CONFIG.baseRadius,
      massFactor: BASE_HEFT,
      localDamping: 0,
      elasticity: BASE_PHYSICS.elasticity,
      tunnelGhost: 0,
      temperature: 0,
      pressure: 1,
    };

    this.balloon = this.cat;

    this.trail = [];
    this.disabledWalls = new Map();
    this.tunnelPreview = null;
  }

  update(dt, control = {}, particles = null) {
    const step = clamp(dt, 1 / 180, 1 / 25);
    this.time += step;

    const drops = Array.isArray(control.activeDrops) ? control.activeDrops : [];

    this._updateDisabledWalls(step);
    this._resetDynamicCatState(step);
    this.tunnelPreview = null;

    this.thermo.update(step);

    for (const drop of drops) {
      if (!drop || drop.remaining <= 0) {
        continue;
      }

      const consumeTimer = this._applyDropEffect(drop, step, particles);
      if (consumeTimer) {
        drop.remaining = Math.max(0, drop.remaining - step);
      }
    }

    this.thermoSample = this.thermo.sample(this.cat.x, this.cat.y);
    this._applyThermoResponse(this.thermoSample);

    this._integrate(step);
    this._resolveWallCollisions();
    this._updateTrail(step);
  }

  _resetDynamicCatState(dt) {
    const c = this.cat;
    c.localDamping = 0;
    c.elasticity = BASE_PHYSICS.elasticity;
    c.tunnelGhost = Math.max(0, c.tunnelGhost - dt * 2.2);
  }

  _applyDropEffect(drop, dt, particles) {
    const c = this.cat;

    switch (drop.toolId) {
      case "heat": {
        this.thermo.injectTool("heat", drop.x, drop.y, dt);
        c.targetRadius = clamp(c.targetRadius * 1.02, CAT_CONFIG.minRadius, CAT_CONFIG.maxRadius);
        c.massFactor *= 0.985;
        this._applyRadialForce(drop.x, drop.y, dt, {
          inward: false,
          strength: 1650,
          power: 1.06,
          radius: drop.radius,
        });
        return true;
      }
      case "cold": {
        if (!this._isCatOverDrop(drop, 0.3)) {
          return false;
        }

        this.thermo.injectTool("cold", drop.x, drop.y, dt);
        c.targetRadius = clamp(c.targetRadius * 0.986, CAT_CONFIG.minRadius, CAT_CONFIG.maxRadius);
        c.massFactor *= 1.06;
        c.localDamping += 0.95;
        return true;
      }
      case "gravity": {
        this._applyMassField(drop.x, drop.y, dt, true);
        return true;
      }
      case "highPressure": {
        this.thermo.injectTool("highPressure", drop.x, drop.y, dt);
        this._applyRadialForce(drop.x, drop.y, dt, {
          inward: false,
          strength: 2450,
          power: 0.82,
          radius: drop.radius,
        });

        drop.pulseCooldown = Math.max(0, (drop.pulseCooldown || 0) - dt);
        if (drop.pulseCooldown <= 0) {
          this._applyImpulsePulse(drop.x, drop.y, false, 1700, drop.radius);
          particles?.spawnPressureBurst(drop.x, drop.y, 1);
          drop.pulseCooldown = 0.075;
        }

        return true;
      }
      case "vacuum": {
        this.thermo.injectTool("vacuum", drop.x, drop.y, dt);
        this._applyRadialForce(drop.x, drop.y, dt, {
          inward: true,
          strength: 2380,
          power: 0.82,
          radius: drop.radius,
        });

        drop.pulseCooldown = Math.max(0, (drop.pulseCooldown || 0) - dt);
        if (drop.pulseCooldown <= 0) {
          this._applyImpulsePulse(drop.x, drop.y, true, 1700, drop.radius);
          particles?.spawnVacuumSink(drop.x, drop.y, 1);
          drop.pulseCooldown = 0.07;
        }

        return true;
      }
      case "quantumTunneling": {
        c.localDamping += 0.6;

        if (!drop.targetWallId) {
          const target = this._findNearestWall(drop.x, drop.y, drop.radius || 46);
          this.tunnelPreview = target;
          if (target) {
            drop.targetWallId = target.wall.id;
          }
        }

        if (drop.targetWallId) {
          this.disableWall(drop.targetWallId, 0.2);
          if (this._isCatNearWall(drop.targetWallId, c.radius + 12)) {
            c.tunnelGhost = 1;
            c.localDamping += 0.26;
          }
        }

        return true;
      }
      default:
        return false;
    }
  }

  _applyThermoResponse(sample) {
    if (!sample) {
      return;
    }

    const c = this.cat;
    c.pressure = sample.pressure;
    c.temperature = clamp((sample.temperature - 1) * 1.4, -1.5, 1.5);

    const expansion = clamp(Math.sqrt(sample.temperature / Math.max(0.22, sample.pressure)), 0.68, 1.46);
    const density = clamp(Math.sqrt(sample.pressure / Math.max(0.25, sample.temperature)), 0.55, 3.2);

    c.targetRadius = clamp(c.targetRadius * 0.94 + CAT_CONFIG.baseRadius * expansion * 0.06, CAT_CONFIG.minRadius, CAT_CONFIG.maxRadius);
    c.massFactor = clamp(c.massFactor * 0.9 + BASE_HEFT * density * 0.1, BASE_HEFT * 0.5, BASE_HEFT * 3.4);
  }

  _isCatOverDrop(drop, radiusScale = 1) {
    const c = this.cat;
    const overlapRadius = Math.max(32, (drop.radius || 120) * radiusScale);
    return Math.hypot(c.x - drop.x, c.y - drop.y) <= overlapRadius;
  }

  _applyMassField(px, py, dt, attract) {
    const c = this.cat;
    const dx = px - c.x;
    const dy = py - c.y;
    const dist = Math.hypot(dx, dy) || 1;
    const distSq = dist * dist;

    const direction = attract ? 1 : -1;
    const rawStrength = (43000000 / (distSq + 16000)) * direction;
    const strength = clamp(rawStrength, -2200, 2200);
    const response = 1 / Math.max(0.25, c.massFactor);

    c.vx += (dx / dist) * strength * dt * response;
    c.vy += (dy / dist) * strength * dt * response;
  }

  _applyRadialForce(px, py, dt, options) {
    const c = this.cat;
    const dx = c.x - px;
    const dy = c.y - py;
    const dist = Math.hypot(dx, dy) || 1;

    const radius = options.radius || LAYOUT.lensRadius * 1.45;
    const influence = clamp(1 - dist / radius, 0, 1);
    if (influence <= 0) {
      return;
    }

    const direction = options.inward ? -1 : 1;
    const nx = (dx / dist) * direction;
    const ny = (dy / dist) * direction;
    const force = options.strength * Math.pow(influence, options.power ?? 1);
    const response = 1 / Math.max(0.25, c.massFactor);

    c.vx += nx * force * dt * response;
    c.vy += ny * force * dt * response;
  }

  _applyImpulsePulse(px, py, inward, magnitude, radius = LAYOUT.lensRadius * 1.45) {
    const c = this.cat;
    const dx = c.x - px;
    const dy = c.y - py;
    const dist = Math.hypot(dx, dy) || 1;

    const influence = clamp(1 - dist / (radius * 1.1), 0, 1);
    if (influence <= 0) {
      return;
    }

    const direction = inward ? -1 : 1;
    const nx = (dx / dist) * direction;
    const ny = (dy / dist) * direction;
    const impulse = magnitude * Math.pow(influence, 0.72);
    const response = 1 / Math.max(0.25, c.massFactor);

    c.vx += nx * impulse * response;
    c.vy += ny * impulse * response;
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

  _isCatNearWall(wallId, threshold) {
    if (!wallId) {
      return false;
    }

    const wall = this.walls.find((item) => item.id === wallId);
    if (!wall) {
      return false;
    }

    const c = this.cat;
    const cp = closestPointOnSegment(c.x, c.y, wall.a.x, wall.a.y, wall.b.x, wall.b.y);
    return Math.hypot(c.x - cp.x, c.y - cp.y) < threshold;
  }

  _integrate(dt) {
    const c = this.cat;

    c.radius += (c.targetRadius - c.radius) * Math.min(dt * 6.4, 1);

    const inertialDamping = BASE_PHYSICS.globalDamping / Math.max(1, c.massFactor);
    const damping = Math.exp(-(inertialDamping + Math.max(0, c.localDamping)) * dt);
    c.vx *= damping;
    c.vy *= damping;

    const speed = length(c.vx, c.vy);
    if (speed > BASE_PHYSICS.maxSpeed) {
      const factor = BASE_PHYSICS.maxSpeed / speed;
      c.vx *= factor;
      c.vy *= factor;
    }

    c.x += c.vx * dt;
    c.y += c.vy * dt;
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
    const c = this.cat;

    for (let iteration = 0; iteration < 4; iteration += 1) {
      let hadCollision = false;

      for (const wall of this.walls) {
        if (this.disabledWalls.has(wall.id)) {
          continue;
        }

        const hit = closestPointOnSegment(c.x, c.y, wall.a.x, wall.a.y, wall.b.x, wall.b.y);
        let dx = c.x - hit.x;
        let dy = c.y - hit.y;
        let dist = Math.hypot(dx, dy);

        if (dist >= c.radius) {
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
          const side = dot(c.x - wall.a.x, c.y - wall.a.y, nx, ny);
          if (side < 0) {
            nx *= -1;
            ny *= -1;
          }
          dist = 0;
        }

        const penetration = c.radius - dist;
        c.x += nx * penetration;
        c.y += ny * penetration;

        const normalVelocity = dot(c.vx, c.vy, nx, ny);
        if (normalVelocity < 0) {
          c.vx -= (1 + c.elasticity) * normalVelocity * nx;
          c.vy -= (1 + c.elasticity) * normalVelocity * ny;

          const tx = -ny;
          const ty = nx;
          const tangentVelocity = dot(c.vx, c.vy, tx, ty);
          const friction = wall.isFrame ? 0.995 : 0.992;
          c.vx -= tangentVelocity * (1 - friction) * tx;
          c.vy -= tangentVelocity * (1 - friction) * ty;
        }
      }

      if (!hadCollision) {
        break;
      }
    }
  }

  _updateTrail(dt) {
    const c = this.cat;
    const head = this.trail[this.trail.length - 1];

    if (!head || length(head.x - c.x, head.y - c.y) > 2.2) {
      this.trail.push({
        x: c.x,
        y: c.y,
        life: 1,
      });
    }

    for (const node of this.trail) {
      node.life -= dt * 0.56;
    }

    this.trail = this.trail.filter((node) => node.life > 0);

    if (this.trail.length > CAT_CONFIG.trailMaxPoints) {
      this.trail.splice(0, this.trail.length - CAT_CONFIG.trailMaxPoints);
    }
  }
}
