
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  History as HistoryIcon, 
  StickyNote, 
  MessageSquare, 
  Bookmark, 
  X, 
  Plus, 
  Trash2, 
  Save, 
  Edit3, 
  ArrowRight,
  Send,
  Loader2,
  Sparkles,
  Sun,
  Moon,
  Rocket,
  PlusCircle,
  Home as HomeIcon,
  User,
} from 'lucide-react';
import { storage, STORAGE_KEYS } from './services/storage';
import { generateAiStream } from './services/gemini';
import type { SearchHistoryItem, Note, Shortcut, ChatMessage } from './types';
import { ViewMode, Theme } from './types';


const themeConfigs = {
  [Theme.CLASSIC]: {
    bg: 'bg-slate-50',
    text: 'text-slate-900',
    subtext: 'text-slate-500',
    border: 'border-slate-200',
    panel: 'bg-white border border-slate-200 shadow-xl shadow-slate-200/50',
    dock: 'bg-white/90 border-slate-200 text-slate-500 shadow-2xl',
    dockActive: 'bg-indigo-600 text-white shadow-lg shadow-indigo-200',
    input: 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50',
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    accent: 'text-indigo-600',
    shortcut: 'bg-white hover:bg-indigo-50 border-slate-200 hover:border-indigo-200',
  },
  [Theme.DARK]: {
    bg: 'bg-[#050505]',
    text: 'text-slate-100',
    subtext: 'text-slate-500',
    border: 'border-slate-800',
    panel: 'bg-[#0f0f12] border border-slate-800 shadow-2xl',
    dock: 'bg-[#0f0f12]/90 border-slate-800 text-slate-500 shadow-2xl',
    dockActive: 'bg-slate-100 text-slate-950',
    input: 'bg-[#16161a] border-slate-800 text-slate-100 focus:border-slate-500',
    primary: 'bg-slate-100 hover:bg-slate-200 text-slate-950',
    accent: 'text-slate-100',
    shortcut: 'bg-[#0f0f12] hover:bg-slate-900 border-slate-800 hover:border-slate-700',
  },
  [Theme.COMET]: {
    bg: 'bg-[#020617]',
    text: 'text-slate-100',
    subtext: 'text-slate-400',
    border: 'border-white/10',
    panel: 'bg-slate-900/40 backdrop-blur-3xl border border-white/10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]',
    dock: 'bg-slate-900/60 backdrop-blur-3xl border-white/10 text-slate-400 shadow-2xl',
    dockActive: 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20',
    input: 'bg-white/5 border-white/10 text-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10',
    primary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20',
    accent: 'text-indigo-400',
    shortcut: 'bg-slate-900/40 hover:bg-white/10 border-white/10 hover:border-indigo-500/40',
  }
};

const Dock: React.FC<{ 
  currentView: ViewMode; 
  setView: (v: ViewMode) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
}> = ({ currentView, setView, theme, setTheme }) => {
  const cfg = themeConfigs[theme];
  const items = [
    { mode: ViewMode.HOME, icon: HomeIcon, label: 'Home' },
    { mode: ViewMode.AI_CHAT, icon: MessageSquare, label: 'AI Chat' },
    { mode: ViewMode.NOTES, icon: StickyNote, label: 'Notes' },
    { mode: ViewMode.HISTORY, icon: HistoryIcon, label: 'History' },
    { mode: ViewMode.SHORTCUTS, icon: Bookmark, label: 'Links' },
  ];

  return (
    <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 ${cfg.dock} rounded-xl border backdrop-blur-xl transition-all duration-500 animate-in slide-in-from-bottom-8 duration-700`}>
      {items.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          onClick={() => setView(mode)}
          title={label}
          className={`group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${currentView === mode ? cfg.dockActive : 'hover:bg-white/10 hover:scale-110'}`}
        >
          <Icon className="w-5 h-5" />
          <span className={`absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none`}>
            {label}
          </span>
        </button>
      ))}
      <div className={`w-px h-6 mx-1 ${theme === Theme.CLASSIC ? 'bg-slate-200' : 'bg-white/10'}`} />
      <button 
        onClick={() => {
          if (theme === Theme.COMET) setTheme(Theme.DARK);
          else if (theme === Theme.DARK) setTheme(Theme.CLASSIC);
          else setTheme(Theme.COMET);
        }}
        className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all hover:bg-white/10 hover:scale-110 ${cfg.subtext} hover:text-current`}
      >
        {theme === Theme.COMET && <Rocket className="w-5 h-5" />}
        {theme === Theme.DARK && <Moon className="w-5 h-5" />}
        {theme === Theme.CLASSIC && <Sun className="w-5 h-5" />}
      </button>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState<ViewMode>(ViewMode.HOME);
  const [theme, setTheme] = useState<Theme>(Theme.COMET);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [searchValue, setSearchValue] = useState("");

  const [_, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [tempUsername, setTempUsername] = useState("");

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const [scName, setScName] = useState("");
  const [scUrl, setScUrl] = useState("");
  const [editingSc, setEditingSc] = useState<Shortcut | null>(null);

  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const data = localStorage.getItem("username")
    if(!data) {
      setIsLoggedIn(false)
    } else {
      setIsLoggedIn(true)
    }
  }, [])

  useEffect(() => {
    setHistory(storage.get<SearchHistoryItem[]>(STORAGE_KEYS.HISTORY) || []);
    setNotes(storage.get<Note[]>(STORAGE_KEYS.NOTES) || []);
    setShortcuts(storage.get<Shortcut[]>(STORAGE_KEYS.SHORTCUTS) || []);
    setTheme(storage.get<Theme>(STORAGE_KEYS.THEME) || Theme.COMET);
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    storage.set(STORAGE_KEYS.THEME, newTheme);
  };


  const handleNameSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (tempUsername.trim()) {
      const name = tempUsername.trim();
      setUsername(name);
      storage.set(STORAGE_KEYS.USERNAME, name);
    }
  };

  const handleSearch = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      const query = searchValue.trim();
      const newHistory = [{ query, time: Date.now() }, ...history].slice(0, 50);
      setHistory(newHistory);
      storage.set(STORAGE_KEYS.HISTORY, newHistory);
      window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
      setSearchValue("");
    }
  }, [searchValue, history]);

  const sendAiMessage = async () => {
    if (!aiInput.trim() || isAiLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: aiInput };
    const updatedMsgs = [...chatMessages, userMsg];
    setChatMessages([...updatedMsgs, { role: 'assistant', content: '' }]);
    setAiInput("");
    setIsAiLoading(true);

    try {
      let currentAiText = "";
      await generateAiStream(updatedMsgs, (chunk) => {
        currentAiText += chunk;
        setChatMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1] = { role: 'assistant', content: currentAiText };
          return newMsgs;
        });
      });
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Lost contact with neural node. Check your connection." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const saveNote = () => {
    if (!noteTitle.trim() && !noteContent.trim()) return;
    if (editingNoteId) {
      const updatedNotes = notes.map(n => n.id === editingNoteId ? { ...n, title: noteTitle, content: noteContent, time: Date.now() } : n);
      setNotes(updatedNotes);
      storage.set(STORAGE_KEYS.NOTES, updatedNotes);
      setEditingNoteId(null);
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        title: noteTitle.trim() || "Entry " + (notes.length + 1),
        content: noteContent,
        time: Date.now()
      };
      const newNotes = [newNote, ...notes];
      setNotes(newNotes);
      storage.set(STORAGE_KEYS.NOTES, newNotes);
    }
    setNoteTitle("");
    setNoteContent("");
  };
  const startEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
  };
  const clearHistory = () => {
    setHistory([]);
    storage.set(STORAGE_KEYS.HISTORY, []);
  };

  const deleteNote = (id: string) => {
    setRemovingIds(prev => new Set(prev).add(id));
    setTimeout(() => {
      setNotes(prev => {
        const next = prev.filter(n => n.id !== id);
        storage.set(STORAGE_KEYS.NOTES, next);
        return next;
      });
      setRemovingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);
  };

  const handleShortcut = () => {
    if (!scName.trim() || !scUrl.trim()) return;
    let url = scUrl.trim();
    if (!url.startsWith('http')) url = `https://${url}`;
    if (editingSc) {
      const updated = shortcuts.map(s => s.id === editingSc.id ? { ...s, name: scName, url, favicon: `https://www.google.com/s2/favicons?domain=${url}&sz=64` } : s);
      setShortcuts(updated);
      storage.set(STORAGE_KEYS.SHORTCUTS, updated);
      setEditingSc(null);
    } else {
      const newSc: Shortcut = { id: Date.now().toString(), name: scName, url, favicon: `https://www.google.com/s2/favicons?domain=${url}&sz=64` };
      const newList = [...shortcuts, newSc];
      setShortcuts(newList);
      storage.set(STORAGE_KEYS.SHORTCUTS, newList);
    }
    setScName("");
    setScUrl("");
    setView(ViewMode.HOME);
  };

  const deleteShortcut = (id: string) => {
    setRemovingIds(prev => new Set(prev).add(id));
    setTimeout(() => {
      setShortcuts(prev => {
        const next = prev.filter(s => s.id !== id);
        storage.set(STORAGE_KEYS.SHORTCUTS, next);
        return next;
      });
      setRemovingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);
  };

  const cfg = themeConfigs[theme];

if (!username) {
    return (
      <div className={`min-h-screen relative font-['Inter'] transition-colors duration-700 antialiased flex items-center justify-center overflow-hidden`}>
        {theme === Theme.COMET && (
          <div className="fixed inset-0 pointer-events-none z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>
        )}
        <div className={`relative z-10 w-full max-w-md p-10 rounded-xl shadow-2xl animate-in zoom-in-95 duration-700 text-center space-y-8`}>
          <div className="space-y-4">
            <div className={`w-16 h-16 ${cfg.primary} rounded-xl flex items-center justify-center mx-auto shadow-2xl`}>
              <User className="text-white w-8 h-8" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase">COMET OS</h1>
            <p className={`${cfg.subtext} font-bold tracking-widest text-xs uppercase opacity-60`}>System Initializing</p>
          </div>
          <form onSubmit={handleNameSubmit} className="space-y-6">
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Identity Tag</label>
              <input 
                autoFocus
                value={tempUsername}
                onChange={(e) => setTempUsername(e.target.value)}
                placeholder="Enter your name"
                className={`w-full ${cfg.input} border rounded-xl px-6 py-5 outline-none font-bold text-lg transition-all`}
              />
            </div>
            <button 
              type="submit"
              disabled={!tempUsername.trim()}
              className={`w-full py-5 ${cfg.primary} disabled:opacity-30 font-black uppercase tracking-widest rounded-xl transition-all shadow-2xl active:scale-95 text-lg flex items-center justify-center gap-3`}
            >
              Initialize Node <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`min-h-screen relative font-['Inter'] ${cfg.bg} ${cfg.text} transition-colors duration-700 antialiased pb-32`}>
      
      {theme === Theme.COMET && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
      )}

      <Dock currentView={view} setView={setView} theme={theme} setTheme={handleThemeChange} />

      <main className="relative z-10 pt-20 px-6 max-w-6xl mx-auto flex flex-col min-h-[80vh] animate-in fade-in duration-700">
        
        {view === ViewMode.HOME && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-16 py-10">
            <div className="text-center space-y-6">
              <div className="relative inline-block">
                <h1 className={`text-[10rem] font-black leading-none tracking-tighter ${theme === Theme.COMET ? 'bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent' : cfg.text} select-none animate-in zoom-in-75 duration-1000`}>
                  I'VELOVED.xyz
                </h1>
                <div className={`absolute -bottom-2 right-0 px-3 py-1 ${cfg.primary} text-[10px] font-black uppercase tracking-[0.3em] rounded-lg shadow-xl`}>
                  Lite v2
                </div>
              </div>
              <p className={`${cfg.subtext} font-bold tracking-[0.4em] uppercase text-[11px] opacity-60`}>How are you, Guest?</p>
            </div>

            <div className="w-full max-w-2xl relative group">
              {theme === Theme.COMET && (
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-2xl blur-md opacity-20 group-focus-within:opacity-40 transition duration-500"></div>
              )}
              <div className={`relative flex items-center ${cfg.panel} rounded-xl overflow-hidden px-8 py-2 transition-all duration-300 hover:scale-[1.01]`}>
                <Search className={`${cfg.subtext} w-6 h-6 mr-5 opacity-40`} />
                <input 
                  type="text" 
                  autoFocus
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={handleSearch}
                  placeholder="Ask anything or search the web..."
                  className="w-full h-16 bg-transparent text-xl font-medium outline-none placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="w-full max-w-4xl">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6 w-full px-4">
                {shortcuts.map(sc => (
                  <div key={sc.id} className={`relative group transition-all duration-500 ${removingIds.has(sc.id) ? 'scale-0 opacity-0 -translate-y-10' : 'scale-100 opacity-100'}`}>
                    <a 
                      href={sc.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`flex flex-col items-center gap-4 p-5 ${cfg.panel} ${cfg.shortcut} rounded-xl transition-all duration-300 group-hover:-translate-y-2`}
                    >
                      <div className={`w-14 h-14 flex items-center justify-center ${theme === Theme.CLASSIC ? 'bg-slate-50' : 'bg-slate-800/50'} rounded-xl border ${cfg.border} overflow-hidden`}>
                        <img src={sc.favicon} alt="" className="w-7 h-7" onError={(e) => (e.currentTarget.src = "https://www.google.com/s2/favicons?domain=google.com&sz=64")} />
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-tight ${cfg.subtext} truncate w-full text-center group-hover:text-current`}>{sc.name}</span>
                    </a>
                    <button 
                      onClick={(e) => { e.preventDefault(); deleteShortcut(sc.id); }}
                      className="absolute -top-3 -right-3 p-2 bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:scale-110 active:scale-90"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => setView(ViewMode.SHORTCUTS)}
                  className={`flex flex-col items-center justify-center gap-4 p-5 ${cfg.panel} rounded-xl opacity-40 hover:opacity-100 hover:border-dashed border-2 border-indigo-500 transition-all hover:-translate-y-2`}
                >
                  <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                    <Plus className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Link</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {view === ViewMode.AI_CHAT && (
          <div className={`flex-1 flex flex-col ${cfg.panel} rounded-xl overflow-hidden max-w-4xl mx-auto w-full animate-in slide-in-from-bottom-4 duration-500`}>
            <div className={`px-10 py-8 border-b ${cfg.border} flex items-center justify-between ${theme === Theme.CLASSIC ? 'bg-slate-50' : 'bg-white/5'}`}>
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-xl ${cfg.primary} flex items-center justify-center shadow-xl`}>
                  <Sparkles className="text-white w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tighter">Neural Engine</h2>
                  <p className="text-[10px] font-bold tracking-[0.2em] opacity-40 uppercase">Awaiting instruction</p>
                </div>
              </div>
              <button onClick={() => setChatMessages([])} className={`${cfg.subtext} hover:text-red-500 transition-colors p-3 bg-white/5 rounded-xl`}>
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8 min-h-[50vh]">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-6">
                  <div className="p-10 rounded-full border-2 border-dashed border-current">
                    <MessageSquare className="w-16 h-16" />
                  </div>
                  <p className="text-xl font-black uppercase tracking-widest">Logic Stream Offline</p>
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                    <div className={`max-w-[85%] px-8 py-5 rounded-xl text-base leading-relaxed ${
                      msg.role === 'user' ? 'bg-indigo-600 text-white' : (theme === Theme.CLASSIC ? 'bg-slate-100 text-slate-900 border' : 'bg-white/10 text-slate-100 border border-white/5')
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content || (isAiLoading && i === chatMessages.length - 1 ? 'Reasoning...' : '')}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className={`p-10 border-t ${cfg.border} bg-black/10`}>
              <div className="flex gap-4 items-center">
                <input 
                  type="text" 
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendAiMessage()}
                  placeholder="Query the module..."
                  className={`flex-1 ${cfg.input} border rounded-xl px-8 py-5 outline-none text-lg transition-all`}
                />
                <button 
                  onClick={sendAiMessage}
                  disabled={isAiLoading || !aiInput.trim()}
                  className={`w-16 h-16 ${cfg.primary} disabled:opacity-50 rounded-xl flex items-center justify-center shadow-2xl active:scale-95 transition-all`}
                >
                  {isAiLoading ? <Loader2 className="w-7 h-7 animate-spin" /> : <Send className="w-7 h-7" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {view === ViewMode.NOTES && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in slide-in-from-bottom-4 duration-500">
            <div className={`lg:col-span-5 ${cfg.panel} p-10 rounded-xl flex flex-col gap-8 self-start sticky top-24`}>
              <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-4">
                <PlusCircle className={cfg.accent} />
                {editingNoteId ? 'Update Note' : 'New Note'}
              </h2>
              <div className="space-y-5">
                <input 
                  value={noteTitle}
                  onChange={e => setNoteTitle(e.target.value)}
                  placeholder="Note Headline"
                  className={`w-full ${cfg.input} border rounded-xl px-6 py-4 outline-none font-bold text-lg`}
                />
                <textarea 
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  placeholder="Record your data here..."
                  className={`w-full ${cfg.input} border rounded-xl px-6 py-4 h-64 outline-none resize-none leading-relaxed text-base`}
                />
                <div className="flex gap-3">
                  <button 
                    onClick={saveNote}
                    className={`flex-1 py-5 ${cfg.primary} font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95`}
                  >
                    <Save className="w-5 h-5" />
                    {editingNoteId ? 'Commit' : 'Store'}
                  </button>
                  {editingNoteId && (
                    <button 
                      onClick={() => { setEditingNoteId(null); setNoteTitle(""); setNoteContent(""); }}
                      className={`px-6 py-5 rounded-xl font-bold ${theme === Theme.CLASSIC ? 'bg-slate-200 text-slate-600' : 'bg-white/10 text-slate-400'} active:scale-90 transition-all`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-7 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className={`text-xs font-black ${cfg.subtext} tracking-[0.4em] uppercase`}>Vault ({notes.length})</h2>
              </div>
              {notes.length === 0 ? (
                <div className="py-40 text-center opacity-10 flex flex-col items-center gap-8">
                  <StickyNote className="w-20 h-20" />
                  <p className="text-2xl font-black uppercase tracking-widest">Vault Empty</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {notes.map(note => (
                    <div 
                      key={note.id} 
                      className={`${cfg.panel} p-8 rounded-xl group relative flex flex-col gap-6 transition-all duration-300 ${removingIds.has(note.id) ? 'scale-0 opacity-0 translate-y-10' : 'scale-100 opacity-100 translate-y-0'}`}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className={`font-black uppercase text-base leading-none ${cfg.accent} truncate pr-16`}>{note.title}</h3>
                        <div className="flex gap-1 absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                          <button 
                            onClick={() => startEditNote(note)}
                            className={`p-3 bg-white/5 hover:bg-indigo-500/20 rounded-xl transition-all ${cfg.subtext} hover:text-indigo-500`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteNote(note.id)}
                            className="p-3 bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className={`text-sm leading-relaxed ${cfg.subtext} font-medium line-clamp-6 opacity-80`}>{note.content}</p>
                      <div className="mt-auto pt-4 border-t border-white/5">
                        <span className={`text-[10px] uppercase tracking-[0.2em] font-black opacity-30`}>{new Date(note.time).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {view === ViewMode.HISTORY && (
          <div className={`${cfg.panel} rounded-xl overflow-hidden max-w-4xl mx-auto w-full animate-in slide-in-from-bottom-4 duration-500`}>
            <div className={`px-10 py-10 border-b ${cfg.border} flex items-center justify-between ${theme === Theme.CLASSIC ? 'bg-slate-50' : 'bg-white/5'}`}>
              <div className="flex items-center gap-5">
                <HistoryIcon className={`w-8 h-8 ${cfg.accent}`} />
                <div>
                   <h2 className="text-2xl font-black uppercase tracking-tighter">Query Log</h2>
                   <p className="text-[10px] font-bold tracking-[0.2em] opacity-40 uppercase">Search history archive</p>
                </div>
              </div>
              {history.length > 0 && (
                <button onClick={clearHistory} className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 px-6 py-3 rounded-xl border border-red-500/20 transition-all">
                  Flush Records
                </button>
              )}
            </div>
            <div className="p-6 space-y-2 max-h-[60vh] overflow-y-auto">
              {history.length === 0 ? (
                <div className="py-40 text-center opacity-10 flex flex-col items-center gap-10">
                  <HistoryIcon className="w-20 h-20" />
                  <p className="text-2xl font-black uppercase tracking-widest">No Log Entries</p>
                </div>
              ) : (
                history.map((item, i) => (
                  <div key={i} className={`flex items-center justify-between p-6 rounded-xl group transition-all duration-300 hover:bg-white/5`}>
                    <div className="flex items-center gap-6 flex-1">
                      <div className={`w-12 h-12 flex items-center justify-center rounded-xl bg-indigo-500/5 text-indigo-500 opacity-50`}>
                         <Search className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-lg font-bold tracking-tight">{item.query}</span>
                        <span className={`text-[10px] ${cfg.subtext} font-black uppercase tracking-widest opacity-40`}>{new Date(item.time).toLocaleTimeString()} • {new Date(item.time).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                      <button 
                        onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(item.query)}`, '_blank')}
                        className={`p-4 bg-indigo-500 text-white rounded-xl shadow-xl hover:scale-105 active:scale-90 transition-all`}
                      >
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {view === ViewMode.SHORTCUTS && (
          <div className={`${cfg.panel} p-12 rounded-xl max-w-2xl mx-auto w-full space-y-10 animate-in zoom-in-95 duration-500`}>
            <div className="flex items-center gap-4">
               <Bookmark className={`w-8 h-8 ${cfg.accent}`} />
               <h2 className="text-3xl font-black tracking-tighter uppercase">Link Creator</h2>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Alias Name</label>
                <input 
                  value={scName}
                  onChange={e => setScName(e.target.value)}
                  placeholder="e.g. Workspace"
                  className={`w-full ${cfg.input} border rounded-xl px-6 py-5 outline-none font-bold text-lg`}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Protocol Address (URL)</label>
                <input 
                  value={scUrl}
                  onChange={e => setScUrl(e.target.value)}
                  placeholder="domain.tld"
                  className={`w-full ${cfg.input} border rounded-xl px-6 py-5 outline-none text-lg`}
                />
              </div>
              <div className="flex gap-4 pt-6">
                <button 
                  onClick={handleShortcut}
                  className={`flex-1 py-5 ${cfg.primary} font-black uppercase tracking-widest rounded-xl transition-all shadow-2xl active:scale-95 text-lg`}
                >
                  Link Node
                </button>
                <button 
                  onClick={() => { setEditingSc(null); setScName(""); setScUrl(""); setView(ViewMode.HOME); }}
                  className={`px-8 py-5 rounded-xl font-bold bg-white/5 active:scale-90 transition-all`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 inset-x-0 h-10 flex items-center justify-center pointer-events-none opacity-20 z-0">
        <p className="text-[9px] font-black tracking-[0.5em] uppercase">
          TOPRAK XYZ • L4TSD01T • {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}