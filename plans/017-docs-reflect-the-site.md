# Plan 017: Make README, CHANGELOG, and CONTRIBUTING describe this site

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 1754f74..HEAD -- README.md CHANGELOG.md CONTRIBUTING.md`
> If any of these files changed since this plan was written, compare the
> "Current state" excerpts against the live files before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: 013 (the README commands should describe a gate that is
  green in CI)
- **Category**: docs
- **Planned at**: commit `1754f74`, 2026-10-21

## Why this matters

The repository is a live Persian personal site, but its three entry-point
docs describe the upstream omp workflow template. `README.md` opens with
"omp Production Workflow Template", tells the reader to install omp, and links
to `omp_workflow_guide.md`, which does not exist. It never mentions
`npm install`, `npm run dev`, the build, the content collections, or the
routes. `CHANGELOG.md` is a history of removed Pi/Context7 harness work, not
this site. `CONTRIBUTING.md`'s setup section only explains installing omp and
running the gate "before and after a workflow change"; a contributor cannot
learn how to run or edit the site from it. This is actively wrong
documentation, not merely missing documentation: the GitHub landing page and
the first-run path both mislead. Rewriting the three files is cheap and makes
the repository self-explanatory again.

## Current state

`./README.md:1-16`:

```markdown
# omp Production Workflow Template

A minimal, evidence-driven workflow for [oh-my-pi (omp)](https://omp.sh) ...

This template adds only what omp does **not** ship: ...

## What this template provides

- `AGENTS.md` — short progressive-disclosure map; ...
...
```

`./README.md:30-45` — the setup starts with installing omp, not this site:

```markdown
## Install

Install omp ([docs](https://omp.sh)):

```sh
curl -fsSL https://omp.sh/install | sh
```
```

`./README.md:55` — broken local link (the file does not exist):

```markdown
- جزئیات کامل، مثال‌ها و جدول عیب‌یابی: [`omp_workflow_guide.md`](omp_workflow_guide.md).
```

`./CONTRIBUTING.md:5-11`:

```markdown
## Setup

1. Use Node.js 22.19.0 or newer.
2. Install omp (`curl -fsSL https://omp.sh/install | sh`), then `/login` and `/model`.
3. Review project-local skills, commands, and scripts before trusting the repository.
4. Run `bash scripts/verify.sh` before and after a workflow change.
5. Work directly in the repository. ...
```

`./CHANGELOG.md:3-12` — the first entries are unrelated harness history:

```markdown
## Unreleased — DeepWiki MCP replaces Context7

- Replace `@upstash/context7-mcp@4.1.2` stdio MCP with the official DeepWiki remote MCP ...
- Drop the `CONTEXT7_API_KEY` env mapping ...
```

Verified missing paths referenced by the old docs:
`omp_workflow_guide.md`, `docs/EVALUATION.md`, `scripts/pi-doctor.sh`,
`scripts/verify-affected.mjs`, `docs/RESEARCH.md`.

Facts the new docs must use (verified in this repository):

- Live site: `https://danialrashidi.ir`; Persian, RTL, `lang="fa" dir="rtl"`.
- Static Astro 7.3.6 site, TypeScript, Tailwind 4 via `@tailwindcss/vite`,
  Markdown content collections, self-hosted Vazirmatn. No backend, database,
  auth, forms, analytics, or Instagram embed.
- Node.js requirement: `>=22.19.0` (from `package.json`).
- Commands: `npm ci`, `npm run dev`, `npm run typecheck` (`astro check`),
  `npm test` (Node test runner), `npm run build` (static `dist/`),
  `npm run preview`, `bash scripts/verify.sh` (canonical gate).
- `scripts/verify.sh` delegates to `scripts/project-verify.sh`, which runs
  typecheck → Node tests → build.
- Routes: `/`, `/درباره/`, `/پروژه‌ها/`, `/پروژه‌ها/[slug]/` (six project
  slugs), `/سفرها/`, `/حمایت/`, `/ارتباط/`, plus `404`.
- Content: `src/content/projects/*.md` (exactly six files, enforced by
  `tests/site-structure.test.mjs`) and `src/content/travels/*.md` (three
  files). Frontmatter schema: `src/content.config.ts`. Images:
  `public/images/projects/` and `public/images/travels/`; project images need
  `imageAlt` + `imageWidth`/`imageHeight`; travel images need `imageAlt` too.
- Identity/links/nav single source: `src/config/site.ts`. Support data:
  `src/config/support.ts` (owner-configured card; intended to be public on the
  site — do not add any other secret there). Design tokens:
  `src/styles/tokens.css`; design intent: `docs/DESIGN.md`.
- Deployment: `.github/workflows/deploy.yml` builds and deploys to GitHub Pages
  on push to `main`; `.github/workflows/quality.yml` runs the gate on
  `pull_request` and push to `main`.
- `scripts/qa-screenshots.mjs` is an optional local Chromium QA harness; it
  expects a built site served at `http://127.0.0.1:4321` and
  `/usr/bin/chromium`. It is not part of the CI gate.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `npm ci` | exit 0 |
| Dev server | `npm run dev` | serves on `http://localhost:4321` |
| Typecheck | `npm run typecheck` | exit 0 |
| Tests | `npm test` | 17 tests pass today (more after plans 014–016) |
| Build | `npm run build` | exit 0, 13 pages in `dist/` |
| Gate | `bash scripts/verify.sh` | exit 0 |
| Docs links | `grep -oE '\]\([^)#]+' README.md` | inspect; no template/missing paths |

## Scope

**In scope** (the only files you should modify):

- `README.md`
- `CHANGELOG.md`
- `CONTRIBUTING.md`

**Out of scope** (do NOT touch, even though they look related):

- `docs/DESIGN.md` — the design contract is the source of truth; do not
  rewrite it to match the README.
- `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, `docs/PLAN.md` — earlier
  planning deliberately deferred filling these shells; this plan does not
  reverse that decision.
- `AGENTS.md`, `docs/HARNESS.md`, `docs/QUALITY.md`, `docs/GIT_POLICY.md` —
  workflow policy; not product documentation.
- Any source file, workflow, or test. This is a documentation-only change.
- The support card value: never copy it into docs or examples.

## Git workflow

- Leave the change in the working tree. Do **not** commit, push, create a
  branch, or open a PR. The repository's solo default is explicit in
  `docs/GIT_POLICY.md`.

## Steps

### Step 1: Rewrite README.md for the live site

Replace the template marketing with a concise project README. Use this
section order and content contract; write the prose in the site's existing
calm, concrete voice (see `docs/DESIGN.md` "Content voice"). Do not use
marketing language.

Required skeleton (outer fence is four backticks so the inner command blocks
stay literal):

````markdown
# danialrashidi.ir

<2–3 sentences: Danial Rashidi's Persian RTL personal site — projects,
travel notes, about, contact, and a quiet support page. Static, no backend.>

## Stack

- Astro 7 (static output, Persian routes, content collections)
- TypeScript + Tailwind CSS 4 (`@tailwindcss/vite`)
- Self-hosted Vazirmatn (no third-party font CDN)
- GitHub Pages deployment

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

Node.js >=22.19.0 is required.

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

Persian filenames are intentional; URLs are percent-encoded and
`trailingSlash: "always"` is set in `astro.config.mjs`.

## Content

- Projects live in `src/content/projects/*.md`; the frontmatter schema is
  `src/content.config.ts`. The suite asserts exactly six projects, so update
  `tests/site-structure.test.mjs` when adding or removing one.
- Travels live in `src/content/travels/*.md`; each entry needs
  `destination`, `date`, and `description`, and optional image metadata.
- Project/travel images live in `public/images/projects/` and
  `public/images/travels/`. Project images need `imageAlt`, `imageWidth`, and
  `imageHeight`; travel images need `imageAlt` and dimensions too.
- Identity, social links, navigation, and the study-center URL are centralized
  in `src/config/site.ts`. Support data is in `src/config/support.ts`.
- Design tokens live in `src/styles/tokens.css`; the design contract is
  `docs/DESIGN.md`.

## Verification and QA

`bash scripts/verify.sh` runs the canonical gate: typecheck, Node tests, and a
production build. `npm test` alone runs the structural/unit tests.

Optional browser QA against a built preview:

```sh
npm run build
python3 -m http.server 4321 -d dist
QA_BASE=http://127.0.0.1:4321 node scripts/qa-screenshots.mjs
```

The script expects Chromium at `/usr/bin/chromium` and writes ignored
screenshots/reports under `.artifacts/qa/`.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml` (build + GitHub
Pages). `.github/workflows/quality.yml` runs the same gate on pull requests and
pushes to `main`.

## Design and quality contracts

- `docs/DESIGN.md` — owner direction, tokens, responsive/visual contract.
- `docs/QUALITY.md` — acceptance and evidence rules.
- `AGENTS.md` — how agent sessions work in this repository.
- `docs/GIT_POLICY.md` — solo-by-default delivery.
````

Remove the template sections (`What this template provides`, the omp install
instructions as the primary setup, `Daily usage`, the broken
`omp_workflow_guide.md` link). If you keep a short "Agent workflow" section,
link `AGENTS.md` and `docs/HARNESS.md`; do not make omp installation a
prerequisite for running the site.

**Verify**:

```bash
grep -n "omp Production Workflow Template\|What this template provides\|omp_workflow_guide" README.md
```

→ no output. Also `grep -n "npm ci" README.md` and `grep -n "npm run dev"
README.md` → both present.

### Step 2: Replace the unrelated CHANGELOG history

Replace the entire contents of `CHANGELOG.md` with a short site changelog.
Do not invent historical entries; use only the current change.

```markdown
# Changelog

Site changes are recorded here. Design decisions and their rationale live in
`docs/DESIGN.md` (Decision log); this file tracks shipped behavior, not
workflow/template history.

## Unreleased

- Repository documentation now describes the live site, its content model, and
  its verification commands instead of the upstream workflow template.
```

If the owner has explicitly asked for historical site entries in the future,
add them under `## Unreleased` or a dated heading; do not copy
template/harness history back in.

**Verify**:

```bash
grep -n "Context7\|DeepWiki\|Pi 1.0\|pi-doctor\|verify-affected\|safety-guard" CHANGELOG.md
```

→ no output.

### Step 3: Update CONTRIBUTING setup for the site

Replace the `## Setup` list in `CONTRIBUTING.md` with steps that actually run
this repository:

```markdown
## Setup

1. Use Node.js 22.19.0 or newer.
2. Install dependencies with `npm ci`.
3. Run `npm run dev` and open http://localhost:4321.
4. Before handing off: `bash scripts/verify.sh` (typecheck, Node tests, build).
5. For UI changes, run the optional browser QA from `README.md` against a built
   preview and inspect the saved screenshots.
6. Work directly in the repository. For an untrusted repository or meaningful
   credential/private-data exposure, use an OS/container boundary as described
   in `SECURITY.md`.
```

Keep the existing "Change contract", "Frontend contributions", and "Pull
request evidence" sections; they are still useful. Where the text says
"workflow change" and means this repository, change it to "change" or
"site change" — for example, the line "Run `bash scripts/verify.sh` before and
after a workflow change" becomes "Run `bash scripts/verify.sh` before handing
off a change." Do not delete the security or PR-evidence guidance.

**Verify**: `grep -n "npm ci" CONTRIBUTING.md` → one match;
`grep -n "npm run dev" CONTRIBUTING.md` → one match.

### Step 4: Check every local README link

Extract the Markdown link targets from the new README and confirm local files
exist. Inline code blocks and anchors are not links, so this is a quick manual
check:

```bash
grep -oE '\]\([^)#]+' README.md | sed 's/^](//' | while read -r path; do
  case "$path" in
    http*) ;;
    *) [ -e "$path" ] || echo "MISSING: $path" ;;
  esac
done
```

**Verify**: no `MISSING:` lines. In particular, `docs/DESIGN.md`,
`docs/QUALITY.md`, `AGENTS.md`, `docs/GIT_POLICY.md`, and `SECURITY.md` exist.

### Step 5: Run the gate

**Verify**: `bash scripts/verify.sh` exits 0 and ends with the build complete
message. If dependencies are missing, run `npm ci` first; do not change the
gate.

## Test plan

No code test is needed: this plan changes documentation only. The executable
checks are the grep assertions above and `bash scripts/verify.sh`. Do not add
a test that asserts README prose; prose is not a behavior contract.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -n "omp Production Workflow Template\|What this template provides\|omp_workflow_guide" README.md`
      returns no matches.
- [ ] `grep -n "npm ci" README.md CONTRIBUTING.md` returns two matches.
- [ ] `grep -n "npm run dev" README.md CONTRIBUTING.md` returns two matches.
- [ ] `grep -n "Context7\|DeepWiki\|Pi 1.0\|pi-doctor\|verify-affected" CHANGELOG.md`
      returns no matches.
- [ ] The local-link check prints no `MISSING:` lines.
- [ ] `bash scripts/verify.sh` exits 0.
- [ ] Among docs files, `git status --short` shows only `README.md`,
      `CHANGELOG.md`, and `CONTRIBUTING.md`. The earlier plans 013–016 changes
      and the batch-2 plan/index files are expected in this shared worktree.
- [ ] `plans/README.md` status row for plan 017 is updated.

## STOP conditions

Stop and report back (do not improvise) if:

- A proposed command does not work as documented (for example,
  `npm run preview` behaves differently in the installed Astro version). Test
  each command and document only what you observed; do not document a guess.
- The repository deploys somewhere other than the GitHub Pages workflows
  described above. Check `.github/workflows/deploy.yml` before writing the
  deployment section.
- The new README would need to describe a feature that does not exist (a blog,
  a form, analytics, a CMS). Do not add aspirational features; this is a
  current-state README.
- A step requires editing a file outside the in-scope list.
- `bash scripts/verify.sh` fails for a code reason. That is a separate
  problem; report it instead of weakening the docs or the gate.

## Maintenance notes

- Update the README routes/content sections when a page or collection field is
  added. The route list is the fastest way for a new contributor to orient.
- Keep `CHANGELOG.md` for shipped site changes only. Design rationale belongs
  in `docs/DESIGN.md`'s Decision log; workflow policy belongs in
  `docs/GIT_POLICY.md` / `AGENTS.md`.
- The support card is intentionally public site data, not a secret. Do not
  move it into an untracked env file or copy it into docs; keep the
  `src/config/support.ts` single source and the existing honest fallback UI.
- `README.md` is the GitHub landing page; it should never again describe the
  upstream template rather than this site.
