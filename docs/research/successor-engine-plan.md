# Successor engine: proof-first architecture and roadmap

Status: **proposed design, not accepted implementation plan**

Evidence inputs:

- [Carbon inventory](carbon-inventory.md)
- [Carbon architecture](carbon-architecture.md)
- [SVSW evidence](svsw-evidence.md)
- [Unresolved glossary](glossary-candidates.md)

This plan fixes only decisions that are safe without a game. Network
replication, prediction, rollback, reconnect, and recovery policy remain
experiments until private product requirements supply measurable thresholds.

## Strongest safe-now architecture

Build one deterministic Odin `Session` that owns every authoritative gameplay
transition. Sandboxed Lua supplies game rules over that session. Go owns the
multiplayer shell: connections, authentication, lobbies, deadlines, process
supervision, opaque persistence, and operations.

```text
game Lua
  -> narrow script capabilities
  -> private Odin Session
  -> ECS / fixed tick / RNG / hash / checkpoint

remote client
  -> Go transport and session coordination
  -> bounded, versioned local process protocol
  -> headless Odin match worker
  -> private Odin Session

local/offline host
  -> embedded Odin authority adapter
  -> the same private Odin Session
```

There is one simulation implementation. Go never implements collisions, ECS
systems, Lua rules, physics, entity IDs, world hashes, or game outcomes.

## Provisional authority vocabulary

The terms remain candidates until the user accepts the glossary, but the
responsibility split must be unambiguous:

- **Simulation-transition authority:** Odin decides which validated command
  set advances tick `N` to `N+1` and computes the result.
- **Session authority:** Go decides who may connect, which match lease is live,
  when the wall-clock input window closes, and which worker process is current.
- **Presentation authority:** the local client decides only how confirmed or
  predicted presentation state is rendered; it cannot mutate authoritative
  state.

Go may reject unauthenticated, oversized, rate-limited, or transport-invalid
messages. Odin performs final game-independent admission, canonical ordering,
neutral-input synthesis, and tick commit. Lua determines gameplay validity
inside the deterministic tick.

## Language responsibility split

### Odin

- ECS, fixed-step scheduler, deferred mutation, deterministic RNG, state hash.
- Private `Session`, command admission, canonical tick commit, and replay values.
- Lua VM lifecycle, sandbox, quotas, package/data lifecycle.
- Versioned authoritative checkpoint and replay.
- Replication projection/encoding selected by the replication bake-off experiment.
- Client replica application, presentation extraction, renderer, audio, input.
- Asset artifact validation, bounded decode, runtime resources.
- Headless worker and direct embedded adapters.

### Lua

- Package manifests and data-stage declarations.
- Gameplay components, systems, rules, AI, scoring, spawning, and reactions.
- Typed command intent definitions.
- Declarative replication visibility only if the selected experiment needs it.
- Optional presentation/UI scripts with no access to the mutable authority.

Lua never receives sockets, filesystem paths, process handles, Go services,
wall clock, raw native pointers, serializer buffers, or protocol sequence/tick
assignment.

### Go

- TLS and public network transports.
- Identity, admission, rate limiting, lobby, roster, matchmaking, session lease.
- Wall-clock input deadlines and bounded candidate collection.
- Worker spawn/stop/watchdog and authority epochs.
- Sole durable multiplayer command-log ownership: persist Odin-produced
  `Tick_Commit` values without reinterpreting gameplay, plus opaque checkpoints
  and an idempotent event outbox.
- Metrics, tracing, health, deployment, and operator APIs.

Go depends on generated protocol values, never on Odin ECS or Lua packages.

## Private Session and three-call worker seam

The private Odin convergence point is conceptually:

```text
Session.step(Canonical_Input_Set) -> Tick_Commit
```

This is new design prose, not copied source. `Session.step` hides ECS iteration,
Lua systems, physics, deferred commands, RNG, hash, events, and presentation
extraction. Local authority, a headless worker, replay, and later prediction
must all converge here.

Internal Odin packages may expose focused operations for load, open, step,
checkpoint/restore, replica application, and close. Those same-language
operations are not mirrored across the process boundary.

The public Go/Odin match-worker protocol has exactly three operations:

```text
Worker_Open
Worker_Advance_One_Tick
Worker_Close
```

`Worker_Advance_One_Tick` carries one bounded candidate set plus an implicit
tick close. It returns the exact canonical accepted set, committed tick, world
hash, deterministic events, optional checkpoint, and an opaque
replication-output variant selected by the current experiment.

The Odin simulation commit and Go durable-log commit are distinct. Odin first
commits the state transition and returns `Tick_Commit`. For a multiplayer
match, Go is the sole durable canonical-log writer: it records that value
verbatim under the active epoch before publishing it to clients. Offline replay
files may be written by the local Odin host, but no second multiplayer writer
competes with Go.

Invariants:

- One call is active per match; the match is thread-confined.
- `expected_tick` must equal the exact next tick.
- Every active player contributes one bounded command/action-state batch or an
  explicit neutral contribution.
- All collections and decoded byte lengths have named maxima.
- A request is validated before state mutation.
- No callback enters Go, network, filesystem, DB, or device code during a tick.
- Normal results are published only after a complete tick commit.
- The worker never exposes entity/component queries over IPC.

### Deadline and admission sequence

```text
clients -> Go authenticates/rate-limits/collects candidates
deadline -> Go writes request intent and sends Worker_Advance
worker -> Odin validates roster/sequence/window/schema
worker -> Odin inserts neutral values and canonical-sorts
worker -> Session.step
worker -> simulation Tick_Commit + hash + output
Go -> durably commits that exact result, then routes it
```

Go may sort for stable wire bytes; Odin revalidates and owns final admission.

### Idempotence and fencing

All three operations carry match identity, authority epoch, and a digest of the
operation payload, but their retry contracts differ:

- `Open` is idempotent for the same `(match, epoch, simulation manifest,
  start-state digest)`. A conflicting reuse is rejected before world creation.
- `Advance` adds a monotonically increasing request sequence and expected tick.
  The exact next sequence executes; an identical retry returns the cached
  `Tick_Commit`; a gap, conflicting payload, wrong tick, or wrong epoch is
  rejected without mutation.
- `Close` is terminal and idempotent for the same close digest. A live worker
  can replay the final response; after process exit, Go treats a missing close
  response as indeterminate rather than inventing a result.

Go permits one in-flight advance per match. A lost response may be retried only
while the same worker/epoch is alive. If a worker dies after a possible commit,
the match is fatal/indeterminate until checkpoint-plus-log recovery is proven.
Epoch ownership is acquired and advanced with compare-and-swap semantics so a
stale supervisor cannot write a second canonical log.

## Monorepo module shape

```text
engine/
  kernel/
    ecs/
    world/
    simrng/
    hash/
  session/
    session.odin
    authority.odin
    tick_commit.odin
  script/
    core/
    command/
    presentation/
  save/
    checkpoint/
    replay/
  replication/
    schema/
    projection/
    replica/
  assets/
    artifact/
    runtime/
  render/
  audio/
  platform/
  worker/
    process_protocol/
    matchd/

protocol/
  schema/
  generated/
    odin/
    go/

server/
  cmd/multiplayerd/
  session/
  transport/
  worker/
  store/
  observability/

tools/
  assetc/

runtime/
  lua/

games/
  product/
```

Dependency arrows:

```text
Lua game -> script/core -> session -> kernel
local presentation -> replica -> render/audio -> platform
Go multiplayerd -> generated Go protocol -> IPC
IPC -> generated Odin protocol -> worker -> session -> kernel
assetc -> versioned artifact -> assets/runtime -> presentation adapters

Go -/-> ECS, Lua, physics, renderer
session -/-> network, DB, wall clock, GPU, audio device
Lua -/-> Go and native service SDKs
```

Use one repository, one provenance ledger, and atomic Odin/Lua/Go protocol
changes. Extract a repository only after independent release and multiple real
consumers are demonstrated.

## Lua capability and fault policy

### Authoritative capabilities

Inside a deterministic system, Lua may receive only:

- deterministic ECS query and mutation;
- deferred create/destroy;
- the immutable canonical input/command view for the current tick;
- fixed tick number and fixed delta;
- the registered system's deterministic RNG stream;
- explicit persistent values backed by authoritative state;
- stable identifiers from the frozen content registry;
- bounded schema-declared deterministic event emission.

Presentation Lua reads an immutable presentation/replica view and may emit
render, audio, UI, and future-tick input intentions. It cannot access the live
authority.

### Persistent-state rule

All continuation-relevant gameplay state must live in versioned authoritative
state: ECS components, registered RNG, and explicitly supported engine state.
Mutable Lua globals, closure state, coroutines, device state, and async job state
are not durable authority.

### Failure policy

| Context | Policy |
|---|---|
| Manifest/data/control load | Reject the game artifact or match before tick zero |
| Authoritative runtime error | Catch, emit structured `Script_Fault`, terminate the match |
| Authoritative quota violation | Match-fatal structured fault |
| Presentation/UI Lua error | Disable the offending presentation script; authority continues |
| Development import/tool script | Contain the operation and report diagnostics |

The engine does not crash because Lua failed. An authoritative match stops
because continuing after removing game rules would silently change authority.

## Carbon-derived asset lifecycle

Adopt the concept, not the implementation:

```text
Source Asset
  -> Importer
Versioned Validated Artifact
  -> bounded background read/decode
Runtime Asset
  -> presentation/device-thread prepare
GPU/Audio Resource
```

Every artifact header contains:

- magic, artifact kind, and schema version;
- importer identifier/version;
- source and dependency digests;
- stable logical content identifier;
- platform/device class when relevant;
- bounded section table, compressed and uncompressed sizes;
- checksum for corruption detection.

Checksums are not authenticity. Signed distribution, if needed, belongs to the
package/update layer. Source formats and heavy import dependencies do not ship
in the game runtime. Simulation sees only stable logical IDs and cannot observe
asset readiness or job completion order.

## Simulation manifest

A content hash alone cannot prove simulation compatibility. Every game build
produces a `Simulation_Manifest` covering:

- engine API and worker protocol versions;
- runtime build identity and Odin compiler/toolchain identity;
- ordered native simulation-system identities;
- Lua version, ordered package set, ordered control-code digests, and disabled
  package resolution state;
- frozen data/content hash;
- component, command, event, checkpoint, and replication schema fingerprints;
- fixed tick rate and all authoritative capacity values;
- physics implementation/build/settings and continuation capability;
- deterministic math/float policy and supported determinism class;
- package/artifact manifest digest.

Network join, checkpoint restore, replay verification, and worker recovery use
the full compatibility tuple. Minor wire compatibility cannot change tick or
simulation semantics.

## Protocol and serialization requirements

- Raw keyboard, pointer, controller, and device snapshots are presentation-local
  and never cross public transport or worker IPC. Before Go sees input, the
  client maps physical state into a bounded versioned game-command batch or a
  schema-defined action-state record. SVSW's in-memory `Input_Snapshot` is an
  inspiration for tick sampling, not a network message.
- Schema-first, language-neutral, versioned from the first frame.
- Fixed-width discriminants and integers; explicit byte order.
- Length checked before allocation; nested counts checked against parent bytes.
- No raw ECS memory, Odin padding, pointers, maps, or Lua tables on the wire.
- Unknown simulation commands are rejected, never ignored.
- Non-simulation optional fields may be skipped only under negotiated minor
  compatibility.
- Authoritative checkpoints and recipient snapshots are different formats.
- Command/action records carry player/slot, client sequence, assigned tick,
  kind, and bounded typed payload. A player may contribute a bounded batch;
  absence becomes an explicit neutral contribution.
- Tick commits carry canonical order and world hash.
- Deterministic events carry `(match, epoch, tick, event_sequence)` idempotency.
- Golden frames are independently encoded/decoded by Odin and Go and fuzzed.

Protobuf is a reasonable outer-envelope proof because Go support is strong and
outer bytes are not hashed simulation state. It is not accepted as the durable
hot-path codec until the Odin binding, allocation profile, bounds behavior, and
fuzzer pass. A small generated format remains a valid experiment.

## Security and capacity constraints

- Public transport terminates in Go; the Odin worker listens only on a local
  process channel.
- Service credentials, database drivers, identity tokens, and operator APIs do
  not enter the worker.
- Go authenticates identities; Odin maps only validated stable player slots.
- Recipient visibility filtering occurs in Odin so hidden authoritative bytes
  never reach a generic Go router.
- Replication is deny-by-default: a field/entity is server-only and omitted
  unless its frozen schema explicitly classifies it for a recipient audience.
  Forbidden-value canaries, adversarial fixtures, and decoder fuzzing must prove
  that server-only bytes cannot enter recipient output.
- The worker is fenced by match epoch and one owning supervisor.
- Lua VMs have independent memory and instruction budgets.
- Artifact and protocol decoders reject truncation, overflow, overlap,
  impossible sizes, invalid enums, and excess nesting before use.
- Every queue has a named element and byte bound plus an explicit overflow
  policy; commands/events are never silently truncated.
- External source importers run outside packaged clients and servers.
- Third-party source is quarantined, pinned, checksummed, and reviewed before
  vendoring.

Capacities must be selected from private product requirements and tested at zero, one,
maximum, and one-past-maximum. Required categories include players, commands per
player/tick, future-input window, command bytes, entities, component instances,
Lua memory/instructions, deterministic events, IPC frame bytes, recipient
output bytes, pending network bytes, checkpoint bytes, artifact sections, and
decoded-resource bytes.

## Architecture alternatives

Scores are relative; 5 is strongest for the criterion, and 5 under operations
means the least burden.

| Criterion | A: three-call authority | B: session fabric | C: lockstep Session |
|---|---:|---:|---:|
| Module depth | 5 | 4 | 5 |
| Interface size | 5 | 2 | 3 |
| Deterministic integrity | 5 | 5 | 5 |
| Go multiplayer leverage | 4 | 5 | 3 |
| Offline ergonomics | 4 | 4 | 5 |
| Hidden state / anti-cheat | 5 | 5 | 1 |
| Recovery architecture | 4 | 5 | 1 |
| Low operational burden | 3 | 2 | 5 |
| Asset lifecycle fit | 2 | 3 | 5 |
| Prediction/rollback evolution | 3 | 5 | 4 |
| Scope discipline | 5 | 2 | 5 |

The proposed invariant hybrid takes:

- A's three-call worker, idempotence, fencing, and process isolation.
- B's Go session responsibilities, compatibility tuple, opaque persistence,
  recipient projection concept, and staged evolution.
- C's private `Session.step`, embedded offline mode, Odin admission, replay
  oracle, static linking, narrow ports, and Carbon asset lifecycle.

It rejects B's early fabric breadth and C's assumption that every game can
ship with full-state lockstep.

## Replication is a required experiment

**Provisional hypothesis.** A server-authoritative Odin worker with
recipient-owned projections is the most general shape for hidden state and
anti-cheat. It is not yet validated as the first implementation.

Phase 12 must implement the same representative product slice three ways:

### Experiment A — server-ordered lockstep

Go closes deadlines; Odin commits canonical commands and a hash; every client
runs the same Odin session. Measure input latency, CPU, cross-platform hash
stability, join/recovery cost, and unacceptable state disclosure.

### Experiment B — authoritative full recipient snapshots

Only the server runs authority. Odin emits bounded `server/all/owner`
projections, with `server`/omitted as the default; clients interpolate confirmed
snapshots. Measure snapshot CPU, bytes/player, forbidden-canary exclusion,
perceived latency, and reconnect cost.

### Experiment C — authoritative baseline plus deltas

Odin emits a full baseline followed by acknowledged deltas; owned prediction is
added only if the product latency target cannot otherwise be met. Measure
baseline churn, delta complexity, correction frequency, client memory, and
debuggability.

Private product requirements supply acceptance thresholds before the bake-off. No
generic replication API is stabilized until one experiment passes and the
other two have written rejection evidence.

## Safe decisions and experimental decisions

| Safe to decide now | Evidence status |
|---|---|
| Odin is the sole simulation implementation | Proposed from SVSW evidence; architecture invariant |
| Lua is capability-limited gameplay, never network/services | Proposed safety boundary |
| Go is the multiplayer/operations shell | Proposed; Carbon does not validate it |
| Fixed tick, ordered ECS, per-system RNG, hash, replay | Implemented in SVSW; must be revalidated |
| Private deep Session and headless closure | Proposed from working SVSW primitives |
| Three-call process worker for network authority | Proposed boundary; requires protocol proof |
| Embedded offline mode without Go | Proposed usability invariant |
| Monorepo and one provenance policy | Proposed response to observed Carbon cost |
| Versioned artifact lifecycle | Proposed from observed Carbon strength |
| Authoritative Lua faults terminate the match | Proposed integrity policy |

| Must remain experimental | Decision evidence needed |
|---|---|
| Lockstep vs snapshots vs deltas | Phase 12 bake-off |
| Client prediction/reconciliation | Product latency miss |
| Server rollback | Exact checkpoint including physics continuation |
| Live worker recovery | Crash/replay proof and recovery-time objective |
| Join/reconnect/spectators | Product requirement |
| Public transport | Platform matrix; web has no UDP |
| Protobuf vs generated binary codec | Odin/Go bounds, fuzz, allocation benchmark |
| One process per match vs packed workers | Memory and crash-domain measurements |
| Interest management | Measured snapshot/delta scaling pressure |
| Physics library | Cross-platform determinism and snapshot evidence |
| Dynamic native plugins | Multiple proven independent consumers |

## Phase 0–14 proof roadmap

Every phase ends in a repeatable gate. Later phases do not patch around failed
earlier contracts.

| Phase | Outcome | Required gate | Explicit non-goal | Depends on |
|---:|---|---|---|---|
| 0 | Accepted private product requirements, vocabulary set, risk register, Beads migration | User accepts requirements and tracking owner; replication thresholds written | Engine code | None |
| 1 | Monorepo skeleton, Odin/Lua/Go toolchains, formatting/test/security gates | Empty targets build headless/client/server on CI platforms | Gameplay or dependencies beyond toolchain | 0 |
| 2 | Deterministic Odin kernel | 100k-tick same-input hash equality; bounds tests; cross-OS trace | Lua, rendering, networking | 1 |
| 3 | Private Session and local Authority | Local and replay callers share `Session.step`; canonical ordering fuzz | Go or public protocol | 2 |
| 4 | Lua package/data/control boundary | Hostile-script suite; deterministic package/content fingerprints; authoritative fault semantics | Hot reload, workshop distribution | 3 |
| 5 | Typed command and embedded offline path | Recorded local commands reproduce terminal hash; neutral/late/duplicate cases | Remote clients | 4 |
| 6 | Versioned checkpoint and replay | Validate-before-open restore; anchor+commands reproduce hashes; corrupt data rejected | Live recovery or rollback | 5 |
| 7 | Artifact build/runtime lifecycle | Source→artifact golden; malformed/oversized sections rejected; decode order hash-neutral | Broad editor or all formats | 4 |
| 8 | Minimal presentation stack | One CPU frame model, one GPU path, one CPU mixer/device path; headless excludes devices | Backend matrix | 7 |
| 9 | Product offline vertical slice | Playable loop, save/replay, headless terminal hash, asset package | Multiplayer | 5, 6, 8 |
| 10 | Three-call Go/Odin worker proof | Independent golden frames; fuzz; crash-at-boundary; bounded RSS; idempotent retry | Public Internet transport | 6, 9 |
| 11 | One-binary Go multiplayer shell | Two clients authenticate, submit candidates, run one worker; metrics and bounded queues | Matchmaking fleet or high availability | 10 |
| 12 | Product A/B/C replication bake-off | Written metrics and adversarial review select or reject each model | Stabilizing all three | 11 |
| 13 | Selected multiplayer slice | 2–16-player chaos/soak within brief budgets; hidden-state and replay gates as applicable | Unselected netcode features | 12 |
| 14 | Packaging, deployment, provenance, release | Reproducible client/worker/server/artifact bundle; licenses/notices; recovery policy honest | General-purpose service platform | 13 |

### Dependency lanes

Work can proceed in parallel only where the invariant boundary is already
proven:

- **Simulation lane:** phases 2–6.
- **Content lane:** phase 7 after Lua/data identity is known.
- **Presentation lane:** phase 8 after artifact/runtime values exist.
- **Game lane:** phase 9 after simulation, save, content, and presentation.
- **Protocol lane:** phase 10 after checkpoint and command formats are real.
- **Go lane:** phase 11 after the worker protocol passes independent fixtures.
- **Replication lane:** phases 12–13 after the downstream product supplies real data.
- **Release lane:** phase 14 after the selected topology is stable.

Network work must not start by defining ECS wire layouts. Asset work must not
introduce GPU/device dependencies into simulation. Go service work must not
import or reimplement gameplay.

## Candidate Beads epic and task groups

These are candidates only; no issues were created because the Beads database
requires an owner-approved migration.

### Epic: product contract

- Write private product requirements and a representative workload.
- Resolve accepted vocabulary.
- Set capacity and performance budgets.
- Record replication bake-off acceptance criteria.

### Epic: deterministic kernel and Session

- Build bounded entity/component storage and deferred commands.
- Add fixed-step scheduling and per-system RNG.
- Add canonical hash traces and cross-platform fixtures.
- Implement private Session and local Authority.

### Epic: Lua game-package boundary

- Pin Lua and implement context-safe Odin callbacks.
- Add per-package allocator/instruction budgets.
- Implement settings/data/freeze/control lifecycle.
- Add typed commands, events, and hostile-script tests.

### Epic: checkpoint, replay, and manifest

- Define versioned checkpoint schema and validation.
- Implement anchor-plus-command replay.
- Generate the complete simulation manifest.
- Prove physics/Lua continuation limits explicitly.

### Epic: asset artifacts and presentation

- Build one importer and validated artifact.
- Implement bounded background decode and device preparation.
- Build one renderer path and one audio path.
- Prove headless dependency closure.

### Epic: worker protocol and Go shell

- Specify three-call framing, versioning, caps, idempotence, and epochs.
- Implement independent Odin/Go golden fixtures and fuzz targets.
- Add process supervision, bounded queues, WAL/outbox, and metrics.
- Complete two-client adverse-order loopback.

### Epic: product replication bake-off

- Implement Experiment A lockstep adapter.
- Implement Experiment B full-recipient-snapshot adapter.
- Implement Experiment C baseline/delta adapter at minimum viable depth.
- Run latency/bandwidth/CPU/security/recovery measurements.
- Conduct adversarial review and record the selected model and rejected evidence.

### Epic: selected multiplayer and release

- Harden only the selected topology.
- Run 2–16-player chaos, soak, and cross-target gates.
- Implement only evidenced reconnect/recovery/prediction features.
- Package notices, provenance, deployment artifacts, and operator runbook.

## Completion rule

The research phase is complete when Phase 0 decisions are accepted and Beads
contains the approved epics. The engine architecture is not complete merely
because a diagram exists. Each boundary becomes durable only after its named
gate produces repeatable evidence.
