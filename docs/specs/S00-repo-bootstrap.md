# S00 — Repo bootstrap: toolchain, just check skeleton, two-platform CI

Normative text for S00. The [spec index](README.md) records this spec's
rung and nothing else duplicates it (D37).

- **Stage:** 0 — New-stack proof
- **Status:** spec written
- **Depends on:** none
- **Decisions:** [D14](../decisions/D014-c-interface-tier.md),
  [D23](../decisions/D023-apache-2-licensing.md),
  [D24](../decisions/D024-closed-contribution-open-source.md),
  [D25](../decisions/D025-monorepo.md),
  [D26](../decisions/D026-org-and-repositories.md),
  [D28](../decisions/D028-claude-tooling-architecture.md),
  [D30](../decisions/D030-docs-layout-convention.md),
  [D37](../decisions/D037-work-decomposition.md),
  [D38](../decisions/D038-fresh-repository.md),
  [D39](../decisions/D039-webfetch-allowed.md),
  [D40](../decisions/D040-context-engineering.md),
  [D41](../decisions/D041-normative-references.md)
- **Normative references:** the tooling design record at
  [`docs/plans/claude-tooling-design.md`](../plans/claude-tooling-design.md)
  is normative for the Claude Code tooling core this spec ships, as amended
  by D40 in its CLAUDE.md plan, its agent roster, and its reliability
  policy. Read the amendment notes first wherever they conflict with the
  text below them.

## Goal

Create the `svsw` repository's engineering discipline from the first
commit: a justfile whose `just check` composes every gate, the
[`docs/ODIN_STYLE.md`](../ODIN_STYLE.md) standard extended for a 3D engine,
tier-scan scaffolding enforcing the C-tier policy (D14), an api-surface
snapshot skeleton, a report-only security scan, and CI green on macOS arm64
and Linux x86-64 on every commit.

The repository is public, Apache-2.0, and closed to external contributions
(D23, D24, D38). The directory skeleton reflects the monorepo layout (D25).
The public surface already exists (D26), so S00's work there is
configuration rather than creation, and none of it is a launch step.

## Working software

Setup spec. `just check` runs green on both CI platforms on every commit,
initially composing type-check, an empty test suite, tier-scan, the
api-surface snapshot, `docs-check`, and the report-only scan. The root
README gains toolchain prerequisites and the `just check` and `just run`
quickstart when the gate skeleton lands.

## What is already true

S00 was specified before parts of it landed as ordinary documentation
work. These are done, and a ticket that re-does them is a defect:

| Already in the tree | Where |
|---|---|
| Public repository, issues enabled, Apache-2.0 | D38; repo settings |
| `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, `README.md` | repo root |
| The `docs/` layout convention and its router | D30; [`docs/README.md`](../README.md) |
| The decision log, seeded and indexed | [`docs/decisions/`](../decisions/README.md) |
| The research corpus, a closed corpus | `docs/research/`, commit `fc246c0` |
| Committed permission posture in `.claude/settings.json` | D28 as amended by D39 |
| The `docs-conventions` skill, and 25 vendored skills pinned by `skills-lock.json` | `.claude/skills/` |
| All ten tracker labels | `wayfinder:*` and the five triage roles |
| An interim root `CLAUDE.md` | replaced by this spec's own CLAUDE.md |

## Scope in

### Repository and gates

- Monorepo layout: `editor/`, `engine/`, `cli/`, `tools/`, `protocol/`,
  `server/`, `runtime/`, `vendor/`, `mods/`, `samples/`, `docs/`, `tests/`.
  D25 decides one repository rather than this list; `editor/` is the
  topmost tier band per D43, and the rest elaborate D25.
- A justfile with `check`, `test`, `type-check`, `fmt`, and `scan`, plus
  `docs-check`, an offline internal-link checker over the repo's markdown
  that blocks on internal relative links and only reports external URLs.
- Tier-scan rule set: only-platform-tier-touches-C (D14), and
  nothing-depends-on-`editor/` (D43). The editor rule lands here, with the
  directory empty, because it is cheap to enforce against nothing and
  expensive to retrofit once editor code exists.
- api-surface snapshot machinery.
- The svsw carve-outs added to [`docs/ODIN_STYLE.md`](../ODIN_STYLE.md),
  per the dispositions below.
- `bd init --prefix svsw`, giving ids `svsw-<hash>`.

### CI

- GitHub Actions, hosted standard runners only. `macos-26` for macOS
  arm64, `ubuntu-24.04` for Linux x86-64, both free and unlimited on a
  public repository.
- Bare labels only. `-large` and `-xlarge` are billed even on a public
  repository and are built from the same images, so a label suffix is the
  whole difference between free and metered.
- No self-hosted runners. A self-hosted runner on a public repository
  executes forked code on the owner's machine, and this repository is
  public now (D38).
- One ASan job on the Linux leg, landing only after the validation below.

### Windows, as local developer tooling rather than CI

- `just win-check` syncs the working tree over SSH, builds natively with
  the Windows Odin toolchain, and runs the headless gate suite.
- `just win-run` syncs, builds the same binary, and launches the windowed
  build on the machine's interactive desktop through a pre-registered
  scheduled task with the interactive-only property, triggered by
  `schtasks /run`. It is a human checkpoint and returns no verdict.
- Target machine host, user and paths come from a gitignored local config
  file, so any fork points the recipes at its own box. The dev side runs on
  macOS or Linux with WSL2.
- D22 parity ties the two together: the windowed run and the headless run
  come from one build and must produce identical hashes.

### Claude Code tooling core

Design record:
[`docs/plans/claude-tooling-design.md`](../plans/claude-tooling-design.md),
read with D40's amendments.

- Root `CLAUDE.md` on the rule from D40, landing near 100 lines across
  seven sections.
- Six paths-scoped rules files: odin, luau, go, c-tier, wgsl, specs.
- The graduated hook set: non-blocking formatters and diagnostics, plus the
  one blocking PreToolUse marker scan on `git commit` and `git merge`.
- Five skills: `spec-ceremony`, `check-triage`, `merge-prune`,
  `review-to-docs-pr`, `win-rig`. `check-triage` splits its
  gate-name-to-fix-flow table into a file it loads on demand.
- Three workflows: adversarial-review, comment-review, spec-review.
- Four agents, staged per D40: `gate-runner`, `win-rig-runner`,
  `spec-scribe`, `determinism-reviewer`. The other four land with S02a,
  S14, S26 and C00.
- `.claude/hooks/marker-scan.sh` holds the canonical stub-marker list, and
  every validator and hook reads it from there rather than restating it.

### Public surface and stats

- GitHub Pages enabled on `course`; branch protection on both
  repositories; the closed-contribution posture applied org-wide; the
  PR-auto-close Action wired up.
- The tier-1 badge row, the stats-refresh Action skeleton, and the
  spec-progress endpoint badge, per
  [`docs/plans/public-stats.md`](../plans/public-stats.md).

## Scope out

- Any vendored dependency (S01), and any engine package (S02a and later).
- Any sanitizer beyond the validated Linux ASan job. MSan and UBSan are not
  reachable from Odin at all; TSan defers to the threading spec.
- The full gate roster, which S21 owns. S00 ships the skeleton.
- Editing `docs/research/`, a closed corpus.

## Grilling dispositions

Settled on the children of wayfinder map #1, all closed. Eleven were
decided under authority the maintainer delegated on 2026-07-25 rather than
in maintainer grilling sessions, and each answer comment says so.

| # | Disposition |
|---|---|
| #2 | GitHub Actions, `macos-26` and `ubuntu-24.04`, free and unlimited on a public repository. The billed exception is larger runners. |
| #3 | Four bounded ODIN_STYLE sub-rules, no exemptions. See below. |
| #4 | A gate runs on hosted CI unless it needs a real GPU or a human. Windows is a third verifier of one world-hash golden, never a third golden platform. |
| #5 | `win-run` launches through a scheduled task with the interactive-only property. Carries a validation debt. |
| #6 | The beads id prefix is `svsw`; the epic-or-task distinction is beads' own type field, never part of an id. |
| #7 | The reliability policy splits on whether a clause has a mechanical enforcer. CLAUDE.md keeps one sentence, for ad-hoc subagent dispatch. |
| #8 | The model-routing table and the karpathy and ponytail mandate leave CLAUDE.md; both already exist where they bind. |
| #9 | The agent roster stages with its gates. Four at S00. |
| #10 | Only `check-triage` splits, and the seam is growth rate rather than length. |
| #11 | `Normative references` becomes a first-class spec field (D41). |
| #12 | ASan on the Linux leg only. Carries a validation debt. |
| #13 | CLAUDE.md targets a rule rather than a line count; four of D28's eight sections are cut or reduced to a pointer. |
| #14 | `/doctor` is an advisory step during implementation, not an exit item. |

### The four ODIN_STYLE carve-outs

1. **F1, the 70-line ceiling, holds.** One carve-out, defined so a gate can
   check it: a procedure may exceed 70 lines only if its body contains no
   control flow at all, and it carries a marker comment at the declaration
   site. Anything with a branch stays at 70 with no appeal.
2. **A1's density target holds.** Loop-invariant assertions hoist to the
   loop preamble; a per-iteration assertion needs a reason recorded at the
   site.
3. **T1 extends to the GPU boundary.** Anything crossing it carries
   explicit widths plus `#assert` on `size_of` and on the offset of every
   field, because WGSL layout rules disagree with natural Odin struct
   layout silently. The float width follows the hash boundary: sim state
   uses the sim math module's type and is never bypassed, render state is
   `f32` and off-hash by D11.
4. **S3 and A7 widen** from script VM callbacks to every `proc "c"`
   callback, wgpu's included. The longjmp clause stays specific to the
   script VM.

Two of these are gate-checkable and belong in the scan skeleton rather
than in review: the F1 control-flow rule, and the presence of `#assert` on
any struct written to a GPU buffer.

## Validation debt

Two dispositions were reasoned rather than exercised. Neither reopens a
question; both are tickets, and neither may be marked done by assertion.

1. **The `win-run` mechanism was never run on the rig** (#5). Confirm that
   an interactive-only task's window is visible on the physical console
   with the run-as user logged on, that a gamepad is enumerable from that
   process, and that a not-logged-on user produces a clear precondition
   failure rather than a silent success. `schtasks /run` returns on launch,
   so a zero exit code means started, not shown.
2. **No sanitizer work ran on a GitHub runner** (#12). The ASan job lands
   only after a deliberate green-then-red demonstration on `ubuntu-24.04`,
   with `ASAN_SYMBOLIZER_PATH` set explicitly, because the Linux image
   likely lacks the bare `llvm-symbolizer` name the runtime searches PATH
   for. Record that ASan and TSan abort with 134 on Darwin rather than the
   documented exit codes, in `check-triage`'s false-green traps.

## Implementation order

Suggested, not binding; `/to-tickets` owns the breakdown.

1. Monorepo skeleton and a justfile whose `check` is a no-op.
2. `docs-check`, the only gate with content to chew on from day one.
3. GitHub Actions on both legs, running `just check`.
4. Grow `just check`: type-check with the full vet set, an empty test
   suite, tier-scan, api-surface snapshot, report-only scan.
5. The Claude tooling core, in two passes. Root CLAUDE.md, the rules files,
   hooks and the four agents land early, because every later ticket is
   worked through them. `check-triage` lands after step 4, because its
   table needs gate names that exist.
6. Windows recipes and the `win-rig` skill, then debt 1.
7. The ASan job, after debt 2.
8. Public-surface configuration and the stats skeleton.
9. `bd init --prefix svsw`.

Step 5 carries a bootstrap knot worth naming: `spec-ceremony`,
`spec-scribe` and the `spec-review` workflow are the tooling that authors
and reviews a spec document, and none of them could be used on this one.
This document was written by hand for that reason. Every spec after S00
gets the machinery S00 builds.

## Exit checklist

- [ ] `just check` green on `macos-26` and `ubuntu-24.04`, on every commit.
- [ ] Every gate in the composition is a justfile recipe, and `just --list`
      describes it.
- [ ] `docs-check` blocks on a broken internal relative link, demonstrated
      by breaking one.
- [ ] tier-scan fails a deliberate C-tier import from outside the platform
      tier.
- [ ] tier-scan fails a deliberate import of `editor/` from `engine/`,
      demonstrated with a throwaway file in each, since the directories are
      otherwise empty at S00.
- [ ] The api-surface snapshot fails a deliberate surface change and passes
      after regeneration.
- [ ] Root `CLAUDE.md` matches D40's section set and rule.
- [ ] The four staged agents exist; the other four do not, and the design
      record names their owning specs.
- [ ] No workflow, agent or skill restates the stub-marker list; every one
      reads `.claude/hooks/marker-scan.sh`.
- [ ] Validation debt 1 discharged, with what was observed recorded on its
      ticket.
- [ ] Validation debt 2 discharged, with the red run recorded.
- [ ] `/doctor` run once against the tree, its findings recorded, and
      anything deliberately not acted on written down with the reason. A
      clean pass is not required (#14).
- [ ] Branch protection on both repositories, Pages on `course`, the
      PR-auto-close Action live.
- [ ] `bd init` run with prefix `svsw`.

Reaching **implemented** is the maintainer's call once this checklist is
clear and the gate is green.

## Course

Module S00; path tag engine. Teaches the repo bootstrap and the
`just check` gate skeleton against the two-platform CI run, and seeds the
shared Setup track. Authored after **implemented**, per D27, and the
pairing lands at C00.

## Prototype ports

The justfile composition pattern; the style-guide structure now carried by
[`docs/ODIN_STYLE.md`](../ODIN_STYLE.md); the boundary-scan and tier-scan
gates; the api-surface snapshot-diff gate. Ports are test-first from a
source to read, never a target to converge with (D38).

## Open questions

None open. All were charted as wayfinder map #1 and settled on its child
issues, which hold the reasoning behind every disposition above.
