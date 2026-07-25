# Claude Code tooling design

This is the definitive record of svsw's Claude Code tooling: root
CLAUDE.md, the paths-scoped rules files, skills, agents, hooks, workflows,
the reliability policy, multi-language routing, permissions, and the review
cadence. It amends the original tooling design with the maintainer's
grilling decisions of 2026-07-12, listed in substance in the closing
section. `docs/specs/README.md` cross-references this document from S00
and from every spec that adds a gate-dependent piece of tooling.

## Overview

svsw's `.claude` tooling is a staged port of the internal prototype's
tooling, hardened against three failure classes: stub or empty agent
output, a bug discovered late in a branch's life, and a false assumption
about which tools are installed. The bootstrap core lands at S00: a lean
root CLAUDE.md, the six paths-scoped rules files, the graduated hook set,
the full agent roster with refusal clauses, five foundational skills, and
three workflows. Tooling that depends on a gate the codebase does not yet
have lands with the spec that creates that gate: golden-hashes at S02a,
parity-verify at S04, vendor-quarantine at S01, lua-binding at S14,
proto-conformance split across S05 and S26, the MCP-server successor at
S21, and course-pairing at C00. One reliability policy states the output
contract and the retry-once-then-reconstruct rule a single time, in root
CLAUDE.md; every workflow and agent references it instead of restating it.

Per-language guidance loads through paths-scoped rules files, not nested
CLAUDE.md, because svsw's languages cross directory boundaries: Odin
spans `engine/`, `cli/`, and `tests/`; Luau spans `runtime/`, `mods/`, and
`samples/`; Go spans `server/`, `protocol/`, and `tools/`. Nested CLAUDE.md
is reserved for `server/` and the `course` sibling repo, the two areas with
a separate toolchain. Hooks are graduated by cost: formatters warn and exit
clean when the tool is missing; the marker scan and WGSL validation feed
diagnostics back without blocking; one hook, the pre-commit marker scan,
blocks.

## Root CLAUDE.md plan

**Amended by D40.** The target is a rule, not a number: content stays only
if a reader needs it without a lookup to avoid making a wrong decision, and
everything else becomes a pointer. Applied, that lands near 100 lines
across seven sections. Of the eight below, section 5 is cut in full,
section 6 reduces to one sentence, sections 3 and 8 reduce to a pointer,
and sections 1, 2, 4 and 7 survive, with 2 kept in full because those
invariants decide reviews. Two sections the list never had earned their way
in: the document authority hierarchy carrying the `docs/research` numbering
trap, and three short pointers to the skill routing map, the tracker and
the glossary. The original eight stay written out below, because the
reasoning for each cut is only legible beside what was cut.

Root CLAUDE.md targets about 150 lines and stays always-loaded, holding
only what every session needs:

1. **Project.** svsw is the successor engine: Odin core, Luau sandbox,
   Go services, a policed C tier (D14), WGSL through SDL3 and wgpu. The
   engine completes stage by stage; verification scenes prove each stage.
   `docs/specs/README.md` is the lifecycle source of truth.
2. **Layer rules.** The one-way tier stack; the D14 C-tier import rule
   (only the platform tier and `engine/render3d/gpu` touch SDL3, wgpu, or
   cimgui); D1 determinism-by-construction; D11 animation stays off-hash;
   D22 dual-mode parity; a mod never crashes the engine. Each rule gets one
   line and a pointer to the decision log.
3. **Gates.** `just check` is the gate, green at every commit. A table
   lists recipe names only (check, test, shader-check, chunk-golden-check,
   parity-check, proto-conformance, stress, scaffold-check, win-check);
   triage detail lives in the check-triage skill.
4. **Spec ceremony pointer.** Specs are produced one at a time through
   brainstorm and grilling, which `/wayfinder` and `/grill-with-docs`
   drive (D37); `docs/specs/README.md` records where each one stands, and
   `docs/agents/skills.md` maps rung to skill. Never write implementation
   code for a spec below "spec written" on the ladder; never reopen a
   logged decision without maintainer instruction.
5. **Agentic operation.** The karpathy-guidelines and ponytail mandate
   applies to every coding turn and every dispatched coding subagent, since
   a subagent does not inherit skills and the parent must instruct it
   explicitly, plus the condensed model-routing table (a mechanical tier
   for renames and formatting, a default tier for routine implementation,
   an extended-reasoning tier for architecture, determinism, the Luau
   sandbox, the C ABI, protocol work, and plan authoring).
6. **Reliability policy.** The single canonical statement, described in
   full below.
7. **Toolchain policy.** Tools come from PATH or vendored pins; verify a
   binary exists before wiring it into a recipe or claiming it ran;
   formatter hooks warn instead of failing.
8. **Beads block.** bd is the slice tracker one level below a GitHub
   ticket, engaged only when a ticket overruns a session; it holds no spec
   status, which lives in `docs/specs/README.md` alone (D37).

Everything else loads lazily: per-language conventions live in
`.claude/rules/*.md`; `server/CLAUDE.md` carries Go module conventions,
lint config, and wire-protocol freeze rules, loading only when Go files are
read; the `course` sibling repo carries its own root CLAUDE.md and
`.claude` tree; `vendor/` is covered by a rules file and a Read-deny rule,
never by root prose. Deep procedure (golden triage flows, parity oracle
commands, registrar patterns, win-rig SSH mechanics) lives exclusively in
skills, not in CLAUDE.md.

Permissions live in committed `.claude/settings.json`, detailed under
Permissions posture below.

## Rules files

`.claude/rules/*.md` with `paths:` frontmatter is the router. Six files,
each scoped by paths rather than by directory placement:

| File | Paths scope | Content summary |
|---|---|---|
| `odin.md` | `**/*.odin` | `docs/ODIN_STYLE.md` essentials as checkable items: the 70-line proc ceiling, asserting engine invariants versus `L_error`-ing on mod input, explicit allocator discipline, no hidden control flow. `odin check` with the pinned vet flag set. Determinism constraints for `engine/`: no wall clock, no unordered map iteration into sim state, RNG only through engine-seeded simrng, sim-code float ops through simmath3d. `proc "c"` callbacks reconstruct the Odin context before allocator-dependent work. Format through odinfmt; the hook handles it. |
| `luau.md` | `**/*.luau`, `runtime/**`, `mods/**`, `samples/**` | The sandbox contract: mod Luau sees only the `svsw.*` boundary, never engine internals, the platform, the network, or `os`/`io`. Load order settings, then data, then control; the three-file mod layout. Project-relative asset paths. Load-order-deterministic asset handles, never content-derived. Hot-path Luau instruction budgets affect world hashes, so a `control.luau` hot-loop change is determinism-sensitive. StyLua formats through the hook; `luau-analyze` validates against the D34 strict/nonstrict split when installed. Editor Luau (D10) runs the same VM at an expanded capability tier; the mod tier never widens to accommodate editor code. |
| `go.md` | `server/**`, Go files under `protocol/**` and `tools/**` | Module path `github.com/svswengine/...` (D25). gofmt runs through the hook. golangci-lint is the meta-linter, installed as a prebuilt binary rather than `go install`. The known trap: golangci-lint cache staleness after worktree removal; run `golangci-lint cache clean` before trusting a red lint in a fresh worktree. Protocol code (D15): wire frames are versioned, checksum-first, length-prefixed; the Odin and Go codecs both pass `just proto-conformance` over the shared recorded corpus; a frozen envelope field change is a decision-log reopen. QUIC connects client and gateway; loopback TCP connects gateway and worker (D18). The server is authoritative (D6); no sim logic duplicates into Go. |
| `c-tier.md` | `vendor/**`, `engine/render3d/gpu/**`, `engine/platform_sdl/**` | D14: this is the only tier that may include C headers or call SDL3, wgpu, or cimgui; tier-scan enforces it, and a C capability needed elsewhere gets an Odin-facing seam here instead. FFI edge rules: document ownership at every boundary proc, explicit struct layout matched to the C ABI, no Odin slices or strings crossing the edge without length and lifetime notes, calling convention stated. `vendor/` is quarantined, untrusted source: pinned by checksum or commit with provenance in VENDOR.md, never hand-edited, added only through the vendor-quarantine skill. |
| `wgsl.md` | `**/*.wgsl` | Every shader validates through the pinned naga-cli (`just shader-check`); the PostToolUse hook runs it per file and feeds errors back. Cross-backend rules: WGSL compiles to SPIR-V, MSL, and HLSL through wgpu, so backend-divergent constructs (implicit derivatives in non-uniform control flow, precision-sensitive reductions) are avoided. Anything a shader writes into a readback golden is tolerance-compared per tier, platform, shader backend, and input track (see the golden-hashes skill). Draw-list skeleton hashes exclude floats by design; a skeleton-hash mismatch is not fixed by rounding. D22: the render path never forks by headless or windowed mode; both render into one offscreen target. |
| `specs.md` | `docs/**` | The `docs/specs/README.md` schema is fixed (Stage, Status, Goal, Working software, Depends on, Decisions, Course, Prototype ports, Scope in, Scope out, Open questions); an edit preserves every field. A status transition edits that table, the sole record of spec status (D37). The decision log is settled; a change contradicting a decision number requires the maintainer to reopen it explicitly. A published course module regressing (embed-check red against the pinned engine commit) demotes its spec to "implemented"; the transition is recorded, not hidden. Docs PRs from adversarial reviews follow the review-to-docs-pr format. |

**Amendment (D33):** `lua.md` becomes `luau.md`, scoped to `**/*.luau`
plus `runtime/**`, `mods/**`, `samples/**`; its sandbox-contract content
carries over unchanged. StyLua replaces stylua as the formatter (it
supports Luau natively); `luau-analyze` joins the gate tooling for the D34
strict/nonstrict typecheck split.

Which two subsystems keep a nested CLAUDE.md, and the S00 task that
verifies paths frontmatter against the installed Claude Code version, are
under Multi-language routing below.

## Skills

| Name | Trigger | Purpose | Source | Owning spec |
|---|---|---|---|---|
| spec-ceremony | "start writing spec S0X", "write the spec", "mark S0X implemented", any spec status transition | Two steps and no more (D37): authors the spec document from the fixed schema, folding in the grilling dispositions it is handed, and moves that spec's row in the `docs/specs/README.md` table, which is the sole record of spec status. The brainstorm-and-grilling phase ahead of it belongs to other skills; see `docs/agents/skills.md`. Refuses to let implementation start on a spec that is not yet "spec written". | new | S00 |
| check-triage | "just check failed", "gate is red", "CI red", pasted gate failure output | A gate-name-to-fix-flow table seeded at S00 with the bootstrap gates and extended by each spec that adds a gate. Carries the internal prototype's false-green-traps category verbatim: explicit exit-code capture instead of piping, worktree-local green versus root green, golangci-lint cache staleness. Defers to the justfile as source of truth on drift. | ported from the internal prototype's check-triage skill | S00 |
| merge-prune | "merge and clean up", "land this PR", "ship it", "merge this and delete the branch" | Ordered PR-merge hygiene: confirm green checks before merging, merge and delete the branch, return to main, pull, verify cleanup, clean the golangci-lint cache. A wave-merge appendix sequences multiple worktree lanes through the gate one at a time. | ported from the internal prototype's merge-prune skill, unchanged | S00 |
| review-to-docs-pr | "write up the review", "review findings to docs", "file the adversarial review", after any adversarial-review run the maintainer wants persisted | Turns adversarial-review output into themed docs, one file per lens, on a docs-only branch opened as a docs-only PR. Enforces the output contract: no doc ships with an empty section or a stub marker, and every citation is re-verified against the tree at write time. | new | S00 |
| win-rig | "run on Windows", "win-check", "win-run", "windows golden", "remote rig" | The usage procedure for the remote Windows rig: config from a gitignored local file, SSH sync plus a native build plus the headless gate suite (win-check), the windowed interactive-desktop launch (win-run, a human checkpoint), and how Windows-recorded goldens flow back if S02b promotes Windows to a third golden platform. | new | S00 |
| vendor-quarantine | "vendor a library", "add a dependency", "update SDL3/wgpu/cimgui/Luau", "new C dep" | The quarantine-first dependency procedure as a checkable flow: check `core:`/`vendor:` stdlib first, propose and wait for maintainer review, pin by checksum or commit, record provenance in VENDOR.md, treat unreviewed source as untrusted, never hand-edit vendored files. Includes the checksum-pinned prebuilt-binary flow for wgpu-native and naga-cli. | new | S01 |
| golden-hashes | "golden drifted", "hash mismatch", "re-record golden", "determinism failure", "parity hash differs" | A triage-first protocol for the three golden tiers (world hash including per-chunk-to-root composition, draw-list skeleton hash, wgpu readback golden): the intended-change-versus-regression decision gate, sanctioned re-record flows, per-tick bisection, and the four-axis key of tier, platform, shader backend, and input track. | ported from the internal prototype's golden-hashes skill | S02a |
| parity-verify | "verify without a window", "headless QA", "did the render change", "parity check", "visual check" | Successor to headless-verify, built on D22: headless and windowed runs share one offscreen target, so verification means running headless and comparing the world hash, skeleton hash, and readback golden, then frame-diffing. Documents the explicit human-only carve-out (real-GPU visuals per backend, audio, present or resize) that gets handed off, never claimed. | ported from the internal prototype's headless-verify skill | S04 |
| lua-binding | "add a Luau API", "new svsw.* function", "expose to mods", "binding" | The D3 registrar pattern, longjmp safety rules read fresh from `host.odin` rather than paraphrased, `proc "c"` context reconstruction, the `L_error`-versus-assert split, the D10 capability-tier note for editor Luau, and the completion checklist (accept test, api-coverage, api-surface regen, .d.luau declarations). | ported from the internal prototype's lua-binding skill, near-verbatim | S14 |
| proto-conformance | "protocol change", "wire frame", "envelope", "proto-conformance failed", "version negotiation" | Working the versioned Odin-to-Go wire protocol (D15): frame layout invariants, running `proto-frame-check` with the hostile-frame fuzz corpus, the two-stage freeze (v0 at S05, the v1 envelope and three-call worker contract at S26), and the rule that conformance runs from both codecs over one recorded corpus; a change green on one side only is red. | new | S05, extended at S26 |
| course-pairing | "write the course module", "embed-check", "truth-verify", "lesson drift", "publish the module" | The D27 spec-course pairing procedure: author the module only after "implemented", pass embed-check against the pinned engine commit, the reference cross-check, the path-closure check across the consumable paths, and the full site build; a regression demotes the paired spec. | ported from the internal prototype's course-embeds skill | C00 |

**Amended by D40: when a skill splits.** A skill splits when a section
grows per spec, or is needed only after a branch point. Length alone is not
the trigger. Of the five at S00 only check-triage qualifies, on both counts
at once: its gate-name-to-fix-flow table gains a row per gate-adding spec,
and only the row for the gate that is red is wanted in a given session. Its
`SKILL.md` keeps the triage method and the false-green traps, which are
judgement and do not grow, and loads the table from a separate file once it
knows the gate name. The other four stay whole. One rule binds all of them:
a skill names where truth lives and reads it, rather than carrying a copy
that can go stale unnoticed, which is why check-triage defers to the
justfile and spec-ceremony points at the spec schema instead of restating
its field list.

## Agents

**Amended by D40.** The exception is withdrawn and agents stage with their
gates. Four ship at S00, because their subject exists there: gate-runner,
win-rig-runner, spec-scribe, and determinism-reviewer, the last of which
never had a gate dependency. golden-recorder lands at S02a, binding-dev at
S14, go-services-dev at S26, and course-writer at C00. Refusal clauses go
with the exception, so the `Refusal clause` column below now reads as the
owning spec each staged agent waits on. The table stays whole: it is where
the roster's intent is visible, which is the one job the shipped-but-
refusing definitions were doing.

The full agent roster ships at S00 as an exception to gate-staged
placement (grilled decision 2). Every agent whose gate does not exist yet
carries an explicit refusal clause of the form "gate not yet present; see
spec SNN".

| Name | Purpose | Tools | Model tier | Refusal clause |
|---|---|---|---|---|
| gate-runner | Runs a named just gate or the full `just check`, captures the exit code explicitly rather than piping it, and reports the gate name, exit code, and the first failing sub-gate excerpt. One sanctioned retry covers the golangci-lint cache trap after worktree removal; otherwise it never blind-retries a red gate. | Bash, Read, Grep, Glob | haiku (mechanical) | None; `just check` exists from S00. |
| golden-recorder | Re-records goldens across the three tiers only when the requester states the drift is an intended content change, and refuses otherwise. Locates the owning define, records, pastes the exact constant, re-runs clean to confirm green, and never commits. States the four-axis key it recorded under. | Bash, Read, Grep, Glob, Edit | haiku | "Gate not yet present; see spec S02a" until the determinism pyramid lands; the render-tier goldens carry the same clause pointing at S04. |
| win-rig-runner | Mechanical remote-Windows execution over the win-rig skill: sync, build, run the named headless gate over SSH, report exit codes and log excerpts. Never launches win-run, the interactive-desktop path; that hands back as a human checkpoint. | Bash, Read, Grep, Glob | haiku | None; the win-check and win-run recipes ship with S00. |
| determinism-reviewer | A single-lens, read-only D1 review: wall-clock reachability, unordered iteration into sim state, float nondeterminism including simmath3d bypasses and cross-backend GPU float concerns, RNG misuse, allocation-visible behavior, hot-path Luau budget changes, D11 animation state leaking on-hash, D22 mode-forked render paths. Every finding carries a file:line citation and a concrete failure scenario; an explicit "no findings" verdict is a valid output. | Bash, Read, Grep, Glob | opus (extended reasoning) | None; it reviews spec drafts and general diffs from S00, and sharpens against the determinism pyramid once S02a lands. |
| spec-scribe | Supports the spec-ceremony skill: drafts the spec document from the brainstorm and grilling transcript into the fixed `docs/specs/README.md` schema, records grilling dispositions verbatim, and updates the status table, the one place a spec's rung moves (D37). Write access limited to `docs/specs/`. Every schema field must be non-empty or explicitly marked "open question". | Bash, Read, Grep, Glob, Edit, Write | sonnet | None; the spec-ceremony skill it supports ships with S00. |
| binding-dev | Scoped implementer for `svsw.*` bindings: its prompt mandates karpathy-guidelines, ponytail, and the lua-binding skill before any edit, follows the approved plan verbatim, works test-first, and hands verification back rather than re-recording a golden itself. | Bash, Read, Grep, Glob, Edit, Write | sonnet | "Gate not yet present; see spec S14" until the scripting boundary lands. |
| go-services-dev | Scoped implementer for `server/` and `protocol/` Go code: mandates karpathy-guidelines, ponytail, and the proto-conformance skill, runs gofmt, `go vet`, and golangci-lint locally before handoff, never changes a frozen envelope, and hands cross-codec conformance verification to gate-runner. | Bash, Read, Grep, Glob, Edit, Write | sonnet | "Gate not yet present; see spec S26" (and S27a for the gateway) until the Go services surface lands. |
| course-writer | Authors course modules through the course-pairing skill; lives in the `course` sibling repo's own `.claude` tree once that repo exists. Mandates truth-verify of every embed and reference against the pinned engine commit before claiming a module done. | Bash, Read, Grep, Glob, Edit, Write | sonnet | "Gate not yet present; see spec C00" until the course platform bootstraps. |

Every gate-owning spec's exit checklist gains the item "re-verify and
update the agents that reference this gate", so a refusal clause never
outlives the gate it points at.

## Hooks

Hooks are graduated by cost (grilled decision 3): formatters never block;
diagnostic hooks feed information back for a fix-up turn rather than
halting an action that already completed; exactly one hook blocks, and it
is a sub-second grep of the staged diff.

| Event | Matcher | Command | Posture |
|---|---|---|---|
| SessionStart | `startup\|resume` | `.claude/hooks/session-start.sh` runs `bd prime --hook-json` when a beads database exists, and exits clean when none does | Non-blocking, kept fast; loads slice context only. Beads engages at ticket overrun (D37), so most sessions find no database and the hook is a no-op; spec status is never loaded here, it lives in `docs/specs/README.md`. |
| PostToolUse | Edit/Write on `*.odin` | `.claude/hooks/fmt.sh odin` runs odinfmt, warning and exiting clean if odinfmt is missing | Non-blocking, warn-if-missing, 10s timeout. |
| PostToolUse | Edit/Write on `*.luau` | `.claude/hooks/fmt.sh luau` runs StyLua if present, warns and skips otherwise | Non-blocking, warn-if-missing, 10s timeout. |
| PostToolUse | Edit/Write on `*.go` | `.claude/hooks/fmt.sh go` runs gofmt, then goimports if present | Non-blocking, 10s timeout; gofmt ships with the toolchain, so no guard is needed. |
| PostToolUse | Edit/Write on `*.wgsl` | `.claude/hooks/wgsl-validate.sh` runs the checksum-pinned vendored naga-cli and returns diagnostics as additional context on a validation error | Non-blocking diagnostic feedback, 15s timeout; a PostToolUse hook cannot undo a completed edit, so this surfaces errors for the next turn instead of halting anything. |
| PostToolUse | Edit/Write, all files | `.claude/hooks/marker-scan.sh` greps the touched file for conflict markers, `#region`/`#endregion`, and the canonical stub-marker list | Non-blocking diagnostic feedback, sub-second. |
| PreToolUse | `Bash(git commit*)`\|`Bash(git merge*)` | `.claude/hooks/pre-commit-scan.sh` greps the staged diff for the same marker list plus trailing-whitespace-only lines | **Blocking** (exit 2); the one hook in the roster that stops a command before it runs. Sub-second, staged-diff-only. |
| WorktreeRemove | `*` | `.claude/hooks/worktree-clean.sh` cleans the golangci-lint cache and prunes stale worktree entries | Async, non-blocking. |
| SubagentStop | `spec-scribe\|course-writer` | `.claude/hooks/output-contract.sh` validates the declared output artifact: non-empty, no stub markers, citations resolve | Non-blocking on the completed turn; a violation signals the retry-once path in the reliability policy rather than undoing the subagent's work. |

odinfmt is documented as a dev dependency in the S00 setup docs, installed
beside odin, ols, just, and bd, only after the formula is confirmed
installable on the actual machine (grilled decision 8). The hook keeps its
warn-don't-fail posture regardless of that documentation, so a missing
odinfmt on a fresh clone never blocks an edit.

## Workflows

| Workflow | Lands at | Purpose | Output-contract hardening |
|---|---|---|---|
| adversarial-review | S00 | A multi-lens finder plus independent-skeptic pipeline, branch-scoped (`main...HEAD` by default, overridable). Lenses rewritten for svsw: determinism (D1, D11, D22), the Luau sandbox boundary, the tier boundary (the D14 C-tier import policy plus the C-to-Odin ABI: calling convention, struct layout, ownership across the FFI edge), TigerStyle, memory safety; a go-services lens (goroutine discipline, state authority, protocol-freeze) is added once stage 5 exists. The skeptic defaults to "not real" when uncertain; survivors are grouped by severity with lens-precedence tie-breaks. Read-only; fixes return through the normal coding path. | Schema-typed I/O with minimal required-field lists, so an empty-array finding is a valid "nothing found" result. A per-step output-contract validator runs between phases: every agent payload must be non-empty, free of stub markers, and every file:line citation is mechanically resolved against the working tree before the skeptic sees it; an unresolved citation is discarded and logged. A step that fails the contract retries once with the validation error appended to its prompt; a second failure drops that lens, and the report's coverage note reconstructs from the raw diff instead of shipping a stub finding or silently dropping the lens. |
| comment-review | S00 | A near-verbatim port of the prototype skill: the explain-why, refactor-first, maintain-truth rubric, an AREAS list rewritten for the D25 layout, and the false-positive protection list (dense provenance and determinism comments, license headers, ponytail markers) extended with FFI ownership annotations in the C tier and protocol frame-layout comments. The skeptic defends the status quo. | Shares the adversarial-review validator module and the same retry-once-then-reconstruct policy; citation resolution is mandatory before any comment-change suggestion is reported. |
| spec-review | S00 | A small pre-"spec written" pass over a drafted spec: a determinism and architecture reader using the determinism-reviewer brief, a scope reader checking the draft against its README schema entry (every depends-on spec is "spec written" or later, every named gate has an owner, scope-out is explicit, every grilling disposition is addressed), and one skeptic. Cheap by design, run once per spec draft ahead of maintainer sign-off. | Shares the output-contract validator; a reader that returns an empty section report is retried once, then the orchestrator re-reads the draft itself and reconstructs that section's verdict directly. Findings must quote the spec text they concern, checked mechanically as a substring of the draft. |
| truth-verify | C00 (course repo) | For a course module, extracts every embed, reference, and claim, re-validates each against the pinned `svsw` engine commit (embed line ranges exist and match, reference keys resolve, prose claims about code behavior are spot-checked by a skeptic agent reading the actual source), then runs path-closure over the consumable paths. Output is a pass or a per-violation drift report. | Every verification step emits a claim, its source file:line at the pinned commit, and a verdict; a step returning empty or unresolvable evidence retries once, then the item is marked FAILED-UNVERIFIED rather than passed. A module cannot reach "course published" with any unverified item, and the no-stub rule applies to the drift report itself. |

## Reliability policy

**Amended by D40.** The policy splits on whether a clause has a mechanical
enforcer. Clauses 1 and 2 move into the workflow validator and the agent
definitions that already enforce them. Clause 3 is documentation of the
system and stays here. Clause 4 stops being prompt text entirely and
becomes a sourcing rule: `.claude/hooks/marker-scan.sh` holds the canonical
list, every validator and hook reads it from there, and no workflow, agent
or skill restates it, which is strictly stronger than asking a model to
keep copies in step. Root CLAUDE.md keeps one sentence, covering the only
path none of the above reaches: validate a subagent's output before using
it when the dispatch is ad hoc rather than through a workflow.

Stated once, in root CLAUDE.md's Reliability section; every workflow,
agent definition, and the spec-ceremony and review-to-docs-pr skills
reference it instead of restating it.

1. **Output contract.** Any agent or workflow-step output that feeds a
   deliverable (a report, a spec doc, a docs PR, a finding, a course
   module) must be non-empty, contain none of the canonical stub markers
   (one list, maintained in `.claude/hooks/marker-scan.sh` and sourced by
   every workflow validator: `PLACEHOLDER`, `STUB`, `TODO(agent)`, `lorem`,
   `XXX-FILL`, `#region`), and have every file:line citation mechanically
   resolved against the working tree, or against the pinned engine commit
   for course material, before use.
2. **Recovery ladder.** A contract violation triggers exactly one retry
   with the specific validation error appended to the step's prompt. A
   second violation means the orchestrator reconstructs that piece from
   verified evidence it already holds (the diff, the draft, prior validated
   step outputs) and labels anything it could not reconstruct explicitly. A
   stub never ships; a gap is never silent.
3. **Layered enforcement.** Mechanical in workflows through a shared
   validator module between phases; mechanical at the agent boundary
   through the SubagentStop output-contract hook on spec-scribe and
   course-writer; conversational for ad-hoc dispatches through the
   CLAUDE.md clause requiring the parent to validate a subagent's output
   before using it.
4. **One marker list.** The same stub-marker list backs the write-time
   hook, the pre-commit hook, and the workflow contracts, so the
   incremental checks and the workflow contracts cannot drift apart.

## Multi-language routing

Mechanism: paths-scoped `.claude/rules/*.md` at the repo root is the
primary router; nested CLAUDE.md applies in exactly two places.

Rationale: svsw's languages do not map one-to-one onto directories. Odin
spans `engine/`, `cli/`, and `tests/`; Luau spans `runtime/`, `mods/`, and
`samples/`; Go spans `server/`, `protocol/`, and `tools/`; the C tier spans
`vendor/` plus two engine subpackages. A directory-placed CLAUDE.md would
duplicate each language's rules across several directories or leak them
into unrelated work. A rules file with `paths:` frontmatter activates when
Claude touches a matching file, wherever that file lives, and keeps the
always-loaded root lean.

Nested CLAUDE.md applies only where a subsystem carries a separate
toolchain and ownership story: `server/CLAUDE.md` (Go module conventions,
lint config, freeze rules; loads lazily when server files are read, and
supports starting a session rooted in `server/` once stage 5 exists) and
the `course` sibling repo's own root CLAUDE.md and `.claude` tree (a
separate repo, a separate Node and VitePress toolchain, C00 scope).
Cross-cutting invariants that decide reviews regardless of language (the
tier stack, D1, D22, the gate roster) stay in root CLAUDE.md because every
session needs them present.

S00 carries two verification tasks the routing design depends on: confirm
the installed Claude Code version supports paths frontmatter and the rules
and CLAUDE.md composition behavior empirically, with nested CLAUDE.md
documented as the fallback if it misbehaves; and confirm that per-directory
`.claude/settings.json` is not inherited, so every permission deny rule
lives in the root settings file where worktree sessions still see it.

## Permissions posture

Committed in `.claude/settings.json`: allow `just *`, `odin *`, `go
test`/`vet`/`build`, `gofmt`, read-only git, and bd; deny reads into
`vendor/**` except VENDOR.md manifests, `**/build/**`, and
`**/*.generated.*`; network-touching shell commands stay ask, matching the
no-network-beyond-plan-pins policy. The `WebFetch` tool is the one carve-out
and carries no rule at all (D39): `curl`, `wget`, the git network verbs,
`go get` and `go install` still ask, because they write into the working
tree where a fetch does not. Personal loosening goes in gitignored
`settings.local.json`, never in the committed file.

That last sentence has a limit worth stating, because it is not obvious and
it decides how every future entry is written. Permission rules resolve deny
over ask over allow, and the two settings files merge into one rule set
rather than the local file shadowing the committed one. A local `allow`
therefore cannot cancel a committed `ask`; it only reaches what the
committed file leaves silent. Anything meant to be loosenable per machine
has to be absent from the committed lists, not present with a stricter
verb.

Because D24 closes the repo to external contributions, the committed
settings serve the maintainer's own sessions first. The deny rules double
as prompt-injection surface reduction over untrusted vendored source: an
agent that cannot read `vendor/**` cannot be steered by instructions hidden
in a vendored file it was never asked to open.

Worktree sessions read the checked-out root settings, not a per-directory
override, so every deny rule lives at root.

## Review-cadence house rules

Three layers, by cost (grilled decision 7):

1. Free, on every edit and commit: the marker-scan and citation-resolution
   hooks, running as part of the normal edit and commit path.
2. Per spec draft: the spec-review workflow, a cheap multi-agent pass ahead
   of maintainer sign-off.
3. Pre-merge, billed: the full adversarial-review workflow on substantial
   branches, valued for whole-change coherence rather than per-line
   coverage.

One house rule bridges the layers: a branch older than about ten commits
gets a mid-branch adversarial pass on the diff accumulated so far, instead
of surfacing a branch-length backlog of findings all at once at the merge.

## Grilled decisions (2026-07-12)

These amend the original tooling design where they conflict with it.

1. **Staged placement.** S00 ships the bootstrap tooling core: root
   CLAUDE.md, the six paths-scoped rules files, hooks, committed
   permissions, and the spec-ceremony, check-triage, merge-prune,
   review-to-docs-pr, and win-rig skills, plus the adversarial-review,
   comment-review, and spec-review workflows. Every gate-dependent skill
   lands with the spec that creates its gate: vendor-quarantine at S01,
   golden-hashes at S02a, parity-verify at S04, lua-binding at S14,
   proto-conformance at S05 and S26, the MCP-server successor at S21,
   course-pairing at C00.
2. **Full agent roster at bootstrap.** As an exception to gate-staged
   placement, the full agent roster (gate-runner, golden-recorder,
   win-rig-runner, determinism-reviewer, spec-scribe, binding-dev,
   go-services-dev, course-writer) ships at S00. Every agent whose gate
   does not exist yet carries an explicit refusal clause ("gate not yet
   present; see spec SNN"), and every gate-owning spec's exit checklist
   gains the item "re-verify and update the agents that reference this
   gate". **Amended by D40:** the exception is withdrawn. gate-runner,
   win-rig-runner, spec-scribe and determinism-reviewer ship at S00;
   golden-recorder, binding-dev, go-services-dev and course-writer land
   with S02a, S14, S26 and C00. Refusal clauses go with it, and the
   exit-checklist item changes verb, from retiring a clause to adding the
   agent that gate owns.
3. **Graduated hooks.** Format-on-edit hooks (odinfmt, StyLua, gofmt) are
   PostToolUse and non-blocking, with warn-if-missing guards. The marker
   scan and the WGSL naga validation feed diagnostics back non-blocking.
   Exactly one hook blocks: the PreToolUse marker scan of the staged diff
   on git commit or merge, sized to run in under a second. Anything slower
   than about a second belongs in a gate, not a hook; worktree cleanup
   runs async.
4. **Paths-scoped rules as router.** `.claude/rules/*.md` with `paths:`
   frontmatter is the router for odin, luau, go, c-tier, wgsl, and specs.
   Nested CLAUDE.md applies only to `server/` and the `course` sibling
   repo. S00 verifies paths-frontmatter support against the installed
   Claude Code version, with nested CLAUDE.md documented as the fallback.
5. **Committed permissions.** `.claude/settings.json` commits a shared
   allow and deny list: allow `just`, `odin`, and Go build/test/vet,
   `gofmt`, read-only git, and bd; deny reads into `vendor/**` except
   VENDOR.md, build output, and generated files; network commands stay
   ask. Personal loosening lives in gitignored `settings.local.json`.
   **Amended by D39:** the `WebFetch` tool carries no committed rule, while
   network-touching shell commands keep their ask; and personal loosening
   reaches only what the committed file leaves silent, since a local
   `allow` cannot cancel a committed `ask`.
6. **Spec ceremony as a skill.** The spec-ceremony skill wraps the
   brainstorm-and-grilling flow. Beads is the status record: one bead per
   spec, a fresh database initialized at S00. The skill updates the
   docs/specs/README.md table in the same step as each bead transition, so the
   two records cannot drift apart. **Amended by D37:** there is only one
   record now, the `docs/specs/README.md` table, so no pairing is needed;
   beads tracks slices below a GitHub ticket instead of a bead per spec,
   and the skill's own scope narrows to authoring the spec document and
   moving that spec's row.
7. **Three-layer review cadence.** Marker and citation hooks run free on
   every edit and commit; the spec-review workflow runs once per spec
   draft; the billed adversarial-review workflow runs pre-merge. A house
   rule bridges the gap: any branch older than about ten commits gets a
   mid-branch adversarial pass on the diff accumulated so far.
8. **Toolchain verification before documentation.** odinfmt is documented
   as a dev dependency in the S00 setup docs, installed beside odin, ols,
   just, and bd. The format-on-edit hook keeps its warn-don't-fail posture
   regardless. The formula is re-verified on the actual machine during S00
   before the docs line is written.
9. **Asset MCP servers deferred.** Per-format asset MCP servers (glTF and
   assetc, the D19 container work) are deferred to S12a, their owning
   spec. The internal prototype's proven single-format-server pattern is
   recorded as an open question in S21, the spec that defines the sim and
   render MCP surface.
