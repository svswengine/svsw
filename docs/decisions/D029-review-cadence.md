# D29: Review cadence and toolchain verification

Status: current

Review runs in three layers: marker and citation hooks free on every edit and
commit, the spec-review workflow once per spec draft, and the billed
adversarial-review workflow pre-merge; a branch older than about ten commits
gets a mid-branch adversarial pass on the diff accumulated so far, so a
late-discovered bug never waits for the whole branch to land. No tool enters
docs or a recipe without verification on the machine that runs it: odinfmt is
documented as a dev dependency in the S00 setup docs only after its formula
is confirmed installable there, and the format-on-edit hook keeps its
warn-don't-fail posture regardless.
