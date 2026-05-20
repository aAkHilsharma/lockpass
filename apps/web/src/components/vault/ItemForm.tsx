'use client';

import { useState } from 'react';
import { Icons } from '@/components/icons';
import { pwStrength, generatePassword, useFlash } from '@/lib/vault-helpers';
import { Flash } from './Flash';
import type { VaultItem, ItemType } from './types';

const ITEM_TYPES: { key: ItemType; label: string; icon: keyof typeof Icons }[] = [
  { key: 'login', label: 'Login', icon: 'Login' },
  { key: 'note', label: 'Secure Note', icon: 'Note' },
];

interface Props {
  item?: VaultItem | null;
  vaultId: string;
  onSave: (item: Omit<VaultItem, 'updatedAt'>) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
}

export function ItemForm({ item, vaultId, onSave, onCancel, onDelete }: Props) {
  const [type, setType] = useState<ItemType>(item?.type ?? 'login');
  const [title, setTitle] = useState(item?.title ?? '');
  const [username, setUsername] = useState(item?.username ?? '');
  const [password, setPassword] = useState(item?.password ?? '');
  const [urls, setUrls] = useState<string[]>(item?.urls ?? ['']);
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [showPw, setShowPw] = useState(false);
  const [flash, flashMsg] = useFlash();

  const strength = pwStrength(password);

  const generate = () => {
    setPassword(generatePassword(20));
    setShowPw(true);
    flash('Generated · 20 chars');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: item?.id ?? crypto.randomUUID(),
      vaultId,
      type,
      title,
      sub: type === 'login' ? (username || urls[0] || '') : '',
      username,
      password,
      urls: urls.filter((u) => u.trim()),
      notes,
      favorite: item?.favorite,
    });
  };

  return (
    <section className="vault-detail screen-fade">
      <header className="vault-detail-head">
        <span className="crumb">
          {item ? 'Edit item' : 'New item'}<span className="sep">/</span>
          {ITEM_TYPES.find((t) => t.key === type)?.label}
        </span>
        <div className="actions">
          {item && onDelete && (
            <button className="btn btn-ghost btn-sm" onClick={() => {
              if (confirm(`Delete ${item.title || 'this item'}?`)) onDelete(item.id);
            }}>Delete</button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={submit}>Save</button>
        </div>
      </header>

      <form className="vault-detail-body" onSubmit={submit}>
        <div className="detail-section" style={{ borderTop: 'none', paddingTop: 0, marginBottom: 8 }}>
          <div className="detail-section-label">Type</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {ITEM_TYPES.map(({ key, label, icon }) => {
              const Icon = Icons[icon];
              const active = type === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setType(key)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px',
                    border: `1px solid ${active ? 'var(--ink)' : 'var(--rule)'}`,
                    background: active ? 'var(--ink)' : 'transparent',
                    color: active ? 'var(--bg)' : 'var(--ink-2)',
                    borderRadius: 2, fontSize: 12.5, cursor: 'pointer',
                  }}
                >
                  <Icon s={14} /> {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="detail-section">
          <div className="detail-section-label">Basics</div>
          <label className="field">
            <div className="field-label">Title</div>
            <input
              className="field-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'login' ? 'GitHub' : 'Home Wi-Fi'}
              autoFocus
            />
          </label>

          {type === 'login' && (
            <div className="form-grid">
              <label className="field">
                <div className="field-label">Username / email</div>
                <input
                  className="field-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="off"
                />
              </label>
              <label className="field">
                <div className="field-label">
                  <span>Password</span>
                  <button type="button" className="muted" onClick={generate} style={{ fontSize: 11.5, cursor: 'pointer' }}>
                    Generate
                  </button>
                </div>
                <div className="field-group">
                  <input
                    className={`field-input${password ? ' mono' : ''}`}
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <span className="field-suffix">
                    <button type="button" onClick={() => setShowPw((s) => !s)}>
                      {showPw ? <Icons.EyeOff /> : <Icons.Eye />}
                    </button>
                  </span>
                </div>
                {password && (
                  <div className={`pw-strength ${strength.cls}`} style={{ marginTop: 6 }}>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`seg${strength.score >= i ? ' on' : ''}`} />
                    ))}
                  </div>
                )}
              </label>
            </div>
          )}
        </div>

        {type === 'login' && (
          <div className="detail-section">
            <div className="detail-section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>URLs</span>
              <button type="button" onClick={() => setUrls([...urls, ''])} className="muted" style={{ fontSize: 11.5, cursor: 'pointer' }}>
                + Add URL
              </button>
            </div>
            {urls.map((u, i) => (
              <div className="url-row" key={i}>
                <input
                  className="field-input"
                  value={u}
                  onChange={(e) => { const nu = [...urls]; nu[i] = e.target.value; setUrls(nu); }}
                  placeholder="https://example.com"
                />
                <button type="button" className="icon-btn" onClick={() => setUrls(urls.filter((_, j) => j !== i))}>
                  <Icons.X />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="detail-section">
          <div className="detail-section-label">Notes</div>
          <textarea
            className="field-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything you want to remember about this item."
            rows={5}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary">{item ? 'Save changes' : 'Create item'}</button>
        </div>
      </form>

      <Flash msg={flashMsg} />
    </section>
  );
}
