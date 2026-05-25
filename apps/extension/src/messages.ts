// RPC between thin UI contexts (popup, welcome) and the background service
// worker, which owns keys + API access.
export type VaultStatus = 'unlocked' | 'locked' | 'loggedOut';

export interface VaultItemSummary {
  id: string;
  vaultId: string;
  type: 'login' | 'note';
  title: string;
  username?: string;
  password?: string;
  urls?: string[];
  notes?: string;
}

// Metadata-only match (no password) for the autofill dropdown.
export interface MatchSummary {
  id: string;
  title: string;
  username?: string;
}

export type BgRequest =
  | { type: 'status' }
  | { type: 'signup'; email: string; password: string }
  | { type: 'login'; email: string; password: string }
  | { type: 'unlock'; password: string }
  | { type: 'lock' }
  | { type: 'logout' }
  | { type: 'getItems' }
  | { type: 'getMatches'; url: string }
  | { type: 'fillCredential'; id: string };

export type BgResponse =
  | {
      ok: true;
      status?: VaultStatus;
      recoveryKey?: string;
      items?: VaultItemSummary[];
      matches?: MatchSummary[];
      credential?: { username: string; password: string };
    }
  | { ok: false; error: string };

export async function sendBg(req: BgRequest): Promise<BgResponse> {
  try {
    return (await chrome.runtime.sendMessage(req)) as BgResponse;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
