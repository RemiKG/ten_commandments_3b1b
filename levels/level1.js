// ============================================================
// LEVEL 1 — Demo: teach movement + heat
// ============================================================
// Rod: Red | Trail: None
// Cat spawns upper-left, goal rod in bottom-left pocket area.
// Interior blockers encourage first use of heat and trajectory control.

defineLevel("lvl1", level => {
  const map = parseAsciiMap(`
    ///////////////////////////////
    /                             /
    /                             /
    /                             /
    /                             /
    /      AAAAAAAAAAAAAAAAAA     /
    /              A              /
    /              A              /
    /              A              /
    /              A              /
    /              A              /
    /              A              /
    /              A              /
    /              A              /
    /              A              /
    /                             /
    /                             /
    /                             /
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
