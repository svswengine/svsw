# CLAUDE.md

## What this repository is

svsw is an open-source (Apache-2.0) 3D game engine: Odin for the
deterministic core, Luau for typed, sandboxed gameplay scripting and
modding, Go for online services, Slang shaders through an in-house RHI
over Vulkan, D3D12 and Metal (D42), and a policed C interface tier at the
platform boundary. One monorepo holds
engine, CLI, runtime, samples, and services; the `course` sibling repo
teaches it, spec and course module landing in pairs (D27).

**Current state: planning and spec phase. This repository contains only
documentation.** There is no code, no justfile, and no CI yet; all of that
arrives with spec S00. Correctness here means consistency with the decision
log and the spec index, not a green build. When S00 lands, `just check`
becomes the gate and the tooling bootstrap in
`docs/plans/claude-tooling-design.md` replaces this interim file.

## Document authority hierarchy

- `docs/decisions/` — **canonical.** One file per decision
  (`D<nnn>-<slug>.md`), indexed in `docs/decisions/README.md`. Entries are
  settled: reopening one is a maintainer call, numbers are never reused, and
  nothing you write may contradict a decision whose status is `current`.
- `docs/specs/README.md` — **the lifecycle source of truth.** The spec
  index, carrying every spec's rung and a fixed per-spec schema. It is the
  sole record of spec status (D37); nothing else duplicates it.
- `docs/research/` — **reference only, and it numbers decisions
  differently.** This is the sharpest trap in the repo. The corpus predates
  the current decision log: `D54` through `D86` there are current `D4`
  through `D36` (mapping table in `docs/decisions/README.md`), and research
  `D11` and `D15` are unrelated to current D11 and D15, so a number copied
  out of a research file cites a real but wrong decision without looking
  wrong. Outside `docs/research/`, write research-era numbers with the `R-D`
  prefix (`R-D54`). The corpus is closed: no new documents, no edits, and
  new research never lands there.
- `docs/context/CONTEXT.md` — the glossary: the one sense each term carries
  here, and the words that carry several.
- `docs/plans/` and `docs/design/` — design records, plus the browsable M00
  editor mockup at `docs/design/editor/index.html`.

Before writing or editing documentation, use the `docs-conventions` skill
(layout, wrapping, links, the spec-index schema, em dashes).
`docs/agents/domain.md` owns what it excludes: decision files and the
glossary.

## Spec lifecycle

Specs are taken one at a time up six rungs: pending, brainstormed, grilled,
spec written, implemented, course published, regressing to implemented if a
published course module breaks. One rule binds every session:

- **Never write implementation code for a spec below "spec written" on the
  ladder.** Check its row in `docs/specs/README.md`, which states the rest.

## Engine invariants (these decide reviews)

- **Determinism by construction (D1).** Fixed timestep, ordered ECS
  iteration, engine-seeded RNG, no wall clock reachable from sim code.
  Golden world hashes enforce it; breaking it is a release blocker.
- **Layering (D2) and the C tier (D14).** One-way tier stack; only the
  platform tier and `engine/render3d/gpu` may touch SDL3, cimgui, or a
  graphics backend (Vulkan, D3D12, Metal; D42). `vendor/` is quarantined,
  pinned, never hand-edited.
- **Dual-mode parity (D22).** Headless and windowed runs share one render
  path into one offscreen target and must produce identical hashes; agents
  verify headless and trust the result.
- **Sandbox boundary (D33, D34).** Mod Luau sees only the `svsw.*` surface.
  A mod never crashes the engine; script input that trips an engine assert
  is a boundary bug. The sandbox is a declared security boundary
  (SECURITY.md).
- **Animation is presentation-only, off-hash (D11).** Server-authoritative
  multiplayer (D6); Go talks to the engine over a versioned wire protocol
  across a process boundary (D15), QUIC at the edge (D18).

Odin code follows `docs/ODIN_STYLE.md` (TigerStyle-adapted: 70-line hard
proc limit, roughly two assertions per procedure).

## Housekeeping

- The repo is public with its GitHub tracker enabled (D38) but closed to
  external contributions (D24): PRs get closed, tickets are welcome.
- Commit style follows the existing history: `docs(scope): summary` in
  imperative mood.

## Agent skills

`docs/agents/skills.md` is the routing map: which skill drives which rung,
what each may read and write, where this repo overrides a skill's defaults
(D37).

### Issue tracker

Tickets are GitHub issues in `svswengine/svsw`, driven through the `gh` CLI;
PRs are not a request surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Five triage roles alongside the `wayfinder:*` map kinds; no ticket or child
issue carries one from each. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `docs/context/CONTEXT.md` is the glossary, where several
words carry two senses (`issue`, `plan`, `spec`) and none is used bare. See
`docs/agents/domain.md`.
