import { Link } from 'react-router';
import { Home, Search, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';

export function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg text-center">

        {/* ── Illustration ── */}
        <div className="relative mx-auto mb-8 w-48 h-48 sm:w-64 sm:h-64">
          {/* outer ring */}
          <div className="absolute inset-0 rounded-full bg-[#8B1538]/8 dark:bg-[#8B1538]/15 animate-pulse" />
          {/* inner ring */}
          <div className="absolute inset-6 rounded-full bg-[#8B1538]/12 dark:bg-[#8B1538]/20" />
          {/* core */}
          <div className="absolute inset-12 rounded-full bg-gradient-to-br from-[#8B1538] to-[#D4828F] flex items-center justify-center shadow-xl shadow-[#8B1538]/30">
            <Search className="h-10 w-10 sm:h-12 sm:w-12 text-white" strokeWidth={1.5} />
          </div>

          {/* floating 404 badge */}
          <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 bg-white dark:bg-gray-800 border-2 border-[#8B1538]/20 rounded-2xl px-3 py-1.5 shadow-lg">
            <span className="text-[#8B1538] font-black text-lg sm:text-2xl tracking-tight">404</span>
          </div>
        </div>

        {/* ── Copy ── */}
        <h1 className="text-2xl sm:text-3xl font-bold dark:text-white mb-3 tracking-tight">
          Page Not Found
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base leading-relaxed max-w-sm mx-auto mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back on track.
        </p>

        {/* ── Actions ── */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Button asChild className="bg-[#8B1538] hover:bg-[#6B0F2A] w-full sm:w-auto h-11 px-6 text-sm font-semibold shadow-md shadow-[#8B1538]/20">
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Link>
          </Button>
          <Button
            variant="outline"
            asChild
            className="border-[#8B1538]/40 text-[#8B1538] hover:bg-[#FDF2F4] dark:hover:bg-[#8B1538]/10 dark:text-[#D4828F] dark:border-[#D4828F]/30 w-full sm:w-auto h-11 px-6 text-sm font-semibold"
          >
            <Link to="/products">
              <Search className="h-4 w-4 mr-2" />
              Browse Products
            </Link>
          </Button>
        </div>

        {/* ── Back link ── */}
        <button
          onClick={() => window.history.back()}
          className="mt-6 inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#8B1538] dark:hover:text-[#D4828F] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Go back to previous page
        </button>
      </div>
    </div>
  );
}