# svsw decision log

This is the canonical decision log for the svsw engine. Entries are settled;
reopening one is a maintainer call. Numbering continues from the donor svsw
experiment's log (D1-D53), whose decisions live with that project.

## Inherited from the donor experiment

- **D11: Determinism by construction.** Fixed timestep, ordered ECS
  iteration, engine-seeded RNG, no wall clock reachable from simulation code.
- **D15: Layering discipline.** Only the platform tier touches the backend;
  the renderer's core stays backend-agnostic behind a thin GPU-submission
  stratum.
- **D42: Opt-in binding packages.** The public API decomposes into tiers
  through opt-in registrar binding packages, each registering its `svsw.*`
  table through one locked seam.

## Engine decisions (D54+)

- **D54: Gameplay requirements and the verification scene.** Private product
  requirements, maintained outside this repository, scope the
  gameplay-facing specs and supply the verification-scene content. Work
  otherwise gated on that scope (collision core shape, replication topology)
  unblocks once the requirements exist. The engine verification scene is
  capped to a few chunks with two-client co-op: a verification artifact
  only; further product work waits for engine completion.
- **D55: Chunked unbounded world.** The world is chunked and unbounded in
  extent (the Factorio model): chunk-local sim coordinates plus a chunk
  index in hashed state; per-chunk world hashes compose to a root,
  generalizing the golden-hash discipline; floating-origin rendering stays
  off-hash, proven by an invariance test. Chunk-local coordinates are f32
  (the chunk index carries the range; f64 is rejected as unnecessary given
  chunk-local re-basing). Mechanism: per-chunk hashing lands only in the new
  target's session assembly; `engine/worldgrid` composes chunk hashes over
  the unchanged `hash_world` primitives; the shared kernel stays frozen
  additive-only until the stage 3 deletion commit, so the old target never
  calls the composition and no old golden is re-recorded.
- **D56: Server-authoritative multiplayer.** The Odin sim runs headless on
  the server as the single world truth; clients send tick-quantized intents
  and render state deltas with client-side prediction and resim-based
  reconciliation; interest is chunk-scoped; per-chunk hash checkpoints are
  the desync tripwire. Go services enumerate gateway, sessions, worker
  supervision, persistence, replication only. Supersedes D10's lockstep
  archetype as the default; lockstep is dead for this engine.
- **D57: Platform: SDL3 + wgpu; sokol and Clay retire.** Full platform swap:
  SDL3 (window/input/audio) plus wgpu (vendored wgpu-native,
  checksum-pinned prebuilt releases; no Rust toolchain in dev/CI). Shaders
  are WGSL; `shader-check` runs naga validation via a pinned prebuilt
  naga-cli; the sokol-shdc path is dead. The new platform and render3d grow
  as a second binary target until the stage 3 gate-equivalence cutover, at
  which point sokol, Clay, and all 2D-era code are deleted. Supersedes
  D15's "sokol-only" letter while keeping its law: only the platform tier
  touches the backend (see D64).
- **D58: Lighting v1: Forward+ clustered PBR, staged.** glTF
  metallic-roughness materials as-authored; cascaded-shadow-mapped sun
  first, wgpu compute-shader light clustering second; engine-completion
  verification blocks on the sun+CSM milestone only, never on the cluster
  pass. Each milestone carries its own exit gate (a single-sun CSM scene;
  an N-point-light clustered scene with cluster counts in the skeleton
  hash). Supersedes the research plan's Blinn-Phong minimal-forward
  position.
- **D59: UI: Dear ImGui for editor and runtime HUD.** One UI substrate
  (cimgui + imgui_impl_sdl3 + imgui_impl_wgpu, platform tier; C++ enters
  Odin only through cimgui's generated C ABI, backend wrappers included).
  The mod-facing Luau UI API re-binds over ImGui with the same off-hash
  gating and containment; Clay retires at cutover. Shipped-HUD theming and
  gamepad polish are stage 6 work. Supersedes D16 through D53's Clay line
  and D53 itself as the HUD answer. Superseded in part by D83 (Lua 5.4
  becomes Luau).
- **D60: Editor Luau ships in v1.** An editor scripting host shares the mod
  sandbox's VM architecture (whitelist, alloc cap, instruction budget,
  R1-R5, disable-in-place) at an expanded capability tier: project-scoped
  filesystem, asset writes, editor UI bindings, command-stream emission.
  One embedding; containment guarantees preserved; the capability tier is
  reviewed as a security boundary and, being one, never re-sequences into
  the engine-completion verification stage (the re-sequencing cap).
  Superseded in part by D83 (Lua 5.4 becomes Luau).
- **D61: Animation is presentation-only, off-hash, client-side.** The sim
  carries deterministic capsules/AABBs for all combat/interaction; poses
  never enter `hash_world`. The upgrade path (deterministic per-joint
  keypoints as sim state) is logged now for future product demand and is
  not built.
- **D62: Mod machinery ports as-is.** Global component IDs,
  first-declarant-registers, schema mirroring, settings→data→control, and
  per-mod VM containment all port unchanged to the 3D engine. A skeletal
  mirroring test gates the stage 2 port the moment it lands;
  engine-completion verification ships base-as-mod plus one trivial second
  mod as the full mirroring acceptance test. Answers the research plan's
  open question 7: shared-world multi-mod remains a product requirement.
  Superseded in part by D83 (Lua 5.4 becomes Luau).
- **D63: No backward compatibility through the transition.** Nothing in the
  2D engine's behavior, formats, APIs, goldens, or gates is owed
  continuity. Hard cutover at gate-equivalence (stage 3, ten-item
  checklist, no subset form); old goldens and gates drop at that moment;
  the cutover deletes the 2D-era code (render, render/gpu, physics,
  ui/Clay, 2D capture/dev, LDtk/DragonBones/Aseprite paths, 2D web target),
  and git history is the archive. "Evolve in place" means the repo, CI
  plumbing, issue/decision history (beads prefix included), and portable
  subsystems only.
- **D64: The C interface tier.** C is the sanctioned interface tier between
  Odin, Luau, and Go where a boundary needs it: the C ABI is the FFI
  lingua franca; Luau's C API and its C++ implementation, SDL3, wgpu-native,
  and Dear ImGui via cimgui enter Odin through vendored C/C++ headers
  behind Luau's C-compatible boundary; small hand-written C shims are
  permitted where a boundary needs one, each vendored and pinned with
  provenance per the quarantine policy. Only the platform tier touches C
  (extends D15's layering discipline, policed by boundary-scan); everything
  above stays pure Odin. Amended by D83 to name Luau's C API in place of
  Lua's.
- **D65: Go↔engine boundary: versioned wire protocol over a process
  boundary.** The gateway and the headless sim worker are separate
  processes speaking a versioned, checksum-first, length-prefixed frame
  protocol with explicit version negotiation and a supported-version
  whitelist; one schema in `protocol/` with conformance-tested Odin and Go
  codecs. cgo in-process embedding is rejected: it forfeits process
  isolation (watchdog/epoch-fenced supervision needs a killable unit),
  couples toolchains and deploys, and creates an unversioned ABI seam — the
  stopgap option under the longest-run rule. Two-stage freeze: envelope
  plus the three-call worker contract at the stage 5 walking skeleton (with
  message-kind ranges reserved for replication and future private-service
  growth); replication message kinds land at the stage 5 exit gate.
- **D66: Rebrand at engine completion.** svsw is already the settled brand
  (org `svswengine`, repo `svsw`, CLI `svsw`, `svsw.*` namespace final, per
  D76), so the engine-completion rebrand ceremony shrinks to residual
  sweeps: the D73 trademark carve-out, docs and course reference sweeps,
  and retiring working-name hedges. No compatibility shims; the asset
  container stays untouched (brand-neutral magic since stage 2, per D69);
  the beads issue prefix is grandfathered (history continuity per D63); the
  decision log, beads history, and CI continue uninterrupted under the
  settled name; `scaffold-check` stays pointed at the `svsw` CLI
  throughout. The rebrand fires when the stage 6 engine-completion gate
  passes.
- **D67: Verification-scene world content is hand-authored; seeded worldgen
  is post-engine product work.** The engine verification scene's few
  chunks are hand-authored data-stage scenes (editor-authored,
  container-referenced); chunks without authored content activate with a
  deterministic, hashed default fill, so the world's unbounded extent is
  real from stage 2. Full deterministic seeded worldgen (terrain variation,
  resource-node placement) belongs to post-engine product work with its
  own determinism acceptance (same-seed chunk-hash reproduction across CI
  platforms), built once for the shipped product's real needs rather than
  twice.
- **D68: Network transport: QUIC client↔gateway; loopback TCP
  gateway↔worker.** Client↔gateway runs QUIC (quic-go): reliable ordered
  streams for session/state traffic, unreliable QUIC datagrams for per-tick
  intents and deltas, TLS 1.3, connection migration. Chosen over raw
  TCP/TLS (head-of-line blocking stalls the prediction stream under loss)
  and over WebRTC/pion (NAT-traversal and browser machinery this program
  does not target; WebTransport is the QUIC-native door if the maintainer
  ever adds a web target). Gateway↔worker runs the v1 length-prefixed
  protocol over loopback TCP; supervised same-host processes need no
  datagram semantics. The coop-smoke gate injects latency, loss, and
  reordering.
- **D69: The asset container** (adopted from the research plan §4.4,
  promoted to the log). One versioned sectioned binary container:
  magic/kind/schema-version header; a section table
  (offset/size/compression/gpu-alignment/type); importer id, version, and
  source digests; stable logical content IDs (the simulation never sees
  readiness or load order); per-section and whole-file checksums; a
  supported-version whitelist; authored sources are never deleted; a
  version bump means re-bake via assetc, with zero runtime migration code.
  Scenes and prefabs are data-stage content (Luau data files plus
  container references); there is no second scene format. The container's
  name and magic bytes are brand-neutral from definition, so the rebrand
  touches no baked data.
- **D70: Threading model** (adopted from the research plan §4.2, promoted
  to the log). The simulation is single-threaded per Session, deterministic
  by construction. Asset decode may run on worker threads, but results
  integrate at a single deterministic point per frame (the carbon-io pump
  pattern; a load-fence poll). Renderer and audio stay main-thread until
  profiling forces otherwise; any parallel-sim ambition goes through the
  decision log.
- **D71: Editor command stream** (adopted from the research plan §4.6,
  promoted to the log). Every edit operation is a typed command on a
  command stream; undo/redo and edit persistence are command-log
  mechanisms; play-in-editor boots a real deterministic Session with a live
  world-hash display, tick stepping, and replay scrubbing. The editor
  roundtrip gate is headless command-log replay, so the command stream
  itself is under gate coverage; editor scripts (D60) reach sim state only
  through the command stream.
- **D72: Dual-mode parity.** The engine runs in headless mode and in
  regular windowed mode and produces the same results: same world hashes,
  same draw-list skeleton hashes, comparable readback goldens. Both modes
  drive one render path into the same offscreen target; the window
  presents from that target, so the render path cannot fork by mode. `just
  parity-check` runs the same scenario in both modes and asserts identical
  hashes; it is a golden tier from stage 0, a member of every stage exit
  gate with a renderable scenario, and part of item 10 of the stage 3
  cutover checklist. A headless invocation is a trustworthy stand-in for a
  windowed run, so headless-driving tooling needs no windowed re-check, and
  a human at the window sees what the goldens hashed.
- **D73: Apache-2.0 licensing.** The repository is licensed under
  Apache-2.0 only (LICENSE-MIT is retired); a trademark carve-out lands at
  rebrand (D66). Ported donor code keeps its MIT notices per the D64
  provenance discipline. Inbound stays Apache-2.0 with DCO when
  contributions open.
- **D74: Closed-contribution open source.** The repository is public;
  external pull requests close without review; issues stay open for bug
  reports. Inbound licensing (DCO-based inbound=outbound) is decided before
  contributions open. The maintainer retains sole copyright until then.
- **D75: Monorepo.** Engine, CLI, runtime, samples, specs, and the Go
  services live in one repository. Atomic cross-language commits back the
  protocol conformance gates. Post-engine product work may live in its own
  repository.
- **D76: Org and repositories.** The GitHub org is `github.com/svswengine`.
  The engine lives in the `svsw` repository; the course lives in the
  sibling `course` repository, served through GitHub Pages. Further
  repositories (tooling among them) may join the org later. Org creation,
  both repos, Pages enablement, branch protection, and the org-wide
  closed-contribution posture (D74 applies to every org repo) are S00
  implementation scope; nothing goes public before S00 is implemented. The
  org name settles the naming question: svsw stays the brand, the CLI
  stays `svsw`, the `svsw.*` Luau namespace is final, and the Go module
  path lives under `github.com/svswengine`. The D66 rebrand ceremony at
  engine completion shrinks to residual sweeps: the trademark carve-out
  (D73), docs and course reference sweeps, and retiring the working-name
  hedges. Both repositories already exist on the org, and the engine
  repository's name being `svsw` shrinks the D66 ceremony further still,
  since the brand and the repo name already match.
- **D77: Spec+course pairing, four paths, course after implementation.**
  Course material builds beside the engine, as the donor experiment ran
  it. Every implemented spec gets a course module in the `course` repo,
  authored after implementation; spec and course come in pairs, and the
  spec lifecycle extends to pending, brainstormed, grilled, spec written,
  implemented, course published. A spec reaches course published only when
  its implementation gate is green and its module passes the course
  verification gate: embed-check against the pinned `svsw` commit,
  reference-key cross-check, path-closure check, full site build,
  truth-verify discipline recorded in review. One lesson corpus composes
  into four consumable paths through per-lesson path tags: FULL, ENGINE,
  GAME, GAME+MULTIPLAYER. ENGINE follows the engine specs; GAME and
  GAME+MULTIPLAYER consume the post-engine product section, so their
  modules exist only after engine completion, mirroring
  engine-before-product; FULL composes everything. Drift rule: the course
  repo pins the engine at a commit, and the pin bump is the
  drift-detection event, backed by a report-only probe against engine
  HEAD; an engine change that breaks a published module's gate returns the
  paired spec to implemented until the module is fixed.
- **D78: Project Claude Code tooling architecture.** svsw's `.claude`
  tooling stages skills with the gate each depends on: S00 ships the
  bootstrap core (root CLAUDE.md, paths-scoped rules, hooks, committed
  permissions) plus the spec-ceremony, check-triage, merge-prune,
  review-to-docs-pr, and win-rig skills, and the adversarial-review,
  comment-review, and spec-review workflows; vendor-quarantine lands at
  S01, golden-hashes at S02a, parity-verify at S04, lua-binding at S14,
  proto-conformance across S05 and S26, the MCP-server successor at S21,
  course-pairing at C00. As an exception, the full agent roster
  (gate-runner, golden-recorder, win-rig-runner, determinism-reviewer,
  spec-scribe, binding-dev, go-services-dev, course-writer) ships at S00
  regardless of gate readiness; every agent whose gate does not exist yet
  carries an explicit refusal clause naming the owning spec, and every
  gate-owning spec's exit checklist gains the item "re-verify and update
  the agents that reference this gate." Rules load through paths-scoped
  `.claude/rules/*.md`, not nested CLAUDE.md, because svsw's languages
  cross directory boundaries; nested CLAUDE.md is reserved for `server/`
  and the `course` sibling repo. Hooks are graduated: format-on-edit hooks
  are non-blocking with warn-if-missing guards; the marker scan and WGSL
  validation feed diagnostics back non-blocking; one hook blocks, the
  PreToolUse marker scan of the staged diff on git commit or merge. Shared
  permissions (allow just/odin/Go build-test-vet/gofmt/read-only git/bd;
  deny reads into `vendor/**` except VENDOR.md, build output, generated
  files; network stays ask) commit to `.claude/settings.json`, with
  personal loosening in gitignored `settings.local.json`. The
  spec-ceremony skill wraps the brainstorm-and-grilling flow; beads is the
  status record, one bead per spec against a fresh database initialized at
  S00, and the skill updates the specs/README.md table in the same step as
  each bead transition. Full design record:
  `docs/plans/claude-tooling-design.md`.
- **D79: Review cadence and toolchain verification.** Review runs in three
  layers: marker and citation hooks free on every edit and commit, the
  spec-review workflow once per spec draft, and the billed
  adversarial-review workflow pre-merge; a branch older than about ten
  commits gets a mid-branch adversarial pass on the diff accumulated so
  far, so a late-discovered bug never waits for the whole branch to land.
  No tool enters docs or a recipe without verification on the machine that
  runs it: odinfmt is documented as a dev dependency in the S00 setup docs
  only after its formula is confirmed installable there, and the
  format-on-edit hook keeps its warn-don't-fail posture regardless.
- **D80: Documentation layout convention.** Every documentation markdown
  file lives under `docs/` in a subdirectory: `docs/specs`, `docs/plans`,
  and more as content arrives. `docs/README.md` is the router and the only
  top-level file in `docs/`. The rule applies to both the `svsw` and
  `course` repositories.
- **D81: Public/private documentation split.** The public repositories
  stay agnostic to any private product's specifics: no mechanic, service
  name, or genre framing appears in their docs. Design and mechanics for
  any downstream product live outside this repository. Engine specs
  reference private product requirements as their gameplay-requirements
  source (D54) without restating them; a spec scoped by that source cites
  "private product requirements." The engine's public Go-tier vocabulary is
  gateway, sessions, worker supervision, persistence, replication; a
  private product's own service layer is documented only in its own
  repository. The rule is zero private-product references in the public
  engine docs, boundary pointers included: no phrasing that names or
  points at the private repository or its contents; the public engine
  story ends at engine completion. The course repo keeps its path labels.
- **D82: Public stats policy.** The org profile (`.github`) displays live
  project stats keyed to real gates: a badge never lands before the thing
  it measures exists, the same no-fiction rule as D81. Tier 1 (shields.io
  dynamic badges: commit activity, total commits, last commit, CI status,
  open issues, code size) is live at the S00 public push with zero
  engine-side infrastructure. Tier 2 (spec progress, test count,
  headless/windowed parity, sim-tick p95, gate-roster count, course
  modules) is computed by a stats-refresh GitHub Action in `.github` that
  writes shields endpoint JSON files, rendered via
  `img.shields.io/endpoint`; hosted runners only, matching the S00
  no-self-hosted-runner rule. Spec progress (`N/38 implemented`) is the
  headline metric, available immediately at S00. See
  `docs/plans/public-stats.md`.
- **D83: Luau runtime adoption.** Luau replaces Lua 5.4 as the single
  script runtime everywhere: mods and the editor scripting tier (D60)
  share one VM. This supersedes the choice locked earlier in the research
  corpus; the maintainer fired that decision's own logged revisit trigger,
  typed-DX demand the annotation path could not meet. The fork-and-merge
  Luau+5.4 proposal, grafting Luau's type system onto the Lua 5.4 runtime
  without a full swap, is rejected as structurally infeasible: no shared
  code lineage, incompatible number models, grammar gaps Luau's parser
  cannot accept, a from-scratch C++ VM, two moving upstreams. Timing: svsw
  has no code or golden hashes yet, so this is a respec, not a migration;
  nothing ported yet needs re-porting. Donor Lua-boundary code
  (sandbox_strip, the R1-R5 checklist, host.odin's shape) becomes
  adaptation rather than literal port, since Luau's C API stays
  5.1-era-compatible; the patterns — whitelist construction,
  budget-quota-with-shared-pool, one-error-path containment — carry
  forward even where the literal code does not. This entry supersedes the
  Lua 5.4 clauses of D59, D60, and D62 wherever they say "Lua 5.4," and
  amends D64: Luau's C API and its C++ implementation enter the vendored C
  tier behind its C-compatible boundary, alongside SDL3, wgpu-native, and
  cimgui, wherever D64 says "Lua's C API."
- **D84: Script typing policy.** `--!strict` is gate-enforced for
  first-party scripts: base-as-mod, samples, editor scripts, and scaffold
  templates fail `just check` if they do not typecheck clean. Third-party
  mods stay nonstrict and advisory: type errors surface as IDE warnings
  and never block a mod load; the sandbox (containment, budgets, R1-R5)
  remains the sole safety boundary, unchanged by D62. The `svsw.*` type
  surface ships as `.d.luau` declaration files generated from the Odin
  binding registry (the D42 opt-in binding registrar), with a drift gate
  inside `just check` shaped like the existing api-coverage gate. This is
  the concrete, Luau-native form of the typed-DX answer: generated
  annotations give way to a generated declaration file plus the
  language's own strict/nonstrict pragmas, with one generator covering
  both editor scripts and mod scripts.
- **D85: Number semantics on f64-only Luau.** Luau carries one 64-bit
  double for every number, with no integer/float dual subtype, so identity
  is never arithmetic: entity IDs and chunk coordinates cross the Luau
  boundary as opaque typed handles, and the type checker rejects
  arithmetic performed on them. Ticks and quantities stay plain numbers,
  valid within the 2^53 safe-integer envelope, with debug-build
  integrality guards asserted at the boundary to catch float contamination
  before it reaches deterministic sim state. Integral sim math, the ECS
  core, `hash_world`, and tick accounting stay in Odin; Luau never
  performs integer-sensitive arithmetic that could diverge under f64
  rounding. This is the number-model reconciliation the fork-and-merge
  proposal could not deliver, handled instead by boundary discipline
  rather than a modified runtime.
- **D86: Engine dev loop.** Spec S22b ("Engine dev loop: rebuild, respawn,
  restore") covers rebuild orchestration, the editor-worker reconnect
  handshake, restore policy, and dev-diverged semantics. Worker topology:
  S22 is amended so play-in-editor's Session runs in an S08-topology
  worker process instead of in-process; the editor becomes that worker's
  client and supervisor over the versioned protocol, reusing S05/S26's
  envelope and version whitelist for the reconnect handshake; a
  crash-only whole-editor-restart variant is an allowed first milestone
  inside S22b, not a separate spec or path. Reject-and-replay restore
  answers S02a's open dev-loop half of its save/replay versioning
  question: on a worker rebuild, a snapshot restores only when its schema
  hash matches the running build; on a mismatch the worker replays the
  D71 command log from session start instead, so schema changes degrade
  to a slower restore rather than a wedge. No migration functions run in
  the dev loop; a versioned-snapshot-reader story stays deferred to
  shipped-save concerns S27b's stage-5 durability work owns. Cross-build
  hash semantics: within-build hash checks, D72 parity, and checkpoint
  agreement on an unchanged-build respawn remain hard failures, the
  corruption detector for the restart loop itself. A rebuild that lands
  code changes marks the session dev-diverged, and its cross-build hash
  diffs against the pre-rebuild stream render as forensics only (first
  divergent tick or chunk, surfaced through the `svsw_explain` and replay
  tooling), never as failures. Goldens are never re-recorded from the dev
  loop; golden re-recording stays the separate, deliberate, reviewed
  ritual the golden-hashes process already defines.
