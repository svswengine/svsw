# Domain docs

How the engineering skills consume this repo's domain documentation when
exploring the codebase, and how they write a decision back into it.

## Before exploring, read these

- **[`docs/context/CONTEXT.md`](../context/CONTEXT.md)**: the glossary and
  domain model. It exists and it is populated, so read it before you name a
  domain concept in any output. Under D30 this repo keeps documentation
  markdown in subdirectories of `docs/`, so the context file lives here
  rather than at the repo root.
- **`docs/decisions/`**: this repo's decision record, and the ADR
  equivalent for every skill that says "read the ADRs". One file per
  decision (`D<nnn>-<slug>.md`), indexed in
  [`docs/decisions/README.md`](../decisions/README.md). Read the decisions
  that touch the area you are about to work in.

There is no `docs/adr/` and there should not be one: `docs/decisions/` is
canonical, and a second decision log would compete with it.

`docs/research/` is a closed corpus, a record of the research era, read as
reference. Never write into it, including a finding from research you did
today or a rationale file for a decision you are writing now. It uses a
different decision numbering; the mapping table lives in
`docs/decisions/README.md`. Outside `docs/research/`, cite research-era
numbers with the `R-D` prefix (e.g. `R-D54`).

This is a single-context repo: one `CONTEXT.md`, no `CONTEXT-MAP.md`, no
per-context glossaries.

## Glossary overrides

Two skill defaults are wrong in this repo, and both need overriding on
every run, not only the first.

**Path.** Four installed skills reach for a glossary this repo does not
have: `/domain-modeling` and `/tdd` look for a root `CONTEXT.md`, `/qa`
and `/ubiquitous-language` look for `UBIQUITOUS_LANGUAGE.md`. Both
defaults put documentation markdown at the repo root, which D30 bars. All
four read and write `docs/context/CONTEXT.md` instead, and no root-level
glossary is created, not even as a stub or a pointer file.

**Format.** The glossary is written in `/ubiquitous-language`'s output
format: grouped tables of Term | Definition | Aliases to avoid, followed
by Relationships, an example dialogue, and Flagged ambiguities. That
format governs the file whichever skill is writing it. `/domain-modeling`
maintains the glossary inline during a `/grill-with-docs` session, and its
own CONTEXT-FORMAT (one prose entry per term with an `_Avoid_` line) does
not apply here, so do not convert the tables into it.

A new term is a new row in the matching section's table: the Term cell
bolded (`**Spec**`), then the definition, then the aliases it must not
drift to. A term belonging to no existing section takes a new section with
a table of the same three columns. If the term is ambiguous, add it to
**Flagged ambiguities** too. If it only reads correctly against a term
already in the file, add a **Relationships** bullet.

## Use the glossary's vocabulary

When your output names a domain concept (in a ticket title, a refactor
proposal, a hypothesis, a test name), use the term as defined in
`docs/context/CONTEXT.md`. Don't drift to synonyms the glossary explicitly
avoids.

If the concept you need isn't in the glossary yet, either you are
inventing language the project doesn't use (reconsider) or there is a real
gap. Note the gap and leave it there: adding or changing a term is
`/grill-with-docs`' job, not a passing edit.

## How to write a decision in this repo

`/grill-with-docs` records decisions through `/domain-modeling`, whose
ADR-FORMAT would write `docs/adr/0001-slug.md` with a one-to-three-sentence
body and no required headers. None of that applies here. Write the
decision as set out below.

**File name.** `docs/decisions/D<nnn>-<slug>.md`, the number three digits
and zero-padded, taking the next number above the highest in either table
of the index. Numbers are never reused, including those of superseded and
withdrawn decisions.

**Headers.** An `# D<n>: <Title>` heading, whose number is written
unpadded: decision 37 is `# D37: …` inside the file `D037-<slug>.md`. The
filename is the only place the number is padded. Then the header lines,
then the body:

```
Status: current
Date: 2026-07
```

`Status: current` means in force. `Date: YYYY-MM` is the month the text
first entered this repo's history. A decision that is fully superseded
keeps its filename, its `Status` line becomes
`Status: superseded by D<mmm>` with that number linking to the superseding
file, and its index row moves out of the Current table into Past. All
three, or the index goes on advertising a dead decision as live. The
Lifecycle section of
[`docs/decisions/README.md`](../decisions/README.md) is the full
statement.

**Rejected alternatives.** A decision that chose between real alternatives
either names the rejected ones in one sentence or carries a third header
line, `Rationale: docs/research/<file>`, pointing at the research that
settled it. That pointer may cite only a file already in the corpus:
`docs/research/` is closed, so a decision written today can never create
the file it points at. When the reasoning comes from research done now,
name the rejections in the decision's own prose, woven in the way the
inherited files do ("cgo in-process embedding is rejected", "Chosen over
raw TCP/TLS") instead of set off under a `Rejected:` label.

**Index row.** Add the row to the Current table in
[`docs/decisions/README.md`](../decisions/README.md) in the same change
that adds the file. The row carries three columns: the number as `D<n>`
unpadded, the title, and a relative markdown link whose text and target
are both the filename. A decision file with no index row is not landed.

**Partial supersession.** A decision that amends part of an earlier one
does not supersede it: both stay `Status: current`. The amending decision
names what it amended and in what respect, and the amended text gains a
line naming the amender, each citing the other by current number. Leave
the amended decision's original substance alone and append the note.

**House style.** One dense paragraph, a few at most; the longest inherited
decision runs to about 264 words. Prose throughout, present tense, no
bullet lists and no headings inside the body. Hard-wrap the prose at
roughly 76 columns, the way the existing decision files do.

**Research-era numbers.** A decision citing a research-era decision writes
the number with the `R-D` prefix (`R-D54`), because `docs/research/` runs
its own numbering and a bare `D54` would read as a current decision that
does not exist.

## Flag decision conflicts

Decisions in `docs/decisions/` are settled; reopening one is a maintainer
call, and numbers are never reused. Never write anything that contradicts
a decision whose status is `current`. If your output would, stop and
surface it rather than silently overriding:

> _Contradicts D11 (animation is presentation-only, off-hash): worth
> raising with the maintainer because…_
