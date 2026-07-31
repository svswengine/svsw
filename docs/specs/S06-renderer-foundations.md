# S06 — Renderer foundations: pipeline cache, culling, materials, camera

Normative text for S06. The [spec index](README.md) records this spec's
rung and nothing else duplicates it (D37).

- **Stage:** 1 — Renderer, Forward+ staged
- **Status:** spec written
- **Depends on:** S04
- **Decisions:** [D8](../decisions/D008-forward-plus-lighting.md),
  [D54](../decisions/D054-color-pipeline.md),
  [D55](../decisions/D055-post-engine-substrate-roster.md). Five more bind
  clauses of this spec without appearing in the row and are cited where
  they decide something: [D42](../decisions/D042-in-house-rhi-slang.md)
  for the interface every pass here records into,
  [D22](../decisions/D022-dual-mode-parity.md) for what the resolve chain
  must leave comparable, [D11](../decisions/D011-animation-off-hash.md)
  for the off-hash posture the camera, the debug overlay and the reload
  path all take, [D1](../decisions/D001-determinism-by-construction.md)
  for why a cull decision is not free-floating render math, and
  [D46](../decisions/D046-luau-deterministic-sim-surface.md) for the
  deterministic scalar base the operations this spec adds are built on.
- **Normative references:** none

## Goal

The substrate the rest of the renderer family is written against. S03
landed a skeleton that draws one opaque pass into one offscreen target;
this spec turns that skeleton into a renderer with materials, lights, a
camera and a color pipeline, and it does so at the last rung where those
shapes can still be chosen freely. Everything downstream inherits them:
S07's cascades hang off this camera and this light array, S09 benchmarks
this draw-list build, S10 replaces this spec's light iteration without
touching its representation, S12a's importer replaces this spec's
procedural materials, and S13, S22 and S23 all consume the one debug-draw
path this spec builds rather than inventing three.

Two things make this spec heavier than its title suggests. The first is
D54: the color pipeline lands here, ahead of the Milestone A goldens,
and once it lands every readback golden in the repository is a function
of the operator and the constants this spec freezes. The second is that
the spec's row carries no prototype ports. There is no reference
implementation to adapt, so every shape below was chosen on map #113
rather than recovered from working code.

The load-bearing sentence is D54's. The renderer shades into an HDR
offscreen target and resolves through one fixed tonemap operator to the
sRGB target that D22 hashes, presents and reads back. S03 already fixed
the present pass so that when the chain lands, sRGB encoding still
happens exactly once. This is the spec that lands it.

## Working software

A multi-object PBR scene with opaque and transparent draws passes the
world-hash, skeleton-hash, readback and parity tiers on both CI
platforms. It is lit, unshadowed, by three things together: one
directional sun, the hemisphere ambient, and the bounded point-and-spot
array. A camera-rig test scene exercises both rigs and a continuum
interpolation between them.

S04's cube goldens are re-recorded in the same change, under the new
pipeline, as an explicit item rather than as a side effect (#119).

Green here means the four tiers hold on this spec's own scenes and that
the re-record happened where a reader can see it. It does not mean the
constants are final in any sense other than frozen: the hemisphere
ambient and the tonemap's own inputs are tuned against this scene at
implementation and freeze in the same commit that records the goldens,
after which moving one is a deliberate re-record ritual and never a
tuning session.

## Decisions in force here

The row's `Decisions` field names three. Each is cited below at the
point it decides something, and five more are named because they bind
clauses of this spec that the row's field does not record.

- **D8, Forward+ PBR staged.** glTF metallic-roughness materials
  as-authored, which is the phrase the material system and the alpha-mode
  axis are both conditioned on. D8 also stages the lighting: the sun's
  cascades are S07's and clustered culling is S10's, so this spec
  carries the light representation both of them build on, the sun
  included, and neither of their passes.
- **D54, the color pipeline fixed before Milestone A.** The reason the
  resolve chain lands here rather than in a later post-processing spec,
  and the decision that assigns the operator and the v1 ambient term to
  this spec's grilling by name. Both are settled below.
- **D55, the post-engine substrate roster.** Four of this spec's
  deferrals are D55's rather than this spec's own preference: VFX,
  image-based lighting and global illumination, and mesh LOD and
  occlusion culling. Engine-scope culling is frustum-only, and that is
  D55's wording, not a scope call available to this spec.
- **D42, the in-house RHI with Slang shaders.** Every pass here records
  into S03's interface: monomorphic per-pass and per-draw parameter
  blocks, caller-declared transitions, one command-list shape. The
  interface is consumed, never renegotiated.
- **D22, dual-mode parity.** The resolve chain writes the one target
  both modes hash, present and read back. This is the first spec whose
  own gate runs all four tiers, so D22 stops being an obligation this
  spec preserves for a later gate and becomes a gate this spec passes.
- **D11, presentation-only state is off-hash.** The pattern the camera,
  the debug overlay and the shader reload path all follow: they read sim
  state, they never write it, and no golden is a function of them.
- **D1, determinism by construction.** Cited for one specific thing: the
  frustum-cull decision and the transparent sort both determine what the
  skeleton hash records, so neither is free-floating render math. The
  boundary this draws inside "render-side math" is stated below.
- **D46, the deterministic scalar base.** S02b built the engine's own
  `f64` transcendentals for D46's sake. The operations this spec adds to
  the policed surface are built on that base rather than on a platform
  library, for the same reason.

### What S06 owns that S07 does not reopen

The ambient term's shape and value are frozen here, once, for both
specs. S07's own grilling asked whether it re-verifies the constant once
real cascaded shadows exist and answered that it inherits it unchanged
(#112: "one freeze, one owner"). D54 wrote the ambient clause for S07's
Milestone A goldens, and the wayfinding roadmap paired the two specs in
one period precisely so the constant would be settled once. This spec is
where it is settled, and S07 records its goldens against it as an
inherited constraint.

The same ownership covers the tonemap operator, its constants, and the
readback threshold re-derived against the resulting curve. A later spec
that wants a different operator is asking for a re-record of every
golden recorded from here onward, which is the cost D54 exists to price
rather than discover.

## Scope in

- `engine/simmath3d` growth, one operation at a time under S02b's
  cross-CPU gate, for whatever this spec's culling, camera and material
  math needs that S02b's inventory does not already carry. Every added
  operation ships with its canary sentinel; S02b's rule that an
  operation without a sentinel is not shipped binds here unchanged.
- The pipeline cache and its permutation key: three axes, twelve
  pipeline ids, six compiled shader modules, specified below (#114).
- Frustum culling, and only frustum culling. Mesh LOD and occlusion
  culling are D55's post-engine roster.
- Pass structure: a depth-buffered opaque pass ordered for state
  coherence, then a back-to-front transparent pass, both into the HDR
  target.
- A material system consuming glTF metallic-roughness values
  as-authored, with a procedural in-engine test material set standing in
  until S12a's importer exists (#115).
- One bounded per-pass light array carrying point and spot lights in one
  struct with a type lane, its maximum a compile-time assertion (#117),
  plus one unshadowed directional sun as a per-pass uniform outside that
  array (maintainer micro-ruling at landing, 2026-07-31).
- The camera: one shared camera state, two pure-function rigs over it,
  the continuum as interpolation in that state, and inverse-VP ray
  picking derived from the state alone (#116).
- The D54 resolve chain: an `RGBA16F` HDR offscreen target, one fixed
  tonemap operator, and a shader-side sRGB encode into the plain
  `RGBA8 UNORM` target S03 already fixed the present pass around. The
  operator is Khronos PBR Neutral and the ambient term is a hemisphere
  constant (#118, #120); both formats and the encode's home are fixed
  by maintainer micro-ruling at landing (2026-07-31).
- The off-hash debug-draw layer: geometric primitives, lines and shapes,
  submitted per frame, composited after the resolve, windowed-only,
  outside the skeleton hash and both parity legs by construction (#121).
- A shader live-reload path: watch-recompile through S01's pinned Slang
  binary with pipeline-cache invalidation at a deterministic frame
  point, dev-only and off-hash.
- The one-time re-record of S04's cube goldens as an explicit exit item
  (#119), and the re-derivation of S04's readback threshold against this
  spec's frozen curve.

## Scope out

- Shadows of any kind, the sun's included. S07 owns cascaded shadow maps
  over this substrate, and no shadow map, shadow pass or shadow sampling
  path lands here.
- Clustered light culling. S10 replaces this spec's light iteration and
  inherits its representation unchanged (#117).
- Asset import. Scene data stays hardcoded or trivially embedded until
  S12a, and this spec invents no file format and no temporary loader
  (#115).
- Skinned animation. The skinned axis exists in the permutation key from
  day one because retrofitting an axis into a key that already has
  goldens is the churn the fixed set exists to prevent, but no animated
  consumer exists until S25.
- Debug-draw text chips. The layer ships geometric primitives only at
  this rung; chips arrive with the first spec that owns a glyph source
  (maintainer micro-ruling at landing, 2026-07-31).
- Anti-aliasing, out of v1 scope per D54.
- Presentation VFX, image-based lighting and global illumination, and
  mesh LOD and occlusion culling: all D55's post-engine roster, all
  named here so a reader can tell deferred from forgotten. The ambient
  term stays inside D54's cap of a flat or hemisphere constant, which is
  the same boundary read from the other side.
- Display-side HDR output. D55 as amended puts it post-engine, and the
  HDR in this spec's chain is an internal working space that never
  reaches a display.
- Perf budgets and gates. S09 owns `just stress` and its p95 budgets,
  and this spec adds no perf gate and no budget of its own.
- Any change to S03's RHI surface: the present pass, the swapchain
  format policy, the capability enumeration, the caller-declared
  transition model and the monomorphic block discipline are consumed as
  landed.

## The pipeline permutation set

The governing ruling is #114, settled by maintainer reaction to a
throwaway prototype that compiled the axis set both ways through S01's
pinned toolchain. Two things were decided together: the mechanism, and
whether alpha mask earns its own axis in v1.

### Mechanism: separately compiled monomorphic entry points

Permutations are separately compiled entry points, one monomorphic body
each, with no specialization-constant branch and no runtime branch on a
permutation discriminant. S03 offered two selection mechanisms, a data
discriminant inside the shared block or a pipeline id across a fixed
permutation set, and this spec lands on the second.

Three findings from the prototype decide it, and the middle one is the
reason:

- **The axis set is small and closed.** The row's own wording fixes it,
  and the prototype measured the cost: because the axes are
  stage-disjoint, the full logical set needs six compiled modules rather
  than the cartesian product. The scaling argument for specialization
  constants matters when a permutation set is open-ended, which this one
  is not.
- **`slangc` leaves gated branches live.** Under specialization
  constants the compiler emits every branch as ordinary guarded code,
  including the mask path's discard and the lit path's light loop.
  Elimination happens at pipeline-build time against a live device, and
  S01 scoped `shader-check` to `slangc` alone with no device opened
  (#56). So the property that an unlit module contains no light loop and
  an opaque module contains no discard is verifiable offline under
  separate entry points and not verifiable at all under specialization
  constants. That is a gate this repository already runs versus a gate
  it would have to build.
- **Specialization constants force a superset vertex layout.** A
  constant gates a branch inside a fixed function body and cannot
  reshape the entry point's parameter list, so a single vertex entry
  must declare the skinned attribute set on every static draw. S03
  sanctions inert lanes inside a uniform block; it never contemplated
  forcing them onto the vertex input binding, and the skinned axis is
  where that difference bites.

### The twelve pipeline ids

Three axes, each closed:

| Axis | Values | What it changes |
|---|---|---|
| Skinning | static, skinned | The vertex entry point and the vertex input attribute set |
| Shading | lit, unlit | The fragment entry point |
| Alpha | opaque, mask, blend | The fragment entry point (mask) and the pipeline's blend state (blend) |

Two by two by three is twelve pipeline ids, and twelve is the whole of
what the cache holds and the skeleton hash can record:

| id | Skinning | Shading | Alpha | Vertex module | Fragment module | Blend state |
|---|---|---|---|---|---|---|
| 0 | static | lit | opaque | static | lit-opaque | off |
| 1 | static | lit | mask | static | lit-mask | off |
| 2 | static | lit | blend | static | lit-opaque | on |
| 3 | static | unlit | opaque | static | unlit-opaque | off |
| 4 | static | unlit | mask | static | unlit-mask | off |
| 5 | static | unlit | blend | static | unlit-opaque | on |
| 6 | skinned | lit | opaque | skinned | lit-opaque | off |
| 7 | skinned | lit | mask | skinned | lit-mask | off |
| 8 | skinned | lit | blend | skinned | lit-opaque | on |
| 9 | skinned | unlit | opaque | skinned | unlit-opaque | off |
| 10 | skinned | unlit | mask | skinned | unlit-mask | off |
| 11 | skinned | unlit | blend | skinned | unlit-opaque | on |

The numbering in the left column is illustrative of the packing rather
than normative; what is normative is that the key is exactly these three
axes, that twelve is the full set, and that the id is an ordinal derived
from the key by a fixed packing that never depends on discovery order.

Six modules cover the table: two vertex, four fragment. **Blend adds no
module.** A blend pipeline names the same fragment module as its opaque
counterpart and differs only in the pipeline object's blend state, which
is why the alpha axis costs three values and four fragment modules
rather than six. Mask's marginal cost over a blend-only v1 was measured
rather than estimated: four more pipeline ids and two more compiled
modules, both demonstrated compiling clean.

### Why mask earns its axis

D8 commits the material system to glTF metallic-roughness values
as-authored, and glTF's own `alphaMode` is a three-value enum. A
blend-only v1 would not merely narrow scope; it would make "as-authored"
false for any material naming the mask mode, forcing either a remap to
blend, which is a visible sorting and blending difference baked into
every golden recorded afterwards, or a silent drop of mask-authored
materials from the as-authored promise. Against a measured, bounded,
already-green marginal cost, that is the wrong place to save scope.

### The cache and its key

The cache maps the permutation key to a built pipeline object. Four
properties bind it:

- **The key is ordinal.** Three small enumerations packed into one
  integer, with no float, no pointer, no handle and no string in it.
  This is what lets the id enter the skeleton hash, whose definition
  excludes floats.
- **The cache is backend-side and the draw list never names it.** A
  draw carries a pipeline id, which is a value derived from the key, and
  never a cache entry, a pipeline object or a backend handle. S03's
  backend-free rule already requires this; the consequence worth stating
  is that cache warmth cannot perturb the skeleton hash, because nothing
  the hash covers is a function of the cache's state.
- **All twelve build eagerly at device initialization, and the cache
  never evicts.** #114 fixed the permutation set and left the cache's
  build policy to be derived from it; a maintainer micro-ruling at
  landing (2026-07-31) blesses the derivation as normative. The set is
  fixed and finite, so a shader that fails to build fails at startup
  rather than at first draw, and no golden under any tier is a function
  of cache state, because eager and never-evicting together mean the
  cache has no state to be in: warm and cold are the same cache.
- **A thirteenth id is unrepresentable.** The key's type admits exactly
  the twelve combinations above. Growing the set is a deliberate change
  to this spec's key, priced as the golden re-record it is, rather than
  a value that slips in.

Live reload is the one thing that rebuilds cache entries after startup,
and it does so at a deterministic frame point under the rules in its own
section below.

## Materials

### Parameterization

The material carries the glTF metallic-roughness parameter set
as-authored: base color factor and its texture, metallic and roughness
factors and their texture, normal texture, emissive factor and its
texture, the alpha mode, and the alpha cutoff that the mask mode reads.
As-authored means no engine-side remap of any of them, which is D8's
wording taken literally: a value that arrives as authored is shaded from
as authored, and the one place a material's authored data changes the
pipeline rather than the shading is the alpha mode, which selects the
pipeline id.

Two lanes of the material sit in different places, and the split follows
S03's block discipline rather than convenience. The alpha mode is part
of the pipeline key, because it changes the fragment module or the blend
state. Everything else, the cutoff included, rides in the per-draw
parameter block, one fixed layout across every permutation the draw list
can name. A material that does not read a bound resource still binds
one, because the bind shape never forks on content (#95).

### The procedural test set

Until S12a lands `tools/assetc` and the asset container, test materials
are generated procedurally in-engine at startup: checker albedo, and
constant or gradient metallic-roughness (#115). No file format is
invented, no temporary loader is written, and nothing this spec builds
is code S12a has to delete rather than replace.

Two properties are normative rather than incidental:

- **Generation is deterministic by construction.** The generated texel
  data and material values are a function of fixed constants and integer
  arithmetic, identical on every leg and every run. The readback goldens
  are recorded against these textures, so a generator that varied by
  platform would put a per-platform term inside a golden that S04's own
  axes say is one image scored per device.
- **The consumer pattern is what S12a matches.** The material struct the
  shader binds and the render path reads is the same struct a baked
  material will populate. S12a replaces where the values come from and
  changes nothing about what consumes them, which is what keeps this
  shortcut from becoming a rewrite at S12a's landing.

## The camera

### Shape

One shared camera state and two pure-function rigs over it (#116). The
camera state is a single struct carrying position, orientation as a
quaternion, and the projection parameters: vertical field of view, near
and far planes, and aspect. It carries nothing rig-specific. There is no
rig-private state hidden behind an interface, no rig object with a
lifetime, and no camera subclass.

Each rig is a pure function from its own parameter set to that one
state. A top-down rig takes a focus point, a height and a yaw; a
first-person rig takes an eye position and a look direction. Both return
the same struct. Nothing about the returned state records which rig
produced it.

### The continuum is interpolation, not a mode

The top-down-to-first-person continuum is interpolation in the shared
state, never a mode switch. A transition evaluates both rigs, produces
two camera states, and interpolates between them: position by the
obvious componentwise path, orientation by quaternion interpolation,
projection parameters componentwise. There is no rig-swap event, no
transition state machine, and no instant during a transition when the
renderer holds anything other than one ordinary camera state.

This is the property S31 inherits and the reason the shape was chosen.
An API that swapped rigs would make every downstream consumer, ray
picking included, ask which rig is active. An API that interpolates
never presents that question, because the answer is never needed.

### Ray picking

Ray picking is derived from the camera state alone: the inverse of the
view-projection built from that state, applied to a normalized screen
coordinate. Because the state is rig-independent, picking is uniform
across both rigs and across a transition by construction, and there is
no rig-specific picking path for S22's gizmos or S23's selection to
special-case later.

### Off-hash, with one boundary

The camera reads sim state and never writes it, so it is off-hash in
D11's sense: no camera parameter, no rig parameter and no transition
progress is sim state, and none enters `hash_world`.

The boundary that is not off-hash is the cull decision, and it is stated
in the next section rather than here, because the camera is where the
frustum comes from.

## Culling, ordering and the hashed path

### Frustum culling only

Culling is frustum-only. That is not this spec's scope call to make
differently: D55 puts mesh LOD and occlusion culling on the post-engine
roster, and S09's stress scene is pinned to D4's few-chunk scale
specifically so a budget miss is never answered by scoping culling in.

### Why culling is not free-floating render math

S04's golden axes state that world and skeleton goldens stay
platform-invariant, one committed value verified on every leg. The
skeleton hash records draw order and counts. Frustum culling decides
which draws exist and the sort decides their order. Therefore the cull
decision and the sort order must be bit-identical on macOS arm64 and on
Linux x86-64, or the skeleton golden is not platform-invariant and the
tier that gates every renderer spec CPU-only stops gating.

This refines the row's own phrase that render-side math sits outside the
policed regime, and the refinement matters because the phrase is true of
most of this spec's math and false of exactly this part of it:

- **On the hashed path, and therefore policed:** the frustum planes
  derived from the camera state, the bounding-volume test against them,
  and the sort key and its comparison for the transparent pass. These
  determine what the skeleton hash records.
- **Off the hashed path, and therefore unpoliced:** everything the
  shader receives and everything the shader does. The view-projection
  matrix uploaded to the per-pass block, the per-draw transforms, the
  material values, the light values and every arithmetic operation in
  the six shader modules. These determine pixels, which the readback
  tier covers with a perceptual tolerance rather than a hash.

The narrow-to-`f32` boundary S02b fixed is what makes the split
mechanical: the policed side stays `f64` in simmath3d terms and the
narrowing happens at the draw-list build, on the far side of every
decision the hash records.

### Ordering

Both passes order deterministically, and neither order is a function of
container iteration order, allocation order or discovery order.

- **The opaque pass** orders for state coherence: by pipeline id first,
  then by material, then by a stable ordinal that admits no ties. Depth
  testing makes the visual result order-independent, which is exactly
  why the order must be pinned by something other than what happens to
  be fast, since nothing in the image would reveal a reordering while
  the skeleton hash would fail on it.
- **The transparent pass** orders back to front by distance along the
  view axis, with the same stable ordinal breaking every tie. The
  distance is computed on the policed side per the rule above, and the
  tie-break is what keeps two draws at equal distance from ordering
  differently on two platforms.

Depth write is on for the opaque pass and off for the transparent one;
both test against the same depth buffer.

## Lights

### The bounded array

One bounded per-pass light array (#117). Point and spot lights share one
struct with a type lane, and the array's maximum is a compile-time
constant carried in an `#assert` at the type's definition site, per
ODIN_STYLE A5.

The struct is monomorphic on the draw-list precedent (#95): one layout,
with the lanes a point light does not use present and inert rather than
absent. A point light carries the direction and cone lanes and ignores
them; a spot light reads them. There is no second light struct and no
variant union.

The array binds through the per-pass parameter block, once per pass,
outside the draw loop, which is the granularity S03 fixed for
pass-constant data. The bind shape never forks on content: a scene with
one light binds the same block, at the same size, as a scene at the
maximum. The live count is a lane inside the block.

Exceeding the maximum is an engine bug rather than input to be handled.
The submission path asserts the count against the compile-time maximum
and fails loudly, per ODIN_STYLE A8, since nothing at this rung is
script-supplied.

### The directional sun

**One unshadowed directional sun lands at S06**, and it sits outside the
bounded array rather than inside it (maintainer micro-ruling at landing,
2026-07-31). No disposition covered the sun's arrival point; this is
where it is fixed.

It is outside the array because it has no position. The array's struct
is monomorphic over point and spot, two kinds that both have a position
and differ in what they do with a cone, and the inert lanes #117
sanctions are inert that way. A directional light has no position at
all, so a third value on the type lane would carry a lane that is not
merely unread but meaningless, which is a different thing from the
inertness the struct was shaped around. So the sun rides the per-pass
parameter block as its own uniform, a direction, a color and an
intensity, bound once per pass beside the array and the live count.
There is exactly one of it: the block carries a single sun, not a second
bounded array.

**S07 adds the cascades over this same sun** and changes nothing about
where it lives or what it carries at this rung. The scene at S06 is
unshadowed because there is no shadow map, not because there is nothing
casting.

Putting the sun here costs no golden. S07's Milestone A goldens are new
recordings rather than re-records, and the only goldens recorded before
them are this spec's own and S04's re-recorded cubes, both of which are
recorded after the sun lands. A lit PBR scene needs a dominant
directional term to read as lit at all, and the alternative, deferring
it to S07, would have made this spec's own readback goldens a picture of
ambient plus local lights that S07 would then have had to re-record.

### What S10 replaces

The lit fragment path at S06 iterates the bounded array directly, with
no culling structure between the array and the shader. S10 replaces that
iteration with cluster-assigned indices into the same array. The
disposition on #117 states this as clustering replacing the culling
rather than the representation, and a maintainer micro-ruling at landing
(2026-07-31) blesses this document's reading of that disposition's
phrase "the tiled-culling pass indexes into the array" as normative: the
phrase names S10's machinery, not an S06 deliverable. No compute pass,
tiled or clustered, lands here, and S06's Scope out defers all of it to
S10.

The sun is outside that replacement as well. A per-pass uniform is not a
clustered light, so S10's culling has nothing to say about it.

## The resolve chain

### The chain

Four stages, in order:

1. **Geometry into the HDR offscreen target.** The opaque pass and the
   transparent pass both render into a linear high-dynamic-range color
   target, format `RGBA16F`, with the shared depth buffer. This target
   is new at S06.
2. **The tonemap resolve.** A fullscreen pass samples the HDR target,
   applies the fixed operator, and encodes sRGB in its own shader
   arithmetic before writing final bytes.
3. **The sRGB target.** The resolve's destination is the offscreen
   color attachment S03 created: the one D22 hashes, presents and reads
   back, format plain `RGBA8 UNORM`. S03's target keeps that role and
   stops being the geometry pass's render target. Its dimensions are
   still scene state rather than window state, and the HDR target
   shares them.
4. **Present, unchanged.** S03's fullscreen-triangle passthrough samples
   the sRGB target through a non-decoding view and writes the swapchain,
   performing no color math on either the sample or the write. Nothing
   in this spec touches it.

Two obligations ride with the chain, both inherited rather than new.
**sRGB encoding happens exactly once, and this spec is where.** S03
carried a narrower forward-looking version of that sentence because the
chain did not exist yet; here it is discharged. And what the viewport
transport family carries across a process boundary is this resolved
target, already tonemapped, so the editor's viewport and the readback
golden show the same image.

### The two formats, and where the encode lives

No disposition fixed either format, and a maintainer micro-ruling at
landing (2026-07-31) fixes both together with the encode's home, because
the three are one question:

- **The HDR offscreen target is `RGBA16F`.** A linear half-float target,
  wide enough for the working range a lit PBR scene produces before the
  curve is applied and narrow enough that one format serves the resolve
  on every backend.
- **The resolve's destination is a plain `RGBA8 UNORM` target**, and the
  resolve shader applies PBR Neutral and encodes sRGB itself before
  writing. **No `_SRGB`-format render-target view exists anywhere in
  this chain**, on the offscreen target or on the swapchain.

The reason is the one that fixed the operator (#120): a golden should be
a function of the shader source and of nothing else. A hardware `_SRGB`
view moves the encode into a format's behavior, where it becomes a term
in every readback golden that no reader of the shader can see and no
offline check can reach, which is the same objection that rejected a
baked lookup table. Encoding in the shader keeps the whole of the color
math on one readable, gated artifact. S03 refused the `_SRGB` variant for
its swapchain images on a different ground, that the hardware would
decode on read and encode on write around bytes already final (#92);
this chain extends that same UNORM policy inward to the target the
present pass samples.

Throughout this document "the sRGB target" names what that target holds,
sRGB-encoded bytes, rather than a format suffix it does not carry.

### The operator

The operator is **Khronos PBR Neutral**, fixed here for every golden
recorded from this spec onward (#118, with the evidence on #120). The
runner-up is recorded rather than discarded: a fitted ACES approximation
of the matrix-plus-rational-fit shape. Three properties decided it.

- **Closed-form and LUT-free.** The operator is shader arithmetic. **No
  baked lookup table enters the resolve chain.** A LUT would put a
  second versioned artifact between the shader and the golden, on top of
  the metric implementation version S04 already has to pin, and would
  add cross-backend LUT sampling behavior to a tier that already fights
  driver noise. The goldens depend on the shader source and on nothing
  else. The reference distribution ships a `.cube` file alongside its
  shader; that file is an authoring-tool approximation and is not what
  this repository's runtime samples.
- **Slope near one in the band where golden sensitivity matters.** The
  mapping is effectively identity below its shoulder threshold and
  departs from identity only above it. Cross-driver and cross-vendor
  variance in a lit PBR scene concentrates in specular highlights and
  filtered edges, which is above the threshold; a real material or
  lighting regression shows up as a shift in shadows and midtones, which
  is below it. The curve therefore damps noise where the noise is and
  leaves the golden sensitive where the bugs are. Every alternative
  surveyed compresses earlier and over a wider band, and the operators
  that compress everywhere suppress the gate's sensitivity along with
  the noise.
- **Built for this problem.** It is designed to keep an authored PBR
  material's hue and saturation rather than to impose a film emulation,
  and it is calibrated against the same dielectric constant the glTF
  metallic-roughness BRDF this spec implements already uses. An engine
  that has deferred image-based lighting and global illumination to
  post-engine and whose goal is showing materials as authored is asking
  for the least imposed look the pipeline can get away with.

The runner-up exists for one contingency named on #120: if the narrower
compression band proves insufficient once real specular highlights are
in frame. **The switch point is before the freeze.** After the goldens
record, switching operators is a re-record of every golden in the
repository, which is the cost D54 prices rather than discovers.

### The ambient term

The ambient term is a **hemisphere constant**, a sky color and a ground
color blended by the surface normal's vertical component (#118). It is
the better of the two shapes D54 permits, and it is chosen now
specifically so that no within-cap upgrade from a flat constant to a
hemisphere one ever re-records a golden later. Image-based lighting and
global illumination stay post-engine per D55 and D54's own cap, so the
hemisphere is the ceiling as well as the choice.

Its purpose is D54's: shadowed areas do not bake to black in the
Milestone A goldens. That purpose is S07's, which is why the term is
frozen here and inherited there rather than tuned twice.

### Where the constants freeze

The shapes are frozen by this document. The **values** are tuned at
implementation, against the real multi-object PBR scene, and freeze in
the same commit that records this spec's goldens. Three sets of numbers
are covered:

- the hemisphere's sky and ground colors,
- any pre-tonemap exposure or normalization scalar the real lit scene
  turns out to need before the curve is applied,
- the operator's own constants, if the reference defaults need
  adjustment against this engine's actual value ranges.

All three live in one named place in the source rather than scattered at
their use sites, and the commit that records the goldens is the commit
that freezes them. After that, changing any one of them is a golden
re-record under the deliberate reviewed ritual the golden-hashes process
defines, never a value edited in a dev loop: D36 already bars goldens
from being re-recorded from the dev loop, and these constants are the
reason that rule has teeth in the render tier.

### The readback threshold is re-derived, not inherited

S04 settles the metric: FLIP, percentile-scored, with the threshold
derived empirically against the lavapipe baseline and a per-pixel diff
as the named fallback. That mechanism is a given here and this spec does
not reopen it.

What this spec owes it is the derivation. S04's threshold is derived
before any concrete tone curve exists, and a threshold is a statement
about a distribution of differences measured on the resolved image,
which is exactly the image this spec's curve shapes. So the threshold is
re-derived against the frozen curve as part of this spec's gate rather
than inherited from a derivation that predates the curve. The value
itself is an open question below, because it is a measurement and not a
choice.

## Debug draw

The debug-draw layer takes geometric primitives, lines and shapes,
submitted per frame, and composites them **after the resolve, onto the
presented image, in windowed runs only** (#121). Four consequences, and
they are one property stated four ways:

- **Absent in headless.** A headless run has no present-target acquire,
  so there is nothing for the overlay to composite onto and the overlay
  never executes.
- **Structurally incapable of touching the offscreen target.** The
  layer's only destination is the swapchain image. It has no path to the
  HDR target or to the sRGB target, and this is a property of what the
  submission API can address rather than a rule callers follow.
- **Outside the skeleton hash.** S03 fixed the recorded stream's end at
  the offscreen target: everything from the present-target acquire
  onward is recorded outside the list the skeleton hash covers. Debug
  draw composites after that boundary, so it is outside the hash by the
  same clause that excludes the present pass itself, and no flag is
  needed to make it so.
- **Outside both parity legs.** D22 compares a headless run against a
  windowed run on the resolved image. Debug draw cannot alter that image
  in either mode, so the comparison is unperturbed by construction
  rather than by the parity runner remembering to disable something.

It is off the world hash for the same reason everything else here is: no
debug-draw submission is sim state and no submission path can write sim
state.

**Why one layer rather than three.** S13 visualizes collision volumes,
S22 draws editor gizmos and S23 draws selection affordances. The row's
own scope-in reason for building this at S06 is that those three specs
consume one path instead of inventing three, and the contract they
inherit is the one above rather than one they renegotiate. The editor
case works through the same rule from the other side: the editor's
viewport receives the resolved target across the process boundary and
composites its own overlays on its own side of that boundary, which is
the arrangement S03 already described for viewport consumers.

### Text chips are deferred

**S06's layer draws no text** (maintainer micro-ruling at landing,
2026-07-31). The row's scope-in wording named text chips alongside lines
and shapes; the chips are deferred and the geometric primitives ship
alone.

A chip needs glyphs, and no spec at or before this rung owns a glyph
source. S16 is where a font arrives with the ImGui substrate, and S13,
S22 and S23, the three consumers this layer exists for, all land after
it. Committing to chips here would commit to a glyph source this spec
would have to invent and S16 would then replace, which is exactly the
delete-rather-than-replace shortcut the procedural material set was
shaped to avoid. D55's post-engine deferral of in-world text rendering
does not reach a debug overlay, so nothing else was holding the
commitment up.

Chips arrive with the first spec that owns a glyph source, added to this
layer rather than built beside it, and the submission contract above is
what they are added to. Nothing else about the layer changes when they
do: a chip composites where a line composites, after the resolve, in
windowed runs only, and off every hash by the same boundary.

## Shader live reload

A dev-only path watches the shader sources, recompiles through S01's
pinned Slang binary, and swaps the rebuilt modules into the pipeline
cache. Four rules bind it:

- **The same compiler as the gate.** Recompilation runs the pinned
  v2026.14 binary that `just shader-check` runs, so a reloaded shader
  and a gated shader come from one compiler. This is the one place in
  the engine where a shader compiler runs during a run; S03's rule that
  nothing compiles a shader at runtime was scoped to S03 and this path
  is the named exception rather than a contradiction of it.
- **Invalidation at a deterministic frame point.** Cache entries are
  rebuilt and swapped between frames, at one fixed point in the loop,
  never mid-frame. A frame is drawn entirely with one pipeline set or
  entirely with the next.
- **Dev-only, and absent from gated builds.** The path is not present in
  any build a gate drives. A golden is never recorded from a run with
  reload active, which is the render-tier reading of D36's rule that
  goldens are never re-recorded from the dev loop.
- **Off-hash.** A reload changes pixels and nothing else. It writes no
  sim state, so it does not mark a session dev-diverged in D36's sense
  as widened by D60, both of which speak to behavior-changing rebuilds
  and script reloads. No disposition covers this reading; it is recorded
  as an open question below rather than claimed as settled.

## Gates

### What `just check` grows

- **The multi-object PBR scene** through all four tiers on both CI
  platforms: world hash, skeleton hash, readback, and `just
  parity-check`. This is the first gate in the repository that runs all
  four on a scene with materials and lights.
- **The camera-rig test scene**, exercising both rigs and an
  interpolated state between them, plus the ray-picking derivation. The
  rigs are pure functions over a plain struct, so the rig half of this
  is testable with no device at all and should be tested that way.
- **The added simmath3d operations**, each with its canary sentinel
  riding S02b's cross-CPU gate. S02b's completeness check, which fails
  when an exported operation has no sentinel, covers the additions
  without changing shape.
- **The debug-draw invariance assertions**, stated in the exit checklist
  below: submissions present in a headless run change no golden, and
  submissions present in a windowed run change no hash.

This spec adds no new recipe name. `render3d-golden-check` and `just
parity-check` are S04's and grow scenarios here; naming a second gate
for the same job is what S03 refused for the same reason.

### What `just shader-check` grows

The six permutation modules, the tonemap resolve shader, and the debug
overlay's shader. All ride S01's cadence unchanged: SPIR-V and MSL on
every leg on every run, DXIL on the `windows-latest` job alone. All obey
S01's ParameterBlock-only rule, which S01 records as binding every
engine-era shader this repository compiles, S06 onward included.

One check is new in kind rather than in cadence. Because permutations
are separately compiled, the property that an unlit module contains no
light-loop code and an opaque module contains no discard is a mechanical
property of the emitted artifact, checkable offline with no device. That
check is what the mechanism was chosen to buy (#114) and it belongs in
this gate rather than in a reviewer's attention.

### The re-record, as an explicit item

Landing the resolve chain changes the pixels of every scene recorded
before it, and D54 already accepts the one-time re-record of S04's cube
goldens. The mechanical question #119 settles is where that shows up,
and the answer is an explicit exit-checklist item rather than a side
effect of some other step.

**How it splits across the three tiers is a maintainer micro-ruling at
landing (2026-07-31)**, blessing what this document derived from #119
rather than read out of it. #119 settles the visibility; the split is
settled here:

- the **readback golden re-recorded**, because the resolve changes the
  pixels;
- the **skeleton golden re-recorded**, because the resolve pass and the
  twelve-id key both sit inside the recorded stream;
- the **world hash asserted unchanged**, checked rather than
  re-recorded, because nothing this spec adds is sim state.

The third is the load-bearing one. A world hash that moved at this
landing is a bug in this spec rather than a golden to refresh, and
stating the tier as a re-record would have made the bug invisible by
turning the check into a refresh. It is restated tier by tier in the
exit checklist below.

### What does not gate here

No perf budget and no perf recipe: S09 owns those, and S07's own grilling
already settled that its perf iteration stays informal until S09 exists
(#111). No shadow gate, no cluster gate, no asset gate. The Windows
compile-only leg compiles this spec's tree and runs nothing, and nothing
in this document's wording may imply D3D12 runtime coverage (D48).

## Grilling dispositions

Settled on the children of wayfinder map #113, all closed. Each is
normative here.

| # | Disposition |
|---|---|
| #114 | Separately compiled monomorphic entry points, not specialization-constant branches: stage-disjoint axes mean six modules cover the full logical set, with no superset vertex layout and no branch the shader gate cannot see eliminated. Alpha mask earns its v1 axis, giving opaque, mask and blend per glTF's own three-value enum, and twelve pipeline ids. |
| #115 | Procedural in-engine test materials, checker albedo with constant or gradient metallic-roughness generated at startup. No file format invented, no temporary loader written, deterministic by construction; real glTF materials arrive with S12a. |
| #116 | Pure-function rigs over one shared camera state. Each rig maps its own parameters to one camera-state struct; the continuum is interpolation in that shared space, never a mode switch. Camera state reads sim state and never writes it, so it is off-hash. |
| #117 | One bounded per-pass light array with a compile-time maximum asserted per ODIN_STYLE A5. Point and spot share one struct with a type lane, monomorphic on the draw-list precedent. Clustering later replaces the culling, not the representation. |
| #118 | The ambient term is a hemisphere constant, the better of D54's two allowed shapes, frozen now so no within-cap upgrade ever re-records goldens. The tonemap operator is Khronos PBR Neutral, with a fitted ACES approximation the recorded runner-up. Exact constants are tuned at implementation and freeze with the goldens. |
| #119 | An explicit exit-checklist item. The one-time re-record D54 accepts is demonstrable at this spec's exit, never silent inside an implementation step. |
| #120 | PBR Neutral is evidence-supported: closed-form, LUT-free, and near-identity below its shoulder, which is where golden sensitivity matters and where cross-driver noise does not concentrate. LUT-dependent operators are rejected for adding a second versioned artifact between the shader and the golden. |
| #121 | Debug draw composites onto the presented image after the hashed resolve: windowed-only, absent in headless, structurally incapable of touching the offscreen target, and therefore outside the skeleton hash and both parity legs by the same boundary that excludes present itself. |

## Implementation order

Suggested, not binding; `/to-tickets` owns the breakdown.

1. The simmath3d additions this spec needs, each with its canary
   sentinel under S02b's gate. Everything below computes with them.
2. The camera state, the two rigs and the ray-picking derivation. Pure
   functions over a plain struct, testable with no device.
3. Frustum culling, the opaque and transparent partition, and both
   orderings. Backend-free, testable with no device, and the part whose
   output the skeleton hash records.
4. The material representation and the procedural test-material
   generator.
5. The six Slang modules under `shader-check`, and the twelve-entry
   pipeline cache built eagerly against them.
6. The light struct, the bounded array, the directional sun's uniform,
   and the per-pass block that carries all three.
7. The `RGBA16F` HDR offscreen target and both geometry passes into it.
8. The tonemap resolve pass, encoding sRGB in the shader, writing the
   `RGBA8 UNORM` target S03 created, with the present pass left
   untouched.
9. Constant tuning against the real scene, then the freeze: record this
   spec's goldens and the constants in one change.
10. The S04 cube-golden re-record and the re-derived readback threshold.
11. Debug draw as the post-resolve windowed overlay.
12. Shader live reload, dev-only.

Four ordering constraints are more than convenient. Steps 2 and 3 before
step 5, because a camera and a cull path written against a working
backend acquire the backend's shape, which is the failure S03 ordered
around for the draw list. Step 8 before step 9, because a constant tuned
against un-resolved output is tuned against an image no gate will ever
see. Step 11 after step 8, so the overlay is built against a resolve that
already exists and cannot accidentally be wired upstream of it. And step
12 last, so a dev-only path is never load-bearing for anything a gate
depends on.

## Exit checklist

- [ ] The multi-object PBR scene, with opaque and transparent draws,
      green on world-hash, skeleton-hash, readback and parity tiers on
      both CI platforms.
- [ ] The camera-rig test scene exercises both rigs and at least one
      interpolated state between them, and ray picking resolves through
      one path for all three.
- [ ] All twelve pipeline ids build at device initialization, and a
      thirteenth is unrepresentable in the key's type rather than merely
      unused.
- [ ] Exactly six shader modules cover the twelve ids, and a blend
      pipeline names the same fragment module as its opaque counterpart,
      differing only in blend state.
- [ ] An unlit module contains no light-loop code and an opaque module
      contains no discard, checked mechanically on the emitted artifact
      with no device opened.
- [ ] A material authored with the mask alpha mode is drawn as mask,
      never remapped to blend, demonstrated against a test material that
      names it.
- [ ] The procedural material set is byte-identical on both CI
      platforms, checked rather than assumed.
- [ ] The per-draw block is still one fixed layout across all twelve
      permutations, and the per-pass block binds at one fixed size
      whether the scene carries one light or the maximum.
- [ ] The light array's maximum is a compile-time assertion at the
      type's definition site, and exceeding it fails loudly rather than
      truncating.
- [ ] The directional sun rides the per-pass block as its own uniform,
      outside the bounded array, and the scene shades from the sun, the
      hemisphere ambient and the array together with no shadow path for
      any of them.
- [ ] The same scene culls identically on both CI platforms, and two
      transparent draws at equal distance order identically on both.
- [ ] Every simmath3d operation this spec adds ships with a canary
      sentinel, and S02b's completeness check fails when one is missing.
- [ ] The resolve writes final sRGB bytes into the target D22 hashes,
      and the present pass still performs no color math on the sample or
      the write, demonstrated rather than asserted in prose.
- [ ] No baked lookup table exists anywhere in the resolve chain, and
      the operator is shader arithmetic end to end.
- [ ] The HDR target is `RGBA16F`, the resolve's destination is plain
      `RGBA8 UNORM`, and no render-target view anywhere in the chain
      carries an `_SRGB` format, checked on the created objects rather
      than assumed from the shader.
- [ ] The hemisphere constants, any pre-tonemap scalar, and the
      operator's constants live in one named place and are frozen in the
      same commit that records this spec's goldens.
- [ ] **S04's cube goldens are re-recorded under the new pipeline**, as
      this item and not as a side effect of another (#119), split three
      ways by maintainer micro-ruling at landing (2026-07-31):
  - [ ] the readback golden re-recorded, since the pixels change;
  - [ ] the skeleton golden re-recorded, since the resolve pass and the
        twelve-id key both sit inside the recorded stream;
  - [ ] the world hash **unchanged**, checked rather than re-recorded,
        because nothing this spec adds is sim state. A world hash that
        moved here is a bug in this spec, not a golden to refresh.
- [ ] The readback threshold is re-derived against the frozen curve on
      the lavapipe baseline, and the derivation is recorded rather than
      inherited from S04's.
- [ ] A headless run with debug-draw submissions produces a readback
      byte-identical to the same run without them.
- [ ] A windowed run with debug-draw submissions produces the same
      skeleton hash and the same offscreen-target contents as the same
      run without them.
- [ ] Debug draw has no reachable path to the HDR target or the sRGB
      target, demonstrated by the submission API's own types rather than
      by inspection.
- [ ] The debug-draw submission API admits geometric primitives only,
      with no glyph, font or text-chip path anywhere in the layer.
- [ ] The shader reload path is absent from every build a gate drives,
      and a reload swaps at a frame boundary rather than mid-frame.
- [ ] `just shader-check` green on this spec's shaders under S01's
      cadence.
- [ ] The Windows compile-only leg compiles this spec's tree, runs no
      tests, and its name says so.
- [ ] Every open question below either answered on a ticket or carried
      forward explicitly, never dropped.

Reaching **implemented** is the maintainer's call once this checklist is
clear and the gate is green.

## Course

Module S06; path tag engine. Teaches renderer foundations and Slang
shading against the multi-object PBR scene: the permutation set and its
cache, the material system, the camera and its two rigs, and the color
pipeline from HDR shading to the resolved sRGB target. Authored after
**implemented**, per D27.

## Prototype ports

None. The row records this field as `none`, and the consequence is worth
stating rather than leaving as an empty field: there is no reference
implementation for this substrate, so every shape in this document was
chosen on map #113 rather than recovered from working code. The
throwaway shader built for #114 is evidence for one of those choices and
is not a port; it lives in no branch and nothing in this repository
descends from it.

## Open questions

The eight children of map #113 are all closed and none of the following
reopens one. These are the residue: what a resolution comment settled in
shape but not in value, what the map's own fog recorded, and what
drafting this document surfaced.

- **The exact constants.** The hemisphere's sky and ground colors, any
  pre-tonemap exposure scalar, and whether the operator's reference
  defaults need adjustment against this engine's actual value ranges.
  #118 froze the shapes and left the values to implementation
  deliberately, because a value only means something against a real lit
  scene that does not exist yet. The fallback if the operator's
  compression band proves insufficient is the recorded ACES-fit
  runner-up, and the switch point is before the goldens record.
- **The re-derived readback threshold's value.** A measurement rather
  than a choice, and not derivable until the curve produces images on
  the lavapipe baseline. Named on #120's own residue.
- **Whether this spec's scene must draw all twelve pipeline ids or only
  build them.** The skinned half of the key has no animated consumer
  until S25, so six of the twelve may build and never appear in a draw
  list, which means no golden covers them. Building all twelve is
  settled; drawing all twelve is not.
- **The mechanism for keeping the cull and sort path platform-invariant.**
  This document states the obligation, derived from S04's own axis that
  world and skeleton goldens stay platform-invariant, and states the
  boundary it draws inside "render-side math". What it does not settle
  is whether the obligation is met by running that path in policed
  simmath3d terms or by an ordinal formulation of the cull test with its
  own recorded rationale. The row's phrase that render-side math sits
  outside the policed regime is what this refines, and no disposition
  addresses it.
- **Whether a shader reload marks a session dev-diverged.** This
  document reads D36 as widened by D60 to cover behavior-changing
  rebuilds and script reloads, and reads a shader reload as
  presentation-only and therefore outside that marking. The reading is
  stated in the live-reload section above; no disposition backs it.
- **How the camera relates to S11b's re-basing anchor.** S11b depends on
  this spec and re-bases render-side state relative to the camera's
  coordinate frame. Whether the camera state stays world-space with
  re-basing applied downstream, or the re-basing origin becomes part of
  the camera state, is S11b's to answer. Named here because #116 chose
  the state's shape and did not close that door either way.

Two items are carried from map #113's own fog rather than surfaced here:

- **S04's remaining open child**, the tick count and camera-orbit
  parameters that make the cube goldens sensitive without being brittle,
  is still open at this spec's drafting. This spec's re-record of those
  goldens rides on whatever it settles. Map #113 recorded it as context
  on the dependency rather than as a blocking edge, because this spec's
  own scenes are different scenes, and that reading holds here.
- **The cross-map edge to S07 that did not exist at charting time** has
  since been answered from S07's own side: the ambient constant is
  inherited unchanged (#112). It is recorded in this document's
  ownership section above rather than left as fog.

Six items are deferred to a named owner rather than left open:

- **Shadows** are S07's, recorded against the constants this spec
  freezes and cast by the sun this spec lands unshadowed.
- **Clustered light culling** is S10's, replacing this spec's iteration
  and inheriting its representation.
- **Debug-draw text chips** are the first glyph-owning spec's, S16 being
  where a font first arrives, and they are added to this spec's layer
  rather than built beside it.
- **Real materials and the importer that produces them** are S12a's,
  replacing this spec's procedural set at the same consumer.
- **Perf budgets** are S09's; there is no perf gate here and none is
  implied.
- **Floating-origin re-basing** is S11b's, over the camera this spec
  lands.

Six further questions, three drafted as open questions here and three
readings this document derived rather than cited, were settled by
maintainer micro-ruling at landing (2026-07-31) and live in the
normative text above rather than here: the resolve chain's two formats
with the sRGB encode in the shader and no `_SRGB` view anywhere, the
unshadowed directional sun's arrival at this spec and its home outside
the light array, the deferral of debug-draw text chips to the first
glyph-owning spec, the eagerly built never-evicting pipeline cache, the
reading of #117's "tiled-culling pass" phrase as naming S10's machinery,
and the three-way split of #119's re-record across the readback,
skeleton and world tiers.
