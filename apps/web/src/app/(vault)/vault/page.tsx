'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { VaultShell } from '@/components/vault/VaultShell';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { session } from '@/lib/session';
import { unlockVaultKey, encryptItem, decryptItem } from '@/lib/vault-crypto';
import type { VaultItem, VaultMeta } from '@/components/vault/types';
import type { VaultItemV1 } from '@lockpass/domain';

export default function VaultPage() {
  const router = useRouter();
  const { userRootKey, vaultKeys, setVaultKey, clearKeys } = useAuth();
  const [vaults, setVaults] = useState<VaultMeta[]>([]);
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);

  const token = session.getAccessToken();

  const handleLogout = useCallback(async () => {
    const refreshToken = session.getRefreshToken();
    if (refreshToken && token) {
      await api.auth.logout(refreshToken, token).catch(() => {});
    }
    session.clear();
    clearKeys();
    router.replace('/login');
  }, [token, clearKeys, router]);
  const email = session.getEmail() ?? '';

  useEffect(() => {
    if (!token) { router.replace('/login'); return; }
    if (!userRootKey) { router.replace('/login'); return; }
    loadVault();
  }, []);

  const loadVault = async () => {
    if (!token || !userRootKey) return;
    try {
      const vaultList = await api.vaults.list(token);
      const vaultMetas: VaultMeta[] = vaultList.map((v: { id: string }) => ({ id: v.id, name: 'Personal' }));
      setVaults(vaultMetas);

      const allItems: VaultItem[] = [];

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

        const { items: envelopes } = await api.items.list(vault.id, token);

        for (const envelope of envelopes) {
          if (envelope.deletedAt) continue;
          try {
            const domainItem = decryptItem({
              ciphertext: envelope.ciphertext,
              nonce: envelope.nonce,
              itemId: envelope.itemId,
            }, vaultKey);

            allItems.push(domainItemToVaultItem(domainItem, vault.id, envelope.updatedAt, envelope.revision));
          } catch {
            // decryption failed for this item, skip
          }
        }
      }

      setItems(allItems);
    } catch {
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItem = useCallback(async (item: Omit<VaultItem, 'updatedAt'>) => {
    if (!token) return;
    const vaultKey = vaultKeys[item.vaultId];
    if (!vaultKey) return;

    const now = new Date().toISOString();
    const domainItem = vaultItemToDomain(item, now);
    const { ciphertext, nonce } = encryptItem(domainItem, vaultKey);

    const existing = items.find((i) => i.id === item.id);

    if (existing) {
      await api.items.update(item.vaultId, item.id, {
        expectedRevision: (existing as VaultItem & { revision?: number }).revision ?? 0,
        schemaVersion: 1,
        vaultKeyVersion: 1,
        ciphertext,
        nonce,
        updatedAt: now,
      }, token);
    } else {
      await api.items.create(item.vaultId, {
        itemId: item.id,
        itemType: item.type === 'note' ? 'note' : 'login',
        schemaVersion: 1,
        vaultKeyVersion: 1,
        ciphertext,
        nonce,
        createdAt: now,
        updatedAt: now,
      }, token);
    }

    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id);
      const next = { ...item, updatedAt: 'just now', revision: (existing as any)?.revision ?? 0 + 1 };
      if (idx >= 0) { const copy = [...prev]; copy[idx] = next; return copy; }
      return [...prev, next];
    });
  }, [token, vaultKeys, items]);

  const handleDeleteItem = useCallback(async (id: string) => {
    if (!token) return;
    const item = items.find((i) => i.id === id);
    if (!item) return;

    await api.items.delete(item.vaultId, id, {
      expectedRevision: (item as any).revision ?? 0,
    }, token);

    setItems((prev) => prev.filter((i) => i.id !== id));
  }, [token, items]);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)' }}>
        <div className="eyebrow" style={{ color: 'var(--ink-3)' }}>Decrypting vault…</div>
      </div>
    );
  }

  return (
    <VaultShell
      vaults={vaults}
      items={items}
      email={email}
      onSaveItem={handleSaveItem}
      onDeleteItem={handleDeleteItem}
      onLogout={handleLogout}
    />
  );
}

function domainItemToVaultItem(item: VaultItemV1, vaultId: string, updatedAt: string, revision?: number): VaultItem & { revision?: number } {
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
      schemaVersion: 1,
      type: 'login',
      id: item.id,
      vaultId: item.vaultId,
      title: item.title,
      username: item.username ?? '',
      password: item.password ?? '',
      urls: item.urls ?? [],
      notes: item.notes ?? '',
      tags: [],
      createdAt: now,
      updatedAt: now,
    };
  }
  return {
    schemaVersion: 1,
    type: 'note',
    id: item.id,
    vaultId: item.vaultId,
    title: item.title,
    body: item.notes ?? '',
    tags: [],
    createdAt: now,
    updatedAt: now,
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
