// Direct implementation of isItReminderTime without import
const isItReminderTime = (days, time) => {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Convert time string (from store) to Date object
  const reminderTime = new Date(time);
  const hour = reminderTime.getHours();
  const minute = reminderTime.getMinutes();
  
  // Check if current day is in reminder days array
  if (days.includes(day)) {
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Check if current time matches reminder time
    return currentHour === hour && currentMinute === minute;
  }
  
  return false;
};

// Set default icons (we can't use matchMedia in service worker)
chrome.runtime.onInstalled.addListener(() => {
  // Default to standard icons
  console.log("Extension installed");
});

// Handle icon click
chrome.action.onClicked.addListener(() => {
  const standaloneURL = chrome.runtime.getURL('index.html');
  chrome.tabs.create({
    url: standaloneURL
  });
});

// Create alarm for reminder checks
chrome.alarms.create('reminderCheck', { periodInMinutes: 1 });

// Listen for alarm events
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'reminderCheck') {
    chrome.storage.local.get(['vuex'], (result) => {
      if (result.vuex) {
        const vuex = JSON.parse(result.vuex);
        if (vuex.reminder && isItReminderTime(vuex.reminderDays, vuex.reminderTime)) {
          chrome.notifications.create('rndmzr-reminder', {
            iconUrl: 'icons/48.png',
            message: 'Time to fill in your timesheets 🧐',
            title: 'rndmzr',
            type: 'basic',
            requireInteraction: true
          });
        }
      }
    });
  }
});
