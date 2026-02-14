import { clamp } from "./math.js";

const AMBIENT_TEMP = 1;
const AMBIENT_PRESSURE = 1;

export class ThermoAutomata {
  constructor(board, cellSize = 20) {
    this.board = board;
    this.cellSize = cellSize;
    this.cols = Math.max(2, Math.ceil(board.width / cellSize));
    this.rows = Math.max(2, Math.ceil(board.height / cellSize));
    this.size = this.cols * this.rows;
    this.time = 0;

    this.temp = new Float32Array(this.size);
    this.pressure = new Float32Array(this.size);
    this.entropy = new Float32Array(this.size);

    this.nextTemp = new Float32Array(this.size);
    this.nextPressure = new Float32Array(this.size);
    this.nextEntropy = new Float32Array(this.size);

    this.temp.fill(AMBIENT_TEMP);
    this.pressure.fill(AMBIENT_PRESSURE);
    this.entropy.fill(0);
  }

  index(cx, cy) {
    return cy * this.cols + cx;
  }

  clampCx(cx) {
    return clamp(cx, 0, this.cols - 1);
  }

  clampCy(cy) {
    return clamp(cy, 0, this.rows - 1);
  }

  worldToCell(x, y) {
    const cx = this.clampCx(Math.floor((x - this.board.x) / this.cellSize));
    const cy = this.clampCy(Math.floor((y - this.board.y) / this.cellSize));
    return { cx, cy };
  }

  cellToWorld(cx, cy) {
    return {
      x: this.board.x + (cx + 0.5) * this.cellSize,
      y: this.board.y + (cy + 0.5) * this.cellSize,
    };
  }

  forEachCellInRadius(worldX, worldY, radius, fn) {
    const minCx = this.clampCx(Math.floor((worldX - radius - this.board.x) / this.cellSize));
    const maxCx = this.clampCx(Math.floor((worldX + radius - this.board.x) / this.cellSize));
    const minCy = this.clampCy(Math.floor((worldY - radius - this.board.y) / this.cellSize));
    const maxCy = this.clampCy(Math.floor((worldY + radius - this.board.y) / this.cellSize));

    for (let cy = minCy; cy <= maxCy; cy += 1) {
      for (let cx = minCx; cx <= maxCx; cx += 1) {
        const world = this.cellToWorld(cx, cy);
        const dx = world.x - worldX;
        const dy = world.y - worldY;
        const dist = Math.hypot(dx, dy);
        if (dist > radius) {
          continue;
        }
        const influence = clamp(1 - dist / radius, 0, 1);
        fn(cx, cy, this.index(cx, cy), influence);
      }
    }
  }

  update(dt, control = null) {
    const step = clamp(dt, 1 / 180, 1 / 30);
    this.time += step;

    if (control?.applying && control.pointerInBoard) {
      this.injectTool(control.activeTool, control.pointerX, control.pointerY, step);
    }

    const kTemp = 3.6;
    const kPressure = 3.1;
    const relaxTemp = 0.72;
    const relaxPressure = 0.66;
    const entropyDecay = 0.58;

    for (let cy = 0; cy < this.rows; cy += 1) {
      for (let cx = 0; cx < this.cols; cx += 1) {
        const i = this.index(cx, cy);

        const left = this.index(this.clampCx(cx - 1), cy);
        const right = this.index(this.clampCx(cx + 1), cy);
        const up = this.index(cx, this.clampCy(cy - 1));
        const down = this.index(cx, this.clampCy(cy + 1));

        const t = this.temp[i];
        const p = this.pressure[i];
        const s = this.entropy[i];

        const lapTemp = this.temp[left] + this.temp[right] + this.temp[up] + this.temp[down] - 4 * t;
        const lapPressure = this.pressure[left] + this.pressure[right] + this.pressure[up] + this.pressure[down] - 4 * p;

        const gradTempX = 0.5 * (this.temp[right] - this.temp[left]);
        const gradTempY = 0.5 * (this.temp[down] - this.temp[up]);
        const gradPressureX = 0.5 * (this.pressure[right] - this.pressure[left]);
        const gradPressureY = 0.5 * (this.pressure[down] - this.pressure[up]);

        const entropyProduction =
          (Math.abs(gradTempX) + Math.abs(gradTempY) + Math.abs(gradPressureX) + Math.abs(gradPressureY)) * 0.34;

        const nextTemp = t + step * (kTemp * lapTemp - relaxTemp * (t - AMBIENT_TEMP));
        const nextPressure = p + step * (kPressure * lapPressure - relaxPressure * (p - AMBIENT_PRESSURE));
        const nextEntropy = s + step * (entropyProduction - entropyDecay * s);

        this.nextTemp[i] = clamp(nextTemp, 0.25, 2.8);
        this.nextPressure[i] = clamp(nextPressure, 0.2, 3.2);
        this.nextEntropy[i] = clamp(nextEntropy, 0, 2.4);
      }
    }

    this._swapBuffers();
  }

  injectTool(toolId, pointerX, pointerY, dt) {
    const radius = toolId === "entropy" ? 210 : 170;

    this.forEachCellInRadius(pointerX, pointerY, radius, (cx, cy, i, influence) => {
      const energy = influence * influence;

      switch (toolId) {
        case "heat":
          this.temp[i] = clamp(this.temp[i] + dt * 3.8 * energy, 0.25, 2.8);
          this.pressure[i] = clamp(this.pressure[i] - dt * 0.35 * influence, 0.2, 3.2);
          break;
        case "cold":
          this.temp[i] = clamp(this.temp[i] - dt * 5.9 * energy, 0.25, 2.8);
          this.pressure[i] = clamp(this.pressure[i] + dt * 1.85 * influence, 0.2, 3.2);
          break;
        case "highPressure":
          this.pressure[i] = clamp(this.pressure[i] + dt * 3.2 * energy, 0.2, 3.2);
          this.entropy[i] = clamp(this.entropy[i] + dt * 0.6 * influence, 0, 2.4);
          break;
        case "vacuum":
          this.pressure[i] = clamp(this.pressure[i] - dt * 3.2 * energy, 0.2, 3.2);
          this.entropy[i] = clamp(this.entropy[i] + dt * 0.45 * influence, 0, 2.4);
          break;
        case "entropy": {
          const phase = Math.sin((this.time + cx * 0.31 + cy * 0.47) * 5.3);
          this.temp[i] = clamp(this.temp[i] + dt * 1.55 * phase * influence, 0.25, 2.8);
          this.pressure[i] = clamp(this.pressure[i] - dt * 1.35 * phase * influence, 0.2, 3.2);
          this.entropy[i] = clamp(this.entropy[i] + dt * 1.9 * influence, 0, 2.4);
          break;
        }
        default:
          break;
      }
    });
  }

  sample(worldX, worldY) {
    const fx = clamp((worldX - this.board.x) / this.cellSize, 0, this.cols - 1);
    const fy = clamp((worldY - this.board.y) / this.cellSize, 0, this.rows - 1);
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const x1 = this.clampCx(x0 + 1);
    const y1 = this.clampCy(y0 + 1);
    const tx = fx - x0;
    const ty = fy - y0;

    const i00 = this.index(x0, y0);
    const i10 = this.index(x1, y0);
    const i01 = this.index(x0, y1);
    const i11 = this.index(x1, y1);

    const temperature = bilerp(this.temp[i00], this.temp[i10], this.temp[i01], this.temp[i11], tx, ty);
    const pressure = bilerp(this.pressure[i00], this.pressure[i10], this.pressure[i01], this.pressure[i11], tx, ty);
    const entropy = bilerp(this.entropy[i00], this.entropy[i10], this.entropy[i01], this.entropy[i11], tx, ty);

    const left = this.index(this.clampCx(x0 - 1), y0);
    const right = this.index(this.clampCx(x0 + 1), y0);
    const up = this.index(x0, this.clampCy(y0 - 1));
    const down = this.index(x0, this.clampCy(y0 + 1));

    const gradTempX = 0.5 * (this.temp[right] - this.temp[left]);
    const gradTempY = 0.5 * (this.temp[down] - this.temp[up]);
    const gradPressureX = 0.5 * (this.pressure[right] - this.pressure[left]);
    const gradPressureY = 0.5 * (this.pressure[down] - this.pressure[up]);

    return {
      temperature,
      pressure,
      entropy,
      gradTempX,
      gradTempY,
      gradPressureX,
      gradPressureY,
      cellX: x0,
      cellY: y0,
    };
  }

  _swapBuffers() {
    [this.temp, this.nextTemp] = [this.nextTemp, this.temp];
    [this.pressure, this.nextPressure] = [this.nextPressure, this.pressure];
    [this.entropy, this.nextEntropy] = [this.nextEntropy, this.entropy];
  }
}

function bilerp(v00, v10, v01, v11, tx, ty) {
  const a = v00 + (v10 - v00) * tx;
  const b = v01 + (v11 - v01) * tx;
  return a + (b - a) * ty;
}
