import { clamp, valueNoise2D } from "./math.js";

export const TOOL_OVERLAY_KIND = {
  heat: "thermal_out",
  cold: "thermal_in",
  mass: "gravity_in",
  darkEnergy: "gravity_out",
  highPressure: "pressure_out",
  vacuum: "pressure_in",
  tunneling: "noise_purple",
  viscosity: "noise_cold",
  elasticity: "rings",
  entropy: "entropy",
};

export function toolUsesGrid(toolId) {
  return toolId === "mass" || toolId === "darkEnergy";
}

export function massResponse(massFactor = 1) {
  return 1 / Math.max(0.25, massFactor);
}

export function computeMassFieldDelta({
  balloonX,
  balloonY,
  pointerX,
  pointerY,
  dt,
  attract,
  massFactor = 1,
}) {
  const dx = pointerX - balloonX;
  const dy = pointerY - balloonY;
  const dist = Math.hypot(dx, dy) || 1;
  const distSq = dist * dist;
  const direction = attract ? 1 : -1;
  const rawStrength = (28000000 / (distSq + 16000)) * direction;
  const strength = clamp(rawStrength, -1250, 1250);
  const response = massResponse(massFactor);
  return {
    dvx: (dx / dist) * strength * dt * response,
    dvy: (dy / dist) * strength * dt * response,
  };
}

export function computeRadialForceDelta({
  balloonX,
  balloonY,
  pointerX,
  pointerY,
  dt,
  inward,
  strength,
  power,
  toolRadius,
  massFactor = 1,
}) {
  const dx = balloonX - pointerX;
  const dy = balloonY - pointerY;
  const dist = Math.hypot(dx, dy) || 1;
  const influence = clamp(1 - dist / toolRadius, 0, 1);
  if (influence <= 0) {
    return { dvx: 0, dvy: 0 };
  }

  const direction = inward ? -1 : 1;
  const nx = (dx / dist) * direction;
  const ny = (dy / dist) * direction;
  const response = massResponse(massFactor);
  const force = strength * Math.pow(influence, power ?? 1);

  return {
    dvx: nx * force * dt * response,
    dvy: ny * force * dt * response,
  };
}

export function computeRadialImpulseDelta({
  balloonX,
  balloonY,
  pointerX,
  pointerY,
  inward,
  magnitude,
  toolRadius,
  massFactor = 1,
}) {
  const dx = balloonX - pointerX;
  const dy = balloonY - pointerY;
  const dist = Math.hypot(dx, dy) || 1;

  const influence = clamp(1 - dist / (toolRadius * 1.1), 0, 1);
  if (influence <= 0) {
    return { dvx: 0, dvy: 0 };
  }

  const direction = inward ? -1 : 1;
  const nx = (dx / dist) * direction;
  const ny = (dy / dist) * direction;
  const response = massResponse(massFactor);
  const impulse = magnitude * Math.pow(influence, 0.72);

  return {
    dvx: nx * impulse * response,
    dvy: ny * impulse * response,
  };
}

export function computeEntropyDelta({
  time,
  x,
  y,
  dt,
  massFactor = 1,
  strength = 430,
}) {
  const response = massResponse(massFactor);
  const n1 = valueNoise2D(time * 3.8, x * 0.012) - 0.5;
  const n2 = valueNoise2D(y * 0.011, time * 3.4) - 0.5;

  return {
    dvx: n1 * strength * dt * response,
    dvy: n2 * strength * dt * response,
  };
}

export function warpGridPoint(x, y, cx, cy, { lensRadius, inward, warpStrength = 52 }) {
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.hypot(dx, dy) || 1;
  const influence = clamp(1 - dist / lensRadius, 0, 1);
  const direction = inward ? -1 : 1;
  const offset = direction * influence * influence * warpStrength;
  return {
    x: x + (dx / dist) * offset,
    y: y + (dy / dist) * offset,
  };
}

export function sampleVectorFieldArrow({
  x,
  y,
  cx,
  cy,
  lensRadius,
  inward,
  spacing,
  baseLength,
  alphaMultiplier = 1,
  streakMode = false,
}) {
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.hypot(dx, dy);
  if (dist > lensRadius * 1.08 || dist < 1.5) {
    return null;
  }

  const influence = clamp(1 - dist / lensRadius, 0, 1);
  const alpha = clamp(influence * alphaMultiplier, 0, 1);
  if (alpha <= 0.03) {
    return null;
  }

  const invDist = 1 / dist;
  const dir = inward ? -1 : 1;
  const nx = dx * invDist * dir;
  const ny = dy * invDist * dir;

  const len = baseLength * (0.38 + influence * (streakMode ? 2.2 : 1.4));
  const startX = streakMode ? x - nx * len * 0.15 : x;
  const startY = streakMode ? y - ny * len * 0.15 : y;
  const endX = x + nx * len;
  const endY = y + ny * len;

  return {
    spacing,
    influence,
    alpha,
    nx,
    ny,
    len,
    startX,
    startY,
    endX,
    endY,
  };
}
