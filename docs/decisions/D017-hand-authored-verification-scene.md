# D17: Verification-scene world content is hand-authored; seeded worldgen is post-engine product work

Status: current
Date: 2026-07

The engine verification scene's few chunks are hand-authored data-stage
scenes (editor-authored, container-referenced); chunks without authored
content activate with a deterministic, hashed default fill, so the world's
unbounded extent is real from stage 2. Full deterministic seeded worldgen
(terrain variation, resource-node placement) belongs to post-engine product
work with its own determinism acceptance (same-seed chunk-hash reproduction
across CI platforms), built once for the shipped product's real needs rather
than twice.
