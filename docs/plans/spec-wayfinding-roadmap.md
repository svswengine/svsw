# Spec wayfinding roadmap

This is the order in which the pending specs get wayfound, and the reasons
for that order. It records order and rationale only.

Nothing here says where any spec currently sits.
[`docs/specs/README.md`](../specs/README.md) is the sole status record
([D37](../decisions/D037-work-decomposition.md)); every rung transition
happens there and only there. If this document and the index ever disagree
about a spec's state, the index is right and this document is stale.

## What the phases are

Phase 1 charted the first wayfinder map, issue #37, and closed it. Its
rulings landed in two commits: `cea64b8` amended D20, D48, D53 and D55,
and `9a9a855` recorded the S02a, S13, S14 and S24 rulings inside the
index's existing schema fields. Phase 1 is closed.

Phase 2 is the audit that produced this document. Every index row was read
against the decision log and against those two commits, looking for three
things: open questions too vague to become a useful map child, decisions a
row cites but does not honour, and decisions that bear on a row and are not
cited at all. The audit's per-row findings landed in the index as
Open-questions patches ahead of Phase 3.

Phase 3 walks every pending spec from pending through grilled to spec
written. No implementation work begins until the last one arrives. That is
the whole point of the program: the cost of a wrong interface decision is
paid once in a grilling session rather than repeatedly in retrofits across
the specs written against it.

Phase 4 implements, in stage order rather than in the Phase 3 order. The
two orders differ on purpose. Phase 3 front-loads the specs whose answers
reshape other specs; Phase 4 follows the stage structure the index already
carries, because that is what the gates and the release tags are cut
against.

Phase 5 publishes course modules, one per implemented spec, under the
pairing rule (D27). It interleaves with Phase 4 rather than following it,
since a module is authored once its spec's implementation gate is green.

## What has to happen before Phase 3 opens

Batch 0 holds two items, neither of them a wayfinding session. One is
ruled; one is outstanding maintainer work.

The Windows-CI ownership question is ruled.
[`docs/specs/S00-repo-bootstrap.md`](../specs/S00-repo-bootstrap.md)
sections 104 to 127, and disposition #4 in that document, accept Windows
as local developer tooling rather than CI, while D48 as amended in
`cea64b8` requires a compile-only hosted Windows CI leg once
Windows-compilable code exists. The 2026-07-30 ruling places that leg with
S01, the first spec producing Windows-compilable code: S00 stays as
written, and S01's grilling names the leg's exact entry point. S01, S03,
S03b, S04, S21 and S29 now ask their Windows questions against that ruling
instead of each re-litigating ownership from a different angle.

The requirements envelope must state numeric scale targets before batch 6.
S11a's chunk size and entities-per-chunk questions, and S13's sweep
envelope, hard-block on numbers that do not exist anywhere yet: the
private product requirements source (D4) is where they have to be
authored, and authoring them is maintainer work no wayfinding session can
do for itself. Batch 6 is where this first bites, so confirm the numbers
are in hand before that period opens rather than discovering it mid
session.

There is also one thing S00's implementation must respect that the sweep
turned up. S00's gate skeleton has to leave room for two later obligations
it does not itself carry: S21's full roster enumeration with per-item
hard-gate or report-only marks, and the D53 tag-and-artifact workflow,
which the index ground rules place at the first stage exit rather than at
S32's dry-run.

## How the order was built

Three criteria, applied in this order.

Dependency edges come first and are absolute. No spec is wayfound before
the specs it depends on, because a map charted against an unsettled
dependency produces children that get reopened.

Risk comes second. A spec whose grilling can change another spec's shape
goes as early as its dependencies allow. Three families carry that
property: the RHI and renderer family, where S03's how-much-interface-now
call ripples into S06, S10, S03b, S12a, S16 and S20; the chunked world,
where S11a's coordinate and hashing model is the ground S11b, S13, S17,
S28 and S30 all stand on; and the Go and QUIC tier, where S26's envelope
freeze is a one-way door for every protocol consumer. The rows whose
`Prototype ports` field reads `none` are the reliable signal here: those
are the specs with no working reference implementation to port from, so
their grilling is where their design actually happens. Twenty of the
forty-six rows carrying that field read `none`, and they cluster in
exactly those three families plus the editor chain.

Ladder stage comes third and is the tiebreaker only. Within a batch, two
specs at the same readiness are ordered by stage.

Two further pulls override pure stage order. Fan-out: S12a blocks five
downstream rows on a single maintainer call, the brand-neutral container
name, and S14 blocks four, so both are pulled as early as their edges
allow. Floats: S10 and C00 block nothing, so they are deliberately parked
in a late period rather than allowed to consume an early one. C00 in
particular can move anywhere after batch 1 if the maintainer wants course
tooling sooner; nothing engine-side waits on it.

## The batches

A batch is one working period. Batches are sized by question weight rather
than by spec count, so a period may hold one heavy spec or four light
ones. Where a batch holds specs with an edge between them, the order
inside the period is stated.

Batch 0 is the batch-0 work above: the ruled Windows leg, and the scale
targets the requirements envelope owes batch 6.

Batch 1 takes S01 and S02a, the only two rows whose dependencies are
already spec written. Everything else in the program descends from these.

Batch 2 takes S02b, S05 and S14. S02b gets its own session inside the
period: the review notes call it the highest-risk new stage-0 code, and a
cross-CPU hash gate that is wrong is wrong invisibly.

Batch 3 takes S03 alone. Seven open questions, and the interface-scope
answer is the largest single schedule lever in the program.

Batch 4 takes S04 and then S03b. S04 follows S03 immediately because its
skeleton-hash definition is only stable once the draw-list shape is fixed.
S03b joins not because anything blocks on it but because its own
Windows-readiness question belongs in the same room as the rest of the
backend and CI-guarantee discussion.

Batch 5 takes S06 and S07 together. D54 wrote its ambient-term clause
specifically for S07's Milestone A goldens, so freezing that constant in
S06 without S07 in the room invites a second pass.

Batch 6 takes S11a and S12a, the two widest-fan-out blockers still
standing. This is the batch gated on the D4 numbers.

Batch 7 takes S09, S12b, S15 and S16. All four are light, and together
they clear the second-order asset, stress and mod surfaces.

Batch 8 takes S08, then S19, plus S11b. S19 follows S08 inside the period
on a direct edge.

Batch 9 takes S13 and S18 only. S13 is among the densest rows in the index
and needs the room.

Batch 10 takes S20 and S16b, both of which inherit S16's renderer answers.
S16b's map must close before S22's, since S22 grows that shell rather than
starting fresh.

Batch 11 takes the two floats, C00 and S10.

Batch 12 takes S17 and then S21. S17 is one of S21's nine dependencies, so
it is sequenced first inside this period; the other eight close by the end
of batch 10, batch 11 being the floats. S21's roster absorbs the gates of
all nine.

Batch 13 takes S22 alone. The densest row in the index, three of its
questions already marked load-bearing, and it sets the editor
compatibility surface.

Batch 14 takes S22b then S22d. S22b's checkpoint cadence is the substrate
both S22c and S27b later extend.

Batch 15 takes S22c, S23 and S25. S23 and S25 share the roundtrip-log
format question from opposite ends.

Batch 16 takes S24 then S24b, in that order on a direct edge.

Batch 17 opens the Go tier with S26 and S27a.

Batch 18 takes S27b and S28.

Batch 19 takes S29 then S29b.

Batch 20 takes S30 alone. It is the foggiest row in the index and it gates
the three specs that follow.

Batch 21 takes S31 and S33.

Batch 22 takes S32 and closes Phase 3.

## Human load and calendar shape

Forty-five specs enter Phase 3. Counting each bullet in an `Open
questions` field as one decision, they carried about one hundred and
seventy before the Phase 2 patches and carry about two hundred and thirty
after them; a fair share of that growth subdivides or sharpens a question
already listed rather than adding a new decision.

That is the honest number and it is large. A grilling session settles
somewhere between four and eight questions before the returns fall off,
which puts Phase 3 at thirty to fifty sittings across the twenty-two
batches, so most periods need more than one sitting.

At one batch per week, Phase 3 runs five to six months. At two per week it
runs three. Neither figure includes the drafting time between the grilling
and the written spec, which is agent work rather than maintainer work but
still has to happen before the next batch's dependencies are honestly
settled. A batch is not closed when its questions are answered; it is
closed when its specs are written.

The load is not evenly spread. Batches 1 through 6 carry thirty percent of
the questions and nearly all of the irreversible ones. The editor chain,
batches 13 through 16, carries another fifth at much the same density per
period. The tail from batch 17 onward is the remaining fifth and is mostly
mechanical once the envelope and the scene are fixed.

## Standing risks

The D4 numbers are the one external input the program cannot supply
itself. Two specs are hard-blocked on them and a third is partly blocked.
If the requirements envelope does not state them when batch 6 opens, the
batch cannot open, and S13, S17, S30, S31 and S33 all sit behind it.

The Windows question no longer compounds. Five specs carried what was
really one question, and answering it five times would have produced five
subtly different answers; the ruling collapses it to one bounded question,
the leg's exact entry point inside S01.

Interface drift is the risk the ordering is designed against but cannot
eliminate. Every spec written against S03's interface answer is written
against a decision that has not been implemented and therefore has not met
contact with a real backend. S03b is the canary: it is the third RHI
implementation, and its own open question asks how long the interface may
drift before a third implementation gets expensive.

Freeze points are one-way doors. S26 freezes the wire envelope and S29
freezes the replication message kinds. Both freeze against specs that are
written but not implemented, and S29's freeze in particular depends on
S28's tripwire semantics being genuinely settled rather than nominally
settled.

Fatigue is a real risk over twenty-two batches. The specs that most reward
a fresh maintainer, S03, S22 and S30, are spread deliberately across the
program rather than clustered, and each has a period to itself for that
reason.

Finally, the program's own premise carries risk. Writing forty-five specs
before implementing any of them means forty-five documents age without
feedback. The mitigation is the ordering itself: the specs most likely to
be invalidated by contact with code are the ones whose questions are
answered first, and whose answers the rest are then written against.
