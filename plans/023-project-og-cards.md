# Plan 023: Give each project its own social preview card

> **Executor instructions**: Follow this plan exactly. Run every verification
> command. If a STOP condition occurs, stop and report. When done, update row
> 023 in `plans/README.md` to DONE.
>
> **Drift check**: `git diff --stat 1754f74..HEAD -- src/layouts/Base.astro src/pages/پروژه‌ها/[slug].astro package.json README.md tests/site-structure.test.mjs`
> Plans 018–022 may have changed `package.json`, README, and the test file;
> compare the Base/detail excerpts.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: 022 (shared test file)
- **Category**: direction / SEO
- **Planned at**: commit `1754f74`, 2026-10-21

## Why this matters

Every page currently shares `SITE.ogImage`, so sharing a project URL shows the
generic site cover instead of the project screenshot. Project detail pages
already have a real screenshot, alt text, and an `article` Open Graph type;
the strongest visual is sitting unused. This plan generates a 1200×630 JPEG
card per project, lets `Base` accept a page-level image/alt, and wires the
project detail page to its card. JPEG is used instead of the source WebP for
social-platform compatibility.

## Current state

`src/layouts/Base.astro:11-22`:

```ts
type Props = {
  title: string;
  description?: string;
  path?: string;
  noindex?: boolean;
  ogType?: "website" | "article";
};

const { title, description = SITE.description, path = "/", noindex = false, ogType = "website" } = Astro.props;
const canonical = new URL(path, SITE.domain).toString();
const ogImage = new URL(SITE.ogImage, SITE.domain).toString();
```

`src/layouts/Base.astro:57-70` uses that `ogImage` for `og:image` and
`twitter:image`, and `SITE.ogImageAlt` for `og:image:alt`; the width/height are
hardcoded `1200`/`630`.

`src/pages/پروژه‌ها/[slug].astro:19-24` currently passes only path, title,
description, and `ogType`:

```astro
<Base
  path={`/پروژه‌ها/${slug}/`}
  title={data.faTitle ?? data.title}
  description={data.description}
  ogType="article"
>
```

The six project slugs are `elsa-hamrah`, `isbatab`, `mobile-khorsandi`,
`noveno`, `php-ielts-house`, and `study`. Their source images live under
`public/images/projects/` and are referenced by the `image` frontmatter field.

ImageMagick is available at `/usr/bin/magick`. A test command
`magick noveno.webp -resize 1200x630^ -gravity north -extent 1200x630 -quality 82 out.jpg`
produced a valid 1200×630 JPEG.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Generate cards | `npm run assets:og` | exit 0, six JPEGs |
| Typecheck | `npm run typecheck` | exit 0 |
| Tests | `npm test` | 24 pass |
| Build | `npm run build` | exit 0 |
| Gate | `bash scripts/verify.sh` | exit 0 |

## Scope

**In scope**:

- `src/layouts/Base.astro`
- `src/pages/پروژه‌ها/[slug].astro`
- `package.json` (add the `assets:og` script)
- `scripts/generate-project-og.mjs` (create)
- `public/images/og/projects/<slug>.jpg` (six generated cards)
- `tests/site-structure.test.mjs` (one new test)
- `README.md` (one content bullet)

**Out of scope**: the generic `public/images/og-cover.jpg`, project images,
the Person JSON-LD, travel pages (none exist), OG image dimensions.

## Steps

### Step 1: Add the card generator

Create `scripts/generate-project-og.mjs`:

```js
// Generates 1200x630 JPEG social cards from each project screenshot.
// Requires ImageMagick (`magick`). Run after adding or replacing a project.
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync } from "node:fs";

const root = new URL("../", import.meta.url).pathname;
const outDir = `${root}public/images/og/projects`;
const contentDir = `${root}src/content/projects`;
mkdirSync(outDir, { recursive: true });

for (const file of readdirSync(contentDir).filter((name) => name.endsWith(".md"))) {
  const slug = file.replace(/\.md$/, "");
  const raw = readFileSync(`${contentDir}/${file}`, "utf8");
  const image = raw.match(/^image: "(.*)"$/m)?.[1];
  if (!image) continue;
  execFileSync(
    "magick",
    [
      `${root}public${image}`,
      "-resize",
      "1200x630^",
      "-gravity",
      "north",
      "-extent",
      "1200x630",
      "-quality",
      "82",
      `${outDir}/${slug}.jpg`,
    ],
    { stdio: "inherit" },
  );
}
```

Add to `package.json` scripts:

```json
    "assets:og": "node scripts/generate-project-og.mjs",
```

Run `npm run assets:og`.

**Verify**:

```bash
ls public/images/og/projects/*.jpg | wc -l   # 6
identify public/images/og/projects/noveno.jpg  # 1200x630 JPEG
```

The six files must be 1200×630.

### Step 2: Let Base accept a page-level image and alt

In `src/layouts/Base.astro`:

1. Add to `Props`:

```ts
  ogImage?: string;
  ogImageAlt?: string;
```

2. Destructure with defaults and compute the absolute URL:

```ts
const {
  title,
  description = SITE.description,
  path = "/",
  noindex = false,
  ogType = "website",
  ogImage = SITE.ogImage,
  ogImageAlt = SITE.ogImageAlt,
} = Astro.props;
const canonical = new URL(path, SITE.domain).toString();
const ogImageUrl = new URL(ogImage, SITE.domain).toString();
```

3. Replace the existing `ogImage` variable in the meta tags with
   `ogImageUrl`, and replace `SITE.ogImageAlt` with `ogImageAlt`. Keep the
   width/height meta tags at `1200`/`630`; the generated cards are exactly that
   size. The Person JSON-LD image stays `PROFILE.photoSrc`.

**Verify**: `grep -n "ogImageUrl\|ogImageAlt" src/layouts/Base.astro` shows
both the props and meta-tag usage; `npm run build` still exits 0.

### Step 3: Point the project detail page at its card

In `src/pages/پروژه‌ها/[slug].astro`, add to the `<Base>` call:

```astro
  ogImage={`/images/og/projects/${slug}.jpg`}
  ogImageAlt={data.imageAlt ?? `تصویر پروژه‌ی ${data.faTitle ?? data.title}`}
```

The `slug` variable already exists above the markup. Keep `ogType="article"`.

**Verify**:

```bash
npm run build
grep -o 'og:image" content="[^"]*"' 'dist/پروژه‌ها/noveno/index.html'
grep -o 'og:image:alt" content="[^"]*"' 'dist/پروژه‌ها/noveno/index.html'
grep -o 'og:image:width" content="[^"]*"' 'dist/پروژه‌ها/noveno/index.html'
```

Expected: `https://danialrashidi.ir/images/og/projects/noveno.jpg`, the Persian
project alt, and `1200` + `630`. The home page must still use the generic
`og-cover.jpg`; check `dist/index.html` if unsure.

### Step 4: Add the card guard

Append this test inside the existing `describe("persian editorial slice", ...)`
in `tests/site-structure.test.mjs`, before the closing `});`:

```js
  it("ships a social card for every project", () => {
    const files = readdirSync(`${ROOT}src/content/projects`).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const slug = file.replace(/\.md$/, "");
      const card = `${ROOT}public/images/og/projects/${slug}.jpg`;
      ok(existsSync(card), `${file} missing OG card`);
      const bytes = readFileSync(card);
      ok(bytes[0] === 0xff && bytes[1] === 0xd8, `${slug} OG card must be a JPEG`);
    }
  });
```

**Verify**: `npm test` → 24 pass.

### Step 5: Document the regeneration step

In `README.md` under `## Content`, add one bullet:

```markdown
- Each project has a 1200×630 JPEG social card at
  `public/images/og/projects/<slug>.jpg`, used by the project detail page's
  Open Graph/Twitter metadata. After replacing a project screenshot, run
  `npm run assets:og` (requires ImageMagick `magick`) and commit the card.
```

### Step 6: Run the gate

**Verify**: `bash scripts/verify.sh` → exit 0.

## Test plan

- New test: one `it(...)` block (Step 4) asserting every project has a JPEG
  card. It fails on the current tree because the directory does not exist.
- Existing 23 tests must pass (24 total).
- Build-output proof: the project detail HTML has the project card URL, alt,
  and 1200×630 dimensions; the home page retains the generic cover (Step 3).
- The cards are generated, not hand-edited; `identify` confirms dimensions.

## Done criteria

- [ ] `npm run assets:og` generates six 1200×630 JPEGs.
- [ ] `Base` accepts `ogImage`/`ogImageAlt` and uses absolute URLs.
- [ ] Project detail pages pass their generated card and Persian alt text.
- [ ] `dist/پروژه‌ها/noveno/index.html` contains the project card URL and
      1200/630 dimensions.
- [ ] Home still uses `SITE.ogImage`.
- [ ] `npm run typecheck` exits 0.
- [ ] `npm test` exits 0 with 24 pass.
- [ ] `npm run build` exits 0.
- [ ] `bash scripts/verify.sh` exits 0.
- [ ] Only the in-scope files/assets plus `plans/README.md` are modified.
- [ ] `plans/README.md` row 023 is DONE.

## STOP conditions

- `magick` is unavailable or a source image cannot be read. Report the command
  and error; do not add a package or use a different library without approval.
- A generated card is not 1200×630 or is not a valid JPEG.
- The project detail HTML still shows the generic `og-cover.jpg`; the prop is
  not wired.
- The home page loses its generic cover (the default must remain).
- A step requires touching an out-of-scope file.

## Maintenance notes

- Regenerate cards after replacing a project screenshot; the test only checks
  existence/JPEG, so `identify` is the dimension proof.
- The crop is `-gravity north` so the top of each screenshot (header/nav) is
  preserved. If a project screenshot's important content is lower, adjust the
  generator's gravity per image, not the card dimensions.
- Social platforms cache previews; a changed card may take time to appear.
- The generic `og-cover.jpg` remains the default for home/about/travels.
