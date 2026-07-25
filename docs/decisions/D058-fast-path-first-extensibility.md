# D58: Fast-path-first extensibility

Status: current
Date: 2026-07

The corpus draws a fast path and a slow path through every modification:
Luau and data-stage content hot-reload in seconds, Odin and Go rebuild
through S22b's respawn loop. Without a standing policy the boundary
between them freezes wherever the prototype port happens to leave it,
and the flexibility vision erodes one hardcoded feature at a time. The
policy: when a modding or editor use case needs engine behavior changed,
the default answer is a new opt-in binding package (D3) or a data-stage
surface, reached at hot-reload speed; modifying Odin source is the
answer only where the sandbox or the determinism model forecloses the
fast path, the way D43 already forecloses native code inside a Session.
The boundary is expected to keep moving toward Luau and data as the
`svsw.*` surface grows, and a review that finds new engine behavior
reachable only by rebuild asks why the fast path was not offered.
Freezing the ported surface as-is is rejected because it makes the
prototype's 2D-era API the permanent ceiling of a 3D engine's
moddability; pushing everything scriptward regardless of cost is
rejected because hash-bearing hot loops and boundary code belong under
the determinism regime, which is the slow path's reason to exist.
Adopted from the 2026-07-25 adversarial review at the maintainer's
direction.
