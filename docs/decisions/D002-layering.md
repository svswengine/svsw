# D2: Layering discipline

Status: current
Date: 2026-07

The engine is a strict one-way layer stack: scripts above the scripting
boundary, the engine core below it, the platform tier at the bottom. Only the
platform tier and `engine/render3d/gpu`, the thin GPU-submission stratum,
touch the backend; the renderer's core stays backend-agnostic behind that
stratum. Script code never names engine internals, the platform, or the
network. D14 extends this law to the C interface tier; boundary-scan polices
it. Wording corrected to name both tiers, matching the rule as stated in
`docs/specs/README.md` and `docs/plans/claude-tooling-design.md`.
