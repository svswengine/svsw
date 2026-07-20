# D19: The asset container

Status: current
Date: 2026-07
Rationale: docs/research/ODIN-ENGINE-RESEARCH-AND-PLAN.md

Adopted from the research plan §4.4, promoted to the log. One versioned
sectioned binary container: magic/kind/schema-version header; a section table
(offset/size/compression/gpu-alignment/type); importer id, version, and
source digests; stable logical content IDs (the simulation never sees
readiness or load order); per-section and whole-file checksums; a
supported-version whitelist; authored sources are never deleted; a version
bump means re-bake via assetc, with zero runtime migration code. Scenes and
prefabs are data-stage content (Luau data files plus container references);
there is no second scene format. The container's name and magic bytes are
brand-neutral from definition, so the rebrand touches no baked data.
