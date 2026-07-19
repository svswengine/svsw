# SVSW evidence for the successor engine

Research-era record. Decision numbers here use the research-era scheme; docs/decisions/README.md carries the mapping to the current log.

Inspected commit: `9e5b4e54cdfce6e7d131aef23dd82c5439a0929b`

Verification boundary: source and checked-in tests were inspected on 2026-07-12.
The tests were not rerun in this research pass. “Implemented with test evidence”
means a relevant test exists in the inspected tree, not that it passed today.
SVSW is inspiration and evidence; it is not a codebase to rename or copy whole.

## Implemented surface

### Deterministic kernel and ECS

**Observed.** SVSW implements generational entities, sparse component pools,
smallest-pool views, and deferred structural mutation:

- [entity.odin](/Users/ivandrenjanin/projects/svsw/engine/ecs/entity.odin:16)
- [pool.odin](/Users/ivandrenjanin/projects/svsw/engine/ecs/pool.odin:32)
- [view.odin](/Users/ivandrenjanin/projects/svsw/engine/ecs/view.odin:3)
- [command_buffer.odin](/Users/ivandrenjanin/projects/svsw/engine/ecs/command_buffer.odin:56)

The kernel contains a fixed-step accumulator, stable system sorting,
per-system PCG32 streams, canonical world hashing, and snapshot/restore:

- [accumulator.odin](/Users/ivandrenjanin/projects/svsw/engine/kernel/accumulator.odin:1)
- [sort_systems.odin](/Users/ivandrenjanin/projects/svsw/engine/kernel/sort_systems.odin:3)
- [simrng.odin](/Users/ivandrenjanin/projects/svsw/engine/simrng/simrng.odin:1)
- [hash.odin](/Users/ivandrenjanin/projects/svsw/engine/kernel/hash.odin:22)
- [snapshot.odin](/Users/ivandrenjanin/projects/svsw/engine/kernel/snapshot.odin:6)

An explicit deterministic repeatability harness exists in
[determinism_test.odin](/Users/ivandrenjanin/projects/svsw/engine/harness/determinism_test.odin:12).

**Validated in SVSW's checked-in test design.** Seed plus ordered systems and
recorded inputs is intended to reproduce the same world hash. That contract is
the most important carry-forward; its future implementation must earn its own
cross-platform gate.

### Lua and mod lifecycle

**Observed.** Each mod owns a Lua VM with a capped allocator, instruction
quota, protected entry, error classification, stack traces, and sandbox setup
in [host.odin](/Users/ivandrenjanin/projects/svsw/engine/script/host.odin:41),
[host.odin](/Users/ivandrenjanin/projects/svsw/engine/script/host.odin:515), and
[sandbox.odin](/Users/ivandrenjanin/projects/svsw/engine/script/sandbox.odin:12).
Hostile-script cases are represented in
[hostile_test.odin](/Users/ivandrenjanin/projects/svsw/engine/script/hostile_test.odin:10).

Mod resolution is deterministic, and the load lifecycle is settings → data →
freeze/hash → control:

- [resolve.odin](/Users/ivandrenjanin/projects/svsw/engine/mod/resolve.odin:1)
- [loader.odin](/Users/ivandrenjanin/projects/svsw/engine/script/loader.odin:294)
- [data_stage.odin](/Users/ivandrenjanin/projects/svsw/engine/script/data_stage.odin:591)
- [dropin_test.odin](/Users/ivandrenjanin/projects/svsw/engine/script_accept/dropin_test.odin:49)

**Implication.** Preserve per-package isolation, deterministic resolution, the
frozen registry, and separate schema/content/world identities. Redesign the
surface so Lua receives capabilities and values rather than native pointers.

### Input, presentation, assets, and audio

**Observed.** The input path samples at tick boundaries into immutable snapshots
and includes bounded typed UI commands:

- [sample.odin](/Users/ivandrenjanin/projects/svsw/engine/input/sample.odin:1)
- [snapshot.odin](/Users/ivandrenjanin/projects/svsw/engine/input/snapshot.odin:22)
- [snapshot.odin](/Users/ivandrenjanin/projects/svsw/engine/input/snapshot.odin:38)

The CPU sprite batcher and frame representation are sokol-free; GPU submission
is isolated in a thin package:

- [batch.odin](/Users/ivandrenjanin/projects/svsw/engine/render/batch.odin:14)
- [frame.odin](/Users/ivandrenjanin/projects/svsw/engine/render/frame.odin:17)
- [gpu.odin](/Users/ivandrenjanin/projects/svsw/engine/render/gpu/gpu.odin:1)

Resource stores use bounded IO and loud presentation placeholders, while the
audio mixer is a CPU core with a thin device adapter:

- [io.odin](/Users/ivandrenjanin/projects/svsw/engine/assets/io.odin:6)
- [texture.odin](/Users/ivandrenjanin/projects/svsw/engine/assets/texture.odin:61)
- [mixer.odin](/Users/ivandrenjanin/projects/svsw/engine/audio/mixer.odin:19)
- [device.odin](/Users/ivandrenjanin/projects/svsw/engine/audio/device/device.odin:1)

**Implication.** Preserve the CPU-core/device-adapter split and total behavior
for bad presentation assets. Replace runtime source-format loading with the
stronger Carbon-style artifact lifecycle.

### Save, replay, and headless execution

**Observed.** Restore validates before mutating the live session, and replay is
tick-indexed:

- [session.odin](/Users/ivandrenjanin/projects/svsw/engine/save/session.odin:118)
- [bundle.odin](/Users/ivandrenjanin/projects/svsw/engine/save/bundle.odin:1)
- [replay_loop.odin](/Users/ivandrenjanin/projects/svsw/engine/save/replay_loop.odin:6)
- [session_test.odin](/Users/ivandrenjanin/projects/svsw/engine/save/session_test.odin:92)

A neutral headless Odin executable exists in
[svsw-headless/main.odin](/Users/ivandrenjanin/projects/svsw/cli/svsw-headless/main.odin:45).
Game-scale acceptance tests include Breakout, chess, and a roguelike:

- [breakout_accept_test.odin](/Users/ivandrenjanin/projects/svsw/engine/script_accept/breakout_accept_test.odin:200)
- [chess_accept_test.odin](/Users/ivandrenjanin/projects/svsw/engine/script_accept/chess_accept_test.odin:371)
- [rogue_like_accept_test.odin](/Users/ivandrenjanin/projects/svsw/engine/script_accept/rogue_like_accept_test.odin:232)

## Proven carry-forwards

The successor should re-prove, not merely copy, these contracts:

- Fixed tick, stable entity/system iteration, deferred structural mutation.
- One deterministic RNG stream per registered system.
- Explicit immutable authoritative input per tick.
- Canonical state hash with cross-platform fixtures.
- Snapshot/restore and anchor-plus-input replay.
- Per-package Lua allocator/instruction/error containment.
- Settings/data/control lifecycle and a frozen content registry.
- Validation-before-mutation restore.
- Headless package closure with no render/audio/device imports.
- CPU renderer/mixer cores with thin device packages.
- Loud fallback behavior for presentation-only resource failure.

## Inspire, do not copy

- `World` has high leverage but also contains off-hash hooks and subsystem
  pointers in [world.odin](/Users/ivandrenjanin/projects/svsw/engine/kernel/world.odin:84).
  Preserve its invariants behind a smaller private `Session` interface.
- `Script_Host` is a broad integration record in
  [host.odin](/Users/ivandrenjanin/projects/svsw/engine/script/host.odin:101).
  Preserve VM ownership and capability registration, not the raw-pointer hub.
- Raw component-byte persistence couples saves to Odin layout. Use a versioned,
  validated schema rather than treating an in-memory image as a durable wire.
- Texture handles are assigned by load order in
  [texture.odin](/Users/ivandrenjanin/projects/svsw/engine/assets/texture.odin:162).
  Successor IDs should come from the frozen content registry.
- `svsw run --headless` contains sample-specific input behavior in
  [run.odin](/Users/ivandrenjanin/projects/svsw/cli/run.odin:246); the neutral
  headless executable is the reusable model.
- Script asset confinement is lexical in
  [assetpath.odin](/Users/ivandrenjanin/projects/svsw/engine/script/assetpath.odin:6).
  A hostile-mod product needs handle-based/root-confined access.
- Hot reload observes only the first host in
  [main.odin](/Users/ivandrenjanin/projects/svsw/engine/dev/main.odin:482) and
  [run.odin](/Users/ivandrenjanin/projects/svsw/cli/run.odin:608). Do not claim
  coordinated multi-mod reload from this evidence.

## Current gaps

**Observed by absence/source inspection.** SVSW contains no implemented
multiplayer protocol, state replication, rollback, join/reconnect,
authentication, matchmaking, network persistence, or Go session service.

Additional limits:

- Windows/Linux gamepad is a no-device implementation in
  [gamepad_stub.odin](/Users/ivandrenjanin/projects/svsw/engine/platform/gamepad_stub.odin:1).
- Windows packaging is refused in
  [package.odin](/Users/ivandrenjanin/projects/svsw/cli/package.odin:1).
- Folder mods work; archive/workshop distribution is not implemented.
- Texture stores are append-only and have no eviction policy.
- Visual/device correctness has less automated coverage than CPU render data.
- Authoritative Lua heap state is not snapshot-serialized.
- Box2D reconstruction loses warm solver state in
  [system.odin](/Users/ivandrenjanin/projects/svsw/engine/physics/system.odin:518),
  so it is not evidence for bit-exact mid-match rollback.
- Typed UI transduction is called in the development loop at
  [main.odin](/Users/ivandrenjanin/projects/svsw/engine/dev/main.odin:500), but
  was not found in the inspected shipping frame path beginning at
  [run.odin](/Users/ivandrenjanin/projects/svsw/cli/run.odin:605). This was not
  live-window verified.

## Multiplayer primitives and missing pieces

Primitives already implemented in Odin:

- Tick input installation: [world.odin](/Users/ivandrenjanin/projects/svsw/engine/kernel/world.odin:335)
- Deterministic step: [world.odin](/Users/ivandrenjanin/projects/svsw/engine/kernel/world.odin:394)
- Canonical hash: [hash.odin](/Users/ivandrenjanin/projects/svsw/engine/kernel/hash.odin:109)
- Snapshot/restore: [snapshot.odin](/Users/ivandrenjanin/projects/svsw/engine/kernel/snapshot.odin:6)
- Content/schema identity: [bundle.odin](/Users/ivandrenjanin/projects/svsw/engine/save/bundle.odin:1)
- Tick replay: [replay_loop.odin](/Users/ivandrenjanin/projects/svsw/engine/save/replay_loop.odin:6)
- Headless process: [svsw-headless/main.odin](/Users/ivandrenjanin/projects/svsw/cli/svsw-headless/main.odin:45)

Still missing and requiring independent proof:

- Go/Odin process framing, version negotiation, idempotence, and backpressure.
- Canonical network commands and final admission authority.
- Worker lifecycle, watchdog, lease/epoch, and crash policy.
- Lobby, roster, session, authentication, and transport.
- Replication topology and recipient visibility.
- Snapshot transfer, reconnect, recovery, and persistence semantics.
- Cross-language golden fixtures, fuzzing, network chaos, and 16-client soak.
- A simulation manifest covering native code, Lua code/order, content, schemas,
  physics settings, protocol, and runtime build.

The checked-in Go is tooling such as
[mcpx.go](/Users/ivandrenjanin/projects/svsw/tools/mcp/internal/mcpx/mcpx.go:1).
The server directory records future intent only in
[server/README.md](/Users/ivandrenjanin/projects/svsw/server/README.md:1).

## Historical lessons, not current verification

The following are prior-session lessons. They were not revalidated during this
research pass and must not be promoted to current defects or findings:

- A live window once closed while headless gates remained green; the reported
  cause was repeated same-frame shared GPU-buffer updates, corrected by an
  append-based submission path. Lesson: live GPU validation and headless tests
  cover different failure classes.
- A prior adversarial review found that the useful lenses were TigerStyle,
  deterministic state, the Lua boundary, the thin GPU boundary, capacity
  bounds, and diff scope. Its individual findings were change-set-specific.
- A prior deep-security exercise identified `tools/mcp`, `engine/script`,
  `engine/assets`, `engine/render`, and `engine/physics` as high-signal surfaces.
  Discovery candidates were not fully validated and are not security findings.

The documented choice that Go remains the multiplayer shell appears in
[docs/README.md](/Users/ivandrenjanin/projects/svsw/docs/README.md:120), and the
multiplayer architecture begins in
[06-multiplayer.md](/Users/ivandrenjanin/projects/svsw/docs/06-multiplayer.md:1).
Those are design decisions, not an implemented Go server. Testing standards
also acknowledge residual hash-completeness and Lua-heap restore risks in
[09-testing-standards.md](/Users/ivandrenjanin/projects/svsw/docs/09-testing-standards.md:110)
and [09-testing-standards.md](/Users/ivandrenjanin/projects/svsw/docs/09-testing-standards.md:186).
