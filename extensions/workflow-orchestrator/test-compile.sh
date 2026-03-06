#!/bin/bash
# Test compilation script for workflow-orchestrator plugin

cd "$(dirname "$0")"

echo "Installing dependencies..."
npm install

echo "Compiling TypeScript..."
npx tsc

if [ $? -eq 0 ]; then
  echo "✅ Compilation successful!"
  echo "Output files:"
  ls -lh dist/
else
  echo "❌ Compilation failed!"
  exit 1
fi
