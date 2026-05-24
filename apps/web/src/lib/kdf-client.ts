import { deriveUnlockKey, type KdfParams } from '@lockpass/crypto';

interface PendingEntry {
  resolve: (key: Uint8Array) => void;
  reject: (err: Error) => void;
}

interface WorkerResponse {
  id: number;
  key?: Uint8Array;
  error?: string;
}

let worker: Worker | null = null;
const pending = new Map<number, PendingEntry>();
let nextId = 0;

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null;
  if (!worker) {
    worker = new Worker(new URL('./kdf-worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const { id, key, error } = e.data;
      const entry = pending.get(id);
      if (!entry) return;
      pending.delete(id);
      if (error) entry.reject(new Error(error));
      else entry.resolve(key!);
    };
    worker.onerror = (e) => {
      const err = new Error(e.message || 'KDF worker failed');
      pending.forEach((entry) => entry.reject(err));
      pending.clear();
      worker = null;
    };
  }
  return worker;
}

// Runs Argon2id off the main thread so the UI can paint (e.g. a disabled
// button / spinner) while the ~0.5–2s derivation runs. Falls back to a
// synchronous derive only where Web Workers are unavailable (SSR/tests).
export function deriveUnlockKeyAsync(
  password: string,
  salt: Uint8Array,
  params: KdfParams,
): Promise<Uint8Array> {
  const w = getWorker();
  if (!w) return Promise.resolve(deriveUnlockKey(password, salt, params));
  return new Promise<Uint8Array>((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    w.postMessage({ id, password, salt, params });
  });
}
