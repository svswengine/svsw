# D54: The color pipeline is fixed before Milestone A

Status: current
Date: 2026-07

Readback goldens accumulate from S04 onward and freeze whatever the
first shader ships, so an undecided color pipeline becomes a de-facto
one nobody chose, and retrofitting one later re-records every golden and
can regress published course modules under D27. The pipeline is
therefore decided now and lands with S06, ahead of the Milestone A
goldens: the renderer shades into an HDR offscreen target and resolves
through one fixed tonemap operator to the sRGB target that D22 hashes,
presents and reads back, so headless and windowed runs keep comparing
the same resolved image. S06's grilling picks the operator and the v1
ambient term, a flat or hemisphere constant, so shadowed areas do not
bake to black in the Milestone A goldens. Anti-aliasing is out of v1
scope, and image-based lighting and global illumination are post-engine
work on the D55 roster. Shipping LDR with no resolve chain is rejected
because it bakes un-tonemapped output into every golden and prices the
inevitable retrofit at its maximum; deferring the choice to a later
post-processing spec is rejected for the same compounding reason. The
cube goldens S04 records before S06 exists are accepted as a one-time
re-record when the resolve chain lands, priced here rather than
discovered. Adopted from the 2026-07-25 adversarial review at the
maintainer's direction.
