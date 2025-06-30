#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

echo "--- DIAGNOSTIC START (from entrypoint.sh) ---"
echo "Current directory: $(pwd)"
echo "Listing current directory contents:"
ls -la
echo "Listing dist/ directory contents:"
ls -la dist/
echo "--- index.js content ---"
cat dist/index.js
echo "--- DIAGNOSTIC END ---"

# Execute the main application
echo "Starting application..."
node dist/index.js
