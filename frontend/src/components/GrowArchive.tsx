import React, { useState, useEffect } from 'react';
import { 
  Trophy, Calendar, Hash, Activity, MessageSquare, 
  ChevronRight, BarChart3, Star, Download, ExternalLink,
  Plus, X, Lock, Save, AlertTriangle
} from 'lucide-react';
import { SectionCard, Skeleton } from './ui';

interface ArchivedGrow {
  id: string;
  strain: string;
  start_date: string;
  harvest_date: string;
  yield_g: number;
  avg_temp: number;
  avg_vpd: number;
  notes: string;
  rating: number;
}

export function GrowArchive({ apiFetch, toast }: any) {
  const [archive, setArchive] = useState<ArchivedGrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [passphrase, setPassphrase] = useState(localStorage.getItem('grow_archive_pass') || '');
  const [isLocked, setIsLocked] = useState(!localStorage.getItem('grow_archive_pass'));
  
  // Form State
  const [formData, setFormData] = useState({
    strain: '',
    start_date: new Date().toISOString().split('T')[0],
    harvest_date: new Date().toISOString().split('T')[0],
    yield_g: '',
    avg_temp: '24.5',
    avg_vpd: '1.1',
    notes: '',
    rating: 5,
    password: ''
  });

  const fetchArchive = async (overridePass?: string) => {
    const activePass = overridePass || passphrase;
    if (!activePass) {
      setLoading(false);
      setIsLocked(true);
      return;
    }
    console.log("[ARCHIVE] Fetching with pass:", activePass.substring(0, 3) + "...");
    try {
      const data = await apiFetch(`/api/grow/archive?passphrase=${activePass}`);
      console.log("[ARCHIVE] Response received:", data);
      if (data?.error === 'PASS_REQUIRED') {
        setIsLocked(true);
        return;
      }
      setIsLocked(false);
      // Handle both old array format and new { history: [] } format
      if (data && data.history) {
        setArchive(Array.isArray(data.history) ? data.history : []);
      } else {
        setArchive(Array.isArray(data) ? data : []);
      }
    } catch (e) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchArchive(); }, [apiFetch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/grow/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res?.ok) {
        toast('success', 'Grow erfolgreich archiviert');
        setShowModal(false);
        fetchArchive();
      } else {
        toast('error', res?.error || 'Archivierung fehlgeschlagen');
      }
    } catch (e: any) {
      toast('error', e.message);
    }
  };

  if (loading) return (
    <div className="space-y-8">
      {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-[2.5rem]" />)}
    </div>
  );

  return (
    <div className="space-y-12 animate-fade-in relative">
      
      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-black/60 animate-fade-in">
          <div className="glass-panel w-full max-w-2xl rounded-[3rem] p-10 border-flow shadow-2xl relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-8 right-8 p-3 rounded-full hover:bg-emerald-950/10 transition-all text-emerald-900/70 hover:text-emerald-500"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-4 mb-8">
               <div className="p-4 bg-amber-500/10 rounded-2xl">
                 <Trophy className="w-8 h-8 text-amber-500 glow-amber" />
               </div>
               <div>
                 <h4 className="text-2xl font-black text-emerald-500 tracking-tighter uppercase">Grow Abschließen</h4>
                 <p className="text-emerald-900/70 text-[10px] font-black uppercase tracking-widest">Projekt in die Hall of Fame verschieben</p>
               </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-[10px] text-emerald-900/70 font-black uppercase tracking-widest ml-1">Sorten / Node Name</label>
                   <input 
                     required
                     value={formData.strain}
                     onChange={e => setFormData({...formData, strain: e.target.value})}
                     className="w-full bg-black/40 border border-emerald-900/20 rounded-2xl px-6 py-4 text-sm text-emerald-500 focus:outline-none focus:border-amber-500/50 transition-all"
                     placeholder="z.B. Bubba Kush #3"
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] text-emerald-900/70 font-black uppercase tracking-widest ml-1">Ertrag (g)</label>
                   <input 
                     type="number"
                     required
                     value={formData.yield_g}
                     onChange={e => setFormData({...formData, yield_g: e.target.value})}
                     className="w-full bg-black/40 border border-emerald-900/20 rounded-2xl px-6 py-4 text-sm text-emerald-500 focus:outline-none focus:border-amber-500/50 transition-all"
                     placeholder="120"
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] text-emerald-900/70 font-black uppercase tracking-widest ml-1">Start Datum</label>
                   <input 
                     type="date"
                     required
                     value={formData.start_date}
                     onChange={e => setFormData({...formData, start_date: e.target.value})}
                     className="w-full bg-black/40 border border-emerald-900/20 rounded-2xl px-6 py-4 text-sm text-emerald-500 focus:outline-none focus:border-amber-500/50 transition-all"
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] text-emerald-900/70 font-black uppercase tracking-widest ml-1">Ernte Datum</label>
                   <input 
                     type="date"
                     required
                     value={formData.harvest_date}
                     onChange={e => setFormData({...formData, harvest_date: e.target.value})}
                     className="w-full bg-black/40 border border-emerald-900/20 rounded-2xl px-6 py-4 text-sm text-emerald-500 focus:outline-none focus:border-amber-500/50 transition-all"
                   />
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] text-emerald-900/70 font-black uppercase tracking-widest ml-1">Notizen & Fazit</label>
                 <textarea 
                   value={formData.notes}
                   onChange={e => setFormData({...formData, notes: e.target.value})}
                   className="w-full bg-black/40 border border-emerald-900/20 rounded-2xl px-6 py-4 text-sm text-emerald-500 h-24 focus:outline-none focus:border-amber-500/50 transition-all resize-none"
                   placeholder="Besonderheiten, Probleme, Geschmack..."
                 />
               </div>

               <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem] space-y-4">
                  <div className="flex items-center gap-3 text-emerald-400 font-black text-[11px] uppercase tracking-widest">
                    <Lock className="w-4 h-4" /> Autorisierung Erforderlich
                  </div>
                  <input 
                    type="password"
                    required
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    placeholder="Admin Passphrase eingeben..."
                    className="w-full bg-black/60 border border-emerald-500/20 rounded-xl px-6 py-4 text-sm text-emerald-500 focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
               </div>

               <button 
                 type="submit"
                 className="w-full py-5 rounded-2xl bg-amber-500 text-black font-black text-[12px] uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-3"
               >
                 <Save className="w-5 h-5" /> Archivieren & Speichern
               </button>
            </form>
          </div>
        </div>
      )}

      {/* Hall of Fame Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-3xl font-black text-emerald-500 tracking-tighter flex items-center gap-4">
            <Trophy className="text-amber-400 w-8 h-8 glow-amber" /> Grow Archiv
          </h3>
          <p className="text-emerald-900/70 text-xs font-bold uppercase tracking-widest mt-2">
            Historie abgeschlossener Projekte & Grafana-Benchmarks
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-6 py-4 rounded-2xl bg-amber-500 text-black hover:bg-white transition-all flex items-center gap-3 text-[11px] font-black uppercase tracking-widest shadow-xl shadow-amber-500/10"
        >
          <Plus className="w-4 h-4" /> Grow abschließen
        </button>
      </div>

      {/* Comparison Insight */}
      {archive.length > 0 && (
        <div className="glass-panel p-8 rounded-[3rem] border-flow bg-gradient-to-br from-emerald-500/5 to-transparent">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="p-6 bg-emerald-600/10 rounded-[2.5rem] border border-emerald-600/20">
               <BarChart3 className="w-12 h-12 text-emerald-400 glow-emerald" />
            </div>
            <div className="flex-1">
               <h4 className="text-lg font-black text-emerald-500 uppercase tracking-tight mb-2">Performance Insight</h4>
               <p className="text-sm text-emerald-400 leading-relaxed font-medium">
                 Dein aktueller Run hat eine um <span className="text-emerald-400 font-black">12% stabilere</span> VPD-Kurve 
                 im Vergleich zum besten Archiv-Run (<span className="text-emerald-500">{archive[0].strain}</span>).
               </p>
            </div>
            <div className="flex gap-4">
               <div className="text-center px-6 border-r border-emerald-900/20">
                 <p className="text-[10px] text-emerald-900/70 font-black uppercase mb-1">Avg Yield</p>
                 <p className="text-2xl font-black text-emerald-500 tabular-nums">{Math.round(archive.reduce((acc, g) => acc + g.yield_g, 0) / archive.length)}g</p>
               </div>
               <div className="text-center">
                 <p className="text-[10px] text-emerald-900/70 font-black uppercase mb-1">Total Runs</p>
                 <p className="text-2xl font-black text-amber-400 glow-amber tabular-nums">{archive.length}</p>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Locked State / Passphrase Prompt */}
      {isLocked && (
        <div className="py-32 flex flex-col items-center justify-center space-y-12 animate-fade-in">
          <div className="p-10 bg-emerald-500/10 rounded-[3rem] border border-emerald-500/20 shadow-2xl relative group">
             <div className="absolute inset-0 bg-emerald-600/5 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-1000" />
             <Lock className="w-16 h-16 text-emerald-500 glow-emerald relative z-10" />
          </div>
          <div className="text-center space-y-4 max-w-md">
             <h3 className="text-2xl font-black text-emerald-500 tracking-tighter uppercase">Vault_Access_Required</h3>
             <p className="text-xs text-emerald-900/70 font-bold uppercase tracking-[0.2em] leading-relaxed">
               Historische Daten sind verschlüsselt. Bitte gib die Admin-Passphrase ein, um den Zugriff zu autorisieren.
             </p>
          </div>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const val = (e.target as any).pass.value;
              localStorage.setItem('grow_archive_pass', val);
              setPassphrase(val);
              fetchArchive(val);
            }}
            className="flex flex-col sm:flex-row gap-4 w-full max-w-md"
          >
             <input 
               name="pass"
               type="password"
               placeholder="Passphrase eingeben..."
               className="flex-1 bg-black/60 border border-emerald-900/30 rounded-2xl px-8 py-4 text-sm text-emerald-500 focus:outline-none focus:border-emerald-500/50 transition-all shadow-inner"
             />
             <button type="submit" className="px-10 py-4 bg-emerald-600 text-black font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-600/20">
                Unlock
             </button>
          </form>
        </div>
      )}

      {/* Archive Grid */}
      {!isLocked && (
        <div className="grid grid-cols-1 gap-8">
        {(Array.isArray(archive) ? archive : []).slice().reverse().map((grow: any) => (
          <div key={grow.id || grow.sorte} className="group relative glass-card p-8 rounded-[3rem] border-flow hover:bg-white/[0.04] transition-all overflow-hidden">
            
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Trophy className="w-32 h-32" />
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row gap-12">
              {/* Left Info */}
              <div className="lg:w-1/3">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black border border-amber-500/20 glow-amber">
                    {(grow.harvest_date || grow.datum || '0000-00-00').split('-')[0]} Run
                  </span>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < grow.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-800'}`} />
                    ))}
                  </div>
                </div>
                <h4 className="text-3xl font-black text-emerald-500 tracking-tighter mb-4 group-hover:text-amber-400 transition-colors uppercase">
                  {grow.sorte || grow.strain}
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-xs text-emerald-400 font-medium">
                    <Calendar className="w-4 h-4 text-emerald-900" />
                    {grow.datum || `${grow.start_date} bis ${grow.harvest_date}`}
                  </div>
                </div>
              </div>
 
              {/* Stats Center */}
              <div className="lg:flex-1 grid grid-cols-3 gap-6 border-x border-emerald-900/20 px-8">
                 <div className="text-center">
                   <p className="text-[10px] text-emerald-900/70 font-black uppercase tracking-widest mb-2">Ertrag</p>
                   <p className="text-3xl font-black text-emerald-500 tabular-nums tracking-tighter">{grow.ertrag || grow.yield_g}g</p>
                 </div>
                 <div className="text-center border-x border-emerald-900/20 px-6">
                   <p className="text-[10px] text-emerald-900/70 font-black uppercase tracking-widest mb-2">Efficiency / VPD</p>
                   <p className="text-3xl font-black text-emerald-400 glow-emerald tabular-nums tracking-tighter">{grow.effizienz || grow.avg_vpd} <span className="text-xs">{grow.effizienz ? 'g/kWh' : 'kPa'}</span></p>
                 </div>
                 <div className="text-center">
                   <p className="text-[10px] text-emerald-900/70 font-black uppercase tracking-widest mb-2">Duration / Temp</p>
                   <p className="text-3xl font-black text-cyan-400 glow-cyan tabular-nums tracking-tighter">{grow.dauer || grow.avg_temp}{grow.dauer ? 'd' : '°C'}</p>
                 </div>
              </div>

              {/* Right: Notes & Links */}
              <div className="lg:w-1/4 flex flex-col justify-between gap-6">
                 <p className="text-sm text-emerald-900/70 font-medium italic leading-relaxed">
                   "{grow.notes || 'Routineprüfung abgeschlossen.'}"
                 </p>
                 <div className="flex gap-3">
                    <a 
                      href={`http://localhost:3000/d/grow-dashboard?from=${new Date(grow.start_date).getTime()}&to=${new Date(grow.harvest_date).getTime()}`}
                      target="_blank" 
                      rel="noreferrer"
                      className="flex-1 py-3 rounded-2xl bg-emerald-950/10 border border-emerald-900/30 hover:border-white/20 text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Grafana View
                    </a>
                 </div>
              </div>
            </div>

          </div>
        ))}
      </div>
      )}

    </div>
  );
}
