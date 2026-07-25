# D7: Platform: SDL3 + wgpu; sokol and Clay retire

Status: current
Date: 2026-07
Rationale: docs/research/ROADMAP.md

Full platform swap: SDL3 (window/input/audio) plus wgpu (vendored wgpu-
native, checksum-pinned prebuilt releases; no Rust toolchain in dev/CI).
Shaders are WGSL; `shader-check` runs naga validation via a pinned prebuilt
naga-cli; the sokol-shdc path is dead. The new platform and render3d grow as
a second binary target until the stage 3 gate-equivalence cutover, at which
point sokol, Clay, and all 2D-era code are deleted. D2's layering law holds:
only the platform tier touches the backend (see D14). Amended by D38: this
repository is fresh, so there is no second binary target and nothing to
delete at a cutover, and sokol, Clay, and 2D-era code simply never enter it.
Superseded in part by D42: wgpu, WGSL and naga are replaced by an in-house
rendering interface written over Odin's vendored Vulkan, D3D12 and Metal
bindings, with shaders authored in Slang; SDL3's role and D2's layering law
are unchanged.
