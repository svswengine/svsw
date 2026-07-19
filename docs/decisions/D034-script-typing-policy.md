# D34: Script typing policy

Status: current

`--!strict` is gate-enforced for first-party scripts: base-as-mod, samples,
editor scripts, and scaffold templates fail `just check` if they do not
typecheck clean. Third-party mods stay nonstrict and advisory: type errors
surface as IDE warnings and never block a mod load; the sandbox (containment,
budgets, R1-R5) remains the sole safety boundary, unchanged by D12. The
`svsw.*` type surface ships as `.d.luau` declaration files generated from the
Odin binding registry (the D3 opt-in binding registrar), with a drift gate
inside `just check` shaped like the existing api-coverage gate. This is the
concrete, Luau-native form of the typed-DX answer: generated annotations give
way to a generated declaration file plus the language's own strict/nonstrict
pragmas, with one generator covering both editor scripts and mod scripts.
