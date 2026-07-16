# Engine extensibility loop: editor-survives-engine-rebuild

> **Decision outcome (2026-07-14):** the maintainer adopted this document's
> recommended shape: the process-restart loop, S22 amended to sit atop the
> S08 split with the crash-only restart as an allowed first milestone inside
> the new S22b spec, reject-and-replay restore, and the dev-diverged
> cross-build hash forensics model. See ROADMAP.md D86.

## Directive

The maintainer wants to know how the editor survives a rebuild of the
underlying Odin engine — can an engine developer edit engine code, rebuild,
and keep the editor session (or reconstruct it fast) instead of losing
everything and starting cold. This document maps what the svsw3D corpus
already provides toward that loop, names the gaps, and lays out the options.

All citations below marked `README.md` or `ROADMAP.md` refer to
`/Users/ivandrenjanin/projects/svswengine/svsw/docs/specs/README.md` and
`/Users/ivandrenjanin/projects/carbon/research/ROADMAP.md` respectively; the
svsw3D corpus is a separate project from this session's working directory
(the 2D Odin engine at `/Users/ivandrenjanin/projects/svsw`).

## What the architecture already provides, spec by spec

**S08 — process split.** A headless sim process and a render client talk
over `protocol/` on localhost, framed as "the normal dev topology," with
hash-checkpointed agreement verified by `just split-smoke`
(README.md:751-772). This is the one place in the corpus where the engine
and its client are already separate OS processes — the seam the dev loop
needs, if the editor sits on top of it.

**S27b — restart and restore machinery.** Durable `Tick_Commit` log, the
`engine/save` snapshot codec as checkpoint format, `engine/replay` for
desync forensics, an idempotent outbox, and kill/respawn/resume with no hash
divergence, verified by a connected headless client. This is exactly the
restart-and-restore capability the dev loop needs — but it is scoped
entirely to the stage-5 Go supervisor for multiplayer durability, not to an
editor.

**D71 — editor command stream.** Every editor edit is a typed command on a
replayable command log; undo/redo and the roundtrip gate are already
command-log replay (ROADMAP.md:939-946). Editor-side state is reconstructible
by design, independent of the engine-rebuild question.

**S02a — early port of save/replay.** `engine/save` and `engine/replay` are
ported in stage 0, ahead of their originally-stage-5 consumer, specifically
because the determinism pyramid's snapshot-resim tests need them
(README.md:498-509). The codecs already exist well before any dev-loop
consumer does.

**Determinism as the enabling property.** D11-style determinism means sim
state is a pure function of `(seed, initial conditions, input/command
stream)`. That is what makes "kill the process and replay" a viable
state-preservation strategy at all — the deterministic-replay literature
confirms replaying recorded inputs against a restarted build substitutes for
a persisted save (https://zylinski.se/posts/hot-reload-gameplay-code/,
https://gafferongames.com/post/deterministic_lockstep/).

**S05/S26 — versioned protocol envelope.** A versioned envelope with
negotiation, a supported-version whitelist, and a hostile-frame corpus
already exists for the Go-worker boundary. This is the exact reconnect-skew
defense a dev loop needs, already built, just for a different pair of
endpoints.

## Gaps

- **Topology.** S22 defines the editor as a single privileged SDK-tier Odin
  binary; its dependencies are S16 and S21, which skip S08 entirely
  (README.md:1308; Overview table lines 171 vs 155). Play-in-editor boots
  "a real deterministic Session" in-process (README.md:1288-1291). As
  specified, editing engine Odin code means rebuilding and restarting the
  whole editor — there is no process boundary to keep the editor alive
  across.
- **Rebuild orchestration.** No spec, recipe, or mechanism anywhere triggers
  an engine rebuild from the editor. The only hit in the corpus is the M00
  mockup's static reload-semantics chip — "Odin requires an engine rebuild
  (S02a)" — which is prototype chrome with no owning spec behind it
  (design/editor-mockup.md:114-117). There is no watch/relink flow, no
  dylib mechanism, no `just` recipe for it.
- **Reconnect protocol skew.** The version-negotiation and whitelist
  machinery (S05, frozen at v1 by S26) exists solely for the Go-worker wire.
  No versioned handshake exists for an editor reconnecting to a rebuilt
  worker, because no such connection exists in the architecture as
  specified.
- **Schema-changed state migration.** S02a explicitly leaves save/replay
  schema versioning open — "hard-reject-on-bump or start the
  versioned-reader story." An engine edit that changes ECS component layout
  is exactly the first thing this dev loop hits: the pre-rebuild checkpoint
  may be unreadable by the post-rebuild worker.
- **Cross-build hash semantics.** D72 parity compares headless and windowed
  runs of one build; nothing defines whether a hash change across a rebuild
  is expected divergence or golden drift. Without an intentional-divergence
  mode distinct from the golden gate, every legitimate sim-code change reads
  as a determinism failure.
- **Threading/swap authorization.** D70 mandates a single-threaded
  deterministic sim per Session, with no engine-swap or hot-reload thread
  authorized outside the decision log. Any in-process swap mechanism needs a
  decision-log entry, not just code.
- **Durability sequencing.** S27b, the restore machinery, is gated behind
  stage 5. The editor (S22, roughly stage 4) would need engine/save and
  replay checkpointing pulled forward for dev-loop use. S02a already ported
  the codecs in stage 0, so the pieces exist, but no spec authorizes the
  dev-loop consumer to use them.

## Options

| Option | Verdict |
|---|---|
| Process-restart loop: editor as client, worker rebuilt/killed/respawned, state restored from checkpoint + command-log replay | **Recommended** — the architecture-native path |
| Odin dylib hot swap inside one process, whole engine | Reject as the primary mechanism |
| Staged: process-restart now, dylib swap later scoped only to the render-client/presentation side | Acceptable end-state, wrong first step |
| Crash-only whole-editor restart with durable auto-restore | Viable first increment, if the S22 topology amendment is deferred |

**Process-restart loop.** Amend S22 so play-in-editor lives in an
S08-topology worker process instead of in-process (add S08 to S22's
dependency list), then compose existing machinery: the editor triggers an
`odin build` of the worker; on success it kills and respawns the worker,
S27b's shape minus the Go supervisor (the editor is the supervisor in dev);
it restores state by loading the last compatible checkpoint and replaying
the command/`Tick_Commit` suffix; it reconnects through the S05/S26
envelope with version negotiation, so a protocol-shape change fails loud
instead of corrupting state. This sidesteps every ABI, pointer-stability,
and allocator hazard of in-process swapping. The survey literature is
explicit that process separation plus deterministic replay "sidesteps ABI
drift and pointer-stability problems entirely at the cost of replay time"
(https://gafferongames.com/post/deterministic_lockstep/), and Bevy's
`dexterous_developer` tooling makes the same tradeoff, favoring fast-rebuild
plus state round-trip over dylib swap
(https://github.com/lee-orr/dexterous_developer). Iteration latency is Odin
build time plus replay time; Odin compiles fast and checkpoints bound the
replay suffix. This requires a new spec — the dev-loop spec the corpus
implies is missing, sitting between S02a, S08, S22, and S27b — covering
rebuild orchestration, the reconnect handshake, restore policy, and
divergence semantics. It also forces S02a's open versioning question to a
first answer.

**Dylib hot swap.** The template pattern — a persistent host, a reloadable
dylib holding only behavior, pointer-stable game memory, a re-entry hook
(https://github.com/karl-zylinski/odin-raylib-hot-reload-game-template,
https://zylinski.se/posts/hot-reload-gameplay-code/) — delivers sub-second
iteration, but its discipline requirements are exactly what svsw3D's engine
core violates by existing. Function pointers stored in persisted state
dangle once the old dylib unloads; the ECS/system tables and Lua-binding
registrations are full of them. There is no ABI stability across rebuilds —
reordering a struct field silently corrupts with zero compile-time signal
(https://kampffrosch94.github.io/posts/hotreloading_rust/), and schema-laid-
out native storage is the maximal exposure to that hazard. Allocator
identity and the Odin `context` must be reconstructed across the boundary.
Most fundamentally: after an in-place swap, world state is whatever the
mutation history under old code left in memory, mutated onward by new code
— a state no clean run of the new build can reproduce, making world hashes
unverifiable for the rest of the session. An engine whose core guarantee is
"state is a pure function of inputs" should not adopt a dev loop whose
defining property is state that is a function of edit history. It is also
unauthorized under D70 without a decision-log entry. Even Unreal's mature
Live Coding still requires a full editor restart for header or constructor
changes (https://unrealcommunity.wiki/live-compiling-in-unreal-projects-tp14jcgs)
— schema changes force the restart path regardless.

**Staged: restart now, render-side swap later.** Once S22 sits atop the S08
split, the render client becomes a legitimate dylib-swap candidate:
presentation code never touches sim state or hashes, which is D72's whole
premise, so swapping it in place cannot corrupt determinism. This mirrors
The Machinery's reloadable-plugin scoping and Veloren's bounded-subsystem
reload (https://ourmachinery.com/product.html,
https://gamedev.rs/news/042/). Sim and schema changes always take the
restart path regardless. This is an optimization to add only if measured
restart latency actually hurts after the process-restart loop ships;
building both loops up front is speculative complexity, and the
render-side swap still needs its own D70-adjacent decision-log entry and
host/library compiler-flag discipline.

**Crash-only whole-editor restart.** Keeps S22's single-binary architecture
untouched: the editor rebuilds itself (engine statically linked), restarts
the whole process, and on boot auto-restores editor state from the D71
command log and Session state from checkpoint plus replay — the same
restore machinery as the process-restart loop, minus the process split.
This is analogous to Unity's domain reload as the correctness-default
(https://docs.unity3d.com/6000.0/Documentation/Manual/domain-reloading.html),
made cheap here by determinism. It loses editor UI continuity (windows and
panels flash through a restart) and pays full editor link time per
iteration. It gains the smallest possible diff to the spec corpus: no new
process boundary, no reconnect protocol. Worth having on the table as
milestone 1 of the dev-loop spec, with the process-restart loop as milestone
2; the restore machinery built for this variant is entirely reused by the
split version.

## Recommendation

Adopt the process-restart loop as the specified mechanism, optionally
sequenced through the crash-only variant as its first milestone, and defer
any dylib swapping to a render-client-only follow-up justified by measured
latency.

Concretely: write the missing dev-loop spec, working name S22b, "engine dev
loop: rebuild, respawn, restore," owning:

1. Rebuild orchestration — a `just` recipe the editor shells out to, plus
   failure surfacing in the editor.
2. The editor-worker reconnect handshake, reusing the S05/S26 envelope and
   version whitelist.
3. Restore policy — checkpoint plus command-log-suffix replay, with S02a's
   versioning question answered for the dev loop as "hard-reject stale
   snapshots, fall back to full command-log replay from session start," so
   schema changes degrade to a slower restore instead of a wedge.
4. Divergence semantics (below).

## Determinism interaction: intentional-divergence mode vs. the golden gate

State this plainly: an engine-code change that alters sim behavior
legitimately diverges hashes. Replaying the same command log against the new
build produces a different but still-deterministic trajectory, and that is
the point of the edit. The machinery must distinguish two hash uses that are
currently conflated:

- **Within-build agreement** — editor and worker checkpoint hashes after a
  respawn of an *unchanged* build. This is D72 parity, and it must still
  hold exactly; it remains the corruption detector for the restart loop
  itself.
- **Cross-build comparison** — pre-rebuild versus post-rebuild hash
  streams. This is informational, not a failure.

The dev loop needs an explicit intentional-divergence mode: on any worker
rebuild the session is marked dev-diverged, the editor surfaces the first
divergent tick and a hash-stream diff as forensics (the `svsw_explain` and
replay tooling is the right substrate), and golden hashes are never
auto-re-recorded — re-recording stays the deliberate, reviewed act the
golden-hashes process already defines. A rebuild that was expected to be
behavior-neutral (a pure refactor) but diverges anyway is a red flag this
mode should highlight — a capability today's gate cannot express at all.

## Decisions and specs amended, and whether a new spec is warranted

- **S22** — amended: add S08 as a dependency; play-in-editor's Session
  becomes worker-hosted instead of in-process; the mockup's reload-semantics
  chip gets a real mechanism behind it.
- **S27b** — amended: factor checkpoint/`Tick_Commit`-replay restore into an
  engine-side capability the Go supervisor and the editor both consume,
  pulling the capability (not the Go supervision) forward from stage 5.
- **S26** — amended: envelope reuse for a second client type (the editor).
- **S02a** — amended: its open save/replay versioning question gets its
  first committed answer, scoped to the dev loop.
- **D70** — a new decision-log entry is required if and when a render-dylib
  swap is proposed later; the process-restart loop itself needs no D70
  amendment, since it never swaps code in-process.
- **New spec warranted: yes.** S22b, "engine dev loop: rebuild, respawn,
  restore," sitting between S02a, S08, S22, and S27b, owning rebuild
  orchestration, the reconnect handshake, restore policy, and divergence
  semantics. Nothing existing owns this; folding it into S22 would bury a
  four-way cross-cutting concern inside a single-consumer spec.

## Grilling questions

1. **Does S22 get amended to sit atop the S08 split-process seam, or does
   the editor stay a single binary that restarts whole?** Recommendation:
   amend S22 so play-in-editor's Session moves into an S08-topology worker
   process and the editor becomes its client/supervisor — this is what
   makes "the editor stays up while the engine rebuilds" true rather than
   simulated, and it reuses S08's hash-checkpointed agreement as the loop's
   corruption detector. Accept the crash-only whole-editor-restart variant
   as milestone 1 only if the maintainer wants the dev loop sooner than the
   S22 rework.
   - Amend S22 to depend on S08; Session lives in a worker (recommended)
   - Keep single-binary S22; crash-only restart with auto-restore from the
     D71 command log plus checkpoint (viable first increment, restore
     machinery fully reused later)
   - Keep single-binary S22 permanently and accept full manual restarts
     (rejects the directive)

2. **How does a rebuilt worker consume pre-rebuild state when engine schema
   changed — what answers S02a's open save/replay-versioning question for
   the dev loop?** Recommendation: hard-reject incompatible snapshots
   (keep S02a's current posture) and fall back to full command-log replay
   from session start. The D71 command stream is schema-agnostic in a way
   binary snapshots are not, so schema changes degrade to a slower restore
   instead of a wedge or a silent misread. Defer the versioned-snapshot-
   reader story until stage 5 forces it for wire checkpoints.
   - Hard-reject snapshot on schema bump plus full command-log replay
     fallback (recommended)
   - Versioned snapshot reader with migration functions (the big S02a
     carry-forward — expensive, eventually needed for stage 5, premature
     for the dev loop)
   - Best-effort snapshot load with field-level defaults (silent-corruption
     risk in a determinism-first engine; reject)

3. **What are the hash semantics across an engine rebuild, and how does the
   dev loop's intentional-divergence mode relate to the golden gate?**
   Recommendation: separate the two hash uses explicitly, as above.
   Within-build hashes remain hard failures; cross-build hashes become an
   informational diff, with the session flagged dev-diverged and
   first-divergent-tick forensics surfaced. Goldens are never
   auto-re-recorded. Demand the inverse-case capability too — flag a
   "behavior-neutral refactor" rebuild that unexpectedly diverges, since
   that is a bug the current gate cannot even express.
   - Dev-diverged session flag plus cross-build hash diff as forensics,
     goldens untouched (recommended)
   - Prompt to re-record goldens on every diverging rebuild (normalizes
     drift, erodes the gate)
   - Suppress all hash checking during dev sessions (throws away the loop's
     own corruption detector)
   - Treat any cross-build divergence as failure until goldens are updated
     (makes every legitimate sim edit a red gate; rejects the directive's
     premise)

Decision pending the maintainer's grilling session.
