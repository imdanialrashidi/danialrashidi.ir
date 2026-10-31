# Security Policy

## Reporting a vulnerability

Do not open a public issue containing an exploitable vulnerability, secret, private log, or user data. Use the repository's private **Security → Report a vulnerability** flow when available. If private reporting is unavailable, contact the repository owner through a private channel and share only the minimum reproduction needed.

Include the affected version/commit, impact, prerequisites, a minimal reproduction, and any known mitigation. Remove credentials and personal data from evidence.

## Execution boundary

DSH runs with the operating-system permissions of the account that starts it.
Its sandbox mode and approval policy constrain tool actions, but they are defense
in depth, not a substitute for OS/container/VM isolation. A denied or
approval-required action is blocked; do not route around it.

For a trusted working copy, routine workspace reads, edits, and checks are
allowed. Commit, push, pull-request, release, and deployment actions happen only
when the owner explicitly asks for them and remain subject to DSH's controls.
Read-only inspection is always available.

For an untrusted repository, unreviewed third-party instructions, or work exposed to meaningful credentials/private data:

1. Prefer an OS/container/VM boundary with only the required workspace and credentials.
2. Grant only the provider keys required for the task.
3. Review `AGENTS.md`, `.dsh/skills/`, scripts, and CI before trusting them.
4. Review diffs and outputs before copying or deploying them to a trusted/production environment.

## Third-party packages

Dependencies execute with the agent process's permissions. A version pin is not a source review. Before updating:

- review the upstream repository, ownership, release diff, install scripts, dependencies, and published integrity;
- test the new pin in a disposable copy/container;
- update the changelog.

## Supported versions

Security fixes are applied to the current `main` branch. The repository does not currently publish versioned releases; once releases begin, list supported release lines here.
