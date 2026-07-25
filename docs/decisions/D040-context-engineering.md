# D40: Context engineering: what the always-loaded prompt carries

Status: current
Date: 2026-07

One rule decides what root CLAUDE.md holds: content stays only if a reader
needs it without a lookup to avoid making a wrong decision, and everything
else becomes a pointer. Applied, it lands near 100 lines across seven
sections, and the number is the result rather than the target, because a
line budget invites padding as readily as it disciplines cutting. The
worked example is commit `5b7345b`, which took the interim file from 147 to
105 lines, kept the engine invariants in full because they decide reviews,
and made the `docs/research` numbering trap the longest entry in the file,
establishing that entry length tracks how badly a thing fails rather than
how important it sounds. Four consequences follow, settled together in
issues #7 through #10 and #13 because they share this rule. The
model-routing table and the karpathy and ponytail mandate leave CLAUDE.md
entirely: each agent definition already carries its own model tier and the
scoped implementers already mandate the guidelines, so the always-loaded
copy was a second record of both, and D37 already ruled on second records.
The reliability policy splits on whether a clause has a mechanical
enforcer: the output contract and the recovery ladder move into the
workflow validator and the agent definitions that enforce them, layered
enforcement moves to the design record, and CLAUDE.md keeps one sentence
covering the ad-hoc subagent dispatch that no validator or hook reaches;
the canonical stub-marker list stops being prompt text and becomes a
sourcing rule, since every validator reading one file is strictly stronger
than an instruction to keep copies in step. Skills split when a section
grows per spec or is needed only after a branch point, which splits
check-triage's gate-name-to-fix-flow table out of its body and leaves the
other four S00 skills whole; a skill names where truth lives rather than
copying it. The agent roster stages with its gates, amending D28:
gate-runner, win-rig-runner, spec-scribe and determinism-reviewer ship
at S00 because
their subjects exist there, golden-recorder lands at S02a, binding-dev at
S14, go-services-dev at S26 and course-writer at C00, refusal clauses are
withdrawn, and every gate-owning spec's exit-checklist item changes verb
from retire the refusal clause to add the agent this gate owns, so its
output is a working agent written against the gate as it landed. Shipping
the roster whole is rejected because a definition that cannot be exercised
cannot be reviewed against reality and drifts silently until the day it is
switched on; keeping the routing table and the mandate in the prompt is
rejected because both already exist where they bind; leaving the whole
reliability policy in CLAUDE.md is rejected because three of its four
clauses describe machinery no session operates by hand, and moving all four
out is rejected because the ad-hoc dispatch path has no other guard. The
roster's intent stays visible in `docs/plans/claude-tooling-design.md`,
which lists all eight agents against their owning specs.
