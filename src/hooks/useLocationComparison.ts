/**
 * Hook for managing location comparison functionality
 * Handles saving, loading, and managing comparison data
 */

import { useState, useCallback, useEffect } from 'react';
import { LocationWithTimeSlots } from '@/types/location';

export interface ComparisonData {
  id: string;
  name: string;
  locations: LocationWithTimeSlots[];
  criteria: ComparisonCriteria;
  createdAt: string;
  notes?: string;
}

export interface SavedComparison {
  id: string;
  name: string;
  locationIds: string[];
  createdAt: string;
  notes?: string;
}

export interface ComparisonCriteria {
  showDistance: boolean;
  showFacilities: boolean;
  showHours: boolean;
  showAvailability: boolean;
  showContact: boolean;
  priorityFacilities: string[];
}

const STORAGE_KEY = 'agendarbrasil_saved_comparisons';

export function useLocationComparison() {
  const [savedComparisons, setSavedComparisons] = useState<SavedComparison[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved comparisons from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSavedComparisons(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Erro ao carregar comparações salvas:', error);
      setSavedComparisons([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save comparison to localStorage
  const saveComparison = useCallback((comparisonData: ComparisonData) => {
    try {
      const savedComparison: SavedComparison = {
        id: comparisonData.id,
        name: comparisonData.name,
        locationIds: comparisonData.locations.map(loc => loc.id),
        createdAt: comparisonData.createdAt,
        notes: comparisonData.notes
      };

      const updatedComparisons = [...savedComparisons, savedComparison];
      setSavedComparisons(updatedComparisons);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedComparisons));
      
      return true;
    } catch (error) {
      console.error('Erro ao salvar comparação:', error);
      return false;
    }
  }, [savedComparisons]);

  // Delete saved comparison
  const deleteComparison = useCallback((comparisonId: string) => {
    try {
      const updatedComparisons = savedComparisons.filter(comp => comp.id !== comparisonId);
      setSavedComparisons(updatedComparisons);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedComparisons));
      return true;
    } catch (error) {
      console.error('Erro ao deletar comparação:', error);
      return false;
    }
  }, [savedComparisons]);

  // Update saved comparison
  const updateComparison = useCallback((comparisonId: string, updates: Partial<SavedComparison>) => {
    try {
      const updatedComparisons = savedComparisons.map(comp => 
        comp.id === comparisonId ? { ...comp, ...updates } : comp
      );
      setSavedComparisons(updatedComparisons);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedComparisons));
      return true;
    } catch (error) {
      console.error('Erro ao atualizar comparação:', error);
      return false;
    }
  }, [savedComparisons]);

  // Get saved comparison by ID
  const getComparison = useCallback((comparisonId: string) => {
    return savedComparisons.find(comp => comp.id === comparisonId);
  }, [savedComparisons]);

  // Check if comparison exists
  const hasComparison = useCallback((locationIds: string[]) => {
    return savedComparisons.some(comp => {
      const sortedIds = [...locationIds].sort();
      const sortedCompIds = [...comp.locationIds].sort();
      return sortedIds.length === sortedCompIds.length && 
             sortedIds.every((id, index) => id === sortedCompIds[index]);
    });
  }, [savedComparisons]);

  // Get comparison statistics
  const getComparisonStats = useCallback(() => {
    const totalComparisons = savedComparisons.length;
    const recentComparisons = savedComparisons.filter(comp => {
      const createdDate = new Date(comp.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return createdDate > weekAgo;
    }).length;

    const averageLocationsPerComparison = totalComparisons > 0 
      ? savedComparisons.reduce((sum, comp) => sum + comp.locationIds.length, 0) / totalComparisons
      : 0;

    return {
      totalComparisons,
      recentComparisons,
      averageLocationsPerComparison: Math.round(averageLocationsPerComparison * 10) / 10
    };
  }, [savedComparisons]);

  // Export all comparisons
  const exportComparisons = useCallback(() => {
    try {
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        comparisons: savedComparisons,
        stats: getComparisonStats()
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `comparacoes-estabelecimentos-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Erro ao exportar comparações:', error);
      return false;
    }
  }, [savedComparisons, getComparisonStats]);

  // Import comparisons
  const importComparisons = useCallback((file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const importData = JSON.parse(content);
          
          if (importData.comparisons && Array.isArray(importData.comparisons)) {
            // Merge with existing comparisons, avoiding duplicates
            const existingIds = new Set(savedComparisons.map(comp => comp.id));
            const newComparisons = importData.comparisons.filter(
              (comp: SavedComparison) => !existingIds.has(comp.id)
            );
            
            const updatedComparisons = [...savedComparisons, ...newComparisons];
            setSavedComparisons(updatedComparisons);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedComparisons));
            resolve(true);
          } else {
            resolve(false);
          }
        } catch (error) {
          console.error('Erro ao importar comparações:', error);
          resolve(false);
        }
      };
      reader.onerror = () => resolve(false);
      reader.readAsText(file);
    });
  }, [savedComparisons]);

  // Clear all saved comparisons
  const clearAllComparisons = useCallback(() => {
    try {
      setSavedComparisons([]);
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Erro ao limpar comparações:', error);
      return false;
    }
  }, []);

  return {
    savedComparisons,
    isLoading,
    saveComparison,
    deleteComparison,
    updateComparison,
    getComparison,
    hasComparison,
    getComparisonStats,
    exportComparisons,
    importComparisons,
    clearAllComparisons
  };
}

export default useLocationComparison;