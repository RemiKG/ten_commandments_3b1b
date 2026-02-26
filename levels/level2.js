// ============================================================
// LEVEL 2 — Introduce cold + narrow corridors
// ============================================================
// Rod: Orange | Trail: Red
// Cat spawns upper-left; goal rod in bottom-right.
// Symmetric maze with gates (S) and tunnel rails (T).
// Two turns requiring shrink timing.

defineLevel("lvl2", level => {
  const map = parseAsciiMap(`
    ///////////////////////////////
    /                           /
    / AAAAAA                    /
    / A                         /
    / A                         /
    / A                         /
    / A                         /
    / A       AAAAAAA           /
    / A       A                 /
    / A       A       AAAAAA    /
    / A       A       A    A    /
    / A       A       A    A    /
    / A       AAAAAAA A    A    /
    / A               A    A    /
    / AAAAAAAAAAAAA   A    A    /
    /               AAAAAAAA    /
    /              A            /
    /                           /
    ///////////////////////////////
  `);

  wallsFromAscii(level, map, {
    origin: LEVEL_GRID.origin,
    cell: LEVEL_GRID.cell,
    legend: legendWith()
  });
});
