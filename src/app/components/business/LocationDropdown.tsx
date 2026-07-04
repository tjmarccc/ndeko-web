import { useState, useEffect, useRef } from 'react';
import { Search, Layers, Building2, Store, Check, ChevronDown, MapPin } from 'lucide-react';
import type { ApiStoreLocation } from '../../services/api';

export const ALL_STORES_ID = 'all';

interface LocationOption {
  id: string;
  name: string;
  subtitle?: string;
  optionSubtitle?: string;
  isAll?: boolean;
}

export function LocationDropdown({
  storeName,
  locations,
  value,
  onChange,
  includeAll = false,
  allLabel = 'All Stores · Combined',
  label = 'Select Store',
  placeholder = 'Select a location…',
  variant = 'page',
  error,
}: {
  storeName?: string;
  locations: ApiStoreLocation[];
  value: string;
  onChange: (id: string) => void;
  includeAll?: boolean;
  allLabel?: string;
  label?: string;
  placeholder?: string;
  variant?: 'page' | 'field';
  error?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => searchRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  const options: LocationOption[] = [
    ...(includeAll
      ? [{
          id: ALL_STORES_ID,
          name: allLabel,
          subtitle: `${locations.length} location${locations.length === 1 ? '' : 's'} aggregated`,
          optionSubtitle: 'Overview of every location',
          isAll: true,
        }]
      : []),
    ...locations.map(l => ({
      id: l.id,
      name: storeName && !l.branch_name.toLowerCase().startsWith(storeName.toLowerCase())
        ? `${storeName} — ${l.branch_name}`
        : l.branch_name,
      subtitle: [l.city, l.state].filter(Boolean).join(', '),
    })),
  ];

  const filtered = query.trim()
    ? options.filter(o =>
        o.name.toLowerCase().includes(query.toLowerCase()) ||
        (o.subtitle ?? '').toLowerCase().includes(query.toLowerCase())
      )
    : options;

  const selected = options.find(o => o.id === value);

  return (
    <div className={`loc-dropdown loc-dropdown--${variant}${open ? ' loc-dropdown--open' : ''}`} ref={rootRef}>
      <style>{`
        .loc-dropdown { position: relative; font-family: 'DM Sans', 'Segoe UI', sans-serif; }
        .loc-dropdown--page { min-width: 240px; }
        .loc-dropdown--field { width: 100%; }

        .loc-dropdown__trigger {
          display: flex; align-items: center; gap: 10px;
          width: 100%;
          background: #fff;
          border: 1.5px solid #8B1538;
          border-radius: 10px;
          padding: 8px 12px;
          cursor: pointer;
          text-align: left;
          transition: border-color .15s, box-shadow .15s;
        }
        .loc-dropdown--field .loc-dropdown__trigger {
          border-color: #E5E7EB;
          background: #F9FAFB;
          padding: 9px 12px;
        }
        .loc-dropdown--field.loc-dropdown--open .loc-dropdown__trigger,
        .loc-dropdown--field .loc-dropdown__trigger:hover { border-color: #8B1538; background: #fff; }
        .loc-dropdown__trigger--error { border-color: #DC2626 !important; }
        .loc-dropdown--open .loc-dropdown__trigger { box-shadow: 0 0 0 3px rgba(139,21,56,.12); }

        .loc-dropdown__trigger-icon {
          width: 40px; height: 40px; border-radius: 10px;
          background: linear-gradient(135deg, #8B1538, #D4828F); color: #fff;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .loc-dropdown__trigger-icon--store { background: #3D9B8E; }
        .loc-dropdown--field .loc-dropdown__trigger-icon { width: 24px; height: 24px; background: #8B153814; color: #8B1538; }

        .loc-dropdown__trigger-text {
          display: flex; flex-direction: column; min-width: 0; flex: 1; gap: 1px;
        }
        .loc-dropdown__trigger-label {
          font-size: 10px; font-weight: 700; letter-spacing: .06em;
          color: #9CA3AF;
        }
        .loc-dropdown__trigger-name {
          font-size: 14px; font-weight: 700; color: #1F2937;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .loc-dropdown__trigger-sub {
          font-size: 11px; color: #6B7280;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .loc-dropdown__chevron { color: #9CA3AF; transition: transform .15s; flex-shrink: 0; }
        .loc-dropdown--open .loc-dropdown__chevron { transform: rotate(180deg); }

        .loc-dropdown__panel {
          position: absolute; top: calc(100% + 6px); left: 0;
          width: max(100%, 280px);
          background: #fff;
          border-radius: 12px;
          border: 1px solid #E5E7EB;
          box-shadow: 0 12px 32px rgba(0,0,0,.14);
          z-index: 50;
          overflow: hidden;
        }
        .loc-dropdown__search {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 12px;
          border-bottom: 1px solid #F3F4F6;
          color: #9CA3AF;
        }
        .loc-dropdown__search input {
          flex: 1; border: none; outline: none; font-size: 13px;
          background: transparent; color: #1F2937;
        }
        .loc-dropdown__list { max-height: 260px; overflow-y: auto; padding: 6px; }
        .loc-dropdown__empty { padding: 16px; text-align: center; font-size: 12px; color: #9CA3AF; }

        .loc-dropdown__option {
          display: flex; align-items: center; gap: 12px;
          width: 100%; padding: 11px 12px; border-radius: 10px;
          background: none; border: none; cursor: pointer; text-align: left;
          transition: background .12s;
        }
        .loc-dropdown__option:hover { background: #F9FAFB; }
        .loc-dropdown__option--active { background: #8B153812; }
        .loc-dropdown__option-icon {
          width: 34px; height: 34px; border-radius: 9px;
          color: #fff;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .loc-dropdown__option-icon--all { background: linear-gradient(135deg, #8B1538, #D4828F); }
        .loc-dropdown__option-icon--store { background: #3D9B8E; }
        .loc-dropdown__option-text { display: flex; flex-direction: column; min-width: 0; gap: 1px; flex: 1; }
        .loc-dropdown__option-name { font-size: 14px; font-weight: 700; color: #1F2937; }
        .loc-dropdown__option-sub {
          font-size: 12px; color: #9CA3AF;
          display: flex; align-items: center; gap: 3px;
        }
        .loc-dropdown__check { color: #8B1538; flex-shrink: 0; }

        .loc-tag {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 8px; border-radius: 20px;
          font-size: 10px; font-weight: 700;
          background: #F3F4F6; color: #4B5563;
          white-space: nowrap;
        }
      `}</style>

      <button
        type="button"
        className={`loc-dropdown__trigger${error ? ' loc-dropdown__trigger--error' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className={`loc-dropdown__trigger-icon${selected && !selected.isAll ? ' loc-dropdown__trigger-icon--store' : ''}`}>
          {selected?.isAll || !selected ? <Layers style={{ width: 18, height: 18 }} /> : <Building2 style={{ width: 18, height: 18 }} />}
        </span>
        <span className="loc-dropdown__trigger-text">
          {variant === 'page' && <span className="loc-dropdown__trigger-label">{label.toUpperCase()}</span>}
          <span className="loc-dropdown__trigger-name">{selected ? selected.name : placeholder}</span>
          {selected?.subtitle && <span className="loc-dropdown__trigger-sub">{selected.subtitle}</span>}
        </span>
        <ChevronDown style={{ width: 15, height: 15, flexShrink: 0 }} className="loc-dropdown__chevron" />
      </button>

      {open && (
        <div className="loc-dropdown__panel">
          <div className="loc-dropdown__search">
            <Search style={{ width: 14, height: 14 }} />
            <input
              ref={searchRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search locations…"
            />
          </div>
          <div className="loc-dropdown__list">
            {filtered.length === 0 && <div className="loc-dropdown__empty">No matching locations</div>}
            {filtered.map(o => (
              <button
                key={o.id}
                type="button"
                className={`loc-dropdown__option${o.id === value ? ' loc-dropdown__option--active' : ''}`}
                onClick={() => { onChange(o.id); setOpen(false); setQuery(''); }}
              >
                <span className={`loc-dropdown__option-icon ${o.isAll ? 'loc-dropdown__option-icon--all' : 'loc-dropdown__option-icon--store'}`}>
                  {o.isAll ? <Layers style={{ width: 17, height: 17 }} /> : <Building2 style={{ width: 17, height: 17 }} />}
                </span>
                <span className="loc-dropdown__option-text">
                  <span className="loc-dropdown__option-name">{o.name}</span>
                  {(o.optionSubtitle ?? o.subtitle) && (
                    <span className="loc-dropdown__option-sub">
                      {!o.isAll && <MapPin style={{ width: 10, height: 10 }} />} {o.optionSubtitle ?? o.subtitle}
                    </span>
                  )}
                </span>
                {o.id === value && <Check style={{ width: 15, height: 15 }} className="loc-dropdown__check" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function LocationTag({ name, qty }: { name?: string; qty?: number }) {
  if (!name) return <span style={{ color: '#9ca3af' }}>—</span>;
  return (
    <span className="loc-tag">
      <Store style={{ width: 10, height: 10 }} />
      {name}{qty !== undefined ? ` · ${qty}` : ''}
    </span>
  );
}
