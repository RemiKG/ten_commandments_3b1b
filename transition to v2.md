# Transition To V2

## Purpose
This document compares the current game implementation to the V2 guidelines and defines a concrete migration path from the existing codebase.

## Current Baseline (From Code)
- One render style (dark cyber-lab look).
- Entity is a glowing balloon.
- Trail is temperature-tinted only (not stage-driven).
- 10 tools exist: `heat`, `cold`, `mass`, `darkEnergy`, `highPressure`, `vacuum`, `tunneling`, `viscosity`, `elasticity`, `entropy`.
- Input model is press-and-hold to apply active tool continuously while pointer is down in board.
- Lens system is active and already clips field overlays.
- Tool visual overlays render directly in the main mode.
- No audio manager/module exists.
- No stage progression system exists (single sandbox state).

## V2 Target Summary
- Two toggleable visual layers/modes: `normal` and `hacker`.
- Balloon replaced by Neon Cat.
- Cat trail style depends on stage.
- Tools reduced to 6:
  - `heat`
  - `cold`
  - `gravity`
  - `highPressure`
  - `vacuum`
  - `quantumTunneling`
- Interaction changes from hold-to-apply to click-to-deploy with duration + ammo.
- Deployed power leaves its icon/PNG on the board while active.
- Lens system remains.
- Add audio: mode BGM + tool SFX.
- Full physics overlays (vectors/heatmap/grid/lines) are shown in hacker mode only.
- In normal mode, each deployed power uses lightweight pixel emissions around the dropped icon.

## Current vs V2 Comparison

| Area | Current | V2 Requirement | Migration Action |
|---|---|---|---|
| Entity | Balloon circle (`physics.balloon`, `renderer._drawBalloon`) | Neon cat sprite/rig | Replace balloon render path with cat draw path; keep circle collider for deterministic physics |
| Modes | Single style | `normal` + `hacker` visual layers | Add `visualMode` state and mode toggle UI; preserve identical physics across modes |
| Tool Count | 10 tools | 6 tools | Replace tool manifest and remove `darkEnergy`, `viscosity`, `elasticity`, `entropy` |
| Gravity Tool | `mass` + `darkEnergy` pair | only `gravity` attraction | Keep mass attract behavior, remove repulsion mode |
| Input Model | Hold pointer to apply continuously | Click once to deploy timed effect | Introduce deployed-power instances with `durationRemaining` |
| Tool Presence | Cursor-centric effects | Dropped icon persists in world during active duration | Add `activePowerDrops[]` with world position and icon |
| Ammo | Unlimited by default (and “used once” HUD) | Limited ammo per tool (with future tuning) | Add ammo counters in tool metadata and UI badges |
| Overlays | Drawn in current single mode | Full overlays only in hacker mode | Gate overlay renderers by `visualMode === "hacker"` |
| Normal Mode FX | Same overlay family | Simple pixel particles from dropped icon | Add compact per-tool normal FX renderer |
| Lens | Already implemented | Keep same lens behavior | Reuse existing clip pipeline and cursor-lens math |
| Audio | None | Mode BGM + per-tool SFX | Add `AudioManager` with loop/crossfade + one-shot effects |
| Progression | No stages | Stage-based rod colors + stage-dependent trail | Add `StageManager` and per-stage trail palette profiles |

## Detailed Migration Plan

### 1. Data Model and Config Refactor
Update `src/config.js`:
- Replace `TOOLS` with exactly 6 entries and add:
  - `iconPath`
  - `sfxPath`
  - `durationSec`
  - `ammo`
  - `dropRadius`
- Rename tool IDs:
  - `mass` -> `gravity`
  - `tunneling` -> `quantumTunneling`
- Remove IDs not used in V2.

Add mode/stage config objects:
- `VISUAL_MODES = { normal, hacker }`
- `STAGES = [{ id, rodColor, trailProfile, normalPalette, hackerPalette }, ...]`

### 2. Input System: Hold -> Click Deploy
Update `src/inputHandler.js` and `src/main.js`:
- Keep pointer tracking.
- Replace `applyingTool` continuous state with click-deploy behavior:
  - On click in board and ammo > 0:
    - spawn a `PowerDrop` at cursor
    - decrement ammo
- `PowerDrop` shape:
  - `id`
  - `toolId`
  - `x`, `y`
  - `duration`
  - `remaining`
  - `armed`

Behavior note:
- Cold duration should tick only while cat overlaps drop area.
- Heat/Gravity run for full duration once deployed.
- HighPressure/Vacuum are short lived (0.5s) but still modeled as timed drops.

### 3. Physics Runtime Conversion
Update `src/physicsEngine.js`:
- Rename high-level object from `balloon` to `cat` in public API (or keep internal variable and alias during transition).
- Add `applyActiveDrops(dt, drops, particles)` entrypoint.
- Evaluate each active drop each frame:
  - `heat`: expand cat + outward field push
  - `cold`: shrink cat only during overlap
  - `gravity`: continuous attraction for 7s
  - `highPressure`: outward force burst profile for 0.5s
  - `vacuum`: inward force burst profile for 0.5s
  - `quantumTunneling`: disable targeted wall segment + drag + ghost split
- Remove dark-energy repulsion branch and removed-material branches.

### 4. Rendering Split: Normal vs Hacker
Update `src/renderer.js`:
- Add a mode switch render branch:
  - `normal`: colorful cute theme, pink walls, minimal power pixels
  - `hacker`: muted/technical theme, full lens-based overlays
- Keep gameplay global; only visual representation changes.
- Draw dropped power icons on board while active.
- Ensure full pressure/vacuum lines, vector arrows, warped grids, and heatmaps render only in hacker mode.

Normal mode rule:
- Replace heavy overlays with compact pixel emissions from each drop icon.

Hacker mode rule:
- Keep existing lens reveal system and equation HUD behavior.

### 5. Cat and Stage-Driven Trail
Update renderer + game state:
- Replace circle-only character art with cat assets (normal/hacker variants).
- Maintain current deterministic circular collider for stable interaction.
- Add `stageIndex` and `rodColor` progression.
- Make trail renderer read `stage.trailProfile` so color/shape change per stage.

Suggested stage order:
- Stage 1 rod: red
- Stage 2 rod: orange
- Stage 3 rod: yellow
- Continue rainbow sequence as content expands.

### 6. Audio Integration
Add `src/audioManager.js`:
- Loop BGM by mode:
  - normal: `Assets/Audios/theme.mp3`
  - hacker: `Assets/Audios/Hacker_theme.mp3`
- Play one-shot SFX on tool drop:
  - `Cold.mp3`, `Heat.mp3`, `Gravity.mp3`, `quantum.mp3`, `vacuum.mp3`
- Add policy-safe start gate:
  - initialize/resume audio on first pointer interaction.
- Crossfade when mode toggles.

Note:
- Current repo snapshot does not include `Assets/Audios/` files yet; integration should handle missing assets gracefully and log a warning.

### 7. UI and Sidebar
Update `src/uiLayout.js`, `src/renderer.js`, and state wiring:
- Sidebar shows exactly 6 tools.
- Add ammo badge in each slot (example format: `x5`).
- Add mode toggle control (`Normal` / `Hacker`).
- Update HUD text from `Constants Remaining: X/10` to V2-specific counter wording (for example `Powers Ready: X/6`).

### 8. Equation and Lens Rules
Update `src/equationHud.js`:
- Keep equations for the 6 tools only.
- Show equation HUD in hacker mode.
- In normal mode either hide equations or show compact labels only.

Lens behavior:
- Keep existing geometry and clipping implementation.
- Restrict heavy physics visuals to hacker mode while preserving the same underlying force logic in both modes.

## Recommended File-Level Change Map
- `src/config.js`: tools -> 6, ammo/duration/icon/audio metadata, mode/stage configs.
- `src/main.js`: mode toggle, drop spawning, ammo decrement, stage state.
- `src/inputHandler.js`: click-to-deploy semantics (still pointer tracked every frame).
- `src/physicsEngine.js`: active-drop evaluator, remove obsolete tools, keep deterministic collider.
- `src/renderer.js`: cat rendering, mode split visuals, dropped-icon rendering, stage trail styles.
- `src/particles.js`: add normal-mode pixel emissions from drop icons.
- `src/equationHud.js`: 6-tool map + hacker-mode gating.
- `src/uiLayout.js`: 6-slot sidebar sizing and mode toggle hitbox.
- `src/audioManager.js` (new): BGM + SFX orchestration.
- `Assets/Audios/*`: required runtime assets.

## Migration Milestones (Implementation Order)
1. Manifest + state model refactor (6 tools, ammo, durations, mode, stage).
2. Click-deploy runtime + dropped icon persistence.
3. Physics mapping for 6 tools using active drops.
4. Renderer split (normal/hacker) and lens gating rules.
5. Cat asset render path + stage trail + rod progression.
6. Audio manager + BGM/SFX hookup.
7. Test and balancing pass.

## Verification Checklist For V2
- 6 tools only, selectable, with ammo counters.
- Click once deploy works; icon persists for active duration.
- Cold timer only drains while overlapping cat.
- Gravity lasts 7s, pressure/vacuum last 0.5s, heat/cold last 2s.
- Normal mode: no full-line/vector/grid physics overlays.
- Hacker mode: full overlays visible through lens.
- Mode toggle changes visuals + BGM only (physics unchanged).
- Cat reaches neon rod objective and stage progression updates trail + rod color.

## Risks and Mitigations
- Asset mismatch risk: normalize dimensions/origin in a small preload pass and use fallback placeholders.
- Audio autoplay restrictions: gate playback behind first user gesture.
- Determinism drift with new runtime model: keep fixed dt clamp and existing collision solver untouched.
- UI regressions from sidebar shrink 10 -> 6: update hitbox math and smoke tests.
