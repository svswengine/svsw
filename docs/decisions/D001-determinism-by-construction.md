# D1: Determinism by construction

Status: current
Date: 2026-07

The simulation is deterministic by construction: fixed timestep, ordered ECS
iteration, engine-seeded RNG, no wall clock reachable from simulation code.
Golden world hashes enforce it in CI. Determinism underpins replays, testing,
and server-authoritative multiplayer (D6); breaking it is a release blocker.
