// ============================================================
// LEVEL 6 — Introduce tunneling (phase through walls)
// ============================================================
// Rod: Indigo | Trail: Blue
// Thick walls block direct path. Must tunnel through at least one.
// Cat spawns center, rod at top-right corner.

defineLevel("lvl6", level => {
  const map = parseAsciiMap(`
    ///////////////////////////////
    /                           /
    / AAAAAAAAAAAAAAAAAAAAAAAAA /
    / A                       A /
    / A   AAAAAAAAAAAAAAAA    A /
    / A   A              A    A /
    / A   A   AAAAAAAA   A    A /
    / A   A   A      A   A    A /
    / A   A   A      A   A    A /
    / A   A   A      A   A    A /
    / A   A   AAAAAAAA   A    A /
    / A   A              A    A /
    / A   AAAAAAAAAAAAAAAA    A /
    / A                       A /
    / AAAAAAAAAAAAAAAAAAAAAAAAA /
    /                           /
    /                           /
    /                           /
    ///////////////////////////////
  `);

  wallsFromAscii(level, map, {
    origin: LEVEL_GRID.origin,
    cell: LEVEL_GRID.cell,
    legend: legendWith()
  });
});
