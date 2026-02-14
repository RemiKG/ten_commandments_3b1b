import { WORLD_HEIGHT, WORLD_WIDTH } from "./config.js";
import { GameLoop } from "./gameLoop.js";
import { InputHandler } from "./inputHandler.js";
import { PhysicsEngine } from "./physicsEngine.js";
import { Renderer } from "./renderer.js";

const canvas = document.getElementById("gameCanvas");
canvas.width = WORLD_WIDTH;
canvas.height = WORLD_HEIGHT;

const ctx = canvas.getContext("2d");
const input = new InputHandler(canvas);
const physics = new PhysicsEngine();
const renderer = new Renderer(ctx, physics, input);

const loop = new GameLoop({
  update: (dt) => physics.update(dt),
  render: () => renderer.render(),
});

loop.start();
