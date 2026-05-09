import React from 'react';
import { Cpu, Activity, HardDrive, Database, Network, Power } from 'lucide-react';

interface ServerHUDProps {
  data: {
    cpu_pct?: number;
    ram_pct?: number;
    temp?: number;
    disk_used?: string;
    disk_total?: string;
    load?: number[];
    uptime?: string;
    network_connections?: string[];
  };
}

function HealthStatusBadge({ value, type }: { value: number, type: 'cpu' | 'ram' | 'temp' }) {
  let status: 'OK' | 'WARNING' | 'CRITICAL' = 'OK';
  let color = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
  
  if (type === 'cpu') {
    if (value > 90) status = 'CRITICAL';
    else if (value > 70) status = 'WARNING';
  } else if (type === 'ram') {
    if (value > 92) status = 'CRITICAL';
    else if (value > 75) status = 'WARNING';
  } else if (type === 'temp') {
    if (value > 75) status = 'CRITICAL';
    else if (value > 65) status = 'WARNING';
  }
  
  if (status === 'CRITICAL') color = 'text-emerald-600 bg-emerald-600/10 border-emerald-600/30 animate-pulse';
  else if (status === 'WARNING') color = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
  
  return (
    <div className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-[0.2em] ${color}`}>
      {status}
    </div>
  );
}

export function ServerHUD({ data }: ServerHUDProps) {
  const isKritisch = (data?.temp || 0) > 65;
  const cpuActivity = Math.floor((data?.cpu_pct || 0) / 10);

  return (
    <div className="relative w-full max-w-5xl mx-auto p-1 font-hacker animate-fade-in group">
      
      {/* 19" Rackmount Frame - Now with Glass Effect */}
      <div className="relative glass-panel shadow-[0_0_60px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden">
        
        {/* Rack Ears / Mounting Brackets - Hidden on Mobile */}
        <div className="hidden sm:flex absolute top-0 bottom-0 left-0 w-8 bg-white/[0.03] backdrop-blur-md flex-col items-center py-6 gap-20 border-r border-emerald-900/30">
           {[...Array(3)].map((_, i) => <div key={i} className="w-3 h-3 rounded-full bg-black/40 shadow-[inset_0_2px_4px_rgba(0,0,0,1),0_1px_1px_rgba(255,255,255,0.05)] border border-emerald-900/20" />)}
        </div>
        <div className="hidden sm:flex absolute top-0 bottom-0 right-0 w-8 bg-white/[0.03] backdrop-blur-md flex-col items-center py-6 gap-20 border-l border-emerald-900/30">
           {[...Array(3)].map((_, i) => <div key={i} className="w-3 h-3 rounded-full bg-black/40 shadow-[inset_0_2px_4px_rgba(0,0,0,1),0_1px_1px_rgba(255,255,255,0.05)] border border-emerald-900/20" />)}
        </div>

        <div className="px-4 sm:px-16 py-8 sm:py-12 bg-gradient-to-br from-white/[0.02] to-transparent">
          
          {/* Header Status Bar */}
          <div className="flex items-center justify-between mb-10 pb-6 border-b border-emerald-900/20">
             <div className="flex items-center gap-6">
                <div className="px-4 py-1.5 bg-emerald-600 rounded text-black text-[10px] font-black uppercase tracking-[0.3em] shadow-[0_0_20px_rgba(204,0,0,0.4)]">Node_01</div>
                <div className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.2em] glow-emerald opacity-60">Model: RPi5_Cluster_Blade</div>
             </div>
             <div className="flex items-center gap-8">
                <div className="flex items-center gap-3">
                   <span className="text-[10px] text-emerald-900/70 font-black uppercase tracking-widest">Power</span>
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 glow-emerald shadow-xl" />
                </div>
                <div className="flex items-center gap-3">
                   <span className="text-[10px] text-emerald-900/70 font-black uppercase tracking-widest">Net</span>
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-700 glow-emerald animate-pulse" />
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Front Panel Visualization */}
            <div className="lg:col-span-5 space-y-10">
               
               {/* Industrial LED Matrix Display */}
               <div className="p-8 glass-card relative overflow-hidden border-emerald-600/20">
                  <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[radial-gradient(#cc0000_1px,transparent_1px)] bg-[length:10px_10px]" />
                  
                  <div className="relative z-10 space-y-6">
                     <div>
                        <p className="text-[9px] text-emerald-500 font-black uppercase tracking-[0.4em] mb-4 opacity-70">Core_Telemetry</p>
                        <div className="flex flex-wrap gap-2">
                           {[...Array(20)].map((_, i) => (
                             <div key={i} className={`w-4 h-4 rounded-sm transition-all duration-300 ${i < cpuActivity * 2 ? 'bg-emerald-600 glow-emerald shadow-[0_0_15px_rgba(204,0,0,0.5)]' : 'bg-white/[0.03] border border-emerald-900/20'}`} />
                           ))}
                        </div>
                     </div>

                     <div className="pt-4 border-t border-emerald-900/20">
                        <div className="flex justify-between items-end">
                            <div>
                               <p className="text-[9px] text-emerald-900 font-black uppercase tracking-widest mb-1">Thermal_State</p>
                               <div className="flex items-center gap-4">
                                  <p className={`text-3xl font-black tabular-nums ${isKritisch ? 'text-emerald-500 glow-emerald animate-pulse' : 'text-emerald-500'}`}>{data?.temp || '--'}<span className="text-xs text-emerald-900 ml-1">°C</span></p>
                                  <HealthStatusBadge type="temp" value={data?.temp || 0} />
                               </div>
                            </div>
                           <div className="text-right">
                              <p className="text-[9px] text-emerald-900 font-black uppercase tracking-widest mb-1">Uptime_Link</p>
                              <p className="text-sm font-black text-emerald-500 font-mono opacity-80">{data?.uptime || '--'}</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Port Activity Monitor */}
               <div className="p-6 glass-card border-emerald-900/20">
                  <p className="text-[9px] text-emerald-900/70 font-black uppercase tracking-[0.3em] mb-6">Interface_I/O</p>
                  <div className="space-y-4">
                     {['ETH0', 'USB1', 'USB2', 'PCIE'].map((port, i) => {
                       // Simuliere Aktivität basierend auf CPU/RAM oder Zufall für mehr Dynamik
                       const isActive = (data?.cpu_pct || 0) > (5 + i * 2); 
                       return (
                         <div key={port} className="flex items-center justify-between group">
                            <span className={`text-[10px] font-black transition-colors uppercase tracking-widest ${isActive ? 'text-emerald-500 glow-emerald' : 'text-emerald-900'}`}>{port}</span>
                            <div className="flex gap-1.5">
                               {[...Array(8)].map((_, j) => {
                                 // Wenn Port aktiv, flackern ALLE 8 LEDs unregelmäßig
                                 return (
                                   <div key={j} className={`w-3.5 h-1.5 rounded-sm transition-all duration-300 ${
                                     isActive 
                                       ? 'bg-emerald-600 glow-emerald shadow-[0_0_12px_rgba(204,0,0,0.7)] animate-led-flicker' 
                                       : 'bg-white/[0.03] border border-emerald-900/20'
                                   }`} style={{ animationDelay: `${(i * 100) + (j * 30)}ms` }} />
                                 );
                               })}
                            </div>
                         </div>
                       );
                     })}
                  </div>
               </div>
            </div>

            {/* Detailed Hardware Specs */}
            <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-8">
                <HardwareModule label="Processing_Unit" value={`${data?.cpu_pct || 0}%`} icon={Cpu} accent="rose" desc="ARM_CORTEX_A76" badge={<HealthStatusBadge type="cpu" value={data?.cpu_pct || 0} />} />
                <HardwareModule label="Dynamic_Memory" value={`${data?.ram_pct || 0}%`} icon={Database} accent="rose" desc="LPDDR4X_SYNCHRONOUS" badge={<HealthStatusBadge type="ram" value={data?.ram_pct || 0} />} />
                <HardwareModule label="Storage_Volume" value={data?.disk_used || '--'} icon={HardDrive} accent="rose" desc={`EXT4_MAP: ${data?.disk_total}`} />
                <HardwareModule label="Active_Sessions" value={data?.network_connections?.length || 0} icon={Network} accent="rose" desc="ENCRYPTED_TCP_TUNNELS" />
            </div>

          </div>
        </div>

        {/* Chassis Ventilation Grill - Reduced for Mobile */}
        <div className="px-4 sm:px-16 pb-6 flex justify-center gap-1 sm:gap-1.5">
           {[...Array(20)].map((_, i) => <div key={i} className="w-1 h-2 sm:h-3 bg-white/[0.05] rounded-full" />)}
        </div>

        {/* Real-Time Log Integration */}
        <div className="px-4 sm:px-16 pb-12">
           <div className="p-6 glass-card border-emerald-900/10 font-mono overflow-hidden group">
              <div className="flex justify-between items-center mb-4">
                 <div className="flex items-center gap-3">
                    <Activity className="w-3 h-3 text-emerald-600 animate-pulse" />
                    <span className="text-[9px] text-emerald-500 font-black uppercase tracking-[0.3em] glow-emerald">System_Event_Stream</span>
                 </div>
                 <span className="text-[8px] text-emerald-900 uppercase tracking-widest">Live_Sync: OK</span>
              </div>
              <div className="space-y-2 h-32 overflow-y-auto custom-scrollbar pr-4">
                 {(data as any)?.logs?.length > 0 ? (data as any).logs.map((log: any, i: number) => (
                   <div key={i} className="text-[10px] flex gap-4 opacity-50 hover:opacity-100 transition-opacity">
                      <span className="text-emerald-700 shrink-0 font-black">[{log.time || '—'}]</span>
                      <span className="text-emerald-400 shrink-0 uppercase tracking-widest font-black">{log.service || 'SYS'}</span>
                      <span className="text-emerald-500 truncate">{log.message}</span>
                   </div>
                 )) : (
                   <div className="text-[10px] text-emerald-900 animate-pulse font-black uppercase tracking-widest">Awaiting data packets...</div>
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* Decorative ID Brackets */}
      <div className="absolute -top-4 -left-4 p-4 border-l-2 border-t-2 border-emerald-600/30 rounded-tl-3xl opacity-20 pointer-events-none" />
      <div className="absolute -bottom-4 -right-4 p-4 border-r-2 border-b-2 border-emerald-600/30 rounded-br-3xl opacity-20 pointer-events-none" />
    </div>
  );
}

function HardwareModule({ label, value, icon: Icon, accent, desc, badge }: any) {
  return (
    <div className="p-8 glass-card group relative overflow-hidden shadow-2xl border-emerald-900/20 hover:border-emerald-600/30 glass-reflection">
       <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all duration-700">
          <Icon className="w-24 h-24" />
       </div>
       <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
             <div className="p-3 bg-emerald-600/10 rounded-xl border border-emerald-600/10">
                <Icon className="w-5 h-5 text-emerald-500 glow-emerald" />
             </div>
              <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.3em] opacity-70">{label}</p>
           </div>
           <div className="flex items-center justify-between gap-4 mb-3">
              <p className="text-4xl font-black text-emerald-500 tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(204,0,0,0.2)]">{value}</p>
              {badge}
           </div>
          <p className="text-[9px] text-emerald-900/70 font-black uppercase tracking-widest">{desc}</p>
       </div>
    </div>
  );
}
