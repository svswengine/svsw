# D13: No backward compatibility through the transition

Status: superseded by [D38](D038-fresh-repository.md)
Date: 2026-07

Nothing in the behavior, formats, APIs, goldens, or gates of the internal
prototype, a 2D engine, is owed continuity. Hard cutover at gate-equivalence
(stage 3, ten-item checklist, no subset form); old goldens and gates drop at
that moment; the cutover deletes the 2D-era code (render, render/gpu,
physics, ui/Clay, 2D capture/dev, LDtk/DragonBones/Aseprite paths, 2D web
target), and git history is the archive. "Evolve in place" means the repo,
CI plumbing, issue/decision history (beads prefix included), and portable
subsystems only.
