import { useEffect } from "react";

export const useBodyClass = (className: string) => {
  useEffect(() => {
    // Validate className is not empty or undefined
    if (!className || className.trim() === '') {
      console.warn('useBodyClass: Empty or invalid className provided:', className);
      return;
    }

    document.body.classList.add(className);

    return () => {
      document.body.classList.remove(className);
    };
  }, [className]);
};
