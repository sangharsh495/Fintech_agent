#!/bin/bash

# Periodically commits changes to files git already tracks.
#
#   ./auto_git.sh                    commit every 10 minutes, never push
#   AUTO_GIT_PUSH=1 ./auto_git.sh    also push after each commit
#   AUTO_GIT_INTERVAL=300 ./auto_git.sh   change the interval (seconds)
#
# Safety:
# - Only tracked files are staged (git add -u). New files are never swept in,
#   so a new secret, dump or build artefact cannot be committed by accident;
#   add new files yourself with git add.
# - A commit that would include anything resembling a secret file is refused.
# - Pushing is opt-in.

INTERVAL="${AUTO_GIT_INTERVAL:-600}"
cd "$(dirname "$0")" || exit 1

while true; do
  echo "Checking for changes..."

  git add -u

  if git diff --cached --name-only | grep -Eiq '(^|/)\.env|\.pem$|\.key$|id_rsa|credentials'; then
    echo "Refusing to commit: staged changes include a file that looks like a secret:"
    git diff --cached --name-only | grep -Ei '(^|/)\.env|\.pem$|\.key$|id_rsa|credentials'
    git reset -q
  elif ! git diff --cached --quiet; then
    TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
    echo "Changes detected. Committing..."
    git commit -q -m "Auto-commit: $TIMESTAMP"

    if [ "${AUTO_GIT_PUSH:-0}" = "1" ]; then
      echo "Pushing changes..."
      if git push; then echo "Push successful."; else echo "Push failed."; fi
    fi
  else
    echo "No changes to commit."
  fi

  echo "Waiting ${INTERVAL}s before the next check..."
  sleep "$INTERVAL"
done
