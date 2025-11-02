import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Dashboard Context
 * 
 * Manages global state for the Dashboard Médico V3:
 * - Period filter (today, week, month, year)
 * - User preferences (hidden widgets, widget order)
 * - Preference persistence to Supabase
 */

// Types
export type DashboardPeriod = 'today' | 'week' | 'month' | 'year';

export interface DashboardPreferences {
  hiddenWidgets: string[];
  widgetOrder: string[];
  theme?: 'light' | 'dark' | 'auto';
}

interface DashboardContextType {
  // Period filter
  period: DashboardPeriod;
  setPeriod: (period: DashboardPeriod) => void;
  
  // User preferences
  preferences: DashboardPreferences;
  updatePreferences: (preferences: Partial<DashboardPreferences>) => Promise<void>;
  isWidgetHidden: (widgetId: string) => boolean;
  toggleWidget: (widgetId: string) => Promise<void>;
  
  // Loading states
  isLoadingPreferences: boolean;
  
  // Refresh trigger
  refreshKey: number;
  triggerRefresh: () => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

// Default preferences
const DEFAULT_PREFERENCES: DashboardPreferences = {
  hiddenWidgets: [],
  widgetOrder: [
    'metrics',
    'charts',
    'upcoming-appointments',
    'alerts',
    'quick-actions',
  ],
  theme: 'auto',
};

interface DashboardProviderProps {
  children: ReactNode;
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  const { user } = useAuth();
  
  // State
  const [period, setPeriod] = useState<DashboardPeriod>('month');
  const [preferences, setPreferences] = useState<DashboardPreferences>(DEFAULT_PREFERENCES);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load preferences from Supabase on mount
  useEffect(() => {
    if (!user?.id) {
      setIsLoadingPreferences(false);
      return;
    }

    loadPreferences();
  }, [user?.id]);

  /**
   * Load user preferences from Supabase
   */
  async function loadPreferences() {
    try {
      setIsLoadingPreferences(true);

      const { data, error } = await supabase
        .from('user_preferences')
        .select('preferences')
        .eq('user_id', user?.id)
        .eq('preference_type', 'dashboard')
        .single();

      if (error) {
        // If no preferences found, use defaults
        if (error.code === 'PGRST116') {
          console.log('No preferences found, using defaults');
          setPreferences(DEFAULT_PREFERENCES);
          return;
        }
        throw error;
      }

      if (data?.preferences) {
        // Merge with defaults to ensure all fields exist
        setPreferences({
          ...DEFAULT_PREFERENCES,
          ...data.preferences,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard preferences:', error);
      // Use defaults on error
      setPreferences(DEFAULT_PREFERENCES);
    } finally {
      setIsLoadingPreferences(false);
    }
  }

  /**
   * Save preferences to Supabase
   */
  async function savePreferences(newPreferences: DashboardPreferences) {
    if (!user?.id) {
      console.warn('Cannot save preferences: user not authenticated');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          preference_type: 'dashboard',
          preferences: newPreferences,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,preference_type',
        });

      if (error) throw error;

      console.log('Dashboard preferences saved successfully');
    } catch (error) {
      console.error('Error saving dashboard preferences:', error);
      throw error;
    }
  }

  /**
   * Update preferences (local + remote)
   */
  async function updatePreferences(updates: Partial<DashboardPreferences>) {
    const newPreferences = {
      ...preferences,
      ...updates,
    };

    // Update local state immediately
    setPreferences(newPreferences);

    // Save to Supabase
    await savePreferences(newPreferences);
  }

  /**
   * Check if a widget is hidden
   */
  function isWidgetHidden(widgetId: string): boolean {
    return preferences.hiddenWidgets.includes(widgetId);
  }

  /**
   * Toggle widget visibility
   */
  async function toggleWidget(widgetId: string) {
    const isHidden = isWidgetHidden(widgetId);
    const newHiddenWidgets = isHidden
      ? preferences.hiddenWidgets.filter(id => id !== widgetId)
      : [...preferences.hiddenWidgets, widgetId];

    await updatePreferences({
      hiddenWidgets: newHiddenWidgets,
    });
  }

  /**
   * Trigger a refresh of all dashboard data
   */
  function triggerRefresh() {
    setRefreshKey(prev => prev + 1);
  }

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      period,
      setPeriod,
      preferences,
      updatePreferences,
      isWidgetHidden,
      toggleWidget,
      isLoadingPreferences,
      refreshKey,
      triggerRefresh,
    }),
    [period, preferences, isLoadingPreferences, refreshKey]
  );

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
}

/**
 * Hook to use Dashboard context
 */
export function useDashboard() {
  const context = useContext(DashboardContext);

  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }

  return context;
}

// Named exports
export { DashboardContext };
