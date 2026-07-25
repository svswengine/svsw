# D9: UI: Dear ImGui for editor and runtime HUD

Status: current
Date: 2026-07

One UI substrate (cimgui + imgui_impl_sdl3 + imgui_impl_wgpu, platform tier;
C++ enters Odin only through cimgui's generated C ABI, backend wrappers
included). The mod-facing Luau UI API re-binds over ImGui with the same
off-hash gating and containment; Clay retires at cutover, and with it the
research-era Clay line as the HUD answer. Shipped-HUD theming and gamepad
polish are stage 6 work. Superseded in part by D33 (Lua 5.4 becomes Luau).
Amended by D38: Clay never enters this repository, so nothing retires at a
cutover.
