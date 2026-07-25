# D10: Editor Luau ships in v1

Status: current
Date: 2026-07

An editor scripting host shares the mod sandbox's VM architecture
(whitelist, alloc cap, instruction budget, R1-R5, disable-in-place) at an
expanded capability tier: project-scoped filesystem, asset writes, editor UI
bindings, command-stream emission. One embedding; containment guarantees
preserved; the capability tier is reviewed as a security boundary and, being
one, never re-sequences into the engine-completion verification stage (the
re-sequencing cap). Superseded in part by D33 (Lua 5.4 becomes Luau).
Amended by D43: the expanded capability tier is a capability tier rather
than a security boundary, since its purpose is granting access rather than
containing it, and the mod sandbox is the only security boundary this
project declares.
