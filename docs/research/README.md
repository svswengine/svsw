# Carbon and SVSW successor-engine research

Research-era record. Decision numbers here use the research-era scheme; docs/decisions/README.md carries the mapping to the current log.

This directory is an evidence ledger and a proof-first design proposal for a
new Odin/Lua/Go engine. It is deliberately outside all 33 Carbon repositories
and outside SVSW. No cloned Carbon repository or SVSW source file was changed
to produce it.

## Executive summary

Carbon and SVSW answer different parts of the same problem:

- Carbon demonstrates a mature native engine ecosystem: a Python-hosted
  runtime, reflection and persistence, cooperative scheduling, a renderer,
  audio/video integration, domain simulation, service adapters, and a strong
  source-asset-to-runtime-resource lifecycle.
- SVSW demonstrates the smaller deterministic foundation we should preserve:
  fixed-step ECS simulation, ordered systems, seeded RNG, world hashes,
  sandboxed per-mod Lua, headless execution, snapshots, replay, and a strict
  platform/render boundary.

The engine build order: build one deep deterministic `Session` in Odin;
keep gameplay in capability-limited Lua; use Go for multiplayer transport,
session coordination, persistence, supervision, and operations. Carbon
supplies concept and failure-pattern evidence, not proof that this Go
multiplayer architecture works. Replication stays an experiment until
engine verification scenes exercise real latency, visibility, bandwidth,
and recovery constraints.

The private Odin session and the three-operation Go/Odin worker seam settle
the safe architecture now. Lockstep, full snapshots, deltas, prediction, and
rollback each stay unfrozen as network models pending that verification.

## Verified clone status

- Authenticated GitHub GraphQL enumeration and paginated REST enumeration each
  returned the same 33 visible `carbonengine` organization repositories.
- `/Users/ivandrenjanin/projects/carbon` contains exactly those 33 top-level
  repositories, including `.github`.
- Every local repository has the expected Carbon origin, is non-shallow, has a
  clean worktree, and is checked out on its declared default branch.
- Thirty-one default to `main`; `pdm` and `pdm-proto-wrapper` default to
  `master`.
- No fetch or pull was performed, so this is a verified local HEAD snapshot,
  not a claim that every checkout equals the current remote tip.
- The repositories declare 58 dependency submodules. All are uninitialized in
  this snapshot. The top-level clone result must not be read as “all dependency
  source is cloned.”

The exact inventory, HEADs, enumeration method, dependency graph, submodule
caveat, and license/provenance limits are in
[carbon-inventory.md](carbon-inventory.md).

## Document index

- [carbon-inventory.md](carbon-inventory.md) — the complete 33-repository
  snapshot, dependency hubs, language split, submodules, and provenance.
- [carbon-architecture.md](carbon-architecture.md) — observed Carbon runtime,
  scripting, scheduling, content, rendering, audio/video, simulation, services,
  and integration costs.
- [svsw-evidence.md](svsw-evidence.md) — implemented SVSW capabilities,
  carry-forwards, limitations, multiplayer primitives, and historical lessons.
- [successor-engine-plan.md](successor-engine-plan.md) — the proposed invariant
  architecture, experimental network choices, and Phase 0–14 proof roadmap.
- [glossary-candidates.md](glossary-candidates.md) — unresolved terms and the
  questions that must be answered before accepting a glossary or ADR.

## Evidence-status legend

Every material conclusion should be read through one of these statuses:

| Status | Meaning |
|---|---|
| **Observed** | Directly inspected in the source or repository state. |
| **Inferred** | Best explanation of multiple observations; not directly stated by the source. |
| **Proposed** | A successor-engine design choice that has not yet been implemented. |
| **Experiment** | A competing choice whose result must be measured before adoption. |
| **Validated** | Demonstrated by a named gate or repeatable artifact in the inspected project. |
| **Historical** | Prior-session evidence not revalidated against the current worktree; never treated as current fact. |

“Validated” is scoped. A passing SVSW determinism test validates that SVSW
contract; it does not validate a future engine, protocol, or Go service.

## Next decision needed

Two user decisions unblock durable execution:

1. **Write the private product requirements.** They must name the product
   shape, target player count, hidden-information requirement, acceptable
   input latency, reconnect and recovery expectations, authoritative physics
   needs, target platforms, and representative world/asset scale. The
   lockstep/snapshot/delta bake-off phase uses those requirements as its
   driver.
2. **Choose the Beads migration owner.** The current remote-backed Beads
   database reports a v49-to-v53 migration requirement and four pending
   migrations. No research epic was created. Choose one sole migrator to run
   the approved migration and Dolt push, or explicitly choose the bootstrap
   path after preserving any unpushed Beads state.

Until those choices are made, this research is a durable design input, not an
accepted implementation plan or issue schedule.

## Deep-research pass: additional documents

A second research pass produced five further documents. The main plan
positions itself explicitly against [successor-engine-plan.md](successor-engine-plan.md)
(adopt/amend/rebut, §7) rather than replacing it silently.

- [carbon-repo-deep-dives.md](carbon-repo-deep-dives.md) — per-repo Carbon
  surveys: subsystems, transferable patterns, anti-lessons, and license notes
  for each of the 33 repositories.
- [svsw-carry-forward.md](svsw-carry-forward.md) — the SVSW port ledger:
  what carries into the successor unchanged, what is redesigned, with
  decision-log (D-number) citations.
- [ecosystem-context.md](ecosystem-context.md) — the current Odin/Lua/Go
  ecosystem reality: production Odin precedents, vendor bindings, Defold and
  Nakama prior art, and the Carbon open-sourcing history.
- [ODIN-ENGINE-RESEARCH-AND-PLAN.md](ODIN-ENGINE-RESEARCH-AND-PLAN.md) — the
  definitive research + plan for the successor engine: Carbon lessons, SVSW
  carry-forward, proposed architecture (headless-first 3D, editor, exact
  Odin/Lua/Go split), phased roadmap, risks/licensing, the Codex
  adopt/amend/rebut table, and open maintainer questions.
- [design-review-notes.md](design-review-notes.md) — dispositions for all 36
  adversarial critique findings (ponytail/YAGNI, feasibility, completeness +
  licensing) that shaped the final plan.
- [scripting-language-comparison.md](scripting-language-comparison.md) — the
  pre-S14 scripting-language decision record: JS/TS candidates vs Lua 5.4 on a
  design-only weighted matrix, the threading question answered, ranked options
  (keep Lua 5.4; Luau close second), decision impact, and critique dispositions.
- [ROADMAP.md](ROADMAP.md) — the definitive dependency-ordered roadmap serving
  the locked maintainer decisions: engine work sequenced by what depends on
  what, engine-completion verification (including the dual-mode parity gate,
  D72) before rebrand, hard cutover at gate-equivalence, proposed decisions
  D54–D72, the overrides table against ODIN-ENGINE-RESEARCH-AND-PLAN.md, a
  closing section for post-engine product work that starts only after the
  engine is complete, and a Review notes appendix disposing of every
  blocker/major critique finding.
- [typed-editor-scripts.md](typed-editor-scripts.md) — decision record on
  typed editor/mod scripting: why a Luau-into-Lua-5.4 fork-and-merge is not
  viable, the option table (LuaLS/LuaCATS recommended, Teal close second),
  and its relationship to scripting-language-comparison.md's prior Lua 5.4
  decision.
- [engine-extensibility-loop.md](engine-extensibility-loop.md) — decision
  record on the editor-survives-engine-rebuild dev loop: what S08/S27b/D71/
  S02a already provide, the gaps (rebuild orchestration, reconnect skew,
  schema migration, cross-build hash semantics), the process-restart-loop
  recommendation, and the intentional-divergence mode vs. the golden gate.

## Project scaffold: svsw3D

The engine project this research feeds is this repository (working name
svsw3D), a fresh repository next to SVSW and Carbon (outside this
repository). Its spec index and todo list live at
[../specs/README.md](../specs/README.md); specs get produced one at a time
through brainstorm plus grilling sessions with the maintainer before any
implementation starts.

The fresh-project decision supersedes one part of ROADMAP.md: the hard-cutover,
deletion-commit, and gate-equivalence checklist machinery is obsolete, because
nothing cuts over from SVSW. SVSW is now the internal prototype; its subsystems
port into svsw3D test-first, and svsw3D stands up its own gate roster from scratch
(the spec index records both obligations). Everything else in the roadmap,
including the stage ordering, the exit gates, and decisions D54–D72, stands.
