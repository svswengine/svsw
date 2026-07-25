# D56: Source-first engine distribution

Status: current
Date: 2026-07

The vision says a game developer changes the engine through the editor,
and D43 already assumes users who compile their own editor build, yet
every planned mechanism ran only from the svsw repository checkout: S17
scaffolded a game project with no engine-source reference, and S22b's
rebuild loop resolved recipes only from the repo root. This decision
states the model those mechanisms imply. A game project is developed
against a pinned engine source checkout plus the Odin toolchain, not
against a prebuilt SDK; `svsw new` records the engine checkout path and
the toolchain expectations in project metadata, S17 owns that linkage,
and the S22b rebuild recipe resolves from a scaffolded project
directory, proven by running the dev-loop smoke gate once from one. The
M00 Files explorer showing engine sources in a game project's tree
stops being a surface no spec can populate. A prebuilt-SDK distribution
is rejected for the engine era: it forfeits the engine-modification leg
of the vision for everyone but the maintainer, and D43 already makes
the build hash the world's identity, so source plus toolchain is the
unit of distribution that model needs. D53's release tags are the pin
targets, which is what makes source-first concrete rather than
aspirational: a project pins a tagged release checkout, and upgrading
the engine is moving the pin. Adopted from the 2026-07-25 adversarial
review at the maintainer's direction.
