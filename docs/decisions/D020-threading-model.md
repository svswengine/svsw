# D20: Threading model

Status: current
Date: 2026-07

Adopted from the research plan §4.2, promoted to the log. The simulation is
single-threaded per Session, deterministic by construction. Asset decode may
run on worker threads, but results integrate at a single deterministic point
per frame (an internal prototype's io-pump pattern; a load-fence poll).
Renderer and audio stay main-thread until profiling forces otherwise; any
parallel-sim ambition goes through the decision log. Once threaded asset
decode exists, at least one hash-golden CI leg must run the identical
golden at forced worker counts, workers=1 and workers=max, because
divergence visible only across differing parallelism is the exposure this
closes.
