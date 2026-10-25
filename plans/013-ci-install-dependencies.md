# Plan 013: Make the quality workflow install dependencies before running the gate

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 1754f74..HEAD -- .github/workflows/quality.yml`
> If the file changed since this plan was written, compare the "Current state"
> excerpt against the live file before proceeding; on a mismatch, treat it as
> a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `1754f74`, 2026-10-21

## Why this matters

The canonical quality gate has failed on every run since 2026-10-07 — eight
consecutive `quality` runs, with the last green run on 2026-10-06. The
GitHub Actions runner starts with no `node_modules`, and
`.github/workflows/quality.yml` runs `bash scripts/verify.sh` without an
install step. The gate therefore dies at the first command with
`sh: 1: astro: not found` and exit code 127. The deploy workflow already
installs dependencies, which is why the site deploys while its quality gate
fails. Fixing this is the prerequisite for trusting every other verification
claim in this repository.

## Current state

`./.github/workflows/quality.yml` (the only workflow that runs the gate):

```yaml
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Run verification gate
        run: bash scripts/verify.sh
```

`./scripts/project-verify.sh` (what the gate executes) begins with:

```bash
npm run typecheck
node --test tests/site-structure.test.mjs tests/support-card.test.mjs tests/nav.test.mjs
npm run build
```

The deploy workflow is the working exemplar — it installs before it builds:

```yaml
      - name: Install dependencies
        run: npm ci
```

Evidence that the current quality run fails:

- GitHub Actions run `39129502881` on commit `1754f74` (branch `main`)
  completed with `failure`.
- Its log ends with:
  `> astro check` → `sh: 1: astro: not found` →
  `##[error]Process completed with exit code 127`.
- A clean copy of this worktree, after `npm ci`, passes
  `bash scripts/verify.sh` end to end (typecheck, 17 tests, build, 13 pages).

The repository has `package.json` + `package-lock.json`; `npm ci` is the
correct reproducible install. Node 22 is already selected by the workflow.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install (local) | `npm ci` | exit 0 |
| Typecheck | `npm run typecheck` | exit 0 (`astro check`, 0 errors) |
| Tests | `npm test` | 17 pass |
| Build | `npm run build` | exit 0, 13 pages + `sitemap-index.xml` |
| Full gate | `bash scripts/verify.sh` | exit 0 |
| Inspect workflow | `sed -n '20,40p' .github/workflows/quality.yml` | install step before gate |

## Scope

**In scope** (the only file you should modify):

- `.github/workflows/quality.yml`

**Out of scope** (do NOT touch, even though they look related):

- `scripts/verify.sh` — the local gate is not the CI install step; changing
  it would hide the problem for local users and duplicate CI policy.
- `scripts/project-verify.sh` — already correct.
- `.github/workflows/deploy.yml` — already installs dependencies correctly.
- `package.json` / `package-lock.json` — do not run `npm install`, do not
  regenerate the lockfile. If `npm ci` fails, that is a STOP condition.

## Git workflow

- Leave the change in the working tree. Do **not** commit, push, create a
  branch, or open a PR. The repository's solo default is explicit in
  `docs/GIT_POLICY.md`; delivery is a separate owner action.
- The owner will see the first real CI result on the next push. The local
  clean-copy run below is the proof available before delivery.

## Steps

### Step 1: Cache npm in the Node setup step

In `.github/workflows/quality.yml`, extend the existing `setup-node` step:

```yaml
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
```

`cache: npm` uses `package-lock.json` by default. Do not add a
`cache-dependency-path`; the lockfile is at the repository root.

**Verify**: `grep -n "cache: npm" .github/workflows/quality.yml` → prints one
line inside the `Set up Node` step.

### Step 2: Install dependencies before the gate

Immediately after the `Set up Node` step and before
`- name: Run verification gate`, add:

```yaml
      - name: Install dependencies
        run: npm ci
```

The resulting order must be: Checkout → Set up Node → Install dependencies →
Run verification gate. `npm ci` (not `npm install`) is deliberate: it respects
the committed lockfile and fails if the manifest and lockfile drift.

**Verify**:

```bash
sed -n '21,40p' .github/workflows/quality.yml
```

Expected: the four steps appear in the order above, with `run: npm ci` before
`run: bash scripts/verify.sh`.

### Step 3: Prove the fix on a clean copy

Run the same sequence a GitHub runner would, from a copy that has no
`node_modules`, `dist`, or `.astro` directory. Keep `.git` in the copy: the
`site-structure.test.mjs` suite calls `git ls-files` for the `target=_blank`
scan.

```bash
rm -rf /tmp/danialrashidi-ci-check
mkdir -p /tmp/danialrashidi-ci-check
tar -cf - --exclude=node_modules --exclude=dist --exclude=.astro --exclude=.artifacts . \
  | tar -xf - -C /tmp/danialrashidi-ci-check
cd /tmp/danialrashidi-ci-check
npm ci
bash scripts/verify.sh
```

**Verify**: `npm ci` exits 0; `bash scripts/verify.sh` exits 0 and ends with
`[build] Complete!` (13 pages). If the copy's `.git` causes a
`dubious ownership` error, run `git config --global --add safe.directory
/tmp/danialrashidi-ci-check` and retry; that is an environment issue, not a
plan failure.

### Step 4: Review the diff

**Verify**: `git diff -- .github/workflows/quality.yml` contains exactly two
changes: the added `cache: npm` line and the new `Install dependencies` step.
No other source file is modified. The batch-2 plan files and
`plans/README.md` are expected to be present in this shared worktree; they are
not part of this plan's diff.

## Test plan

No new test file is needed. The workflow change is verified by the clean-copy
run above, which reproduces the runner's starting state. Do not add a test
that parses YAML for its own sake.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -n "cache: npm" .github/workflows/quality.yml` returns one match.
- [ ] `grep -n -A1 "name: Install dependencies" .github/workflows/quality.yml`
      shows `run: npm ci`.
- [ ] The install step appears before `bash scripts/verify.sh` in the file.
- [ ] The clean-copy `npm ci && bash scripts/verify.sh` run exits 0.
- [ ] Among source files, `git status --short` shows only
      `.github/workflows/quality.yml`; the batch-2 plan files and
      `plans/README.md` are expected pre-existing entries in this shared
      worktree.
- [ ] `plans/README.md` status row for plan 013 is updated.

## STOP conditions

Stop and report back (do not improvise) if:

- `npm ci` fails in the clean copy (for example, lockfile/manifest drift).
  Do not run `npm install` and commit a regenerated lockfile; report the
  drift instead.
- The clean-copy gate fails for a reason unrelated to missing dependencies.
  Capture the failing command and output; do not fix unrelated code in this
  plan.
- `.github/workflows/quality.yml` already contains an install step or its
  step order differs from the excerpt above.
- A change outside `.github/workflows/quality.yml` is required.

## Maintenance notes

- If the repository moves to pnpm/yarn, update both `.github/workflows/quality.yml`
  and `.github/workflows/deploy.yml` together; they must keep the same install
  command.
- `scripts/project-verify.sh` is the project lane that CI inherits. If it gains
  a new prerequisite (for example a browser), the quality workflow must install
  it too.
- The first green `quality` run can only be confirmed after the owner pushes.
  A local clean-copy pass is the strongest pre-push evidence; state that
  limitation in the handoff rather than claiming CI passed.
