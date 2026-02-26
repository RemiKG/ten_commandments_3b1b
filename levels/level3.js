// ============================================================
// LEVEL 3 — Introduce mass (gravity well)
// ============================================================
// Rod: Yellow | Trail: Orange
// Open center with scattered pillars. Mass can redirect trajectory.
// Cat spawns top-center, rod at bottom-center.

defineLevel("lvl3", level => {
  const map = parseAsciiMap(`
    ///////////////////////////////
    /                             /
    /          AAAAAAAAAA         /
    /                    AA       /
    /                      A      /
    /                       A     /
    /       AAAAAAAAAA      A     /
    /      A          A     A     /
    /      A          A     A     /
    /      A     AAA  A     A     /
    /      A    A   A A     A     /
    /      A    A   A A     A     /
    /      A    A     A     A     /
    /      A     AAAAA      A     /
    /      A               A      /
    /      A               A      /
    /      A             AA       /
    /       AAAAAAAAAAAAA         /
    /                             /
    /                             /
    /                             /
    ///////////////////////////////
  `);

  wallsFromAscii(level, map, {
    origin: LEVEL_GRID.origin,
    cell: LEVEL_GRID.cell,
    legend: legendWith()
  });
});
