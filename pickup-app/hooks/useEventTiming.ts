import { useEffect, useState } from 'react';
import { PickupEvent } from '@/types';

/**
 * Hook to manage real-time event timing display
 * Updates every second to show accurate "Starts in X" or "X left" timing
 */
export function useEventTiming(events: PickupEvent[]) {
  const [, setUpdateTrigger] = useState(0);

  useEffect(() => {
    // Update timing display every second
    const interval = setInterval(() => {
      setUpdateTrigger(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getEventTiming = (event: PickupEvent): string => {
    const now = new Date();
    
    // Use event.startTime if available, otherwise fallback to createdAt
    const eventStartTime = event.startTime || event.createdAt;
    const eventEndTime = event.expiresAt;
    
    // Time until event starts
    const timeUntilStart = eventStartTime.getTime() - now.getTime();
    // Time remaining in event
    const timeRemaining = eventEndTime.getTime() - now.getTime();

    if (timeRemaining <= 0) {
      return 'Expired';
    }

    if (timeUntilStart > 0) {
      // Event hasn't started yet
      const hoursUntil = Math.floor(timeUntilStart / (1000 * 60 * 60));
      const minutesUntil = Math.floor((timeUntilStart % (1000 * 60 * 60)) / (1000 * 60));
      
      let startsIn = '';
      if (hoursUntil > 0) {
        startsIn = minutesUntil > 0 ? `${hoursUntil}h ${minutesUntil}m` : `${hoursUntil}h`;
      } else {
        startsIn = `${minutesUntil}m`;
      }
      
      return `Starts in ${startsIn}`;
    } else {
      // Event has started, show time remaining
      const hoursLeft = Math.floor(timeRemaining / (1000 * 60 * 60));
      const minutesLeft = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hoursLeft > 0) {
        return minutesLeft > 0 ? `${hoursLeft}h ${minutesLeft}m left` : `${hoursLeft}h left`;
      }
      return `${minutesLeft}m left`;
    }
  };

  return getEventTiming;
}
