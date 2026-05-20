'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignupScreen } from '@/components/auth/SignupScreen';
import { useAuth } from '@/context/AuthContext';
import { api, ApiError } from '@/lib/api';
import { session } from '@/lib/session';
import { signupCrypto } from '@/lib/vault-crypto';

export default function SignupPage() {
  const router = useRouter();
  const { setUserRootKey, setVaultKey } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (email: string, password: string) => {
    setError('');
    setLoading(true);
    try {
      const crypto = signupCrypto(password);

      const result = await api.auth.signup({
        email,
        password,
        device: {
          label: `${navigator.platform ?? 'Browser'} · Web`,
          type: 'web',
          userAgent: navigator.userAgent,
        },
        keyset: crypto.keyset,
        initialVault: crypto.initialVault,
      });

      session.save({
        accessToken: result.session.accessToken,
        refreshToken: result.session.refreshToken,
        userId: result.user.id,
        email: result.user.email,
      });

      setUserRootKey(crypto.userRootKey);
      setVaultKey(result.vault.id, crypto.vaultKey);

      // Pass recovery key via sessionStorage so /recovery page can show it
      sessionStorage.setItem('lp_recovery_key', crypto.recoveryKeyFormatted);
      sessionStorage.setItem('lp_recovery_email', email);

      router.push('/recovery');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.code === 'EMAIL_TAKEN' ? 'An account with this email already exists.' : err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SignupScreen
        onSignup={handleSignup}
        onGoLogin={() => router.push('/login')}
        loading={loading}
        error={error}
      />
    </>
  );
}
