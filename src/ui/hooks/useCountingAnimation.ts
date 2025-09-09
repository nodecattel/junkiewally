import { useEffect, useState, useRef } from 'react';

interface UseCountingAnimationOptions {
  duration?: number; // Animation duration in milliseconds
  startValue?: number; // Starting value for animation
  endValue: number; // Target value
  enabled?: boolean; // Whether animation is enabled
  easing?: (t: number) => number; // Easing function
}

const defaultEasing = (t: number): number => {
  // Ease out cubic for smooth deceleration
  return 1 - Math.pow(1 - t, 3);
};

export const useCountingAnimation = ({
  duration = 3000,
  startValue = 0,
  endValue,
  enabled = true,
  easing = defaultEasing
}: UseCountingAnimationOptions) => {
  const [currentValue, setCurrentValue] = useState<number>(enabled ? startValue : endValue);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();

  useEffect(() => {
    if (!enabled || endValue === currentValue) {
      setCurrentValue(endValue);
      return;
    }

    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    setIsAnimating(true);
    startTimeRef.current = undefined;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Apply easing function
      const easedProgress = easing(progress);
      
      // Calculate current value
      const range = endValue - startValue;
      const newValue = startValue + (range * easedProgress);
      
      setCurrentValue(newValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentValue(endValue);
        setIsAnimating(false);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setIsAnimating(false);
    };
  }, [endValue, enabled, duration, startValue, easing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return {
    value: currentValue,
    isAnimating
  };
};
