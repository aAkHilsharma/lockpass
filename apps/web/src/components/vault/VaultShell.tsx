'use client';

import { useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { VaultSidebar } from './VaultSidebar';
import { VaultMain } from './VaultMain';
import { CreateVaultPanel } from './CreateVaultPanel';
import { DecryptingScreen } from '@/components/auth/DecryptingScreen';
import { useVaultData, VAULT_QUERY_KEY } from '@/hooks/useVaultData';
import { useVaultUiStore } from '@/store/vaultUiStore';
import { session } from '@/lib/session';
import type { VaultItem } from './types';

interface Props {
  onLock: () => void;
  onLogout: () => Promise<void>;
}

export function VaultShell({ onLock, onLogout }: Props) {
  const queryClient = useQueryClient();
  const email = session.getEmail() ?? '';

  const {
    vaults, items, isLoading, isError,
    saveItemMutation, deleteItemMutation,
    createVaultMutation, updateVaultMutation, deleteVaultMutation,
  } = useVaultData();

  const {
    activeVaultId, activeItemId, query, showVaultPanel, editingVault, trashedItems,
    setActiveVault, setActiveItem, setQuery,
    openCreateVault, openEditVault, closeVaultPanel,
    moveToTrash, restoreFromTrash, deletePermanently, restoreAll, emptyTrash,
  } = useVaultUiStore();

  const isTrash = activeVaultId === '__trash__';

  const filteredItems = useMemo(() => {
    if (isTrash) return trashedItems;
    return items.filter((it) => {
      if (activeVaultId !== '__all__' && it.vaultId !== activeVaultId) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        it.title.toLowerCase().includes(q) ||
        it.sub.toLowerCase().includes(q) ||
        ((it as any).username ?? '').toLowerCase().includes(q)
      );
    });
  }, [items, activeVaultId, query, isTrash, trashedItems]);

  useEffect(() => {
    if (filteredItems.length === 0) {
      if (activeItemId !== null) setActiveItem(null);
      return;
    }
    const stillValid = filteredItems.some((i) => i.id === activeItemId);
    if (!stillValid) setActiveItem(filteredItems[0]!.id);
  }, [activeVaultId, filteredItems]);

  useEffect(() => {
    if (isError) {
      queryClient.removeQueries({ queryKey: VAULT_QUERY_KEY });
      onLogout();
    }
  }, [isError]);

  const activeItem = filteredItems.find((i) => i.id === activeItemId) ?? null;
  const activeVault = isTrash
    ? { id: '__trash__', name: 'Trash' }
    : activeVaultId === '__all__'
      ? { id: '__all__', name: 'All items' }
      : vaults.find((v) => v.id === activeVaultId);

  const itemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((it) => { counts[it.vaultId] = (counts[it.vaultId] ?? 0) + 1; });
    return counts;
  }, [items]);

  const handleLogout = async () => {
    queryClient.clear();
    await onLogout();
  };

  const handleLock = () => {
    queryClient.clear();
    onLock();
  };

  const handleSaveItem = (item: Omit<VaultItem, 'updatedAt'>) => {
    const existing = items.find((i) => i.id === item.id);
    saveItemMutation.mutate({ item, isNew: !existing, revision: (existing as any)?.revision ?? 0 });
    setActiveItem(item.id);
  };

  const handleDeleteItem = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    deleteItemMutation.mutate({ id, vaultId: item.vaultId, revision: (item as any).revision ?? 0 });
    setActiveItem(null);
  };

  const handleMoveToTrash = (item: VaultItem) => {
    moveToTrash(item);
    deleteItemMutation.mutate({ id: item.id, vaultId: item.vaultId, revision: (item as any).revision ?? 0 });
    setActiveItem(null);
  };

  const handleRestore = (id: string) => {
    const item = restoreFromTrash(id);
    if (!item) return;
    const restored = { ...item, id: crypto.randomUUID() };
    saveItemMutation.mutate({ item: restored, isNew: true, revision: 0 });
    setActiveVault(restored.vaultId);
    setActiveItem(restored.id);
  };

  const handleDeletePermanently = (id: string) => {
    deletePermanently(id);
  };

  const handleSaveVaultEdit = (name: string, color: string, icon: string): Promise<void> =>
    new Promise((resolve, reject) => {
      if (editingVault) {
        updateVaultMutation.mutate(
          { vaultId: editingVault.id, name, color, icon },
          { onSuccess: () => { closeVaultPanel(); resolve(); }, onError: reject },
        );
      } else {
        createVaultMutation.mutate(
          { name, color, icon },
          { onSuccess: () => { closeVaultPanel(); resolve(); }, onError: reject },
        );
      }
    });

  const handleDeleteVault = (vaultId: string) => {
    if (activeVaultId === vaultId) {
      const next = vaults.find((v) => v.id !== vaultId);
      setActiveVault(next?.id ?? '__all__');
    }
    deleteVaultMutation.mutate(vaultId);
  };

  const handleRestoreAll = () => {
    const restored = restoreAll();
    restored.forEach((item) => {
      const newItem = { ...item, id: crypto.randomUUID() };
      saveItemMutation.mutate({ item: newItem, isNew: true, revision: 0 });
    });
    if (isTrash) setActiveVault(vaults[0]?.id ?? '__all__');
  };

  if (isLoading) {
    return <DecryptingScreen />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg">

      <VaultSidebar
        vaults={vaults}
        activeVaultId={activeVaultId}
        onSelectVault={(id) => setActiveVault(id)}
        itemCounts={itemCounts}
        trashCount={trashedItems.length}
        onAddVault={openCreateVault}
        onEditVault={(vaultId) => {
          const v = vaults.find((vault) => vault.id === vaultId);
          if (v) openEditVault({ id: v.id, name: v.name, icon: v.icon, color: v.color });
        }}
        onDeleteVault={handleDeleteVault}
        onRestoreAll={handleRestoreAll}
        onEmptyTrash={emptyTrash}
        onLock={handleLock}
        onLogout={handleLogout}
        email={email}
      />

      <div className="relative flex flex-1 min-w-0 overflow-hidden">
        <VaultMain
          vaultName={activeVault?.name ?? ''}
          vaultId={activeVaultId === '__all__' ? (vaults[0]?.id ?? '') : (isTrash ? (vaults[0]?.id ?? '') : activeVaultId)}
          isTrash={isTrash}
          items={filteredItems}
          activeItem={activeItem}
          query={query}
          onQueryChange={setQuery}
          onSelectItem={setActiveItem}
          onSaveItem={(item) => { handleSaveItem(item); }}
          onDeleteItem={handleDeleteItem}
          onMoveToTrash={handleMoveToTrash}
          onRestore={handleRestore}
          onDeletePermanently={handleDeletePermanently}
        />

        {showVaultPanel && (
          <div className="absolute top-0 right-0 bottom-0 w-[460px] z-20 shadow-2xl">
            <CreateVaultPanel
              editVaultId={editingVault?.id}
              initialName={editingVault?.name}
              initialColor={editingVault?.color}
              initialIcon={editingVault?.icon}
              onSave={handleSaveVaultEdit}
              onClose={closeVaultPanel}
            />
          </div>
        )}
      </div>

    </div>
  );
}
