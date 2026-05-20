'use client';

import { useState, useEffect, useRef } from 'react';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { maskedDots, useFlash } from '@/lib/vault-helpers';
import { Flash } from './Flash';
import type { VaultItem } from './types';

interface Props {
  item: VaultItem | null;
  vaultName: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

function FieldRow({
  icon, label, value, mono = false, isLink = false, actions,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  isLink?: boolean;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3.5 px-5 py-4">
      <span className="text-ink-4 mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[11.5px] text-ink-3 mb-0.5">{label}</p>
        {isLink ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[14px] text-accent hover:underline break-all"
          >
            {value}
          </a>
        ) : (
          <p className={`text-[14px] text-ink break-all ${mono ? 'font-mono' : ''}`}>{value}</p>
        )}
      </div>
      {actions && <div className="shrink-0 flex items-center gap-1">{actions}</div>}
    </div>
  );
}

export function VaultDetail({ item, onEdit, onDelete, onNew }: Props) {
  const [showPw, setShowPw] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [flash, flashMsg] = useFlash();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setShowPw(false); }, [item?.id]);
  useEffect(() => { setShowMenu(false); }, [item?.id]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const copy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    flash(`${label} copied`);
  };

  if (!item) {
    return (
      <div className="flex-1 flex items-center justify-center text-ink-4 text-[13.5px]">
        Select an item to view details
      </div>
    );
  }

  return (
    <section className="flex-1 flex flex-col min-w-0 overflow-hidden bg-bg">

      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-rule-soft shrink-0">
        <h2 className="text-[20px] font-semibold text-ink flex-1 min-w-0 truncate">{item.title}</h2>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onEdit(item.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-rule text-ink-2 text-[13px] font-medium hover:bg-bg-sunk transition-colors"
          >
            <Icons.Edit s={13} />
            Edit
          </button>

          {/* Three-dot menu */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setShowMenu((p) => !p)}
              className={`w-8 h-8 flex items-center justify-center rounded-md border border-rule transition-colors ${
                showMenu ? 'bg-bg-sunk text-ink' : 'text-ink-3 hover:bg-bg-sunk hover:text-ink'
              }`}
            >
              <Icons.MoreVertical s={15} />
            </button>
            {showMenu && (
              <div className="absolute top-full right-0 mt-1 w-36 bg-bg-elev border border-rule rounded-lg shadow-lg overflow-hidden z-50">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    if (confirm(`Delete "${item.title}"?`)) onDelete(item.id);
                  }}
                  className="w-full px-3 py-2.5 text-[13px] text-left text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  <Icons.Trash s={13} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">

        {item.type === 'login' && (
          <>
            {/* Credentials card */}
            <div className="mx-5 mt-5 rounded-xl border border-rule-soft bg-bg-elev overflow-hidden">
              {item.username && (
                <>
                  <FieldRow
                    icon={<Icons.Login s={16} />}
                    label="Username"
                    value={item.username}
                    actions={
                      <button
                        onClick={() => copy(item.username!, 'Username')}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-ink-4 hover:bg-bg-sunk hover:text-ink transition-colors"
                      >
                        <Icons.Copy s={13} />
                      </button>
                    }
                  />
                  <Separator />
                </>
              )}

              {item.password !== undefined && (
                <div className="flex items-start gap-3.5 px-5 py-4">
                  <span className="text-ink-4 mt-0.5 shrink-0"><Icons.Lock s={16} /></span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11.5px] text-ink-3 mb-0.5">Password</p>
                    <p className="text-[14px] text-ink font-mono">
                      {showPw ? item.password : maskedDots(item.password?.length ?? 12)}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1">
                    <button
                      onClick={() => setShowPw((p) => !p)}
                      className="w-7 h-7 flex items-center justify-center rounded-md text-ink-4 hover:bg-bg-sunk hover:text-ink transition-colors"
                    >
                      {showPw ? <Icons.EyeOff s={13} /> : <Icons.Eye s={13} />}
                    </button>
                    <button
                      onClick={() => copy(item.password!, 'Password')}
                      className="w-7 h-7 flex items-center justify-center rounded-md text-ink-4 hover:bg-bg-sunk hover:text-ink transition-colors"
                    >
                      <Icons.Copy s={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Websites card */}
            {item.urls && item.urls.length > 0 && (
              <div className="mx-5 mt-3 rounded-xl border border-rule-soft bg-bg-elev overflow-hidden">
                <div className="flex items-start gap-3.5 px-5 py-4">
                  <span className="text-ink-4 mt-0.5 shrink-0"><Icons.ExternalLink s={16} /></span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11.5px] text-ink-3 mb-1">Websites</p>
                    <div className="flex flex-col gap-1">
                      {item.urls.map((u, i) => (
                        <a
                          key={i}
                          href={u}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[14px] text-accent hover:underline break-all"
                        >
                          {u}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {item.type === 'note' && item.notes && (
          <div className="mx-5 mt-5 rounded-xl border border-rule-soft bg-bg-elev overflow-hidden">
            <FieldRow
              icon={<Icons.Note s={16} />}
              label="Note"
              value={item.notes}
            />
          </div>
        )}

        {/* Metadata */}
        <div className="mx-5 mt-3 mb-6 rounded-xl border border-rule-soft bg-bg-elev overflow-hidden">
          <div className="flex items-center gap-3.5 px-5 py-3">
            <span className="text-ink-4 shrink-0"><Icons.Edit s={14} /></span>
            <div className="flex-1">
              <p className="text-[11.5px] text-ink-3">Last modified</p>
              <p className="text-[13px] text-ink">{item.updatedAt}</p>
            </div>
          </div>
        </div>

      </div>

      <Flash msg={flashMsg} />
    </section>
  );
}
