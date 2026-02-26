// ─── ABILITY REGISTRY ────────────────────────────────────────
// Each ability file calls defineAbility() to register itself.
// abilities/index.js assembles them into the final TOOLS array.

const ABILITIES = {};

function defineAbility(def) {
  ABILITIES[def.id] = def;
}
