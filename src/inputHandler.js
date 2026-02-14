import { clamp } from "./math.js";

export class InputHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.mouseX = 0;
    this.mouseY = 0;
    this.isDown = false;
    this._bind();
  }

  _bind() {
    this.canvas.addEventListener("pointermove", (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const sx = this.canvas.width / rect.width;
      const sy = this.canvas.height / rect.height;
      this.mouseX = clamp((event.clientX - rect.left) * sx, 0, this.canvas.width);
      this.mouseY = clamp((event.clientY - rect.top) * sy, 0, this.canvas.height);
    });

    this.canvas.addEventListener("pointerdown", () => {
      this.isDown = true;
    });

    window.addEventListener("pointerup", () => {
      this.isDown = false;
    });
  }
}
