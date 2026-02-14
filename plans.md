# plans.md

## Execution Rules
1. Follow `AGENTS.md` as constitution.
2. This plan is mandatory, but may be improved if a better path appears.
3. Every milestone ends with:
   1. A concrete test/check.
   2. A git commit when passing.

## Milestone 1 - Project Bootstrap
- [ ] Initialize git repo if needed.
- [ ] Create core files:
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
- [ ] Wire modules and confirm canvas boots.

### Test Gate
- Run JS syntax checks.
- Open app (or launch local static server) and verify no runtime error.

### Commit
- `chore: bootstrap canvas architecture and module wiring`

## Milestone 2 - Core World And Baseline Physics
- [ ] Build 16:9 board and white maze walls matching references.
- [ ] Implement balloon state:
  - position, velocity, radius, mass proxy, glow.
- [ ] Implement wall collision system with tunable elasticity.
- [ ] Implement linked-list style fading trail.
- [ ] Add baseline gravity/damping defaults.

### Test Gate
- Balloon moves and bounces stably in maze.
- Trail renders and fades.
- No tunneling through walls in normal mode.

### Commit
- `feat: add maze, balloon dynamics, collisions, and trail`

## Milestone 3 - Sidebar + Tool Selection + HUD
- [ ] Build left sidebar with 10 constants (icon-like labels).
- [ ] Add active tool highlight.
- [ ] Add title text and frame ornament style.
- [ ] Add `"Constants Remaining: X/10"` display logic.
- [ ] Hook pointer input for selecting tools and applying effects in board area.

### Test Gate
- All 10 tools selectable.
- HUD updates without layout break on common resolutions.

### Commit
- `feat: implement themed sidebar, tool selection, and constants HUD`

## Milestone 4 - Lens System + Field Overlay Pipeline
- [ ] Implement cursor lens radius system.
- [ ] Restrict field overlays to lens mask (`ctx.clip()` pipeline).
- [ ] Add generic vector field renderer.
- [ ] Add optional grid renderer (only for Mass/Dark Energy).

### Test Gate
- Field visuals are hidden outside lens.
- Mass mode uniquely shows grid.

### Commit
- `feat: add lens-based reveal system for field overlays`

## Milestone 5 - Implement 10 Mechanics (Physics + VFX)
- [ ] Heat: orange radial glow + outward vectors + balloon expansion + outward push.
- [ ] Cold: icy texture + shrink + denser/heavier behavior.
- [ ] Mass: inward warped cyan grid + attraction force.
- [ ] Dark Energy: outward warped cyan grid + repulsion force.
- [ ] High Pressure: outward impulse burst particles.
- [ ] Vacuum: inward sink-flow star streak particles.
- [ ] Tunneling: wall segment static/wireframe + collision bypass + drag + RGB ghost balloon.
- [ ] Viscosity: heavy damping.
- [ ] Elasticity: high bounce conservation.
- [ ] Entropy: smooth noise perturbation in velocity.

### Test Gate
- Manual mechanic checklist passes for all 10 tools.
- No tool crashes loop or breaks input.

### Commit
- `feat: implement all ten constants mechanics and visual effects`

## Milestone 6 - Visual Polish To Match References
- [ ] Tune glow intensities, line weights, and spacing to image style.
- [ ] Tune title typography and composition.
- [ ] Add subtle cyber-lab ambience (grain/vignette/light bloom approximations).
- [ ] Ensure Heat/Mass/Vacuum/Tunneling resemble `1.png`-`4.png` one-to-one logic.
- [ ] Verify desktop and mobile fit.

### Test Gate
- Side-by-side visual check with the four reference images.
- Basic responsiveness check at 1366x768 and mobile portrait.

### Commit
- `style: polish visuals for reference parity and responsive layout`

## Milestone 7 - Final Validation And Delivery
- [ ] Run final syntax/test checks.
- [ ] Run final manual playthrough.
- [ ] Update `plans.md` checkboxes to complete.
- [ ] Provide concise run instructions in `README.md`.

### Test Gate
- Clean run with no console errors.
- All milestones marked complete.

### Commit
- `docs: finalize plan completion and usage instructions`
