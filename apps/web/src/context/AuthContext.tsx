'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { session } from '@/lib/session';
import { createUnlockSession, restoreUnlockSession, clearUnlockSession } from '@/lib/unlock-session';

export type AuthStatus = 'loading' | 'locked' | 'unlocked' | 'loggedOut';

interface AuthContextValue {
  status: AuthStatus;
  userRootKey: Uint8Array | null;
  vaultKeys: Record<string, Uint8Array>;
  setUserRootKey: (key: Uint8Array) => Promise<void>;
  setVaultKey: (vaultId: string, key: Uint8Array) => void;
  lock: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [userRootKey, setUserRootKeyState] = useState<Uint8Array | null>(null);
  const [vaultKeys, setVaultKeys] = useState<Record<string, Uint8Array>>({});

  // On load, try to silently restore the unlock from sessionStorage + the
  // server-held ClientKey. Survives refresh; a closed tab leaves nothing to
  // restore, so we fall back to the locked (password) state.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!session.getAccessToken()) {
        if (!cancelled) setStatus('loggedOut');
        return;
      }
      const key = await restoreUnlockSession();
      if (cancelled) return;
      if (key) {
        setUserRootKeyState(key);
        setStatus('unlocked');
      } else {
        setStatus('locked');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const setUserRootKey = async (key: Uint8Array) => {
    setUserRootKeyState(key);
    setStatus('unlocked');
    await createUnlockSession(key);
  };

  const setVaultKey = (vaultId: string, key: Uint8Array) =>
    setVaultKeys((prev) => ({ ...prev, [vaultId]: key }));

  // Drop in-memory keys + the unlock session, but keep the auth session so the
  // user can re-unlock with just their password.
  const lock = () => {
    clearUnlockSession();
    setUserRootKeyState(null);
    setVaultKeys({});
    setStatus(session.getAccessToken() ? 'locked' : 'loggedOut');
  };

  const logout = () => {
    clearUnlockSession();
    session.clear();
    setUserRootKeyState(null);
    setVaultKeys({});
    setStatus('loggedOut');
  };

  return (
    <AuthContext.Provider value={{ status, userRootKey, vaultKeys, setUserRootKey, setVaultKey, lock, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
