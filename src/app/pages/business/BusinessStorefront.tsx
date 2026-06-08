import { useState, useEffect, useCallback } from 'react';
import { Store, MapPin, Star, Package, Eye, Check, Camera, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import {
  getMyStores,
  updateStore,
  fetchCategories,
  getStoreDashboard,
  type ApiStore,
  type ApiCategory,
} from '../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoreForm {
  store_name: string;
  description: string;
  city: string;
  category_id: string;
  logo?: string;
  cover_image?: string;
}

interface DashboardStats {
  total_products?: number;
  total_visitors?: number;
  average_rating?: number;
  review_count?: number;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse ${className}`} />;
}

function PageSkeleton() {
  return (
    <div className="max-w-3xl space-y-5 sm:space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
        <SkeletonBlock className="h-36" />
        <div className="px-5 sm:px-6 pb-5 pt-2 space-y-3">
          <div className="flex gap-3 -mt-6">
            <SkeletonBlock className="w-16 h-16 rounded-2xl flex-shrink-0" />
            <div className="flex-1 pt-7 space-y-2">
              <SkeletonBlock className="h-4 w-1/2" />
              <SkeletonBlock className="h-3 w-1/3" />
            </div>
          </div>
        </div>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 border border-gray-100 dark:border-gray-700 space-y-4">
          <SkeletonBlock className="h-5 w-40" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((j) => <SkeletonBlock key={j} className="h-12" />)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Field component ──────────────────────────────────────────────────────────

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      {Icon ? (
        <div className="relative">
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          {children}
        </div>
      ) : children}
    </div>
  );
}

const inputCls =
  'w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 outline-none focus:border-[#8B1538] focus:ring-2 focus:ring-[#8B1538]/10 transition-all placeholder:text-gray-400';
const inputWithIconCls = `${inputCls} pl-10`;

// ─── Main component ───────────────────────────────────────────────────────────

export function BusinessStorefront() {
  // ── State ──
  const [store, setStore] = useState<ApiStore | null>(null);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [stats, setStats] = useState<DashboardStats>({});
  const [form, setForm] = useState<StoreForm>({
    store_name: '',
    description: '',
    city: '',
    category_id: '',
    logo: '',
    cover_image: '',
  });
  const [originalForm, setOriginalForm] = useState<StoreForm | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle');
  const [pageError, setPageError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Load store + categories + dashboard ──
  const load = useCallback(async () => {
    setPageLoading(true);
    setPageError(null);
    try {
      const [storeRes, catRes] = await Promise.all([
        getMyStores(),
        fetchCategories({ limit: 50 }),
      ]);

      const firstStore = storeRes.data[0] ?? null;
      setStore(firstStore);
      setCategories(catRes.data);

      if (firstStore) {
        const initial: StoreForm = {
          store_name: firstStore.store_name ?? '',
          description: firstStore.description ?? '',
          city: firstStore.city ?? '',
          category_id: firstStore.category?.id ?? '',
          logo: firstStore.logo ?? '',
          cover_image: (firstStore as any).cover_image ?? '',
        };
        setForm(initial);
        setOriginalForm(initial);

        // Fetch analytics (non-blocking)
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
      }
    } catch {
      setPageError('Failed to load store data. Please try again.');
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Track dirtiness
  useEffect(() => {
    if (!originalForm) return;
    setIsDirty(JSON.stringify(form) !== JSON.stringify(originalForm));
  }, [form, originalForm]);

  // ── Field updater ──
  const set = (key: keyof StoreForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  // ── Save ──
  const handleSave = async () => {
    if (!store) return;
    setSaving(true);
    setSaveError(null);
    try {
      const payload: Partial<ApiStore> = {
        store_name: form.store_name,
        description: form.description,
        city: form.city,
        logo: form.logo,
        ...(form.category_id ? { category: { id: form.category_id } as any } : {}),
      };
      const updated = await updateStore(store.id, payload);
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

  // ── Discard ──
  const handleDiscard = () => {
    if (originalForm) {
      setForm(originalForm);
      setIsDirty(false);
    }
  };

  // ── Initials ──
  const initials = form.store_name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || 'ST';

  const selectedCategoryName =
    categories.find((c) => c.id === form.category_id)?.name ?? '';

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

  return (
    <div className="max-w-3xl space-y-5 sm:space-y-6">

      {/* ── Store Header Preview ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
        {/* Cover */}
        <div
          className="relative h-32 sm:h-36 flex items-end justify-between px-4 sm:px-6 pb-3 sm:pb-4"
          style={{
            background: form.cover_image
              ? `url(${form.cover_image}) center/cover no-repeat`
              : 'linear-gradient(135deg, #0D2137 0%, #8B1538 60%, #3D9B8E 100%)',
          }}
        >
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
              backgroundSize: '30px 30px',
            }}
          />
          <button className="relative z-10 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-black/30 text-white/80 text-xs font-medium hover:bg-black/50 transition-colors">
            <Camera className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Change Cover</span>
          </button>
          <div className="relative z-10 flex items-center gap-1.5 bg-green-500/20 border border-green-400/30 text-green-300 px-2.5 sm:px-3 py-1 rounded-full text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span>Live Store</span>
          </div>
        </div>

        {/* Avatar + info */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-5">
          <div className="flex flex-wrap items-end justify-between gap-3 -mt-7 sm:-mt-8 mb-3 sm:mb-4">
            <div className="relative flex-shrink-0">
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white text-base sm:text-xl font-bold border-4 border-white dark:border-gray-800 shadow-lg overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #8B1538, #D4828F)' }}
              >
                {form.logo
                  ? <img src={form.logo} alt={form.store_name} className="w-full h-full object-cover" />
                  : initials}
              </div>
              <button className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#8B1538] text-white flex items-center justify-center shadow-md hover:bg-[#6B0F2A] transition-colors">
                <Camera className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pb-1">
              {stats.average_rating != null && (
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-amber-400" />
                  <span className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200">
                    {stats.average_rating.toFixed(1)}
                  </span>
                  {stats.review_count != null && (
                    <span className="text-xs text-gray-400">({stats.review_count.toLocaleString()})</span>
                  )}
                </div>
              )}
              {store?.status === 'active' || store?.status === 'verified' ? (
                <span className="px-2 sm:px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Verified
                </span>
              ) : store?.status ? (
                <span className="px-2 sm:px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 capitalize">
                  {store.status}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {stats.total_products != null && (
              <span className="flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {stats.total_products.toLocaleString()} Products
              </span>
            )}
            {stats.total_visitors != null && (
              <span className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {stats.total_visitors.toLocaleString()} Visitors
              </span>
            )}
            {form.city && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {form.city}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Store Information ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-gray-800 dark:text-gray-100 font-bold mb-4 sm:mb-5 flex items-center gap-2 text-sm sm:text-base">
          <Store className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-[#8B1538]" />
          Store Information
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Store Name *">
              <input
                type="text"
                value={form.store_name}
                onChange={set('store_name')}
                className={inputCls}
                placeholder="Your store name"
              />
            </Field>
            <Field label="Category *">
              <select
                value={form.category_id}
                onChange={set('category_id')}
                className={`${inputCls} bg-white dark:bg-gray-900`}
              >
                <option value="">Select category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="City / Location *">
            <input
              type="text"
              value={form.city}
              onChange={set('city')}
              className={inputCls}
              placeholder="e.g. Lagos, Nigeria"
            />
          </Field>

          <Field label="Store Description">
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={4}
              maxLength={500}
              className={`${inputCls} resize-none`}
              placeholder="Tell buyers about your store…"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{form.description.length}/500</p>
          </Field>
        </div>
      </div>

      {/* ── Media URLs ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-gray-800 dark:text-gray-100 font-bold mb-4 sm:mb-5 flex items-center gap-2 text-sm sm:text-base">
          <Camera className="h-4 w-4 text-[#8B1538]" />
          Store Media
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Logo URL">
            <input
              type="url"
              value={form.logo}
              onChange={set('logo')}
              className={inputCls}
              placeholder="https://…"
            />
          </Field>
          <Field label="Cover Image URL">
            <input
              type="url"
              value={form.cover_image}
              onChange={set('cover_image')}
              className={inputCls}
              placeholder="https://…"
            />
          </Field>
        </div>
        {(form.logo || form.cover_image) && (
          <div className="mt-3 flex flex-wrap gap-3">
            {form.logo && (
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <img src={form.logo} alt="logo preview" className="w-8 h-8 rounded-lg object-cover border border-gray-200 dark:border-gray-600" onError={(e) => (e.currentTarget.style.display = 'none')} />
                Logo preview
              </div>
            )}
            {form.cover_image && (
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <img src={form.cover_image} alt="cover preview" className="w-12 h-8 rounded-lg object-cover border border-gray-200 dark:border-gray-600" onError={(e) => (e.currentTarget.style.display = 'none')} />
                Cover preview
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Save error ── */}
      {saveError && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {saveError}
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex flex-col-reverse xs:flex-row items-stretch xs:items-center justify-end gap-3 pb-4">
        <button
          onClick={handleDiscard}
          disabled={!isDirty || saving}
          className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Discard Changes
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed min-w-[130px]"
          style={{
            background:
              saveState === 'saved'
                ? '#059669'
                : saveState === 'error'
                ? '#DC2626'
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
  );
}