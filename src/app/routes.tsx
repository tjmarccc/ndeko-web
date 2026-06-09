import { createBrowserRouter, useLocation } from 'react-router';
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
import { AuthProvider } from './contexts/AuthContext';
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
      <BusinessLayout />
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

  {
    path: '/',
    Component: BuyerRoot,
    children: [
      { index: true, Component: Home },
      { path: 'products', Component: Products },
      { path: 'product/:id', Component: ProductDetail },
      { path: 'cart', Component: Cart },
      { path: 'checkout', Component: Checkout },
      { path: 'order-confirmation', Component: OrderConfirmation },
      { path: 'deals', Component: Deals },
      { path: 'account', Component: Account },
      { path: 'wishlist', Component: Wishlist },
      { path: 'help', Component: Help },
      { path: 'contact', Component: Contact },
      { path: 'vendors', Component: VendorSearch },
      { path: '*', Component: NotFound },
    ],
  },
]);