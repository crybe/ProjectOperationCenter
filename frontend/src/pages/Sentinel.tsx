import { useState, useEffect, useRef } from 'react';
import { Shield, Activity, Plus, Trash2, Power, AlertTriangle, TerminalSquare, ShieldAlert } from 'lucide-react';
import { SectionCard, SkeletonCard } from '../components/ui';
import { useApi } from '../hooks/useApi';
import { useToast } from '../components/Toast';
import ModuleBadge from '../components/ModuleBadge';
import { motion } from 'framer-motion';

function RadarSweep() {
  return (
    <div className="relative w-48 h-48 mx-auto mb-8 group">
       {/* Outer rings */}
       <div className="absolute inset-0 border border-emerald-500/20 rounded-full" />
       <div className="absolute inset-4 border border-emerald-500/10 rounded-full" />
       <div className="absolute inset-12 border border-emerald-500/10 rounded-full" />
       
       {/* Grid lines */}
       <div className="absolute top-1/2 left-0 w-full h-[1px] bg-emerald-500/10" />
       <div className="absolute top-0 left-1/2 w-[1px] h-full bg-emerald-500/10" />
       
       {/* Blips */}
       <div className="absolute top-1/4 left-1/3 w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981] animate-pulse" />
       <div className="absolute bottom-1/3 right-1/4 w-1 h-1 bg-emerald-500 rounded-full shadow-[0_0_5px_#10b981] animate-pulse delay-700" />
       
       {/* Sweep */}
       <motion.div 
         className="absolute inset-0 origin-center"
         animate={{ rotate: 360 }}
         transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
       >
          <div className="absolute top-0 left-1/2 w-1/2 h-1/2 bg-gradient-to-tr from-transparent via-emerald-500/20 to-transparent rounded-tr-full origin-bottom-left" />
          <div className="absolute top-0 left-1/2 w-[1px] h-1/2 bg-emerald-500/40 shadow-[0_0_10px_#10b981]" />
       </motion.div>
       
       {/* Center point */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]" />
    </div>
  );
}

export default function Sentinel() {
  const apiFetch = useApi();
  const { toast } = useToast();
  const [rules, setRules] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [sysInfo, setSysInfo] = useState<any>(null);
  const [selectedMetric, setSelectedMetric] = useState('cpu_pct');
  const [loading, setLoading] = useState(true);

  const isPollingRef = useRef(false);

  const loadData = async () => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;
    try {
      const [rulesRes, logsRes, sysRes] = await Promise.all([
        apiFetch('/api/sentinel/rules'),
        apiFetch('/api/sentinel/logs'),
        apiFetch('/api/sentinel/sysinfo')
      ]);
      setRules(rulesRes?.rules || []);
      setLogs(logsRes?.logs || []);
      setSysInfo(sysRes);
    } catch (e) {
      console.error(e);
    } finally {
      isPollingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const t = setInterval(loadData, 15000);
    return () => clearInterval(t);
  }, []);

  const addRule = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const metric = (form.elements.namedItem('metric') as HTMLSelectElement).value;
    const operator = (form.elements.namedItem('operator') as HTMLSelectElement).value;
    const value = (form.elements.namedItem('value') as HTMLInputElement).value;
    const action = (form.elements.namedItem('action') as HTMLSelectElement).value;

    try {
      await apiFetch('/api/sentinel/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metric, operator, value, action })
      });
      toast('success', 'Rule_Deployed');
      loadData();
      form.reset();
    } catch (e: any) {
      toast('error', e.message);
    }
  };

  const deleteRule = async (id: string) => {
    try {
      await apiFetch(`/api/sentinel/rules/${id}`, { method: 'DELETE' });
      toast('success', 'Rule_Terminated');
      loadData();
    } catch (e: any) {
      toast('error', e.message);
    }
  };

  return (
    <div className="w-full min-h-screen pb-48 animate-fade-in space-y-16">
      <div className="flex flex-col gap-6 border-b border-emerald-600/10 pb-10 relative overflow-hidden">
        <div className="absolute inset-0 scanner-line opacity-5 pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-stretch gap-8 mb-16">
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-6">
              <div className="p-4 rounded-2xl glass-panel border border-emerald-600/20 group relative overflow-hidden">
                <ShieldAlert className="w-10 h-10 text-emerald-600 relative z-10 group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 scan-overlay opacity-10" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                   <div className="h-[1px] w-8 bg-emerald-600/30" />
                   <span className="text-tactical-label opacity-40">System_Sentinel // Watchdog_Node</span>
                </div>
                <h2 className="text-4xl sm:text-5xl font-black text-emerald-500 tracking-tighter uppercase italic flex items-center gap-5 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                  Sentinel<span className="text-emerald-700">_OS</span>
                  <ModuleBadge status="SECURE" className="scale-75 origin-left" />
                </h2>
                <p className="text-tactical-label mt-3 opacity-30">Real-time Perimeter & Hardware Monitoring</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
         <div className="lg:col-span-8">
            <SectionCard title="Active_Directives" icon={Activity} delay={1}>
               {loading ? (
                 <SkeletonCard />
               ) : rules.length === 0 ? (
                 <div className="py-20 text-center text-emerald-900 font-hacker uppercase text-[10px] tracking-widest">No active directives.</div>
               ) : (
                 <div className="space-y-4">
                    {rules.map((rule) => (
                      <div key={rule.id} className="p-6 bg-black/40 border border-emerald-900/20 rounded-2xl flex justify-between items-center group relative overflow-hidden reactive-border hover:bg-white/[0.05] transition-all">
                        <div className="absolute inset-0 scan-overlay opacity-5 pointer-events-none" />
                        <div className="flex flex-col gap-4 relative z-10">
                           <div className="flex items-center gap-3">
                              <div className="status-dots">
                                 <div className="status-dot active" />
                                 <div className="status-dot" />
                              </div>
                              <span className="text-[12px] font-black text-emerald-500 uppercase tracking-widest font-mono italic">
                                IF [ <span className="text-emerald-400">{rule.metric}</span> {rule.operator} <span className="text-emerald-400">{rule.value}</span> ]
                              </span>
                           </div>
                           <div className="flex items-center gap-4">
                              <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                 <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">THEN: {rule.action}</span>
                              </div>
                              <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg">
                                 <span className="text-[9px] font-black text-emerald-900/70 uppercase tracking-widest">Hits: {rule.hits || 0}</span>
                              </div>
                           </div>
                        </div>
                        <button onClick={() => deleteRule(rule.id)} className="p-4 text-emerald-900 hover:text-emerald-500 hover:bg-emerald-600/10 rounded-2xl transition-all relative z-10 border border-transparent hover:border-emerald-600/20">
                           <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                 </div>
               )}
            </SectionCard>

            <SectionCard title="Incident_Log" icon={TerminalSquare} delay={1.5}>
               {loading ? (
                 <SkeletonCard />
               ) : logs.length === 0 ? (
                 <div className="py-10 text-center text-emerald-900 font-hacker uppercase text-[10px] tracking-widest">No recent incidents recorded.</div>
               ) : (
                 <div className="space-y-3">
                    {logs.map((log: any) => (
                      <div key={log.id} className="p-4 bg-black/50 border border-emerald-900/20 flex flex-col gap-2 rounded group hover:border-emerald-900/30 transition-colors">
                         <div className="flex justify-between items-center border-b border-emerald-900/20 pb-2">
                            <span className="text-[9px] text-emerald-900/70 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                            <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest px-2 py-0.5 bg-emerald-500/10 rounded">{log.action}</span>
                         </div>
                         <p className="text-[11px] text-emerald-400 font-hacker uppercase tracking-wider">{log.message}</p>
                      </div>
                    ))}
                 </div>
               )}
            </SectionCard>
         </div>

         <div className="lg:col-span-4 space-y-16">
            <SectionCard title="Hardware_Telemetry" icon={Activity} delay={2}>
              <div className="p-8 glass-card relative overflow-hidden font-hacker shadow-2xl glass-reflection reactive-border group">
                 <div className="absolute inset-0 scan-overlay opacity-5 pointer-events-none" />
                 <div className="relative z-10 space-y-12">
                     <div className="flex items-center justify-between mb-6 pb-6 border-b border-emerald-900/20">
                        <div>
                           <div className="flex items-center gap-2 mb-2">
                              <div className="status-dots">
                                 <div className="status-dot active" />
                              </div>
                              <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest opacity-70">Host_Uptime</p>
                           </div>
                           <p className="text-2xl font-black text-emerald-500 tabular-nums drop-shadow-[0_0_100px_rgba(204,0,0,0.2)]">{sysInfo?.uptime || '—'}</p>
                        </div>
                        <div className="holo-icon p-3 rounded-xl bg-emerald-600/5 border border-emerald-600/20">
                           <Power className="w-8 h-8 text-emerald-600 relative z-10" />
                        </div>
                     </div>
                     
                     <RadarSweep />
                    
                    <div className="space-y-6">
                      <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-emerald-900">
                        <span>Compute_Cycle</span>
                        <span>{sysInfo?.cpu_pct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-emerald-950/20 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600 glow-emerald transition-all duration-1000" style={{ width: `${sysInfo?.cpu_pct}%` }} />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-emerald-900">
                        <span>Memory_Stack</span>
                        <span>{sysInfo?.ram_pct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-emerald-950/20 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600 glow-emerald transition-all duration-1000" style={{ width: `${sysInfo?.ram_pct}%` }} />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-emerald-900">
                        <span>Thermal_Core</span>
                        <span>{sysInfo?.temp}°C</span>
                      </div>
                      <div className="h-1.5 w-full bg-emerald-950/20 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600 glow-emerald transition-all duration-1000" style={{ width: `${(sysInfo?.temp / 100) * 100}%` }} />
                      </div>
                    </div>
                 </div>
              </div>
            </SectionCard>

            <SectionCard title="Deploy_Directive" icon={Plus} delay={2}>
               <form onSubmit={addRule} className="space-y-8 relative">
                  <div className="absolute inset-0 scan-overlay opacity-5 pointer-events-none" />
                  <div className="space-y-6 relative z-10">
                     <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                           <span className="text-[9px] text-emerald-900 font-black uppercase tracking-widest">Target_Metric</span>
                           {sysInfo && (
                             <div className="flex items-center gap-2 px-3 py-1 bg-emerald-600/10 border border-emerald-600/20 rounded-lg">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">
                                   REALTIME: {selectedMetric === 'cpu_pct' ? sysInfo.cpu_pct + '%' : selectedMetric === 'ram_pct' ? sysInfo.ram_pct + '%' : sysInfo.temp + '°C'}
                                </span>
                             </div>
                           )}
                        </div>
                        <select name="metric" value={selectedMetric} onChange={e => setSelectedMetric(e.target.value)} className="w-full bg-black/50 border border-emerald-900/30 rounded-xl px-4 py-3 text-sm text-emerald-500 focus:outline-none focus:border-emerald-600/50 transition-all font-hacker uppercase">
                           <option value="cpu_pct">CPU_UTIL_PERCENT</option>
                           <option value="ram_pct">RAM_UTIL_PERCENT</option>
                           <option value="temp_c">THERMAL_STATE_CELSIUS</option>
                        </select>
                     </div>
                     
                     <div className="flex gap-4">
                        <div className="w-1/3 space-y-2">
                           <span className="text-[9px] text-emerald-900 font-black uppercase tracking-widest ml-1">Op</span>
                           <select name="operator" className="w-full bg-black/50 border border-emerald-900/30 rounded-xl px-4 py-3 text-sm text-emerald-500 focus:outline-none focus:border-emerald-600/50 transition-all">
                              <option value=">">&gt; (GREATER)</option>
                              <option value="<">&lt; (LESSER)</option>
                           </select>
                        </div>
                        <div className="w-2/3 space-y-2">
                           <span className="text-[9px] text-emerald-900 font-black uppercase tracking-widest ml-1">Threshold</span>
                           <input name="value" type="number" placeholder="0.0" className="w-full bg-black/50 border border-emerald-900/30 rounded-xl px-4 py-3 text-sm text-emerald-500 focus:outline-none focus:border-emerald-600/50 transition-all font-mono" required />
                        </div>
                     </div>

                     <div className="space-y-2">
                        <span className="text-[9px] text-emerald-900 font-black uppercase tracking-widest ml-1">Strategic_Action</span>
                        <select name="action" className="w-full bg-black/50 border border-emerald-900/30 rounded-xl px-4 py-3 text-sm text-emerald-500 focus:outline-none focus:border-emerald-600/50 transition-all font-hacker uppercase">
                           <option value="log_warning">EMIT_TACTICAL_WARNING</option>
                           <option value="restart_shinra">RESTART_HUB_NODE</option>
                           <option value="stop_ki_bot">SHUTDOWN_AI_CORE</option>
                        </select>
                     </div>
                  </div>

                  <button type="submit" className="w-full h-16 rounded-xl bg-emerald-600 text-black font-black uppercase tracking-[0.4em] hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-600/20 flex justify-center items-center gap-4 group relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                     <Power className="w-5 h-5 relative z-10" /> 
                     <span className="relative z-10">INJECT_DIRECTIVE</span>
                  </button>
               </form>
            </SectionCard>

            <div className="p-6 bg-emerald-900/10 border border-emerald-900/30 glass-card">
               <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="w-5 h-5 text-emerald-500" />
                  <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">System Warning</span>
               </div>
               <p className="text-[9px] text-emerald-900/70 font-hacker uppercase leading-relaxed tracking-wider">
                  Automated actions execute without user confirmation. Ensure rules do not create infinite restart loops.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}
