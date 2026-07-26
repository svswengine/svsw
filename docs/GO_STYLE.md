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

No Go code exists here yet, so no rule earned its place in a working
codebase: each derives from a settled decision, and none authorizes Go
before S26 reaches "spec written" in `docs/specs/README.md`. Review enforces
all of them; the toolchain rules (G1, G2, G3) run by machine once the S00
bootstrap lands, and P1, P2, P3, P4, W1, W3 and L1 end behind gates that
arrive with S05, S26 and S27a.

## 1. The boundary

### B1. Go never simulates

No Go package computes a world hash, a component update, an entity query or
a tick advance. D6 makes the Odin sim the single world truth and enumerates
the Go services exhaustively, and D1 enforces determinism through golden
hashes over one implementation, so the same logic rewritten in a language
with different float semantics diverges the CI legs by construction. Go
compares hashes the worker produced, keeps checkpoint blobs opaque (S27b),
and forwards replication deltas rather than applying them (S28).

### B2. The schema in `protocol/` is the only seam

No cgo, no shared memory, no in-process embedding, no package under
`server/` importing `engine/`: D15 rejected cgo because it forfeits the
process isolation that epoch-fenced supervision needs a killable unit for,
couples toolchains, and creates an unversioned ABI seam. An input the
gateway raises for a client crosses it like any other, as a
`Canonical_Input_Set` member recorded in `Tick_Commit`, because a side
channel into a Session breaks the replay S29b reconstructs.

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

S05 records the hostile-frame corpus behind `just proto-frame-check`, which
S05 scopes to Odin; the Go half meets that corpus at S26 under `just
proto-conformance`.

### P2. A version is accepted by whitelist membership

D15 fixes explicit negotiation against a supported-version whitelist. Never
`if v >= minVersion`: a range comparison silently accepts versions nobody
built and no corpus covers. Membership is re-checked per frame. S26 carries
S05's unsupported-version leg to the Go codec and gates it there.

### P3. The v1 envelope is frozen and every kind keeps to its range

After S26 greens, framing, checksums, negotiation, the whitelist and the
three calls (`Worker_Open`, `Worker_Advance_One_Tick`, `Worker_Close`) are
frozen: resizing or renaming a field is a request the maintainer answers in
`docs/decisions/`, not a code review. Kinds come from the reserved
replication, editor and private ranges rather than the next free number,
because D44's one binary parses both vocabularies from one dispatch table
and D49 makes the reservation what protects the envelope. The freezes do not
generalize: replication kinds freeze at S29, editor kinds never, and those
unfrozen editor verbs are why the three calls are the supervisor-facing
subset of the worker's surface rather than all of it (S22c).

### P4. One schema, two codecs, one corpus

Both codecs are audited against one schema in `protocol/` and exercised over
one recorded corpus, and a change green on one side is red rather than
partial. D25 gives the monorepo that rationale, so a Go-only diff touching
codec code is a review stop. `just proto-conformance` (S26) is the gate.

### P5. Nothing that becomes bytes iterates a map

Go randomizes map iteration order per run, so an encoder, a checksum input
or a `Tick_Commit` record built by ranging a map emits different bytes every
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
breakpoint kills the session. `containedctx` catches the struct-field shape
and `noctx` covers only the net/http and database/sql call sites, so a
protocol request missing its `ctx` is a review catch; S26 gates the
suspended condition.

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
same failure on the other axis, its tripwire firing far from the cause (D6).
S26's epoch-fence, gap-rejection and idempotent-retry legs gate this.

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
D52 defers hostile-client gate legs, not this discipline: an unbounded queue
still fails under a slow worker, it just fails as an out-of-memory kill
instead of a rejection. S26's retry test gates the counting; the queue
bounds are review.

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
the durability log; `%v` seals it. `errorlint` gates the mechanics.

### E3. An error names the worker, the kind, the epoch and the tick

S29b reproduces a desync to its first divergent tick from a `Tick_Commit`
log plus checkpoints and D44 fixes the worker-kind and epoch vocabulary
that names them, so an error reading
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

## 7. Toolchain and gates

### G1. The module path is under `github.com/svswengine`

D26 settles the org and the module path, and D16's rebrand shrank to
residual sweeps because of it: the path is final, not a placeholder awaiting
a rename. A one-line `go.mod` check is a cheap gate for S26.

### G2. gofmt is the whole formatting rule

All Go source is gofmt-formatted through the PostToolUse hook, with
`goimports` grouping imports where present. There is no house formatting
opinion and no line-length limit; disliking the output is a reason to change
the names or the structure, never the whitespace, so formatting stops being
a review topic. `go test` runs only a high-confidence vet subset, so
`copylocks`, `lostcancel` and `testinggoroutine` reach the code through a
separate `go vet ./...` step in the gate rather than by riding along, and
the test command is `go test -race`, because a data race on shared
supervisor state stays silent until the detector names it.

### G3. golangci-lint is the one lint entry point, and its cache lies

golangci-lint is installed as a prebuilt binary at a pinned version rather
than built through `go install`, so the linter's own dependency graph never
enters the module graph and every worktree lints at one version. D45
allow-lists `go install`, so this is a reproducibility rule and not a
permissions one. The trap: after a worktree
is removed or created, run `golangci-lint cache clean` before believing a
red lint, or the red being chased belongs to no source file. That is the one
sanctioned retry for a red gate. `wrapcheck` and `err113` stay disabled,
since they contradict E2 and a linter routinely suppressed teaches
suppression.

### G4. Verification runs through named `just` recipes

A change is verified by the gate its spec names rather than an ad-hoc
`go test`: `just proto-frame-check` (S05), `just proto-conformance` (S26),
the gateway smoke (S27a), the durability smoke (S27b), `just coop-smoke`
(S29) and the attach-and-replay gate (S29b). The per-spec "Working software"
field in `docs/specs/README.md` defines each green condition. Recipes
capture exit codes explicitly instead of piping, because a piped gate
reports the last command's status and greens on a failure.

## 8. Style

### S1. The glossary decides identifiers

`docs/context/CONTEXT.md` fixes the vocabulary and bars the aliases: never
`server` bare for the Gateway, never `worker` bare where the failure
semantics differ (W2), never `instance` or `match` for a Session.
`Checkpoint` alone is barred outright, because the spec index's human
checkpoint, D6's per-chunk hash checkpoint and S27b's durable checkpoint
store are three unrelated things and a type named for one reads as another.
Go identifiers otherwise take MixedCaps, so the schema's `Tick_Commit` is
`TickCommit` in Go and the doc comment names the spelling it encodes.

---

Gateway, durability and replication rules arrive with S27a, S27b and S28;
the protocol rules here bind any codec that reaches the D15 conformance
corpus. Tool versions, the linter roster and module conventions belong to
`server/CLAUDE.md` and the justfile recipes, which this file names and does
not restate.
