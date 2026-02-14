import { LAYOUT } from "../src/config.js";
import { ThermoAutomata } from "../src/thermoAutomata.js";

const field = new ThermoAutomata(LAYOUT.board, 20);
const cx = LAYOUT.board.x + LAYOUT.board.width * 0.5;
const cy = LAYOUT.board.y + LAYOUT.board.height * 0.5;
const dt = 1 / 60;

function step(toolId, steps) {
  for (let i = 0; i < steps; i += 1) {
    field.update(dt, {
      activeTool: toolId,
      applying: true,
      pointerX: cx,
      pointerY: cy,
      pointerInBoard: true,
    });
  }
}

function assertFiniteArray(name, arr) {
  for (let i = 0; i < arr.length; i += 1) {
    const value = arr[i];
    if (!Number.isFinite(value)) {
      throw new Error(`${name} contains non-finite value at ${i}`);
    }
  }
}

const baseline = field.sample(cx, cy);
if (Math.abs(baseline.temperature - 1) > 1e-6 || Math.abs(baseline.pressure - 1) > 1e-6) {
  throw new Error("thermo baseline should start at ambient state");
}

step("heat", 30);
const heated = field.sample(cx, cy);
if (heated.temperature <= 1.2) {
  throw new Error(`heat forcing too weak: T=${heated.temperature.toFixed(3)}`);
}
if (heated.pressure >= 0.97) {
  throw new Error(`heat should reduce local pressure: p=${heated.pressure.toFixed(3)}`);
}

step("cold", 30);
const cooled = field.sample(cx, cy);
if (cooled.temperature >= 0.85) {
  throw new Error(`cold forcing too weak: T=${cooled.temperature.toFixed(3)}`);
}
if (cooled.pressure <= 1.05) {
  throw new Error(`cold should increase local pressure: p=${cooled.pressure.toFixed(3)}`);
}

step("highPressure", 25);
const pressurized = field.sample(cx, cy);
if (pressurized.pressure <= 1.45) {
  throw new Error(`highPressure forcing too weak: p=${pressurized.pressure.toFixed(3)}`);
}

step("vacuum", 25);
const evacuated = field.sample(cx, cy);
if (evacuated.pressure >= pressurized.pressure - 0.35) {
  throw new Error("vacuum should meaningfully lower pressure after highPressure");
}

step("entropy", 25);
const chaotic = field.sample(cx, cy);
if (chaotic.entropy <= 0.35) {
  throw new Error(`entropy forcing too weak: S=${chaotic.entropy.toFixed(3)}`);
}

assertFiniteArray("temperature", field.temp);
assertFiniteArray("pressure", field.pressure);
assertFiniteArray("entropy", field.entropy);

console.log("thermo-ca-smoke: ok");
