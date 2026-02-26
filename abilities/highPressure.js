// ─── HIGH PRESSURE (Fluid Dynamics · Impulse Modifier) ───────
// Strong, instant push away from drop point.
// Continuous radial force + periodic particle bursts for 1 second.

defineAbility({
  id: "highPressure", name: "High Pressure", accent: "#f5f5f5",
  maxUses: Infinity, category: "fluid",
  sound: "Assets/Audios/pressure.mp3",
  title: "Fundamental Constant: Fluid Dynamics (Pressure)",
  equation: "\u2202p/\u2202t = c\u00b2\u2207\u00b7u + S_p",

  drawPreview(ctx, cx, cy) {
    drawVectorField(ctx, cx, cy, false, "rgba(255,255,255,0.9)", false, 38, 14);
  },

  createEffect(x, y, b) {
    // Instant strong impulse on drop
    applyImpulse(b, { x, y }, false, 2200);
    spawnBurst(x, y, false);

    return {
      id: "highPressure", x, y,
      budget: 1, age: 0, dead: false, burstCd: 0.15,

      update(dt, b) {
        this.age += dt;
        this.budget -= dt;
        if (this.budget <= 0) { this.dead = true; return; }
        applyRadial(b, { x: this.x, y: this.y }, dt, 3200, false, 0.7);
        this.burstCd -= dt;
        if (this.burstCd <= 0) {
          spawnBurst(this.x, this.y, false);
          this.burstCd = 0.15;
        }
      },

      draw(ctx) {
        const fade = clamp(this.budget, 0, 1);
        if (fade <= 0) return;
        const r = 20 + this.age * 80;
        ctx.strokeStyle = "rgba(255,255,255," + (0.4 * fade) + ")";
        ctx.lineWidth = 2;
        ctx.shadowColor = "rgba(255,255,255,0.4)"; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(this.x, this.y, r, 0, Math.PI * 2); ctx.stroke();
        ctx.shadowBlur = 0;
      }
    };
  }
});
