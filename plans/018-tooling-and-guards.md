# Plan 018: Close the tooling gaps — test discovery, Zod import, travel weight guard

> **Executor instructions**: Follow this plan exactly. Run every verification
> command and confirm the expected result. If a STOP condition occurs, stop and
> report. When done, update this plan's row in `plans/README.md` to DONE.
>
> **Drift check**: `git diff --stat 1754f74..HEAD -- package.json scripts/project-verify.sh src/content.config.ts tests/site-structure.test.mjs`
> Plans 013–017 and later batch-3 plans may have touched `tests/site-structure.test.mjs`;
> that is expected. Compare the specific excerpts below before editing.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (run after 013–017; later batch-3 plans depend on this)
- **Category**: tests / deps
- **Planned at**: commit `1754f74`, 2026-10-21

## Why this matters

Three small gaps make future maintenance unreliable: `npm test` only runs three
explicitly named files, so a new test file is silently skipped; the content
schema imports `z` from the deprecated `astro:schema` module (33 typecheck hints,
removal in Astro 8); and the travel-photo weight test hardcodes three filenames,
so a newly added travel photo escapes the 250KB budget. All three are cheap to
fix now and prevent the next regression from being invisible.

## Current state

`package.json:12`:

```json
    "test": "node --test tests/site-structure.test.mjs tests/support-card.test.mjs tests/nav.test.mjs",
```

`scripts/project-verify.sh:6`:

```bash
node --test tests/site-structure.test.mjs tests/support-card.test.mjs tests/nav.test.mjs
```

`src/content.config.ts:2`:

```ts
import { z } from "astro:schema";
```

`node_modules/astro/client.d.ts:158-171` says `astro:schema` is deprecated and
will be removed in Astro 8; the replacement is `astro/zod`. `npm run typecheck`
currently reports 33 `ts(6385)` hints, all from this import.

`tests/site-structure.test.mjs` — the travel-weight test:

```js
  it("travel photos stay at web weight", () => {
    // Guards the exact bloat just fixed: camera-resolution uploads served raw.
    // 250KB is headroom above the ~100-180KB optimized outputs, not a target.
    for (const file of ["dalakhani.jpg", "dareh-marg.jpg", "yakh-morad.jpg"]) {
      const size = statSync(`${ROOT}public/images/travels/${file}`).size;
      ok(size < 250 * 1024, `${file} is ${size} bytes, over the 250KB web budget`);
    }
  });
```

The file already imports `readdirSync`, `readFileSync`, `existsSync`, and
`statSync`; it also has a `frontmatter(path)` helper that returns string fields
with surrounding quotes stripped.

## Commands you will need

| Purpose | Command | Expected |
|---|---|---|
| Install | `npm ci` | exit 0 |
| Typecheck | `npm run typecheck` | exit 0, 0 hints after the Zod change |
| Tests | `npm test` | 20 pass after this plan |
| Build | `npm run build` | exit 0, 13 pages |
| Gate | `bash scripts/verify.sh` | exit 0 |

## Scope

**In scope**:

- `package.json`
- `scripts/project-verify.sh`
- `src/content.config.ts`
- `tests/site-structure.test.mjs`

**Out of scope**: all other source, docs, workflows, plan files.

## Steps

### Step 1: Discover every test file

Change both explicit file lists to the directory form:

- `package.json`: `"test": "node --test tests/"`
- `scripts/project-verify.sh`: `node --test tests/`

`node --test tests/` recursively discovers `tests/**/*.test.mjs` and already
runs all 20 current tests in this repository.

**Verify**:

```bash
npm test
```

Expected: 20 tests, 20 pass.

Prove discovery with a throwaway file:

```bash
cat > tests/discovery-probe.test.mjs <<'EOF'
import { test } from "node:test";
test("discovery probe", () => {});
EOF
npm test
rm tests/discovery-probe.test.mjs
npm test
```

Expected: the middle run reports 21 tests; the final run returns to 20. Do not
leave the probe file behind.

### Step 2: Use the supported Zod entry point

In `src/content.config.ts`, change:

```ts
import { z } from "astro:schema";
```

to:

```ts
import { z } from "astro/zod";
```

After switching to `astro/zod`, the bundled Zod 4 still marks
`z.string().url()` as deprecated. Migrate the three URL fields to the Zod 4
form so the hint count actually reaches zero:

```ts
    liveUrl: z.url().optional(),
    githubUrl: z.url().optional(),
    ...
    instagramUrl: z.url().optional(),
```

Validation semantics are unchanged (optional URL string). No other schema
field, default, or threshold changes.

**Verify**:

```bash
npm run typecheck
```

Expected: exit 0 and **0 hints** (the 33 `ts(6385)` deprecation hints are gone).
`npm test` and `npm run build` must still pass.

### Step 3: Make the travel weight guard cover new photos

Replace the hardcoded loop with a scan of the travel collection’s `image`
frontmatter. Use the existing `frontmatter()` helper:

```js
  it("travel photos stay at web weight", () => {
    // Guards the exact bloat just fixed: camera-resolution uploads served raw.
    // 250KB is headroom above the ~100-180KB optimized outputs, not a target.
    // Scan frontmatter so a newly added photo cannot bypass the budget.
    const files = readdirSync(`${ROOT}src/content/travels`).filter((f) => f.endsWith(".md"));
    const images = files
      .map((file) => ({ file, image: frontmatter(`${ROOT}src/content/travels/${file}`).image }))
      .filter((entry) => entry.image);
    ok(images.length > 0, "expected at least one travel image");
    for (const { file, image } of images) {
      const size = statSync(`${ROOT}public${image}`).size;
      ok(size < 250 * 1024, `${file}: ${image} is ${size} bytes, over the 250KB web budget`);
    }
  });
```

Do not change the 250KB threshold or the existing travel image files.

**Verify**: `npm test` → 20 pass.

Prove defect sensitivity (do this, then clean up):

```bash
dd if=/dev/zero of=public/images/travels/_budget-probe.jpg bs=1024 count=300 2>/dev/null
cat > src/content/travels/_budget-probe.md <<'EOF'
---
destination: "probe"
date: "۱۴۰۵"
description: "temporary budget probe"
image: "/images/travels/_budget-probe.jpg"
imageAlt: "temporary probe image with a descriptive alt"
order: 99
---
probe
EOF
node --test tests/site-structure.test.mjs 2>&1 | grep -E "over the 250KB|fail [1-9]"
rm public/images/travels/_budget-probe.jpg src/content/travels/_budget-probe.md
npm test
```

Expected: the probe run fails only the weight test with an `over the 250KB`
message; after cleanup, 20 tests pass. If the probe run passes, the guard is
still hardcoded — STOP and report.

### Step 4: Run the gate

**Verify**: `bash scripts/verify.sh` → exit 0 (typecheck, 20 tests, 13-page
build).

## Test plan

- No new permanent test file; Step 1 proves discovery with a temporary file,
  Step 3 proves the weight guard catches a new 300KB image, and the existing
  20 tests remain the regression suite.
- `npm run typecheck` dropping from 33 hints to 0 is the Zod migration proof.

## Done criteria

- [ ] `package.json` and `scripts/project-verify.sh` both use `node --test tests/`.
- [ ] The temporary discovery probe was removed.
- [ ] `src/content.config.ts` imports `z` from `astro/zod`.
- [ ] `npm run typecheck` exits 0 with 0 hints.
- [ ] The travel weight test scans frontmatter images, not a hardcoded list.
- [ ] The 300KB probe failed the weight test and was then removed.
- [ ] `npm test` exits 0 with 20 pass.
- [ ] `npm run build` exits 0.
- [ ] `bash scripts/verify.sh` exits 0.
- [ ] Only the four in-scope files plus `plans/README.md` are modified.
- [ ] `plans/README.md` row 018 is DONE.

## STOP conditions

- `node --test tests/` does not discover all 20 tests (report the output; do not
  keep an explicit list as a silent workaround).
- The Zod import change causes new type errors or the hints do not drop to 0.
- The probe test does not fail; the guard is not actually scanning.
- A required change touches a file outside the in-scope list.

## Maintenance notes

- Future test files only need to live under `tests/` and end in `.test.mjs`;
  no manifest edit is required.
- Keep `astro/zod` as the import path; `astro:schema` is removed in Astro 8.
- Any new travel entry with an `image` automatically joins the weight guard;
  new photos must be optimized under 250KB before merge.
