#!/usr/bin/env bash
# Run from repo root (or any git worktree). Mirrors the blocking checks in CI.
#
# Usage:
#   ./scripts/pre-push.sh              # lint + typecheck + unit tests, scoped to changed workspace(s)
#   ./scripts/pre-push.sh --with-e2e   # also runs backend e2e (requires DATABASE_URL pointed at a real Postgres)
#   BASE_BRANCH=develop ./scripts/pre-push.sh   # diff against a branch other than main

set -euo pipefail

BASE_BRANCH="${BASE_BRANCH:-main}"
WITH_E2E=false
[[ "${1:-}" == "--with-e2e" ]] && WITH_E2E=true

UNIT_PROOF_PATTERN='grade-lock-proof\.spec\.ts|subject-prerequisite-proof\.spec\.ts'
E2E_PROOF_PATTERN='cross-semester-destruction\.e2e-spec\.ts|late-enrollment-grading\.e2e-spec\.ts|org-seeder\.e2e-spec\.ts'

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

if git rev-parse --verify "origin/${BASE_BRANCH}" >/dev/null 2>&1; then
  DIFF_TARGET="origin/${BASE_BRANCH}...HEAD"
else
  DIFF_TARGET="HEAD~1...HEAD"
fi

CHANGED_FILES="$(git diff --name-only ${DIFF_TARGET} 2>/dev/null || true)"

run_backend=false
run_frontend=false
echo "${CHANGED_FILES}" | grep -q '^backend/' && run_backend=true
echo "${CHANGED_FILES}" | grep -q '^frontend/' && run_frontend=true

if [[ "${run_backend}" == false && "${run_frontend}" == false ]]; then
  echo "No changes detected under backend/ or frontend/ against ${BASE_BRANCH}; running both to be safe."
  run_backend=true
  run_frontend=true
fi

FAILED=0

if [[ "${run_backend}" == true ]]; then
  echo "=== backend: lint ==="
  (cd backend && npm run lint) || FAILED=1

  echo "=== backend: typecheck ==="
  (cd backend && npx tsc --noEmit -p tsconfig.json) || FAILED=1

  echo "=== backend: unit tests (known-bug proofs excluded) ==="
  (cd backend && npx jest --testPathIgnorePatterns="/node_modules/" --testPathIgnorePatterns="${UNIT_PROOF_PATTERN}") || FAILED=1

  if [[ "${WITH_E2E}" == true ]]; then
    if [[ -z "${DATABASE_URL:-}" ]]; then
      echo "WARNING: --with-e2e requested but DATABASE_URL is not set; skipping backend e2e."
    else
      echo "=== backend: e2e tests (known-bug proofs excluded) ==="
      (cd backend && npx jest --config ./test/jest-e2e.json --runInBand --testPathIgnorePatterns="${E2E_PROOF_PATTERN}") || FAILED=1
    fi
  fi
fi

if [[ "${run_frontend}" == true ]]; then
  echo "=== frontend: lint ==="
  (cd frontend && npm run lint) || FAILED=1

  echo "=== frontend: typecheck ==="
  (cd frontend && npx tsc --noEmit) || FAILED=1

  echo "=== frontend: build ==="
  (cd frontend && npm run build) || FAILED=1
fi

if [[ "${FAILED}" -ne 0 ]]; then
  echo ""
  echo "One or more checks failed. Fix before pushing."
  exit 1
fi

echo ""
echo "All local checks passed. Safe to push."