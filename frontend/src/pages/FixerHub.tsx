import { useState, useEffect, useCallback } from 'react';
import { 
  Wrench, ShieldCheck, Activity, AlertTriangle, Clock, Terminal,
  RefreshCw, CheckCircle2, ShieldAlert, Cpu, Box, Database, FileText, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApi } from '../hooks/useApi';
import { SectionCard, BackTrackLoading, CRTScreen, StatusBadge } from '../components/ui';
import mascotAerith from '../assets/mascot_aerith.png';

interface FixEntry {
  ts: string;
  cat: string;
  action: string;
  status: string;
  result: string;
  details: string;
}

export default function FixerHub() {
  const apiFetch = useApi();
  const [fixes, setFixes] = useState<FixEntry[]>([]);
  const [systemState, setSystemState] = useState<any>(null);
  const [securityIps, setSecurityIps] = useState<any>({ banned: [], whitelisted: [] });
  const [reports, setReports] = useState<string[]>([]);
  const [selectedReport, setSelectedReport] = useState<{filename: string, content: string} | null>(null);
  const [healings, setHealings] = useState<any[]>([]);
  const [history, setHistory] = useState<number[]>(new Array(20).fill(0));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFixes = useCallback(async () => {
    setRefreshing(true);
    try {
      const [fixesData, stateData, ipsData, reportsData, healData] = await Promise.all([
        apiFetch('/api/system/fixes'),
        apiFetch('/api/system/state'),
        apiFetch('/api/system/security/ips'),
        apiFetch('/api/system/reports'),
        apiFetch('/api/sentinel/healing')
      ]);
      if (Array.isArray(fixesData)) setFixes(fixesData);
      if (stateData) {
        setSystemState(stateData);
        setHistory(prev => [...prev.slice(1), stateData.security?.requests_1m || 0]);
      }
      if (healData?.healings) setHealings(healData.healings);
      if (ipsData) setSecurityIps(ipsData);
      if (reportsData?.reports) setReports(reportsData.reports);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchFixes();
    const t = setInterval(fetchFixes, 60000);
    return () => clearInterval(t);
  }, [fetchFixes]);

  const openReport = async (filename: string) => {
    try {
      const data = await apiFetch(`/api/system/reports/${filename}`);
      if (data) setSelectedReport(data);
    } catch (err) {
      alert("Failed to load report.");
    }
  };

  if (loading) return (
    <div className="w-full min-h-screen bg-black flex items-center justify-center">
      <BackTrackLoading label="Accessing_Repair_Logs..." />
    </div>
  );

  const successCount = fixes.filter(f => f.status === 'SUCCESS' || f.status === 'EXECUTED').length;
  const criticalCount = fixes.filter(f => f.cat === 'CRITICAL').length;

  return (
    <div className="w-full space-y-16 pb-32 animate-fade-in relative bg-transparent">
      {/* Decorative background scanning line */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-10">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-emerald-600 animate-[scan-vertical_12s_linear_infinite]" />
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 relative z-10">
        <div className="space-y-4">
          <div className="flex items-center gap-6">
             <div className="p-4 rounded-3xl glass-panel border border-emerald-600/20 group relative overflow-hidden">
                <div className="absolute inset-0 scan-overlay opacity-10" />
                <Wrench className="w-10 h-10 text-emerald-600 relative z-10 group-hover:rotate-45 transition-transform duration-500" />
             </div>
             <div>
                <div className="flex items-center gap-3 mb-1">
                   <div className="h-[1px] w-8 bg-emerald-600/30" />
                   <span className="text-tactical-label opacity-40">Module: AUTO-FIXER</span>
                </div>
                <h2 className="text-4xl sm:text-5xl font-black text-emerald-500 tracking-tighter uppercase italic flex items-center gap-5 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                  Repair<span className="text-emerald-700">_Intelligence</span>
                </h2>
                <p className="text-tactical-label mt-3 opacity-30">Autonomous Fault Detection & Mitigation Ledger</p>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
           <div className="flex flex-col items-end">
             <span className="text-[10px] text-emerald-900 font-black uppercase tracking-widest mb-1 opacity-50">Operational_Success</span>
             <span className="text-xl font-black text-emerald-500 glow-emerald tracking-widest">{successCount} FIXES</span>
           </div>
           <button onClick={fetchFixes} className="p-5 glass-panel border-emerald-600/30 text-emerald-500 hover:text-emerald-400 hover:border-emerald-600 transition-all shadow-2xl rounded-2xl group relative overflow-hidden">
              <div className="absolute inset-0 bg-emerald-600/5 group-hover:bg-emerald-600/10 transition-all" />
              <RefreshCw className={`w-6 h-6 relative z-10 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
           </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        <StatCard label="Autonomous Repairs" value={successCount} icon={ShieldCheck} color="emerald" />
        <StatCard label="Critical Interventions" value={criticalCount} icon={ShieldAlert} color="rose" />
        <StatCard label="Scan Intervals" value="30m" icon={Activity} color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
         <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <HeuristicStat label="Database_Stability" value="99.2%" status="OPTIMIZED" icon={Database} />
            <HeuristicStat label="Network_Traffic" value={`${systemState?.security?.requests_1m || 0} RPM`} status="LIVE" icon={Activity} />
            <HeuristicStat label="Threat_Level" value={systemState?.security?.threat_level || 'LOW'} status={systemState?.security?.threat_level === 'LOW' ? 'NOMINAL' : 'ALERT'} icon={ShieldAlert} />
            <HeuristicStat 
               label="Security_Index" 
               value={systemState?.security?.status || 'CALC...'} 
               status={`${systemState?.security?.failed_logins_1h || 0} FAIL | ${systemState?.security?.banned_count || 0} BANNED`} 
               icon={ShieldCheck} 
            />
         </div>
         <div className="lg:col-span-4">
            <div className="p-6 glass-panel border border-emerald-500/20 bg-emerald-500/5 rounded-3xl h-full flex flex-col justify-between">
               <div>
                  <div className="flex items-center gap-3 mb-4">
                     <ShieldCheck className="w-4 h-4 text-emerald-500" />
                     <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Guardian_Protocol</h4>
                  </div>
                  <p className="text-[11px] text-emerald-100 font-bold leading-relaxed">
                     Self-Healing Infrastructure ist aktiv. {healings.length} Eingriffe in den letzten 24h verzeichnet.
                  </p>
               </div>
               <div className="mt-6 space-y-2">
                  {healings.slice(0, 2).map((h, i) => (
                     <div key={i} className="flex justify-between items-center text-[8px] font-black uppercase text-emerald-900/60">
                        <span>{h.type.split('_')[0]}</span>
                        <span className="text-emerald-500">{new Date(h.ts).toLocaleTimeString()}</span>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8">
            <SectionCard title="Live_Threat_Radar" icon={Activity}>
               <div className="h-48 w-full flex items-end gap-1 px-4 pb-4 bg-emerald-950/10 rounded-2xl border border-emerald-900/10 overflow-hidden relative group">
                  <div className="absolute inset-0 scan-overlay opacity-10" />
                  <div className="absolute top-4 left-4 text-[9px] font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                     Realtime_Traffic_Analytics
                  </div>
                  {history.map((val, i) => (
                     <motion.div 
                       key={i}
                       initial={{ height: 0 }}
                       animate={{ height: `${Math.min(100, (val / 100) * 100)}%` }}
                       className="flex-1 bg-emerald-600/20 border-t border-emerald-500 group-hover:bg-emerald-500/40 transition-colors"
                     />
                  ))}
                  <div className="absolute bottom-6 right-6 text-right">
                     <span className="text-4xl font-black text-emerald-500 italic opacity-20 tracking-tighter">
                        {systemState?.security?.requests_1m || 0} RPM
                     </span>
                  </div>
               </div>
            </SectionCard>
         </div>

         <div className="lg:col-span-4">
            <SectionCard title="Active_Containments" icon={ShieldAlert}>
               <div className="space-y-4 max-h-[192px] overflow-y-auto custom-scrollbar pr-2">
                  {securityIps.banned.length === 0 ? (
                     <div className="py-12 text-center opacity-20">
                        <ShieldCheck className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-[9px] font-black uppercase tracking-widest">No Active Bans</p>
                     </div>
                  ) : (
                     securityIps.banned.map((ban: any, idx: number) => (
                        <div key={idx} className="p-4 glass-panel border border-rose-500/20 bg-rose-500/5 rounded-xl group relative overflow-hidden">
                           <div className="absolute inset-0 bg-gradient-to-r from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                           <div className="flex justify-between items-start mb-2 relative z-10">
                              <span className="text-[11px] font-black text-rose-500 font-mono tracking-tight">{ban.ip}</span>
                              <span className="text-[8px] font-black text-rose-900 uppercase">Containment_Active</span>
                           </div>
                           <div className="space-y-2 relative z-10">
                              <p className="text-[9px] text-emerald-900/60 font-bold italic">Reason: {ban.reason} ({ban.attempts || 0} Attempts)</p>
                              {ban.targets && ban.targets.length > 0 && (
                                 <div className="flex flex-wrap gap-1 mt-1">
                                    <span className="text-[8px] text-rose-400 font-black uppercase">Targets:</span>
                                    {ban.targets.map((t: string) => (
                                       <span key={t} className="px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded text-[8px] font-mono text-rose-300">{t}</span>
                                    ))}
                                 </div>
                              )}
                              <p className="text-[8px] text-emerald-900/40 font-mono uppercase border-t border-rose-500/10 pt-1">Expiry: {new Date(ban.expiry).toLocaleString()}</p>
                           </div>
                        </div>
                     ))
                  )}
               </div>
            </SectionCard>
         </div>
      </div>

      {/* Main Ledger */}
      <SectionCard title="System_Mitigation_Ledger" icon={Terminal}>
        <div className="relative group">
           <div className="absolute -left-12 top-0 bottom-0 w-[1px] bg-emerald-900/10 hidden md:block" />
           
           <CRTScreen>
              <div className="p-0 md:p-4 max-h-[600px] overflow-y-auto custom-scrollbar bg-black/40">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="text-emerald-900/50 uppercase tracking-[0.2em] font-black text-[9px] border-b border-emerald-900/10">
                          <th className="p-6">Timestamp</th>
                          <th className="p-6">Operation</th>
                          <th className="p-6">Status</th>
                          <th className="p-6">Intel_Context</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-900/5">
                       <AnimatePresence mode="popLayout">
                          {fixes.map((fix, idx) => (
                             <motion.tr 
                               key={`${fix.ts}-${idx}`}
                               initial={{ opacity: 0, x: -10 }}
                               animate={{ opacity: 1, x: 0 }}
                               transition={{ delay: idx * 0.05 }}
                               className="group hover:bg-emerald-600/[0.03] transition-all"
                             >
                                <td className="p-6">
                                   <div className="flex items-center gap-3">
                                      <Clock className="w-3.5 h-3.5 text-emerald-900/40" />
                                      <span className="text-[10px] font-mono text-emerald-900 font-bold">{fix.ts}</span>
                                   </div>
                                </td>
                                <td className="p-6">
                                   <div className="flex flex-col">
                                      <span className="text-[11px] font-black text-emerald-500 uppercase tracking-tight">{fix.action}</span>
                                      <span className={`text-[8px] font-black uppercase tracking-widest mt-1 ${fix.cat === 'CRITICAL' ? 'text-rose-500' : 'text-emerald-900'}`}>{fix.cat}</span>
                                   </div>
                                </td>
                                <td className="p-6">
                                   <StatusBadge 
                                     status={fix.status === 'SUCCESS' || fix.status === 'EXECUTED' ? 'active' : (fix.status === 'FAILED' ? 'error' : 'offline')} 
                                     text={fix.status}
                                   />
                                </td>
                                <td className="p-6">
                                   <p className="text-[10px] text-emerald-900/70 font-bold leading-relaxed max-w-md italic">
                                      {fix.result} <span className="opacity-40 ml-2">{fix.details}</span>
                                   </p>
                                </td>
                             </motion.tr>
                          ))}
                       </AnimatePresence>
                       
                       {fixes.length === 0 && (
                          <tr>
                             <td colSpan={4} className="p-20 text-center">
                                <div className="flex flex-col items-center opacity-20">
                                   <ShieldCheck className="w-12 h-12 mb-4" />
                                   <p className="text-[10px] font-black uppercase tracking-[0.4em]">No Repair Operations Logged</p>
                                </div>
                             </td>
                          </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </CRTScreen>

           {/* Decorative Ornament */}
           <img src={mascotAerith} className="absolute -right-20 -bottom-20 w-80 opacity-5 pointer-events-none" alt="Aerith" />
        </div>
      </SectionCard>

      {/* Methodology Log (Sauberes Log des Vorgehens) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
         <SectionCard title="Repair_Methodology" icon={Cpu}>
            <div className="space-y-6">
               <MethodItem 
                 step="01" 
                 label="Deep_Node_Scan" 
                 desc="Checking Docker containers, SQLite databases, and external network gateways." 
                 active 
               />
               <MethodItem 
                 step="02" 
                 label="Heuristic_Analysis" 
                 desc="Predicting resource depletion and detecting anomalous error patterns." 
                 active 
               />
               <MethodItem 
                 step="03" 
                 label="Safe_Mitigation" 
                 desc="Autonomous execution of VACUUM, Log-Truncate, and DNS-Repair protocols." 
                 active 
               />
               <MethodItem 
                 step="04" 
                 label="Emergency_Handshake" 
                 desc="Critical restarts and risky actions are escalated to the human operator." 
                 active 
               />
            </div>
         </SectionCard>

         <div className="p-10 glass-panel border-emerald-600/20 rounded-3xl flex flex-col justify-center items-center text-center space-y-6 relative overflow-hidden">
            <div className="absolute inset-0 scan-overlay opacity-10" />
            <div className="p-4 bg-emerald-600/10 rounded-full border border-emerald-600/30">
               <ShieldCheck className="w-12 h-12 text-emerald-500 glow-emerald" />
            </div>
            <h3 className="text-2xl font-black text-emerald-500 uppercase italic tracking-tighter">System_Integrity: SECURE</h3>
            <p className="text-[10px] text-emerald-900 font-black uppercase tracking-widest leading-relaxed max-w-xs">
               The autonomous repair engine is active. All system modifications are being verified against local stability protocols.
            </p>
            <div className="h-[1px] w-full bg-emerald-900/10 my-4" />
            <span className="text-[8px] font-mono text-emerald-950">NODE_VERSION: SHINRA_GATE_v14.5.1_FIXER</span>
         </div>
      </div>

    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  const colors: any = {
    rose: 'text-emerald-500 border-emerald-600/20 bg-emerald-600/5',
    emerald: 'text-emerald-500 border-emerald-600/20 bg-emerald-600/5',
    indigo: 'text-cyan-500 border-cyan-500/20 bg-cyan-500/5',
  };
  return (
    <div className={`p-8 glass-card border flex items-center gap-8 shadow-2xl transition-all hover:scale-[1.02] reactive-border group relative overflow-hidden ${colors[color]}`}>
      <div className="absolute inset-0 scan-overlay opacity-[0.03] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-[1px] bg-emerald-600/20 animate-[scan-vertical_8s_linear_infinite]" />
      
      <div className="p-4 rounded-2xl bg-emerald-600/5 border border-emerald-900/10 holo-icon relative overflow-hidden">
        <div className="absolute inset-0 scan-overlay opacity-10" />
        <Icon className="w-8 h-8 relative z-10" />
      </div>
      <div className="relative z-10">
        <p className="text-tactical-label mb-2 opacity-40">{label}</p>
        <h4 className="text-3xl font-black text-emerald-500 tracking-tighter drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] italic">
          {value}
        </h4>
      </div>
    </div>
  );
}

function MethodItem({ step, label, desc, active }: any) {
   return (
      <div className="flex gap-6 group">
         <div className="flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-black text-[10px] transition-all ${active ? 'bg-emerald-600/10 border-emerald-600/30 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-emerald-900/20 text-emerald-900'}`}>
               {step}
            </div>
            <div className="w-[1px] h-full bg-emerald-900/10" />
         </div>
         <div className="pt-1 pb-8">
            <h4 className="text-[11px] font-black text-emerald-500 uppercase tracking-widest mb-2 group-hover:text-emerald-400 transition-colors">{label}</h4>
            <p className="text-[10px] text-emerald-900 font-bold leading-relaxed uppercase opacity-60 italic">{desc}</p>
         </div>
      </div>
   );
}
function HeuristicStat({ label, value, status, icon: Icon }: any) {
   return (
      <div className="p-6 glass-panel border border-emerald-600/10 rounded-2xl relative overflow-hidden group">
         <div className="absolute inset-0 scan-overlay opacity-5" />
         <div className="flex items-center gap-4 mb-4">
            <div className="p-2 bg-emerald-600/10 rounded-lg">
               <Icon className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-900/60">{label}</span>
         </div>
         <div className="flex justify-between items-end">
            <span className="text-2xl font-black text-emerald-500 tracking-tighter italic">{value}</span>
            <span className="text-[8px] font-black text-emerald-600 px-2 py-0.5 bg-emerald-600/10 rounded-md border border-emerald-600/20">{status}</span>
         </div>
      </div>
   );
}
