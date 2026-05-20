'use client';

import { createContext, useContext, useRef, useState } from 'react';

interface AuthContextValue {
  userRootKey: Uint8Array | null;
  vaultKeys: Record<string, Uint8Array>;
  setUserRootKey: (key: Uint8Array) => void;
  setVaultKey: (vaultId: string, key: Uint8Array) => void;
  clearKeys: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userRootKey, setUserRootKeyState] = useState<Uint8Array | null>(null);
  const [vaultKeys, setVaultKeys] = useState<Record<string, Uint8Array>>({});

  const setUserRootKey = (key: Uint8Array) => setUserRootKeyState(key);
  const setVaultKey = (vaultId: string, key: Uint8Array) =>
    setVaultKeys((prev) => ({ ...prev, [vaultId]: key }));
  const clearKeys = () => { setUserRootKeyState(null); setVaultKeys({}); };

  return (
    <AuthContext.Provider value={{ userRootKey, vaultKeys, setUserRootKey, setVaultKey, clearKeys }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
