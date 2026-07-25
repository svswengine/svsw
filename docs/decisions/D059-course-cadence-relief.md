# D59: Course cadence relief

Status: current
Date: 2026-07

Amends D27 in four clauses, because the pairing rule as written
compounds into an unbudgeted maintenance tax: each module publish forces
a pin bump, each bump reruns every published module's verification gate,
and by stage 4 roughly twenty-five published modules embed exactly the
source the editor and protocol work churns hardest. First, a spec's
course rung gates only its own closure: a spec regressed to implemented
by a broken module never blocks a later spec's ceremony or
implementation under the one-at-a-time rule, so course maintenance is a
debt queue rather than a hard stop. Second, the pin bumps at stage
boundaries in a named batch-fix window rather than at every module
publish; between bumps the report-only probe against engine HEAD is the
drift signal, and a module authored mid-stage builds against the
standing pin, embedding only source that pin already carries. Third,
embeds anchor on named region markers in engine source rather than line
ranges, settled in C00's grilling in place of its open question about
porting the line-range slicer, so unrelated churn above an embed moves
nothing. Fourth, M-series specs are exempt from the pairing rule, as
the spec index's status legend records: their committed artifact is the
deliverable. Per-spec pairing itself stands; batching course authoring
to stage ends was rejected because a module written months after its
spec loses the implementation context that makes it accurate. Adopted
from the 2026-07-25 adversarial review at the maintainer's direction.
