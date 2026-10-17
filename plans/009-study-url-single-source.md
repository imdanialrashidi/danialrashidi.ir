# Plan 009: Study URL comes from `SITE`, not two hardcoded literals

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git status --short -- src/config/site.ts src/pages/index.astro src/components/Footer.astro tests/site-structure.test.mjs`
> plus `git diff --stat 2f35e87..HEAD -- src/config/site.ts src/pages/index.astro src/components/Footer.astro`.
> NOTE: the worktree has unrelated staged changes (`.pi/` → `.omp/` migration
> deletions plus `.gitignore` / `quality.yml` edits). Rely on `git status` and
> compare the "Current state" excerpts below against the live code before
> proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `2f35e87`, 2026-10-14

## Why this matters

The repo's own invariant is one config file owning all links ("Components never
hard-code links" — `docs/DESIGN.md` agent-proposed details). The study-center
URL violates it in exactly two components: changing the subdomain means
touching three files instead of one, and a future editor will update the
content card but miss the hero or footer. Centralizing the URL in `SITE` restores
the invariant for ~10 lines and gives the next link the pattern to follow.

## Current state

The relevant files, each with one line on its role:

- `src/config/site.ts` — the single identity/link config; owns every other URL but has NO study field
- `src/pages/index.astro` — hero study band; hardcodes the URL (lines ~89-98)
- `src/components/Footer.astro` — "بخش‌ها" nav; hardcodes the same URL (lines ~67-71)
- `tests/site-structure.test.mjs` — asserts the study project links the subdomain (content level, stays)

Excerpts as they exist today:

```ts
// src/config/site.ts:8-30 (SITE object — note: no study field)
export const SITE = {
  name: "دانیال رشیدی",
  latinName: "Danial Rashidi",
  domain: "https://danialrashidi.ir",
  // ... tagline, ogImage, description, email, github, englishSite,
  // telegram, instagram, x — but no studyUrl
} as const;
```

```astro
<!-- src/pages/index.astro:89-98 (hero study CTA) -->
<a
  href="https://study.danialrashidi.ir"
  target="_blank"
  rel="noopener"
  class="btn-primary inline-flex min-h-12 items-center rounded-lg px-6 font-bold"
  style="background: var(--action); color: var(--on-action);"
>
```

```astro
<!-- src/components/Footer.astro:67-71 (بخش‌ها nav) -->
<li>
  <a class="quiet-link" href="https://study.danialrashidi.ir" target="_blank" rel="noopener">
    مرکز مطالعه — وب‌سایت‌های آموزشی ↗
  </a>
</li>
```

```js
// tests/site-structure.test.mjs:48-50 (content-level assertion — keep as is)
const study = readFileSync(`${ROOT}src/content/projects/study.md`, "utf8");
ok(study.includes("https://study.danialrashidi.ir"), "study project must link the real study subdomain");
```

Repo conventions that apply: `SITE` in `src/config/site.ts` is the single source
of truth for links (see its header comment: "تنها فایل تنظیمات هویتی سایت —
همه‌ی لینک‌ها از این‌جا می‌آیند"); both `index.astro` and `Footer.astro` already
import `SITE`, so the fix is a field plus two substitutions. Test style is
`describe`/`it` + `node:assert` with `ok`.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `npm run typecheck` | exit 0, no errors |
| Site tests | `node --test tests/site-structure.test.mjs tests/support-card.test.mjs` | all pass, exit 0 |
| Full suite | `npm test` | all pass, exit 0 |
| Build | `npm run build` | exit 0, `dist/` emitted |

## Scope

**In scope** (the only files you should modify):

- `src/config/site.ts` (add one field)
- `src/pages/index.astro` (one href substitution)
- `src/components/Footer.astro` (one href substitution)
- `tests/site-structure.test.mjs` (add one `it` guard)

**Out of scope** (do NOT touch, even though they look related):

- `src/content/projects/study.md` — its `liveUrl: "https://study.danialrashidi.ir"` is owner content driving the project card, not nav chrome; the duplication between frontmatter and `SITE` is intentional (content vs. chrome), do not "deduplicate" it.
- `docs/DESIGN.md` — the invariant is already documented; no doc edit needed.
- Any other link (`SITE.telegram`, `method.href`, `data.liveUrl`, etc.) — this plan moves exactly one URL.
- `src/config/support.ts`, payment UI — unrelated.

## Git workflow

- Work in the current worktree on top of existing changes. Do NOT commit, push,
  or open a PR — the owner handles delivery via the `ai-changes` lane.
- Leave the change as an uncommitted worktree modification and report it.

## Steps

### Step 1: Add `studyUrl` to `SITE`

In `src/config/site.ts`, inside the `SITE` object (after the `x`/`xHandle` lines,
before the closing `} as const;`), add:

```ts
  studyUrl: "https://study.danialrashidi.ir",
```

Keep the exact URL string (verified live above). Do not add a label field — the
two call sites use different Persian labels; only the URL is shared.

**Verify**: `npm run typecheck` → exit 0.

### Step 2: Substitute both hardcoded hrefs

1. In `src/pages/index.astro`, replace `href="https://study.danialrashidi.ir"`
   with `href={SITE.studyUrl}`. `SITE` is already imported on line 12 — do not
   add an import.
2. In `src/components/Footer.astro`, replace
   `href="https://study.danialrashidi.ir"` with `href={SITE.studyUrl}`. `SITE`
   is already imported on line 2 — do not add an import.

No other attribute changes: keep `target="_blank" rel="noopener"`, classes, and
Persian labels byte-identical.

**Verify**: `grep -rn "study\.danialrashidi" src/components/ src/pages/ src/layouts/` → the ONLY match is `src/config/site.ts` (the definition). And `npm run typecheck` → exit 0.

### Step 3: Add the single-source guard test

Inside the top-level `describe("persian editorial slice", ...)` in
`tests/site-structure.test.mjs`, add after the study-center test:

```js
  it("study URL comes from SITE, not hardcoded component links", () => {
    // One-config rule (docs/DESIGN.md): components never hard-code links.
    const site = readFileSync(`${ROOT}src/config/site.ts`, "utf8");
    ok(site.includes("https://study.danialrashidi.ir"), "SITE must define the study URL");
    for (const file of ["src/pages/index.astro", "src/components/Footer.astro"]) {
      const raw = readFileSync(`${ROOT}${file}`, "utf8");
      ok(!raw.includes("https://study.danialrashidi.ir"), `${file} must not hardcode the study URL`);
      ok(raw.includes("SITE.studyUrl"), `${file} must use SITE.studyUrl`);
    }
  });
```

`readFileSync` and `ok` are already imported at the top of the file — do not
add imports.

**Verify**: `node --test tests/site-structure.test.mjs` → all pass, exit 0.

### Step 4: Full gate

**Verify**: `npm test` → all pass, exit 0; then `npm run build` → exit 0.

## Test plan

This plan adds one structural test (Step 3); test-design rationale: contract =
single-source study URL (observable: hero + footer point at the same configured
string); plausible failure = future editor hardcodes a new subdomain link in a
component; gap = no test pins the invariant; cheapest faithful layer = source
text scan mirroring the existing study assertions (no browser needed — the
contract is which string lives in which file); oracle = the literal URL plus
`SITE.studyUrl` usage, not an invented threshold; defect sensitivity = the test
fails on today's code if Step 2 is reverted (both files contain the literal).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -rn "study\.danialrashidi" src/components/ src/pages/ src/layouts/` matches only `src/config/site.ts`
- [ ] `npm run typecheck` exits 0
- [ ] `npm test` exits 0, including the new single-source test
- [ ] `npm run build` exits 0
- [ ] No files outside the in-scope list are modified (`git status --short`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Either component no longer matches its excerpt (URL already centralized or a third hardcoded copy appeared) — report the live state instead of extending scope to the third copy without asking.
- `SITE` already has a study field under a different name (e.g. `study` vs `studyUrl`) — use the EXISTING name in Step 2 and mirror it in Step 3 rather than adding a duplicate.
- A step's verification fails twice after a reasonable fix attempt.

## Maintenance notes

For the human/agent who owns this code after the change lands:

- The next external URL added to chrome (a new subdomain, a new social) follows the same recipe: field on `SITE` → `{SITE.field}` in the component → extend the Step-3 test's file list.
- `study.md` frontmatter `liveUrl` intentionally still repeats the URL string (content layer, owner-edited); if a reviewer proposes unifying content frontmatter with `SITE`, reject it — content files can't import TS.
- A reviewer should diff the two href substitutions character-for-character; only the `href` attribute may change.
