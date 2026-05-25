import { useState } from 'react';
import { c, Brand, TextInput, Btn, ErrorText } from '../../src/ui';
import { sendBg } from '../../src/messages';

type View = 'pin' | 'choose' | 'login' | 'signup' | 'recovery' | 'done';

const page: React.CSSProperties = {
  minHeight: '100vh', background: c.bg, color: c.ink, boxSizing: 'border-box',
  fontFamily: 'system-ui, sans-serif', display: 'flex', justifyContent: 'center',
  paddingTop: 80,
};
const col: React.CSSProperties = { width: 420, maxWidth: '90vw' };

export function App() {
  const [view, setView] = useState<View>('pin');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');

  const step = view === 'pin' ? 1 : 2;

  const doLogin = async () => {
    setError(''); setLoading(true);
    const res = await sendBg({ type: 'login', email: email.trim(), password: pw });
    setLoading(false);
    if (res.ok) setView('done');
    else setError(res.error || 'Could not sign in.');
  };

  const doSignup = async () => {
    setError('');
    if (pw !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const res = await sendBg({ type: 'signup', email: email.trim(), password: pw });
    setLoading(false);
    if (res.ok) { setRecoveryKey(res.recoveryKey ?? ''); setView('recovery'); }
    else setError(res.error || 'Could not create the account.');
  };

  return (
    <div style={page}>
      <div style={col}>
        <Brand size={18} />
        <h1 style={{ fontSize: 34, margin: '18px 0 22px', lineHeight: 1.1 }}>
          Welcome to your new password manager!
        </h1>
        <div style={{ fontSize: 12, color: c.ink3, fontWeight: 600, marginBottom: 18 }}>Step {step} of 2</div>

        {view === 'pin' && (
          <>
            <h2 style={{ fontSize: 19, margin: '0 0 6px' }}>Pin the extension</h2>
            <p style={{ color: c.ink2, marginTop: 0 }}>For quick access to your passwords.</p>
            <ol style={{ color: c.ink2, lineHeight: 1.9, paddingLeft: 18 }}>
              <li>Open the Extensions menu (puzzle icon)</li>
              <li>Pin LockPass to your toolbar</li>
              <li>Click the icon to open it anytime</li>
            </ol>
            <Btn onClick={() => setView('choose')}>Continue</Btn>
          </>
        )}

        {view === 'choose' && (
          <>
            <h2 style={{ fontSize: 19, margin: '0 0 6px' }}>Connect your account</h2>
            <p style={{ color: c.ink2, marginTop: 0 }}>Sign in or create an account to continue.</p>
            <Btn onClick={() => { setError(''); setView('login'); }}>Connect your account</Btn>
            <Btn variant="ghost" onClick={() => { setError(''); setView('signup'); }}>Create an account</Btn>
          </>
        )}

        {view === 'login' && (
          <>
            <h2 style={{ fontSize: 19, margin: '0 0 12px' }}>Sign in</h2>
            <TextInput label="Email" type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
            <TextInput label="Master password" type="password" value={pw}
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doLogin()} />
            <ErrorText>{error}</ErrorText>
            <Btn disabled={loading || !email || !pw} onClick={doLogin}>{loading ? 'Unlocking…' : 'Sign in'}</Btn>
            <Btn variant="ghost" disabled={loading} onClick={() => setView('choose')}>Back</Btn>
          </>
        )}

        {view === 'signup' && (
          <>
            <h2 style={{ fontSize: 19, margin: '0 0 12px' }}>Create your vault</h2>
            <TextInput label="Email" type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
            <TextInput label="Master password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
            <TextInput label="Confirm master password" type="password" value={confirm}
              onChange={(e) => setConfirm(e.target.value)} />
            <ErrorText>{error}</ErrorText>
            <Btn disabled={loading || !email || !pw || !confirm} onClick={doSignup}>
              {loading ? 'Creating…' : 'Create account'}
            </Btn>
            <Btn variant="ghost" disabled={loading} onClick={() => setView('choose')}>Back</Btn>
          </>
        )}

        {view === 'recovery' && (
          <>
            <h2 style={{ fontSize: 19, margin: '0 0 6px' }}>Your recovery key</h2>
            <p style={{ color: c.ink2, marginTop: 0 }}>
              Save this somewhere safe. It is the only way to recover your vault if you forget your
              master password. We cannot retrieve it for you.
            </p>
            <div style={{
              background: c.field, border: `1px solid ${c.border}`, borderRadius: 8, padding: 14,
              fontFamily: 'monospace', fontSize: 15, letterSpacing: '0.06em', wordBreak: 'break-all', color: c.accent,
            }}>
              {recoveryKey}
            </div>
            <Btn onClick={() => navigator.clipboard?.writeText(recoveryKey).catch(() => {})} variant="ghost">
              Copy to clipboard
            </Btn>
            <Btn onClick={() => setView('done')}>I&rsquo;ve saved it — continue</Btn>
          </>
        )}

        {view === 'done' && (
          <>
            <h2 style={{ fontSize: 19, margin: '0 0 6px' }}>You&rsquo;re all set</h2>
            <p style={{ color: c.ink2 }}>
              Your vault is unlocked. Click the LockPass icon in your toolbar to open it anytime.
              You can close this tab.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
