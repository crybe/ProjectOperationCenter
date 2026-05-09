import { useState, useEffect, useCallback } from 'react';
import { 
  Server, Box, Play, Square, RotateCcw, Activity, RefreshCw, ScrollText, 
  AlertTriangle, Shield, Terminal, Settings, Layers, Cpu, Database
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton, StatusBadge, LogDrawer, BackTrackLoading, CRTScreen } from '../components/ui';
import { ToastContainer, useToast } from '../components/Toast';

// ── Shared UI: Action Button ────────────────────────────────────────────────
function ServiceActionBtn({ label, icon, loading, color, onClick, disabled }: any) {
  const colors: any = {
    blue:    'text-cyan-400 hover:bg-cyan-500/10 border-cyan-500/10',
    rose:    'text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/10',
    emerald: 'text-emerald-400 hover:bg-emerald-600/10 border-emerald-600/10',
  };
  return (
    <button
      onClick={onClick} disabled={disabled || loading}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border bg-white/[0.02] transition-all active:scale-95 disabled:opacity-30 ${colors[color]}`}
    >
      {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : icon}
      {label}
    </button>
  );
}

// ── Service Card (Premium Redesign) ──────────────────────────────────────────
function ServiceCard({ name, data, isContainer, onAction, actionLoading, onViewLog }: any) {
  const isRunning = isContainer ? data.running : data.active;
  const stateStr  = isContainer ? data.status : (data.state || 'inaktiv');
  const actKey    = `${isContainer ? 'c' : 's'}//${name}`;
  const isActing  = (act: string) => actionLoading === `${actKey}//${act}`;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative bg-black/40 border rounded-2xl overflow-hidden transition-all hover:bg-white/[0.05] flex flex-col reactive-border ${isRunning ? 'border-emerald-900/30' : 'border-emerald-500/10 opacity-60'}`}
    >
      <div className="absolute inset-0 scan-overlay opacity-5 pointer-events-none" />
      {/* Dynamic Background Pulse for Active Services */}
      {isRunning && (
        <motion.div 
          animate={{ opacity: [0.05, 0.1, 0.05], scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-600/10 rounded-full blur-[40px]" 
        />
      )}

      <div className="p-6 flex-1 relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl border holo-icon relative overflow-hidden ${isRunning ? 'bg-emerald-600/10 text-emerald-500 border-emerald-600/20 shadow-lg' : 'bg-gray-800 text-emerald-900/70 border-gray-700'}`}>
              <div className="absolute inset-0 scan-overlay opacity-20" />
              {isContainer ? <Box className="w-6 h-6 relative z-10" /> : <Server className="w-6 h-6 relative z-10" />}
            </div>
            <div>
              <h3 className="text-sm font-black text-emerald-500 tracking-tight truncate max-w-[140px] uppercase italic" title={name}>{name}</h3>
              <p className="text-[9px] font-black text-emerald-900 mt-1 uppercase tracking-widest opacity-60">{isContainer ? 'Docker_Container' : 'Systemd_Service'}</p>
            </div>
          </div>
          <button onClick={() => onViewLog(name, isContainer)} className="p-2.5 rounded-lg text-emerald-900 hover:text-emerald-500 hover:bg-emerald-600/10 transition-all"><ScrollText className="w-4 h-4" /></button>
        </div>

        <div className="flex items-center gap-3">
           <div className="status-dots">
              <div className={`status-dot ${isRunning ? 'active' : ''}`} />
              <div className="status-dot" />
           </div>
           <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${isRunning ? 'bg-emerald-600/10 text-emerald-400 border-emerald-600/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
             {isRunning ? 'Operational' : 'Inactive'}
           </span>
           <span className="text-[9px] text-emerald-900 font-black uppercase tracking-widest truncate opacity-40">{stateStr}</span>
        </div>
      </div>

      <div className="p-4 bg-black/40 flex gap-3 border-t border-emerald-900/20 relative z-10">
        {isRunning ? (
          <>
            <ServiceActionBtn label="Cycle" icon={<RotateCcw className="w-3.5 h-3.5" />} loading={isActing('restart')} color="blue" onClick={() => onAction(name, 'restart', isContainer)} disabled={!!actionLoading} />
            <ServiceActionBtn label="Kill" icon={<Square className="w-3.5 h-3.5" />} loading={isActing('stop')} color="rose" onClick={() => onAction(name, 'stop', isContainer)} disabled={!!actionLoading} />
          </>
        ) : (
          <ServiceActionBtn label="Deploy" icon={<Play className="w-3.5 h-3.5" />} loading={isActing('start')} color="emerald" onClick={() => onAction(name, 'start', isContainer)} disabled={!!actionLoading} />
        )}
      </div>
    </motion.div>
  );
}

// ── Main Services Component ──────────────────────────────────────────────────
export default function Services() {
  const apiFetch = useApi();
  const { toasts, toast, remove } = useToast();
  const [data, setData] = useState<any>({ services: {}, containers: {} });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [log, setLog] = useState<{ name: string; url: string } | null>(null);

  const fetchServices = useCallback(async () => {
    try {
      const d = await apiFetch('/api/services');
      if (!d.error) setData(d);
    } catch {} finally { if (loading) setLoading(false); }
  }, [apiFetch, loading]);

  useEffect(() => {
    fetchServices();
    const t = setInterval(fetchServices, 15000);
    return () => clearInterval(t);
  }, [fetchServices]);

  const handleAction = async (name: string, action: string, isContainer: boolean) => {
    const key = `${isContainer ? 'c' : 's'}//${name}//${action}`;
    setActionLoading(key);
    try {
      const type = isContainer ? 'container' : 'service';
      const r = await apiFetch(`/api/${type}/${name}/${action}`, { method: 'POST' });
      toast(r.ok !== false ? 'success' : 'error', r.ok !== false ? `${name} erfolgreich ${action === 'stop' ? 'gestoppt' : 'gestartet'}` : r.error || 'Fehler');
      setTimeout(fetchServices, 1000);
    } catch (e: any) { toast('error', e.message); }
    finally { setTimeout(() => setActionLoading(null), 800); }
  };

  if (loading) return (
    <div className="w-full min-h-screen bg-black flex items-center justify-center">
      <BackTrackLoading label="Scanning_System_Processes..." />
    </div>
  );

  const svcs = Object.keys(data.services || {}).sort();
  const cts  = Object.keys(data.containers || {}).sort();
  
  const cActive = cts.filter(c => data.containers[c]?.running);
  const cStopped = cts.filter(c => !data.containers[c]?.running);
  const sActive = svcs.filter(s => data.services[s]?.active);
  const sStopped = svcs.filter(s => !data.services[s]?.active);

  return (
    <div className="w-full space-y-12 pb-32 animate-fade-in relative bg-transparent">
      {/* Decorative background scanning line */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-10">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-emerald-600 animate-[scan-vertical_10s_linear_infinite]" />
      </div>

      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 relative z-10">
        <div className="space-y-4">
          <div className="flex items-center gap-6">
             <div className="p-4 rounded-3xl glass-panel border border-emerald-600/20 group relative overflow-hidden">
                <div className="absolute inset-0 scan-overlay opacity-10" />
                <Shield className="w-10 h-10 text-emerald-600 relative z-10 group-hover:scale-110 transition-transform duration-500" />
             </div>
             <div>
                <div className="flex items-center gap-3 mb-1">
                   <div className="h-[1px] w-8 bg-emerald-600/30" />
                   <span className="text-tactical-label opacity-40">Orchestration_Node: SERV-CTRL</span>
                </div>
                <h2 className="text-4xl sm:text-5xl font-black text-emerald-500 tracking-tighter uppercase italic flex items-center gap-5 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                  Systems<span className="text-emerald-700">_Orchestration</span>
                </h2>
                <p className="text-tactical-label mt-3 opacity-30">Live Process & Container Telemetry</p>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
           <div className="flex flex-col items-end">
             <span className="text-[10px] text-emerald-900 font-black uppercase tracking-widest mb-1 opacity-50">Active_Runtime</span>
             <span className="text-xl font-black text-emerald-500 glow-emerald tracking-widest">{sActive.length + cActive.length} UNITS</span>
           </div>
           <button onClick={fetchServices} className="p-5 glass-panel border-emerald-600/30 text-emerald-500 hover:text-emerald-400 hover:border-emerald-600 transition-all shadow-2xl rounded-2xl group relative overflow-hidden">
              <div className="absolute inset-0 bg-emerald-600/5 group-hover:bg-emerald-600/10 transition-all" />
              <RefreshCw className={`w-6 h-6 relative z-10 ${actionLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Docker Orchestration" value={cActive.length} total={cts.length} icon={Box} color="blue" />
        <StatCard label="System Services" value={sActive.length} total={svcs.length} icon={Cpu} color="indigo" />
        <StatCard label="Storage Engine" value="Stable" icon={Database} color="emerald" />
      </div>

      <div className="space-y-16">
        <ServiceSection title="Docker Container" icon={Box} activeNames={cActive} stoppedNames={cStopped} data={data.containers} isContainer onAction={handleAction} actionLoading={actionLoading} onViewLog={(n: string, c: boolean) => setLog({ name: n, url: c ? `/api/container-log/${n}` : `/api/service-log/${n}` })} />
        <ServiceSection title="Systemd Services" icon={Server} activeNames={sActive} stoppedNames={sStopped} data={data.services} isContainer={false} onAction={handleAction} actionLoading={actionLoading} onViewLog={(n: string, c: boolean) => setLog({ name: n, url: c ? `/api/container-log/${n}` : `/api/service-log/${n}` })} />
      </div>

      <LogDrawer title={log?.name ?? ''} url={log?.url ?? ''} open={!!log} onClose={() => setLog(null)} />
      <ToastContainer toasts={toasts} remove={remove} />
    </div>
  );
}

function StatCard({ label, value, total, icon: Icon, color }: any) {
  const colors: any = {
    blue: 'text-cyan-500 border-cyan-500/20 bg-cyan-500/5',
    indigo: 'text-emerald-500 border-emerald-600/20 bg-emerald-600/5',
    emerald: 'text-emerald-500 border-emerald-600/20 bg-emerald-600/5',
  };
  return (
    <div className={`p-6 glass-card border flex items-center gap-6 shadow-2xl transition-all hover:scale-[1.02] reactive-border group relative overflow-hidden ${colors[color]}`}>
      <div className="absolute inset-0 scan-overlay opacity-[0.03] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-[1px] bg-emerald-600/20 animate-[scan-vertical_6s_linear_infinite]" />
      
      <div className="p-3.5 rounded-2xl bg-emerald-600/5 border border-emerald-900/10 holo-icon relative overflow-hidden">
        <div className="absolute inset-0 scan-overlay opacity-10" />
        <Icon className="w-7 h-7 relative z-10" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1.5">
           <p className="text-tactical-label opacity-40">{label}</p>
        </div>
        <h4 className="text-2xl font-black text-emerald-500 tracking-tighter drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
          {value} {total && <span className="text-[10px] text-emerald-900 font-black ml-2 opacity-40">/ {total}</span>}
        </h4>
      </div>
    </div>
  );
}

function ServiceSection({ title, icon: Icon, activeNames, stoppedNames, data, isContainer, onAction, actionLoading, onViewLog }: any) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-emerald-950/10 text-emerald-400"><Icon className="w-5 h-5" /></div>
        <h3 className="text-xl font-bold text-emerald-400 tracking-tight">{title}</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {activeNames.map((n: string) => <ServiceCard key={n} name={n} data={data[n]} isContainer={isContainer} onAction={onAction} actionLoading={actionLoading} onViewLog={onViewLog} />)}
        {stoppedNames.map((n: string) => <ServiceCard key={n} name={n} data={data[n]} isContainer={isContainer} onAction={onAction} actionLoading={actionLoading} onViewLog={onViewLog} />)}
      </div>
    </div>
  );
}
