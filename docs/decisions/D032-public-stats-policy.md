# D32: Public stats policy

Status: current
Date: 2026-07

The org profile (`.github`) displays live project stats keyed to real gates:
a badge never lands before the thing it measures exists, the same no-fiction
rule as D31. Tier 1 (shields.io dynamic badges: commit activity, total
commits, last commit, CI status, open issues, code size) is live at the S00
public push with zero engine-side infrastructure. Tier 2 (spec progress, test
count, headless/windowed parity, sim-tick p95, gate-roster count, course
modules) is computed by a stats-refresh GitHub Action in `.github` that
writes shields endpoint JSON files, rendered via `img.shields.io/endpoint`;
hosted runners only, matching the S00 no-self-hosted-runner rule. Spec
progress (`N/39 implemented`) is the headline metric, available immediately
at S00. See `docs/plans/public-stats.md`.
