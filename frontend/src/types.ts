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

export enum ViewMode {
  HOME = 'HOME',
  AI_CHAT = 'AI_CHAT',
  NOTES = 'NOTES',
  HISTORY = 'HISTORY',
  SHORTCUTS = 'SHORTCUTS'
}

export enum Theme {
  CLASSIC = 'CLASSIC',
  DARK = 'DARK',
  COMET = 'COMET'
}