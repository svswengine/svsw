# Skills: which skill drives which rung

The routing map for the installed engineering skills in this repo: which
rung of the spec ladder each one operates on, which layer of the tracker it
writes to, and where this repo overrides the skill's default behavior.

This file is documentation, not a decision. The decided model, two trackers
layered rather than mirrored with beads below a ticket, is
[D37](../decisions/D037-work-decomposition.md). This file records how
today's skill set is wired onto it. Update it whenever the installed skill
set changes.

## The ladder

```
docs/specs/README.md          status ladder — the one spec-status record
docs/specs/<id>-<slug>.md     normative spec document

pending ─────┐
             │  /wayfinder map  (GitHub issue, label wayfinder:map)
             │    children = that spec's "Open questions" field
brainstormed │      labeled wayfinder:research|prototype|grilling|task
grilled ─────┘  reached when all map children are closed
             │  /grill-with-docs writes glossary + decisions as it goes
spec written ── spec doc authored, index row updated
             │
             │  /to-tickets  →  tracking ticket (holds the breakdown)
             │                    └─ N child tickets, one session each
             │
             │  /implement, one ticket per fresh context
             │    ├─ fits one session:  TDD loop → /code-review → commit → PR
             │    └─ overruns:          bd epic (--external-ref gh-<n>)
             │                            └─ slices, each CI-green + committed
             │                          `bd ready` resumes the next session;
             │                          `bd epic close-eligible` closes the ticket
implemented ─┘
course published
```

A spec moves from pending to grilled when the last child issue of its map
closes: `/wayfinder` edits that spec's `Status` row as the final step of
resolving that child issue. `brainstormed` is a rung the ladder records, but
no tracker event marks it separately, because with N grilling child issues
no single moment is the one that earns it. The maintainer moves the three
rungs above it: to `spec written`, to `implemented` once the gate is green,
and to `course published`. `spec-ceremony` takes the first when it lands at
S00 and `course-pairing` the last at C00; the move to `implemented` stays
the maintainer's.

## Routing table

The table covers the skills that touch the ladder or the tracker. A skill
absent from it needs no repo-specific override, and still owes the glossary
its vocabulary and D31 its silence on private product specifics.

| Skill | Rung or layer | Reads | Writes | Repo-specific override |
| --- | --- | --- | --- | --- |
| `/grilling` | pending → grilled, inside one `wayfinder:grilling` child issue | The spec's index entry, the decisions it names, the glossary | Nothing; the session's answer is recorded on the child issue | Human-in-the-loop: never answer its own questions or stand in for the maintainer. |
| `/grill-with-docs` | Same rungs as `/grilling`, plus the durable record | Same, plus `docs/decisions/` | `docs/decisions/D<nnn>-<slug>.md` and `docs/context/CONTEXT.md` | Decision files use this repo's format (`D<nnn>-<slug>.md`, `Status:` and `Date:` headers, index row in `docs/decisions/README.md`), never `docs/adr/0001-slug.md`. The glossary uses the `/ubiquitous-language` format at `docs/context/CONTEXT.md`. Never contradict a decision whose status is `current`. |
| `/wayfinder` | Owns pending → grilled | The spec's `Open questions` field, which seeds the map's children | A `wayfinder:map` issue plus its child issues; the map's Decisions-so-far index; the spec's `Status` row in `docs/specs/README.md` | One map per spec, never per ticket. **This repo calls a map's children child issues, never tickets:** keep the skill's own "decision ticket" and "child ticket" wording out of issue titles, bodies, and labels, because `Ticket` here means an implementable piece of a spec. Child issues resolve toward a decision, not by shipped code. Research child issues go to a `research/<name>` branch. On closing the map's last child issue, set that spec's `Status` to `grilled` as the final step of resolving it. Wayfinding mechanics live in [`issue-tracker.md`](issue-tracker.md). |
| *(no skill today)* | grilled → spec written | none | none | The maintainer writes the spec document and moves the index row. D28's planned `spec-ceremony` skill takes this rung when it lands at S00, narrowed by D37 to those two acts. |
| `/to-spec` | Outside the ladder only | The conversation and codebase | One GitHub issue holding the PRD | **Banned for every spec-index entry**; see below. |
| `/to-tickets` | spec written → the tracking ticket and its tickets | `docs/specs/<id>-<slug>.md` | One tracking ticket whose body is the numbered breakdown, plus N child tickets as its sub-issues | Publish to GitHub, never to `.scratch/` local files. **The skill's "vertical slice" is this repo's `Ticket`:** the word *slice* belongs to the beads layer and stays out of ticket titles and bodies. Never opens a beads epic. Apply `ready-for-agent` only under the rule in [`triage-labels.md`](triage-labels.md). |
| `/implement` | spec written → implemented, one ticket per fresh context | The ticket, its spec document, the decisions the spec names, the glossary | Code, tests, commits, a PR; a beads epic and its slices when the ticket overruns | Opens the epic at overrun, not at filing time. Never write implementation code for a spec below spec written. The maintainer moves the index row to implemented once the gate is green; `/implement` does not edit the spec index. |
| `/tdd` | Inside one ticket, or inside one slice | `docs/context/CONTEXT.md` for vocabulary; `docs/ODIN_STYLE.md` for the code standard | Tests and the code that passes them | The glossary is at `docs/context/CONTEXT.md`, not a root `CONTEXT.md`; see [`domain.md`](domain.md). One slice is one red-green-refactor increment; it lands CI-green and committed. |
| `/code-review` | A ticket's diff, before merge | `docs/ODIN_STYLE.md` as the Standards source; the ticket and its spec document as the Spec source | Review findings | The Spec axis resolves the spec through the ticket, so the ticket must cite its spec document path. Cadence and the adversarial pass are D29's. |
| `/research` | A `wayfinder:research` child issue, or any open question | Primary sources | One Markdown file on a `research/<name>` branch, linked from the child issue | Never writes into `docs/research/`; closed corpus, see below. |
| `/prototype` | A `wayfinder:prototype` child issue | The design question and the surrounding code | Throwaway code on a branch, linked from the child issue | Output is throwaway and never lands on main; see below. |
| `/triage` | Inbound GitHub issues from outside the ladder | The GitHub issue and its comments | Labels and comments | PRs are not a request surface (D24); see [`issue-tracker.md`](issue-tracker.md). Label strings are in [`triage-labels.md`](triage-labels.md). Every triage comment opens with the line `> *This was generated by AI during triage.*` |
| `/qa` | Files new tickets from observed defects | `docs/context/CONTEXT.md` for vocabulary | GitHub issues | The glossary is at `docs/context/CONTEXT.md`, not `UBIQUITOUS_LANGUAGE.md`. New issues enter at `needs-triage`, not `ready-for-agent`. |
| `/domain-modeling` | No rung; the glossary and the decision record, usually reached through `/grill-with-docs` | `docs/context/CONTEXT.md`, `docs/decisions/` | `docs/context/CONTEXT.md`, `docs/decisions/D<nnn>-<slug>.md` | Defaults are wrong three ways: the glossary is at `docs/context/CONTEXT.md`, not a root `CONTEXT.md`; its format is `/ubiquitous-language`'s, not this skill's CONTEXT-FORMAT; decisions go to `docs/decisions/D<nnn>-<slug>.md`, never `docs/adr/0001-slug.md`. See [`domain.md`](domain.md). |
| `/ubiquitous-language` | No rung; the glossary | `docs/context/CONTEXT.md` | `docs/context/CONTEXT.md` | Writes `UBIQUITOUS_LANGUAGE.md` by default; this repo's glossary is `docs/context/CONTEXT.md`, and its format is the one this skill emits. |
| *(no skill today)* | implemented → course published | none | none | The maintainer authors the course module and moves the index row. D28's planned `course-pairing` skill takes this rung when it lands at C00 in this repo's skill roster (D27). |

## Two parent-issue kinds

Both are a GitHub issue with child issues and blocking edges. They are
different kinds and **must never share a label**.

| | Wayfinder map | Tracking ticket |
|---|---|---|
| Label | `wayfinder:map` | none |
| Children resolve | **toward a decision** | **by shipped code** |
| Child labels | `wayfinder:research\|prototype\|grilling\|task` | `ready-for-agent` etc. |
| Ladder rung | pending → grilled | spec written → implemented |
| Sizing rule | one 100K-token session | one fresh context window |

Labeling a tracking ticket `wayfinder:map` makes `/wayfinder` try to resolve
build work as decisions and refuse to implement it. Check the label before
treating a parent issue as either kind.

## Sizing

A ticket is sized to one fresh context window. That is the only sizing rule
applied at filing time, and `/to-tickets` applies it unmodified.

`/implement` reaches for beads only when a ticket overruns one session. It
opens the epic at that point, with `--external-ref gh-<n>` naming the
ticket, and works the slices from there. When a ticket fits one session, its
TDD loop is the slices.

## `/to-spec` is banned for every spec-index entry

A spec is any entry in the [spec index](../specs/README.md), S, C and M
series alike, and its own document at `docs/specs/<id>-<slug>.md` is the
spec. A second PRD-shaped document would compete with both, so `/to-spec`
never runs against any of them.

`/to-spec` is reserved for work that is not in the index: documentation
efforts, tooling, bug reports, and course-repository infrastructure that is
not the C00 spec. Such work has no spec document, so its PRD is the whole
record.

M00 is the standing exception on the document side, not the skill side: it
stands at spec written, its record is the design record at
`docs/design/editor-mockup.md`, and its index entry has not collapsed to a
row yet. `/to-spec` is banned for it all the same.

## The `ready-for-agent` gate

The rule binding this label to its spec's rung lives in
[`triage-labels.md`](triage-labels.md). Read it there before applying the
label.

## Tracking tickets cite their spec

A tracking ticket's body names its spec document path
(`docs/specs/<id>-<slug>.md`), and its child tickets inherit that reference.
`/code-review`'s Spec axis resolves the originating spec by walking from the
commit's GitHub issue reference to the ticket, so a ticket that does not
cite its spec document leaves that axis with nothing to review against.

## Research output

New research goes to a throwaway `research/<name>` branch, with a context
pointer from the child issue that asked for it. It never lands in
`docs/research/`: that directory is a closed corpus on the research-era
decision numbering (see [`domain.md`](domain.md)), and appending to it would
mix two eras of vocabulary and two numbering schemes in one place.

Durable findings graduate out of the branch by becoming a decision file, an
entry in a spec's `Open questions`, or a glossary term.

## Prototype output

A `/prototype` artifact is throwaway: it answers one design question, lives
on a branch, and is linked from its child issue. Write what the prototype
proved into a decision; delete the rest.

That is a different thing from a committed design artifact such as the M00
editor mockup, which is normative for the editor specs, lives under
`docs/design/`, and carries its own design record. A throwaway prototype is
never cited as a reference, and a design artifact is never deleted as
scratch.
