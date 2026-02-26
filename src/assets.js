const IMAGE_PATHS = {
  refHeat: "Assets/VisualExamples/1.png",
  refMass: "Assets/VisualExamples/2.png",
  refVacuum: "Assets/VisualExamples/3.png",
  refTunnel: "Assets/VisualExamples/4.png",
  map1: "Assets/VisualExamples/map_1_layout.png",
  catNormal: "Assets/VisualExamples/cat_normal.png",
  catHacker: "Assets/VisualExamples/cat_hacker.png",
  wallPattern: "Assets/VisualExamples/maze_border.png",
  wallPatternAlt: "Assets/VisualExamples/maze_border2.png",
  bgNormal: "Assets/VisualExamples/background_normal.png",
};

const AUDIO_PATHS = {
  theme: "Assets/Audios/theme.mp3",
  hackerTheme: "Assets/Audios/hacker_theme.mp3",
  heat: "Assets/Audios/heat.mp3",
  cold: "Assets/Audios/cold.mp3",
  gravity: "Assets/Audios/gravity.mp3",
  pressure: "Assets/Audios/pressure.mp3",
  vacuum: "Assets/Audios/vacuum.mp3",
  quantum: "Assets/Audios/quantum.mp3",
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    image.src = src;
  });
}

export async function loadImages() {
  const entries = Object.entries(IMAGE_PATHS);
  const loaded = await Promise.all(entries.map(([, src]) => loadImage(src)));
  return entries.reduce((acc, [key], index) => {
    acc[key] = loaded[index];
    return acc;
  }, {});
}

export function getAudioPaths() {
  return { ...AUDIO_PATHS };
}
