const runMegaAndroidAppiumSuite = require('../tests/mega_android_1100.test');

async function main() {
  try {
    await runMegaAndroidAppiumSuite();
  } catch (err) {
    console.error('Mobile Appium Suite Execution Error:', err);
    process.exit(1);
  }
}

main();
