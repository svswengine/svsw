# S02a — Prototype kernel port: kernel, ECS, simrng, save/replay, harness

Normative text for S02a. The [spec index](README.md) records this spec's
rung and nothing else duplicates it (D37).

- **Stage:** 0 — New-stack proof
- **Status:** spec written
- **Depends on:** S00
- **Decisions:** [D1](../decisions/D001-determinism-by-construction.md),
  [D20](../decisions/D020-threading-model.md)
- **Normative references:** none

## Goal

Port the deterministic core from the internal prototype test-first with
its suites: `engine/kernel` (accumulator, Session), `engine/ecs`
(generational handles, sparse-set pools, command buffer), `engine/simrng`
(PCG32 per logical slot), `engine/save` and `engine/replay` (hardened
codecs), and `engine/harness` (XXH3 `hash_world`, determinism pyramid).
save and replay port with the kernel because the pyramid's
snapshot-resim tests need them, ahead of their stage 5 consumer. Spall
zones land at the base of every ported package, compiled out of retail.

This is the first spec that produces engine code. Everything before it
built the gate that will judge it, so the obligation running through this
document is that the port lands behind gates from its first commit rather
than acquiring them afterwards. The internal prototype is a source to
port from test-first, never a target to converge with (D38): what ports
is a set of patterns and invariants, and every constant that encodes the
prototype's own behavior is re-derived here.

## Working software

A headless deterministic simulation runs N ticks; the determinism pyramid
passes green inside `just check` on both CI platforms; a save-load-save
round-trip is byte-identical, joining the golden discipline from this
first port because a serializer that mutates state on write is the
divergence class the forward-resim gates cannot see.

The pyramid stands at five layers here. The index entry that collapsed
into this document named four and named the round-trip beside them; the
disposition on #66 settles the relationship between the two by placing
the round-trip inside the pyramid, so the layer count is five and this
document carries the obligation.

## Decisions in force here

The row's `Decisions` field names D1 and D20, the two this spec is
governed by. Six more bind clauses of it, and each is cited at the point
it decides something below.

- **D1, determinism by construction.** Fixed timestep, ordered ECS
  iteration, engine-seeded RNG, no wall clock reachable from sim code.
  Every gate in this document exists to enforce one clause of it, and a
  divergence in any of them is a release blocker.
- **D20, threading model, as amended.** The simulation is single-threaded
  per Session. D20's forced-worker-count obligation attaches to threaded
  asset decode and is S12b's, not this spec's (#67).
- **D22, dual-mode parity.** Not gateable at this rung; see below.
- **D11, animation off-hash.** The classifying rule this spec's
  completeness-reflection test mechanizes: sim state is on-hash or
  off-hash by declaration, never by omission.
- **D35, number semantics.** Integral sim math, the ECS core,
  `hash_world`, and tick accounting stay in Odin. This port is where all
  four land, so the boundary D35 polices at S14 is held here by their
  absence from any script surface. Entity handles port as an index and
  generation pair, which is the opaque typed handle D35 requires them to
  cross the Luau boundary as later; nothing here exposes them to
  arithmetic.
- **D53, releases and the compatibility surface.** Saves and command logs
  are release-scoped and hard-reject on a version mismatch per the ported
  codec posture, until the player save and load spec ships a versioned
  reader. That clause is the whole of this spec's versioning obligation
  (#64).
- **D43, the editor tier.** D43 refers to the engine's allocator as an
  existing thing. The allocator model is a named deliverable of this port
  so that reference has a referent; its shape is recorded below as
  committed scope rather than settled design.
- **D38, fresh repository.** No cutover, no gate equivalence, no old
  goldens. It is also what makes D13 spent: D38 fully supersedes it.

### D22 at a pre-renderer rung

Dual-mode parity compares a headless run against a windowed run of one
build. S02a has neither a render path nor a window: S03 builds the first
and S04 lands `just parity-check` on the first rendered scene. Stating
that plainly is more useful than claiming a parity gate this spec cannot
run.

What this spec owes D22 is the hash the parity gate will later compare.
The world hash committed as a golden here is one side of that comparison,
so any design that let presentation state reach sim state would break
parity before parity had a gate to notice. The ported sim packages take
no window, no surface, and no presentation input, which is why a headless
run at this rung is the whole run rather than half of one.

## Scope in

- The six prototype packages ported with their suites, adapted only where
  the svsw layout demands, on the split recorded in the port inventory
  below.
- Spall profiling zones at the base of every ported package, compiled out
  of retail.
- `hash_world` injectivity and length-prefix discipline, plus the
  completeness-reflection test.
- The engine allocator model as an explicit deliverable of the kernel
  port: which allocator sim code runs under, the per-tick temporary arena
  policy, and the allocator-identity assertions at VM entry points, so
  D43's reference to the engine's allocator has a referent.
- The per-system boundary seam, observation-only and hash-neutral (#65).
- The byte-identical save-load-save round-trip as a pyramid layer (#66).
- The hash-golden recording workflow: the re-record define pattern, its
  failing update branch, and the single-test invocation (#68).
- The `golden-hashes` skill and the `golden-recorder` agent's
  gate-availability re-verification, per the tooling design record at
  [`docs/plans/claude-tooling-design.md`](../plans/claude-tooling-design.md).
- The test-count badge, per
  [`docs/plans/public-stats.md`](../plans/public-stats.md).

## Scope out

- simmath3d and the cross-CPU gate (S02b).
- Per-chunk hashing and worldgrid (S11a).
- Any rendering.
- The Luau host (S14).
- Archetype or parallel ECS redesign, which is not on this roadmap.
- Image and readback golden recording, which is S04's (#68).
- Semantics on the per-system boundary seam: stepping, suspension, and
  mid-tick inspection are S22c's (#65).

## The port inventory

Settled on #62. Across the six suites the prototype carries 32 test files
and 157 `@(test)` procedures. 28 files and 143 procedures port
near-verbatim, meaning the assertion logic is unchanged and the
adaptation is package paths and names. 3 files and 13 procedures require
rewriting, and 1 file and 1 procedure are obsolete. Every rewrite and the
single obsolete file sit in `engine/save`.

| Subsystem | Files | Tests | Near-verbatim | Rewrite | Obsolete |
|---|---|---|---|---|---|
| `engine/kernel` | 11 | 45 | 11 / 45 | 0 | 0 |
| `engine/ecs` | 4 | 33 | 4 / 33 | 0 | 0 |
| `engine/simrng` | 1 | 8 | 1 / 8 | 0 | 0 |
| `engine/save` | 13 | 57 | 9 / 43 | 3 / 13 | 1 / 1 |
| `engine/harness` | 3 | 14 | 3 / 14 | 0 | 0 |
| `engine/replay` | 0 | 0 | infrastructure, not a suite | — | — |
| **Total** | **32** | **157** | **28 / 143** | **3 / 13** | **1 / 1** |

The counts describe the source. They are not a target: a ported suite may
grow, and where this document names a new gate the suite grows to carry
it.

### `engine/kernel`

Ports whole. What ports is the World's two declared halves, hashed and
excluded, with membership machine-checked rather than reviewed; the
fixed-timestep accumulator as pure logic that takes a measured frame time
and returns a step count, with its spiral-of-death clamp and its
compile-time step ceiling; system registration that seeds one RNG stream
per system from the registration index, so adding a draw in one system
never shifts another's sequence; execution ordering as a topological sort
with a registration-ordered tie-break, run at registration rather than
per tick, touching execution order only and never a system's stream
index; snapshot and restore that reproduce dense iteration order
verbatim rather than rebuilding it by re-inserting in handle order, which
is the property that makes save, load, and resimulate bit-identical; and
`hash_world` itself.

`hash_world` ports as-is (#63). Its discipline is the part that must not
drift: a fixed documented region order, a fixed-width count prefix before
every variable-length region so the byte stream is injective, dense
arrays hashed after their pool payload inside the same region because
iteration order is itself state, derived data such as sparse arrays
excluded, floats hashed as bit patterns, and NaNs canonicalized at
registered float lanes so the one permitted float nondeterminism cannot
move a golden. Compile-time locks on endianness and on the sizes of every
type whose byte image is hashed port with it: a target that would
silently diverge must fail to compile.

The completeness-reflection test ports as a reflection gate over the
World's field set, asserting exactly-one membership of the hashed and
excluded classes, plus the companion assertion that no excluded field
appears in the snapshot. Its honest limit ports with it: the hashed class
is the sim-determining class, not a claim that every member is fed to
`hash_world`, so "excluded is off-hash" is established jointly with the
per-tick trace comparison the boundary seam carries, never by reflection
alone.

The Session is the kernel's own type. The prototype's host registry,
prelude component accounting, and opaque backend pointer exist to serve a
Lua multi-mod host and a 2D physics backend. The pattern of an off-hash,
never-snapshotted opaque pointer is worth keeping; its Lua-era and
Box2D-era semantics are not, and none of it is re-derived here because
the Luau host is S14's and there is no physics backend at this rung.

### `engine/ecs`

Ports whole and has no engine dependencies at all. Generational handles
with generations starting at one so the zero value is the nil handle;
liveness as a defensive-by-return check rather than an assertion, because
it is the stale-handle test the boundary relies on; sparse-set pools that
zero the full stride including interior padding on add, so padding cannot
hash nondeterministically; swap-and-pop removal with the vacated slot
zeroed; a command buffer applied in submission order with pools swept in
component-id order and a full-width payload requirement that forecloses
partial upserts; and view iteration that re-picks the smallest pool as
driver per iteration.

The prototype's recorded decision not to add bitset prefilters, owning
groups, or sorting ports as the v1 profiling baseline, and it stays a
baseline: revisiting it is a later decision, not a port.

### `engine/simrng`

Ports whole, and it is the one package whose committed constants port
verbatim. The known-answer vectors pin the upstream PCG32 reference
implementation rather than this engine's behavior, so they are portable
in a way no world hash is. What ports is the two-field generator with the
odd-increment stream invariant asserted on every draw, bounded generation
by multiply-shift rejection with a capped rejection loop so a broken
generator crashes rather than hangs, and unit-float conversion built from
an explicit mantissa-bit count locked to its scale by compile-time
assertion.

The stream convention, one stream per system keyed by registration index,
is kernel policy expressed here. It is restated wherever registration
lives rather than left in a comment on this side of the seam.

### `engine/save` and `engine/replay`

The heaviest package and the only source of rewrites. What ports, and is
the reason this package ports early rather than with its stage 5
consumer, is the hardening posture:

- The checksum is verified before any parse.
- Every length is checked against the bytes remaining before any
  allocation or slice, and because each count maps to a known fixed
  element width, the remaining-bytes check is itself the cap. No
  arbitrary size constant is needed and a tampered length cannot trigger
  an unbounded allocation.
- Counts that cannot fit the target's integer width are rejected outright.
- Both parsers require the cursor to land exactly at the end: trailing
  junk is malformation.
- Malformation returns a failure and frees every partially built
  allocation; it never asserts. Assertions are for engine invariants, not
  for file contents (ODIN_STYLE A8).
- Load is validate-then-restore-in-place: the decode allocates only
  temporaries, so a rejected load leaves the live world untouched.
  Structural validation of a decoded snapshot against the live world is
  required rather than optional, because the restore path's assertions
  are stripped under `-disable-assert` and a checksum-valid corrupt
  payload would otherwise become an out-of-bounds write. A checksum is
  integrity, not authenticity.
- On-disk names pass a strict allowlist, which subsumes separators,
  relative segments, and NUL in one rule, plus an explicit rejection of
  the reserved Windows device basenames the allowlist would otherwise
  admit. Writes are atomic: temporary file, then rename as the commit
  point.

The three rewrite-required files build their fixture world by driving the
prototype's Lua 5.4 mod-loading pipeline over synthetic mod trees. The
technique does not carry: the scripting language is Luau (D33) and the
host is S14's. Their assertions carry; their world construction is
re-authored against a native Odin fixture. The single obsolete file
drives save and replay through a Box2D-backed, mod-loaded 2D physics
world, and every one of those three couplings is outside this spec at
once.

Two prototype-specific shapes are named here so nobody ports them by
reflex. The schema fingerprint reads a script-layer field-kind
enumeration, which changes by construction under Luau, so there is no
fingerprint continuity across the port and none is wanted. The
physics-on-load hook carries a caveat that a loaded physics world is
forward-deterministic but not bit-identical to the uninterrupted run,
because solver warm-start caches were never serialized. That caveat is
not ported. The question behind it is: whatever backend later holds state
outside the snapshot must either serialize it or declare itself off-hash,
and S13 owns answering that for this engine.

`engine/replay` is a headless trace-writer CLI rather than a test suite,
and it ports as infrastructure: compile-time knobs whose sanity is
enforced by compile-time assertion rather than runtime check, so a
vacuous trace is a build error and never a silently matching artifact; a
strided trace that always includes the final tick; and the binary writing
its own output file rather than being shell-redirected, because
redirection re-encodes on some hosts and breaks byte-for-byte diffing.

### `engine/harness`

Ports whole as pattern. The canonical scenario is one small complete
workout of every determinism-relevant path: entity churn exercising the
free list, component adds carrying payloads through the command buffer,
swap-and-pop removal driven by destroys, per-system RNG streams, and
math ops inside a sim path, all driven by seed, entity count, and tick
count alone, so tests, the trace CLI, and any later stress harness
measure the same code.

Three of its properties are load-bearing and port explicitly. A component
shaped to carry interior padding exists to prove padding flows zeroed
through spawn payloads, snapshots, and hashes. RNG draws go into named
locals in field order and never inside a struct literal, because Odin
leaves struct-literal field evaluation order unspecified and folding
ordered draws into one would couple the hash to a compiler detail. And
the scenario's asymmetries, such as a replacement entity deliberately
spawned without one component so a pool count shrinks monotonically, are
hashed state: completing them looks like tidying and moves the golden.

The scenario's components are 2D in the prototype. They are re-authored
for this engine and their goldens are recorded fresh; the shape ports,
the values never do.

## Grilling dispositions

Settled on the children of wayfinder map #59, all closed. Each is
normative here.

| # | Disposition |
|---|---|
| #62 | 143 of 157 test procedures port near-verbatim; every rewrite sits in `engine/save`'s Lua-fixture files; the golden re-record mechanism ports, the hash constants never do. |
| #63 | `hash_world` ports as-is with the chunk-composition seam documented; composition lands with S11a's chunk model. |
| #64 | Save and replay versioning hard-rejects, per D53; S27b is the only named reopen point. |
| #65 | The per-system boundary seam lands now, observation-only and hash-neutral; its semantics land at S22c. |
| #66 | The byte-identical save-load-save round-trip is a determinism-pyramid layer with gate standing. |
| #67 | D20's forced worker-count clause is S12b's scope and creates no obligation here; no worker-count work is spawned under this spec. |
| #68 | Hash-golden recording ports at S02a; image golden recording is S04's. |

### The per-system boundary seam (#65)

The ported tick loop carries an observation-only boundary callback: a
system identifier plus a tick phase, before and after each system, with a
no-op default. The callback is classified off-hash and off-snapshot, and
the zero value makes the loop byte-identical to the un-hooked path.

It has no semantics. It cannot suspend the loop, cannot mutate world
state, and makes no claim about what is true between two systems. Those
are S22c's questions, and stepping, mid-tick inspection, and the status
of an uncommitted command buffer belong to it. The seam lands now so
S22c builds on an existing shape rather than retrofitting one against
goldens this spec freezes.

Hash-neutrality is proven by comparison rather than asserted. The gate
captures a per-tick hash vector with the callback unarmed, re-runs the
same scenario with it armed, and requires every tick to match. A
final-hash comparison is not sufficient and does not satisfy this
clause: two runs can converge on one hash after diverging in the middle.
The comparison happens inside one run against no stored value, so it
cannot go stale and never needs re-recording.

### `hash_world` and the chunk-composition seam (#63)

`hash_world` ports unmodified. Chunk-composed hashing is hash-defining,
so S11a's goldens re-record whether or not hooks land early; early hooks
would save nothing and would risk a second re-record against a guessed
chunk model.

What this spec owes S11a is the seam written down rather than
rediscovered. Two cuts exist in the ported hash and both are documented
at the site. The coarse cut is the top-level region sequence, which
frames the whole digest. The fine cut is the per-pool body: each pool
contributes a self-contained, count-prefixed region whose bytes depend on
nothing outside that pool, which is exactly the property a per-chunk
digest folded in a fixed order would need. What must not move when S11a
composes: the region ordering, the prefix widths, and the fact that a
pool's dense array is hashed after its payload inside the same region.

### Save and replay versioning (#64)

Versioning hard-rejects through the engine era. The port keeps the
fingerprint-and-reject shape: identity quantities travel in the header
and are re-checked on load, a mismatch refuses the load and leaves the
live world untouched, and a future wire version is refused outright
because this engine cannot interpret a format it postdates. Refusal is a
returned failure with a logged reason, never an assertion.

D53 carries the obligation: saves and command logs are release-scoped and
hard-reject on a version mismatch per the ported codec posture, until the
player save and load spec ships a versioned reader. The obligation rests
on D53; #64's comment cited D13, which D38 superseded. S27b's durability
drills are the only named reopen point for a versioned-reader question,
and nothing in this spec anticipates one.

### The golden-recording workflow (#68)

The hash-golden half of the workflow ports here in full: world-hash,
replay, and round-trip goldens. Image and readback golden recording is
S04's, where the questions about a software device fallback and
comparison metrics live.

The mechanism ports with four properties intact. One compile-time define
per golden, defaulting off, so a normal build compiles the update branch
out entirely. The update branch deliberately fails the test rather than
rewriting anything, and its failure message contains the exact constant
text to paste. Re-recording runs a single named test rather than the
suite. And a moved hash is triaged as regression or sanctioned re-record
before anything is touched: hand-editing a constant to silence drift is
not a sanctioned path, and the `golden-recorder` agent refuses when the
drift was not declared intentional.

The `golden-hashes` skill and the `golden-recorder` agent land with this
spec, per
[`docs/plans/claude-tooling-design.md`](../plans/claude-tooling-design.md).
The agent's refusal clause currently points at this spec, so retiring
that clause is an exit item below.

## Gates

### The determinism pyramid

Five layers, all reached through the test aggregator inside `just check`
on both CI platforms. A divergence in any layer is a release blocker
(D1).

1. **Same-seed-twice.** Two worlds, one seed, hashed every tick, compared
   element-wise with the first divergent tick reported. It ships with its
   inverse: two different seeds must diverge. Without the inverse the
   positive test can pass vacuously.
2. **Snapshot-then-resimulate.** Run, snapshot, run on recording hashes,
   restore, re-run the same span, compare element-wise. This is the
   pre-netcode rollback guarantee.
3. **Committed world-hash golden.** One recorded value for one scenario,
   verified on both CI legs. World hashes are platform-invariant by
   definition (`docs/context/CONTEXT.md`), so one committed value that
   both legs verify is this spec's cross-platform claim. S02b's cross-CPU
   gate exists because policed float math is the part that could break
   that claim, and it arrives with the math.
4. **Neutral-input regression.** A neutral-input run and a plain run must
   hash identically. If they diverge, the neutral track is not neutral
   and every golden in the tree is suspect.
5. **Byte-identical save-load-save round-trip (#66).** Save, load, save,
   and require the two serialized images to be byte-identical. It is a
   layer rather than a package unit test because it catches a class the
   four forward-resim layers structurally cannot see: a serializer that
   mutates state on write leaves every forward hash correct and every
   round-trip wrong.

Beside the pyramid, and not a member of it, the boundary-seam
hash-neutrality check described under #65 runs on the same scenario. It
compares two traces produced in one run rather than against a stored
value.

The round-trip layer needs no golden fixture of its own. Its assertion is
an equality between two artifacts the run produces, which is why it
carries gate standing without carrying a recorded constant, and why an
intentional sim change never churns it.

### What `just check` grows

- The Odin test aggregator gains the six packages' suites. It gains at
  the same time the completeness check that fails when a package holding
  tests is missing from the aggregator's import list, because a package
  absent from that list runs zero tests and reports green. That is a
  false green, and this is the first commit at which one is possible.
- The pyramid runs inside the aggregator. This spec adds no
  `just determinism` or `just golden` recipe; those gates are test
  procedures reached through the test recipe, and inventing a recipe name
  for them here would put a second name on one gate. S21 owns the roster.
- The test-count badge gains its source
  ([`docs/plans/public-stats.md`](../plans/public-stats.md)).

## Obligations on the ported code

These are the clauses of [`docs/ODIN_STYLE.md`](../ODIN_STYLE.md) this
port is judged against, named because a near-verbatim port is the case
where a standard is most easily assumed rather than applied.

- **A1, roughly two assertions per procedure**, with loop-invariant
  assertions hoisted to the loop preamble and a per-iteration assertion
  carrying a reason at the site (S00).
- **A3, assert the positive and the negative space.** Where ported code
  carries a runtime assertion, a test proves it fires. Two constraints
  ride with that: only context-carrying assertions are interceptable, so
  contextless procedures get valid-domain edge tests plus a recorded
  exemption; and the test body must be allocation-free before the
  assertion fires, because a trapped thread runs no deferred cleanup and
  a prior allocation trips the leak gate.
- **A5, compile-time assertions.** Every type whose byte image is hashed
  or serialized carries `#assert` on its size and on the offset of every
  field, and every hashing or serializing package asserts little-endian.
  A target that would diverge must fail to compile rather than produce a
  quietly different golden.
- **A8, assert engine invariants and reject input.** File and wire bytes
  are input. The codecs return failures; they do not assert.
- **F1, the 70-line ceiling.** Prototype procedures that exceed it are
  split on the port. Length inherited from a source is not an exemption,
  and the sole carve-out (S00) requires a body with no control flow at
  all plus a marker at the declaration site.
- **T1, explicit widths where the width is meaning.** Every value that
  crosses the determinism boundary carries its width in its declaration,
  the seed included.

Every field this port introduces to sim state is classified on-hash or
off-hash with the rationale recorded at the site, and the
completeness-reflection test is the mechanism that makes an unclassified
field a failure rather than an oversight (D11, and the index's standing
rule for any spec that introduces or reshapes sim state).

## Committed scope with unsettled shape

Two items are committed scope whose shape no disposition settles. Map #59
recorded both as not-yet-specified rather than slicing either into a
child, and they are carried here so implementation meets them as known
work rather than as a surprise. What is committed is the deliverable;
neither shape is settled by this document, and both are recorded as open
questions below with the owner each answer belongs to.

1. **The engine allocator model.** The row commits this port to deciding
   which allocator sim code runs under, the per-tick temporary arena
   policy, and the allocator-identity assertions at VM entry points, so
   D43's reference to the engine's allocator has a referent. D43 supplies
   the sharpest constraint on it: Odin's C calling convention makes the
   default context yield the default heap allocator rather than the
   engine's, which is a determinism bypass hiding inside the idiom the
   language's own examples use. The identity assertions exist to catch
   exactly that.
2. **Spall zones and "retail".** The Goal commits Spall zones at the base
   of every ported package, compiled out of retail. Neither term is in
   [`docs/context/CONTEXT.md`](../context/CONTEXT.md) or the decision
   log, so the vocabulary this spec's own Goal uses carries no defined
   sense yet.

## Implementation order

Suggested, not binding; `/to-tickets` owns the breakdown.

1. `engine/ecs`, which has no engine dependencies, with its suite.
2. `engine/simrng` with its suite, including the known-answer vectors
   verified against the upstream reference rather than against the
   prototype.
3. `engine/kernel`: World, accumulator, registration and ordering,
   snapshot and restore, then `hash_world` with the completeness
   reflection test. The allocator model is decided in this step, because
   every later step allocates under it.
4. The aggregator completeness check, before the suites grow further.
5. `engine/harness`: the scenario, then pyramid layers 1, 2, and 4. Layer
   3's golden is recorded once the scenario stops changing.
6. The per-system boundary seam and its hash-neutrality check, which must
   land before layer 3's golden is treated as frozen.
7. `engine/save` and `engine/replay`: codecs and hardening tests first,
   then the fingerprint-and-reject path, then pyramid layer 5.
8. The trace-writer CLI.
9. Spall zones across all six packages, with the absent-when-off check.
10. The `golden-hashes` skill, the `golden-recorder` agent, and the
    test-count badge.

Step 6 before a frozen golden is the one ordering constraint that is not
merely convenient: the seam's whole justification is that it costs no
re-record, and landing it after the golden is treated as frozen spends
the thing it was meant to save.

## Exit checklist

- [ ] All six packages present, each with its suite, green in `just check`
      on both CI platforms.
- [ ] Pyramid layer 1 green, and its inverse test demonstrated to fail
      when the seeds are made equal.
- [ ] Pyramid layer 2 green.
- [ ] Pyramid layer 3 green, with the golden recorded through the define
      rather than hand-written, and the recording invocation written down.
- [ ] Pyramid layer 4 green.
- [ ] Pyramid layer 5 green, demonstrated by deliberately mutating state
      on write and observing it fail.
- [ ] The boundary-seam hash-neutrality check green, comparing per-tick
      vectors rather than final hashes, and demonstrated to fail when the
      callback is given a side effect.
- [ ] The completeness-reflection test fails on a deliberately
      unclassified World field and on a field placed in both classes.
- [ ] The codec hostile-input tests green: truncation, bad magic, wrong
      version, a corrupted length, a flipped checksum, a future version,
      and trailing junk, each returning a failure and asserting nothing.
- [ ] A load refused on a tampered identity field, with the checksum
      recomputed so the refusal is demonstrably the identity check and
      not the integrity check, and the live world unchanged after it.
- [ ] The aggregator completeness check fails when a package holding
      tests is removed from the aggregator's import list.
- [ ] The chunk-composition seam documented at both cuts in `hash_world`,
      in terms S11a can consume without reading this document.
- [ ] The allocator model written down: allocator, arena policy, and the
      identity assertions, with the assertions demonstrated to fire.
- [ ] Spall zones present in all six packages and demonstrably absent
      from a default build.
- [ ] The `golden-hashes` skill lands, and the `golden-recorder` agent's
      refusal clause pointing at this spec is retired now that the gate
      exists (the index's standing rule for agent-referenced gates).
- [ ] The test-count badge live against the Odin test runner.

Reaching **implemented** is the maintainer's call once this checklist is
clear and the gate is green.

## Course

Module S02a; path tag engine. Teaches the deterministic kernel, ECS, and
harness in Odin against the headless N-tick sim and the determinism
pyramid. Authored after **implemented**, per D27.

## Prototype ports

`engine/kernel`, `engine/ecs`, `engine/simrng`, `engine/save`,
`engine/replay`, `engine/harness`, each with its test suite, on the split
recorded in the port inventory above. Ports are test-first from a source
to read, never a target to converge with (D38).

## Open questions

All seven questions charted as wayfinder map #59 are settled on its child
issues, which hold the reasoning behind every disposition above. Three
items are recorded open, each with the owner its answer belongs to:

- **A sim-import scan.** Whether `just check` grows a scan that fails the
  build when code reachable from the tick loop imports a general-purpose
  RNG, a linear-algebra or transcendental library whose results vary with
  FMA contraction, or any wall clock. The scan is proposed here rather
  than ruled, and its allow-list would be re-derived for this engine's
  package set rather than copied. Adopting it, and placing it in a gate
  roster, belongs to S21's grilling, which owns the roster. Nothing in
  this spec gates on it.
- **The engine allocator model.** The allocator sim code runs under, the
  per-tick temporary arena policy, and the allocator-identity assertions
  are committed deliverables of this port with no settled design behind
  them. The recorded posture is that the policy is written during
  implementation and reviewed at this spec's exit rather than deferred to
  another spec; that posture is the maintainer's implementation-time
  call, not design this document settles, and the maintainer owns it.
- **Spall zones and the "retail" vocabulary.** Neither term carries a
  defined sense in [`docs/context/CONTEXT.md`](../context/CONTEXT.md).
  The glossary owns the answer, and both terms are defined there before
  the code that uses them lands.

Four further items are deliberately deferred to a named owner rather than
left open here:

- **Chunk-composed hashing** is S11a's. This spec documents the seam and
  changes nothing else (#63). S11a's own row already asks whether the
  round-trip discipline extends to a chunk activation boundary.
- **Boundary-seam semantics** are S22c's: stepping, suspension, mid-tick
  inspection, and what may be claimed between two systems (#65).
- **A versioned reader** for saves and command logs reopens at S27b and
  nowhere earlier (#64, D53).
- **Forced worker counts** on a hash-golden leg are S12b's, and this spec
  creates no obligation toward them (#67, D20).
