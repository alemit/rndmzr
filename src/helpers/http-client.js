import axios from 'axios'
import rateLimit from 'axios-rate-limit'
import * as rax from 'retry-axios'

rax.attach()

// Create a wrapper for chrome.storage.local.get that returns a Promise
const chromeStorageGet = (key) => {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get([key], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result[key]);
        }
      });
    } catch (e) {
      reject(e);
    }
  });
};

// API key cache to avoid repeated storage calls
let cachedApiKey = null;

// Function to get API key asynchronously
const getApiKeyAsync = async () => {
  // Use cached key if available
  if (cachedApiKey) {
    return cachedApiKey;
  }
  
  try {
    // Try to get from chrome.storage.local directly with the key 'vuex'
    const vuexJson = await chromeStorageGet('vuex');
    if (vuexJson) {
      try {
        const vuexState = JSON.parse(vuexJson);
        if (vuexState && vuexState.apiKey) {
          // Cache for future use
          cachedApiKey = vuexState.apiKey;
          console.log('Retrieved API key from chrome.storage');
          return vuexState.apiKey;
        }
      } catch (err) {
        console.error('Failed to parse vuex state:', err);
      }
    }
    
    // Fallback to session storage
    const sessionKey = sessionStorage.getItem('clockify_api_key');
    if (sessionKey) {
      cachedApiKey = sessionKey;
      console.log('Retrieved API key from session storage');
      return sessionKey;
    }
    
    console.warn('No API key found in any storage');
    return null;
  } catch (e) {
    console.error('Error retrieving API key:', e);
    return null;
  }
};

const httpClient = rateLimit(axios.create({
    baseURL: 'https://api.clockify.me/api/v1',
    timeout: 60000,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    },
    raxConfig: {
      retry: 3,
      backoffType: 'exponential',
      httpMethodsToRetry: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    }
}), { maxRPS: 8 }); // Clockify accepts 10 RPS, 8 should be a safe bet

// Create an interceptor that adds the API key to each request
httpClient.interceptors.request.use(
    async (config) => {
      const apiKey = await getApiKeyAsync();
      if (apiKey) {
        config.headers['X-Api-Key'] = apiKey;
      } else {
        console.warn('Making request without API key');
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
);

// Add a response interceptor to handle errors more gracefully
httpClient.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // Get request URL for better error reporting
    const url = error.config?.url || 'unknown endpoint';
    
    // Handle specific error types
    if (error.response) {
      // Server responded with a status code outside of 2xx range
      const status = error.response.status;
      
      if (status === 404) {
        // For approval-requests 404s, just use debug logging to reduce console noise
        if (url.includes('approval-requests')) {
          console.debug(`Resource not found (404) at ${url} - This is expected for some Clockify endpoints`);
          
          // For week-status 404s, return a default response
          if (url.includes('week-status')) {
            return Promise.resolve({
              data: { status: 'UNSUBMITTED' }
            });
          }
        } else {
          // Log other 404s as warnings
          console.warn(`Resource not found (404) at ${url}`);
        }
      } else if (status === 401) {
        console.error(`Authentication failed (401) at ${url} - Check your API key`);
      } else {
        console.error(`API error: ${status} at ${url}`, error.response.data);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error(`No response received from ${url}`, error.request);
    } else {
      // Something else happened while setting up the request
      console.error(`Error setting up request to ${url}:`, error.message);
    }
    
    return Promise.reject(error);
  }
);
  
export default httpClient;