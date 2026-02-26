// ─── CAT SPRITES ─────────────────────────────────────────────
const catHackerSprite = new Image();
catHackerSprite.src = "Assets/VisualExamples/cat_hacker.png";
const catNormalSprite = new Image();
catNormalSprite.src = "Assets/VisualExamples/cat_normal.png";
const normalBgImage = new Image();
normalBgImage.src = "Assets/VisualExamples/background.png";

// Tool icon sprites (normal mode)
const toolIconSprites = {};
const TOOL_ICON_MAP = {
  heat: "Assets/VisualExamples/heat.png",
  cold: "Assets/VisualExamples/cold.png",
  mass: "Assets/VisualExamples/gravity.png",
  highPressure: "Assets/VisualExamples/pressure.png",
  vacuum: "Assets/VisualExamples/vacuum.png",
  tunneling: "Assets/VisualExamples/quantum.png"
};
for (const [id, src] of Object.entries(TOOL_ICON_MAP)) {
  const img = new Image();
  img.src = src;
  toolIconSprites[id] = img;
}

// ─── GOAL ROD (NEON STICK) ───────────────────────────────────
// Rod sprite images per level (rainbow order)
const ROD_SPRITE_PATHS = [
  "Assets/VisualExamples/1red.png",     // Level 1
  "Assets/VisualExamples/1orange.png",  // Level 2
  "Assets/VisualExamples/1yellow.png",  // Level 3
  "Assets/VisualExamples/1green.png",   // Level 4
  "Assets/VisualExamples/1blue.png",    // Level 5
  "Assets/VisualExamples/1indigo.png",  // Level 6
  "Assets/VisualExamples/1purple.png",  // Level 7
];
const rodSprites = ROD_SPRITE_PATHS.map(src => {
  const img = new Image();
  img.src = src;
  return img;
});

function drawGoalRod(ctx) {
  const rod = state.goalRod;
  if (!rod) return;
  const lvlIdx = (state.level - 1) % ROD_COLORS.length;
  const color = ROD_COLORS[lvlIdx];
  const { x, y, h } = rod;
  const time = performance.now() * 0.002;
  const sprite = rodSprites[lvlIdx];

  ctx.save();

  // Pulsing neon aura — large soft outer glow
  const pulseA = 0.35 + Math.sin(time * 2) * 0.15;
  const glowSize = 44 + Math.sin(time * 1.5) * 10;
  const auraGrad = ctx.createRadialGradient(x, y + h * 0.5, 0, x, y + h * 0.5, glowSize);
  auraGrad.addColorStop(0, color + "55");
  auraGrad.addColorStop(0.5, color + "22");
  auraGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalAlpha = pulseA;
  ctx.fillStyle = auraGrad;
  ctx.fillRect(x - glowSize, y + h * 0.5 - glowSize, glowSize * 2, glowSize * 2);
  ctx.globalAlpha = 1;

  // Draw the rod sprite with neon shadow glow
  if (sprite.complete && sprite.naturalWidth > 0) {
    // Scale sprite to be visually prominent (like the placeholder orbs)
    const aspect = sprite.naturalWidth / sprite.naturalHeight;
    const drawH = h * 3;
    const drawW = drawH * aspect;
    const drawY = y + h * 0.5 - drawH * 0.5;  // center vertically on rod position

    // Tilt 30 degrees to the right
    const angle = 30 * Math.PI / 180;
    ctx.translate(x, y + h * 0.5);
    ctx.rotate(angle);

    // Neon glow behind sprite (shadow)
    ctx.shadowColor = color;
    ctx.shadowBlur = 24 + Math.sin(time * 2.5) * 8;

    // Draw sprite centered on rod position
    ctx.drawImage(sprite, -drawW * 0.5, -drawH * 0.5, drawW, drawH);

    // Second pass for stronger glow
    ctx.globalAlpha = 0.4 + Math.sin(time * 3) * 0.1;
    ctx.shadowBlur = 40 + Math.sin(time * 1.8) * 12;
    ctx.drawImage(sprite, -drawW * 0.5, -drawH * 0.5, drawW, drawH);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Reset transform
    ctx.rotate(-angle);
    ctx.translate(-x, -(y + h * 0.5));
  } else {
    // Fallback: draw procedural rod if sprite not loaded
    const rodW = 6;
    ctx.shadowColor = color;
    ctx.shadowBlur = 28 + Math.sin(time * 2) * 8;
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, color);
    grad.addColorStop(0.5, "rgba(255,255,255,0.9)");
    grad.addColorStop(1, color);
    ctx.fillStyle = grad;
    roundRect(ctx, x - rodW * 0.5, y, rodW, h, 3);
    ctx.fill();

    // Top orb
    const pulse = 1 + Math.sin(time * 3) * 0.15;
    const orbR = 8 * pulse;
    const orbGrad = ctx.createRadialGradient(x, y, 0, x, y, orbR * 2);
    orbGrad.addColorStop(0, "rgba(255,255,255,0.95)");
    orbGrad.addColorStop(0.35, color);
    orbGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(x, y, orbR * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bottom base glow (ground reflection)
  ctx.shadowBlur = 0;
  const baseGrad = ctx.createRadialGradient(x, y + h, 0, x, y + h, 18);
  baseGrad.addColorStop(0, color + "55");
  baseGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = baseGrad;
  ctx.fillRect(x - 18, y + h - 5, 36, 10);

  // Win flash overlay
  if (state.winFlash > 0) {
    ctx.globalAlpha = state.winFlash;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.restore();
}

// ─── DRAW HELPERS ────────────────────────────────────────────
const WALL_THEMES = {
  normal: {
    spriteSrc: "Assets/VisualExamples/wall_sprite_20.png",
    outline: "rgba(156, 64, 255, 0.9)",
    glow: "rgba(188, 112, 255, 0.9)",
    glowDisabled: "rgba(168, 120, 220, 0.34)",
    glowCore: "rgba(255, 234, 255, 0.82)",
    haloStroke: "rgba(188,112,255,0.42)",
    disabledHaloStroke: "rgba(168,120,220,0.2)",
    disabledOutline: "rgba(156, 64, 255, 0.32)",
    frameStops: [
      "rgba(248, 221, 255, 0.95)",
      "rgba(242, 186, 255, 0.92)",
      "rgba(255, 236, 255, 0.95)"
    ],
    frameSpec: "rgba(255,255,255,0.44)",
    innerStops: [
      "rgba(110, 44, 182, 0.28)",
      "rgba(202, 120, 255, 0.17)",
      "rgba(255, 246, 255, 0.32)",
      "rgba(214, 138, 255, 0.17)",
      "rgba(112, 46, 184, 0.3)"
    ],
    innerSpec: "rgba(255,246,255,0.34)",
    innerSpec2: "rgba(255,250,255,0.55)"
  },
  hacker: {
    spriteSrc: "Assets/VisualExamples/wall_sprite_20_green.png",
    outline: "rgba(34, 224, 136, 0.9)",
    glow: "rgba(86, 255, 190, 0.9)",
    glowDisabled: "rgba(112, 180, 150, 0.34)",
    glowCore: "rgba(220, 255, 238, 0.84)",
    haloStroke: "rgba(86,255,190,0.42)",
    disabledHaloStroke: "rgba(112,180,150,0.2)",
    disabledOutline: "rgba(112, 180, 150, 0.32)",
    frameStops: [
      "rgba(214, 255, 238, 0.95)",
      "rgba(168, 255, 220, 0.92)",
      "rgba(228, 255, 244, 0.95)"
    ],
    frameSpec: "rgba(220,255,240,0.44)",
    innerStops: [
      "rgba(24, 132, 90, 0.28)",
      "rgba(90, 230, 170, 0.17)",
      "rgba(236, 255, 246, 0.3)",
      "rgba(112, 248, 188, 0.17)",
      "rgba(20, 136, 94, 0.32)"
    ],
    innerSpec: "rgba(220,255,238,0.35)",
    innerSpec2: "rgba(235,255,245,0.56)"
  }
};

const wallSprites = {};
const wallPatternCache = {};
for (const [id, theme] of Object.entries(WALL_THEMES)) {
  const img = new Image();
  img.src = theme.spriteSrc;
  wallSprites[id] = img;
  wallPatternCache[id] = new Map();
}

function getWallThemeId() {
  return (typeof state !== "undefined" && state.hackerMode) ? "hacker" : "normal";
}
function getWallTheme() {
  return WALL_THEMES[getWallThemeId()];
}

function getWallPattern(widthPx) {
  const themeId = getWallThemeId();
  const wallSprite = wallSprites[themeId];
  const patternCache = wallPatternCache[themeId];
  if (!wallSprite || !wallSprite.complete || !wallSprite.naturalWidth || !wallSprite.naturalHeight) return null;
  const key = Math.max(2, Math.round(widthPx));
  if (patternCache.has(key)) return patternCache.get(key);
  const tile = document.createElement("canvas");
  const scale = key / wallSprite.naturalHeight;
  tile.width = Math.max(4, Math.round(wallSprite.naturalWidth * scale));
  tile.height = key;
  const tctx = tile.getContext("2d");
  tctx.imageSmoothingEnabled = true;
  tctx.drawImage(wallSprite, 0, 0, tile.width, tile.height);
  const pattern = ctx.createPattern(tile, "repeat");
  patternCache.set(key, pattern);
  return pattern;
}

function getWallInnerGradient(w, thickness) {
  const wallTheme = getWallTheme();
  const dx = w.b.x - w.a.x, dy = w.b.y - w.a.y;
  const sl = Math.hypot(dx, dy) || 1;
  const nx = -dy / sl, ny = dx / sl;
  const mx = (w.a.x + w.b.x) * 0.5, my = (w.a.y + w.b.y) * 0.5;
  const half = Math.max(2, thickness * 0.5);
  const g = ctx.createLinearGradient(mx - nx * half, my - ny * half, mx + nx * half, my + ny * half);
  g.addColorStop(0, wallTheme.innerStops[0]);
  g.addColorStop(0.25, wallTheme.innerStops[1]);
  g.addColorStop(0.5, wallTheme.innerStops[2]);
  g.addColorStop(0.75, wallTheme.innerStops[3]);
  g.addColorStop(1, wallTheme.innerStops[4]);
  return g;
}

function drawVectorField(ctx, cx, cy, inward, color, streak, sp, bLen, ax, ay, aw, ah) {
  ax = ax != null ? ax : BOARD.x; ay = ay != null ? ay : BOARD.y;
  aw = aw != null ? aw : BOARD.w; ah = ah != null ? ah : BOARD.h;
  sp = sp || 42; bLen = bLen || (streak ? 18 : 10);
  ctx.save();
  for (let y = ay + sp * 0.5; y < ay + ah; y += sp) {
    for (let x = ax + sp * 0.5; x < ax + aw; x += sp) {
      const dx = x - cx, dy = y - cy, dist = Math.hypot(dx, dy);
      if (dist > LENS_R * 1.08 || dist < 1.5) continue;
      const inf = clamp(1 - dist / LENS_R, 0, 1), alpha = clamp(inf * 0.9, 0, 1);
      if (alpha <= 0.03) continue;
      const dir = inward ? -1 : 1;
      const nx = (dx / dist) * dir, ny = (dy / dist) * dir;
      const len = bLen * (0.38 + inf * (streak ? 2.2 : 1.4));
      const sx = streak ? x - nx * len * 0.15 : x, sy = streak ? y - ny * len * 0.15 : y;
      const ex = x + nx * len, ey = y + ny * len;
      ctx.strokeStyle = withAlpha(color, alpha);
      ctx.lineWidth = streak ? 1.4 : 1.7;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      if (!streak) {
        const h = 3.2; ctx.beginPath();
        ctx.moveTo(ex, ey); ctx.lineTo(ex - nx * h + ny * h * 0.8, ey - ny * h - nx * h * 0.8);
        ctx.moveTo(ex, ey); ctx.lineTo(ex - nx * h - ny * h * 0.8, ey - ny * h + nx * h * 0.8);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}
function drawWarpedGrid(ctx, cx, cy, inward) {
  const sp = 40, wR = LENS_R * 1.1;
  const warp = (x, y) => {
    const dx = x - cx, dy = y - cy, dist = Math.hypot(dx, dy) || 1;
    const off = (inward ? -1 : 1) * clamp(1 - dist / wR, 0, 1) ** 2 * 52;
    return { x: x + (dx / dist) * off, y: y + (dy / dist) * off };
  };
  ctx.save(); ctx.strokeStyle = "rgba(89,236,255,0.6)"; ctx.lineWidth = 1.6;
  for (let x = 0; x <= W; x += sp) {
    ctx.beginPath();
    for (let y = 0; y <= H; y += 12) { const p = warp(x, y); y === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); }
    ctx.stroke();
  }
  for (let y = 0; y <= H; y += sp) {
    ctx.beginPath();
    for (let x = 0; x <= W; x += 12) { const p = warp(x, y); x === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); }
    ctx.stroke();
  }
  ctx.restore();
}

// ─── SIDEBAR GLYPHS ─────────────────────────────────────────
function drawThermIcon(ctx, cx, cy, hot) {
  const top = cy - 18, bot = cy + 12, oy = hot ? -8 : 8;
  ctx.beginPath(); ctx.arc(cx - 10, bot + 4, 6, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 10, top); ctx.lineTo(cx - 10, bot); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 3, cy + oy); ctx.lineTo(cx + 16, cy + oy); ctx.stroke();
  ctx.beginPath();
  if (hot) { ctx.moveTo(cx + 14, cy - 11); ctx.lineTo(cx + 16, cy - 8); ctx.lineTo(cx + 14, cy - 5); }
  else { ctx.moveTo(cx + 14, cy + 5); ctx.lineTo(cx + 16, cy + 8); ctx.lineTo(cx + 14, cy + 11); }
  ctx.stroke();
  ctx.font = "15px Times New Roman"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.fillText("dT", cx + 18, cy + oy);
}
function drawVecIcon(ctx, cx, cy, letter, inward) {
  ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.stroke();
  ctx.font = "26px Times New Roman"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(letter, cx, cy + 1);
  for (const a of [{ x: 0, y: -21 }, { x: 21, y: 0 }, { x: 0, y: 21 }, { x: -21, y: 0 }]) {
    ctx.beginPath();
    ctx.moveTo(cx + a.x * (inward ? 1 : 0.35), cy + a.y * (inward ? 1 : 0.35));
    ctx.lineTo(cx + a.x * (inward ? 0.35 : 1), cy + a.y * (inward ? 0.35 : 1));
    ctx.stroke();
  }
}
function drawPsiIcon(ctx, cx, cy) {
  ctx.font = "30px Times New Roman"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("Ψ", cx - 9, cy - 3);
  ctx.beginPath(); ctx.moveTo(cx + 1, cy + 8); ctx.lineTo(cx + 24, cy + 8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 12, cy - 10); ctx.lineTo(cx + 12, cy + 8); ctx.stroke();
}
function drawGlyph(ctx, id, rect, color) {
  const cx = rect.x + rect.w * 0.5, cy = rect.y + rect.h * 0.54;
  ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2; ctx.lineCap = "round";
  switch (id) {
    case "heat": drawThermIcon(ctx, cx, cy, true); break;
    case "cold": drawThermIcon(ctx, cx, cy, false); break;
    case "mass": drawVecIcon(ctx, cx, cy, "M", true); break;
    case "highPressure": drawVecIcon(ctx, cx, cy, "P", false); break;
    case "vacuum": drawVecIcon(ctx, cx, cy, "V", true); break;
    case "tunneling": drawPsiIcon(ctx, cx, cy); break;
  }
  ctx.restore();
}

// ─── CANVAS SIDEBAR ─────────────────────────────────────────
function drawSidebar(ctx) {
  const isHacker = state.hackerMode;

  ctx.save();

  // Panel background
  roundRect(ctx, SIDEBAR.x, SIDEBAR.y, SIDEBAR.w, SIDEBAR.h, SIDEBAR.r);
  if (isHacker) {
    ctx.fillStyle = "rgba(6,10,14,0.94)";
  } else {
    const panelGrad = ctx.createLinearGradient(
      SIDEBAR.x,
      SIDEBAR.y,
      SIDEBAR.x,
      SIDEBAR.y + SIDEBAR.h
    );
    panelGrad.addColorStop(0, "#1B0B62");
    panelGrad.addColorStop(0.55, "#4A2D99");
    panelGrad.addColorStop(1, "#8A4FA9");
    ctx.fillStyle = panelGrad;
  }
  ctx.fill();

  // Panel border
  if (isHacker) {
    // Outer glow passes
    ctx.save();
    for (const pass of [
      { width: 12, alpha: 0.06 },
      { width: 8,  alpha: 0.12 },
      { width: 5,  alpha: 0.18 },
    ]) {
      roundRect(ctx, SIDEBAR.x, SIDEBAR.y, SIDEBAR.w, SIDEBAR.h, SIDEBAR.r);
      ctx.globalAlpha = pass.alpha;
      ctx.strokeStyle = "rgba(0,230,160,1)";
      ctx.lineWidth = pass.width;
      ctx.stroke();
    }
    ctx.restore();
    // Core border
    roundRect(ctx, SIDEBAR.x, SIDEBAR.y, SIDEBAR.w, SIDEBAR.h, SIDEBAR.r);
    ctx.strokeStyle = "rgba(0,230,160,0.5)";
    ctx.lineWidth = 3;
    ctx.stroke();
  } else {
    const borderGrad = ctx.createLinearGradient(
      SIDEBAR.x,
      SIDEBAR.y,
      SIDEBAR.x + SIDEBAR.w,
      SIDEBAR.y + SIDEBAR.h
    );
    borderGrad.addColorStop(0, "#A8FFD8");
    borderGrad.addColorStop(0.5, "#D8B9FF");
    borderGrad.addColorStop(1, "#FFAEDC");
    // Soft outer fade: wider strokes get progressively more transparent.
    ctx.save();
    for (const pass of [
      { width: 7, alpha: 0.18 },
      { width: 11, alpha: 0.09 },
      { width: 16, alpha: 0.045 },
      { width: 22, alpha: 0.02 }
    ]) {
      roundRect(ctx, SIDEBAR.x, SIDEBAR.y, SIDEBAR.w, SIDEBAR.h, SIDEBAR.r);
      ctx.globalAlpha = pass.alpha;
      ctx.strokeStyle = borderGrad;
      ctx.lineWidth = pass.width;
      ctx.stroke();
    }
    ctx.restore();

    // Crisp core border.
    roundRect(ctx, SIDEBAR.x, SIDEBAR.y, SIDEBAR.w, SIDEBAR.h, SIDEBAR.r);
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  // Right edge glow toward board
  if (isHacker) {
    ctx.save();
    ctx.shadowColor = "rgba(0,230,160,0.25)";
    ctx.shadowBlur = 8;
    ctx.strokeStyle = "rgba(0,230,160,0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(SIDEBAR.x + SIDEBAR.w, SIDEBAR.y + SIDEBAR.r);
    ctx.lineTo(SIDEBAR.x + SIDEBAR.w, SIDEBAR.y + SIDEBAR.h - SIDEBAR.r);
    ctx.stroke();
    ctx.restore();
  }

  // Tool cells
  for (let i = 0; i < TOOLS.length; i++) {
    const t = TOOLS[i];
    const rect = sidebarRect(i);
    const isActive = state.activeTool === i && state.dragging;
    const isHovered = typeof state.hoverTool !== "undefined" && state.hoverTool === i && !state.dragging;

    // Active tool glow
    if (isActive) {
      ctx.save();
      const gc = isHacker ? "0,255,200" : "200,120,255";
      roundRect(ctx, rect.x + 3, rect.y + 3, rect.w - 6, rect.h - 6, 15);
      ctx.fillStyle = "rgba(" + gc + ",0.14)";
      ctx.shadowColor = "rgba(" + gc + ",0.5)";
      ctx.shadowBlur = 22;
      ctx.fill();
      ctx.restore();
    } else if (isHovered) {
      roundRect(ctx, rect.x + 3, rect.y + 3, rect.w - 6, rect.h - 6, 15);
      ctx.fillStyle = isHacker ? "rgba(0,255,180,0.06)" : "rgba(180,100,255,0.06)";
      ctx.fill();
    }

    // Divider below cell
    if (i < TOOLS.length - 1) {
      const divY = rect.y + rect.h + SIDEBAR.gap * 0.5;
      ctx.strokeStyle = isHacker ? "rgba(0,230,160,0.1)" : "rgba(160,80,220,0.1)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rect.x + 10, divY);
      ctx.lineTo(rect.x + rect.w - 10, divY);
      ctx.stroke();
    }

    // Icon
    if (isHacker) {
      // Green border background behind each glyph
      const bgPad = 7;
      const bgX = rect.x + bgPad;
      const bgY = rect.y + bgPad;
      const bgW = rect.w - bgPad * 2;
      const bgH = rect.h - bgPad * 2;
      roundRect(ctx, bgX, bgY, bgW, bgH, 15);
      ctx.strokeStyle = "rgba(0,230,160,0.45)";
      ctx.lineWidth = 2;
      ctx.stroke();

      const color = isActive ? "#00ffc8" : (isHovered ? "rgba(0,230,180,0.7)" : "rgba(0,230,180,0.45)");
      drawGlyph(ctx, t.id, rect, color);
    } else {
      // Normal mode: tool icon sprite
      const cx = rect.x + rect.w * 0.5;
      const cy = rect.y + rect.h * 0.5;
      const iconImg = toolIconSprites[t.id];
      const iconSize = Math.min(rect.w, rect.h) * 0.72;
      ctx.save();

      // Pink-purple background pill behind each icon
      const bgPad = 7;
      const bgX = rect.x + bgPad;
      const bgY = rect.y + bgPad;
      const bgW = rect.w - bgPad * 2;
      const bgH = rect.h - bgPad * 2;
      const bgGrad = ctx.createLinearGradient(bgX, bgY, bgX + bgW, bgY + bgH);
      bgGrad.addColorStop(0, "rgba(140,60,200,0.40)");
      bgGrad.addColorStop(0.5, "rgba(230,130,220,0.38)");
      bgGrad.addColorStop(1, "rgba(255,240,255,0.35)");
      ctx.fillStyle = bgGrad;
      roundRect(ctx, bgX, bgY, bgW, bgH, 15);
      ctx.fill();

      if (iconImg && iconImg.complete && iconImg.naturalWidth) {
        ctx.globalAlpha = isActive ? 1 : (isHovered ? 0.85 : 0.65);
        if (isActive || isHovered) {
          ctx.shadowColor = t.accent;
          ctx.shadowBlur = isActive ? 18 : 10;
        }
        ctx.drawImage(iconImg, cx - iconSize * 0.5, cy - iconSize * 0.5, iconSize, iconSize);
      } else {
        // Fallback circle if sprite not loaded
        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.fillStyle = t.accent + "1a";
        ctx.strokeStyle = t.accent + "55";
        ctx.lineWidth = 2;
        ctx.fill(); ctx.stroke();
        ctx.font = "bold 16px 'Quicksand', sans-serif";
        ctx.fillStyle = t.accent + "88";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(t.name.charAt(0).toUpperCase(), cx, cy + 1);
      }
      ctx.restore();
    }

    // Use-count badge (bottom-right of cell)
    const uses = state.toolUses[t.id];
    if (uses != null) {
      const badgeText = uses === Infinity ? "\u221e" : "" + uses;
      const bx = rect.x + rect.w - 12;
      const by = rect.y + rect.h - 8;
      ctx.save();
      ctx.font = "bold 18px 'Quicksand', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (uses <= 0) {
        ctx.fillStyle = isHacker ? "rgba(255,60,60,0.7)" : "rgba(255,80,80,0.7)";
      } else {
        ctx.fillStyle = isHacker ? "rgba(0,230,160,0.85)" : "rgba(230,180,255,0.9)";
      }
      ctx.shadowColor = isHacker ? "rgba(0,230,160,0.5)" : "rgba(200,140,255,0.5)";
      ctx.shadowBlur = 4;
      ctx.fillText(badgeText, bx, by);
      ctx.restore();
    }
  }

  ctx.restore();
}

// ─── CUTE TOOLTIPS (Normal Mode) ─────────────────────────────
const CUTE_TIPS = {
  heat: "Very hot! \u2728",
  cold: "Brrr.. so chilly! \u2744\ufe0f",
  mass: "Heavy lil gravity~ \u2b50",
  highPressure: "Big push!! \ud83d\udca8",
  vacuum: "Suck it in~ \ud83c\udf00",
  tunneling: "Ghosty powers! \ud83d\udc7b"
};

function drawToolTooltip(ctx) {
  if (state.hackerMode) return;
  if (state.hoverTool < 0 || state.dragging) { state.tooltipAlpha = 0; return; }

  const elapsed = performance.now() - state.hoverStart;
  if (elapsed < 600) return; // delay before showing

  // Fade in over 300ms after the delay
  state.tooltipAlpha = Math.min(1, (elapsed - 600) / 300);
  const alpha = state.tooltipAlpha;

  const tool = TOOLS[state.hoverTool];
  const tip = CUTE_TIPS[tool.id] || tool.name;
  const rect = sidebarRect(state.hoverTool);

  ctx.save();
  ctx.globalAlpha = alpha;

  // Position: to the right of sidebar cell
  const bx = rect.x + rect.w + 14;
  const by = rect.y + rect.h * 0.5;

  // Measure text
  ctx.font = "bold 20px 'Quicksand', sans-serif";
  const tw = ctx.measureText(tip).width;
  const padH = 20, padV = 14;
  const bw = tw + padH * 2;
  const bh = 44;

  // Bubble shape
  const br = 16;
  const bubX = bx + 6;
  const bubY = by - bh * 0.5;

  // Shadow
  ctx.shadowColor = "rgba(220,120,255,0.35)";
  ctx.shadowBlur = 12;

  // Bubble fill
  const grad = ctx.createLinearGradient(bubX, bubY, bubX + bw, bubY + bh);
  grad.addColorStop(0, "rgba(255,180,220,0.92)");
  grad.addColorStop(1, "rgba(220,160,255,0.92)");
  ctx.fillStyle = grad;

  // Draw rounded rect bubble
  ctx.beginPath();
  ctx.moveTo(bubX + br, bubY);
  ctx.lineTo(bubX + bw - br, bubY);
  ctx.quadraticCurveTo(bubX + bw, bubY, bubX + bw, bubY + br);
  ctx.lineTo(bubX + bw, bubY + bh - br);
  ctx.quadraticCurveTo(bubX + bw, bubY + bh, bubX + bw - br, bubY + bh);
  ctx.lineTo(bubX + br, bubY + bh);
  ctx.quadraticCurveTo(bubX, bubY + bh, bubX, bubY + bh - br);
  ctx.lineTo(bubX, bubY + br);
  ctx.quadraticCurveTo(bubX, bubY, bubX + br, bubY);
  ctx.closePath();
  ctx.fill();

  // Little triangle pointer toward icon
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.moveTo(bubX, by - 5);
  ctx.lineTo(bubX - 7, by);
  ctx.lineTo(bubX, by + 5);
  ctx.closePath();
  ctx.fill();

  // Bubble border
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bubX + br, bubY);
  ctx.lineTo(bubX + bw - br, bubY);
  ctx.quadraticCurveTo(bubX + bw, bubY, bubX + bw, bubY + br);
  ctx.lineTo(bubX + bw, bubY + bh - br);
  ctx.quadraticCurveTo(bubX + bw, bubY + bh, bubX + bw - br, bubY + bh);
  ctx.lineTo(bubX + br, bubY + bh);
  ctx.quadraticCurveTo(bubX, bubY + bh, bubX, bubY + bh - br);
  ctx.lineTo(bubX, bubY + br);
  ctx.quadraticCurveTo(bubX, bubY, bubX + br, bubY);
  ctx.closePath();
  ctx.stroke();

  // Text
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#3a1048";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(tip, bubX + bw * 0.5, bubY + bh * 0.5 + 1);

  ctx.restore();
}

// ─── LIVE EQUATIONS (above active effects on canvas) ─────────
// Draw a fraction (numerator over denominator) on canvas, returns width used
function drawFraction(ctx, num, den, x, y, fontSize) {
  const smallSize = Math.round(fontSize * 0.72);
  ctx.save();
  ctx.font = "bold " + smallSize + "px 'Courier New', monospace";
  const numW = ctx.measureText(num).width;
  const denW = ctx.measureText(den).width;
  const fracW = Math.max(numW, denW) + 4;
  // Numerator
  ctx.textAlign = "center"; ctx.textBaseline = "bottom";
  ctx.fillText(num, x + fracW * 0.5, y - 2);
  // Divider line
  ctx.strokeStyle = ctx.fillStyle;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x + fracW, y);
  ctx.stroke();
  // Denominator
  ctx.textBaseline = "top";
  ctx.fillText(den, x + fracW * 0.5, y + 2);
  ctx.restore();
  return fracW;
}

// Structured live equation: array of segments [{text}, {frac: [num, den]}, ...]
// Each effect gets its own individual equation with per-effect data
function getEffectLiveSegments(eff, b) {
  const dist = Math.hypot(eff.x - b.x, eff.y - b.y);
  const spd = Math.hypot(b.vx, b.vy);
  switch (eff.id) {
    case "heat": {
      const budgetPct = ((eff.budget / 2) * 100).toFixed(0);
      const isOverlapping = dist <= b.radius + 20;
      return [{ frac: ["dT", "dt"] }, { text: " = +Q   t=" + eff.budget.toFixed(1) + "s  d=" + dist.toFixed(0) + (isOverlapping ? " \u2713" : "") }];
    }
    case "cold": {
      const isOverlapping = dist <= b.radius + 20;
      return [{ frac: ["dT", "dt"] }, { text: " = \u2212Q   t=" + eff.budget.toFixed(1) + "s  d=" + dist.toFixed(0) + (isOverlapping ? " \u2713" : "") }];
    }
    case "mass":
      return [{ text: "F = \u2212" }, { frac: ["GMm", "r\u00b2"] }, { text: "  r=" + dist.toFixed(0) + "  t=" + (eff.timeRemaining || 0).toFixed(1) + "s" }];
    case "highPressure":
      return [{ frac: ["\u2202p", "\u2202t"] }, { text: " = c\u00b2\u2207\u00b7u  d=" + dist.toFixed(0) + "  t=" + (eff.budget || 0).toFixed(1) + "s" }];
    case "vacuum":
      return [{ text: "u\u1d63 = \u2212" }, { frac: ["k", "r\u00b2"] }, { text: "  d=" + dist.toFixed(0) + "  t=" + (eff.budget || 0).toFixed(1) + "s" }];
    case "tunneling":
      return [{ text: "P \u223c e" }, { text: "\u207b\u00b2\u1d4bL" }, { text: "  \u03c8=" + b.tunnelGhost.toFixed(2) }];
    default:
      return null;
  }
}

function drawLiveEquation(ctx, segments, cx, cy, fontSize) {
  // Measure total width
  ctx.font = "bold " + fontSize + "px 'Courier New', monospace";
  let totalW = 0;
  const parts = [];
  for (const seg of segments) {
    if (seg.frac) {
      const smallSize = Math.round(fontSize * 0.72);
      ctx.font = "bold " + smallSize + "px 'Courier New', monospace";
      const numW = ctx.measureText(seg.frac[0]).width;
      const denW = ctx.measureText(seg.frac[1]).width;
      const w = Math.max(numW, denW) + 4;
      parts.push({ type: "frac", w, seg });
      totalW += w;
      ctx.font = "bold " + fontSize + "px 'Courier New', monospace";
    } else {
      const w = ctx.measureText(seg.text).width;
      parts.push({ type: "text", w, seg });
      totalW += w;
    }
  }
  // Draw centered
  let x = cx - totalW * 0.5;
  for (const p of parts) {
    if (p.type === "frac") {
      drawFraction(ctx, p.seg.frac[0], p.seg.frac[1], x, cy, fontSize);
    } else {
      ctx.font = "bold " + fontSize + "px 'Courier New', monospace";
      ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.fillText(p.seg.text, x, cy);
    }
    x += p.w;
  }
}

// ─── LIVE EQUATIONS (left panel) ─────────────────────────────
function getLiveEquation(tool, b) {
  const spd = Math.hypot(b.vx, b.vy);
  switch (tool.id) {
    case "heat":
      return "dT/dt = " + b.temp.toFixed(2) + " + Q  |  r\u2192" + b.targetRadius.toFixed(1) + "px";
    case "cold":
      return "dT/dt = " + b.temp.toFixed(2) + " \u2212 Q\u2082  |  r\u2192" + b.targetRadius.toFixed(1) + "px";
    case "mass": {
      const eff = state.activeEffects.filter(e => e.id === "mass" && !e.dead);
      if (eff.length) {
        const e = eff[eff.length - 1];
        const dist = Math.hypot(e.x - b.x, e.y - b.y);
        return "F = \u2212GMm/r\u00b2  |  r=" + dist.toFixed(0) + "  m=" + b.mass.toFixed(2);
      }
      return "F = \u2212GMm/r\u00b2  |  m=" + b.mass.toFixed(2) + "  |v|=" + spd.toFixed(1);
    }
    case "highPressure":
      return "\u2202p/\u2202t = c\u00b2\u2207\u00b7u  |  |v|=" + spd.toFixed(1) + "  p=" + (b.mass * spd).toFixed(0);
    case "vacuum":
      return "u\u1d63 = \u2212k/r\u00b2  |  |v|=" + spd.toFixed(1) + "  p=" + (b.mass * spd).toFixed(0);
    case "tunneling": {
      const ghost = b.tunnelGhost;
      const walls = state.disabledWalls.size;
      return "P ~ exp(\u22122\u03baL)  |  \u03c8=" + ghost.toFixed(2) + "  walls_off=" + walls;
    }
    default:
      return tool.equation;
  }
}

// ─── DRAW ────────────────────────────────────────────────────
function draw() {
  const b = balloon, tool = state.activeTool >= 0 ? TOOLS[state.activeTool] : null;
  const warm = Math.max(b.temp, 0), cool = Math.max(-b.temp, 0);
  const wallTheme = getWallTheme();

  // Background
  if (state.hackerMode) {
    ctx.fillStyle = "#050505"; ctx.fillRect(0, 0, W, H);
  } else {
    // Normal mode: background image
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, W, H);
    if (normalBgImage.complete && normalBgImage.naturalWidth) {
      ctx.drawImage(normalBgImage, 0, 0, W, H);
    }
  }

  // Vignette
  const vig = ctx.createRadialGradient(W * .5, H * .45, W * .05, W * .5, H * .5, W * .63);
  vig.addColorStop(0, "rgba(255,255,255,0.06)"); vig.addColorStop(0.6, "rgba(255,255,255,0.012)");
  vig.addColorStop(1, "rgba(0,0,0,0.48)"); ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);

  // Background grid for mass
  if (state.hackerMode && tool && tool.id === "mass") {
    ctx.save(); ctx.strokeStyle = "rgba(89,236,255,0.17)"; ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 36) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 36) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.restore();
  }

  // Film grain
  ctx.save(); ctx.globalAlpha = 0.052;
  for (let i = 0; i < 1400; i++) {
    const gx = (i * 97.31) % W, gy = (i * 189.17) % H;
    ctx.fillStyle = i % 7 === 0 ? "rgba(100,200,255,0.15)" : "rgba(255,255,255,0.26)";
    ctx.fillRect(gx, gy, i % 3 === 0 ? 2 : 1, 1);
  }
  ctx.restore();

  // Scan lines
  ctx.save(); ctx.globalAlpha = 0.1; ctx.strokeStyle = "rgba(255,255,255,0.045)"; ctx.lineWidth = 1;
  for (let y = 0.5; y < H; y += 4) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.restore();



  // Lens overlay (drag preview only — hacker mode only)
  if (state.hackerMode && state.dragging && tool) {
    const showLens = tool.allowOutsideBoard || pointInBoard(pointer.x, pointer.y);
    if (showLens) {
      ctx.save();
      if (tool.allowOutsideBoard) {
        ctx.beginPath(); ctx.arc(pointer.x, pointer.y, LENS_R, 0, Math.PI * 2); ctx.clip();
      } else {
        ctx.beginPath(); ctx.rect(BOARD.x, BOARD.y, BOARD.w, BOARD.h); ctx.clip();
        ctx.beginPath(); ctx.arc(pointer.x, pointer.y, LENS_R, 0, Math.PI * 2); ctx.clip();
      }
      tool.drawPreview(ctx, pointer.x, pointer.y);
      ctx.restore();
      // Lens ring
      ctx.save(); ctx.strokeStyle = tool.accent; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.55;
      ctx.shadowColor = tool.accent; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(pointer.x, pointer.y, LENS_R, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
  }

  // Active effects
  if (state.activeEffects.length) {
    ctx.save();
    for (const eff of state.activeEffects) eff.draw(ctx);
    ctx.restore();

    // Live equations above active effects (hacker mode only)
    if (state.hackerMode) {
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      for (const eff of state.activeEffects) {
        if (eff.dead) continue;
        if (eff.id === "tunneling") continue;  // no live equation for quantum
        const segments = getEffectLiveSegments(eff, b);
        if (!segments) continue;
        drawLiveEquation(ctx, segments, eff.x, eff.y - 55, 15);
      }
      ctx.restore();
    }
  }

  // Board frame
  ctx.save();
  ctx.shadowColor = wallTheme.glow;
  ctx.shadowBlur = 20;
  ctx.strokeStyle = wallTheme.haloStroke;
  ctx.lineWidth = 10;
  ctx.strokeRect(BOARD.x, BOARD.y, BOARD.w, BOARD.h);
  ctx.strokeStyle = wallTheme.outline;
  ctx.lineWidth = 6;
  ctx.strokeRect(BOARD.x, BOARD.y, BOARD.w, BOARD.h);
  ctx.shadowColor = wallTheme.glowCore;
  ctx.shadowBlur = 10;
  const frameFill = ctx.createLinearGradient(BOARD.x, BOARD.y, BOARD.x + BOARD.w, BOARD.y + BOARD.h);
  frameFill.addColorStop(0, wallTheme.frameStops[0]);
  frameFill.addColorStop(0.55, wallTheme.frameStops[1]);
  frameFill.addColorStop(1, wallTheme.frameStops[2]);
  ctx.strokeStyle = frameFill;
  ctx.lineWidth = 2;
  ctx.strokeRect(BOARD.x, BOARD.y, BOARD.w, BOARD.h);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = wallTheme.frameSpec;
  ctx.lineWidth = 1;
  ctx.strokeRect(BOARD.x, BOARD.y, BOARD.w, BOARD.h);
  ctx.restore();

  // Tunnel wall effects
  const tWalls = new Set();
  if (state.tunnelPreview) tWalls.add(state.tunnelPreview.wall);
  for (const w of state.disabledWalls.keys()) tWalls.add(w);
  if (tWalls.size) {
    ctx.save();
    for (const w of tWalls) {
      const dx = w.b.x - w.a.x, dy = w.b.y - w.a.y, sl = Math.hypot(dx, dy) || 1;
      const tx = dx / sl, ty = dy / sl, px = -ty, py = tx;
      const spread = Math.max(18, wallHalfWidth(w) * 2.2);
      // Noise band
      for (let i = 0, n = Math.max(34, sl / 4 | 0); i < n; i++) {
        const t = i / n, j = (Math.random() - .5) * spread, s = (Math.random() - .5) * 12;
        ctx.fillStyle = Math.random() > .45 ? "rgba(255,255,255,0.42)" : "rgba(255,255,255,0.18)";
        ctx.fillRect(w.a.x + dx * t + px * j + tx * s, w.a.y + dy * t + py * j + ty * s, Math.random() > .75 ? 2 : 1, 1);
      }
      // Wireframe
      const steps = Math.max(14, sl / 30 | 0);
      ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 1;
      for (let i = 0; i < steps - 1; i++) {
        const t0 = i / steps, t1 = (i + 1) / steps;
        const bx0 = w.a.x + dx * t0, by0 = w.a.y + dy * t0;
        const bx1 = w.a.x + dx * t1, by1 = w.a.y + dy * t1;
        const wb0 = (Math.random() - .5) * spread * 0.7, wb1 = (Math.random() - .5) * spread * 0.7;
        ctx.beginPath();
        ctx.moveTo(bx0 + px * wb0, by0 + py * wb0); ctx.lineTo(bx1 + px * wb1, by1 + py * wb1);
        ctx.lineTo(bx1, by1); ctx.lineTo(bx0, by0); ctx.closePath(); ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Walls
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const w of walls) {
    if (w.isFrame) continue;
    const dis = state.disabledWalls.has(w);
    const thickness = wallWidth(w);
    const pattern = getWallPattern(thickness);
    const dash = dis ? [12, 10] : (w.dash || []);

    ctx.setLineDash(dash);
    ctx.save();
    ctx.shadowColor = dis ? wallTheme.glowDisabled : wallTheme.glow;
    ctx.shadowBlur = Math.max(12, thickness * 1.25);
    ctx.lineWidth = thickness + 8;
    ctx.strokeStyle = dis ? wallTheme.disabledHaloStroke : wallTheme.haloStroke;
    ctx.beginPath(); ctx.moveTo(w.a.x, w.a.y); ctx.lineTo(w.b.x, w.b.y); ctx.stroke();
    ctx.restore();
    ctx.lineWidth = thickness + 4;
    ctx.strokeStyle = dis ? wallTheme.disabledOutline : wallTheme.outline;
    ctx.beginPath(); ctx.moveTo(w.a.x, w.a.y); ctx.lineTo(w.b.x, w.b.y); ctx.stroke();

    ctx.lineWidth = thickness;
    if (dis) {
      ctx.strokeStyle = "rgba(255,255,255,0.28)";
    } else {
      ctx.strokeStyle = pattern || (w.color || "#f5f5f5");
    }
    ctx.beginPath(); ctx.moveTo(w.a.x, w.a.y); ctx.lineTo(w.b.x, w.b.y); ctx.stroke();
    if (!dis) {
      ctx.save();
      ctx.setLineDash([]);
      ctx.globalCompositeOperation = "screen";
      ctx.shadowColor = wallTheme.glowCore;
      ctx.shadowBlur = Math.max(8, thickness * 0.85);
      ctx.strokeStyle = getWallInnerGradient(w, thickness);
      ctx.lineWidth = Math.max(2, thickness * 0.84);
      ctx.beginPath(); ctx.moveTo(w.a.x, w.a.y); ctx.lineTo(w.b.x, w.b.y); ctx.stroke();
      ctx.strokeStyle = wallTheme.innerSpec;
      ctx.lineWidth = Math.max(1, thickness * 0.2);
      ctx.beginPath(); ctx.moveTo(w.a.x, w.a.y); ctx.lineTo(w.b.x, w.b.y); ctx.stroke();
      ctx.strokeStyle = wallTheme.innerSpec2;
      ctx.lineWidth = Math.max(1, thickness * 0.12);
      ctx.beginPath(); ctx.moveTo(w.a.x, w.a.y); ctx.lineTo(w.b.x, w.b.y); ctx.stroke();
      ctx.restore();
    }
  }
  ctx.setLineDash([]); ctx.restore();

  // Particles
  if (particles.length) {
    ctx.save(); ctx.beginPath(); ctx.rect(BOARD.x, BOARD.y, BOARD.w, BOARD.h); ctx.clip();
    for (const p of particles) {
      const lt = 1 - p.age / p.life; if (lt <= 0) continue;
      const ts = p.kind === "vacuum" ? 0.03 : 0.018;
      ctx.strokeStyle = `rgba(255,255,255,${p.alpha * lt})`;
      ctx.lineWidth = p.size; ctx.shadowColor = "rgba(255,255,255,0.7)"; ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(p.x - p.vx * ts, p.y - p.vy * ts);
      ctx.lineTo(p.x + p.vx * ts * 0.22, p.y + p.vy * ts * 0.22); ctx.stroke();
    }
    ctx.restore();
  }

  // Trail
  if (trail.length > 1) {
    ctx.save();
    const palette = state.showAllTrails
      ? ROD_COLORS
      : (state.collectedTrailColors && state.collectedTrailColors.length
      ? state.collectedTrailColors
      : ["#ffffff"]);
    const parsedPalette = palette.map(hex => {
      const value = parseInt(String(hex).replace("#", ""), 16);
      return {
        r: (value >> 16) & 255,
        g: (value >> 8) & 255,
        b: value & 255
      };
    });
    const stripeCount = parsedPalette.length;
    const stripeWidth = Math.max(2.2, (b.radius * 2) / 7);
    const stripeSpacing = stripeWidth;
    ctx.globalCompositeOperation = "screen";
    for (let i = 1; i < trail.length; i++) {
      const prev = trail[i - 1], n = trail[i];
      const life = clamp(n.life, 0, 1);
      const fade = life * life;  // quadratic fade — tail fades to transparent
      const a = fade;
      const segDx = n.x - prev.x, segDy = n.y - prev.y;
      const segLen = Math.hypot(segDx, segDy) || 1;
      const px = -segDy / segLen, py = segDx / segLen;
      const center = (stripeCount - 1) * 0.5;

      // Compute smooth midpoints for quadratic curves
      const mx0 = (prev.x + n.x) * 0.5, my0 = (prev.y + n.y) * 0.5;
      const useCurve = i > 1 && i < trail.length - 1;
      const next = useCurve ? trail[Math.min(i + 1, trail.length - 1)] : n;
      const prevPrev = i > 1 ? trail[i - 2] : prev;
      const mx1 = (prevPrev.x + prev.x) * 0.5, my1 = (prevPrev.y + prev.y) * 0.5;

      for (let s = 0; s < stripeCount; s++) {
        const c = parsedPalette[s];
        const vivid = {
          r: Math.min(255, Math.round(c.r * 1.15 + 18)),
          g: Math.min(255, Math.round(c.g * 1.15 + 18)),
          b: Math.min(255, Math.round(c.b * 1.15 + 18))
        };
        const offset = (s - center) * stripeSpacing;
        const ox = px * offset, oy = py * offset;

        // Outer glow pass
        ctx.strokeStyle = `rgba(${vivid.r},${vivid.g},${vivid.b},${a * 0.4})`;
        ctx.lineWidth = stripeWidth * 1.45;
        ctx.shadowColor = `rgba(${vivid.r},${vivid.g},${vivid.b},${a * 0.88})`;
        ctx.shadowBlur = (14 + 10 * a) * fade;
        ctx.lineCap = "round"; ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(prev.x + ox, prev.y + oy);
        if (useCurve) {
          ctx.quadraticCurveTo(n.x + ox, n.y + oy, mx0 + ox, my0 + oy);
        } else {
          ctx.lineTo(n.x + ox, n.y + oy);
        }
        ctx.stroke();

        // Core stripe pass
        ctx.strokeStyle = `rgba(${vivid.r},${vivid.g},${vivid.b},${a * 0.95})`;
        ctx.lineWidth = stripeWidth;
        ctx.shadowColor = `rgba(${vivid.r},${vivid.g},${vivid.b},${a * 0.94})`;
        ctx.shadowBlur = (8 + 6 * a) * fade;
        ctx.beginPath();
        ctx.moveTo(prev.x + ox, prev.y + oy);
        if (useCurve) {
          ctx.quadraticCurveTo(n.x + ox, n.y + oy, mx0 + ox, my0 + oy);
        } else {
          ctx.lineTo(n.x + ox, n.y + oy);
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ── Goal Rod (Neon Stick) ──
  drawGoalRod(ctx);

  // Balloon
  ctx.save();
  if (b.tunnelGhost > 0.01) {
    const gh = clamp(b.tunnelGhost, 0, 1), vl = Math.hypot(b.vx, b.vy) || 1;
    const nx = b.vx / vl, ny = b.vy / vl, px = -ny, py = nx, sp = 18 * gh;
    ctx.globalCompositeOperation = "screen";
    for (const c of [
      { r: 255, g: 80, b: 80, ox: -sp + px * 4, oy: py * 4 },
      { r: 110, g: 255, b: 120, ox: 0, oy: 0 },
      { r: 80, g: 110, b: 255, ox: sp - px * 4, oy: -py * 4 }
    ]) {
      ctx.beginPath(); ctx.arc(b.x + c.ox, b.y + c.oy, b.radius * 0.97, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${0.34 + gh * 0.26})`;
      ctx.shadowColor = `rgba(${c.r},${c.g},${c.b},0.8)`; ctx.shadowBlur = 24; ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  }
  if (warm > 0.02) {
    const hg = ctx.createRadialGradient(b.x, b.y, b.radius * .8, b.x, b.y, b.radius * 2.6);
    hg.addColorStop(0, `rgba(255,160,70,${warm * 0.46})`); hg.addColorStop(1, "rgba(255,160,70,0)");
    ctx.fillStyle = hg; ctx.fillRect(b.x - b.radius * 3, b.y - b.radius * 3, b.radius * 6, b.radius * 6);
  }
  // Draw cat sprite
  const catSprite = state.hackerMode ? catHackerSprite : catNormalSprite;
  const spriteSize = b.radius * 2.4 * (state.hackerMode ? 1.2 : 1);
  const spriteW = spriteSize * 1.4;
  const spriteH = spriteSize;
  if (warm >= cool) {
    ctx.shadowColor = `rgba(255,${Math.round(220 - warm * 70)},${Math.round(180 - warm * 110)},${clamp(0.7 + warm * .3, .6, 1)})`;
  } else {
    ctx.shadowColor = `rgba(${Math.round(220 - cool * 40)},${Math.round(242 - cool * 20)},255,${clamp(0.7 + cool * .3, .6, 1)})`;
  }
  ctx.shadowBlur = 56;
  if (catSprite.complete && catSprite.naturalWidth) {
    ctx.drawImage(catSprite, b.x - spriteW * 0.5, b.y - spriteH * 0.5, spriteW, spriteH);
  } else {
    // Fallback circle if sprite not loaded yet
    const fr = Math.round(252 - cool * 18), fg = Math.round(252 - warm * 24 + cool * 4);
    const fb = Math.round(252 - warm * 44 + cool * 26);
    ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${fr},${fg},${fb},0.985)`; ctx.fill();
  }
  ctx.restore();

  // Crosshair + cursor icon
  if (state.dragging && tool) {
    ctx.save(); ctx.lineWidth = 3; ctx.strokeStyle = "rgba(255,255,255,0.93)";
    ctx.shadowColor = tool.accent; ctx.shadowBlur = 9; ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(pointer.x - 16, pointer.y); ctx.lineTo(pointer.x - 5, pointer.y);
    ctx.moveTo(pointer.x + 5, pointer.y); ctx.lineTo(pointer.x + 16, pointer.y);
    ctx.moveTo(pointer.x, pointer.y - 16); ctx.lineTo(pointer.x, pointer.y - 5);
    ctx.moveTo(pointer.x, pointer.y + 5); ctx.lineTo(pointer.x, pointer.y + 16);
    ctx.stroke(); ctx.restore();

    // Small tool icon at cursor for heat, cold, mass
    const cursorIconIds = ["heat", "cold", "mass"];
    if (cursorIconIds.includes(tool.id)) {
      const cImg = toolIconSprites[tool.id];
      if (cImg && cImg.complete && cImg.naturalWidth) {
        const cSize = 30;
        ctx.save();
        ctx.globalAlpha = 0.92;
        ctx.shadowColor = tool.accent;
        ctx.shadowBlur = 6;
        ctx.drawImage(cImg, pointer.x + 10, pointer.y - cSize - 6, cSize, cSize);
        ctx.restore();
      }
    }
  }

  // Canvas sidebar
  drawSidebar(ctx);

  // Cute tooltip bubble (normal mode only)
  drawToolTooltip(ctx);

  // Update HTML panels
  updateHTMLPanels();
}

// ─── HTML PANEL UPDATES ──────────────────────────────────────
function updateHTMLPanels() {
  const b = balloon;
  const tool = state.activeTool >= 0 ? TOOLS[state.activeTool] : null;

  // Title — always static
  const titleEl = document.getElementById("topbar-title");
  if (titleEl) titleEl.textContent = "The Neon Cat";

  // Level indicator
  const levelEl = document.getElementById("topbar-equation");
  if (levelEl) {
    levelEl.textContent = "Level " + state.level + " / " + state.maxLevel;
    levelEl.classList.add("visible");
  }

  // Tool buttons highlight
  const btns = document.querySelectorAll(".tool-btn");
  btns.forEach((btn, i) => {
    btn.classList.toggle("dragging", state.dragging && i === state.activeTool);
  });

  // Left panel: tool info blocks
  const leftHeader = document.getElementById("left-panel-header");
  if (leftHeader) {
    leftHeader.textContent = state.hackerMode ? "// FIELD MODELS" : "Abilities";
  }
  const toolBlocks = document.querySelectorAll(".tool-info-block");
  toolBlocks.forEach((block, i) => {
    const t = TOOLS[i];
    const isActive = state.dragging && state.activeTool === i;
    block.classList.toggle("active", isActive);
    const symEl = block.querySelector(".tool-info-symbol");
    const nameEl = block.querySelector(".tool-info-name");
    const eqLine = block.querySelector(".tool-info-eq");
    if (state.hackerMode) {
      if (symEl) symEl.textContent = TOOL_HACKER_SYMBOLS[t.id] || "?";
      if (nameEl) nameEl.textContent = t.name;
      // Keep KaTeX-rendered equation in left panel (don't overwrite with plain text)
      // The equation was already rendered by KaTeX at build time
      if (eqLine && !eqLine.querySelector('.katex')) {
        // Fallback: re-render if katex content lost
        const latex = (typeof TOOL_LATEX_EQUATIONS !== 'undefined' && TOOL_LATEX_EQUATIONS[t.id]) || t.equation;
        if (typeof katex !== 'undefined') {
          katex.render(latex, eqLine, { throwOnError: false, displayMode: false });
        } else {
          eqLine.textContent = t.equation;
        }
      }
    } else {
      if (symEl) symEl.textContent = t.name.charAt(0).toUpperCase();
      if (nameEl) nameEl.textContent = t.name;
      if (eqLine) eqLine.textContent = TOOL_DESCRIPTIONS[t.id] || t.title;
    }
  });

  // Right panel stats
  const rightPanel = document.getElementById("right-panel");
  const statsBody = document.getElementById("stats-body");
  if (rightPanel && statsBody) {
    if (state.hackerMode) {
      rightPanel.classList.remove("hidden");
      const spd = Math.hypot(b.vx, b.vy);
      const ke = 0.5 * b.mass * spd * spd;
      const peY = b.mass * 9.81 * (BOARD.y + BOARD.h - b.y);
      const mom = b.mass * spd;
      const ang = Math.atan2(b.vy, b.vx) * 180 / Math.PI;
      const effCount = state.activeEffects.length;
      const rows = [
        ["pos", "(" + b.x.toFixed(1) + ", " + b.y.toFixed(1) + ")"],
        ["vel", "(" + b.vx.toFixed(1) + ", " + b.vy.toFixed(1) + ")"],
        ["|v|", spd.toFixed(2) + " px/s"],
        ["\u03B8", ang.toFixed(1) + "\u00B0"],
        ["mass", b.mass.toFixed(2) + " kg"],
        ["species", "cat"],
        ["radius", b.radius.toFixed(1) + " px"],
        ["K\u2091", ke.toFixed(0) + " J"],
        ["U\u1D67", peY.toFixed(0) + " J"],
        ["p", mom.toFixed(1) + " kg\u00B7px/s"],
        ["T", (b.temp >= 0 ? "+" : "") + b.temp.toFixed(2)],
        ["effects", effCount.toString()],
      ];
      let html = "";
      for (const [label, value] of rows) {
        html += '<div class="stat-row"><span class="stat-label">' + label + '</span><span class="stat-value">' + value + '</span></div>';
      }
      statsBody.innerHTML = html;
    } else {
      rightPanel.classList.add("hidden");
    }
  }

  // Bottom info
  const bottomEl = document.getElementById("bottom-info");
  if (bottomEl) {
    const _fin = TOOLS.filter(t => state.toolUses[t.id] !== Infinity);
    const _rem = _fin.reduce((s, t) => s + state.toolUses[t.id], 0);
    const _tot = _fin.reduce((s, t) => s + t.maxUses, 0);
    bottomEl.textContent = _tot > 0 ? "Charges: " + _rem + "/" + _tot : "Drag an ability from the left panel onto the board";
  }
}
