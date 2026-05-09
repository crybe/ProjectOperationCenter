import React, { useState, useEffect } from 'react';
import { IntelligenceCenter } from '../Intelligence-worker/IntelligenceCenter';
import { IntelligenceFeed } from '../Intelligence-worker/IntelligenceFeed';
import { useApi } from '../hooks/useApi';
import {
   Brain, Shield, Terminal, ScrollText, Activity,
   MessageSquare, Lock, Database, Search, Cpu,
   Sparkles, Layers, Zap, TrendingUp, AlertTriangle
} from 'lucide-react';
import { AuditLogViewer } from '../components/AuditLogViewer';
import mascotAerith from '../assets/mascot_aerith.png';
import { motion, AnimatePresence } from 'framer-motion';
import { CRTScreen } from '../components/ui';

/**
 * P.I.G.E.O.N. Master Log - Tactical_OS Strategic Report View.
 * Redesigned for vertical, high-fidelity storytelling based on the tactical hub aesthetic.
 */
export default function PigeonLog() {
   const apiFetch = useApi();
   
   return (
      <div className="w-full min-h-screen pb-48 animate-fade-in relative bg-black selection:bg-emerald-500/30">
         {/* Mascot Backdrop Integration */}
         <div className="fixed inset-0 pointer-events-none z-0 opacity-20 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black z-10" />
            <div className="absolute inset-0 bg-black/40 z-20" />
            <img 
               src="/ui/bg_tactical.jpg" 
               className="w-full h-full object-cover scale-110 blur-[2px]" 
               alt="Backdrop" 
            />
         </div>

         {/* Grid & Scanlines Overlay */}
         <div className="fixed inset-0 pointer-events-none z-10 opacity-[0.05]">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(204,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(204,0,0,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />
            <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-600 animate-[scan-vertical_15s_linear_infinite]" />
         </div>

         <div className="relative z-20 max-w-7xl mx-auto px-6 pt-12 md:pt-24">
            
            {/* Tactical Header & Metrics */}
            <div className="flex flex-col lg:flex-row justify-between items-start gap-12 mb-32">
               <div className="space-y-8">
                  <div className="flex items-center gap-6 md:gap-8">
                     <div className="p-5 rounded-3xl glass-panel border border-emerald-600/30 group relative overflow-hidden shadow-[0_0_50px_rgba(225,29,72,0.15)]">
                        <div className="absolute inset-0 scan-overlay opacity-20" />
                        <Brain className="w-14 h-14 text-emerald-600 relative z-10 group-hover:scale-110 transition-transform duration-500" />
                     </div>
                     <div>
                        <div className="flex items-center gap-4 mb-3">
                           <div className="h-[1px] w-16 bg-emerald-600/40" />
                           <span className="text-tactical-label tracking-[0.6em]">Intelligence_Node: PGN-MASTER</span>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black text-emerald-500 tracking-tighter uppercase italic drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] leading-none">
                           P.I.G.E.O.N.<span className="text-emerald-700">_LOG</span>
                        </h1>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                     <button className="px-12 py-5 bg-emerald-600 text-black font-black uppercase text-xs tracking-[0.5em] rounded-2xl hover:bg-emerald-500 transition-all shadow-[0_0_60px_rgba(225,29,72,0.4)] group relative overflow-hidden active:scale-95">
                        <div className="absolute inset-0 scanner-line opacity-20" />
                        <span className="relative z-10">START ENGINE</span>
                     </button>
                     <div className="px-8 py-5 glass-panel border-emerald-900/20 text-[11px] font-black text-emerald-900 uppercase tracking-[0.3em] flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                        Neural_Link: <span className="text-emerald-500">Active</span>
                     </div>
                  </div>
               </div>

               {/* Tactical Score Matrix (88, 42, 99 Style) */}
               <motion.div 
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 className="grid grid-cols-3 gap-6 w-full lg:w-auto"
               >
                  <MetricBox value="88" label="Core_Lvl" />
                  <MetricBox value="42" label="Sync_Pct" />
                  <MetricBox value="99" label="Stab_Ind" />
               </motion.div>
            </div>

            {/* Vertical Report Stream */}
            <div className="space-y-32 max-w-5xl mx-auto">
               
               {/* 01. CORE ANALYSIS */}
               <ReportSection title="CORE ANALYSIS" icon={Activity} number="01">
                  <div className="space-y-8">
                     <p className="text-lg font-bold text-emerald-400 leading-relaxed uppercase italic tracking-tight">
                        "System-Kernel stabil. Heuristische Analyse zeigt eine Effizienzsteigerung von 12.4% seit dem letzten Zyklus. 
                        Keine kritischen Prozess-Abweichungen im Master-Stream detektiert."
                     </p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-emerald-900/10">
                        <div className="space-y-4">
                           <div className="flex items-center gap-2">
                              <Cpu className="w-4 h-4 text-emerald-500" />
                              <span className="text-tactical-label">Compute_Alloc</span>
                           </div>
                           <p className="text-xs text-emerald-900 leading-relaxed font-bold uppercase tracking-widest opacity-60">
                              Optimierung der Container-Ressourcen für n8n abgeschlossen. Thread-Priorisierung auf Core 0-3 fokussiert.
                           </p>
                        </div>
                        <div className="space-y-4">
                           <div className="flex items-center gap-2">
                              <Database className="w-4 h-4 text-emerald-500" />
                              <span className="text-tactical-label">I/O_Integrity</span>
                           </div>
                           <p className="text-xs text-emerald-900 leading-relaxed font-bold uppercase tracking-widest opacity-60">
                              Atomic-JSON Fallbacks aktiv. Schreibzugriffe auf /data/logs synchronisiert.
                           </p>
                        </div>
                     </div>
                  </div>
               </ReportSection>

               {/* 02. NEURAL SYNC */}
               <ReportSection title="NEURAL SYNC" icon={Brain} number="02">
                  <div className="space-y-8">
                     <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex-1 w-full space-y-4">
                           <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-emerald-500">
                              <span>Sync_Confidence:</span>
                              <span className="glow-emerald">94.2%</span>
                           </div>
                           <div className="h-2 w-full bg-emerald-950/20 rounded-full overflow-hidden border border-emerald-900/10">
                              <div className="h-full bg-emerald-600 glow-emerald w-[94.2%]" />
                           </div>
                        </div>
                        <div className="p-6 glass-panel border-emerald-600/20 rounded-3xl flex flex-col items-center">
                           <span className="text-[24px] font-black text-emerald-500 italic leading-none mb-1">STABLE</span>
                           <span className="text-tactical-label opacity-40 tracking-[0.2em]">Link_State</span>
                        </div>
                     </div>
                     <p className="text-sm text-emerald-900/70 leading-relaxed italic uppercase font-bold">
                        Der neurale Link passt sich kontinuierlich an das operative Muster des Administrators an. 
                        Vorausschauende Ressourcen-Allokation für n8n-Workflows priorisiert.
                     </p>
                  </div>
               </ReportSection>

               {/* 03. SYSTEM DYNAMICS */}
               <ReportSection title="SYSTEM DYNAMICS" icon={Cpu} number="03">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                     <DynamicsCard label="Entropy" value="Low_02" icon={TrendingUp} />
                     <DynamicsCard label="Latency" value="14ms" icon={Activity} />
                     <DynamicsCard label="Jitter" value="0.04" icon={Zap} />
                     <DynamicsCard label="Uptime" value="12D_04H" icon={Layers} />
                  </div>
               </ReportSection>

               {/* 04. PERIMETER DEFENSE */}
               <ReportSection title="PERIMETER DEFENSE" icon={Shield} number="04">
                  <div className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center gap-4">
                           <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                              <Shield className="w-5 h-5" />
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Firewall_Status</p>
                              <p className="text-lg font-black text-emerald-400 italic uppercase">Secure_Link</p>
                           </div>
                        </div>
                        <div className="p-6 bg-emerald-600/5 border border-emerald-600/20 rounded-2xl flex items-center gap-4">
                           <div className="p-3 bg-emerald-600/10 rounded-xl text-emerald-500">
                              <Search className="w-5 h-5" />
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Threat_Scan</p>
                              <p className="text-lg font-black text-emerald-400 italic uppercase">No_Anomalies</p>
                           </div>
                        </div>
                     </div>
                     <p className="text-xs text-emerald-900/50 leading-relaxed italic uppercase font-bold tracking-widest pl-2">
                        Verschlüsselungs-Update: VPN-Verbindung mit militärischem Standard (AES-256) gehärtet.
                     </p>
                  </div>
               </ReportSection>

               {/* 05. INTELLIGENCE FEED */}
               <ReportSection title="TACTICAL FEED" icon={MessageSquare} number="05">
                  <IntelligenceFeed apiFetch={apiFetch} />
               </ReportSection>

               {/* 06. INTEGRITY WATCH (HealthGuard) */}
               <ReportSection title="INTEGRITY WATCH" icon={Lock} number="06">
                  <HealthGuard apiFetch={apiFetch} />
               </ReportSection>

               {/* 07. CORE INTELLIGENCE CENTER */}
               <div className="pt-16">
                  <IntelligenceCenter apiFetch={apiFetch} />
               </div>

                {/* 08. AUDIT LOGS */}
                <ReportSection title="AUDIT_LEDGER" icon={ScrollText} number="08">
                   <div className="space-y-8">
                      <div className="flex items-center justify-between mb-4">
                         <p className="text-tactical-label">Immutable_Event_Stream</p>
                         <span className="text-[10px] text-emerald-950 font-black uppercase tracking-widest font-mono">Live_Sync_Enabled</span>
                      </div>
                      <CRTScreen>
                         <div className="p-4 bg-black/40">
                            <AuditLogViewer apiFetch={apiFetch} />
                         </div>
                      </CRTScreen>
                   </div>
                </ReportSection>

            </div>
         </div>
      </div>
   );
}

function MetricBox({ value, label }: { value: string; label: string }) {
   return (
      <div className="p-8 glass-panel border-emerald-600/20 flex flex-col items-center justify-center min-w-[140px] relative overflow-hidden group shadow-2xl">
         <div className="absolute inset-0 bg-emerald-600/5 group-hover:bg-emerald-600/10 transition-colors" />
         <div className="absolute top-0 left-0 w-full h-[1px] bg-emerald-600/30" />
         <span className="text-5xl font-black text-emerald-500 tracking-tighter mb-2 drop-shadow-[0_2px_12px_rgba(204,0,0,0.6)] italic">{value}</span>
         <span className="text-[9px] font-black text-emerald-900 uppercase tracking-[0.4em] opacity-50">{label}</span>
         <div className="absolute bottom-2 right-2 w-1 h-1 bg-emerald-600 rounded-full opacity-20" />
      </div>
   );
}

function ReportSection({ title, icon: Icon, children, number }: { title: string; icon: any; children: React.ReactNode; number: string }) {
   return (
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        className="relative group"
      >
         {/* Vertical Timeline Artifact */}
         <div className="absolute -left-12 top-0 bottom-0 w-[1px] bg-emerald-900/20 group-hover:bg-emerald-600/40 transition-colors hidden md:block" />
         <div className="absolute -left-[53px] top-0 flex flex-col items-center gap-2 hidden md:flex">
            <div className="w-3 h-3 rounded-full bg-emerald-950 border border-emerald-600/40 group-hover:bg-emerald-600 transition-all duration-500 shadow-[0_0_10px_rgba(225,29,72,0.3)]" />
            <span className="text-[10px] font-black text-emerald-900/40 group-hover:text-emerald-500 transition-colors">{number}</span>
         </div>
         
         <div className="flex items-center gap-6 mb-12">
            <div className="p-3 rounded-xl bg-emerald-600/10 border border-emerald-600/20 shadow-lg relative overflow-hidden group">
               <div className="absolute inset-0 bg-emerald-600/10 animate-[pulse_2s_infinite]" />
               <Icon className="w-5 h-5 text-emerald-600 relative z-10" />
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-emerald-500 uppercase tracking-[0.5em] italic drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] leading-none">{title}</h3>
            <div className="flex-1 h-[1px] bg-emerald-900/10 ml-4 hidden lg:block" />
         </div>
         
         <div className="pl-0 md:pl-12 relative">
            <div className="p-8 md:p-16 glass-panel border border-emerald-600/10 hover:border-emerald-600/30 transition-all duration-700 rounded-[3.5rem] relative overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.7)] bg-black/50 backdrop-blur-3xl group-hover:shadow-[0_40px_90px_rgba(225,29,72,0.1)]">
               <div className="absolute inset-0 scan-overlay opacity-[0.03] pointer-events-none" />
               <motion.img 
                 src={mascotAerith} 
                 className="mascot-ornament" 
                 alt="Mascot Ornament" 
                 animate={{ y: [0, -10, 0] }}
                 transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               />
               <div className="relative z-10">
                  {children}
               </div>
            </div>
         </div>
      </motion.div>
   );
}

function DynamicsCard({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
   return (
      <div className="p-8 bg-emerald-600/[0.03] border border-emerald-900/10 rounded-[2rem] hover:bg-emerald-600/5 hover:border-emerald-600/30 transition-all duration-500 group/card">
         <div className="flex items-center justify-between mb-6">
            <div className="p-2.5 rounded-xl bg-emerald-600/10 text-emerald-900 group-hover/card:text-emerald-500 transition-colors">
               <Icon className="w-4 h-4" />
            </div>
            <div className="status-dots">
               <div className="status-dot active" />
               <div className="status-dot" />
            </div>
         </div>
         <span className="text-tactical-label opacity-40 block mb-2">{label}</span>
         <span className="text-2xl font-black text-emerald-500 tracking-tighter italic drop-shadow-[0_2px_4px_rgba(204,0,0,0.3)]">{value}</span>
      </div>
   );
}

function HealthGuard({ apiFetch }: any) {
   const [password, setPassword] = useState('');
   const [scanning, setScanning] = useState(false);
   const [result, setResult] = useState<any>(null);
   const [error, setError] = useState<string | null>(null);

   const runCheck = async (e: React.FormEvent) => {
      e.preventDefault();
      setScanning(true);
      setError(null);
      setResult(null);

      try {
         const res = await apiFetch('/api/intelligence/guard/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
         });

         if (res.ok) {
            setResult(res);
            setPassword('');
         } else {
            setError(res.error || 'Access Denied.');
         }
      } catch (e: any) {
         setError('Connection failure.');
      } finally {
         setScanning(false);
      }
   };

   return (
      <div className="w-full relative group">
         <div className="flex flex-col lg:flex-row items-stretch min-h-[500px] rounded-[2.5rem] overflow-hidden border border-emerald-900/20">
            {/* Left Side: Input */}
            <div className="lg:w-1/3 p-12 border-r border-emerald-900/20 bg-black/60 relative overflow-hidden">
               <div className="absolute inset-0 scan-overlay opacity-10 pointer-events-none" />
               <div className="flex items-center gap-4 mb-12 relative z-10">
                  <div className="p-3 bg-emerald-600/10 rounded-xl border border-emerald-600/20 shadow-[0_0_15px_rgba(225,29,72,0.2)]">
                     <Lock className="w-6 h-6 text-emerald-500 animate-pulse" />
                  </div>
                  <h3 className="text-sm font-black text-emerald-500 uppercase tracking-widest">Integrity_Guard</h3>
               </div>

               <p className="text-[11px] text-emerald-900 font-black uppercase leading-relaxed mb-12 relative z-10 italic">
                  Sicherheits-Protokoll aktivieren. Die Autorisierung ermöglicht einen tiefen Scan aller kritischen Systempfade und Hardware-Zyklen.
               </p>

               <form onSubmit={runCheck} className="space-y-6 relative z-10">
                  <div className="space-y-2">
                     <label className="text-tactical-label ml-1">Auth_Token</label>
                     <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="********"
                        className="w-full bg-black/60 border border-emerald-900/30 rounded-2xl px-6 py-5 text-emerald-500 text-lg focus:outline-none focus:border-emerald-600 focus:shadow-[0_0_20px_rgba(225,29,72,0.15)] transition-all placeholder:text-emerald-900/20 font-mono"
                     />
                  </div>
                  <button
                     disabled={scanning || !password}
                     className="w-full py-5 bg-emerald-600 text-black font-black uppercase text-xs tracking-[0.4em] rounded-2xl hover:bg-emerald-500 disabled:opacity-20 transition-all shadow-[0_0_40px_rgba(225,29,72,0.4)] active:scale-95"
                  >
                     {scanning ? 'Authenticating...' : 'Execute_Scan'}
                  </button>
               </form>

               {error && (
                  <div className="mt-8 p-6 bg-emerald-600/10 border border-emerald-600/20 rounded-2xl text-[10px] text-emerald-500 font-black uppercase animate-shake flex items-center gap-4">
                     <AlertTriangle className="w-4 h-4" />
                     <span>Error: {error}</span>
                  </div>
               )}
            </div>

            {/* Right Side: Results */}
            <div className="flex-1 p-12 bg-emerald-950/5 relative overflow-hidden">
               <div className="absolute inset-0 scan-overlay opacity-5 pointer-events-none" />
               {!result && !scanning && (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                     <div className="p-12 border-2 border-dashed border-emerald-900/20 rounded-full mb-8">
                        <Terminal className="w-16 h-16 text-emerald-900" />
                     </div>
                     <p className="text-[11px] font-black uppercase tracking-[0.5em] text-emerald-900">Waiting for_Level_2_Clearance...</p>
                  </div>
               )}

               {scanning && (
                  <div className="h-full flex flex-col items-center justify-center">
                     <div className="relative">
                        <div className="w-24 h-24 border-4 border-emerald-600/10 border-t-emerald-600 rounded-full animate-spin mb-10 shadow-[0_0_30px_rgba(225,29,72,0.2)]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                           <Activity className="w-8 h-8 text-emerald-500 animate-pulse" />
                        </div>
                     </div>
                     <p className="text-sm font-black uppercase tracking-[0.5em] text-emerald-500 animate-pulse italic">Deep_Integrity_Scan in progress...</p>
                  </div>
               )}

               {result && (
                  <div className="space-y-10 animate-fade-in relative z-10">
                     <div className="flex items-center justify-between border-b border-emerald-900/20 pb-10">
                        <div>
                           <div className="flex items-center gap-3 mb-2">
                              <Database className="w-4 h-4 text-emerald-900" />
                              <p className="text-tactical-label">Protocol_Outcome</p>
                           </div>
                           <h4 className={`text-5xl font-black uppercase italic tracking-tighter drop-shadow-2xl ${result.status === 'SECURE' ? 'text-emerald-500' : 'text-emerald-500'}`}>
                              {result.status}
                           </h4>
                        </div>
                        <div className="text-right">
                           <p className="text-tactical-label mb-2">Anomalies_Detected</p>
                           <p className="text-5xl font-black text-emerald-500 italic tabular-nums">{result.issues.toString().padStart(2, '0')}</p>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <p className="text-tactical-label ml-1">Analysis_Log</p>
                        <div className="p-10 bg-black/80 rounded-[2.5rem] border border-emerald-900/30 font-mono text-[11px] text-emerald-400 space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar shadow-inner shadow-black relative group">
                           <div className="absolute inset-0 scan-overlay opacity-10 pointer-events-none" />
                           {result.log.split('\n').map((line: string, i: number) => (
                              <div key={i} className="flex gap-8 group/line hover:bg-emerald-500/5 p-1 rounded transition-colors">
                                 <span className="text-emerald-900 font-black opacity-30 select-none min-w-[4ch] tracking-widest">{(i + 1).toString().padStart(2, '0')}</span>
                                 <span className="flex-1 leading-relaxed">{line}</span>
                              </div>
                           ))}
                        </div>
                     </div>

                     <div className="flex items-center justify-between pt-6">
                        <div className="flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                           <span className="text-[10px] text-emerald-950 font-black uppercase tracking-[0.4em]">P.I.G.E.O.N. Guard // Core_v2.5</span>
                        </div>
                        <span className="text-[10px] text-emerald-950 font-black uppercase tracking-widest font-mono">{new Date(result.timestamp * 1000).toLocaleString()}</span>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}
