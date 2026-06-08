import { createBrowserRouter, Outlet } from 'react-router';
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

// ── Shared provider wrapper used by every layout tree ─────────────────────────
// AuthProvider needs useNavigate(), which only works inside the router tree.
// Wrapping here (inside a route element) satisfies that requirement.
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

// ── Per-tree root layouts ─────────────────────────────────────────────────────
// Each layout tree gets its own Providers wrapper so all three trees
// (login, business, buyer) have access to auth/cart/wishlist context.

function LoginRoot() {
  return (
    <Providers>
      <Login />
    </Providers>
  );
}

function BusinessRoot() {
  return (
    <Providers>
      <BusinessLayout />
    </Providers>
  );
}

function BuyerRoot() {
  return (
    <Providers>
      <Layout />
    </Providers>
  );
}

export const router = createBrowserRouter([
  // Login — standalone (no buyer header/footer)
  {
    path: '/login',
    Component: LoginRoot,
  },

  // Business portal — own layout
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

  // Buyer store — main layout
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