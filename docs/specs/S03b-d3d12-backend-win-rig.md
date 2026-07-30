# S03b — D3D12 backend: the third RHI implementation on the win rig

Normative text for S03b. The [spec index](README.md) records this spec's
rung and nothing else duplicates it (D37).

- **Stage:** 1 — Renderer, Forward+ staged
- **Status:** spec written
- **Depends on:** S04
- **Decisions:** [D42](../decisions/D042-in-house-rhi-slang.md),
  [D48](../decisions/D048-backend-sequencing-imgui-renderer.md). One more
  binds clauses of this spec without appearing in the row: D53, whose
  stage-exit boundaries and S21 api-surface snapshots are the units the
  drift budget and the scheduling window below are stated in.
- **Normative references:** none

## Goal

Give the D3D12 package a body.
[S03](S03-window-rhi-draw-list.md) landed it as a seam-complete stub:
every type, every entry point and every signature the Vulkan and Metal
packages implement, declared with its real signature and a typed
unimplemented body, compiled by MSVC on the compile-only Windows leg and
executed nowhere. This spec fills those bodies in and drives them on the
local Windows rig, report-only, because no hosted runner carries a D3D12
GPU.

That is the whole of the delta. Almost everything a D3D12 backend needs
decided was decided at S03, against all three APIs' constraints, which is
what D42 and D48 required of that spec. This document decides the four
things S03 could not: how a rig run is recorded, how long the interface
may drift before the third implementation gets expensive, what the rig's
readback tolerance is derived from, and when this floating spec gets
scheduled.

The third backend is not optional work. D42's case rests on one seam
absorbing three real backends' models rather than generalizing from two,
and until a third implementation runs, that claim is argued rather than
demonstrated. Report-only says where this backend is validated. It says
nothing about whether it ships.

## Working software

`just win-check` runs the cube and the multi-object scenarios on D3D12 on
the local Windows rig, headless, and `just win-report` emits one
structured report for the run. A green report shows, per scenario, the
world hash and the skeleton hash matching the committed
platform-invariant goldens and the readback tier scoring under the rig's
derived threshold against the single lavapipe-recorded golden. It names
the commit it was built from, the adapter and driver it ran on, and the
golden-set version it scored against.

Green here means the third backend behaves on the one machine that can
run it. It is not a CI guarantee and no acceptance wording in this
repository may read it as one (D48).

## Decisions in force here

- **D42, the in-house RHI over three backends.** The reason a third
  implementation is committed rather than nice to have, and the reason
  this work is affordable rather than heroic: D42 names the binding layer
  it is written against, `vendor:directx/d3d12` at `IDevice10` and
  `IGraphicsCommandList7`, as already existing and maintained upstream.
- **D48, backend sequencing.** D3D12 enters as its own spec, insertable
  once S04's golden tiers exist, owning the third backend and its gate
  story: `just win-check` grows the skeleton and readback tiers on the
  rig, report-only, and S21's roster carries the D3D12 axis marked
  report-only. Vulkan stays the supported Windows path in the engine era,
  which fixes what a Windows user runs while the engine is being built
  and settles nothing about whether the third backend lands.
- **D53, releases and the compatibility surface.** Stage exits are the
  only boundaries a green gate already defends, and the S21 api-surface
  snapshots are the mechanism that makes an interface break visible
  rather than forbidden. Both are units this document measures in.

## Scope in

- Real bodies for every entry point the seam-complete stub declares:
  device and queue, adapter enumeration and selection, buffers and
  textures, pipelines from DXIL, the command-list shape, the offscreen
  color attachment and its depth buffer, and the draw-list walk into
  D3D12 calls.
- The descriptor-heap and barrier specifics the S03 interface shape
  reserved for this backend, including the mapping from a caller-declared
  transition onto D3D12's barriers and the debug validator behind it.
- The D3D12 swapchain, render-target view and present-pass code, on the
  format basis below.
- The viewport surface family's D3D12 bodies over the CPU readback
  transport, which is the one transport S03 implemented.
- Every reserved capability answering absent on a live D3D12 device and
  refusing at its entry points, as it already does on the other two.
- `just win-check` grown with the skeleton and readback tiers on D3D12,
  over the cube and multi-object scenarios.
- `just win-report`, its report schema, and where a report lands.
- The rig's own empirically derived readback threshold.

## Scope out

- **Everything S03 settled.** The seam's shape, the capability
  enumeration, the present-pass mechanism, the swapchain format policy,
  caller-declared transitions, the monomorphic parameter block, the
  adapter-selection policy and the transport family's shape are all
  normative on this spec and none is reopened here. S03b implements
  against them. A defect in one of them is S03's row, not this one.
- **S04's golden tiers.** The skeleton hash's definition, the readback
  golden's structure, the parity runner, the perceptual metric and its
  derivation recipe are S04's own Scope in. This spec runs those tiers on
  a third backend and defines none of them.
- **The CI legs.** S01's compile-only Windows job, where it attaches,
  what it compiles, and how DXIL rides the `windows-latest` job's SDK
  `dxc` are settled and untouched here. The two are decoupled by
  construction: that leg executes nothing, and this spec's rig loop needs
  nothing from it, so neither its readiness nor its scope gates this
  work.
- **Hosted-runner anything.** No hosted runner carries a D3D12 GPU and
  S00's rules bar a self-hosted runner on a public repository, so this
  spec adds no CI leg, no `just check` item and no hosted obligation of
  any kind. That absence is structural rather than a scheduling choice.
- **Promotion out of report-only.** D48 fixes the D3D12 axis report-only
  on S21's roster, and S21 owns the roster's marks.
- **The NT shared-handle exporter and its courier**, which S03 left to
  S16b along with the other two backends' exporters.
- The cross-backend comparison gate, which is S21's roster (D48).
- D3D12-only features beyond the S03 interface, and display-side HDR
  output, which is post-engine work on D55's roster.

## The win-report protocol

Report-only is not the same as unrecorded. A rig run produces no CI
status, no golden and no failing build, so without a stated protocol its
outcome lives in one session's memory and a later reviewer has nothing to
cite. `just win-report` is that protocol.

**One recipe, one run, one report.** `just win-report` drives the
win-check tiers on the rig and emits exactly one structured report for
the run. It is the only artifact a rig run produces.

| Report field | Content |
|---|---|
| Commit | The hash the run was built from. |
| Adapter and driver | The identity the run header already names, per the adapter policy S03 fixed (#94). Nothing else about the machine. |
| Per-tier results | Per scenario and per tier: the world hash, the skeleton hash and its match against the committed golden, and the readback tier's metric value with the threshold it was scored against. Values, not verdicts alone. |
| Golden-set version | The version of the golden set the run scored against. |

**Where it posts.** Each report is a comment on this spec's tracking
ticket, the numbered breakdown `/to-tickets` opens. A report is a dated
observation of one machine rather than an artifact any gate reads, so it
belongs where dated observations belong rather than in the tree. The
tracker is a documentation surface (D37), so a report is written under
D31 like every other tracker write.

**What the exit cites.** The latest green report, by its comment. The
report-backed items on the exit checklist below are discharged by citing
one run rather than by re-running it, which is what makes a report-only
exit checkable by a reviewer who does not have the rig.

S21 has not settled whether its roster enumerates the report-only
win-check item as firing at each stage exit. That question is S21's own,
and this protocol stands whichever way it goes: S03b's half of the
recording obligation is discharged here regardless.

### What `just check` grows

Nothing. No recipe in this spec attaches to `just check`, no report
result breaks a build, and `just check` runs green on both CI platforms
with the rig unreachable. A red report opens a ticket. That is the whole
of what report-only means here, and it is meant literally.

## The interface-drift budget

S03's interface was designed against three APIs and implemented against
two, so every spec written against it between S03 and this one is written
against a shape D3D12 has never compiled, let alone run. Drift is policed
in two halves, and the halves cost very different amounts.

**Types drift continuously and are policed for free.** The seam-complete
stub compiles on the compile-only Windows leg on every merge, so a change
to the seam in `engine/render3d/gpu` that the D3D12 package cannot
express breaks the compile in the commit that makes it. This needs no
rig, no schedule and no budget, and it is the reason S03 required the
stub to be seam-complete rather than merely present.

**Behavior drifts silently and is bounded by checkpoints.** A full
win-report checkpoint runs at each stage exit that touched the renderer
family, recorded per the protocol above. The budget is therefore a bound
rather than a duration: behavioral drift is never older than one renderer
stage. The bound runs from the first landing onward, because a checkpoint
needs a backend to run; before then there is no behavioral signal at all,
and the seam-churn count under the scheduling window below stands in its
place.

The two halves catch different failures, which is why neither replaces
the other. A signature the D3D12 package cannot express is a compile
error. A signature it can express and cannot honour, a barrier model that
does not map cleanly, a descriptor assumption that does not hold, is not
an error anywhere until something runs. Both halves are report-only and
neither can fail a merge.

## The format basis

#92's D3D12 findings were resolved as research groundwork on S03's map
and explicitly left to the spec that writes the code. They are adopted
here as this spec's format basis rather than re-derived. Three rules, and
the first is an API constraint rather than a policy choice:

- **A flip-model swapchain cannot carry an `_SRGB` format.** The format
  is restricted to four values and no `_SRGB` variant is among them;
  requesting one fails at creation. The swapchain is created
  `DXGI_FORMAT_B8G8R8A8_UNORM`, with `DXGI_FORMAT_R8G8B8A8_UNORM` an
  equally valid fallback if the rig's swap chain enumerates only that.
  Either matches the choice S03 fixed for the other two backends, and the
  present shader is written against a generic render target and is
  insensitive to channel order.
- **The color space stays at its default,**
  `DXGI_COLOR_SPACE_RGB_FULL_G22_NONE_P709`, which is DXGI's tag for
  standard-range sRGB-encoded content. `SetColorSpace1` is not called.
- **No render-target-view casting.** The documented way to keep hardware
  sRGB semantics on a flip-model swapchain is to create the view with the
  sibling `_UNORM_SRGB` format so the output stage encodes on write. This
  backend does not use it. The present pass receives bytes that are
  already final, so the correct view is the plain `_UNORM` one with a
  straight passthrough write, and an `_UNORM_SRGB` view would encode them
  a second time.

The third rule is where the phrase "hand-coded gamma in the present
shader" belongs, and it needs saying carefully, because S03's format
policy states that the present pass performs no color math at all. Both
are true and they are about different things. The phrase fixes *where*
gamma handling lives on this backend, which is shader-side and never
view-side; S03 fixes *how much* of it happens at this rung, which is
none, because D54's resolve chain encodes upstream of the target the
present pass samples. A backend that leaned on view-side auto-conversion
would be correct on D3D12 alone and would break the rule that one Slang
source serves the present pass on every backend with no per-backend gamma
branch. No disposition states it in those words, and a maintainer
micro-ruling at landing (2026-07-31) blesses that reading as normative:
#105 fixes where gamma handling lives and S03 fixes how much of it
happens at this rung, so the two clauses are settled rather than merely
reconciled by this document.

## The readback tolerance

S04 owns the readback tier's metric, its scoring percentile, its
implementation pin and its derivation recipe. What belongs to S03b is the
number the rig produces and what that number is measured against.

**One golden, not two.** The lavapipe-recorded golden stays the single
reference and the rig records no golden of its own. A rig-recorded D3D12
golden would compare the third backend against itself, which is precisely
the comparison that cannot detect the failure this backend exists to
find: whether one interface produces one image through three unrelated
driver stacks.

**The threshold is per device and derived, not chosen.** The rig derives
its own FLIP threshold empirically, with the same metric and the same
recipe S04 fixes: measure against the golden across runs known to be
correct, observe the ceiling, score at the percentile S04 names rather
than at the mean, and set the number a fixed multiple above that ceiling.
The derived number travels in the win-report beside the metric value it
scored, so a report is self-describing and a later reader can tell a
threshold change from a behavior change.

**Derived once, then cited** (maintainer micro-ruling at landing,
2026-07-31). The derivation is a one-time calibration rather than a step
every run repeats. The number is derived when this spec first lands,
recorded in the first green report, and cited by every later run, which
scores against it and carries it forward in its own report. It is
re-derived only when the golden set changes, the metric version changes,
or the rig's hardware changes, and a re-derivation is visible as such
because the report it first appears in carries both the new number and
the golden-set version behind it. Nothing in the tree holds the number,
and nothing needs to: the reports are the chain, and each one names what
it scored against.

Deriving rather than inheriting is affordable for the same reason S03
could afford to fail loud on an unavailable swapchain format: the rig
gates nothing. A threshold set too tight costs one red report and no
build anywhere, so the rig can be measured honestly instead of hedged.

## The scheduling window

D48's "Vulkan is the supported Windows path in the engine era" does not
demote this spec. It fixes which backend a Windows user runs while the
engine is being built. The third implementation is what turns D42's
abstraction claim from an argument into a demonstration, so it is
committed work, and "floating" means unscheduled inside a named window
rather than optional.

The window:

- **Earliest, the stage-1 exit.** Before it there are no real shaders and
  no multi-object scene to validate against, and a backend brought up
  against the cube alone proves less than the trip costs.
- **Latest, before S21 lands.** This bound is a schedule anchor rather
  than a mechanism (maintainer micro-ruling at landing, 2026-07-31). S21
  is where the roster completes and the api-surface snapshots freeze what
  they cover (D53), and an interface change forced by the third
  implementation from there on stops being ordinary work. The bound is
  that calendar position, so it holds whichever way the separate question
  of what those snapshots mechanically cover is answered; that question
  is routed to S21 below.
- **Pulled earlier by drift, in two phases.** Which drift signal exists
  depends on whether this spec has landed once, and the two phases are
  stated below. Nothing else pulls it.

Both bounds are calendar positions and neither is a dependency. The row's
`Depends on` field names S04 alone because a dependency here is an
artifact claim, S04's golden tiers being what this spec runs, while the
window is a claim about when the work is taken; the two do not contradict
and the row stands as it is.

Three things are explicitly not triggers: the compile-only Windows leg's
readiness, which is decoupled from this spec by construction; a hosted
D3D12 runner appearing, which zero budget forecloses; and S21's own
unsettled cadence question.

**The pull-earlier trigger is two-phase** (maintainer micro-ruling at
landing, 2026-07-31), because a behavioral checkpoint is a win-report and
a win-report needs a working backend, so the checkpoint cannot be the
signal that schedules the first landing:

- **Before the first landing, the signal is seam-churn volume.** The
  count of changes to the RHI seam in `engine/render3d/gpu` since the
  stage-1 exit is readable straight out of git history, which makes it a
  number a reviewer can reproduce rather than a feeling about drift. N
  such changes pull the initial landing forward inside the window, with N
  the maintainer's call against that reproducible count. This is the
  phase where the stub's compile sees signatures and nothing sees
  behavior, and counting the churn is what stands in for the checkpoint
  that does not exist yet.
- **After the first landing, the win-report checkpoint governs.** The
  stage-exit checkpoints #106 ruled on take over, and what they schedule
  is re-validation on a backend that already runs rather than the landing
  itself.

## Grilling dispositions

Settled on the children of wayfinder map #102, all closed. Each is
normative here.

| # | Disposition |
|---|---|
| #103 | A `just win-report` recipe emitting one structured report per run: commit hash, adapter and driver identity per #94, per-tier results with metric values, and the golden-set version. Each report posts as a comment on this spec's tracking ticket, and the exit cites the latest green report. Report-only, literally. |
| #104 | Type drift is policed continuously and for free by the seam-complete stub compiling on every merge; behavioral drift is bounded by a full win-report checkpoint at each stage exit that touched the renderer family, so drift is never older than one renderer stage. |
| #105 | One golden, per-device thresholds: the lavapipe-recorded golden stays the single reference and the rig derives its own FLIP threshold empirically with S04's metric and recipe, recorded in the win-report. #92's findings, plain UNORM swapchain formats, gamma handled shader-side, and no view casting, are adopted as this spec's format basis. |
| #106 | Committed, not demoted. The third backend is what proves D42's abstraction claim. This spec floats between the stage-1 exit at the earliest and the S21 api-surface snapshots at the latest, pulled earlier by a drift checkpoint reporting widening divergence. |

## Implementation order

Suggested, not binding; `/to-tickets` owns the breakdown.

1. Device, queue, adapter enumeration and selection under S03's
   override-first policy, and the run header naming the chosen adapter
   and driver on the rig.
2. Resources and the descriptor heaps behind them: buffers, textures, the
   offscreen color attachment and its depth buffer.
3. The command-list shape and the barrier mapping for caller-declared
   transitions, with the debug validator live from the first submission.
4. Pipelines from the DXIL the pinned Slang compiler already emits.
5. The draw-list walk into D3D12 calls against the offscreen attachment,
   headless, with no swapchain in the picture.
6. The skeleton tier on the rig over the cube scenario.
7. The readback path, the readback tier against the lavapipe golden, and
   the rig's threshold derivation.
8. The multi-object scenario across both tiers.
9. `just win-check`'s D3D12 tiers and `just win-report` with its schema,
   and the first report posted.
10. The swapchain present target, the present pass and the format basis.
11. The viewport surface family's D3D12 bodies over the readback
    transport.

Two orderings are more than convenient. The validator at step 3 rather
than once the backend already works, because D3D12's barrier model is the
one the caller-declared design was hardest to shape against and a
validator written afterwards is shaped by whatever happens to pass. And
the skeleton tier at step 6 before any pixel is read back, because a
skeleton mismatch is a draw-list defect and chasing one through readback
images wastes the trip.

The present pass lands late because it is off the hashed path and gates
nothing: it is the one part of this spec whose failure costs a windowed
run on one machine and costs no tier anywhere.

## Exit checklist

Each item is demonstrable on the rig or in the tree. Report-backed items
are demonstrated by citing the latest green report.

- [ ] The D3D12 package contains no typed unimplemented body: every entry
      point the seam-complete stub declared has a real one.
- [ ] `just win-check` runs the cube and the multi-object scenarios on
      D3D12 on the local Windows rig, headless.
- [ ] Skeleton hashes from the rig match the committed platform-invariant
      goldens on both scenarios.
- [ ] The readback tier scores against the single lavapipe-recorded
      golden, and no golden is recorded on the rig.
- [ ] The rig's threshold is derived once by S04's recipe rather than
      chosen, recorded in the first green report, and re-deriving it from
      known-correct runs reproduces the number.
- [ ] `just win-report` emits one report per run carrying commit hash,
      adapter and driver identity, per-tier results with metric values,
      and the golden-set version.
- [ ] A report is posted as a comment on this spec's tracking ticket, and
      a reviewer can cite one run's outcome by that comment.
- [ ] `just check` is unchanged by this spec and green on both CI
      platforms with the rig unreachable.
- [ ] The swapchain is created `_UNORM`, an `_SRGB` swapchain format
      request is refused by the API rather than by engine code, and the
      render-target view is the plain `_UNORM` one.
- [ ] The presented image carries the offscreen target's bytes rather
      than a second encoding of them, demonstrated against a readback of
      that target.
- [ ] One Slang source serves the present pass on all three backends,
      with no D3D12 gamma branch added to it.
- [ ] A deliberately wrong declared transition fires the debug validator
      on D3D12, as it already does on the two backends S03 implemented.
- [ ] Every reserved capability answers absent on a live D3D12 device and
      refuses at its entry points rather than partially serving them.
- [ ] An explicit adapter override is honoured on the rig, and the
      default names the same adapter across repeated runs.
- [ ] A frame crosses a process boundary through the readback transport
      on D3D12, exercising acquire, publish, open, latest, release and
      close.
- [ ] The compile-only Windows CI leg is unchanged by this spec, still
      runs no tests, and its name still says so.
- [ ] The windowed run presents the scenario on the rig (human
      checkpoint).
- [ ] Every open question below either answered on a ticket or carried
      forward explicitly, never dropped.

Reaching **implemented** is the maintainer's call once this checklist is
clear and the latest report is green.

## Course

Module S03b; path tag engine. Teaches the D3D12 backend against the
win-check tiers. Authored after **implemented**, per D27.

## Prototype ports

None.

## Open questions

The four children of map #102 are all closed and none of the following
reopens one. These are the residue: what a resolution settled on one side
of a boundary and not the other, and what drafting this document
surfaced.

- **Whether S21's api-surface snapshots should also cover the RHI
  surface.** D53's snapshot clause names the `svsw.*` surface and S00's
  snapshot skeleton does not say what it covers, so whether the RHI is in
  scope is unanswered. This is S21's question and belongs on S21's future
  map rather than here: the window's latest bound is a schedule anchor
  and does not rest on the answer, but a third backend is exactly the
  thing an RHI snapshot would catch breaking.
- **Which side a skeleton mismatch on the rig indicts.** S04 commits its
  skeleton goldens as platform-invariant against two backends, and this
  spec is the first run that tests the invariance claim on a third. S03's
  backend-free rule says the recorded list cannot see the backend, so a
  mismatch means one of the two is wrong. Which one, and who triages it,
  is stated nowhere.

Three items are deferred to a named owner rather than left open:

- **The readback metric, its percentile and its implementation pin** are
  S04's. This spec derives one number with them and defines none of them.
- **The NT shared-handle exporter and its courier** are S16b's, as S03
  left them.
- **The roster's marks**, including whether the D3D12 axis ever stops
  being report-only, are S21's, and D48 fixes the axis report-only
  meanwhile.

Four questions this document carried while drafting were settled by
maintainer micro-ruling at landing (2026-07-31) and live in the normative
text above rather than here: the gamma reconciliation blessed as
normative, the pull-earlier trigger's two phases and the seam-churn count
that serves the first of them, the latest bound read as a schedule anchor
rather than as a mechanism, and the rig threshold's one-time calibration.
A fifth, whether the window's earliest bound belongs in the row's
`Depends on` field, is answered by the same landing: a bound is a
calendar claim and a dependency is an artifact claim, so the row depends
on S04 alone and stays as it is.
