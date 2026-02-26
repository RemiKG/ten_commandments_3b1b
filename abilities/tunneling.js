// ─── TUNNELING (Quantum Mechanics) ───────────────────────────
// Disables collision on nearest wall segment. Applies drag.
// Drop near a wall to phase through it. Duration: 4 seconds.

defineAbility({
  id: "tunneling", name: "Tunneling", accent: "#cd4cff",
  maxUses: Infinity, category: "quantum",
  sound: "Assets/Audios/quantum.mp3",
  title: "Fundamental Constant: Quantum Tunneling",
  equation: "P_tunnel ~ exp(\u22122\u03baL)",

  drawPreview(ctx, cx, cy) {
    const g = ctx.createRadialGradient(cx, cy, LENS_R * 0.08, cx, cy, LENS_R);
    g.addColorStop(0, "rgba(205,76,255,0.55)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(BOARD.x, BOARD.y, BOARD.w, BOARD.h);
    ctx.save(); ctx.globalAlpha = 0.65;
    for (let i = 0; i < 450; i++) {
      const a = i * 0.41, r = ((i * 73) % 1000) / 1000 * LENS_R;
      ctx.fillStyle = i % 4 === 0 ? "rgba(255,255,255,0.52)" : "rgba(255,255,255,0.24)";
      ctx.fillRect(cx + Math.cos(a) * r, cy + Math.sin(a) * r,
        i % 2 === 0 ? 1 : 2, i % 3 === 0 ? 2 : 1);
    }
    ctx.restore();
  },

  createEffect(x, y) {
    const target = findNearestWall(x, y, 40);
    if (!target) return null;
    disableWall(target.wall, 4);

    return {
      id: "tunneling", x, y,
      wall: target.wall,
      timeRemaining: 4, age: 0, dead: false,

      update(dt, b) {
        this.age += dt;
        this.timeRemaining -= dt;
        if (this.timeRemaining <= 0) { this.dead = true; return; }
        disableWall(this.wall, this.timeRemaining);
        if (balloonNearDisabled()) {
          b.tunnelGhost = 1;
          b.damping += 0.4;
        }
      },

      draw(ctx) { /* Wall noise is rendered by the main wall renderer */ }
    };
  }
});
