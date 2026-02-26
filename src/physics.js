import { BOARD_RECT, CAT } from "./config.js";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function circleIntersectsRect(circle, rect) {
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy < circle.radius * circle.radius;
}

function resolveCircleRectCollision(circle, wall) {
  const closestX = Math.max(wall.x, Math.min(circle.x, wall.x + wall.w));
  const closestY = Math.max(wall.y, Math.min(circle.y, wall.y + wall.h));
  let dx = circle.x - closestX;
  let dy = circle.y - closestY;
  let distSq = dx * dx + dy * dy;

  if (distSq > circle.radius * circle.radius) {
    return;
  }

  if (distSq === 0) {
    dx = circle.x < wall.x + wall.w / 2 ? -1 : 1;
    dy = circle.y < wall.y + wall.h / 2 ? -1 : 1;
    distSq = dx * dx + dy * dy;
  }

  const dist = Math.sqrt(distSq);
  const overlap = circle.radius - dist;
  const nx = dx / dist;
  const ny = dy / dist;

  circle.x += nx * overlap;
  circle.y += ny * overlap;

  const vn = circle.vx * nx + circle.vy * ny;
  if (vn < 0) {
    circle.vx -= vn * nx * 1.1;
    circle.vy -= vn * ny * 1.1;
  }
}

function isOverlappingCircle(cat, effect) {
  const dx = cat.x - effect.x;
  const dy = cat.y - effect.y;
  const r = cat.radius + effect.radius;
  return dx * dx + dy * dy <= r * r;
}

export class PhysicsEngine {
  update(state, inputAxis, dt, nowMs) {
    const { cat, effects } = state;
    const dtMs = dt * 1000;

    const axisMag = Math.hypot(inputAxis.x, inputAxis.y) || 1;
    const ax = (inputAxis.x / axisMag) * CAT.accel;
    const ay = (inputAxis.y / axisMag) * CAT.accel;
    cat.vx += ax * dt;
    cat.vy += ay * dt;

    const effectFlags = this.applyTimedEffects(state, dt, dtMs, nowMs);
    this.applyImpulseEffects(state, nowMs);
    this.updateRadius(cat, effectFlags, dt);

    const dragPow = Math.pow(CAT.drag, dt * 60);
    cat.vx *= dragPow;
    cat.vy *= dragPow;

    const speed = Math.hypot(cat.vx, cat.vy);
    if (speed > CAT.maxSpeed) {
      const f = CAT.maxSpeed / speed;
      cat.vx *= f;
      cat.vy *= f;
    }

    cat.x += cat.vx * dt;
    cat.y += cat.vy * dt;
    this.resolveWorldCollision(state, dt, nowMs);

    return this.isGoalReached(state);
  }

  applyTimedEffects(state, dt, dtMs, nowMs) {
    const flags = {
      heat: 0,
      cold: 0,
    };

    state.effects = state.effects.filter((effect) => {
      if (!effect.active) {
        return false;
      }

      if (effect.toolId === "heat" || effect.toolId === "cold") {
        const overlap = isOverlappingCircle(state.cat, effect);
        if (overlap && effect.overlapBudgetMs > 0) {
          effect.overlapBudgetMs = Math.max(0, effect.overlapBudgetMs - dtMs);
          effect.remainingMs = effect.overlapBudgetMs;
          flags[effect.toolId] += 1;
          state.cat.vy += (effect.toolId === "heat" ? -20 : 20) * dt;
        }
        return effect.overlapBudgetMs > 0;
      }

       if (effect.toolId === "mass") {
        effect.remainingMs = effect.lifetimeMs - (nowMs - effect.createdAt);
        if (effect.remainingMs <= 0) {
          return false;
        }
        const dx = effect.x - state.cat.x;
        const dy = effect.y - state.cat.y;
        const dist = Math.hypot(dx, dy) || 1;
        const falloff = Math.max(0, 1 - dist / effect.radius);
        const pull = (58 + falloff * 82) * dt;
        state.cat.vx += (dx / dist) * pull;
        state.cat.vy += (dy / dist) * pull;
        return true;
      }

      if (effect.lifetimeMs > 0) {
        effect.remainingMs = effect.lifetimeMs - (nowMs - effect.createdAt);
        return effect.remainingMs > 0;
      }

      if (effect.particleLifetimeMs > 0) {
        effect.remainingMs = effect.particleLifetimeMs - (nowMs - effect.createdAt);
        return effect.remainingMs > 0;
      }

      return true;
    });

    return flags;
  }

  applyImpulseEffects(state) {
    for (const effect of state.effects) {
      if (effect.applied) {
        continue;
      }
      if (effect.toolId !== "highPressure" && effect.toolId !== "vacuum") {
        continue;
      }

      const dx = state.cat.x - effect.x;
      const dy = state.cat.y - effect.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist > effect.radius) {
        effect.applied = true;
        continue;
      }
      const nx = dx / dist;
      const ny = dy / dist;
      const scale = effect.impulse * Math.max(0.22, 1 - dist / effect.radius);
      const sign = effect.toolId === "highPressure" ? 1 : -1;

      state.cat.vx += nx * scale * sign;
      state.cat.vy += ny * scale * sign;
      effect.applied = true;
    }
  }

  updateRadius(cat, flags, dt) {
    const target = clamp(CAT.baseRadius + flags.heat * 9 - flags.cold * 9, 12, 44);
    cat.targetRadius = target;
    cat.radius += (cat.targetRadius - cat.radius) * Math.min(1, dt * 9);
  }

  resolveWorldCollision(state, dt, nowMs) {
    const cat = state.cat;
    cat.inTunnel = false;
    cat.x = clamp(cat.x, BOARD_RECT.x + cat.radius, BOARD_RECT.x + BOARD_RECT.w - cat.radius);
    cat.y = clamp(cat.y, BOARD_RECT.y + cat.radius, BOARD_RECT.y + BOARD_RECT.h - cat.radius);

    for (const wall of state.level.walls) {
      const isTunnelActive = wall.tunnelUntilMs > nowMs;
      if (isTunnelActive) {
        if (circleIntersectsRect(cat, wall)) {
          cat.inTunnel = true;
          const drag = Math.pow(0.36, dt * 2.6);
          cat.vx *= drag;
          cat.vy *= drag;
        }
        continue;
      }
      resolveCircleRectCollision(cat, wall);
    }
  }

  isGoalReached(state) {
    return circleIntersectsRect(state.cat, state.level.goal);
  }
}
