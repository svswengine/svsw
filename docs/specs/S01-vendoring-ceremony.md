# S01 — Vendoring ceremony: all C-tier dependencies

Normative text for S01. The [spec index](README.md) records this spec's
rung and nothing else duplicates it (D37).

- **Stage:** 0 — New-stack proof
- **Status:** spec written
- **Depends on:** S00
- **Decisions:** [D7](../decisions/D007-sdl3-wgpu-platform.md),
  [D9](../decisions/D009-dear-imgui-ui.md),
  [D14](../decisions/D014-c-interface-tier.md),
  [D33](../decisions/D033-luau-runtime-adoption.md),
  [D42](../decisions/D042-in-house-rhi-slang.md),
  [D45](../decisions/D045-permissions-allow-only.md),
  [D48](../decisions/D048-backend-sequencing-imgui-renderer.md),
  [D50](../decisions/D050-mod-trust-model.md),
  [D53](../decisions/D053-releases-compatibility-surface.md) as amended by
  [D56](../decisions/D056-source-first-distribution.md). D45 and D53 carry
  weight here that the index row's Decisions field does not yet record:
  D45 for the deny rules this spec reinstates, D53 for what a pin means to
  a reader downstream.
- **Normative references:** none

## Goal

One quarantine pass vendors the full C-tier dependency set so that every
later spec finds its dependency already pinned, already built, and already
described. SDL3 as source, the Slang compiler as checksum-pinned prebuilt
binaries per platform, Dear ImGui plus the cimgui C wrappers, Luau as
source, and the asset-pipeline libraries cgltf, bc7enc and astcenc.
`docs/VENDOR.md` records provenance, the binary-versus-source posture, the
build configuration and the security-response contract per dependency.
`just vendor-libs` builds the set. `just shader-check` compiles a seed
shader through Slang to SPIR-V, DXIL and MSL.

Vulkan, D3D12 and Metal are reached through Odin's own vendored bindings
and are not vendored here (D42). Nothing in this spec consumes any of it:
first consumers are S03 (SDL3, Slang), S12a (cgltf, bc7enc, astcenc), S14
(Luau) and S16 (ImGui).

Three things ride along because this is the first spec that gives them a
subject. The `vendor/` tree makes D45's dormant deny rules concrete again.
The Windows compile-only CI leg D48 promised becomes attachable, because
this is the first spec producing Windows-compilable code. And the
`vendor-quarantine` skill ships, since the procedure it encodes is the
procedure this spec performs, per the tooling design record at
[`docs/plans/claude-tooling-design.md`](../plans/claude-tooling-design.md).

## Working software

Setup spec. `just vendor-libs` and `just shader-check` green on both CI
platforms, `docs/VENDOR.md` complete, and the compile-only Windows job
green. The Windows job entered this spec's scope with the batch-0 ruling
recorded in the index row's Scope in, later than the row's Working
software field was written, and belongs to the same definition of done.

Green here means the dependency set builds and the seed shader compiles.
It does not mean anything links against a vendored library or runs a
vendored line of code, and no acceptance wording in this spec may imply
otherwise.

## Scope in

- The five vendoring passes and their pins, per the roster below.
- `docs/VENDOR.md`, carrying every field the roster names, including the
  per-dependency security-response contract and the hostile-input posture.
- `just vendor-libs`, `just shader-check`, the scheduled report-only drift
  Action, and the compile-only Windows CI job, per the gates below.
- The write-deny rules returning to `.claude/settings.json`, per the
  permissions section below.
- The `vendor-quarantine` skill: check `core:` and `vendor:` first, propose
  and wait for maintainer review, pin by checksum or commit, record
  provenance in `docs/VENDOR.md`, treat unreviewed source as untrusted,
  never hand-edit a vendored file. Its checksum-pinned prebuilt-binary flow
  covers the Slang compiler, which is where D42 pointed it after
  wgpu-native and naga-cli left the roster.
- Platform-tier shim code for cimgui wrapper gaps, on svsw's side of the
  D14 boundary, policed by S00's tier-scan rule set.

## Scope out

- Any consumer code of these libraries. No binding layer, no RHI, no
  sandbox host, no importer.
- The ImGui render-backend wrapper, deferred to S16 (D48): there is no
  single `imgui_impl` to wrap once the render half is svsw's own
  `ImDrawData` renderer over the RHI.
- The Vulkan, D3D12 and Metal bindings, which come from Odin's vendor
  collection rather than this quarantine pass (D42).
- quic-go and every Go dependency, which are Go modules and belong to S26
  and S27a.
- Any live Vulkan device, software or real. S04 is the first spec that
  needs one.
- Editing S00's document. The batch-0 ruling leaves S00 unchanged; its
  Windows-as-local-developer-tooling section still stands, and `just
  win-check` and `just win-run` remain the rig loop beside the new CI job.

## Grilling dispositions

Settled on the children of wayfinder map #52, all closed. Each answer
comment on the tracker holds the reasoning; the rows below hold the
ruling.

| # | Disposition |
|---|---|
| #53 | Pin Slang v2026.14. The Metal target is accepted as experimental-but-adequate for the engine era under two riders: every resource binds through a `ParameterBlock`, and SPIRV-Cross stays the tracked Plan B. |
| #54 | SPIR-V and MSL compile on every leg on every run; DXIL compiles wherever `dxcompiler` is present, refined at landing to the `windows-latest` job alone (see the cadence under `just shader-check`). All three targets gate every merge across the matrix; no single leg covers all three. |
| #55 | cimgui is vendored upstream-as-is, its release matched to the pinned Dear ImGui release. Missing wrapper surface becomes svsw-owned shim code in the platform tier behind D14. Upgrades are re-pins. |
| #56 | No software or real Vulkan device is needed for `shader-check`. `slangc` is an offline ahead-of-time compiler; a device first matters at S04's readback golden. |
| #57 | SDL3 vendors with VIDEO, AUDIO and JOYSTICK plus the Vulkan and Metal video glue; RENDER and GPU stay off. D47's transport needs nothing from SDL3's build configuration. Trimming the remaining subsystems is a footprint call and does not gate. |
| #58 | Write-denies land on `vendor/**` and `docs/research/**`; reads stay open. This fires D45's deferred revisit. |
| #60 | A dedicated compile-only `windows-latest` job enters with S01, compiling the vendored C tier now and growing with the tree as Odin code lands from S02a. No tests run, and the job's name says so. |
| #61 | Drift tickets open `needs-triage` and wait on maintainer cadence. A Luau release marked a security advisory is flagged in its ticket and invokes the out-of-cadence re-vendor obligation, merging only through `just check`. |

Two questions the map charted were answered by the maintainer as scope
rather than as design, and appear above only through their consequences:
where the D48 Windows leg attaches (#60) and what a drift ticket does on
arrival (#61).

## The vendored roster

| Dependency | Form | Pin | First consumer |
|---|---|---|---|
| SDL3 | source, built by `vendor-libs` | tag and commit, unruled version | S03 |
| Slang compiler | prebuilt binaries per platform | **v2026.14**, sha256 per archive | S03 |
| Dear ImGui | source, built as C++ | tag and commit, matched to cimgui | S16 |
| cimgui | source, upstream-generated wrappers as-is | release matching Dear ImGui | S16 |
| Luau | source, C++ built by `vendor-libs` | tag and commit, security-critical | S14 |
| cgltf | source, single-header C | tag and commit | S12a |
| bc7enc | source | tag and commit | S12a |
| astcenc | source | tag and commit, runtime use held | S12a |

Slang is the only entry whose version the grilling settled. Every other
row pins whatever tagged upstream release the vendoring pass takes, by tag
*and* commit, with the checksum recorded, per D14's quarantine policy. The
pin, not the version, is the invariant: a reader downstream pins one engine
release checkout (D53 as amended by D56), and the vendored tree inside that
checkout is part of what the pin reproduces.

### What `docs/VENDOR.md` records

The manifest lives at `docs/VENDOR.md`: outside the write-denied
`vendor/` tree, so an agent can maintain it, and inside `docs/`, where
D30's layout convention keeps documentation. That path is a maintainer
micro-ruling at landing (2026-07-30), settling the question this
document's drafting surfaced.

One entry per dependency, each carrying:

- **Provenance** — upstream URL, tag, commit, and the checksum of what was
  fetched.
- **Posture** — source or prebuilt binary, and why that one.
- **Build configuration** — every flag `vendor-libs` passes, including
  flags deliberately left at upstream defaults, so a later reconfigure is a
  diff against something rather than a guess.
- **Security response** — the upstream advisory source to watch, the
  trigger that forces a bump, and the re-vendor recipe. Luau's entry is
  marked the security-critical one (D50).
- **Hostile-input posture** — what attacker-influenced bytes, if any, this
  dependency parses, and what contains it. The format of this field is an
  open question below.

### SDL3

**What.** Source, vendored and built by `vendor-libs`, giving window,
input and audio (D7, whose wgpu clause D42 superseded and whose SDL3
clause it did not).

**Build configuration** (#57). `SDL_VIDEO`, `SDL_AUDIO` and `SDL_JOYSTICK`
on; `SDL_VULKAN` on everywhere it applies and `SDL_METAL` on Apple;
`SDL_RENDER` and `SDL_GPU` off. The per-platform video backends are not
separate decisions: X11, Wayland and Cocoa auto-enable under `SDL_VIDEO`
per platform and the Windows driver compiles in unconditionally under it.
Everything gated on `SDL_RENDER` is moot once that is off.

**Why that shape.** `SDL_VULKAN` and `SDL_METAL` are video-surface glue,
distinct from SDL's own 2D renderer backends, and S03's swapchain surface
needs them. `SDL_RENDER` and `SDL_GPU` are exactly the WebGPU-shaped
ceiling D42 rejected wgpu for, and svsw owns its RHI. D3D12 needs neither
toggle, since swapchain creation goes through the `HWND` SDL already
exposes. D47's viewport transport needs nothing from this surface at all,
because external-memory export is instance- and device-extension work the
RHI drives directly and SDL3 has no API for; the residual Win32 and X11
reparenting tactic reads native handles through core window properties
already covered by `SDL_VIDEO`.

**Not gating.** `SDL_HAPTIC`, `SDL_SENSOR`, `SDL_CAMERA`, `SDL_POWER`,
`SDL_DIALOG`, `SDL_TRAY` and `SDL_NOTIFICATION` are left at upstream
defaults and recorded that way. Nothing in the roadmap calls for them, and
nothing forbids them. Flipping one later costs a reconfigure and a rebuild,
not a re-vendor, because every one is an ordinary configure-time option
over untouched vendored source.

### The Slang compiler

**What.** Prebuilt release binaries per platform, checksum-pinned, entering
the vendored tier under the policy D42 wrote for them when wgpu-native and
naga-cli left it (D14 as amended).

**Pin.** v2026.14 (#53). The prototype on that issue exercised v2026.14.1,
published hours before the test; the two are equivalent for the constructs
svsw compiles, and the week-soaked release is the one pinned. Each
platform's archive carries its own sha256 in `docs/VENDOR.md`.

**Build configuration.** None. Nothing is compiled; the archives are
fetched, verified against their recorded checksums, and unpacked. A
verification failure fails `vendor-libs` rather than warning.

**Why, and under what rider.** D42 requires a demonstrated
real-shader-to-working-MSL compile before anything relies on the Metal
target, and #53 is where that demonstration happened: a 289-line
forward-plus shader with a `ParameterBlock`, push constants, texture and
sampler arrays, threadgroup memory with atomics and barriers, and a
specialization constant compiled clean to SPIR-V and to idiomatic MSL
across all three entry points. It also reproduced a silent failure: a
`ParameterBlock` and a loose `register()`-bound buffer landed on the same
Metal buffer index with no diagnostic, matching open upstream reports, and
Metal has no equivalent of the Vulkan binding-shift flags to steer around
it. The rider follows directly. **Every resource this repository compiles
binds through a `ParameterBlock`; there are no loose `register()`
bindings.** That removes the entire collision class rather than asking
reviewers to catch instances of it. S01's seed shader obeys the rule as
its first demonstration.

This document is where that rule is recorded, and it binds every
engine-era Slang shader the repository compiles: S06 onward inherits it
from here rather than from a standard of its own. A `SLANG_STYLE.md`
standard beside the Odin, Go and Luau ones is deferred behind a named
trigger, recorded below.

### Dear ImGui and cimgui

**What.** Dear ImGui source plus cimgui's upstream-generated C wrappers,
vendored as-is, with the cimgui release matched to the pinned Dear ImGui
release (#55). `imgui_impl_sdl3` comes along as the platform half.

**Build configuration.** Compiled as C++ inside `vendor-libs`, exposing
cimgui's C ABI to Odin. No wrapper regeneration, so no generator toolchain
enters the tree.

**Why.** Regenerating would put svsw in the business of maintaining a
generator against two moving upstreams for a surface upstream already
publishes. Where the generated surface has gaps, the fix is svsw-owned
shim code in the platform tier calling cimgui's exported API, on our side
of the D14 boundary and policed by tier-scan. `vendor/` stays untouched and
an upgrade stays a re-pin, which is the whole point of the quarantine.

**Not here.** No render-backend wrapper. D48 amends D9 so the render half
of the substrate is one in-house `ImDrawData` renderer over the RHI, since
`imgui_impl_metal` is Objective-C that cimgui's C ABI cannot wrap and three
per-backend wrappers is the triplication the RHI exists to absorb. S16 owns
it.

### Luau

**What.** Source, with its C++ implementation compiled inside
`vendor-libs` alongside cimgui. D33 amends D14 to admit Luau's C API and
its C++ implementation to the vendored C tier behind its C-compatible
boundary.

**Build configuration.** The C++ toolchain and its build flags are the one
part of this roster the grilling did not settle; see the open questions.

**Why it is the special one.** D50 makes the mod sandbox a declared
security boundary defending against hostile source rather than merely buggy
source, and names VM escape through the vendored Luau C++ first in the
enumerated threat set
([`docs/design/threat-model.md`](../design/threat-model.md)). Luau is
therefore the dependency whose security releases re-vendor out of cadence,
and its `docs/VENDOR.md` entry is marked so. Everything else in this roster
bumps on the maintainer's schedule.

### cgltf, bc7enc and astcenc

**What.** The asset-pipeline libraries, vendored and pinned, built inside
`vendor-libs`. cgltf is single-header C; the two encoders compile as
static libraries.

**Why both encoders.** The adopted roadmap pins both. astcenc is pinned
here and its runtime use is held for mobile, so S01 vendors and builds it
without any spec in the current roadmap consuming it yet. That is
deliberate and recorded, not an oversight to be tidied away by a later
reader.

**First consumer.** S12a, for the container format and `assetc`. Nothing
before it links against any of the three.

## The gates

Both recipes join `just check`'s composition, which S00 built the skeleton
for. That is what gives #61's "merges only through `just check`" its teeth:
a re-vendor cannot reach the tree without passing every gate that exists at
the time it lands.

### `just vendor-libs`

Builds every source dependency and verifies every prebuilt one. Green on
`macos-26` and `ubuntu-24.04`, S00's two CI legs, and compiled on the
Windows job. A checksum mismatch, a missing pin, or a `docs/VENDOR.md` entry
without its required fields fails the recipe.

The recipe writes into `vendor/`. The write-deny rules below constrain
agent editing tools, not this recipe, and the ordering note under
Implementation order says why that distinction is load-bearing.

### `just shader-check`

Compiles the seed shader through `slangc` to SPIR-V, DXIL and MSL. The
cadence is fixed (#54), as refined by a maintainer micro-ruling at
landing (2026-07-30): where #54 permitted a Linux DXIL leg with `dxc`
vendored or fetched, DXIL now rides the Windows job alone.

- **SPIR-V and MSL** — every leg, every run. No leg skips either.
- **DXIL** — the `windows-latest` job only, compiled with the `dxc` the
  Windows SDK already ships on that runner. If that copy proves unusable,
  the named fallback is a checksum-pinned `dxc` release fetched on that
  job, and nothing else about the cadence moves. All three targets
  therefore gate every merge across the matrix, without any single leg
  carrying all three.
- **The Linux leg** — compiles SPIR-V and MSL only. No `dxc` is vendored
  or fetched there, which keeps this spec's roster to the dependencies its
  Goal names.
- **macOS** — compiles SPIR-V and MSL only. The macOS Slang release
  bundles no `dxcompiler`, so `slangc` fails with a downstream-compiler load
  error rather than a shader error. This is a stated platform gap, recorded
  in `docs/VENDOR.md`'s Slang entry, and `shader-check` must report it as a
  known-absent target rather than silently passing over it.

No Vulkan device is needed, software or real (#56). `slangc` is a pure
offline ahead-of-time compiler: source in, bytecode and text out, no device
opened. Slang's own CI keeps its compiler builds and its frontend and IR
tests on plain GPU-free hosted runners and pushes only shader *execution*
to real hardware. S01 links no loader, enumerates no device and submits no
command buffer, which keeps this gate inside S00's hosted-runner rule
without provisioning.

### The drift Action

A free scheduled report-only GitHub Action diffs the pinned versions in
`docs/VENDOR.md` against upstream release tags and opens a ticket when they
diverge. It changes nothing in the tree and blocks nothing.

Routing (#61):

- **Ordinary drift** — the ticket opens `needs-triage` and waits on
  maintainer cadence, like any other ticket carrying that label
  ([`docs/agents/triage-labels.md`](../agents/triage-labels.md)).
- **A Luau release marked a security advisory** — the ticket says so
  explicitly, and that flag invokes this spec's out-of-cadence re-vendor
  obligation (D50). The bump does not wait on cadence.
- **The merge gate for either** — `just check`, including S14's sandbox
  gates once they exist. Before S14, the honest gate is compile plus
  whatever tests the vendored source ships, and the ticket says that in
  those words rather than implying sandbox coverage that does not exist
  yet.

### The compile-only Windows CI job

A dedicated `windows-latest` job, introduced by this spec because this is
the first spec producing Windows-compilable code (#60, D48's amended
Windows promise, and the batch-0 ruling recorded in the index row).

- **What it compiles.** The vendored C tier at S01. The Odin build joins
  from S02a as code lands, so the job grows with the tree rather than being
  rewritten later.
- **What it runs.** No tests. The job's name states the caveat, so a green
  check on a pull request cannot be read as Windows runtime coverage.
- **Where the shader targets fit.** This job is the only leg where DXIL
  compiles, so it runs `shader-check` even though it runs no test suite,
  and it is where the Windows SDK's `dxc` is used or the checksum-pinned
  fallback fetched. "Compile-only" bounds what is executed, not which
  gates attach.
- **How it stays inside S00's rules.** Hosted runners only, bare label, no
  self-hosted runner on a public repository. Runtime validation on Windows
  stays local-rig and report-only until S03b, per D48, and nothing in this
  job's wording may imply D3D12 coverage.

## Permissions: the deny rules come back

D45 emptied `deny` and `ask` in `.claude/settings.json` and said plainly
what that gave up: D28's `vendor/**` rules existed for prompt-injection
surface reduction, and they went dormant rather than wrong because
`vendor/` did not exist. This spec creates it, which fires the revisit D45
deferred here.

The change (#58):

- `deny` gains entries for the file-writing tools over `vendor/**` and over
  `docs/research/**`.
- Reads stay open on both.
- `ask` stays empty and `allow` is untouched.

Two invariants that were prose become harness-enforced: vendored code is
never hand-edited (D14's quarantine policy), and the research corpus is
closed. Both were previously enforced by an agent remembering to read the
rule.

What this does not do is worth stating rather than leaving implied, in the
same spirit D45 stated its own cost. D28's rationale was a *read*-deny, and
a write-deny does not restore it: an agent that reads a vendored header can
still be steered by text hidden in one. Reads stay open deliberately,
because every consumer spec from S03 onward has to read these headers to
write bindings against them, and a rule that blocked that would be
suspended within one spec. The injection surface is accepted and named here
instead of being papered over.

One mechanical consequence follows from D39's precedence finding, which
D45 kept: `deny` outranks `ask` outranks `allow`, and the committed and
local settings files merge into one rule set. A personal
`settings.local.json` therefore cannot loosen either of these. That is the
intent. It also means the carve-out D28 wanted has no negation available to
express it, which is why the manifest sits outside the denied path
entirely, at `docs/VENDOR.md`.

## Deliberately deferred

These are stances, not debts. Nothing below waits on evidence; each is a
decision to not do something, recorded so a later reader does not mistake
it for a gap.

- **`dxcompiler` on macOS.** Not installed, not vendored, not fetched. The
  macOS Slang release bundles none, and DXIL there would need a separately
  installed Microsoft DXC. The target is covered by the Windows job, which
  is why the cadence is written per-leg rather than per-run. Revisit only
  if a macOS-only DXIL need appears, which no spec in the roadmap
  currently has.
- **SPIRV-Cross as Plan B.** Tracked, not adopted. Adopting it means Slang
  to SPIR-V to MSL, changes no shader source (D42), and adds SPIRV-Cross to
  this quarantine pass. The trigger is the Metal target regressing under
  the ParameterBlock-only rule, or a Metal-target defect the rule does not
  contain, judged against the open upstream reports #53 cites. Neither
  upstream issue closing nor a version bump is by itself a trigger in
  either direction.
- **A Vulkan device for CI.** None at S01. lavapipe provisioning belongs to
  S04's readback golden, where it is already carried as that spec's own
  validation debt and open question. #56 confirms the boundary is drawn in
  the right place rather than moving it.
- **Subsystem-footprint trimming for SDL3.** A footprint call, not a needs
  call, and explicitly non-gating (#57). Defaults are recorded so the trim
  is a diff whenever someone wants it.
- **A `SLANG_STYLE.md` standard.** The ParameterBlock-only rule lives in
  this spec's normative text and needs no standard to bind the engine-era
  shaders. A Slang standard lands behind a named trigger: a second
  shader-authoring surface, such as mod-authored or editor-authored
  shaders, or the shader corpus outgrowing what one spec's rule can carry.
  Neither exists at S01.
- **Compiling the emitted MSL to `.air`.** Not done here. A green `slangc`
  exit means MSL was emitted, not that a Metal toolchain accepted it, and
  the `.air` compile check lands with S04's Metal path validation.

## Implementation order

Suggested, not binding; `/to-tickets` owns the breakdown.

1. The `vendor/` skeleton and the `docs/VENDOR.md` schema, with no
   dependencies in it yet.
2. Slang prebuilts and `shader-check` with the seed shader on SPIR-V and
   MSL. This is the gate with content to chew on first, and it is the
   cheapest one to make red on purpose.
3. SDL3, source and build configuration.
4. Dear ImGui and cimgui, plus the platform-tier shim seam and the
   tier-scan check that it holds.
5. Luau, which is where the C++ toolchain baseline gets settled rather than
   assumed.
6. cgltf, bc7enc and astcenc.
7. The Windows compile job, then DXIL on it, which completes the
   `shader-check` cadence.
8. The drift Action and its triage routing.
9. The `vendor-quarantine` skill, last, because it encodes a procedure that
   has by then been performed five times.
10. The `.claude/settings.json` write-denies.

Step 10 is last on purpose, and the reason is a knot worth naming. A
write-deny over `vendor/**` blocks the agent editing tools, so landing it
before the tree is populated would block the sessions doing steps 3 through
6 from writing anything into it. It does not block `just vendor-libs`,
which runs as a shell recipe and is separately allowed, so the steady state
after step 10 is the intended one: the recipe populates and refreshes
`vendor/`, and no agent hand-edits it. Landing the rule early would force
either a temporary local override or a stream of denied writes, and both
teach the wrong lesson about what the rule is for.

## Exit checklist

- [ ] `just vendor-libs` green on `macos-26` and `ubuntu-24.04`.
- [ ] `just shader-check` green on both legs, compiling SPIR-V and MSL
      everywhere, with DXIL carried by the Windows job alone.
- [ ] The Windows compile-only job green, compiling the vendored C tier and
      DXIL, running no tests, and saying so in its name.
- [ ] Both recipes reachable from `just check`, and `just --list` describes
      each.
- [ ] `docs/VENDOR.md` complete: every dependency carries provenance,
      posture, build configuration, security response, and hostile-input
      posture.
- [ ] Luau's entry marked the security-critical dependency, with its
      out-of-cadence re-vendor obligation stated (D50).
- [ ] A deliberate checksum mismatch fails `vendor-libs`, demonstrated.
- [ ] The seed shader binds every resource through a `ParameterBlock`, and
      a deliberate loose `register()` binding is caught before merge.
- [ ] The drift Action runs on schedule, opens a `needs-triage` ticket
      against a deliberately stale pin, and changes nothing in the tree.
- [ ] `.claude/settings.json` carries write-denies on `vendor/**` and
      `docs/research/**` with reads open, and a hand-edit attempt on a
      vendored file is refused.
- [ ] The `vendor-quarantine` skill exists and its flow matches what this
      spec actually did.
- [ ] tier-scan passes with the cimgui shims in the platform tier, and
      fails a deliberate cimgui call from outside it.
- [ ] Every open question below either answered on a ticket or carried
      forward explicitly, never dropped.

Reaching **implemented** is the maintainer's call once this checklist is
clear and the gate is green.

## Course

Module S01; path tag engine. Teaches the C-tier vendoring ceremony against
`just vendor-libs` and `just shader-check`, and seeds the shared Setup
track. Authored after **implemented**, per D27, and the pairing lands at
C00.

## Prototype ports

The quarantine vendoring policy and the `docs/VENDOR.md` conventions; the
prototype's Lua vendoring recipe, adapted for Luau. D33 is why the
adaptation works and where it stops: Luau's C API stays 5.1-era-compatible
so the recipe's patterns carry, while the C++ toolchain and its build flags
are new. Ports are test-first from a source to read, never a target to
converge with (D38).

## Open questions

The eight children of map #52 are all closed, and none of the following
reopens one. These are the residue: what the map itself recorded as not yet
specified, plus what drafting this document surfaced.

Carried from map #52's own "not yet specified" list:

- **The content and format of the hostile-input posture field.** The index
  row spells out the security-response field's sub-fields in full and says
  nothing about what a hostile-input write-up contains per dependency.
  D50's threat model is the nearest existing vocabulary and is the obvious
  place to draw the shape from, but nothing has ruled that it should be.
- **The C++ toolchain and build-flag baseline** for compiling Luau and
  cimgui inside `vendor-libs`: which compiler on each leg, which standard
  level, which optimization and hardening flags, and whether the two share
  one baseline or carry separate ones.

Surfaced while drafting:

- **Whether `windows-latest` should be pinned.** #60 names the floating
  label, while S00's CI rules pin `macos-26` and `ubuntu-24.04` to
  versioned bare labels. Both are bare labels and both are free, so this is
  a reproducibility question rather than a cost one.

Three further questions this document surfaced were settled by maintainer
micro-ruling at landing (2026-07-30) and live in the normative text above
rather than here: where the manifest lives, how DXIL is covered, and where
the ParameterBlock-only rule is recorded.
