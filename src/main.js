import { Game } from "./game.js";

async function bootstrap() {
  const canvas = document.getElementById("gameCanvas");
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Missing #gameCanvas element.");
  }

  const game = new Game(canvas);
  await game.init();
  game.start();
  window.neonCat = game;
}

bootstrap().catch((error) => {
  console.error(error);
  const message = document.createElement("pre");
  message.style.color = "#ff7b7b";
  message.textContent = `Failed to bootstrap game:\n${String(error?.message ?? error)}`;
  document.body.appendChild(message);
});
