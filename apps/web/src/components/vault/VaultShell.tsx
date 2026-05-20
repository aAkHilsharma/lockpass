'use client';

import { useState, useMemo } from 'react';
import { VaultSidebar } from './VaultSidebar';
import { VaultMain } from './VaultMain';
import type { VaultItem, VaultMeta } from './types';

interface Props {
  vaults: VaultMeta[];
  items: VaultItem[];
  email: string;
  onSaveItem: (item: Omit<VaultItem, 'updatedAt'>) => void;
  onDeleteItem: (id: string) => void;
  onLogout: () => void;
}

export function VaultShell({ vaults, items, email, onSaveItem, onDeleteItem, onLogout }: Props) {
  const [activeVaultId, setActiveVaultId] = useState(() => vaults[0]?.id ?? '__all__');
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      if (activeVaultId !== '__all__' && it.vaultId !== activeVaultId) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        it.title.toLowerCase().includes(q) ||
        it.sub.toLowerCase().includes(q) ||
        (it.username ?? '').toLowerCase().includes(q)
      );
    });
  }, [items, activeVaultId, query]);

  const activeItem = filteredItems.find((i) => i.id === activeItemId) ?? null;

  const activeVault = activeVaultId === '__all__'
    ? { id: '__all__', name: 'All items' }
    : vaults.find((v) => v.id === activeVaultId);

  const itemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((it) => { counts[it.vaultId] = (counts[it.vaultId] ?? 0) + 1; });
    return counts;
  }, [items]);

  return (
    <div className="flex h-screen overflow-hidden bg-bg">

      <VaultSidebar
        vaults={vaults}
        activeVaultId={activeVaultId}
        onSelectVault={(id) => { setActiveVaultId(id); setActiveItemId(null); }}
        itemCounts={itemCounts}
        onLogout={onLogout}
        email={email}
      />

      <VaultMain
        vaultName={activeVault?.name ?? ''}
        vaultId={activeVaultId === '__all__' ? (vaults[0]?.id ?? '') : activeVaultId}
        items={filteredItems}
        activeItem={activeItem}
        query={query}
        onQueryChange={setQuery}
        onSelectItem={setActiveItemId}
        onSaveItem={(item) => { onSaveItem(item); setActiveItemId(item.id); }}
        onDeleteItem={(id) => { onDeleteItem(id); setActiveItemId(null); }}
      />

    </div>
  );
}
