'use client';

import { useCallback } from 'react';
import { VaultShell } from '@/components/vault/VaultShell';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { session } from '@/lib/session';

export default function VaultPage() {
  const { lock, logout } = useAuth();

  const handleLogout = useCallback(async () => {
    const refreshToken = session.getRefreshToken();
    const token = session.getAccessToken();
    if (refreshToken && token) {
      await api.auth.logout(refreshToken, token).catch(() => {});
    }
    logout();
  }, [logout]);

  return <VaultShell onLock={lock} onLogout={handleLogout} />;
}
