/**
 * Wiederverwendbare UI-Komponenten für das Tactical Dashboard Design-System.
 * Nutzt TailwindCSS für das Rose/Tactical Styling und Framer Motion für Animationen.
 */
import { useState, useEffect } from 'react';
import { X, Loader2, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';
import mascotAerith from '../assets/mascot_aerith.png';

// ── Corner Brackets Component ────────────────────────────────────────────────
function CornerBrackets() {
  /** Kleine dekorative Ecken für den "Hacker-Frame" Effekt. */
  return (
    <>
      <div className="bracket-corner bracket-tl" />
      <div className="bracket-corner bracket-tr" />
      <div className="bracket-corner bracket-bl" />
      <div className="bracket-corner bracket-br" />
    </>
  );
}

// ── Metric Card ──────────────────────────────────────────────────────────────
interface MetricCardProps {
  title: string;
  value: any;
  unit?: string;
  icon: React.ElementType;
  accent?: 'emerald' | 'blue' | 'amber' | 'rose' | 'purple' | 'cyan' | 'lime';
  sub?: string;
}

const ACCENT_MAP = {
  /** Map für die Farbakzente der UI-Komponenten (Auf Emerald/Cyan optimiert). */
  emerald: 'text-emerald-400 bg-emerald-900/40 border-emerald-600/30 glow-emerald',
  blue:    'text-cyan-400    bg-cyan-900/40    border-cyan-500/30    glow-cyan',
  amber:   'text-amber-400   bg-amber-900/40   border-amber-500/30   glow-amber',
  rose:    'text-rose-400    bg-rose-900/40    border-rose-500/30    glow-rose',
  purple:  'text-purple-400  bg-purple-900/40  border-purple-500/30  glow-purple',
  cyan:    'text-cyan-400    bg-cyan-900/40    border-cyan-500/30    glow-cyan',
  lime:    'text-lime-400    bg-lime-900/40    border-lime-500/30    glow-lime',
};

export function MetricCard({ title, value, unit, icon: Icon, accent = 'rose', sub }: MetricCardProps) {
  const cls = ACCENT_MAP[accent as keyof typeof ACCENT_MAP] || ACCENT_MAP.rose;
  const IconComponent = Icon as any;
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02, translateY: -5 }}
      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
      className="hacker-frame p-5 flex items-center gap-6 group scanline-effect shadow-xl relative reactive-border"
    >
      <CornerBrackets />
      <div className={`p-3.5 rounded-xl border ${cls} shrink-0 group-hover:scale-105 transition-transform duration-500 z-10 relative overflow-hidden holo-icon shadow-inner`}>
        <div className="absolute inset-0 scan-overlay opacity-30" />
        <IconComponent className="w-5 h-5 relative z-10" />
      </div>
      <div className="min-w-0 z-10">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-900/60 mb-2">{title}</p>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-4xl font-black text-emerald-500 tracking-tighter tabular-nums drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
            <motion.span
              key={value}
              initial={{ opacity: 0, filter: 'blur(4px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
            >
              {value ?? '—'}
            </motion.span>
          </span>
          {unit && <span className="text-[12px] text-emerald-900 font-black uppercase tracking-[0.1em] font-hacker">{unit}</span>}
        </div>
        {sub && typeof sub === 'string' && (
          <div className="flex items-center gap-2 mt-2">
            <div className="status-dots">
              <div className="status-dot active" />
              <div className="status-dot" />
              <div className="status-dot" />
            </div>
            <p className="text-[9px] text-emerald-950 font-mono font-bold truncate opacity-60 font-hacker uppercase tracking-tighter">0x{sub.slice(0, 8).toUpperCase()}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Section Card ─────────────────────────────────────────────────────────────
export function SectionCard({
  children, title, icon: Icon, action, accent = false, delay = 0,
}: {
  children: React.ReactNode;
  title?: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
  accent?: boolean;
  delay?: number;
}) {
  const IconComponent = Icon as any;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: delay * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className={`glass-section transition-all duration-700 group tilt-card rounded-2xl overflow-hidden reactive-border bg-gray-950/85
      ${accent ? 'shadow-[0_0_80px_rgba(225,29,72,0.15)] border-emerald-600/40' : ''}`}>
      <CornerBrackets />
      {(title || Icon) || action ? (
        <div className="flex items-center justify-between px-8 py-5 glass-section-header relative z-10 overflow-hidden">
          <div className="absolute inset-0 scan-overlay opacity-10 pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            {Icon && (
              <div className="p-2 rounded-lg bg-emerald-600/10 border border-emerald-600/10 group-hover:glow-emerald transition-all holo-icon">
                <IconComponent className="w-3.5 h-3.5 text-emerald-600 relative z-10" />
              </div>
            )}
            {title && (
              <motion.h3 
                className="text-[13px] font-black uppercase tracking-[0.3em] text-emerald-900 group-hover:text-emerald-500 transition-colors"
              >
                {title}
              </motion.h3>
            )}
          </div>
          {action && <div className="animate-fade-in relative z-10">{action}</div>}
        </div>
      ) : null}
      <div className="p-8 relative z-10">{children}</div>
      <img src={mascotAerith} className="mascot-ornament" alt="Mascot Ornament" />
      <div className="absolute top-1 right-24 text-[7px] text-emerald-900/10 font-hacker tracking-[0.4em] pointer-events-none">SYSTEM_OVERSIGHT_ACTIVE</div>
      <div className="absolute bottom-2 right-4 flex gap-1 opacity-10">
        {[...Array(4)].map((_, i) => <div key={i} className="w-1 h-1 bg-emerald-600 rounded-full" />)}
      </div>
    </motion.div>
  );
}

// ── Progress Bar ─────────────────────────────────────────────────────────────
export function ProgressBar({
  label, value, total = 100, unit = '%',
  warn = 75, crit = 90, showVal = true, color = 'rose'
}: {
  label: string; value: number | null; total?: number; unit?: string;
  warn?: number; crit?: number; showVal?: boolean; color?: string;
}) {
  const safe = (value === null || value === undefined || isNaN(Number(value))) ? 0 : Number(value);
  const pct = Math.min(100, Math.max(0, (safe / total) * 100));

  const colors: any = {
    rose: 'bg-emerald-600 glow-emerald shadow-[0_0_15px_rgba(204,0,0,0.5)]',
    amber: 'bg-amber-600 glow-amber',
    blue: 'bg-cyan-600 glow-cyan'
  };

  const dynamicColor = pct >= crit ? colors.rose :
    pct >= warn ? colors.amber :
      colors[color as keyof typeof colors] || colors.rose;

  return (
    <div className="space-y-4 w-full group font-hacker">
      <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.3em] opacity-60 group-hover:opacity-100 transition-opacity">
        <span className="text-emerald-900">{label}</span>
        {showVal && <span className="text-emerald-200 font-mono tabular-nums">
          {value === null || value === undefined ? '—' : `${safe}${unit}`}
        </span>}
      </div>
      <div className="h-4 w-full bg-black/60 rounded-sm overflow-hidden border border-emerald-900/20 p-1 shadow-[inset_0_2px_4px_rgba(0,0,0,1)]">
        <div className={`h-full transition-all duration-1500 ease-out ${dynamicColor}`}
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Range Bar (min/max zone + current) ───────────────────────────────────────
export function RangeBar({
  label, value, min, max, optMin, optMax, unit,
}: {
  label: string; value: number | null; min: number; max: number;
  optMin: number; optMax: number; unit: string;
}) {
  const range = max - min;
  const toPct = (v: number) => ((v - min) / range) * 100;
  const inZone = value !== null && value >= optMin && value <= optMax;
  const valPct = value !== null ? toPct(Math.max(min, Math.min(max, value))) : null;

  return (
    <div className="space-y-4 group font-hacker">
      <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.4em]">
        <span className="text-emerald-900 group-hover:text-emerald-700 transition-colors">{label}</span>
        <span className={`font-mono text-base font-black tabular-nums transition-all ${value === null ? 'text-gray-900' :
            inZone ? 'text-emerald-500 glow-emerald scale-110' : 'text-amber-500 glow-amber scale-110'}`}>
          {value !== null ? `${value}${unit}` : '—'}
        </span>
      </div>
      <div className="relative h-5 w-full bg-black/80 border border-emerald-900/30 p-1 shadow-[inset_0_2px_8px_rgba(0,0,0,1)] overflow-hidden">
        {/* Tactical Optimal Zone */}
        <div className="absolute top-0 h-full bg-emerald-600/10 border-x border-emerald-600/30"
          style={{ left: `${toPct(optMin)}%`, width: `${toPct(optMax) - toPct(optMin)}%` }} />

        {/* Current value marker */}
        {valPct !== null && (
          <div className={`absolute top-0.5 bottom-0.5 w-1.5 shadow-[0_0_20px_currentColor] transition-all duration-1500 cubic-bezier(0.16, 1, 0.3, 1)
            ${inZone ? 'bg-emerald-500 glow-emerald' : 'bg-amber-400 glow-amber'}`}
            style={{ left: `calc(${valPct}% - 3px)` }}>
            <div className="absolute -top-1 -bottom-1 left-1/2 -translate-x-1/2 w-0.5 bg-white/20" />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Status Badge ─────────────────────────────────────────────────────────────
export function StatusBadge({ status, text }: { status: string; text?: string }) {
  const map: Record<string, string> = {
    online: 'bg-emerald-600/10 text-emerald-500 border-emerald-600/30 glow-emerald',
    active: 'bg-emerald-600/10 text-emerald-500 border-emerald-600/30 glow-emerald',
    warning: 'bg-amber-500/10  text-amber-400  border-amber-500/30  glow-amber',
    error: 'bg-red-600/20   text-red-500   border-red-600/50   glow-red font-black shadow-[0_0_25px_rgba(204,0,0,0.3)]',
    offline: 'bg-emerald-950/10       text-emerald-950   border-emerald-900/30',
    pending: 'bg-cyan-500/10   text-cyan-400   border-cyan-500/30   glow-cyan',
  };
  const dot: Record<string, string> = {
    online: 'bg-emerald-500', active: 'bg-emerald-500',
    warning: 'bg-amber-400', error: 'bg-red-600',
    offline: 'bg-gray-800', pending: 'bg-cyan-400',
  };
  const pulse = ['online', 'active', 'pending', 'error'].includes(status);
  const cls = map[status] || map.offline;
  const d = dot[status] || dot.offline;

  return (
    <span className={`inline-flex items-center gap-3 px-5 py-2 clip-path-badge border transition-all duration-300 font-hacker text-[9px] font-black uppercase tracking-[0.4em] ${cls}`}>
      <span className="relative flex h-2 w-2">
        {pulse && <span className={`animate-ping absolute h-full w-full rounded-full opacity-75 ${d}`} />}
        <span className={`relative rounded-full h-2 w-2 ${d} shadow-[0_0_12px_currentColor]`} />
      </span>
      {text || status.toUpperCase()}
    </span>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-emerald-950/20 rounded-sm animate-pulse ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="hacker-frame p-8 space-y-8 border-emerald-900/10 bg-black/40">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-14 w-28" />
      <Skeleton className="h-4 w-full" />
    </div>
  );
}

// ── Log Drawer ───────────────────────────────────────────────────────────────
export function LogDrawer({
  title, url, open, onClose,
}: {
  title: string; url: string; open: boolean; onClose: () => void;
}) {
  const [lines, setLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true); setErr('');
    fetch(url)
      .then(r => r.json())
      .then(d => { setLines(d.lines || []); setLoading(false); })
      .catch(e => { setErr(e.message); setLoading(false); });
  }, [open, url]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl animate-fade-in" />
      <div
        className="relative z-10 w-full max-w-4xl bg-[#020203] border-l-2 border-emerald-600/50
          flex flex-col shadow-2xl scanline-effect group"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>

        <img src={mascotAerith} className="mascot-ornament" style={{ width: '350px', opacity: '0.1' }} alt="Mascot Ornament" />
        <CornerBrackets />

        <div className="flex items-center justify-between px-12 py-12 border-b border-emerald-900/30 bg-emerald-950/20 shrink-0">
          <div>
            <h3 className="font-black text-emerald-500 text-lg flex items-center gap-6 uppercase tracking-[0.5em] font-hacker">
              <Terminal className="w-7 h-7 text-emerald-600 glow-emerald" /> {title}
            </h3>
            <p className="text-[9px] text-emerald-900 font-black uppercase tracking-[0.3em] mt-4 font-hacker">ENCRYPTED_DATA_PACKET_STREAM</p>
          </div>
          <button onClick={onClose} className="p-5 rounded-xl bg-emerald-950/10 text-emerald-950 hover:text-emerald-500 transition-all hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20">
            <X className="w-8 h-8" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-12 font-mono text-[11px] leading-relaxed space-y-1 custom-scrollbar bg-black">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full gap-8 text-emerald-600 font-black uppercase tracking-[0.6em] animate-pulse font-hacker">
              <Loader2 className="w-12 h-12 animate-spin" />
              <span>DECRYPTING NODE ACCESS...</span>
            </div>
          )}
          {err && <p className="text-emerald-500 font-black p-12 bg-emerald-950/30 border border-emerald-600/50 shadow-2xl font-hacker uppercase tracking-widest leading-loose">SYSTEM_FATAL_ERROR: {err}</p>}
          {!loading && lines.map((l, i) => (
            <div key={i} className={`whitespace-pre-wrap break-all px-6 py-2 rounded-sm hover:bg-emerald-600/10 transition-colors border-l-2 border-transparent hover:border-emerald-600 ${l.includes('error') || l.includes('Error') || l.includes('FAILED') || l.includes('failed') || l.includes('CRITICAL')
                ? 'text-emerald-500 bg-emerald-600/10 font-black shadow-[0_0_15px_rgba(204,0,0,0.3)]' :
                l.includes('warn') || l.includes('Warn') || l.includes('WARNING')
                  ? 'text-amber-500' :
                  l.includes('start') || l.includes('Start') || l.includes('active') || l.includes('SUCCESS') || l.includes('OK')
                    ? 'text-emerald-200 opacity-90' :
                    'text-emerald-950'
              }`}>{l || ' '}</div>
          ))}
        </div>

        <div className="p-10 border-t border-emerald-900/30 bg-black flex justify-between items-center shrink-0">
          <span className="text-[9px] text-emerald-950 font-black uppercase tracking-[0.5em] font-hacker">SECURE_DUMP_TERMINATED</span>
          <div className="flex gap-8">
            <div className="w-3 h-3 rounded-full bg-emerald-600 animate-pulse" />
            <div className="w-3 h-3 rounded-full bg-emerald-900 animate-pulse delay-150" />
            <div className="w-3 h-3 border border-emerald-600/20 animate-spin delay-300" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── BackTrack Loading Spinner ────────────────────────────────────────────────
export function BackTrackLoading({ label = 'Authorizing Kernel Access...' }: { label?: string }) {
  return (
    <div className="w-full min-h-[500px] flex flex-col items-center justify-center gap-20 font-hacker relative overflow-hidden">
      {/* Ambient Lifestream Flow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.08),transparent_70%)] animate-pulse" />

      {/* Data Stream Particles (Subtle) */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-emerald-500 to-transparent animate-scan-vertical" style={{ animationDuration: '3s' }} />
        <div className="absolute top-0 left-1/2 w-[1px] h-full bg-gradient-to-b from-transparent via-emerald-500 to-transparent animate-scan-vertical" style={{ animationDuration: '5s' }} />
        <div className="absolute top-0 left-3/4 w-[1px] h-full bg-gradient-to-b from-transparent via-emerald-500 to-transparent animate-scan-vertical" style={{ animationDuration: '4s' }} />
      </div>

      <div className="w-64 h-64 relative flex items-center justify-center">
        {/* Hexagonal Tactical Shield */}
        <div className="absolute inset-0 opacity-20 animate-reverse-spin" style={{ animationDuration: '15s' }}>
          <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-emerald-500 stroke-[0.5]">
            <path d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" />
            <path d="M50 15 L80 30 L80 70 L50 85 L20 70 L20 30 Z" className="opacity-50" />
          </svg>
        </div>

        {/* Main Spinner Rings */}
        <div className="absolute inset-4 border-[1px] border-emerald-900/10 rounded-full scale-110" />
        <div className="absolute inset-4 border-2 border-emerald-950/20 rounded-full" />
        <div className="absolute inset-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shadow-[0_0_50px_rgba(16,185,129,0.5)]" />

        {/* Aerith Mascot Silhouette */}
        <div className="absolute inset-12 opacity-10 grayscale brightness-200 contrast-200">
          <img src={mascotAerith} className="w-full h-full object-contain animate-pigeon-float" alt="Aerith" />
        </div>

        {/* Inner Pulsing Core */}
        <div className="w-4 h-4 bg-emerald-500 rounded-full shadow-[0_0_30px_#10b981] animate-pulse relative z-10" />
      </div>

      <div className="text-center space-y-8 relative z-10">
        <div className="flex flex-col items-center gap-3">
          <span className="text-[11px] font-black text-emerald-900 uppercase tracking-[1.2em] ml-[1.2em] animate-pulse">Establishing_Neural_Link</span>
          <h2 className="text-5xl font-black text-emerald-500 tracking-[1em] ml-[1em] italic glitch-text" data-text="Shinrah-Gate">Shinrah-Gate</h2>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="px-8 py-3 bg-emerald-500/5 border border-emerald-500/10 rounded-sm inline-block relative overflow-hidden group">
            <div className="absolute inset-0 bg-emerald-500/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <p className="text-[12px] text-emerald-400 font-black tracking-[0.5em] uppercase animate-pulse relative z-10">{label}</p>
          </div>

          {/* Fake Buffer Bar */}
          <div className="w-48 h-1 bg-emerald-950/30 rounded-full overflow-hidden border border-emerald-500/10">
            <div className="h-full bg-emerald-500 animate-loading-bar shadow-[0_0_10px_#10b981]" />
          </div>
        </div>
      </div>

      {/* Technical Footer Decals */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-12 opacity-30">
        <div className="flex flex-col items-end">
          <span className="text-[8px] text-emerald-900 font-black tracking-widest">ENCRYPTION</span>
          <span className="text-[10px] text-emerald-500 font-black">AES_256_ACTIVE</span>
        </div>
        <div className="h-8 w-[1px] bg-emerald-900/30" />
        <div className="flex flex-col items-start">
          <span className="text-[8px] text-emerald-900 font-black tracking-widest">PROTOCOL</span>
          <span className="text-[10px] text-emerald-500 font-black">GATE_OMEGA_V4</span>
        </div>
      </div>
    </div>
  );
}

// ── Sparkline ────────────────────────────────────────────────────────────────
export function Sparkline({ data, color = '#cc0000', height = 40 }: { data: number[], color?: string, height?: number }) {
  if (!data || data.length < 2) return <div style={{ height }} />;

  const max = 100;
  const min = 0;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((v - min) / (max - min)) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="sparkline-container" style={{ height }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full sparkline-svg overflow-visible">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points}
        />
      </svg>
    </div>
  );
}

// ── CRT Screen Wrapper ───────────────────────────────────────────────────────
export function CRTScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-900/30 bg-black/60 shadow-2xl">
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none" />
        <div className="absolute inset-0 scanline-vertical opacity-10" />
      </div>
      <div className="relative z-0 p-1">
        {children}
      </div>
    </div>
  );
}
