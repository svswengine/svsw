# Typed editor scripts: fork-and-merge assessment and options

> **Decision outcome (2026-07-14):** the maintainer chose Luau everywhere,
> not this document's recommended LuaLS+LuaCATS-on-Lua-5.4 baseline. The
> fork-and-merge proposal stays rejected as assessed below; the maintainer
> instead fired the logged revisit trigger on the sibling scripting-language
> decision (typed-DX demand the annotation path cannot meet) and swapped the
> runtime. See ROADMAP.md D83-D86.

## Directive

The maintainer raised a fork-and-merge idea: take Luau's type system and merge
it into svsw3D's Lua 5.4 runtime, so editor scripts (and possibly mod scripts)
get real static typing without leaving Lua. This document assesses that idea
against the actual Luau codebase and lays out the alternatives.

## Fork-and-merge assessment

The proposal is not viable as scoped. Luau is not a Lua fork that drifted from
5.1 over time; it is a from-scratch second implementation that happens to
share Lua 5.1's surface semantics as a starting point. The project's own
description: Luau's runtime is "a very heavily modified version of Lua 5.1
runtime, with completely rewritten interpreter" (https://github.com/luau-lang/luau).
Roughly 120k lines of code, about 85% C++ (C++11 for the VM, C++17 for the
compiler and analysis layer), against Lua 5.4's plain C. There is no shared
code lineage to merge back in; a "merge" would mean building a second
language implementation from scratch and keeping it in permanent sync with
two moving upstreams.

Working through the reconciliation surface layer by layer:

**Number model.** Luau uses a single 64-bit double for every number, by
deliberate and repeatedly reaffirmed design; Lua 5.4 has the dual
integer/float subtype. Reconciling the two touches arithmetic opcodes,
`%d`/`%g` formatting, table-key normalization, and every bit function. The
Luau community proposed exactly this backport in issue #217 and discussion
#242 ("Native Integers (5.3 backport)"); neither shows any record of
acceptance (https://github.com/luau-lang/luau/issues/217,
https://github.com/luau-lang/luau/discussions/242,
https://rfcs.luau.org/type-long-integer.html). This is not a cosmetic
mismatch for svsw3D specifically: integer arithmetic and float arithmetic
produce different sim results, so editor scripts and mod scripts running
under different number models is a determinism hazard, not a style
preference.

**Grammar.** Luau's parser has no goto/labels, no native bitwise operators
(a `bit32` library stands in for them instead), and no `<const>`/`<close>`
attributes; each gap needs grammar, bytecode, and — for `<close>` — lifetime
rules added to the type lattice before it can accept 5.4 source
(https://luau.org/compatibility/).

**Stdlib and sandbox.** Luau strips `io`, `package`, most of `debug`, and
most of `os` for sandboxing purposes (https://luau.org/sandbox/). Restoring
5.4's stdlib to make the grammar work undoes the sandbox guarantees that are
half the reason Luau looks attractive in the first place.

**GC and C API.** No `__gc` finalizers (a deliberate sandbox-motivated
omission); the C API is 5.1-era with caveats; source must pass through
`luau_compile` rather than load directly.

**Two upstreams forever.** Luau ships weekly releases from Roblox's internal
repository under its own RFC gate (https://github.com/luau-lang/luau/releases);
Lua upstream has moved on to 5.5. A merged mirror would rebase a from-scratch
reimplementation against two moving upstreams indefinitely, where one
upstream's maintainers are on record — in their compatibility docs and in the
rejected integer-backport proposal — as opposed to the very features the
merge would add.

**Prior art.** Targeted search found no maintained "5.4-compatible Luau" or
"Luau types on 5.4" project. `mlua` treats Luau and 5.4 as separate,
non-merged backends (https://github.com/mlua-rs/mlua). The absence is
structural, not an oversight nobody got around to.

Even the narrowest version of the idea — reuse `luau-analyze` as a
typechecker over 5.4 source, since Analysis is roughly 60% of the Luau
codebase and is architecturally decoupled from the VM
(https://news.ycombinator.com/item?id=45290619) — fails at the front door.
The Luau parser rejects valid 5.4 syntax: goto, native bitwise operators, and
the `<const>`/`<close>` attribute forms. It cannot parse 5.4 code without a
frontend fork, which is fork-and-merge again at smaller scale.

Honest estimate: taking this on is a permanent language-maintenance
obligation, attached to a team whose product is an engine, bought for
capabilities the options below deliver more cheaply.

## Options

| Option | Verdict |
|---|---|
| LuaLS + LuaCATS annotations, `svsw.*` definitions generated from the binding registry | **Recommended (baseline)** |
| Teal (`tl` + Cyan) compiled to Lua 5.4, opt-in authoring dialect | **Close second** (layer on top of the baseline, not a replacement) |
| Dual-runtime: Luau VM for the editor tier, Lua 5.4 for mods | Reject for v1; keep as the documented escalation path |
| Luau-only runtime swap, replacing Lua 5.4 everywhere | Reject now — this is the logged close-second with revisit triggers, not a silent flip |
| TypeScriptToLua with generated `svsw.*` TypeScript definitions | Viable but niche; not the engine's answer |
| `luau-analyze` reused as a typechecker over 5.4-targeted code | Infeasible — verified dead end |
| Pallene companion language | Reject — wrong tool for this boundary |

**LuaLS + LuaCATS.** Pure static analysis over stock, unmodified Lua 5.4:
zero runtime risk, zero conflict with the decision log. LuaLS is the
healthiest tool in the space — v3.18.2 (April 2026), 4.3k stars, roughly one
million VS Code installs (https://github.com/LuaLS/lua-language-server). The
definition-file-generation pattern is proven at engine scale: Defold
regenerates LuaLS annotations from its API docs on a schedule
(https://github.com/astrochili/defold-annotations); Factorio's ecosystem
generates EmmyLua-style annotations from the official API docs
(https://lua-api.factorio.com/latest/). svsw3D is better positioned than
either, because bindings are already registered in Odin: a generator can
emit `.d.lua` definitions for `svsw.data`/`svsw.storage`/`svsw.ui` and the S24
editor-capability surface straight from the registry, with a drift gate in
`just check` shaped like the existing api-coverage gate. One mechanism covers
editor scripts and mod scripts. State the limitation plainly: annotations are
advisory-by-default typing, weaker than a checked language — enforcement is a
CI-gate policy choice, not a language guarantee.

**Teal.** The only actively maintained typed dialect that erases to plain
Lua and claims 5.1-5.4 compatibility (v0.24.8, October 2025,
https://github.com/teal-language/tl), with real engine adopters: OpenMW
ships official Teal declaration files
(https://openmw.readthedocs.io/en/latest/reference/lua-scripting/teal.html);
Defold is building first-class support
(https://defold.com/2025/09/11/Towards-First-Class-Teal-Support/). It gives
records, unions, generics, and interfaces — actual compile-time checking,
which annotations cannot do. Costs: a compile step in the editor script IDE
and the mod pipeline (S15 packaging would need to learn `.tl` sources or
pre-compiled output); `.d.tl` declaration files for `svsw.*` generated from
the same binding registry, so the generator grows a second emitter; Cyan's
`gen_target` config only documents 5.1 and 5.3 as generation targets, so 5.4
output needs spot-checking before it is trusted
(https://github.com/teal-language/cyan/blob/main/docs/tlconfig.md); LSP
maturity lags LuaLS — OpenMW's own docs call Teal's language server
work-in-progress. Both Defold's current limitation (the transpiler doesn't
yet see the native API surface) and OpenMW's setup friction point the same
way: build the definition-file generator first, then layer Teal on top, not
instead.

**Dual-runtime.** Technically feasible — Luau's sandbox primitives
(`safeenv`, `luaL_sandboxthread`, call-depth limits, interrupts,
https://luau.org/sandbox/) suit a privileged tier, and non-Roblox adopters
(Alan Wake 2/Northlight, Warframe, FS25, Second Life SLua) prove Luau
embeds outside Roblox. But it directly contradicts D60, which defines the
editor scripting host as "an expanded capability tier of the mod-sandbox
VM" — one VM, one capability model. Dual-runtime means two vendored VMs (one
C, one C++, pulling a new toolchain into the D64 C tier), two binding layers,
two sandbox models to audit, and, worst, editor scripts and mod scripts with
different number semantics, so a snippet cannot move between tiers without a
semantics review. The entire point of D60's shared-VM design is that it can.

**Luau-only swap.** The prior scripting-language comparison already chose
Lua 5.4 with typed-authoring add-ons and named Luau the close second with
named revisit triggers. Swapping now, without one of those triggers firing,
reopens a logged decision on no new evidence — a maintainer call, not an
agent call. Adopting Luau is a package deal: its sandbox model, its
`__gc`-less userdata lifecycle, its double-only numbers, its stripped
stdlib, its bytecode-compile embedding — not a drop-in VM swap. Every
existing S14-targeted binding, the base-as-mod code, and any 5.4 syntax in
samples would need migration. If the maintainer's desire for typed scripts
is strong enough to reopen the decision, this is the coherent way to get
Luau's type system — typechecker and runtime designed together, strict and
nonstrict pragmas, the New Type Solver that reached general release in
November 2025
(https://devforum.roblox.com/t/general-release-luau%E2%80%99s-new-type-solver/4084991)
— not the fork.

**TypeScriptToLua.** `tstl` supports `luaTarget: "5.4"` explicitly
(https://typescripttolua.github.io/docs/getting-started/), and
typed-factorio proves the typed-modding-API pattern at scale
(https://github.com/GlassBricks/typed-factorio) — but that flagship
precedent targets Factorio's Lua 5.2, so 5.4 output is unproven by it. Costs:
a Node/npm toolchain in an Odin/C monorepo, a foreign authoring language for
a Lua-first modding story, debugging through generated code. Reasonable as a
community option — nothing stops a mod author from using it against
published definitions, and the binding-registry generator could emit `.d.ts`
as a third target someday — wrong as the engine's own editor-script answer.

**`luau-analyze` reuse.** The one architecturally plausible slice of the
fork idea, since Analysis is decoupled from the VM and optional at runtime,
but the parser only accepts Luau grammar: no goto/labels, no native bitwise
operators, no `<const>`/`<close>` (https://luau.org/compatibility/). Any 5.4
code using those constructs fails to parse. The type lattice also has no
integer/float distinction to check 5.4's dual number subtype against.
Making it work needs the frontend fork the main assessment rejects, and its
strict/nonstrict modes and builtin-table assumptions are tuned to Luau's
stdlib, not 5.4's.

**Pallene.** Requires a patched Lua build
(`pallene-lang/lua-internals`) — stock 5.4 will not work — has no numbered
releases, and is explicitly research-stage
(https://github.com/pallene-lang/pallene). It targets fast compiled
extension modules, not typed scripting, and svsw3D's hot path is Odin, so
even that niche is already filled. No role in either editor or mod
scripting.

## Recommendation

Primary: LuaLS + LuaCATS, with `svsw.*` definition files generated from the
engine's binding registry, wired into the S22 script IDE as its LSP and
gated for drift in `just check`. This is the "typed-authoring add-ons"
clause of the already-logged Lua 5.4 decision, made concrete, and it covers
editor scripts and mod scripts in one mechanism with zero runtime change.

Close second: Teal as an opt-in authoring dialect for editor scripts (and
willing mod authors), added after the definition-file generator exists,
since it needs `.d.tl` output from the same generator, and contingent on
validating Cyan's actual 5.4 codegen.

Decline the fork-and-merge proposal on the record, for the reasons in the
assessment above. A full Luau runtime swap remains what the decision log
already says it is — the close second, to be reopened only by its named
revisit triggers, and if reopened, done as a swap, never as a fork-merge.

## Relationship to scripting-language-comparison.md

This directive does not reopen `scripting-language-comparison.md`. That
document already chose Lua 5.4 with typed-authoring add-ons and named Luau
the close second, with revisit triggers attached rather than an open door.
Everything in this document is downstream of that choice: the recommended
path (LuaLS + LuaCATS, with Teal as a layer) is the concrete form of the
"typed-authoring add-ons" clause that decision already promised, not a new
decision. The two paths this document rejects — fork-and-merge and a silent
Luau swap — are rejected specifically because they would reopen
`scripting-language-comparison.md`'s conclusion without one of its named
triggers firing. If the maintainer wants to fire a trigger, that is a
reopen of `scripting-language-comparison.md` itself, handled as option 4
above (a full swap), not folded into this typed-scripts thread.

## Decisions and specs each path amends

- **LuaLS + LuaCATS (primary):** adds scope to S24 (typed-authoring surface)
  and resolves S22's open script-IDE question toward LuaLS as its LSP. No
  runtime decision changes. Adds one new small tooling task: the
  binding-registry definition generator plus its drift gate.
- **Teal (close second):** amends S24 (editor scripts may be authored in
  Teal) and S15 only if it lands (mod pipeline accepts compiled output).
  D59/S20 unchanged at runtime.
- **Dual-runtime:** reopens D60, amends S14 (a second embedding), rewrites
  S24, and pulls C++ into the D64 C interface tier.
- **Luau-only swap:** reopens the scripting decision itself, and amends S14,
  S15, S20, D59, D60, and D64 (a C++ dependency enters the tier).
- **TypeScriptToLua:** no engine spec amendment; a community-tooling note at
  most, since it is not adopted as the engine's own path.
- **`luau-analyze` reuse / Pallene:** no amendment; both are declined.

## Grilling questions

1. **Do editor scripts and mod scripts stay one language on one VM, or does
   typing pressure split them?** Recommendation: one VM, one language (Lua
   5.4) for both tiers; typing comes from static tooling, not a second
   runtime. The capability tier stays a permission difference, not a
   semantics difference — the moment editor and mod scripts have different
   number models or grammar, snippets stop moving between tiers and D60's
   design premise breaks.
   - Same 5.4 VM both tiers, typing via LuaLS/Teal tooling (recommended)
   - Dual-runtime: Luau for the editor tier, 5.4 for mods
   - Luau everywhere via a full runtime swap (reopens the logged scripting
     decision on its revisit triggers)

2. **What is the baseline typing technology for `svsw.*` scripts?**
   Recommendation: LuaCATS definition files generated from the engine
   binding registry, consumed by lua-language-server in the S22 script IDE.
   Teal is the escalation if annotations prove too weak, reusing the same
   generator.
   - LuaLS + generated LuaCATS definitions (recommended baseline)
   - Teal dialect with generated `.d.tl` declarations, compile step in the
     IDE and S15 pipeline (close second / later layer)
   - TypeScriptToLua + generated `.d.ts` (community option only)
   - Decline typing beyond what the IDE gives for free (rejects the
     directive)

3. **Are the `svsw.*` definition files hand-maintained or generated, and
   does drift block the gate?** Recommendation: generated from the binding
   registry with a drift check inside `just check`, shaped like the
   api-coverage gate. Hand-maintained definitions rot; Defold and Factorio
   both converged on generation from the API source of truth for exactly
   this reason.
   - Generated + gated drift check (recommended)
   - Generated but ungated (regenerate on release)
   - Hand-maintained community-style definitions repo

4. **Is typing enforced or advisory, and for whom?** Recommendation:
   advisory for third-party mods — never reject a mod for a type error, the
   sandbox is the safety boundary, not the typechecker — but gate-enforced
   for first-party code: base-as-mod, samples, and editor scripts shipped
   with the engine must pass the checker in `just check`.
   - Advisory for mods, enforced for first-party/editor scripts
     (recommended)
   - Fully advisory everywhere (types decay into decoration)
   - Enforced for anything the editor IDE saves (blocks-on-error UX)
   - Enforced for all loaded mods (hostile to the modding story)

Decision pending the maintainer's grilling session.
