import Vue from 'vue'
import AsyncComputed from 'vue-async-computed'
import { version } from '../../package.json'
import Bugsnag from '@bugsnag/js'
import BugsnagPluginVue from '@bugsnag/plugin-vue'

// Configure Bugsnag with more restrictive settings
Bugsnag.start({
  appVersion: version,
  apiKey: 'aa69e867b15752ede4c55948a83f144e',
  maxBreadcrumbs: 50,
  maxEvents: 5, // Reduce from default of 10
  enabledBreadcrumbTypes: ['error', 'log', 'user'],
  autoTrackSessions: false, // Disable auto session tracking
  collectUserIp: false, // Privacy enhancement
  plugins: [new BugsnagPluginVue()],
  onError: event => {
    // Check if this is a configuration error
    const isConfigError = event.errors.some(e => 
      e.errorMessage && (
        e.errorMessage.includes('No profile has been configured') ||
        e.errorMessage.includes('Clockify API key has not been configured')
      )
    );
    
    // Don't report configuration errors
    if (isConfigError) {
      return false;
    }
    
    // Fix stack trace format
    event.errors[0].stacktrace = event.errors[0].stacktrace.map(frame => {
      frame.file = frame.file.replace(/chrome-extension:/g, 'chrome_extension:')
      return frame
    })
    
    return true;
  }
})

import Buefy from 'buefy'

import App from './App.vue'
import store from '../store'
import httpClient from '../helpers/http-client'
import ClockifyService from '../services/clockify-service'
import ProfileService from '../services/profile-service'

import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

// For Manifest V3, use our mock implementation of Panelbear
// We can't load external scripts due to CSP restrictions
import * as Panelbear from '../helpers/panelbear-mock'

console.log('Using Panelbear mock for Manifest V3 compatibility');
Panelbear.load('3nnrFy5shOb', {
  autoTrack: true,
  spaMode: 'history',
  debug: false
});
Panelbear.trackPageview();

// Setup Bugsnag
const bugsnagVue = Bugsnag.getPlugin('vue')
bugsnagVue.installVueErrorHandler(Vue)

// Enable Devtools
Vue.config.devtools = true

// Setup FontAwesome icons
library.add(fas)
library.add(fab)
Vue.component('vue-fontawesome', FontAwesomeIcon)

Vue.use(Buefy, {
  defaultIconComponent: FontAwesomeIcon,
  defaultIconPack: 'fas'
})
Vue.use(AsyncComputed)

// Init Clockify service
const clockify = new ClockifyService(httpClient)

// Create ProfileService instance
const profileService = new ProfileService()

// Inject services into Vue prototype
Vue.prototype.$http = httpClient
Vue.prototype.$clockify = clockify
Vue.prototype.$profileService = profileService
// Add Panelbear to Vue prototype with fallback if tracking fails
Vue.prototype.$panelbear = {
  track: (eventName, props) => {
    try {
      Panelbear.track(eventName, props);
    } catch (err) {
      console.warn(`Failed to track event: ${eventName}`, err);
    }
  }
}
Vue.prototype.$bugsnag = Bugsnag

/* eslint-disable no-new */
new Vue({
  store,
  el: '#app',
  render: h => h(App)
})