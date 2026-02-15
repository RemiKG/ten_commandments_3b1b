# plans.md

## Execution Rules (Active)
1. Follow `AGENTS.md` as the constitutional source of truth.
2. This plan is mandatory and step-ordered; improvements are allowed only if they preserve V2 end goals and are recorded.
3. Every milestone must end with:
   1. concrete self-tests/checks,
   2. a passing result,
   3. a milestone-scoped git commit.
4. Keep rollback safety:
   1. create a backup point before major rewrites,
   2. avoid destructive git commands.

## Current Snapshot (2026-02-15)
- [x] Backup commit created before V2 rewrite work.
- [x] Backup tag created: `backup/pre-v2-governance-2026-02-15`.
- [x] `AGENTS.md` migrated to V2 constitution.
- [ ] Core runtime still reflects pre-V2 implementation and must be migrated.

## Legacy Record (Archived)
V1 and entropy phase milestones were completed previously (bootstrap, 10 tools, lens overlays, CA thermo, equation HUD, verification).
This section is archived; active development now follows the V2 milestones below.

## Phase 3 - V2 Migration Roadmap (Active)

### Milestone 1 - Assetsv2 Audit And Runtime Manifest
- [ ] Verify real `assetsv2/` directory structure and enumerate available files.
- [ ] Create centralized V2 asset manifest in `src/config.js` (or dedicated module).
- [ ] Map required runtime buckets:
  - backgrounds (normal/hacker),
  - walls/maze visuals,
  - cat visuals (normal/hacker),
  - 6 tool icons,
  - audio tracks and SFX.
- [ ] Add resilient fallback behavior for missing assets.

#### Test Gate
- Validate manifest paths resolve at runtime (or fallback path logs are explicit).
- Run syntax checks on updated modules.
- Smoke-run app to ensure no boot regression.

#### Commit
- `chore: add assetsv2 manifest and resilient asset loading fallbacks`

### Milestone 2 - Tool System Refactor (10 -> 6) + Metadata
- [ ] Refactor tool list to exactly 6 powers:
  - `heat`, `cold`, `gravity`, `highPressure`, `vacuum`, `quantumTunneling`.
- [ ] Remove V1-only tools from active runtime paths (`darkEnergy`, `viscosity`, `elasticity`, `entropy`).
- [ ] Add per-tool metadata:
  - duration,
  - ammo,
  - icon path,
  - SFX path,
  - deployment radius.
- [ ] Update any helper maps/constants and UI layout assumptions.

#### Test Gate
- Syntax checks for touched modules.
- Existing mechanics/UI smoke tests updated or replaced for 6-tool model.
- Manual tool selection check confirms exactly 6 selectable entries.

#### Commit
- `refactor: migrate tool manifest to six-power v2 schema`

### Milestone 3 - Input Model Migration (Hold -> Click Deploy)
- [ ] Convert pointer interaction from hold-to-apply to click-to-deploy.
- [ ] Implement deploy instance model (`activePowerDrops`).
- [ ] On board click with ammo available:
  - spawn drop,
  - decrement ammo,
  - attach duration state.
- [ ] Draw dropped icon/PNG for active duration.

#### Test Gate
- Click once creates one active drop.
- Drop expires at duration end.
- Ammo decrements only on successful deployment.
- Syntax + UI smoke checks pass.

#### Commit
- `feat: add click-to-deploy timed power drops with ammo consumption`

### Milestone 4 - Physics Engine V2 Mapping
- [ ] Rework force application to iterate active drops.
- [ ] Implement V2 mechanics:
  - heat 2.0s expansion,
  - cold overlap-gated 2.0s shrink,
  - gravity 7.0s attraction,
  - highPressure 0.5s push,
  - vacuum 0.5s pull,
  - quantumTunneling targeted wall disable + drag.
- [ ] Keep deterministic collision core and dt clamping.

#### Test Gate
- Mechanic spot checks for all 6 powers.
- No runtime errors or unstable velocity explosions.
- Physics smoke tests pass (update tests as needed).

#### Commit
- `feat: implement v2 six-power physics runtime on active drop model`

### Milestone 5 - Renderer Mode Split (Normal/Hacker)
- [ ] Add mode state and UI toggle.
- [ ] Bind mode-specific backgrounds/walls/cat visuals from `assetsv2/`.
- [ ] Enforce overlay gating:
  - hacker mode: full lens-based overlays,
  - normal mode: simplified pixel emissions near drop icons.
- [ ] Preserve shared physics state across both modes.

#### Test Gate
- Toggle switches visuals without changing underlying physics behavior.
- Hacker mode shows full overlays through lens.
- Normal mode suppresses full overlays and shows simplified FX.

#### Commit
- `feat: split renderer into normal and hacker visual pipelines`

### Milestone 6 - Neon Cat + Stage And Goal Progression
- [ ] Replace balloon render path with neon cat visuals while keeping stable collider.
- [ ] Add stage state and neon rod goal logic.
- [ ] Implement rainbow rod progression across stages.
- [ ] Implement stage-dependent trail profiles.

#### Test Gate
- Cat reaches rod and triggers stage progression.
- Rod color changes by stage.
- Trail style changes per stage profile.

#### Commit
- `feat: add neon cat actor, rainbow rod progression, and stage-based trails`

### Milestone 7 - Audio Integration
- [ ] Add `AudioManager` for BGM and SFX orchestration.
- [ ] Wire mode-based BGM:
  - normal -> `theme.mp3`,
  - hacker -> `Hacker_theme.mp3`.
- [ ] Wire deployment SFX (`Heat`, `Cold`, `Gravity`, `quantum`, `vacuum`).
- [ ] Implement first-gesture audio start and mode switch crossfade.

#### Test Gate
- Correct BGM per mode.
- Correct SFX per deployed power.
- Audio failures do not crash gameplay.

#### Commit
- `feat: integrate v2 audio manager with mode bgm and power sfx`

### Milestone 8 - HUD And UX Finalization
- [ ] Update HUD wording to V2 semantics.
- [ ] Show ammo badges on all 6 sidebar powers.
- [ ] Preserve clear active-tool highlight and readable mode status.
- [ ] Ensure responsive 16:9 composition remains strong.

#### Test Gate
- UI layout smoke test passes on desktop and mobile viewport checks.
- No text overlap or clipped controls.

#### Commit
- `feat: finalize v2 hud sidebar ammo and mode controls`

### Milestone 9 - Test Suite Migration And Hardening
- [ ] Update existing tests from 10-tool assumptions to 6-tool model.
- [ ] Add tests for:
  - deploy duration expiration,
  - ammo decrement behavior,
  - cold overlap-only timer behavior,
  - mode overlay gating,
  - stage trail switching,
  - audio manager safe initialization.
- [ ] Run full automated suite.

#### Test Gate
- All syntax checks green.
- All smoke/mechanic tests green.

#### Commit
- `test: migrate and expand suite for v2 gameplay contracts`

### Milestone 10 - Final Verification And Delivery
- [ ] Run full final validation pass.
- [ ] Perform manual gameplay walkthrough across modes and stages.
- [ ] Confirm AGENTS + plans + README alignment with implemented behavior.
- [ ] Record final verification notes with commands and outcomes.

#### Test Gate
- Clean runtime with no console errors.
- All milestones complete.

#### Commit
- `docs: finalize v2 migration verification and delivery notes`

## Verification Command Template (Per Milestone)
- Syntax checks (minimum affected modules):
  - `node --check src/main.js`
  - `node --check src/physicsEngine.js`
  - `node --check src/renderer.js`
- Smoke tests (adjust as tests migrate):
  - `node tests/ui-layout-smoke.mjs`
  - `node tests/overlay-mode-smoke.mjs`
  - `node tests/tool-mechanics-smoke.mjs`

## V2 End Goal Checklist
- [ ] Exactly 6 powers active in runtime and UI.
- [ ] Click-to-deploy + timed icon drops + ammo system complete.
- [ ] Neon cat replaces balloon visuals.
- [ ] Two visual modes complete with identical physics behavior.
- [ ] Hacker-only full overlay rendering through lens.
- [ ] Normal-mode simplified pixel FX from dropped icons.
- [ ] Stage progression + rainbow rod + stage-dependent trails.
- [ ] Mode BGM + power SFX fully integrated.
- [ ] Full test suite green.
