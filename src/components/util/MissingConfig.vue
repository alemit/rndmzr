<template>
  <b-modal v-model="isConfigMissing" :width="480" :can-cancel="false" scroll="keep">
    <div class="modal-card" style="width: auto">
        <header class="modal-card-head">
            <p class="modal-card-title">Missing configuration</p>
        </header>
        <section class="modal-card-body">
            <div v-if="debugInfo" class="notification is-info is-light">
              <p><strong>Debug Info:</strong></p>
              <p>API Key present: {{ !!apiKey }}</p>
              <p>Profile present: {{ !!profile }}</p>
            </div>
            Please configure a <span class="semi-bold">Profile</span> and <span class="semi-bold">API Key</span> in
            the <span class="semi-bold"><a @click="openSettings()">Settings</a></span> page in order to use the extension.
            <div class="mt-3">
              <button @click="refreshConfig" class="button is-small">Refresh Configuration</button>
            </div>
        </section>
        <footer class="modal-card-foot">
        </footer>
    </div>
  </b-modal>
</template>

<script>
import { mapFields } from 'vuex-map-fields'

export default {
  name: 'MissingConfig',
  data() {
    return {
      debugInfo: false
    }
  },
  computed: {
    ...mapFields([
      'profile',
      'apiKey'
    ]),
    isConfigMissing: function() {
      return !this.profile || !this.apiKey
    }
  },
  created() {
    // Check configuration on component creation
    this.checkStoredConfig();
  },
  methods: {
    openSettings() {
      chrome.runtime.openOptionsPage()
    },
    refreshConfig() {
      this.debugInfo = true;
      this.checkStoredConfig();
    },
    checkStoredConfig() {
      chrome.storage.local.get(['vuex'], (result) => {
        if (result.vuex) {
          try {
            const state = JSON.parse(result.vuex);
            if (state.apiKey && !this.apiKey) {
              this.$store.commit('updateField', { path: 'apiKey', value: state.apiKey });
              console.log('Restored API key from chrome.storage');
            }
            if (state.profile && !this.profile) {
              this.$store.commit('updateField', { path: 'profile', value: state.profile });
              console.log('Restored profile from chrome.storage');
            }
          } catch (e) {
            console.error('Failed to parse stored config:', e);
          }
        }
      });
    }
  }
}
</script>
