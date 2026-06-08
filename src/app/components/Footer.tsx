import { Link } from 'react-router';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { NdekoLogo } from './NdekoLogo';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="container mx-auto px-4 py-12">
        {/* Brand section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 pb-8 border-b border-gray-800 gap-6">
          <div className="flex flex-col gap-3">
            <NdekoLogo size="sm" showTagline={true} />
            <p className="text-gray-400 text-sm max-w-xs mt-1">
              Nigeria's fastest-growing marketplace. Shop smart, save big.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login?role=business"
              className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #8B1538, #D4828F)', color: 'white' }}
            >
              Start Selling on Ndeko
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white font-semibold mb-4">About Ndeko Express</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-white">About us</Link></li>
              <li><Link to="/careers" className="hover:text-white">Careers</Link></li>
              <li><Link to="/press" className="hover:text-white">Press & News</Link></li>
              <li><Link to="/terms" className="hover:text-white">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-white font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/help" className="hover:text-white">Help Center</Link></li>
              <li><Link to="/contact" className="hover:text-white">Contact Us</Link></li>
              <li><Link to="/returns" className="hover:text-white">Returns & Refunds</Link></li>
              <li><Link to="/shipping" className="hover:text-white">Shipping Info</Link></li>
              <li><Link to="/track" className="hover:text-white">Track Order</Link></li>
            </ul>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-white font-semibold mb-4">Shop</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/products?category=electronics" className="hover:text-white">Electronics</Link></li>
              <li><Link to="/products?category=fashion" className="hover:text-white">Fashion</Link></li>
              <li><Link to="/products?category=home" className="hover:text-white">Home & Kitchen</Link></li>
              <li><Link to="/products?category=sports" className="hover:text-white">Sports</Link></li>
              <li><Link to="/deals" className="hover:text-white">Today's Deals</Link></li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="text-white font-semibold mb-4">Connect With Us</h3>
            <div className="flex gap-4 mb-6">
              <a href="#" className="hover:text-white">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-white">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-white">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-white">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
            <div className="text-sm">
              <p className="mb-2">Download our app</p>
              <div className="flex flex-col gap-2">
                <div className="bg-black text-white px-4 py-2 rounded cursor-pointer hover:bg-gray-800">
                  App Store
                </div>
                <div className="bg-black text-white px-4 py-2 rounded cursor-pointer hover:bg-gray-800">
                  Google Play
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; 2026 Ndeko Express. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}