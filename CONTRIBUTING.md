# Contributing

Contributions should make the site better for its readers: clearer content,
fewer accessibility or performance problems, or a simpler way to maintain it.
More machinery is not automatically an improvement.

## Setup

1. Use Node.js 22.19.0 or newer.
2. Install dependencies with `npm ci`.
3. Run `npm run dev` and open http://localhost:4321.
4. Before handing off: `bash scripts/verify.sh` (workflow self-checks,
   typecheck, Node tests, build).
5. For UI changes, run the optional browser QA from `README.md` against a built
   preview and inspect the saved screenshots.
6. Work directly in the repository. For an untrusted repository or meaningful
   credential/private-data exposure, use an OS/container boundary as described
   in `SECURITY.md`.

## Change contract

For a non-trivial change, state:

- problem and accepted outcome;
- explicit non-goals;
- observable criteria and proof;
- compatibility, security, data, accessibility, performance, visual, and operational risk where relevant;
- rollback or targeted reversal.

Preserve unrelated work and keep one primary writer. Do not add dependencies without a concrete benefit over current/platform capabilities.

## Site changes

Run `bash scripts/verify.sh` before handing off a change. It runs the workflow
self-checks, typecheck, the Node tests, and a production build; do not bypass or
weaken it to get a green result.

Update the affected source-of-truth file rather than the rendered output:

- identity, social links, and navigation: `src/config/site.ts`;
- support data: `src/config/support.ts` (the card is public site data, not a
  secret — never copy it into docs or examples);
- design tokens and visual direction: `src/styles/tokens.css` and
  `docs/DESIGN.md`;
- shipped behavior worth recording: `CHANGELOG.md`.

Content edits belong in `src/content/projects/*.md` and
`src/content/travels/*.md`, with matching images under `public/images/`. See
`README.md` for the frontmatter rules.

## Frontend contributions

- Follow the accepted `docs/DESIGN.md`; update it before introducing a new visual direction.
- Prove the critical journey and required states in the real browser.
- Include deterministic desktop/mobile/demanding-state evidence for a material visual change.
- Report `docs/DESIGN.md` hard gates; aesthetics never cancel a functional/accessibility/performance failure.
- Record third-party font/media/icon source and license.

## Pull request evidence

Complete the pull-request template. Link exact commands and outcomes, not “tests pass.” Include screenshots only when they are deterministic, non-sensitive, and materially help review. The repository default is to leave verified work in the working tree; open a pull request only when the owner asks for one.

Report vulnerabilities privately using `SECURITY.md`, not a public issue or pull request.
