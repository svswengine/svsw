# D28: Project Claude Code tooling architecture

Status: current
Date: 2026-07

svsw's `.claude` tooling stages skills with the gate each depends on: S00
ships the bootstrap core (root CLAUDE.md, paths-scoped rules, hooks,
committed permissions) plus the spec-ceremony, check-triage, merge-prune,
review-to-docs-pr, and win-rig skills, and the adversarial-review,
comment-review, and spec-review workflows; vendor-quarantine lands at S01,
golden-hashes at S02a, parity-verify at S04, lua-binding at S14,
proto-conformance across S05 and S26, the MCP-server successor at S21,
course-pairing at C00. As an exception, the full agent roster (gate-runner,
golden-recorder, win-rig-runner, determinism-reviewer, spec-scribe,
binding-dev, go-services-dev, course-writer) ships at S00 regardless of gate
readiness; every agent whose gate does not exist yet carries an explicit
refusal clause naming the owning spec, and every gate-owning spec's exit
checklist gains the item "re-verify and update the agents that reference this
gate." Rules load through paths-scoped `.claude/rules/*.md`, not nested
CLAUDE.md, because svsw's languages cross directory boundaries; nested
CLAUDE.md is reserved for `server/` and the `course` sibling repo. Hooks are
graduated: format-on-edit hooks are non-blocking with warn-if-missing guards;
the marker scan and WGSL validation feed diagnostics back non-blocking; one
hook blocks, the PreToolUse marker scan of the staged diff on git commit or
merge. Shared permissions (allow just/odin/Go build-test-vet/gofmt/read-only
git/bd; deny reads into `vendor/**` except VENDOR.md, build output, generated
files; network stays ask) commit to `.claude/settings.json`, with personal
loosening in gitignored `settings.local.json`. The spec-ceremony skill wraps
the brainstorm-and-grilling flow; beads is the status record, one bead per
spec against a fresh database initialized at S00, and the skill updates the
specs/README.md table in the same step as each bead transition. Full design
record: `docs/plans/claude-tooling-design.md`. Amended by D37:
`docs/specs/README.md` becomes the sole spec-status record in place of
beads, and the planned spec-ceremony skill narrows to authoring the spec
document and moving the ladder row.
