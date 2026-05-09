import React, { useEffect, useState } from 'react';
import { Box, Play, Square, RotateCw, Search, RefreshCcw } from 'lucide-react';
import { useApi } from '../hooks/useApi';

interface Container {
  name: string;
  status: string;
  state: 'running' | 'exited' | 'paused' | 'restarting' | 'created';
  image: string;
}

const MobileServices: React.FC = () => {
  const apiFetch = useApi();
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/sentinel/containers');
      setContainers(data || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [apiFetch]);

  const handleAction = async (name: string, action: 'start' | 'stop' | 'restart') => {
    setActionLoading(`${name}-${action}`);
    try {
      await apiFetch(`/api/container/${name}/${action}`, { method: 'POST' });
      await fetchData();
    } catch (err) {
      alert(`Fehler bei ${action}: ${err}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = containers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Container suchen..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:border-emerald-500 outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={fetchData}
          className="p-3 bg-white/5 border border-white/10 rounded-xl active:bg-white/10 transition-colors"
        >
          <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="space-y-3">
        {loading && containers.length === 0 ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Keine Container gefunden.</div>
        ) : (
          filtered.map(c => (
            <div key={c.name} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${c.state === 'running' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    <Box size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-none">{c.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{c.image.split('@')[0]}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    c.state === 'running' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {c.state}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => handleAction(c.name, 'start')}
                  disabled={c.state === 'running' || actionLoading === `${c.name}-start`}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 disabled:opacity-30 transition-all active:scale-95"
                >
                  <Play size={16} /> <span className="text-xs font-bold uppercase">Start</span>
                </button>
                <button 
                  onClick={() => handleAction(c.name, 'stop')}
                  disabled={c.state !== 'running' || actionLoading === `${c.name}-stop`}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 disabled:opacity-30 transition-all active:scale-95"
                >
                  <Square size={16} /> <span className="text-xs font-bold uppercase">Stop</span>
                </button>
                <button 
                  onClick={() => handleAction(c.name, 'restart')}
                  disabled={actionLoading === `${c.name}-restart`}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-cyan-500/20 disabled:opacity-30 transition-all active:scale-95"
                >
                  <RotateCw size={16} className={actionLoading === `${c.name}-restart` ? 'animate-spin' : ''} /> 
                  <span className="text-xs font-bold uppercase">Reset</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MobileServices;
