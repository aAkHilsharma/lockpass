import type {
  SignupRequest, SignupResponse,
  LoginRequest, LoginResponse,
  RefreshRequest, RefreshResponse,
  ListVaultsResponse, GetVaultKeyResponse,
  CreateVaultRequest, CreateVaultResponse,
  UpdateVaultMetadataRequest, UpdateVaultMetadataResponse,
  CreateItemRequest, CreateItemResponse,
  UpdateItemRequest, UpdateItemResponse,
  DeleteItemRequest, DeleteItemResponse,
} from '@lockpass/protocol';
import { session } from './session';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message);
  }
}

export interface KeysetData {
  version: number;
  kdfAlgorithm: string;
  kdfParams: { memoryKiB: number; iterations: number; parallelism: number };
  kdfSalt: string;
  wrappedUserRootKey: string;
  wrappedUserRootKeyNonce: string;
  wrappedUserRootKeyRecovery?: string;
  wrappedUserRootKeyRecoveryNonce?: string;
}

// Single-flight refresh: the server rotates the refresh token on every call, so
// concurrent 401s must share one refresh (otherwise the second uses a token the
// first already invalidated). Returns the new access token, or null if refresh
// is impossible (no/expired refresh token).
let refreshInFlight: Promise<string | null> | null = null;
function tryRefresh(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshToken = session.getRefreshToken();
      if (!refreshToken) return null;
      try {
        const res = await fetch(`${BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.data) return null;
        session.updateTokens(json.data.accessToken, json.data.refreshToken);
        return json.data.accessToken as string;
      } catch {
        return null;
      }
    })().finally(() => { refreshInFlight = null; });
  }
  return refreshInFlight;
}

async function req<T>(path: string, options: RequestInit & { token?: string; _retried?: boolean } = {}): Promise<T> {
  const { token, _retried, ...rest } = options;
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: {
      ...(rest.body != null ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...rest.headers,
    },
  });

  // Transparently refresh an expired access token once, then retry.
  if (res.status === 401 && token && !_retried) {
    const newToken = await tryRefresh();
    if (newToken) return req<T>(path, { ...options, token: newToken, _retried: true });
  }

  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(json?.error?.code ?? 'ERROR', json?.error?.message ?? 'Unknown error', res.status);
  return json.data as T;
}

export const api = {
  auth: {
    signup: (body: SignupRequest) =>
      req<SignupResponse>('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: LoginRequest) =>
      req<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    refresh: (body: RefreshRequest) =>
      req<RefreshResponse>('/auth/refresh', { method: 'POST', body: JSON.stringify(body) }),
    logout: (refreshToken: string, token: string) =>
      req('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }), token }),
  },
  vaults: {
    list: (token: string) => req<ListVaultsResponse>('/vaults', { token }),
    create: (body: CreateVaultRequest, token: string) =>
      req<CreateVaultResponse>('/vaults', { method: 'POST', body: JSON.stringify(body), token }),
    getKey: (vaultId: string, token: string) =>
      req<GetVaultKeyResponse>(`/vaults/${vaultId}/key`, { token }),
    updateMetadata: (vaultId: string, body: UpdateVaultMetadataRequest, token: string) =>
      req<UpdateVaultMetadataResponse>(`/vaults/${vaultId}/metadata`, { method: 'PUT', body: JSON.stringify(body), token }),
    delete: (vaultId: string, token: string) =>
      req<{ success: boolean }>(`/vaults/${vaultId}`, { method: 'DELETE', token }),
  },
  items: {
    list: (vaultId: string, token: string) =>
      req<{ items: Array<{ itemId: string; vaultId: string; itemType: string; schemaVersion: number; revision: number; vaultKeyVersion: number; ciphertext: string; nonce: string; createdAt: string; updatedAt: string; deletedAt?: string }>; serverTime: string }>(`/vaults/${vaultId}/items`, { token }),
    create: (vaultId: string, body: CreateItemRequest, token: string) =>
      req<CreateItemResponse>(`/vaults/${vaultId}/items`, { method: 'POST', body: JSON.stringify(body), token }),
    update: (vaultId: string, itemId: string, body: UpdateItemRequest, token: string) =>
      req<UpdateItemResponse>(`/vaults/${vaultId}/items/${itemId}`, { method: 'PUT', body: JSON.stringify(body), token }),
    delete: (vaultId: string, itemId: string, body: DeleteItemRequest, token: string) =>
      req<DeleteItemResponse>(`/vaults/${vaultId}/items/${itemId}`, { method: 'DELETE', body: JSON.stringify(body), token }),
  },
  me: {
    keyset: (token: string) => req<KeysetData>('/me/keyset', { token }),
  },
  unlock: {
    store: (clientKey: string, token: string) =>
      req<{ unlockKeyId: string }>('/unlock-keys', { method: 'POST', body: JSON.stringify({ clientKey }), token }),
    get: (id: string, token: string) =>
      req<{ clientKey: string }>(`/unlock-keys/${id}`, { token }),
    remove: (id: string, token: string) =>
      req<{ success: boolean }>(`/unlock-keys/${id}`, { method: 'DELETE', token }),
  },
};
