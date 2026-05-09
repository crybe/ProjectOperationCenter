import React, { useState, useEffect } from 'react';
import { 
  Database, Calendar, Star, Leaf, Clock, Zap, Euro, BarChart3, 
  Lock, ArrowRight, ShieldCheck, Activity, Search
} from 'lucide-react';
import { SectionCard, ProgressBar, BackTrackLoading } from './ui';

type GrowHistory = {
  id: string;
  sorte: string;
  datum: string;
  trainings: string;
  pflanzen: string;
  ertrag: number;
  dauer: number;
  power: number;
  kwh: number;
  kosten: number;
  effizienz: number;
};

type GrowTimeline = {
  sorte: string;
  keimung: number | null;
  saemling: number | null;
  vegi: number | null;
  bluete: number | null;
  trocknung: number | null;
  curing: number | null;
};

export function ArchiveTab({ apiFetch }: { apiFetch: any }) {
  const [authorized, setAuthorized] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ history: GrowHistory[], timeline: GrowTimeline[] } | null>(null);

  const authorize = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/grow/archive?passphrase=${encodeURIComponent(passphrase)}`);
      if (res.ok) {
        setData(res);
        setAuthorized(true);
        localStorage.setItem('archive_auth_token', passphrase);
      } else {
        setError(res.error === 'PASS_REQUIRED' ? 'Access Denied: Invalid Kernel Key' : res.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('archive_auth_token');
    if (saved) {
      setPassphrase(saved);
      // We can't call authorize directly because of the state closure, 
      // but we can trigger it.
      const trigger = async () => {
         setLoading(true);
         try {
           const res = await apiFetch(`/api/grow/archive?passphrase=${encodeURIComponent(saved)}`);
           if (res.ok) {
             setData(res);
             setAuthorized(true);
           }
         } catch(e) {}
         finally { setLoading(false); }
      };
      trigger();
    }
  }, [apiFetch]);

  if (!authorized) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-12">
        <div className="relative">
           <div className="p-8 bg-emerald-600 rounded-2xl shadow-[0_0_50px_rgba(204,0,0,0.4)]">
              <Lock className="w-12 h-12 text-black" />
           </div>
           <div className="absolute -top-4 -right-4 w-12 h-12 border-t-2 border-r-2 border-emerald-500 rounded-tr-xl opacity-50" />
           <div className="absolute -bottom-4 -left-4 w-12 h-12 border-b-2 border-l-2 border-emerald-500 rounded-bl-xl opacity-50" />
        </div>
        
        <div className="text-center space-y-4">
           <h2 className="text-3xl font-black text-emerald-500 tracking-[0.2em] uppercase font-hacker italic">Encrypted_Archive</h2>
           <p className="text-[10px] text-emerald-500 font-black tracking-[0.4em] uppercase opacity-60">Level_4 Authorization Required</p>
        </div>

        <form onSubmit={authorize} className="w-full max-w-md space-y-6">
           <div className="relative group">
              <input 
                type="password" 
                value={passphrase}
                onChange={e => setPassphrase(e.target.value)}
                placeholder="Enter Kernel Passphrase..."
                className="w-full bg-black border border-emerald-900/30 hacker-frame px-10 py-6 text-sm text-emerald-500 placeholder:text-emerald-950 focus:outline-none focus:border-emerald-600 transition-all shadow-inner"
              />
              <button 
                type="submit"
                disabled={loading}
                className="absolute right-4 top-4 p-4 rounded bg-emerald-600 text-black hover:bg-emerald-500 transition-all shadow-2xl disabled:opacity-50"
              >
                <ArrowRight className={`w-6 h-6 ${loading ? 'animate-pulse' : ''}`} />
              </button>
           </div>
           {error && <p className="text-[10px] text-emerald-600 font-black uppercase text-center tracking-widest animate-pulse">{error}</p>}
        </form>
      </div>
    );
  }

  if (loading && !data) {
    return <BackTrackLoading label="Syncing_Archive_Data..." />;
  }

  return (
    <div className="space-y-24 animate-fade-in">
      
      {/* Overview Table */}
      <SectionCard title="Alle_Grows – System_Overiew" icon={Database} accent>
         <div className="overflow-x-auto hacker-frame bg-black/40 border-emerald-900/20">
            <table className="w-full text-left border-collapse font-hacker">
               <thead>
                  <tr className="border-b-2 border-emerald-600/30 bg-emerald-950/10">
                     <th className="px-8 py-6 text-[10px] font-black text-emerald-500 uppercase tracking-widest">Grow_ID</th>
                     <th className="px-8 py-6 text-[10px] font-black text-emerald-500 uppercase tracking-widest">Sorte / Strain</th>
                     <th className="px-8 py-6 text-[10px] font-black text-emerald-500 uppercase tracking-widest">Ertrag (g)</th>
                     <th className="px-8 py-6 text-[10px] font-black text-emerald-500 uppercase tracking-widest">Dauer (T)</th>
                     <th className="px-8 py-6 text-[10px] font-black text-emerald-500 uppercase tracking-widest">Effizienz</th>
                     <th className="px-8 py-6 text-[10px] font-black text-emerald-500 uppercase tracking-widest">Datum</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-emerald-900/10">
                  {data?.history && Array.isArray(data.history) && data.history.length > 0 ? (
                    [...data.history].sort((a,b) => {
                       const idA = parseInt(a.id) || 0;
                       const idB = parseInt(b.id) || 0;
                       if (idA !== idB) return idB - idA;
                       return (b.datum || '').localeCompare(a.datum || '');
                    }).map((run) => (
                    <tr key={`${run.id}-${run.sorte}`} className="hover:bg-emerald-600/5 transition-colors group">
                       <td className="px-8 py-6 text-[12px] font-black text-emerald-900/70 group-hover:text-emerald-500">#{String(run.id || '').padStart(3, '0')}</td>
                       <td className="px-8 py-6">
                          <div className="flex flex-col">
                             <span className="text-[14px] font-black text-emerald-500 group-hover:glow-emerald transition-all uppercase">{run.sorte || 'UNKNOWN_NODE'}</span>
                             <span className="text-[8px] text-emerald-950 font-black uppercase mt-1">{run.trainings || 'N/A'} · {run.pflanzen || 0} Plants</span>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                             <span className="text-[16px] font-black text-emerald-500">{run.ertrag}g</span>
                             <div className="w-16 h-1.5 bg-emerald-950/20 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-600" style={{ width: `${Math.min(run.ertrag, 100)}%` }} />
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-6 text-[14px] font-black text-emerald-400">{run.dauer}d</td>
                       <td className="px-8 py-6">
                          <span className={`px-4 py-1 rounded text-[10px] font-black uppercase ${run.effizienz > 0.5 ? 'bg-emerald-600 text-black' : 'bg-emerald-950/20 text-emerald-500 border border-emerald-900/30'}`}>
                             {Number(run.effizienz || 0).toFixed(2)} g/kWh
                          </span>
                       </td>
                       <td className="px-8 py-6 text-[11px] font-black text-emerald-900 uppercase tabular-nums">{run.datum}</td>
                    </tr>
                  ))
                  ) : (
                    <tr>
                       <td colSpan={6} className="px-8 py-24 text-center">
                          <p className="text-[10px] text-emerald-950 font-black uppercase tracking-[0.4em]">No_Historical_Data_Found</p>
                       </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </SectionCard>

      {/* Timeline Visualization */}
      <SectionCard title="Grow-Phasen – Temporal_Deployment" icon={Activity}>
         <div className="space-y-12">
            {data?.timeline && Array.isArray(data.timeline) && data.timeline.length > 0 ? data.timeline.map((run, i) => (
               <div key={i} className="hacker-frame p-8 bg-white/[0.01] hover:bg-emerald-600/5 transition-all">
                  <div className="flex justify-between items-center mb-8">
                     <h4 className="text-[13px] font-black text-emerald-500 uppercase tracking-wider">{run.sorte}</h4>
                     <span className="text-[9px] text-emerald-950 font-black uppercase tracking-[0.3em]">Phase_Analysis</span>
                  </div>
                  
                  <div className="relative h-10 w-full bg-emerald-950/10 rounded-lg overflow-hidden flex">
                     {run.keimung && (
                        <PhaseSegment label="Keim" start={run.keimung} end={run.saemling} color="bg-emerald-900" />
                     )}
                     {run.saemling && (
                        <PhaseSegment label="Seed" start={run.saemling} end={run.vegi} color="bg-emerald-800" />
                     )}
                     {run.vegi && (
                        <PhaseSegment label="Vegi" start={run.vegi} end={run.bluete} color="bg-emerald-700" />
                     )}
                     {run.bluete && (
                        <PhaseSegment label="Bloom" start={run.bluete} end={run.trocknung} color="bg-emerald-600" />
                     )}
                     {run.trocknung && (
                        <PhaseSegment label="Dry" start={run.trocknung} end={run.curing} color="bg-emerald-500" />
                     )}
                  </div>

                  <div className="grid grid-cols-5 mt-6 gap-4">
                     <PhaseDate label="Start" ts={run.keimung} />
                     <PhaseDate label="Vegi" ts={run.vegi} />
                     <PhaseDate label="Bloom" ts={run.bluete} />
                     <PhaseDate label="Harvest" ts={run.trocknung} />
                     <PhaseDate label="Done" ts={run.curing} />
                  </div>
               </div>
            )) : (
              <div className="py-12 text-center opacity-30">
                 <p className="text-[10px] font-black uppercase tracking-widest">Temporal_Data_Unavailable</p>
              </div>
            )}
         </div>
      </SectionCard>

    </div>
  );
}

function PhaseSegment({ label, start, end, color }: { label: string, start: number, end: number | null, color: string }) {
   if (!end) return null;
   const duration = (end - start) / 86400000;
   return (
      <div 
        className={`${color} flex items-center justify-center group relative cursor-pointer border-r border-black/20 hover:brightness-125 transition-all`}
        style={{ flex: duration }}
      >
         <span className="text-[8px] font-black text-emerald-500/40 group-hover:text-emerald-500 uppercase truncate px-2">{label}</span>
         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black border border-emerald-600 px-3 py-1 rounded text-[9px] font-black text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            {Math.round(duration)} Days
         </div>
      </div>
   );
}

function PhaseDate({ label, ts }: { label: string, ts: number | null }) {
   if (!ts) return <div className="text-center opacity-20"><p className="text-[8px] font-black uppercase text-emerald-950">{label}</p><p className="text-[10px] font-black text-gray-900">—</p></div>;
   const date = new Date(ts).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
   return (
      <div className="text-center">
         <p className="text-[8px] font-black uppercase text-emerald-950 mb-1">{label}</p>
         <p className="text-[10px] font-black text-emerald-500">{date}</p>
      </div>
   );
}
