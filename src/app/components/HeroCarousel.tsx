import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Rich composed first slide inspired by split-panel showcase design
function ComposedSlide1() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Three-panel split background */}
      <div className="absolute inset-0 flex">
        {/* Left panel — deep maroon */}
        <div className="relative overflow-hidden" style={{ width: '38%', background: '#2A0812' }}>
          <img
            src="https://images.unsplash.com/photo-1637868796504-32f45a96d5a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80"
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center"
            style={{ mixBlendMode: 'luminosity', opacity: 0.55 }}
          />
          {/* Inner right edge fade */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, transparent 60%, #2A0812 100%)' }} />
          {/* Bottom shade */}
          <div className="absolute bottom-0 left-0 right-0 h-1/3" style={{ background: 'linear-gradient(to top, #2A0812, transparent)' }} />
        </div>

        {/* Center panel — very dark blend */}
        <div
          className="relative overflow-hidden flex items-center justify-center"
          style={{ width: '24%', background: '#1A050C' }}
        >
          {/* Huge watermark "50%" text */}
          <div
            className="absolute select-none pointer-events-none"
            style={{
              fontSize: 'clamp(100px, 18vw, 240px)',
              fontWeight: 900,
              color: 'rgba(212,130,143,0.08)',
              letterSpacing: '-0.06em',
              lineHeight: 1,
              userSelect: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            50%
          </div>
        </div>

        {/* Right panel — deep teal */}
        <div className="relative overflow-hidden" style={{ width: '38%', background: '#0C2922' }}>
          <img
            src="https://images.unsplash.com/photo-1741653216863-c3e2c4c84203?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80"
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center"
            style={{ mixBlendMode: 'luminosity', opacity: 0.5 }}
          />
          {/* Inner left edge fade */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to left, transparent 60%, #0C2922 100%)' }} />
          {/* Bottom shade */}
          <div className="absolute bottom-0 left-0 right-0 h-1/3" style={{ background: 'linear-gradient(to top, #0C2922, transparent)' }} />
          {/* Teal color overlay */}
          <div className="absolute inset-0" style={{ background: 'rgba(61,155,142,0.12)' }} />
        </div>
      </div>

      {/* Divider accents */}
      <div className="absolute top-0 bottom-0 w-px" style={{ left: '38%', background: 'linear-gradient(to bottom, transparent, rgba(212,130,143,0.4), transparent)' }} />
      <div className="absolute top-0 bottom-0 w-px" style={{ left: '62%', background: 'linear-gradient(to bottom, transparent, rgba(61,155,142,0.4), transparent)' }} />

      {/* Center glow */}
      <div className="absolute pointer-events-none" style={{
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400, height: 300,
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(139,21,56,0.25) 0%, transparent 70%)',
        filter: 'blur(40px)',
      }} />

      {/* Bottom gradient for text readability */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)' }} />
    </div>
  );
}

const slides = [
  {
    id: 1,
    type: 'composed' as const,
    headline: 'Shop Smart,\nSave Big',
    subheadline: "Nigeria's fastest-growing marketplace. Deals that make sense.",
    cta: 'Explore Deals',
    ctaLink: '/deals',
    badge: '🔥 UP TO 50% OFF',
    accentColor: '#D4828F',
    secondaryCtaLink: '/products',
    // Right-side big text overlay
    bigText: 'Up to\n50% Off',
  },
  {
    id: 2,
    type: 'image' as const,
    src: 'https://images.unsplash.com/photo-1761370571873-5d869310d731?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwc2hvcHBpbmclMjBsaWZlc3R5bGUlMjBOaWdlcmlhfGVufDF8fHx8MTc3NzU1MTg2OXww&ixlib=rb-4.1.0&q=80&w=1080',
    headline: 'Style That\nSpeaks',
    subheadline: 'Trending fashion for every occasion. Look good, feel great.',
    cta: 'Shop Fashion',
    ctaLink: '/products?category=fashion',
    badge: '✨ NEW ARRIVALS',
    accentColor: '#D4828F',
    gradientFrom: '#4A0E1F',
    gradientTo: '#8B1538',
    secondaryCtaLink: '/products',
    bigText: '',
  },
  {
    id: 3,
    type: 'image' as const,
    src: 'https://images.unsplash.com/photo-1762401244552-9eb61a7f9416?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJvbmljcyUyMGdhZGdldHMlMjBtb2Rlcm4lMjB0ZWNoJTIwc3RvcmV8ZW58MXx8fHwxNzc3NTUxODcwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    headline: 'Next-Gen\nTech Awaits',
    subheadline: 'Top electronics at unbeatable prices. Upgrade your world.',
    cta: 'Shop Electronics',
    ctaLink: '/products?category=electronics',
    badge: '⚡ FLASH DEALS',
    accentColor: '#3D9B8E',
    gradientFrom: '#0D2137',
    gradientTo: '#1B3A5C',
    secondaryCtaLink: '/products',
    bigText: '',
  },
  {
    id: 4,
    type: 'image' as const,
    src: 'https://images.unsplash.com/photo-1642979427252-13d5fd18bb61?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob21lJTIwYXBwbGlhbmNlcyUyMGtpdGNoZW4lMjBtb2Rlcm58ZW58MXx8fHwxNzc3NTUxODcwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    headline: 'Home Is Where\nThe Heart Is',
    subheadline: 'Premium home appliances & décor for the modern Nigerian home.',
    cta: 'Shop Home',
    ctaLink: '/products?category=home',
    badge: '🏠 HOME PICKS',
    accentColor: '#3D9B8E',
    gradientFrom: '#0D2B24',
    gradientTo: '#1C4A3E',
    secondaryCtaLink: '/products',
    bigText: '',
  },
  {
    id: 5,
    type: 'image' as const,
    src: 'https://images.unsplash.com/photo-1758612215034-02c23a576afc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbmxpbmUlMjBzaG9wcGluZyUyMHdvbWFuJTIwc21pbGluZyUyMGRlYWxzfGVufDF8fHx8MTc3NzU1MTg3Mnww&ixlib=rb-4.1.0&q=80&w=1080',
    headline: '10% Cashback\nEvery Order',
    subheadline: 'Use code WELCOME10 on orders over ₦20,000. Start saving today.',
    cta: 'Claim Cashback',
    ctaLink: '/deals',
    badge: '💰 WELCOME10',
    accentColor: '#D4828F',
    gradientFrom: '#8B1538',
    gradientTo: '#C4526A',
    secondaryCtaLink: '/products',
    bigText: '',
  },
  {
    id: 6,
    type: 'image' as const,
    src: 'https://images.unsplash.com/photo-1654973433534-1238e06f6b38?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBiZWF1dHklMjBjb3NtZXRpY3MlMjBwcm9kdWN0c3xlbnwxfHx8fDE3Nzc1NTE4NzV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    headline: 'Beauty &\nSelf-Care',
    subheadline: 'Premium cosmetics & wellness products delivered to your door.',
    cta: 'Shop Beauty',
    ctaLink: '/products?category=beauty',
    badge: '💄 TOP BRANDS',
    accentColor: '#D4828F',
    gradientFrom: '#5C1430',
    gradientTo: '#8B1538',
    secondaryCtaLink: '/products',
    bigText: '',
  },
];

type Slide = typeof slides[0];

export function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [contentKey, setContentKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (index: number) => {
    setCurrent(index);
    setContentKey((k) => k + 1);
  };
  const next = () => goTo((current + 1) % slides.length);
  const prev = () => goTo((current - 1 + slides.length) % slides.length);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!isHovered) {
      timerRef.current = setInterval(() => {
        setCurrent((c) => {
          const n = (c + 1) % slides.length;
          setContentKey((k) => k + 1);
          return n;
        });
      }, 5500);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isHovered]);

  const slide = slides[current] as Slide;

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ height: 'clamp(460px, 78vh, 720px)' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Slide track */}
      <div
        className="flex h-full"
        style={{
          width: `${slides.length * 100}%`,
          transform: `translateX(-${(current * 100) / slides.length}%)`,
          transition: 'transform 0.75s cubic-bezier(0.77, 0, 0.175, 1)',
        }}
      >
        {slides.map((s, i) => (
          <div key={s.id} className="relative flex-shrink-0" style={{ width: `${100 / slides.length}%` }}>
            {s.type === 'composed' ? (
              <ComposedSlide1 />
            ) : (
              <>
                <img
                  src={(s as any).src}
                  alt={s.headline}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(to right, ${(s as any).gradientFrom}e6 0%, ${(s as any).gradientTo}99 40%, transparent 75%)`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </>
            )}
          </div>
        ))}
      </div>

      {/* Animated content */}
      <div key={contentKey} className="absolute inset-0 flex items-center" style={{ zIndex: 10 }}>
        <div className="container mx-auto px-6 md:px-14 lg:px-20">
          {/* Slide 1: split text layout with big right-side text */}
          {slide.type === 'composed' ? (
            <div className="flex items-center justify-between w-full">
              {/* Left: main content */}
              <div className="max-w-md">
                {slide.badge && (
                  <div
                    className="hero-anim-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-sm font-semibold"
                    style={{
                      background: `${slide.accentColor}2a`,
                      border: `1.5px solid ${slide.accentColor}`,
                      color: 'white',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    {slide.badge}
                  </div>
                )}
                <h1
                  className="hero-anim-3 mb-3 text-white"
                  style={{
                    fontSize: 'clamp(2.4rem, 5.5vw, 4rem)',
                    fontWeight: 900,
                    lineHeight: 1.08,
                    letterSpacing: '-0.03em',
                    whiteSpace: 'pre-line',
                    textShadow: '0 3px 24px rgba(0,0,0,0.5)',
                  }}
                >
                  {slide.headline}
                </h1>
                <p
                  className="hero-anim-4 mb-7 text-white/80"
                  style={{
                    fontSize: 'clamp(0.9rem, 1.8vw, 1.1rem)',
                    textShadow: '0 1px 10px rgba(0,0,0,0.3)',
                    maxWidth: 380,
                  }}
                >
                  {slide.subheadline}
                </p>
                <div className="hero-anim-5 flex items-center gap-3 flex-wrap">
                  <Link
                    to={slide.ctaLink}
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-bold transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{
                      background: slide.accentColor,
                      color: 'white',
                      boxShadow: `0 8px 32px ${slide.accentColor}70`,
                    }}
                  >
                    {slide.cta}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to={slide.secondaryCtaLink}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white border border-white/40 hover:bg-white/10 transition-all duration-200 backdrop-blur-sm"
                  >
                    Browse All
                  </Link>
                </div>
              </div>

              {/* Right: large decorative "Up to 50% Off" text */}
              <div
                className="hero-anim-3 hidden md:block text-right select-none"
                style={{ pointerEvents: 'none' }}
              >
                <p
                  className="text-white/30"
                  style={{ fontSize: 'clamp(1rem, 2vw, 1.4rem)', fontWeight: 300, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}
                >
                  Up to
                </p>
                <div
                  className="text-white"
                  style={{
                    fontSize: 'clamp(5rem, 12vw, 9rem)',
                    fontWeight: 900,
                    lineHeight: 0.9,
                    letterSpacing: '-0.05em',
                    textShadow: '0 4px 40px rgba(212,130,143,0.4)',
                    background: 'linear-gradient(135deg, #ffffff 30%, #D4828F 70%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  50%
                </div>
                <div
                  className="text-white/60"
                  style={{
                    fontSize: 'clamp(2rem, 4.5vw, 3.5rem)',
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                    marginTop: 4,
                  }}
                >
                  Off
                </div>
                <p className="text-white/40 text-sm mt-3 tracking-widest uppercase">Shop Ndeko Express</p>
              </div>
            </div>
          ) : (
            /* Standard slide layout */
            <div className="max-w-lg">
              {slide.badge && (
                <div
                  className="hero-anim-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-sm font-semibold"
                  style={{
                    background: `${slide.accentColor}2a`,
                    border: `1.5px solid ${slide.accentColor}`,
                    color: 'white',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  {slide.badge}
                </div>
              )}
              <h1
                className="hero-anim-3 mb-3 text-white"
                style={{
                  fontSize: 'clamp(2.2rem, 5.5vw, 3.8rem)',
                  fontWeight: 900,
                  lineHeight: 1.08,
                  letterSpacing: '-0.03em',
                  whiteSpace: 'pre-line',
                  textShadow: '0 3px 24px rgba(0,0,0,0.45)',
                }}
              >
                {slide.headline}
              </h1>
              <p
                className="hero-anim-4 mb-7 text-white/80"
                style={{
                  fontSize: 'clamp(0.9rem, 1.8vw, 1.1rem)',
                  textShadow: '0 1px 10px rgba(0,0,0,0.3)',
                  maxWidth: 400,
                }}
              >
                {slide.subheadline}
              </p>
              <div className="hero-anim-5 flex items-center gap-3 flex-wrap">
                <Link
                  to={slide.ctaLink}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-bold transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{
                    background: slide.accentColor,
                    color: 'white',
                    boxShadow: `0 8px 32px ${slide.accentColor}70`,
                  }}
                >
                  {slide.cta}
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <Link
                  to={slide.secondaryCtaLink}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white border border-white/40 hover:bg-white/10 transition-all duration-200 backdrop-blur-sm"
                >
                  Browse All
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slide Counter */}
      <div className="absolute top-5 right-5 text-white/65 text-xs font-semibold tracking-widest" style={{ zIndex: 20 }}>
        {String(current + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
      </div>

      {/* Prev / Next */}
      <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all duration-200"
        style={{ zIndex: 20, background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.28)', backdropFilter: 'blur(10px)' }}
        aria-label="Previous"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all duration-200"
        style={{ zIndex: 20, background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.28)', backdropFilter: 'blur(10px)' }}
        aria-label="Next"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2" style={{ zIndex: 20 }}>
        {slides.map((s, i) => (
          <button key={s.id} onClick={() => goTo(i)} aria-label={`Slide ${i + 1}`}
            style={{
              width: i === current ? 30 : 8, height: 8, borderRadius: 99,
              background: i === current ? 'white' : 'rgba(255,255,255,0.4)',
              transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: i === current ? '0 0 0 2px rgba(255,255,255,0.35)' : 'none',
              border: 'none', cursor: 'pointer', padding: 0,
            }}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-[3px]" style={{
        zIndex: 20,
        background: `linear-gradient(to right, ${slide.accentColor}, rgba(255,255,255,0.6))`,
        animation: isHovered ? 'none' : 'ndeko-progress 5.5s linear infinite',
      }} />

      <style>{`
        @keyframes ndeko-progress { from { width: 0%; } to { width: 100%; } }
        .hero-anim-1 { animation: heroSlideUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.05s both; }
        .hero-anim-2 { animation: heroSlideUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.12s both; }
        .hero-anim-3 { animation: heroSlideUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.22s both; }
        .hero-anim-4 { animation: heroSlideUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.32s both; }
        .hero-anim-5 { animation: heroSlideUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.42s both; }
        @keyframes heroSlideUp {
          from { opacity: 0; transform: translateY(26px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}