// ─── ASSEMBLE TOOL LIST ──────────────────────────────────────
// Order here determines sidebar layout.
// To cap uses later, set maxUses on each ability (e.g. maxUses: 5).

const TOOLS = [
  "heat", "cold", "mass", "highPressure", "vacuum", "tunneling"
].map(id => ABILITIES[id]);
