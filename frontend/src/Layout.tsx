import { useEffect, useState, useCallback, useRef } from 'react';
import { useApi } from './hooks/useApi';
import {
  TerminalSquare, Activity, Server, Box, Terminal, Bot, LogOut,
  Layers3, Workflow, Smartphone, Globe, Bell, X, Info, AlertCircle, LayoutDashboard, Lock,
  Search, Radio, Bitcoin, BookOpen, Shield, HardDrive, Zap, ShieldAlert, FileText, Brain, Network, Layers, Database, ShieldCheck, Wrench
} from 'lucide-react';
import { NavLink, Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuditLogViewer } from './components/AuditLogViewer';
import pigeonLogo from './assets/pigeon_tactical.jpg';
import mascotAerith from './assets/mascot_aerith.png';

/**
 * Zentrales Layout-System (Tactical_OS Shell).
 * Beinhaltet Sidebar, Header, Audit-Logs (Sidebar rechts) und das Haupt-Routing.
 */
function CyberneticParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: any[] = [];
    let w: number, h: number;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    const createParticles = () => {
      particles = [];
      const count = 40;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size: Math.random() * 2 + 0.5,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.5,
          opacity: Math.random() * 0.5 + 0.2
        });
      }
    };

    createParticles();

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#10b981';

      particles.forEach((p, i) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.globalAlpha = p.opacity;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Connect lines
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 150) {
            ctx.globalAlpha = (1 - dist / 150) * 0.15;
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      requestAnimationFrame(draw);
    };

    draw();

    return () => window.removeEventListener('resize', resize);
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none opacity-20 z-0" />;
}
function CommandPalette({ isOpen, onClose, navigate }: { isOpen: boolean, onClose: () => void, navigate: any }) {
  const [query, setQuery] = useState('');
  
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => document.getElementById('cmd-palette-input')?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const allRoutes = [...FLAT_NAV, ...TACTICAL_NAV];
  const filtered = allRoutes.filter(r => r.name.toLowerCase().includes(query.toLowerCase()) || r.path.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="relative w-full max-w-2xl bg-black/90 border border-emerald-600/30 rounded-2xl shadow-[0_0_50px_rgba(225,29,72,0.2)] overflow-hidden flex flex-col"
      >
        <div className="flex items-center gap-4 p-4 border-b border-white/10">
          <Search className="w-6 h-6 text-emerald-600" />
          <input 
            id="cmd-palette-input"
            type="text"
            className="flex-1 bg-transparent text-emerald-500 text-lg font-mono focus:outline-none placeholder-gray-600"
            placeholder="Search tactical systems... (z.B. growbox, cve)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'Enter' && filtered.length > 0) {
                navigate(filtered[0].path);
                onClose();
              }
            }}
          />
          <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest border border-gray-700 px-2 py-1 rounded">ESC</div>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500 font-hacker uppercase text-xs tracking-widest">No systems found.</div>
          ) : (
            filtered.map((r, idx) => (
              <button 
                key={r.path}
                onClick={() => { navigate(r.path); onClose(); }}
                className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${idx === 0 && query ? 'bg-emerald-600/20 border border-emerald-600/30' : 'hover:bg-white/5 border border-transparent'} text-left group`}
              >
                <r.icon className={`w-5 h-5 ${idx === 0 && query ? 'text-emerald-500' : 'text-gray-500 group-hover:text-emerald-400'}`} />
                <div className="flex flex-col">
                  <span className={`text-sm font-black uppercase tracking-wider ${idx === 0 && query ? 'text-emerald-500' : 'text-emerald-400/80'}`}>{r.name}</span>
                  <span className="text-[10px] text-gray-600 font-mono">{r.path}</span>
                </div>
                {idx === 0 && query && <span className="ml-auto text-[10px] text-emerald-500 font-black uppercase tracking-widest border border-emerald-500/30 px-2 py-1 rounded">↵ Enter</span>}
              </button>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}

function BotDot() {
  const [active, setActive] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch('/api/sentinel/bot/status');
        if (r.ok) { const d = await r.json(); setActive(d.active); }
      } catch { setActive(false); }
    };
    check();
    const t = setInterval(check, 20000);
    return () => clearInterval(t);
  }, []);

  if (active === null) return null;

  return (
    <div className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl glass-card border transition-all duration-500 relative overflow-hidden group ${active ? 'border-emerald-600/30' : 'border-white/5'}`}
      title={active ? 'P.I.G.E.O.N. aktiv' : 'P.I.G.E.O.N. gestoppt'}>
      {active && <div className="pigeon-scanline opacity-20" />}
      <span className="relative flex h-2 w-2">
        {active && <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-60" />}
        <span className={`relative rounded-full h-2 w-2 ${active ? 'bg-emerald-600 glow-emerald' : 'bg-gray-600'}`} />
      </span>
      <div className="relative">
        <img src={pigeonLogo} className={`w-4 h-4 object-contain transition-all duration-300 ${active ? 'glow-emerald group-hover:scale-125' : 'grayscale opacity-30'}`} alt="P.I.G.E.O.N." />
        {active && <div className="absolute inset-0 bg-emerald-500/10 blur-sm mix-blend-overlay animate-pulse" />}
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline text-emerald-500/60 group-hover:text-emerald-500 transition-colors">{active ? 'P.I.G.E.O.N. Online' : 'P.I.G.E.O.N. Offline'}</span>
    </div>
  );
}

const NAV_CATEGORIES = [
  {
    title: 'CORE',
    items: [
      { name: 'Shinra_Gate',    path: '/',        icon: LayoutDashboard },
      { name: 'Projekte',    path: '/board',   icon: Layers3 },


      { name: 'Notizen',     path: '/notes',   icon: FileText },
    ]
  },
  {
    title: 'INFRASTRUCTURE',
    items: [
      { name: 'VPanel',      path: '/vpanel',  icon: TerminalSquare },
      { name: 'System',      path: '/services',icon: Server },
      { name: 'Storage',     path: '/storage', icon: HardDrive },
    ]
  },
  {
    title: 'HARDWARE & BOTS',
    items: [
      { name: 'Growbox',     path: '/growbox', icon: Box },
      { name: 'Automation',  path: '/n8n',     icon: Workflow },
      { name: 'Cmd',         path: '/cmd',     icon: Terminal },
    ]
  }
];

const FLAT_NAV = NAV_CATEGORIES.flatMap(c => c.items);

const TACTICAL_NAV = [
  { name: 'Fixer Hub',    path: '/fixer',   icon: Wrench },
  { name: 'Blueprint',    path: '/blueprint',icon: Network },
  { name: 'P.I.G.E.O.N.-LOG', path: '/pigeon', icon: FileText },
  { name: 'Shinra Admin',   path: '/admin',   icon: Lock },
  { name: 'Sentinel',    path: '/sentinel',icon: Shield },
  { name: 'NetWatch',    path: '/netwatch',icon: Globe },
  { name: 'OSINT Hub',   path: '/osint',   icon: Search },
  { name: 'Cipher',      path: '/cipher',  icon: Radio },
  { name: 'Dark Pool',   path: '/darkpool',icon: Bitcoin },
  { name: 'Codex',       path: '/codex',   icon: BookOpen },
  { name: 'CVE Scanner', path: '/cve',     icon: ShieldAlert },
];

function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function NewsTicker() {
  const [news, setNews] = useState<any[]>([]);
  
  useEffect(() => {
    fetch('/api/sys/news')
      .then(r => r.json())
      .then(d => setNews(d.news || []))
      .catch(() => {});
  }, []);

  if (news.length === 0) return null;

  return (
    <div className="hidden lg:flex items-center gap-6 px-6 py-2.5 bg-emerald-950/20 border border-emerald-600/10 rounded-2xl overflow-hidden max-w-xl group shadow-inner">
       <div className="flex items-center gap-2 text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em] shrink-0">
          <Radio className="w-3.5 h-3.5 animate-pulse" /> INTEL_STREAM:
       </div>
       <div className="flex-1 overflow-hidden">
          <div className="whitespace-nowrap animate-ticker group-hover:pause italic text-[11px] font-bold text-emerald-900/70">
             {news.map((n, i) => (
               <span key={i} className="mr-24 hover:text-emerald-500 transition-colors cursor-default select-none">
                 [{n.source}] {n.title} — {n.time}
               </span>
             ))}
          </div>
       </div>
    </div>
  );
}

function NotificationHub({ apiFetch }: any) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  const fetchNotifs = useCallback(async () => {
    try {
      const d = await apiFetch('/api/sys/notifications');
      if (d?.ok) setNotifications(d.notifications);
    } catch {}
  }, [apiFetch]);

  useEffect(() => {
    fetchNotifs();
    const t = setInterval(fetchNotifs, 60000);
    return () => clearInterval(t);
  }, [fetchNotifs]);

  const hasUnread = notifications.some(n => !n.read);

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="p-3 glass-panel rounded-xl text-emerald-900 hover:text-emerald-500 transition-all border-emerald-600/10 hover:border-emerald-600/30 relative group">
         <Bell className={`w-5 h-5 ${hasUnread ? 'animate-pigeon-float text-emerald-500' : ''}`} />
         {hasUnread && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-emerald-600 rounded-full glow-emerald border-2 border-black" />}
      </button>
      
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-[280px] sm:w-96 bg-black/95 border border-emerald-600/30 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] z-50 overflow-hidden group/notif"
            >
               <img src={mascotAerith} className="mascot-ornament" style={{ width: '150px', opacity: '0.1' }} alt="Mascot" />
               <div className="p-6 border-b border-white/5 flex justify-between items-center bg-emerald-600/5">
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-500">System_Alerts</h4>
                  <span className="text-[10px] text-gray-600 font-mono">[{notifications.length} NODES]</span>
               </div>
               <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2 space-y-2">
                  {notifications.length === 0 ? (
                    <div className="p-10 text-center text-gray-700 font-hacker uppercase text-[10px] tracking-widest">No active alerts.</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="p-4 bg-white/5 rounded-xl border border-transparent hover:border-emerald-600/20 transition-all group">
                         <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-lg ${n.type === 'error' ? 'bg-emerald-600/10 text-emerald-500' : 'bg-emerald-500/10 text-emerald-400'}`}>
                               {n.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                            </div>
                            <div className="flex-1">
                               <p className="text-xs font-bold text-emerald-400 leading-tight mb-1">{n.message}</p>
                               <span className="text-[9px] text-gray-600 font-mono">{n.time}</span>
                            </div>
                         </div>
                      </div>
                    ))
                  )}
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function PigeonEmergencyBroadcast({ alert, onClose }: { alert: any, onClose: () => void }) {
  const navigate = useNavigate();
  
  useEffect(() => {
    const timer = setTimeout(onClose, 15000); 
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 100, filter: 'blur(20px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: 100, filter: 'blur(20px)' }}
      className="fixed bottom-12 right-6 lg:right-12 w-[calc(100%-3rem)] lg:w-[600px] z-[9999] overflow-hidden"
    >
       <div className="relative p-1 glass-panel border-flow rounded-[2.5rem] shadow-[0_0_80px_rgba(225,29,72,0.4)] bg-black/80 backdrop-blur-3xl group/emergency">
          <div className="absolute inset-0 scanner-line opacity-20 pointer-events-none" />
          <img src={mascotAerith} className="mascot-ornament" style={{ width: '220px', opacity: '0.15' }} alt="Mascot" />
          
          <div className="relative z-10 p-10">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-5">
                   <div className="p-3 bg-emerald-600 rounded-2xl shadow-[0_0_20px_rgba(225,29,72,0.6)]">
                      <ShieldAlert className="w-8 h-8 text-black" />
                   </div>
                   <div>
                      <h4 className="text-xl font-black uppercase tracking-tighter italic text-emerald-500 leading-none">P.I.G.E.O.N._HINWEIS</h4>
                      <p className="text-[9px] text-emerald-900 font-black uppercase tracking-[0.4em] mt-1.5 opacity-50">Kontext: Live_Telemetrie_Analyse</p>
                   </div>
                </div>
                <button onClick={onClose} className="p-3 hover:bg-emerald-600 hover:text-black rounded-2xl transition-all border border-emerald-600/20 text-emerald-500">
                   <X className="w-6 h-6" />
                </button>
             </div>

             <div className="p-8 bg-emerald-600/5 border border-emerald-600/20 rounded-[2rem] mb-8">
                <p className="text-2xl font-black text-emerald-500 uppercase tracking-tighter leading-tight italic drop-shadow-[0_0_10px_rgba(225,29,72,0.4)]">
                   "{alert.message}"
                </p>
             </div>

             {/* Action Bar */}
             <div className="grid grid-cols-2 gap-4 mb-8">
                <button 
                  onClick={() => {
                    if (alert.route) navigate(alert.route);
                    else navigate('/pigeon');
                    onClose();
                  }}
                  className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-emerald-600 text-black font-black uppercase tracking-widest text-[11px] hover:bg-emerald-500 transition-all shadow-lg"
                >
                   <Zap className="w-4 h-4" /> Zum_Modul
                </button>
                <button 
                  onClick={onClose}
                  className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-black/40 border border-emerald-600/30 text-emerald-500 font-black uppercase tracking-widest text-[11px] hover:bg-emerald-600/10 transition-all"
                >
                   <ShieldCheck className="w-4 h-4" /> Bestätigen
                </button>
             </div>

             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                   <span className="text-[9px] text-emerald-950 font-black uppercase tracking-[0.3em]">Warte_auf_menschliche_Eingabe</span>
                </div>
                <div className="w-32 h-1 bg-emerald-950/30 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: "100%" }}
                     animate={{ width: "0%" }}
                     transition={{ duration: 15, ease: "linear" }}
                     className="h-full bg-emerald-600"
                   />
                </div>
             </div>
          </div>
       </div>
    </motion.div>
  );
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const apiFetch = useApi();
  const [isBooting, setIsBooting] = useState(true);
  const [pigeonAlert, setPigeonAlert] = useState<any>(null);

  // Strategic AI Intelligence Timer
  useEffect(() => {
    const tips = [
      "Analysiere Datenstrukturen... Indizierung für maximale taktische Performance optimiert.",
      "Deep-Scan abgeschlossen: Firewall-Integrität bestätigt, keine Sicherheitslücken entdeckt.",
      "Neuraler Link synchronisiert: P.I.G.E.O.N. passt sich Ihren operativen Mustern an.",
      "Bio-Metrik-Check: Growbox-Umgebung läuft im optimalen Bereich (98% Effizienz).",
      "Verschlüsselungs-Update: VPN-Verbindung mit militärischem Standard (AES-256) gehärtet.",
      "Taktischer Vorteil: Schnellbefehl-Interface via 'STRG+K' jederzeit einsatzbereit.",
      "Präventive Wartung: P.I.G.E.O.N. plant System-Optimierung für heute Nacht um 02:00 Uhr."
    ];
    
    const trigger = () => {
      const tip = tips[Math.floor(Math.random() * tips.length)];
      setPigeonAlert({ message: `HINWEIS: ${tip}`, type: 'warning' });
    };

    // Trigger first advisory after 30s, then periodically
    const initial = setTimeout(trigger, 30000);
    const interval = setInterval(() => {
      if (Math.random() > 0.6) trigger(); 
    }, 180000); // Check every 3 minutes
    
    return () => { clearTimeout(initial); clearInterval(interval); };
  }, []);

  // Boot Sequence Timer
  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Mouse Parallax Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty('--mouse-x', `${x}%`);
      document.documentElement.style.setProperty('--mouse-y', `${y}%`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Command Palette Logic
  const [cmdOpen, setCmdOpen] = useState(false);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sidebar Telemetry & AI Logic
  const isPollingRef = useRef(false);
  useEffect(() => {
    const updateStats = async () => {
      if (isPollingRef.current) return;
      isPollingRef.current = true;
      try {
        const [sys, ai] = await Promise.all([
          fetch('/api/sys/info').then(r => r.json()),
          fetch('/api/sys/ai-summary').then(r => r.json())
        ]);
        
        if (sys?.ok) {
          const cpuEl = document.getElementById('side-cpu-bar');
          const cpuVal = document.getElementById('side-cpu-val');
          const ramEl = document.getElementById('side-ram-bar');
          const ramVal = document.getElementById('side-ram-val');
          
          if (cpuEl) cpuEl.style.width = `${sys.data.cpu_pct}%`;
          if (cpuVal) cpuVal.innerText = `${sys.data.cpu_pct}%`;
          if (ramEl) ramEl.style.width = `${sys.data.ram_pct}%`;
          if (ramVal) ramVal.innerText = `${sys.data.ram_pct}%`;

          // P.I.G.E.O.N. Emergency Logic
          if (sys.data.cpu_pct > 90) setPigeonAlert({ message: `CRITICAL_CPU_LOAD: ${sys.data.cpu_pct}% - THRESHOLD EXCEEDED`, type: 'error' });
          else if (sys.data.ram_pct > 95) setPigeonAlert({ message: `MEMORY_OVERFLOW: ${sys.data.ram_pct}% - ACTION REQUIRED`, type: 'error' });
          else if (sys.data.temp > 65) setPigeonAlert({ message: `THERMAL_WARNING: ${sys.data.temp}°C - COOLING INSUFFICIENT`, type: 'error' });
        }
        
        if (ai?.ok) {
          const aiEl = document.getElementById('side-ai-status');
          if (aiEl) aiEl.innerText = ai.summary || 'Status stabil.';
        }
      } catch (e) {
        console.error('Sidebar telemetry failed:', e);
      } finally {
        isPollingRef.current = false;
      }
    };
    
    updateStats();
    const t = setInterval(updateStats, 15000);
    return () => clearInterval(t);
  }, []);

  const logout = () => {
    console.log("[Tactical_OS] Executing Hard De-Authorization...");
    // Direct redirect to /logout is more reliable for clearing Flask sessions
    window.location.href = '/logout';
  };

  return (
    <div className="min-h-screen bg-transparent text-emerald-400 font-sans selection:bg-emerald-500/30 flex flex-col lg:flex-row overflow-hidden relative">
      <CyberneticParticles />
      
      {/* TACTICAL SIDEBAR LEFT (Navigation) */}
      <aside className="hidden lg:flex w-72 -translate-x-[268px] hover:translate-x-0 transition-all duration-700 absolute left-0 top-0 bottom-0 z-[100] group overflow-hidden bg-black/70 backdrop-blur-3xl border-r border-emerald-600/10 shadow-[25px_0_60px_rgba(0,0,0,0.85)]">
         <div className="absolute inset-0 scan-overlay opacity-[0.03] pointer-events-none" />
         <div className="flex flex-col h-full w-full overflow-y-auto custom-scrollbar relative z-10">
            {/* Sidebar Branding Panel */}
            <div className="p-8 border-b border-emerald-900/10 bg-emerald-950/5 group-hover:bg-emerald-950/10 transition-colors">
               <div className="flex items-center gap-6">
                  <div className="relative p-1.5 rounded-[1.25rem] bg-emerald-600/10 border border-emerald-600/20 shadow-[0_0_20px_rgba(225,29,72,0.2)] group-hover:scale-110 transition-transform duration-500">
                     <img src={pigeonLogo} className="w-12 h-12 object-contain" alt="P.I.G.E.O.N." />
                     <div className="absolute inset-0 scanner-line opacity-30" />
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden group-hover:block">
                     <h1 className="text-xl font-black tracking-tighter text-emerald-500 italic leading-none">Antigravity</h1>
                     <span className="text-[10px] text-emerald-900 font-black uppercase tracking-[0.4em] mt-1.5 block">Tactical_OS</span>
                  </div>
               </div>
               
               {/* Sidebar Telemetry */}
               <div className="mt-10 space-y-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden group-hover:block">
                  <div className="space-y-2.5">
                     <div className="flex justify-between text-[9px] text-emerald-900/60 font-black uppercase tracking-[0.3em]">
                        <span>Core_Load</span>
                        <span id="side-cpu-val" className="text-emerald-500 tabular-nums">--%</span>
                     </div>
                     <div className="h-1.5 w-full bg-emerald-950/30 rounded-full overflow-hidden border border-emerald-900/20 shadow-inner">
                        <div id="side-cpu-bar" className="h-full bg-gradient-to-r from-emerald-700 to-emerald-500 shadow-[0_0_15px_rgba(225,29,72,0.6)] transition-all duration-1000" style={{ width: '0%' }} />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <div className="flex justify-between text-[9px] text-emerald-950 font-black uppercase tracking-widest">
                        <span>Mem_Alloc</span>
                        <span id="side-ram-val" className="text-emerald-500 tabular-nums">--%</span>
                     </div>
                     <div className="h-1.5 w-full bg-emerald-950/20 rounded-full overflow-hidden border border-emerald-900/10">
                        <div id="side-ram-bar" className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(225,29,72,0.8)] transition-all duration-1000" style={{ width: '0%' }} />
                     </div>
                  </div>
               </div>
            </div>

            {/* Navigation Nodes */}
            <nav className="flex-1 w-full space-y-8 p-4 mt-6">
               {NAV_CATEGORIES.map((category) => (
                 <div key={category.title} className="space-y-2">
                    <div className="px-4 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden group-hover:block text-[9px] font-black uppercase tracking-[0.5em] text-emerald-900/40 border-l-2 border-emerald-900/20">
                       {category.title}
                    </div>
                    {category.items.map(({ name, path, icon: Icon }) => {
                      const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
                      return (
                        <NavLink key={name} to={path}
                          className={`relative flex items-center gap-6 p-4 rounded-2xl transition-all duration-500 overflow-hidden group/nav ${
                            isActive ? 'bg-emerald-600 text-black shadow-[0_0_30px_rgba(225,29,72,0.3)]' : 'text-emerald-900/60 hover:text-emerald-500 hover:bg-emerald-600/5'
                          }`}>
                          {isActive && <div className="absolute inset-0 scan-overlay opacity-20" />}
                          <div className={`relative z-10 transition-transform duration-500 group-hover/nav:scale-125 ${isActive ? 'text-black' : 'group-hover/nav:text-emerald-500'}`}>
                            <Icon className="w-6 h-6 shrink-0" />
                          </div>
                          <span className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap opacity-0 group-hover:opacity-100 relative z-10 ${isActive ? 'text-black' : 'group-hover/nav:text-emerald-500'}`}>
                            {name}
                          </span>
                        </NavLink>
                      );
                    })}
                 </div>
               ))}
            </nav>
          </div>
      </aside>

      {/* TACTICAL SIDEBAR RIGHT (Tools/Audit) */}
      <aside className="hidden lg:flex w-80 translate-x-[276px] hover:translate-x-0 transition-all duration-700 absolute right-0 top-0 bottom-0 z-[100] group overflow-hidden bg-black/70 backdrop-blur-3xl border-l border-emerald-600/10 shadow-[-25px_0_60px_rgba(0,0,0,0.85)]">
         <div className="absolute inset-0 scan-overlay opacity-[0.03] pointer-events-none" />
         <div className="flex flex-col h-full w-full overflow-y-auto custom-scrollbar relative z-10">
            {/* Sidebar Tools Branding */}
            <div className="p-8 border-b border-emerald-900/10 bg-emerald-950/5 group-hover:bg-emerald-950/10 transition-colors flex flex-col gap-6">
               <div className="flex items-center justify-between">
                  <a href="/logout" className="p-3 rounded-xl bg-emerald-600/5 border border-emerald-600/10 hover:bg-emerald-600 hover:text-black transition-all group/logout relative overflow-hidden" title="De-Authorize System">
                     <LogOut className="w-5 h-5" />
                     <div className="absolute inset-0 scan-overlay opacity-0 group-hover/logout:opacity-20" />
                  </a>
                  <div className="flex items-center gap-6 text-right">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden group-hover:block">
                       <h1 className="text-xl font-black tracking-tighter text-emerald-500 italic leading-none">Tool_Set</h1>
                       <span className="text-[10px] text-emerald-900 font-black uppercase tracking-[0.4em] mt-1.5 block">Audit_&_Intel</span>
                    </div>
                    <div className="relative p-1.5 rounded-[1.25rem] bg-emerald-600/10 border border-emerald-600/20 shadow-[0_0_20px_rgba(225,29,72,0.2)] group-hover:scale-110 transition-transform duration-500">
                       <Layers className="w-12 h-12 text-emerald-500 p-2.5" />
                       <div className="absolute inset-0 scanner-line opacity-30" />
                    </div>
                  </div>
               </div>
            </div>

            {/* Tactical Navigation (Right) */}
            <nav className="p-4 space-y-2 mt-6">
               <div className="px-4 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden group-hover:block text-[9px] font-black uppercase tracking-[0.5em] text-emerald-900/40 text-right border-r-2 border-emerald-900/20">
                  Tactical_Nodes
               </div>
               {TACTICAL_NAV.map(({ name, path, icon: Icon }) => {
                 const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
                 return (
                   <NavLink key={name} to={path}
                     className={`relative flex items-center justify-start lg:justify-end gap-6 p-4 rounded-2xl transition-all duration-500 overflow-hidden group/nav ${
                       isActive ? 'bg-emerald-600 text-black shadow-[0_0_30px_rgba(225,29,72,0.3)]' : 'text-emerald-900/60 hover:text-emerald-500 hover:bg-emerald-600/5'
                     }`}>
                     {isActive && <div className="absolute inset-0 scan-overlay opacity-20" />}
                     <span className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap opacity-0 group-hover:opacity-100 relative z-10 ${isActive ? 'text-black' : 'group-hover/nav:text-emerald-500'}`}>
                        {name}
                     </span>
                     <div className={`relative z-10 transition-transform duration-500 group-hover/nav:scale-125 ${isActive ? 'text-black' : 'group-hover/nav:text-emerald-500'}`}>
                        <Icon className="w-6 h-6 shrink-0" />
                     </div>
                   </NavLink>
                 );
               })}
            </nav>

            {/* Audit Log (In Sidebar) */}
            <div className="mt-auto p-6 bg-black/40 border-t border-emerald-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden group-hover:block">
               <div className="flex items-center gap-3 mb-6">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">Live_Audit_Feed</h4>
               </div>
               <AuditLogViewer apiFetch={apiFetch} />
            </div>
         </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 bg-transparent">
        
        {/* TOP STATUS BAR (Panel 3) */}
        <header className="h-16 md:h-20 lg:h-24 border-b border-emerald-600/10 px-4 md:px-8 lg:px-16 flex items-center justify-between bg-black/60 backdrop-blur-3xl relative group/header shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
           {/* Header Scanning Pulse */}
           <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-600 shadow-[0_0_15px_#f43f5e] animate-[scan-horizontal_10s_linear_infinite] opacity-50" />
           
           <div className="flex items-center gap-8 lg:gap-16 relative z-10">
              <div className="flex flex-col">
                 <div className="flex items-center gap-2 md:gap-3 mb-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                    <span className="text-[8px] md:text-[10px] text-emerald-500 font-black uppercase tracking-[0.3em] md:tracking-[0.5em] leading-none">Node_Online</span>
                 </div>
                 <span className="text-xs md:text-sm lg:text-base font-black text-emerald-500 tracking-tighter uppercase italic leading-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">localhost:5666</span>
              </div>

              <div className="h-10 w-[1px] bg-emerald-900/20" />

              {/* Advanced Breadcrumbs */}
              <div className="hidden xl:flex items-center gap-6 p-4 bg-emerald-950/20 border border-emerald-600/10 rounded-2xl backdrop-blur-3xl group-hover/header:border-emerald-600/30 transition-all duration-500 shadow-inner">
                 <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-emerald-600/10 border border-emerald-600/10"><Database className="w-4 h-4 text-emerald-800" /></div>
                    <span className="text-[10px] text-emerald-900/60 font-black uppercase tracking-[0.4em]">Core_Alpha</span>
                 </div>
                 <div className="w-8 h-[1px] bg-emerald-900/10 rotate-[120deg]" />
                 <div className="flex items-center gap-3">
                    <span className="text-[13px] font-black text-emerald-500 uppercase tracking-[0.15em] italic tabular-nums drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                       {location.pathname === '/' ? 'COMMAND_CENTER' : location.pathname.slice(1).toUpperCase().replace(/\//g, ' > ')}
                    </span>
                 </div>
              </div>

              <BotDot />
           </div>

           <div className="flex items-center gap-6 lg:gap-12 relative z-10">
              <NewsTicker />

              <div className="flex items-center gap-2 md:gap-4 lg:gap-6">
                 <button onClick={() => setCmdOpen(true)} className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-black/60 border border-emerald-900/20 text-emerald-900/70 hover:text-emerald-500 hover:border-emerald-600/50 hover:shadow-[0_0_25px_rgba(225,29,72,0.2)] transition-all duration-500 group/scan">
                    <Search className="w-4 h-4" />
                    <div className="flex flex-col items-start leading-none">
                       <span className="text-[8px] font-black uppercase tracking-widest">System_Scan</span>
                    </div>
                 </button>
                 
                 <div className="flex items-center gap-2 md:gap-3">
                    <Link to="/mobile" className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-emerald-600/5 border border-emerald-600/20 hover:bg-emerald-600 hover:text-black transition-all group/mob shadow-xl">
                       <Smartphone className="w-5 h-5 md:w-6 md:h-6" />
                    </Link>
                    <NotificationHub apiFetch={apiFetch} />
                 </div>
              </div>
           </div>
        </header>

        {/* Content Flow Area */}
        <main className="flex-1 overflow-y-auto relative hologram-overlay custom-scrollbar pb-24 lg:pb-0">

           <PageTransition>
             <div className="max-w-[2000px] mx-auto p-4 md:p-10 lg:p-20 xl:p-28 relative z-10">
               <Outlet />
             </div>
           </PageTransition>
        </main>

        {/* Mobile Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-24 bg-black/95 backdrop-blur-3xl border-t border-emerald-600/30 z-50 overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,1)] px-4">
           <div className="flex items-center gap-8 h-full overflow-x-auto custom-scrollbar whitespace-nowrap hide-scroll-mobile">
              {[...FLAT_NAV, ...TACTICAL_NAV].map(({ name, path, icon: Icon }) => {
                 const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
                 return (
                   <NavLink key={name} to={path}
                     className={`flex flex-col items-center justify-center gap-2.5 transition-all min-w-[70px] ${isActive ? 'text-emerald-500 scale-110' : 'text-emerald-950'}`}>
                     <div className={`p-2.5 rounded-xl ${isActive ? 'bg-emerald-600/20 border border-emerald-600/40' : 'bg-transparent'}`}>
                        <Icon className="w-6 h-6" />
                     </div>
                     <span className="text-[9px] font-black uppercase tracking-[0.2em]">{name}</span>
                   </NavLink>
                 );
              })}
           </div>
        </nav>
      </div>

      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} navigate={navigate} />

      {/* P.I.G.E.O.N. Broadcasts */}
      <AnimatePresence>
        {pigeonAlert && (
          <PigeonEmergencyBroadcast alert={pigeonAlert} onClose={() => setPigeonAlert(null)} />
        )}
      </AnimatePresence>

      {/* Boot Sequence Overlay */}
      <AnimatePresence>
        {isBooting && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="fixed inset-0 z-[1000] bg-[#050505] flex flex-col items-center justify-center font-mono"
          >
            <div className="w-full max-w-lg space-y-8 px-10">
              <div className="flex flex-col items-center gap-6 mb-12">
                <div className="relative p-3 rounded-3xl bg-emerald-600/10 border border-emerald-600/20 glow-emerald overflow-hidden shadow-[0_0_50px_rgba(225,29,72,0.3)] animate-pigeon-float">
                   <img src={pigeonLogo} className="w-24 h-24 object-contain animate-pigeon-glitch" alt="Boot Logo" />
                   <div className="absolute inset-0 scanner-line opacity-40" />
                </div>
                <div className="text-center">
                   <h1 className="text-3xl font-black text-emerald-500 uppercase tracking-tighter italic">Tactical_OS</h1>
                   <p className="text-[10px] text-emerald-900 font-black uppercase tracking-[0.8em] mt-2">Initialize_Protocol_V2.4</p>
                </div>
              </div>
              
              <div className="space-y-4">
                 <div className="flex justify-between text-[10px] text-emerald-600 font-black uppercase tracking-widest">
                    <span className="animate-pulse">Loading Core Components...</span>
                    <span>100%</span>
                 </div>
                 <div className="h-1.5 w-full bg-emerald-950/30 rounded-full overflow-hidden border border-emerald-900/20 shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                      className="h-full bg-emerald-600 glow-emerald"
                    />
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 pt-10">
                 <div className="text-[9px] text-emerald-900 font-black uppercase tracking-widest flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Neural_Link: OK
                 </div>
                 <div className="text-[9px] text-emerald-900 font-black uppercase tracking-widest flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Uplink: OK
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
