# D50: The mod trust model is hostile input

Status: current
Date: 2026-07

SECURITY.md accepts sandbox-escape reports and D43 names the mod sandbox
the only security boundary this project declares, so the trust model
follows: the sandbox defends against hostile mod source, not merely
buggy source, and S14's open question on that point is settled rather
than left to its grilling. What the boundary defends against is
enumerated in a committed artifact, `docs/design/threat-model.md`, which
SECURITY.md links: VM escape through the vendored Luau C++, CPU
exhaustion including the pattern-matching backtracking a single C call
performs where the instruction-count hook cannot interrupt it, memory
exhaustion and garbage-collector pressure, argument abuse across the
`svsw.*` surface, and determinism griefing in shared-world co-op. Three
consequences bind S14. A wall-clock watchdog joins the allocation cap
and the instruction budget in v1 scope, because the budget alone cannot
interrupt time spent inside one C call. Whether Luau's interrupt fires
across coroutine boundaries is verified rather than assumed, and the
verification is a named scope item. The `svsw.*` surface gains a
machine-checked guard: a fuzz gate walks the D3 binding registry, the
same enumeration D34's declaration generator walks, invoking every
registered binding from a sandboxed VM with adversarial arguments and
asserting the engine survives with at worst a disabled mod, report-only
at S14 and hard in S21's roster. Leaving R1-R5 as a review rule is
rejected: it is the one load-bearing safety mechanism in the corpus
enforced by discipline, in a repository whose ground rule is that
everything ends behind a named gate. Adopted from the 2026-07-25
adversarial review at the maintainer's direction.
