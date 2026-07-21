import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Store,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Star,
  Truck,
} from 'lucide-react';
import { cn } from '../../components/ui/utils';

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number;
}

export function BusinessSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const mainNavItems: NavItem[] = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/business/dashboard' },
    { label: 'Inventory', icon: Package, path: '/business/inventory' },
    { label: 'Orders', icon: ShoppingCart, path: '/business/orders', badge: 6 },
    { label: 'Storefront', icon: Store, path: '/business/storefront' },
    { label: 'Analytics', icon: BarChart3, path: '/business/analytics' },
    { label: 'Reviews', icon: Star, path: '/business/reviews' },
    { label: 'Logistics', icon: Truck, path: '/business/logistics' },
  ];

  const bottomNavItems: NavItem[] = [
    { label: 'Notifications', icon: Bell, path: '/business/notifications' },
    { label: 'Settings', icon: Settings, path: '/business/settings' },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-gradient-to-r from-[#2D1B25] to-[#1a0f15] border-b border-[#4A3A45] z-40 flex items-center px-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-[#4A3A45] rounded-lg transition-colors text-white"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
        <div className="ml-auto text-xs text-gray-400">Business Portal</div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-[#2D1B25] to-[#1a0f15] border-r border-[#4A3A45] flex flex-col transition-all duration-300 z-40',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-[#4A3A45]">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#2DD4BF] to-[#0D9488] flex items-center justify-center text-white font-bold text-xs">
                N
              </div>
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#E91E63] to-[#A81E54] flex items-center justify-center text-white font-bold text-xs">
                D
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white text-sm">NDEKO</span>
              <span className="text-[10px] text-gray-400">Business</span>
            </div>
          </div>
        </div>

        {/* Store Info */}
        <div className="p-4 border-b border-[#4A3A45]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E91E63] to-[#A81E54] flex items-center justify-center text-white font-bold text-sm">
              TH
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white text-sm truncate">
                TechHub Lagos
              </p>
              <p className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                Active Store
              </p>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium group relative',
                    active
                      ? 'bg-[#A81E54] text-white shadow-lg shadow-[#A81E54]/30'
                      : 'text-gray-400 hover:bg-[#4A3A45] hover:text-white'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4.5 h-4.5 transition-transform group-hover:scale-110',
                      active && 'text-white'
                    )}
                  />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="bg-[#E91E63] text-white text-xs px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                  {active && (
                    <ChevronRight
                      className="w-4 h-4 transition-transform group-hover:translate-x-1"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t border-[#4A3A45] p-4 space-y-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium',
                  active
                    ? 'bg-[#A81E54] text-white'
                    : 'text-gray-400 hover:bg-[#4A3A45] hover:text-white'
                )}
              >
                <Icon className="w-4.5 h-4.5" />
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            );
          })}

          {/* Sign Out */}
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-[#4A3A45] hover:text-white transition-all duration-200 text-sm font-medium">
            <LogOut className="w-4.5 h-4.5" />
            <span className="flex-1 text-left">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content offset - only on desktop */}
      <div className="hidden lg:block w-64" />
    </>
  );
}