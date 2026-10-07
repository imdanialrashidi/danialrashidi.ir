# Plan 003: Give the sitemap assertion a real oracle

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git status --short -- tests/site-structure.test.mjs astro.config.mjs`
> plus `git diff --stat fb90779..HEAD -- tests/site-structure.test.mjs astro.config.mjs`.
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

The `declares Persian RTL SEO foundation` test in `tests/site-structure.test.mjs`
checks six tokens against `src/layouts/Base.astro`, but the `"sitemap"` token
is asserted as `base.includes(token) || token === "sitemap"` — the right-hand
side is unconditionally true, so the assertion passes no matter what. The real
sitemap wiring lives in `astro.config.mjs` (`integrations: [sitemap()]`), and
today deleting that integration would not fail the suite. The sitemap is the
only SEO artifact the test claims but never proves; this plan gives it an
independent oracle.

## Current state

The relevant files, each with one line on its role:

- `tests/site-structure.test.mjs` — structural regression guard; SEO test at lines ~84–92
- `astro.config.mjs` — Astro config; owns the `sitemap()` integration (untracked new file)
- `src/layouts/Base.astro` — base layout; genuinely contains the other five tokens

Excerpts as they exist today:

```js
// tests/site-structure.test.mjs:84-92
  it("declares Persian RTL SEO foundation in the base layout", () => {
    const base = readFileSync(`${ROOT}src/layouts/Base.astro`, "utf8");
    for (const token of ['lang={SITE.lang}', 'dir={SITE.dir}', 'rel="canonical"', "og:title", "sitemap", "favicon.svg"]) {
      ok(base.includes(token) || token === "sitemap", `base layout missing ${token}`);
    }
    ok(existsSync(`${ROOT}public/robots.txt`), "robots.txt missing");
    ok(existsSync(`${ROOT}public/favicon.svg`), "favicon missing");
  });
```

```js
// astro.config.mjs (excerpts)
import sitemap from "@astrojs/sitemap";
// ...
  integrations: [sitemap()],
```

Observed build evidence that the integration is real (for your confidence, not
to assert in the test): `dist/` contains `sitemap-index.xml` and
`sitemap-0.xml` after `npm run build`.

Repo conventions that apply: tests use `node:test` + `node:assert`, read files
with `readFileSync(..., "utf8")`, and assert with `ok(cond, message)` — match
that style exactly. Test names are sentence-case descriptions.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Site tests | `node --test tests/site-structure.test.mjs` | all pass, exit 0 |
| Build (sitemap artifact check) | `npm run build` | exit 0; `dist/sitemap-index.xml` exists |

## Scope

**In scope** (the only files you should modify):

- `tests/site-structure.test.mjs` (the SEO test only)

**Out of scope** (do NOT touch, even though they look related):

- `astro.config.mjs` — the integration is correct; only the test changes (except for the temporary, reverted mutation in Step 2).
- `src/layouts/Base.astro` — its five tokens are genuinely asserted; leave them.
- `scripts/qa-screenshots.mjs` — owned by plan 001.

## Git workflow

- Work in the current worktree on top of existing changes. Do NOT commit, push,
  or open a PR — the owner handles delivery via the `ai-changes` lane.
- Leave the change as an uncommitted worktree modification and report it.

## Steps

### Step 1: Split the sitemap token out of the layout-token loop

Replace the loop body so the five layout tokens are asserted strictly against
`Base.astro`, and sitemap wiring is asserted independently against
`astro.config.mjs`:

```js
  it("declares Persian RTL SEO foundation in the base layout", () => {
    const base = readFileSync(`${ROOT}src/layouts/Base.astro`, "utf8");
    for (const token of ['lang={SITE.lang}', 'dir={SITE.dir}', 'rel="canonical"', "og:title", "favicon.svg"]) {
      ok(base.includes(token), `base layout missing ${token}`);
    }
    const config = readFileSync(`${ROOT}astro.config.mjs`, "utf8");
    ok(config.includes("sitemap()"), "astro config missing sitemap() integration");
    ok(existsSync(`${ROOT}public/robots.txt`), "robots.txt missing");
    ok(existsSync(`${ROOT}public/favicon.svg`), "favicon missing");
  });
```

Keep everything else in the test (name, robots/favicon checks) identical.

**Verify**: `node --test tests/site-structure.test.mjs` → all pass, exit 0.

### Step 2: Prove defect sensitivity with a controlled, reverted mutation

1. Temporarily comment out the integration in `astro.config.mjs`
   (e.g. `integrations: [/* sitemap() */]` — do NOT commit this).
2. Run `node --test tests/site-structure.test.mjs` → must FAIL on the SEO test
   with `astro config missing sitemap() integration`.
3. Revert `astro.config.mjs` immediately and re-run the test file → green.

**Verify**: red on the mutation with the exact message above; green after
revert; final `git status --short` shows no modification to `astro.config.mjs`.

## Test plan

This plan *repairs* an existing test rather than adding one — the right call
per the Test Value Gate (same contract, broken oracle; no new coverage gap
beyond the fix). Pattern followed: the file's own `ok(readFileSync(...).includes(...))`
style. Defect sensitivity is proven by the Step-2 mutation (red-before-green
on the exact integration the test guards).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `node --test tests/site-structure.test.mjs` exits 0, all tests pass
- [ ] The string `|| token === "sitemap"` no longer appears in the test file
- [ ] The test file contains an assertion reading `astro.config.mjs` for `sitemap()`
- [ ] Controlled-mutation check performed: suite failed with `astro config missing sitemap() integration` on commented-out integration, green after revert
- [ ] `astro.config.mjs` is unmodified in final `git status --short`
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The SEO test does not match the excerpt (already rewritten) — the vacuous clause may already be gone; verify whether an independent sitemap oracle exists before doing anything.
- `astro.config.mjs` no longer contains `sitemap()` on the untouched tree — the premise is false; report instead of asserting against a missing integration.
- The five layout tokens fail strictly (without the `||` escape hatch) — that means the layout genuinely regressed; report, do not weaken the assertion back.

## Maintenance notes

For the human/agent who owns this code after the change lands:

- If the sitemap integration moves (e.g. to a shared config), update the file
  path in this test; the oracle must always read the file that owns the
  integration, never `Base.astro`.
- Build-artifact check (`dist/sitemap-index.xml`) is deliberately NOT asserted:
  `dist/` is gitignored build output and the file is a build side effect, not
  source truth.
- A reviewer should scrutinize that the new oracle reads config source, not
  build output, and that no other test was touched.
