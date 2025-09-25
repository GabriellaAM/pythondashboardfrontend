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
import { AddSectionButton, EditableSection } from "@/components/AddSectionButton";
import { DashboardChart } from "@/components/DashboardChart";
import { DashboardTable } from "@/components/DashboardTable";
import { DashboardKPI } from "@/components/DashboardKPI";

interface ComponentItem {
  id: string;
  type: 'chart' | 'table' | 'kpi';
  title: string;
  data?: any;
  layout?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  backendId?: string; // Real component ID from backend
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
  const { isAuthenticated } = useAuth();

  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isKPIModalOpen, setIsKPIModalOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<ComponentItem | null>(null);
  const [sections, setSections] = useState<Array<{ id: string; title: string; type: 'header' | 'subheader' | 'text' | 'description'; backendId?: string }>>([]);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Initialize dashboard selection when authenticated or when in public/share route
  useEffect(() => {
    const initializeApp = async () => {
      const isShare = location.pathname.startsWith('/share/');
      const isPublic = location.pathname.startsWith('/public/');
      setIsReadOnly(isShare || isPublic);
      if (!isAuthenticated && !isShare && !isPublic) return;

      // Set dashboard ID
      let dashId = dashboardId;

      // If we have a dashboard ID from URL, use it directly
      if (dashId) {
        setCurrentDashboardId(dashId);
        return;
      }

      // Only search for a dashboard if we don't have one and we're not in a share route
      if (!isShare && !dashId) {
        // Preferir o primeiro dashboard PRÓPRIO do usuário
        try {
          const ownedDashboards = await apiClient.getDashboards();
          if (ownedDashboards && ownedDashboards.length > 0) {
            const firstOwned = ownedDashboards[0];
            dashId = firstOwned.id;
            setCurrentDashboardId(dashId);
            setShowWelcome(false);
            navigate(`/dashboard/${dashId}`, { replace: true });
            return;
          }
        } catch (error) {
          console.warn('Could not load owned dashboards:', error);
        }

        // Fallback: usar o primeiro dashboard ACESSÍVEL (own/public/shared)
        try {
          const dashboards = await apiClient.getAccessibleDashboards();
          if (dashboards && dashboards.length > 0) {
            let accessibleDashboard = null;
            for (const dashboard of dashboards) {
              try {
                // Test if we can access this dashboard, its components, and its blocks
                await apiClient.getDashboard(dashboard.id);
                await apiClient.getDashboardComponents(dashboard.id);
                await apiClient.getDashboardBlocks(dashboard.id);
                accessibleDashboard = dashboard;
                break;
              } catch (testError) {
                console.warn(`Dashboard ${dashboard.id} not fully accessible:`, testError);
                continue;
              }
            }

            if (accessibleDashboard) {
              dashId = accessibleDashboard.id;
              console.log('Using first accessible dashboard:', dashId);
              setCurrentDashboardId(dashId);
              localStorage.setItem('last_dashboard_id', dashId);
              setShowWelcome(false);
              navigate(`/dashboard/${dashId}`, { replace: true });
              return;
            }
          }

          console.log('No accessible dashboards found, showing welcome screen');
          setShowWelcome(true);
          setLoading(false);
          return;
        } catch (error) {
          console.warn('Could not load accessible dashboards:', error);
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
        if (idBeingLoaded === currentDashboardId) {
          setComponents(mappedComponents);
          setComponentLoading(new Set()); // Clear component loading state
        }
      } catch (error) {
        console.error('Failed to load components from backend:', error);
        setComponents([]);
      }

      // Load content blocks when authenticated (owner or shared). Public/share routes may need a public blocks route if enabled.
      try {
        if (!isPublic && currentDashboardId) {
          const blocks = await queryClient.fetchQuery({
            queryKey: ['dashboardBlocks', currentDashboardId],
            queryFn: () => apiClient.getDashboardBlocks(currentDashboardId),
            staleTime: 60_000,
            gcTime: 300_000,
          });
          if (idBeingLoaded === currentDashboardId) {
            const mappedSections = blocks
              .sort((a, b) => a.order_index - b.order_index)
              .map(b => ({ id: b.id, backendId: b.id, title: b.content, type: b.type } as { id: string; backendId: string; title: string; type: 'header' | 'subheader' | 'text' | 'description' }));
            setSections(mappedSections);
          }
        } else {
          setSections([]);
        }
      } catch (error) {
        // If 403, user is likely view-only (shared). Keep read-only mode.
        console.warn('Failed to load blocks or no access:', error);
        setSections([]);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
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
    const layout = components.map(component => ({
      i: component.id,
      x: component.layout?.x || 0,
      y: component.layout?.y || 0,
      w: component.layout?.w || 4,
      h: component.layout?.h || 3,
      minW: component.type === 'kpi' ? 2 : 3,
      minH: component.type === 'kpi' ? 2 : 3,
      maxH: component.type === 'kpi' ? 4 : 8
    }));
    
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
          if (component.backendId) {
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

  const handleAddSection = async (title: string, type: 'header' | 'subheader' | 'text' | 'description') => {
    if (isReadOnly) {
      toast({ title: 'Read-only', description: 'You do not have permission to edit this dashboard.' });
      return;
    }
    try {
      if (!currentDashboardId) return;
      const nextOrder = sections.length;
      const created = await apiClient.createDashboardBlock(currentDashboardId, { type, content: title || '', order_index: nextOrder });
      setSections(prev => [...prev, { id: created.id, backendId: created.id, title, type }]);
    } catch (e: any) {
      console.error('Failed to add section:', e);
      if (e.status === 403) {
        setIsReadOnly(true);
        toast({ title: 'Read-only', description: 'You have view-only access to this dashboard.' });
      } else {
        toast({ title: 'Error', description: e?.message || 'Failed to add section', variant: 'destructive' });
      }
    }
  };

  const handleUpdateSection = async (id: string, title: string) => {
    if (isReadOnly) return;
    try {
      const section = sections.find(s => s.id === id);
      if (!section || !currentDashboardId) return;
      await apiClient.updateDashboardBlock(currentDashboardId, section.backendId || id, { content: title });
      setSections(prev => prev.map(s => s.id === id ? { ...s, title } : s));
      queryClient.invalidateQueries({ queryKey: ['dashboardBlocks', currentDashboardId] });
    } catch (e: any) {
      if (e.status === 403) {
        setIsReadOnly(true);
        toast({ title: 'Read-only', description: 'You have view-only access to this dashboard.' });
      } else {
        toast({ title: 'Error', description: 'Failed to update section', variant: 'destructive' });
      }
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (isReadOnly) return;
    try {
      const section = sections.find(s => s.id === id);
      if (!section || !currentDashboardId) return;
      await apiClient.deleteDashboardBlock(currentDashboardId, section.backendId || id);
      setSections(prev => prev.filter(s => s.id !== id));
      queryClient.invalidateQueries({ queryKey: ['dashboardBlocks', currentDashboardId] });
    } catch (e: any) {
      if (e.status === 403) {
        setIsReadOnly(true);
        toast({ title: 'Read-only', description: 'You have view-only access to this dashboard.' });
      } else {
        toast({ title: 'Error', description: 'Failed to delete section', variant: 'destructive' });
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
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="group flex-1 max-w-3xl space-y-4">
          {/* Editable Title */}
          <NotionEditableText
            value={currentDashboard?.name || ''}
            onChange={handleUpdateDashboardName}
            placeholder="Untitled Dashboard"
            className="text-3xl font-bold text-foreground leading-tight"
            maxLength={100}
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
          />

          {/* Editable Sections */}
          {sections.length > 0 && (
            <div className="space-y-2">
              {sections.map(section => (
                <EditableSection
                  key={section.id}
                  section={section}
                  onUpdate={handleUpdateSection}
                  onDelete={handleDeleteSection}
                />
              ))}
            </div>
          )}

          {/* Add Section Button (visible on hover) */}
          {!isReadOnly && <AddSectionButton onAddSection={handleAddSection} />}
        </div>
        
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
        </div>
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
          isDraggable={true}
          isResizable={true}
          compactType="vertical"
          preventCollision={false}
          margin={[16, 16]}
          containerPadding={[0, 0]}
        >
          {components.map((component) => (
            <div key={component.id}>
              <Card className="shadow-soft hover:shadow-medium transition-shadow h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium cursor-move">{component.title}</CardTitle>
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
          ))}
        </ResponsiveGridLayout>
      </div>

      {/* Add New Component Section */}
      <div className="mt-8">
        <Card className="border-dashed border-2 border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
          <CardContent className="flex flex-col items-center justify-center py-8 gap-4">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <Plus className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-muted-foreground mb-4">Add New Component</p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleAddChart}
                  className="gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  Chart
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleAddTable}
                  className="gap-2"
                >
                  <Table className="w-4 h-4" />
                  Table
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleAddKPI}
                  className="gap-2"
                >
                  <Target className="w-4 h-4" />
                  KPI
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
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