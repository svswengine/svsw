---
name: docs-conventions
description: House conventions for writing or editing documentation in the svsw repo: where a markdown file may live, how prose wraps, how internal links are written, the fixed spec index schema, and the em dash rule. Use before creating or editing any markdown under docs/, before adding a new documentation file anywhere in the repo, and before editing the docs router or the spec index.
---

# Documentation conventions

These bind every documentation artifact in this repo except two.
`docs/agents/domain.md` owns how to write a **decision** file in
`docs/decisions/` and how to extend the **glossary** at
`docs/context/CONTEXT.md`; go there for those two and stay here for
everything else. Where both files speak, on the wrap rule, they agree.

## Layout (D30)

Every documentation markdown lives under a subdirectory of `docs/`. Only
the router `docs/README.md` and `docs/ODIN_STYLE.md` sit at the `docs/` top
level, and none sits at the repository root. A new subdirectory arrives
with its content, never ahead of it. Adding a document means updating the
router in the same change; a document the router does not list is not
landed.

## Prose

Hard-wrap at roughly 76 columns. Tables are exempt, so never wrap a table
row. Read a neighbouring paragraph before writing and match it.

**Em dashes.** Zero in normative prose. The single permitted use is as a
label-to-gloss separator inside a list entry or a table cell, the way the
router and the decision index already do it. This is a measured convention
rather than a preference: the count is checkable, and the target is zero
outside that one position.

## Links

Internal links are relative paths, and every one resolves. The `docs-check`
gate arrives with S00, so until then verify by hand: for each path you
wrote, confirm the file exists and that the relative depth is right from
the file you wrote it in.

## The spec index schema

`docs/specs/README.md` carries a fixed per-spec schema: Stage, Status,
Goal, Working software, Depends on, Decisions, Course, Prototype ports,
Normative references, Scope in, Scope out, Open questions. Any edit
preserves every field of every entry. Dropping a field, or emptying one
instead of marking it an open question, is a regression, and so is
reordering the fields.

**Normative references** names artifacts a spec must match, rather than
describing them in prose (D41). An entry names a committed, versioned
artifact in this repository or the course repository, says what it is
normative for, and takes `none` when there are none. Never a throwaway
prototype branch, and never an external URL that can change under the
spec. It is the opposite of Prototype ports, which names source to port
*from*; this field names targets to match. Where a normative reference
exists, prose in Goal and Scope in points at it instead of restating what
it shows.

## `docs/research/` is closed

The research corpus takes no new documents and no edits, not even a
finding from research done today or a rationale file for a decision being
written now. Durable findings graduate into a decision file, a spec's Open
questions field, or the glossary.
