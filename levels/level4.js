// ============================================================
// LEVEL 4 — Introduce high pressure (push impulse)
// ============================================================
// Rod: Green | Trail: Yellow
// Dead-end pockets require pressure pushes to escape.
// Cat spawns left-center, rod on far right.

defineLevel("lvl4", level => {
  const map = parseAsciiMap(`
    ///////////////////////////////
    /                           /
    / AAAAAAA     AAAAAAA       /
    / A     A     A     A       /
    / A     A     A     A       /
    / A     AAAAAAA     A       /
    / A                 A       /
    / AAAA           AAAA       /
    /    A           A          /
    /    AAAA     AAAA          /
    /       A     A             /
    /    AAAA     AAAA          /
    /    A           A          /
    / AAAA           AAAA       /
    / A                 A       /
    / A     AAAAAAA     A       /
    / AAAAAAA     AAAAAAA       /
    /                           /
    ///////////////////////////////
  `);

  wallsFromAscii(level, map, {
    origin: LEVEL_GRID.origin,
    cell: LEVEL_GRID.cell,
    legend: legendWith()
  });
});
