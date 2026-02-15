import { AudioManager } from "../src/audioManager.js";

const manager = new AudioManager();

// Node test runtime has no Audio global; manager must degrade safely.
manager.onUserGesture();
manager.setMode("hacker");
manager.setMode("normal");
manager.setMode("invalid");
manager.playSfx("assetsv2/audio/Heat.mp3");

console.log("audio-manager-smoke: ok");
