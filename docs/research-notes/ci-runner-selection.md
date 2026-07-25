# CI runner selection for the macOS arm64 leg

Research note for issue #2, a `wayfinder:research` child of the S00 decision
map. Checked 2026-07-25. This note presents options and their ceilings; it
settles nothing.

## The question

S00 requires `just check` green on macOS arm64 and Linux x86-64 on every
commit, and a later spec adds a hosted Windows CPU-only determinism leg.
Two constraints scope the answer before any comparison starts. Hosted
runners only, because a self-hosted runner attached to a public repository
executes forked code on the owner's machine and `svswengine/svsw` is public
today. And a CI budget of zero: no runner tier, no overage minutes, no
subscription. So the question is not what each provider charges. It is
which providers give a public repository hosted Apple silicon for free,
where the ceiling on that free tier sits, and whether the choice paints the
Windows leg into a corner.

## The short answer, and the one fact it rests on

GitHub Actions standard runners are free and unlimited on public
repositories, and macOS arm64, Linux x86-64 and Windows are all standard.
The GitHub-hosted runners reference states it without qualification by
operating system:

> Use of the standard GitHub-hosted runners is free and unlimited on public
> repositories.

The billing concept page says the same thing from the billing side: "GitHub
Actions usage is free for standard GitHub-hosted runners in public
repositories." There is no monthly minute allowance to exhaust on a public
repository, so there is no per-minute cliff to price. The included-minutes
quota (2,000/month on GitHub Free) applies to private repositories only.

The exclusion that matters is **larger runners**, which are billed even on
public repositories: "The larger runners are not free for public
repositories", and "Larger runners are always charged for, even when used
by public repositories or when you have quota available from your plan."
This is a live trap on macOS specifically, because the larger macOS SKUs
are built from the same images as the free standard ones and differ only
by label suffix. `macos-26` is free; `macos-26-xlarge` is the `macos_xl`
SKU at $0.102/min and is billed. Pinning the bare label is the whole
mitigation.

## The viable options

Hosted Apple silicon that a public repository can reach without paying.
"Free macOS ceiling" is the monthly limit on macOS specifically, which is
usually far below the provider's headline free allowance because macOS
draws on it at a multiplier.

| Provider | macOS arm64 label | Free for a public repo | Free macOS ceiling | macOS concurrency | Where the cliff is |
|---|---|---|---|---|---|
| GitHub Actions | `macos-26`, `macos-latest` | yes, by policy, no application | none; free and unlimited | 5 (GitHub Free plan) | only if a workflow names a larger runner |
| CircleCI | `m4pro.medium` | yes, automatic for public repos | 25,000–30,000 credits ≈ 125–150 min/month | 2 for macOS OSS credits | $0.12/min at 200 credits/min |
| Blacksmith | `blacksmith-6vcpu-macos-26` | yes, from a shared pool | 3,000 x64 min at a 20x macOS rate ≈ 150 min/month | unverified | $0.08/min |
| Codemagic | `mac_mini_m2` | yes, Personal accounts only | 500 macOS M2 min/month | 1 parallel build | $0.095/min |
| GitLab.com SaaS | `saas-macos-medium-m1` | no on Free; only via the Open Source Program | ≈ 8,300–16,600 min/month, composition unverified | unverified | n/a inside the program |

Every row after the first is a grant with a ceiling; the first is a policy
without one. That gap, roughly two orders of magnitude on macOS minutes, is
the finding.

## GitHub Actions

### What the free tier grants

| Item | Value for a public repository |
|---|---|
| macOS arm64 standard labels | `macos-latest`, `macos-26`, `macos-15`, `macos-14` (deprecated) |
| macOS arm64 spec | 3 vCPU (M1), 7 GB RAM, 14 GB storage |
| Linux x86-64 standard labels | `ubuntu-latest`, `ubuntu-24.04`, `ubuntu-22.04` |
| Windows standard labels | `windows-latest`, `windows-2025`, `windows-2022`, `windows-11-arm` |
| Minutes | free and unlimited; no allowance to exhaust |
| Application required | none |
| Cost cliff | only if a workflow names a larger runner (`-large`, `-xlarge`) |

`macos-latest` currently resolves to macOS 26 arm64, `ubuntu-latest` to
Ubuntu 24.04, and `windows-latest` to Windows Server 2025.

### Where the ceilings actually are

None of these is a minute budget. They are the real limits a public repo
hits.

- **Concurrency** — GitHub Free allows 20 concurrent jobs total and a
  maximum of 5 concurrent macOS jobs. The macOS cap "is shared across
  standard GitHub-hosted runners and GitHub-hosted larger runners". The
  `svswengine` organization is on the `free` plan, so this is the row that
  binds. Two-platform S00 needs two concurrent jobs, so the cap is not
  close to binding.
- **Job timeout** — 6 hours per job on GitHub-hosted runners, 35 days per
  workflow run.
- **Artifact and log retention** — 90 days by default. A public repository
  may set anywhere between 1 and 90 days; private repositories may go to
  400. So 90 days is a hard ceiling here, not a default that can be raised.
- **Cache** — 10 GB per repository, evicted oldest-access-first, and any
  entry not accessed for 7 days is removed.
- **macOS disk** — 14 GB storage on the macOS runners, against 4 vCPU and
  16 GB RAM on the public-repo Linux and Windows runners. The macOS leg is
  the tightest box on every axis, and it is the one that later has to hold
  a wgpu/SDL3 build.

### Can the free tier be revoked

Not by application review, because there is no application. The exposure is
the acceptable-use terms: Actions may not be used for cryptomining, for
activity that places "a burden on our servers, where that burden is
disproportionate to the benefits provided to users", or on GitHub-hosted
runners for "any other activity unrelated to the production, testing,
deployment, or publication of the software project". GitHub "may monitor
your use of GitHub Actions" and may respond with termination of jobs,
restrictions on Actions, disabling repositories, or account suspension. A
normal engine CI workload sits far inside this, but the policy is the only
thing standing between the repo and the free tier, so it is worth knowing
it is a conduct rule rather than a quota.

### Does the image make an Odin toolchain awkward

No, on any of the three platforms. Odin supports LLVM 17 through 22 and
requires the Xcode command-line tools on macOS.

| Image | Homebrew | Xcode CLT | System Clang/LLVM | Rust |
|---|---|---|---|---|
| `macos-26` (arm64) | 6.0.11 | 26.6.0 | 21.0.0 | 1.97.0 |
| `macos-15` (arm64) | 6.0.11 | 16.4.0 | 17.0.0 (plus `llvm@18` 18.1.8) | not checked |
| `ubuntu-24.04` | n/a | n/a | 16.0.6, 17.0.6, 18.1.3 | 1.97.0 |
| `windows-2025` | n/a | n/a | LLVM 20.1.8 | 1.97.1 |

Both macOS images ship Homebrew and the Xcode command-line tools
preinstalled, and both system Clang versions fall inside Odin's supported
window. Odin's own release `dev-2026-07a` (2026-07-10) publishes
`odin-macos-arm64-…tar.gz` and `odin-linux-amd64-…tar.gz`, and Homebrew
carries an `odin` formula at 2026-07a with `arm64_tahoe`, `arm64_sequoia`,
`arm64_sonoma` and `x86_64_linux` bottles, so either install route works
without building LLVM. `just` 1.57.0 has the same bottle spread. The one
item that builds from source is `naga-cli`, published on crates.io only
(30.0.0, no prebuilt binaries), but Rust 1.97 is preinstalled on the
`macos-26`, `ubuntu-24.04` and `windows-2025` images, so it is a
`cargo install` rather than a toolchain bootstrap.

## CircleCI

macOS on the free plan is real and easy to miss, because the plan
comparison implies otherwise. The proof is a changelog entry that presumes
free-plan macOS jobs exist: "Starting November 10, 2025, the default
resource class for macOS jobs for Free plan organizations will change from
`macos.m1.medium.gen1` to `m4pro.medium`", with the M1 and M2 classes
reaching end of life on 2026-02-16. Current Apple silicon classes are
`m4pro.medium` (6 vCPU, 28 GB) and `m4pro.large` (12 vCPU, 56 GB), selected
with a `macos:` executor plus `resource_class:`.

- **No application** — "Using our Free Plan and keeping your repository
  public will enable this for you."
- **Linux is generous** — "Organizations on our Free Plan can use up to
  400,000 credits per month, for free, for Linux open source builds", and
  Linux medium bills at 7 credits/min, so roughly 57,000 Linux minutes a
  month.
- **macOS is not** — the same page gives two different figures in two
  sections, "30,000 credits every month to use on macOS open source builds"
  in the body and "25,000 free credits per month" in the FAQ. At 200
  credits/min for `m4pro.medium` that is 125 to 150 macOS minutes a month.
- **macOS concurrency is 2** — "Free credits for macOS open source builds
  can be used on a maximum of 2 concurrent jobs per organization."
- **Windows is inside the same small pool** — the open-source page bundles
  it with macOS: "400,000 credits per month for Linux, Arm, and Docker open
  source builds, and 30,000 credits for macOS and Windows builds."

Homebrew is preinstalled ("Homebrew is pre-installed on CircleCI"), and
per-image software manifests are published, so an Odin install would work.
The binding problem is the ceiling: 125 to 150 macOS minutes a month is a
handful of runs per day at best, against a requirement of green on every
commit. Bundling Windows into the same pool makes the later leg compete
with the macOS leg for the same credits.

## Blacksmith

Genuinely hosted on Blacksmith's own bare metal, with GitHub-style labels
(`blacksmith-6vcpu-macos-26`, `blacksmith-12vcpu-macos-15`, and Ubuntu and
`windows-2025` equivalents), and the macOS images "follow the corresponding
GitHub-hosted macOS runner images", so the toolchain story is inherited
from GitHub's.

The free tier includes macOS but at a punitive conversion: "Blacksmith
provides `3000 x64 2vCPU minutes` for free per month per organization", and
"1 macOS 6vCPU minute = 20 x64 2vCPU minutes". Their own worked example is
a 10-minute macOS job consuming 200 x64 minutes. That is about 150 free
macOS minutes a month, and spending them leaves nothing for Linux.

Blacksmith does publish an explicit open-source program, pitched at exactly
this situation: "We see GitHub's free plan falling short for many OSS
projects. We want to help." It is an application form with soft criteria
(actively maintained public repo, permissive license, clear community
usage), and what it grants in concrete minutes is not published. So it is a
discretionary grant of unknown size, obtained by application and
withdrawable in principle.

## Codemagic

The inverse shape of everyone else: the free tier is macOS-only. "500 free
macOS M2 minutes / month" on `mac_mini_m2`, refilled monthly, while
"Instance types `mac_mini_m4`, `linux_x2`, `linux_x4`, and `windows_x2` are
only available for teams and users with billing enabled". So Codemagic
cannot supply the Linux leg or the later Windows leg for free at all, and
would have to be a macOS-only partner in a mixed setup.

Two further limits bite. Concurrency is "Max 1 parallel build". And the
eligibility wording is a direct risk for this repo: "Free build minutes are
reserved for personal and hobby projects on Personal accounts", where
`svsw` is owned by the `svswengine` organization.

## GitLab.com SaaS runners

Apple silicon exists (`saas-macos-medium-m1`, 4 vCPU / 8 GB; and
`saas-macos-large-m2pro`, 6 vCPU / 16 GB; images `macos-15-xcode-16` and
`macos-26-xcode-26`) and the image inventory is the best documented of any
provider checked, listing Homebrew 5.1.15, the Xcode Command Line Tools as
an installed package, and Clang 21.0.0.

It is excluded from the free tier, and the only zero-cost route in is the
open-source program: "Hosted runners on macOS are in beta and available
for open source programs and customers in Premium and Ultimate plans."
The GitLab for Open Source program grants "GitLab Ultimate, self-managed
or SaaS, including 50,000 compute minutes calculated at a
program-specific cost factor", and its terms are the ones to weigh:

- **Application with hard eligibility** — every project in the namespace
  under an OSI-approved license, no revenue from the project, source and
  namespace publicly visible.
- **Annual renewal** — "You'll need to renew your program membership
  annually", so eligibility is re-tested every year and the grant lapses if
  it is not renewed.
- **No support** — "Program members don't receive support."
- **Beta status** on the macOS runners themselves.

The macOS ceiling is genuinely ambiguous. macOS medium carries a compute
cost factor of 6 and the open-source program carries a public-project
factor of 0.5, and no page states how the two compose. Multiplicative gives
about 16,600 macOS minutes a month, macOS-factor-only about 8,300. Either
is far more macOS capacity than any other non-GitHub option, which makes
this the ambiguity most worth resolving if GitHub is ever ruled out.

The structural cost is the real one: GitLab CI runs against a GitLab
repository, so using it from a public GitHub repo means repository
mirroring, and that is a second forge in the loop rather than a second
runner pool. Hosted Windows, by contrast, is in GitLab's Free tier
(`saas-windows-medium-amd64`, cost factor 1, beta).

## Why self-hosting is out, stated rather than omitted

The cheapest way to get Apple silicon into CI is a Mac on a desk running
the Actions runner agent, and it is barred here rather than merely
unattractive. GitHub's own guidance is that self-hosted runners "should
almost never be used for public repositories on GitHub, because any user
can open pull requests against the repository and compromise the
environment", and the runner setup page spells out the mechanism: "forks
of your public repository can potentially run dangerous code on your
self-hosted runner machine by creating a pull request that executes the
code in a workflow." `svswengine/svsw` is public with issues enabled
today, so this is a live hazard, not a deferred one. The same reasoning
rules out any vendor whose product is really a managed self-hosted runner
registered against the repository, whatever the marketing calls it.

## Ruled out on cost

No free tier a public repository can use, so out under a zero budget. One
line each.

- **Buildkite hosted** — the pricing table leaves every Mac row blank on
  the free plan; hosted Mac is Pro pay-as-you-go, and whether the "free for
  open source" Pro grant includes Mac minutes is not published. It also has
  no hosted Windows: "Buildkite offers both Linux and macOS hosted agents."
- **Bitrise** — Apple silicon starts at Starter, "$89/month when billed
  annually or $99 per month when billed monthly"; the free plan's machine
  type is Linux Medium.
- **Cirrus Runners** — "$150 per month per concurrent Cirrus Runner", no
  free tier or open-source offer on the product page.
- **Depot** — no free plan, a 7-day trial only; open source is a
  discount by request ("contact us"), not a published program.
- **Namespace** — a 30-day trial, no ongoing free tier, no open-source
  program documented.
- **Semaphore** — "$15 free credits per month" against macOS at $0.09/min,
  so roughly 165 macOS minutes if macOS may draw on them at all, no
  open-source program, and whether its macOS machines are Apple silicon
  is not stated.
- **WarpBuild** — macOS is cloud-only by Apple licensing, but the docs
  path 404s, so labels, free tier and any open-source program could not
  be established.
- **Xcode Cloud** — "Xcode Cloud requires Apple Developer Program
  membership", a paid annual subscription, and it is Xcode-project shaped
  with no Linux leg.

## Ruled out on hosted-only, on having no macOS, or on availability

- **RunsOn** — ephemeral runners "in your own AWS account", and its
  supported images are Linux and Windows only, no macOS.
- **Actuated** — "bring your own servers, install our agent"; self-hosted
  by design, no macOS platform documented.
- **MacStadium** — dedicated Apple hardware rental with Orka
  virtualization, not a hosted CI product; you would bring your own CI and
  own the runner, which is the hazard this constraint exists to avoid.
- **AppVeyor** — a real free tier for unlimited public projects, but macOS
  appears only in the self-hosted context.
- **Travis CI** — "Travis CI will stop support for macOS starting March
  31st, 2025", and its documented macOS images are Intel-only.
- **Cirrus CI** — `cirrus-ci.org` returned NXDOMAIN on 2026-07-25 while
  `cirrus-ci.com` and `cirrus-runners.app` resolved, and the docs
  repository is not archived. The service's status could not be
  established from a primary source, so it cannot be relied on.

## Which providers publish an explicit open-source program

Relevant because a program is a grant that can be declined, capped or
withdrawn, where a policy is not.

| Provider | Program | Application | Renewal | macOS covered |
|---|---|---|---|---|
| GitHub Actions | none needed; free for all public repos | none | n/a | yes, standard runners |
| CircleCI | open-source plan | none; automatic for public repos on the Free plan | n/a | yes, 25,000–30,000 credits |
| GitLab | GitLab for Open Source | yes, hard eligibility criteria | annual | yes, explicitly named |
| Blacksmith | open-source program | yes, form and review | not stated | grant size not published |
| Buildkite | "free for open source", by conversation | yes, contact | not stated | unverified, likely not |
| Codemagic | none; free minutes are for Personal accounts | n/a | n/a | yes, but org accounts at risk |

## The later Windows CPU-only leg

Staying on GitHub Actions does not constrain the Windows leg, because
hosted Windows is standard and therefore inside the same free-and-unlimited
policy as macOS and Linux. `windows-latest` resolves to Windows Server
2025, and public repositories get 4 vCPU and 16 GB there.

The Windows constraint that does exist is Odin's, not the provider's.
Release `dev-2026-07a` publishes `odin-windows-amd64-…zip` and no
windows-arm64 asset at all, so the leg targets `windows-latest` (x64)
rather than the free `windows-11-arm` runner; an arm64 Windows leg would
mean a source build or emulation. Odin on Windows needs "the MSVC compiler
and windows SDK from the 'Desktop development with C++' component", and the
`windows-2025` image ships Visual Studio Enterprise 2022 (17.14) with the
Windows 11 SDK 26100, so the prerequisite is already met.

Moving CI to a provider whose Windows offering is thinner, or absent, is
the way this choice could go wrong, which makes "does the provider host
Windows too, for free, on a public repo" a screening question rather than a
footnote.

## Mixing providers

Splitting the matrix, GitHub Actions for Linux and Windows and something
else for macOS, is mechanically supported but costs more than it looks.

- **It works.** External services mark commits through the commit status
  API, and a ruleset can require those checks: "You can use the commit
  status API to allow external services to mark commits with an appropriate
  status."
- **Bootstrapping is order-dependent.** A check cannot be made required
  until it has reported at least once. The app "must be installed in the
  repository with the `statuses:write` permission, must have recently
  submitted a check run, and must be associated with a pre-existing
  required status check in the ruleset."
- **Source pinning is a real setting.** If a required check is pinned to a
  specific app, "If the status is set by any other person or integration,
  merging won't be allowed"; choosing "any source" hands the gate to
  anything that can write a status of that name.
- **It widens the trust boundary.** A second provider means a third-party
  GitHub App with `statuses:write` on a public repository, plus that
  provider's own read access to the source. For a repo whose whole posture
  is a policed boundary and a closed contribution model, that is a
  deliberate addition, not a free one.
- **It splits the gate.** `just check` is one composition gate; running
  half of it on infrastructure with a different image lifecycle means two
  places to debug a red main and two changelogs to track.

## How the options rank against the stated constraints

Analysis, not a decision. Against hosted-only, zero-budget, macOS arm64 plus
Linux x86-64 now and hosted Windows later, the constraints are unusually
decisive:

1. Zero budget plus hosted-only removes every provider without a free
   public-repo tier that includes Apple silicon, which is most of them.
2. **"On every commit" is what separates the survivors.** A capped grant
   has to cover the whole month's commits. Take a 5-minute macOS job as
   the working figure: CircleCI's 125 to 150 minutes and Blacksmith's
   roughly 150 buy about 25 to 30 runs a month, and Codemagic's 500 buy
   about 100. Those are budgets for a release cadence, not for a gate that
   fires on every push. GitHub's unlimited standard-runner policy and, at
   the far end of the estimate, GitLab's program grant are the only two
   that survive the arithmetic.
3. Of what survives, only a provider that also hosts Windows for free
   avoids re-opening the question at the Windows spec. CircleCI bundles
   Windows into the same small macOS credit pool, Buildkite has no hosted
   Windows at all, and Codemagic gates Linux and Windows behind billing.
4. A free tier that must be applied for, and can therefore be declined or
   withdrawn, is a weaker guarantee than one that is policy for all public
   repositories with no application at all. GitLab's is the sharpest case:
   real macOS capacity, but an annual re-application, hard eligibility
   criteria, no support, beta runners, and a second forge to mirror into.

GitHub Actions is the only option that clears all four without
qualification, and it clears them by policy rather than by grant. The
honest counter-argument is concentration: repo hosting, issue tracker,
Pages for the course repo, and CI all rest on one vendor, so one
acceptable-use action would take out the lot. Against that, every
alternative that could act as a hedge is either paid, capped roughly two
orders of magnitude below the requirement, or a different forge. That is a
risk to name, not a number to compare.

## What this does not settle

- **Which macOS label to pin.** `macos-latest` migrates on GitHub's
  schedule, and the `-latest` migration "is gradual and happens over 1-2
  months". Against determinism by construction
  ([D1](../decisions/D001-determinism-by-construction.md)) and golden
  world hashes, a silently moving image is a hazard; `macos-26` pins the
  OS but still moves within the image's own release train. This is a
  maintainer call about how much image drift the hash gates tolerate.
- **Tarball or Homebrew for the Odin toolchain.** Both work on the image.
  Odin's own docs treat package-manager builds as third-party.
- **Whether 14 GB of macOS disk survives S01.** It is enough for an Odin
  toolchain today; a vendored wgpu/SDL3 build plus caches is untested.
- **Whether 90 days of artifact retention is enough** for whatever S00 and
  later specs want to keep from a run. Public repositories cannot raise it.
- **Whether to hedge with a second provider at all**, given the
  concentration risk above and the trust-boundary cost of mixing.

## Unverified

- Whether GitHub Actions **artifact storage** is separately billed on a
  public repository. The docs state free *usage*/minutes for public
  repositories and detail the artifact and cache storage quotas only for
  private ones; no page found says explicitly that artifact storage is free
  on public repos.
- Whether GitHub publishes any **queue-time or availability commitment**
  for macOS runners. No SLA or queueing statement was found in the docs for
  free public-repository usage.
- Whether the concurrency table's plan rows are read from the **repository
  owner's** plan in all cases. The `svswengine` organization is on the
  `free` plan, so the Free row applies either way here.
- **How GitLab's open-source cost factor of 0.5 composes with the macOS
  cost factor of 6.** The two tables never state the interaction, and the
  readings differ by a factor of two on the resulting macOS ceiling.
- **GitLab's macOS concurrency cap.** Not published on either page.
- **CircleCI's exact macOS open-source credit figure.** The same page says
  30,000 in its body and 25,000 in its FAQ.
- **CircleCI's macOS clang/LLVM version and whether the command-line tools
  are a separately installed package.** Not in the image manifest read.
- **What Blacksmith's open-source program actually grants**, and its
  free-tier concurrency.
- **Whether Buildkite's open-source Pro grant includes hosted Mac
  minutes.** Mac is pay-as-you-go even on Pro, so the default reading is
  that it does not, but no page says either way.
- **Whether an organization-owned public repo qualifies for Codemagic's 500
  free minutes**, given the "personal and hobby projects on Personal
  accounts" wording.
- **WarpBuild's labels, free tier and open-source program.** Its docs
  path 404s.
- **Whether Semaphore's macOS machines are Apple silicon.**
- **Per-job timeout and artifact retention for CircleCI, Buildkite, GitLab
  macOS and Blacksmith.** Not stated on the pages read.
- **Whether the drop-in vendors register as GitHub self-hosted runners.**
  This is the question issue #2 already flagged as deciding, and it still
  could not be answered from a primary source: Cirrus Runners' own pages
  describe a "drop-in replacement" needing "a single line change" without
  naming the registration model. Under a zero budget it is moot, since
  every drop-in vendor is paid, but it would return the moment one is
  considered.
- **Cirrus CI's service status.** `cirrus-ci.org` does not resolve; no
  primary source explains why.

## Sources

All checked 2026-07-25. Primary sources only: provider documentation,
provider pricing pages, official changelogs, official image manifests. No
third-party comparison tables, blog posts or forum answers were used.

One caveat on method. Pages were fetched through a tool that renders them
to text before extraction, so a quoted string is what that renderer
returned from the page rather than a byte-for-byte transcript. Every
load-bearing free-tier and exclusion claim was re-fetched with a
quote-only prompt, but a maintainer acting on a specific figure should
open the page. Pricing and runner availability move, which is why the
check date is on every claim.

### GitHub

- <https://docs.github.com/en/actions/reference/runners/github-hosted-runners>
  — "free and unlimited on public repositories"; the standard runner
  labels and their vCPU/RAM/storage for public versus private repos.
- <https://docs.github.com/en/actions/concepts/billing-and-usage> —
  "GitHub Actions usage is free for standard GitHub-hosted runners in
  public repositories."
- <https://docs.github.com/en/billing/concepts/product-billing/github-actions>
  — included minutes per plan for private repositories; larger runners are
  always charged.
- <https://docs.github.com/en/billing/reference/actions-minute-multipliers>
  — the per-minute SKU table including `macos_l` and `macos_xl`; "The
  larger runners are not free for public repositories."
- <https://docs.github.com/en/actions/reference/limits> — job concurrency
  by plan, the 5-concurrent-macOS cap, the 6-hour job limit, the 35-day
  workflow limit.
- <https://docs.github.com/en/github/administering-a-repository/configuring-the-retention-period-for-github-actions-artifacts-and-logs-in-your-repository>
  — 90-day default retention; 1 to 90 days for public repositories against
  1 to 400 for private.
- <https://docs.github.com/en/actions/reference/dependency-caching-reference>
  — the 10 GB per-repository cache limit and its eviction policy.
- <https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features>
  — Actions acceptable use, and GitHub's enforcement options.
- <https://docs.github.com/en/actions/reference/security/secure-use> —
  self-hosted runners "should almost never be used for public repositories".
- <https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/add-runners>
  — the fork pull-request hazard on self-hosted runners.
- <https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches>
  — the commit status API as the route for external services.
- <https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets>
  — required status check sources, `statuses:write`, and source pinning.
- <https://github.com/actions/runner-images> — image-to-label mapping,
  current `-latest` targets, the gradual `-latest` migration window.
- <https://raw.githubusercontent.com/actions/runner-images/main/images/macos/macos-26-arm64-Readme.md>
  and the `macos-15-arm64`, `Ubuntu2404` and `Windows2025` readmes in the
  same tree — Homebrew, Xcode command-line tools, Clang/LLVM, Rust, CMake,
  Ninja and Visual Studio versions.
- <https://github.blog/changelog/2024-01-30-github-actions-introducing-the-new-m1-macos-runner-available-to-open-source/>
  — "free in public repositories"; 3 vCPU, 7 GB RAM, 14 GB storage.
- <https://github.blog/changelog/2025-08-07-arm64-hosted-runners-for-public-repositories-are-now-generally-available/>
  — arm64 hosted runners generally available to public repositories at no
  cost.
- <https://github.blog/changelog/2026-02-26-macos-26-is-now-generally-available-for-github-hosted-runners/>
  — the `macos-26`, `macos-26-intel`, `macos-26-large` and
  `macos-26-xlarge` labels.
- <https://api.github.com/orgs/svswengine> — the `svswengine` organization
  is on the `free` plan, which selects the concurrency row that binds.

### Toolchain

- <https://odin-lang.org/docs/install/> — supported LLVM versions 17 to
  22, the macOS command-line tools requirement, the Windows MSVC and SDK
  requirement, and the caveat that package-manager builds "are configured
  by third-parties and may be flawed".
- <https://api.github.com/repos/odin-lang/Odin/releases/latest> — release
  `dev-2026-07a` assets, including `odin-macos-arm64` and
  `odin-linux-amd64` and the absence of any windows-arm64 asset.
- <https://formulae.brew.sh/api/formula/odin.json> and
  <https://formulae.brew.sh/api/formula/just.json> — formula versions and
  published arm64 bottles.
- <https://crates.io/api/v1/crates/naga-cli> — `naga-cli` 30.0.0 is
  source-only, installed with `cargo install`.

### Other providers

- <https://circleci.com/docs/guides/plans-pricing/credits/> — the 400,000
  Linux and 25,000/30,000 macOS open-source credit figures, the automatic
  public-repo enablement, the 2-concurrent-job macOS cap, and the
  25,000-credits-for-$15 conversion.
- <https://circleci.com/changelog/free-plan-default-macos-resource-class-changes-to-m4pro-medium-on-november/>
  — free-plan macOS default moving to `m4pro.medium`, and M1/M2 end of
  life.
- <https://circleci.com/docs/guides/execution-managed/using-macos/>,
  <https://circleci.com/product/features/resource-classes/>,
  <https://circleci.com/open-source/>, <https://circleci.com/pricing/> —
  resource classes, credit rates, the open-source plan's bundled
  macOS/Windows pool.
- <https://circleci.com/docs/guides/test/testing-ios/> — Homebrew is
  preinstalled on CircleCI macOS.
- <https://docs.blacksmith.sh/blacksmith-runners/overview> — labels, the
  3,000 free x64 minutes, the 20x macOS conversion, and the statement that
  the macOS images follow GitHub's.
- <https://www.blacksmith.sh/pricing> — per-minute rates and the
  open-source program.
- <https://codemagic.io/pricing/> and
  <https://docs.codemagic.io/getting-started/faq/> — 500 free macOS M2
  minutes, 1 parallel build, and the "personal and hobby projects on
  Personal accounts" restriction.
- <https://docs.codemagic.io/yaml-basic-configuration/yaml-getting-started/>
  — `instance_type` values and which are billing-gated.
- <https://docs.gitlab.com/ci/runners/hosted_runners/macos/> — the macOS
  runner tags and images, the Premium/Ultimate/open-source-programs gate,
  and beta status.
- <https://docs.gitlab.com/ci/pipelines/compute_minutes/> — the
  cost-factor table, macOS at 6 and public open-source projects at 0.5.
- <https://about.gitlab.com/solutions/open-source/join/> — the 50,000
  compute minutes, eligibility criteria, annual renewal, and no support.
- <https://docs.gitlab.com/ci/runners/hosted_runners/windows/> — hosted
  Windows in the Free tier.
- <https://gitlab-org.gitlab.io/ci-cd/shared-runners/images/macos-image-inventory/macos-26-xcode-26/>
  — Homebrew 5.1.15, the Xcode command-line tools package, Clang 21.0.0.
- <https://buildkite.com/pricing> — the plan table showing macOS as
  unavailable on the free plan, the pay-as-you-go Mac rate, and the
  open-source offer by contact.
- <https://buildkite.com/docs/agent/buildkite-hosted/macos> and
  <https://buildkite.com/docs/pipelines/hosted-agents> — instance shapes,
  preinstalled Homebrew formulae, and "Buildkite offers both Linux and
  macOS hosted agents".
- <https://bitrise.io/pricing> — the free plan's Linux Medium machine and
  the Starter plan price that Apple silicon starts at.
- <https://cirrus-runners.app/> — $150 per month per concurrent runner,
  M4 Pro macOS, no free tier or open-source offer.
- <https://depot.dev/pricing> and
  <https://depot.dev/docs/github-actions/runner-types> — no free plan,
  trial only, open source by request; the `depot-macos-*` labels.
- <https://namespace.so/pricing> and
  <https://namespace.so/docs/features/faster-github-actions> — 30-day
  trial, no ongoing free tier.
- <https://semaphore.io/pricing> — the $15 monthly credit and the macOS
  per-minute rate.
- <https://www.warpbuild.com/products/ci/macos-runners> — macOS is
  available only through WarpBuild Cloud, by Apple's licensing.
- <https://developer.apple.com/xcode-cloud/> — the included compute hours
  and the Apple Developer Program membership requirement.
- <https://www.macstadium.com/pricing> — dedicated hardware rental
  pricing.
- <https://www.appveyor.com/pricing/> — the free tier for public projects
  and the self-hosted framing of macOS.
- <https://runs-on.com/> — runners in your own AWS account; Linux and
  Windows images only.
- <https://actuated.com/> — bring your own servers.
- <https://docs.travis-ci.com/user/reference/osx/> — macOS support ended
  2025-03-31; Intel-only images.
