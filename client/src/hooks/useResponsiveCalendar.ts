import { useState, useEffect } from 'react';

export function useResponsiveCalendar() {
  const [numberOfMonths, setNumberOfMonths] = useState(2);

  useEffect(() => {
    const updateMonths = () => {
      if (window.innerWidth < 640) {
        setNumberOfMonths(1);
      } else {
        setNumberOfMonths(2);
      }
    };

    // Initial check
    updateMonths();

    // Listen for resize
    window.addEventListener('resize', updateMonths);

    return () => window.removeEventListener('resize', updateMonths);
  }, []);

  return numberOfMonths;
}
