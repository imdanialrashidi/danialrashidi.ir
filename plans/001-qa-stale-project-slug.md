# Plan 001: Point QA screenshot script at a real project slug

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git status --short -- scripts/qa-screenshots.mjs src/content/projects`
> plus `git diff --stat fb90779..HEAD -- scripts/qa-screenshots.mjs src/content/projects`.
> NOTE: the product slice is currently uncommitted, so `git diff` against the
> planned-at SHA may be empty even when files exist. Rely on `git status` and
> compare the "Current state" excerpts below against the live code before
> proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `fb90779`, 2026-10-07

## Why this matters

`scripts/qa-screenshots.mjs` is the repo's local Chromium QA driver: it visits
every route in its `ROUTES` table and records screenshots, console errors, and
overflow evidence. One entry points at `/پروژه‌ها/fast-english/` — a project
slug the owner removed on 2026-10-07. That QA leg 404s, so a "green" QA run is
currently masking a dead check, and anyone triaging QA output wastes time on a
route that should never have been hit. Fixing the slug restores the script as a
trustworthy QA gate.

## Current state

The relevant files, each with one line on its role:

- `scripts/qa-screenshots.mjs` — local Chromium QA driver; owns the `ROUTES` table (lines 10–18)
- `src/content/projects/` — the five real project files; source of truth for valid slugs

Excerpts as they exist today:

```js
// scripts/qa-screenshots.mjs:10-18
const ROUTES = [
  { name: "home", path: "/" },
  { name: "about", path: "/درباره/" },
  { name: "projects", path: "/پروژه‌ها/" },
  { name: "project-detail", path: "/پروژه‌ها/fast-english/" },
  { name: "travels", path: "/سفرها/" },
  { name: "support", path: "/حمایت/" },
  { name: "contact", path: "/ارتباط/" },
];
```

```text
# src/content/projects/ (directory listing, planned-at date)
elsa-hamrah.md  isbatab.md  mobile-khorsandi.md  noveno.md  php-ielts-house.md
```

There is no `fast-english.md`. Detail pages are generated per slug by
`src/pages/پروژه‌ها/[slug].astro`, so only the five slugs above resolve.
`noveno.md` is the featured project (`featured: true`, `order: 2`) and the
richest detail page — the right QA representative for the detail route.

Repo conventions that apply: Persian slugs are used verbatim in paths
throughout the repo (see `tests/site-structure.test.mjs` route list); keep the
same style, do not URL-encode the slug in the source.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Syntax check | `node --check scripts/qa-screenshots.mjs` | exit 0, no output |
| Stale-slug search | `grep -rn "fast-english" scripts/ src/ tests/ docs/` | no matches |
| Full test suite (regression) | `npm test` | all pass (exit 0) |

`npm test` runs `node --test tests/` (see `package.json`). It does not execute
the QA script itself (that needs a running server + Chromium); the syntax check
plus the grep are the verification for this change.

## Scope

**In scope** (the only files you should modify):

- `scripts/qa-screenshots.mjs` (one line: the `project-detail` path)

**Out of scope** (do NOT touch, even though they look related):

- `tests/site-structure.test.mjs` — owned by plan 003; concurrent edits risk conflicts.
- `src/content/projects/*` — slugs are owner content; never rename to fit a script.
- Any change to QA viewport list, Chromium launch flags, or report format.

## Git workflow

- Work in the current worktree on top of existing changes. Do NOT commit, push,
  or open a PR — the owner handles delivery via the `ai-changes` lane.
- Leave the one-line fix as an uncommitted worktree change and report it.

## Steps

### Step 1: Replace the stale slug with the featured project's slug

In `scripts/qa-screenshots.mjs` line 14, change:

```js
  { name: "project-detail", path: "/پروژه‌ها/fast-english/" },
```

to:

```js
  { name: "project-detail", path: "/پروژه‌ها/noveno/" },
```

Nothing else in the file changes.

**Verify**: `node --check scripts/qa-screenshots.mjs` → exit 0, no output.

### Step 2: Confirm no stale reference remains and nothing regressed

Run `grep -rn "fast-english" scripts/ src/ tests/ docs/` → no matches
(the owner removed this project deliberately; no new reference may reintroduce it).

**Verify**: `npm test` → exit 0, all tests pass (this change touches no
tested code, so the suite must stay green).

## Test plan

No new test: the existing suite does not execute the QA script (it requires a
live server + Chromium binary), and加 a test that parses the script's ROUTES
table would test implementation trivia rather than a behavioral contract. The
`grep` empty-result in Done criteria is the durable guard; if the slug set
changes again, the QA run itself 404s visibly.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `node --check scripts/qa-screenshots.mjs` exits 0
- [ ] `grep -rn "fast-english" scripts/ src/ tests/ docs/` returns no matches
- [ ] `npm test` exits 0 with no failures
- [ ] No files outside the in-scope list are modified (`git status --short`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The ROUTES table does not match the excerpt (e.g. someone already fixed it
  or added route-generation logic) — the one-line edit may not apply.
- `src/content/projects/noveno.md` no longer exists — the replacement slug
  needs re-deriving from the directory listing; do not invent a slug.
- `npm test` fails — confirm the failure exists without your change
  (`git stash` the one-liner, re-run) before reporting.

## Maintenance notes

For the human/agent who owns this code after the change lands:

- If a project slug is added/removed/renamed in `src/content/projects/`, the
  `ROUTES` table in `scripts/qa-screenshots.mjs:10-18` must be updated in the
  same change — there is no automatic link between content slugs and QA routes.
- A reviewer should scrutinize only that the new slug matches a real content
  file; nothing about QA behavior changed.
- Deliberately deferred: generating detail routes from the content directory
  at QA runtime. Revisit if the project list churns often; today it is five
  stable files and the indirection is not worth it.
