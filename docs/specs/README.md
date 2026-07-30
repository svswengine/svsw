# svsw spec index

svsw is a fresh engine project: an Odin/Luau/Go 3D engine built in the `svsw`
repository under the `svswengine` GitHub org (D26). The internal prototype
supplies the deterministic kernel, ECS, Lua sandbox, multi-mod machinery, and
gate/tooling patterns; they port in with their test suites. The research corpus
and the dependency-ordered roadmap live at `docs/research/` (see `ROADMAP.md`
there); they are reference. Decisions are canonical in
[`docs/decisions/README.md`](../decisions/README.md), which governs this index.

Specs get produced one at a time. Each spec goes through a brainstorm plus a
grilling session with the maintainer before it is written in full, and every
spec is documented before any implementation starts. This index is the todo
list for that process: it records, per spec, the goal, the working software the
spec must end with, dependencies, scope, prototype ports, governing decisions,
and the open questions the grilling session must settle. Implementation is no
longer the terminal state. Every implemented spec gets a course module in the
course repo, authored after implementation, and the spec closes only at course
published (D27). M00 precedes S00 in review order, since it needs no toolchain
to review, and its finished mockup becomes the normative visual reference
the editor specs from S16b through S24b consult when they design the
editor's chrome.

Ground rules carried from the roadmap:

- Dependency order only. No timeframes. No spec depends on a later spec.
- Every non-setup spec ends with observable running software behind a named
  gate that runs green in `just check` or as its own recipe. The three setup
  specs (S00, S01, C00) end with tooling, CI, and deploy green instead.
- Headless and windowed runs produce identical results (D22), so agents can
  drive the engine headless and trust the outcome. Parity gates appear from
  the first rendered scene onward.
- The engine completes stage by stage, proven by verification scenes.
  Private product requirements scope the gameplay-facing specs.
- Prototype ports are test-first: a port lands with its suite green, never
  bare. The internal prototype is a source to port from, not a target to
  converge with (D38).
- Any spec that introduces or reshapes sim state names its
  completeness-reflection extension in its scope and its exit gate, and
  classifies each new field on-hash or off-hash with the rationale
  recorded at the site.
- Stage exits cut a D53 release tag (0.<completed-stage>.<n>) with
  CI-built, checksummed artifacts; the tag-and-artifact workflow lands
  with the first stage exit, and S32's dry-run re-verifies it against
  the completed engine.
- The fresh-repo decision (D38) voids the roadmap's hard-cutover, deletion-
  commit, and gate-equivalence machinery. Nothing cuts over; the obligation
  reappears as S00's gate skeleton and S21's full gate roster, and prototype
  subsystems port test-first in S02a, S08, S14, S15, and S18 (S19 adds the
  SDL3 front on the seam S08 ports; S20 re-authors the prototype UI surface over
  ImGui rather than porting it).
- Kernel-freeze mechanics in D5 are moot, D38 amending D5 in that clause:
  there is no second target to freeze against. Per-chunk hashing still
  composes over the ported `hash_world` primitives unchanged.
- The name is settled (D26): svsw is the brand, the org is svswengine, the
  repo is svsw, the CLI is `svsw`, and the `svsw.*` Luau namespace is final.
  The D16 ceremony at S32 shrinks to residual sweeps.
- Spec and course come in pairs (D27): a spec's course module is authored
  after its implementation gate is green and lives in the `course` sibling
  repo (D26). Course strategy and paths below carries the verification gate
  and the regression rule.

Stage shape: stage 0 has eight specs, stage 1 six, stage 2 nine, stage 3
five, stage 4 eight, stage 5 six, stage 6 four. C00, the course platform
bootstrap, is stage 0's addition and the third setup spec: it ends with
tooling, deploy, and gates green rather than engine software. The guidance
band was roughly two to five per stage; stage 0 exceeds it because setup,
first running software, and the review-mandated kernel/math split all live
there, and stage 2 exceeds it because it is the roadmap's fattest stage
and the review split its two largest specs. Each spec stays sized for one brainstorm, grilling, and
implementation cycle; the stage totals follow from that, and the material
decided them. The 2026-07 review revision added S03b, S16b, S22c, S22d,
S24b and S29b on the mid-series letter-suffix scheme, plus S33 as a new
number sequenced before S32, widening stages 1 and 3 through 6; S16b is
the deliberate early-validation slice for the editor's load-bearing bets
(D44, D47, D49), pulled ahead of the editor core the way M00 was pulled
ahead of S00.

## Course strategy and paths

The course carries the internal prototype's model forward: teach the languages
by building the real thing, test-first, against real repo source. Lessons embed
real engine source through `<<<` snippet imports; the embedded code is the
answer key and the engine's real tests are the checker; no parallel skeleton or
solution copy exists. The lesson skeleton, references registry, embed-check
gate, and truth-verify authoring discipline port from the internal prototype.
The material teaches Odin plus Slang for the render specs, Go for the
stage 5 specs, and Luau against the scripting boundary.

The course lives in the `course` repository under the `svswengine` org,
served through GitHub Pages (D26); the engine lives in `svsw`. The repo
split means embeds cannot reach engine source by relative path: the course
repo pins the engine at a commit (submodule or recorded-commit checkout,
settled in C00's grilling) and every embed resolves against that pin.
Bumping the pin reruns the course verification gate, and failures enumerate
the modules the engine change reopened; a report-only probe builds the
course against engine HEAD so drift surfaces before a pin bump. Both repos
are public already (D38); S00 still owes that surface configuration work,
enabling Pages on `course` above all, rather than a launch.

Spec and course come in pairs (D27): a spec's course module is authored
after that spec is implemented, never before and never in parallel with
implementation. A spec reaches course published only when its implementation
gate is green and its module passes the course verification gate:
embed-check against the pinned engine source, reference-key cross-check,
path-closure check, full site build, and the truth-verify checklist recorded
in the module's review. When an engine change breaks a published module's
gate, the paired spec returns to implemented until the module is fixed, and
this index reflects the regression.

The course composes the one lesson corpus into multiple consumable paths;
the path structure and tag vocabulary are defined in the course repository.
Lessons carry a frontmatter `paths` tag list, setup lessons carry every
tag, and the paths derive from tags at build time. Modules key by spec id
(S02a, S11b, C00), adopting this index's stable-identifier scheme; lessons
within a module are numbered, with letter suffixes for mid-module
insertions. Engine-era modules (S00 through S33, plus C00) tag `engine`.
The VitePress config scans lesson frontmatter and builds one sidebar tree
per path from the one corpus; the reader picks a path on the landing page
and the choice persists client-side. Path closure joins the course
verification gate: for each path, every prerequisite of every included
lesson must itself be included in that path (setup counts as present in all
paths); the check runs beside embed-check in course CI and its failure
blocks course published for the module that introduced the break.

C00 (course platform bootstrap) enters this index as a spec and goes
through the same brainstorm and grilling ceremony. It lands after S00 and
S01 are implemented and ships the deployed course shell carrying their
modules, which makes S00 and S01 the first specs to reach course published.
From then on each implemented spec's module follows its implementation.
Further course specs enter the index with a later roadmap revision; none
are created now.

## Status legend

| Status | Meaning |
|---|---|
| pending | In this index only; no session held yet. |
| brainstormed | Brainstorm session held; scope direction agreed. |
| grilled | Grilling session held; open questions answered. |
| spec written | Full spec document written and accepted. |
| implemented | Working software delivered; the spec's gate runs green. |
| course published | Course module authored after implementation; the course verification gate green against the pinned engine commit; module deployed to Pages. Regresses to implemented when an engine change breaks the module's gate. |

M-series specs terminate at spec written: the committed, human-accepted
artifact is the deliverable, so the implemented and course published
rungs do not apply, and the D27 pairing rule exempts them.

A spec that creates a gate referenced by a Claude Code agent's refusal
clause (see `docs/plans/claude-tooling-design.md`) reaching **implemented**
carries one more exit item: re-verify and update the agents that reference
this gate, so a refusal clause naming this spec is retired once the gate it
pointed at exists.

When a spec reaches **spec written**, its full document lives at
`docs/specs/<id>-<slug>.md` as the normative text, and this index's entry
for that spec collapses to the overview-table row plus a link to that
document. M00 precedes this pattern: its design record already lives at
`docs/design/editor-mockup.md` rather than under `docs/specs/`, so M00's
index entry may stay as it is until its own collapse.

## Normative references

A spec's `Normative references` field names the artifacts that spec must
match: a committed mockup, a recorded corpus, a golden file (D41). An
artifact answers a design question more exactly than prose about it can,
and it cannot drift from itself, so where one exists the spec points at it
instead of describing it. M00's editor mockup is the worked example, and
it is why the chrome-carrying editor specs, S16b, S22 through S24, S22c
and S24b, name `docs/design/editor/index.html` in this field rather than
restating what its panels look like.

An entry names a committed, versioned artifact in this repository or the
course repository, and says what it is normative *for*. Never a throwaway
prototype branch, which is deleted by design and never cited, and never an
external URL that can change under the spec. The field takes `none` where
there are none, like every other field in the schema.

Read it against `Prototype ports`, which sits directly above it and means
the opposite: that field names source to port **from**, this one names
targets to **match**.

## The ladder and the tracker

The rungs above drive the work tracker as well as this table. A spec at
**pending** gets a `/wayfinder` map whose child issues are seeded from that
spec's `Open questions` field, which makes that field load-bearing rather
than decorative: an open question left out of it never becomes a map
child. `/wayfinder` closes each child as its decision lands, and closing
the last one is where it edits that spec's `Status` here to **grilled**.
The ladder records **brainstormed** between the two rungs, but no tracker
event marks it: with several grilling children in flight, no single moment
is the crossing. The maintainer moves the two rungs above **grilled** by
hand until the spec-ceremony skill lands at S00. Reaching **spec written**
is what lets `/to-tickets` open the spec's tracking ticket and the child
tickets that carry its implementation, so no ticket precedes the document
it builds from. The decomposition behind that split is
[D37](../decisions/D037-work-decomposition.md); which skill drives which
rung, and what each may read and write, is
[`docs/agents/skills.md`](../agents/skills.md). Spec status itself stays
here: no tracker records it.

Every spec below is **pending**, except M00, S00, S01, S02a and S02b,
which are **spec written**, and S03, S05 and S14, which are **grilled**.

## Overview

| id | title | working software | depends on | status |
|---|---|---|---|---|
| M00 | Editor visual mockup: HTML+CSS prototype of the editor's look and behavior | mockup opens and runs interactive in any browser (design artifact) | none | spec written |
| [S00](S00-repo-bootstrap.md) | Repo bootstrap: toolchain, just check skeleton, two-platform CI | `just check` green on both CI platforms (setup) | none | spec written |
| [S01](S01-vendoring-ceremony.md) | Vendoring ceremony: all C-tier dependencies | `just vendor-libs` + `just shader-check` green (setup) | S00 | spec written |
| C00 | Course platform bootstrap: sibling repo, Pages deploy, embed and truth-verify gates | deployed course shell with the S00 and S01 modules live (setup) | S00, S01 | pending |
| [S02a](S02a-prototype-kernel-port.md) | Prototype kernel port: kernel, ECS, simrng, save/replay, harness | headless N-tick sim + determinism pyramid green | S00 | spec written |
| [S02b](S02b-simmath3d-cross-cpu-gate.md) | simmath3d + cross-CPU hash gate | cross-platform hash gate green on both CI legs | S02a | spec written |
| S03 | SDL3 window + RHI device + draw-list render core | offscreen frame headless + windowed present (human checkpoint) | S01, S02b | grilled |
| S04 | Textured cube: three golden tiers + the D22 parity gate | `render3d-golden-check` + `just parity-check` green on the cube | S02b, S03 | pending |
| S05 | Protocol v0: versioned frames, two-process echo pair, the arrow rule | `just proto-frame-check` runs the echo pair + hostile corpus green | S02a | grilled |
| S06 | Renderer foundations: pipeline cache, culling, materials, camera | multi-object PBR scene green on all four tiers | S04 | pending |
| S07 | Milestone A: cascaded-shadow-mapped sun (stage 1 exit) | CSM scene green on all four tiers (stage 1 exit) | S06 | pending |
| S08 | Split-process topology: sim process + render client over the protocol | `just split-smoke` green, hash-checkpointed agreement | S05, S06 | pending |
| S09 | 3D stress harness with provisional budgets | `just stress` p95 budgets report-only on hosted CI, hard on dev machine and win rig | S06 | pending |
| S10 | Milestone B: compute-shader clustered light culling | clustered scene green incl. cluster counts in skeleton hash + parity | S07 | pending |
| S03b | D3D12 backend: the third RHI implementation on the win rig | `just win-check` runs skeleton + readback tiers on D3D12, report-only | S04 | pending |
| S11a | Chunked world: worldgrid, per-chunk hashes, activation, default fill | `just chunk-golden-check` + parity on the chunk-crossing scenario | S02a, S04 | pending |
| S11b | Floating origin: presentation-side re-basing | re-based far-from-origin scene, invariance test + parity green | S11a, S06 | pending |
| S12a | Asset container + assetc: glTF to sectioned binary to rendered goldens | glTF round-trip to rendered goldens + codec fuzz green | S04, S06 | pending |
| S12b | Runtime asset loader: worker-thread decode + hot reload | running scene hot-swaps assets with handle stability asserted | S12a | pending |
| S13 | Deterministic collision v1, scoped by private product requirements | degenerate corpus + snapshot-resim + capsule-on-terrain golden green | S02a, S11a | pending |
| S14 | Luau sandbox port: the scripting boundary, test-first | sandboxed Luau sample reproduces its world-hash golden headless | S01, S02a | grilled |
| S15 | Mod pipeline port: multi-mod shared world, proven by the mirroring test | prototype mod suites + skeletal second-mod mirroring test green | S14 | pending |
| S16 | Asset viewer: the minimal ImGui-on-SDL3 shell | viewer renders a container mesh (human checkpoint) + CI shell smoke | S01, S12a | pending |
| S17 | svsw CLI: new/run/package with 3D scaffold templates | `just scaffold-check` green inside `just check` | S11a, S12b, S15 | pending |
| S18 | SDL3 audio: mixer port, stream pump, spatialization, headless gate | mixer-output golden + spatialization invariance green; sound at the dev window (human checkpoint) | S03, S12a | pending |
| S19 | SDL3 input completion: event translation and gamepad | input determinism tests green; keyboard/gamepad steering (human checkpoint) | S08 | pending |
| S20 | Luau UI over ImGui: the mod-facing svsw.ui surface | Luau HUD in a windowed run; invariance + containment tests green | S14, S16 | pending |
| S16b | Editor walking skeleton: shell, one worker, viewport transport proof | editor-skeleton smoke green; shared-surface viewport at the dev window (human checkpoint) | S08, S16 | pending |
| S21 | Gate roster completion: the svsw equivalence obligation | enumerated roster green in one `just check`; tooling roundtrip green; composite windowed checkpoint | S09, S11b, S12b, S13, S15, S17, S18, S19, S20 | pending |
| S22 | Editor core: command stream, play-in-editor Session, scene tree | first `just editor-roundtrip-check` green | S08, S16, S16b, S21 | pending |
| S22b | Engine dev loop: rebuild, respawn, restore | dev-loop smoke gate green: scripted edit-rebuild-respawn-restore run ends with the session dev-diverged flag set and within-build checks passing | S02a, S08, S22 | pending |
| S22c | Time-travel debugger core: snapshot ring, seek, inspection family | scripted scrub gate green: revisited hashes match within the seek budget | S22, S22b, S02a, S08 | pending |
| S22d | Extension seam proof: sample Extension, editor-build recipe | with/without-Extension gate green: registration, tier-scan, identical Session behavior | S22 | pending |
| S23 | Editor features: asset browser, gizmos, profiler panel | full `just editor-roundtrip-check` on a committed human-authored log | S22, S12b, S18 | pending |
| S24 | Editor-Luau capability tier | capability-scoping gate green | S22, S14 | pending |
| S24b | Script and native debugging: Luau breakpoints, DAP attach | breakpoint gate green: suspend mid-system, inspect, resume to an unchanged hash | S22c, S14, S24 | pending |
| S25 | Animation runtime: sampler, blend, GPU skinning, container sections | animated scene green on invariance/readback/skeleton/parity; S23 log re-recorded | S07, S12b | pending |
| S26 | Walking skeleton: Go supervisor, worker contract, envelope freeze | `just proto-conformance` green both sides; supervision tests green; v1 frozen | S05, S21 | pending |
| S27a | Go gateway v1: QUIC, sessions, worker supervision | gateway smoke green: QUIC client authenticates, intents reach a worker | S26 | pending |
| S27b | Go durability v1: Tick_Commit log, checkpoints, outbox | kill/respawn/resume with no hash divergence | S27a, S22b | pending |
| S28 | Replication: chunk-scoped deltas, prediction, reconciliation | two clients through the real gateway under injected faults, tripwire trips | S27a, S11a, S22b | pending |
| S29 | Two-client co-op harness: mods/nettest and coop-smoke | `just coop-smoke` green incl. fault and windowed-parity legs (stage 5 exit) | S27b, S28, S15 | pending |
| S29b | Server attach and desync replay | attach-and-replay gate green: server timeline scrubbed, desync reproduced to first divergent tick | S29, S22c | pending |
| S30 | Verification scene: a representative gameplay ruleset as base-as-mod plus second mod | `just scene-accept` headless green; second mod changes the hash | S23, S15, S13, S11a | pending |
| S31 | Camera continuum, first-person controller, client presentation polish | scene with camera drop-in, animation, themed HUD green on parity | S30, S25, S20, S13, S19 | pending |
| S33 | Player save/load v1: versioned reader, autosave | save/load gate green: save at T, fresh-process load, resim matches golden | S17, S13, S30 | pending |
| S32 | Engine acceptance + residual sweep | `just engine-accept` green incl. coop and save/load legs; maintainer sign-off; residual sweep | S29, S30, S31, S33, S17 | pending |

## Review notes

An adversarial review ran two lenses over the draft split: running-software
and gate discipline, and coverage fidelity against the roadmap. Every blocker
and major finding is amended below; minors are folded in where the fix was
cheap. Spec IDs stay stable against the draft; the four review-mandated splits
use letter suffixes (S02a/b, S11a/b, S12a/b, S27a/b) so no other ID moves and
no renumbering can reintroduce the cross-reference defect. S22b also carries
a letter suffix, but under the separate mid-series-insertion use of the
stable-identifier scheme described above, not as one of these review splits.
M-prefixed specs (M00) are design mockups producing reviewable artifacts, not
engine code, and sit outside this S/C-series numbering.

Blockers and majors:

1. **Index-wide off-by-one in prose cross-references (blocker).** Fixed by a
   mechanical sweep: every S-number in prose was re-derived from the final
   spec titles and checked to name a spec whose title matches the described
   content. The stale-notes instances (gate roster misnamed S22, a rebrand
   credited to an S33 that did not then exist and whose number now names
   player save/load, the prototype-port list, the stage counts) are
   rewritten in this header.
2. **S02 too large (major).** Split. S02a ports the six prototype packages with
   their suites and gates on the determinism pyramid; S02b builds simmath3d
   and the cross-CPU hash gate, the highest-risk new stage 0 code, with its
   own grilling session. S02b depends on S02a for the harness only.
3. **S05 no running software (major).** Amended: the gate now builds and runs
   a two-process echo pair (a listener binary and a client exchanging
   versioned frames over localhost, negotiation included), and the spec gains
   an explicit hostile-frame corpus and fuzz obligation matching the prototype
   codec suites.
4. **S11 false serialization behind Milestone A (major, both lenses).** Split.
   S11a (worldgrid, per-chunk hashing, activation, default fill) depends on
   S02a and S04 only; its parity leg runs on the unshadowed renderer,
   matching the roadmap's stated stage 2 dependency split. S11b (floating
   origin) is the small rendered follow-on on S11a and S06. S13 no longer
   waits on CSM transitively.
5. **S17 missing dependency (major).** S11a added to depends-on; the root-hash
   gate wording now has a dependency path.
6. **S28 transport ambiguity (major).** S27a added to depends-on; the spec
   states the two headless clients connect through the real gateway on
   localhost, and the fault-injection rig wraps that path.
7. **S27 too large (major).** Split. S27a delivers the QUIC gateway, sessions,
   and worker supervision; S27b delivers durability (Tick_Commit log,
   checkpoint store, outbox) and gates on kill/respawn/resume with no hash
   divergence.
8. **S12 too large and over-serialized (major, both lenses).** Split. S12a
   (container format plus assetc) gates on the glTF round-trip to rendered
   goldens plus codec fuzz and depends on S04 and S06, not S07; nothing in it
   exercises CSM. S12b (runtime loader plus hot reload) gates on a running
   scene hot-swapping assets, so the hot-reload contract is no longer scope
   without software. The cgltf/bc7enc/astcenc vendoring moves to S01.

Minors folded in: S01's goal now names the exact vendored set and is true
(asset-pipeline libs vendor in S01, first consumer S12a; astcenc vendors
alongside bc7enc per the roadmap's both-pinned instruction, runtime ASTC use
held for mobile). S08 depends on S05 and S06, not S07, so the split-process
topology does not wait on CSM iteration. S03 labels its windowed presentation
as a human checkpoint. S10 gains a parity assertion on world and skeleton
hashes with cluster counts included. S00 commits the research corpus and the
adopted roadmap under `docs/research/`. S21 enumerates its roster as a
numbered checklist with hard-gate or report-only marks and adds the composite
windowed split-process checkpoint with sound and gamepad together. S23 defines
the animated-character placeholder as a static mesh tagged as the character
slot, and S25's gate re-records the roundtrip log with the real animated
character. S30 owns its recipe name, `just scene-accept`, which S32's
`engine-accept` composes.

---

### M00 — Editor visual mockup: HTML+CSS prototype of the editor's look and behavior

- **Stage:** Pre-sequence design artifact (before Stage 0)
- **Status:** spec written
- **Design record:** `docs/design/editor-mockup.md` records the ceremony's
  decisions, the layout, the behavior contract, and acceptance.
- **QA sweep record:** docs/design/editor-mockup-qa.md
- **Ceremony addendum:** tabbed document center, run-target Session
  control, bidirectional tick transport, full menu feature map — see the
  design record.
- **Goal:** A browsable HTML+CSS (plus minimal vanilla JS) mockup of the svsw
  editor, showing how the editor should and could look and behave, so gaps in
  the editor plan surface visually before any engine code exists. The mockup
  is not exhaustive: it is a visual thinking tool that becomes the normative
  reference for the editor specs.
- **Working software:** The mockup opens in any browser from the repo
  (`docs/design/editor/index.html`); panels are interactive (dock/collapse,
  tabs, tree expand/select, toolbar states); the layout reflects the decided
  editor architecture: a central viewport (placeholder scene), scene tree,
  inspector, asset browser, console, profiler panel, a play/pause/step
  toolbar for the play-in-editor Session, a command-log panel reflecting the
  typed command stream (D21: every edit a command, undo/redo as log
  navigation), and a status bar showing tick count, world hash, and
  gate/parity status (D22 vocabulary). Acceptance is a human review
  checkpoint (visual design cannot be verified headlessly) plus the files
  rendering without errors.
- **Depends on:** none (deliberately before S00; needs no toolchain)
- **Decisions:** D21, D22, D9
- **Prototype ports:** none
- **Normative references:** none
- **Scope in:** static HTML, CSS, and vanilla JS only, no frameworks, no
  build step; the design record (`docs/design/editor-mockup.md`) explaining
  what the mockup is and is not; dark theme first; generic placeholder scene
  content.
- **Scope out:** any real engine integration; pixel-perfect final visual
  design; game-specific content; ImGui implementation details (the mockup
  informs what the editor shows, S22-S24 decide how ImGui renders it).
- **Open questions:**
  - Layout reference: ImGui docking conventions versus a custom layout
    language.
  - The v1 panel set, and what is deliberately omitted.
  - How the viewport placeholder represents a 3D scene: a static image, CSS
    3D, or canvas.
  - Interaction fidelity: visual-only versus clickable flows like
    select-entity-then-inspect.
  - Whether the command-log panel shows a scripted demo sequence.
  - Theme and visual identity direction.
  - Whether the mockup later ships on GitHub Pages as a public design
    artifact or stays repo-only.

## Stage 0 — New-stack proof

### S00 — Repo bootstrap: toolchain, just check skeleton, two-platform CI

- **Stage:** 0 — New-stack proof
- **Status:** spec written
- **Spec document:** [S00-repo-bootstrap.md](S00-repo-bootstrap.md), the
  normative text. This entry has collapsed into it: the document carries
  every schema field, the grilling dispositions, the validation debt S00
  implementation owes, and the exit checklist.

### S01 — Vendoring ceremony: all C-tier dependencies

- **Stage:** 0 — New-stack proof
- **Status:** spec written
- **Spec document:** [S01-vendoring-ceremony.md](S01-vendoring-ceremony.md),
  the normative text. This entry has collapsed into it: the document
  carries every schema field, the grilling dispositions, the vendored
  roster and its gates, and the exit checklist.

### C00 — Course platform bootstrap: sibling repo, Pages deploy, embed and truth-verify gates

- **Stage:** 0 — New-stack proof
- **Status:** pending
- **Goal:** The pairing rule (D27) needs a platform before the first module can
  publish: the `course` sibling repo scaffold under the `svswengine` org, the
  GitHub Pages deploy, and the prototype tooling port (VitePress shell, lesson
  components, references registry, embed-check, the full-build gate, the
  truth-verify workflow), plus the two mechanisms the repo split and the path
  composition make necessary: pinned-engine-commit embed resolution and
  path-tag composition with its path-closure check. This is working software in
  the setup-spec sense: a deployed course shell whose gates run green, carrying
  the first two real modules, which takes S00 and S01 to course published.
- **Working software:** Setup spec. The course shell is live on GitHub Pages
  from the `course` repo carrying the S00 and S01 modules; course CI runs
  embed-check against the pinned svsw commit, the reference cross-check,
  the path-closure check, and the full site build, all green; S00 and S01
  reach course published in this index.
- **Depends on:** S00, S01
- **Decisions:** D26, D27
- **Course:** module C00; path tag engine; teaches the course platform itself
  against the deployed shell and its green gates; also seeds the shared Setup
  track.
- **Prototype ports:** the prototype course stack: VitePress shell, lesson
  components, references registry, embed-check, the full-build gate, the
  truth-verify authoring workflow.
- **Normative references:** none
- **Scope in:** the `course` repo scaffold and the Pages deploy; the prototype
  tooling port; the engine pin and embed resolution against it; per-lesson
  path tags, the generated path compositions, and the path-closure
  check; the S00 and S01 modules; the language-slicing audit for Odin, Luau,
  Slang, and Go embeds; the Odin Shiki grammar vendored with provenance; the
  CI heap budget set with the first module. The course-pairing skill and
  the truth-verify workflow ship here, primarily in the course repo's own
  `.claude` tree (`docs/plans/claude-tooling-design.md`). The course-modules
  published badge ships here, per `docs/plans/public-stats.md`.
- **Scope out:** modules for specs beyond S00 and S01 (each follows its
  spec's implementation); course-path content beyond the engine path
  (defined in the course repository).
- **Open questions:**
  - Engine pin mechanism: git submodule versus a recorded-commit checkout in
    course CI, and who bumps the pin.
  - Region-marker mechanics for the D59 embed anchors: Odin regions port
    as-is; the marker convention Luau, Slang and Go sources carry, Shiki
    grammar coverage for each, and how much of the internal prototype's
    slicer tooling survives the move from line ranges to region anchors.
  - Path composition mechanism: build-time sidebar generation from
    frontmatter tags versus hand-maintained per-path sidebars, and where the
    path-picker state lives.
  - Whether the report-only drift probe against svsw HEAD lands in C00 or
    with the first pin bump.
  - Pages deploy shape: deploy-from-Actions versus branch deploy, and whether
    a custom domain enters now.
  - Build budget: Node heap size and a build-time ceiling for the target
    corpus, set in CI with the first module.
  - How much of the internal prototype's course-writer agent and course-embeds
    skill material ports into the course repo's own agent tooling.
  - A generated API-reference path on the existing Pages deploy: render
    the D34 binding-registry `.d.luau` output per capability tier, the
    drift gate keeping it honest, plus a thin getting-started track for
    engine users; decided here, shipped once S14's generator exists.

### S02a — Prototype kernel port: kernel, ECS, simrng, save/replay, harness

- **Stage:** 0 — New-stack proof
- **Status:** spec written
- **Spec document:**
  [S02a-prototype-kernel-port.md](S02a-prototype-kernel-port.md), the
  normative text. This entry has collapsed into it: the document carries
  every schema field, the grilling dispositions, the port inventory, the
  determinism pyramid, and the exit checklist.

### S02b — simmath3d + cross-CPU hash gate

- **Stage:** 0 — New-stack proof
- **Status:** spec written
- **Spec document:**
  [S02b-simmath3d-cross-cpu-gate.md](S02b-simmath3d-cross-cpu-gate.md),
  the normative text. This entry has collapsed into it: the document
  carries every schema field, the grilling dispositions, the operation
  inventory, the policing mechanisms, and the exit checklist.

### S03 — SDL3 window + RHI device + draw-list render core

- **Stage:** 0 — New-stack proof
- **Status:** grilled
- **Goal:** The new render stack's skeleton: `engine/platform_sdl` (window,
  event pump, swapchain surface), `engine/render3d` (backend-free CPU core
  emitting a plain draw-list), `engine/render3d/gpu` (the in-house rendering
  interface and the only consumer of a graphics backend, with an offscreen
  attachment). D42 makes that stratum a real abstraction over three
  backends rather than a thin pass-through to one, so its shape is now this
  spec's central design problem rather than a detail. Both modes drive
  one render path into the same offscreen target; the window presents
  from that target, so a mode fork cannot hide.
- **Working software:** A headless run renders a test frame offscreen with no
  window; a smoke test asserting both paths execute passes in `just check`
  (goldens arrive in S04). A windowed run opens an SDL3 window and presents
  the same frame on the dev machine: this is a human checkpoint, not a CI
  assertion.
- **Depends on:** S01, S02b
- **Decisions:** D2, D7, D14, D22, D42, D47, D48
- **Course:** module S03; path tag engine; teaches the SDL3 platform layer,
  the in-house rendering interface, and the draw-list render core against
  the offscreen test frame.
- **Prototype ports:** the D2 boundary pattern (backend-free core, thin GPU
  stratum, boundary-scan gate), rebuilt over the in-house interface.
- **Normative references:** none
- **Scope in:** `engine/platform_sdl` window/swapchain/event pump; the
  draw-list struct stream (pipeline id, bind sets, handles, instance ranges,
  uniform blocks); `engine/render3d` one opaque pass with depth buffer;
  `engine/render3d/gpu` carrying the rendering interface and walking the
  list into backend calls with an offscreen attachment; Vulkan and Metal
  implemented per D48's sequencing, the interface designed against all
  three APIs' constraints with D3D12 arriving through its own spec;
  tier-scan rules extended so only the platform tier and render3d/gpu
  touch a graphics backend or SDL3; the first Slang shader under
  shader-check.
- **Scope out:** goldens and the parity gate (S04); textures and materials
  beyond the minimum to draw; input translation (S08, S19); audio (S18).
  Ray tracing, mesh shaders, bindless and async compute: D42 exists so the
  interface can reach them later, and none is drawn here.
- **Open questions:**
  - **Viewport surface transport as a named RHI capability (D47).** The
    shape of cross-process offscreen-target export per backend (IOSurface,
    dma-buf external memory, NT shared handles) and where it sits in the
    interface, designed in rather than bolted on.
  - **How much of the interface S03 defines.** A resource and command
    vocabulary that never needs breaking later, or the minimum to draw one
    triangle, accepting a redesign when ray tracing and bindless arrive.
  - Explicit-barrier and resource-state model: tracked automatically inside
    the interface, or declared by callers.
  - Swapchain surface format and color-space handling so presented and
    readback pixels stay comparable across three backends.
  - Present mechanism from the offscreen target: blit versus a
    fullscreen-triangle pass.
  - Adapter and device selection policy across CI and dev machines, now per
    backend, and how far the D48 compile-only Windows leg ruled into S01
    reaches: does it exercise this spec's Vulkan-on-Windows path beyond
    compiling it, or does Windows coverage stay scoped to S03b's rig-only
    D3D12 leg.
  - How the draw-list uniform-block ABI stays monomorphic per the Trinity
    RenderJob shape.

### S04 — Textured cube: three golden tiers + the D22 parity gate

- **Stage:** 0 — New-stack proof
- **Status:** pending
- **Goal:** The stage 0 exit: a textured cube with hardcoded vertices orbited
  by a deterministic camera inside a real Session, stepped N ticks headless.
  Stand up `render3d-golden-check` (world hash, draw-list skeleton hash,
  offscreen readback golden with perceptual tolerance) and `just
  parity-check`, which runs the scenario headless and through a real window
  and asserts identical world and skeleton hashes plus a matching readback.
- **Working software:** `just check` extended with `render3d-golden-check`
  green on both CI platforms windowless; `just parity-check` green on the cube
  (the Linux CI windowed leg under a virtual display); the window shows the
  cube on the dev machine and a human confirms appearance (human checkpoint).
- **Depends on:** S02b, S03
- **Decisions:** D22, D7, D48, D54
- **Course:** module S04; path tag engine; teaches the golden tiers and the
  parity gate against the textured-cube scenario.
- **Prototype ports:** golden-hash gate discipline and the one-command re-record
  workflow.
- **Normative references:** none
- **Scope in:** the cube scenario as a Session-driven scene with a
  deterministic camera; the skeleton-hash definition (pipeline ids, resource
  handles, draw order, counts, pass structure, floats excluded); the readback
  golden with perceptual tolerance and a re-record recipe; the parity runner
  including the virtual-display CI leg; a full-byte draw-list hash as an
  optional same-machine golden; the golden axes stated: readback goldens
  key per platform and shader backend, world and skeleton goldens stay
  platform-invariant, cross-backend visual equivalence belongs to the S21
  comparison gate (D48), and re-record ownership is recorded per axis;
  the cube goldens record ahead of the D54 resolve chain and are accepted
  as a one-time re-record when S06 lands it; a validation-debt item on the
  S00 pattern: demonstrate a readback golden surviving the macos-26
  runner's paravirtual Metal device and lavapipe on ubuntu-24.04 before
  any readback or parity gate is declared a hard CI item, with
  skeleton-only degradation recorded as the fallback. The parity-verify
  skill ships here
  (`docs/plans/claude-tooling-design.md`). The headless == windowed parity
  badge ships here, per `docs/plans/public-stats.md`.
- **Scope out:** asset loading (S12a); lighting (S06, S07); multi-object
  scenes (S06).
- **Open questions:**
  - Perceptual tolerance metric and threshold for the readback tier.
  - GPU-less Linux CI: is lavapipe the readback fallback, and what does the
    skeleton-only degraded mode look like on headless-only runners.
  - Virtual display mechanism for the CI windowed leg (Xvfb, weston) and its
    surface support per backend.
  - N ticks and camera-orbit parameters that make the goldens sensitive
    without being brittle.
  - Is this spec's readback-tier platform fragility, the macos-26
    paravirtual Metal device and lavapipe on ubuntu-24.04, the same
    question as D48's compile-gated Windows posture, namely what CI
    actually guarantees per platform, and are both answered as one
    stated policy rather than two.

### S05 — Protocol v0: versioned frames, two-process echo pair, the arrow rule

- **Stage:** 0 — New-stack proof
- **Status:** grilled
- **Goal:** The protocol seam from frame one: a `protocol/` package with
  versioned, checksum-first, length-prefixed frames extending the prototype
  replay-codec hardening pattern, version negotiation with a
  supported-version whitelist, the `Session.step(Canonical_Input_Set) ->
  Tick_Commit` seam named in code, and the dependency-arrow rule
  (session/kernel never imports network, wall clock, or Go-facing code)
  enforced as a gate. The gate runs real software: a two-process echo pair.
- **Working software:** `just proto-frame-check` green: it builds and runs a
  listener binary and a client binary that exchange versioned frames over
  localhost with negotiation, then runs a hostile-frame corpus (fuzzed,
  malformed, and unsupported-version frames all rejected clean, matching the
  prototype codec suites); the tier-scan arrow rule passes inside `just check`.
- **Depends on:** S02a
- **Decisions:** D15, D57
- **Course:** module S05; path tag engine; teaches versioned wire-frame
  design and hostile-input hardening against the two-process echo pair.
- **Prototype ports:** the replay/save wire-format hardening pattern (checksum
  first, bound lengths, fail clean).
- **Normative references:** none
- **Scope in:** frame envelope (version, checksum, length prefix); version
  negotiation plus whitelist; `Canonical_Input_Set` and `Tick_Commit` types
  named at the seam; the input-composition rule stated as part of the seam
  definition: every state-mutating input, edit commands included, reaches a
  Session only as a member of some tick's Canonical_Input_Set or as a
  defined between-tick boundary event recorded in Tick_Commit, so the
  Tick_Commit stream is the total order every replay reconstructs (D57);
  the two-process echo pair; the hostile-frame corpus and
  fuzz obligation; the tier-scan arrow gate. The proto-conformance skill
  ships here at its v0 scope, shared with and extended at S26
  (`docs/plans/claude-tooling-design.md`).
- **Scope out:** the split-process render client (S08); worker three-call
  contract enforcement and the envelope freeze (S26); replication message
  kinds (S28, frozen at S29); any Go code.
- **Open questions:**
  - Exact v0 frame header layout and checksum algorithm.
  - How much of the three-call worker contract is drafted in code now versus
    prose until S26.
  - Does `Tick_Commit` carry enough content from v0 that a Tick_Commit
    stream alone reproduces byte-identical state, the world hash for later
    desync tripwires and the applied input set for resume and forensics
    both included, framed against S02a's now-mandatory save-load-save
    round-trip.
  - Does the v0 header reserve D49's editor and tooling message-kind range
    alongside the replication and worker-contract ranges now, or is range
    allocation deferred to S26's freeze.
  - Given D57's tick-stamped command-log total order, does the v0
    Tick_Commit payload need a slot for command-log entries distinct from
    tick input, or is that entirely S26 and S28 scope past v0.

## Stage 1 — Renderer, Forward+ staged

### S06 — Renderer foundations: pipeline cache, culling, materials, camera

- **Stage:** 1 — Renderer, Forward+ staged
- **Status:** pending
- **Goal:** The real renderer's substrate: simmath3d fleshed out under the
  policed policy; a pipeline cache keyed by the fixed permutation set (lit or
  unlit, skinned or static, alpha modes); frustum culling; depth-buffer
  opaque ordering plus a back-to-front transparent pass; a material system
  consuming glTF metallic-roughness values as-authored; the camera (position,
  quaternion, FOV, near-far, inverse-VP ray picking) with the
  top-down-to-first-person continuum designed as one camera with two rigs.
- **Working software:** A multi-object PBR scene (unshadowed) with opaque and
  transparent draws passes world-hash, skeleton-hash, readback, and parity
  tiers on both CI platforms; a camera-rig test scene exercises both rigs.
- **Depends on:** S04
- **Decisions:** D8, D54, D55
- **Course:** module S06; path tag engine; teaches renderer foundations and
  Slang shading against the multi-object PBR scene.
- **Prototype ports:** none
- **Normative references:** none
- **Scope in:** simmath3d growth one function at a time under the cross-CPU
  gate; pipeline cache plus permutation key; frustum culling;
  opaque/transparent pass structure; glTF metallic-roughness BRDF in Slang
  under the shader-check gate; the D54 resolve chain: an HDR offscreen
  target resolved through one fixed tonemap operator to the sRGB target
  D22 hashes, presents and reads back; camera, two rigs, ray picking;
  an off-hash debug-draw layer (lines, shapes, text chips submitted per
  frame, excluded from the world hash by construction) that S13, S22 and
  S23 consume instead of inventing three ad-hoc paths; a shader
  live-reload path, watch-recompile through the pinned Slang binary with
  pipeline-cache invalidation at a deterministic frame point, dev-only
  and off-hash; render-side math explicitly outside the policed regime,
  covered by the skeleton tier.
- **Scope out:** shadows (S07); clustered lights (S10); asset import (scene
  data stays hardcoded or trivially embedded until S12a).
- **Open questions:**
  - The exact permutation set, and whether alpha modes mean mask plus blend
    or blend only in v1.
  - How PBR test materials get authored before assetc exists (hand-written
    Odin data, embedded glTF values).
  - Camera-rig API shape and the continuum transition contract.
  - Point/spot light representation before clustering: a fixed small array
    in Milestone A?
  - The v1 ambient term, a flat or hemisphere constant (D54): shape and
    value, settled before the Milestone A goldens record; IBL and GI stay
    post-engine (D55). Frozen provisionally here and re-verified by S07's
    grilling once real CSM shadows exist, or fixed once here for both.
  - Does landing D54's HDR-offscreen to fixed-tonemap to sRGB resolve
    chain here oblige the one-time re-record of S04's cube goldens as part
    of this spec's gate, so the Milestone A goldens never absorb a stale
    cube golden.
  - The tonemap operator D54 fixes, and how its curve interacts with the
    readback tolerance.
  - The debug-draw layer's skeleton-hash treatment: included behind a
    flag or excluded like ImGui, and how a windowed-only overlay stays
    out of the D22 parity legs.

### S07 — Milestone A: cascaded-shadow-mapped sun (stage 1 exit)

- **Stage:** 1 — Renderer, Forward+ staged
- **Status:** pending
- **Goal:** One directional sun with cascaded shadow maps over the S06
  substrate. CSM quality and performance iteration is this stage's priced-in
  main sink. Engine-completion verification blocks on this milestone only,
  never on clustering.
- **Working software:** The Milestone A gate: a multi-object, single-sun,
  CSM-shadowed PBR scene green on world-hash, skeleton-hash, readback, and
  parity tiers on both CI platforms, the parity leg running the same scene
  windowed.
- **Depends on:** S06
- **Decisions:** D8
- **Course:** module S07; path tag engine; teaches cascaded shadow mapping in
  Slang against the Milestone A CSM scene.
- **Prototype ports:** none
- **Normative references:** none
- **Scope in:** CSM cascade selection, split scheme, depth passes in the
  draw-list and the skeleton hash; shadow sampling and bias strategy in
  Slang; readback goldens tolerant to the chosen filtering; perf iteration
  against the S09 harness once it exists.
- **Scope out:** clustered light culling (S10); any secondary shadow-casting
  light type.
- **Open questions:**
  - Cascade count and split scheme for the verification-scene camera
    continuum.
  - Shadow filtering choice (PCF tap count) versus readback-golden stability.
  - How shadow-pass structure is encoded in the skeleton hash so CSM
    regressions fail CPU-only.
  - Is S09's stress harness a real dependency of the CSM perf iteration or
    do informal perf checks suffice until S09 exists, the index ground
    rule barring a dependency on a later spec, so the answer either moves
    S09 or keeps the iteration informal.
  - Does this spec's grilling re-verify the ambient constant S06 freezes,
    D54 having written that constant to keep shadowed areas off black in
    these very goldens, or inherit it unchanged.

### S08 — Split-process topology: sim process + render client over the protocol

- **Stage:** 1 — Renderer, Forward+ staged
- **Status:** pending
- **Goal:** Make the client/authoritative-sim split the normal dev topology: a
  headless sim process and a render client talk over `protocol/` on
  localhost; the prototype `engine/input` three-stage seam (Raw_Input_Event ring
  to Input_Snapshot) ports with its tests and feeds the client intent stream
  as `Canonical_Input_Set` frames. The unshadowed S06 substrate suffices;
  the S07 scene flows through this topology later without a spec-level edge.
- **Working software:** `just split-smoke` green: sim and client boot as two
  processes, run N ticks, and assert hash-checkpointed agreement; the same
  scene renders identically to its single-process goldens.
- **Depends on:** S05, S06
- **Decisions:** D15; D6 (topology groundwork).
- **Course:** module S08; path tag engine; teaches the split-process
  topology and the input seam against `just split-smoke`.
- **Prototype ports:** the `engine/input` three-stage seam with its test suite.
- **Normative references:** none
- **Scope in:** process boot and handshake over protocol v0; per-tick intent
  frames and state transfer sufficient for the client to render; hash
  checkpoints in the stream; the `engine/input` port (seam only; SDL3 event
  translation is S19).
- **Scope out:** real network, loss, prediction (stage 5); Go anywhere;
  gamepad and windowed interactive input (S19).
- **Open questions:**
  - What crosses the wire in stage 1: a full render-relevant state snapshot
    per tick, or an early delta shape that S28 later formalizes, and does
    that answer follow S05's Tick_Commit-content decision rather than
    being taken independently here.
  - Does the client run a Session replica or render pure state uploads.
  - Checkpoint cadence for split-smoke, and whether stage-1 checkpoints
    are whole-world hashes only, D6's per-chunk hash checkpoints not
    existing until S11a lands at stage 2.

### S09 — 3D stress harness with provisional budgets

- **Stage:** 1 — Renderer, Forward+ staged
- **Status:** pending
- **Goal:** `just stress` gains the 3D benchmark now: draw-list build p95 and
  sim tick p95 on a synthetic multi-chunk-shaped scene, budgets marked
  provisional until S21 confirms them, so perf-critical renderer and world
  code never goes gate-dark.
- **Working software:** `just stress` runs the 3D benchmark report-only on
  hosted CI, whose shared runners drift in CPU class, and hard-enforced on
  the dev machine and the win rig; where enforcement is hard, a budget
  regression fails the recipe.
- **Depends on:** S06
- **Decisions:** D4 (the scene scale)
- **Course:** module S09; path tag engine; teaches the stress harness and
  p95 budget discipline against the CI-enforced 3D benchmark.
- **Prototype ports:** the stress-benchmark recipe pattern with measured p95
  budgets.
- **Normative references:** none
- **Scope in:** a synthetic scene generator (hardcoded Odin scene, no
  scenario-file format), pinned to the D4 few-chunks scale so the budgets
  defend the bar the engine promises; p95 measurement for sim tick and
  draw-list build; a Luau-system-heavy scenario with its own sim-tick p95
  budget, pricing script-heavy ticks two stages before S30 commits the
  ruleset to Luau, confirmed at S21; CI
  wiring and budget documentation. The sim-tick p95 badge ships here, per
  `docs/plans/public-stats.md`.
- **Scope out:** budget confirmation (S21); GPU-time measurement (skeleton
  and CPU only; GPU timing is a later decision); mesh LOD and occlusion
  culling, post-engine on the D55 roster, engine-scope culling staying
  frustum-only and this spec's stress scene staying pinned to D4's
  few-chunk scale, so a budget miss is never answered by scoping culling
  in.
- **Open questions:**
  - Initial provisional budget numbers and the machine class they assume.
  - Synthetic scene shape: entity count, draw count, chunk-like spatial
    distribution parameters.
  - Does worker-count variance testing, D20's identical golden at
    workers=1 and workers=max, live in this stress harness or purely in
    S12b's hash-golden gate, so ownership is single.
  - Is the synthetic multi-chunk-shaped scene cosmetic before S11a exists,
    or does it get revisited once S11a's structural chunk model lands.

### S10 — Milestone B: compute-shader clustered light culling

- **Stage:** 1 — Renderer, Forward+ staged
- **Status:** pending
- **Goal:** Forward+ completed: compute-shader light clustering, with
  cluster-assignment counts joining the skeleton hash so clustering
  regressions fail CPU-only on GPU-less CI. May re-sequence later per the
  roadmap, carrying its gate with it; nothing downstream depends on it.
- **Working software:** The Milestone B gate: an N-point-light clustered scene
  green with cluster-assignment counts in the skeleton hash on both CI
  platforms, plus a parity assertion on world and skeleton hashes (cluster
  counts included) so a headless/windowed fork in the clustering path cannot
  hide.
- **Depends on:** S07
- **Decisions:** D8
- **Course:** module S10; path tag engine; teaches compute-shader light
  clustering in Slang against the Milestone B clustered scene.
- **Prototype ports:** none
- **Normative references:** none
- **Scope in:** cluster grid plus compute assignment pass in Slang; CPU-side
  reference computation of cluster counts feeding the skeleton hash; the
  N-point-light test scene; the parity leg.
- **Scope out:** shadowed point/spot lights; GPU-driven culling beyond light
  clustering.
- **Open questions:**
  - Cluster grid dimensions and depth slicing scheme.
  - Does the CPU reference compute counts exactly, or does the skeleton hash
    record a CPU-derived expectation validated against GPU readback locally
    only.
  - Compute-pass viability on the Linux software-Vulkan CI path.
  - Is the CPU-side reference computation of cluster counts main-thread
    work under D20, or exempt from that rule as sim-adjacent CPU work.
  - Should this floating spec's map be charted after the stage-2 rows that
    do gate other work, S11a and S12a, rather than immediately after S07,
    nothing downstream depending on it.

### S03b — D3D12 backend: the third RHI implementation on the win rig

- **Stage:** 1 — Renderer, Forward+ staged
- **Status:** pending
- **Goal:** The third backend per D48: the RHI's D3D12 implementation,
  exercised on the Windows rig because no hosted runner carries a D3D12
  GPU. Its gate story grows `just win-check` with the skeleton and
  readback tiers, report-only until the rig loop is demonstrated, and
  S21's roster carries the D3D12 axis marked report-only. Nothing
  downstream depends on this spec, so it floats: it can land any time
  after S04 without blocking or being blocked.
- **Working software:** `just win-check` runs the cube and multi-object
  scenarios on D3D12: skeleton hashes match the committed
  platform-invariant goldens, readback goldens record on the rig under
  the S04 axes, and results are recorded per the S21 win-check cadence,
  report-only.
- **Depends on:** S04
- **Decisions:** D42, D48
- **Course:** module S03b; path tag engine; teaches the D3D12 backend
  against the win-check tiers.
- **Prototype ports:** none
- **Normative references:** none
- **Scope in:** the D3D12 RHI implementation behind the S03 seam; the
  win-check growth to skeleton and readback tiers; the descriptor-heap
  and barrier specifics the S03 interface shape reserved for this
  backend.
- **Scope out:** any hosted-CI obligation (no Windows GPU runner exists
  at zero budget); D3D12-only features beyond the S03 interface.
- **Open questions:**
  - What triggers scheduling the floating spec, and how long the
    interface may drift before the third implementation gets expensive.
  - Whether readback tolerance bands differ on the rig's GPU class.
  - Now that D48's compile-only hosted Windows leg is ruled into S01, does
    this spec's rig work depend on that leg existing first, or is the rig
    loop independent of it.
  - Does D48's "Vulkan is the supported Windows path in the engine era"
    demote D3D12 from floating to permanently non-blocking and optional,
    and should this row say so explicitly rather than only that nothing
    downstream depends on it.

## Stage 2 — World structure + assets

### S11a — Chunked world: worldgrid, per-chunk hashes, activation, default fill

- **Stage:** 2 — World structure + assets
- **Status:** pending
- **Goal:** The sim side of the Factorio-model world (D5): chunk index plus
  f32 chunk-local coordinates in sim state; per-chunk hashes composed into a
  root over the unchanged ported `hash_world` primitives; deterministic chunk
  activation and deactivation; a deterministic, hashed default fill for
  unauthored chunks (D17) so unbounded extent is real. This half depends only
  on stage 0 work, matching the roadmap's stage 2 dependency split, so the
  most determinism-critical stage 2 work never waits on CSM iteration.
- **Working software:** `just chunk-golden-check` green: an entity walks
  across a chunk boundary over N ticks and per-chunk and root hashes match
  committed goldens; `just parity-check` green on the chunk-crossing scenario
  with the unshadowed renderer on both platforms.
- **Depends on:** S02a, S04
- **Decisions:** D5, D17, D22
- **Course:** module S11a; path tag engine; teaches the chunked world and
  per-chunk hashing against `just chunk-golden-check`.
- **Prototype ports:** `hash_world` primitives and injectivity discipline
  (consumed, not modified); the completeness-reflection test extended to
  chunk fields.
- **Normative references:** none
- **Scope in:** `engine/worldgrid` chunk index and coordinates; hash
  composition above the kernel primitives; activation and deactivation as
  deterministic sim state; a flat-terrain default fill, seeded by a trivial
  rule, hashed; high-tier effort routing and adversarial review before merge.
- **Scope out:** floating-origin rendering (S11b); seeded procedural world
  generation (out of engine scope; D17); chunk-scoped network
  interest (S28); hand-authored chunk content (S30).
- **Open questions:**
  - Chunk size in world units and entities-per-chunk expectations from
    private product requirements: both are gated on that source (D4)
    stating numeric scale targets, which makes it a blocking external
    input to be confirmed in hand before this spec's grilling opens rather
    than a routine open question.
  - Root composition ordering rule and how absent or inactive chunks hash.
  - Activation policy: who activates chunks in a single-player headless run
    versus the server; S28 answers the server half under its
    replication-only interest invariant.
  - Where deactivated chunk state resides, and the memory posture that
    keeps unbounded extent bounded in resident memory: kept, spilled, or
    regenerated deterministically.
  - Does S02a's byte-identical save-load-save discipline extend to a
    round-trip crossing a chunk activation or deactivation boundary, or is
    that deferred to the player save and load spec D55 names.
  - Does S09's multi-chunk-shaped stress scene get revisited once this
    spec's structural chunk model lands.

### S11b — Floating origin: presentation-side re-basing

- **Stage:** 2 — World structure + assets
- **Status:** pending
- **Goal:** Floating-origin rendering as presentation-side re-basing over the
  S11a chunk model, proven hash-neutral by an invariance test. The small
  rendered follow-on to S11a.
- **Working software:** A scene placed far from the origin renders through
  re-basing; the invariance test proves a re-base changes no world hash;
  `just parity-check` green on the re-based scenario on both platforms.
- **Depends on:** S11a, S06
- **Decisions:** D5, D22
- **Course:** module S11b; path tag engine; teaches floating-origin
  re-basing against the invariance test and the far-from-origin parity run.
- **Prototype ports:** none
- **Normative references:** none
- **Scope in:** floating-origin re-basing in render3d; the hash-neutrality
  invariance test; the far-from-origin test scene.
- **Scope out:** any sim-side coordinate change (S11a owns the model).
- **Open questions:**
  - Re-base trigger threshold, and whether it is a hashed sim-visible
    value or a presentation-only constant, D1 requiring sim determinism
    independent of rendering choices.
  - Precision budget: at what distance does f32 chunk-local plus re-basing
    still hold the readback goldens.
  - Must the invariance test cover S02a's byte-identical save-load-save
    round-trip across a re-base boundary, or is re-basing provably
    orthogonal to serialized state.

### S12a — Asset container + assetc: glTF to sectioned binary to rendered goldens

- **Stage:** 2 — World structure + assets
- **Status:** pending
- **Goal:** The sectioned binary asset container (D19) with a brand-neutral
  name and magic from definition, and `tools/assetc`: glTF import via
  vendored cgltf, GPU texture encode via vendored bc7enc (astcenc vendored
  and pinned in S01, runtime ASTC held for later mobile), importer id,
  version, and source digests recorded so encoder bumps surface as provenance
  changes; a supported-version whitelist, re-bake on bump, zero runtime
  migration; scenes and prefabs stay data-stage content referencing the
  container.
- **Working software:** A glTF scene round-trips source to container to
  rendered goldens headless on both CI platforms inside `just check`;
  container codec fuzz and hostile-input tests green, the fuzz obligation
  covering the glTF import path through cgltf as well as the container
  codec (D51).
- **Depends on:** S04, S06
- **Decisions:** D19, D14, D51
- **Course:** module S12a; path tag engine; teaches the asset container and
  assetc against the glTF round-trip goldens.
- **Prototype ports:** codec hostile-input hardening discipline; the atomic
  tmp-then-rename write pattern.
- **Normative references:** none
- **Scope in:** the container format (magic, kind, schema-version, section
  table, checksums, logical content IDs); the assetc CLI for static meshes,
  textures, materials; baked-output loading in the render path sufficient for
  the rendered-golden gate; the process posture: editor-era callers invoke
  assetc as a separate short-lived process, a parser crash killing the
  bake rather than the caller (D51).
- **Scope out:** the runtime loader with worker-thread decode and the
  hot-reload contract (S12b); skeleton and animation sections (S25); audio
  bake (S23); the asset viewer UI (S16).
- **Open questions:**
  - The brand-neutral container name and magic bytes (maintainer pick, needed
    before the first baked data), whose delay blocks S16's viewer and S17's
    scaffold templates, both of which reference container files before this
    spec's rung advances.
  - How D53's re-bake-on-schema-bump-with-no-runtime-migration contract is
    tested here as an explicit gate rather than narrated.
  - Compression codec(s) per section, and whether v1 ships uncompressed.
  - BC7-only runtime posture for v1 given astcenc sits vendored for mobile.
  - Logical content ID scheme (hash of source path, stable GUID) and the
    collision policy.

### S12b — Runtime asset loader: worker-thread decode + hot reload

- **Stage:** 2 — World structure + assets
- **Status:** pending
- **Goal:** The runtime loader over the S12a container: worker-thread decode
  integrating at one deterministic point per frame (D20), and the hot-reload
  contract per asset kind (textures and materials swap, meshes reload with
  handle stability). The hot-reload contract gets a consumer and a gate here.
- **Working software:** A running scene hot-swaps a texture and a material and
  reloads a mesh with handle stability asserted; a determinism test proves
  worker-thread decode lands at its single integration point (same world
  hashes with decode threading on and off); both green in `just check` on
  both platforms.
- **Depends on:** S12a
- **Decisions:** D20, D19
- **Course:** module S12b; path tag engine; teaches the runtime loader and
  hot reload against the hot-swap scene with handle stability asserted.
- **Prototype ports:** none
- **Normative references:** none
- **Scope in:** the runtime loader; worker-thread decode and its single
  deterministic integration point; the per-kind hot-reload contract and its
  tests; handle-stability assertions.
- **Scope out:** streaming and eviction policy (waits for a consumer); audio
  sections (S23); skeleton and animation sections (S25).
- **Open questions:**
  - The integration-point contract: end of frame, start of tick, or a named
    sync stage.
  - Failure posture when a hot-swapped asset is malformed (loud placeholder
    per the prototype rule, or reject and keep the old asset).
  - How handle stability is asserted across a mesh reload.
  - Does the hash-golden gate need a leg forcing the identical scenario
    through workers=1 and workers=max per D20's amendment, distinct from
    the decode-threading-on-versus-off test already in the working-software
    wording.
  - Is the single deterministic integration-point contract asserted by that
    same forced-worker-count leg, or are the two separate tests.

### S13 — Deterministic collision v1, scoped by private product requirements

- **Stage:** 2 — World structure + assets
- **Status:** pending
- **Goal:** Deterministic collision in policed simmath3d terms and no wider
  than the private product-requirements envelope (D4): capsule, AABB, and
  sphere primitives
  versus primitives and versus chunk terrain via grid or heightfield proxies;
  a degenerate-case test corpus written before the solver; all state in
  hashed ECS components with snapshot-resim tests. No
  swept-versus-arbitrary-triangle-mesh in the deterministic path; middleware
  only ever off-hash.
- **Working software:** The collision degenerate-case corpus and
  snapshot-resim tests pass green inside `just check` on both platforms; a
  test scene with a capsule controller sliding on default-fill terrain
  reproduces its world-hash golden.
- **Depends on:** S02a, S11a
- **Decisions:** D4; D11 (hitboxes are sim colliders); D55.
- **Course:** module S13; path tag engine; teaches deterministic collision
  against the degenerate corpus and the capsule-on-terrain golden.
- **Prototype ports:** the degenerate-corpus-before-solver and snapshot-resim
  test patterns.
- **Normative references:** none
- **Scope in:** primitive-versus-primitive tests and resolution;
  primitive-versus-heightfield/grid terrain proxies; the queries the editor
  and controller need (raycast, overlap, sweep of the supported primitives);
  hashed ECS collision components.
- **Scope out:** convex-mesh decomposition collision; off-hash presentation
  physics middleware; first-person controller feel (S31); the dynamics-lite
  spec D55 left conditional on this grilling, which does not enter the
  index: deterministic collision with overlap and range queries suffices
  for the engine era, on the build-narrow evidence recorded on the map
  (issue #39).
- **Open questions:**
  - Exact envelope: which sweeps the gameplay-facing systems and the
    first-person controller require, which is what the private product
    requirements source (D4) has to enumerate for controller movement
    before the envelope can be settled, so that source is in the room for
    this grilling.
  - Heightfield versus grid proxy representation for chunk terrain and its
    authoring path.
  - Solver iteration and ordering rules that keep resolution deterministic
    across entity orderings.
  - Whether the S11a chunk grid is the broadphase, and how cross-chunk
    pairs order deterministically.
  - Collision layers and masks as a hashed component field, and the
    query-filter surface mods see.
  - Surface-response constants (friction-like slide parameters): hashed
    components mods can set, or code.
  - The terrain authoring source behind the proxies: an assetc heightmap
    bake (reflected into S12a), a Luau data-stage grid, or flat-only for
    engine scope, recorded in D17's amendment trail if flat-only wins. If
    the answer is the heightmap bake, does it add an S12a dependency this
    row does not list.
  - Whether the query set must serve deterministic grid pathfinding, and
    whether the chunk grid exposes a walkability view (D55: encounter
    movement is mod-side over these queries).
  - Debug-draw emission for colliders, contacts, and sweeps through the
    S06 layer, off-hash by the D11 invariance pattern.
  - Confirm this spec's map does not reopen the dynamics-lite question D55
    left conditional on this grilling: it is settled and stays out of the
    index, per this row's scope out.

### S14 — Luau sandbox port: the scripting boundary, test-first

- **Stage:** 2 — World structure + assets
- **Status:** grilled
- **Goal:** Stand up the scripting boundary on Luau (D33), adapting the
  internal prototype's hardened Lua embedding as patterns rather than a literal
  port: sandbox construction, an allocation cap plus the shared
  instruction-budget count hook, R1-R5 discipline at the C API boundary, one
  set_error/disable_mod containment path (a mod can never crash the engine),
  the schema two-pass validate-then-build parse, the D3 opt-in binding
  principle, and the `svsw.*` core API over schema-laid-out native storage with
  two-tier entity views. Sandbox, budget, and containment are re-derived
  against Luau's own sandbox primitives (`safeenv`, `luaL_sandboxthread`,
  call-depth limits, interrupts), not retrofitted onto stock Lua's.
- **Working software:** A sandboxed Luau sample runs headless N ticks and
  reproduces a committed world-hash golden (the script_accept equivalent);
  the sample exercises the D46 replaced math surface and ordered iteration,
  one committed hash on both CI platforms; sandbox containment,
  disable-in-place, and budget-enforcement tests green in `just check` on
  both platforms.
- **Depends on:** S01, S02a
- **Decisions:** D3, D12, D14, D33, D34, D35, D46, D50
- **Course:** module S14; path tag engine; teaches the Luau sandbox boundary
  and the `svsw.*` core API against the hash-golden Luau sample; candidate for
  additional course-path tagging on its mod-facing surface lessons (path
  structure defined in the course repository).
- **Prototype ports:** the internal prototype's `engine/script` sandbox,
  budget, and containment design (sandbox_strip, lua_Alloc cap, count-hook
  budget, R1-R5) as patterns, not literal code, since Luau's C API, GC, and
  stdlib differ from Lua's (D33); the `runtime/` stdlib seed re-authored
  against Luau's stripped globals.
- **Normative references:** none
- **Scope in:** a Luau VM host per mod built on Luau's own sandbox primitives;
  the D46 deterministic sim surface: engine-provided transcendentals,
  simrng-backed math.random, and ordered iteration for sim-writing table
  walks; the wall-clock watchdog beside the allocation cap and instruction
  budget (D50); interrupt behavior across coroutine boundaries verified
  against Luau upstream rather than assumed (D50, issue #38), settling the
  posture: coroutines are permitted within a tick, resuming across a tick
  boundary disables the mod, the shared instruction budget lives in the VM
  callbacks' userdata and never in per-thread userdata, budget exhaustion
  latches rather than resets because interrupt-raised errors are
  pcall-catchable, and the wall-clock watchdog is unchanged; the
  registry-driven binding fuzz gate, report-only here and hard in S21's
  roster (D50);
  the `svsw.*` core binding surface sufficient for a hash-golden Luau sample;
  R1-R5 as a standing review rule in `docs/ODIN_STYLE.md` and checklists,
  re-verified against Luau's C API; atomic persistence for `svsw.storage`;
  `--!strict` gate-enforced for base-as-mod and samples, nonstrict and
  advisory-only for third-party mods, the sandbox remaining the safety
  boundary either way (D34); the `.d.luau` declaration generator over the
  binding registry plus its `just check` drift gate (D34). The lua-binding
  skill and the binding-dev agent's gate-availability re-verification ship
  here (`docs/plans/claude-tooling-design.md`).
- **Scope out:** the multi-mod pipeline and mirroring (S15); UI bindings
  (S20); the editor capability tier (S24).
- **Open questions:**
  - Execution posture: interpreter-only for v1, or Luau native codegen,
    and if codegen is ever enabled, the gate asserting interpreter and
    codegen runs reproduce identical world hashes on both CI platforms.
    Is interpreter-only an engineering default this grilling can settle,
    or a maintainer performance-budget call tied to S09's stress harness.
  - Whether `svsw.*` grows a log binding, and how worker, engine, and
    per-mod log lines are attributed and routed to the editor Console
    (D49).
  - How the D46 pointer-keyed pairs() bar is enforced for nonstrict
    third-party mods, where the D34 lint is advisory: sandbox-level
    replacement of pairs in the whitelist, a load-time scan, or accepted
    as advisory with the S28 tripwire as backstop.
  - Collapse the internal prototype's scattered is-this-call-allowed-now gates
    into one primitive during the port, or port as-is first.
  - Which prototype `svsw.*` namespaces are in the v1 port surface versus
    deferred until a consumer exists.
  - Whether a deterministic tick-scheduler or wait-idiom for mod coroutines
    is worth building as later fast-path scope (D58), given that resuming
    across a tick boundary disables the mod.
  - Confirm this spec's map treats the coroutine posture recorded in scope
    in as closed rather than reopening it.

### S15 — Mod pipeline port: multi-mod shared world, proven by the mirroring test

- **Stage:** 2 — World structure + assets
- **Status:** pending
- **Goal:** Port the internal prototype's mod system as-is (D12): manifests,
  Kahn dependency resolution over a name-sorted ready queue, the settings to
  data to control load pipeline, global component IDs with
  first-declarant-registers schema mirroring, per-mod VM containment. Prove it
  the moment it is claimed: a skeletal second-mod mirroring test (a trivial mod
  patching data and registering one component beside a minimal base mod) joins
  the exit gate.
- **Working software:** The prototype mod-system suites plus the skeletal
  second-mod mirroring test and a settings-data-control pipeline test green
  in `just check` on both platforms; a hostile-manifest corpus (malformed
  syntax, dependency cycles, first-declarant collisions, oversized fields,
  path traversal in mod-relative references) rejected clean, on the S05
  corpus pattern (D50).
- **Depends on:** S14
- **Decisions:** D12, D33, D50
- **Course:** module S15; path tag engine; teaches manifests, the mod load
  pipeline, and schema mirroring against the second-mod mirroring test;
  candidate for additional course-path tagging on its mod-facing surface
  lessons (path structure defined in the course repository).
- **Prototype ports:** `engine/mod` (manifests, dependency resolution, load
  pipeline, mirroring machinery) with its suites.
- **Normative references:** none
- **Scope in:** mod discovery, manifest, and dependency port with suites;
  `svsw.data` and `svsw.setting` surfaces; a minimal base mod plus a trivial
  second mod as test fixtures; scenes and prefabs as data-stage content
  convention (Luau data files plus container references, no second scene
  format).
- **Scope out:** the shipped base-as-mod ruleset (S30); the nettest mod
  (S29); in-Session script reload, which S22b owns (D60); mod acquisition
  and distribution, how a mod reaches another machine, install and version
  resolution and signing included, all post-engine product work on the D55
  roster.
- **Open questions:**
  - What the minimal base mod contains as a fixture versus leaving all
    content to test mods.
  - Does mod content reference container assets already in this spec or only
    after S17 wires project layout.

### S16 — Asset viewer: the minimal ImGui-on-SDL3 shell

- **Stage:** 2 — World structure + assets
- **Status:** pending
- **Goal:** The first ImGui deliverable and the editor tier's plumbing proof:
  a standalone asset viewer on imgui_impl_sdl3 plus the in-house
  ImDrawData renderer over the RHI (D48), browsing and displaying
  container files. Its non-movable kernel is
  the minimal ImGui shell; whatever else re-sequences, the shell lands before
  S20's Luau-UI bind starts.
- **Working software:** The asset viewer opens a container file, lists
  sections and provenance, and renders a contained mesh with its textures
  (human checkpoint at the window); an ImGui-shell smoke test (boot, draw one
  frame offscreen, shut down clean) runs in CI.
- **Depends on:** S01, S12a
- **Decisions:** D9, D14, D48
- **Course:** module S16; path tag engine; teaches the ImGui shell against
  the asset viewer and its CI smoke test.
- **Prototype ports:** none
- **Normative references:** none
- **Scope in:** ImGui platform wiring through cimgui (imgui_impl_sdl3,
  platform tier only) and the in-house ImDrawData renderer over the RHI
  (D48); container browsing (section table, provenance,
  checksums); mesh and texture preview using render3d; a shell lifecycle
  reusable by the editor and S20.
- **Scope out:** editor features (S22, S23); Luau UI bindings (S20); container
  editing.
- **Open questions:**
  - Does the viewer live as a mode of one tools binary or its own binary.
  - How much shell code is deliberately shared with the S22 editor versus
    copied.
  - What the CI smoke can assert offscreen given ImGui draws through the
    same render path.
  - What the D48 ImDrawData renderer needs from the S03 RHI surface:
    scissor rects, texture binding, and the sRGB posture against the D54
    resolve chain.
  - Is that renderer exempt from any Windows gate obligation, being a dev
    tool rather than a shipped artifact, so this spec does not inherit
    S03b's Windows-readiness question by citing D48 alone.

### S17 — svsw CLI: new/run/package with 3D scaffold templates

- **Stage:** 2 — World structure + assets
- **Status:** pending
- **Goal:** Port the prototype CLI shape to the new target: `svsw new` emits a
  3D project (3D scene, container-referenced assets, headless-boot main), `svsw
  run` runs it windowed or headless, `svsw package` bundles it; scaffold-check
  proves the scaffold boots headless twice and reproduces one root hash, then
  packages and asserts embedded equals disk.
- **Working software:** `just scaffold-check` green inside `just check`: a
  throwaway scaffolded project boots headless twice, reproduces one root
  world hash, and packages correctly on both CI platforms.
- **Depends on:** S11a, S12b, S15
- **Decisions:** D16 as amended (the CLI ships as `svsw`; no rename
  pending); D53, D56.
- **Course:** module S17; path tag engine; teaches CLI usage and project
  scaffolding against `just scaffold-check`; candidate for additional
  course-path tagging on its mod-facing surface lessons (path structure
  defined in the course repository).
- **Prototype ports:** the `cli/` structure and scaffold-check pattern.
- **Normative references:** none
- **Scope in:** CLI verbs new/run/package; 3D project templates using the
  base-mod convention and container assets; the scaffold-check recipe wired
  into `just check`; the project-to-engine-source linkage per D56: `svsw
  new` records the pinned engine checkout path and toolchain expectations
  in project metadata, and the S22b rebuild recipe resolves from a
  scaffolded project; the retail failure posture: what a crash in a
  packaged game writes to disk (log file location, a crash artifact
  carrying the assert message and tick, the last checkpoint when one
  exists), local files only.
- **Scope out:** server verbs (post-engine CLI work; D16 as amended drops
  the rename pairing); package signing and distribution polish; mod
  acquisition and distribution across machines, post-engine product work
  on the D55 roster and distinct from the single-project packaging this
  spec owns.
- **Open questions:**
  - Template content: how minimal is the scaffolded scene while still
    exercising container, chunk, and Luau paths.
  - Windowed run policy in scaffold-check (headless only, or a parity leg
    too).
  - Does `svsw package` output get checksum or provenance treatment
    analogous to D53's tagged engine releases, or is D53 silent on
    game-project packages by design, naming only engine releases.

## Stage 3 — Platform completion + gate roster

### S18 — SDL3 audio: mixer port, stream pump, spatialization, headless gate

- **Stage:** 3 — Platform completion + gate roster
- **Status:** pending
- **Goal:** Port the prototype push-model 16-voice mixer core unchanged with its
  tests, plumb the pump onto SDL3 audio streams, and add the
  listener-relative 3D spatialization stage. Audio gets a machine-checkable
  gate beyond the human checkpoint: the mixer runs without a device, so a
  scripted scene's mixer output buffer is golden-hashed, and an invariance
  test proves spatialization is hash-neutral to the world hash.
- **Working software:** The headless mixer-output golden and the
  spatialization world-hash invariance test green in `just check` on both
  platforms; a windowed run plays sound on the dev machine (human
  checkpoint).
- **Depends on:** S03, S12a
- **Decisions:** D7
- **Course:** module S18; path tag engine; teaches the audio mixer and
  spatialization against the headless mixer-output golden.
- **Prototype ports:** the `engine/audio` mixer core with its test suite.
- **Normative references:** none
- **Scope in:** the mixer core port; the SDL3 audio stream pump at the
  platform tier; 3D spatialization as an additive stage; an assetc or loader
  path for test audio data sufficient for the golden (full audio bake is
  S23); the `svsw.audio` Luau surface port if the prototype gate needs it.
- **Scope out:** audio bake into container sections (S23); music and
  streaming features beyond the internal prototype's scope.
- **Open questions:**
  - Spatialization model v1: distance attenuation plus pan only, or
    HRTF-adjacent features.
  - Sample source for the headless golden before S23's bake exists.
  - Does the pump land behind the same platform_sdl package or its own seam,
    does it run on the main thread under D20, and should this row cite D20
    and D55 rather than D7 alone.
  - Does this spec need S12b, its scope naming a loader path for test audio
    data while depends on lists S12a only, and if that path uses
    worker-thread decode does D20's forced worker-count golden requirement
    reach it.

### S19 — SDL3 input completion: event translation and gamepad

- **Stage:** 3 — Platform completion + gate roster
- **Status:** pending
- **Goal:** Complete the input port: SDL3 event translation feeds the
  already-ported three-stage seam, closing the internal prototype's stubbed
  non-macOS gamepad gap via SDL3's gamepad database; windowed interactive input
  reaches the client intent stream.
- **Working software:** Input seam determinism tests green (recorded
  raw-event streams reproduce identical Input_Snapshot sequences); a windowed
  run steers a test scene by keyboard and gamepad on the dev machine (human
  checkpoint); headless canned-input runs stay hash-identical.
- **Depends on:** S08
- **Decisions:** D7
- **Course:** module S19; path tag engine; teaches SDL3 event translation
  and gamepad wiring against the input-seam determinism tests.
- **Prototype ports:** the `engine/input` seam already ported in S08; this spec
  adds the SDL3 front.
- **Normative references:** none
- **Scope in:** SDL3 keyboard, mouse, and gamepad event translation into
  Raw_Input_Event; gamepad database wiring; mouse capture and relative mode
  for the first-person rig; recorded-stream regression tests.
- **Scope out:** input remapping UI; touch and mobile input.
- **Open questions:**
  - Input_Snapshot extensions 3D needs (relative mouse deltas, capture state)
    and their hash classification: relative-mouse-delta capture takes an
    explicit on-hash or off-hash classification with its rationale recorded
    at the site, per the index ground rule binding any spec that reshapes
    sim state.
  - Gamepad database update policy under the vendoring rules.
  - How the human checkpoint is scripted so it stays cheap.
  - Should this row cite D55 for the input-remapping-UI exclusion its scope
    out already makes.

### S20 — Luau UI over ImGui: the mod-facing svsw.ui surface

- **Stage:** 3 — Platform completion + gate roster
- **Status:** pending
- **Goal:** Bind the mod-facing Luau UI API over ImGui (cimgui C ABI, platform
  tier only) with the internal prototype's off-hash gated-presentation
  discipline and containment guarantees; the authoring surface mods see follows
  the internal prototype's spirit with no bug-for-bug compatibility owed.
  Shipped-HUD theming and gamepad navigation stay named stage 6 work (S31).
- **Working software:** A Luau mod draws a HUD in a windowed run; the UI
  invariance test proves the surface is hash-neutral to the world hash;
  UI-path containment tests (a throwing UI callback disables the mod, the
  engine survives) green in `just check`; the scenario passes parity on world
  and skeleton hashes.
- **Depends on:** S14, S16
- **Decisions:** D9, D12, D33
- **Course:** module S20; path tag engine; teaches the `svsw.ui` surface
  against the Luau HUD scenario and its invariance tests; candidate for
  additional course-path tagging on its mod-facing surface lessons (path
  structure defined in the course repository).
- **Prototype ports:** the `svsw.ui` gated-presentation pattern and containment
  discipline (the surface re-authored over ImGui).
- **Normative references:** none
- **Scope in:** the `svsw.ui` binding set over ImGui; off-hash gating outside
  systems per the prototype invariance pattern; containment tests for UI
  callbacks; the headless behavior definition (UI calls no-op or record
  without a backend).
- **Scope out:** HUD theming plus gamepad navigation polish (S31, named stage
  6 work); editor UI bindings (S24).
- **Open questions:**
  - How the retained-style prototype Lua API maps onto Luau/ImGui's immediate
    mode without leaking frame lifecycle into mods.
  - What UI state, if any, is legal to persist and where.
  - Does the draw-list skeleton hash include ImGui draw data or is UI
    excluded from parity's skeleton tier.
  - Does `svsw.ui` route through the same D48 ImDrawData renderer S16
    establishes and S16b docks, or does it need its own capture seam, and
    should this row cite D48 alongside D9.
  - Does this spec inherit S16's question about what that renderer needs
    from the S03 RHI surface, scissor rects, texture binding and the sRGB
    posture, or restate it here.

### S16b — Editor walking skeleton: shell, one worker, viewport transport proof

- **Stage:** 3 — Platform completion + gate roster
- **Status:** pending
- **Goal:** The deliberate early-validation slice for the editor's
  load-bearing bets, pulled a stage ahead of the editor core the way
  M00 was pulled ahead of S00: worker supervision (D44), the D47 shared
  offscreen-target viewport, and protocol-mediated editing all meet
  reality here instead of at S22. A docked ImGui shell on
  the S16 lifecycle supervises one Session worker over the S05 envelope,
  shows a scene tree over the typed command stream, runs play, pause,
  step and naive replay scrubbing, and embeds the worker's shared
  offscreen target as its viewport. S22 grows this shell into the editor
  core rather than starting fresh.
- **Working software:** An editor-skeleton smoke gate green in `just
  check`: boot the shell headless, spawn a worker, replay a small
  committed command log, step N ticks, assert the world hash. On the dev
  machine the shell presents the D47 shared-surface viewport (human
  checkpoint).
- **Depends on:** S08, S16
- **Decisions:** D21, D44, D47, D49
- **Course:** module S16b; path tag engine; teaches the editor walking
  skeleton against its smoke gate.
- **Prototype ports:** none
- **Normative references:** `docs/design/editor/index.html`, normative
  for the dock layout the shell sketches; the full chrome stays with
  S22 through S24.
- **Scope in:** the docked shell on the S16 lifecycle; one-worker spawn,
  supervision and reconnect over the S05 envelope; the scene tree over
  typed commands; play, pause, step, and replay-from-start scrubbing;
  the D47 viewport transport proven on macOS and Linux; the smoke gate
  S22 later grows into `just editor-roundtrip-check`.
- **Scope out:** the inspector, undo/redo, and persistence (S22); every
  S23 feature; editor Luau (S24); multi-worker supervision (S22).
- **Open questions:**
  - How much shell code S16 and this spec deliberately share.
  - Whether the smoke gate exercises the D47 transport headless on CI or
    only skeleton-deep, with the transport itself a dev-machine
    checkpoint.
  - Does this spec cite D48 for the ImGui renderer it docks, or is that
    fully inherited from S16 with nothing new decided here.
  - Does scope name D49's editor and tooling message-kind range reservation
    as a day-one constraint, this being the first spec to put traffic on
    that range.

### S21 — Gate roster completion: the svsw equivalence obligation

- **Stage:** 3 — Platform completion + gate roster
- **Status:** pending
- **Goal:** The fresh-repo successor (D38) to the cutover checklist:
  enumerate the full gate roster as a numbered checklist artifact in the
  spec, mark each item hard-gate or report-only, and make every enumerated
  item present and green in one `just check` the acceptance wording. Roster
  candidates: determinism goldens (world plus per-chunk), skeleton goldens,
  readback goldens, boundary and tier scans including the C-tier scan,
  api-surface snapshots, the api-coverage threshold, stress budgets confirmed
  from provisional, scaffold-check, the script and mod gate family, the
  headless audio gate, the parity gate, the D50 binding-fuzz gate promoted
  from report-only to hard, the cross-backend comparison gate (Vulkan
  versus Metal, software versus hardware rasterizer; report-only, D48),
  the D3D12 axis once S03b lands (report-only, D48),
  and a report-only `win-check` world-hash item with a stated cadence: at
  every stage exit from stage 2 onward and before any golden re-record,
  the result recorded in the stage-exit note. Finish the verification tooling
  that lets agents drive the engine headless: golden record/check/frame-diff
  tooling and an svsw-sim-style MCP successor over the new tiers.
- **Working software:** `just check` is the one gate for the whole engine and
  runs green on both CI platforms with every enumerated roster item present;
  `just stress` budgets re-baselined from provisional to confirmed; the
  golden record/check/frame-diff tools operate over all four tiers with a
  roundtrip self-test green. One composite human checkpoint closes the
  stage: the split-process test scene runs headless and then windowed with
  sound and gamepad together at the dev window.
- **Depends on:** S09, S11b, S12b, S13, S15, S17, S18, S19, S20
- **Decisions:** D22, D14, D38, D48, D50
- **Course:** module S21; path tag engine; teaches the gate roster and the
  headless verification tooling against the completed `just check`.
- **Prototype ports:** the api-coverage gate; golden record and re-record
  workflows; the svsw-sim MCP server and the headless-verify and
  golden-hashes skill patterns, rebuilt for the new tiers.
- **Normative references:** none
- **Scope in:** the numbered roster checklist with hard-gate or report-only
  marks; roster audit and missing-item closure against that enumeration;
  confirmed stress budgets; record/check/frame-diff CLI tooling; the MCP
  server and project skills for headless verification of the new engine; the
  composite windowed checkpoint; adversarial review of the roster (the
  checklist review the roadmap mandates). The MCP-server successor to
  svsw-sim ships here (`docs/plans/claude-tooling-design.md`). The
  gate-roster count badge ships here, per `docs/plans/public-stats.md`.
- **Scope out:** editor tooling (stage 4); network gates (stage 5).
- **Open questions:**
  - The api-coverage threshold for the new repo (the internal prototype used 85
    percent).
  - Which roster items are hard gates versus report-only at this point.
  - MCP successor scope: which svsw-sim tools carry forward for 3D and which
    die with the 2D oracle.
  - Asset MCP servers (glTF/assetc, the D19 container) are deferred to
    S12a, their owning spec; the internal prototype's proven
    single-format-server pattern (svsw-ldtk, svsw-aseprite) is recorded here
    as a standing pattern to decide against once that spec exists.
  - Does this spec, closing stage 3, itself cut the D53 release tag the
    index ground rules require at a stage exit, or does the tag cut wait
    for S32's dry-run machinery, and should this row cite D53.
  - Does the roster enumerate the report-only `win-check` item as firing at
    this stage exit, the stated cadence being every stage exit from stage 2
    onward (D48).
  - Is D50's fuzz-gate promotion from report-only to hard recorded as a
    numbered roster item carrying its hard-gate mark rather than as prose.

## Stage 4 — Editor + animation

### S22 — Editor core: command stream, play-in-editor Session, scene tree

- **Stage:** 4 — Editor + animation
- **Status:** pending
- **Goal:** The editor as an editor-tier Odin binary living in `editor/`
  (D21, D43) that is the client and supervisor of N Session workers
  (D44): every edit is a
  typed command on a command stream, sent to the worker over the versioned
  protocol; undo/redo and persistence are command-log mechanisms;
  play-in-editor boots a real deterministic Session inside that worker, with
  live world-hash display, tick stepping, and replay scrubbing surfaced back to
  the editor; scene tree plus inspector as the first chrome; scene edits write
  data-stage content, no private formats. Amended per D36: the Session moves
  out of the editor process into the worker so the S22b dev loop can rebuild
  and respawn it without restarting the editor; a crash-only
  whole-editor-restart is an allowed first milestone of that loop, not a
  separate path. Design input: the M00 mockup (`docs/design/editor/index.html`)
  is the normative visual reference for this panel set and layout.
- **From M00:** the editor center is a tabbed document workspace (viewport
  is one document); Session lifecycle is run-target based; tick transport
  is bidirectional (step back = replay). The M00 feature map enumerates
  the menu-level surface.
- **From M00 (second review):** the editor embeds a first-class multi-language
  script IDE surface: a Files explorer, tabbed editors for Luau, Odin, and Go
  with breakpoints, and per-language reload semantics surfaced in the UI (Luau
  hot-reloads, Odin and Go rebuild). Note: the 2026-07 M00 touch renamed
  the artifact's badges, sample files, and menu labels to Luau (D33), so
  the mockup and this note agree.
- **Working software:** A first `just editor-roundtrip-check`: a committed
  edit-command log replays headless through the command stream, over the worker
  connection, into a data-stage scene; the scene plays N deterministic ticks
  and matches its world-hash golden; editor tier-scan rules green. The
  committed log includes a segment that interleaves scrubbing and edits,
  so the D57 truncate-and-resim semantics sit under the gate.
- **Depends on:** S08, S16, S16b, S21
- **Decisions:** D21, D22, D36, D43, D44, D47, D49, D57
- **Course:** module S22; path tag engine; teaches the editor command stream
  and play-in-editor against `just editor-roundtrip-check`.
- **Prototype ports:** the replay-codec discipline applied to the command log.
- **Normative references:** `docs/design/editor/index.html`, the M00
  mockup, normative for the panel set, the dock and collapse behaviour,
  and the chrome this spec builds. Prose here points at it rather than
  describing what it shows.
- **Scope in:** the typed command schema plus serialized command log, every
  entry tick-stamped (D57); undo/redo over the log, resimulating from the
  earliest affected tick (D57); play/pause/step with hash display, and
  replay scrubbing as the transport UI whose seek mechanism S22c owns
  (plain replay-from-start until S22c lands); scene tree and inspector
  panels; the Console panel and the worker-to-editor log message family
  inside the D49 editor kind range; the headless command-log replay
  driver for CI.
- **Scope out:** gizmos, asset browser, profiler (S23); editor Luau (S24);
  animation authoring (S25); the rebuild/respawn/restore dev loop (S22b).
- **Open questions:**
  - **How many Session workers the editor drives, and when.** D44 makes
    N the answer and D4's two-client co-op scene the reason, so this
    spec owns spawn, addressing and lifecycle for more than one.
  - **How the viewport composites.** D47 shares the worker's offscreen
    target with the editor. This spec decides input routing over the
    embedded surface (clicks land in the editor and travel as commands)
    and whether gizmos and selection highlights draw worker-side into
    the shared target or editor-side over it.
  - Where the presentation camera lives while the Session is paused or
    scrubbing: worker-side, driven by editor camera commands, is the
    D47-consistent default.
  - The render-while-paused contract: the viewport keeps presenting, the
    camera keeps flying, and debug draw keeps updating at zero sim
    ticks, which no render gate currently exercises.
  - **What an Extension may reach.** D43 puts Extensions in the editor
    build through D3's seam; this spec decides which editor surfaces
    that seam exposes, and the answer sets the compatibility surface
    every later editor spec inherits.
  - Command schema versioning, and whether the protocol envelope pattern is
    reused for the log format.
  - Whether protocol mismatch between editor and worker degrades on
    unknown data and refuses on unknown methods, or negotiates by
    capability flags. A user rebuilding a worker from modified engine
    source while the editor keeps running makes this reachable rather
    than theoretical.
  - Entity identity across undo/redo and replays (stable editor IDs versus
    ECS handles).
  - How much of the inspector is schema-generated from the mod component
    mirror.
  - Does the in-editor script IDE warrant its own spec (buffers,
    diagnostics, symbol navigation, LSP versus custom) split out of
    S22/S23?
  - Does this spec inherit the D48 ImDrawData renderer from S16 and S16b as
    decided, or do the scene tree, the inspector chrome and a
    multi-document workspace add new needs, and should this row cite D48.
  - Confirm S21's roster enumeration is settled before this map is charted,
    this spec depending on it.

### S22b — Engine dev loop: rebuild, respawn, restore

- **Stage:** 4 — Editor + animation
- **Status:** pending
- **Goal:** Close the loop an engine developer needs day to day: edit engine
  Odin code, rebuild via a `just` recipe the editor triggers, the worker
  respawns, its state restores, and the editor itself never exits. This is the
  missing spec the corpus implied between S02a, S08, S22, and S27b: rebuild
  orchestration, the editor-worker reconnect handshake, restore policy, and
  cross-build hash semantics, none of which any existing spec owns.
- **Working software:** A dev-loop smoke gate: a scripted
  edit-rebuild-respawn-restore run (touch a trivial engine source file, trigger
  the rebuild recipe, let the worker respawn and reconnect, restore state) ends
  green with the session's dev-diverged flag set and within-build hash checks
  (D22 parity, checkpoint agreement on the respawn) passing; the smoke gate
  runs once from a scaffolded `svsw new` project directory, proving the loop
  resolves outside the monorepo (D56).
- **Depends on:** S02a, S08, S22
- **Decisions:** D36, D56, D60 (D21, D22 as referenced by D36)
- **Course:** module S22b; path tag engine; teaches the rebuild-respawn-restore
  loop and the dev-diverged hash model against the dev-loop smoke gate.
- **Prototype ports:** the `engine/save` and `engine/replay` codec pieces
  already ported in S02a, reused here as the checkpoint and command-log-replay
  substrate; no new prototype surface.
- **Normative references:** none
- **Scope in:** rebuild orchestration (the `just` recipe the editor shells out
  to) and failure surfacing in the editor UI; the reconnect handshake, reusing
  the S05 envelope and version whitelist (frozen as v1 at S26) rather than a
  new protocol; in-Session script reload per D60 (the control-stage re-run,
  dev-diverged marking on any behavior-changing reload, schema-changing
  reloads through the same reject-and-replay path);
  restore policy per D36 (schema-hash match restores the last checkpoint, a
  mismatch falls back to full D21 command-log replay from session start, no
  migration functions run in this loop); dev-diverged session semantics per D36
  (within-build hash checks stay hard failures, cross-build hash diffs render
  as first-divergent-tick/chunk forensics, never failures); the checkpoint
  machinery built here as `engine/checkpoint` over the ported S02a save and
  replay codecs (capture, cadence policy, a resim-forward driver), pulled
  forward for dev-loop use, with S27b named as the stage-5 durability owner
  that adopts and extends it.
- **Scope out:** Odin dylib hot swap inside one process (rejected as the
  primary mechanism; recorded as a possible later render-client-only follow-up,
  scoped to presentation code that never touches sim state, and gated behind
  its own D20-adjacent decision if ever proposed); golden re-recording (goldens
  are never touched by this loop); shipped-save schema migration (a later,
  separate concern once saves ship).
- **Open questions:**
  - Rebuild trigger UX in the editor: a manual button, a file-watch
    auto-trigger, or both, and how a failed build surfaces without wedging the
    editor.
  - Latency budget for protocol-mediated editor sim access now that
    play-in-editor talks to a worker instead of touching Session state
    in-process.
  - Whether the crash-only whole-editor-restart variant ships as the actual
    first milestone or the split-process version lands directly.
  - Bounding the schema-mismatch replay by session re-baselining: Save
    Scene collapses the command log into fresh data-stage content and
    declares a new session start, so replay-from-session-start replays a
    bounded suffix; automatic or manual, and surfaced how.
  - Do the rebuild trigger and D60's behavior-changing-script-reload
    trigger share one surfacing mechanism in the editor chrome, or are they
    two affordances.
  - Does the rebuild step itself run as a D44 Job worker, derived-state
    work being what D44 assigns to that kind, or stay outside the worker
    model entirely.

### S22c — Time-travel debugger core: snapshot ring, seek, inspection family

- **Stage:** 4 — Editor + animation
- **Status:** pending
- **Goal:** The vision's rewind machinery as one owned system instead of
  a phrase scattered across four specs: the snapshot ring inside the
  Session worker (cadence, memory budget, eviction), seek-to-tick as
  nearest-snapshot restore plus resimulation under a stated seek-cost
  budget, the pause and resume contract against the D1 accumulator
  (accumulator frozen, input-capture policy, presentation behavior while
  paused), per-system stepping between Session.step's system boundaries
  with mid-tick inspection semantics stated (uncommitted command
  buffers, no hash claims between systems), and the inspection message
  family in the D49 range: entity and component reads schema-generated
  from the mod component mirror, per-chunk hashes, RNG stream state,
  watch subscriptions, and a two-tick state diff, under a
  query-not-full-world bandwidth posture. S22's transport UI wires to
  these verbs; this spec makes them real.
- **Working software:** A scripted scrub gate green in `just check`: run
  N ticks, scrub to several earlier ticks, resim forward, and assert
  every revisited world hash equals its recorded value with seek cost
  inside the stated budget; inspection reads over the protocol against a
  known scene match committed goldens.
- **Depends on:** S22, S22b, S02a, S08
- **Decisions:** D1, D21, D47, D49, D57
- **Course:** module S22c; path tag engine; teaches the snapshot ring,
  seek, and the inspection family against the scrub gate.
- **Prototype ports:** none; consumes the S22b `engine/checkpoint`
  substrate and the per-system boundary hook S02a lands, which arrives
  observation-only and hash-neutral with its semantics left to this spec.
- **Normative references:** `docs/design/editor/index.html`, normative
  for the Sim debugger tab, the timeline scrubber, and the chunk-overlay
  hash chips this spec's data feeds serve.
- **Scope in:** the snapshot ring with cadence, budget and eviction
  policy; seek-to-tick; the pause and resume contract; per-system
  stepping and its mid-tick inspection semantics; the inspection schema
  and watch subscriptions; the debugger-panel and timeline data feeds;
  the debug-suspended protocol events (D47).
- **Scope out:** script breakpoints and native debugging (S24b); server
  attach (S29b); the transport UI chrome itself (S22 ships it).
- **Open questions:**
  - Snapshot cadence and ring-budget defaults, and how they compose with
    the S22b checkpoint cadence over one substrate; the grilling carries
    candidate ranges anchored to S09's stress-scene scale so the numbers
    are answerable rather than unbounded.
  - The seek-cost budget number and the scene scale it assumes, anchored to
    the same S09 scale.
  - Watch-subscription delivery cadence while paused and while
    scrubbing.
  - Is entering D47's debug-suspended condition during a seek or scrub in
    scope here, or reserved for S24b's breakpoint gate, S24b being the only
    spec currently named as consuming that third worker condition.
  - Are the mod component mirror's mechanics fully inherited from S14 and
    D12 with nothing new decided here, or should this row cite D12.

### S22d — Extension seam proof: sample Extension, editor-build recipe

- **Stage:** 4 — Editor + animation
- **Status:** pending
- **Goal:** D43's static Extension seam proven from outside `editor/`:
  a sample Extension at `samples/extensions/hello_panel`, native Odin
  registering an editor panel and a command through the D3-style seam,
  compiled into an editor build by a named recipe (`just editor-build`),
  with the compatibility posture recorded: the seam joins the S21
  api-surface snapshots, and no stability is promised before S32. D43's
  claim that starting static proves the seam before a loader depends on
  it gets its scheduled proof here.
- **Working software:** A gate builds the editor with and without the
  sample Extension and asserts registration (the panel and command
  appear), tier-scan compliance, and identical Session behavior across
  both builds, since a Session never loads an Extension (D43).
- **Depends on:** S22
- **Decisions:** D3, D43
- **Course:** module S22d; path tag engine; teaches the Extension seam
  against the with/without-Extension gate.
- **Prototype ports:** the D3 registrar pattern, instantiated at the
  editor seam.
- **Normative references:** none
- **Scope in:** the sample Extension; the `just editor-build` recipe and
  the Extension-source project layout it reads; the with/without gate;
  the seam's api-surface snapshot entry; SECURITY.md's trusted-code
  wording verified against D43.
- **Scope out:** dynamic loading, a later spec whose first requirement
  is D43's layout-CRC refusal gate; third-party distribution, which
  needs its own decision per D43.
- **Open questions:**
  - Where Extension sources live relative to a game project versus the
    engine checkout (D56's metadata may carry the answer).
  - Whether the editor-build recipe takes an arbitrary extension list or
    exactly the project's declared set.
  - Why the sample Extension is native rather than editor Luau over
    `svsw.editor.ui`, D58 defaulting to the fast path unless the sandbox or
    the determinism model forecloses it.
  - Does the sample Extension proof also exercise D56's pinned-engine
    checkout plus toolchain build path, this editor-build recipe being its
    second consumer after S17.
  - What exactly "identical Session behavior" compares, world hash,
    command-stream shape, panel registry, so D43's
    Session-never-loads-an-Extension boundary is falsifiable.
  - Should this row cite D56 and D58 alongside D3 and D43.

### S23 — Editor features: asset browser, gizmos, profiler panel

- **Stage:** 4 — Editor + animation
- **Status:** pending
- **Goal:** The remainder of the closed feature sequence: an asset browser
  with the assetc audio-bake extension (WAV/OGG into container sections);
  gizmos with picking via geometry-only inverse-VP rays against render-mesh
  AABBs; a profiler panel surfacing spall zones, frame timing, draw and
  instance counts, and Luau budget consumption. Anything beyond this sequence
  waits for the verification scene to demand it.
- **Working software:** The full `just editor-roundtrip-check` gate: a
  committed human-authored command log (meshes, lights, a static mesh tagged
  as the character slot, a chunk of representative terrain) replays headless to a
  hash-checked scene, and the produced scene passes parity on playback; a
  human authors that log in the real editor once (human checkpoint). The
  character slot holds a static placeholder here; S25 re-records the log with
  the real animated character.
- **Depends on:** S22, S12b, S18
- **Decisions:** D21, D9
- **Course:** module S23; path tag engine; teaches the asset browser,
  gizmos, and profiler against the committed roundtrip-log gate.
- **Prototype ports:** spall-zone plumbing surfaced as plain counters.
- **Normative references:** `docs/design/editor/index.html`, the M00
  mockup, normative for the asset browser, gizmo and profiler panel
  chrome and their placement in the layout.
- **Scope in:** the asset browser over container files; assetc audio bake
  (WAV/OGG sections); translate/rotate/scale gizmos emitting commands; ray
  picking against render AABBs (no physics dependency); the profiler panel.
- **Scope out:** terrain sculpting or authoring tools beyond placing
  data-stage content; any feature outside the closed sequence; the animated
  character (S25 re-records the log).
- **Open questions:**
  - Gizmo snapping and grid behavior needed for building-placement authoring
    in S30.
  - Audio section format and streaming posture in the container.
  - What the committed roundtrip log must contain to be a strong gate without
    being brittle to editor UI churn, and whether its format has to be
    authored for S25's later swap to the real animated character so that
    spec re-records the log rather than redesigning it.

### S24 — Editor-Luau capability tier

- **Stage:** 4 — Editor + animation
- **Status:** pending
- **Goal:** The editor scripting host (D10): the same Luau VM architecture as
  the mod sandbox (whitelist construction, alloc cap, instruction budget,
  R1-R5, disable-in-place) instantiated with an expanded capability tier:
  project-scoped filesystem, asset writes via assetc invocation, editor UI
  bindings, command-stream emission. One embedding; containment machinery
  preserved verbatim; a capability tier rather than a security boundary
  (D43), reviewed at high tier and never re-sequenced into stage 6.
- **Working software:** Gate: an editor script reaches a running Session's
  sim state through the command stream and through nothing else;
  capability-scoping tests (project-FS confinement with symlink escapes
  denied, disable-in-place on a throwing script) green in `just check`. One
  sample script adds a panel and another adds a menu command through
  `svsw.editor.ui`; a freshly opened untrusted project executes no script
  code (D51).
- **Depends on:** S22, S14
- **Decisions:** D10, D33, D34, D43, D51
- **Course:** module S24; path tag engine; teaches the editor-Luau capability
  tier against the hostile-script containment gate.
- **Prototype ports:** the mod-sandbox VM machinery instantiated at a second
  capability tier.
- **Normative references:** `docs/design/editor/index.html`, the M00
  mockup, normative for any editor surface this spec adds; the
  capability tier itself has no visual reference.
- **Scope in:** the capability tier as a whitelist diff against the mod
  sandbox; the project-scoped FS surface; the assetc invocation binding;
  the editor-script UI contract: scripts register panels, menu items,
  toolbar commands, and inspector sections through a declared
  `svsw.editor.ui` surface, the M00 dock slots naming where script panels
  may land, with the chrome that stays Odin-only stated; per-project consent
  per D51, scripts disabled on first open with enablement recorded outside
  the project directory; `.d.luau` emission for every editor-tier binding
  through the S14 generator, the drift gate extended to this surface
  (D34); the command-stream emission binding; the
  capability-scoping test suite; `--!strict` gate-enforced on every editor
  script, the same
  first-party typing policy S14 applies to base-as-mod and samples (D34);
  the per-project consent and project-identity paths joining the S14 fuzz
  gate (D50) with their own hostile corpus, spoofed and malformed consent
  records, identity path traversal, symlinked projects and check-to-enable
  races, report-only until this spec's gate hardens.
- **Scope out:** any editor-Luau access path that bypasses the command
  stream; shipped-build exposure of editor capabilities.
- **Open questions:**
  - Exact whitelist diff contents and the review artifact that fixes it.
  - Project-scoped FS semantics (root definition, symlink policy, write
    atomicity).
  - How editor scripts are discovered and loaded (a per-project scripts
    directory, a manifest).
  - Lifecycle of script-registered UI when its script is disabled in
    place: torn down, tombstoned, or restored on re-enable; and if the
    playhead rewinds past a script's registration point, does that
    tombstone-and-restore logic key off D57's tick-stamped command log, or
    is UI registration state kept outside that log.
  - Does an editor-script reload need D60's dev-diverged marking, or are
    editor scripts outside D60 entirely, acting only through the command
    stream and never on sim state.
  - Is this surface meant to absorb future native-panel requests of S22d's
    shape, D58 defaulting to Luau or the data stage, and should this row
    cite D58 and D60.

### S24b — Script and native debugging: Luau breakpoints, DAP attach

- **Stage:** 4 — Editor + animation
- **Status:** pending
- **Goal:** The debugger's language half, the owner the M00 mockup's
  breakpoint gutters were missing: Luau breakpoints, single-step, call
  stack and locals built on Luau's own break and interrupt debugging
  API at both capability tiers, with the S14 instruction budget and the
  D50 watchdog debug-aware, suspended while a VM sits at a breakpoint
  and the worker holds the D47 debug-suspended condition; the whole
  surface compiled only into editor-tier builds through D43's
  absent-call-site rule, so a shipped game carries no debug hooks; and
  Odin and Go native debugging as a DAP client attaching from the
  editor to worker and gateway processes.
- **Working software:** A breakpoint gate green in `just check`: a Luau
  breakpoint in a mod suspends the tick mid-system, locals and the call
  stack read over the S22c inspection family, and continue resumes to a
  world hash identical to an uninterrupted run of the same inputs; a
  budget-enforcement test proves the watchdog re-arms after continue. A
  DAP attach to a live worker on the dev machine is a human checkpoint.
- **Depends on:** S22c, S14, S24
- **Decisions:** D43, D47, D50; D10's two capability tiers.
- **Course:** module S24b; path tag engine; teaches script debugging and
  the DAP attach against the breakpoint gate.
- **Prototype ports:** none
- **Normative references:** `docs/design/editor/index.html`, normative
  for the Script debugger tab, the breakpoint gutters, and the
  call-stack-to-document flow.
- **Scope in:** Luau breakpoint, single-step, call stack, and locals via
  Luau's interrupt API; debug-aware budget and watchdog; editor-tier-only
  compilation of every debug hook; the debug verbs inside the D49 range;
  the DAP client for Odin and Go processes.
- **Scope out:** shipped-build debugging of any kind; remote attach
  beyond S29b's trusted-network story; the profiler (S23 owns the
  panel).
- **Open questions:**
  - What single-step means when a Luau call crosses into a native
    binding and back.
  - DAP adapter choice per language, and how the editor surfaces a mixed
    Luau-and-Odin stack.
  - Whether a breakpoint in one worker of a multi-worker session pauses
    its siblings.
  - Can the playhead be rewound while a VM sits suspended at a breakpoint,
    and if so must resim reproduce the same breakpoint hit or skip past it
    under D57's truncate-and-resim mechanics, and should this row cite D57.
  - Is D43's absent-call-site rule, written for Extension registration,
    actually the mechanism gating debug-hook compilation into editor-tier
    builds, or is that a build tag.

### S25 — Animation runtime: sampler, blend, GPU skinning, container sections

- **Stage:** 4 — Editor + animation
- **Status:** pending
- **Goal:** Presentation-only animation per the locked contract (D11): a pose
  sampler over keyframe curves, linear blend (uniform plus per-bone mask),
  GPU skinning in render3d; skeleton and animation sections land in assetc;
  poses never enter `hash_world`; the deterministic per-joint-keypoint
  upgrade path stays logged, not built. Proven golden-neutral by the standing
  invariance-test pattern.
- **Working software:** An animated-character scene passes: world-hash
  invariance (animation on versus off changes no sim hash), the readback
  golden with the skinned character, the skeleton hash covering the skinning
  pipeline permutation, and parity; assetc bakes skeleton and animation
  sections from glTF round-trip green. The S23 editor roundtrip log is
  re-recorded with the real animated character in place of the static
  placeholder and `just editor-roundtrip-check` stays green, so the
  command-stream-authors-animated-content path is exercised.
- **Depends on:** S07, S12b
- **Decisions:** D11; D8 (the skinned permutation).
- **Course:** module S25; path tag engine; teaches the animation runtime and
  GPU skinning against the invariance and skinning goldens.
- **Prototype ports:** none
- **Normative references:** none
- **Scope in:** the keyframe curve sampler; linear blend uniform plus
  per-bone mask; the GPU skinning path plus skinned pipeline permutations;
  container skeleton and animation sections in assetc; off-hash invariance
  tests; the S23 roundtrip-log re-record.
- **Scope out:** animation state machines (wait for private product
  requirements to demand them); deterministic pose-driven sim (logged
  upgrade path only); IK, root motion.
- **Open questions:**
  - The glTF animation feature floor for v1 (linear and step only, or cubic
    spline sampling too).
  - Bone-count and palette limits per the rendering interface's binding
    model.
  - How blend inputs are driven before state machines exist: if the answer
    is Luau-set parameters, that is D58's default fast path and this row
    names it as such, the `svsw.*` surface being the natural binding site.

## Stage 5 — Multiplayer

### S26 — Walking skeleton: Go supervisor, worker contract, envelope freeze

- **Stage:** 5 — Multiplayer
- **Status:** pending
- **Goal:** The Go side is born: a minimal Go supervisor drives the headless
  Odin worker through Worker_Open, Worker_Advance_One_Tick, and Worker_Close
  with idempotent-retry, gap-rejection, and epoch-fencing tests. On green,
  the envelope freezes at v1 (framing, checksums, negotiation, version
  whitelist) plus the three-call contract, and message-kind ranges are
  reserved for replication, for editor and tooling traffic (D49), and for
  future service extensions. One protocol
  schema in `protocol/` with conformance-tested Odin and Go codecs over a
  recorded frame corpus.
- **Working software:** `just proto-conformance` green from both the Odin and
  Go sides over the recorded corpus; the walking-skeleton supervision tests
  (retry, gap, epoch fence) green; the v1 envelope plus worker contract
  marked frozen in the repo.
- **Depends on:** S05, S21
- **Decisions:** D15, D47, D49
- **Course:** module S26; path tag engine; teaches the Go supervisor and the
  worker contract against `just proto-conformance`; source material for the
  post-engine multiplayer modules.
- **Prototype ports:** none
- **Normative references:** none
- **Scope in:** a Go module (path under github.com/svswengine, D26) with the
  supervisor;
  the worker three-call implementation on the Odin Session; Odin and Go
  codecs from one schema source; the recorded conformance corpus in CI;
  message-kind range reservations including the D49 editor and tooling
  range; the statement that the frozen three-call contract is the
  supervisor-facing subset of the worker's surface, the editor-facing
  verbs (pause, seek, inspect, debug; S22c) living in the editor range
  outside the freeze; a supervision-test leg proving a debug-suspended
  worker (D47) is never blamed as wedged; on freeze, every protocol
  consumer's gate present at that point re-runs, `just
  editor-roundtrip-check` included once S22 is implemented.
- **Scope out:** QUIC and the gateway proper (S27a); replication kinds (S28);
  sessions and further service layers (S27a).
- **Open questions:**
  - Codec generation approach: generated from a schema DSL or hand-written
    pairs audited against the corpus.
  - Corpus format and where recorded frames live in the repo.
  - Go toolchain and CI wiring in a justfile-driven repo.
  - Which consumer gates count as "present at that point" when the v1
    envelope freezes, that set moving with implementation order across five
    stages, and what re-runs them.

### S27a — Go gateway v1: QUIC, sessions, worker supervision

- **Stage:** 5 — Multiplayer
- **Status:** pending
- **Goal:** Go owns the online tier (D6, D18): the gateway on QUIC (quic-go)
  with TLS 1.3, reliable streams for session and state traffic and unreliable
  datagrams for per-tick intents and deltas; session token issuance and
  validation; worker supervision (spawn, watchdog, epoch CAS) over loopback
  TCP with the v1 protocol. Reserved message-kind ranges stay protocol-level
  stubs. Go never implements ECS, gameplay, or hashing.
- **Working software:** Gateway smoke test green: a headless client connects
  over QUIC on localhost, authenticates, and its intents flow to a supervised
  worker.
- **Depends on:** S26
- **Decisions:** D6, D18, D15, D52; D26 (Go module path under
  github.com/svswengine).
- **Course:** module S27a; path tag engine; teaches the QUIC gateway,
  sessions, and worker supervision against the gateway smoke test; source
  material for the post-engine multiplayer modules.
- **Prototype ports:** none
- **Normative references:** none
- **Scope in:** the QUIC listener with streams plus datagrams; session token
  issue and validate, a minimal session store; worker lifecycle (spawn,
  watchdog, epoch CAS); the loopback TCP gateway-worker leg.
- **Scope out:** durability (Tick_Commit log, checkpoints, outbox: S27b);
  implementations behind the reserved message-kind ranges;
  session-hardening follow-on (may re-sequence per the roadmap);
  matchmaking.
- **Open questions:**
  - Dev and CI TLS certificate story for QUIC.
  - Where the D52 minimal session store lives (in-memory or a file) and
    the token lifetime it enforces.
  - Datagram versus stream assignment per message kind at this stage.

### S27b — Go durability v1: Tick_Commit log, checkpoints, outbox

- **Stage:** 5 — Multiplayer
- **Status:** pending
- **Goal:** The durability half of the online tier: the durable Tick_Commit
  log, opaque checkpoint storage, and an idempotent outbox, wired into the
  S27a worker lifecycle so a killed worker resumes without hash divergence.
- **Working software:** Durability smoke green: a killed worker respawns and
  resumes from the Tick_Commit log with no hash divergence, observed by a
  connected headless client across the kill; one leg kills the worker
  mid-outbox-delivery and asserts exactly-once observable delivery of a
  pending notification after respawn.
- **Depends on:** S27a, S22b
- **Decisions:** D6, D18, D15
- **Course:** module S27b; path tag engine; teaches durability (Tick_Commit
  log, checkpoints, outbox) against the kill/respawn/resume run; source
  material for the post-engine multiplayer modules.
- **Prototype ports:** none
- **Normative references:** none
- **Scope in:** the durable Tick_Commit log; the opaque checkpoint store,
  adopting and extending the S22b `engine/checkpoint` machinery; the
  idempotent outbox, given an engine-era consumer here: the desync-tripwire
  event and session lifecycle notifications deliver through it; resume
  wiring into worker supervision.
- **Scope out:** replication kinds (S28); multi-machine topology (S29).
- **Open questions:**
  - Tick_Commit log storage engine v1 (flat append log versus an embedded
    store), which turns on whether the durable log is D57's tick-stamped
    total order persisted or a separate parallel record, and on whether
    this row cites D57.
  - Checkpoint cadence and retention policy.
  - Outbox delivery semantics the reserved service kinds will assume.
  - Confirm the kill, respawn and resume gate is not read as a
    supported-deployment posture, D52 scoping the online tier to
    trusted-network use and D53 making release binaries verification
    artifacts rather than supported downloads.
  - Whether durability v1 needs a versioned reader for saves and command
    logs: S02a's ported codecs hard-reject on a version mismatch per D53
    and name this spec the only reopen point for that question.

### S28 — Replication: chunk-scoped deltas, prediction, reconciliation

- **Stage:** 5 — Multiplayer
- **Status:** pending
- **Goal:** Server-authoritative replication decided by the topology (D6):
  state deltas over chunk-scoped interest (a client subscribes to chunks near
  its position and camera), client-side prediction for the local player's
  tick-quantized intents with resim-from-checkpoint reconciliation, and
  per-chunk hash checkpoints as the loud desync tripwire. Replication message
  kinds develop inside their reserved range; the ported save/replay codec is
  the checkpoint format over the wire framing, and the replay harness becomes
  the desync forensics tool. The clients connect through the real S27a
  gateway on localhost; the fault-injection rig wraps that path.
- **Working software:** A replication test on localhost through the gateway
  with injected latency, loss, and reordering: two headless clients hold
  interest sets, receive deltas, predict and reconcile, and client-visible
  state matches the server's chunk-hash checkpoints across the run; desync
  injection trips the tripwire loudly.
- **Depends on:** S27a, S11a, S22b
- **Decisions:** D6, D5, D15, D50, D57
- **Course:** module S28; path tag engine; teaches replication, prediction,
  and reconciliation against the fault-injected two-client run; source
  material for the post-engine multiplayer modules.
- **Prototype ports:** the `engine/save` snapshot codec as the checkpoint
  format; the `engine/replay` harness as desync forensics.
- **Normative references:** none
- **Scope in:** interest subscription by chunk, filtering replication only
  and never driving sim-side activation: any activation the server performs
  on a client's behalf enters the Session as a Canonical_Input_Set member
  recorded in Tick_Commit, which closes S11a's activation-policy question
  under that invariant; delta encoding and application; prediction and
  reconciliation via checkpoint resim over the S22b `engine/checkpoint`
  substrate; chunk-hash checkpoint messages; the fault-injection test rig
  wrapping the gateway path, its injected latency, loss and reorder
  schedules seeded and reproducible, which rules out netem/toxiproxy-style
  system tools in favor of a protocol-level shim.
- **Scope out:** real-network multi-machine runs (S29); the windowed parity
  leg (S29); the reserved message kinds.
- **Open questions:**
  - Delta encoding granularity: per-component field deltas or per-entity
    snapshots diffed.
  - Interest radius policy and hysteresis at chunk boundaries.
  - Reconciliation depth: how many ticks of resim the client budgets and what
    happens past it.
  - Which entities are predicted beyond the local player.
  - Deactivation hysteresis when the last interested client departs, as a
    tick-recorded event.
  - Tripwire trip semantics: what a trip does to the session (kill,
    resync-from-checkpoint, or quarantine), and how mod-induced
    divergence is classified per the threat model (D50); and whether a trip
    must produce a Tick_Commit-log artifact matching the shape S29b's
    read-only attach-and-replay consumes.
  - Must reconciliation resim respect D57's truncation contract when a
    debugger session is attached mid-replication, that being S29b's attach
    path.
  - Is the checkpoint format, doubling as wire framing, release-scoped
    under D53's save and log versioning language, with S33's save reader
    later versioning that same format.

### S29 — Two-client co-op harness: mods/nettest and coop-smoke

- **Stage:** 5 — Multiplayer
- **Status:** pending
- **Goal:** The stage 5 exit: `mods/nettest` (a bare chunk-mutation component
  plus movement intents, nothing else) as stage-owned test content, and `just
  coop-smoke`: gateway plus headless authoritative sim plus two headless
  clients mutating adjacent chunks over a real network (network namespaces
  on one CI runner; a two-machine run at the dev desk is a human
  checkpoint), server chunk hashes matching goldens, kill-and-respawn worker
  resume, injected latency, loss, and reordering, and one leg swapping a
  headless client for a windowed client asserting the same server chunk
  hashes and client skeleton hashes (D22 across the network path).
  Replication message kinds freeze at this gate.
- **Working software:** `just coop-smoke` green against `mods/nettest`
  including the fault-injection and windowed-parity legs; `just
  proto-conformance` green from both sides; replication kinds frozen.
- **Depends on:** S27b, S28, S15
- **Decisions:** D6, D18, D22, D15
- **Course:** module S29; path tag engine; teaches the two-client co-op
  harness against `just coop-smoke`; source material for the post-engine
  multiplayer modules.
- **Prototype ports:** none
- **Normative references:** none
- **Scope in:** `mods/nettest` content; coop-smoke orchestration (network
  namespaces on one hosted runner; the two-machine run is a dev-desk human
  checkpoint); the kill/respawn resume assertion over the Tick_Commit
  log; the windowed parity leg; the replication-kind freeze artifact.
- **Scope out:** the gameplay ruleset (stage 6 owns it); contested-interaction
  scenarios.
- **Open questions:**
  - How the windowed leg runs in CI (virtual display reuse from S04), and
    whether its platform set excludes Windows, D48 permitting compile-gated
    Windows only until S03b lands.
  - Is freezing the replication message kinds here compatible with S28's
    reconciliation-depth and tripwire-semantics answers, an incomplete kind
    roster being what gets frozen otherwise.
  - How much Tick_Commit history the coop-smoke run retains, this spec
    producing the log S29b's retention question consumes.

### S29b — Server attach and desync replay

- **Stage:** 5 — Multiplayer
- **Status:** pending
- **Goal:** The debugger meets the server. D44's one-binary rule means a
  gateway-supervised Session worker is the same program the editor
  debugs locally, and S27b's Tick_Commit log is a durable timeline, so
  the editor attaches read-only to a live or finished server session,
  drives the S22c seek machinery over that log, and reproduces a
  reported desync locally in one step by resimulating from checkpoint
  plus logged inputs. S28's replay-as-forensics gets its workflow and
  its surface.
- **Working software:** An attach-and-replay gate green in `just check`:
  a coop-smoke run records its Tick_Commit log; a headless editor driver
  attaches read-only, scrubs the server timeline, and reproduces the
  run's chunk hashes locally from checkpoint plus inputs; an injected
  desync is reproduced to its first divergent tick through the
  `svsw_explain` forensics path.
- **Depends on:** S29, S22c
- **Decisions:** D44, D47, D49, D57; D6's authority model unchanged.
- **Course:** module S29b; path tag engine; teaches server attach and
  desync replay against the attach-and-replay gate; source material for
  the post-engine multiplayer modules.
- **Prototype ports:** none; the S02a replay harness is already the
  forensics substrate.
- **Normative references:** none
- **Scope in:** read-only attach and the gateway's mediation of it;
  log-backed seek over a server session; one-step local reproduction;
  first-divergent-tick surfacing through `svsw_explain`.
- **Scope out:** write access of any kind to server sessions;
  internet-facing hardening of the attach path (D52's posture holds).
- **Open questions:**
  - Attach mediation: through the gateway, or direct to the worker on
    the trusted network.
  - Retention: how much Tick_Commit history a server keeps for attach,
    against S27b's cadence and retention question.
  - Confirm read-only attach forbids edits entirely, which makes D57's
    truncation clause moot here, this row's scope out already barring write
    access of any kind to server sessions.
  - Is a D47 debug-suspended Session worker a valid attach target, or only
    a live or a finished one.

## Stage 6 — Engine-completion verification + rebrand

### S30 — Verification scene: a representative gameplay ruleset as base-as-mod plus second mod

- **Stage:** 6 — Engine-completion verification + rebrand
- **Status:** pending
- **Goal:** A representative gameplay ruleset in Luau on the ported mod
  machinery, scoped by private product requirements and exercising sim,
  mods, rendering, and persistence as one engine verification artifact:
  grid-based placement and collision v1, entity interaction and state
  changes, and a simple scripted encounter; all sim-side, all hashed,
  authored as `mods/base` across a few hand-authored editor-authored chunks
  (D17); plus the trivial drop-in second mod that patches base data and adds
  one system, the full mirroring acceptance test.
- **Working software:** `just scene-accept` green (S32's `engine-accept`
  composes this recipe later): the verification scene runs N ticks headless
  on both platforms asserting per-chunk and root goldens; the second mod,
  dropped in, changes gameplay and the world hash; the scene passes
  parity-check.
- **Depends on:** S23, S15, S13, S11a
- **Decisions:** D4, D17, D12, D55
- **Course:** module S30; path tag engine; teaches the base-as-mod
  verification ruleset and the second mod against `just scene-accept`.
- **Prototype ports:** none
- **Normative references:** none
- **Scope in:** `mods/base` ruleset systems and data; hand-authored chunk
  scenes via the editor (committed command logs plus data-stage content); the
  second mod; scene goldens across the tiers; the `scene-accept` recipe.
- **Scope out:** the camera continuum and presentation polish (S31); the
  co-op re-run and acceptance ceremony (S32); service-layer and
  contested-interaction systems.
- **Open questions:**
  - How many chunks and what mechanic density makes the scene a sufficient
    engine exercise.
  - The ruleset's minimal bar for scripted encounters (a scripted wave, a
    single hostile).
  - Whether verification content development feeds gap-fix work back through
    the normal spec process or lands within this spec.
  - Where encounter movement lives: mod-side Luau over `svsw.*` queries
    under the instruction budget (D55's default), or a small engine-side
    deterministic grid-search service if the private envelope demands it.
  - Whether the encounter needs minimal impact or feedback VFX, or the
    D55 deferral holds through engine completion.
  - Does the scripted encounter's mod-side movement span multiple ticks,
    S14's settled coroutine posture disabling a mod that resumes across a
    tick boundary.
  - Does D46's deterministic sim surface cover the calls the scripted
    encounter expects, and should this row cite D46, whose own text names
    this spec as its motivating consumer.
  - Confirm the grid placement and collision content stays inside collision
    v1's overlap and range envelope, dynamics-lite being settled out of the
    index at S13.
  - Confirm the second mod loads through existing dev-loop mechanics (D36)
    only and exercises no acquisition or distribution surface D55 defers.

### S31 — Camera continuum, first-person controller, client presentation polish

- **Stage:** 6 — Engine-completion verification + rebrand
- **Status:** pending
- **Goal:** Ship the top-down-to-first-person continuum (one
  camera, two rigs, designed in stage 1) with the first-person character
  controller on the deterministic capsule versus chunk terrain; animation on
  the scene's characters (poses off-hash, hitboxes are sim capsules);
  shipped-HUD theming and gamepad-navigation polish over the ImGui HUD, the
  named stage 6 UI work.
- **Working software:** The verification scene with camera drop-in, animated
  characters, and a themed HUD passes parity-check and its readback goldens;
  controller determinism goldens (recorded input runs reproduce world hashes)
  green on both platforms.
- **Depends on:** S30, S25, S20, S13, S19
- **Decisions:** D4, D11, D9
- **Course:** module S31; path tag engine; teaches the camera continuum, the
  first-person controller, and HUD theming against the polished verification
  scene.
- **Prototype ports:** none
- **Normative references:** none
- **Scope in:** rig transition implementation and tuning; the first-person
  controller on collision v1; character animation hookup in the scene; HUD
  theming plus gamepad navigation.
- **Scope out:** new camera features beyond the two rigs; animation state
  machines.
- **Open questions:**
  - Rig transition behavior mid-zoom (continuous blend or staged snap) and
    its input-mode handoff.
  - Controller tuning parameters that stay deterministic (view bobbing
    excluded or off-hash?).
  - HUD theming scope: how far ImGui-based theming can go before it needs
    the retained-mode toolkit D55 defers post-engine, that decision fixing
    the immediate-mode substrate as the shipped-HUD answer for the engine
    era.

### S33 — Player save/load v1: versioned reader, autosave

- **Stage:** 6 — Engine-completion verification + rebrand
- **Status:** pending
- **Goal:** The shipped-save owner D55 assigns and D36's amendment
  trail points at: a player-facing save of a running world to a file,
  a load into a fresh process, autosave hooks, and the versioned
  snapshot reader D36 deferred, with the compatibility promise D53
  defines (saves are release-scoped until this reader lands, versioned
  from it on). Dev checkpoints and replays already exist; this spec is
  what makes a player's world survive the engine that made it.
- **Working software:** A save/load gate green on both CI platforms:
  save at tick T, load in a fresh process, resimulate N ticks, and the
  world hash equals the uninterrupted run's golden; `just engine-accept`
  (S32) gains the save/load leg.
- **Depends on:** S17, S13, S30
- **Decisions:** D53, D55; D36 as amended.
- **Course:** module S33; path tag engine; teaches player save/load and
  the versioned reader against the save/load gate.
- **Prototype ports:** the `engine/save` codecs already ported in S02a,
  extended with the versioned reader.
- **Normative references:** none
- **Scope in:** the save and load surface at CLI and `svsw.*` level;
  autosave hooks; the versioned snapshot reader; the S32 engine-accept
  leg.
- **Scope out:** cloud or synced saves; migration beyond the versioned
  reader's window; save-compatibility matrices across mod sets.
- **Open questions:**
  - Save location conventions per platform, and what a save carries
    beyond the snapshot (mod list, engine release, command-log tail); a
    recorded engine-release identifier references a git tag in D53's
    narrower sense, its binaries being verification artifacts and
    reproducibility witnesses rather than supported downloads.
  - Autosave cadence and its composition with the S22b checkpoint
    cadence on one substrate.
  - How a load with missing or version-shifted mods degrades: refuse,
    load-with-disabled, or prompt; and confirmation that this spec handles
    the local mod-list mismatch only, deferring acquisition- or
    provenance-driven remediation such as fetching a missing mod to the
    post-engine work D55 names.

### S32 — Engine acceptance + residual sweep

- **Stage:** 6 — Engine-completion verification + rebrand
- **Status:** pending
- **Goal:** Engine completion, then the residual sweep (D16 as amended by
  D26): `just engine-accept`
  composes `just scene-accept` (the verification scene headless N ticks on
  both platforms against per-chunk and root goldens), parity-check green on
  the scene, the coop-smoke harness re-run against the verification scene,
  and the second-mod hash change; a human plays the scene end-to-end with a
  second player at the dev window (maintainer sign-off). Then the residual
  sweep: the D23 trademark carve-out, docs and course reference sweeps,
  retiring the working-name hedges. The container is untouched
  (brand-neutral since S12a).
- **Working software:** `just engine-accept` green on both platforms
  including the coop leg and the S33 save/load leg; scaffold-check green;
  the human checkpoint signed off. This gate is engine completion.
- **Depends on:** S29, S30, S31, S33, S17
- **Decisions:** D16 as amended, D4, D22, D38 (beads and the decision log
  continue across the rebrand), D53.
- **Course:** module S32; path tag engine; teaches engine acceptance and the
  residual sweep against `just engine-accept`.
- **Prototype ports:** none
- **Normative references:** none
- **Scope in:** the engine-accept recipe composition over scene-accept; the
  coop harness re-run against the scene; the human checkpoint protocol; the
  residual sweep and its checklist; the D53 release dry-run (cut a tag,
  build the artifacts, scaffold a project against the tag); the
  post-engine roadmap revision
  kickoff note.
- **Scope out:** the reserved message-kind implementations; seeded
  procedural world generation.
- **Open questions:**
  - Residual sweep ordering: before or after the acceptance run is declared
    (the roadmap allows the sweep to trail the acceptance but not the
    milestone declaration).
  - Whether the beads prefix question from S00 resurfaces here or stays
    settled.
  - Does the D53 release dry-run's success criterion change now that its
    binaries are declared verification artifacts rather than supported
    downloads, and does it gain a reproducibility-witness check such as a
    rebuild-from-tag hash match.
  - What happens to the engine-accept schedule if S30's open questions are
    still unresolved when S31 and S33 are otherwise ready to grill, both
    depending on S30.
