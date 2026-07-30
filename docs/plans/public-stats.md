# Public stats plan

This is the design record for the org profile's live project stats, per the
maintainer's approved plan. `docs/specs/README.md` cross-references it
from S00, S02a, S04, S09, S21, and C00 — each spec adds the badge its own
gate makes possible.

## Purpose

The org profile (`.github`) displays live project stats. This record says
what each badge measures, which spec it waits on, and where its number
comes from.

## Tier 1 — zero infrastructure

Live from S00, with no engine-side code: shields.io dynamic badges pointed
at the GitHub API.

- Commit activity per month
- Total commits
- Last commit
- CI workflow status (`just check`)
- Open issues
- Code size / top language

These render directly from `img.shields.io` against public GitHub data; no
job runs in either repo to produce them.

## Tier 2 — engine-native

A stats-refresh GitHub Action in the `.github` repo computes numbers from
the `svsw` (and `course`) repos and writes shields
[endpoint JSON](https://shields.io/badges/endpoint-badge) files into
`.github`; badges render via `img.shields.io/endpoint` against those
files.

| Badge | Source | Available from |
|---|---|---|
| Spec progress (`N/46 implemented`) | the spec index in `docs/specs/README.md` | S00 (immediately) |
| Test count | the Odin test runner | S02a |
| Headless == windowed parity | the D22 parity gate | S04 |
| Sim-tick p95 | the stress harness | S09 |
| Gate-roster count | the S21 enumerated roster | S21 |
| Course modules published | the course repo, C00 side | C00 |

Spec progress is the headline metric: it is live the moment S00 lands,
before any other engine-native badge has data to report.

## Optional visuals

Not commitments; options to add once the tier-1 and tier-2 badges are live:

- An Action-regenerated Mermaid section: a language-LOC pie (via `tokei`)
  and a spec-status distribution chart.
- Third-party activity cards (repobeats, lowlighter metrics) embedded as-is,
  no engine-side computation.

## Rules

- No fiction: a badge arrives only when the thing it measures exists. It
  never precedes the gate it measures, and it does not render while that
  gate is pending.
- Endpoint JSON files live in `.github`, next to the badges that read them.
- No third-party runtime dependencies beyond shields rendering the badge
  images themselves.
- Stats jobs run on hosted runners only, per the S00 CI policy.
- Spec progress counts the S- and C-series rows of the spec index, M00
  excluded: it is a design artifact, not engine software. The denominator is
  46 today and changes only when that index gains or loses a row.
