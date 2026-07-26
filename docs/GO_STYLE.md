# Go Style Guide

The engineering standard for Go code in this repository: `server/`, the Go
half of `protocol/`, and `tools/`. Adapted from
[Effective Go](https://go.dev/doc/effective_go), the
[Go Code Review Comments](https://go.dev/wiki/CodeReviewComments), the
[Google Go Style Guide](https://google.github.io/styleguide/go/decisions)
and the [Uber Go Style Guide](https://github.com/uber-go/guide). Design
goals, in order: safety, clarity, operability. Clarity outranks performance
because this tier sits outside the world hash (D1) and outside the declared
security boundary (D52), and its work is supervising processes that fail.

Review enforces every rule here. Each states the failure it prevents, so
it can be applied without a checker; where a decision settled the rule,
the citation carries the reasoning.

## 1. The boundary

### B1. Go never simulates

No Go package computes a world hash, a component update, an entity query or
a tick advance. D6 makes the Odin sim the single world truth and enumerates
the Go services exhaustively, and D1 enforces determinism through golden
hashes over one implementation, so the same logic rewritten in a language
with different float semantics diverges the CI legs by construction. Go
compares hashes the worker produced, keeps checkpoint blobs opaque, and
forwards replication deltas rather than applying them (D6).

### B2. The schema in `protocol/` is the only seam

No cgo, no shared memory, no in-process embedding, no package under
`server/` importing `engine/`: D15 rejected cgo because it forfeits the
process isolation that epoch-fenced supervision needs a killable unit for,
couples toolchains, and creates an unversioned ABI seam. An input the
gateway raises for a client crosses it like any other, as a
`CanonicalInputSet` member recorded in the `TickCommit` log, because a
side channel into a Session breaks the replay desync forensics
reconstruct (D57).

## 2. The protocol

### P1. Bound a declared length before allocating from it

The envelope is versioned, checksum-first, length-prefixed (D15), and the
order is the point: the checksum catches a corrupt length before anything
trusts it as a size. A length prefix with no declared maximum is an
allocation primitive for whoever holds the socket, and D52's trusted-network
posture does not save it, since a slow peer and a hostile one kill the
process the same way.

```go
// GOOD: the declared length loses to the schema maximum first, and
// a short read is an error rather than a half-filled buffer.
if hdr.Length > protocol.MaxPayload {
	return ErrFrameTooLarge
}
buf := make([]byte, hdr.Length)
if _, err := io.ReadFull(r, buf); err != nil {
	return fmt.Errorf("read payload: %w", err)
}

// BAD: four bytes off the wire size the allocation; one frame ends
// the gateway process and every session it routes.
buf := make([]byte, hdr.Length)
r.Read(buf)
```

### P2. A version is accepted by whitelist membership

D15 fixes explicit negotiation against a supported-version whitelist. Never
`if v >= minVersion`: a range comparison silently accepts versions nobody
built and no corpus covers. Membership is re-checked per frame.

### P3. The v1 envelope is frozen and every kind keeps to its range

Once the envelope freezes at v1, framing, checksums, negotiation, the
whitelist and the three calls (`WorkerOpen`, `WorkerAdvanceOneTick`,
`WorkerClose`) are frozen: resizing or renaming a field is a request the
maintainer answers in `docs/decisions/`, not a code review. Kinds come
from the reserved replication, editor and private ranges rather than the
next free number, because D44's one binary parses both vocabularies from
one dispatch table and D49 makes the reservation what protects the
envelope. The freezes do not generalize: replication kinds freeze at the
co-op exit and editor kinds never (D49), and those unfrozen editor verbs
are why the three calls are the supervisor-facing subset of the worker's
surface rather than all of it.

### P4. One schema, two codecs, one corpus

Both codecs are audited against one schema in `protocol/` and exercised
over one recorded corpus, and a change validated on one side only is a
defect rather than progress. D25 gives the monorepo that rationale, so a
Go-only diff touching codec code is a review stop.

### P5. Nothing that becomes bytes iterates a map

Go randomizes map iteration order per run, so an encoder, a checksum input
or a `TickCommit` record built by ranging a map emits different bytes every
run, reddening conformance against the Odin codec and breaking replay of the
durability log.

```go
// GOOD: sorted key order, so both codecs emit one byte image.
for _, k := range slices.Sorted(maps.Keys(chunks)) {
	enc.chunk(k, chunks[k])
}

// BAD: order varies per run, the checksum varies with it, and the
// Go side alone goes red.
for k, v := range chunks {
	enc.chunk(k, v)
}
```

Wire structs use explicit widths (`uint32`, `int64`), never `int` or `uint`,
and a narrowing conversion is range-checked first: a length validated as
`int64` and truncated to `int32` returns negative and walks past the check
it just passed. This is ODIN_STYLE T1 from the other side of the bytes.

## 3. Workers and lifetimes

D44's supervision mechanics are heuristics, and a heuristic holds only if
the code keeps it true.

### W1. Liveness is request timing, so every request carries a deadline

D44 infers a hang from an unanswered request rather than a heartbeat, since
a worker answers pings while wedged on the request the user waits for. A
request with no deadline is never unanswered, only pending, so one missing
deadline blinds the detector for that path; `ctx context.Context` is the
first parameter of anything that forwards a request and never a struct
field. D47 adds the third condition: debug-suspended halts hang inference,
timeouts and crash accounting until continue or detach, or setting a
breakpoint kills the session. A protocol request missing its `ctx` is a
review catch.

### W2. Name the worker kind in the type

`SessionWorker` and `JobWorker` are distinct types with distinct
supervisors, not one type with a kind field and a branch. D44 splits them by
state ownership into opposite failure semantics: a Session worker crash
surfaces and waits, because discarding unsaved work to be helpful is worse
than stopping, while a Job worker in its bounded pool is killed and
restarted freely.

### W3. A stale epoch and a skipped tick are rejected, never absorbed

Each worker generation carries an epoch the supervisor advances by CAS on
respawn, and a reply stamped with a prior epoch is dropped however
well-formed it looks: a dead worker can still have a reply in the socket
buffer, and applying it after the replacement advanced state is the silent
corruption D1's hash regime exists to make loud. An absorbed tick gap is the
same failure on the other axis, its tripwire firing far from the cause
(D6).

### W4. Every goroutine has an owner and a way to stop

At the point of writing `go f()`, name who owns it, what makes it exit, and
who waits for that exit; missing any of the three, it is not ready. An
unowned goroutine writes to the outbox after the Session worker it served is
gone and charges its crashes to a supervisor that no longer exists. Each
long-lived component exposes one lifecycle method that signals its
goroutines and blocks until they exit.

## 4. Limits

### L1. Every queue, pool and retry loop declares its bound

No unbounded worker queue, no unbounded in-flight request map, no goroutine
per inbound message: the cap is a named constant, and the code rejects,
sheds or blocks at it rather than growing. D44 makes crash handling a
counted budget over a window rather than an unbounded retry, so backoff
carries a ceiling and the loop ends in a state that surfaces the failure.
D52 defers hostile-client hardening, not this discipline: an unbounded
queue still fails under a slow worker, it just fails as an out-of-memory
kill instead of a rejection.

## 5. Errors and panics

### E1. Reject the wire, assert the supervisor's own state

A frame off a socket, an unreachable worker, a failed write, a rejected
version and a timeout are operating errors, returned as `error` values and
handled; a violated internal invariant, an epoch that went backwards, a
decoded length disagreeing with its buffer, is a programmer error. This is
ODIN_STYLE A8 with the wire frame standing where script input stands, plus
one qualification the Odin canon does not need: no Go code runs inside a
worker (B1), so every Go panic is a supervisor-side panic, and one in the
gateway takes every session it routes with it. Confine the invariants
allowed to stop the process to
state whose corruption makes continuing worse than stopping, never let a
decoder be one of them (P1), and keep `os.Exit` and `log.Fatal` in `main`,
since they skip the defers that flush the durability log. `recover` never
turns a programmer error into a returned error; the one defensible use logs
and closes a single connection. Odin's assertion density has no Go analogue
and no linter for it; ODIN_STYLE A1 does not cross.

### E2. Inspect by `errors.Is` and `errors.As`, and wrap deliberately

Never `err == ErrX`, never a string match on `err.Error()`: `==` breaks the
moment a layer adds context, and it breaks silently, so the result is a
misrouted request rather than a crash. Whether to wrap is an API decision.
`%w` promises callers forever that the wrapped error is findable, which is
right for a protocol sentinel and wrong for a storage error leaking out of
the durability log; `%v` seals it.

### E3. An error names the worker, the kind, the epoch and the tick

Desync forensics reproduce a divergence to its first divergent tick from
the `TickCommit` log plus checkpoints, and D44 fixes the worker-kind and
epoch vocabulary that names them, so an error reading
"worker failed" spends a bisect a well-formed error would have skipped.
Handle an error once, logging it or returning it and never both: N lines per
failure at N stack levels is the volume that takes out the log sink during
the storm those lines were meant to explain.

## 6. Function shape

### F1. No line limit; one function, one job

ODIN_STYLE F1's 70-line ceiling does not cross, and the difference is
deliberate rather than an oversight: Go's error handling inflates line
counts honestly, and a codec's switch over message kinds and a supervisor's
select loop have shapes an Odin procedure does not. The intent crosses. A
function does one thing, the error path is indented and the happy path is
not, and one that needs a second screen to state its job gets split.

## 7. Style

### S1. The glossary decides identifiers

`docs/context/CONTEXT.md` fixes the vocabulary and bars the aliases: never
`server` bare for the Gateway, never `worker` bare where the failure
semantics differ (W2), never `instance` or `match` for a Session.
`Checkpoint` alone is barred outright, because the spec index's human
checkpoint, D6's per-chunk hash checkpoint and the durability tier's
checkpoint store are three unrelated things and a type named for one reads
as another.
Go identifiers otherwise take MixedCaps, so the schema's `Tick_Commit` is
`TickCommit` in Go and the doc comment names the spelling it encodes.

### S2. gofmt is the whole formatting rule

All Go source is gofmt-formatted, with `goimports` grouping imports.
There is no house formatting opinion and no line-length limit; disliking
the output is a reason to change the names or the structure, never the
whitespace, so formatting stops being a review topic.

---

Gateway, durability and replication rules grow here as those services
take shape; the protocol rules bind any codec speaking the D15 envelope.
Tool versions, linters, gates and module configuration belong to the
toolchain records, not to this file.
