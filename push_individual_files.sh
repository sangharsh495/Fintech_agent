#!/bin/bash

# Script to push each untracked file one at a time to the remote repo

set -e

# Get list of all untracked files (flat list, not directories)
FILES=$(git ls-files --others --exclude-standard | sort)

COUNT=0
TOTAL=$(echo "$FILES" | wc -l | tr -d ' ')

echo "Total files to process: $TOTAL"
echo ""

while IFS= read -r item; do
  [ -z "$item" ] && continue
  COUNT=$((COUNT + 1))
  
  # Extract meaningful info
  DIR=$(dirname "$item")
  BASE=$(basename "$item")
  
  # Generate commit message based on file path
  if [[ "$item" == app/* ]]; then
    MSG="feat: Add ${item#app/}"
  elif [[ "$item" == components/ui/* ]]; then
    MSG="feat(ui): Add $BASE shadcn component"
  elif [[ "$item" == components/* ]]; then
    MSG="feat(ui): Add $BASE component"
  elif [[ "$item" == hooks/* ]]; then
    MSG="feat: Add $BASE hook"
  elif [[ "$item" == lib/* ]]; then
    MSG="feat: Add $BASE utility"
  elif [[ "$item" == server/* ]]; then
    MSG="feat(server): Add ${item#server/}"
  elif [[ "$item" == public/* ]]; then
    MSG="chore: Add ${item#public/} asset"
  elif [[ "$item" == ml-service/* ]]; then
    MSG="feat(ml): Add ${item#ml-service/}"
  elif [[ "$item" == styles/* ]]; then
    MSG="style: Add $BASE"
  elif [[ "$item" == .claude/* ]] || [[ "$item" == .vscode/* ]] || [[ "$item" == new/* ]]; then
    MSG="chore: Add $item"
  elif [[ "$BASE" == *.json ]] || [[ "$BASE" == *.yaml ]] || [[ "$BASE" == *.yml ]] || [[ "$BASE" == *.mjs ]] || [[ "$BASE" == *.tsx ]] || [[ "$BASE" == *.ts ]]; then
    MSG="chore: Add $BASE config"
  else
    MSG="chore: Add $item"
  fi
  
  echo "[$COUNT/$TOTAL] Committing: $item"
  echo "  Message: $MSG"
  
  git add "$item"
  git commit -m "$MSG"
  git push origin main
  
  echo "  ✅ Pushed"
  echo ""
done <<< "$FILES"

echo "Done! Pushed $COUNT files individually."