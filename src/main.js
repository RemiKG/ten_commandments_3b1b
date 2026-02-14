import { TOOL_BY_ID, WORLD_WIDTH, WORLD_HEIGHT } from "./config.js";
import { GameLoop } from "./gameLoop.js";
import { InputHandler } from "./inputHandler.js";
import { ParticleSystem } from "./particles.js";
import { PhysicsEngine } from "./physicsEngine.js";
import { Renderer } from "./renderer.js";
import { getToolIdAtPoint, pointInBoard } from "./uiLayout.js";

const canvas = document.getElementById("gameCanvas");
canvas.width = WORLD_WIDTH;
canvas.height = WORLD_HEIGHT;

const ctx = canvas.getContext("2d", { alpha: false });
ctx.imageSmoothingEnabled = true;

fitCanvas(canvas);
window.addEventListener("resize", () => fitCanvas(canvas));

const input = new InputHandler(canvas);
const physics = new PhysicsEngine();
const particles = new ParticleSystem();
const renderer = new Renderer(ctx);

const gameState = {
  activeTool: "heat",
  usedTools: new Set(),
  constantsRemaining: 10,
  titleText: TOOL_BY_ID.heat.title,
  applyingTool: false,
};

const loop = new GameLoop({
  update: (dt) => {
    const control = handleInput();
    physics.update(dt, control, particles);
    particles.update(dt);
    input.endFrame();
  },
  render: () => {
    renderer.render(physics, input, gameState, particles);
  },
});

loop.start();

function handleInput() {
  const { pointerX, pointerY } = input;
  let pointerPressedForTool = input.wasPressed;

  if (input.wasPressed) {
    const sidebarTool = getToolIdAtPoint(pointerX, pointerY);
    if (sidebarTool) {
      gameState.activeTool = sidebarTool;
      gameState.titleText = TOOL_BY_ID[sidebarTool].title;
      gameState.applyingTool = false;
      pointerPressedForTool = false;
    }
  }

  const applying = input.isDown && pointInBoard(pointerX, pointerY);
  gameState.applyingTool = applying;

  if (applying && !gameState.usedTools.has(gameState.activeTool)) {
    gameState.usedTools.add(gameState.activeTool);
    gameState.constantsRemaining = Math.max(0, 10 - gameState.usedTools.size);
  }

  return {
    activeTool: gameState.activeTool,
    applying,
    pointerX,
    pointerY,
    pointerPressed: pointerPressedForTool,
    pointerReleased: input.wasReleased,
  };
}

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
