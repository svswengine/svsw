# Carbon architecture evidence

Research-era record. Decision numbers here use the research-era scheme; docs/decisions/README.md carries the mapping to the current log.

Snapshot date: **2026-07-12**

This document distinguishes inspected behavior from interpretation:

- **Observation** means the source or repository states/shows it.
- **Inference** connects observations but is not itself an explicit contract.
- **Implication** is a lesson for the successor engine, not a Carbon fact.

Carbon is reference evidence. No Carbon source is proposed for copying.

## Architectural map

At a high level, the inspected public repositories form this runtime:

```text
native executable host (`exefile`)
  -> dynamically selected Blue library
  -> embedded CPython + Blue reflected objects/resources
  -> Greenlet/Stackless-compatible tasklets + Carbon IO
  -> Python application bootstrap (`autoexec.run`)
  -> native runtime subsystems
       Destiny simulation
       Trinity rendering
       Carbon Audio / video
       DB, gRPC, metrics, localization, platform modules
```

The offline/content side is separate:

```text
source files + import settings
  -> native/Python processors
  -> versioned runtime formats and resource bundles
  -> background read/decode
  -> main-thread/device preparation
```

## Boot and runtime ownership

**Observation.** Blue describes itself as the central library for the embedded
Python interpreter, game loop, and resource loading in
[blue/README.md](/Users/ivandrenjanin/projects/carbon/blue/README.md:1).

The executable host:

1. Parses command-line/build-flavor state and loads a Blue shared module in
   [ExeFile.cpp](/Users/ivandrenjanin/projects/carbon/exefile/ExeFile.cpp:482).
2. Resolves a table of lifecycle/path/interpreter routines from that module in
   [BlueInterface.cpp](/Users/ivandrenjanin/projects/carbon/exefile/BlueInterface.cpp:26).
3. Builds an isolated Python configuration, installs built-in modules, and
   calls `Py_InitializeFromConfig` in
   [ExeFile.cpp](/Users/ivandrenjanin/projects/carbon/exefile/ExeFile.cpp:256).
4. Initializes paths and enters Stackless execution in
   [ExeFile.cpp](/Users/ivandrenjanin/projects/carbon/exefile/ExeFile.cpp:614).

Blue module initialization starts resource loading and BlueOS in
[blue.cpp](/Users/ivandrenjanin/projects/carbon/blue/src/blue.cpp:720). BlueOS
creates its Python-side OS object and tasklet contexts in
[BlueOS.cpp](/Users/ivandrenjanin/projects/carbon/blue/src/BlueOS.cpp:786), then
invokes a Python-visible `StacklessMain` in
[BlueOS.cpp](/Users/ivandrenjanin/projects/carbon/blue/src/BlueOS.cpp:855).
That function imports `autoexec`, calls its `run` function, and pumps the native
OS loop in [BlueOS.cpp](/Users/ivandrenjanin/projects/carbon/blue/src/BlueOS.cpp:897).

The native pump handles reentrancy protection, sleeping, packet delivery,
variable frame delta, deferred deletion, recycling, memory tracking, and
statistics in [BlueOS.cpp](/Users/ivandrenjanin/projects/carbon/blue/src/BlueOS.cpp:646).

**Inference.** Carbon is neither “Python calls a passive C++ library” nor “C++
owns all orchestration.” Native code owns process, platform, memory, resource,
and frame machinery, while Python supplies the application/bootstrap and much
of high-level scheduling behavior.

**Implication.** Preserve a native-owned runtime and script iteration, but do
not reproduce a single Blue-like hub. The successor should expose one deep
Odin `Session` plus small capability-specific packages.

## Python, reflection, and object persistence

**Observation.** BlueExposure identifies itself as a generator of Python
wrappers for C++ in
[blueexposure/README.md](/Users/ivandrenjanin/projects/carbon/blueexposure/README.md:1).
Its registration machinery publishes native `ClassInfo` metadata to Python in
[BluePythonThunkers.cpp](/Users/ivandrenjanin/projects/carbon/blueexposure/BluePythonThunkers.cpp:760).

Blue classes declare interfaces, attributes, properties, and methods through
exposure metadata. A small concrete example is `DictReader`, which converts a
Python dictionary into a reflected object and exposes configuration fields in
[DictReader_Blue.cpp](/Users/ivandrenjanin/projects/carbon/blue/src/DictReader_Blue.cpp:14).

Object loading normalizes a resource name, obtains a yielding stream, selects a
reader, optionally caches a builder, and constructs the object in
[BlueResMan.cpp](/Users/ivandrenjanin/projects/carbon/blue/src/BlueResMan.cpp:653).
Reader selection first recognizes binary Black data and otherwise uses YAML
Red data in [BlueResMan.cpp](/Users/ivandrenjanin/projects/carbon/blue/src/BlueResMan.cpp:797).

**Observation.** A tracked-file count found 591 `*_Blue.cpp` binding files,
including 492 in Trinity.

**Inference.** The reflection model creates real leverage—script-visible native
types, generic loading, persistence, and inspection—but the binding surface has
become broad and organizationally expensive.

**Implication.** Keep schema-driven values and generic serialization, but keep
Lua at a narrow ECS/data/command boundary. Do not mirror native classes into
Lua one type at a time, and do not make reflection metadata the owner of every
engine concern.

## Cooperative scheduling and IO

**Observation.** Carbon Scheduler provides channels and Greenlet coroutines
whose behavior intentionally resembles Stackless Python, with only the required
API implemented, as stated in
[scheduler/README.md](/Users/ivandrenjanin/projects/carbon/scheduler/README.md:5).
Its C API exposes tasklet creation/control, channel send/receive, runnable
scheduling, callbacks, and counters in
[Scheduler.h](/Users/ivandrenjanin/projects/carbon/scheduler/include/Scheduler.h:33).

Carbon IO provides tasklet-blocking TCP/UDP sockets and modified Python
socket/SSL/select modules in [io/README.md](/Users/ivandrenjanin/projects/carbon/io/README.md:4).
Blue's Python pump dispatches Carbon IO, wakes sleepers/tickers, and runs the
scheduler queue in
[BluePython.cpp](/Users/ivandrenjanin/projects/carbon/blue/src/BluePython.cpp:812).
Sleepers are handled before tickers, and yielders are gathered before wakeup to
avoid reentrancy in
[Synchro.cpp](/Users/ivandrenjanin/projects/carbon/blue/src/Synchro.cpp:142).

**Inference.** This is a coherent cooperative application runtime, not a
deterministic gameplay scheduler. It explicitly observes real and simulation
time and exists to make Python network/application code appear blocking.

**Implication.** Do not transfer Greenlet/Stackless semantics into the Odin
simulation. Fixed-step systems stay synchronous and ordered. Go owns network
concurrency; background asset work uses bounded jobs whose completion order
cannot affect simulation.

## Source assets, CMF, and runtime resources

**Observation.** The mesh processor validates JSON import options, parses FBX
through ufbx, imports skeletons/meshes/animations, records source hash and
generator metadata, validates its output, and emits CMF in
[fbximport.cpp](/Users/ivandrenjanin/projects/carbon/mesh/src/processor/fbximport/fbximport.cpp:36).

CMF writing:

- flattens pointer graphs and replaces pointers with offsets;
- creates data, GPU-buffer, and metadata sections;
- records compressed and uncompressed sizes;
- aligns sections; and
- computes a CRC over the result.

Those operations are visible in
[writer.cpp](/Users/ivandrenjanin/projects/carbon/mesh/src/cmf/writer.cpp:113).

Trinity registers `.cmf` with Blue's resource factory in
[TriGeometryRes_Blue.cpp](/Users/ivandrenjanin/projects/carbon/trinity/trinity/Resources/TriGeometryRes_Blue.cpp:10).
It reads/decompresses geometry in a background phase in
[TriGeometryRes.cpp](/Users/ivandrenjanin/projects/carbon/trinity/trinity/Resources/TriGeometryRes.cpp:525),
reconstructs offset-based data and lazily handles sections in
[Tr2CmfContent.cpp](/Users/ivandrenjanin/projects/carbon/trinity/trinity/Resources/Tr2CmfContent.cpp:10),
then creates meshes and GPU buffers in a main-thread preparation phase in
[TriGeometryRes.cpp](/Users/ivandrenjanin/projects/carbon/trinity/trinity/Resources/TriGeometryRes.cpp:625).

The separate Resources repository describes tools to manage, manipulate, and
deliver title resource files in
[resources/README.md](/Users/ivandrenjanin/projects/carbon/resources/README.md:5).
No public manifest edge directly connects that repository to Blue or Trinity.

**Inference.** The strongest reusable Carbon concept is the explicit lifecycle:

```text
source asset -> importer -> versioned validated artifact
             -> bounded read/decode -> device-thread preparation
             -> runtime resource
```

**Implication.** Adopt that lifecycle, plus source/dependency digests and hard
section bounds. Simulation sees stable logical asset identifiers and never
observes readiness or background-completion order.

## Rendering

**Observation.** Trinity is explicitly the Carbon rendering engine in
[trinity/README.md](/Users/ivandrenjanin/projects/carbon/trinity/README.md:1).
The inspected source includes Direct3D 11/12, Metal, and no-device backends; scene and
render-node types; render jobs; shaders/materials; resource pools; sprite and
space-scene systems; and hundreds of Blue exposure units. Trinity declares
eight direct Carbon package dependencies, the largest outward fan-out in the
manifest graph.

**Inference.** Trinity is a broad product renderer and integration root, not a
small backend-neutral rendering core. Its resource load/prepare split and
capability interfaces are more transferable than its class hierarchy or
backend breadth.

**Implication.** The successor begins with one deliberately small renderer and
a thin device-submission tier. It should deepen only around proven work—batch
building, resource handles, frame extraction, and one backend seam—rather than
porting Trinity's taxonomy.

## Audio and video

**Observation.** Carbon Audio wraps Wwise, adds sound prioritization, exposes
the subsystem to Python, and requires Wwise-generated banks plus metadata, as
described in [audio/README.md](/Users/ivandrenjanin/projects/carbon/audio/README.md:1).
The Python `AudioManager` obtains native manager/repository singletons, updates
settings, enables audio, and creates a listener in
[audiomanager.py](/Users/ivandrenjanin/projects/carbon/audio/python/audio2/audiomanager.py:11).

Native initialization and teardown order live in
[AudManager.cpp](/Users/ivandrenjanin/projects/carbon/audio/src/AudManager.cpp:147).
Each audio tick culls objects, invokes Wwise rendering, and drains callbacks
onto the main thread in
[AudManager.cpp](/Users/ivandrenjanin/projects/carbon/audio/src/AudManager.cpp:105).
Event posting checks metadata, culling, enablement, and bank state in
[AudGameObjResource.cpp](/Users/ivandrenjanin/projects/carbon/audio/src/AudGameObjResource.cpp:153).

`trinityaudioapi` is a useful narrow seam: for example, geometry crosses the
renderer/audio boundary through
[ITr2AudGeometry.h](/Users/ivandrenjanin/projects/carbon/trinityaudioapi/include/ITr2AudGeometry.h:14).

**Observation.** VideoPlayer states that it is built on Trinity in
[videoplayer/README.md](/Users/ivandrenjanin/projects/carbon/videoplayer/README.md:1).
Its manifest also depends on the shared audio API, making it a media subsystem
composed over rendering and audio rather than part of either foundation.

**Implication.** Preserve explicit lifecycle state, main-thread callback
marshalling, and narrow shared interfaces. Do not transfer Wwise or codec
choices without separate licensing, platform, cost, and product evidence.

## Destiny's fixed-step simulation

**Observation.** Destiny describes itself as the core game-world simulation for
an EVE MMO in [destiny/README.md](/Users/ivandrenjanin/projects/carbon/destiny/README.md:1).
`Ballpark` stores an explicit simulation tick interval and counter in
[Ballpark.h](/Users/ivandrenjanin/projects/carbon/destiny/src/Ballpark.h:84).
Its tick callback uses the configured interval as the simulation time step,
runs whole elapsed intervals, surrounds evolution with Python pre/post events,
and resynchronizes rather than executing more than five accumulated master
ticks in [Ballpark.cpp](/Users/ivandrenjanin/projects/carbon/destiny/src/Ballpark.cpp:207).
`Evolve` advances one time step in
[Ballpark.cpp](/Users/ivandrenjanin/projects/carbon/destiny/src/Ballpark.cpp:419).

**Inference.** Destiny is evidence that a native fixed-step domain simulation
can coexist inside Carbon's broader variable-frame Python runtime. It is not
evidence of SVSW-style whole-engine determinism: Python events, wall/sim-time
integration, unordered native containers, floating-point/platform behavior,
and no inspected world-hash contract leave that stronger claim unsupported.

**Implication.** Reuse the separation of domain tick from presentation frame,
not Destiny's internal API or timing recovery policy. The successor's entire
authoritative session must obey deterministic ordering and hashing rules.

## Service and operational integrations

**Observation.** The DB repository is a wrapper for game-server database access
according to [db/README.md](/Users/ivandrenjanin/projects/carbon/db/README.md:1).
The gRPC repository provides common native infrastructure for project-specific
Python modules in [grpc/README.md](/Users/ivandrenjanin/projects/carbon/grpc/README.md:1).

Its consumer owns connection, metrics, reader, acknowledgement, cancellation,
and joinable-thread lifecycles in
[consumer.hpp](/Users/ivandrenjanin/projects/carbon/grpc/include/carbongrpc/client/consumer.hpp:34).
Python-module finalization waits for worker shutdown and applies a ten-second
escape hatch in
[module.cpp](/Users/ivandrenjanin/projects/carbon/grpc/src/module/module.cpp:31).

Prometheus is a native client exposed to Python and can serve a scrape endpoint,
as shown in [prometheus/README.md](/Users/ivandrenjanin/projects/carbon/prometheus/README.md:1).
PDM gathers platform data and serializes it to protobuf in
[protobuf_template.h](/Users/ivandrenjanin/projects/carbon/pdm-proto-wrapper/src/protobuf_template.h:140).

**Inference.** Carbon demonstrates the real complexity of connection state,
queues, retries, cancellation, shutdown, metrics, database access, and schema
serialization. It contains no Go implementation and therefore does not prove
the proposed Go control plane.

**Implication.** Put these soft-real-time concerns in Go, out of process from
the deterministic Odin tick. The Odin/Go boundary should carry bounded,
versioned commands, results, checkpoints, and recipient projections—not ECS
queries or service callbacks.

## Multi-repository and release cost

**Observation.** The public system is split across 33 repositories. Twenty-nine
repeat CMake/vcpkg project structure and declare 58 uninitialized submodules.
The snapshot uses three Microsoft vcpkg baselines and numerous Carbon registry
baselines. Shared CMake helper families occur in 25–27 repositories with
multiple distinct file hashes.

Registry ports pin both semantic versions and source revisions; the audio port
is a representative example in
[portfile.cmake](/Users/ivandrenjanin/projects/carbon/vcpkg-registry/ports/carbon-audio/portfile.cmake:1)
and [vcpkg.json](/Users/ivandrenjanin/projects/carbon/vcpkg-registry/ports/carbon-audio/vcpkg.json:1).
Blue requires Perforce-only dependencies according to
[blue/README.md](/Users/ivandrenjanin/projects/carbon/blue/README.md:4), and
Destiny documents the same class of requirement in
[destiny/README.md](/Users/ivandrenjanin/projects/carbon/destiny/README.md:1).

**Inference.** Exact pins improve reproducibility, but cross-component changes
can require source, port, version, registry-baseline, and consumer coordination.
Copied build helpers accumulate drift, and the public graph cannot reproduce
the complete internal build.

**Implication.** Begin the successor in one monorepo with one dependency
provenance policy and atomic cross-language changes. Extract a repository only
after a module has a stable deep interface, independent release need, and more
than one real consumer.

## Concepts to reuse

- Native host separated from a deep runtime entry point.
- Script iteration over native systems, but with a much narrower capability
  boundary.
- Schema/reflection for values, validation, serialization, and tooling.
- Cooperative/background work outside deterministic simulation.
- Versioned validated artifacts with source/dependency identity.
- Background decode followed by device-thread preparation.
- Explicit subsystem lifecycle and main-thread callback marshalling.
- Narrow shared interfaces such as `trinityaudioapi`.
- Fixed-step domain simulation separated from presentation frames.
- Language-neutral service schemas and operational metrics.
- Exact dependency pins and recorded provenance.

## Transfers to reject

- A Blue-sized global runtime/integration hub.
- Hundreds of class-mirroring script wrappers.
- Python/Greenlet scheduling inside authoritative gameplay.
- Wall-clock or async completion entering deterministic state transitions.
- Raw engine objects crossing the scripting boundary.
- Per-entity or per-component cross-process calls.
- Device/API breadth before one game demonstrates need.
- Runtime loading of source authoring formats.
- Thirty-three repositories and repeated build glue at project inception.
- Proprietary SDK and game-domain choices treated as generic engine defaults.
- Any claim that Carbon's C++/Python services validate an Odin/Lua/Go design.
