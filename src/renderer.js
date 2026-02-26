import {
  BOARD_RECT,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  COLORS,
  HACKER_LENS_RADIUS,
  MODES,
  MODE_TOGGLE_RECT,
  SIDEBAR_LAYOUT,
  TITLE_HEIGHT,
  TOOL_IDS,
  TOOL_META,
} from "./config.js";

function roundedRect(ctx, x, y, w, h, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawNeonText(ctx, text, x, y, color, size = 62) {
  ctx.save();
  ctx.font = `${size}px Times New Roman`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowBlur = 16;
  ctx.shadowColor = color;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawVectorArrow(ctx, x, y, dx, dy, color, alpha = 0.8) {
  const len = Math.hypot(dx, dy);
  if (len < 0.0001) {
    return;
  }
  const ux = dx / len;
  const uy = dy / len;
  const tipX = x + dx;
  const tipY = y + dy;
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();
  const leftX = tipX - ux * 6 + -uy * 3;
  const leftY = tipY - uy * 6 + ux * 3;
  const rightX = tipX - ux * 6 + uy * 3;
  const rightY = tipY - uy * 6 + -ux * 3;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(leftX, leftY);
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(rightX, rightY);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

export class Renderer {
  constructor(ctx, images) {
    this.ctx = ctx;
    this.images = images;
    this.patterns = {
      wall: null,
      board: null,
    };
    this.ensurePatterns();
  }

  ensurePatterns() {
    if (!this.patterns.wall) {
      this.patterns.wall = this.ctx.createPattern(this.images.wallPattern, "repeat");
    }
    if (!this.patterns.board) {
      this.patterns.board = this.ctx.createPattern(this.images.wallPatternAlt, "repeat");
    }
  }

  getToolRects() {
    return TOOL_IDS.map((toolId, index) => {
      const x = SIDEBAR_LAYOUT.x + SIDEBAR_LAYOUT.innerPad;
      const y = SIDEBAR_LAYOUT.y + SIDEBAR_LAYOUT.innerPad + index * (SIDEBAR_LAYOUT.itemH + SIDEBAR_LAYOUT.gap);
      const w = SIDEBAR_LAYOUT.w - SIDEBAR_LAYOUT.innerPad * 2;
      const h = SIDEBAR_LAYOUT.itemH - SIDEBAR_LAYOUT.innerPad * 2;
      return { toolId, x, y, w, h };
    });
  }

  render(state) {
    this.ensurePatterns();
    const { ctx } = this;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.drawBackground(state.mode);
    this.drawTitle(state);
    this.drawSidebar(state);
    this.drawBoard(state);
    this.drawModeToggle(state.mode);
    this.drawHint(state.level?.hint ?? "");
    this.drawStatus(state);
  }

  drawBackground(mode) {
    const { ctx } = this;
    if (mode === MODES.HACKER) {
      ctx.fillStyle = COLORS.bgHacker;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      return;
    }

    ctx.fillStyle = COLORS.bgNormal;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    if (this.images.bgNormal) {
      ctx.globalAlpha = 0.22;
      ctx.drawImage(this.images.bgNormal, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.globalAlpha = 1;
    }
    if (this.patterns.board) {
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = this.patterns.board;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.globalAlpha = 1;
    }
  }

  drawTitle(state) {
    const tool = TOOL_META[state.selectedTool];
    const titleText =
      state.mode === MODES.HACKER && tool
        ? `FUNDAMENTAL CONSTANT: ${tool.label.toUpperCase()}  |  ${tool.equation}`
        : "FUNDAMENTAL CONSTANT: THE NEON CAT";
    drawNeonText(this.ctx, titleText, BOARD_RECT.x + BOARD_RECT.w / 2, TITLE_HEIGHT / 2 + 6, "#edeaf9", 54);
  }

  drawSidebar(state) {
    const { ctx } = this;
    roundedRect(ctx, SIDEBAR_LAYOUT.x, SIDEBAR_LAYOUT.y, SIDEBAR_LAYOUT.w, BOARD_RECT.h, 8);
    ctx.fillStyle = "rgba(2,3,8,0.82)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 3;
    ctx.stroke();

    const toolRects = this.getToolRects();
    for (const rect of toolRects) {
      const meta = TOOL_META[rect.toolId];
      const selected = state.selectedTool === rect.toolId;
      roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 6);
      const glow = selected ? meta.accent : "rgba(255,255,255,0.2)";
      ctx.fillStyle = selected ? "rgba(0,0,0,0.72)" : "rgba(0,0,0,0.48)";
      ctx.fill();
      ctx.shadowBlur = selected ? 18 : 0;
      ctx.shadowColor = glow;
      ctx.strokeStyle = selected ? glow : "rgba(255,255,255,0.4)";
      ctx.lineWidth = selected ? 2.8 : 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = selected ? glow : "rgba(245,245,245,0.9)";
      ctx.font = selected ? "34px Times New Roman" : "31px Times New Roman";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(meta.shortLabel, rect.x + rect.w / 2, rect.y + rect.h / 2 - 3);

      ctx.fillStyle = "rgba(255,255,255,0.72)";
      ctx.font = "11px Times New Roman";
      const slot = state.toolInventory?.[rect.toolId];
      const countText = !slot || slot.remaining === null ? "\u221e" : `x${slot.remaining}`;
      ctx.fillText(countText, rect.x + rect.w - 10, rect.y + rect.h - 8);
    }
  }

  drawBoard(state) {
    const { ctx } = this;
    const nowMs = state.nowMs ?? performance.now();
    ctx.save();
    ctx.beginPath();
    ctx.rect(BOARD_RECT.x, BOARD_RECT.y, BOARD_RECT.w, BOARD_RECT.h);
    ctx.clip();

    if (state.mode === MODES.HACKER) {
      ctx.fillStyle = "#0b0b0b";
      ctx.fillRect(BOARD_RECT.x, BOARD_RECT.y, BOARD_RECT.w, BOARD_RECT.h);
    } else if (this.patterns.board) {
      ctx.globalAlpha = 0.32;
      ctx.fillStyle = this.patterns.board;
      ctx.fillRect(BOARD_RECT.x, BOARD_RECT.y, BOARD_RECT.w, BOARD_RECT.h);
      ctx.globalAlpha = 1;
    }

    this.drawGoal(state.level?.goal, state.level?.rodColor ?? "#ff3b3b", state.goalPulse);
    this.drawWalls(state.level?.walls ?? [], state.mode, nowMs);

    if (state.mode === MODES.HACKER) {
      if (state.lensActive && state.pointer && insideBoard(state.pointer.x, state.pointer.y)) {
        this.drawOverlayLayer(state, nowMs, true);
      }
    } else {
      this.drawOverlayLayer(state, nowMs, false);
    }

    this.drawTrail(state.trailNodes ?? [], nowMs);
    this.drawCat(state.cat, state.mode);

    ctx.restore();

    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = 4;
    ctx.strokeRect(BOARD_RECT.x, BOARD_RECT.y, BOARD_RECT.w, BOARD_RECT.h);
    if (state.mode === MODES.HACKER && state.lensActive && state.pointer && insideBoard(state.pointer.x, state.pointer.y)) {
      this.drawLensRing(state.pointer.x, state.pointer.y);
    }
  }

  drawGoal(goal, color, pulse) {
    if (!goal) {
      return;
    }
    const { ctx } = this;
    ctx.save();
    ctx.shadowBlur = pulse ? 28 : 18;
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    roundedRect(ctx, goal.x, goal.y, goal.w, goal.h, 7);
    ctx.fill();
    ctx.restore();
  }

  drawWalls(walls, mode, nowMs) {
    const { ctx } = this;
    for (const segment of walls) {
      ctx.save();
      const tunnelActive = segment.tunnelUntilMs > nowMs;
      if (tunnelActive && mode === MODES.NORMAL) {
        ctx.fillStyle = "rgba(8,8,8,0.35)";
        ctx.fillRect(segment.x, segment.y, segment.w, segment.h);
        ctx.strokeStyle = "rgba(245,245,245,0.84)";
        ctx.lineWidth = 1.6;
        ctx.strokeRect(segment.x, segment.y, segment.w, segment.h);

        for (let i = 0; i < 32; i += 1) {
          const px = segment.x + (((Math.sin(nowMs * 0.021 + i * 17.3) + 1) / 2) * segment.w);
          const py = segment.y + (((Math.cos(nowMs * 0.019 + i * 13.7) + 1) / 2) * segment.h);
          const alpha = 0.23 + (((i * 29) % 7) / 10) * 0.2;
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.fillRect(px, py, 2, 2);
        }

        ctx.strokeStyle = "rgba(250,250,250,0.3)";
        for (let i = 0; i < 6; i += 1) {
          const y = segment.y + ((i + 1) * segment.h) / 7;
          ctx.beginPath();
          ctx.moveTo(segment.x, y);
          ctx.lineTo(segment.x + segment.w, y + ((i % 2) * 2 - 1) * 4);
          ctx.stroke();
        }
      } else {
        if (this.patterns.wall && mode === MODES.NORMAL) {
          ctx.fillStyle = this.patterns.wall;
        } else {
          ctx.fillStyle = mode === MODES.HACKER ? "rgba(60,60,60,0.95)" : "rgba(225,190,255,0.95)";
        }
        ctx.fillRect(segment.x, segment.y, segment.w, segment.h);
        ctx.strokeStyle = "rgba(255,255,255,0.98)";
        ctx.lineWidth = 2.2;
        ctx.strokeRect(segment.x, segment.y, segment.w, segment.h);
      }
      ctx.restore();
    }
  }

  drawOverlayLayer(state, nowMs, clipToLens) {
    const { ctx } = this;
    if (clipToLens && state.pointer) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(state.pointer.x, state.pointer.y, HACKER_LENS_RADIUS, 0, Math.PI * 2);
      ctx.clip();
    }

    this.drawEffects(state.effects ?? [], nowMs, state.level?.walls ?? []);

    if (state.pointer && insideBoard(state.pointer.x, state.pointer.y)) {
      const previewTool = state.draggingTool || state.selectedTool;
      if (previewTool) {
        this.drawEffectPreview(previewTool, state.pointer.x, state.pointer.y);
      }
    }

    if (clipToLens && state.pointer) {
      ctx.restore();
    }
  }

  drawCat(cat, mode) {
    if (!cat) {
      return;
    }
    const { ctx } = this;
    const sprite = mode === MODES.HACKER ? this.images.catHacker : this.images.catNormal;
    const size = cat.radius * 3.2;
    const x = cat.x - size / 2;
    const y = cat.y - size / 2;

    if (cat.inTunnel) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.globalCompositeOperation = "screen";
      ctx.filter = "saturate(1.4)";
      ctx.drawImage(sprite, x - 11, y, size, size);
      ctx.fillStyle = "rgba(255,40,40,0.35)";
      ctx.fillRect(x - 11, y, size, size);
      ctx.drawImage(sprite, x + 11, y, size, size);
      ctx.fillStyle = "rgba(60,70,255,0.35)";
      ctx.fillRect(x + 11, y, size, size);
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = 0.96;
    ctx.shadowBlur = mode === MODES.HACKER ? 18 : 26;
    ctx.shadowColor = mode === MODES.HACKER ? "#42ff54" : "#fceaff";
    ctx.drawImage(sprite, x, y, size, size);
    ctx.restore();
  }

  drawEffects(effects, nowMs, walls) {
    for (const effect of effects) {
      if (effect.toolId === "heat") {
        this.drawHeatEffect(effect.x, effect.y, effect.radius, effect.remainingMs / 2000);
      } else if (effect.toolId === "cold") {
        this.drawColdEffect(effect.x, effect.y, effect.radius, effect.remainingMs / 2000);
      } else if (effect.toolId === "mass") {
        this.drawMassEffect(effect.x, effect.y, effect.radius, effect.remainingMs / Math.max(effect.lifetimeMs, 1));
      } else if (effect.toolId === "highPressure" || effect.toolId === "vacuum") {
        this.drawImpulseParticles(effect, nowMs);
      } else if (effect.toolId === "tunneling") {
        this.drawTunnelEffect(effect, nowMs, walls);
      }
    }
  }

  drawEffectPreview(toolId, x, y) {
    if (toolId === "heat") {
      this.drawHeatEffect(x, y, 148, 1);
      return;
    }
    if (toolId === "cold") {
      this.drawColdEffect(x, y, 148, 1);
      return;
    }
    if (toolId === "mass") {
      this.drawMassPreview(x, y, 210);
      return;
    }
    if (toolId === "highPressure" || toolId === "vacuum") {
      this.drawImpulsePreview(toolId, x, y, toolId === "highPressure" ? 190 : 230);
      return;
    }
    if (toolId === "tunneling") {
      this.drawTunnelPreview(x, y);
    }
  }

  drawHeatEffect(x, y, radius, strength = 1) {
    const { ctx } = this;
    ctx.save();
    const gradient = ctx.createRadialGradient(x, y, radius * 0.15, x, y, radius);
    gradient.addColorStop(0, `rgba(255,196,133,${0.55 * strength})`);
    gradient.addColorStop(1, "rgba(255,122,44,0.02)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    const step = 34;
    for (let gy = -radius + step; gy < radius; gy += step) {
      for (let gx = -radius + step; gx < radius; gx += step) {
        const dist = Math.hypot(gx, gy);
        if (dist > radius - 10 || dist < 14) {
          continue;
        }
        const scale = (1 - dist / radius) * 11 * strength;
        drawVectorArrow(ctx, x + gx, y + gy, (gx / dist) * scale, (gy / dist) * scale, "#ff8a43", 0.65);
      }
    }
    ctx.restore();
  }

  drawColdEffect(x, y, radius, strength = 1) {
    const { ctx } = this;
    ctx.save();
    const gradient = ctx.createRadialGradient(x, y, radius * 0.1, x, y, radius);
    gradient.addColorStop(0, `rgba(214,245,255,${0.5 * strength})`);
    gradient.addColorStop(1, "rgba(100,173,255,0.03)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(210,242,255,0.7)";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 18; i += 1) {
      const a = (i / 18) * Math.PI * 2;
      const sx = x + Math.cos(a) * (radius * 0.3);
      const sy = y + Math.sin(a) * (radius * 0.3);
      const ex = x + Math.cos(a) * (radius * 0.9);
      const ey = y + Math.sin(a) * (radius * 0.9);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawMassPreview(x, y, radius) {
    this.drawMassEffect(x, y, radius, 1);
  }

  drawMassEffect(x, y, radius, strength = 1) {
    const { ctx } = this;
    ctx.save();
    const glow = ctx.createRadialGradient(x, y, radius * 0.1, x, y, radius);
    glow.addColorStop(0, `rgba(91,231,255,${0.3 * strength})`);
    glow.addColorStop(1, "rgba(91,231,255,0.02)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();

    ctx.strokeStyle = `rgba(91,231,255,${0.46 * strength})`;
    ctx.lineWidth = 1.2;
    const spacing = 26;
    for (let gx = x - radius; gx <= x + radius; gx += spacing) {
      ctx.beginPath();
      let started = false;
      for (let py = y - radius; py <= y + radius; py += 10) {
        const dx = x - gx;
        const dy = y - py;
        const dist = Math.hypot(dx, dy);
        if (dist > radius) {
          started = false;
          continue;
        }
        const warp = Math.max(0, 1 - dist / radius) * 14;
        const nx = dist > 0 ? dx / dist : 0;
        const ny = dist > 0 ? dy / dist : 0;
        const wx = gx + nx * warp;
        const wy = py + ny * warp;
        if (!started) {
          ctx.moveTo(wx, wy);
          started = true;
        } else {
          ctx.lineTo(wx, wy);
        }
      }
      ctx.stroke();
    }

    for (let gy = y - radius; gy <= y + radius; gy += spacing) {
      ctx.beginPath();
      let started = false;
      for (let px = x - radius; px <= x + radius; px += 10) {
        const dx = x - px;
        const dy = y - gy;
        const dist = Math.hypot(dx, dy);
        if (dist > radius) {
          started = false;
          continue;
        }
        const warp = Math.max(0, 1 - dist / radius) * 14;
        const nx = dist > 0 ? dx / dist : 0;
        const ny = dist > 0 ? dy / dist : 0;
        const wx = px + nx * warp;
        const wy = gy + ny * warp;
        if (!started) {
          ctx.moveTo(wx, wy);
          started = true;
        } else {
          ctx.lineTo(wx, wy);
        }
      }
      ctx.stroke();
    }

    ctx.strokeStyle = `rgba(91,231,255,${0.85 * strength})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    for (let gy = -radius + 30; gy < radius; gy += 44) {
      for (let gx = -radius + 30; gx < radius; gx += 44) {
        const dist = Math.hypot(gx, gy);
        if (dist > radius - 8 || dist < 8) {
          continue;
        }
        const pull = (1 - dist / radius) * 7 * strength;
        drawVectorArrow(ctx, x + gx, y + gy, (-gx / dist) * pull, (-gy / dist) * pull, "#70f0ff", 0.52);
      }
    }

    ctx.restore();
  }

  drawImpulsePreview(toolId, x, y, radius) {
    const { ctx } = this;
    ctx.save();
    ctx.strokeStyle = "rgba(250,250,250,0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();

    const dir = toolId === "highPressure" ? 1 : -1;
    for (let i = 0; i < 20; i += 1) {
      const a = (i / 20) * Math.PI * 2;
      const start = radius * (dir > 0 ? 0.2 : 0.9);
      const end = radius * (dir > 0 ? 0.92 : 0.25);
      drawVectorArrow(
        ctx,
        x + Math.cos(a) * start,
        y + Math.sin(a) * start,
        Math.cos(a) * (end - start),
        Math.sin(a) * (end - start),
        "#fafafa",
        0.35,
      );
    }
    ctx.restore();
  }

  drawTunnelPreview(x, y) {
    const { ctx } = this;
    ctx.save();
    ctx.strokeStyle = "rgba(205,76,255,0.95)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, 32, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawImpulseParticles(effect, nowMs) {
    const elapsed = nowMs - effect.createdAt;
    const life = Math.max(1, effect.particleLifetimeMs);
    const t = Math.min(1, elapsed / life);
    const count = 44;
    const inward = effect.toolId === "vacuum";
    const { ctx } = this;
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.76)";
    ctx.lineWidth = 1.3;
    for (let i = 0; i < count; i += 1) {
      const jitter = ((Math.sin(effect.seed + i * 12.17) + 1) / 2) * 0.08 - 0.04;
      const a = (i / count) * Math.PI * 2 + jitter;
      const spread = effect.radius * (0.25 + ((i + Math.floor(effect.seed)) % 7) * 0.08);
      const startR = inward ? spread : spread * t;
      const endR = inward ? spread * (1 - t) : spread * (0.1 + t);
      const sx = effect.x + Math.cos(a) * startR;
      const sy = effect.y + Math.sin(a) * startR;
      const ex = effect.x + Math.cos(a) * endR;
      const ey = effect.y + Math.sin(a) * endR;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawTunnelEffect(effect, nowMs, walls) {
    const wall = walls.find((item) => item.id === effect.tunnelWallId);
    if (!wall) {
      return;
    }
    const { ctx } = this;
    const life = Math.max(1, effect.lifetimeMs || 1);
    const remaining = Math.max(0, 1 - (nowMs - effect.createdAt) / life);
    ctx.save();
    ctx.fillStyle = `rgba(255,255,255,${0.12 + remaining * 0.2})`;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.strokeStyle = `rgba(250,250,250,${0.35 + remaining * 0.45})`;
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 8; i += 1) {
      const yy = wall.y + (i / 7) * wall.h;
      ctx.beginPath();
      ctx.moveTo(wall.x, yy);
      ctx.lineTo(wall.x + wall.w, yy + (i % 2 === 0 ? 4 : -4));
      ctx.stroke();
    }
    for (let i = 0; i < 26; i += 1) {
      const px = wall.x + (((Math.sin(effect.seed + i * 1.7 + nowMs * 0.02) + 1) / 2) * wall.w);
      const py = wall.y + (((Math.cos(effect.seed + i * 2.2 + nowMs * 0.018) + 1) / 2) * wall.h);
      ctx.fillStyle = `rgba(255,255,255,${0.2 + ((i * 3) % 7) * 0.08})`;
      ctx.fillRect(px, py, 1.8, 1.8);
    }
    ctx.restore();
  }

  drawLensRing(x, y) {
    const { ctx } = this;
    ctx.save();
    ctx.strokeStyle = "rgba(150,255,170,0.85)";
    ctx.lineWidth = 2;
    ctx.shadowBlur = 14;
    ctx.shadowColor = "rgba(100,255,122,0.85)";
    ctx.beginPath();
    ctx.arc(x, y, HACKER_LENS_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawTrail(nodes, nowMs) {
    if (!nodes || nodes.length < 2) {
      return;
    }
    const { ctx } = this;
    ctx.save();
    for (let i = 1; i < nodes.length; i += 1) {
      const a = nodes[i - 1];
      const b = nodes[i];
      const age = nowMs - b.ts;
      const alpha = Math.max(0, 1 - age / 1700) * 0.86;
      if (alpha <= 0.02) {
        continue;
      }
      ctx.strokeStyle = withAlpha(b.color, alpha);
      ctx.lineWidth = 4.2;
      ctx.lineCap = "round";
      ctx.shadowBlur = 10;
      ctx.shadowColor = withAlpha(b.color, alpha * 0.85);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawModeToggle(mode) {
    const { ctx } = this;
    const color = mode === MODES.HACKER ? "#6bff7f" : "#f1d0ff";
    roundedRect(ctx, MODE_TOGGLE_RECT.x, MODE_TOGGLE_RECT.y, MODE_TOGGLE_RECT.w, MODE_TOGGLE_RECT.h, 8);
    ctx.fillStyle = "rgba(0,0,0,0.62)";
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 12;
    ctx.shadowColor = color;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = color;
    ctx.font = "20px Times New Roman";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`MODE: ${mode === MODES.HACKER ? "HACKER" : "NORMAL"} (H)`, MODE_TOGGLE_RECT.x + MODE_TOGGLE_RECT.w / 2, MODE_TOGGLE_RECT.y + MODE_TOGGLE_RECT.h / 2 + 1);
  }

  drawHint(text) {
    if (!text) {
      return;
    }
    const { ctx } = this;
    ctx.fillStyle = "rgba(235,235,255,0.72)";
    ctx.font = "20px Times New Roman";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(text, BOARD_RECT.x + BOARD_RECT.w / 2, CANVAS_HEIGHT - 10);
  }

  drawStatus(state) {
    const { ctx } = this;
    if (state.runComplete) {
      ctx.fillStyle = "rgba(223,255,240,0.95)";
      ctx.font = "40px Times New Roman";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("JUDGE RUN COMPLETE", BOARD_RECT.x + BOARD_RECT.w / 2, BOARD_RECT.y + BOARD_RECT.h / 2);
      return;
    }

    if (state.levelCleared) {
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "28px Times New Roman";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Level Cleared", BOARD_RECT.x + BOARD_RECT.w / 2, BOARD_RECT.y + BOARD_RECT.h / 2);
    }
  }
}

function insideBoard(x, y) {
  return x >= BOARD_RECT.x && x <= BOARD_RECT.x + BOARD_RECT.w && y >= BOARD_RECT.y && y <= BOARD_RECT.y + BOARD_RECT.h;
}

function withAlpha(color, alpha) {
  const cleaned = color.replace("#", "");
  const value = cleaned.length === 3 ? cleaned.split("").map((ch) => ch + ch).join("") : cleaned;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
}
