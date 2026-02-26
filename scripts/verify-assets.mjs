import { access } from "node:fs/promises";
import { constants } from "node:fs";

const required = [
  "Assets/VisualExamples/1.png",
  "Assets/VisualExamples/2.png",
  "Assets/VisualExamples/3.png",
  "Assets/VisualExamples/4.png",
  "Assets/VisualExamples/map_1_layout.png",
  "Assets/VisualExamples/cat_normal.png",
  "Assets/VisualExamples/cat_hacker.png",
  "Assets/VisualExamples/maze_border.png",
  "Assets/VisualExamples/maze_border2.png",
  "Assets/VisualExamples/background_normal.png",
  "Assets/Audios/theme.mp3",
  "Assets/Audios/hacker_theme.mp3",
  "Assets/Audios/heat.mp3",
  "Assets/Audios/cold.mp3",
  "Assets/Audios/gravity.mp3",
  "Assets/Audios/pressure.mp3",
  "Assets/Audios/vacuum.mp3",
  "Assets/Audios/quantum.mp3",
];

for (const path of required) {
  try {
    await access(path, constants.R_OK);
  } catch {
    throw new Error(`Missing required asset: ${path}`);
  }
}

console.log(`verify-assets: PASS (${required.length} required files present)`);
