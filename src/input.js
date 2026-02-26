export class InputHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pointer = {
      x: 0,
      y: 0,
      down: false,
      justPressed: false,
      justReleased: false,
    };
    this.modeToggleQueued = false;
    this.dragStart = null;

    this.boundOnKeyDown = (event) => this.onKeyDown(event);
    this.boundOnKeyUp = (event) => this.onKeyUp(event);
    this.boundOnPointerDown = (event) => this.onPointerDown(event);
    this.boundOnPointerMove = (event) => this.onPointerMove(event);
    this.boundOnPointerUp = () => this.onPointerUp();

    window.addEventListener("keydown", this.boundOnKeyDown);
    window.addEventListener("keyup", this.boundOnKeyUp);
    canvas.addEventListener("pointerdown", this.boundOnPointerDown);
    window.addEventListener("pointermove", this.boundOnPointerMove);
    window.addEventListener("pointerup", this.boundOnPointerUp);
  }

  beginFrame() {
    this.pointer.justPressed = false;
    this.pointer.justReleased = false;
  }

  destroy() {
    window.removeEventListener("keydown", this.boundOnKeyDown);
    window.removeEventListener("keyup", this.boundOnKeyUp);
    this.canvas.removeEventListener("pointerdown", this.boundOnPointerDown);
    window.removeEventListener("pointermove", this.boundOnPointerMove);
    window.removeEventListener("pointerup", this.boundOnPointerUp);
  }

  getAxis() {
    let x = 0;
    let y = 0;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) {
      x -= 1;
    }
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) {
      x += 1;
    }
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) {
      y -= 1;
    }
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) {
      y += 1;
    }
    return { x, y };
  }

  consumeModeToggle() {
    const queued = this.modeToggleQueued;
    this.modeToggleQueued = false;
    return queued;
  }

  onKeyDown(event) {
    this.keys.add(event.code);
    if (event.code === "KeyH") {
      this.modeToggleQueued = true;
    }
  }

  onKeyUp(event) {
    this.keys.delete(event.code);
  }

  onPointerDown(event) {
    const point = this.toCanvasPoint(event);
    this.pointer.x = point.x;
    this.pointer.y = point.y;
    this.pointer.down = true;
    this.pointer.justPressed = true;
    this.dragStart = point;
  }

  onPointerMove(event) {
    const point = this.toCanvasPoint(event);
    this.pointer.x = point.x;
    this.pointer.y = point.y;
  }

  onPointerUp() {
    this.pointer.down = false;
    this.pointer.justReleased = true;
    this.dragStart = null;
  }

  toCanvasPoint(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * this.canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * this.canvas.height;
    return { x, y };
  }
}
