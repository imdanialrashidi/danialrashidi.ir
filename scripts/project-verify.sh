#!/usr/bin/env bash
set -Eeuo pipefail
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
npm run typecheck
node --test tests/site-structure.test.mjs tests/support-card.test.mjs
npm run build
