import { WORLD_WIDTH, WORLD_HEIGHT } from "./config.js";
import { GameLoop } from "./gameLoop.js";
import { InputHandler } from "./inputHandler.js";
import { PhysicsEngine } from "./physicsEngine.js";
import { Renderer } from "./renderer.js";

const canvas = document.getElementById("gameCanvas");
canvas.width = WORLD_WIDTH;
canvas.height = WORLD_HEIGHT;

const ctx = canvas.getContext("2d", { alpha: false });
ctx.imageSmoothingEnabled = true;

fitCanvas(canvas);
window.addEventListener("resize", () => fitCanvas(canvas));

const input = new InputHandler(canvas);
const physics = new PhysicsEngine();
const renderer = new Renderer(ctx);

const gameState = {
  activeTool: "heat",
  usedTools: new Set(),
  constantsRemaining: 10,
  titleText: "Fundamental Constant: Thermal Expansion",
};

const loop = new GameLoop({
  update: (dt) => {
    physics.update(dt);
    input.endFrame();
  },
  render: () => {
    renderer.render(physics, input, gameState);
  },
});

loop.start();

function fitCanvas(target) {
  const pad = 10;
  const maxW = Math.max(400, window.innerWidth - pad * 2);
  const maxH = Math.max(280, window.innerHeight - pad * 2);
  const ratio = WORLD_WIDTH / WORLD_HEIGHT;

  let width = maxW;
  let height = width / ratio;

  if (height > maxH) {
    height = maxH;
    width = height * ratio;
  }

  target.style.width = `${width}px`;
  target.style.height = `${height}px`;
}
