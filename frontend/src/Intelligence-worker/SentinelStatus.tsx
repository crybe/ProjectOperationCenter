import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertCircle, Zap, RefreshCw, CheckCircle } from 'lucide-react';
import mascotAerith from '../assets/mascot_aerith.png';

export function SentinelStatus({ apiFetch, toast }: any) {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);

  const check = async () => {
    try {
      const res = await apiFetch('/api/ki/sentinel/status');
      if (res.ok) setIssues(res.issues || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    check();
    const t = setInterval(check, 60000);
    return () => clearInterval(t);
  }, []);

  const handleApply = async (issue: any) => {
    setApplying(issue.id);
    try {
      const res = await apiFetch('/api/ki/sentinel/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action_cmd: issue.action_cmd })
      });
      if (res.ok) {
        toast('success', `Sentinel: ${res.message}`);
        check();
      } else {
        toast('error', res.error || 'Fix fehlgeschlagen');
      }
    } catch (e: any) {
      toast('error', e.message);
    } finally {
      setApplying(null);
    }
  };

  if (loading && issues.length === 0) return null;

  return (
    <div className="space-y-4 relative group/sentinel">
      <img src={mascotAerith} className="mascot-ornament" style={{ width: '180px', opacity: '0.1' }} alt="Mascot" />
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
           <ShieldCheck className={`w-4 h-4 ${issues.length > 0 ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`} />
           <span className="text-[10px] font-black uppercase tracking-widest text-emerald-900/70">Sentinel System Guard</span>
        </div>
        {issues.length > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-widest animate-bounce">
            {issues.length} Anomalien
          </span>
        )}
      </div>

      {issues.length === 0 ? (
        <div className="p-4 glass-card rounded-2xl flex items-center gap-4 border-l-2 border-emerald-600/50">
          <CheckCircle className="w-5 h-5 text-emerald-500/40" />
          <p className="text-[11px] text-emerald-900/70 font-bold uppercase tracking-tight">Alle Subsysteme arbeiten innerhalb der Nominalwerte.</p>
        </div>
      ) : (
        <div className="space-y-3 relative z-10">
          {issues.map(issue => (
            <div key={issue.id} className="p-5 glass-card rounded-2xl border-l-2 border-emerald-500/50 animate-fade-in group relative overflow-hidden">
               <img src={mascotAerith} className="mascot-ornament" style={{ width: '100px', opacity: '0.05' }} alt="Mascot" />
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className={`w-4 h-4 ${issue.severity === 'error' ? 'text-emerald-500' : 'text-amber-500'}`} />
                    <h4 className="text-xs font-black text-emerald-500 uppercase tracking-tight">{issue.title}</h4>
                  </div>
                  <p className="text-[10px] text-emerald-400 leading-relaxed italic">{issue.description}</p>
                </div>
                <button 
                  onClick={() => handleApply(issue)}
                  disabled={applying === issue.id}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/10 border border-emerald-600/30 text-[10px] font-black text-emerald-400 uppercase tracking-widest hover:bg-emerald-600 hover:text-black transition-all"
                >
                  {applying === issue.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                  {issue.action_label}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
