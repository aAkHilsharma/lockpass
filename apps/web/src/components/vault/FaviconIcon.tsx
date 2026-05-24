'use client';

import { useState } from 'react';
import { Icons } from '@/components/icons';

interface Props {
  urls?: string[];
  size?: number;
  active?: boolean;
}

function extractDomain(url: string): string | null {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return u.hostname;
  } catch {
    return null;
  }
}

export function FaviconIcon({ urls, size = 16, active = false }: Props) {
  const [failed, setFailed] = useState(false);

  const firstUrl = urls?.find((u) => u.trim());
  const domain = firstUrl ? extractDomain(firstUrl) : null;
  const faviconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    : null;

  if (faviconUrl && !failed) {
    return (
      <img
        src={faviconUrl}
        width={size}
        height={size}
        alt=""
        onError={() => setFailed(true)}
        className="rounded-sm object-contain"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span className={active ? 'text-accent' : 'text-ink-4'}>
      <Icons.User s={size} />
    </span>
  );
}
