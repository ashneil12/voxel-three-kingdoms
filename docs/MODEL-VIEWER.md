# Existing model inspection surfaces
Recorded 30 September 2026 from local source. No new viewer created. Commands/routes below were inspected, not launched or runtime-certified during the art pass.

## Game-integrated studio — primary for combat integration
Root: /Users/ash/Projects/boxin game?/vg-game
Entry: studio.html
Source: src/studio.js

Launch from the game root:
```sh
python3 tools/serve.py
```
Open http://localhost:8767/studio.html
The server binds to 127.0.0.1 and serves this checkout with no-store headers. Check whether port 8767 already serves another checkout before reusing it.
Alternative read-only static preview: python3 -m http.server 8765 --bind 127.0.0.1 (capture POST is unavailable there).

Source-visible controls:
- Representation: voxel game model, prepared combat suit, code-built editable suit.
- Surface: textured, clean paint preview, clay, skin weights.
- Cameras: three-quarter, front, side, back, helmet/chest, gameplay distance; orbit/zoom handlers exist in studio source.
- Actions: reference stance, idle, run, guard, dodge, first strike n1, wide sweep n3, heavy launcher c1, spin c4, overdrive start/finish.
- Timeline 0–100%, play/pause, named part selection/visibility, show all, save PNG.
- Procedural suit paint and proportion controls; export JSON and use-in-game controls.
- Contact sheet route documented in ASSET-PIPELINE.md: /studio.html?sheet=run:front:6 with optional surface and framing parameters. Verify actual query handling before automating.
No unsupported speed control or every-combo dropdown is claimed.

Use this existing studio for game rig/pose/contact acceptance. It must display the asset definition used by the game. Do not create a third viewer.

## img2threejs showcase — existing reconstruction inspection
Root: /Users/ash/Projects/img2threejs-showcase
Start: npm run dev (from that root)
Route: http://localhost:5173/#/demo/vanguard-suit
Related route: /#/demo/vanguard-helmet
Registry: src/demos/registry.ts
Suit source: src/demos/vanguard-suit/createVanguardSuitModel.ts
Motion definitions: src/demos/vanguard-suit/clips.ts
Shared viewer: src/scene.ts

The suit registry declares six clips (idle, walk, run, two attacks, dodge), an 18-bone derived skeleton, part inspection support through the shared showcase, and default idle. Check the live interface for exact clip/inspection controls before claiming support. Its registry labels the suit placeholder and describes TRELLIS-derived surface data carried in TypeScript. This is not proof of an accepted new procedural construction.

## Future pipeline use
Read /Users/ash/.img2/SETUP-LOCAL.md and the current symlinked img2threejs skill when implementation is authorized. Use animated-character for moving subjects, generic for static props where appropriate, follow the actual local checklist, and keep source/provenance distinctions honest.
The shared setup records Python >=3.10, a local 3.14 install and IMG2THREEJS_SHOWCASE_ROOT. Recheck versions rather than copying an old validation claim.
A successful code check does not establish art fidelity or motion quality. Capture front/side/back/gameplay views plus real motion and compare with the locked reference. The old production-pilot viewer is historical tooling, not a new default.
