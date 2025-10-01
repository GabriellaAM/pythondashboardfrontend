import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Settings,
  Plus,
  ChevronDown,
  LogOut,
  User,
  MoreHorizontal,
  Trash2,
  Edit,
  Pin,
  PinOff,
  Users,
  Share2,
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
  dashboardType?: 'owned' | 'shared_with_me' | 'shared_by_me';
  is_owner?: boolean;
  is_shared_with_me?: boolean;
  is_shared_by_me?: boolean;
  user_permissions?: string[];
  shared_by?: string;
  shared_users_count?: number;
  is_pinned?: boolean;
}

export function AppSidebar() {
  const queryClient = useQueryClient();
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [dashboardsOpen, setDashboardsOpen] = useState(true);
  const [dashboards, setDashboards] = useState<DashboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDashboard, setEditingDashboard] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [pinned, setPinned] = useState<Set<string>>(new Set());
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

  // Load pinned from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('pinned_dashboards');
      if (raw) setPinned(new Set(JSON.parse(raw)));
    } catch (e) {
      console.warn('Failed to load pinned dashboards:', e);
    }
  }, []);

  const persistPinned = (next: Set<string>) => {
    try {
      localStorage.setItem('pinned_dashboards', JSON.stringify(Array.from(next)));
    } catch (e) {
      console.warn('Failed to persist pinned dashboards:', e);
    }
  };

  const togglePin = (id: string) => {
    setPinned(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      persistPinned(next);
      return next;
    });
  };

  // Build unified dashboard list (já vem unificado do backend)
  const unifiedDashboards = (() => {
    const pinnedList = dashboards.filter(d => pinned.has(d.id));
    const unpinnedList = dashboards.filter(d => !pinned.has(d.id));
    return [...pinnedList, ...unpinnedList];
  })();

  // Load dashboards from API
  useEffect(() => {
    loadDashboards();
    const onFocus = () => loadDashboards();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const loadDashboards = async () => {
    try {
      if (dashboards.length === 0) {
        setLoading(true);
      }

      let attempts = 0;
      while (!localStorage.getItem('auth_token') && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }

      // Carregar dashboards próprios
      const ownedDashboards = await queryClient.fetchQuery({
        queryKey: ['dashboards'],
        queryFn: () => apiClient.getDashboards(),
        staleTime: 60_000,
        gcTime: 300_000,
      });

      // Carregar dashboards compartilhados
      const sharedDashboards = await queryClient.fetchQuery({
        queryKey: ['sharedDashboards'],
        queryFn: () => apiClient.getSharedDashboards(),
        staleTime: 60_000,
        gcTime: 300_000,
      });

      console.log('📊 Owned dashboards:', ownedDashboards);
      console.log('🤝 Shared dashboards:', sharedDashboards);

      // Combinar e adicionar flags manualmente
      const ownedWithFlags = (ownedDashboards || []).map(d => ({
        ...d,
        is_owner: true,
        is_shared_with_me: false,
        is_shared_by_me: false,
        user_permissions: ['view', 'edit', 'delete']
      }));

      const sharedWithFlags = (sharedDashboards || []).map(d => ({
        ...d,
        is_owner: false,
        is_shared_with_me: true,
        is_shared_by_me: false,
        user_permissions: d.permissions || ['view']
      }));

      // Unificar sem duplicatas
      const allDashboards = [...ownedWithFlags];
      sharedWithFlags.forEach(shared => {
        if (!allDashboards.find(d => d.id === shared.id)) {
          allDashboards.push(shared);
        }
      });

      console.log('✅ Total unified dashboards:', allDashboards.length);
      console.log('🔍 Dashboard Debug:', allDashboards.map(d => ({
        id: d.id,
        name: d.name,
        is_owner: d.is_owner,
        is_shared_with_me: d.is_shared_with_me,
        permissions: d.user_permissions,
        shared_by: d.shared_by
      })));

      setDashboards(allDashboards as any);
    } catch (error) {
      console.error('Could not load dashboards:', error);
      setDashboards([]);
    } finally {
      setLoading(false);
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
      if (dashboards.length <= 1) {
        toast({
          title: "Cannot Delete Dashboard",
          description: "You must have at least one dashboard. Create another dashboard first.",
          variant: "destructive"
        });
        return;
      }

      await apiClient.deleteDashboard(dashboardId);

      const remainingDashboards = dashboards.filter(d => d.id !== dashboardId);
      setDashboards(remainingDashboards);

      const currentPath = location.pathname;
      if (currentPath === `/dashboard/${dashboardId}` || currentPath === `/`) {
        if (remainingDashboards.length > 0) {
          const nextDashboard = remainingDashboards[0];
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
      setDashboards(prev => prev.map(d => d.id === dashboardId ? { ...d, name: finalName } : d));
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
                className="flex items-center justify-between w-full text-sidebar-foreground/70 hover:text-sidebar-foreground cursor-pointer"
              >
                <span>Dashboards</span>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform",
                  !dashboardsOpen && "-rotate-90"
                )} />
              </button>
            </SidebarGroupLabel>
            {dashboardsOpen && (
              <SidebarGroupContent>
                <SidebarMenu>
                  {loading && unifiedDashboards.length === 0 ? (
                    <SidebarMenuItem>
                      <div className="flex items-center gap-2 px-3 py-2 text-sm text-sidebar-foreground/70">
                        <div className="w-2 h-2 bg-sidebar-foreground/20 rounded-full animate-pulse" />
                        <span>Loading dashboards...</span>
                      </div>
                    </SidebarMenuItem>
                  ) : unifiedDashboards.length === 0 ? (
                    <SidebarMenuItem>
                      <div className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-sidebar-foreground/50 w-full italic">
                        <span>No dashboards yet</span>
                      </div>
                    </SidebarMenuItem>
                  ) : (
                    <>
                      {/* Simple unified dashboard list */}
                      {unifiedDashboards.map((dashboard) => {
                        const isPinned = pinned.has(dashboard.id);
                        const canEdit = dashboard.is_owner || (dashboard.user_permissions && dashboard.user_permissions.includes('edit'));

                        // 🎨 FUNÇÕES DE IDENTIFICAÇÃO VISUAL
                        const getDashboardDotColor = () => {
                          if (dashboard.is_shared_with_me === true) {
                            return "bg-blue-500"; // Azul para compartilhado comigo
                          } else if (dashboard.is_owner === true) {
                            return "bg-emerald-500"; // Verde para próprio
                          }
                          return "bg-sidebar-foreground/20"; // Cinza default
                        };

                        const getDashboardPermissionText = () => {
                          if (dashboard.is_shared_with_me === true) {
                            const perms = dashboard.user_permissions || [];
                            const sharedBy = dashboard.shared_by ? ` por ${dashboard.shared_by}` : '';
                            if (perms.includes('edit')) return `Compartilhado${sharedBy} - Pode editar`;
                            return `Compartilhado${sharedBy} - Apenas visualizar`;
                          }
                          if (dashboard.is_owner === true) return "Proprietário";
                          return "Dashboard";
                        };

                        const shareInfo = {
                          dot: getDashboardDotColor(),
                          text: getDashboardPermissionText()
                        };

                        return (
                          <SidebarMenuItem key={dashboard.id}>
                            {editingDashboard === dashboard.id && canEdit ? (
                              <div
                                className="px-3 py-2"
                                onBlur={(e) => {
                                  // Salvar ao perder foco (clicar fora)
                                  // Pequeno delay para garantir que o onChange foi processado
                                  setTimeout(() => {
                                    if (editingDashboard === dashboard.id) {
                                      saveRenameAndExit(dashboard.id, editingName);
                                    }
                                  }, 100);
                                }}
                              >
                                <NotionEditableText
                                  value={editingName}
                                  onChange={(val) => {
                                    setEditingName(val);
                                  }}
                                  placeholder="Untitled Dashboard"
                                  className="text-sm"
                                  maxLength={100}
                                  autoSave={false}
                                />
                              </div>
                            ) : (
                              <SidebarMenuButton asChild>
                                <NavLink
                                  to={`/dashboard/${dashboard.id}`}
                                  onClick={() => {
                                    setCurrentDashboard(dashboard as any);
                                    localStorage.setItem('last_dashboard_id', dashboard.id);
                                  }}
                                  onDoubleClick={(e) => {
                                    if (canEdit) {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      startRename(dashboard.id, dashboard.name);
                                    }
                                  }}
                                  className={cn(
                                    "group flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm",
                                    isActive(`/dashboard/${dashboard.id}`)
                                      ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
                                  )}
                                  title={shareInfo.text}
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${shareInfo.dot}`} />
                                    <span className="truncate">{dashboard.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {isPinned && <Pin className="w-3 h-3 text-sidebar-foreground/50" />}
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <MoreHorizontal className="h-3 w-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-44">
                                        {canEdit && (
                                          <DropdownMenuItem onClick={() => startRename(dashboard.id, dashboard.name)} className="cursor-pointer">
                                            <Edit className="h-3 w-3 mr-2" />
                                            Rename
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={() => togglePin(dashboard.id)} className="cursor-pointer">
                                          {isPinned ? <PinOff className="h-3 w-3 mr-2" /> : <Pin className="h-3 w-3 mr-2" />}
                                          {isPinned ? 'Unpin' : 'Pin to top'}
                                        </DropdownMenuItem>
                                        {dashboard.is_owner && (
                                          <DropdownMenuItem
                                            onClick={() => handleDeleteDashboard(dashboard.id, dashboard.name)}
                                            disabled={dashboards.filter(d => d.is_owner).length <= 1}
                                            className={cn(
                                              "text-destructive focus:text-destructive cursor-pointer",
                                              dashboards.filter(d => d.is_owner).length <= 1 && "opacity-50 cursor-not-allowed"
                                            )}
                                          >
                                            <Trash2 className="h-3 w-3 mr-2" />
                                            Delete
                                          </DropdownMenuItem>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </NavLink>
                              </SidebarMenuButton>
                            )}
                          </SidebarMenuItem>
                        );
                      })}

                      {/* New Dashboard Button */}
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
                    </>
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