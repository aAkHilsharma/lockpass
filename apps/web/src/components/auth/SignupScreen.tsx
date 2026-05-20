'use client';

import { useState } from 'react';
import { Icons } from '@/components/icons';
import { pwStrength } from '@/lib/vault-helpers';


interface Props {
  onSignup: (email: string, password: string) => void;
  onGoLogin: () => void;
  loading?: boolean;
  error?: string;
}

export function SignupScreen({ onSignup, onGoLogin, loading, error }: Props) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [agree, setAgree] = useState(false);

  const strength = pwStrength(pw);
  const matches = confirm.length > 0 && confirm === pw;
  const canSubmit = !!email && strength.score >= 2 && matches && agree;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) onSignup(email, pw);
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
            Step 01 of 03 · Master password
          </div>
          <p className="quote">
            Your master password{' '}
            <span className="serif-it" style={{ color: 'var(--accent)' }}>becomes</span> your vault.
            <br />Choose it like it's the only one that matters.
          </p>
        </div>
      </div>

      <div className="auth-main">
        <form className="auth-card screen-fade" onSubmit={submit}>
          <h1>Create your vault.</h1>
          <p className="sub">This master password is what encrypts everything. We never see it.</p>

          <label className="field">
            <div className="field-label">Email</div>
            <input
              className="field-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              autoComplete="email"
              autoFocus
            />
          </label>

          <label className="field">
            <div className="field-label">
              <span>Master password</span>
              <span className="muted mono" style={{ fontSize: 10.5, letterSpacing: '0.1em' }}>{pw.length} chars</span>
            </div>
            <div className="field-group">
              <input
                className={`field-input${pw ? ' mono' : ''}`}
                type={show ? 'text' : 'password'}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
              />
              <span className="field-suffix">
                <button type="button" onClick={() => setShow((s) => !s)}>
                  {show ? <Icons.EyeOff /> : <Icons.Eye />}
                </button>
              </span>
            </div>
            <div className={`pw-strength ${strength.cls}`}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`seg${strength.score >= i ? ' on' : ''}`} />
              ))}
            </div>
            <div className="pw-strength-row">
              <span>Strength</span>
              <span style={{ color: strength.score >= 3 ? 'var(--ok)' : strength.score >= 2 ? 'var(--ink-2)' : 'var(--warn)' }}>
                {strength.label}
              </span>
            </div>
          </label>

          <label className="field">
            <div className="field-label">Confirm</div>
            <input
              className={`field-input${confirm ? ' mono' : ''}`}
              type={show ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            {confirm.length > 0 && (
              <div className="pw-strength-row">
                <span />
                <span style={{ color: matches ? 'var(--ok)' : 'var(--warn)' }}>
                  {matches ? '✓ Match' : 'Doesn\'t match'}
                </span>
              </div>
            )}
          </label>

          <div style={{
            border: '1px solid var(--accent)', background: 'var(--accent-soft)',
            padding: '14px 16px', borderRadius: 2, margin: '8px 0 18px',
          }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }}><Icons.Alert s={16} /></div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>This password cannot be reset.</strong>{' '}
                If you forget it, we can't recover your vault. You'll get a recovery key on the next screen — keep it.
              </div>
            </div>
          </div>

          <label className="check" style={{ marginBottom: 18 }}>
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span className="box">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 5l2 2 4-4" />
              </svg>
            </span>
            <span className="lbl">I understand <strong>only I</strong> can decrypt this vault.</span>
          </label>

          {error && (
            <div style={{ color: 'var(--warn)', fontSize: 13, marginBottom: 12 }}>{error}</div>
          )}
          <button
            className="btn btn-primary btn-block"
            type="submit"
            disabled={!canSubmit || loading}
          >
            {loading ? 'Creating vault…' : <><span>Create vault</span> <Icons.ArrowRight /></>}
          </button>

          <div className="auth-foot">
            Already have a vault?{' '}
            <a onClick={onGoLogin} style={{ cursor: 'pointer' }}>Unlock</a>
          </div>
        </form>
      </div>
    </div>
  );
}
