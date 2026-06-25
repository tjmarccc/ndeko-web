import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router';
import { ChevronLeft, ChevronRight, Zap, Star, ShoppingCart, Heart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { toast } from 'sonner';
import type { Product } from '../types/product';

interface FlashDealsCarouselProps {
  products: Product[];
}

function CountdownTimer() {
  const [time, setTime] = useState({ h: 5, m: 47, s: 22 });

  useEffect(() => {
    const t = setInterval(() => {
      setTime((prev) => {
        let { h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-white/70 text-xs mr-1">Ends in</span>
      {[pad(time.h), pad(time.m), pad(time.s)].map((val, i) => (
        <span key={i} className="flex items-center gap-1">
          <span
            className="text-sm font-bold text-white px-2 py-1 rounded"
            style={{ background: 'rgba(255,255,255,0.15)', minWidth: 32, textAlign: 'center' }}
          >
            {val}
          </span>
          {i < 2 && <span className="text-white/70 font-bold text-sm">:</span>}
        </span>
      ))}
    </div>
  );
}

function DealCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const wished = isInWishlist(product.id);

  return (
    <div
      className="flex-shrink-0 relative group rounded-2xl overflow-hidden"
      style={{
        width: 210,
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.13)',
        backdropFilter: 'blur(12px)',
        transition: 'transform 0.25s, box-shadow 0.25s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 20px 50px rgba(0,0,0,0.45)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      {/* Wishlist */}
      <button
        onClick={() => { toggleWishlist(product); }}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
        style={{
          background: wished ? '#D4828F' : 'rgba(255,255,255,0.18)',
          backdropFilter: 'blur(6px)',
        }}
        aria-label="Wishlist"
      >
        <Heart className="h-4 w-4" fill={wished ? 'white' : 'none'} stroke="white" />
      </button>

      {/* Discount badge */}
      {product.discount && (
        <div
          className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded-full text-xs font-bold text-white"
          style={{ background: '#8B1538' }}
        >
          -{product.discount}%
        </div>
      )}

      {/* Image */}
      <Link to={`/product/${product.id}`}>
        <div className="relative overflow-hidden" style={{ height: 170 }}>
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      </Link>

      {/* Info */}
      <div className="p-3">
        {/* Rating */}
        <div className="flex items-center gap-1 mb-1.5">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="h-3 w-3"
                fill={i < Math.floor(product.rating) ? '#F59E0B' : 'none'}
                stroke={i < Math.floor(product.rating) ? '#F59E0B' : 'rgba(255,255,255,0.3)'}
              />
            ))}
          </div>
          <span className="text-white/50 text-xs">({product.reviews})</span>
        </div>

        <Link to={`/product/${product.id}`}>
          <h3
            className="text-white text-sm font-semibold mb-2 leading-snug hover:text-[#D4828F] transition-colors line-clamp-2"
            style={{ minHeight: 36 }}
          >
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-[#D4828F] font-bold" style={{ fontSize: 15 }}>
            ₦{product.price.toLocaleString()}
          </span>
          {product.originalPrice && (
            <span className="text-white/35 text-xs line-through">
              ₦{product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>

        {/* Add to cart */}
        <button
          onClick={() => {
            addToCart(product);
            toast.success(`${product.name} added to cart!`);
          }}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all duration-200 hover:brightness-110 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #D4828F, #8B1538)', color: 'white' }}
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export function FlashDealsCarousel({ products }: FlashDealsCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const CARD_W = 210 + 16; // card width + gap

  const checkScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll();
    return () => el.removeEventListener('scroll', checkScroll);
  }, [checkScroll]);

  const scroll = (dir: 'left' | 'right') => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'right' ? CARD_W * 3 : -CARD_W * 3, behavior: 'smooth' });
  };

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1a0008 0%, #3D0B1E 30%, #8B1538 60%, #C4526A 80%, #3D9B8E 100%)',
      }}
    >
      {/* Glowing orbs */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-80px', left: '-80px',
          width: 320, height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,130,143,0.3) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '-60px', right: '10%',
          width: 280, height: 280,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(61,155,142,0.35) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: '30%', left: '50%',
          width: 200, height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,21,56,0.4) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(14)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
              background: i % 2 === 0 ? 'rgba(212,130,143,0.6)' : 'rgba(61,155,142,0.5)',
              left: `${(i * 7.2) % 100}%`,
              top: `${(i * 13.5) % 100}%`,
              animation: `floatParticle ${3 + (i % 4)}s ease-in-out ${i * 0.4}s infinite alternate`,
            }}
          />
        ))}
      </div>

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative container mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-7 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {/* Pulsing icon */}
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full animate-ping"
                style={{ background: 'rgba(212,130,143,0.4)' }}
              />
              <div
                className="relative w-11 h-11 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #D4828F, #8B1538)' }}
              >
                <Zap className="h-5 w-5 text-white" fill="white" />
              </div>
            </div>
            <div>
              <h2
                className="text-white"
                style={{ fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: 900, letterSpacing: '-0.02em' }}
              >
                Flash Deals
              </h2>
              <p className="text-white/55 text-xs">Limited time — grab them before they're gone!</p>
            </div>
          </div>

          <div className="flex items-center gap-6 flex-wrap">
            <CountdownTimer />

            <Link
              to="/deals"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1.5px solid rgba(255,255,255,0.25)',
                color: 'white',
                backdropFilter: 'blur(8px)',
              }}
            >
              View All
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Carousel track */}
        <div className="relative">
          {/* Left fade */}
          {canPrev && (
            <div
              className="absolute left-0 top-0 bottom-0 w-16 pointer-events-none"
              style={{
                background: 'linear-gradient(to right, rgba(26,0,8,0.8), transparent)',
                zIndex: 5,
              }}
            />
          )}
          {/* Right fade */}
          {canNext && (
            <div
              className="absolute right-0 top-0 bottom-0 w-16 pointer-events-none"
              style={{
                background: 'linear-gradient(to left, rgba(26,0,8,0.8), transparent)',
                zIndex: 5,
              }}
            />
          )}

          {/* Scrollable track */}
          <div
            ref={trackRef}
            className="flex gap-4 overflow-x-auto pb-3"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              paddingLeft: 2,
              paddingRight: 2,
            }}
          >
            {products.map((product) => (
              <DealCard key={product.id} product={product} />
            ))}
          </div>

          {/* Prev arrow */}
          {canPrev && (
            <button
              onClick={() => scroll('left')}
              className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110 active:scale-95 shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, #8B1538, #D4828F)',
                boxShadow: '0 8px 30px rgba(139,21,56,0.5)',
              }}
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {/* Next arrow */}
          {canNext && (
            <button
              onClick={() => scroll('right')}
              className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110 active:scale-95 shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, #D4828F, #8B1538)',
                boxShadow: '0 8px 30px rgba(139,21,56,0.5)',
              }}
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes floatParticle {
          from { transform: translateY(0px) scale(1); opacity: 0.6; }
          to   { transform: translateY(-18px) scale(1.3); opacity: 1; }
        }
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  );
}