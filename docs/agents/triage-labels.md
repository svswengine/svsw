# Triage labels

Two label vocabularies run in this repo's tracker: the five triage roles
the skills speak in, and the five `wayfinder:*` kinds that classify a
decision map and its children. A label from one never stands in for a
label from the other, and no ticket or child issue carries one from each.
[`issue-tracker.md`](issue-tracker.md) records which of these strings exist
in the tracker today and who creates the rest.

## Triage roles

The skills speak in terms of five canonical triage roles, and this is the
label string each one takes here.

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this ticket |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | Requires human implementation            |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use
the corresponding label string from this table.

## The `ready-for-agent` gate

`ready-for-agent` says an unattended agent may take this ticket and write
code against it. On a ticket owned by a spec, apply it only when that spec
stands at **spec written** or later on the ladder in
[`docs/specs/README.md`](../specs/README.md).

Below that rung this repo forbids writing implementation code for the
spec, so labeling such a ticket `ready-for-agent` tells an unattended
agent to break that rule. Check the spec's rung in the index before you
apply the label.

Work that is not an entry in the spec index, such as documentation
efforts, tooling, bug reports and course infrastructure, is not gated by
this rule; label it on its own merits, ready when it is fully specified.

The gate binds this one label and no other. A ticket whose spec sits below
the rung still takes `needs-triage`, `needs-info` or `ready-for-human` as
its state warrants.

## Wayfinder kinds

`/wayfinder` labels a decision map and its child issues with a second
vocabulary. These record what kind of GitHub issue this is and how it gets
settled, where a triage role records what the ticket is waiting on. Every
child issue of a map resolves toward a decision, `wayfinder:task`
included: that one does the work rather than deciding, and still ends in
an answer the map records.

| Label | Goes on | Resolved by |
| --- | --- | --- |
| `wayfinder:map` | the map itself, the issue holding Notes / Decisions-so-far / Fog | every child issue closing |
| `wayfinder:research` | a child issue answered from primary sources | an answer comment on the child, citing findings kept on a throwaway `research/<name>` branch |
| `wayfinder:prototype` | a child issue answered by building something throwaway | an answer comment on the child, carrying what the prototype validated or refuted |
| `wayfinder:grilling` | a child issue only the maintainer can answer | the maintainer's answer, commented on the child |
| `wayfinder:task` | a child issue answered by doing one concrete piece of work | an answer comment on the child, once that work is done |

Triage roles go on tickets: the children of a tracking ticket, and the
inbound bug reports `/triage` handles. Wayfinder kinds go on a map and its
child issues. Never put `wayfinder:map` on a tracking ticket: what that
mislabel does to `/wayfinder` is in [`skills.md`](skills.md), and how to
tell the two parent kinds apart is in
[`issue-tracker.md`](issue-tracker.md).
