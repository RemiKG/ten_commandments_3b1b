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

function applySteps(engine, particles, control, steps) {
  for (let i = 0; i < steps; i += 1) {
    engine.update(dt, control(i), particles);
    particles.update(dt);
  }
}

{
  const { engine, particles } = createHarness();
  const base = engine.balloon.radius;
  const px = engine.balloon.x - 40;
  const py = engine.balloon.y;

  applySteps(
    engine,
    particles,
    () => ({ activeTool: "heat", applying: true, pointerX: px, pointerY: py, pointerPressed: false }),
    24,
  );

  if (engine.balloon.radius <= base + 0.8) {
    throw new Error("heat did not expand balloon radius");
  }
  if (engine.balloon.temperature <= 0) {
    throw new Error("heat did not raise temperature");
  }
}

{
  const { engine, particles } = createHarness();
  const base = engine.balloon.radius;
  const px = engine.balloon.x;
  const py = engine.balloon.y;

  applySteps(
    engine,
    particles,
    () => ({ activeTool: "cold", applying: true, pointerX: px, pointerY: py, pointerPressed: false }),
    24,
  );

  if (engine.balloon.radius >= base - 0.8) {
    throw new Error("cold did not shrink balloon radius");
  }
  if (engine.balloon.temperature >= 0) {
    throw new Error("cold did not lower temperature");
  }
}

{
  const { engine, particles } = createHarness();
  engine.balloon.x = LAYOUT.board.x + 280;
  engine.balloon.y = LAYOUT.board.y + 300;
  engine.balloon.vx = 0;
  engine.balloon.vy = 0;

  const px = engine.balloon.x + 240;
  const py = engine.balloon.y;

  engine.update(dt, { activeTool: "mass", applying: true, pointerX: px, pointerY: py, pointerPressed: false }, particles);
  if (engine.balloon.vx <= 0) {
    throw new Error("mass did not attract toward pointer");
  }
}

{
  const { engine, particles } = createHarness();
  engine.balloon.x = LAYOUT.board.x + 280;
  engine.balloon.y = LAYOUT.board.y + 340;
  engine.balloon.vx = 0;
  engine.balloon.vy = 0;

  const px = engine.balloon.x + 240;
  const py = engine.balloon.y;

  engine.update(dt, { activeTool: "darkEnergy", applying: true, pointerX: px, pointerY: py, pointerPressed: false }, particles);
  if (engine.balloon.vx >= 0) {
    throw new Error("darkEnergy did not repel from pointer");
  }
}

{
  const { engine, particles } = createHarness();
  engine.balloon.x = LAYOUT.board.x + 620;
  engine.balloon.y = LAYOUT.board.y + 340;
  engine.balloon.vx = 0;
  engine.balloon.vy = 0;

  const px = engine.balloon.x - 80;
  const py = engine.balloon.y;

  engine.update(dt, { activeTool: "highPressure", applying: true, pointerX: px, pointerY: py, pointerPressed: true }, particles);
  if (engine.balloon.vx <= 0) {
    throw new Error("highPressure did not push away from pointer");
  }
  if (particles.items.length === 0) {
    throw new Error("highPressure did not emit particles");
  }
}

{
  const { engine, particles } = createHarness();
  engine.balloon.x = LAYOUT.board.x + 640;
  engine.balloon.y = LAYOUT.board.y + 360;
  engine.balloon.vx = 0;
  engine.balloon.vy = 0;

  const px = engine.balloon.x - 90;
  const py = engine.balloon.y;

  engine.update(dt, { activeTool: "vacuum", applying: true, pointerX: px, pointerY: py, pointerPressed: true }, particles);
  if (engine.balloon.vx >= 0) {
    throw new Error("vacuum did not pull toward pointer");
  }
  if (particles.items.length === 0) {
    throw new Error("vacuum did not emit particles");
  }
}

{
  const { engine, particles } = createHarness();
  const px = LAYOUT.board.x + LAYOUT.board.width - 300;
  const py = LAYOUT.board.y + 350;

  engine.update(dt, { activeTool: "tunneling", applying: true, pointerX: px, pointerY: py, pointerPressed: true }, particles);
  if (engine.disabledWalls.size === 0) {
    throw new Error("tunneling did not disable a wall segment");
  }
  if (!engine.tunnelPreview) {
    throw new Error("tunneling did not set preview target");
  }
}

{
  const withViscosity = createHarness();
  const withoutViscosity = createHarness();

  withViscosity.engine.balloon.vx = 420;
  withoutViscosity.engine.balloon.vx = 420;

  applySteps(
    withViscosity.engine,
    withViscosity.particles,
    () => ({ activeTool: "viscosity", applying: true, pointerX: 600, pointerY: 300, pointerPressed: false }),
    8,
  );
  applySteps(
    withoutViscosity.engine,
    withoutViscosity.particles,
    () => ({ activeTool: "heat", applying: false, pointerX: 0, pointerY: 0, pointerPressed: false }),
    8,
  );

  if (Math.abs(withViscosity.engine.balloon.vx) >= Math.abs(withoutViscosity.engine.balloon.vx)) {
    throw new Error("viscosity did not damp velocity more than baseline");
  }
}

{
  const { engine, particles } = createHarness();
  engine.update(dt, { activeTool: "elasticity", applying: true, pointerX: 600, pointerY: 300, pointerPressed: false }, particles);
  if (engine.balloon.elasticity <= BASE_PHYSICS.elasticity) {
    throw new Error("elasticity tool did not increase restitution");
  }
}

{
  const { engine, particles } = createHarness();
  engine.balloon.vx = 0;
  engine.balloon.vy = 0;

  applySteps(
    engine,
    particles,
    () => ({ activeTool: "entropy", applying: true, pointerX: 700, pointerY: 350, pointerPressed: false }),
    18,
  );

  const speed = Math.hypot(engine.balloon.vx, engine.balloon.vy);
  if (speed <= 2) {
    throw new Error("entropy did not inject chaotic velocity");
  }
}

console.log("tool-mechanics-smoke: ok");
