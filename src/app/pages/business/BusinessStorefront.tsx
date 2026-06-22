import { useState, useEffect, useCallback } from 'react';
import {
  Store, MapPin, Star, Package, Eye, Check, Camera,
  Loader2, AlertCircle, RefreshCw, Plus, Trash2,
  ChevronDown, ChevronUp, ShoppingBag, BarChart2,
} from 'lucide-react';
import {
  getMyStores,
  updateStore,
  fetchCategories,
  getStoreDashboard,
  type ApiStore,
  type ApiCategory,
} from '../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoreLocation {
  id: string;
  isPrimary: boolean;
  branchName: string;
  branchManager: string;
  streetAddress: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  openingHours: string;
}

interface StoreForm {
  store_name: string;
  tagline: string;
  description: string;
  category_id: string;
  website: string;
  whatsapp: string;
  logo: string;
  cover_image: string;
  return_policy: string;
  shipping_policy: string;
  locations: StoreLocation[];
}

interface DashboardStats {
  total_products?: number;
  total_visitors?: number;
  average_rating?: number;
  review_count?: number;
}

const EMPTY_FORM: StoreForm = {
  store_name: '',
  tagline: '',
  description: '',
  category_id: '',
  website: '',
  whatsapp: '',
  logo: '',
  cover_image: '',
  return_policy: '',
  shipping_policy: '',
  locations: [],
};

const makeLocation = (): StoreLocation => ({
  id: `loc_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  isPrimary: false,
  branchName: '',
  branchManager: '',
  streetAddress: '',
  city: '',
  state: '',
  phone: '',
  email: '',
  openingHours: '',
});

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse ${className}`} />
  );
}

function PageSkeleton() {
  return (
    <div className="max-w-3xl space-y-5">
      <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
        <SkeletonBlock className="h-36" />
        <div className="px-5 pb-5 pt-2 space-y-3">
          <div className="flex gap-3 -mt-6">
            <SkeletonBlock className="w-16 h-16 rounded-2xl flex-shrink-0" />
            <div className="flex-1 pt-7 space-y-2">
              <SkeletonBlock className="h-4 w-1/2" />
              <SkeletonBlock className="h-3 w-1/3" />
            </div>
          </div>
        </div>
      </div>
      {[1, 2].map(i => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 space-y-4">
          <SkeletonBlock className="h-5 w-40" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(j => <SkeletonBlock key={j} className="h-12" />)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Shared input styles ──────────────────────────────────────────────────────

const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 outline-none focus:border-[#8B1538] focus:ring-2 focus:ring-[#8B1538]/10 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500';

// ─── Form field wrapper ────────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {label}{required && <span className="text-[#8B1538] ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="flex items-center gap-2 font-bold text-gray-800 dark:text-gray-100 mb-5 text-sm sm:text-base">
        <Icon className="h-4 w-4 text-[#8B1538]" />
        {title}
      </h3>
      {children}
    </div>
  );
}

// ─── Location card ────────────────────────────────────────────────────────────

function LocationCard({
  loc,
  index,
  totalCount,
  onUpdate,
  onDelete,
  onMakePrimary,
}: {
  loc: StoreLocation;
  index: number;
  totalCount: number;
  onUpdate: (id: string, changes: Partial<StoreLocation>) => void;
  onDelete: (id: string) => void;
  onMakePrimary: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const set = (key: keyof StoreLocation) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onUpdate(loc.id, { [key]: e.target.value });

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden mb-3">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 cursor-pointer select-none"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${loc.isPrimary ? 'bg-[#8B1538]' : 'bg-gray-200 dark:bg-gray-600'}`}>
            <Store className={`h-4 w-4 ${loc.isPrimary ? 'text-white' : 'text-gray-500 dark:text-gray-300'}`} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">
              {loc.branchName || `Location ${index + 1}`}
            </span>
            {loc.isPrimary && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-[#8B1538] text-white">
                Primary
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          {!loc.isPrimary && (
            <button
              onClick={() => onMakePrimary(loc.id)}
              className="text-[#8B1538] text-xs font-semibold border border-[#8B1538] rounded-full px-2.5 py-1 hover:bg-[#8B1538]/5 transition-colors"
            >
              Make primary
            </button>
          )}
          {totalCount > 1 && (
            <button
              onClick={() => onDelete(loc.id)}
              className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={() => setOpen(o => !o)} className="p-1 text-gray-400">
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Body */}
      {open && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Branch Name" required>
              <input className={inputCls} value={loc.branchName} onChange={set('branchName')} placeholder="e.g. Ikeja Flagship" />
            </Field>
            <Field label="Branch Manager">
              <input className={inputCls} value={loc.branchManager} onChange={set('branchManager')} placeholder="Manager's name" />
            </Field>
          </div>
          <Field label="Street Address" required>
            <input className={inputCls} value={loc.streetAddress} onChange={set('streetAddress')} placeholder="Street address" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="City" required>
              <input className={inputCls} value={loc.city} onChange={set('city')} placeholder="City" />
            </Field>
            <Field label="State / Region">
              <input className={inputCls} value={loc.state} onChange={set('state')} placeholder="State" />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Phone" required>
              <input className={inputCls} value={loc.phone} onChange={set('phone')} placeholder="+234 800 000 0000" />
            </Field>
            <Field label="Email">
              <input className={inputCls} value={loc.email} onChange={set('email')} placeholder="branch@store.com" type="email" />
            </Field>
          </div>
          <Field label="Opening Hours">
            <input className={inputCls} value={loc.openingHours} onChange={set('openingHours')} placeholder="Mon–Sat · 9:00 AM – 8:00 PM" />
          </Field>
        </div>
      )}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="max-w-3xl space-y-5">
      {/* Hero banner */}
      <div className="rounded-2xl overflow-hidden">
        <div
          className="flex flex-col items-center justify-center gap-5 py-14 px-6 text-center"
          style={{ background: 'linear-gradient(135deg, #3d0a18 0%, #6b1128 50%, #2a0512 100%)' }}
        >
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
            <Store className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-xl sm:text-2xl mb-2">You don't have a store yet</h2>
            <p className="text-white/70 text-sm max-w-md mx-auto leading-relaxed">
              Set up your Ndeko storefront in two quick steps. Add as many physical locations as you need — each with its own contact details.
            </p>
          </div>
          <button
            onClick={onCreate}
            className="flex items-center gap-2 bg-white text-[#3d0a18] font-bold text-sm rounded-full px-6 py-3 hover:bg-white/90 transition-colors mt-1"
          >
            <Plus className="h-4 w-4" /> Create Store
          </button>
        </div>

        {/* Feature tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-gray-100 dark:border-gray-700">
          {[
            { icon: Store, title: 'Brand your storefront', desc: 'Logo, cover, tagline, policies.' },
            { icon: MapPin, title: 'Multiple locations', desc: 'Each branch gets its own phone, email, manager.' },
            { icon: ShoppingBag, title: 'Start selling', desc: 'Inventory & orders unlocked after setup.' },
          ].map((f, i) => (
            <div
              key={f.title}
              className={`bg-white dark:bg-gray-800 p-5 ${i < 2 ? 'sm:border-r border-gray-100 dark:border-gray-700' : ''} ${i > 0 ? 'border-t sm:border-t-0 border-gray-100 dark:border-gray-700' : ''}`}
            >
              <f.icon className="h-5 w-5 text-[#8B1538] mb-3" />
              <p className="font-semibold text-sm text-gray-800 dark:text-gray-100 mb-1">{f.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Store Header Preview ─────────────────────────────────────────────────────

function StoreHeaderPreview({
  form,
  stats,
  storeStatus,
}: {
  form: StoreForm;
  stats: DashboardStats;
  storeStatus?: string;
}) {
  const initials = form.store_name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('') || '?';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
      {/* Cover */}
      <div
        className="relative h-32 sm:h-40 flex items-end justify-between px-4 sm:px-6 pb-3"
        style={{
          background: form.cover_image
            ? `url(${form.cover_image}) center/cover no-repeat`
            : 'linear-gradient(135deg, #3d0a18 0%, #6b1128 50%, #2a0512 100%)',
        }}
      >
        <button className="relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/30 text-white/80 text-xs font-medium hover:bg-black/50 transition-colors">
          <Camera className="h-3.5 w-3.5" /> Change Cover
        </button>
        <div className="relative z-10 flex items-center gap-1.5 bg-green-500/20 border border-green-400/30 text-green-300 px-3 py-1 rounded-full text-xs font-medium">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          Live Store
        </div>
      </div>

      {/* Avatar + meta */}
      <div className="px-4 sm:px-6 pb-4 sm:pb-5">
        <div className="flex flex-wrap items-end justify-between gap-3 -mt-7 sm:-mt-8 mb-3">
          <div className="relative flex-shrink-0">
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white font-bold text-base sm:text-xl border-4 border-white dark:border-gray-800 shadow-lg overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #8B1538, #D4828F)' }}
            >
              {form.logo
                ? <img src={form.logo} alt={form.store_name} className="w-full h-full object-cover" />
                : initials}
            </div>
            <button className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#8B1538] text-white flex items-center justify-center shadow hover:bg-[#6B0F2A] transition-colors">
              <Camera className="h-2.5 w-2.5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pb-1">
            {stats.average_rating != null && (
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="h-3.5 w-3.5 fill-amber-400" />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{stats.average_rating.toFixed(1)}</span>
                {stats.review_count != null && (
                  <span className="text-xs text-gray-400">({stats.review_count.toLocaleString()} reviews)</span>
                )}
              </div>
            )}
            {(storeStatus === 'active' || storeStatus === 'verified') && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 flex items-center gap-1">
                <Check className="h-3 w-3" /> Verified
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
          {stats.total_products != null && (
            <span className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" /> {stats.total_products.toLocaleString()} Products
            </span>
          )}
          {stats.total_visitors != null && (
            <span className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" /> {stats.total_visitors.toLocaleString()} Visitors
            </span>
          )}
          {form.locations.length > 0 && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> {form.locations.length} Location{form.locations.length !== 1 ? 's' : ''}
            </span>
          )}
          {form.locations.find(l => l.isPrimary)?.city && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> {form.locations.find(l => l.isPrimary)?.city}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BusinessStorefront() {
  const [store, setStore] = useState<ApiStore | null>(null);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [stats, setStats] = useState<DashboardStats>({});
  const [form, setForm] = useState<StoreForm>(EMPTY_FORM);
  const [originalForm, setOriginalForm] = useState<StoreForm>(EMPTY_FORM);
  const [isDirty, setIsDirty] = useState(false);
  const [showForm, setShowForm] = useState(false); // ← controls empty vs form view

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle');
  const [pageError, setPageError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Load ──────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setPageLoading(true);
    setPageError(null);
    try {
      const [storeRes, catRes] = await Promise.all([
        getMyStores(),
        fetchCategories({ limit: 50 }),
      ]);

      const storeList = Array.isArray(storeRes)
        ? storeRes
        : (storeRes as { data?: ApiStore[] }).data ?? [];
      const firstStore: ApiStore | null = storeList[0] ?? null;

      setStore(firstStore);
      setCategories(catRes.data ?? []);

      if (firstStore) {
        // Store exists → map API data into form, show the form immediately
        const catId =
          typeof firstStore.category === 'string'
            ? (catRes.data ?? []).find(c => c.name === firstStore.category)?.id ?? ''
            : (firstStore.category as ApiCategory | undefined)?.id ?? '';

        const initial: StoreForm = {
          store_name: firstStore.store_name ?? '',
          tagline: (firstStore as any).tagline ?? '',
          description: firstStore.description ?? '',
          category_id: catId,
          website: (firstStore as any).website ?? '',
          whatsapp: (firstStore as any).whatsapp ?? '',
          logo: firstStore.logo_url ?? '',
          cover_image: (firstStore as any).cover_image ?? '',
          return_policy: (firstStore as any).return_policy ?? '',
          shipping_policy: (firstStore as any).shipping_policy ?? '',
          locations: ((firstStore as any).locations ?? []).map((l: any, i: number) => ({
            id: l.id ?? `loc_${i}`,
            isPrimary: l.is_primary ?? i === 0,
            branchName: l.branch_name ?? l.name ?? '',
            branchManager: l.branch_manager ?? l.manager ?? '',
            streetAddress: l.street_address ?? l.address ?? '',
            city: l.city ?? '',
            state: l.state ?? l.region ?? '',
            phone: l.phone ?? '',
            email: l.email ?? '',
            openingHours: l.opening_hours ?? l.hours ?? '',
          })),
        };

        setForm(initial);
        setOriginalForm(initial);
        setShowForm(true);

        // Non-blocking stats
        try {
          const dash = await getStoreDashboard(firstStore.id) as any;
          setStats({
            total_products: dash.total_products ?? dash.products_count,
            total_visitors: dash.total_visitors ?? firstStore.visitor_count,
            average_rating: dash.average_rating ?? firstStore.average_rating,
            review_count: dash.review_count,
          });
        } catch {
          setStats({
            total_visitors: firstStore.visitor_count,
            average_rating: firstStore.average_rating,
          });
        }
      } else {
        // No store → show empty state
        setShowForm(false);
      }
    } catch {
      setPageError('Failed to load store data. Please try again.');
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Track dirty state
  useEffect(() => {
    setIsDirty(JSON.stringify(form) !== JSON.stringify(originalForm));
  }, [form, originalForm]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const setField = (key: keyof StoreForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleCreateStore = () => {
    // Start with a blank form + one empty primary location
    const firstLoc = { ...makeLocation(), isPrimary: true };
    const blank = { ...EMPTY_FORM, locations: [firstLoc] };
    setForm(blank);
    setOriginalForm(blank);
    setShowForm(true);
  };

  const addLocation = () => {
    setForm(prev => ({
      ...prev,
      locations: [
        ...prev.locations,
        {
          ...makeLocation(),
          isPrimary: prev.locations.length === 0, // first one is primary automatically
        },
      ],
    }));
  };

  const updateLocation = (id: string, changes: Partial<StoreLocation>) => {
    setForm(prev => ({
      ...prev,
      locations: prev.locations.map(l => l.id === id ? { ...l, ...changes } : l),
    }));
  };

  const deleteLocation = (id: string) => {
    setForm(prev => {
      const remaining = prev.locations.filter(l => l.id !== id);
      // if we removed the primary, promote the first remaining
      if (remaining.length > 0 && !remaining.some(l => l.isPrimary)) {
        remaining[0] = { ...remaining[0], isPrimary: true };
      }
      return { ...prev, locations: remaining };
    });
  };

  const makePrimary = (id: string) => {
    setForm(prev => ({
      ...prev,
      locations: prev.locations.map(l => ({ ...l, isPrimary: l.id === id })),
    }));
  };

  const handleSave = async () => {
    if (!store) return;
    setSaving(true);
    setSaveError(null);
    try {
      const selectedCat = categories.find(c => c.id === form.category_id);
      const payload = {
        store_name: form.store_name,
        tagline: form.tagline,
        description: form.description,
        website: form.website,
        whatsapp: form.whatsapp,
        logo_url: form.logo,
        cover_image: form.cover_image,
        return_policy: form.return_policy,
        shipping_policy: form.shipping_policy,
        locations: form.locations.map(l => ({
          id: l.id,
          is_primary: l.isPrimary,
          branch_name: l.branchName,
          branch_manager: l.branchManager,
          street_address: l.streetAddress,
          city: l.city,
          state: l.state,
          phone: l.phone,
          email: l.email,
          opening_hours: l.openingHours,
        })),
        ...(selectedCat ? { category_slug: selectedCat.slug } : {}),
      };
      const updated = await updateStore(store.id, payload as any);
      setStore(updated);
      setOriginalForm(form);
      setIsDirty(false);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2500);
    } catch (err: any) {
      setSaveError(err?.message ?? 'Failed to save changes.');
      setSaveState('error');
      setTimeout(() => setSaveState('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setForm(originalForm);
    setIsDirty(false);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (pageLoading) return <PageSkeleton />;

  if (pageError) {
    return (
      <div className="max-w-3xl">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <AlertCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-red-700 dark:text-red-300 mb-1">Could not load store</p>
            <p className="text-sm text-red-600 dark:text-red-400">{pageError}</p>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!showForm) {
    return <EmptyState onCreate={handleCreateStore} />;
  }

  // ── Store form ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl space-y-5">

      {/* Live preview banner */}
      <StoreHeaderPreview form={form} stats={stats} storeStatus={store?.status} />

      {/* "Start over" notice (only when a store already exists) */}
      {store && (
        <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-[#8B1538]/10 flex items-center justify-center flex-shrink-0">
              <Plus className="h-3.5 w-3.5 text-[#8B1538]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Need to start over or set up a new store?</p>
              <p className="text-xs text-gray-400">Re-run the create-store wizard with multi-location setup.</p>
            </div>
          </div>
          <button
            onClick={handleCreateStore}
            className="text-sm font-semibold px-4 py-2 rounded-full text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #8B1538, #D4828F)' }}
          >
            Create Store
          </button>
        </div>
      )}

      {/* ── Store Information ── */}
      <SectionCard icon={Store} title="Store Information">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Store Name" required>
              <input className={inputCls} value={form.store_name} onChange={setField('store_name')} placeholder="Your store name" />
            </Field>
            <Field label="Category" required>
              <select className={`${inputCls} bg-white dark:bg-gray-900`} value={form.category_id} onChange={setField('category_id')}>
                <option value="">Select category…</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Tagline">
            <input className={inputCls} value={form.tagline} onChange={setField('tagline')} placeholder="A short description of your store" />
          </Field>
          <Field label="Description" hint={`${form.description.length}/500 characters`}>
            <textarea
              className={`${inputCls} resize-none`}
              value={form.description}
              onChange={setField('description')}
              rows={4}
              maxLength={500}
              placeholder="Tell buyers about your store…"
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Website">
              <input className={inputCls} value={form.website} onChange={setField('website')} placeholder="www.yourstore.com" />
            </Field>
            <Field label="WhatsApp (General)">
              <input className={inputCls} value={form.whatsapp} onChange={setField('whatsapp')} placeholder="+234 800 000 0000" />
            </Field>
          </div>
        </div>
      </SectionCard>

      {/* ── Store Locations ── */}
      <SectionCard icon={MapPin} title={`Store Locations${form.locations.length > 0 ? ` (${form.locations.length})` : ''}`}>
        {/* Add location button top-right */}
        <div className="flex items-center justify-between mb-4 -mt-1">
          <p className="text-xs text-gray-400">Add all your physical branches — each with its own contact details.</p>
          <button
            onClick={addLocation}
            className="flex items-center gap-1.5 text-sm font-semibold text-white px-3 py-2 rounded-full flex-shrink-0 ml-3"
            style={{ background: 'linear-gradient(135deg, #8B1538, #D4828F)' }}
          >
            <Plus className="h-3.5 w-3.5" /> Add Location
          </button>
        </div>

        {form.locations.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl">
            <MapPin className="h-8 w-8 text-gray-300 dark:text-gray-500 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No locations yet. Add your first branch.</p>
          </div>
        ) : (
          form.locations.map((loc, i) => (
            <LocationCard
              key={loc.id}
              loc={loc}
              index={i}
              totalCount={form.locations.length}
              onUpdate={updateLocation}
              onDelete={deleteLocation}
              onMakePrimary={makePrimary}
            />
          ))
        )}
      </SectionCard>

      {/* ── Store Policies ── */}
      <SectionCard icon={BarChart2} title="Store Policies">
        <div className="space-y-4">
          <Field label="Return Policy">
            <textarea
              className={`${inputCls} resize-none`}
              value={form.return_policy}
              onChange={setField('return_policy')}
              rows={3}
              placeholder="Describe your return and refund policy…"
            />
          </Field>
          <Field label="Shipping Policy">
            <textarea
              className={`${inputCls} resize-none`}
              value={form.shipping_policy}
              onChange={setField('shipping_policy')}
              rows={3}
              placeholder="Describe your shipping terms and delivery timelines…"
            />
          </Field>
        </div>
      </SectionCard>

      {/* ── Store Media ── */}
      <SectionCard icon={Camera} title="Store Media">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Logo URL">
            <input className={inputCls} type="url" value={form.logo} onChange={setField('logo')} placeholder="https://…" />
          </Field>
          <Field label="Cover Image URL">
            <input className={inputCls} type="url" value={form.cover_image} onChange={setField('cover_image')} placeholder="https://…" />
          </Field>
        </div>
        {(form.logo || form.cover_image) && (
          <div className="flex flex-wrap gap-3 mt-3">
            {form.logo && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <img src={form.logo} alt="logo" className="w-8 h-8 rounded-lg object-cover border border-gray-200 dark:border-gray-600" onError={e => (e.currentTarget.style.display = 'none')} />
                Logo preview
              </div>
            )}
            {form.cover_image && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <img src={form.cover_image} alt="cover" className="w-14 h-8 rounded-lg object-cover border border-gray-200 dark:border-gray-600" onError={e => (e.currentTarget.style.display = 'none')} />
                Cover preview
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* ── Save error ── */}
      {saveError && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {saveError}
        </div>
      )}

      {/* ── Footer actions ── */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-gray-100 dark:border-gray-700 pt-4 pb-6">
        <button
          onClick={() => setShowForm(false)}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline underline-offset-2 transition-colors text-left"
        >
          Reset store (preview empty state)
        </button>
        <div className="flex gap-3 sm:gap-3">
          <button
            onClick={handleDiscard}
            disabled={!isDirty || saving}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Discard Changes
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed min-w-[130px]"
            style={{
              background:
                saveState === 'saved' ? '#059669'
                : saveState === 'error' ? '#DC2626'
                : 'linear-gradient(135deg, #8B1538, #D4828F)',
            }}
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
            ) : saveState === 'saved' ? (
              <><Check className="h-4 w-4" /> Saved!</>
            ) : saveState === 'error' ? (
              'Try Again'
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>

    </div>
  );
}