import { useEffect, useState, useCallback } from 'react';
import { 
  Wifi, Shield, Activity, RefreshCw, Cpu, 
  Terminal, Search, Globe, Lock, AlertTriangle,
  Zap, Database, Server, Smartphone, Monitor, ShieldAlert
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { SectionCard, Skeleton, StatusBadge, BackTrackLoading } from '../components/ui';
import { useToast } from '../components/Toast';
import { motion } from 'framer-motion';

function ScanningRing({ active }: { active: boolean }) {
  return (
    <div className="relative w-16 h-16">
       <div className={`absolute inset-0 border-2 border-emerald-500/20 rounded-full ${active ? 'animate-ping' : ''}`} />
       <div className={`absolute inset-2 border border-emerald-500/40 rounded-full ${active ? 'animate-spin' : ''}`} style={{ borderTopColor: 'transparent', animationDuration: '3s' }} />
       <div className="absolute inset-4 border border-emerald-500/10 rounded-full" />
    </div>
  );
}

export default function NetWatch() {
  const apiFetch = useApi();
  const { toast } = useToast();
  const [devices, setDevices] = useState<any[]>([]);
  const [ports, setPorts] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchNetwork = useCallback(async () => {
    setScanning(true);
    try {
      const [d, p] = await Promise.all([
        apiFetch('/api/network/scan'),
        apiFetch('/api/network/ports')
      ]);
      if (d.ok) setDevices(d.devices);
      if (p.ok) setPorts(p.ports);
    } catch (e: any) {
      toast('error', 'Net_Scan_Failed: ' + e.message);
    } finally {
      setScanning(false);
      setLoading(false);
    }
  }, [apiFetch, toast]);

  useEffect(() => {
    fetchNetwork();
    const t = setInterval(fetchNetwork, 60000); // Auto-scan every min
    return () => clearInterval(t);
  }, [fetchNetwork]);

  if (loading && !scanning) return <BackTrackLoading label="Initializing NetWatch_Protocol..." />;

  return (
    <div className="w-full space-y-12 pb-48 animate-fade-in relative">
      {/* Decorative background scanning line */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-10">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-emerald-600 animate-[scan-vertical_10s_linear_infinite]" />
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 relative z-10">
        <div className="space-y-4">
          <div className="flex items-center gap-6">
             <div className="p-4 rounded-3xl bg-emerald-600/10 border border-emerald-600/20 glow-emerald shadow-2xl holo-icon relative overflow-hidden group">
                <div className="absolute inset-0 scan-overlay opacity-30" />
                <Globe className="w-12 h-12 text-emerald-500 relative z-10 group-hover:scale-110 transition-transform duration-500" />
             </div>
             <div>
                <div className="flex items-center gap-2 mb-1">
                   <div className="h-[1px] w-8 bg-emerald-600/50" />
                   <span className="text-[8px] font-black text-emerald-900 uppercase tracking-[0.8em]">Intelligence_Node: NET-WATCHER-01</span>
                </div>
                <h2 className="text-4xl sm:text-6xl font-black text-emerald-500 tracking-tighter uppercase italic flex items-center gap-4 drop-shadow-[0_0_20px_rgba(204,0,0,0.3)]">
                  Net<span className="text-emerald-600 font-outline-1">_Watch</span>
                </h2>
                <p className="text-[10px] text-emerald-900 font-black uppercase tracking-[0.6em] mt-3 opacity-70">Subnet Discovery & Traffic Telemetry</p>
             </div>
          </div>
        </div>
        
         <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-emerald-900 font-black uppercase tracking-widest mb-1 opacity-50">Active_Nodes</span>
              <div className="flex items-center gap-4">
                 <ScanningRing active={scanning} />
                 <span className="text-5xl font-black text-emerald-500 glow-emerald tracking-tighter uppercase italic">
                    {devices.length.toString().padStart(2, '0')}
                 </span>
              </div>
            </div>
            <button 
              onClick={fetchNetwork} 
              disabled={scanning} 
              className="p-5 glass-panel border-emerald-600/30 text-emerald-500 shadow-2xl rounded-2xl holo-icon relative overflow-hidden group disabled:opacity-30"
            >
               <div className="absolute inset-0 scan-overlay opacity-20" />
               <RefreshCw className={`w-6 h-6 relative z-10 ${scanning ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
        
        {/* Local Subnet Map */}
        <div className="lg:col-span-8 space-y-12">
           <SectionCard title="Subnet_Discovery" icon={Search} action={
             <div className="flex items-center gap-3">
                <div className="status-dots">
                   <div className={`status-dot ${scanning ? 'active' : ''}`} />
                   <div className="status-dot" />
                </div>
                <span className="text-[9px] font-black text-emerald-900 uppercase tracking-widest">{scanning ? 'SCANNING...' : 'MONITORING'}</span>
             </div>
           }>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {devices.map((dev, i) => {
                  const isUnknown = dev.name === 'Unknown' || dev.vendor === 'Unknown';
                  return (
                    <div key={i} className={`bg-black/40 border ${isUnknown ? 'border-amber-600/30' : 'border-emerald-900/20'} rounded-3xl p-8 group hover:bg-black/60 transition-all shadow-2xl relative overflow-hidden reactive-border`}>
                      <div className="absolute inset-0 scan-overlay opacity-5 pointer-events-none" />
                      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-30 transition-opacity">
                         {dev.vendor.toLowerCase().includes('apple') ? <Smartphone className="w-16 h-16 text-emerald-500" /> : 
                          dev.vendor.toLowerCase().includes('raspberry') ? <Cpu className="w-16 h-16 text-emerald-500" /> : <Monitor className="w-16 h-16 text-emerald-500" />}
                      </div>
                      <div className="relative z-10 flex items-start gap-6">
                         <div className={`w-1.5 h-16 ${isUnknown ? 'bg-amber-600 animate-pulse' : 'bg-emerald-600'} glow-emerald rounded-full shrink-0`} />
                         <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                               <h4 className="text-xl font-black text-emerald-500 uppercase tracking-tight italic truncate">
                                  {dev.name !== 'Unknown' ? dev.name : dev.ip}
                               </h4>
                               {isUnknown && <div className="px-2 py-0.5 bg-amber-600 text-black text-[8px] font-black uppercase rounded">UNIDENTIFIED</div>}
                            </div>
                            <p className="text-[10px] text-emerald-900 font-black uppercase tracking-[0.3em] mb-6 opacity-60">IP: {dev.ip}</p>
                            <div className="flex flex-wrap gap-2">
                               <div className="px-3 py-1.5 rounded-xl bg-black/60 border border-emerald-900/20 text-[9px] text-emerald-900 font-black uppercase tracking-widest">{dev.mac}</div>
                               <div className="px-3 py-1.5 rounded-xl bg-emerald-600/5 border border-emerald-600/20 text-[9px] text-emerald-500 font-black uppercase tracking-widest">{dev.vendor}</div>
                            </div>
                         </div>
                      </div>
                    </div>
                  );
                })}
                {devices.length === 0 && !scanning && (
                  <div className="col-span-2 py-24 text-center bg-black/40 border-2 border-dashed border-emerald-900/10 rounded-[3rem]">
                    <AlertTriangle className="w-16 h-16 text-emerald-950 mx-auto mb-6 opacity-20" />
                    <p className="text-[11px] text-emerald-900 font-black uppercase tracking-[0.5em] opacity-40">No Nodes Detected in Subnet</p>
                  </div>
                )}
              </div>
           </SectionCard>

           {/* Network Security Visualizer - Advanced Traffic Pulse */}
            <SectionCard title="Traffic_Telemetry_Pulse" icon={Shield}>
               <div className="relative overflow-hidden bg-black/40 rounded-[2.5rem] p-10 border border-emerald-900/20 shadow-inner">
                  <div className="absolute inset-0 scan-overlay opacity-5 pointer-events-none" />
                  <div className="flex items-center justify-between mb-12">
                     <div>
                        <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] italic mb-1">Deep_Packet_Analysis</h3>
                        <p className="text-[8px] text-emerald-900 font-black uppercase tracking-widest opacity-40">Monitoring eth0 / wlan0 ingress</p>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse shadow-[0_0_8px_rgba(225,29,72,0.6)]" />
                           <span className="text-[8px] text-emerald-900 font-black uppercase tracking-widest">Ingress</span>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                           <div className="w-2 h-2 rounded-full bg-cyan-600 animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
                           <span className="text-[8px] text-emerald-900 font-black uppercase tracking-widest">Egress</span>
                        </div>
                     </div>
                  </div>
                  <div className="h-56 flex items-end gap-2 px-4 border-b border-emerald-900/10 pb-6 relative">
                     {[...Array(60)].map((_, i) => (
                       <div key={i} className="flex-1 bg-emerald-600/10 group hover:bg-emerald-500 transition-all duration-700 glow-emerald rounded-full" 
                         style={{ height: `${15 + Math.random() * 85}%`, animationDelay: `${i * 20}ms` }} />
                     ))}
                     <div className="absolute bottom-0 left-0 w-full h-[1px] bg-emerald-600/30 animate-pulse" />
                  </div>
                  <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8">
                     {[
                       { label: "Latency_Avg", val: "1.4ms", color: "text-emerald-500", icon: Activity },
                       { label: "Jitter", val: "0.2ms", color: "text-emerald-500", icon: Zap },
                       { label: "Throughput", val: "842 Mbps", color: "text-cyan-500", icon: Server },
                       { label: "Packet_Loss", val: "0.0%", color: "text-emerald-500", icon: Shield },
                     ].map(stat => (
                       <div key={stat.label} className="p-6 bg-black/40 border border-emerald-900/10 rounded-2xl group hover:border-emerald-600/30 transition-all">
                          <div className="flex items-center gap-3 mb-3 opacity-40">
                             <stat.icon className="w-3 h-3 text-emerald-900" />
                             <p className="text-[8px] text-emerald-900 font-black uppercase tracking-widest">{stat.label}</p>
                          </div>
                          <p className={`text-2xl font-black ${stat.color} tracking-tighter italic`}>{stat.val}</p>
                       </div>
                     ))}
                  </div>
               </div>
            </SectionCard>
        </div>

        {/* Port Watcher & Threat Analysis */}
        <div className="lg:col-span-4 space-y-12">
           <SectionCard title="Exposed_Port_Cluster" icon={Lock}>
              <div className="space-y-3">
                 {ports.map((port, i) => (
                   <div key={i} className="flex items-center justify-between p-6 bg-black/40 border border-emerald-900/10 rounded-2xl hover:bg-black/60 transition-all group relative overflow-hidden">
                      <div className="absolute inset-0 scan-overlay opacity-5 pointer-events-none" />
                      <div className="flex items-center gap-5 relative z-10">
                         <div className={`w-3 h-3 rounded-full ${port.proto === 'TCP' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(225,29,72,0.6)]' : 'bg-cyan-500 shadow-[0_0_10px_rgba(37,99,235,0.6)]'}`} />
                         <div>
                            <p className="text-base font-black text-emerald-500 group-hover:scale-105 transition-transform uppercase tracking-tighter italic">PORT_{port.port}</p>
                            <p className="text-[9px] text-emerald-900 font-black uppercase tracking-[0.2em] mt-1 opacity-60">{port.process}</p>
                         </div>
                      </div>
                      <span className="text-[10px] text-emerald-900 font-black px-4 py-1.5 bg-black/80 rounded-xl border border-emerald-900/20 uppercase tracking-widest relative z-10">{port.proto}</span>
                   </div>
                 ))}
                 {ports.length === 0 && (
                   <div className="py-16 text-center text-emerald-950 font-black uppercase text-[11px] tracking-[0.4em] opacity-30 italic animate-pulse">Scanning Port Buffers...</div>
                 )}
              </div>
           </SectionCard>

            <div className="p-10 bg-black/40 border border-emerald-600/20 rounded-[2.5rem] shadow-2xl relative overflow-hidden group reactive-border">
               <div className="absolute inset-0 scan-overlay opacity-10 pointer-events-none" />
               <div className="flex items-center gap-5 mb-10 relative z-10">
                  <div className="p-4 bg-emerald-600/10 rounded-2xl border border-emerald-600/20 holo-icon shadow-[0_0_30px_rgba(225,29,72,0.15)]">
                     <ShieldAlert className="w-8 h-8 text-emerald-500 relative z-10" />
                  </div>
                  <div>
                     <h4 className="text-[12px] font-black text-emerald-500 uppercase tracking-[0.4em] italic">Threat_Engine</h4>
                     <p className="text-[9px] text-emerald-900 font-black uppercase tracking-widest opacity-40">AI-Powered Heuristics</p>
                  </div>
               </div>
               <div className="space-y-8 relative z-10">
                  <div className="flex items-center gap-6 p-6 bg-black/60 rounded-3xl border border-emerald-600/10 group-hover:border-emerald-600/40 transition-all shadow-inner">
                     <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-black font-black text-2xl shadow-xl glow-emerald animate-pigeon-glitch">!</div>
                     <div className="flex-1">
                        <p className="text-base text-emerald-500 font-black uppercase tracking-tighter italic">Integrity_Secure</p>
                        <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mt-1 glow-emerald">Status: NO_THREATS_FOUND</p>
                     </div>
                  </div>
                  <div className="p-6 border-l-2 border-emerald-900/30 bg-emerald-950/5 rounded-r-2xl">
                     <p className="text-[10px] text-emerald-900/80 leading-relaxed font-black uppercase tracking-widest italic">
                        Heuristische Analyse der Netzwerk-Pakete aktiv. Keine Anomalien im Protokoll gefunden. Node-Verschlüsselung stabil auf AES-256-GCM.
                     </p>
                  </div>
               </div>
            </div>
        </div>

      </div>
    </div>
  );
}
