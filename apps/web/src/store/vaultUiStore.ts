import { create } from 'zustand';
import type { VaultItem } from '@/components/vault/types';

interface EditingVault {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

interface VaultUiStore {
  activeVaultId: string;
  activeItemId: string | null;
  query: string;
  showVaultPanel: boolean;
  editingVault: EditingVault | null;
  trashedItems: VaultItem[];
  setActiveVault: (id: string) => void;
  setActiveItem: (id: string | null) => void;
  setQuery: (q: string) => void;
  openCreateVault: () => void;
  openEditVault: (vault: EditingVault) => void;
  closeVaultPanel: () => void;
  moveToTrash: (item: VaultItem) => void;
  restoreFromTrash: (id: string) => VaultItem | undefined;
  deletePermanently: (id: string) => void;
  restoreAll: () => VaultItem[];
  emptyTrash: () => void;
}

export const useVaultUiStore = create<VaultUiStore>((set, get) => ({
  activeVaultId: '__all__',
  activeItemId: null,
  query: '',
  showVaultPanel: false,
  editingVault: null,
  trashedItems: [],

  setActiveVault: (id) => set({ activeVaultId: id, activeItemId: null, showVaultPanel: false, editingVault: null }),
  setActiveItem: (id) => set({ activeItemId: id }),
  setQuery: (q) => set({ query: q }),
  openCreateVault: () => set({ showVaultPanel: true, editingVault: null }),
  openEditVault: (vault) => set({ showVaultPanel: true, editingVault: vault }),
  closeVaultPanel: () => set({ showVaultPanel: false, editingVault: null }),

  moveToTrash: (item) => set((s) => ({ trashedItems: [item, ...s.trashedItems] })),

  restoreFromTrash: (id) => {
    const item = get().trashedItems.find((i) => i.id === id);
    set((s) => ({ trashedItems: s.trashedItems.filter((i) => i.id !== id) }));
    return item;
  },

  deletePermanently: (id) => set((s) => ({
    trashedItems: s.trashedItems.filter((i) => i.id !== id),
    activeItemId: s.activeItemId === id ? null : s.activeItemId,
  })),

  restoreAll: () => {
    const items = get().trashedItems;
    set({ trashedItems: [] });
    return items;
  },

  emptyTrash: () => set({ trashedItems: [], activeItemId: null }),
}));
