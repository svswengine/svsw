# D43: The editor tier, Extensions, and Editor scripts

Status: current
Date: 2026-07

`editor/` is a top-level directory and the topmost band of D2's one-way
stack, above the engine core: it depends downward and nothing depends on
it, and tier-scan enforces that from S00, before any editor code exists.
Editor-only registration happens at a call site that is absent from a
non-editor build rather than behind a runtime check, so shipping editor code
into a game is unrepresentable rather than merely discouraged. An
**Extension** is native Odin source compiled into a user's own editor build,
registering through the locked seam D3 already defines for binding packages;
it is not dynamically loaded. Dynamic loading is a later spec whose first
requirement is a layout-CRC refusal gate on the shape of the shared
structures, because `core:dynlib` performs no version, ABI or signature
checking, Odin's `Context` layout has changed across releases,
`unload_library` can report success without unloading so a reload returns
the old code, and host and plugin share one temp-allocator arena on macOS
through a coalesced weak symbol. Starting static costs an extension install
a rebuild, which users doing this already perform, and it proves the seam
before a loader depends on it. **A Session never loads an Extension.** The
simulation is extended by modifying engine source and rebuilding, which
makes the build hash the world's identity, the rule Factorio and OpenRA
independently arrived at; sandboxed Luau remains the only way to extend a
running Session, as D12, D33 and D34 already have it. Native code inside a
deterministic Session is rejected on three findings: the FPU control word is
process-global, so a native extension anywhere in the process can corrupt
float results in code it never calls; Odin's `proc "c"` convention, the one
its own examples use, makes `runtime.default_context()` silently yield the
default heap allocator rather than the engine's, a determinism bypass hiding
in the obvious idiom; and the single project shipping native code inside a
deterministic simulation, OpenRA, can do so only because its simulation
contains no floats at all, which D35's f64 semantics foreclose here. An
**Editor script** is Luau at D10's expanded capability tier. D10 is amended
where it calls that tier a security boundary: it is a capability tier, since
its purpose is granting project-scoped filesystem access, asset writes and
command-stream emission rather than containing anything, and the mod sandbox
is the only security boundary this project declares. SECURITY.md records
that an Extension is trusted code outside the security model, because native
code compiled into a user's own binary cannot be contained and claiming
otherwise would be dishonest. The project takes no position on third-party
distribution of Extensions or Editor scripts; if an ecosystem develops, the
answer is provenance rather than containment, and it needs its own decision.
The vocabulary this decision introduces, **Extension**, **Editor script**
and **Editor tier**, is defined in `docs/context/CONTEXT.md`, which also
lifts the bar on "extension" as an alias for Mod. Settled with the
maintainer on 2026-07-25.
