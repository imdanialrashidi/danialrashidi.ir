# Quality

Own commands, test strategy, and the definition of done. Keep commands current;
a stale command is worse than a missing one.

## Commands

| Purpose | Command | Expected result |
| --- | --- | --- |
| Install dependencies | `npm ci` | Exit 0 |
| Focused test | `node --test tests/<file>.test.mjs` | Exit 0, named tests pass |
| Full test suite | `npm test` (`node --test tests/`) | Exit 0, all tests pass |
| Type check | `npm run typecheck` (`astro check`) | 0 errors |
| Lint/format | `npm run lint` | Informational no-op; no linter is configured |
| Build | `npm run build` | Static build completes in `dist/` |
| Full gate | `bash scripts/verify.sh` | Workflow checks + typecheck + tests + build pass |
| Regenerate project variants | `npm run assets:projects` | 480w/960w WebP variants written |
| Regenerate project OG cards | `npm run assets:og` | 1200×630 JPEG cards written |
| Browser QA | `npm run build`, serve `dist/`, then `QA_BASE=http://127.0.0.1:4321 node scripts/qa-screenshots.mjs` | Report and screenshots in `.artifacts/qa/` |

If a command is unavailable in an environment, report the check as blocked with
the missing prerequisite. Do not replace it with an invented command.

## Test layers

| Layer | Scope | Where | When to run |
| --- | --- | --- | --- |
| Unit | Nav active-state and support-card helpers | `tests/nav.test.mjs`, `tests/support-card.test.mjs` | Changed helper logic |
| Structural/integration | Routes, content contract, config single-source, assets, SEO, theme/no-JS | `tests/site-structure.test.mjs` | Changed routes, content, config, or layout |
| Build | Astro content schema, pages, assets, sitemap | `npm run build` | Every broad change |
| Manual/runtime | Real pages, console, failed requests, overflow, metadata | `scripts/qa-screenshots.mjs` | User-facing or visual change |
| Visual | Desktop/mobile states against `docs/DESIGN.md` | browser QA screenshots | Material visual change |

## Risk areas

- **Content contract:** tests pin exactly seven projects, featured order, image
  paths, alt text, dimensions, and variants. Update content and tests together.
- **Persian RTL and routes:** Persian filenames and percent-encoded URLs;
  `trailingSlash: "always"`; no horizontal overflow at 320px.
- **Configuration drift:** identity, links, study URL, and domain must come from
  `src/config/site.ts`; support data from `src/config/support.ts`.
- **Image weight and metadata:** variants, OG cards, intrinsic dimensions, and
  lazy loading protect LCP/CLS. Regenerate after replacing a screenshot.
- **Theme and navigation:** saved theme must survive view transitions; reveal
  content must stay visible without JavaScript.
- **Static hosting and CI:** the build must stay static; GitHub Pages and Actions
  are the only delivery path.
- **Public support data:** the card number is intentionally public. Never copy
  it into docs, examples, logs, or new tests beyond the existing owner-data
  guard.

## Test conventions

- Use `node:test` and `node:assert`; no test framework is installed.
- Tests read source files and assert observable structure/contracts; keep them
  behavior-oriented and independent of the implementation where practical.
- Prefer the smallest assertion that detects the concrete regression; avoid
  over-constraining future content or image formats.
- Do not mock the subject under test. There are no external services to mock.
- Add a regression test only when it would fail on the pre-fix behavior.
- Content edits must keep the matching test expectations true; do not weaken a
  guard to make new content pass.

## CI

- `.github/workflows/quality.yml` runs `npm ci` and `bash scripts/verify.sh` on
  pull requests and pushes to `main`.
- `.github/workflows/deploy.yml` builds and deploys `dist/` to GitHub Pages on
  pushes to `main`.
- CI does not run the optional browser QA; run it locally for user-facing work
  when Chromium is available, or report it as unexecuted.

## Manual checks

- Browser QA against a built copy: home, about, projects, project detail,
  travels, support, and contact at 1360 and 390 widths, plus 320px overflow.
- Keyboard pass for menu, theme toggle, and focus visibility.
- Reduced-motion behavior for signature draw and transitions.
- Inspect desktop/mobile screenshots for a material visual change.

## Definition of done

- Acceptance criteria are met or explicitly reported as unmet.
- Focused checks pass; the full gate has a recorded status.
- Failures, blockers, unproven claims, and unexecuted checks are reported.
- Review findings are resolved or explicitly accepted with an owner and reason.
- Documentation owned by the change is updated.
- The diff contains no unrelated changes, secrets, generated noise, or weakened
  tests.

## Related documents

- Product: [PRODUCT.md](PRODUCT.md)
- Architecture: [ARCHITECTURE.md](ARCHITECTURE.md)
- Design: [DESIGN.md](DESIGN.md)
