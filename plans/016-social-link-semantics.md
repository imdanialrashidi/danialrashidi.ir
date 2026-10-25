# Plan 016: Expose social icon links as links, not ARIA list items

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 1754f74..HEAD -- src/components/SocialIcons.astro src/components/Footer.astro`
> If either component changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: 015 (shared `tests/site-structure.test.mjs`)
- **Category**: a11y
- **Planned at**: commit `1754f74`, 2026-10-21

## Why this matters

The social icons are anchors (`<a href=...>`), but each one is given
`role="listitem"`. ARIA roles override the element's implicit role, so
assistive technology exposes these controls as list items, not links.
Keyboard activation still works, but screen-reader users lose the link role,
the "link" announcement, and the expected link interaction model. In a real
browser accessibility query on the home page, `getByRole("link", { name:
/گیت‌هاب/ })` returns 0 and `getByRole("listitem", { name: /گیت‌هاب/ })`
returns 3. This affects every page (the footer is global) and both the hero
and contact social rows. The correct structure is a real `<ul>`/`<li>` list
containing real links; no ARIA list roles are needed.

## Current state

`./src/components/SocialIcons.astro:15-30`:

```astro
<div
  class:list={[layout === "row" ? "flex flex-wrap items-center gap-2" : "grid gap-1"]}
  role="list"
  aria-label="شبکه‌های اجتماعی دانیال رشیدی"
>
  {
    links.map((s) => (
      <a
        href={s.href}
        target={s.href.startsWith("mailto:") ? undefined : "_blank"}
        rel="me noopener"
        role="listitem"
        aria-label={`${s.label} — ${s.handle}`}
        title={`${s.label} — ${s.handle}`}
        class:list={["social-icon group inline-flex items-center gap-2 rounded-lg border px-3", box]}
        style="border-color: var(--border);"
      >
```

`./src/components/Footer.astro:17-30` (the footer duplicates the same
pattern with its own icon markup):

```astro
        <div class="mt-5">
          <div class="flex flex-wrap gap-2" role="list" aria-label="شبکه‌های اجتماعی">
            {
              SOCIALS.map((s) => (
                <a
                  href={s.href}
                  target={s.href.startsWith("mailto:") ? undefined : "_blank"}
                  rel="me noopener"
                  role="listitem"
                  aria-label={`${s.label} — ${s.handle}`}
                  class="social-icon inline-grid min-h-11 min-w-11 place-items-center rounded-lg border"
                  style="border-color: var(--border);"
                  title={`${s.label} — ${s.handle}`}
                >
```

The repository convention for regression guards is source-structure
assertions in `tests/site-structure.test.mjs`. Plan 014 and plan 015 append
tests there; this plan appends one more before the final `});` of the
`describe("persian editorial slice", ...)` block.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `npm run typecheck` | exit 0 |
| Tests | `npm test` | 19 existing tests + 1 new test pass |
| Build | `npm run build` | exit 0 |
| Local gate | `bash scripts/verify.sh` | exit 0 |
| Serve build | `python3 -m http.server 4321 -d dist` | serves on `127.0.0.1:4321` |
| Browser QA | `QA_BASE=http://127.0.0.1:4321 node scripts/qa-screenshots.mjs` | 23 entries, no console errors |

## Scope

**In scope** (the only files you should modify):

- `src/components/SocialIcons.astro`
- `src/components/Footer.astro`
- `tests/site-structure.test.mjs` (append one `it(...)` block)

**Out of scope** (do NOT touch, even though they look related):

- The SVG icon paths — keep the exact icon geometry.
- `src/config/site.ts` — the social list and handles are correct.
- `src/components/InstagramBand.astro` — it has a single Instagram CTA, not a
  list; leave it alone.
- Any CSS selector that styles `.social-icon` — the class stays on the anchor.
- `scripts/qa-screenshots.mjs` — use it for proof, do not modify it.

## Git workflow

- Leave the change in the working tree. Do **not** commit, push, create a
  branch, or open a PR. The repository's solo default is explicit in
  `docs/GIT_POLICY.md`.

## Steps

### Step 1: Replace the `SocialIcons` wrapper with a real list

In `src/components/SocialIcons.astro`:

1. Change the opening `<div ... role="list" ...>` to a `<ul>` and remove
   `role="list"`. Add the list-reset classes so Tailwind's default list
   margins/padding do not shift the row:

```astro
<ul
  class:list={["m-0 list-none p-0", layout === "row" ? "flex flex-wrap items-center gap-2" : "grid gap-1"]}
  aria-label="شبکه‌های اجتماعی دانیال رشیدی"
>
```

2. Wrap the mapped anchor in an `<li class="flex">` and remove
   `role="listitem"` from the anchor. Add `w-full` to the anchor only for the
   `layout="list"` variant so it still fills its grid row:

```astro
      <li class="flex">
        <a
          href={s.href}
          target={s.href.startsWith("mailto:") ? undefined : "_blank"}
          rel="me noopener"
          aria-label={`${s.label} — ${s.handle}`}
          title={`${s.label} — ${s.handle}`}
          class:list={[
            "social-icon group inline-flex items-center gap-2 rounded-lg border px-3",
            box,
            layout === "list" && "w-full",
          ]}
          style="border-color: var(--border);"
        >
          ...
        </a>
      </li>
```

3. Change the matching closing `</div>` of the wrapper to `</ul>`. Do not
   close the `<li>` before the anchor's closing `</a>`.

**Verify**: `grep -n "role=\"list" src/components/SocialIcons.astro` returns no
matches; `grep -n "<ul\\|<li class=\"flex\"\\|</ul>" src/components/SocialIcons.astro`
shows the new list structure.

### Step 2: Replace the footer wrapper with a real list

In `src/components/Footer.astro:18`:

1. Change the opening
   `<div class="flex flex-wrap gap-2" role="list" aria-label="شبکه‌های اجتماعی">`
   to:

```astro
          <ul class="m-0 flex flex-wrap gap-2 list-none p-0" aria-label="شبکه‌های اجتماعی">
```

2. Wrap the mapped anchor in `<li class="flex">` and remove
   `role="listitem"` from the anchor. Keep the anchor's existing classes
   (`social-icon inline-grid min-h-11 min-w-11 place-items-center rounded-lg
   border`) and `aria-label`/`title` exactly as they are.

3. Change the wrapper's closing `</div>` to `</ul>`. The outer
   `<div class="mt-5">` is not part of the list and stays.

**Verify**: `grep -n "role=\"list" src/components/Footer.astro` returns no
matches; the footer contains one `<ul ... aria-label="شبکه‌های اجتماعی">`
and six `<li class="flex">` wrappers (one per `SOCIALS` item, generated by the
map).

### Step 3: Add the regression guard

Append this `it(...)` block inside the existing
`describe("persian editorial slice", ...)` in
`tests/site-structure.test.mjs`, immediately before the closing `});` of the
describe block (below the tests added by plans 014 and 015):

```js
  it("exposes social links as links, not list items", () => {
    // role="listitem" on an <a> overrides the link role. Structure is the
    // source of truth here: a real ul/li list with real anchors inside.
    for (const file of ["src/components/SocialIcons.astro", "src/components/Footer.astro"]) {
      const raw = readFileSync(`${ROOT}${file}`, "utf8");
      ok(!raw.includes('role="listitem"'), `${file}: anchors must keep link semantics`);
      ok(!raw.includes('role="list"'), `${file}: use a real ul/li list, not ARIA list roles`);
      ok(/<ul[\s>]/.test(raw), `${file}: social links must be a real ul/li list`);
    }
  });
```

The file already imports `readFileSync` and `ok`; do not add imports.

**Verify**: `npm test` → the new test passes; total 20 tests (19 if plan 014
or 015 has not landed yet; this plan depends on 015, so 20 is expected).

### Step 4: Prove the role change in a real browser

Build, serve, and query the accessibility roles on the home page:

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
const page = await browser.newPage({ viewport: { width: 1360, height: 900 } });
await page.goto("http://127.0.0.1:4321/", { waitUntil: "load" });
const links = await page.getByRole("link", { name: /گیت‌هاب/ }).count();
const listitems = await page.getByRole("listitem", { name: /گیت‌هاب/ }).count();
const footerLinks = await page.locator('footer ul[aria-label="شبکه‌های اجتماعی"] a').count();
console.log({ links, listitems, footerLinks });
await browser.close();
if (links !== 3 || listitems !== 0 || footerLinks !== 6) process.exit(1);
NODE
```

Expected: `{ links: 3, listitems: 0, footerLinks: 6 }` and exit 0. Before the
fix the same query returned `{ links: 0, listitems: 3, ... }`. The three
GitHub links on the home page are the hero social row, the contact social
row, and the footer icon.

### Step 5: Confirm layout parity

With the server still running, run the existing QA script:

```bash
QA_BASE=http://127.0.0.1:4321 node scripts/qa-screenshots.mjs
```

**Verify**: output ends with `Done. 23 entries.`; every route reports
`overflowX=0 consoleErr=0 failed=0`. Inspect `.artifacts/qa/home-desktop.png`
and `home-mobile-390.png` if you have image viewing: the social icon rows
must keep the same spacing/alignment as before. The list-reset classes are
there to prevent a default `<ul>` indent; if the icons shifted, fix the reset
classes (not the semantics) and re-run.

## Test plan

- New test: one `it(...)` block in `tests/site-structure.test.mjs` (Step 3)
  asserting no `role="listitem"`/`role="list"` in the two components and a
  real `<ul>` structure. It fails against the current code.
- Existing tests: all 19 from plans 014/015 must still pass.
- Browser proof: role counts (Step 4) and the QA script (Step 5).
- No new browser test file: the repository has no browser-in-CI harness; the
  structural assertion is the CI guard and the Playwright snippet is the
  behavioral proof.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -rn 'role="listitem"' src/components/SocialIcons.astro src/components/Footer.astro`
      returns no matches.
- [ ] `grep -rn 'role="list"' src/components/SocialIcons.astro src/components/Footer.astro`
      returns no matches.
- [ ] Both components contain a real `<ul>` wrapper around the social links.
- [ ] `npm run typecheck` exits 0.
- [ ] `npm test` exits 0 with 20 tests passing.
- [ ] `npm run build` exits 0.
- [ ] The browser script prints links 3, listitems 0, footerLinks 6; exit 0.
- [ ] `QA_BASE=http://127.0.0.1:4321 node scripts/qa-screenshots.mjs` exits 0
      with 23 entries and no console errors.
- [ ] Among source/test files, `git status --short` shows only
      `src/components/SocialIcons.astro`, `src/components/Footer.astro`, and
      `tests/site-structure.test.mjs`. The earlier plans 013–015 changes and
      the batch-2 plan/index files are expected in this shared worktree.
- [ ] `plans/README.md` status row for plan 016 is updated.

## STOP conditions

Stop and report back (do not improvise) if:

- A parent selector or grid/flex rule depends on the wrapper being a `<div>`
  (search the component styles and `src/styles/global.css` for direct-child
  selectors such as `> div`). Changing the element to `<ul>` could change
  layout in a way the reset classes do not fix.
- The browser role query still reports `links: 0` after the change. Check for
  another `role` attribute on an ancestor that overrides the link semantics;
  do not add `role="link"` as a workaround.
- The footer's six icons shift visibly and the reset classes cannot recover
  the previous spacing without changing the icon geometry.
- A step requires editing a file outside the in-scope list.

## Maintenance notes

- The footer still duplicates the icon SVG markup from `SocialIcons.astro`
  (and `InstagramBand.astro` duplicates the Instagram path). This plan fixes
  semantics in both places but does not deduplicate the SVGs; a future
  refactor can extract a shared `SocialIcon` component. Until then, any icon
  or network change must be made in both files.
- If a new social network is added to `SOCIALS`, the existing maps render it
  automatically; no list markup change is needed. Keep the `<li>` wrapper.
- Reviewers should check the accessibility tree, not just the visual row:
  the bug was invisible in screenshots because the anchors still looked and
  clicked like links.
