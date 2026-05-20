'use client';

import { useState, useRef, useEffect } from 'react';
import { Icons } from '@/components/icons';

interface Props {
  vaults: { id: string; name: string }[];
  activeVaultId: string;
  onSelectVault: (id: string) => void;
  itemCounts: Record<string, number>;
  onLogout: () => void;
  email: string;
}

export function VaultSidebar({ vaults, activeVaultId, onSelectVault, itemCounts, onLogout, email }: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <aside className="w-[270px] shrink-0 h-screen flex flex-col bg-bg-elev border-r border-rule-soft overflow-hidden">

      {/* Brand */}
      <div className="px-5 pt-5 pb-3 shrink-0">
        <div className="flex items-baseline text-[18px] font-semibold tracking-tight leading-none">
          <span className="text-ink">Lock</span>
          <span className="text-accent">Pass</span>
        </div>
      </div>

      {/* Vaults header */}
      <div className="flex items-center justify-between px-5 py-2 shrink-0">
        <span className="text-[11px] font-semibold text-ink-3">Vaults</span>
        <button
          className="w-6 h-6 flex items-center justify-center rounded text-ink-3 hover:bg-bg-sunk hover:text-ink transition-colors"
          title="New vault"
        >
          <Icons.Plus s={13} />
        </button>
      </div>

      {/* Vault list */}
      <nav className="px-2 py-1 overflow-y-auto flex-1">
        {vaults.map((v) => {
          const count = itemCounts[v.id] ?? 0;
          const active = activeVaultId === v.id;
          return (
            <div
              key={v.id}
              onClick={() => onSelectVault(v.id)}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors mb-0.5 ${
                active ? 'bg-accent/10' : 'hover:bg-bg-sunk'
              }`}
            >
              <span className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                active ? 'bg-accent/20 text-accent' : 'bg-bg-sunk text-ink-3'
              }`}>
                <Icons.Home s={15} />
              </span>
              <div className="flex-1 min-w-0">
                <div className={`text-[13.5px] truncate ${active ? 'font-semibold text-ink' : 'font-[450] text-ink-2'}`}>
                  {v.name}
                </div>
                <div className="text-[11.5px] text-ink-4 font-mono mt-0.5">
                  {count} item{count === 1 ? '' : 's'}
                </div>
              </div>
              <button
                className="w-6 h-6 flex items-center justify-center rounded text-ink-4 opacity-0 group-hover:opacity-100 hover:bg-rule-soft hover:text-ink transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                <Icons.MoreVertical s={13} />
              </button>
            </div>
          );
        })}
      </nav>

      {/* Lock vault */}
      <div className="border-t border-rule-soft shrink-0">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-5 py-3 text-[13.5px] text-ink-3 hover:bg-bg-sunk hover:text-ink transition-colors text-left"
        >
          <Icons.Lock s={14} />
          <span>Lock vault</span>
        </button>
      </div>

      {/* User row */}
      <div className="border-t border-rule-soft px-4 py-3 flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded-md bg-accent text-accent-ink flex items-center justify-center text-[12px] font-semibold shrink-0 select-none">
          {email[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11.5px] font-[450] text-ink truncate">{email}</div>
          <div className="text-[10.5px] text-ink-4 font-mono mt-0.5">Free plan</div>
        </div>

        {/* Gear dropdown */}
        <div ref={menuRef} className="relative shrink-0">
          <button
            onClick={() => setShowMenu((p) => !p)}
            className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
              showMenu ? 'bg-bg-sunk text-ink' : 'text-ink-3 hover:bg-bg-sunk hover:text-ink'
            }`}
          >
            <Icons.Settings s={14} />
          </button>
          {showMenu && (
            <div className="absolute bottom-full right-0 mb-2 w-36 bg-bg-elev border border-rule rounded-md shadow-lg overflow-hidden z-50">
              <button
                onClick={() => { setShowMenu(false); onLogout(); }}
                className="w-full px-3 py-2.5 text-[13px] text-left text-ink-2 hover:bg-bg-sunk hover:text-ink transition-colors flex items-center gap-2"
              >
                <Icons.LogOut s={13} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

    </aside>
  );
}
