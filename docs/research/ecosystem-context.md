# Ecosystem context: Carbon's open-sourcing and the 2026 Odin/Lua/Go landscape

Research-era record. Decision numbers here use the research-era scheme; docs/decisions/README.md carries the mapping to the current log.

Snapshot date: **2026-07-12**

This file is a second, deeper research pass alongside the existing Codex
corpus in this directory ([README.md](README.md),
[carbon-architecture.md](carbon-architecture.md),
[carbon-inventory.md](carbon-inventory.md),
[glossary-candidates.md](glossary-candidates.md),
[successor-engine-plan.md](successor-engine-plan.md),
[svsw-evidence.md](svsw-evidence.md)). Those files were produced from direct
repository/source inspection. This file is produced from external web
research and covers two things the repository inspection could not: (1) the
public/corporate background of why Carbon is open source at all, and (2)
what already exists in the wider Odin/Lua/Go ecosystem in 2026, independent
of Carbon. Nothing here modifies or supersedes the existing files; treat
disagreements as a prompt to reconcile, not to overwrite.

All content below was gathered by web search and is reported as claims with
sources, not independently re-verified against primary repositories the way
the Codex files verified the local Carbon clone. Read it at **Observed
(external report)** confidence, one notch below the Codex corpus's directly
inspected findings; see the evidence-status legend in
[README.md](README.md#evidence-status-legend).

---

## Part 1. Background: why Carbon is open source

### 1.1 Corporate context and release mechanics

| Fact | Source |
|---|---|
| On 2026-07-01, Fenris Creations (the studio formerly known as CCP Games, renamed after Pearl Abyss sold it back to its management team in a ~$120M deal in May 2026) announced Carbon had completed its transition to open source, hosted at the `carbonengine` GitHub org. | [gamingonlinux.com](https://www.gamingonlinux.com/2026/07/carbon-engine-framework-powering-eve-online-is-now-open-source/) |
| The release spans 20+ Carbon modules: Destiny (world simulation/physics/pathfinding), Trinity (rendering), plus networking, UI, audio, resource management, scripting, and scheduling. | [github.com/orgs/carbonengine/repositories](https://github.com/orgs/carbonengine/repositories) |
| Most modules (core, trinity, destiny) are MIT licensed; some use Apache License 2.0 or the Python Software Foundation License. | [cdkeyprices.com](https://cdkeyprices.com/news/eve-online-s-carbon-engine-goes-fully-open-source-on-github) |
| CCP first announced plans to open-source Carbon in 2024, while still operating as CCP Games; the July 2026 release completes that plan. | [gamingonlinux.com](https://www.gamingonlinux.com/2026/07/carbon-engine-framework-powering-eve-online-is-now-open-source/) |
| Fenris published contribution guidelines (PR templates, testing requirements) including a rule that contributors must disclose LLM/AI-tool use when writing submitted code. | [news.ycombinator.com](https://news.ycombinator.com/item?id=48780387) |

**Corroboration with the Codex corpus:** the license mix reported here (mostly
MIT, some Apache-2.0, some PSF) matches
[carbon-inventory.md](carbon-inventory.md)'s directly-inspected license
survey almost exactly: 30/33 repos root-MIT, `io` (embedded CPython) is
PSF-2.0, `spatial-audio-clustering` is Apache-2.0. This corroborates a Codex
finding rather than adding new information, but it confirms the local
clone's license state matches the public announcement rather than a stale or
partial mirror.

### 1.2 Stated motivation

| Fact | Source |
|---|---|
| Ben Hunter, Senior Development Director for Core Technology at Fenris, framed the release around transparency, longevity, and the belief that persistent-world tech grows stronger when more people can study, challenge, and build on it, tying the move to EVE Frontier's moddable, player-shaped world vision. | [massivelyop.com](https://massivelyop.com/2026/07/01/eve-onlines-fenris-creations-just-open-sourced-the-carbon-engine-framework-its-built-on/) |
| Fenris kept EVE Online's in-game economy systems closed (an estimated ~$50M/year in turnover flows through it) while open-sourcing the engine framework around it. | [vgtimes.com](https://vgtimes.com/gaming-news/159966-eve-onlines-carbon-engine-goes-open-source-on-github-key-economy-systems-remain-closed.html) |

This is a named precedent for opening the engine while keeping economically
load-bearing game-specific systems closed. It matters only if SVSW's own
open-source posture is revisited later; the successor-engine-plan does not
depend on it, and [successor-engine-plan.md](successor-engine-plan.md) makes
no open-source licensing decision of its own.

### 1.3 Module identity (spot facts, useful for cross-checking the inventory)

| Repo | Description (as published) | License | Source |
|---|---|---|---|
| `carbonengine/destiny` | "Core game world simulation engine for MMOs whose titles start with Eve," C++ | MIT | [github.com/carbonengine/destiny](https://github.com/carbonengine/destiny) |
| `carbonengine/trinity` | "Rendering engine for the Carbon Game Engine," C++ | MIT | [github.com/carbonengine/trinity](https://github.com/carbonengine/trinity) |
| `carbonengine/core` | Generic low-level functionality and cross-platform system-call abstractions | MIT | [github.com/carbonengine/core](https://github.com/carbonengine/core) |
| `carbonengine/scheduler` | Channels + scheduler for Greenlet coroutines | (see §1.4) | [github.com/carbonengine/scheduler](https://github.com/carbonengine/scheduler) |

These four match [carbon-inventory.md](carbon-inventory.md)'s per-repo table
role/stack columns; no discrepancy found.

### 1.4 The Stackless → Greenlet scheduler history

This is the one new finding in this pass relative to the existing Codex
corpus: it explains *why* Carbon Scheduler looks the way it does, something
[carbon-architecture.md](carbon-architecture.md) documented from source but
without this history.

| Fact | Source |
|---|---|
| `carbonengine/scheduler`'s own README states tasklet/channel scheduling order and behavior "has been designed to match that of Stackless Python as closely as possible," implementing only the subset of the Stackless API Carbon needs. The codebase is about 60% C++ and 30% Python bindings. | [github.com/carbonengine/scheduler](https://github.com/carbonengine/scheduler) |
| CCP adopted Stackless Python for concurrency control in a large-scale shared-state simulation: tasklets, channels, and a non-preemptive scheduler make single-threaded execution "feel" multi-threaded (task separation, shared memory) while running exactly one task at a time, letting high-level game logic read as straightforward synchronous code. | [en.wikipedia.org/wiki/Stackless_Python](https://en.wikipedia.org/wiki/Stackless_Python) |
| CCP upgraded Carbon from Stackless Python 2.7 to Stackless Python 3.8.1 (finished November 2023), then moved off Stackless to plain CPython 3.12 because Python 3.8 was slated for deprecation (Oct 2024) and Stackless Python itself was to be archived read-only (Feb 2025). This forced migration produced the new Greenlet-based Carbon Scheduler. | [nosygamer.blogspot.com](https://nosygamer.blogspot.com/2025/05/fanfest-2025-upgrading-carbon-to-python-3.html) |
| Presented at EVE Fanfest 2025 as "Scheduling in Carbon: Leaving Stackless Python Behind" (CCP ToeBeans and CCP Cookies): covered game loops, coroutines, and how the scheduling model was adapted to Python 3 using Greenlet in place of Stackless. | [youtube.com/watch?v=-x299qHLQs0](https://www.youtube.com/watch?v=-x299qHLQs0) |
| A companion Fanfest 2025 talk, "Upgrading CARBON to Python 3," covered the broader migration effort of moving the whole Carbon platform off Stackless Python 2/3.8 onto vanilla CPython 3.12. | [youtube.com/watch?v=4uaEhx7LNAc](https://www.youtube.com/watch?v=4uaEhx7LNAc) |

**Reconciling with the existing Codex finding.**
[carbon-architecture.md](carbon-architecture.md) already concluded, from
direct source inspection, that "Carbon Scheduler/IO is a cooperative
application runtime for making Python network code look blocking, not a
deterministic gameplay scheduler," and listed "any claim that Carbon
Scheduler is a determinism mechanism transferable to Odin simulation" under
**Transfers to reject**. This external history does not overturn that
conclusion: it explains why the scheduler exists and shows the inspected
code as the end state of a forced, cross-release migration spanning two
Fanfest talks, rather than an intentional from-scratch design. The property
CCP preserved across that migration was **scheduling order and channel
semantics** ("as closely as possible" to Stackless), not any particular
coroutine primitive. That is a useful data point for SVSW's own D11
determinism guarantee (engine-seeded PCG32, fixed timestep, ordered ECS
iteration): if SVSW's Lua runtime is upgraded or swapped, the Carbon
precedent suggests preserving ordering and scheduling semantics exactly,
not the specific VM. This is a general engineering lesson, not a new svsw
decision. It does not touch D11 or any other logged decision, and no such
change is proposed here.

At the same "not proof of anything for Go" level
[carbon-architecture.md](carbon-architecture.md) already used for the rest
of Carbon: none of this scheduler history involves Go, so it says nothing
about [successor-engine-plan.md](successor-engine-plan.md)'s proposed
three-call Go/Odin worker protocol.

---

## Part 2. The 2026 ecosystem reality for Odin + Lua + Go

[carbon-inventory.md](carbon-inventory.md) already established, from a
direct language scan of all 33 Carbon repos, that **Carbon contains zero Go,
zero Odin, and exactly one non-gameplay Lua file** (a Wwise Premake build
script). Carbon therefore cannot validate SVSW's specific language choices.
This section asks a different question: independent of Carbon, what prior
art and library support exists for each leg of the Odin/Lua/Go stack as of
2026?

### 2.1 Odin as a production engine language

| Fact | Source |
|---|---|
| By late 2025/early 2026 Odin matured from a niche experimental language into a production-proven tool, validated by JangaFX's commercial suite (EmberGen, LiquiGen, GeoGen) and a growing catalog of Steam releases. | [webdev.today](https://www.webdev.today/game-development/c-to-odin-game-engine-migration-2026) |
| JangaFX's EmberGen, a real-time volumetric fluid simulator used in production by Bethesda, CAPCOM, Codemasters, THQNordic, Warner Bros, and Weta Digital, is written in Odin. | [odin-lang.org/showcase/embergen](https://odin-lang.org/showcase/embergen/) |
| Odin's official showcase catalogs production/notable projects (EmberGen, Solar Storm, and more) alongside community libraries and bindings. | [odin-lang.org/showcase](https://odin-lang.org/showcase/) |
| The community-maintained `awesome-odin` list aggregates libraries, bindings, software, and resources across the ecosystem. | [github.com/jakubtomsu/awesome-odin](https://github.com/jakubtomsu/awesome-odin) |
| Karl Zylinski shipped *CAT & ONION*, a cat-adventure game built in Odin + Raylib, with full source available on itch.io and on Steam. He runs Odin game jams (one drew 62 submissions) and writes on "no-engine gamedev" patterns using Odin + Raylib. | [zylinski.se](https://zylinski.se/posts/no-engine-gamedev-using-odin-and-raylib/) |

This is independent, non-Carbon evidence that Odin works as an engine
language at more than one scale: JangaFX validates it against AAA customers,
and Zylinski validates it via a shipped, self-published game. Neither
project resembles SVSW's deterministic-ECS/sandboxed-mod architecture, so
this is language-maturity evidence only, not architecture evidence.

### 2.2 Odin vendor/community library coverage relevant to SVSW's stack

| Area | Library | Status | Source |
|---|---|---|---|
| sokol bindings | `floooh/sokol-odin` | Official-quality bindings for the sokol single-header C libraries | [github.com/floooh/sokol-odin](https://github.com/floooh/sokol-odin) |
| Windowing/audio/UI | `vendor:sdl2`, `vendor:glfw`, `vendor:raylib`, `vendor:microui`, `vendor:miniaudio` | Pre-configured, officially maintained in Odin's `vendor` library | [pkg.odin-lang.org/vendor](https://pkg.odin-lang.org/vendor/) |
| Graphics APIs | OpenGL, Vulkan, Direct3D11/12, Metal, wgpu, WebGL 1&2 | Official vendor bindings | [pkg.odin-lang.org/vendor](https://pkg.odin-lang.org/vendor/) |
| Vulkan (detail) | `vendor:vulkan` | Official wrapper generated from `vulkan_core.h` | [pkg.odin-lang.org/vendor/vulkan](https://pkg.odin-lang.org/vendor/vulkan/) |
| wgpu (detail) | `vendor:wgpu` | Official binding, currently tracking wgpu v29.0.0.0; backends include Vulkan, D3D11/12, Metal, GL/GLES, WebGPU | [pkg.odin-lang.org/vendor/wgpu](https://pkg.odin-lang.org/vendor/wgpu/) |
| Physics | `vendor:box2d` (official) plus third-party `cr1sth0fer/odin-box2d` for Box2D 3.0 | Official + community options | [pkg.odin-lang.org/vendor/box2d](https://pkg.odin-lang.org/vendor/box2d/) |
| Lua | `vendor:lua/5.1`..`5.4` (official, `lua`/`luaopen`/`luaL` prefixes trimmed, namespaced by package); community alternatives `jasonliang-dev/odin-lua` (5.4.4 + LuaJIT) and `SrMordred/odin-lua` (5.3) | Official coverage of exactly SVSW's Lua 5.4 target, plus community options | [github.com/odin-lang/Odin/tree/master/vendor/lua](https://github.com/odin-lang/Odin/tree/master/vendor/lua) |

Read against SVSW's dependency-quarantine policy (`CLAUDE.md`: check
`core:`/`vendor:` stdlib coverage first, pin by checksum, record provenance
in `VENDOR.md`, treat unreviewed vendored source as untrusted), this table
shows the "check vendor: first" step already resolves for the two areas SVSW
is most likely to extend next (physics, alternate GPU backends): official
`vendor:box2d`, `vendor:vulkan`, and `vendor:wgpu` all exist and remove the
need to invent bindings, though each is still a new third-party/semi-official
dependency requiring its own pin-and-review pass under that same policy.
This is a note that the option exists and is well-trodden, not a decision to
vendor any of them. It does not touch `engine/render/gpu`'s current
sokol-only D15 boundary.

### 2.3 Lua-in-engine prior art: Defold

Defold is the closest real-world precedent found for SVSW's
scripting-boundary design (per-mod capability limits, hot reload,
sandboxing), independent of Carbon (which has no real gameplay Lua at all).

| Fact | Source |
|---|---|
| Defold embeds Lua (LuaJIT where supported, else Lua 5.1) as its gameplay scripting layer, with distinct script types (Game Object scripts, GUI scripts, Render scripts) each exposing a different subset of engine functions through predefined lifecycle callbacks. | [defold.com/manuals/lua](https://defold.com/manuals/lua/) |
| Defold's `game.project` `shared_state` setting controls whether all scripts/GUI scripts/the render script share one Lua context (global visibility) or run in separate isolated contexts. | [defold.com/manuals/script](https://defold.com/manuals/script/) |
| Defold supports Lua module-based code reuse across game-object and GUI scripts, and allows extending the engine with native code for platform access or performance-critical work Lua can't handle. | [defold.com/manuals/writing-code](https://defold.com/manuals/writing-code/) |

Two things here are relevant to open questions elsewhere in this research
directory, without resolving them:

- Defold's per-script-type function exposure (GO vs. GUI vs. Render scripts
  seeing different API subsets) is a shipped, real-world precedent for the
  project rule "Lua sees only the scripting boundary" and for D42's
  registrar-tier pattern (`script/{audio,render,ui,input,texture,random}` as
  opt-in packages) referenced in `svsw-evidence.md`'s gap list. Defold proves
  the *pattern* (capability-scoped Lua contexts) ships in a real engine; it
  does not prove SVSW's specific tier design is correct.
- Defold's `shared_state` toggle is a concrete precedent for the
  isolated-vs-shared Lua-context question that SVSW's per-mod VM sandboxing
  already answers one way (isolated per mod). It matters only if SVSW's
  sandbox boundary is revisited, not as a reason to change it now.

### 2.4 Go game-server prior art: Nakama

| Fact | Source |
|---|---|
| Nakama (Heroic Labs) is a monolithic stateful server written in Go, exposing real-time and non-real-time APIs; its architecture separates a server core (config/logging), in-memory state registries, business systems (leaderboards, social), and a multi-language runtime (Lua, JS/TypeScript, native Go plugins) for custom server logic. | [heroiclabs.com/docs](https://heroiclabs.com/docs/nakama/getting-started/architecture/) |
| Nakama's multiplayer model is server-authoritative: the server validates all gameplay inputs, enforces rules via server-side code, and broadcasts validated state changes. Public sources surfaced no lockstep or rollback-netcode specifics for Nakama. | [github.com/heroiclabs/nakama](https://github.com/heroiclabs/nakama) |

Nakama is the closest architectural sibling found for a future SVSW Go
server layer: same language, a comparable core/registries/business-logic/
scripting-runtime split, and Lua as one of its supported runtime scripting
languages too. But its authoritative-validation model is not lockstep or
rollback, so it is prior art for the *surrounding* server concerns (auth,
matchmaking, leaderboards, social, a multi-language plugin runtime) rather
than for the specific [successor-engine-plan.md](successor-engine-plan.md)
worker protocol (`Worker_Open`/`Worker_Advance_One_Tick`/`Worker_Close`) or
for any of the three undecided replication experiments (A: server-ordered
lockstep, B: full authoritative snapshots, C: baseline+deltas) named there.
Nothing found in this pass resolves which of those three wins; Nakama
confirms only that it wasn't built to answer that question either.

### 2.5 The gap: no Odin+Lua+Go engine precedent as a combined stack

Web research turned up independent prior art for each *leg* of SVSW's stack
in isolation (Odin as a production engine language, Lua as a sandboxable
gameplay layer via Defold, Go as a stateful multi-language game server via
Nakama), but no project combining all three the way SVSW does. This matches
and reinforces, from a different angle, the Codex corpus's own stated
limitation: Carbon has zero Go and zero real gameplay Lua, so it cannot
validate SVSW's two most novel architectural bets, the Go multiplayer
control plane and the sandboxed-Lua gameplay boundary. This second pass
found no external substitute that closes that gap: the Odin+Lua+Go
combination remains validated only layer-by-layer, never as a whole,
anywhere in the material surveyed across both research passes.

---

## Cross-reference summary

| This file's section | Complements / corroborates |
|---|---|
| §1.1–1.3 (release mechanics, licenses, module identity) | [carbon-inventory.md](carbon-inventory.md) license table and per-repo inventory (independent corroboration, no discrepancy) |
| §1.4 (Stackless → Greenlet history) | [carbon-architecture.md](carbon-architecture.md)'s Carbon Scheduler findings (adds historical *why*, does not change the existing "not a determinism mechanism" conclusion or the "Transfers to reject" list) |
| §2.1–2.2 (Odin maturity, vendor coverage) | Not previously covered by the Codex corpus (which is Carbon/SVSW-source-focused); informs but does not change SVSW's D15 sokol-only platform-tier rule or its `VENDOR.md` quarantine policy |
| §2.3 (Defold) | [svsw-evidence.md](svsw-evidence.md)'s gap notes on the Lua sandbox boundary and D42's registrar-tier pattern; [glossary-candidates.md](glossary-candidates.md)'s unresolved "Engine SDK" term |
| §2.4 (Nakama) | [successor-engine-plan.md](successor-engine-plan.md)'s Go multiplayer-shell responsibilities and the still-undecided replication bake-off (A/B/C) |
| §2.5 (combined-stack gap) | [README.md](README.md)'s "Carbon is concept and failure-pattern evidence, not proof" framing; [carbon-inventory.md](carbon-inventory.md)'s zero-Go/zero-Odin/one-non-gameplay-Lua language scan |

## Status and limits

- This is external web-research reporting, not source inspection. Where it
  overlaps with a Codex finding it is offered as corroboration, not as a
  replacement citation.
- No file in this directory was overwritten, deleted, or edited to produce
  this one.
- Nothing here resolves any of the open questions already logged in
  [glossary-candidates.md](glossary-candidates.md) or the "Next decision
  needed" section of [README.md](README.md) (the private product
  requirements, the Beads migration owner). It also does not reconcile against svsw's own logged
  decisions D41 (Go server archetypes / Rust tripwire) or D42 (a-la-carte
  Odin SDK tiers) referenced in `svsw-evidence.md`'s gap list. This pass did
  not re-read `docs/README.md` in the svsw repository, so that
  reconciliation remains outstanding, not newly closed.
