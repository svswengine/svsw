# D55: The post-engine substrate roster

Status: current
Date: 2026-07

The corpus's own standard is that deliberate omissions get written down,
the way S25 names its animation deferrals and D17 names worldgen, and
several subsystem-sized omissions failed that standard: a reader could
not tell deferred from forgotten. This roster records them as decisions.
Rigid-body dynamics is post-engine: engine scope is S13's collision v1
plus its queries, and if the private product-requirements envelope turns
out to demand velocity-level behavior, S13's grilling is where that
surfaces and a dynamics-lite spec enters the index there, priced for
deterministic solver ordering in policed f32. Presentation VFX,
particles, sky and atmosphere, fog, decals, water and reflections, is
post-engine and follows the D11 pattern when built: presentation-only,
off-hash, invariance-tested. Image-based lighting and global
illumination are post-engine with it, per D54's ambient-term cap.
Navigation and pathfinding substrate is
post-engine; S30's encounter movement is mod-side Luau over `svsw.*`
queries, and its grilling verifies the instruction budget prices that.
Mesh LOD and occlusion culling are post-engine; engine-scope culling is
frustum-only, and S09's stress scene is pinned to the D4 few-chunk
scale so its budgets defend the bar the engine actually promises.
In-world text rendering, localization and string tables, input
remapping UI, and music streaming beyond the ported mixer are
post-engine product work, and so are the internet-facing gateway
hardening, hostile-client gate legs and identity story D52 defers.
A retained-mode shipped-game UI toolkit is post-engine: the
immediate-mode substrate D9 names is the shipped-HUD answer for the
engine era, and a real game UI past a HUD is work for this successor.
Mobile, Android and iOS, is a decided omission rather than a silent one
because D42's in-house RHI makes any future GLES-class backend a design
input rather than a later port; web, WebGPU and WASM, is a decided
omission on the same reasoning, and console is a decided omission with
them. Mod acquisition and distribution, how a mod reaches another
machine, install and version resolution included, is deliberate
post-engine product work, and mod signing and provenance land relative
to D53 when that work begins.
Shipped player saves are engine work with an
owner: the player save/load spec, which also owns the versioned
snapshot reader, amending D36 where it pointed that story at S27b's
durability work. Adopted from the 2026-07-25 adversarial review at the
maintainer's direction.
