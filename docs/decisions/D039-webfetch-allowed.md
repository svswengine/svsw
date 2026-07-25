# D39: WebFetch is allowed; shell network commands stay ask

Status: current
Date: 2026-07

The committed `.claude/settings.json` no longer carries an `ask` rule on the
`WebFetch` tool. Shell-level network access is unchanged and still asks:
`curl`, `wget`, `git push`, `pull`, `fetch` and `clone`, `go get` and `go
install`. The change is confined to the tool that reads a URL into a
session, and it exists because a `wayfinder:research` child issue cannot be
worked without one confirmation per page, which turned the tier into a
prompt to click through rather than a control to weigh. What forced the
committed file to change, rather than a per-machine override, is Claude
Code's permission precedence: deny outranks ask, which outranks allow, and
rules from `.claude/settings.json` and `.claude/settings.local.json` merge
into one set rather than the local file shadowing the committed one. A
committed `ask` therefore cannot be loosened per machine, so D28's "personal
loosening lives in gitignored `settings.local.json`" reaches only what the
committed file is silent about. That is a mechanism correction as much as a
posture change, and it binds every future entry in the committed lists.
Leaving the prompt in place is rejected because a confirmation nobody reads
is not a control; allowing shell network commands in the same change is
rejected because `curl` and `go get` write into the working tree where the
fetch tool does not, and the no-network-beyond-plan-pins policy governs
those. The deny rules over `vendor/**`, build output and generated files are
untouched, so the prompt-injection surface reduction D28 built them for
stands unchanged. Amends D28 in its committed-permissions clause and in its
grilled decision 5; the rest of that decision holds, and
`docs/plans/claude-tooling-design.md` carries the detail.
