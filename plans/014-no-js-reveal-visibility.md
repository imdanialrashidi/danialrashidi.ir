# Plan 014: Keep reveal content visible when JavaScript is unavailable

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 1754f74..HEAD -- src/layouts/Base.astro src/styles/global.css`
> If either file changed since this plan was written, compare the "Current
> state" excerpts against the live code before proceeding; on a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: 013 (so the verification gate is green in CI)
- **Category**: bug
- **Planned at**: commit `1754f74`, 2026-10-21

## Why this matters

The site is static-first: `docs/DESIGN.md` says the site is HTML with no
loading state and the no-JS path is a full page load. But every section marked
`.reveal` starts at `opacity: 0`, and only the inline JavaScript in
`Base.astro` adds `.is-visible`. If JavaScript is disabled, blocked, or never
runs, the projects, about body, travel strip, support teaser, and contact
content are painted invisible. This is a content-loss bug for real users
(privacy extensions, locked-down browsers, text browsers) and it contradicts
the static-first contract. A no-JS browser screenshot of the about section
shows only the section heading and link; the body is blank.

The fix is progressive enhancement: content is visible by default, and the
animation is opt-in only for documents where JavaScript has marked itself as
available.

## Current state

`./src/styles/global.css:105-118`:

```css
.reveal {
  opacity: 0;
  transform: translateY(16px);
  transition:
    opacity 600ms var(--ease-out),
    transform 600ms var(--ease-out);
  transition-delay: var(--reveal-delay, 0ms);
}

.reveal.is-visible,
.hero-enter.is-visible {
  opacity: 1;
  transform: none;
}
```

`./src/styles/global.css:202-208` (reduced-motion override):

```css
  .hero-enter,
  .reveal {
    opacity: 1;
    transform: none;
    animation: none;
    transition: none;
  }
```

`./src/layouts/Base.astro:38-45` — the only code that reveals content:

```js
function drReveal() {
  var els = document.querySelectorAll(".reveal:not(.is-visible)");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) {
    els.forEach(function (el) { el.classList.add("is-visible"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    ...
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  els.forEach(function (el) { io.observe(el); });
}
```

`./src/layouts/Base.astro:80-88` — the head script that runs before paint:

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

`./src/layouts/Base.astro:144-148` — `drInit`, called on every page load:

```js
function drInit() {
  drApplySavedTheme();
  drSyncThemeToggle();
  drReveal();
}
```

There is no `<noscript>` fallback and no `js`/`no-js` class. The repository
convention for browser behavior is the inline script in `Base.astro`; the
convention for regression guards is source-structure assertions in
`tests/site-structure.test.mjs`.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `npm run typecheck` | exit 0, 0 errors |
| Tests | `npm test` | 17 existing tests + 1 new test pass |
| Build | `npm run build` | exit 0, 13 pages |
| Local gate | `bash scripts/verify.sh` | exit 0 |
| Serve build | `python3 -m http.server 4321 -d dist` | serves on `127.0.0.1:4321` |
| Browser QA | `QA_BASE=http://127.0.0.1:4321 node scripts/qa-screenshots.mjs` | 23 entries, no console errors |

## Scope

**In scope** (the only files you should modify):

- `src/layouts/Base.astro`
- `src/styles/global.css`
- `tests/site-structure.test.mjs` (append one `it(...)` block; do not rewrite
  the file)

**Out of scope** (do NOT touch, even though they look related):

- `src/components/*` — no component needs to know about the `js` class.
- `src/layouts/Base.astro`'s theme code — plan 015 changes that; do not edit
  `drApplySavedTheme` here.
- The reveal animation duration/easing/intersection thresholds — keep the
  existing visual timing.
- `scripts/qa-screenshots.mjs` — use it for proof, do not modify it.
- `ClientRouter` configuration — no navigation change is needed.

## Git workflow

- Leave the change in the working tree. Do **not** commit, push, create a
  branch, or open a PR. The repository's solo default is explicit in
  `docs/GIT_POLICY.md`.

## Steps

### Step 1: Mark JS-enabled documents in the head script

In `src/layouts/Base.astro`, inside the existing head `<script is:inline>`,
add one line before the theme `try` block. Keep the existing theme code
unchanged:

```html
    <script is:inline>
      try { document.documentElement.classList.add("js"); } catch {}
      try {
        const saved = localStorage.getItem("dr-theme");
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.dataset.theme = saved === "dark" || (!saved && prefersDark) ? "dark" : "light";
      } catch {
        document.documentElement.dataset.theme = "light";
      }
    </script>
```

The class is added in `<head>`, before the body is painted, so a JS-enabled
page does not flash its content before hiding it for the reveal animation.
If the class cannot be added (classList unavailable), content stays visible —
which is the safe default.

**Verify**: `grep -n 'classList.add("js")' src/layouts/Base.astro` → one match
inside the head script.

### Step 2: Re-add the class across view-transition swaps

Astro's `ClientRouter` swaps in the incoming document's `<html>` attributes,
so the `js` class from the current document is not guaranteed to survive a
navigation. Register a `before-swap` listener next to the existing
`astro:page-load` listener inside the `if (!window.__drBound)` block in
`Base.astro`:

```js
      if (!window.__drBound) {
        window.__drBound = true;
        document.addEventListener("astro:page-load", drInit);
        document.addEventListener("astro:before-swap", (event) => {
          event.newDocument.documentElement.classList.add("js");
        });
```

`event.newDocument` is the incoming `Document` in Astro's view-transition
API (verified in this repository's installed Astro 7.3.6:
`node_modules/astro/dist/transitions/events.js` and `events.d.ts`). The
handler runs once, before the swap, so the incoming page already has the
class when its `.reveal` elements are observed.

**Verify**: `grep -n '"astro:before-swap"' src/layouts/Base.astro` → one
match; `grep -n '"astro:page-load"' src/layouts/Base.astro` → one match.

### Step 3: Make `.reveal` visible by default and hide it only under `html.js`

Replace the `.reveal` rules in `src/styles/global.css:105-118` with:

```css
/* Visible by default. Only JS-enabled documents opt into the entrance
   animation; if scripts are blocked or fail, the content still renders. */
.reveal {
  opacity: 1;
  transform: none;
}

html.js .reveal {
  opacity: 0;
  transform: translateY(16px);
  transition:
    opacity 600ms var(--ease-out),
    transform 600ms var(--ease-out);
  transition-delay: var(--reveal-delay, 0ms);
}

html.js .reveal.is-visible,
.hero-enter.is-visible {
  opacity: 1;
  transform: none;
}
```

Do not change `.hero-enter`; it is a CSS animation and works without JS.

**Verify**: `sed -n '105,125p' src/styles/global.css` → `.reveal` defaults to
`opacity: 1`; the hidden state is scoped to `html.js .reveal`.

### Step 4: Keep the reduced-motion override winning

In the `@media (prefers-reduced-motion: reduce)` block at
`src/styles/global.css:202-208`, change the `.reveal` selector to
`html.js .reveal` so it has the same specificity as the new hidden rule and
still lands later in the file:

```css
  .hero-enter,
  html.js .reveal {
    opacity: 1;
    transform: none;
    animation: none;
    transition: none;
  }
```

Without this change, `html.js .reveal` (specificity 0,2,1) would beat the
reduced-motion `.reveal` (0,1,0) and reduced-motion users could see hidden
content until `drReveal()` runs.

**Verify**: `sed -n '202,212p' src/styles/global.css` → the reduced-motion
block contains `html.js .reveal`.

### Step 5: Add the regression guard

Append this `it(...)` block inside the existing
`describe("persian editorial slice", ...)` in
`tests/site-structure.test.mjs`, immediately before the closing `});` of the
describe block (after the `target=_blank` test):

```js
  it("keeps reveal content visible when JavaScript is unavailable", () => {
    // Progressive enhancement: .reveal must not be hidden by default. The
    // hidden state is opt-in via html.js, which only the Base head script
    // adds. This fails on the old `.reveal { opacity: 0 }` rule.
    const base = readFileSync(`${ROOT}src/layouts/Base.astro`, "utf8");
    const css = readFileSync(`${ROOT}src/styles/global.css`, "utf8");
    ok(base.includes('classList.add("js")'), "Base must mark JS-enabled documents");
    ok(base.includes('"astro:before-swap"'), "the js class must survive view-transition swaps");
    ok(css.includes("html.js .reveal"), "reveal hiding must be scoped to html.js");
    ok(/^\.reveal\s*\{[^}]*opacity:\s*1/m.test(css), "reveal must default to visible");
    ok(!/^\.reveal\s*\{[^}]*opacity:\s*0/m.test(css), "reveal must not be hidden by default");
  });
```

The file already imports `readFileSync` and `ok`; do not add imports.

**Verify**: `npm test` → the new test passes; total 18 tests.

### Step 6: Prove the no-JS behavior in a real browser

Build, serve the output, and check the computed opacity of a reveal-wrapped
element in a JavaScript-disabled context:

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
const context = await browser.newContext({
  javaScriptEnabled: false,
  viewport: { width: 1360, height: 900 },
});
const page = await context.newPage();
await page.goto("http://127.0.0.1:4321/", { waitUntil: "load" });
const opacity = await page
  .locator('section[aria-labelledby="about-snapshot"] .reveal')
  .first()
  .evaluate((el) => getComputedStyle(el).opacity);
console.log("no-js reveal opacity:", opacity);
await browser.close();
if (opacity !== "1") process.exit(1);
NODE
```

**Verify**: output contains `no-js reveal opacity: 1`; exit code 0. This is
the exact failure that reproduced before the fix (`opacity: 0` and a blank
about section screenshot).

### Step 7: Confirm the animation still works with JavaScript

With the same server still running (or restart it), run the existing QA
script:

```bash
QA_BASE=http://127.0.0.1:4321 node scripts/qa-screenshots.mjs
```

**Verify**: output ends with `Done. 23 entries.` and every route line reports
`overflowX=0 consoleErr=0 failed=0`. The `home` screenshots in
`.artifacts/qa/` should show revealed project/travel sections, not blank
blocks. If the executor cannot inspect images, the computed no-JS check plus
the QA script's zero-error/zero-overflow result is the available proof; state
that visual inspection was not performed.

## Test plan

- New test: one `it(...)` block in `tests/site-structure.test.mjs` (Step 5)
  asserting the default-visible CSS, the `html.js` scope, the head-script
  marker, and the `before-swap` listener. It fails against the old
  `.reveal { opacity: 0 }` rule.
- Existing tests: all 17 must still pass.
- Browser smoke: no-JS computed opacity (Step 6) and the existing QA script
  (Step 7). The browser check is the behavioral proof; the structural test is
  the CI guard because `npm test` does not launch a browser.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -n 'classList.add("js")' src/layouts/Base.astro` returns two
      matches: the head-script marker and the `before-swap` handler.
- [ ] `grep -n '"astro:before-swap"' src/layouts/Base.astro` returns one match.
- [ ] `grep -n "html.js .reveal" src/styles/global.css` returns at least two
      matches (hidden state + reduced-motion override).
- [ ] `npm run typecheck` exits 0.
- [ ] `npm test` exits 0 with 18 tests passing.
- [ ] `npm run build` exits 0.
- [ ] The no-JS browser check prints `no-js reveal opacity: 1`.
- [ ] `QA_BASE=http://127.0.0.1:4321 node scripts/qa-screenshots.mjs` exits 0
      with 23 entries and no console errors.
- [ ] Among source/test files, `git status --short` shows only
      `src/layouts/Base.astro`, `src/styles/global.css`, and
      `tests/site-structure.test.mjs`. The earlier plan 013 workflow change
      and the batch-2 plan/index files are expected in this shared worktree.
- [ ] `plans/README.md` status row for plan 014 is updated.

## STOP conditions

Stop and report back (do not improvise) if:

- `event.newDocument` is undefined or `astro:before-swap` is absent in the
  installed Astro version (the plan assumed Astro 7.3.6).
- The no-JS check still reports `opacity: 0` after all edits. Check that the
  head script did not run in the `javaScriptEnabled: false` context and that
  no other rule hides `.reveal`; do not add `!important` as a blanket fix
  without finding the winning rule.
- The reduced-motion override still loses to `html.js .reveal` (test with
  `reducedMotion: "reduce"` in a Playwright context); report the computed
  style instead of guessing.
- A step requires editing a file outside the in-scope list.
- Plan 015 has already changed `drApplySavedTheme`; that is expected. Do not
  revert it. Only stop if the head script or `drReveal` body differs from the
  excerpts above in a way that changes this plan's assumptions.

## Maintenance notes

- Any future element that wants the entrance animation must use `class="reveal"`
  and live inside the `Base` layout. Do not add a second hide-on-load rule in
  a component; the `html.js` scope is the single opt-in.
- If the head inline script is removed, content stays visible (safe) but the
  reveal animation stops. If a new theme/bootstrap script replaces it, keep
  the `classList.add("js")` line.
- Reviewers should check the reduced-motion selector specificity, not just
  the happy path. The bug this plan fixes was invisible in normal browser
  screenshots because JavaScript was always on.
