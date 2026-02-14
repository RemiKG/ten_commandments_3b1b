# The Ten Commandments

Physics-based puzzle sandbox built for the McGill Physics Hackathon.

## Stack
- HTML5 Canvas
- Vanilla ES6 modules
- Custom fake-physics engine (no external physics library)

## Run
1. From the project root, start a static server:
   - `python -m http.server 4173`
2. Open `http://127.0.0.1:4173` in a browser.

You can also open `index.html` directly, but using a local server is recommended for module loading consistency.

## Controls
- Move mouse: aim lens/crosshair.
- Left click sidebar: select one of the 10 constants.
- Hold left click on board: apply selected constant effect.

## Tools (10)
1. Heat
2. Cold
3. Mass
4. Dark Energy
5. High Pressure
6. Vacuum
7. Tunneling
8. Viscosity
9. Elasticity
10. Entropy

## Project Files
- `AGENTS.md`: constitution/specification for future agents.
- `plans.md`: milestone plan and completion record.
- `src/physicsEngine.js`: fake-physics and tool logic.
- `src/renderer.js`: visual pipeline, lens masking, UI rendering.
- `src/main.js`: orchestration and input-to-physics wiring.
