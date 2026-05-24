import { useEffect, useState } from 'react';

export function App() {
  const [status, setStatus] = useState<'checking' | 'unlocked' | 'locked'>('checking');

  useEffect(() => {
    chrome.runtime
      .sendMessage({ type: 'lp:status' })
      .then((res: { unlocked: boolean }) => setStatus(res?.unlocked ? 'unlocked' : 'locked'))
      .catch(() => setStatus('locked'));
  }, []);

  return (
    <div style={{ width: 320, padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <strong style={{ fontSize: 15 }}>LockPass</strong>
      <p style={{ color: '#888', fontSize: 13, marginTop: 8 }}>
        {status === 'checking' ? 'Checking…' : status === 'unlocked' ? 'Unlocked.' : 'Locked — sign in from the popup (Phase 2).'}
      </p>
    </div>
  );
}
