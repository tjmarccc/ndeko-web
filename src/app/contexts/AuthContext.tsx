import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router';
import {
  loginUser,
  registerUser,
  googleAuth,
  logoutUser,
  getMe,
  tokenStore,
  SESSION_EXPIRED_EVENT,
  type RegisterBody,
  type AuthUser,
  type ApiError,
} from '../services/api';

// ── Context types ─────────────────────────────────────────────────────────────
interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  token: string | null;
  register: (params: {
    name: string;
    email: string;
    password: string;
    role: 'buyer' | 'seller';
    business_name?: string;
  }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string, role?: 'buyer' | 'seller') => Promise<void>;
  logout: () => Promise<void>;
  isSeller: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(() => tokenStore.getUser());
  const [token, setToken]     = useState<string | null>(() => tokenStore.getAccess());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ── Listen for session expiry fired by api.ts ───────────────────────────────
  useEffect(() => {
    function handleExpired() {
      setUser(null);
      setToken(null);
      // Only redirect if not already on /login
      if (!window.location.pathname.startsWith('/login')) {
        navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`, { replace: true });
      }
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, [navigate]);

  // ── On mount: restore access token then validate ────────────────────────────
  useEffect(() => {
    // Restore persisted access token into memory first (tokenStore.getAccess()
    // is already seeded from localStorage at module load, so getMe() will have a
    // token on the very first call — no 401 flash on page reload).
    const storedToken = tokenStore.getAccess();
    if (!storedToken && !tokenStore.getRefresh()) {
      // Nothing stored at all — definitively not logged in
      setLoading(false);
      return;
    }
    getMe()
      .then((u: AuthUser) => {
        setUser(u);
        setToken(tokenStore.getAccess());
        tokenStore.setUser(u);
      })
      .catch(() => {
        tokenStore.clear();
        setUser(null);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAuthResponse = useCallback(
    (data: { user: AuthUser; access_token: string; refresh_token: string }) => {
      tokenStore.setAccess(data.access_token);
      tokenStore.setRefresh(data.refresh_token);
      tokenStore.setUser(data.user);
      setUser(data.user);
      setToken(data.access_token);
    },
    []
  );

  const register = useCallback(
    async (params: {
      name: string;
      email: string;
      password: string;
      role: 'buyer' | 'seller';
      business_name?: string;
    }) => {
      const [first_name, ...rest] = params.name.trim().split(' ');
      const last_name = rest.join(' ') || first_name;

      const body: RegisterBody =
        params.role === 'seller'
          ? {
              first_name,
              last_name,
              email: params.email,
              password: params.password,
              role: 'seller',
              business_name: params.business_name ?? '',
            }
          : {
              first_name,
              last_name,
              email: params.email,
              password: params.password,
              role: 'buyer',
            };
      const data = await registerUser(body);
      handleAuthResponse(data);
    },
    [handleAuthResponse]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await loginUser({ email, password });
      handleAuthResponse(data);
    },
    [handleAuthResponse]
  );

  const loginWithGoogle = useCallback(
    async (idToken: string, role?: 'buyer' | 'seller') => {
      const data = await googleAuth({ id_token: idToken, role });
      handleAuthResponse(data);
    },
    [handleAuthResponse]
  );

  const logout = useCallback(async () => {
    const refreshToken = tokenStore.getRefresh();
    if (refreshToken) {
      await logoutUser(refreshToken).catch(() => {});
    }
    tokenStore.clear();
    setUser(null);
    setToken(null);
  }, []);

  const isSeller = user?.role === 'seller' || user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{ user, loading, token, register, login, loginWithGoogle, logout, isSeller }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/**
 * Convert an ApiError's validation body into a user-readable string.
 */
export function extractApiErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const apiErr = err as ApiError;
    if (apiErr.body && typeof apiErr.body === 'object') {
      const body = apiErr.body as Record<string, unknown>;
      if (Array.isArray(body.errors)) {
        return (body.errors as { message: string }[]).map(e => e.message).join(', ');
      }
    }
    return err.message;
  }
  return 'An unexpected error occurred.';
}