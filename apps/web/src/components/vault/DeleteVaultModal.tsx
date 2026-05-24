'use client';

import { useState } from 'react';
import { Icons } from '@/components/icons';

interface Props {
  vaultName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteVaultModal({ vaultName, onConfirm, onCancel }: Props) {
  const [input, setInput] = useState('');
  const [touched, setTouched] = useState(false);

  const matches = input === vaultName;
  const showError = touched && !matches;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/25" onClick={onCancel} />
      <div className="relative bg-bg-elev rounded-2xl shadow-2xl w-full max-w-[420px] mx-4 p-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-[17px] font-semibold text-ink pr-6">
            Delete vault &ldquo;{vaultName}&rdquo;?
          </h3>
          <button
            onClick={onCancel}
            className="w-7 h-7 flex items-center justify-center rounded-full text-ink-3 hover:bg-bg-sunk hover:text-ink transition-colors shrink-0"
          >
            <Icons.X s={14} />
          </button>
        </div>

        {/* Warning */}
        <div className="border-l-4 border-red-400 pl-3 mb-5">
          <p className="text-[13.5px] text-ink-2 leading-relaxed">
            Vault &ldquo;{vaultName}&rdquo; and all its items will be permanently deleted.
            You cannot undo this action.
          </p>
        </div>

        {/* Confirm input */}
        <div className={`border rounded-lg px-3 py-2.5 transition-colors ${
          showError ? 'border-red-400 bg-red-50/50' : 'border-rule bg-bg'
        }`}>
          <p className="text-[11px] text-ink-4 mb-1">Confirm vault name</p>
          <input
            autoFocus
            value={input}
            onChange={(e) => { setInput(e.target.value); setTouched(true); }}
            placeholder={`Retype "${vaultName}" to confirm deletion`}
            className="w-full bg-transparent border-0 outline-none text-[14px] text-ink placeholder:text-ink-4"
          />
          {showError && (
            <p className="text-[12px] text-red-500 mt-1 flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">!</span>
              Vault name does not match
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-5">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-[13.5px] text-ink-2 hover:bg-bg-sunk border border-rule transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!matches}
            className={`px-4 py-2 rounded-lg text-[13.5px] font-medium transition-colors ${
              matches
                ? 'bg-red-500 text-white hover:bg-red-600 cursor-pointer'
                : 'bg-bg-sunk text-ink-4 cursor-not-allowed'
            }`}
          >
            Delete
          </button>
        </div>

      </div>
    </div>
  );
}
