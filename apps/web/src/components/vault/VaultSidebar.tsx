'use client';

import { useState, useRef, useEffect } from 'react';
import { Icons } from '@/components/icons';
import { ConfirmModal } from './ConfirmModal';
import { DeleteVaultModal } from './DeleteVaultModal';
import { resolveVaultIcon, DEFAULT_VAULT_COLOR } from './vault-icons';

interface Props {
  vaults: { id: string; name: string; icon?: string; color?: string }[];
  activeVaultId: string;
  onSelectVault: (id: string) => void;
  itemCounts: Record<string, number>;
  trashCount: number;
  onAddVault: () => void;
  onEditVault: (vaultId: string) => void;
  onDeleteVault: (vaultId: string) => void;
  onRestoreAll: () => void;
  onEmptyTrash: () => void;
  onLock: () => void;
  onLogout: () => void;
  email: string;
}

function useOutsideClick(ref: React.RefObject<HTMLDivElement | null>, cb: () => void) {
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, cb]);
}

export function VaultSidebar({
  vaults, activeVaultId, onSelectVault, itemCounts, trashCount,
  onAddVault, onEditVault, onDeleteVault, onRestoreAll, onEmptyTrash, onLock, onLogout, email,
}: Props) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [openVaultMenu, setOpenVaultMenu] = useState<string | null>(null);
  const [showTrashMenu, setShowTrashMenu] = useState(false);
  const [confirmEmptyTrash, setConfirmEmptyTrash] = useState(false);
  const [deleteVault, setDeleteVault] = useState<{ id: string; name: string } | null>(null);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const vaultMenuRef = useRef<HTMLDivElement>(null);
  const trashMenuRef = useRef<HTMLDivElement>(null);

  useOutsideClick(userMenuRef, () => setShowUserMenu(false));
  useOutsideClick(vaultMenuRef, () => setOpenVaultMenu(null));
  useOutsideClick(trashMenuRef, () => setShowTrashMenu(false));

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
      <div
        onClick={onAddVault}
        className="flex items-center justify-between px-5 py-2 shrink-0 cursor-pointer hover:bg-bg-sunk rounded-md mx-2 transition-colors"
        title="New vault"
      >
        <span className="text-[11px] font-semibold text-ink-3">Vaults</span>
        <span className="w-6 h-6 flex items-center justify-center rounded text-ink-3">
          <Icons.Plus s={13} />
        </span>
      </div>

      {/* Vault list + Trash */}
      <nav className="px-2 py-1 overflow-y-auto flex-1">

        {vaults.map((v) => {
          const count = itemCounts[v.id] ?? 0;
          const active = activeVaultId === v.id;
          const menuOpen = openVaultMenu === v.id;
          const VaultIcon = resolveVaultIcon(v.icon);
          const vColor = v.color ?? DEFAULT_VAULT_COLOR;
          return (
            <div
              key={v.id}
              onClick={() => onSelectVault(v.id)}
              className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-md cursor-pointer transition-colors mb-0.5 ${
                active ? 'bg-accent/10' : 'hover:bg-bg-sunk'
              }`}
            >
              <span
                className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${vColor}1f`, color: vColor }}
              >
                <VaultIcon size={15} strokeWidth={1.8} />
              </span>
              <div className="flex-1 min-w-0">
                <div className={`text-[13.5px] truncate ${active ? 'font-semibold text-ink' : 'font-[450] text-ink-2'}`}>{v.name}</div>
                <div className="text-[11.5px] text-ink-4 font-mono mt-0.5">{count} item{count === 1 ? '' : 's'}</div>
              </div>

              {/* Vault three-dot menu */}
              <div
                ref={menuOpen ? vaultMenuRef : undefined}
                className="relative shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setOpenVaultMenu(menuOpen ? null : v.id)}
                  className="w-6 h-6 flex items-center justify-center rounded text-ink-4 hover:bg-rule-soft hover:text-ink transition-colors"
                >
                  <Icons.MoreVertical s={13} />
                </button>
                {menuOpen && (
                  <div className="absolute top-full right-0 mt-1 w-40 bg-bg-elev border border-rule rounded-lg shadow-lg overflow-hidden z-50">
                    <button
                      onClick={() => { setOpenVaultMenu(null); onEditVault(v.id); }}
                      className="w-full px-3 py-2.5 text-[13px] text-left text-ink-2 hover:bg-bg-sunk flex items-center gap-2 transition-colors"
                    >
                      <Icons.Edit s={13} />
                      Edit vault
                    </button>
                    <button
                      onClick={() => { setOpenVaultMenu(null); setDeleteVault({ id: v.id, name: v.name }); }}
                      className="w-full px-3 py-2.5 text-[13px] text-left text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <Icons.TrashVault s={13} />
                      Delete vault
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Trash — always last */}
        <div
          onClick={() => onSelectVault('__trash__')}
          className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-md cursor-pointer transition-colors mt-1 ${
            activeVaultId === '__trash__' ? 'bg-accent/10' : 'hover:bg-bg-sunk'
          }`}
        >
          <span className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
            activeVaultId === '__trash__' ? 'bg-accent/20 text-accent' : 'bg-bg-sunk text-ink-4'
          }`}>
            <Icons.TrashVault s={14} />
          </span>
          <div className="flex-1 min-w-0">
            <div className={`text-[13.5px] truncate ${activeVaultId === '__trash__' ? 'font-semibold text-ink' : 'font-[450] text-ink-2'}`}>Trash</div>
            <div className="text-[11.5px] text-ink-4 font-mono mt-0.5">{trashCount} item{trashCount === 1 ? '' : 's'}</div>
          </div>

          {/* Trash three-dot menu */}
          <div
            ref={showTrashMenu ? trashMenuRef : undefined}
            className="relative shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowTrashMenu((p) => !p)}
              className="w-6 h-6 flex items-center justify-center rounded text-ink-4 hover:bg-rule-soft hover:text-ink transition-colors"
            >
              <Icons.MoreVertical s={13} />
            </button>
            {showTrashMenu && (
              <div className="absolute top-full right-0 mt-1 w-40 bg-bg-elev border border-rule rounded-lg shadow-lg overflow-hidden z-50">
                <button
                  onClick={() => { setShowTrashMenu(false); onRestoreAll(); }}
                  className="w-full px-3 py-2.5 text-[13px] text-left text-ink-2 hover:bg-bg-sunk flex items-center gap-2 transition-colors"
                >
                  <Icons.Refresh s={13} />
                  Restore all
                </button>
                <button
                  onClick={() => { setShowTrashMenu(false); setConfirmEmptyTrash(true); }}
                  className="w-full px-3 py-2.5 text-[13px] text-left text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <Icons.TrashVault s={13} />
                  Empty trash
                </button>
              </div>
            )}
          </div>
        </div>

      </nav>

      {/* Lock vault */}
      <div className="border-t border-rule-soft shrink-0">
        <button
          onClick={onLock}
          className="w-full flex items-center gap-3 px-5 py-3 text-[13.5px] text-ink-3 hover:bg-bg-sunk hover:text-ink transition-colors text-left"
        >
          <Icons.Lock s={14} />
          <span>Lock vault</span>
        </button>
      </div>

      {/* User row */}
      <div className="border-t border-rule-soft px-3 py-3 flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded-md bg-accent text-accent-ink flex items-center justify-center text-[12px] font-semibold shrink-0 select-none">
          {email[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11.5px] font-[450] text-ink truncate">{email}</div>
          <div className="text-[10.5px] text-ink-4 font-mono mt-0.5">Free plan</div>
        </div>
        <div ref={userMenuRef} className="relative shrink-0">
          <button
            onClick={() => setShowUserMenu((p) => !p)}
            className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
              showUserMenu ? 'bg-bg-sunk text-ink' : 'text-ink-3 hover:bg-bg-sunk hover:text-ink'
            }`}
          >
            <Icons.Settings s={14} />
          </button>
          {showUserMenu && (
            <div className="absolute bottom-full right-0 mb-2 w-36 bg-bg-elev border border-rule rounded-xl shadow-xl overflow-hidden z-50">
              <button
                onClick={() => { setShowUserMenu(false); onLogout(); }}
                className="w-full px-3 py-2.5 text-[13px] text-left text-ink-2 hover:bg-bg-sunk hover:text-ink transition-colors flex items-center gap-2"
              >
                <Icons.LogOut s={13} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {confirmEmptyTrash && (
        <ConfirmModal
          title="Empty trash?"
          message="All items in trash will be permanently deleted. This cannot be undone."
          confirmLabel="Empty trash"
          cancelLabel="Cancel"
          danger
          onConfirm={() => { setConfirmEmptyTrash(false); onEmptyTrash(); }}
          onCancel={() => setConfirmEmptyTrash(false)}
        />
      )}

      {deleteVault && (
        <DeleteVaultModal
          vaultName={deleteVault.name}
          onConfirm={() => { onDeleteVault(deleteVault.id); setDeleteVault(null); }}
          onCancel={() => setDeleteVault(null)}
        />
      )}

    </aside>
  );
}
