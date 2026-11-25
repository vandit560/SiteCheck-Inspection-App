import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

let inMemoryStore: Record<string, string> = {};
let isStoreLoaded = false;

function getStorageFilePath(): string | null {
  const dir = FileSystem.documentDirectory;
  if (!dir) return null;
  return dir.endsWith('/') ? `${dir}sitecheck_store.json` : `${dir}/sitecheck_store.json`;
}

async function ensureLoaded(): Promise<Record<string, string>> {
  if (isStoreLoaded) {
    return inMemoryStore;
  }

  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k && k.startsWith('@sitecheck')) {
            inMemoryStore[k] = window.localStorage.getItem(k) || '';
          }
        }
      }
    } catch {}
    isStoreLoaded = true;
    return inMemoryStore;
  }

  try {
    const file = getStorageFilePath();
    if (file) {
      const info = await FileSystem.getInfoAsync(file);
      if (info.exists) {
        const raw = await FileSystem.readAsStringAsync(file);
        if (raw) {
          inMemoryStore = JSON.parse(raw) || {};
        }
      }
    }
  } catch (err) {
    console.warn('[FallbackStorage] Could not load stored file:', err);
  }

  isStoreLoaded = true;
  return inMemoryStore;
}

async function persistToDisk(): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        for (const [k, v] of Object.entries(inMemoryStore)) {
          window.localStorage.setItem(k, v);
        }
      }
    } catch {}
    return;
  }

  try {
    const file = getStorageFilePath();
    if (file) {
      await FileSystem.writeAsStringAsync(file, JSON.stringify(inMemoryStore));
    }
  } catch (err) {
    console.warn('[FallbackStorage] Could not persist to disk:', err);
  }
}

export const FallbackStorage = {
  async getItem(key: string): Promise<string | null> {
    const store = await ensureLoaded();
    return store[key] !== undefined ? store[key] : null;
  },

  async setItem(key: string, value: string): Promise<void> {
    const store = await ensureLoaded();
    store[key] = value;
    await persistToDisk();
  },

  async removeItem(key: string): Promise<void> {
    const store = await ensureLoaded();
    if (key in store) {
      delete store[key];
      if (Platform.OS === 'web') {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem(key);
          }
        } catch {}
      }
      await persistToDisk();
    }
  },

  async multiRemove(keys: string[]): Promise<void> {
    const store = await ensureLoaded();
    for (const k of keys) {
      delete store[k];
      if (Platform.OS === 'web') {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem(k);
          }
        } catch {}
      }
    }
    await persistToDisk();
  },

  clearMemory(): void {
    inMemoryStore = {};
    isStoreLoaded = false;
  },
};

