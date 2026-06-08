const STORAGE_PREFIX = 'dp_';

export function loadPersist<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return defaultValue;
    const parsed = JSON.parse(raw);
    return parsed as T;
  } catch {
    return defaultValue;
  }
}

export function savePersist<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function clearPersist(key: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    // ignore
  }
}
