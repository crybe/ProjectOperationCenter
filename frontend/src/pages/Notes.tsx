import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import { Plus, Trash2, Clock, Check, Pencil, Search, Pin, Copy, Info, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import mascotAerith from '../assets/mascot_aerith.png';

interface Note {
  id: string;
  text: string;
  color: string;
  pinned?: boolean;
  created_at: string;
  updated_at?: string;
}

// Simple Markdown-Lite Renderer
function MarkdownLite({ text }: { text: string }) {
  // Regex to detect code blocks, bold, lists
  const lines = text.split('\n');
  const rendered = lines.map((line, i) => {
    // Code block detection (starts with ` or is indented)
    if (line.startsWith('`') && line.endsWith('`')) {
      return <code key={i} className="bg-black/40 px-1.5 py-0.5 rounded text-emerald-400 font-mono text-[11px] border border-emerald-900/20">{line.replace(/`/g, '')}</code>;
    }
    // List detection
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      return <div key={i} className="flex gap-2 items-start text-emerald-500/80"><span className="text-emerald-500">•</span> {line.trim().substring(2)}</div>;
    }
    // Bold detection
    let processed = line;
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = boldRegex.exec(line)) !== null) {
      parts.push(line.substring(lastIndex, match.index));
      parts.push(<strong key={match.index} className="text-emerald-600 font-black">{match[1]}</strong>);
      lastIndex = boldRegex.lastIndex;
    }
    parts.push(line.substring(lastIndex));

    return <div key={i} className="min-h-[1.2em]">{parts.length > 1 ? parts : line}</div>;
  });

  return <div className="space-y-1">{rendered}</div>;
}

function NoteCard({ note, onDelete, onUpdate }: {
  note: Note;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Note>) => void;
}) {
  const apiFetch = useApi();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note.text);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const autosave = (val: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSaveState('saving');
    timerRef.current = setTimeout(async () => {
      try {
        await apiFetch(`/api/notes/${note.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: val }),
        });
        onUpdate(note.id, { text: val });
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2000);
      } catch {
        setSaveState('error');
      }
    }, 800);
  };

  const togglePin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newPinned = !note.pinned;
    try {
      await apiFetch(`/api/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: newPinned }),
      });
      onUpdate(note.id, { pinned: newPinned });
    } catch {}
  };

  const copyToClipboard = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(note.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleChange = (val: string) => {
    setText(val);
    autosave(val);
  };

  const statusLabel = { saving: 'Speichere…', saved: '✓ Gespeichert', error: '✗ Fehler', idle: '' }[saveState];
  const statusColor = { saving: 'text-amber-500', saved: 'text-emerald-500', error: 'text-emerald-500', idle: '' }[saveState];

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-black/40 border ${note.pinned ? 'border-emerald-600/30 shadow-[0_0_20px_rgba(225,29,72,0.1)]' : 'border-emerald-900/20'} rounded-[2rem] p-8 flex flex-col gap-6 hover:bg-black/60 transition-all group relative overflow-hidden reactive-border shadow-2xl`}
    >
      <div className="absolute inset-0 scan-overlay opacity-5 pointer-events-none" />
      <img src={mascotAerith} className="mascot-ornament" style={{ width: '120px', opacity: '0.05' }} alt="Mascot Ornament" />
      <div className={`absolute top-0 left-0 w-1.5 h-full ${note.pinned ? 'bg-emerald-500' : 'bg-emerald-600/20'} group-hover:bg-emerald-600/60 transition-colors`} />

      {editing ? (
        <div className="space-y-4 relative z-10">
          <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest pl-3">
            <span className="text-emerald-500 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Edit_Session</span>
            <span className={statusColor}>{statusLabel}</span>
          </div>
          <textarea
            className="w-full bg-black/40 border border-emerald-600/20 rounded-2xl p-6 text-sm text-emerald-500 placeholder:text-emerald-950 focus:outline-none focus:border-emerald-600/50 resize-none font-mono leading-relaxed shadow-inner"
            rows={8}
            value={text}
            onChange={e => handleChange(e.target.value)}
            autoFocus
          />
          <button
            onClick={() => setEditing(false)}
            className="w-full flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-black bg-emerald-600 hover:bg-emerald-500 transition-all py-4 rounded-xl shadow-lg shadow-emerald-600/20"
          >
            <Check className="w-4 h-4" /> Commit_Changes
          </button>
        </div>
      ) : (
        <div className="flex flex-col flex-1 relative z-10">
          <div className="flex items-center justify-between pl-3 mb-6">
             <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-emerald-600/10 border border-emerald-600/20 holo-icon relative overflow-hidden ${note.pinned ? 'text-emerald-500' : 'text-emerald-900'}`}>
                   <div className="absolute inset-0 scan-overlay opacity-20" />
                   {note.pinned ? <Pin className="w-3.5 h-3.5 fill-emerald-500 relative z-10" /> : <BookOpen className="w-3.5 h-3.5 relative z-10" />}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 italic opacity-80">MISSION_ENTRY_{note.id.substring(0,4)}</span>
             </div>
             <div className="flex items-center gap-2">
                <button onClick={togglePin} className={`p-2 rounded-xl border transition-all ${note.pinned ? 'bg-emerald-600/20 border-emerald-600/40 text-emerald-500' : 'bg-black/40 border-emerald-900/20 text-emerald-900 hover:text-emerald-500 hover:border-emerald-600/40'}`}>
                  <Pin className={`w-4 h-4 ${note.pinned ? 'fill-emerald-500' : ''}`} />
                </button>
                <button onClick={copyToClipboard} className="p-2 rounded-xl bg-black/40 border border-emerald-900/20 text-emerald-900 hover:text-emerald-500 hover:border-emerald-600/40 transition-all">
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
             </div>
          </div>
          <div
            className="text-base text-emerald-400/90 leading-relaxed whitespace-pre-wrap flex-1 pl-3 cursor-text min-h-[80px] font-medium"
            onClick={() => setEditing(true)}
          >
            {text ? <MarkdownLite text={text} /> : <span className="text-emerald-900/40 italic text-sm font-black uppercase tracking-widest">[ Empty_Buffer ]</span>}
          </div>
          <div className="flex items-center justify-between pt-8 mt-6 border-t border-emerald-900/10 pl-3">
            <div className="flex items-center gap-3 text-[9px] text-emerald-900 font-black uppercase tracking-widest opacity-60">
              <Clock className="w-3 h-3" />
              {note.updated_at ? `MOD: ${note.updated_at}` : `GEN: ${note.created_at}`}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEditing(true)}
                className="p-2.5 rounded-xl bg-emerald-600/5 border border-emerald-600/10 text-emerald-900 hover:text-emerald-500 hover:border-emerald-600/40 transition-all"
                title="Bearbeiten"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(note.id)}
                className="p-2.5 rounded-xl bg-emerald-600/5 border border-emerald-600/10 text-emerald-900 hover:text-emerald-500 hover:border-emerald-600/40 transition-all"
                title="Löschen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function Notes() {
  const apiFetch = useApi();
  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch('/api/notes');
      if (Array.isArray(data)) setNotes(data);
    } catch {}
  }, [apiFetch]);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!input.trim()) return;
    setSaving(true);
    try {
      await apiFetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input.trim(), color: '#cc0000', pinned: false }),
      });
      setInput('');
      load();
    } catch {}
    finally { setSaving(false); }
  };

  const deleteNote = async (id: string) => {
    try {
      await apiFetch(`/api/notes/${id}`, { method: 'DELETE' });
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch {}
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const filteredNotes = useMemo(() => {
    let result = notes;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(n => n.text.toLowerCase().includes(q));
    }
    // Pinned notes first, then by updated_at/created_at
    return [...result].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0; // Keep existing order otherwise
    });
  }, [notes, search]);

  return (
    <div className="space-y-12 pb-48 animate-fade-in relative group/notes">
      <img src={mascotAerith} className="mascot-ornament" style={{ width: '400px', opacity: '0.08', position: 'fixed', bottom: '10%', right: '5%' }} alt="Mascot Watermark" />
      {/* Decorative background scanning line */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-10">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-emerald-600 animate-[scan-vertical_10s_linear_infinite]" />
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 relative z-10">
        <div className="space-y-4">
          <div className="flex items-center gap-6">
             <div className="p-4 rounded-3xl bg-emerald-600/10 border border-emerald-600/20 glow-emerald shadow-2xl holo-icon relative overflow-hidden group">
                <div className="absolute inset-0 scan-overlay opacity-30" />
                <BookOpen className="w-12 h-12 text-emerald-500 relative z-10 group-hover:scale-110 transition-transform duration-500" />
             </div>
             <div>
                <div className="flex items-center gap-2 mb-1">
                   <div className="h-[1px] w-8 bg-emerald-600/50" />
                   <span className="text-[8px] font-black text-emerald-900 uppercase tracking-[0.8em]">Knowledge_Node: KDX-STORAGE</span>
                </div>
                <h2 className="text-4xl sm:text-6xl font-black text-emerald-500 tracking-tighter uppercase italic flex items-center gap-4 drop-shadow-[0_0_20px_rgba(204,0,0,0.3)]">
                  Tactical<span className="text-emerald-600 font-outline-1">_Notes</span>
                </h2>
                <p className="text-[10px] text-emerald-900 font-black uppercase tracking-[0.6em] mt-3 opacity-70">Encrypted Mission Intelligence Repository</p>
             </div>
          </div>
        </div>
        
        {/* Suche */}
        <div className="relative group w-full md:w-80">
           <div className="absolute -inset-[1px] bg-gradient-to-r from-emerald-600/20 via-transparent to-emerald-600/20 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
           <div className="relative bg-black/40 border border-emerald-900/20 rounded-2xl flex items-center px-5 py-4 group-focus-within:border-emerald-600/40 transition-all shadow-2xl">
              <Search className="w-5 h-5 text-emerald-900 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                 type="text"
                 placeholder="Search Knowledge Base..."
                 value={search}
                 onChange={e => setSearch(e.target.value)}
                 className="w-full bg-transparent border-none focus:ring-0 text-sm text-emerald-500 placeholder:text-emerald-950 font-mono pl-4"
              />
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-600/5 border border-emerald-600/20 rounded-lg">
                 <span className="text-[9px] text-emerald-500 font-black uppercase">{notes.length}</span>
              </div>
           </div>
        </div>
      </div>

      {/* Neue Notiz - Refined Area */}
      <div className="relative group/new relative z-10">
        <div className="absolute -inset-[1px] bg-gradient-to-r from-emerald-600/30 via-transparent to-emerald-600/30 rounded-[2.5rem] opacity-0 group-focus-within/new:opacity-100 transition-opacity duration-700 blur-sm" />
        <div className="relative bg-black/40 border border-emerald-900/20 rounded-[2.5rem] p-10 space-y-8 group-focus-within/new:border-emerald-600/40 transition-all shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl reactive-border">
          <div className="absolute inset-0 scan-overlay opacity-5 pointer-events-none" />
          <img src={mascotAerith} className="mascot-ornament" style={{ width: '320px', opacity: '0.15' }} alt="Mascot Ornament" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
               <div className="status-dots">
                  <div className="status-dot active" />
                  <div className="status-dot" />
               </div>
               <div className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 italic">
                 New_Mission_Intelligence
               </div>
            </div>
            <div className="text-[9px] text-emerald-950 font-black uppercase tracking-[0.2em] opacity-40">Markdown_V1.2_Active</div>
          </div>
          <textarea
            className="w-full bg-black/20 border border-emerald-900/10 rounded-2xl p-8 text-lg text-emerald-500 placeholder:text-emerald-900/20 focus:outline-none focus:border-emerald-600/30 transition-all resize-none font-mono leading-relaxed relative z-10 shadow-inner min-h-[160px]"
            placeholder="Record neural observations, tactical directives or system findings…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') create();
            }}
          />
          <div className="flex items-center justify-between pt-6 border-t border-emerald-900/10 relative z-10">
            <span className="text-[9px] text-emerald-900 font-black uppercase tracking-widest opacity-40">
              [ CTRL + ENTER ] to commit
            </span>
            <button
              onClick={create}
              disabled={saving || !input.trim()}
              className="flex items-center gap-4 px-10 py-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-20 disabled:cursor-not-allowed text-black text-[11px] font-black uppercase tracking-[0.4em] rounded-2xl transition-all shadow-xl shadow-emerald-600/20 ml-auto group/btn relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform relative z-10" />
              <span className="relative z-10">{saving ? 'ENCRYPTING…' : 'COMMIT_DATA'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notizen-Grid */}
      <div className="space-y-4">
        {search.trim() && (
          <div className="text-[9px] text-emerald-900 font-black uppercase tracking-widest">
            Suchergebnisse für "{search}": {filteredNotes.length} gefunden
          </div>
        )}
        
        {filteredNotes.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-emerald-900/20 rounded-3xl">
            <div className="text-gray-800 font-black uppercase text-[10px] tracking-[0.5em] italic">
              {search ? 'Keine Treffer' : 'Keine Datensätze gefunden'}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredNotes.map(note => (
                <NoteCard key={note.id} note={note} onDelete={deleteNote} onUpdate={updateNote} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
