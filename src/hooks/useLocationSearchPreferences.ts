/**
 * Hook for managing location search preferences
 * Handles saving, loading, and managing search preferences data
 */

import { useState, useCallback, useEffect } from 'react';
import { LocationFilters } from '@/types/location';

export interface LocationSearchPreferences {
  id: string;
  name: string;
  searchQuery: string;
  filters: LocationFilters;
  sortBy: string;
  sortOrder: string;
  createdAt: string;
  lastUsed?: string;
  useCount?: number;
}

const STORAGE_KEY = 'agendarbrasil_location_search_preferences';

export function useLocationSearchPreferences() {
  const [preferences, setPreferences] = useState<LocationSearchPreferences[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Erro ao carregar preferências de busca:', error);
      setPreferences([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save preference to localStorage
  const savePreference = useCallback((preference: LocationSearchPreferences) => {
    try {
      const updatedPreferences = [...preferences, preference];
      setPreferences(updatedPreferences);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPreferences));
      return true;
    } catch (error) {
      console.error('Erro ao salvar preferência:', error);
      return false;
    }
  }, [preferences]);

  // Delete preference
  const deletePreference = useCallback((preferenceId: string) => {
    try {
      const updatedPreferences = preferences.filter(pref => pref.id !== preferenceId);
      setPreferences(updatedPreferences);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPreferences));
      return true;
    } catch (error) {
      console.error('Erro ao deletar preferência:', error);
      return false;
    }
  }, [preferences]);

  // Update preference
  const updatePreference = useCallback((preferenceId: string, updates: Partial<LocationSearchPreferences>) => {
    try {
      const updatedPreferences = preferences.map(pref => 
        pref.id === preferenceId ? { ...pref, ...updates } : pref
      );
      setPreferences(updatedPreferences);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPreferences));
      return true;
    } catch (error) {
      console.error('Erro ao atualizar preferência:', error);
      return false;
    }
  }, [preferences]);

  // Get preference by ID
  const getPreference = useCallback((preferenceId: string) => {
    return preferences.find(pref => pref.id === preferenceId);
  }, [preferences]);

  // Check if preference name exists
  const hasPreferenceName = useCallback((name: string, excludeId?: string) => {
    return preferences.some(pref => 
      pref.name.toLowerCase() === name.toLowerCase() && 
      pref.id !== excludeId
    );
  }, [preferences]);

  // Get preference statistics
  const getPreferenceStats = useCallback(() => {
    const totalPreferences = preferences.length;
    const recentPreferences = preferences.filter(pref => {
      const createdDate = new Date(pref.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return createdDate > weekAgo;
    }).length;

    const mostUsed = preferences.reduce((most, pref) => {
      return (pref.useCount || 0) > (most.useCount || 0) ? pref : most;
    }, preferences[0]);

    const totalUses = preferences.reduce((sum, pref) => sum + (pref.useCount || 0), 0);

    return {
      totalPreferences,
      recentPreferences,
      mostUsed,
      totalUses,
      averageUses: totalPreferences > 0 ? Math.round(totalUses / totalPreferences * 10) / 10 : 0
    };
  }, [preferences]);

  // Get frequently used preferences
  const getFrequentlyUsed = useCallback((limit: number = 5) => {
    return [...preferences]
      .filter(pref => (pref.useCount || 0) > 0)
      .sort((a, b) => (b.useCount || 0) - (a.useCount || 0))
      .slice(0, limit);
  }, [preferences]);

  // Get recently used preferences
  const getRecentlyUsed = useCallback((limit: number = 5) => {
    return [...preferences]
      .filter(pref => pref.lastUsed)
      .sort((a, b) => new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime())
      .slice(0, limit);
  }, [preferences]);

  // Export all preferences
  const exportPreferences = useCallback(() => {
    try {
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        preferences: preferences,
        stats: getPreferenceStats()
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `preferencias-busca-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Erro ao exportar preferências:', error);
      return false;
    }
  }, [preferences, getPreferenceStats]);

  // Import preferences
  const importPreferences = useCallback((file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const importData = JSON.parse(content);
          
          if (importData.preferences && Array.isArray(importData.preferences)) {
            // Merge with existing preferences, avoiding duplicates by name
            const existingNames = new Set(preferences.map(pref => pref.name.toLowerCase()));
            const newPreferences = importData.preferences.filter(
              (pref: LocationSearchPreferences) => !existingNames.has(pref.name.toLowerCase())
            );
            
            const updatedPreferences = [...preferences, ...newPreferences];
            setPreferences(updatedPreferences);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPreferences));
            resolve(true);
          } else {
            resolve(false);
          }
        } catch (error) {
          console.error('Erro ao importar preferências:', error);
          resolve(false);
        }
      };
      reader.onerror = () => resolve(false);
      reader.readAsText(file);
    });
  }, [preferences]);

  // Clear all preferences
  const clearAllPreferences = useCallback(() => {
    try {
      setPreferences([]);
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Erro ao limpar preferências:', error);
      return false;
    }
  }, []);

  // Create preference from current search state
  const createPreferenceFromSearch = useCallback((
    name: string,
    searchQuery: string,
    filters: LocationFilters,
    sortBy: string,
    sortOrder: string
  ): LocationSearchPreferences => {
    return {
      id: `pref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      searchQuery: searchQuery.trim(),
      filters,
      sortBy,
      sortOrder,
      createdAt: new Date().toISOString(),
      useCount: 0
    };
  }, []);

  // Duplicate preference with new name
  const duplicatePreference = useCallback((preferenceId: string, newName: string) => {
    const original = getPreference(preferenceId);
    if (!original) return false;

    const duplicate = createPreferenceFromSearch(
      newName,
      original.searchQuery,
      original.filters,
      original.sortBy,
      original.sortOrder
    );

    return savePreference(duplicate);
  }, [getPreference, createPreferenceFromSearch, savePreference]);

  return {
    preferences,
    isLoading,
    savePreference,
    deletePreference,
    updatePreference,
    getPreference,
    hasPreferenceName,
    getPreferenceStats,
    getFrequentlyUsed,
    getRecentlyUsed,
    exportPreferences,
    importPreferences,
    clearAllPreferences,
    createPreferenceFromSearch,
    duplicatePreference
  };
}

export default useLocationSearchPreferences;