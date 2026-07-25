# D53: Engine releases and the compatibility surface

Status: current
Date: 2026-07

The repo is public with a deployed course from stage 0, so external
users arrive years before S32 and consume an unversioned HEAD, and D1
calls a determinism break a release blocker in a plan that never defined
a release. This defines the missing subsystem at the engine era's scale.
A release is a git tag with CI-built, checksummed binaries attached
through GitHub Releases, free under the zero-budget constraint. Tags cut
at stage exits, numbered 0.<completed-stage>.<n> while the engine
builds; S32's engine-accept cuts 1.0. The compatibility surface extends
D19's re-bake-on-bump posture format by format: a game project and its
mods pin one engine release; containers re-bake on a schema bump with no
runtime migration; the `svsw.*` surface is recorded by the S21
api-surface snapshots, which make an API break visible rather than
forbidden; saves and command logs are release-scoped, hard-rejecting on
a version mismatch per the ported codec posture, until the player
save/load spec ships its versioned reader. No cross-release promise
exists before 1.0, and stating that is the promise: a reader can now
distinguish a break the project chose from one it failed to notice.
S32's residual sweep gains a release dry-run, cutting a tag, building
the artifacts, and scaffolding a project against the tag, so the
mechanism is exercised once before completion is declared. Promising
cross-release compatibility before 1.0 is rejected as an unresourced
promise, and per-spec tagging is rejected because stage exits are the
only boundaries a green gate already defends. Adopted from
the 2026-07-25 adversarial review at the maintainer's direction.
