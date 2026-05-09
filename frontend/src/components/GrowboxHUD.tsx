import React from 'react';
import { Wind, Zap, Droplets, Thermometer, Fan } from 'lucide-react';

interface GrowboxHUDProps {
  data: {
    temp?: number;
    hum?: number;
    vpd?: number;
    power_w?: number;
    lamp_level?: number;
    fan_speed?: number;
    ports?: any[];
    health_score?: number;
    forecast?: string;
    interpretation?: Record<string, { status: string, label: string, interpretation: string, recommendation: string }>;
    run_score?: number;
    mold_risk?: number;
  };
}

export function GrowboxHUD({ data }: GrowboxHUDProps) {
  const getPortState = (label: string) => {
    return data?.ports?.find((p: any) => p.label?.toLowerCase().includes(label.toLowerCase()))?.active;
  };

  const isLightOn = getPortState('Spider Farmer');
  const lightIntensity = Math.min(1, (data?.lamp_level || 0) / 10 + 0.1);
  
  const isAbluftActive = getPortState('abluft');
  const isUmluftActive = getPortState('cloudray') || getPortState('luefter');

  return (
    <div className="relative w-full max-w-4xl mx-auto p-8 glass-panel rounded-[3.5rem] border-flow overflow-hidden animate-fade-in group">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent)] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#10b981 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        <div className="lg:col-span-3 space-y-8">
          <HUDMetric label="Temperature" value={data?.temp} unit="°C" icon={Thermometer} color="emerald" interp={data?.interpretation?.temperature} />
          <HUDMetric label="Humidity" value={data?.hum} unit="%" icon={Droplets} color="blue" interp={data?.interpretation?.humidity} />
          <HUDMetric label="VPD" value={data?.vpd} unit="kPa" icon={Wind} color="cyan" interp={data?.interpretation?.vpd} />
        </div>

        <div className="lg:col-span-6 flex justify-center">
          <div className="relative w-64 h-96">
            <div className="absolute inset-0 border-2 border-emerald-600/20 rounded-3xl shadow-[0_0_40px_rgba(16,185,129,0.05)]" />
            <div className="absolute -inset-1 border border-emerald-900/20 rounded-[2rem]" />
            
            <div className="absolute inset-4 bg-black/40 rounded-2xl overflow-hidden border border-emerald-900/20">
              
              <div 
                className={`absolute top-0 left-0 right-0 h-24 transition-all duration-1000 ${isLightOn ? 'opacity-100' : 'opacity-40'}`}
                style={{ 
                  background: isLightOn 
                    ? `linear-gradient(to bottom, rgba(255,255,255,${lightIntensity * 0.4}), transparent)`
                    : `linear-gradient(to bottom, rgba(255, 0, 0, 0.4), transparent)`,
                  boxShadow: isLightOn 
                    ? `0 0 40px rgba(255,255,255,${lightIntensity * 0.2})` 
                    : `0 0 30px rgba(255, 0, 0, 0.3)`
                }}
              >
                <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className={`w-6 h-1 rounded-full transition-colors duration-1000 ${isLightOn ? 'bg-white glow-white' : 'bg-red-500 glow-emerald shadow-[0_0_10px_rgba(255,0,0,0.8)]'}`} />
                  ))}
                </div>
              </div>

              <div className="absolute top-6 right-6">
                <Fan 
                  className={`w-10 h-10 transition-all duration-300 ${isAbluftActive ? 'text-emerald-400 animate-[spin_1s_linear_infinite] glow-emerald' : 'text-emerald-950'}`} 
                />
              </div>

              <div className="absolute top-1/2 left-6 -translate-y-1/2">
                <Fan 
                  className={`w-8 h-8 transition-all duration-300 ${isUmluftActive ? 'text-cyan-400 animate-[spin_2s_linear_infinite] glow-cyan' : 'text-emerald-950'}`} 
                />
              </div>

              {/* 3 Cannabis Plants Visualization */}
              <div className="absolute bottom-0 left-0 right-0 h-56 flex items-end justify-around px-2">
                 <CannaPlant scale={0.8} delay="0s" color="text-emerald-600/60" />
                 <CannaPlant scale={1.0} delay="0.5s" color="text-emerald-500/80" />
                 <CannaPlant scale={0.7} delay="1.2s" color="text-emerald-600/50" />
              </div>

              {/* Health Progress Ring around Plants */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-48 h-48 border-4 border-emerald-600/10 rounded-full pointer-events-none">
                 <svg className="w-full h-full -rotate-90">
                    <circle 
                      cx="96" cy="96" r="90" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeDasharray="565" 
                      strokeDashoffset={565 - (565 * (data?.health_score || 100)) / 100}
                      className="text-emerald-500/40 transition-all duration-1000"
                    />
                 </svg>
              </div>

              {data?.vpd && (data.vpd < 0.6 || data.vpd > 1.6) && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 bg-emerald-950/10 animate-pulse mix-blend-overlay" />
                </div>
              )}
            </div>

            <HUDLabel pos="top-[10%]" side="right-[-40px]" text="Spider SF-2000" active={isLightOn} />
            <HUDLabel pos="top-[15%]" side="left-[-40px]" text="Extract Fan 6-inch" active={isAbluftActive} />
            <HUDLabel pos="bottom-[20%]" side="right-[-40px]" text={`Run Score: ${data?.run_score || '--'}/100`} active={true} />
            <HUDLabel pos="bottom-[25%]" side="left-[-40px]" text={data?.forecast || 'Wachstum nominal'} active={false} />
          </div>
        </div>

        <div className="lg:col-span-3 space-y-8">
          <div className="p-6 glass-card rounded-2xl border-l-2 border-emerald-600/50">
             <div className="flex items-center gap-2 text-[10px] font-black text-emerald-900/70 uppercase tracking-widest mb-2">
               <Zap className="w-3 h-3 text-purple-400" /> Current Power
             </div>
             <div className="text-2xl font-black text-emerald-500 tabular-nums tracking-tighter">
               {data?.power_w || 0}W
             </div>
          </div>

          <div className="p-6 glass-card rounded-2xl border-l-2 border-cyan-500/50">
             <div className="flex items-center gap-2 text-[10px] font-black text-emerald-900/70 uppercase tracking-widest mb-2">
               <Droplets className="w-3 h-3 text-cyan-400" /> Schimmelrisiko
             </div>
             <div className={`text-2xl font-black tabular-nums tracking-tighter ${data?.mold_risk && data.mold_risk > 50 ? 'text-emerald-500 glow-emerald animate-pulse' : 'text-emerald-500'}`}>
               {data?.mold_risk ?? '--'}%
             </div>
          </div>
        </div>
      </div>
      
      <div className="absolute inset-0 pointer-events-none">
        <div className="w-full h-[1px] bg-emerald-600/20 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-scan" />
      </div>
    </div>
  );
}

function CannaPlant({ scale, delay, color }: any) {
  return (
    <div 
      className={`relative w-16 h-32 flex flex-col items-center justify-end animate-float ${color}`}
      style={{ transform: `scale(${scale})`, animationDelay: delay }}
    >
      <div className="w-1.5 h-24 bg-current rounded-full opacity-60" />
      <div className="absolute bottom-8 w-12 h-12 flex items-center justify-center">
         <svg viewBox="0 0 100 100" className="w-full h-full fill-current filter blur-[1px]">
            <path d="M50 10 Q60 40 90 50 Q60 60 50 90 Q40 60 10 50 Q40 40 50 10" />
            <path d="M50 30 Q70 45 85 70 Q55 65 50 95 Q45 65 15 70 Q30 45 50 30" opacity="0.8" />
         </svg>
      </div>
      <div className="w-10 h-8 bg-gray-800 rounded-b-lg border-t-4 border-gray-700 shadow-xl" />
    </div>
  );
}

function HUDMetric({ label, value, unit, icon: Icon, color, interp }: any) {
  const status = interp?.status || 'OK';
  const statusColors: any = {
    OK: 'text-emerald-400',
    WARN: 'text-amber-400',
    CRIT: 'text-emerald-500'
  };
  const statusGlows: any = {
    OK: 'glow-emerald',
    WARN: 'glow-amber',
    CRIT: 'glow-emerald animate-pulse'
  };

  return (
    <div className="flex items-center gap-4 group relative">
      <div className={`p-2.5 rounded-xl bg-black/40 border border-emerald-900/20 group-hover:border-emerald-600/30 transition-all ${statusColors[status] || 'text-emerald-400'} ${statusGlows[status]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
           <p className="text-[9px] font-black text-emerald-900/70 uppercase tracking-widest mb-0.5">{label}</p>
           {interp && <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded ${statusColors[status]} bg-emerald-950/10 ml-2`}>{interp.label}</span>}
        </div>
        <p className="text-xl font-black text-emerald-500 tabular-nums tracking-tight">
          {value ?? '--'}<span className="text-xs text-emerald-900 ml-1 font-bold">{unit}</span>
        </p>
        {interp?.recommendation && (
           <div className={`absolute left-0 -bottom-10 w-64 glass-panel p-3 rounded-xl border-flow z-50 opacity-0 group-hover:opacity-100 transition-all pointer-events-none scale-95 group-hover:scale-100 shadow-2xl`}>
             <p className="text-[9px] font-black uppercase tracking-widest text-emerald-900/70 mb-1">Empfehlung</p>
             <p className={`text-[11px] font-bold leading-snug ${statusColors[status]}`}>
               {interp.recommendation}
             </p>
           </div>
        )}
      </div>
    </div>
  );
}

function HUDLabel({ pos, side, text, active }: any) {
  return (
    <div className={`absolute ${pos} ${side} hidden xl:flex items-center gap-2 pointer-events-none`}>
      <div className={`h-px w-8 ${active ? 'bg-emerald-600/40' : 'bg-gray-800'}`} />
      <span className={`text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${active ? 'text-emerald-400 glow-emerald' : 'text-emerald-950'}`}>
        {text}
      </span>
    </div>
  );
}
