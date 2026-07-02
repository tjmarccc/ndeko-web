import { createBrowserRouter, useLocation, Navigate, Outlet } from 'react-router';
import { useEffect } from 'react';
import { Layout } from './components/Layout';
import { BusinessLayout } from './components/BusinessLayout';
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
import { BusinessDashboard } from './pages/business/BusinessDashboard';
import { BusinessInventory } from './pages/business/BusinessInventory';
import { BusinessOrders } from './pages/business/BusinessOrders';
import { BusinessStorefront } from './pages/business/BusinessStorefront';
import { BusinessAnalytics } from './pages/business/BusinessAnalytics';
import { BusinessSettings } from './pages/business/BusinessSettings';
import { BusinessNotifications } from './pages/business/BusinessNotifications';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';

// ── Scroll to top on every route change ───────────────────────────────────────
function useScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
}

// ── Shared providers ──────────────────────────────────────────────────────────
function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          {children}
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

// ── PrivateRoute — waits for auth to resolve; only redirects when confirmed unauthenticated ──
function PrivateRoute() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();

  if (loading) {
    // Auth is still resolving (token refresh in flight) — render nothing rather than redirecting
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-full border-2 border-[#8B1538] border-t-transparent animate-spin"
          />
          <p className="text-sm text-gray-400">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Auth definitively failed — redirect to login, preserving intended destination
    return <Navigate to={`/login?redirect=${encodeURIComponent(pathname)}`} replace />;
  }

  return <Outlet />;
}

// ── Root layouts (each calls useScrollToTop) ──────────────────────────────────
function LoginRoot() {
  useScrollToTop();
  return (
    <Providers>
      <Login />
    </Providers>
  );
}

function BusinessRoot() {
  useScrollToTop();
  return (
    <Providers>
      <PrivateRoute />
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

// ── Router ────────────────────────────────────────────────────────────────────
export const router = createBrowserRouter([
  {
    path: '/login',
    Component: LoginRoot,
  },

  {
    path: '/business',
    Component: BusinessRoot,
    children: [
      {
        // All /business/* routes are protected — PrivateRoute is the parent outlet
        element: <BusinessLayout />,
        children: [
          { index: true, Component: BusinessDashboard },
          { path: 'inventory', Component: BusinessInventory },
          { path: 'orders', Component: BusinessOrders },
          { path: 'storefront', Component: BusinessStorefront },
          { path: 'analytics', Component: BusinessAnalytics },
          { path: 'settings', Component: BusinessSettings },
          { path: 'notifications', Component: BusinessNotifications },
          { path: 'vendors', Component: VendorSearch },
        ],
      },
    ],
  },

  {
    path: '/',
    Component: BuyerRoot,
    children: [
      { index: true, Component: Home },
      { path: 'products', Component: Products },
      { path: 'product/:id', Component: ProductDetail },
      { path: 'cart', Component: Cart },
      { path: 'deals', Component: Deals },
      { path: 'wishlist', Component: Wishlist },
      { path: 'help', Component: Help },
      { path: 'contact', Component: Contact },
      { path: 'vendors', Component: VendorSearch },

      // ── Protected routes ──
      {
        element: <PrivateRoute />,
        children: [
          { path: 'account', Component: Account },
          { path: 'checkout', Component: Checkout },
          { path: 'order-confirmation', Component: OrderConfirmation },
        ],
      },

      { path: '*', Component: NotFound },
    ],
  },
]);