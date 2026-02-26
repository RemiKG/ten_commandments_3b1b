// ─── PHYSICS HELPERS ─────────────────────────────────────────
function applyRadial(b, p, dt, str, inward, power) {
  const dx = b.x - p.x, dy = b.y - p.y, dist = Math.hypot(dx, dy) || 1;
  const inf = clamp(1 - dist / TOOL_R, 0, 1);
  if (inf <= 0) return;
  const f = str * Math.pow(inf, power) / Math.max(0.25, b.mass);
  const dir = inward ? -1 : 1;
  b.vx += (dx / dist) * dir * f * dt;
  b.vy += (dy / dist) * dir * f * dt;
}
function applyImpulse(b, p, inward, mag) {
  const dx = b.x - p.x, dy = b.y - p.y, dist = Math.hypot(dx, dy) || 1;
  const inf = clamp(1 - dist / (TOOL_R * 1.1), 0, 1);
  if (inf <= 0) return;
  const imp = mag * Math.pow(inf, 0.72) / Math.max(0.25, b.mass);
  const dir = inward ? -1 : 1;
  b.vx += (dx / dist) * dir * imp;
  b.vy += (dy / dist) * dir * imp;
}
function findNearestWall(px, py, maxD) {
  let best = null;
  for (const w of walls) {
    if (w.isFrame || w.canTunnel === false) continue;
    const cp = closestPt(px, py, w.a.x, w.a.y, w.b.x, w.b.y);
    const d = Math.hypot(px - cp.x, py - cp.y);
    const edgeDist = Math.max(0, d - wallHalfWidth(w));
    if (edgeDist <= maxD && (!best || edgeDist < best.dist)) best = { wall: w, point: cp, dist: edgeDist };
  }
  return best;
}
function disableWall(w, sec) {
  if (w.canTunnel === false) return;
  state.disabledWalls.set(w, Math.max(state.disabledWalls.get(w) || 0, sec));
}
function balloonNearDisabled() {
  for (const w of state.disabledWalls.keys()) {
    const cp = closestPt(balloon.x, balloon.y, w.a.x, w.a.y, w.b.x, w.b.y);
    const d = Math.hypot(balloon.x - cp.x, balloon.y - cp.y);
    const edgeDist = Math.max(0, d - wallHalfWidth(w));
    if (edgeDist < balloon.radius + 10) return true;
  }
  return false;
}
