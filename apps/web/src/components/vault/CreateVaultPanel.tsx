'use client';

import { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import {
  VAULT_COLORS, VAULT_ICON_KEYS, resolveVaultIcon,
  DEFAULT_VAULT_ICON, DEFAULT_VAULT_COLOR,
} from './vault-icons';

interface Props {
  editVaultId?: string;
  initialName?: string;
  initialColor?: string;
  initialIcon?: string;
  onSave: (name: string, color: string, icon: string) => Promise<void>;
  onClose: () => void;
}

export function CreateVaultPanel({ editVaultId, initialName, initialColor, initialIcon, onSave, onClose }: Props) {
  const isEdit = !!editVaultId;
  const [name, setName] = useState(initialName ?? '');
  const [color, setColor] = useState(initialColor ?? DEFAULT_VAULT_COLOR);
  const [icon, setIcon] = useState(initialIcon ?? DEFAULT_VAULT_ICON);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const nameMissing = submitted && !name.trim();
  const PreviewIcon = resolveVaultIcon(icon);

  const handleSave = async () => {
    setSubmitted(true);
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(name.trim(), color, icon);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-elev border-l border-rule-soft overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-rule-soft">
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-bg-sunk text-ink-3 hover:text-ink transition-colors"
        >
          <Icons.X s={13} />
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            'px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors',
            name.trim() && !saving
              ? 'bg-accent text-accent-ink hover:brightness-95 cursor-pointer'
              : 'bg-bg-sunk text-ink-4 cursor-not-allowed'
          )}
        >
          {saving ? (isEdit ? 'Saving vault…' : 'Creating vault…') : (isEdit ? 'Save vault' : 'Create vault')}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">

        {/* Vault icon preview + title */}
        <div className="px-5 pt-6 pb-4 flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white mt-1"
            style={{ background: color }}
          >
            <PreviewIcon size={20} strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-ink-4 mb-1">Title</p>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="Untitled"
              autoComplete="off"
              className={cn(
                'w-full text-[22px] font-semibold bg-transparent border-0 outline-none text-ink placeholder:text-ink-4',
                nameMissing && 'placeholder:text-red-400'
              )}
            />
            {nameMissing && (
              <p className="text-[12px] text-red-500 mt-1 flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">!</span>
                Vault name is required
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Color picker */}
        <div className="px-5 py-4">
          <p className="text-[12px] text-ink-3 mb-3">Color</p>
          <div className="flex items-center gap-2.5 flex-wrap">
            {VAULT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn(
                  'w-8 h-8 rounded-full transition-transform hover:scale-110',
                  color === c && 'ring-2 ring-offset-2 ring-ink-3'
                )}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>

        <Separator />

        {/* Icon picker */}
        <div className="px-5 py-4">
          <p className="text-[12px] text-ink-3 mb-3">Icon</p>
          <div className="grid grid-cols-10 gap-2">
            {VAULT_ICON_KEYS.map((key) => {
              const Icon = resolveVaultIcon(key);
              const selected = icon === key;
              return (
                <button
                  key={key}
                  onClick={() => setIcon(key)}
                  className={cn(
                    'aspect-square rounded-full flex items-center justify-center transition-colors',
                    selected
                      ? 'bg-accent/12 text-accent ring-2 ring-accent'
                      : 'bg-bg-sunk text-ink-3 hover:text-ink hover:bg-bg-sunk/70'
                  )}
                >
                  <Icon size={16} strokeWidth={1.8} />
                </button>
              );
            })}
          </div>
        </div>

        <Separator />

      </div>
    </div>
  );
}
