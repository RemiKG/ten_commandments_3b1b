import { LAYOUT, TOOLS } from "../src/config.js";
import { getSidebarItemRect, getToolIdAtPoint, pointInBoard } from "../src/uiLayout.js";

for (let i = 0; i < TOOLS.length; i += 1) {
  const rect = getSidebarItemRect(i);
  const cx = rect.x + rect.width * 0.5;
  const cy = rect.y + rect.height * 0.5;
  const picked = getToolIdAtPoint(cx, cy);
  if (picked !== TOOLS[i].id) {
    throw new Error(`tool pick mismatch at index ${i}: expected ${TOOLS[i].id}, got ${picked}`);
  }
}

if (getToolIdAtPoint(9999, 9999) !== null) {
  throw new Error("expected null pick for out-of-bounds point");
}

if (!pointInBoard(LAYOUT.board.x + 40, LAYOUT.board.y + 40)) {
  throw new Error("expected board hit test to return true");
}

if (pointInBoard(LAYOUT.sidebar.x + 20, LAYOUT.sidebar.y + 20)) {
  throw new Error("expected sidebar point to be outside board");
}

console.log("ui-layout-smoke: ok");
