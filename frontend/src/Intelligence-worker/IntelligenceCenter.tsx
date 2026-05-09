import React, { useState, useEffect } from 'react';
import { Shield, Brain, Activity, TrendingUp, AlertTriangle, Zap, Target, Cpu, Thermometer, Search, Loader2 } from 'lucide-react';
import pigeonLogo from '../assets/pigeon_tactical.jpg';
import mascotAerith from '../assets/mascot_aerith.png';


interface IntelligenceReport {
  status: string;
  summary: string;
  root_cause: { primary: string; secondary: string[] };
  grow_analysis: { state: string; issues: string[]; actions: string[] };
  system_analysis: { state: string; issues: string[]; actions: string[] };
  risks: { type: string; level: string; reason: string; eta: string }[];
  trends: { vpd: string; temp: string; humidity: string; note: string };
  scores: { grow_score: number; system_score: number; combined_score: number };
  confidence: number;
  recommended_actions: string[];
  backup_status?: { status: string; percent: number; last_success?: string; started?: string };
}

export function IntelligenceCenter({ apiFetch }: any) {
  const [report, setReport] = useState<IntelligenceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanReport, setScanReport] = useState<any>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [pigeonHealth, setPigeonHealth] = useState<any>(null);

  const fetchQueue = async () => {
    try {
      const res = await apiFetch('/api/pigeon/queue');
      if (res && res.ok) setQueue(res.queue.filter((a: any) => a.status === 'pending'));
    } catch (e) {}
  };

  const fetchPigeonHealth = async () => {
    try {
      const res = await apiFetch('/api/pigeon/health');
      if (res) setPigeonHealth(res);
    } catch (e) {}
  };

  const handleQueueStatus = async (id: string, status: 'approve' | 'reject') => {
    try {
      const res = await apiFetch(`/api/pigeon/queue/${id}/${status}`, { method: 'POST' });
      if (res && res.ok) fetchQueue();
    } catch (e) {}
  };

  const fetchReport = async () => {
    try {
      const res = await apiFetch('/api/intelligence/report');
      if (res) setReport(res);
    } catch (e) {
      console.error("Intelligence fetch failed", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeepScan = async () => {
    setScanning(true);
    setScanReport(null);
    try {
      const res = await apiFetch('/api/intel/deep-scan', { method: 'POST' });
      if (res && res.ok) {
        setScanReport(res.report);
        // Refresh thoughts after scan since it might have added memories
        setTimeout(fetchReport, 2000);
      }
    } catch (e) {
      console.error("Deep Scan failed", e);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    fetchReport();
    fetchQueue();
    fetchPigeonHealth();
    const t = setInterval(() => {
      fetchReport();
      fetchQueue();
      fetchPigeonHealth();
    }, 30000);
    return () => clearInterval(t);
  }, []);

  if (loading && !report) return (
    <div className="p-20 flex flex-col items-center justify-center space-y-6">
       <Brain className="w-12 h-12 text-emerald-500 animate-pulse glow-emerald" />
       <p className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-900">Kernlogik wird synchronisiert...</p>
    </div>
  );

  if (!report) return null;

  const getStatusColor = (status: string) => {
    if (status === 'OPTIMAL') return 'emerald';
    if (status === 'WARNING' || status === 'DEGRADED') return 'amber';
    return 'rose';
  };

  const statusColor = getStatusColor(report.status);

  return (
    <div className="relative p-1 animate-fade-in">
      {/* Background Ambience */}
      <div className={`absolute inset-0 bg-${statusColor}-500/5 blur-[100px] pointer-events-none rounded-full`} />

      <div className="relative glass-panel border border-emerald-600/20 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] group">
        <img src={mascotAerith} className="mascot-ornament" alt="Mascot Ornament" />
        
        {/* Tactical Header */}
        <div className="flex flex-col md:flex-row items-center justify-between px-6 md:px-12 py-8 md:py-10 border-b border-emerald-900/10 bg-emerald-950/10 gap-8">
           <div className="flex items-center gap-6 md:gap-10">
              <div className={`relative p-2 rounded-2xl bg-emerald-600/10 border border-emerald-600/30 shadow-[0_0_25px_rgba(225,29,72,0.2)] overflow-hidden group animate-pigeon-float shrink-0`}>
                 <img 
                   src={mascotAerith} 
                   alt="Mascot" 
                   className="mascot-ornament-header transition-transform group-hover:scale-110 duration-500" 
                 />
                 <div className="pigeon-scanline opacity-30" />
              </div>
              <div>
                  <div className="flex items-center gap-3 mb-2">
                     <div className="h-[1px] w-8 bg-emerald-600/40" />
                     <span className="text-tactical-label">Neural_Node: P.I.G.E.O.N.</span>
                  </div>
                  <h2 className="text-2xl md:text-4xl font-black text-emerald-500 uppercase tracking-tighter italic drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                    System<span className="text-emerald-700">_Intelligence</span>
                  </h2>
                  <p className="text-tactical-label mt-3 opacity-40 line-clamp-1">{report.summary}</p>
              </div>
           </div>
           <div className="flex flex-row md:flex-col items-center md:items-end gap-6">
              <div className="text-right hidden md:block">
                 <p className="text-tactical-label mb-2">Operational_Status</p>
                 <div className={`px-5 py-2 rounded-xl bg-${statusColor}-500/10 border border-${statusColor}-500/20 text-${statusColor}-500 text-xs font-black uppercase tracking-widest shadow-inner`}>
                    {report.status}
                 </div>
              </div>
              <button 
                 onClick={handleDeepScan}
                 disabled={scanning}
                 className={`flex items-center gap-3 px-8 py-4 rounded-2xl border transition-all font-black uppercase tracking-widest text-[10px] ${scanning ? 'bg-emerald-600/10 border-emerald-600/20 text-emerald-500' : 'bg-emerald-600 text-black border-emerald-600 hover:bg-emerald-500 shadow-[0_10px_30px_rgba(225,29,72,0.3)]'}`}
              >
                 {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                 {scanning ? 'SCANNING...' : 'DEEP_SCAN'}
              </button>
           </div>
        </div>

        {/* Backup Status Bar */}
        {report.backup_status && (
          <div className="px-10 py-3 bg-emerald-500/5 border-b border-emerald-900/10 flex items-center gap-4">
             <div className="flex items-center gap-2 min-w-[120px]">
                <Shield className={`w-3 h-3 ${report.backup_status.status === 'running' ? 'text-emerald-500 animate-pulse' : 'text-emerald-500'}`} />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-900/70">
                   {report.backup_status.status === 'running' ? 'Backup_läuft...' : 'Backup_Bereit'}
                </span>
             </div>
             <div className="flex-1 h-1.5 bg-emerald-950/30 rounded-full overflow-hidden border border-emerald-900/20">
                <div 
                  className={`h-full transition-all duration-1000 ${report.backup_status.status === 'running' ? 'bg-emerald-500 glow-emerald animate-pulse' : 'bg-emerald-500/50'}`}
                  style={{ width: `${report.backup_status.percent}%` }}
                />
             </div>
             <div className="text-[9px] font-black text-emerald-500 w-8 text-right">
                {report.backup_status.percent}%
             </div>
          </div>
        )}

        {/* Deep Scan Results Area */}
        {scanReport && (
          <div className="px-4 md:px-10 py-6 md:py-8 bg-emerald-600/5 border-b border-emerald-900/20 animate-fade-in">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                   <div className="p-2 bg-emerald-600/20 rounded-lg"><Activity className="w-4 h-4 text-emerald-500" /></div>
                   <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest">Tiefen_Analyse_Bericht :: {new Date(scanReport.timestamp).toLocaleTimeString()}</h3>
                </div>
                <button onClick={() => setScanReport(null)} className="text-[10px] font-black text-emerald-900 uppercase hover:text-emerald-500 transition-colors">[ Ergebnisse_löschen ]</button>
             </div>

             {/* Trends Section */}
             {scanReport.trends && scanReport.trends.length > 0 && (
               <div className="mb-8 p-6 glass-card rounded-3xl border-l-4 border-amber-500 bg-amber-500/5">
                 <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Prädiktive_System_Trends</h4>
                 </div>
                 <div className="space-y-2">
                    {scanReport.trends.map((trend: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-[11px] text-amber-400 font-mono">
                         <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
                         {trend}
                      </div>
                    ))}
                 </div>
               </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(scanReport.services).map(([name, data]: [string, any]) => (
                   <div key={name} className={`p-5 rounded-2xl border ${data.running ? 'bg-black/40 border-emerald-900/20' : 'bg-emerald-600/10 border-emerald-600/40'}`}>
                      <div className="flex items-center justify-between mb-4">
                         <span className="text-[11px] font-black text-emerald-500 uppercase truncate max-w-[150px]">{name}</span>
                         <span className={`text-[8px] px-2 py-0.5 rounded-full font-black ${data.running ? 'bg-emerald-500/20 text-emerald-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                            {data.status.toUpperCase()}
                         </span>
                      </div>
                      <div className="space-y-3">
                         <div className="flex justify-between text-[9px] uppercase font-black text-emerald-900">
                            <span>Status:</span>
                            <span className={data.health === 'healthy' ? 'text-emerald-500' : 'text-amber-500'}>{data.health === 'healthy' ? 'OK' : data.health}</span>
                         </div>
                         {data.errors && data.errors.length > 0 && (
                            <div className="mt-4 p-3 bg-emerald-600/5 rounded-xl border border-emerald-600/20 space-y-2">
                               <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Log_Anomalies:</p>
                               {data.errors.slice(0, 3).map((err: string, i: number) => (
                                  <p key={i} className="text-[9px] text-emerald-400 font-medium truncate font-mono">{err}</p>
                               ))}
                            </div>
                         )}
                      </div>
                   </div>
                ))}
             </div>
             {scanReport.anomalies.length > 0 && (
                <div className="mt-8 p-6 bg-emerald-600/10 border border-emerald-600/40 rounded-2xl flex items-start gap-4">
                   <AlertTriangle className="w-5 h-5 text-emerald-500 shrink-0" />
                   <div>
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Kritische_System_Warnungen:</p>
                      <ul className="space-y-1">
                         {scanReport.anomalies.map((ano: string, i: number) => (
                            <li key={i} className="text-[11px] text-emerald-400 font-medium leading-relaxed italic">• {ano}</li>
                         ))}
                      </ul>
                   </div>
                </div>
             )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-px bg-emerald-950/10">

          
          {/* Left Column: Scores & Trends */}
          <div className="lg:col-span-4 p-6 md:p-10 space-y-8 md:space-y-12 bg-[#0a0a0c]/80">
                      {/* Combined Score Gauge */}
               <div className="relative flex flex-col items-center py-12 group/gauge">
                  <div className="absolute inset-0 bg-emerald-500/5 blur-[80px] rounded-full opacity-0 group-hover/gauge:opacity-100 transition-opacity duration-1000" />
                  <svg className="w-64 h-64 transform -rotate-90 relative z-10">
                    <circle cx="128" cy="128" r="110" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-emerald-950/10" />
                    <circle cx="128" cy="128" r="110" stroke="currentColor" strokeWidth="12" fill="transparent" 
                      strokeDasharray={691.15} strokeDashoffset={691.15 * (1 - report.scores.combined_score / 100)}
                      className={`text-${statusColor}-500 transition-all duration-1500 ease-out drop-shadow-[0_0_20px_rgba(225,29,72,0.4)]`}
                      strokeLinecap="round" />
                  </svg>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-20">
                     <p className="text-7xl font-black text-emerald-500 tabular-nums tracking-tighter drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] italic">{report.scores.combined_score}</p>
                     <p className="text-tactical-label opacity-40">Master_KPI</p>
                  </div>
                  <div className="mt-16 grid grid-cols-2 gap-16 w-full relative z-10 px-8">
                     <div className="text-center border-r border-emerald-900/10">
                        <p className="text-tactical-label mb-3">Grow_Lvl</p>
                        <p className="text-3xl font-black text-emerald-500 tabular-nums italic">{report.scores.grow_score}%</p>
                     </div>
                     <div className="text-center">
                        <p className="text-tactical-label mb-3">Node_Int</p>
                        <p className="text-3xl font-black text-emerald-500 tabular-nums italic">{report.scores.system_score}%</p>
                     </div>
                  </div>
               </div>

             {/* Environmental Trends */}
             <div className="space-y-6 pt-6 border-t border-emerald-900/20">
                <h3 className="text-[10px] text-emerald-900/70 font-black uppercase tracking-[0.3em] mb-4">Parameter_Trends</h3>
                <div className="space-y-4">
                   <TrendItem label="VPD_Transpiration" direction={report.trends.vpd} icon={Activity} />
                   <TrendItem label="Thermal_Stability" direction={report.trends.temp} icon={Thermometer} />
                   <TrendItem label="Atmospheric_RH" direction={report.trends.humidity} icon={TrendingUp} />
                </div>
                <p className="text-[10px] text-emerald-900 italic mt-6 leading-relaxed">
                   "{report.trends.note}"
                </p>
             </div>
          </div>

          {/* Right Column: Insights & Actions */}
          <div className="lg:col-span-8 p-6 md:p-10 space-y-8 md:space-y-12">
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                
                {/* Grow Analysis */}
                <div className="space-y-6">
                   <div className="flex items-center gap-3 mb-2">
                      <Target className="w-4 h-4 text-emerald-500" />
                      <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest">Grow_Operations</h3>
                   </div>
                   <div className={`p-6 rounded-2xl border ${report.grow_analysis.state === 'optimal' ? 'bg-emerald-600/5 border-emerald-600/20' : 'bg-amber-500/5 border-amber-500/20'} space-y-4`}>
                      {report.grow_analysis.issues.length > 0 ? report.grow_analysis.issues.map((iss, i) => (
                        <p key={i} className="text-[11px] text-emerald-400 font-medium leading-relaxed">• {iss}</p>
                      )) : (
                        <p className="text-[11px] text-emerald-500 font-black uppercase italic">All parameters within optimal range.</p>
                      )}
                   </div>
                </div>

                {/* System Analysis */}
                <div className="space-y-6">
                   <div className="flex items-center gap-3 mb-2">
                      <Cpu className="w-4 h-4 text-emerald-500" />
                      <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest">System_Stability</h3>
                   </div>
                   <div className={`p-6 rounded-2xl border ${report.system_analysis.state === 'healthy' ? 'bg-emerald-600/5 border-emerald-600/20' : 'bg-emerald-500/5 border-emerald-500/20'} space-y-4`}>
                      {report.system_analysis.issues.length > 0 ? report.system_analysis.issues.map((iss, i) => (
                        <p key={i} className="text-[11px] text-emerald-400 font-medium leading-relaxed">• {iss}</p>
                      )) : (
                        <p className="text-[11px] text-emerald-500 font-black uppercase italic">Node healthy. No stress detected.</p>
                      )}
                   </div>
                </div>
             </div>

             {/* Risks Section */}
             <div className="space-y-6">
                <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4 text-emerald-500" />
                      <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest">Risk_Radar_Predictive</h3>
                   </div>
                   <span className="text-[9px] text-emerald-900 uppercase font-black tracking-widest">Confidence: {report.confidence}%</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {report.risks.map((risk, i) => (
                     <div key={i} className="flex items-start gap-5 p-5 bg-emerald-950/10 rounded-2xl border border-emerald-900/20 group hover:border-emerald-500/30 transition-all">
                        <div className={`p-3 rounded-xl ${risk.level === 'high' ? 'bg-emerald-500/10 text-emerald-500 glow-emerald' : 'bg-amber-500/10 text-amber-500 glow-amber'}`}>
                           <Zap className="w-4 h-4" />
                        </div>
                        <div>
                           <div className="flex items-center gap-2 mb-1">
                              <p className="text-[11px] font-black text-emerald-500 uppercase tracking-tight">{risk.type}</p>
                              <span className={`text-[8px] px-2 py-0.5 rounded-full border ${risk.level === 'high' ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40' : 'bg-amber-500/20 text-amber-500 border-amber-500/40'} uppercase font-black`}>{risk.level}</span>
                           </div>
                           <p className="text-[10px] text-emerald-900/70 italic mb-2 leading-tight">{risk.reason}</p>
                           <p className="text-[9px] text-emerald-950 font-black uppercase">ETA: {risk.eta}</p>
                        </div>
                     </div>
                   ))}
                   {report.risks.length === 0 && (
                     <div className="col-span-2 p-10 border border-dashed border-emerald-900/20 rounded-3xl flex flex-col items-center justify-center text-emerald-950">
                        <Shield className="w-8 h-8 mb-4 opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No immediate risks detected in current data cycle.</p>
                     </div>
                   )}
                </div>
             </div>

             {/* Actionable Decisions */}
             <div className="pt-8 border-t border-emerald-900/20">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest">Strategic_Decisions</h3>
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                      <span className="text-[9px] text-emerald-900/70 font-black uppercase tracking-widest">Assisted_Optimization</span>
                   </div>
                </div>
                <div className="flex flex-wrap gap-4">
                   {report.recommended_actions.map((act: string, i: number) => (
                     <div key={i} className="flex items-center gap-3 px-5 py-3 rounded-xl bg-emerald-600/10 border border-emerald-600/20 hover:bg-emerald-600 hover:text-black transition-all group cursor-pointer">
                        <Zap className="w-3 h-3 text-emerald-500 group-hover:text-black" />
                        <span className="text-[10px] font-bold tracking-tight">{act}</span>
                     </div>
                   ))}
                </div>
             </div>

             {/* Approval Queue Section */}
             {queue.length > 0 && (
                <div className="pt-10 border-t border-emerald-900/20 animate-fade-in">
                   <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                         <div className="p-2.5 rounded-xl bg-emerald-600/10 border border-emerald-600/20 shadow-inner">
                            <Shield className="w-5 h-5 text-emerald-600" />
                         </div>
                         <h3 className="text-sm font-black text-emerald-500 uppercase tracking-[0.2em]">Sicherheits-Audit & Freigabe</h3>
                      </div>
                      <div className="flex items-center gap-3">
                         <span className="text-[10px] text-emerald-950 font-black uppercase tracking-widest bg-emerald-950/20 px-4 py-1.5 rounded-full border border-emerald-900/20 shadow-inner">Ausstehende_Validierungen: {queue.length}</span>
                      </div>
                   </div>
                   <div className="space-y-6">
                      {queue.map((act) => (
                        <div key={act.id} className="group relative">
                           <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600/20 to-transparent blur opacity-0 group-hover:opacity-100 transition duration-1000" />
                           <div className="relative p-8 rounded-[2rem] bg-emerald-950/5 border border-emerald-900/10 flex flex-col lg:flex-row items-center justify-between gap-8 hover:border-emerald-600/30 transition-all duration-500 shadow-xl overflow-hidden">
                              <div className="absolute inset-0 scanner-line opacity-[0.03] pointer-events-none" />
                              <div className="flex-1 space-y-4">
                                 <div className="flex items-center gap-4">
                                    <span className="px-3 py-1 rounded-lg bg-emerald-600 text-black text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20">Critical_Action</span>
                                    <h4 className="text-base font-black text-emerald-500 uppercase tracking-tight italic">{act.name}</h4>
                                 </div>
                                 <p className="text-xs text-emerald-100/70 font-medium leading-relaxed max-w-2xl">{act.reason}</p>
                                 <div className="flex flex-wrap items-center gap-6 pt-2">
                                    <div className="flex items-center gap-2">
                                       <span className="text-tactical-label">Risiko_Level:</span>
                                       <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{act.risk}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                       <span className="text-tactical-label">Exec_Command:</span>
                                       <code className="text-[10px] text-emerald-500/80 bg-black/60 px-3 py-1 rounded-lg border border-emerald-900/20 font-mono tracking-tight">{act.command}</code>
                                    </div>
                                 </div>
                              </div>
                              <div className="flex items-center gap-4 shrink-0 relative z-20">
                                 <button 
                                   onClick={() => handleQueueStatus(act.id, 'reject')}
                                   className="px-6 py-3 rounded-2xl border border-emerald-900/30 text-emerald-900 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-950/40 hover:text-emerald-600 transition-all duration-300"
                                 >
                                   Verwerfen
                                 </button>
                                 <button 
                                   onClick={() => handleQueueStatus(act.id, 'approve')}
                                   className="px-10 py-3 rounded-2xl bg-emerald-600 text-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-500 shadow-[0_10px_30px_rgba(225,29,72,0.3)] transition-all duration-300 active:scale-95"
                                 >
                                   Bestätigen
                                 </button>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              )}

          </div>

        </div>

      </div>
    </div>
  );
}

function TrendItem({ label, direction, icon: Icon }: any) {
  const getIconColor = (dir: string) => {
    if (dir === 'stable') return 'text-emerald-500 glow-emerald';
    if (dir === 'rising') return 'text-amber-500 glow-amber';
    return 'text-emerald-500 glow-emerald';
  };

  return (
    <div className="flex items-center justify-between group">
       <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-950/10 rounded-lg group-hover:bg-emerald-950/20 transition-colors">
             <Icon className="w-3 h-3 text-emerald-900/70" />
          </div>
          <span className="text-[10px] text-emerald-900/70 font-black uppercase tracking-widest">{label}</span>
       </div>
       <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${getIconColor(direction)}`}>
          {direction}
       </div>
    </div>
  );
}
