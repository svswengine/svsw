# Documentation

All documentation lives in subdirectories of `docs/`. This router and the
style guides are the only markdown files at the top level of `docs/`. Each
subdirectory holds one kind of document, and a new subdirectory such as
`docs/architecture` arrives with its content, not ahead of it.

- [docs/ODIN_STYLE.md](ODIN_STYLE.md) — the Odin engineering standard.
- [docs/GO_STYLE.md](GO_STYLE.md) — the Go engineering standard: the
  boundary, the protocol seam, supervision, and the service toolchain.
- [docs/LUAU_STYLE.md](LUAU_STYLE.md) — the Luau engineering standard:
  the sandbox boundary, mod layout, and determinism on hashed paths.
- [docs/specs/README.md](specs/README.md) — the spec index and todo list.
- [docs/specs/S00-repo-bootstrap.md](specs/S00-repo-bootstrap.md) — the S00
  normative text. A spec document lands beside the index as its spec
  reaches "spec written", and is listed here in the same change.
- [docs/specs/S01-vendoring-ceremony.md](specs/S01-vendoring-ceremony.md) —
  the S01 normative text: the C-tier vendoring ceremony, its roster, and
  the gates that judge it.
- [docs/specs/S02a-prototype-kernel-port.md](specs/S02a-prototype-kernel-port.md) —
  the S02a normative text: the prototype kernel port, the port inventory,
  and the determinism pyramid.
- [docs/decisions/README.md](decisions/README.md) — the decision log.
- [docs/context/CONTEXT.md](context/CONTEXT.md) — the glossary and domain
  model: the terms this repo uses, the ones it bars, and the ambiguous
  words it pins.
- [docs/plans/claude-tooling-design.md](plans/claude-tooling-design.md) —
  design and planning records, starting with the Claude Code tooling design.
- [docs/plans/public-stats.md](plans/public-stats.md) — the org profile's
  live project stats: which badges exist, what gates them, and where the
  numbers come from.
- [docs/plans/spec-wayfinding-roadmap.md](plans/spec-wayfinding-roadmap.md) —
  the order the pending specs get wayfound in, and why: order and rationale
  only, no status.
- [docs/design/editor-mockup.md](design/editor-mockup.md) — the M00 design
  record for the editor visual mockup.
- [docs/design/editor/](design/editor/) — the M00 mockup itself; open
  `index.html` in a browser.
- [docs/design/editor-mockup-qa.md](design/editor-mockup-qa.md) — the M00
  mockup's QA sweep: findings, fixes, contrast ratios, and re-verification.
- [docs/design/threat-model.md](design/threat-model.md) — the threat
  model: what the declared security boundary defends against, threat by
  threat, and the postures outside it.
- [docs/research/README.md](research/README.md) — the research corpus index.
- [docs/agents/](agents/) — the per-repo configuration the engineering
  skills read: the skill routing map, issue tracker, triage labels, and
  domain doc rules.

## Layout

| Directory | Holds |
|---|---|
| `docs/specs/` | The spec index and future spec documents. |
| `docs/decisions/` | The decision log. |
| `docs/context/` | The glossary and domain model. |
| `docs/plans/` | Design and planning records, such as `claude-tooling-design.md`. |
| `docs/design/` | Design records and browsable design artifacts, such as the M00 editor mockup. |
| `docs/research/` | The research corpus. |
| `docs/agents/` | Per-repo configuration for the engineering skills. |
