# Security Policy

## Reporting a vulnerability

Do not report security vulnerabilities in public GitHub issues.

Report them through GitHub's private vulnerability reporting on the
[svsw repository](https://github.com/svswengine/svsw/security/advisories/new).

## Scope

The Luau script sandbox is a security boundary. Sandbox escapes are in scope.
What the boundary defends against is enumerated in
[docs/design/threat-model.md](docs/design/threat-model.md) (D50).

It is the only one. Two things that look adjacent are deliberately outside
it, and saying so is more useful than implying protection that does not
exist (D43):

- An **Editor script** runs at an expanded capability tier whose purpose is
  granting project-scoped filesystem access, asset writes and
  command-stream emission. It is a capability tier, not a containment
  boundary. Because Editor scripts arrive with project data, the editor
  keeps them disabled until you enable them per project (D51).
- An **Extension** is native Odin compiled into your own editor build.
  There is no boundary around it and there cannot be one. Treat an
  Extension the way you would treat any build tool you choose to run.

This project takes no position on third-party distribution of either. An
Extension is compiled into your build, so it is yours to vet; an Editor
script is gated on your per-project consent instead (D51).

The engine-era network surface is dev and trusted-network software: the
gateway's tokens distinguish sessions rather than defending against
hostile clients, and internet-facing hardening is post-engine work
(D52).

## Acknowledgment

Every report gets acknowledged.
