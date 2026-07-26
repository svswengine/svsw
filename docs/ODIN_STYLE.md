# Odin Style Guide

The engineering standard for Odin code in this repository. Adapted from
[TigerStyle](https://tigerbeetle.com/TigerStyle). Design goals, in order:
safety, performance, developer experience.

Every rule here earned its place in a working codebase. Review enforces all
of them; the compiler's vet flags enforce S1 and S2 on every build. Derived
requirements such as determinism trace to private product requirements.

## 1. Assertions

Assertions detect programmer errors. Operating errors (bad script input, a
missing asset) are expected and handled. Assertion failures are unexpected,
and the correct response to corrupt engine state is a crash at the point of
corruption. Assertions turn a catastrophic correctness bug, such as a
corrupted hash, into an immediate, located crash.

### A1. Two assertions per function, on average

Assert function arguments, return values, preconditions, postconditions, and
invariants. A function must not operate on data it has not checked. Hold the
file average at two or more assertions per procedure; pure leaf math may
carry fewer when its callers carry more.

```odin
// GOOD: every argument checked before use.
pool_init :: proc(p: ^Pool, name: string, size, align: int) {
	assert(p.data == nil, "pool already initialized")
	assert(size > 0, "element size must be positive")
	// ...
}

// BAD: operates on unchecked data; a zero size corrupts every later hash.
pool_init :: proc(p: ^Pool, name: string, size, align: int) {
	p.info = {name = name, size = size, align = align}
}
```

Assertions stay enabled in every build configuration. Disabling them in a
shipping target is a logged decision, not a flag flip.

### A2. Split compound assertions

Write `assert(a); assert(b)` over `assert(a && b)`. The split form reads as
two facts and names which one failed. Assert an implication with a
single-line `if`: `if p.count == 0 { assert(len(p.dense) == 0) }`.

### A3. Assert the positive and the negative space

Assert what must be true and what must be absent. An add path asserts
absence; the matching remove path asserts presence:

```odin
pool_add :: proc(p: ^Pool, e: Entity) -> rawptr {
	assert(p.sparse[e.index] == NIL_DENSE, "element already present")
	// ...
}
pool_remove :: proc(p: ^Pool, e: Entity) {
	assert(pool_has(p, e), "removing an element the entity does not have")
	// ...
}
```

Test the same way: exercise invalid data and valid data turning invalid
(stale handles, freed entities), not only the happy path.

### A4. Pair assertions across code paths

Enforce each critical property in at least two places: on the write side and
the read side, on entry and on exit, on add and on remove. A restore
procedure asserts the length relation its snapshot counterpart produced.

### A5. Compile-time assertions

Use `#assert` for type sizes and constant relationships the code relies on.
A type whose raw byte image is hashed or serialized carries a `#assert` on
its size next to its definition; the claim lives in checked code, not prose:

```odin
#assert(size_of(Entity) == 8)                // hashed as a raw byte image
#assert(size_of(Entity) == 2 * size_of(u32)) // therefore: no padding
```

### A6. A true assertion beats a comment

Where a condition is critical and surprising, assert it even when it looks
obvious. The assert is documentation that cannot rot; keep the comment for
the why.

### A7. Assertions in `contextless` and `proc "c"` code

Odin's `assert` needs a `context`. In `proc "contextless"` and `proc "c"`
code, use `runtime.assert_contextless` from `base:runtime`. Never skip an
assert because the context is missing, and never rebuild a context just to
assert.

### A8. Boundary rule: assert engine invariants, reject script input

A script must never crash the engine. At the scripting boundary, anything
script-supplied is an operating error: reject it through the script VM's
error mechanism, contained by the host's protected call, with the script
disabled and the engine healthy. Reserve `assert` for invariants no script
input can reach. A script input that trips an engine assert is a security
bug in the boundary, not a correct assert.

## 2. Function shape

### F1. Hard limit: 70 lines per procedure

Counted from the line containing `::` through the closing brace, comments
and blanks included. A procedure that fits on one screen reads as a unit;
one that scrolls does not. The limit is checkable by machine and has no
exceptions without a maintainer decision recorded at the site.

## 3. Types

### T1. Explicit widths where the width is meaning

Anything hashed, snapshotted, serialized, or crossing the C or script ABI
uses explicit widths: `u32`, `u64`, `i64`, `f32`, `enum u8`, or
`c.int`/`c.size_t` at the C boundary. The byte image is the contract.
`Entity :: struct {index, gen: u32}` is the pattern.

Odin's `int` is idiomatic for lengths and indices into in-process slices:
`len()` returns `int`, and fighting that breeds casts. The line is
persistence and wire. Never use `uint`: unsigned arithmetic wraps without a
diagnostic, and the width depends on the target.

### T2. `distinct` types for identifiers

IDs are not integers; make the compiler agree. `Component_ID :: distinct u32`
stops a dense index from passing where an ID belongs. Every ID-like quantity
(handles, indices into registries) gets the same treatment. Convert with an
explicit cast at the storage edge (`w.pools[int(id)]`), the exact place the
reader should slow down.

## 4. Memory

### M1. Iterate stateful values by reference

Odin's range loop copies each element by default. When a called procedure
mutates that copy, the mutation lands in the copy and vanishes; the code
compiles, and any hash over that state drifts without a diagnostic. Write
`for &x in` for anything mutated in the loop, and pass stateful or large
structs as `^T`.

```odin
// GOOD: mutations land in owned state.
for &sys in w.systems { sys.run(w, &sys) }

// BAD: copies each System; RNG state advances in the copy and is discarded.
for sys in w.systems { sys.run(w, &sys) }
```

Do not alias state into convenience locals that outlive a mutation; a slice
taken before an `append` is stale after it.

## 5. Style

### S1. Formatting: odinfmt, tabs, the full vet set

Indent with tabs: odinfmt emits them and `-vet-tabs` enforces them. Every
test and type-check invocation passes the full vet set
(`-vet -vet-tabs -strict-style -vet-style -warnings-as-errors
-disallow-do`). A style rule that fights the toolchain becomes a rule nobody
runs; the formatter plus the vet flags are the rule.

### S2. Braces on every block

`-disallow-do`, already in the vet set, bans the brace-less
`if cond do stmt` form, closing the "goto fail" class by machine. What
remains is judgment: split compound conditions into nested `if`/`else` trees
so every case is visible, and give an `if` its `else` when the negative
space needs handling or asserting (A3).

### S3. `proc "c"` callbacks rebuild the context

Script VM callbacks are `proc "c"` and carry no Odin context. Every entry
point from the VM assigns `context` from host state before touching anything
allocator- or logger-dependent, and never leaves a `defer` live across a
point that can longjmp. Review checks this file by file like any other style
rule.

