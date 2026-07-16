# Carbon repository deep dives

Snapshot date: **2026-07-12**

This is a second, deeper research pass over the same 33 `carbonengine`
repositories catalogued in [carbon-inventory.md](carbon-inventory.md). It does
not replace or overwrite the existing Codex documents — it complements them
with per-repo detail: subsystems with file paths, architecture patterns, the
Python/Blue integration shape, concrete Odin-mapped ideas, and anti-lessons.
Cross-references:

- [README.md](README.md) — executive summary and document index.
- [carbon-inventory.md](carbon-inventory.md) — the verified 33-repo snapshot,
  HEADs, licenses, dependency-submodule caveat.
- [carbon-architecture.md](carbon-architecture.md) — the observed Carbon
  runtime architecture (boot, scripting, scheduling, rendering, content).
- [svsw-evidence.md](svsw-evidence.md) — implemented SVSW capabilities to
  compare against.
- [successor-engine-plan.md](successor-engine-plan.md) — the proposed
  Odin/Lua/Go architecture these ideas feed into.
- [glossary-candidates.md](glossary-candidates.md) — unresolved terminology.

**Source and evidence status.** This document is built entirely from a set of
structured per-repo survey JSON records supplied to the writing pass, not from
a fresh independent clone inspection. Per this project's evidence-status
convention (see README.md's legend), treat every claim below as **Historical /
Reported** unless cross-checked against a live repository path — several
per-repo sections below cite concrete file paths from that survey and should
be spot-checked against the actual clone at
`/Users/ivandrenjanin/projects/carbon/<repo>` before being treated as
Observed. One entry (`core`, surveyed under the name `carbon-core`)
originally arrived in the source data as a placeholder/test stub
(`purpose: "test"`, fabricated subsystem/idea names `"a"`/`"b"`) rather than
real survey content; its section below has since been replaced with a
first-hand re-survey of the actual clone at
`/Users/ivandrenjanin/projects/carbon/core` (2026-07-12), so unlike the rest
of this document that section can be treated as Observed rather than
Historical / Reported. No instruction text was found embedded in any
survey record; all record content was treated strictly as data.

Repos are ordered alphabetically by their canonical repository name (matching
`carbon-inventory.md`), with the survey's own component name noted in
parentheses where it differs.

## Summary table

| Repo | Role | License | Relevance |
|---|---|---|---|
| [`.github`](#github-carbon-github-meta) | Org meta files (README/SECURITY/CODE_OF_CONDUCT); no engine code | None (code repo has no LICENSE; CODE_OF_CONDUCT is CC BY 3.0) | Low |
| [`audio`](#audio-carbon-audio) | Wwise-backed audio engine: SoundBanks, spatial audio, sound prioritization/culling, IO hook | MIT | High |
| [`blue`](#blue-carbon-blue) | Embedded-Python application shell: main loop, resource manager, object proxy/builder, tasklet IO | MIT (+ bundled BSD/MD5/OZ.COM notices) | Medium |
| [`blueexposure`](#blueexposure) | C++/Python reflection & binding-generation library; COM-like object model (IRoot/IID/Clsid) underlying all of Blue | MIT | High |
| [`core`](#core-carbon-core) | Foundation C++ primitives: tracked/guarded memory, threading, Tracy telemetry, logging, asserts — linked directly by `blue`/`trinity`/`destiny`/`exefile` | MIT | High |
| [`d3dinfo`](#d3dinfo) | DirectX 11/12 capability probe exposed to Python | MIT | Low |
| [`db`](#db-carbon-db) | OLE DB / SQL Server access with tasklet-friendly async | MIT | Low |
| [`destiny`](#destiny) | EVE's server-authoritative 3D world simulation (Ballpark): movement, collision, spatial partition | MIT | Medium |
| [`exefile`](#exefile-carbonexefile) | Native OS bootstrap executable: CPython/Stackless init, dynamic Blue loading, crash reporting | MIT | Medium |
| [`exefileconsole`](#exefileconsole) | Windows console-passthrough launcher shim | MIT | Low |
| [`geo2`](#geo2) | DirectXMath vector/matrix math exposed to Python as a C extension | MIT | Medium |
| [`grpc`](#grpc-carbon-grpc) | Template C++/Python gRPC client base classes (Broker/Publisher/Consumer) | MIT | Low |
| [`imageio`](#imageio) | CPU-side bitmap load/decode/encode (BMP/DDS/JPEG/PNG/PSD/TGA/VTA/NanoVDB) | MIT | Medium |
| [`imagetools`](#imagetools) | Python-exposed texture manipulation & BC1-7/DXT compression (NVTT/Compressonator) | MIT | Medium |
| [`ime`](#ime) | IME (CJK text composition) exposed to Python for chat/UI text fields | MIT | Low |
| [`io`](#io-carbon-io-carbonio) | Patched CPython socket/ssl/select modules rebuilt on libuv for tasklet-suspending async IO | PSF-2.0 | Medium |
| [`localization`](#localization-carbon-localization) | Message-table string localization, markup substitution, pluralization, collation | MIT | Low |
| [`math`](#math-carbon-math) | Vector/matrix/quaternion/plane/color/bounds math library over DirectXMath | MIT | High |
| [`mesh`](#mesh-carbon-mesh-cmf-library) | CMF binary mesh/skeleton/animation format + runtime + offline processor/viewer | MIT | High |
| [`parser`](#parser-ccpparser) | Standalone bytecode-compiled math-expression parser/VM | MIT | Medium |
| [`pathfinder`](#pathfinder) | A*/flood-fill routing over EVE's static universe graph | MIT | Medium |
| [`pdm`](#pdm-platform-detection-module) | Hardware/OS/driver/VM-detection profiling library + CLI | MIT | Low |
| [`pdm-proto-wrapper`](#pdm-proto-wrapper) | Serializes `pdm` output into versioned Protobuf | MIT | Low |
| [`prometheus`](#prometheus-eve-monolith-prometheus) | prometheus-cpp wrapper exposed to Python as a CPython extension | MIT | Low |
| [`red-to-black-converter`](#red-to-black-converter) | CLI: bakes `.red` YAML resources into `.black` binary, parallelized | MIT | Low |
| [`resources`](#carbonresources) | Resource-group/bundle/patch build-time asset-delivery pipeline (bsdiff patching) | MIT | Medium |
| [`scheduler`](#carbon-scheduler) | Greenlet-based cooperative tasklet scheduler + CSP channels for Blue | MIT | Medium |
| [`spacemouse`](#spacemouse) | 3Dconnexion SpaceMouse 6DOF input exposed to Python | MIT | Low |
| [`spatial-audio-clustering`](#spatial-audio-clustering) | Wwise plugin: clusters spatial audio objects under a hard concurrency cap | Apache-2.0 | Medium |
| [`trinity`](#trinity-carbon-rendering-engine) | 3D/2D rendering engine: scene graph, render-job/step graph, resources, raytracing | MIT (+ md5.cpp/lempar.c notices) | Medium |
| [`trinityaudioapi`](#trinityaudioapi) | Header-only interface contract between Trinity (renderer) and Carbon Audio | MIT | Low |
| [`vcpkg-registry`](#vcpkg-registry) | vcpkg package registry/build metadata pinning all ~25 native Carbon components | MIT | Medium |
| [`videoplayer`](#carbon-videoplayer) | WebM (VP8/VP9+Vorbis) video player over Trinity textures & pluggable audio sinks | MIT | Medium |

Note: the survey provided exactly 33 component records, matching the 33-repo
count in `carbon-inventory.md`; `carbon-github-meta` maps to `.github`,
`carbon/exefile` to `exefile`, `carbon/resources` to `resources`,
`ExeFileConsole` to `exefileconsole`, `blueexposure` and `carbon-scheduler`
retain their given names.

---

## `audio` (`carbon-audio`)

**Purpose.** Wwise-backed audio engine for EVE Online / EVE Frontier: Wwise
SDK lifecycle, SoundBank load/unload, 3D/spatial audio (geometry-based
occlusion via Wwise Spatial Audio), a custom sound-prioritization/culling
system bounding concurrently "awake" Wwise game objects, and a low-level async
file IO hook resolving Blue virtual paths to SoundBank/media files.

**Role in the engine.** Leaf/service component parallel to `trinity`
(renderer) and `destiny` (sim); consumed by game/Python code via Blue. No
compile-time dependency on `trinity` or `destiny` — 3D position data is passed
in by the caller as plain vectors, illustrating Carbon's general pattern of
domain engines communicating through narrow value types rather than direct
coupling.

**Key subsystems:**

| Subsystem | File paths | What |
|---|---|---|
| `AudManager` | `src/AudManager.h/.cpp/_Blue.cpp` | Global facade/singleton: Wwise init/term, SoundBank tracking, RTPC/state/switch setters, per-tick `OnTick` |
| `AudGameObjResource` hierarchy | `src/AudGameObjResource.h/.cpp`, `AudEmitter.*`, `AudListener.*`, `AudUIPlayer.*`, `AudMusicPlayer.*` | Wraps one Wwise `AkGameObjectID`; implements `IPrioritizedObject` for culling |
| `SoundPrioritization` | `src/SoundPrioritization.h/.cpp`, `IPrioritizedObject.h` | Weighted-scoring culling: caps "awake" objects at `maxAwakeGameObjects` |
| `LowLevelIOHook` / `AudPathResolver` | `src/LowLevelIO/LowLevelIOHook.h/.cpp`, `AudPathResolver.h/.cpp` | Implements Wwise's async file IO interfaces; resolves virtual/Blue paths |
| `WaapiManager` | `src/WAAPI/WaapiManager.h/.cpp/_Blue.cpp` | Wwise Authoring API connection for editor/tooling |
| Blue exposure layer | `src/*_Blue.cpp` (13 files) | Per-class Python exposure only, via `EXPOSE_TO_BLUE`/`EXPOSURE_BEGIN`/`MAP_ATTRIBUTE`/`MAP_PROPERTY`/`MAP_METHOD_AND_WRAP` |

**Architecture patterns.** Manager + resource-object split (facade owns
lightweight per-entity wrappers); interface segregation (`IPrioritizedObject`
decouples generic culling from audio specifics); delegation macros
(`DELEGATE_GETTER`/`SETTER`) forwarding a facade's public API to owned
single-responsibility subsystem objects; strict two-file-per-class binding
split (`ClassName.cpp` vs `ClassName_Blue.cpp`); weighted-score
culling/prioritization as a pure static function run over all registered
objects each tick; explicit lifecycle state machine (`AudioState` enum in a
`std::atomic`) re-exposed to script as a plain int, not a native enum.

**Python/Blue integration.** Every class: `ClassName.h/.cpp` (pure C++) +
`ClassName_Blue.cpp` (only `BLUE_CLASS`/`EXPOSE_TO_BLUE`/`EXPOSURE_BEGIN`/
`MAP_ATTRIBUTE`/`MAP_PROPERTY`/`MAP_METHOD_AND_WRAP`). Enums cross via
`BLUE_REGISTER_ENUM` with a `VarChooser` string-to-int table. A higher-level
convenience API (`python/audio2/audiomanager.py`) wraps the raw C++ manager in
Python, hiding SoundBank bookkeeping — the raw binding stays low-level and
mechanical, ergonomics live in Python.

**Ideas worth stealing (Odin mapping):**

| Idea | Odin mapping |
|---|---|
| Interface segregation for cross-system concerns (`IPrioritizedObject`) | Flatten into ECS: an `audio_priority` component + `system_cull_audio`, no vtable needed |
| Weighted single-score culling formula driving a hard "awake" cap | Pure Odin proc, POD params -> f32, tunable via `svsw.data`; keep deterministic only if it runs inside the sim tick |
| Physical separation of binding glue from core logic (one file per class) | Matches SVSW's D42 opt-in `svsw.*` binding packages already; confirms the pattern scales |
| Lifecycle enum exposed to script as plain int, not native enum | Expose Odin enums to Lua as small ints/strings via a lookup table registered once |
| Isolated low-level IO hook delegating path resolution to a small testable helper | Keep "resolve virtual path to concrete path" as an isolated, unit-testable Odin proc separate from actual OS IO |

**Anti-lessons.** Wwise SDK is paid middleware — target a lightweight
cross-platform backend (miniaudio-class) instead; SoundBank/WAAPI/precache
splits solve MMO-scale asset-streaming problems irrelevant at indie scale;
Windows-only raw async IO (`OVERLAPPED`, `AK::ObjectPool`) not worth
replicating; the `BLUE_CLASS`/`MAP_METHOD_AND_WRAP` macro layer generates
heavy boilerplate per class — SVSW's D42 hand-written bindings should stay far
smaller; global mutable singletons (`g_audioManager`, `g_shuttingDown`)
conflict with ECS-first, no-global-mutable-sim-state discipline (D11).

---

## `blue` (`carbon-blue`)

**Purpose.** The C++/Python glue layer: embeds Stackless Python, owns the
application main/game loop, resource manager (`BlueResMan`), object
proxy/builder system for LOD-managed resident objects, callback/thread-pool
manager, memory tracking, and async IO scheduling (`StacklessIO`) dispatching
Python tasklets.

**Role in the engine.** Blue *is* the application shell, not a library the
engine calls into — it owns `BlueRunStackless()` and the main loop; other
Carbon components (`trinity`, `destiny`, `audio`, etc.) register against it
and call back into its `IBlueObjectBuilder`/`IBlueResMan`/`IBlueCallbackMan`
interfaces. This inversion (script language drives the loop) is architecturally
the opposite of SVSW's design.

**Key subsystems:**

| Subsystem | File paths | What |
|---|---|---|
| Object proxy/builder (LOD residency) | `include/IBlueObjectProxy.h`, `IBlueObjectBuilder.h`, `src/BlueObjectProxy.h/.cpp` | Lazy resident/non-resident object construction, possibly yielding mid-build; LRU-style eviction |
| Resource manager (`BeResMan`) | `include/IBlueResMan.h`, `src/BlueResMan_Blue.cpp`, `BlueResFileSystemLocal.cpp` | Path+ext+IID resource cache; async callback dispatch; background-load memory budget |
| Python/C++ glue | `include/BluePyCpp.h`, `BluePySwrap.h` | `PyMalloc`/allocator routing, `PyError` exception capture, `PyGilEnsure`/`PyAllowThreads` RAII GIL guards, `BluePySWrap<T>` opaque native-payload capsules |
| Stackless scheduler + async IO | `src/PyScheduler.h`, `include/stacklessio.h`, `TaskletTimer.h/_Blue.cpp` | Runs tasklets for up to N seconds/frame; `IOEventQueue` bridges worker-thread blocking IO to tasklet channels |
| Callback manager/thread pool | `include/IBlueCallbackMan.h` | Urgent/fence-flagged work queue, N worker threads, throttle hooks |
| Object metadata/persistence | `include/IBlueObjectMetadata.h`, `src/BlackReader.h/.cpp`, `YamlReader.cpp` | Sidecar string->string tag map; binary (`.black`) and YAML (`.red`) object-graph serialization |
| Memory/stats instrumentation | `src/BlueMemoryTracker.h/.cpp`, `include/BlueStatistics.h/.cpp` | Engine-wide allocation and perf-zone tracking baked into hot paths |

**Architecture patterns.** See subsystems above; notably the "freeze/thaw"
object-residency model and multi-queue callback manager with urgent/fence
flags are MMO-scale streaming machinery.

**Python/Blue integration.** `Ccp::PyMalloc`/`PyAllocator` route C++
allocation through Python's allocator; `PyError` captures `PyErr_Fetch` state
as a throwable C++ exception (`PyRaisable` lets any C++ exception re-raise
into Python); `PyErrFromException()` maps C++ exception types to Python
exception types at one funnel; `PyGilEnsure`/`PyAllowThreads` are RAII GIL
guards; `BluePySWrap<T>` wraps arbitrary C++ payloads in a `PyCapsule`
(Python-2.6 `PyCObject` fallback still present). Stackless tasklets +
`StacklessIO` give async IO without OS threads on the calling side; a
"dustbin" defers final object deletion to a GIL-held pass. The header itself
flags this whole subsystem as legacy, slated for replacement by
`carbon-io`/`carbon-scheduler`.

**Ideas worth stealing (Odin mapping):**

| Idea | Odin mapping |
|---|---|
| Single typed boundary exception (`PyError`/`PyRaisable`) capturing error state once, re-raisable into either language | One `Lua_Error` type (message + traceback) all `svsw.*` binding code raises/propagates uniformly |
| RAII interpreter-lock guards (`PyGilEnsure`) that always restore state even across exceptions | A defer-based guard reconstructing Odin `context` before any Lua-callback entry point touches allocator state |
| Opaque native-payload capsules (`BluePySWrap<T>`) with a destructor-identity type check instead of RTTI | Lua userdata + metatable identity check; reuse the "compare identity cheaply" trick for boundary validation |
| Bounded background-load memory budget + explicit main/background dispatch queues + urgent override | A bounded background-load budget plus a main-thread pump function for SVSW's asset pipeline |
| Generic metadata sidecar (string->string map on any object) | Lightweight tag/property bag on ECS entities/assets for editor/tooling metadata, only if a concrete need arises |

**Anti-lessons.** The whole architecture is Python-as-application-shell —
opposite of svsw's Lua-sandboxed-under-deterministic-Odin-kernel design (D11);
do not import "script drives the loop." Stackless Python is CCP's own
recognized legacy/technical debt (their comment: "about to be replaced").
Heavy Windows-only code paths (IOCP, `HANDLE` wakeup, Perforce-only build
instructions) — none worth porting. Global allocator overrides
(`operator new`/`delete` replaced per-module) are C++-specific accidental
complexity with no Odin analog. `PyCObject` fallback for Python 2.6 is
dead-weight multi-version-compat cruft — keep SVSW's one-current-version
toolchain policy instead.

---

## `blueexposure`

**Purpose.** The binding-generation library itself: reflection macros and
templates exposing C++ classes/methods/attributes/enums/callbacks to embedded
CPython, plus the COM-like base object system (`IRoot`, `Clsid`, `IID`,
`QueryInterface`) the rest of Carbon's C++ is built on.

**Role in the engine.** This is "blue"/Blue's scripting-boundary substrate —
analogous to what a Lua binding layer is for SVSW, except it is *also* the
base OOP substrate of the whole engine (every exposed class inherits `IRoot`),
an unusual and strong coupling point worth noting as something SVSW's Lua
boundary deliberately does not replicate (SVSW keeps ECS component data
un-coupled from any binding-layer base type).

**Key subsystems:**

| Subsystem | File paths | What |
|---|---|---|
| Object model / COM-like interfaces | `include/BlueClass.h`, `IBlueClasses.h`, `BlueClasses.cpp`, `BlueRegistration.cpp` | `IRoot` universal base; `QueryInterface(IID, ...)`; classes ID'd by `Be::Clsid`, interfaces by `Be::IID` |
| Reference counting & lifetime | `include/BlueClass.h`, `BlueSmartPtr.h`, `BlueWeakRef.h` | `RootRefLock<T>` atomic lock/unlock refcounting with debug instance tracking; `BlueBasicPtr<T>`/`BluePtr<T>` RAII smart pointers; `BlueWeakRef<T>` auto-nulling weak refs |
| Exposure macros | `include/BlueExposureMacros.h`, `BlueExposureMacrosPython.h`, `BlueCallFunction.h`, `BlueExtractArgument.h`, `BlueWrapReturnValue.h`, `BlueFunctionTraits.h` | `EXPOSURE_BEGIN`/`MAP_ATTRIBUTE`/`MAP_METHOD_AND_WRAP`/`MAP_INTERFACE`/`BLUE_REGISTER_ENUM_EX`; template-deduced signature marshaling |
| Script->C++ callback + error translation | `include/BlueScriptCallback.h`, `BlueStdResult.h`, `BlueExtractArgument.h` | `BlueScriptCallback` wraps a Python callable with typed `Call<Ret>`/`CallVoid<Args...>` overloads (hand-unrolled arity 0-6), GIL-guarded; `BlueStdResult` maps C++ error categories to Python exception types |
| Variable/attribute reflection storage | `include/BlueVariable.h`, `IBlueRtti.h`, `BlueTypes.h` | `Be::VarEntry`/`BlueVariable` describe one exposed attribute (name, type, byte offset via `BLUE_MEMBEROFFSET`, doc, flags) |

**Architecture patterns.** Declarative registration (attribute/method tables
built via macros, not hand-written glue per call); systematic error funnel
(`BlueStdResult` -> `BeGetException`) rather than ad hoc `try`/`catch` per
binding; explicit weak-reference type with death notification, distinct from
the strong smart pointer.

**Python/Blue integration.** This repo IS the Python integration layer: C++
classes implement `ExposeToBlue()` built from the `MAP_*` macros;
`BLUE_WITH_PYTHON`-gated code wraps each instance in a native CPython type
routed through `IBlueRtti::FindAttribute`/`FindMethod` for generic
getattr/setattr; methods become auto-generated `PyCFunction` thunks; errors
cross via `BlueStdResult -> BeGetException -> PyErr_SetString`; callbacks
cross the other way via `BlueScriptCallback` with GIL-managed
`PyObject_CallFunctionObjArgs`.

**Ideas worth stealing (Odin mapping):**

| Idea | Odin mapping |
|---|---|
| One `Result<T>`-style error type per category, funneled through one translation point | Small Odin error-tag enum (index/key/type/io/runtime/value) + one proc mapping it to a Lua error at the C-callback boundary |
| Declarative registration macros deriving marshaling from the C++ signature | A comptime/trait-based or small code-gen helper for `svsw.*` binding boilerplate, kept Odin-idiomatic (not a macro pyramid) |
| Explicit weak-reference type with auto-nulling notification | Confirm SVSW's generational entity handles already give this property more cheaply than a notify-list |
| GIL-acquire-then-RAII-release centralized in one callback-invocation path | Centralize "reconstruct `context`, defer teardown" the same way for every Lua->Odin re-entry point |
| Debug-only instance/lock counting hooks built into the base ref-counted class | A lightweight per-userdata-type instance counter behind `ODIN_DEBUG` to catch Lua-boundary handle leaks |

**Anti-lessons.** A COM-style IID/QueryInterface object model earns its cost
only at MMO scale, where many independently-versioned interfaces span dozens
of engineers; SVSW has one binding surface and no interface-proliferation
problem to solve. The exposure macro DSL exists to paper over C++'s lack of
runtime reflection; Odin has real compile-time type info, so replicating the macro pyramid solves
a problem Odin doesn't have. Hand-unrolled callback arities (0-6, no
variadics) are a pre-C++11 workaround, not worth the boilerplate pattern
itself. Cross-thread delete deferral (`BLUE_CLASS_ALLOW_DELAYED_DELETE`) is a
concession to a multi-threaded/server-scale object graph SVSW's single-thread
deterministic kernel (D11) doesn't need. Note: despite the org description,
this repo pins Python >= 3.12.9 — not Python-2-era, so no legacy-Python
anti-patterns apply here specifically.

---

## `core` (`carbon-core`)

**Purpose.** Cross-platform low-level C++ foundation library — "generic
low-level functionality and cross-platform abstractions for system calls"
per its own README: tracked/guarded heap allocation, thread/mutex/spinlock/
semaphore primitives, callstack capture, FNV1 hashing, buffered file IO,
process/thread time introspection, non-MSVC secure-CRT shims (`sprintf_s`/
`strcpy_s`/`vsnprintf_s`), UTF8<->wide string conversion, a
statistics/counters registry, Tracy-backed telemetry (including per-fiber
"tasklet" zone tracking), a channel-based logger, a crash-reporter
interface, RAII scope guards, a template cached-allocator, and
named-allocator STL container wrappers that route through the tracked
heap. Ships as one shared library, `CcpCore`, with its export macro
(`CARBON_CORE_API`) generated by CMake's `generate_export_header` rather
than hand-written.

**Role in the engine.** The literal foundation dependency hub: a pure leaf
with no compile-time dependency on any other Carbon component (only Tracy,
gtest, and lz4 as C++ deps; Python3 is a host-only tool for the Sphinx/
Doxygen doc build, not a runtime dependency). Confirmed from the consumer
side too: `blue`, `trinity`, and `destiny` each `find_package(carbon-core
CONFIG REQUIRED)` in their own `CMakeLists.txt` and link `CcpCore`
directly, and `exefile` (the native bootstrap executable) does the same.
Source-level usage tracks how much of each repo is C++ versus Python:
`trinity` has 191 files calling `CCP_ASSERT`/`CCP_LOG`/`CcpMutex`/etc.,
`blue` has 57, `destiny` (mostly Python-driven sim logic) has 7. Roughly,
`core` occupies the spot SVSW's `engine/kernel` plus a slice of
`core:*`/`core:sync` occupy — but distributed as a versioned vcpkg port
(consumers pin `carbon-core >=2.6.0`) rather than vendored source.

**Key subsystems:**

| Subsystem | File paths | What |
|---|---|---|
| Tracked/guarded memory | `include/CCPMemory.h`, `CCPMemory.cpp` | `CCP_MALLOC`/`CCP_NEW` macros route through `CCPMallocWithTracking`; optional front/back canary guard bytes (`0xee`/`0xef`) plus a `0xdddddddd` freed-marker, toggled at runtime via a `/memoryGuards` command-line switch |
| Memory tracker | `include/CCPMemoryTracker.h`, `CCPMemoryTracker.cpp` | Per-allocation name/file/line ledger built over a custom fixed-block `StringTable` (binary-search, ref-counted interned strings, guaranteed not to allocate beyond its initial block) |
| Threading primitives | `include/CcpMutex.h`, `CcpMutex.cpp`, `CcpSemaphore.h/.cpp`, `CcpThread.h`, `CcpAtomic.h` | `CcpMutex`/`CcpSpinLock`/`CcpSemaphore` wrap native OS primitives behind a Pimpl (`struct Private`); `CcpAtomic` is a thin `std::atomic` alias; `CcpThread` is `std::thread` on the modern toolchain path |
| Telemetry (Tracy) | `include/CcpTelemetry.h`, `CcpTelemetry.cpp` | Zone/lock/allocation tracking wired directly into `CCPMemory.cpp`/`CcpMutex.cpp`; a `TaskletZoneStore` tracks profiler zones per named "fiber" so cooperatively-scheduled Python tasklets appear as separate timelines |
| Logging | `include/CCPLog.h`, `CCPLog.cpp` | Channel-based (`CcpLogChannel_t`) leveled logging (`CCP_LOG`/`CCP_LOGNOTICE`/`CCP_LOGWARN`/`CCP_LOGERR`) with pluggable, privilege-gated echo callbacks |
| Assertions & crash reporting | `include/CCPAssert.h`, `CCPAssert.cpp`, `include/ICrashReporter.h`, `CcpCrash.h` | `CCP_ASSERT`/`CCP_ASSERT_M`/`CCP_CHECK_RETURN` with a per-call-site "ignore future" latch; native interactive dialog (Win32 `MessageBox` / macOS `CFUserNotificationDisplayAlert`) offering Continue/Ignore/Break |
| Statistics | `include/CcpStatistics.h`, `CcpStatistics.cpp` | `CcpStaticStatisticsEntry` (counter/memory/time types), derived mean/stddev entries, `CcpStatisticsStopwatch` as an RAII scope timer feeding a counter |
| File/process/string/allocator utilities | `include/CcpFileUtils.h`, `CcpProcess.h`, `StringConversions.h/.cpp/.mm`, `CcpSecureCrt.h`, `CachedAllocator.h`, `TrackableContainer.h` | Wide-path file IO; process/thread CPU-time queries; UTF8<->wide conversion (native bridge on Apple via `.mm`); non-MSVC `sprintf_s`-family shims; per-type free-list pooling (`USE_CACHED_ALLOCATOR`); `TrackableStdVector`/`Map`/`Set`/... wrapping STL containers with a named allocator so every container allocation carries a debug tag |

**Architecture patterns.** Pimpl for every type that crosses the shared-
library boundary (`CcpMutex::Private`, `CcpSpinLock::Private`,
`CcpSemaphore::Private`, `TelemetryZone::Private`), so platform-specific
layout (`CRITICAL_SECTION` vs `pthread_mutex_t`) never leaks into
consumers; one generated export macro (`CARBON_CORE_API`) has replaced the
legacy hand-rolled `BLUEIMPORT`/`BLUEBUILD` dllexport macros, which still
sit unused in `CcpMacros.h`; every subsystem compiles away entirely outside
debug/instrumented builds via preprocessor gates (`CCP_ASSERT_ENABLED`,
`CCP_MEMORY_DEBUG`, `CCP_TELEMETRY_ENABLED`, `CCP_LOG_ENABLED`) rather than
branching at runtime; debug instrumentation is fused straight into the hot
allocation path instead of layered on top (`CCPMallocWithTracking` calls
`CcpTelemetryTrackAllocation` inline); a second, hand-rolled,
allocation-free mutex (`CcpMemoryTrackerMutex`) exists solely because
`CcpMutex` itself allocates when registering with telemetry — breaking a
reentrancy cycle at the very bottom of the stack.

**Python/Blue integration.** `core` itself has zero compile-time Python
dependency — it is pure C++, and the only Python touching this repo is a
build-time-only Sphinx/Doxygen/breathe documentation toolchain
(`cmake/CcpDocsGenerator.cmake`, `doc/source/conf.py`), not gameplay
scripting. What it does expose to the Python/Stackless layer above it
(`blue`) is a narrow, deliberately opaque profiling hook:
`CcpTelemetryEnterZone(void* key, ...)`/`CcpTelemetryLeaveZone(void* key)`
plus `CcpTelemetrySetActiveFiber(const std::string&)`, called from outside
this repo by Blue's Stackless tasklet scheduler — the `TaskletZoneStore`
comment says as much: "Per-thread record of zones instrumented from
python." The effect is that each Python tasklet shows up as its own
timeline/fiber in the Tracy profiler instead of being interleaved with
everything else on the OS thread; `vcpkg.json` enables Tracy's `fibers`
feature specifically for this. Everything else this library exposes —
tracked memory, asserts, logging, statistics — is consumed by
Python-facing repos (`blue`, `trinity`, `destiny`) only through their own
C++ layers; `core` never includes or links against Python/Blue itself.

**Ideas worth stealing (Odin mapping):**

| Idea | Odin mapping |
|---|---|
| Debug canary guard bytes + a freed-marker on the allocator, toggled by a runtime flag instead of a rebuild | `core:mem`'s `Tracking_Allocator`/`Panic_Allocator` already give this; wire one in behind a CLI flag or `when ODIN_DEBUG`, no custom allocator code needed |
| Named allocations threaded through every allocation call (`CCP_MALLOC(name, size)`) for per-tag memory reporting | A small tagging `context.allocator` wrapper per subsystem/mod, surfaced through whatever debug overlay SVSW ends up with |
| One macro family that compiles asserts/tracking/telemetry away entirely outside debug builds, not a runtime branch | `when ODIN_DEBUG` / build-tag-gated procs already give this for free in Odin — confirms the pattern rather than requiring new work |
| A hand-rolled, allocation-free lock reserved specifically for the layer the tracked allocator itself depends on, breaking a reentrancy cycle | Worth the same discipline if SVSW ever adds allocation tracking inside `engine/kernel`: keep the tracker's own lock (if any) off the tracked allocator |
| Fiber/tasklet-aware profiling zones so cooperatively-scheduled logical threads of control get separate profiler timelines | If SVSW ever adds coroutine-like Lua scheduling, tag telemetry zones by logical fiber/coroutine id the same way rather than by OS thread |
| Interactive per-call-site assert dialog with an "ignore this one from now on" latch | A `when ODIN_DEBUG` assert helper that records a seen-bit per call site and skips repeat prompts during an interactive dev run |

**Anti-lessons.** Debug allocation guards computed by hand with raw
pointer arithmetic and magic byte patterns (`CCPMallocWithGuard`/
`WriteMemoryGuard`, `0xee`/`0xef`/`0xdddddddd`) reimplement what Odin's
`core:mem` allocators already give for free — porting the raw-pointer
version would just reintroduce the class of bug Odin's allocator design
exists to avoid. Memory bookkeeping is duplicated per platform — a
dedicated Windows process heap (`HeapCreate`) with its own atomic counter,
and a separate `malloc`/`calloc`-based implementation with its own atomic
counter for everything else (plus an Android-specific sub-variant that
manually prepends a size header) — exactly the kind of platform-
conditional sprawl D15's tiered-import discipline exists to prevent in
SVSW. Dead legacy naming lingers unnoticed: `CcpMacros.h` still defines
`BLUEIMPORT`/`BLUEBUILD` dllexport macros nothing in this repo actually
uses anymore (the real export macro is the CMake-generated
`CARBON_CORE_API`) — a reminder that a rename ("Blue" to "Carbon")
completed only halfway leaves confusing dead code behind; don't let SVSW's
own naming drift the same way. The repository layout fights its own
`include/` convention — every `.cpp` sits loose at the repo root instead
of under a `src/` directory paralleling `include/` — SVSW's
`engine/<package>/` convention is already better. The interactive blocking
assert dialog (`MessageBox`/`CFUserNotificationDisplayAlert`) is fine for
an interactive game client but would hang any headless CI/test run outright
if ported as-is; keep asserts non-blocking (log/abort) in anything `just
test`/`just stress` might execute. `CcpPairingHeap.h` uses raw `new`/
`delete` instead of the tracked `CCP_NEW`/`CCP_DELETE` inside an otherwise
fully-tracked allocation codebase — an internal consistency gap worth
noting, not copying.

---

## `d3dinfo`

**Purpose.** Tiny standalone C++/Python extension querying host DirectX
11/12 capabilities: GPU adapter/output enumeration, device-creation
feature-level probing, display-mode/pixel-format listing — used by the
launcher/setup tooling to check compatibility before the client boots.

**Role in the engine.** Diagnostic/capability-detection utility consumed by
launcher/setup tooling before Trinity or the client boots; not in the
renderer's runtime hot path. Its main value here is as a small, complete
worked example of Carbon's Blue-exposure boundary conventions (binding table
shape, error mapping, object ownership), not of any 2D/3D rendering
architecture.

**Key subsystems:**

| Subsystem | File paths | What |
|---|---|---|
| `D3D11Info` / `D3D12Info` | `D3D11Info.h/.cpp`, `D3D12Info.h/.cpp` | Enumerates DXGI adapters/outputs; lazily loads `dxgi.dll`/`d3d11.dll`; probes device creation |
| `AdapterInfo` / `DisplayModeInfo` | `AdapterInfo.h/.cpp`, `DisplayModeInfo.h/.cpp` | Plain `BLUE_CLASS` data-holders returned across the Python boundary |
| `D3DInfoError` | `D3DInfoError.h/.cpp` | `Be::Result<ResultCode>` specialization + `BeGetException` mapping to Python exception classes |
| `PixelFormat` | `PixelFormat.h/.cpp` | Engine-neutral enum mirroring `DXGI_FORMAT` with bidirectional converters |

**Architecture patterns.** `BLUE_CLASS`/`BLUE_DECLARE`/`TYPEDEF_BLUECLASS`
macro family generating a refcounted, Python-exposable class plus a `*Ptr`
smart-pointer typedef; `EXPOSE_TO_BLUE()`/`ExposeToBlue()` centralized
declarative exposure table per class; `MAP_METHOD_AND_WRAP` auto-translates a
non-OK `Result<ResultCode>` into a raised Python exception; lazy/manual
dynamic-library loading inside an explicit `InitializeD3D()` call so failure
reports as a normal Python exception on first use, not an import-time crash;
`CreateInstance()`/`Detach()` ownership handoff convention for boundary
objects.

**Python/Blue integration.** Every class is `BLUE_CLASS`-exposed via
`EXPOSE_TO_BLUE()`/`ExposeToBlue()`, registering a method table
(`EXPOSURE_BEGIN`/`MAP_METHOD_AND_WRAP`/`EXPOSURE_END`) with inline
docstrings. `MAP_METHOD_AND_WRAP` auto-converts a non-OK result into a raised
exception via `BeGetException` (switch on `ResultCode`). The C++ code touches
`PyObject*` only in that one exception-mapping function, gated behind
`#if BLUE_WITH_PYTHON` — everything else is Python-agnostic.

**Ideas worth stealing (Odin mapping):**

| Idea | Odin mapping |
|---|---|
| Centralized declarative binding table pairing each method with an inline docstring | One per-package Lua registration proc listing every exposed function with a doc comment, per `lua-binding` skill conventions |
| Typed `Result<Code>` with `operator bool()` + a free function mapping codes to host exceptions | One centralized enum-to-Lua-error mapping proc per Odin error-enum type |
| Deferred/lazy init of an optional native capability behind an explicit `Initialize` call | Expose an explicit init proc Lua/CLI can call and handle failure from, rather than hard-failing engine startup |
| Out-parameter + owned-pointer handoff convention (`CreateInstance()`/`Detach()`) | Document one clear ownership rule per `svsw.*` binding module (who allocates, Lua only ever gets an opaque handle) |

**Anti-lessons.** 100% Windows/DirectX-only (`LoadLibrary`/`GetProcAddress` on
`dxgi.dll`, `CComPtr`, `DXGI_ADAPTER_DESC`) — zero use for a
cross-platform/sokol engine beyond the probe-and-degrade pattern. SEH
(`__try`/`__except`) around `D3D11CreateDevice` is Windows-only structured
exception handling with no Odin equivalent — port the intent (never let a
flaky driver call crash the process), not the mechanism. Tiny (9-file, ~700
line) leaf tool — do not over-index on it as representative of Trinity's
renderer design.

---

## `db` (`carbon-db`)

**Purpose.** C++ wrapper giving EVE's Python (Blue/Stackless) server
processes async, tasklet-friendly access to SQL Server via OLE DB —
`db.NSession.Execute(procname, args)` calls stored procedures and returns
rowsets without blocking the process.

**Role in the engine.** Server-side infrastructure, not the real-time
game/render loop; same architectural layer as `blue` but specialized for
RDBMS access, with blocking OLE DB IO offloaded to a libuv worker thread pool
so a calling tasklet yields instead of blocking.

**Key subsystems:**

| Subsystem | File paths | What |
|---|---|---|
| `SessionPool` | `SessionPool.h/.cpp` | Connection pool over `ATL::CSession`; min/max watermarks; background pre-warm; blocks a tasklet (not an OS thread) when no session is free |
| `NSession`/`SQLCommand`/`Request` | `NSession.h/.cpp`, `SqlCommand.h/.cpp`, `TmpRowset.h/.cpp`, `Row.h/.cpp` | Python-visible `db.NSession`; `Execute()` builds a `Request` (an `IOWorker`) run on a worker thread |
| `TaskletBlockingIO` | `TaskletBlockingIO.h/.cpp` | Generic bridge: schedules blocking work on libuv's thread pool, signals completion via a Blue/Scheduler `PyChannel` |
| `DelayedException` | `DelayedException.h/.cpp` | Captures worker-thread errors as plain C++ data (no Python-runtime touch off-thread); raised into a real Python exception only on the main thread |
| `Row`/`RowDescriptor`/`BlockAllocator` | `Row.h/.cpp`, `RowDescriptor.h/.cpp`, `BlockAllocator.h/.cpp` | Precomputed column offsets/bitfields; bump-allocated result-set memory freed in one shot |

**Architecture patterns.** Async-bridge (worker-thread pool + completion
channel instead of blocking the interpreter); errors captured off-thread as
plain data, raised on-thread only; connection pooling with watermarks and
pre-warming; RAII session-release guard (`SessionKeeper`); schema caching
(parameter/column info fetched once, reused); arena allocator for a whole
result set freed as a block.

**Python/Blue integration.** `NSession` is `PyXObject2<NSession>` (Blue's
older C++/Python binding templates, distinct from the `blueexposure`
reflection macros used elsewhere) — method tables via `PYTHON_METHODS_BEGIN`/
`PYTHON_MEMBER`. Worker threads never touch Python state directly;
`DelayedException` defers the actual `PyErr_SetString`-equivalent raise to
the main thread under `PyGilEnsure`.

**Ideas worth stealing (Odin mapping):**

| Idea | Odin mapping |
|---|---|
| Async-bridge: worker pool + completion channel instead of blocking the VM | Odin worker thread/pool for blocking IO (DB, disk, network) triggered from Lua, with the Lua coroutine yielded/resumed via a completion queue drained each tick |
| `DelayedException`: capture errors as plain data off-thread, raise only on the main thread | Worker-thread Odin code produces a plain error struct; never touches `lua_State*` off the main thread; main-thread drain constructs/raises the Lua error |
| Session/connection pooling with watermarks and background pre-warming | Reusable for any pooled external resource (Go-layer DB connections, pooled OS handles) |
| RAII release guard (`SessionKeeper`) | Explicit `defer` pairing `pool_get`/`pool_release` in Odin |
| Bump/arena allocator for a whole result set freed in one shot | `core:mem` `Arena` per query-result batch |

**Anti-lessons.** Hard Windows/COM/OLE DB dependency (`atldbcli.h`, ATL
`CCommand<>`, `HRESULT`, `CComPtr`) — no macOS/Linux analog; do not port the
binding layer itself. Intricate unsafe C++ row layout (raw pointer arithmetic
into a single `__int64` field, `reinterpret_cast`-heavy) matching ATL's
accessor contract — not worth replicating; a Go/Odin DB binding should use a
normal typed row struct. Deep coupling to Blue's older `PyXObject2`/
`PYTHON_METHODS_BEGIN` macros is 2000s/2010s-era Python-embedding style Lua's
C API supersedes with much simpler mechanisms. MMO-scale infra assumptions
(persistent server-side SQL Server, stored-procedure-only access, session
pool sized for many concurrent server tasklets) — a future Go server layer
would likely reach for a modern `database/sql`/`pgx` stack instead.

---

## `destiny`

**Purpose.** Server-authoritative 3D physical world-simulation engine for
EVE solar systems: entity movement, collision, warp travel, follow/orbit AI,
proximity/visibility queries, spatial partitioning; a tick-driven simulation
("Ballpark") batching state updates to clients.

**Role in the engine.** Carbon's world-sim/physics tier — an ECS+physics+
AI-steering layer combined, sitting below `blue` and driven by server-side
Python game logic; `trinity` is a separate client-side consumer of the state
Destiny computes. Destiny does not render or handle input; it is pure
simulation, exposed wholesale to Python via Blue's exposure macros and
versioned COM-like interfaces (`IEveBallpark : IEveReferencePoint : IRoot`).

**Key subsystems:**

| Subsystem | File paths | What |
|---|---|---|
| `Ballpark` | `src/Ballpark.h/.cpp/_Blue.cpp`, `Thunkers.cpp` | Central sim object: all Balls, spatial `Partition`, capsules, OBBs, static collidables; movement-mode state machines (Warp/Goto/Orbit/Follow/MissileFollow/FormationFollow/Stop/Troll) |
| `Ball`/entity model | `src/Ball.h/.cpp/_Blue.cpp`, `MiniBall.h/.cpp`, `CollisionBallProperties.h/.cpp` | Mass, radius, velocity, agility/speedFraction, movement mode, bubble membership |
| Spatial partition ("Boxes") | `src/Partition.h/.cpp/_Blue.cpp`, `Box.h/.cpp` | Hierarchical multi-level uniform grid (fine level + coarser containing levels), centered on origin |
| Collision system | `src/Collision.h/.cpp`, `CollisionStructures.h/.cpp`, `AABB.cpp`, `BoxShape.h/.cpp`, `OrientedBox.h/.cpp`, `Capsule.h/.cpp` | Time-of-impact based, analytic + iterative response, static and free-ball cases share one code path |
| Bubbles (interest management) | `src/Ballpark.h` (bubble* members), `python/destiny/net/server/_bubbleupdater.py`, `_parkupdatebatcher.py`, `_ticker.py` | Groups for interactivity culling and per-client update batching |
| Deterministic-ish RNG | `src/Random.h/.cpp` | Per-instance-seeded Lehmer/Park-Miller LCG; a deliberately broken `randomIntWRONG` variant left in as a documented landmine |
| Blue exposure | `src/Ball_Blue.cpp`, `Ballpark_Blue.cpp`, `Thunkers.cpp`, `include/IEveBallpark.h` | Per-class exposure files plus hand-written PyObject-arg-parsing "thunker" functions |
| Benchmark harness | `tools/benchmark/run.py`, `runner.py`, `library/*.yaml` | YAML-scripted headless throughput scenarios, analogous in spirit to `just stress` |

**Architecture patterns.** Movement/behavior as a small closed set of
per-entity modes, each with one `Evolve*` function, switched on a mode field
rather than polymorphic subclasses; hierarchical multi-resolution grid
partition; per-instance seeded RNG (not global/thread-shared); explicit
pre-tick/tick/post-tick phase split with C++ calling into Python at defined
hook points for network-update batching; one collision-response code path
shared by static and free-ball collisions with the static case as a
documented degenerate branch.

**Python/Blue integration.** Every simulation class has a companion
`*_Blue.cpp` declaring attributes (`MAP_ATTRIBUTE` with READ/READWRITE/
NOTIFY/PERSIST flags) and interfaces (`MAP_INTERFACE`), plus a parallel set of
hand-written `Py`-prefixed "thunker" methods (`PyObject* Ballpark::PyAddBall
(PyObject* args)`) that manually `PyArg_ParseTuple` and marshal results. This
manual-thunker mechanism is exactly the class of glue code Lua binding
generators exist to eliminate — SVSW's D42 approach is strictly better.
Python drives the C++ tick from outside via pre/post-tick hooks and receives
callbacks (`IBlueEvents::OnTick`) — the closest real-world analog to the
Odin-Lua boundary for lifetime/error-containment study, though the mechanism
itself is superseded.

**Ideas worth stealing (Odin mapping):**

| Idea | Odin mapping |
|---|---|
| Per-entity mode enum with one `evolve_<mode>` proc per case | Tagged-union/enum `Movement_Mode` component, `#partial switch` dispatch — fits ECS-friendly Odin idiom |
| Hierarchical multi-resolution uniform grid (fine + coarser levels, origin-centered) | Cheap deterministic middle ground beyond current tilemap chunking for future spatial queries |
| Per-instance seeded LCG RNG (instance state, not global) | Corroborates SVSW's engine-seeded PCG32 (D11); check save/replay format round-trips RNG state the same way |
| Explicit pre-tick/tick/post-tick phase split with defined script hook points | Equivalent pre/post-tick Lua hooks once Go servers exist, for replication-payload batching, without giving mods control of the deterministic tick |
| Declarative YAML benchmark scenarios instead of hardcoded C++ | `just stress` could grow scenario files describing entity counts/behaviors |
| One collision-response path shared by static/dynamic, static as a documented fast-path | Structure future AABB/physics collision the same way to avoid divergence |

**Anti-lessons.** Bubbles/per-client interest management/update-batchers exist
purely for thousands-of-concurrent-players bandwidth budgets — irrelevant at
small/co-op scale. The manual `PyObject*` thunker pattern in `Thunkers.cpp`
is exactly what SVSW's existing macro/generator-based lua-binding approach
already supersedes. Build requires internal CCP Perforce access — this repo
is read-only reference material, not buildable. God-object `Ballpark` (a
1200+ line header, many public mutable fields, heavy `friend class` use,
literally a field named `mSomeWeirdHackToFixSomething`) is legacy technical
debt — SVSW's ECS separation is already the better architecture. A
deliberately broken function (`randomIntWRONG`, documented "DOES NOT WORK"
but still compiled/callable) is a discipline anti-pattern `just check`/
api-coverage gates should prevent. Domain-specific physics constants (AU
distance, warp accel/cruise/decel) baked directly into "engine" code is a
mild architecture smell worth avoiding in Lua-scripted movement systems.

---

## `exefile` (`carbon/exefile`)

**Purpose.** The native OS bootstrap executable: parses the command line,
sets up console/stdio redirection, installs Crashpad (Sentry-backed) crash
reporting, configures and initializes CPython (isolated vs. interpreter
mode), dynamically loads a separate Blue shared library through a C-ABI
vtable of function pointers, hands control to Blue's Stackless-based
simulation loop, and manages clean shutdown.

**Role in the engine.** The outermost shell of the whole Carbon stack — the
direct analog of an SVSW `main.odin`/`svsw run` entrypoint, except Carbon
additionally implements plugin-style dynamic loading of its own engine core
(supporting build "flavors": release/internal/trinitydev/debug) plus a full
native crash-reporting pipeline, and a `/py` escape hatch into vanilla
CPython interpreter mode.

**Key subsystems:**

| Subsystem | File paths | What |
|---|---|---|
| Blue dynamic-loading shim | `BlueInterface.h/.cpp` | `LoadLibraryW`/`dlopen` a versioned shared library; resolves ~18 entry points via `GetProcAddress`/`dlsym` into typed function-pointer members |
| Python/Stackless bootstrap | `ExeFile.cpp` (`ConfigurePython`, `runPyMain`, `Main`) | Builds `PyPreConfig`/`PyConfig`; disables bytecode writing and user site dir; extends inittab; calls `Py_InitializeFromConfig` |
| Command-line & startup args | `CommandArguments.h/.cpp` | Console mode, search paths, build flavor, service mode, redirect targets |
| Crash reporting | `Crashpad.h/.cpp` | Wraps Google Crashpad behind `ICrashReporter`; compiled out entirely in debug builds |
| Platform OS-service glue | `ExeFile.cpp`, `ExeFileWin32.cpp`, `ExeFileOsX.mm` | Windows SCM service handlers; `timeBeginPeriod(1)` timer-resolution tuning |

**Architecture patterns.** Narrow, versioned, dynamically-loaded C-ABI
boundary separating "exe shell" (arg parsing, crash reporting, lifecycle)
from "engine core" (Blue); build-flavor selection with graceful fallback to
release; crash-key tagging (`interpreter_mode`) before anything can go wrong;
explicit interpreter-startup hermeticity (disable bytecode cache in dev,
redirect pycache, disable user-site imports).

**Python/Blue integration.** `ConfigurePython()` builds an isolated/full
`PyConfig`, installs CCP's built-in C modules via `blue.GetInitTab`, then
`blue.RunStackless()` hands off control. This is the boot-time half of the
Odin<->Lua boundary question: it shows the discipline of keeping an embedded
interpreter hermetic (sandboxed `package.path`/`require` pointed only at
mod-manifest-derived paths, not ambient env vars) that SVSW's Lua sandbox
should already match.

**Ideas worth stealing (Odin mapping):**

| Idea | Odin mapping |
|---|---|
| Separate the "exe shell" from "engine core" via a narrow, stable boundary | SVSW's `cli/` already plays this role; keep its dependency on `engine/` to a small stable proc set — the discipline transfers even without dynamic loading |
| Build-flavor selection with graceful fallback to a default | `just run --flavor=debug` attempting a flavored binary, falling back with a clear log line |
| Crash-key tagging execution mode before risky work starts | Tag captured Lua stack traces/panics with structured context (mod id, flavor, headless/windowed) before surfacing them |
| Explicit interpreter-startup hermeticity (disable ambient path pollution) | Concrete illustration to cite when reviewing SVSW's Lua path-resolution/sandbox code |
| Dev-only "raw interpreter" escape hatch, disabled in packaged builds | An SVSW dev-only `svsw lua-repl` explicitly disabled in packaged/shipped builds |

**Anti-lessons.** Runtime dynamic-library loading of the engine core itself
(`dlopen` + ~18 hand-matched function pointers) is MMO/live-service-scale
machinery for hot-swapping builds without recompiling the launcher — a
small-team single-binary Odin engine gains nothing from this indirection.
Windows-service (SCM) integration is server/live-ops specific. Embedding full
CPython+Stackless with isolated-vs-full config duality and a
`getpathp.c`-replicating path bootstrap is legacy-era migration baggage with
no transfer to Lua's much simpler init story (SVSW already has this right).
`timeBeginPeriod(1)` is a documented-footgun Windows-only global side effect.
Crashpad integration is a full production telemetry pipeline sized for a
shipped commercial MMO — a "later, if ever" concern.

---

## `exefileconsole`

**Purpose.** A tiny Windows-only launcher: renamed/copied to match a target
GUI app's exe name (e.g. `FooConsole.exe` for `Foo.exe`); strips "Console"
from its own filename to find the real target, spawns it via `CreateProcess`
with inherited stdio, blocks on it, forwards its exit code.

**Role in the engine.** Not a runtime subsystem — dev-tooling/build-support
shim letting a normally-windowed GUI app run synchronously from an existing
console with proper stdio passthrough and exit-code propagation.

**Key subsystems:** `ExeFileConsole.cpp`/`stdafx.h/.cpp` (single `_tmain`
entry point); CMake/vcpkg/TeamCity build scaffolding.

**Ideas worth stealing (Odin mapping):** the exit-code and stdio-passthrough
*contract* (wrapper blocks, forwards exit code, forwards std handles) is
directly relevant to the `svsw` CLI's own subcommand invocation and to
`just scaffold-check`/CI — but Odin's `os.exit`/`exec` already gives this
without needing a wrapper; the behavioral contract is the transferable idea,
not the mechanism.

**Anti-lessons.** Entirely Windows-API-specific (`CreateProcess`, wide-char
`_tmain`) — nothing ports directly. Relies on brittle string surgery
(find-and-erase "Console" from the exe path) instead of an explicit
config/manifest naming the target — a maintenance footgun; any Odin
equivalent should take the target path as an explicit argument. Teaches
nothing about ECS/rendering/scripting/determinism — pure Windows
process-launch plumbing plus CCP-internal CMake/vcpkg scaffolding.

---

## `geo2`

**Purpose.** CPython C-extension exposing DirectXMath vector/matrix
operations to Python: 2D/3D/4D float `Vector` and double-precision `VectorD`
as native Python types, ~150 free functions (vector algebra, lerp/Hermite/
Catmull-Rom/barycentric interpolation, matrix transform, batch `*Array`/
`*Stream` transforms).

**Role in the engine.** The math/geo primitives library in Carbon's
component graph — self-contained, dependency-light, called into by `trinity`,
`destiny`, `audio`, and Python gameplay code for vector math. No gameplay
logic, no rendering of its own.

**Key subsystems:**

| Subsystem | File paths | What |
|---|---|---|
| `Vector`/`VectorD` Python types | `src/Vector.h/.cpp`, `VectorD.cpp` | Wraps a 4-wide float/double union; operator overloads; swizzle attribute access via old-style `tp_getattr`; full pickle support |
| Module-level free functions | `src/Geo2.cpp` | ~150+ functions reflecting DirectXMath, generated partly via preprocessor macros (`VectorFunArgV`/`VV`/`VVF`/etc.) |
| Python<->native marshaling | `src/Util.h/.cpp` | `ExtractXMVectorFromSequence`, `GetRealValue<T>` (explicit type checks, no silent narrowing), `XMVectorAsPyFloats` — ~15 functions every value funnels through |

**Ideas worth stealing (Odin mapping):**

| Idea | Odin mapping |
|---|---|
| Swizzle attribute access via a closed-form letter-to-index formula | Replicate the formula in the C binding code implementing `__index` metamethods for a Lua vector userdata |
| Explicit float vs. double vector types as parallel independent API families | Expose `svsw.vec2`/`svsw.vec3` (f32) distinctly from any future `svsw.vec3d`, mirroring the D-suffix convention rather than genericizing precision at the Lua layer |
| Pickle support implemented directly on the native type | Give Lua vector/entity userdata a canonical to-table/from-table hook so it composes with a generic Lua table serializer for save/replay data |
| Duck-typed "accept a Vector OR a plain sequence" argument extraction | Accept a Lua table `{x=,y=,z=}` or array anywhere a `svsw.vec3` userdata is expected, in the C shim that unpacks Lua stack args |

**Anti-lessons.** Old-style `tp_getattr`/`tp_setattr` — steal the swizzle
feature, not the mechanism. Windows-flavored `#ifdef`-per-platform code
throughout — prefer Odin's built-in cross-platform primitives. DirectXMath
itself is a closed platform-specific SIMD library — only the *operation set*
(lerp, Hermite, Catmull-Rom, barycentric, batch transforms) is worth noting,
target `core:math/linalg` instead. Heavy C-macro code-generation
(~10 macros generating ~40 near-identical functions) is a C-era workaround
for lacking generics — Odin has real generics, express this as one generic
proc or table-driven dispatch instead. Build-flavor-concatenated exported
symbol names are MMO-scale build-matrix machinery not worth replicating.

---

## `grpc` (`carbon-grpc`)

**Purpose.** CMake/vcpkg template repo ("base for creating project-specific
Python gRPC modules") — reusable C++ building blocks (`Connection`, `Broker`,
`Publisher`, `Consumer`, `Jobs`, `Channel`/`PublishingChannel`,
`StreamStatusLog`, `CachedMetrics`) for wrapping bidirectional-streaming gRPC
clients as native Python extension modules. Not itself a finished service.

**Role in the engine.** Network-services glue layer — how EVE's server-side
Python code talks to other backend services over gRPC; sits alongside
`prometheus` (declared vcpkg dependency); closer to `blue`'s Python-embedding
role than to `trinity`/`destiny`.

**Key subsystems:**

| Subsystem | File paths | What |
|---|---|---|
| `client/Connection` | `include/carbongrpc/client/connection.h`, `src/client/connection.cpp` | Wraps a `grpc::Channel`; exponential-backoff reconnect; `PublishingChannel<ConnectionMessage>` event fanout |
| `Broker`/`Publisher`/`Consumer` | `include/carbongrpc/client/broker.h`, `publisher.h`, `consumer.h` | Template base classes: background-thread bidirectional-stream pump, queued outgoing messages, ping/pong latency, pause/resume backpressure |
| `Channel`/`PublishingChannel` | `include/carbongrpc/client/channel.h/.hpp` | Thread-safe single/multi-reader message queues for internal event distribution |
| `module/` Python C-API glue | `include/carbongrpc/module/*.h`, `src/module/*.cpp` | `PyTypeObject` per native class, `tp_init`/`tp_dealloc` bridging `shared_ptr` lifetime; `Helpers::GetCProtoInsidePyProto` reaches into a Python protobuf object's internal C representation to skip a serialize round-trip |

**Ideas worth stealing (Odin mapping):**

| Idea | Odin mapping |
|---|---|
| Reach through a scripting wrapper to grab the native pointer inside it, with a cached type-check | Cache the metatable-identity check result on the hot path of unwrapping Lua userdata for Odin structs, rather than re-verifying by string compare every call |
| Native object lifetime tied 1:1 to a wrapper object's dealloc | Keep Odin-owned resource teardown solely in the userdata's `__gc` metamethod, never require an explicit `:destroy()` from Lua |
| Global finalizer/shutdown registry for coordinated, bounded-timeout shutdown | An ordered cleanup-callback list with a hard timeout for independently-loaded mods/subsystems, instead of hard-coded shutdown order |
| Explicit queue limits + rejection-reason counters on the send path | Template for a future Go game-server client/server message queue: explicit, observable limits rather than silent drops |

**Anti-lessons.** Heavy thread-per-role concurrency (`broker_thread_`,
`metrics_thread_`, `ping_thread_`, hand-rolled mutex/condvar pairs) is
MMO-server concurrency machinery a small-team engine has no analog need for —
Go's goroutines/channels (or a single-threaded Lua sandbox) make this
unnecessary. Reaching into `google.protobuf.pyext._message.CMessage`'s
private struct layout via an internal, non-public header is exactly the kind
of version-fragile hack Lua's simpler userdata mechanism should avoid.
Windows/macOS-oriented CMake/vcpkg toolchain machinery is irrelevant to
`just`. Prometheus metrics wired as first-class members of every client class
is observability scope creep for a small 2D engine, against TIGER_STYLE
function-size/scope-discipline norms. This is a scaffold/template repo with
no proto files or concrete subclass — illustrative of patterns only.

---

## `imageio`

**Purpose.** Standalone C++ leaf library reading/writing/CPU-manipulating
bitmap images: BMP, DDS, JPEG, PNG, PSD, TGA, plus CCP's own VTA volumetric-
texture-animation format and NanoVDB rasterization support. Never touches
the GPU — produces/consumes an in-memory `HostBitmap` that some other
component (Trinity) uploads.

**Role in the engine.** Sits below `trinity` and above the OS file layer;
supplies texture data to the asset pipeline and Trinity's texture-upload
path. No Python/blue references anywhere in this repo — pure C++, consumed
by native code elsewhere.

**Key subsystems:**

| Subsystem | File paths | What |
|---|---|---|
| `HostBitmap`/`BitmapDimensions` | `include/HostBitmap.h`, `HostBitmap.cpp` (1359 lines), `include/BitmapDimensions.h` | Owns raw byte buffer; move-only; per-mip width/height/pitch/size math modeled on D3D/DXGI mip-chain arithmetic |
| Pixel format table | `include/PixelFormat.h` | Near-verbatim copy of `DXGI_FORMAT` (100 values, same names/ordering/IDs) plus giant switch-statement helpers |
| Format-handler plugin registry | `include/Tr2ImageHandler.h`, `Tr2ImageHandler.cpp`, `Tr2{Bmp,Dds,Jpg,Png,Tga}Handler.h`, `PsdHandler.h`, `VtaHandler.h` | `ImageFormatFunctions` struct of 4 C function pointers per format; global registry populated once behind a mutex+bool guard; dispatch by matching a callback against the filename extension |
| `Result`/error type | `include/ImageIOResult.h`, `ImageIOResult.cpp` | `{Code; std::string message}` + `operator bool()` + `IMAGE_IO_CR_RETURN_RESULT` early-return macro — no exceptions |
| VTA + NanoVDB | `include/VtaHandler.h`, `VtaHandler.cpp` (577+134 lines), `NanoVdbSupport.h/.cpp` | Custom RLE7-family delta/entropy encoding between frames; rasterizes OpenVDB/NanoVDB sparse grids into `HostBitmap` 3D textures |
| Mip-level partial loading | `Tr2ImageHandler.cpp`, `include/Tr2ImageHandler.h` | `LoadParameters::GetMipLevelRange` skips top N mips / caps max mips read from disk |

**Ideas worth stealing (Odin mapping):**

| Idea | Odin mapping |
|---|---|
| Function-pointer struct as a format-handler "poor man's interface," registered via lazy `@(init)`-style registration | Odin proc-value struct registered into a fixed array/map at init — no mutex needed given Odin's deterministic package init order |
| Result-type error handling with `operator bool()` + formatted constructor + early-return macro | Odin's `or_return`/`or_else` operators are built for exactly this pattern, better than the C++ macro |
| `BitmapDimensions` as a small cheap-to-copy value type, separate from the owning buffer | `Bitmap_Dimensions :: struct{...}` + free procs; already Odin's natural shape |
| `LoadParameters` carrying mip-skip/max knobs at the format-agnostic API boundary | An SVSW `Texture_Load_Params{skip_mips, max_mips}` threaded through the asset pipeline's image loader |
| Single `PixelFormat` enum shared by CPU loader and GPU submission layer | Define one `Pixel_Format` enum in `engine/render/gpu` (D15's sole sokol-touching stratum) sized to what sokol actually needs, avoiding a translation table |

**Anti-lessons.** The `PixelFormat` enum is a near-total `DXGI_FORMAT` copy —
mostly Direct3D/Windows-only concepts with no sokol/Metal/WebGPU equivalent;
don't copy wholesale. Global mutable registry state with a hand-rolled mutex
+ static-bool double-checked lock is C++-multi-TU-static-init-order
defensive coding Odin's deterministic package init doesn't need. VTA's
bespoke RLE7 encoding and NanoVDB rasterization are MMO-AAA-VFX-scale tooling
— note the general pattern only if a real need arises. Library is a static
archive with heavy third-party linkage (libjpeg-turbo, libpng, zlib,
OpenVDB) via vcpkg `find_package` — fights SVSW's quarantine-first vendoring
policy if imported wholesale. PSD/BMP/TGA support are legacy desktop-tools/
DCC-interop formats — a 2D indie engine realistically only needs PNG (+
maybe a compressed GPU format); handle the rest as offline conversion
tooling, not runtime engine code.

---

## `imagetools`

**Purpose.** Leaf C++ library + Python extension for loading/manipulating/
GPU-compressing texture data: format conversion, mip generation, cropping/
downsampling, crossmap->cubemap conversion, roughness-map generation, NanoVDB
support, and BC1-7/DXT compression via NVIDIA NVTT (optional AMD
Compressonator path). An offline/tools-pipeline library.

**Role in the engine.** Content-pipeline (asset-baking) utility used by
Python tools to prepare texture assets before they reach the renderer or
resource system. Only dependencies: `carbon-math`, `carbon-imageio`,
`carbon-blueexposure` — a thin Blue-exposed façade over `CcpImageIO` plus the
NVTT/Compressonator SDKs.

**Key subsystems:**

| Subsystem | File paths | What |
|---|---|---|
| Blue exposure macros | `ImageToolsBitmap.h`, `_Blue.cpp`, `CompressionOptions_Blue.cpp` | Declarative method/property/free-function mapping with inline docstrings; `BLUE_CLASS`/`TYPEDEF_BLUECLASS` auto-generate a refcounted pointer type |
| Result/exception bridging | `ImageIOResultBlue.h/.cpp` | `Be::Result<ImageIO::Result>` specialization; `BLUE_BEGIN_GET_EXCEPTION` maps each error code to a specific Python exception type |
| GIL release for long native work | `AllowThreads.h` | RAII: ctor `PyEval_SaveThread()`, dtor `PyEval_RestoreThread()`; wraps every Load/Save/Compress/GenerateRoughness call |
| Enum registration | `EnumRegistry_Blue.cpp` | `BLUE_REGISTER_ENUM_EX` registers native enums as Python-visible objects from a static `{name, value, doc}` table |
| Stream abstraction | `FileStream.h/.cpp`, `MemoryStream.h/.cpp`, `MemoryOutputHandler.h/.cpp` | `ICcpStream` interface with File/Memory backends so Save/Compress targets disk or a byte buffer identically |
| `ImageToolsBitmap` | `ImageToolsBitmap.h/.cpp` (763 lines) | Ref-counted core object; `Checked*` internal methods return `Be::Result<std::string>`, Blue-facing methods return `BlueStdResult`/`StdOrImageIOResult` — two parallel error conventions coexisting |
| `CompressionOptions` | `CompressionOptions.h/.cpp` | Config value-object using `Be::OptionalWithDefaultValue<T, default>` for typed default arguments at the binding layer |

**Ideas worth stealing (Odin mapping):**

| Idea | Odin mapping |
|---|---|
| Single macro-driven exposure table per class with inline docstrings at the call site | Embed doc text in the same `svsw.*` binding call so API docs can't drift from the binding table |
| Centralized native-error-code -> scripting-exception mapping, one switch table per Result type | One mapping proc per Odin error-enum, converting to a structured Lua error table, called from every Lua-facing wrapper |
| RAII guard releasing the interpreter lock around long-running native calls | Run expensive native Odin work (asset compression, heavy procgen) on a worker thread/job, resume the Lua coroutine when done, rather than blocking the single Lua VM thread |
| Stream interface with swappable File/Memory backends | Use `core:io`'s `Stream` vtable uniformly across the asset pipeline (compression, packaging) instead of ad hoc file-only APIs |
| Default-value-in-signature binding idiom | Odin already supports default parameter values natively — read defaults from the Odin signature rather than duplicating them in Lua stub code |
| Two-tier internal API (cheap internal Result vs. richer boundary-facing error) | Keep Odin-internal procs returning cheap `(T, bool)`/error-enum; only construct a full Lua error object at the actual Lua-facing wrapper |

**Anti-lessons.** Two parallel error-handling conventions in the same class
(`Checked*` vs. Blue-facing) is inherited incremental-evolution complexity —
pick one Result/error shape per boundary in Odin and stick to it. Direct
dependency on vendor GPU SDKs behind `#if WITH_COMPRESSONATOR`/CUDA branches
bakes vendor-specific conditional compilation into business logic — isolate
any optional codec/compressor behind a single build-tag'd package boundary
instead. `PyEval_SaveThread`/`RestoreThread` is CPython-GIL-specific;
irrelevant to Lua (no GIL) — port only the underlying principle. Windows-
first, DXGI-shaped `PixelFormat` enum and default build preset — an Odin/
sokol engine should not copy the enum verbatim. This is an offline
content-tool library (blocking file IO, multi-second compress calls) —
confine any adopted ideas to SVSW's tools/CLI layer, never the fixed-timestep
ECS loop.

---

## `ime`

**Purpose.** Small platform-integration extension exposing native IME (CJK
text-composition) functionality to Python UI code, cooperating with Windows
IMM32 or macOS Text Input Sources so players can type CJK input with proper
on-screen composition.

**Role in the engine.** Leaf Blue extension module (`_ime`) with zero
dependencies beyond Blue itself; a textbook "thin native capability, thick
script-side orchestration" extension.

**Key subsystems:**

| Subsystem | File paths | What |
|---|---|---|
| Blue-exposed `Ime` class | `Ime.h/.cpp/_Blue.cpp` | Platform-forked at the header level (`#if __APPLE__`/`_WIN32`) — different method sets exposed to Python per OS |
| Late-bound Win32 IMM32 wrapper | `ImeWrapper.h/.cpp` | `LoadLibraryW` on `imm32.dll` from the system directory (avoids DLL-hijacking); every method null-checks and returns a safe default if missing |
| macOS keyboard-layout shim | `KeyboardLayoutMac.h/.mm` | Isolated Obj-C++ static-lib target purely to dodge a `Carbon.framework`/Blue namespace collision |
| Python surface | `python/inputmethod/__init__.py` | `sys.modules[__name__] = blue.LoadExtension("_ime")` — entire package identity replaced at import time |

**Ideas worth stealing (Odin mapping):**

| Idea | Odin mapping |
|---|---|
| Package-per-capability, not a monolithic input module | Keep OS-integration bindings (IME, clipboard, native dialogs) as separate opt-in `svsw.*` binding packages per D42, each with its own opt-in flag |
| Late-bind optional OS libraries via `LoadLibrary`/`dlopen`, safe-default on null | Odin's `core:dynlib` for any Windows/macOS-only capability, loaded at runtime behind a feature check |
| Compile-time platform forking at the public-API level | `when ODIN_OS == .Windows`/`.Darwin` around the Lua binding registration function so unsupported platforms simply lack the methods, rather than exposing always-failing stubs |
| Quarantine a troublesome system-framework header behind a minimal separately-compiled shim | Wrap any future macOS-specific system framework need behind a tiny foreign-import shim file |
| Lightweight "call every exposed method once, assert no crash" smoke test | A matching Lua smoke test for thin platform bindings — cheap regression net even when deep testing is impractical |

**Anti-lessons.** Windows-only majority API surface — no portable core logic
to extract beyond the late-binding pattern. Raw `HWND`-as-uintptr_t handoff
assumes a single global native window, doesn't fit SVSW's sokol-abstracted
windowing model where script never sees raw handles. **Silent failure-to-
false/zero on missing DLL symbols or unset state hides errors from both C++
and Python callers — this directly conflicts with SVSW's requirement that a
mod/script boundary surface errors loudly (stack traces), not degrade
silently; this is the one clear anti-pattern to flag when reviewing any Lua
analog.** Checked-in test uses a Python-2 long-literal (`2L`) — legacy-era
artifact, not current guidance. Pure client-side OS glue with zero relation
to networking/ECS/ticking/scale.

---

## `io` (`carbon-io` / CARBON.IO)

**Purpose.** A patched fork of CPython 3.12's C `socket`/`ssl` extension
modules (plus unmodified `select`), rebuilt against libuv so socket calls
suspend the calling tasklet instead of blocking the OS thread. Also
implements a length-prefixed binary packet-framing protocol for CCP's
machoNet RPC layer. Modules are monkey-patched into `sys.modules` in place
of `_socket`/`_ssl`/`select` at interpreter startup.

**Role in the engine.** The low-level async-IO substrate beneath Carbon's
Python-hosted server logic; sits below `blue` and beside `carbon-scheduler`
(providing `PyChannelObject` as the wait/wake primitive). `carbon-db`
piggybacks on the same exposed uv_loop.

**Key subsystems:**

| Subsystem | File paths | What |
|---|---|---|
| Async request objects | `src/carbonio.h/.cpp` | `IRequest`/`IStreamRequest`/`IUdpRequest` hierarchy, one subclass per async op, each blocking the calling tasklet on a `PyChannelObject` |
| `HandleData`/`RequestData` | `src/carbonio.h`, `carbonio.cpp:132-230` | Per-socket state with single-outstanding-reader/writer enforcement; safe teardown cancels outstanding requests and force-wakes blocked tasklets with `Py_False` |
| Event loop pump | `src/carbonio.cpp:90-130, 340` | One `uv_loop_t` per OS thread via TLS; driven with `uv_run(loop, UV_RUN_NOWAIT)` exactly once per engine tick from Blue's `dispatch()` |
| Packet framing | `src/protocol.h`, `carbonio.cpp` (`StreamPacketReceiveRequest`) | 4-byte big-endian header: top 4 bits flags (zlib-compressed, OOB-offset-present, reserved-extension bit), low 28 bits size |
| Python/C++ boundary helpers | `src/BluePyCpp.h`, `carbonio.h:24-32` | `PyGilEnsure` RAII GIL guard; `PyObjectPtr` exception-safe refcounting |
| Channel C ABI | `src/c_channel.h/.cpp` | Thin `extern "C"` wrapper exposing `carbon-scheduler`'s C++ tasklet-channel type to code compiled without its C++ ABI |

**Ideas worth stealing (Odin mapping):**

| Idea | Odin mapping |
|---|---|
| Single non-blocking pump call once per deterministic tick, never mid-simulation | A single poll point per tick (epoll/kqueue non-blocking, or a small Odin async_io layer) draining IO completions deterministically — preserves D11 |
| Per-handle single-outstanding-operation guard with a park/queue | Enforce "one read in flight, one write in flight" per handle with an explicit wait queue if SVSW exposes async socket/file handles to Lua |
| Explicit narrow C ABI between two components, no leaked internal layout | Directly validates the Odin<->Lua boundary rule already in CLAUDE.md: `proc "c"` entry points with plain data only, never Odin struct internals |
| GIL-guard RAII taken exactly at the callback-reentry point | Reconstruct/acquire Odin `context` at every C-callback entry point before touching allocator-dependent or Lua state — this repo is a working example of that discipline applied to a same-language (C++/C++) boundary |
| Length-prefixed framing with reserved extension bits | A proven minimal wire-protocol design for a future Go services layer client<->server protocol |
| Invalidate-then-wake-with-explicit-cancel-sentinel on handle close | General pattern for any Odin resource with async waiters — avoids both use-after-free and stuck coroutines |
| Bounded atomic-counter stats (bytes/packets) instead of a full metrics framework | Cheap dependency-free network diagnostics primitive for the Go server layer or Odin client |

**Anti-lessons.** Do not adopt Python-C-extension-module packaging or
`sys.modules` stdlib-swap monkeypatching — Lua has no equivalent idiom and a
much simpler C API. Do not copy the stackless/tasklet-channel scheduling
model as the concurrency primitive — an MMO-server-scale answer to tens of
thousands of concurrent tasklets; SVSW's Lua is already single-threaded/
deterministic (D11), and Go has native goroutines+channels. Do not vendor/
patch 10k+6.6k+2.8k lines of CPython socket/ssl/select just to get async
behavior — exactly the vendoring scale the project's own dependency policy
warns against. Windows is not an equally-weighted first-class target for
SVSW the way it is here. Reserved-but-unimplemented protocol header bits
(dead `ceHeaderBitSnappyCompressed`, unimplemented
`ceHeaderExtraHeaderBitsFollow`) are legacy cruft — design the Go wire format
for what's needed now.

---

## `localization` (`carbon-localization`)

**Purpose.** C++ localization/string-formatting engine embedded in Blue:
per-language message tables (message ID -> source text + markup tokens +
metadata), a "Cerberus" markup parser (`{tag}` placeholders), runtime
value substitution with locale-correct formatting/pluralization/casing, plus
locale-aware string collation.

**Role in the engine.** Leaf utility in the Blue tier consumed by `trinity`
(UI) and `destiny` (game logic) whenever player-facing text is displayed —
one of the cleanest, smallest examples of the C++<->Python object-lifetime
boundary pattern in Carbon (refcounting embedded directly in C++ structs).

**Key subsystems:**

| Subsystem | File paths | What |
|---|---|---|
| Message store | `localization.h`, `localization_blue.cpp` | `LanguageMap` -> `MessageMap` -> `MessageData`, keyed by 64-bit `MessageID` (opaque handle, not the string itself) |
| Markup parser | `parser.h/.cpp` | Scans `{...}` spans, matches a `Token` by exact substring, dispatches per-`VariableType` formatter or a pluralization conditional |
| Formatters | `formatters.h/.cpp` (573 lines) | Locale-aware number/date/time formatting, nested message formatting |
| Collator | `collator.h/.cpp/.mm` | `std::locale`-based on non-Apple, `NSLocale`/`CFString`-based on macOS |
| Pluralization | `parser.cpp`, `localization.h` | Three plug-in function-pointer strategies (`GetType1/2/3QuantityCategory`) covering English 2-way, Russian 3-way, Japanese 1-way plural classes |
| Python/C++ boundary | `localization_blue.cpp`, `python/eveLocalization/__init__.py` | ~15 free functions via `MAP_FUNCTION`; property handlers (character/item/location name resolution) call back INTO Python rather than duplicating game-state lookups in C++ |

**Ideas worth stealing (Odin mapping):**

| Idea | Odin mapping |
|---|---|
| Message IDs are opaque 64-bit integers, not string keys | Represent localized strings as a Lua-exposed constant table mapping a stable symbolic ID to per-language entries; mods register their own ID ranges like data-stage content |
| Markup tokens parsed and stored separately from raw text, no positional/printf ordering assumed | A `svsw.text.format(msg_id, kwargs)` doing named substitution against a token map baked at content-load time |
| Locale pluralization via a small closed set of quantity-category function pointers | A `proc(quantity: i64) -> int` selector per language, no external CLDR/ICU dependency needed |
| Property handlers needing live game state call back to script rather than duplicating lookups in the native layer | Keep locale/string-formatting mechanics in Odin, but let Lua mods supply the "resolve this ID to a display string" callback |

**Anti-lessons.** `LanguageID` enum is literally the Windows LCID table — use
an OS-independent scheme (e.g. BCP-47 strings) instead. Collator has a real
per-OS split (`std::locale` vs `NSLocale`) — maintaining two platform paths
costs more than one portable approach. Deep, code-level coupling to CPython's C API
embedded inside data-structure copy constructors (`Token::operator=`) is
exactly the kind of foreign-runtime-lifetime leakage SVSW's `proc "c"`
callback + context-reconstruction design is built to avoid — a concrete
illustration of why that discipline matters. `MessageMap`/`TokenContainer`
inheriting from `std::map` with manual per-entry `delete` in destructors is a
fragile ownership pattern; a flat arena/slice-of-structs is simpler and
safer in Odin.

---

## `.github` (`carbon-github-meta`)

**Purpose.** Organization-wide GitHub meta repository for the Carbon
Development Platform: community health files (README, SECURITY.md,
CODE_OF_CONDUCT.md) auto-applied across all repos in the `carbonengine` org.

**Role in the engine.** None — organizational/community scaffolding only. No
engine source code, headers, build files, or architectural content.

**License note.** No LICENSE file present in this repo per the survey.
`CODE_OF_CONDUCT.md` is explicitly CC BY 3.0 (adapted from the "Speak Up!"
project); README.md and SECURITY.md carry no license notice. This repo
cannot be used as evidence of license terms for Carbon's actual engine
source — check each code repo individually (see `carbon-inventory.md`'s
per-repo license column).

**Ideas worth stealing:** SECURITY.md scopes vulnerability-disclosure policy
explicitly to open-source repos, excluding the live production game/service,
with a distinct contact for each — a clean open-engine/live-service trust
boundary split worth adopting if/when SVSW opens a public security contact.
It also explicitly rejects unverified AI-generated vulnerability reports
unless a human has reproduced them from a clean clone — worth borrowing
verbatim as a policy line.

**Anti-lessons.** No engine content whatsoever — don't spend further budget
treating `.github` meta-repos as technical source material. The org spans
commercial live-service games with a dedicated production security team
separate from open-source triage — MMO-scale operational process not
applicable to a small-team single-developer engine.

---

## `math` (`carbon-math`)

**Purpose.** Standalone C++ math library: `Vector2/3/4`, `Matrix`,
`Quaternion`, `Plane`, `Color`, `Float16` (half-float), and bounding-volume
(`AxisAlignedBox`, `AxisAlignedEllipsoid`, `Sphere`, `Ray`) types, shipped as
static library `CcpMath` with split declaration/inline header pairs so
hot-path operators stay inlinable across translation units.

**Role in the engine.** A pure leaf dependency — no engine-specific types,
no ECS/ID types, no Python glue. Every geometry-touching component is
expected to link against `CcpMath` rather than defining its own math,
giving the whole engine one canonical numeric representation.

**Key subsystems:**

| Subsystem | File paths | What |
|---|---|---|
| `Vector2/3/4` | `include/Vector3.h`, `Vector3_inline.h`, `src/Vector3.cpp` | Public-field structs; operators; `Dot`/`Cross`/`Length`/`Normalize`/`Lerp`/`Hermite`; implicit `XMVECTOR` conversion |
| `Matrix` | `include/Matrix.h`, `Matrix_inline.h`, `src/Matrix.cpp` | Row-major 4x4 union (`_11.._44` aliased with `m[4][4]`); factory functions; `Inverse`/`Determinant`/`Decompose`; batch `TransformCoords` |
| `Quaternion`, `Plane`, `Color`, `Float16` | `include/Quaternion.h`, `Plane.h`, `Color.h`, `Float16.h` | Rotation math; `IntersectLine`/`DotCoord`/`DotNormal`; half-float pack/unpack via `DirectXPackedVector` |
| Bounding volumes | `include/AxisAlignedBox.h`, `AxisAlignedEllipsoid.h`, `Sphere.h`, `Ray.h` | Intersection/containment primitives layered on the vector/matrix types |
| `Requirements.h` | `include/Requirements.h`, `CMakeLists.txt` | Pulls in `<DirectXMath.h>`/`<DirectXPackedVector.h>`; inert `_WIN32`-guarded block |

**Ideas worth stealing (Odin mapping):**

| Idea | Odin mapping |
|---|---|
| Declaration/inline header split for hot-path inlining across TUs | Odin doesn't need this (same-package procs inline trivially); mark hot ops `#force_inline` where profiling justifies it |
| One umbrella math header re-exporting every sub-header | A single `engine/math` package export — Odin gives this for free via package imports |
| Implicit conversion to/from a fast SIMD backend type | Explicit `to_simd`/`from_simd` procs; let SIMD-heavy procs round-trip through `core:simd` internally |
| Free functions over methods (`Dot(v1,v2)`, not `v1.Dot(v2)`) | Directly idiomatic Odin; use proc-group overloading (`transform :: proc{transform_v2, transform_v3, transform_v4}`) |
| Reciprocal-multiply once instead of three separate divides | Same micro-optimization directly portable into Odin math procs |
| `Normalize()` divides by max-abs-component first to guard against overflow before squaring | Worth porting verbatim — relevant since SVSW's world-space vectors can get large |
| Pure leaf math library with zero dependency on engine internals/ECS/scripting/IO | Enforced structurally: `engine/math` should never import `engine/ecs`/`engine/scripting`/`engine/render`; worth an import-direction check in CI |
| Value types with public fields, no encapsulation | Matches Odin's existing idiom already |

**Anti-lessons.** Hard dependency on Microsoft's DirectXMath is exactly the
kind of large third-party dependency SVSW's quarantine-first policy would
reject — `core:math/linalg` + `core:simd` already covers this with zero
vendoring. `Requirements.h` still textually includes a Windows-guarded block
in a "platform-neutral" header — Windows-first-heritage residue not worth
reproducing even as inert dead code. CMake/vcpkg/submodule-heavy build
plumbing is proportionate for CCP's monorepo but overkill for SVSW's
vendored-source-tree approach. Row-major `_11.._44`-named `Matrix` mirrors
D3D/HLSL conventions specifically — adopting the same naming would import D3D
assumptions with no payoff for a sokol-based renderer.

---

## `mesh` (`carbon-mesh`, CMF library)

**Purpose.** Standalone C++ library (+ optional CLI processor and GUI
viewer) defining and implementing the CMF binary format for serializing 3D
mesh geometry (multi-LOD, multi-area, morph targets), skeletons, and
skeletal animation curves, plus a lightweight runtime for sampling/
blending/playing that data. An offline-authoring-to-runtime asset pipeline
component, not a live simulation subsystem.

**Role in the engine.** The on-disk/interchange representation for 3D
assets used by `trinity` and the offline content pipeline (FBX/glTF import,
LOD generation, audio-occlusion mesh baking). No Python/Blue bindings
anywhere — a pure C++ library consumed by native code.

**Key subsystems:**

| Subsystem | File paths | What |
|---|---|---|
| cmf core format | `include/cmf/cmf.h`, `v1.h`, `span.h`, `writer.h`, `src/cmf/writer.cpp` | Versioned binary format (`v1::` `Mesh`/`Skeleton`/`Animation`/`Section`/`Header`); relocatable `Span<T>`/`String` types |
| Memory & buffer management | `include/cmf/memallocator.h`, `bufferstreams.h`, `compression.h` | Arena allocator (`MemoryAllocator`), `BufferManager` with on-demand decompression, typed `BufferElementStream`/`IndexBufferStream` |
| Animation runtime | `include/cmf/animation.h`, `src/cmf/animation.cpp` | `SkeletonPose`, curve sampling, pose blending (linear/additive, per-bone-mask weighted), `AnimationPlayer`/`AnimationSequencer` |
| Mesh processing utilities | `include/cmf/{bounds,tangents,uvdensity,declutils,transforms,bufferutils,utils}.h` | Bounding boxes, tangent-space generation (mikktspace), UV density, vertex-declaration lookups |
| `cmfprocessor` CLI | `src/processor/main.cpp`, `fbximport/*` | Offline: FBX/glTF import, LOD generation (meshoptimizer/Simplygon), audio-occlusion mesh, hash/validate/dump-JSON |
| `CarbonMeshViewer` | `src/viewer/rendering/vulkan/*`, `main.cpp` | Standalone Vulkan+ImGui debugging/QA app, separate from Trinity's renderer |

**Architecture patterns.** Single self-contained flat binary format with a
section table (offset/compressedSize/uncompressedSize/gpuAlignment/type/
compression per section); struct-of-spans data model with compile-time
`EnumerateMembers(visitor)` on every serializable struct driving generic
offset<->pointer fixups with zero per-type boilerplate; relocatable pointers
via `SpanRepr` (LSB-tagged offset-vs-pointer union) enabling zero-copy load
plus in-place editing with one representation; streaming views decoupling
wire format from element type via a small converter table; multi-LOD,
multi-area mesh model as first-class independently addressable slices;
animation runtime fully separate from the storage format (no back-reference
to file IO); CMake isolates the pure library from optional `BUILD_TOOLS`
targets.

**Python/Blue integration.** None found — pure C++, no PyObject/boost::python
references. The blue/Python boundary, if any, lives in a different calling
repo.

**Ideas worth stealing (Odin mapping):**

| Idea | Odin mapping |
|---|---|
| Tagged offset/pointer `Span` for zero-copy load-in-place + in-memory mutation | Two clearly named load paths (`load_from_bytes` vs `build_in_memory`) rather than a runtime tag; Odin slices are already just ptr+len, castable directly over mmap'd bytes for POD sections |
| Self-describing compile-time member enumeration driving generic serialization | Odin's `reflect` package or a lightweight struct-field-metadata convention for a generic `flatten_data :: proc(v: any)` — matches SVSW's existing schema-laid-out native storage philosophy |
| File format with a section table separating typed metadata from raw GPU buffer blobs | Directly reusable for SVSW's own asset formats: one small typed header + N raw byte sections, letting the loader upload GPU sections straight to the renderer with correct alignment |
| Vertex-declaration-driven typed streams decoupling "what type is wanted" from "what's stored" | A small Odin `decode_vertex_element` switch over an `ElementType` enum for a future 3D/skinned-mesh renderer |
| Clean separation of storage-format package, runtime package, and tooling, gated by build flags | Mirrors SVSW's existing `engine/render` vs `engine/render/gpu` split (D15); apply the same discipline to any future `engine/mesh` package |
| Arena-style allocator that never frees individually, only frees everything at once | Odin's built-in `core:mem` `Arena`/`Dynamic_Arena` — a per-level/per-asset arena freed wholesale on unload |

**Anti-lessons.** Compile-time reflection via `EnumerateMembers` + SFINAE is
elegant C++ template metaprogramming with no Odin equivalent worth chasing —
Odin's SoA/procedural style plus explicit serialization procs are simpler
and idiomatic. Offset/pointer tagged union in `SpanRepr` is UB-adjacent
pointer arithmetic hidden behind unions that only works because of C++ ABI
guarantees — an Odin port should use an explicit tagged struct (enum
discriminant + offset/ptr fields), not reproduce the union hack. AAA
production tooling depth (FBX SDK, optional Simplygon LOD, Vulkan+ImGui
viewer) is tooling investment beyond what the file-format core requires —
clone the file-format core, not the processor/viewer scope. vcpkg +
submodule-heavy dependency graph is EVE/CCP-scale infra; keep the dependency
surface much smaller per SVSW's vendor/ quarantine policy. Standalone
offline/tooling component with no live ECS ties — do not over-index on this
repo for scripting-boundary design.

---

## `parser` (CcpParser, Carbon math expression parser)

**Purpose.** Standalone, dependency-free C++ library compiling a text math
expression (`"sin(x)*2 + max(a,b,3)"`) into a compact bytecode `Program`
evaluated repeatedly against externally-supplied variables/functions/
constants, returning a single float. Grammar/lexer are generated (Lemon +
re2c) into a small register-based VM plus a code builder doing constant
folding of pure functions at parse time.

**Role in the engine.** A small leaf utility, not one of Carbon's core
subsystems — embedded by other subsystems for data-driven numeric formulas
(damage/skill/attribute formulas, UI layout expressions, config-driven
tunables) where a designer types a formula string evaluated fast at runtime
without recompiling C++. Zero dependencies on `trinity`/`destiny`/`blue`.

**Key subsystems:**

| Subsystem | File paths | What |
|---|---|---|
| Public API | `include/ccpparser.h` | `Parse(expression, Externals, Program&, Observer*)`; `Program::Eval(externData, tempArena)` -> float |
| External binding surface | `include/externals.h` | `Externals` exposes typed `VariableView`/`FunctionView`/`ConstantView`; `VariableFactory` callback for dynamic resolution |
| Function ABI | `include/externals.h` (`Function`), `src/code.h` (`PackedFunction`) | Type-erased `void*` + arity + flags (`PURE_FUNC`, `USES_CONTEXT`, `USES_STRING_ARG`); context resolved at Eval time from a (buffer index, byte offset) pair, not baked into the compiled Program |
| Bytecode VM | `src/code.h`, `program.cpp` | `Register{offset:22, type:10}` packed into 4 bytes; flat `uint8_t*` instruction stream, switch-in-loop dispatch, no bounds checks (trusts its own compiler output) |
| Frontend | `src/scanner.re`, `parser.y`, `parserstate.h/.cpp`, `codebuilder.cpp` | re2c/Lemon-generated lex/parse; typed errors (no exceptions); constant-folds `PURE_FUNC` calls with all-literal operands |
| Standard library | `src/stdfunctions.h/.cpp` | Built-in pure math functions/constants (`sin`/`cos`/`log`/`min`/`max`/`avg` etc.) |

**Python/Blue integration.** None directly — but its `Externals`/`Function`
binding mechanism is the structural analog of what an Odin<->Lua boundary
needs: exposing native host functions to a scripted/data-driven caller
without RTTI, exceptions, or per-call heap allocation.

**Ideas worth stealing (Odin mapping):**

| Idea | Odin mapping |
|---|---|
| Tiny, allocation-light bytecode VM for evaluating designer-authored numeric expressions | A possible `svsw.expr`/`svsw.formula` module: compile once, cache the `Program` on a data-table entry (mirrors D42 `svsw.data`), eval per-entity per-tick without a full Lua closure |
| Deferred context binding via (buffer index, offset) resolved at Eval time | Bind an expression's context to a component's byte offset within SVSW's schema-laid-out native storage — one compiled formula evaluates against any entity's component data |
| `PURE_FUNC` flag enabling constant folding at compile time | Mark `svsw` stdlib math functions as pure and fold literal-only calls when compiling data-driven formulas |
| Typed, no-exception error result threaded through lexer/parser/codegen | Transliterates directly to Odin's multi-return `(value, err)` idiom; fits "mod errors reported with traces, never crash" |

**Anti-lessons.** This is a single-purpose float-expression compiler with a
fixed, hand-rolled ABI (float-only args, <=8 args) — not a general scripting
solution or a template for the Odin<->Lua boundary itself; SVSW already has
a full Lua VM. Uses `reinterpret_cast` to reconstruct function-pointer types
from a type-erased `void*` — UB-adjacent; Odin has no equivalent need,
prefer explicit tagged unions or generated code. Build depends on external
codegen tools (Lemon, re2c) — weigh a hand-written small recursive-descent
Odin parser against pulling in a codegen toolchain SVSW's stdlib-first
policy would rather avoid. No bounds-checking in the Eval hot loop trusts
its own compiler as the only producer — any Odin port must keep bytecode a
strictly internal, non-serialized, non-mod-authored artifact, or add
verification.

---

## `pathfinder`

**Purpose.** Standalone C++ library finding jump routes through EVE's static
universe graph of solar systems/constellations/regions: weighted A*/Dijkstra
plus flood-fill, pluggable "goal" strategies, a reusable open/closed-list
cache for repeatable or time-sliced pathfinding.

**Role in the engine.** Leaf/utility service module, not part of `trinity`
or `destiny`; compiled as its own shared library, depends only on
`carbon-blueexposure` and `carbon-core`; consumed entirely through Python
(`blue.LoadExtension('_pyevepathfinder')`).

**Key subsystems:**

| Subsystem | File paths | What |
|---|---|---|
| `EveMap`/`EveMapNodes` | `EveMap.h/.cpp`, `EveMapNodes.h` | Static graph storage in two contiguous vectors; opaque typed handles `EveMapNodeID`/`EveMapClosedListNodeID`, never raw pointers |
| `IEvePathfinderGoal` strategy interface | `Include/IEvePathfinderGoal.h`, `EveDjikstrasGoal.*`, `EveStandardFloodfillGoal.*` | Pure virtual `IsGoal`/`GetNeighbours`/`GetHeuristicEstimate`/`GetTraversalCost`; separates generic search from search policy |
| `EveMapPathfinderCache` | `EveMapPathfinderCache.h/.cpp` | Owns closed list (reused across calls via `ClearCache()`) and open list (`std::priority_queue` min-heap) |
| `RunPathfinder` | `EvePathfinder.h/.cpp` | The A*-style loop; explicit design comment states it's written to allow future multithreading (separate cache per thread) and time-slicing |
| Blue exposure | `*_Blue.cpp` (5 files), `PResultBeResult.h` | `Be::Result<PRESULT>` templated result wrapper mapped to `PyExc_RuntimeError` via a static error-string table |

**Ideas worth stealing (Odin mapping):**

| Idea | Odin mapping |
|---|---|
| Opaque typed handles (distinct index types for two parallel index spaces) | Odin `distinct` types over integer indices, catching a whole bug class at compile time for free |
| Strategy-interface separation of search algorithm from search policy | A struct-of-procs `Goal` passed by value/pointer into a generic `run_pathfinder` proc — same decoupling, no vtables |
| Reusable scratch cache explicitly separated from static map data, reset not freed | Mirrors a per-frame/per-system scratch-arena pattern with node storage as a flat slice sized once |
| Single mutable-state object threaded explicitly as a parameter (no global/singleton) | No global mutable pathfinding state; every reentrant algorithm takes scratch state as an explicit parameter, enabling per-worker partitioning |
| Uniform boundary-crossing error convention (typed Result, translated only at the FFI edge) | Odin procs return `(ok, err)`; only the `svsw.*` Lua binding shims translate to `lua_error` with a static string table |
| Centralized handle-validation macros at every public entry point | A small set of Odin helper procs validating handles at the top of every exported `svsw.*` binding proc |

**Anti-lessons.** Heavy macro/reflection machinery (`BLUE_CLASS`/
`EXPOSURE_BEGIN`) is overkill for a two-person team — Lua's C API plus
SVSW's D42 convention is already simpler. Windows-first build assumptions
(only documented workflow is `cmake --preset windows`). Raw owning pointers
with manual `new`/`delete` in the hot loop, with the code's own TODOs
admitting pooling was never added — an Odin port should use an arena/pool
from the start. `std::priority_queue` of pointers is a fully-sorted
structure the code's own comment calls wasteful — don't treat as the
reference approach; prefer a binary heap over indices/values directly.
`(unsigned int)-1` used as an "unvisited" sentinel is a classic wraparound
footgun — use an explicit optional or the already-present `m_visited` flag
instead. Not independently buildable outside CCP's monorepo — read-only
reference material.

---

## `pdm` (Platform Detection Module)

**Purpose.** Small, standalone, OS-agnostic C++17 library (+ `pdmCLI`)
gathering a machine's hardware/OS/driver/VM-detection profile — CPU, GPU,
monitors, network adapters, hard drives, OS version, graphics API support,
locale, battery, Wine/Rosetta status, VM/streaming-service signals — into
one hierarchical structure for diagnostics/support/telemetry.

**Role in the engine.** A leaf utility with no dependencies on
`trinity`/`blue`/`destiny`/`scheduler`; a one-shot "describe this machine"
facility for the client/installer/crash-reporter/support pipeline. No
Python/blue integration found.

**Key subsystems:**

| Subsystem | File paths | What |
|---|---|---|
| Public API | `include/pdm.h`, `pdm_data.h` | Flat function API over POD structs (`CPUInfo`, `GPUInfo`, `MonitorInfo`, `PDMData`), no classes/handles |
| Cross-platform aggregator | `src/gatherer.cpp`, `pdm.cpp` | Platform-neutral assembly into a recursive `SubItem`/`DataField` tree; memoized via a function-local static |
| CPU feature/VM detection | `src/cpu_extensions.h` | Raw CPUID leaves; hypervisor-bit + RDTSC-timing-based VM detection |
| Windows backend | `src/windows/windows_data.cpp`, `d3d_info.cpp`, `vulkan_info.cpp` | WMI/COM hard-drive queries, registry reads, D3D/Vulkan probing |
| macOS backend | `src/macos/macos_data.mm` | AppKit/IOKit/Metal/sysctl for the same field set |

**Ideas worth stealing (Odin mapping):**

| Idea | Odin mapping |
|---|---|
| One exported proc gathering a plain POD `Platform_Info` struct | An `engine/platform_info` Odin package, `gather() -> Platform_Info`, called once at boot; expose a stable subset to Lua as `svsw.platform_info` for capability branching, never fingerprinting |
| Recursive generic name/value tree + one serializer for hierarchical diagnostic data | A `Sub_Item :: struct{name, subitems, items}` type reused for crash dumps, `svsw run --dump-info`, golden-hash debug reports |
| Low-level hardware probing isolated in one small package with a boring C-style API | If instruction-set dispatch is ever needed, isolate CPUID-equivalent logic the same way — one `engine/cpu_features` package, pure functions, no global leakage |
| Compile-time platform dispatch by separate source file per OS, one shared contract | Odin's own file-suffix build tags (`_windows.odin`, `_darwin.odin`) already do this natively — validates the existing approach |

**Anti-lessons.** Windows-heavy WMI/COM/WBEM implementation is dead weight
for a smaller cross-platform target — port the field list, not the plumbing.
VM/hypervisor detection via timing side-channel is anti-cheat/anti-streaming
infrastructure for an MMO with a real economy — a small 2D game has no
reason to fingerprint VMs, and timing-based detection invites false
positives on legitimate cloud/CI users. Wine/Rosetta/streaming-service
detection are fleet-support-triage concerns not needed from day one. The
global mutable singleton cache (non-thread-safe double-checked pattern)
would violate SVSW's determinism/no-hidden-global-state discipline if copied
into engine code — fine for a one-shot CLI tool, not for the ECS core.

---

## `pdm-proto-wrapper`

**Purpose.** Tiny (~315KB) C++17 static library taking `pdm`'s output and
serializing it into a versioned Protobuf message (`eve_public.app.platform.
Information`, plus a deprecated `eve_launcher.pdm.Information` schema). Two
functions: `pdm_proto::GetData(ostream*)` / `GetEVEPublicData(...)`.

**Role in the engine.** Not a runtime subsystem — sits at the boundary
between `pdm` (a separate dependency, not present in this repo) and
telemetry/launcher infrastructure.

**Key subsystems:**

| Subsystem | File paths | What |
|---|---|---|
| Public API | `include/pdm/protobuf.h` | Three free functions; no exceptions crossing the API |
| Templated dual-schema generator | `src/protobuf_template.h`, `protobuf_public.cpp`, `protobuf_launcher.cpp` | One shared field-mapping body compiled twice under a preprocessor flag, avoiding duplicating ~250 lines for current vs. deprecated schema |
| PDM-to-Protobuf field mapping | `src/protobuf_template.h` | Exhaustive switch-based enum mapping, `throw std::invalid_argument` on unmapped case — fail loud, not silent |
| Vendored semver parser | `src/semver.h/.cpp` | Small self-contained SemVer 2.0 parser, table-driven gtest |
| Committed generated Protobuf code | `generated/eve_public/app/platform.pb.h/.cc` | Pre-generated `protoc` output checked into the repo, avoiding a build-time `protoc` dependency for consumers |

**Ideas worth stealing (Odin mapping):**

| Idea | Odin mapping |
|---|---|
| Boundary functions return bool/explicit result, never throw across the public contract | `proc(...) -> (ok: bool)` or a discriminated `Error` result for any Odin boundary serializing state out (save files, telemetry, replay headers) |
| One shared mapping implementation compiled twice for two schema versions | A generic proc parameterized on the target schema type, or a small codegen script, if SVSW ever needs to support two save/protocol versions simultaneously during migration |
| Exhaustive enum-to-wire mapping with an explicit throw-on-default, not silent fallthrough | Full (non-`#partial`) switch for engine-enum-to-serialized-format mappings so the compiler flags unhandled cases |
| Pre-generated code committed for consumer convenience | If SVSW adopts a schema/codegen tool, consider committing generated Odin source with a `just` recipe to regenerate — mirrors `just vendor-libs` |

**Anti-lessons.** Zero relevance to Lua/Python embedding, ECS, rendering, or
gameplay — pure hardware-telemetry plumbing, no Odin/Lua-analog boundary
logic to study here. Heavy CMake/vcpkg triplet machinery for shipping a
closed-source client across many linkage configurations is irrelevant to a
`just`/vendored-source workflow. Depends on an external, not-included `pdm`
submodule for all actual detection — this repo only proves the serialization
pattern. Committing 5000+ lines of generated code is a pragmatic but
heavyweight choice for a closed internal toolchain — for Odin (no protobuf
codegen ecosystem), regenerating at build time, or not using protobuf at
all, fits better.

---

## `prometheus` (eve-monolith-prometheus)

**Purpose.** Thin native C++ wrapper around `prometheus-cpp` exposing
Counter/Gauge/Histogram/Summary metric types to Python as a CPython
extension module, plus an embedded HTTP server (CivetServer) serving
`/metrics`.

**Role in the engine.** Pure server-side observability/telemetry glue inside
monolith's (CCP's Python/Stackless server framework) Python/C++ boundary
layer — no dependency on or visibility into ECS/rendering/world simulation.
Structurally the smallest, most self-contained example of "wrap a C++
library and expose an object-oriented API to Python via the raw CPython
C-API" in the whole Carbon corpus.

**Key subsystems:**

| Subsystem | File paths | What |
|---|---|---|
| Extension module init | `prometheus_module/module.cpp` | `PyInit_prometheus_module<FLAVOR>`; hand-rolled raw CPython C-API, no pybind11/Boost.Python |
| Native/Python object wrapping | `prometheus_module/counter.h/.cpp` (mirrored for gauge/histogram/summary) | pImpl C++ class + `CounterPyObject` CPython struct; native pointer crosses via `PyCapsule`; Python GC becomes sole owner thereafter |
| Lazy metric instantiation + label-value caching | `counter.cpp` (`Counter_WithLabelValues`, `Counter_init`, `Counter_dealloc`) | `LazyInstantiate` defers registration until first use; `WithLabelValues()` results memoized per-family keyed by canonicalized label string |
| Interface headers | `metric_registry.h`, `metric_factory.h`, `include/counter_interface.h` | Pure-virtual `*_interface.h` headers form a stable ABI-ish seam separate from concrete Python-glue classes |
| HTTP exposition endpoint | `exposer.cpp/.h`, `handler.cpp/.h` | `CivetServer` binds a configurable address; `registry.Serve('8080')` starts it from Python |

**Ideas worth stealing (Odin mapping):**

| Idea | Odin mapping |
|---|---|
| Lazy metric registration deferring real allocation until first use | `svsw.metrics.counter("name")` returns a lightweight handle immediately, with Odin-side storage allocated lazily on first increment — useful across Lua hot reload |
| Family/child caching keyed by a canonicalized label string, identity-equal handle on repeat calls | Cache a returned Lua-side handle in an Odin map keyed by canonical label string, hand back the same handle for identical keys |
| Thin pure-virtual interface seam decoupled from the scripting language, primitive-only params | Matches SVSW's existing D42 separation between Lua-facing binding package and engine-internal Odin procs |
| Single explicit ownership handoff point (capsule created once, freed exactly once on GC) | For Lua userdata wrapping Odin structs: allocate once, hand a single opaque handle to Lua, free exactly once from `__gc` |
| Config-driven tunable parameters passed as data at creation time, not hardcoded | General pattern for any `svsw.*`-exposed subsystem: tunables as constructor args from Lua/mod data, not compiled into Odin core |

**Anti-lessons.** Hand-rolled raw CPython C-API bindings with manual
`Py_IncRef`/`Py_DecRef` bookkeeping in every init/dealloc are exactly the
manual-refcounting, hard-to-audit boundary code SVSW's Lua boundary already
avoids — one dealloc path even shows a `delete self->family` after a
`Py_DecRef(self->family)` that looks like a use-after-decref-adjacent smell,
worth avoiding rather than copying. Embedded HTTP server for pull-based
metrics scraping is server/ops infrastructure for a Python service fleet,
not something a 2D game client needs — a push-based or no-telemetry approach
fits the Go services tier better. MSVC/Windows-oriented build assumptions
(precompiled headers, multi-flavor `PyInit_` symbol tricks) solve a
Windows/MSVC build problem that doesn't exist in a straightforward Odin
build. The vcpkg + two-registry-submodule + TeamCity pipeline is CCP's
enterprise infra, not applicable to a `just`-driven small repo.

---

## `red-to-black-converter`

**Purpose.** Standalone CLI tool baking Carbon's human-authored `.red`
(YAML) resource files into `.black` binary resource files for fast runtime
loading, parallelized across a process pool.

**Role in the engine.** Offline asset-pipeline/resource-cooker utility,
downstream of content authoring and upstream of the runtime resource loader.
Depends on `blue` (object glue/serialization), `trinity`, and `audio2` (for
type registration of resource types) — none present in this repo, so the
tool is non-functional standalone (the README says so explicitly).

**Key subsystems:**

| Subsystem | File paths | What |
|---|---|---|
| `RedToBlackConverter` | `src/redtoblack/converter.py` | Wraps `blue.YamlReader`/`blue.BlackWriter`; `bake()` reads via `CreateObjectFromFile`, writes via `WriteObjectToFile`; requires importing `trinity`/`audio2`/`blue` purely for type-registration side effects before deserializing |
| Parallel directory walker | `src/redtoblack/bake.py` | `os.walk` yields every `*.red`; `ProcessPoolExecutor` (configurable `maxWorkers`/`maxTasksPerChild`), one converter instance per process task |
| CLI entrypoint | `src/redtoblack/__main__.py` | argparse CLI, packaged as a pip console-script |

**Ideas worth stealing (Odin mapping):**

| Idea | Odin mapping |
|---|---|
| Separate human-authored source format from runtime-loaded binary format, offline cooker not runtime-baked | Validates SVSW's existing LDtk/Aseprite pipeline pattern (source asset -> baked asset) and an explicit `svsw package`/cook step rather than parsing YAML/JSON at boot |
| Per-process worker isolation for a batch content pipeline, bounded pool with worker recycling | Use OS-process or goroutine-per-file parallelism with a bounded pool and periodic recycling for a batch `svsw package` cooking step |
| Explicit type-registration-before-deserialize | Maps to the Lua binding boundary (D42): each mod/engine subsystem must register component/type schemas before serialized data referencing that type loads, in a well-defined boot order |

**Anti-lessons.** Non-functional in isolation — a resource cooker requiring
the full renderer/audio stack linked in just to bake generic data resources
is a pattern to avoid; keep an Odin cooker's data (de)serialization decoupled
from renderer/audio type registration wherever possible. Uses Python
multiprocessing/pickling — the mechanism doesn't transfer to Odin/Go, use
native goroutines or an Odin thread pool. No error handling for malformed
files, missing registrations, or partial writes, and no hash-based
incremental rebuild — a production-grade Odin cooker should have per-asset
failure isolation and content hashing, not copy this minimal example's gaps.

---

## `resources` (`carbon/resources`)

**Purpose.** Standalone C++ library + CLI (`carbon-resources`, v4.3.1) for
building, packaging, patching, and delivering game asset "resources":
directory -> versioned YAML manifest, chunked/compressed CDN-style "Bundle,"
or bsdiff-based binary "Patch" between two builds; plus download, filter,
merge, diff.

**Role in the engine.** CCP's offline/build-time asset-delivery pipeline —
analogous to a depot/patcher tool (like Steam's content system), not a
runtime engine subsystem. No coupling to ECS, rendering, or scripting; the
only relationship to the rest of Carbon is that it packages the same asset
files `trinity`/`destiny`/etc. load at runtime.

**Key subsystems:**

| Subsystem | File paths | What |
|---|---|---|
| `ResourceGroup` document model | `include/ResourceGroup.h`, `src/ResourceGroupImpl.{h,cpp}` | Versioned manifest abstraction: `CreateFromDirectory`, `Import`/`ExportToFile`, `Merge`, `DiffAgainstGroup`, `CreateBundle`, `CreatePatch` |
| `BundleResourceGroup` | `include/BundleResourceGroup.h` | Chunked, compressed "bundle" output with `Unpack` |
| `PatchResourceGroup` | `include/PatchResourceGroup.h` | Binary-diff patch set between two builds, with `Apply` |
| `ResourceTools` | `tools/include/*.h`, `tools/src/*.cpp` | Streaming file IO, gzip compression, rolling checksums (`RollingChecksum.h`), content-defined chunk indexing (`ChunkIndex.h`), bsdiff patching, curl-based downloading, filter-file DSL |
| CLI front end | `cli/src/main.cpp`, `*CliOperation.{h,cpp}` | argparse subcommands: `create-bundle`, `apply-patch`, `create-patch`, `diff`, `merge`, `unpack-bundle`, etc. |

**Architecture patterns.** Result-type-not-exceptions error model (`Result{
ResultType, info}` with a companion `ResultTypeToString`); params-struct-per-
operation API (defaulted-field aggregate structs, not long positional
lists); PIMPL + sealed hierarchy for ABI stability; layered
library/tool/CLI split (mechanism / document model / thin CLI); streaming
IO throughout (never whole-file-in-memory); content-defined chunking +
rolling checksum driving bsdiff patch generation; declarative resource
filtering DSL; structured progress/status callback (phase enum + percentage
+ nesting level + message), not stdout prints; explicit document/schema
versioning refusing unsupported versions.

**Python/Blue integration.** None — `python/project_name/__init__.py` is an
empty placeholder; this is a pure C++ static library, outside the
runtime blue boundary the task description covers for other components.

**Ideas worth stealing (Odin mapping):**

| Idea | Odin mapping |
|---|---|
| Result struct (enum + info string) instead of exceptions, with an enum-to-string companion | Odin multi-return `(ok, err)` or a tagged-union `Result`; expose the same enum across the Lua boundary as an int/string pair |
| Params-struct-per-call API with sensible defaults | One options struct per `cli/` operation (`svsw package`, asset baking), keeping commands stable as flags are added |
| Content-defined chunking + rolling checksum + binary diff for incremental patches | If SVSW ever ships binary patches, prototype rsync-style rolling-checksum + chunk-index + bsdiff using `core:hash` — only when patch size is an actual problem (YAGNI otherwise) |
| Streaming file IO with bounded chunk size | `svsw package`/`cli/scaffold` should use bounded buffered readers/writers from `core:os`/`core:io`, not whole-file reads |
| Structured progress/status callback (phase, percentage, nesting, message) | An optional callback param on `svsw package`/`svsw new`/bake procs carrying a small `Status_Event` struct, consumable by headless CI, CLI, and a future editor UI alike |
| Explicit on-disk schema/document versioning with a whitelist of supported versions | LDtk/save-file/replay formats and mod manifests should carry a `Version{major,minor,patch}` checked against an allowed-version table, returning a typed error |
| Declarative filter-file DSL for selecting resource subsets | Low priority: could help `svsw package` decide per-target asset inclusion, only if that need materializes |

**Anti-lessons.** MMO-CDN-scale patch/bundle pipeline (chunked binary diffs
across thousands of client machines) is overkill for a small-team engine
shipping via itch/Steam depot updates. vcpkg + CMake + Doxygen/Sphinx/
breathe/myst_parser doc toolchain requiring a "custom PythonInterpreter"
doesn't translate to Odin/`just`/markdown docs. Windows-and-macOS-only doc
build gate, no Linux mentioned — not a pattern to copy for a cross-platform
engine. Heavy PIMPL-per-class idiom exists to preserve a stable
`dllexport`/`dllimport` binary interface across DLL boundaries — Odin has no
such ABI-stability requirement for statically linked code, so mechanically
porting the PIMPL layer would be pure overhead. TeamCity-specific CI wiring
is proprietary build-farm glue. No embedded scripting/Python glue at all —
not representative of Carbon's actual native/script boundary.

---

## `scheduler` (`carbon-scheduler`)

**Purpose.** Cooperative coroutine ("Tasklet," built on greenlet) scheduling
and CSP-style rendezvous channels for Blue, deliberately matching Stackless
Python's tasklet/channel semantics as closely as CCP's actual usage
requires — not a full Stackless reimplementation.

**Role in the engine.** Sits underneath `blue` as a narrowly-scoped native
concurrency-primitive module — SVSW's Lua already has coroutines built into
the language, so this whole subsystem is largely unnecessary to port
functionally; its main value is the C++/scripting boundary patterns.

**Key subsystems:**

| Subsystem | File paths | What |
|---|---|---|
| `Tasklet` | `src/Tasklet.h/.cpp`, `PyTasklet.h/.cpp` | Greenlet wrapper: queue pointers, blocked-list pointers, exception/kill state machine, parent chain, timing/telemetry fields |
| `ScheduleManager` | `src/ScheduleManager.h/.cpp`, `PyScheduleManager.h/.cpp` | One instance per OS thread (cached in the host interpreter's thread-local dict); runnable queue; STANDARD/TIME_LIMITED/TASKLET_LIMITED run-loop variants |
| `Channel` | `src/Channel.h/.cpp`, `PyChannel.h/.cpp` | CSP-style rendezvous: balance counter, sender/receiver preference, two intrusive blocked queues, `ChannelSwitch` does the actual greenlet handoff |
| Python/C++ binding boundary | `src/PythonCppType.h/.cpp`, `SchedulerModule.cpp`, `include/Scheduler.h` | Shared base gives every bound type a `PyObject*` back-pointer + Incref/Decref; `SchedulerCAPI` versioned struct-of-function-pointers exported via a capsule, cached once via `SchedulerAPI()` |
| GIL/thread-safety helpers | `src/GILRAII.h/.cpp` | RAII guard around `PyGILState_Ensure`/`Release` for any code path that might touch Python state from outside the interpreter's own call stack |

**Architecture patterns.** Symmetric two-way pointer pairing between native
object and script wrapper; a single versioned C-ABI proc-table struct as the
entire cross-module contract, cached via a lazily-imported capsule; GIL-RAII
guard at every entry point that might be reached from outside the
interpreter's call stack; per-OS-thread scheduler singleton piggybacking on
the host interpreter's own thread-local dict for lifetime; precise
strong/weak reference rules per relationship (channel holds a strong ref to
a blocked tasklet only while blocked; tasklet holds a strong ref to its
parent only while nested); two coexisting scheduling policies (nested
Stackless-compatible vs. flat insertion-order-only) behind one flag, with a
design doc naming the simpler target not yet fully adopted.

**Python/Blue integration.** CPython C extension exposing `scheduler.
tasklet`/`channel`/`schedule_manager` Python types, additionally exporting a
stable C API (`SchedulerCAPI`, retrieved via `PyCapsule_Import
("scheduler._C_API")`) so `blue` can drive tasklets/channels directly from
C++ without going through the interpreter for every call.

**Ideas worth stealing (Odin mapping):**

| Idea | Odin mapping |
|---|---|
| Symmetric two-pointer binding between native object and script wrapper, one shared lifetime base for every bound type | One Odin retain/release/is_valid proc set used uniformly by every Lua userdata binding type; store the Odin pointer inside the userdata payload while the Lua registry ref lives on the Odin side |
| Single stable C-ABI proc-table struct, lazily cached | If SVSW splits the Lua binding surface into opt-in packages (D42), define one proc-pointer struct per package filled/cached once by the loader |
| RAII guard reacquiring the scripting runtime's execution lock at every non-Lua-originated entry point | Wrap every Lua->Odin entry point in a helper reconstructing `context` and validating the calling Lua state, mirroring GILRAII's discipline — directly relevant to the documented Odin<->Lua `proc "c"` footgun |
| Precise strong/weak reference rules documented per relationship rather than blanket refcounting | Document exactly which SVSW relationships need to keep a Lua object alive across a yield/callback boundary vs. which are safe as bare handles |
| A short per-decision design-doc trail naming the alternative considered and the risk profile | `docs/README.md`'s decision log already does this; the scheduler's practice of one small doc per tradeoff is a good template for future coroutine/task-scheduling decisions inside the Lua sandbox |

**Anti-lessons.** Python capsule-based C API export is CPython/embedding-
specific with no Odin/Lua analog worth copying — Odin static libs + explicit
proc tables solve the same problem more directly. Global mutable statics for
callbacks and a "thread is dying, redirect lookups to a shadow table"
workaround are concessions to a per-thread, refcounted-GC world a
deterministic engine doesn't need. Reference-counting-driven object lifetime
trades determinism/simplicity for CPython GC compatibility — SVSW's
arena/fixed allocation plus explicit ownership (or Lua's own GC plus
schema-laid-out native storage) is simpler and already the better call.
Cross-thread tasklet operations are explicitly unsupported — this whole
per-OS-thread-scheduler design solves MMO-server-scale concurrency a
single-simulation-thread 2D engine doesn't have. Nested-tasklet execution
order is called out by the maintainers themselves as their most complex,
bug-prone code kept only for legacy behavioral parity — always default to
the flat/deterministic equivalent, since SVSW has no legacy scheduler to be
compatible with.

---

## `spacemouse`

**Purpose.** Small, self-contained Python C-extension exposing 3Dconnexion
SpaceMouse (6DOF input device) translation/rotation and programmable
button-action events to Python tools code (e.g. ship/structure fitting or
camera navigation).

**Role in the engine.** A peripheral-input leaf module — plugs a niche
hardware device into the Python ("blue") tier following the same
native<->Python boundary conventions (GIL discipline, exception-based error
propagation, callable-based event dispatch) Carbon's much larger subsystems
also use; useful here as a small, complete worked example of that boundary
pattern.

**Key subsystems:**

| Subsystem | File paths | What |
|---|---|---|
| `SpaceMouse.h/.cpp` | Shared API + two callback trampolines | `PyMoveEventHandler`/`PyActionEventHandler` translate a native position struct or action-id string into Python objects; `NO_SPACE_MOUSE` stub fallback |
| `SpaceMouse_Windows.cpp` | Windows backend | 3Dconnexion SpaceWare SDK; subclasses the target `HWND`'s WndProc; stores the Python handler as a raw `PyObject*` in Win32 window properties |
| `SpaceMouse_macOS.mm` | macOS backend | Apple ConnexionClientAPI; global message handler; weak-imports `SetConnexionHandlers` so the module still loads without the driver |
| `python/spacemouse/__init__.py` | Thin shim | Real module loaded via `blue.LoadExtension('_spacemouse')`, swapped into `sys.modules` |

**Ideas worth stealing (Odin mapping):**

| Idea | Odin mapping |
|---|---|
| A tiny, explicit native-API header as the entire platform-backend contract (5 functions, no classes) | A small flat proc set in `engine/input` (or a platform-device package) with platform bodies behind `when ODIN_OS == .Darwin`/`.Windows` build tags and one stub fallback |
| GIL-bracketed callback dispatch at every native->script entry point | Any native subsystem firing a callback off the main sim thread must marshal onto the main thread before calling into Lua, or hold an explicit engine-level VM lock |
| Native errors surface as first-class scripting exceptions via one funnel function | A single "raise this as a Lua error" funnel proc per native subsystem, rather than each binding site improvising its own `lua_error` call |

**Anti-lessons.** `RegisterWindow` taking a raw native window handle assumes
a single OS-owned window and Windows-message-pump-era WndProc subclassing —
doesn't map to a modern event loop (e.g. sokol's app callback). Manual
`Py_INCREF`/`Py_DECREF` bookkeeping storing a raw owning pointer in an opaque
native property bag (`GetProp`/`SetProp`) is exactly the class of
manual-refcount bug surface Lua's C API also has (`lua_ref`/`luaL_unref`) —
prefer registry-table-keyed handles. Peripheral-specific one-off binding for
niche CAD-style hardware is developer/enterprise tooling, not something a
small 2D game engine needs functionally.

---

## `spatial-audio-clustering`

**Purpose.** A Wwise "Object Processor" plugin (`AK::IAkOutOfPlaceObjectPlugin`)
that dynamically clusters nearby 3D spatial audio objects into fewer output
objects, mixed at each cluster's centroid, to stay under a spatial-audio-
endpoint's hard concurrent-object limit (~128) during large battles. Reports
up to 60% audio-thread CPU reduction.

**Role in the engine.** Not one of the ~33 core Carbon subsystems in the
narrow sense — a standalone third-party-SDK plugin inside the audio
middleware layer, plugging into Carbon's audio pipeline as a bus insert
effect; no dependency on blue/Python, destiny, or trinity.

**Key subsystems:**

| Subsystem | File paths | What |
|---|---|---|
| `SpatialClusterer` | `SoundEnginePlugin/SpatialClustering.h/.cpp` | Density-aware seeded k-means-style clustering: `determineMaxClusters = sqrt(numObjects)`; Gaussian-weighted density estimation, k-means++ farthest-point seeding, early stop within threshold |
| `ObjectClusterFX` | `SoundEnginePlugin/ObjectClusterFX.h/.cpp` | The `IAkOutOfPlaceObjectPlugin` implementation: per-frame `PrepareAudioObjects` -> `ProcessAudioObjects` -> `UpdateClusterPositions`, using `AkMixerInputMap` as a stable input->output identity map to avoid audio pops from cluster-membership churn |
| `ObjectClusterFXParams` | `SoundEnginePlugin/ObjectClusterFXParams.h/.cpp`, `WwisePlugin/ObjectCluster.xml` | Fixed `AkPluginParamID` enum; single RTPC-exclusive property (`distanceThreshold`, range 1-1000, default 200) |
| `Utilities` | `SoundEnginePlugin/Utilities.h/.cpp` | Buffer/object helpers: `ClearBuffers`, `CopyBuffer`, `CreateOutputObject`, `GetDistanceSquared`, `CalculateMeanPosition` |

**Ideas worth stealing (Odin mapping):**

| Idea | Odin mapping |
|---|---|
| Hard-cap a scarce downstream resource (concurrent audio objects) by clustering many logical emitters into few physical ones, re-centroided each frame | A lightweight Odin-side clusterer (same k-means++-with-threshold shape, allocation-free via a fixed arena/pool) merging many simultaneous positional SFX emitters before handing off to the platform audio backend |
| Stable identity mapping between transient per-frame inputs and longer-lived outputs to avoid destroy/recreate churn | A persistent index/handle map keyed by stable entity id for any many-to-few resource-pooling problem (sprite-batch atlas assignment, tile-instance recycling) |
| Exactly one tunable exposed to content/design with hard clamps baked into both runtime and authoring schema | Mirror for `svsw.*`-exposed tunables: clamp defensively on the Odin side, keep exposed knobs minimal per feature |
| Pure algorithm (`SpatialClusterer`) separated from the engine-integration shim (`ObjectClusterFX`) | Reinforces SVSW's `engine/render` vs `engine/render/gpu` split (D15); keep any clustering/pooling algorithm platform-agnostic Odin with no sokol/Lua dependency |

**Anti-lessons.** The WwisePlugin authoring GUI (Win32/MFC/ATL) is Windows-
only tooling glue tied to Visual Studio project generation — none of it
transfers to a cross-platform Odin+sokol engine. `initializeCentroids` has an
O(n^2) nested loop, acceptable only because Wwise audio object counts are
bounded (dozens to low hundreds) — would not scale to SVSW's potential
entity counts without a spatial index; don't copy the brute-force shape
wholesale. Per-frame heap churn (`std::vector`/`std::map` reallocation every
`Execute()` call) is exactly the kind of allocation pattern SVSW's TIGER_
STYLE/determinism rules would reject; the constructor's `std::random_device`
seeding is also a non-deterministic entropy source incompatible with D11.
No Python/blue involvement at all — this is a C++-to-C++ SDK plugin
boundary, not a scripting-sandbox boundary; don't over-index on it for that
question. The plugin trusts its host completely with minimal null/bounds
checks — appropriate for a same-process, same-trust SDK plugin, not a model
for a sandboxed Lua/mod boundary.

---

## `trinity` (Carbon rendering engine)

**Purpose.** Carbon's 3D/2D rendering engine: scene graph, sprite/UI
rendering, render-job/step graph, resource management (textures/geometry/
materials/shaders), lighting, particles, post-processing, and raytracing,
built as backend-agnostic C++ over a hardware adapter layer (DX11/DX12/
Metal).

**Role in the engine.** Sits below the game/Python (destiny/world-sim) layer
and above platform-native graphics APIs, consuming assets via the resources
subsystem, tying into audio hooks (`ALResultBlue`/`TrinityAudioAPI`), and
exposing its entire object model to Python so gameplay/tools code can
construct scenes, render jobs, and UI without touching C++. Depends on
`carbon-core`, `carbon-math`, `carbon-mesh`, `carbon-parser`, `carbon-blue`,
`carbon-pdmprotowrapper`, `carbon-imageio`, `carbon-trinityaudioapi` via
vcpkg, confirming Carbon's ~33-component split is real and package-managed.

**Key subsystems:**

| Subsystem | File paths | What |
|---|---|---|
| Core renderer | `trinity/Sprite2d/`, `RenderJob/`, `Resources/`, `Include/`, `PostProcess/`, `Raytracing/` | Scene graph, 2D sprite/UI system, render job/step graph, resources, lights, particles, post-process, raytracing, curves, fonts, indoor scenes; ~404 top-level files/dirs, backend-agnostic C++ |
| Adapter layer (AL) | `trinityal/include/`, `dx11/`, `dx12/`, `metal/`, `stub/` | Common AL interfaces (`Tr2BufferAL`, `Tr2TextureAL`, `Tr2ShaderAL`, `Tr2SwapChainAL`, `Tr2RenderContextAL`) implemented per backend, plus a headless stub |
| Offline HLSL toolchain | `shadercompiler/HLSLParser.y`, `EffectCompilerMetal.cpp`, `ASTNode.cpp` | Standalone shader compiler: re2c/Lemon-generated lexer/parser, per-backend emitters (DX11/DX12/Metal), reflection extraction |
| Python (Blue) binding layer | `trinity/RenderJob/TriRenderStep_Blue.cpp`, `Sprite2d/Tr2Sprite2d_Blue.cpp` | 492 files following the `<ClassName>.cpp`/`<ClassName>_Blue.cpp` split |

**Architecture patterns.** Adapter Layer (AL) pattern directly analogous to
D15's sokol-only-at-platform-tier rule, just with 3 GPU backends instead of
1; render-graph-as-object-steps — ~40 `TriStep*` classes (`TriStepSetRenderTarget`,
`TriStepPushViewport`, `TriStepRenderScene`, `TriStepResolve`,
`TriStepRunComputeShader`, ...), each a small polymorphic `TriRenderStep`
subclass with `Execute()`; a `TriRenderJob` is a scriptable, reorderable
sequence of these steps — a data-driven frame graph built from composable
primitives; reflection-based binding via static `ExposeToBlue()` per class,
physically isolated into a companion `_Blue.cpp`; `IRoot` base + `BLUE_CLASS`/
`BLUE_INTERFACE` macros for COM-like generic object holding; interface
segregation via `IXxx` headers; resource classes separating asset-
description/CPU objects from GPU-backing AL objects with async load fences.

**Python/Blue integration.** Every exposed class derives from `IRoot`,
implements a static `ExposeToBlue()` returning a `Be::ClassInfo*` built with
`EXPOSURE_BEGIN`/`MAP_INTERFACE`/`MAP_ATTRIBUTE`/`MAP_PROPERTY`/
`EXPOSURE_END`, physically isolated per-class into a companion
`_Blue.cpp` (492 across the repo). Render-job steps are individually exposed
so Python tooling code can assemble/reorder render graphs. This is the
closest Carbon analog to the Odin<->Lua boundary: where SVSW hand-writes a
small opt-in `svsw.*` surface (D42), Trinity auto-generates a much larger
(near-total) reflective surface via macros — a scale/maintenance tradeoff
SVSW should NOT replicate; SVSW's narrower, explicit binding keeps the
binding surface small and fits a security-sandboxed mod boundary.

**Ideas worth stealing (Odin mapping):**

| Idea | Odin mapping |
|---|---|
| Render steps as small composable objects assembled into an ordered job, not one hard-coded `render()` | Express the frame as an ordered slice of small step procs/structs (clear, set-target, batch-draw, resolve) if/when `engine/render` grows multiple passes, keeping `engine/render/gpu` thin and per-step testable |
| Physically separating script-binding glue from core logic (one file per class devoted only to exposure) | Already SVSW's D42 pattern; confirms it as a proven scaling strategy — keep binding code in dedicated files/packages |
| A narrow backend-agnostic adapter interface the core codes against, backend swapped only at the platform tier | Directly validates D15's split; Trinity shows it scales to 3 native APIs, so SVSW's single-sokol-backend version is already simpler and sufficient |
| Resource description vs. GPU-backing object separation with async load fences | Model any future async asset streaming as a lightweight fence/ticket the loader signals and the render core polls once per frame at a deterministic point, kept out of the fixed-timestep sim loop (D11) |
| Declarative attribute exposure with inline docstrings at the binding call site | Colocate a one-line doc comment above each bound `svsw.*` proc/field so a future `svsw doc` command can extract API docs without a separate reflection system |

**Anti-lessons.** DX11/DX12/Metal triple-backend abstraction carries the
maintenance burden of a bespoke multi-API adapter layer with no payoff at
SVSW's scope; the sokol-only platform tier is correct — do not replicate it.
Raytracing and a full PBR post-process stack (SSAO, volumetrics, upscaling) are AAA-3D-MMO
features with no bearing on a 2D engine — pure scope creep. TBB-baked
parallelism assumes a job-stealing thread pool tuned for many-core
workstations rendering an MMO scene; SVSW's fixed-timestep single-threaded-
by-construction determinism (D11) is deliberately the opposite tradeoff. The
reflection/exposure macro system is a large hand-rolled C++ macro-
metaprogramming layer for binding hundreds of classes; SVSW's opt-in `svsw.*`
packages are already a simpler alternative and should not grow toward
auto-reflection macros. 492 files split into `.cpp`/`_Blue.cpp` pairs shows
how large the exposed surface got at MMO scale (essentially the entire
renderer exposed to Python) — SVSW's curated, small, explicitly-reviewed
`svsw.*` surface is intentionally narrower and should stay that way. CMake
build gates on a Perforce branch-path env var for one build mode — a legacy
internal-tooling assumption not portable or worth imitating.

---

## `trinityaudioapi`

**Purpose.** A minimal, implementation-free C++ header package defining the
shared interface contract between `trinity` (renderer) and Carbon Audio, so
the two evolve/build independently while agreeing on a stable API for
spatial audio emitters, audio-relevant geometry submission, and raw PCM
audio injection.

**Role in the engine.** A cross-cutting glue/contract package (not a
subsystem with its own logic), analogous in spirit to a package boundary
between `engine/render` and a future `engine/audio` inside SVSW.

**Key subsystems:**

| Subsystem | File paths | What |
|---|---|---|
| `ITr2Audio.h`/`IStretchAudio.h` | — | Deprecated and current per-asset spatial-audio-emitter interfaces (`Update`, `FindEmitterByName`) |
| `ITr2AudEmitter.h` | — | Position/orientation, name/prefix, Wwise event/switch/RTPC dispatch, visibility/culling, mute state |
| `ITr2AudGeometry.h` | — | Geometry submission for audio occlusion/obstruction: per-`(geometrySetId, instanceId)` mesh vertex/index upload |
| `IAudioInputMgr.h` | — | Push-callback interface for streaming external PCM audio into the engine's audio graph |
| CMake packaging | `CMakeLists.txt` | Header-only INTERFACE library exported via `FILE_SET HEADERS` + `install(EXPORT)` for consumption by both Trinity and Carbon Audio build trees |

**Ideas worth stealing (Odin mapping):**

| Idea | Odin mapping |
|---|---|
| A tiny, header-only, implementation-free "shared contract" package between two subsystems that must agree on a boundary but not depend on internals | An Odin package of interface-shaped structs/proc types (e.g. `engine/audio/contract`) imported by both `engine/render` and `engine/audio`, with zero logic — a plain struct-of-procs suffices since there's no DLL boundary to cross |
| Modeling 3D audio occlusion by having the renderer push raw geometry to the audio system per instance | If SVSW adds spatial/occlusion audio, `engine/render` hands a small geometry snapshot to `engine/audio` via a plain proc call, keeping the layers decoupled per D15's one-way stack |
| A push-model callback for feeding external/live PCM audio into the pipeline | Confirms push (callback-fills-buffer) over pull as the right shape for SVSW's already push-model audio, e.g. for procedural sound later |

**Anti-lessons.** Wwise middleware coupling baked into the interface
vocabulary (`SendEvent`/`SetSwitch`/`SetRTPC`) is irrelevant unless SVSW
licenses Wwise. `std::wstring` for name fields is a Windows-era wide-string
convention with no equivalent need (Odin strings are UTF-8 byte slices).
Two competing, half-deprecated interfaces with byte-identical signatures
show interface-duplication drift from incremental MMO-era refactors — a
smell to avoid, not to copy. `IRoot`/`BLUE_INTERFACE`/reference-counted
interface pointers imply an intrusive COM-style refcounting base with no
Odin analog and no need for one.

---

## `vcpkg-registry`

**Purpose.** A vcpkg package registry (metadata-only: `vcpkg.json` manifests,
`portfile.cmake` fetch/build scripts, custom triplets/toolchains) used to
build and pin all ~25 native C++ components of Carbon plus their third-party
dependencies. Contains NO engine source code — every `carbon-*` port's
portfile fetches the real source from private CCP repos by pinned commit
SHA.

**Role in the engine.** Sits outside the runtime layer stack entirely —
Carbon's package-manager configuration, analogous to what a `vendor/`
directory + build scripts is for SVSW. Defines the full component dependency
graph, platform gating per component, custom triplets/toolchains, and
vendoring/patching of third-party libs (Python 3.12, greenlet, OpenSSL,
protobuf, Tracy, etc.).

**Key subsystems:**

| Subsystem | File paths | What |
|---|---|---|
| `carbon-blue` port | `ports/carbon-blue/vcpkg.json`, `ports/carbon-blueexposure/vcpkg.json` | Central embedded-Python/game-loop/resource-loading library; nearly every other `carbon-*` component depends on it |
| `carbon-core` port | `ports/carbon-core/portfile.cmake`, `vcpkg.json` | Base layer everything depends on; notably depends on `tracy` (a real-time profiler) as a core dependency — profiling baked into the lowest layer |
| `carbon-destiny` port | `ports/carbon-destiny/vcpkg.json` | Depends only on `carbon-blue`/`core`/`math` — a comparatively thin footprint, implying sim logic is mostly Python |
| `carbon-trinity` port | `ports/carbon-trinity/vcpkg.json` | Multi-backend renderer (DX11/DX12/Metal + Vulkan headers) unified behind one API; optional features `dx11`/`dx12`/`metal`/`shader-compiler`/`with-granny` |
| `carbon-scheduler` port | `ports/carbon-scheduler/vcpkg.json`, `ports/greenlet/*` | Wraps vendored `greenlet` for coroutine scheduling exposed to Python |
| `carbon-pdm`/`carbon-pdmprotowrapper` | `ports/carbon-pdm/vcpkg.json`, `pdmprotowrapper/`, `d3dinfo/` | Hardware/driver capability detection serialized as protobuf |
| `python3` (vendored, patched) | `ports/python3/portfile.cmake`, `000*.patch` | CPython 3.12.9 with ~20 CCP-authored patches for static builds, devendoring, sysconfig/rpath/SSL fixes |
| `ccp-debug-info` | `ports/ccp-debug-info/*` | Host-only tool pulled into nearly every port; standardizes debug-symbol externalization across the whole build |

**Ideas worth stealing (Odin mapping):**

| Idea | Odin mapping |
|---|---|
| One umbrella metapackage listing every component as a versioned dependency, each independently versioned/testable | SVSW already vendors Lua/sokol under `vendor/` with `just vendor-libs`; a single manifest listing pinned commit/checksum per dependency (already required by CLAUDE.md's VENDOR.md policy) keeps the same property without a full package manager |
| Feature flags per backend inside one port rather than separate renderer packages | D15 already achieves this structurally in-source; the vcpkg feature-flag idea maps to build-tag/`-define:` conditional compilation for optional future backends (e.g. WebGPU) |
| Debug-info externalization and profiling hooks wired into the base layer itself, not opt-in per component | A lightweight tracing/instrumentation hook baked into the ECS kernel core so every future subsystem gets timing/telemetry for free, matching `just stress`'s enforced budgets |
| Every dependency pinned by exact git commit SHA, never a branch/tag | Matches SVSW's existing "pin by checksum or commit, record provenance in VENDOR.md" policy — validates the discipline scales to dozens of interdependent components |

**Anti-lessons.** Embedding a full CPython interpreter requires ~20
nontrivial vendoring patches just for a reproducible cross-platform embed — a
huge maintenance surface compared to Lua; treat this as confirmation SVSW's
Lua choice was correct, not something to imitate. `carbon-pdm`/
`ccp-debug-info`'s telemetry and live symbol-server tooling exist for an
MMO's heterogeneous, unmanaged player-hardware fleet at live-ops scale — a
small-team 2D engine has no equivalent fleet-diversity problem, and pulling
in protobuf + a telemetry pipeline this early is premature complexity
ponytail/scope-discipline rules explicitly guard against. `supports:
windows & x64, osx` only, with heavy DirectX-specific features (fxc, DXC,
NVIDIA Aftermath/Streamline) gated Windows-only, plus a SQL Server driver in
`carbon-db` — Windows/DirectX-centric AAA plumbing irrelevant to a
cross-platform sokol-based engine, imitating it structurally would violate
D15. No actual component source is present in this repo at all — every
port's real implementation lives in a separate private repo fetched by
commit SHA; do not draw internal-architecture conclusions from this repo
beyond the dependency graph and build/platform-support facts.

---

## `videoplayer` (`carbon-videoplayer`)

**Purpose.** WebM (VP8/VP9 + Vorbis, via libnestegg/libvpx/libvorbis) video
player built on Trinity, decoding video into a caller-supplied BGRA texture
and audio into a pluggable audio sink (WaveOut or Wwise), exposed to Python
for use in EVE's client and tools.

**Role in the engine.** A leaf application-level component above `trinity`
(consumes `ITriTextureRes`) and above `blue`/`blueexposure` and
`CcpTrinityAudioAPI`; not part of the core engine loop, ECS, or
determinism-critical simulation — a self-contained media playback utility
exposed as a scriptable Python module, analogous to a small optional
`svsw.*` Lua library rather than an engine subsystem.

**Key subsystems:**

| Subsystem | File paths | What |
|---|---|---|
| `VideoPlayer`/`VideoPlayer_Blue` | `VideoPlayer.h`, `VideoPlayer_Blue.cpp` | Scripting-facing facade (`BLUE_CLASS`) exposing `Create`/`Update`/`Pause`/`Resume`/`Seek`/`GetVideoInfo`/`Validate`, callback attributes |
| `VideoController` | `VideoController.h/.cpp` | Internal orchestrator: owns parser + decoders + audio sink; explicit playback state machine (`UNINITIALIZED` -> `PARSING_METADATA` -> ... -> `DONE`) |
| Container parsing | `IVideoContainerParser.h/.cpp`, `WebMParser.h/.cpp`, `Metadata.h/.cpp` | WebM/Matroska via libnestegg, producing encoded frame queues |
| Decoders | `IAudioDecoder.h/.cpp`, `IVideoDecoder.h/.cpp`, `VpxDecoder.h/.cpp`, `VorbisDecoder.h/.cpp` | VP8/VP9 and Vorbis backends |
| Audio sinks | `IAudioSink.h/.cpp`, `WaveOutAudioSink.*`, `WwiseAudioSink.*` | Pluggable output; each also Blue-exposed via `IAudioSinkExposed` |
| `FrameQueue` | `FrameQueue.h` | Generic thread-safe producer/consumer template with pluggable backpressure policy (`MaxCountFullPolicy`, `MaxIntervalPolicy`) |

**Architecture patterns.** Facade/controller split (script-visible facade
vs. scripting-unaware internal orchestrator); strategy/interface-per-stage
pipeline (`IVideoContainerParser` -> `IAudioDecoder`/`IVideoDecoder` ->
`IAudioSink`) with a factory function selecting the concrete backend from
container metadata; producer/consumer decoupling via a generic queue with an
injectable backpressure policy; explicit state machine driven by a single
`Update()` pump call each frame; result/error aggregation type
(`VideoController::Errors`) wrapped for scripting-boundary exception
translation; two-speed media clock (audio-sink time when present, falling
back to an internal timer).

**Python/Blue integration.** `VideoPlayer` is `BLUE_CLASS`-exposed via
`EXPOSURE_BEGIN`/`MAP_METHOD_AND_WRAP`/`MAP_PROPERTY`/`MAP_ATTRIBUTE`.
Lifetime managed with `unique_ptr<T, TrackableDelete<T>>` and Blue smart
pointers. Errors surface as Python exceptions: `VideoController::Errors` is
wrapped in a `Be::Result<VideoController::Errors>` specialization with
`BLUE_DECLARE_GET_EXCEPTION`; the exposed `Validate()` raises a Python
exception carrying the error message on demand — C++ never throws directly
across the boundary, it returns a result converted to an exception only when
asked. Callbacks (`on_state_change`, `on_error`, `on_create_textures`) are
plain `BlueScriptCallback` fields invoked from C++, the inverse direction of
the Odin-Lua callback boundary.

**Ideas worth stealing (Odin mapping):**

| Idea | Odin mapping |
|---|---|
| Generic queue with an injectable full/backpressure policy object | An Odin generic ring-buffer/queue parameterized over element type plus a small policy struct, for asset streaming or audio buffer queues, allocator-explicit per TIGER_STYLE |
| Facade owns scripting-visible state and callbacks; internal orchestrator is scripting-unaware | Keep engine-core systems (e.g. a future audio-decode subsystem) entirely Lua-unaware; expose only a thin `svsw.*` binding struct owning Lua callback refs — reinforces "Lua sees only the scripting boundary" |
| Result-that-becomes-exception-only-at-the-boundary | Odin procs return `(value, ok)`/error enum internally; only the Lua-facing wrapper converts to `lua_error`/pcall-catchable state |
| Explicit read-only vs. read/write property distinction at the binding layer | `svsw.*` binding generation could adopt the same explicit read/readwrite declaration per exposed field, making the mod-facing contract self-documenting |
| Single `Update()`-pump architecture where async work happens off-thread into queues | Matches SVSW's fixed-timestep tick model well: any future streaming/async IO subsystem should have background threads populate a queue, the deterministic tick thread only drains it |

**Anti-lessons.** Windows-first audio (`WaveOutAudioSink`, Winmm linkage) —
the abstraction (`IAudioSink` interface, pluggable sinks) transfers, the
specific backends don't. MSVC-era plumbing (`StdAfx.h` precompiled-header
pattern, proprietary-profiler telemetry macros) is irrelevant scaffolding.
wxPython/wxWidgets-based test harness is a legacy desktop-GUI toy app, not a
pattern to replicate — SVSW's headless/CLI test tooling is already better.
`BLUE_STANDARD_MODULE_INIT`/`EXPOSURE_BEGIN`/`END` macro-heavy binding
boilerplate is a C++-reflection workaround Lua's C API + SVSW's D42 manual
binding layer avoids by construction. Reference-counted Pause/Resume
contract on `IAudioSink` ("must be implemented in a reference-counting
manner") is a footgun inherited from multiple independent callers pausing/
resuming the same sink — worth avoiding by giving Odin's audio pause a
single owner instead of copying this convention.

---

## Cross-cutting patterns observed across all 33 repos

These recur often enough across the individual sections above to call out
once, for use when writing or updating `successor-engine-plan.md`:

1. **The `ClassName.cpp` / `ClassName_Blue.cpp` split** (physically isolating
   scripting-exposure glue from core logic) appears in `audio`, `trinity`,
   `destiny`, `d3dinfo`, `imagetools`, `pathfinder`, `videoplayer`, `ime`,
   and `spacemouse` — it is Carbon's single most consistent convention, and
   the strongest cross-repo validation that SVSW's D42 opt-in `svsw.*`
   binding-package convention is the right scale-appropriate analog, not the
   full `blueexposure`/`trinity`-style auto-reflection macro system behind
   it.
2. **Typed `Result`/error-code-to-scripting-exception mapping at exactly one
   funnel per boundary** appears in `d3dinfo`, `pathfinder`, `imagetools`,
   `videoplayer`, `blueexposure`, and `pdm-proto-wrapper` — always as a
   single centralized translation point, never scattered per call site. This
   is the strongest recurring argument for a single Odin
   error-enum-to-Lua-error mapping proc per `svsw.*` binding package.
3. **GIL-RAII-at-the-callback-boundary** (`blue`'s `PyGilEnsure`, `io`'s
   `PyGilEnsure`, `imagetools`'s `AllowThreads`, `scheduler`'s `GILRAII`,
   `spacemouse`'s per-callback `PyGILState_Ensure`) is the single most
   repeated pattern in the entire corpus and maps directly onto CLAUDE.md's
   own documented Odin<->Lua footgun (`proc "c"` callbacks carrying no Odin
   `context`) — every Lua->Odin re-entry point should reconstruct/validate
   state the same disciplined way, and this is worth a dedicated check in
   the `lua-binding` skill if it does not already enforce it.
4. **MMO-scale machinery that should NOT be ported** clusters around: (a)
   interest-management/bandwidth-budget systems (`destiny`'s bubbles,
   `carbon-grpc`'s per-service thread pools), (b) live-service telemetry
   (`pdm`, `pdm-proto-wrapper`, `prometheus`, `ccp-debug-info` via
   `vcpkg-registry`), and (c) multi-backend GPU abstraction
   (`trinity`/`trinityal`, `carbon-math`'s DirectXMath dependency) — all
   three categories recur across unrelated repos as things the survey
   authors independently flagged as scope creep beyond SVSW's 2D
   single-backend engine, which is stronger evidence than any single repo's
   anti-lessons list alone.
