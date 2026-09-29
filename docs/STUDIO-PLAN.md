# Browser studio and production approach

Status: proposed approach, 28 September 2026. This document plans the next work; it does not mean a studio has been built or that the art target has been achieved in-engine.

The destination is in [GAME-VISION.md](GAME-VISION.md). The current build is described in [DEMO.md](../DEMO.md).

## Recommendation

Build a focused browser asset studio alongside the game. Use it to produce and inspect a polished animated exosuit under the game's actual rendering conditions. Prefer procedural geometry and editable data, preserving the option to import assets produced with other tools when that is more productive.

The studio earns its place by shortening the path from design change to a convincing playable result. Grow its capabilities around real production needs. A complete general-purpose modelling application is outside the proposed scope.

Keep the ideal concept as the visual target. Judge simplifications at the real gameplay camera distance. Additional detail should justify its authoring effort, visual clutter, and runtime cost.

## Blender and a browser studio

Blender can be automated with Python and run without its graphical interface. It does not inherently require slow computer-use operations. That makes a scripted Blender-to-game pipeline a viable alternative, especially for complex surface modelling, mesh operations, UV work, baking, and asset conversion. Whether it is faster for a particular asset needs evidence.

A browser studio's principal advantages for this project are direct reuse of game materials, lighting, joint transforms, effects, and cameras; a shared JavaScript/data workflow; and immediate comparison under gameplay conditions. Rigid mechanical parts and modular equipment are a good fit for that approach.

Code-driven construction still involves modelling, iteration, and tooling. It does not automatically produce premium art, and inspecting parameters alone cannot establish visual quality. Screenshots and motion review remain necessary.

Primary reference for Blender automation: [Blender developer documentation — Python command-line tests](https://developer.blender.org/docs/handbook/testing/python/). The documented background/Python invocation establishes that GUI operation is not mandatory. It does not establish that Blender is installed or that a project-specific asset pipeline has been tested.

## Proposed architecture

Use one set of asset definitions and rendering components in both studio and game. The studio should preview the actual production asset rather than a parallel approximation.

| Part | Responsibility |
| --- | --- |
| Reusable geometry library | Bevelled and tapered armour plates, shells, joints, pistons, weapon pieces, attachment mounts |
| Asset definitions | Proportions, component placement, materials, attachments, stable identifiers and saved variants |
| Shared rig and animation integration | Joint hierarchy, grips, locomotion and combat poses, weapon contact alignment |
| Shared rendering configuration | Game materials, lighting presets, camera presets and effects quality |
| Studio interface | Select a component, tune meaningful parameters, inspect variants, scrub motion and capture views |
| Validation and capture interface | Deterministic poses, repeatable camera shots, asset validation and runtime diagnostics |

Prefer data for routine tuning, with code for reusable shape construction and behaviour. Version saved definitions so old presets can be validated or migrated as the schema changes. Preserve previous versions when saving a new design.

A remote backend is unnecessary for the initial studio. A local browser interface can load source definitions and export edited presets for deliberate saving to the repository. If direct local saving is later useful, choose an explicit local mechanism. Do not imply that a plain static webpage can silently write arbitrary project files.

## First production milestone: one suit, proven in motion

Create one upgraded suit using the existing staff/lance combat as its foundation, plus a small industrial presentation area. This is a proof of the production workflow and visual standard for the full roster, not a reduction of the game vision.

The first studio should support:

- Full-body orbit, front, side, rear and gameplay-camera views.
- Component visibility and selection; controlled editing of shape, proportion, placement, colour and material parameters.
- A shared neutral lighting preset and the actual game lighting preset.
- Idle, run, dodge, guard, counter, basic combo, heavy attack and signature-attack preview as integration permits.
- Pausing, slow motion and frame/pose scrubbing without changing normal gameplay timing.
- Equipment attachment preview and a small number of saved variants.
- Repeatable screenshots and short animation captures from named views.
- Basic rendering diagnostics, with repeatable settings and a representative crowd scene for later load checks.

Automated consumers should be able to select an asset, pose/time, camera and lighting preset without clicking through menus. The visible interface should expose those same states. Rendering and inspection still happen in the browser; a data dump is not a replacement for seeing the result.

## Acceptance before expanding the tool

1. The suit has deliberate shapes and a recognisable silhouette from all useful views, beyond a collection of unchanged primitives.
2. Saved parameters reproduce the same design, and the game loads the same asset definition the studio displays.
3. Major combat poses preserve weapon grip, visible contact, and acceptable armour clearance. Animation timing and hit behaviour remain consistent with the combat design.
4. Screenshots compare the result with the concept, and motion capture shows transitions and effects. Label these as actual runtime captures.
5. A representative gameplay scene is profiled on recorded hardware and settings. Establish desktop and eventual mobile budgets from measured behaviour; no untested frame-rate promises.
6. Ash judges appearance and combat feel through normal playtesting. Automated rendering and source tests do not substitute for that judgement.

The user's existing preference is to handle gameplay feel testing themselves. Use automated checks and visual inspection for production issues; do not assume a request for autonomous playtesting.

If the result falls short, identify whether the problem is silhouette, geometry, material, lighting, animation, or performance. Add a tool feature or a Blender-assisted step only when it addresses that specific limitation.

## What follows once the workflow works

Adapt the other four frame foundations using the same asset and animation conventions. Create an enemy family with distinct silhouettes and roles. Build a representative mission that connects workshop preparation, meaningful enemy encounters, a build-related upgrade choice, a mini-boss or elite, and a boss encounter.

Then expand progression, mission routes, regions, reward pools, and interface depth using the full vision. Keep release planning separate from the long-term destination. Cooperative networking warrants its own milestone and design before implementation.

## Boundaries and verification

No switch away from Three.js is required by the proposed style. Asset complexity, animated crowd costs, shadows, transparency, post-processing, and device limits still need measurement. Repeated props and compatible robot parts may use instancing; animated crowds need additional design beyond enabling one API.

Preserve the current demo and its combat while developing new assets and tools. Do not require cloud services, account systems, payments, or a Blender installation merely to begin the studio work. Avoid building terrain sculptors, arbitrary mesh editors, multiplayer studio collaboration, or a generic node editor until actual game production demonstrates a need.

The immediate recommendation is the one-suit studio milestone above. It produces something Ash can judge directly and establishes whether the proposed workflow can support the ideal art direction.
