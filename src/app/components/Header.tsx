import { Link, useNavigate } from 'react-router';
import { ShoppingCart, Search, User, Menu, Heart, Moon, Sun, Store } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useState } from 'react';
import { NdekoLogo } from './NdekoLogo';

export function Header() {
  const { cartCount } = useCart();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b dark:border-gray-700 shadow-sm transition-colors">
      {/* Top bar */}
      <div className="bg-[#8B1538] text-white py-2">
        <div className="container mx-auto px-4 flex justify-between items-center text-sm">
          <p>Welcome to Ndeko Express! Get 10% cashback on your first order — code WELCOME10</p>
          <div className="flex gap-4">
            <Link to="/vendors" className="hover:underline font-medium">Find Vendors</Link>
            <Link to="/help" className="hover:underline">Help</Link>
            <Link to="/contact" className="hover:underline">Contact</Link>
            <Link to="/login?role=business" className="hover:underline font-semibold text-[#F9C9D2]">Sell on Ndeko</Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <NdekoLogo size="sm" showTagline={false} />
            <span className="hidden md:block font-semibold text-gray-700 dark:text-gray-200 text-sm -ml-1">Express</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search for products, brands and categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-12"
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 bg-[#8B1538] hover:bg-[#6B0F2A]"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="flex items-center gap-2"
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
              <span className="hidden md:inline">{theme === 'light' ? 'Dark' : 'Light'}</span>
            </Button>

            <Button variant="ghost" size="sm" asChild>
              <Link to="/account" className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <span className="hidden md:inline">Account</span>
              </Link>
            </Button>

            <Button variant="ghost" size="sm" asChild>
              <Link to="/wishlist" className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                <span className="hidden md:inline">Wishlist</span>
              </Link>
            </Button>

            <Button variant="ghost" size="sm" asChild className="relative">
              <Link to="/cart" className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                <span className="hidden md:inline">Cart</span>
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-[#8B1538] hover:bg-[#6B0F2A] min-w-5 h-5 flex items-center justify-center p-0 text-xs">
                    {cartCount}
                  </Badge>
                )}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Categories bar */}
      <div className="border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-6 overflow-x-auto">
            {/* This button previously had no onClick at all — it was a fully inert
                button, which is why nothing ever happened on click (no console log,
                no alert, no navigation). Now it navigates to /products with the
                category param cleared, same as picking "All Categories" in the
                Products page sidebar. */}
            <Button
              variant="ghost"
              size="sm"
              className="whitespace-nowrap"
              onClick={() => navigate('/products')}
            >
              <Menu className="h-4 w-4 mr-2" />
              All Categories
            </Button>
            <Link to="/products?category=electronics" className="text-sm hover:text-[#8B1538] dark:text-gray-300 dark:hover:text-[#D4828F] whitespace-nowrap">Electronics</Link>
            <Link to="/products?category=fashion" className="text-sm hover:text-[#8B1538] dark:text-gray-300 dark:hover:text-[#D4828F] whitespace-nowrap">Fashion</Link>
            <Link to="/products?category=home" className="text-sm hover:text-[#8B1538] dark:text-gray-300 dark:hover:text-[#D4828F] whitespace-nowrap">Home & Kitchen</Link>
            <Link to="/products?category=sports" className="text-sm hover:text-[#8B1538] dark:text-gray-300 dark:hover:text-[#D4828F] whitespace-nowrap">Sports</Link>
            <Link to="/products?category=beauty" className="text-sm hover:text-[#8B1538] dark:text-gray-300 dark:hover:text-[#D4828F] whitespace-nowrap">Beauty</Link>
            <Link to="/deals" className="text-sm text-[#D4828F] hover:text-[#8B1538] dark:hover:text-[#D4828F] font-semibold whitespace-nowrap">Today's Deals</Link>
            <Link to="/vendors" className="text-sm hover:text-[#8B1538] dark:text-gray-300 dark:hover:text-[#D4828F] whitespace-nowrap flex items-center gap-1">
              <Store className="h-3.5 w-3.5" />
              Vendors
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}