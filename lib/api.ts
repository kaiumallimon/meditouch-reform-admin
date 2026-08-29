const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface APIResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, any>;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export class APIError extends Error {
  statusCode: number;
  errorCode: string;
  details?: any;

  constructor(message: string, statusCode: number = 500, errorCode: string = "API_ERROR", details?: any) {
    super(message);
    this.name = "APIError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("meditouch_access_token");
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function doRefreshToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const refreshToken = localStorage.getItem("meditouch_refresh_token");
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      // Refresh token is expired or revoked
      localStorage.removeItem("meditouch_user");
      localStorage.removeItem("meditouch_access_token");
      localStorage.removeItem("meditouch_refresh_token");
      document.cookie = "meditouch_token=; path=/; max-age=0";
      return null;
    }

    const json = await res.json();
    const data = json.data;
    if (data && data.access_token) {
      localStorage.setItem("meditouch_access_token", data.access_token);
      if (data.refresh_token) {
        localStorage.setItem("meditouch_refresh_token", data.refresh_token);
      }
      document.cookie = `meditouch_token=${data.access_token}; path=/; max-age=86400; SameSite=Lax`;
      return data.access_token;
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;

  try {
    let res = await fetch(url, {
      ...options,
      headers,
    });

    // Automatic token refresh on 401 Unauthorized
    if (res.status === 401 && !endpoint.includes("/auth/login") && !endpoint.includes("/auth/refresh")) {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = doRefreshToken().finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;
      if (newToken) {
        // Re-execute original request with new token
        headers["Authorization"] = `Bearer ${newToken}`;
        res = await fetch(url, {
          ...options,
          headers,
        });
      } else {
        // Refresh failed, redirect to login if in browser
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
      }
    }

    const data = await res.json();

    if (!res.ok) {
      throw new APIError(
        data.message || data.detail || `Request failed with status ${res.status}`,
        res.status,
        data.error_code || "HTTP_ERROR",
        data.details || data.detail
      );
    }

    return data as APIResponse<T>;
  } catch (err: any) {
    if (err instanceof APIError) {
      throw err;
    }
    throw new APIError(err.message || "Network connection error", 500, "NETWORK_ERROR");
  }
}

// 1. Auth API
export const authApi = {
  login: async (identifier: string, password: string) => {
    const res = await fetchApi<{
      access_token: string;
      refresh_token: string;
      user_id: string;
      role: string;
      name: string;
      phone: string;
      email?: string;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
    return res.data;
  },

  refreshToken: async (refreshToken: string) => {
    const res = await fetchApi<{
      access_token: string;
      refresh_token: string;
      user_id: string;
      role: string;
      name: string;
      phone: string;
      email?: string;
    }>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    return res.data;
  },

  getMe: async () => {
    const res = await fetchApi<{
      id: string;
      name: string;
      phone: string;
      email?: string;
      role: string;
      is_active: boolean;
      created_at?: string;
    }>("/auth/me");
    return res.data;
  },
};

// 2. Admin API
export const adminApi = {
  getDashboardStats: async () => {
    const res = await fetchApi<{
      total_users: number;
      total_doctors: number;
      active_doctors: number;
      pending_doctor_verifications: number;
      total_appointments: number;
      completed_consultations: number;
      total_orders: number;
      total_revenue_bdt: number;
    }>("/admin/dashboard/stats");
    return res.data;
  },

  createDoctor: async (payload: {
    name: string;
    phone: string;
    email: string;
    password?: string;
    bmdc_reg_number: string;
    specialties: string[];
    qualifications: string[];
    experience_years: number;
    consultation_fee: number;
    bio?: string;
    avatar_url?: string;
    verification_documents?: Array<{
      document_type: string;
      document_url: string;
    }>;
  }) => {
    const res = await fetchApi<{
      id: string;
      user_id: string;
      name: string;
      bmdc_reg_number: string;
      is_verified: boolean;
      is_active: boolean;
    }>("/admin/doctors", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  listDoctors: async (params: { verification_status?: string; is_active?: boolean; search?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params.verification_status) query.append("verification_status", params.verification_status);
    if (params.is_active !== undefined) query.append("is_active", String(params.is_active));
    if (params.search) query.append("search", params.search);
    if (params.page) query.append("page", String(params.page));
    if (params.limit) query.append("limit", String(params.limit));

    const res = await fetchApi<PaginatedData<{
      id: string;
      user_id: string;
      name: string;
      phone: string;
      email?: string;
      avatar_url?: string;
      bmdc_reg_number: string;
      specialties: string[];
      qualifications: string[];
      experience_years: number;
      consultation_fee: number;
      bio?: string;
      is_verified: boolean;
      verification_status: string;
      is_active: boolean;
      rating: number;
      total_consultations: number;
      verification_documents?: Array<{
        document_type: string;
        document_url: string;
        uploaded_at?: string;
      }>;
      created_at?: string;
    }>>(`/admin/doctors?${query.toString()}`);
    return res.data;
  },

  updateDoctor: async (doctorId: string, payload: {
    name?: string;
    phone?: string;
    email?: string;
    avatar_url?: string;
    bmdc_reg_number?: string;
    specialties?: string[];
    qualifications?: string[];
    experience_years?: number;
    consultation_fee?: number;
    bio?: string;
    verification_documents?: Array<{
      document_type: string;
      document_url: string;
    }>;
    is_active?: boolean;
    verification_status?: string;
  }) => {
    const res = await fetchApi(`/admin/doctors/${doctorId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  deleteDoctor: async (doctorId: string) => {
    const res = await fetchApi(`/admin/doctors/${doctorId}`, {
      method: "DELETE",
    });
    return res.data;
  },

  verifyDoctor: async (doctorId: string, status: "VERIFIED" | "REJECTED", rejectionReason?: string) => {
    const res = await fetchApi(`/admin/doctors/${doctorId}/verify`, {
      method: "POST",
      body: JSON.stringify({ status, rejection_reason: rejectionReason }),
    });
    return res.data;
  },

  updateDoctorStatus: async (doctorId: string, isActive: boolean) => {
    const res = await fetchApi(`/admin/doctors/${doctorId}/status`, {
      method: "PUT",
      body: JSON.stringify({ is_active: isActive }),
    });
    return res.data;
  },

  // User Management
  listUsers: async (params: {
    role?: string;
    is_active?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params.role && params.role !== "ALL") query.append("role", params.role);
    if (params.is_active !== undefined) query.append("is_active", String(params.is_active));
    if (params.search) query.append("search", params.search);
    if (params.page) query.append("page", String(params.page));
    if (params.limit) query.append("limit", String(params.limit));

    const res = await fetchApi<PaginatedData<{
      id: string;
      name: string;
      phone: string;
      email?: string;
      role: string;
      avatar_url?: string;
      is_active: boolean;
      is_verified: boolean;
      created_at?: string;
      updated_at?: string;
      last_login_at?: string;
    }>>(`/admin/users?${query.toString()}`);
    return res.data;
  },

  getUsersStats: async () => {
    const res = await fetchApi<{
      total_users: number;
      active_users: number;
      total_regular_users: number;
      total_doctors: number;
      total_nurses: number;
      total_admins: number;
    }>("/admin/users/stats");
    return res.data;
  },

  getUser: async (userId: string) => {
    const res = await fetchApi<{
      id: string;
      name: string;
      phone: string;
      email?: string;
      role: string;
      avatar_url?: string;
      is_active: boolean;
      is_verified: boolean;
      created_at?: string;
      updated_at?: string;
      last_login_at?: string;
    }>(`/admin/users/${userId}`);
    return res.data;
  },

  createUser: async (payload: {
    name: string;
    phone: string;
    email: string;
    role: string;
    password?: string;
    avatar_url?: string;
    is_active?: boolean;
  }) => {
    const res = await fetchApi<{
      id: string;
      name: string;
      phone: string;
      email?: string;
      role: string;
      avatar_url?: string;
      is_active: boolean;
      is_verified: boolean;
      created_at?: string;
    }>("/admin/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  updateUser: async (userId: string, payload: {
    name?: string;
    phone?: string;
    email?: string;
    role?: string;
    avatar_url?: string;
    is_active?: boolean;
  }) => {
    const res = await fetchApi<{
      id: string;
      name: string;
      phone: string;
      email?: string;
      role: string;
      avatar_url?: string;
      is_active: boolean;
      is_verified: boolean;
      updated_at?: string;
    }>(`/admin/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  softDeleteUser: async (userId: string) => {
    const res = await fetchApi<{
      id: string;
      name: string;
      is_active: boolean;
      is_deleted: boolean;
    }>(`/admin/users/${userId}`, {
      method: "DELETE",
    });
    return res.data;
  },

  sendPasswordRecovery: async (userId: string) => {
    const res = await fetchApi<{
      message: string;
      email: string;
    }>(`/admin/users/${userId}/recover-password`, {
      method: "POST",
    });
    return res.data;
  },

  getAuditLogs: async (page = 1, limit = 50) => {
    const res = await fetchApi<PaginatedData<{
      id?: string;
      user_id?: string;
      action: string;
      target_type: string;
      target_id?: string;
      details?: Record<string, any>;
      ip_address?: string;
      created_at: string;
    }>>(`/admin/audit-logs?page=${page}&limit=${limit}`);
    return res.data;
  },
};

// 4. Orders API
export const ordersApi = {
  listAllOrders: async (page = 1, limit = 20, status?: string) => {
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) query.append("status", status);
    const res = await fetchApi<PaginatedData<{
      id: string;
      order_number: string;
      user_id: string;
      user_name: string;
      user_phone: string;
      total_amount: number;
      status: string;
      created_at?: string;
      items: Array<{
        name: string;
        quantity: number;
        unit_price: number;
        total_price: number;
      }>;
    }>>(`/orders/admin/all?${query.toString()}`);
    return res.data;
  },

  updateOrderStatus: async (orderId: string, status: string, trackingNote?: string) => {
    const res = await fetchApi(`/orders/${orderId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status, tracking_note: trackingNote }),
    });
    return res.data;
  },
};

// 5. Media & Cloudinary CDN API
export const mediaApi = {
  uploadDoctorDocument: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const token = getStoredToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/media/doctor-document`, {
      method: "POST",
      headers,
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Document upload to Cloudinary failed");
    return data.data as {
      public_id: string;
      secure_url: string;
      url: string;
      format: string;
      bytes: number;
      original_filename: string;
      folder: string;
    };
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const token = getStoredToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/media/avatar`, {
      method: "POST",
      headers,
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Avatar upload to Cloudinary CDN failed");
    return data.data as {
      public_id: string;
      secure_url: string;
      url: string;
      format: string;
      bytes: number;
      original_filename: string;
      folder: string;
    };
  },

  uploadFile: async (file: File, folder: string = "meditouch/general") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    const token = getStoredToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/media/upload`, {
      method: "POST",
      headers,
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Upload to Cloudinary CDN failed");
    return data.data as {
      public_id: string;
      secure_url: string;
      url: string;
      format: string;
      bytes: number;
      original_filename: string;
      folder: string;
    };
  },

  listAssets: async (params: {
    folder?: string;
    resource_type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params.folder) query.append("folder", params.folder);
    if (params.resource_type) query.append("resource_type", params.resource_type);
    if (params.search) query.append("search", params.search);
    if (params.page) query.append("page", String(params.page));
    if (params.limit) query.append("limit", String(params.limit));

    const res = await fetchApi<PaginatedData<{
      id: string;
      public_id: string;
      secure_url: string;
      url: string;
      format: string;
      resource_type: string;
      bytes: number;
      original_filename: string;
      folder: string;
      uploader_id?: string;
      created_at?: string;
    }>>(`/media/assets?${query.toString()}`);
    return res.data;
  },

  getStats: async () => {
    const res = await fetchApi<{
      total_assets: number;
      total_bytes: number;
      total_images: number;
      total_documents: number;
      storage_used_formatted: string;
      cloud_name: string;
      is_configured: boolean;
      folders: Array<{
        folder: string;
        count: number;
        bytes: number;
      }>;
    }>("/media/stats");
    return res.data;
  },

  deleteAsset: async (assetId: string) => {
    const res = await fetchApi(`/media/assets/${assetId}`, {
      method: "DELETE",
    });
    return res.data;
  },
};

// 7. E-Pharmacy & MedEasy Crawler API
export interface UnitPriceItem {
  id?: any;
  unit: string;
  unit_size: number;
  price: number;
}

export interface MedicineItem {
  id: string;
  medeasy_id?: number;
  medicine_name?: string;
  name?: string;
  brand: string;
  generic_name: string;
  strength: string;
  dosage_form: string;
  category?: string;
  category_name?: string;
  category_slug?: string;
  slug?: string;
  manufacturer: string;
  manufacturer_name?: string;
  manufacturer_slug?: string;
  unit_price: number;
  pack_size: string;
  unit_prices: UnitPriceItem[];
  discount_type?: string;
  discount_value: number;
  is_discountable: boolean;
  is_available: boolean;
  rx_required: boolean;
  requires_prescription: boolean;
  medicine_image?: string;
  description?: string;
  in_stock: boolean;
  stock_count: number;
  is_active: boolean;
  source?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MedicineDetailData {
  id?: string;
  medicine_id?: string;
  slug: string;
  medicine_name: string;
  generic_name: string;
  category_name?: string;
  category_slug?: string;
  manufacturer_name?: string;
  meta_title?: string;
  meta_description?: string;
  product_info?: any;
  medicine_details?: Record<string, string>;
  related_medicines?: any[];
  created_at?: string;
  updated_at?: string;
}

export interface CrawlerSettings {
  api_base_url: string;
  next_data_base_url: string;
  session_id: string;
  category_slug: string;
  category_name: string;
  rate_limit_delay_seconds: number;
  max_pages?: number | null;
  updated_at?: string;
}

export interface CrawlerStatus {
  job_id?: string | null;
  is_running: boolean;
  status: string;
  category_slug: string;
  current_page: number;
  total_pages: number;
  total_products_found: number;
  inserted_count: number;
  skipped_count: number;
  failed_count: number;
  started_at?: string | null;
  finished_at?: string | null;
  logs: string[];
}

export interface PharmacyStats {
  total_medicines: number;
  in_stock_medicines: number;
  total_categories: number;
  total_manufacturers: number;
  last_crawled_at?: string | null;
  crawler_status: string;
}

export const pharmacyApi = {
  listMedicines: async (params: {
    search?: string;
    generic_name?: string;
    category?: string;
    category_slug?: string;
    category_name?: string;
    requires_prescription?: boolean;
    in_stock_only?: boolean;
    min_price?: number;
    max_price?: number;
    manufacturer?: string;
    sort_by?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.generic_name) query.append("generic_name", params.generic_name);
    if (params.category) query.append("category", params.category);
    if (params.category_slug) query.append("category_slug", params.category_slug);
    if (params.category_name) query.append("category_name", params.category_name);
    if (params.requires_prescription !== undefined) query.append("requires_prescription", String(params.requires_prescription));
    if (params.in_stock_only !== undefined) query.append("in_stock_only", String(params.in_stock_only));
    if (params.min_price !== undefined) query.append("min_price", String(params.min_price));
    if (params.max_price !== undefined) query.append("max_price", String(params.max_price));
    if (params.manufacturer) query.append("manufacturer", params.manufacturer);
    if (params.sort_by) query.append("sort_by", params.sort_by);
    if (params.page) query.append("page", String(params.page));
    if (params.limit) query.append("limit", String(params.limit));

    const res = await fetchApi<PaginatedData<MedicineItem>>(`/pharmacy/medicines?${query.toString()}`);
    return res.data;
  },

  getMedicine: async (slugOrId: string) => {
    const res = await fetchApi<MedicineItem>(`/pharmacy/medicines/${slugOrId}`);
    return res.data;
  },

  getMedicineDetails: async (slug: string) => {
    const res = await fetchApi<MedicineDetailData>(`/pharmacy/medicines/${slug}/details`);
    return res.data;
  },

  getCategories: async () => {
    const res = await fetchApi<Array<{ category: string; count: number }>>("/pharmacy/categories");
    return res.data;
  },

  getStats: async () => {
    const res = await fetchApi<PharmacyStats>("/pharmacy/stats");
    return res.data;
  },

  getCrawlerSettings: async () => {
    const res = await fetchApi<CrawlerSettings>("/pharmacy/crawler/settings");
    return res.data;
  },

  updateCrawlerSettings: async (payload: Partial<CrawlerSettings>) => {
    const res = await fetchApi<CrawlerSettings>("/pharmacy/crawler/settings", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  startCrawler: async (payload?: { category_slug?: string; start_page?: number; max_pages?: number }) => {
    const res = await fetchApi<CrawlerStatus>("/pharmacy/crawler/start", {
      method: "POST",
      body: JSON.stringify(payload || {}),
    });
    return res.data;
  },

  stopCrawler: async () => {
    const res = await fetchApi<CrawlerStatus>("/pharmacy/crawler/stop", {
      method: "POST",
    });
    return res.data;
  },

  getCrawlerStatus: async () => {
    const res = await fetchApi<CrawlerStatus>("/pharmacy/crawler/status");
    return res.data;
  },

  getCrawlerHistory: async () => {
    const res = await fetchApi<any[]>("/pharmacy/crawler/history");
    return res.data;
  },

  deleteMedicine: async (idOrSlug: string) => {
    const res = await fetchApi<{ deleted: boolean }>(`/pharmacy/admin/medicines/${idOrSlug}`, {
      method: "DELETE",
    });
    return res.data;
  },

  deleteMedicinesBulk: async (ids: string[]) => {
    const res = await fetchApi<{ deleted_count: number }>("/pharmacy/admin/medicines/bulk-delete", {
      method: "POST",
      body: JSON.stringify(ids),
    });
    return res.data;
  },
};

