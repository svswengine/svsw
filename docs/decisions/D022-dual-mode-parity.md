# D22: Dual-mode parity

Status: current
Date: 2026-07

The engine runs in headless mode and in regular windowed mode and produces
the same results: same world hashes, same draw-list skeleton hashes,
comparable readback goldens. Both modes drive one render path into the same
offscreen target; the window presents from that target, so the render path
cannot fork by mode. `just parity-check` runs the same scenario in both modes
and asserts identical hashes; it is a golden tier from stage 0, a member of
every stage exit gate with a renderable scenario, and part of item 10 of the
stage 3 cutover checklist. A headless invocation is a trustworthy stand-in
for a windowed run, so headless-driving tooling needs no windowed re-check,
and a human at the window sees what the goldens hashed. Amended by D38: the
stage 3 cutover checklist is void, and `just parity-check` is instead one of
the roster items S21 enumerates.
