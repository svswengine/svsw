# D35: Number semantics on f64-only Luau

Status: current

Luau carries one 64-bit double for every number, with no integer/float dual
subtype, so identity is never arithmetic: entity IDs and chunk coordinates
cross the Luau boundary as opaque typed handles, and the type checker rejects
arithmetic performed on them. Ticks and quantities stay plain numbers, valid
within the 2^53 safe-integer envelope, with debug-build integrality guards
asserted at the boundary to catch float contamination before it reaches
deterministic sim state. Integral sim math, the ECS core, `hash_world`, and
tick accounting stay in Odin; Luau never performs integer-sensitive
arithmetic that could diverge under f64 rounding. This is the number-model
reconciliation the fork-and-merge proposal could not deliver, handled instead
by boundary discipline rather than a modified runtime.
