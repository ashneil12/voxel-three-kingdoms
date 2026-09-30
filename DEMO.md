# EXO: Hold the Line — first playable pass

A pilot in a powered exosuit holds an industrial arena against a machine legion. This first pass adapts the existing crowd combat, animation timing, hit reactions, and boss encounter. It is a small combat demo, not a finished game.

For the intended complete game, see [Game vision](docs/GAME-VISION.md). The [studio and production approach](docs/STUDIO-PLAN.md) records the proposed next development milestone. These describe future work, not features already present in this demo.

For current implementation and verification, use [Production status](docs/PRODUCTION-STATUS.md) and [Vanguard asset pipeline](docs/ASSET-PIPELINE.md). Vanguard is a code-authored fine-voxel hero on the shared combat rig, built the way the original officers are (`?vanguard=sheet` shows the earlier sheet reconstruction). Open `/studio.html` to inspect poses; `?suit=procedural` keeps the earlier code-built suit available. Source surface cleanup is still provisional.

## Play locally

From this directory:

```sh
python3 -m http.server 8765
```

Open <http://localhost:8765/> in a desktop browser with WebGL2. No package install or build step is required.

- WASD / arrows: move
- J / left click: attack; chain presses for a combo
- K / right click: heavy attack; branch mid-combo
- Tab: lock or unlock the nearest visible target (prioritizes the command unit). The camera follows the target, and strikes aim toward it.
- F: hold guard. It drains a separate guard meter; blocked hits drain more and deal chip damage. Tap just before a frontal hit for a perfect parry that stuns the attacker; parry then has a 2.5-second cooldown. The command unit recovers from parry faster than from a full poise break. Rear and flank attacks bypass guard.
- Shift / L: boost dodge
- Space: jump
- I: overdrive when a gauge segment is full
- Camera follows travel automatically by default; press C to toggle manual mode (the choice is remembered on this browser). Q/E or mouse drag always adjust the view, and pause auto-follow for 3 seconds. Lock-on still tracks its target in either mode.
- Esc: pause

The machine assault builds through two escalation phases at 30 and 60 seconds. The command robot cannot arrive before 70 seconds, and comes after 60 KOs or at about 115 seconds. `?boss=1` makes it appear early for testing; `?musou=1` starts with a full overdrive gauge; `?enemies=40` changes the regular-robot pool. `?classic` opens the original Three Kingdoms scenario and cast.

## What remains provisional

The basic strikes still use the source game's spear timing and hit windows. The command robot uses its existing boss behavior. Animation, combat balance, audio, UI, and the arena need further work before this becomes a distinct, polished game. This first pass deliberately uses one suit, one arena, and one command robot so the combat can be played and judged now.

The original source and notices remain in this fork; see `README.md` and `LICENSE`.
