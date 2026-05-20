import type {
  SignupRequest, SignupResponse,
  LoginRequest, LoginResponse,
  RefreshRequest, RefreshResponse,
  ListVaultsResponse, GetVaultKeyResponse,
  CreateItemRequest, CreateItemResponse,
  UpdateItemRequest, UpdateItemResponse,
  DeleteItemRequest, DeleteItemResponse,
} from '@lockpass/protocol';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message);
  }
}

async function req<T>(path: string, options: RequestInit & { token?: string } = {}): Promise<T> {
  const { token, ...rest } = options;
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...rest.headers,
    },
  });
  const json = await res.json();
  if (!res.ok) throw new ApiError(json.error?.code ?? 'ERROR', json.error?.message ?? 'Unknown error', res.status);
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
    getKey: (vaultId: string, token: string) =>
      req<GetVaultKeyResponse>(`/vaults/${vaultId}/key`, { token }),
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
};
