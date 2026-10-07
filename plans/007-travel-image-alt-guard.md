# Plan 007: Guard travel-image alt text the way projects already do

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git status --short -- tests/site-structure.test.mjs src/content.config.ts src/components/TravelCard.astro src/content/travels/`
> plus `git diff --stat fb90779..HEAD -- tests/site-structure.test.mjs`.
> NOTE: the product slice is currently uncommitted, so `git diff` against the
> planned-at SHA may be empty even when files exist. Rely on `git status` and
> compare the "Current state" excerpts below against the live code before
> proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `fb90779`, 2026-10-07

## Why this matters

Projects have a structural test forcing every `image:` frontmatter entry to
point at a real file with a descriptive Persian `imageAlt:` (it once caught
stale placeholder paths rendering as broken `<img>`). Travels have the same
`image:`/`imageAlt:` schema fields and the same rendering pattern in
`TravelCard.astro`, but no equivalent guard: the schema leaves both optional
and nothing checks them. Today `public/images/travels/` is intentionally empty
(by design — the owner supplies trip photos later), and `TravelCard` falls back
to a monogram panel plus a generated `سفر به X` alt. The risk is entirely on
the first-upload day: an owner-supplied photo with a missing or two-word alt
ships silently, and the accessibility contract (`DESIGN.md`: meaningful Persian
alt on every image) breaks without any signal. Mirroring the projects guard —
conditionally, so the current imageless state stays green — closes the gap for
~10 lines.

## Current state

The relevant files, each with one line on its role:

- `tests/site-structure.test.mjs` — owns the projects image guard to mirror
- `src/content.config.ts` — travels schema: `image`/`imageAlt` both optional (lines 33–34)
- `src/components/TravelCard.astro` — renders `<img>` when `data.image` set, else monogram panel; fallback alt `سفر به ${destination}`
- `src/content/travels/` — three notes (dalakhani, dareh-marg, yakh-morad), none with `image:` today

Excerpts as they exist today (the pattern to mirror — projects image test):

```js
// tests/site-structure.test.mjs ("every project points at a real image file...")
    const files = readdirSync(`${ROOT}src/content/projects`).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const raw = readFileSync(`${ROOT}src/content/projects/${file}`, "utf8");
      const img = raw.match(/^image: "(.*)"$/m)?.[1];
      const alt = raw.match(/^imageAlt: "(.*)"$/m)?.[1];
      ok(img, `${file} missing image frontmatter`);
      ok(img.startsWith("/images/projects/"), `${file} image must live under /images/projects/`);
      ok(existsSync(`${ROOT}public${img}`), `${file} image file missing: public${img}`);
      ok(alt && alt.length > 10, `${file} needs a descriptive Persian imageAlt`);
    }
```

```js
// src/content.config.ts:24-35 (travels schema excerpt)
const travels = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/travels" }),
  schema: z.object({
    // ... destination, date, description, instagramUrl, order, monogram ...
    image: z.string().optional(),
    imageAlt: z.string().optional(),
  }),
});
```

Repo conventions that apply: frontmatter is parsed with the same
`/^key: "(.*)"$/m` regex idiom; image paths live under `/images/<section>/`;
descriptive means `length > 10` (the projects bar — reuse it, do not invent a
new threshold). Test style is `describe`/`it` + `node:assert`.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Site tests | `node --test tests/site-structure.test.mjs` | all pass, exit 0 |
| Full suite (regression) | `npm test` | all pass, exit 0 |

## Scope

**In scope** (the only files you should modify):

- `tests/site-structure.test.mjs` (add one `it` block for travel images)

**Out of scope** (do NOT touch, even though they look related):

- `src/content.config.ts` — deliberately NOT tightening the schema. Rationale: a `superRefine` would fail the Astro build on the owner's first draft upload with a schema error, while the test gives the same signal in the verify gate with a clearer message; and the repo's established convention (projects) enforces this at the test layer. Do not split the convention across two layers.
- `src/components/TravelCard.astro` — fallback rendering is correct.
- `src/content/travels/*` — owner content; the new test must pass against the current imageless files (vacuous pass today, guard tomorrow).
- `public/images/travels/` — stays empty until the owner supplies photos.

## Git workflow

- Work in the current worktree on top of existing changes. Do NOT commit, push,
  or open a PR — the owner handles delivery via the `ai-changes` lane.
- Leave the change as an uncommitted worktree modification and report it.

## Steps

### Step 1: Add the conditional travel-image guard

Inside the top-level `describe("persian editorial slice", ...)` in
`tests/site-structure.test.mjs`, add after the projects image test:

```js
  it("every travel photo, when present, points at a real file with Persian alt text", () => {
    // Travels are imageless by design until the owner supplies trip photos
    // (see docs/DESIGN.md fixtures). This guard passes vacuously today and
    // bites on first-upload day: image without descriptive alt fails the gate.
    const files = readdirSync(`${ROOT}src/content/travels`).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const raw = readFileSync(`${ROOT}src/content/travels/${file}`, "utf8");
      const img = raw.match(/^image: "(.*)"$/m)?.[1];
      if (!img) continue;
      const alt = raw.match(/^imageAlt: "(.*)"$/m)?.[1];
      ok(img.startsWith("/images/travels/"), `${file} image must live under /images/travels/`);
      ok(existsSync(`${ROOT}public${img}`), `${file} image file missing: public${img}`);
      ok(alt && alt.length > 10, `${file} needs a descriptive Persian imageAlt`);
    }
  });
```

Note the deliberate difference from the projects version: NO `ok(img, ...)`
assertion — absence of `image:` is the accepted current state, not a failure.

**Verify**: `node --test tests/site-structure.test.mjs` → all pass (7 tests now), exit 0.

### Step 2: Prove the guard bites with a controlled, reverted fixture

1. Temporarily append `image: "/images/travels/probe.jpg"` (no `imageAlt:`)
   to ONE travel file (e.g. `src/content/travels/yakh-morad.md` frontmatter —
   do NOT commit this).
2. Run the test file → must FAIL on the new test with `needs a descriptive
   Persian imageAlt`.
3. Revert the fixture immediately (restore the exact original bytes — verify
   with `git status --short src/content/travels/` showing no modification…
   note: files are untracked, so instead re-read the file and confirm the
   probe lines are gone) and re-run → green.

**Verify**: red with the exact alt message on the probe; green after revert;
travel content files byte-identical to before.

## Test plan

This plan adds one test; test-design rationale: contract = travel-photo
accessibility (observable: every rendered travel `<img>` has a descriptive
Persian alt); plausible failure = first owner upload with missing/generic alt;
gap = projects have the guard, travels do not; cheapest faithful layer =
structural file test mirroring the existing guard (no browser needed — the
contract is file-existence + frontmatter presence); oracle = the `> 10` bar
and `/images/travels/` prefix, reused from the projects guard, not invented;
defect sensitivity = Step-2 probe (red on missing alt, green on revert).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `node --test tests/site-structure.test.mjs` exits 0 with the new travel-image test passing
- [ ] Controlled-probe check performed: suite failed with `needs a descriptive Persian imageAlt` on alt-less image, green after revert
- [ ] Travel content files byte-identical to pre-plan state (probe fully reverted)
- [ ] `npm test` exits 0
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The projects image test does not match the excerpt (already refactored) — mirror the CURRENT form, not the excerpt; if no guard exists anymore, report.
- A travel file already HAS `image:` frontmatter (owner uploaded photos) — the premise "vacuously green today" is false; the new test must pass against the real images, and any failure is a real finding to report, not to weaken the bar for.
- The probe in Step 2 does NOT fail — the regex or assertion is wrong; report rather than shipping a vacuous guard.

## Maintenance notes

For the human/agent who owns this code after the change lands:

- On first-upload day, if this test fails the gate, the fix is in the travel
  `.md` frontmatter (add/fix `imageAlt:`), never in the test.
- If travels ever become image-required (like projects), delete the
  `if (!img) continue;` line and add the `ok(img, ...)` assertion — one-line
  change, documented here so nobody re-derives it.
- A reviewer should check the new test against the projects guard line by
  line; the only intended differences are the `continue` and the `travels/`
  prefix.
