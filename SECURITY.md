# Security Policy

## Reporting a vulnerability

Do not report security vulnerabilities in public GitHub issues.

Report them through GitHub's private vulnerability reporting on the
[svsw repository](https://github.com/svswengine/svsw/security/advisories/new).

## Scope

The Luau script sandbox is a security boundary. Sandbox escapes are in scope.

It is the only one. Two things that look adjacent are deliberately outside
it, and saying so is more useful than implying protection that does not
exist (D43):

- An **Editor script** runs at an expanded capability tier whose purpose is
  granting project-scoped filesystem access, asset writes and
  command-stream emission. It is a capability tier, not a containment
  boundary.
- An **Extension** is native Odin compiled into your own editor build.
  There is no boundary around it and there cannot be one. Treat an
  Extension the way you would treat any build tool you choose to run.

This project takes no position on third-party distribution of either, so
what you compile into your build is yours to vet.

## Acknowledgment

Every report gets acknowledged.
