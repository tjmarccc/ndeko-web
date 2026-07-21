import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingBag, Store, BarChart3,
  Bell, ChevronDown, Menu, X, LogOut, Settings, ChevronRight,
  Search, Home, Users, ShoppingCart, Heart,
} from 'lucide-react';
import { NdekoLogo } from './NdekoLogo';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { label: 'Dashboard', path: '/business', icon: LayoutDashboard },
  { label: 'Inventory', path: '/business/inventory', icon: Package },
  { label: 'Orders', path: '/business/orders', icon: ShoppingBag },
  { label: 'Storefront', path: '/business/storefront', icon: Store },
  { label: 'Analytics', path: '/business/analytics', icon: BarChart3 },
  { label: 'Find Vendors', path: '/business/vendors', icon: Users },
];

const bottomNavItems = [
  { label: 'Notifications', path: '/business/notifications', icon: Bell },
  { label: 'Settings', path: '/business/settings', icon: Settings },
];

interface BusinessLayoutProps {
  children?: React.ReactNode;
}

export function BusinessLayout({ children }: BusinessLayoutProps = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activePath = location.pathname;

  const allNavItems = [...navItems, ...bottomNavItems];
  const currentPage = allNavItems.find((n) =>
    n.path === '/business' ? activePath === '/business' : activePath.startsWith(n.path)
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/business/vendors?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSignOut = async () => {
    setProfileOpen(false);
    setSidebarOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const isActive = (path: string) =>
    path === '/business' ? activePath === '/business' : activePath.startsWith(path);

  const displayName = user
    ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email
    : '—';
  const initials = user
    ? `${(user.first_name?.[0] ?? '')}${(user.last_name?.[0] ?? '')}`.toUpperCase() || '?'
    : '?';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F8F3F5', fontFamily: 'Inter, sans-serif' }}>

      {/* ══════════════════════════════════════════════════
          TOP HEADER (buyer-style, adapted for business)
      ══════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm" style={{ borderColor: 'rgba(139,21,56,0.12)' }}>
        {/* Top accent bar */}
        <div className="bg-[#8B1538] text-white py-1.5 px-4 flex items-center justify-between">
          <p className="text-xs">🏪 Business Portal — {displayName} &nbsp;·&nbsp; Active Store</p>
          <div className="flex items-center gap-4 text-xs">
            <Link to="/" className="hover:underline flex items-center gap-1 text-white/80 hover:text-white transition-colors">
              <Home className="h-3 w-3" /> Buyer Store
            </Link>
            <Link to="/vendors" className="hover:underline text-white/80 hover:text-white transition-colors">Find Vendors</Link>
            <Link to="/help" className="hover:underline text-white/80 hover:text-white transition-colors">Help</Link>
          </div>
        </div>

        {/* Main header row */}
        <div className="px-4 py-3 flex items-center gap-4">
          {/* Hamburger (mobile) */}
          <button
            className="lg:hidden p-2 rounded-xl hover:bg-[#8B1538]/10 transition-colors flex-shrink-0"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5 text-[#8B1538]" /> : <Menu className="h-5 w-5 text-[#8B1538]" />}
          </button>

          {/* Logo */}
          <Link to="/business" className="flex items-center gap-2 flex-shrink-0">
            <NdekoLogo size="sm" showTagline={false} />
            <span
              className="hidden sm:inline text-xs font-bold px-2 py-0.5 rounded-md ml-1"
              style={{ background: 'linear-gradient(135deg, #8B1538, #D4828F)', color: 'white' }}
            >
              BIZ
            </span>
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="business-nav-search"
                name="search"
                type="text"
                placeholder="Search for vendors, suppliers, or products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#8B1538]/20 focus:border-[#8B1538] transition-all"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-white text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #8B1538, #D4828F)' }}
              >
                Search
              </button>
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Go to store */}
            <Link
              to="/"
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-[#8B1538]/30 transition-all"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden lg:inline">Shop</span>
            </Link>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
            >
              <Heart className="h-4 w-4" />
            </Link>

            {/* Notifications */}
            <Link
              to="/business/notifications"
              className="relative p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
            >
              <Bell className="h-4.5 w-4.5 text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D4828F]" />
            </Link>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-gray-200 hover:shadow-sm bg-white transition-all"
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #8B1538, #D4828F)' }}
                >
                  {initials}
                </div>
                <span className="hidden md:block text-sm font-semibold text-gray-700">{displayName}</span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              </button>

              {profileOpen && (
                <div
                  className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50"
                  style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}
                >
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <p className="text-sm font-bold text-gray-800">{displayName}</p>
                    <p className="text-xs text-gray-400">{user?.email ?? ''}</p>
                  </div>
                  <Link
                    to="/business/storefront"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    onClick={() => setProfileOpen(false)}
                  >
                    <Store className="h-4 w-4 text-[#8B1538]" /> My Storefront
                  </Link>
                  <Link
                    to="/business/settings"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    onClick={() => setProfileOpen(false)}
                  >
                    <Settings className="h-4 w-4 text-gray-400" /> Settings
                  </Link>
                  <Link
                    to="/"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    onClick={() => setProfileOpen(false)}
                  >
                    <Home className="h-4 w-4 text-[#3D9B8E]" /> Go to Buyer Store
                  </Link>
                  <hr className="my-1 border-gray-100" />
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Second nav row — business navigation tabs */}
        <div className="hidden lg:flex items-center gap-1 px-6 pb-2 border-t border-gray-50 pt-2">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: active ? 'rgba(139,21,56,0.08)' : 'transparent',
                  color: active ? '#8B1538' : '#6B7280',
                  fontWeight: active ? 700 : 500,
                }}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
          <div className="ml-auto flex items-center gap-1">
            {bottomNavItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: active ? 'rgba(139,21,56,0.08)' : 'transparent',
                    color: active ? '#8B1538' : '#6B7280',
                  }}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════
          BODY: sidebar + content
      ══════════════════════════════════════════════════ */}
      <div className="flex flex-1 min-h-0">

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 lg:hidden z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar (mobile only) ── */}
        <aside
          className="fixed top-0 left-0 h-full flex flex-col lg:hidden z-40 transition-transform duration-300"
          style={{
            width: 260,
            background: 'linear-gradient(180deg, #1A0812 0%, #2D0F1E 60%, #1C3A30 100%)',
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          }}
        >
          {/* Sidebar header */}
          <div className="px-5 py-5 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <Link to="/business" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
              <NdekoLogo size="sm" showTagline={false} />
              <span className="text-white/60 text-xs font-medium ml-1">Business</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="text-white/40 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Vendor info */}
          <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #8B1538, #D4828F)' }}
              >
                {initials}
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{displayName}</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <p className="text-green-400/80 text-xs">Active Store</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group"
                  style={{
                    background: active ? 'rgba(139,21,56,0.35)' : 'transparent',
                    color: active ? 'white' : 'rgba(255,255,255,0.55)',
                    borderLeft: active ? '3px solid #D4828F' : '3px solid transparent',
                  }}
                >
                  <item.icon className="h-4.5 w-4.5 flex-shrink-0" style={{ color: active ? '#D4828F' : 'rgba(255,255,255,0.45)' }} />
                  {item.label}
                  {active && <ChevronRight className="h-3.5 w-3.5 ml-auto" style={{ color: '#D4828F' }} />}
                </Link>
              );
            })}
          </nav>

          {/* Bottom items */}
          <div className="px-3 pb-4 space-y-1 border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {bottomNavItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
                  style={{
                    background: active ? 'rgba(139,21,56,0.25)' : 'transparent',
                    color: active ? 'white' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <Link
              to="/"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all hover:bg-white/5"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              <Home className="h-4 w-4" />
              Buyer Store
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all hover:bg-white/5"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 md:p-7">
          {/* Breadcrumb / page header */}
          <div className="mb-5">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <span>Business Portal</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-[#8B1538] font-semibold">{currentPage?.label ?? 'Dashboard'}</span>
            </div>
            <h1 className="text-gray-800 font-bold" style={{ fontSize: '1.2rem' }}>
              {currentPage?.label ?? 'Dashboard'}
            </h1>
          </div>

          {children}
          <Outlet />
        </main>
      </div>
    </div>
  );
}