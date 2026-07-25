# D36: Engine dev loop

Status: current
Date: 2026-07
Rationale: docs/research/engine-extensibility-loop.md

Spec S22b ("Engine dev loop: rebuild, respawn, restore") covers rebuild
orchestration, the editor-worker reconnect handshake, restore policy, and
dev-diverged semantics. Worker topology: S22 is amended so play-in-editor's
Session runs in an S08-topology worker process instead of in-process; the
editor becomes that worker's client and supervisor over the versioned
protocol, reusing S05/S26's envelope and version whitelist for the reconnect
handshake; a crash-only whole-editor-restart variant is an allowed first
milestone inside S22b, not a separate spec or path. Reject-and-replay
restore answers S02a's open dev-loop half of its save/replay versioning
question: on a worker rebuild, a snapshot restores only when its schema hash
matches the running build; on a mismatch the worker replays the D21 command
log from session start instead, so schema changes degrade to a slower
restore rather than a wedge. No migration functions run in the dev loop; a
versioned-snapshot-reader story stays deferred to shipped-save concerns
S27b's stage-5 durability work owns. Cross-build hash semantics: within-
build hash checks, D22 parity, and checkpoint agreement on an unchanged-
build respawn remain hard failures, the corruption detector for the restart
loop itself. A rebuild that lands code changes marks the session dev-
diverged, and its cross-build hash diffs against the pre-rebuild stream
render as forensics only (first divergent tick or chunk, surfaced through
the `svsw_explain` and replay tooling), never as failures. Goldens are never
re-recorded from the dev loop; golden re-recording stays the separate,
deliberate, reviewed ritual the golden-hashes process already defines.
Amended by D44: the editor supervises N Session workers rather than one, and
a second kind, the Job worker, carries derived-state work under a different
restart contract.
