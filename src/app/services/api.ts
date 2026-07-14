import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://ndeko-backend-dev.onrender.com';
const REQUEST_TIMEOUT_MS = 15000;

export type UploadContext = 'product' | 'store-logo' | 'store-banner' | 'avatar';

// ── Session Expiry Event ──────────────────────────────────────────────────────
// export const SESSION_EXPIRED_EVENT = 'session_expired';

// ── User Role Enum ────────────────────────────────────────────────────────────
export enum UserRole {
  BUYER = 'buyer',
  SELLER = 'seller',
  ADMIN = 'admin',
}

// // ── Token Management ──────────────────────────────────────────────────────────
// let _accessToken: string | null = localStorage.getItem('ndeko_access_token');
// let _refreshToken: string | null = localStorage.getItem('ndeko_refresh_token');
// let _user: AuthUser | null = null;

// try {
//   const stored = localStorage.getItem('ndeko_user');
//   _user = stored ? JSON.parse(stored) : null;
// } catch {
//   _user = null;
// }

// export const tokenStore = {
//   getAccess: () => _accessToken,
//   setAccess: (t: string) => {
//     _accessToken = t;
//     localStorage.setItem('ndeko_access_token', t);
//   },
//   getRefresh: () => _refreshToken,
//   setRefresh: (t: string) => {
//     _refreshToken = t;
//     localStorage.setItem('ndeko_refresh_token', t);
//   },
//   getUser: () => _user,
//   setUser: (u: AuthUser) => {
//     _user = u;
//     localStorage.setItem('ndeko_user', JSON.stringify(u));
//   },
//   clear: () => {
//     _accessToken = null;
//     _refreshToken = null;
//     _user = null;
//     localStorage.removeItem('ndeko_access_token');
//     localStorage.removeItem('ndeko_refresh_token');
//     localStorage.removeItem('ndeko_user');
//   },
// };


let _accessToken: string | null = localStorage.getItem('ndeko_access_token');

export const tokenStore = {
  getAccess: () => _accessToken,
  setAccess: (t: string) => { _accessToken = t; localStorage.setItem('ndeko_access_token', t); },

  getRefresh: () => localStorage.getItem('ndeko_refresh_token'),
  setRefresh: (t: string) => localStorage.setItem('ndeko_refresh_token', t),

  getUser: (): AuthUser | null => {
    try {
      const raw = localStorage.getItem('ndeko_user');
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  },
  setUser: (u: AuthUser) => localStorage.setItem('ndeko_user', JSON.stringify(u)),

  clear: () => {
    _accessToken = null;
    localStorage.removeItem('ndeko_access_token');
    localStorage.removeItem('ndeko_refresh_token');
    localStorage.removeItem('ndeko_user');
  },
};

export const SESSION_EXPIRED_EVENT = 'ndeko:session_expired';
export function dispatchSessionExpired() {
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
}



// ── API Error Class ──────────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown = null,
    public meta?: { endpoint: string; timestamp: number }
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ── Types ────────────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

interface AuthApiEnvelope {
  success: boolean;
  message: string;
  data: AuthResponse;
}

export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  name?: string;
  phone?: string;
  avatar_url?: string;
  role: 'buyer' | 'seller' | 'admin';
  is_email_verified: boolean;
  created_at: string;
}

export interface LocationStock {
  location_id: string;
  quantity: number;
  // Present on the single-product detail response (GET /products/:productId) —
  // not confirmed present on list endpoints, so keep optional.
  branch_name?: string;
  street?: string;
  city?: string;
  state?: string;
}

export interface ApiProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  discount_price?: number | null;
  stock_quantity: number;
  total_sold?: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'reserved';
  images: string[];
  sku: string;
  is_active: boolean;
  category?: { id: string; name: string; slug: string };
  store?: { id: string; store_name: string };
  average_rating?: number;
  review_count?: number;
  location_stock?: LocationStock[];
  created_at: string;
}

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

export type OrderStatus = 'pending' | 'processing' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type OrderPaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type OrderPaymentMethod = 'card' | 'bank_transfer' | 'pay_on_delivery';

export interface ApiOrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  fulfillment_location_id?: string;
  product?: { id: string; name: string; sku?: string; images?: string[] };
  fulfillment_location?: { id: string; branch_name: string };
}

// CustomerOrder model field is `order_reference` — there is no `order_number`
// column anywhere in the backend schema (confirmed against the Orders Module
// reference). Buyer-facing endpoints (checkout, getMyOrders, getOrder) all
// share this shape.
export interface ApiOrder {
  id: string;
  order_reference: string;
  store_id?: string;
  status: OrderStatus;
  payment_status: OrderPaymentStatus;
  payment_method: OrderPaymentMethod;
  payment_url?: string;
  payment_reference?: string;
  subtotal?: number;
  delivery_fee?: number;
  total_amount: number;
  delivery_address_snapshot?: { label?: string; street?: string; city?: string; state?: string; country?: string };
  created_at: string;
  updated_at?: string;
  items?: ApiOrderItem[];
}

// Shape actually returned by GET /orders/stores/:storeId (getStoreOrders) —
// a lighter-weight list projection than ApiOrder (buyer-facing endpoints),
// using items_count instead of a full items array.
// payment_method/payment_status are NOT confirmed present on this endpoint's
// projection — treat as optional until the backend confirms/adds them.
export interface StoreOrderSummary {
  id: string;
  order_reference: string;
  // email not confirmed present on this endpoint's projection — optional/defensive.
  buyer?: { id: string; first_name?: string; last_name?: string; email?: string };
  items_count: number;
  total_amount: number;
  status: OrderStatus;
  payment_status?: OrderPaymentStatus;
  payment_method?: OrderPaymentMethod;
  created_at: string;
}

export interface StoreOrderDetailItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  fulfillment_location_id?: string;
  product?: { id: string; name: string; sku?: string; images?: string[] };
  fulfillment_location?: { id: string; branch_name: string };
}

// Shape returned by GET /orders/stores/:storeId/:orderId (getStoreOrderDetail) —
// full order detail, including buyer contact info and per-item fulfillment location.
export interface StoreOrderDetail {
  id: string;
  order_reference: string;
  buyer?: { id: string; first_name?: string; last_name?: string; email?: string; phone?: string };
  items: StoreOrderDetailItem[];
  // Part of the CustomerOrder model (delivery_address_snapshot jsonb) — not
  // explicitly re-confirmed for this endpoint, treat as possibly absent.
  delivery_address_snapshot?: { label?: string; street?: string; city?: string; state?: string; country?: string };
  subtotal?: number;
  delivery_fee?: number;
  total_amount: number;
  payment_method?: OrderPaymentMethod;
  payment_status?: OrderPaymentStatus;
  status: OrderStatus;
  created_at: string;
}

export interface ApiAddress {
  id: string;
  label: string;
  recipient_name?: string;
  recipient_phone?: string;
  street: string;
  city: string;
  state: string;
  country?: string;
  is_default: boolean;
}

export interface CheckoutBody {
  // location_id is required per item — the exact branch to fulfill from, no auto-fallback.
  items: Array<{ product_id: string; location_id: string; quantity: number }>;
  delivery_address: {
    label?: 'home' | 'work' | 'other';
    recipient_name?: string;
    recipient_phone?: string;
    street: string;
    city: string;
    state: string;
    country?: string;
  };
  payment_method: 'card' | 'bank_transfer' | 'pay_on_delivery';
  notes?: string;
  promo_code?: string;
}

export interface RegisterBody {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  business_name?: string;
}

export interface ApiStore {
  id: string;
  store_name: string;
  store_slug: string;
  store_tagline?: string;
  description?: string;
  status?: 'active' | 'pending' | 'suspended';
  average_rating?: number;
  city?: string;
  state?: string;
  area?: string;
  address?: string;
  logo_url?: string;
  banner_url?: string;
  whatsapp_number?: string;
  return_policy?: string;
  shipping_policy?: string;
  category?: { id: string; name: string; slug: string } | string;
  locations?: ApiStoreLocation[];
  created_at: string;
}

export interface ApiStoreLocation {
  id: string;
  store_id: string;
  branch_name: string;
  street: string;
  city: string;
  state?: string;
  phone: string;
  email?: string;
  branch_manager?: string;
  opening_hours?: string;
  is_primary: boolean;
  created_at: string;
}

export interface StoreLocationBody {
  branch_name: string;
  street: string;
  city: string;
  phone: string;
  state?: string;
  email?: string;
  branch_manager?: string;
  opening_hours?: string;
  is_primary?: boolean;
}

export interface StoreProductStats {
  total_products: number;
  inventory_value: number;
  low_stock: number;
  out_of_stock: number;
  active_products: number;
}

export interface WishlistItem {
  id: string;
  product_id: string;
  product: ApiProduct;
  created_at: string;
}

export interface ApiReview {
  id: string;
  product_id: string;
  rating: number;
  comment?: string;
  reviewer?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  is_verified_purchase: boolean;
  created_at: string;
}

export interface ReviewSummary {
  avg_rating: number;
  total_reviews: number;
  verified_count?: number;
  breakdown?: Record<string, number>;
}

// ── Account Preferences / Payments / Wallet Types ─────────────────────────────
export interface AddressBody {
  label: string;
  recipient_name?: string;
  recipient_phone?: string;
  street: string;
  city: string;
  state: string;
  country?: string;
}

export interface NotificationPreferences {
  order_updates: boolean;
  promotions: boolean;
  news_and_tips: boolean;
  account_activity: boolean;
}

export interface SavedPaymentMethod {
  id: string;
  type: 'card' | 'bank_transfer';
  last_four: string;
  brand?: string;
  exp_month?: number;
  exp_year?: number;
  account_number?: string;
  bank_name?: string;
  is_default: boolean;
  created_at: string;
}

export interface WalletData {
  balance: number;
  currency: string;
  total_earned: number;
  total_withdrawn: number;
  pending_withdrawal?: number;
}

export interface BankDetails {
  account_name: string;
  account_number: string;
  bank_name: string;
  bank_code: string;
}

export type Product = ApiProduct;

// ── Axios Instance ───────────────────────────────────────────────────────────
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor ──────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStore.getAccess();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

// ── Response Interceptor ─────────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response: any) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            tokenStore.clear();
            dispatchSessionExpired();
            return Promise.reject(err);
          });
      }

      isRefreshing = true;
      originalRequest._retry = true;

      try {
        const refreshToken = tokenStore.getRefresh();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post<AuthTokens>(
          `${BASE_URL}/api/v1/auth/refresh`,
          { refresh_token: refreshToken },
          { timeout: REQUEST_TIMEOUT_MS }
        );

        const { access_token, refresh_token } = response.data;
        tokenStore.setAccess(access_token);
        if (refresh_token) {
          tokenStore.setRefresh(refresh_token);
        }

        apiClient.defaults.headers.common.Authorization = `Bearer ${access_token}`;
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        processQueue(null, access_token);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        isRefreshing = false;
        tokenStore.clear();
        dispatchSessionExpired();
        return Promise.reject(err);
      }
    }

    if (error.response?.status === 403) {
      tokenStore.clear();
      dispatchSessionExpired();
    }

    return Promise.reject(error);
  }
);

// ── Helper Functions ─────────────────────────────────────────────────────────
function handleError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as any;
    // Some endpoints (e.g. checkout's INSUFFICIENT_STOCK) put the human message
    // under `error` rather than `message` — check both before falling back.
    const message = data?.message || data?.error || error.message || 'API request failed';
    const status = error.response?.status || 0;
    throw new ApiError(message, status, data);
  }
  throw new ApiError(error instanceof Error ? error.message : 'Unknown error', 0);
}

// ── Authentication Endpoints ──────────────────────────────────────────────────
export const loginUser = async (body: { email: string; password: string }): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthApiEnvelope>('/api/v1/auth/login', body);
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const registerUser = async (body: RegisterBody): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthApiEnvelope>('/api/v1/auth/register', body);
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await apiClient.post('/api/v1/auth/logout');
  } catch (error) {
    // Ignore errors on logout
  } finally {
    tokenStore.clear();
  }
};

export const googleAuth = async (body: { id_token: string; role?: UserRole }): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthApiEnvelope>('/api/v1/auth/google', body);
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const refreshTokenFn = async (refreshToken: string): Promise<AuthTokens> => {
  try {
    const response = await apiClient.post<AuthTokens>('/api/v1/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const verifyEmail = async (token: string): Promise<any> => {
  try {
    const response = await apiClient.post('/api/v1/auth/verify-email', { token });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const forgotPassword = async (email: string): Promise<any> => {
  try {
    const response = await apiClient.post('/api/v1/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const resetPassword = async (body: {
  email: string;
  otp: string;
  password: string;
}): Promise<any> => {
  try {
    const response = await apiClient.post('/api/v1/auth/reset-password', body);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// ── User Endpoints ────────────────────────────────────────────────────────────
export const getMe = async (): Promise<AuthUser> => {
  try {
    const response = await apiClient.get<{ data: AuthUser }>('/api/v1/users/me');
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const updateProfile = async (data: Partial<AuthUser>): Promise<AuthUser> => {
  try {
    const response = await apiClient.put<{ data: AuthUser }>('/api/v1/users/me', data);
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<any> => {
  try {
    const response = await apiClient.patch('/api/v1/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const deleteAccount = async (): Promise<any> => {
  try {
    const response = await apiClient.delete('/api/v1/users/me');
    tokenStore.clear();
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// ── Account Preferences Endpoints ────────────────────────────────────────────
export const updateMe = async (data: Partial<AuthUser>): Promise<AuthUser> => {
  return updateProfile(data);
};

export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  try {
    const response = await apiClient.get<{ data: NotificationPreferences }>(
      '/api/v1/users/me/preferences/notifications'
    );
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const updateNotificationPreferences = async (
  data: Partial<NotificationPreferences>
): Promise<NotificationPreferences> => {
  try {
    const response = await apiClient.put<{ data: NotificationPreferences }>(
      '/api/v1/users/me/preferences/notifications',
      data
    );
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

// ── Payment Methods Endpoints ────────────────────────────────────────────────
export const getSavedPaymentMethods = async (): Promise<SavedPaymentMethod[]> => {
  try {
    const response = await apiClient.get<{ data: SavedPaymentMethod[] }>(
      '/api/v1/users/me/payment-methods'
    );
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const deleteSavedPaymentMethod = async (methodId: string): Promise<any> => {
  try {
    const response = await apiClient.delete(`/api/v1/users/me/payment-methods/${methodId}`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const setDefaultPaymentMethod = async (methodId: string): Promise<SavedPaymentMethod> => {
  try {
    const response = await apiClient.patch<{ data: SavedPaymentMethod }>(
      `/api/v1/users/me/payment-methods/${methodId}/default`
    );
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const initiateAddPaymentMethod = async (
  type: 'card' | 'bank_transfer',
  data?: any
): Promise<any> => {
  try {
    const response = await apiClient.post('/api/v1/users/me/payment-methods/initiate', {
      type,
      ...data,
    });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// ── Wallet & Payout Endpoints ────────────────────────────────────────────────
export const getWallet = async (): Promise<WalletData> => {
  try {
    const response = await apiClient.get<{ data: WalletData }>(
      '/api/v1/users/me/wallet'
    );
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const saveBankDetails = async (data: BankDetails): Promise<BankDetails> => {
  try {
    const response = await apiClient.post<{ data: BankDetails }>(
      '/api/v1/users/me/bank-details',
      data
    );
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const withdraw = async (amount: number, bank_detail_id?: string): Promise<any> => {
  try {
    const response = await apiClient.post('/api/v1/users/me/withdraw', {
      amount,
      ...(bank_detail_id ? { bank_detail_id } : {}),
    });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// ── Address Endpoints ─────────────────────────────────────────────────────────
export const getMyAddresses = async (): Promise<ApiAddress[]> => {
  try {
    const response = await apiClient.get<{ data: ApiAddress[] }>('/api/v1/users/me/addresses');
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const createAddress = async (data: Omit<ApiAddress, 'id'>): Promise<ApiAddress> => {
  try {
    const response = await apiClient.post<{ data: ApiAddress }>('/api/v1/users/me/addresses', data);
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const updateAddress = async (addressId: string, data: Partial<ApiAddress>): Promise<ApiAddress> => {
  try {
    const response = await apiClient.put<{ data: ApiAddress }>(
      `/api/v1/users/me/addresses/${addressId}`,
      data
    );
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const deleteAddress = async (addressId: string): Promise<any> => {
  try {
    const response = await apiClient.delete(`/api/v1/users/me/addresses/${addressId}`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const setDefaultAddress = async (addressId: string): Promise<ApiAddress> => {
  try {
    const response = await apiClient.patch<{ data: ApiAddress }>(
      `/api/v1/users/me/addresses/${addressId}/default`
    );
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

// ── Product Endpoints ─────────────────────────────────────────────────────────
export const fetchProducts = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  store_id?: string;
  min_price?: number;
  max_price?: number;
}): Promise<PaginatedResponse<ApiProduct>> => {
  try {
    const response = await apiClient.get<PaginatedResponse<ApiProduct>>(
      '/api/v1/products',
      { params }
    );
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const fetchProductById = async (id: string): Promise<ApiProduct> => {
  try {
    const response = await apiClient.get<{ data: ApiProduct }>(`/api/v1/products/${id}`);
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const fetchProductsByIds = async (ids: string[]): Promise<ApiProduct[]> => {
  try {
    const response = await apiClient.post<{ data: ApiProduct[] }>('/api/v1/products/batch', {
      ids,
    });
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const searchProducts = async (query: string, limit = 10): Promise<PaginatedResponse<ApiProduct>> => {
  try {
    const response = await apiClient.get<PaginatedResponse<ApiProduct>>(
      '/api/v1/products/search',
      { params: { q: query, limit } }
    );
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// ── Categories Endpoints ──────────────────────────────────────────────────────
export const fetchCategories = async (params?: { limit?: number; page?: number }): Promise<PaginatedResponse<ApiCategory>> => {
  try {
    const response = await apiClient.get<PaginatedResponse<ApiCategory>>(
      '/api/v1/categories',
      { params }
    );
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// ── Orders Endpoints ──────────────────────────────────────────────────────────
// Response `data` is an array — one order per store touched (a cart spanning
// stores splits into multiple orders, each with its own payment_url if any).
export const checkout = async (data: CheckoutBody): Promise<ApiOrder[]> => {
  try {
    const response = await apiClient.post<{ data: ApiOrder[] }>('/api/v1/orders/checkout', data);
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const getMyOrders = async (page = 1, limit = 20): Promise<PaginatedResponse<ApiOrder>> => {
  try {
    // List endpoints wrap results in `meta: {page, limit, total, totalPages}`,
    // not the flat {data, total, page, limit} shape (same fix as getStoreOrders).
    const response = await apiClient.get<{
      data: ApiOrder[];
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>('/api/v1/orders/my', { params: { page, limit } });
    return {
      data: response.data.data ?? [],
      total: response.data.meta?.total ?? 0,
      page: response.data.meta?.page ?? page,
      limit: response.data.meta?.limit ?? limit,
    };
  } catch (error) {
    handleError(error);
  }
};

export const getOrder = async (orderId: string): Promise<ApiOrder> => {
  try {
    const response = await apiClient.get<{ data: ApiOrder }>(`/api/v1/orders/my/${orderId}`);
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const cancelOrder = async (orderId: string): Promise<ApiOrder> => {
  try {
    const response = await apiClient.patch<{ data: ApiOrder }>(
      `/api/v1/orders/my/${orderId}/cancel`
    );
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

// ── Wishlist Endpoints ────────────────────────────────────────────────────────
export const getWishlist = async (page = 1, limit = 20): Promise<PaginatedResponse<WishlistItem>> => {
  try {
    const response = await apiClient.get<PaginatedResponse<WishlistItem>>(
      '/api/v1/wishlists',
      { params: { page, limit } }
    );
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const addToWishlist = async (productId: string): Promise<any> => {
  try {
    const response = await apiClient.post('/api/v1/wishlists', { product_id: productId });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const removeFromWishlist = async (productId: string): Promise<any> => {
  try {
    const response = await apiClient.delete(`/api/v1/wishlists/${productId}`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// ── Reviews Endpoints ─────────────────────────────────────────────────────────
export const getProductReviews = async (productId: string, page = 1, limit = 10): Promise<PaginatedResponse<ApiReview>> => {
  try {
    const response = await apiClient.get<PaginatedResponse<ApiReview>>(
      `/api/v1/reviews/products/${productId}`,
      { params: { page, limit } }
    );
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const fetchProductReviews = getProductReviews;

export const fetchProductReviewSummary = async (productId: string): Promise<ReviewSummary> => {
  try {
    const response = await apiClient.get<{ data: ReviewSummary }>(
      `/api/v1/reviews/products/${productId}/summary`
    );
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const addProductReview = async (
  productId: string,
  data: { rating: number; comment?: string }
): Promise<any> => {
  try {
    const response = await apiClient.post(`/api/v1/reviews/products/${productId}`, data);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// ── Business/Seller Endpoints ──────────────────────────────────────────────────

export interface StoreDashboard {
  scope: 'store' | 'location';
  location_id: string | null;
  revenue: number;
  orders: Record<string, number>;
  visitors: number;
  visitors_scope: 'store';
  active_products: number;
}

export interface RevenueSeriesPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface RevenueSeries {
  scope: 'store' | 'location';
  location_id: string | null;
  total_revenue: number;
  series: RevenueSeriesPoint[];
}

export interface VisitorSeriesPoint {
  date: string;
  count: number;
}

export interface VisitorStats {
  scope: 'store' | 'location';
  location_id?: string | null;
  total_visitors: number;
  series: VisitorSeriesPoint[];
}

export const getDashboard = async (): Promise<any> => {
  try {
    const store = await getMyBusiness();
    if (!store) throw new Error('No store found for this account');
    return await getStoreDashboard(store.id);
  } catch (error) {
    handleError(error);
  }
};

export interface TopProductEntry {
  id: string;
  name: string;
  sku: string;
  price: number;
  discount_price?: number | null;
  stock_quantity: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'reserved';
  category?: string;
  units_sold: number;
  revenue: number;
}

export interface TopProductsResponse {
  scope: 'store' | 'location';
  location_id: string | null;
  period: { from: string; to: string };
  products: TopProductEntry[];
}

// Ranked by revenue (delivered orders only) within [from, to) — confirmed shape.
export const getTopProducts = async (
  storeId: string,
  limit = 10,
  locationId?: string,
  from?: string,
  to?: string
): Promise<TopProductsResponse> => {
  try {
    const response = await apiClient.get<{ data: TopProductsResponse }>(
      `/api/v1/analytics/stores/${storeId}/top-products`,
      { params: { limit, location_id: locationId, from, to } }
    );
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const getStoreDashboard = async (
  storeId: string,
  locationId?: string,
  from?: string,
  to?: string
): Promise<StoreDashboard> => {
  try {
    const response = await apiClient.get<{ data: StoreDashboard }>(
      `/api/v1/analytics/stores/${storeId}/dashboard`,
      { params: { location_id: locationId, from, to } }
    );

    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const getRevenueSeries = async (
  storeId: string,
  locationId?: string,
  from?: string,
  to?: string
): Promise<RevenueSeries> => {
  try {
    const response = await apiClient.get<{ data: RevenueSeries }>(
      `/api/v1/analytics/stores/${storeId}/revenue-series`,
      { params: { location_id: locationId, from, to } }
    );
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const getVisitorStats = async (
  storeId: string,
  locationId?: string,
  from?: string,
  to?: string
): Promise<VisitorStats> => {
  try {
    const response = await apiClient.get<{ data: VisitorStats }>(
      `/api/v1/analytics/stores/${storeId}/visitors`,
      { params: { location_id: locationId, from, to } }
    );
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export interface StoreOverview {
  revenue: number;
  orders: number;
  avg_order_value: number;
  conversion_rate: number;
  deltas: {
    revenue: number | null;
    orders: number | null;
    avg_order_value: number | null;
    conversion_rate: number | null;
  };
}

export const getStoreOverview = async (
  storeId: string,
  months = 7,
  locationId?: string
): Promise<StoreOverview> => {
  try {
    const response = await apiClient.get<{ data: StoreOverview }>(
      `/api/v1/analytics/stores/${storeId}/overview`,
      { params: { months, location_id: locationId } }
    );
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export interface MonthlyRevenuePoint {
  month: string;
  label: string;
  revenue: number;
  orders: number;
}

export interface MonthlyRevenue {
  series: MonthlyRevenuePoint[];
  total_revenue: number;
  total_orders: number;
}

export const getMonthlyRevenue = async (
  storeId: string,
  months = 7,
  locationId?: string
): Promise<MonthlyRevenue> => {
  try {
    const response = await apiClient.get<{ data: MonthlyRevenue }>(
      `/api/v1/analytics/stores/${storeId}/monthly-revenue`,
      { params: { months, location_id: locationId } }
    );
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export interface SalesByCategoryEntry {
  name: string;
  revenue: number;
  percentage: number;
}

export interface SalesByCategory {
  total_revenue: number;
  categories: SalesByCategoryEntry[];
}

export const getSalesByCategory = async (
  storeId: string,
  from?: string,
  to?: string,
  locationId?: string
): Promise<SalesByCategory> => {
  try {
    const response = await apiClient.get<{ data: SalesByCategory }>(
      `/api/v1/analytics/stores/${storeId}/sales-by-category`,
      { params: { from, to, location_id: locationId } }
    );
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export interface OrderStats {
  scope: 'store' | 'location' | 'platform';
  total: number;
  total_revenue: number;
  total_delivery_fees: number;
  by_status: Record<string, number>;
}

export const getOrderStats = async (
  storeId: string,
  locationId?: string,
  from?: string,
  to?: string
): Promise<OrderStats> => {
  try {
    const response = await apiClient.get<{ data: OrderStats }>(
      '/api/v1/orders/stats',
      { params: { store_id: storeId, location_id: locationId, from, to } }
    );
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const getStoreOrders = async (
  storeId: string,
  page = 1,
  limit = 20
): Promise<PaginatedResponse<StoreOrderSummary>> => {
  try {
    // This endpoint wraps results in `meta: {page, limit, total, totalPages}`,
    // not the flat {data, total, page, limit} shape most other list endpoints use.
    const response = await apiClient.get<{
      data: StoreOrderSummary[];
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>(`/api/v1/orders/stores/${storeId}`, { params: { page, limit } });
    return {
      data: response.data.data ?? [],
      total: response.data.meta?.total ?? 0,
      page: response.data.meta?.page ?? page,
      limit: response.data.meta?.limit ?? limit,
    };
  } catch (error) {
    handleError(error);
  }
};

export const getStoreOrderDetail = async (storeId: string, orderId: string): Promise<StoreOrderDetail> => {
  try {
    const response = await apiClient.get<{ data: StoreOrderDetail }>(
      `/api/v1/orders/stores/${storeId}/${orderId}`
    );
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export interface ProductWriteBody {
  name?: string;
  description?: string;
  price?: number;
  discount_price?: number;
  cost_price?: number;
  category_id?: string;
  images?: string[];
  is_active?: boolean;
  stock_by_location?: LocationStock[];
}

export const getStoreProducts = async (
  storeId: string,
  page = 1,
  limit = 20,
  locationId?: string
): Promise<PaginatedResponse<ApiProduct>> => {
  try {
    const response = await apiClient.get<PaginatedResponse<ApiProduct>>(
      `/api/v1/products/stores/${storeId}`,
      { params: { page, limit, location_id: locationId } }
    );
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const createProduct = async (storeId: string, data: ProductWriteBody): Promise<ApiProduct> => {
  try {
    const response = await apiClient.post<{ data: ApiProduct }>(
      `/api/v1/products/stores/${storeId}`,
      data
    );
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const updateProduct = async (storeId: string, productId: string, data: ProductWriteBody): Promise<ApiProduct> => {
  try {
    const response = await apiClient.patch<{ data: ApiProduct }>(
      `/api/v1/products/stores/${storeId}/${productId}`,
      data
    );
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const deleteProduct = async (storeId: string, productId: string): Promise<any> => {
  try {
    const response = await apiClient.delete(`/api/v1/products/stores/${storeId}/${productId}`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const fetchStoreProductStats = async (storeId: string, locationId?: string): Promise<StoreProductStats> => {
  try {
    const response = await apiClient.get<{ data: StoreProductStats }>(
      `/api/v1/products/stores/${storeId}/stats`,
      { params: { location_id: locationId } }
    );
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

/**
 * Get the user's primary business/store.
 * Returns the first store if multiple exist, or null if none found.
 */
export const getMyBusiness = async (): Promise<ApiStore | null> => {
  try {
    const stores = await getMyStores();
    return stores && stores.length > 0 ? stores[0] : null;
  } catch (error) {
    handleError(error);
  }
};

export const getMyStores = async (): Promise<ApiStore[]> => {
  try {
    const response = await apiClient.get<{ data: ApiStore[] }>('/api/v1/stores/my');
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const createStore = async (data: any): Promise<ApiStore> => {
  try {
    const response = await apiClient.post<{ data: ApiStore }>('/api/v1/stores', data);
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const updateStore = async (storeId: string, data: Partial<ApiStore>): Promise<ApiStore> => {
  try {
    const response = await apiClient.put<{ data: ApiStore }>(
      `/api/v1/stores/${storeId}`,
      data
    );
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const getStoreLocations = async (storeId: string): Promise<ApiStoreLocation[]> => {
  try {
    const response = await apiClient.get<{ data: ApiStoreLocation[] }>(
      `/api/v1/stores/${storeId}/locations`
    );
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const createStoreLocation = async (storeId: string, data: StoreLocationBody): Promise<ApiStoreLocation> => {
  try {
    const response = await apiClient.post<{ data: ApiStoreLocation }>(
      `/api/v1/stores/${storeId}/locations`,
      data
    );
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const updateStoreLocation = async (storeId: string, locationId: string, data: Partial<StoreLocationBody>): Promise<ApiStoreLocation> => {
  try {
    const response = await apiClient.put<{ data: ApiStoreLocation }>(
      `/api/v1/stores/${storeId}/locations/${locationId}`,
      data
    );
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

const UPLOAD_TIMEOUT_MS = 60000;

interface UploadSignature {
  signature: string;
  timestamp: number;
  api_key: string;
  cloud_name: string;
  folder: string;
}

// Two-step direct upload: get a signed payload from our backend, then send the
// file straight to Cloudinary so large files never transit our server.
export const uploadImage = async (file: File, context: UploadContext): Promise<{ url: string }> => {
  let sig: UploadSignature;
  try {
    const response = await apiClient.post<{ data: UploadSignature }>(
      `/api/v1/uploads/signature?context=${encodeURIComponent(context)}`
    );
    sig = response.data.data;
  } catch (error) {
    handleError(error);
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('signature', sig.signature);
  formData.append('timestamp', String(sig.timestamp));
  formData.append('api_key', sig.api_key);
  formData.append('folder', sig.folder);

  try {
    // Plain axios (not apiClient): no Bearer token or refresh interceptors on
    // the cross-origin Cloudinary call.
    const response = await axios.post<{ secure_url: string }>(
      `https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`,
      formData,
      { timeout: UPLOAD_TIMEOUT_MS }
    );
    return { url: response.data.secure_url };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as { error?: { message?: string } } | undefined;
      throw new ApiError(data?.error?.message || 'Image upload failed', error.response?.status || 0, data);
    }
    throw new ApiError(error instanceof Error ? error.message : 'Image upload failed', 0);
  }
};

export const updateOrderStatus = async (orderId: string, status: string): Promise<ApiOrder> => {
  try {
    const response = await apiClient.patch<{ data: ApiOrder }>(
      `/api/v1/orders/${orderId}/status`,
      { status }
    );
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const fetchStoreReviews = async (
  storeId: string,
  page = 1,
  limit = 20
): Promise<PaginatedResponse<ApiReview>> => {
  try {
    const response = await apiClient.get<PaginatedResponse<ApiReview>>(
      `/api/v1/stores/${storeId}/reviews`,
      {
        params: { page, limit },
      }
    );

    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  status?: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export const getWalletTransactions = async (
  page = 1,
  limit = 20
): Promise<PaginatedResponse<WalletTransaction>> => {
  try {
    const response = await apiClient.get<PaginatedResponse<WalletTransaction>>(
      '/api/v1/users/me/wallet/transactions',
      {
        params: { page, limit },
      }
    );

    return response.data;
  } catch (error) {
    handleError(error);
  }
};




// ── Public Store Endpoints ────────────────────────────────────────────────────
/**
 * Fetch a public, buyer-facing list of stores (e.g. for the Vendor Marketplace
 * page). Unlike getMyStores(), this is not scoped to the authenticated
 * seller and does not require auth.
 */
export const fetchPublicStores = async (params?: {
  status?: 'active' | 'pending' | 'suspended';
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<ApiStore>> => {
  try {
    const response = await apiClient.get<PaginatedResponse<ApiStore>>(
      '/api/v1/stores',
      { params }
    );
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const fetchPublicStoreBySlug = async (slug: string): Promise<ApiStore> => {
  try {
    const response = await apiClient.get<{ data: ApiStore }>(`/api/v1/stores/${slug}`);
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

// ── Utility Functions ─────────────────────────────────────────────────────────
export function mapApiProduct(p: ApiProduct): any {
  const price = p.price ?? 0;
  const discountPrice = p.discount_price;
  const effectivePrice = discountPrice ?? price;

  return {
    id: p.id,
    name: p.name,
    price: effectivePrice,
    originalPrice: discountPrice ? price : undefined,
    image: p.images?.[0] || '/images/product-placeholder.webp',
    category: p.category?.slug ?? '',
    rating: p.average_rating ?? 0,
    reviews: p.review_count ?? 0,
    description: p.description,
    brand: p.store?.store_name ?? '',
    inStock: ['in_stock', 'low_stock'].includes(p.stock_status),
    discount: discountPrice && price ? Math.round((1 - discountPrice / price) * 100) : undefined,
    storeId: p.store?.id,
    locationStock: p.location_stock,
  };
}

export function setAuthToken(token: string | null) {
  if (token) {
    tokenStore.setAccess(token);
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    tokenStore.clear();
    delete apiClient.defaults.headers.common.Authorization;
  }
}

export default apiClient;