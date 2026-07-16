# svsw

svsw is an open-source 3D game engine: Odin for the core, Luau for typed,
sandboxed gameplay scripting and modding, and Go for online services, with a
policed C interface tier at the platform boundary. The simulation is
deterministic and verified by golden world hashes; headless and windowed
runs produce identical results, so both agents and humans can verify the
engine works. A real editor ships alongside the runtime. The engine
completes stage by stage, proven by verification scenes. This repository is
a monorepo: engine, CLI, runtime, samples, and services live together.

## Status

Planning and spec phase. Code lands spec by spec; see
[docs/README.md](docs/README.md) for the documentation layout, including the
spec index and design records.

## License

Apache-2.0. See [LICENSE](LICENSE).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The project is closed to external
contributions for now.
