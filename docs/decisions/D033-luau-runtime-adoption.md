# D33: Luau runtime adoption

Status: current
Date: 2026-07
Rationale: docs/research/scripting-language-comparison.md, docs/research/typed-editor-scripts.md

Luau replaces Lua 5.4 as the single script runtime everywhere: mods and the
editor scripting tier (D10) share one VM. This supersedes the choice locked
earlier in the research corpus; the maintainer fired that decision's own
logged revisit trigger, typed-DX demand the annotation path could not meet.
The fork-and-merge Luau+5.4 proposal, grafting Luau's type system onto the
Lua 5.4 runtime without a full swap, is rejected as structurally infeasible:
no shared code lineage, incompatible number models, grammar gaps Luau's
parser cannot accept, a from-scratch C++ VM, two moving upstreams. Timing:
svsw has no code or golden hashes yet, so this is a respec, not a migration;
nothing ported yet needs re-porting. The internal prototype's Lua-boundary
code (sandbox_strip, the R1-R5 checklist, host.odin's shape) becomes
adaptation rather than literal port, since Luau's C API stays
5.1-era-compatible; the patterns (whitelist construction,
budget-quota-with-shared-pool, one-error-path containment) carry forward even
where the literal code does not. This entry supersedes the Lua 5.4 clauses of
D9, D10, and D12 wherever they say "Lua 5.4," and amends D14: Luau's C API
and its C++ implementation enter the vendored C tier behind its C-compatible
boundary, alongside SDL3, wgpu-native, and cimgui, wherever D14 says "Lua's
C API."
