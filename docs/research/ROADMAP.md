# Roadmap: the successor engine (SVSW → 3D, headless-first, editor-equipped, multiplayer)

Research-era record. Decision numbers here use the research-era scheme; docs/decisions/README.md carries the mapping to the current log.

Status: definitive dependency-ordered roadmap from the maintainer grilling
session, revised against the two adversarial critique passes
(sequencing/feasibility and completeness; dispositions in the Review notes
appendix). The locked decisions it serves (private product requirements as the
requirements driver, chunked world, server-authoritative multiplayer,
presentation-only animation, mod-machinery port, evolve-in-place, wgpu, SDL3,
Forward+ PBR, ImGui everywhere, editor Lua in v1, two-client co-op in the
multiplayer verification harness) are settled; this document sequences them
and does not re-litigate them. It supersedes the phasing in
`ODIN-ENGINE-RESEARCH-AND-PLAN.md` §5 (see Overrides table) and, at engine
completion, replaces `docs/08-roadmap.md` as the live roadmap. The maintainer
commits the research corpus in this directory, including
`ODIN-ENGINE-RESEARCH-AND-PLAN.md` (whose unlisted positions this roadmap
adopts), into the svsw repo under `docs/research/` in the same change series
that adopts this roadmap, so the normative baseline lives in the repo it
governs.

Governing rules, from the maintainer meta-directive:

- **Engine before game.** The engine finishes first; the private product gets
  built only after the engine is complete. Private product requirements
  (chunked world, co-op, and other mechanics scoped outside this repository)
  are the requirements driver that shapes engine subsystems: the collision
  envelope, the replication topology, the camera continuum. Vertical scenes
  built along the way are engine verification artifacts, small test scenes
  proving subsystems end-to-end (two clients claiming adjacent chunks over a
  real network, for example). None of them is game production.
- **No backward compatibility.** Nothing in SVSW's current behavior, file
  formats, APIs, goldens, or gates is owed continuity. "Evolve in place"
  means keeping the repo, CI plumbing, beads/issue history, decision log, and
  the portable subsystems; the old engine does not stay runnable. Old-target
  goldens and gates drop the moment the new target has equivalent gate
  coverage of its own; the cutover commit deletes the sokol/Clay/2D-era code,
  and git history is the archive.
- **No scope anxiety.** No descope triggers and no cut lists appear anywhere
  in this document. When work slips, the maintainer re-sequences it: named
  work moves to a later stage, whole. Scope, quality, and the locked
  decisions do not degrade. Re-sequencing is itself governed by the
  re-sequencing cap below.
- **Longest-run optimum.** The maintainer resolved every residual fork for
  the longest-run payoff over the cheap stopgap: a sectioned asset container,
  a versioned wire protocol from frame one, a command-stream editor, QUIC
  transport, real CI on both target platforms from stage 0.
- **Dual-mode parity (D72).** The engine runs in headless mode and in regular
  windowed mode and produces the same results: same world hashes, same
  draw-list skeleton hashes, comparable readback goldens. A parity gate runs
  the same scenario in both modes and asserts identical hashes. The gate is a
  golden tier from stage 0 onward and appears in every stage exit gate that
  renders a scenario.
- **Re-sequencing cap.** Nothing determinism-sensitive and nothing that is a
  security boundary may re-sequence into stage 6 (engine-completion
  verification). The only work permitted to land there from earlier stages is
  pure presentation-tier work (GPU skinning, HUD-polish-adjacent items).
  Everything else re-sequences into the stage 4/5 parallel lanes with its own
  review window, and stage 6 waits on it.
- **Review serialization.** At most two stages run in flight at any time, and
  determinism-sensitive or security-boundary merges take review one at a
  time; that review does not parallelize. Stage 4 starts only after the
  stage 3 deletion commit.

Course verification joins the gate roster per D77: a spec closes at course
published only when its course module's gate (embed-check against the pinned
engine commit, reference cross-check, path closure, full site build) runs
green.

---

## Stage overview

| # | Stage | Exit artifact |
|---|-------|---------------|
| 0 | New-stack proof (SDL3 + wgpu + headless goldens) | Textured cube; world, skeleton, readback, and parity goldens; two CI platforms; no window required |
| 1 | Renderer: Forward+ staged (sun+CSM, then clustering) | Sun+CSM PBR scene green on all golden tiers, parity included; split-process client/sim over the real protocol; 3D stress harness live |
| 2 | World structure + assets (chunks, container, assetc, collision v1) | glTF scene → container → rendered across chunk boundaries, per-chunk hashes green, headless and windowed alike, both platforms; mod machinery proven on the new target |
| 3 | Platform completion + **hard cutover** (SDL3 audio/input, ImGui HUD re-bind; sokol/Clay/2D deleted) | One maintained target; full equivalence checklist incl. script/mod, audio, and parity gates; deletion commit |
| 4 | Editor + animation (ImGui chrome, gizmos, scene editing, editor-Lua tier; anim runtime) | Committed edit-command log replays headless to a hash-checked scene; parity holds on playback |
| 5 | Multiplayer: protocol freeze, Go gateway, two-client co-op harness | Two clients claim adjacent chunks over an actual network via the Go gateway, against stage 5's own test content |
| 6 | Engine-completion verification + rebrand | The engine verification scene: mechanics from private product requirements as test content, base-as-mod + second mod, co-op, first-person drop-in; new name, CLI rename |

The private product follows engine completion and has its own closing section
below the stages; it is not an engine stage.

The protocol seam exists from stage 0 (tier-scan arrow gate + versioned frame
format); the client/authoritative-sim split runs through the real protocol
from stage 1 onward (decision: verification co-op is real, so the split is
never faked in-process-only). Stage 4 starts only after the stage 3 deletion
commit; the review-serialization rule forbids a three-stage knot at the
cutover.

---

## Stage 0: New-stack proof

**Goal.** The smallest thing proving the NEW stack end-to-end: SDL3 window +
wgpu device; the same frame rendered headless (no window) in CI via wgpu
offscreen; a textured cube orbited by a deterministic camera inside a real
`Session`; draw-list skeleton hash + readback golden green on macOS arm64 and
Linux x86-64 CI; the first parity gate proving the windowed run reproduces
the headless hashes.

**Workstreams.**

- *Vendoring (quarantine ritual, first; the full tree list, enumerated).*
  Everything enters `vendor/` under the standing policy: proposed, reviewed,
  pinned by checksum/commit, provenance in `VENDOR.md`, hostile-input posture
  recorded. `VENDOR.md` also records a **binary-vs-source posture per
  dependency**:
  - **SDL3**: vendored as source, built by `just vendor-libs`.
  - **wgpu-native**: vendored as **prebuilt release binaries**, one per
    target platform, checksum-pinned. No Rust toolchain enters the dev or CI
    requirements; an upgrade is a new pinned release with a recorded upgrade
    procedure. The quarantine posture for Rust artifacts is honest about its limits: a
    multi-hundred-kLoC Rust tree cannot be source-reviewed the way a C header
    is, so the trust basis is upstream release provenance plus checksum
    pinning plus the boundary discipline (only `engine/render3d/gpu` touches
    it).
  - **naga**: vendored as a **prebuilt naga-cli binary**, checksum-pinned,
    same posture as wgpu-native; `just shader-check` invokes it.
  - **Dear ImGui + cimgui**: Dear ImGui's C++ sources plus the
    imgui_impl_sdl3 / imgui_impl_wgpu backend sources, entering Odin through
    **cimgui's generated C wrappers, the generated backend wrappers
    included** (or a small hand-written C shim where a wrapper gap exists,
    per D64's shim rule), reviewed and pinned in this pass even though the
    first consumer lands in stage 2: one vendoring ceremony covers all three
    consumers. The C++ compiles inside `just vendor-libs`; nothing above the
    platform tier sees a C++ symbol.
  All of these enter Odin through vendored C headers per the C-tier policy
  (D64 below): the C ABI is the FFI lingua franca; only the platform tier
  touches C.
- *New binary target beside the old.* `engine/platform_sdl` (SDL3 window,
  event pump, swapchain surface) plus `engine/render3d` (a sokol-free and
  wgpu-free CPU core emitting a plain draw-list) plus `engine/render3d/gpu`
  (the single wgpu-native consumer; offscreen attachment for headless). Both
  modes drive one render path into the same offscreen target and the window
  presents from that target, so windowed and headless runs hash the same
  bytes (the machinery D72 rests on; a mode fork in the render path cannot
  hide). The old sokol path keeps every existing 2D gate green untouched;
  nothing old changes in this stage.
- *Ports (unchanged, consumed in place):* `engine/kernel`, `engine/ecs`,
  `engine/simrng`, `engine/harness`; the cube orbits inside a real Session,
  world-hash golden included. From this stage until the stage 3 deletion
  commit, the shared kernel packages freeze **additive-only**: no signature
  or behavior change to any proc the old target's goldens exercise. The
  freeze keeps both targets' determinism gates green through the transition
  (see stage 2).
- *New:* `engine/simmath3d` minimal subset (vec3/mat4/quat; transcendentals
  banned, added one function at a time on demonstrated need) under the
  policed no-FMA / no-`core:math/linalg` policy, with the cross-CPU/cross-OS
  hash gate live from the first commit (macOS arm64 vs Linux x86-64 is the
  matrix, catching both FMA contraction and libm variance).
- *Shader gate rebuilt around naga.* Shaders are WGSL; `just shader-check`
  becomes naga validation over the (two-file) corpus. The sokol-shdc path is
  dead and is never wired.
- *Parity gate (D72), first instance.* `just parity-check` runs the cube
  scenario twice, once headless and once through a real SDL3 window and
  swapchain, and asserts identical world hashes, identical draw-list skeleton
  hashes, and a matching readback golden. The gate runs on any machine with a
  display; Linux CI runs the windowed leg under a virtual display, and
  headless-only runners run the headless tiers alone.
- *Protocol seam, stage-0-adjacent.* `protocol/` package v0: versioned,
  checksum-first, length-prefixed frames (extending the replay-codec
  hardening pattern), version negotiation with a supported-version whitelist;
  the `Session.step(Canonical_Input_Set) → Tick_Commit` seam named in code;
  the tier-scan dependency-arrow rule (session/kernel never imports network,
  wall clock, or Go-facing code) enforced as a gate. A loopback echo
  conformance test proves framing; the split-process client lands in stage 1.
- *Profiling from the base:* spall zones in every new package from the first
  commit (carbon-core's tracy-at-the-base lesson), compiled out of retail.

**Exit gate.** `just check` (extended with `render3d-golden-check`: world
hash + draw-list skeleton hash + wgpu offscreen readback golden, perceptual
tolerance) green on macOS arm64 and Linux x86-64 CI, windowless. `just
parity-check` green on the cube scenario. `just shader-check` (naga) green.
`just proto-frame-check` (framing conformance) green. The SDL3 window opens
the same frame on the dev machine and a human confirms appearance (the parity gate
machine-checks the hashes; GUI appearance is never claimed headless).

**Depends on.** Nothing prior; this is the root.

**Risks.** wgpu-native API churn between pins (mitigate: checksum pin plus a
recorded upgrade procedure in VENDOR.md); GPU-less Linux CI readback
(mitigate: wgpu's Vulkan/lavapipe software path is the named fallback for the
readback tier; the skeleton-hash tier needs zero GPU by construction);
simmath3d determinism across arm64/x86-64 (mitigate: the gate is live before
any dependent code exists); windowed-vs-headless drift (mitigate: one render
path, one offscreen target; the window is a presenter, never a second
pipeline).

**Re-sequencing rule.** If stage 0 work must move, the corpus-wide naga gate
and the loopback protocol test re-sequence into stage 1. The cube, the four
golden tiers (world, skeleton, readback, parity), and both CI platforms are
the irreducible exit and are never thinned.

---

## Stage 1: Renderer, Forward+ staged

**Goal.** The real renderer, staged per the locked lighting decision: glTF
metallic-roughness PBR as-authored; **milestone A**, one
cascaded-shadow-mapped sun; **milestone B**, compute-shader clustered light
culling (Forward+). Engine-completion verification blocks on milestone A
only, never on the cluster pass. CSM quality and performance iteration is
priced into this stage as its main sink, and the 3D stress harness is this
stage's named work rather than a late discovery.

**Workstreams.**

- *New:* `engine/simmath3d` fleshed out under the policed policy; render-side
  math sits outside the policed regime (presentation floats are excluded from
  the portable hash tier; the skeleton hash covers pipeline ids, resource
  handles, draw order, counts, pass structure).
- *New:* pipeline cache keyed by a fixed small permutation set (lit/unlit ×
  skinned/static × alpha modes; no combinatorial ubershader); frustum
  culling; depth-buffer opaque ordering + back-to-front transparent pass;
  material system consuming glTF metallic-roughness as-authored; WGSL corpus
  growth under the naga gate.
- *Milestone A:* directional sun + cascaded shadow maps, readback goldens.
- *Milestone B:* wgpu compute light clustering; cluster-assignment counts
  join the skeleton hash so the gate catches clustering regressions CPU-only.
- *New: 3D stress harness.* `just stress` gains a 3D benchmark now, not at
  the cutover: draw-list build p95 + sim tick p95 on a synthetic multi-chunk
  scene, with budgets marked **provisional** until the stage 3 re-baseline.
  Perf-critical renderer and chunk code does not go gate-dark between here
  and the cutover; the re-baseline confirms budgets rather than discovering
  regressions.
- *Camera:* position/quaternion/FOV/near-far; inverse-VP ray picking; the
  top-down-to-first-person continuum the verification scene needs
  is designed here (one camera, two rigs), exercised by a test scene.
- *Protocol seam made real:* the cube/test scene runs split-process, a
  headless sim process against a render client over `protocol/` on
  localhost. From here on, the client/authoritative-sim split through the
  real protocol is the normal dev topology rather than a special mode.
- *Ports consumed:* `engine/input`'s three-stage seam feeds the client intent
  stream unchanged (SDL3 event translation is stage 3 work; the sokol path
  still feeds it until cutover).

**Exit gates, split to match the milestones.**

- *Milestone A gate, which is the stage exit:* a multi-object, **single-sun,
  CSM-shadowed** PBR scene green on the world-hash, skeleton-hash, readback,
  and parity tiers, both CI platforms (the parity leg adds the windowed run
  of the same scene); `just split-smoke` boots sim + client as two processes
  and asserts N ticks of hash-checkpointed agreement; the 3D stress harness
  runs in CI with provisional budgets.
- *Milestone B gate (travels with B wherever it lands):* an N-point-light
  clustered scene with cluster-assignment counts green in the skeleton hash.

**Depends on.** Stage 0 (stack, goldens, simmath3d subset, protocol v0,
parity machinery).

**Risks.** CSM quality/perf iteration (priced in as the stage's main sink);
compute clustering on the Linux software-Vulkan CI path (mitigate: the
skeleton-hash cluster counts assert correctness CPU-side, no pixels needed).

**Re-sequencing rule.** Milestone A is the critical path: every downstream
stage waits on it. If milestone B moves, it re-sequences to stage 3
**carrying its own gate with it**, never into stage 6 (it adds skeleton-hash
surface, which the re-sequencing cap classes as determinism-adjacent gate
work). If the split-process smoke moves, it re-sequences to early stage 2.
The protocol seam gates (tier-scan arrows, framing conformance) do not move.

---

## Stage 2: World structure + assets

**Goal.** The Factorio-model world and the asset pipeline: a chunked world of
unbounded extent with chunk-local sim coordinates, per-chunk world hashes
generalizing the golden-hash discipline, floating-origin rendering; the
sectioned asset container and `assetc`; deterministic collision v1 sized to
private product requirements; the mod machinery wired to the new target **and
proven the moment it is claimed**.

**Dependency split (stated with precision).** The sim/tool-side workstreams
(`engine/worldgrid`, per-chunk hashing, the container format, `assetc`,
collision v1) depend only on stage 0 and start while stage 1's renderer tail
finishes. The rendered exit gate, floating-origin work, and the asset viewer
depend on stage 1 milestone A. The split doubles as the pull-forward map if
stage 1 re-sequences: the renderer-independent half proceeds; the rendered
half moves with milestone A.

**Workstreams.**

- *New (high-tier, determinism-sensitive): `engine/worldgrid`, with the
  kernel-freeze mechanism named.* Chunk index + chunk-local coordinates in
  sim state; per-chunk hashes composed into a root. The reconciliation with
  the still-green old-target goldens is spelled out: **per-chunk hashing
  lands only in the new target's session assembly.** `engine/worldgrid`
  composes chunk hashes *over the existing, unchanged `hash_world`
  primitives*; the old target never calls it; the shared kernel packages stay
  frozen additive-only (stage 0's rule) until the stage 3 deletion commit. No
  old golden gets re-recorded, no second hash path lives inside the kernel,
  and no long-lived branch is needed; the composition lives above the frozen
  primitives. The injectivity/length-prefix discipline carries over verbatim;
  the completeness-reflection test extends to chunk fields. Chunk
  activation/deactivation is deterministic sim state. Recorded in D55.
- *Verification-scene world content (decided, D67):* the engine verification
  scene's few chunks are **hand-authored data-stage scenes**, authored in the
  stage 4 editor, which makes the editor an explicit prerequisite for
  verification-scene content; the stage order places stage 4 before stage 6
  for that reason. Chunks without authored content activate with a
  **deterministic default fill** (flat terrain, hashed, seeded by a trivial
  rule) so the world's unbounded extent is real rather than decorative. Full
  seeded procedural worldgen (terrain variation, resource-node placement) is
  post-engine game work under the longest-run rule: built once, for the
  shipped game's real needs.
- *New:* floating-origin rendering in `engine/render3d` (presentation-side
  re-basing; it touches no sim coordinates or hashes, proven by an invariance
  test, the D18/D25/D33-lineage off-hash pattern).
- *New: the sectioned binary asset container (D69).* Magic/kind/schema-version
  header; section table with offset/size/compression/gpu-alignment; importer
  id + version + source digests; stable logical content IDs; per-section and
  whole-file checksums; supported-version whitelist; authored sources never
  deleted; re-bake on bump, zero runtime migration code (CMF's shape,
  red-to-black's authored/baked split). The container's name and magic bytes
  are **brand-neutral from definition**, chosen before any baked data exists,
  so the rebrand at engine completion touches no shipped data and respects
  the container's own version discipline. (The brand-neutral pick replaces
  the working name `.sva` at definition time; this document says "the
  container" hereafter.)
- *New:* `tools/assetc` (Odin CLI): glTF import via vendored **cgltf**, GPU
  texture encode via vendored **bc7enc + astcenc** (BC7 desktop, ASTC held
  for later mobile), both quarantine-reviewed and pinned this stage; encoder
  versions recorded in the container's importer-version field so encoder
  bumps surface as provenance changes rather than mysterious golden drift.
- *New (requirements-driven; private product requirements exist):* deterministic collision
  v1 in policed simmath3d terms: capsule/AABB/sphere primitives vs primitives
  and vs chunk terrain (grid/heightfield proxies); a degenerate-case test
  corpus written before the solver; all state in hashed ECS components with
  snapshot-resim tests. This is the envelope private product requirements
  need (building placement, unit interaction, first-person controller) and no
  wider. No swept-vs-arbitrary-triangle-mesh in the deterministic path;
  middleware only ever off-hash.
- *First ImGui deliverable:* the standalone **asset viewer**
  (imgui_impl_sdl3 + imgui_impl_wgpu via cimgui), the pipeline's proving
  ground and the editor tier's plumbing proof, shipped before the editor
  proper. Its non-movable kernel is the **minimal ImGui-on-SDL3/wgpu shell**:
  whatever else moves, that shell lands before stage 3's Lua-UI-over-ImGui
  re-bind starts, because the re-bind builds on that plumbing.
- *Ports consumed as-is, and proven:* `engine/script` + `engine/mod` (the
  whole multi-mod shared-world machinery: global component IDs,
  first-declarant-registers, schema mirroring, settings→data→control) wires
  to the new target unchanged, and a **skeletal second-mod mirroring test**
  (a trivial mod patching data and registering one component beside a minimal
  base mod) joins this stage's exit gate, so "mod machinery wired" is
  provable the moment it is claimed. Scenes/prefabs are data-stage content
  (Lua data files + container references); no second scene format, ever.
- *New: 3D scaffold templates.* `svsw new`'s templates are rebuilt for the
  new target (3D scene, container-referenced assets, headless-boot main),
  and `scaffold-check` gains a new-target variant. This stage names the work
  because it is a stage 3 cutover precondition; left unnamed, it would
  surface as a checklist failure at the cutover.
- *New: verification-harness migration (spans stages 2 and 3).* The machine
  verification harness is 2D-bound today (the svsw-sim MCP suite,
  `engine/capture`/`engine/dev`, the headless-verify/golden-hashes skills).
  This stage starts its 3D-target successors: golden record/check/frame-diff
  tooling over the new golden tiers (world/per-chunk hash, skeleton hash,
  readback, and the dual-mode parity runner), with skill updates; stage 3
  completes the migration before the deletion commit removes the old tools.

**Exit gate.** `just check` extended: a glTF scene round-trips
source → container → rendered goldens headless on both platforms; `just
chunk-golden-check`: an entity walks across a chunk boundary over N ticks,
the per-chunk + root hashes match committed goldens, and a floating-origin
re-base proves hash-neutral; `just parity-check` green on the chunk-crossing
scenario (the windowed leg reproduces the headless per-chunk and root
hashes); collision corpus green; the skeletal second-mod mirroring test green
on the new target; the asset viewer opens a container file (human
checkpoint).

**Depends on.** Stage 0 for the sim/tool-side half; stage 1 milestone A for
the rendered half (split stated above).

**Risks.** Per-chunk hashing is kernel-adjacent work above the most
load-bearing code in the repo (mitigate: the
composition-over-frozen-primitives mechanism keeps the kernel untouched;
high-tier effort routing, adversarial review before merge, the four-layer
determinism pyramid extended per chunk); cgltf/encoder hostile-input surface
(mitigate: quarantine hardening per the codec discipline).

**Re-sequencing rule.** If stage 2 work moves, the asset viewer's
container-browsing features and the `assetc` audio-bake extension re-sequence
to stage 4; the minimal ImGui shell does not move, because stage 3's re-bind
depends on it. Per-chunk hashing, collision v1, the scaffold templates, and
the mirroring test gate stage 3: they re-sequence nowhere and hold the
cutover instead.

---

## Stage 3: Platform completion + hard cutover

**Goal.** Finish the SDL3 platform swap (audio, input, gamepad), re-bind the
mod-facing Lua UI API over ImGui, complete the gate and harness equivalence,
then execute the cutover: the new target becomes the only maintained target,
and the cutover commit deletes the old one.

**Workstreams.**

- *Audio on SDL3:* `engine/audio`'s push-model 16-voice mixer core ports
  unchanged; the pump re-plumbs onto SDL3 audio streams; the additive
  listener-relative 3D spatialization stage lands here. sokol_audio dies with
  the cutover. **Audio gets a machine-checkable gate**, beyond the human
  "with sound" checkpoint: the push mixer runs without a device, so a
  scripted scene's mixer output buffer is golden-hashed (mixer determinism),
  and an invariance test proves the spatialization stage is hash-neutral to
  the world hash. This gate travels with the audio workstream wherever it
  goes.
- *Input on SDL3:* the three-stage seam (`Raw_Input_Event` ring →
  `Input_Snapshot`) ports untouched; only the event-translation front swaps
  to SDL3, which also closes the stubbed Windows/Linux gamepad gap (SDL3's
  gamepad database is the payoff).
- *Lua UI re-bind:* the `svsw.ui` mod-facing API re-binds over ImGui
  (imgui_impl_sdl3 + imgui_impl_wgpu, cimgui C ABI, platform tier only). Same
  off-hash gated-presentation discipline, same containment guarantees; the
  authoring surface mods see is preserved in spirit, and no bug-for-bug
  compatibility is owed. Shipped-HUD theming and gamepad-navigation polish
  are **named work** in stage 6.
- *Harness migration completed:* the 3D golden record/check/frame-diff
  tooling, the parity runner, and the skill updates started in stage 2 finish
  here, before the deletion commit removes the old tools.
- **The cutover (the no-backward-compat directive, executed).** Precondition:
  the new target has equivalent gate coverage of its own, the **full
  equivalence checklist**, which is the merge checklist and gets an
  adversarial review:
  1. determinism goldens (world + per-chunk);
  2. draw-list skeleton goldens;
  3. readback goldens;
  4. boundary/tier scans (including the C-tier scan, D64);
  5. api-surface snapshots;
  6. stress budgets re-baselined on the 3D harness (provisional to
     confirmed);
  7. `scaffold-check` green against the 3D templates (stage 2's named work);
  8. **the script/mod gate family**: a 3D-target equivalent of
     `engine/script_accept` with at least one hash-golden Lua game, the
     sandbox containment/disable-in-place tests, budget enforcement, and a
     minimal settings→data→control pipeline test, plus the stage 2 mirroring
     test, so the engine's security boundary and the multi-mod pipeline stay
     gated through the whole transition;
  9. **the SDL3 audio pump** with its headless mixer golden (mixer-core
     tests alone do not cover the platform seam);
  10. the migrated verification harness operational over all new golden
      tiers, the dual-mode parity gate (D72) included.
  The moment the checklist holds, all of it (no three-subsystem-subset
  shortcut exists), one merge series drops the old-target goldens and gates
  from `just check` and CI and **deletes** the 2D-era surface, with no
  in-tree archive and no feature flag: `engine/render` (2D),
  `engine/render/gpu`, `engine/physics` (2D), `engine/ui` and the Clay stack,
  the 2D halves of `engine/capture` and `engine/dev`, sokol vendoring, Clay
  vendoring, the LDtk/DragonBones/Aseprite 2D asset paths, the
  svsw-ldtk/svsw-aseprite MCP servers, and the 2D web target. Git history is
  the archive. `just check` is one gate for one engine again.
- *Boundary gates extended:* boundary-scan now polices "only the platform
  tier touches C" (SDL3, wgpu-native, cimgui, Lua headers), D15's discipline
  generalized to the C tier (D64).

**Exit gate.** The deletion commit itself, with `just check` green on both CI
platforms right after: no old-path recipe, golden, or vendored tree remains;
`just stress` re-baselined against the 3D target with measured p95 budgets;
`just parity-check` green on the cutover test scene; a headless run and a
windowed run of the split-process test scene with sound and gamepad (human
checkpoint for the audible/visible half; items 1 through 10 cover the
machine-checkable halves).

**Depends on.** Stage 2 (gate-equivalence needs real scenes, chunk goldens,
scaffold templates, and the mirroring test to gate against). Milestone B
(clustering) lands here if it re-sequenced out of stage 1, carrying its gate.

**Risks.** Gate-equivalence judged too eager (mitigate: the ten-item
checklist above is the merge checklist, it gets an adversarial review, and it
has no subset form); the ImGui HUD re-bind surprises mods (accepted: no
compatibility owed; base-game-as-mod is updated in the same series, which is
the D5 forcing function).

**Re-sequencing rule.** Symmetric, with no carve-outs: **the deletion commit
requires the full equivalence checklist, the SDL3 audio pump and its headless
gate included. An unmet checklist item holds the cutover**, and the cutover
holds every downstream stage. The deletion is one commit series with no long
parallel-maintenance tail, and equivalence is never redefined down to a
subsystem subset.

---

## Stage 4: Editor + animation

**Goal.** The editor as a privileged SDK tier, and the presentation-only
animation runtime: the two client-side pillars the verification scene's
content gets authored with. Starts after the deletion commit: one target, one
gate, no three-way contention with the cutover (the review-serialization rule
in the governing rules).

**Workstreams.**

- *Editor architecture (fixed up front, D71):* an Odin binary in the
  **editor tier** (tier-scan enforced); every edit is a typed command on a
  command stream (undo/redo and edit persistence are command-log mechanisms);
  play-in-editor boots a real deterministic `Session` with live world-hash
  display, tick stepping, and replay scrubbing; the editor doubles as the
  determinism inspection tool.
- *Editor features, in sequence:* scene tree + inspector + play/pause/step +
  hash display → asset browser (+ `assetc` audio bake WAV/OGG → container
  sections) → gizmos (picking via geometry-only inverse-VP rays against
  render-mesh AABBs) → profiler panel surfacing the spall zones, frame
  timing, draw/instance counts, and Lua budget consumption. Scene edits write
  data-stage content; the editor has no private formats.
- *Editor-Lua capability tier (locked: ships in v1):* the **same VM
  architecture as the mod sandbox** (whitelist construction, alloc cap,
  instruction budget, R1–R5 longjmp discipline, disable-in-place containment)
  instantiated with an expanded capability tier: project-scoped filesystem,
  asset writes via `assetc` invocation, editor UI bindings (ImGui-backed),
  command-stream emission. One embedding, with mod containment guarantees
  preserved verbatim. Gate: an editor script reaches a running Session's sim
  state through the command stream and through nothing else.
- *Animation (locked contract):* presentation-only, off-hash, client-side.
  Pose sampler (keyframe curves) → linear blend (uniform + per-bone mask) →
  GPU skinning in render3d; container skeleton/animation sections land in
  `assetc` now. The sim carries deterministic capsules/AABBs for all
  combat/interaction (built in stage 2); the deterministic
  per-joint-keypoint upgrade path is **logged, not built** (D61). Proven
  golden-neutral by the standing invariance-test pattern.

**Exit gate, defined as command-stream replay so CI can run it.**
`just editor-roundtrip-check`: a **committed edit-command log** (authoring a
scene: meshes, lights, an animated character, a chunk of terrain)
**replays headless** through the command stream to produce the scene as
data-stage content; the scene plays N deterministic ticks and its world hash
matches the committed golden; the produced scene also passes `just
parity-check` (windowed and headless playback hash identical). This puts the
command stream itself under gate coverage. The human checkpoint is separate
and happens once: a human authors that command log in the real editor (GUI
work is never claimed headless). Editor-Lua containment tests green (a
hostile editor script is contained and disabled the same way as a hostile mod).

**Depends on.** Stage 2 (container, asset viewer plumbing, collision for
picking parity), stage 3 (ImGui platform backends, one-target world, the
deletion commit).

**Risks.** Editor scope explosion (mitigate: the feature sequence is closed,
anything beyond it waits for the verification scene to demand it; ImGui
rather than in-house chrome; the command stream is the single edit
mechanism); editor-Lua capability creep (mitigate: the capability tier is a
whitelist diff against the mod sandbox, reviewed as a security boundary at
high effort tier).

**Re-sequencing rule, bounded by the cap.** If the editor re-sequences, the
profiler panel moves into the stage 5 parallel lane and stage 4 exits on
scene authoring + gizmos + play-step + the roundtrip gate. **The editor-Lua
capability tier is a security boundary and therefore never lands in
stage 6**: if it moves, it re-sequences into the stage 5 parallel lane with
its own serialized high-tier review window, and stage 6 waits on it. If
animation moves, GPU skinning (pure presentation, the one category the cap
permits) may re-sequence to stage 6 with sampler/blend retained; the
verification scene's sim correctness never depended on poses, which is the
point of the off-hash contract.

---

## Stage 5: Multiplayer: protocol freeze, Go gateway, the two-client co-op harness

**Goal.** The server-authoritative topology, real: the Odin sim headless on
the server as the single world truth; clients send intents and render state
deltas with prediction; Go owns the gateway and services. This stage lands
before engine-completion verification, as its own stage: the two-client
co-op harness is the engine's multiplayer verification artifact, and stage 6
re-runs it.

**Stage-owned test content (so this stage's gate depends on nothing from
stage 6).** `mods/nettest/`: a minimal stage 5-owned test mod with a bare
claim-a-chunk component, movement intents, and nothing else; the full
gameplay ruleset stays in stage 6's verification scene. Every stage 5 gate runs
against nettest; stage 6 re-runs the same harness against the verification
scene as part of its acceptance.

**Workstreams.**

- *Walking-skeleton conformance proof, then a scoped freeze:* a minimal Go
  supervisor drives the headless Odin worker through Open/Advance/Close with
  idempotent-retry, gap-rejection, and epoch-fencing tests. On green, **the
  envelope freezes**: the three-call worker contract and the `protocol/`
  frame *envelope* (framing, checksums, negotiation, version whitelist)
  freeze at v1, and **message-kind ranges are reserved** for replication
  and for the service areas scoped by private product requirements.
  **Replication message kinds** (state
  deltas, chunk-interest subscription, chunk-hash checkpoints,
  prediction/reconciliation) develop inside their reserved range and
  **freeze at this stage's exit gate**; the two-stage freeze prevents the
  v1→v2 churn a premature whole-schema freeze would generate, while the
  envelope's versioning ceremony exists from the first frame.
- *The Go↔engine boundary, decided for the longest run (D65):* a **versioned
  wire protocol across a process boundary**, with cgo in-process embedding
  rejected. Justification against the meta-directive: process isolation (a
  crashed or wedged sim worker cannot take the gateway down; the
  watchdog/epoch-CAS supervision model requires a killable unit);
  independent deploys and independent toolchains (Go and Odin release
  cadences stay decoupled); the seam is testable from both sides with
  recorded frames; and it is the shape the server-authoritative worker model
  already has. cgo would buy latency that nothing in a tick-quantized
  game needs, at the price of fused build systems, signal/runtime
  interference between the Go scheduler and Odin code, and an unversioned
  ABI seam: a stopgap's economics. Named work: the protocol schema
  definition plus generated/hand-audited Odin and Go codecs live in
  `protocol/` as the single source of truth; conformance tests run the same
  recorded frame corpus through both.
- *Transport, decided (D68, a residual fork the meta-directive requires
  closing):* **client↔gateway is QUIC (quic-go)**: reliable ordered streams
  for session/state traffic, unreliable QUIC datagrams for per-tick intents
  and deltas, TLS 1.3 built in, connection migration for free. Longest-run
  justification: prediction/reconciliation under real packet loss needs a
  datagram path without TCP's head-of-line blocking; QUIC provides both
  semantics on one connection with one handshake, where raw TCP/TLS would
  stall the intent stream behind retransmits and WebRTC (pion) buys NAT
  traversal and browser reach this program does not target, at the cost of a
  much larger moving surface. If the maintainer ever decides a web target,
  WebTransport is the QUIC-native door rather than a transport rewrite.
  **Gateway↔worker is the length-prefixed v1 protocol over loopback TCP**
  (supervised same-host processes; the killable-unit model needs no datagram
  semantics there).
- *Replication (decided by the topology, no bake-off):* server-authoritative
  state deltas over chunk-scoped interest (a client subscribes to the chunks
  near its camera), client-side prediction for the local player's
  intents with server reconciliation. Per-chunk hashes are the desync
  tripwire: client-visible state carries the server's chunk-hash
  checkpoints, and divergence is loud. (Lockstep dies with this decision; it
  was D10's other archetype, and the headless-sim-wrapper archetype won when
  the topology locked.)
- *Go services v1 (`server/`):* gateway (QUIC/TLS, session tokens,
  connection supervision), session persistence (minimal), worker supervision
  (spawn/watchdog/epoch CAS), the durable Tick_Commit log, opaque checkpoint
  storage, an idempotent outbox. Private-product service interfaces are
  stubbed at the protocol level now (versioned message-kind ranges reserved
  at the envelope freeze) and implemented in the post-engine game work. Go
  never implements or imports ECS, gameplay, or hashing. The Go module is
  born under a brand-neutral module path (the repo path), so the rebrand at
  engine completion sweeps it before any external consumer exists (D66).
- *Ports consumed:* `engine/save`/`engine/replay`: the checkpoint format is
  the snapshot codec over the wire protocol's framing; the replay harness
  becomes the server-side desync forensics tool.

**Exit gate.** `just coop-smoke` against `mods/nettest/`: gateway + headless
authoritative sim + two headless client processes on a real network (two
machines or two netns); both clients claim adjacent chunks; server chunk
hashes match committed goldens; a killed-and-respawned worker resumes from
the Tick_Commit log with no hash divergence; injected **latency, loss, and
reordering** exercise prediction/reconciliation (netem/toxiproxy-style fault
injection; latency alone does not exercise a datagram transport). One
coop-smoke leg swaps a headless client for a windowed client and asserts the
same server chunk hashes and the same client draw-list skeleton hashes for
the same interest set (the D72 parity gate, run across the network path).
`just proto-conformance` green from both the Odin and Go sides. Replication
message kinds freeze here.

**Depends on.** Stage 2 (chunks + per-chunk hashes are the interest and
desync unit), stage 3 (one target), stage 1's split-process topology. Runs
parallel to stage 4, the two least-coupled workstreams in the program
(editor: client/presentation tier; netcode: protocol/Go tier); their
security-boundary reviews serialize per the governing rules.

**Risks.** Prediction/reconciliation is the classic underestimated netcode
sink (mitigate: intents are tick-quantized and the sim is deterministic, so
reconciliation is resim-from-checkpoint, the machinery replay already
proves); Go/Odin codec drift (mitigate: one schema, two codecs, one recorded
conformance corpus in CI).

**Re-sequencing rule.** If stage 5 re-sequences, stage 6 waits on it: co-op
is in the verification scene's definition (locked decision) and is never
downgraded to local-only. Session-persistence hardening and the outbox
re-sequence to the post-engine game work if the gateway core needs the room.

---

## Stage 6: Engine-completion verification + rebrand

**Goal.** The engine verification scene, end to end: a 3D test scene
exercising mechanics scoped by private product requirements across a few
hand-authored chunks (D67); the camera zooms and drops into first person;
**two clients co-op over an actual network through the Go gateway**;
base-as-mod shipped plus one trivial second mod as the multi-mod mirroring
acceptance test. The scene exercises those private product requirements
because they are the requirements driver; it is a verification artifact, and
game production starts only after this stage closes. Then the rebrand
ceremony: the rebrand fires at engine completion.

**What may land here from upstream (the cap, restated).** Only pure
presentation-tier re-sequenced work (GPU skinning, HUD-polish-adjacent
items). Nothing determinism-sensitive, nothing that is a security boundary,
no gate-bearing work; those re-sequence into the stage 4/5 lanes and hold
this stage instead.

**Workstreams.**

- *Verification systems (Lua, on the ported mod machinery):* gameplay systems
  scoped by private product requirements (grid placement over collision v1,
  chunk-scoped world state, a simple encounter rule set), all sim-side, all
  hashed, all authored as `mods/base/`, the engine's verification ruleset
  proving the mod pipeline carries a full ruleset.
- *The second mod:* a trivial drop-in mod that patches base data and adds one
  system, the acceptance test that schema mirroring, first-declarant
  registration, and the settings→data→control pipeline survived the 3D
  transition intact (the locked mod-machinery decision's test; its skeletal
  precursor has been green since the stage 2 exit gate).
- *Camera continuum:* top-down zoom through to first-person
  drop-in, one camera with two rigs (designed in stage 1, shipped here);
  first-person character controller on the deterministic capsule vs chunk
  terrain.
- *Client presentation:* animation on the scene's characters (poses off-hash;
  hitboxes are the sim capsules); shipped-HUD theming and gamepad-navigation
  polish over the ImGui HUD (the named work from the UI decision).
- *Co-op, for real:* the stage 5 harness re-runs against the verification
  scene: two clients claiming adjacent chunks over the gateway is the
  engine's multiplayer acceptance, run at this stage's gate.
- **Rebrand ceremony (at engine completion, per D66; full sweep list):** new
  engine name; CLI rename (`svsw` → the new name: `new`/`run`/`package` plus
  `server` verbs); the `svsw.*` Lua namespace renamed with it (no
  compatibility shim; in-tree mods are updated in the same series); the Go
  module path swept to the new name (born brand-neutral in stage 5, no
  external consumers yet); the 3D-successor MCP server names swept;
  repo/docs/course references swept; `scaffold-check` re-pointed at the
  renamed CLI scaffolding a 3D project that boots headless twice and
  reproduces one root hash. The asset container is untouched: its name/magic
  has been brand-neutral since stage 2 (D69), so no baked data is
  invalidated. The beads issue prefix (`svsw-`) is **grandfathered**: issue
  history continuity is what "evolve in place" preserves (D63), and
  a prefix rewrite would falsify history for zero gain. Decision log, beads
  history, and CI continue uninterrupted under the new name.

**Exit gate.** `just engine-accept` (the D12-style acceptance test,
rewritten): the verification scene runs headless N ticks on both platforms
asserting per-chunk and root goldens; `just parity-check` green on the
verification scene (a windowed run of the same scenario reproduces the
headless hashes); the coop-smoke harness passes against the scene content;
the second mod, dropped in, changes gameplay and the world hash; the renamed
CLI's `scaffold-check` is green; a human plays the scene (build, gather,
expand, defend, drop to first person, with a second player) at the dev
window (human checkpoint, maintainer sign-off). This gate is engine
completion.

**Depends on.** Everything: stage 2 (world/collision), stage 3 (one target),
stage 4 (the editor authored the scene content; animation), stage 5 (co-op
harness + gateway).

**Risks.** Verification content reveals engine gaps late (accepted:
gap-fixing is this stage's core work, and the cap keeps the stage from
becoming a re-sequencing landfill).

**Re-sequencing rule.** None outward: this is the engine-completion
milestone, and everything upstream holds it rather than thinning it. Inward,
the rebrand sweep is the only work that may trail the acceptance test, and
it completes before the maintainer declares the milestone.

---

## After the engine: the private product

Game production starts here and nowhere earlier: at engine completion, after
the stage 6 gate and the rebrand. The private product at full scope builds on
the frozen foundations: the service areas scoped by private product
requirements (the Go services implemented behind the protocol message-kind
ranges reserved in stage 5); **deterministic seeded worldgen** (terrain
variation, resource-node placement per chunk, hashed; the D67 deferral, built
now for the shipped game's real needs); persistence hardening (schema'd
durable storage behind the checkpoint interface); live-ops posture (deploy,
monitoring, backup drills). Post-engine engine work queues here too: the
deterministic per-joint-keypoint animation upgrade (logged in D61) if the
game's combat demands it; wider mod-facing API surface as mods ask; a
render3d web target as an explicit new decision if wanted (WebTransport is
the QUIC-native path if so, per D68).

A roadmap revision written after engine completion scopes and sequences this
work. Its acceptance criteria are fixed now:

- each reserved protocol message-kind range (scoped by private product
  requirements) implemented behind conformance tests on the frozen v1
  envelope, both codecs;
- an opt-in multiplayer contest scenario (scoped by private product
  requirements) passing the coop-smoke harness, fault injection included;
- worldgen determinism: generating a chunk from the same seed reproduces its
  hash across both CI platforms, under the standing golden
  discipline, and the generated chunk passes the D72 parity gate (windowed
  and headless renders hash identical);
- a kill-and-restore persistence drill: a live world killed mid-session
  restores from the durable Tick_Commit log + checkpoint store with no hash
  divergence;
- a public playtest milestone with the live-ops posture (deploy, monitoring,
  backup drills) exercised for real.

---

## Decisions to log (proposed D54+, svsw decision-log format)

Canonical home: `docs/decisions/README.md` in this repository, as of
2026-07-16; this section remains the research-era record.

- **D54: Private product requirements and the engine verification scene.**
  The private product, built only after the engine completes, is scoped by
  product requirements defined outside this repository: a 3D scene with a
  top-down-to-first-person camera continuum and multiplayer service areas,
  per those requirements. The requirements exist as of this decision and are
  the requirements driver for engine subsystems; work once gated on them
  (collision core shape, replication topology) is unblocked. The engine
  verification scene is capped to a few chunks with two-client co-op; it is
  a verification artifact, and game production waits for engine completion.
  Settled; do not reopen without maintainer instruction.
- **D55: Chunked unbounded world.** The world is chunked and unbounded in
  extent (Factorio model): chunk-local sim coordinates + chunk index in
  hashed state; per-chunk world hashes composed to a root, generalizing the
  golden-hash discipline; floating-origin rendering off-hash, proven by
  invariance test. f32 chunk-local coordinates (the chunk index carries the
  range; f64 rejected as unnecessary given chunk-local re-basing).
  **Mechanism:** per-chunk hashing lands only in the new target's session
  assembly; `engine/worldgrid` composes chunk hashes over the unchanged
  `hash_world` primitives; the shared kernel stays frozen additive-only
  until the stage 3 deletion commit; the old target never calls the
  composition and no old golden gets re-recorded.
- **D56: Server-authoritative multiplayer.** The Odin sim runs headless on
  the server as the single world truth; clients send tick-quantized intents
  and render state deltas with client-side prediction and resim-based
  reconciliation; interest is chunk-scoped; per-chunk hash checkpoints are
  the desync tripwire. Go owns gateway, sessions, persistence, worker
  supervision, plus the private-product service layer scoped by product
  requirements outside this repository. Supersedes D10's lockstep archetype
  as the default; lockstep is dead for this engine.
- **D57: Platform: SDL3 + wgpu; sokol and Clay retire.** Full platform
  swap: SDL3 (window/input/audio) + wgpu (vendored wgpu-native,
  checksum-pinned prebuilt releases; no Rust toolchain in dev/CI). Shaders
  are WGSL; `shader-check` is naga validation via a pinned prebuilt
  naga-cli; the sokol-shdc path is dead. The new platform + render3d grow as
  a second binary target until the stage 3 gate-equivalence cutover, at
  which point sokol, Clay, and all 2D-era code are deleted. Supersedes D15's
  "sokol-only" letter while keeping its law: only the platform tier touches
  the backend (see D64).
- **D58: Lighting v1: Forward+ clustered PBR, staged.** glTF
  metallic-roughness materials as-authored; cascaded-shadow-mapped sun
  first, wgpu compute-shader light clustering second; engine-completion
  verification blocks on the sun+CSM milestone only, never on the cluster
  pass. Each milestone carries its own exit gate (single-sun CSM scene;
  N-point-light clustered scene with cluster counts in the skeleton hash).
  Supersedes the research plan's Blinn-Phong minimal-forward position.
- **D59: UI: Dear ImGui for editor and shipped game HUD.** One UI substrate
  (cimgui + imgui_impl_sdl3 + imgui_impl_wgpu, platform tier; the C++ enters
  Odin only through cimgui's generated C ABI, backend wrappers included).
  The mod-facing Lua UI API re-binds over ImGui with the same off-hash
  gating and containment; Clay retires at cutover. Shipped-HUD theming and
  gamepad polish are named stage 6 work. Supersedes D16→D53's Clay line and
  D53 itself as the HUD answer.
- **D60: Editor Lua ships in v1.** An editor scripting host with the same
  VM architecture as the mod sandbox (whitelist, alloc cap, instruction
  budget, R1–R5, disable-in-place) at an expanded capability tier:
  project-scoped filesystem, asset writes, editor UI bindings,
  command-stream emission. One embedding; containment guarantees preserved;
  the capability tier is reviewed as a security boundary, and, being one, it
  never re-sequences into the engine-completion verification stage (the
  re-sequencing cap).
- **D61: Animation is presentation-only, off-hash, client-side.** The sim
  carries deterministic capsules/AABBs for all combat/interaction; poses
  never enter `hash_world`. The upgrade path (deterministic per-joint
  keypoints as sim state) is logged now for a future game's demand and is
  not built.
- **D62: Mod machinery ports as-is.** Global component IDs,
  first-declarant-registers, schema mirroring, settings→data→control,
  per-mod VM containment all port unchanged to the 3D engine. A skeletal
  mirroring test gates the stage 2 port the moment it lands;
  engine-completion verification ships base-as-mod plus one trivial second
  mod as the full mirroring acceptance test. Answers the research plan's
  open question 7: shared-world multi-mod remains a product requirement.
- **D63: No backward compatibility through the transition.** Nothing in the
  2D engine's behavior, formats, APIs, goldens, or gates is owed continuity.
  Hard cutover at gate-equivalence (stage 3, ten-item checklist, no subset
  form); old goldens/gates dropped at that moment; the cutover deletes the
  2D-era code (render, render/gpu, physics, ui/Clay, 2D capture/dev,
  LDtk/DragonBones/Aseprite paths, 2D web target), and git history is the
  archive. "Evolve in place" = repo, CI plumbing, issue/decision history
  (beads prefix included), and portable subsystems only.
- **D64: The C interface tier.** C is the sanctioned interface tier between
  Odin, Lua, and Go where a boundary needs it: the C ABI is the FFI lingua
  franca; Lua's C API, SDL3, wgpu-native, and Dear ImGui via cimgui enter
  Odin through vendored C headers; small hand-written C shims are permitted
  where a boundary needs one, each vendored/pinned with provenance per the
  quarantine policy. Only the platform tier touches C (extends
  D15's layering discipline, policed by boundary-scan); everything above
  stays pure Odin.
- **D65: Go↔engine boundary: versioned wire protocol over a process
  boundary.** The gateway and the headless sim worker are separate processes
  speaking a versioned, checksum-first, length-prefixed frame protocol with
  explicit version negotiation and a supported-version whitelist; one schema
  in `protocol/` with conformance-tested Odin and Go codecs. cgo in-process
  embedding rejected: it forfeits process isolation (watchdog/epoch-fenced
  supervision needs a killable unit), couples toolchains and deploys, and
  creates an unversioned ABI seam, the stopgap option under the longest-run
  rule. Two-stage freeze: envelope + three-call worker contract at the
  stage 5 walking skeleton (with message-kind ranges reserved for
  replication and for service areas scoped by private product requirements);
  replication message kinds at the stage 5 exit gate.
- **D66: Rebrand at engine completion.** New engine name, CLI rename,
  `svsw.*` namespace rename, Go module path sweep (born brand-neutral in
  stage 5), MCP server name sweep, no compatibility shims; the asset
  container is untouched (brand-neutral magic since stage 2, per D69); the
  beads issue prefix is grandfathered (history continuity per D63); decision
  log, beads history, and CI continue uninterrupted under the new name;
  `scaffold-check` re-pointed at the renamed CLI in the same series. The
  rebrand fires when the stage 6 engine-completion gate passes. *Amendment
  (per D76): svsw stays the brand (org `svswengine`, repo `svsw`, CLI
  `svsw`, `svsw.*` namespace final), so the rebrand ceremony at engine
  completion shrinks to residual sweeps: the D73 trademark carve-out, docs
  and course reference sweeps, and retiring the working-name hedges.*
- **D67: Verification-scene world content is hand-authored; seeded worldgen
  is post-engine game work.** The engine verification scene's few chunks are
  hand-authored data-stage scenes (editor-authored, container-referenced);
  chunks without authored content activate with a deterministic, hashed
  default fill so the world's unbounded extent is real from stage 2. Full
  deterministic seeded worldgen (terrain variation, resource-node placement)
  belongs to the post-engine game work with its own determinism acceptance
  (same-seed chunk-hash reproduction across CI platforms), built once for
  the shipped game's real needs rather than twice.
- **D68: Network transport: QUIC client↔gateway; loopback TCP
  gateway↔worker.** Client↔gateway runs QUIC (quic-go): reliable ordered
  streams for session/state traffic, unreliable QUIC datagrams for per-tick
  intents and deltas, TLS 1.3, connection migration. Chosen over raw TCP/TLS
  (head-of-line blocking stalls the prediction stream under loss) and over
  WebRTC/pion (NAT-traversal and browser machinery this program does not
  target; WebTransport is the QUIC-native door if the maintainer ever
  decides a web target). Gateway↔worker runs the v1 length-prefixed protocol
  over loopback TCP; supervised same-host processes need no datagram
  semantics. The coop-smoke gate injects latency, loss, and reordering.
- **D69: The asset container (adopted from the research plan §4.4, promoted
  to the log).** One versioned sectioned binary container:
  magic/kind/schema-version header; section table
  (offset/size/compression/gpu-alignment/type); importer id + version +
  source digests; stable logical content IDs (simulation never sees
  readiness or load order); per-section and whole-file checksums;
  supported-version whitelist; authored sources never deleted; version bump
  = re-bake via assetc, zero runtime migration code. Scenes/prefabs are
  data-stage content (Lua data files + container references); no second
  scene format. The container's name and magic bytes are brand-neutral from
  definition so the rebrand touches no baked data.
- **D70: Threading model (adopted from the research plan §4.2, promoted to
  the log).** The simulation is single-threaded per Session, deterministic
  by construction. Asset decode may run on worker threads, but results
  integrate at a single deterministic point per frame (the carbon-io pump
  pattern; Trinity's load-fence poll). Renderer and audio stay main-thread
  until profiling forces otherwise; any parallel-sim ambition goes through
  the decision log.
- **D71: Editor command stream (adopted from the research plan §4.6,
  promoted to the log).** Every edit operation is a typed command on a
  command stream; undo/redo and edit persistence are command-log mechanisms;
  play-in-editor boots a real deterministic Session with live world-hash
  display, tick stepping, and replay scrubbing. The editor roundtrip gate is
  headless command-log replay, so the command stream itself is under gate
  coverage; editor scripts (D60) reach sim state only through the command
  stream.
- **D72: Dual-mode parity.** The engine runs in headless mode and in
  regular windowed mode and produces the same results: same world hashes,
  same draw-list skeleton hashes, comparable readback goldens. Both modes
  drive one render path into the same offscreen target; the window presents
  from that target, so the render path cannot fork by mode. `just
  parity-check` runs the same scenario in both modes and asserts identical
  hashes; it is a golden tier from stage 0, a member of every stage exit
  gate with a renderable scenario, and part of item 10 of the stage 3
  cutover checklist. Rationale: a headless invocation of the engine is a
  trustworthy stand-in for a windowed run, so tooling that drives the engine
  headless needs no windowed re-check, and a human at the window sees what
  the goldens hashed.
- **D73: Dual MIT + Apache-2.0 licensing.** svsw3D is dual-licensed under MIT
  and Apache-2.0 from the first public push. A trademark carve-out is added
  at rebrand (D66). Ported Carbon code keeps its MIT notices per the D64
  provenance discipline. Amended: the maintainer set the repository license
  to Apache-2.0 single when creating the repo; LICENSE-MIT is retired.
  Inbound stays Apache-2.0 with DCO when contributions open.
- **D74: Closed-contribution open source.** The repository is public;
  external pull requests are closed without review; issues stay open for bug
  reports. Inbound licensing (DCO-based inbound=outbound) is decided before
  contributions open. The maintainer retains sole copyright until then.
- **D75: Monorepo.** Engine, CLI, runtime, samples, specs, and the Go
  services live in one repository. Atomic cross-language commits back the
  protocol conformance gates. The post-engine game may live in its own
  repository.
- **D76: Org and repositories.** The GitHub org is `github.com/svswengine`.
  The engine lives in the `svsw` repository; the course lives in the
  sibling `course` repository, served through GitHub Pages. Further
  repositories (tooling among them) may join the org later. Org creation,
  both repos, Pages enablement, branch protection, and the org-wide
  closed-contribution posture (D74 applies to every org repo) are S00
  implementation scope; nothing goes public before S00 is implemented. The
  org name settles the naming question: svsw stays the brand, the CLI stays
  `svsw`, the `svsw.*` Lua namespace is final, and the Go module path lives
  under `github.com/svswengine`. The D66 rebrand ceremony at engine
  completion shrinks to residual sweeps: the trademark carve-out (D73), docs
  and course reference sweeps, and retiring the working-name hedges. The
  maintainer has already created both repositories on the org, and the
  engine repository's name being `svsw` shrinks the D66 rebrand ceremony
  further still, since the brand and the repo name already match.
- **D77: Spec+course pairing, four paths, course after implementation.**
  Course material builds beside the engine, as the internal prototype ran it.
  Every implemented spec gets a course module in the `course` repo, authored
  after implementation; spec and course come in pairs, and the spec
  lifecycle extends to pending, brainstormed, grilled, spec written,
  implemented, course published. A spec reaches course published only when
  its implementation gate is green and its module passes the course
  verification gate: embed-check against the pinned `svsw` commit,
  reference-key cross-check, path-closure check, full site build,
  truth-verify discipline recorded in review. One lesson corpus composes
  into four consumable paths through per-lesson path tags: FULL, ENGINE,
  GAME, GAME+MULTIPLAYER. ENGINE follows the engine specs; GAME and
  GAME+MULTIPLAYER consume the post-engine game section, so their modules
  exist only after engine completion, mirroring engine-before-game; FULL
  composes everything. Drift rule: the course repo pins the engine at a
  commit, and the pin bump is the drift-detection event, backed by a
  report-only probe against engine HEAD; an engine change that breaks a
  published module's gate returns the paired spec to implemented until the
  module is fixed.
- **D78: Project Claude Code tooling architecture.** svsw3D's `.claude`
  tooling stages skills with the gate each depends on: S00 ships the
  bootstrap core (root CLAUDE.md, paths-scoped rules, hooks, committed
  permissions) plus the spec-ceremony, check-triage, merge-prune,
  review-to-docs-pr, and win-rig skills, and the adversarial-review,
  comment-review, and spec-review workflows; vendor-quarantine lands at S01,
  golden-hashes at S02a, parity-verify at S04, lua-binding at S14,
  proto-conformance across S05 and S26, the MCP-server successor at S21,
  course-pairing at C00. As an exception, the full agent roster (gate-runner,
  golden-recorder, win-rig-runner, determinism-reviewer, spec-scribe,
  binding-dev, go-services-dev, course-writer) ships at S00 regardless of
  gate readiness; every agent whose gate does not exist yet carries an
  explicit refusal clause naming the owning spec, and every gate-owning
  spec's exit checklist gains the item "re-verify and update the agents
  that reference this gate." Rules load through paths-scoped
  `.claude/rules/*.md`, not nested CLAUDE.md, because svsw3D's languages
  cross directory boundaries; nested CLAUDE.md is reserved for `server/`
  and the `course` sibling repo. Hooks are graduated: format-on-edit hooks
  are non-blocking with warn-if-missing guards; the marker scan and WGSL
  validation feed diagnostics back non-blocking; one hook blocks, the
  PreToolUse marker scan of the staged diff on git commit or merge. Shared
  permissions (allow just/odin/Go build-test-vet/gofmt/read-only git/bd;
  deny reads into `vendor/**` except VENDOR.md, build output, generated
  files; network stays ask) commit to `.claude/settings.json`, with
  personal loosening in gitignored `settings.local.json`. The spec-ceremony
  skill wraps the brainstorm-and-grilling flow; beads is the status record,
  one bead per spec against a fresh database initialized at S00, and the
  skill updates the specs/README.md table in the same step as each bead
  transition. Full design record: `svsw/docs/plans/claude-tooling-design.md`.
- **D79: Review cadence and toolchain verification.** Review runs in three
  layers: marker and citation hooks free on every edit and commit, the
  spec-review workflow once per spec draft, and the billed adversarial-review
  workflow pre-merge; a branch older than about ten commits gets a
  mid-branch adversarial pass on the diff accumulated so far, so a
  late-discovered bug never waits for the whole branch to land. No tool
  enters docs or a recipe without verification on the machine that runs it:
  odinfmt is documented as a dev dependency in the S00 setup docs only
  after its formula is confirmed installable there, and the format-on-edit
  hook keeps its warn-don't-fail posture regardless.
- **D80: Documentation layout convention.** Every documentation markdown
  file lives under `docs/` in a subdirectory: `docs/specs`, `docs/plans`,
  and more as content arrives. `docs/README.md` is the router and the only
  top-level file in `docs/`. The rule applies to both the `svsw` and
  `course` repositories.
- **D81: Public/private documentation split.** The public repositories
  (`svsw`, `course`, `.github`) stay game-agnostic: no game mechanic,
  service name, or genre framing appears in their docs. Game design and
  mechanics live outside this repository, in private product requirements.
  Engine specs reference those private product requirements as their
  gameplay-requirements source (D54) without restating them; a spec scoped
  by the requirements cites "private product requirements." The engine's
  public Go-tier vocabulary is gateway, sessions, worker supervision,
  persistence, replication; the private product's own service layer is
  documented outside this repository. The rule is zero game references in
  the public engine docs (`svsw`, `.github`), boundary pointers included: no
  game-mechanic naming or genre-framing phrasing, and no naming of the
  private product repository; the public engine story ends at engine
  completion. The `course` repo keeps its path labels.
- **D82: Public stats policy.** The org profile (`.github`) displays live
  project stats keyed to real gates: a badge never lands before the thing
  it measures exists, the same no-fiction rule as D81. Tier 1 (shields.io
  dynamic badges: commit activity, total commits, last commit, CI status,
  open issues, code size) is live at the S00 public push with zero
  engine-side infrastructure. Tier 2 (spec progress, test count,
  headless/windowed parity, sim-tick p95, gate-roster count, course
  modules) is computed by a stats-refresh GitHub Action in `.github` that
  writes shields endpoint JSON files, rendered via `img.shields.io/endpoint`;
  hosted runners only, matching the S00 no-self-hosted-runner rule.
  Spec progress (`N/38 implemented`) is the headline metric, available
  immediately at S00. See `docs/plans/public-stats.md` in `svsw`.
- **D83: Luau runtime adoption.** Luau replaces Lua 5.4 as the single script
  runtime everywhere: mods and the editor scripting tier (D60) share one VM.
  This supersedes the choice locked in scripting-language-comparison.md; the
  maintainer fired that decision's own logged revisit trigger, typed-DX
  demand the annotation path cannot meet
  (scripting-language-comparison.md, section 6;
  typed-editor-scripts.md). The fork-and-merge Luau+5.4
  proposal, grafting Luau's type system onto the Lua 5.4 runtime without a
  full swap, is rejected as structurally infeasible: no shared code lineage,
  incompatible number models, grammar gaps Luau's parser cannot accept, a
  from-scratch C++ VM, two moving upstreams
  (typed-editor-scripts.md's assessment). Timing: svsw3D has
  no code or golden hashes yet, so this is a respec, not a migration; nothing
  ported yet needs re-porting. Internal-prototype Lua-boundary code (sandbox_strip, the
  R1-R5 checklist, host.odin's shape) becomes adaptation rather than literal
  port, since Luau's C API stays 5.1-era-compatible; the patterns, whitelist
  construction, budget-quota-with-shared-pool, one-error-path containment,
  carry forward even where the literal code does not. This entry supersedes
  the Lua 5.4 clauses of D59, D60, and D62 wherever they say "Lua 5.4", and
  amends D64: Luau's C API and its C++ implementation enter the vendored C
  tier behind its C-compatible boundary, alongside SDL3, wgpu-native, and
  cimgui, wherever D64 says "Lua's C API".
- **D84: Script typing policy.** `--!strict` is gate-enforced for first-party
  scripts: base-as-mod, samples, editor scripts, and scaffold templates fail
  `just check` if they do not typecheck clean. Third-party mods stay
  nonstrict and advisory: type errors surface as IDE warnings and never block
  a mod load; the sandbox (containment, budgets, R1-R5) remains the sole
  safety boundary, unchanged by D62. The `svsw.*` type surface ships as
  `.d.luau` declaration files generated from the Odin binding registry (the
  D42 opt-in binding registrar), with a drift gate inside `just check` shaped
  like the existing api-coverage gate. This is the concrete, Luau-native form
  of the typed-DX answer typed-editor-scripts.md scoped around LuaLS/LuaCATS
  annotations; the mechanism moves from generated annotations to a generated
  declaration file plus the language's own strict/nonstrict pragmas, one
  generator still covering editor scripts and mod scripts.
- **D85: Number semantics on f64-only Luau.** Luau carries one 64-bit double
  for every number, no integer/float dual subtype, so identity is never
  arithmetic: entity IDs and chunk coordinates cross the Luau boundary as
  opaque typed handles, and the type checker rejects arithmetic performed on
  them. Ticks and quantities stay plain numbers, valid within the 2^53
  safe-integer envelope, with debug-build integrality guards asserted at the
  boundary to catch float contamination before it reaches deterministic sim
  state. Integral sim math, the ECS core, `hash_world`, tick accounting,
  stays in Odin; Luau never performs integer-sensitive arithmetic that could
  diverge under f64 rounding. This is the number-model reconciliation the
  fork-and-merge proposal could not deliver (typed-editor-scripts.md),
  handled instead by boundary discipline rather than by a modified runtime.
- **D86: Engine dev loop.** A new spec, S22b ("Engine dev loop: rebuild,
  respawn, restore"), is created covering rebuild orchestration, the
  editor-worker reconnect handshake, restore policy, and dev-diverged
  semantics (docs/specs/README.md in svsw). Worker topology: S22 is amended
  so play-in-editor's Session runs in an S08-topology worker process instead
  of in-process; the editor becomes that worker's client and supervisor over
  the versioned protocol, reusing S05/S26's envelope and version whitelist
  for the reconnect handshake; a crash-only whole-editor-restart variant is
  an allowed first milestone inside S22b, not a separate spec or path.
  Reject-and-replay restore answers S02a's open dev-loop half of its
  save/replay versioning question: on a worker rebuild, a snapshot restores
  only when its schema hash matches the running build; on a mismatch the
  worker replays the D71 command log from session start instead, so schema
  changes degrade to a slower restore rather than a wedge. No migration
  functions run in the dev loop; a versioned-snapshot-reader story stays
  deferred to shipped-save concerns that S27b's stage-5 durability work owns.
  Cross-build hash semantics: within-build hash checks, D72 parity,
  checkpoint agreement on an unchanged-build respawn, remain hard failures,
  the corruption detector for the restart loop itself. A rebuild that lands
  code changes marks the session dev-diverged, and its cross-build hash diffs
  against the pre-rebuild stream render as forensics only (first divergent
  tick or chunk, surfaced through the `svsw_explain` and replay tooling),
  never as failures. Goldens are never re-recorded from the dev loop; golden
  re-recording stays the separate, deliberate, reviewed ritual the
  golden-hashes process already defines.

---

## Overrides: where this roadmap supersedes ODIN-ENGINE-RESEARCH-AND-PLAN.md

| Research-plan position | This roadmap (locked decision) |
|---|---|
| sokol-gfx as first backend; wgpu only as a hypothetical second draw-list consumer (§4.3, open Q5) | **wgpu-native is the backend**, vendored and pinned from stage 0; sokol dies at the stage 3 cutover (D57) |
| Keep the sokol platform layer; `engine/platform` "mostly carries forward" (§3.1) | **Full platform swap to SDL3** (window/input/audio); the old platform tier is deleted at cutover (D57) |
| Shader toolchain = sokol-shdc, version-pinned (§4.3) | **WGSL + naga validation**; `shader-check` rebuilt around naga; sokol-shdc never wired (D57) |
| Lighting v1 = minimal-forward Blinn-Phong, one shadowed directional light; PBR later (§4.3, open Q6) | **Forward+ clustered PBR** with glTF metallic-roughness as-authored, staged sun+CSM then compute clustering, per-milestone gates (D58) |
| Game HUD keeps Clay; ImGui is editor-only (§3.2, §4.6) | **ImGui for both** editor and shipped HUD; Lua UI API re-bound over ImGui; Clay retires wholesale (D59) |
| No editor Lua host in v1 (§4.2, A7/B13) | **Editor scripting host ships in v1** as an expanded capability tier of the mod-sandbox VM (D60) |
| Multiplayer comes after the slice; replication is a post-slice A/B/C bake-off (§5, §7) | **The Go gateway and the two-client co-op harness land before engine-completion verification** (stage 5); topology is decided (server-authoritative deltas + prediction) with no bake-off (D56); transport is decided (QUIC, D68) |
| Physics/collision core waits for private product requirements (§4.8) | The requirements exist (D54); **deterministic collision v1 is stage 2 work**, scoped to those requirements' envelope |
| 2D engine remains the shipped product until parity; parallel maintenance implied (§4.1) | **Hard cutover at gate-equivalence (stage 3, ten-item checklist)**; old goldens/gates dropped, 2D/sokol/Clay code deleted (D63) |
| Explicit 40%-lands cut line; capacity absorbed by cutting (§5) | **No cut lists anywhere**; slippage is absorbed by re-sequencing under the re-sequencing cap (meta-directive) |
| The slice *produces* private product requirements (§5, §7) | The grilling session produced the requirements; engine-completion verification **exercises** them (D54) |
| C confined to vendored source "at the platform/tool tiers" as an incidental fact (§4.2) | C is an **explicit, policed interface tier** with its own logged policy and boundary-scan enforcement (D64) |
| Go seam: draft now, freeze after a walking-skeleton proof "at the start of Go work, which waits for private product requirements" (§4.9) | Same freeze mechanism, **pulled forward and split in two**: protocol v0 exists stage-0-adjacent, split-process is the dev topology from stage 1, envelope + worker contract freeze at stage 5's walking skeleton, replication kinds at stage 5 exit (D65) |

Positions of the research plan not listed above (evolve-in-place repo
strategy, draw-list data seam with a single GPU consumer, the three-tier
headless verification stack, quarantine vendoring, spall-at-the-base
profiling, Carbon licensing posture) are **adopted unchanged** and inherited
by this roadmap. The three adopted positions that are longest-run forks in
their own right (the asset container, the threading model, and the editor
command stream) are promoted to their own decision-log entries (D69, D70,
D71) rather than living only by reference, and the maintainer commits the
research plan itself into the svsw repo (`docs/research/`) in the same
change series as this roadmap so the baseline is in the tree it governs.

---

## Review notes: critique dispositions

Two adversarial critique passes (sequencing/feasibility; completeness) ran
against the prior draft. The maintainer amended or rebutted the blockers and
major findings below; the stages absorbed the minor findings (per-milestone
gates in stage 1, the stage 2 dependency split, the asset viewer's
non-movable shell, the headless editor-roundtrip formulation, the two-stage
protocol freeze, the 3D stress harness in stage 1, the headless audio gate,
the vendoring tree enumeration with the Rust-artifact posture, the
deletion-list completions, the harness migration, the rebrand sweep
completions, brand-neutral container magic).

**Sequencing/feasibility lens.**

1. *Blocker: the verification stage as a re-sequencing landfill.*
   **Amended.** The re-sequencing cap forbids determinism-sensitive or
   security-boundary work from landing in stage 6; the editor-Lua tier's
   re-sequencing destination is the stage 5 parallel lane with its own
   serialized high-tier review window, and stage 6 waits on it.
2. *Major: the stage 5 gate depends on stage 6 content.* **Amended.**
   Stage 5 owns `mods/nettest/` (bare claim-a-chunk component + movement
   intents), with the full gameplay ruleset kept in stage 6; coop-smoke gates
   against nettest, and stage 6 re-runs the harness against the verification
   scene.
3. *Major: 3D scaffold templates unassigned to any stage.* **Amended.** Named stage 2
   work, and item 7 of the stage 3 equivalence checklist.
4. *Major: the audio re-sequencing rule waived the cutover precondition.*
   **Amended.** The maintainer deleted the carve-out; the deletion commit
   requires the full ten-item checklist including the SDL3 audio pump and
   its headless mixer golden, and an unmet audio gate holds the cutover.
5. *Major: deterministic worldgen missing / hand-authored fork implicit.*
   **Amended (decided).** D67: verification-scene chunks are hand-authored
   data-stage scenes with a deterministic default fill for unauthored
   chunks; full seeded worldgen belongs to the post-engine game work with
   its own determinism acceptance. The sequencing consequence (editor before
   verification-scene content) is explicit, and the stage order serializes
   it.
6. *Major: too many stages in flight around the cutover.* **Amended.**
   Stage 4 starts after the deletion commit, and the governing rules fix the
   limit: at most two stages in flight, with determinism-sensitive or
   security-boundary review streams running one at a time.

**Completeness lens.**

1. *Blocker: per-chunk hashing vs still-green old goldens.* **Amended
   (mechanism named, the critique's preferred option).** Per-chunk hashing
   lands only in the new target's session assembly, composing over unchanged
   `hash_world` primitives; the shared kernel stays frozen additive-only
   from stage 0 until the deletion commit; the old target never calls the
   composition; no old golden gets re-recorded and no long-lived branch is
   needed. Recorded in D55.
2. *Major: script/mod gates missing from the cutover checklist.*
   **Amended.** Checklist item 8: a 3D-target `script_accept` equivalent
   (hash-golden Lua game, sandbox containment/disable-in-place, budget
   enforcement, settings→data→control pipeline test); and the skeletal
   second-mod mirroring test moved forward into the stage 2 exit gate.
3. *Major: ODIN-ENGINE-RESEARCH-AND-PLAN.md does not exist in the repo.*
   **Rebutted in part, amended in part.** The file exists; it lives in this
   research directory (`carbon/research/ODIN-ENGINE-RESEARCH-AND-PLAN.md`,
   indexed in this directory's README), beside this roadmap, and the
   critique checked only the svsw repo. The substantive point stands and is
   amended: the maintainer commits the research corpus into the svsw repo
   (`docs/research/`) in the same change series that adopts this roadmap,
   and the three adopted longest-run forks are promoted to their own
   decision entries (D69 container, D70 threading, D71 command stream) so
   they live in the decision log, not only by reference.
4. *Major: the post-engine game work had no exit gate, leaving locked
   decision 1 half-covered.* **Amended.** Its acceptance shape is named now
   (per-message-kind conformance on the frozen envelope, a multiplayer
   contest scenario through the coop harness, worldgen determinism check,
   kill-and-restore persistence drill, public playtest milestone); only its
   scoping defers to the post-engine roadmap revision.
5. *Major: network transport fork left open.* **Amended (decided).** D68:
   QUIC (quic-go) client↔gateway with streams + datagrams; loopback TCP
   gateway↔worker; justified against TCP/TLS head-of-line blocking and
   WebRTC's untargeted surface; coop-smoke extended to inject loss and
   reordering as well as latency.
