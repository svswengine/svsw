# D20: Threading model

Status: current
Date: 2026-07

Adopted from the research plan §4.2, promoted to the log. The simulation is
single-threaded per Session, deterministic by construction. Asset decode may
run on worker threads, but results integrate at a single deterministic point
per frame (an internal prototype's io-pump pattern; a load-fence poll).
Renderer and audio stay main-thread until profiling forces otherwise; any
parallel-sim ambition goes through the decision log.
