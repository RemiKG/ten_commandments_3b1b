export class GameLoop {
  constructor({ update, render }) {
    this.update = update;
    this.render = render;
    this.running = false;
    this.lastTs = 0;
    this._tick = this._tick.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    requestAnimationFrame(this._tick);
  }

  stop() {
    this.running = false;
  }

  _tick(ts) {
    if (!this.running) return;
    const dt = this.lastTs ? (ts - this.lastTs) / 1000 : 1 / 60;
    this.lastTs = ts;
    this.update(dt);
    this.render();
    requestAnimationFrame(this._tick);
  }
}
