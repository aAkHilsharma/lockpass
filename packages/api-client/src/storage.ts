// Async key/value storage abstraction. Each platform supplies its own:
// web → localStorage / sessionStorage, extension → chrome.storage.local /
// chrome.storage.session. Async because chrome.storage has no sync API.
export interface StorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}
