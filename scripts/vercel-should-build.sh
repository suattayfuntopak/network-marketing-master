#!/usr/bin/env bash
# Vercel Ignored Build Step — docs-only push'larda deploy atla.
# Dashboard: Project Settings → Git → Ignored Build Step → `./scripts/vercel-should-build.sh`
set -euo pipefail

if [ "${VERCEL_GIT_COMMIT_REF:-}" = "" ]; then
  exit 1
fi

# PR / preview deploy'lar her zaman build edilir (prod gate ayrı: deploy hook + main kapalı).
if [ "${VERCEL_ENV:-}" = "preview" ]; then
  exit 1
fi

# İlk deploy veya tek commit yoksa build et
if ! git rev-parse HEAD^ >/dev/null 2>&1; then
  exit 1
fi

CHANGED=$(git diff --name-only HEAD^ HEAD)

if [ -z "$CHANGED" ]; then
  exit 0
fi

# Yalnız hot.md / yerel doküman değiştiyse atla (hot.md artık gitignore'da olsa da geçmiş commitler için)
NON_DOC=$(echo "$CHANGED" | grep -vE '^(hot\.md|docs/local/)' || true)

if [ -z "$NON_DOC" ]; then
  echo "Skip build: docs-only change"
  exit 0
fi

exit 1
