// Custom Vuex persistence plugin for Chrome Extensions (Manifest V3)
// This file should be placed in src/helpers/chrome-storage-persisted-state.js

const createChromeStoragePersistedState = ({
  key = 'vuex',
  paths = [],
  storageArea = 'local' // 'local', 'sync', or 'session'
} = {}) => {
  return store => {
    // Helper function to save state to session storage as a backup
    const saveToSessionStorage = (state) => {
      try {
        if (state.apiKey) {
          sessionStorage.setItem('clockify_api_key', state.apiKey);
        }
        if (state.profile) {
          sessionStorage.setItem('profile', state.profile);
        }
      } catch (e) {
        console.error('Failed to save to session storage:', e);
      }
    };

    // Initialize store from chrome.storage on startup
    const initializeStore = () => {
      // First check for data in chrome.storage.local
      chrome.storage[storageArea].get([key], result => {
        // Flag to track if we successfully restored state
        let stateRestored = false;
        
        if (result[key]) {
          try {
            const savedState = JSON.parse(result[key]);
            if (savedState && Object.keys(savedState).length > 0) {
              console.log('Restored state from chrome.storage:', savedState);
              
              // Merge state, overriding store.state with savedState
              store.replaceState({
                ...store.state,
                ...savedState
              });
              
              // Also save critical values to session storage as backup
              saveToSessionStorage(savedState);
              stateRestored = true;
            }
          } catch (error) {
            console.error('Failed to restore state from chrome.storage:', error);
            // State restoration failed, try session storage next
          }
        }
        
        // If we didn't restore state from chrome.storage, try session storage
        if (!stateRestored) {
          console.log('Trying to recover from session storage');
          try {
            const apiKey = sessionStorage.getItem('clockify_api_key');
            const profile = sessionStorage.getItem('profile');
            
            if (apiKey) {
              store.commit('updateField', { path: 'apiKey', value: apiKey });
              console.log('Restored API key from session storage');
            }
            
            if (profile) {
              store.commit('updateField', { path: 'profile', value: profile });
              console.log('Restored profile from session storage');
            }
          } catch (e) {
            console.error('Failed to recover from session storage:', e);
          }
        }
        
        // Extra safety check: debug output of current state after initialization
        console.debug('Current state after initialization:', 
          { 
            apiKey: store.state.apiKey ? 'exists' : 'missing', 
            profile: store.state.profile 
          }
        );
      });
    };
    
    // Call initialization
    initializeStore();    // Subscribe to store mutations and persist to chrome.storage
    store.subscribe((mutation, state) => {
      try {
        // Debug which mutation is happening
        console.debug('Store mutation:', mutation.type, mutation.payload);
        
        // Only persist state if it's a field update or we have API key or profile
        const shouldPersist = mutation.type === 'updateField' || 
                             (state.apiKey && state.apiKey.length > 0) || 
                             (state.profile && state.profile.length > 0);
        
        if (!shouldPersist) {
          console.debug('Skipping storage persistence - no critical data yet');
          return;
        }
        
        const persistedState = paths.length === 0
          ? state
          : paths.reduce((subset, path) => {
              // Handle nested paths with dot notation
              const parts = path.split('.');
              let value = state;
              for (let i = 0; i < parts.length; i++) {
                value = value[parts[i]];
                if (value === undefined) break;
              }
              if (value !== undefined) {
                // Handle nested paths for the subset object
                let current = subset;
                for (let i = 0; i < parts.length - 1; i++) {
                  if (!current[parts[i]]) current[parts[i]] = {};
                  current = current[parts[i]];
                }
                current[parts[parts.length - 1]] = value;
              }
              return subset;
            }, {});
        
        // Log persisted state before saving
        console.debug('Persisting state to chrome.storage:', { 
          apiKey: persistedState.apiKey ? 'exists' : 'missing',
          profile: persistedState.profile
        });
        
        // Save to chrome.storage
        chrome.storage[storageArea].set({ [key]: JSON.stringify(persistedState) }, () => {
          if (chrome.runtime.lastError) {
            console.error('Failed to persist state:', chrome.runtime.lastError);
          } else {
            console.debug('State successfully persisted to chrome.storage');
            // Also save critical values to session storage as backup
            saveToSessionStorage(state);
          }
        });
      } catch (error) {
        console.error('Failed to persist state to chrome.storage:', error);
      }
    });
  };
};

export default createChromeStoragePersistedState;
