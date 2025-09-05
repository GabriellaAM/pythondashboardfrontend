import { useState, useCallback, useEffect } from "react";
import { Plus, MoreVertical, BarChart3, Table, Target } from "lucide-react";
import { useParams, useLocation } from "react-router-dom";
import { apiClient } from "@/lib/api";
import { useDashboard } from "@/contexts/DashboardContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Responsive, WidthProvider, Layout } from "react-grid-layout";
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
  const { id: dashboardId, token: shareToken } = useParams();
  const location = useLocation();
  const [components, setComponents] = useState<ComponentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDashboardId, setCurrentDashboardId] = useState<string | null>(null);
  const { currentDashboard, setCurrentDashboard } = useDashboard();
  const { isAuthenticated } = useAuth();

  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isKPIModalOpen, setIsKPIModalOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<ComponentItem | null>(null);

  // Initialize dashboard selection when authenticated or when in public/share route
  useEffect(() => {
    const initializeApp = async () => {
      const isShare = location.pathname.startsWith('/share/');
      const isPublic = location.pathname.startsWith('/public/');
      if (!isAuthenticated && !isShare && !isPublic) return;

      // Set dashboard ID
      let dashId = dashboardId;
      if (!dashId && !isShare) {
        // If no dashboard ID in URL, get first dashboard from API
        try {
          const dashboards = await apiClient.getDashboards();
          if (dashboards && dashboards.length > 0) {
            dashId = dashboards[0].id;
            console.log('Using first available dashboard:', dashId);
            // Update URL to reflect the dashboard being viewed
            window.history.replaceState({}, '', `/dashboard/${dashId}`);
          }
        } catch (error) {
          console.warn('Could not load dashboards:', error);
        }
      }

      setCurrentDashboardId(dashId);
    };

    initializeApp();
  }, [dashboardId, isAuthenticated, location.pathname]);
  
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
      const isShare = location.pathname.startsWith('/share/');
      const isPublic = location.pathname.startsWith('/public/');

      // Load dashboard info and components based on route type
      let backendComponents: any[] = [];

      if (isShare && shareToken) {
        try {
          const sharedDashboard = await apiClient.getSharedDashboardByToken(shareToken);
          setCurrentDashboard(sharedDashboard);
        } catch (e) {
          console.warn('Failed to load shared dashboard info:', e);
        }
        backendComponents = await apiClient.getSharedComponentsByToken(shareToken);
      } else if (isPublic && currentDashboardId) {
        try {
          const dashboard = await apiClient.getDashboard(currentDashboardId);
          setCurrentDashboard(dashboard);
        } catch (e) {
          console.warn('Failed to load public dashboard info:', e);
        }
        backendComponents = await apiClient.getPublicDashboardComponents(currentDashboardId);
      } else if (currentDashboardId) {
        // Authenticated flow
        try {
          const dashboard = await apiClient.getDashboard(currentDashboardId);
          setCurrentDashboard(dashboard);
        } catch (error) {
          console.warn('Failed to load dashboard info:', error);
        }
        backendComponents = await apiClient.getDashboardComponents(currentDashboardId);
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
        setComponents(mappedComponents);
      } catch (error) {
        console.error('Failed to load components from backend:', error);
        setComponents([]);
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
      
      await Promise.all(updatePromises);
      
      toast({
        title: "Success",
        description: "Layout saved successfully",
      });
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
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {currentDashboard?.name || 'Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {currentDashboard?.description || 'Visualize and analyze your data'}
          </p>
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
          className="layout"
          layouts={generateLayouts()}
          onLayoutChange={handleLayoutChange}
          onDragStop={handleLayoutSave}
          onResizeStop={handleLayoutSave}
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
                    <DashboardChart data={component.data} />
                  ) : component.type === 'table' ? (
                    <DashboardTable data={component.data} />
                  ) : (
                    <DashboardKPI data={component.data} />
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