import type {
  SignupRequest, SignupResponse,
  LoginRequest, LoginResponse,
  ListVaultsResponse, GetVaultKeyResponse,
  CreateVaultRequest, CreateVaultResponse,
  UpdateVaultMetadataRequest, UpdateVaultMetadataResponse,
  CreateItemRequest, CreateItemResponse,
  UpdateItemRequest, UpdateItemResponse,
  DeleteItemRequest, DeleteItemResponse,
} from '@lockpass/protocol';
import type { Session } from './session.js';
import type { KeysetData } from './types.js';

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message);
  }
}

export interface ItemsListResponse {
  items: Array<{
    itemId: string; vaultId: string; itemType: string; schemaVersion: number;
    revision: number; vaultKeyVersion: number; ciphertext: string; nonce: string;
    createdAt: string; updatedAt: string; deletedAt?: string;
  }>;
  serverTime: string;
}

type ReqOptions = RequestInit & { auth?: boolean; _retried?: boolean };

export function createApi(baseUrl: string, session: Session) {
  // Single-flight refresh: the server rotates the refresh token on every call,
  // so concurrent 401s must share one refresh.
  let refreshInFlight: Promise<string | null> | null = null;
  function tryRefresh(): Promise<string | null> {
    if (!refreshInFlight) {
      refreshInFlight = (async () => {
        const refreshToken = await session.getRefreshToken();
        if (!refreshToken) return null;
        try {
          const res = await fetch(`${baseUrl}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          const json = await res.json().catch(() => null);
          if (!res.ok || !json?.data) return null;
          await session.updateTokens(json.data.accessToken, json.data.refreshToken);
          return json.data.accessToken as string;
        } catch {
          return null;
        }
      })().finally(() => { refreshInFlight = null; });
    }
    return refreshInFlight;
  }

  async function req<T>(path: string, options: ReqOptions = {}): Promise<T> {
    const { auth = true, _retried, ...rest } = options;
    const token = auth ? await session.getAccessToken() : null;
    const res = await fetch(`${baseUrl}${path}`, {
      ...rest,
      headers: {
        ...(rest.body != null ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...rest.headers,
      },
    });

    if (res.status === 401 && auth && !_retried) {
      const newToken = await tryRefresh();
      if (newToken) return req<T>(path, { ...options, _retried: true });
    }

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new ApiError(json?.error?.code ?? 'ERROR', json?.error?.message ?? 'Unknown error', res.status);
    }
    return json.data as T;
  }

  return {
    auth: {
      signup: (body: SignupRequest) =>
        req<SignupResponse>('/auth/signup', { method: 'POST', body: JSON.stringify(body), auth: false }),
      login: (body: LoginRequest) =>
        req<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body), auth: false }),
      logout: (refreshToken: string) =>
        req('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
    },
    me: {
      keyset: () => req<KeysetData>('/me/keyset'),
    },
    vaults: {
      list: () => req<ListVaultsResponse>('/vaults'),
      create: (body: CreateVaultRequest) =>
        req<CreateVaultResponse>('/vaults', { method: 'POST', body: JSON.stringify(body) }),
      getKey: (vaultId: string) => req<GetVaultKeyResponse>(`/vaults/${vaultId}/key`),
      updateMetadata: (vaultId: string, body: UpdateVaultMetadataRequest) =>
        req<UpdateVaultMetadataResponse>(`/vaults/${vaultId}/metadata`, { method: 'PUT', body: JSON.stringify(body) }),
      delete: (vaultId: string) => req<{ success: boolean }>(`/vaults/${vaultId}`, { method: 'DELETE' }),
    },
    items: {
      list: (vaultId: string) => req<ItemsListResponse>(`/vaults/${vaultId}/items`),
      create: (vaultId: string, body: CreateItemRequest) =>
        req<CreateItemResponse>(`/vaults/${vaultId}/items`, { method: 'POST', body: JSON.stringify(body) }),
      update: (vaultId: string, itemId: string, body: UpdateItemRequest) =>
        req<UpdateItemResponse>(`/vaults/${vaultId}/items/${itemId}`, { method: 'PUT', body: JSON.stringify(body) }),
      delete: (vaultId: string, itemId: string, body: DeleteItemRequest) =>
        req<DeleteItemResponse>(`/vaults/${vaultId}/items/${itemId}`, { method: 'DELETE', body: JSON.stringify(body) }),
    },
    unlock: {
      store: (clientKey: string) =>
        req<{ unlockKeyId: string }>('/unlock-keys', { method: 'POST', body: JSON.stringify({ clientKey }) }),
      get: (id: string) => req<{ clientKey: string }>(`/unlock-keys/${id}`),
      remove: (id: string) => req<{ success: boolean }>(`/unlock-keys/${id}`, { method: 'DELETE' }),
    },
  };
}

export type Api = ReturnType<typeof createApi>;
