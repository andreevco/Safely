# Dependency advisory gate

`scripts/audit-gate.mjs` runs `pnpm audit` over the pinned pnpm graph and fails only on findings
nobody has reviewed. Reviewed ones live in
[`dependency-advisories.json`](./dependency-advisories.json) as owned, expiring exceptions, so a PR
is never asked to fix an unrelated vulnerability and a new critical or high advisory cannot hide
inside the backlog. Thresholds are in the registry's `policy` block, not in the script.

It runs on every PR to `master` and `release/**` (the `dependency-advisories` job in `ci.yml`) and
as `pnpm dependencies-audit` locally, under the same policy. Nothing runs on a schedule. JavaScript graph
only: the iOS and Android graphs are produced by `expo prebuild` on EAS and are not scanned.

## Verdicts

| Verdict      | Meaning                                                              | Blocks                    |
| ------------ | -------------------------------------------------------------------- | ------------------------- |
| `NEW`        | critical or high advisory with no exception recorded                  | always                    |
| `EXPIRED`    | the exception's `expires` date has passed                             | always                    |
| `STALE`      | the exception matches no advisory in the graph                         | always                    |
| `ESCALATED`  | the advisory is more severe than the exception records                 | when now critical or high |
| `CONTEXT`    | recorded as `dev`/`build`, but the package is in the production graph  | when now critical or high |
| moderate/low | no exception recorded                                                 | never                     |

Moderate and low are listed in the report but never block, so a future escalation is not a surprise.
Non-blocking `ESCALATED` and `CONTEXT` land under "Needs attention" and leave the exit code alone.
`STALE` usually comes paired with a dead `overrides` entry in `pnpm-workspace.yaml` — drop both.

Nothing warns before `expires`: an exception is accepted that day and blocking the next, and with
no scheduled run it surfaces on whichever PR happens to be open — which is why the failure line
prints `owner`.

Exit codes: `0` clean, `1` blocking findings, `2` malformed registry or npm unreachable after three
retries. A run that could not scan the graph fails rather than passing quietly.

## Recording an exception

When a fixed release exists, prefer an `overrides` entry in `pnpm-workspace.yaml`: it removes the
advisory instead of accepting it. An override changes the resolved graph for the whole workspace,
so it ships only after a mobile build and release testing. Exceptions are written by hand — there
is no generator.

```json
{
    "id": "GHSA-xxxx-xxxx-xxxx",
    "package": "some-pkg",
    "severity": "high",
    "context": "build",
    "paths": ["apps/mobile > react-native > @react-native/dev-middleware > some-pkg"],
    "rationale": "Metro dev middleware, not part of the release bundle; reachable only under `expo start`.",
    "owner": "sergey@andreevco.com",
    "expires": "2026-11-30",
    "url": "https://github.com/advisories/GHSA-xxxx-xxxx-xxxx"
}
```

Everything except `paths` and `url` is required and validated; a malformed registry exits 2 before
the audit runs.

- **`context`** — where the affected code runs: `runtime` (the shipped wallet), `build` (bundler,
  native tooling), `dev` (tests, linters, scripts), `rn-dev` (development-only code that ships as a
  production dependency of react-native or expo but is absent from release bundles). `build` and
  `dev` claim the package is outside the production graph and the gate re-checks that on every run
  (`CONTEXT`); `rn-dev` concedes it is inside, so it rests entirely on its rationale.
- **`rationale`** — the trigger condition that is not met. A dependency path is not a rationale.
- **`expires`** — when the claim must be re-argued, not when a fix is promised. By convention 30
  days for `runtime`, 90 for the rest.
- **`owner`** — who re-argues it.

## Commands

```bash
pnpm dependencies-audit                           # what CI runs
pnpm audit --audit-level high                     # the raw pnpm report behind it
node scripts/audit-gate.mjs --markdown report.md  # also write the report to a file
node scripts/audit-gate.mjs --input audit.json    # replay a saved `pnpm audit --json` payload
```

## Dependabot

[`.github/dependabot.yml`](../.github/dependabot.yml) and Dependabot alerts find and upgrade; this
gate is the only thing that blocks. Alerts know nothing about the registry, so an advisory accepted
here still shows as an open alert: treat the Security tab as an inbox, answer an alert with an
override or an exception, then dismiss it pointing at whichever landed.

Most of the backlog is transitive under `expo` and `react-native`, and the config ignores that
surface because the Expo SDK moves as one unit — Dependabot will report those advisories but
cannot propose a fix for them. They stay manual `overrides` entries.
