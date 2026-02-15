export const TOOL_OVERLAY_KIND = {
  heat: "thermal_out",
  cold: "thermal_in",
  gravity: "gravity_in",
  highPressure: "pressure_out",
  vacuum: "pressure_in",
  quantumTunneling: "noise_purple",
};

export function toolUsesGrid(toolId) {
  return toolId === "gravity";
}
