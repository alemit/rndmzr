<template>
  <div>
    <app-header></app-header>
    <div class="container">
      <div v-if="configError" class="notification is-warning">
        {{ configError }}
      </div>
      <my-projects></my-projects>
      <timesheet-table></timesheet-table>
    </div>
    <missing-config></missing-config>
    <app-footer></app-footer>
  </div>
</template>

<script>
import { mapFields } from 'vuex-map-fields'

import AppHeader from '../components/AppHeader.vue'
import MyProjects from '../components/MyProjects.vue'
import TimesheetTable from '../components/TimesheetTable.vue'
import MissingConfig from '../components/util/MissingConfig.vue'
import AppFooter from '../components/AppFooter.vue'

export default {
  name: 'App',
  components: {
    AppHeader,
    AppFooter,
    MyProjects,
    TimesheetTable,
    MissingConfig
  },
  data() {
    return {
      configLoaded: false,
      configError: null,
      errorCount: 0 // Track Bugsnag errors to avoid flooding
    }
  },
  async created() {
    try {
      // Configure Bugsnag error limit
      this.$bugsnag.addOnError(event => {
        this.errorCount++;
        
        // Stop reporting errors after a certain limit to avoid maxEvents errors
        if (this.errorCount > 8) {
          return false; // Cancel this event
        }
        
        // Only add user metadata if we have it
        if (this.userInfo && this.userInfo.email) {
          event.addMetadata('user', 'email', this.userInfo.email);
        }
        
        return true; // Allow this event
      });
      
      // Check if API key and profile are configured
      const hasConfig = await this.checkConfig();
      
      if (hasConfig) {
        try {
          // Try to initialize the profile service
          if (this.profile) {
            try {
              // Make distributionProfile available globally to help components
              this.$distributionProfile = this.$profileService.getDistributionProfile(this.profile);
              console.log("Distribution profile loaded:", this.profile);
            } catch (profileError) {
              console.warn('Failed to initialize distribution profile:', profileError);
            }
          }
          
          // Get user info
          this.userInfo = await this.$clockify.getUserInfo();
          this.configLoaded = true;
          console.log("Configuration loaded successfully");
        } catch (error) {
          console.error('Error loading user info:', error);
          this.configError = 'Failed to load user information. Please check your API key.';
        }
      } else {
        console.warn('No API key or profile configured');
        this.configError = 'Missing API key or profile configuration. Please configure them in Settings.';
      }
    } catch (error) {
      console.error('Error during app initialization:', error);
      this.configError = 'Error during initialization. Please try reloading the extension.';
    }
    
    this.$bugsnag.leaveBreadcrumb('App loaded');
  },
  methods: {
    async checkConfig() {
      return new Promise((resolve) => {
        chrome.storage.local.get(['vuex'], (result) => {
          if (result.vuex) {
            try {
              const state = JSON.parse(result.vuex);
              resolve(!!(state.apiKey && state.profile));
            } catch (e) {
              console.error('Failed to parse config:', e);
              resolve(false);
            }
          } else {
            resolve(false);
          }
        });
      });
    }
  },
  computed: {
    ...mapFields([
      'userInfo'
    ])
  }
}
</script>
