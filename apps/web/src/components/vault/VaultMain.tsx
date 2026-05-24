'use client';

import { useState, useRef, useEffect } from 'react';
import { Icons } from '@/components/icons';
import { VaultDetail } from './VaultDetail';
import { CreateLoginPanel } from './CreateLoginPanel';
import { FaviconIcon } from './FaviconIcon';
import type { VaultItem } from './types';

const TYPE_ICONS: Record<string, keyof typeof Icons> = {
  login: 'Login',
  note: 'Note',
};

interface Props {
  vaultName: string;
  vaultId: string;
  isTrash?: boolean;
  items: VaultItem[];
  activeItem: VaultItem | null;
  query: string;
  onQueryChange: (q: string) => void;
  onSelectItem: (id: string) => void;
  onSaveItem: (item: Omit<VaultItem, 'updatedAt'>) => void;
  onDeleteItem: (id: string) => void;
  onMoveToTrash: (item: VaultItem) => void;
  onRestore: (id: string) => void;
  onDeletePermanently: (id: string) => void;
}

export function VaultMain({
  vaultName, vaultId, isTrash = false, items, activeItem, query, onQueryChange,
  onSelectItem, onSaveItem, onDeleteItem, onMoveToTrash, onRestore, onDeletePermanently,
}: Props) {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const isEmpty = items.length === 0 && !query;

  const handleSave = (item: Omit<VaultItem, 'updatedAt'>) => {
    onSaveItem(item);
    setShowLoginForm(false);
    setEditingItem(null);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-bg">

      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 h-14 border-b border-rule-soft shrink-0">
        <div className="flex items-center gap-2 flex-1 bg-bg-elev border border-rule-soft rounded-lg px-3.5 py-2 focus-within:border-ink-4 transition-colors">
          <span className="text-ink-4 shrink-0"><Icons.Search s={14} /></span>
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={`Search in ${vaultName}...`}
            className="flex-1 bg-transparent border-0 outline-none text-[13.5px] text-ink placeholder:text-ink-4"
          />
        </div>
        {/* Create item dropdown */}
        <div ref={dropdownRef} className="relative shrink-0">
          <button
            onClick={() => setShowDropdown((p) => !p)}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent text-accent-ink rounded-md text-[13.5px] font-medium hover:brightness-95 transition-all cursor-pointer"
          >
            <Icons.Plus s={13} />
            Create item
          </button>

          {showDropdown && (
            <div className="absolute top-full right-0 mt-2 w-52 bg-bg-elev border border-rule rounded-xl shadow-xl overflow-hidden z-30">
              <button
                onClick={() => { setShowDropdown(false); setEditingItem(null); setShowLoginForm(true); }}
                className="w-full flex items-center gap-3 px-3.5 py-3 hover:bg-bg-sunk transition-colors cursor-pointer"
              >
                <span className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                  <Icons.Login s={15} />
                </span>
                <span className="text-[14px] font-medium text-ink">Login</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {isEmpty && isTrash ? (

        /* ── Trash empty state ── */
        <div className="flex-1 flex flex-col items-center justify-center gap-1.5">
          <p className="text-[13px] font-semibold text-ink-3">Trash empty</p>
          <p className="text-[12.5px] text-ink-4">Deleted items will be moved here first</p>
        </div>

      ) : isEmpty ? (

        /* ── Vault empty state ── */
        <div className="flex flex-1 min-h-0">
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <h3 className="text-[17px] font-semibold text-ink mb-1.5">Your vault is empty</h3>
            <p className="text-[13.5px] text-ink-3 mb-7">
              Let&apos;s get you started by creating your first item
            </p>
            <div className="flex flex-col gap-2.5 w-full max-w-[280px]">
              <button
                onClick={() => setShowLoginForm(true)}
                className="flex items-center gap-3.5 px-4 py-3 rounded-lg bg-accent/8 border border-accent/20 hover:bg-accent/12 transition-colors cursor-pointer"
              >
                <span className="w-7 h-7 rounded-md bg-accent/15 text-accent flex items-center justify-center shrink-0">
                  <Icons.Login s={15} />
                </span>
                <span className="text-[14px] font-medium text-accent">Create a login</span>
              </button>
              <button
                className="flex items-center gap-3.5 px-4 py-3 rounded-lg bg-bg-elev border border-rule hover:bg-bg-sunk transition-colors cursor-pointer"
              >
                <span className="w-7 h-7 rounded-md bg-bg-sunk text-ink-3 flex items-center justify-center shrink-0">
                  <Icons.Upload s={15} />
                </span>
                <span className="text-[14px] font-medium text-ink-2">Import passwords</span>
              </button>
            </div>
          </div>

          {showLoginForm && (
            <div className="w-[60%] shrink-0 border-l border-rule-soft">
              <CreateLoginPanel
                vaultId={vaultId}
                onSave={handleSave}
                onClose={() => setShowLoginForm(false)}
              />
            </div>
          )}
        </div>

      ) : (

        /* ── Items list + detail / edit — create form overlays on top ── */
        <div className="relative flex flex-1 min-h-0">

          {/* Item list — 40% of the right section */}
          <div className="w-[40%] shrink-0 border-r border-rule-soft flex flex-col overflow-hidden bg-bg">
            <div className="px-4 py-2.5 border-b border-rule-soft shrink-0">
              <span className="font-mono text-[11px] text-ink-4">
                {vaultName} · {items.length} item{items.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="flex-1 overflow-auto">
              {items.map((item) => {
                const iconName = TYPE_ICONS[item.type] ?? 'Note';
                const Icon = Icons[iconName];
                const active = activeItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => { onSelectItem(item.id); setEditingItem(null); setShowLoginForm(false); }}
                    className={`flex items-center gap-3 px-4 py-3 border-b border-rule-soft cursor-pointer transition-colors ${
                      active ? 'bg-accent/8 border-l-2 border-l-accent pl-3.5' : 'hover:bg-bg-sunk'
                    }`}
                  >
                    <span className="shrink-0 w-4 h-4 flex items-center justify-center">
                      {item.type === 'login' ? (
                        <FaviconIcon urls={item.urls} size={16} active={active} />
                      ) : (
                        <span className={active ? 'text-accent' : 'text-ink-4'}>
                          <Icon s={16} />
                        </span>
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium text-ink truncate">{item.title}</div>
                      <div className="text-[12px] text-ink-4 truncate mt-0.5">{item.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail or Edit panel */}
          {editingItem ? (
            <div className="flex-1 min-w-0">
              <CreateLoginPanel
                vaultId={vaultId}
                item={editingItem}
                onSave={handleSave}
                onClose={() => setEditingItem(null)}
              />
            </div>
          ) : (
            <VaultDetail
              item={activeItem}
              vaultName={vaultName}
              isTrash={isTrash}
              onEdit={(id) => {
                const found = items.find((i) => i.id === id);
                if (found) setEditingItem(found);
              }}
              onMoveToTrash={onMoveToTrash}
              onRestore={onRestore}
              onDeletePermanently={onDeletePermanently}
              onNew={() => setShowLoginForm(true)}
            />
          )}

          {/* Create form overlays the detail section exactly */}
          {showLoginForm && !editingItem && (
            <div className="absolute top-0 bottom-0 right-0 left-[40%] z-20 shadow-2xl">
              <CreateLoginPanel
                vaultId={vaultId}
                onSave={handleSave}
                onClose={() => setShowLoginForm(false)}
              />
            </div>
          )}

        </div>
      )}
    </div>
  );
}
