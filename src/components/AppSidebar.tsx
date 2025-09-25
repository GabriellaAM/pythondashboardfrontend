import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  BarChart3, 
  Settings, 
  Plus,
  ChevronDown,
  LogOut,
  User,
  MoreHorizontal,
  Trash2,
  Edit
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import datavizLogo from "@/assets/datavizlogo.png";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/contexts/DashboardContext";
import { apiClient } from "@/lib/api";
import { NotionEditableText } from "./NotionEditableText";
import { toast } from "@/hooks/use-toast";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { title: "Settings", url: "/settings", icon: Settings },
];

interface DashboardItem {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export function AppSidebar() {
  const queryClient = useQueryClient();
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [dashboardsOpen, setDashboardsOpen] = useState(true);
  const [dashboards, setDashboards] = useState<DashboardItem[]>([]);
  const [sharedOpen, setSharedOpen] = useState(true);
  const [sharedDashboards, setSharedDashboards] = useState<Array<{
    id: string;
    name: string;
    description?: string;
    owner_id: string;
    permissions: string[];
    shared_at: string;
    shared_by: string;
  }>>([]);
  const [sharedLoading, setSharedLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  // Avoid concurrent loads / visual flicker when data already present
  const loadingDashboardsRef = useRef(false);
  const loadingSharedRef = useRef(false);
  // Sidebar rename editing state (activated by double-click or menu action)
  const [editingDashboard, setEditingDashboard] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; dashboard: DashboardItem | null }>({
    open: false,
    dashboard: null
  });
  const { user, logout } = useAuth();
  const { updateDashboardName, setCurrentDashboard } = useDashboard();
  
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === '/settings') {
      return currentPath === path;
    }
    return currentPath === path;
  };

  // Load dashboards from API
  useEffect(() => {
    loadDashboards();
    // Revalidar quando voltar o foco (sem flicker se já houver dados)
    const onFocus = () => loadDashboards();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);


  // Also listen for storage changes (auth token updates)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token' && e.newValue) {
        console.log('Auth token updated, reloading dashboards...');
        setTimeout(() => loadDashboards(), 1000); // Small delay to ensure API is ready
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Expose reload functions globally for testing
  useEffect(() => {
    (window as any).reloadDashboards = loadDashboards;
    (window as any).reloadSharedDashboards = loadSharedDashboards;
    (window as any).debugSharedDashboards = async () => {
      console.log('=== DEBUG SHARED DASHBOARDS ===');
      console.log('Current user:', user);
      console.log('Auth token exists:', !!localStorage.getItem('auth_token'));
      console.log('API Base URL:', import.meta.env.VITE_API_URL || 'default');
      
      // Test the specific endpoint
      try {
        console.log('Testing /api/dashboards/shared-with-me endpoint...');
        const sharedWithMe = await apiClient.getSharedDashboards();
        console.log('✅ API Response - Dashboards shared with me:', sharedWithMe);
      } catch (error: any) {
        console.error('❌ API Error - getSharedDashboards:', {
          status: error.status,
          message: error.message,
          stack: error.stack
        });
      }
      
      // Test if regular dashboards endpoint works
      try {
        console.log('Testing /api/dashboards/ endpoint...');
        const regularDashboards = await apiClient.getDashboards();
        console.log('✅ Regular dashboards work:', regularDashboards?.length || 0, 'dashboards');
      } catch (error: any) {
        console.error('❌ Regular dashboards also failing:', error);
      }
      
      // Test raw fetch to the endpoint
      try {
        console.log('Testing raw fetch to shared-with-me...');
        const token = localStorage.getItem('auth_token');
        const baseUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${baseUrl}/api/dashboards/shared-with-me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('Raw fetch response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Raw fetch data:', data);
        } else {
          const errorText = await response.text();
          console.log('❌ Raw fetch error text:', errorText);
        }
      } catch (fetchError) {
        console.error('❌ Raw fetch failed:', fetchError);
      }
      
      // Test if we can see who has access to our dashboards
      if (dashboards.length > 0) {
        console.log('Testing dashboard sharing status for owned dashboards...');
        for (const dashboard of dashboards) {
          try {
            console.log(`Checking shared users for dashboard "${dashboard.name}" (${dashboard.id})`);
            const users = await apiClient.getDashboardSharedUsers(dashboard.id);
            console.log(`Dashboard "${dashboard.name}" is shared with:`, users);
          } catch (error: any) {
            console.error(`Failed to get shared users for "${dashboard.name}":`, error);
          }
        }
      }
      
    };
    return () => {
      delete (window as any).reloadDashboards;
      delete (window as any).reloadSharedDashboards;
      delete (window as any).debugSharedDashboards;
    };
  }, [user]);

  // Listen for dashboard changes
  useEffect(() => {
    const handleDashboardsChanged = () => {
      console.log('Dashboards changed event received, reloading...');
      loadDashboards();
    };

    const handleSharedDashboardsChanged = () => {
      console.log('Shared dashboards changed event received, reloading...');
      loadSharedDashboards();
    };

    window.addEventListener('dashboards-changed', handleDashboardsChanged);
    window.addEventListener('shared-dashboards-changed', handleSharedDashboardsChanged);
    // Invalidate queries to keep cache fresh
    const invalidateDashboards = () => queryClient.invalidateQueries({ queryKey: ['dashboards'] });
    const invalidateShared = () => queryClient.invalidateQueries({ queryKey: ['sharedDashboards'] });
    window.addEventListener('dashboards-changed', invalidateDashboards);
    window.addEventListener('shared-dashboards-changed', invalidateShared);
    
    return () => {
      window.removeEventListener('dashboards-changed', handleDashboardsChanged);
      window.removeEventListener('shared-dashboards-changed', handleSharedDashboardsChanged);
      window.removeEventListener('dashboards-changed', invalidateDashboards);
      window.removeEventListener('shared-dashboards-changed', invalidateShared);
    };
  }, []);

  const loadDashboards = async () => {
    if (loadingDashboardsRef.current) return;
    loadingDashboardsRef.current = true;
    try {
      if (dashboards.length === 0) {
        setLoading(true);
      }
      console.log('Loading dashboards...');
      
      // Wait a bit to ensure auth token is set
      let attempts = 0;
      while (!localStorage.getItem('auth_token') && attempts < 10) {
        console.log('Waiting for auth token...');
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      // Fetch with React Query cache/dedup
      const dashboardsData = await queryClient.fetchQuery({
        queryKey: ['dashboards'],
        queryFn: () => apiClient.getDashboards(),
        staleTime: 60_000,
        gcTime: 300_000,
      });
      console.log('Dashboards loaded:', dashboardsData);
      setDashboards(dashboardsData || []);
      
      // Em produção não criar automaticamente dashboard/components
      // O usuário deve criar manualmente
    } catch (error) {
      console.warn('Could not load dashboards:', error);
      console.log('Skipping auto-creation of welcome dashboard');
    } finally {
      setLoading(false);
      loadingDashboardsRef.current = false;
    }
  };

  const loadSharedDashboards = async () => {
    if (loadingSharedRef.current) return;
    loadingSharedRef.current = true;
    try {
      if (sharedDashboards.length === 0) {
        setSharedLoading(true);
      }
      console.log('Loading shared dashboards...');
      console.log('Current user:', user);
      console.log('Auth token:', localStorage.getItem('auth_token') ? 'exists' : 'missing');

      // Wait a bit to ensure auth token is set (avoid early 401)
      let attempts = 0;
      while (!localStorage.getItem('auth_token') && attempts < 10) {
        console.log('Waiting for auth token for shared dashboards...');
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      const combinedShared = await queryClient.fetchQuery({
        queryKey: ['sharedDashboards', user?.id, dashboards.map(d => d.id).join(',')],
        queryFn: async () => {
          console.log('Fetching dashboards shared with me...');
          const sharedWithMe = await apiClient.getSharedDashboards();
          console.log('Dashboards shared with me:', sharedWithMe);
          const dashboardsIShared: any[] = [];
          if (dashboards.length > 0) {
            console.log('🔍 Checking which dashboards I shared with others...');
            for (const dashboard of dashboards) {
              try {
                const users = await apiClient.getDashboardSharedUsers(dashboard.id);
                if (users.length > 0) {
                  dashboardsIShared.push({
                    ...dashboard,
                    owner_id: user?.id,
                    permissions: ['edit'],
                    shared_at: users?.[0]?.shared_at || new Date().toISOString(),
                    shared_by: user?.full_name || user?.email || 'Me',
                    sharedUsers: users
                  });
                }
              } catch (error) {
                console.warn(`Failed to check sharing for dashboard ${dashboard.id}:`, error);
              }
            }
          }
          return [...(sharedWithMe || []), ...dashboardsIShared];
        },
        staleTime: 60_000,
        gcTime: 300_000,
      });

      // For the sidebar, show dashboards shared WITH me + dashboards I shared with others
      setSharedDashboards(combinedShared || []);

      console.log('📊 Summary:');
      console.log(`📚 Total shown in sidebar: ${combinedShared?.length || 0}`);

    } catch (e: any) {
      console.error('Could not load shared dashboards:', {
        error: e,
        status: e.status,
        message: e.message
      });

      // Set empty array as fallback
      setSharedDashboards([]);
    } finally {
      setSharedLoading(false);
      loadingSharedRef.current = false;
    }
  };

  // Load shared dashboards when user is available (even if no own dashboards)
  useEffect(() => {
    if (user && sharedOpen) {
      loadSharedDashboards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, dashboards.length, sharedOpen]);

  const createWelcomeDashboard = async () => {
    try {
      console.log('Creating welcome dashboard...');
      
      const welcomeDashboard = await apiClient.createDashboard({
        name: "Welcome Dashboard",
        description: "Your first dashboard! Start building your analytics here.",
        is_public: false
      });
      console.log('Welcome dashboard created:', welcomeDashboard);
      
      // Add welcome components
      console.log('Creating welcome component 1...');
      await apiClient.createComponent({
        dashboard_id: welcomeDashboard.id,
        name: "Welcome to DataViz Pro!",
        type: "kpi" as const,
        config: {
          value: "Welcome!",
          change: "Get Started",
          changeType: "increase",
          icon: "trending-up",
          description: "Start creating your first dashboard components"
        },
        position_x: 0,
        position_y: 0,
        width: 6,
        height: 3
      });

      console.log('Creating welcome component 2...');
      await apiClient.createComponent({
        dashboard_id: welcomeDashboard.id,
        name: "Quick Stats",
        type: "kpi" as const,
        config: {
          value: "1",
          unit: "",
          change: "+100%",
          changeType: "increase",
          icon: "target",
          description: "Dashboard created successfully"
        },
        position_x: 6,
        position_y: 0,
        width: 3,
        height: 3
      });
      
      console.log('Welcome dashboard setup complete');
      setDashboards([welcomeDashboard]);
      
      toast({
        title: "Welcome! 🎉",
        description: "Your first dashboard has been created. Start adding components!",
      });
      
      return welcomeDashboard;
    } catch (error) {
      console.error('Failed to create welcome dashboard:', error);
      toast({
        title: "Error",
        description: "Failed to create welcome dashboard. Please try refreshing the page.",
        variant: "destructive"
      });
    }
  };

  const handleNewDashboard = async () => {
    try {
      const newDashboard = await apiClient.createDashboard({
        name: `Dashboard ${dashboards.length + 1}`,
        description: "New dashboard ready for customization",
        is_public: false
      });
      
      setDashboards(prev => [...prev, newDashboard]);
      
      toast({
        title: "Dashboard Created",
        description: "New dashboard created successfully!",
      });
      
      // Navigate to new dashboard
      setCurrentDashboard(newDashboard);
      navigate(`/dashboard/${newDashboard.id}`);
    } catch (error) {
      console.error('Failed to create dashboard:', error);
      toast({
        title: "Error",
        description: "Failed to create new dashboard",
        variant: "destructive"
      });
    }
  };

  const handleDeleteDashboard = (dashboardId: string, dashboardName: string) => {
    const dashboard = dashboards.find(d => d.id === dashboardId);
    if (!dashboard) return;
    
    setDeleteModal({
      open: true,
      dashboard
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.dashboard) return;
    
    const { id: dashboardId, name: dashboardName } = deleteModal.dashboard;
    
    try {
      // Check if this is the last dashboard
      if (dashboards.length <= 1) {
        toast({
          title: "Cannot Delete Dashboard",
          description: "You must have at least one dashboard. Create another dashboard first.",
          variant: "destructive"
        });
        return;
      }

      console.log(`Deleting dashboard: ${dashboardName} (${dashboardId})`);
      
      await apiClient.deleteDashboard(dashboardId);
      
      // Calculate remaining dashboards before updating state
      const remainingDashboards = dashboards.filter(d => d.id !== dashboardId);
      
      // Remove from local state
      setDashboards(remainingDashboards);
      
      // If we're currently on the deleted dashboard, navigate to the next available dashboard
      const currentPath = location.pathname;
      if (currentPath === `/dashboard/${dashboardId}` || currentPath === `/`) {
        if (remainingDashboards.length > 0) {
          // Find a good candidate for redirection - prefer the next dashboard in the list
          const deletedIndex = dashboards.findIndex(d => d.id === dashboardId);
          const nextDashboard = remainingDashboards[deletedIndex] || remainingDashboards[deletedIndex - 1] || remainingDashboards[0];
          
          // Update dashboard context before navigation
          if (nextDashboard) {
            setCurrentDashboard(nextDashboard);
            navigate(`/dashboard/${nextDashboard.id}`);
          }
        }
      }
      
      toast({
        title: "Dashboard Deleted",
        description: `"${dashboardName}" has been deleted successfully.`,
      });
      
    } catch (error: any) {
      console.error('Failed to delete dashboard:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete dashboard",
        variant: "destructive"
      });
    }
  };

  const handleCloseDeleteModal = () => {
    setDeleteModal({ open: false, dashboard: null });
  };

  const handleQuickRename = async (dashboardId: string, newName: string) => {
    try {
      const finalName = newName.trim() || 'Untitled Dashboard';
      await apiClient.updateDashboard(dashboardId, { name: finalName });
      // Update local list
      setDashboards(prev => prev.map(d => d.id === dashboardId ? { ...d, name: finalName } : d));
      // Update context if this dashboard is active
      updateDashboardName(dashboardId, finalName);
    } catch (error: any) {
      console.error('Failed to rename dashboard:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to rename dashboard",
        variant: "destructive"
      });
    }
  };

  const startRename = (dashboardId: string, currentName: string) => {
    setEditingDashboard(dashboardId);
    setEditingName(currentName);
  };

  const saveRenameAndExit = async (dashboardId: string, newName: string) => {
    await handleQuickRename(dashboardId, newName);
    setEditingDashboard(null);
    setEditingName('');
  };

  return (
    <Sidebar className={cn(
      "border-r border-sidebar-border transition-all duration-300",
      collapsed ? "w-14" : "w-64"
    )}>
      <SidebarContent className="bg-sidebar">
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden">
              <img 
                src={datavizLogo} 
                alt="DataViz Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            {!collapsed && (
              <div>
                <h2 className="font-semibold text-sidebar-foreground">DataViz Pro</h2>
                <p className="text-xs text-sidebar-foreground/70">Analytics Platform</p>
              </div>
            )}
          </div>
        </div>

        {/* Dashboards Section */}
        {!collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <button
                onClick={() => setDashboardsOpen(!dashboardsOpen)}
                className="flex items-center justify-between w-full text-sidebar-foreground/70 hover:text-sidebar-foreground"
              >
                <span>My Dashboards</span>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform",
                  !dashboardsOpen && "-rotate-90"
                )} />
              </button>
            </SidebarGroupLabel>
            
            {dashboardsOpen && (
              <SidebarGroupContent>
                <SidebarMenu>
                  {loading && dashboards.length === 0 ? (
                    <SidebarMenuItem>
                      <div className="flex items-center gap-2 px-3 py-2 text-sm text-sidebar-foreground/70">
                        <div className="w-2 h-2 bg-sidebar-foreground/20 rounded-full animate-pulse" />
                        <span>Loading dashboards...</span>
                      </div>
                    </SidebarMenuItem>
                  ) : dashboards.length === 0 ? (
                    <SidebarMenuItem>
                      <div className="flex items-center gap-2 px-3 py-2 text-sm text-sidebar-foreground/70">
                        <div className="w-2 h-2 bg-sidebar-foreground/20 rounded-full" />
                        <span>No dashboards yet</span>
                      </div>
                    </SidebarMenuItem>
                  ) : (
                    dashboards.map((dashboard) => (
                      <SidebarMenuItem key={dashboard.id}>
                        <div className="flex items-center justify-between w-full group">
                          {editingDashboard === dashboard.id ? (
                            <div className="flex items-center gap-2 flex-1 px-3 py-2">
                              <div className="w-2 h-2 bg-chart-1 rounded-full" />
                              <div className="flex-1 min-w-0">
                                <NotionEditableText
                                  value={editingName}
                                  onChange={(val) => saveRenameAndExit(dashboard.id, val)}
                                  placeholder="Untitled Dashboard"
                                  className="truncate text-left"
                                  maxLength={100}
                                  autoSave={false}
                                />
                              </div>
                            </div>
                          ) : (
                            <SidebarMenuButton asChild className="flex-1">
                              <NavLink
                                to={`/dashboard/${dashboard.id}`}
                                onClick={() => { setCurrentDashboard(dashboard); localStorage.setItem('last_dashboard_id', dashboard.id); }}
                                onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); startRename(dashboard.id, dashboard.name); }}
                                className={cn(
                                  "flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm flex-1 cursor-pointer",
                                  isActive(`/dashboard/${dashboard.id}`)
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
                                )}
                                title={dashboard.name}
                              >
                                <div className="w-2 h-2 bg-chart-1 rounded-full" />
                                <span className="truncate">{dashboard.name}</span>
                              </NavLink>
                            </SidebarMenuButton>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => startRename(dashboard.id, dashboard.name)}>
                                <Edit className="h-3 w-3 mr-2" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteDashboard(dashboard.id, dashboard.name)}
                                disabled={dashboards.length <= 1}
                                className={cn(
                                  "text-destructive focus:text-destructive",
                                  dashboards.length <= 1 && "opacity-50 cursor-not-allowed"
                                )}
                              >
                                <Trash2 className="h-3 w-3 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </SidebarMenuItem>
                    ))
                  )}
                  
                  <SidebarMenuItem>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleNewDashboard}
                      className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New Dashboard</span>
                    </Button>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            )}
          </SidebarGroup>
        )}

        {/* Shared Dashboards Section */}
        {!collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <button
                onClick={() => setSharedOpen(!sharedOpen)}
                className="flex items-center justify-between w-full text-sidebar-foreground/70 hover:text-sidebar-foreground"
              >
                <span>Shared Dashboards</span>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform",
                  !sharedOpen && "-rotate-90"
                )} />
              </button>
            </SidebarGroupLabel>
            {sharedOpen && (
              <SidebarGroupContent>
                <SidebarMenu>
                  {sharedLoading && sharedDashboards.length === 0 ? (
                    <SidebarMenuItem>
                      <div className="flex items-center gap-2 px-3 py-2 text-sm text-sidebar-foreground/70">
                        <div className="w-2 h-2 bg-sidebar-foreground/20 rounded-full animate-pulse" />
                        <span>Loading shared dashboards...</span>
                      </div>
                    </SidebarMenuItem>
                  ) : sharedDashboards.length === 0 ? (
                    <SidebarMenuItem>
                      <div className="flex items-center gap-2 px-3 py-2 text-sm text-sidebar-foreground/70">
                        <div className="w-2 h-2 bg-sidebar-foreground/20 rounded-full" />
                        <span>No shared dashboards</span>
                      </div>
                    </SidebarMenuItem>
                  ) : (
                    sharedDashboards.map((dashboard) => (
                      <SidebarMenuItem key={`shared-${dashboard.id}`}>
                        <SidebarMenuButton asChild className="flex-1">
                          <NavLink
                            to={`/dashboard/${dashboard.id}`}
                            onClick={() => { setCurrentDashboard({
                              id: dashboard.id,
                              name: dashboard.name,
                              description: dashboard.description,
                              owner_id: dashboard.owner_id,
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString(),
                            } as any); localStorage.setItem('last_dashboard_id', dashboard.id); }}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm flex-1",
                              isActive(`/dashboard/${dashboard.id}`)
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
                            )}
                            title={dashboard.name}
                          >
                            <div className="w-2 h-2 bg-chart-2 rounded-full" />
                            <span className="truncate">{dashboard.name}</span>
                            <span
                              className={cn(
                                "ml-auto text-[10px] px-1.5 py-0.5 rounded-full",
                                (user && dashboard.owner_id === user.id)
                                  ? "bg-blue-100 text-blue-700"
                                  : (dashboard.permissions?.includes('edit')
                                      ? "bg-green-100 text-green-700"
                                      : "bg-gray-200 text-gray-700")
                              )}
                              title={(user && dashboard.owner_id === user.id)
                                ? "Owner"
                                : (dashboard.permissions?.includes('edit') ? "Can edit" : "View only")}
                            >
                              {(user && dashboard.owner_id === user.id)
                                ? "Owner"
                                : (dashboard.permissions?.includes('edit') ? "Edit" : "View")}
                            </span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            )}
          </SidebarGroup>
        )}

        {/* Settings Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
                        isActive(item.url)
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Profile & Actions */}
        <div className="mt-auto border-t border-sidebar-border">
          {!collapsed && user && (
            <div className="p-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full p-2 h-auto justify-start hover:bg-sidebar-accent"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className="w-8 h-8 bg-sidebar-accent rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-sidebar-accent-foreground" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-sidebar-foreground truncate">
                          {user.full_name}
                        </p>
                        <p className="text-xs text-sidebar-foreground/70 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <NavLink to="/account" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Account Settings
                    </NavLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="flex items-center gap-2">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          
          <div className="p-2">
            <SidebarTrigger className="w-full" />
          </div>
        </div>
      </SidebarContent>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        open={deleteModal.open}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        dashboardName={deleteModal.dashboard?.name || ''}
        isLastDashboard={dashboards.length <= 1}
      />
    </Sidebar>
  );
}