import React, { useState, useEffect } from 'react';

export interface ResponsiveBreakpoints {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
}

export interface ResponsiveLayoutConfig {
  mobileBreakpoint: number;
  tabletBreakpoint: number;
  desktopBreakpoint: number;
  largeDesktopBreakpoint: number;
}

const defaultConfig: ResponsiveLayoutConfig = {
  mobileBreakpoint: 768,
  tabletBreakpoint: 1024,
  desktopBreakpoint: 1280,
  largeDesktopBreakpoint: 1536
};

export const useResponsiveLayout = (config: Partial<ResponsiveLayoutConfig> = {}) => {
  const finalConfig = React.useMemo(() => ({ ...defaultConfig, ...config }), [config]);
  
  const [breakpoints, setBreakpoints] = useState<ResponsiveBreakpoints>(() => {
    // Safe initial values for SSR
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isLargeDesktop: false,
        screenWidth: 1024,
        screenHeight: 768
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    return {
      isMobile: width < finalConfig.mobileBreakpoint,
      isTablet: width >= finalConfig.mobileBreakpoint && width < finalConfig.desktopBreakpoint,
      isDesktop: width >= finalConfig.desktopBreakpoint && width < finalConfig.largeDesktopBreakpoint,
      isLargeDesktop: width >= finalConfig.largeDesktopBreakpoint,
      screenWidth: width,
      screenHeight: height
    };
  });

  useEffect(() => {
    const updateBreakpoints = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setBreakpoints({
        isMobile: width < finalConfig.mobileBreakpoint,
        isTablet: width >= finalConfig.mobileBreakpoint && width < finalConfig.desktopBreakpoint,
        isDesktop: width >= finalConfig.desktopBreakpoint && width < finalConfig.largeDesktopBreakpoint,
        isLargeDesktop: width >= finalConfig.largeDesktopBreakpoint,
        screenWidth: width,
        screenHeight: height
      });
    };

    // Debounce resize events for better performance
    let timeoutId: NodeJS.Timeout;
    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateBreakpoints, 150);
    };

    window.addEventListener('resize', debouncedUpdate);
    
    // Initial update
    updateBreakpoints();

    return () => {
      window.removeEventListener('resize', debouncedUpdate);
      clearTimeout(timeoutId);
    };
  }, [finalConfig]);

  // Helper functions for common responsive patterns
  const getGridColumns = (mobileColumns = 1, tabletColumns = 2, desktopColumns = 3) => {
    if (breakpoints.isMobile) return mobileColumns;
    if (breakpoints.isTablet) return tabletColumns;
    return desktopColumns;
  };

  const getCompactMode = () => breakpoints.isMobile;
  
  const getTouchOptimized = () => breakpoints.isMobile || breakpoints.isTablet;

  const getButtonSize = (mobileSize = 'default', desktopSize = 'default') => {
    return breakpoints.isMobile ? mobileSize : desktopSize;
  };

  const getSpacing = (mobileSpacing = 'sm', desktopSpacing = 'md') => {
    return breakpoints.isMobile ? mobileSpacing : desktopSpacing;
  };

  return {
    ...breakpoints,
    getGridColumns,
    getCompactMode,
    getTouchOptimized,
    getButtonSize,
    getSpacing,
    // Utility classes for responsive design
    responsiveClasses: {
      container: breakpoints.isMobile 
        ? 'px-4 py-3' 
        : breakpoints.isTablet 
        ? 'px-6 py-4' 
        : 'px-8 py-6',
      grid: breakpoints.isMobile
        ? 'grid-cols-1 gap-4'
        : breakpoints.isTablet
        ? 'grid-cols-2 gap-6'
        : 'grid-cols-3 gap-8',
      button: breakpoints.isMobile
        ? 'min-h-[44px] px-4 text-sm'
        : 'min-h-[40px] px-6 text-base',
      text: breakpoints.isMobile
        ? 'text-sm'
        : 'text-base'
    }
  };
};

// Hook for detecting touch device capabilities
export const useTouchDevice = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-expect-error - for older browsers
        navigator.msMaxTouchPoints > 0
      );
    };

    checkTouchDevice();
  }, []);

  return isTouchDevice;
};

// Hook for managing swipe gestures
export const useSwipeGesture = (
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  threshold = 100
) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > threshold;
    const isRightSwipe = distance < -threshold;

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    }
    if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
    }
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  };
};

export default useResponsiveLayout;