// Level + wall authoring system
function normalizePoint(pt) {
  if (Array.isArray(pt) && pt.length === 2) return { x: pt[0], y: pt[1] };
  if (pt && typeof pt.x === "number" && typeof pt.y === "number") return { x: pt.x, y: pt.y };
  throw new Error("Point must be [x, y] or {x, y}.");
}

class Wall {
  constructor(from, to, props = {}) {
    const a = normalizePoint(from);
    const b = normalizePoint(to);
    this.a = { x: a.x, y: a.y };
    this.b = { x: b.x, y: b.y };
    this.isFrame = !!props.isFrame;
    this.width = props.width != null ? props.width : DEFAULT_WALL_WIDTH;
    this.canTunnel = props.canTunnel !== false;
    this.friction = props.friction;
    this.elasticity = props.elasticity;
    this.color = props.color || null;
    this.lineWidth = props.lineWidth;
    this.dash = Array.isArray(props.dash) ? props.dash.slice() : null;
    this.meta = props.meta || null;
  }
}

class SpecialWall extends Wall {
  constructor(from, to, props = {}) {
    super(from, to, {
      canTunnel: false,
      width: DEFAULT_WALL_WIDTH,
      friction: 0.985,
      elasticity: 0.95,
      color: "#ffd67a",
      lineWidth: 3,
      dash: [10, 6],
      ...props
    });
    this.isSpecial = true;
  }
}

class LevelBuilder {
  constructor(id, opts = {}) {
    this.id = id;
    this.width = opts.width ?? W;
    this.height = opts.height ?? H;
    const origin = normalizePoint(opts.origin || [0, 0]);
    this.originX = origin.x;
    this.originY = origin.y;
    this._walls = [];
  }

  mapPoint(pt) {
    const p = normalizePoint(pt);
    return [p.x + this.originX, p.y + this.originY];
  }

  wall(from, to, props = {}) {
    const a = this.mapPoint(from);
    const b = this.mapPoint(to);
    this._walls.push(new Wall(a, b, props));
    return this;
  }

  specialWall(from, to, props = {}) {
    const a = this.mapPoint(from);
    const b = this.mapPoint(to);
    this._walls.push(new SpecialWall(a, b, props));
    return this;
  }

  frameRect(x, y, w, h, props = {}) {
    const frameProps = { ...props, isFrame: true, canTunnel: false };
    return this
      .wall([x, y], [x + w, y], frameProps)
      .wall([x + w, y], [x + w, y + h], frameProps)
      .wall([x + w, y + h], [x, y + h], frameProps)
      .wall([x, y + h], [x, y], frameProps);
  }

  build() {
    return this._walls.slice();
  }
}

const LEVEL_DEFS = new Map();

function defineLevel(id, buildFn) {
  LEVEL_DEFS.set(id, buildFn);
}

function createLevel(id) {
  const buildFn = LEVEL_DEFS.get(id);
  if (!buildFn) throw new Error("Unknown level id: " + id);
  const level = new LevelBuilder(id, { width: W, height: H });
  buildFn(level);
  return level.build();
}

function availableLevels() {
  return Array.from(LEVEL_DEFS.keys());
}

let currentLevelId = "lvl1";
let walls = [];

function setLevel(id) {
  walls = createLevel(id);
  currentLevelId = id;
  if (typeof state !== "undefined") {
    state.disabledWalls.clear();
    state.tunnelPreview = null;
  }
  return walls;
}

function parseAsciiMap(ascii) {
  const lines = String(ascii).replace(/\r/g, "").split("\n");
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  let minIndent = Infinity;
  for (const line of lines) {
    if (!line.trim()) continue;
    const indent = line.match(/^\s*/)[0].length;
    if (indent < minIndent) minIndent = indent;
  }
  if (!isFinite(minIndent)) minIndent = 0;
  return lines.map(line => line.slice(minIndent));
}

function normalizeLegendEntry(symbol, def, id) {
  const cfg = def === true ? {} : (def || {});
  const kind = cfg.kind === "special" || cfg.special === true ? "special" : "wall";
  const props = cfg.props ? { ...cfg.props } : { ...cfg };
  delete props.kind;
  delete props.special;
  delete props.solid;
  return { id, symbol, kind, solid: cfg.solid !== false, props };
}

// Build wall segments from an ASCII layout.
// - Use parseAsciiMap(`...`) to keep layout readable in source.
// - Any symbol in legend becomes a solid wall cell.
// - Adjacent solid cells are merged into long segments automatically.
function wallsFromAscii(level, rows, opts = {}) {
  if (typeof rows === "string") rows = parseAsciiMap(rows);
  const origin = normalizePoint(opts.origin || [0, 0]);
  const cell = opts.cell || 40;
  const mergeSegments = opts.mergeSegments !== false;
  const legendInput = opts.legend || {};

  const legend = {};
  let nextId = 0;
  for (const [symbol, def] of Object.entries(legendInput)) {
    legend[symbol] = normalizeLegendEntry(symbol, def, nextId++);
  }

  let width = 0;
  for (const row of rows) width = Math.max(width, row.length);
  const grid = rows.map(row => row.padEnd(width, " "));
  const height = grid.length;

  const isSolidAt = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return false;
    const entry = legend[grid[y][x]];
    return !!(entry && entry.solid);
  };
  const entryAt = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return null;
    const entry = legend[grid[y][x]];
    return entry && entry.solid ? entry : null;
  };

  const hGroups = new Map();
  const vGroups = new Map();
  const addH = (entry, y, x0, x1) => {
    const key = `${entry.id}|${y}`;
    if (!hGroups.has(key)) hGroups.set(key, { entry, y, spans: [] });
    hGroups.get(key).spans.push([x0, x1]);
  };
  const addV = (entry, x, y0, y1) => {
    const key = `${entry.id}|${x}`;
    if (!vGroups.has(key)) vGroups.set(key, { entry, x, spans: [] });
    vGroups.get(key).spans.push([y0, y1]);
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const entry = entryAt(x, y);
      if (!entry) continue;
      if (!isSolidAt(x, y - 1)) addH(entry, y, x, x + 1);
      if (!isSolidAt(x, y + 1)) addH(entry, y + 1, x, x + 1);
      if (!isSolidAt(x - 1, y)) addV(entry, x, y, y + 1);
      if (!isSolidAt(x + 1, y)) addV(entry, x + 1, y, y + 1);
    }
  }

  const emit = (entry, x0, y0, x1, y1) => {
    const from = [origin.x + x0 * cell, origin.y + y0 * cell];
    const to = [origin.x + x1 * cell, origin.y + y1 * cell];
    if (entry.kind === "special") level.specialWall(from, to, { ...entry.props });
    else level.wall(from, to, { ...entry.props });
  };

  const flushGroup = (group, isHorizontal) => {
    const spans = group.spans.slice().sort((a, b) => a[0] - b[0]);
    let cur = spans[0].slice();
    for (let i = 1; i < spans.length; i++) {
      const s = spans[i];
      if (mergeSegments && s[0] <= cur[1]) cur[1] = Math.max(cur[1], s[1]);
      else {
        if (isHorizontal) emit(group.entry, cur[0], group.y, cur[1], group.y);
        else emit(group.entry, group.x, cur[0], group.x, cur[1]);
        cur = s.slice();
      }
    }
    if (isHorizontal) emit(group.entry, cur[0], group.y, cur[1], group.y);
    else emit(group.entry, group.x, cur[0], group.x, cur[1]);
  };

  for (const group of hGroups.values()) flushGroup(group, true);
  for (const group of vGroups.values()) flushGroup(group, false);
  return level;
}

// Quick console access
window.Wall = Wall;
window.SpecialWall = SpecialWall;
window.LevelBuilder = LevelBuilder;
window.defineLevel = defineLevel;
window.availableLevels = availableLevels;
window.setLevel = setLevel;
window.parseAsciiMap = parseAsciiMap;
window.wallsFromAscii = wallsFromAscii;
