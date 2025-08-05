#!/bin/bash

# Universal Chrome Extension Development Script
# Works on Windows (Git Bash) and macOS
echo "🚀 Starting Chrome Extension Development"

# Clean previous build
rm -rf dist/

# Start yarn serve in background
echo "📦 Starting development server..."
yarn serve &
SERVE_PID=$!

# Wait for initial build and ensure dist directory exists
echo "⏳ Building extension..."
WAIT_COUNT=0
while [ ! -d "dist" ] || [ ! -f "dist/js/background.js" ]; do
    sleep 2
    WAIT_COUNT=$((WAIT_COUNT + 1))
    if [ $WAIT_COUNT -gt 30 ]; then
        echo "❌ Build timeout - please check yarn serve output"
        exit 1
    fi
done

# Apply Chrome extension fixes
echo "🔧 Applying extension fixes..."

# Copy clean background.js (source version, not webpack)
cp src/background.js dist/background.js
echo "   ✅ Copied clean background.js to root"

# Create required mock files
mkdir -p dist/js

# Panelbear mock
cat > dist/js/panelbear.js << 'EOF'
console.log("Panelbear mock loaded");
window.panelbear = {
  track: () => console.log("[Panelbear] tracked"),
  config: {}
};
export const load = () => window.panelbear;
export const track = window.panelbear.track;
EOF
echo "   ✅ Created panelbear mock"

# Storage debug helper
cat > dist/js/storage-debug.js << 'EOF'
console.log("Storage debug loaded");
window.debugStorage = {
  dump: () => chrome.storage.local.get(null, r => console.log("Storage:", r)),
  check: k => chrome.storage.local.get([k], r => console.log(`${k}:`, r[k])),
  clear: () => chrome.storage.local.clear(() => console.log("Storage cleared"))
};
EOF
echo "   ✅ Created storage debug helper"

# Inject debug script into HTML
if ! grep -q "storage-debug.js" "dist/index.html"; then
    sed -i.bak 's|</head>|<script src="js/storage-debug.js"></script></head>|' dist/index.html 2>/dev/null || \
    sed -i '' 's|</head>|<script src="js/storage-debug.js"></script></head>|' dist/index.html
    echo "   ✅ Injected debug script into HTML"
fi

echo ""
echo "✅ Chrome Extension Ready!"
echo ""
echo "📋 Next steps:"
echo "   1. Open chrome://extensions/"
echo "   2. Enable Developer mode"
echo "   3. Load unpacked → select 'dist' folder"
echo ""
echo "🔄 Live development is running"
echo "   - Vue components update automatically"
echo "   - For service worker changes: reload extension"
echo ""
echo "🛑 Press Ctrl+C to stop"

# Monitor and fix background.js if webpack overwrites it
while true; do
    if [ -f "dist/background.js" ]; then
        # Check if background.js is too large (webpack version)
        SIZE=$(stat -c%s "dist/background.js" 2>/dev/null || stat -f%z "dist/background.js" 2>/dev/null)
        if [ "$SIZE" -gt 5000 ]; then
            cp src/background.js dist/background.js
        fi
    fi
    sleep 10
done
