import { useState, useEffect, useCallback, useRef, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Terminal, Shield, Cpu, Activity, Zap, HardDrive, 
  Search, Lock, Globe, Server, AlertTriangle, CheckCircle, Info, Bot, ChevronRight, X, ArrowUpRight,
  ShieldCheck, Thermometer, Clock, PlayCircle, RotateCcw, Square, RefreshCw, ScrollText,
  CheckCircle2, ClipboardList, Inbox, Layers3, ArrowRight, Workflow, Sprout, MessageSquare, 
  Plus, Trash2, Cloud, Droplets, Bell, Command, Wifi, Radio, Power, Database, FileText, Users
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { MetricCard, SectionCard, ProgressBar, StatusBadge, SkeletonCard, BackTrackLoading, Sparkline } from '../components/ui';
import { ServerHUD } from '../components/ServerHUD';
import { CyberLogs } from '../components/CyberLogs';
import { ArchiveTab } from '../components/ArchiveTab';
import { ThreatMap } from '../components/ThreatMap';
import { ToastContainer, useToast } from '../components/Toast';
import { IntelligenceCenter } from '../Intelligence-worker/IntelligenceCenter';
import ModuleBadge, { type BadgeStatus } from '../components/ModuleBadge';


type Note = { id: string; text: string; color?: string; created_at?: string };
type Task = { id: string; title: string; status: string; due_date?: string; description?: string };
type Project = { id: string; name: string; status?: string; description?: string; tasks?: Task[] };
type ContainerInfo = { name?: string; status?: string; state?: string; image?: string };

const todayIso = () => new Date().toISOString().slice(0, 10);

function healthLevel(sys: any, back: any) {
  const cpu = Number(sys?.cpu_pct ?? 0);
  const ram = Number(sys?.ram_pct ?? 0);
  const disk = Number(sys?.disk_pct ?? 0);
  const temp = Number(sys?.temp ?? 0);
  if (cpu >= 90 || ram >= 92 || disk >= 92 || temp >= 75) return 'error';
  if (cpu >= 70 || ram >= 75 || disk >= 82 || temp >= 60 || Number(back?.errors ?? 0) > 0) return 'warning';
  return 'online';
}

function labelForHealth(level: string) {
  if (level === 'error') return 'CRITICAL_ALERT';
  if (level === 'warning') return 'ELEVATED_THREAT';
  return 'SYSTEM_STABLE';
}

function buildAttention(projects: Project[], sys: any, back: any, botStatus: any, healings: any[] = []) {
  const items: { level: 'error' | 'warning' | 'info'; title: string; meta: string; href: string }[] = [];
  const cpu = Number(sys?.cpu_pct ?? 0);
  const ram = Number(sys?.ram_pct ?? 0);
  const disk = Number(sys?.disk_pct ?? 0);
  const temp = Number(sys?.temp ?? 0);

  if (cpu >= 70) items.push({ level: cpu >= 90 ? 'error' : 'warning', title: `CPU LOAD ${cpu}%`, meta: sys?.cpu || 'Host', href: '/ui/services' });
  if (ram >= 75) items.push({ level: ram >= 92 ? 'error' : 'warning', title: `RAM UTIL ${ram}%`, meta: sys?.ram || 'Host', href: '/ui/services' });
  if (temp >= 60) items.push({ level: temp >= 75 ? 'error' : 'warning', title: `CORE TEMP ${temp}°C`, meta: 'THERMAL_THRESHOLD', href: '/ui/services' });
  if (Number(back?.errors ?? 0) > 0) items.push({ level: 'warning', title: 'BACKUP_FAIL', meta: `${back.errors} ERRORS`, href: '/vpanel' });
   if (botStatus && botStatus.active === false) items.push({ level: 'warning', title: 'AI_NODE_OFFLINE', meta: botStatus.state ?? 'stopped', href: '/ui/n8n' });

   // P.I.G.E.O.N. Integration
   if (healings.length > 0) {
      const lastHeal = healings[0];
      const healTime = new Date(lastHeal.ts);
      const diff = (new Date().getTime() - healTime.getTime()) / 3600000;
      if (diff < 24) {
         items.push({ 
           level: lastHeal.type === 'CONTAINER_CRASH_DETECTED' ? 'error' : 'info', 
           title: 'GUARDIAN_FIX_APPLIED', 
           meta: lastHeal.details, 
           href: '/vpanel' 
         });
      }
   }

  projects.forEach(project => {
    (project.tasks ?? []).forEach(task => {
      if (task.status === 'erledigt') return;
      if (task.due_date && task.due_date <= todayIso()) {
        items.push({
          level: task.due_date < todayIso() ? 'error' : 'warning',
          title: task.title,
          meta: `${project.name.toUpperCase()} · FÄLLIG`,
          href: '/ui/board',
        });
      }
    });
  });

  return items;
}

function hostUrl(port: number) {
  if (typeof window === 'undefined') return '#';
  return `${window.location.protocol}//${window.location.hostname}:${port}`;
}

function serviceState(containers: ContainerInfo[], needle: string) {
  const item = containers.find(c => String(c.name || '').toLowerCase().includes(needle));
  if (!item) return { label: 'MISSING', tone: 'warn' as const };
  const status = String(item.status || item.state || '').toLowerCase();
  if (/unhealthy|exited|dead|restarting/.test(status)) return { label: 'ATTENTION', tone: 'bad' as const };
  if (/healthy|up|running/.test(status)) return { label: 'ONLINE', tone: 'ok' as const };
  return { label: 'UNKNOWN', tone: 'warn' as const };
}

function containerTone(container: ContainerInfo) {
  const status = String(container.status || container.state || '').toLowerCase();
  if (/unhealthy|exited|dead|restarting/.test(status)) return 'bad';
  if (/healthy|up|running/.test(status)) return 'ok';
  return 'warn';
}

function shortStatus(status?: string) {
  return String(status || 'unknown').replace(/\s*\(.+?\)/g, '').replace(/^Up\s+/i, 'up ');
}

function PigeonTacticalTicker() {
  const messages = [
    "[STRATEGIC] P.I.G.E.O.N. Protocol Active... Scanning Node 01",
    "[ANALYSIS] Neural Processing Load Stable at 42%",
    "[SECURITY] Encrypted Uplink Established... No Intrusion Detected",
    "[ENVIRONMENT] Growbox Botanical Core: ALL PARAMETERS OPTIMAL",
    "[TACTICAL] Global Entity Operations: MISSION IN PROGRESS",
    "[SYSTEM] Kernel Integrity Verified... Tactical_OS v2.4.2_Tactical",
    "[ADVISORY] P.I.G.E.O.N. recommends increasing backup frequency",
    "[MONITOR] Thermal stability maintained across all nodes"
  ];
  
  return (
    <div className="w-full bg-emerald-600/5 border-y border-emerald-600/10 py-1 overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black z-10 pointer-events-none" />
      <div className="flex animate-[ticker_40s_linear_infinite] whitespace-nowrap gap-16 items-center hover:[animation-play-state:paused] cursor-default">
        {[...messages, ...messages].map((msg, i) => (
          <span key={i} className="text-[9px] font-black text-emerald-500/60 uppercase tracking-[0.4em] flex items-center gap-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" /> {msg}
          </span>
        ))}
      </div>
    </div>
  );
}

function opsScore(sys: any, back: any, containers: ContainerInfo[]) {
  const cpu = Number(sys?.cpu_pct || 0);
  const ram = Number(sys?.ram_pct || 0);
  const disk = Number(sys?.disk_pct || 0);
  const temp = Number(sys?.temp || 0);
  const badContainers = containers.filter(c => containerTone(c) === 'bad').length;
  let score = 100;
  score -= Math.max(0, cpu - 60) * 0.35;
  score -= Math.max(0, ram - 65) * 0.45;
  score -= Math.max(0, disk - 70) * 0.7;
  score -= Math.max(0, temp - 55) * 0.5;
  score -= badContainers * 12;
  score -= Number(back?.errors || 0) * 10;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function HeartbeatWave({ active = true, color = '#10b981' }: { active?: boolean, color?: string }) {
  return (
    <div className="w-full h-8 overflow-hidden relative opacity-60">
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full">
        <motion.path
          d="M 0 20 L 10 20 L 15 10 L 20 30 L 25 20 L 40 20 L 45 5 L 50 35 L 55 20 L 70 20 L 75 15 L 80 25 L 85 20 L 100 20"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={active ? { 
            pathLength: [0, 1], 
            opacity: [0.2, 1, 0.2],
            x: [0, -100]
          } : {}}
          transition={active ? { 
            duration: 2, 
            repeat: Infinity, 
            ease: "linear" 
          } : {}}
          style={{ vectorEffect: 'non-scaling-stroke' }}
        />
        <motion.path
          d="M 100 20 L 110 20 L 115 10 L 120 30 L 125 20 L 140 20 L 145 5 L 150 35 L 155 20 L 170 20 L 175 15 L 180 25 L 185 20 L 200 20"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={active ? { 
            pathLength: [0, 1], 
            opacity: [0.2, 1, 0.2],
            x: [0, -100]
          } : {}}
          transition={active ? { 
            duration: 2, 
            repeat: Infinity, 
            ease: "linear" 
          } : {}}
          style={{ vectorEffect: 'non-scaling-stroke' }}
        />
      </svg>
    </div>
  );
}

export default function ShinraDashboard() {
  const apiFetch = useApi();
  const { toasts, toast, remove } = useToast();
  const [sys, setSys] = useState<any>(null);
  const [back, setBack] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activityItems, setActivityItems] = useState<any[]>([]);
  const [containers, setContainers] = useState<ContainerInfo[]>([]);
  const [botStatus, setBotStatus] = useState<any>(null);
  const [extended, setExtended] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [view, setView] = useState<'dashboard' | 'archive'>('dashboard');
  const [growMetrics, setGrowMetrics] = useState<any>(null);
  const [pihole, setPihole] = useState<any>(null);
  const [healings, setHealings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [s, b, p, a, bot, ext, docker, grow, ph, healData, uData] = await Promise.all([
        apiFetch('/api/sentinel/sysinfo'),
        apiFetch('/api/storage/status'),
        apiFetch('/api/projects'),
        apiFetch('/api/dashboard-activity'),
        apiFetch('/api/sentinel/bot/status'),
        apiFetch('/api/dashboard/extended-stats'),
        apiFetch('/api/services'),
        apiFetch('/api/grow/metrics'),
        apiFetch('/api/network/pihole'),
        apiFetch('/api/sentinel/healing'),
        apiFetch('/api/system/users'),
      ]);
      setSys(s);
      setBack(b);
      setProjects(Array.isArray(p) ? p : []);
      setActivityItems(a.items || []);
      setBotStatus(bot);
      setExtended(ext);
      setGrowMetrics(grow);
      setPihole(ph?.stats || null);
      setHealings(healData?.healings || []);
      setUsers(uData?.users || []);
      const rawContainers = docker?.containers || {};
      const mappedContainers = Array.isArray(rawContainers)
        ? rawContainers
        : Object.entries(rawContainers).map(([name, value]: [string, any]) => ({
            name,
            status: value?.status || value?.state || '',
            state: value?.running ? 'running' : '',
            image: value?.image || '',
          }));
      setContainers(mappedContainers);
      setLastRefresh(new Date());
    } catch {}
    finally { setLoading(false); }
  }, [apiFetch]);

  useEffect(() => {
    fetchData();
    let t = setInterval(fetchData, document.hidden ? 90000 : 10000);
    const onVis = () => {
      clearInterval(t);
      if (!document.hidden) fetchData();
      t = setInterval(fetchData, document.hidden ? 90000 : 10000);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVis); };
  }, [fetchData]);

  if (loading) return (
    <div className="w-full min-h-screen bg-black flex items-center justify-center">
      <BackTrackLoading />
    </div>
  );

  const level = healthLevel(sys, back);
  const attention = buildAttention(projects, sys, back, botStatus, healings);
  const score = opsScore(sys, back, containers);
  const mascotLevel  = level === 'error' ? 'error' : (level === 'warning') ? 'warning' : 'online';
  const mascotBorder = mascotLevel === 'error'   ? 'border-red-500 shadow-[0_0_100px_rgba(239,68,68,0.7)]'
                     : mascotLevel === 'warning' ? 'border-amber-500 shadow-[0_0_100px_rgba(245,158,11,0.5)]'
                     : 'border-emerald-600 shadow-[0_0_100px_rgba(16,185,129,0.4)]';
  const mascotGlow   = mascotLevel === 'error'   ? 'bg-red-500/60 animate-[pulse_0.4s_ease-in-out_infinite]'
                     : mascotLevel === 'warning' ? 'bg-amber-500/30 animate-pulse'
                     : 'bg-emerald-600/40 animate-pulse';
  const mascotStatus = mascotLevel === 'error'   ? '[ CRITICAL_ALERT ]'
                     : mascotLevel === 'warning' ? '[ ELEVATED_THREAT ]'
                     : '[ SYSTEM_SYNC_OK ]';
  const mascotColor  = mascotLevel === 'error'   ? 'text-red-400'
                     : mascotLevel === 'warning' ? 'text-amber-400'
                     : 'text-emerald-500';
  const mascotFilter = mascotLevel === 'error'   ? 'brightness(1.4) saturate(1.8) hue-rotate(-15deg)'
                     : mascotLevel === 'warning' ? 'brightness(1.2) sepia(0.5) saturate(1.3)'
                     : 'brightness(1.25) contrast(1.25)';

  return (
    <div className="w-full min-h-screen pb-48 relative animate-fade-in bg-transparent">
      <div className="bg-noise" />
      
      <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-500/40 shadow-[0_0_20px_#10b981] animate-[scan-vertical_12s_linear_infinite]" />
        <div className="absolute top-0 left-0 w-[2px] h-full bg-emerald-500/10 shadow-[0_0_15px_#10b981] animate-[scan-horizontal_15s_linear_infinite]" />
      </div>

      <CyberLogs apiFetch={apiFetch} />

      <PigeonTacticalTicker />

      <main className="max-w-[1920px] mx-auto px-6 lg:px-16 pt-8 relative z-10">
        
        <div className="mb-16 flex flex-col xl:flex-row items-stretch justify-between gap-8 border-b border-emerald-900/10 pb-16">
           <div className="space-y-6 flex-1">
              <div className="flex items-center gap-10 mb-10">
                  <div className="relative group">
                     <div className={`absolute inset-0 ${mascotGlow} blur-[100px] rounded-full opacity-40 group-hover:opacity-60 transition-opacity duration-1000`} />
                     <div className={`relative z-10 p-5 rounded-[2.5rem] glass-panel border-2 ${mascotBorder} overflow-hidden hover:scale-[1.02] transition-all duration-700 shadow-2xl`}>
                        <div className="pigeon-scanline opacity-60" />
                         <div 
                            className="w-44 h-44 sm:w-64 sm:h-64 relative z-10 holo-icon"
                            style={{backgroundImage: 'url(/ui/pigeon_tactical.jpg)', backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', filter: mascotFilter}}
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                         <div className="absolute bottom-5 left-0 w-full text-center z-20">
                            <span className={`text-[9px] font-black uppercase tracking-[0.8em] animate-pulse ${mascotColor}`}>{mascotStatus}</span>
                         </div>
                     </div>
                  </div>
                  <div className="flex flex-col justify-end pb-6">
                    <h1 className="text-4xl font-black text-emerald-500 tracking-tighter uppercase italic leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
                       Shinrah<span className="text-emerald-600 text-xl not-italic ml-2 opacity-60">_Gate</span>
                    </h1>
                    <div className="flex items-center gap-4 mt-6 border-l-4 border-emerald-600 pl-4 py-1">
                       <p className="text-tactical-label">Active_Oversight</p>
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    </div>
                    <p className="text-tactical-label mt-4 opacity-40">
                       Tactical_OS // v2.5_Hardened
                    </p>
                 </div>
              </div>
              <div className="flex flex-wrap gap-8 items-center">
                <p className="text-[10px] text-emerald-900 font-black uppercase tracking-[0.3em] max-w-xl leading-relaxed border-l-2 border-emerald-900/20 pl-6 opacity-60">
                  Autonome System-Überwachung & Strategische Operations-Plattform. <br />
                  <span className="text-emerald-950 italic">Sicherheitsstufe: MAXIMUM · Verschlüsselung: AES-256-GCM</span>
                </p>
                {extended?.weather && (
                  <div className="flex items-center gap-4 px-6 py-3 glass-card bg-emerald-950/10 border-emerald-900/10">
                    <Cloud className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="text-tactical-label opacity-40">Environment</p>
                      <p className="text-[13px] font-black text-emerald-500 font-mono tracking-tight">{extended.weather.temp}°C · {extended.weather.desc?.toUpperCase()}</p>
                    </div>
                  </div>
                )}
              </div>
           </div>

           <div className="flex flex-col sm:flex-row items-center gap-10">
              <div className="glass-panel px-10 py-8 flex flex-col items-start justify-between flex-1 min-w-[320px] relative overflow-hidden group shadow-2xl">
                 <div className="absolute top-0 left-0 w-full h-[1px] bg-emerald-600/20" />
                 <div className="flex items-center gap-4 mb-6">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse shadow-[0_0_8px_rgba(225,29,72,0.8)]" />
                    <p className="text-tactical-label">Strategic_Intelligence_Feed // RSS</p>
                 </div>
                 <div className="w-full py-2">
                    <DashboardNewsTicker />
                 </div>
                 <div className="flex items-center justify-between w-full mt-6 pt-4 border-t border-emerald-900/10">
                    <p className="text-tactical-label opacity-30">Node: localhost</p>
                    <p className="text-tactical-label opacity-20 italic lowercase tracking-tight">hover_to_pause</p>
                 </div>
                 <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-600/10" />
                 <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-600/10" />
              </div>

              <div className="grid grid-cols-2 gap-4 h-full">
                 <button onClick={fetchData} className="w-24 h-24 flex flex-col items-center justify-center gap-2 glass-panel hover:bg-emerald-600 hover:text-black transition-all group border-emerald-900/20">
                    <RefreshCw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-700" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Sync</span>
                 </button>
                 <a href="/ui/sentinel" className="w-24 h-24 flex flex-col items-center justify-center gap-2 glass-panel hover:bg-emerald-600/10 border-emerald-600/20 transition-all group">
                    <Shield className="w-6 h-6 text-emerald-500 group-hover:animate-bounce" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Secure</span>
                 </a>
               </div>
           </div>
        </div>
         
        <div className="mb-20 glass-panel border-emerald-900/10 py-3 relative overflow-hidden bg-emerald-950/5">
           <div className="absolute left-0 top-0 h-full w-48 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
           <div className="absolute right-0 top-0 h-full w-48 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
           <div className="flex whitespace-nowrap animate-[marquee_40s_linear_infinite] gap-20">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-20 items-center">
                  <span className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.4em] flex items-center gap-3">
                    <Activity className="w-3 h-3" /> System_Heartbeat: {score.toFixed(1)} OPS
                  </span>
                  <span className="text-[10px] text-emerald-900/70 font-black uppercase tracking-[0.4em] flex items-center gap-3">
                    <Lock className="w-3 h-3" /> Security_Status: MAXIMUM_ENCRYPTION
                  </span>
                  <span className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.4em] flex items-center gap-3">
                    <Globe className="w-3 h-3" /> Network_Node: ACTIVE
                  </span>
                  <span className="text-[10px] text-emerald-950 font-black uppercase tracking-[0.4em]">
                    Kernel_Version: 6.6.RPi5 // Tactical_OS_Build: 1.2.0
                  </span>
                </div>
              ))}
           </div>
        </div>
        
        <div className="mb-20 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { icon: Command, label: 'Command', action: () => setView('dashboard'), count: 'Active' },
              { icon: Database, label: 'Storage', action: () => setView('archive'), count: 'Secure' },
              { icon: Layers3, label: 'Projects', href: '/ui/board', count: projects.length },
              { icon: Sprout, label: 'Growbox', href: '/ui/growbox', count: 'Online' },
              { icon: Terminal, label: 'Console', href: '/ui/cmd', count: 'Admin' },
            ].map(item => (
              item.href ? (
                <a key={item.label} href={item.href} className="group relative h-28 hacker-frame flex flex-col items-center justify-center gap-3 hover:bg-emerald-600/5 transition-all shadow-xl border-emerald-900/10 hover:border-emerald-600/30">
                   <div className="absolute top-3 left-4 text-tactical-label opacity-40">{item.label}</div>
                   <div className="p-2 rounded-lg relative overflow-hidden group-hover:glow-emerald transition-all">
                      <div className="absolute inset-0 scan-overlay opacity-20" />
                      <item.icon className="w-7 h-7 text-emerald-600 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                   </div>
                   <span className="text-[10px] font-black text-emerald-500 tracking-[0.2em] uppercase font-mono">{item.count}</span>
                </a>
              ) : (
                <button key={item.label} onClick={item.action} className={`group relative h-28 hacker-frame flex flex-col items-center justify-center gap-3 transition-all shadow-xl ${view === item.label.toLowerCase() ? 'bg-emerald-600/10 border-emerald-600/40 shadow-[0_0_30px_rgba(204,0,0,0.1)]' : 'hover:bg-emerald-600/5 border-emerald-900/10 hover:border-emerald-600/30'}`}>
                   <div className="absolute top-3 left-4 text-tactical-label opacity-40">{item.label}</div>
                   <div className="p-2 rounded-lg relative overflow-hidden group-hover:glow-emerald transition-all">
                      <div className="absolute inset-0 scan-overlay opacity-20" />
                      <item.icon className={`w-7 h-7 relative z-10 group-hover:scale-110 transition-transform duration-300 ${view === item.label.toLowerCase() ? 'text-emerald-500' : 'text-emerald-900'}`} />
                   </div>
                   <span className={`text-[10px] font-black tracking-[0.2em] uppercase font-mono ${view === item.label.toLowerCase() ? 'text-emerald-500' : 'text-emerald-900'}`}>{item.count}</span>
                </button>
              )
            ))}
        </div>

        {/* P.I.G.E.O.N. INTELLIGENCE CORE */}
        <div className="mb-20">
           <IntelligenceCenter apiFetch={apiFetch} />
        </div>

        <div className="mb-20">
           <ServerCommandCenter sys={sys} back={back} containers={containers} lastRefresh={lastRefresh} />
        </div>

        {view === 'archive' ? (
          <ArchiveTab apiFetch={apiFetch} />
        ) : (
          <div className="flex flex-col gap-20">
            <div className="grid grid-cols-1 xl:grid-cols-1 gap-12 mb-8">
               <SectionCard 
                  title="Threat_Intelligence" 
                  icon={ShieldCheck} 
                  delay={4}
                  accent={attention.length > 0}
                  action={
                     <div className="px-4 py-1.5 rounded bg-emerald-600 text-black text-[9px] font-black uppercase tracking-[0.3em] shadow-2xl">{attention.length} DETECTED</div>
                  }
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {attention.length === 0 ? (
                      <div className="col-span-full py-20 flex flex-col items-center text-center hacker-frame bg-emerald-950/5 border-dashed border-emerald-900/30">
                        <CheckCircle2 className="w-12 h-12 text-emerald-900 opacity-40 mb-6" />
                        <p className="text-[10px] text-emerald-900 font-black uppercase tracking-[0.4em] font-hacker">Systems at Peak Performance</p>
                      </div>
                    ) : attention.map((item: any, i: number) => (
                      <a key={i} href={item.href} className="hacker-frame p-6 flex items-center gap-6 group hover:bg-emerald-900/10 transition-all shadow-xl">
                        <div className={`w-10 h-10 rounded flex items-center justify-center flex-shrink-0 ${item.level === 'error' ? 'bg-emerald-600 text-black shadow-[0_0_20px_rgba(204,0,0,0.4)]' : 'bg-emerald-900 text-emerald-200'}`}>
                           <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                           <h4 className="text-[13px] font-black text-emerald-500 group-hover:text-emerald-500 transition-colors uppercase tracking-tight font-hacker truncate">{item.title}</h4>
                           <p className="text-[9px] text-emerald-950 font-black mt-1.5 uppercase tracking-[0.2em] truncate">{item.meta}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </SectionCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
               <div className="p-10 hacker-frame bg-emerald-600/5 border-emerald-600/20 shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 scan-overlay opacity-10" />
                  <div className="flex items-center gap-5 mb-8">
                     <div className="p-3 bg-emerald-600/10 rounded-2xl"><Activity className="w-6 h-6 text-emerald-600" /></div>
                     <h4 className="text-sm font-black text-emerald-500 uppercase tracking-[0.5em]">Nexus_Pulse</h4>
                  </div>
                  <div className="space-y-8">
                     <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-emerald-900">
                        <span>Ops_Efficiency</span>
                        <span className="text-emerald-500">{score}%</span>
                     </div>
                     <div className="h-2.5 w-full bg-emerald-950/20 rounded-full overflow-hidden border border-emerald-900/10 p-[2px]">
                        <div className="h-full bg-emerald-600 glow-emerald rounded-full transition-all duration-1000" style={{ width: `${score}%` }} />
                     </div>
                     <p className="text-[10px] text-emerald-900 font-black uppercase leading-relaxed italic opacity-50">
                        Kombinierte System-Vigilanz basierend auf Hardware-Auslastung, Backup-Integrität und Node-Status.
                     </p>
                     <div className="mt-8 pt-8 border-t border-emerald-900/10">
                        <div className="flex items-center gap-4 mb-4">
                           <ShieldCheck className="w-4 h-4 text-emerald-600" />
                           <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Guardian_Feed</h4>
                        </div>
                        <div className="space-y-2">
                           {healings.slice(0, 2).map((h, i) => (
                              <div key={i} className="p-2 bg-emerald-500/5 border-l border-emerald-500/20">
                                 <p className="text-[9px] text-emerald-100 font-bold truncate">{h.details}</p>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>

               <div className="p-10 hacker-frame bg-black/40 border-emerald-900/10 shadow-2xl relative overflow-hidden group">
                  <div className="flex items-center gap-5 mb-8">
                      <div className="p-3 bg-emerald-600/10 rounded-2xl"><Users className="w-6 h-6 text-emerald-500" /></div>
                      <h4 className="text-sm font-black text-emerald-500 uppercase tracking-[0.5em]">User_Matrix</h4>
                   </div>
                   <div className="space-y-4">
                      {users.slice(0, 3).map((u, i) => (
                         <div key={i} className="flex items-center justify-between p-3 border border-emerald-900/10 bg-emerald-950/5">
                            <div className="flex items-center gap-3">
                               <div className={`w-2 h-2 rounded-full ${u.is_active ? "bg-emerald-500 animate-pulse" : "bg-emerald-900"}`} />
                               <span className="text-[11px] font-black text-emerald-200 uppercase">{u.username}</span>
                            </div>
                            <span className="text-[8px] text-emerald-900 font-black uppercase tracking-widest">{u.role}</span>
                         </div>
                      ))}
                      <NavLink to="/shinra-admin" className="block text-center text-[9px] text-emerald-900 hover:text-emerald-500 transition-all uppercase tracking-widest mt-6">
                         <ArrowRight className="w-3 h-3 inline mr-2" /> Open Access Matrix
                      </NavLink>
                   </div>
               </div>

               <div className="p-10 hacker-frame bg-black/40 border-emerald-900/10 shadow-2xl relative overflow-hidden group">
                  <div className="flex items-center gap-5 mb-8">
                     <div className="p-3 bg-amber-600/10 rounded-2xl"><ShieldCheck className="w-6 h-6 text-amber-500" /></div>
                     <h4 className="text-sm font-black text-amber-500 uppercase tracking-[0.5em]">Shield_Integrity</h4>
                  </div>
                  <div className="space-y-4">
                     <p className="text-[10px] text-emerald-900 font-black uppercase leading-relaxed">
                        Firewall & Pihole aktiv. <br/>
                        <span className="text-amber-500">{pihole?.blocked_today || 0}</span> Blockierte Bedrohungen heute.
                     </p>
                     <div className="flex gap-2">
                        <div className="h-1 flex-1 bg-amber-500/20 rounded-full overflow-hidden">
                           <div className="h-full bg-amber-500 animate-pulse" style={{ width: '85%' }} />
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}
      </main>

      <ToastContainer toasts={toasts} remove={remove} />
    </div>
  );
}

function DashboardNewsTicker() {
  const apiFetch = useApi();
  const [headlines, setHeadlines] = useState<{ source: string; title: string; url: string }[]>([]);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch('/api/news');
      if (Array.isArray(data?.items)) setHeadlines(data.items);
    } catch {}
  }, [apiFetch]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [load]);

  if (headlines.length === 0) return (
    <div className="text-[10px] text-emerald-950 italic font-mono animate-pulse w-full py-3">Lade Feeds…</div>
  );

  const duration = Math.max(60, headlines.length * 10);
  const items = [...headlines, ...headlines];

  return (
    <div className="w-full overflow-hidden relative group py-4">
      <div className="absolute left-0 top-0 h-full w-12 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
      <div
        className="flex whitespace-nowrap group-hover:[animation-play-state:paused] items-center"
        style={{ animation: `ticker ${duration}s linear infinite` }}
      >
        {items.map((h, i) => (
          <a
            key={i}
            href={h.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-4 text-[13px] text-emerald-400 hover:text-emerald-500 transition-all px-12 shrink-0 group/item"
          >
            <span className="text-emerald-600 font-black text-[9px] uppercase tracking-[0.3em] px-2 py-0.5 bg-emerald-600/10 border border-emerald-600/20 rounded shrink-0 group-hover/item:bg-emerald-600 group-hover/item:text-black transition-colors">
               {h.source}
            </span>
            <span className="font-black tracking-tight uppercase group-hover/item:underline decoration-emerald-600 underline-offset-4">
               {h.title}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

function ServerCommandCenter({ sys, back, containers, lastRefresh }: { sys: any; back: any; containers: ContainerInfo[]; lastRefresh: Date | null }) {
  const badContainers = containers.filter(c => containerTone(c) === 'bad').length;
  const score = opsScore(sys, back, containers);
  const links: { label: string; meta: string; icon: any; href: string; status: BadgeStatus }[] = [
    { label: 'n8n', meta: 'Workflows', icon: Workflow, href: hostUrl(5678), status: 'LIVE' },
    { label: 'Grafana', meta: 'Metrics', icon: Activity, href: hostUrl(3000), status: 'SECURE' },
    { label: 'Paperless', meta: 'Docs', icon: FileText, href: hostUrl(8010), status: 'SECURE' },
    { label: 'Proxy', meta: 'NPM', icon: Globe, href: hostUrl(81), status: 'SECURE' },
    { label: 'Services', meta: 'Control', icon: Server, href: '/ui/services', status: 'EXPERIMENTAL' },
    { label: 'Console', meta: 'VPanel', icon: Terminal, href: '/ui/vpanel', status: 'EXPERIMENTAL' },
  ];
  
  return (
    <SectionCard title="Server_Command_Center" icon={Server} delay={1}>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 font-hacker">
        <div className="xl:col-span-7 glass-card p-8 shadow-2xl relative overflow-hidden glass-reflection">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-transparent pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-8 relative z-10">
            <div>
              <div className="flex items-center gap-4 mb-3">
                 <div className="w-10 h-10 p-1.5 rounded-xl bg-emerald-600/10 border border-emerald-600/20 glow-emerald">
                    <img src="/ui/pigeon_tactical.jpg" className="w-full h-full object-contain" alt="P.I.G.E.O.N." />
                 </div>
                 <div>
                    <p className="text-[9px] text-emerald-500 font-black uppercase tracking-[0.45em] mb-1 opacity-70">Primary_Node</p>
                    <h3 className="text-3xl font-black text-emerald-500 uppercase tracking-tighter italic">server<span className="text-emerald-600">_ops</span></h3>
                 </div>
              </div>
              <p className="text-[10px] text-emerald-900/70 font-black uppercase tracking-[0.25em] mt-2">
                Uptime {sys?.uptime || '—'} · Last Sync {(lastRefresh || new Date()).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:min-w-[400px]">
              <div className="relative group">
                <MiniTelemetry label="OPS" value={`${score}`} hot={score < 85} />
                <div className="absolute bottom-1 left-4 right-4 h-6">
                   <HeartbeatWave active={score >= 85} color={score < 85 ? '#f43f5e' : '#10b981'} />
                </div>
              </div>
              <MiniTelemetry label="CPU" value={`${Math.round(sys?.cpu_pct || 0)}%`} />
              <MiniTelemetry label="RAM" value={`${Math.round(sys?.ram_pct || 0)}%`} />
              <MiniTelemetry label="DISK" value={`${Math.round(sys?.disk_pct || 0)}%`} />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5 relative z-10">
            {links.map(link => (
              <a key={link.label} href={link.href} target={link.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
                 className="group p-5 bg-white/[0.03] hover:bg-emerald-600/10 border border-emerald-900/20 hover:border-emerald-600/40 rounded-xl transition-all flex flex-col items-start gap-4">
                <div className="flex items-center justify-between w-full">
                  <div className="w-10 h-10 rounded-lg bg-emerald-600/10 flex items-center justify-center">
                    <link.icon className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <ModuleBadge status={link.status} className="scale-75 origin-right opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex items-center justify-between w-full min-w-0">
                  <div className="min-w-0">
                    <p className="text-[11px] text-emerald-500 font-black uppercase tracking-[0.18em] truncate">{link.label}</p>
                    <p className="text-[8px] text-emerald-500 font-black uppercase tracking-[0.24em] mt-1 opacity-50">{link.meta}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-emerald-900 group-hover:text-emerald-500 transition-colors" />
                </div>
              </a>
            ))}
          </div>
        </div>

        <div className="xl:col-span-5 glass-card p-8 shadow-2xl relative">
          <div className="flex items-center justify-between mb-7">
            <div>
              <p className="text-[9px] text-emerald-500 font-black uppercase tracking-[0.45em] mb-2 opacity-70">Live_Health</p>
              <h3 className="text-xl font-black text-emerald-500 uppercase tracking-tight">Service Matrix</h3>
            </div>
            <Shield className="w-8 h-8 text-emerald-600 glow-emerald" />
          </div>
          <div className="space-y-3">
             <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-lg border border-emerald-900/20">
                <span className="text-[10px] text-emerald-900/70 font-black uppercase tracking-[0.24em]">Docker_Nodes</span>
                <span className={`text-[9px] font-black uppercase tracking-[0.24em] px-3 py-1 rounded border ${badContainers > 0 ? 'text-emerald-600 border-emerald-600/30' : 'text-emerald-400 border-emerald-500/20'}`}>
                   {badContainers > 0 ? `${badContainers} ALERT` : 'ALL_ONLINE'}
                </span>
             </div>
             <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-lg border border-emerald-900/20">
                <span className="text-[10px] text-emerald-900/70 font-black uppercase tracking-[0.24em]">Backup_State</span>
                <span className="text-[9px] text-emerald-400 font-black uppercase tracking-[0.24em] px-3 py-1 rounded border border-emerald-500/20">SYNCED</span>
             </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function MiniTelemetry({ label, value, hot }: { label: string; value: string; hot?: boolean }) {
  return (
    <div className={`p-4 bg-black/40 border rounded-lg text-center ${hot ? 'border-emerald-500/40' : 'border-emerald-900/20'}`}>
      <p className="text-[8px] text-emerald-950 font-black uppercase tracking-[0.25em] mb-2">{label}</p>
      <p className={`text-lg font-black tabular-nums ${hot ? 'text-emerald-500 glow-emerald' : 'text-emerald-500'}`}>{value}</p>
    </div>
  );
}
