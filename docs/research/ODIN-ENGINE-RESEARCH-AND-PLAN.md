# The Successor Engine: Research and Plan

**Status:** definitive research + plan for the maintainer's new engine, superseding
neither the SVSW decision log nor the maintainer's authority — every "decide now"
item below is a proposed default awaiting a logged decision.
**Mandate (fixed):** a 3D engine; fully headless-runnable (simulate + render
off-screen + verify with no window, generalizing SVSW's headless-verify /
golden-hash discipline); a real editor; "everything an engine should have";
Odin core, Lua sandboxed gameplay scripting, Go online services.
**Companion documents:** per-repo Carbon detail lives in
[carbon-repo-deep-dives.md](carbon-repo-deep-dives.md); the SVSW port ledger in
[svsw-carry-forward.md](svsw-carry-forward.md); ecosystem context in
[ecosystem-context.md](ecosystem-context.md); critique dispositions in
[design-review-notes.md](design-review-notes.md). Codex's prior proposal is
[successor-engine-plan.md](successor-engine-plan.md) and is engaged directly in
§7.

**Supersession note:** the maintainer's grilling decisions, recorded in
[ROADMAP.md](ROADMAP.md), override the positions this plan takes on the GPU
backend, the platform layer, lighting scope, HUD technology, editor Lua, and
multiplayer timing. ROADMAP.md's Overrides table maps each superseded position
to its replacement; this plan keeps the original positions in place as the
research record and does not restate the table.

---

## 1. Executive summary

Build the successor as an **in-place evolution of SVSW**, not a fresh monorepo.
SVSW's deterministic spine — fixed-timestep kernel, sparse-set ECS, seeded
PCG32, XXH3 world hashing, the sandboxed Lua boundary, the Factorio-style mod
pipeline, and the `just check` gate machinery — is already dimension-agnostic
and battle-tested; the plan's earlier draft said these subsystems "port nearly
verbatim," which is the strongest possible argument for not moving them at all.
New packages (`engine/simmath3d`, `engine/render3d`, `engine/anim`, an asset
compiler, an editor tier) grow beside the existing ones under the existing
gates, and the 2D renderer is deleted only when 3D reaches parity. CI stays
green through the whole transition.

The new work, in build order: a **policed deterministic 3D math
library** (extending `engine/simmath`'s documented no-FMA / no-`core:math/linalg`
policy — the single hardest technical problem, gated from the start by a
same-OS/cross-CPU golden-hash check); a **3D renderer** structured as a
sokol-free CPU core that emits a plain **draw-list data structure**, with
`engine/render3d/gpu` as its single sokol-gfx consumer — no Trinity-style
adapter interfaces, preserving logged decision D15; a **shader toolchain**
(sokol-shdc, version-pinned) that the earlier draft omitted entirely; a
**CMF-inspired sectioned binary asset container** (`.sva`) with an offline
glTF/texture compiler; and an **editor** built as a fourth SDK tier on a typed
command stream, rendered with vendored Dear ImGui (quarantined, editor-tier
only) rather than an in-house UI framework.

Headless verification generalizes to three tiers: (1) the **world hash** —
sim truth, unchanged; (2) a **draw-list skeleton hash** — XXH3 over the
discrete/ordinal fields of the submission stream (pipeline ids, resource
handles, draw order, counts), CPU-only and portable, the 3D replacement for
the 2D CPU oracle; (3) **offscreen readback goldens** — perceptual-tolerance
pixel comparison on a pinned machine. **Dual-mode parity (D72)** is a hard
requirement across all three tiers: the engine runs headless and windowed
from the same scenario and produces the same results (identical world
hashes, identical draw-list skeleton hashes, comparable readback goldens), so
an AI agent that invokes the engine headless can trust its result matches
what a windowed run shows a human. A parity gate runs the same scenario in
both modes and asserts the hashes are identical. Phase 0 is a textured cube
orbited by a deterministic camera, stepped headless, asserting all three
goldens with no window: the smallest thing that proves the 3D + headless
architecture.

Lua remains the gameplay/modding language behind the existing sandbox; Go
remains the online-services shell behind Codex's three-call worker
seam — adopted as a **draft contract plus dependency-arrow guardrails**, frozen
after a walking-skeleton conformance proof at the start of Go implementation.
The game brief — its specifics kept in private product requirements outside
this repository — sets the requirements for deterministic 3D physics,
replication, and the Go services; the engine finishes first, vertical slices
along the way are engine verification scenes, and game production starts
after the engine is complete. Carbon (30 of 33 repos MIT) is a reading
library and pattern reference, never a linked dependency; code porting is
per-file-checked and exception-only.

---

## 2. What Carbon teaches

Carbon's 33 open-sourced repos are the mature-architecture reference: what
each subsystem looks like after two decades of shipping EVE Online. The value
is almost entirely in **boundaries and lifecycles**, not in code to port.
Per-repo detail, file citations, and license notes are in
[carbon-repo-deep-dives.md](carbon-repo-deep-dives.md); this section is the
distillation.

### 2.1 Transferable patterns

**The adapter-layer *discipline* (trinity/trinityal).** Trinity's CPU core
codes against narrow backend-agnostic interfaces (`Tr2BufferAL`,
`Tr2TextureAL`, `Tr2RenderContextAL`) with dx11/dx12/metal implementations —
and, crucially, a **stub backend** (`trinityal/stub`) for headless and
testing. This validates SVSW's D15 split at three-backend scale and proves a
device-less backend is a first-class engine component. We adopt the
*discipline* (sokol-free core, thin submission stratum, headless path) but
**not the mechanism**: sokol-gfx already *is* the multi-API abstraction layer,
so a second hand-rolled interface layer over it would duplicate its job and
reopen D15 ("no GPU abstraction layer beyond sokol_gfx"). The seam becomes a
data structure — a recorded draw-list — rather than a polymorphic backend
(§4.3).

**Frame-as-composable-steps (trinity/RenderJob).** ~40 small `TriStep*`
objects (`TriStepSetRenderTarget`, `TriStepRenderScene`, `TriStepResolve`)
assembled into an ordered `TriRenderJob` instead of one monolithic `Render()`.
The Odin form is an ordered slice of plain step structs, testable per step —
no polymorphism, no script-reorderable graph.

**The asset artifact lifecycle (carbon-mesh/CMF, red-to-black,
carbon-resources).** The single most portable Carbon design: one flat binary
container with a header + section table (offset/size/compression/gpuAlignment
per section in `include/cmf/v1.h`), small typed metadata separated from raw
GPU-ready blobs, arena-lifetime loading, multi-LOD/skeleton/animation as
independently addressable slices, and the animation *runtime* kept separate
from the storage *format*. red-to-black adds the authored-source vs
baked-binary split with a dedicated offline cooker; carbon-resources adds
explicit on-disk schema versioning with a supported-version whitelist. All of
this maps directly onto the mandated asset pipeline (§4.4). One steal we
explicitly decline: CMF's tagged offset/pointer union in `SpanRepr` — clever,
mmap-friendly, and UB-adjacent; two clearly named load paths instead.

**Physically separated binding files.** 591 `*_Blue.cpp` companion files (492
in trinity) keep reflection glue out of core logic. SVSW's D42 opt-in binding
packages are the same idea done smaller and by hand — Carbon proves it scales;
the scale itself is the anti-lesson (below).

**One error funnel per boundary type.** imagetools' and pathfinder's pattern
— a single `Be::Result<Code>` → script-exception mapping function per result
type, with a static message table — is exactly the shape the successor's Lua
error funnel should keep (SVSW already centralizes containment; the enum-table
funnel makes it auditable).

**Lock-state RAII at every re-entry (blue's `PyGilEnsure`, carbon-io's GIL
guards).** Carbon's discipline of acquiring interpreter state at the exact
point a native callback re-enters the runtime, scoped and always released,
is the C++/Python spelling of SVSW's R1–R5 rules (`proc "c"` context
reconstruction, pcall-only entry). Corroboration, not new work.

**Deterministic-point IO pumping (carbon-io).** One non-blocking
`uv_run(NOWAIT)` per engine tick, at a fixed point in the frame — the pattern
any future async asset IO or network drain must follow to stay outside the
deterministic tick.

**Instrumentation in the base layer (carbon-core → tracy; ccp `CCP_STATS`
zones).** Profiling is a dependency of the *lowest* layer, not a bolt-on.
Nearly free at design time, unaffordable to retrofit.

**Weighted-score culling (carbon-audio `SoundPrioritization`).** A pure
function scoring N objects to cap an "awake" set — reusable for audio voice
budgets and any more-entities-than-budget problem, flattened into ECS
components rather than an interface.

**Offline shader compilation as a separate tool (shadercompiler/).** Carbon
ships a whole lexer/parser/per-backend-emitter toolchain as a standalone
binary, outside the runtime. The successor does not need a bespoke compiler —
sokol-shdc exists — but the *shape* (offline, versioned, gated out of shipped
builds) is the reference, and the earlier draft's total omission of a shader
pipeline was a real gap this fills (§4.3).

### 2.2 Anti-lessons

- **Script-owns-the-loop (blue).** Blue *is* the application shell: Stackless
  tasklets drive the frame, C++ serves underneath. That inversion is
  wall-clock-driven non-determinism by construction and is the exact opposite
  of SVSW's D11 core-drives-the-tick model. Never import it.
- **Reflection-macro binding at scale (BLUE_CLASS / EXPOSURE_BEGIN).** A
  large hand-rolled metaprogramming layer exposing near-total engine surface
  to script. D42's curated, hand-written surface is deliberately narrower;
  keep it that way.
- **Triple native GPU backends, raytracing, the PBR post stack, TBB
  parallel-for in the renderer.** MMO-shipping-scale engineering. sokol-only
  is the right scope; sim parallelism would violate D11's design.
- **Embedded CPython (~20 vendoring patches) and the forced Stackless →
  Greenlet migration.** A multi-year, two-conference-talk unwind of a forked
  runtime dependency. SVSW's stock Lua 5.4 choice is confirmed, not merely
  acceptable.
- **MMO fleet machinery**: pdm hardware telemetry, ccp-debug-info symbol
  servers, Prometheus-in-every-class, Windows-service entrypoints, SQL Server
  pooling, interest-management bubbles. Wrong scale; explicit non-goals.
- **God objects and landmines (destiny's `Ballpark`, `randomIntWRONG`).**
  1200-line owning classes with friend-class reach-ins, and deliberately
  broken code left compiled. SVSW's ECS separation and TIGER_STYLE gates
  already forbid both.
- **Silent failure at the script boundary (ime).** Missing-DLL calls
  degrading to `false`/0 with no error. SVSW's loud-containment philosophy is
  the correction — and where SVSW itself silently no-ops (mis-named `position`
  component drawing nothing), the successor prefers a raised, contained error.

---

## 3. SVSW carry-forward

The full ledger is [svsw-carry-forward.md](svsw-carry-forward.md). Summary,
with decision-log citations:

### 3.1 Keep in place, unchanged

- **D11 determinism-by-construction**: fixed timestep, ordered sparse-set
  iteration, engine-seeded PCG32 per system slot, no wall clock reachable from
  sim code. This is the engine's identity and underwrites replay, save,
  testing, and any future lockstep.
- **The kernel tier** (`engine/kernel`, `engine/ecs`, `engine/simrng`): the
  survey confirms nothing in it assumes 2D. `hash_world`'s length-prefixed
  streaming XXH3, the layout-locking `#assert`s, NaN canonicalization, the
  command buffer, and the four-layer determinism test pyramid stay as they
  are. (An earlier draft proposed designing incremental per-pool hash hooks
  in now; cut as speculative — XXH3 throughput makes linear hashing a
  non-problem at this scale, and restructuring later is a contained refactor.)
- **D9's replication seam** as a discipline (sim ↔ presentation only through
  defined interfaces), independent of the lockstep topology built on it.
- **The off-hash presentation-state pattern** (gated "forbidden inside a
  system," proven golden-neutral) reused across D18/D25/D33/D40/D46/D49/D50/
  D51 — the mechanism for every new non-sim Lua surface.
- **The Lua boundary and mod system** (D5, D25→D38, D42): whitelist sandbox,
  allocator cap + shared instruction budget with the pcall/coroutine evasion
  fixes, R1–R5 longjmp rules, disable-mod-in-place containment,
  settings→data→control pipeline, Kahn-over-sorted-names resolution,
  slot-stable hot reload, atomic storage. Three known weaknesses get fixed as
  **ordinary standalone refactors on live code** (not during any port):
  a single call-context enum replacing the scattered gate booleans; a typed
  subsystem-slot registry replacing `Script_Host`'s rawptr+teardown accretion;
  and D38's uniform-sealing sandbox answer adopted as the settled boundary.
- **D15's layer split** and its mechanical `boundary-scan` gate, extended to
  the new render packages.
- **D42's tier architecture** (core/headless/client via import graph +
  `tier_scan.sh`), extended with a fourth **editor tier**.
- **The gate machinery**: `just check` composition, golden hashes at every
  tier boundary, `scaffold-check`, api-surface snapshots, TIGER_STYLE's
  38-item checklist, quarantine-first vendoring (VENDOR.md, pin by
  checksum/commit). One process fix: a single parameterized golden-compare
  script replaces the four near-duplicate justfile recipes before any new
  golden gate is added.
- **Audio** (`engine/audio`): the push-model 16-voice mixer gains one additive
  listener-relative spatialization stage; not a rewrite.
- **Input** (`engine/input`): the three-stage seam ports untouched; only
  cursor picking changes (inverse-VP ray instead of the 2D closed-form
  `screen_to_world`). The stubbed Windows/Linux gamepad gap is fixed when
  those platforms come online.

### 3.2 Redesign or reverse, with reasons

- **D6 (no editor)** is formally reversed by mandate. The tier architecture
  is what makes that safe (§4.6).
- **The render core is a rewrite, not an extension.** `Sprite_Instance`'s
  52-byte billboard ABI, `Camera_2D`'s ortho-only closed-form inverse, the
  painter's-algorithm sort with no depth state, and the single hardcoded
  `sg.Pipeline` have no 3D upgrade path (survey: `engine/render/batch.odin`,
  `camera.odin`, `gpu/gpu.odin`). The 2D renderer stays shipping until
  `engine/render3d` reaches parity, then is retired.
- **D16→D53 (UI over Clay)**: six reactive decisions driven by a pre-1.0
  vendored library's hardcoded limits. An in-house layout engine would gate
  the editor behind a second full project, so the correction is: keep the
  paid-for Clay command-stream surface for game HUD, vendor **Dear ImGui**
  for editor chrome (quarantined, editor tier only, never in game builds),
  and build an own layout core only if a shipped game's HUD outgrows Clay.
- **D22-up save versioning (hard-reject-on-bump)** is kept for wire formats
  but corrected for assets: the `.sva` policy is version whitelist + **never
  discard authored sources** + re-bake via the asset compiler on bump. No
  in-format migration code (an earlier draft's "migration path" requirement
  reduced, on inspection, to exactly this).
- **The Box2D warm-start caveat** (save/load reproducible but not
  bit-identical past load) is the standing proof that black-box physics
  middleware forfeits the engine's differentiator. Consequence in §4.8.
- **D41/D10 multiplayer decisions stand** (Go for both server archetypes,
  SpacetimeDB rejected, Rust tripwire intact); the three-call worker seam is
  the headless-sim-wrapper archetype made concrete (§4.9), reconciled
  explicitly rather than rediscovered.

---

## 4. Proposed architecture

### 4.1 Repository strategy: evolve SVSW in place

The successor is SVSW's next major phase, in the same repo. New packages grow
beside existing ones; the decision log, beads DB, CI, justfile, goldens, and
course/sample lines continue uninterrupted. The 2D engine remains the shipped
product during the transition (the Steam-feasibility and RPG/course lines are
unaffected), and `just check` never goes dark for a repo bootstrap. A fresh
monorepo is taken **only if the maintainer names a concrete forcing reason**;
if so, the migration (gates, goldens, beads, decision-log import) becomes an
explicit phase-zero line item with an owner. This resolves the earlier draft's
largest structural gap — it assumed a fresh repo everywhere while parking the
question as "open."

### 4.2 Language split

**Odin** owns the entire engine and all tools: kernel/ECS/simrng, simmath3d,
render3d CPU core + gpu submission stratum (the only new package allowed to
import sokol, alongside platform — D15 unchanged), animation runtime, asset
runtime and the offline compiler, audio, input, the Lua host, the CLI, the
editor binary, and the future headless worker. C exists only as vendored,
pinned source (Lua 5.4, sokol, and the named asset-pipeline deps in §4.4) at
the platform/tool tiers.

**Lua 5.4** (sandboxed, budgeted, contained) owns gameplay and content:
systems, schemas, data-stage content and patching, settings, game/mod UI
(off-hash, gated). Lua never sees engine internals, sockets, the filesystem
beyond `svsw.storage`, GPU handles, or Go. There is **no editor Lua host in
v1** — editor features are Odin code in the editor tier; if a real extension
need appears post-v1, the existing mod-sandbox VM with a widened whitelist is
the starting point, not a parallel embedding.

**Go** owns online services exclusively, later: transport/TLS, auth,
lobby/matchmaking, worker supervision (spawn/watchdog/epoch CAS), the sole
durable Tick_Commit log, opaque checkpoint storage, an idempotent outbox. Go
never implements or imports ECS, physics, gameplay, or hashing. Its entire
contact surface is the three-call worker seam (§4.9).

**Threading model (logged as a decision):** the simulation is single-threaded
per Session, deterministic by construction. Asset decode may run on worker
threads, but results integrate at exactly one deterministic point per frame
(the carbon-io pump pattern; Trinity's load-fence poll). Renderer and audio
stay main-thread until profiling forces otherwise; any parallel-sim ambition
goes through the decision log.

### 4.3 Renderer: draw-list core + single sokol consumer + shader toolchain

`engine/render3d` (sokol-free, boundary-scanned) owns: scene representation;
a real camera (position/quaternion/FOV/near-far; picking via inverse-VP rays);
frustum culling; a material system; opaque draw ordering via **depth buffer**
(no CPU painter's sort) and a separate back-to-front transparent pass sorted
by view depth; light gathering; and the frame as an ordered slice of step
structs (Trinity's RenderJob shape, monomorphic).

Its output is a **plain draw-list**: a recorded stream of step/draw structs
(pipeline id, bind sets, buffer/texture handles, instance ranges, uniform
blocks). `engine/render3d/gpu` is the **single consumer**, walking the list
and emitting `sg.*` calls. Headless mode simply never calls the gpu package —
the "null backend" is ~zero code, falling out of the data-structure seam.
`SOKOL_DUMMY_BACKEND` covers device-less link/validation tests of the gpu
package itself. If a second backend (wgpu) ever becomes concretely necessary,
it is a second consumer of the same struct stream — no interface vtable is
built today. This preserves D15 verbatim and replaces the earlier draft's
Trinity-style AL interfaces, which would have duplicated sokol's own job.

**Draw-list hashing — the portability fork, decided.** The submission stream
contains floats produced by render-side math (view/projection matrices,
transforms), which is *presentation* math and deliberately outside simmath3d's
policed no-FMA regime. Therefore the **portable CI tier hashes only the
discrete/ordinal skeleton** of the draw list: pipeline ids, resource handles,
draw order, counts, pass structure — floats excluded. This catches culling,
sorting, material-assignment, and pass-structure regressions cross-platform
with zero GPU. A **full-byte draw-list hash** is available as a same-machine
golden (like today's GL goldens) where it is stable. Both get a one-command
re-record workflow from the start, because renderer development churns them.
The skeleton hash is also the D72 parity anchor: windowed and headless runs
record the same draw-list, so the parity gate compares skeleton hashes (and
world hashes) across the two modes and fails on any divergence.

**Shader pipeline (new subsystem, previously missing).** Hand-authoring
per-backend shaders (today's `sprite.glsl` + hand-written MSL) is dead on
arrival for 3D material permutations. Adopt **sokol-shdc**: offline
cross-compilation with reflection into Odin bind structs, version-pinned under
the standing toolchain-pinning policy (the same policy that pins emcc), run
from the asset/tool tier and gated out of shipped builds (Carbon's
shadercompiler shape). Variant strategy: a fixed small permutation set (lit/
unlit × skinned/static × alpha modes), not a combinatorial ubershader; the
permutation key is the pipeline-cache key. `just shader-check` extends to the
whole shader corpus. Lighting scope for v1 is minimal-forward: Blinn-Phong,
one shadow-mapped directional light, point lights unshadowed — PBR is a later,
logged decision.

### 4.4 Asset pipeline: `.sva` container + `assetc`

One versioned container, CMF's shape: magic/kind/schema-version header;
section table (offset/size/compression/gpu-alignment/type); importer id +
version and source digests; stable logical content ID; per-section and
whole-file checksums (Codex's artifact header, adopted). Simulation only ever
sees stable logical IDs — never readiness or load order.

`tools/assetc` (Odin CLI under `cli/`, never in shipped builds): **v1 scope is
static meshes + textures + materials** — everything renderer bring-up, the
asset viewer, and the editor need. Skeleton/animation sections land with the
animation subsystem (§4.5), after the pose-determinism decision is logged.
Audio bake (WAV/OGG → sections) is a small assetc extension in the same phase
as the editor's asset browser.

**Named vendored dependencies, quarantined now, not discovered later:**
`cgltf` for glTF import; a GPU texture encoder (bc7enc or astcenc). Both go
through the standard review/pin/VENDOR.md path with hostile-input hardening
per the existing codec discipline, and the **encoder version is recorded in
the `.sva` importer-version field** so encoder bumps surface as detectable
provenance changes, not mysterious golden drift.

Versioning policy (final): supported-version whitelist; authored sources are
never deleted; a version bump means re-bake via assetc. No runtime migration
code. Hot-reload contract per asset kind: textures/materials hot-swap in the
editor and dev loop; meshes reload with handle stability; `.sva` changes never
touch sim state. Scene/prefab serialization is decided alongside the container
work: scenes are **data-stage content** — the same Lua data files + `.sva`
references mods use — so the editor writes what the engine already loads, and
no second scene format exists.

### 4.5 Animation (new subsystem, previously a hole)

**Determinism contract, logged now (default, not deferred to a brief):**
skeletal poses are **off-hash presentation**; gameplay hitboxes are explicit
sim colliders animated by keyframe index or curve values that *are* sim state.
This keeps the pose sampler out of simmath3d's policed rules while keeping
gameplay-relevant animation deterministic. If the game later needs
pose-driven sim (full-body physics hit detection), that is a logged revisit
with known cost.

Scope, in order: sampler (keyframe curves, CMF's `SampleScalarCurve`/
`SampleQuaternionCurve` shape) → linear blend (uniform and per-bone-mask,
CMF's `BlendPoses`) → GPU skinning path in render3d → state machines last,
only when the game brief demands them. The runtime operates purely on `.sva` POD sections —
CMF's storage/runtime separation, kept.

### 4.6 Editor

An Odin binary in a new **editor tier** — a privileged client of the SDK,
enforced by tier-scan, never a fork of the engine. Chrome is **Dear ImGui**
(vendored, quarantined, editor tier only). Architecture decisions fixed up
front, features sequenced:

- **Command stream first**: every edit operation is a typed command; undo/redo
  and edit persistence are command-log mechanisms, philosophically aligned
  with the replay codec.
- **Play-in-editor is a real Session**: entering play mode boots the standard
  deterministic Session; the editor displays the live world hash and supports
  tick stepping and replay scrubbing — the editor doubles as a determinism
  inspection tool, which is the feature no other engine's editor has.
- **Feature sequence** (not a monolithic v1): standalone **asset viewer**
  (CarbonMeshViewer's role — the pipeline's proving ground, shipped before the
  editor proper) → scene tree + inspector + play/pause/step + hash display →
  asset browser → gizmos (picking via geometry-only ray casts against render
  mesh AABBs — no physics dependency) → profiler panel. Anything beyond that
  list waits for a real scene to demand it.
- Scene edits write data-stage content (§4.4); the editor has no private
  formats.

### 4.7 Profiling

spall zones (`core:prof/spall`) baked into the kernel from the first new
package: every system update, render step, and asset load emits a zone in dev
builds, compiled out in retail (carbon-core's tracy-at-the-base lesson).
`just stress` keeps its measured p95 budgets and grows additional **hardcoded
Odin scenes** when budget questions demand them — no scenario-file format
(tooling-for-tooling, cut). Frame timing, draw/instance counts, and Lua budget
consumption surface in the editor's profiler panel as plain counters.

### 4.8 Physics: rays now, collision core scoped by the game brief

v1 ships **picking/query rays only** (ray vs AABB/sphere over ECS components
— needed by the editor and cursor picking regardless). The deterministic 3D
collision core **takes its scope from the game brief**: the game brief's
envelope decides which primitives and sweeps the deterministic path needs,
and SVSW's own first game (D31 era) shipped with game-side Lua collision, so
the core covers only what that envelope requires. The scope is Destiny's
envelope *narrowed by the feasibility critique*: primitives vs primitives and
primitives vs **baked convex decompositions or heightfield proxies** — no
swept-vs-arbitrary-triangle-mesh in the deterministic path; degenerate-case
test corpus written before the solver; all state in hashed ECS components
with snapshot-resim tests. Middleware (Jolt/PhysX) is permitted only off-hash
for presentation effects — the Box2D warm-start lesson is settled law.

### 4.9 Go seam: draft + guardrail now, freeze on proof

Adopted from Codex: one deterministic Odin `Session` as sole
simulation-transition authority; the private seam
`Session.step(Canonical_Input_Set) → Tick_Commit` (D29's headless run is
already this seam in embryonic form); and the three-call worker protocol —
`Worker_Open` / `Worker_Advance_One_Tick` / `Worker_Close` with its
idempotence, sequencing, and epoch-fencing rules.

Amended from "freeze verbatim now" to: the three-call design is a **written
draft**; the *enforced* invariant today is the dependency-arrow guardrail
(session/kernel never imports network, wall clock, or Go-facing code — a free
tier-scan rule). The contract **freezes only after a walking-skeleton
conformance proof** — a trivial Go supervisor driving the headless Odin worker
through open/advance/close with idempotent-retry, gap-rejection, and
epoch-fencing tests — scheduled at the start of Go implementation. Everything
above the seam (lockstep vs snapshot vs delta) remains the Codex A/B/C
experiment, run against the networked verification scene (§5).

### 4.10 CI and platform sequencing

The determinism risk gate stands up in phase 0 as a **same-OS / cross-CPU**
check: arm64 + x86-64 macOS runners, catching FMA/contraction divergence (the
stated primary risk) without presuming Windows/Linux ports that have never
existed. **Linux headless** is a named early milestone (it is also the future
Go-supervised worker target). Windows waits until the editor needs it. The
sanitizer story is decided — and validated on the actual runner — before CI
grows, not after it flakes (the documented pruning of the old ASan job is the
cautionary tale). WASM/web: the 2D web target keeps working as long as the 2D
engine ships; render3d's web leg is an explicit post-v1 decision, not an
assumed continuation.

---

## 5. Phased roadmap

Phases are dependency stages: each opens when the previous phase's exit gate
is green. The ordering says what must exist before what, nothing else.

**Phase 0 — prove 3D + headless (the smallest thing).**
A textured cube, hardcoded vertices (no assetc yet), orbited by a
deterministic camera inside a real Session, stepped N ticks with **no
window**: assert (a) world-hash golden, (b) draw-list skeleton-hash golden,
(c) offscreen readback image golden (perceptual tolerance). Requires: minimal
`simmath3d` subset (vec3/mat4/quat, **transcendentals banned** — added one
function at a time on demonstrated need), the draw-list structs + skeleton
hash, a minimal render3d core (one opaque pass, depth buffer), the gpu
consumer targeting an offscreen sokol attachment, and the cross-CPU hash gate
in CI. Everything runs beside the untouched 2D engine. Exit gate: all three
goldens green on arm64 and x86-64 macOS runners, plus the D72 parity gate:
the same scenario run windowed and headless with identical world hashes and
draw-list skeleton hashes.

**Phase 1 — renderer foundations.** simmath3d fleshed out under the policed
policy; sokol-shdc pinned and wired (`shader-check` extended); pipeline cache;
frustum culling; materials; transparent pass; one shadow-mapped directional
light; the parameterized golden-compare script; boundary-scan extended.
Exit gate: a multi-object lit scene passes all three golden tiers.

**Phase 2 — assets.** `.sva` container; assetc (cgltf + texture encoder,
quarantine-reviewed, encoder version in header); static mesh/texture/material
import; the standalone **asset viewer** (first ImGui deliverable, proving the
editor tier plumbing); Linux headless milestone. Exit gate: a glTF scene
round-trips source → `.sva` → rendered goldens, headless, on macOS + Linux.

**Phase 3 — editor.** Command stream; scene tree + inspector + play/step +
world-hash display; asset browser (+ assetc audio bake); gizmos on
geometry-ray picking; profiler panel on the spall zones. Scene/prefab =
data-stage content. Exit gate: author a scene in the editor, play it
deterministically in-editor, and reproduce its world hash headless from the
CLI.

**Phase 4 — animation + polish.** Pose sampler/blend + GPU skinning
(off-hash per the logged decision); `.sva` skeleton/animation sections; audio
spatialization stage; gamepad fix; docs milestone (architecture doc updates +
generated Lua API reference from binding docstrings).

**Phase 5 — online services.** Walking-skeleton protocol proof → freeze the
three-call contract → one-binary Go shell → the Codex A/B/C replication
experiments against a networked verification scene, which Phase 6 then
promotes to the two-client harness. All of D41's logged constraints apply.
The game brief's co-op and competitive-multiplayer requirements set the
scope; no game content exists in this phase.

**Phase 6 — engine-completion verification.** Small test scenes prove each
subsystem end-to-end against the game brief's requirements; none of them is
game production. The set: a lit, animated glTF scene authored in the editor
and reproduced headless from the CLI; two clients claiming adjacent chunks
over a real network, as the multiplayer verification harness; the D72 parity
gate green across every verification scene, windowed and headless hashes
identical. The engine is complete when these gates pass, and the rebrand
fires at that point.

**The private game: starts only after the engine is complete.** The game —
its concrete shape defined in private product requirements outside this
repository — enters production once the Phase 6 gates pass, and not before.
Its brief drives engine requirements through every phase above; the
verification scenes exercise those requirements without producing game
content. Game production itself is outside this plan's scope.

---

## 6. Risks and licensing

### 6.1 Top risks

1. **Cross-platform bit-exact 3D float determinism** (FMA, libm variance).
   Mitigated by: simmath3d under the existing policed policy before any sim
   code uses vectors; transcendentals banned until individually needed; the
   cross-CPU hash gate live from Phase 0.
2. **Renderer dark period.** Mitigated by verification-tier sequencing: the
   skeleton hash is green before any pixel exists; readback goldens next;
   windowed rendering last.
3. **Editor scope explosion.** Mitigated by ImGui (not an in-house framework),
   the fixed feature sequence, tier-scan containment, and the command stream
   as the single edit mechanism.
4. **Golden churn during renderer development.** Every legitimate change
   invalidates draw-list goldens; budgeted via the one-command re-record
   workflow and perceptual (not byte-exact) pixel comparison. The pixel tier's
   pinned machine is named (the maintainer's Mac), with OS/driver/toolchain
   recorded next to the goldens and a re-record protocol per the golden-hashes
   skill; fallback when the environment must move is skeleton-hash-only.
5. **Port-drift.** Largely dissolved by evolving in place: nothing
   battle-tested moves. The three script-layer fixes land as separate,
   individually verified refactors.
6. **Premature multiplayer abstraction.** Mitigated by draft-not-freeze, the
   guardrail gates, and the online-services phase's position in the build
   order. (Codex's own inventory: Carbon
   contains zero Go — there is no evidence to inherit, only boundaries.)

### 6.2 Licensing: what Carbon's licenses permit, precisely

**Inventory** (verified against the local clone and
[carbon-inventory.md](carbon-inventory.md)): 30 of 33 repos are root-MIT
(Copyright CCP Games); `io` is **PSF-2.0** (a derivative of CPython's
socket/ssl/select modules); `spatial-audio-clustering` is **Apache-2.0** with
several files dual-licensed Wwise-SDK-EULA-or-Apache; `.github` has **no
license** (its Code of Conduct text is CC BY 3.0). Every repo carries a
trademark carve-out: the license grants nothing over CCP's trademarks or game
content.

**What is permitted:**

- **Design reference — the licensed repos.** Studying architecture,
  boundaries, formats, and algorithms and re-expressing them independently is
  unrestricted for the 30 MIT and 2 non-MIT-licensed repos. Ideas and methods
  are not protectable; detailed nonliteral structure *can* be expression, so
  independent re-expression (not paraphrased transcription) is the standard.
  The unlicensed `.github` repo is read-only context, never a porting source.
- **Code porting — exception, per-file, attributed.** MIT permits verbatim
  and close ports (a C++→Odin port is still a derivative work of the
  expression) provided the copyright/permission notice is retained. The
  survey's own recommendation was "transfer concepts, not Carbon source"; this
  plan departs from that only for narrow, named cases (e.g. CMF's mip/section
  arithmetic, carbon-math's normalize overflow guard, the audio culling
  formula), and **surfaces that departure for maintainer sign-off** rather
  than inheriting it silently. The port procedure is **per-file, not
  per-repo**: check the specific file's header, the repo's NOTICE (trinity's
  lists third-party md5 and lempar.c snippets under their own terms), and
  whether the expression derives from a vcpkg-fetched or SDK dependency; then
  record repo, path, commit SHA, and license text in VENDOR.md.
- **Never permitted / never assumed:** anything under `io`'s PSF-2.0 without
  accepting PSF obligations (prefer: don't port from it); the Wwise-EULA'd
  files in spatial-audio-clustering (use only its Apache option);
  third-party material Carbon merely references or fetches (Wwise, NVTT,
  Compressonator, DirectXMath, Granny3D, FidelityFX, patched CPython,
  greenlet) — none of it is covered by CCP's grants; CCP's names, marks, or
  game content in any form.
- **Carbon is never a dependency.** The public repos are not even
  build-complete (Blue/Destiny document Perforce-only deps). It is a reading
  library.

---

## 7. Relation to Codex's successor-engine-plan.md

Codex's proposal is engaged head-on; nothing in it is ignored.

| Codex proposal | Disposition | Reason |
|---|---|---|
| One deterministic Odin `Session` as sole simulation-transition authority | **Adopt** | Matches D11/D9 and the mandate; it is SVSW's existing kernel given a name. |
| `Session.step(Canonical_Input_Set) → Tick_Commit` as the central seam | **Adopt** | The right seam; D29's headless run is its existing embryo. |
| Three-call worker protocol (Open/Advance/Close) with idempotence + epoch fencing | **Adopt, amended** | The design is right; "freeze now" is wrong with zero implementations on either side. Draft + guardrail gates now; freeze after a walking-skeleton conformance proof (Codex's *own* Phase 10 caveat, applied to its own freeze). |
| Go = multiplayer/ops shell only; never gameplay/ECS/hashes | **Adopt** | Consistent with D41; enforced by tier-scan arrows. |
| Replication (lockstep/snapshot/delta) stays a three-way experiment until a real game exists | **Adopt** | Correct method; Carbon provides zero Go evidence (Codex's own finding). |
| Carbon-derived asset artifact lifecycle + header spec (importer id/version, digests, section table) | **Adopt** | Directly incorporated into `.sva` (§4.4). |
| Simulation manifest / compatibility tuple (content hash alone insufficient) | **Adopt** | Needed for join/restore/replay gating; builds on SVSW's frozen content hash. |
| Fresh monorepo with `engine/…, protocol/, server/, tools/, games/` shape | **Amend** | Evolve SVSW in place instead (§4.1): the spine "ports verbatim," so it should not move; a fresh repo forfeits CI, goldens, beads, and decision-log continuity for zero product value. Codex's module *names* inform new package layout. |
| Flat `engine/script/{core,command,presentation}` module shape | **Amend** | Ignores logged D42's registrar-tier decomposition, which already exists and is gate-enforced; the successor keeps D42's shape and adds the editor tier. |
| 15-phase roadmap with Phases 8 ("minimal presentation") and 10–13 (multiplayer) weighted toward network proof | **Amend** | The mandate inverts the weighting: 3D renderer, headless harness, assets, and editor are the product (Phases 0–4 here); Codex's protocol/replication phases become Phase 5, ordered after the editor. Codex's per-phase gate discipline is kept. |
| No durable vocabulary/ADRs/Beads epics until the 12-question private product requirements are settled | **Rebut** | The mandate already answers the structural questions (3D, headless, editor, engine-first, Odin/Lua/Go, deterministic). Blocking *all* architecture on a game brief is paralysis; only replication topology, the physics core's shape, and multiplayer vocabulary genuinely wait on it. Two of Codex's deferred questions (coordinate precision, pose determinism) are resolved now with logged defaults (§4.2 threading, §4.5, open questions) because front-loaded code depends on them. |
| Three replication experiments as roadmap phases before a game exists | **Rebut (as sequencing)** | The experiments are the right method but they run against the networked verification scene, not as engine scaffolding; building all three against nothing measures nothing. |
| Private product requirements as the next decision needed | **Amend** | Kept, but repositioned: the brief is the requirements driver that shapes engine subsystems; the game itself enters production only after the engine is complete, and vertical slices along the way verify the engine rather than start the game. |
| Beads v49→v53 migration owner decision | **Adopt (operational)** | Orthogonal to architecture; still needs a named owner before durable issue tracking of this plan. |

---

## 8. Open questions for the maintainer

1. **Confirm the in-place evolution default** (§4.1) — or name the concrete
   reason for a fresh monorepo, which converts the migration into an explicit
   phase-zero item with an owner.
2. **Renderer priority order under the game brief** (skinning vs terrain vs
   interiors for the private game — see private product requirements).
   Drives Phase 1 sequencing and the shape of the engine-completion
   verification scenes.
3. **Coordinate precision, proposed default: f32 world coordinates + floating
   origin** (fits the stated small-to-mid scope). Confirm or choose f64 sim
   positions now — it shapes simmath3d's API and the hash layout and cannot
   wait.
4. **Pose determinism, proposed default: poses are off-hash presentation;
   hitboxes are explicit sim colliders** (§4.5). Confirm before assetc grows
   animation sections.
5. **First backend confirmation: sokol-gfx** (continuity, known quantity,
   dummy backend) vs wgpu (compute, modern features). The draw-list seam makes
   this reversible; the choice sets the shader toolchain (sokol-shdc assumed).
6. **Lighting scope: confirm minimal-forward v1** (Blinn-Phong, one shadowed
   directional light) with PBR as a later logged decision.
7. **Does shared-world multi-mod mirroring remain a product requirement** for
   the 3D engine (global component IDs, first-declarant-registers, schema
   mirroring)? Keeping it preserves Factorio-style cross-mod patching;
   dropping it removes a large fraction of `engine/script`'s hardest
   machinery for future games.
8. **Sanitizer/CI policy**: commit to a runner-validated ASan job in CI, or
   explicitly designate it a documented local-only pre-merge gate. Decide
   before Phase 1 CI grows.
9. **WASM/web for render3d**: explicit post-v1 decision — commit, or park
   with the 2D engine's web target as the only web story.
10. **Sign-off on the licensing posture** (§6.2): concepts-first with
    per-file-checked, VENDOR.md-attributed ports as narrow exceptions — this
    knowingly departs from the survey's stricter "concepts only"
    recommendation.
11. **When the online-services phase opens**: the walking-skeleton protocol
    proof could run earlier as pure de-risking; default is the start of
    Phase 5. Preference?
12. **Beads migration owner** (Codex's operational blocker) — name the sole
    migrator or choose the bootstrap path, so this plan can become tracked
    epics.
