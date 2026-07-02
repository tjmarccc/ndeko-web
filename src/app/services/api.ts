import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://ndeko-backend-dev.onrender.com';
const REQUEST_TIMEOUT_MS = 15000;

export type UploadContext = 'product' | 'store-logo' | 'store-banner' | 'profile-avatar';

// ── Session Expiry Event ──────────────────────────────────────────────────────
export const SESSION_EXPIRED_EVENT = 'session_expired';

// ── User Role Enum ────────────────────────────────────────────────────────────
export enum UserRole {
  BUYER = 'buyer',
  SELLER = 'seller',
  ADMIN = 'admin',
}

// ── Token Management ──────────────────────────────────────────────────────────
let _accessToken: string | null = localStorage.getItem('ndeko_token');
let _refreshToken: string | null = localStorage.getItem('ndeko_refresh_token');
let _user: AuthUser | null = null;

try {
  const stored = localStorage.getItem('ndeko_user');
  _user = stored ? JSON.parse(stored) : null;
} catch {
  _user = null;
}

export const tokenStore = {
  getAccess: () => _accessToken,
  setAccess: (t: string) => {
    _accessToken = t;
    localStorage.setItem('ndeko_token', t);
  },
  getRefresh: () => _refreshToken,
  setRefresh: (t: string) => {
    _refreshToken = t;
    localStorage.setItem('ndeko_refresh_token', t);
  },
  getUser: () => _user,
  setUser: (u: AuthUser) => {
    _user = u;
    localStorage.setItem('ndeko_user', JSON.stringify(u));
  },
  clear: () => {
    _accessToken = null;
    _refreshToken = null;
    _user = null;
    localStorage.removeItem('ndeko_token');
    localStorage.removeItem('ndeko_refresh_token');
    localStorage.removeItem('ndeko_user');
  },
};

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
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
    tokens: AuthTokens;
  };
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
  created_at: string;
}

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
}

export interface ApiOrder {
  id: string;
  order_number: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed';
  payment_method: string;
  payment_url?: string;
  total_amount: number;
  created_at: string;
  items?: Array<{ product_name: string; quantity: number; unit_price: number }>;
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
  items: Array<{ product_id: string; quantity: number }>;
  delivery_address: {
    recipient_name?: string;
    recipient_phone?: string;
    street: string;
    city: string;
    state: string;
    country?: string;
  };
  payment_method: 'card' | 'bank_transfer' | 'pay_on_delivery';
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
  store_tagline?: string;
  description?: string;
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
            window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
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
        window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
        return Promise.reject(err);
      }
    }

    if (error.response?.status === 403) {
      tokenStore.clear();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }

    return Promise.reject(error);
  }
);

// ── Helper Functions ─────────────────────────────────────────────────────────
function handleError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as any)?.message || error.message || 'API request failed';
    const status = error.response?.status || 0;
    throw new ApiError(message, status, error.response?.data);
  }
  throw new ApiError(error instanceof Error ? error.message : 'Unknown error', 0);
}

// ── Authentication Endpoints ──────────────────────────────────────────────────
export const loginUser = async (body: { email: string; password: string }): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthResponse>('/api/v1/auth/login', body);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const registerUser = async (body: RegisterBody): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthResponse>('/api/v1/auth/register', body);
    return response.data;
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
    const response = await apiClient.post<AuthResponse>('/api/v1/auth/google', body);
    return response.data;
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
export const checkout = async (data: CheckoutBody): Promise<{ orders: ApiOrder[]; payment_url?: string }> => {
  try {
    const response = await apiClient.post<{
      data: { orders: ApiOrder[]; payment_url?: string };
    }>('/api/v1/orders/checkout', data);
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const getMyOrders = async (page = 1, limit = 20): Promise<PaginatedResponse<ApiOrder>> => {
  try {
    const response = await apiClient.get<PaginatedResponse<ApiOrder>>(
      '/api/v1/orders/my',
      { params: { page, limit } }
    );
    return response.data;
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
export const getDashboard = async (): Promise<any> => {
  try {
    const response = await apiClient.get<{ data: any }>('/api/v1/analytics/dashboard');
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const getStoreDashboard = async (storeId?: string): Promise<any> => {
  try {
    const response = await apiClient.get<{ data: any }>(
      `/api/v1/analytics/dashboard${storeId ? `?store_id=${storeId}` : ''}`
    );
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const getStoreAnalytics = async (storeId?: string): Promise<any> => {
  try {
    const response = await apiClient.get<{ data: any }>(
      `/api/v1/analytics/sales${storeId ? `?store_id=${storeId}` : ''}`
    );
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const getStoreOrders = async (storeId: string, page = 1, limit = 20): Promise<PaginatedResponse<ApiOrder>> => {
  try {
    const response = await apiClient.get<PaginatedResponse<ApiOrder>>(
      `/api/v1/stores/${storeId}/orders`,
      { params: { page, limit } }
    );
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const getStoreInventory = async (storeId: string, page = 1, limit = 20): Promise<PaginatedResponse<ApiProduct>> => {
  try {
    const response = await apiClient.get<PaginatedResponse<ApiProduct>>(
      `/api/v1/stores/${storeId}/products`,
      { params: { page, limit } }
    );
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const createProduct = async (storeId: string, data: Partial<ApiProduct>): Promise<ApiProduct> => {
  try {
    const response = await apiClient.post<{ data: ApiProduct }>(
      `/api/v1/stores/${storeId}/products`,
      data
    );
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const updateProduct = async (storeId: string, productId: string, data: Partial<ApiProduct>): Promise<ApiProduct> => {
  try {
    const response = await apiClient.put<{ data: ApiProduct }>(
      `/api/v1/stores/${storeId}/products/${productId}`,
      data
    );
    return response.data.data;
  } catch (error) {
    handleError(error);
  }
};

export const deleteProduct = async (storeId: string, productId: string): Promise<any> => {
  try {
    const response = await apiClient.delete(`/api/v1/stores/${storeId}/products/${productId}`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const fetchStoreProductStats = async (storeId: string): Promise<StoreProductStats> => {
  try {
    const response = await apiClient.get<{ data: StoreProductStats }>(
      `/api/v1/stores/${storeId}/products/stats`
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

export const uploadImage = async (file: File, context: UploadContext): Promise<{ url: string }> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('context', context);
    const response = await apiClient.post<{ data: { url: string } }>('/api/v1/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  } catch (error) {
    handleError(error);
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