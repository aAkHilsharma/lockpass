import { useState } from 'react';

const wrap: React.CSSProperties = {
  minHeight: '100vh', background: '#1a1730', color: '#fff',
  fontFamily: 'system-ui, sans-serif', padding: '64px 80px', boxSizing: 'border-box',
};
const btnPrimary: React.CSSProperties = {
  background: '#b9acff', color: '#1a1730', border: 0, borderRadius: 999,
  padding: '12px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', width: 360,
};
const btnGhost: React.CSSProperties = {
  background: 'transparent', color: '#fff', border: '1px solid #3a3552', borderRadius: 999,
  padding: '12px 20px', fontSize: 14, cursor: 'pointer', width: 360, marginTop: 10,
};

export function App() {
  const [step, setStep] = useState<1 | 2>(1);

  return (
    <div style={wrap}>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 24 }}>LockPass</div>
      <h1 style={{ fontSize: 40, margin: '0 0 28px' }}>Welcome to your new password manager!</h1>
      <div style={{ fontSize: 13, color: '#8d86ab', fontWeight: 600 }}>Step {step} of 2</div>

      {step === 1 ? (
        <div style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 20 }}>Pin the extension</h2>
          <p style={{ color: '#b3aecb' }}>For easy access to your passwords and more.</p>
          <ol style={{ color: '#b3aecb', lineHeight: 2 }}>
            <li>Open the Extensions menu</li>
            <li>Pin LockPass to your toolbar</li>
            <li>Click the icon to open it anytime</li>
          </ol>
          <button style={btnPrimary} onClick={() => setStep(2)}>Continue</button>
        </div>
      ) : (
        <div style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 20 }}>Connect your account</h2>
          <p style={{ color: '#b3aecb' }}>Sign in or create an account to continue.</p>
          {/* Phase 2 wires these to in-extension login/signup. */}
          <button style={btnPrimary} disabled>Connect your account</button>
          <br />
          <button style={btnGhost} disabled>Create an account</button>
          <p style={{ color: '#6d6790', fontSize: 12, marginTop: 16 }}>Auth flow lands in Phase 2.</p>
        </div>
      )}
    </div>
  );
}
