// Splash screen manager with timing control
export class SplashManager {
  private static instance: SplashManager;
  private currentSplashIndex: number = 0;
  private lastChangeTime: number = 0;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CHANGE_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
  private readonly SPLASH_CLASSES = ['splash-1', 'splash-2', 'splash-3'];
  private readonly STORAGE_KEY = 'junkiewally_splash_state';

  private constructor() {
    this.loadState();
    this.setupInterval();
  }

  public static getInstance(): SplashManager {
    if (!SplashManager.instance) {
      SplashManager.instance = new SplashManager();
    }
    return SplashManager.instance;
  }

  private loadState(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const state = JSON.parse(stored);
        this.currentSplashIndex = state.currentSplashIndex || 0;
        this.lastChangeTime = state.lastChangeTime || Date.now();
      } else {
        // First time - set random initial splash
        this.currentSplashIndex = Math.floor(Math.random() * this.SPLASH_CLASSES.length);
        this.lastChangeTime = Date.now();
        this.saveState();
      }
    } catch (error) {
      console.warn('Failed to load splash state:', error);
      this.currentSplashIndex = Math.floor(Math.random() * this.SPLASH_CLASSES.length);
      this.lastChangeTime = Date.now();
    }
  }

  private saveState(): void {
    try {
      const state = {
        currentSplashIndex: this.currentSplashIndex,
        lastChangeTime: this.lastChangeTime,
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save splash state:', error);
    }
  }

  private setupInterval(): void {
    // Clear any existing interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // Set up interval to check for splash changes every minute
    this.intervalId = setInterval(() => {
      this.checkAndUpdateSplash();
    }, 60 * 1000); // Check every minute
  }

  private checkAndUpdateSplash(): void {
    const now = Date.now();
    const timeSinceLastChange = now - this.lastChangeTime;

    if (timeSinceLastChange >= this.CHANGE_INTERVAL) {
      this.nextSplash();
    }
  }

  private nextSplash(): void {
    this.currentSplashIndex = (this.currentSplashIndex + 1) % this.SPLASH_CLASSES.length;
    this.lastChangeTime = Date.now();
    this.saveState();
  }

  public getCurrentSplashClass(): string {
    // Check if it's time to change splash on each call
    this.checkAndUpdateSplash();

    // Validate index is within bounds
    if (this.currentSplashIndex < 0 || this.currentSplashIndex >= this.SPLASH_CLASSES.length) {
      console.warn('Invalid splash index, resetting to 0:', this.currentSplashIndex);
      this.currentSplashIndex = 0;
    }

    const splashClass = this.SPLASH_CLASSES[this.currentSplashIndex];
    return splashClass || 'splash-1'; // Fallback to splash-1 if undefined
  }

  public forceNextSplash(): string {
    this.nextSplash();
    return this.getCurrentSplashClass();
  }

  public onWalletReopen(): string {
    // Change splash when wallet is reopened
    this.nextSplash();
    return this.getCurrentSplashClass();
  }

  public cleanup(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

// Hook for using splash manager in React components
import { useEffect, useState } from 'react';

export const useSplashManager = (triggerOnMount: boolean = false) => {
  // Initialize with a default splash class instead of empty string
  const [splashClass, setSplashClass] = useState<string>('splash-1');

  useEffect(() => {
    const manager = SplashManager.getInstance();

    let newSplashClass: string;
    if (triggerOnMount) {
      // Change splash when component mounts (wallet reopening)
      newSplashClass = manager.onWalletReopen();
    } else {
      // Just get current splash
      newSplashClass = manager.getCurrentSplashClass();
    }

    // Validate the splash class before setting it
    if (newSplashClass && newSplashClass.trim() !== '') {
      setSplashClass(newSplashClass);
    } else {
      console.warn('Invalid splash class returned, using default:', newSplashClass);
      setSplashClass('splash-1');
    }

    // Set up periodic updates to check for splash changes
    const updateInterval = setInterval(() => {
      setSplashClass(manager.getCurrentSplashClass());
    }, 60 * 1000); // Check every minute

    return () => {
      clearInterval(updateInterval);
    };
  }, [triggerOnMount]);

  return splashClass;
};
