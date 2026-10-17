# Security Policy

## Reporting a vulnerability

Do not open a public issue containing an exploitable vulnerability, secret, private log, or user data. Use the repository's private **Security → Report a vulnerability** flow when available. If private reporting is unavailable, contact the repository owner through a private channel and share only the minimum reproduction needed.

Include the affected version/commit, impact, prerequisites, a minimal reproduction, and any known mitigation. Remove credentials and personal data from evidence.

## Execution boundary

omp runs with the operating-system permissions of the account that starts it. Tool approval tiers (see `tools.approvalMode` in `.omp/config.yml`) are defense in depth; they are not a sandbox. Real isolation must come from the operating system, container, or VM.

For a trusted working copy, sessions run with routine workspace execution enabled. Scoped commit/push/PR delivery is permitted only through the reviewed `scripts/omp-pr.mjs` helper on `ai-changes` under `docs/GIT_POLICY.md`. Main writes, PR merge, and other external actions still need exact owner authorization. Read-only inspection remains available.

For an untrusted repository, unreviewed third-party instructions, or work exposed to meaningful credentials/private data:

1. Prefer an OS/container/VM boundary with only the required workspace and credentials.
2. Grant only the provider keys required for the task.
3. Review the repository, `.omp/` configuration, skills, commands, and scripts before trusting them.
4. Review diffs and outputs before copying or deploying them to a trusted/production environment.

## Third-party packages

Dependencies execute with the agent process's permissions. A version pin is not a source review. Before updating:

- review the upstream repository, ownership, release diff, install scripts, dependencies, and published integrity;
- test the new pin in a disposable copy/container;
- update the changelog.

## Supported versions

Security fixes are applied to the current `main` branch. The repository does not currently publish versioned releases; once releases begin, list supported release lines here.
