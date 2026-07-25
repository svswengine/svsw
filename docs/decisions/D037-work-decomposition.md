# D37: Work decomposition: specs, tickets, and slices

Status: current
Date: 2026-07

Work below a spec decomposes across two trackers, layered not mirrored:
GitHub Issues is the ticket tracker, beads (`bd`) is the slice tracker below
a ticket, joined by beads' `--external-ref` field naming the GitHub issue
(`gh-9`). A spec breaks into N tickets, each one implementable piece sized
to one fresh context window; one ticket per spec is rejected because S00's
`Scope in` alone holds roughly twenty independently reviewable pieces. The
breakdown is a GitHub tracking ticket whose sub-issues are those tickets,
never a per-spec plan document, a third record that would drift from what it
describes. Beads engages only when a ticket overruns one session, and
`/implement` opens the epic at that moment. A sole tracker is rejected
either way: beads alone cannot serve a public repository open to issues
(D24), and GitHub alone leaves an overrunning ticket no resumption record.
Spec status keeps exactly one record, `docs/specs/README.md`; beads holds
none.

`/wayfinder` owns pending-to-grilled: it draws its map's child issues from
the spec's `Open questions` field, which every spec must therefore fill. A
map and a tracking ticket both carry child issues but never share a label.
`/to-spec` is banned for every spec-index entry, S, C and M alike, since
that entry's own document is the spec; it serves work outside the index. The
tracker is public (D24), so D31's zero-private-product-reference rule covers
every ticket, map, and comment: this decision extends D31's scope, not its
substance. This decision also amends D28 in two respects without superseding
it: beads is no longer the status record with one bead per spec, and the
planned spec-ceremony skill narrows to authoring the spec document and
moving the ladder row, because `/wayfinder` and `/grill-with-docs` now cover
brainstorm and grilling. The skill roster is documentation at
`docs/agents/skills.md`, not part of this decision, because installed skills
churn.
