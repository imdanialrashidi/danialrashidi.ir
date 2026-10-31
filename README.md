# danialrashidi.ir

Danial Rashidi's personal site: a Persian, right-to-left home for projects,
travel notes, an about page, contact links, and a quiet support page. It is a
fully static Astro site with no backend, database, auth, forms, or analytics —
content lives in Markdown and is built to plain HTML.

Live at <https://danialrashidi.ir>.

## Stack

- Astro 7 (static output, Persian routes, Markdown content collections)
- TypeScript + Tailwind CSS 4 via `@tailwindcss/vite`
- Self-hosted Vazirmatn (`@fontsource/vazirmatn`) — no third-party font CDN
- GitHub Pages deployment via GitHub Actions

## Quick start

```sh
npm ci
npm run dev          # http://localhost:4321
```

Before handing off a change:

```sh
npm run typecheck
npm test
npm run build
bash scripts/verify.sh
```

Node.js >=22.19.0 is required (see `package.json` `engines`).

`bash scripts/verify.sh` is the canonical gate. It runs the workflow
self-checks, then delegates to `scripts/project-verify.sh`, which runs
typecheck, the Node test files, and a production build in that order. `npm
test` alone runs the structural/unit tests: site structure, the support card,
and the navigation active-state helper.

## Routes

| Route | Source | Purpose |
|---|---|---|
| `/` | `src/pages/index.astro` | home |
| `/درباره/` | `src/pages/درباره/index.astro` | about |
| `/پروژه‌ها/` | `src/pages/پروژه‌ها/index.astro` | project index |
| `/پروژه‌ها/<slug>/` | `src/pages/پروژه‌ها/[slug].astro` | project detail |
| `/سفرها/` | `src/pages/سفرها/index.astro` | travel notes |
| `/حمایت/` | `src/pages/حمایت/index.astro` | support |
| `/ارتباط/` | `src/pages/ارتباط/index.astro` | contact |
| `/404` | `src/pages/404.astro` | not found |

Persian filenames are intentional; URLs are percent-encoded in links.
`trailingSlash: "always"` and the canonical site URL are set in
`astro.config.mjs`.

## Content

- Projects live in `src/content/projects/*.md`; the frontmatter schema is
  `src/content.config.ts`. The test suite asserts exactly seven projects and the
  “۰۷ پروژه” count on the index page, so update
  `tests/site-structure.test.mjs` when adding or removing one.
- Travels live in `src/content/travels/*.md`; each entry needs `destination`,
  `date`, and `description`. Travel photos are optional; when an entry sets
  `image`, it also needs a descriptive Persian `imageAlt`, and the file must
  exist under `public/images/travels/`.
- A travel entry's Markdown body is rendered as the personal note beneath its
  frontmatter description; write it as prose, not as another metadata field.
- Project images live in `public/images/projects/`. A project image needs
  `imageAlt` plus intrinsic `imageWidth`/`imageHeight` (a layout-shift guard
  enforced by the tests).
- Project screenshots also ship 480w/960w WebP variants
  (`<stem>-480.webp`, `<stem>-960.webp`) used by the `srcset` in
  `ProjectImage`. After replacing a screenshot, run `npm run assets:projects`
  (requires ImageMagick `magick`) and commit the variants.
- Each project has a 1200×630 JPEG social card at
  `public/images/og/projects/<slug>.jpg`, used by the project detail page's
  Open Graph/Twitter metadata. After replacing a project screenshot, run
  `npm run assets:og` (requires ImageMagick `magick`) and commit the card.
- Identity, social links, navigation order, and the study-center URL are
  centralized in `src/config/site.ts`. Support data is in
  `src/config/support.ts`; an unconfigured card renders an honest empty state
  rather than a placeholder number.
- Design tokens live in `src/styles/tokens.css`; the owner's design direction
  and rationale are in `docs/DESIGN.md`.

## Verification and QA

The gate:

```sh
bash scripts/verify.sh
```

Optional browser QA against a built copy of the site:

```sh
npm run build
python3 -m http.server 4321 -d dist
QA_BASE=http://127.0.0.1:4321 node scripts/qa-screenshots.mjs
```

The script expects Chromium at `/usr/bin/chromium`. It checks the home, about,
projects, project detail, travels, support, and contact routes at desktop and
mobile widths, collecting console errors, failed requests, horizontal overflow,
and page metadata, and writes screenshots and a report to `.artifacts/qa/`
(ignored by Git). This harness is not part of the CI gate.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which installs from
the lockfile, builds, uploads `dist/`, and deploys to GitHub Pages.
`.github/workflows/quality.yml` runs the same gate on pull requests and pushes
to `main`.

## Agent workflow

This repository uses the DeepSeek Harness (DSH) workflow. `AGENTS.md` is the
always-loaded entry point; project skills live in `.dsh/skills/` — `quick-fix`,
`spec`, `build`, `verify`, `review`, `test-design`, plus the copy-editing
`no-ai-slop` skill. Invoke a skill as `/name`, or let the agent load it from the
catalog.

The six workflow skills mirror
[dsh-workflow](https://github.com/imdanialrashidi/dsh-workflow) at commit
`93c9281`; this repository adds `no-ai-slop` for copy work.

Default delivery is local: work stays in the working tree unless the owner asks
for a commit, push, or pull request.

- `AGENTS.md` — commands, routing, boundaries, and where to start reading.
- `docs/PRODUCT.md` — problem, users, outcomes, and non-goals.
- `docs/ARCHITECTURE.md` — system map, boundaries, invariants, and failure modes.
- `docs/DESIGN.md` — owner direction, tokens, responsive and visual contract.
- `docs/QUALITY.md` — verification commands, test layers, and definition of done.
