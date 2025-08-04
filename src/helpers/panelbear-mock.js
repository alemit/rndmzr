/**
 * Simple Panelbear replacement for Manifest V3
 * This file provides a no-op implementation of Panelbear functions
 * to prevent errors when the original script can't be loaded due to CSP
 */

// Create a global panelbear object if it doesn't exist
window.panelbear = window.panelbear || {};

// Create a dummy tracker that just logs to console
const dummyTracker = {
  track: (eventName, props) => {
    console.log(`[Panelbear Mock] Tracking event: ${eventName}`, props || {});
  }
};

// Export a replacement for the Panelbear API
export const load = (site, config = {}) => {
  console.log(`[Panelbear Mock] Initialized with site ID: ${site}`);
  console.log(`[Panelbear Mock] Config:`, config);
  return dummyTracker;
};

export const trackPageview = (props) => {
  console.log(`[Panelbear Mock] Page view tracked`, props || {});
};

export const track = (eventName, props) => {
  console.log(`[Panelbear Mock] Event tracked: ${eventName}`, props || {});
};
