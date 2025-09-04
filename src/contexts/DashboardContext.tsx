import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

interface DashboardInfo {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface DashboardContextType {
  currentDashboard: DashboardInfo | null;
  setCurrentDashboard: (dashboard: DashboardInfo | null) => void;
  updateDashboardName: (dashboardId: string, newName: string) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [currentDashboard, setCurrentDashboard] = useState<DashboardInfo | null>(null);

  const updateDashboardName = useCallback((dashboardId: string, newName: string) => {
    setCurrentDashboard(prev => {
      if (prev && prev.id === dashboardId) {
        return {
          ...prev,
          name: newName
        };
      }
      return prev;
    });
  }, []);

  return (
    <DashboardContext.Provider value={{
      currentDashboard,
      setCurrentDashboard,
      updateDashboardName
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}