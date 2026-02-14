import { BALLOON_CONFIG, BASE_PHYSICS, createMazeSegments, LAYOUT } from "./config.js";
import { clamp, closestPointOnSegment, dot, length, normalize } from "./math.js";
import { ThermoAutomata } from "./thermoAutomata.js";

const TOOL_RADIUS = LAYOUT.lensRadius * 1.45;
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

    this.balloon = {
      x: LAYOUT.board.x + LAYOUT.board.width * 0.5,
      y: LAYOUT.board.y + LAYOUT.board.height * 0.52,
      vx: -48,
      vy: -34,
      radius: BALLOON_CONFIG.baseRadius,
      targetRadius: BALLOON_CONFIG.baseRadius,
      massFactor: BASE_HEFT,
      localDamping: 0,
      elasticity: BASE_PHYSICS.elasticity,
      tunnelGhost: 0,
      temperature: 0,
      pressure: 1,
      entropy: 0,
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

    const pointerX = Number.isFinite(control.pointerX) ? control.pointerX : this.balloon.x;
    const pointerY = Number.isFinite(control.pointerY) ? control.pointerY : this.balloon.y;
    const pointerInBoard =
      typeof control.pointerInBoard === "boolean"
        ? control.pointerInBoard
        : pointInBoard(pointerX, pointerY);

    const thermoControl = {
      activeTool: control.activeTool,
      applying: Boolean(control.applying),
      pointerX,
      pointerY,
      pointerInBoard,
    };

    this.thermo.update(step, thermoControl);

    this._updateDisabledWalls(step);
    this._decayToolCooldowns(step);

    this.thermoSample = this.thermo.sample(this.balloon.x, this.balloon.y);
    this._resetDynamicBalloonState(step, this.thermoSample);

    if (control.applying) {
      this._applyToolEffect(
        {
          ...control,
          pointerX,
          pointerY,
          pointerInBoard,
        },
        step,
        particles,
      );
    } else {
      this.tunnelPreview = null;
    }

    this._integrate(step);
    this._resolveWallCollisions();
    this._updateTrail(step);
  }

  _resetDynamicBalloonState(dt, sample) {
    const b = this.balloon;

    b.localDamping = 0;
    b.elasticity = BASE_PHYSICS.elasticity;

    b.tunnelGhost = Math.max(0, b.tunnelGhost - dt * 2.2);

    if (sample) {
      b.pressure = sample.pressure;
      b.entropy = sample.entropy;

      const expansion = clamp(Math.sqrt(sample.temperature / Math.max(0.22, sample.pressure)), 0.62, 1.46);
      const density = clamp(Math.sqrt(sample.pressure / Math.max(0.25, sample.temperature)), 0.55, 3.2);

      b.targetRadius = BALLOON_CONFIG.baseRadius * expansion;
      b.massFactor = BASE_HEFT * density;
      b.temperature = clamp((sample.temperature - 1) * 1.4, -1.5, 1.5);

      // Entropy behaves like microscale turbulence/friction in this fake model.
      b.localDamping += sample.entropy * 0.14;
    } else {
      b.targetRadius = BALLOON_CONFIG.baseRadius;
      b.massFactor = BASE_HEFT;
      b.temperature *= Math.exp(-dt * 1.35);
      b.pressure = 1;
      b.entropy = 0;
    }
  }

  _decayToolCooldowns(dt) {
    this.pressureCooldown = Math.max(0, this.pressureCooldown - dt);
    this.vacuumCooldown = Math.max(0, this.vacuumCooldown - dt);
  }

  _applyToolEffect(control, dt, particles) {
    const { activeTool, pointerX, pointerY, pointerPressed, pointerInBoard } = control;
    const b = this.balloon;

    switch (activeTool) {
      case "heat": {
        b.targetRadius = clamp(b.targetRadius * 1.07, BALLOON_CONFIG.minRadius, BALLOON_CONFIG.maxRadius);
        b.massFactor *= 0.9;
        this._applyCursorRadialForce(pointerX, pointerY, dt, {
          inward: false,
          strength: 1450,
          power: 1.1,
        });
        break;
      }
      case "cold": {
        b.targetRadius = clamp(b.targetRadius * 0.92, BALLOON_CONFIG.minRadius, BALLOON_CONFIG.maxRadius);
        b.massFactor *= 1.22;
        b.localDamping += 1.05;
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
          strength: 2100,
          power: 0.8,
        });

        if (pointerPressed || this.pressureCooldown <= 0) {
          this._applyImpulsePulse(pointerX, pointerY, false, 1400);
          particles?.spawnPressureBurst(pointerX, pointerY, 1);
          this.pressureCooldown = 0.062;
        }
        break;
      }
      case "vacuum": {
        this._applyCursorRadialForce(pointerX, pointerY, dt, {
          inward: true,
          strength: 2000,
          power: 0.8,
        });

        if (pointerPressed || this.vacuumCooldown <= 0) {
          this._applyImpulsePulse(pointerX, pointerY, true, 1450);
          particles?.spawnVacuumSink(pointerX, pointerY, 1);
          this.vacuumCooldown = 0.053;
        }
        break;
      }
      case "tunneling": {
        b.localDamping += 0.62;

        const target = this._findNearestWall(pointerX, pointerY, 22);
        this.tunnelPreview = target;

        if (target) {
          this.disableWall(target.wall.id, 0.36);
        }

        if (this._isBalloonNearDisabledWall()) {
          b.tunnelGhost = 1;
          b.localDamping += 0.28;
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
        b.elasticity = 1.2;
        b.massFactor *= 0.9;
        break;
      }
      case "entropy": {
        if (!pointerInBoard) {
          break;
        }

        const sample = this.thermo.sample(pointerX, pointerY);
        const response = 1 / Math.max(0.25, b.massFactor);
        const swirlX = -sample.gradPressureY;
        const swirlY = sample.gradPressureX;
        const driftX = sample.gradTempX - sample.gradPressureX;
        const driftY = sample.gradTempY - sample.gradPressureY;
        const chaos = 4200 * (0.65 + sample.entropy);
        const phase = this.time * 14 + pointerX * 0.009 + pointerY * 0.013;
        const jitter = 820 * (0.35 + sample.entropy);

        b.vx += (swirlX * 1500 + driftX * chaos + Math.cos(phase) * jitter) * dt * response;
        b.vy += (swirlY * 1500 + driftY * chaos + Math.sin(phase * 1.17) * jitter) * dt * response;
        b.localDamping += sample.entropy * 0.22;
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
    const rawStrength = (43000000 / (distSq + 16000)) * direction;
    const strength = clamp(rawStrength, -2200, 2200);
    const response = 1 / Math.max(0.25, b.massFactor);

    b.vx += (dx / dist) * strength * dt * response;
    b.vy += (dy / dist) * strength * dt * response;
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
    const response = 1 / Math.max(0.25, b.massFactor);

    b.vx += nx * force * dt * response;
    b.vy += ny * force * dt * response;
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
    const response = 1 / Math.max(0.25, b.massFactor);

    b.vx += nx * impulse * response;
    b.vy += ny * impulse * response;
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

    const inertialDamping = BASE_PHYSICS.globalDamping / Math.max(1, b.massFactor);
    const damping = Math.exp(-(inertialDamping + Math.max(0, b.localDamping)) * dt);
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

function pointInBoard(x, y) {
  const board = LAYOUT.board;
  return x >= board.x && y >= board.y && x <= board.x + board.width && y <= board.y + board.height;
}
