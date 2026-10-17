# Plan 010: Serve travel photos at web weight, not camera weight

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git status --short -- public/images/travels/ src/content/travels/ tests/site-structure.test.mjs`
> plus `ls -la public/images/travels/`.
> NOTE: the worktree has unrelated staged changes (`.pi/` → `.omp/` migration
> deletions plus `.gitignore` / `quality.yml` edits). Compare the "Current state"
> excerpts and byte sizes below against the live tree before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `2f35e87`, 2026-10-14

## Why this matters

The travels page ships ~1MB of phone-camera JPEGs for three small portrait
frames, while the portrait and project images already ship resized variants
(`ProfilePhoto` srcset, `noveno.webp`, `elsa-hamrah-hero.*.webp`). Downscaling
the two 960px travel photos to display width cuts the page's image weight by
more than half with no visual difference in a 4:5 crop — the cheapest
performance win in the repo, with zero component changes.

## Current state

The relevant files, each with one line on its role:

- `public/images/travels/` — three owner-supplied JPEGs at camera resolution
- `src/content/travels/*.md` — frontmatter wiring (`image:`, dims, `imageAlt:`, `imagePosition:`)
- `src/components/TravelCard.astro` — renders `<img loading="lazy">` at `aspect-[4/5] object-cover` (NOT touched by this plan)
- `tests/site-structure.test.mjs` — guards existence + alt text, no weight guard (plan adds one)

Byte sizes and frontmatter as they exist today (verify with `ls -la` first):

```text
// public/images/travels/ — live sizes 2026-10-14
dalakhani.jpg   396917 bytes   960x1280
dareh-marg.jpg  426626 bytes   960x1280
yakh-morad.jpg  177905 bytes   640x640
```

```yaml
# src/content/travels/dalakhani.md frontmatter (excerpt)
image: "/images/travels/dalakhani.jpg"
imageAlt: "پنج دره‌نورد با کلاه ایمنی و جلیقه نجات، نشسته روی صخره‌ای در تنگه سبز و خزه‌دار دره دالخانی"
imageWidth: 960
imageHeight: 1280
imagePosition: "50% 42%"
# dareh-marg: same 960x1280 pattern; yakh-morad: 640x640, imagePosition "68% 28%"
```

```astro
<!-- src/components/TravelCard.astro:19-28 — plain lazy img, no srcset (keep as is) -->
<img
  src={data.image}
  alt={alt}
  width={data.imageWidth}
  height={data.imageHeight}
  loading="lazy"
  decoding="async"
  class="travel-img block aspect-[4/5] w-full object-cover"
  style={`object-position: ${position};`}
/>
```

Repo conventions and tooling that apply: images live under `public/images/<section>/`;
`TravelCard` keeps natural color with per-photo `imagePosition` focal points
(`docs/DESIGN.md` media direction) — this plan changes bytes and dims only, never
alt text, focal points, or paths. `sharp` is present in `node_modules` and loads
(`node -e "require('sharp')"` prints OK) as a transitive Astro dependency — use it
via a one-off `node -e` command; do NOT add it to `package.json`.

Display-width reasoning (why 768): the travel strip is 3-up inside `max-w-6xl`
(~380px per frame on desktop, full-width snap on mobile up to ~430px); 768px wide
at 4:5 (768x960) covers 2x DPR on every target viewport with headroom.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `npm run typecheck` | exit 0 |
| Site tests | `node --test tests/site-structure.test.mjs` | all pass, exit 0 |
| Full suite | `npm test` | all pass, exit 0 |
| Build | `npm run build` | exit 0 |

## Scope

**In scope** (the only files you should modify):

- `public/images/travels/dalakhani.jpg` (re-encode at 768px wide)
- `public/images/travels/dareh-marg.jpg` (re-encode at 768px wide)
- `public/images/travels/yakh-morad.jpg` (re-encode at original 640px, quality only)
- `src/content/travels/dalakhani.md` (`imageWidth`/`imageHeight` only)
- `src/content/travels/dareh-marg.md` (`imageWidth`/`imageHeight` only)
- `tests/site-structure.test.mjs` (add weight guard)

**Out of scope** (do NOT touch, even though they look related):

- `src/components/TravelCard.astro` — no srcset/picture work in this plan; the frames are small enough that one well-sized file wins. A responsive-variant follow-up is explicitly deferred (see Maintenance notes).
- `src/content/travels/*.md` `image:` paths, `imageAlt:`, `imagePosition:`, descriptions — owner content; dims only.
- `src/content/travels/yakh-morad.md` dims (640x640 already correct — byte change only).
- Portrait (`Danial_photo*`) and project images — already optimized; plan 008 covered Noveno.
- `package.json` (no new dependency), `scripts/` (one-off command only, nothing committed), `docs/` (no doc edit needed).

## Git workflow

- Work in the current worktree on top of existing changes. Do NOT commit, push,
  or open a PR — the owner handles delivery via the `ai-changes` lane.
- Binary re-encodes show as modified files in `git status` — expected. Leave all
  changes uncommitted and report sizes before/after.

## Steps

### Step 1: Re-encode the three travel JPEGs with sharp (one-off, nothing committed)

Run exactly (single command, from the repo root):

```bash
node -e "
const sharp = require('sharp');
(async () => {
  await sharp('public/images/travels/dalakhani.jpg').resize({ width: 768 }).jpeg({ quality: 80, progressive: true }).toFile('/tmp/dalakhani.jpg');
  await sharp('public/images/travels/dareh-marg.jpg').resize({ width: 768 }).jpeg({ quality: 80, progressive: true }).toFile('/tmp/dareh-marg.jpg');
  await sharp('public/images/travels/yakh-morad.jpg').jpeg({ quality: 80, progressive: true }).toFile('/tmp/yakh-morad.jpg');
})().catch((e) => { console.error(e); process.exit(1); });
" && mv /tmp/dalakhani.jpg public/images/travels/dalakhani.jpg && mv /tmp/dareh-marg.jpg public/images/travels/dareh-marg.jpg && mv /tmp/yakh-morad.jpg public/images/travels/yakh-morad.jpg && ls -la public/images/travels/
```

Why via `/tmp` + `mv`: sharp cannot write over its own input path; the temp round-trip is required, not optional.

**Verify**: `ls -la public/images/travels/` → `dalakhani.jpg` and `dareh-marg.jpg`
each well under their original bytes (expect roughly 100–180KB each; hard bar is
Step 3's 250KB), `yakh-morad.jpg` smaller than 177905. `node -e "require('sharp')"`
still loads (sanity, not a change).

### Step 2: Update frontmatter dims for the two resized photos

In `src/content/travels/dalakhani.md` and `src/content/travels/dareh-marg.md`,
change ONLY these two frontmatter lines (960x1280 is 3:4, so 768 wide → 768x1024):

```yaml
imageWidth: 768
imageHeight: 1024
```

Do not touch `image:`, `imageAlt:`, `imagePosition:`, or body copy. Do not touch
`yakh-morad.md` at all (640x640 stays correct).

**Verify**: `node --test tests/site-structure.test.mjs` → all pass (dims flow into
the existing image test's file-existence checks), exit 0.

### Step 3: Add the weight guard test

Inside the top-level `describe("persian editorial slice", ...)` in
`tests/site-structure.test.mjs`, add after the travel-image test
("every travel photo, when present, points at a real file with Persian alt text"):

```js
  it("travel photos stay at web weight", async () => {
    // async callback: the statSync import below uses await.
    // Guards the exact bloat just fixed: camera-resolution uploads served raw.
    // 250KB is headroom above the ~100-180KB optimized outputs, not a target.
    const { statSync } = await import("node:fs");
    for (const file of ["dalakhani.jpg", "dareh-marg.jpg", "yakh-morad.jpg"]) {
      const size = statSync(`${ROOT}public/images/travels/${file}`).size;
      ok(size < 250 * 1024, `${file} is ${size} bytes, over the 250KB web budget`);
    }
  });
```

Adaptation note: the test file currently imports `{ readdirSync, readFileSync,
existsSync }` from `node:fs` (line 6). Prefer extending that import to include
`statSync` rather than the inline `await import` if the file's Node/test-runner
combination accepts a static import edit cleanly — either shape passes, but do
not leave BOTH (no duplicate import paths). If the static import edit causes any
friction, keep the inline form verbatim.

**Verify**: `node --test tests/site-structure.test.mjs` → all pass, exit 0.

### Step 4: Full gate

**Verify**: `npm test` → all pass, exit 0; then `npm run build` → exit 0.

## Test plan

This plan adds one weight test (Step 3); test-design rationale: contract = travel
page image weight (observable: three JPEG byte sizes); plausible failure = owner
uploads the next trip photo at full camera resolution; gap = existence/alt
guarded, weight unguarded; cheapest faithful layer = file-size assertion in the
existing structural suite (no browser, no image decode — bytes are the contract);
oracle = 250KB headroom bar over measured optimized outputs (~100–180KB), not an
invented ideal; defect sensitivity = the test FAILS on pre-plan bytes (397KB and
427KB both exceed 250KB) and passes after Step 1 — verify this explicitly by
`git stash`-free reasoning: you already observed the pre-plan sizes in Step 1's
`ls` output; if either optimized file still exceeds 250KB, the quality setting
was wrong — report, don't raise the bar.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `stat -c '%n %s' public/images/travels/*.jpg` → all three under 256000 bytes, and the two 960px files resized to 768x1024 (confirm via `node -e "require('sharp')('public/images/travels/dalakhani.jpg').metadata().then(m=>console.log(m.width+'x'+m.height))"` → `768x1024`, same for dareh-marg)
- [ ] `dalakhani.md` / `dareh-marg.md` frontmatter reads `imageWidth: 768` / `imageHeight: 1024`; no other frontmatter/body line changed (`git diff -- src/content/travels/` shows only those four lines)
- [ ] `npm test` exits 0, including the new weight test
- [ ] `npm run build` exits 0
- [ ] No files outside the in-scope list are modified (`git status --short`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `node -e "require('sharp')"` fails (native binary broken in the executor env) — do not `npm install` a replacement optimizer or add a dependency; report.
- Any travel JPG's live bytes or dims don't match "Current state" (owner replaced a photo mid-plan) — the Step-1 command targets exact filenames; a new file needs a refreshed plan.
- An optimized file still exceeds 250KB at q80 — report the actual bytes; do not lower quality further or raise the bar unilaterally.
- The build's image handling changed (Astro now errors on `public/` JPEGs or demands `astro:image`) — report, don't migrate the component.

## Maintenance notes

For the human/agent who owns this code after the change lands:

- Next owner photo upload follows the same recipe: max 768px wide, JPEG q80 progressive (or WebP equivalent), update `imageWidth`/`imageHeight` frontmatter, keep `imagePosition` focal point. The weight test enforces the budget at the gate.
- If travels grow past ~6 photos or a hero-size travel frame appears, revisit a `srcset` follow-up modeled on `ProfilePhoto.astro:18-19` — deliberately deferred here because one well-sized file wins at current frame sizes.
- A reviewer should spot-check the re-encoded faces/subjects (Dalakhani group, Dareh-Marg descent) at 390px and 1360px viewports; JPEG q80 on green rock/water is the artifact risk, however small.
