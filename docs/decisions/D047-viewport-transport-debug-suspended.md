# D47: Editor viewport transport; the debug-suspended worker

Status: current
Date: 2026-07

Amends D44 in two respects. First, the viewport clause. D44 expected the
editor to embed a Session worker's operating-system window by
reparenting, on the premise that no rendering interface offers safe
cross-process external memory import. Both halves fail: macOS offers no
public way to adopt another process's window and Wayland has no global
window handles by design, which covers both CI legs and the dev machine,
while D42's raw backends make surface export a supported native path
(IOSurface on Metal, dma-buf with VK_KHR_external_memory_fd on Vulkan,
NT shared handles on D3D12) that the wgpu-era survey could not reach.
The viewport therefore works by sharing the worker's offscreen render
target across the process boundary; reparenting survives only as a
possible Win32/X11 tactic. The worker stays windowless: it renders into
the one D22 offscreen target exactly as a headless run does, and the
editor presents the shared surface, composites overlays, and routes
input back as commands, so the glossary's headless Session worker and
D36's S08-topology wording stay true, and a GPU driver inside the worker
is nothing D22's windowed mode has not already licensed. The RHI treats
viewport surface transport as a named capability, shaped in S03. Second,
supervision. A worker suspended mid-request at a breakpoint is
indistinguishable from a wedged one under D44's hang inference, so a
third worker condition joins the two kinds: debug-suspended, entered on
a debugger verb or a breakpoint notification the worker pushes,
suspending hang inference, request timeouts and crash-budget accounting
for that worker until continue or detach. The debugger spec owns the
protocol events that enter and exit the condition. Adopted from the
2026-07-25 adversarial review at the maintainer's direction.
