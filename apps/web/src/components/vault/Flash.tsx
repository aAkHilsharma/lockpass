'use client';

export function Flash({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return <div className="flash">{msg}</div>;
}
