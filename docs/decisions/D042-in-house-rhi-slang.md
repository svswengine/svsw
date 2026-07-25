# D42: In-house RHI over Vulkan, D3D12 and Metal; Slang shaders

Status: current
Date: 2026-07

svsw owns its rendering hardware interface, written directly against Odin's
vendored `vendor:vulkan`, `vendor:directx/d3d12` and `vendor:darwin/Metal`
bindings, and this supersedes D7's wgpu clause. Shaders are authored in
Slang and compiled to SPIR-V, DXIL and MSL; WGSL, naga and `shader-check`'s
naga form go with wgpu. The target is the feature set an engine aiming at
current-generation rendering needs and a WebGPU-shaped API cannot express:
hardware ray tracing, mesh and task shaders, bindless descriptor indexing,
async compute on a second queue, explicit barriers, and the vendor upscalers
that require raw native handles and swapchain ownership. Slang's Metal
target is documented a work in progress, so it lands only after a real
shader is demonstrated compiling to working MSL on the pattern issue #12
established; the fallback, Slang to SPIR-V to MSL through SPIRV-Cross,
changes no shader source. What makes this affordable rather than heroic is
that the binding layer already exists and is maintained upstream:
`vendor:vulkan` sits at API 1.4 with `CmdTraceRaysKHR` and
`CmdDrawMeshTasksEXT`, `vendor:directx/d3d12` reaches `IDevice10` and
`IGraphicsCommandList7` with all four DX12 Ultimate pillars, and
`vendor:darwin/Metal` carries the acceleration-structure family,
intersection function tables and mesh pipelines. Every option between was
examined
and each is blocked: wgpu-native's C header comments out its mesh-shader
feature, exposes no acceleration-structure entry points at all, and is
capped at one queue by the WebGPU specification; NVRHI has no Metal backend,
confirmed structurally rather than merely unmentioned, and is C++ with no C
API; bgfx and sokol-gfx have a lower ceiling than wgpu; The Forge has no
mesh shaders; Diligent clears the bar but its Metal backend is commercially
licensed and its C API is COM vtables built from preprocessor macros Odin
cannot consume. Shipping on wgpu and swapping later is rejected because the
abstraction would be designed against WebGPU's implicit resource model and
then rebuilt for explicit barriers, descriptor heaps and queue families,
which is building it twice. D2's layering law is unchanged and gains force:
only the platform tier and the GPU stratum touch a backend, and there are
now three of them behind that one seam. D14 is amended: wgpu-native and
naga-cli leave the vendored tier, the Slang binaries enter it under the same
checksum-pinned prebuilt policy, and SDL3, cimgui and Luau are untouched.
D8 is amended where it says wgpu compute shaders; the clustering pass is
unchanged in substance and now runs through this interface. The draw-list
skeleton hash stays backend-free by construction, and the readback golden's
platform and backend axes stop describing one abstraction's behaviour and
start describing three real backends, which is what those axes were always
for. Settled with the maintainer on 2026-07-25 against six primary-source
research notes.
