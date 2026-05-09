import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bot, Activity, RotateCcw, Square, PlayCircle, RefreshCw,
  Terminal, Cpu, Sprout, Wrench, Zap, MessageSquare,
  ChevronDown, ChevronRight, Clock, CalendarDays, BarChart3,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import mascotAerith from '../assets/mascot_aerith.png';
import { useApi } from '../hooks/useApi';
import { SectionCard, StatusBadge } from '../components/ui';
import { SystemMemory } from '../Intelligence-worker/SystemMemory';
import { SentinelStatus } from '../Intelligence-worker/SentinelStatus';
import { ToastContainer, useToast } from '../components/Toast';

// ── Log-Parser ────────────────────────────────────────────────────────────────
interface LogEntry {
  raw: string;
  ts: string;          // "25.04.2026 14:23:45"
  date: string;        // "25.04.2026"
  time: string;        // "14:23:45"
  action: string;
  detail: string;
  category: Category;
}

type Category = 'ki' | 'shell' | 'dienst' | 'growbox' | 'system' | 'info';

const CAT_RULES: [Category, RegExp][] = [
  ['ki',      /KI-|KI-Backend|Anfrage|Analyse|ollama|groq|grok|gpt/i],
  ['growbox', /Growbox|Ernte|gieß|gewässert|Blüte|Sämling|Wachstum|Lampe/i],
  ['shell',   /Shell-Befehl|mach:|Bash|sudo|apt|systemctl.*ausge/i],
  ['dienst',  /Dienst|systemctl|Service|restart|stop|start/i],
  ['system',  /Update|Neustart|Backup|Speedtest|Fehlerprüfung|Cronjob/i],
];

function categorize(action: string, detail: string): Category {
  const text = `${action} ${detail}`;
  for (const [cat, re] of CAT_RULES) {
    if (re.test(text)) return cat;
  }
  return 'info';
}

function parseLog(lines: string[]): LogEntry[] {
  return lines
    .filter(l => l.startsWith('['))
    .map(raw => {
      const m = raw.match(/^\[(\d{2}\.\d{2}\.\d{4}) (\d{2}:\d{2}:\d{2})\] (.+)$/);
      if (!m) return null;
      const [, date, time, rest] = m;
      const pipe = rest.indexOf(' | ');
      const action = pipe >= 0 ? rest.slice(0, pipe) : rest;
      const detail = pipe >= 0 ? rest.slice(pipe + 3) : '';
      return { raw, ts: `${date} ${time}`, date, time, action, detail, category: categorize(action, detail) };
    })
    .filter(Boolean)
    .reverse() as LogEntry[];
}

// ── Kategorie-Config ──────────────────────────────────────────────────────────
const CAT_CFG: Record<Category, { label: string; icon: React.ElementType; color: string; bg: string; dot: string }> = {
  ki:      { label: 'KI',      icon: Cpu,          color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20', dot: 'bg-violet-400' },
  shell:   { label: 'Shell',   icon: Terminal,      color: 'text-emerald-400',bg: 'bg-emerald-600/10 border-emerald-600/20', dot: 'bg-emerald-400' },
  dienst:  { label: 'Dienst',  icon: Wrench,        color: 'text-cyan-400',   bg: 'bg-cyan-500/10 border-cyan-500/20',   dot: 'bg-cyan-400' },
  growbox: { label: 'Growbox', icon: Sprout,        color: 'text-lime-400',   bg: 'bg-lime-500/10 border-lime-500/20',   dot: 'bg-lime-400' },
  system:  { label: 'System',  icon: Zap,           color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20',  dot: 'bg-amber-400' },
  info:    { label: 'Info',    icon: MessageSquare, color: 'text-emerald-400',   bg: 'bg-gray-500/10 border-gray-500/20',   dot: 'bg-gray-500' },
};

// ── Stat-Kachel ───────────────────────────────────────────────────────────────
function StatTile({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  const IconComponent = Icon as any;
  return (
    <div className="bg-black/30 border border-emerald-900/10 rounded-2xl p-5 flex items-center gap-5 relative overflow-hidden group shadow-xl">
      <div className="absolute inset-0 scan-overlay opacity-5 pointer-events-none" />
      <div className={`p-3 rounded-xl bg-emerald-600/5 border border-emerald-900/10 holo-icon relative overflow-hidden ${color}`}>
        <div className="absolute inset-0 scan-overlay opacity-10" />
        <IconComponent className="w-4 h-4 relative z-10 group-hover:scale-110 transition-transform duration-500" />
      </div>
      <div>
        <p className="text-tactical-label mb-1 opacity-40">{label}</p>
        <p className="text-xl font-black text-emerald-500 tracking-tighter drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">{value}</p>
      </div>
    </div>
  );
}

// ── Bot-Control-Header ────────────────────────────────────────────────────────
function BotControlBar({ apiFetch, toast }: { apiFetch: any; toast: any }) {
  const [status, setStatus]   = useState<any>(null);
  const [acting, setActing]   = useState('');

  const refresh = useCallback(async () => {
    try { setStatus(await apiFetch('/api/sentinel/bot/status')); } catch {}
  }, [apiFetch]);

  useEffect(() => { refresh(); const t = setInterval(refresh, 10000); return () => clearInterval(t); }, [refresh]);

  const action = async (act: string) => {
    setActing(act);
    try {
      const r = await apiFetch(`/api/bot/${act}`, { method: 'POST' });
      toast(r.ok !== false ? 'success' : 'error', r.ok !== false ? `Ki-Bot ${act} OK` : r.error || 'Fehler');
      setTimeout(refresh, 2500);
    } catch (e: any) { toast('error', e.message); }
    finally { setActing(''); }
  };

  const isActive = status?.active;

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6
      bg-black/40 border border-emerald-900/20 rounded-3xl px-6 md:px-8 py-5 md:py-6 backdrop-blur-3xl relative overflow-hidden reactive-border group shadow-[0_0_50px_rgba(0,0,0,0.5)]">
      <div className="absolute inset-0 scan-overlay opacity-5 pointer-events-none" />
      
      <div className="flex items-center gap-6 relative z-10">
        <div className={`p-4 rounded-2xl border holo-icon relative overflow-hidden transition-all duration-500 ${isActive
          ? 'bg-emerald-600/10 border-emerald-600/30 text-emerald-500 shadow-[0_0_20px_rgba(225,29,72,0.2)]'
          : 'bg-emerald-950/20   border-emerald-900/20   text-emerald-900'}`}>
          <div className="absolute inset-0 scan-overlay opacity-20" />
          <Bot className={`w-8 h-8 relative z-10 ${isActive ? 'animate-pulse' : ''}`} />
        </div>
        <div>
          <div className="flex items-center gap-3 mb-1">
             <h2 className="text-lg font-black text-emerald-500 tracking-tight italic uppercase">
               Neural_Interface
             </h2>
             <div className="status-dots">
                <div className={`status-dot ${isActive ? 'active' : ''}`} />
                <div className="status-dot" />
             </div>
          </div>
          <p className="text-[10px] text-emerald-900 font-black uppercase tracking-[0.4em] opacity-60 flex items-center gap-2">
             <Terminal className="w-3 h-3" /> System Control Cluster
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 relative z-10">
        {isActive ? (
          <>
            <ActionBtn label="Sync" icon={<RotateCcw className="w-4 h-4" />}
              loading={acting === 'restart'} color="blue" disabled={!!acting}
              onClick={() => action('restart')} />
            <ActionBtn label="Terminate" icon={<Square className="w-4 h-4" />}
              loading={acting === 'stop'} color="rose" disabled={!!acting}
              onClick={() => action('stop')} />
          </>
        ) : (
          <ActionBtn label="Activate" icon={<PlayCircle className="w-4 h-4" />}
            loading={acting === 'start'} color="emerald" disabled={!!acting}
            onClick={() => action('start')} />
        )}
      </div>
    </div>
  );
}

function ActionBtn({ label, icon, loading, color, onClick, disabled }: any) {
  const map: Record<string, string> = {
    blue:    'text-cyan-400    border-cyan-500/25    hover:bg-cyan-500/10',
    rose:    'text-emerald-400    border-emerald-500/25    hover:bg-emerald-500/10',
    emerald: 'text-emerald-400 border-emerald-600/25 hover:bg-emerald-600/10',
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs font-bold
        transition-all disabled:opacity-40 ${map[color]}`}>
      {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : icon}
      {label}
    </button>
  );
}

// ── Log-Eintrag ───────────────────────────────────────────────────────────────
function LogItem({ entry }: { entry: LogEntry }) {
  const [open, setOpen] = useState(false);
  const cfg = CAT_CFG[entry.category];
  const IconComponent = cfg.icon as any;
  const hasDetail = !!entry.detail;

  return (
    <div className={`border rounded-lg overflow-hidden transition-colors
      ${open ? 'border-gray-700/50 bg-gray-900/60' : 'border-gray-800/40 bg-gray-900/20 hover:border-gray-700/40'}`}>
      <div
        className={`flex items-center gap-3 px-3.5 py-2.5 ${hasDetail ? 'cursor-pointer select-none' : ''}`}
        onClick={() => hasDetail && setOpen(v => !v)}>

        {/* Category dot */}
        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />

        {/* Time */}
        <span className="text-[10px] font-mono text-emerald-900 shrink-0 w-[68px]">{entry.time}</span>

        {/* Category badge */}
        <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border shrink-0 hidden sm:flex items-center gap-1 ${cfg.bg} ${cfg.color}`}>
          <IconComponent className="w-2.5 h-2.5" />
          {cfg.label}
        </span>

        {/* Action */}
        <span className="text-sm text-emerald-400 truncate flex-1">{entry.action}</span>

        {/* Expand */}
        {hasDetail && (
          <span className="text-emerald-900 shrink-0">
            {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </span>
        )}
      </div>

      <AnimatePresence>
        {open && entry.detail && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="px-3.5 pb-3 pt-0 border-t border-gray-800/40 relative overflow-hidden group/detail"
          >
            <img src={mascotAerith} className="mascot-ornament" style={{ width: '80px', opacity: '0.05' }} alt="Mascot" />
            <p className="text-xs font-mono text-emerald-400 leading-relaxed break-all whitespace-pre-wrap pt-3 relative z-10">
              {entry.detail}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Filter-Tabs ───────────────────────────────────────────────────────────────
const FILTERS: { key: Category | 'all' | 'memory'; label: string }[] = [
  { key: 'all',     label: 'Alle' },
  { key: 'ki',      label: 'KI' },
  { key: 'shell',   label: 'Shell' },
  { key: 'growbox', label: 'Growbox' },
  { key: 'dienst',  label: 'Dienst' },
  { key: 'system',  label: 'System' },
  { key: 'memory',  label: '🧠 Gedächtnis' },
];

// ── Main ──────────────────────────────────────────────────────────────────────
export default function BotMonitor() {
  const apiFetch = useApi();
  const { toasts, toast, remove } = useToast();
  const [lines, setLines]       = useState<string[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<Category | 'all' | 'memory'>('all');
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchLog = useCallback(async () => {
    try {
      const r = await apiFetch('/api/botlog');
      setLines(r.lines || []);
      setLastFetch(new Date());
    } catch {}
    finally { setLoading(false); }
  }, [apiFetch]);

  useEffect(() => {
    fetchLog();
    const t = setInterval(fetchLog, 15000);
    return () => clearInterval(t);
  }, [fetchLog]);

  const entries = useMemo(() => parseLog(lines), [lines]);

  const today = new Date().toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).replace(/\./g, '.').slice(0, 10);

  const todayEntries  = entries.filter(e => e.date === today);
  const hourAgo       = new Date(Date.now() - 3_600_000);
  const recentEntries = entries.filter(e => {
    const [d, mo, y] = e.date.split('.').map(Number);
    const [h, mi, s] = e.time.split(':').map(Number);
    return new Date(y, mo - 1, d, h, mi, s) > hourAgo;
  });

  const catCounts = useMemo(() => {
    const c: Record<string, number> = {};
    entries.forEach(e => { c[e.category] = (c[e.category] || 0) + 1; });
    return c;
  }, [entries]);

  const topCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];

  const filtered = filter === 'all' ? entries : entries.filter(e => e.category === filter);

  if (loading) return (
    <div className="flex items-center justify-center p-20 gap-3 text-emerald-500 font-mono text-sm animate-pulse">
      <Activity className="w-5 h-5 animate-spin" /> Lade Bot-Monitor...
    </div>
  );

  return (
    <div className="w-full space-y-12 pb-48 animate-fade-in relative">
      {/* Decorative background scanning line */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-10">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-emerald-600 animate-[scan-vertical_10s_linear_infinite]" />
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-10 relative z-10">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6">
             <div className="p-4 rounded-3xl bg-emerald-600/10 border border-emerald-600/20 glow-emerald shadow-2xl holo-icon relative overflow-hidden group shrink-0">
                <div className="absolute inset-0 scan-overlay opacity-30" />
                <Bot className="w-10 h-10 md:w-12 md:h-12 text-emerald-500 relative z-10 group-hover:scale-110 transition-transform duration-500" />
             </div>
              <div className="text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                   <div className="h-[1px] w-8 bg-emerald-600/30" />
                   <span className="text-tactical-label opacity-40">Intelligence_Node: KI-BOT-01</span>
                </div>
                <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-emerald-500 tracking-tighter uppercase italic flex items-center justify-center sm:justify-start gap-3 md:gap-4 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                  Bot<span className="text-emerald-700">_Monitor</span>
                </h2>
                <p className="text-tactical-label mt-3 opacity-30">Neural Link & Action Telemetry</p>
              </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between sm:justify-end gap-6 w-full md:w-auto">
           <div className="flex flex-col items-start sm:items-end">
             <span className="text-[8px] md:text-[10px] text-emerald-900 font-black uppercase tracking-widest mb-1 opacity-50">Sync_Status</span>
             <span className="text-xl md:text-2xl font-black text-emerald-500 glow-emerald tracking-widest uppercase">Operational</span>
           </div>
           <div className="p-4 md:p-5 glass-panel border-emerald-600/30 text-emerald-500 shadow-2xl rounded-2xl holo-icon relative overflow-hidden">
              <div className="absolute inset-0 scan-overlay opacity-20" />
              <Zap className="w-5 h-5 md:w-6 md:h-6 relative z-10" />
           </div>
        </div>
      </div>

      {/* Sentinel System Guard */}
      <SentinelStatus apiFetch={apiFetch} toast={toast} />

      {/* Bot Control Bar - Refined */}
      <div className="relative z-10">
         <BotControlBar apiFetch={apiFetch} toast={toast} />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Aktionen Gesamt" value={entries.length}
          icon={BarChart3} color="text-emerald-400" />
        <StatTile label="Heute" value={todayEntries.length}
          icon={CalendarDays} color="text-emerald-400" />
        <StatTile label="Letzte Stunde" value={recentEntries.length}
          icon={Clock} color="text-cyan-400" />
        <StatTile
          label="Häufigste Kategorie"
          value={topCategory ? `${CAT_CFG[topCategory[0] as Category]?.label ?? topCategory[0]} (${topCategory[1]})` : '—'}
          icon={Activity} color="text-violet-400" />
      </div>

      {/* Activity Feed */}
      <SectionCard title="Aktivitätslog" icon={Bot}
        action={
          <div className="flex items-center gap-2">
            {lastFetch && (
              <span className="text-[10px] font-mono text-emerald-900">
                {lastFetch.toLocaleTimeString('de-DE')}
              </span>
            )}
            <button onClick={fetchLog}
              className="p-1.5 text-emerald-900 hover:text-emerald-400 hover:bg-gray-800 rounded-lg transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        }>
        <div className="space-y-4">
          {/* Filter tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {FILTERS.map(f => {
              const isMemoryTab = f.key === 'memory';
              const count = isMemoryTab ? 0 : (f.key === 'all' ? entries.length : (catCounts[f.key] ?? 0));
              const cfg   = (f.key === 'all' || isMemoryTab) ? null : CAT_CFG[f.key as Category];
              const isActive = filter === f.key;
              const IconComponent = cfg?.icon as any;
              return (
                <button key={f.key} onClick={() => setFilter(f.key as any)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold
                    border transition-all ${isActive
                      ? (cfg ? `${cfg.bg} ${cfg.color}` : 'bg-purple-500/20 text-purple-400 border-purple-500/30 glow-purple')
                      : 'text-emerald-900/70 border-gray-800/60 hover:border-gray-700 hover:text-emerald-400'}`}>
                  {IconComponent && <IconComponent className="w-3 h-3" />}
                  {f.label}
                  {!isMemoryTab && (
                    <span className={`text-[9px] font-mono ${isActive ? 'opacity-80' : 'opacity-50'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {filter === 'memory' ? (
            <SystemMemory apiFetch={apiFetch} toast={toast} />
          ) : (
            <>
              {/* Datum-Gruppierung */}
              {filtered.length === 0 ? (
                <p className="text-center text-emerald-900 text-sm py-8 font-mono">Keine Einträge</p>
              ) : (
                <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                  {filtered.reduce<React.ReactNode[]>((acc, entry, i) => {
                    const prevDate = i > 0 ? filtered[i - 1].date : null;
                    if (entry.date !== prevDate) {
                      acc.push(
                        <div key={`d-${entry.date}`}
                          className="flex items-center gap-3 py-2 sticky top-0 bg-[#07090b]/90 backdrop-blur-sm z-10">
                          <div className="h-px flex-1 bg-gray-800/60" />
                          <span className="text-[10px] text-emerald-900 font-mono shrink-0 flex items-center gap-1.5">
                            <CalendarDays className="w-3 h-3" />
                            {entry.date === today ? 'Heute' : entry.date}
                          </span>
                          <div className="h-px flex-1 bg-gray-800/60" />
                        </div>
                      );
                    }
                    acc.push(<LogItem key={`${entry.ts}-${i}`} entry={entry} />);
                    return acc;
                  }, [])}
                </div>
              )}
            </>
          )}
        </div>
      </SectionCard>

      <ToastContainer toasts={toasts} remove={remove} />
    </div>
  );
}
