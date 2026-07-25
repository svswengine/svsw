# D16: Rebrand at engine completion

Status: current
Date: 2026-07

svsw is already the settled brand (org `svswengine`, repo `svsw`, CLI `svsw`,
`svsw.*` namespace final, per D26), so the engine-completion rebrand ceremony
shrinks to residual sweeps: the D23 trademark carve-out, docs and course
reference sweeps, and retiring working-name hedges. No compatibility shims;
the asset container stays untouched (brand-neutral magic since stage 2, per
D19); the beads issue prefix is grandfathered (history continuity per D13);
the decision log, beads history, and CI continue uninterrupted under the
settled name; `scaffold-check` stays pointed at the `svsw` CLI throughout.
The rebrand fires when the stage 6 engine-completion gate passes. Amended by
D38: the repository is fresh, so the beads id prefix is new rather than
grandfathered.
