import { useEffect, useState } from 'react';
import { c, Brand, TextInput, Btn, ErrorText } from '../../src/ui';
import { sendBg, type VaultStatus, type VaultItemSummary } from '../../src/messages';

const shell: React.CSSProperties = {
  width: 340, minHeight: 200, background: c.bg, color: c.ink,
  fontFamily: 'system-ui, sans-serif', padding: 16, boxSizing: 'border-box',
};

export function App() {
  const [status, setStatus] = useState<VaultStatus | 'checking'>('checking');

  useEffect(() => {
    sendBg({ type: 'status' }).then((r) => setStatus(r.ok && r.status ? r.status : 'loggedOut'));
  }, []);

  return (
    <div style={shell}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <Brand />
        {status === 'unlocked' && (
          <button
            onClick={async () => { await sendBg({ type: 'lock' }); setStatus('locked'); }}
            style={{ background: 'transparent', border: `1px solid ${c.border}`, color: c.ink2, borderRadius: 999, padding: '4px 12px', fontSize: 12, cursor: 'pointer' }}
          >
            Lock
          </button>
        )}
      </div>

      {status === 'checking' && <p style={{ color: c.ink3, fontSize: 13 }}>Checking…</p>}
      {status === 'loggedOut' && <LoggedOut />}
      {status === 'locked' && <Locked onUnlocked={() => setStatus('unlocked')} />}
      {status === 'unlocked' && <Vault />}
    </div>
  );
}

function LoggedOut() {
  return (
    <>
      <p style={{ color: c.ink2, fontSize: 13 }}>Connect your account to access your vault.</p>
      <Btn onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('/welcome.html') })}>
        Connect your account
      </Btn>
    </>
  );
}

function Locked({ onUnlocked }: { onUnlocked: () => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(''); setLoading(true);
    const res = await sendBg({ type: 'unlock', password: pw });
    setLoading(false);
    if (res.ok) onUnlocked();
    else { setError('Incorrect master password.'); setPw(''); }
  };

  return (
    <>
      <p style={{ color: c.ink2, fontSize: 13, marginTop: 0 }}>Enter your master password to unlock.</p>
      <TextInput type="password" autoFocus value={pw}
        onChange={(e) => setPw(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && pw && submit()} placeholder="Master password" />
      <ErrorText>{error}</ErrorText>
      <Btn disabled={loading || !pw} onClick={submit}>{loading ? 'Unlocking…' : 'Unlock'}</Btn>
    </>
  );
}

function Vault() {
  const [items, setItems] = useState<VaultItemSummary[] | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    sendBg({ type: 'getItems' }).then((r) => {
      if (r.ok) setItems(r.items ?? []);
      else setError(r.error || 'Could not load items.');
    });
  }, []);

  const copy = (label: string, value?: string) => {
    if (!value) return;
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopied(label);
    setTimeout(() => setCopied(''), 1200);
  };

  if (error) return <ErrorText>{error}</ErrorText>;
  if (!items) return <p style={{ color: c.ink3, fontSize: 13 }}>Decrypting…</p>;
  if (items.length === 0) return <p style={{ color: c.ink3, fontSize: 13 }}>No items yet.</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
      {items.map((it) => (
        <div key={it.id} style={{ background: c.card, borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{it.title || 'Untitled'}</div>
          {it.username && <div style={{ fontSize: 12, color: c.ink3, marginTop: 2 }}>{it.username}</div>}
          {it.type === 'login' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {it.username && <CopyBtn label={`user-${it.id}`} copied={copied} onClick={() => copy(`user-${it.id}`, it.username)}>Copy user</CopyBtn>}
              {it.password && <CopyBtn label={`pass-${it.id}`} copied={copied} onClick={() => copy(`pass-${it.id}`, it.password)}>Copy password</CopyBtn>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CopyBtn({ label, copied, onClick, children }: { label: string; copied: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      style={{ background: 'transparent', border: `1px solid ${c.border}`, color: c.accent, borderRadius: 6, padding: '4px 10px', fontSize: 11.5, cursor: 'pointer' }}>
      {copied === label ? 'Copied' : children}
    </button>
  );
}
