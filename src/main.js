import { initialAmmoState, maxAmmoTotal, TOOL_BY_ID, VISUAL_MODES, WORLD_HEIGHT, WORLD_WIDTH } from "./config.js";
import { tryDeployPower, totalAmmo } from "./deployRuntime.js";
import { getLiveEquation } from "./equationHud.js";
import { GameLoop } from "./gameLoop.js";
import { InputHandler } from "./inputHandler.js";
import { maybeAdvanceStage } from "./stageRuntime.js";
import { ParticleSystem } from "./particles.js";
import { PhysicsEngine } from "./physicsEngine.js";
import { Renderer } from "./renderer.js";
import { getModeAtPoint, getToolIdAtPoint, pointInBoard } from "./uiLayout.js";

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

const ammoState = initialAmmoState();
const maxAmmo = maxAmmoTotal();

const gameState = {
  activeTool: "heat",
  activeDrops: [],
  ammoState,
  maxAmmo,
  powersReady: totalAmmo(ammoState),
  titleText: TOOL_BY_ID.heat.title,
  liveEquation: "",
  visualMode: VISUAL_MODES.normal,
  stageIndex: 0,
};

const loop = new GameLoop({
  update: (dt) => {
    const control = handleInput();
    physics.update(dt, control, particles);
    particles.update(dt);

    gameState.activeDrops = gameState.activeDrops.filter((drop) => drop.remaining > 0);
    maybeAdvanceStage(gameState, physics);

    gameState.powersReady = totalAmmo(gameState.ammoState);
    gameState.liveEquation = getLiveEquation(gameState.activeTool, physics, input);

    input.endFrame();
  },
  render: () => {
    renderer.render(physics, input, gameState, particles);
  },
});

loop.start();

function handleInput() {
  const { pointerX, pointerY } = input;
  const pointerInBoard = pointInBoard(pointerX, pointerY);

  let deployedDrop = null;

  if (input.wasPressed) {
    const mode = getModeAtPoint(pointerX, pointerY);
    if (mode) {
      gameState.visualMode = mode;
    } else {
      const sidebarTool = getToolIdAtPoint(pointerX, pointerY);
      if (sidebarTool) {
        gameState.activeTool = sidebarTool;
        gameState.titleText = TOOL_BY_ID[sidebarTool].title;
      } else {
        deployedDrop = tryDeployPower({
          toolId: gameState.activeTool,
          pointerX,
          pointerY,
          pointerInBoard,
          time: physics.time,
          ammoState: gameState.ammoState,
          activeDrops: gameState.activeDrops,
        });
      }
    }
  }

  return {
    activeTool: gameState.activeTool,
    pointerX,
    pointerY,
    pointerInBoard,
    pointerPressed: input.wasPressed,
    pointerReleased: input.wasReleased,
    visualMode: gameState.visualMode,
    activeDrops: gameState.activeDrops,
    deployedDrop,
    stageIndex: gameState.stageIndex,
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
