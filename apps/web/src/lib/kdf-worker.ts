import { deriveUnlockKey, type KdfParams } from '@lockpass/crypto';

interface DeriveRequest {
  id: number;
  password: string;
  salt: Uint8Array;
  params: KdfParams;
}

interface WorkerScope {
  onmessage: ((e: MessageEvent<DeriveRequest>) => void) | null;
  postMessage(message: unknown): void;
}

const ctx = self as unknown as WorkerScope;

ctx.onmessage = (e: MessageEvent<DeriveRequest>) => {
  const { id, password, salt, params } = e.data;
  try {
    const key = deriveUnlockKey(password, salt, params);
    ctx.postMessage({ id, key });
  } catch (err) {
    ctx.postMessage({ id, error: err instanceof Error ? err.message : String(err) });
  }
};
