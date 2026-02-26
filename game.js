// ─── GAME STATE ──────────────────────────────────────────────
const balloon = {
  x: BOARD.x + BOARD.w * 0.5, y: BOARD.y + BOARD.h * 0.52,
  vx: -48, vy: -34,
  radius: BASE_RAD, targetRadius: BASE_RAD,
  mass: BASE_MASS, elasticity: BASE_ELAST,
  damping: 0, temp: 0, tunnelGhost: 0
};
const trail = [];
const particles = [];
const pointer = { x: 0, y: 0, down: false, pressed: false, released: false };
const state = {
  activeTool: 0,
  dragging: false,
  activeEffects: [],
  disabledWalls: new Map(),
  tunnelPreview: null,
  toolUses: {},
  hackerMode: false,
  hoverTool: -1,
  hoverToolPrev: -1,
  hoverStart: 0,
  tooltipAlpha: 0,
  level: 1,
  maxLevel: 7,
  goalRod: null,         // { x, y, h } — set per level
  collectedTrailColors: [], // rod colors collected so far (stacked trail stripes)
  showAllTrails: false,  // debug override: render all 7 trail colors
  winFlash: 0,           // flash timer on win
  transitioning: false   // prevent input during transition
};
for (const t of TOOLS) state.toolUses[t.id] = t.maxUses != null ? t.maxUses : Infinity;

// Goal rod and spawn from level registry
function initGoalRod() {
  const p = getLevelPlacement(state.level);
  state.goalRod = { ...p.goalRod };

  // Ensure rod does not overlap with walls.
  // The sprite is drawn at 3× height and tilted 30°, so we check multiple
  // sample points along the rod's visual extent.
  const rodH = state.goalRod.h;
  const spriteH = rodH * 3;                       // visual height
  const tiltRad = 30 * Math.PI / 180;
  const halfLen = spriteH * 0.5;
  // Direction vector along the tilted rod
  const dirX = Math.sin(tiltRad);   //  sin(30°) ≈ 0.5
  const dirY = -Math.cos(tiltRad);  // -cos(30°) ≈ -0.87 (points up)
  const checkRadius = 20;  // clearance around each sample point

  function rodOverlapsWalls(rx, ry) {
    // Sample 5 points along the rod length (center + top/bottom + 2 intermediates)
    for (let t = -1; t <= 1; t += 0.5) {
      const px = rx + dirX * halfLen * t;
      const py = ry + dirY * halfLen * t;
      for (const w of walls) {
        if (state.disabledWalls && state.disabledWalls.has(w)) continue;
        const cp = closestPt(px, py, w.a.x, w.a.y, w.b.x, w.b.y);
        const dist = Math.hypot(px - cp.x, py - cp.y);
        if (dist < checkRadius + wallHalfWidth(w)) return true;
      }
    }
    return false;
  }

  let maxTries = 60;
  while (maxTries-- > 0) {
    if (!rodOverlapsWalls(state.goalRod.x, state.goalRod.y + rodH * 0.5)) break;
    // Nudge rod in a spiral pattern
    const angle = (60 - maxTries) * Math.PI / 8;
    const r = 15 + 5 * (60 - maxTries);
    state.goalRod.x = p.goalRod.x + Math.cos(angle) * r;
    state.goalRod.y = p.goalRod.y + Math.sin(angle) * r;
  }
}
// Initialize level 1 walls + goal rod at startup
setLevel(currentLevelId);
initGoalRod();

// Set cat spawn from registry
(function initCatSpawn() {
  const p = getLevelPlacement(state.level);
  balloon.x = p.catSpawn.x;
  balloon.y = p.catSpawn.y;
  balloon.vx = 0;
  balloon.vy = 0;
})();

// ─── AUDIO ───────────────────────────────────────────────────
// Per-file volume normalization (tweak these if a specific sound is too loud/quiet)
const SFX_VOLUMES = {
  "Assets/Audios/heat.mp3":     0.45,
  "Assets/Audios/cold.mp3":     0.25,
  "Assets/Audios/gravity.mp3":  0.40,
  "Assets/Audios/pressure.mp3": 0.35,
  "Assets/Audios/vacuum.mp3":   0.40,
  "Assets/Audios/quantum.mp3":  0.05,
};
const BGM_VOLUME       = 0.30;
const BGM_HACKER_VOLUME = 0.55;

const audio = {
  cache: {},
  bgm: null,
  bgmStarted: false,
  bgmHacker: null,

  load(src) {
    if (!this.cache[src]) {
      const a = new Audio(src);
      a.preload = "auto";
      this.cache[src] = a;
    }
    return this.cache[src];
  },

  play(src, volume) {
    if (!src) return;
    const norm = SFX_VOLUMES[src] != null ? SFX_VOLUMES[src] : 0.45;
    const a = this.load(src).cloneNode();
    a.volume = volume != null ? volume : norm;
    a.play().catch(() => {});
  },

  startBGM() {
    if (this.bgmStarted) return;
    this.bgmStarted = true;
    this.bgm = new Audio("Assets/Audios/theme.mp3");
    this.bgm.loop = true;
    this.bgm.volume = BGM_VOLUME;
    this.bgmHacker = new Audio("Assets/Audios/hacker_theme.mp3");
    this.bgmHacker.loop = true;
    this.bgmHacker.volume = BGM_HACKER_VOLUME;
    this.syncBGM();
  },

  syncBGM() {
    if (!this.bgmStarted) return;
    if (state.hackerMode) {
      this.bgm.pause();
      this.bgmHacker.currentTime = this.bgm.currentTime || 0;
      this.bgmHacker.play().catch(() => {});
    } else {
      this.bgmHacker.pause();
      this.bgm.currentTime = this.bgmHacker.currentTime || 0;
      this.bgm.play().catch(() => {});
    }
  }
};
// Preload all ability sounds
for (const t of TOOLS) { if (t.sound) audio.load(t.sound); }

// ─── CANVAS SETUP ────────────────────────────────────────────
const canvas = document.getElementById("c");
canvas.width = W; canvas.height = H;
const ctx = canvas.getContext("2d", { alpha: false });
ctx.imageSmoothingEnabled = true;

function fit() {
  const wrap = document.getElementById("canvas-wrap");
  if (!wrap) return;
  const mW = wrap.clientWidth, mH = wrap.clientHeight;
  if (mW <= 0 || mH <= 0) return;
  let w = mW, h = w / (W / H);
  if (h > mH) { h = mH; w = h * (W / H); }
  canvas.style.width = w + "px"; canvas.style.height = h + "px";
}
fit(); addEventListener("resize", fit);
// Re-fit after a short delay to catch layout settling
setTimeout(fit, 100);

// ─── BUILD HTML TOOL BUTTONS ─────────────────────────────────
const TOOL_SYMBOLS = { heat: "\u2191\u0394T", cold: "\u2193\u0394T", mass: "M\u2299", highPressure: "\u21c8P", vacuum: "\u21ca P", tunneling: "\u03a8\u22a5" };
const TOOL_HACKER_SYMBOLS = { heat: "\u2202T", cold: "\u2202T", mass: "G\u2297", highPressure: "\u2202P", vacuum: "u\u1d63", tunneling: "\u03a8\u22a5" };
const TOOL_DESCRIPTIONS = {
  heat: "Thermal expansion\u2002\u00b7\u2002",
  cold: "Cryogenic compression\u2002\u00b7\u2002",
  mass: "Gravity well\u2002\u00b7\u2002Weak attraction",
  highPressure: "Pressure wave\u2002\u00b7\u2002Push impulse",
  vacuum: "Vacuum pull\u2002\u00b7\u2002Inward impulse",
  tunneling: "Quantum tunnel\u2002\u00b7\u2002Phase through walls"
};
(function buildToolList() {
  const list = document.getElementById("tool-list");
  if (!list) return;
  TOOLS.forEach((t, i) => {
    const btn = document.createElement("button");
    btn.className = "tool-btn";
    btn.dataset.index = i;
    const uses = state.toolUses[t.id];
    btn.innerHTML = '<span class="tool-icon" style="color:' + t.accent + '">' + (TOOL_SYMBOLS[t.id] || "?") + '</span>'
      + '<span class="tool-label">' + t.name + '</span>'
      + '<span class="tool-uses">' + (uses === Infinity ? '\u221e' : '\u00d7' + uses) + '</span>';
    btn.addEventListener("pointerdown", e => {
      e.preventDefault();
      audio.startBGM();
      if (state.toolUses[t.id] > 0) {
        state.activeTool = i;
        state.dragging = true;
      }
    });
    list.appendChild(btn);
  });
  refreshToolUsesUI();
})();

// Refresh all sidebar tool-use counters (called on level change / reset)
function refreshToolUsesUI() {
  const btns = document.querySelectorAll(".tool-btn");
  TOOLS.forEach((t, i) => {
    if (!btns[i]) return;
    const uses = state.toolUses[t.id];
    const usesEl = btns[i].querySelector(".tool-uses");
    if (usesEl) usesEl.textContent = uses === Infinity ? "\u221e" : "\u00d7" + uses;
    // Grey out tools with 0 uses (Infinity never grey)
    btns[i].classList.toggle("tool-empty", uses !== Infinity && uses <= 0);
  });
}

const TOOL_ICON_PATHS = {
  heat: "Assets/VisualExamples/heat.png",
  cold: "Assets/VisualExamples/cold.png",
  mass: "Assets/VisualExamples/gravity.png",
  highPressure: "Assets/VisualExamples/pressure.png",
  vacuum: "Assets/VisualExamples/vacuum.png",
  tunneling: "Assets/VisualExamples/quantum.png"
};

// ─── BUILD LEFT PANEL TOOL INFO BLOCKS ───────────────────────
// LaTeX equations for KaTeX rendering (left panel, static)
const TOOL_LATEX_EQUATIONS = {
  heat:         '\\frac{dT}{dt} = k\\nabla^2 T + Q',
  cold:         '\\frac{dT}{dt} = k\\nabla^2 T - Q_c',
  mass:         'F = -\\frac{GMm}{r^2}',
  highPressure: '\\frac{\\partial p}{\\partial t} = c^2 \\nabla \\cdot \\mathbf{u} + S_p',
  vacuum:       'u_r = -\\frac{k}{r^2}',
  tunneling:    'P_{\\text{tunnel}} \\sim e^{-2\\kappa L}'
};

(function buildToolInfoList() {
  const list = document.getElementById("tool-info-list");
  if (!list) return;
  TOOLS.forEach((t, i) => {
    const block = document.createElement("div");
    block.className = "tool-info-block";
    block.dataset.toolIndex = i;
    const iconSrc = TOOL_ICON_PATHS[t.id] || "";
    block.innerHTML =
      '<div class="tool-info-top">' +
        '<span class="tool-info-symbol">' + (TOOL_HACKER_SYMBOLS[t.id] || "?") + '</span>' +
        '<img class="tool-info-icon" src="' + iconSrc + '" alt="' + t.name + '">' +
        '<span class="tool-info-name">' + t.name + '</span>' +
      '</div>' +
      '<div class="tool-info-eq"></div>';
    // Render equation with KaTeX if available
    const eqEl = block.querySelector('.tool-info-eq');
    const latex = TOOL_LATEX_EQUATIONS[t.id] || t.equation;
    if (typeof katex !== 'undefined') {
      katex.render(latex, eqEl, { throwOnError: false, displayMode: false });
    } else {
      // KaTeX may not be loaded yet (defer) — retry once loaded
      eqEl.textContent = t.equation;
      window.addEventListener('load', () => {
        if (typeof katex !== 'undefined') {
          katex.render(latex, eqEl, { throwOnError: false, displayMode: false });
        }
      });
    }
    list.appendChild(block);
  });
})();

// ─── HACKER CHECKBOX (HTML) ──────────────────────────────────
function applyThemeClass() {
  document.body.classList.toggle("normal-mode", !state.hackerMode);
}
const hackerCb = document.getElementById("hacker-cb");
if (hackerCb) {
  hackerCb.checked = state.hackerMode;
  applyThemeClass();
  hackerCb.addEventListener("change", () => {
    state.hackerMode = hackerCb.checked;
    applyThemeClass();
    audio.syncBGM();
  });
}

// ─── PARTICLES ───────────────────────────────────────────────
function spawnBurst(x, y, inward) {
  const count = inward ? 46 : 32;
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    if (inward) {
      const r = 85 + Math.random() * 265;
      const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
      const ia = Math.atan2(y - py, x - px), s = 240 + Math.random() * 520;
      particles.push({ x: px, y: py, vx: Math.cos(ia) * s, vy: Math.sin(ia) * s,
        tx: x, ty: y, kind: "vacuum", age: 0, life: 0.3 + Math.random() * 0.44,
        size: 0.9 + Math.random() * 1.5, alpha: 0.55 + Math.random() * 0.45 });
    } else {
      const s = 260 + Math.random() * 420;
      particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        kind: "pressure", age: 0, life: 0.25 + Math.random() * 0.37,
        size: 0.8 + Math.random() * 1.4, alpha: 0.48 + Math.random() * 0.47 });
    }
  }
}

// ─── INPUT ───────────────────────────────────────────────────
function readPointer(e) {
  const r = canvas.getBoundingClientRect();
  pointer.x = clamp((e.clientX - r.left) * (W / r.width), 0, W);
  pointer.y = clamp((e.clientY - r.top) * (H / r.height), 0, H);
}
// Use document-level move/up so dragging from HTML tools onto canvas works
document.addEventListener("pointermove", e => {
  readPointer(e);
  // Sidebar hover tracking
  state.hoverTool = -1;
  for (let i = 0; i < TOOLS.length; i++) {
    if (ptInRect(pointer.x, pointer.y, sidebarRect(i))) {
      state.hoverTool = i;
      break;
    }
  }
  // Tooltip hover timer
  if (state.hoverTool !== state.hoverToolPrev) {
    state.hoverToolPrev = state.hoverTool;
    state.hoverStart = performance.now();
    state.tooltipAlpha = 0;
  }
  canvas.style.cursor = state.hoverTool >= 0 ? "pointer" : "";
});
canvas.addEventListener("pointerdown", e => {
  readPointer(e); pointer.down = true; pointer.pressed = true;
  audio.startBGM();
  // Canvas sidebar tool selection
  for (let i = 0; i < TOOLS.length; i++) {
    const rect = sidebarRect(i);
    if (ptInRect(pointer.x, pointer.y, rect) && state.toolUses[TOOLS[i].id] > 0) {
      state.activeTool = i;
      state.dragging = true;
      return;
    }
  }
});
document.addEventListener("pointerup", e => {
  readPointer(e); pointer.down = false; pointer.released = true;
  // Drop the ability
  if (state.dragging && state.activeTool >= 0) {
    state.dragging = false;
    const tool = TOOLS[state.activeTool];
    const ok = tool.allowOutsideBoard || pointInBoard(pointer.x, pointer.y);
    if (ok && state.toolUses[tool.id] > 0) {
      const eff = tool.createEffect(pointer.x, pointer.y, balloon, state);
      if (eff) {
        state.activeEffects.push(eff);
        audio.play(tool.sound);
        if (state.toolUses[tool.id] !== Infinity) {
          state.toolUses[tool.id]--;
          // Update HTML uses display
          const btns = document.querySelectorAll(".tool-btn");
          if (btns[state.activeTool]) {
            const usesEl = btns[state.activeTool].querySelector(".tool-uses");
            if (usesEl) usesEl.textContent = "\u00d7" + state.toolUses[tool.id];
            btns[state.activeTool].classList.toggle("tool-empty", state.toolUses[tool.id] <= 0);
          }
        }
      }
    }
    state.activeTool = -1;
  }
});

// ─── UPDATE ──────────────────────────────────────────────────
function update(dt) {
  dt = clamp(dt, 1 / 180, 1 / 25);

  // Win flash decay
  if (state.winFlash > 0) state.winFlash -= dt * 1.8;

  // Block everything during transition
  if (state.transitioning) return;

  // Decay disabled walls
  for (const [w, ttl] of state.disabledWalls) {
    if (ttl - dt <= 0) state.disabledWalls.delete(w); else state.disabledWalls.set(w, ttl - dt);
  }

  // Reset per-frame balloon defaults
  balloon.damping = 0;
  balloon.mass = BASE_MASS;
  balloon.elasticity = BASE_ELAST;
  balloon.targetRadius = BASE_RAD;
  balloon.tunnelGhost = Math.max(0, balloon.tunnelGhost - dt * 2.2);
  balloon.temp *= Math.exp(-dt * 1.5);

  // Tunnel wall preview while dragging
  state.tunnelPreview = null;
  if (state.dragging && state.activeTool >= 0 && TOOLS[state.activeTool].id === "tunneling") {
    state.tunnelPreview = findNearestWall(pointer.x, pointer.y, 40);
  }

  // Process active effects
  for (let i = state.activeEffects.length - 1; i >= 0; i--) {
    const eff = state.activeEffects[i];
    eff.update(dt, balloon, state);
    if (eff.dead) state.activeEffects.splice(i, 1);
  }

  // Integrate
  balloon.radius += (balloon.targetRadius - balloon.radius) * Math.min(dt * 6.4, 1);
  const damp = Math.exp(-(BASE_DAMP / Math.max(1, balloon.mass) + balloon.damping) * dt);
  balloon.vx *= damp; balloon.vy *= damp;
  const spd = Math.hypot(balloon.vx, balloon.vy);
  if (spd > MAX_SPEED) { const f = MAX_SPEED / spd; balloon.vx *= f; balloon.vy *= f; }
  balloon.x += balloon.vx * dt;
  balloon.y += balloon.vy * dt;

  // Wall collisions
  for (let iter = 0; iter < 4; iter++) {
    let hit = false;
    for (const w of walls) {
      if (state.disabledWalls.has(w)) continue;
      const cp = closestPt(balloon.x, balloon.y, w.a.x, w.a.y, w.b.x, w.b.y);
      let dx = balloon.x - cp.x, dy = balloon.y - cp.y, dist = Math.hypot(dx, dy);
      const minDist = balloon.radius + wallHalfWidth(w);
      if (dist >= minDist) continue;
      hit = true;
      let nx, ny;
      if (dist > 0.0001) { nx = dx / dist; ny = dy / dist; }
      else {
        const sl = Math.hypot(w.b.x - w.a.x, w.b.y - w.a.y) || 1;
        const tx = (w.b.x - w.a.x) / sl, ty = (w.b.y - w.a.y) / sl;
        nx = -ty; ny = tx;
        if (dot(balloon.x - w.a.x, balloon.y - w.a.y, nx, ny) < 0) { nx *= -1; ny *= -1; }
        dist = 0;
      }
      balloon.x += nx * (minDist - dist);
      balloon.y += ny * (minDist - dist);
      const nv = dot(balloon.vx, balloon.vy, nx, ny);
      if (nv < 0) {
        const wallElasticity = w.elasticity != null ? w.elasticity : balloon.elasticity;
        balloon.vx -= (1 + wallElasticity) * nv * nx;
        balloon.vy -= (1 + wallElasticity) * nv * ny;
        const tx = -ny, ty = nx, tv = dot(balloon.vx, balloon.vy, tx, ty);
        const fric = w.friction != null ? w.friction : (w.isFrame ? 0.995 : 0.992);
        balloon.vx -= tv * (1 - fric) * tx;
        balloon.vy -= tv * (1 - fric) * ty;
      }
    }
    if (!hit) break;
  }

  // Hard clamp to board boundaries (prevent escaping maze)
  const bMinX = BOARD.x + balloon.radius;
  const bMaxX = BOARD.x + BOARD.w - balloon.radius;
  const bMinY = BOARD.y + balloon.radius;
  const bMaxY = BOARD.y + BOARD.h - balloon.radius;
  if (balloon.x < bMinX) { balloon.x = bMinX; if (balloon.vx < 0) balloon.vx *= -BASE_ELAST; }
  if (balloon.x > bMaxX) { balloon.x = bMaxX; if (balloon.vx > 0) balloon.vx *= -BASE_ELAST; }
  if (balloon.y < bMinY) { balloon.y = bMinY; if (balloon.vy < 0) balloon.vy *= -BASE_ELAST; }
  if (balloon.y > bMaxY) { balloon.y = bMaxY; if (balloon.vy > 0) balloon.vy *= -BASE_ELAST; }

  // Trail
  const head = trail[trail.length - 1];
  if (!head || Math.hypot(head.x - balloon.x, head.y - balloon.y) > 2.2)
    trail.push({ x: balloon.x, y: balloon.y, life: 1 });
  for (const n of trail) n.life -= dt * 0.56;
  while (trail.length && trail[0].life <= 0) trail.shift();
  if (trail.length > TRAIL_MAX) trail.splice(0, trail.length - TRAIL_MAX);

  // Particles
  for (const p of particles) {
    p.age += dt;
    if (p.kind === "vacuum") {
      const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy) || 1;
      const acc = 640 / (d * 0.25 + 40);
      p.vx += (dx / d) * acc; p.vy += (dy / d) * acc;
    }
    p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.984; p.vy *= 0.984;
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    if (particles[i].age >= particles[i].life) particles.splice(i, 1);
  }

  pointer.pressed = false; pointer.released = false;

  // ── Win check: cat touches goal rod ──
  checkWin();
}

function checkWin() {
  const rod = state.goalRod;
  if (!rod || state.transitioning) return;
  // Check if cat center is close enough to the rod
  const dx = balloon.x - rod.x;
  const dy = balloon.y - clamp(balloon.y, rod.y, rod.y + rod.h);
  const dist = Math.hypot(dx, dy);
  if (dist < balloon.radius + 12) {
    triggerWin();
  }
}

function triggerWin() {
  state.transitioning = true;
  state.winFlash = 1;
  const rodColor = ROD_COLORS[(state.level - 1) % ROD_COLORS.length];
  if (rodColor && !state.collectedTrailColors.includes(rodColor)) {
    state.collectedTrailColors.push(rodColor);
  }

  setTimeout(() => {
    if (state.level < state.maxLevel) {
      goToLevel(state.level + 1);
    } else {
      // Beat all 7 levels! (placeholder: just flash)
      state.winFlash = 2;
      state.transitioning = false;
    }
  }, 600);
}

function goToLevel(n) {
  n = clamp(Math.floor(n), 1, state.maxLevel);
  state.level = n;
  // Load correct wall data
  const lvlId = "lvl" + n;
  if (availableLevels().includes(lvlId)) {
    setLevel(lvlId);
  }
  // Use per-level placement data
  const p = getLevelPlacement(n);
  balloon.x = p.catSpawn.x;
  balloon.y = p.catSpawn.y;
  balloon.vx = 0;
  balloon.vy = 0;
  balloon.radius = BASE_RAD; balloon.targetRadius = BASE_RAD;
  balloon.temp = 0; balloon.tunnelGhost = 0;

  // --- Ensure cat does not spawn inside a wall ---
  let maxTries = 60, angle = 0, found = false;
  while (maxTries-- > 0) {
    let overlap = false;
    for (const w of walls) {
      if (state.disabledWalls && state.disabledWalls.has(w)) continue;
      // Closest point on wall segment
      const cp = typeof closestPt === 'function' ? closestPt(balloon.x, balloon.y, w.a.x, w.a.y, w.b.x, w.b.y) : {x:balloon.x, y:balloon.y};
      const dist = Math.hypot(balloon.x - cp.x, balloon.y - cp.y);
      const minDist = balloon.radius + (typeof wallHalfWidth === 'function' ? wallHalfWidth(w) : 10);
      if (dist < minDist) { overlap = true; break; }
    }
    if (!overlap) { found = true; break; }
    // Nudge outward in a spiral
    angle += Math.PI / 5;
    const r = 8 + 4 * (60 - maxTries);
    balloon.x = p.catSpawn.x + Math.cos(angle) * r;
    balloon.y = p.catSpawn.y + Math.sin(angle) * r;
  }
  if (!found) {
    // Fallback: place at board center
    balloon.x = BOARD.x + BOARD.w * 0.5;
    balloon.y = BOARD.y + BOARD.h * 0.5;
  }

  // Clear trail and effects
  trail.length = 0;
  particles.length = 0;
  state.activeEffects.length = 0;
  state.disabledWalls.clear();
  state.tunnelPreview = null;
  state.dragging = false;
  state.activeTool = -1;
  // Reset tool uses
  // Load per-level tool counts
  const pc = getLevelPlacement(n);
  for (const t of TOOLS) {
    state.toolUses[t.id] = (pc.toolCounts && pc.toolCounts[t.id] != null) ? pc.toolCounts[t.id] : 0;
  }
  refreshToolUsesUI();
  // Re-init goal rod for new level
  initGoalRod();
  state.transitioning = false;
  // Update input
  const inp = document.getElementById("level-input");
  if (inp) inp.value = n;
}

// Reset level button
(function initResetBtn() {
  const btn = document.getElementById("reset-level-btn");
  if (!btn) return;
  btn.addEventListener("click", () => goToLevel(state.level));
})();

// Level jump UI
(function initLevelJump() {
  const btn = document.getElementById("level-go-btn");
  const inp = document.getElementById("level-input");
  const allCb = document.getElementById("all-trails-cb");
  if (!btn || !inp) return;
  btn.addEventListener("click", () => goToLevel(parseInt(inp.value) || 1));
  inp.addEventListener("keydown", e => {
    if (e.key === "Enter") goToLevel(parseInt(inp.value) || 1);
  });
  if (allCb) {
    allCb.checked = state.showAllTrails;
    allCb.addEventListener("change", () => {
      state.showAllTrails = !!allCb.checked;
    });
  }
})();

// ─── GAME LOOP ───────────────────────────────────────────────
let lastTime = 0;
(function tick(ts) {
  const dt = lastTime ? (ts - lastTime) / 1000 : 1 / 60;
  lastTime = ts;
  update(dt); draw();
  requestAnimationFrame(tick);
})(0);
