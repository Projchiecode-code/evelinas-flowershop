const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const TOKEN_STORAGE_KEY = 'evelinas_token';

class ApiClient {
  // iOS Safari can refuse the cross-site session cookie (ITP blocks it while
  // Android Chrome still sends it), which left every request 401 — "session
  // expired", empty notifications. The API also accepts
  // `Authorization: Bearer <token>`, so keep the token from the login /
  // register response on disk and attach it to every request. The httpOnly
  // cookie remains as a fallback wherever it does work.
  private token: string | null = (() => {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null; // storage unavailable (private mode) — cookie still works
    }
  })();

  setToken(token: string | null) {
    this.token = token;
    try {
      if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
      else localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // ignore — in-memory token still used for this session
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      const err = new Error(error.error || `HTTP ${response.status}`) as Error & { status?: number };
      err.status = response.status;
      throw err;
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();

// Auth
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// Products
export const productApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get(`/products${query}`);
  },
  getOne: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  seed: () => api.post('/products/seed'),
};

// Orders
export const orderApi = {
  create: (data: any) => api.post('/orders', data),
  getAll: () => api.get('/orders'),
  getOne: (id: string) => api.get(`/orders/${id}`),
  updateStatus: (id: string, status: string, data?: any) =>
    api.patch(`/orders/${id}/status`, { status, ...data }),
  rate: (id: string, rating: number, comment: string) =>
    api.patch(`/orders/${id}/rate`, { rating, comment }),
};

// Reviews
export const reviewApi = {
  create: (data: any) => api.post('/reviews', data),
  getAll: () => api.get('/reviews'),
  getByBouquet: (bouquetId: string) => api.get(`/reviews/${bouquetId}`),
  approve: (id: string) => api.patch(`/reviews/${id}/approve`),
  feature: (id: string) => api.patch(`/reviews/${id}/feature`),
  delete: (id: string) => api.delete(`/reviews/${id}`),
};

// Gallery
export const galleryApi = {
  submit: (data: any) => api.post('/gallery', data),
  getAll: () => api.get('/gallery'),
  getApproved: () => api.get('/gallery/approved'),
  getFeatured: () => api.get('/gallery/featured'),
  approve: (id: string) => api.patch(`/gallery/${id}/approve`),
  feature: (id: string) => api.patch(`/gallery/${id}/feature`),
  like: (id: string) => api.patch(`/gallery/${id}/like`),
  delete: (id: string) => api.delete(`/gallery/${id}`),
};

// Notifications
export const notificationApi = {
  create: (data: any) => api.post('/notifications', data),
  getAll: () => api.get('/notifications'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

// Users
export const userApi = {
  getAll: () => api.get('/users'),
  getOne: (id: string) => api.get(`/users/${id}`),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};