import React, { useEffect, useState } from 'react';
import { Workflow, ExternalLink, Play, Clock, AlertCircle, Edit3, List } from 'lucide-react';
import { useApi } from '../hooks/useApi';

interface n8nLink {
  label: string;
  url: string;
}

interface MobileWorkflowsProps {
  onToggleNav?: (hide: boolean) => void;
}

const MobileWorkflows: React.FC<MobileWorkflowsProps> = ({ onToggleNav }) => {
  const apiFetch = useApi();
  const [links, setLinks] = useState<n8nLink[]>([]);
  const [baseUrl, setBaseUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'editor'>('list');

  const switchView = (newView: 'list' | 'editor') => {
    setView(newView);
    if (onToggleNav) onToggleNav(newView === 'editor');
  };

  useEffect(() => {
    apiFetch('/api/n8n-links')
      .then(data => {
        setLinks(data.links || []);
        setBaseUrl(data.base_url || '');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [apiFetch]);

  if (loading) {
    return <div className="p-8 text-center animate-pulse">Lade n8n...</div>;
  }

  if (view === 'editor') {
    return (
      <div className="flex flex-col h-full bg-black">
        <div className="p-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
          <button 
            onClick={() => switchView('list')}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
          >
            <List size={18} /> Zurück zur Liste
          </button>
          <span className="text-xs font-bold text-red-400 uppercase tracking-widest">n8n Editor</span>
          <a href={baseUrl} target="_blank" rel="noopener noreferrer" className="p-1">
            <ExternalLink size={16} className="text-gray-500" />
          </a>
        </div>
        <div className="flex-1 bg-black">
          <iframe 
            src={baseUrl} 
            className="w-full h-full border-none" 
            title="n8n Editor"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="bg-gradient-to-br from-red-500/20 to-orange-500/10 border border-red-500/20 rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500 rounded-2xl shadow-lg shadow-red-500/40">
              <Workflow size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">n8n Central</h2>
              <p className="text-sm text-gray-400">Workflows & Automatisierung</p>
            </div>
          </div>
        </div>

        <button 
          onClick={() => switchView('editor')}
          className="w-full mt-2 bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all"
        >
          <Edit3 size={20} /> Workflow Editor öffnen
        </button>
      </div>

      <div className="grid gap-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Quick Links</h3>
        {links.map((link, idx) => (
          <a 
            key={idx}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all active:scale-95"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                {link.label === 'Editor' ? <Play size={18} className="text-emerald-400" /> : <Clock size={18} className="text-cyan-400" />}
              </div>
              <span className="font-semibold text-lg">{link.label}</span>
            </div>
            <ExternalLink size={20} className="text-gray-500" />
          </a>
        ))}
      </div>

      <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-4 flex gap-3 items-start">
        <AlertCircle size={20} className="text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-bold text-cyan-300 uppercase">Pro-Tipp</p>
          <p className="text-[11px] text-cyan-200 leading-relaxed">
            Im Editor kannst du Workflows direkt am Handy erstellen oder anpassen. Für komplexe Node-Verbindungen empfiehlt sich das Querformat.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileWorkflows;
