# Plan 011: Extract nav active-state helper and mark حمایت as current

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git status --short -- src/components/Masthead.astro src/config/site.ts tests/ package.json scripts/project-verify.sh`
> plus `git diff --stat 2f35e87..HEAD -- src/components/Masthead.astro src/config/site.ts`.
> NOTE: the worktree has unrelated staged changes (`.pi/` → `.omp/` migration
> deletions plus `.gitignore` / `quality.yml` edits). Compare the "Current state"
> excerpts below against the live code before proceeding; on a mismatch, treat it
> as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt (accessibility fix + testability refactor)
- **Planned at**: commit `2f35e87`, 2026-10-14

## Why this matters

Two findings, one fix. The desktop حمایت link never announces itself as current
(no `aria-current`, no accent styling), so screen-reader and sighted keyboard
users lose their place on the support page — while every neighboring desktop
link has it. And the `isActive` logic deciding "current" is inline in the
`.astro` file, where no unit test can reach it. Extracting the pure function
into `src/config/site.ts` (importable from Node like `support.ts` already is)
makes the a11y fix regression-coverable in the same plan.

Correction to the original audit note: the MOBILE menu already marks current
correctly (it maps `[...MAIN_NAV, SUPPORT]` with `isActive` at
`Masthead.astro:78-88`). Only the DESKTOP حمایت link (`:35-37`) is missing it.
Do not touch the mobile menu.

## Current state

The relevant files, each with one line on its role:

- `src/components/Masthead.astro` — header; owns the inline helper + both navs
- `src/config/site.ts` — owns `MAIN_NAV` + `SUPPORT_HREF`; receives the helper
- `tests/support-card.test.mjs` — exemplar Node unit test importing from `src/config/` (pattern to mirror)
- `package.json` + `scripts/project-verify.sh` — test gate listing test files explicitly (must add the new file)

Excerpts as they exist today:

```astro
// src/components/Masthead.astro:1-10 (imports + inline helper)
---
import { MAIN_NAV, SITE, SUPPORT_HREF } from "../config/site";
import BrandMark from "./BrandMark.astro";

const { path = "/" } = Astro.props as { path?: string };

function isActive(href: string, current: string) {
  if (href === "/") return current === "/";
  return current.startsWith(href);
}
---
```

```astro
<!-- src/components/Masthead.astro:22-38 (desktop nav — حمایت link has NO active state) -->
<nav class="hidden items-center gap-7 md:flex" aria-label="ناوبری اصلی">
  {
    MAIN_NAV.map((item) => (
      <a
        href={item.href}
        aria-current={isActive(item.href, path) ? "page" : undefined}
        class="quiet-link text-[0.95rem]"
        style={isActive(item.href, path) ? "color: var(--accent); text-decoration-color: var(--accent);" : undefined}
      >
        {item.label}
      </a>
    ))
  }
  <a href={SUPPORT_HREF} class="text-[0.95rem]" style="color: var(--muted);">
    حمایت
  </a>
</nav>
```

```astro
<!-- src/components/Masthead.astro:78-88 (mobile nav — ALREADY correct, do NOT touch) -->
[...MAIN_NAV, { href: SUPPORT_HREF, label: "حمایت از پروژه‌ها" }].map((item) => (
  <a
    href={item.href}
    aria-current={isActive(item.href, path) ? "page" : undefined}
    ...
```

```ts
// src/config/site.ts:66-74 (nav data the helper will live beside)
export const MAIN_NAV: NavItem[] = [
  { href: "/", label: "خانه" },
  { href: "/درباره/", label: "درباره" },
  { href: "/پروژه‌ها/", label: "پروژه‌ها" },
  { href: "/سفرها/", label: "سفرها" },
  { href: "/ارتباط/", label: "ارتباط" },
];

export const SUPPORT_HREF = "/حمایت/";
```

```js
// tests/support-card.test.mjs:1-7 (pattern to mirror for the new test file)
import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { formatCardNumber, isSupportCardConfigured } from "../src/config/support.ts";
```

```json
// package.json:12 (gate lists files explicitly — must extend)
"test": "node --test tests/site-structure.test.mjs tests/support-card.test.mjs",
```

```bash
# scripts/project-verify.sh:5-7 (same explicit list — must extend)
npm run typecheck
node --test tests/site-structure.test.mjs tests/support-card.test.mjs
npm run build
```

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `npm run typecheck` | exit 0, no errors |
| New unit test | `node --test tests/nav.test.mjs` | all pass, exit 0 |
| Full suite | `npm test` | all pass, exit 0 |
| Build | `npm run build` | exit 0 |

## Scope

**In scope** (the only files you should modify):

- `src/config/site.ts` (append exported helper, nothing else)
- `src/components/Masthead.astro` (import helper, delete inline function, fix desktop حمایت link)
- `tests/nav.test.mjs` (create — unit tests for the helper)
- `package.json` (`test` script: append the new file)
- `scripts/project-verify.sh` (same append)

**Out of scope** (do NOT touch, even though they look related):

- Mobile menu markup (`Masthead.astro:75-101`) — already correct; any edit risks regressing it.
- `MAIN_NAV` contents, `SUPPORT_HREF` value, Persian labels — not in question.
- `tests/site-structure.test.mjs`, `tests/support-card.test.mjs` — passing suites; the new coverage lives in its own file.
- Design tokens, accent color, underline styling — reuse the exact desktop-active style string, invent nothing.
- `docs/DESIGN.md` — no doc edit needed.

## Git workflow

- Work in the current worktree on top of existing changes. Do NOT commit, push,
  or open a PR — the owner handles delivery via the `ai-changes` lane.
- Leave the change as an uncommitted worktree modification and report it.

## Steps

### Step 1: Move `isActive` to `src/config/site.ts` as `isActivePath`

Append to the end of `src/config/site.ts` (after `SUPPORT_HREF`):

```ts
export function isActivePath(href: string, current: string): boolean {
  if (href === "/") return current === "/";
  return current.startsWith(href);
}
```

Logic must be byte-identical to the current inline `isActive` (including the
`"/"` special case — without it, every page would match `/` by prefix). Name it
`isActivePath` (not `isActive`) so the component diff reads as an import, not a
shadow.

**Verify**: `npm run typecheck` → exit 0. (`site.ts` is typechecked via the Astro
check; the function is unused until Step 2 — that is expected, do not stop.)

### Step 2: Rewire `Masthead.astro` and fix the desktop حمایت link

1. Change line 2 to:
   `import { MAIN_NAV, SITE, SUPPORT_HREF, isActivePath } from "../config/site";`
2. Delete the inline `function isActive(...)` block (lines 7-10), replace with:
   `const isActive = isActivePath;`
   (One-line alias keeps the six existing call sites untouched and the diff
   reviewable. Do NOT rename call sites.)
3. Replace the desktop حمایت link (lines 35-37) with:
   ```astro
   <a
     href={SUPPORT_HREF}
     aria-current={isActive(SUPPORT_HREF, path) ? "page" : undefined}
     class="quiet-link text-[0.95rem]"
     style={isActive(SUPPORT_HREF, path) ? "color: var(--accent); text-decoration-color: var(--accent);" : "color: var(--muted);"}
   >
     حمایت
   </a>
   ```
   Active حمایت now looks exactly like an active main-nav item; inactive حمایت
   keeps its current muted look (`color: var(--muted);`) via the false branch —
   preserving today's appearance on non-support pages.

**Verify**: `npm run typecheck` → exit 0; `grep -n "function isActive" src/components/Masthead.astro` → no matches; `grep -n "aria-current" src/components/Masthead.astro` → three matches (desktop main nav, desktop حمایت, mobile map).

### Step 3: Create `tests/nav.test.mjs`

Create the file with exactly (mirroring `tests/support-card.test.mjs` style —
`node:assert` + `node:test`, values hand-derived from the function, not from
running it):

```js
// Unit guard for the nav active-state helper in src/config/site.ts.
// isActivePath drives aria-current in Masthead (desktop + mobile).
// Expected values below are hand-derived from the prefix rule, not from running the code.
import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { isActivePath } from "../src/config/site.ts";

describe("nav active state", () => {
  it("matches home exactly, never by prefix", () => {
    strictEqual(isActivePath("/", "/"), true);
    strictEqual(isActivePath("/", "/درباره/"), false);
  });

  it("matches section pages by prefix", () => {
    strictEqual(isActivePath("/پروژه‌ها/", "/پروژه‌ها/"), true);
    strictEqual(isActivePath("/پروژه‌ها/", "/پروژه‌ها/noveno/"), true);
    strictEqual(isActivePath("/درباره/", "/ارتباط/"), false);
  });

  it("marks the support page current", () => {
    strictEqual(isActivePath("/حمایت/", "/حمایت/"), true);
    strictEqual(isActivePath("/حمایت/", "/"), false);
  });
});
```

**Verify**: `node --test tests/nav.test.mjs` → 3 pass, exit 0.

### Step 4: Wire the new file into the gate (both places)

1. In `package.json`, change the `test` script to:
   `"test": "node --test tests/site-structure.test.mjs tests/support-card.test.mjs tests/nav.test.mjs",`
2. In `scripts/project-verify.sh`, change the test line to:
   `node --test tests/site-structure.test.mjs tests/support-card.test.mjs tests/nav.test.mjs`

Both edits are single-line appends of ` tests/nav.test.mjs`. No other line changes.

**Verify**: `npm test` → all pass (11 existing + 3 new = 14 tests), exit 0; then `npm run build` → exit 0.

## Test plan

This plan adds `tests/nav.test.mjs` (Step 3); test-design rationale: contract =
"current page" marking (observable: `aria-current="page"` on the right link);
plausible failure = future nav refactor breaking prefix logic (e.g. home
matching everything, detail pages losing section highlight); gap = logic inline
in `.astro`, unreachable from Node; cheapest faithful layer = unit tests on the
extracted pure function (the `.astro` wiring itself is a 1:1 alias verified by
grep + typecheck + build, not worth browser QA); oracle = hand-derived
prefix-rule cases including the `/` special case and a Persian-slug detail path;
defect sensitivity = mutating `startsWith` to `===` fails the detail-page case,
deleting the `/` special case fails the home-prefix case.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -n "function isActive" src/components/Masthead.astro` returns no matches; `site.ts` exports `isActivePath`
- [ ] Desktop حمایت link carries `aria-current={isActive(SUPPORT_HREF, path) ...}` (grep `SUPPORT_HREF, path` in Masthead finds ≥2 call sites)
- [ ] `node --test tests/nav.test.mjs` → 3 pass, exit 0
- [ ] `npm test` → 14 tests pass (11 existing + 3 new), exit 0
- [ ] `npm run build` exits 0
- [ ] No files outside the in-scope list are modified (`git status --short`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The mobile menu excerpt doesn't match (already refactored to a different helper or structure) — the "already correct" premise is void; report the live markup.
- `site.ts` already exports an active-state helper under another name — use it instead of adding `isActivePath`, and mirror the existing name in Masthead + tests.
- `node --test tests/nav.test.mjs` fails to import `site.ts` (TS loader issue in the runner) — `support-card.test.mjs` imports `support.ts` the same way and passes, so a failure here means the environment changed; report rather than adding a loader/flag.
- A step's verification fails twice after a reasonable fix attempt.

## Maintenance notes

For the human/agent who owns this code after the change lands:

- New nav items (a future blog section, say) get active-state for free on mobile (it maps `MAIN_NAV + SUPPORT`) but need the Step-2 treatment on desktop ONLY if they live outside `MAIN_NAV` like حمایت does — prefer adding them to `MAIN_NAV` instead.
- If Astro ever ships testable component logic, the `const isActive = isActivePath` alias collapses to direct `isActivePath(...)` call sites — cosmetic, do it when touching the file anyway.
- A reviewer should check the desktop حمایت ternary renders the muted style on non-support pages (today's look preserved) — screenshot `/` vs `/حمایت/` header if QA-ing visually.
