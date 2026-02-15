import { ASSET_V2 } from "./assetsV2.js";

export class AudioManager {
  constructor() {
    this.mode = "normal";
    this.unlocked = false;
    this.enabled = typeof Audio !== "undefined";
    this.currentTrack = null;

    this.tracks = {
      normal: this._createTrack(ASSET_V2.audio.theme),
      hacker: this._createTrack(ASSET_V2.audio.hackerTheme),
    };
  }

  _createTrack(src) {
    if (!this.enabled) {
      return null;
    }

    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0.35;
    audio.preload = "auto";
    audio.addEventListener("error", () => {
      console.warn(`[audio] failed to load track: ${src}`);
    });
    return audio;
  }

  onUserGesture() {
    this.unlocked = true;
    this._ensureModeTrackPlaying();
  }

  setMode(mode) {
    if (mode !== "normal" && mode !== "hacker") {
      return;
    }
    if (mode === this.mode) {
      this._ensureModeTrackPlaying();
      return;
    }

    this.mode = mode;
    this._ensureModeTrackPlaying();
  }

  playSfx(path) {
    if (!this.enabled || !this.unlocked || !path) {
      return;
    }

    try {
      const fx = new Audio(path);
      fx.volume = 0.58;
      fx.preload = "auto";
      fx.addEventListener("error", () => {
        console.warn(`[audio] failed to load sfx: ${path}`);
      });
      void fx.play().catch(() => {});
    } catch (_err) {
      // Ignore runtime audio errors to keep gameplay stable.
    }
  }

  _ensureModeTrackPlaying() {
    if (!this.enabled || !this.unlocked) {
      return;
    }

    const next = this.tracks[this.mode];
    if (!next) {
      return;
    }

    if (this.currentTrack && this.currentTrack !== next) {
      this.currentTrack.pause();
      this.currentTrack.currentTime = 0;
    }

    this.currentTrack = next;
    void next.play().catch(() => {});
  }
}
