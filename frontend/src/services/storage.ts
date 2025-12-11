
export const storage = {
  get: <T,>(key: string): T | null => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },
  set: <T,>(key: string, value: T): void => {
    localStorage.setItem(key, JSON.stringify(value));
  },
  delete: (key: string): void => {
    localStorage.removeItem(key);
  }
};

export const STORAGE_KEYS = {
  HISTORY: 'comet-history',
  NOTES: 'comet-notes',
  SHORTCUTS: 'comet-shortcuts',
  THEME: 'comet-theme',
  USERNAME: 'comet-username'
};