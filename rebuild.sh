#!/bin/bash

# Clean rebuild script for rndmzr extension
echo "Cleaning dist directory..."
rm -rf dist/*

echo "Running npm build..."
npm run build

echo "Ensuring correct Content Security Policy in the manifest..."
# Use sed to update the content_security_policy in the generated manifest
# For MV3, we can't use external domains directly in CSP, so we'll keep it to 'self'
if [ -f dist/manifest.json ]; then
  # Ensure the CSP is set to just 'self' as required by Manifest V3
  sed -i.bak 's/"extension_pages": "script-src '\''self'\'' [^"]*"/"extension_pages": "script-src '\''self'\''"/g' dist/manifest.json || true
  sed -i "s/\"extension_pages\": \"script-src 'self' [^\"]*\"/\"extension_pages\": \"script-src 'self'\"/g" dist/manifest.json || true
fi

# Create js directory in dist if it doesn't exist
mkdir -p dist/js

# Create our own mock implementation of Panelbear since we can't load it from external domain
echo "Creating Panelbear mock implementation..."
cat > dist/js/panelbear.js << 'EOL'
// Mock implementation of Panelbear analytics for Manifest V3
console.log("Panelbear analytics mock loaded");

// Create a global panelbear object
window.panelbear = {
  // Track method for events
  track: function(eventName, props) {
    console.log("[Panelbear Mock] Event tracked:", eventName, props || {});
  },
  // Config holder
  config: {}
};

// Export APIs for module use
export function load(siteID, config) {
  console.log("[Panelbear Mock] Initialized with site ID:", siteID);
  console.log("[Panelbear Mock] Config:", config);
  window.panelbear.config = config || {};
  return window.panelbear;
}

export function trackPageview(props) {
  console.log("[Panelbear Mock] Page view tracked", props || {});
}

export function track(eventName, props) {
  window.panelbear.track(eventName, props);
}
EOL

# Create a debugging script to help diagnose storage issues
echo "Creating debugging helper..."
cat > dist/js/storage-debug.js << 'EOL'
// Storage debugging helper
console.log("Storage debugging helper loaded");

// Wrap chrome.storage methods to log accesses
const originalGet = chrome.storage.local.get;
chrome.storage.local.get = function(...args) {
  console.log("[Storage Debug] chrome.storage.local.get called with:", args);
  return originalGet.apply(this, args);
};

const originalSet = chrome.storage.local.set;
chrome.storage.local.set = function(...args) {
  console.log("[Storage Debug] chrome.storage.local.set called with:", args);
  return originalSet.apply(this, args);
};

// Add debug commands to window
window.debugStorage = {
  // Print all storage content
  dump: function() {
    chrome.storage.local.get(null, function(items) {
      console.log("[Storage Debug] All storage items:", items);
    });
  },
  // Check specific key
  check: function(key) {
    chrome.storage.local.get([key], function(result) {
      console.log(`[Storage Debug] Value for "${key}":`, result[key]);
    });
  },
  // Set a value for testing
  set: function(key, value) {
    chrome.storage.local.set({[key]: value}, function() {
      console.log(`[Storage Debug] Set "${key}" to:`, value);
    });
  },
  // Clear storage
  clear: function() {
    chrome.storage.local.clear(function() {
      console.log("[Storage Debug] Storage cleared");
    });
  }
};

// Usage info
console.log("[Storage Debug] Debug commands available in console:");
console.log("  - window.debugStorage.dump() - Show all storage");
console.log("  - window.debugStorage.check('key') - Check specific key");
console.log("  - window.debugStorage.set('key', value) - Set a value");
console.log("  - window.debugStorage.clear() - Clear all storage");
EOL

# Add this script to index.html
if [ -f dist/index.html ]; then
  echo "Adding storage debug script to index.html..."
  sed -i.bak 's|</head>|<script src="js/storage-debug.js"></script></head>|' dist/index.html || true
fi

# Copy background.js to root if it's in a subdirectory
if [ -f dist/js/background.js ] && [ ! -f dist/background.js ]; then
  echo "Copying background.js to root directory..."
  cp dist/js/background.js dist/background.js
fi

echo "Rebuild complete. Please load the extension from the dist folder."
