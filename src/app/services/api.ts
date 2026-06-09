import type { Product } from '../types/product';


const BASE_URL = import.meta.env.VITE_API_URL ?? ' https://ndeko-backend-dev.onrender.com';
const REQUEST_TIMEOUT_MS = 15000;

let _accessToken: string | null = null;

export const tokenStore = {
  getAccess: () => _accessToken,
  setAccess: (t: string) => { _accessToken = t; },

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

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  is_email_verified: boolean;
  avatar?: string;
  phone?: string;
}

export interface AuthResponse extends AuthTokens {
  user: AuthUser;
  _dev_verify_link?: string;
}

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  created_at?: string;
}

export interface ApiProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  discount?: number | null;
  stock_quantity: number;
  stock_status: 'in_stock' | 'out_of_stock' | 'low_stock';
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
  store_name: string;
  store_slug: string;
  description?: string;
  logo?: string;
  city?: string;
  category?: ApiCategory;
  status: string;
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
}

export interface CheckoutBody {
  items: { product_id: string; quantity: number }[];
  shipping_address: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
  };
  payment_method: 'card' | 'bank_transfer' | 'wallet';
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
  orders_count: number;
  orders_by_status: Record<string, number>;
  visitor_count: number;
  period: { from: string; to: string };
}

export interface ApiReview {
  id: string;
  rating: number;
  comment?: string;
  is_verified_purchase: boolean;
  user: { id: string; name: string; avatar?: string };
  created_at: string;
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
    return publicFetch<AuthTokens>('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refresh }),
    });
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
    const msg = (json as Record<string, string>)?.message ?? `Request failed: ${res.status}`;
    throw new ApiError(msg, res.status, json, { endpoint: path, timestamp: Date.now() });
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
    const msg = (json as Record<string, string>)?.message ?? `Request failed: ${res.status}`;
    throw new ApiError(msg, res.status, json, { endpoint: path, timestamp: Date.now() });
  }

  return json as T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const registerUser = (body: {
  email: string; password: string; name: string; role: string; business_name?: string;
}) => publicFetch<AuthResponse>('/api/v1/auth/register', { method: 'POST', body: JSON.stringify(body) });

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

// ─── Users ────────────────────────────────────────────────────────────────────

export const getMe = () => authFetch<AuthUser>('/api/v1/users/me');

export const updateMe = (body: { name?: string; phone?: string; avatar?: string }) =>
  authFetch<AuthUser>('/api/v1/users/me', { method: 'PUT', body: JSON.stringify(body) });

// ─── Categories ───────────────────────────────────────────────────────────────

export const fetchCategories = (params?: { search?: string; parent_id?: string; page?: number; limit?: number }) =>
  publicFetch<PaginatedResponse<ApiCategory>>(`/api/v1/categories${buildQuery(params)}`);

// ─── Products ─────────────────────────────────────────────────────────────────

export const fetchProducts = (params?: { page?: number; limit?: number; category?: string }) =>
  publicFetch<PaginatedResponse<ApiProduct>>(`/api/v1/products${buildQuery(params)}`);

// CHANGE 2: fetchProductById previously returned whatever the API gave back
// (which is a PaginatedResponse wrapper, not a bare ApiProduct). ProductDetail.tsx
// calls mapApiProduct() directly on the result, so it would silently get
// undefined for every field (images, name, price, etc.) — causing the missing
// product details AND missing related products section.
// Fix: unwrap the paginated envelope and return the first item.
export const fetchProductById = async (id: string): Promise<ApiProduct> => {
  const res = await publicFetch<PaginatedResponse<ApiProduct> | ApiProduct>(
    `/api/v1/products?id=${encodeURIComponent(id)}`
  );
  // API returns { data: [...], total, page, limit } even for a single-product ?id= query
  if (res && typeof res === 'object' && 'data' in res && Array.isArray((res as PaginatedResponse<ApiProduct>).data)) {
    const item = (res as PaginatedResponse<ApiProduct>).data[0];
    if (!item) throw new ApiError('Product not found', 404);
    return item;
  }
  // Fallback: API returned a bare object (future-proofing)
  return res as ApiProduct;
};

// ─── Reviews ──────────────────────────────────────────────────────────────────

export const fetchProductReviews = (productId: string, page = 1, limit = 20) =>
  publicFetch<PaginatedResponse<ApiReview>>(`/api/v1/reviews/products/${productId}${buildQuery({ page, limit })}`);

export const fetchStoreReviews = (storeId: string, page = 1, limit = 20) =>
  publicFetch<PaginatedResponse<ApiReview>>(`/api/v1/reviews/stores/${storeId}${buildQuery({ page, limit })}`);

export const addProductReview = (productId: string, body: { rating: number; comment?: string }) =>
  authFetch<ApiReview>(`/api/v1/reviews/products/${productId}`, { method: 'POST', body: JSON.stringify(body) });

export const deleteProductReview = (reviewId: string) =>
  authFetch<void>(`/api/v1/reviews/products/reviews/${reviewId}`, { method: 'DELETE' });

export const addStoreReview = (storeId: string, body: { rating: number; comment?: string }) =>
  authFetch<ApiReview>(`/api/v1/reviews/stores/${storeId}`, { method: 'POST', body: JSON.stringify(body) });

export const deleteStoreReview = (reviewId: string) =>
  authFetch<void>(`/api/v1/reviews/stores/reviews/${reviewId}`, { method: 'DELETE' });

// ─── Wishlist ─────────────────────────────────────────────────────────────────

export const getWishlist = (page = 1, limit = 20) =>
  authFetch<PaginatedResponse<ApiProduct>>(`/api/v1/wishlists${buildQuery({ page, limit })}`);

export const addToWishlist = (productId: string) =>
  authFetch<{ message: string }>('/api/v1/wishlists', { method: 'POST', body: JSON.stringify({ product_id: productId }) });

export const removeFromWishlist = (productId: string) =>
  authFetch<{ message: string }>(`/api/v1/wishlists/${productId}`, { method: 'DELETE' });

// ─── Orders ───────────────────────────────────────────────────────────────────

export const checkout = (body: CheckoutBody) =>
  authFetch<{ orders: ApiOrder[]; payment_url?: string }>('/api/v1/orders/checkout', { method: 'POST', body: JSON.stringify(body) });

export const getMyOrders = (page = 1, limit = 20) =>
  authFetch<PaginatedResponse<ApiOrder>>(`/api/v1/orders/my${buildQuery({ page, limit })}`);

export const getOrder = (orderId: string) => authFetch<ApiOrder>(`/api/v1/orders/my/${orderId}`);

export const cancelOrder = (orderId: string) =>
  authFetch<ApiOrder>(`/api/v1/orders/my/${orderId}/cancel`, { method: 'PATCH' });

// ─── Businesses ───────────────────────────────────────────────────────────────

export const fetchFeaturedBusinesses = () => publicFetch<ApiBusiness[]>('/api/v1/businesses/featured');

export const getMyBusiness = () => authFetch<ApiBusiness>('/api/v1/businesses/my');

export const updateMyBusiness = (body: Partial<ApiBusiness>) =>
  authFetch<ApiBusiness>('/api/v1/businesses/my', { method: 'PUT', body: JSON.stringify(body) });

// ─── Stores ───────────────────────────────────────────────────────────────────

export const fetchPublicStores = (params?: {
  city?: string; category?: string; slug?: string; status?: string; page?: number; limit?: number;
}) =>
  publicFetch<PaginatedResponse<ApiStore>>(`/api/v1/stores/public${buildQuery(params)}`);

export const getMyStores = () => authFetch<PaginatedResponse<ApiStore>>('/api/v1/stores/my');

export const createStore = (body: { store_name: string; city: string; category: string }) =>
  authFetch<ApiStore>('/api/v1/stores', { method: 'POST', body: JSON.stringify(body) });

export const updateStore = (storeId: string, body: Partial<ApiStore>) =>
  authFetch<ApiStore>(`/api/v1/stores/${storeId}`, { method: 'PUT', body: JSON.stringify(body) });

export const logStoreVisit = (storeId: string) => {
  const path = `/api/v1/stores/${storeId}/visitors`;
  return tokenStore.getAccess()
    ? authFetch<void>(path, { method: 'POST' })
    : publicFetch<void>(path, { method: 'POST' });
};

// ─── Analytics ────────────────────────────────────────────────────────────────

export const getStoreDashboard = (storeId: string, from?: string, to?: string) =>
  authFetch<StoreDashboard>(`/api/v1/analytics/stores/${storeId}/dashboard${buildQuery({ from, to })}`);

export const getStoreSnapshots = (storeId: string) =>
  authFetch<PaginatedResponse<Record<string, unknown>>>(`/api/v1/analytics/stores/${storeId}/snapshots`);

export const getTopProducts = (storeId: string, limit = 10) =>
  authFetch<ApiProduct[]>(`/api/v1/analytics/stores/${storeId}/top-products${buildQuery({ limit })}`);

// ─── Wallet ───────────────────────────────────────────────────────────────────

export const getWallet = () => authFetch<Wallet>('/api/v1/wallet');

export const getWalletTransactions = (page = 1, limit = 20) =>
  authFetch<PaginatedResponse<WalletTransaction>>(`/api/v1/wallet/transactions${buildQuery({ page, limit })}`);

export const saveBankDetails = (body: { account_number: string; bank_code: string }) =>
  authFetch<{ message: string }>('/api/v1/wallet/bank-details', { method: 'PUT', body: JSON.stringify(body) });

export const withdraw = (amount: number) =>
  authFetch<{ message: string; transaction_id: string }>('/api/v1/wallet/withdraw', {
    method: 'POST', body: JSON.stringify({ amount }),
  });

// ─── Seller products ──────────────────────────────────────────────────────────

export const getStoreProducts = (storeId: string, page = 1, limit = 20) =>
  authFetch<PaginatedResponse<ApiProduct>>(`/api/v1/products/stores/${storeId}${buildQuery({ page, limit })}`);

export const createProduct = (storeId: string, body: {
  name: string; description: string; price: number; original_price?: number;
  stock_quantity: number; category_id: string; images: string[];
}) =>
  authFetch<ApiProduct>(`/api/v1/products/stores/${storeId}`, { method: 'POST', body: JSON.stringify(body) });

export const updateProduct = (storeId: string, productId: string, body: Partial<ApiProduct>) =>
  authFetch<ApiProduct>(`/api/v1/products/stores/${storeId}/${productId}`, { method: 'PATCH', body: JSON.stringify(body) });

export const deleteProduct = (storeId: string, productId: string) =>
  authFetch<void>(`/api/v1/products/stores/${storeId}/${productId}`, { method: 'DELETE' });

// ─── Seller orders ────────────────────────────────────────────────────────────

export const getStoreOrders = (storeId: string, page = 1, limit = 20) =>
  authFetch<PaginatedResponse<ApiOrder>>(`/api/v1/orders/stores/${storeId}${buildQuery({ page, limit })}`);

export const updateOrderStatus = (orderId: string, status: 'processing' | 'shipped' | 'delivered' | 'cancelled') =>
  authFetch<ApiOrder>(`/api/v1/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });

// ─── KYC ──────────────────────────────────────────────────────────────────────

export const submitKyc = (body: { document_type: string; document_url: string; owner_type?: string; owner_id?: string }) =>
  authFetch<KycSubmission>('/api/v1/kyc', { method: 'POST', body: JSON.stringify(body) });

export const getMyKyc = (page = 1, limit = 20) =>
  authFetch<PaginatedResponse<KycSubmission>>(`/api/v1/kyc/my${buildQuery({ page, limit })}`);

// ─── Gigs ─────────────────────────────────────────────────────────────────────

export const fetchPublicGigs = (city?: string) => publicFetch<ApiGig[]>(`/api/v1/gigs${buildQuery({ city })}`);
export const getGig = (gigId: string) => publicFetch<ApiGig>(`/api/v1/gigs/${gigId}`);

export const createGig = (body: { title: string; description: string; city: string; fee: number }) =>
  authFetch<ApiGig>('/api/v1/gigs', { method: 'POST', body: JSON.stringify(body) });

export const listGig    = (gigId: string) => authFetch<ApiGig>(`/api/v1/gigs/${gigId}/list`,    { method: 'PATCH' });
export const acceptGig  = (gigId: string) => authFetch<ApiGig>(`/api/v1/gigs/${gigId}/accept`,  { method: 'PATCH' });
export const startGig   = (gigId: string) => authFetch<ApiGig>(`/api/v1/gigs/${gigId}/start`,   { method: 'PATCH' });
export const deliverGig = (gigId: string) => authFetch<ApiGig>(`/api/v1/gigs/${gigId}/deliver`, { method: 'PATCH' });
export const cancelGig  = (gigId: string) => authFetch<ApiGig>(`/api/v1/gigs/${gigId}/cancel`,  { method: 'PATCH' });

export const getMyCreatedGigs  = (page = 1, limit = 20) => authFetch<PaginatedResponse<ApiGig>>(`/api/v1/gigs/my/created${buildQuery({ page, limit })}`);
export const getMyAssignedGigs = (page = 1, limit = 20) => authFetch<PaginatedResponse<ApiGig>>(`/api/v1/gigs/my/assigned${buildQuery({ page, limit })}`);

// ─── Map ApiProduct → local Product ──────────────────────────────────────────

export function mapApiProduct(p: ApiProduct): Product {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    originalPrice: p.original_price,
    image: p.images?.[0] || '/images/product-placeholder.webp',
    category: p.category?.slug ?? p.category?.id ?? '',
    rating: p.average_rating ?? 0,
    reviews: p.review_count ?? 0,
    description: p.description,
    brand: p.store?.store_name ?? '',
    inStock: p.stock_status === 'in_stock' || p.stock_status === 'low_stock',
    discount: p.discount ?? undefined,
  };
}