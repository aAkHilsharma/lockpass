'use client';

import { useState } from 'react';
import { Icons } from '@/components/icons';
import { useFlash } from '@/lib/vault-helpers';
import { downloadRecoveryKey } from '@/lib/vault-crypto';
import { Flash } from '@/components/vault/Flash';

interface Props {
  recoveryKey: string;
  issuedTo: string;
  onConfirm: () => void;
}

export function RecoveryScreen({ recoveryKey, issuedTo, onConfirm }: Props) {
  const [confirmed1, setC1] = useState(false);
  const [confirmed2, setC2] = useState(false);
  const [confirmed3, setC3] = useState(false);
  const [flash, flashMsg] = useFlash();

  const canEnter = confirmed1 && confirmed2 && confirmed3;
  const keyBlocks = recoveryKey.split('-');
  const issuedDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const copyKey = () => {
    navigator.clipboard?.writeText(recoveryKey).catch(() => {});
    flash('Recovery key copied');
  };

  return (
    <div className="recovery-shell screen-fade">
      <div className="stage">
        <div className="recovery-warn-banner">
          <span className="pulse" />
          <span>This screen will not be shown again. Save your recovery key now.</span>
        </div>

        <div className="eyebrow" style={{ marginBottom: 12 }}>Step 03 of 03 · Recovery</div>
        <h1 style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400,
          fontSize: 54, lineHeight: 1.02, letterSpacing: '-0.02em', margin: '0 0 16px',
        }}>
          Your recovery key.
        </h1>
        <p style={{ fontSize: 16, color: 'var(--ink-2)', maxWidth: 560, margin: '0 0 28px', lineHeight: 1.55 }}>
          This is the only thing that can rescue your vault if you forget your master password.
          We do not keep a copy. Treat it like the key to a safe-deposit box, because that is what it is.
        </p>

        <div className="ticks recovery-key-block">
          <div className="tick-bl" /><div className="tick-br" />
          <span className="stamp">Recovery Key</span>
          <div className="key">
            {keyBlocks.map((g, i) => <span className="grp" key={i}>{g}</span>)}
          </div>
        </div>

        <div className="recovery-meta">
          <div><div className="k">Issued</div><div className="mono">{issuedDate}</div></div>
          <div><div className="k">Bound to</div><div className="mono">{issuedTo}</div></div>
          <div><div className="k">Format</div><div className="mono">256-bit · Base32</div></div>
        </div>

        <div className="recovery-actions">
          <button className="btn btn-ghost btn-sm" onClick={copyKey}><Icons.Copy /> Copy to clipboard</button>
          <button className="btn btn-ghost btn-sm" onClick={() => { downloadRecoveryKey(recoveryKey, issuedTo); flash('Downloaded'); }}><Icons.Download /> Download</button>
          <button className="btn btn-ghost btn-sm" onClick={() => flash('Sent to printer')}><Icons.Print /> Print</button>
        </div>

        <div className="recovery-checks">
          {[
            { state: confirmed1, set: setC1, label: <>I have stored this key somewhere I will find it <strong>in five years</strong>.</> },
            { state: confirmed2, set: setC2, label: <>I understand LockPass <strong>cannot</strong> retrieve this for me.</> },
            { state: confirmed3, set: setC3, label: <>If I lose this key and my master password, my vault is <strong>permanently inaccessible</strong>.</> },
          ].map(({ state, set, label }, i) => (
            <label className="check" key={i}>
              <input type="checkbox" checked={state} onChange={(e) => set(e.target.checked)} />
              <span className="box">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 5l2 2 4-4" />
                </svg>
              </span>
              <span className="lbl">{label}</span>
            </label>
          ))}
        </div>

        <button
          className="btn btn-primary"
          disabled={!canEnter}
          onClick={onConfirm}
        >
          I've saved it — enter vault <Icons.ArrowRight />
        </button>
      </div>
      <Flash msg={flashMsg} />
    </div>
  );
}
