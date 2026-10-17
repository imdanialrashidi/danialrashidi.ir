# Plan 012: Pin `target=_blank → rel=noopener` with a structural test

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git status --short -- tests/site-structure.test.mjs`
> plus `grep -rn 'target="_blank"' src/ | wc -l` (expect 18 on the planned commit).
> NOTE: the worktree has unrelated staged changes (`.pi/` → `.omp/` migration
> deletions plus `.gitignore` / `quality.yml` edits). Compare the "Current state"
> excerpt below against the live test file before proceeding; on a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests (security-adjacent)
- **Planned at**: commit `2f35e87`, 2026-10-14

## Why this matters

Every one of today's 18 `target="_blank"` links carries `rel="noopener"` (or
`rel="me noopener"`) — but purely by convention. A single future link without it
reopens reverse-tabnabbing silently, and nothing in the gate would catch it. One
structural test (~20 lines, mirroring the existing guards) turns the convention
into an invariant. No link changes are needed: all 18 already pass.

## Current state

The relevant files, each with one line on its role:

- `tests/site-structure.test.mjs` — structural suite; receives the new guard (only file changed)
- `src/**/*.astro` — 18 `target="_blank"` sites, all currently covered (read-only evidence, NOT modified)

Evidence as it exists today (full grep, 2026-10-14 — all carry `rel` with `noopener`):

```text
// grep -rn 'target="_blank"' src/ → 18 sites, each paired with rel="...noopener...":
Footer.astro:57,59,68,84,87,90 · InstagramBand.astro:24 · ProjectRow.astro:30
TravelCard.astro:46 · Masthead.astro:54,92 · SupportPanel.astro:22,71,84
ProjectSpread.astro:44 · index.astro:92,210 · [slug].astro:54,61 · درباره/index.astro:93
```

 Representative pair (all others follow the same two shapes — same-line or
 attr-per-line, `rel="noopener"` or `rel="me noopener"`):

```astro
<!-- same-line shape -->
<a href={data.liveUrl} target="_blank" rel="noopener" class="...">
<!-- attr-per-line shape (Masthead.astro:52-55) -->
<a
  href={SITE.telegram}
  target="_blank"
  rel="me noopener"
```

Repo conventions that apply: test style is `describe`/`it` + `node:assert`; file
scans use `readdirSync` + regex frontmatter parsing. The new test extends the
scan idiom from filenames to tag contents (regex over `<a...>` tags, not
line-based grep — attributes legitimately span lines in .astro). Imports +
`ROOT` already present at the top of the test file — no new imports needed:

```js
// tests/site-structure.test.mjs:1-9
import { deepStrictEqual, ok } from "node:assert";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { describe, it } from "node:test";

const ROOT = new URL("../", import.meta.url).pathname;
```

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Site tests | `node --test tests/site-structure.test.mjs` | all pass, exit 0 |
| Full suite | `npm test` | all pass, exit 0 |

(No typecheck/build needed — test-only change — but run them in Step 3 anyway as
a cheap regression proof since the gate runs them.)

## Scope

**In scope** (the only file you should modify):

- `tests/site-structure.test.mjs` (append one `it` block)

**Out of scope** (do NOT touch, even though they look related):

- Every `src/**/*.astro` link — all 18 already comply; "fixing" them would be churn disguised as work.
- `SUPPORT_METHODS` rendering, `rel="me"` identity semantics — not in question.
- `package.json`, `scripts/project-verify.sh` — the existing suite file is already gated; no wiring change.
- Any new `rel` policy (e.g. demanding `noreferrer`) — the invariant is exactly today's bar: `rel` containing `noopener`.

## Git workflow

- Work in the current worktree on top of existing changes. Do NOT commit, push,
  or open a PR — the owner handles delivery via the `ai-changes` lane.
- Leave the change as an uncommitted worktree modification and report it.

## Steps

### Step 1: Add the `_blank → noopener` guard

Inside the top-level `describe("persian editorial slice", ...)` in
`tests/site-structure.test.mjs`, append after the last test (the SEO/structured-data
one at the end of the file):

```js
  it("every target=_blank link carries rel=noopener", async () => {
    // async callback: the execSync import below uses await.
    // Reverse-tabnabbing guard: all 18 current sites comply by convention;
    // this test turns the convention into a gate invariant. Tag-level regex
    // (not line grep) because attributes legitimately span lines in .astro.
    const { execSync } = await import("node:child_process");
    const files = execSync("git ls-files 'src/*.astro' 'src/**/*.astro'", { cwd: ROOT, encoding: "utf8" })
      .split("\n").filter(Boolean);
    ok(files.length > 0, "expected tracked .astro files");
    let blankCount = 0;
    for (const file of files) {
      const raw = readFileSync(`${ROOT}${file}`, "utf8");
      const tags = raw.match(/<a[\s\S]*?>/g) ?? [];
      for (const tag of tags) {
        if (!tag.includes('target="_blank"')) continue;
        blankCount++;
        const rel = tag.match(/rel="([^"]*)"/)?.[1] ?? "";
        ok(rel.split(/\s+/).includes("noopener"), `${file} has target=_blank without rel=noopener: ${tag.slice(0, 120)}`);
      }
    }
    ok(blankCount > 0, "expected at least one target=_blank link");
  });
```

Notes for the executor (read before typing):

- `readFileSync` and `ok` are already imported — do not add imports for them.
  The inline `await import("node:child_process")` keeps the top-of-file import
  block untouched (same dispensation as plan 010's Step 3).
- `git ls-files` scopes the scan to TRACKED `.astro` files so untracked drafts
  don't fail the gate; on the planned commit it yields the full set. If it ever
  yields zero files the test fails loudly (`expected tracked .astro files`)
  rather than passing vacuously.
- The `rel.split(/\s+/).includes("noopener")` check accepts both `noopener` and
  `me noopener` (today's two shapes) and rejects `noreferrer`-only.

**Verify**: `node --test tests/site-structure.test.mjs` → all pass, exit 0.

### Step 2: Prove the guard bites with a controlled, reverted probe

1. Temporarily insert `<a href="https://example.com" target="_blank">probe</a>`
   into ONE tracked `.astro` file where it renders nothing user-visible — e.g.
   inside the `<nav aria-label="ناوبری موبایل">` block of
   `src/components/Masthead.astro` (do NOT commit this).
2. Run the suite → must FAIL on the new test with `without rel=noopener`.
3. Revert the probe immediately (`git diff -- src/components/Masthead.astro`
   shows no modification afterward) and re-run → green.

**Verify**: red with the exact `without rel=noopener` message on the probe;
green after revert; `Masthead.astro` byte-identical to before
(`git status --short src/components/Masthead.astro` empty).

### Step 3: Full gate

**Verify**: `npm test` → all pass, exit 0; then `npm run typecheck` and
`npm run build` → exit 0 (unchanged code paths, cheap proof).

## Test plan

This plan IS a test (Step 1) plus its defect-sensitivity proof (Step 2);
test-design rationale: contract = no reverse-tabnabbing surface (observable:
every new-tab link's `rel`); plausible failure = future component adds
`target="_blank"` without `rel`; gap = 18 sites covered by convention only;
cheapest faithful layer = tag-regex scan in the existing structural suite (no
browser — the contract is attribute presence, fully decidable from source);
oracle = today's unanimous `noopener` coverage, not an invented policy; defect
sensitivity = Step-2 probe (red without `rel`, green on revert). Co-designed
with plan 009's Step-2 `grep` check: after both land, the study links are
covered by BOTH guards (single-source + noopener).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `node --test tests/site-structure.test.mjs` exits 0 with the new guard passing
- [ ] Controlled-probe check performed: suite failed with `without rel=noopener` on the rel-less probe, green after revert
- [ ] `src/components/Masthead.astro` unmodified after the probe (`git status --short` shows only the test file + plans)
- [ ] `npm test`, `npm run typecheck`, `npm run build` all exit 0
- [ ] No files outside the in-scope list are modified (`git status --short`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The live `_blank` count differs from 18 AND any site lacks `rel=noopener` — the "all green today" premise is false; the missing `rel` is a real finding to report, not to weaken the bar for.
- The probe in Step 2 does NOT fail — the tag regex is wrong (e.g. `<a` written across lines, uppercase attrs); report rather than shipping a vacuous guard.
- `git ls-files` yields zero `.astro` files in the executor env (shallow/odd checkout) — report; do not fall back to an untracked-width `glob` that changes the test's contract.

## Maintenance notes

For the human/agent who owns this code after the change lands:

- If this test fails the gate, the fix is in the new link (add `rel="noopener"`), never in the test. `rel="me noopener"` on identity links (GitHub/Telegram/Instagram) is accepted — don't "simplify" it away.
- If the site ever adds a legit `_blank` form needing `noreferrer` too, extend the assertion to accept it explicitly — don't delete the test.
- A reviewer should verify the guard scans TAGS not lines (paste a multi-line `<a>` into the probe variant once); line-grep versions of this test are the known weak shape.
