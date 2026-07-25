# svsw ubiquitous language

The project glossary: the words this repo uses for its own concepts, the
one meaning each carries, and the synonyms that must not drift back in.
Ticket titles, ticket bodies, child-issue titles, test names, spec prose,
and commit messages use the term in the left column and nothing else.

The decision log is the authority behind every engine term here; where
`docs/research/` phrases something differently, the decision log wins and
the research phrasing is research-era history. Adding or changing a term
is `/grill-with-docs`' job, not a passing edit.

## Work tracking

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Spec** | Any entry in the spec index (S, C or M series) tracked through the ladder and ending behind one named gate, with its normative document at `docs/specs/<id>-<slug>.md`. | PRD, story, epic, feature |
| **Spec index** | `docs/specs/README.md`, the single record of every spec's rung and the fixed per-spec schema. | backlog, roadmap, todo list |
| **Ladder** | The six-rung status sequence a spec climbs: pending, brainstormed, grilled, spec written, implemented, course published. | workflow, pipeline, stages |
| **Map** | A `/wayfinder` decision map: a GitHub issue labeled `wayfinder:map` whose child issues carry the open questions standing between pending and grilled. | plan, epic, tracking ticket |
| **Child issue** | A child of a wayfinder map: one open question, resolving toward a decision and never by shipped code. | decision ticket, ticket, sub-issue (bare), open question (as a name for the issue) |
| **Tracking ticket** | The one GitHub issue per spec whose body is that spec's numbered breakdown and whose sub-issues are its implementable pieces. | plan, parent issue, epic, map |
| **Ticket** | One implementable piece of a spec, filed as one GitHub issue, sized to one fresh context window. | issue, task, story, card |
| **Epic** | A beads container opened by `/implement` when a ticket overruns one session, carrying `--external-ref` back to that ticket. | ticket, milestone, project |
| **Slice** | One red-green-refactor increment inside an epic, CI-green and committed on its own. | subtask, step, chunk, iteration |
| **Decision** | A file in `docs/decisions/`, this repo's settled record of one choice; the numbering is never reused. | ADR (in repo prose), RFC, proposal |
| **Gate** | A named check that must run green (`just check` and its members) and behind which a spec's working software sits. | CI job, build step, check (bare) |

## Determinism and hashing

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Determinism** | Identical inputs produce identical simulation state, by construction and not by after-the-fact testing (D1). | reproducibility, repeatability, consistency |
| **Fixed timestep** | The simulation's invariant tick duration; sim code advances only in whole ticks and no wall clock is reachable from it (D1). | frame time, delta time, variable step |
| **Tick** | One committed step of the simulation, the unit every hash, command, and golden keys to. | frame, update, cycle |
| **ECS** | The entity-component-system core whose iteration order is fixed, making system order part of the determinism contract (D1). | entity system, component store, object model |
| **simrng** | The engine-seeded random-number package that is the only randomness sim code may reach (D1). | RNG (bare), random, seed source |
| **simmath3d** | The policed deterministic 3D math surface (vec3, mat4, quat and the operations the renderer needs) that sim code uses instead of a general math library. | math lib, linalg, vector math |
| **World hash** | The deterministic digest of authoritative simulation state after a committed tick, which detects divergence. | state hash, checksum, save, snapshot |
| **Chunk hash** | One chunk's world hash, composing with its siblings into the world's root hash (D5). | partial hash, subhash, region hash |
| **Golden** | A recorded expected value a gate compares a fresh run against, keyed by tier, platform, shader backend, and input track. | baseline, fixture, snapshot, reference |
| **Draw-list skeleton hash** | The render tier's determinism golden: a digest of a frame's draw-list structure that excludes floats, so it moves only when what is drawn changes. | frame hash, render hash, draw hash |
| **Readback golden** | The offscreen-rendered image golden, compared with per-tier perceptual tolerance. | screenshot test, pixel test, image diff |
| **Off-hash** | Of state excluded from `hash_world` because it is presentation-only and may differ run to run (D11, D5). | cosmetic, non-critical, client-side (bare) |

## Boundaries and structure

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Tier** | One band of the engine's one-way layer stack: the editor tier, scripts, engine core, platform, plus the C interface tier at the platform boundary (D2, D14, D43). | layer (bare), module, package |
| **Editor tier** | The topmost band, `editor/`: the editor binary and the Extensions compiled into it. It depends downward on the engine and is never depended on; tier-scan enforces that from S00 (D43). | SDK tier, tools tier, editor layer |
| **Layering** | The one-way rule that a tier may depend only downward, policed by the boundary-scan and tier-scan gates (D2, D14). | architecture, separation of concerns, structure |
| **C interface tier** | The sanctioned C boundary through which SDL3, wgpu-native, cimgui, and Luau's C API enter Odin, reachable only from the platform tier (D14, D33). | FFI layer, native layer, glue tier |
| **Vendored** | Of third-party source or a prebuilt binary held under D14's quarantine policy: pinned by checksum or commit, provenance recorded, never hand-edited. | third-party, dependency, external |
| **Sandbox** | The declared security boundary a mod's Luau VM runs behind, and the reason a mod can never crash the engine; whitelist, allocation cap, instruction budget, and one error path are its mechanisms (D33, D34). | VM (bare), jail, isolation, runtime (bare) |
| **`svsw.*` surface** | The scripting API a mod may see, assembled from opt-in registrar binding packages (D3). | API (bare), stdlib, script library |
| **Binding package** | An opt-in Odin package that registers one tier of the `svsw.*` table through the single locked seam (D3). | glue, wrapper, API module |
| **Mod** | One Luau package loaded into the shared world through the mod machinery, first-party or third-party alike; a mod never crashes the engine. | plugin, addon, script (bare) |
| **Base-as-mod** | The engine's own gameplay content shipped as a mod, so first-party and third-party content travel one path (D12). | core game, built-in content, default mod |
| **Extension** | Native Odin source compiled into a user's own editor build, registering through the same locked seam a binding package uses. It is trusted code outside the security model, and it never loads into a Session (D43). | plugin, addon, mod (for this), native module |
| **Editor script** | Luau running in the editor at the expanded capability tier: project-scoped filesystem, asset writes, editor UI bindings, command-stream emission. A capability tier, not a containment boundary (D10, D43). | editor mod, tool script, macro |

## Simulation runtime

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Session** | One running deterministic simulation of one world: a tick advances it, a world hash describes it, and one worker process runs one (D20, D21, D22). | game, match, world (bare), instance |
| **Chunk** | One cell of the unbounded chunked world, carrying chunk-local coordinates and its own world hash (D5). | region, tile, sector, cell |
| **Worker** | The umbrella for a supervised child process addressed over the versioned wire protocol. It has exactly two kinds, below, and the bare word is used only where both are meant (D15, D44). | server, node, background process |
| **Session worker** | The headless process that runs a Session. Owns user state, so a crash surfaces and waits rather than restarting silently. Supervised by the Go gateway online, or by the editor locally, from one binary either way (D15, D36, D44). | worker (bare), sim process, game process |
| **Job worker** | A pooled process doing derived-state work such as asset import, shader compilation, or a bake. Owns nothing the user has not already saved, so it is killed and restarted freely (D44). | task runner, build process, helper |
| **Gateway** | The Go process that terminates client QUIC connections and routes them to workers (D6, D18). | server (bare), proxy, backend, host |
| **Command stream** | The typed log of editor edit operations backing undo, redo, persistence, and headless replay (D21). | history, journal, event log, undo stack |
| **Dev-diverged** | The flag a Session carries once a rebuild has landed code changes into it, marking its cross-build hash diffs as forensics rather than failures (D36). | dirty, stale, invalid |

## Verification

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Parity** | Dual-mode parity: one build's headless run and windowed run produce identical world and skeleton hashes plus comparable readback goldens (D22). | consistency, equivalence, agreement |
| **Headless run** | An engine run with no window, driving the same single render path into the same offscreen target a windowed run uses (D22). | CI mode, server mode, batch mode |
| **Windowed run** | An engine run that presents from the same offscreen target a headless run hashes (D22). | GUI mode, client mode, interactive mode |
| **Verification scene** | The hand-authored few-chunk scene, capped at two-client co-op, that the engine's acceptance gates run against (D4, D17). | demo, sample game, test level, playground |
| **Prototype port** | A subsystem carried over from the internal prototype together with its test suite, landing test-first and never bare. | migration, port (bare), copy, rewrite |
| **Internal prototype** | The earlier 2D engine: a source svsw ports subsystems and tooling patterns from test-first, never a target it converges with (D38). | old engine, legacy, v1, previous version |
| **Human checkpoint** | An acceptance step a person must perform because it cannot be verified headlessly, such as a real-GPU visual, audio, or gamepad check. | manual test, QA pass, sign-off |

## Documentation surfaces

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Research corpus** | `docs/research/`, the closed research-era record on its own decision numbering, cited outside itself with the `R-D` prefix. | docs, archive, notes, background |
| **Design record** | A document under `docs/plans/` or `docs/design/` recording how something was designed, normative for nothing. | plan, spec, proposal |
| **Course module** | The `course`-repo lesson set paired to one implemented spec and published behind the course verification gate (D27). | tutorial, chapter, docs, guide |

## Relationships

- A **Spec** has exactly one row in the **Spec index** and, from the
  "spec written" rung onward, exactly one document at
  `docs/specs/<id>-<slug>.md`. M00 is the standing exception: it stands at
  spec written, its record is the design record at
  `docs/design/editor-mockup.md`, and its index entry has not collapsed to
  a row yet.
- A **Spec** has at most one **Map** and at most one **Tracking ticket**;
  they are different kinds of parent issue and never share a label.
- A **Map**'s children are **Child issues** and resolve toward a
  **Decision**; a **Tracking ticket**'s children are **Tickets** and
  resolve by shipped code.
- One **Tracking ticket** has N **Tickets**; one **Ticket** has zero or
  one **Epic**; one **Epic** has N **Slices**.
- Every **Spec** ends behind exactly one named **Gate**; a **Gate** may
  cover several specs' scenarios.
- One **Session** owns N **Chunks**; each **Chunk** contributes one
  **Chunk hash** to that Session's root **World hash**.
- One **Session worker** runs one **Session**. A **Gateway** supervises N
  of them online; the **Editor** supervises N of them locally, and the
  same binary serves both.
- A **Mod** reaches the engine only through the **`svsw.*` surface**,
  behind the **Sandbox**; a **Binding package** contributes one tier of
  that surface.
- A **Mod** and an **Editor script** are Luau and load into a running
  process; an **Extension** is Odin and is compiled into a build. Only a
  **Mod** runs inside a **Session**, and only a **Mod** is behind the
  **Sandbox**.
- **Parity** compares a **Headless run** and a **Windowed run** of one
  build; a **Golden** is what either run is compared against.
- Every implemented **Spec** pairs with exactly one **Course module**.

## Example dialogue

> **Dev:** "S02b is at spec written. Do I file twenty tickets now, or one
> and split it later?"

> **Maintainer:** "File its **tracking ticket** first: its body is the
> numbered breakdown, and the **tickets** hang off it as sub-issues. One
> **ticket** per implementable piece, each sized to one fresh context
> window."

> **Dev:** "The cross-CPU **gate** piece won't fit one window. Does it
> become an **epic** up front?"

> **Maintainer:** "No. It stays one **ticket** until a session runs out.
> When `/implement` overruns, it opens the **epic** in beads with
> `--external-ref` back to that ticket, and each red-green-refactor
> increment lands as a **slice**, CI-green and committed on its own, so
> the next session resumes from `bd ready` instead of re-reading the
> whole ticket."

> **Dev:** "And the open question about the third golden platform, is that
> a ticket too?"

> **Maintainer:** "That one is a **child issue** on the map. It resolves
> toward a **decision**, so it belongs to `/wayfinder` on the
> pending-to-grilled span and it closes before the spec is written.
> Tickets only exist below spec written, and they resolve by shipped
> code."

> **Dev:** "So the **spec** never moves rung because a ticket closed?"

> **Maintainer:** "Right: the **spec index** is the only status record.
> A spec reaches implemented when its **gate** is green, not when the
> tracker looks empty."

## Flagged ambiguities

- **issue** — GitHub calls **Tickets** "issues"; beads calls **Slices**
  "issues". The bare word names two layers at once and is never used
  alone: say ticket or slice. Two compounds are sanctioned and carry no
  ambiguity: "GitHub issue", when the tracker's own mechanics are the
  subject, and **Child issue**, the map's own unit.
- **parent issue** — sanctioned only as the *category* spanning both
  kinds, a **Map** and a **Tracking ticket**. Never a substitute for
  either one: a singular "the parent issue" is barred, and the
  **Tracking ticket** row keeps it as an alias to avoid.
- **plan** — `docs/plans/` means *design record*, while a spec's
  breakdown is its **Tracking ticket**. Never write "the plan" for
  either; name the artifact.
- **spec** — here it is only an entry in the spec index, S, C and M
  series alike. The `/to-spec` skill uses the word for a PRD, which is
  why that skill is banned for every spec-index entry and reserved for
  work that is not in the index; a PRD-shaped document is never called a
  spec in this repo.
- **prototype** — three things: the **Internal prototype** (the 2D engine
  svsw ports subsystems from, D38), a `/prototype` throwaway artifact that
  answers one design question on a branch, and the M00 editor mockup, a
  committed design artifact. Always qualify.
- **session** — in work tracking, one agent context window; in the engine,
  a **Session**, the deterministic simulation instance. The research
  corpus proposes "game session" and "match"; the decision log settled on
  Session for the engine term.
- **checkpoint** — the spec index's **Human checkpoint** (a review step),
  a per-chunk hash checkpoint (the desync tripwire, D6), and the research
  corpus's "authority checkpoint" (resumable state, now covered by D36's
  snapshot-and-replay restore) are three unrelated things. Never write a
  bare "checkpoint".
- **worker** — two kinds now, a **Session worker** and a **Job worker**,
  and two supervisors for the first: the **Gateway** online and the
  **Editor** locally. The bare word is used only where both kinds are
  meant; anywhere the failure semantics matter, name the kind, because
  one owns user state and the other does not (D44).
- **extension** — the word was barred as an alias for **Mod** until D43
  gave it a definition of its own. It now means native Odin compiled into
  an editor build, and never a Luau package. An **Editor script** is the
  Luau thing that runs in the editor; calling it an extension is the
  drift the old bar existed to prevent.
- **runtime** — `runtime/` is a directory, "the Luau runtime" is the
  script VM (D33), and the research corpus used "engine runtime" for all
  code active while a game runs. Use "Luau runtime" or name the tier;
  never use the bare noun for the engine as a whole.
- **worker** — the research corpus warns that "worker" suggests stateless
  background work, whereas a **Worker** here owns live authoritative
  state. The decision log kept the word (D15, D36); never call an
  asset-decode thread a worker (D20).
