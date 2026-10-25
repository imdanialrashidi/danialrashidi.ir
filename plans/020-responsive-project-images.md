# Plan 020: Serve project screenshots at the size they are displayed

> **Executor instructions**: Follow this plan exactly. Run every verification
> command. If a STOP condition occurs, stop and report. When done, update row
> 020 in `plans/README.md` to DONE.
>
> **Drift check**: `git diff --stat 1754f74..HEAD -- src/components/ProjectImage.astro src/components/ProjectRow.astro src/components/ProjectSpread.astro src/pages/پروژه‌ها/[slug].astro package.json README.md tests/site-structure.test.mjs`
> Prior batch-3 plans may have changed `package.json`, `README.md`, and the
> test file; that is expected. Compare the component excerpts.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: 018, 019 (shared test file)
- **Category**: perf
- **Planned at**: commit `1754f74`, 2026-10-21

## Why this matters

`ProjectRow` displays each screenshot in a ~190px-wide thumbnail on desktop,
but the `<img>` points at the full 1440–1840px source (34–99KB each). The
projects index and home page therefore transfer several hundred kilobytes of
image data that the browser immediately downsamples, and the detail page loads
a full-size screenshot for a ~480px aside. There is no `srcset`, so the
browser has no smaller candidate. This plan adds 480w/960w WebP variants,
`srcset`/`sizes` in `ProjectImage`, and a generator script so future images do
not regress the pattern.

## Current state

`src/components/ProjectImage.astro:1-27`:

```astro
type Props = {
  image?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  title: string;
  faTitle?: string;
  monogram: string;
  eager?: boolean;
};

const { image, imageAlt, imageWidth, imageHeight, title, faTitle, monogram, eager = false } = Astro.props as Props;
const alt = imageAlt ?? `تصویر پروژه‌ی ${faTitle ?? title}`;
...
      <img
        src={image}
        alt={alt}
        width={imageWidth}
        height={imageHeight}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        class="project-img block h-auto w-full"
      />
```

Usages:

- `src/components/ProjectRow.astro:14` — thumbnail column, desktop 190px.
- `src/components/ProjectSpread.astro:14` — featured half-width spread.
- `src/pages/پروژه‌ها/[slug].astro:65` — detail aside, 5/12 column.

Current project images (all in `public/images/projects/`):

| Project | Image | Intrinsic |
|---|---|---|
| elsa-hamrah | `elsa-hamrah-hero.82efe0d6.webp` | 1440×900 |
| isbatab | `isbatab-hero.859510be.webp` | 1440×900 |
| mobile-khorsandi | `mobile-khorsandi-hero.webp` | 1920×936 |
| noveno | `noveno.webp` | 1840×932 |
| php-ielts-house | `php-ielts-house-hero.bd5bd7ff.webp` | 1440×900 |
| study | `study-index.png` | 1840×932 |

ImageMagick is available at `/usr/bin/magick` in this environment. A test run
produced `noveno-480.webp` at 5.8KB and `noveno-960.webp` at 14.8KB from the
34KB original.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Generate variants | `npm run assets:projects` | exit 0, 12 new WebP files |
| Typecheck | `npm run typecheck` | exit 0 |
| Tests | `npm test` | 21 pass |
| Build | `npm run build` | exit 0 |
| Gate | `bash scripts/verify.sh` | exit 0 |

## Scope

**In scope**:

- `src/components/ProjectImage.astro`
- `src/components/ProjectRow.astro`
- `src/components/ProjectSpread.astro`
- `src/pages/پروژه‌ها/[slug].astro`
- `package.json` (add the `assets:projects` script)
- `scripts/generate-project-variants.mjs` (create)
- `public/images/projects/*-480.webp` and `*-960.webp` (generated assets)
- `tests/site-structure.test.mjs` (one new test)
- `README.md` (one content bullet)

**Out of scope**: the original project images, project frontmatter, the hero
portrait, travel images, OG cards.

## Steps

### Step 1: Add the variant generator

Create `scripts/generate-project-variants.mjs`:

```js
// Regenerates the 480w/960w WebP variants used by ProjectImage's srcset.
// Requires ImageMagick (`magick`). Run after replacing a project screenshot.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";

const root = new URL("../", import.meta.url).pathname;
const contentDir = `${root}src/content/projects`;

for (const file of readdirSync(contentDir).filter((name) => name.endsWith(".md"))) {
  const raw = readFileSync(`${contentDir}/${file}`, "utf8");
  const image = raw.match(/^image: "(.*)"$/m)?.[1];
  if (!image) continue;
  const stem = `${root}public${image.replace(/\.[^.]+$/, "")}`;
  for (const width of [480, 960]) {
    execFileSync(
      "magick",
      [`${root}public${image}`, "-resize", `${width}x>`, "-quality", "78", `${stem}-${width}.webp`],
      { stdio: "inherit" },
    );
  }
}
```

Add to `package.json` scripts (next to `build`/`preview`):

```json
    "assets:projects": "node scripts/generate-project-variants.mjs",
```

Run `npm run assets:projects`.

**Verify**:

```bash
find public/images/projects -name '*-480.webp' | wc -l   # 6
find public/images/projects -name '*-960.webp' | wc -l   # 6
identify public/images/projects/noveno-480.webp          # 480x...
identify public/images/projects/noveno-960.webp          # 960x...
```

All variants must be smaller than their originals.

### Step 2: Add `srcset` and `sizes` to ProjectImage

In `src/components/ProjectImage.astro`:

1. Add `sizes?: string;` to `Props` and destructure it with a default:
   `sizes = "100vw"`.
2. Before the markup, derive the variant list:

```ts
const stem = image?.replace(/\.[^.]+$/, "");
const variants = image && stem ? [`${stem}-480.webp 480w`, `${stem}-960.webp 960w`] : [];
if (image && imageWidth) variants.push(`${image} ${imageWidth}w`);
const srcset = variants.length ? variants.join(", ") : undefined;
```

3. Add `srcset={srcset}` and `sizes={sizes}` to the `<img>`. Keep `src`, `alt`,
   `width`, `height`, `loading`, `decoding`, and classes unchanged.

**Verify**: `grep -n "srcset\|sizes" src/components/ProjectImage.astro` shows
the new attributes.

### Step 3: Give each usage accurate `sizes`

- `ProjectRow.astro`: add
  `sizes="(max-width: 640px) 100vw, 190px"` to the `ProjectImage`.
- `ProjectSpread.astro`: add
  `sizes="(max-width: 768px) 100vw, 45vw"`.
- `src/pages/پروژه‌ها/[slug].astro`: add
  `sizes="(max-width: 768px) 100vw, 480px"`.

Do not change the layout classes or image dimensions.

**Verify**: `grep -rn "sizes=" src/components/ProjectRow.astro src/components/ProjectSpread.astro 'src/pages/پروژه‌ها/[slug].astro'`
→ three matches.

### Step 4: Add the variant guard

Append this test inside the existing `describe("persian editorial slice", ...)`
in `tests/site-structure.test.mjs`, before the closing `});`:

```js
  it("ships responsive variants for every project image", () => {
    // ProjectImage derives `<stem>-480.webp` / `<stem>-960.webp` for srcset.
    // If an image is replaced without regenerating variants, the page would
    // request a missing file; fail here instead.
    const files = readdirSync(`${ROOT}src/content/projects`).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const image = frontmatter(`${ROOT}src/content/projects/${file}`).image;
      ok(image, `${file} missing image`);
      const stem = image.replace(/\.[^.]+$/, "");
      for (const width of [480, 960]) {
        const variant = `${ROOT}public${stem}-${width}.webp`;
        ok(existsSync(variant), `${file} missing ${width}w variant`);
        ok(statSync(variant).size < statSync(`${ROOT}public${image}`).size, `${file} ${width}w variant is not smaller`);
      }
    }
  });
```

The file already imports `readdirSync`, `existsSync`, `statSync`, `ok`, and has
`frontmatter()` in scope.

**Verify**: `npm test` → 21 pass.

### Step 5: Document the regeneration step

In `README.md` under `## Content`, add one bullet:

```markdown
- Project screenshots also ship 480w/960w WebP variants
  (`<stem>-480.webp`, `<stem>-960.webp`) used by the `srcset` in
  `ProjectImage`. After replacing a screenshot, run `npm run assets:projects`
  (requires ImageMagick `magick`) and commit the variants.
```

### Step 6: Prove the built markup and run the gate

```bash
npm run build
grep -o 'srcset="[^"]*"' 'dist/پروژه‌ها/index.html' | head -3
grep -o 'sizes="[^"]*"' 'dist/پروژه‌ها/index.html' | head -3
bash scripts/verify.sh
```

Expected: `srcset` includes `-480.webp 480w`, `-960.webp 960w`, and the
original width descriptor; `sizes` matches the row/spread values; gate exits 0.

## Test plan

- New test: one `it(...)` block (Step 4) asserting every project image has
  480w/960w variants smaller than the original. It fails if an image is added
  without running the generator.
- Existing 20 tests must pass (21 total).
- Build proof: `srcset`/`sizes` present in the generated projects index HTML.
- Visual QA: run the optional QA script; no overflow/console errors. The
  thumbnails should look identical at their display sizes.

## Done criteria

- [ ] `npm run assets:projects` generates 6×480w and 6×960w WebP files.
- [ ] Every variant is smaller than its original (test enforces).
- [ ] `ProjectImage` emits `srcset` and `sizes`.
- [ ] Row, spread, and detail usages pass accurate `sizes`.
- [ ] `npm run typecheck` exits 0.
- [ ] `npm test` exits 0 with 21 pass.
- [ ] `npm run build` exits 0; built HTML contains the variant `srcset`.
- [ ] `bash scripts/verify.sh` exits 0.
- [ ] Only the in-scope files/assets plus `plans/README.md` are modified.
- [ ] `plans/README.md` row 020 is DONE.

## STOP conditions

- `magick` is unavailable or fails to read an original. Report the command and
  error; do not add a dependency or use a different image library without
  approval.
- A generated variant is larger than the original (unexpected for these
  screenshots); report the file and dimensions.
- The built HTML does not contain the variant `srcset` (the component change is
  not being applied); do not claim success from source files alone.
- A layout or image aspect changes visibly in the QA screenshots; report it
  instead of changing crops.
- A step requires touching an out-of-scope file.

## Maintenance notes

- The variant naming convention is `<original stem>-480.webp` and
  `<original stem>-960.webp`; `ProjectImage` derives it. Keep the convention if
  images move.
- Run `npm run assets:projects` after replacing or adding a project screenshot;
  the test will fail until the variants exist.
- If a larger display size is introduced, add a wider variant and update the
  `sizes` prop at that usage; do not raise the existing sizes to force a larger
  download.
