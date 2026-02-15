import { CAT_SPAWN, createPowerDrop, STAGES, getGoalRodPosition } from "../src/config.js";
import { PhysicsEngine } from "../src/physicsEngine.js";
import { maybeAdvanceStage } from "../src/stageRuntime.js";

const physics = new PhysicsEngine();
const goal = getGoalRodPosition();

const state = {
  stageIndex: 0,
  activeDrops: [createPowerDrop("heat", 500, 420, 0)],
};

physics.cat.x = goal.x;
physics.cat.y = goal.y;
physics.cat.vx = 120;
physics.cat.vy = 10;
physics.trail.push({ x: 1, y: 1, life: 1 });

const advanced = maybeAdvanceStage(state, physics);
if (!advanced) {
  throw new Error("stage should advance when cat reaches goal rod");
}

if (state.stageIndex !== 1) {
  throw new Error(`expected stage index 1, got ${state.stageIndex}`);
}

if (Math.abs(physics.cat.x - CAT_SPAWN.x) > 0.01 || Math.abs(physics.cat.y - CAT_SPAWN.y) > 0.01) {
  throw new Error("cat should reset to spawn on stage advance");
}

if (state.activeDrops.length !== 0) {
  throw new Error("active drops should clear on stage advance");
}

if (physics.trail.length !== 0) {
  throw new Error("trail should clear on stage advance");
}

state.stageIndex = STAGES.length - 1;
physics.cat.x = goal.x;
physics.cat.y = goal.y;
maybeAdvanceStage(state, physics);
if (state.stageIndex !== 0) {
  throw new Error("stage index should wrap after last stage");
}

console.log("stage-runtime-smoke: ok");
