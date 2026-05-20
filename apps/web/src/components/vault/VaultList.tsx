'use client';

import { Icons } from '@/components/icons';
import type { VaultItem } from './types';

const TYPE_ICONS: Record<string, keyof typeof Icons> = {
  login: 'Login',
  note: 'Note',
};

interface Props {
  vaultName: string;
  items: VaultItem[];
  activeId: string | null;
  query: string;
  onQueryChange: (q: string) => void;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export function VaultList({ vaultName, items, activeId, query, onQueryChange, onSelect, onNew }: Props) {
  return (
    <section className="vault-list">
      <div className="vault-list-head">
        <div className="vault-search">
          <span style={{ color: 'var(--ink-3)' }}><Icons.Search /></span>
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search vault…"
          />
        </div>
        <button className="vault-list-newbtn" onClick={onNew}>
          <Icons.Plus s={13} />
          <span>Create item</span>
        </button>
      </div>

      {items.length > 0 && (
        <div className="vault-list-meta">
          <span>{vaultName} · {items.length} item{items.length === 1 ? '' : 's'}</span>
          <span style={{ color: 'var(--ink-4)' }}>Updated</span>
        </div>
      )}

      <div className="vault-list-scroll">
        {items.map((item) => {
          const iconName = TYPE_ICONS[item.type] ?? 'Note';
          const Icon = Icons[iconName];
          return (
            <div
              key={item.id}
              className={`vault-row${activeId === item.id ? ' active' : ''}`}
              onClick={() => onSelect(item.id)}
            >
              <span className="ic"><Icon s={16} /></span>
              <div className="body">
                <div className="t">{item.title}</div>
                <div className="s">{item.sub}</div>
              </div>
            </div>
          );
        })}

        {items.length === 0 && query && (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
            No items match "{query}".
          </div>
        )}
      </div>
    </section>
  );
}
