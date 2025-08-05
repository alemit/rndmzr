#!/bin/bash

# Production build script for Chrome extension
echo "🏗️ Building Chrome Extension for Production"

# Build the project
echo "📦 Running production build..."
npm run build

# Apply Chrome extension fixes
echo "🔧 Applying Chrome extension fixes..."

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

# Storage debug helper (optional for production, but useful)
cat > dist/js/storage-debug.js << 'EOF'
console.log("Storage debug loaded");
window.debugStorage = {
  dump: () => chrome.storage.local.get(null, r => console.log("Storage:", r)),
  check: k => chrome.storage.local.get([k], r => console.log(`${k}:`, r[k])),
  clear: () => chrome.storage.local.clear(() => console.log("Storage cleared"))
};
EOF
echo "   ✅ Created storage debug helper"

echo ""
echo "✅ Production build complete!"
echo ""
echo "📁 Ready to package from 'dist' folder"
echo "📋 For Chrome Web Store:"
echo "   1. Zip the 'dist' folder contents"
echo "   2. Upload to Chrome Developer Dashboard"
