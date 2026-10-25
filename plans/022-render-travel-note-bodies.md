# Plan 022: Render the authored travel note bodies

> **Executor instructions**: Follow this plan exactly. Run every verification
> command. If a STOP condition occurs, stop and report. When done, update row
> 022 in `plans/README.md` to DONE.
>
> **Drift check**: `git diff --stat 1754f74..HEAD -- src/components/TravelCard.astro tests/site-structure.test.mjs README.md`
> Plans 018–021 may have changed the test file and README; compare the
> component excerpt.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: 021 (shared test file)
- **Category**: content
- **Planned at**: commit `1754f74`, 2026-10-21

## Why this matters

Each travel Markdown file has a short first-person note after its frontmatter,
but `TravelCard` only reads frontmatter `description`. The notes are authored
content that never reaches the page: the cards read like metadata, and the
personal voice that defines the travel section is missing. Rendering the
Markdown body in the card fixes that without adding new pages or images.

## Current state

`src/components/TravelCard.astro:1-13`:

```astro
---
/* کارت سفر — قاب پرتره ۴/۵ برای عکس‌های عمودی مالک.
   هر عکس نقطه‌ی کانونی خودش را از imagePosition می‌گیرد تا چهره/سوژه
   در کراپ بریده نشود. بدون عکس: پنل تایپوگرافیک صادقانه. */
import type { CollectionEntry } from "astro:content";

type Props = { entry: CollectionEntry<"travels"> };
const { entry } = Astro.props as Props;
const key = entry.id.replace(/\.mdx?$/, "");
const { data } = entry;
const alt = data.imageAlt ?? `سفر به ${data.destination}`;
const position = data.imagePosition ?? "50% 50%";
---
```

The rendered card body currently shows only:

```astro
  <div class="border-t p-5" style="border-color: var(--border);">
    <h3 id={`travel-${key}`} class="font-bold">{data.destination}</h3>
    <p class="mt-1 font-mono text-xs" style="color: var(--muted);">{data.date}</p>
    <p class="mt-2 text-sm" style="color: var(--muted);">{data.description}</p>
    {data.instagramUrl && ( ... )}
  </div>
```

`src/content/travels/dalakhani.md:15` has an unrendered body:

```markdown
سبزترین دره‌ای که دیده‌ام؛ دوربین خیس شد، ارزشش را داشت.
```

The same pattern exists in `dareh-marg.md` and `yakh-morad.md`.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Typecheck | `npm run typecheck` | exit 0 |
| Tests | `npm test` | 23 pass |
| Build | `npm run build` | exit 0 |
| Gate | `bash scripts/verify.sh` | exit 0 |

## Scope

**In scope**:

- `src/components/TravelCard.astro`
- `tests/site-structure.test.mjs` (one new test)
- `README.md` (one content bullet)

**Out of scope**: travel frontmatter, the Markdown bodies, image crops,
`TravelCard` layout outside the body insertion, adding travel detail pages.

## Steps

### Step 1: Render the entry body

In `src/components/TravelCard.astro`:

1. Change the import to include `render`:

```astro
import { render, type CollectionEntry } from "astro:content";
```

2. After `const { data } = entry;`, add:

```ts
const { Content } = await render(entry);
```

3. After the description paragraph, before the Instagram link, add:

```astro
    <div class="travel-note mt-2 text-sm" style="color: var(--muted);">
      <Content />
    </div>
```

Keep the description visible; the body is the personal note beneath it.

4. In the component's `<style>` block, add:

```css
  .travel-note :global(p) {
    margin: 0;
  }
  .travel-note :global(p + p) {
    margin-top: 0.5rem;
  }
```

**Verify**: `grep -n "await render(entry)\|<Content />\|travel-note" src/components/TravelCard.astro`
→ all three present.

### Step 2: Add the structural guard

Append this test inside the existing `describe("persian editorial slice", ...)`
in `tests/site-structure.test.mjs`, before the closing `});`:

```js
  it("renders the authored travel note body", () => {
    // The Markdown body is the personal note; the card must render it instead
    // of showing only frontmatter metadata.
    const card = readFileSync(`${ROOT}src/components/TravelCard.astro`, "utf8");
    ok(card.includes("await render(entry)"), "TravelCard must render the entry body");
    ok(card.includes("<Content />"), "TravelCard must output the rendered note");
    const raw = readFileSync(`${ROOT}src/content/travels/dalakhani.md`, "utf8");
    const body = raw.split("---")[2] ?? "";
    ok(body.trim().length > 0, "travel note body must not be empty");
  });
```

**Verify**: `npm test` → 23 pass.

### Step 3: Prove the text reaches the built HTML

```bash
npm run build
grep -q "سبزترین دره‌ای" dist/سفرها/index.html && echo "travels: note rendered"
grep -q "جایی که اسمش" dist/index.html && echo "home: note rendered"
```

Both lines must print. This is the behavioral proof that `render()` is wired,
not just that the source mentions it.

### Step 4: Document the body

In `README.md` under `## Content`, add one bullet:

```markdown
- A travel entry's Markdown body is rendered as the personal note beneath its
  frontmatter description; write it as prose, not as another metadata field.
```

### Step 5: Run the gate

**Verify**: `bash scripts/verify.sh` → exit 0.

## Test plan

- New test: one `it(...)` block (Step 2) asserting the card uses `render()` and
  `<Content />` and that the source travel body is non-empty. It fails on the
  current card.
- Existing 22 tests must pass (23 total).
- Build-output proof: the note text appears in both the travels index and the
  home travel preview (Step 3). No permanent browser test is added; the QA
  script should still pass with no overflow after the taller cards.

## Done criteria

- [ ] `TravelCard` imports `render` and calls `await render(entry)`.
- [ ] The rendered `<Content />` is inside the card, below the description.
- [ ] The note text appears in `dist/سفرها/index.html` and `dist/index.html`.
- [ ] `npm run typecheck` exits 0.
- [ ] `npm test` exits 0 with 23 pass.
- [ ] `npm run build` exits 0.
- [ ] `bash scripts/verify.sh` exits 0.
- [ ] Only the three in-scope files plus `plans/README.md` are modified.
- [ ] `plans/README.md` row 022 is DONE.

## STOP conditions

- `render(entry)` is unavailable for the `travels` collection in this Astro
  version. Report the type error; do not fall back to `entry.body` raw HTML.
- A travel body contains markup that breaks the card layout or introduces a
  heading/overflow in the QA script. Report it; do not strip the content.
- The built HTML does not contain the note despite the source change; inspect
  the Astro build output and report.
- A step requires touching an out-of-scope file.

## Maintenance notes

- The card now has three text layers: destination/date, factual description,
  personal Markdown note. Keep the note short; it is not a detail page.
- If travel detail pages are added later, this card can keep the first note and
  link to the page; do not duplicate the full body in both places.
- `:global` is required because the Markdown content is not scoped by Astro.
