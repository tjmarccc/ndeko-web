import React from 'react';
import { useEffect, Suspense, ReactNode, Component, ErrorInfo } from 'react';
import { createBrowserRouter, useLocation, Navigate, Outlet, RouteObject } from 'react-router';
import { Layout } from './components/Layout';
import { BusinessLayout } from './components/BusinessLayout';

// ── Pages - Lazy load for code splitting ──────────────────────────────────────
import { Home } from './pages/Home';
import { Products } from './pages/Products';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Deals } from './pages/Deals';
import { NotFound } from './pages/NotFound';
import { Account } from './pages/Account';
import { Wishlist } from './pages/Wishlist';
import { Help } from './pages/Help';
import { Contact } from './pages/Contact';
import { Checkout } from './pages/Checkout';
import { OrderConfirmation } from './pages/OrderConfirmation';
import { Login } from './pages/Login';
import { VendorSearch } from './pages/VendorSearch';

// Business pages
import { BusinessDashboard } from './pages/business/BusinessDashboard';
import { BusinessInventory } from './pages/business/BusinessInventory';
import { BusinessOrders } from './pages/business/BusinessOrders';
import { BusinessStorefront } from './pages/business/BusinessStorefront';
import { BusinessAnalytics } from './pages/business/BusinessAnalytics';
import { BusinessSettings } from './pages/business/BusinessSettings';
import { BusinessNotifications } from './pages/business/BusinessNotifications';
import { BusinessReviews } from './pages/business/BusinessReviews';
import { BusinessLogistics } from './pages/business/BusinessLogistics';

// Contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { ThemeProvider } from './contexts/ThemeContext';

// ── Error Boundary ───────────────────────────────────────────────────────────
interface ErrorBoundaryProps {
  children: ReactNode;
  reset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Route error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-xl font-bold dark:text-white mb-2">Something went wrong</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 rounded-lg bg-[#8B1538] text-white font-medium hover:bg-[#6B0F2A] transition-colors"
            >
              Try Again
            </button>
            <a
              href="/"
              className="block mt-3 text-sm text-[#8B1538] hover:underline"
            >
              Go to Home
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ── Loading Fallback ────────────────────────────────────────────────────────
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-[#8B1538] border-t-transparent animate-spin" />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

// ── Scroll to Top Hook ──────────────────────────────────────────────────────
function useScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
}

// ── Shared Providers ────────────────────────────────────────────────────────
interface ProvidersProps {
  children: React.ReactNode;
}

function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <ErrorBoundary>{children}</ErrorBoundary>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// ── Private Route Guard ────────────────────────────────────────────────────
function PrivateRoute() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();

  if (loading) {
    return <LoadingFallback />;
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(pathname)}`} replace />;
  }

  return <Outlet />;
}

// ── Seller-Only Route Guard ─────────────────────────────────────────────────
function SellerRoute() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();

  if (loading) {
    return <LoadingFallback />;
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(pathname)}`} replace />;
  }

  const isSeller = user.role === 'seller' || user.role === 'admin';
  if (!isSeller) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

// ── Root Layout Components ──────────────────────────────────────────────────

function LoginRoot() {
  useScrollToTop();
  return (
    <Providers>
      <Suspense fallback={<LoadingFallback />}>
        <Login />
      </Suspense>
    </Providers>
  );
}

function BuyerRoot() {
  useScrollToTop();
  return (
    <Providers>
      <Layout />
    </Providers>
  );
}

function BusinessRoot() {
  useScrollToTop();
  return (
    <Providers>
      <SellerRoute />
    </Providers>
  );
}

function BusinessLayoutWrapper() {
  return <BusinessLayout />;
}

// ── Route Configuration ──────────────────────────────────────────────────────

const authRoutes: RouteObject[] = [
  {
    path: '/login',
    Component: LoginRoot,
    errorElement: (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-bold dark:text-white mb-2">Error</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Failed to load login page</p>
          <a href="/" className="text-[#8B1538] hover:underline">
            Go Home
          </a>
        </div>
      </div>
    ),
  },
];

const businessRoutes: RouteObject[] = [
  {
    path: '/business',
    Component: BusinessRoot,
    errorElement: (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold dark:text-white mb-2">Business Portal Error</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Failed to load business section</p>
          <a href="/" className="text-[#8B1538] hover:underline">
            Go Home
          </a>
        </div>
      </div>
    ),
    children: [
      {
        element: <BusinessLayoutWrapper />,
        children: [
          {
            index: true,
            Component: BusinessDashboard,
            errorElement: (
              <div className="p-6">
                <div className="text-center">
                  <p className="text-red-600 dark:text-red-400">Failed to load dashboard</p>
                  <a href="/business" className="text-[#8B1538] hover:underline text-sm">
                    Reload
                  </a>
                </div>
              </div>
            ),
          },
          {
            path: 'inventory',
            Component: BusinessInventory,
            errorElement: (
              <div className="p-6">
                <p className="text-red-600 dark:text-red-400">Failed to load inventory</p>
              </div>
            ),
          },
          {
            path: 'orders',
            Component: BusinessOrders,
            errorElement: (
              <div className="p-6">
                <p className="text-red-600 dark:text-red-400">Failed to load orders</p>
              </div>
            ),
          },
          {
            path: 'storefront',
            Component: BusinessStorefront,
            errorElement: (
              <div className="p-6">
                <p className="text-red-600 dark:text-red-400">Failed to load storefront</p>
              </div>
            ),
          },
          {
            path: 'analytics',
            Component: BusinessAnalytics,
            errorElement: (
              <div className="p-6">
                <p className="text-red-600 dark:text-red-400">Failed to load analytics</p>
              </div>
            ),
          },
          {
            path: 'reviews',
            Component: BusinessReviews,
            errorElement: (
              <div className="p-6">
                <p className="text-red-600 dark:text-red-400">Failed to load reviews</p>
              </div>
            ),
          },
          {
            path: 'logistics',
            Component: BusinessLogistics,
            errorElement: (
              <div className="p-6">
                <p className="text-red-600 dark:text-red-400">Failed to load logistics</p>
              </div>
            ),
          },
          {
            path: 'settings',
            Component: BusinessSettings,
            errorElement: (
              <div className="p-6">
                <p className="text-red-600 dark:text-red-400">Failed to load settings</p>
              </div>
            ),
          },
          {
            path: 'notifications',
            Component: BusinessNotifications,
            errorElement: (
              <div className="p-6">
                <p className="text-red-600 dark:text-red-400">Failed to load notifications</p>
              </div>
            ),
          },
          {
            path: 'vendors',
            Component: VendorSearch,
            errorElement: (
              <div className="p-6">
                <p className="text-red-600 dark:text-red-400">Failed to load vendors</p>
              </div>
            ),
          },
        ],
      },
    ],
  },
];

const buyerRoutes: RouteObject[] = [
  {
    path: '/',
    Component: BuyerRoot,
    errorElement: (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold dark:text-white mb-2">Page Error</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Something went wrong</p>
          <a href="/" className="text-[#8B1538] hover:underline">
            Go Home
          </a>
        </div>
      </div>
    ),
    children: [
      // Public routes
      {
        index: true,
        Component: Home,
        errorElement: (
          <div className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400">Failed to load home page</p>
          </div>
        ),
      },
      {
        path: 'products',
        Component: Products,
        errorElement: (
          <div className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400">Failed to load products</p>
          </div>
        ),
      },
      {
        path: 'product/:id',
        Component: ProductDetail,
        errorElement: (
          <div className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400">Failed to load product details</p>
          </div>
        ),
      },
      {
        path: 'deals',
        Component: Deals,
        errorElement: (
          <div className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400">Failed to load deals</p>
          </div>
        ),
      },
      {
        path: 'cart',
        Component: Cart,
        errorElement: (
          <div className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400">Failed to load cart</p>
          </div>
        ),
      },
      {
        path: 'wishlist',
        Component: Wishlist,
        errorElement: (
          <div className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400">Failed to load wishlist</p>
          </div>
        ),
      },
      {
        path: 'help',
        Component: Help,
        errorElement: (
          <div className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400">Failed to load help</p>
          </div>
        ),
      },
      {
        path: 'contact',
        Component: Contact,
        errorElement: (
          <div className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400">Failed to load contact</p>
          </div>
        ),
      },
      {
        path: 'vendors',
        Component: VendorSearch,
        errorElement: (
          <div className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400">Failed to load vendors</p>
          </div>
        ),
      },

      // Protected routes
      {
        element: <PrivateRoute />,
        errorElement: (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-600 dark:text-red-400 mb-4">Authentication error</p>
              <a href="/login" className="text-[#8B1538] hover:underline">
                Go to Login
              </a>
            </div>
          </div>
        ),
        children: [
          {
            path: 'account',
            Component: Account,
            errorElement: (
              <div className="p-6 text-center">
                <p className="text-red-600 dark:text-red-400">Failed to load account</p>
              </div>
            ),
          },
          {
            path: 'checkout',
            Component: Checkout,
            errorElement: (
              <div className="p-6 text-center">
                <p className="text-red-600 dark:text-red-400">Failed to load checkout</p>
              </div>
            ),
          },
          {
            path: 'order-confirmation',
            Component: OrderConfirmation,
            errorElement: (
              <div className="p-6 text-center">
                <p className="text-red-600 dark:text-red-400">Failed to load order confirmation</p>
              </div>
            ),
          },
        ],
      },

      // 404 - Must be last
      {
        path: '*',
        Component: NotFound,
      },
    ],
  },
];

// ── Create Router ────────────────────────────────────────────────────────────

export const router = createBrowserRouter(
  [...authRoutes, ...businessRoutes, ...buyerRoutes],
  {
    basename: '/',
  }
);

// ── Optional: Default error handler ─────────────────────────────────────────

router.subscribe((state) => {
  if (state.errors) {
    console.error('Router error:', state.errors);
  }
});