#!/bin/bash

# Simple build script for development
echo "Building VR Marketplace frontend..."

# Create dist directory if it doesn't exist
mkdir -p dist

# Copy basic files
cp index.html dist/
cp -r public/* dist/ 2>/dev/null || true

echo "Basic frontend build complete!"
echo "Note: For full build with bundling, run 'npm run build' after resolving dependencies"
