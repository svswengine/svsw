# D51: Opening an untrusted project requires consent

Status: current
Date: 2026-07

A project cloned from the internet carries Editor scripts, which D43
puts at a capability tier holding project-scoped filesystem access,
assetc invocation and command-stream emission, and it carries asset
source that assetc parses with vendored C libraries. Opening such a
project must therefore not arm either surface by itself. The editor
adopts per-project consent on the shape VS Code's workspace trust
established: Editor scripts stay disabled the first time a project is
opened, enablement is per project and recorded outside the project
directory so the project cannot grant itself trust, and S24's gate
carries a leg asserting that a freshly opened untrusted project executes
no script code. Trusting the project the moment it is opened is
rejected, because the baseline flow of an open-source engine with a
public course is opening someone else's project. SECURITY.md's
disclaimer that what you compile into your build is yours to vet is
amended in the same stroke: it covers Extensions, which are compiled in,
and never Editor scripts, which arrive with project data. assetc is
hardened alongside: S12a's fuzz obligation extends from the container
codec to the glTF import path, whose parsers are the ones internet-origin
data reaches first, and the editor invokes assetc as a separate
short-lived process, so a parser crash on hostile input kills a bake
rather than the editor. Adopted from the 2026-07-25 adversarial review
at the maintainer's direction.
