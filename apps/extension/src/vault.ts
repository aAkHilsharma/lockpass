import { unlockVaultKey, decryptItem } from '@lockpass/api-client';
import { client } from './client';
import { sessionStorageAdapter } from './storage';
import type { VaultStatus, VaultItemSummary, MatchSummary } from './messages';

// Decrypted item summaries are cached in chrome.storage.session so autofill is
// served locally with no network round-trips (Proton-style). storage.session is
// in-memory, survives SW restarts, and clears on browser close — matching our
// lock-on-close model. The network is only touched to warm/refresh this cache.
const ITEMS_KEY = 'lp_items';

// The background SW is the only context that holds key material. Keys live in
// module memory; on SW restart they're rehydrated from chrome.storage.session +
// the server-held ClientKey (ensureKey).
const DEVICE = { label: 'LockPass Extension', type: 'extension' as const, userAgent: navigator.userAgent };

let userRootKey: Uint8Array | null = null;
const vaultKeys: Record<string, Uint8Array> = {};
let itemCache: VaultItemSummary[] | null = null;
let loadInFlight: Promise<VaultItemSummary[]> | null = null;

function reset() {
  userRootKey = null;
  itemCache = null;
  for (const k of Object.keys(vaultKeys)) delete vaultKeys[k];
}

async function ensureKey(): Promise<boolean> {
  if (userRootKey) return true;
  const k = await client.unlock.restoreUnlockSession();
  if (k) {
    userRootKey = k;
    return true;
  }
  return false;
}

export async function getStatus(): Promise<VaultStatus> {
  if (await ensureKey()) return 'unlocked';
  return (await client.session.getAccessToken()) ? 'locked' : 'loggedOut';
}

export async function signup(email: string, password: string): Promise<{ recoveryKey: string }> {
  const c = await client.crypto.signupCrypto(password);
  const res = await client.api.auth.signup({
    email, password, device: DEVICE, keyset: c.keyset, initialVault: c.initialVault,
  });
  await client.session.save({
    accessToken: res.session.accessToken, refreshToken: res.session.refreshToken,
    userId: res.user.id, email: res.user.email,
  });
  userRootKey = c.userRootKey;
  vaultKeys[res.vault.id] = c.vaultKey;
  await client.unlock.createUnlockSession(userRootKey);
  void loadAll().catch(() => {}); // warm cache in background
  return { recoveryKey: c.recoveryKeyFormatted };
}

export async function login(email: string, password: string): Promise<void> {
  const res = await client.api.auth.login({ email, password, device: DEVICE });
  await client.session.save({
    accessToken: res.session.accessToken, refreshToken: res.session.refreshToken,
    userId: res.user.id, email: res.user.email,
  });
  userRootKey = await client.crypto.loginCrypto(password, res.keyset);
  await client.unlock.createUnlockSession(userRootKey);
  void loadAll().catch(() => {}); // warm cache in background
}

export async function unlock(password: string): Promise<void> {
  const keyset = await client.api.me.keyset();
  userRootKey = await client.crypto.loginCrypto(password, keyset);
  await client.unlock.createUnlockSession(userRootKey);
  void loadAll().catch(() => {}); // warm cache in background
}

export async function lock(): Promise<void> {
  await client.unlock.clearUnlockSession();
  await sessionStorageAdapter.remove(ITEMS_KEY);
  reset();
}

export async function logout(): Promise<void> {
  const rt = await client.session.getRefreshToken();
  if (rt) await client.api.auth.logout(rt).catch(() => {});
  await client.unlock.clearUnlockSession();
  await sessionStorageAdapter.remove(ITEMS_KEY);
  await client.session.clear();
  reset();
}

function toSummary(item: ReturnType<typeof decryptItem>, vaultId: string): VaultItemSummary {
  if (item.type === 'login') {
    return { id: item.id, vaultId, type: 'login', title: item.title, username: item.username, password: item.password, urls: item.urls };
  }
  return { id: item.id, vaultId, type: 'note', title: item.title, notes: item.body };
}

// Fetches + decrypts the whole vault from the API and refreshes the cache.
// Deduped so concurrent callers (e.g. warm-on-unlock + first getMatches) share
// one round-trip. This is the ONLY path that touches the network for items.
function loadAll(): Promise<VaultItemSummary[]> {
  if (loadInFlight) return loadInFlight;
  loadInFlight = (async () => {
    if (!(await ensureKey()) || !userRootKey) throw new Error('Vault is locked');
    const vaults = await client.api.vaults.list();
    const out: VaultItemSummary[] = [];
    for (const v of vaults) {
      let vk = vaultKeys[v.id];
      if (!vk) {
        const kd = await client.api.vaults.getKey(v.id);
        vk = unlockVaultKey(userRootKey, { wrappedVaultKey: kd.wrappedVaultKey, wrappedVaultKeyNonce: kd.wrappedVaultKeyNonce });
        vaultKeys[v.id] = vk;
      }
      const { items } = await client.api.items.list(v.id);
      for (const env of items) {
        if (env.deletedAt) continue;
        try {
          const item = decryptItem({ ciphertext: env.ciphertext, nonce: env.nonce, itemId: env.itemId }, vk);
          out.push(toSummary(item, v.id));
        } catch {}
      }
    }
    itemCache = out;
    await sessionStorageAdapter.set(ITEMS_KEY, JSON.stringify(out));
    return out;
  })().finally(() => { loadInFlight = null; });
  return loadInFlight;
}

// Cache read: SW memory → storage.session. Returns null only if nothing is
// cached (i.e. not yet warmed for this unlocked session).
async function getCached(): Promise<VaultItemSummary[] | null> {
  if (itemCache) return itemCache;
  const raw = await sessionStorageAdapter.get(ITEMS_KEY);
  if (raw) {
    try {
      itemCache = JSON.parse(raw) as VaultItemSummary[];
      return itemCache;
    } catch {}
  }
  return null;
}

// Popup: always refresh from the server (and update the cache).
export async function getItems(): Promise<VaultItemSummary[]> {
  return loadAll();
}

function hostOf(url: string): string {
  try {
    return new URL(url.includes('://') ? url : `https://${url}`).hostname.toLowerCase();
  } catch {
    return '';
  }
}

// Registrable-domain heuristic (last two labels). Good enough for v1; doesn't
// handle multi-part TLDs like co.uk.
function regDomain(host: string): string {
  const parts = host.split('.');
  return parts.length <= 2 ? host : parts.slice(-2).join('.');
}

function matchesPage(pageHost: string, item: VaultItemSummary): boolean {
  if (item.type !== 'login') return false;
  const pd = regDomain(pageHost);
  const byUrl = (item.urls ?? []).some((u) => {
    const h = hostOf(u);
    return h !== '' && (h === pageHost || regDomain(h) === pd);
  });
  if (byUrl) return true;
  // Fallback: item title contains the site's main label (e.g. "github" on
  // github.com), so saved items without an explicit URL still surface.
  const label = pd.split('.')[0];
  return label.length > 1 && item.title.toLowerCase().includes(label);
}

// Autofill path. Serves from the local cache (no network) when warm. Only
// falls back to a network load if nothing is cached yet for this session.
export async function getMatches(url: string): Promise<MatchSummary[]> {
  const pageHost = hostOf(url);
  if (!pageHost) return [];
  let items = await getCached();
  if (!items) {
    if (!(await ensureKey())) return []; // locked → no matches
    items = await loadAll();
  }
  return items
    .filter((it) => matchesPage(pageHost, it))
    .map((it) => ({ id: it.id, title: it.title, username: it.username }));
}

export async function fillCredential(id: string): Promise<{ username: string; password: string }> {
  const items = (await getCached()) ?? [];
  const item = items.find((i) => i.id === id);
  if (!item) throw new Error('Item not found');
  return { username: item.username ?? '', password: item.password ?? '' };
}
