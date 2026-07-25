# D44: Worker topology: two kinds, split by state ownership

Status: current
Date: 2026-07

A worker is one of exactly two kinds, and which kind it is decides what
happens when it dies. A **Session worker** runs a Session, owns user state,
and never restarts silently: a crash surfaces and waits, because discarding
unsaved work to be helpful is worse than stopping. A **Job worker** does
derived-state work such as asset import, shader compilation or a bake, owns
nothing the user has not already saved, lives in a bounded pool, and is
killed and restarted freely. The editor supervises N Session workers rather
than one, and that is a present requirement rather than a future
convenience: D4 caps the verification scene at two-client co-op and D6 makes
the server the single world truth, so exercising it locally is one server
plus two clients. One binary serves both supervisors, the Go gateway online
and the editor locally, so a Session worker is the same program wherever it
runs. This amends D36 and S22, which assume a singular worker. Supervision
mechanics follow the shape the research found consistent across VS Code,
Chrome and the language-server ecosystem: a hang is inferred from an
unanswered request rather than a heartbeat channel, crash handling is a
counted budget over a window rather than an unbounded retry, a wedged worker
is blamed only on overwhelming evidence and otherwise the user is offered a
bisect, and every request carries a timeout, because the reference LSP
client's lack of one lets a worker that accepts a request and never answers
hang a feature silently forever. Alternatives rejected: keeping one worker
cannot drive the D4 verification scene from the editor; a process per
Extension is rejected because VS Code chose one host per window and every
per-something topology in the research grew a consolidation heuristic
afterwards, so the counter-mechanism must be budgeted rather than
discovered; and running import and compilation as editor threads is rejected
because the process boundary is what converts "self-contained,
deterministic, must not change the context it is running in" from a
guideline into an enforceable contract, which is the same property D1 asks
of simulation code. The boundary is also load-bearing for determinism and
for versioning, not only for crashes: the process-global FPU control word
cannot reach a Session from the editor, and a worker rebuilt from modified
engine source communicates by serialised protocol rather than by a shared
in-process ABI, which is the case an in-process extension interface handles
worst. Viewport embedding is expected to work by reparenting the worker's
operating-system window rather than by sharing a texture, since no rendering
interface offers safe cross-process external memory import and SDL3 supports
reparenting directly; the specifics belong to S22. Settled with the
maintainer on 2026-07-25. Amended by D47: the viewport embeds a shared
offscreen render target rather than a reparented window, and a third
worker condition, debug-suspended, joins the two kinds.
