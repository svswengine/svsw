# D21: Editor command stream

Status: current
Date: 2026-07

Adopted from the research plan §4.6, promoted to the log. Every edit
operation is a typed command on a command stream; undo/redo and edit
persistence are command-log mechanisms; play-in-editor boots a real
deterministic Session with a live world-hash display, tick stepping, and
replay scrubbing. The editor roundtrip gate is headless command-log replay,
so the command stream itself is under gate coverage; editor scripts (D10)
reach sim state only through the command stream. Amended by D57: every
command records the sim tick at which it applies, an edit issued behind
the playhead truncates the tick suffix, and undo or redo of a command at
or before the playhead resimulates from the earliest affected tick.
