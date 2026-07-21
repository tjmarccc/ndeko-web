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
import { BusinessOrderDetail } from './pages/business/Businessorderdetail';
import { BusinessInventoryDetail } from './pages/business/Businessinventorydetail';
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

// ── Reusable Error Components ────────────────────────────────────────────────

interface RouteErrorComponentProps {
  title?: string;
  message: string;
  backUrl?: string;
  backLabel?: string;
  fullPage?: boolean;
}

function RouteErrorComponent({
  title = 'Error',
  message,
  backUrl = '/',
  backLabel = 'Go Home',
  fullPage = false,
}: RouteErrorComponentProps) {
  if (fullPage) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-bold dark:text-white mb-2">{title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">{message}</p>
          <a
            href={backUrl}
            className="inline-block px-4 py-2 rounded-lg bg-[#8B1538] text-white font-medium hover:bg-[#6B0F2A] transition-colors"
          >
            {backLabel}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 text-center">
      <p className="text-red-600 dark:text-red-400 mb-3">{message}</p>
      <a href={backUrl} className="text-sm text-[#8B1538] hover:underline font-medium">
        {backLabel}
      </a>
    </div>
  );
}

function AccessDeniedComponent() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
          <span className="text-2xl">🔒</span>
        </div>
        <h1 className="text-xl font-bold dark:text-white mb-2">Access Denied</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
          Only sellers can access the business portal. Switch to a seller account or create one.
        </p>
        <a
          href="/"
          className="inline-block px-4 py-2 rounded-lg bg-[#8B1538] text-white font-medium hover:bg-[#6B0F2A] transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}

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
        <RouteErrorComponent
          title="Something went wrong"
          message={this.state.error?.message || 'An unexpected error occurred'}
          backUrl="/"
          backLabel="Try Again"
          fullPage
        />
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
    return <AccessDeniedComponent />;
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

// ── Route Configuration ──────────────────────────────────────────────────────

const authRoutes: RouteObject[] = [
  {
    path: '/login',
    Component: LoginRoot,
    errorElement: (
      <RouteErrorComponent
        title="Login Error"
        message="Failed to load login page"
        backUrl="/"
        fullPage
      />
    ),
  },
  {
    path: '/logout',
    loader: async () => {
      // Call logout API endpoint
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (error) {
        console.error('Logout failed:', error);
      }
      // Redirect to home
      window.location.href = '/';
      return null;
    },
  },
];

const businessRoutes: RouteObject[] = [
  {
    path: '/business',
    Component: BusinessRoot,
    errorElement: (
      <RouteErrorComponent
        title="Business Portal Error"
        message="Failed to load business section"
        backUrl="/"
        fullPage
      />
    ),
    children: [
      {
        Component: BusinessLayout,
        errorElement: (
          <RouteErrorComponent
            title="Business Layout Error"
            message="Failed to load business layout"
            backUrl="/"
            fullPage
          />
        ),
        children: [
          {
            index: true,
            Component: BusinessDashboard,
            errorElement: (
              <RouteErrorComponent
                message="Failed to load dashboard"
                backUrl="/business"
                backLabel="Back to Business"
              />
            ),
          },
          {
            path: 'inventory',
            children: [
              {
                index: true,
                Component: BusinessInventory,
                errorElement: (
                  <RouteErrorComponent
                    message="Failed to load inventory"
                    backUrl="/business"
                  />
                ),
              },
              {
                path: ':id',
                Component: BusinessInventoryDetail,
                errorElement: (
                  <RouteErrorComponent
                    message="Failed to load inventory item"
                    backUrl="/business/inventory"
                    backLabel="Back to Inventory"
                  />
                ),
              },
              {
                path: ':id/edit',
                Component: BusinessInventoryDetail,
                errorElement: (
                  <RouteErrorComponent
                    message="Failed to load inventory editor"
                    backUrl="/business/inventory"
                    backLabel="Back to Inventory"
                  />
                ),
              },
            ],
          },
          {
            path: 'orders',
            children: [
              {
                index: true,
                Component: BusinessOrders,
                errorElement: (
                  <RouteErrorComponent
                    message="Failed to load orders"
                    backUrl="/business"
                  />
                ),
              },
              {
                path: ':id',
                Component: BusinessOrderDetail,
                errorElement: (
                  <RouteErrorComponent
                    message="Failed to load order details"
                    backUrl="/business/orders"
                    backLabel="Back to Orders"
                  />
                ),
              },
            ],
          },
          {
            path: 'storefront',
            Component: BusinessStorefront,
            errorElement: (
              <RouteErrorComponent
                message="Failed to load storefront"
                backUrl="/business"
              />
            ),
          },
          {
            path: 'analytics',
            Component: BusinessAnalytics,
            errorElement: (
              <RouteErrorComponent
                message="Failed to load analytics"
                backUrl="/business"
              />
            ),
          },
          {
            path: 'reviews',
            Component: BusinessReviews,
            errorElement: (
              <RouteErrorComponent
                message="Failed to load reviews"
                backUrl="/business"
              />
            ),
          },
          {
            path: 'logistics',
            Component: BusinessLogistics,
            errorElement: (
              <RouteErrorComponent
                message="Failed to load logistics"
                backUrl="/business"
              />
            ),
          },
          {
            path: 'settings',
            Component: BusinessSettings,
            errorElement: (
              <RouteErrorComponent
                message="Failed to load settings"
                backUrl="/business"
              />
            ),
          },
          {
            path: 'notifications',
            Component: BusinessNotifications,
            errorElement: (
              <RouteErrorComponent
                message="Failed to load notifications"
                backUrl="/business"
              />
            ),
          },
          {
            path: 'vendors',
            Component: VendorSearch,
            errorElement: (
              <RouteErrorComponent
                message="Failed to load vendors"
                backUrl="/business"
              />
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
      <RouteErrorComponent
        title="Page Error"
        message="Something went wrong"
        backUrl="/"
        fullPage
      />
    ),
    children: [
      // Public routes
      {
        index: true,
        Component: Home,
        errorElement: (
          <RouteErrorComponent
            message="Failed to load home page"
            backUrl="/"
          />
        ),
      },
      {
        path: 'products',
        Component: Products,
        errorElement: (
          <RouteErrorComponent
            message="Failed to load products"
            backUrl="/"
          />
        ),
      },
      {
        path: 'product/:id',
        Component: ProductDetail,
        errorElement: (
          <RouteErrorComponent
            message="Failed to load product details"
            backUrl="/products"
            backLabel="Back to Products"
          />
        ),
      },
      {
        path: 'deals',
        Component: Deals,
        errorElement: (
          <RouteErrorComponent
            message="Failed to load deals"
            backUrl="/"
          />
        ),
      },
      {
        path: 'cart',
        Component: Cart,
        errorElement: (
          <RouteErrorComponent
            message="Failed to load cart"
            backUrl="/"
          />
        ),
      },
      {
        path: 'wishlist',
        Component: Wishlist,
        errorElement: (
          <RouteErrorComponent
            message="Failed to load wishlist"
            backUrl="/"
          />
        ),
      },
      {
        path: 'help',
        Component: Help,
        errorElement: (
          <RouteErrorComponent
            message="Failed to load help"
            backUrl="/"
          />
        ),
      },
      {
        path: 'contact',
        Component: Contact,
        errorElement: (
          <RouteErrorComponent
            message="Failed to load contact"
            backUrl="/"
          />
        ),
      },
      {
        path: 'vendors',
        Component: VendorSearch,
        errorElement: (
          <RouteErrorComponent
            message="Failed to load vendors"
            backUrl="/"
          />
        ),
      },

      // Protected routes
      {
        element: <PrivateRoute />,
        errorElement: (
          <RouteErrorComponent
            title="Authentication Error"
            message="You must be logged in to access this page"
            backUrl="/login"
            backLabel="Go to Login"
            fullPage
          />
        ),
        children: [
          {
            path: 'account',
            Component: Account,
            errorElement: (
              <RouteErrorComponent
                message="Failed to load account"
                backUrl="/"
              />
            ),
          },
          {
            path: 'checkout',
            Component: Checkout,
            errorElement: (
              <RouteErrorComponent
                message="Failed to load checkout"
                backUrl="/cart"
                backLabel="Back to Cart"
              />
            ),
          },
          {
            path: 'order-confirmation',
            Component: OrderConfirmation,
            errorElement: (
              <RouteErrorComponent
                message="Failed to load order confirmation"
                backUrl="/"
              />
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