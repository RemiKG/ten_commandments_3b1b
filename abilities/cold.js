// ─── COLD (Thermodynamics · State Modifier) ──────────────────
// Shrinks balloon radius. Adds extremely slight downward velocity.
// Effect only applied when placed ON TOP of the character. Contact-time budget: 2 s.

defineAbility({
  id: "cold", name: "Cold", accent: "#9fdfff",
  maxUses: Infinity, category: "thermodynamics",
  sound: "Assets/Audios/cold.mp3",
  title: "Fundamental Constant: Cryogenic Compression",
  equation: "dT/dt = k\u2207\u00b2T \u2212 Q_c",

  drawPreview(ctx, cx, cy) {
    const g = ctx.createRadialGradient(cx, cy, LENS_R * 0.06, cx, cy, LENS_R * 1.05);
    g.addColorStop(0, "rgba(145,219,255,0.72)");
    g.addColorStop(0.52, "rgba(145,219,255,0.22)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(BOARD.x, BOARD.y, BOARD.w, BOARD.h);
    drawVectorField(ctx, cx, cy, true, "rgba(145,219,255,0.95)");
  },

  createEffect(x, y) {
    return {
      id: "cold", x, y,
      budget: 2, age: 0, dead: false,

      update(dt, b) {
        this.age += dt;
        if (this.age > 20) { this.dead = true; return; }
        const dist = Math.hypot(b.x - this.x, b.y - this.y);
        if (dist > b.radius + 20) return;
        this.budget -= dt;
        if (this.budget <= 0) { this.dead = true; return; }
        b.targetRadius = Math.max(b.targetRadius * 0.92, 19);
        b.temp = Math.max(b.temp - dt * 2, -1.5);
        b.vy += 12 * dt;
      },

      draw(ctx) {
        const fade = clamp(this.budget / 2, 0, 1);
        if (fade <= 0) return;
        const g = ctx.createRadialGradient(this.x, this.y, 4, this.x, this.y, 50);
        g.addColorStop(0, "rgba(145,220,255," + (0.4 * fade) + ")");
        g.addColorStop(0.6, "rgba(100,180,255," + (0.15 * fade) + ")");
        g.addColorStop(1, "rgba(80,160,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(this.x, this.y, 50, 0, Math.PI * 2); ctx.fill();
        // Icy ring
        ctx.strokeStyle = "rgba(200,240,255," + (0.3 * fade) + ")";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 35 + Math.sin(Date.now() * 0.003) * 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    };
  }
});
