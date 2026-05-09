import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Thermometer, Droplet, Wind, Zap, Leaf, Droplets, MessageSquare, AlertTriangle, ChevronDown,
  BookOpen, Plus, Trash2, ChevronRight, Lightbulb, CalendarDays,
  AlertCircle, CheckCircle2, Info, Sparkles, Lock,
} from 'lucide-react';
import mascotAerith from '../assets/mascot_aerith.png';
import { useApi } from '../hooks/useApi';
import { MetricCard, SectionCard, RangeBar, Skeleton } from '../components/ui';
import { ToastContainer, useToast } from '../components/Toast';
import { GrowCore3D } from '../components/GrowCore3D';


function PigeonGrowAdvisory({ apiFetch }: { apiFetch: any }) {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/ki/grow-advice').then((res: any) => {
      if (Array.isArray(res)) setAdvice(res[0]); // Nehme den ersten Tipp als Advisory
      else if (res.advice) setAdvice(res.advice);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [apiFetch]);

  if (!advice && !loading) return null;

  return (
    <div className="mb-8 relative group">
       <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
       <div className="relative glass-panel p-8 rounded-[2rem] border-emerald-500/10 flex items-center gap-10 overflow-hidden">
          {/* Tactical Mascot Advisor */}
          <div className="relative shrink-0">
             <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse" />
             <div className="w-24 h-24 rounded-2xl border-2 border-emerald-500/20 overflow-hidden relative z-10 bg-black/40">
                <img src={mascotAerith} alt="Aerith Advisor" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
             </div>
             <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-black text-[8px] font-black px-2 py-1 rounded-sm shadow-xl z-20">ADVISOR_V2</div>
          </div>

          <div className="flex-1">
             <div className="flex items-center gap-3 mb-3">
                <MessageSquare className="w-5 h-5 text-emerald-500" />
                <span className="text-[12px] text-emerald-500 font-black uppercase tracking-[0.4em]">P.I.G.E.O.N._GROW_ADVISORY</span>
             </div>
             {loading ? (
                <div className="space-y-2">
                   <div className="h-4 bg-emerald-500/10 rounded animate-pulse w-3/4" />
                   <div className="h-4 bg-emerald-500/10 rounded animate-pulse w-1/2" />
                </div>
             ) : (
                <p className="text-lg font-medium text-emerald-100 leading-relaxed italic">
                   "{advice || 'Analyse läuft...'}"
                </p>
             )}
          </div>
          
          <div className="shrink-0 flex flex-col items-end gap-2 opacity-30">
             <div className="w-16 h-1 bg-emerald-950 rounded-full overflow-hidden">
                <div className="w-2/3 h-full bg-emerald-500 animate-pulse" />
             </div>
             <span className="text-[8px] text-emerald-900 font-black uppercase tracking-widest">Confidence: 94%</span>
          </div>
       </div>
    </div>
  );
}

function CircularGauge({ value, min, max, label, unit, color = '#10b981' }: { value: number, min: number, max: number, label: string, unit: string, color?: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const progress = value ? ((value - min) / (max - min)) * circumference : 0;
  
  return (
    <div className="flex flex-col items-center gap-3 hacker-frame p-6 bg-black/40 border-emerald-900/10 shadow-2xl group overflow-hidden relative">
      <div className="bracket-corner bracket-tl" />
      <div className="bracket-corner bracket-tr" />
      <div className="bracket-corner bracket-bl" />
      <div className="bracket-corner bracket-br" />
      <div className="absolute inset-0 scan-overlay opacity-10" />
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-emerald-950"
          />
          <motion.circle
            cx="64"
            cy="64"
            r={radius}
            stroke={color}
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (isNaN(progress) ? 0 : progress) }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
            className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-emerald-500 font-mono tracking-tighter drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]">{value ?? '—'}{unit}</span>
          <span className="text-[11px] text-emerald-900 font-black uppercase tracking-widest mt-1">{label}</span>
        </div>
      </div>
      <div className="w-full h-1 bg-emerald-950/30 rounded-full overflow-hidden mt-2">
        <motion.div 
           className="h-full bg-emerald-600"
           initial={{ width: 0 }}
           animate={{ width: `${value ? ((value - min) / (max - min)) * 100 : 0}%` }}
           transition={{ duration: 1.5 }}
        />
      </div>
    </div>
  );
}

// ── Tipps-Analyse ─────────────────────────────────────────────────────────────
type TipLevel = 'error' | 'warn' | 'info' | 'ok';
interface Tip { level: TipLevel; text: string; detail: string; }

function analyzeTips(d: any): Tip[] {
  if (!d) return [];
  const tips: Tip[] = [];

  // VPD
  if (d.vpd != null) {
    const oMin = d.vpd_opt_min ?? 1.0, oMax = d.vpd_opt_max ?? 1.4;
    if (d.vpd < oMin - 0.3) tips.push({ level: 'error', text: `VPD kritisch niedrig (${d.vpd} kPa)`, detail: 'Luftfeuchtigkeit senken oder Temperatur erhöhen' });
    else if (d.vpd < oMin) tips.push({ level: 'warn', text: `VPD unter Zielbereich (${d.vpd} kPa)`, detail: `Ziel ${oMin}–${oMax} kPa` });
    else if (d.vpd > oMax + 0.3) tips.push({ level: 'error', text: `VPD kritisch hoch (${d.vpd} kPa)`, detail: 'Luftfeuchtigkeit erhöhen oder Temperatur senken' });
    else if (d.vpd > oMax) tips.push({ level: 'warn', text: `VPD über Zielbereich (${d.vpd} kPa)`, detail: `Ziel ${oMin}–${oMax} kPa` });
  }

  // Temperatur
  if (d.temp != null) {
    const tMin = d.temp_ziel_min ?? 20, tMax = d.temp_ziel_max ?? 26;
    if (d.temp > tMax + 3) tips.push({ level: 'error', text: `Temperatur zu hoch (${d.temp}°C)`, detail: 'Lüftung maximieren, Lampen-Abstand prüfen' });
    else if (d.temp > tMax) tips.push({ level: 'warn', text: `Temperatur leicht erhöht (${d.temp}°C)`, detail: `Ziel ${tMin}–${tMax}°C` });
    else if (d.temp < tMin - 3) tips.push({ level: 'error', text: `Temperatur zu niedrig (${d.temp}°C)`, detail: 'Heizquelle prüfen, Lüftung drosseln' });
    else if (d.temp < tMin) tips.push({ level: 'warn', text: `Temperatur leicht niedrig (${d.temp}°C)`, detail: `Ziel ${tMin}–${tMax}°C` });
  }

  // 24h-Schwankung
  if (d.temp_min_24h != null && d.temp_max_24h != null) {
    const swing = +(d.temp_max_24h - d.temp_min_24h).toFixed(1);
    if (swing > 10) tips.push({ level: 'warn', text: `Starke Temp-Schwankung (Δ${swing}°C/24h)`, detail: 'Nacht-Abkühlung zu stark – Lüftung nachts reduzieren' });
    else if (swing > 7) tips.push({ level: 'info', text: `Temp-Schwankung (Δ${swing}°C/24h)`, detail: 'Im Auge behalten, Ziel ≤ 7°C Differenz' });
  }

  // Luftfeuchtigkeit
  if (d.hum != null) {
    const hMin = d.hum_ziel_min ?? 40, hMax = d.hum_ziel_max ?? 60;
    if (d.hum > hMax + 10) tips.push({ level: 'error', text: `Luftfeuchtigkeit zu hoch (${d.hum}%)`, detail: 'Schimmelgefahr – Abluft & Circulation erhöhen' });
    else if (d.hum > hMax) tips.push({ level: 'warn', text: `Luftfeuchtigkeit erhöht (${d.hum}%)`, detail: `Ziel ${hMin}–${hMax}%` });
    else if (d.hum < hMin - 15) tips.push({ level: 'warn', text: `Luftfeuchtigkeit sehr niedrig (${d.hum}%)`, detail: 'Pflanze transpiriert stärker – Gießintervall kürzer' });
    else if (d.hum < hMin) tips.push({ level: 'info', text: `Luftfeuchtigkeit leicht niedrig (${d.hum}%)`, detail: `Ziel ${hMin}–${hMax}%` });
  }

  // Bewässerung
  if (d.watering_alert === 'overdue') tips.push({ level: 'error', text: 'Bewässerung überfällig!', detail: `Seit ${d.watering_days_since?.toFixed(1)} Tagen nicht gegossen` });
  else if (d.watering_alert === 'due') tips.push({ level: 'warn', text: 'Gießen jetzt fällig', detail: `Angepasstes Intervall: ${d.watering_adj_interval?.toFixed(1)}d` });
  else if (d.watering_alert === 'soon') tips.push({ level: 'info', text: `Gießen in ~${d.watering_days_until?.toFixed(1)} Tag(en)`, detail: `Ø ${d.watering_avg?.toFixed(1)}d Intervall (VPD-korrigiert)` });

  // Blüte-Phase
  if (d.bluete_day != null && d.bluete_dauer != null) {
    const pct = (d.bluete_day / d.bluete_dauer) * 100;
    if (d.ernte_days != null && d.ernte_days <= 7 && d.ernte_days > 0)
      tips.push({ level: 'info', text: `Ernte in ~${d.ernte_days} Tagen`, detail: 'Spülphase prüfen · Trichome (Amber-Anteil) beobachten' });
    else if (pct >= 85)
      tips.push({ level: 'info', text: `Endphase Blüte (${d.bluete_day}/${d.bluete_dauer} Tage)`, detail: 'Stickstoff-Zufuhr reduzieren, Kalium-Fokus' });
    else if (d.bluete_day <= 7)
      tips.push({ level: 'info', text: `Frühe Blüte – Tag ${d.bluete_day}`, detail: 'VPD auf 0.8–1.1 kPa halten, weniger Stress' });
    else if (d.bluete_day >= 21 && d.bluete_day <= 28)
      tips.push({ level: 'info', text: `Stretch-Phase abgeschlossen (Tag ${d.bluete_day})`, detail: 'Licht-Intensität jetzt maximieren' });
  }

  // Alles OK
  if (tips.length === 0)
    tips.push({ level: 'ok', text: 'Alle Parameter im Zielbereich', detail: 'Grow läuft optimal – weiter so' });

  // Sortierung: error > warn > info > ok
  const order: Record<TipLevel, number> = { error: 0, warn: 1, info: 2, ok: 3 };
  return tips.sort((a, b) => order[a.level] - order[b.level]);
}

const TIP_STYLES: Record<TipLevel, { bar: string; icon: string; bg: string; text: string }> = {
  error: { bar: 'bg-emerald-500', icon: 'text-emerald-400', bg: 'bg-emerald-500/8   border-emerald-500/20', text: 'text-emerald-300' },
  warn: { bar: 'bg-amber-500', icon: 'text-amber-400', bg: 'bg-amber-500/8  border-amber-500/20', text: 'text-amber-300' },
  info: { bar: 'bg-cyan-500', icon: 'text-cyan-400', bg: 'bg-cyan-500/8   border-cyan-500/20', text: 'text-cyan-300' },
  ok: { bar: 'bg-emerald-600', icon: 'text-emerald-400', bg: 'bg-emerald-600/8 border-emerald-600/20', text: 'text-emerald-300' },
};
const TIP_ICONS: Record<TipLevel, React.ElementType> = {
  error: AlertCircle, warn: AlertTriangle, info: Info, ok: CheckCircle2,
};

function TipsCard({ data }: { data: any }) {
  const tips = analyzeTips(data);
  const worstLevel = tips[0]?.level ?? 'ok';
  const s = TIP_STYLES[worstLevel];

  return (
    <SectionCard title="Aktuelle Hinweise" icon={Lightbulb}
      action={
        <span className={`text-[12px] font-black font-mono px-3 py-1 rounded border ${s.bg} ${s.text} uppercase tracking-widest`}>
          {worstLevel === 'ok' ? 'Alles OK' : worstLevel === 'error' ? 'Achtung' : worstLevel === 'warn' ? 'Warnung' : 'Info'}
        </span>
      }>
      <div className="space-y-2.5">
        {tips.map((tip, i) => {
          const style = TIP_STYLES[tip.level];
          const IconComponent = TIP_ICONS[tip.level] as any;
          return (
            <div key={i} className={`flex gap-3 p-3 rounded-lg border ${style.bg} relative overflow-hidden`}>
              <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${style.bar}`} />
              <IconComponent className={`w-4 h-4 shrink-0 mt-0.5 ${style.icon}`} />
              <div className="min-w-0">
                <p className={`text-sm font-semibold leading-snug ${style.text}`}>{tip.text}</p>
                <p className="text-xs text-emerald-900/70 mt-0.5 leading-snug">{tip.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ── Bloom Countdown ──────────────────────────────────────────────────────────
function BloomProgress({ data }: { data: any }) {
  const pct = data.bluete_pct ?? 0;
  const barColor =
    pct < 50 ? 'from-emerald-500 to-emerald-400' :
      pct < 80 ? 'from-amber-500 to-yellow-400' :
        'from-emerald-500 to-emerald-400';

  return (
    <SectionCard title="Blüte Fortschritt" icon={CalendarDays}>
      <div className="space-y-4">
        <div className="text-center py-2">
          <div className="text-5xl font-bold font-mono text-emerald-400 mb-1">
            {data.bluete_day ?? '—'}
            <span className="text-base text-emerald-900/70 font-normal ml-1">
              / {data.bluete_dauer ?? '?'} T
            </span>
          </div>
          <p className="text-xs text-emerald-900/70">
            {data.ernte_days != null
              ? data.ernte_days > 0 ? `Ernte in ~${data.ernte_days} Tagen` : 'Ernte überfällig!'
              : 'Kein Erntedatum'}
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
            <span className="text-emerald-900/60">Blüte Fortschritt</span>
            <span className="font-mono font-bold text-emerald-400">{pct}%</span>
          </div>
          <div className="h-3 bg-gray-800/80 rounded-full overflow-hidden">
            <div className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-1000`}
              style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-black/20 rounded-lg p-2.5 text-center border border-emerald-900/10">
            <p className="text-tactical-label opacity-40 mb-1">Sorte</p>
            <p className="text-sm font-mono text-emerald-500 truncate">{data.sorte ?? '—'}</p>
          </div>
          <div className="bg-black/20 rounded-lg p-2.5 text-center border border-emerald-900/10">
            <p className="text-tactical-label opacity-40 mb-1">Phase</p>
            <p className="text-sm font-mono text-emerald-500">{data.grow_stage ?? '—'}</p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

// ── Grow Log ─────────────────────────────────────────────────────────────────
function GrowLog({ apiFetch, toast }: { apiFetch: any; toast: any }) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({ notes: '', ph: '', ec: '', date: '' });

  const load = useCallback(async () => {
    try { setEntries(await apiFetch('/api/grow-log-list')); }
    catch { } finally { setLoading(false); }
  }, [apiFetch]);

  useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/grow-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      toast('success', 'Eintrag gespeichert');
      setAdding(false); setForm({ notes: '', ph: '', ec: '', date: '' });
      load();
    } catch (e: any) { toast('error', e.message); }
  };

  const del = async (id: string) => {
    if (!confirm('Eintrag löschen?')) return;
    try { await apiFetch(`/api/grow-log/${id}`, { method: 'DELETE' }); load(); toast('info', 'Gelöscht'); }
    catch (e: any) { toast('error', e.message); }
  };

  return (
    <SectionCard title="Grow Logbuch" icon={BookOpen}
      action={
        <button onClick={() => setAdding(v => !v)}
          className="flex items-center gap-2 text-[12px] font-black text-emerald-500 hover:text-emerald-600 transition-all px-4 py-2 rounded-lg border border-emerald-600/30 bg-emerald-600/5 hover:bg-emerald-600/10 shadow-lg uppercase tracking-widest">
          <Plus className="w-4 h-4" /> NEW_ENTRY
        </button>
      }>
      <div className="space-y-4">
        {/* Add Form */}
        {adding && (
          <form onSubmit={submit} className="bg-black/60 rounded-xl p-6 border border-emerald-600/30 space-y-4 mb-6 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 scan-overlay opacity-5" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-emerald-900 uppercase tracking-widest ml-1">Date_Stamp</label>
                  <input type="date" value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full bg-emerald-950/10 border border-emerald-900/30 rounded-lg px-4 py-2.5 text-sm text-emerald-400
                      focus:outline-none focus:border-emerald-600/50 font-mono transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-emerald-900 uppercase tracking-widest ml-1">pH_Level</label>
                  <input placeholder="0.0" value={form.ph}
                    onChange={e => setForm(f => ({ ...f, ph: e.target.value }))}
                    className="w-full bg-emerald-950/10 border border-emerald-900/30 rounded-lg px-4 py-2.5 text-sm text-emerald-400
                      focus:outline-none focus:border-emerald-600/50 font-mono transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-emerald-900 uppercase tracking-widest ml-1">EC_Value</label>
                  <input placeholder="0.0" value={form.ec}
                    onChange={e => setForm(f => ({ ...f, ec: e.target.value }))}
                    className="w-full bg-emerald-950/10 border border-emerald-900/30 rounded-lg px-4 py-2.5 text-sm text-emerald-400
                      focus:outline-none focus:border-emerald-600/50 font-mono transition-all" />
                </div>
            </div>
            <div className="space-y-1.5 relative z-10">
              <label className="text-[8px] font-black text-emerald-900 uppercase tracking-widest ml-1">Observed_Telemetry</label>
              <textarea placeholder="Input botanical observations…" value={form.notes} rows={3}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full bg-emerald-950/10 border border-emerald-900/30 rounded-lg px-4 py-2.5 text-sm text-emerald-400
                  focus:outline-none focus:border-emerald-600/50 resize-none transition-all" />
            </div>
            <div className="flex gap-3 justify-end relative z-10">
              <button type="button" onClick={() => setAdding(false)}
                className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-900 hover:text-emerald-500 transition-colors">
                ABORT
              </button>
              <button type="submit"
                className="px-8 py-2 text-[10px] font-black uppercase tracking-widest bg-emerald-600 text-gray-950 rounded-lg hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20">
                COMMIT_DATA
              </button>
            </div>
          </form>
        )}

        {/* Entries */}
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 bg-emerald-600/5 border border-dashed border-emerald-600/20 rounded-xl">
               <p className="text-emerald-900 text-[10px] font-black uppercase tracking-[0.4em]">Database_Empty: NO_LOGS_FOUND</p>
            </div>
          ) : (
            entries.slice(0, 8).map(e => (
              <div key={e.id}
                className="group bg-black/40 border border-emerald-900/20 rounded-xl overflow-hidden hover:border-emerald-600/40 transition-all hover:shadow-[0_0_20px_rgba(204,0,0,0.1)]">
                <div className="flex items-center gap-4 px-4 py-3 cursor-pointer select-none"
                  onClick={() => setExpanded(exp => exp === e.id ? null : e.id)}>
                  <div className="flex flex-col shrink-0">
                    <span className="text-[8px] font-black text-emerald-900 uppercase tracking-widest">TS_DATE</span>
                    <span className="text-[10px] font-mono text-emerald-500 font-bold">{e.date}</span>
                  </div>
                  <div className="h-8 w-[1px] bg-emerald-900/30" />
                  <span className="text-xs text-emerald-400/80 truncate flex-1 font-bold">{e.notes || 'No notes recorded.'}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    {e.ph && (
                      <div className="flex flex-col items-end">
                        <span className="text-[7px] font-black text-emerald-900 uppercase">PH</span>
                        <span className="text-[10px] font-mono text-cyan-400 font-bold">{e.ph}</span>
                      </div>
                    )}
                    {e.ec && (
                      <div className="flex flex-col items-end">
                        <span className="text-[7px] font-black text-emerald-900 uppercase">EC</span>
                        <span className="text-[10px] font-mono text-purple-400 font-bold">{e.ec}</span>
                      </div>
                    )}
                    <div className={`p-1.5 rounded-lg bg-emerald-900/10 text-emerald-900 group-hover:text-emerald-500 transition-all ${expanded === e.id ? 'rotate-180 bg-emerald-600/20 text-emerald-500' : ''}`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>
                <AnimatePresence>
                  {expanded === e.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-4 border-t border-emerald-900/20 bg-emerald-600/5 flex justify-between items-start gap-6">
                        <div className="space-y-4 flex-1">
                           <div className="space-y-1">
                              <span className="text-[8px] font-black text-emerald-900 uppercase tracking-widest">Extended_Notes</span>
                              <p className="text-xs text-emerald-400 leading-relaxed font-bold italic">"{e.notes || '—'}"</p>
                           </div>
                           <div className="flex gap-6">
                              <div className="px-3 py-1 bg-black/40 border border-emerald-900/30 rounded-md">
                                 <span className="text-[7px] font-black text-emerald-900 uppercase tracking-widest block">Entry_ID</span>
                                 <span className="text-[9px] font-mono text-emerald-700">#LOG_{e.id.slice(0,6).toUpperCase()}</span>
                              </div>
                           </div>
                        </div>
                        <button onClick={() => del(e.id)}
                          className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-emerald-600/20 text-emerald-950 hover:text-emerald-500 transition-all group/del">
                          <Trash2 className="w-4 h-4" />
                          <span className="text-[7px] font-black uppercase">Purge</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          )}
        </div>
      </div>
    </SectionCard>
  );
}

// ── Watering Status ──────────────────────────────────────────────────────────
function WateringCard({ data }: { data: any }) {
  const alert = data.watering_alert;
  const alertStyle = {
    ok: 'text-emerald-200 border-emerald-400/35 bg-emerald-600/12 shadow-emerald-500/10',
    soon: 'text-amber-200   border-amber-400/35   bg-amber-500/12 shadow-amber-500/10',
    due: 'text-orange-200  border-orange-400/40  bg-orange-500/14 shadow-orange-500/10',
    overdue: 'text-emerald-200    border-emerald-400/40    bg-emerald-500/14 shadow-emerald-500/10',
  }[alert as string] ?? 'text-emerald-400 border-gray-400/25 bg-gray-500/10 shadow-black/20';

  const statusLabel =
    alert === 'ok' ? `in ${data.watering_days_until?.toFixed(1) ?? '?'}d` :
      alert === 'soon' ? 'Bald fällig' :
        alert === 'due' ? 'Jetzt!' : 'Überfällig!';

  return (
    <div className={`rounded-xl border p-4 space-y-3 bg-gray-950/75 backdrop-blur-2xl shadow-2xl ${alertStyle}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-cyan-100">
          <Droplet className="w-4 h-4 text-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,0.55)]" />
          <span className="text-xs font-black uppercase tracking-[0.22em]">Bewässerung</span>
        </div>
        <span className="rounded-md border border-current/25 bg-black/55 px-3 py-1.5 text-[12px] font-black font-mono uppercase tracking-widest shadow-inner">
          {statusLabel}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
        <div className="rounded-lg border border-cyan-300/10 bg-black/40 px-3 py-2">
          <div className="text-[8px] font-black uppercase tracking-[0.22em] text-cyan-200/70">Intervall</div>
          <div className="mt-1 text-sm font-black text-emerald-500">Ø {data.watering_avg?.toFixed(1) ?? '—'}d</div>
        </div>
        <div className="rounded-lg border border-cyan-300/10 bg-black/40 px-3 py-2">
          <div className="text-[8px] font-black uppercase tracking-[0.22em] text-cyan-200/70">Seit letzter Gabe</div>
          <div className="mt-1 text-sm font-black text-emerald-500">{data.watering_days_since?.toFixed(1) ?? '—'}d</div>
        </div>
      </div>
    </div>
  );
}

function ControlConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  portLabel,
  level,
  loading
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => void;
  portLabel: string;
  level: number;
  loading: boolean;
}) {
  const [pin, setPin] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-amber-500" />
          </div>
          <h3 className="text-lg font-bold text-emerald-400">Sicherheitsbestätigung</h3>
          <p className="text-sm text-emerald-400">
            Möchtest du <strong>{portLabel}</strong> auf Stufe <strong>{level}</strong> setzen?
          </p>
        </div>

        <form onSubmit={e => { e.preventDefault(); onConfirm(pin); }} className="space-y-4">
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={pin}
            onChange={e => setPin(e.target.value)}
            placeholder="4-stelliger PIN"
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] text-emerald-400 focus:border-emerald-600 outline-none transition-colors"
            autoFocus
          />

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-emerald-400 rounded-xl font-medium transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={pin.length < 4 || loading}
              className="flex-1 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-gray-950 rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/20"
            >
              {loading ? 'Sende...' : 'Bestätigen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Port Cards ───────────────────────────────────────────────────────────────
function PortsCard({ ports, portLevels, loadingPorts, onPortLevel }: {
  ports: any[];
  portLevels: Record<string, number>;
  loadingPorts: Record<string, boolean>;
  onPortLevel: (key: string, level: number) => void;
}) {
  const [openPortKey, setOpenPortKey] = useState<string | null>(null);

  return (
    <SectionCard title="Controller Ports" icon={Zap}>
      <div className="space-y-2.5">
        {ports?.map(p => {
          const isControllable = ['spider_farmer_lampe', 'cloudray_s6_luefter', 'abluft', 'abluft_ac'].includes(p.key);
          const isOpen = openPortKey === p.key;
          const isLoading = loadingPorts[p.key] || false;
          const currentLevel = portLevels[p.key] ?? p.speed ?? 0;

          const displayLabel = p.label;
          const displaySub = `${p.sub} · ${p.mode}`;
          const accentColor = p.key === 'spider_farmer_lampe' ? 'amber' : 'emerald';

          return (
            <div key={p.key} className="relative">
              <div
                className={`flex items-center gap-3 p-3 bg-gray-950/40 border border-gray-800/40 rounded-lg transition-colors
                  ${isControllable ? `cursor-pointer hover:bg-${accentColor}-500/5 hover:border-${accentColor}-500/20` : 'hover:border-gray-700/40'}`}
                onClick={isControllable ? () => setOpenPortKey(k => k === p.key ? null : p.key) : undefined}
              >
                <div className="w-8 h-8 flex items-center justify-center text-lg shrink-0">{p.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-emerald-400 leading-tight">{displayLabel}</p>
                  <p className="text-[10px] text-emerald-900/70 font-mono">{displaySub}</p>
                </div>
                <div className="text-right shrink-0 flex items-center gap-2">
                  <div>
                    <p className={`text-lg font-bold font-mono ${p.active ? 'text-emerald-400' : 'text-emerald-900'}`}>
                      {p.speed ?? 0}
                    </p>
                    <div className={`w-2 h-2 rounded-full ml-auto mt-0.5 ${p.active ? 'bg-emerald-400' : 'bg-gray-700'}`} />
                  </div>
                  {isControllable && (
                    <ChevronDown className={`w-4 h-4 text-emerald-900/70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  )}
                </div>
              </div>

              {isControllable && isOpen && (
                <div
                  className={`absolute left-0 right-0 top-full mt-1.5 z-30 bg-gray-900/95 backdrop-blur-sm rounded-xl p-4 border border-${accentColor}-500/20 shadow-2xl`}
                  onClick={e => e.stopPropagation()}
                >
                  <p className={`text-[10px] font-bold uppercase tracking-widest text-${accentColor}-400 mb-3`}>
                    Intensität {isLoading && <span className="opacity-50 normal-case">…</span>}
                  </p>
                  <div className="grid grid-cols-4 xs:grid-cols-5 sm:grid-cols-6 gap-1.5">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <button
                        key={n}
                        disabled={isLoading}
                        onClick={() => { onPortLevel(p.key, n); setOpenPortKey(null); }}
                        className={`py-2 rounded-lg text-sm font-mono font-bold transition-all disabled:opacity-50
                          ${currentLevel === n
                            ? `bg-${accentColor}-500 text-gray-950 shadow-lg shadow-${accentColor}-500/20`
                            : `bg-gray-800/80 text-emerald-400 hover:bg-${accentColor}-500/20 hover:text-${accentColor}-300`
                          }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ── Main Growbox ──────────────────────────────────────────────────────────────
export default function Growbox() {
  const apiFetch = useApi();
  const { toasts, toast, remove } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Wir tracken die Level und Ladezustände pro Port
  const [portLevels, setPortLevels] = useState<Record<string, number>>({});
  const [loadingPorts, setLoadingPorts] = useState<Record<string, boolean>>({});

  // Sicherheit
  const [confirmState, setConfirmState] = useState<{ key: string, level: number, label: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch('/api/grow-controller');
      setData(res);
      // Initialisiere portLevels aus den Live-Daten, falls noch nicht gesetzt
      if (res.ports) {
        setPortLevels(prev => {
          const next = { ...prev };
          res.ports.forEach((p: any) => {
            if (next[p.key] === undefined) next[p.key] = p.speed ?? 0;
          });
          return next;
        });
      }
    }
    catch { } finally { setLoading(false); }
  }, [apiFetch]);

  const setPortLevel = useCallback(async (key: string, level: number, pin: string) => {
    setLoadingPorts(prev => ({ ...prev, [key]: true }));
    try {
      await apiFetch('/api/grow/port-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, level, pin }),
      });
      setPortLevels(prev => ({ ...prev, [key]: level }));
      const label = data?.ports?.find((p: any) => p.key === key)?.label || key;
      toast('success', `${label} auf Stufe ${level} gestellt`);
      setConfirmState(null);
    } catch (e: any) {
      toast('error', e.message ?? 'Fehler bei der Port-Steuerung');
    } finally {
      setLoadingPorts(prev => ({ ...prev, [key]: false }));
    }
  }, [apiFetch, toast, data]);

  const requestPortLevel = (key: string, level: number) => {
    const label = data?.ports?.find((p: any) => p.key === key)?.label || key;
    setConfirmState({ key, level, label });
  };

  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t); }, [load]);

  if (loading) return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-800/40 rounded-xl animate-pulse" />)}
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-12">
      {/* Growbox Tactical Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-8 border-b border-emerald-600/10 pb-10 relative overflow-hidden">
        <div className="absolute inset-0 scanner-line opacity-5 pointer-events-none" />
        <div className="space-y-6 relative z-10">
          <div className="flex items-center gap-6">
            <div className="p-4 rounded-2xl glass-panel border border-emerald-600/20 group relative overflow-hidden">
              <Leaf className="w-10 h-10 text-emerald-600 relative z-10 group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 scan-overlay opacity-10" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                 <div className="h-[1px] w-8 bg-emerald-600/30" />
                 <span className="text-tactical-label opacity-40">Operational_Node: homelab-server</span>
              </div>
              <h2 className="text-5xl sm:text-7xl font-black text-emerald-500 tracking-tighter uppercase italic flex items-center gap-6 drop-shadow-[0_8px_24px_rgba(0,0,0,0.7)]">
                Growth<span className="text-emerald-700">_OS</span>
                <span className="text-[11px] not-italic font-black font-mono bg-emerald-600/10 text-emerald-600 px-4 py-1.5 rounded border border-emerald-600/30 tracking-[0.2em]">v4.2.0</span>
              </h2>
              <p className="text-[13px] font-black uppercase tracking-[0.4em] text-emerald-900 mt-4 opacity-50">Autonomous Botanical Lifecycle Controller</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 relative z-10">
          <div className="px-8 py-4 glass-panel border-emerald-600/30 flex items-center gap-6 group hover:border-emerald-600 transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)] cursor-default">
            <div className="relative">
               <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping absolute inset-0" />
               <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 relative z-10 glow-emerald" />
               <div className="absolute -inset-4 border border-emerald-500/20 rounded-full animate-[spin_10s_linear_infinite]" />
            </div>
            <div className="flex flex-col">
               <span className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.2em]">Environment_Lock</span>
               <span className="text-[8px] font-black text-emerald-900 uppercase tracking-widest mt-0.5">Status: ACTIVE_STABILIZED</span>
            </div>
          </div>
          <div className="flex gap-2">
             {[...Array(5)].map((_, i) => <div key={i} className={`w-1 h-1 rounded-full ${i < 3 ? 'bg-emerald-600 glow-emerald' : 'bg-emerald-900/30'}`} />)}
          </div>
        </div>
      </div>

      <div className="mb-8">
        {(() => {
          const lamp = data?.ports?.find((p: any) => p.key === 'spider_farmer_lampe');
          const lampLevel = lamp ? (portLevels[lamp.key] ?? lamp.speed ?? 0) : 0;
          return <GrowCore3D metrics={{ 
            temperature: data?.temp, 
            humidity: data?.hum, 
            lampLevel,
            light_hours: data?.light_hours,
            light_on_h: data?.light_on_h
          }} />;
        })()}
      </div>

      <PigeonGrowAdvisory apiFetch={apiFetch} />

      {/* Top Sensor Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <CircularGauge label="TEMP" value={data?.temp} unit="°C" min={15} max={35} />
        <CircularGauge label="HUM" value={data?.hum} unit="%" min={20} max={90} color="#06b6d4" />
        <MetricCard title="VPD" value={data?.vpd} unit="kPa" icon={Wind}
          accent={data?.vpd != null && (data.vpd < data.vpd_opt_min || data.vpd > data.vpd_opt_max) ? 'amber' : 'emerald'} />
        <MetricCard title="Leistung" value={data?.power_w} unit="W" icon={Zap} accent="purple" />
      </div>

      {/* Watering alert */}
      {data && <WateringCard data={data} />}

      {/* Range indicators + Bloom */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Umgebungs-Zielwerte" icon={Leaf}>
          <div className="space-y-5">
            <RangeBar label="Temperatur" value={data?.temp}
              min={15} max={35} optMin={data?.temp_ziel_min ?? 20} optMax={data?.temp_ziel_max ?? 26} unit="°C" />
            <RangeBar label="Luftfeuchtigkeit" value={data?.hum}
              min={20} max={90} optMin={data?.hum_ziel_min ?? 40} optMax={data?.hum_ziel_max ?? 60} unit="%" />
            <RangeBar label="VPD" value={data?.vpd}
              min={0.2} max={2.5} optMin={data?.vpd_opt_min ?? 1.0} optMax={data?.vpd_opt_max ?? 1.4} unit=" kPa" />
          </div>
        </SectionCard>

        <BloomProgress data={data ?? {}} />
      </div>

      {/* Tips + Ports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TipsCard data={data} />
        <PortsCard ports={data?.ports ?? []} portLevels={portLevels} loadingPorts={loadingPorts} onPortLevel={requestPortLevel} />
      </div>

      {/* Grow Log */}
      <GrowLog apiFetch={apiFetch} toast={toast} />

      <ControlConfirmModal
        isOpen={!!confirmState}
        onClose={() => setConfirmState(null)}
        onConfirm={(pin) => confirmState && setPortLevel(confirmState.key, confirmState.level, pin)}
        portLabel={confirmState?.label || ''}
        level={confirmState?.level || 0}
        loading={confirmState ? loadingPorts[confirmState.key] : false}
      />

      <ToastContainer toasts={toasts} remove={remove} />
    </div>
  );
}
