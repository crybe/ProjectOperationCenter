import { useState, useEffect, useCallback } from 'react';
import { 
  Zap, Activity, Clock, MessageSquare, Brain, 
  ShieldCheck, AlertTriangle, ChevronRight, Sparkles,
  Bot, Terminal, Cpu, Workflow
} from 'lucide-react';
import { SectionCard } from '../components/ui';
import { useApi } from '../hooks/useApi';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface ThoughtEntry {
  id: string;
  timestamp: string;
  action: string;
  rationale: string;
  category: 'automation' | 'security' | 'hardware' | 'optimization';
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  impact_score: number;
  alternatives?: string[];
  tech_specs?: Record<string, string>;
  source?: string;
  causal_chain?: string[];
  target_route?: string;
}

// Helper for Mini-Sparklines
function Sparkline({ color = 'rose' }: { color?: string }) {
  return (
    <div className="flex items-end gap-[1px] h-4 w-12 opacity-60">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ height: "20%" }}
          animate={{ height: `${20 + Math.random() * 80}%` }}
          transition={{ repeat: Infinity, duration: 1 + Math.random(), repeatType: "reverse" }}
          className={`w-[3px] rounded-full bg-${color}-500/40`}
        />
      ))}
    </div>
  );
}

export function IntelligenceFeed({ apiFetch }: any) {
  const [thoughts, setThoughts] = useState<ThoughtEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchIntelligence = useCallback(async () => {
    try {
      const res = await apiFetch('/api/intel/thoughts');
      if (res.ok) {
        // Double check sorting in UI
        const sorted = [...res.thoughts].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setThoughts(sorted);
      } else {
        const mockThoughts: ThoughtEntry[] = [
          {
            id: '1',
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            action: 'REMAPPED_GROWBOX_PORTS',
            rationale: 'Humidity levels exceeded threshold (>75%) while Abluft was inactive. Auto-correcting port assignment for immediate extraction.',
            category: 'hardware',
            impact: 'high',
            confidence: 98.4,
            impact_score: 88,
            source: 'Sentinel_Core_V2',
            target_route: '/growbox',
            causal_chain: [
              'Sensor_Node_4 reports 78% Humidity',
              'Logic_Layer identifies Abluft_Fan_Inactive',
              'Policy_Check: Humidity > 70% requires extraction',
              'Command: Switch Port_3 to Extraction_Mode'
            ],
            alternatives: ['Increase fan speed only', 'Trigger external dehumidifier'],
            tech_specs: { 'VPD_Delta': '0.45 kPa', 'Port_Origin': '3', 'Port_Target': '5' }
          },
          {
            id: '2',
            timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
            action: 'BLOCKED_IP_RANGE_77.42.0.0/16',
            rationale: 'Detected persistent brute-force attempts targeting SSH port 50022 from multiple nodes in this subnet.',
            category: 'security',
            impact: 'medium',
            confidence: 99.9,
            impact_score: 65,
            source: 'Nexus_Shield_Alpha',
            target_route: '/netwatch',
            causal_chain: [
              '142 failed login attempts detected',
              'Origin subnet 77.42.0.0 identified as common source',
              'Anomaly_Score: 92/100',
              'Enforce: Temporary Subnet Block (24h)'
            ],
            alternatives: ['Move SSH Port', 'Enable 2FA strictly'],
            tech_specs: { 'Packets_Analyzed': '14,204', 'Threat_Type': 'Brute_Force', 'Geo': 'Unidentified' }
          }
        ];
        setThoughts(mockThoughts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      }
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchIntelligence();
    const t = setInterval(fetchIntelligence, 30000);
    return () => clearInterval(t);
  }, [fetchIntelligence]);

  return (
    <div className="animate-fade-in relative z-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Main Feed */}
        <div className="lg:col-span-8 space-y-8">
           {/* Terminal Header */}
           <div className="bg-emerald-950/20 border border-emerald-600/30 rounded-2xl p-6 flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                 <div className="w-3 h-3 bg-emerald-600 rounded-full animate-pulse" />
                 <h3 className="text-xs font-black text-emerald-500 uppercase tracking-[0.5em]">Live_Tactical_Stream :: {thoughts.length} Nodes</h3>
              </div>
              <div className="flex items-center gap-3 font-mono text-[9px] text-emerald-900">
                 <span>[ SORT: NEWEST_FIRST ]</span>
                 <div className="w-20 h-[1px] bg-emerald-900/20" />
                 <span>[ UPLINK_STABLE ]</span>
              </div>
           </div>

           <div className="space-y-10">
                {thoughts.map((thought) => {
                  const isExpanded = expandedId === thought.id;
                  return (
                    <div 
                      key={thought.id} 
                      className={`bg-black/60 border transition-all duration-500 shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative overflow-hidden group ${
                        isExpanded ? 'border-emerald-500 rounded-[3rem]' : 'border-emerald-900/20 rounded-[2rem] hover:border-emerald-600/40'
                      }`}
                    >
                      <div className="absolute inset-0 scan-overlay opacity-5 pointer-events-none" />
                      
                      <div className="p-10 lg:p-14">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 mb-12 relative z-10">
                           <div className="flex items-center gap-8">
                              <div className={`p-6 rounded-[2rem] bg-emerald-600/5 border border-emerald-600/20 shadow-xl ${
                                thought.category === 'security' ? 'text-amber-500' : 
                                thought.category === 'hardware' ? 'text-emerald-500' : 'text-emerald-500'
                              }`}>
                                 {thought.category === 'security' ? <ShieldCheck className="w-10 h-10" /> : 
                                  thought.category === 'hardware' ? <Cpu className="w-10 h-10" /> : <Sparkles className="w-10 h-10" />}
                              </div>
                              <div>
                                 <div className="flex items-center gap-4 mb-2">
                                    <span className="text-[10px] text-emerald-900 font-black uppercase tracking-[0.4em]">{thought.source}</span>
                                    <div className="w-6 h-[1px] bg-emerald-900/20" />
                                    <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full">{thought.confidence}% CONFIDENCE</span>
                                 </div>
                                 <h4 className="text-3xl font-black text-emerald-500 uppercase tracking-tighter italic leading-none">{thought.action}</h4>
                                 <div className="flex items-center gap-3 mt-4">
                                    <Clock className="w-4 h-4 text-emerald-950" />
                                    <span className="text-[11px] text-emerald-950 font-black uppercase tracking-widest">{new Date(thought.timestamp).toLocaleString()}</span>
                                 </div>
                              </div>
                           </div>
                           <div className="flex lg:flex-col items-center lg:items-end gap-4">
                              <div className={`px-5 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-[0.2em] shadow-lg ${
                                thought.impact === 'high' ? 'bg-emerald-600 text-black border-emerald-600' : 'bg-emerald-950/20 border-emerald-900/30 text-emerald-900'
                              }`}>
                                 {thought.impact}_IMPACT
                              </div>
                              <button 
                                onClick={() => setExpandedId(isExpanded ? null : thought.id)}
                                className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all font-black uppercase tracking-widest text-[10px] ${isExpanded ? 'bg-emerald-600 border-emerald-600 text-black' : 'border-emerald-900/30 text-emerald-500 hover:bg-emerald-600/5'}`}
                              >
                                 {isExpanded ? '[ CLOSE_CORE ]' : '[ OPEN_THOUGHT_CORE ]'}
                                 <ChevronRight className={`w-4 h-4 transition-transform duration-500 ${isExpanded ? 'rotate-90' : ''}`} />
                              </button>
                           </div>
                        </div>

                        <div className="p-10 bg-emerald-950/5 border-l-8 border-emerald-600 rounded-r-[3rem] relative z-10 mb-8">
                           <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-4 opacity-40">
                                 <Brain className="w-6 h-6 text-emerald-600" />
                                 <span className="text-sm font-black text-emerald-600 uppercase tracking-[0.5em]">Executive_Reasoning:</span>
                              </div>
                              <Sparkline color={thought.category === 'security' ? 'amber' : thought.category === 'hardware' ? 'emerald' : 'rose'} />
                           </div>
                           <p className="text-2xl text-emerald-400 font-medium leading-relaxed italic drop-shadow-2xl">
                             "{thought.rationale}"
                           </p>
                        </div>

                        {/* Quick Action Bar */}
                        <div className="flex flex-wrap items-center gap-4 mt-12 relative z-10">
                           <button 
                             onClick={() => thought.target_route && navigate(thought.target_route)}
                             className="flex items-center gap-3 px-6 py-4 bg-emerald-600/5 border border-emerald-600/20 rounded-2xl text-emerald-500 font-black uppercase tracking-widest text-[11px] hover:bg-emerald-600 hover:text-black transition-all group/btn shadow-xl"
                           >
                              <Zap className="w-5 h-5 group-hover/btn:scale-125 transition-transform" /> Jump_To_Module
                           </button>
                           <button className="flex items-center gap-3 px-6 py-4 bg-black/40 border border-emerald-900/20 rounded-2xl text-emerald-900 font-black uppercase tracking-widest text-[11px] hover:border-emerald-600/40 hover:text-emerald-600 transition-all">
                              <Activity className="w-5 h-5" /> Re-Evaluate
                           </button>
                           <button className="flex items-center gap-3 px-6 py-4 bg-black/40 border border-emerald-900/20 rounded-2xl text-emerald-900 font-black uppercase tracking-widest text-[11px] hover:border-emerald-600/40 hover:text-emerald-600 transition-all">
                              <ShieldCheck className="w-5 h-5" /> Acknowledge
                           </button>
                        </div>

                        {/* Collapsible Deep Intel */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                               <div className="pt-14 mt-14 border-t border-emerald-900/10 space-y-14">
                                  
                                  {/* Live Pulse Terminal Integration */}
                                  <div className="space-y-6">
                                     <h5 className="text-xs font-black text-emerald-900 uppercase tracking-[0.5em] flex items-center gap-4">
                                        <Terminal className="w-5 h-5" /> Live_Decision_Pulse
                                     </h5>
                                     <div className="bg-black/80 rounded-3xl p-8 border border-emerald-900/20 font-mono text-[10px] leading-loose shadow-inner relative overflow-hidden group">
                                        <div className="absolute inset-0 scanner-line opacity-10 pointer-events-none" />
                                        <div className="space-y-1 relative z-10">
                                           <div className="text-emerald-500/60">[ OK ] FETCHING_SENSOR_DATA_STREAM...</div>
                                           <div className="text-gray-600">{" >> "} ANALYZING_PATTERNS_IN_REALTIME</div>
                                           <div className="text-emerald-500/60">[ ALERT ] THRESHOLD_BREACH_DETECTED</div>
                                           <div className="text-emerald-500/60">[ OK ] SELECTING_OPTIMAL_COUNTER_MEASURE</div>
                                           <div className="text-emerald-500 font-black flex items-center gap-2">
                                              <div className="w-1 h-3 bg-emerald-500 animate-pulse" /> 
                                              EXECUTION_COMPLETE: {thought.action}
                                           </div>
                                        </div>
                                     </div>
                                  </div>

                                  {/* Causal Chain Visualization */}
                                  <div className="space-y-8">
                                     <h5 className="text-xs font-black text-emerald-900 uppercase tracking-[0.5em] flex items-center gap-4">
                                        <Workflow className="w-5 h-5" /> Logic_Chain_Sequence
                                     </h5>
                                     <div className="relative pl-10 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-emerald-900/20">
                                        {thought.causal_chain?.map((step, i) => (
                                          <div key={i} className="relative flex items-center gap-6 group/step">
                                             <div className="absolute left-[-29px] w-6 h-6 rounded-full bg-black border-2 border-emerald-900/40 flex items-center justify-center z-10 group-hover/step:border-emerald-600 transition-colors">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600/40 group-hover/step:bg-emerald-600" />
                                             </div>
                                             <div className="flex-1 p-5 bg-emerald-600/5 border border-emerald-600/10 rounded-2xl hover:bg-emerald-600/10 transition-colors">
                                                <span className="text-[10px] text-emerald-900 font-black uppercase tracking-widest mr-4 opacity-40">Step_0{i+1}</span>
                                                <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">{step}</span>
                                             </div>
                                          </div>
                                        ))}
                                     </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                     {/* Technical Specs */}
                                     <div className="space-y-6">
                                        <h5 className="text-xs font-black text-emerald-900 uppercase tracking-[0.5em] flex items-center gap-4">
                                           <Terminal className="w-5 h-5" /> Technical_Context
                                        </h5>
                                        <div className="grid grid-cols-1 gap-4">
                                           {Object.entries(thought.tech_specs || {}).map(([key, val]) => (
                                             <div key={key} className="flex items-center justify-between p-5 bg-black/40 border border-emerald-900/10 rounded-2xl group/spec hover:border-emerald-600/30 transition-all">
                                                <div className="flex items-center gap-3">
                                                   <span className="text-[11px] text-emerald-900 font-black uppercase tracking-[0.2em]">{key}</span>
                                                   <Sparkline color={thought.category === 'security' ? 'amber' : 'rose'} />
                                                </div>
                                                <span className="text-xs font-mono font-black text-emerald-500 group-hover/spec:glow-emerald">{val}</span>
                                             </div>
                                           ))}
                                        </div>
                                     </div>

                                     {/* Strategic Evaluation */}
                                     <div className="space-y-6">
                                        <h5 className="text-xs font-black text-emerald-900 uppercase tracking-[0.5em] flex items-center gap-4">
                                           <Activity className="w-5 h-5" /> Strategic_Delta
                                        </h5>
                                        <div className="p-8 bg-emerald-600/5 border border-emerald-600/20 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                                           <div className="absolute inset-0 scan-overlay opacity-10" />
                                           <div className="flex justify-between items-center mb-6">
                                              <span className="text-[10px] text-emerald-900 font-black uppercase tracking-widest">Efficiency_Score</span>
                                              <span className="text-xl font-black text-emerald-500 italic">{thought.impact_score}/100</span>
                                           </div>
                                           <div className="h-2 w-full bg-emerald-950/30 rounded-full overflow-hidden mb-10 border border-emerald-900/10">
                                              <div className="h-full bg-emerald-500 glow-emerald" style={{ width: `${thought.impact_score}%` }} />
                                           </div>
                                           <p className="text-[10px] text-emerald-900 font-black uppercase tracking-[0.4em] mb-6 opacity-40">Counter_Measures_Pruned:</p>
                                           <div className="flex flex-wrap gap-3">
                                              {thought.alternatives?.map((alt, i) => (
                                                <span key={i} className="px-4 py-2 bg-emerald-950/40 border border-emerald-900/30 rounded-xl text-[10px] text-emerald-900/80 font-black uppercase tracking-wider">{alt}</span>
                                              ))}
                                           </div>
                                        </div>
                                     </div>
                                  </div>
                               </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })}
           </div>
        </div>

        {/* AI Stats & Status */}
        <div className="lg:col-span-4 space-y-12">
           <SectionCard title="Agent_Telemetry" icon={Bot}>
              <div className="space-y-10">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="p-8 bg-black/60 border border-emerald-900/10 rounded-[2.5rem] text-center group hover:border-emerald-600/30 transition-all shadow-xl relative overflow-hidden">
                       <div className="absolute inset-0 scan-overlay opacity-5" />
                       <p className="text-[10px] text-emerald-900 font-black uppercase mb-3 tracking-widest">Decisions_24h</p>
                       <p className="text-5xl font-black text-emerald-500 italic leading-none">42</p>
                    </div>
                    <div className="p-8 bg-black/60 border border-emerald-900/10 rounded-[2.5rem] text-center group hover:border-emerald-600/30 transition-all shadow-xl relative overflow-hidden">
                       <div className="absolute inset-0 scan-overlay opacity-5" />
                       <p className="text-[10px] text-emerald-900 font-black uppercase mb-3 tracking-widest">Conf_Level</p>
                       <p className="text-5xl font-black text-emerald-500 italic leading-none">99%</p>
                    </div>
                 </div>

                 <div className="p-10 bg-emerald-600/5 border border-emerald-600/20 rounded-[3rem] relative overflow-hidden group shadow-[0_0_50px_rgba(225,29,72,0.1)]">
                    <div className="absolute inset-0 scan-overlay opacity-10" />
                    <div className="flex items-center gap-5 mb-8 relative z-10">
                       <div className="p-3 bg-emerald-600/10 rounded-2xl"><Terminal className="w-6 h-6 text-emerald-500" /></div>
                       <h4 className="text-sm font-black text-emerald-500 uppercase tracking-[0.5em]">Buffer_Stability</h4>
                    </div>
                    <div className="space-y-8 relative z-10">
                       <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-emerald-900">
                          <span>Context_Retention</span>
                          <span className="text-emerald-500">88%</span>
                       </div>
                       <div className="h-2.5 w-full bg-emerald-950/20 rounded-full overflow-hidden border border-emerald-900/10 p-[2px]">
                          <div className="h-full bg-emerald-600 glow-emerald rounded-full w-[88%] animate-pulse shadow-[0_0_15px_rgba(225,29,72,0.8)]" />
                       </div>
                       <div className="p-6 bg-black/60 rounded-3xl border border-emerald-900/10 font-mono text-[11px] text-emerald-900 leading-[2] shadow-inner">
                          MODEL: GEMINI-PRO-CUSTOM<br/>
                          STATE: CONTINUOUS_LEARN<br/>
                          NODES: 12_DISTRIBUTED<br/>
                          LATENCY: 142ms<br/>
                          UPTIME: 14d 02h 12m
                       </div>
                    </div>
                 </div>

                 <div className="p-10 bg-black/60 border border-emerald-900/20 rounded-[3rem] relative overflow-hidden shadow-2xl group hover:border-amber-600/40 transition-all">
                    <div className="flex items-center gap-5 mb-8">
                       <div className="p-3 bg-amber-600/10 rounded-2xl"><AlertTriangle className="w-6 h-6 text-amber-600 animate-pulse" /></div>
                       <h4 className="text-sm font-black text-amber-600 uppercase tracking-[0.5em]">Strategic_Alerts</h4>
                    </div>
                    <div className="p-8 bg-amber-600/5 border border-amber-600/20 rounded-3xl group-hover:bg-amber-600/10 transition-all">
                       <p className="text-[11px] text-amber-600 font-black uppercase tracking-widest leading-relaxed italic">System_Optimal. No immediate human intervention required. 14 background optimizations running.</p>
                    </div>
                 </div>
              </div>
           </SectionCard>
        </div>

      </div>
    </div>
  );
}
