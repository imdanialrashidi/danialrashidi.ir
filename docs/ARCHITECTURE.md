# Architecture

Describe the system as it is. Keep this a map that helps an agent find the
right code and understand the boundaries.

## System overview

A build-time static site. Astro reads TypeScript config, Markdown content
collections, and `.astro` components, validates frontmatter, and emits plain
HTML, CSS, and local assets into `dist/`. GitHub Pages serves that output. There
is no server process, database, session, or runtime API.

## Components

| Component | Responsibility | Location |
| --- | --- | --- |
| Routes | Persian pages, project details, 404, robots | `src/pages/**` |
| Layout | Document head, SEO/OG metadata, JSON-LD, theme bootstrap, view transitions | `src/layouts/Base.astro` |
| UI components | Masthead, footer, project/travel cards, support panel, icons, signature | `src/components/` |
| Site config | Identity, socials, navigation, study URL, domain | `src/config/site.ts` |
| Support config | Public card and support methods | `src/config/support.ts` |
| Content schema | Zod validation for projects and travels | `src/content.config.ts` |
| Content | Project and travel Markdown | `src/content/{projects,travels}/` |
| Styles | Design tokens and global Tailwind/CSS | `src/styles/` |
| Static assets | Portrait, screenshots, travel photos, social cards, favicon | `public/images/`, `public/` |
| Asset scripts | Responsive project variants, OG cards, brand renders | `scripts/generate-*.mjs`, `scripts/brand/` |
| Verification | Full gate, project lane, browser QA | `scripts/verify.sh`, `scripts/project-verify.sh`, `scripts/qa-screenshots.mjs` |
| CI | Quality gate and GitHub Pages deploy | `.github/workflows/` |

## Data flow

1. Build starts with `astro build`.
2. Content collections load Markdown and validate frontmatter through the Zod
   schemas in `src/content.config.ts`; invalid entries fail the build.
3. Pages import `SITE`, `PROFILE`, and `SUPPORT_CARD`/`SUPPORT_METHODS` from
   `src/config/`, so identity, links, and support data have one source.
4. Components render project/travel cards, pages, metadata, and JSON-LD.
5. Astro emits static HTML and hashed assets into `dist/`.
6. `deploy.yml` uploads `dist/` to GitHub Pages on a push to `main`;
   `quality.yml` runs `bash scripts/verify.sh` on pull requests and `main`.

Trust boundaries: content and configuration are first-party and reviewed in
Git; external links are data, not executable authority. There are no secrets in
the site, no user input, and no server-side authorization surface.

## Boundaries and dependencies

- Allowed dependency direction: pages/components → config/content → styles and
  static assets. Components must not hard-code identity or support data.
- Forbidden: importing build tooling or Node-only modules into browser code;
  hotlinking screenshots; adding a backend or client framework for a static
  behavior.
- External services: GitHub Pages (hosting) and GitHub Actions (CI/deploy) only.
- Data stores: none. Markdown in Git is the content store.

## Invariants

- `SITE.domain` is the only domain source; `astro.config.mjs`, canonical URLs,
  robots, and sitemap derive from it. Breaking this changes public URLs.
- `src/config/site.ts` owns identity, socials, navigation, and the study URL;
  components reference it. Tests enforce the study URL rule.
- Exactly seven projects ship, with Noveno before Study in the featured order.
  Adding or removing one requires updating the content, tests, images, and count
  copy together.
- Every project image has a real file, a Persian `imageAlt`, and intrinsic
  `imageWidth`/`imageHeight`; every travel image has a real file and Persian alt.
- Responsive project variants and per-project OG cards exist for every project.
- `trailingSlash: "always"`, `lang="fa"`, `dir="rtl"`, and static output are
  non-negotiable without an owner decision.
- Every `target="_blank"` link carries `rel="noopener"`; social links are links,
  not ARIA list items; theme choice survives client-side navigation; reveal
  content is visible without JavaScript.

## Failure modes

| Failure | Detection | User impact | Recovery |
| --- | --- | --- | --- |
| Invalid content frontmatter | Content schema/build failure | Build fails, no deploy | Fix Markdown/schema; rerun gate |
| Missing image or alt text | Structural tests | Broken or inaccessible card | Restore file or update frontmatter |
| Stale responsive variant/OG card | Tests assert files exist | Wrong or heavy preview image | Run `npm run assets:projects` / `assets:og` |
| Broken route or canonical | Structural tests + build | 404 or wrong SEO URL | Fix page/config; rerun gate |
| CI deploy failure | Actions run status | Site not updated | Inspect workflow, fix, rerun; no manual main write |
| Theme/no-JS regression | Structural tests + browser QA | Wrong theme or invisible content | Fix `Base.astro`; verify both paths |

## Where to make changes

- Identity, social links, navigation, study URL, domain: `src/config/site.ts`.
- Support card or methods: `src/config/support.ts` (never invent data).
- Project/travel content: `src/content/{projects,travels}/*.md`, following
  `README.md` and the schema.
- Page structure: `src/pages/`; shared UI: `src/components/`.
- Visual direction and tokens: `docs/DESIGN.md`, `src/styles/tokens.css`,
  `src/styles/global.css`.
- Verification commands: `docs/QUALITY.md`, `scripts/`.
- Generated assets: edit the source screenshot/HTML, then run the owning
  generator; never hand-edit variants or cards.

## Known debt and constraints

- Static only: no forms, search, comments, or dynamic content.
- The asset generators require ImageMagick `magick`; browser QA requires
  Chromium at `/usr/bin/chromium`.
- Structural tests read source files, so content changes often require a test
  update by design.
- Astro 7 and Tailwind 4 are current pins; upgrades need an explicit owner
  decision and the full gate.

## Related documents

- Product: [PRODUCT.md](PRODUCT.md)
- Interfaces and behavior: [DESIGN.md](DESIGN.md)
- Verification: [QUALITY.md](QUALITY.md)
