# Plan 006: Remove the stale photo instructions and dead placeholder SVG

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git status --short -- src/components/ProfilePhoto.astro public/images/ src/config/site.ts`
> plus `git diff --stat fb90779..HEAD -- src/components/ProfilePhoto.astro`.
> NOTE: the product slice is currently uncommitted, so `git diff` against the
> planned-at SHA may be empty even when files exist. Rely on `git status` and
> compare the "Current state" excerpts below against the live code before
> proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `fb90779`, 2026-10-07

## Why this matters

`src/components/ProfilePhoto.astro` opens with a comment telling the owner
(in Persian) to drop `public/images/profile.jpg` into place and saying a clean
SVG placeholder shows until then. Both halves are now false: the owner's real
photo (`public/images/Danial_photo.jpg`, 855×1138) is wired through
`PROFILE.photoSrc` and renders in hero + about + `og:image`. A stale owner
instruction is worse than none — the next time the photo needs changing, the
owner will follow the comment and wonder why nothing happens. The leftover
`public/images/profile.svg` the comment refers to is dead weight
(`DESIGN.md`'s decision log already records it as retired).

## Current state

The relevant files, each with one line on its role:

- `src/components/ProfilePhoto.astro` — hero/about portrait frame; stale owner comment at lines 4–6
- `src/config/site.ts` — `PROFILE.photoSrc`, the actual single source of truth for the photo
- `public/images/profile.svg` — dead placeholder file, referenced by nothing
- `public/images/Danial_photo.jpg` — the real portrait, already live

Excerpts as they exist today:

```astro
{/* src/components/ProfilePhoto.astro:1-8 */}
---
import { PROFILE } from "../config/site";

/* قاب پرتره‌ی هیرو — عکس واقعی از PROFILE.photoSrc می‌آید.
   مالک: فایل public/images/profile.jpg را بگذار و photoSrc را عوض کن.
   تا آن روز، همین SVG جای‌نگهدارِ تمیز نمایش داده می‌شود (بدون عکس تقلبی). */
---
```

```ts
// src/config/site.ts (PROFILE excerpt)
export const PROFILE = {
  photoSrc: "/images/Danial_photo.jpg",
  photoAlt: "پرتره‌ی دانیال رشیدی",
  // ...
```

Verified at plan time: `grep -rn "images/profile" src/` returns only the stale
comment itself — no component, page, or test references `profile.svg`, and no
code falls back to it (the `<img>` uses `PROFILE.photoSrc` unconditionally).

Repo conventions that apply: owner-facing comments in this repo are written in
Persian and live at the top of config/component files (see
`src/config/site.ts:1-7`, `src/config/support.ts:1-9`). The replacement
comment must stay Persian, stay accurate, and name the exact file + variable.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Reference search | `grep -rn "profile\.svg\|images/profile" src/ public/ tests/ scripts/ astro.config.mjs` | no matches after the fix (see notes) |
| Typecheck | `npm run typecheck` | 0 errors |
| Build | `npm run build` | exit 0 (proves no page depended on the deleted SVG) |
| Regression | `node --test tests/site-structure.test.mjs` | all pass |

## Scope

**In scope** (the only files you should modify):

- `src/components/ProfilePhoto.astro` (comment block only — lines 4–6)
- `public/images/profile.svg` (delete)

**Out of scope** (do NOT touch, even though they look related):

- Any markup, styles, or `<img>` attributes in `ProfilePhoto.astro` — rendering is correct.
- `src/config/site.ts` — `photoSrc` is already correct.
- `docs/DESIGN.md` — its decision-log line ("`public/images/profile.svg` retired as fallback") is a historical record and stays accurate; do not rewrite history.
- `public/images/Danial_photo.jpg` — owner asset; never modify or move.

## Git workflow

- Work in the current worktree on top of existing changes. Do NOT commit, push,
  or open a PR — the owner handles delivery via the `ai-changes` lane.
- Deleting `profile.svg`: it is untracked (whole slice is uncommitted), so plain `rm` suffices; report the deletion.

## Steps

### Step 1: Rewrite the stale comment to describe the true replacement path

Replace lines 4–6 of `src/components/ProfilePhoto.astro`:

```
/* قاب پرتره‌ی هیرو — عکس واقعی از PROFILE.photoSrc می‌آید.
   مالک: فایل public/images/profile.jpg را بگذار و photoSrc را عوض کن.
   تا آن روز، همین SVG جای‌نگهدارِ تمیز نمایش داده می‌شود (بدون عکس تقلبی). */
```

with:

```
/* قاب پرتره‌ی هیرو — عکس واقعی از PROFILE.photoSrc می‌آید.
   مالک: برای عوض کردن عکس، فایل تازه را در public/images/ بگذار و فقط
   photoSrc را در src/config/site.ts عوض کن. */
```

Persian, same tone as the other owner comments, names the exact variable and
file. Nothing else in the component changes — not the import, not the markup.

**Verify**: `npm run typecheck` → 0 errors, 0 warnings (a comment-only change
must be a no-op for the compiler).

### Step 2: Delete the dead SVG and prove nothing referenced it

1. Delete `public/images/profile.svg`.
2. Run `grep -rn "profile\.svg\|images/profile" src/ public/ tests/ scripts/ astro.config.mjs` → no matches. (The only intentional remaining mention of the
   filename lives in `docs/DESIGN.md`'s decision log, which is excluded from
   this grep's paths — history, not a live reference.)
3. Run `npm run build` → exit 0 (a build that inlines/copies public assets
   proves no page depended on the deleted file).

**Verify**: `node --test tests/site-structure.test.mjs` → all pass, exit 0.

## Test plan

No new test: comment accuracy and dead-file removal are not behavioral
contracts. The build (which fails on missing referenced assets) plus the
empty-grep are the verification. If a future change reintroduces a fallback
image path, that change should carry its own reference test.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `public/images/profile.svg` no longer exists
- [ ] `grep -rn "profile\.svg\|images/profile" src/ public/ tests/ scripts/ astro.config.mjs` returns no matches
- [ ] `ProfilePhoto.astro` comment no longer mentions `profile.jpg` or an SVG placeholder, and names `src/config/site.ts` + `photoSrc`
- [ ] `npm run typecheck` → 0 errors; `npm run build` → exit 0
- [ ] `node --test tests/site-structure.test.mjs` exits 0
- [ ] No files outside the in-scope list are modified (one comment edit + one deletion)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The grep BEFORE deleting finds a live reference to `profile.svg` outside the
  known stale comment (e.g. a fallback branch was added) — the file may not
  be dead; do not delete.
- `PROFILE.photoSrc` no longer points at `/images/Danial_photo.jpg` — the
  replacement comment's premise is wrong; re-derive from `src/config/site.ts`.
- The build fails after deletion — something referenced the SVG through a path
  the grep missed (e.g. built asset manifest); restore the file from your
  report and stop.

## Maintenance notes

For the human/agent who owns this code after the change lands:

- Owner comments are load-bearing documentation in this repo (the owner edits
  config directly). Treat any future "put file X here" comment as a claim to
  verify against the code it describes.
- `docs/DESIGN.md`'s retired-fallback note stays as history; if the owner ever
  wants a placeholder again, that is a new design decision, not a revert.
- A reviewer should check only the Persian wording renders correctly (RTL,
  no broken characters) and the diff touches nothing but the comment + deletion.
