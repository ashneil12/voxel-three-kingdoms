# Vanguard (turnaround reference) — img2threejs build

Source of the default Vanguard. Reference: `vanguard_ref.png` (front / left / back / right T-pose views, detail crops, spear, palette).
Working copy with the pipeline state, evidence, spec and review renders: `~/Projects/img2-builds/vanguard2/` (not in git).

1. `matte.py` — cuts the figure out of the busy sunset arena (colour classes → largest blob) so the pipeline's admission gate and the diff can work.
2. `parts.py` — the model as boxes per rig joint (hanging joint-local voxel units, left side authored, right mirrored), transcribed from the views.
3. `model.py` — transforms: T-pose world boxes (spec, diff) and game joint-local boxes. `diff.py` — front/back/left/right projection vs the matted reference.
4. `build_spec.py` → `object-sculpt-spec.json` → img2threejs strict validation → generated Three.js factory (review renders, harness).
5. `export_game.py` → `src/heroes/vanguard-ref-data.js`; `src/heroes/vanguard.js` builds the hero from it on the unchanged rig (no rigDim).

Older builds stay selectable: `?vanguard=authored` (code-authored, previous) and `?vanguard=sheet` (first sheet reconstruction).
