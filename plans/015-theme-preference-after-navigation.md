# Plan 015: Keep the OS dark preference after client-side navigation

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 1754f74..HEAD -- src/layouts/Base.astro`
> Plan 014 is expected to have added a `classList.add("js")` line and a
> `before-swap` listener in this file. Those changes are not a conflict. On a
> mismatch in the `drApplySavedTheme` function below, treat it as a STOP
> condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: 014 (shared file and test file)
- **Category**: bug
- **Planned at**: commit `1754f74`, 2026-10-21

## Why this matters

A visitor whose operating system prefers dark mode, and who has never used
the site's theme toggle, gets a dark home page on first load. As soon as they
click any internal link, Astro's `ClientRouter` swaps in the next page's
server-rendered `<html data-theme="light">`, and the theme helper only
re-applies a *saved* choice. With no saved choice, it does nothing, so the
page turns light. The toggle's pressed state also becomes wrong. This is a
visible correctness bug for a documented design promise ("respects
`prefers-color-scheme` initially"), and it is exactly the kind of regression
that normal screenshots miss because the first page looks correct.

Confirmed in a real browser before the fix: fresh context, `colorScheme:
"dark"`, no `dr-theme` in localStorage → home `data-theme="dark"`; click
`/پروژه‌ها/` → `data-theme="light"` while `dr-theme` is still null.

## Current state

`./src/layouts/Base.astro:108-118`:

```js
      function drApplySavedTheme() {
        // View-transition swaps bring in the incoming page's <html> attributes
        // (SSR default data-theme="light"), so re-assert the saved choice.
        try {
          var saved = localStorage.getItem("dr-theme");
          if (saved === "dark" || saved === "light") {
            document.documentElement.dataset.theme = saved;
            return;
          }
        } catch {}
      }
```

`./src/layouts/Base.astro:80-88` — the first-load script already has the
correct resolution logic, which the helper must mirror:

```html
    <script is:inline>
      try {
        const saved = localStorage.getItem("dr-theme");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.dataset.theme = saved === "dark" || (!saved && prefersDark) ? "dark" : "light";
      } catch {
        document.documentElement.dataset.theme = "light";
      }
    </script>
```

`./src/layouts/Base.astro:119-127` — the toggle sync reads the theme and must
run after the corrected helper:

```js
      function drSyncThemeToggle() {
        var dark = document.documentElement.dataset.theme === "dark";
        document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
          btn.setAttribute("aria-pressed", String(dark));
          ...
        });
      }
```

`./src/layouts/Base.astro:144-148` — `drInit` calls the helper before syncing:

```js
      function drInit() {
        drApplySavedTheme();
        drSyncThemeToggle();
        drReveal();
      }
```

The repository convention for browser behavior is the inline script in
`Base.astro`; the convention for regression guards is source-structure
assertions in `tests/site-structure.test.mjs`. Plan 014 adds one test there
before this plan runs; append below it.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `npm run typecheck` | exit 0 |
| Tests | `npm test` | 18 existing tests + 1 new test pass |
| Build | `npm run build` | exit 0 |
| Local gate | `bash scripts/verify.sh` | exit 0 |
| Serve build | `python3 -m http.server 4321 -d dist` | serves on `127.0.0.1:4321` |

## Scope

**In scope** (the only files you should modify):

- `src/layouts/Base.astro` (only `drApplySavedTheme`)
- `tests/site-structure.test.mjs` (append one `it(...)` block)

**Out of scope** (do NOT touch, even though they look related):

- `src/styles/tokens.css` and the theme color values — the palette is correct.
- `src/styles/global.css` — plan 014 owns the reveal change.
- The head first-load script — it already resolves the theme correctly.
- The theme toggle markup/labels — no UI change is needed.
- `src/layouts/Base.astro`'s mobile menu, copy-card, or reveal code — do not
  refactor the shared script beyond the helper body.

## Git workflow

- Leave the change in the working tree. Do **not** commit, push, create a
  branch, or open a PR. The repository's solo default is explicit in
  `docs/GIT_POLICY.md`.

## Steps

### Step 1: Resolve the theme from storage first, OS preference second

Replace the body of `drApplySavedTheme` in `src/layouts/Base.astro:108-118`
with:

```js
      function drApplySavedTheme() {
        // View-transition swaps bring in the incoming page's <html> attributes
        // (SSR default data-theme="light"), so re-assert the saved choice.
        // With no saved choice, follow the OS preference again; otherwise the
        // first client-side navigation drops a dark-mode visitor to light.
        var saved = null;
        try {
          saved = localStorage.getItem("dr-theme");
        } catch {}
        var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.dataset.theme =
          saved === "dark" || saved === "light"
            ? saved
            : prefersDark ? "dark" : "light";
      }
```

Do not use optional chaining or `const`/`let` here: this inline script keeps
the site's existing ES5-compatible style (`var`, `function`) for broad
support. The head first-load script may keep its current style.

**Verify**: `sed -n '108,128p' src/layouts/Base.astro` → the helper contains
`matchMedia("(prefers-color-scheme: dark)")` and still checks
`saved === "dark" || saved === "light"`.

### Step 2: Add the regression guard

Append this `it(...)` block inside the existing
`describe("persian editorial slice", ...)` in
`tests/site-structure.test.mjs`, immediately before the closing `});` of the
describe block (below plan 014's no-JS test if it is present):

```js
  it("re-applies the OS theme preference after view transitions", () => {
    // ClientRouter swaps in SSR data-theme="light"; the helper must fall back
    // to prefers-color-scheme when no explicit choice is stored. This fails
    // on the old helper, which returned without touching the DOM.
    const base = readFileSync(`${ROOT}src/layouts/Base.astro`, "utf8");
    const helper = base.match(/function drApplySavedTheme\(\) \{([\s\S]*?)\n      \}/)?.[1] ?? "";
    ok(helper, "drApplySavedTheme helper not found");
    ok(helper.includes("prefers-color-scheme"), "theme helper must honor the OS preference when no saved choice exists");
    ok(/saved === "dark" \|\| saved === "light"/.test(helper), "a saved choice must still win");
  });
```

The file already imports `readFileSync` and `ok`; do not add imports.

**Verify**: `npm test` → the new test passes; total 19 tests (18 if plan 014
has not landed yet, but this plan depends on 014, so 19 is expected).

### Step 3: Prove the behavior in a real browser

Build, serve, and run two cases: OS dark with no saved choice, and an
explicit saved light choice. Both must survive an internal navigation.

```bash
npm run build
python3 -m http.server 4321 -d dist >/tmp/dr-preview.log 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT
sleep 1
node --input-type=module - <<'NODE'
import { chromium } from "playwright-core";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const dark = await browser.newContext({ colorScheme: "dark", viewport: { width: 1360, height: 900 } });
const page = await dark.newPage();
await page.goto("http://127.0.0.1:4321/", { waitUntil: "load" });
const before = await page.evaluate(() => document.documentElement.dataset.theme);
await page.click('nav a[href="/پروژه‌ها/"]');
await page.waitForTimeout(1200);
const after = await page.evaluate(() => document.documentElement.dataset.theme);
const saved = await page.evaluate(() => localStorage.getItem("dr-theme"));
console.log("os-dark:", { before, after, saved });

const light = await browser.newContext({ colorScheme: "dark", viewport: { width: 1360, height: 900 } });
const page2 = await light.newPage();
await page2.goto("http://127.0.0.1:4321/", { waitUntil: "load" });
await page2.evaluate(() => localStorage.setItem("dr-theme", "light"));
await page2.reload({ waitUntil: "load" });
const before2 = await page2.evaluate(() => document.documentElement.dataset.theme);
await page2.click('nav a[href="/پروژه‌ها/"]');
await page2.waitForTimeout(1200);
const after2 = await page2.evaluate(() => document.documentElement.dataset.theme);
console.log("saved-light:", { before2, after2 });

await browser.close();
if (before !== "dark" || after !== "dark" || saved !== null) process.exit(1);
if (before2 !== "light" || after2 !== "light") process.exit(1);
NODE
```

**Verify**: output contains
`os-dark: { before: 'dark', after: 'dark', saved: null }` and
`saved-light: { before2: 'light', after2: 'light' }`; exit code 0. Before the
fix, the first case printed `after: 'light'`.

### Step 4: Confirm the toggle still persists

With the server still running, run the existing QA script:

```bash
QA_BASE=http://127.0.0.1:4321 node scripts/qa-screenshots.mjs
```

**Verify**: output includes `theme: light -> dark (persisted=dark)` and ends
with `Done. 23 entries.` with no `consoleErr` or `failed` entries. The explicit
toggle choice must still beat the OS preference; the new helper tests this by
checking saved values first.

## Test plan

- New test: one `it(...)` block in `tests/site-structure.test.mjs` (Step 2)
  asserting the helper consults `prefers-color-scheme` and still honors a
  saved `dark`/`light` choice. It fails against the old helper.
- Existing tests: all 18 from plan 014 (or 17 if plan 014 is not yet landed)
  must still pass.
- Browser smoke: the two cases in Step 3 and the existing QA script in Step 4.
  The browser run is the behavioral proof; the structural test is the CI guard.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -n "prefers-color-scheme" src/layouts/Base.astro` returns at least
      two matches (head script + helper).
- [ ] The helper still contains `saved === "dark" || saved === "light"`.
- [ ] `npm run typecheck` exits 0.
- [ ] `npm test` exits 0 with 19 tests passing.
- [ ] `npm run build` exits 0.
- [ ] The browser script prints dark→dark with `saved: null` and light→light
      with a saved light choice; exit 0.
- [ ] `QA_BASE=http://127.0.0.1:4321 node scripts/qa-screenshots.mjs` exits 0
      with 23 entries and no console errors.
- [ ] Among source/test files, `git status --short` shows only
      `src/layouts/Base.astro` and `tests/site-structure.test.mjs`. The
      earlier plan 013 workflow change, plan 014's CSS/Base changes, and the
      batch-2 plan/index files are expected in this shared worktree.
- [ ] `plans/README.md` status row for plan 015 is updated.

## STOP conditions

Stop and report back (do not improvise) if:

- `drApplySavedTheme` no longer matches the excerpt (another change modified
  it). Do not overwrite unrelated edits; report the conflict.
- The browser still reports `after: 'light'` after the fix. Check that
  `astro:page-load` calls `drInit` after the swap (it does in the current
  file); do not paper over it with a `setTimeout` without understanding the
  event order.
- `window.matchMedia` is unavailable in the browser context; that would mean
  the head script is already broken on first load and is a separate issue.
- A step requires editing a file outside the in-scope list.
- Plan 014 is not landed and `tests/site-structure.test.mjs` still has 17
  tests. That is not a failure of this plan, but note the actual total in the
  handoff; do not delete or renumber plan 014's test.

## Maintenance notes

- The theme resolution logic now exists in two places: the head first-load
  script and `drApplySavedTheme`. They must stay semantically identical. If a
  third theme or a "system" option is added, update both and extend the test.
- `drApplySavedTheme` runs on every `astro:page-load` and on first load. It
  must remain cheap and synchronous; do not add network/storage work.
- Reviewers should check the no-saved-choice branch specifically. The saved
  branch already worked and will mask a regression if only that path is tested.
