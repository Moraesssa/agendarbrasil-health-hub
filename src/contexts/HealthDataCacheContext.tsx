import React, { createContext, useState, useContext, ReactNode } from 'react';

interface HealthDataCacheContextType {
  lastUpdated: number;
  triggerRefetch: () => void;
}

const HealthDataCacheContext = createContext<HealthDataCacheContextType | undefined>(undefined);

export const HealthDataCacheProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  const triggerRefetch = () => {
    setLastUpdated(Date.now());
  };

  return (
    <HealthDataCacheContext.Provider value={{ lastUpdated, triggerRefetch }}>
      {children}
    </HealthDataCacheContext.Provider>
  );
};

export const useHealthDataCache = () => {
  const context = useContext(HealthDataCacheContext);
  if (context === undefined) {
    throw new Error('useHealthDataCache must be used within a HealthDataCacheProvider');
  }
  return context;
};