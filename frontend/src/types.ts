export {};
export type SearchHistoryItem = {
  query: string;
  time: number;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  time: number;
};

export type Shortcut = {
  id: string;
  name: string;
  url: string;
  favicon: string;
};

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export const ViewMode = {
  HOME: 'HOME' as const,
  AI_CHAT: 'AI_CHAT' as const,
  NOTES: 'NOTES' as const,
  HISTORY: 'HISTORY' as const,
  SHORTCUTS: 'SHORTCUTS' as const,
};

export type ViewMode = typeof ViewMode[keyof typeof ViewMode];

export const Theme = {
  CLASSIC: 'CLASSIC' as const,
  DARK: 'DARK' as const,
  COMET: 'COMET' as const,
};

export type Theme = typeof Theme[keyof typeof Theme];