const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface ApiResponse<T = any> {
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
    return this.request<any>('/api/auth/me');
  }

  // Dashboards
  async getDashboards() {
    return this.request<any[]>('/api/dashboards/');
  }

  async getDashboard(id: string) {
    return this.request<any>(`/api/dashboards/${id}`);
  }

  async createDashboard(data: { name: string; description?: string; is_public?: boolean }) {
    return this.request<any>('/api/dashboards/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDashboard(id: string, data: { name?: string; description?: string; is_public?: boolean }) {
    return this.request<any>(`/api/dashboards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDashboard(id: string) {
    return this.request<any>(`/api/dashboards/${id}`, {
      method: 'DELETE',
    });
  }

  async createShareLink(dashboardId: string) {
    return this.request<{ share_url: string }>(`/api/dashboards/${dashboardId}/share`, {
      method: 'POST',
    });
  }

  // Components
  async getDashboardComponents(dashboardId: string) {
    return this.request<any[]>(`/api/components/dashboard/${dashboardId}`);
  }

  // Public/Shared components (no auth)
  async getPublicDashboardComponents(dashboardId: string) {
    return this.request<any[]>(`/api/components/public/dashboard/${dashboardId}`);
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
    type: 'chart' | 'table' | 'kpi';
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
}

export const apiClient = new ApiClient();
export { ApiError };
export default apiClient;