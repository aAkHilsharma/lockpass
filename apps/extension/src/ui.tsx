import type { CSSProperties, InputHTMLAttributes, ButtonHTMLAttributes } from 'react';

export const c = {
  bg: '#1a1730',
  card: '#221d3a',
  field: '#15121f',
  accent: '#b9acff',
  accentInk: '#1a1730',
  ink: '#ffffff',
  ink2: '#b3aecb',
  ink3: '#8d86ab',
  ink4: '#6d6790',
  border: '#3a3552',
  danger: '#ff8080',
};

export function Brand({ size = 16 }: { size?: number }) {
  return (
    <div style={{ fontWeight: 700, fontSize: size, color: c.ink, letterSpacing: '-0.01em' }}>
      Lock<span style={{ color: c.accent }}>Pass</span>
    </div>
  );
}

const fieldStyle: CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: c.field, color: c.ink,
  border: `1px solid ${c.border}`, borderRadius: 8, padding: '10px 12px',
  fontSize: 14, outline: 'none',
};

export function TextInput({ label, ...props }: { label?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      {label && <div style={{ fontSize: 12, color: c.ink3, marginBottom: 6 }}>{label}</div>}
      <input style={fieldStyle} {...props} />
    </label>
  );
}

export function Btn(
  { variant = 'primary', ...props }: { variant?: 'primary' | 'ghost' } & ButtonHTMLAttributes<HTMLButtonElement>,
) {
  const base: CSSProperties = {
    width: '100%', boxSizing: 'border-box', borderRadius: 999, padding: '11px 18px',
    fontSize: 14, fontWeight: 600, cursor: props.disabled ? 'not-allowed' : 'pointer',
    opacity: props.disabled ? 0.55 : 1, marginTop: 6,
  };
  const variants: Record<string, CSSProperties> = {
    primary: { ...base, background: c.accent, color: c.accentInk, border: 0 },
    ghost: { ...base, background: 'transparent', color: c.ink, border: `1px solid ${c.border}` },
  };
  return <button style={variants[variant]} {...props} />;
}

export function ErrorText({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <div style={{ color: c.danger, fontSize: 13, margin: '4px 0 10px' }}>{children}</div>;
}
