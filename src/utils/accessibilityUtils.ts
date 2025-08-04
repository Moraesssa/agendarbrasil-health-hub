/**
 * Accessibility utilities for location components
 * Provides comprehensive accessibility support including ARIA labels,
 * keyboard navigation, screen reader announcements, and focus management
 */

// ARIA label generators for location components
export const generateLocationAriaLabel = (
  locationName: string,
  availableSlots: number,
  status: string,
  isSelected?: boolean
): string => {
  const statusText = status === 'ativo' ? 'ativo' : 'fechado';
  const selectionText = isSelected ? ', selecionado' : '';
  const slotsText = availableSlots === 0 
    ? 'sem horários disponíveis' 
    : `${availableSlots} horário${availableSlots !== 1 ? 's' : ''} disponível${availableSlots !== 1 ? 'eis' : ''}`;
  
  return `Estabelecimento ${locationName}, ${statusText}, ${slotsText}${selectionText}`;
};

export const generateFacilityAriaLabel = (
  facilityType: string,
  available: boolean,
  cost?: string,
  details?: string
): string => {
  const availabilityText = available ? 'disponível' : 'indisponível';
  const costText = cost ? `, ${cost}` : '';
  const detailsText = details ? `, ${details}` : '';
  
  return `${facilityType} ${availabilityText}${costText}${detailsText}`;
};

export const generateTimeSlotAriaLabel = (
  time: string,
  available: boolean,
  locationName?: string,
  isSelected?: boolean
): string => {
  const availabilityText = available ? 'disponível' : 'indisponível';
  const locationText = locationName ? ` no ${locationName}` : '';
  const selectionText = isSelected ? ', selecionado' : '';
  
  return `Horário ${time}${locationText}, ${availabilityText}${selectionText}`;
};

// Keyboard navigation utilities
export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  TAB: 'Tab',
  ESCAPE: 'Escape',
  HOME: 'Home',
  END: 'End'
} as const;

export type KeyboardKey = typeof KEYBOARD_KEYS[keyof typeof KEYBOARD_KEYS];

export const isActivationKey = (key: string): boolean => {
  return key === KEYBOARD_KEYS.ENTER || key === KEYBOARD_KEYS.SPACE;
};

export const isNavigationKey = (key: string): boolean => {
  const navigationKeys: string[] = [
    KEYBOARD_KEYS.ARROW_UP,
    KEYBOARD_KEYS.ARROW_DOWN,
    KEYBOARD_KEYS.ARROW_LEFT,
    KEYBOARD_KEYS.ARROW_RIGHT,
    KEYBOARD_KEYS.HOME,
    KEYBOARD_KEYS.END
  ];
  return navigationKeys.includes(key);
};

// Focus management utilities
export const focusElement = (element: HTMLElement | null): boolean => {
  if (!element) return false;
  
  try {
    element.focus();
    return document.activeElement === element;
  } catch (error) {
    console.warn('Failed to focus element:', error);
    return false;
  }
};

export const findFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[role="button"]:not([disabled])',
    '[role="link"]:not([disabled])'
  ].join(', ');
  
  return Array.from(container.querySelectorAll(focusableSelectors));
};

export const getNextFocusableElement = (
  current: HTMLElement,
  container: HTMLElement,
  direction: 'next' | 'previous' = 'next'
): HTMLElement | null => {
  const focusableElements = findFocusableElements(container);
  const currentIndex = focusableElements.indexOf(current);
  
  if (currentIndex === -1) return null;
  
  let nextIndex: number;
  if (direction === 'next') {
    nextIndex = (currentIndex + 1) % focusableElements.length;
  } else {
    nextIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
  }
  
  return focusableElements[nextIndex] || null;
};

// Screen reader announcement utilities
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

export const announceLocationSelection = (locationName: string, availableSlots: number): void => {
  const message = `Estabelecimento ${locationName} selecionado. ${availableSlots} horário${availableSlots !== 1 ? 's' : ''} disponível${availableSlots !== 1 ? 'eis' : ''}.`;
  announceToScreenReader(message, 'assertive');
};

export const announceLocationFilter = (locationName: string | null): void => {
  const message = locationName 
    ? `Horários filtrados para ${locationName}`
    : 'Filtro de localização removido. Mostrando todos os horários.';
  announceToScreenReader(message, 'polite');
};

export const announceTimeSlotSelection = (time: string, locationName?: string): void => {
  const locationText = locationName ? ` no ${locationName}` : '';
  const message = `Horário ${time}${locationText} selecionado.`;
  announceToScreenReader(message, 'assertive');
};

// High contrast mode utilities
export const detectHighContrastMode = (): boolean => {
  // Check for Windows high contrast mode
  if (window.matchMedia) {
    return window.matchMedia('(prefers-contrast: high)').matches ||
           window.matchMedia('(-ms-high-contrast: active)').matches ||
           window.matchMedia('(-ms-high-contrast: black-on-white)').matches ||
           window.matchMedia('(-ms-high-contrast: white-on-black)').matches;
  }
  return false;
};

export const getHighContrastStyles = () => ({
  border: '2px solid',
  outline: '2px solid transparent',
  outlineOffset: '2px'
});

// Reduced motion utilities
export const prefersReducedMotion = (): boolean => {
  if (window.matchMedia) {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
};

// Color contrast utilities
export const ensureColorContrast = (foreground: string, background: string): boolean => {
  // Simplified contrast check - in a real implementation, you'd calculate actual contrast ratios
  // This is a placeholder for more sophisticated color contrast validation
  return true;
};

// Touch accessibility utilities
export const checkIsTouchDevice = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export const getTouchOptimizedStyles = () => ({
  minHeight: '44px',
  minWidth: '44px',
  padding: '12px'
});

// ARIA live region utilities
export const createLiveRegion = (id: string, priority: 'polite' | 'assertive' = 'polite'): HTMLElement => {
  let liveRegion = document.getElementById(id);
  
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = id;
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  }
  
  return liveRegion;
};

export const updateLiveRegion = (id: string, message: string): void => {
  const liveRegion = document.getElementById(id);
  if (liveRegion) {
    liveRegion.textContent = message;
  }
};

// Semantic HTML utilities
export const getSemanticRole = (componentType: string): string => {
  const roleMap: Record<string, string> = {
    'location-card': 'button',
    'location-list': 'list',
    'location-item': 'listitem',
    'facility-list': 'list',
    'facility-item': 'listitem',
    'time-slot-grid': 'grid',
    'time-slot-button': 'button',
    'action-group': 'group'
  };
  
  return roleMap[componentType] || '';
};

// Error announcement utilities
export const announceError = (error: string): void => {
  announceToScreenReader(`Erro: ${error}`, 'assertive');
};

export const announceSuccess = (message: string): void => {
  announceToScreenReader(`Sucesso: ${message}`, 'polite');
};

// Loading state announcements
export const announceLoadingStart = (context: string): void => {
  announceToScreenReader(`Carregando ${context}...`, 'polite');
};

export const announceLoadingComplete = (context: string, itemCount?: number): void => {
  const countText = itemCount !== undefined ? ` ${itemCount} item${itemCount !== 1 ? 's' : ''} carregado${itemCount !== 1 ? 's' : ''}` : '';
  announceToScreenReader(`${context} carregado${countText}.`, 'polite');
};

// Form accessibility utilities
export const generateFieldDescription = (fieldName: string, required: boolean, format?: string): string => {
  const requiredText = required ? ', obrigatório' : ', opcional';
  const formatText = format ? `, formato: ${format}` : '';
  return `${fieldName}${requiredText}${formatText}`;
};

// Export commonly used ARIA attributes
export const ARIA_ATTRIBUTES = {
  EXPANDED: 'aria-expanded',
  SELECTED: 'aria-selected',
  CHECKED: 'aria-checked',
  DISABLED: 'aria-disabled',
  HIDDEN: 'aria-hidden',
  LABEL: 'aria-label',
  LABELLEDBY: 'aria-labelledby',
  DESCRIBEDBY: 'aria-describedby',
  LIVE: 'aria-live',
  ATOMIC: 'aria-atomic',
  BUSY: 'aria-busy',
  CURRENT: 'aria-current',
  PRESSED: 'aria-pressed'
} as const;

// Screen reader only CSS class
export const SR_ONLY_CLASS = 'sr-only';

// Default accessibility configuration
export const DEFAULT_A11Y_CONFIG = {
  announceSelections: true,
  announceErrors: true,
  announceLoading: true,
  enableKeyboardNavigation: true,
  enableHighContrast: true,
  enableReducedMotion: true,
  touchOptimized: true
};