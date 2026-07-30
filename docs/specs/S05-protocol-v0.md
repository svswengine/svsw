# S05 — Protocol v0: versioned frames, two-process echo pair, the arrow rule

Normative text for S05. The [spec index](README.md) records this spec's
rung and nothing else duplicates it (D37).

- **Stage:** 0 — New-stack proof
- **Status:** spec written
- **Depends on:** S02a
- **Decisions:** [D15](../decisions/D015-go-engine-wire-protocol.md) as
  amended by [D49](../decisions/D049-editor-message-kinds-transport.md),
  [D57](../decisions/D057-rewind-edit-semantics.md). Five more bind
  clauses of this spec and are cited where they decide something:
  [D18](../decisions/D018-quic-transport.md),
  [D44](../decisions/D044-worker-topology.md),
  [D47](../decisions/D047-viewport-transport-debug-suspended.md),
  [D52](../decisions/D052-engine-era-network-posture.md), and
  [D53](../decisions/D053-releases-compatibility-surface.md) as amended by
  [D56](../decisions/D056-source-first-distribution.md).
- **Normative references:** none

## Goal

Stand the protocol seam up as running software at the first rung that can
carry it. A `protocol/` package holds one schema: a versioned,
checksum-first, length-prefixed frame envelope with explicit version
negotiation against a supported-version whitelist (D15). The
`Session.step(Canonical_Input_Set) -> Tick_Commit` seam is named in code,
wrapped by the three-call worker contract whose signatures land here and
whose lifecycle semantics stay prose until S26. A dependency-arrow rule,
that session and kernel code never imports the network, a wall clock, or
Go-facing code, becomes a tier-scan rule rather than a habit.

The gate is not a unit test over a buffer. It builds and runs two
processes that negotiate a version over localhost and exchange real
frames, then feeds the decoder a hostile-frame corpus and requires every
member rejected clean.

This spec ships no Go code, and that is a scheduling fact rather than a
retreat from D15. What v0 delivers of D15's promise, and where the rest
lands, is stated below under the dual-codec obligation.

## Working software

`just proto-frame-check` green on both CI platforms: a listener binary
and a client binary build, connect over loopback, negotiate a version,
exchange frames carrying the seam's types, and shut down; the
hostile-frame corpus then runs against the decoder and every member is
rejected without an assertion and without an unbounded allocation. The
tier-scan arrow rule passes inside `just check`.

Green here means one codec is exercised from both ends of a socket by two
processes. It does not mean two codecs agree, because there is only one
codec at this rung, and no acceptance wording in this spec may imply
otherwise.

## Decisions in force here

- **D15, the versioned wire protocol, as amended by D49.** Versioned,
  checksum-first, length-prefixed frames; explicit negotiation against a
  whitelist; one schema in `protocol/`. Its two-stage freeze puts the
  envelope and the three-call contract at S26, so everything this spec
  ships is deliberately unfrozen. D49 adds the third reserved
  message-kind range and, in its transport clause, settles this spec's
  transport: editor-worker runs the same length-prefixed protocol over
  the same loopback transport as gateway-worker, one listening discipline
  per Session worker whichever supervisor spawned it.
- **D18, network transport.** Gateway to worker runs the length-prefixed
  protocol over loopback TCP. With D49's amendment that is the only
  worker-facing transport, so v0's echo pair runs over loopback TCP and
  the choice is inherited rather than made here. QUIC terminates at the
  client-facing edge and never reaches a worker.
- **D57, rewind-then-edit semantics.** Every command records the sim tick
  at which it applies, and the tick-stamped command log composes with the
  per-tick `Canonical_Input_Set` stream into one total order, the order
  every replay, restore and resume reconstructs. That order is what
  `Tick_Commit`'s command batch is ordered by, and it is why the batch is
  a sequence rather than a set.
- **D44, worker topology, as amended by D47.** The three calls are the
  Session worker's. A Session worker owns user state and never restarts
  silently; a Job worker is out of scope at this rung entirely. D44's
  supervision mechanics (unanswered-request hang inference, counted crash
  budget, per-request timeouts) and D47's third condition,
  debug-suspended, are the prose obligations #83 places at S26.
- **D52, engine-era networking is trusted-network only.** Every gate in
  this document runs on localhost. The frame checksum is a corruption
  detector, not a tamper seal; cryptographic integrity belongs to the
  edge (D18) and hostile-client hardening is post-engine work. This is
  what lets v0 spend nothing on authenticity while still being obliged to
  survive malformed input, because a slow peer and a corrupt one kill the
  process the same way.
- **D1, determinism by construction.** The arrow rule mechanizes one of
  its clauses: no wall clock reachable from simulation code. The world
  hash `Tick_Commit` carries is the D1 golden, and the protocol tier is
  never a producer of it.
- **D2 and D14, layering.** `protocol/` sits below the Go tier and beside
  the engine, and the arrow points one way into the Session. Nothing in
  this spec touches C, so the D14 tier is untouched.
- **D53, releases and the compatibility surface, as amended by D56.** No
  cross-release promise exists before 1.0, which is exactly what licenses
  an unfrozen v0. D53's hard-reject-on-version-mismatch clause governs
  saves and command logs on disk; the wire's version rule is D15's
  negotiation against a whitelist, and the two must not be conflated: a
  refused save returns a failure to a local caller, a refused version
  ends a negotiation with a stated reason.
- **D38, fresh repository.** The internal prototype's replay and save
  codecs supply a hardening pattern, not a format and not a byte layout.
  D38 is the citation for owing that codebase no continuity. D13 is
  fully superseded by D38 and is never the citation for it, following
  S02a's handling of the same trap.
- **D31, the public/private split.** Nothing in this document names or
  points at any private product, boundary pointers included.

## Scope in

- The `protocol/` package: the v0 frame envelope, its encoder and
  decoder, and the version whitelist, as one schema.
- Version negotiation as an exchange the echo pair performs, with
  membership tested by whitelist lookup and re-tested per frame.
- `Canonical_Input_Set` and `Tick_Commit` named at the seam, with
  `Tick_Commit`'s v0 payload content fixed by #84 and specified below.
- The input-composition rule as part of the seam definition: every
  state-mutating input, edit commands included, reaches a Session only as
  a member of some tick's `Canonical_Input_Set` or as a defined
  between-tick boundary event recorded in `Tick_Commit`, so the
  `Tick_Commit` stream is the total order every replay reconstructs
  (D57).
- The three-call worker contract's signatures in code, exercised by the
  echo pair, with its lifecycle semantics carried as prose obligations
  (#83).
- The two-process echo pair and `just proto-frame-check`.
- The hostile-frame corpus and the seeded fuzz obligation.
- The tier-scan arrow rule.
- A discriminated reject reason on the decoder, sufficient for a corpus
  test to assert which guard tripped. This is not the supervisor-facing
  failure taxonomy, which is S26's (#83); it exists because a corpus that
  cannot distinguish a magic rejection from a checksum rejection cannot
  prove either guard works, which is the property the prototype's
  recompute-the-checksum test technique exists to establish.
- The `proto-conformance` skill at its v0 scope, shared with and extended
  at S26, per the tooling design record at
  [`docs/plans/claude-tooling-design.md`](../plans/claude-tooling-design.md).

## Scope out

- Any Go code, the Go module, and the Go codec. The dual-codec obligation
  below states where they land.
- The split-process render client and its state transfer (S08).
- Worker three-call contract enforcement, supervision tests, the
  message-kind range reservations, and the v1 envelope freeze (S26).
- Replication message kinds (S28, frozen at S29).
- QUIC and the gateway (S27a); the durability log and checkpoint store
  (S27b).
- Epoch fencing, request timeouts, crash budgets, and the
  debug-suspended condition as running mechanism. Their obligations are
  recorded here and become testable at S26.
- The editor's command-log stream as wire traffic (#86), and D49's
  editor and tooling kind range as a reservation (#85).

## The v0 frame

### The envelope, byte-exact

All multi-byte integers are little-endian, and the codec locks that at
compile time so a big-endian target fails to build rather than producing
a quietly different frame. The header is a fixed 16 bytes.

| Offset | Size | Field | Type | Content |
|---|---|---|---|---|
| 0 | 4 | `magic` | `[4]u8` | `SVSW` (0x53 0x56 0x53 0x57) |
| 4 | 4 | `checksum` | `u32` | CRC-32C over bytes 8 through 15 plus the payload |
| 8 | 2 | `version` | `u16` | protocol version, accepted by whitelist membership |
| 10 | 2 | `kind` | `u16` | message kind |
| 12 | 4 | `length` | `u32` | payload byte count, bounded by `MAX_PAYLOAD` |
| 16 | `length` | payload | bytes | kind-specific, schema-defined |

Two properties of that table go past #82's own wording, and both are
rulings in their own right: a maintainer micro-ruling at landing
(2026-07-31) blesses the derivation stated here rather than leaving it as
a drafter's reading. The disposition on #82 lists the fields as magic,
version, kind, length, checksum, and separately requires the checksum to
cover "the header after the checksum field plus payload"; those two
statements are only simultaneously true if the checksum precedes the
version, kind and length fields in the byte image, so the checksum sits
at offset 4, which is the order above. And the magic sits ahead of the
checksum because it is the constant a reader matches to know it is
looking at a frame at all, so it cannot be inside the region the checksum
protects without making the protect-then-identify order circular. Its
value is the four ASCII bytes `SVSW`, fixed by the same ruling.

The checksum is CRC-32C (Castagnoli): polynomial 0x1EDC6F41, reflected
form 0x82F63B78, initial value and final XOR both 0xFFFFFFFF, input and
output reflected. The implementation is verified against the published
check value for the nine-byte ASCII string `123456789` rather than
against this document, because a spec is a worse authority on a standard
constant than the standard is. CRC-32C is chosen for three reasons
recorded on #82: it is hardware-accelerated on both CI targets, it is
small enough to implement twice from its specification when the second
codec arrives, and it is a corruption detector rather than a tamper
seal, which is all D52's trusted-network posture asks of it.

### The header shape is version-independent

The 16-byte header, the field offsets, and the checksum's placement and
coverage are invariant across every protocol version. Only the payload
schema is versioned. This is not a preference: a reader that must know
the version before it can find the version field cannot negotiate, so
some prefix has to stand outside versioning, and this document places the
whole header there. S26 freezes that shape at v1; until then it is the
one part of the protocol that already behaves as though frozen.

### Decode order

The order is the security property, and it is the one place where a step
deliberately trusts an unverified field.

1. Read exactly 16 bytes. Fewer, including a peer that closes mid-header,
   is a truncation rejection.
2. Compare `magic`. A mismatch ends the connection. v0 defines no
   resynchronization: on a reliable ordered stream a misaligned reader is
   a defect, not a recoverable condition.
3. Bound `length` against `MAX_PAYLOAD`, a named schema constant, before
   any allocation. This check runs on a field the checksum has not yet
   vouched for, because the checksum covers the payload and the payload
   cannot be read without trusting the length first. The bound is what
   makes that trust safe: a corrupt length now costs at most one
   `MAX_PAYLOAD` allocation and one failed checksum.
4. Read exactly `length` bytes. A short read is a rejection.
5. Verify the checksum over bytes 8 through 15 plus the payload. A
   mismatch is a rejection, and it happens before any payload parse and
   before the version and kind fields are acted on, since both live
   inside the covered region.
6. Test `version` for whitelist membership. Never a range comparison: a
   `>=` test silently accepts versions nobody built and no corpus covers
   ([`docs/GO_STYLE.md`](../GO_STYLE.md) P2, D15).
7. Dispatch on `kind`, then parse the payload against that kind's schema.
   A well-formed payload of the wrong kind is a rejection, not a
   reinterpretation.

Steps 1 through 7 return failures. None of them asserts
([`docs/ODIN_STYLE.md`](../ODIN_STYLE.md) A8: wire bytes are input).
Every partially built allocation is freed on the failure path.

### Negotiation and the whitelist

The connection opens with the client offering its supported versions and
the listener answering with the single version it selects, or with a
refusal naming the offered set and the supported set. v0's whitelist has
exactly one member, and the negotiation exists anyway, because a
negotiation that first appears when a second version does is a
negotiation nobody has ever run.

Membership is re-tested on every frame rather than latched at the
handshake, so a peer that changes the version field mid-connection is
rejected rather than absorbed.

### Message kinds

The kind field is `u16` and that width is the whole of v0's obligation to
the future (#85). Range allocation is S26's act: D15 as amended by D49
places the reservation of the replication, private-service, and editor
and tooling ranges at the stage 5 walking skeleton, and the reservation
is what protects the frozen v1 envelope.

v0 therefore assigns the small set of kinds its own software needs, with
no range structure and no forward promise. The values below are
provisional in the strict sense: S26 may reassign every one of them when
it carves the ranges, and anything that reads a v0 kind number as
reserved is reading a mistake.

| Kind | Direction | Purpose |
|---|---|---|
| `Version_Offer` | client to listener | the client's supported-version set |
| `Version_Select` | listener to client | the selected version, or a refusal |
| `Worker_Open` | supervisor to worker | open a Session |
| `Worker_Open_Reply` | worker to supervisor | acknowledgement |
| `Worker_Advance_One_Tick` | supervisor to worker | carries a `Canonical_Input_Set` |
| `Tick_Commit` | worker to supervisor | the committed tick's record |
| `Worker_Close` | supervisor to worker | close the Session |
| `Worker_Close_Reply` | worker to supervisor | acknowledgement |
| `Reject` | either | a stated refusal reason |

These nine are v0's whole non-reserved set, fixed by the same landing
ruling rather than left to grow during implementation. What made growth
plausible was an unsettled listener; the echo pair now runs against a
recorded fixture, per the gates section below, so nothing in v0's own
software asks for a kind this table does not list. Provisional still
means what it says one paragraph up: the numbers behind these names are
S26's to reassign.

## The seam

### `Canonical_Input_Set`

Named at the seam, carried as the payload of `Worker_Advance_One_Tick`,
and length-prefixed like every variable-length region in this protocol.
Its field set is not settled here. S08 ports the `engine/input`
three-stage seam with its tests and is the first spec with a real input
stream to put inside it; v0 fixes the type's place in the contract and
its encoding discipline, and leaves its contents to the spec that has
some.

### `Tick_Commit`

The disposition on #84 fixes the content: the tick number, the world
hash, and the tick's full command batch in D57 order.

| Field | Type | Content |
|---|---|---|
| `tick` | `u64` | the committed tick |
| `world_hash` | `u64` | the D1 golden after that tick |
| `command_count` | `u32` | count prefix |
| `commands` | sequence | the tick's applied commands, in D57's total order |

Four properties are normative.

**Order is D57's, and the batch is a sequence.** Nothing that becomes
bytes may be built by iterating a map, on either side of the seam
([`docs/GO_STYLE.md`](../GO_STYLE.md) P5). In Go that rule exists because
map iteration order is randomized per run; in Odin it holds for the same
reason and with the same consequence, which is that the checksum, the
conformance corpus, and the durability log all vary run to run once one
map iteration reaches the encoder.

**The length-prefix discipline is `hash_world`'s.** A fixed-width count
prefix precedes every variable-length region, so the byte stream is
injective and two different command batches cannot serialize to one image
(S02a).

**Resume is checkpoint plus replay.** A `Tick_Commit` stream alone does
not reproduce byte-identical state and is not asked to. Byte-identical
resume is an anchor checkpoint plus replay of the retained commits from
it, which is the same shape S02a's snapshot-then-resimulate pyramid layer
already proves, and the world hash rides in each commit as the per-tick
tripwire that says the replay agreed. Stating this is what stops a later
spec from reading "full command batch" as a claim that the stream is
self-anchoring.

**S08 inherits this rather than deciding it.** S08's own Open questions
field asks what crosses the wire in stage 1 and says the answer should
follow this spec's `Tick_Commit`-content decision. It does: S08's client
wire content is a projection of this payload, and a projection is what it
may narrow, never a parallel format it may invent.

### No command-log slot in v0

The disposition on #86 is that v0's `Tick_Commit` reserves no field for
D57 command-log entries. Two things that sound alike are being separated,
so the distinction is written out.

The `commands` sequence above is the applied command set for one tick,
the per-tick slice of D57's total order, and it is what makes the
input-composition rule wire-visible. What has no v0 slot is the editor's
command-log *stream* as traffic in its own right: the rewind, truncation
and undo navigation D57 defines, which is editor-era territory owned by
the specs D49 gives the editor kind range to. That stream arrives as new
message kinds at S26's freeze, and the `u16` kind field plus versioned
framing leave the door open for it without a speculative field standing
empty until then.

## The three-call worker contract

The disposition on #83 splits this spec's obligation in two: signatures
in code now, lifecycle semantics as prose until S26 makes them testable.

### In code

The three calls land as v0's working interface, exercised end to end by
the echo pair. The Odin spellings are S26's (`Worker_Open`,
`Worker_Advance_One_Tick`, `Worker_Close`); the Go spellings are
`WorkerOpen`, `WorkerAdvanceOneTick`, `WorkerClose`
([`docs/GO_STYLE.md`](../GO_STYLE.md) P3 and S1), and the schema names the
spelling it encodes.

```odin
Worker_Open :: proc(req: Worker_Open_Request) ->
	(Worker_Open_Reply, Protocol_Error)

Worker_Advance_One_Tick :: proc(inputs: Canonical_Input_Set) ->
	(Tick_Commit, Protocol_Error)

Worker_Close :: proc(req: Worker_Close_Request) ->
	(Worker_Close_Reply, Protocol_Error)
```

`Worker_Advance_One_Tick` is the wire form of the
`Session.step(Canonical_Input_Set) -> Tick_Commit` seam this spec's Goal
names. The request and reply types on either side of it exist as named
types with the fields v0's own software needs and no more; only
`Tick_Commit`'s content is fixed by a disposition.

The three calls carry no epoch field at v0. Adding one is a payload
change inside an unfrozen protocol, which is precisely why D15 puts the
freeze at S26 and not here.

### In prose

These are obligations on the design, recorded so S26 implements against a
written contract rather than reconstructing one. None is gated by this
spec.

- **Epochs.** Each worker generation carries an epoch the supervisor
  advances on respawn, and a reply stamped with a prior epoch is dropped
  however well-formed it looks, because a dead worker can still have a
  reply in the socket buffer
  ([`docs/GO_STYLE.md`](../GO_STYLE.md) W3).
- **Gap rejection.** A skipped tick is rejected rather than absorbed. An
  absorbed gap fires its tripwire far from its cause (D6, W3).
- **Timeouts.** Liveness is request timing, so every request carries a
  deadline; D44 infers a hang from an unanswered request rather than a
  heartbeat, and a request without a deadline is never unanswered, only
  pending (W1).
- **Debug-suspended.** D47's third worker condition suspends hang
  inference, timeouts and crash accounting until continue or detach.
  Without it, setting a breakpoint kills the session.
- **Failure taxonomy.** Reject the wire, assert the supervisor's own
  state (E1; ODIN_STYLE A8 on the Odin side). A decoder is never allowed
  to be an invariant whose violation stops the process.
- **The contract is a subset.** The three calls are the
  supervisor-facing subset of the worker's surface, not all of it. The
  editor-facing verbs live in D49's range and never freeze.
- **Session workers only.** D44's Job worker kind has no v0 presence, and
  W2's rule that the kind is named in the type rather than carried as a
  field applies when the second kind exists.

## The arrow rule

The gate this spec adds to S00's tier-scan rule set. The dependency arrow
points one way, from the protocol tier into the Session, and never back.

- No package that a Session's tick loop can reach imports `protocol/`,
  any socket or network package, or any Go-facing code.
- No such package reaches a wall clock (D1).
- `protocol/` may import the sim types it encodes. That is the arrow's
  permitted direction, and it is what keeps one schema rather than two.

The rule is directional and lexical: it is about which package imports
which, which is what tier-scan already checks for D14 and D43. It is not
the broader capability scan S02a proposed and left open, which would
check transitive reachability against an allow-list covering
general-purpose RNG and FMA-sensitive math as well as the clock, and
which S02a assigns to S21's grilling because S21 owns the gate roster.
The two overlap on the wall clock alone. Implementation builds the narrow
directional rule here and does not anticipate the broad one; if S21 later
adopts the capability scan, subsuming this rule is a roster decision
rather than a reopen of this spec.

## The dual-codec obligation

Map #81 recorded this as fog rather than slicing it into a child, and it
is resolved here rather than carried forward, because the canonical text
settles it.

D15 commits `protocol/` to "one schema in `protocol/` with
conformance-tested Odin and Go codecs." That is a statement of the
protocol's end state, not a per-spec schedule. The schedule is elsewhere
and is consistent: S26's row makes the Go module, the codec pair from one
schema source, and the recorded conformance corpus in CI its own Scope
in, and its Working software is `just proto-conformance` green from both
the Odin and the Go sides. S05's Scope out excludes any Go code, and
S08's excludes "Go anywhere." The tooling design record says the same
thing from the third direction: the `proto-conformance` skill is new at
S05 and extended at S26, and D15's freeze is two-stage, v0 here and the
v1 envelope at S26.

So: **v0 delivers the Odin codec, and the Go codec plus dual-side
conformance land at S26.** Not S08, which has no Go in scope either.
`just proto-frame-check` is not a conformance gate and is not named one;
it is a one-codec liveness and hardening gate, and `just
proto-conformance` is the two-codec gate that arrives with the second
codec. The `proto-conformance` skill ships here carrying the rule that
conformance runs from both codecs over one recorded corpus, and that rule
is documented at v0 and unexercisable at v0, which the skill states
rather than implies.

One residue of this is genuinely unsettled and is carried as an open
question below: whether v0's corpus is recorded as language-neutral
on-disk byte files that S26's Go codec can be judged against directly, or
as Odin test literals S26 re-authors. No canonical text answers it, and
the cost of getting it wrong is paid entirely at S26.

## Gates

### `just proto-frame-check`

Builds two binaries and runs them. The listener binds a loopback port,
the client connects, they negotiate, they exchange the seam's frames, and
both exit zero. The recipe then runs the hostile-frame corpus against the
decoder in-process.

**The listener answers from a recorded fixture, not from a Session**
(maintainer micro-ruling at landing, 2026-07-31). The `Tick_Commit`s it
returns are recorded fixture values carrying the payload's real shape: a
tick number, a 64-bit world-hash field, and a count-prefixed command
sequence in D57 order, encoded and decoded by the real codec over a real
socket. What they are not is the output of a running simulation. Pairing
the echo pair with a real S02a Session arrives at S08, the first spec
holding both a Session and a second process to put behind it. The
consequence is stated rather than left to inference: this recipe is a
framing and hardening gate, which is what its name says and the whole of
what this spec claims for it, and it is never a determinism gate wearing
a framing gate's name. The world-hash field is a shape obligation at v0,
not a verified hash.

It joins `just check`'s composition on both CI platforms. It needs no
GPU, no window, and no network beyond loopback (D52), so it is a hosted
runner gate with no carve-out. S21 owns the final roster; this spec adds
one recipe and does not name a second.

The arrow rule runs inside the existing tier-scan, which `just check`
already composes from S00. This spec adds rules to that scan rather than
a recipe of its own for them.

### The hostile-frame corpus

Every member returns a failure, allocates nothing unbounded, and asserts
nothing. The corpus is a superset of the on-disk codec cases S02a already
gates, because a socket adds framing failures a file never had.

Header and envelope cases:

- A header shorter than 16 bytes, including zero bytes.
- Bad magic.
- A `length` above `MAX_PAYLOAD`.
- A `length` below the minimum the dispatched kind can occupy.
- A `length` that disagrees with the bytes actually delivered, in both
  directions.
- A flipped checksum bit.
- A tampered payload with the checksum recomputed over it, so the
  rejection is demonstrably the parse-side validation rather than the
  checksum. This is the prototype's technique ported as pattern: a test
  that tampers without recomputing proves only that the checksum works.
- Trailing bytes inside a frame's declared length that the kind's parse
  does not consume. The cursor must land exactly at the end.

Version cases, which exist to prove membership rather than ordering:

- A version below the whitelisted one.
- A version above it.
- A version inside the numeric span between two whitelisted values, once
  there are two. At v0 the equivalent is any non-member, and the test
  outlives v0 as written.

Kind and payload cases:

- An unknown kind.
- A well-formed payload of one kind delivered under another kind's
  number.
- A zero-length payload for a kind that requires content.

Stream cases, which are new at this rung:

- One frame split arbitrarily across segment boundaries, reassembled
  correctly.
- Two frames delivered in one segment, both parsed.
- A peer that closes mid-frame.

Fuzz: seeded mutation over a recorded seed corpus, so a failure
reproduces from its seed rather than from a lucky rerun. The fuzz leg
runs bounded in CI and unbounded on demand.

### Tier-scan

The arrow rule's rules join the existing scan and are demonstrated
failing, not merely passing, per S00's precedent for every tier rule.

## Obligations on the code

The clauses this spec is judged against, named because a protocol codec
is where each one is most load-bearing.

From [`docs/ODIN_STYLE.md`](../ODIN_STYLE.md):

- **A8, assert engine invariants and reject input.** Wire bytes are
  input. Every decoder path returns a failure; none asserts.
- **A5, compile-time assertions.** The header struct carries `#assert` on
  `size_of` and on the offset of every field, and the package asserts
  little-endian. A target that would emit a different frame must fail to
  compile rather than emit it.
- **T1, explicit widths where the width is meaning.** Every wire field
  declares its width. There is no `int` in a frame.
- **A3, assert the positive and the negative space.** Each guard in the
  decode order has a corpus member that trips it and one that passes it.
- **F1, the 70-line ceiling.** A kind dispatch that outgrows it splits.

From [`docs/GO_STYLE.md`](../GO_STYLE.md), which binds no code this spec
writes and constrains every decision it takes, because a v0 shape that
makes a conformant Go codec impossible is a defect discovered at S26:

- **P1, bound a declared length before allocating from it.** The
  `MAX_PAYLOAD` constant exists in the schema for this reason, and step 3
  of the decode order is this rule.
- **P2, a version is accepted by whitelist membership.** Never a range
  comparison, re-checked per frame.
- **P4, one schema, two codecs, one corpus.** v0 has the schema and one
  codec. Nothing here may make the second codec a second schema.
- **P5, nothing that becomes bytes iterates a map.** The `Tick_Commit`
  command batch is a sequence in D57 order for this reason.
- **B1 and B2, Go never simulates and the schema is the only seam.**
  The arrow rule is this spec's half of that boundary.
- **S1, the glossary decides identifiers.** Session, Session worker,
  Gateway, and Tick carry their
  [`docs/context/CONTEXT.md`](../context/CONTEXT.md) senses and their
  barred aliases stay barred. `Checkpoint` bare is barred outright, which
  matters here because the resume story names one.

## Grilling dispositions

Settled on the children of wayfinder map #81, all closed. Each is
normative here.

| # | Disposition |
|---|---|
| #82 | The v0 header is magic (4 bytes), CRC-32C (u32), version (u16), kind (u16), payload length (u32, hard-bounded); the checksum covers the header after itself plus the payload and is verified before any parse. It is a corruption detector, not a tamper seal (D18, D52). |
| #83 | The three calls' signatures land in code as v0's working interface; lifecycle semantics (epochs, failure taxonomy, timeouts, debug-suspended) stay prose until S26's supervisor makes them testable. |
| #84 | `Tick_Commit` carries the tick, the world hash, and the tick's full command batch in D57 order. Byte-identical resume is checkpoint plus replay; the hash is the per-tick tripwire; S08's wire content is a projection of this payload. |
| #85 | Message-kind range allocation is deferred to S26. v0's only obligation is the `u16` kind width, which leaves all three ranges unforeclosed. |
| #86 | No slot for D57 command-log entries in v0. The editor's command-log stream arrives as new message kinds at S26's freeze. |

## Implementation order

Suggested, not binding; `/to-tickets` owns the breakdown.

1. The `protocol/` package skeleton: the header struct with its
   `#assert` set and the endianness lock, and CRC-32C verified against
   the published check value.
2. Header encode and decode alone, in the decode order above, with the
   header and envelope half of the hostile corpus. The corpus grows with
   the code rather than after it.
3. The version whitelist and the negotiation exchange, with the version
   cases.
4. The seam types: `Canonical_Input_Set`, `Tick_Commit`, and the three
   call signatures with their request and reply types.
5. `Tick_Commit` encode and decode with the count-prefix discipline, and
   the kind and payload cases.
6. The two binaries and `just proto-frame-check`, including the stream
   cases, which only exist once there is a socket.
7. The seeded fuzz leg over the recorded seed corpus.
8. The tier-scan arrow rule with its deliberate-failure demonstrations.
9. The `proto-conformance` skill at v0 scope.

Step 2 before step 6 is the one ordering constraint that is not merely
convenient: a decoder hardened after two processes are already talking
gets hardened against the frames those processes happen to send, which is
the opposite of a hostile corpus.

## Exit checklist

- [ ] `just proto-frame-check` green on `macos-26` and `ubuntu-24.04`,
      composed into `just check`.
- [ ] The listener and client are two processes, demonstrated by their
      process ids appearing in the recipe's output, and they negotiate
      before exchanging any other kind.
- [ ] The header struct's `#assert` set covers `size_of` and every field
      offset, demonstrated by adding a field and observing the build
      fail.
- [ ] CRC-32C matches the published check value for `123456789`.
- [ ] Every hostile-corpus member returns a failure, asserts nothing, and
      leaks nothing, verified under the leak gate.
- [ ] The tampered-payload-with-recomputed-checksum case is rejected by
      the parse-side validation, demonstrably not by the checksum.
- [ ] A `length` above `MAX_PAYLOAD` is rejected before any allocation,
      demonstrated by observing no allocation on that path.
- [ ] The version guard is demonstrated to reject a non-member that a
      `>=` comparison would have accepted.
- [ ] A frame split across two segments parses, and two frames in one
      segment both parse.
- [ ] The fuzz leg runs seeded, and a deliberately introduced decoder
      defect is caught and reproduced from its recorded seed.
- [ ] Tier-scan fails a deliberate `protocol/` import from a package the
      tick loop reaches, and a deliberate wall-clock import from the
      same.
- [ ] The three call signatures exist, are exercised by the echo pair,
      and carry no epoch field.
- [ ] `Tick_Commit` carries tick, world hash, and a count-prefixed
      command sequence, and no encoder path in `protocol/` iterates a
      map.
- [ ] The `proto-conformance` skill lands at v0 scope and states plainly
      that its both-codecs rule is documented and unexercisable until
      S26.
- [ ] Nothing in `protocol/` is marked frozen, and the document trail
      says the freeze is S26's.

Reaching **implemented** is the maintainer's call once this checklist is
clear and the gate is green.

## Course

Module S05; path tag engine. Teaches versioned wire-frame design and
hostile-input hardening against the two-process echo pair. Authored after
**implemented**, per D27.

## Prototype ports

The replay and save wire-format hardening pattern: checksum first, bound
lengths, fail clean. What ports is the posture, not a layout and not a
constant. The prototype's codecs put an eight-byte XXH3 checksum at the
tail of an on-disk image the reader holds entire; a frame read off a
socket cannot be held entire before its length is trusted, which is why
v0's checksum moves into the header and why the bound-then-read-then-verify
order exists at all. Ports are test-first from a source to read, never a
target to converge with (D38).

## Open questions

All five questions charted as wayfinder map #81 are settled on its child
issues, which hold the reasoning behind every disposition above. Five
items are recorded open, each with the owner its answer belongs to.

- **`MAX_PAYLOAD`'s value.** The bound is mandatory and named; its number
  is not settled, because the largest `Tick_Commit` v0 can produce
  depends on a command batch no spec has populated yet. The constraint
  recorded here is that it is a schema constant read by every codec,
  never a per-call parameter, and that it is chosen and written down
  during implementation rather than deferred to another spec.
- **`Canonical_Input_Set`'s v0 field set.** S08 ports the `engine/input`
  seam and is the first spec with a real input stream; the type is named
  here and populated there.
- **Corpus form and continuity.** Whether the hostile corpus and the
  recorded seed corpus are language-neutral on-disk byte files, which
  S26's Go codec could be judged against directly, or Odin test literals
  S26 re-authors. S26 owns the recorded conformance corpus and pays the
  cost either way; recording the decision here would be cheaper than
  discovering it there.
- **The wall-clock overlap.** This spec's directional arrow rule and the
  broader sim-import capability scan S02a proposed both cover the clock.
  S21 owns the gate roster and therefore owns whether the broad scan is
  adopted and whether it subsumes this rule.
- **Where v0's kind numbers go at S26.** The values are provisional and
  S26 may reassign them when it carves the ranges. Whether S26 does
  reassign them, or keeps them by placing v0's set inside one range, is
  S26's call, and nothing in v0 may be built as though the answer were
  already known.

Four further points where this document went past its map were settled by
maintainer micro-ruling at landing (2026-07-31) and live in the normative
text above rather than here: the checksum's placement at offset 4, the
magic's `SVSW` value, the nine names as v0's whole non-reserved kind set,
and the echo pair's listener answering from a recorded fixture.
