import { LAYOUT, TOOLS } from "./config.js";

export function getSidebarItemHeight() {
  const sidebar = LAYOUT.sidebar;
  return (sidebar.height - sidebar.topPad * 2 - sidebar.itemGap * (TOOLS.length - 1)) / TOOLS.length;
}

export function getSidebarItemRect(index) {
  const sidebar = LAYOUT.sidebar;
  const itemHeight = getSidebarItemHeight();
  return {
    x: sidebar.x,
    y: sidebar.y + sidebar.topPad + index * (itemHeight + sidebar.itemGap),
    width: sidebar.width,
    height: itemHeight,
  };
}

export function getToolIdAtPoint(x, y) {
  for (let i = 0; i < TOOLS.length; i += 1) {
    const rect = getSidebarItemRect(i);
    if (pointInRect(x, y, rect)) {
      return TOOLS[i].id;
    }
  }
  return null;
}

export function getModeToggleRect() {
  return { ...LAYOUT.modeToggle };
}

export function getModeAtPoint(x, y) {
  const rect = getModeToggleRect();
  if (!pointInRect(x, y, rect)) {
    return null;
  }
  return x < rect.x + rect.width * 0.5 ? "normal" : "hacker";
}

export function pointInBoard(x, y) {
  return pointInRect(x, y, LAYOUT.board);
}

export function pointInRect(x, y, rect) {
  return x >= rect.x && y >= rect.y && x <= rect.x + rect.width && y <= rect.y + rect.height;
}
