#!/bin/sh
# Exit immediately if a command exits with a non-zero status, and print each command before executing it.
set -ex

echo "--- [ENTRYPOINT] Diagnostics Start ---"
echo "--- [ENTRYPOINT] Current Directory & User ---"
pwd
whoami
echo "--- [ENTRYPOINT] Listing /app directory: ---"
ls -la /app
echo "--- [ENTRYPOINT] Checking for dist/index.js: ---"
if [ -f "dist/index.js" ]; then
  echo "--- [ENTRYPOINT] dist/index.js found. Content:"
  cat dist/index.js
else
  echo "--- [ENTRYPOINT] CRITICAL: dist/index.js NOT FOUND."
  exit 1
fi
echo "--- [ENTRYPOINT] Starting Application ---"
node dist/index.js
echo "--- [ENTRYPOINT] CRITICAL: Application exited unexpectedly. ---"
exit 1
