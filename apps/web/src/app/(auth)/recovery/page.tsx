'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RecoveryScreen } from '@/components/auth/RecoveryScreen';

export default function RecoveryPage() {
  const router = useRouter();
  const [recoveryKey, setRecoveryKey] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const key = sessionStorage.getItem('lp_recovery_key');
    const em = sessionStorage.getItem('lp_recovery_email');
    if (!key) {
      router.replace('/signup');
      return;
    }
    setRecoveryKey(key);
    setEmail(em ?? '');
  }, [router]);

  const handleConfirm = () => {
    sessionStorage.removeItem('lp_recovery_key');
    sessionStorage.removeItem('lp_recovery_email');
    router.push('/vault');
  };

  if (!recoveryKey) return null;

  return (
    <RecoveryScreen
      recoveryKey={recoveryKey}
      issuedTo={email}
      onConfirm={handleConfirm}
    />
  );
}
