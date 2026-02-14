export class Renderer {
  constructor(ctx, world, input) {
    this.ctx = ctx;
    this.world = world;
    this.input = input;
  }

  render() {
    const ctx = this.ctx;
    const { balloon } = this.world;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.save();
    ctx.strokeStyle = "#f5f5f5";
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, ctx.canvas.width - 4, ctx.canvas.height - 4);
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(balloon.x, balloon.y, balloon.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#fcfcfc";
    ctx.shadowColor = "rgba(255,255,255,0.9)";
    ctx.shadowBlur = 38;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 2;
    const size = 22;
    ctx.beginPath();
    ctx.moveTo(this.input.mouseX - size, this.input.mouseY);
    ctx.lineTo(this.input.mouseX + size, this.input.mouseY);
    ctx.moveTo(this.input.mouseX, this.input.mouseY - size);
    ctx.lineTo(this.input.mouseX, this.input.mouseY + size);
    ctx.stroke();
    ctx.restore();
  }
}
