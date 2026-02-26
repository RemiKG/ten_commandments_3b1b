import { TOOL_IDS, TOOL_META } from "./config.js";

let nextEffectId = 1;

export const TOOL_DEFINITIONS = {
  heat: {
    ...TOOL_META.heat,
    kind: "field",
    radius: 148,
    overlapBudgetMs: 2000,
    sfx: "heat",
  },
  cold: {
    ...TOOL_META.cold,
    kind: "field",
    radius: 148,
    overlapBudgetMs: 2000,
    sfx: "cold",
  },
  mass: {
    ...TOOL_META.mass,
    kind: "field",
    radius: 210,
    lifetimeMs: 7000,
    sfx: "gravity",
  },
  highPressure: {
    ...TOOL_META.highPressure,
    kind: "impulse",
    radius: 190,
    impulse: 720,
    particleLifetimeMs: 620,
    sfx: "pressure",
  },
  vacuum: {
    ...TOOL_META.vacuum,
    kind: "impulse",
    radius: 230,
    impulse: 720,
    particleLifetimeMs: 680,
    sfx: "vacuum",
  },
  tunneling: {
    ...TOOL_META.tunneling,
    kind: "segment",
    lifetimeMs: 1900,
    tunnelTtlMs: 1900,
    sfx: "quantum",
  },
};

export function createToolInventory() {
  return TOOL_IDS.reduce((acc, id) => {
    acc[id] = {
      remaining: null,
    };
    return acc;
  }, {});
}

export function canUseTool(inventory, toolId) {
  const slot = inventory[toolId];
  if (!slot) {
    return false;
  }
  return slot.remaining === null || slot.remaining > 0;
}

export function consumeToolUse(inventory, toolId) {
  const slot = inventory[toolId];
  if (!slot || slot.remaining === null) {
    return;
  }
  slot.remaining = Math.max(0, slot.remaining - 1);
}

export function createPlacedEffect(toolId, x, y, nowMs) {
  const def = TOOL_DEFINITIONS[toolId];
  if (!def) {
    throw new Error(`Unknown tool id: ${toolId}`);
  }

  return {
    id: nextEffectId++,
    toolId,
    x,
    y,
    radius: def.radius ?? 0,
    createdAt: nowMs,
    active: true,
    overlapBudgetMs: def.overlapBudgetMs ?? 0,
    remainingMs: def.lifetimeMs ?? def.overlapBudgetMs ?? def.particleLifetimeMs ?? 0,
    lifetimeMs: def.lifetimeMs ?? 0,
    particleLifetimeMs: def.particleLifetimeMs ?? 0,
    impulse: def.impulse ?? 0,
    applied: false,
    tunnelWallId: null,
    seed: Math.random() * 1000,
  };
}
