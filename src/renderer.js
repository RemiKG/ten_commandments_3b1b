import { GOAL_RADIUS, STAGES, getGoalRodPosition } from "./config.js";
import { COLORS, LAYOUT, TOOL_BY_ID, TOOLS, VISUAL_MODES, WORLD_HEIGHT, WORLD_WIDTH } from "./config.js";
import { ASSET_FALLBACKS, createImageRegistry } from "./assetsV2.js";
import { clamp, length } from "./math.js";
import { getModeToggleRect, getSidebarItemRect, pointInBoard } from "./uiLayout.js";

const TOOL_OVERLAY_KIND = {
  heat: "thermal_out",
  cold: "thermal_in",
  gravity: "gravity_in",
  highPressure: "pressure_out",
  vacuum: "pressure_in",
  quantumTunneling: "noise_purple",
};

const TOOL_IMAGE_KEY = {
  heat: "toolHeat",
  cold: "toolCold",
  gravity: "toolGravity",
  highPressure: "toolHighPressure",
  vacuum: "toolVacuum",
  quantumTunneling: "toolQuantumTunneling",
};

export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.images = createImageRegistry();
  }

  render(physics, input, gameState, particles) {
    const ctx = this.ctx;
    const mode = gameState.visualMode || VISUAL_MODES.normal;

    ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this._drawBackground(mode);
    if (mode === VISUAL_MODES.hacker) {
      this._drawFieldLens(gameState.activeTool, input.pointerX, input.pointerY, pointInBoard(input.pointerX, input.pointerY), physics);
    }

    this._drawBoardFrame(mode);
    this._drawGoalRod(gameState.stageIndex || 0);

    if (mode === VISUAL_MODES.hacker) {
      this._drawTunnelWallEffects(physics);
    }

    this._drawWalls(physics.walls, physics.disabledWalls, mode);
    this._drawActiveDrops(gameState.activeDrops || [], mode);

    if (mode === VISUAL_MODES.normal) {
      this._drawNormalDropPixels(gameState.activeDrops || [], physics.time || 0);
    }

    if (mode === VISUAL_MODES.hacker) {
      this._drawParticles(particles);
    }

    this._drawTrail(physics.trail, gameState.stageIndex || 0);
    this._drawCat(physics.cat || physics.balloon, mode);

    this._drawCrosshair(input.pointerX, input.pointerY, TOOL_BY_ID[gameState.activeTool]?.accent || COLORS.lineWhite);
    this._drawSidebar(gameState.activeTool, gameState.ammoState || {});
    this._drawModeToggle(mode);
    this._drawTitle(gameState);
  }

  _drawBackground(mode) {
    const ctx = this.ctx;

    if (mode === VISUAL_MODES.normal) {
      const g = ctx.createLinearGradient(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      g.addColorStop(0, "#2d0b58");
      g.addColorStop(0.5, "#44107e");
      g.addColorStop(1, "#291548");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

      this._drawImageFill(this.images.backgroundNormal, 0.18);

      ctx.save();
      for (let i = 0; i < 240; i += 1) {
        const x = (i * 83.27) % WORLD_WIDTH;
        const y = (i * 137.11) % WORLD_HEIGHT;
        ctx.fillStyle = i % 5 === 0 ? "rgba(255,140,220,0.32)" : "rgba(255,255,255,0.22)";
        ctx.fillRect(x, y, 2, 2);
      }
      ctx.restore();
      return;
    }

    ctx.fillStyle = COLORS.hackerBackground;
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this._drawImageFill(this.images.backgroundHacker, 0.14);

    const vignette = ctx.createRadialGradient(
      WORLD_WIDTH * 0.5,
      WORLD_HEIGHT * 0.45,
      WORLD_WIDTH * 0.05,
      WORLD_WIDTH * 0.5,
      WORLD_HEIGHT * 0.5,
      WORLD_WIDTH * 0.63,
    );
    vignette.addColorStop(0, "rgba(255,255,255,0.06)");
    vignette.addColorStop(0.6, "rgba(255,255,255,0.01)");
    vignette.addColorStop(1, "rgba(0,0,0,0.48)");

    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1;
    for (let y = 0.5; y < WORLD_HEIGHT; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WORLD_WIDTH, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawImageFill(assetState, alpha = 1) {
    if (!assetState?.loaded || !assetState.image) {
      return;
    }

    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(assetState.image, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    ctx.restore();
  }

  _drawBoardFrame(mode) {
    const ctx = this.ctx;
    const board = LAYOUT.board;

    ctx.save();
    ctx.strokeStyle = mode === VISUAL_MODES.normal ? COLORS.neonPink : COLORS.lineWhite;
    ctx.lineWidth = 2;
    ctx.strokeRect(board.x, board.y, board.width, board.height);
    ctx.restore();
  }

  _drawWalls(walls, disabledWalls, mode) {
    const ctx = this.ctx;
    ctx.save();
    ctx.lineWidth = 2;

    for (const wall of walls) {
      if (wall.isFrame) {
        continue;
      }

      const disabled = disabledWalls.has(wall.id);
      ctx.strokeStyle = disabled
        ? mode === VISUAL_MODES.normal
          ? "rgba(255,130,220,0.26)"
          : "rgba(255,255,255,0.26)"
        : mode === VISUAL_MODES.normal
          ? "rgba(255,95,220,0.95)"
          : COLORS.lineWhite;
      ctx.setLineDash(disabled ? [5, 6] : []);

      ctx.beginPath();
      ctx.moveTo(wall.a.x, wall.a.y);
      ctx.lineTo(wall.b.x, wall.b.y);
      ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.restore();
  }

  _drawGoalRod(stageIndex) {
    const ctx = this.ctx;
    const stage = STAGES[stageIndex % STAGES.length];
    const goal = getGoalRodPosition();

    ctx.save();
    ctx.strokeStyle = stage.rodColor;
    ctx.shadowColor = stage.rodColor;
    ctx.shadowBlur = 18;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(goal.x, goal.y - 52);
    ctx.lineTo(goal.x, goal.y + 52);
    ctx.stroke();

    ctx.strokeStyle = withAlpha(stage.rodColor, 0.35);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(goal.x, goal.y, GOAL_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  _drawActiveDrops(activeDrops, mode) {
    const ctx = this.ctx;
    ctx.save();

    for (const drop of activeDrops) {
      if (!drop || drop.remaining <= 0) {
        continue;
      }

      const tool = TOOL_BY_ID[drop.toolId];
      if (!tool) {
        continue;
      }

      const life = clamp(drop.remaining / Math.max(0.001, drop.duration), 0, 1);
      const size = 30;

      const key = TOOL_IMAGE_KEY[drop.toolId];
      const imgState = key ? this.images[key] : null;
      if (imgState?.loaded && imgState.image) {
        ctx.save();
        ctx.globalAlpha = 0.34 + life * 0.66;
        ctx.drawImage(imgState.image, drop.x - size * 0.5, drop.y - size * 0.5, size, size);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(drop.x, drop.y, size * 0.42, 0, Math.PI * 2);
        ctx.fillStyle = withAlpha(tool.accent, 0.34 + life * 0.66);
        ctx.fill();
      }

      ctx.strokeStyle = withAlpha(tool.accent, 0.8);
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, size * 0.65 + (1 - life) * 5, 0, Math.PI * 2);
      ctx.stroke();

      if (mode === VISUAL_MODES.hacker) {
        ctx.strokeStyle = withAlpha(tool.accent, 0.22);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(drop.x, drop.y, Math.max(26, drop.radius * 0.55), 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  _drawNormalDropPixels(activeDrops, time) {
    const ctx = this.ctx;
    ctx.save();

    for (const drop of activeDrops) {
      if (!drop || drop.remaining <= 0) {
        continue;
      }
      const tool = TOOL_BY_ID[drop.toolId];
      if (!tool) {
        continue;
      }

      const life = clamp(drop.remaining / Math.max(0.001, drop.duration), 0, 1);
      const pixelCount = 22;
      const radius = 22 + (1 - life) * 12;

      for (let i = 0; i < pixelCount; i += 1) {
        const angle = (i / pixelCount) * Math.PI * 2 + time * 3.2;
        const wave = ((i * 13.17 + time * 37.9) % 1 + 1) % 1;
        const r = radius * (0.4 + wave * 0.9);
        const x = drop.x + Math.cos(angle) * r;
        const y = drop.y + Math.sin(angle) * r;
        ctx.fillStyle = withAlpha(tool.accent, 0.14 + life * 0.48);
        ctx.fillRect(x, y, 2, 2);
      }
    }

    ctx.restore();
  }

  _drawTrail(trail, stageIndex) {
    if (trail.length < 2) {
      return;
    }

    const ctx = this.ctx;
    const stage = STAGES[stageIndex % STAGES.length];

    ctx.save();
    for (let i = 1; i < trail.length; i += 1) {
      const prev = trail[i - 1];
      const node = trail[i];
      const alpha = clamp(node.life, 0, 1) * 0.86;

      ctx.strokeStyle = blendAlpha(stage.trailColorA, alpha);
      ctx.lineWidth = 1.2 + alpha * 4.4;
      ctx.shadowColor = blendAlpha(stage.trailColorB, alpha * 0.9);
      ctx.shadowBlur = 14 * alpha;
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(node.x, node.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawCat(cat, mode) {
    if (!cat) {
      return;
    }

    if (cat.tunnelGhost > 0.01) {
      this._drawCatGhosts(cat);
    }

    const ctx = this.ctx;
    const assetState = mode === VISUAL_MODES.normal ? this.images.catNormal : this.images.catHacker;
    const size = cat.radius * 2.3;

    if (assetState?.loaded && assetState.image) {
      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.shadowColor = mode === VISUAL_MODES.normal ? COLORS.neonPink : "rgba(255,255,255,0.74)";
      ctx.shadowBlur = 18;
      ctx.drawImage(assetState.image, cat.x - size * 0.5, cat.y - size * 0.62, size, size);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.fillStyle = mode === VISUAL_MODES.normal ? "rgba(255,220,250,0.95)" : "rgba(245,245,245,0.95)";
    ctx.shadowColor = mode === VISUAL_MODES.normal ? "rgba(255,100,210,0.8)" : "rgba(255,255,255,0.7)";
    ctx.shadowBlur = 24;

    ctx.beginPath();
    ctx.arc(cat.x, cat.y, cat.radius, 0, Math.PI * 2);
    ctx.fill();

    const ear = cat.radius * 0.64;
    ctx.beginPath();
    ctx.moveTo(cat.x - cat.radius * 0.75, cat.y - cat.radius * 0.2);
    ctx.lineTo(cat.x - cat.radius * 0.15, cat.y - cat.radius - ear * 0.12);
    ctx.lineTo(cat.x - cat.radius * 0.02, cat.y - cat.radius * 0.2);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cat.x + cat.radius * 0.75, cat.y - cat.radius * 0.2);
    ctx.lineTo(cat.x + cat.radius * 0.15, cat.y - cat.radius - ear * 0.12);
    ctx.lineTo(cat.x + cat.radius * 0.02, cat.y - cat.radius * 0.2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  _drawCatGhosts(cat) {
    const ctx = this.ctx;
    const ghost = clamp(cat.tunnelGhost, 0, 1);

    const velocityLen = length(cat.vx, cat.vy) || 1;
    const nx = cat.vx / velocityLen;
    const ny = cat.vy / velocityLen;
    const px = -ny;
    const py = nx;

    const spread = 16 * ghost;
    const configs = [
      { r: 255, g: 80, b: 80, ox: -spread + px * 4, oy: py * 4 },
      { r: 110, g: 255, b: 120, ox: 0, oy: 0 },
      { r: 80, g: 110, b: 255, ox: spread - px * 4, oy: -py * 4 },
    ];

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (const c of configs) {
      ctx.beginPath();
      ctx.arc(cat.x + c.ox, cat.y + c.oy, cat.radius * 0.97, 0, Math.PI * 2);
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

  _drawSidebar(activeTool, ammoState) {
    const ctx = this.ctx;
    const sidebar = LAYOUT.sidebar;

    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.82)";
    ctx.fillStyle = "rgba(6, 8, 18, 0.84)";
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

      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.beginPath();
      ctx.moveTo(rect.x + 8, rect.y);
      ctx.lineTo(rect.x + rect.width - 8, rect.y);
      ctx.stroke();

      const key = TOOL_IMAGE_KEY[tool.id];
      const icon = key ? this.images[key] : null;
      if (icon?.loaded && icon.image) {
        ctx.save();
        ctx.globalAlpha = isActive ? 1 : 0.86;
        ctx.drawImage(icon.image, rect.x + 18, rect.y + 10, rect.width - 36, rect.height - 24);
        ctx.restore();
      } else {
        ctx.fillStyle = isActive ? tool.accent : "rgba(255,255,255,0.88)";
        ctx.font = "bold 14px 'Times New Roman', serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(tool.name[0], rect.x + rect.width * 0.5, rect.y + rect.height * 0.45);
      }

      const ammo = ammoState[tool.id] ?? 0;
      ctx.font = "12px 'Times New Roman', serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = ammo > 0 ? "rgba(255,255,255,0.92)" : "rgba(255,110,110,0.9)";
      ctx.fillText(`x${ammo}`, rect.x + rect.width - 8, rect.y + rect.height - 6);
    }

    ctx.restore();
  }

  _drawModeToggle(mode) {
    const ctx = this.ctx;
    const rect = getModeToggleRect();

    ctx.save();
    ctx.fillStyle = "rgba(6, 8, 18, 0.9)";
    ctx.strokeStyle = "rgba(255,255,255,0.52)";
    ctx.lineWidth = 2;
    roundRect(ctx, rect.x, rect.y, rect.width, rect.height, rect.radius);
    ctx.fill();
    ctx.stroke();

    const half = rect.width * 0.5;
    ctx.fillStyle = mode === VISUAL_MODES.normal ? "rgba(255, 120, 220, 0.35)" : "rgba(140, 220, 255, 0.22)";
    roundRect(ctx, mode === VISUAL_MODES.normal ? rect.x + 2 : rect.x + half, rect.y + 2, half - 2, rect.height - 4, 8);
    ctx.fill();

    ctx.font = "16px 'Times New Roman', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,255,255,0.96)";
    ctx.fillText("Normal", rect.x + half * 0.5, rect.y + rect.height * 0.5);
    ctx.fillText("Hacker", rect.x + half + half * 0.5, rect.y + rect.height * 0.5);
    ctx.restore();
  }

  _drawTitle(gameState) {
    const ctx = this.ctx;
    const modeLabel = gameState.visualMode === VISUAL_MODES.hacker ? "Hacker Mode" : "Normal Mode";
    const stage = STAGES[(gameState.stageIndex || 0) % STAGES.length];

    ctx.save();
    ctx.fillStyle = COLORS.lineWhite;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "56px 'Times New Roman', serif";
    ctx.fillText(gameState.titleText || "The Ten Commandments V2", LAYOUT.title.x, LAYOUT.title.y);

    ctx.font = "24px 'Times New Roman', serif";
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.fillText(`Powers Ready: ${gameState.powersReady ?? 0}/${gameState.maxAmmo ?? 0}`, LAYOUT.title.x, LAYOUT.title.y + 34);

    ctx.font = "16px 'Times New Roman', serif";
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.fillText(`${modeLabel} | Stage ${stage.id}`, LAYOUT.title.x, LAYOUT.title.y + 54);

    if (gameState.visualMode === VISUAL_MODES.hacker && gameState.liveEquation) {
      ctx.font = "18px Cambria Math, 'Times New Roman', serif";
      ctx.fillStyle = "rgba(190,240,255,0.9)";
      ctx.fillText(gameState.liveEquation, LAYOUT.title.x, LAYOUT.title.y + 76);
    }

    ctx.restore();
  }

  _drawFieldLens(activeTool, cx, cy, visible, physics) {
    if (!visible || !pointInBoard(cx, cy)) {
      return;
    }

    const ctx = this.ctx;
    const lensRadius = LAYOUT.lensRadius;
    const overlayKind = TOOL_OVERLAY_KIND[activeTool];
    const useWorldLens = overlayKind === "gravity_in";

    if (!overlayKind) {
      return;
    }

    ctx.save();
    if (useWorldLens) {
      this._clipLens(cx, cy, lensRadius);
    } else {
      this._clipBoardLens(cx, cy, lensRadius);
    }

    if (activeTool === "heat" || activeTool === "cold" || activeTool === "highPressure" || activeTool === "vacuum") {
      this._drawThermoHeatmap(physics?.thermo, cx, cy, activeTool);
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
      case "pressure_out":
        this._drawPressureField(cx, cy, false);
        break;
      case "pressure_in":
        this._drawPressureField(cx, cy, true);
        break;
      case "noise_purple":
        this._drawNoiseCloud(cx, cy, "rgba(205,76,255,0.55)");
        break;
      default:
        break;
    }

    ctx.restore();

    ctx.save();
    ctx.strokeStyle = TOOL_BY_ID[activeTool]?.accent || "rgba(255,255,255,0.8)";
    ctx.lineWidth = 1.4;
    ctx.globalAlpha = 0.55;
    ctx.shadowColor = TOOL_BY_ID[activeTool]?.accent || "rgba(255,255,255,0.8)";
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

  _drawThermoHeatmap(thermo, cx, cy, mode) {
    if (!thermo) {
      return;
    }

    const ctx = this.ctx;
    const radius = LAYOUT.lensRadius;

    ctx.save();
    thermo.forEachCellInRadius(cx, cy, radius, (cellX, cellY, index, influence) => {
      const world = thermo.cellToWorld(cellX, cellY);
      const temp = thermo.temp[index];
      const pressure = thermo.pressure[index];

      let r = 255;
      let g = 255;
      let b = 255;
      let a = 0.08 * influence;

      switch (mode) {
        case "heat": {
          const t = clamp((temp - 1) / 0.95, 0, 1);
          r = 255;
          g = Math.round(130 + 100 * t);
          b = Math.round(60 + 25 * t);
          a = (0.16 + 0.32 * t) * influence;
          break;
        }
        case "cold": {
          const c = clamp((1 - temp) / 0.9, 0, 1);
          r = Math.round(150 - 55 * c);
          g = Math.round(205 + 28 * c);
          b = 255;
          a = (0.15 + 0.34 * c) * influence;
          break;
        }
        case "highPressure": {
          const p = clamp((pressure - 1) / 1.4, 0, 1);
          r = 255;
          g = 255;
          b = 255;
          a = (0.06 + 0.24 * p) * influence;
          break;
        }
        case "vacuum": {
          const v = clamp((1 - pressure) / 0.85, 0, 1);
          r = 210;
          g = Math.round(220 + 20 * v);
          b = 255;
          a = (0.07 + 0.26 * v) * influence;
          break;
        }
        default:
          break;
      }

      const half = thermo.cellSize * 0.5;
      ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
      ctx.fillRect(world.x - half, world.y - half, thermo.cellSize + 0.6, thermo.cellSize + 0.6);
    });
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
    for (let i = 0; i < 350; i += 1) {
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
}

function withAlpha(color, alpha) {
  if (color?.startsWith("rgba(")) {
    const inner = color.slice(5, -1);
    const parts = inner.split(",").map((part) => part.trim());
    return `rgba(${parts[0]},${parts[1]},${parts[2]},${alpha})`;
  }

  if (color?.startsWith("rgb(")) {
    const inner = color.slice(4, -1);
    return `rgba(${inner},${alpha})`;
  }

  return `rgba(255,255,255,${alpha})`;
}

function blendAlpha(rgbaColor, alphaScale) {
  if (!rgbaColor?.startsWith("rgba(")) {
    return rgbaColor;
  }
  const inner = rgbaColor.slice(5, -1);
  const parts = inner.split(",").map((part) => part.trim());
  const a = clamp(Number(parts[3] || 1) * alphaScale, 0, 1);
  return `rgba(${parts[0]},${parts[1]},${parts[2]},${a})`;
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
