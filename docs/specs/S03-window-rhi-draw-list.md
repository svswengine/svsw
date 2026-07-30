# S03 — SDL3 window + RHI device + draw-list render core

Normative text for S03. The [spec index](README.md) records this spec's
rung and nothing else duplicates it (D37).

- **Stage:** 0 — New-stack proof
- **Status:** spec written
- **Depends on:** S01, S02b
- **Decisions:** [D2](../decisions/D002-layering.md),
  [D7](../decisions/D007-sdl3-wgpu-platform.md),
  [D14](../decisions/D014-c-interface-tier.md),
  [D22](../decisions/D022-dual-mode-parity.md),
  [D42](../decisions/D042-in-house-rhi-slang.md),
  [D47](../decisions/D047-viewport-transport-debug-suspended.md),
  [D48](../decisions/D048-backend-sequencing-imgui-renderer.md). Three more
  bind clauses of this spec without appearing in the row: D54 for what the
  present pass may not do, D55 for two reopens this spec names and defers,
  and D44 for the worker whose surface the transport family exports.
- **Normative references:** none

## Goal

The new render stack's skeleton, in three packages with one seam between
them. `engine/platform_sdl` owns the window, the event pump and the
native surface handles. `engine/render3d` is the backend-free CPU core
that emits a plain draw-list struct stream. `engine/render3d/gpu` carries
the in-house rendering interface and is the only consumer of a graphics
backend, walking that list into backend calls against an offscreen
attachment.

D42 is what makes this spec hard. The GPU stratum is a real abstraction
over Vulkan, D3D12 and Metal rather than a thin pass-through to one, so
its shape is this spec's central design problem rather than a detail, and
every downstream renderer-family spec writes against whatever shape lands
here. D48 sets the sequencing: Vulkan and Metal are implemented, the
interface is designed against all three APIs' constraints including
descriptor heaps, explicit barriers and queue families, and D3D12 arrives
through its own spec.

Both modes drive one render path into the same offscreen target and the
window presents from that target, so a mode fork cannot hide (D22). That
sentence is the load-bearing one in this document: most of what follows
is the consequence of taking it literally rather than approximately.

## Working software

A headless run renders a test frame into the offscreen target with no
window, no swapchain and no window-system connection. A smoke test
asserting that both paths execute passes in `just check` on both CI
platforms. A windowed run opens an SDL3 window and presents the same
frame on the dev machine, which is a human checkpoint rather than a CI
assertion.

Green here means both paths execute and the interface holds. It does not
mean the pixels are right, and no acceptance wording in this spec may
imply otherwise: goldens, the skeleton hash's definition and the parity
gate are S04's, and this spec records no committed hash of any kind.

## Decisions in force here

The row's `Decisions` field names seven. Each is cited below at the point
it decides something, and three more are named because they bind clauses
of this spec that the row's field does not record.

- **D42, the in-house RHI over three backends with Slang shaders.** The
  reason the GPU stratum is a design problem. It also fixes the feature
  set the interface must eventually reach, which is what the capability
  enumeration below names without implementing.
- **D48, backend sequencing and one ImGui renderer.** Vulkan and Metal
  implemented, all three designed against, D3D12 through its own spec.
  Vulkan is the supported Windows path in the engine era, and no
  acceptance line in this document may imply D3D12 coverage.
- **D22, dual-mode parity.** One render path, one offscreen target,
  presentation reading from it. This spec builds the path the gate will
  later compare; S04 lands the gate.
- **D2, layering, and D14, the C interface tier.** Only the platform tier
  and `engine/render3d/gpu` may touch a graphics backend, SDL3 or C.
  tier-scan grows the rules that police it, and `engine/render3d` staying
  backend-free is the same rule read from above.
- **D7, the SDL3 platform.** Its wgpu clause is superseded by D42; its
  SDL3 clause is not, and this is the first spec that consumes SDL3.
- **D47, viewport transport as a named RHI capability.** The capability
  is shaped here. D47's windowless-worker wording, which S08's topology
  depends on, only stays true if the worker renders into the D22 target
  exactly as a headless run does, which is what the transport family
  below is built to preserve.
- **D54, the color pipeline.** Fixed before Milestone A and landing at
  S06. This spec does not implement the resolve chain; it fixes the
  present pass so that when the chain lands, sRGB encoding still happens
  exactly once.
- **D55, the post-engine substrate roster.** Two things this spec names
  and refuses in the same breath sit past the engine era: display-side
  HDR output, and the render-graph layer that would derive barriers.
- **D44, worker topology.** The transport family's producer is a Session
  worker, which owns user state and never restarts silently. That is why
  a dead producer must surface at the consumer as a refused call rather
  than as a use-after-free.

### D22 at a pre-golden rung

Dual-mode parity compares a headless run against a windowed run of one
build, on world hashes, skeleton hashes and readback goldens. S03 has all
three of the things being compared and none of the comparisons: the
scenario, the recorded draw list and the rendered image exist here, while
the skeleton hash's definition, the readback tier and `just parity-check`
are S04's own Scope in.

What this spec owes D22 is that the comparison is possible when it
arrives. The concrete obligation is stated under the skeleton-hash
section below and it is structural rather than a gate: nothing the
recorded draw list carries may vary with the mode, the backend, the
adapter or the negotiated swapchain format.

## Scope in

- `engine/platform_sdl`: window creation, the event pump, and the native
  surface handles the RHI needs to build a swapchain. Headless takes none
  of it.
- `engine/render3d`: one opaque pass with a depth buffer, emitting the
  draw-list struct stream (pipeline id, bind sets, handles, instance
  ranges, uniform blocks), backend-free.
- `engine/render3d/gpu`: the rendering interface as specified below, and
  the walk from draw list to backend calls against an offscreen
  attachment.
- Vulkan and Metal implemented; the interface designed against all three
  APIs' constraints; the D3D12 package present as a **seam-complete
  stub**, defined below, which the compile-only Windows leg compiles and
  never executes (#94).
- The present pass as a fullscreen-triangle draw, and the swapchain
  format and color-space policy (#92, #93).
- The viewport transport surface family, fully typed with its frame
  protocol, and the CPU readback path as its one implemented transport
  (#89).
- The capability enumeration, including the reserved and explicitly
  absent entries (#90).
- Caller-declared resource-state transitions and the debug-build
  validator (#91).
- The monomorphic per-draw parameter block (#95).
- Adapter and device selection policy, and the run header that names the
  chosen adapter and driver (#94).
- tier-scan rules extended so only the platform tier and
  `engine/render3d/gpu` touch a graphics backend or SDL3.
- The first product-shaped Slang shaders under `just shader-check`, on
  the cadence S01 fixed.

## Scope out

- Goldens, the skeleton hash's definition, the readback tier and
  `just parity-check`: all S04's.
- The D54 resolve chain, the pipeline cache, materials, culling and the
  camera: S06's.
- The D3D12 implementation, its rig loop, and `just win-check`'s growth:
  S03b's.
- The OS side channel that couriers a share handle between processes:
  S16b's plumbing, per #89's rider.
- The ImDrawData renderer over this interface: S16's (D48).
- Textures and materials beyond the minimum to draw; input translation
  (S08, S19); audio (S18).
- Ray tracing, mesh and task shaders, bindless descriptor indexing and
  async compute. D42 exists so the interface can reach them later. None
  is drawn here, and the capability enumeration below is the whole of
  what this spec says about them.
- Display-side HDR and extended-range swapchain output, which is
  post-engine work on D55's roster as amended.

## The RHI surface

The governing ruling is #90: minimal implemented, capabilities named. The
interface implements what this spec's milestone exercises and nothing
beyond it, and it says out loud, in queryable form, which of D42's
headline features are reserved and absent. That is the middle path
between a vocabulary that never needs breaking, which cannot be designed
against four unbuilt subsystems, and a triangle-shaped minimum that
leaves later specs nothing to write against.

### Device, queue and adapter policy

A device is opened against a selected adapter and exposes the queue the
draw path submits on. Async compute on a second queue is a reserved
capability rather than a second queue that exists and goes unused, so
this spec's queue surface is singular by construction and grows when its
consuming spec arrives.

Adapter selection is override-first (#94):

- **An explicit selector always wins.** Whatever names an adapter
  explicitly, whether a command-line flag, an environment variable or a
  configuration value, overrides every default. The mechanism is what
  makes a multi-adapter dev machine and a two-process viewport
  reproducible at all.
- **The default is discrete-first**, tie-broken on a stable vendor and
  device identifier, never on enumeration order. Enumeration order is not
  stable across driver updates or across the same machine's reboots on
  every platform, and a default that moves silently makes two runs on one
  machine incomparable.
- **The chosen adapter and its driver version are logged in every run
  header**, headless and windowed alike, so a golden or a replay names
  the hardware that produced it. S04's readback goldens key per platform
  and shader backend; this is the line that lets a re-record be triaged
  rather than guessed at.

The Windows posture follows D48 unchanged. The compile-only
`windows-latest` leg S01 introduced compiles the D3D12 backend source
from S03 onward and executes nothing. Runtime validation on Windows stays
local-rig and report-only until S03b lands, and Vulkan is the supported
Windows path in the engine era.

**What "the D3D12 backend source" is at S03: a seam-complete stub**
(maintainer micro-ruling at landing, 2026-07-31). The D3D12 package
implements the full RHI seam, meaning every type, every entry point and
every signature the Vulkan and Metal packages implement, with bodies
that are typed and unimplemented. MSVC compiles the package on the
Windows leg, which is the whole of what this spec asks of it. All
behavior is S03b's.

Three things follow, and the middle one is why the bound is worth
stating:

- **An empty file does not satisfy this spec.** Neither does a package
  that compiles because it declares nothing. The leg's value is that a
  seam change in `engine/render3d/gpu` breaks the D3D12 package's
  compile in the same commit that makes it, and a package with no seam
  in it cannot break.
- **A typed unimplemented body is not a reserved capability.** The
  reserved entries in the enumeration below answer their query with
  absent and refuse at a live device; these bodies are never reached at
  all, because nothing executes them at this rung. Conflating the two
  would put a D3D12 device on the roster of things S03 ships.
- **Nothing in this spec's wording may imply D3D12 coverage** (D48).
  The stub compiles; it does not draw, and no acceptance line here
  claims otherwise.

### The three present-target kinds

A frame ends by presenting to a target, and the render path cannot tell
which kind of target it holds (#89). Three kinds exist:

- **Offscreen only** — the target is rendered and read back, never
  presented. This is what a headless run constructs, and it is the only
  kind `just check` exercises at this rung.
- **Swapchain** — a window, reached through the native surface handles
  `engine/platform_sdl` supplies.
- **Viewport surface** — a process boundary, the D47 transport, detailed
  in its own section below.

The worker's loop is `acquire`, render, `present` against all three, and
the three are indistinguishable to it. This is not an ergonomic
preference: it is how D22's one-render-path rule is made literally true
rather than approximately true. A frame loop that grows an `if` on the
target kind is a mode fork with a different name.

Support for each kind is queryable, and a kind reported unsupported
carries a reason rather than a bare failure. The reasons that matter at
this rung are an absent device feature, an absent driver extension, a
software rasterizer, and a mismatch between two processes' adapters. The
reason is what lets a caller choose the sanctioned fallback instead of
inventing one.

### Resources

Buffers and textures, created from immutable descriptors. Usage is
declared at creation and never changed afterwards, because on every
backend the usage set changes the allocation rather than the access.

Two resources are named deliverables because the rest of the spec rests
on them: the offscreen color attachment that D22 hashes, presents and
reads back, and its depth buffer. The offscreen target's dimensions are
scene state rather than window state, and this is a hard rule: a target
that followed the window's size would make the hashed image depend on the
window, which is exactly the parity break D22 exists to prevent. What the
present pass does when the window's size and the target's size disagree
is off the hashed path and is recorded as an open question below.

### Pipelines

Pipelines are built from the artifacts the S01-pinned Slang compiler
emits: SPIR-V for Vulkan, MSL for Metal, DXIL for the D3D12 source the
Windows leg compiles. Nothing in this spec compiles a shader at runtime;
`just shader-check` is an ahead-of-time gate and the pipeline consumes
its output.

S01's ParameterBlock-only rule binds every shader this spec authors:
every resource binds through a `ParameterBlock` and there are no loose
`register()` bindings. That rule is not restated here as a preference; it
is the condition the monomorphic parameter block below is conditioned on
(#95), and S01's prototype demonstrated the silent Metal binding
collision it exists to foreclose.

### The draw list and the monomorphic parameter block

The draw list is a flat, ordered stream of fixed-layout structs carrying
pipeline id, bind sets, handles, instance ranges and uniform blocks. It
is monomorphic by construction: one uniform byte layout, no polymorphic
step objects, no runtime dispatch per step. The discipline comes from the
internal prototype and from the research corpus's reading of the Trinity
RenderJob shape, and the corpus is explicit that what carries is the data
shape rather than the mechanism, which was C++ virtual dispatch.

The per-draw uniform block stays monomorphic the same way (#95):

- **One fixed-size, fixed-layout block per draw**, bound on every draw
  regardless of variant. One Slang `ParameterBlock` per draw, laid out
  identically for every pipeline permutation the draw list can name.
- **Variants are selected by a data discriminant** inside that block,
  which the shader branches on, or by pipeline id across a fixed
  permutation set. Never by a differently shaped block and never by a
  different set of bound resources.
- **The bind shape never forks on content.** A draw that does not read a
  bound resource still binds one. Only the bound values differ.
- **Growth absorbs into inert lanes** rather than into a new block shape.
  The internal prototype demonstrated exactly this when a runtime ambient
  term extended a block that already existed rather than adding one.

Granularity is per-pass and per-draw **from day one**, on the internal
prototype's precedent, blessed as normative by a maintainer micro-ruling
at landing (2026-07-31) rather than left as the drafter's reading of
#95. Pass-constant data, the camera above all, is one fixed shape
uploaded once per pass outside the draw loop. Draw-varying data is one
fixed shape uploaded per draw. Both are fixed-size and fixed-layout for a
given pipeline id, and neither shape depends on which branch a draw
takes. Both blocks exist at S03 even though one opaque pass with one
camera could be served by the per-draw block alone: collapsing them now
and splitting them at S06 would move every uniform's slot after the
layout had consumers, which is the churn the monomorphic ruling exists
to prevent.

What this settles is the mechanism. The exact field layout, the slot
assignments, and where the boundary sits between a discriminant lane and
a distinct pipeline id are named open questions below, and S06 owns the
permutation set that will exercise the second of them.

### Command lists and caller-declared transitions

One command-list shape, recording draws and resource-state transitions
into a stream that the GPU stratum walks into backend calls.

Transitions are caller-declared explicit commands in that recorded stream
(#91). The interface tracks no state on the caller's behalf and inserts
no barrier the caller did not ask for. Three properties follow and each
is a reason:

- **Stateless.** The interface holds no shadow copy of any resource's
  state, so there is no divergence class where the interface's model and
  the backend's reality disagree.
- **Backend-uniform.** A declared transition means the same thing on
  every backend, which is what makes one recorded stream expressible in
  Vulkan's barriers, D3D12's enhanced barriers and Metal's model without
  the recorded form forking.
- **Content-determined.** The same scene content produces the same
  transitions, which is what makes them safe for the skeleton hash to
  cover. An interface that inserted barriers from tracked state would
  make the recorded stream a function of the interface's bookkeeping
  rather than of the content.

A debug-build validator checks that the declared state matches the usage
at every point it is used, and fails loudly when it does not. It is an
assertion rather than a recovery path, because a wrong declaration is an
engine bug rather than hostile input (ODIN_STYLE A8). Whichever build
`just check` drives must therefore be one that keeps assertions live, or
the smoke test passes over a wrong declaration and the frame is subtly
wrong instead of loudly broken.

The named reopen: if pass count outgrows hand-declaration after the
engine era, a render-graph layer deriving barriers lands **above** the
RHI, never inside it. That placement is the whole of the ruling, and it
is what keeps the reopen from being a rewrite of this interface.

### The capability enumeration

Capabilities are queryable at the device. Two classes exist and the
second is the point of the enumeration (#90).

**Implemented**, meaning this spec builds and exercises it: device and
queue, the three present-target kinds including the viewport surface
family, buffer and texture creation, pipelines from the pinned
compiler's artifacts, and one command-list shape with draws and
caller-declared transitions.

**Reserved and explicitly absent**, meaning the name exists, the query
answers, and the answer is no:

| Capability | Status at S03 | Activates with |
|---|---|---|
| Bindless descriptor indexing | reserved, absent | its consuming spec |
| Mesh and task shaders | reserved, absent | its consuming spec |
| Hardware ray tracing | reserved, absent | its consuming spec |
| Async compute on a second queue | reserved, absent | its consuming spec |
| Viewport surface transport | implemented over CPU readback; OS exporters absent | S16b, with its handle courier |

A reserved capability is not a stub that half works. The query returns
absent, every entry point behind it refuses, and the refusal is the
documented behavior rather than an oversight. Each activates when its
consuming spec arrives and names itself; this spec deliberately assigns
no owner, because guessing an owner here would put a claim on a row that
has not grilled.

Display-side HDR output is deliberately not in this table. It is not a
reserved capability awaiting a consumer: it is post-engine work on D55's
roster as amended, and D54's internal HDR-offscreen-to-tonemap-to-sRGB
pipeline is unaffected by that.

## The present pass

Present is a fullscreen-triangle draw that samples the offscreen target
and writes the swapchain image, uniformly on all three backends, and it
is never a blit or a copy (#93). Each backend supplies an independent
reason:

- **Vulkan.** `vkCmdBlitImage` needs `VK_IMAGE_USAGE_TRANSFER_DST_BIT`
  on the destination, which is an optional, queryable bit in a
  swapchain's supported usage flags rather than a guarantee. Color
  attachment usage is the one usage a presentable image is guaranteed.
- **D3D12.** No blit primitive exists. `CopyResource` and the resolve
  entry points require matching formats and dimensions, and flip-model
  swap chains restrict the swapchain format to four values.
- **Metal.** A presentable drawable defaults to `framebufferOnly`, under
  which its texture carries render-target usage only and blit commands
  do not work on it at all without opting out and paying a documented
  display-optimization cost.

The pass is a passthrough. It adapts the destination's bit packing and
nothing else, and it performs no color math on either the sample or the
write. The internal prototype's own postfx resolve and Microsoft's own
HDR-to-swapchain sample converge on the same shape from different
constraints, which is why this is a mechanism ruling rather than a
preference.

### Swapchain format and color space

On every backend the swapchain requests a plain, non-color-converting
UNORM-family format paired with that platform's own default tag for
standard-range sRGB-encoded content (#92):

| Backend | Format | Color tag |
|---|---|---|
| Vulkan | `VK_FORMAT_B8G8R8A8_UNORM`, falling back to `VK_FORMAT_R8G8B8A8_UNORM` | `VK_COLOR_SPACE_SRGB_NONLINEAR_KHR` |
| Metal | `bgra8Unorm` (the `CAMetalLayer` default) | `colorspace` left `nil` (the default: no color matching) |
| D3D12 | `DXGI_FORMAT_B8G8R8A8_UNORM`, falling back to `DXGI_FORMAT_R8G8B8A8_UNORM` | `DXGI_COLOR_SPACE_RGB_FULL_G22_NONE_P709` (the default) |

Three rules ride with the table:

- **Never the `_SRGB` variant** for a swapchain image. The hardware would
  then decode on read and encode on write around a shader whose bytes are
  already final, which corrupts them exactly once and invisibly.
- **Zero conversion inside the present pass**, on the sample or on the
  write. The offscreen target is sampled through a non-decoding view.
  This is what lets one Slang source compile to all three backends with
  no per-backend gamma branch.
- **sRGB encoding happens exactly once, upstream.** At S06 that is D54's
  resolve chain, which bakes final sRGB bytes into the target D22 hashes.
  At S03 the chain does not exist yet, so the obligation this spec
  carries is narrower and forward-looking: the present pass is a
  passthrough now and must still be one when the resolve lands, so the
  format policy is fixed here rather than discovered at S06.

An unavailable format-and-color-space pairing fails loud at swapchain
creation with a named reason, and never substitutes silently. The reason
this can be strict rather than accommodating is that present is off the
hashed path: no gate in this repository hashes what the present pass
produces, so a refused swapchain costs a windowed run on one machine and
costs no golden anywhere. Failing loud is affordable here in a way it
would not be on the hashed path.

That sense of "off-hash" is the render tier's, not the sim tier's. The
glossary entry at [`docs/context/CONTEXT.md`](../context/CONTEXT.md)
defines the term for sim state excluded from `hash_world`, and the
collision is recorded as an open question below rather than resolved by
this document.

## The viewport transport surface family

D47 already decided that the viewport works by sharing the worker's
offscreen render target across the process boundary, that reparenting
survives only as a residual Win32 and X11 tactic, and that the RHI treats
this as a named capability "shaped in S03." The shape is a dedicated
presentable-surface object family, which is shape B of the two the
prototype on #89 built.

The family is a second implementation of the presentation seam, sitting
where the swapchain sits, rather than an export flag on texture creation
plus a share-handle type. The export-flag primitives survive as
per-backend internals: a usage bit that changes an allocation, a handle
type, an exported timeline. They are not public interface surface.

The reason is that the hard part of this capability is not the handle. It
is the frame protocol: how deep the image rotation is, which image is
current, who blocks when the consumer falls behind, and the pair of
timelines that keeps a consumer off an image the producer is still
writing. A shape that hands callers three primitives and no protocol gets
the protocol invented in editor code at S16b and reinvented at S22, in
the one place where no backend can enforce it and a race surfaces as an
intermittently torn viewport rather than as a validation error. That is
the small version of what D42 already rejected when it refused to ship on
wgpu and swap later, and it is the same per-backend triplication, DRM
format modifiers against IOSurface planes against NT handle duplication,
that D42 and D48 say the RHI exists to absorb.

### Protocol obligations

The interface owns all of the following, and none of it reaches a caller:

- **Rotation depth and policy.** The surface owns how many images it
  rotates through and whether an unread frame is dropped or the producer
  is back-pressured. Both are set at creation.
- **Two timelines, never one.** A producer timeline signalled when a
  frame's writes complete, and a consumer timeline signalled when
  sampling completes. One timeline cannot express both halves of the
  hazard.
- **Acquire and publish on the producer**, matching the swapchain's own
  acquire and present, so the worker's loop is the same loop.
- **Open, latest, release and close on the consumer.** An import is a
  borrow: it opens after the surface exists and closes before the surface
  dies.
- **Adapter identity in the token, compared before import.** Opaque
  handles on Vulkan and D3D12 require both processes on the same physical
  device. A mismatch is a named refusal that selects the fallback, not a
  crash and not a torn image.
- **A dead producer surfaces as a refused call.** D44 never silently
  restarts a Session worker, so a consumer can hold a stale token for as
  long as a maintainer stares at the crash. Every consumer entry point
  must therefore be able to fail rather than assume liveness.
- **The boundary transition is declared like any other** (#91) and is
  recorded outside the draw list the skeleton hash covers, per the
  section below.

What travels is the D22 offscreen target itself, already resolved.
D47 says the worker "renders into the one D22 offscreen target exactly as
a headless run does," and D54 puts the tonemap resolve upstream of that
target, so the consumer receives finished sRGB bytes and composites its
overlays in the same space. This is a consequence of two landed decisions
rather than a new ruling, and it is what keeps the editor's viewport and
the readback golden showing the same image.

### The depth that lands here

#89 settled the family's shape and not its depth. The depth is a
maintainer micro-ruling at landing (2026-07-31), and it splits the
capability into a part that is fully designed now and a part that waits
for a consumer:

- **The surface family and its frame protocol land fully typed.** Every
  type, every entry point and every signature in the Protocol
  obligations above exists at S03: acquire and publish, open, latest,
  release and close, the two timelines, the rotation policy set at
  creation, the adapter identity in the token, and the refusal paths.
  The protocol is the hard part and the part later specs write against,
  so it is designed here rather than discovered in editor code (#89).
- **The CPU readback path is the one implemented transport.** It moves
  real frames across the boundary through host memory, and it is what
  every entry point above actually does at this rung.
- **The OS exporters land with their first consumer, at S16b.**
  IOSurface on Metal, dma-buf on Linux Vulkan, and NT shared handles on
  D3D12 are per-backend internals behind the same typed surface, and
  each arrives with the courier that carries its handle across the
  process boundary, which is S16b's plumbing either way.

The reason to implement readback rather than nothing is that it makes
the smoke gate mean something. A typed family with no transport behind
it can only be checked for compiling; a typed family with readback
behind it can be driven end to end on a hosted runner, which is where
`just check` runs. So the family is exercised at S03 rather than merely
declared, and what S16b adds is speed on hardware that has it, not the
capability's first proof of life.

### The capability-absent readback fallback

A CPU readback path is sanctioned as the capability-absent fallback: a
round trip through host memory, correct everywhere, slow, and explicitly
off the hot path. It is selected when the viewport surface kind reports
unsupported, which covers a headless hosted runner, a software
rasterizer, a driver without the extension, and a cross-process adapter
mismatch. At S03 it is selected always, because no OS exporter exists
yet to report supported. The fallback and the one implemented transport
are therefore the same code at this rung, and they stop being the same
code at S16b without the selection rule changing.

Sanctioning it does one specific thing: it gives S16b's smoke gate a
hosted-runner floor, which is that spec's own open question answered from
here. Without it, "no transport, no viewport" would make the editor
skeleton unexercisable on any CI leg this project can afford, and the
capability's absence would degrade to no viewport rather than to a slow
one.

D47's residual Win32 and X11 reparenting tactic is not part of this
family and is not implemented here. It survives as D47 left it.

### What is deliberately S16b's

- **The handle courier.** A dma-buf file descriptor, a mach send right
  and an NT handle cannot travel in a byte stream: they need `SCM_RIGHTS`
  over a Unix socket, a mach port right, and `DuplicateHandle` into the
  target process respectively. The RHI's contract stops at exporting and
  importing a handle. S05's length-prefixed envelope stays OS-clean, and
  the side channel is S16b's plumbing.
- **Whether the smoke gate exercises the transport headless** or stays
  skeleton-deep with the transport as a dev-machine checkpoint. S16b's
  own open question, now answerable because the fallback exists.
- **The D49 message-kind range** the courier's control traffic uses.
- **Whether the editor is obliged** to pass its own adapter identifier as
  the worker's explicit selector, or whether mismatch-then-fallback is
  the contract. The override-first rule above supplies the mechanism
  either answer would use; choosing is S16b's, and it is recorded as an
  open question below.

## What the skeleton hash covers

S04 owns the skeleton hash: its definition, its goldens, its re-record
recipe and the parity gate that compares it across modes are all in S04's
own Scope in, and this spec records no hash and no golden. Stating that
plainly matters more than claiming coverage this spec does not have.

What S03 owes S04 is a draw list that can be hashed at all, and that is
a structural obligation this spec must meet rather than a gate it can
run. Five properties:

1. **One uniform byte layout.** A flat slice of fixed-size plain structs
   is linearly hashable and bulk-copyable. A polymorphic step with an
   `Execute` method is neither, which is why the monomorphic ruling above
   is not a style preference.
2. **Backend-free by construction** (D42). No backend handle, no backend
   enum, no negotiated swapchain format and no adapter identifier is
   reachable from the recorded list. This is the property that lets one
   committed skeleton golden be verified on every leg.
3. **Content-determined.** The same scene content produces the same
   recorded stream, transitions included, on every backend and in every
   mode. Caller-declared transitions are what makes this true of the
   barriers too; interface-tracked barriers would have made the stream a
   function of the interface's bookkeeping.
4. **The stream ends at the offscreen target.** Everything from the
   present-target acquire onward, the present pass, the swapchain
   transitions, and the transport family's export barrier, is recorded
   outside the list the skeleton hash covers. This is the clause that
   makes the same recorded list come out of a headless run, a windowed
   run and a worker exporting a viewport, and without it D22's parity
   comparison is between two different things. No disposition on map #88
   drew this boundary; a maintainer micro-ruling at landing (2026-07-31)
   blesses it as normative, because S04 cannot define a hash without
   knowing where the recorded stream stops and this spec is what stops
   it.
5. **Ordinal and float lanes are separable.** S04's definition excludes
   floats, and the per-draw block mixes ordinal data such as handles and
   the permutation discriminant with float data such as transforms and
   colors. S03 lays the block out so that separation is mechanical. The
   field-level policy itself is new design work with no precedent to
   mine, and it is recorded as an open question below with S04 named.

## Grilling dispositions

Settled on the children of wayfinder map #88, all closed. Each is
normative here.

| # | Disposition |
|---|---|
| #89 | Shape B: a dedicated presentable-surface family with an RHI-owned frame protocol; the worker's loop is acquire/render/present against three indistinguishable present-target kinds; the handle courier is S16b's plumbing; CPU readback is the sanctioned capability-absent fallback. |
| #90 | Minimal implemented, capabilities named. D42's headline features are queryable, reserved, explicitly absent entries activating with their consuming specs; display-side HDR goes to D55's post-engine roster instead. |
| #91 | Caller-declared transitions as explicit commands in the recorded stream, with a debug-build state validator; render-graph derivation is the named post-engine reopen and lands above the RHI, never inside it. |
| #92 | UNORM-family swapchain formats with platform-default color tags, zero conversion in the present pass, sRGB encoded once upstream; an unavailable pairing fails loud, since present is off the hashed path. |
| #93 | A fullscreen-triangle pass on all three backends, a format-adapting passthrough over the already-tonemapped hashed target, never a blit. |
| #94 | Adapter selection is override-first with a discrete-first, stable vendor-and-device-identifier default; adapter and driver logged in every run header; the Windows compile-only leg compiles the D3D12 backend source from S03 onward and executes nothing. |
| #95 | One fixed-layout `ParameterBlock` per draw, variants by data discriminant, per-pass and per-draw granularity on the internal prototype's precedent, conditioned on S01's ParameterBlock-only rule. |

## Gates

### What `just check` grows

- **The render3d smoke test.** Both paths execute: the headless path
  renders the test frame into the offscreen target with no window and no
  swapchain, and the windowed path is exercised as far as a hosted runner
  allows. It asserts execution and interface behavior, not pixels. It
  also drives the viewport surface family over the readback transport,
  which is the whole reason that transport is implemented here rather
  than deferred: it gives the family a leg that runs on a hosted runner
  instead of one that only compiles.
- **The transition validator**, which is an assertion in a build with
  assertions live rather than a recipe of its own. A wrong declared
  transition fails the smoke test.
- **tier-scan's extended rule set**: only the platform tier and
  `engine/render3d/gpu` may name a graphics backend or SDL3, and
  `engine/render3d` naming either is a failure.

This spec adds no `just render-check`, no golden recipe and no parity
recipe. Those names belong to S04 and to S21's roster, and inventing one
here would put a second name on one gate.

### What `just shader-check` grows

The first product-shaped Slang shaders: the opaque pass's shader and the
present passthrough. They ride S01's cadence unchanged, which means
SPIR-V and MSL on every leg on every run and DXIL on the `windows-latest`
job alone, and they obey S01's ParameterBlock-only rule.

S01's seed shader stays what it was, a synthetic vendoring-validation
artifact. Map #88 recorded that S03's "first Slang shader" phrase is not
pinned to any disposition and read it as procedural residue; this
document takes the reading that S03's shaders are additional and
product-shaped, and records the absence of a ruling below rather than
claiming one.

### The Windows compile-only leg

Grows to compile this spec's Odin render tree and its seam-complete
D3D12 package, still running no tests and still saying so in its name.
Nothing in that leg's wording may imply D3D12 coverage or Windows
runtime coverage (D48).

### What does not gate here

No golden of any kind, no readback tier, no parity gate and no cross-
backend comparison. S04 lands the first three and S21's roster owns the
fourth. The windowed present on the dev machine is a human checkpoint,
which is the honest classification for a check no hosted runner can make.

## Implementation order

Suggested, not binding; `/to-tickets` owns the breakdown.

1. `engine/platform_sdl`: window, event pump, native surface handles,
   with the headless path taking none of them.
2. Device creation and adapter selection, plus the run header that logs
   the chosen adapter and driver. Everything later opens on a device, and
   the header is what makes every later run attributable.
3. The capability enumeration, including every reserved and absent entry,
   before any consumer of a capability exists.
4. Resources: buffers, textures, the offscreen color attachment and its
   depth buffer.
5. The command-list shape with caller-declared transitions, and the
   debug-build validator with it.
6. Pipelines from the pinned compiler's artifacts, and the opaque pass's
   Slang shader under `shader-check`.
7. `engine/render3d`: the draw-list struct stream and the monomorphic
   block layout, backend-free and testable without a device.
8. `engine/render3d/gpu` walking the list into backend calls: Vulkan
   first, then Metal.
9. The offscreen-only present target and the headless smoke path.
10. The swapchain present target, the present pass and the format policy.
11. The viewport transport surface family and the readback fallback.
12. tier-scan's extended rules.
13. The D3D12 package as a seam-complete stub: every entry point the
    other two backends implement, declared with its real signature and a
    typed unimplemented body, compiling under MSVC on the Windows leg.

Two ordering constraints are more than convenient. Step 5 before step 8's
second backend, because a validator written after two backends already
work is a validator shaped by what happens to pass. And step 7 before
step 8, because a draw list designed while a backend walk is being
written against it acquires the backend's shape, which is the failure
D42 rejected wgpu-then-swap to avoid.

## Exit checklist

- [ ] A headless run renders the test frame with no window, no swapchain
      and no window-system connection, green on both CI platforms.
- [ ] The windowed run opens a window and presents the same frame on the
      dev machine (human checkpoint).
- [ ] The smoke test asserting both paths execute is green in
      `just check` on both CI platforms.
- [ ] The present path contains no blit and no copy on any implemented
      backend, demonstrated rather than asserted in prose.
- [ ] One Slang source serves the present pass on both implemented
      backends, with no per-backend gamma branch.
- [ ] A swapchain request for an `_SRGB` variant is refused, and an
      unavailable format-and-color-space pairing fails at creation with a
      named reason rather than substituting.
- [ ] The per-draw block is one fixed layout across every permutation the
      draw list can name, and a deliberate second block shape fails.
- [ ] A deliberately wrong declared transition fires the debug validator,
      demonstrated on both implemented backends.
- [ ] Every reserved capability answers its query with absent, and a call
      into an absent capability is refused rather than partially served.
- [ ] An explicit adapter override is honoured, and the default names the
      same adapter across repeated runs on a multi-adapter machine.
- [ ] Adapter and driver version appear in the run header of both a
      headless and a windowed run.
- [ ] tier-scan fails a deliberate graphics-backend call from outside the
      platform tier and `engine/render3d/gpu`, and fails a deliberate
      SDL3 call from `engine/render3d`.
- [ ] The recorded draw list carries no backend handle, no negotiated
      swapchain format, no adapter identifier and no present-target kind,
      checked mechanically in a form S04 can grow into its skeleton hash.
- [ ] The present pass, the swapchain transitions and the transport
      export barrier are all recorded outside the list the skeleton hash
      will cover.
- [ ] The viewport surface family's vocabulary is present and fully
      typed, and reports absent with a named reason where an OS exporter
      is unsupported.
- [ ] A frame crosses a process boundary through the readback transport
      end to end on both CI platforms, exercising acquire, publish,
      open, latest, release and close rather than only compiling them.
- [ ] An adapter-identity mismatch in the token is refused by name
      rather than crashing or tearing, and a dead producer surfaces at
      the consumer as a refused call.
- [ ] `just shader-check` green on this spec's shaders under S01's
      cadence.
- [ ] The Windows compile-only leg compiles the Odin render tree and the
      D3D12 package, runs no tests, and its name says so.
- [ ] The D3D12 package is seam-complete: every entry point the Vulkan
      and Metal packages implement is declared there with its real
      signature, demonstrated by removing one entry point from the seam
      and watching the Windows leg fail to compile.
- [ ] Every open question below either answered on a ticket or carried
      forward explicitly, never dropped.

Reaching **implemented** is the maintainer's call once this checklist is
clear and the gate is green.

## Course

Module S03; path tag engine. Teaches the SDL3 platform layer, the
in-house rendering interface, and the draw-list render core against the
offscreen test frame. Authored after **implemented**, per D27.

## Prototype ports

The D2 boundary pattern, a backend-free core behind a thin GPU stratum
with a boundary-scan gate, rebuilt over the in-house interface rather
than ported line for line. The monomorphic parameter-block discipline
comes with it (#95): the discipline ports, the byte layout never does,
because the internal prototype's block is a hand-designed 2D toggle.
Ports are test-first from a source to read, never a target to converge
with (D38).

## Open questions

The seven children of map #88 are all closed and none of the following
reopens one. These are the residue: what the map itself recorded as not
yet specified, what a resolution comment settled in shape but not in
depth, and what drafting this document surfaced.

- **Resize semantics for the viewport surface.** Named unshown in #89's
  own sketch and the most frequent live operation this capability will
  ever see. A resize invalidates every image and both timelines and needs
  a fresh token round trip while the consumer keeps drawing the old size.
  Shape B makes the mechanism one recreate plus a new token; what is not
  settled is who initiates, what the consumer is entitled to see between
  the old token and the new one, and whether the producer blocks. The
  disposition on #89 chose the shape and did not answer this.
- **Present-pass behavior when the window and the target disagree in
  size.** The offscreen target's dimensions are scene state and cannot
  follow the window, per the resources section above, so a windowed run
  will routinely present a target whose size is not the window's. Whether
  the present pass letterboxes, stretches or crops is entirely off the
  hashed path and entirely unruled.
- **The draw list's exact field layout** and the block's slot
  assignments, which #95 explicitly left to this spec and which nothing
  since has fixed. With it, where the boundary sits between a
  discriminant lane inside a shared block and a distinct pipeline id;
  S06 owns the permutation set that decides it.
- **The field-level hash policy for a block mixing ordinal and float
  data.** S04's definition excludes floats and this spec's block mixes
  both. The internal prototype never had a draw-list hash to satisfy, so
  there is no precedent to mine. S04 owns the definition; this document
  names the obligation so S04 does not discover it.
- **Whether S03's "first Slang shader" is a second artifact** or a
  restatement of S01's seed. Map #88 recorded this in its own "not yet
  specified" list, judged it procedural residue rather than a question
  worth slicing into a child, and left it unpinned. The gates section
  above takes the additional-and-product-shaped reading; no disposition
  backs it.
- **The run header's shape and where it lives.** #94 requires the adapter
  and driver version in it. Nothing in the decision log,
  [`docs/context/CONTEXT.md`](../context/CONTEXT.md) or any landed spec
  defines what a run header is or what else it carries, so this spec uses
  vocabulary that carries no defined sense yet. The glossary owns the
  answer before the code that writes one lands.
- **The two senses of "off-hash."** The glossary defines it for sim state
  excluded from `hash_world` (D11, D5). Map #88 and this document use it
  for the render tier's meaning, presentation output that no gate hashes.
  The glossary already pins several words that carry two senses, and this
  one belongs on that list or needs a distinct term.
- **Whether the editor coordinates adapters or falls back.** Cross-
  process opaque handles require one physical device, so either the
  worker's adapter selection becomes a function of the editor's through
  the override-first mechanism, or mismatch-then-readback is the
  contract. S16b's to answer; named here because #94 supplied the
  mechanism and #89 supplied the failure mode, and neither chose.

Four items are deferred to a named owner rather than left open:

- **The skeleton hash's definition, the readback tier and the parity
  gate** are S04's. This spec makes them possible and records none of
  them.
- **The D54 resolve chain** is S06's. This spec fixes the present pass so
  that sRGB encoding still happens exactly once when the chain lands.
- **The D3D12 implementation and its rig gates** are S03b's, per D48.
- **The render-graph layer** that would derive barriers is the named
  post-engine reopen on #91, landing above the RHI. D55's roster does not
  currently record it, which is a gap in the roster rather than a gap in
  the ruling.

Four points where this document went past map #88 were settled by
maintainer micro-ruling at landing (2026-07-31) and live in the
normative text above rather than here: the D3D12 package's bound as a
seam-complete stub, the transport's depth as a fully typed family with
CPU readback its one implemented transport, the skeleton-hash boundary
clause placing the recorded stream's end at the offscreen target, and
per-pass plus per-draw blocks from day one.
