import { clamp } from "./math.js";

export class InputHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.pointerX = 0;
    this.pointerY = 0;
    this.isDown = false;
    this.wasPressed = false;
    this.wasReleased = false;
    this._bind();
  }

  _bind() {
    this.canvas.addEventListener("pointermove", (event) => this._onMove(event));

    this.canvas.addEventListener("pointerdown", (event) => {
      this.canvas.setPointerCapture(event.pointerId);
      this._onMove(event);
      this.isDown = true;
      this.wasPressed = true;
    });

    this.canvas.addEventListener("pointerup", (event) => {
      this._onMove(event);
      this.isDown = false;
      this.wasReleased = true;
      this.canvas.releasePointerCapture(event.pointerId);
    });

    this.canvas.addEventListener("pointerleave", () => {
      this.isDown = false;
    });
  }

  _onMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = this.canvas.width / rect.width;
    const sy = this.canvas.height / rect.height;
    this.pointerX = clamp((event.clientX - rect.left) * sx, 0, this.canvas.width);
    this.pointerY = clamp((event.clientY - rect.top) * sy, 0, this.canvas.height);
  }

  endFrame() {
    this.wasPressed = false;
    this.wasReleased = false;
  }
}
