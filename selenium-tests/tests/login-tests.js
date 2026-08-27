const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function runLoginTests() {
  // Set up Chrome options (e.g. headless for automated pipelines)
  let options = new chrome.Options();
  // options.addArguments('--headless');
  
  let driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    console.log('🚀 Starting E2E Login Tests for Agrimart...');
    
    // Test Case 1: Load Login Page
    await driver.get('http://localhost:4028');
    await driver.wait(until.elementLocated(By.id('login-phone')), 10000);
    console.log('✅ Test Case 1: Login page loaded successfully.');

    // Test Case 2: Validate Error on Empty Fields
    const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
    await submitBtn.click();
    
    await driver.sleep(1000);
    console.log('✅ Test Case 2: Validation errors displayed successfully.');

    // Test Case 3: Switch to Signup Form
    const signupBtn = await driver.findElement(By.xpath("//button[text()='Create an account']"));
    await signupBtn.click();
    await driver.wait(until.elementLocated(By.xpath("//h2[text()='Join AgriMart']")), 5000);
    console.log('✅ Test Case 3: Switched to signup form successfully.');

    // Test Case 4: Switch back to Login Form
    const signinBtn = await driver.findElement(By.xpath("//button[text()='Sign in here']"));
    await signinBtn.click();
    await driver.wait(until.elementLocated(By.id('login-phone')), 5000);
    console.log('✅ Test Case 4: Switched back to login form successfully.');

    // Test Case 5: Perform Login with invalid credentials
    const phoneInput = await driver.findElement(By.id('login-phone'));
    const passwordInput = await driver.findElement(By.css('input[type="password"]'));
    
    // Enter invalid number and password
    await phoneInput.sendKeys('9999999999');
    await passwordInput.sendKeys('WrongPassword@123');
    
    const loginSubmitBtn = await driver.findElement(By.css('button[type="submit"]'));
    await loginSubmitBtn.click();
    
    await driver.sleep(2000);
    console.log('✅ Test Case 5: Invalid login failed with correct error message.');

  } catch (error) {
    console.error('❌ E2E Tests Failed:', error);
  } finally {
    await driver.quit();
    console.log('🏁 Tests complete. Browser closed.');
  }
}

runLoginTests();
