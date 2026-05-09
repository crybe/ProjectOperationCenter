import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, RefreshCw, Clock, Shield, Sprout, Cpu, Info } from 'lucide-react';
import { StatusBadge } from '../components/ui';

interface MemoryGem {
  id: string;
  timestamp: string;
  date: string;
  time: string;
  title: string;
  content: string;
  category: 'system' | 'grow' | 'ki' | 'security' | 'info';
  importance: number;
}

const CAT_ICONS: any = {
  system: Cpu,
  grow: Sprout,
  ki: Brain,
  security: Shield,
  info: Info
};

const CAT_COLORS: any = {
  system: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
  grow: 'text-emerald-400 border-emerald-600/20 bg-emerald-600/5',
  ki: 'text-purple-400 border-purple-500/20 bg-purple-500/5',
  security: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
  info: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5'
};

export function SystemMemory({ apiFetch, toast }: any) {
  const [memories, setMemories] = useState<MemoryGem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const load = async () => {
    try {
      const data = await apiFetch('/api/ki/memory');
      if (Array.isArray(data)) setMemories(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await apiFetch('/api/ki/memory/scan', { method: 'POST' });
      if (res.ok) {
        toast('success', `${res.added} neue Erinnerungen destilliert`);
        load();
      } else {
        toast('error', res.error || 'Scan fehlgeschlagen');
      }
    } catch (e: any) {
      toast('error', e.message);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4 p-6 glass-panel rounded-3xl border-flow">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Brain className="w-6 h-6 glow-purple" />
          </div>
          <div>
            <h3 className="text-lg font-black text-emerald-500 tracking-tight uppercase">System Memory</h3>
            <p className="text-[10px] text-emerald-900/70 font-black uppercase tracking-[0.2em] mt-1">Destillierte KI-Langzeit-Insights</p>
          </div>
        </div>
        <button 
          onClick={handleScan} 
          disabled={scanning}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all
            ${scanning ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-500/10 border-purple-500/30 text-purple-400 hover:glow-purple'}`}
        >
          {scanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {scanning ? 'Destilliere...' : 'Logs scannen'}
        </button>
      </div>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="text-center py-12 text-emerald-900 font-mono animate-pulse">Lade Gedächtnis...</div>
        ) : memories.length === 0 ? (
          <div className="text-center py-12 text-emerald-900 font-mono italic">Noch keine Erinnerungen vorhanden. Starte einen Scan!</div>
        ) : (
          memories.map((m, i) => {
            const Icon = CAT_ICONS[m.category] || Info;
            return (
              <div key={m.id || i} className="group relative flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-6 glass-card rounded-2xl border-l-4 border-l-transparent hover:border-l-purple-500 transition-all animate-fade-in">
                <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center border-b sm:border-b-0 sm:border-r border-emerald-900/20 pb-3 sm:pb-0 sm:pr-6 min-w-0 sm:min-w-[80px]">
                   <span className="text-[10px] font-black text-emerald-900 uppercase">{m.date.split('-').slice(1).join('.')}</span>
                   <span className="text-sm sm:text-lg font-black text-emerald-500 font-mono tracking-tighter">{m.time}</span>
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-widest ${CAT_COLORS[m.category]}`}>
                      <Icon className="w-3 h-3" />
                      {m.category}
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, idx) => (
                        <div key={idx} className={`w-1 h-3 rounded-full ${idx < m.importance ? 'bg-purple-500 glow-purple' : 'bg-gray-800'}`} />
                      ))}
                    </div>
                  </div>
                  <h4 className="text-sm font-black text-emerald-500 tracking-tight">{m.title}</h4>
                  <p className="text-xs text-emerald-400 leading-relaxed italic">"{m.content}"</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
