import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Search, Plus, Edit, Trash2, AlertTriangle, Package,
  DollarSign, Filter, RefreshCw, X, ChevronLeft,
  ChevronRight, Loader2, CheckCircle, XCircle, Camera,
} from 'lucide-react';
import {
  ApiError,
  getMyBusiness,
  getStoreLocations,
  getStoreProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  fetchCategories,
  fetchStoreProductStats,
  uploadImage,
  type ApiProduct,
  type ApiStore,
  type ApiStoreLocation,
  type ApiCategory,
  type StoreProductStats,
  type ProductWriteBody,
} from '../../services/api';
import { LocationDropdown, LocationTag, ALL_STORES_ID } from '../../components/business/LocationDropdown';

// ─── Types ─────────────────────────────────────────────────────────────────
type ApiProductWithStore = ApiProduct;

// ─── Product Image Uploader ───────────────────────────────────────────────────

const MAX_PRODUCT_IMAGES = 6;
const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,image/gif';

function ProductImageUploader({ images, onChange }: { images: string[]; onChange: (urls: string[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const remaining = MAX_PRODUCT_IMAGES - images.length;
    const toUpload = files.slice(0, remaining);
    setUploadError('');
    setUploading(true);
    try {
      const urls = await Promise.all(
        toUpload.map(async f => {
          if (f.size > 5 * 1024 * 1024) throw new Error(`${f.name} exceeds 5 MB`);
          const res = await uploadImage(f, 'product');
          return res.url;
        })
      );
      onChange([...images, ...urls]);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = (idx: number) => onChange(images.filter((_, i) => i !== idx));

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {images.map((url, i) => (
          <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 group">
            <img src={url} alt={`Product ${i + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
            >
              <X style={{ width: 14, height: 14, color: 'white' }} />
            </button>
          </div>
        ))}
        {images.length < MAX_PRODUCT_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-[#8B1538] hover:text-[#8B1538] transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 style={{ width: 18, height: 18 }} className="animate-spin" /> : <Camera style={{ width: 18, height: 18 }} />}
            {!uploading && <span style={{ fontSize: 9 }}>Upload</span>}
          </button>
        )}
      </div>
      {uploadError && <p style={{ fontSize: 11, color: '#dc2626', marginTop: 2 }}>{uploadError}</p>}
      <p style={{ fontSize: 11, color: '#9ca3af' }}>{images.length}/{MAX_PRODUCT_IMAGES} images — JPEG, PNG, WebP or GIF · max 5 MB each</p>
      <input ref={inputRef} type="file" accept={ACCEPTED_TYPES} multiple className="hidden" onChange={handleFiles} />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StockBadge({ status, qty }: { status: string; qty: number }) {
  const safeQty = qty ?? 0;
  if (status === 'out_of_stock' || status === 'reserved' || safeQty === 0)
    return <span className="inv-badge inv-badge--out">Out of Stock</span>;
  if (status === 'low_stock' || safeQty <= 5)
    return (
      <span className="inv-badge inv-badge--low">
        <AlertTriangle style={{ width: 11, height: 11 }} /> Low ({safeQty})
      </span>
    );
  return <span className="inv-badge inv-badge--ok">{safeQty} in stock</span>;
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`inv-toast inv-toast--${type}`}>
      {type === 'success' ? <CheckCircle style={{ width: 16, height: 16 }} /> : <XCircle style={{ width: 16, height: 16 }} />}
      <span>{message}</span>
      <button onClick={onClose} className="inv-toast__close"><X style={{ width: 14, height: 14 }} /></button>
    </div>
  );
}

interface ProductFormData {
  name: string; description: string; price: string;
  discount_price: string; cost_price: string; stock_quantity: string;
  restock_threshold: string;
  category_id: string; images: string[]; is_active: boolean;
  location_id: string;
}

function ProductModal({
  mode, product, storeId, storeName, locations, defaultLocationId, categories, onClose, onSaved,
}: {
  mode: 'add' | 'edit';
  product?: ApiProductWithStore;
  storeId: string;
  storeName: string;
  locations: ApiStoreLocation[];
  defaultLocationId?: string;
  categories: ApiCategory[];
  onClose: () => void;
  onSaved: (p: ApiProductWithStore) => void;
}) {
  const initialLocationId = defaultLocationId && defaultLocationId !== ALL_STORES_ID ? defaultLocationId : '';

  const [form, setForm] = useState<ProductFormData>({
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: product?.price ? String(product.price) : '',
    discount_price: product?.discount_price ? String(product.discount_price) : '',
    cost_price: '',
    stock_quantity: product?.stock_quantity ? String(product.stock_quantity) : '',
    restock_threshold:
      product?.restock_threshold != null ? String(product.restock_threshold) : '',
    category_id: product?.category?.id ?? (categories[0]?.id ?? ''),
    images: product?.images ?? [],
    is_active: product?.is_active ?? true,
    location_id: initialLocationId,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof ProductFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.location_id) {
      setError('Please choose which store location this product belongs to.');
      return;
    }
    if (!form.name.trim() || !form.price || !form.stock_quantity) {
      setError('Name, price and stock are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const body: ProductWriteBody = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: parseFloat(form.price),
        discount_price: form.discount_price ? parseFloat(form.discount_price) : undefined,
        cost_price: form.cost_price ? parseFloat(form.cost_price) : undefined,
        category_id: form.category_id || undefined,
        images: form.images,
        is_active: form.is_active,
        stock_by_location: [{ location_id: form.location_id, quantity: parseInt(form.stock_quantity, 10) }],
        // Omit when blank so the backend applies its default of 5.
        restock_threshold: form.restock_threshold.trim()
          ? parseInt(form.restock_threshold, 10)
          : undefined,
      };
      const saved = mode === 'add'
        ? await createProduct(storeId, body)
        : await updateProduct(storeId, product!.id, body);

      onSaved(saved);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="inv-overlay" onClick={onClose}>
      <div className="inv-modal" onClick={e => e.stopPropagation()}>
        <div className="inv-modal__header">
          <h2>{mode === 'add' ? 'Add New Product' : 'Edit Product'}</h2>
          <button onClick={onClose} className="inv-modal__close"><X /></button>
        </div>

        <div className="inv-modal__body">
          {error && <p className="inv-modal__error">{error}</p>}

          <div className="inv-form-grid">
            <div className="inv-field inv-field--full">
              <label>Store Location *</label>
              <LocationDropdown
                storeName={storeName}
                locations={locations}
                value={form.location_id}
                onChange={id => setForm(f => ({ ...f, location_id: id }))}
                includeAll={false}
                variant="field"
                placeholder="Search and select a location…"
                error={!form.location_id && !!error}
              />
            </div>

            <div className="inv-field inv-field--full">
              <label htmlFor="product-name">Product Name *</label>
              <input id="product-name" name="name" value={form.name} onChange={set('name')} placeholder="e.g. iPhone 15 Pro" />
            </div>

            <div className="inv-field inv-field--full">
              <label htmlFor="product-description">Description</label>
              <textarea id="product-description" name="description" value={form.description} onChange={set('description')} rows={3} placeholder="Brief product description..." />
            </div>

            <div className="inv-field">
              <label htmlFor="product-price">Selling Price (₦) *</label>
              <input id="product-price" name="price" type="number" value={form.price} onChange={set('price')} placeholder="0.00" min="0" step="0.01" />
            </div>

            <div className="inv-field">
              <label htmlFor="product-discount-price">Discount Price (₦)</label>
              <input id="product-discount-price" name="discountPrice" type="number" value={form.discount_price} onChange={set('discount_price')} placeholder="0.00" min="0" step="0.01" />
            </div>

            <div className="inv-field">
              <label htmlFor="product-cost-price">Cost Price (₦) <span style={{ color: '#9ca3af', fontWeight: 400 }}>— private</span></label>
              <input id="product-cost-price" name="costPrice" type="number" value={form.cost_price} onChange={set('cost_price')} placeholder="0.00" min="0" step="0.01" />
            </div>

            <div className="inv-field">
              <label htmlFor="product-stock-quantity">Stock Quantity *</label>
              <input id="product-stock-quantity" name="stockQuantity" type="number" value={form.stock_quantity} onChange={set('stock_quantity')} placeholder="0" min="0" step="1" />
            </div>

            <div className="inv-field">
              <label htmlFor="product-restock-threshold">Restock Threshold <span style={{ color: '#9ca3af', fontWeight: 400 }}>— low-stock alert at</span></label>
              <input id="product-restock-threshold" name="restockThreshold" type="number" value={form.restock_threshold} onChange={set('restock_threshold')} placeholder="5" min="0" step="1" />
            </div>

            <div className="inv-field">
              <label htmlFor="product-category">Category</label>
              <select id="product-category" name="category" value={form.category_id} onChange={set('category_id')}>
                <option value="">No Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="inv-field inv-field--full">
              <label>Product Images (up to {MAX_PRODUCT_IMAGES})</label>
              <ProductImageUploader
                images={form.images}
                onChange={urls => setForm(f => ({ ...f, images: urls }))}
              />
            </div>
          </div>
        </div>

        <div className="inv-modal__footer">
          <button onClick={onClose} className="inv-btn inv-btn--ghost" disabled={saving}>Cancel</button>
          <button onClick={handleSubmit} className="inv-btn inv-btn--primary" disabled={saving}>
            {saving ? <><Loader2 className="inv-spin" style={{ width: 15, height: 15 }} /> Saving…</> : (mode === 'add' ? 'Add Product' : 'Save Changes')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pagination helper ────────────────────────────────────────────────────────

function getPageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '…')[] = [1];
  if (current > 3) pages.push('…');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push('…');
  pages.push(total);
  return pages;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BusinessInventory() {
  const [store, setStore] = useState<ApiStore | null>(null);
  const [locations, setLocations] = useState<ApiStoreLocation[]>([]);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [products, setProducts] = useState<ApiProductWithStore[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const [stats, setStats] = useState<StoreProductStats | null>(null);

  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; product?: ApiProductWithStore } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const isAllLocations = locationId === ALL_STORES_ID;
  const scopedLocationId = isAllLocations ? undefined : (locationId ?? undefined);

  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

  const locationName = useCallback(
    (id?: string) => locations.find(l => l.id === id)?.branch_name,
    [locations]
  );

  const renderLocationStock = (p: ApiProductWithStore) => {
    const stock = p.location_stock ?? [];
    if (stock.length === 0) return <LocationTag />;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {stock.map(s => (
          <LocationTag key={s.location_id} name={locationName(s.location_id)} qty={s.quantity} />
        ))}
      </div>
    );
  };

  // Bootstrap: load the seller's store, its locations + categories
  useEffect(() => {
    (async () => {
      try {
        const [myStore, catsRes] = await Promise.all([
          getMyBusiness(),
          fetchCategories({ limit: 100 }),
        ]);
        setCategories(catsRes.data ?? []);
        if (!myStore) {
          setLoading(false);
          setLoadError('No store found. Create a store to manage inventory.');
          return;
        }
        setStore(myStore);
        const storeLocations = await getStoreLocations(myStore.id);
        setLocations(storeLocations);
        setLocationId(storeLocations.length === 1 ? storeLocations[0].id : ALL_STORES_ID);
      } catch (e: unknown) {
        setLoadError(e instanceof ApiError ? e.message : 'Failed to load store data.');
        setLoading(false);
      }
    })();
  }, []);

  // Fetch server-side stats, scoped to the selected location
  useEffect(() => {
    if (!store) { setStats(null); return; }
    fetchStoreProductStats(store.id, scopedLocationId).then(setStats).catch(() => setStats(null));
  }, [store, scopedLocationId]);

  // Load products
  const loadProducts = useCallback(async () => {
    if (!store) return;
    setLoading(true);
    setLoadError('');
    try {
      const res = await getStoreProducts(store.id, page, LIMIT, scopedLocationId);
      setProducts(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch (e: unknown) {
      setLoadError(e instanceof ApiError ? e.message : 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, [store, page, scopedLocationId]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleLocationChange = (id: string) => {
    setLocationId(id);
    setPage(1);
  };

  useEffect(() => { setPage(1); }, [search, catFilter, statusFilter, locationId]);

  // Client-side filter atop the current page
  const matchesFilters = useCallback((p: ApiProductWithStore) => {
    const matchSearch =
      (p.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (p.sku ?? '').toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || p.category?.id === catFilter || p.category?.slug === catFilter;
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && p.is_active) ||
      (statusFilter === 'inactive' && !p.is_active) ||
      (statusFilter === 'low' && p.stock_status === 'low_stock') ||
      (statusFilter === 'out_of_stock' && p.stock_status === 'out_of_stock');
    return matchSearch && matchCat && matchStatus;
  }, [search, catFilter, statusFilter]);

  const filtered = useMemo(() => products.filter(matchesFilters), [products, matchesFilters]);

  const totalPages = Math.max(1, Math.ceil((total ?? 0) / LIMIT));
  const pageNumbers = getPageNumbers(page, totalPages);

  const totalValue = stats?.inventory_value ?? 0;
  const lowStockCount = stats?.low_stock ?? filtered.filter(p => p.stock_status === 'low_stock').length;
  const outOfStockCount = stats?.out_of_stock ?? filtered.filter(p => p.stock_status === 'out_of_stock').length;

  const handleDelete = async (p: ApiProductWithStore) => {
    if (!store) return;
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    setDeleting(p.id);
    try {
      await deleteProduct(store.id, p.id);
      setProducts(ps => ps.filter(x => x.id !== p.id));
      setTotal(t => Math.max(0, t - 1));
      showToast('Product deleted.', 'success');
    } catch (e: unknown) {
      showToast(e instanceof ApiError ? e.message : 'Failed to delete.', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const handleSaved = (saved: ApiProductWithStore) => {
    setProducts(ps => {
      const exists = ps.find(p => p.id === saved.id);
      return exists ? ps.map(p => p.id === saved.id ? saved : p) : [saved, ...ps];
    });
    setModal(null);
    showToast(modal?.mode === 'add' ? 'Product added!' : 'Product updated!', 'success');
  };

  return (
    <>
      <style>{`
        /* ── Reset & base ────────────────────────── */
        *, *::before, *::after { box-sizing: border-box; }

        .inv-root {
          --brand: #8B1538;
          --brand-light: #D4828F;
          --teal: #3D9B8E;
          --amber: #D97706;
          --red: #DC2626;
          --gray-50: #F9FAFB;
          --gray-100: #F3F4F6;
          --gray-200: #E5E7EB;
          --gray-400: #9CA3AF;
          --gray-500: #6B7280;
          --gray-700: #374151;
          --gray-800: #1F2937;
          --radius: 14px;
          --shadow: 0 1px 4px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04);
          font-family: 'DM Sans', 'Segoe UI', sans-serif;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 16px;
          background: var(--gray-50);
          min-height: 100vh;
        }

        /* ── Stats grid ──────────────────────────── */
        .inv-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (min-width: 640px) { .inv-stats { grid-template-columns: repeat(4, 1fr); } }

        .inv-stat-card {
          background: #fff;
          border-radius: var(--radius);
          padding: 16px;
          box-shadow: var(--shadow);
          border: 1px solid var(--gray-100);
        }
        .inv-stat-card__icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 10px;
        }
        .inv-stat-card__label { font-size: 11px; color: var(--gray-500); font-weight: 500; margin-bottom: 4px; }
        .inv-stat-card__value { font-size: 22px; font-weight: 800; color: var(--gray-800); }

        /* ── Controls bar ────────────────────────── */
        .inv-controls {
          background: #fff;
          border-radius: var(--radius);
          padding: 14px;
          box-shadow: var(--shadow);
          border: 1px solid var(--gray-100);
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
        }
        .inv-controls__search {
          position: relative;
          flex: 1;
          min-width: 180px;
        }
        .inv-controls__search input {
          width: 100%;
          padding: 9px 12px 9px 36px;
          border: 1.5px solid var(--gray-200);
          border-radius: 10px;
          font-size: 13px;
          outline: none;
          transition: border-color .15s;
          background: var(--gray-50);
        }
        .inv-controls__search input:focus { border-color: var(--brand); background: #fff; }
        .inv-controls__search svg {
          position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
          color: var(--gray-400); pointer-events: none;
        }
        .inv-controls select {
          padding: 9px 12px;
          border: 1.5px solid var(--gray-200);
          border-radius: 10px;
          font-size: 13px;
          outline: none;
          background: var(--gray-50);
          color: var(--gray-700);
          cursor: pointer;
          transition: border-color .15s;
        }
        .inv-controls select:focus { border-color: var(--brand); background: #fff; }

        /* ── Buttons ─────────────────────────────── */
        .inv-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 16px; border-radius: 10px;
          font-size: 13px; font-weight: 700; cursor: pointer;
          border: none; transition: opacity .15s, transform .1s;
          white-space: nowrap;
        }
        .inv-btn:hover { opacity: .88; }
        .inv-btn:active { transform: scale(.97); }
        .inv-btn:disabled { opacity: .55; cursor: not-allowed; }
        .inv-btn--primary { background: linear-gradient(135deg, var(--brand), var(--brand-light)); color: #fff; }
        .inv-btn--ghost { background: var(--gray-100); color: var(--gray-700); }
        .inv-btn--icon {
          padding: 7px; border-radius: 8px;
          background: transparent; border: none; cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center;
          transition: background .15s;
        }
        .inv-btn--icon:hover { background: var(--gray-100); }

        /* ── Table card ──────────────────────────── */
        .inv-table-card {
          background: #fff;
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          border: 1px solid var(--gray-100);
          overflow: hidden;
        }
        .inv-table-card__head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 20px;
          border-bottom: 1px solid var(--gray-100);
          font-size: 13px; color: var(--gray-500);
        }
        .inv-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }

        table.inv-table { width: 100%; border-collapse: collapse; min-width: 640px; }
        .inv-table th {
          padding: 10px 16px;
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .05em;
          color: var(--gray-400);
          background: var(--gray-50);
          white-space: nowrap;
        }
        .inv-table td {
          padding: 12px 16px;
          border-top: 1px solid var(--gray-50);
          font-size: 13px;
          color: var(--gray-700);
          vertical-align: middle;
        }
        .inv-table tr:hover td { background: #FAFAFA; }

        .inv-product-cell { display: flex; align-items: center; gap: 10px; }
        .inv-product-cell img {
          width: 40px; height: 40px; border-radius: 10px;
          object-fit: cover; background: var(--gray-100); flex-shrink: 0;
        }
        .inv-product-cell__name {
          font-weight: 600; color: var(--gray-800);
          max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .inv-product-cell__loc { margin-top: 3px; }

        /* ── Mobile cards (< 640 px) ─────────────── */
        .inv-mobile-cards { display: none; }
        @media (max-width: 639px) {
          .inv-table-wrap { display: none; }
          .inv-mobile-cards { display: flex; flex-direction: column; gap: 0; }
        }
        .inv-mobile-card {
          padding: 14px 16px;
          border-top: 1px solid var(--gray-100);
          display: grid;
          grid-template-columns: 44px 1fr auto;
          gap: 10px;
          align-items: center;
        }
        .inv-mobile-card:first-child { border-top: none; }
        .inv-mobile-card img {
          width: 44px; height: 44px; border-radius: 10px;
          object-fit: cover; background: var(--gray-100);
        }
        .inv-mobile-card__info { min-width: 0; }
        .inv-mobile-card__name {
          font-weight: 600; font-size: 13px; color: var(--gray-800);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .inv-mobile-card__meta { font-size: 12px; color: var(--gray-500); margin-top: 2px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .inv-mobile-card__actions { display: flex; gap: 6px; }

        /* ── Badges ──────────────────────────────── */
        .inv-badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 4px 9px; border-radius: 20px;
          font-size: 11px; font-weight: 700; white-space: nowrap;
        }
        .inv-badge--ok { background: #D1FAE5; color: #059669; }
        .inv-badge--low { background: #FEF3C7; color: #D97706; }
        .inv-badge--out { background: #FEE2E2; color: #DC2626; }
        .inv-badge--active { background: #D1FAE5; color: #059669; }
        .inv-badge--inactive { background: var(--gray-100); color: var(--gray-500); }

        /* ── Empty / loading ─────────────────────── */
        .inv-empty {
          padding: 60px 24px; text-align: center; color: var(--gray-400);
        }
        .inv-empty svg { opacity: .3; margin: 0 auto 12px; display: block; }
        .inv-empty p { font-weight: 600; margin-bottom: 4px; color: var(--gray-500); }
        .inv-empty span { font-size: 12px; }

        .inv-loading {
          display: flex; align-items: center; justify-content: center;
          padding: 60px; color: var(--gray-400); gap: 10px; font-size: 14px;
        }
        .inv-spin { animation: inv-rotate 1s linear infinite; }
        @keyframes inv-rotate { to { transform: rotate(360deg); } }

        /* ── Pagination ──────────────────────────── */
        .inv-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 14px 20px;
          border-top: 1px solid var(--gray-100);
          flex-wrap: wrap;
        }
        .inv-pagination__info {
          font-size: 12px;
          color: var(--gray-400);
          margin-left: 8px;
        }
        .inv-page-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 34px;
          height: 34px;
          padding: 0 8px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: 1.5px solid transparent;
          transition: background .15s, border-color .15s, color .15s, transform .1s;
          background: transparent;
          color: var(--gray-700);
        }
        .inv-page-btn:hover:not(:disabled):not(.inv-page-btn--active) {
          background: var(--gray-100);
          border-color: var(--gray-200);
        }
        .inv-page-btn:active:not(:disabled) { transform: scale(.95); }
        .inv-page-btn:disabled { opacity: .4; cursor: not-allowed; }
        .inv-page-btn--active {
          background: var(--brand);
          color: #fff;
          border-color: var(--brand);
          cursor: default;
        }
        .inv-page-btn--nav {
          background: var(--gray-100);
          color: var(--gray-700);
          border-color: var(--gray-200);
        }
        .inv-page-btn--nav:hover:not(:disabled) {
          background: var(--gray-200);
          border-color: var(--gray-300);
        }
        .inv-page-ellipsis {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 28px;
          height: 34px;
          font-size: 13px;
          color: var(--gray-400);
          user-select: none;
        }

        /* ── Error banner ────────────────────────── */
        .inv-error {
          background: #FEF2F2; border: 1px solid #FECACA;
          border-radius: var(--radius); padding: 14px 16px;
          color: #DC2626; font-size: 13px; font-weight: 500;
          display: flex; align-items: center; gap: 8px;
        }

        /* ── Overlay / modal ─────────────────────── */
        .inv-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,.45); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          z-index: 100; padding: 16px;
        }
        .inv-modal {
          background: #fff; border-radius: 18px;
          width: 100%; max-width: 520px;
          max-height: 92dvh; overflow-y: auto;
          box-shadow: 0 24px 64px rgba(0,0,0,.18);
          display: flex; flex-direction: column;
        }
        .inv-modal__header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 24px 0;
        }
        .inv-modal__header h2 { font-size: 16px; font-weight: 800; color: var(--gray-800); }
        .inv-modal__close {
          background: none; border: none; cursor: pointer;
          color: var(--gray-400); padding: 4px; border-radius: 6px;
          display: flex; align-items: center;
          transition: color .15s;
        }
        .inv-modal__close:hover { color: var(--gray-700); }
        .inv-modal__body { padding: 20px 24px; flex: 1; overflow-y: auto; overflow-x: visible; }
        .inv-modal__footer {
          padding: 16px 24px;
          border-top: 1px solid var(--gray-100);
          display: flex; gap: 10px;
        }
        .inv-modal__footer .inv-btn { flex: 1; justify-content: center; }
        .inv-modal__error {
          background: #FEF2F2; border: 1px solid #FECACA;
          border-radius: 8px; padding: 10px 12px;
          color: #DC2626; font-size: 12px; margin-bottom: 14px;
        }

        /* ── Form ────────────────────────────────── */
        .inv-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 479px) { .inv-form-grid { grid-template-columns: 1fr; } }
        .inv-field { display: flex; flex-direction: column; gap: 5px; }
        .inv-field--full { grid-column: 1 / -1; }
        .inv-field label { font-size: 12px; font-weight: 600; color: #4B5563; }
        .inv-field input,
        .inv-field select,
        .inv-field textarea {
          padding: 9px 12px;
          border: 1.5px solid var(--gray-200);
          border-radius: 10px;
          font-size: 13px;
          outline: none;
          background: var(--gray-50);
          color: var(--gray-800);
          transition: border-color .15s;
          font-family: inherit;
          resize: vertical;
        }
        .inv-field input:focus,
        .inv-field select:focus,
        .inv-field textarea:focus { border-color: var(--brand); background: #fff; }

        /* ── Toast ───────────────────────────────── */
        .inv-toast {
          position: fixed; bottom: 24px; right: 24px;
          display: flex; align-items: center; gap: 8px;
          padding: 12px 16px; border-radius: 12px;
          font-size: 13px; font-weight: 600;
          box-shadow: 0 8px 24px rgba(0,0,0,.12);
          z-index: 200;
          animation: inv-slideup .25s ease;
          max-width: calc(100vw - 32px);
        }
        @keyframes inv-slideup {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        .inv-toast--success { background: #ECFDF5; color: #065F46; }
        .inv-toast--error   { background: #FEF2F2; color: #991B1B; }
        .inv-toast__close {
          background: none; border: none; cursor: pointer;
          color: inherit; opacity: .6; padding: 2px;
          display: flex; align-items: center; margin-left: 4px;
        }
        .inv-toast__close:hover { opacity: 1; }
      `}</style>

      <div className="inv-root">

        {/* Toast */}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        {/* Modal */}
        {modal && store && (
          <ProductModal
            mode={modal.mode}
            product={modal.product}
            storeId={store.id}
            storeName={store.store_name}
            locations={locations}
            defaultLocationId={locationId ?? undefined}
            categories={categories}
            onClose={() => setModal(null)}
            onSaved={handleSaved}
          />
        )}

        {/* Error banner */}
        {loadError && (
          <div className="inv-error">
            <AlertTriangle style={{ width: 16, height: 16, flexShrink: 0 }} />
            {loadError}
          </div>
        )}

        {/* Location selector with multi-location inventory tracking */}
        {store && locations.length > 0 && (
          <LocationDropdown
            storeName={store.store_name}
            locations={locations}
            value={locationId ?? ''}
            onChange={handleLocationChange}
            includeAll={locations.length > 1}
            variant="page"
            label="Select Store"
          />
        )}

        {/* Stats with inventory awareness */}
        <div className="inv-stats">
          {[
            { icon: Package, label: 'Total Products', value: (stats?.total_products ?? total ?? 0).toString(), color: '#8B1538' },
            { icon: AlertTriangle, label: 'Low Stock', value: lowStockCount.toString(), color: '#D97706' },
            { icon: Package, label: 'Out of Stock', value: outOfStockCount.toString(), color: '#DC2626' },
            {
              icon: DollarSign, label: 'Inventory Value',
              value: totalValue >= 1_000_000
                ? `₦${(totalValue / 1_000_000).toFixed(1)}M`
                : `₦${((totalValue ?? 0) / 1000).toFixed(0)}K`,
              color: '#3D9B8E',
            },
          ].map(s => (
            <div key={s.label} className="inv-stat-card">
              <div className="inv-stat-card__icon" style={{ background: `${s.color}18` }}>
                <s.icon style={{ width: 18, height: 18, color: s.color }} />
              </div>
              <div className="inv-stat-card__label">{s.label}</div>
              <div className="inv-stat-card__value">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="inv-controls">
          <div className="inv-controls__search">
            <Search style={{ width: 15, height: 15 }} />
            <input
              id="inventory-search"
              name="search"
              type="text"
              placeholder="Search products or SKU…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {categories.length > 0 && (
            <select id="inventory-category-filter" name="categoryFilter" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}

          <select id="inventory-status-filter" name="statusFilter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="low">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          <button
            className="inv-btn inv-btn--ghost"
            onClick={loadProducts}
            title="Refresh"
            style={{ marginLeft: 'auto' }}
          >
            <RefreshCw style={{ width: 14, height: 14 }} />
          </button>

          <button
            className="inv-btn inv-btn--primary"
            onClick={() => setModal({ mode: 'add' })}
            disabled={!store || locations.length === 0}
          >
            <Plus style={{ width: 14, height: 14 }} /> Add Product
          </button>
        </div>

        {/* Table */}
        <div className="inv-table-card">
          <div className="inv-table-card__head">
            <span>
              {filtered.length} product{filtered.length !== 1 ? 's' : ''}
              {isAllLocations && locations.length > 1 ? ' across all locations' : ''}
            </span>
            <Filter style={{ width: 14, height: 14 }} />
          </div>

          {loading ? (
            <div className="inv-loading">
              <Loader2 className="inv-spin" style={{ width: 20, height: 20 }} />
              Loading products…
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="inv-table-wrap">
                <table className="inv-table">
                  <thead>
                    <tr>
                      {['Product', 'SKU', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div className="inv-product-cell">
                            <img
                              src={p.images?.[0] ?? 'https://via.placeholder.com/40?text=?'}
                              alt={p.name}
                              onError={e => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=?'; }}
                            />
                            <div>
                              <span className="inv-product-cell__name">{p.name}</span>
                              {isAllLocations && locations.length > 1 && (
                                <div className="inv-product-cell__loc">{renderLocationStock(p)}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td><code style={{ fontSize: 11, color: '#6B7280' }}>{p.sku}</code></td>
                        <td>
                          <span style={{
                            padding: '3px 9px', borderRadius: 20,
                            fontSize: 11, fontWeight: 600,
                            background: '#8B153815', color: '#8B1538',
                          }}>
                            {p.category?.name ?? '—'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: '#1F2937' }}>₦{(p.price ?? 0).toLocaleString()}</td>
                        <td><StockBadge status={p.stock_status} qty={p.stock_quantity ?? 0} /></td>
                        <td>
                          <span className={`inv-badge ${p.is_active ? 'inv-badge--active' : 'inv-badge--inactive'}`}>
                            {p.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              className="inv-btn--icon"
                              style={{ color: '#3B82F6' }}
                              onClick={() => setModal({ mode: 'edit', product: p })}
                              title="Edit"
                            >
                              <Edit style={{ width: 14, height: 14 }} />
                            </button>
                            <button
                              className="inv-btn--icon"
                              style={{ color: '#EF4444' }}
                              onClick={() => handleDelete(p)}
                              disabled={deleting === p.id}
                              title="Delete"
                            >
                              {deleting === p.id
                                ? <Loader2 className="inv-spin" style={{ width: 14, height: 14 }} />
                                : <Trash2 style={{ width: 14, height: 14 }} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="inv-empty">
                    <Package style={{ width: 40, height: 40 }} />
                    <p>No products found</p>
                    <span>Try adjusting your search or filters</span>
                  </div>
                )}
              </div>

              {/* Mobile cards */}
              <div className="inv-mobile-cards">
                {filtered.length === 0 && (
                  <div className="inv-empty">
                    <Package style={{ width: 36, height: 36 }} />
                    <p>No products found</p>
                    <span>Try adjusting your filters</span>
                  </div>
                )}
                {filtered.map(p => (
                  <div key={p.id} className="inv-mobile-card">
                    <img
                      src={p.images?.[0] ?? 'https://via.placeholder.com/44?text=?'}
                      alt={p.name}
                      onError={e => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/44?text=?'; }}
                    />
                    <div className="inv-mobile-card__info">
                      <div className="inv-mobile-card__name">{p.name}</div>
                      <div className="inv-mobile-card__meta">
                        ₦{(p.price ?? 0).toLocaleString()} · <StockBadge status={p.stock_status} qty={p.stock_quantity ?? 0} />
                        {isAllLocations && locations.length > 1 && renderLocationStock(p)}
                      </div>
                    </div>
                    <div className="inv-mobile-card__actions">
                      <button
                        className="inv-btn--icon"
                        style={{ color: '#3B82F6' }}
                        onClick={() => setModal({ mode: 'edit', product: p })}
                      >
                        <Edit style={{ width: 15, height: 15 }} />
                      </button>
                      <button
                        className="inv-btn--icon"
                        style={{ color: '#EF4444' }}
                        onClick={() => handleDelete(p)}
                        disabled={deleting === p.id}
                      >
                        {deleting === p.id
                          ? <Loader2 className="inv-spin" style={{ width: 15, height: 15 }} />
                          : <Trash2 style={{ width: 15, height: 15 }} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="inv-pagination">
                  <button
                    className="inv-page-btn inv-page-btn--nav"
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    aria-label="Previous page"
                  >
                    <ChevronLeft style={{ width: 14, height: 14 }} />
                  </button>

                  {pageNumbers.map((p, i) =>
                    p === '…' ? (
                      <span key={`ellipsis-${i}`} className="inv-page-ellipsis">…</span>
                    ) : (
                      <button
                        key={p}
                        className={`inv-page-btn${p === page ? ' inv-page-btn--active' : ''}`}
                        onClick={() => setPage(p as number)}
                        aria-label={`Page ${p}`}
                        aria-current={p === page ? 'page' : undefined}
                      >
                        {p}
                      </button>
                    )
                  )}

                  <button
                    className="inv-page-btn inv-page-btn--nav"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    aria-label="Next page"
                  >
                    <ChevronRight style={{ width: 14, height: 14 }} />
                  </button>

                  <span className="inv-pagination__info">
                    {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total.toLocaleString()}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default BusinessInventory;