# S14 — Luau sandbox port: the scripting boundary, test-first

Normative text for S14. The [spec index](README.md) records this spec's
rung and nothing else duplicates it (D37).

- **Stage:** 2 — World structure + assets
- **Status:** spec written
- **Depends on:** S01, S02a, S02b
- **Decisions:** [D3](../decisions/D003-opt-in-bindings.md),
  [D12](../decisions/D012-mod-machinery-port.md),
  [D14](../decisions/D014-c-interface-tier.md),
  [D33](../decisions/D033-luau-runtime-adoption.md),
  [D34](../decisions/D034-script-typing-policy.md),
  [D35](../decisions/D035-f64-number-semantics.md),
  [D46](../decisions/D046-luau-deterministic-sim-surface.md),
  [D50](../decisions/D050-mod-trust-model.md)
- **Normative references:** none

## Goal

Stand up the scripting boundary on Luau: one sandboxed VM per mod, a
`svsw.*` surface assembled through the D3 registrar seam, three enforced
limits, and one error path that ends in a disabled mod and a healthy
engine. The internal prototype's hardened Lua embedding supplies the
patterns, not the code (D33, D38): sandbox construction, the allocation
cap, the shared instruction budget, the C-API boundary discipline, the
two-pass validate-then-build schema parse, and the two-tier entity views
all carry as shapes, while every Lua 5.4 mechanism underneath them is
re-derived against Luau's own primitives.

This is the first spec that builds a declared security boundary.
[SECURITY.md](../../SECURITY.md) accepts sandbox-escape reports, D43
names the mod sandbox the only boundary this project declares, and D50
settles what it defends against: hostile mod source, not merely buggy
source. The enumeration lives in
[`docs/design/threat-model.md`](../design/threat-model.md), which names
S14 as the gate for four of its six defended threats. The obligation
running through this document follows from that: every mechanism named
here ends behind a gate that runs in `just check`, and a mechanism whose
gate is review is called out as such rather than counted as enforcement.

The mod-facing contract this spec implements is written down already, in
[`docs/LUAU_STYLE.md`](../LUAU_STYLE.md). That standard binds script
authors; this spec builds the engine side that makes each of its rules
true rather than merely asked for, and each section below names the rule
it operationalizes.

## Working software

A sandboxed Luau sample runs headless N ticks and reproduces a committed
world-hash golden. The sample exercises the D46 replaced math surface and
the ordered-iteration idiom, and its one committed hash verifies on both
CI platforms, which is the cross-platform leg D46 requires of this
spec's gate. Sandbox containment, disable-in-place, and
budget-enforcement tests are green in `just check` on both platforms.

Three gates land beside those tests and are part of the same definition
of done: the registry-driven binding fuzz gate, running report-only here
(D50); the `.d.luau` drift gate, which blocks (D34); and the advisory
load-time scan, which reports and never blocks a mod load (D34, and the
#87 ruling below).

Green here means the boundary holds against the corpus that exists at
S14. It does not mean multiple mods share a world, which is S15's claim,
and no acceptance wording in this spec may imply otherwise.

## Decisions in force here

The row's `Decisions` field names eight. Eight more bind clauses of this
spec, and each is cited where it decides something below.

- **D33, Luau runtime adoption.** The reason the port is an adaptation.
  Luau's C API stays 5.1-era-compatible, so the patterns carry; its GC,
  its stdlib, its number model and its implementation language differ,
  so the mechanisms do not.
- **D50, the mod trust model.** Hostile input, three limits, verified
  interrupt behavior, and the registry-driven fuzz gate report-only
  here and hard in S21's roster.
- **D3, opt-in binding packages.** One locked registrar seam. It is what
  makes the v1 surface a floor that later specs raise rather than a
  ceiling they have to renegotiate, and it is the enumeration both the
  fuzz gate and the declaration generator walk.
- **D34, script typing policy.** `--!strict` gate-enforced for
  first-party scripts, advisory for third-party mods, and the `.d.luau`
  declaration surface generated from the binding registry with a drift
  gate in `just check`.
- **D35, number semantics.** Entity IDs and chunk coordinates cross as
  opaque typed handles; ticks and quantities stay plain numbers inside
  the 2^53 envelope with debug-build integrality guards at the boundary.
  S02a held this boundary by the absence of any script surface; S14 is
  where it becomes a mechanism.
- **D46, the deterministic sim surface.** Replaced transcendentals,
  simrng-backed randomness, ordered iteration, the allow-list and
  ban-list rationale record, and the cross-platform hash leg.
- **D12, mod machinery ports as-is.** Per-mod VM containment is the
  clause that lands here; manifests, dependency resolution and schema
  mirroring land with S15.
- **D14, the C interface tier.** Luau's C API and its C++ implementation
  enter through the vendored tier, reachable only from the platform tier
  and `engine/render3d/gpu`. The binding packages are pure Odin above
  that boundary, and tier-scan polices it.
- **D1, determinism by construction.** No wall clock reachable from sim
  code, engine-seeded RNG, ordered iteration. B1's removal of `os` is
  what makes the first of those true of scripts rather than asked of
  them.
- **D2, layering.** Script code never names engine internals, the
  platform, or the network. The whitelist is how that is enforced by
  construction rather than by review.
- **D10, editor Luau, as amended by D43.** The editor scripting host
  shares this VM architecture at an expanded capability tier. S14 builds
  the base that tier is specified as a diff against, so the two cannot
  part silently (B2).
- **D43, the editor tier.** The mod sandbox is the only declared
  security boundary; a Session never loads an Extension; and D43's
  finding that Odin's `proc "c"` convention makes the default context
  yield the default heap allocator rather than the engine's is a
  determinism bypass this spec's boundary rules exist to close.
- **D26, org and repositories.** The `svsw.*` namespace is final. No
  name in the v1 surface below is provisional.
- **D49, editor message kinds.** The reserved editor-and-tooling
  message-kind range is where `svsw.log` records travel once a transport
  exists. S14 ships no transport.
- **D58, fast-path-first extensibility.** Two of this spec's deferrals
  are recorded as close seconds with named triggers rather than as
  refusals, because D58 makes growing the `svsw.*` surface the default
  answer to a modding need.
- **D60, in-Session script reload.** Reload is S22b's. What binds here
  is L2's consequence for authors from the first mod written: a
  control-stage load must survive being re-run.

D38 governs the whole port. The internal prototype is a source to read
test-first, never a target to converge with: no gate equivalence, no old
goldens, and every constant that encodes the prototype's own behavior is
re-derived.

## Scope in

### The boundary

- A Luau VM host per mod, built on Luau's own sandbox primitives:
  `safeenv`, `luaL_sandboxthread`, call-depth limits, and the
  instruction interrupt.
- The whitelist-by-omission surface, with a per-entry allow-list and
  ban-list rationale record in the shape S02b uses (D46).
- The three enforced limits: a per-VM allocation cap, a shared-pool
  instruction budget, and a wall-clock watchdog (D50).
- One containment path: set-error then disable-in-place, so a mod can
  never crash the engine.
- The C-API boundary rules, re-derived against Luau and carried as a
  standing review rule in [`docs/ODIN_STYLE.md`](../ODIN_STYLE.md) and
  the review checklists, with R5's `LUAU_EXTERN_C` and
  `LUA_USE_LONGJMP=1` pins recorded in `docs/VENDOR.md` and held by the
  cross-boundary error conformance test.

### The surface

- The v1 `svsw.*` core sim set (#78), namespace by namespace below.
- The D46 deterministic sim surface: engine-provided transcendentals,
  simrng-backed randomness in place of `math.random`, and ordered
  iteration for sim-writing table walks.
- The schema two-pass validate-then-build parse and the two-tier entity
  views, carried as patterns.
- Atomic persistence for `svsw.storage`.
- The D35 opaque-handle representation and the debug-build integrality
  guards at the boundary.
- `svsw.log`'s structured record, per-mod buffered with attribution, and
  a pluggable sink with the headless CLI sink shipping here (#75).

### Typing, declarations and gates

- `--!strict` gate-enforced for base-as-mod and samples, nonstrict and
  advisory for third-party mods, the sandbox remaining the safety
  boundary either way (D34).
- The `.d.luau` declaration generator over the binding registry, plus
  its drift gate inside `just check` (D34).
- The registry-driven binding fuzz gate, report-only here and hard in
  S21's roster (D50).
- The advisory linter-shaped load-time scan (#87).
- The hash-golden Luau sample and its cross-platform leg (D46).

### Tooling

The `lua-binding` skill and the `binding-dev` agent's gate-availability
re-verification ship here, per the tooling design record at
[`docs/plans/claude-tooling-design.md`](../plans/claude-tooling-design.md).

## Scope out

- The multi-mod pipeline: manifests, Kahn dependency resolution, the
  settings-to-data-to-control load pipeline, first-declarant schema
  mirroring, and the mirroring test. S15 owns all of it, and the
  `svsw.data` and `svsw.setting` surfaces come with it.
- UI bindings (S20), the editor capability tier (S24), and script or
  native debugging (S24b).
- The log transport and the editor Console. S14 owns the record; S22
  owns the pipe (#75).
- Luau native codegen, deferred with a named trigger (#74).
- A deterministic tick-scheduler or wait idiom for mod coroutines,
  deferred with a named trigger (#79).
- In-Session script reload, which S22b owns (D60).
- The internal prototype's 2D tilemap surface, which does not carry
  (#78).
- Editing `docs/research/`, a closed corpus.

## The boundary architecture

### One VM host per mod

Each mod gets its own Luau VM host (D12, D50). The host owns the state,
the sandboxed global table, the allocation accounting, the budget pool,
the watchdog deadline, the disabled flag and the last error report. Two
mods share no mutable Lua state at all, which is what makes S2's rule
about shared singletons a determinism statement rather than a taste one.

The host is recoverable from any Lua state without a global: the state
carries a back-pointer to its owning host, and every Lua-to-Odin entry
point resolves the host through it. That resolution is the public half
of the D3 seam, because an opt-in binding package living in its own
package reaches the host exactly the way the core does. A binding that
needs a global to find its host is a binding that cannot be registered
opt-in, so this is a structural requirement rather than a convenience.

The host is off-hash and never snapshotted. S02a ported the pattern of
an off-hash, never-snapshotted opaque pointer on the World and
deliberately left its semantics unwritten; this spec is what fills it,
and the completeness-reflection test S02a landed is what fails if the
pointer is ever misclassified.

### Whitelist by omission

The mod surface is built by opening a named set of libraries and
installing `svsw.*` on top, never by opening everything and blocking
calls afterwards. B1 states the consequence for authors: there is no
debugging exception, because the barred globals are absent rather than
guarded.

Three properties of the construction are load-bearing and are each
proven by the conformance suite rather than asserted here.

1. **The strip list is re-derived, not copied.** Luau's base library is
   not stock Lua 5.4's: some of what the prototype had to remove is
   already absent, some survives under a different name, and Luau adds
   surface of its own. Every entry in the resulting allow-list and
   ban-list carries a recorded rationale (D46), and the record lives in
   a committed artifact under `docs/` per D30 so the record and the
   mechanism cannot drift apart the way the threat model exists to stop
   SECURITY.md drifting.
2. **`getfenv` and `setfenv` are absent (#87).** They are ordinary base
   entries with no built-in sandboxing, and their presence would widen
   every static analysis gap in the load-time scan described below.
   Their absence is a whitelist decision, so it is enforced by
   construction under B1 rather than by a check.
3. **In-place removal beats shadowing.** Where a dangerous entry hangs
   off a shared table reachable by a second route, the removal happens
   on the real table so the second route is severed with it. One state
   per mod is what makes in-place mutation safe, and the conformance
   suite proves each barred name unreachable by every route it knows,
   not merely by its own name.

`os` is absent, which is what makes D1's "no wall clock reachable from
sim code" true of scripts. `io`, `debug` and `package` are absent, which
is what makes D2's "script code never names the platform or the network"
true by construction.

### The three enforced limits

B3's three limits are D50's v1 scope, and each has a different failure
mode, so the spec names all three rather than treating the budget as the
general answer.

**The allocation cap** is enforced in the VM's own allocator. The host
accounts every allocation and refuses growth past the cap. Refusal is
not a raise: the allocator must never raise, which is the trivial case
of the boundary rules below. A refused growth gives the VM its chance to
collect and retry before the memory error surfaces, and the memory error
travels the same containment path as any other script error.

**The instruction budget** is a shared pool drained by Luau's interrupt.
The budget lives in the VM callbacks' userdata and never in per-thread
userdata, which is the settled posture and the mechanical reason it
cannot be evaded: the interrupt is per-VM, so every coroutine in a VM is
subject to one callback and one pool (verified against Luau upstream,
issue #38). The pool is armed from one helper at every site that runs
mod code, so the accounting cannot drift between call sites.

**The budget's value is an engine constant for the engine era**
(maintainer micro-ruling at landing, 2026-07-31). Not a per-mod manifest
field and not a project setting: H4 makes the budget observable in sim
behavior, because crossing it disables a mod and a disabled mod moves the
world hash, so a per-mod or per-project value would make the hash a
function of configuration this spec's goldens do not record. **The
goldens are recorded against the constant**, and moving it is a
determinism change triaged like any other. The named reopen is S15's
manifest grilling, which is where a per-mod field would have to earn its
place against the hash cost; nothing before it reopens the question.

**The wall-clock watchdog** closes the hole the budget structurally
cannot: time spent inside one C call, where the instruction hook does
not fire. D50 names pattern-matching backtracking as the case, and B3
tells authors not to build one. The watchdog is the engine's one
deliberately wall-clock mechanism, and H3 records the consequence for
sim-writing scripts: code close enough to trip it on a slow machine and
not a fast one diverges the two CI legs by being disabled on one of
them.

Budget exhaustion latches. It does not reset when a protected call
returns, because an interrupt-raised error is catchable by the mod's own
protected call, so a mod that wraps its hot loop could otherwise swallow
its own exhaustion and continue. Two mechanisms make the latch hold: on
drain the interrupt re-arms so tightly that no meaningful progress
happens after it, and the host re-checks the latched flag after every
protected call it makes into mod code and disables the mod when it finds
the flag set. Neither alone is sufficient, and the conformance suite
proves both by driving a mod that catches its own exhaustion.

While the pool has budget, the interrupt only bookkeeps. It has no
observable effect on the mod program, which is what keeps the limits out
of the hash: the cap is a denial-of-service backstop that never fires on
legitimate content. When it does fire, the mod is disabled, and H4
records what that means for determinism: a disabled mod changes sim
behavior and therefore the world hash, so a control-stage hot-loop edit
is a determinism change and goes through determinism review.

### The error funnel and containment

Every error in mod code, wherever it comes from, arrives at one place:
record the report on the host, then disable the mod in place. Disabling
does not unregister anything. The mod's systems and callbacks go quiet,
its registrations stay so that nothing downstream re-indexes, and the
engine keeps running. That is the containment outcome E1 tells authors
to write for and the one the threat model promises.

The funnel has four inlets and one outlet:

| Inlet | What raises | Where it is caught |
|---|---|---|
| A script error inside mod code | the mod, or a binding rejecting its argument | the engine's protected call around every entry into mod code |
| Budget exhaustion | the interrupt, latched | the same protected call, plus the post-call latch re-check |
| Allocation-cap breach | the VM's memory error | the same protected call |
| Watchdog expiry | the watchdog | the same protected call |

Every engine-to-script call is protected and carries a message handler
that runs at the error point, before unwinding, so the traceback names
the failing frames rather than the recovery frame. An unprotected error
escaping to the VM's panic path is an engine bug, not a mod bug, and it
is logged as one.

Two reporting rules ride along, both ported. A containment report logs
at warning level, because a contained mod failure means the engine is
healthy and error level is reserved for engine defects. And the report
is extracted without invoking a mod-supplied conversion on the error
object, because the error object is attacker-controlled and converting
it is a second chance to run mod code on the failure path.

### The C-API boundary rules

The internal prototype's R1 through R5 are the discipline that keeps a
script error from corrupting engine state as it propagates. They port as
a numbered standing review rule in `docs/ODIN_STYLE.md` (per the row's
Scope in), and their content is re-verified against Luau's C API rather
than restated. Four re-derive cleanly:

- **R1.** The engine enters script code only through a protected call.
  An unprotected call has no recovery point, so a raised error reaches
  the panic path and aborts the process.
- **R2.** Any Odin `proc "c"` that Luau can call is transparent to
  error propagation at every point where it calls an API that can
  raise: no pending deferred cleanup, no live unreleased resource.
  The shape is validate first, do the raising work early, allocate
  after the last raise point, and raise as the final action.
- **R3.** Where cleanup across a raising region is genuinely
  unavoidable, split the callback: an inner function does the risky
  work under the engine's own protected call, and the outer frame runs
  its cleanup on either result.
- **R4.** `context` is unavailable inside `proc "c"`, so every
  script-to-engine entry point reconstructs it explicitly from the
  host's captured engine context and never from the language's default.
  This is D43's finding stated as a rule: the default context yields the
  default heap allocator rather than the engine's, and the
  allocator-identity assertions S02a's allocator model commits to are
  what catch a violation. This rule was widened at S00 from script VM
  callbacks to every `proc "c"` callback in the tree.

**R5 does not port as written, and this is the sharpest Lua-to-Luau
break in the spec.** R5 said the runtime stays compiled as C so that a
script error propagates as a `longjmp`, and gave the reason: compiling
it as C++ would make errors C++ exceptions attempting to unwind Odin
frames that carry no unwind tables. Luau's implementation is C++ by
construction (D33, D14 as amended, and S01's roster builds it as C++
inside `vendor-libs`), so the premise R5 rested on is gone.

**What replaces it is a verified fact, not an obligation.** The
vendored runtime's error-propagation mode was read out of upstream
source at `luau-lang/luau` commit `f8ca77a`, and a maintainer
micro-ruling at landing (2026-07-31) records the finding here as
settled. Five parts:

- **The longjmp mode still exists.** `LUA_USE_LONGJMP`
  (`VM/include/luaconf.h`, lines 65 to 67) selects between C++ throw and
  `setjmp`/`longjmp` propagation, defaulting to 0, and the selection is
  implemented through the `LUAU_SETJMP` and `LUAU_LONGJMP` macros in
  `VM/src/ldo.cpp` (lines 33 to 76). The C++ implementation language and
  the error-propagation mechanism are separate choices, which is the
  fact R5's original reasoning could not have known.
- **Upstream's own build already pairs the two flags svsw needs.**
  `CMakeLists.txt` (lines 194 to 197) sets `LUAU_EXTERN_C` together with
  `LUA_USE_LONGJMP=1`. That pairing is exactly svsw's embedding shape, a
  C-compatible boundary reached from a non-C++ host, so **svsw pins that
  configuration** rather than inventing one.
- **Nothing unwinds that needs to.** At the pinned commit the VM has no
  RAII destructors on the throw paths a protected call takes, verified
  by inspection of those paths rather than promised by an upstream
  compatibility contract. That distinction is why the conformance test
  below is load-bearing rather than ceremonial.
- **The Compiler is a separate case and a safe one.** It uses exceptions
  internally in both modes, and it throws none of them across its public
  boundary, so compiling a chunk never propagates an exception into an
  Odin frame whatever `LUA_USE_LONGJMP` says.
- **The interrupt and its latch are mode-agnostic.** `VM_INTERRUPT` sets
  a status flag and returns rather than calling `luaD_throw`, so the
  budget machinery this spec builds behaves identically under either
  mode. The one exception is an interrupt hook that itself calls
  `lua_error`, which is mode-sensitive exactly like any other error and
  is governed by R1 rather than by anything special.

One new fact sharpens R1 rather than R5. **The two modes are asymmetric
for unprotected calls.** Under longjmp mode an error with no recovery
point reaches the panic path and aborts deterministically; under
exception mode the same error becomes an uncaught C++ exception, which
is uncontrolled termination through whatever the host runtime happens to
do. Both are fatal, and only one is diagnosable. That asymmetry is the
strongest argument in this document for R1's rule that the engine enters
script code only through a protected call: the pin makes the failure
mode legible, and R1 is what keeps the engine out of it.

Two obligations survive the verification and are recorded as
obligations, because the fact above is true of a configuration rather
than of Luau:

1. **The vendored build configuration pins `LUAU_EXTERN_C` and
   `LUA_USE_LONGJMP=1` explicitly.** `LUA_USE_LONGJMP` defaults to 0, so
   a build that inherits the default silently gets exception propagation
   and the verified fact stops holding without a single line changing.
   `docs/VENDOR.md` records build configuration per dependency at
   vendoring time, flags deliberately left at upstream defaults
   included; these two are the opposite of that and are recorded as
   deliberate pins. A vendoring pass that drops them is a regression.
2. **The cross-boundary error conformance test stays load-bearing.** It
   drives an error across an Odin frame and asserts the observed
   behavior, and it is the only gate that would catch a future Luau bump
   reintroducing an RAII destructor on a protected-call throw path. The
   inspection above is a fact about one commit; the test is what makes
   it a fact about every commit after it.

R5's restatement in `docs/ODIN_STYLE.md` records the pinned
configuration and the reason for it rather than the original C-only
wording, and S01's open question on the C++ toolchain and build-flag
baseline is answered from this side for Luau's two flags.

## The v1 `svsw.*` surface

The v1 surface is the core sim set (#78). Everything else enters with
its owning spec through the D3 registrar seam, each extending the fuzz
corpus and the declaration surface in its own commit: collision queries
with S13, audio with S18, `svsw.ui` with S20, skeleton with S25. This is
D58's policy applied to the boundary's own growth, and it is why the v1
surface is deliberately a floor.

### Entity, component and system

Component schema declaration, system registration, and the entity
lifecycle the ECS command buffer already carries: spawn, add, remove,
destroy, plus the death-observer callback. Three mechanisms port as
patterns.

**The schema parse is two-pass, validate then build.** Nothing reaches
component storage until an entire declaration has validated clean. The
field order is deterministic and never derived from table iteration
order: a map-form schema is canonicalized by bytewise name sort, an
array-form schema takes declaration order, and offsets are computed from
the canonical order. This is the same hazard D46 names for `pairs()`,
appearing where it would do the most damage, since a schema laid out in
iteration order would put the divergence inside the byte image
`hash_world` digests.

**Mod-writable sim state is restricted to value-typed keys.** This is
the structural half of the #87 ruling and it is enforced at the
component-schema level rather than at the call site. The section on
iteration determinism below records the evidence and the reasoning.

**Entity views are two-tier.** A durable tier gives one cached view per
referenced entity with value-based identity, and an iteration tier gives
one view per system invocation, mutated in place by the iterator so a
system step allocates nothing per entity. A view that escapes its
invocation raises rather than silently aliasing a different entity.
Handles cross as opaque typed handles under D35, so N1's rule that
identity is never arithmetic holds by the type surface rather than by
convention.

### `svsw.storage`

The per-mod persistent store. Three properties are in scope: the
determinism gate that keeps saved bytes out of the tick, the buffered
write path, and atomic persistence.

Reading the store from inside a system is refused, because storage is
save state rather than sim state and reading it inside the tick would
let persisted bytes reach the hash. Writing from inside a system is
buffered into an ordered buffer applied after the tick, so a write is an
output re-derived on replay and can never move the hash. Persisting is
an atomic disk flush, temporary file then rename as the commit point,
and it returns a status rather than raising, because a failed save must
not disable a mod.

Values crossing into the store are deep-copied, so no live script
reference survives into engine-owned memory, and function, userdata,
thread, cyclic, over-depth, non-finite and over-cap values are rejected
politely as the operating errors they are (E2).

### `svsw.simrng`

The simrng-backed randomness bindings that replace `math.random` (D46,
H1). The replacement is substitution in the whitelist rather than
addition beside it, so the raw function is not reachable to call by
accident. Stream discipline is the kernel's: S02a's port seeds one
stream per system from the registration index, and a script draw goes
against the stream of the system it runs inside. Drawing outside a
system has no stream to draw from and is refused.

### `svsw.log`

The structured log record, described in its own section below.

### The replaced math surface

Not a namespace, but part of the same surface and gated by the same
sample. The whitelist substitutes engine-provided deterministic f64
implementations for the transcendentals Luau delegates to platform libm
(D46, H1). Passing the raw functions through is rejected because a
per-platform divergence inside mod code cannot be debugged from the
engine side, and banning them outright is rejected because gameplay code
would reimplement them worse in Luau. The hash-golden sample exercises
the replacements, which is what makes the cross-platform leg of the gate
meaningful rather than decorative.

The engine-provided implementations themselves are simmath3d's problem,
not this spec's: S02b builds the deterministic `f64` transcendentals and
owns the policed surface and its allow-list. What S14 owns is that the
mod-visible names resolve to those implementations and never to libm.
That is the whole of why this spec's `Depends on` carries S02b, added by
maintainer micro-ruling at landing (2026-07-31): S14 binds against
S02b's surface, and there is nothing else to bind against.

### What is deliberately not here

`svsw.data` and `svsw.setting` are S15's, arriving with the load
pipeline that gives them a stage to run in. The presentation-frame
callback waits for a render path, which S03 builds. The 2D tilemap
surface does not carry at all (#78). Each absence is a floor being held,
not a gap: D3's seam is what makes adding one later a commit in its
owning spec rather than a renegotiation of this one.

## Execution posture

**Interpreter-only for the engine era (#74).** Luau native codegen is
recorded as a close second with a named trigger: a profile-attributed
S09 budget miss on script execution. Nothing in this spec depends on
S09, and the trigger is not a dependency; it is the condition under
which a later, separate decision gets made. Naming it satisfies D58's
requirement that a deferral say what would reopen it, without violating
the index's ground rule against depending on a later spec.

If the trigger fires, codegen enters with its own cross-path determinism
gate rather than as a flag flip. That gate asserts that an interpreted
run and a compiled run of the same scenario produce identical
trajectories, per-tick and not merely at the end, on both CI platforms.
D1 is what makes the gate non-negotiable the moment codegen is enabled,
and carrying the gate's cost is the thing this spec declines to carry
now.

Two correctness questions sit prior to the performance one and are
recorded here so the later decision does not have to rediscover them.
Whether `safeenv` and the interrupt behave identically under codegen is
a sandbox-correctness question, not a speed question. The interrupt
verification on #38 already covers both paths, because the interrupt
lives on the global state rather than on a thread.

## Coroutine posture

Settled, and this spec does not reopen it. The posture is carried
verbatim from the index row, verified against Luau upstream on issue
#38, and audited for citation consistency across all four of its sources
on issue #80:

- Coroutines are permitted within a tick.
- Resuming a coroutine across a tick boundary disables the mod.
- The shared instruction budget lives in the VM callbacks' userdata and
  never in per-thread userdata.
- Budget exhaustion latches rather than resets, because
  interrupt-raised errors are catchable by a mod's own protected call.
- The wall-clock watchdog is unchanged.

The cross-tick rule is a containment rule with a determinism reason
behind it. A suspended coroutine's locals are outside `hash_world`, so a
coroutine that survives a tick boundary is sim-determining state that no
snapshot captures and no golden covers. Sim state that must survive a
tick lives in ECS components. Disabling the mod is the honest outcome
because the alternative, resuming it, silently makes the world hash a
function of state the hash does not include.

**No tick-scheduler or wait idiom in v1 (#79).** It is recorded as a
close second under D58 with a concrete trigger: base-mod work at S15 or
S30 demonstrating a recurring timer or sequence pattern that the
cross-tick posture forces into visibly worse code. If the trigger fires,
the scheduler enters as a scoped addition whose resume order is
determined by content rather than by insertion or address, with its hash
semantics specified before any code is written. Building it now would be
speculative engineering against no named consumer.

One documented inconsistency surfaced while drafting and was fixed at
landing rather than carried. LUAU_STYLE B3 told authors not to assume a
coroutine boundary resets or escapes the budget "in either direction,"
calling the question deliberately unspecified; #38 specified it and this
spec depends on the answer. The clause was stale rather than wrong in
effect, since code written to B3's caution stays correct under the
settled posture, so the fix was a wording reconciliation: B3 now states
that a coroutine boundary neither resets nor escapes the budget, one
shared pool per VM and a latching exhaustion.

## Iteration determinism and the `pairs()` bar

D46 bars pointer-keyed `pairs()` from sim paths and names three
candidate mechanisms without choosing. The research on #76 established
that neither of the two naive mechanisms works as stated, and narrowed
the hazard; #87 chose on that evidence. **The ruling is structural plus
scan, with no VM modification.**

### The evidence base

Two findings from #76 decide the shape, and both are recorded here
because the ruling is not readable without them.

**The sandbox's own fast path bypasses a shadowed iterator.** A
sandboxed thread runs with its own global table and `safeenv` on, which
is exactly the state in which the VM's for-in loop optimization applies.
The compiler recognizes the literal `pairs(x)`, `ipairs(x)` and
`next, x` shapes in a loop header, resolving through one-hop local
aliases as well, and emits specialized preparation opcodes. At runtime
those opcodes do call whatever the name currently resolves to, so a
shadow's body genuinely runs, but when `safeenv` is on and the returned
shape matches the expected one, the VM discards the returned generator
and substitutes its own raw array-then-hash-part walk. A plain
`pairs = my_shim` written into a mod's global table is therefore
silently ignored for the single most common use. Two knobs defeat this
specific bypass, and #87 declined both: the compile option that marks
those names mutable costs the optimization on every third-party for-in
loop rather than only sim-writing ones, and the alternative of shaping
the shim's return values to miss the fast-path trigger pins behavior to
an internal check with no public-API guarantee.

**The hazard is narrower than "`pairs()` walks pointer-keyed tables."**
The VM hashes keys by type. Strings, numbers, booleans and vectors are
all hashed purely by value, so their traversal position is a function of
content and insertion history and nothing else. Only a table, function,
thread, full userdata or light userdata used as a key goes through an
address-based hash. The array part is always ascending and
insertion-order-independent. The one leak path from address-hashed keys
into value-hashed ones is collision resolution in the hash part, which
can relocate an unrelated key when an address-hashed key is inserted.
Net: **a table keyed only by strings, numbers, booleans or vectors is
order-deterministic run to run with no address dependence at all.** The
bar only has to bind on tables that use one of those five types as a
key.

### The mechanism

1. **Structural, and it is the primary bar.** Mod-writable sim state is
   restricted to value-typed keys at the component-schema level. That
   eliminates the pointer-keyed iteration hazard rather than policing
   it, and it holds against a mod that reaches the iterator by any
   route, including the fully dynamic routes no static analysis can
   resolve.
2. **Advisory scan, and it is a steering mechanism.** A linter-shaped
   load-time scan over the mod's syntax tree flags `pairs`, `next` and
   `ipairs` over sim state in nonstrict mods, pointing at the D46
   ordered-iteration idiom. Luau's own linter already contains this
   exact shape of check for other names, so the addition is idiomatic
   rather than novel. It reports and never blocks a load, which is D34's
   advisory tier applied unchanged.
3. **`getfenv` and `setfenv` are absent from the whitelist**, which is
   what keeps the scan's largest false-negative route from being
   trivially available.
4. **No VM modification.** The vendored tree is never hand-edited (D14),
   and a mechanism that required a patch would make every Luau security
   re-vendor a merge exercise, which is exactly what S01's
   out-of-cadence re-vendor obligation cannot afford.

### The residual, stated plainly

The scan has irreducible false negatives: indexed access through a
global table, computed string keys, and any reference threaded through a
table, closure, coroutine or varargs. Luau's analysis has no general
alias analysis, and neither will this scan. That residual is acceptable
here only because the structural bar, not the scan, is what actually
holds: the scan is steering for authors, and its gaps cost a warning
rather than a guarantee. The world-hash goldens and D50's
disable-on-griefing posture remain the backstop, as D46 already said
they would.

H2 is the author-facing statement of all of this, and the sample written
for this spec's golden uses the ordered idiom so the standard's example
and the shipped code agree.

## `svsw.log` records

**The record shape is fixed now; the transport is later (#75).**

`svsw.log` emits a structured record carrying mod identity, level, tick
and message. Records are buffered per mod with attribution intact, which
is the dimension the internal prototype's single-mod-era binding never
had to carry and the reason the shape is settled here rather than
inherited. Sinks are pluggable: the headless CLI sink ships with this
spec, and the editor Console later consumes the same records through the
kinds S26 allocates in the editor-and-tooling message-kind range D49
reserves. **S14 owns the record; S22 owns the pipe.**

Three consequences follow and are in scope here.

- Attribution is structural, not a string convention. The mod identity
  on a record comes from the emitting host, never from an argument, so a
  mod cannot forge another mod's attribution.
- The message is attacker-controlled text. It is length-capped and
  treated as bytes, and no sink may interpret it as a format string.
- The level a containment report logs at is warning, per the funnel
  rules above, and that is distinct from any level a mod may pass.

Worker identity is deliberately not a field. A Session at S14 is one
process, so a worker dimension recorded now would be a guess that D44's
topology and D49's routing could contradict for no gain.

## Typing and the generated declaration surface

D34 splits the tiers and S14 implements both halves.

`--!strict` is gate-enforced for base-as-mod and samples: they fail
`just check` if they do not typecheck clean (T1). Third-party mods stay
nonstrict, their type errors surface as warnings, and no type error ever
blocks a mod load. T1's warning about inverting that asymmetry is the
point: typing is a developer-experience mechanism for code the project
controls, and the sandbox is the sole safety boundary either way.

The `.d.luau` declarations are generated from the binding registry, the
same D3 enumeration the fuzz gate walks, and are never hand-written
(T2). The generator and its drift gate both land here. The drift gate is
shaped like the api-surface snapshot gate S00 built: regenerate,
compare, fail on a difference, and pass after a sanctioned regeneration.
A binding added without regenerating fails the gate, which is what makes
T2's "a wrong declaration means the binding or the generator is wrong"
enforceable rather than aspirational.

The generator is not capability-tiered at S14, because S14 ships one
capability tier. Whether it needs to become tiered, and what else the
generated surface has to carry to serve editor completion and
agent-facing tooling, is recorded as fog below with its owners named.

## The gates

Four gates and one report-only scan. All reach `just check` on both CI
platforms, which is what gives S01's re-vendor obligation its teeth.

### The sandbox conformance suite

The suite that proves the boundary, and the gate the threat model names
for three of its defended threats. It covers, at minimum:

- **Whitelist conformance.** Every barred global is unreachable, by its
  own name and by every alternate route the suite knows: through a
  shared metatable, through a surviving table entry, and through the
  string method syntax. A barred name that becomes reachable is a
  failing test, not a review finding.
- **Containment.** A mod that raises, a mod that raises inside its own
  protected call, a mod that raises from a callback, and a mod that
  raises a non-string error object all end at the same outlet with the
  engine healthy.
- **Disable-in-place.** A disabled mod's systems go quiet, its
  registrations survive, nothing downstream re-indexes, and the engine
  keeps ticking.
- **Budget enforcement.** A runaway loop is disabled. A mod that catches
  its own exhaustion is still disabled, proving both halves of the
  latch. Coroutines drain the same pool, proving the budget cannot be
  multiplied by creating threads.
- **The allocation cap.** A mod that allocates without bound is
  disabled, and the boundary accounts zero bytes outstanding after the
  VM closes.
- **The watchdog.** Time spent inside one C call where the interrupt
  cannot fire ends in a disabled mod.
- **Error propagation across an Odin frame**, the standing R5 gate
  above: the one check that would catch a Luau bump reintroducing RAII
  on a protected-call throw path.

The suite is written test-first and it is the corpus #77's port verdict
depends on: the gates port as-is and are verified against this corpus
before any consolidation is considered.

### The binding fuzz gate

D50's registry-driven adversarial-argument gate. It walks the D3 binding
registry, the same enumeration D34's declaration generator walks, invokes
every registered binding from a sandboxed VM with adversarial arguments,
and asserts the engine survives with at worst a disabled mod.

**Phasing, per D50's own text: report-only at S14, hard in S21's
roster.** Report-only here means it runs, records what it found, and does
not fail the build. Two things follow. The gate's report is read at this
spec's exit rather than filed, and anything it finds is a boundary bug
under E2 rather than a mod-side problem. And a binding registered by a
later spec extends this corpus in its own commit (#78), so the gate's
coverage grows with the registry by construction rather than by anyone
remembering to widen it.

E2 is the author-facing rule this gate mechanizes: script input that
trips an engine assert is a boundary bug, and A8 in `docs/ODIN_STYLE.md`
is the engine-side statement of the same split. Script arguments are
input and are rejected; assertions are for engine invariants.

### The `.d.luau` drift gate

Blocking, from the commit it lands. Described above.

### Hash goldens

The hash-golden Luau sample: a sandboxed mod runs headless N ticks and
reproduces one committed world hash, verified on both CI platforms. The
sample exercises the D46 replaced math surface and the ordered-iteration
idiom, which is what makes the two-platform verification a real test of
the replacement rather than a test that both legs run the same bytecode.

The golden is recorded through S02a's define-driven workflow, not
hand-written, and a moved hash is triaged as regression or sanctioned
re-record before anything is touched.

### The advisory load-time scan

Report-only by design and permanently so, per D34's advisory tier for
nonstrict mods. It is listed here so nobody mistakes it for a gate that
blocks, and so a later reader does not "fix" it into one.

### What S01's drift Action is pointing at

S01 routes a Luau release marked a security advisory to an
out-of-cadence re-vendor whose merge gate is `just check`, "including
S14's sandbox gates once they exist." Those gates are the four above:
the sandbox conformance suite, the fuzz gate report-only, the `.d.luau`
drift gate, and the hash-golden sample with its cross-platform leg. From
this spec's landing, a Luau bump that changes sandbox behavior, changes
the binding surface, or moves the world hash cannot reach the tree
silently.

## Grilling dispositions

Settled on the children of wayfinder map #73, all closed. Each answer
comment on the tracker holds the reasoning; the rows below hold the
ruling.

| # | Disposition |
|---|---|
| #74 | Interpreter-only for the engine era. Native codegen is a close second behind a profile-attributed S09 budget-miss trigger, entering with its own cross-path determinism gate rather than as a flag flip. |
| #75 | `svsw.log` fixes the record shape now and defers the transport: mod identity, level, tick and message, buffered per mod with attribution, pluggable sinks. S14 owns the record; S22 owns the pipe. |
| #76 | Research. Bare environment shadowing of the iterators is bypassed by the sandbox's own for-in fast path; a linter-shaped load-time scan is viable with irreducible dynamic-access gaps; the pointer-keyed hazard is precisely tables keyed by a GC object or light userdata. |
| #77 | Port the scattered permission gates as-is; do not force one primitive during the port. One mechanical consolidation is done inline: the duplicated three-flag control-scope check becomes one shared helper. Two policy calls carried forward. |
| #78 | The v1 surface is the core sim set: entity/component/system, `svsw.storage`, `svsw.simrng`, `svsw.log`. Everything else enters with its owning spec through the D3 seam; the 2D tilemap surface does not carry. |
| #79 | No deterministic tick-scheduler in v1. Close second with a concrete S15 or S30 trigger, entering with content-determined resume order and hash semantics specified before code. |
| #80 | Audit. The coroutine posture is closed and consistent across all four of its sources; this map does not reopen it. |
| #87 | Structural plus scan, no VM modification. `getfenv` and `setfenv` absent from the whitelist; mod-writable sim state restricted to value-typed keys at the component-schema level; a linter-shaped load-time scan advisory over nonstrict mods. Hash goldens and D50's disable posture remain the backstop. |

### The permission gates port as-is (#77)

The internal prototype's is-this-call-allowed-now checks are scattered
by design accident rather than by design: the same three host flags are
tested across dozens of sites in and beyond the binding family, in
different subsets and different senses, because the underlying safety
reason differs per call. The survey found at least four independent axes
under one question: stage, which is expressed structurally as
table membership rather than as a runtime predicate; phase, a handful of
orthogonal host flags; resource attachment, with a documented split
between raising and returning false; and budget state, which is already
unified and is not a boolean gate at all but an armed hook plus a
post-call re-check.

The verdict follows from that heterogeneity. **The gates port as-is**,
verified against this spec's conformance corpus, because a single seam
would have to carry all four axes independently and building it during
the port would change mod-visible behavior in the same change that is
supposed to reproduce the boundary's behavior test-first.

**One consolidation is done inline**, because it is copy-paste
elimination with no behavior change: the three-flag control-scope check
the prototype hand-rolled more than once becomes one shared helper,
visible across packages, alongside the single-purpose structural-reject
helpers that already exist for subsets of it. The call sites that
motivated it in the prototype belong to a surface that does not carry
(#78); the helper is still built here, because the v1 surface's own
sites use the same check and the D3 seam means every later binding
package needs it visible.

The two policy calls the survey named are not settled by any ruling on
this map, and neither is settled by #74 or #78, so both are carried as
open questions below with the prototype-fidelity-versus-hardening trade
they turn on stated.

## Port inventory

What ports is a set of patterns and invariants. Every mechanism
underneath them is re-derived, because Luau's C API, garbage collector,
standard library, number model and implementation language all differ
from stock Lua's (D33), and because D38 makes the prototype a source to
read rather than a target to match.

| Pattern | Carries as | Re-derived because |
|---|---|---|
| Sandbox construction by whitelist and in-place strip | the construction shape and the one-source-of-truth rule for the strip | Luau's base library differs, and `luaL_sandboxthread` plus `safeenv` replace the hand-built environment |
| The VM host and its back-pointer resolution | the host shape, the captured engine context, and the public resolution seam bindings use | one host per mod is D12; the seam's shape is D3's |
| The allocation cap in the VM allocator | byte accounting, refusal rather than raising, collect-and-retry before the memory error | the allocator contract's details are the runtime's own and are re-read, not assumed |
| The count-hook budget with a shared pool | the shared pool, the one arming helper, the latch, and the post-call re-check | Luau's interrupt replaces the count hook, and the pool lives in the callbacks' userdata (#38) |
| One error path: set error, then disable in place | the funnel, the warning-level report, and the no-mod-conversion rule | unchanged in shape; the error objects and traceback API are Luau's |
| R1 through R5 | R1 through R4 as a standing review rule, and R5 as the pinned build configuration that makes the same guarantee | R5's premise is gone, since Luau is C++, but its guarantee survives through `LUA_USE_LONGJMP=1` (see the boundary rules above) |
| The two-pass validate-then-build schema parse | both passes and the canonical field order | the field-kind enumeration changes by construction, so there is no fingerprint continuity and none is wanted |
| Two-tier entity views | the durable and iteration tiers and the escaped-view refusal | handles are opaque typed handles under D35 |
| The permission gates | as-is, plus one helper consolidation (#77) | see the disposition above |
| The `runtime/` stdlib seed | the idea of an engine-authored Luau seed loaded from a compiled-in chunk | re-authored against Luau's stripped globals; the prototype's shims exist to patch Lua-5.4-specific holes |

### The suites, and the triage this spec owes

The prototype's boundary package carries 15 test files and 90 test
procedures; its sibling acceptance package carries 61 test-bearing files
and 267 test procedures. Those counts describe the source, not a target.

Unlike S02a, this spec has no settled per-file port split behind it:
#62 performed that triage for the kernel port, and no child of map #73
performed the equivalent for the script suites. Most of the acceptance
corpus exercises surfaces #78 leaves out of v1, so a large fraction of
those 267 procedures has no subject at S14 at all. **The triage is the
first implementation step**, not a thing this document settles by
assertion, and it is recorded in the implementation order below. Any
ticket that treats the raw counts as a port target is working from a
misreading of this section.

## Obligations on the ported code

The engine side of `docs/LUAU_STYLE.md`. Each rule below is one this
spec makes true rather than asks for, and the mechanism is named so a
reviewer can check the mechanism rather than the intention.

| Rule | What S14 builds |
|---|---|
| B1, mod Luau sees `svsw.*` and nothing else | the whitelist by omission, and the conformance suite proving each barred name unreachable by every known route |
| B2, the mod tier never widens for editor code | the base whitelist that D43 requires the editor tier to be specified as a diff against |
| B3, three limits bound every script | the allocation cap, the shared budget and the watchdog, each with its own gate leg |
| L1, settings then data then control | nothing here; S15 owns the pipeline, and this spec ships the control-stage surface it will run |
| L2, control-stage load survives being re-run | nothing here beyond stating it; S22b owns reload (D60), and authors are bound from the first mod written |
| H1, transcendentals and randomness come from the engine | substitution in the whitelist, so the raw functions are unreachable rather than discouraged |
| H2, walk sim-writing tables in a content-determined order | the value-typed-key restriction at the schema level, the ordered-iteration binding, and the advisory scan |
| H3, nothing that varies between runs reaches sim state | `os` absent, the storage read gate, and the buffered write path |
| H4, a control-stage hot-loop edit is a determinism change | the latch, the disable path, and the hash goldens that report it |
| N1, identity is never arithmetic | opaque typed handles at the boundary (D35) |
| N2, integer-sensitive math stays in Odin | the absence of any script surface that could do it, which S02a established by keeping all four subjects in Odin |
| T1, `--!strict` on first-party scripts | the typecheck gate over base-as-mod and samples |
| T2, declarations are generated | the generator and its drift gate |
| E1, `pcall` at a named boundary | the containment guarantee that makes a disabled mod the outcome authors write for |
| E2, script input tripping an assert is a boundary bug | the fuzz gate, plus A8 discipline in every binding |
| S2, no globals | one sandboxed global table per mod, so a shared mutable singleton is unrepresentable across mods |

Two clauses of `docs/ODIN_STYLE.md` bind this port with unusual force
and are named for the same reason S02a named its own. **A8**, assert
engine invariants and reject input: every argument crossing `svsw.*` is
input, so a binding returns or raises a contained error and never
asserts. **A1**'s density target meets a structural exception at this
boundary, since a `proc "c"` callback cannot assert across a raise point
under R2; the exception is recorded per file with its reason rather than
taken silently, and the S00 carve-out rules apply unchanged.

## Implementation order

Suggested, not binding; `/to-tickets` owns the breakdown.

1. **The suite triage**, before any code: which of the prototype's
   boundary and acceptance procedures have a subject in the v1 surface,
   which are rewrites, and which are obsolete. This is what #62 did for
   S02a and what map #73 did not do for S14.
2. **The R5 pins.** Set `LUAU_EXTERN_C` and `LUA_USE_LONGJMP=1`
   explicitly in the vendored build, record both in `docs/VENDOR.md` as
   deliberate pins rather than inherited defaults, restate R5 in
   `docs/ODIN_STYLE.md` against the pinned configuration, and land the
   cross-boundary error conformance test. This is first among the code
   steps because R2 and R3 describe a mechanism that only holds under
   those pins, and because it closes S01's open question from the other
   side for Luau.
3. **The VM host and the sandbox construction**, with the allow-list and
   ban-list rationale record written as the whitelist is built rather
   than after. Whitelist conformance tests land in the same step.
4. **The three limits**, each with its gate leg: the allocator cap, the
   interrupt-driven shared budget with its latch and post-call re-check,
   and the watchdog.
5. **The error funnel**: protected calls, the message handler, set-error
   and disable-in-place, and the containment tests.
6. **The D3 registrar seam and the core surface**, in dependency order:
   the schema parse, entity views, then component, system and lifecycle,
   then `svsw.simrng`, then `svsw.storage`, then `svsw.log`. Each
   binding lands test-first with its accept tests and its A8 rejection
   tests.
7. **The D46 surface**: the replaced math names and the ordered
   iteration binding, plus the value-typed-key restriction at the schema
   level.
8. **The declaration generator and its drift gate**, once the registry
   has enough in it for a drift to be meaningful.
9. **The fuzz gate**, report-only, walking the same registry.
10. **The hash-golden sample and its golden**, recorded last, because
    every earlier step can still move it.
11. **The advisory load-time scan.**
12. **The `lua-binding` skill and the `binding-dev` agent's refusal-clause
    retirement**, last, because the skill encodes a procedure that has by
    then been performed for every binding in the v1 surface.

Step 1 before step 2 is the one ordering constraint that is not merely
convenient. A port that starts writing bindings before it knows which
tests have a subject will grow its own corpus by accident, and the
result is a suite that proves the port matches itself.

## Exit checklist

- [ ] The suite triage recorded: files and procedures classified
      near-verbatim, rewrite, or obsolete, with the obsolete ones tied
      to the surface #78 leaves out.
- [ ] `LUAU_EXTERN_C` and `LUA_USE_LONGJMP=1` set explicitly in the
      vendored build and recorded in `docs/VENDOR.md` as deliberate pins,
      demonstrated by a build that drops one failing rather than
      inheriting a default.
- [ ] The cross-boundary error conformance test green, driving an error
      across an Odin frame and asserting the observed behavior.
- [ ] The allow-list and ban-list rationale record committed, with every
      entry carrying a reason.
- [ ] Whitelist conformance green: each barred global unreachable by its
      own name and by every alternate route the suite covers,
      demonstrated by making one reachable and watching the gate fail.
- [ ] `getfenv` and `setfenv` demonstrably absent.
- [ ] Containment green across all four inlets of the funnel.
- [ ] Disable-in-place demonstrated: systems quiet, registrations
      intact, engine ticking.
- [ ] Budget enforcement green, including a mod that catches its own
      exhaustion and is disabled anyway, and coroutines proven to drain
      one pool.
- [ ] A coroutine resumed across a tick boundary disables the mod,
      demonstrated.
- [ ] The allocation cap green, with zero bytes outstanding after the VM
      closes.
- [ ] The watchdog green against work inside one C call.
- [ ] The v1 surface complete and no wider: entity, component and
      system, `svsw.storage`, `svsw.simrng`, `svsw.log`, and nothing
      registered that #78 defers.
- [ ] `svsw.storage` atomic persistence demonstrated, with a failed
      write returning a status rather than disabling the mod.
- [ ] The value-typed-key restriction enforced at the schema level, with
      a deliberate pointer-typed key rejected.
- [ ] The hash-golden Luau sample green on both CI platforms against one
      committed hash, recorded through the define rather than
      hand-written, exercising the replaced math surface and the ordered
      idiom.
- [ ] The `.d.luau` drift gate fails a binding added without
      regeneration and passes after it.
- [ ] The fuzz gate runs report-only over the whole registry, its report
      read at exit, and every finding it produced either fixed as a
      boundary bug or recorded with a reason.
- [ ] The advisory scan runs, flags a deliberate `pairs()` over sim
      state in a nonstrict fixture, and blocks nothing.
- [ ] `--!strict` gate-enforced over base-as-mod and samples; a
      deliberate type error there fails `just check` and the same error
      in a third-party fixture does not block its load.
- [ ] R1 through R4 recorded in `docs/ODIN_STYLE.md` as a standing
      review rule, re-verified against Luau's C API, and R5 restated
      against the pinned build configuration rather than by the original
      C-only wording.
- [ ] The three-flag helper consolidation done, with no behavior change
      observable in the accept corpus.
- [ ] The `lua-binding` skill lands, and the `binding-dev` agent's
      refusal clause pointing at this spec is retired now that the gate
      exists (the standing rule for agent-referenced gates).
- [ ] Every open question below either answered on a ticket or carried
      forward explicitly, never dropped.

Reaching **implemented** is the maintainer's call once this checklist is
clear and the gate is green.

## Course

Module S14; path tag engine. Teaches the Luau sandbox boundary and the
`svsw.*` core API against the hash-golden Luau sample. Candidate for
additional course-path tagging on its mod-facing surface lessons, with
the path structure defined in the course repository. Authored after
**implemented**, per D27.

## Prototype ports

The internal prototype's `engine/script` sandbox, budget and containment
design, carried as patterns rather than literal code because Luau's C
API, garbage collector and standard library differ from Lua's (D33). The
`runtime/` stdlib seed is re-authored against Luau's stripped globals.
The pattern table above records what carries and why each mechanism is
re-derived. Ports are test-first from a source to read, never a target
to converge with (D38).

## Open questions

The eight children of map #73 are all closed, and nothing below reopens
one. These are the residue: what the map itself recorded as not yet
specified, the residual policy calls a closed child named without
settling, and what drafting this document surfaced.

### The gate-collapse residuals (#77)

Both are prototype-fidelity against boundary-hardening, and #77's
recommendation was to answer them once this spec's conformance corpus is
green rather than during the port.

- **Should a stage violation raise the same polite error a phase
  violation already does?** In the prototype a phase violation raises a
  hand-authored error naming the offending call, while a stage violation
  produces the runtime's own generic message because the function is
  simply absent from the table for that stage. Making them consistent is
  a strict diagnostic improvement and a behavior change relative to the
  source. Nothing on map #73 settles it, and neither #74 nor #78
  reaches it.
- **Should the resource-attachment inconsistencies be ported or closed
  as defects?** The prototype's store read raises when no store is
  attached while its persist call returns false, an intentional split
  that leaves one underlying condition with two failure contracts; and
  the read gate cannot distinguish the death-observer context from the
  ordinary out-of-system context, so whether reading the store from a
  death observer is legal is undocumented in the source. `svsw.storage`
  is in the v1 surface (#78), so both survive the surface ruling and are
  live here. E2 argues for closing them; D38's test-first port argues
  for reproducing them first and closing them with the corpus green.

### Carried from map #73's own "not yet specified" list

- **The script-surface index's editor-completion and agent-facing
  consumers.** This spec builds the `.d.luau` generator over the binding
  registry, and nothing establishes whether that generated surface needs
  additional shape to serve editor completion or agent-facing tooling.
  Owners: the editor-tier specs, S24 in particular. It is fog here by
  design, not an unasked question.
- **A declared home for Inspector-editable script tunables.** Named
  alongside the item above at map #37's closure and deferred to S15 and
  S24 by name. It becomes a sharp question on one of their maps, never
  on this one.
- **Whether the declaration generator is capability-tiered.** C00's own
  open questions describe rendering the generated output "per capability
  tier," which presupposes a tiering this spec's scope does not name.
  S14 ships one capability tier, so the presupposition costs nothing
  yet. Whichever session next touches C00 or S24 owns resolving it.

### Surfaced while drafting

- **How R1 through R4 land beside the rules already in
  `docs/ODIN_STYLE.md`.** S3 there already tells `proc "c"` callbacks to
  rebuild the context and to leave no deferred cleanup live across a
  point that can longjmp, which is R4 plus half of R2, and S00 widened it
  from script VM callbacks to every `proc "c"` callback while keeping its
  longjmp clause specific to the script VM. A7 covers assertions in the
  same code. Whether the boundary rules extend S3 and A7 or land as
  their own numbered block is a landing-time shape call; what must not
  happen is two rules saying the same thing in different words, which is
  the failure mode a second source of truth always produces.
- **Where the allow-list and ban-list rationale record lives.** D46
  requires the record and S02b's row carries the same obligation for the
  math surface, but neither names a path. D30's layout convention puts
  it under `docs/`. Which subdirectory, and whether the two records
  share one home, is a landing-time micro-ruling of the kind S01 took
  for its manifest.
- **The instruction budget's number.** The budget is an engine constant
  per the ruling above, and the constant's value is not fixed here. The
  prototype carried separate per-tick and per-load defaults, which is
  evidence about shape rather than a value to inherit (D38), and the
  number is chosen during implementation against the v1 surface's own
  sample. What the ruling settles is that whatever number is chosen is
  the one every golden is recorded against.

Three questions this document surfaced were settled by maintainer
micro-ruling at landing (2026-07-31) and live in the normative text above
rather than here: that R5's guarantee survives as a pinned
`LUA_USE_LONGJMP=1` build configuration verified against upstream rather
than as an open obligation, that the shared instruction budget is an
engine constant for the engine era with S15's manifest grilling the named
reopen, and LUAU_STYLE B3's stale coroutine clause, which was reworded in
its own commit at this landing.
