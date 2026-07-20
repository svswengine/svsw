# D5: Chunked unbounded world

Status: current
Date: 2026-07

The world is chunked and unbounded in extent (the Factorio model):
chunk-local sim coordinates plus a chunk index in hashed state; per-chunk
world hashes compose to a root, generalizing the golden-hash discipline;
floating-origin rendering stays off-hash, proven by an invariance test.
Chunk-local coordinates are f32 (the chunk index carries the range; f64 is
rejected as unnecessary given chunk-local re-basing). Mechanism: per-chunk
hashing lands only in the new target's session assembly; `engine/worldgrid`
composes chunk hashes over the unchanged `hash_world` primitives; the shared
kernel stays frozen additive-only until the stage 3 deletion commit, so the
old target never calls the composition and no old golden is re-recorded.
