// ─── MASS (General Relativity · Trajectory Modifier) ─────────
// Placeable gravity well. Weak continuous attraction over 7 seconds.
// Can be placed ANYWHERE, even outside the maze.

defineAbility({
  id: "mass", name: "Mass", accent: "#59ecff",
  maxUses: Infinity, category: "relativity",
  allowOutsideBoard: true,
  sound: "Assets/Audios/gravity.mp3",
  title: "Fundamental Constant: Gravity Well",
  equation: "F = \u2212GMm/r\u00b2",

  drawPreview(ctx, cx, cy) {
    drawWarpedGrid(ctx, cx, cy, true);
    drawVectorField(ctx, cx, cy, true, "rgba(89,236,255,0.9)", false, 42, 11, 0, 0, W, H);
  },

  createEffect(x, y) {
    return {
      id: "mass", x, y,
      timeRemaining: 7, age: 0, dead: false,

      update(dt, b) {
        this.age += dt;
        this.timeRemaining -= dt;
        if (this.timeRemaining <= 0) { this.dead = true; return; }
        const dx = this.x - b.x, dy = this.y - b.y;
        const dist = Math.hypot(dx, dy) || 1;
        const str = 18000000 / (dist * dist + 12000);
        const resp = 1 / Math.max(0.25, b.mass);
        b.vx += (dx / dist) * str * dt * resp;
        b.vy += (dy / dist) * str * dt * resp;
      },

      draw(ctx) {
        const fade = clamp(this.timeRemaining / 7, 0, 1);
        const pulse = 0.6 + Math.sin(Date.now() * 0.004) * 0.15;
        // Dark mass core
        const gr = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 28);
        gr.addColorStop(0, "rgba(0,0,0," + (0.9 * fade) + ")");
        gr.addColorStop(0.7, "rgba(0,10,20," + (0.5 * fade) + ")");
        gr.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.arc(this.x, this.y, 28, 0, Math.PI * 2); ctx.fill();
        // Cyan ring
        ctx.strokeStyle = "rgba(89,236,255," + (0.6 * fade * pulse) + ")";
        ctx.lineWidth = 1.5;
        ctx.shadowColor = "rgba(89,236,255,0.5)"; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(this.x, this.y, 18, 0, Math.PI * 2); ctx.stroke();
        ctx.shadowBlur = 0;
      }
    };
  }
});
