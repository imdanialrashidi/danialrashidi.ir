# Plan 005: Add an affected-file verification route for the product slice

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git status --short -- .pi/verification.json scripts/project-verify.sh scripts/verify-affected.mjs`
> plus `git diff --stat fb90779..HEAD -- .pi/verification.json`.
> NOTE: the product slice is currently uncommitted, so `git diff` against the
> planned-at SHA may be empty even when files exist. Rely on `git status` and
> compare the "Current state" excerpts below against the live code before
> proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/002-site-tests-in-verify-gate.md (this route's commands should mirror the gate plan 002 creates; if 002 has not landed, still proceed but read the note in Step 1)
- **Category**: dx
- **Planned at**: commit `fb90779`, 2026-10-07

## Why this matters

`.pi/verification.json` routes every known file pattern to its cheapest
verification command (`scripts/verify-affected.mjs --file <path>`). Today it
has routes only for template-harness files — nothing covers `src/**`,
`tests/site-structure.test.mjs`, `astro.config.mjs`, or `public/**`. Any
product change therefore falls through to the full fallback (`pi-doctor` +
typecheck + build), which is both slower than needed and, worse, blind to the
content contract. A product route makes the documented verification path
(`node scripts/verify-affected.mjs --file src/...`) actually work for the code
that changes most.

## Current state

The relevant files, each with one line on its role:

- `.pi/verification.json` — route table (`version: 1`, `routes[]`, `fallback`); commands are argv arrays
- `scripts/verify-affected.mjs` — the router that matches `--file` against `include` globs
- `scripts/project-verify.sh` — canonical gate; plan 002 adds the site tests to it

Excerpts as they exist today (route shape to copy — the `safety-guard` entry):

```json
// .pi/verification.json (shape exemplar)
{
  "id": "safety-guard",
  "include": [".pi/extensions/safety-guard.js", ".pi/mcp.json", "scripts/pi-sandbox.sh", "tests/safety-guard.test.mjs"],
  "commands": [
    ["node", "--test", "tests/safety-guard.test.mjs"]
  ]
}
```

```json
// .pi/verification.json:63-67 (fallback — must remain the last-resort entry, untouched)
"fallback": [
  ["bash", "scripts/verify.sh"]
]
```

Repo conventions that apply: `include` entries are repo-relative paths or
`**` globs (see existing routes, e.g. `"evals/**"`); `commands` are argv
arrays, not shell strings; route `id`s are kebab-case. Match all three.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Router self-test | `node --test tests/verify-affected.test.mjs` | pass, exit 0 |
| Route dry-run | `node scripts/verify-affected.mjs --file src/pages/index.astro --plan` | prints the new route's commands without executing |
| Full suite (regression) | `npm test` | all pass, exit 0 |

Read `scripts/verify-affected.mjs --help` (or its header comment) first if the
`--plan` flag semantics are unclear — the flag must only print, never execute.

## Scope

**In scope** (the only files you should modify):

- `.pi/verification.json` (append one route object to `routes[]`)

**Out of scope** (do NOT touch, even though they look related):

- `scripts/verify-affected.mjs` and its test — router logic is correct; only data changes.
- `scripts/project-verify.sh` — owned by plan 002.
- `scripts/verify.sh` / the `fallback` entry — the fallback must keep catching everything else.
- Any existing route entry — append only; reordering risks changing match priority.

## Git workflow

- Work in the current worktree on top of existing changes. Do NOT commit, push,
  or open a PR — the owner handles delivery via the `ai-changes` lane.
- Leave the change as an uncommitted worktree modification and report it.

## Steps

### Step 1: Append the product-slice route

Add one entry at the END of the `routes` array in `.pi/verification.json`
(after the last existing route, before `fallback`):

```json
{
  "id": "persian-site",
  "include": ["src/**", "tests/site-structure.test.mjs", "tests/support-card.test.mjs", "astro.config.mjs", "public/**", "scripts/project-verify.sh", "scripts/qa-screenshots.mjs"],
  "commands": [
    ["node", "--test", "tests/site-structure.test.mjs", "tests/support-card.test.mjs"],
    ["bash", "scripts/project-verify.sh"]
  ]
}
```

Notes (apply carefully, do not improvise beyond them):

- If plan 002 has NOT landed yet, `project-verify.sh` still runs typecheck +
  build without the site tests — the route is still correct (the first command
  covers the tests explicitly). State in your report whether 002 had landed.
- If plan 004's `tests/support-card.test.mjs` does not exist yet, OMIT it from
  both `include` and `commands` (a route referencing a missing file is worse
  than a narrower route) and note the omission in your report.
- Keep JSON valid: trailing commas, quote style, and 2-space indent must match
  the file. Validate with `node -e "JSON.parse(require('fs').readFileSync('.pi/verification.json','utf8')); console.log('json ok')"` — note this file has no
  comments, so plain `JSON.parse` suffices.

**Verify**: the `JSON.parse` check prints `json ok`; `git diff` of the file
shows exactly one added route object, nothing else.

### Step 2: Prove the router selects the new route

Run `node scripts/verify-affected.mjs --file src/pages/index.astro --plan` →
output must reference the `persian-site` route / its commands (NOT the
fallback). Repeat with `--file tests/site-structure.test.mjs` → same route.
Repeat with an unrelated harness file (e.g. `--file p`) → must NOT match
`persian-site` (guards against an over-broad glob swallowing other routes).

**Verify**: `node --test tests/verify-affected.test.mjs` → pass, exit 0 (router
self-test still green with the new data), then `npm test` → exit 0.

## Test plan

No new test: the router's own suite (`tests/verify-affected.test.mjs`)
covers matching semantics, and Step 2 exercises the new data through the real
router in `--plan` (dry-run) mode plus the self-test suite. Adding a test that
hard-codes the new route's `include` list would duplicate config, not behavior.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `.pi/verification.json` parses as JSON
- [ ] `--file src/pages/index.astro --plan` selects `persian-site`, not the fallback
- [ ] `--file tests/site-structure.test.mjs --plan` selects `persian-site`
- [ ] `--file p --plan` does NOT select `persian-site`
- [ ] `node --test tests/verify-affected.test.mjs` exits 0; `npm test` exits 0
- [ ] Diff of `.pi/verification.json` is exactly one added route object
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The file shape differs from the excerpt (different `version`, route schema,
  or matching semantics in `verify-affected.mjs`) — the appended route may not
  mean what this plan assumes.
- `--plan` executes commands instead of printing them — stop immediately and
  report; never let a dry-run flag run the build.
- A glob in the new route shadows an existing route's files (e.g. `p` matches
  `persian-site`) — the `include` list is too broad; report rather than
  reordering existing routes to compensate.

## Maintenance notes

For the human/agent who owns this code after the change lands:

- If `scripts/project-verify.sh` gains/removes test files, mirror the change
  in this route's `commands` — the two are meant to stay equivalent for
  product files.
- New product test files belong in BOTH `include` and the `node --test`
  command (see Step-1 note re plan 004).
- A reviewer should check only: valid JSON, appended (not reordered), and the
  three `--plan` probes in Done criteria.
