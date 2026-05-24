'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginScreen } from '@/components/auth/LoginScreen';
import { useAuth } from '@/context/AuthContext';
import { api, ApiError } from '@/lib/api';
import { session } from '@/lib/session';
import { loginCrypto, unlockVaultKey } from '@/lib/vault-crypto';

export default function LoginPage() {
  const router = useRouter();
  const { setUserRootKey, setVaultKey } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    setError('');
    setLoading(true);
    try {
      const result = await api.auth.login({
        email,
        password,
        device: {
          label: `${navigator.platform ?? 'Browser'} · Web`,
          type: 'web',
          userAgent: navigator.userAgent,
        },
      });

      const userRootKey = await loginCrypto(password, {
        kdfSalt: result.keyset.kdfSalt,
        kdfParams: result.keyset.kdfParams,
        wrappedUserRootKey: result.keyset.wrappedUserRootKey,
        wrappedUserRootKeyNonce: result.keyset.wrappedUserRootKeyNonce,
      });

      session.save({
        accessToken: result.session.accessToken,
        refreshToken: result.session.refreshToken,
        userId: result.user.id,
        email: result.user.email,
      });

      await setUserRootKey(userRootKey);

      // Fetch vaults and unlock their keys
      const vaults = await api.vaults.list(result.session.accessToken);
      for (const vault of vaults) {
        const vaultKeyData = await api.vaults.getKey(vault.id, result.session.accessToken);
        const vaultKey = unlockVaultKey(userRootKey, {
          wrappedVaultKey: vaultKeyData.wrappedVaultKey,
          wrappedVaultKeyNonce: vaultKeyData.wrappedVaultKeyNonce,
        });
        setVaultKey(vault.id, vaultKey);
      }

      router.push('/vault');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Invalid email or password.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginScreen
      onLogin={handleLogin}
      onGoSignup={() => router.push('/signup')}
      loading={loading}
      error={error}
    />
  );
}
