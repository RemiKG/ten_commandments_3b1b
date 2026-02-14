import { COLORS, LAYOUT, TOOL_BY_ID, TOOLS, WORLD_HEIGHT, WORLD_WIDTH } from "./config.js";
import { clamp, length, lerp, valueNoise2D } from "./math.js";
import { TOOL_OVERLAY_KIND } from "./fieldModes.js";
import { getSidebarItemRect, pointInBoard } from "./uiLayout.js";

export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  render(physics, input, gameState, particles) {
    const ctx = this.ctx;

    ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this._drawBackground(gameState.activeTool);
    this._drawTitle(gameState);

    this._drawFieldLens(
      gameState.activeTool,
      input.pointerX,
      input.pointerY,
      gameState.applyingTool || pointInBoard(input.pointerX, input.pointerY),
    );

    this._drawBoardFrame();
    this._drawTunnelWallEffects(physics);
    this._drawWalls(physics.walls, physics.disabledWalls);
    this._drawParticles(particles);
    this._drawTrail(physics.trail, physics.balloon.temperature);
    this._drawBalloon(physics.balloon);

    this._drawCrosshair(input.pointerX, input.pointerY, TOOL_BY_ID[gameState.activeTool].accent);
    this._drawSidebar(gameState.activeTool);
    this._drawCornerDiamond();
  }

  _drawBackground(activeTool) {
    const ctx = this.ctx;

    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    const vignette = ctx.createRadialGradient(
      WORLD_WIDTH * 0.5,
      WORLD_HEIGHT * 0.45,
      WORLD_WIDTH * 0.05,
      WORLD_WIDTH * 0.5,
      WORLD_HEIGHT * 0.5,
      WORLD_WIDTH * 0.63,
    );
    vignette.addColorStop(0, "rgba(255,255,255,0.06)");
    vignette.addColorStop(0.6, "rgba(255,255,255,0.012)");
    vignette.addColorStop(1, "rgba(0,0,0,0.48)");

    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    if (activeTool === "mass" || activeTool === "darkEnergy") {
      ctx.save();
      ctx.strokeStyle = "rgba(89,236,255,0.17)";
      ctx.lineWidth = 1;
      const spacing = 36;

      for (let x = 0; x <= WORLD_WIDTH; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, WORLD_HEIGHT);
        ctx.stroke();
      }

      for (let y = 0; y <= WORLD_HEIGHT; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(WORLD_WIDTH, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = 0.052;
    for (let i = 0; i < 1400; i += 1) {
      const x = (i * 97.31) % WORLD_WIDTH;
      const y = (i * 189.17) % WORLD_HEIGHT;
      const size = i % 3 === 0 ? 2 : 1;
      ctx.fillStyle = i % 7 === 0 ? "rgba(100,200,255,0.15)" : "rgba(255,255,255,0.26)";
      ctx.fillRect(x, y, size, size);
    }
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = "rgba(255,255,255,0.045)";
    ctx.lineWidth = 1;
    for (let y = 0.5; y < WORLD_HEIGHT; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WORLD_WIDTH, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawFieldLens(activeTool, cx, cy, visible) {
    if (!visible || !pointInBoard(cx, cy)) {
      return;
    }

    const ctx = this.ctx;
    const lensRadius = LAYOUT.lensRadius;
    const overlayKind = TOOL_OVERLAY_KIND[activeTool];
    const useWorldLens = overlayKind === "gravity_in" || overlayKind === "gravity_out";

    ctx.save();
    if (useWorldLens) {
      this._clipLens(cx, cy, lensRadius);
    } else {
      this._clipBoardLens(cx, cy, lensRadius);
    }

    switch (overlayKind) {
      case "thermal_out":
        this._drawThermalField(cx, cy, true);
        break;
      case "thermal_in":
        this._drawThermalField(cx, cy, false);
        break;
      case "gravity_in":
        this._drawGravityField(cx, cy, true, { x: 0, y: 0, width: WORLD_WIDTH, height: WORLD_HEIGHT });
        break;
      case "gravity_out":
        this._drawGravityField(cx, cy, false, { x: 0, y: 0, width: WORLD_WIDTH, height: WORLD_HEIGHT });
        break;
      case "pressure_out":
        this._drawPressureField(cx, cy, false);
        break;
      case "pressure_in":
        this._drawPressureField(cx, cy, true);
        break;
      case "noise_purple":
        this._drawNoiseCloud(cx, cy, "rgba(205,76,255,0.55)");
        break;
      case "noise_cold":
        this._drawNoiseCloud(cx, cy, "rgba(180,220,255,0.42)");
        break;
      case "rings":
        this._drawRingField(cx, cy, "rgba(255,255,255,0.5)");
        break;
      case "entropy":
        this._drawEntropyField(cx, cy);
        break;
      default:
        break;
    }

    ctx.restore();

    ctx.save();
    ctx.strokeStyle = TOOL_BY_ID[activeTool].accent;
    ctx.lineWidth = 1.4;
    ctx.globalAlpha = 0.55;
    ctx.shadowColor = TOOL_BY_ID[activeTool].accent;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(cx, cy, lensRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  _clipLens(cx, cy, radius) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();
  }

  _clipBoardLens(cx, cy, radius) {
    const ctx = this.ctx;
    const board = LAYOUT.board;

    ctx.beginPath();
    ctx.rect(board.x, board.y, board.width, board.height);
    ctx.clip();

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();
  }

  _drawThermalField(cx, cy, isHeat) {
    const ctx = this.ctx;
    const radius = LAYOUT.lensRadius;
    const color = isHeat ? "255,122,40" : "145,219,255";

    const gradient = ctx.createRadialGradient(cx, cy, radius * 0.06, cx, cy, radius * 1.05);
    gradient.addColorStop(0, `rgba(${color},0.72)`);
    gradient.addColorStop(0.52, `rgba(${color},0.22)`);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(LAYOUT.board.x, LAYOUT.board.y, LAYOUT.board.width, LAYOUT.board.height);

    this._drawVectorField(cx, cy, {
      inward: !isHeat,
      color: `rgba(${color},0.95)`,
      spacing: 42,
      length: 10,
      alphaMultiplier: 0.9,
    });
  }

  _drawGravityField(cx, cy, inward, area = LAYOUT.board) {
    this._drawWarpedGrid(cx, cy, {
      color: "rgba(89,236,255,0.6)",
      inward,
      area,
    });

    this._drawVectorField(cx, cy, {
      inward,
      color: "rgba(89,236,255,0.9)",
      spacing: 42,
      length: 11,
      alphaMultiplier: 0.9,
      area,
    });
  }

  _drawPressureField(cx, cy, inward) {
    const color = inward ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.9)";
    this._drawVectorField(cx, cy, {
      inward,
      color,
      spacing: inward ? 32 : 38,
      length: inward ? 26 : 18,
      alphaMultiplier: 1,
      streakMode: true,
    });
  }

  _drawEntropyField(cx, cy) {
    const ctx = this.ctx;
    const board = LAYOUT.board;
    const spacing = 36;
    const radius = LAYOUT.lensRadius;

    ctx.save();
    for (let y = board.y + spacing * 0.5; y < board.y + board.height; y += spacing) {
      for (let x = board.x + spacing * 0.5; x < board.x + board.width; x += spacing) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.hypot(dx, dy);
        if (dist > radius * 1.05) {
          continue;
        }

        const influence = clamp(1 - dist / radius, 0, 1);
        const noise = valueNoise2D(x * 0.04, y * 0.04);
        const angle = noise * Math.PI * 2;
        const len = lerp(4, 16, influence);
        const ex = x + Math.cos(angle) * len;
        const ey = y + Math.sin(angle) * len;

        ctx.strokeStyle = `rgba(255,255,255,${0.18 + influence * 0.72})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  _drawNoiseCloud(cx, cy, tint) {
    const ctx = this.ctx;
    const radius = LAYOUT.lensRadius;

    const cloud = ctx.createRadialGradient(cx, cy, radius * 0.08, cx, cy, radius);
    cloud.addColorStop(0, tint);
    cloud.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = cloud;
    ctx.fillRect(LAYOUT.board.x, LAYOUT.board.y, LAYOUT.board.width, LAYOUT.board.height);

    ctx.save();
    ctx.globalAlpha = 0.65;
    for (let i = 0; i < 450; i += 1) {
      const angle = i * 0.41;
      const ring = ((i * 73) % 1000) / 1000;
      const r = ring * radius;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      const w = i % 2 === 0 ? 1 : 2;
      const h = i % 3 === 0 ? 2 : 1;
      ctx.fillStyle = i % 4 === 0 ? "rgba(255,255,255,0.52)" : "rgba(255,255,255,0.24)";
      ctx.fillRect(x, y, w, h);
    }
    ctx.restore();
  }

  _drawRingField(cx, cy, color) {
    const ctx = this.ctx;
    ctx.save();
    for (let i = 0; i < 4; i += 1) {
      const radius = 36 + i * 44;
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.55 - i * 0.1;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawWarpedGrid(cx, cy, { color, inward, area = LAYOUT.board }) {
    const ctx = this.ctx;
    const spacing = 40;
    const warpRadius = LAYOUT.lensRadius * 1.1;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;

    const warp = (x, y) => {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const influence = clamp(1 - dist / warpRadius, 0, 1);
      const direction = inward ? -1 : 1;
      const offset = direction * influence * influence * 52;
      return {
        x: x + (dx / dist) * offset,
        y: y + (dy / dist) * offset,
      };
    };

    for (let x = area.x; x <= area.x + area.width; x += spacing) {
      ctx.beginPath();
      for (let y = area.y; y <= area.y + area.height; y += 12) {
        const p = warp(x, y);
        if (y === area.y) {
          ctx.moveTo(p.x, p.y);
        } else {
          ctx.lineTo(p.x, p.y);
        }
      }
      ctx.stroke();
    }

    for (let y = area.y; y <= area.y + area.height; y += spacing) {
      ctx.beginPath();
      for (let x = area.x; x <= area.x + area.width; x += 12) {
        const p = warp(x, y);
        if (x === area.x) {
          ctx.moveTo(p.x, p.y);
        } else {
          ctx.lineTo(p.x, p.y);
        }
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  _drawVectorField(cx, cy, options) {
    const ctx = this.ctx;
    const area = options.area ?? LAYOUT.board;
    const radius = LAYOUT.lensRadius;

    const spacing = options.spacing ?? 42;
    const baseLength = options.length ?? 12;
    const inward = Boolean(options.inward);
    const streakMode = Boolean(options.streakMode);

    ctx.save();
    for (let y = area.y + spacing * 0.5; y < area.y + area.height; y += spacing) {
      for (let x = area.x + spacing * 0.5; x < area.x + area.width; x += spacing) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.hypot(dx, dy);

        if (dist > radius * 1.08 || dist < 1.5) {
          continue;
        }

        const influence = clamp(1 - dist / radius, 0, 1);
        const alpha = clamp(influence * (options.alphaMultiplier ?? 1), 0, 1);

        if (alpha <= 0.03) {
          continue;
        }

        const invDist = 1 / dist;
        const dir = inward ? -1 : 1;
        const nx = dx * invDist * dir;
        const ny = dy * invDist * dir;

        const len = baseLength * (0.38 + influence * (streakMode ? 2.2 : 1.4));
        const startX = streakMode ? x - nx * len * 0.15 : x;
        const startY = streakMode ? y - ny * len * 0.15 : y;
        const endX = x + nx * len;
        const endY = y + ny * len;

        ctx.strokeStyle = withAlpha(options.color, clamp(alpha, 0.04, 0.98));
        ctx.lineWidth = streakMode ? 1.4 : 1.7;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        if (!streakMode) {
          const head = 3.2;
          ctx.beginPath();
          ctx.moveTo(endX, endY);
          ctx.lineTo(endX - nx * head + ny * head * 0.8, endY - ny * head - nx * head * 0.8);
          ctx.moveTo(endX, endY);
          ctx.lineTo(endX - nx * head - ny * head * 0.8, endY - ny * head + nx * head * 0.8);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  _drawTunnelWallEffects(physics) {
    const ctx = this.ctx;
    const tracked = new Map();

    if (physics.tunnelPreview?.wall) {
      tracked.set(physics.tunnelPreview.wall.id, physics.tunnelPreview.wall);
    }

    for (const wallId of physics.disabledWalls.keys()) {
      const wall = physics.walls.find((item) => item.id === wallId);
      if (wall) {
        tracked.set(wall.id, wall);
      }
    }

    if (tracked.size === 0) {
      return;
    }

    ctx.save();
    for (const wall of tracked.values()) {
      this._drawWallNoiseBand(wall);
      this._drawWallWireframe(wall);
    }
    ctx.restore();
  }

  _drawWallNoiseBand(wall) {
    const ctx = this.ctx;
    const dx = wall.b.x - wall.a.x;
    const dy = wall.b.y - wall.a.y;
    const segLen = Math.hypot(dx, dy) || 1;
    const tx = dx / segLen;
    const ty = dy / segLen;
    const px = -ty;
    const py = tx;

    const samples = Math.max(34, Math.floor(segLen / 4));
    for (let i = 0; i < samples; i += 1) {
      const t = i / samples;
      const jitter = (Math.random() - 0.5) * 36;
      const spread = (Math.random() - 0.5) * 12;
      const x = wall.a.x + dx * t + px * jitter + tx * spread;
      const y = wall.a.y + dy * t + py * jitter + ty * spread;
      const size = Math.random() > 0.75 ? 2 : 1;
      ctx.fillStyle = Math.random() > 0.45 ? "rgba(255,255,255,0.42)" : "rgba(255,255,255,0.18)";
      ctx.fillRect(x, y, size, size);
    }
  }

  _drawWallWireframe(wall) {
    const ctx = this.ctx;
    const dx = wall.b.x - wall.a.x;
    const dy = wall.b.y - wall.a.y;
    const segLen = Math.hypot(dx, dy) || 1;
    const tx = dx / segLen;
    const ty = dy / segLen;
    const px = -ty;
    const py = tx;

    const steps = Math.max(14, Math.floor(segLen / 30));
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1;

    for (let i = 0; i < steps - 1; i += 1) {
      const t0 = i / steps;
      const t1 = (i + 1) / steps;

      const baseX0 = wall.a.x + dx * t0;
      const baseY0 = wall.a.y + dy * t0;
      const baseX1 = wall.a.x + dx * t1;
      const baseY1 = wall.a.y + dy * t1;

      const wobble0 = (Math.random() - 0.5) * 26;
      const wobble1 = (Math.random() - 0.5) * 26;

      const upX0 = baseX0 + px * wobble0;
      const upY0 = baseY0 + py * wobble0;
      const upX1 = baseX1 + px * wobble1;
      const upY1 = baseY1 + py * wobble1;

      ctx.beginPath();
      ctx.moveTo(upX0, upY0);
      ctx.lineTo(upX1, upY1);
      ctx.lineTo(baseX1, baseY1);
      ctx.lineTo(baseX0, baseY0);
      ctx.closePath();
      ctx.stroke();
    }
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

  _drawWalls(walls, disabledWalls) {
    const ctx = this.ctx;
    ctx.save();
    ctx.lineWidth = 2;

    for (const wall of walls) {
      if (wall.isFrame) {
        continue;
      }

      const disabled = disabledWalls.has(wall.id);
      ctx.strokeStyle = disabled ? "rgba(255,255,255,0.28)" : COLORS.lineWhite;
      ctx.setLineDash(disabled ? [5, 6] : []);

      ctx.beginPath();
      ctx.moveTo(wall.a.x, wall.a.y);
      ctx.lineTo(wall.b.x, wall.b.y);
      ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.restore();
  }

  _drawParticles(particles) {
    if (!particles || particles.items.length === 0) {
      return;
    }

    const ctx = this.ctx;
    const board = LAYOUT.board;

    ctx.save();
    ctx.beginPath();
    ctx.rect(board.x, board.y, board.width, board.height);
    ctx.clip();

    for (const particle of particles.items) {
      const lifeT = 1 - particle.age / particle.life;
      if (lifeT <= 0) {
        continue;
      }

      const alpha = particle.alpha * lifeT;
      const trailScale = particle.kind === "vacuum" ? 0.03 : 0.018;
      const x0 = particle.x - particle.vx * trailScale;
      const y0 = particle.y - particle.vy * trailScale;
      const x1 = particle.x + particle.vx * trailScale * 0.22;
      const y1 = particle.y + particle.vy * trailScale * 0.22;

      ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
      ctx.lineWidth = particle.size;
      ctx.shadowColor = "rgba(255,255,255,0.7)";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }

    ctx.restore();
  }

  _drawTrail(trail, temperature) {
    if (trail.length < 2) {
      return;
    }

    const ctx = this.ctx;
    const warm = Math.max(temperature, 0);
    const cool = Math.max(-temperature, 0);

    ctx.save();
    for (let i = 1; i < trail.length; i += 1) {
      const prev = trail[i - 1];
      const node = trail[i];
      const alpha = clamp(node.life, 0, 1) * 0.86;

      const r = Math.round(255 - cool * 28);
      const g = Math.round(255 - warm * 24 + cool * 8);
      const b = Math.round(255 - warm * 54 + cool * 38);

      ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.lineWidth = 1.2 + alpha * 4.8;
      ctx.shadowColor = `rgba(${r},${g},${b},0.58)`;
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
    const warm = Math.max(balloon.temperature, 0);
    const cool = Math.max(-balloon.temperature, 0);

    if (balloon.tunnelGhost > 0.01) {
      this._drawBalloonGhosts(balloon);
    }

    ctx.save();

    if (warm > 0.02) {
      const heatGlow = ctx.createRadialGradient(
        balloon.x,
        balloon.y,
        balloon.radius * 0.8,
        balloon.x,
        balloon.y,
        balloon.radius * 2.6,
      );
      heatGlow.addColorStop(0, `rgba(255,160,70,${warm * 0.46})`);
      heatGlow.addColorStop(1, "rgba(255,160,70,0)");
      ctx.fillStyle = heatGlow;
      ctx.fillRect(balloon.x - balloon.radius * 3, balloon.y - balloon.radius * 3, balloon.radius * 6, balloon.radius * 6);
    }

    const fillR = Math.round(252 - cool * 18);
    const fillG = Math.round(252 - warm * 24 + cool * 4);
    const fillB = Math.round(252 - warm * 44 + cool * 26);

    ctx.beginPath();
    ctx.arc(balloon.x, balloon.y, balloon.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${fillR},${fillG},${fillB},0.985)`;

    if (warm >= cool) {
      const shadowAlpha = clamp(0.7 + warm * 0.3, 0.6, 1);
      ctx.shadowColor = `rgba(255,${Math.round(220 - warm * 70)},${Math.round(180 - warm * 110)},${shadowAlpha})`;
    } else {
      const shadowAlpha = clamp(0.7 + cool * 0.3, 0.6, 1);
      ctx.shadowColor = `rgba(${Math.round(220 - cool * 40)},${Math.round(242 - cool * 20)},255,${shadowAlpha})`;
    }

    ctx.shadowBlur = 56;
    ctx.fill();

    if (cool > 0.03) {
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = `rgba(200,235,255,${0.3 + cool * 0.35})`;
      ctx.stroke();
    }

    const spec = ctx.createRadialGradient(
      balloon.x - balloon.radius * 0.24,
      balloon.y - balloon.radius * 0.35,
      balloon.radius * 0.05,
      balloon.x,
      balloon.y,
      balloon.radius,
    );
    spec.addColorStop(0, "rgba(255,255,255,0.6)");
    spec.addColorStop(1, "rgba(255,255,255,0.02)");
    ctx.fillStyle = spec;
    ctx.fill();
    ctx.restore();
  }

  _drawBalloonGhosts(balloon) {
    const ctx = this.ctx;
    const ghost = clamp(balloon.tunnelGhost, 0, 1);

    const velocityLen = length(balloon.vx, balloon.vy) || 1;
    const nx = balloon.vx / velocityLen;
    const ny = balloon.vy / velocityLen;
    const px = -ny;
    const py = nx;

    const spread = 18 * ghost;
    const configs = [
      { r: 255, g: 80, b: 80, ox: -spread + px * 4, oy: py * 4 },
      { r: 110, g: 255, b: 120, ox: 0, oy: 0 },
      { r: 80, g: 110, b: 255, ox: spread - px * 4, oy: -py * 4 },
    ];

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (const c of configs) {
      ctx.beginPath();
      ctx.arc(balloon.x + c.ox, balloon.y + c.oy, balloon.radius * 0.97, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${0.34 + ghost * 0.26})`;
      ctx.shadowColor = `rgba(${c.r},${c.g},${c.b},0.8)`;
      ctx.shadowBlur = 24;
      ctx.fill();
    }
    ctx.restore();
  }

  _drawCrosshair(x, y, accent) {
    const ctx = this.ctx;
    const size = LAYOUT.crosshairSize;

    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255,255,255,0.93)";
    ctx.shadowColor = accent;
    ctx.shadowBlur = 9;
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

    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.92)";
    ctx.fillStyle = "rgba(4, 9, 12, 0.86)";
    roundRect(ctx, sidebar.x, sidebar.y, sidebar.width, sidebar.height, sidebar.radius);
    ctx.fill();
    ctx.stroke();

    for (let i = 0; i < TOOLS.length; i += 1) {
      const tool = TOOLS[i];
      const rect = getSidebarItemRect(i);
      const isActive = tool.id === activeTool;

      if (isActive) {
        const glow = ctx.createRadialGradient(
          rect.x + rect.width * 0.5,
          rect.y + rect.height * 0.5,
          2,
          rect.x + rect.width * 0.5,
          rect.y + rect.height * 0.5,
          rect.width * 0.7,
        );
        glow.addColorStop(0, `${tool.accent}cc`);
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(rect.x - 2, rect.y - 2, rect.width + 4, rect.height + 4);
      }

      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.beginPath();
      ctx.moveTo(rect.x + 8, rect.y);
      ctx.lineTo(rect.x + rect.width - 8, rect.y);
      ctx.stroke();

      const iconColor = isActive ? tool.accent : "rgba(255,255,255,0.9)";
      this._drawSidebarGlyph(tool.id, rect, iconColor);
    }

    ctx.restore();
  }

  _drawSidebarGlyph(toolId, rect, color) {
    const cx = rect.x + rect.width * 0.5;
    const cy = rect.y + rect.height * 0.54;
    const ctx = this.ctx;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    switch (toolId) {
      case "heat":
        this._drawThermometerIcon(cx, cy, true);
        break;
      case "cold":
        this._drawThermometerIcon(cx, cy, false);
        break;
      case "mass":
        this._drawVectorIcon(cx, cy, "M", true);
        break;
      case "darkEnergy":
        this._drawVectorIcon(cx, cy, "L", false);
        break;
      case "highPressure":
        this._drawVectorIcon(cx, cy, "P", false);
        break;
      case "vacuum":
        this._drawVectorIcon(cx, cy, "P", true);
        break;
      case "tunneling":
        this._drawPsiIcon(cx, cy);
        break;
      case "viscosity":
        this._drawViscosityIcon(cx, cy);
        break;
      case "elasticity":
        this._drawSpringIcon(cx, cy);
        break;
      case "entropy":
        this._drawEntropyIcon(cx, cy);
        break;
      default:
        ctx.font = "30px Times New Roman";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("?", cx, cy);
        break;
    }

    ctx.restore();
  }

  _drawThermometerIcon(cx, cy, hot) {
    const ctx = this.ctx;
    const top = cy - 18;
    const bottom = cy + 12;

    ctx.beginPath();
    ctx.arc(cx - 10, bottom + 4, 6, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 10, top);
    ctx.lineTo(cx - 10, bottom);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + 3, cy + (hot ? -8 : 8));
    ctx.lineTo(cx + 16, cy + (hot ? -8 : 8));
    ctx.stroke();

    ctx.beginPath();
    if (hot) {
      ctx.moveTo(cx + 14, cy - 11);
      ctx.lineTo(cx + 16, cy - 8);
      ctx.lineTo(cx + 14, cy - 5);
    } else {
      ctx.moveTo(cx + 14, cy + 5);
      ctx.lineTo(cx + 16, cy + 8);
      ctx.lineTo(cx + 14, cy + 11);
    }
    ctx.stroke();

    ctx.font = "15px Times New Roman";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("dT", cx + 18, cy + (hot ? -8 : 8));
  }

  _drawVectorIcon(cx, cy, letter, inward) {
    const ctx = this.ctx;

    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = "26px Times New Roman";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(letter, cx, cy + 1);

    const arrows = [
      { x: 0, y: -21 },
      { x: 21, y: 0 },
      { x: 0, y: 21 },
      { x: -21, y: 0 },
    ];

    for (const arrow of arrows) {
      const x0 = cx + arrow.x * (inward ? 1 : 0.35);
      const y0 = cy + arrow.y * (inward ? 1 : 0.35);
      const x1 = cx + arrow.x * (inward ? 0.35 : 1);
      const y1 = cy + arrow.y * (inward ? 0.35 : 1);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
  }

  _drawPsiIcon(cx, cy) {
    const ctx = this.ctx;

    ctx.font = "30px Times New Roman";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Y", cx - 9, cy - 3);

    ctx.beginPath();
    ctx.moveTo(cx + 1, cy + 8);
    ctx.lineTo(cx + 24, cy + 8);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + 12, cy - 10);
    ctx.lineTo(cx + 12, cy + 8);
    ctx.stroke();
  }

  _drawViscosityIcon(cx, cy) {
    const ctx = this.ctx;

    ctx.font = "30px Times New Roman";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("n", cx - 10, cy - 2);

    for (let i = -1; i <= 1; i += 1) {
      const y = cy + i * 8;
      ctx.beginPath();
      ctx.moveTo(cx - 2, y);
      ctx.lineTo(cx + 24, y);
      ctx.stroke();
    }
  }

  _drawSpringIcon(cx, cy) {
    const ctx = this.ctx;

    ctx.font = "30px Times New Roman";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("k", cx - 11, cy - 2);

    ctx.beginPath();
    ctx.moveTo(cx + 2, cy - 14);
    for (let i = 0; i < 8; i += 1) {
      const x = cx + 2 + i * 3;
      const y = cy - 14 + i * 4;
      ctx.lineTo(x + (i % 2 === 0 ? 4 : -4), y);
    }
    ctx.stroke();
  }

  _drawEntropyIcon(cx, cy) {
    const ctx = this.ctx;

    ctx.font = "31px Times New Roman";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("S", cx - 11, cy - 2);

    for (let i = 0; i < 9; i += 1) {
      const x = cx + 2 + (i % 3) * 8;
      const y = cy - 10 + Math.floor(i / 3) * 8;
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
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

function withAlpha(color, alpha) {
  if (color.startsWith("rgba(")) {
    const inner = color.slice(5, -1);
    const parts = inner.split(",").map((part) => part.trim());
    return `rgba(${parts[0]},${parts[1]},${parts[2]},${alpha})`;
  }

  if (color.startsWith("rgb(")) {
    const inner = color.slice(4, -1);
    return `rgba(${inner},${alpha})`;
  }

  return `rgba(255,255,255,${alpha})`;
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

