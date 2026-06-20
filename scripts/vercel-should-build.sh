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

# Deploy hook her zaman branch HEAD'ini deploy eder. Oturum sonunda hot.md commit'i
# kod commitlerinden hemen sonra gelirse yalnızca HEAD^..HEAD bakmak ara kod değişikliklerini
# kaçırır (prod "Canceled" kalır). Son N committe kod var mı diye tara.
SCAN_DEPTH=30
for i in $(seq 0 $((SCAN_DEPTH - 1))); do
  base="HEAD~$((i + 1))"
  tip="HEAD~$i"
  if ! git rev-parse "$base" >/dev/null 2>&1; then
    break
  fi
  CHANGED=$(git diff --name-only "$base" "$tip")
  if [ -z "$CHANGED" ]; then
    continue
  fi
  NON_DOC=$(echo "$CHANGED" | grep -vE '^(hot\.md|docs/local/)' || true)
  if [ -n "$NON_DOC" ]; then
    exit 1
  fi
done

echo "Skip build: docs-only changes in last ${SCAN_DEPTH} commits"
exit 0
