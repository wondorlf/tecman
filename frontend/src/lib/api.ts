import axios from 'axios';
import type { PaginatedResponse } from './types';

// Siempre usamos rutas relativas — Next.js rewrite (next.config.mjs) proxy /api/* al backend.
// NEXT_PUBLIC_API_URL se define solo cuando el frontend se sirve desde un origen diferente
// (ej. backend sirviendo frontend estático sin proxy), apuntando al backend.
// Las NEXT_PUBLIC_* se sustituyen en tiempo de compilación por webpack.
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const api = axios.create({
  baseURL: API_URL ? `${API_URL}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Token management (en memoria) ─────────────────────────────────────────────
// El access_token se guarda en memoria (no en localStorage).
// El refresh_token se almacena en una cookie httpOnly (manejada por el backend).
let _accessToken: string | null = null;

export function getAccessToken(): string | null {
  return _accessToken;
}

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

// ── User management ──────────────────────────────────────────────────────────
// Datos del usuario (no sensibles) en localStorage para persistencia entre recargas.
export function getUser(): any {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

export function setUser(user: any) {
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem('user');
}

// ── Auth initialization ──────────────────────────────────────────────────────
// Intenta refrescar el access_token usando la cookie httpOnly.
// Debe llamarse al cargar la app (en dashboard shells) o cuando se recibe un 401.
let _initPromise: Promise<boolean> | null = null;

export async function initAuth(): Promise<boolean> {
  // Si ya tenemos token en memoria, estamos autenticados
  if (_accessToken) return true;

  // Evitar llamadas concurrentes
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    try {
      // Esta llamada envía la cookie httpOnly automáticamente (same-origin)
      const response = await api.post('/auth/refresh');
      const { access_token, user } = response.data;
      _accessToken = access_token;
      if (user) setUser(user);
      return true;
    } catch {
      _accessToken = null;
      return false;
    }
  })();

  const result = await _initPromise;
  _initPromise = null;
  return result;
}

// ── Interceptor: agregar token a requests ────────────────────────────────────
api.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

// ── Interceptor: refresh automático en 401 ────────────────────────────────────
let isRefreshing = false;
let refreshSubscribers: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> =
  [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((sub) => sub.resolve(token));
  refreshSubscribers = [];
}

function onRefreshFailed(error: any) {
  refreshSubscribers.forEach((sub) => sub.reject(error));
  refreshSubscribers = [];
}

function addRefreshSubscriber(resolve: (token: string) => void, reject: (err: any) => void) {
  refreshSubscribers.push({ resolve, reject });
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    // Si es 401 y no es el endpoint de refresh ni login, intentar refrescar
    if (
      err.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh') &&
      typeof window !== 'undefined'
    ) {
      // Si estamos refrescando, esperar
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          addRefreshSubscriber(
            (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            (err) => reject(err),
          );
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Llama a refresh — la cookie httpOnly se envía automáticamente
        const response = await api.post('/auth/refresh');
        const { access_token, user } = response.data;

        _accessToken = access_token;
        if (user) setUser(user);
        onRefreshed(access_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        _accessToken = null;
        onRefreshFailed(refreshError);
        clearUser();
        window.location.href = '/';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  },
);

// ── AUTH ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  stats: () => api.get('/dashboard/stats'),
  recent: () => api.get('/dashboard/recent'),
  report: () => api.get('/dashboard/report', { responseType: 'blob' }),
};

// ── ASSETS ────────────────────────────────────────────────────────────────────
export const assetsApi = {
  list: (params?: Record<string, string | number>) => api.get('/assets', { params }),
  get: (id: string) => api.get(`/assets/${id}`),
  create: (data: any) => api.post('/assets', data),
  update: (id: string, data: any) => api.put(`/assets/${id}`, data),
  remove: (id: string) => api.delete(`/assets/${id}`),
  history: (id: string) => api.get(`/assets/${id}/history`),
  depreciation: (id: string) => api.get(`/assets/${id}/depreciation`),
  linkToDiscovery: (assetId: string, discoveryId: string) =>
    api.put(`/assets/${assetId}/link-discovery/${discoveryId}`),
  exportXlsx: () => api.get('/assets/export', { responseType: 'blob' }),
  findByQr: (code: string) => api.get(`/assets/qr/${encodeURIComponent(code)}`),
  checkCode: (code: string) => api.get(`/assets/check-code/${encodeURIComponent(code)}`),
  importXlsx: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/assets/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  updateAttributeValues: (id: string, values: { attributeId: string; value: string }[]) =>
    api.put(`/assets/${id}/attribute-values`, { values }),
};

// ── MAINTENANCE ───────────────────────────────────────────────────────────────
export const maintenanceApi = {
  list: (params?: Record<string, string | number>) => api.get('/maintenance', { params }),
  get: (id: string) => api.get(`/maintenance/${id}`),
  create: (data: any) => api.post('/maintenance', data),
  update: (id: string, data: any) => api.put(`/maintenance/${id}`, data),
  complete: (id: string, data: any) => api.put(`/maintenance/${id}/complete`, data),
  exportXlsx: () => api.get('/maintenance/export', { responseType: 'blob' }),
};

// ── ALERTS ────────────────────────────────────────────────────────────────────
export const alertsApi = {
  list: (params?: Record<string, string | number>) => api.get('/alerts', { params }),
  resolve: (id: string) => api.put(`/alerts/${id}/resolve`),
  create: (data: any) => api.post('/alerts', data),
  check: () => api.post('/alerts/check'),
};

// ── TICKETS ───────────────────────────────────────────────────────────────────
export const ticketsApi = {
  list: (params?: Record<string, string | number>) => api.get('/tickets', { params }),
  get: (id: string) => api.get(`/tickets/${id}`),
  create: (data: any) => api.post('/tickets', data),
  update: (id: string, data: any) => api.put(`/tickets/${id}`, data),
  reply: (id: string, data: any) => api.post(`/tickets/${id}/messages`, data),
  selfAssign: (id: string) => api.put(`/tickets/${id}/self-assign`),
  changePriority: (id: string, priority: string) => api.put(`/tickets/${id}/change-priority`, { priority }),
  exportXlsx: () => api.get('/tickets/export', { responseType: 'blob' }),
};

// ── CHECKLISTS ────────────────────────────────────────────────────────────────
export const checklistsApi = {
  list: () => api.get('/checklists'),
  get: (id: string) => api.get(`/checklists/${id}`),
  create: (data: any) => api.post('/checklists', data),
  update: (id: string, data: any) => api.put(`/checklists/${id}`, data),
  remove: (id: string) => api.delete(`/checklists/${id}`),
  exportXlsx: () => api.get('/checklists/export', { responseType: 'blob' }),
};

// ── USERS ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  list: (params?: Record<string, string | number>) => api.get('/users', { params }),
  get: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  toggle: (id: string) => api.put(`/users/${id}/toggle`),
};

// ── CATEGORIES ────────────────────────────────────────────────────────────────
export const categoriesApi = {
  list: () => api.get('/categories'),
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data),
  remove: (id: string) => api.delete(`/categories/${id}`),
  checkName: (name: string) => api.get(`/categories/check-name/${encodeURIComponent(name)}`),
  // Attributes
  createAttribute: (catId: string, data: any) => api.post(`/categories/${catId}/attributes`, data),
  updateAttribute: (catId: string, attrId: string, data: any) => api.put(`/categories/${catId}/attributes/${attrId}`, data),
  removeAttribute: (catId: string, attrId: string) => api.delete(`/categories/${catId}/attributes/${attrId}`),
  propagateAttribute: (catId: string, attrId: string, defaultValue: string) =>
    api.post(`/categories/${catId}/attributes/${attrId}/propagate`, { defaultValue }),
};

// ── SUBCATEGORIES ──────────────────────────────────────────────────────────────
export const subcategoriesApi = {
  create: (categoryId: string, data: { name: string; description?: string }) =>
    api.post(`/categories/${categoryId}/subcategories`, data),
  update: (categoryId: string, subId: string, data: { name?: string; description?: string }) =>
    api.put(`/categories/${categoryId}/subcategories/${subId}`, data),
  remove: (categoryId: string, subId: string) =>
    api.delete(`/categories/${categoryId}/subcategories/${subId}`),
};

// ── LOCATIONS ─────────────────────────────────────────────────────────────────
export const locationsApi = {
  list: () => api.get('/locations'),
  create: (data: any) => api.post('/locations', data),
  update: (id: string, data: any) => api.put(`/locations/${id}`, data),
  remove: (id: string) => api.delete(`/locations/${id}`),
};

// ── SUPPLIERS ─────────────────────────────────────────────────────────────────
export const suppliersApi = {
  list: () => api.get('/suppliers'),
  create: (data: any) => api.post('/suppliers', data),
  update: (id: string, data: any) => api.put(`/suppliers/${id}`, data),
  remove: (id: string) => api.delete(`/suppliers/${id}`),
};

// ── DOCUMENTS ─────────────────────────────────────────────────────────────────
export const documentsApi = {
  list: (assetId?: string) => api.get('/documents', { params: assetId ? { assetId } : undefined }),
  upload: (formData: FormData) =>
    api.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  remove: (id: string) => api.delete(`/documents/${id}`),
};

// ── ROLES ─────────────────────────────────────────────────────────────────────
export const rolesApi = {
  list: () => api.get('/users/roles'),
};

// ── FASE 2: CUSTODIAS, RESERVAS, KITS, TAGS ───────────────────────────────────
export const custodiesApi = {
  list: (params?: Record<string, string | number>) => api.get('/custodies', { params }),
  assign: (data: { assetId: string; userId: string; notes?: string }) =>
    api.post('/custodies/assign', data),
  returnAsset: (id: string, notes?: string) => api.put(`/custodies/${id}/return`, { notes }),
};

export const bookingsApi = {
  list: (params?: Record<string, string | number>) => api.get('/bookings', { params }),
  create: (data: any) => api.post('/bookings', data),
  updateStatus: (id: string, status: string) => api.put(`/bookings/${id}/status`, { status }),
};

export const kitsApi = {
  list: (params?: Record<string, string | number>) => api.get('/kits', { params }),
  get: (id: string) => api.get(`/kits/${id}`),
  create: (data: any) => api.post('/kits', data),
  addItem: (id: string, assetId: string) => api.post(`/kits/${id}/items`, { assetId }),
  removeItem: (id: string, assetId: string) => api.delete(`/kits/${id}/items/${assetId}`),
  checkName: (name: string) => api.get(`/kits/check-name/${encodeURIComponent(name)}`),
};

export const tagsApi = {
  list: () => api.get('/tags'),
  create: (data: { name: string; color?: string }) => api.post('/tags', data),
  remove: (id: string) => api.delete(`/tags/${id}`),
  assignToAsset: (assetId: string, tagId: string) => api.post('/tags/assign', { assetId, tagId }),
  removeFromAsset: (assetId: string, tagId: string) =>
    api.delete(`/tags/remove/${assetId}/${tagId}`),
  checkName: (name: string) => api.get(`/tags/check-name/${encodeURIComponent(name)}`),
};

// ── FASE 3: ITSM (SLA, SERVICE CATALOG, RFC, DISCOVERY) ──────────────────────
export const slasApi = {
  list: () => api.get('/slas'),
  create: (data: any) => api.post('/slas', data),
  update: (id: string, data: any) => api.put(`/slas/${id}`, data),
  remove: (id: string) => api.delete(`/slas/${id}`),
};

export const serviceCatalogApi = {
  list: () => api.get('/service-catalog'),
  create: (data: any) => api.post('/service-catalog', data),
  update: (id: string, data: any) => api.put(`/service-catalog/${id}`, data),
  remove: (id: string) => api.delete(`/service-catalog/${id}`),
};

export const changeRequestsApi = {
  list: (params?: Record<string, string | number>) => api.get('/change-requests', { params }),
  get: (id: string) => api.get(`/change-requests/${id}`),
  create: (data: any) => api.post('/change-requests', data),
  updateStatus: (id: string, status: string, dates?: any) =>
    api.put(`/change-requests/${id}/status`, {
      status,
      scheduledStart: dates?.start,
      scheduledEnd: dates?.end,
    }),
};

// ── DISCOVERY / AGENTE ─────────────────────────────────────────────────────
export const discoveryApi = {
  list: (params?: Record<string, string | number>) => api.get('/discovery', { params }),
  get: (id: string) => api.get(`/discovery/${id}`),
  getChanges: (id: string) => api.get(`/discovery/${id}/changes`),
  getStats: () => api.get('/discovery/stats'),
  getAgentMetrics: () => api.get('/discovery/agent-metrics'),
  sendAgentData: (data: any) => api.post('/discovery/agent', data),
  linkToAsset: (id: string, data: { createNew: boolean; assetData?: any }) =>
    api.put(`/discovery/${id}/link-to-asset`, data),
  remove: (id: string) => api.delete(`/discovery/${id}`),
};

// ── TENANTS / CONFIGURACIÓN GLOBAL ───────────────────────────────────────────
export const tenantsApi = {
  getPublicSettings: () => api.get('/tenants/public'),
  getSettings: () => api.get('/tenants/settings'),
  updateSettings: (id: string, data: any) => api.patch(`/tenants/settings/${id}`, data),
};

// ── KNOWLEDGE BASE ──────────────────────────────────────────────────────────
export const knowledgeApi = {
  listCategories: () => api.get('/knowledge/categories'),
  listArticles: (params?: Record<string, string | number>) =>
    api.get('/knowledge/articles', { params }),
  getArticle: (id: string) => api.get(`/knowledge/articles/${id}`),
  rateArticle: (id: string, helpful: boolean) =>
    api.post(`/knowledge/articles/${id}/rate`, { helpful }),
};

// ── Utilidad para descargar blob ──────────────────────────────────────────────
export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
