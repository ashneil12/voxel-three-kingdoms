#!/bin/sh
# Run a Python script in headless Blender from the rig/ directory: scripts/run.sh scripts/x.py [-- args]
# Output goes to stdout; use `> reports/x.log 2>&1` for long jobs (never pipe through grep: it buffers).
cd "$(dirname "$0")/.." || exit 1
BLENDER="${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}"
exec "$BLENDER" -b --factory-startup --python-exit-code 1 --python "$@"
