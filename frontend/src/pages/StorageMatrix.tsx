import { useState, useEffect } from 'react';
import { HardDrive, Server, RefreshCw, Trash2, Database, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionCard, SkeletonCard } from '../components/ui';
import { useApi } from '../hooks/useApi';
import { useToast } from '../components/Toast';

export default function StorageMatrix() {
  const apiFetch = useApi();
  const { toast } = useToast();
  const [storage, setStorage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purging, setPurging] = useState(false);

  const loadData = async () => {
    try {
      const res = await apiFetch('/api/storage/matrix');
      setStorage(res?.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerPurge = async () => {
    if (!confirm("WARNING: This will remove all stopped containers, unused networks, dangling images, and build cache. Proceed?")) return;
    setPurging(true);
    try {
      const res = await apiFetch('/api/storage/purge', { method: 'POST' });
      toast('success', `System Purged. Reclaimed: ${res.reclaimed || 'Unknown'}`);
      loadData();
    } catch (e: any) {
      toast('error', e.message);
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="w-full min-h-screen pb-48 animate-fade-in space-y-16 relative">
      {/* Decorative background scanning line */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-10">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-emerald-600 animate-[scan-vertical_10s_linear_infinite]" />
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 relative z-10">
        <div className="space-y-4">
          <div className="flex items-center gap-6">
             <div className="p-4 rounded-3xl bg-emerald-600/10 border border-emerald-600/20 glow-emerald shadow-2xl holo-icon relative overflow-hidden group">
                <div className="absolute inset-0 scan-overlay opacity-30" />
                <HardDrive className="w-12 h-12 text-emerald-500 relative z-10 group-hover:scale-110 transition-transform duration-500" />
             </div>
             <div>
                <div className="flex items-center gap-2 mb-1">
                   <div className="h-[1px] w-8 bg-emerald-600/50" />
                   <span className="text-[8px] font-black text-emerald-900 uppercase tracking-[0.8em]">Storage_Node: VOL-MTRX</span>
                </div>
                <h2 className="text-3xl sm:text-6xl font-black text-emerald-500 tracking-tighter uppercase italic flex items-center gap-4 drop-shadow-[0_0_20px_rgba(204,0,0,0.3)]">
                  Storage<span className="text-emerald-600 font-outline-1">_Matrix</span>
                </h2>
                <p className="text-[10px] text-emerald-900 font-black uppercase tracking-[0.6em] mt-3 opacity-70">Deep File System & Volume Analysis</p>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
           <div className="flex flex-col items-end">
             <span className="text-[10px] text-emerald-900 font-black uppercase tracking-widest mb-1 opacity-50">Volume_Status</span>
             <span className="text-xl font-black text-emerald-500 glow-emerald tracking-widest">SECURE</span>
           </div>
           <button onClick={loadData} className="p-5 glass-panel border-emerald-600/30 text-emerald-500 hover:text-emerald-400 hover:border-emerald-600 transition-all shadow-2xl rounded-2xl group relative overflow-hidden">
              <div className="absolute inset-0 bg-emerald-600/5 group-hover:bg-emerald-600/10 transition-all" />
              <RefreshCw className={`w-6 h-6 relative z-10 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
         <div className="lg:col-span-8">
            <SectionCard title="Drive_Telemetry" icon={Server} delay={1}>
               {loading ? (
                 <SkeletonCard />
               ) : !storage ? (
                 <div className="py-20 text-center text-emerald-900 font-hacker uppercase text-[10px] tracking-widest">Unable to load telemetry.</div>
               ) : (
                    <div className="space-y-10">
                       <motion.div 
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         className="p-10 bg-black/40 border border-emerald-900/20 rounded-3xl shadow-2xl relative overflow-hidden group reactive-border"
                       >
                          <div className="absolute inset-0 scan-overlay opacity-5 pointer-events-none" />
                          <div className="flex justify-between text-[11px] text-emerald-400 font-black uppercase tracking-[0.4em] mb-6 relative z-10 italic">
                             <span className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" /> Root_Partition (/)</span>
                             <span className="text-emerald-500 drop-shadow-[0_0_8px_rgba(204,0,0,0.4)]">{storage.root_used} / {storage.root_total}</span>
                          </div>
                          <div className="h-3 w-full bg-emerald-950/10 rounded-full overflow-hidden relative z-10 shadow-inner border border-emerald-900/10">
                             <motion.div 
                               className="h-full bg-emerald-600 glow-emerald transition-all duration-1000 relative" 
                               initial={{ width: 0 }}
                               animate={{ width: `${storage.root_pct}%` }}
                               transition={{ duration: 1.5, ease: "easeOut" }}
                             >
                                <div className="absolute inset-0 scan-overlay opacity-30" />
                             </motion.div>
                          </div>
                       </motion.div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-10 bg-black/40 border border-emerald-900/20 rounded-3xl shadow-2xl group hover:border-emerald-600/40 transition-all reactive-border relative overflow-hidden"
                          >
                             <div className="absolute inset-0 scan-overlay opacity-5 pointer-events-none" />
                             <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-emerald-600/10 rounded-xl border border-emerald-600/20 holo-icon relative overflow-hidden">
                                   <div className="absolute inset-0 scan-overlay opacity-20" />
                                   <Database className="w-6 h-6 text-emerald-500 relative z-10" />
                                </div>
                                <span className="text-[12px] font-black text-emerald-500 uppercase tracking-widest">Docker_Volumes</span>
                             </div>
                             <p className="text-5xl font-black text-emerald-500 tracking-tighter drop-shadow-[0_0_15px_rgba(204,0,0,0.3)]">{storage.docker_size}</p>
                          </motion.div>
                          <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-10 bg-black/40 border border-cyan-600/20 rounded-3xl shadow-2xl group hover:border-cyan-600/40 transition-all reactive-border relative overflow-hidden"
                          >
                             <div className="absolute inset-0 scan-overlay opacity-5 pointer-events-none" />
                             <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-cyan-600/10 rounded-xl border border-cyan-600/20 holo-icon relative overflow-hidden">
                                   <div className="absolute inset-0 scan-overlay opacity-20" />
                                   <HardDrive className="w-6 h-6 text-cyan-500 relative z-10" />
                                </div>
                                <span className="text-[12px] font-black text-cyan-400 uppercase tracking-widest">Archive_Backups</span>
                             </div>
                             <p className="text-5xl font-black text-cyan-500 tracking-tighter drop-shadow-[0_0_15px_rgba(0,102,255,0.3)]">{storage.backup_size}</p>
                          </motion.div>
                       </div>
                    </div>
               )}
            </SectionCard>
         </div>

         <div className="lg:col-span-4 space-y-16">
            <SectionCard title="Deep_Clean" icon={Trash2} delay={2}>
               <div className="space-y-6">
                  <p className="text-[10px] text-emerald-400 font-hacker uppercase leading-relaxed tracking-wider">
                     Execute a deep purge to remove dangling images, stopped containers, and unused volumes. This cannot be undone.
                  </p>
                  <button 
                    onClick={triggerPurge} 
                    disabled={purging}
                    className="w-full glass-card bg-emerald-600 text-black py-8 font-black uppercase tracking-[0.4em] hover:bg-emerald-500 transition-all flex flex-col justify-center items-center gap-2 group border-none glow-emerald"
                  >
                     {purging ? <RefreshCw className="w-8 h-8 animate-spin" /> : <AlertCircle className="w-8 h-8 group-hover:scale-110 transition-transform" />}
                     {purging ? 'Purging_System...' : 'Initiate_Purge'}
                  </button>
               </div>
            </SectionCard>
         </div>
      </div>
    </div>
  );
}
