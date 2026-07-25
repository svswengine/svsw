# D46: Luau deterministic sim surface

Status: current
Date: 2026-07

D35 settled Luau's number semantics; this settles the rest of the VM's
determinism surface, because mods write hashed sim state and the S30
verification ruleset is Luau end to end. Three hazards live in the stock
VM. Luau's math library delegates sin, cos, pow and exp to platform libm,
whose last-bit rounding differs between macOS arm64 and Linux x86-64, so
a transcendental call on a sim-writing path diverges the world hash
across the CI legs. math.random is VM-local randomness outside simrng's
seed discipline (D1). pairs() walks pointer-keyed tables in allocation
order, which ASLR varies run to run. The sandbox therefore ships a
deterministic sim surface: S14's whitelist replaces the math.*
transcendentals with engine-provided deterministic f64 implementations,
carrying an allow-list and ban-list rationale record in S02b's style;
simrng-backed bindings replace math.random; and sim-writing table
walks use svsw-provided ordered iteration, with pointer-keyed pairs()
barred from sim paths by the D34 strict-mode lint, which binds
first-party code hard and third-party mods advisorily, their runtime
divergence remaining a D50 tripwire matter. Passing the raw
libm-backed functions through is rejected because a per-platform hash
divergence inside mod code cannot be debugged from the engine side;
banning transcendentals outright for mods is rejected because gameplay
code needs them and would reimplement them worse in Luau. S14's gate
gains a cross-platform leg: the hash-golden Luau sample exercises the
replaced math surface and the ordered iteration and reproduces one
committed hash on both CI platforms. Adopted from the 2026-07-25
adversarial review at the maintainer's direction.
