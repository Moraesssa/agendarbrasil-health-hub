/**
 * Accessibility hooks for location components
 * Provides comprehensive accessibility management including focus, keyboard navigation,
 * screen reader announcements, and high contrast mode support
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  focusElement,
  findFocusableElements,
  getNextFocusableElement,
  announceToScreenReader,
  detectHighContrastMode,
  prefersReducedMotion,
  checkIsTouchDevice,
  KEYBOARD_KEYS,
  isActivationKey,
  isNavigationKey,
  createLiveRegion,
  updateLiveRegion,
  DEFAULT_A11Y_CONFIG
} from '@/utils/accessibilityUtils';

// Types
interface AccessibilityConfig {
  announceSelections?: boolean;
  announceErrors?: boolean;
  announceLoading?: boolean;
  enableKeyboardNavigation?: boolean;
  enableHighContrast?: boolean;
  enableReducedMotion?: boolean;
  touchOptimized?: boolean;
}

interface FocusManagementOptions {
  autoFocus?: boolean;
  restoreFocus?: boolean;
  trapFocus?: boolean;
  skipLinks?: boolean;
}

interface KeyboardNavigationOptions {
  orientation?: 'horizontal' | 'vertical' | 'grid';
  wrap?: boolean;
  homeEndKeys?: boolean;
  typeahead?: boolean;
}

// Main accessibility hook
export const useAccessibility = (config: AccessibilityConfig = DEFAULT_A11Y_CONFIG) => {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [touchDevice, setTouchDevice] = useState(false);

  useEffect(() => {
    // Detect accessibility preferences
    setIsHighContrast(detectHighContrastMode());
    setReducedMotion(prefersReducedMotion());
    setTouchDevice(checkIsTouchDevice());

    // Listen for changes in accessibility preferences
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    highContrastQuery.addEventListener('change', handleHighContrastChange);
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);

    return () => {
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
    };
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (config.announceSelections || config.announceErrors) {
      announceToScreenReader(message, priority);
    }
  }, [config]);

  const announceError = useCallback((error: string) => {
    if (config.announceErrors) {
      announce(`Erro: ${error}`, 'assertive');
    }
  }, [config, announce]);

  const announceSuccess = useCallback((message: string) => {
    if (config.announceSelections) {
      announce(`Sucesso: ${message}`, 'polite');
    }
  }, [config, announce]);

  const announceLoading = useCallback((context: string, isLoading: boolean) => {
    if (config.announceLoading) {
      const message = isLoading ? `Carregando ${context}...` : `${context} carregado.`;
      announce(message, 'polite');
    }
  }, [config, announce]);

  return {
    isHighContrast,
    reducedMotion,
    touchDevice,
    announce,
    announceError,
    announceSuccess,
    announceLoading,
    config
  };
};

// Focus management hook
export const useFocusManagement = (options: FocusManagementOptions = {}) => {
  const containerRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const saveFocus = useCallback(() => {
    if (options.restoreFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [options.restoreFocus]);

  const restoreFocus = useCallback(() => {
    if (options.restoreFocus && previousFocusRef.current) {
      focusElement(previousFocusRef.current);
      previousFocusRef.current = null;
    }
  }, [options.restoreFocus]);

  const focusFirst = useCallback(() => {
    if (!containerRef.current) return false;
    
    const focusableElements = findFocusableElements(containerRef.current);
    if (focusableElements.length > 0) {
      const success = focusElement(focusableElements[0]);
      if (success) setFocusedIndex(0);
      return success;
    }
    return false;
  }, []);

  const focusLast = useCallback(() => {
    if (!containerRef.current) return false;
    
    const focusableElements = findFocusableElements(containerRef.current);
    if (focusableElements.length > 0) {
      const lastIndex = focusableElements.length - 1;
      const success = focusElement(focusableElements[lastIndex]);
      if (success) setFocusedIndex(lastIndex);
      return success;
    }
    return false;
  }, []);

  const focusNext = useCallback(() => {
    if (!containerRef.current) return false;
    
    const current = document.activeElement as HTMLElement;
    const next = getNextFocusableElement(current, containerRef.current, 'next');
    
    if (next) {
      const success = focusElement(next);
      if (success) {
        const focusableElements = findFocusableElements(containerRef.current);
        setFocusedIndex(focusableElements.indexOf(next));
      }
      return success;
    }
    return false;
  }, []);

  const focusPrevious = useCallback(() => {
    if (!containerRef.current) return false;
    
    const current = document.activeElement as HTMLElement;
    const previous = getNextFocusableElement(current, containerRef.current, 'previous');
    
    if (previous) {
      const success = focusElement(previous);
      if (success) {
        const focusableElements = findFocusableElements(containerRef.current);
        setFocusedIndex(focusableElements.indexOf(previous));
      }
      return success;
    }
    return false;
  }, []);

  const focusIndex = useCallback((index: number) => {
    if (!containerRef.current) return false;
    
    const focusableElements = findFocusableElements(containerRef.current);
    if (index >= 0 && index < focusableElements.length) {
      const success = focusElement(focusableElements[index]);
      if (success) setFocusedIndex(index);
      return success;
    }
    return false;
  }, []);

  // Auto focus on mount
  useEffect(() => {
    if (options.autoFocus) {
      focusFirst();
    }
  }, [options.autoFocus, focusFirst]);

  // Focus trap
  useEffect(() => {
    if (!options.trapFocus || !containerRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === KEYBOARD_KEYS.TAB) {
        const focusableElements = findFocusableElements(containerRef.current!);
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            focusElement(lastElement);
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            focusElement(firstElement);
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [options.trapFocus]);

  return {
    containerRef,
    focusedIndex,
    saveFocus,
    restoreFocus,
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
    focusIndex
  };
};

// Keyboard navigation hook
export const useKeyboardNavigation = (
  onActivate: (index: number) => void,
  options: KeyboardNavigationOptions = {}
) => {
  const { containerRef, focusedIndex, focusFirst, focusLast, focusNext, focusPrevious, focusIndex } = useFocusManagement();
  const [typeaheadQuery, setTypeaheadQuery] = useState('');
  const typeaheadTimeoutRef = useRef<NodeJS.Timeout>();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!containerRef.current) return;

    const { orientation = 'horizontal', wrap = true, homeEndKeys = true, typeahead = false } = options;

    // Handle activation keys
    if (isActivationKey(e.key)) {
      e.preventDefault();
      if (focusedIndex >= 0) {
        onActivate(focusedIndex);
      }
      return;
    }

    // Handle navigation keys
    if (isNavigationKey(e.key)) {
      e.preventDefault();

      switch (e.key) {
        case KEYBOARD_KEYS.ARROW_RIGHT:
          if (orientation === 'horizontal' || orientation === 'grid') {
            focusNext();
          }
          break;
        case KEYBOARD_KEYS.ARROW_LEFT:
          if (orientation === 'horizontal' || orientation === 'grid') {
            focusPrevious();
          }
          break;
        case KEYBOARD_KEYS.ARROW_DOWN:
          if (orientation === 'vertical' || orientation === 'grid') {
            focusNext();
          }
          break;
        case KEYBOARD_KEYS.ARROW_UP:
          if (orientation === 'vertical' || orientation === 'grid') {
            focusPrevious();
          }
          break;
        case KEYBOARD_KEYS.HOME:
          if (homeEndKeys) {
            focusFirst();
          }
          break;
        case KEYBOARD_KEYS.END:
          if (homeEndKeys) {
            focusLast();
          }
          break;
      }
      return;
    }

    // Handle typeahead
    if (typeahead && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      
      const newQuery = typeaheadQuery + e.key.toLowerCase();
      setTypeaheadQuery(newQuery);

      // Find matching element
      const focusableElements = findFocusableElements(containerRef.current);
      const matchingIndex = focusableElements.findIndex((element, index) => {
        const text = element.textContent?.toLowerCase() || '';
        return index > focusedIndex && text.startsWith(newQuery);
      });

      if (matchingIndex >= 0) {
        focusIndex(matchingIndex);
      }

      // Clear typeahead query after delay
      if (typeaheadTimeoutRef.current) {
        clearTimeout(typeaheadTimeoutRef.current);
      }
      typeaheadTimeoutRef.current = setTimeout(() => {
        setTypeaheadQuery('');
      }, 1000);
    }
  }, [containerRef, focusedIndex, onActivate, options, typeaheadQuery, focusNext, focusPrevious, focusFirst, focusLast, focusIndex]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    containerRef,
    focusedIndex,
    typeaheadQuery
  };
};

// Live region hook for announcements
export const useLiveRegion = (id: string, priority: 'polite' | 'assertive' = 'polite') => {
  const liveRegionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    liveRegionRef.current = createLiveRegion(id, priority);
    
    return () => {
      if (liveRegionRef.current && liveRegionRef.current.parentNode) {
        liveRegionRef.current.parentNode.removeChild(liveRegionRef.current);
      }
    };
  }, [id, priority]);

  const announce = useCallback((message: string) => {
    updateLiveRegion(id, message);
  }, [id]);

  return { announce };
};

// High contrast mode hook
export const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const checkHighContrast = () => {
      setIsHighContrast(detectHighContrastMode());
    };

    checkHighContrast();

    // Listen for changes
    const mediaQueries = [
      '(prefers-contrast: high)',
      '(-ms-high-contrast: active)',
      '(-ms-high-contrast: black-on-white)',
      '(-ms-high-contrast: white-on-black)'
    ];

    const listeners = mediaQueries.map(query => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', checkHighContrast);
      return { mq, listener: checkHighContrast };
    });

    return () => {
      listeners.forEach(({ mq, listener }) => {
        mq.removeEventListener('change', listener);
      });
    };
  }, []);

  const getHighContrastStyles = useMemo(() => {
    if (!isHighContrast) return {};
    
    return {
      border: '2px solid',
      outline: '2px solid transparent',
      outlineOffset: '2px',
      backgroundColor: 'Canvas',
      color: 'CanvasText',
      forcedColorAdjust: 'none'
    };
  }, [isHighContrast]);

  return {
    isHighContrast,
    getHighContrastStyles
  };
};

// Reduced motion hook
export const useReducedMotion = () => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const checkReducedMotion = () => {
      setReducedMotion(prefersReducedMotion());
    };

    checkReducedMotion();

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', checkReducedMotion);

    return () => {
      mediaQuery.removeEventListener('change', checkReducedMotion);
    };
  }, []);

  const getAnimationStyles = useMemo(() => {
    if (reducedMotion) {
      return {
        animation: 'none',
        transition: 'none'
      };
    }
    return {};
  }, [reducedMotion]);

  return {
    reducedMotion,
    getAnimationStyles
  };
};

// Touch optimization hook
export const useTouchOptimization = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice(checkIsTouchDevice());
  }, []);

  const getTouchStyles = useMemo(() => {
    if (!isTouchDevice) return {};
    
    return {
      minHeight: '44px',
      minWidth: '44px',
      padding: '12px',
      touchAction: 'manipulation'
    };
  }, [isTouchDevice]);

  return {
    isTouchDevice,
    getTouchStyles
  };
};

// Combined accessibility hook for location components
export const useLocationAccessibility = (config?: AccessibilityConfig) => {
  const accessibility = useAccessibility(config);
  const { isHighContrast, getHighContrastStyles } = useHighContrast();
  const { reducedMotion, getAnimationStyles } = useReducedMotion();
  const { isTouchDevice, getTouchStyles } = useTouchOptimization();

  const getAccessibleStyles = useMemo(() => {
    return {
      ...getHighContrastStyles,
      ...getAnimationStyles,
      ...getTouchStyles
    };
  }, [getHighContrastStyles, getAnimationStyles, getTouchStyles]);

  return {
    ...accessibility,
    isHighContrast,
    reducedMotion,
    isTouchDevice,
    getAccessibleStyles
  };
};