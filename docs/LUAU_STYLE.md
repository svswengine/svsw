# Luau Style Guide

The engineering standard for Luau in this repository: mod scripts,
base-as-mod, samples, `runtime/`, and editor scripts. Adapted from the
[Roblox Lua style guide](https://roblox.github.io/lua-style-guide/) and
the [Luau reference documentation](https://luau.org/), with the decision
log winning wherever they disagree. Design goals, in order: determinism,
containment, developer experience. A script that diverges the world hash
or escapes the sandbox has already failed, whatever else it does well.

Review enforces every rule here. Each states the failure it prevents, so
it can be applied without a checker; the boundary rules additionally hold
by construction, because the whitelist omits what it bars rather than
blocking calls to it.

## 1. The sandbox boundary

The mod sandbox is the only security boundary this project declares
(D43, SECURITY.md), and D50 settles what it defends against: hostile mod
source, not merely buggy source. A mod's source, its manifest and every
argument it passes across `svsw.*` are attacker-supplied input, and
these rules hold even when the script is your own.

### B1. Mod Luau sees `svsw.*` and nothing else

Mod code reaches the engine through the `svsw.*` surface and reaches
nothing else: no engine internals, no platform, no network, no `os` and
no `io` (D10, D33, D50). There is no debugging exception, because the barred
globals are absent from the whitelist rather than blocked at call time.
Removing `os` is what makes D1's "no wall clock reachable from
simulation code" true of scripts instead of merely asked of them. The
surface itself is assembled from opt-in registrar binding packages (D3,
D26), so declare the packages a mod needs rather than probing for what a
build might have registered.

### B2. The mod tier never widens to accommodate editor code

Filesystem access, asset writes and command-stream emission belong to an
editor script (D10, D43); the mod whitelist does not grow to meet them.
The two capability tiers share one VM architecture and one embedding
(D10, D33), each mod and each editor script still getting its own VM
host (D12), so a mod tier drifting toward the editor tier dissolves the
only declared security boundary into the tier that deliberately contains
nothing. The editor tier's whitelist is specified as a diff against the
mod sandbox (D43), which keeps the two from parting silently.

### B3. Three limits bound every script; write hot loops against them

A per-VM allocation cap, a shared-pool instruction budget and a
wall-clock watchdog bound every script (D50). Do not build a pattern
whose backtracking grows faster than subject length, the shape several
adjacent lazy quantifiers over one character class produce (`"a-a-a-b"`
against a long subject that never matches), and never run one over
mod-supplied, save-supplied or network-supplied text: pattern-matching
backtracking runs inside one C call where the instruction hook cannot
interrupt it, the hole the watchdog closes. No checker reads pattern
literals; review is the whole enforcement. A coroutine boundary neither
resets nor escapes the budget: every coroutine in a VM drains the one
shared pool, and exhaustion latches rather than resetting (D50), so
splitting a hot loop across coroutines buys it nothing.

## 2. Mod layout

### L1. settings, then data, then control, and no stage does another's work

A mod is three files loaded in one fixed order: `settings`, then `data`,
then `control` (D12). Settings are read by the later stages and written
by none; component schemas under global component IDs, scenes and
prefabs are data stage (D19); systems and per-tick behavior are control
stage. Migrating code between stages breaks the load-order determinism
the loader builds out of Kahn resolution over a name-sorted ready queue
(D12): a schema registered from control stage arrives after a dependent
mod mirrored its absence.

### L2. Control-stage load must survive being re-run

Reloading a mod into a running Session re-runs the affected
control-stage load (D60), so registration is idempotent and per-tick
state is never a load side effect a second load would duplicate. Any
reload that changes sim behavior marks the Session dev-diverged exactly
as a rebuild does, because the recorded trajectory no longer predicts
the live one; a hash that stops matching after a mid-Session edit is the
mechanism working, not a golden to re-record.

## 3. Determinism on hashed paths

A sim-writing path is Luau whose effects land in hashed simulation
state: control-stage systems and everything they call. Presentation and
editor code is not a sim-writing path and stays bound by B3 regardless.
Breaking determinism is a release blocker (D1), so every rule here
outranks the convenience it costs.

### H1. Transcendentals and randomness come from the engine

On sim-writing paths, use the engine-provided deterministic f64 `sin`,
`cos`, `pow`, `exp` and their siblings, and the simrng-backed bindings
for randomness. Stock Luau delegates the transcendentals to platform
libm, whose last-bit rounding differs between macOS arm64 and Linux
x86-64, so one call diverges the world hash between the CI legs;
`math.random` is VM-local randomness outside simrng's seed discipline,
so two runs of one input produce two trajectories (D1, D46). Passing the
raw functions through is rejected because a per-platform divergence
inside mod code cannot be debugged from the engine side. The whitelist
substitutes the replacements, so the raw functions are not reachable to
call by accident.

### H2. Walk sim-writing tables in an order the contents determine

Use svsw-provided ordered iteration, or a numeric loop over a dense
array. Pointer-keyed `pairs()` is barred from sim paths (D46): it walks
in allocation order, which ASLR varies from run to run, so identical
inputs produce a different write order and a different world hash on one
machine.

```luau
-- GOOD: a dense array walks in one order on every run.
for i = 1, #actors do
	svsw.damage(actors[i], DECAY_PER_TICK)
end

-- BAD: allocation order decides the damage order; the hash differs
-- between two runs of the same inputs and nothing reports it.
for actor in pairs(actor_set) do
	svsw.damage(actor, DECAY_PER_TICK)
end
```

The D34 strict-mode lint binds first-party code hard; for third-party
mods it is advisory, their divergence remaining a D50 tripwire matter.

### H3. Nothing that varies between two runs may reach sim state

Sim state is a function of its inputs and nothing else. No wall clock,
and none rebuilt from frame counts (D1). No key or ordering derived from
a table address or from `tostring` of a table, because addresses vary
with ASLR. No behavior conditioned on collector timing, which is paced
against live heap size and moves with unrelated load. No presentation
state read back into the sim: poses are off-hash and stay off-hash, and
the sim carries deterministic capsules for everything interaction
depends on (D11). Each of these runs cleanly and drifts the hash without
a diagnostic. The wall-clock watchdog (B3) is the one engine mechanism
that is wall-clock by design, and a sim-writing script close enough to
trip it on a slow machine and not a fast one diverges the two CI legs
by being disabled on one of them: hold hot loops far enough under the
budget that the instruction count, never the clock, is what ends them.

### H4. A control-stage hot-loop edit is a determinism change

Script work is metered against the shared instruction budget, and
instruction counts are themselves deterministic, so growing a hot loop
can push a tick's script work across the budget; crossing it disables
the mod in place, and a disabled mod changes sim behavior and therefore
the world hash. An edit to a hot loop in
`control` goes through determinism review, not through "it is only
script." The world-hash goldens are the backstop, and a golden that
moves is the report rather than the diagnosis.

## 4. Numbers and identity

### N1. Identity is never arithmetic

Luau carries one 64-bit double for every number and has no integer
subtype, so nothing in the language separates a count from an identifier
(D35). Entity IDs and chunk coordinates cross the boundary as opaque
typed handles and the checker rejects arithmetic on them. Ticks and
quantities stay plain numbers inside the 2^53 safe-integer envelope,
with debug-build integrality guards at the boundary catching float
contamination before it reaches sim state.

```luau
-- GOOD: a tick is a number, a handle stays opaque.
local due: number = spawn_tick + COOLDOWN_TICKS

-- BAD: an entity handle is not an integer. Strict mode rejects the
-- arithmetic outright; in a nonstrict mod nothing rejects it at the
-- edit, and the failure lands in whatever tick first steps off the end.
local neighbor = entity + 1
```

### N2. Integer-sensitive math stays in Odin

Do not implement integral sim math in Luau. The ECS core, `hash_world`,
tick accounting and any arithmetic whose correctness depends on exact
integers live in Odin (D35), because f64 rounding on integer-shaped
arithmetic diverges the hash rather than merely rounding a result. When
gameplay needs integer-exact arithmetic, the answer is a binding. D33
rejected modifying the runtime to reconcile the number models, so this
discipline is the mechanism rather than a preference about one, and no
checker catches a violation; review does.

## 5. Types and declarations

### T1. `--!strict` on every first-party script

Base-as-mod, samples, editor scripts and scaffold templates typecheck
clean under strict mode (D34). Third-party mods
stay nonstrict, and their type errors surface as IDE warnings that never
block a load. Inverting that asymmetry is the dangerous mistake: typing
is a developer-experience mechanism for code the project controls, the
sandbox remains the sole safety boundary, and treating an annotation as
containment misreads D50.

### T2. The `svsw.*` declarations are generated; regenerate, never edit

The `svsw.*` type surface ships as `.d.luau` files generated from the
Odin binding registry (D3, D34). Never hand-write a local alias
mirroring an engine type, and never cast an engine handle into a shape
invented at the call site: a hand-copied shape is a second source of
truth, and it goes stale the first time its binding changes. A wrong
declaration means the binding or the generator is wrong.

## 6. Errors and containment

### E1. `pcall` at a named boundary, never around the tick

Wrap a call in `pcall` only where the callee signals failure by raising,
and name in a comment which failures the wrapper expects. An error
escaping a mod's own handling disables that mod in place with the engine
healthy, the containment outcome the engine guarantees (D50); a wrapper
spanning the tick swallows the fault that path exists to surface.

```luau
-- GOOD: one call, and the comment names what raises.
-- svsw.storage.write raises when the mod's quota is exhausted.
local ok, err_or_result = pcall(svsw.storage.write, "checkpoint", payload)

-- BAD: swallows every fault in the tick; the mod runs on for another
-- hundred ticks over state it corrupted in the first one.
pcall(update_all_systems, world)
```

Reserve `error` for a caller violating a contract and return a status
for failure that is expected. Do not write cleanup that depends on
running after a fault: a disabled mod is the outcome, so write for it.

### E2. Script input that trips an engine assert is a boundary bug

The script tier may pass anything across `svsw.*`. The binding tier
treats everything script-supplied as an operating error and rejects it,
with the mod disabled and the engine healthy. A script argument that
reaches an engine assert is therefore a defect in the boundary, reported
rather than worked around from the script side. D50 commits the binding
surface to adversarial-argument fuzzing from the engine side.

## 7. Style

### S1. Formatting: StyLua, and the typecheck before done

Do not hand-format. StyLua formats Luau natively, and a style rule that
fights the formatter becomes a rule nobody runs. A change is done when
the strict-mode typecheck (T1) runs clean, not when the file looks
right.

### S2. No globals; state is module-local or engine-owned

A script writes no global and reads none it did not require. Mutable
state lives in module-local variables or, better, in engine-owned
component storage. A mutable table shared between mods gives two mods
one trajectory and makes per-mod VM containment (D12) a fiction, so a
shared singleton is a determinism hazard before it is a design smell.
Strict mode reports the unknown global in first-party code, one more
reason T1 is not optional there.

---

Editor-tier rules belong to the editor capability tier (D10, D43): the
whitelist diff, the project-scoped filesystem semantics and script
discovery live there, and the mod tier never widens to meet them (B2).
The binding side of this contract belongs to the engine's C-API
boundary discipline (D33).
