# D45: Committed permissions are an allow list only

Status: current
Date: 2026-07

`.claude/settings.json` commits an allow list and nothing else: both `deny`
and `ask` are empty, and the network-touching shell commands D39 kept asking
(`curl`, `wget`, the git network verbs, `go get`, `go install`) join the
allow list beside the build, test and read-only tracker commands. This
amends D39, whose posture clauses it replaces, and amends D28's grilled
decision 5 for the second time. D39's finding about precedence is untouched
and remains the reason this file is shaped the way it is: rules from
`settings.json` and `settings.local.json` merge into one set, `deny`
outranks `ask` outranks `allow`, so anything the committed file names with a
stricter verb cannot be loosened per machine. An allow-only committed file
is therefore the shape that leaves the most room for a personal
`settings.local.json`, which is where a stricter or looser posture belongs
for one developer on one machine. The reason for the change is friction that
was real rather than theoretical: a confirmation prompt on every fetch and
every push, several times a minute across a session driving six research
subagents, is a control nobody reads, and D39 already rejected keeping a
prompt on that ground for `WebFetch` alone. What this gives up is stated
plainly rather than left implied. The `deny` rules D28 specified over
`vendor/**`, build output and generated files are gone, and D28's stated
rationale for them was prompt-injection surface reduction: an agent that
cannot read a vendored file cannot be steered by instructions hidden in one.
That rationale is dormant rather than wrong, because `vendor/` does not
exist yet and this repository holds only documentation. **It stops being
dormant at S01**, which vendors SDL3, cimgui and Luau as third-party source,
and S01's open questions carry the trigger. Reinstating a narrower deny at
that point is expected rather than a reversal. Leaving the committed file as
D39 had it is rejected because the prompts were being clicked through
without reading, which is worse than no prompt since it manufactures a
record of consent that means nothing; committing a `deny` that guards
nothing is rejected because a rule with no subject teaches a reader that
rules here are decorative. Settled with the maintainer on 2026-07-25.
