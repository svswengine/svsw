# D27: Spec+course pairing, four paths, course after implementation

Status: current
Date: 2026-07

Course material builds beside the engine, a practice carried over from the
internal prototype. Every implemented spec gets a course module in the
`course` repo, authored after implementation; spec and course come in pairs,
and the spec lifecycle extends to pending, brainstormed, grilled, spec
written, implemented, course published. A spec reaches course published only
when its implementation gate is green and its module passes the course
verification gate: embed-check against the pinned `svsw` commit,
reference-key cross-check, path-closure check, full site build, truth-verify
discipline recorded in review. One lesson corpus composes into four
consumable paths through per-lesson path tags: FULL, ENGINE, GAME,
GAME+MULTIPLAYER. ENGINE follows the engine specs; GAME and GAME+MULTIPLAYER
consume the post-engine product section, so their modules exist only after
engine completion, mirroring engine-before-product; FULL composes everything.
Drift rule: the course repo pins the engine at a commit, and the pin bump is
the drift-detection event, backed by a report-only probe against engine HEAD;
an engine change that breaks a published module's gate returns the paired
spec to implemented until the module is fixed. Amended by D59: a spec's
course rung gates only its own closure, pin bumps batch at stage
boundaries, embeds anchor on named region markers, and M-series specs
are exempt from pairing.
