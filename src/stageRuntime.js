import { CAT_SPAWN, GOAL_RADIUS, getGoalRodPosition, STAGES } from "./config.js";

export function maybeAdvanceStage(gameState, physics) {
  const cat = physics?.cat;
  if (!cat) {
    return false;
  }

  const goal = getGoalRodPosition();
  const dist = Math.hypot(cat.x - goal.x, cat.y - goal.y);

  if (dist > GOAL_RADIUS + cat.radius) {
    return false;
  }

  gameState.stageIndex = (gameState.stageIndex + 1) % STAGES.length;

  cat.x = CAT_SPAWN.x;
  cat.y = CAT_SPAWN.y;
  cat.vx = -28;
  cat.vy = -20;

  physics.trail.length = 0;
  gameState.activeDrops.length = 0;
  return true;
}
