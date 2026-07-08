#!/bin/bash

# This script will automatically commit and push changes to Git every 10 minutes.

while true; do
  echo "Checking for changes..."
  
  # Add all changes
  git add .

  # Create a timestamp
  TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

  # Commit changes if there are any
  # Using `git diff-index --quiet HEAD` to check if there are changes to commit
  if ! git diff-index --quiet HEAD --; then
    echo "Changes detected. Committing..."
    git commit -m "Auto-commit: $TIMESTAMP"
    
    echo "Pushing changes..."
    # You might want to specify the branch, e.g., git push origin main
    git push
    echo "Push successful."
  else
    echo "No changes to commit."
  fi

  echo "Waiting for 10 minutes before the next check..."
  # Sleep for 10 minutes (600 seconds)
  sleep 600
done
