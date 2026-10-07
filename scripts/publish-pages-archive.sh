#!/usr/bin/env bash
set -euo pipefail
: "${PAGES_ARCHIVE_DIR:?Set PAGES_ARCHIVE_DIR to the generated history directory}"
: "${PAGES_ARCHIVE_INDEX:?Set PAGES_ARCHIVE_INDEX to a new temporary index path}"
archive_parent="$(git rev-parse --verify refs/remotes/origin/pages-archive 2>/dev/null || true)"
export GIT_INDEX_FILE="$PAGES_ARCHIVE_INDEX"
git read-tree --empty
git --work-tree="$PAGES_ARCHIVE_DIR" add --all
archive_tree="$(git write-tree)"
if [ -n "$archive_parent" ]; then
  previous_tree="$(git rev-parse "$archive_parent^{tree}")"
  if [ "$previous_tree" = "$archive_tree" ]; then
    echo 'Arquivo de versões já atualizado.'
    exit 0
  fi
  archive_commit="$(git commit-tree "$archive_tree" -p "$archive_parent" -m 'Archive MyOffice version previews')"
else
  archive_commit="$(git commit-tree "$archive_tree" -m 'Archive MyOffice version previews')"
fi
git push origin "$archive_commit:refs/heads/pages-archive"
