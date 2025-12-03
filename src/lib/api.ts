const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Portfolio interfaces
interface PortfolioData {
  data: any[];
  columns: string[];
  index: string[];
}

interface VaRVoOData {
  var: Record<string, number>;
  voo: Record<string, number>;
  nivel_confianca: number;
  janela_amostral: number;
  periodo: number;
}

interface PositionData {
  data: any[];
  columns: string[];
}

interface Dashboard {
  id: string;
  name: string;
  description?: string;
  is_public?: boolean;
  owner_id?: string;
  created_at: string;
  updated_at: string;
}

interface SharedDashboard {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  permissions: string[];
  shared_at: string;
  shared_by: string;
}

interface Component {
  id: string;
  dashboard_id: string;
  name: string;
  type: 'chart' | 'table' | 'kpi' | 'portfolio_chart';
  config?: Record<string, unknown>;
  python_script?: string;
  position_x?: number;
  position_y?: number;
  width?: number;
  height?: number;
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          response.status,
          errorData.detail || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          this.clearToken();
          window.location.href = '/login';
        }
        throw error;
      }
      throw new ApiError(0, 'Network error');
    }
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await this.request<{ access_token: string; token_type: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    this.setToken(response.access_token);
    return response;
  }

  async register(email: string, password: string, full_name: string) {
    const response = await this.request<{ access_token: string; token_type: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ 
        email, 
        password, 
        full_name, 
        role: 'user' 
      }),
    });
    
    this.setToken(response.access_token);
    return response;
  }

  async getCurrentUser() {
    return this.request<{ id: string; email: string; full_name: string; created_at: string }>('/api/auth/me');
  }

  // Dashboards
  async getDashboards() {
    return this.request<Dashboard[]>('/api/dashboards/');
  }

  async getAccessibleDashboards() {
    return this.request<Dashboard[]>('/api/dashboards/accessible');
  }

  async getDashboardsComplete() {
    return this.request<{
      dashboards: {
        owned: Dashboard[];
        shared_with_me: Dashboard[];
        all_unified: Array<Dashboard & {
          is_owner: boolean;
          is_shared_with_me: boolean;
          is_shared_by_me: boolean;
          user_permissions: string[];
          shared_by?: string;
          shared_users_count?: number;
        }>;
      };
    }>('/api/dashboards-complete');
  }

  async getDashboard(id: string) {
    return this.request<Dashboard>(`/api/dashboards/${id}`);
  }

  async createDashboard(data: { name: string; description?: string; is_public?: boolean }) {
    return this.request<Dashboard>('/api/dashboards/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDashboard(id: string, data: { name?: string; description?: string; is_public?: boolean }) {
    return this.request<Dashboard>(`/api/dashboards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDashboard(id: string) {
    return this.request<{ message: string }>(`/api/dashboards/${id}`, {
      method: 'DELETE',
    });
  }

  async createShareLink(dashboardId: string) {
    return this.request<{ share_url: string }>(`/api/dashboards/${dashboardId}/share`, {
      method: 'POST',
    });
  }

  async shareDashboardWithUser(dashboardId: string, userEmail: string, permission: 'view' | 'edit' = 'view') {
    return this.request<{ message: string }>(`/api/dashboards/${dashboardId}/share-with-user`, {
      method: 'POST',
      body: JSON.stringify({ email: userEmail, permissions: [permission] }),
    });
  }

  async getSharedDashboards() {
    try {
      console.log('🔍 Making API call to /api/dashboards/shared-with-me');
      console.log('🔑 Token:', this.token ? 'exists' : 'missing');
      console.log('🌐 API Base URL:', API_BASE_URL);

      const result = await this.request<SharedDashboard[]>('/api/dashboards/shared-with-me');
      console.log('✅ API Response from /api/dashboards/shared-with-me:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Failed to fetch shared dashboards:', {
        status: error.status,
        message: error.message,
        url: `${API_BASE_URL}/api/dashboards/shared-with-me`
      });
      // Return empty array as fallback
      return [];
    }
  }

  async revokeUserAccess(dashboardId: string, userEmail: string) {
    return this.request<{ message: string }>(`/api/dashboards/${dashboardId}/revoke-access`, {
      method: 'POST',
      body: JSON.stringify({ email: userEmail }),
    });
  }

  async getDashboardSharedUsers(dashboardId: string) {
    return this.request<{ email: string; full_name: string; permissions: string[]; shared_at: string }[]>(`/api/dashboards/${dashboardId}/shared-users`);
  }


  // Dashboard Blocks
  async getDashboardBlocks(dashboardId: string) {
    return this.request<Array<{
      id: string;
      dashboard_id: string;
      type: 'header' | 'subheader' | 'text' | 'description';
      content: string;
      order_index: number;
      created_at: string;
      updated_at: string;
    }>>(`/api/dashboards/${dashboardId}/blocks`);
  }

  async createDashboardBlock(dashboardId: string, data: {
    type: 'header' | 'subheader' | 'text' | 'description';
    content: string;
    order_index?: number;
    position_x?: number;
    position_y?: number;
    width?: number;
    height?: number;
  }) {
    return this.request<any>(`/api/dashboards/${dashboardId}/blocks`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDashboardBlock(dashboardId: string, blockId: string, data: {
    type?: 'header' | 'subheader' | 'text' | 'description';
    content?: string;
    position_x?: number;
    position_y?: number;
    width?: number;
    height?: number;
  }) {
    return this.request<any>(`/api/dashboards/${dashboardId}/blocks/${blockId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async reorderDashboardBlocks(dashboardId: string, blocks: Array<{ id: string; order_index: number }>) {
    return this.request<{ message: string }>(`/api/dashboards/${dashboardId}/blocks/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ blocks }),
    });
  }

  async deleteDashboardBlock(dashboardId: string, blockId: string) {
    return this.request<{ message: string }>(`/api/dashboards/${dashboardId}/blocks/${blockId}`, {
      method: 'DELETE',
    });
  }

  // Components
  async getDashboardComponents(dashboardId: string) {
    return this.request<Component[]>(`/api/components/dashboard/${dashboardId}`);
  }

  // Public/Shared components (no auth)
  async getPublicDashboardComponents(dashboardId: string) {
    return this.request<Component[]>(`/api/components/public/dashboard/${dashboardId}`);
  }

  async getSharedDashboardByToken(shareToken: string) {
    return this.request<any>(`/api/dashboards/shared/${shareToken}`);
  }

  async getSharedComponentsByToken(shareToken: string) {
    return this.request<any[]>(`/api/components/shared/${shareToken}`);
  }

  async getComponent(id: string) {
    return this.request<any>(`/api/components/${id}`);
  }

  async createComponent(data: {
    dashboard_id: string;
    name: string;
    type: 'chart' | 'table' | 'kpi' | 'portfolio_chart';
    config?: any;
    python_script?: string;
    position_x?: number;
    position_y?: number;
    width?: number;
    height?: number;
  }) {
    return this.request<any>('/api/components/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateComponent(id: string, data: {
    name?: string;
    config?: any;
    python_script?: string;
    position_x?: number;
    position_y?: number;
    width?: number;
    height?: number;
  }) {
    return this.request<any>(`/api/components/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteComponent(id: string) {
    return this.request<any>(`/api/components/${id}`, {
      method: 'DELETE',
    });
  }

  async duplicateComponent(id: string) {
    return this.request<any>(`/api/components/${id}/duplicate`, {
      method: 'POST',
    });
  }

  // Code Execution
  async executeCode(code: string, componentId?: string) {
    return this.request<{
      success: boolean;
      result?: any;
      error?: string;
      execution_time: number;
      timestamp: string;
    }>('/api/executor/run', {
      method: 'POST',
      body: JSON.stringify({ 
        code, 
        component_id: componentId,
        timeout: 30
      }),
    });
  }

  async getExecutionLogs(componentId: string, limit = 10) {
    return this.request<any[]>(`/api/executor/logs/${componentId}?limit=${limit}`);
  }

  // Automation
  async getScheduledTasks() {
    return this.request<any[]>('/api/automation/tasks');
  }

  async getComponentScheduledTasks(componentId: string) {
    return this.request<any[]>(`/api/automation/tasks/${componentId}`);
  }

  async createScheduledTask(data: {
    component_id: string;
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    is_active?: boolean;
    notification_email?: string;
  }) {
    return this.request<any>('/api/automation/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateScheduledTask(id: string, data: {
    frequency?: 'hourly' | 'daily' | 'weekly' | 'monthly';
    is_active?: boolean;
    notification_email?: string;
  }) {
    return this.request<any>(`/api/automation/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteScheduledTask(id: string) {
    return this.request<any>(`/api/automation/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  async runTaskNow(id: string) {
    return this.request<any>(`/api/automation/tasks/${id}/run`, {
      method: 'POST',
    });
  }

  // Portfolio methods
  async getPortfolioCarteiras(inicio: string, fim: string, carteiras: string[] = ["EXC", "HB", "LC", "AC"], brl: boolean = false) {
    const carteirasParam = carteiras.join(',');
    return this.request<PortfolioData>(`/api/portfolio/visualizations/carteiras/${inicio}/${fim}?carteiras=${carteirasParam}&brl=${brl}`);
  }

  async getPortfolioRebalanceamento(inicio: string, fim: string, carteira: string = "EXC") {
    return this.request<any>(`/api/portfolio/visualizations/rebalanceamento/${inicio}/${fim}?carteira=${carteira}`);
  }

  async getPortfolioAtivos(inicio: string, fim: string, carteira: string = "EXC", brl: boolean = false) {
    return this.request<PortfolioData>(`/api/portfolio/visualizations/ativos/${inicio}/${fim}?carteira=${carteira}&brl=${brl}`);
  }

  async getPortfolioDecomposicao(inicio: string, fim: string, carteira: string = "EXC", brl: boolean = false) {
    return this.request<PortfolioData>(`/api/portfolio/visualizations/decomposicao/${inicio}/${fim}?carteira=${carteira}&brl=${brl}`);
  }

  async getPortfolioHeatmap(inicio: string, fim: string, carteira: string = "EXC") {
    return this.request<any>(`/api/portfolio/visualizations/heatmap/${inicio}/${fim}?carteira=${carteira}`);
  }

  async getPortfolioVaRVoO(inicio: string, fim: string, carteira: string = "EXC", nivel_confianca: number = 95, janela_amostral: number = 365, periodo: number = 7) {
    return this.request<VaRVoOData>(`/api/portfolio/visualizations/var-voo/${inicio}/${fim}?carteira=${carteira}&nivel_confianca=${nivel_confianca}&janela_amostral=${janela_amostral}&periodo=${periodo}`);
  }

  async getPortfolioPosicoesAbertas(carteira: string = "EXC") {
    return this.request<PositionData>(`/api/portfolio/visualizations/posicoes-abertas?carteira=${carteira}`);
  }

  async getPortfolioPosicoesFechadas(carteira: string = "EXC") {
    return this.request<PositionData>(`/api/portfolio/visualizations/posicoes-fechadas?carteira=${carteira}`);
  }

  async getPortfolioDiasPositivosNegativos(inicio: string, fim: string, carteira: string = "EXC", segmentar: boolean = false) {
    return this.request<any>(`/api/portfolio/visualizations/dias-positivos-negativos/${inicio}/${fim}?carteira=${carteira}&segmentar=${segmentar}`);
  }

  async getPortfolioBetaRolling(inicio: string, fim: string, carteira: string = "EXC", janela: number = 30) {
    return this.request<PortfolioData>(`/api/portfolio/visualizations/beta-rolling/${inicio}/${fim}?carteira=${carteira}&janela=${janela}`);
  }

  // 🚀 NOVO: Endpoint otimizado para dashboard completo
  async getPortfolioDashboardCompleto(inicio: string, fim: string, carteira: string = "EXC", brl: boolean = false) {
    return this.request<{
      performance: {
        carteiras: PortfolioData;
        decomposicao: PortfolioData;
      };
      rebalanceamento: any;
      ativos: PortfolioData;
      risco: {
        heatmap: any;
        var_voo: VaRVoOData;
        beta_rolling: PortfolioData;
      };
      posicoes: {
        abertas: PositionData;
        fechadas: PositionData;
        dias_positivos_negativos: any;
      };
      metadata: {
        carteira: string;
        inicio: string;
        fim: string;
        brl: boolean;
        processado_em: number;
      };
    }>(`/api/portfolio/visualizations/dashboard-completo/${inicio}/${fim}?carteira=${carteira}&brl=${brl}`);
  }

  // Cache management
  async clearBackendCache() {
    return this.request<{
      success: boolean;
      message: string;
      entries_cleared: number;
    }>('/api/portfolio/visualizations/cache/clear', {
      method: 'POST',
    });
  }

  async getCacheStats() {
    return this.request<{
      total_entries: number;
      valid_entries: number;
      expired_entries: number;
      ttl_seconds: number;
      cache_keys: string[];
    }>('/api/portfolio/visualizations/cache/stats');
  }
}

export const apiClient = new ApiClient();
export { ApiError };
export default apiClient;