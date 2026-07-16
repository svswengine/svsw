# Scripting language for svsw3D: JavaScript/TypeScript vs Lua 5.4

> **Decision outcome (2026-07-14):** this document's Lua 5.4 recommendation
> is superseded. The maintainer fired the named revisit trigger on option 2
> (Luau, close second: typed-DX demand the annotation path cannot meet) and
> adopted Luau everywhere, mods and the editor tier alike. See ROADMAP.md
> D83-D86.

A decision record for the maintainer's question: would embedding JavaScript
(QuickJS-ng or Duktape) or TypeScript beat Lua 5.4 for svsw3D mod scripting,
and does JavaScript's single-threaded reputation conflict with the ambition of
a multithreaded engine and games.

## 1. Question and context

Why now: S14 has not started. S14 ports the donor's hardened Lua embedding
(sandbox strip, allocator byte cap, shared instruction budget, R1–R5 longjmp
discipline, schema parse, the svsw.* core). If the scripting language changes,
S14 stops being a port and becomes a greenfield security project, so this
question must close before S14 opens, not after.

The invariants that weight the comparison come from the engine plans:
deterministic simulation as server-side world truth (headless parity, the
dual-mode parity gate D72 in ROADMAP.md), per-mod sandboxed VMs over
schema-laid-out native storage, a multi-mod shared world, mod-never-crashes-
engine containment, instruction and memory budgets, hot reload, and the C
interface tier (D64). Determinism, sandboxing, and multi-VM isolation carry
the highest weights; talent pool and raw interpreter speed matter but do not
outrank a security boundary or the golden-hash harness.

What the language touches, and what it does not: the carry-forward ledger
separates the two surfaces. Language-agnostic and untouched by any swap:
the schema-laid-out native ECS storage and packed field descriptors, the
two-tier entity-view concept, D42 opt-in bindings, the settings→data→control
pipeline semantics (Kahn ordering, first-declarant schema mirroring),
tmp-then-rename persistence, and the containment architecture itself (hard
per-VM memory cap, shared instruction quota, one set_error/disable_mod path).
Lua-specific and forfeited on a swap: sandbox_strip, the lua_Alloc allocator,
the count-hook budget, the R1–R5 checklist, the pairs()-order
canonicalization, and every hash-golden Lua test fixture. A swap is not
"rebind the API"; it is "re-derive and re-harden the security boundary, then
re-prove determinism", while the engine core underneath does not move.

## 2. Candidates

- **Lua 5.4** (incumbent): the donor engine's scripting language; PUC-Rio,
  MIT, native integer/float subtypes, stackful coroutines.
- **QuickJS-ng**: the maintained fork of Bellard's QuickJS; ES2023, MIT,
  single-header embedding (https://bellard.org/quickjs/quickjs.html,
  https://github.com/quickjs-ng/quickjs/discussions/258).
- **Duktape**: a small embeddable ES5.1 engine with a hand-picked partial
  ES2015/2016 subset (https://wiki.duktape.org/postes5features).
- **Luau**: Roblox's typed Lua 5.1 descendant; sandbox-first VM, gradual
  typing, MIT (https://github.com/luau-lang/luau).
- **TypeScript on QuickJS**: TS transpiled at load time or offline, executed
  on QuickJS-ng.
- **Typed authoring on the Lua runtime** (add-on, not a runtime swap):
  lua-language-server annotations for svsw.* now; TypeScriptToLua as a
  candidate authoring layer, pending its own audit (§6).

## 3. Comparison matrix

Scores 1–5, 5 best for this engine. The matrix scores **design merit of the
language and VM only**. Donor artifacts (the working sandbox, the recorded
goldens, reload.odin) are implementation maturity, not language properties;
they sit below the table as unscored context. This split answers the review
blocker in §8: the earlier draft let donor code inflate five Lua cells.

Weights: determinism 5, sandbox design 5, multi-VM isolation 5, embeddability
4, performance 3, hot reload 3, coroutines 3, modder DX 3, maintenance 3,
GC 2, ecosystem precedent 2, license 1. Weight sum 39; maximum score 195.

| Dimension (weight) | Lua 5.4 | QuickJS-ng | Duktape | Luau | TS-on-QuickJS |
|---|---|---|---|---|---|
| **Determinism** (5) | **4.5**: native int/float subtypes; demerits: pairs() iteration order is unspecified and needs canonicalization; transcendental math.* delegates to platform libm, a hazard shared by every candidate (https://gafferongames.com/post/floating_point_determinism/) | 4: f64-only Number, BigInt separate and non-interchangeable; bitwise ops coerce through 32 bits; credit: Map/Set/object-key iteration order is spec-guaranteed (https://tc39.es/ecma262/), which removes the pairs() canonicalization class; libm and default-RNG hazards are shared, not charged (Math.random gets host-replaced the same way the engine seeds Lua's RNG; https://v8.dev/blog/math-random) | 3.5: same f64 number model on older semantics | 4: double-only (Lua 5.1 lineage, no 5.4 integer subtype); otherwise Lua-shaped | 3.5: QuickJS runtime plus the transpiler version as an added determinism input for distributed mods |
| **Sandbox design** (5) | 4: stock Lua ships no sandbox; the primitives invite one (small stdlib to whitelist, lua_Alloc, debug hooks) but hardening is a retrofit; the donor's threat model is buggy-not-hostile per the S14 open questions, and its accepted pattern-backtracking budget gap is a tolerated standing risk of the same class Screeps carried in production (https://lobste.rs/s/uqfh4p/screeps_how_game_about_programming) | 3.5: real primitives (JS_SetMemoryLimit, JS_SetInterruptHandler, max stack; https://quickjs-ng.github.io/quickjs/developer-guide/intro/) but fuel is hand-rolled on the interrupt hook (https://github.com/justjake/quickjs-emscripten/issues/24), the ES2023 global surface (Proxy, Reflect, prototype chains, RegExp backtracking) is far larger to neuter, and the Figma precedent transfers weakened: Figma runs QuickJS compiled to WASM in a browser, where WASM's object-representation isolation supplies part of the boundary and does not transfer to a native quickjs.h embedding (https://www.figma.com/blog/how-we-built-the-figma-plugin-system/) | 3.5: first-class sandboxing doc, small ES surface (https://github.com/svaarala/duktape/blob/master/doc/sandboxing.rst); dormancy is charged once, under maintenance | **5**: the one sandbox-first VM: unsafe stdlib removed, VM-level read-only globals, mandatory interrupt hook, no bytecode loading (https://luau.org/sandbox/); its documented shallow-within-one-VM caveat is what the per-mod-VM model already answers | 3.5: the QuickJS story; TS types are authoring DX, not a security boundary |
| **Multi-VM isolation** (5) | **5**: one lua_State per mod, no process-global runtime state | 4.5: one JSRuntime per OS thread, zero sharing, is the documented model; concurrent entry into one runtime is unsafe without external locking (https://github.com/genotrance/quickjs-ng/blob/main/docs/threading.md); os.Worker in quickjs-libc demonstrates the message-passing shape but lives in the runtime library, not the core quickjs.h API an engine links (https://bellard.org/quickjs/quickjs.html) | 4: same one-heap-per-thread shape | **5**: same per-VM model; per-mod VMs are its own docs' recommended isolation | 4.5: same as QuickJS |
| **Embeddability via the C tier, D64** (4) | **5**: the reference stack API, ANSI C, with the known longjmp footgun the R1–R5 checklist exists for | 4: single quickjs.h, no deps, ~210KiB (https://bellard.org/quickjs/quickjs.html); trades longjmp for refcounted-JSValue leak and exception-as-return-value discipline, a new checklist to derive | 4.5: a Lua-like stack API by design, three-file drop-in (https://duktape.org/guide.html) | 3.5: near-5.1 C API, but the VM is C++, which strains the vendored-C framing of the D64 platform tier | 3.5: QuickJS embedding plus a TS toolchain; offline transpile keeps the runtime clean, load-time transpile drags a compiler into the engine |
| **Performance, interpreter vs interpreter** (3) | 4: among the fastest non-JIT interpreters; the one cited benchmark ran Lua 5.3.6, not 5.4, on a single fannkuch workload its author calls non-conclusive (https://sabotage-linux.neocities.org/blog/9/) | 3.5: roughly par with Lua in that same single benchmark; unmeasured against 5.4 in this engine's workload; a decision-grade number would come from the project's own stress harness | 2.5: measured slower than QuickJS (https://news.ycombinator.com/item?id=31968265) | **5**: faster than 5.4 per vendor benchmarks; 16KB interpreter core (https://luau.org/performance/) | 3.5: QuickJS numbers |
| **GC pauses, 16.6ms frame** (2) | 4: incremental and generational modes, tunable (general knowledge, PUC manual) | 4: refcount plus a localized cycle collector; avoids whole-heap stop-the-world spikes (https://medium.com/@landerlyoung/anatomy-of-quickjs-garbage-collection-algorithm-fc02f6813ba1) | 3: refcount plus mark-and-sweep, dated | 4.5: Warframe cites GC and memory efficiency as a migration motive (https://fluff.blog/2025/05/02/towards-dedicated-luau-development.html) | 4 |
| **Hot reload** (3) | 4.5: cheap chunk compile, environment swap; the language design supports it, the donor's reload.odin is maturity, not design | 4: sub-300µs runtime lifecycle (https://rubenvannieuwpoort.nl/posts/a-first-look-at-quickjs); source reload works; bytecode serialization is version-unstable and lossy, same-build cache only, never a distribution format (https://github.com/bellard/quickjs/blob/master/doc/quickjs.texi, https://github.com/quickjs-ng/quickjs/issues/481) | 3.5 | 4.5: Lua-shaped, fast compile | 3: the transpile step sits inside the reload loop |
| **Coroutines / scheduler APIs** (3) | 4.5: stackful coroutines suit budgeted, resumable mod-system scheduling; caveat: yielding across a C call needs lua_yieldk continuation plumbing, a known Lua-C-API pain | 3: stackless generators/async only; async implies a microtask queue the engine must drain at one deterministic point per tick; no yield across the C boundary (JS language semantics) | 3.5: nonstandard Duktape.Thread coroutines (https://duktape.org/guide.html) | 4.5: Lua coroutines; whether the mandatory interrupt hook fires across coroutine boundaries is unverified against Luau source and must be checked before the budget-sharing design point relies on it (https://luau.org/sandbox/) | 3: async/await over the same machinery |
| **Modder DX and talent pool** (3) | 3: the modding lingua franca (Factorio, WoW); typed DX only via annotations (lua-language-server) | 4: the largest programmer population; no types without TS | 2.5: ES5.1-era JS plus a partial ES2015/2016 subset reads as a downgrade to modders (https://wiki.duktape.org/postes5features) | 4.5: gradual typing in the language, luau-lsp autocomplete (https://github.com/luau-lang/luau) | **5**: the strongest typing and tooling; Figma/Bitburner-style generated d.ts surfaces (https://developers.figma.com/docs/plugins/typescript/) |
| **Ecosystem precedent** (2) | **5**: the default game-modding answer | 4: Figma's plugin sandbox (QuickJS-in-WASM, see sandbox row), txiki.js | 3: Aseprite; TIC-80 carries an open issue proposing a switch away over the ES ceiling (https://github.com/nesbox/TIC-80/issues/1191) | 4.5: Roblox, Alan Wake 2, Warframe, Farming Simulator 25, Second Life SLua (https://fluff.blog/2025/05/02/towards-dedicated-luau-development.html) | 4: typed-factorio and ts-defold prove the authoring pattern (https://github.com/GlassBricks/typed-factorio, https://ts-defold.dev/) |
| **License** (1) | 5 MIT | 5 MIT | 5 MIT | 5 MIT | 5 MIT (tsc Apache-2.0) |
| **Maintenance health** (3) | 5: PUC-Rio, stable | 4.5: active fork, steady releases, test262 plus a 50-configuration CI matrix (https://github.com/quickjs-ng/quickjs/discussions/258); upstream bellard/quickjs shows minimal activity relative to ng, with some resumed work (https://news.ycombinator.com/item?id=44703660) | **1.5**: latest release remains v2.7.0 with the 3.x milestone still open (https://github.com/svaarala/duktape/releases, https://github.com/svaarala/duktape/milestone/28) | 4.5: Roblox-funded, open, Lute standalone runtime coming | 4: two moving parts to track |
| **Design-only weighted total (/195)** | **173.5** | 154 | 130.5 | **176** | 148 |

Cells without a URL rest on general knowledge (Lua GC modes, Luau's C++
implementation and double-only numbers, tsc's license, JS stackless-coroutine
semantics); each checks out against primary documentation.

**Implementation maturity (context, not scored).** Lua 5.4 is the only
candidate with a working, engine-shaped boundary: the donor sandbox,
allocator cap, instruction budget, containment path, hot reload, and the
golden-hash harness that proves bit-stable simulation exist as tested code.
Every other candidate starts that work from zero. The maintainer ruled build
cost out as the deciding factor, so this stays out of the totals; it is
recorded here once because a proven security boundary is also a risk
property, not just saved effort.

**Sensitivity.** The design-only totals put Luau ahead of Lua by 2.5 points
of 195, a gap smaller than any two half-point judgment calls in the table:
read Lua and Luau as tied on design. Raising the modder-DX weight from 3 to
5 gives Luau 185, Lua 179.5, QuickJS-ng 162, TS-on-QuickJS 158; no JS
candidate overtakes the Lua family. Rounding every Lua half-point down drops
Lua to 168, still above every JS candidate. The JS case lives in the
weight-3 dimensions and the Lua family's case lives in the weight-5
dimensions, which follows from the engine's own invariants, not from scoring
choices.

## 4. Threading: the language choice barely moves this needle

The worry "JS is single-threaded" conflates a runtime with a process.
JavaScript the language exposes no shared-memory threads to scripts; neither
does Lua. Both families give the embedder the same answer: one VM per OS
thread, zero shared state. A lua_State is not thread-safe. A JSRuntime is not
thread-safe; concurrent entry corrupts its stack-top guard and GC lists
without external locking (https://github.com/genotrance/quickjs-ng/blob/main/docs/threading.md).
A Luau VM is not thread-safe. Every candidate runs N independent VMs on N
threads with equal ease; quickjs-libc's os.Worker demonstrates the
message-passing shape at the runtime-library level
(https://bellard.org/quickjs/quickjs.html). Switching to JS neither worsens
nor improves the multithreading story. That is why the matrix scores multi-VM
isolation, not "threading".

What decides whether svsw3D becomes a multithreaded engine is engine
architecture, and the decision log already governs it: D70 locks the
simulation single-threaded per Session, deterministic by construction, with
asset decode on workers integrating at one deterministic point per frame, and
any parallel-sim ambition routed through the decision log. The real
parallelism levers are language-neutral:

1. **N Sessions on N threads.** The headless server-authoritative model (sim
   as world truth, the D72 parity gate) lets a server process run many
   independent Sessions, each with its own thread and its own per-mod VMs.
   This shape is parallel today with any scripting language.
2. **Job-parallel systems inside one Session.** This needs archetype/chunked
   storage, per-system read/write sets declared up front, deterministic job
   ordering (never completion order), per-chunk sharding, and the existing
   command-buffer deferred-mutation and RNG-stream-per-slot contracts. The
   carry-forward ledger names this the unbuilt redesign, gated behind a
   future D-entry. The scripting VM's role does not change: scripts run on
   the thread that owns their VM, and cross-chunk parallel script execution
   needs per-chunk VM instances or a single scripted phase, identical
   constraints in Lua and JS.
3. **Render, audio, and asset threads.** D70 permits these now, with no
   scripting involvement.

One honest asymmetry: Lua and Luau's stackful coroutines make a cooperative
scheduler API (run this mod system, suspend at budget, resume next slice)
natural, with the lua_yieldk caveat from the matrix. JS offers stackless
async and generators, so an equivalent scheduler pushes async coloring into
every mod-facing API signature and forces the engine to own a deterministic
microtask-drain point per tick. That is a scheduler-ergonomics cost of JS,
not a threading cost, and it is the closest thing to a real JS concurrency
penalty in this design.

Bottom line: if multithreading motivates the question, the answer is "wrong
lever". The path to parallelism runs through a decision-log entry about the
ECS scheduler and Session sharding, and it stays open, and equal in
difficulty, under Lua 5.4, Luau, or QuickJS.

## 5. What switching gains and loses

### Gains

- Talent pool: JS/TS is the largest programmer population; modders arrive
  knowing the language, and generated svsw.*.d.ts surfaces give
  Figma/Bitburner-grade autocomplete
  (https://developers.figma.com/docs/plugins/typescript/).
- Static typing in the toolchain (TS) or the language (Luau): typed mod APIs
  catch a class of mod bugs at authoring time instead of at the containment
  boundary; the M00 editor IDE could ship Monaco with full type checking.
- Spec-guaranteed iteration order for Map/Set and object keys
  (https://tc39.es/ecma262/): removes the "never trust pairs() order"
  canonicalization class Lua forced on the schema parser.
- A bundlable pure-computation library ecosystem: pathfinding, geometry,
  data structures, and parsers from npm can be vendored into a no-I/O
  sandboxed mod; Lua has no ecosystem of comparable depth, and Screeps shows
  modders leaning on it in practice
  (https://github.com/screeps/screeps/blob/master/README.md). Counterweights
  sit next to the gain: every bundled library joins the determinism audit
  surface and enlarges what the whitelist must account for.
- Untrusted-code precedent, with its caveat: Figma executes third-party
  plugins on QuickJS after abandoning a Realms sandbox over escapes, but as
  QuickJS-compiled-to-WASM in a browser, where WASM isolation carries part of
  the load and does not transfer to a native embedding
  (https://www.figma.com/blog/how-we-built-the-figma-plugin-system/).
- quickjs-ng maintenance health: an active fork with test262 and a
  50-configuration CI matrix
  (https://github.com/quickjs-ng/quickjs/discussions/258).
- A friendlier GC pause profile in the common case: refcount-dominant
  collection with a localized cycle collector
  (https://medium.com/@landerlyoung/anatomy-of-quickjs-garbage-collection-algorithm-fc02f6813ba1).
- Cheap VM lifecycle (sub-300µs create/run/destroy) suits per-mod VM churn
  and hot reload
  (https://rubenvannieuwpoort.nl/posts/a-first-look-at-quickjs).
- Modern language ergonomics: modules, destructuring, template strings,
  async generators (ES2023 in quickjs-ng) against Lua's minimal surface.

### Losses

- Lua 5.4's integer/float split: JS is f64-only with BigInt as a separate,
  non-interchangeable type, so every integer-semantics assumption in the
  sim-facing API (entity IDs, tick counters, fixed-point math) gets
  re-audited against a re-recorded golden harness. The transcendental-libm
  hazard is shared by every candidate, Lua included
  (https://gafferongames.com/post/floating_point_determinism/); the number
  model is the JS-specific part.
- The literal donor sandbox: sandbox_strip, the lua_Alloc byte cap, the
  shared count-hook budget, and the R1–R5 discipline are Lua-C-API code with
  zero direct portability. Only the patterns transfer, and a new footgun
  taxonomy (refcounted JSValue leaks, exception-as-return-value discipline,
  microtask draining) must be derived and hardened from scratch.
- All hash-golden Lua fixtures and the script_accept gate family: the tests
  that define working software for S14, S15, S20, and S24 are Lua-VM-specific
  and re-record in full.
- Stackful coroutines: scheduler-style mod APIs and the donor's
  budget-sharing fix have no JS equivalent; async and generators are
  stackless, cannot suspend across the C boundary, and color every mod-facing
  API signature.
- Instruction-budget maturity: JS fuel gets hand-rolled on
  JS_SetInterruptHandler (https://github.com/justjake/quickjs-emscripten/issues/24),
  and the JS analog of Lua's pattern-backtracking gap (RegExp catastrophic
  backtracking inside one native call) must be rediscovered and mitigated.
- Bytecode as an artifact: QuickJS serialization is version-unstable and
  lossy (https://github.com/bellard/quickjs/blob/master/doc/quickjs.texi,
  https://github.com/quickjs-ng/quickjs/issues/481), unusable for mod
  distribution or save-adjacent formats; Lua keeps that option open.
- A larger default global attack surface: ES2023 ships Proxy, Reflect,
  getters everywhere, and prototype chains on everything; "strip a small
  stdlib" becomes "neuter a big one".
- Game-modding gravity: Factorio-style modding culture, docs, and mod-author
  muscle memory are Lua; scenes and prefabs as Lua data files (S15) and every
  scaffold template re-author.

## 6. Options ranked

1. **Lua 5.4 (incumbent): KEEP, recommended.** On design merit alone it ties
   Luau at the top of the field and beats every JS candidate on the
   weight-5 invariants. A migration needs a decisive design win over the
   incumbent; no candidate shows one. The incumbent's proven boundary and
   golden harness (context, §3) reinforce the call without deciding it.
2. **Luau: CLOSE SECOND.** The one swap with genuine design upside: the
   design-only matrix puts it at 176 against Lua's 173.5, inside scoring
   noise. Faster interpreter, the only sandbox-first VM, typing in the
   language, heavyweight non-Roblox embeddings (Alan Wake 2, Warframe, FS25,
   SLua: https://fluff.blog/2025/05/02/towards-dedicated-luau-development.html).
   Costs: loses the 5.4 integer subtype (goldens re-record), the C++ VM
   strains the vendored-C D64 tier, and the donor boundary still needs a
   real port. Named revisit triggers: measured interpreter-throughput pain
   in the stress harness, or typed-DX demand the annotation path cannot
   meet.
3. **QuickJS-ng: VIABLE BUT UNJUSTIFIED.** Credible primitives, a healthy
   fork, and the strongest JS embedding precedent, weakened by the WASM
   caveat. It trails the Lua family on every top-weighted dimension, shows
   no speed advantage, and its one decisive draw (talent pool) is
   purchasable without a runtime swap. If a JS runtime is ever mandated,
   quickjs-ng is the fork to use; upstream shows minimal relative activity
   (https://news.ycombinator.com/item?id=44703660).
4. **TypeScript-on-QuickJS: REJECT as a runtime.** Inherits every QuickJS
   cost and adds a compiler to the load, reload, and determinism paths.
   TypeScript's value is authoring-time; capture it on whatever runtime
   wins.
5. **Duktape: REJECT.** The maintenance row decides it: latest release
   v2.7.0, 3.x milestone open (https://github.com/svaarala/duktape/releases).
   A dormant codebase cannot be the security boundary, whatever the charm of
   its Lua-like C API. TIC-80's open migration proposal
   (https://github.com/nesbox/TIC-80/issues/1191) illustrates the ES-ceiling
   cost but is a proposal, not a completed exodus.
6. **Typed authoring on the Lua runtime: annotations RECOMMENDED, TSTL
   EVALUATE.** Ship lua-language-server annotations for the svsw.* stubs
   first; near-zero cost and risk, no runtime change. TypeScriptToLua
   (https://typescripttolua.github.io/) earns a look, not a blessing: the
   same rubric that rejected TS-on-QuickJS and Duktape applies, so before
   any official TSTL template the project must assess TSTL's release cadence
   and maintainer concentration, treat the transpiler version as a
   determinism input for distributed mods, and audit how TSTL-emitted
   arithmetic maps f64-only TypeScript numbers onto Lua 5.4's int/float
   split under the golden-hash harness. typed-factorio proves the authoring
   pattern (https://github.com/GlassBricks/typed-factorio); Factorio is not
   hash-gated the way svsw3D's harness is.

**Recommendation.** Stay on Lua 5.4, ship typed API definitions as the DX
answer, and hold Luau as the named close second with the revisit triggers
above. Stated honestly: on design merit the Lua family wins and Lua-vs-Luau
is a tie; the tiebreak goes to the incumbent because a swap must earn its
disruption with a decisive design win, and parity is not one. The JS
candidates lose on the invariants this engine weights highest, win on talent
pool, which the annotation path buys without a runtime swap, and do nothing
for multithreading, which is a decision-log question about the ECS scheduler
and Session sharding, not a language question.

## 7. Decision impact

A runtime swap reopens, at minimum:

- **D59 and S20**: the mod-facing svsw.ui-over-ImGui API is a Lua API by
  name and design (a retained-style Lua surface mapped onto immediate mode).
- **D60 and S24**: the editor scripting host is defined as the same VM
  architecture as the mod sandbox and is a security boundary barred from
  re-sequencing; a language change re-litigates the editor-scripting
  security review.
- **D62 and S15**: "mod machinery ports as-is" becomes false. The svsw.data,
  svsw.setting, and svsw.storage surfaces, the settings→data→control
  pipeline bindings, and scenes-as-Lua-data-files all re-author; the
  pipeline semantics (Kahn resolution, first-declarant schema mirroring)
  survive.
- **D64**: the C-tier enumeration names Lua's C API as a sanctioned boundary
  and would re-word. quickjs.h substitutes; Luau's C++ VM strains the
  vendored-C framing.
- **S14 in full**: defined as porting the donor's hardened Lua embedding,
  and every listed artifact is Lua-C-API-literal.
- **S17**: CLI scaffold templates emit Lua mod projects.
- The spec-index gate roster item covering the hash-golden Lua game and the
  containment, budget, and pipeline gate family re-baselines.

**Not reopened**: D70 (single-threaded Session, parallel ambitions routed
through the decision log) and D72 (the dual-mode parity gate, ROADMAP.md);
threading and headless parity are language-neutral (§4).

Donor writeoff, stated once as context per the maintainer's instruction: the
literal boundary code (sandbox.odin, host.odin, views.odin, the api and
binding files, prelude.odin, reload.odin) and every Lua-specific fixture
(hash-golden games, containment suites, budget tests) are forfeited as direct
ports and survive only as patterns: whitelist construction,
budget-quota-with-shared-pool, one-error-path containment, R1–R5 as a
checklist. The language-agnostic core (§1) carries forward untouched. The
writeoff is most of what makes S14 a port instead of a greenfield security
project; the recommendation stands without it, on the design-only matrix.

## 8. Review notes

Two adversarial critiques ran against the draft analysis: a bias audit and a
factual verification pass. Dispositions for every blocker and major finding,
with the minors compressed at the end.

| # | Finding | Severity | Disposition |
|---|---|---|---|
| A1 | Sunk cost laundered into design scores: five Lua cells (20 of 39 weight points) rested on donor artifacts, contradicting the claim that the recommendation stood on design merits alone | Blocker | **Amended.** The matrix now scores design merit only; donor code moved to an unscored implementation-maturity note. Re-derived on design alone, Luau edges Lua 176 to 173.5, inside scoring noise, as the critique predicted. The recommendation re-worded: it rests on Lua-family-beats-JS plus incumbent-wins-ties, not on "design merits alone favor the incumbent". |
| A2 | Determinism double standard: JS charged for libm transcendentals and unseedable Math.random, hazards Lua shares; JS's spec-ordered iteration named but not priced | Major | **Amended.** The row charges only the true deltas (integer subtype, 32-bit bitwise coercion, transpiler input); shared hazards are labeled shared in both the matrix and §5; the iteration-order win is priced into QuickJS's 4. |
| A3 | Sandbox row inverted design merit: retrofit-sandboxed Lua outscored sandbox-first Luau; Lua's accepted backtracking gap framed neutrally while the JS analog got the Screeps dramatization | Major | **Amended.** Luau scores 5 and Lua 4 on sandbox design; the donor sandbox moved to the maturity note; the buggy-not-hostile threat model is named in the Lua cell; the Screeps framing now attaches to Lua's own accepted gap. |
| A4 | The TSTL add-on escaped the scrutiny that killed TS-on-QuickJS and Duktape: transpiler-as-determinism-input, maintenance health, and f64-onto-int/float mapping all unexamined | Major | **Amended.** TSTL downgraded from recommended to "evaluate" with the three audit items listed in §6; the lua-language-server annotation half stands alone as the recommendation. |
| B1 | The Figma precedent overextended: Figma runs QuickJS compiled to WASM in a browser, and the WASM object-representation isolation does not transfer to a native quickjs.h embedding | Major | **Amended.** Every Figma reference now carries the qualifier; the QuickJS sandbox score reflects the weakened precedent. The correction strengthens the keep-Lua verdict. |
| B10 | D72 cited but unverifiable from the survey material | Minor | **Rebutted.** D72 exists in this corpus: ROADMAP.md defines the dual-mode parity gate as D72 and this directory's README indexes it. The citation stands. |
| A5–A8, B2–B9 | Minors: benchmark ran Lua 5.3.6 on one non-conclusive workload; Duktape dormancy double-counted and overstated (ES5.1 plus a partial ES2015/2016 subset; TIC-80 is an open proposal); bellard upstream "near-dormant" overstated; os.Worker is a quickjs-libc runtime feature, not an ng core addition; npm bundlable-library gain omitted; no sensitivity analysis; lua_yieldk caveat missing; Luau interrupt-across-coroutines and GC cells under-cited | Minor | **All amended.** Benchmark caveats inline; Duktape dormancy charged once under maintenance and its sandbox scored on design; TIC-80 and bellard phrasing corrected; os.Worker re-attributed with the canonical citation; the npm gain added with counterweights; the sensitivity note added to §3; the lua_yieldk and Luau-verification caveats sit in the coroutines cells; the Luau GC cell rests on the Warframe motive; general-knowledge cells flagged as such. |

Decision pending the maintainer's grilling session; Lua 5.4 remains the locked choice until a D-entry supersedes it.
