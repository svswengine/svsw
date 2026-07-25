# D60: In-Session script reload

Status: current
Date: 2026-07

Amends D36 to give the fast path the determinism semantics only the slow
path had. The M00 record promises that Luau hot-reloads while Odin
rebuilds, yet no spec owned reload and D36 marked a session dev-diverged
only when a rebuild landed code changes, leaving a mid-Session mod edit
free to change the sim trajectory unmarked. S22b owns editor-era script
reload alongside Odin rebuild. Reloading a mod into a running Session
re-runs the affected control-stage load, and any reload that changes sim
behavior marks the session dev-diverged exactly as a rebuild does,
because the recorded trajectory no longer predicts the live one. A
reload that registers or changes a component schema under D12's
mirroring falls out naturally: D36's restore already keys on the schema
hash rather than the build hash, so a schema-changing reload takes the
same reject-and-replay path a schema-changing rebuild takes, and the
glossary's dev-diverged entry widens from rebuilds to any
behavior-changing reload. Deferring reload to a post-engine polish pass
is rejected because the fast path is most of what the flexibility
vision delivers day to day, and an unowned fast path with undefined
hash semantics is how determinism erodes quietly. Adopted from the
2026-07-25 adversarial review at the maintainer's direction.
