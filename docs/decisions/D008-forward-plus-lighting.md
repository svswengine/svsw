# D8: Lighting v1: Forward+ clustered PBR, staged

Status: current
Date: 2026-07

glTF metallic-roughness materials as-authored; cascaded-shadow-mapped sun
first, wgpu compute-shader light clustering second; engine-completion
verification blocks on the sun+CSM milestone only, never on the cluster
pass. Each milestone carries its own exit gate (a single-sun CSM scene; an
N-point-light clustered scene with cluster counts in the skeleton hash).
Supersedes the research plan's Blinn-Phong minimal-forward position. Amended
by D42: the clustering pass is unchanged in substance and runs through the
in-house rendering interface rather than through wgpu compute shaders.
