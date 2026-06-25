import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Store, MapPin, Star, Package, Eye, Check, Camera,
  Loader2, Plus, Trash2, ChevronDown, ChevronUp, AlertCircle,
  ShoppingBag, BarChart2, ArrowLeft, ArrowRight, Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  createStore, createStoreLocation, updateStore, fetchCategories, uploadImage, getMyStores,
  type ApiStore, type ApiStoreLocation, type StoreLocationBody, type UploadContext,
} from '../../services/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Electronics & Technology',
  'Food & Beverages',
  'Health & Beauty',
  'Home & Living',
  'Industrial & Manufacturing',
  'Automotive',
  'Agriculture',
  'Office Supplies',
  'Digital Products & Services',
  'Other',
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface Location {
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
  category: string;
  tagline: string;
  description: string;
  website: string;
  whatsapp: string;
  logo: string;
  cover_image: string;
  return_policy: string;
  shipping_policy: string;
  locations: Location[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeLocId = () => `loc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

function makeLocation(isPrimary = false): Location {
  return {
    id: makeLocId(), isPrimary,
    branchName: isPrimary ? 'Main Branch' : '',
    branchManager: '', streetAddress: '', city: '',
    state: '', phone: '', email: '', openingHours: '',
  };
}

function getInitials(name: string): string {
  return (name || '?').split(/\s+/).slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? '').join('') || '?';
}

// ─── Shared Styles ────────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 outline-none focus:border-[#8B1538] focus:ring-2 focus:ring-[#8B1538]/10 transition-all placeholder:text-gray-400';

// ─── Field ────────────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

function Field({ label, required, hint, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
        {label}{required && <span className="text-[#8B1538] ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

interface SectionCardProps {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}

function SectionCard({ icon: Icon, title, children }: SectionCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 lg:p-6 shadow-sm border border-gray-100">
      <h3 className="flex items-center gap-2 font-bold text-gray-800 mb-4 sm:mb-5 text-sm sm:text-base">
        <Icon className="h-4 w-4 text-[#8B1538] flex-shrink-0" />
        <span className="truncate">{title}</span>
      </h3>
      {children}
    </div>
  );
}

// ─── Store Header Preview ─────────────────────────────────────────────────────

function StoreHeaderPreview({ form }: { form: StoreForm }) {
  const init = getInitials(form.store_name);
  const primaryLoc = form.locations.find((l: Location) => l.isPrimary) ?? form.locations[0];

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      {/* Cover */}
      <div
        className="relative h-28 xs:h-32 sm:h-40 flex items-end justify-between px-3 sm:px-5 pb-3"
        style={{
          background: form.cover_image
            ? `url(${form.cover_image}) center/cover no-repeat`
            : 'linear-gradient(135deg, #3d0a18 0%, #6b1128 50%, #2a0512 100%)',
        }}
      >
        <button className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-black/30 text-white/80 text-[11px] sm:text-xs font-medium hover:bg-black/50 transition-colors">
          <Camera className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
          <span className="hidden xs:inline">Change Cover</span>
        </button>
        <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-400/30 text-green-300 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
          <span>Live Store</span>
        </div>
      </div>

      {/* Avatar + meta */}
      <div className="px-3 sm:px-5 pb-4">
        <div className="flex flex-wrap items-end justify-between gap-2 -mt-6 sm:-mt-7 mb-3">
          <div className="relative flex-shrink-0">
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center text-white font-bold text-base sm:text-lg lg:text-xl border-[3px] sm:border-4 border-white shadow-lg overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #8B1538, #D4828F)' }}
            >
              {form.logo
                ? <img src={form.logo} alt={form.store_name} className="w-full h-full object-cover" />
                : init}
            </div>
            <button className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#8B1538] text-white flex items-center justify-center shadow hover:bg-[#6B0F2A] transition-colors">
              <Camera className="h-2.5 w-2.5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pb-1">
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-amber-400 flex-shrink-0" />
              <span className="text-xs font-bold text-gray-700">4.8</span>
              <span className="text-xs text-gray-400 hidden sm:inline">(1,240 reviews)</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-1">
              <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" /> Verified
            </span>
          </div>
        </div>

        <p className="font-bold text-gray-900 text-sm sm:text-base mb-0.5 truncate">{form.store_name || 'Your Store'}</p>
        {form.tagline && <p className="text-xs text-gray-400 mb-2 line-clamp-1">{form.tagline}</p>}

        <div className="flex flex-wrap gap-2 sm:gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1"><Package className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" /> 142 Products</span>
          <span className="flex items-center gap-1"><Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" /> 12,840 Visitors</span>
          {form.locations.length > 0 && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
              {form.locations.length} Location{form.locations.length !== 1 ? 's' : ''}
            </span>
          )}
          {primaryLoc?.city && (
            <span className="flex items-center gap-1 max-w-[120px] truncate">
              <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
              <span className="truncate">{primaryLoc.city}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Location Card Header ─────────────────────────────────────────────────────

interface LocationCardHeaderProps {
  loc: Location;
  index: number;
  totalCount: number;
  onDelete: (id: string) => void;
  onMakePrimary: (id: string) => void;
  open: boolean;
  onToggle: () => void;
}

function LocationCardHeader({ loc, index, totalCount, onDelete, onMakePrimary, open, onToggle }: LocationCardHeaderProps) {
  return (
    <div
      className="flex items-start sm:items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 cursor-pointer select-none gap-2"
      onClick={onToggle}
    >
      {/* Left: icon + name + badge */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${loc.isPrimary ? 'bg-[#8B1538]' : 'bg-gray-200'}`}>
          <Store className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${loc.isPrimary ? 'text-white' : 'text-gray-500'}`} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-sm text-gray-800 truncate">
              {loc.branchName || `Location ${index + 1}`}
            </span>
            {loc.isPrimary && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-[#8B1538] text-white flex-shrink-0">
                Primary
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: actions + chevron */}
      <div className="flex items-center gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
        {!loc.isPrimary && (
          <button
            onClick={() => onMakePrimary(loc.id)}
            className="text-[#8B1538] text-[10px] sm:text-xs font-semibold border border-[#8B1538] rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 hover:bg-[#8B1538]/5 transition-colors whitespace-nowrap"
          >
            Make primary
          </button>
        )}
        {totalCount > 1 && (
          <button
            onClick={() => onDelete(loc.id)}
            className="p-1 sm:p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </button>
        )}
        <span className="text-gray-400 p-0.5" onClick={onToggle}>
          {open ? <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
        </span>
      </div>
    </div>
  );
}

// ─── Location Card Full ───────────────────────────────────────────────────────

interface LocationCardFullProps {
  loc: Location;
  index: number;
  totalCount: number;
  onUpdate: (id: string, changes: Partial<Location>) => void;
  onDelete: (id: string) => void;
  onMakePrimary: (id: string) => void;
}

function LocationCardFull({ loc, index, totalCount, onUpdate, onDelete, onMakePrimary }: LocationCardFullProps) {
  const [open, setOpen] = useState(true);
  const set = (key: keyof Location) => (e: React.ChangeEvent<HTMLInputElement>) => onUpdate(loc.id, { [key]: e.target.value });

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
      <LocationCardHeader
        loc={loc} index={index} totalCount={totalCount}
        onDelete={onDelete} onMakePrimary={onMakePrimary}
        open={open} onToggle={() => setOpen(o => !o)}
      />
      {open && (
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4">
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
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4">
            <Field label="City" required>
              <input className={inputCls} value={loc.city} onChange={set('city')} placeholder="City" />
            </Field>
            <Field label="State / Region">
              <input className={inputCls} value={loc.state} onChange={set('state')} placeholder="State" />
            </Field>
          </div>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4">
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
    <div className="space-y-0 rounded-2xl overflow-hidden">
      <div
        className="flex flex-col items-center justify-center gap-4 sm:gap-5 py-10 sm:py-14 px-4 sm:px-6 text-center"
        style={{ background: 'linear-gradient(135deg, #3d0a18 0%, #6b1128 50%, #2a0512 100%)' }}
      >
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 flex items-center justify-center">
          <Store className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
        </div>
        <div>
          <h2 className="text-white font-bold text-lg sm:text-xl lg:text-2xl mb-2">You don't have a store yet</h2>
          <p className="text-white/70 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            Set up your Ndeko storefront in two quick steps. Add as many physical locations as you need — each with its own contact details.
          </p>
        </div>
        <button
          onClick={onCreate}
          className="flex items-center gap-2 bg-white text-[#3d0a18] font-bold text-sm rounded-full px-5 sm:px-6 py-2.5 sm:py-3 hover:bg-white/90 transition-colors mt-1"
        >
          <Plus className="h-4 w-4" /> Create Store
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3">
        {[
          { icon: Store, title: 'Brand your storefront', desc: 'Logo, cover, tagline, policies.' },
          { icon: MapPin, title: 'Multiple locations', desc: 'Each branch gets its own phone, email, manager.' },
          { icon: ShoppingBag, title: 'Start selling', desc: 'Inventory & orders unlocked after setup.' },
        ].map((f, i) => (
          <div
            key={f.title}
            className={`bg-white p-4 sm:p-5 border-t border-gray-100 ${i < 2 ? 'sm:border-r' : ''}`}
          >
            <f.icon className="h-4 w-4 sm:h-5 sm:w-5 text-[#8B1538] mb-2 sm:mb-3" />
            <p className="font-semibold text-xs sm:text-sm text-gray-800 mb-1">{f.title}</p>
            <p className="text-[11px] sm:text-xs text-gray-400">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Wizard Location Card ─────────────────────────────────────────────────────

interface WizardLocCardProps {
  loc: Location;
  index: number;
  total: number;
  onUpdate: (id: string, changes: Partial<Location>) => void;
  onDelete: (id: string) => void;
}

function WizardLocCard({ loc, index, total, onUpdate, onDelete }: WizardLocCardProps) {
  const set = (key: keyof Location) => (e: React.ChangeEvent<HTMLInputElement>) => onUpdate(loc.id, { [key]: e.target.value });
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 bg-gray-50">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${loc.isPrimary ? 'bg-[#8B1538]' : 'bg-gray-200'}`}>
            <Store className={`h-3.5 w-3.5 ${loc.isPrimary ? 'text-white' : 'text-gray-500'}`} />
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-semibold text-sm text-gray-800">Location {index + 1}</span>
            {loc.isPrimary && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-[#8B1538] text-white flex-shrink-0">
                Primary
              </span>
            )}
          </div>
        </div>
        {total > 1 && (
          <button onClick={() => onDelete(loc.id)} className="p-1 sm:p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="p-3 sm:p-4 space-y-3">
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
          <Field label="Branch Name" required>
            <input className={inputCls} value={loc.branchName} onChange={set('branchName')} placeholder="e.g. Main Branch" />
          </Field>
          <Field label="Branch Manager">
            <input className={inputCls} value={loc.branchManager} onChange={set('branchManager')} placeholder="Manager's name" />
          </Field>
        </div>
        <Field label="Street Address" required>
          <input className={inputCls} value={loc.streetAddress} onChange={set('streetAddress')} placeholder="Street address" />
        </Field>
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
          <Field label="City" required>
            <input className={inputCls} value={loc.city} onChange={set('city')} placeholder="City" />
          </Field>
          <Field label="State / Region">
            <input className={inputCls} value={loc.state} onChange={set('state')} placeholder="State" />
          </Field>
        </div>
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
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
    </div>
  );
}

// ─── Image Upload Field ───────────────────────────────────────────────────────

const ACCEPTED = 'image/jpeg,image/png,image/webp,image/gif';
const MAX_BYTES = 5 * 1024 * 1024;

interface ImageUploadFieldProps {
  label: string;
  context: UploadContext;
  value: string;
  onChange: (url: string) => void;
  aspect?: 'square' | 'wide';
}

function ImageUploadField({ label, context, value, onChange, aspect = 'square' }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_BYTES) { setError('File exceeds 5 MB'); return; }
    setError('');
    setUploading(true);
    try {
      const res = await uploadImage(file, context);
      onChange(res.url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={`relative flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl overflow-hidden hover:border-[#8B1538] transition-colors group disabled:opacity-60 ${aspect === 'wide' ? 'h-20' : 'h-20 w-20'}`}
      >
        {value ? (
          <img src={value} alt={label} className="w-full h-full object-cover" />
        ) : uploading ? (
          <Loader2 className="h-5 w-5 animate-spin text-[#8B1538]" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-400 group-hover:text-[#8B1538] transition-colors px-2">
            <Camera className="h-5 w-5" />
            <span className="text-[10px] font-medium text-center leading-tight">Upload</span>
          </div>
        )}
        {value && !uploading && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="h-5 w-5 text-white" />
          </div>
        )}
      </button>
      {error && <p className="text-[10px] text-red-500">{error}</p>}
      <input ref={inputRef} type="file" accept={ACCEPTED} className="hidden" onChange={handleFile} />
    </div>
  );
}

// ─── Create Store Modal ───────────────────────────────────────────────────────

interface CreateStoreModalProps {
  onClose: () => void;
  onCreated: (store: ApiStore) => void;
}

function CreateStoreModal({ onClose, onCreated }: CreateStoreModalProps) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [categoryOptions, setCategoryOptions] = useState<string[]>(CATEGORIES);
  const [wizard, setWizard] = useState({
    store_name: '', category_slug: '', tagline: '', description: '',
    whatsapp_number: '', return_policy: '', shipping_policy: '',
    logo_url: '', banner_url: '',
    locations: [makeLocation(true)],
  });

  useEffect(() => {
    fetchCategories({ limit: 50 }).then(res => {
      if (res.data.length) setCategoryOptions(res.data.map(c => c.name));
    }).catch(() => {});
  }, []);

  const setW = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setWizard(prev => ({ ...prev, [key]: e.target.value }));

  const updateWizLoc = (id: string, changes: Partial<Location>) =>
    setWizard(prev => ({
      ...prev,
      locations: prev.locations.map(l => l.id === id ? { ...l, ...changes } : l),
    }));

  const deleteWizLoc = (id: string) => {
    setWizard(prev => {
      const remaining = prev.locations.filter(l => l.id !== id);
      if (remaining.length > 0 && !remaining.some(l => l.isPrimary)) remaining[0].isPrimary = true;
      return { ...prev, locations: remaining };
    });
  };

  const addWizLoc = () =>
    setWizard(prev => ({ ...prev, locations: [...prev.locations, makeLocation(false)] }));

  const primaryLoc = wizard.locations.find(l => l.isPrimary) ?? wizard.locations[0];
  const extraLocs = wizard.locations.filter(l => l !== primaryLoc);

  const canNext = wizard.store_name.trim().length > 0;

  const canCreate =
    primaryLoc?.branchName.trim() &&
    primaryLoc?.streetAddress.trim() &&
    primaryLoc?.city.trim() &&
    primaryLoc?.phone.trim();

  const handleCreate = async () => {
    if (!canCreate) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const primaryLocBody: StoreLocationBody = {
        branch_name: primaryLoc.branchName,
        street: primaryLoc.streetAddress,
        city: primaryLoc.city,
        phone: primaryLoc.phone,
        state: primaryLoc.state || undefined,
        branch_manager: primaryLoc.branchManager || undefined,
        email: primaryLoc.email || undefined,
        opening_hours: primaryLoc.openingHours || undefined,
      };

      const store = await createStore({
        store_name: wizard.store_name,
        location: primaryLocBody,
        delivery_fee: 0,
        store_tagline: wizard.tagline || undefined,
        category_slug: wizard.category_slug || undefined,
        description: wizard.description || undefined,
        whatsapp_number: wizard.whatsapp_number || undefined,
        return_policy: wizard.return_policy || undefined,
        shipping_policy: wizard.shipping_policy || undefined,
        logo_url: wizard.logo_url || undefined,
        banner_url: wizard.banner_url || undefined,
      });

      for (const loc of extraLocs) {
        if (!loc.branchName || !loc.streetAddress || !loc.city || !loc.phone) continue;
        await createStoreLocation(store.id, {
          branch_name: loc.branchName,
          street: loc.streetAddress,
          city: loc.city,
          phone: loc.phone,
          state: loc.state || undefined,
          branch_manager: loc.branchManager || undefined,
          email: loc.email || undefined,
          opening_hours: loc.openingHours || undefined,
          is_primary: false,
        });
      }

      onCreated(store);
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : 'Failed to create store. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col"
        style={{ maxHeight: 'calc(100dvh - 24px)' }}
      >
        {/* Header */}
        <div
          className="px-4 sm:px-6 py-4 sm:py-5 relative flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #3d0a18 0%, #6b1128 60%, #2a0512 100%)' }}
        >
          <p className="text-white/60 text-[11px] font-semibold mb-0.5">Step {step} of 2</p>
          <p className="text-white font-bold text-lg sm:text-xl pr-8">
            {step === 1 ? 'Tell us about your store' : 'Add your store locations'}
          </p>
          <button
            onClick={onClose}
            className="absolute top-3.5 right-4 text-white/60 hover:text-white text-xl leading-none p-1"
          >
            ✕
          </button>
        </div>

        {/* Progress stepper */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-5 flex-shrink-0">
          <div className="flex items-center">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${step >= 1 ? 'bg-[#8B1538] text-white' : 'border-2 border-gray-200 text-gray-400'}`}>
              {step > 1 ? <Check className="h-3.5 w-3.5" /> : '1'}
            </div>
            <div className={`flex-1 h-0.5 transition-all ${step > 1 ? 'bg-[#8B1538]' : 'bg-gray-200'}`} />
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${step === 2 ? 'bg-[#8B1538] text-white' : 'border-2 border-gray-200 text-gray-400'}`}>
              2
            </div>
            <div className="flex-1 h-0.5 bg-gray-200" />
          </div>
        </div>

        {/* Scrollable body */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1 overscroll-contain">
          {step === 1 ? (
            <div className="space-y-3 sm:space-y-4">
              <Field label="Store Name" required>
                <input className={inputCls} value={wizard.store_name} onChange={setW('store_name')} placeholder="e.g. TechHub Lagos" />
              </Field>
              <Field label="Category">
                <select className={`${inputCls} bg-white`} value={wizard.category_slug} onChange={setW('category_slug')}>
                  <option value="">Select category…</option>
                  {categoryOptions.map(c => <option key={c} value={c.toLowerCase().replace(/\s+/g, '-')}>{c}</option>)}
                </select>
              </Field>
              <Field label="Tagline">
                <input className={inputCls} value={wizard.tagline} onChange={setW('tagline')} placeholder="A short catchy line about your store" />
              </Field>
              <Field label="Description">
                <textarea className={`${inputCls} resize-none`} rows={3} value={wizard.description} onChange={setW('description')} placeholder="Tell buyers about your store…" />
              </Field>
              <Field label="WhatsApp Number">
                <input className={inputCls} value={wizard.whatsapp_number} onChange={setW('whatsapp_number')} placeholder="+234 800 000 0000" />
              </Field>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <Field label="Return Policy">
                  <textarea className={`${inputCls} resize-none`} rows={2} value={wizard.return_policy} onChange={setW('return_policy')} placeholder="e.g. 7-day returns accepted" />
                </Field>
                <Field label="Shipping Policy">
                  <textarea className={`${inputCls} resize-none`} rows={2} value={wizard.shipping_policy} onChange={setW('shipping_policy')} placeholder="e.g. Ships within 24 hours" />
                </Field>
              </div>
              <div className="flex gap-4">
                <ImageUploadField
                  label="Store Logo"
                  context="store-logo"
                  value={wizard.logo_url}
                  onChange={url => setWizard(prev => ({ ...prev, logo_url: url }))}
                  aspect="square"
                />
                <div className="flex-1">
                  <ImageUploadField
                    label="Store Banner"
                    context="store-banner"
                    value={wizard.banner_url}
                    onChange={url => setWizard(prev => ({ ...prev, banner_url: url }))}
                    aspect="wide"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs text-gray-400 mb-3 sm:mb-4 leading-relaxed">
                Add one or more physical locations. Each location can have its own contact information and manager.
              </p>
              {wizard.locations.map((loc, i) => (
                <WizardLocCard
                  key={loc.id} loc={loc} index={i} total={wizard.locations.length}
                  onUpdate={updateWizLoc} onDelete={deleteWizLoc}
                />
              ))}
              <button
                onClick={addWizLoc}
                className="flex items-center gap-2 text-sm font-bold text-white px-4 py-2 rounded-full mt-1"
                style={{ background: 'linear-gradient(135deg, #8B1538, #D4828F)' }}
              >
                <Plus className="h-3.5 w-3.5" /> Add another location
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100 flex-shrink-0">
          {submitError && (
            <div className="flex items-center gap-2 text-red-600 text-xs mb-3 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {submitError}
            </div>
          )}
          <div className="flex items-center justify-between">
            {step === 1 ? (
              <>
                <button onClick={onClose} className="text-sm font-semibold text-gray-500 hover:text-gray-700 py-1">Cancel</button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!canNext}
                  className="flex items-center gap-2 text-white font-bold text-sm rounded-full px-4 sm:px-5 py-2 sm:py-2.5 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #8B1538, #D4828F)' }}
                >
                  Next: Locations <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setStep(1)} disabled={submitting} className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-700 py-1 disabled:opacity-50">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                <button
                  onClick={handleCreate}
                  disabled={submitting || !canCreate}
                  className="flex items-center gap-2 text-white font-bold text-sm rounded-full px-4 sm:px-5 py-2 sm:py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #8B1538, #D4828F)' }}
                >
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {submitting ? 'Creating…' : 'Create Store'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function apiLocationToLocal(l: ApiStoreLocation): Location {
  return {
    id: l.id,
    isPrimary: l.is_primary,
    branchName: l.branch_name,
    branchManager: l.branch_manager ?? '',
    streetAddress: l.street,
    city: l.city,
    state: l.state ?? '',
    phone: l.phone,
    email: l.email ?? '',
    openingHours: l.opening_hours ?? '',
  };
}

function storeToForm(store: ApiStore): StoreForm {
  const locations = (store.locations ?? []).map(apiLocationToLocal);
  if (locations.length > 0 && !locations.some(l => l.isPrimary)) locations[0].isPrimary = true;
  return {
    store_name: store.store_name,
    category: store.category
      ? typeof store.category === 'string' ? store.category : (store.category as { name: string }).name
      : '',
    tagline: store.store_tagline ?? '',
    description: store.description ?? '',
    website: '',
    whatsapp: store.whatsapp_number ?? '',
    logo: store.logo_url ?? '',
    cover_image: store.banner_url ?? '',
    return_policy: store.return_policy ?? '',
    shipping_policy: store.shipping_policy ?? '',
    locations,
  };
}

export function BusinessStorefront() {
  const [view, setView] = useState<'loading' | 'empty' | 'form'>('loading');
  const [showModal, setShowModal] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [form, setForm] = useState<StoreForm | null>(null);
  const [originalForm, setOriginalForm] = useState<StoreForm | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle');

  useEffect(() => {
    getMyStores()
      .then(stores => {
        const list = Array.isArray(stores) ? stores : (stores as { data?: ApiStore[] }).data ?? [];
        if (list.length > 0) {
          const store = list[0];
          const f = storeToForm(store);
          setStoreId(store.id);
          setForm(f);
          setOriginalForm(JSON.parse(JSON.stringify(f)));
          setView('form');
        } else {
          setView('empty');
        }
      })
      .catch(() => setView('empty'));
  }, []);

  const handleStoreCreated = useCallback((store: ApiStore) => {
    const f = storeToForm(store);
    setStoreId(store.id);
    setForm(f);
    setOriginalForm(JSON.parse(JSON.stringify(f)));
    setIsDirty(false);
    setView('form');
    setShowModal(false);
  }, []);

  const setField = (key: keyof StoreForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => {
      if (!prev) return prev;
      const next = { ...prev, [key]: e.target.value };
      setIsDirty(JSON.stringify(next) !== JSON.stringify(originalForm));
      return next;
    });
  };

  const addLocation = () => {
    setForm(prev => {
      if (!prev) return prev;
      const next = { ...prev, locations: [...prev.locations, makeLocation(prev.locations.length === 0)] };
      setIsDirty(JSON.stringify(next) !== JSON.stringify(originalForm));
      return next;
    });
  };

  const updateLocation = (id: string, changes: Partial<Location>) => {
    setForm(prev => {
      if (!prev) return prev;
      const next = { ...prev, locations: prev.locations.map((l: Location) => l.id === id ? { ...l, ...changes } : l) };
      setIsDirty(JSON.stringify(next) !== JSON.stringify(originalForm));
      return next;
    });
  };

  const deleteLocation = (id: string) => {
    setForm(prev => {
      if (!prev) return prev;
      const remaining = prev.locations.filter((l: Location) => l.id !== id);
      if (remaining.length > 0 && !remaining.some((l: Location) => l.isPrimary)) remaining[0].isPrimary = true;
      const next = { ...prev, locations: remaining };
      setIsDirty(JSON.stringify(next) !== JSON.stringify(originalForm));
      return next;
    });
  };

  const makePrimary = (id: string) => {
    setForm(prev => {
      if (!prev) return prev;
      const next = { ...prev, locations: prev.locations.map((l: Location) => ({ ...l, isPrimary: l.id === id })) };
      setIsDirty(JSON.stringify(next) !== JSON.stringify(originalForm));
      return next;
    });
  };

  const handleSave = async () => {
    if (!storeId || !form) return;
    setSaving(true);
    setSaveState('idle');
    try {
      await updateStore(storeId, {
        store_name: form.store_name,
        store_tagline: form.tagline || undefined,
        description: form.description || undefined,
        whatsapp_number: form.whatsapp || undefined,
        return_policy: form.return_policy || undefined,
        shipping_policy: form.shipping_policy || undefined,
        logo_url: form.logo || undefined,
        banner_url: form.cover_image || undefined,
      });
      setOriginalForm(JSON.parse(JSON.stringify(form)));
      setIsDirty(false);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2500);
    } catch {
      setSaveState('error');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setForm(JSON.parse(JSON.stringify(originalForm)));
    setIsDirty(false);
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-3 xs:px-4 sm:px-5 lg:px-6 py-4 sm:py-6">

        {showModal && (
          <CreateStoreModal onClose={() => setShowModal(false)} onCreated={handleStoreCreated} />
        )}

        <p className="text-xs text-gray-400 mb-0.5">
          Business Portal › <span className="text-[#8B1538] font-semibold">Storefront</span>
        </p>
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-4 sm:mb-5">Storefront</h1>

        {view === 'loading' ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin text-[#8B1538]" />
          </div>
        ) : view === 'empty' ? (
          <EmptyState onCreate={() => setShowModal(true)} />
        ) : form && (
          <div className="space-y-3 sm:space-y-4 lg:space-y-5">

            <StoreHeaderPreview form={form} />

            {/* New store banner */}
            <div className="bg-white border border-dashed border-gray-300 rounded-xl px-3 sm:px-4 py-3 flex flex-col xs:flex-row xs:items-center justify-between gap-3">
              <div className="flex items-start xs:items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#8B1538]/10 flex items-center justify-center flex-shrink-0 mt-0.5 xs:mt-0">
                  <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#8B1538]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-gray-800">Need to start over or set up a new store?</p>
                  <p className="text-[11px] sm:text-xs text-gray-400">Re-run the create-store wizard with multi-location setup.</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 rounded-full text-white flex-shrink-0 self-start xs:self-auto"
                style={{ background: 'linear-gradient(135deg, #8B1538, #D4828F)' }}
              >
                Create Store
              </button>
            </div>

            {/* Store Information */}
            <SectionCard icon={Store} title="Store Information">
              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                  <Field label="Store Name" required>
                    <input className={inputCls} value={form.store_name} onChange={setField('store_name')} placeholder="Your store name" />
                  </Field>
                  <Field label="Category" required>
                    <select className={`${inputCls} bg-white`} value={form.category} onChange={setField('category')}>
                      <option value="">Select category…</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Tagline">
                  <input className={inputCls} value={form.tagline} onChange={setField('tagline')} placeholder="A short description of your store" />
                </Field>
                <Field label="Description" hint={`${(form.description || '').length}/500 characters`}>
                  <textarea
                    className={`${inputCls} resize-none`}
                    value={form.description}
                    onChange={setField('description')}
                    rows={4} maxLength={500}
                    placeholder="Tell buyers about your store…"
                  />
                </Field>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                  <Field label="Website">
                    <input className={inputCls} value={form.website} onChange={setField('website')} placeholder="www.yourstore.com" />
                  </Field>
                  <Field label="WhatsApp (General)">
                    <input className={inputCls} value={form.whatsapp} onChange={setField('whatsapp')} placeholder="+234 800 000 0000" />
                  </Field>
                </div>
              </div>
            </SectionCard>

            {/* Store Locations */}
            <SectionCard icon={MapPin} title={`Store Locations${form.locations.length > 0 ? ` (${form.locations.length})` : ''}`}>
              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 mb-3 sm:mb-4 -mt-1">
                <p className="text-xs text-gray-400 leading-relaxed">Add all your physical branches — each with its own contact details.</p>
                <button
                  onClick={addLocation}
                  className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white px-3 py-2 rounded-full flex-shrink-0 self-start xs:self-auto"
                  style={{ background: 'linear-gradient(135deg, #8B1538, #D4828F)' }}
                >
                  <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Add Location
                </button>
              </div>
              {form.locations.length === 0 ? (
                <div className="text-center py-8 sm:py-10 border-2 border-dashed border-gray-200 rounded-xl">
                  <MapPin className="h-7 w-7 sm:h-8 sm:w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No locations yet. Add your first branch.</p>
                </div>
              ) : (
                form.locations.map((loc: Location, i: number) => (
                  <LocationCardFull
                    key={loc.id} loc={loc} index={i}
                    totalCount={form.locations.length}
                    onUpdate={updateLocation}
                    onDelete={deleteLocation}
                    onMakePrimary={makePrimary}
                  />
                ))
              )}
            </SectionCard>

            {/* Store Policies */}
            <SectionCard icon={BarChart2} title="Store Policies">
              <div className="space-y-3 sm:space-y-4">
                <Field label="Return Policy">
                  <textarea className={`${inputCls} resize-none`} value={form.return_policy} onChange={setField('return_policy')} rows={3} placeholder="Describe your return and refund policy…" />
                </Field>
                <Field label="Shipping Policy">
                  <textarea className={`${inputCls} resize-none`} value={form.shipping_policy} onChange={setField('shipping_policy')} rows={3} placeholder="Describe your shipping terms and delivery timelines…" />
                </Field>
              </div>
            </SectionCard>

            {/* Store Media */}
            <SectionCard icon={Camera} title="Store Media">
              <div className="flex gap-4">
                <ImageUploadField
                  label="Store Logo"
                  context="store-logo"
                  value={form.logo}
                  onChange={url => { setForm(prev => prev ? { ...prev, logo: url } : prev); setIsDirty(true); }}
                  aspect="square"
                />
                <div className="flex-1">
                  <ImageUploadField
                    label="Store Banner"
                    context="store-banner"
                    value={form.cover_image}
                    onChange={url => { setForm(prev => prev ? { ...prev, cover_image: url } : prev); setIsDirty(true); }}
                    aspect="wide"
                  />
                </div>
              </div>
              {(form.logo || form.cover_image) && (
                <div className="flex flex-wrap gap-3 mt-3">
                  {form.logo && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <img src={form.logo} alt="logo" className="w-8 h-8 rounded-lg object-cover border border-gray-200 flex-shrink-0" onError={e => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
                      Logo preview
                    </div>
                  )}
                  {form.cover_image && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <img src={form.cover_image} alt="cover" className="w-12 h-8 rounded-lg object-cover border border-gray-200 flex-shrink-0" onError={e => ((e.currentTarget as HTMLImageElement).style.display = 'none')} />
                      Cover preview
                    </div>
                  )}
                </div>
              )}
            </SectionCard>

            {/* Footer */}
            <div className="flex flex-col-reverse xs:flex-row xs:items-center justify-between gap-3 border-t border-gray-100 pt-3 sm:pt-4 pb-4 sm:pb-6">
              <button
                onClick={() => setView('empty')}
                className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors text-left"
              >
                Reset store (preview empty state)
              </button>
              <div className="flex gap-2 sm:gap-3 w-full xs:w-auto">
                <button
                  onClick={handleDiscard}
                  disabled={!isDirty || saving}
                  className="flex-1 xs:flex-none px-4 sm:px-5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !isDirty}
                  className="flex-1 xs:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background:
                      saveState === 'saved' ? '#059669'
                      : saveState === 'error' ? '#DC2626'
                      : 'linear-gradient(135deg, #8B1538, #D4828F)',
                    minWidth: '110px',
                  }}
                >
                  {saving ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
                  ) : saveState === 'saved' ? (
                    <><Check className="h-3.5 w-3.5" /> Saved!</>
                  ) : saveState === 'error' ? (
                    'Try Again'
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

export default BusinessStorefront;