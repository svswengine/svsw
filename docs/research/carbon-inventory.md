# Carbon repository inventory

Research-era record. Decision numbers here use the research-era scheme; docs/decisions/README.md carries the mapping to the current log.

Snapshot date: **2026-07-12**

## Scope and verification method

**Observed.** Two authenticated organization enumerations were compared:

```text
gh repo list carbonengine --limit 1000 \
  --json name,url,visibility,isArchived,isFork,defaultBranchRef

gh api --paginate 'orgs/carbonengine/repos?per_page=100&type=all' --slurp
```

Both returned the same 33 visible repositories. Every result was public,
non-archived, and not a fork at the time of inspection. The local directory set
matched those names one-for-one. Origins, worktree cleanliness, shallow state,
current branch, and HEAD were then inspected with read-only Git commands.

This establishes that all 33 **currently visible top-level organization
repositories** are present. It cannot establish that no private repository
exists outside the caller's authorization, and organization state can change
after the snapshot date.

All 33 local worktrees were clean and non-shallow. Each was checked out on its
declared default branch: 31 on `main`, with `pdm` and `pdm-proto-wrapper` on
`master`. No fetch or pull was performed, so the table records local HEADs and
does not assert current remote-tip equality.

## Complete inventory

“Root license” reports only the repository-root license file observed in this
snapshot. It is not file-level legal clearance and does not relicense bundled,
generated, fetched, SDK, or submodule content.

| Repository | Branch / HEAD | Observed role | Primary stack | Root license | Architecture relevance |
|---|---|---|---|---|---|
| `.github` | `main` / `c42ed03e547d` | Organization profile, policies, and templates | Markdown/YAML | None | Organization metadata only |
| `audio` | `main` / `53d0f8fe4f88` | Wwise audio, prioritization, and Blue tick integration | C++/Python/Wwise | MIT | Subsystem and lifecycle reference |
| `blue` | `main` / `916baa7e590e` | Embedded-Python runtime hub, loop, resources, and persistence | C++/Python | MIT | Central runtime and cautionary hub |
| `blueexposure` | `main` / `c855175f5f26` | Reflected object/type model and Python binding metadata | C++/Python C API | MIT | Scripting/object-model reference |
| `core` | `main` / `480e62804344` | Memory, thread, time, stream, log, telemetry, and platform utilities | C++ | MIT | Foundation dependency hub |
| `d3dinfo` | `main` / `f1bed07d339c` | DirectX capability detection exposed to Python | C++/CMake/Python | MIT | Windows platform satellite |
| `db` | `main` / `5675493322da` | Windows OLE DB access with tasklet-blocking sessions | C++/Python/OLE DB | MIT | Legacy service-integration evidence |
| `destiny` | `main` / `4136fde4b195` | EVE ballpark physics and world simulation | C++/Python | MIT | Domain-simulation reference |
| `exefile` | `main` / `2400cee7adf4` | Native host/interpreter that initializes Python and loads Blue | C++/Python | MIT | Runtime host boundary |
| `exefileconsole` | `main` / `c6fe8023c878` | Windows console-process wrapper | C++/CMake | MIT | Platform utility |
| `geo2` | `main` / `cb1b2204e864` | DirectXMath-backed Python math module | C++/Python | MIT | Compatibility satellite |
| `grpc` | `main` / `28fd15cced89` | Base native client/binding layer for project Python gRPC modules | C++/Python/protobuf/gRPC | MIT | Service-boundary evidence |
| `imageio` | `main` / `88d14adcd830` | Bitmap model and common image codecs | C/C++ | MIT | Content/runtime foundation |
| `imagetools` | `main` / `6b9b1281014b` | Python image manipulation and NVTT compression | C++/Python/NVTT | MIT | Offline content tool |
| `ime` | `main` / `e122ab9fc217` | Native IME keyboard/composition exposed to Python | C++/ObjC++/Python | MIT | Platform input satellite |
| `io` | `main` / `5c4c669f6ebb` | Tasklet-blocking socket, SSL, and select replacements | C/C++/Python/libuv/OpenSSL | PSF License v2 | Python runtime infrastructure |
| `localization` | `main` / `596d8f5b240e` | EVE localization parser, formatter, and collator | C++/ObjC++/Python | MIT | Product/runtime satellite |
| `math` | `main` / `50f7c65241b9` | Vectors, matrices, quaternions, and bounds over DirectXMath | C++ | MIT | Foundation dependency hub |
| `mesh` | `main` / `ec123c3cd60a` | Versioned CMF mesh, skeleton, animation format, and tools | C++/tooling | MIT | Primary content-pipeline reference |
| `parser` | `main` / `b58a68538fe4` | Math-expression parser | C++/re2c/Lemon | MIT | Render/tool support |
| `pathfinder` | `main` / `00f40154719a` | Route and flood-fill over EVE map data | C++/Python | MIT | Domain satellite |
| `pdm` | `master` / `222937b1cd9b` | Cross-platform OS, hardware, and GPU capability inventory | C++/ObjC++ | MIT | Platform-support reference |
| `pdm-proto-wrapper` | `master` / `d08e220697da` | PDM data serialized into protobuf | C++/protobuf | MIT | Language-neutral telemetry seam |
| `prometheus` | `main` / `b6974144bafc` | prometheus-cpp wrapper exposed to Python | C++/Python | MIT | Observability integration |
| `red-to-black-converter` | `main` / `5fadab458cd5` | Editable `.red` YAML to binary `.black` conversion | Python | MIT | Offline conversion concept |
| `resources` | `main` / `77d086738837` | Resource groups, bundles, patches, import/export, and diff | C++/CLI | MIT | Distribution/content architecture |
| `scheduler` | `main` / `d1fa83bac190` | Greenlet tasklets, channels, and partial Stackless API | C++/Python/Greenlet | MIT | Cooperative runtime infrastructure |
| `spacemouse` | `main` / `df183797d234` | 3Dconnexion input exposed to Python | C++/ObjC++/Python | MIT | Specialized input satellite |
| `spatial-audio-clustering` | `main` / `b6384df75dbc` | Wwise spatial-object clustering plugin | C++/Wwise | Apache-2.0 | Specialized audio plugin |
| `trinity` | `main` / `067e8920eb5b` | Renderer, backends, scenes, jobs, shaders, and resources | C++/ObjC++/shaders | MIT | Central rendering hub |
| `trinityaudioapi` | `main` / `7ba2263bd670` | Header-only render/audio emitter and geometry seam | C++ headers/CMake | MIT | Good narrow subsystem seam |
| `vcpkg-registry` | `main` / `f503eea8c313` | Carbon and third-party ports, triplets, and toolchains | CMake/Python | MIT | Build/release spine |
| `videoplayer` | `main` / `45048628c2c7` | WebM/VPX/Vorbis playback through Trinity/audio sinks | C++/Python/codecs | MIT | Media subsystem reference |

## Dependency-submodule caveat

**Observed.** Twenty-nine repositories contain `.gitmodules`. Across them are
58 declared submodule entries, and all 58 reported the `-` uninitialized marker
from `git submodule status`. After normalizing SSH/HTTPS spelling, optional
`.git`, and trailing slashes, those declarations name five unique GitHub
repositories:

| Dependency repository | Declarations | Ownership/status in this snapshot |
|---|---:|---|
| `microsoft/vcpkg` | 29 | Third party; not claimed cloned or reviewed |
| `carbonengine/vcpkg-registry` | 26 | Carbon-owned; already present as an independent top-level clone |
| `KhronosGroup/MoltenVK` | 1 | Third party under `mesh`; not claimed cloned or reviewed |
| `ufbx/ufbx` | 1 | Third party under `mesh`; not claimed cloned or reviewed |
| `FortAwesome/Font-Awesome` | 1 | Third party under `mesh`; not claimed cloned or reviewed |

One declaration is not merely an SSH/HTTPS variant: `pdm` spells its intended
vcpkg URL as `git@github.com/microsoft/vcpkg.git` (slash after the host, without
an SSH URL scheme), visible in
[pdm/.gitmodules](/Users/ivandrenjanin/projects/carbon/pdm/.gitmodules:1).
That string is malformed as a Git transport URL. It is counted under the
clearly intended `microsoft/vcpkg` target above, but would require correction
before submodule initialization.

`grpc`, `pdm`, and `pdm-proto-wrapper` are the only repositories with a
`.gitmodules` file but no Carbon registry declaration. No visible Carbon
organization repository appears only as a submodule.

The exact statement supported by evidence is therefore: **all 33 visible
top-level Carbon repositories are cloned; dependency submodules are not
initialized.**

## Declared Carbon dependency graph

**Observed.** The following edges come from `carbon-*` dependencies in the 29
root `vcpkg.json` manifests. Duplicate dependency entries are shown once.
Package names are retained where one repository publishes multiple ports.

```text
audio        -> blue, exefile, math, trinityaudioapi
blue         -> blueexposure, core, exefile, io, pdmprotowrapper, scheduler
blueexposure -> core
d3dinfo      -> blue
db           -> blue, exefile-interpreter
destiny      -> blue, core, exefile-interpreter, math
exefile      -> core
geo2         -> core, math
grpc         -> prometheus
imageio      -> core
imagetools   -> blueexposure, imageio, math
ime          -> blue
io           -> core, scheduler
localization -> blue, blueexposure, exefile-interpreter
mesh         -> math
pathfinder   -> blueexposure, core, exefile-interpreter
pdm-proto-wrapper -> pdm
scheduler    -> core
trinity      -> blue, core, imageio, math, mesh, parser,
                pdmprotowrapper, trinityaudioapi
videoplayer  -> blue, trinity, trinityaudioapi
```

Unique direct-consumer hubs at the package level are:

| Package | Direct consumers | Interpretation |
|---|---:|---|
| `carbon-core` | 10 | Lowest shared native foundation |
| `carbon-blue` | 8 | Runtime/integration hub |
| `carbon-math` | 6 | Shared mathematical foundation |
| `carbon-blueexposure` | 4 | Shared Python/object exposure layer |
| `carbon-exefile-interpreter` | 4 | Embedded interpreter packaging |
| `carbon-trinityaudioapi` | 3 | Shared renderer/audio seam |
| `carbon-exefile` | 2 | Host/runtime packaging |
| `carbon-imageio` | 2 | Shared image foundation |
| `carbon-pdmprotowrapper` | 2 | Platform telemetry serialization |
| `carbon-scheduler` | 2 | Cooperative scheduling foundation |

**Inference.** Manifest in-degree does not fully describe runtime centrality.
Blue is the runtime composition hub; Trinity is the broad rendering composition
root; `vcpkg-registry` is the release/distribution hub.

## Observed language split

A tracked-file extension scan found:

- no `.go`, `go.mod`, or `go.sum` in any of the 33 repositories;
- no Odin source;
- C/C++ and headers as the dominant implementation surface;
- extensive Python scripts and Python C-API bindings;
- one Lua file, `spatial-audio-clustering/PremakePlugin.lua`, which is Wwise
  Premake build configuration rather than engine/game scripting;
- Protobuf consumed through generated/vendor dependencies rather than `.proto`
  source checked into these top-level repositories.

There are 591 tracked files matching `*_Blue.cpp`; 492 are in Trinity. That is
evidence of a broad C++/Python exposure surface, not a direct measure of API
quality.

**Implication.** Carbon provides no implementation evidence for Go multiplayer
or Lua gameplay. Those parts of the successor plan must be proven independently.

## Build and release observations

- Twenty-nine repositories have root CMake/vcpkg project structure.
- The same vcpkg and Carbon-registry submodule pattern is repeated widely.
- The snapshot contains three Microsoft vcpkg baselines and many independent
  Carbon-registry baselines.
- Shared CMake helper files are copied across repositories with multiple
  distinct revisions.
- Registry ports pin source revisions and semantic versions independently of
  current repository HEADs.
- Blue and Destiny explicitly document Perforce-only build dependencies, so
  the public GitHub graph alone is not build-complete.

**Inference.** Exact pins aid reproducibility, while the number of release
coordinates increases cross-repository change and integration cost.

## License and provenance limits

Repository-root metadata totals:

- 30 repositories with a root MIT license;
- `io` with PSF License v2 and a notice identifying modified CPython material;
- `spatial-audio-clustering` with Apache-2.0 and Wwise-related notice material;
- `.github` with no root license file.

These facts are not a legal opinion. In particular:

- A root license does not establish the license of every file.
- `vcpkg-registry` being MIT does not relicense dependencies fetched by ports.
- Uninitialized submodules retain their own licenses and notices.
- Generated code and proprietary SDK integrations require separate review.
- Wwise, NVTT, codecs, Granny/vendor GPU SDKs, MoltenVK, ufbx, Font Awesome,
  and other named dependencies need independent provenance checks before reuse.
- Several README contribution sections contain inconsistent wording while the
  repository root carries MIT; that is a cleanup/legal-review signal, not
  permission to choose the most convenient wording.
- MIT notices explicitly do not grant CCP trademarks or game-content rights.
- `.github` material should not be assumed reusable without a license.

The successor project should transfer concepts and independently written
interfaces, not Carbon source, game data, trademarks, or unreviewed artifacts.
