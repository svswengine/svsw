# Documentation

All documentation lives in subdirectories of `docs/`. This file, the router,
is the only markdown file at the top level of `docs/`. Each subdirectory
holds one kind of document; new subdirectories (`docs/architecture`,
`docs/decisions`, and others) arrive with their content, not ahead of it.

- [docs/specs/README.md](specs/README.md) — the spec index and todo list.
- [docs/decisions/README.md](decisions/README.md) — the decision log.
- [docs/plans/claude-tooling-design.md](plans/claude-tooling-design.md) —
  design and planning records, starting with the Claude Code tooling design.
- [docs/plans/public-stats.md](plans/public-stats.md) — the org profile's
  live project stats: which badges exist, what gates them, and where the
  numbers come from.
- [docs/design/editor-mockup.md](design/editor-mockup.md) — the M00 design
  record for the editor visual mockup.
- [docs/design/editor/](design/editor/) — the M00 mockup itself; open
  `index.html` in a browser.
- [docs/design/editor-mockup-qa.md](design/editor-mockup-qa.md) — the M00
  mockup's QA sweep: findings, fixes, contrast ratios, and re-verification.

## Layout

| Directory | Holds |
|---|---|
| `docs/specs/` | The spec index and future spec documents. |
| `docs/decisions/` | The decision log. |
| `docs/plans/` | Design and planning records, such as `claude-tooling-design.md`. |
| `docs/design/` | Design records and browsable design artifacts, such as the M00 editor mockup. |
