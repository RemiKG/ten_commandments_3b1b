// ============================================================
// LEVEL 5 — Introduce vacuum (inward pull)
// ============================================================
// Rod: Blue | Trail: Green
// Offset chambers separated by gaps. Vacuum pulls cat across.
// Cat spawns top-right, rod at bottom-left.

defineLevel("lvl5", level => {
  const map = parseAsciiMap(`
    ///////////////////////////////
    /                           /
    /   AAAAAAAAAA              /
    /   A        A              /
    /   A        A   AAAAAA    /
    /   A        A   A    A    /
    /   AAAA  AAAA   A    A    /
    /                A    A    /
    /                AAAAAA    /
    /                           /
    /   AAAAAA                  /
    /   A    A                  /
    /   A    A   AAAA  AAAA    /
    /   A    A   A        A    /
    /   AAAAAA   A        A    /
    /            A        A    /
    /            AAAAAAAAAA    /
    /                           /
    ///////////////////////////////
  `);

  wallsFromAscii(level, map, {
    origin: LEVEL_GRID.origin,
    cell: LEVEL_GRID.cell,
    legend: legendWith()
  });
});
