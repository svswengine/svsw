# Sanitizer story

Research note for issue #12, a `wayfinder:research` child of the S00
decision map. Date checked: 2026-07-25. This note establishes facts and
recommends nothing; the disposition is decided separately. Every claim
below is either a citation to a primary source or an empirical result
labelled as such, and analysis is labelled as analysis.

## The question

Which sanitizers run on which CI leg, and which of them are validated to
work on the actual runners before CI grows to depend on them? The settled
context is that CI is GitHub Actions hosted runners, free and unlimited
for public repositories, with legs on macOS arm64 (`macos-26`), Linux
x86-64 (`ubuntu-24.04`), and later a hosted Windows CPU-only leg on
`windows-latest`, which currently resolves to `windows-2025` on x64. The
language is Odin, whose backend is LLVM, and a vendored C tier arrives at
S01 carrying SDL3, wgpu-native, cimgui, and Luau, with wgpu-native and
naga-cli shipped as prebuilt binaries. Budget is zero, so runtime cost
matters only as wall-clock on free runners.

## Matrix

Slowdown and memory figures are the ones the LLVM documentation states,
not measurements of this project, which has no code yet.

| Sanitizer | Odin flag | macOS arm64 | Linux x86-64 | Windows x64 | Documented slowdown | Documented memory overhead |
|---|---|---|---|---|---|---|
| AddressSanitizer | `-sanitize:address` | Accepted; verified working locally | Accepted; not run | Accepted; Odin ships its own runtime | 2x | Allocation dependent, not a fixed multiple |
| MemorySanitizer | `-sanitize:memory` | Rejected by the compiler | Accepted; unusable against a prebuilt C tier | Rejected by the compiler | 3x, plus 1.5x-2x more with origin tracking | Not stated |
| ThreadSanitizer | `-sanitize:thread` | Accepted; verified working locally | Accepted; not run | Rejected by the compiler | 5x-15x | 5x-10x, plus 1 MB per thread |
| UndefinedBehaviorSanitizer | None; not reachable | Not reachable | Not reachable | Not reachable | "small runtime cost" per LLVM | No impact on address space layout or ABI |
| LeakSanitizer | None; reached through ASan only | Off by default; verified working when forced on | On by default under ASan | Not supported | Part of the ASan run | Part of the ASan run |

Two structural facts sit behind the table. Odin accepts exactly three
sanitizer values, and it accepts at most one of them per build, so each
sanitizer is a separate compile and a separate CI job. LeakSanitizer and
UndefinedBehaviorSanitizer have no Odin flag at all; LSan is reachable
only as a runtime option of an ASan build, and UBSan is not reachable.

## What Odin accepts today

Version checked: the local compiler reports `dev-2026-07:819fdc7a8`. The
source lines cited below were read from the `odin-lang/Odin` repository at
`master`, commit `c5e58ad05a689720702d36c3f624d9d74166001f`, authored
2026-07-24.

The flag is registered in `src/main.cpp:689` as `BuildFlag_Sanitize`
taking a string parameter, and parsed at `src/main.cpp:1724-1742`. The
parser accepts `address`, `memory`, and `thread`, case-insensitively, and
rejects everything else with:

```
-sanitize:<string> options are 'address', 'memory', and 'thread'
```

Two behaviours in that block matter for CI. First, `src/main.cpp:
1727-1730` errors with `-sanitize:<string> may only be used once` when
`sanitizer_flags` is already non-zero, so sanitizers cannot be combined in
one build. Second, there is no `undefined` and no `leak` value, which was
confirmed empirically: `odin build ... -sanitize:undefined` and
`-sanitize:leak` both print the options error and fail. The backing enum
is `SanitizerFlags` at `src/build_settings.cpp:410-414`, which has exactly
three members plus `SanitizerFlag_NONE`. The help text at
`src/main.cpp:3119-3124` lists the same three.

Odin ships its own in-language safety checks rather than a UBSan hook.
`odin build -help` lists `-no-bounds-check` and `-disable-assert`, both of
which disable checks that are on by default. That is not a substitute for
UBSan's check set, but it is the reason a UBSan flag is absent rather than
merely unimplemented, and it is analysis rather than a documented claim.

## AddressSanitizer

**Per-platform gate.** `src/build_settings.cpp:2582-2593` permits ASan on
Windows, Linux, Darwin, and FreeBSD, and returns false with
`-sanitize:address is only supported on Windows, Linux, Darwin, and
FreeBSD` for anything else. All three of our legs are inside that set.

**How the runtime is linked.** `src/llvm_backend.cpp:3767-3785` splits by
target. On Darwin, Linux, and FreeBSD, Odin appends `-fsanitize=address`
to `extra_linker_flags`, and the link is driven by `clang` from PATH
unless `ODIN_CLANG_PATH` overrides it (`src/linker.cpp:447-454`). So on
the macOS and Linux legs, the ASan runtime comes from whatever clang the
runner has. On Windows, Odin instead adds a foreign library entry pointing
at `<ODIN_ROOT>\bin\llvm\windows\clang_rt.asan-x86_64.lib`.

**The Windows runtime is vendored by Odin, not by MSVC.** That file exists
in the Odin repository at `bin/llvm/windows/clang_rt.asan-x86_64.lib`, 5.2
MB. Downloaded and inspected, it is an `ar` archive of 118 compiler-rt
object files, including `RTUbsan`, `RTLSanCommon`, and
`RTSanitizerCommonSymbolizer` members, and a `strings` scan finds no
reference to `clang_rt.asan_dynamic` or an ASan DLL. It is therefore the
static compiler-rt ASan runtime, and the Windows leg does not depend on
the Visual Studio ASan component being installed or on a runtime DLL being
on PATH. The hard-coded `-x86_64` in the path means the Windows arm64
target has no ASan runtime in this scheme, which does not affect a hosted
x64 leg.

For contrast, Microsoft's own ASan is a different product: MSVC's
`/fsanitize=address` is documented as "limited to x86 and x64 on Windows
10 and later", is incompatible with edit-and-continue, incremental
linking, and `/RTC`, and lists `/fsanitize=thread`, `/fsanitize=leak`,
`/fsanitize=memory`, and `/fsanitize=undefined` as things it does not
have. Odin does not use it, so those constraints are context rather than
dependencies. Microsoft does note that "the ASan runtime invokes the LLVM
symbolizer to produce the function names in the call stack".

**Verified on macOS arm64.** On macOS 26.5.2 arm64 with the compiler above,
an Odin program writing 24 bytes past a 16-byte `libc.malloc` allocation
was built with `-sanitize:address` and produced a correct
`heap-buffer-overflow` report naming the write size, the allocation site,
and the shadow bytes. With `-debug` the frames carried source positions
(`overflow.odin:6`). The same works under `odin test`, where the report
named `pkg::oob t_test.odin:7` from inside the test runner's worker
thread.

**Exit behaviour.** The ASan defaults on Darwin, read from the binary with
`ASAN_OPTIONS=help=1`, are `abort_on_error` true and `exitcode` 1. Because
abort wins, the observed process exit status was 134, that is SIGABRT, not
1. Any CI step running the binary directly fails on that, but a harness
that inspects for exactly 1 would not.

**Leak detection.** The Clang documentation states that leak detection "is
turned on by default on Linux, and can be enabled using
`ASAN_OPTIONS=detect_leaks=1` on macOS; however, it is not yet supported
on other platforms." The premise that LeakSanitizer does not work on macOS
arm64 is **not correct** for this toolchain. Verified: `detect_leaks`
reads `(Current Value: false)` on Darwin, a deliberate 1024-byte leak went
unreported on a default run, and the same binary run with
`ASAN_OPTIONS=detect_leaks=1` reported `Direct leak of 1024 byte(s) in 1
object(s)` with a correct allocation stack and exited 1. So on the macOS
leg leak checking is available but opt-in, on the Linux leg it is on by
default under ASan, and on the Windows leg it is unavailable.

**Symbolization.** ASan's `symbolize` default is true and
`external_symbolizer_path` is empty, meaning the runtime searches PATH for
a symbolizer; `allow_addr2line` defaults to false. On macOS this was not a
problem: with `llvm-symbolizer` absent from PATH the report still carried
`overflow.odin:6`, because the Darwin runtime falls back to Apple's
`atos`, which ships with the Command Line Tools. The Linux leg is the
exposed one, and is covered under Unverified below.

## MemorySanitizer

**Per-platform gate.** `src/build_settings.cpp:2595-2604` permits MSan on
Linux and FreeBSD only, and errors with `-sanitize:memory is only
supported on Linux and FreeBSD` elsewhere. Verified: on macOS arm64 the
build fails immediately with exactly that message. The Windows case is
identical by the same switch, and `src/llvm_backend.cpp:3787-3797` has no
Windows arm for MSan either. So MSan is a Linux-leg-only question.

**Cost.** The Clang documentation states "Typical slowdown introduced by
MemorySanitizer is 3x", with origin tracking adding a further 1.5x-2x.

**The whole-program requirement.** The Clang documentation states:
"MemorySanitizer requires that all program code is instrumented. This also
includes any libraries that the program depends on, even libc." Failing
that "may result in false reports". The runtime carries interceptors for
common libc functions, which is what makes an uninstrumented standard
library survivable, but that concession does not extend to arbitrary
prebuilt third-party binaries. See the C tier section.

## ThreadSanitizer

**Per-platform gate.** `src/build_settings.cpp:2606-2615` permits TSan on
Linux, Darwin, and FreeBSD, and errors with `-sanitize:thread is only
supported on Linux, Darwin, and FreeBSD` elsewhere, which includes
Windows. That matches upstream: the Clang documentation lists Darwin arm64
and x86_64, Linux aarch64, x86_64, powerpc64 and powerpc64le, plus Android,
FreeBSD, and NetBSD, and does not list Windows.

**Verified on macOS arm64.** An Odin program with two threads incrementing
a global without synchronisation, built with `-sanitize:thread`, produced a
`data race` report naming both writes, the racing global `main::g`, and
the creating stacks through `thread::create`. The runtime resolved was
`libclang_rt.tsan_osx_dynamic.dylib`.

**Exit behaviour.** TSan's Darwin defaults are `halt_on_error` false,
`exitcode` 66, and `abort_on_error` true. In practice the run completed,
printed the final value and `ThreadSanitizer: reported 1 warnings`, and
exited 134. So the process does fail, but through abort rather than
through the documented exit code 66, and `halt_on_error` being false means
a run reports every race it finds rather than stopping at the first.

**Position-independence.** The Clang documentation states that
"Non-position-independent executables are not supported" and that
`-fsanitize=thread` makes Clang act as though `-pie` had been supplied
when linking an executable. Odin's linker passes `-pie` on Linux
explicitly (`src/linker.cpp:804-807`, commented "Linux does not enable PIE
by default but required for ASLR") and `-no-pie` on other targets in the
non-PIC branch at `src/linker.cpp:811-819`. The Linux leg therefore
satisfies the requirement. The Darwin `-no-pie` did not prevent TSan from
working in the run above.

**ASLR.** The Clang documentation warns that "On Linux, disabling ASLR may
cause ThreadSanitizer to fail to allocate shadow memory, printing the
error FATAL: ThreadSanitizer can not mmap the shadow memory". Standard
hosted Linux runners are ordinary VMs with ASLR enabled, so this is a
hazard for locally reproduced containerised runs rather than for the
hosted leg, which is analysis.

**Memory against the macOS runner.** TSan's documented memory overhead is
5x-10x plus 1 MB per thread, and the `macos-26` arm64 runner has 3 vCPU
and 7 GB of RAM, the smallest of the three legs. The Linux and Windows
runners have 4 vCPU and 16 GB. Pairing the 5x-15x slowdown with the
smallest runner is the single largest wall-clock and memory risk in the
matrix, which is analysis.

## UndefinedBehaviorSanitizer

Odin exposes no UBSan flag, so there is nothing to schedule on any leg.
This is not a platform limitation: the Clang documentation lists UBSan as
working on "Android, Linux, NetBSD, FreeBSD, OpenBSD, macOS, Windows", and
describes its cost as "The checks have small runtime cost and no impact on
address space layout or ABI", with a `-fsanitize-minimal-runtime` variant
for production. Of the four sanitizers asked about, UBSan is the cheapest
and the most broadly portable, and it is the one Odin does not offer. Two
partial consolations exist and both are analysis rather than documented
equivalence: Odin's own bounds and assertion checks are on by default, and
the vendored Windows ASan archive contains `RTUbsan` compiler-rt members,
though nothing in Odin's flag surface activates them.

## The vendored C tier

S01 brings SDL3, wgpu-native, cimgui, and Luau, with wgpu-native and
naga-cli shipped as prebuilt binaries. Two constraints follow, one
documented and one structural.

**Odin instruments only Odin.** `-sanitize:address` sets per-function
sanitize attributes during Odin's own LLVM codegen
(`src/llvm_backend.cpp:2497-2510`) and appends a link flag. It has no
effect on C or Rust objects produced by a separate toolchain. Any C tier
compiled by its own build system is uninstrumented unless that build
system is separately told to pass `-fsanitize=...` with a matching
compiler-rt version, and a prebuilt binary cannot be told anything. This
is a reading of the compiler source rather than a documented statement, so
it is analysis.

**MemorySanitizer is unusable.** The Clang documentation's requirement
that "all program code is instrumented ... even libc" cannot be met by a
process that links prebuilt wgpu-native, and the stated consequence is
false reports. MSan is therefore off the table for any build that links
the C tier, regardless of leg. It remains theoretically usable on a
Linux-only, pure-Odin subset if such a target exists, which S00 does not
currently define.

**ThreadSanitizer is degraded, not blocked.** The Clang documentation
states: "ThreadSanitizer generally requires all code to be compiled with
`-fsanitize=thread`. If some code (such as pre-compiled dynamic libraries)
is not compiled with the flag, TSan may fail to detect races or may report
false positives." It names `ignore_interceptors_accesses` and
`ignore_noninstrumented_modules` as the workarounds, and both default to
false on Linux and Windows and true on Apple platforms. The practical
reading is that the same TSan run behaves differently by leg out of the
box, with the macOS leg quieter by default and the Linux leg noisier, and
that is analysis.

**AddressSanitizer is the one that tolerates it.** The ASan documentation
states no whole-program instrumentation requirement, unlike the MSan and
TSan documentation which both state one explicitly. ASan's interceptors
replace the allocator process-wide, so allocations made by uninstrumented
code still get redzones and still participate in use-after-free and leak
accounting, while direct memory accesses inside uninstrumented code are
simply not checked. That is a coverage gap rather than a correctness
hazard. The absence of a stated requirement is weaker evidence than a
stated permission, so treat this paragraph as analysis.

## Do the runner images ship what is needed

Runner labels and hardware were confirmed from GitHub's own runner
reference: `macos-26` is arm64 with 3 vCPU and 7 GB; `ubuntu-24.04` is x64
with 4 vCPU and 16 GB; `windows-latest` and `windows-2025` are x64 with 4
vCPU and 16 GB. "Use of the standard GitHub-hosted runners is free and
unlimited on public repositories."

**macOS `macos-26`.** The image manifest lists "Clang/LLVM 21.0.0" as the
system toolchain plus a keg-only "Clang/LLVM (Homebrew) 20.1.8", Xcode
26.5 as default, and Xcode Command Line Tools 26.6. Locally, Apple clang
21.0.0 from Command Line Tools 26 was checked directly: `clang
-fsanitize=address` and `clang -fsanitize=thread` on a C file both link
and record `@rpath/libclang_rt.asan_osx_dynamic.dylib` and
`@rpath/libclang_rt.tsan_osx_dynamic.dylib`, and
`/Library/Developer/CommandLineTools/usr/lib/clang/21/lib/darwin/` holds
the corresponding runtimes. So the toolchain generation the runner ships
provides both ASan and TSan runtimes.

One caveat about the macOS evidence. The Odin builds run for this note
were driven by a Homebrew-packaged Odin whose `bin/odin` is a bash wrapper
that prepends `/opt/homebrew/opt/llvm/bin` to PATH, so the linker driver
was Homebrew LLVM 22 and the recorded runtime was LLVM 22's
`libclang_rt.asan_osx_dynamic.dylib`, not Apple's. The two halves of the
macOS evidence are therefore: Odin plus LLVM 22 compiler-rt works
end-to-end on macOS arm64, and Apple clang 21 independently supplies the
same two runtimes. They have not been observed working together.

A related hazard: Odin's Darwin link line adds `-L/opt/homebrew/lib` when
that directory exists (`src/linker.cpp:884-887`), and it does exist on
macOS runners. On this workstation that directory contains no `clang_rt`
files, so nothing was shadowed, but a runner step that `brew install`s an
LLVM whose runtimes land there could change which compiler-rt is picked
up.

**Linux `ubuntu-24.04`.** The manifest lists Clang 16.0.6, 17.0.6, and
18.1.3, and no LLVM entry at all. The image's `install-clang.sh` installs
`clang-$version`, `lldb-$version`, `lld-$version`, `clang-format`, and
`clang-tidy` for each version, installs the `llvm-$version` package only
on arm64 images, sets clang 18 as the default through `update-alternatives`
for `clang`, `clang++`, `clang-format`, `clang-tidy`, and `run-clang-tidy`,
and registers no alternative for any symbolizer. The helper it sources
defines no `apt-get` wrapper, so `apt-get install` runs with Ubuntu
defaults, which install Recommends.

Two consequences follow from Ubuntu's noble packaging. First, the
sanitizer runtimes live in `libclang-rt-18-dev`, whose file list contains
`libclang_rt.asan-x86_64.a`, `libclang_rt.tsan-x86_64.a`, and
`libclang_rt.msan-x86_64.a`. That package is not a dependency or a
recommendation of `clang-18`, whose Depends are binutils, libc6, libc6-dev,
`libclang-common-18-dev`, libclang-cpp18, libclang1-18, libgcc-13-dev,
libllvm18, libobjc-13-dev, libstdc++-13-dev, libstdc++6, and
`llvm-18-linker-tools`, with Recommends of `llvm-18-dev` and python3. It
arrives instead through `libclang-common-18-dev`, whose only listed
relationship is `rec: libclang-rt-18-dev`. Since apt installs Recommends
by default and the image build does not suppress them, the runtimes should
be present, but the chain runs through two Recommends rather than a
Depends and has not been checked on a live runner.

Second, symbolization. The `llvm-18` package provides
`/usr/bin/llvm-symbolizer-18` and `/usr/lib/llvm-18/bin/llvm-symbolizer`,
and no unversioned `/usr/bin/llvm-symbolizer`. The sanitizer runtime
searches PATH for the exact name `llvm-symbolizer`, `allow_addr2line`
defaults to false, and `install-clang.sh` registers no alternative for it.
The likely outcome is that Linux sanitizer reports carry module names and
offsets rather than file and line unless the workflow sets
`ASAN_SYMBOLIZER_PATH` or adds `/usr/lib/llvm-18/bin` to PATH. This is a
chain of packaging facts, not an observation, and is listed under
Unverified.

**Windows `windows-2025`.** The manifest lists LLVM 20.1.8 and Visual
Studio Enterprise 2022 17.14 with the `VC.Llvm.Clang` and
`VC.Llvm.ClangToolset` components. Neither matters much for ASan, because
Odin brings its own static runtime rather than resolving one from the
image, and links it as an ordinary COFF archive through the MSVC linker
path (`src/linker.cpp:371-415`, defaulting to `link.exe`). The Windows
image ships an LLVM whose `llvm-symbolizer` can serve the runtime's
symbolization, which Microsoft's documentation confirms is how ASan
resolves Windows call stacks.

## What this does not settle

- The disposition. Which sanitizer runs on which leg, at what cadence, and
  whether any of them gates a merge, is a decision, not a fact, and this
  note deliberately proposes none.
- Real cost. Every multiplier here is from LLVM's documentation. This
  repository has no code, so nothing has been measured against the actual
  engine, and the documented figures are for C and C++ workloads rather
  than for Odin.
- Whether the S01 C tier can be instrumented at all. That depends on how
  SDL3, cimgui, and Luau are built, which S01 has not settled, and on
  whether a from-source build could be given matching `-fsanitize` flags
  and a matching compiler-rt.
- Whether a Linux-only, C-tier-free build target exists that MSan could
  meaningfully cover.
- Whether the Windows leg's arrival should wait on anything here.
- The interaction with Odin's LTO path. `src/llvm_backend.cpp:2497-2510`
  notes that under LTO the sanitizer passes run at link time and that
  per-function attributes are preserved, but this was not exercised.

## Unverified

- **Nothing was run on a GitHub runner.** All empirical results in this
  note come from one macOS 26.5.2 arm64 workstation. No sanitizer build or
  run has been executed on `macos-26`, `ubuntu-24.04`, or `windows-2025`.
  Everything asserted about those images is read from manifests, image
  build scripts, and distribution packaging.
- Whether `libclang-rt-18-dev` is actually installed on `ubuntu-24.04`.
  The Recommends chain says it should be. Verify with `ls
  /usr/lib/llvm-18/lib/clang/18/lib/linux/` on a runner.
- Whether `llvm-symbolizer` is resolvable by that exact name on
  `ubuntu-24.04`. Packaging says no. Verify with `which llvm-symbolizer`
  on a runner, and check whether a sanitizer report carries file and line.
- Whether an Odin build on `ubuntu-24.04` links `-fsanitize=address` and
  `-fsanitize=thread` successfully at all. Untested.
- Whether Odin plus Apple clang 21 produces a working ASan or TSan binary.
  Each half was verified separately and the combination was not.
- Whether the published Odin Windows release archive contains
  `bin/llvm/windows/clang_rt.asan-x86_64.lib`. Its presence was confirmed
  in the repository tree only, and release packaging was not inspected.
- Whether `ODIN_ROOT` resolves to the right place for a CI-installed Odin
  on Windows. The path is built by string concatenation at
  `src/llvm_backend.cpp:3771`, and a layout that breaks it would surface as
  a link error.
- The macOS hardened runtime. Apple documents that the hardened runtime
  enables library validation by default and that
  `com.apple.security.cs.disable-library-validation` turns it off. CI
  binaries are linked without hardened-runtime signing, so the question
  should not arise, and locally the ASan dylib loaded without incident.
  This was not exercised under a hardened-runtime signature.
- Actual wall-clock cost of any sanitizer job on a hosted runner.
- Whether TSan's 5x-10x memory overhead fits inside the `macos-26`
  runner's 7 GB for a real engine workload.

## Sources

Primary sources only, as required. Odin source lines were read at commit
`c5e58ad05a689720702d36c3f624d9d74166001f`, 2026-07-24.

| Source | What it backed |
|---|---|
| https://github.com/odin-lang/Odin/blob/master/src/main.cpp | The `-sanitize` flag registration (line 689), the parser and its three accepted values (1724-1742), the once-only rule (1727-1730), and the help text (3119-3124). |
| https://github.com/odin-lang/Odin/blob/master/src/build_settings.cpp | The `SanitizerFlags` enum (410-414) and the per-OS gates for ASan (2582-2593), MSan (2595-2604), and TSan (2606-2615). |
| https://github.com/odin-lang/Odin/blob/master/src/llvm_backend.cpp | The LTO note (2497-2510) and how each sanitizer reaches the linker, including the vendored Windows ASan path (3767-3810). |
| https://github.com/odin-lang/Odin/blob/master/src/linker.cpp | `clang` as the Unix link driver and `ODIN_CLANG_PATH` (447-454), the Windows `link.exe` path (371-415), `-pie` on Linux and `-no-pie` elsewhere (804-819), and `-L/opt/homebrew/lib` on Darwin (884-887). |
| https://github.com/odin-lang/Odin/tree/master/bin/llvm/windows | Existence and size of `clang_rt.asan-x86_64.lib`, downloaded and inspected as a 118-member static compiler-rt archive with no ASan DLL reference. |
| https://clang.llvm.org/docs/AddressSanitizer.html | ASan's 2x slowdown, its platform list, the LeakSanitizer default per platform, and `ASAN_SYMBOLIZER_PATH`. |
| https://clang.llvm.org/docs/MemorySanitizer.html | MSan's 3x slowdown, its Linux, NetBSD, and FreeBSD platform list, and the requirement that all program code including libc be instrumented. |
| https://clang.llvm.org/docs/ThreadSanitizer.html | TSan's 5x-15x slowdown, its 5x-10x plus 1 MB per thread memory overhead, its platform and architecture matrix with no Windows entry, the whole-program instrumentation requirement and its two ignore options, the PIE requirement, and the Linux ASLR failure mode. |
| https://clang.llvm.org/docs/UndefinedBehaviorSanitizer.html | UBSan's stated small runtime cost, its platform list including Windows and macOS, and `-fsanitize-minimal-runtime`. |
| https://learn.microsoft.com/en-us/cpp/sanitizers/asan | MSVC ASan being x86 and x64 only on Windows 10 and later, its incompatibilities, its lack of TSan, LSan, MSan, and UBSan, and its use of the LLVM symbolizer for call stacks. |
| https://github.com/actions/runner-images/blob/main/images/macos/macos-26-arm64-Readme.md | Clang/LLVM 21.0.0, keg-only Homebrew LLVM 20.1.8, Xcode 26.5 default, Command Line Tools 26.6. |
| https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md | Clang 16.0.6, 17.0.6, 18.1.3, and the absence of any LLVM entry. |
| https://github.com/actions/runner-images/blob/main/images/windows/Windows2025-Readme.md | LLVM 20.1.8 and Visual Studio Enterprise 2022 17.14 with its Clang components. |
| https://github.com/actions/runner-images/blob/main/images/ubuntu/scripts/build/install-clang.sh | Which packages the Ubuntu image installs per clang version, that `llvm-$version` is installed on arm64 only, and which `update-alternatives` entries are registered. |
| https://github.com/actions/runner-images/blob/main/images/ubuntu/scripts/helpers/install.sh | That no `apt-get` wrapper suppresses Recommends. |
| https://packages.ubuntu.com/noble/clang-18 | The Depends and Recommends of `clang-18`, and the absence of `libclang-rt-18-dev` from both. |
| https://packages.ubuntu.com/noble/libclang-common-18-dev | That it recommends `libclang-rt-18-dev`, which is how the runtimes reach the image. |
| https://packages.ubuntu.com/noble/amd64/libclang-rt-18-dev/filelist | That this package provides `libclang_rt.asan-x86_64.a`, `libclang_rt.tsan-x86_64.a`, and `libclang_rt.msan-x86_64.a`. |
| https://packages.ubuntu.com/noble/amd64/llvm-18/filelist | That `llvm-symbolizer` ships only as `/usr/bin/llvm-symbolizer-18` and `/usr/lib/llvm-18/bin/llvm-symbolizer`. |
| https://docs.github.com/en/actions/reference/runners/github-hosted-runners | Runner label to architecture and hardware mapping, and that standard hosted runners are free and unlimited on public repositories. |
| https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.security.cs.disable-library-validation | That the hardened runtime enables library validation by default and which entitlement disables it. |

Empirical results were produced with Odin `dev-2026-07:819fdc7a8` on macOS
26.5.2 arm64 (build 25F84), Apple clang 21.0.0 from Command Line Tools 26,
and Homebrew LLVM 22.1.8.
