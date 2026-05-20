'use client';

import { useState } from 'react';
import { Icons } from '@/components/icons';
import { pwStrength, useFlash } from '@/lib/vault-helpers';
import { Flash } from './Flash';

interface DeviceEntry {
  id: string;
  label: string;
  type: 'web' | 'extension';
  platform?: string;
  lastSeenAt?: string;
  isCurrent?: boolean;
}

interface Props {
  email: string;
  devices: DeviceEntry[];
  onBack: () => void;
  onRevokeDevice: (id: string) => void;
  onChangeMasterPassword: (oldPw: string, newPw: string) => void;
}

const DEVICE_ICON: Record<string, keyof typeof Icons> = {
  web: 'Computer',
  extension: 'Browser',
};

export function SettingsScreen({ email, devices, onBack, onRevokeDevice, onChangeMasterPassword }: Props) {
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [show, setShow] = useState(false);
  const [flash, flashMsg] = useFlash();

  const strength = pwStrength(newPw);
  const matches = confirmPw.length > 0 && confirmPw === newPw;
  const canSubmit = !!oldPw && !!newPw && matches && strength.score >= 2;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onChangeMasterPassword(oldPw, newPw);
    flash('Master password changed');
    setOldPw(''); setNewPw(''); setConfirmPw('');
  };

  return (
    <section className="vault-detail screen-fade" style={{ gridColumn: '2 / span 2' }}>
      <header className="vault-detail-head">
        <button className="icon-btn" onClick={onBack}><Icons.ChevronLeft /></button>
        <span className="crumb">Settings<span className="sep">/</span>Account</span>
      </header>

      <div className="vault-detail-body" style={{ maxWidth: 720 }}>
        <div style={{ marginBottom: 8 }}>
          <div className="eyebrow">Settings</div>
          <h1 style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400,
            fontSize: 48, letterSpacing: '-0.02em', margin: '8px 0 0', lineHeight: 1,
          }}>
            Account &amp; security
          </h1>
        </div>

        <section className="settings-section">
          <h3>Devices</h3>
          <p className="lede">
            Active sessions for <span className="mono" style={{ fontSize: 12.5 }}>{email}</span>.
            Revoke any you don't recognise.
          </p>
          {devices.map((d) => {
            const iconName = DEVICE_ICON[d.type] ?? 'Computer';
            const Icon = Icons[iconName];
            return (
              <div key={d.id} className={`device-row${d.isCurrent ? ' this-device' : ''}`}>
                <span className="ic"><Icon s={20} /></span>
                <div>
                  <div className="t">{d.label}</div>
                  <div className="s">{d.platform ?? d.type} · {d.lastSeenAt ?? 'now'}</div>
                </div>
                {d.isCurrent
                  ? <span className="badge">This device</span>
                  : <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-3)' }}>Trusted</span>
                }
                {d.isCurrent
                  ? <span style={{ width: 90 }} />
                  : <button className="btn btn-danger btn-sm" onClick={() => { onRevokeDevice(d.id); flash('Session revoked'); }}>Revoke</button>
                }
              </div>
            );
          })}
          <div style={{ marginTop: 14, fontSize: 12.5, color: 'var(--ink-3)' }}>
            <span className="mono" style={{ fontSize: 12 }}>Tip · </span>
            Revoking a session forces a re-unlock on that device. Vault data stays encrypted.
          </div>
        </section>

        <section className="settings-section">
          <h3>Master password</h3>
          <p className="lede">Changing this re-encrypts your vault. A new recovery key will be generated.</p>

          <div style={{
            border: '1px solid var(--accent)', background: 'var(--accent-soft)',
            padding: '12px 14px', borderRadius: 2, marginBottom: 24,
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <div style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }}><Icons.Alert /></div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>Heads up.</strong>{' '}
              All your other sessions will be revoked. You'll need to re-unlock LockPass everywhere.
            </div>
          </div>

          <form onSubmit={submit}>
            <label className="field">
              <div className="field-label">Current master password</div>
              <div className="field-group">
                <input
                  className={`field-input${oldPw ? ' mono' : ''}`}
                  type={show ? 'text' : 'password'}
                  value={oldPw}
                  onChange={(e) => setOldPw(e.target.value)}
                />
                <span className="field-suffix">
                  <button type="button" onClick={() => setShow((s) => !s)}>
                    {show ? <Icons.EyeOff /> : <Icons.Eye />}
                  </button>
                </span>
              </div>
            </label>

            <div className="form-grid">
              <label className="field">
                <div className="field-label">New password</div>
                <input
                  className={`field-input${newPw ? ' mono' : ''}`}
                  type={show ? 'text' : 'password'}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                />
                {newPw && (
                  <div className={`pw-strength ${strength.cls}`} style={{ marginTop: 6 }}>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`seg${strength.score >= i ? ' on' : ''}`} />
                    ))}
                  </div>
                )}
              </label>
              <label className="field">
                <div className="field-label">Confirm</div>
                <input
                  className={`field-input${confirmPw ? ' mono' : ''}`}
                  type={show ? 'text' : 'password'}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                />
                {confirmPw && (
                  <div className="pw-strength-row" style={{ marginTop: 6 }}>
                    <span />
                    <span style={{ color: matches ? 'var(--ok)' : 'var(--warn)' }}>
                      {matches ? '✓ Match' : 'Doesn\'t match'}
                    </span>
                  </div>
                )}
              </label>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
              <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
                Re-encrypt vault
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => { setOldPw(''); setNewPw(''); setConfirmPw(''); }}>
                Reset
              </button>
            </div>
          </form>
        </section>
      </div>

      <Flash msg={flashMsg} />
    </section>
  );
}
