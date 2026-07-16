# Public stats plan

This is the design record for the org profile's live project stats, per the
maintainer's approved plan. `specs/README.md` cross-references it from S00,
S02a, S04, S09, S21, and C00 — each spec adds the badge its own gate makes
possible.

## Purpose

The org profile (`.github`) displays live project stats. The governing rule
is no-fiction: a badge arrives only when the thing it measures exists.
Nothing here is speculative or aspirational; every badge is wired to a real
gate, a real recipe, or a real spec-status field, and lands with the spec
that creates its data source.

## Tier 1 — zero infrastructure

Live at the S00 public push, with no engine-side code: shields.io dynamic
badges pointed at the GitHub API.

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
`.github`; badges render via `img.shields.io/endpoint` against those files.
Hosted runners only, matching the S00 no-self-hosted-runner rule.

| Badge | Source | Available from |
|---|---|---|
| Spec progress (`N/38 implemented`) | the spec index in `specs/README.md` | S00 (immediately) |
| Test count | the Odin test runner | S02a |
| Headless == windowed parity | the D72 parity gate | S04 |
| Sim-tick p95 | the stress harness | S09 |
| Gate-roster count | the S21 enumerated roster | S21 |
| Course modules published | the course repo, C00 side | C00 |

Spec progress is the headline metric: it is live the moment S00 lands,
before any other engine-native badge has data to report.

## Optional visuals

Not commitments; options to pick up if the tier-1/tier-2 badges want
company:

- An Action-regenerated Mermaid section: a language-LOC pie (via `tokei`)
  and a spec-status distribution chart.
- Third-party activity cards (repobeats, lowlighter metrics) embedded as-is,
  no engine-side computation.

## Rules

- A badge never precedes the gate it measures; if the gate is pending, the
  badge does not render.
- Endpoint JSON files live in `.github`, next to the badges that read them.
- No third-party runtime dependencies beyond shields rendering the badge
  images themselves.
- Stats jobs run on hosted runners only, per the S00 CI policy.
