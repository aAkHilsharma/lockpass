import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { session } from '@/lib/session';
import { api } from '@/lib/api';
import {
  unlockVaultKey, encryptItem, decryptItem,
  createVaultCrypto, decryptVaultMetadata, encryptVaultMetadata,
} from '@/lib/vault-crypto';
import type { VaultItem, VaultMeta } from '@/components/vault/types';
import type { VaultItemV1 } from '@lockpass/domain';

export type VaultCacheData = {
  vaults: VaultMeta[];
  items: (VaultItem & { revision?: number })[];
};

export const VAULT_QUERY_KEY = ['vault-data'] as const;

export function useVaultData() {
  const { userRootKey, vaultKeys, setVaultKey } = useAuth();
  const queryClient = useQueryClient();
  const token = session.getAccessToken();

  // ── Query ────────────────────────────────────────────────────────────────────

  const query = useQuery({
    queryKey: VAULT_QUERY_KEY,
    enabled: !!token && !!userRootKey,
    staleTime: Infinity,
    queryFn: async (): Promise<VaultCacheData> => {
      if (!token || !userRootKey) throw new Error('Not authenticated');

      const vaultList = await api.vaults.list(token);
      const vaultMetas: VaultMeta[] = [];
      const rawItems: { item: VaultItemV1; vaultId: string; updatedAt: string; revision?: number }[] = [];

      for (const vault of vaultList) {
        let vaultKey = vaultKeys[vault.id];
        if (!vaultKey) {
          const keyData = await api.vaults.getKey(vault.id, token);
          vaultKey = unlockVaultKey(userRootKey, {
            wrappedVaultKey: keyData.wrappedVaultKey,
            wrappedVaultKeyNonce: keyData.wrappedVaultKeyNonce,
          });
          setVaultKey(vault.id, vaultKey);
        }

        let name = 'Vault';
        let icon: string | undefined;
        let color: string | undefined;
        try {
          const meta = decryptVaultMetadata(vault.metadataCiphertext, vault.metadataNonce, vaultKey);
          name = meta.name; icon = meta.icon; color = meta.color;
        } catch {}

        vaultMetas.push({ id: vault.id, name, icon, color, metadataRevision: vault.metadataRevision });

        const { items: envelopes } = await api.items.list(vault.id, token);
        for (const envelope of envelopes) {
          if (envelope.deletedAt) continue;
          try {
            const domainItem = decryptItem(
              { ciphertext: envelope.ciphertext, nonce: envelope.nonce, itemId: envelope.itemId },
              vaultKey,
            );
            rawItems.push({ item: domainItem, vaultId: vault.id, updatedAt: envelope.updatedAt, revision: envelope.revision });
          } catch {}
        }
      }

      rawItems.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      return {
        vaults: vaultMetas,
        items: rawItems.map(({ item, vaultId, updatedAt, revision }) =>
          domainItemToVaultItem(item, vaultId, updatedAt, revision)
        ),
      };
    },
  });

  // ── Save item (create or update) ─────────────────────────────────────────────

  const saveItemMutation = useMutation({
    mutationFn: async ({ item, isNew, revision }: { item: Omit<VaultItem, 'updatedAt'>; isNew: boolean; revision: number }) => {
      if (!token) throw new Error('No token');
      const vaultKey = vaultKeys[item.vaultId];
      if (!vaultKey) throw new Error('No vault key');
      const now = new Date().toISOString();
      const { ciphertext, nonce } = encryptItem(vaultItemToDomain(item, now), vaultKey);
      if (!isNew) {
        await api.items.update(item.vaultId, item.id, {
          expectedRevision: revision,
          schemaVersion: 1, vaultKeyVersion: 1, ciphertext, nonce, updatedAt: now,
        }, token);
      } else {
        await api.items.create(item.vaultId, {
          itemId: item.id, itemType: item.type === 'note' ? 'note' : 'login',
          schemaVersion: 1, vaultKeyVersion: 1, ciphertext, nonce,
          createdAt: now, updatedAt: now,
        }, token);
      }
    },
    onMutate: async ({ item, isNew, revision }) => {
      await queryClient.cancelQueries({ queryKey: VAULT_QUERY_KEY });
      const prev = queryClient.getQueryData<VaultCacheData>(VAULT_QUERY_KEY);
      queryClient.setQueryData<VaultCacheData>(VAULT_QUERY_KEY, (old) => {
        if (!old) return old;
        const next = { ...item, updatedAt: 'just now', revision: isNew ? 0 : revision + 1 };
        return { ...old, items: [next, ...old.items.filter((i) => i.id !== item.id)] };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(VAULT_QUERY_KEY, ctx.prev);
    },
  });

  // ── Delete item ───────────────────────────────────────────────────────────────

  const deleteItemMutation = useMutation({
    mutationFn: async ({ id, vaultId, revision }: { id: string; vaultId: string; revision: number }) => {
      if (!token) throw new Error('No token');
      await api.items.delete(vaultId, id, { expectedRevision: revision }, token);
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: VAULT_QUERY_KEY });
      const prev = queryClient.getQueryData<VaultCacheData>(VAULT_QUERY_KEY);
      queryClient.setQueryData<VaultCacheData>(VAULT_QUERY_KEY, (old) =>
        old ? { ...old, items: old.items.filter((i) => i.id !== id) } : old
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(VAULT_QUERY_KEY, ctx.prev);
    },
  });

  // ── Create vault ──────────────────────────────────────────────────────────────

  const createVaultMutation = useMutation({
    mutationFn: async ({ name, color, icon }: { name: string; color: string; icon: string }) => {
      if (!token || !userRootKey) throw new Error('Not authenticated');
      const { vaultKey, request } = createVaultCrypto({ name, icon, color }, userRootKey);
      const { id: newVaultId } = await api.vaults.create(request, token);
      setVaultKey(newVaultId, vaultKey);
      return { id: newVaultId, name, icon, color };
    },
    onSuccess: (newVault) => {
      queryClient.setQueryData<VaultCacheData>(VAULT_QUERY_KEY, (old) =>
        old ? { ...old, vaults: [...old.vaults, { ...newVault, metadataRevision: 0 }] } : old
      );
    },
  });

  // ── Update vault metadata ─────────────────────────────────────────────────────

  const updateVaultMutation = useMutation({
    mutationFn: async ({ vaultId, name, color, icon }: { vaultId: string; name: string; color: string; icon: string }) => {
      if (!token) throw new Error('No token');
      const vaultKey = vaultKeys[vaultId];
      if (!vaultKey) throw new Error('No vault key');
      const vault = queryClient.getQueryData<VaultCacheData>(VAULT_QUERY_KEY)?.vaults.find((v) => v.id === vaultId);
      if (!vault) throw new Error('Vault not found');
      const { ciphertext, nonce } = encryptVaultMetadata({ name, icon, color }, vaultKey);
      await api.vaults.updateMetadata(vaultId, {
        expectedRevision: vault.metadataRevision,
        metadataSchemaVersion: 1,
        metadataCiphertext: ciphertext,
        metadataNonce: nonce,
      }, token);
      return { vaultId, name, icon, color };
    },
    onMutate: async ({ vaultId, name, icon, color }) => {
      await queryClient.cancelQueries({ queryKey: VAULT_QUERY_KEY });
      const prev = queryClient.getQueryData<VaultCacheData>(VAULT_QUERY_KEY);
      queryClient.setQueryData<VaultCacheData>(VAULT_QUERY_KEY, (old) =>
        old ? {
          ...old,
          vaults: old.vaults.map((v): VaultMeta =>
            v.id === vaultId ? { ...v, name, icon, color, metadataRevision: v.metadataRevision + 1 } : v
          ),
        } : old
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(VAULT_QUERY_KEY, ctx.prev);
    },
  });

  // ── Delete vault ──────────────────────────────────────────────────────────────

  const deleteVaultMutation = useMutation({
    mutationFn: async (vaultId: string) => {
      if (!token) throw new Error('No token');
      await api.vaults.delete(vaultId, token);
    },
    onMutate: async (vaultId) => {
      await queryClient.cancelQueries({ queryKey: VAULT_QUERY_KEY });
      const prev = queryClient.getQueryData<VaultCacheData>(VAULT_QUERY_KEY);
      queryClient.setQueryData<VaultCacheData>(VAULT_QUERY_KEY, (old) =>
        old ? {
          vaults: old.vaults.filter((v) => v.id !== vaultId),
          items: old.items.filter((i) => i.vaultId !== vaultId),
        } : old
      );
      return { prev };
    },
    onError: (_err, _vaultId, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(VAULT_QUERY_KEY, ctx.prev);
    },
  });

  return {
    vaults: query.data?.vaults ?? [],
    items: query.data?.items ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    saveItemMutation,
    deleteItemMutation,
    createVaultMutation,
    updateVaultMutation,
    deleteVaultMutation,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function domainItemToVaultItem(
  item: VaultItemV1,
  vaultId: string,
  updatedAt: string,
  revision?: number,
): VaultItem & { revision?: number } {
  const base = {
    id: item.id,
    vaultId,
    type: (item.type === 'note' ? 'note' : 'login') as 'login' | 'note',
    title: item.title,
    sub: item.type === 'login' ? (item.username || item.urls?.[0] || '') : '',
    notes: item.type === 'note' ? item.body : (item as any).notes ?? '',
    tags: item.tags,
    updatedAt: formatDate(updatedAt),
    revision,
  };
  if (item.type === 'login') {
    return { ...base, username: item.username, password: item.password, urls: item.urls };
  }
  return base;
}

function vaultItemToDomain(item: Omit<VaultItem, 'updatedAt'>, now: string): VaultItemV1 {
  if (item.type === 'login') {
    return {
      schemaVersion: 1, type: 'login', id: item.id, vaultId: item.vaultId,
      title: item.title, username: item.username ?? '', password: item.password ?? '',
      urls: item.urls ?? [], notes: item.notes ?? '', tags: [],
      createdAt: now, updatedAt: now,
    };
  }
  return {
    schemaVersion: 1, type: 'note', id: item.id, vaultId: item.vaultId,
    title: item.title, body: item.notes ?? '', tags: [],
    createdAt: now, updatedAt: now,
  };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
