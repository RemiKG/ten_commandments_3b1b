// ─── HEAT (Thermodynamics · State Modifier) ──────────────────
// Increases balloon radius (neon expansion). Adds extremely slight upward velocity.
// Effect only applied when placed ON TOP of the character. Contact-time budget: 2 s.

defineAbility({
  id: "heat", name: "Heat", accent: "#ff7a28",
  maxUses: Infinity, category: "thermodynamics",
  sound: "Assets/Audios/heat.mp3",
  title: "Fundamental Constant: Thermal Expansion",
  equation: "dT/dt = k\u2207\u00b2T + Q",

  drawPreview(ctx, cx, cy) {
    const g = ctx.createRadialGradient(cx, cy, LENS_R * 0.06, cx, cy, LENS_R * 1.05);
    g.addColorStop(0, "rgba(255,122,40,0.72)");
    g.addColorStop(0.52, "rgba(255,122,40,0.22)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(BOARD.x, BOARD.y, BOARD.w, BOARD.h);
    drawVectorField(ctx, cx, cy, false, "rgba(255,122,40,0.95)");
  },

  createEffect(x, y) {
    return {
      id: "heat", x, y,
      budget: 2, age: 0, dead: false,

      update(dt, b) {
        this.age += dt;
        if (this.age > 20) { this.dead = true; return; }
        const dist = Math.hypot(b.x - this.x, b.y - this.y);
        if (dist > b.radius + 20) return;
        this.budget -= dt;
        if (this.budget <= 0) { this.dead = true; return; }
        b.targetRadius = Math.min(b.targetRadius * 1.07, 54);
        b.temp = Math.min(b.temp + dt * 2, 1.5);
        b.vy -= 12 * dt;
      },

      draw(ctx) {
        const fade = clamp(this.budget / 2, 0, 1);
        if (fade <= 0) return;
        const g = ctx.createRadialGradient(this.x, this.y, 4, this.x, this.y, 50);
        g.addColorStop(0, "rgba(255,140,50," + (0.45 * fade) + ")");
        g.addColorStop(0.6, "rgba(255,100,20," + (0.18 * fade) + ")");
        g.addColorStop(1, "rgba(255,80,10,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(this.x, this.y, 50, 0, Math.PI * 2); ctx.fill();
      }
    };
  }
});
