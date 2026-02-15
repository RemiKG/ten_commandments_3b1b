import { TOOLS } from "../src/config.js";
import { TOOL_OVERLAY_KIND, toolUsesGrid } from "../src/fieldModes.js";

const ids = TOOLS.map((tool) => tool.id);
if (ids.length !== 6) {
  throw new Error(`expected 6 tools, got ${ids.length}`);
}

for (const id of ids) {
  if (!TOOL_OVERLAY_KIND[id]) {
    throw new Error(`missing overlay kind for tool: ${id}`);
  }
}

const gridTools = ids.filter((id) => toolUsesGrid(id));
if (gridTools.length !== 1 || gridTools[0] !== "gravity") {
  throw new Error(`expected only gravity to use grid, got: ${gridTools.join(",")}`);
}

if (TOOL_OVERLAY_KIND.gravity !== "gravity_in") {
  throw new Error("gravity must map to inward warped-grid overlay");
}

console.log("overlay-mode-smoke: ok");
