import type { Product } from '../types/product';


const BASE_URL = import.meta.env.VITE_API_URL ?? 'https://ndeko-backend-dev.onrender.com';
const REQUEST_TIMEOUT_MS = 15000;

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
function dispatchSessionExpired() {
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
}

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

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export enum UserRole {
  BUYER = 'buyer',
  SELLER = 'seller',
  DISPATCHER = 'dispatcher',
  ADMIN = 'admin',
}

export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  /** Convenience getter — not sent by API, derived on the frontend */
  name?: string;
  role: string;
  is_email_verified: boolean;
  is_identity_verified?: boolean;
  avatar_url?: string;
  /** @deprecated use avatar_url */
  avatar?: string;
  phone?: string;
}

// ─── Account security / addresses / notifications / payment methods ───────────
// (Backend endpoints for these may not exist yet — see functions below.)


export interface NotificationPreferences {
  order_updates: boolean;
  deals: boolean;
  wishlist: boolean;
  newsletter: boolean;
  sms: boolean;
}

export interface SavedPaymentMethod {
  id: string;
  card_type: string;        // 'visa' | 'mastercard' | 'verve' | ...
  last_four: string;
  cardholder_name: string;
  expiry: string;            // 'MM/YY'
  is_default: boolean;
  /** Paystack (or other gateway) authorization code used to charge this card later */
  authorization_code?: string;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
  _dev_verify_link?: string;
  is_new_user?: boolean;
}

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  description?: string;
  icon_url?: string;
  created_at?: string;
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
  category?: ApiCategory;
  store?: { id: string; store_name: string; store_slug: string };
  average_rating?: number;
  review_count?: number;
  created_at: string;
}

export interface ApiBusiness {
  id: string;
  business_name: string;
  description?: string;
  logo?: string;
  cover_image?: string;
  status: 'pending' | 'verified' | 'rejected' | 'suspended';
}

export interface ApiStore {
  id: string;
  business_id?: string;
  store_name: string;
  store_slug: string;
  store_tagline?: string;
  /** String name (current API) or full object when the join is populated */
  category?: string | ApiCategory;
  description?: string;
  city?: string;
  state?: string;
  country?: string;
  contact_phone?: string;
  contact_email?: string;
  whatsapp_number?: string;
  logo_url?: string;
  banner_url?: string;
  delivery_fee?: number | string;
  return_policy?: string;
  shipping_policy?: string;
  status: 'active' | 'inactive' | 'suspended';
  average_rating?: number;
  visitor_count?: number;
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
  buyer?: { first_name: string; last_name: string };
  items?: { product_name: string; quantity: number; unit_price: number }[];
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
  created_at?: string;
}

export type AddressBody = {
  label: string;
  recipient_name?: string;
  recipient_phone?: string;
  street: string;
  city: string;
  state: string;
  country?: string;
  is_default?: boolean;
};

export interface CheckoutBody {
  items: { product_id: string; quantity: number }[];
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

export interface Wallet {
  id: string;
  balance: number;
  available_balance: number;
  pending_balance: number;
  withdrawable_balance: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  created_at: string;
}

export interface StoreDashboard {
  revenue: number;
  orders: Record<string, number>;
  visitors: number;
  active_products: number;
}

export interface StoreSnapshot {
  snapshot_date: string;
  revenue: number;
  orders_count: number;
  visitors_count: number;
  active_products_count: number;
  avg_order_value: number;
}

export interface ApiReview {
  id: string;
  rating: number;
  comment?: string;
  is_verified_purchase?: boolean;
  reviewer: { id: string; first_name: string; last_name: string };
  created_at: string;
}

export interface ReviewSummary {
  total_reviews: number;
  avg_rating: number | null;
  verified_count?: number;
  breakdown: Record<string, number>;
}

export interface ApiGig {
  id: string;
  title: string;
  description: string;
  city: string;
  fee: number;
  status: 'pending' | 'listed' | 'assigned' | 'in_progress' | 'delivered' | 'cancelled';
  created_at: string;
}

export interface KycSubmission {
  id: string;
  owner_type: string;
  owner_id: string;
  document_type: string;
  document_url: string;
  status: 'pending' | 'passed' | 'failed';
  created_at: string;
}

export type RegisterBody =
  | { first_name: string; last_name: string; email: string; password: string; role: UserRole.BUYER | UserRole.SELLER }
  | { first_name: string; last_name: string; email: string; password: string; role: UserRole.SELLER; business_name: string };

function buildQuery(params?: Record<string, unknown>): string {
  if (!params) return '';
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      q.append(k, String(v));
    }
  });
  const str = q.toString();
  return str ? `?${str}` : '';
}

let _refreshPromise: Promise<AuthTokens> | null = null;

async function doRefresh(): Promise<AuthTokens> {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    const refresh = tokenStore.getRefresh();
    if (!refresh) throw new ApiError('No refresh token', 401);
    // After envelope unwrap, refresh returns { tokens: { access_token, refresh_token } }
    const result = await publicFetch<{ tokens: AuthTokens } | AuthTokens>('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refresh }),
    });
    // Handle both nested { tokens } and flat shapes defensively
    return ('tokens' in result && result.tokens) ? result.tokens : result as AuthTokens;
  })().finally(() => {
    _refreshPromise = null;
  });

  return _refreshPromise;
}

async function coreFetch(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new ApiError('Request timed out — please try again.', 0, err);
    }
    throw new ApiError(
      'Network error — unable to reach the server. It may be starting up, please try again.',
      0,
      err
    );
  } finally {
    clearTimeout(timer);
  }
}

async function parseResponse(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function buildHeaders(
  extra: Record<string, string> = {},
  body?: RequestInit['body'],
  token?: string | null
): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function publicFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = buildHeaders(options.headers as Record<string, string>, options.body);
  const res = await coreFetch(`${BASE_URL}${path}`, { ...options, headers });
  const json = await parseResponse(res);

  if (!res.ok) {
    const msg = (json as Record<string, unknown>)?.message as string ?? `Request failed: ${res.status}`;
    throw new ApiError(msg, res.status, json, { endpoint: path, timestamp: Date.now() });
  }


  const envelope = json as Record<string, unknown>;
  if (envelope?.data !== undefined) {
    if (envelope.meta && typeof envelope.meta === 'object') {
      // Paginated: merge data array + meta fields into one flat object
      return { data: envelope.data, ...(envelope.meta as object) } as T;
    }
    return envelope.data as T;
  }
  return json as T;
}

async function authFetch<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const token = tokenStore.getAccess();
  const headers = buildHeaders(options.headers as Record<string, string>, options.body, token);
  const res = await coreFetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && retry) {
    try {
      const tokens = await doRefresh();
      tokenStore.setAccess(tokens.access_token);
      if (tokens.refresh_token) tokenStore.setRefresh(tokens.refresh_token);
      return authFetch<T>(path, options, false);
    } catch (refreshErr) {
      if (refreshErr instanceof ApiError && refreshErr.status === 401) {
        tokenStore.clear();
        dispatchSessionExpired();
        throw new ApiError('SESSION_EXPIRED', 401);
      }
      throw refreshErr;
    }
  }

  const json = await parseResponse(res);

  if (!res.ok) {
    const msg = (json as Record<string, unknown>)?.message as string ?? `Request failed: ${res.status}`;
    throw new ApiError(msg, res.status, json, { endpoint: path, timestamp: Date.now() });
  }

  // Unwrap the standard { success, message, data[, meta] } envelope
  const envelope = json as Record<string, unknown>;
  if (envelope?.data !== undefined) {
    if (envelope.meta && typeof envelope.meta === 'object') {
      return { data: envelope.data, ...(envelope.meta as object) } as T;
    }
    return envelope.data as T;
  }
  return json as T;
}

//  Auth 

export const registerUser = (body: RegisterBody) =>
  publicFetch<AuthResponse>('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(body) });

export const loginUser = (body: { email: string; password: string }) =>
  publicFetch<AuthResponse>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(body) });

export const googleAuth = (body: { id_token: string; role?: string }) =>
  publicFetch<AuthResponse>('/api/v1/auth/google', { method: 'POST', body: JSON.stringify(body) });

export const refreshToken = (body: { refresh_token: string }) =>
  publicFetch<AuthTokens>('/api/v1/auth/refresh', { method: 'POST', body: JSON.stringify(body) });

export const logoutUser = (refreshTokenValue: string) =>
  authFetch<void>('/api/v1/auth/logout', { method: 'POST', body: JSON.stringify({ refresh_token: refreshTokenValue }) });

export const verifyEmail = (token: string) =>
  publicFetch<void>(`/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`, {
    method: 'POST', body: JSON.stringify({ token }),
  });

export const forgotPassword = (email: string) =>
  publicFetch<void>('/api/v1/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });

export const resetPassword = (body: { email: string; otp: string; password: string }) =>
  publicFetch<void>('/api/v1/auth/reset-password', { method: 'POST', body: JSON.stringify(body) });

//  Users 

export const getMe = () => authFetch<AuthUser>('/api/v1/users/me');

export const updateMe = (body: { name?: string; phone?: string; avatar?: string }) =>
  authFetch<AuthUser>('/api/v1/users/me', { method: 'PUT', body: JSON.stringify(body) });

// ─── Addresses ────────────────────────────────────────────────────────────────

export const getMyAddresses = () =>
  authFetch<ApiAddress[]>('/api/v1/users/me/addresses');

export const createAddress = (body: AddressBody) =>
  authFetch<ApiAddress>('/api/v1/users/me/addresses', { method: 'POST', body: JSON.stringify(body) });

export const updateAddress = (addressId: string, body: Partial<AddressBody>) =>
  authFetch<ApiAddress>(`/api/v1/users/me/addresses/${addressId}`, { method: 'PUT', body: JSON.stringify(body) });

export const deleteAddress = (addressId: string) =>
  authFetch<void>(`/api/v1/users/me/addresses/${addressId}`, { method: 'DELETE' });

export const setDefaultAddress = (addressId: string) =>
  authFetch<ApiAddress>(`/api/v1/users/me/addresses/${addressId}/default`, { method: 'PATCH' });

//  Account security
// NOTE: backend endpoints for these may not exist yet. Frontend is wired and
// ready — once the routes below exist server-side, these "just work".

export const changePassword = (body: { current_password: string; new_password: string }) =>
  authFetch<{ message: string }>('/api/v1/auth/change-password', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });

export const deleteAccount = () =>
  authFetch<{ message: string }>('/api/v1/users/me', { method: 'DELETE' });

//  Notification preferences 
// NOTE: backend endpoints for these may not exist yet.

export const getNotificationPreferences = () =>
  authFetch<NotificationPreferences>('/api/v1/users/me/notification-preferences');

export const updateNotificationPreferences = (body: Partial<NotificationPreferences>) =>
  authFetch<NotificationPreferences>('/api/v1/users/me/notification-preferences', {
    method: 'PUT',
    body: JSON.stringify(body),
  });

//  Saved payment methods
// NOTE: backend endpoints for these may not exist yet.
// Paystack does not let you collect/store raw card numbers on your own
// server (PCI-DSS) — the real integration pattern is:
//   1. Frontend redirects to Paystack to add a card (a ₦0 or small auth charge)
//   2. Paystack returns an `authorization_code` via webhook/callback
//   3. Backend stores ONLY last_four/expiry/authorization_code, never the PAN
// These endpoints assume the backend already has that flow; the frontend
// here never collects/transmits a full card number to your own backend.

export const getSavedPaymentMethods = () =>
  authFetch<SavedPaymentMethod[]>('/api/v1/users/me/payment-methods');

export const deleteSavedPaymentMethod = (paymentMethodId: string) =>
  authFetch<void>(`/api/v1/users/me/payment-methods/${paymentMethodId}`, { method: 'DELETE' });

export const setDefaultPaymentMethod = (paymentMethodId: string) =>
  authFetch<SavedPaymentMethod>(`/api/v1/users/me/payment-methods/${paymentMethodId}/default`, {
    method: 'PATCH',
  });

// Initiates Paystack's "add card" flow — backend returns a redirect URL,
// same shape as your checkout `payment_url` pattern.
export const initiateAddPaymentMethod = () =>
  authFetch<{ authorization_url: string }>('/api/v1/users/me/payment-methods/initiate', {
    method: 'POST',
  });

// Categories 

export const fetchCategories = (params?: { search?: string; parent_id?: string; page?: number; limit?: number }) =>
  publicFetch<PaginatedResponse<ApiCategory>>(`/api/v1/categories${buildQuery(params)}`);

//  Products 

export const fetchProducts = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: string;
  category_slug?: string;
  store_id?: string;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
}) =>
  publicFetch<PaginatedResponse<ApiProduct>>(`/api/v1/products${buildQuery(params)}`);

export const fetchProductById = async (id: string): Promise<ApiProduct> => {
  const res = await publicFetch<PaginatedResponse<ApiProduct> | ApiProduct>(
    `/api/v1/products?id=${encodeURIComponent(id)}`
  );
  if (res && typeof res === 'object' && 'data' in res && Array.isArray((res as PaginatedResponse<ApiProduct>).data)) {
    const item = (res as PaginatedResponse<ApiProduct>).data[0];
    if (!item) throw new ApiError('Product not found', 404);
    return item;
  }
  return res as ApiProduct;
};

//  Reviews 

export const fetchProductReviews = (productId: string, page = 1, limit = 20) =>
  publicFetch<PaginatedResponse<ApiReview>>(`/api/v1/reviews/products/${productId}${buildQuery({ page, limit })}`);

export const fetchProductReviewSummary = (productId: string) =>
  publicFetch<ReviewSummary>(`/api/v1/reviews/products/${productId}/summary`);

export const fetchStoreReviews = (storeId: string, page = 1, limit = 20) =>
  publicFetch<PaginatedResponse<ApiReview>>(`/api/v1/reviews/stores/${storeId}${buildQuery({ page, limit })}`);

export const fetchStoreReviewSummary = (storeId: string) =>
  publicFetch<ReviewSummary>(`/api/v1/reviews/stores/${storeId}/summary`);

export const addProductReview = (productId: string, body: { rating: number; comment?: string; order_id?: string }) =>
  authFetch<ApiReview>(`/api/v1/reviews/products/${productId}`, { method: 'POST', body: JSON.stringify(body) });

export const deleteProductReview = (reviewId: string) =>
  authFetch<void>(`/api/v1/reviews/products/reviews/${reviewId}`, { method: 'DELETE' });

export const addStoreReview = (storeId: string, body: { rating: number; comment?: string }) =>
  authFetch<ApiReview>(`/api/v1/reviews/stores/${storeId}`, { method: 'POST', body: JSON.stringify(body) });

export const deleteStoreReview = (reviewId: string) =>
  authFetch<void>(`/api/v1/reviews/stores/reviews/${reviewId}`, { method: 'DELETE' });

//  Wishlist 

export const getWishlist = (page = 1, limit = 20) =>
  authFetch<PaginatedResponse<ApiProduct>>(`/api/v1/wishlists${buildQuery({ page, limit })}`);

export const addToWishlist = (productId: string) =>
  authFetch<{ message: string }>('/api/v1/wishlists', { method: 'POST', body: JSON.stringify({ product_id: productId }) });

export const removeFromWishlist = (productId: string) =>
  authFetch<{ message: string }>(`/api/v1/wishlists/${productId}`, { method: 'DELETE' });

//  Orders 

export const checkout = (body: CheckoutBody) =>
  authFetch<{ orders: ApiOrder[]; payment_url?: string }>('/api/v1/orders/checkout', { method: 'POST', body: JSON.stringify(body) });

export const getMyOrders = (page = 1, limit = 20) =>
  authFetch<PaginatedResponse<ApiOrder>>(`/api/v1/orders/my${buildQuery({ page, limit })}`);

export const getOrder = (orderId: string) => authFetch<ApiOrder>(`/api/v1/orders/my/${orderId}`);

export const cancelOrder = (orderId: string) =>
  authFetch<ApiOrder>(`/api/v1/orders/my/${orderId}/cancel`, { method: 'PATCH' });

//  Businesses 

export const fetchFeaturedBusinesses = () => publicFetch<ApiBusiness[]>('/api/v1/businesses/featured');

export const getMyBusiness = () => authFetch<ApiBusiness>('/api/v1/businesses/my');

export const updateMyBusiness = (body: Partial<ApiBusiness>) =>
  authFetch<ApiBusiness>('/api/v1/businesses/my', { method: 'PUT', body: JSON.stringify(body) });

//  Stores 

export const fetchPublicStores = (params?: {
  category_slug?: string;
  city?: string;
  slug?: string;
  status?: string;
  page?: number;
  limit?: number;
}) =>
  publicFetch<ApiStore[]>(`/api/v1/stores/public${buildQuery(params)}`);

export const getMyStores = () => authFetch<ApiStore[]>('/api/v1/stores/my');

export type StoreBody = {
  store_name: string;
  store_tagline?: string;
  category_slug?: string;
  description?: string;
  city?: string;
  state?: string;
  contact_phone?: string;
  contact_email?: string;
  whatsapp_number?: string;
  return_policy?: string;
  shipping_policy?: string;
  delivery_fee?: number;
};

export const createStore = (body: StoreBody) =>
  authFetch<ApiStore>('/api/v1/stores', { method: 'POST', body: JSON.stringify(body) });

export const updateStore = (storeId: string, body: Partial<StoreBody>) =>
  authFetch<ApiStore>(`/api/v1/stores/${storeId}`, { method: 'PUT', body: JSON.stringify(body) });

export const logStoreVisit = (storeId: string) => {
  const path = `/api/v1/stores/${storeId}/visitors`;
  return tokenStore.getAccess()
    ? authFetch<void>(path, { method: 'POST' })
    : publicFetch<void>(path, { method: 'POST' });
};

//  Analytics 

export const getStoreDashboard = (storeId: string, from?: string, to?: string) =>
  authFetch<StoreDashboard>(`/api/v1/analytics/stores/${storeId}/dashboard${buildQuery({ from, to })}`);

export const getStoreSnapshots = (storeId: string, limit = 7) =>
  authFetch<PaginatedResponse<StoreSnapshot>>(`/api/v1/analytics/stores/${storeId}/snapshots${buildQuery({ limit })}`);

export const getTopProducts = (storeId: string, limit = 10) =>
  authFetch<ApiProduct[]>(`/api/v1/analytics/stores/${storeId}/top-products${buildQuery({ limit })}`);

//  Wallet 

export const getWallet = () => authFetch<Wallet>('/api/v1/wallet');

export const getWalletTransactions = (page = 1, limit = 20) =>
  authFetch<PaginatedResponse<WalletTransaction>>(`/api/v1/wallet/transactions${buildQuery({ page, limit })}`);

export const saveBankDetails = (body: { account_number: string; bank_code: string }) =>
  authFetch<{ message: string }>('/api/v1/wallet/bank-details', { method: 'PUT', body: JSON.stringify(body) });

export const withdraw = (amount: number) =>
  authFetch<{ message: string; transaction_id: string }>('/api/v1/wallet/withdraw', {
    method: 'POST', body: JSON.stringify({ amount }),
  });

//    Seller products

export const getStoreProducts = (storeId: string, page = 1, limit = 20) =>
  authFetch<PaginatedResponse<ApiProduct>>(`/api/v1/products/stores/${storeId}${buildQuery({ page, limit })}`);

export const createProduct = (storeId: string, body: {
  name: string;
  description?: string;
  price: number;
  discount_price?: number;
  cost_price?: number;
  stock_quantity: number;
  category_id?: string;
  images?: string[];
}) =>
  authFetch<ApiProduct>(`/api/v1/products/stores/${storeId}`, { method: 'POST', body: JSON.stringify(body) });

export const updateProduct = (storeId: string, productId: string, body: Partial<ApiProduct>) =>
  authFetch<ApiProduct>(`/api/v1/products/stores/${storeId}/${productId}`, { method: 'PATCH', body: JSON.stringify(body) });

export const deleteProduct = (storeId: string, productId: string) =>
  authFetch<void>(`/api/v1/products/stores/${storeId}/${productId}`, { method: 'DELETE' });

//  Seller orders 

export const getStoreOrders = (storeId: string, page = 1, limit = 20) =>
  authFetch<PaginatedResponse<ApiOrder>>(`/api/v1/orders/stores/${storeId}${buildQuery({ page, limit })}`);

export const updateOrderStatus = (orderId: string, status: 'processing' | 'shipped' | 'delivered' | 'cancelled') =>
  authFetch<ApiOrder>(`/api/v1/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });

//  KYC 

export const submitKyc = (body: { document_type: string; document_url: string; owner_type?: string; owner_id?: string }) =>
  authFetch<KycSubmission>('/api/v1/kyc', { method: 'POST', body: JSON.stringify(body) });

export const getMyKyc = (page = 1, limit = 20) =>
  authFetch<PaginatedResponse<KycSubmission>>(`/api/v1/kyc/my${buildQuery({ page, limit })}`);

//  Gigs 

export const fetchPublicGigs = (city?: string) => publicFetch<ApiGig[]>(`/api/v1/gigs${buildQuery({ city })}`);
export const getGig = (gigId: string) => publicFetch<ApiGig>(`/api/v1/gigs/${gigId}`);

export const createGig = (body: { title: string; description: string; city: string; fee: number }) =>
  authFetch<ApiGig>('/api/v1/gigs', { method: 'POST', body: JSON.stringify(body) });

export const listGig = (gigId: string) => authFetch<ApiGig>(`/api/v1/gigs/${gigId}/list`, { method: 'PATCH' });
export const acceptGig = (gigId: string) => authFetch<ApiGig>(`/api/v1/gigs/${gigId}/accept`, { method: 'PATCH' });
export const startGig = (gigId: string) => authFetch<ApiGig>(`/api/v1/gigs/${gigId}/start`, { method: 'PATCH' });
export const deliverGig = (gigId: string) => authFetch<ApiGig>(`/api/v1/gigs/${gigId}/deliver`, { method: 'PATCH' });
export const cancelGig = (gigId: string) => authFetch<ApiGig>(`/api/v1/gigs/${gigId}/cancel`, { method: 'PATCH' });

export const getMyCreatedGigs = (page = 1, limit = 20) => authFetch<PaginatedResponse<ApiGig>>(`/api/v1/gigs/my/created${buildQuery({ page, limit })}`);
export const getMyAssignedGigs = (page = 1, limit = 20) => authFetch<PaginatedResponse<ApiGig>>(`/api/v1/gigs/my/assigned${buildQuery({ page, limit })}`);

//  Map ApiProduct → local Product 

export function mapApiProduct(p: ApiProduct): Product {
  const effectivePrice = p.discount_price ?? p.price;
  return {
    id: p.id,
    name: p.name,
    price: effectivePrice,
    originalPrice: p.discount_price ? p.price : undefined,
    image: p.images?.[0] || '/images/product-placeholder.webp',
    category: p.category?.slug ?? p.category?.id ?? '',
    rating: p.average_rating ?? 0,
    reviews: p.review_count ?? 0,
    description: p.description,
    brand: p.store?.store_name ?? '',
    inStock: ['in_stock', 'low_stock'].includes(p.stock_status),
    discount: p.discount_price
      ? Math.round((1 - p.discount_price / p.price) * 100)
      : undefined,
  };
}