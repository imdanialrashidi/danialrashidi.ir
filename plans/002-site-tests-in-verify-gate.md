# Plan 002: Run the site-structure tests in the canonical verify gate

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git status --short -- scripts/project-verify.sh package.json`
> plus `git diff --stat fb90779..HEAD -- scripts/project-verify.sh package.json`.
> NOTE: the product slice is currently uncommitted, so `git diff` against the
> planned-at SHA may be empty even when files exist. Rely on `git status` and
> compare the "Current state" excerpts below against the live code before
> proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `fb90779`, 2026-10-07

## Why this matters

`tests/site-structure.test.mjs` (6 tests) guards the entire Persian-site
content contract: all routes exist, exactly the five real projects ship with
required fields and real images, travel notes are complete, no payment data is
invented, and the RTL/SEO foundation holds. But `scripts/project-verify.sh` —
the canonical gate executed by `scripts/verify.sh` and therefore by every full
verification — runs only `typecheck` + `build`. The content tests run nowhere
in any gate: a broken frontmatter field or deleted image still ships green.
Adding one line to the gate closes the hole for every future change.

## Current state

The relevant files, each with one line on its role:

- `scripts/project-verify.sh` — canonical project gate (typecheck + build today)
- `package.json` — `test` script runs `node --test tests/` (whole `tests/` dir)
- `scripts/verify.sh` — generic entrypoint; `exec`s `project-verify.sh` when executable, so anything after that line never runs for this repo

Excerpts as they exist today:

```bash
# scripts/project-verify.sh (entire file)
#!/usr/bin/env bash
set -Eeuo pipefail
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
npm run typecheck
npm run build
```

```json
// package.json (scripts excerpt)
"test": "node --test tests/",
"verify:fast": "npm run typecheck",
"verify:feature": "npm run typecheck && npm run build"
```

Repo conventions that apply: shell scripts use `set -Eeuo pipefail`,
`ROOT_DIR` resolution, and one command per line (see `scripts/verify.sh`).
The gate must stay fail-fast: with `set -e`, a failing test step aborts before
`build`, which is the desired ordering (cheap static checks first).

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Site tests only | `node --test tests/site-structure.test.mjs` | 6 pass, exit 0 |
| Canonical gate | `bash scripts/project-verify.sh` | exit 0; output contains TAP for the site tests |
| Full suite (regression) | `npm test` | all pass, exit 0 |

## Scope

**In scope** (the only files you should modify):

- `scripts/project-verify.sh` (add the site-test invocation)

**Out of scope** (do NOT touch, even though they look related):

- `scripts/verify.sh` — generic template entrypoint; already delegates correctly.
- `.pi/verification.json` — owned by plan 005.
- `tests/site-structure.test.mjs` — owned by plans 003/007; do not edit here.
- `package.json` scripts — no new script needed; call `node --test` directly so the gate does not depend on script naming.

## Git workflow

- Work in the current worktree on top of existing changes. Do NOT commit, push,
  or open a PR — the owner handles delivery via the `ai-changes` lane.
- Leave the change as an uncommitted worktree modification and report it.

## Steps

### Step 1: Add the site-structure test run to the gate

Edit `scripts/project-verify.sh` so the test suite runs between typecheck and
build (cheap checks first, expensive build last):

```bash
#!/usr/bin/env bash
set -Eeuo pipefail
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
npm run typecheck
node --test tests/site-structure.test.mjs
npm run build
```

Use the file-scoped invocation (`tests/site-structure.test.mjs`), NOT bare
`npm test`: the full `tests/` directory contains template-harness tests
unrelated to the product gate, and the gate must stay fast and product-scoped.
(Any future product test file should be added here by name; see maintenance
notes.)

**Verify**: `node --test tests/site-structure.test.mjs` → `pass 6`, `fail 0`.

### Step 2: Prove the gate actually executes the tests (fail-fast check)

First run the gate green: `bash scripts/project-verify.sh` → exit 0, and its
output contains the `persian editorial slice` TAP block (proves the tests ran
inside the gate, not just that the script exited).

Then prove fail-fast with a controlled, reverted mutation:

1. Temporarily break one assertion (e.g. in `tests/site-structure.test.mjs`,
   change one expected filename — do NOT commit this).
2. Run `bash scripts/project-verify.sh` → must exit NONZERO and must NOT reach
   the build step (no `astro build` output / no `dist/` rewrite).
3. Revert the temporary breakage immediately and re-run the gate green.

**Verify**: gate exits 0 clean; exits nonzero on the temporary breakage without
building; final `git status --short` shows only `scripts/project-verify.sh`
(plus pre-existing worktree changes) — the temporary breakage is fully reverted.

## Test plan

No new test file: the gate reuses the existing 6 site-structure tests. The
Step-2 controlled mutation (break → red → revert → green) is the
defect-sensitivity evidence for the gate wiring itself.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `bash scripts/project-verify.sh` exits 0 and its output contains `persian editorial slice` with `pass 6`
- [ ] Controlled-mutation check performed: gate exited nonzero on broken test without running `astro build`, then returned to green after revert
- [ ] `npm test` (full suite) still exits 0
- [ ] No files outside the in-scope list are modified (`git status --short`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `scripts/project-verify.sh` does not match the excerpt (already extended or restructured) — the insertion point may be wrong.
- `node --test tests/site-structure.test.mjs` fails on the untouched tree — the gate cannot go green; report the failing test instead of editing tests to fit.
- The temporary breakage in Step 2 still builds (i.e. `set -e` is not effective, script was rewritten without it) — do not "fix" by restructuring the script beyond the one added line; report.

## Maintenance notes

For the human/agent who owns this code after the change lands:

- When a new product test file is added under `tests/` (e.g. plan 004's
  `tests/support-card.test.mjs`), append it to this gate by name on its own
  line. Deliberately NOT `node --test tests/`: that would pull template-harness
  tests into the product gate.
- Plan 005 adds a `.pi/verification.json` affected-file route whose commands
  should mirror this gate; if this file changes, update that route too.
- A reviewer should scrutinize only ordering (typecheck → tests → build) and
  that the invocation is file-scoped.
