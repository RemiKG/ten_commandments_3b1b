import { Renderer } from "../src/renderer.js";

function createMockCtx() {
  const texts = [];
  const target = {
    lineWidth: 1,
    globalAlpha: 1,
    strokeStyle: "#fff",
    fillStyle: "#fff",
    shadowColor: "transparent",
    shadowBlur: 0,
    lineCap: "round",
    globalCompositeOperation: "source-over",
    font: "12px serif",
    textAlign: "center",
    textBaseline: "middle",
    _texts: texts,
  };

  target.fillText = (value) => {
    texts.push(String(value));
  };

  return new Proxy(target, {
    get(obj, prop) {
      if (prop === "createRadialGradient" || prop === "createLinearGradient") {
        return () => ({ addColorStop() {} });
      }
      if (!(prop in obj)) {
        obj[prop] = () => {};
      }
      return obj[prop];
    },
    set(obj, prop, value) {
      obj[prop] = value;
      return true;
    },
  });
}

const ctx = createMockCtx();
const renderer = new Renderer(ctx);

renderer._drawTitle({
  titleText: "Power: Heat",
  powersReady: 5,
  maxAmmo: 32,
  visualMode: "normal",
  stageIndex: 2,
  liveEquation: "eq",
});

const allText = ctx._texts.join(" | ");
if (!allText.includes("Powers Ready")) {
  throw new Error("HUD title should display powers ready count");
}
if (!allText.includes("Stage")) {
  throw new Error("HUD title should display stage label");
}
if (!allText.includes("Normal Mode")) {
  throw new Error("HUD title should display mode label");
}

console.log("hud-smoke: ok");
