'use client';

import { useState } from 'react';
import { Icons } from '@/components/icons';

interface Props {
  onLogin: (email: string, password: string) => void;
  onGoSignup: () => void;
  loading?: boolean;
  error?: string;
}

export function LoginScreen({ onLogin, onGoSignup, loading, error }: Props) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, pw);
  };

  const formCard = (
    <form className="auth-card screen-fade" onSubmit={submit}>
      <div className="brand-mark" style={{ marginBottom: 28 }}>
        <span className="w-lock">Lock</span><span className="w-pass">Pass</span>
      </div>
      <h1>Welcome back.</h1>
      <p className="sub">Enter the master password to unlock your vault on this device.</p>

      <label className="field">
        <div className="field-label">Email</div>
        <input
          className="field-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoFocus
        />
      </label>

      <label className="field">
        <div className="field-label">
          <span>Master password</span>
          <span style={{ color: 'var(--ink-3)', fontSize: '10.5px' }}>Forgot?</span>
        </div>
        <div className="field-group">
          <input
            className={`field-input${pw ? ' mono' : ''}`}
            type={show ? 'text' : 'password'}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Type to unlock"
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
      <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
        {loading ? 'Unlocking…' : <><span>Unlock vault</span> <Icons.ArrowRight /></>}
      </button>

      <div className="auth-foot">
        New here?{' '}
        <a onClick={onGoSignup} style={{ cursor: 'pointer' }}>Create a vault</a>
      </div>
    </form>
  );

  return (
    <div className="auth-shell">
      <div className="auth-side">
        <div className="brand-mark">
          <span className="w-lock">Lock</span><span className="w-pass">Pass</span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="eyebrow" style={{ marginBottom: 22 }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', marginRight: 10 }} />
            Local-first · Zero-knowledge
          </div>
          <p className="quote">
            "The only key to your vault lives{' '}
            <span className="serif-it" style={{ color: 'var(--accent)' }}>on your device.</span>
            <br />We can't read it. Neither can anyone else."
          </p>
        </div>
      </div>
      <div className="auth-main">{formCard}</div>
    </div>
  );
}
