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
    const res = await fetch(url, {
      ...options,
      headers,
    });

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

  listDoctors: async (params: { verification_status?: string; is_active?: boolean; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params.verification_status) query.append("verification_status", params.verification_status);
    if (params.is_active !== undefined) query.append("is_active", String(params.is_active));
    if (params.page) query.append("page", String(params.page));
    if (params.limit) query.append("limit", String(params.limit));

    const res = await fetchApi<PaginatedData<{
      id: string;
      user_id: string;
      name: string;
      phone: string;
      email?: string;
      bmdc_reg_number: string;
      specialties: string[];
      qualifications: string[];
      experience_years: number;
      consultation_fee: number;
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

// 3. Pharmacy & Catalog API
export const pharmacyApi = {
  ingestMedEasy: async () => {
    const res = await fetchApi<{ count: number }>("/pharmacy/admin/ingest-medeasy", {
      method: "POST",
    });
    return res.data;
  },

  listMedicines: async (page = 1, limit = 20) => {
    const res = await fetchApi<PaginatedData<{
      id: string;
      name: string;
      brand: string;
      generic_name: string;
      strength: string;
      dosage_form: string;
      category: string;
      manufacturer: string;
      unit_price: number;
      pack_size: string;
      in_stock: boolean;
      stock_count: number;
    }>>(`/pharmacy/medicines?page=${page}&limit=${limit}`);
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

