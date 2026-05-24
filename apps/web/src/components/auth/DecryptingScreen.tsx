'use client';

export function DecryptingScreen({ label = 'Decrypting your data' }: { label?: string }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-5 bg-bg">
      <div className="w-9 h-9 rounded-full border-2 border-ink-4/25 border-t-ink-2 animate-spin" />
      <p className="text-[13.5px] text-ink-3">{label}</p>
    </div>
  );
}
