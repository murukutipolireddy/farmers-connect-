const path = require('path');

exports.config = {
  runner: 'local',
  port: 4723,
  specs: [
    './tests/**/*.test.js'
  ],
  exclude: [],
  maxInstances: 1,
  capabilities: [{
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': 'Android Emulator',
    'appium:app': path.resolve(__dirname, '../android/app/build/outputs/apk/debug/app-debug.apk'),
    'appium:appPackage': 'com.agrimart.app',
    'appium:appActivity': 'com.agrimart.app.MainActivity',
    'appium:noReset': false,
    'appium:fullReset': false,
    'appium:newCommandTimeout': 240,
    'appium:autoGrantPermissions': true
  }],
  logLevel: 'info',
  bail: 0,
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  services: ['appium'],
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000
  }
};
