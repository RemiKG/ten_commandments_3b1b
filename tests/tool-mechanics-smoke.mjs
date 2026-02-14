import { BASE_PHYSICS, LAYOUT } from "../src/config.js";
import { ParticleSystem } from "../src/particles.js";
import { PhysicsEngine } from "../src/physicsEngine.js";

const dt = 1 / 60;

function createHarness() {
  return {
    engine: new PhysicsEngine(),
    particles: new ParticleSystem(),
  };
}

function runSteps(engine, particles, steps, controlFactory) {
  for (let i = 0; i < steps; i += 1) {
    const control = controlFactory(i);
    engine.update(dt, control, particles);
    particles.update(dt);
  }
}

function distance(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function speedOf(balloon) {
  return Math.hypot(balloon.vx, balloon.vy);
}

{
  const { engine, particles } = createHarness();
  engine.balloon.vx = 0;
  engine.balloon.vy = 0;
  const startX = engine.balloon.x;
  const startY = engine.balloon.y;

  runSteps(
    engine,
    particles,
    180,
    () => ({ activeTool: "heat", applying: false, pointerX: 0, pointerY: 0, pointerPressed: false }),
  );

  const drift = distance(startX, startY, engine.balloon.x, engine.balloon.y);
  if (drift > 0.25) {
    throw new Error(`top-down no-gravity check failed, drift=${drift.toFixed(3)}`);
  }
}

{
  const { engine, particles } = createHarness();
  const baseRadius = engine.balloon.radius;
  const px = engine.balloon.x - 80;
  const py = engine.balloon.y;

  runSteps(
    engine,
    particles,
    32,
    () => ({ activeTool: "heat", applying: true, pointerX: px, pointerY: py, pointerPressed: false }),
  );

  if (engine.balloon.radius <= baseRadius + 1.5) {
    throw new Error("heat did not meaningfully expand balloon");
  }
  if (engine.balloon.temperature <= 0.25) {
    throw new Error("heat did not meaningfully increase temperature");
  }
  if (engine.balloon.vx <= 18) {
    throw new Error("heat did not meaningfully push outward");
  }
}

{
  const coldHarness = createHarness();
  const baseHarness = createHarness();

  coldHarness.engine.balloon.vx = 320;
  coldHarness.engine.balloon.vy = -140;
  baseHarness.engine.balloon.vx = 320;
  baseHarness.engine.balloon.vy = -140;

  const px = coldHarness.engine.balloon.x;
  const py = coldHarness.engine.balloon.y;

  runSteps(
    coldHarness.engine,
    coldHarness.particles,
    28,
    () => ({ activeTool: "cold", applying: true, pointerX: px, pointerY: py, pointerPressed: false }),
  );

  runSteps(
    baseHarness.engine,
    baseHarness.particles,
    28,
    () => ({ activeTool: "heat", applying: false, pointerX: px, pointerY: py, pointerPressed: false }),
  );

  const coldSpeed = speedOf(coldHarness.engine.balloon);
  const baseSpeed = speedOf(baseHarness.engine.balloon);

  if (coldHarness.engine.balloon.radius >= 31) {
    throw new Error("cold did not meaningfully shrink balloon");
  }
  if (coldHarness.engine.balloon.temperature >= -0.2) {
    throw new Error("cold did not meaningfully cool balloon");
  }
  if (coldSpeed >= baseSpeed * 0.78) {
    throw new Error("cold did not make balloon meaningfully heavier/slower");
  }
}

{
  const { engine, particles } = createHarness();
  engine.balloon.x = LAYOUT.board.x + 420;
  engine.balloon.y = LAYOUT.board.y + 340;
  engine.balloon.vx = 0;
  engine.balloon.vy = 0;

  const px = engine.balloon.x + 260;
  const py = engine.balloon.y - 30;
  const startDist = distance(engine.balloon.x, engine.balloon.y, px, py);

  runSteps(
    engine,
    particles,
    40,
    () => ({ activeTool: "mass", applying: true, pointerX: px, pointerY: py, pointerPressed: false }),
  );

  const endDist = distance(engine.balloon.x, engine.balloon.y, px, py);
  if (endDist >= startDist - 18) {
    throw new Error("mass did not meaningfully attract toward pointer");
  }
}

{
  const { engine, particles } = createHarness();
  engine.balloon.x = LAYOUT.board.x + 420;
  engine.balloon.y = LAYOUT.board.y + 340;
  engine.balloon.vx = 0;
  engine.balloon.vy = 0;

  const px = engine.balloon.x + 260;
  const py = engine.balloon.y - 30;
  const startDist = distance(engine.balloon.x, engine.balloon.y, px, py);

  runSteps(
    engine,
    particles,
    40,
    () => ({ activeTool: "darkEnergy", applying: true, pointerX: px, pointerY: py, pointerPressed: false }),
  );

  const endDist = distance(engine.balloon.x, engine.balloon.y, px, py);
  if (endDist <= startDist + 18) {
    throw new Error("darkEnergy did not meaningfully repel from pointer");
  }
}

{
  const { engine, particles } = createHarness();
  engine.balloon.x = LAYOUT.board.x + 660;
  engine.balloon.y = LAYOUT.board.y + 360;
  engine.balloon.vx = 0;
  engine.balloon.vy = 0;

  const px = engine.balloon.x - 85;
  const py = engine.balloon.y;

  engine.update(dt, { activeTool: "highPressure", applying: true, pointerX: px, pointerY: py, pointerPressed: true }, particles);
  particles.update(dt);

  if (engine.balloon.vx <= 160) {
    throw new Error("highPressure did not create a strong outward impulse");
  }
  if (particles.items.length < 12) {
    throw new Error("highPressure did not spawn enough particles");
  }
}

{
  const { engine, particles } = createHarness();
  engine.balloon.x = LAYOUT.board.x + 660;
  engine.balloon.y = LAYOUT.board.y + 360;
  engine.balloon.vx = 0;
  engine.balloon.vy = 0;

  const px = engine.balloon.x - 85;
  const py = engine.balloon.y;

  engine.update(dt, { activeTool: "vacuum", applying: true, pointerX: px, pointerY: py, pointerPressed: true }, particles);
  particles.update(dt);

  if (engine.balloon.vx >= -160) {
    throw new Error("vacuum did not create a strong inward pull");
  }
  if (particles.items.length < 12) {
    throw new Error("vacuum did not spawn enough sink particles");
  }
}

{
  const wallX = LAYOUT.board.x + LAYOUT.board.width - 300;
  const y = LAYOUT.board.y + 520;

  const blockedHarness = createHarness();
  blockedHarness.engine.balloon.x = wallX - 95;
  blockedHarness.engine.balloon.y = y;
  blockedHarness.engine.balloon.vx = 420;
  blockedHarness.engine.balloon.vy = 0;

  runSteps(
    blockedHarness.engine,
    blockedHarness.particles,
    90,
    () => ({ activeTool: "heat", applying: false, pointerX: wallX, pointerY: y, pointerPressed: false }),
  );

  const blockedX = blockedHarness.engine.balloon.x;

  const tunnelHarness = createHarness();
  tunnelHarness.engine.balloon.x = wallX - 95;
  tunnelHarness.engine.balloon.y = y;
  tunnelHarness.engine.balloon.vx = 420;
  tunnelHarness.engine.balloon.vy = 0;

  runSteps(
    tunnelHarness.engine,
    tunnelHarness.particles,
    90,
    () => ({ activeTool: "tunneling", applying: true, pointerX: wallX, pointerY: y, pointerPressed: true }),
  );

  const tunnelX = tunnelHarness.engine.balloon.x;
  const radius = tunnelHarness.engine.balloon.radius;

  if (blockedX > wallX - radius + 2) {
    throw new Error("baseline collision check failed for tunneling comparison");
  }
  if (tunnelX <= wallX + radius + 10) {
    throw new Error("tunneling did not meaningfully pass through a wall segment");
  }
  if (tunnelHarness.engine.disabledWalls.size === 0 && !tunnelHarness.engine.tunnelPreview) {
    throw new Error("tunneling did not target wall segments");
  }
}

{
  const viscous = createHarness();
  const baseline = createHarness();

  viscous.engine.balloon.vx = 420;
  viscous.engine.balloon.vy = 60;
  baseline.engine.balloon.vx = 420;
  baseline.engine.balloon.vy = 60;

  runSteps(
    viscous.engine,
    viscous.particles,
    12,
    () => ({ activeTool: "viscosity", applying: true, pointerX: 800, pointerY: 400, pointerPressed: false }),
  );
  runSteps(
    baseline.engine,
    baseline.particles,
    12,
    () => ({ activeTool: "heat", applying: false, pointerX: 800, pointerY: 400, pointerPressed: false }),
  );

  if (speedOf(viscous.engine.balloon) >= speedOf(baseline.engine.balloon) * 0.55) {
    throw new Error("viscosity did not meaningfully brake velocity");
  }
}

{
  const base = createHarness();
  const elastic = createHarness();

  const startX = LAYOUT.board.x + base.engine.balloon.radius + 5;
  const startY = LAYOUT.board.y + LAYOUT.board.height * 0.5;

  base.engine.balloon.x = startX;
  base.engine.balloon.y = startY;
  base.engine.balloon.vx = -460;
  base.engine.balloon.vy = 0;

  elastic.engine.balloon.x = startX;
  elastic.engine.balloon.y = startY;
  elastic.engine.balloon.vx = -460;
  elastic.engine.balloon.vy = 0;

  runSteps(
    base.engine,
    base.particles,
    1,
    () => ({ activeTool: "heat", applying: false, pointerX: 0, pointerY: 0, pointerPressed: false }),
  );
  runSteps(
    elastic.engine,
    elastic.particles,
    1,
    () => ({ activeTool: "elasticity", applying: true, pointerX: 0, pointerY: 0, pointerPressed: false }),
  );

  if (elastic.engine.balloon.elasticity <= BASE_PHYSICS.elasticity) {
    throw new Error("elasticity tool did not set high restitution");
  }

  if (elastic.engine.balloon.vx <= base.engine.balloon.vx + 120) {
    throw new Error("elasticity did not create a meaningfully stronger bounce");
  }
}

{
  const { engine, particles } = createHarness();
  engine.balloon.vx = 0;
  engine.balloon.vy = 0;

  runSteps(
    engine,
    particles,
    45,
    () => ({ activeTool: "entropy", applying: true, pointerX: 700, pointerY: 350, pointerPressed: false }),
  );

  if (speedOf(engine.balloon) <= 22) {
    throw new Error("entropy did not inject meaningful chaotic motion");
  }
}

console.log("tool-mechanics-smoke: ok");
