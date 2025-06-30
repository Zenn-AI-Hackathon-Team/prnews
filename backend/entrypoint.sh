#!/bin/sh
set -e

echo "--- [ENTRYPOINT] Diagnostics Start ---"
pwd
echo "--- [ENTRYPOINT] Listing 'dist' directory: ---"
ls -la dist/
echo "--- [ENTRYPOINT] Starting Application ---"
node dist/index.js
echo "--- [ENTRYPOINT] CRITICAL: Application exited unexpectedly. ---"
exit 1