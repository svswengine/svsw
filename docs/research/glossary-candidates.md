# Ubiquitous-language candidates

Research-era record. Decision numbers here use the research-era scheme; docs/decisions/README.md carries the mapping to the current log.

Status: **unresolved candidates**

These terms have not been accepted by the user. This file exists to expose
ambiguity before code and issue names harden it. It is intentionally not an ADR,
`CONTEXT.md`, or authoritative glossary.

## Product and repository terms

### Engine SDK

Candidate meaning: the public Odin packages, Lua runtime API, tools, artifact
formats, templates, and documentation that games consume.

Questions:

- Is the product primarily an engine executable, an à-la-carte SDK, or both?
- Which packages are public compatibility surfaces?
- Is the game defined by the private product requirements in the same monorepo
  permanently or only during proof?

### Engine runtime

Candidate meaning: the code active while a game runs, excluding source importers
and deployment services.

Ambiguity: “runtime” can mean all client code, the deterministic session only,
or the Lua VM. Use a qualifier until resolved.

### Game Package

Candidate meaning: one source unit containing a manifest, Lua, data declarations,
and source-asset references. It may be a base game or an add-on.

Questions:

- Is “mod” reserved for third-party packages, or are all games packages?
- May packages contain native Odin code?
- What is the security distinction between first-party and hostile packages?

### Game Build

Candidate meaning: immutable output of resolving packages and importing assets,
identified by a simulation manifest and artifact catalog.

Question: is a build platform-neutral plus platform artifact sets, or one build
per target platform?

### Game Session

Candidate meaning: one opened simulation instance with fixed build identity,
seed/start state, roster, tick counter, and authority epoch.

Question: does an offline playthrough use the same term as a network match?

### Match

Candidate meaning: the multiplayer product/lifecycle record around one game
session, including lobby assignment, canonical command record, result, and
recovery epoch.

Ambiguity: some games are persistent rather than match-shaped. “Session” may be
the safer engine term; “match” may remain a Go service term.

## Authority terms

### Simulation-Transition Authority

Candidate meaning: the Odin module that alone commits authoritative state from
tick `N` to `N+1` using a canonical input set.

Question: should the shorter name be `Authority`, `Simulation`, or `Session`?

### Session Authority / Go Control Plane

Candidate meaning: Go's ownership of identity, match lease, roster, wall-clock
deadline, worker lifecycle, and durable routing—not game-state transitions.

Questions:

- Does “authority” misleadingly imply that Go validates gameplay?
- Is “control plane” too infrastructure-oriented for a small engine?
- Should the first implementation use `multiplayerd`, `sessiond`, or another
  user-facing name?

### Admission Authority

Candidate meaning: final game-independent acceptance of a command for a tick:
active player, sequence/window, schema/bounds, neutral synthesis, and canonical
order. Proposed owner: Odin.

Question: which syntactic/rate checks remain duplicated defensively in Go?

### Presentation Authority

Candidate meaning: local control over rendering/interpolation/UI only, never
authoritative gameplay state.

Question: is this term useful, or does “presentation host” avoid overusing
“authority”?

## Runtime boundaries

### Session

Candidate meaning: the deep private Odin module whose `step` operation hides
ECS, Lua systems, RNG, physics, deferred commands, hashes, and deterministic
events.

Questions:

- Does Session own command admission or receive only `Canonical_Input_Set`?
- Does it own presentation extraction or publish a committed change set?
- Is checkpoint encoding inside Session or an adjacent save module?

### Simulation Host

Candidate meaning: an Odin executable or embedded adapter that owns one or more
Sessions and supplies time/input boundaries without owning game rules.

Question: should one process host exactly one Session initially?

### Match Worker

Candidate meaning: a headless Odin process supervised by Go and controlled by
the three-operation worker protocol.

Ambiguity: “worker” can imply stateless background work; this process owns live
authoritative state.

### Local Authority Adapter

Candidate meaning: the offline Odin component that produces canonical input and
calls the private Session directly without Go or IPC.

Question: should tests/replay use this adapter or a narrower unpaced adapter?

### Replica

Candidate meaning: non-authoritative client state derived from confirmed
network output. Its shape depends on the replication experiment.

Question: in lockstep, is a client world still called a replica even though it
runs the complete deterministic Session?

## Input and protocol terms

### Input Intention

Candidate meaning: presentation-side local action before identity, sequence,
tick assignment, and authoritative admission.

Raw keyboard, pointer, controller, and device snapshots remain local
presentation data. The network candidate is a bounded game-command batch or a
schema-defined action-state record, never the raw physical snapshot.

### Candidate Command

Candidate meaning: a bounded typed player command collected by Go and offered
to Odin for a specific closing tick.

### Canonical Input Set

Candidate meaning: the immutable, complete, stable-ordered commands/neutral
values accepted for exactly one tick.

### Tick Commit

Candidate meaning: the result of one successful `Session.step`: tick, canonical
input identity, authoritative hash, deterministic events, and adapter-facing
changes.

Questions for these terms:

- Does a real-time action game use one command per player or a snapshot of all
  actions?
- Are lobby joins/leaves reserved engine commands or separate lifecycle input?
- Does gameplay reject an invalid command by producing no effect, or can the
  admission layer reject certain schema-declared states?

### Worker Protocol

Candidate meaning: the local, bounded, versioned Go/Odin process protocol with
`Open`, `Advance`, and `Close` operations.

Question: is its durable name tied to the engine product or kept generic?

### Network Protocol

Candidate meaning: public client/Go transport messages. It is not necessarily
the same schema or codec as the local worker protocol.

## State and identity terms

### Content Hash

Candidate meaning: digest of the frozen data registry and content-relevant
package declarations.

It is not sufficient to prove simulation equivalence.

### Simulation Manifest

Candidate meaning: the full compatibility record covering runtime build,
native system identity/order, Lua code/order, package/content/schema hashes,
physics, tick rate, capacities, and protocol versions.

Question: which fields form one cryptographic `simulation_fingerprint`, and
which remain inspectable fields alongside it?

### Schema Fingerprint

Candidate meaning: identity of one schema family: component, command, event,
checkpoint, or replica. Avoid one overloaded “schema hash.”

### World Hash

Candidate meaning: deterministic diagnostic hash of authoritative state after a
committed tick. It detects divergence; it is not authentication or a save.

### Authority Checkpoint

Candidate meaning: versioned opaque state sufficient to resume the authoritative
Session if every continuation-relevant subsystem supports exact restoration.

### Anchor

Candidate meaning: a cold or exact checkpoint plus compatibility identity from
which a canonical command log can be replayed.

### Recipient Snapshot

Candidate meaning: visibility-filtered client state at one tick. It is not an
authority checkpoint.

Candidate safety rule: recipient output is deny-by-default. State is
server-only/omitted unless its frozen schema explicitly permits that audience.

### Delta

Candidate meaning: recipient-visible changes relative to an acknowledged
recipient baseline.

Question: should “snapshot” always mean full recipient state, reserving
“checkpoint” for authority, to prevent operational mistakes?

## Asset terms

### Source Asset

Candidate meaning: authoring input such as image, map, audio, font, or model;
never consumed directly by a packaged runtime.

### Importer

Candidate meaning: offline code that converts one source format and settings
into a validated engine artifact.

### Artifact

Candidate meaning: versioned, bounded, validated, digest-addressed runtime data
produced by an importer.

### Runtime Asset

Candidate meaning: CPU-side decoded/prepared representation referenced through
a stable logical content ID.

### GPU/Audio Resource

Candidate meaning: device-owned presentation resource created from a runtime
asset on the required device thread.

Questions:

- Is “artifact” also used for packaged game bundles, creating ambiguity?
- Are platform-specific variants separate artifacts under one logical ID?
- Which resource failures are fatal to simulation, and which produce a loud
  presentation substitute?

## Package and service events

### Deterministic Domain Event

Candidate meaning: schema-declared event emitted in stable system order during
a committed tick. It can be persisted idempotently but never waits for a
service response.

### Outbox Event

Candidate meaning: Go's durable operational record derived from a deterministic
event and identified by match, epoch, tick, and event sequence.

Question: should gameplay know “domain event,” while “outbox” remains solely a
Go persistence implementation term?

## Questions the private product requirements must answer

1. What genre and camera/gameplay model are being proven?
2. Is offline play mandatory, and must the same game become multiplayer without
   gameplay branches?
3. What is the target and maximum player count?
4. Does gameplay contain secret authoritative state?
5. What input-to-feedback latency is acceptable?
6. Is client prediction required for the first playable release?
7. Are join-in-progress, reconnect, spectators, host migration, or dedicated
   servers required?
8. What recovery-time and data-loss objectives apply?
9. Does authoritative physics require exact rollback or crash continuation?
10. What are representative entity, command, event, world-state, and asset
    sizes?
11. Which desktop, server, and web platforms are in the first support matrix?
12. Are third-party hostile packages a launch requirement or a later product
    capability?

Only after these questions and core terms are accepted should the project write
ADRs, a formal context document, or durable Beads issue names around them.
