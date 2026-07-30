# D48: Backend sequencing; one ImGui renderer over the RHI

Status: current
Date: 2026-07

Two consequences of D42 that its text left open. First, sequencing.
Vulkan and Metal are the engine-completion backends: they are the two
the CI legs and the dev machine can exercise, so they are the two every
render gate's acceptance wording covers. D3D12 enters as its own spec,
insertable once the S04 golden tiers exist, owning the third backend and
its gate story: `just win-check` grows the skeleton and readback tiers
on the Windows rig, report-only until that loop has been demonstrated,
and S21's roster carries the D3D12 axis marked report-only. Until that
spec lands, no acceptance line may imply D3D12 coverage. Windows
artifacts ship compile-gated only meanwhile: a compile-only hosted
Windows CI leg, free for public repositories, gates them once
Windows-compilable code exists, and runtime validation stays local-rig
and report-only until S03b lands. Vulkan is the supported Windows path
in the engine era. Implementing one backend first and shaping the
interface against one API is rejected for the reason D42 rejected
wgpu-then-swap: S03 discharges the interface-shape burden by designing
against all three APIs' constraints, descriptor heaps, explicit barriers
and queue families included, while implementing two. Second, the ImGui
substrate. D9 is amended where it names imgui_impl_wgpu: the render half
of the substrate becomes one in-house ImDrawData renderer written
against the RHI, because upstream's imgui_impl_metal is Objective-C that
cimgui's generated C ABI cannot wrap, and because three vendored
per-backend wrappers is the per-backend triplication the RHI exists to
absorb. imgui_impl_sdl3 stays as the platform half; S01 vendors no ImGui
render-backend wrappers. D28 is amended in the same stroke: its hook
clause's WGSL validation reads as Slang validation, per D42. Adopted
from the 2026-07-25 adversarial review at the maintainer's direction.
