export const ASSET_V2 = {
  images: {
    backgroundNormal: "assetsv2/images/backgrounds/normal.png",
    backgroundHacker: "assetsv2/images/backgrounds/hacker.png",
    catNormal: "assetsv2/images/cat/normal.png",
    catHacker: "assetsv2/images/cat/hacker.png",
    toolHeat: "assetsv2/images/tools/heat.png",
    toolCold: "assetsv2/images/tools/cold.png",
    toolGravity: "assetsv2/images/tools/gravity.png",
    toolHighPressure: "assetsv2/images/tools/highPressure.png",
    toolVacuum: "assetsv2/images/tools/vacuum.png",
    toolQuantumTunneling: "assetsv2/images/tools/quantumTunneling.png",
  },
  audio: {
    theme: "assetsv2/audio/theme.mp3",
    hackerTheme: "assetsv2/audio/Hacker_theme.mp3",
    heat: "assetsv2/audio/Heat.mp3",
    cold: "assetsv2/audio/Cold.mp3",
    gravity: "assetsv2/audio/Gravity.mp3",
    quantum: "assetsv2/audio/quantum.mp3",
    vacuum: "assetsv2/audio/vacuum.mp3",
  },
};

export const ASSET_FALLBACKS = {
  images: {
    backgroundNormal: ["Assets/Images/1.png"],
    backgroundHacker: ["Assets/Images/2.png"],
    catNormal: ["Assets/Images/3.png"],
    catHacker: ["Assets/Images/4.png"],
    toolHeat: ["Assets/Images/1.png"],
    toolCold: ["Assets/Images/1.png"],
    toolGravity: ["Assets/Images/2.png"],
    toolHighPressure: ["Assets/Images/3.png"],
    toolVacuum: ["Assets/Images/3.png"],
    toolQuantumTunneling: ["Assets/Images/4.png"],
  },
};

export function createImageRegistry(paths = ASSET_V2.images, fallbacks = ASSET_FALLBACKS.images) {
  const registry = {};
  for (const [key, src] of Object.entries(paths)) {
    registry[key] = primeImage(key, src, fallbacks[key] || []);
  }
  return registry;
}

function primeImage(key, src, fallbackList) {
  if (typeof Image === "undefined") {
    return {
      key,
      src,
      fallbackList,
      image: null,
      loaded: false,
      failed: false,
    };
  }

  const image = new Image();
  const state = {
    key,
    src,
    fallbackList,
    image,
    loaded: false,
    failed: false,
  };

  let attempts = [src, ...fallbackList];
  let index = 0;

  const tryLoad = () => {
    if (index >= attempts.length) {
      state.failed = true;
      // Explicit path list keeps failure diagnostics actionable.
      console.warn(`[assets] missing image for ${key}; attempted: ${attempts.join(", ")}`);
      return;
    }
    image.src = attempts[index];
    index += 1;
  };

  image.onload = () => {
    state.loaded = true;
  };

  image.onerror = () => {
    tryLoad();
  };

  tryLoad();
  return state;
}
