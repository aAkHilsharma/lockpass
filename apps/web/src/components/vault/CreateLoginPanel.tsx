'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import type { VaultItem } from './types';

type SavePayload = Omit<VaultItem, 'updatedAt'>;

interface Props {
  vaultId: string;
  item?: VaultItem; // when provided → edit mode
  onSave: (item: SavePayload) => void;
  onClose: () => void;
}

function genPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  return Array.from({ length: 20 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function CreateLoginPanel({ vaultId, item, onSave, onClose }: Props) {
  const isEdit = !!item;

  const [title, setTitle] = useState(item?.title ?? '');
  const [username, setUsername] = useState(item?.username ?? '');
  const [password, setPassword] = useState(item?.password ?? '');
  const [showPw, setShowPw] = useState(false);
  const [urls, setUrls] = useState<string[]>(
    item?.urls && item.urls.length > 0 ? item.urls : ['']
  );
  const [note, setNote] = useState(item?.notes ?? '');
  const [submitted, setSubmitted] = useState(false);

  const titleMissing = submitted && !title.trim();

  const handleSave = () => {
    setSubmitted(true);
    if (!title.trim()) return;
    onSave({
      id: item?.id ?? crypto.randomUUID(),
      vaultId: item?.vaultId ?? vaultId,
      type: 'login',
      title: title.trim(),
      sub: username || urls.find(Boolean) || '',
      username,
      password,
      urls: urls.filter(Boolean),
      notes: note,
    });
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
          className={cn(
            'px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors',
            title.trim()
              ? 'bg-accent text-accent-ink hover:brightness-95 cursor-pointer'
              : 'bg-bg-sunk text-ink-4 cursor-not-allowed'
          )}
        >
          {isEdit ? 'Save' : 'Create login'}
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">

        {/* Title */}
        <div className="px-5 pt-5 pb-4">
          <p className="text-[11px] text-ink-4 mb-1">Title</p>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            className={cn(
              'w-full text-[22px] font-semibold bg-transparent border-0 outline-none text-ink placeholder:text-ink-4',
              titleMissing && 'placeholder:text-red-400'
            )}
          />
          {titleMissing && (
            <p className="text-[12px] text-red-500 mt-1 flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">!</span>
              Title is required
            </p>
          )}
        </div>

        <Separator />

        {/* Email or username */}
        <div className="flex items-start gap-3.5 px-5 py-4">
          <span className="text-ink-4 mt-0.5 shrink-0"><Icons.Login s={16} /></span>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-ink-3 mb-1">Email or username</p>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter email or username"
              className="border-0 p-0 h-auto text-[14px] shadow-none rounded-none bg-transparent focus-visible:ring-0 placeholder:text-ink-4"
            />
          </div>
        </div>

        <Separator />

        {/* Password */}
        <div className="flex items-start gap-3.5 px-5 py-4">
          <span className="text-ink-4 mt-0.5 shrink-0"><Icons.Lock s={16} /></span>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-ink-3 mb-1">Password</p>
            <Input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="border-0 p-0 h-auto text-[14px] shadow-none rounded-none bg-transparent focus-visible:ring-0 placeholder:text-ink-4 font-mono"
            />
          </div>
          <div className="flex items-center gap-1 shrink-0 mt-0.5">
            <button
              onClick={() => setShowPw((p) => !p)}
              className="w-7 h-7 flex items-center justify-center rounded-md text-ink-3 hover:bg-bg-sunk hover:text-ink transition-colors"
            >
              {showPw ? <Icons.EyeOff s={14} /> : <Icons.Eye s={14} />}
            </button>
            <button
              onClick={() => setPassword(genPassword())}
              className="w-7 h-7 flex items-center justify-center rounded-md text-ink-3 hover:bg-bg-sunk hover:text-ink transition-colors"
              title="Generate password"
            >
              <Icons.Refresh s={14} />
            </button>
          </div>
        </div>

        <Separator />

        {/* Websites */}
        <div className="flex items-start gap-3.5 px-5 py-4">
          <span className="text-ink-4 mt-0.5 shrink-0"><Icons.ExternalLink s={16} /></span>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-ink-3 mb-2">Websites</p>
            <div className="flex flex-col gap-2">
              {urls.map((u, i) => (
                <Input
                  key={i}
                  value={u}
                  onChange={(e) => {
                    const next = [...urls];
                    next[i] = e.target.value;
                    setUrls(next);
                  }}
                  placeholder="https://"
                  className="border-0 border-b border-rule-soft p-0 pb-2 h-auto text-[14px] shadow-none rounded-none bg-transparent focus-visible:ring-0 placeholder:text-ink-4"
                />
              ))}
            </div>
            <button
              onClick={() => setUrls([...urls, ''])}
              className="flex items-center gap-1.5 mt-3 text-[13px] text-accent hover:brightness-90 transition-colors font-medium"
            >
              <Icons.Plus s={13} />
              Add
            </button>
          </div>
        </div>

        <Separator />

        {/* Note */}
        <div className="flex items-start gap-3.5 px-5 py-4">
          <span className="text-ink-4 mt-0.5 shrink-0"><Icons.Note s={16} /></span>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-ink-3 mb-1">Note</p>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add note"
              rows={3}
              className="border-0 p-0 text-[14px] shadow-none rounded-none bg-transparent focus-visible:ring-0 placeholder:text-ink-4 resize-none min-h-0"
            />
          </div>
        </div>

        <Separator />

      </div>
    </div>
  );
}
