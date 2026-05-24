'use client';

import { useState } from 'react';
import { Icons } from '@/components/icons';
import { useAuth } from '@/context/AuthContext';
import { api, ApiError } from '@/lib/api';
import { session } from '@/lib/session';
import { loginCrypto } from '@/lib/vault-crypto';

export function UnlockScreen() {
  const { setUserRootKey, logout } = useAuth();
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const email = session.getEmail() ?? '';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pw) return;
    setError('');
    setLoading(true);
    try {
      const token = session.getAccessToken();
      if (!token) { logout(); return; }
      const keyset = await api.me.keyset(token);
      const userRootKey = await loginCrypto(pw, keyset);
      await setUserRootKey(userRootKey);
      // On success the gate swaps this screen for the vault; no need to reset.
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) { logout(); return; }
      setError('Incorrect master password.');
      setPw('');
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-side">
        <div className="brand-mark">
          <span className="w-lock">Lock</span><span className="w-pass">Pass</span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="eyebrow" style={{ marginBottom: 22 }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', marginRight: 10 }} />
            Locked · Zero-knowledge
          </div>
          <p className="quote">
            Your vault is{' '}
            <span className="serif-it" style={{ color: 'var(--accent)' }}>locked.</span>
            <br />Enter your master password to continue.
          </p>
        </div>
      </div>

      <div className="auth-main">
        <form className="auth-card screen-fade" onSubmit={submit}>
          <div className="brand-mark" style={{ marginBottom: 28 }}>
            <span className="w-lock">Lock</span><span className="w-pass">Pass</span>
          </div>
          <h1>Welcome back.</h1>
          <p className="sub">{email ? `Unlock the vault for ${email}.` : 'Enter your master password to unlock.'}</p>

          <label className="field">
            <div className="field-label"><span>Master password</span></div>
            <div className="field-group">
              <input
                className={`field-input${pw ? ' mono' : ''}`}
                type={show ? 'text' : 'password'}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="Type to unlock"
                autoFocus
              />
              <span className="field-suffix">
                <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide' : 'Show'}>
                  {show ? <Icons.EyeOff /> : <Icons.Eye />}
                </button>
              </span>
            </div>
          </label>

          {error && (
            <div style={{ color: 'var(--warn)', fontSize: 13, marginBottom: 12 }}>{error}</div>
          )}
          <button className="btn btn-primary btn-block" type="submit" disabled={loading || !pw}>
            {loading ? 'Unlocking…' : <><span>Unlock vault</span> <Icons.ArrowRight /></>}
          </button>

          <div className="auth-foot">
            Not you?{' '}
            <a onClick={logout} style={{ cursor: 'pointer' }}>Sign out</a>
          </div>
        </form>
      </div>
    </div>
  );
}
