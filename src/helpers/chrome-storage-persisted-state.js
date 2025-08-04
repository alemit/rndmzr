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
      chrome.storage[storageArea].get([key], result => {
        if (result[key]) {
          try {
            const savedState = JSON.parse(result[key]);
            if (savedState) {
              console.log('Restored state from chrome.storage');
              store.replaceState({
                ...store.state,
                ...savedState
              });
              
              // Also save critical values to session storage as backup
              saveToSessionStorage(savedState);
            }
          } catch (error) {
            console.error('Failed to restore state from chrome.storage:', error);
            
            // Try to recover from session storage
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
        }
      });
    };
    
    // Call initialization
    initializeStore();

    // Subscribe to store mutations and persist to chrome.storage
    store.subscribe((mutation, state) => {
      try {
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
        
        // Save to chrome.storage
        chrome.storage[storageArea].set({ [key]: JSON.stringify(persistedState) }, () => {
          if (chrome.runtime.lastError) {
            console.error('Failed to persist state:', chrome.runtime.lastError);
          } else {
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
