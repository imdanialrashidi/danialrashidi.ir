# Plan 004: Cover the support-card helpers with unit tests

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git status --short -- src/config/support.ts tests/`
> plus `git diff --stat fb90779..HEAD -- src/config/support.ts tests/`.
> NOTE: the product slice is currently uncommitted, so `git diff` against the
> planned-at SHA may be empty even when files exist. Rely on `git status` and
> compare the "Current state" excerpts below against the live code before
> proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `fb90779`, 2026-10-07

## Why this matters

`src/config/support.ts` owns the only money-adjacent logic on this static
site: `isSupportCardConfigured` decides whether a real card number is shown,
and `formatCardNumber` renders it. Both are pure functions with zero tests.
The day the owner pastes a real card number into `SUPPORT_CARD` (the documented
activation path) is the worst possible day to discover a threshold off-by-one
or a formatting bug — e.g. a 7-digit partial entry flipping the UI from the
honest-empty state to showing a fragment. Eight cheap unit cases now lock the
boundary before real payment data ever touches it.

## Current state

The relevant files, each with one line on its role:

- `src/config/support.ts` — support config + the two pure helpers (lines 36–43)
- `tests/site-structure.test.mjs` — existing product test; stylistic pattern to follow (`node:test` + `node:assert`)

Excerpts as they exist today:

```ts
// src/config/support.ts:36-43
export function isSupportCardConfigured(card: SupportCard): boolean {
  return card.number.replace(/[\s-]/g, "").length >= 8;
}

export function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 20);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}
```

```ts
// src/config/support.ts:30-34
export const SUPPORT_CARD: SupportCard = {
  number: "",
  bank: "",
  holder: "",
};
```

Behavioral contract to lock (read from the implementation above — the test
must assert exactly this, nothing stricter):

- `isSupportCardConfigured`: strips spaces/dashes, true iff ≥ 8 chars remain.
- `formatCardNumber`: keeps digits only, caps at 20, groups in 4s with spaces.

Repo conventions that apply: tests use `node:test` (`describe`/`it`) +
`node:assert` (`strictEqual`/`ok`), as in `tests/site-structure.test.mjs:1-7`.
No build step, no framework. The repo runs on Node ≥ 22.19.0
(`package.json` engines), which strips TypeScript types natively — but verify
that assumption in Step 1 rather than trusting it.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| TS-import probe | `node -e "import('./src/config/support.ts').then(m => console.log(typeof m.formatCardNumber))"` | prints `function` |
| New test file | `node --test tests/support-card.test.mjs` | all pass, exit 0 |
| Full suite (regression) | `npm test` | all pass, exit 0 |

## Suggested executor toolkit

- None beyond core tools. If Node type-stripping fails (see STOP conditions),
  do not reach for tsx/ts-node/esbuild — report instead; adding a TS runner
  dependency for one test file is the wrong trade.

## Scope

**In scope** (the only files you should modify):

- `tests/support-card.test.mjs` (create)

**Out of scope** (do NOT touch, even though they look related):

- `src/config/support.ts` — implementation is correct; test-only change.
- `tests/site-structure.test.mjs` — different contract (content structure); leave it.
- `src/components/SupportPanel.astro` — rendering layer; the unit boundary is the helpers.
- `scripts/project-verify.sh` — plan 002 owns the gate; note in your report that this new file should be appended to the gate per plan 002's maintenance notes (only if plan 002 has already landed; otherwise just report it).

## Git workflow

- Work in the current worktree on top of existing changes. Do NOT commit, push,
  or open a PR — the owner handles delivery via the `ai-changes` lane.
- Leave the new test file as an uncommitted worktree addition and report it.

## Steps

### Step 1: Probe direct TypeScript import before writing anything

Run:

```bash
node -e "import('./src/config/support.ts').then(m => console.log(typeof m.formatCardNumber))"
```

Expected: prints `function` (Node ≥ 22.18 strips erasable types natively, and
`support.ts` uses only erasable syntax: interfaces, `export type`, parameter
annotations — no enums, namespaces, or parameter properties).

**Verify**: output is exactly `function`, exit 0. If it throws (e.g.
`ERR_UNKNOWN_FILE_EXTENSION` or a syntax error on types), STOP per the STOP
conditions — do not write the test a different way.

### Step 2: Write the test file

Create `tests/support-card.test.mjs` with `describe`/`it` + `node:assert`,
importing `{ isSupportCardConfigured, formatCardNumber }` from
`../src/config/support.ts` (relative specifier WITH the `.ts` extension —
required for Node's resolver). Cover exactly these cases (one `it` per bullet
or grouped in two `it` blocks; prefer two blocks: `isSupportCardConfigured`
and `formatCardNumber`):

`isSupportCardConfigured(card)` — pass `{ number, bank: "", holder: "" }`:

1. `""` → `false` (the honest-empty default in `SUPPORT_CARD`)
2. `"1234567"` (7 digits) → `false` (boundary: one below threshold)
3. `"12345678"` (8 digits) → `true` (boundary: exact threshold)
4. `"6037 9912-3456 7890"` → `true` (spaces and dashes are stripped before measuring)

`formatCardNumber(raw)`:

5. `"6037991234567890"` (16 digits) → `"6037 9912 3456 7890"`
6. `"6037-9912 3456x7890"` → `"6037 9912 3456 7890"` (non-digits stripped)
7. `"1".repeat(25)` → 20 digits grouped as `"1111 1111 1111 1111 1111"` (cap at 20)
8. `""` → `""` (empty in, empty out — no crash on the default state)

Expected values above are computed by hand from the regexes, NOT by running
the implementation — they are the independent oracle.

**Verify**: `node --test tests/support-card.test.mjs` → 8 pass (or 2 blocks
pass covering all 8 assertions), `fail 0`, exit 0.

### Step 3: Regression-check the full suite

**Verify**: `npm test` → exit 0, everything (including the pre-existing
harness tests and site-structure tests) still passes.

## Test plan

This plan creates the test; the test-design rationale: contract = card-display
boundary (observable: which support UI state renders); plausible failure =
threshold/formatting bug surfacing a card fragment on activation day; gap =
zero coverage of the only money-adjacent logic; cheapest faithful layer =
unit (pure functions, no DOM needed); oracle = hand-computed strings above;
defect sensitivity = Step 4's mutation check below (do it — it is cheap):

**Step 4 (mutation proof)**: temporarily change `>= 8` to `>= 9` in
`src/config/support.ts`, run the new test file → must FAIL (case 3 catches
it). Revert immediately, re-run → green. Report both outcomes. This is a
temporary source mutation, fully reverted — the only source-file touch allowed
in this plan.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `node --test tests/support-card.test.mjs` exits 0 with all assertions passing
- [ ] Mutation proof performed: `>= 9` variant failed the suite, revert restored green
- [ ] `src/config/support.ts` is unmodified in final `git status --short`
- [ ] `npm test` exits 0
- [ ] No files outside the in-scope list are modified (exactly one new file)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The Step-1 probe fails (Node cannot import the `.ts` file) — the test
  strategy depends on native type-stripping; do not add a TS runner dependency.
- `src/config/support.ts:36-43` does not match the excerpts — the expected
  values in Step 2 were hand-derived from that exact code; re-derive or report.
- The `>= 9` mutation does NOT fail the new tests — the tests are not
  sensitive to the threshold; report rather than shipping insensitive tests.

## Maintenance notes

For the human/agent who owns this code after the change lands:

- If the 8-digit threshold or 20-digit cap ever changes (e.g. different card
  scheme), these tests MUST be updated in the same change — they encode the
  current policy, and a green suite with stale expectations is worse than none.
- Append this file to `scripts/project-verify.sh`'s gate (see plan 002's
  maintenance notes) so activation-day edits run these tests.
- A reviewer should check the expected strings by hand against the regexes,
  not by running the code — running the code to verify its own tests proves
  nothing.
