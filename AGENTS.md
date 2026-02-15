# AGENTS.md

## Mission
Build **The Ten Commandments**, a viral-ready physics-based puzzle game for the McGill Physics Hackathon, optimized for:
1. Visual impact in a short-form demo.
2. Clear explainability of each mechanic to judges.
3. Stable, deterministic interaction over physically exact simulation.

The target style is **3Blue1Brown meets Cyberpunk Laboratory**, matching the supplied references (`1.png`, `2.png`, `3.png`, `4.png`) in the Assets/Images/ folder and sidebar logic one-to-one.

## Authority And Workflow
1. Follow `plans.md` as the execution source of truth.
2. You may modify `plans.md` if you find a better implementation path, but:
   1. Keep the same end goals and visual constraints.
   2. Record what changed and why.
3. After each important section/milestone:
   1. Run a concrete test/check.
   2. If passing, create a git commit. No exceptions.
4. If the repo is not initialized, initialize git before development.

## Non-Negotiable Technical Rules
1. Stack: **HTML5 Canvas + Vanilla ES6+ JavaScript**.
2. Physics: custom "Fake Physics" only. No Box2D, Matter.js, or external physics engines.
3. Prioritize control and visual clarity over real-world numerical accuracy.
4. Code quality:
   1. Modular classes/files.
   2. No giant god functions.
   3. Clear naming and bounded responsibilities.

## Project Philosophy: Visual Engineering
1. Goal: believable, cinematic physics language rather than textbook correctness.
2. Lens mechanic:
   1. Base board is a dark void.
   2. Physics field overlays are hidden by default.
   3. Overlays become visible only inside a cursor-driven lens radius while relevant tool is active.
3. Fake physics rule:
   1. Use distance checks, simple vector additions, damping, radial falloffs, noise.
   2. Avoid expensive simulation models.
   3. Effects must *look* advanced and feel responsive.

## Functional Spec: The 10 Constants (Sidebar Tools)
Exactly 10 tools are available. No extra gameplay tools.

### I. Thermodynamics (State Modifiers)
1. **Heat** (`1.png`)
   1. Visual: radial orange glow and outward vector arrows, no grid.
   2. Balloon: expands, hotter glow.
   3. Logic: increase radius and add outward radial velocity.
2. **Cold**
   1. Visual: icy blue/white crystalline texture.
   2. Balloon: shrinks and feels heavier.
   3. Logic: decrease radius, increase effective density/gravity effect.

### II. General Relativity (Trajectory Modifiers)
3. **Mass** (`2.png`)
   1. Visual: cyan grid visible only in this mode, warped inward into a gravity dimple.
   2. Logic: continuous attraction (gravity well).
4. **Dark Energy**
   1. Visual: same grid family, warped outward like a peak.
   2. Logic: continuous repulsion (anti-gravity).

### III. Fluid Dynamics (Impulse Modifiers)
5. **High Pressure**
   1. Visual: explosive particles streaming outward from cursor.
   2. Logic: strong instant push away.
6. **Vacuum** (`3.png`)
   1. Visual: starfield-like particles streaming inward (sink flow), no grid.
   2. Logic: strong instant pull toward cursor.

### IV. Quantum Mechanics
7. **Tunneling** (`4.png`)
   1. Visual: hovered wall segment turns to static/wireframe noise.
   2. Balloon: RGB ghost split while passing through wall.
   3. Logic: disable collision for targeted wall segment and apply drag.

### V. Material Physics (Fillers)
8. **Viscosity** ("The Brake")
   1. Logic: strong velocity damping.
9. **Elasticity** ("The Bounce")
   1. Logic: near-perfect momentum conservation on wall collisions.
10. **Entropy** ("The Chaos")
   1. Logic: inject smooth noise into velocity vector.

## Rendering Contract
1. Background: `#050505`.
2. Walls: clean white lines, `lineWidth: 2`.
3. Balloon: white luminous circle with strong glow (`shadowBlur`).
4. Trail: fading linked-list/polyline of prior positions.
5. Lens:
   1. Circular reveal mask for overlays.
   2. Hard gameplay remains global; only field visuals are lens-gated.
6. Typography and chrome:
   1. Title style echoes references.
   2. Sidebar appears as instrument panel with icon rows.

## Architecture Contract
1. `GameLoop`: frame timing + update/render order via `requestAnimationFrame`.
2. `PhysicsEngine`: all fake-physics forces and collision/tunneling logic.
3. `Renderer`: base board, overlays, lens masking, particles, trails, UI.
4. `InputHandler`: mouse position, drag/hold tool application, sidebar selection.
5. Config/constants module for tunables and tool metadata.

## Gameplay/UI Requirements
1. Show `"Constants Remaining: X/10"` in UI.
2. Sidebar lists exactly the 10 constants with distinct visual states.
3. Active tool is clearly highlighted.
4. Maintain 16:9 showcase composition similar to provided references.

## Verification Gates
At each milestone, run checks that match the work:
1. Syntax check JS files.
2. Smoke-run in browser environment.
3. Mechanic spot checks for all 10 tools.
4. Visual comparison pass against `1.png`-`4.png`.

If gate passes, commit immediately with milestone-scoped commit message.

## Definition Of Done
1. All 10 tools implemented and selectable.
2. Lens reveal behavior implemented and visually consistent.
3. Maze walls + balloon + glow trail match references.
4. Mass, Heat, Vacuum, and Tunneling visuals/mechanics closely match their respective images.
5. Project runnable by opening `index.html` (or a tiny local static server).
6. `plans.md` completed with checkboxes and final verification notes.
