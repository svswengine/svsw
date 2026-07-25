# D57: Rewind-then-edit semantics

Status: current
Date: 2026-07

D21 created two time axes, the edit log driving undo and redo, and the
sim tick driving play and scrubbing, and left their crossing undefined,
which is the vision's core loop: rewind, change the game, resume. This
settles the contract, amending D21 and constraining the debugger spec.
Every
command records the sim tick at which it applies, so the tick-stamped
command log composes with the per-tick Canonical_Input_Set stream into
one total order, the order every replay, restore and resume
reconstructs. An edit issued while the playhead sits behind the
session's last tick truncates the tick suffix: ticks beyond the
playhead derive from a world that no longer exists, so they leave the
live timeline, while the pre-edit stream stays on disk readable by the
replay tooling for forensics. Undo and redo remain log navigation and
append nothing; navigation that changes any world-mutating command at
or before the playhead triggers deterministic resimulation from the
earliest affected tick, served by checkpoint restore plus resim, so the
mockup's invariant that a revisited tick shows its recorded hash holds
exactly when the log segment before that tick is unchanged. Branching
timelines are rejected: the discarded suffix stays readable, which is
the forensic use a branch store would serve, and a live branch UI has
no consumer. Refusing edits while rewound is rejected because it
forbids the loop the debugger exists for. Adopted from the 2026-07-25
adversarial review at the maintainer's direction.
