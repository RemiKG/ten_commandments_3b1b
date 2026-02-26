import { MODES } from "./config.js";

function configureAudio(audio, { loop = false, volume = 1 }) {
  audio.loop = loop;
  audio.volume = volume;
  audio.preload = "auto";
  return audio;
}

export class AudioManager {
  constructor(paths) {
    this.paths = paths;
    this.music = {
      theme: configureAudio(new Audio(paths.theme), { loop: true, volume: 0.42 }),
      hackerTheme: configureAudio(new Audio(paths.hackerTheme), { loop: true, volume: 0.46 }),
    };
    this.sfx = {
      heat: configureAudio(new Audio(paths.heat), { volume: 0.65 }),
      cold: configureAudio(new Audio(paths.cold), { volume: 0.65 }),
      gravity: configureAudio(new Audio(paths.gravity), { volume: 0.72 }),
      pressure: configureAudio(new Audio(paths.pressure), { volume: 0.72 }),
      vacuum: configureAudio(new Audio(paths.vacuum), { volume: 0.72 }),
      quantum: configureAudio(new Audio(paths.quantum), { volume: 0.72 }),
    };
    this.currentMode = MODES.NORMAL;
    this.unlocked = false;
  }

  unlock() {
    if (this.unlocked) {
      return;
    }
    this.unlocked = true;
    this.applyModeMusic();
  }

  setMode(mode) {
    this.currentMode = mode;
    this.applyModeMusic();
  }

  playSfx(sfxKey) {
    if (!this.unlocked) {
      return;
    }
    const source = this.sfx[sfxKey];
    if (!source) {
      return;
    }
    const clip = source.cloneNode();
    clip.volume = source.volume;
    clip.play().catch(() => {});
  }

  applyModeMusic() {
    if (!this.unlocked) {
      return;
    }
    const target = this.currentMode === MODES.HACKER ? this.music.hackerTheme : this.music.theme;
    const other = this.currentMode === MODES.HACKER ? this.music.theme : this.music.hackerTheme;
    if (!target.paused) {
      target.volume = this.currentMode === MODES.HACKER ? 0.46 : 0.42;
    } else {
      target.currentTime = 0;
      target.play().catch(() => {});
    }
    if (!other.paused) {
      other.pause();
      other.currentTime = 0;
    }
  }
}
