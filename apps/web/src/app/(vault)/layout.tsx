'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { DecryptingScreen } from '@/components/auth/DecryptingScreen';
import { UnlockScreen } from '@/components/auth/UnlockScreen';

export default function VaultLayout({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loggedOut') router.replace('/login');
  }, [status, router]);

  if (status === 'unlocked') return <>{children}</>;
  if (status === 'locked') return <UnlockScreen />;
  return <DecryptingScreen />;
}
