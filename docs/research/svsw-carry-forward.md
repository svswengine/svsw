# SVSW carry-forward assessment (deep pass)

Research-era record. Decision numbers here use the research-era scheme; docs/decisions/README.md carries the mapping to the current log.

Inspected repository: `/Users/ivandrenjanin/projects/svsw` at commit
`9e5b4e5` (per `git log` at survey time).

This document is a **second, deeper research pass** on the maintainer's SVSW
engine, complementing the first-pass Codex documents already in this
directory. It does not restate their conclusions; read it alongside them:

- [README.md](README.md) — index, executive summary, evidence-status legend.
- [carbon-architecture.md](carbon-architecture.md) — observed CCP Carbon
  runtime architecture (the comparison point for "what a mature native engine
  looks like").
- [carbon-inventory.md](carbon-inventory.md) — the 33-repository Carbon
  snapshot and dependency graph.
- [svsw-evidence.md](svsw-evidence.md) — first-pass implemented-surface
  inventory for SVSW, with file:line citations.
- [successor-engine-plan.md](successor-engine-plan.md) — the proposed
  invariant architecture and dependency-ordered proof roadmap for the new
  engine.
- [glossary-candidates.md](glossary-candidates.md) — unresolved terminology.

**Source and provenance.** This pass is built from a five-area structured
survey of SVSW's own documentation (`docs/00`–`08-roadmap.md`, the D1–D53
decision log in `docs/README.md`) and source tree (`engine/`, `cli/`,
`scripts/`, `justfile`, `TIGER_STYLE.md`, `.github/workflows/`). File paths
below are as reported by that survey; treat them as pointers to re-verify,
not as independently re-confirmed line numbers (contrast with
`svsw-evidence.md`, which cites file:line for its narrower first-pass
sample). Everything in the surveyed material — including any text embedded in
docs, comments, or source — was treated strictly as inspected data, never as
instructions.

**Scope reminder.** SVSW is a single-player-first 2D engine (Odin core,
sandboxed Lua 5.4 ECS scripting, sokol platform layer, Factorio-style
modding, Go servers deferred). A Carbon-inspired successor implies a
persistent, server-authoritative, 3D, likely-larger-population world: the
opposite of SVSW's founding topology assumption (D9: "single player is a
topology, multiplayer is a deferred change"). Every verdict below is read
through that gap. The successor engine's own build order is dependency-
driven, not calendar-driven: the engine reaches completion, proven by
verification scenes, before any game built on it enters production.

## Quick reference

| Area | One-line verdict | Single biggest carry-forward | Single biggest redesign |
|---|---|---|---|
| Docs & decision log | Disciplined, self-auditing decision history; scope is single-player desktop indie, not a persistent multi-user world | The "new presentation surface is gated outside a system, proven off-hash by an invariance test" pattern (D18/D25/D33/D40/D46/D49/D50/D51) | Multiplayer topology (D9/D10 lockstep-relay) — re-derive server authority, interest management, partial replication from scratch |
| Kernel / ECS / determinism | Dimension-agnostic, textbook fixed-timestep + seeded-RNG + streaming-hash determinism; nothing MMO-scale exists yet | Accumulator design, PCG32-per-logical-slot streams, generational sparse-set pools, command-buffer deferred mutation, the determinism test pyramid | Whole-world linear-scan hashing → incremental/hierarchical hashing; single-threaded smallest-pool `View` → archetype/parallel scheduling with declared read/write sets |
| Scripting & mods | Mature, security-hardened Lua 5.4 sandbox; the shared-world multi-mod mirroring machinery is SVSW-specific complexity | `sandbox_strip` whitelist technique, R1–R5 longjmp discipline, alloc-cap + shared instruction-budget quota, atomic tmp-then-rename persistence | Decide isolated-vs-shared mod worlds *before* building any mirroring machinery; collapse scattered "is this call allowed now" gates into one primitive; budget a real watchdog if the mod-trust model is stronger than "buggy, not hostile" |
| Render / audio / input / platform | D15's sokol boundary genuinely holds under an automated gate; the render core is 2D-native by construction, not merely by policy | The D15 pattern itself (sokol-free core + thin GPU stratum + boundary-scan gate); ECS/audio/input/platform carry forward almost untouched | `Sprite_Instance` billboard ABI, the single-`sg.Pipeline` GPU stratum, `Camera_2D`'s closed-form inverse, and CPU painter's-algorithm ordering all need genuine 3D replacements, not extensions |
| Tooling & testing | Unusually mature `just check` composition, golden-hash/golden-image regression discipline, and a mechanically-gradable TIGER_STYLE checklist | The single-gate `just check` composition pattern; TIGER_STYLE's cite-source-then-carve-exceptions-then-checklist structure; golden-hash regression at every tier; the api-surface snapshot-diff gate | Parameterize the copy-pasted golden-compare recipe before it proliferates further; decide the CI sanitizer story before CI grows (SVSW's own ASan job was cut for flakiness and never restored); pick a default (CPU-oracle vs. GPU-readback) for new visual-regression tests |

---

## 1. Docs & decision log (D1–D53, `docs/00`–`08-roadmap.md`)

### Summary

SVSW logs 53 numbered architecture decisions (several revisited as `D-N-up`)
across `docs/README.md`. The engine kernel and the maturation set (physics,
save, replay, particles, lighting, skeletal animation, web target, an RPG
capstone) are done. Steam/Workshop, mobile (Android then iOS, both flagged
high-risk on Odin), and real multiplayer remain: multiplayer today is
architecture-only (a replication seam plus two documented server
archetypes), with zero implemented netcode. One motif recurs across a third
of the log: new presentation/authoring surface is added as off-hash state,
gated at the Lua boundary ("forbidden inside a system," mirroring
`svsw.clock`), proven golden-neutral every time. This single idea accounts
for much of the design cost of D18, D25, D33, D40, D46, D49, D50, and D51 and
is SVSW's most reusable idea for a new engine.

### Strengths

- **D11** (determinism from v1: fixed timestep, ordered sparse-set ECS
  iteration, engine-seeded PCG32 per system, wall clock unreachable from sim
  code) underwrites replay, save/load, lockstep multiplayer, and the entire
  golden-world-hash test methodology — designed in, never retrofitted.
- **D9**: simulation and presentation join only through a defined
  replication seam in every game from the start, so "add multiplayer later"
  is a topology change, not a rewrite. The seam *concept* (not the lockstep
  specifics) is the durable idea.
- The off-hash-gated-presentation-surface idiom was reused correctly across
  eight decisions without ever leaking sim/presentation state — a genuinely
  portable engineering pattern, proven by an invariance test each time.
- **D2** (native ECS storage + Lua-declared schemas, sparse-set over
  archetype) was chosen explicitly for correctness-first simplicity with a
  stated "revisit only if profiling demands it" escape hatch — a disciplined,
  low-regret call.
- **D5** ("the game is a mod"): the base game ships with zero special
  privileges, forcing the modding API to stay complete because building the
  engine surfaces every gap first.
- **D15**'s platform-boundary split (only the platform tier plus two thin
  GPU/audio submission strata may import sokol/native audio) survived three
  rounds of scope growth without the boundary itself moving.
- **D42**'s tiered SDK (core / headless / client), achieved through
  architecture alone (which packages a `main` imports, plus dead-code
  elimination) with a mechanical tier-scan gate — directly useful for a
  Go-server-hosted headless tier in a successor engine.
- Whitelist-never-blacklist Lua sandbox (D5, detailed in `03-modding.md`)
  with per-mod memory caps, instruction-budget hooks, error containment, and
  loud placeholders instead of crashes — a coherent security philosophy
  applied consistently everywhere.
- The decision log itself is a strength: every entry records rationale,
  rejected alternatives, and named reopening tripwires (e.g. D41 Go-vs-Rust,
  D44 monorepo-vs-Bazel), so decisions are revisited on evidence, not drift.
- Golden-hash/golden-image test discipline plus explicit "accepted risk" /
  "known limitation" call-outs (e.g. the CPU frame-oracle cannot see
  GPU-resident particles/lighting) show mature, honest engineering.

### Weaknesses

- Multiplayer is entirely architecture-and-intent (D9, D10, D41); the only
  implemented networking-adjacent capability is single-process
  replay/lockstep-desync detection, not a real server. For a Carbon-inspired
  engine this is the single biggest gap.
- D10's lockstep-relay archetype assumes every client simulates everything
  and there is no hidden information — structurally incompatible with an
  MMO/persistent-world model (server authority, interest management, partial
  replication). Accepted for an indie single-player-first engine, never
  re-examined against a larger-scale target.
- Mobile support is a documented high/very-high risk that was accepted and
  deferred rather than resolved (`04-platforms.md`): no public Odin app has
  shipped through iOS review; Android's `core:thread` is broken on device.
- UI (D16) churned more than any other subsystem: an initial Clay+DSL choice
  deferred six open questions, resolved reactively across D32–D36, then
  extended again by D47 and D53, exposing a pre-1.0 single-header vendor
  library's hardcoded scroll-container capacity as a late-discovered
  structural constraint.
- Packaging (D28) was fully superseded by D45 (per-host dir-bundle+launcher
  replaced by a single embedded-mods binary) — a full model replacement, not
  an extension.
- Save/serialization (D22/D22-up) is client-local save-bundle-to-disk with an
  explicit unresolved Box2D warm-start caveat; workable for single-player,
  but a server-authoritative persistent world needs server-side persistence,
  which nothing here addresses.
- The Lua sandbox reversed a prior decision: D25 excluded
  `getmetatable`/`setmetatable`/`raw*` and called re-examination "a future
  maintainer call"; D38 later restored all of them under a uniform-sealing
  scheme — the right outcome, but evidence the boundary was drawn too
  conservatively the first time.
- D40 (game-UI menus) forced a mandatory re-baseline of all six existing game
  goldens because the new menu ECS phase changed the tick stream — an
  expensive, reactive consequence of bolting a cross-cutting feature on after
  many samples already existed.
- D42's core/headless/client tiering was a large retrofit of an already-large
  "god package" (`engine/script`) rather than a decomposition designed in
  from the start; the README literally names it "the one blocker."
- Determinism's DoS-safety story has a known, accepted hole: Lua pattern
  backtracking inside a single C call is not interruptible by the
  instruction-count hook — acceptable under "buggy mods, not hostile-code
  hosting," not acceptable for a larger third-party mod population.
- Platform-services priority (D8) is Steam-first/itch.io-first — an indie
  premium/DRM-free distribution shape with no live-service/gateway/session
  representation anywhere in the doc set.

### Carry forward

- The determinism-first discipline itself (D11) as a non-negotiable core
  invariant regardless of what else changes.
- The replication seam as an architectural discipline (D9): sim
  reads/writes only through defined interfaces from presentation — exactly
  the seam a server-authoritative Go service needs to sit behind, even
  though the *topology* built on top (lockstep P2P) should be re-decided.
- The "off-hash presentation state, gated outside a system, proven by an
  invariance test" pattern, reused verbatim for any new non-simulation Lua
  surface.
- Sparse-set component storage with the explicit "archetype only if
  profiling demands it" stance as a low-regret ECS starting point.
- "The game is a mod, no special privileges" (D5) as an API-completeness
  forcing function, if the new engine keeps a first-party moddability goal.
- The layered dependency-direction rule (Lua sees only the scripting
  boundary; only the platform tier imports native/GPU libraries; engine core
  is backend-agnostic) — D15's split proved durable across three rounds of
  scope growth.
- Whitelist-never-blacklist Lua sandboxing plus memory caps, per-tick
  instruction budgets, and "errors are caught, offending mod disabled,
  engine survives" containment.
- Golden-hash/golden-image regression testing and the "accepted risk"
  documentation habit as a process practice.
- The tiered-SDK idea (core / headless-or-server / client): design this
  shape before any package depends on the others, instead of retrofitting it
  the way D42 had to, especially given the new engine explicitly wants Go
  game servers.
- The quarantine-first vendoring policy (review, pin by checksum/commit,
  `VENDOR.md` provenance) as a general dependency-management practice.

### Redesign

- Multiplayer topology: do not adopt D9/D10's "lockstep relay is the default
  real-time archetype" wholesale. Design server authority, interest
  management, and partial state replication into the ECS/replication-seam
  contract from the start.
- Re-examine D41's SpacetimeDB rejection on its own terms rather than
  inheriting the conclusion: D41 rejected it specifically because it would
  demote the Odin/Lua ECS from authoritative to renderer-only — correct for
  SVSW's model, but a Carbon-style persistent world may deliberately want
  server-side state authority, flipping the tradeoff.
- Persistence: replace client-local save-bundle-to-disk with a server-side
  persistence design if the new engine is server-authoritative.
- UI: do not re-inherit Clay-plus-organically-grown-DSL as designed; design
  the full feature set (layout, anchoring, clipping at scale, input
  commands, text/font handling) up front rather than bolting it on
  incrementally over a vendored single-header library with known capacity
  limits.
- World scale / coordinate precision: nothing in SVSW addresses large-world
  or floating-origin precision (an EVE/Carbon-lineage classic at
  interplanetary/solar-system scale). Decide the coordinate/precision model
  explicitly if the new engine targets anything beyond small local scenes.
- Distribution and services: D8/D28/D45's Steam-first, single-binary-embed
  model needs patch/update delivery, gateway/session/persistence services, and
  probably a server-mediated distribution model instead.
- Mod trust model at scale: harden the sandbox's resource-bounding story
  (regex backtracking, per-population not just per-mod budget reasoning)
  before inheriting it as-is, if the new engine expects many third-party or
  adversarial script authors.
- Mobile strategy: either commit resources to prove Odin-on-mobile early, or
  explicitly decide mobile is out of scope, rather than carrying forward an
  open, unresolved risk.
- Reconsider "no editor, code-first" (D6), sized to an early, not-yet-public
  engine; CCP Carbon historically included substantial first-party tooling.

### Files of note

| Path | Role |
|---|---|
| `docs/README.md` | Decision log index (D1–D53) and source-of-truth ordering |
| `docs/00-vision.md` | Founding scope, explicit non-goals (incl. "No 3D") |
| `docs/01-architecture.md` | Layer stack, replication seam definition |
| `docs/02-ecs-and-scripting.md` | ECS/Lua boundary design |
| `docs/03-modding.md` | Sandbox, mod pipeline, sandbox-revisit history |
| `docs/04-platforms.md` | Platform risk assessment, mobile status |
| `docs/05-rendering-stack.md` | Render architecture doc |
| `docs/06-multiplayer.md` | Replication seam, D10 server archetypes |
| `docs/07-platform-services.md` | Steam/itch.io distribution priorities |
| `docs/08-roadmap.md` | Phase status, deferred multiplayer sub-project |

---

## 2. Kernel / ECS / determinism (`engine/kernel`, `engine/ecs`, `engine/simrng`, `engine/simmath`, `engine/save`, `engine/replay`, `engine/harness`)

### Summary

SVSW's determinism stack is a disciplined implementation of the classic
recipe — fixed timestep, ordered ECS iteration, seeded PCG32, streaming
content hash, snapshot/replay — enforced by compile-time layout locks, a
completeness-reflection test over `World`'s fields, and a layered
same-seed/resim/golden test pyramid. The kernel/ecs/simrng/simmath layer is
already dimension-agnostic; the "no 3D" boundary lives entirely in
`engine/render`, a separate sokol-isolated tier. What is not present, and is
explicitly deferred per the project's own roadmap, is anything for
MMO-scale server simulation: no archetype/parallel ECS storage, no
incremental/sharded hashing, no spatial partitioning or interest management,
no multi-shard `World` model. The determinism *methodology* should carry
forward almost verbatim; the *scale assumptions* (single-threaded
linear-scan views, whole-world hashing as the verification primitive,
hard-reject wire versioning) need real redesign for MMO population counts
and live-service data longevity.

### Strengths

- `hash_world` (`engine/kernel/hash.odin`) is a single-pass streaming XXH3-64
  over an explicitly documented, comment-locked field order, with every
  variable-length region length-prefixed by an 8-byte count specifically to
  restore injectivity — the comment names concrete collision cases this
  prevents.
- Compile-time `#assert`s lock the exact byte layout hashing depends on
  (`size_of(Entity)==8`, `size_of(Pcg32)==16`, `ODIN_ENDIAN==.Little`,
  `size_of(System)==80` on 64-bit) — a layout regression fails the build
  instead of silently diverging every recorded golden.
- NaN canonicalization rewrites only registered float lanes carrying an
  actual NaN to a canonical quiet-NaN bit pattern before hashing — a
  narrowly scoped fix for the one legitimate float nondeterminism source.
- The fixed-timestep `Accumulator` (`engine/kernel/accumulator.odin`) is
  textbook "Fix Your Timestep": pure logic (no clock), clamped catch-up steps
  preventing spiral-of-death, paired pre/postcondition asserts.
- ECS storage (`engine/ecs/pool.odin`, `entity.odin`, `view.odin`) is a clean
  sparse-set with generational entity handles (index+gen, 8 bytes, no
  padding), swap-and-pop removal that zero-fills both the vacated slot and
  unused stride padding on add — exactly what makes hashing the pool's raw
  byte image sound.
- `Component_ID` assignment and system run order are strictly
  registration-order; the one map in `World` (`name_to_id`) is documented as
  lookup-only because Odin map iteration is pointer-seeded and therefore a
  determinism trap.
- `simrng` (PCG32) is a small vendored "pcg_basic" port specifically because
  `core:math/rand` is a CSPRNG whose algorithm has already changed across
  Odin releases. Streams are keyed by system *registration index*, not
  scheduling/wall-clock order — a pattern that also happens to be what a
  future parallel scheduler needs.
- `world_sort_systems` (opt-in "after" edges) is a stable Kahn's-algorithm
  topological sort with lowest-registration-index tie-breaking, proven to
  reduce to the identity permutation with zero after-edges.
- `Command_Buffer` defers all structural changes during iteration and
  flushes once per tick in submission order, so mutation ordering is a
  deterministic function of system order + iteration order.
- The determinism test pyramid (`engine/harness/determinism_test.odin`) is
  genuinely layered: same-seed-twice per-tick hash equality, snapshot-then-
  resimulate equality (proves rollback/lockstep viability, not just
  replay), one committed golden hash, plus an explicit "neutral input track
  equals no input" test guarding the input seam specifically.
- `World`'s hashed-vs-excluded field split is enforced by a
  reflection-based completeness test, forcing explicit classification of any
  new field.
- The replay wire format (`engine/save/replay_codec.odin`) is
  checksum-first, length-prefixed, reuses `bundle.odin`'s audited bounded
  readers, and frees everything allocated so far on partial-decode failure.
- `kernel`/`ecs`/`simrng`/`simmath` carry no 2D-specific assumptions; only
  the platform tier plus `engine/render/gpu` may import sokol (D15), so a 3D
  renderer could be added alongside the 2D one without touching the
  deterministic core.
- `simmath`'s "policed math surface" already bans `core:math/linalg` and the
  builtin matrix type because they emit FMA on FMA-capable targets and plain
  mul/add on baseline x86-64 — the right instinct for a future 3D vector/
  matrix library, just not yet extended to vectors/matrices.

### Weaknesses

- `hash_world` performs a full linear scan of every pool's live byte range on
  every call; fine at vertical-slice scale, but there is no incremental,
  per-entity, or per-region hash that lets verification cost scale with what
  changed rather than total world size — a real gap for MMO-class entity
  counts.
- The World/ECS is single-threaded by construction: `View` selects the
  smallest pool as driver and linearly probes the others (no archetypes, no
  chunking, no declared per-system read/write sets). The RNG-stream pattern
  is parallel-ready; nothing else in the scheduler is.
- Full bit-identical world-hash determinism is the mechanism the
  lockstep-relay multiplayer archetype (`docs/06-multiplayer.md`, D10 #1)
  depends on, where every client simulates everything. The
  headless-sim-wrapper archetype (D10 #2), closer to an authoritative MMO
  server, doesn't need that property the same way — it needs one
  authoritative source of truth plus reconciliation. The kernel doesn't yet
  distinguish "determinism for replay/testing" from "determinism for a live
  netcode contract."
- Replay/save wire versioning is hard-reject-on-bump by design (a recent
  `Input_Snapshot` layout change invalidated every existing replay file).
  Correct and honest for pre-1.0; a live-service context accumulating real
  player data over years needs an actual migration story.
- `Command_Buffer` and pool growth are deliberately unbounded (doubling
  arrays, cleared not freed), reasonable for a single-player vertical slice
  but with no backpressure story for a long-running MMO server process.
- No spatial partitioning, interest management, entity ownership/sharding
  across processes, or multi-`World` coordination exists anywhere — expected
  per the roadmap's deferred multiplayer sub-project, but essentially all of
  the MMO-specific architecture is unbuilt, not merely underdeveloped.
- `COMPONENTS_MAX`/`SYSTEMS_MAX = 4096`, `MODS_MAX = 256` are
  programmer-error ceilings (fine), but the flat `Pool` storage (one
  contiguous byte array per component type) is a simple v1 sparse-set, not
  the archetype/chunked storage most high-entity-count ECS designs converge
  on for cache locality at scale.

### Carry forward

- The `Accumulator` design (pure-logic fixed timestep, clamped catch-up
  steps, alpha interpolation split between `accumulator_advance` and
  `accumulator_alpha`) — dimension- and genre-agnostic, keep essentially
  verbatim.
- PCG32 as a small vendored, version-pinned RNG rather than a language
  stdlib generator whose algorithm can silently change; keep deriving
  independent streams from a stable *logical* index (registration order),
  not scheduling or wall-clock order.
- Generational entity handles (padding-free 8-byte index+gen) and the
  sparse-set pool's discipline of zero-filling both newly-added and vacated
  slots so the live byte range is always fully defined.
- The command-buffer deferred-mutation pattern (no structural changes during
  iteration, one flush per tick in fixed order) — exactly what a future
  job-parallel ECS also needs.
- `hash_world`'s *methodology*: explicit fixed order documented inline,
  length-prefixing every variable region for injectivity, a completeness-
  reflection test forcing explicit classification of new fields. Change the
  mechanism to incremental/hierarchical hashing at MMO scale, keep the
  discipline.
- The layered determinism test pyramid (same-seed-twice, snapshot-then-
  resimulate, one committed golden, explicit neutral-input regression) as a
  reusable pattern against any new deterministic core, 2D or 3D.
- The "policed math surface" concept from `simmath.odin`: an explicit
  allow-list plus a banned-list with documented reasons. Extend, don't
  replace, for a hand-rolled deterministic vec3/mat4/quat library.
- The replay/save wire-format hardening pattern: checksum first, bound every
  length against bytes-remaining before allocation, length-prefix every
  variable section, fail clean by freeing partial state on untrusted input.
- The strict layer boundary keeping sokol out of the simulation core — this
  is precisely why kernel/ecs/simrng/simmath are already 3D-ready in
  principle; preserve it rather than letting a 3D renderer's needs leak in.

### Redesign

- Replace whole-world linear-scan hashing with an incremental or
  hierarchical scheme (per-entity/chunk/shard hashes composed into a root)
  so verification cost scales with what changed, not total live entity
  count.
- Add a hard requirement SVSW never needed: headless mode and windowed mode
  must produce the same world hashes, the same draw-list skeleton hashes,
  and comparable readback goldens for the same scenario. Wire a parity gate
  into the golden-hash machinery that runs each scenario both ways and
  asserts the hashes match, so an agent driving the engine headlessly can
  trust the result against a windowed run a human would see.
- Redesign `View`/system execution toward archetype or chunked storage with
  statically declared per-system read/write sets, enabling safe parallel
  execution — while preserving the RNG-stream-per-logical-slot and flush-
  ordering guarantees as the contract that makes parallelism determinism-
  safe.
- Explicitly split the determinism contract by subsystem: keep full
  hash-level determinism where load-bearing (replay/desync-detection/
  testing, D10 lockstep archetype), but design the MMO/server-authoritative
  loop (D10 headless-sim-wrapper archetype) around a single source of truth
  plus reconciliation rather than assuming every shard reproduces
  bit-identical state.
- Move save/replay wire versioning from hard-reject-on-bump to a real
  migration/compat story (versioned readers, upgrade passes) before any
  live-service data with real longevity exists.
- Add an explicit multi-`World`/sharding architecture at the kernel layer for
  spatial partitioning and interest management — presently entirely absent
  by design; the underlying `ecs.Pool`/`View` primitives can likely be
  reused per-shard, but `World`-level orchestration is new work.
- Introduce backpressure/bounding policy for `Command_Buffer` and pool
  growth appropriate to a long-running server process, once real MMO-scale
  structural-change patterns are known.
- Extend the "policed math surface" pattern into a genuinely new
  deterministic vector/matrix/quaternion library for 3D, since
  `core:math/linalg` and the builtin matrix type are correctly banned for
  FMA-variance reasons — additive work under an existing, sound policy.

### Files of note

| Path | Role |
|---|---|
| `engine/kernel/hash.odin` | Streaming world-hash (`hash_world`), field-order lock |
| `engine/kernel/world.odin` | `World` struct, hashed-vs-excluded field split |
| `engine/kernel/accumulator.odin` | Fixed-timestep accumulator |
| `engine/kernel/sort_systems.odin` | Stable topological system ordering |
| `engine/kernel/snapshot.odin` | Snapshot/restore for replay and resim tests |
| `engine/kernel/world_components.odin` | Component registration bookkeeping |
| `engine/ecs/pool.odin` | Sparse-set component pool |
| `engine/ecs/entity.odin` | Generational entity handles |
| `engine/ecs/view.odin` | Smallest-pool-driven iteration |
| `engine/ecs/command_buffer.odin` | Deferred structural mutation |
| `engine/simrng/simrng.odin` | Vendored PCG32, per-slot streams |
| `engine/simmath/simmath.odin` | Policed deterministic math surface |
| `engine/harness/determinism_test.odin` | Determinism test pyramid |
| `engine/save/replay_codec.odin` | Replay wire format, bounded readers |
| `engine/save/session.odin` | Save-session bundling |
| `docs/01-architecture.md` | Layer stack narrative |
| `docs/06-multiplayer.md` | D10 server archetypes (lockstep vs. headless-sim-wrapper) |
| `docs/08-roadmap.md` | Deferred multiplayer sub-project status |

---

## 3. Scripting & mod system (`engine/script`, `engine/mod`, `engine/kernel` scripting seams)

### Summary

SVSW's Lua boundary is a mature, security-hardened, deterministic scripting
layer: a whitelist sandbox over vendored Lua 5.4, schema-laid-out native ECS
storage exposed through two-tier userdata views, a three-stage
(settings→data→control) mod pipeline modeled on Factorio with a shared-world
multi-mod architecture, disk-backed per-mod storage, and hot reload with
slot-stable RNG streams. As the most reusable asset for a new Lua-scripted
engine, the sandbox construction, the `proc "c"` context-reconstruction
discipline, the schema/descriptor layout technique, and the three-stage mod
pipeline are directly portable; the ECS-specific two-tier view machinery and
shared-world multi-host mirroring are more SVSW-specific and would need
trimming for a lighter engine. CCP Carbon's "blue" (Python/C++, see
[carbon-architecture.md](carbon-architecture.md)) solves an analogous
embedding problem but in a fundamentally different trust model — blue trusts
its Python; SVSW does not trust Lua mods — so SVSW's containment machinery
(budget/memory caps, contained errors, per-mod disable) is the part with no
"blue" analog and the part most worth preserving wholesale.

### Strengths

- Whitelist-only sandbox construction (`engine/script/sandbox.odin`:
  `sandbox_strip`) is a single well-documented source of truth: opens only
  base/string/table/math/utf8, strips dangerous globals + `string.dump` +
  `math.random` in place, locks the shared string metatable, and replaces C
  `xpcall` with a Lua-level shim closing a specific quota-evasion hole (C
  `xpcall` runs its message handler with `allowhook==0`, letting a looping
  handler dodge the count hook).
- Resource limiting is done host-side and correctly: a custom `lua_Alloc`
  enforces a hard per-VM byte cap with the Lua-manual-mandated semantics
  (shrink must never fail; `osize` is a type tag, not a size, when
  `ptr==nil`); a count-hook instruction budget is shared across coroutines
  via one `QUOTA_WINDOW`/`budget_remaining` pool so spawning coroutines
  cannot multiply the budget; the "exhausted" flag is re-checked after every
  `pcall` to close the loophole where a mod pcalls its own budget error and
  keeps running.
- The longjmp discipline (R1–R5, documented in `host.odin`'s header comment)
  is a crisp, enforceable rule set for any Odin↔Lua boundary: engine calls
  into Lua only via `lua.pcall` (never `lua.call`), every `proc "c"`
  callback holds no live defer/unreleased resource at a raise point, and any
  Odin `context` crossing into a callback is rebuilt explicitly from a
  stashed `host.ctx`.
- A mod can never crash the engine, enforced structurally: every mod-facing
  failure path funnels through `disable_mod`/`set_error`, which disables
  just that mod's systems (kept in slot, never removed, so RNG-stream/slot
  indices never renumber) and logs a warning, never propagates as an
  engine-level panic.
- Deterministic schema layout from Lua tables (`engine/script/schema.odin`):
  `pairs()` iteration order is never trusted; map-form schemas are
  canonicalized by bytewise field-name sort, array-form schemas use
  declaration order, and a packed descriptor integer
  (`offset<<16 | size<<4 | kind`) cached as the interned field-name value
  makes component field access one `rawget` + arithmetic instead of a full
  metamethod dispatch chain.
- The two-tier entity view design (`engine/script/views.odin`) gives
  allocation-free per-tick iteration: Tier 2 (iteration) reuses one userdata
  per system invocation, poisoned (`live=false`) the instant the invocation
  returns so an escaped closure raises instead of silently aliasing the next
  entity. Tier 1 (durable) is a weak-valued cache keyed by packed
  `(gen<<32|index)`.
- The three-stage mod pipeline (settings→data→control), with a fresh,
  torn-down `lua_State` per non-control stage and one long-lived control VM
  per mod, adapts Factorio's model to a shared-world, multi-mod ECS:
  component declaration is global-first-wins with later mods mirroring, and
  the frozen post-data-stage content hash gives a real cross-machine
  "did we load the same content" check for multiplayer.
- Dependency resolution (`engine/mod/resolve.odin`) is Kahn's algorithm over
  a bytewise name-sorted ready queue so load order is a pure function of
  (names, edges) independent of Go/Odin map iteration order — explicitly
  citing the real-world Factorio-Forge nondeterminism trap this avoids.
- Hot reload preserves the determinism-critical invariants that are easy to
  get wrong: systems re-register into their existing slot by name; deleted
  systems are tombstoned, not removed; schema migration is two-phase
  (validate all components before mutating any pool); a reload is an
  explicit replay barrier.
- The cross-tick/cross-save contract is unusually explicit and partly
  API-enforced: coroutines are for within-tick control flow only; resuming
  one on a later tick raises a loud contained error instead of silently
  desyncing.
- `svsw.storage`/`svsw.save`/`svsw.load` demonstrate careful atomicity:
  flushes are tmp-then-rename atomic; save-bundle load validates checksum +
  mod-set identity + every embedded storage blob into temporaries before any
  live-world mutation.
- D42's "opt-in binding" pattern (`Control_Registrar`, opaque `rawptr`
  fields on `Script_Host` for optional subsystems) lets the core scripting
  package stay dependency-free of render/audio/physics while still
  supporting an à-la-carte `svsw.*` surface.

### Weaknesses

- `Script_Host` (`engine/script/host.odin`) has grown to roughly 400 lines
  of fields, many individually-justified opaque `rawptr` + teardown-callback
  pairs for optional subsystems (ui, skeletons, particles, audio_store,
  log_sink, prov_sink, save_request, replay_session…) — the aggregate is a
  god-object coupling every optional subsystem's lifecycle into one struct's
  init/destroy pair.
- The multi-mod "shared world, global component IDs, first-declarant
  registers, later mods mirror" design (SP5) adds real complexity:
  global-ID-indexed grow-to-fit schemas/scratch/lua_systems arrays with
  per-slot "is this mine" checks, plus canonical-vs-mirrored-copy bookkeeping
  in `comp_schema_store` subtle enough to need its own long justifying
  comment. This machinery exists specifically because SVSW chose one shared
  `kernel.World` for all mods.
- The instruction-budget quota has an accepted, documented gap: Lua
  pattern-matching can backtrack catastrophically inside a single C call,
  which the count hook cannot interrupt — explicitly scoped as acceptable
  only under "buggy mods, not hostile-code hosting."
- Per-field component access is a `rawget` + arithmetic per field per entity
  per tick from within Lua systems — much better than naive metamethod
  dispatch, but SVSW's own docs concede this is fine for orchestration-scale
  system counts, not thousands-of-entities hot loops; the documented
  mitigation ("use native systems for hot paths") pushes real engine logic
  out of the scripting language rather than solving the boundary cost.
- Sandbox surface growth is ad hoc over time: full-Lua mode (D37/D38)
  restored metatables/raw*/coroutines after they were originally stripped —
  a reasonable resolution, but evidence the whitelist evolved through
  several partially-reversed decisions rather than being designed once.
- Determinism-gating for presentation-vs-simulation reads (`svsw.clock`,
  `svsw.storage.get`, `svsw.input.cursor_x/y`, `svsw.random`) is implemented
  as a family of ad hoc boolean gates (`in_on_frame`, `in_on_destroy`,
  "inside a system" checks) scattered across many binding files, each
  independently documented as "same gate sense as X" — exactly the kind of
  duplication a fresh design should factor into one primitive.
- The prelude/built-in components create an implicit contract that a
  badly-named component silently draws nothing rather than erroring (a
  sprite whose location component isn't literally named `position` draws
  nothing, with only a one-shot log warning) — a genuine footgun for mod
  authors.
- `engine/script` is now a very large package (57 files) with a wide surface
  (schema, views, data proxies, coroutine handling, reload, storage,
  prelude, manifest eval, DSLs for locale/menu/geom/UI…); a from-scratch
  engine should scope its MVP scripting surface much smaller.

### Carry forward

- `sandbox_strip`'s whitelist construction technique verbatim: open only
  base/string/table/math(+utf8), strip in place, lock the string metatable,
  replace C `xpcall` with a Lua-level shim — a self-contained, battle-tested
  Lua-5.4-embedding hardening recipe.
- The `lua_Alloc` byte-cap allocator + shared count-hook instruction-budget
  pattern, including the coroutine-sharing fix and the post-pcall
  "exhausted" re-check.
- The R1–R5 longjmp discipline as a standing rule (and review checklist) for
  any Odin↔Lua boundary: pcall-only engine→Lua calls, no live defers across
  raise points, explicit `context` reconstruction at every Lua→Odin entry
  point.
- The "a mod can never crash the engine" containment pattern: one
  `set_error`/`disable_mod` path, systems disabled-in-place (not removed),
  errors logged rather than asserted/panicked.
- The schema-parse pattern: two-pass validate-then-build so raises only
  touch temp allocations, deterministic field ordering via bytewise name
  sort, packed descriptor integer for O(1) field access.
- The three-stage (settings→data→control) mod pipeline concept and the
  Factorio-derived dependency model (Kahn topological sort over a
  name-sorted ready queue) — the load-order determinism technique ("never
  iterate a hash map for ordering decisions") is a general lesson worth
  stating as a standing rule.
- The atomic persistence pattern for `svsw.storage`/`svsw.save`
  (tmp-then-rename flush; validate-fully-into-temporaries-before-mutating-
  live-state on load).
- The D42 "opt-in binding, opaque rawptr + teardown callback" principle for
  keeping the scripting core free of render/audio/physics dependencies —
  watch it not sprawl into a 400-line host struct the way it did here.

### Redesign

- Decide the trust/world model *first*, before any multi-mod global-
  component-ID/mirroring machinery is built: if the new engine does not need
  Factorio-style deep-patching of a single shared simulation by many
  co-loaded mods, per-mod-isolated worlds (or a "first-mod-wins, no
  mirroring" rule) would eliminate a large fraction of this complexity.
- Factor the scattered "is this call allowed right now" gates into one small
  gate-checking primitive (an enum of call contexts + one raise helper)
  instead of N independent boolean fields and N hand-written error strings.
- Cap `Script_Host`'s growth with an extensible-subsystem-registry design (a
  small typed slot table keyed by subsystem id, each with its own
  init/teardown closure) instead of accreting one field per optional
  subsystem.
- Decide the per-field access cost trade-off deliberately: if the target
  genre needs thousands of entities touched per tick from scripted logic,
  design a batched/columnar accessor as a first-class API from the start
  rather than treating it as a "future candidate if profiling demands it."
- Where SVSW chose "loud placeholder / never crash" at the cost of silent
  no-ops, prefer raising a contained, loud error for likely-mod-bug
  situations with no legitimate use case; reserve pure-placeholder treatment
  for genuinely recoverable situations.
- If targeting a genuinely untrusted mod marketplace, budget for a real
  wall-clock watchdog (thread or OS-level timer) from the start rather than
  accepting the catastrophic-regex-backtracking gap SVSW knowingly leaves
  open.
- Scope the initial scripting API surface much smaller than 57 files and
  grow it by demonstrated need.
- Explicitly design the full-Lua-vs-restricted-Lua boundary (metatables,
  raw*, coroutines, io/os/debug) as one up-front decision, instead of
  SVSW's strip-then-selectively-restore evolution (D25 → D37/D38).

### Files of note

| Path | Role |
|---|---|
| `engine/script/sandbox.odin` | Whitelist sandbox construction |
| `engine/script/host.odin` | `Script_Host`, alloc cap, instruction quota, longjmp discipline |
| `engine/script/views.odin` | Two-tier entity view machinery |
| `engine/script/schema.odin` | Deterministic schema parse, packed descriptors |
| `engine/script/comp_schema_store.odin` | Canonical-vs-mirrored schema bookkeeping (SP5) |
| `engine/script/loader.odin` | Mod load orchestration |
| `engine/mod/resolve.odin` | Kahn's-algorithm dependency resolution |
| `engine/mod/manifest.odin` | Mod manifest parsing |
| `engine/mod/storage.odin`, `storage_codec.odin`, `storage_flush.odin` | Atomic per-mod storage |
| `engine/mod/setting.odin` | Settings-stage surface |
| `engine/script/api.odin`, `bindings/bindings.odin` | `svsw.*` API surface registration |
| `engine/script/data_stage.odin`, `data_proxy.odin` | Data-stage patching |
| `engine/script/prelude.odin` | Built-in components, draw-by-name-join |
| `engine/script/reload.odin`, `reload_watch.odin` | Hot reload, slot-stable RNG streams |
| `docs/02-ecs-and-scripting.md` | ECS/Lua boundary narrative |
| `docs/03-modding.md` | Sandbox history, mod pipeline, sandbox-revisit section |

---

## 4. Render / audio / input / platform (`engine/render`, `engine/render/gpu`, `engine/audio`, `engine/input`, `engine/platform`)

### Summary

SVSW's D15 sokol/CPU-core split genuinely works and is enforced by an
automated boundary scan: `engine/render` (batcher, camera, tilemap, font,
lighting-gather, skeleton) is fully sokol-free and unit-tested headlessly,
while `engine/render/gpu` is a deliberately thin translation layer. Audio's
push-model mixer and input's three-stage event-ring-to-snapshot seam are
both dimension-agnostic and already decoupled from the renderer. But nearly
everything in the render core is 2D-by-construction at a deeper level than
the sokol boundary: the `Sprite_Instance` ABI is a billboarded-quad format,
`Camera_2D` has no perspective/FOV/near-far, the batcher does CPU
painter's-algorithm ordering with zero depth-buffer/pipeline-state concept
(exactly one `sg.Pipeline` in the whole GPU stratum), and LDtk tilemaps plus
the DragonBones-style 2D skeleton system are 2D-native asset pipelines with
no path toward meshes/skinning. Going to a Carbon-Trinity-style 3D renderer
would reuse the *pattern* (sokol-free core, thin GPU stratum, boundary-scan
gate) and wholesale-reuse ECS/kernel/audio/input/mod-system, but the render
core itself would be a new implementation, not an extension of the existing
one. `docs/00-vision.md` explicitly states "No 3D… nothing in v1 spends
effort on it" — a deliberate, logged decision, not an oversight.

### Strengths

- D15's layer split is real, not cosmetic: `engine/render` has zero GPU
  types anywhere; `batch_build`, camera math, and tilemap baking are pure
  functions unit-tested with no GPU device. `engine/render/gpu` is provably
  thin (`gpu_draw_into_pass` is upload-buffer + apply-uniforms + one
  `sg.draw` per run). `just boundary-scan` mechanically fails the gate if
  `engine/kernel` or `engine/input` reach sokol or a wall clock.
- Batching is disciplined and deterministic: a single u64 sort key packs
  `[layer:16][texture:16][sequence:32]` so an unstable sort is
  deterministically stable; runs are cut on texture/clip/lit-material
  change; everything is pre-allocated at a fixed
  `SPRITE_INSTANCES_MAX=65536` budget with drop-and-count on overflow.
- A CPU "capture oracle" mirrors the GPU rasterizer in software, possible
  only because the render core is sokol-free — enabling headless visual
  verification without a GPU/window.
- Audio's push model (`engine/audio/mixer.odin`, `pump.odin`) is
  dimension-agnostic and already fully decoupled from rendering: bounded
  16-voice mixer, deterministic `play_id` tokens resolved from Lua,
  main-thread pump (no audio-thread callback, no atomics).
- Input's three-stage seam (`Raw_Input_Event` ring →
  `Input_Snapshot`) is cleanly dimension-agnostic: keys/buttons/gamepad axes
  carry no spatial semantics; the only 2D-specific piece
  (`camera_screen_to_world`) is a thin, separable convenience layer.
- Explicit non-goal, not an accident: `docs/00-vision.md` states "No 3D…
  sokol_gfx would permit 3D later; nothing in v1 spends effort on it" — a
  logged decision, checked into `docs/README.md`'s decision log.

### Weaknesses

- `Sprite_Instance` (`engine/render/batch.odin`) is a 2D billboard-quad ABI,
  not a general per-object transform: `position[2]+size[2]+right[2]/up[2]`
  (a 2D rotation basis) + uv + color, pinned at exactly 52 bytes by
  `#assert`s. No analogue for an arbitrary 3D mesh instance.
- Exactly one `sg.Pipeline` exists in the entire GPU stratum
  (`Gpu_State.pipeline`), built once with a single hand-authored shader per
  backend (MSL/HLSL5/GLSL330) and a fixed vertex layout — no pipeline cache,
  no material/shader system, no depth-stencil state configured at all ("2D
  painter's algorithm: the CPU sort owns ordering, no depth test").
- `Camera_2D` (`engine/render/camera.odin`) has no perspective: zoom/
  rotation(scalar)/target_w/target_h only, fixed near/far = -1/1, and
  `camera_world_to_clip` asserts `clip.w==1` unconditionally (true only for
  orthographic). `camera_screen_to_world` is a closed-form analytic inverse
  that exists specifically because the transform is 2D-affine — a 3D
  perspective camera has no equivalent closed form without a depth value or
  a ray cast.
- The whole draw-ordering model is CPU sort + no depth test: run-cutting and
  the mod-authored integer "layer" concept do not generalize to 3D scene
  depth (opaque 3D geometry wants a z-buffer; only transparent geometry
  needs a view-depth sort — a different algorithm entirely from
  painter's-algorithm-by-integer-layer).
- LDtk tilemaps and the DragonBones-style skeletal system are 2D-native
  asset pipelines end to end (flat world-space quads, 2D IntGrid
  collision-rects, 2D bone position/rotation/scale) — none of this extends
  to meshes/skinning/voxel-or-heightmap terrain.
- 2D lights (`Light_GPU`) carry only x,y (no z), no shadow or depth-aware
  occlusion; the LIT shader branch is a tangent-space normal-map hack for
  flat sprites, not real 3D N·L against mesh geometry.
- No frustum-culling infrastructure exists beyond one bespoke 2D AABB test
  hand-built for tilemaps; a 3D scene needs general frustum/occlusion
  culling with no current analogue.
- Audio has no spatialization: `Voice` only carries `pan`/`gain`, no 3D
  position or listener-relative attenuation.

### Carry forward

- The D15 pattern itself (sokol-free core + thin GPU submission stratum +
  automated boundary-scan gate) — re-apply verbatim to a 3D renderer's
  `engine/render3d` + `engine/render3d/gpu` split.
- `engine/kernel`, the ECS storage/schema layer, and the determinism harness
  are fully renderer-agnostic and carry forward untouched.
- `engine/audio` carries forward essentially as-is; 3D spatialization would
  be additive (a listener-relative pan/attenuation stage feeding the
  existing bus-gain pipeline), not a rewrite.
- `engine/input`'s `Raw_Input_Event` ring and `Input_Snapshot` carry forward
  unchanged; only the thin 2D `screen_to_world` convenience layer needs
  replacing.
- `engine/platform` (sokol app/window lifecycle, gamepad polling, web/
  emscripten glue) is largely dimension-agnostic OS/windowing integration
  and mostly carries forward.
- The Lua scripting boundary and Factorio-style mod/data pipeline are
  renderer-agnostic by design — the modding substrate carries forward
  wholesale.
- The texture store's load/placeholder-on-failure/budget-cap idioms
  generalize directly to a mesh/model store with the same bookkeeping shape.
- The screen-space UI/HUD batch and clip-rect (scissor) system carries
  forward as-is — a 3D game's HUD is still 2D screen-space overlay
  rendering.
- The CPU "capture oracle" concept is worth preserving architecturally,
  though the rasterizer implementation (2D quad blitting) needs a full
  rewrite for 3D triangle rasterization.
- TigerStyle engineering discipline itself (explicit bounded caps with
  polite-degrade-not-crash, one-shot warn logging, golden-byte regression
  proof for behavior-preserving edits) is process DNA that should govern the
  new 3D core regardless of implementation.

### Redesign

- Replace the fixed 52-byte billboard-quad `Sprite_Instance` ABI with a real
  per-object instance format (transform + quaternion/scale) plus actual
  per-mesh vertex/index buffers.
- Introduce a real pipeline/material system in the GPU stratum: a pipeline
  cache keyed by (vertex layout, blend/depth state, shader) plus a material
  abstraction, replacing the single hardcoded pipeline.
- Add a depth buffer and switch opaque-geometry ordering from CPU
  painter's-algorithm-by-sort-key to GPU depth-test; keep a CPU sort only
  for the back-to-front transparency pass, sorted by actual view-space
  depth.
- Give `Camera_2D` a real 3D sibling: position, orientation (quaternion),
  FOV/near/far, perspective projection; drop the closed-form
  `screen_to_world` in favor of inverse-VP-plus-depth or ray-casting.
- Build a genuinely new asset pipeline for meshes/skinning (e.g. glTF
  import) and terrain rather than trying to stretch LDtk/DragonBones —
  those tools should stay as the 2D game's tooling, not be generalized.
- Design real 3D lights and shading (position3, direction3, shadow maps or
  at least a light-frustum concept, a proper BRDF) rather than extending the
  2D tangent-space normal-map hack.
- Add frustum/occlusion culling infrastructure from scratch.
- Rethink the instance-budget/streaming model: a fixed
  `SPRITE_INSTANCES_MAX`-style cap on flat billboard count doesn't map to 3D
  scenes bounded by vertex/index memory and draw-call count instead of
  instance count.

### Files of note

| Path | Role |
|---|---|
| `engine/render/batch.odin` | `Sprite_Instance` ABI, sort-key batching |
| `engine/render/camera.odin` | `Camera_2D`, closed-form screen_to_world |
| `engine/render/tilemap.odin` | LDtk tile baking to flat quads |
| `engine/render/lighting.odin` | 2D `Light_GPU`, tangent-space LIT hack |
| `engine/render/frame.odin` | Frame assembly, CPU oracle wiring |
| `engine/render/skeleton_pose.odin`, `skeleton_system.odin` | DragonBones-style 2D skeletal animation |
| `engine/render/gpu/gpu.odin` | The single `sg.Pipeline`, GPU submission |
| `engine/render/gpu/shader.odin` | Hand-authored per-backend shaders |
| `engine/audio/mixer.odin` | Bounded 16-voice push-model mixer |
| `engine/audio/pump.odin` | Main-thread audio pump |
| `engine/input/event.odin` | `Raw_Input_Event` ring |
| `engine/input/snapshot.odin` | Per-tick `Input_Snapshot` |
| `engine/platform/platform.odin` | sokol app/window lifecycle |
| `docs/00-vision.md` | "No 3D" non-goal statement |
| `docs/05-rendering-stack.md` | Render architecture narrative |
| `justfile` (`boundary-scan` recipe) | Mechanical D15 layer-boundary gate |

---

## 5. Tooling / testing infrastructure (`justfile`, `cli/`, `TIGER_STYLE.md`, api-coverage, stress benchmarks, headless verification, CI, `samples/`, `runtime/`)

### Summary

SVSW has unusually mature, deeply layered quality machinery for its stage:
an 857-line `justfile` with roughly 30 gated recipes, a 691-line
TigerStyle-derived engineering standard (`TIGER_STYLE.md`) with a 38-item
mechanical reviewer checklist, a custom 85% "API coverage" proxy (grep-based,
since Odin has no line-coverage tooling), a headless CPU-rasterized frame
oracle for visual regression without a GPU/display, golden world-hash
determinism gates enforced at five independent tiers (core SDK / headless-
server / client CLI / wasm / embedded single-binary), and a deliberately
minimal, pruned CI (one required Linux job plus a cross-OS physics matrix and
a wasm determinism gate — a richer ASan/cross-OS pipeline was explicitly
removed after runner flakiness, with a pointer to git history to restore
it). The `svsw` CLI (`run`/`new`/`package`) is proven end-to-end by
`scaffold-check`, which scaffolds a throwaway project, boots it twice
headless, and packages it into a single embedded binary, asserting
world-hash equality at each step. `samples/` (19 sample games, dominated by
`rpg` at 51 files) and `runtime/` (5 tiny pure-Lua helper files, 474 lines
total) are both appropriately small relative to engine size.

### Strengths

- `just check` composes into one required gate (type-check + test +
  api-coverage + aggregator-check + boundary-scan + scan + cli-smoke(s) +
  tier-scan(s) + api-surface + scaffold-check + mcp-check) — a single
  command with an unambiguous pass/fail.
- Determinism is verified structurally at multiple independent tiers (core/
  headless/client/wasm/embedded-binary) via committed golden world hashes,
  catching a regression at the layer where it was introduced.
- Headless visual verification (`tools/frame-render` CPU sprite rasterizer
  producing pixel-exact BMP/QOI without a window; `ui-capture`; GL-readback
  goldens for particles/lighting) lets render correctness be checked in CI
  and by non-interactive agents.
- `TIGER_STYLE.md` gives paired GOOD/BAD code examples per rule and ends in
  a binary, mechanically-checkable 38-item reviewer checklist keyed to rule
  IDs (A1, B2, C1…) that a reviewer or LLM can grade a diff against without
  ambiguity.
- The 85%-exported-proc-referenced-in-tests api-coverage gate is an honest,
  documented workaround for Odin's total absence of line-coverage tooling —
  the script's header explains exactly why line coverage isn't used.
- `just scan` (security scanners) and `just check`'s hard gates are cleanly
  separated: scan is explicitly report-only (always exits 0), while true
  gates (boundary-scan, aggregator-check, api-surface, tier-scan) hard-fail.
- The stress benchmark budgets p95 tick time and render-batch build time
  with measured, documented baselines, separating a CI-relaxed threshold
  (4x local) from the local-strict one.
- The api-surface gate diffs live public symbols against committed
  `docs/api/<pkg>.txt` snapshots per core-SDK/binding package, catching
  accidental public-API drift.
- CI was deliberately pruned back to a minimal required job after real
  flakiness (Windows hangs, macOS ASan link failures), documented in-file
  with a pointer to restore it — honest scope management, not suppressed
  red.
- Tier-scan recipes mechanically enforce the D42/D15 layering invariant
  (core and headless tiers must not import render/audio/platform/sokol) via
  import-graph grepping, turning an easily-violated architectural rule into
  a gate.

### Weaknesses

- The `justfile` is 857 lines with real duplication: `render-golden-check`,
  `particles-golden-check`, `lighting-golden-check`, `ui-capture-golden-
  check` are near-duplicate 20–40 line bash blocks repeating a golden-BMP-
  compare-plus-re-record-instructions pattern almost verbatim.
- A meaningful set of gates are GPU/display-gated and explicitly *not* part
  of `just check` (particles-golden-check, lighting-golden-check, ambient-
  inverse-check, postfx-proof-check, particles-mask-proof-check) — they rely
  on a human running them on a display-equipped machine before merging,
  which is a structural gap (GPU-path regressions can land on `main` between
  human checkpoints).
- Golden-hash and golden-BMP gates are pinned to one recording machine/
  backend (darwin/arm64 for perf baselines, GL backend for lighting/
  particles goldens; Metal is explicitly "unverified-by-golden, an accepted
  limit") — cross-platform/cross-backend coverage is asserted by policy
  note, not actually gated.
- api-coverage counting exported-proc-referenced-by-name-in-tests is a
  coarse proxy: a test can reference a proc's name without meaningfully
  exercising it, so 85% coverage-by-name is weaker evidence than real
  branch/line coverage.
- CI is intentionally thin (one required ubuntu job); there is currently no
  CI-enforced memory-safety (ASan) or CI-enforced stress-budget check on
  every PR — both live only as local `just` recipes a human must remember to
  run.
- The wasm/web toolchain (`web-probe`, `web-headless-build`, `web-headless-
  trace-compare`, `just web`) is a lot of shell-in-justfile linker-flag
  surgery (undefined-symbol scraping via `emnm`/`awk`/`sed` pipelines),
  fragile to toolchain version drift and hard to unit-test itself.
- Several golden/proof tools (`ambient-inverse`, `postfx-proof`, `particles-
  mask-proof`) exist as one-off `tools/*` binaries each with bespoke
  build+run recipes rather than a single generalized "device-proof harness"
  — a pattern that will keep growing linearly with each new render feature.

### Carry forward

- The `just check` single-gate composition pattern: one command, hard-fails
  on any component, run at every commit. Bootstrap it before the first
  feature lands and grow the composition as gates are added.
- `TIGER_STYLE.md`'s structure: adopt a base standard (cite the source),
  explicitly carve out parts that don't fit the project's architecture with
  stated reasons, and end with a binary mechanically-gradable reviewer
  checklist keyed to short rule IDs.
- Golden-hash/golden-output determinism testing: commit hash/byte-exact
  goldens early and gate on them at as many independent binary/tier
  boundaries as exist — cheap to add early, expensive to retrofit once tiers
  multiply.
- Headless CPU-oracle rendering (rasterize the same batch data a GPU would
  consume, in software, for byte-exact comparison without a display) is a
  strong, portable pattern for CI-verifiable visual regression tests without
  GPU runners.
- `scaffold-check`'s pattern (new project → run twice headless → assert hash
  equality → package → assert embedded==disk) is a good end-to-end smoke
  test for any CLI/scaffolding tool and should be written as soon as `new`/
  `run`/`package` exist.
- The api-surface snapshot-diff gate (commit the public symbol list per
  package, diff on every check, force a version bump on intentional change)
  is cheap and worth carrying into any project with a library-shaped public
  API.
- Keep `samples/` and a `runtime/`-equivalent stdlib intentionally small and
  only grow them in step with real engine capability being validated.

### Redesign

- Do not let the golden/BMP-compare recipe pattern get copy-pasted per
  feature — write one parameterized "golden-compare" script/recipe from the
  first golden test and have every subsequent visual gate call it with
  different paths/builders.
- Decide the ASan/memory-safety story before CI grows: SVSW's CI was pruned
  back after macOS ASan couldn't link on the runner, leaving zero
  CI-enforced sanitizer coverage today. Either commit to a working sanitizer
  job in CI, validated on the actual runner, before merging the first
  feature, or explicitly document it as a local-only pre-merge gate.
- Separate "report-only" security/lint scanning from hard gates explicitly
  and early (SVSW's `just scan` vs `just check` split) as a first-class
  recipe convention, not an ad hoc one discovered later.
- For any GPU-touching visual feature, decide up front whether it defaults
  to a headless CPU-oracle test (cheap, CI-able, proves only CPU-visible
  data) or a real GPU-readback golden (proves the actual shader path, needs
  a human checkpoint) — pick and document the default before the
  `tools/*-golden` binaries proliferate.
- Version-pin toolchains (SVSW pins the wasm CI job to a specific `emcc`
  version to avoid reintroducing the drift the gate exists to prevent) as a
  standing policy for any golden/determinism-sensitive external toolchain,
  set before the first such toolchain enters the gate.
- Extend the multi-tier golden-hash pattern (core/headless/client/wasm/
  embedded, §5 above) with a headless-vs-windowed parity gate: run the same
  scenario in both modes and assert identical world hashes, identical
  draw-list skeleton hashes, and comparable readback goldens. SVSW's tiers
  already compare hashes across binary boundaries; none of them today
  compares a headless run against a windowed run of the same scenario. An
  agent invoking the engine headlessly needs that guarantee to trust the
  result against what a human sees in a windowed run.
- If the new language/ecosystem has real code-coverage tooling (unlike
  Odin), use it instead of inventing a name-referenced-in-tests proxy —
  SVSW's api-coverage gate is a reasonable workaround for Odin's specific
  gap, not a generally superior technique.
- Recalibrate TIGER_STYLE's numeric thresholds (70-line-function, 2-
  assertions-per-function) per language/paradigm before reusing verbatim —
  they were tuned for Odin's C-like control flow; a higher-level or more
  expression-oriented language may need different numbers even if the
  discipline itself carries over.

### Files of note

| Path | Role |
|---|---|
| `justfile` | ~30 gated recipes, `just check` composition |
| `TIGER_STYLE.md` | Engineering standard, 38-item reviewer checklist |
| `scripts/api_coverage.sh` | 85% exported-proc-referenced-in-tests gate |
| `scripts/api_surface.sh` | Public-symbol snapshot-diff gate |
| `scripts/aggregator_check.sh` | Aggregator/package-boundary check |
| `scripts/boundary_scan.sh` | D15 sokol-boundary mechanical gate |
| `scripts/tier_scan.sh` | D42 core/headless-tier import gate |
| `scripts/scan.sh` | Report-only security scanners |
| `engine/stress/main.odin`, `seek.odin` | p95 sim/batch-build stress benchmark |
| `cli/main.odin`, `new.odin`, `run.odin`, `package.odin` | `svsw` CLI |
| `cli/scaffold/` | Project scaffold templates |
| `.github/workflows/ci.yml` | Minimal required CI job, cross-OS matrix |
| `samples/README.md` | 19 sample games, size discipline |
| `runtime/README.md` | Pure-Lua stdlib helpers |
| `docs/09-testing-standards.md` | Testing standards, budget documentation |

---

## Cross-cutting synthesis

Themes that recur across more than one of the five areas above, useful as a
single checklist when scoping the successor engine's own decision log:

1. **The determinism/off-hash-gate pattern is the throughline.** It appears
   as a decision-log motif (§1), as the mechanism the kernel enforces (§2),
   as the boolean-gate family scattered through the scripting boundary that
   should be unified (§3), and as the reason the render core can stay
   sokol-free (§4). A successor engine should treat "is this state hashed
   simulation state or off-hash presentation state, and how is that
   enforced" as one design question answered once, not independently in
   each subsystem the way SVSW's scattered `in_on_frame`/`in_on_destroy`
   gates show it drifted into.
2. **Every area's single biggest gap is the same gap: multi-user, server-
   authoritative scale.** §1's multiplayer-is-architecture-only, §2's
   whole-world-hash-doesn't-scale-to-MMO-population, §3's shared-mod-world
   complexity being a single-World consequence, and §5's CI/golden pinning
   to one machine are all facets of "this was built and proven for a single
   local player." None of it is a defect in what SVSW is; all of it is
   evidence that the successor engine's server/scale story is greenfield
   work, not an extension.
3. **The layer-boundary discipline (D15/D42) is SVSW's most load-bearing,
   most successfully enforced architectural choice**, and it is precisely
   what makes so much of §2/§3's kernel and scripting layer already
   dimension- and topology-agnostic. Preserve the *mechanism* (an automated
   grep/import-graph gate, not a code-review convention) even where the
   *boundary itself* (sokol only in the platform tier) is redrawn for a
   different renderer.
4. **SVSW is candid about its own accepted risk** (regex-backtracking DoS,
   Metal-unverified-by-golden, mobile-unproven, save-format hard-reject) far
   more consistently than most codebases at this maturity. That documentation
   habit (§1, §5) is itself worth carrying forward as a process practice,
   independent of any specific technical carry-forward.
5. **Where SVSW's own decisions churned most (UI, §1; sandbox surface, §3;
   packaging, §1) the common cause was designing a narrow slice and
   discovering the full requirement reactively.** The successor engine's
   equivalent surfaces — a UI framework worthy of a CCP-Carbon comparison, a
   mod-trust model sized to its actual population, a distribution model
   sized to its actual service shape — are exactly the places to invest in
   up-front scoping rather than repeat SVSW's incremental-discovery pattern.

## How this pass differs from the first-pass documents

`svsw-evidence.md` inventories *what is implemented*, with file:line
citations, scoped to "implemented with test evidence." This document instead
organizes the same underlying codebase by *engineering judgment per
subsystem area* — strengths, weaknesses, and an explicit carry-forward/
redesign split — matching the five-area structure of the survey that
produced it. `successor-engine-plan.md` proposes the new engine's own
architecture and proof roadmap; the redesign items here are inputs to that
plan, not a competing proposal. Where this document and `svsw-evidence.md`
name the same file, treat `svsw-evidence.md`'s file:line citations as the
more precisely verified reference.
