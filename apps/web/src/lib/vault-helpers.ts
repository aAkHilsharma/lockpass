'use client';

import { useCallback, useRef, useState } from 'react';

export function useFlash() {
  const [msg, setMsg] = useState<string | null>(null);
  const ref = useRef<ReturnType<typeof setTimeout>>(undefined);

  const flash = useCallback((m: string) => {
    setMsg(m);
    clearTimeout(ref.current);
    ref.current = setTimeout(() => setMsg(null), 1400);
  }, []);

  return [flash, msg] as const;
}

export function maskedDots(n = 14) {
  return '•'.repeat(n);
}

export function pwStrength(pw: string) {
  if (!pw) return { score: 0, label: '—', cls: '' };
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 14) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  const labels = ['Empty', 'Weak', 'Fair', 'Good', 'Strong'];
  const cls = ['', 'weak', 'fair', 'good', 'strong'][s]!;
  return { score: s, label: labels[s]!, cls };
}

export function generatePassword(length = 20): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
  let p = '';
  for (let i = 0; i < length; i++) {
    p += chars[Math.floor(Math.random() * chars.length)];
  }
  return p;
}
