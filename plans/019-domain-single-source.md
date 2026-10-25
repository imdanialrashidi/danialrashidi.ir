# Plan 019: Make `SITE.domain` the only domain source

> **Executor instructions**: Follow this plan exactly. Run every verification
> command. If a STOP condition occurs, stop and report. When done, update row
> 019 in `plans/README.md` to DONE.
>
> **Drift check**: `git diff --stat 1754f74..HEAD -- astro.config.mjs src/pages/robots.txt.ts tests/site-structure.test.mjs public/robots.txt`
> Later batch-3 plans may touch the test file; compare the specific excerpts.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: 018 (test file state)
- **Category**: tech-debt / SEO
- **Planned at**: commit `1754f74`, 2026-10-21

## Why this matters

The domain is written three times: `astro.config.mjs` (`site`), `SITE.domain`
in `src/config/site.ts`, and `public/robots.txt` (the sitemap line). Changing
the domain in one place silently desynchronizes canonical URLs, the sitemap,
and `robots.txt`. This plan imports the existing `SITE` object into the Astro
config and generates `robots.txt` from it, leaving `SITE.domain` as the only
literal.

## Current state

`astro.config.mjs:5-9`:

```js
export default defineConfig({
  site: "https://danialrashidi.ir",
  output: "static",
  trailingSlash: "always",
  integrations: [sitemap()],
```

`src/config/site.ts:8-13`:

```ts
export const SITE = {
  name: "دانیال رشیدی",
  latinName: "Danial Rashidi",
  domain: "https://danialrashidi.ir",
  lang: "fa",
```

`public/robots.txt`:

```text
User-agent: *
Allow: /
Sitemap: https://danialrashidi.ir/sitemap-index.xml
```

`tests/site-structure.test.mjs` currently asserts
`existsSync(`${ROOT}public/robots.txt`)` in the SEO-foundation test.

`src/config/site.ts` has no Astro imports and is safe to import from the Astro
config. The installed Astro version is 7.3.6; static endpoints in
`src/pages/*.ts` are built to files.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Typecheck | `npm run typecheck` | exit 0 |
| Tests | `npm test` | 20 pass (this plan adds no test count) |
| Build | `npm run build` | exit 0, 13 pages + `robots.txt` |
| Gate | `bash scripts/verify.sh` | exit 0 |

## Scope

**In scope**:

- `astro.config.mjs`
- `src/pages/robots.txt.ts` (create)
- `public/robots.txt` (delete)
- `tests/site-structure.test.mjs` (update the SEO assertion)

**Out of scope**: `src/config/site.ts` (the domain already lives there), the
sitemap integration, any other public file, any content.

## Steps

### Step 1: Import `SITE.domain` into the Astro config

In `astro.config.mjs`, add the import and replace the literal:

```js
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { SITE } from "./src/config/site.ts";

export default defineConfig({
  site: SITE.domain,
  output: "static",
  trailingSlash: "always",
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

Use the explicit `.ts` extension in the config import so the config loader
resolves the module without guessing. Do not add a second domain export.

**Verify**: `grep -n "SITE.domain" astro.config.mjs` → one match;
`npm run build` → exit 0 (the config import is valid).

### Step 2: Generate `robots.txt` from the same source

Create `src/pages/robots.txt.ts`:

```ts
import type { APIRoute } from "astro";
import { SITE } from "../config/site";

export const GET: APIRoute = () =>
  new Response(
    `User-agent: *\nAllow: /\nSitemap: ${SITE.domain}/sitemap-index.xml\n`,
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
```

Delete `public/robots.txt` (`rm public/robots.txt`). Keeping both would create
two `/robots.txt` outputs; the generated endpoint replaces the static file.

**Verify**:

```bash
npm run build
cat dist/robots.txt
```

Expected exactly:

```text
User-agent: *
Allow: /
Sitemap: https://danialrashidi.ir/sitemap-index.xml
```

### Step 3: Update the structural test

In `tests/site-structure.test.mjs`, in the test named
`"declares Persian RTL SEO foundation in the base layout"`, replace:

```js
    ok(existsSync(`${ROOT}public/robots.txt`), "robots.txt missing");
```

with:

```js
    ok(existsSync(`${ROOT}src/pages/robots.txt.ts`), "robots.txt endpoint missing");
    ok(!existsSync(`${ROOT}public/robots.txt`), "robots.txt must be generated from SITE.domain, not duplicated in public/");
    ok(readFileSync(`${ROOT}src/pages/robots.txt.ts`, "utf8").includes("SITE.domain"), "robots.txt must use SITE.domain");
```

In the same test, after the existing `astro.config.mjs` assertion, add:

```js
    ok(config.includes("SITE.domain"), "astro config must use SITE.domain, not a literal domain");
```

The file already imports `existsSync`, `readFileSync`, and has `config` in
scope in that test.

**Verify**: `npm test` → 20 pass.

### Step 4: Run the gate

**Verify**: `bash scripts/verify.sh` → exit 0, and `dist/robots.txt` exists
after the build.

## Test plan

- No new test count: the existing SEO-foundation test now asserts the endpoint
  exists, the static duplicate is gone, and both the endpoint and Astro config
  reference `SITE.domain`.
- Build-output proof: `cat dist/robots.txt` shows the correct absolute sitemap
  URL.

## Done criteria

- [ ] `astro.config.mjs` imports `SITE` and uses `site: SITE.domain`.
- [ ] `src/pages/robots.txt.ts` exists and uses `SITE.domain`.
- [ ] `public/robots.txt` is deleted.
- [ ] `dist/robots.txt` is generated with the correct sitemap URL.
- [ ] `npm run typecheck` exits 0.
- [ ] `npm test` exits 0 with 20 pass.
- [ ] `npm run build` exits 0.
- [ ] `bash scripts/verify.sh` exits 0.
- [ ] Only the four in-scope files plus `plans/README.md` are modified.
- [ ] `plans/README.md` row 019 is DONE.

## STOP conditions

- Importing `./src/config/site.ts` from `astro.config.mjs` fails to build. Do
  not fall back to a second hardcoded domain; report the loader error.
- Astro does not generate `/robots.txt` from the endpoint in this static mode.
  Report the build output; do not keep both `public/robots.txt` and the
  endpoint.
- Any other file needs a domain edit; report it instead of copying the literal.
- A build or test fails for an unrelated reason; report it.

## Maintenance notes

- Change the domain only in `src/config/site.ts`; canonical URLs, sitemap, and
  `robots.txt` all follow.
- If the sitemap filename changes, update the `Sitemap:` line in
  `src/pages/robots.txt.ts`.
- The SEO test now guards the single-source invariant; do not reintroduce
  `public/robots.txt`.
