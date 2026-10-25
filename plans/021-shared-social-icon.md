# Plan 021: One shared social icon component

> **Executor instructions**: Follow this plan exactly. Run every verification
> command. If a STOP condition occurs, stop and report. When done, update row
> 021 in `plans/README.md` to DONE.
>
> **Drift check**: `git diff --stat 1754f74..HEAD -- src/components/SocialIcons.astro src/components/Footer.astro src/components/InstagramBand.astro tests/site-structure.test.mjs`
> Plans 014–020 may have changed the test file; compare the component excerpts.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: MED
- **Depends on**: 020 (shared test file)
- **Category**: tech-debt
- **Planned at**: commit `1754f74`, 2026-10-21

## Why this matters

The six social SVG paths are duplicated in `SocialIcons.astro` and
`Footer.astro`, and the Instagram path appears a third time in
`InstagramBand.astro`. Every network/icon change needs two or three
synchronized edits, and the recent ARIA-role bug had to be fixed in two places
for exactly this reason. Extracting a single `SocialIcon` component keeps the
icon geometry in one file and lets consumers focus on layout and semantics.

## Current state

`src/components/SocialIcons.astro:32-60` contains a `<span aria-hidden="true"
class="grid size-5 shrink-0 place-items-center">` with six conditional SVGs
(`github`, `telegram`, `instagram`, `email`, `x`, `website`), each
`viewBox="0 0 24 24"`.

`src/components/Footer.astro:31-53` contains the same six SVGs inside
`<span aria-hidden="true" class="grid size-5 place-items-center">`.

`src/components/InstagramBand.astro:12` contains the Instagram SVG inside a
decorative `size-10` action-colored square:

```astro
<span aria-hidden="true" class="grid size-10 shrink-0 place-items-center rounded-lg" style="background: var(--action); color: var(--on-action);">
  <svg viewBox="0 0 24 24" ...><rect .../><circle .../><circle .../></svg>
</span>
```

The SVG paths and stroke attributes are identical across the copies.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Typecheck | `npm run typecheck` | exit 0 |
| Tests | `npm test` | 22 pass |
| Build | `npm run build` | exit 0 |
| Gate | `bash scripts/verify.sh` | exit 0 |
| Browser QA | `QA_BASE=http://127.0.0.1:4321 node scripts/qa-screenshots.mjs` | 23 entries, no errors |

## Scope

**In scope**:

- `src/components/SocialIcon.astro` (create)
- `src/components/SocialIcons.astro`
- `src/components/Footer.astro`
- `src/components/InstagramBand.astro`
- `tests/site-structure.test.mjs` (one new test)

**Out of scope**: `src/config/site.ts`, the SVG paths/stroke values, the
surrounding anchor classes, the footer layout, `InstagramBand` layout.

## Steps

### Step 1: Create the shared icon component

Create `src/components/SocialIcon.astro` with the exact six SVGs currently in
`SocialIcons.astro`. Copy the paths verbatim; do not redraw or change stroke
widths. Shape:

```astro
---
import type { SocialId } from "../config/site";

type Props = { id: SocialId; class?: string };
const { id, class: className = "size-5" } = Astro.props as Props;
---

<span aria-hidden="true" class:list={["grid place-items-center", className]}>
  {id === "github" && (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="size-5">
      <path d="..."/>
    </svg>
  )}
  {id === "telegram" && (...)}
  {id === "instagram" && (...)}
  {id === "email" && (...)}
  {id === "x" && (...)}
  {id === "website" && (...)}
</span>
```

The outer span carries `aria-hidden` and the sizing/centering; the caller
passes extra classes such as `size-5 shrink-0`.

**Verify**: `grep -c "viewBox=\"0 0 24 24\"" src/components/SocialIcon.astro`
→ 6.

### Step 2: Replace the duplicated markup in SocialIcons

In `src/components/SocialIcons.astro`:

1. Add `import SocialIcon from "./SocialIcon.astro";` next to the existing
   imports.
2. Replace the entire `<span aria-hidden="true" class="grid size-5 shrink-0
   place-items-center">…</span>` block inside the anchor with:

```astro
<SocialIcon id={s.id} class="size-5 shrink-0" />
```

Keep the anchor, its classes, `aria-label`, `title`, `target`/`rel`, and the
label/handle spans unchanged.

**Verify**: the file contains `SocialIcon` and no
`<svg viewBox="0 0 24 24"`.

### Step 3: Replace the duplicated markup in Footer

In `src/components/Footer.astro`:

1. Add `import SocialIcon from "./SocialIcon.astro";`.
2. Replace the inline `<span aria-hidden="true" class="grid size-5
   place-items-center">…</span>` with:

```astro
<SocialIcon id={s.id} class="size-5" />
```

Keep the footer anchor classes, `aria-label`, `title`, and the `<li>` wrapper
from plan 016.

**Verify**: the file contains `SocialIcon` and no
`<svg viewBox="0 0 24 24"`.

### Step 4: Use the shared Instagram icon

In `src/components/InstagramBand.astro`:

1. Add `import SocialIcon from "./SocialIcon.astro";`.
2. Replace the inline Instagram `<svg …>…</svg>` inside the decorative
   `size-10` span with:

```astro
<SocialIcon id="instagram" class="size-5" />
```

The outer `size-10` colored square, its `aria-hidden`, and the surrounding
copy/CTA stay exactly as they are. The nested span from `SocialIcon` is
harmless; the geometry is identical.

**Verify**: the file contains `SocialIcon` and no
`<svg viewBox="0 0 24 24"`.

### Step 5: Add the structural guard

Append this test inside the existing `describe("persian editorial slice", ...)`
in `tests/site-structure.test.mjs`, before the closing `});`:

```js
  it("keeps social icon markup in one component", () => {
    for (const file of [
      "src/components/SocialIcons.astro",
      "src/components/Footer.astro",
      "src/components/InstagramBand.astro",
    ]) {
      const raw = readFileSync(`${ROOT}${file}`, "utf8");
      ok(raw.includes("SocialIcon"), `${file} must use the shared SocialIcon`);
      ok(!raw.includes('<svg viewBox="0 0 24 24"'), `${file} must not inline social SVG markup`);
    }
  });
```

**Verify**: `npm test` → 22 pass.

### Step 6: Prove visual parity

```bash
npm run build
python3 -m http.server 4321 -d dist >/tmp/dr-preview.log 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT
sleep 1
QA_BASE=http://127.0.0.1:4321 node scripts/qa-screenshots.mjs
```

Expected: `Done. 23 entries.`, every route `overflowX=0 consoleErr=0
failed=0`. If you can view images, compare the social rows in
`.artifacts/qa/home-desktop.png` and `home-mobile-390.png`; the icons must be
unchanged. If not, state that visual inspection was not performed.

## Test plan

- New test: one `it(...)` block (Step 5) asserting all three consumers use
  `SocialIcon` and none inline the SVG. It fails on the current duplicated
  markup.
- Existing 21 tests must pass (22 total).
- Build + QA script for layout/console parity. The SVG paths are copied
  verbatim, so pixel geometry should be identical.

## Done criteria

- [ ] `src/components/SocialIcon.astro` exists with all six icons.
- [ ] `SocialIcons`, `Footer`, and `InstagramBand` import and use it.
- [ ] No consumer contains `<svg viewBox="0 0 24 24"`.
- [ ] `npm run typecheck` exits 0.
- [ ] `npm test` exits 0 with 22 pass.
- [ ] `npm run build` exits 0.
- [ ] QA script exits 0 with 23 entries and no console errors/overflow.
- [ ] `bash scripts/verify.sh` exits 0.
- [ ] Only the five in-scope files plus `plans/README.md` are modified.
- [ ] `plans/README.md` row 021 is DONE.

## STOP conditions

- An icon path differs between the two current copies. Report the difference;
  do not pick one arbitrarily.
- The `SocialIcon` component's `class` prop does not apply the sizing class as
  expected (icon collapses or grows). Report the computed box; do not change
  the SVG geometry.
- Removing the inline SVG changes the InstagramBand square's color or size.
  Report the visual difference instead of adding compensating CSS.
- A step requires touching an out-of-scope file.

## Maintenance notes

- Add/remove a network in `src/config/site.ts` and `SocialIcon.astro` only;
  the three consumers render icons by id automatically.
- Keep `aria-hidden="true"` on the icon wrapper; the anchor's `aria-label`
  carries the accessible name.
- If a filled icon is introduced, add it to `SocialIcon` rather than creating a
  second icon set.
