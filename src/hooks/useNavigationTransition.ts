import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const useNavigationTransition = () => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();

  const navigateWithTransition = useCallback(async (
    path: string, 
    delay: number = 200,
    onBeforeNavigate?: () => Promise<void>
  ) => {
    setIsTransitioning(true);
    
    try {
      // Execute any pre-navigation logic
      if (onBeforeNavigate) {
        await onBeforeNavigate();
      }
      
      // Wait for the specified delay to ensure state updates
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Navigate to the new path
      navigate(path);
    } catch (error) {
      console.error('Navigation transition error:', error);
      setIsTransitioning(false);
    }
  }, [navigate]);

  return {
    isTransitioning,
    navigateWithTransition,
    setIsTransitioning
  };
};