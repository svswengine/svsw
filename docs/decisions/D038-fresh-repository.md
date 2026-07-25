# D38: Fresh repository: no cutover, public from the first push

Status: current
Date: 2026-07

svsw was created as a new repository rather than migrated from the internal
prototype, so nothing cuts over. The roadmap-era hard-cutover, deletion
commit, and gate-equivalence checklist machinery is void: there is no second
binary target, no 2D-era code to delete, and no old goldens or gates to
drop. The internal prototype is a source to port from test-first, not a
target to converge with, and svsw stands up its own gate roster from
scratch, the skeleton at S00 and the full roster at S21. Kernel-freeze
mechanics are moot for the same reason: with no second target to freeze
against there is nothing to freeze, and per-chunk hashing still composes
over the ported `hash_world` primitives unchanged. The repository also went
public ahead of S00 rather than at its implementation gate, so S00's
remaining public-surface work is configuration, not launch: GitHub Pages on
`course`, branch protection on both repositories, the org-wide
closed-contribution posture, and the PR-auto-close Action. Migrating the
prototype in place and cutting over at gate-equivalence is rejected because
it forces compatibility obligations on a 2D-era codebase the new engine owes
nothing to, a debt D13 already refused; holding the repository private until
S00 is implemented is rejected because D24 already keeps the tracker open
for bug reports, and that tracker is the work surface the engineering skills
read. This decision amends D5, D7, D9, D16, D22 and D26 in the clauses that
describe the cutover, the deletion commit, the kernel freeze, the
grandfathered beads prefix, or the timing of the public push, leaving the
rest of each in force. It fully supersedes D13, whose entire subject was a
transition that never happened.
