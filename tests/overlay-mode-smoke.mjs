import { TOOLS } from "../src/config.js";

const TOOL_OVERLAY_KIND = {
  heat: "thermal_out",
  cold: "thermal_in",
  mass: "gravity_in",
  darkEnergy: "gravity_out",
  highPressure: "pressure_out",
  vacuum: "pressure_in",
  tunneling: "noise_purple",
  viscosity: "noise_cold",
  elasticity: "rings",
  entropy: "entropy",
};

const ids = TOOLS.map((tool) => tool.id);
for (const id of ids) {
  if (!TOOL_OVERLAY_KIND[id]) {
    throw new Error(`missing overlay kind for tool: ${id}`);
  }
}

const gridTools = ids.filter((id) => id === "mass" || id === "darkEnergy");
if (gridTools.length !== 2) {
  throw new Error("expected exactly two grid tools");
}

const gravityKinds = [TOOL_OVERLAY_KIND.mass, TOOL_OVERLAY_KIND.darkEnergy];
if (!gravityKinds.includes("gravity_in") || !gravityKinds.includes("gravity_out")) {
  throw new Error("mass and darkEnergy must map to gravity grid overlay kinds");
}

console.log("overlay-mode-smoke: ok");
