// ============================================================
// LEVEL 7 — Final: combine all tools
// ============================================================
// Rod: Violet | Trail: Violet/Indigo
// Compact multi-room maze. Requires creative tool chaining.
// Cat spawns top-left, rod at bottom-right.

defineLevel("lvl7", level => {
  const map = parseAsciiMap(`
    ///////////////////////////////
    /                           /
    / AAAAAA  AAAAAA  AAAAAA   /
    / A    A  A    A  A    A   /
    / A    A  A    A  A    A   /
    / A    AAAA    AAAA    A   /
    / A                    A   /
    / AAAA    AAAA    AAAA A   /
    /    A    A  A    A        /
    /    A    A  A    A        /
    / AAAA    A  A    AAAA A   /
    / A                    A   /
    / A    AAAA    AAAA    A   /
    / A    A  A    A  A    A   /
    / A    A  A    A  A    A   /
    / AAAAAA  AAAAAA  AAAAAA   /
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
