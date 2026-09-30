# Vanguard voxel model pipeline

Source: `ref/vanguard_sheet.png` (concept sheet) and its front/side/back crops on the sheet's own voxel grid (`ref/*_std.png`, 15 px = 1 voxel, origin at px 395 / ground at py 1345).

1. `vanguard_parts.py` — ~130 hand-transcribed boxes on 16 joints: the volume envelope and colour blocks.
2. `voxelize.py` — carves that envelope by the sheet's front/back/side silhouettes (stepped edges), keeps the authored colours (`PROJECT=1` also projects the sheet's pixels; noisier), mirrors the left half.
3. `export_game.py` — regroups voxels by game rig joint, run-length codes them into `src/heroes/vanguard-data.js` with the rig proportions (`RIG_DIM`).

Rebuild: `python3 voxelize.py && python3 export_game.py` (needs numpy + Pillow). The game reads the data in `src/heroes/vanguard.js`.
