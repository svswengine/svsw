# D41: Normative references are a first-class spec field

Status: current
Date: 2026-07

The fixed per-spec schema in `docs/specs/README.md` gains a twelfth field,
`Normative references`, between `Prototype ports` and `Scope in`. It names
the artifacts a spec must match: a committed mockup, a recorded corpus, a
golden file. An artifact answers a design question more exactly than prose
about it can and cannot drift from itself, so where one exists the spec
points at it rather than describing what it shows. An entry names a
committed, versioned artifact in this repository or the course repository
and says what it is normative for; it is never a throwaway prototype
branch, which is deleted by design and never cited, and never an external
URL that can change under the spec. The field takes `none` where there are
none, like every other field. It reads against `Prototype ports` directly
above it and means the opposite: that field names source to port from, this
one names targets to match, and the adjacency is deliberate so the two are
compared rather than confused. M00 forced the question: its editor mockup
was already the normative visual reference for S22 through S24, but that
claim lived in the index's own introduction while only S22 restated it, so
two of the three specs bound by it carried nothing that said so. All forty
entries carry the field as of this decision. Leaving the practice in prose
is rejected because that is the state that produced the M00 gap, where a
binding claim sat in a paragraph no bound spec had to read; adding it as
free-form text inside `Scope in` is rejected because it would be
indistinguishable from description and invisible to any check. Settled by
issue #11.
