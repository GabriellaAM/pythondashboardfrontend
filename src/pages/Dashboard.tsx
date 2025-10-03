import { useState, useCallback, useEffect } from "react";
import { Plus, MoreVertical, BarChart3, Table, Target } from "lucide-react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api";
import { useDashboard } from "@/contexts/DashboardContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Responsive, WidthProvider, Layout } from "react-grid-layout";
import { useQueryClient } from "@tanstack/react-query";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChartModal } from "@/components/ChartModal";
import { TableModal } from "@/components/TableModal";
import { KPIModal } from "@/components/KPIModal";
import { WelcomeDashboard } from "@/components/WelcomeDashboard";
import { NotionEditableText } from "@/components/NotionEditableText";
import { NotionBlock } from "@/components/NotionBlock";
import { DashboardChart } from "@/components/DashboardChart";
import { DashboardTable } from "@/components/DashboardTable";
import { DashboardKPI } from "@/components/DashboardKPI";

interface ComponentItem {
  id: string;
  type: 'chart' | 'table' | 'kpi' | 'header' | 'subheader' | 'text' | 'description';
  title: string;
  data?: any;
  layout?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  backendId?: string; // Real component ID from backend
  content?: string; // For text blocks
  blockType?: 'header' | 'subheader' | 'text' | 'description'; // For text blocks
}

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { id: dashboardId, token: shareToken } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [components, setComponents] = useState<ComponentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [componentLoading, setComponentLoading] = useState<Set<string>>(new Set());
  const [currentDashboardId, setCurrentDashboardId] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const { currentDashboard, setCurrentDashboard, refreshDashboards } = useDashboard();
  const { isAuthenticated, user } = useAuth();

  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isKPIModalOpen, setIsKPIModalOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<ComponentItem | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Initialize dashboard selection when authenticated or when in public/share route
  useEffect(() => {
    const initializeApp = async () => {
      console.log('🚀 initializeApp started');
      const isShare = location.pathname.startsWith('/share/');
      const isPublic = location.pathname.startsWith('/public/');
      // Only set read-only for share/public routes initially
      // For normal routes, permissions will be checked when loading dashboard
      if (isShare || isPublic) {
        setIsReadOnly(true);
      }

      console.log('📍 Auth status:', { isAuthenticated, isShare, isPublic });

      if (!isAuthenticated && !isShare && !isPublic) {
        console.log('❌ Not authenticated and not in share/public route, exiting');
        return;
      }

      // Set dashboard ID
      let dashId = dashboardId;

      // NOVA LÓGICA: Se temos dashboard ID na URL, verificar se ele existe
      if (dashId && !isShare && !isPublic) {
        console.log('🔍 Dashboard ID from URL, need to validate:', dashId);

        // Buscar lista de dashboards acessíveis primeiro
        try {
          const ownedDashboards = await apiClient.getDashboards();
          const sharedDashboards = await apiClient.getSharedDashboards();

          const allDashboards = [...ownedDashboards, ...sharedDashboards];
          const dashboardExists = allDashboards.some(d => d.id === dashId);

          console.log('📊 Total dashboards:', allDashboards.length);
          console.log('✅ Dashboard exists?', dashboardExists);

          if (!dashboardExists) {
            console.log('🚫 Dashboard from URL does not exist! Redirecting...');

            // Dashboard na URL não existe
            if (allDashboards.length > 0) {
              // Tem outros dashboards, redirecionar para o primeiro
              const firstDash = allDashboards[0];
              console.log('↪️ Redirecting to first available dashboard:', firstDash.id);
              navigate(`/dashboard/${firstDash.id}`, { replace: true });
              return;
            } else {
              // Não tem nenhum dashboard, mostrar welcome
              console.log('🎉 No dashboards available, showing welcome screen');
              localStorage.removeItem('last_dashboard_id');
              navigate('/dashboard', { replace: true });
              setShowWelcome(true);
              setLoading(false);
              return;
            }
          }

          // Dashboard existe, pode continuar
          console.log('✅ Dashboard validated, loading:', dashId);
          setCurrentDashboardId(dashId);
          return;
        } catch (error) {
          console.error('⚠️ Error validating dashboard:', error);
          // Em caso de erro, limpar e mostrar welcome
          localStorage.removeItem('last_dashboard_id');
          navigate('/dashboard', { replace: true });
          setShowWelcome(true);
          setLoading(false);
          return;
        }
      }

      // Only search for a dashboard if we don't have one and we're not in a share route
      if (!isShare && !dashId) {
        console.log('🔍 Searching for dashboards (no ID in URL)...');

        // Preferir o primeiro dashboard PRÓPRIO do usuário
        try {
          const ownedDashboards = await apiClient.getDashboards();
          console.log('📊 Owned dashboards:', ownedDashboards?.length || 0);

          if (ownedDashboards && ownedDashboards.length > 0) {
            const firstOwned = ownedDashboards[0];
            dashId = firstOwned.id;
            console.log('✅ Using first owned dashboard:', dashId);
            setCurrentDashboardId(dashId);
            setShowWelcome(false);
            navigate(`/dashboard/${dashId}`, { replace: true });
            return;
          } else {
            // No owned dashboards - check if there are shared dashboards
            console.log('❌ No owned dashboards found, checking shared dashboards...');
          }
        } catch (error) {
          console.warn('⚠️ Could not load owned dashboards:', error);
        }

        // Fallback: usar o primeiro dashboard ACESSÍVEL (own/public/shared)
        try {
          const accessibleDashboards = await apiClient.getAccessibleDashboards();
          const sharedDashboards = await apiClient.getSharedDashboards();
          const dashboards = [...accessibleDashboards, ...sharedDashboards];
          console.log('📊 Accessible dashboards:', dashboards?.length || 0);

          if (dashboards && dashboards.length > 0) {
            let accessibleDashboard = null;
            for (const dashboard of dashboards) {
              try {
                // Test if we can access this dashboard, its components, and its blocks
                await apiClient.getDashboard(dashboard.id);
                await apiClient.getDashboardComponents(dashboard.id);
                await apiClient.getDashboardBlocks(dashboard.id);
                accessibleDashboard = dashboard;
                console.log('✅ Found accessible dashboard:', dashboard.id);
                break;
              } catch (testError) {
                console.warn(`⚠️ Dashboard ${dashboard.id} not fully accessible:`, testError);
                continue;
              }
            }

            if (accessibleDashboard) {
              dashId = accessibleDashboard.id;
              console.log('✅ Using first accessible dashboard:', dashId);
              setCurrentDashboardId(dashId);
              localStorage.setItem('last_dashboard_id', dashId);
              setShowWelcome(false);
              navigate(`/dashboard/${dashId}`, { replace: true });
              return;
            }
          }

          // No dashboards at all - show welcome screen for new users
          console.log('🎉 No dashboards found (owned or shared), showing WELCOME SCREEN');

          // Limpar localStorage de dashboard antigo
          localStorage.removeItem('last_dashboard_id');

          setShowWelcome(true);
          setLoading(false);
          return;
        } catch (error) {
          console.warn('⚠️ Could not load accessible dashboards:', error);
          // On error, assume new user and show welcome
          console.log('🎉 Error loading dashboards, showing WELCOME SCREEN for safety');

          // Limpar localStorage de dashboard antigo
          localStorage.removeItem('last_dashboard_id');

          setShowWelcome(true);
          setLoading(false);
          return;
        }
      }

      // Ensure loading is always set to false if no other path is taken
      setLoading(false);
    };

    initializeApp();
  }, [dashboardId, isAuthenticated, location.pathname, navigate]);
  
  // Load dashboard data when route context changes
  useEffect(() => {
    const isShare = location.pathname.startsWith('/share/');
    const isPublic = location.pathname.startsWith('/public/');
    if (isShare || isPublic) {
      loadDashboard();
    } else if (currentDashboardId && isAuthenticated) {
      // Verificar se o dashboard realmente existe antes de tentar carregar
      console.log('🔄 Attempting to load dashboard:', currentDashboardId);
      loadDashboard();
    }
  }, [currentDashboardId, isAuthenticated, location.pathname, shareToken]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const idBeingLoaded = currentDashboardId;
      const isShare = location.pathname.startsWith('/share/');
      const isPublic = location.pathname.startsWith('/public/');

      // Load dashboard info and components based on route type
      let backendComponents: any[] = [];

      if (isShare && shareToken) {
        try {
          const sharedDashboard = await queryClient.fetchQuery({
            queryKey: ['sharedDashboard', shareToken],
            queryFn: () => apiClient.getSharedDashboardByToken(shareToken),
            staleTime: 60_000,
            gcTime: 300_000,
          });
          if (idBeingLoaded === currentDashboardId) {
            setCurrentDashboard(sharedDashboard);
          } else {
            return;
          }
        } catch (e) {
          console.warn('Failed to load shared dashboard info:', e);
        }
        backendComponents = await queryClient.fetchQuery({
          queryKey: ['sharedComponents', shareToken],
          queryFn: () => apiClient.getSharedComponentsByToken(shareToken),
          staleTime: 60_000,
          gcTime: 300_000,
        });
      } else if (isPublic && currentDashboardId) {
        try {
          const dashboard = await queryClient.fetchQuery({
            queryKey: ['dashboard', currentDashboardId],
            queryFn: () => apiClient.getDashboard(currentDashboardId),
            staleTime: 60_000,
            gcTime: 300_000,
          });
          if (idBeingLoaded === currentDashboardId) {
            setCurrentDashboard(dashboard);
          } else {
            return;
          }
        } catch (e) {
          console.warn('Failed to load public dashboard info:', e);
        }
        backendComponents = await queryClient.fetchQuery({
          queryKey: ['publicDashboardComponents', currentDashboardId],
          queryFn: () => apiClient.getPublicDashboardComponents(currentDashboardId),
          staleTime: 60_000,
          gcTime: 300_000,
        });
      } else if (currentDashboardId) {
        // Authenticated flow
        try {
          const dashboard = await queryClient.fetchQuery({
            queryKey: ['dashboard', currentDashboardId],
            queryFn: () => apiClient.getDashboard(currentDashboardId),
            staleTime: 60_000,
            gcTime: 300_000,
          });
          if (idBeingLoaded === currentDashboardId) {
            setCurrentDashboard(dashboard);

            // Check if user has edit permissions - if not, set read-only
            console.log('🔐 Dashboard data received:', dashboard);
            console.log('🔐 Current user:', user);

            const dashboardData = dashboard as any;
            const dashboardOwnerId = dashboardData.owner_id;

            // If user is owner (comparing IDs), allow editing
            const isOwner = user?.id === dashboardOwnerId;

            // If not owner, check if it's a shared dashboard with edit permission
            let hasEditPermission = false;
            if (!isOwner) {
              try {
                // Fetch shared dashboards to get permissions
                const sharedDashboards = await queryClient.fetchQuery({
                  queryKey: ['sharedDashboards'],
                  queryFn: () => apiClient.getSharedDashboards(),
                  staleTime: 60_000,
                  gcTime: 300_000,
                });

                // Find this dashboard in shared list
                const sharedDashboard = sharedDashboards.find((d: any) => d.id === currentDashboardId);
                if (sharedDashboard) {
                  const permissions = (sharedDashboard as any).permissions || [];
                  hasEditPermission = permissions.includes('edit');
                  console.log('🔐 Found in shared dashboards:', {
                    dashboardId: currentDashboardId,
                    permissions,
                    hasEditPermission
                  });
                }
              } catch (error) {
                console.warn('Could not fetch shared dashboards for permission check:', error);
              }
            }

            const canEdit = isOwner || hasEditPermission;

            console.log('🔐 Dashboard permissions check:', {
              dashboardOwnerId,
              userId: user?.id,
              isOwner,
              hasEditPermission,
              canEdit,
              willBeReadOnly: !canEdit
            });

            setIsReadOnly(!canEdit);
          } else {
            return;
          }
        } catch (error) {
          console.warn('Failed to load dashboard info:', error);
        }
        try {
          backendComponents = await queryClient.fetchQuery({
            queryKey: ['dashboardComponents', currentDashboardId],
            queryFn: () => apiClient.getDashboardComponents(currentDashboardId),
            staleTime: 60_000,
            gcTime: 300_000,
          });
        } catch (error) {
          console.warn('Failed to load dashboard components:', error);
          backendComponents = [];
        }
      }

      try {
        const mappedComponents: ComponentItem[] = backendComponents.map((comp: any) => ({
          id: comp.id,
          backendId: comp.id,
          type: comp.type,
          title: comp.name,
          data: comp.config,
          layout: {
            x: comp.position_x || 0,
            y: comp.position_y || 0,
            w: comp.width || (comp.type === 'kpi' ? 3 : 6),
            h: comp.height || (comp.type === 'kpi' ? 2 : 4)
          }
        }));

        // Load content blocks and merge with components
        let allItems = [...mappedComponents];
        try {
          if (!isPublic && currentDashboardId) {
            const blocks = await queryClient.fetchQuery({
              queryKey: ['dashboardBlocks', currentDashboardId],
              queryFn: () => apiClient.getDashboardBlocks(currentDashboardId),
              staleTime: 60_000,
              gcTime: 300_000,
            });

            // Map blocks to component items
            const blockComponents: ComponentItem[] = blocks.map((b: any) => ({
              id: `block-${b.id}`,
              backendId: b.id,
              type: b.type,
              blockType: b.type,
              title: b.content || '',
              content: b.content || '',
              layout: {
                x: b.position_x || 0,
                y: b.position_y || 0,
                w: b.width || 12, // Full width by default for text blocks
                h: b.height || 1
              }
            }));

            allItems = [...mappedComponents, ...blockComponents];
          }
        } catch (error) {
          console.warn('Failed to load blocks or no access:', error);
        }

        if (idBeingLoaded === currentDashboardId) {
          setComponents(allItems);
          setComponentLoading(new Set());
        }
      } catch (error) {
        console.error('Failed to load components from backend:', error);
        setComponents([]);
      }
    } catch (error: any) {
      console.error('Error loading dashboard:', error);

      // Se for 403 (Forbidden) ou 404, o dashboard não existe mais
      if (error?.status === 403 || error?.status === 404) {
        console.log('🚫 Dashboard not accessible (403/404), showing welcome screen');

        // Limpar estado e localStorage
        setCurrentDashboardId(null);
        setCurrentDashboard(null);
        localStorage.removeItem('last_dashboard_id');

        // Mostrar welcome screen
        setShowWelcome(true);
        setLoading(false);
        return;
      }

      toast({
        title: "Error",
        description: "Failed to load dashboard",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate layouts for react-grid-layout
  const generateLayouts = useCallback(() => {
    const layouts: { [key: string]: Layout[] } = {};
    const layout = components.map(component => {
      const isTextBlock = ['header', 'subheader', 'text', 'description'].includes(component.type);
      return {
        i: component.id,
        x: component.layout?.x || 0,
        y: component.layout?.y || 0,
        w: component.layout?.w || (isTextBlock ? 12 : 4),
        h: component.layout?.h || (isTextBlock ? 1 : 3),
        minW: isTextBlock ? 3 : (component.type === 'kpi' ? 2 : 3),
        minH: isTextBlock ? 1 : (component.type === 'kpi' ? 2 : 3),
        maxH: isTextBlock ? 3 : (component.type === 'kpi' ? 4 : 8)
      };
    });

    layouts.lg = layout;
    layouts.md = layout;
    layouts.sm = layout;
    layouts.xs = layout;
    return layouts;
  }, [components]);

  // Handle layout changes
  const handleLayoutChange = useCallback((currentLayout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
    setComponents(prev => 
      prev.map(component => {
        const layoutItem = currentLayout.find(item => item.i === component.id);
        if (layoutItem) {
          return {
            ...component,
            layout: {
              x: layoutItem.x,
              y: layoutItem.y,
              w: layoutItem.w,
              h: layoutItem.h
            }
          };
        }
        return component;
      })
    );
  }, []);

  // Save layout changes to backend
  const handleLayoutSave = useCallback(async (currentLayout: Layout[]) => {
    try {
      // Update each component's position in the backend
      const updatePromises = currentLayout.map(async (layoutItem) => {
        const component = components.find(c => c.id === layoutItem.i);
        if (component) {
          const isTextBlock = ['header', 'subheader', 'text', 'description'].includes(component.type);

          if (component.backendId) {
            if (isTextBlock) {
              // Update text block
              console.log(`Updating text block ${component.backendId}:`, layoutItem);
              await apiClient.updateDashboardBlock(currentDashboardId, component.backendId, {
                position_x: layoutItem.x,
                position_y: layoutItem.y,
                width: layoutItem.w,
                height: layoutItem.h
              });
              if (currentDashboardId) {
                queryClient.invalidateQueries({ queryKey: ['dashboardBlocks', currentDashboardId] });
              }
            } else {
              // Update existing backend component
              console.log(`Updating existing component ${component.backendId}:`, layoutItem);
              await apiClient.updateComponent(component.backendId, {
                position_x: layoutItem.x,
                position_y: layoutItem.y,
                width: layoutItem.w,
                height: layoutItem.h
              });
              if (currentDashboardId) {
                queryClient.invalidateQueries({ queryKey: ['dashboardComponents', currentDashboardId] });
              }
            }
          } else {
            // Create component in backend for the first time
            console.log(`Creating new backend component for ${component.id}:`, layoutItem);
            console.log('Dashboard ID:', currentDashboardId);
            console.log('Auth token:', localStorage.getItem('auth_token') ? 'exists' : 'missing');
            try {
              const backendComponent = await apiClient.createComponent({
                dashboard_id: currentDashboardId,
                name: component.title,
                type: component.type as 'chart' | 'table' | 'kpi',
                config: component.data || {},
                position_x: layoutItem.x,
                position_y: layoutItem.y,
                width: layoutItem.w,
                height: layoutItem.h
              });
              
              // Update local component with backend ID
              setComponents(prev => 
                prev.map(c => 
                  c.id === component.id 
                    ? { ...c, backendId: backendComponent.id }
                    : c
                )
              );
              console.log(`Component ${component.id} now has backend ID: ${backendComponent.id}`);
            } catch (createError) {
              console.warn(`Failed to create backend component for ${component.id}:`, createError);
              // Continue with other components even if one fails
            }
          }
        }
      });
      
      if (updatePromises.length === 0) {
        return;
      }

      const results = await Promise.allSettled(updatePromises);
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length === 0) {
        // Invalidate components query to refresh
        if (currentDashboardId) {
          queryClient.invalidateQueries({ queryKey: ['dashboardComponents', currentDashboardId] });
        }
        toast({
          title: "Success",
          description: "Layout saved successfully",
        });
      } else if (failures.length < results.length) {
        toast({
          title: "Partial success",
          description: `Some items failed to save (${failures.length}/${results.length}).`,
        });
      } else {
        throw new Error('All layout updates failed');
      }
    } catch (error) {
      console.error('Failed to save layout:', error);
      toast({
        title: "Error",
        description: "Failed to save layout changes",
        variant: "destructive"
      });
    }
  }, [components, currentDashboardId]);

  const handleAddChart = () => {
    setEditingComponent(null);
    setIsChartModalOpen(true);
  };

  const handleAddTable = () => {
    setEditingComponent(null);
    setIsTableModalOpen(true);
  };

  const handleAddKPI = () => {
    setEditingComponent(null);
    setIsKPIModalOpen(true);
  };

  const handleEditComponent = (component: ComponentItem) => {
    setEditingComponent(component);
    if (component.type === 'chart') {
      setIsChartModalOpen(true);
    } else if (component.type === 'table') {
      setIsTableModalOpen(true);
    } else if (component.type === 'kpi') {
      setIsKPIModalOpen(true);
    }
  };

  const handleDeleteComponent = async (id: string) => {
    const component = components.find(c => c.id === id);
    if (component && component.backendId) {
      try {
        await apiClient.deleteComponent(component.backendId);
        toast({
          title: "Success",
          description: "Component deleted successfully",
        });
      } catch (error) {
        console.error('Failed to delete component:', error);
        toast({
          title: "Error",
          description: "Failed to delete component",
          variant: "destructive"
        });
      }
    }
    setComponents(prev => prev.filter(c => c.id !== id));
  };

  const handleWelcomeDashboardCreated = (dashboardId: string) => {
    setCurrentDashboardId(dashboardId);
    setShowWelcome(false);
    // Update URL to show the new dashboard using React Router
    navigate(`/dashboard/${dashboardId}`, { replace: true });
  };

  const handleAddTextBlock = async (type: 'header' | 'subheader' | 'text' | 'description' = 'text') => {
    if (isReadOnly) {
      toast({ title: 'Read-only', description: 'You do not have permission to edit this dashboard.' });
      return;
    }
    try {
      if (!currentDashboardId) return;

      // Find the highest Y position
      const maxY = Math.max(0, ...components.map(c => (c.layout?.y || 0) + (c.layout?.h || 1)));

      const created = await apiClient.createDashboardBlock(currentDashboardId, {
        type,
        content: '',
        order_index: components.length,
        position_x: 0,
        position_y: maxY,
        width: 12,
        height: 1
      });

      const newBlock: ComponentItem = {
        id: `block-${created.id}`,
        backendId: created.id,
        type: type,
        blockType: type,
        title: '',
        content: '',
        layout: {
          x: 0,
          y: maxY,
          w: 12,
          h: 1
        }
      };

      setComponents(prev => [...prev, newBlock]);
      queryClient.invalidateQueries({ queryKey: ['dashboardBlocks', currentDashboardId] });

      return created.id;
    } catch (e: any) {
      console.error('Failed to add text block:', e);
      if (e.status === 403) {
        setIsReadOnly(true);
        toast({ title: 'Read-only', description: 'You have view-only access to this dashboard.' });
      } else {
        toast({ title: 'Error', description: e?.message || 'Failed to add text block', variant: 'destructive' });
      }
    }
  };

  const handleUpdateTextBlock = async (id: string, content: string) => {
    if (isReadOnly) return;
    try {
      const component = components.find(c => c.id === id);
      if (!component || !component.backendId || !currentDashboardId) return;

      await apiClient.updateDashboardBlock(currentDashboardId, component.backendId, { content });
      setComponents(prev => prev.map(c => c.id === id ? { ...c, title: content, content } : c));
      queryClient.invalidateQueries({ queryKey: ['dashboardBlocks', currentDashboardId] });
    } catch (e: any) {
      if (e.status === 403) {
        setIsReadOnly(true);
        toast({ title: 'Read-only', description: 'You have view-only access to this dashboard.' });
      } else {
        toast({ title: 'Error', description: 'Failed to update text block', variant: 'destructive' });
      }
    }
  };

  const handleUpdateTextBlockType = async (id: string, type: 'header' | 'subheader' | 'text' | 'description') => {
    if (isReadOnly) return;
    try {
      const component = components.find(c => c.id === id);
      if (!component || !component.backendId || !currentDashboardId) return;

      await apiClient.updateDashboardBlock(currentDashboardId, component.backendId, { type });
      setComponents(prev => prev.map(c => c.id === id ? { ...c, type, blockType: type } : c));
      queryClient.invalidateQueries({ queryKey: ['dashboardBlocks', currentDashboardId] });
    } catch (e: any) {
      if (e.status === 403) {
        setIsReadOnly(true);
        toast({ title: 'Read-only', description: 'You have view-only access to this dashboard.' });
      } else {
        toast({ title: 'Error', description: 'Failed to update text block type', variant: 'destructive' });
      }
    }
  };

  const handleDeleteTextBlock = async (id: string) => {
    if (isReadOnly) return;
    try {
      const component = components.find(c => c.id === id);
      if (!component || !component.backendId || !currentDashboardId) return;

      await apiClient.deleteDashboardBlock(currentDashboardId, component.backendId);
      setComponents(prev => prev.filter(c => c.id !== id));
      queryClient.invalidateQueries({ queryKey: ['dashboardBlocks', currentDashboardId] });
    } catch (e: any) {
      if (e.status === 403) {
        setIsReadOnly(true);
        toast({ title: 'Read-only', description: 'You have view-only access to this dashboard.' });
      } else {
        toast({ title: 'Error', description: 'Failed to delete text block', variant: 'destructive' });
      }
    }
  };

  const handleUpdateDashboardName = async (newName: string) => {
    if (!currentDashboardId || !currentDashboard) return;
    
    try {
      const updatedDashboard = await apiClient.updateDashboard(currentDashboardId, {
        name: newName || 'Untitled Dashboard'
      });
      
      // Update local state
      setCurrentDashboard({
        ...currentDashboard,
        name: newName || 'Untitled Dashboard'
      });

      // Update sidebar
      refreshDashboards();
      queryClient.invalidateQueries({ queryKey: ['dashboards'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', currentDashboardId] });
      
    } catch (error) {
      console.error('Failed to update dashboard name:', error);
      toast({
        title: "Error",
        description: "Failed to update dashboard name",
        variant: "destructive"
      });
    }
  };

  const handleUpdateDashboardDescription = async (newDescription: string) => {
    if (!currentDashboardId || !currentDashboard) return;
    
    try {
      const updatedDashboard = await apiClient.updateDashboard(currentDashboardId, {
        description: newDescription
      });
      
      // Update local state
      setCurrentDashboard({
        ...currentDashboard,
        description: newDescription
      });
      queryClient.invalidateQueries({ queryKey: ['dashboard', currentDashboardId] });
      
    } catch (error) {
      console.error('Failed to update dashboard description:', error);
      toast({
        title: "Error",
        description: "Failed to update dashboard description",
        variant: "destructive"
      });
    }
  };

  const handleSaveComponent = async (component: Omit<ComponentItem, 'id'>) => {
    try {
      if (editingComponent) {
        // Update existing component
        if (editingComponent.backendId) {
          await apiClient.updateComponent(editingComponent.backendId, {
            name: component.title,
            config: component.data,
          });
        }
        
        setComponents(prev => prev.map(c => 
          c.id === editingComponent.id 
            ? { ...component, id: editingComponent.id, layout: c.layout, backendId: c.backendId }
            : c
        ));
      } else {
        // Create new component
        const maxY = Math.max(0, ...components.map(c => (c.layout?.y || 0) + (c.layout?.h || 3)));
        const defaultLayout = {
          x: 0,
          y: maxY,
          w: component.type === 'kpi' ? 3 : 6,
          h: component.type === 'kpi' ? 2 : 4
        };
        
        try {
          const backendComponent = await apiClient.createComponent({
            dashboard_id: currentDashboardId,
            name: component.title,
            type: component.type as 'chart' | 'table' | 'kpi',
            config: component.data,
            position_x: defaultLayout.x,
            position_y: defaultLayout.y,
            width: defaultLayout.w,
            height: defaultLayout.h
          });
          
          const newComponent: ComponentItem = {
            ...component,
            id: backendComponent.id,
            backendId: backendComponent.id,
            layout: defaultLayout
          };
          setComponents(prev => [...prev, newComponent]);
          if (currentDashboardId) {
            queryClient.invalidateQueries({ queryKey: ['dashboardComponents', currentDashboardId] });
          }
        } catch (error) {
          console.error('Failed to save to backend:', error);
          throw error;
        }
      }
      
      toast({
        title: "Success",
        description: editingComponent ? "Component updated successfully" : "Component created successfully",
      });
    } catch (error) {
      console.error('Failed to save component:', error);
      toast({
        title: "Error",
        description: "Failed to save component",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-6 h-6 border-2 border-muted border-t-foreground rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show welcome screen for new users
  if (showWelcome) {
    return <WelcomeDashboard onDashboardCreated={handleWelcomeDashboardCreated} />;
  }

  return (
    <div className="p-6 space-y-6">
      <style>{`
        .drag-handle-text {
          pointer-events: none !important;
        }
        .drag-handle-text .drag-handle {
          pointer-events: auto !important;
          cursor: grab !important;
        }
        .drag-handle-text .drag-handle:active {
          cursor: grabbing !important;
        }
        .drag-handle-text > div > div:not(.drag-handle) {
          pointer-events: auto !important;
          cursor: text !important;
        }
        .react-grid-item {
          cursor: grab;
        }
        .react-grid-item:active {
          cursor: grabbing;
        }
        .react-grid-item .drag-handle-text {
          cursor: default;
        }
        .react-grid-item button,
        .react-grid-item a,
        .react-grid-item [role="button"],
        .react-grid-item [role="menuitem"] {
          cursor: pointer !important;
        }
        .react-grid-item .drag-handle-text button {
          cursor: pointer !important;
        }
        /* Habilitar resize handles em blocos de texto */
        .react-grid-item.react-resizable .react-resizable-handle {
          pointer-events: auto !important;
          z-index: 10;
        }
        /* Menu dropdown deve ser clicável */
        [role="menu"],
        [role="menuitem"],
        [data-radix-menu-content],
        [data-radix-popper-content-wrapper] {
          pointer-events: auto !important;
          cursor: default !important;
        }
        [role="menuitem"]:hover,
        [data-radix-collection-item]:hover {
          cursor: pointer !important;
        }
      `}</style>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Editable Title */}
          <NotionEditableText
            value={currentDashboard?.name || ''}
            onChange={handleUpdateDashboardName}
            placeholder="Untitled Dashboard"
            className="text-3xl font-bold text-foreground leading-tight"
            maxLength={100}
            disabled={isReadOnly}
          />

          {/* Default Description (disappears when empty) */}
          <NotionEditableText
            value={currentDashboard?.description || ''}
            onChange={handleUpdateDashboardDescription}
            placeholder="Add a description..."
            className="text-muted-foreground text-base leading-relaxed"
            multiline={true}
            maxLength={500}
            showPlaceholderText={false}
            disabled={isReadOnly}
          />
        </div>

        {!isReadOnly && (
          <div className="flex gap-2">
            <Button onClick={handleAddChart} className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Add Chart
            </Button>
            <Button onClick={handleAddTable} variant="outline" className="gap-2">
              <Table className="w-4 h-4" />
              Add Table
            </Button>
            <Button onClick={handleAddKPI} variant="outline" className="gap-2">
              <Target className="w-4 h-4" />
              Add KPI
            </Button>
            <Button onClick={() => handleAddTextBlock('text')} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Text
            </Button>
          </div>
        )}
        {isReadOnly && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            View Only
          </div>
        )}
      </div>

      {/* Components Grid */}
      <div className="min-h-[400px]">
        <ResponsiveGridLayout
          key={components.map(c => c.id).join('-')}
          className="layout"
          layouts={generateLayouts()}
          onLayoutChange={handleLayoutChange}
          onDragStop={handleLayoutSave}
          onResizeStop={handleLayoutSave}
          isDroppable={false}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={60}
          isDraggable={!isReadOnly}
          isResizable={!isReadOnly}
          compactType="vertical"
          preventCollision={false}
          margin={[16, 16]}
          containerPadding={[0, 0]}
        >
          {components.map((component) => {
            const isTextBlock = ['header', 'subheader', 'text', 'description'].includes(component.type);

            if (isTextBlock) {
              return (
                <div key={component.id} className="p-2 drag-handle-text">
                  <NotionBlock
                    value={component.content || component.title || ''}
                    type={component.blockType || component.type as any}
                    onChange={(value) => handleUpdateTextBlock(component.id, value)}
                    onTypeChange={(type) => handleUpdateTextBlockType(component.id, type)}
                    onDelete={() => handleDeleteTextBlock(component.id)}
                    showTypeMenu={!isReadOnly}
                    disabled={isReadOnly}
                  />
                </div>
              );
            }

            return (
              <div key={component.id}>
                <Card className="shadow-soft hover:shadow-medium transition-shadow h-full">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium cursor-move">{component.title}</CardTitle>
                    {!isReadOnly && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditComponent(component)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteComponent(component.id)}
                            className="text-destructive"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </CardHeader>
                  <CardContent className="h-[calc(100%-60px)] overflow-hidden">
                    {component.type === 'chart' ? (
                      <DashboardChart data={component.data} loading={componentLoading.has(component.id)} />
                    ) : component.type === 'table' ? (
                      <DashboardTable data={component.data} loading={componentLoading.has(component.id)} />
                    ) : (
                      <DashboardKPI data={component.data} loading={componentLoading.has(component.id)} />
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </ResponsiveGridLayout>
      </div>

      {/* Modals */}
      <ChartModal
        open={isChartModalOpen}
        onClose={() => setIsChartModalOpen(false)}
        onSave={handleSaveComponent}
        initialData={editingComponent}
      />
      
      <TableModal
        open={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        onSave={handleSaveComponent}
        initialData={editingComponent}
      />
      
      <KPIModal
        open={isKPIModalOpen}
        onClose={() => setIsKPIModalOpen(false)}
        onSave={handleSaveComponent}
        initialData={editingComponent}
      />
    </div>
  );
}