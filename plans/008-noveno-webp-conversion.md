# Plan 008: Convert the Noveno hero shot from PNG to WebP

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git status --short -- public/images/projects/ src/content/projects/noveno.md`
> plus `git diff --stat fb90779..HEAD -- public/images/projects/ src/content/projects/noveno.md`.
> NOTE: the product slice is currently uncommitted, so `git diff` against the
> planned-at SHA may be empty even when files exist. Rely on `git status` and
> compare the "Current state" excerpts below against the live code before
> proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `fb90779`, 2026-10-07

## Why this matters

The homepage's featured project spread renders the Noveno hero shot. It is
the single largest project image on the site (134,740 bytes PNG) while the
other four heroes are WebP at 26–81 KB — same visual role, ~2–5× the weight,
on the most prominent slot. Converting to WebP at visually lossless quality
aligns the outlier with the repo's own convention and trims LCP weight on the
page the DESIGN.md performance budget cares about most. One image, one
frontmatter line, fully verifiable by byte comparison.

## Current state

The relevant files, each with one line on its role:

- `public/images/projects/noveno.png` — the outlier (134,740 bytes)
- `src/content/projects/noveno.md` — frontmatter `image:` points at the PNG
- Sibling convention: `elsa-hamrah-hero.*.webp` (54,916 B), `isbatab-hero.*.webp` (57,032 B), `mobile-khorsandi-hero.*.webp` (26,452 B), `php-ielts-house-hero.*.webp` (80,892 B)

Excerpts as they exist today:

```yaml
# src/content/projects/noveno.md (frontmatter excerpt)
image: "/images/projects/noveno.png"
imageAlt: "اسکرین‌شات صفحه‌ی اصلی نوونو — سیستم جذب مشتری"
```

```text
# public/images/projects/ sizes at plan time (bytes)
elsa-hamrah-hero.82efe0d6.webp    54916
isbatab-hero.859510be.webp        57032
mobile-khorsandi-hero.e3e110cc.webp  26452
noveno.png                       134740
php-ielts-house-hero.bd5bd7ff.webp  80892
```

Consumers of the path (must ALL be updated or verified): `noveno.md`
frontmatter (above); `ProjectImage.astro`/`ProjectSpread.astro`/detail page
render `data.image` generically (no hard-coded extension — confirm by grep, do
not edit them); the site-structure image test asserts prefix
`/images/projects/` + file existence (extension-agnostic — no test change needed).

Repo conventions that apply: honest framed screenshots at natural aspect, no
crop (DESIGN.md media direction); conversion must be lossless-to-lossless in
appearance — quality high enough that a side-by-side shows no difference.
Keep the plain filename `noveno.webp` (do not invent a content hash; the
existing hashed names came from an earlier pipeline and renaming them is out
of scope).

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Tool probe | `command -v cwebp || command -v ffmpeg || command -v convert || python3 -c "import PIL"` | one tool found |
| Reference search | `grep -rn "noveno\.png" src/ tests/ public/ scripts/ astro.config.mjs` | no matches after fix |
| Typecheck | `npm run typecheck` | 0 errors |
| Build | `npm run build` | exit 0; `dist/` contains noveno webp, no noveno png |
| Regression | `node --test tests/site-structure.test.mjs` | all pass |

## Scope

**In scope** (the only files you should modify):

- `public/images/projects/noveno.png` → `public/images/projects/noveno.webp` (convert + delete original)
- `src/content/projects/noveno.md` (one frontmatter line: the `image:` path)

**Out of scope** (do NOT touch, even though they look related):

- The other four `.webp` files — already converted; do not re-encode (generation loss for zero gain).
- `ProjectImage.astro`, `ProjectSpread.astro`, `[slug].astro` — extension-agnostic renderers; grep to confirm, never edit.
- `imageAlt` text — accurate already; changing it is content churn.
- Any image-dimension, crop, or art-direction change — byte-format swap ONLY.

## Git workflow

- Work in the current worktree on top of existing changes. Do NOT commit, push,
  or open a PR — the owner handles delivery via the `ai-changes` lane.
- Files are untracked, so create/delete with plain `cp`/`rm` (no `git mv` needed); report the swap.

## Steps

### Step 1: Probe for a converter and confirm the premise

1. Confirm `public/images/projects/noveno.png` still exists and is still the
   only non-WebP file in that directory (`ls -la public/images/projects/`).
2. Probe converters in this order, using the first available:
   - `cwebp -q 82 public/images/projects/noveno.png -o public/images/projects/noveno.webp`
   - `ffmpeg -y -i public/images/projects/noveno.png -c:v libwebp -quality 82 public/images/projects/noveno.webp`
   - ImageMagick: `convert public/images/projects/noveno.png -quality 82 public/images/projects/noveno.webp`
   - Python PIL: `python3 -c "from PIL import Image; Image.open('public/images/projects/noveno.png').save('public/images/projects/noveno.webp','WEBP',quality=82,method=6)"`
3. Compare: `ls -la` both files — the `.webp` MUST be smaller than 134,740 bytes. Decode-check: re-open the webp with the same tool (e.g. PIL `Image.open(...).verify()` or `cwebp` round-trip info) to prove it is a valid image, not a truncated write.

**Verify**: `noveno.webp` exists, is a valid decodable image, and is smaller
than `noveno.png`. If NO converter is available, STOP (see STOP conditions) —
do not `npm install` an image library for a one-time conversion.

### Step 2: Swap the reference and remove the original

1. In `src/content/projects/noveno.md`, change exactly one line:
   `image: "/images/projects/noveno.png"` → `image: "/images/projects/noveno.webp"`.
2. Delete `public/images/projects/noveno.png`.
3. Run `grep -rn "noveno\.png" src/ tests/ public/ scripts/ astro.config.mjs` → no matches.

**Verify**: `node --test tests/site-structure.test.mjs` → all pass (the image
test resolves the new path and file).

### Step 3: Rebuild and confirm the shipped artifact

Run `npm run build` → exit 0. Then confirm `dist/images/projects/noveno.webp`
exists (or the corresponding hashed/copied asset path the build emits) and NO
`noveno.png` remains under `dist/`.

**Verify**: `npm run typecheck` → 0 errors (frontmatter change flows through
content types cleanly).

## Test plan

No new test: the existing projects-image test (file existence + alt quality)
covers the swapped path unchanged, and byte-size comparison in Step 1 is the
perf proof. A test asserting "all images are webp" would over-constrain the
owner's future uploads (e.g. a legitimately better AVIF later) — deliberately
not added.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `public/images/projects/noveno.webp` exists, decodes cleanly, and is smaller than 134,740 bytes
- [ ] `public/images/projects/noveno.png` no longer exists
- [ ] `noveno.md` `image:` frontmatter points at `/images/projects/noveno.webp`; `imageAlt` unchanged
- [ ] `grep -rn "noveno\.png" src/ tests/ public/ scripts/ astro.config.mjs` returns no matches
- [ ] `npm run build` exits 0; `dist/` contains the noveno webp and no noveno png
- [ ] `node --test tests/site-structure.test.mjs` exits 0
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- No converter (`cwebp`/`ffmpeg`/`convert`/PIL) is available — do not install packages to fill the gap; report and leave the PNG in place.
- The `.webp` output is NOT smaller than the PNG, or fails the decode check — the conversion is not a win; delete the `.webp`, keep the PNG, report.
- The pre-swap `ls` shows the directory no longer matches the excerpt (PNG already gone/renamed, or other non-WebP files appeared) — re-derive scope instead of converting the wrong file.
- `grep -rn "noveno.png"` finds a consumer that needs the PNG extension specifically (e.g. a `type="image/png"` attribute or explicit import) — report; the swap is not the assumed no-op.

## Maintenance notes

For the human/agent who owns this code after the change lands:

- Future project screenshots should be committed as `.webp` (quality ~82)
  directly — that is now the uniform convention; no test enforces it by
  design (see Test plan), so mention it in review when new images land.
- If AVIF/tooling improves later, the same swap procedure applies per file.
- A reviewer should visually compare the rendered Noveno spread before/after
  (homepage + detail page) at 1360px — the acceptance bar is "no visible
  difference, fewer bytes," provable from the Step-1 size check plus one
  screenshot glance.
