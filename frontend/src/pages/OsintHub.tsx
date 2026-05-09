import { useState } from 'react';
import { Search, Activity, ShieldAlert, Crosshair, Radar, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionCard, SkeletonCard, CRTScreen } from '../components/ui';
import { useApi } from '../hooks/useApi';
import { useToast } from '../components/Toast';

export default function OsintHub() {
  const apiFetch = useApi();
  const { toast } = useToast();
  const [target, setTarget] = useState('');
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<any>(null);

  const startScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target.trim()) return;
    setScanning(true);
    try {
      const res = await apiFetch('/api/intel/osint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: target.trim() })
      });
      setResults(res);
      toast('success', 'Scan_Complete');
    } catch (e: any) {
      toast('error', e.message);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="w-full min-h-screen pb-48 animate-fade-in space-y-16">
      <div className="flex flex-col gap-4">
        <h2 className="text-4xl font-black text-emerald-500 tracking-tighter uppercase italic flex items-center gap-4">
           <Search className="w-10 h-10 text-emerald-500" />
           OSINT<span className="text-emerald-600">_Hub</span>
        </h2>
        <p className="text-[10px] text-emerald-900/70 font-black uppercase tracking-[0.4em]">Deep Network Reconnaissance & Threat Analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
         <div className="lg:col-span-4 space-y-16">
            <SectionCard title="Target_Acquisition" icon={Crosshair} delay={1}>
               <form onSubmit={startScan} className="space-y-6">
                  <div className="relative">
                     <input
                       type="text"
                       value={target}
                       onChange={e => setTarget(e.target.value)}
                       placeholder="Enter IP or Domain..."
                       className="w-full bg-black/50 border border-emerald-900/30 hacker-frame px-6 py-4 text-sm text-emerald-500 placeholder:text-emerald-950 focus:outline-none focus:border-emerald-500 transition-all pl-12"
                       disabled={scanning}
                     />
                     <Terminal className="w-5 h-5 text-emerald-900 absolute left-4 top-4" />
                  </div>
                  <button type="submit" disabled={scanning || !target.trim()} className="w-full hacker-frame bg-emerald-600 text-black py-4 font-black uppercase tracking-[0.3em] hover:bg-emerald-500 transition-all flex justify-center items-center gap-3">
                     {scanning ? <Radar className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                     {scanning ? 'Scanning...' : 'Execute_Scan'}
                  </button>
               </form>
            </SectionCard>
            <div className="p-8 hacker-frame bg-emerald-950/5 border-dashed border-emerald-900/30">
               <div className="flex items-center gap-4 mb-4">
                  <ShieldAlert className="w-6 h-6 text-emerald-900" />
                  <span className="text-[10px] text-emerald-900 font-black uppercase tracking-widest">Warning</span>
               </div>
               <p className="text-[9px] text-emerald-900/70 leading-relaxed uppercase tracking-wider font-hacker">
                 Unauthorized scanning of external targets may violate terms of service. Ensure you have permission before executing deep packet inspections.
               </p>
            </div>
         </div>

         <div className="lg:col-span-8">
            <SectionCard title="Telemetry_Output" icon={Activity} delay={2} accent={!!results}>
               {scanning ? (
                 <div className="py-20 flex flex-col items-center justify-center">
                    <div className="relative w-32 h-32 mb-10">
                       <div className="absolute inset-0 border-2 border-emerald-500/20 rounded-full animate-[ping_3s_linear_infinite]" />
                       <div className="absolute inset-4 border-2 border-emerald-500/10 rounded-full animate-[ping_2s_linear_infinite]" />
                       <div className="absolute inset-0 flex items-center justify-center">
                          <Radar className="w-12 h-12 text-emerald-500 animate-spin" />
                       </div>
                    </div>
                    <p className="text-sm font-black text-emerald-500 animate-pulse tracking-[0.4em]">Intercepting Data Packets...</p>
                 </div>
               ) : results ? (
                 <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   className="space-y-8 font-hacker"
                 >
                    <div className="flex justify-between items-center p-6 bg-emerald-600/10 hacker-frame relative overflow-hidden">
                       <div className="absolute inset-0 bg-emerald-600/5 animate-pulse" />
                       <span className="text-[12px] font-black text-emerald-500 uppercase tracking-widest relative z-10">Target: {results.target}</span>
                       <span className="text-[10px] font-black text-emerald-500 px-3 py-1 bg-emerald-600 relative z-10 shadow-[0_0_15px_rgba(16,185,129,0.5)]">STATUS: {results.status}</span>
                    </div>
                    <CRTScreen>
                       <div className="bg-black/40 p-8 min-h-[350px] overflow-auto scrollbar-hide">
                          <pre className="text-[11px] text-emerald-400 leading-relaxed font-mono drop-shadow-[0_0_2px_rgba(16,185,129,0.6)]">
                             {results.raw_output || 'No raw intelligence available for this target.'}
                          </pre>
                       </div>
                    </CRTScreen>
                 </motion.div>
               ) : (
                 <div className="py-32 flex flex-col items-center justify-center text-center hacker-frame border-none bg-black/20 opacity-40">
                    <Radar className="w-16 h-16 text-emerald-950 mb-6" />
                    <p className="text-[10px] text-emerald-900 font-black uppercase tracking-[0.4em] font-hacker">Awaiting Target Coordinates</p>
                 </div>
               )}
            </SectionCard>
         </div>
      </div>
    </div>
  );
}
