import { COLORS, LAYOUT, TOOLS, WORLD_HEIGHT, WORLD_WIDTH } from "./config.js";
import { clamp } from "./math.js";

export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  render(physics, input, gameState) {
    const ctx = this.ctx;

    ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this._drawBackground();

    this._drawTitle(gameState);
    this._drawBoardFrame();
    this._drawWalls(physics.walls);
    this._drawTrail(physics.trail);
    this._drawBalloon(physics.balloon);
    this._drawCrosshair(input.pointerX, input.pointerY);

    this._drawSidebar(gameState.activeTool);
    this._drawCornerDiamond();
  }

  _drawBackground() {
    const ctx = this.ctx;

    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    const vignette = ctx.createRadialGradient(
      WORLD_WIDTH * 0.5,
      WORLD_HEIGHT * 0.45,
      WORLD_WIDTH * 0.04,
      WORLD_WIDTH * 0.5,
      WORLD_HEIGHT * 0.5,
      WORLD_WIDTH * 0.63,
    );
    vignette.addColorStop(0, "rgba(255,255,255,0.05)");
    vignette.addColorStop(0.6, "rgba(255,255,255,0.012)");
    vignette.addColorStop(1, "rgba(0,0,0,0.45)");

    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    ctx.save();
    ctx.globalAlpha = 0.04;
    for (let i = 0; i < 900; i += 1) {
      const x = (i * 97.31) % WORLD_WIDTH;
      const y = (i * 189.17) % WORLD_HEIGHT;
      const size = i % 2 === 0 ? 1 : 2;
      ctx.fillStyle = i % 7 === 0 ? "rgba(100,200,255,0.22)" : "rgba(255,255,255,0.35)";
      ctx.fillRect(x, y, size, size);
    }
    ctx.restore();
  }

  _drawTitle(gameState) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = COLORS.lineWhite;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "58px Times New Roman";
    ctx.fillText(gameState.titleText, LAYOUT.title.x, LAYOUT.title.y);

    ctx.font = "26px Times New Roman";
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.fillText(`Constants Remaining: ${gameState.constantsRemaining}/10`, LAYOUT.title.x, LAYOUT.title.y + 38);
    ctx.restore();
  }

  _drawBoardFrame() {
    const ctx = this.ctx;
    const board = LAYOUT.board;

    ctx.save();
    ctx.strokeStyle = COLORS.lineWhite;
    ctx.lineWidth = 2;
    ctx.strokeRect(board.x, board.y, board.width, board.height);
    ctx.restore();
  }

  _drawWalls(walls) {
    const ctx = this.ctx;
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = COLORS.lineWhite;

    for (const wall of walls) {
      if (wall.isFrame) {
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(wall.a.x, wall.a.y);
      ctx.lineTo(wall.b.x, wall.b.y);
      ctx.stroke();
    }

    ctx.restore();
  }

  _drawTrail(trail) {
    if (trail.length < 2) {
      return;
    }

    const ctx = this.ctx;

    ctx.save();
    for (let i = 1; i < trail.length; i += 1) {
      const prev = trail[i - 1];
      const node = trail[i];
      const alpha = clamp(node.life, 0, 1) * 0.85;
      ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
      ctx.lineWidth = 1.1 + alpha * 4.8;
      ctx.shadowColor = "rgba(255,255,255,0.55)";
      ctx.shadowBlur = 16 * alpha;
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(node.x, node.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawBalloon(balloon) {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.arc(balloon.x, balloon.y, balloon.radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(252,252,252,0.98)";
    ctx.shadowColor = "rgba(255,255,255,0.95)";
    ctx.shadowBlur = 56;
    ctx.fill();

    const spec = ctx.createRadialGradient(
      balloon.x - balloon.radius * 0.24,
      balloon.y - balloon.radius * 0.35,
      balloon.radius * 0.05,
      balloon.x,
      balloon.y,
      balloon.radius,
    );
    spec.addColorStop(0, "rgba(255,255,255,0.55)");
    spec.addColorStop(1, "rgba(255,255,255,0.02)");
    ctx.fillStyle = spec;
    ctx.fill();
    ctx.restore();
  }

  _drawCrosshair(x, y) {
    const ctx = this.ctx;
    const size = LAYOUT.crosshairSize;

    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255,255,255,0.92)";
    ctx.shadowColor = "rgba(255,255,255,0.5)";
    ctx.shadowBlur = 6;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.lineTo(x - 5, y);
    ctx.moveTo(x + 5, y);
    ctx.lineTo(x + size, y);
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y - 5);
    ctx.moveTo(x, y + 5);
    ctx.lineTo(x, y + size);
    ctx.stroke();
    ctx.restore();
  }

  _drawSidebar(activeTool) {
    const ctx = this.ctx;
    const sidebar = LAYOUT.sidebar;

    const itemHeight = (sidebar.height - sidebar.topPad * 2 - sidebar.itemGap * (TOOLS.length - 1)) / TOOLS.length;

    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.92)";
    ctx.fillStyle = "rgba(4, 9, 12, 0.86)";
    roundRect(ctx, sidebar.x, sidebar.y, sidebar.width, sidebar.height, sidebar.radius);
    ctx.fill();
    ctx.stroke();

    for (let i = 0; i < TOOLS.length; i += 1) {
      const tool = TOOLS[i];
      const y = sidebar.y + sidebar.topPad + i * (itemHeight + sidebar.itemGap);
      const isActive = tool.id === activeTool;

      if (isActive) {
        const glow = ctx.createRadialGradient(
          sidebar.x + sidebar.width * 0.5,
          y + itemHeight * 0.5,
          2,
          sidebar.x + sidebar.width * 0.5,
          y + itemHeight * 0.5,
          sidebar.width * 0.65,
        );
        glow.addColorStop(0, `${tool.accent}bb`);
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(sidebar.x - 2, y - 2, sidebar.width + 4, itemHeight + 4);
      }

      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.beginPath();
      ctx.moveTo(sidebar.x + 8, y);
      ctx.lineTo(sidebar.x + sidebar.width - 8, y);
      ctx.stroke();

      ctx.fillStyle = isActive ? tool.accent : "rgba(255,255,255,0.86)";
      ctx.font = "38px Times New Roman";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(tool.glyph, sidebar.x + sidebar.width * 0.5, y + itemHeight * 0.53);
    }

    ctx.restore();
  }

  _drawCornerDiamond() {
    const ctx = this.ctx;
    const cx = WORLD_WIDTH - 54;
    const cy = WORLD_HEIGHT - 56;
    const size = 19;

    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.58)";
    ctx.beginPath();
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size, cy);
    ctx.lineTo(cx, cy + size);
    ctx.lineTo(cx - size, cy);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width * 0.5, height * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}
