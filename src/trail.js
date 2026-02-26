class TrailNode {
  constructor(x, y, ts, color) {
    this.x = x;
    this.y = y;
    this.ts = ts;
    this.color = color;
    this.next = null;
  }
}

export class TrailList {
  constructor(maxAgeMs = 1700, maxNodes = 96) {
    this.maxAgeMs = maxAgeMs;
    this.maxNodes = maxNodes;
    this.head = null;
    this.tail = null;
    this.size = 0;
  }

  clear() {
    this.head = null;
    this.tail = null;
    this.size = 0;
  }

  push(x, y, ts, color) {
    const node = new TrailNode(x, y, ts, color);
    if (!this.head) {
      this.head = node;
      this.tail = node;
      this.size = 1;
      return;
    }
    this.tail.next = node;
    this.tail = node;
    this.size += 1;
    while (this.size > this.maxNodes) {
      this.shift();
    }
  }

  shift() {
    if (!this.head) {
      return;
    }
    this.head = this.head.next;
    this.size = Math.max(0, this.size - 1);
    if (!this.head) {
      this.tail = null;
    }
  }

  prune(nowMs) {
    while (this.head && nowMs - this.head.ts > this.maxAgeMs) {
      this.shift();
    }
  }

  toArray() {
    const output = [];
    let cursor = this.head;
    while (cursor) {
      output.push({
        x: cursor.x,
        y: cursor.y,
        ts: cursor.ts,
        color: cursor.color,
      });
      cursor = cursor.next;
    }
    return output;
  }
}
