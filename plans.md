# plans.md

## Execution Rules
1. Follow `AGENTS.md` as constitution.
2. This plan is mandatory, but may be improved if a better path appears.
3. Every milestone ends with:
   1. A concrete test/check.
   2. A git commit when passing.

## Milestone 1 - Project Bootstrap
- [x] Initialize git repo if needed.
- [x] Create core files:
  - `index.html`
  - `styles.css`
  - `src/main.js`
  - `src/config.js`
  - `src/gameLoop.js`
  - `src/inputHandler.js`
  - `src/physicsEngine.js`
  - `src/renderer.js`
  - `src/math.js`
  - `src/particles.js`
- [x] Wire modules and confirm canvas boots.

### Test Gate
- Run JS syntax checks.
- Open app (or launch local static server) and verify no runtime error.

### Commit
- `chore: bootstrap canvas architecture and module wiring`

## Milestone 2 - Core World And Baseline Physics
- [x] Build 16:9 board and white maze walls matching references.
- [x] Implement balloon state:
  - position, velocity, radius, mass proxy, glow.
- [x] Implement wall collision system with tunable elasticity.
- [x] Implement linked-list style fading trail.
- [x] Add baseline gravity/damping defaults.

### Test Gate
- Balloon moves and bounces stably in maze.
- Trail renders and fades.
- No tunneling through walls in normal mode.

### Commit
- `feat: add maze, balloon dynamics, collisions, and trail`

## Milestone 3 - Sidebar + Tool Selection + HUD
- [x] Build left sidebar with 10 constants (icon-like labels).
- [x] Add active tool highlight.
- [x] Add title text and frame ornament style.
- [x] Add `"Constants Remaining: X/10"` display logic.
- [x] Hook pointer input for selecting tools and applying effects in board area.

### Test Gate
- All 10 tools selectable.
- HUD updates without layout break on common resolutions.

### Commit
- `feat: implement themed sidebar, tool selection, and constants HUD`

## Milestone 4 - Lens System + Field Overlay Pipeline
- [x] Implement cursor lens radius system.
- [x] Restrict field overlays to lens mask (`ctx.clip()` pipeline).
- [x] Add generic vector field renderer.
- [x] Add optional grid renderer (only for Mass/Dark Energy).

### Test Gate
- Field visuals are hidden outside lens.
- Mass mode uniquely shows grid.

### Commit
- `feat: add lens-based reveal system for field overlays`

## Milestone 5 - Implement 10 Mechanics (Physics + VFX)
- [x] Heat: orange radial glow + outward vectors + balloon expansion + outward push.
- [x] Cold: icy texture + shrink + denser/heavier behavior.
- [x] Mass: inward warped cyan grid + attraction force.
- [x] Dark Energy: outward warped cyan grid + repulsion force.
- [x] High Pressure: outward impulse burst particles.
- [x] Vacuum: inward sink-flow star streak particles.
- [x] Tunneling: wall segment static/wireframe + collision bypass + drag + RGB ghost balloon.
- [x] Viscosity: heavy damping.
- [x] Elasticity: high bounce conservation.
- [x] Entropy: smooth noise perturbation in velocity.

### Test Gate
- Manual mechanic checklist passes for all 10 tools.
- No tool crashes loop or breaks input.

### Commit
- `feat: implement all ten constants mechanics and visual effects`

## Milestone 6 - Visual Polish To Match References
- [x] Tune glow intensities, line weights, and spacing to image style.
- [x] Tune title typography and composition.
- [x] Add subtle cyber-lab ambience (grain/vignette/light bloom approximations).
- [x] Ensure Heat/Mass/Vacuum/Tunneling resemble `1.png`-`4.png` one-to-one logic.
- [x] Verify desktop and mobile fit.

### Test Gate
- Side-by-side visual check with the four reference images.
- Basic responsiveness check at 1366x768 and mobile portrait.

### Commit
- `style: polish visuals for reference parity and responsive layout`

## Milestone 7 - Final Validation And Delivery
- [x] Run final syntax/test checks.
- [x] Run final manual playthrough.
- [x] Update `plans.md` checkboxes to complete.
- [x] Provide concise run instructions in `README.md`.

### Test Gate
- Clean run with no console errors.
- All milestones marked complete.

### Commit
- `docs: finalize plan completion and usage instructions`

## Final Verification Notes
- Date: 2026-02-14
- Commands run:
  - 
ode --check src/main.js and syntax checks for all source modules.
  - 
ode tests/physics-smoke.mjs`r
  - 
ode tests/ui-layout-smoke.mjs`r
  - 
ode tests/overlay-mode-smoke.mjs`r
  - 
ode tests/tool-mechanics-smoke.mjs`r
  - Local static server smoke test via python -m http.server + Invoke-WebRequest.
- Result: all gates passed and all milestones committed.

