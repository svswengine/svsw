# S02b — simmath3d + cross-CPU hash gate

Normative text for S02b. The [spec index](README.md) records this spec's
rung and nothing else duplicates it (D37).

- **Stage:** 0 — New-stack proof
- **Status:** spec written
- **Depends on:** S02a (the harness)
- **Decisions:** [D1](../decisions/D001-determinism-by-construction.md),
  [D20](../decisions/D020-threading-model.md)
- **Normative references:** none. S02a's determinism pyramid is extended
  rather than matched, which is a dependency rather than a normative
  reference (D41).

## Goal

`engine/simmath3d` ships as the policed deterministic 3D math surface:
the vec3, vec4, mat4 and quat types with the full conventional operation
set on them, every operation carrying a deterministic implementation and
bit-pattern canary coverage from its first commit, and the cross-CPU hash
gate live alongside. This is the highest-risk new code in stage 0,
because it is the first code in the tree whose output could differ
between macOS arm64 and Linux x86-64 while every test still passes.

Two of the index row's phrasings were superseded by the dispositions
recorded below, and both were reconciled when this document landed and
the row collapsed into it. A maintainer micro-ruling at landing
(2026-07-31) dropped the superseded word from the row's title, which now
reads "simmath3d + cross-CPU hash gate" and matches this document's own.

- The row called the deliverable a **minimal subset**. #70 rules a
  comprehensive v1 library instead: the full conventional surface ships
  now, with canaries up front, rather than growing one function at a time
  under a policy that would have to police each addition separately. The
  ruling is the maintainer's and this document implements it.
- The row said **transcendentals banned**. What is banned is the
  platform libm entry points, whose last-bit rounding differs between the
  two CI legs. The deterministic replacements D46 calls engine-provided
  are built here, and they are the surface simmath3d's rotation and
  interpolation constructors call.

The mechanism is not new. The internal prototype polices a scalar math
surface with an import-boundary scan and a compiler canary, and both port
by kind. What does not port is any constant: every canary bit pattern in
this repository is computed fresh against this repository's toolchain,
because a canary that inherited its constants would prove nothing about
this engine (D38).

## Working software

The row states it as the cross-platform simmath3d hash gate passing green
on both CI legs inside `just check`, with S02a's determinism pyramid
staying green with simmath3d types in play.

"macOS arm64 versus Linux x86-64" in that field names the claim rather
than the mechanism. Nothing is compared between the legs at run time: the
gate is a set of committed constants that each leg verifies independently
inside its own `just check` run, and the two legs agreeing is what a
green matrix means. No artifact is uploaded, downloaded, or diffed by a
fan-in job (#72).

Green here means the policed operations produce the recorded bits on both
CPUs and that a scenario composing them reproduces one recorded world
hash. It does not mean any consumer uses simmath3d: S03 is the first spec
that draws with it and S06 is the first that leans on it.

## Decisions in force here

The row's `Decisions` field names D1 and D20. Five more bind clauses of
this spec, and each is cited where it decides something below.

- **D1, determinism by construction.** The whole spec is one clause of
  it. Float math that differs per CPU is the divergence class D1's golden
  hashes cannot localize on their own, because a moved hash says the
  world differs without saying which operation moved it. That is why the
  canaries exist beside the golden rather than instead of it, and why a
  divergence in either is a release blocker.
- **D20, threading model.** The simulation is single-threaded per
  Session, so every procedure in this package is a pure function of its
  arguments with no shared mutable state, no lazily initialized table,
  and no cached scratch buffer. D20's forced-worker-count obligation
  attaches to threaded asset decode and is S12b's, not this spec's, on
  the same reading S02a recorded (#67).
- **D35, number semantics.** D35 keeps integral sim math, the ECS core,
  `hash_world` and tick accounting in Odin and holds the Luau boundary to
  opaque typed handles. simmath3d is on the Odin side of that boundary in
  full: no type or operation in this package is reachable from a script
  surface at this rung, and D46's sandbox surface binds these
  implementations at S14 rather than reimplementing them.
- **D46, the Luau deterministic sim surface.** D46 names the hazard this
  package answers on the Odin side: `sin`, `cos`, `pow` and `exp`
  delegate to platform libm, whose last-bit rounding differs between the
  CI legs, so a transcendental on a sim-writing path diverges the world
  hash. D46 requires engine-provided deterministic implementations to
  replace them, and it points at this spec for the allow-list and
  ban-list rationale style. **S02b builds them**, and S14's `Depends on`
  gains S02b for them, by maintainer micro-ruling at landing
  (2026-07-31). Where their package home sits inside this spec's
  deliverable is an open question below.
- **D2, layering.** simmath3d is a sim-tier leaf: it imports `core:math`
  and nothing else from outside the tier, and nothing in it may reach
  SDL3, a graphics backend, or the platform tier. The scans below are how
  that stays mechanical rather than reviewed.
- **D38, fresh repository.** No inherited constants, no gate equivalence
  with the prototype, no old goldens. The prototype is a source to read.
- **D22, dual-mode parity.** Still not gateable at this rung, for the
  same reason S02a recorded: there is no render path and no window until
  S03, and no parity gate until S04. What this spec owes D22 is that the
  hash the parity gate will later compare gets stronger rather than
  weaker, which is exactly what putting policed float math inside the
  committed golden does.

## Scope in

- `engine/simmath3d`: the vec3, vec4, mat4 and quat types with `f64`
  components, and the full conventional operation set on them, per the
  operation inventory below (#70).
- The scalar base layer those types are built from, including D46's
  engine-provided deterministic `f64` transcendentals. S02b builds them:
  the rotation and interpolation constructors in the inventory are their
  first consumers, and S14 binds the sandbox's mod-visible names against
  these implementations rather than reimplementing them.
- The policed-surface record: an allow-list and a ban-list carried at the
  package's own declaration site, every banned entry naming its reason as
  either a cross-CPU bit-divergence source or a deferral that names the
  spec owning it.
- The three policing mechanisms below: the import ban, the builtin
  matrix-type token ban, and the compiler canary.
- The cross-CPU gate's two halves: canaries riding the existing test
  aggregator run, and the composition half extending S02a's committed
  world-hash golden (#72).
- The re-record of S02a's determinism-pyramid layer 3 with simmath3d in
  the canonical scenario, declared and triaged as a sanctioned re-record
  rather than a hand edit (#68).

## Scope out

- Any consumer of simmath3d. No renderer, no camera, no collision, no
  script binding. S03 is the first spec that draws with these types.
- Render-tier math, which runs unpoliced and off-hash (D11) and is
  covered by the skeleton golden tier from S04 on. This excludes math
  performed in the render tier; it does not remove any operation from the
  policed surface, which the inventory settles below.
- The wider surface S06 grows: mat3, vec2, and whatever PBR, culling and
  clustering need that this inventory does not already carry.
- Reviving the prototype's three-OS transcript job, its per-leg artifact
  upload, or its fan-in diff (#72). The map disclaims CI runner strategy
  beyond what this gate needs, which is S00's territory.
- Any change to S02a's pyramid layers 1, 2, 4 and 5. None of them carries
  a stored constant, so none is re-recorded here.
- Odin's fast-math attributes as a configuration surface. Contraction is
  opt-in and off by default (#71), so there is no flag this spec sets;
  there is only a token the scan forbids.

## The operation inventory

Settled on #70: the comprehensive v1 library. The obligation attached to
comprehensiveness is stated once here and holds for every group below.
**Every operation in this inventory ships with a deterministic
implementation and at least one canary sentinel pinning its exact bit
pattern.** An operation without a sentinel is not shipped, and the
mechanism that makes that a failure rather than an oversight is an
exported-surface reflection check named in the exit checklist, in the
same spirit as S02a's aggregator completeness check.

**Every component is `f64`.** vec3, vec4, mat4 and quat carry `f64`
components, one width across the sim tier, matching the `f64`
transcendentals D46 requires the engine to provide. Narrowing to `f32`
happens only at the GPU-facing boundary, where the draw-list build
converts, so nothing on the hashed path ever holds the narrow width.
This is a maintainer micro-ruling at landing (2026-07-31), settling the
question this document's drafting surfaced, and it fixes the shape of
every canary constant below: each sentinel pins a 64-bit pattern.

Two implementation rules bind every group, because #71's ban forecloses
the shapes a conventional library would reach for.

1. Every reduction, meaning every multiply-accumulate chain, is written
   as explicit scalar terms in a fixed summation order recorded at the
   site. The order is hash-defining: reassociating a dot product moves
   the golden even when no bit of any single operation changed.
2. Component-wise arithmetic over Odin's fixed-array types is permitted,
   because each component is one correctly-rounded basic operation with
   no fusion opportunity. The builtin `matrix` type is not, in any
   position, and neither is `core:math/linalg`.

### Group 1: the scalar base

| Kind | Operations |
|---|---|
| Roots | `sqrt` |
| Circular | `sin`, `cos`, `sincos`, `tan` |
| Inverse circular | `asin`, `acos`, `atan`, `atan2` |
| Exponential | `exp`, `log`, `pow` |
| Rounding | `floor`, `ceil`, `round`, `trunc`, `fract`, `mod` |
| Utility | `abs`, `min`, `max`, `clamp`, `sign`, `lerp`, `smoothstep`, `to_radians`, `to_degrees` |

**Canary obligation.** Every procedure carries a sentinel, whether it is
a re-export of a `core:math` procedure or an implementation this
repository owns, because a toolchain bump can move either. The four names
D46 calls out, `sin`, `cos`, `exp` and `pow`, carry sentinels at more
than one input each: they are the procedures a stock libm would answer
differently, so they are where a single well-chosen input is least
convincing.

The re-export and the implementation are not interchangeable here. A
`core:math` procedure that compiles to basic operations may be
re-exported; one that lowers to a platform libm call is replaced by an
implementation this repository owns, and the ban-list records which is
which and why.

### Group 2: vec3 and vec4

| Kind | Operations |
|---|---|
| Construction | `vec3`, `vec3_splat`, `vec4`, `vec4_splat`, `vec4_from_point`, `vec4_from_direction`, `vec3_from_vec4` |
| Component-wise | `add`, `sub`, `neg`, `mul`, `div`, `scale`, `min`, `max`, `clamp`, `abs`, `lerp` |
| Reductions | `dot`, `cross`, `length_squared`, `length`, `distance_squared`, `distance` |
| Normalization | `normalize`, `normalize_or`, `is_normalized` |
| Geometry | `reflect`, `project_onto`, `reject_from`, `angle_between`, `orthonormal_basis` |
| Predicates | `equals_exact`, `approx_equals`, `is_finite` |
| Homogeneous | `perspective_divide` |

**Canary obligation.** Every reduction carries a sentinel, because each
is a multiply-accumulate chain and that is precisely the shape
contraction would fuse. Every composition carries its own sentinel rather
than inheriting one from its parts: `length`, `distance`, `normalize`,
`angle_between` and `reflect` each fold a reduction into a group 1
procedure or a division, and a composition can diverge at a rounding step
that neither part exposes alone. Component-wise operations carry one
sentinel each, chosen over inputs whose exact result is not readable by
inspection, so the sentinel pins the rounding rather than restating the
arithmetic.

### Group 3: mat4

| Kind | Operations |
|---|---|
| Construction | `mat4_identity`, `mat4_zero`, `mat4_from_rows`, `mat4_from_columns`, `mat4_from_translation`, `mat4_from_scale`, `mat4_from_axis_angle`, `mat4_from_quat`, `mat4_trs` |
| Arithmetic | `mat4_add`, `mat4_sub`, `mat4_scale_by`, `mat4_mul` |
| Transforms | `mat4_transform_point`, `mat4_transform_direction`, `mat4_transform_vec4` |
| Structure | `mat4_transpose`, `mat4_determinant`, `mat4_inverse`, `mat4_inverse_rigid`, `mat4_inverse_affine`, `mat4_decompose_trs` |
| View and projection | `mat4_look_at`, `mat4_perspective`, `mat4_orthographic` |

**Canary obligation.** `mat4_mul`, all three transforms,
`mat4_determinant` and all three inverses carry sentinels: each is a
multiply-accumulate chain, and the inverses fold one into a division.
Constructors carry sentinels wherever they route through group 1, which
`mat4_from_axis_angle`, `mat4_look_at` and both projections do and
`mat4_from_translation` does not; the ones that only place their
arguments carry a sentinel proving placement instead.

Three conventions are fixed once and recorded at the package's
declaration site: storage order, the multiplication convention, and the
projection depth range and handedness. They are recorded rather than
discovered because flipping any of them later re-records every sentinel
in this group plus the layer 3 golden, and because a reader who has to
infer them from an implementation will eventually infer wrong.

The view and projection constructors stay in this inventory rather than
being deferred, by maintainer micro-ruling at landing (2026-07-31),
which takes the glossary's reading. The glossary defines simmath3d as
covering vec3, mat4, quat and the operations the renderer needs
([`docs/context/CONTEXT.md`](../context/CONTEXT.md)), #70 rules the full
conventional surface ships now, and the row's Scope out excludes math
performed in the render tier rather than excluding a policed constructor
that render code may call. `mat4_look_at`, `mat4_perspective` and
`mat4_orthographic` are therefore policed and canaried like every other
entry, and are noted as off-hash consumers: the render tier consumes the
view and projection matrices they build, so no world hash carries their
results even though every sentinel pins their bits.

### Group 4: quat

| Kind | Operations |
|---|---|
| Construction | `quat_identity`, `quat_from_axis_angle`, `quat_from_euler`, `quat_from_mat4`, `quat_from_to` |
| Arithmetic | `quat_mul`, `quat_conjugate`, `quat_inverse`, `quat_neg`, `quat_dot`, `quat_length`, `quat_normalize` |
| Application | `quat_rotate_vec3`, `quat_to_mat4`, `quat_axis`, `quat_angle` |
| Interpolation | `quat_nlerp`, `quat_slerp` |

**Canary obligation.** Every procedure in this group carries a sentinel.
`quat_mul` and `quat_rotate_vec3` are multiply-accumulate chains.
`quat_from_axis_angle`, `quat_from_euler`, `quat_slerp`, `quat_axis` and
`quat_angle` route through group 1 and are the transcendental-touching
operations #72 named as the ones whose corpus size is still open.
`quat_from_mat4` branches on the largest diagonal term, so it carries one
sentinel per branch: a sentinel that never enters a branch proves nothing
about it, and this is the one operation in the inventory where a single
input would leave three quarters of the implementation unpinned.

Two conventions ride with this group and are recorded beside the mat4
ones: the Euler angle order, and the hemisphere rule that makes
`quat_slerp` and `quat_nlerp` take the shortest arc.

### Group 5: degeneracy and the NaN rule

Degenerate input to a policed operation is a caller bug, not file or wire
input, so these are assertions rather than returned failures
([`docs/ODIN_STYLE.md`](../ODIN_STYLE.md) A8). Normalizing a zero-length
vector or quaternion asserts; inverting a singular matrix asserts;
`mat4_perspective` asserts on a degenerate frustum. `normalize_or` is the
surface for callers who legitimately have a zero vector, and it takes the
fallback rather than inventing one.

No policed operation may produce a NaN or an infinity from finite inputs.
This is stated as a rule because S02a's `hash_world` canonicalizes NaNs
at registered float lanes so the one permitted float nondeterminism
cannot move a golden, which means a NaN born inside simmath3d would be
laundered by the hash rather than caught by it. Asserting at the source
is what keeps the canonicalization a safety net for presentation-adjacent
lanes instead of a mask over a math bug.

**Canary obligation.** None: there are no bits to pin on a predicate or
an assertion. Each assertion instead carries a test proving it fires, per
ODIN_STYLE A3, with the same two constraints S02a recorded, that only
context-carrying assertions are interceptable and that the test body is
allocation-free before the assertion fires.

## The policing mechanisms

Settled on #71. The prototype's two-part mechanism is the right shape and
is reused by kind, but porting it literally would leave a hole exactly
where this spec's deliverable lives: the prototype's scalar surface had
no legitimate reason to reach for a matrix type, so its documented ban on
the builtin `matrix` type was never mechanized. `mat4` is this package's
deliverable, so the gap becomes load-bearing here.

This is not a compiler-flag answer. Odin's contraction control is opt-in
and off by default, so there is no flag to flip; the exposure is entirely
about which arithmetic surface the code reaches for, which a scan polices
and a flag cannot.

### 1. The import ban

The scan grows into S00's existing scan rule set rather than arriving as
a sibling script, so `just check` gains rules and not a recipe name.
Every sim-tier package is scanned for an import of `core:math/linalg` or
`core:math/rand`, matched on the import line, and a hit fails the build
with the offending file and line reported.

Two rules differ from the prototype's and are stated so the difference is
deliberate rather than drift.

- **`core:math/linalg` has no adapter exemption.** The prototype excludes
  its math package from this loop as the approved adapter. Here the ban
  covers `engine/simmath3d` too, per #70: linalg is banned *inside*
  simmath3d, because the vector and matrix typed operators are the
  divergence source and the adapter is exactly where a reflex reach for
  them would land.
- **`core:math` is exempt for `engine/simmath3d` alone.** That single
  exemption is what makes this package the adapter, and it is written as
  a named allowance rather than as the absence of a rule.

`core:math/rand` keeps its shape: banned across the sim tier, with
`engine/simrng` the approved surface (D1, S02a).

### 2. The builtin matrix-type token ban

New here, and the extension #71 identified. Odin's `matrix` type is core
syntax and needs no import, so an import-line scan cannot see it. The
rule is therefore token-level: `engine/simmath3d` is scanned for the
`matrix` type in any position, declarations, type expressions, casts and
the matrix intrinsics included, and there is no exemption for any
package or any file.

One further token rule goes beyond what #71 named, and it is kept by
maintainer micro-ruling at landing (2026-07-31) rather than carried as a
drafter's addition a reviewer might strike. The sim tier is scanned for
the contraction-enabling tokens, meaning Odin's fast-math attribute and
the contract flag, and for `math.fmuladd` and the fused-multiply-add
intrinsic. #71's own finding is that contraction is opt-in and off by
default; banning the tokens turns "off by default" into "off by
construction", and costs one more pattern in a scan that is already
running.

Every pattern in this scan carries a self-test that plants a violation
and asserts the pattern matches it. The prototype carries its self-test
as a comment describing how to run it by hand. Here it runs inside the
gate, because a scan pattern that has silently stopped matching is the
one failure mode a scan cannot report.

### 3. The compiler canary

A unit test asserting exact bit patterns for sentinel expressions across
the whole inventory, riding the existing test aggregator. Four properties
of the prototype's technique carry unchanged.

- **Inputs live in mutable globals** so the optimizer cannot
  constant-fold the expression away. A canary that is folded at compile
  time tests the constant folder, not the codegen the sim will run.
- **Comparison is on transmuted bits**, meaning the `u64` image of an
  `f64` result rather than a float equality or a tolerance, with
  `#assert` on the size of every type whose bits are compared, since
  bit-exactness is only meaningful at a fixed width (ODIN_STYLE A5).
- **The failure message carries the observed bits** in the exact literal
  form the constant is written in.
- **A moved canary is a release blocker, not a constant to update.** It
  is triaged as a regression or as a sanctioned re-record before anything
  is touched, and the only sanctioned cause is a deliberate, recorded
  toolchain bump.

Two properties are new here.

- **The constants are recorded through S02a's golden-recording
  mechanism** (#68) rather than by hand-copying from a failure message:
  one compile-time define, defaulting off, whose update branch
  deliberately fails and prints the exact constant text, re-recorded by
  running a single named test. That also puts the canary constants inside
  the `golden-hashes` skill and the `golden-recorder` agent's refusal
  discipline, which is where a hand edit would otherwise be easiest.
- **The toolchain identity is recorded beside the constants**: the Odin
  version, its date, and the host the constants were computed on. The
  constants are a claim about a compiler as much as about a CPU, and the
  claim is unreadable without saying which compiler. This repository has
  no recorded Odin version pin for that identity to name, which is an
  open question below.

## The cross-CPU gate

Settled on #72: both halves are warranted, and neither is a new CI job.
Both run inside `just check` on `macos-26` and `ubuntu-24.04`, S00's two
legs, which are the macOS arm64 and Linux x86-64 of the row's Working
software field.

### The raw-op half

The canaries are the raw-op half. Each is a committed constant verified
independently on each leg by the same test binary the aggregator already
runs, which means the marginal CI cost of this half is the runtime of one
fast unit test and nothing else. Its evidentiary value is localization: a
canary failure names the operation, the input and the observed bits,
which is the diagnosis a moved world hash cannot give.

Its structural limit is stated here rather than discovered later. A
canary pins one operation at one input. It cannot see drift that only
appears under accumulation, and it cannot see an operation that is
correct in isolation being called in a different order by two builds.
That is what the composition half is for.

### The composition half

S02a's determinism pyramid already carries the shape this needs at layer
3: one committed world-hash golden for one scenario, verified on both CI
legs, which S02a names as its cross-platform claim and points at this
spec as the place policed float math arrives to test it
([`S02a`](S02a-prototype-kernel-port.md)). The composition half extends
that layer rather than standing beside it.

- The canonical harness scenario gains sim state carrying simmath3d
  types and systems that exercise the inventory each tick, so the
  composed float math is inside the hashed world rather than beside it.
- Layer 3's committed golden is re-recorded once, with simmath3d in play,
  through the define rather than by hand. The re-record is declared and
  triaged as sanctioned before it happens (#68).
- Layers 1, 2, 4 and 5 stay green unchanged and carry no stored constant,
  so none of them is re-recorded.
- Nothing else about the pyramid moves. This spec adds no layer and no
  recipe name; S21 owns the gate roster.

What this deliberately does not build is the prototype's separate
transcript machinery: a per-leg replay binary writing a periodic hash
trace, per-leg artifact upload, and a fan-in job diffing the traces. That
mechanism is not live in the prototype's own pipeline today, it was the
first thing cut when platform trouble hit it, and this repository has
already settled a cheaper shape for the identical cross-platform claim.
Reintroducing it would also be a CI runner-strategy call that map #69
disclaims and S00 owns (#72).

### What the win rig does and does not add

The canaries and the layer 3 golden are reachable from `just win-check`
on the local Windows rig, which makes a third CPU available as a
report-only observation. Nothing in this spec gates on it, S01's
compile-only Windows CI job runs no tests and therefore verifies no
constant here, and a green Windows check may not be read as cross-CPU
coverage.

## Grilling dispositions

Settled on the children of wayfinder map #69, all closed. Each answer
comment on the tracker holds the reasoning; the rows below hold the
ruling.

| # | Disposition |
|---|---|
| #70 | Comprehensive v1 library. The full conventional vec3/mat4/quat surface ships at S02b, every operation with its deterministic implementation and canary coverage up front, rather than a minimal subset grown one function at a time. Transcendentals route through D46's engine-provided implementations. `core:math/linalg` and Odin's builtin `matrix` type are token-banned inside simmath3d itself. |
| #71 | The prototype's two-part mechanism extends rather than ports: the canary set grows to the 3D operations by the same technique, and the scan gains a token-level ban on the builtin `matrix` type inside simmath3d with no adapter exemption. Not a compiler-flag answer, since contraction is opt-in and off by default. |
| #72 | Both halves, neither a new CI job. Canaries carry the raw-op half riding the existing test run; the composition half extends S02a's committed-golden layer instead of reviving the prototype's removed three-OS transcript machinery. |

## Implementation order

Suggested, not binding; `/to-tickets` owns the breakdown.

1. The package skeleton and the policed-surface record: the allow-list,
   the ban-list, and the per-entry rationale, written before there is an
   implementation to describe.
2. All three scans, with their planted-violation self-tests, against the
   still-empty package.
3. The scalar base layer and its canaries, including the deterministic
   replacements for the libm-backed transcendentals.
4. The canary recording define on S02a's mechanism, before the corpus
   grows past what is comfortable to bootstrap by hand.
5. vec3 and vec4 with their canaries.
6. mat4: the conventions recorded first, then multiply and the
   transforms, then determinant, then the inverses.
7. quat, including the branch-per-sentinel coverage on `quat_from_mat4`.
8. The exported-surface reflection check that fails on an operation with
   no sentinel.
9. The harness scenario extension, then the layer 3 golden re-record.

Step 2 before step 3 is the one ordering constraint that is not merely
convenient. A scan is cheapest to make red on purpose against an empty
package, and a scan landed after the code it polices is a scan whose
first job is to be argued into passing. It is the same reason S02a lands
its boundary seam before treating a golden as frozen.

Step 9 last follows from the same logic in reverse: the golden cannot be
re-recorded until the inventory it hashes has stopped changing.

## Exit checklist

- [ ] `engine/simmath3d` present with the full inventory above, green in
      `just check` on `macos-26` and `ubuntu-24.04`.
- [ ] Every operation in the inventory carries at least one canary
      sentinel, and the reflection check fails when an exported operation
      is added without one.
- [ ] `quat_from_mat4` carries one sentinel per branch, demonstrated by
      showing each branch entered.
- [ ] The canary test fails on a deliberately perturbed constant, and its
      failure message carries the observed bits in pasteable form.
- [ ] Every canary constant recorded through the define rather than
      hand-written, with the recording invocation written down.
- [ ] The toolchain identity recorded beside the constants: Odin version,
      date, and host.
- [ ] The scan fails a planted `core:math/linalg` import inside
      `engine/simmath3d`, demonstrated, proving the no-adapter-exemption
      rule.
- [ ] The scan fails a planted builtin `matrix` declaration inside
      `engine/simmath3d`, demonstrated.
- [ ] The scan fails a planted contraction attribute and a planted
      `math.fmuladd` call in the sim tier, demonstrated.
- [ ] Every scan pattern's self-test runs inside the gate and fails when
      its pattern is deliberately broken.
- [ ] The allow-list and ban-list complete at the declaration site, every
      banned entry naming either a cross-CPU divergence source or the
      spec that owns its deferral.
- [ ] The storage order, multiplication convention, projection depth
      range and handedness, Euler order and slerp hemisphere rule all
      recorded at the declaration site.
- [ ] A zero-length `normalize`, a singular `mat4_inverse` and a
      degenerate `mat4_perspective` each assert, with a test proving each
      assertion fires.
- [ ] S02a's determinism pyramid green on all five layers with simmath3d
      types in the canonical scenario.
- [ ] Layer 3's golden re-recorded with simmath3d in play, the re-record
      declared and triaged as sanctioned before it was taken.
- [ ] Every open question below either answered on a ticket or carried
      forward explicitly, never dropped.

Reaching **implemented** is the maintainer's call once this checklist is
clear and the gate is green.

## Course

Module S02b; path tag engine. Teaches simmath3d and cross-CPU determinism
against the cross-platform hash gate. Authored after **implemented**, per
D27.

## Prototype ports

The simmath policed-surface pattern: the policed-surface declaration-site
record, the import-boundary scan, and the compiler-canary technique,
meaning the mutable-global inputs, the transmuted-bit comparison, and the
toolchain-pinned bootstrap. The scan's rule set and the canary's corpus
both grow here rather than porting, per #71.

No constant ports. Every canary bit pattern is computed fresh against
this repository's toolchain, and the prototype's own constants are
evidence that the technique works rather than values to inherit. Ports
are test-first from a source to read, never a target to converge with
(D38).

## Open questions

The three children of map #69 are all closed. What follows is the
residue: what #72 recorded as unsettled, and what drafting this document
surfaced that landing did not settle.

Carried from #72's resolution:

- **Composed-scenario mechanics.** What the layer 3 scenario actually
  composes of simmath3d, and whether a mid-scenario periodic hash,
  bisectable the way a stride knob is, earns its cost over a single
  endpoint golden given that canaries already localize per-operation
  regressions. The recorded posture is that this is decided during
  implementation and reviewed at this spec's exit; the maintainer owns
  it.
- **Canary corpus-size policy.** How many known-answer inputs per
  operation, and whether every transcendental-touching operation gets its
  own sentinel rather than inheriting coverage from the group 1 procedure
  it calls. The comprehensive-inventory ruling sizes the corpus up
  without fixing its density. The maintainer owns it.

Surfaced while drafting:

- **The package home of D46's transcendental implementations.** S02b
  builds them, per the ruling above. Whether they sit inside
  `engine/simmath3d` or in a sibling scalar package beside it is
  unsettled. Either home satisfies S14's dependency and neither moves a
  canary constant, so this is a layout call the implementation takes and
  the maintainer owns.
- **The Odin toolchain pin.** The canary constants are a claim about a
  compiler as well as about a CPU, and nothing in this repository records
  which Odin version the gates run against. The pin belongs with S00's CI
  and toolchain rules rather than here, and this spec's constants are
  meaningful only once it exists.

Four further questions, three surfaced while drafting and one carried
from map #69's own not-yet-specified list, were settled by maintainer
micro-ruling at landing (2026-07-31) and live in the normative text above
rather than here: the `f64` component width, that this spec builds D46's
transcendentals and that S14's `Depends on` gains S02b, that the view and
projection constructors stay in the policed surface, and the row's
superseded "subset" wording.
