# svsw decision log

Canonical decision log for the svsw engine, one file per decision. Entries
are settled; reopening one is a maintainer call.

## Lifecycle

- Files are named `D<nnn>-<slug>.md` and carry `Status` and `Date` headers.
- `Status: current` means the decision is in force. A partial supersession
  stays current: the amending decision names what it amended, and the amended
  text names the amender, both by current numbers.
- A fully superseded decision keeps its filename. Its `Status` line becomes
  `Status: superseded by D<mmm>`, linking to the superseding decision, and
  its index row moves from Current to Past.
- `Date: YYYY-MM` records when the decision text first entered this repo's
  history, backfilled from git log for decisions logged before the field
  existed.
- A decision that chose between real alternatives carries either one
  sentence naming the rejected alternatives or a `Rationale:
  docs/research/<file>` pointer line.
- Citations of research-era decision numbers anywhere outside
  `docs/research/` use the `R-D` prefix (for example `R-D11`, `R-D54`) to
  avoid collision with the current log.
- Numbers are never reused.

## Current

| # | Title | File |
|---|-------|------|
| D1 | Determinism by construction | [D001-determinism-by-construction.md](D001-determinism-by-construction.md) |
| D2 | Layering discipline | [D002-layering.md](D002-layering.md) |
| D3 | Opt-in binding packages | [D003-opt-in-bindings.md](D003-opt-in-bindings.md) |
| D4 | Gameplay requirements and the verification scene | [D004-product-requirements.md](D004-product-requirements.md) |
| D5 | Chunked unbounded world | [D005-chunked-world.md](D005-chunked-world.md) |
| D6 | Server-authoritative multiplayer | [D006-server-authoritative-multiplayer.md](D006-server-authoritative-multiplayer.md) |
| D7 | Platform: SDL3 + wgpu; sokol and Clay retire | [D007-sdl3-wgpu-platform.md](D007-sdl3-wgpu-platform.md) |
| D8 | Lighting v1: Forward+ clustered PBR, staged | [D008-forward-plus-lighting.md](D008-forward-plus-lighting.md) |
| D9 | UI: Dear ImGui for editor and runtime HUD | [D009-dear-imgui-ui.md](D009-dear-imgui-ui.md) |
| D10 | Editor Luau ships in v1 | [D010-editor-luau-v1.md](D010-editor-luau-v1.md) |
| D11 | Animation is presentation-only, off-hash, client-side | [D011-animation-off-hash.md](D011-animation-off-hash.md) |
| D12 | Mod machinery ports as-is | [D012-mod-machinery-port.md](D012-mod-machinery-port.md) |
| D14 | The C interface tier | [D014-c-interface-tier.md](D014-c-interface-tier.md) |
| D15 | Go<->engine boundary: versioned wire protocol over a process boundary | [D015-go-engine-wire-protocol.md](D015-go-engine-wire-protocol.md) |
| D16 | Rebrand at engine completion | [D016-rebrand-at-completion.md](D016-rebrand-at-completion.md) |
| D17 | Verification-scene world content is hand-authored; seeded worldgen is post-engine product work | [D017-hand-authored-verification-scene.md](D017-hand-authored-verification-scene.md) |
| D18 | Network transport: QUIC client<->gateway; loopback TCP gateway<->worker | [D018-quic-transport.md](D018-quic-transport.md) |
| D19 | The asset container | [D019-asset-container.md](D019-asset-container.md) |
| D20 | Threading model | [D020-threading-model.md](D020-threading-model.md) |
| D21 | Editor command stream | [D021-editor-command-stream.md](D021-editor-command-stream.md) |
| D22 | Dual-mode parity | [D022-dual-mode-parity.md](D022-dual-mode-parity.md) |
| D23 | Apache-2.0 licensing | [D023-apache-2-licensing.md](D023-apache-2-licensing.md) |
| D24 | Closed-contribution open source | [D024-closed-contribution-open-source.md](D024-closed-contribution-open-source.md) |
| D25 | Monorepo | [D025-monorepo.md](D025-monorepo.md) |
| D26 | Org and repositories | [D026-org-and-repositories.md](D026-org-and-repositories.md) |
| D27 | Spec+course pairing, four paths, course after implementation | [D027-spec-course-pairing.md](D027-spec-course-pairing.md) |
| D28 | Project Claude Code tooling architecture | [D028-claude-tooling-architecture.md](D028-claude-tooling-architecture.md) |
| D29 | Review cadence and toolchain verification | [D029-review-cadence.md](D029-review-cadence.md) |
| D30 | Documentation layout convention | [D030-docs-layout-convention.md](D030-docs-layout-convention.md) |
| D31 | Public/private documentation split | [D031-public-private-docs-split.md](D031-public-private-docs-split.md) |
| D32 | Public stats policy | [D032-public-stats-policy.md](D032-public-stats-policy.md) |
| D33 | Luau runtime adoption | [D033-luau-runtime-adoption.md](D033-luau-runtime-adoption.md) |
| D34 | Script typing policy | [D034-script-typing-policy.md](D034-script-typing-policy.md) |
| D35 | Number semantics on f64-only Luau | [D035-f64-number-semantics.md](D035-f64-number-semantics.md) |
| D36 | Engine dev loop | [D036-engine-dev-loop.md](D036-engine-dev-loop.md) |
| D37 | Work decomposition: specs, tickets, and slices | [D037-work-decomposition.md](D037-work-decomposition.md) |
| D38 | Fresh repository: no cutover, public from the first push | [D038-fresh-repository.md](D038-fresh-repository.md) |
| D39 | WebFetch is allowed; shell network commands stay ask | [D039-webfetch-allowed.md](D039-webfetch-allowed.md) |
| D40 | Context engineering: what the always-loaded prompt carries | [D040-context-engineering.md](D040-context-engineering.md) |
| D41 | Normative references are a first-class spec field | [D041-normative-references.md](D041-normative-references.md) |
| D42 | In-house RHI over Vulkan, D3D12 and Metal; Slang shaders | [D042-in-house-rhi-slang.md](D042-in-house-rhi-slang.md) |
| D43 | The editor tier, Extensions, and Editor scripts | [D043-editor-tier-extensions.md](D043-editor-tier-extensions.md) |
| D44 | Worker topology: two kinds, split by state ownership | [D044-worker-topology.md](D044-worker-topology.md) |
| D45 | Committed permissions are an allow list only | [D045-permissions-allow-only.md](D045-permissions-allow-only.md) |

## Past

| # | Title | Superseded by | File |
|---|-------|---------------|------|
| D13 | No backward compatibility through the transition | D38 | [D013-no-backward-compatibility.md](D013-no-backward-compatibility.md) |

## Numbering continuity

Documents under `docs/research/` use the research-era numbering; this table
maps it. `D54` through `D86` map in order to `D4` through `D36`; three
earlier research numbers also map: `D11` to `D1`, `D15` to `D2`, and `D42`
to `D3`. Those three are research tokens; despite the numeric collision,
research `D11` and `D15` are unrelated to the current D11 and D15. D37 and
every number after it were decided in this repository and have no
research-era counterpart.

| Research | Current | Research | Current | Research | Current |
|----------|---------|----------|---------|----------|---------|
| D11 | D1 | D65 | D15 | D76 | D26 |
| D15 | D2 | D66 | D16 | D77 | D27 |
| D42 | D3 | D67 | D17 | D78 | D28 |
| D54 | D4 | D68 | D18 | D79 | D29 |
| D55 | D5 | D69 | D19 | D80 | D30 |
| D56 | D6 | D70 | D20 | D81 | D31 |
| D57 | D7 | D71 | D21 | D82 | D32 |
| D58 | D8 | D72 | D22 | D83 | D33 |
| D59 | D9 | D73 | D23 | D84 | D34 |
| D60 | D10 | D74 | D24 | D85 | D35 |
| D61 | D11 | D75 | D25 | D86 | D36 |
| D62 | D12 | | | | |
| D63 | D13 | | | | |
| D64 | D14 | | | | |
