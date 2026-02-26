// ─── VACUUM (Fluid Dynamics · Impulse Modifier) ──────────────
// Strong, instant pull towards drop point.
// Continuous inward radial force + periodic particle streams for 1 second.

defineAbility({
  id: "vacuum", name: "Vacuum", accent: "#f5f5f5",
  maxUses: Infinity, category: "fluid",
  sound: "Assets/Audios/vacuum.mp3",
  title: "Fundamental Constant: Fluid Dynamics (Vacuum)",
  equation: "u_r = \u2212k/r\u00b2",

  drawPreview(ctx, cx, cy) {
    drawVectorField(ctx, cx, cy, true, "rgba(255,255,255,0.95)", false, 32, 14);
  },

  createEffect(x, y, b) {
    // Instant strong pull on drop
    applyImpulse(b, { x, y }, true, 2400);
    spawnBurst(x, y, true);

    return {
      id: "vacuum", x, y,
      budget: 1, age: 0, dead: false, burstCd: 0.12,

      update(dt, b) {
        this.age += dt;
        this.budget -= dt;
        if (this.budget <= 0) { this.dead = true; return; }
        applyRadial(b, { x: this.x, y: this.y }, dt, 3000, true, 0.7);
        this.burstCd -= dt;
        if (this.burstCd <= 0) {
          spawnBurst(this.x, this.y, true);
          this.burstCd = 0.12;
        }
      },

      draw(ctx) {
        const fade = clamp(this.budget, 0, 1);
        if (fade <= 0) return;
        const r = Math.max(5, 80 - this.age * 70);
        ctx.strokeStyle = "rgba(255,255,255," + (0.35 * fade) + ")";
        ctx.lineWidth = 1.5;
        ctx.shadowColor = "rgba(255,255,255,0.3)"; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(this.x, this.y, r, 0, Math.PI * 2); ctx.stroke();
        ctx.shadowBlur = 0;
      }
    };
  }
});
