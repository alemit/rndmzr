# rndmzr
Chrome extension which *automagically* generates and submits Clockify timesheets based on a CAPEX/OPEX ratio profile.

## Motivation
Filling out timesheets is too much of a hassle - why bother? 😅

## Build status
[![Build Status](https://travis-ci.com/marchev/rndmzr.svg?branch=main)](https://travis-ci.com/marchev/rndmzr)

## Screenshots
![rndmzr](https://raw.githubusercontent.com/marchev/rndmzr/main/meta/app-screenshot.png)

## Tech/framework used
Built with:
- [Vue.js](https://vuejs.org/)
- [Buefy](https://buefy.org/)
- [Font Awesome](https://fontawesome.com/)
- [vue-web-extension](https://github.com/Kocal/vue-web-extension)

## Features
- Automagic randomized generation and submission of Clockify timesheets
- Historical timesheets browsing

## How to use?
1. Navigate to https://chrome.google.com/webstore/detail/rndmzr/kfmkpkijifhcceglddpienfkembifjlj
1. Install the extension
1. rndmz 😎

## Development

### Development Mode (Live Changes)
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Vue.js Only Build (Advanced)
```bash
npm run build:vue
```
*Builds Vue.js files only, without Chrome extension fixes*

### Load in Chrome
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" → select `dist` folder

### Develop
- Edit Vue components → Auto-updates
- Edit service worker → Reload extension in Chrome

### Debug Tools
In extension console (F12):
```javascript
window.debugStorage.dump()   // Show all storage
window.debugStorage.clear()  // Clear storage
```

**Works on Windows (Git Bash) and macOS.** 🚀

## Contribute
Any contribution is more than welcomed. If you find a issue, have an idea of a great feature or simply want to make a pull request - go for it! Here is a kanban board with all project issues:
https://github.com/marchev/rndmzr/projects/1 

## Project with a cause
This extension is **donationware** - all proceeds received would be donated to [SOS Children's Villages Bulgaria](https://sosbg.org/).

## License
[Commons Clause License Condition v1.0](https://commonsclause.com/)

The Software is provided to you by the Licensor under the License, as defined below, subject to the following condition.

Without limiting other conditions in the License, the grant of rights under the License will not include, and the License does not grant to you, the right to Sell the Software.

For purposes of the foregoing, “Sell” means practicing any or all of the rights granted to you under the License to provide to third parties, for a fee or other consideration (including without limitation fees for hosting or consulting/ support services related to the Software), a product or service whose value derives, entirely or substantially, from the functionality of the Software. Any license notice or attribution required by the License must also include this Commons Cause License Condition notice.
