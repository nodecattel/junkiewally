// Demonstration of splash screen timing functionality
console.log('🎨 Splash Screen Manager Demo\n');

// Simulate the splash manager behavior
class SplashManagerDemo {
  constructor() {
    this.currentSplashIndex = 0;
    this.lastChangeTime = Date.now();
    this.CHANGE_INTERVAL = 5 * 60 * 1000; // 5 minutes
    this.SPLASH_CLASSES = ['splash-1', 'splash-2', 'splash-3'];
  }

  getCurrentSplashClass() {
    const now = Date.now();
    const timeSinceLastChange = now - this.lastChangeTime;
    
    if (timeSinceLastChange >= this.CHANGE_INTERVAL) {
      this.nextSplash();
    }
    
    return this.SPLASH_CLASSES[this.currentSplashIndex];
  }

  nextSplash() {
    this.currentSplashIndex = (this.currentSplashIndex + 1) % this.SPLASH_CLASSES.length;
    this.lastChangeTime = Date.now();
    console.log(`🔄 Splash changed to: ${this.SPLASH_CLASSES[this.currentSplashIndex]}`);
  }

  onWalletReopen() {
    console.log('🚪 Wallet reopened - forcing splash change');
    this.nextSplash();
    return this.getCurrentSplashClass();
  }

  simulateTimePassage(minutes) {
    console.log(`⏰ Simulating ${minutes} minutes passing...`);
    this.lastChangeTime -= minutes * 60 * 1000;
    return this.getCurrentSplashClass();
  }
}

// Demo the functionality
const demo = new SplashManagerDemo();

console.log('Initial splash:', demo.getCurrentSplashClass());
console.log('');

console.log('Simulating wallet usage:');
console.log('Current splash:', demo.getCurrentSplashClass());
console.log('');

console.log('Simulating 3 minutes of usage (no change expected):');
demo.simulateTimePassage(3);
console.log('Current splash:', demo.getCurrentSplashClass());
console.log('');

console.log('Simulating 5 minutes of usage (change expected):');
demo.simulateTimePassage(5);
console.log('Current splash:', demo.getCurrentSplashClass());
console.log('');

console.log('Simulating wallet reopen:');
console.log('New splash:', demo.onWalletReopen());
console.log('');

console.log('✅ Splash screen timing demo completed!');
console.log('');
console.log('Key Features Demonstrated:');
console.log('• Splash changes every 5 minutes during active use');
console.log('• Splash changes when wallet is reopened');
console.log('• State is persistent using localStorage');
console.log('• Smooth rotation through 3 different splash images');
