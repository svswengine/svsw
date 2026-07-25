# D14: The C interface tier

Status: current
Date: 2026-07

C is the sanctioned interface tier between Odin, Luau, and Go where a
boundary needs it: the C ABI is the FFI lingua franca; Luau's C API and its
C++ implementation, SDL3, wgpu-native, and Dear ImGui via cimgui enter Odin
through vendored C/C++ headers behind Luau's C-compatible boundary; small
hand-written C shims are permitted where a boundary needs one, each vendored
and pinned with provenance per the quarantine policy. Only the platform tier
and `engine/render3d/gpu`, D2's thin GPU-submission stratum, touch C
(extends D2's layering discipline, policed by boundary-scan); everything
above stays pure Odin. Amended by D33 to name Luau's C API in place of
Lua's. Wording corrected to name both tiers, matching the rule as stated in
`docs/specs/README.md` and `docs/plans/claude-tooling-design.md`.
