# Issue tracker: GitHub issues, with beads underneath

Work below a spec runs across two trackers, layered rather than mirrored,
plus the status record that neither of them holds. This file carries the
mechanics: the commands, the conventions, and the rules a skill has to
respect when it writes.

## Two trackers and the status record

- **GitHub issues in `svswengine/svsw`**: the ticket layer. Tickets,
  tracking tickets, wayfinder maps, bug reports and every triage state are
  GitHub issues, driven through the `gh` CLI. This is the only layer
  anyone outside the repo can see or write to.
- **Beads (`bd`)**: the slice layer, below one ticket. It holds epics and
  their slices, and joins to the ticket layer through one field,
  `--external-ref`.
- **[`docs/specs/README.md`](../specs/README.md)**: spec status, the one
  record of the rung each spec stands on. Neither tracker holds it, and no
  tracker state moves a rung by itself. Someone edits the row.
  `/wayfinder` sets a spec to **grilled** when the last open child issue of
  its map closes, as the final step of resolving that child. The maintainer
  sets **spec written** once the spec document is authored, and
  **implemented** once the spec's gate is green; both stay maintainer-driven
  until `spec-ceremony` lands at S00. `brainstormed` is a rung the ladder
  records, but with N grilling child issues no tracker event marks it, so a
  spec crosses from `pending` to `grilled` in one transition.

The model behind the split is
[D37](../decisions/D037-work-decomposition.md); which skill operates which
layer, on which rung, and where each one's defaults are overridden, is
[`skills.md`](skills.md). What follows is tracker operation only: where one
of their rules decides how a ticket or a child issue is written, it is
pointed at rather than restated.

## Everything written here is public

The repository is public and its issues stay open for bug reports (D24),
so every ticket title, ticket body, map, label and comment is a public
documentation surface exactly as the docs tree is. D31 did not originally
reach the tracker; D37 extends it there, so D31 as amended by D37 governs
every write here: zero private-product references, boundary pointers
included, meaning no mechanic, service name or genre framing belonging to a
private product, and no phrasing that names or points at a private
repository or its contents. Work scoped by private gameplay requirements
cites "private product requirements" (D4) and restates nothing, the way a
spec does.

Grilling and wayfinding sessions are where this leaks. A child issue that
asks a D4 gameplay-requirements question publishes the question when it is
filed and the answer when it is resolved, both in public, before any of it
reaches a decision file. Apply the rule you would apply to a docs commit,
at the moment of writing rather than in review afterward.

## Conventions

`gh` infers the repo from `git remote -v` when run inside a clone, so no
`--repo` flag is needed.

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a
  heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --comments`, filtering
  comments by `jq` and also fetching labels.
- **List issues**:
  `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`
  with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` /
  `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

## Labels this tracker needs

Two vocabularies, both defined in
[`triage-labels.md`](triage-labels.md): the five triage roles and the five
`wayfinder:*` kinds. Of the ten label strings, only `wontfix` exists in
the repo today, as one of GitHub's defaults. These nine are needed and
absent:

`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`,
`wayfinder:map`, `wayfinder:research`, `wayfinder:prototype`,
`wayfinder:grilling`, `wayfinder:task`.

Creating them is a maintainer action. A skill that needs a label which
does not exist says so and stops; it does not invent a near-miss string,
and it does not create the label itself.

## Parent issues and their children

A wayfinder map and a tracking ticket are built the same way, so both
`/wayfinder` and `/to-tickets` work through these four mechanics.

- **Open the parent first**: `gh issue create`. A tracking ticket's body is
  the numbered breakdown of its spec, one entry per implementable piece; a
  map's body is the Notes / Decisions-so-far / Fog structure. File the
  children afterward, attaching each as it is created, so the parent's
  numbering and its sub-issue list stay in step.
- **Attach a child**: create the child, then link it with
  `gh api --method POST repos/<owner>/<repo>/issues/<parent>/sub_issues -F sub_issue_id=<child-db-id>`.
  `<child-db-id>` is the child's numeric **database id**
  (`gh api repos/<owner>/<repo>/issues/<n> --jq .id`), _not_ its `#number`
  and _not_ its `node_id`; passing the number is the usual failure here.
  Where sub-issues aren't enabled, list the child in a task list in the
  parent body and put `Part of #<parent>` at the top of the child body.
- **Blocking**: GitHub's **native issue dependencies**, the canonical,
  UI-visible representation. Add an edge with
  `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`,
  where `<blocker-db-id>` is again a numeric **database id**, _not_ the
  `#number` or `node_id`. Where dependencies aren't available, fall back to
  a `Blocked by: #<n>, #<n>` line at the top of the child body. A child is
  unblocked when every blocker is closed.
- **Read the structure back**: `gh issue list` exposes it through
  `--json number,title,assignees,parent,subIssues,subIssuesSummary,blockedBy`.
  The REST field `issue_dependencies_summary.blocked_by` is not available
  to `gh issue list`; it appears only in the per-issue payload from
  `gh api repos/<owner>/<repo>/issues/<n>`, so a query that wants it pays
  one API call per issue.

## Telling the two parent kinds apart

`wayfinder:map` present means a map, and its children are one spec's open
questions. With that label absent, the sub-issue structure separates the
other two cases: an issue with children is a tracking ticket, an issue
with none is an ordinary ticket. Read both signals before treating an
issue as a parent of either kind.

Never put `wayfinder:map` on a tracking ticket. What that mislabel does to
`/wayfinder` is in [`skills.md`](skills.md).

## Tracking tickets cite their spec

Every tracking ticket body carries its spec document path in full, and so
does every child of one: `docs/specs/<id>-<slug>.md`, with M00 the standing
exception whose design record is
[`docs/design/editor-mockup.md`](../design/editor-mockup.md). The rule and
the reason behind it are in [`skills.md`](skills.md). Opening the parent,
attaching its children and recording blockers between them are in **Parent
issues and their children** above, which `/to-tickets` and `/wayfinder`
share.

A `/qa` session parent is not a tracking ticket. `/qa` calls the parent it
files a "tracking issue", but that parent owns no spec, so the path rule
above does not reach it.

## Beads: the slice layer under one ticket

`/implement` is the only skill that writes to this layer, and it opens the
epic mid-work, when a ticket overruns its session. `/to-tickets` never
opens one at filing time. [`skills.md`](skills.md) carries the sizing rule
behind that trigger. The mechanics:

- **Open the epic**: `bd create -t epic --external-ref gh-<n> "<title>"`.
  There is no `bd epic create`; `bd epic` has only `status` and
  `close-eligible`. Without `-t epic` the bead is a plain task that neither
  of those two commands can see, and the close path below then fails with
  nothing pointing back at the cause.
- **Link to the ticket**: `--external-ref gh-<n>`, where `<n>` is the
  GitHub issue number, so issue #9 is `gh-9`. That field is the whole of
  the join; no content is copied in either direction.
- **Slices**: `bd create --parent <epic-id>`, one bead per
  red-green-refactor increment, each landing CI-green and committed on its
  own. `bd dep --blocks` records ordering between them.
- **Find the epic from the ticket**: `bd list` has no `--external-ref`
  filter, so scan the epics and match the field yourself:
  `bd list --type epic --json`, then select the entry whose `external_ref`
  is `gh-<n>`.
- **Resume**: `bd ready` spans every epic in the database, so a resuming
  session narrows it to its own with `bd list --parent <epic-id> --ready`.
  `bd children <epic-id>` and `bd epic status` show what remains.
- **Close**: `bd epic status --eligible-only` is the query, listing the
  epics whose children are all complete. `bd epic close-eligible` is a
  command that closes them, and takes `--dry-run`. Closing the epic is not
  closing the GitHub ticket: close that with `gh issue close`, and note
  that it moves no spec rung.

There is no `.beads/` database in this repo yet, and creating one is not a
session's business. Initializing it is S00 scope, and the command it runs
is `bd init --prefix svsw`, which names issues `svsw-<hash>`, for example
`svsw-1sj`. One database carries one prefix, so the epic-or-task
distinction never appears in an id: it is beads' own type field, set by
`-t epic` at creation and read back as `issue_type`. Until that init lands,
read this section as the shape of the layer rather than as commands to run
today.

## Pull requests as a triage surface

**PRs as a request surface: no.** The repo is closed to external
contributions (D24), so PRs get closed, issues are welcome, and external
PRs never enter the triage queue. `/triage` reads this flag; flip it to
`yes` only if D24 is reopened.

When set to `yes`, PRs run through the same labels and states as issues,
using the `gh pr` equivalents:

- **Read a PR**: `gh pr view <number> --comments` and
  `gh pr diff <number>` for the diff.
- **List external PRs for triage**: the author association is not a
  `gh pr list --json` field, so source it from REST:
  `gh api repos/<owner>/<repo>/pulls --jq '.[] | select(.author_association | IN("CONTRIBUTOR","FIRST_TIME_CONTRIBUTOR","NONE"))'`,
  which keeps exactly the external authors and drops
  `OWNER`/`MEMBER`/`COLLABORATOR`. The REST field is `author_association`
  in snake_case, unlike the camelCase names `gh --json` takes; do not
  "correct" it to `authorAssociation`, which errors.
- **Comment / label / close**: `gh pr comment`,
  `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

GitHub shares one number space across issues and PRs, so a bare `#42` may
be either: resolve with `gh pr view 42` and fall back to
`gh issue view 42`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue. Never a local file, and never a beads slice. When
what you are publishing is a parent with children, whether a map or a
tracking ticket, build it through **Parent issues and their children**
above.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.

## Wayfinding operations

Used by `/wayfinder`. One map per spec, holding that spec's open questions
as its child issues. Attaching those children and recording blockers use
the shared mechanics in **Parent issues and their children** above.

- **Map**: a single issue labeled `wayfinder:map`, holding the Notes /
  Decisions-so-far / Fog body. `gh issue create --label wayfinder:map`.
- **Child issues**: seeded from the spec's `Open questions` field, one per
  question, each labeled `wayfinder:<type>`
  (`research`/`prototype`/`grilling`/`task`), each resolving toward a
  decision rather than by shipping product code.
- **Frontier query**: list the map's open children with
  `gh issue list --state open --json number,assignees,blockedBy`, scoped to
  the map's sub-issues or task list; drop any child with an assignee, or
  with an open issue in `blockedBy` or in its `Blocked by` fallback line;
  first in map order wins.
- **Claim**: `gh issue edit <n> --add-assignee @me`, the session's first
  write.
- **Resolve**: `gh issue comment <n> --body "<answer>"`, then
  `gh issue close <n>`, then append a context pointer (gist + link) to the
  map's Decisions-so-far. When that close leaves the map with no open
  children, finish by setting the spec's `Status` in
  [`docs/specs/README.md`](../specs/README.md) to **grilled**.
- **Research output**: a `wayfinder:research` child's notes are written to
  `docs/research-notes/<name>.md` on a throwaway `research/<name>` branch
  and linked from the child issue. That path exists only on the branch, it
  never merges to main, and nothing is ever added to `docs/research/`.
