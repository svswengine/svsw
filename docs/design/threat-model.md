# svsw threat model

What the declared security boundary defends against, enumerated so that
SECURITY.md's promise and the sandbox's actual mechanisms cannot drift
apart unnoticed. D50 settles the trust model this records: the mod
sandbox defends against hostile mod source, not merely buggy source.
The decision log is the authority behind every entry; this record
collects the threats, the mechanisms, and the gates.

## The boundary

The Luau mod sandbox is the only security boundary this project declares
(D43, SECURITY.md). A mod is attacker-controlled input in full: its
source, its manifest, its data files, and every argument it passes
across the `svsw.*` surface. The engine survives all of it with at worst
a disabled mod; script input that trips an engine assert is a boundary
bug.

## Defended threats

| Threat | Mechanism | Gate |
|---|---|---|
| VM escape through the vendored Luau C++ | Sandbox construction on Luau's own primitives (`safeenv`, `luaL_sandboxthread`, call-depth limits); the S01 security-response field marks Luau security-critical, with upstream advisories triggering an out-of-cadence re-vendor | S14 containment suite; the S01 pin-drift report |
| CPU exhaustion, including work inside one C call the instruction-count hook cannot interrupt (pattern-matching backtracking) | Instruction budget plus the wall-clock watchdog D50 adds to v1 scope; interrupt behavior across coroutine boundaries verified, not assumed | S14 budget-enforcement tests |
| Memory exhaustion and GC pressure | Per-VM allocation cap; disable-in-place on breach | S14 containment suite |
| Argument abuse across the `svsw.*` surface | R1-R5 discipline at every binding, backed by the registry-driven fuzz gate that invokes every registered binding with adversarial arguments | Report-only at S14, hard in S21's roster |
| Hostile mod manifests and data files | Hostile-manifest corpus (malformed syntax, dependency cycles, first-declarant collisions, oversized fields, path traversal) rejected clean | S15 |
| Determinism griefing in shared-world co-op | Per-chunk hash tripwire with defined trip semantics; a mod that forces trips is classified and contained by those semantics rather than left an unclassified session-killer | S28 |

## Outside the boundary

Adjacent surfaces are deliberately outside the boundary, and each has a
posture rather than a promise:

- **Editor scripts** run at a capability tier, not behind a boundary
  (D43). Because they arrive with project data, opening an untrusted
  project arms nothing: they stay disabled until enabled per project,
  recorded outside the project directory (D51).
- **Extensions** are native Odin compiled into your own editor build:
  trusted code, yours to vet (D43).
- **assetc** parses internet-origin assets with vendored C parsers. The
  glTF import path joins the fuzz obligation, and the editor invokes
  assetc as a separate short-lived process so a parser crash kills a
  bake, never the editor (D51, S12a).
- **The network surface** is dev and trusted-network software for the
  engine era: gateway tokens distinguish sessions and defend against
  nothing; internet-facing hardening and identity are post-engine work
  (D52).

## Reporting

Report suspected boundary violations through the private channel
SECURITY.md names. Every report gets acknowledged.
