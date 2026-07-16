# Design review notes — critique dispositions

Three adversarial critique lenses were run against the draft plan before
[ODIN-ENGINE-RESEARCH-AND-PLAN.md](ODIN-ENGINE-RESEARCH-AND-PLAN.md) was
finalized: **A** (ponytail/YAGNI), **B** (shipping feasibility), **C**
(completeness + licensing due diligence). Every finding is listed below with
its severity and disposition. "Amended" means the final plan was changed and
the section is cited; "Rebutted" means the plan stands, with the concrete
reason. All blockers and majors are addressed.

**Preamble.** The maintainer's later directives — no timeframes, engine
before game, dual-mode parity, re-sequencing instead of scope cuts —
supersede the team-size and scheduling framing that appears in the findings
and dispositions below. Read every phase reference, cut line, and staffing
mention here as dependency order, not a schedule or a headcount. The findings
stand as the historical record of what the critique lenses raised and how the
plan answered them at the time.

---

## Lens A — ponytail / YAGNI

### A1 (BLOCKER): Fresh monorepo + wholesale re-port of verbatim-portable subsystems
**Disposition: Amended.** The plan now evolves SVSW in place (§4.1): new
packages (`simmath3d`, `render3d`, `anim`, assetc, editor tier) grow beside
existing ones; the 2D renderer ships until 3D parity; CI, goldens, beads, and
the decision log continue uninterrupted. A fresh repo is taken only if the
maintainer names a concrete forcing reason (open question 1), in which case
migration becomes a dedicated phase-zero item. Every "carry-forward" line item
became a no-op.

### A2 (BLOCKER): In-house UI framework gating the mandated editor
**Disposition: Amended.** Cut. The editor uses vendored Dear ImGui
(quarantined, editor tier only, never in game builds); game HUD keeps the
paid-for Clay command-stream surface (§3.2, §4.6). An own layout core is
built only when a shipped game's HUD concretely outgrows Clay.

### A3 (MAJOR): Trinity-style AL interfaces + "null backend" reopen logged D15
**Disposition: Amended.** No polymorphic adapter layer. The seam is a plain
draw-list data structure; `engine/render3d/gpu` is its single consumer
emitting `sg.*` calls; headless mode simply never calls the gpu package, so
the null backend is ~zero code; `SOKOL_DUMMY_BACKEND` covers device-less
tests of the gpu package itself (§4.3). D15 is preserved verbatim; a future
wgpu backend would be a second consumer of the same struct stream, built only
when concretely needed.

### A4 (MAJOR): Deterministic 3D physics core scheduled before private product requirements
**Disposition: Amended.** Cut from v1. The engine ships only ray-vs-AABB/
sphere queries (needed by editor and picking regardless); the collision core
waits for private product requirements and, when built, follows the feasibility
lens's narrowed scope (§4.8, see B7).

### A5 (MAJOR): Freezing the three-call Go protocol with zero implementations
**Disposition: Amended.** Downgraded from "freeze verbatim" to draft +
guardrail: the three-call design is a written draft; the enforced invariant
today is the tier-scan dependency-arrow rule (session/kernel never imports
network/wall-clock/Go-facing code); the contract freezes only after a
walking-skeleton conformance proof at the start of Go work (§4.9, §7 table).

### A6 (MAJOR): assetc v1 includes skeletons/animations before the pose-determinism decision
**Disposition: Amended.** assetc v1 is static meshes + textures + materials
only (§4.4). Skeleton/animation sections land with the animation subsystem in
Phase 4, after the pose-determinism decision — which is itself pulled forward
as a logged default rather than deferred (§4.5, see B8/C1).

### A7 (MAJOR): Privileged editor-extension Lua host nobody asked for
**Disposition: Amended.** Cut from v1. Editor features are Odin code in the
editor tier; the plan notes only that the tier architecture leaves room, and
that a future extension need starts from the existing mod-sandbox VM with a
widened whitelist, not a parallel embedding (§4.2).

### A8 (minor): Incremental per-pool hash hooks designed in "now"
**Disposition: Amended.** Cut. `hash_world` ports untouched; restructuring to
composed pool hashes is a contained future refactor if a profile ever shows
hashing dominating (§3.1).

### A9 (minor): Blanket software transcendentals in simmath3d
**Disposition: Amended.** simmath3d v1 bans transcendentals outright; a
software implementation is added one function at a time on demonstrated need,
with the cross-CPU golden gate catching violations (§5 Phase 0). The policed
ban on `core:math/linalg`/FMA stands.

### A10 (minor): `.sva` "migration path" contradicting its own re-bake mitigation
**Disposition: Amended.** Migration-path language dropped. Final policy:
supported-version whitelist + never delete authored sources + re-bake via
assetc on bump. Zero migration code in runtime or assetc (§3.2, §4.4).

### A11 (minor): Scenario-file format for the stress harness
**Disposition: Amended.** Cut. Additional hardcoded Odin scenes are added
when budget questions demand them (§4.7).

### A12 (minor): Three script-layer refactors during the port
**Disposition: Amended (largely dissolved by A1).** With in-place evolution
there is no port; the three fixes (call-context enum, subsystem-slot
registry, D38 sandbox settlement) land as separate, individually verified
refactors on live code (§3.1).

### A13 (minor): Monolithic six-feature editor v1 design
**Disposition: Amended.** Architecture decisions (tier, command stream,
real-Session play mode) are fixed up front; features are sequenced: asset
viewer → scene tree/inspector/play-step/hash display → asset browser →
gizmos → profiler panel, with anything further waiting for a real scene to
demand it (§4.6, §5).

---

## Lens B — shipping feasibility

### B1 (BLOCKER): Team-size math doesn't close; no vertical slice, no cut list
**Disposition: Amended.** Phase 0 is a defined minimal vertical proof (cube,
three goldens, no window); Phases 0–2 are acknowledged as sequential in
practice; and the explicit 40%-lands cut line is stated: Phases 0–2 complete
plus the editor reduced to asset viewer + scene tree/inspector/play-step —
still a shippable, verifiable 3D core (§5). Structural demotions per the
critique: ImGui instead of an in-house UI framework (A2), no owned physics in
v1 (A4), static-only assets in v1 (A6).

### B2 (BLOCKER): Editor (P2) depended on UI framework (P3) and physics picking (P3)
**Disposition: Amended.** Both dependencies removed: ImGui resolves the
widget-layer inversion (§4.6), and gizmos/selection use geometry-only ray
casts against render-mesh AABBs with no physics dependency (§4.6, §4.8).

### B3 (BLOCKER): Draw-list hash floats fork — portable claim vs unpoliced render math
**Disposition: Amended.** The fork is decided explicitly (§4.3): the portable
CI tier hashes only the discrete/ordinal skeleton of the draw list (pipeline
ids, handles, order, counts) with floats excluded; a full-byte draw-list hash
exists only as a same-machine golden. Render math stays outside the policed
no-FMA regime, and the plan no longer claims cross-platform byte-hashing of
float payloads. A one-command re-record workflow is budgeted for legitimate
renderer churn.

### B4 (MAJOR): Phase-one cross-OS CI gate assumes infrastructure that has never existed
**Disposition: Amended.** Phase 0's determinism gate is same-OS/cross-CPU
(arm64 + x86-64 macOS runners), which catches the stated primary risk (FMA/
contraction divergence). Linux headless is a named Phase 2 milestone (also
the future Go worker target); Windows waits for the editor's need (§4.10, §5).

### B5 (MAJOR): Shader toolchain entirely absent from the plan
**Disposition: Amended.** A shader pipeline subsystem is added (§4.3, §5
Phase 1): sokol-shdc, version-pinned under the standing toolchain-pinning
policy, offline and gated out of shipped builds (Carbon shadercompiler's
shape); a fixed small permutation set (not an ubershader) whose key is the
pipeline-cache key; `just shader-check` extended to the whole corpus.

### B6 (MAJOR): Trinity AL duplicates sokol, which already is the abstraction layer
**Disposition: Amended.** Same resolution as A3 — draw-list data seam, single
sokol consumer, `SOKOL_DUMMY_BACKEND` for device-less tests, no vtable layer
(§4.3).

### B7 (MAJOR): Owned swept-mesh collision under bit-exact math is survivorship-scoped
**Disposition: Amended.** Combined with A4: no collision core in v1 at all;
when private product requirements force it, scope is primitives-vs-primitives and
primitives-vs-baked-convex-decomposition/heightfield proxies — no
swept-vs-arbitrary-triangle-mesh in the deterministic path — with the
degenerate-case test corpus written before the solver (§4.8).

### B8 (MAJOR): Two open questions (coordinate precision, pose determinism) gate front-loaded work
**Disposition: Amended.** Both promoted to pre-phase-one logged defaults
awaiting maintainer confirmation: f32 world coordinates + floating origin
(fits the stated small-to-mid scope), and poses-are-presentation /
hitboxes-are-explicit-sim-colliders (§4.5, open questions 3–4). Neither waits
for private product requirements.

### B9 (MAJOR): assetc hand-waves Odin ecosystem gaps (glTF importer, GPU texture encoder)
**Disposition: Amended.** Dependencies named now: cgltf and bc7enc/astcenc,
both through the standard quarantine review (pin, VENDOR.md, hostile-input
hardening) scheduled inside the Phase 2 asset work; the encoder version is
recorded in the `.sva` importer-version header so encoder bumps surface as
provenance changes rather than mysterious golden drift (§4.4).

### B10 (minor): Protocol freeze premature (duplicate of A5 at lower severity)
**Disposition: Amended.** Same resolution as A5: draft + guardrail; freeze on
walking-skeleton proof (§4.9).

### B11 (minor): Byte-exact readback goldens on a pinned machine are a maintenance tarpit
**Disposition: Amended.** The pixel tier uses perceptual/tolerance comparison
(byte-exact is reserved for the draw-list skeleton tier); the pinned machine
is named, its OS/driver/toolchain recorded next to the goldens, a re-record
protocol follows the golden-hashes skill, and the stated fallback when the
environment must move is skeleton-hash-only (§6.1 risk 4).

### B12 (minor): Fresh-monorepo migration tax unbudgeted
**Disposition: Amended (dissolved by A1).** In-place evolution removes the
tax; if the maintainer overrides, migration is an explicit dedicated
phase-zero line item (§4.1).

### B13 (minor): Editor Lua host is unmandated scope creep (duplicate of A7)
**Disposition: Amended.** Same resolution as A7: cut from v1 (§4.2).

---

## Lens C — completeness + licensing due diligence

### C1 (MAJOR): No animation runtime subsystem despite an animation-bearing asset format
**Disposition: Amended.** A dedicated animation subsystem is added (§4.5)
with explicit scope and order (sampler → linear blend → GPU skinning; state
machines only on demand), CMF's storage/runtime separation, a Phase 4 slot,
and the pose-determinism contract logged now as a default (off-hash
presentation; hitboxes as explicit sim colliders) so the sampler stays
outside policed math.

### C2 (MAJOR): No shader authoring/compilation pipeline (duplicate of B5)
**Disposition: Amended.** Same resolution as B5 (§4.3).

### C3 (MAJOR): Editor/UI sequencing contradiction (duplicate of B2)
**Disposition: Amended.** Resolved by deciding the ImGui question now rather
than leaving it open (§4.6); the in-house framework is removed from the
critical path entirely (A2).

### C4 (MAJOR): SVSW migration/deprecation story absent
**Disposition: Amended.** §4.1 states the story: in-place evolution; the 2D
engine remains the shipped product line (Steam-feasibility, RPG/course lines
unaffected) until render3d parity; the decision log, beads DB, CI, and
justfile continue in the same repo — no transfer needed; the fresh-repo
alternative, if chosen, becomes a dedicated phase-zero item with an owner
(open question 1). The Beads migration owner is carried as open question 12.

### C5 (MAJOR): Go protocol frozen without the proof Codex itself required
**Disposition: Amended.** Same family as A5/B10, with C5's specific remedy
adopted: the walking-skeleton conformance proof (trivial Go supervisor
driving the headless worker through open/advance/close with idempotent-retry
and epoch-fencing tests) is the named precondition for freezing, scheduled at
the start of Phase 6 and offered to the maintainer as optional earlier
de-risking (§4.9, open question 11).

### C6 (MAJOR): Licensing rule was per-repo, not per-file, and silently overrode the survey's "concepts, not source" recommendation
**Disposition: Amended.** The port procedure is now per-file: check the
specific file's header, the repo NOTICE (trinity's md5/lempar.c snippets
cited as the concrete example), and vcpkg/SDK derivation before porting;
record repo, path, commit SHA, and license text in VENDOR.md (§6.2). The
default posture is concepts-first; verbatim/close ports are narrow named
exceptions, and the departure from the survey's stricter recommendation is
explicitly surfaced for maintainer sign-off (open question 10).

### C7 (minor): Overbroad licensing statements ("unrestricted across all 33", "file organization is not copyrightable")
**Disposition: Amended.** The design-reference claim is scoped to the 32
licensed repos, with `.github` (unlicensed) demoted to read-only context; the
copyrightability claim is restated correctly — ideas and methods are
unprotectable, detailed nonliteral structure can be expression, so the
standard is independent re-expression (§6.2).

### C8 (minor): Threading/concurrency model never stated
**Disposition: Amended.** §4.2 now states it as a logged decision: sim
single-threaded per Session; asset decode may use worker threads integrating
at exactly one deterministic point per frame (carbon-io pump pattern);
renderer and audio main-thread until profiling forces otherwise; parallel-sim
ambitions go through the decision log.

### C9 (minor): Readback-golden runner story missing (overlaps B11)
**Disposition: Amended.** Same resolution as B11: named machine, recorded
environment, re-record protocol, perceptual comparison, skeleton-hash
fallback (§6.1 risk 4).

### C10 (minor): Smaller scope holes (audio import, material format, asset hot-reload, scene format, nav/particles/terrain, WASM, docs)
**Disposition: Amended — one-line disposition each, now in the plan:**
- Audio bake: an assetc extension in the editor's asset-browser phase (§4.4, §5 Phase 3).
- Material authoring: materials are `.sva` sections referenced by data-stage content; glTF materials import into that form — no second native material file (§4.4).
- Asset hot-reload contract: textures/materials hot-swap in dev/editor; meshes reload with handle stability; `.sva` changes never touch sim state (§4.4).
- Scene/prefab format: data-stage content (Lua data files + `.sva` references) — the editor writes what the engine already loads; no private editor format (§4.4, §4.6).
- Navigation/pathfinding, particles-3D, terrain: explicit post-v1 non-goals until a game demands them (implicit in §4.8's philosophy; nav/terrain would follow the same brief-gated path as physics).
- WASM/web for render3d: explicit post-v1 decision, carried as open question 9; the 2D web target persists with the 2D engine (§4.10).
- Documentation: a named Phase 4 docs milestone — architecture doc updates plus a generated Lua API reference from binding docstrings (§5).

---

## Tally

36 findings: 4 blockers, 16 majors, 16 minors. Dispositions: 36 amended
(several as duplicates sharing one resolution), 0 rebutted outright — the
critiques were materially correct, and the final plan reflects them. The only
places the plan pushes back are inside §7's Codex table (rebutting Codex's
brief-gates-everything stance and pre-game replication phases), which the
critique lenses did not contest.
