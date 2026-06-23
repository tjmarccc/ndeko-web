import { useState, useCallback } from 'react';
import {
  Store, MapPin, Star, Package, Eye, Check, Camera,
  Loader2, Plus, Trash2, ChevronDown, ChevronUp,
  ShoppingBag, BarChart2, ArrowLeft, ArrowRight, Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Electronics', 'Fashion', 'Food & Beverages', 'Health & Beauty',
  'Home & Garden', 'Sports', 'Books', 'Automotive', 'Services', 'Other',
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
        <Field label="Street Address">
          <input className={inputCls} value={loc.streetAddress} onChange={set('streetAddress')} placeholder="Street address" />
        </Field>
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
          <Field label="City">
            <input className={inputCls} value={loc.city} onChange={set('city')} placeholder="City" />
          </Field>
          <Field label="State / Region">
            <input className={inputCls} value={loc.state} onChange={set('state')} placeholder="State" />
          </Field>
        </div>
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
          <Field label="Phone">
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

// ─── Create Store Modal ───────────────────────────────────────────────────────

interface CreateStoreModalProps {
  onClose: () => void;
  onCreated: (form: StoreForm) => void;
}

function CreateStoreModal({ onClose, onCreated }: CreateStoreModalProps) {
  const [step, setStep] = useState(1);
  const [wizard, setWizard] = useState({
    store_name: '', category: '', tagline: '', description: '',
    locations: [makeLocation(true)],
  });

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

  const handleCreate = () => {
    onCreated({
      store_name: wizard.store_name || 'My Store',
      category: wizard.category,
      tagline: wizard.tagline,
      description: wizard.description,
      website: '', whatsapp: '', logo: '', cover_image: '',
      return_policy: '', shipping_policy: '',
      locations: wizard.locations.map(l => ({ ...l })),
    });
  };

  const canNext = wizard.store_name.trim().length > 0;

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
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                <Field label="Store Name" required>
                  <input className={inputCls} value={wizard.store_name} onChange={setW('store_name')} placeholder="e.g. TechHub Lagos" />
                </Field>
                <Field label="Category" required>
                  <select className={`${inputCls} bg-white`} value={wizard.category} onChange={setW('category')}>
                    <option value="">Select category…</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Tagline">
                <input className={inputCls} value={wizard.tagline} onChange={setW('tagline')} placeholder="A short catchy line about your store" />
              </Field>
              <Field label="Description">
                <textarea className={`${inputCls} resize-none`} rows={4} value={wizard.description} onChange={setW('description')} placeholder="Tell buyers about your store…" />
              </Field>
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
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
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
              <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-700 py-1">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 text-white font-bold text-sm rounded-full px-4 sm:px-5 py-2 sm:py-2.5 hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #8B1538, #D4828F)' }}
              >
                <Sparkles className="h-3.5 w-3.5" /> Create Store
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BusinessStorefront() {
  const [view, setView] = useState<'empty' | 'form'>('empty');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<StoreForm | null>(null);
  const [originalForm, setOriginalForm] = useState<StoreForm | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle');

  const handleStoreCreated = useCallback((newForm: StoreForm) => {
    setForm(newForm);
    setOriginalForm(JSON.parse(JSON.stringify(newForm)));
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

  const handleSave = () => {
    setSaving(true);
    // Replace setTimeout with your real API call (createStore / updateStore)
    setTimeout(() => {
      setOriginalForm(JSON.parse(JSON.stringify(form)));
      setIsDirty(false);
      setSaving(false);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2500);
    }, 900);
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

        {/* Breadcrumb */}
        <p className="text-xs text-gray-400 mb-0.5">
          Business Portal › <span className="text-[#8B1538] font-semibold">Storefront</span>
        </p>
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-4 sm:mb-5">Storefront</h1>

        {view === 'empty' ? (
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
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
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