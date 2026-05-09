import { useEffect, useState, useCallback } from 'react';
import { 
  Server, Cpu, Activity, HardDrive, ShieldCheck, Power, RefreshCw, 
  Terminal, Box, Play, Square, RotateCw, Lock, Sparkles, MessageSquare,
  AlertTriangle, Plus, X, Filter, HeartPulse
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { SectionCard, Skeleton, StatusBadge, BackTrackLoading, CRTScreen } from '../components/ui';
import { useToast } from '../components/Toast';
import { motion } from 'framer-motion';



// ── Docker Manager Component ────────────────────────────────────────────────
function DockerManager({ containers, onAction, loading }: any) {
  const containerList = Array.isArray(containers) ? containers : [];
  
  return (
    <SectionCard title="Docker_Container_Orchestration" icon={Box}>
      <CRTScreen>
        <div className="p-4 overflow-x-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-emerald-900/70 border-b border-emerald-900/20 uppercase tracking-[0.2em] font-black text-[9px]">
                  <th className="pb-6 pl-4">Node_Identifier</th>
                  <th className="pb-6">Status</th>
                  <th className="pb-6">Telemetry (CPU/RAM)</th>
                  <th className="pb-6 text-right pr-4">Tactical_Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-900/10">
                {loading ? [...Array(4)].map((_, i) => (
                  <tr key={i}><td colSpan={4} className="py-6"><Skeleton className="h-12 w-full opacity-10" /></td></tr>
                )) : containerList.map((c: any) => (
                  <tr key={c.id} className="group hover:bg-emerald-600/[0.03] transition-all">
                    <td className="py-6 pl-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-emerald-500 uppercase tracking-tight group-hover:text-emerald-500 transition-colors">{c.name}</span>
                        <span className="text-[9px] text-emerald-900 font-black uppercase tracking-widest mt-1">{c.image}</span>
                      </div>
                    </td>
                    <td className="py-6">
                      <StatusBadge 
                        status={c.state === 'running' ? 'active' : 'inactive'} 
                        text={c.status?.includes('Up') ? 'OPERATIONAL' : 'OFFLINE'} 
                      />
                    </td>
                    <td className="py-6 font-hacker text-[11px] text-emerald-400">
                       <span className="text-emerald-900 font-black">CPU:</span> {c.cpu || '0%'} <span className="mx-2 text-emerald-900/30">|</span> <span className="text-emerald-900 font-black">RAM:</span> {c.mem || '0MB'}
                    </td>
                    <td className="py-6 text-right pr-4">
                      <div className="flex justify-end gap-3">
                        {c.state === 'running' ? (
                          <button onClick={() => onAction(c.name, 'stop')} className="p-3 rounded-xl glass-card bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-black transition-all border-none"><Square className="w-4 h-4" /></button>
                        ) : (
                          <button onClick={() => onAction(c.name, 'start')} className="p-3 rounded-xl glass-card bg-emerald-700/10 hover:bg-emerald-700 text-emerald-500 hover:text-black transition-all border-none"><Play className="w-4 h-4" /></button>
                        )}
                        <button onClick={() => onAction(c.name, 'restart')} className="p-3 rounded-xl glass-card bg-cyan-600/10 hover:bg-cyan-600 text-cyan-500 hover:text-black transition-all border-none"><RotateCw className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Grid View */}
          <div className="md:hidden space-y-4">
            {loading ? [...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full opacity-10" />
            )) : containerList.map((c: any) => (
              <div key={c.id} className="p-4 rounded-2xl bg-emerald-600/5 border border-emerald-900/10 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-emerald-500 uppercase tracking-tight">{c.name}</span>
                    <span className="text-[8px] text-emerald-900 font-black uppercase tracking-widest mt-0.5 truncate max-w-[150px]">{c.image}</span>
                  </div>
                  <StatusBadge 
                    status={c.state === 'running' ? 'active' : 'inactive'} 
                    text={c.status?.includes('Up') ? 'OPERATIONAL' : 'OFFLINE'} 
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-hacker text-emerald-400 bg-black/40 p-2 rounded-lg">
                   <div><span className="text-emerald-900 font-black uppercase mr-1">CPU</span>{c.cpu || '0%'}</div>
                   <div className="w-[1px] h-3 bg-emerald-900/30" />
                   <div><span className="text-emerald-900 font-black uppercase mr-1">RAM</span>{c.mem || '0MB'}</div>
                </div>
                <div className="flex gap-2">
                  {c.state === 'running' ? (
                    <button onClick={() => onAction(c.name, 'stop')} className="flex-1 py-2.5 rounded-xl bg-emerald-600/10 border border-emerald-600/20 text-emerald-500 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"><Square className="w-3 h-3" /> Stop</button>
                  ) : (
                    <button onClick={() => onAction(c.name, 'start')} className="flex-1 py-2.5 rounded-xl bg-emerald-700/10 border border-emerald-700/20 text-emerald-500 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"><Play className="w-3 h-3" /> Start</button>
                  )}
                  <button onClick={() => onAction(c.name, 'restart')} className="flex-1 py-2.5 rounded-xl bg-cyan-600/10 border border-cyan-600/20 text-cyan-500 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"><RotateCw className="w-3 h-3" /> Reset</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CRTScreen>
    </SectionCard>
  );
}

// ── P.I.G.E.O.N. ADVISORY (Strategic AI) ────────────────────────────────────
function PigeonAdvisory({ apiFetch }: { apiFetch: any }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getAnalysis = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiFetch('/api/sys/ai-summary');
      if (d?.ok) setSummary(d.summary);
    } finally { setLoading(false); }
  }, [apiFetch]);

  useEffect(() => { getAnalysis(); }, [getAnalysis]);

  return (
    <SectionCard title="P.I.G.E.O.N._ADVISORY" icon={Sparkles} accent={loading}>
       <div className="relative overflow-hidden bg-emerald-600/5 rounded-3xl p-10 border border-emerald-600/10 group">
          <div className="absolute inset-0 scanline-effect opacity-20 pointer-events-none" />
          <div className="relative z-10 space-y-6">
             <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 italic">
                <Activity className="w-4 h-4 animate-pulse" /> Strategic_Intelligence_Feed
             </div>
             <p className="text-xl font-black text-emerald-500 leading-relaxed tracking-tight font-hacker italic">
                "{summary || 'Initializing P.I.G.E.O.N. Protocol...'}"
             </p>
             <div className="flex justify-between items-center pt-4 border-t border-emerald-900/20">
                <button onClick={getAnalysis} className="text-[10px] text-emerald-900/70 font-black hover:text-emerald-500 transition-all flex items-center gap-2 uppercase tracking-widest">
                   <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Sync_Protocol
                </button>
                <div className="px-3 py-1 bg-emerald-600/10 rounded-lg text-[9px] text-emerald-500 font-black uppercase tracking-widest border border-emerald-600/20">Auth: P.I.G.E.O.N._V2</div>
             </div>
          </div>
       </div>
    </SectionCard>
  );
}

function StatTile({ label, value, unit, icon: Icon, color }: any) {
  const colors: any = {
    blue:    'text-cyan-500 border-cyan-500/20 bg-cyan-500/5',
    indigo:  'text-emerald-500 border-emerald-600/20 bg-emerald-600/5',
    purple:  'text-purple-500 border-purple-500/20 bg-purple-500/5',
    emerald: 'text-emerald-500 border-emerald-600/20 bg-emerald-600/5',
  };
  return (
    <div className="bg-black/30 border border-emerald-900/10 rounded-2xl p-5 flex items-center gap-5 relative overflow-hidden group shadow-xl">
      <div className="absolute inset-0 scan-overlay opacity-5 pointer-events-none" />
      <div className={`p-3 rounded-xl bg-emerald-600/5 border border-emerald-900/10 holo-icon relative overflow-hidden ${color}`}>
        <div className="absolute inset-0 scan-overlay opacity-10" />
        <Icon className="w-4 h-4 relative z-10 group-hover:scale-110 transition-transform duration-500" />
      </div>
      <div>
        <p className="text-tactical-label mb-1 opacity-40">{label}</p>
        <div className="flex items-baseline gap-2">
           <h4 className="text-3xl font-black text-emerald-500 tracking-tighter truncate drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
             {value ?? '--'}
           </h4>
           <span className="text-[10px] text-emerald-900 font-bold uppercase">{unit}</span>
        </div>
      </div>
    </div>
  );
}

// ── Guardian Healing Component ──────────────────────────────────────────────
function GuardianHealing({ healings }: { healings: any[] }) {
  return (
    <SectionCard title="Guardian_Auto_Healing" icon={HeartPulse}>
      <div className="space-y-4">
        <div className="p-6 glass-panel border border-emerald-500/10 bg-emerald-500/5 rounded-2xl mb-6">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Self-Healing Infrastructure Active</span>
          </div>
          <p className="text-[9px] text-emerald-900/60 leading-relaxed italic">
            P.I.G.E.O.N. überwacht Container-Instabilitäten und führt autonom notwendige Fixes durch.
          </p>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
          {healings.length === 0 ? (
            <p className="text-[10px] text-emerald-900/40 italic text-center py-8 uppercase">No healing events recorded</p>
          ) : (
            healings.map((h, i) => (
              <div key={i} className="p-4 glass-panel border-l-2 border-emerald-500/20 hover:border-emerald-500 transition-all bg-black/40">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[8px] font-mono text-emerald-900/40">{new Date(h.ts).toLocaleString()}</span>
                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${h.type === 'CONTAINER_CRASH_DETECTED' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    {h.type}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-200 font-bold tracking-tight">{h.details}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </SectionCard>
  );
}

// ── Backup Whitelist Manager ───────────────────────────────────────────────
function BackupWhitelist({ apiFetch }: { apiFetch: any }) {
  const [entries, setEntries] = useState<string[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [wl, bs] = await Promise.all([
      apiFetch('/api/storage/whitelist'),
      apiFetch('/api/storage/status'),
    ]);
    setEntries(Array.isArray(wl) ? wl : []);
    setLabels(bs?.error_labels || []);
    setLoading(false);
  }, [apiFetch]);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    const v = input.trim();
    if (!v) return;
    const r = await apiFetch('/api/storage/whitelist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entry: v }) });
    if (r.ok !== false) { setEntries(r.whitelist || []); setInput(''); }
  };

  const remove = async (entry: string) => {
    const r = await apiFetch(`/api/backup-whitelist/${encodeURIComponent(entry)}`, { method: 'DELETE' });
    if (r.ok !== false) setEntries(r.whitelist || []);
  };

  const unknownLabels = labels.filter(l => !entries.some(e => l.includes(e)));

  return (
    <SectionCard title="Backup_Error_Whitelist" icon={Filter}>
      <div className="p-6 space-y-6">
        {labels.length > 0 && (
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-emerald-900/60 mb-3">Letzter Backup – erkannte Fehler</p>
            <div className="flex flex-wrap gap-2">
              {labels.map(l => (
                <span key={l} className={`text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border ${
                  entries.some(e => l.includes(e))
                    ? 'bg-emerald-900/10 border-emerald-900/20 text-emerald-900/50 line-through'
                    : 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400'
                }`}>{l}</span>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-emerald-900/60 mb-3">Whitelist-Einträge (werden ignoriert)</p>
          {loading ? <div className="text-emerald-900/40 text-xs">...</div> : (
            <div className="space-y-2">
              {entries.length === 0 && <p className="text-[10px] text-emerald-900/40 font-black uppercase tracking-widest">Keine Einträge</p>}
              {entries.map(e => (
                <div key={e} className="flex items-center justify-between px-4 py-3 rounded-xl bg-emerald-900/5 border border-emerald-900/20">
                  <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider">{e}</span>
                  <button onClick={() => remove(e)} className="text-emerald-900 hover:text-emerald-500 transition-colors p-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="z.B. Docker Fehler"
            className="flex-1 bg-emerald-950/10 border border-emerald-900/30 rounded-xl px-4 py-2.5 text-[11px] text-emerald-400 placeholder:text-emerald-900/40 font-black uppercase tracking-wider outline-none focus:border-emerald-500/50 transition-all"
          />
          <button onClick={add} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 border border-emerald-600/30 hover:bg-emerald-600/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest transition-all">
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      </div>
    </SectionCard>
  );
}

function ShortcutBtn({ label, icon: Icon }: any) {
  return (
    <button className="flex flex-col items-center justify-center p-8 glass-card border-emerald-600/10 hover:border-emerald-600 hover:bg-emerald-600/10 transition-all group shadow-xl">
      <Icon className="w-8 h-8 text-emerald-900/70 group-hover:text-emerald-500 mb-4 transition-all group-hover:scale-110" />
      <span className="text-[10px] text-emerald-900/70 group-hover:text-emerald-500 font-black uppercase tracking-widest text-center leading-tight">{label}</span>
    </button>
  );
}

// ── Main VPanel Component ────────────────────────────────────────────────────
export default function VPanel() {
  const apiFetch = useApi();
  const { toast } = useToast();
  const [sys, setSys] = useState<any>(null);
  const [docker, setDocker] = useState<any[]>([]);
  const [healings, setHealings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dockerLoading, setDockerLoading] = useState(true);
  
  const [showRebootModal, setShowRebootModal] = useState(false);
  const [password, setPassword] = useState('');

  const loadSys = useCallback(async () => {
    try {
      const d = await apiFetch('/api/stats');
      if (d) setSys(d);
    } finally { setLoading(false); }
  }, [apiFetch]);

  const loadDocker = useCallback(async () => {
    setDockerLoading(true);
    try {
      const [d, h] = await Promise.all([
        apiFetch('/api/docker/list'),
        apiFetch('/api/sentinel/healing')
      ]);
      if (d?.ok) setDocker(d.containers || []);
      if (h?.healings) setHealings(h.healings);
    } finally { setDockerLoading(false); }
  }, [apiFetch]);

  useEffect(() => {
    loadSys();
    loadDocker();
    const t = setInterval(() => { loadSys(); loadDocker(); }, 30000);
    return () => clearInterval(t);
  }, [loadSys, loadDocker]);

  const handleDockerAction = async (name: string, action: string) => {
    try {
      const r = await apiFetch('/api/docker/control', { 
        method: 'POST', 
        body: JSON.stringify({ name, action }) 
      });
      if (r?.ok) {
        toast('info', `${name} ${action} erfolgreich`);
        loadDocker();
      } else {
        toast('error', r?.error || 'Fehler');
      }
    } catch (e: any) { toast('error', e.message); }
  };

  const handleReboot = async () => {
    try {
      const r = await apiFetch('/api/sys/reboot', {
        method: 'POST',
        body: JSON.stringify({ password })
      });
      if (r?.ok) {
        toast('info', 'Reboot-Befehl gesendet. System startet neu.');
        setShowRebootModal(false);
      } else {
        toast('error', r?.error || 'Fehler beim Reboot');
      }
    } catch (e: any) { toast('error', e.message); }
  };

  if (loading) return (
    <div className="w-full min-h-screen bg-black flex items-center justify-center">
      <BackTrackLoading label="Initializing_VPanel_Node..." />
    </div>
  );

  return (
    <div className="w-full space-y-16 pb-32 animate-fade-in bg-transparent relative">
      {/* Decorative background scanning line */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-10">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-emerald-600 animate-[scan-vertical_10s_linear_infinite]" />
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 relative z-10">
        <div className="space-y-4">
          <div className="flex items-center gap-6">
             <div className="p-4 rounded-3xl glass-panel border border-emerald-600/20 group relative overflow-hidden">
                <div className="absolute inset-0 scan-overlay opacity-10" />
                <Server className="w-10 h-10 text-emerald-600 relative z-10 group-hover:scale-110 transition-transform duration-500" />
             </div>
             <div>
                <div className="flex items-center gap-3 mb-1">
                   <div className="h-[1px] w-8 bg-emerald-600/30" />
                   <span className="text-tactical-label opacity-40">Infrastructure_Node: 02</span>
                </div>
                <h2 className="text-4xl sm:text-5xl font-black text-emerald-500 tracking-tighter uppercase italic flex items-center gap-5 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                  VPanel<span className="text-emerald-700">_Node</span>
                </h2>
                <p className="text-tactical-label mt-3 opacity-30">Central Infrastructure Operations Hub</p>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
           <div className="flex flex-col items-end">
             <span className="text-[10px] text-emerald-900 font-black uppercase tracking-widest mb-1 opacity-50">System_Uptime</span>
             <span className="text-xl font-black text-emerald-500 glow-emerald tracking-widest animate-pulse">NOMINAL</span>
           </div>
           <button onClick={() => { loadSys(); loadDocker(); }} className="p-5 glass-panel border-emerald-600/30 text-emerald-500 hover:text-emerald-400 hover:border-emerald-600 transition-all shadow-2xl rounded-2xl group relative overflow-hidden">
              <div className="absolute inset-0 bg-emerald-600/5 group-hover:bg-emerald-600/10 transition-all" />
              <RefreshCw className={`w-6 h-6 relative z-10 ${loading || dockerLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatTile label="CPU Last" value={sys?.cpu_percent} unit="%" icon={Cpu} color="blue" />
        <StatTile label="RAM Nutzung" value={sys?.ram?.percent} unit="%" icon={Activity} color="indigo" />
        <StatTile label="Speicher" value={sys?.disk?.percent} unit="%" icon={HardDrive} color="purple" />
        <StatTile label="CPU Temp" value={sys?.temperature} unit="°C" icon={ShieldCheck} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        <div className="lg:col-span-8 space-y-8">
           <PigeonAdvisory apiFetch={apiFetch} />
           <DockerManager containers={docker} onAction={handleDockerAction} loading={dockerLoading} />
           <BackupWhitelist apiFetch={apiFetch} />
        </div>
        <div className="lg:col-span-4 space-y-8">
           <GuardianHealing healings={healings} />
           <SectionCard title="System Aktionen" icon={Power}>
            <div className="space-y-4">
              <button onClick={() => setShowRebootModal(true)} className="w-full py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center gap-3 hover:bg-emerald-500/20 transition-all group">
                <Power className="w-5 h-5 group-hover:scale-110 transition-all" />
                Host System Neustarten
              </button>
              <p className="text-[10px] text-emerald-900 text-center uppercase font-bold tracking-widest">Passwort erforderlich</p>
            </div>
          </SectionCard>

          <SectionCard title="Command Shortcuts" icon={Terminal}>
            <div className="grid grid-cols-2 gap-2">
               <ShortcutBtn label="Docker Clean" icon={Box} />
               <ShortcutBtn label="System Update" icon={RefreshCw} />
               <ShortcutBtn label="Check Logs" icon={MessageSquare} />
               <ShortcutBtn label="N8N Restart" icon={RotateCw} />
            </div>
          </SectionCard>
          <BackupWhitelist apiFetch={apiFetch} />
        </div>
      </div>

      {showRebootModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
          <div className="bg-[#0a0a0a] border border-emerald-900/30 p-8 rounded-3xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6"><AlertTriangle className="w-8 h-8 text-emerald-500" /></div>
            <h3 className="text-xl font-bold text-emerald-500 text-center mb-2">System Neustart</h3>
            <p className="text-emerald-900/70 text-sm text-center mb-8">Dieser Befehl startet den gesamten Raspberry Pi neu.</p>
            <div className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-900/70" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Admin Passwort" className="w-full bg-emerald-950/10 border border-emerald-900/30 rounded-xl py-3 pl-12 pr-4 text-emerald-500 focus:border-emerald-500/50 outline-none transition-all" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowRebootModal(false)} className="flex-1 py-3 rounded-xl bg-emerald-950/10 text-emerald-400 font-bold text-sm">Abbrechen</button>
                <button onClick={handleReboot} className="flex-1 py-3 rounded-xl bg-emerald-500 text-black font-bold text-sm hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">Bestätigen</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
