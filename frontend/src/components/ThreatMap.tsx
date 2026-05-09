import { useEffect, useState, useMemo } from 'react';
import { Activity, Globe, Target, Crosshair } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Cleaner, higher resolution SVG for dotted representation
const WORLD_MAP_SVG = "M318.8 83.1c-1.3 0-2.2-.6-3.1-1.3-1.3-1.3-2.2-2.5-1.9-4.4.3-1.6 1.3-2.8 2.8-3.5 1.6-.9 3.5-.9 5-.3 1.9.9 2.5 2.5 2.2 4.4-.3 1.3-1.3 2.5-2.5 3.5-1.3 1.3-2.2 1.6-2.5 1.6zm22.4 20.2c-1.3-.9-1.9-2.2-1.9-3.5-.3-1.6.3-3.1 1.6-4.1 1.6-.9 3.1-1.3 4.7-.6 1.3.6 2.5 1.9 2.8 3.5.3 1.6-.3 3.1-1.6 4.1-1.6.9-3.5 1.3-5.6.6zm-17.6 17.6c-.9-1.3-1.3-2.8-1.3-4.1.3-1.6.9-2.8 2.2-3.8 1.3-.9 2.8-1.3 4.4-.6 1.3.6 2.2 1.9 2.5 3.5.3 1.6-.3 2.8-1.6 3.8-1.3.9-3.1 1.6-5.3 1.2h-.9zm18.2-31.5c-1.3-.6-2.2-1.6-2.5-2.8-.3-1.3.3-2.5 1.3-3.5 1.3-.9 2.5-1.3 4.1-.9 1.3.3 2.2 1.3 2.5 2.5.3 1.3-.3 2.5-1.3 3.5-1.3.9-2.5 1.6-4.1 1.2zm-22.1 32.2c-.9-1.3-1.3-2.5-.9-3.8.3-1.3 1.3-2.5 2.5-3.1 1.3-.9 2.8-.9 4.1-.3 1.3.6 2.2 1.9 2.2 3.1.3 1.3-.3 2.5-1.6 3.1-1.3.9-3.1 1.3-5 .6-.3.3-1.3.3-1.3.4zm18.2-13.6c-1.3-.6-2.2-1.9-2.2-3.1-.3-1.3.3-2.5 1.3-3.1 1.3-.9 2.5-1.3 4.1-.6 1.3.6 2.2 1.6 2.5 2.8.3 1.3-.3 2.5-1.3 3.5-1.3.9-3.1 1.3-4.4.5zM151.7 48.7c-.6-.9-.9-1.9-.9-2.8.3-1.3.9-2.2 1.9-2.8.9-.6 2.2-.6 3.5-.3.9.3 1.6 1.3 1.9 2.2.3.9-.3 2.2-1.3 2.8-.9.6-2.2 1.3-3.8.9h-1.3zm19.5 18.3c-1.3-.6-1.9-1.6-2.2-2.5-.3-1.3.3-2.2 1.3-3.1 1.3-.9 2.5-1.3 3.8-.6.9.6 1.6 1.6 1.9 2.8.3 1.3-.3 2.2-1.3 2.8-1.3.9-2.5 1.3-3.5.6zM96.2 82.5c-.9-1.3-1.3-2.5-1.3-3.5.3-1.3.9-2.5 2.2-3.1 1.3-.9 2.5-1.3 3.8-.6.9.6 1.9 1.6 2.2 2.8.3 1.3-.3 2.5-1.3 3.5-1.3.6-3.1 1.3-4.7 1.3h-.9zm18.9-15.8c-1.3-.9-1.9-2.2-1.9-3.5-.3-1.3.3-2.5 1.6-3.1 1.3-.9 2.8-1.3 4.1-.6 1.3.6 2.2 1.6 2.5 2.8.3 1.3-.3 2.5-1.3 3.5-1.6.6-3.5 1.3-5 .9zm-13.9 22.7c-1.3-.9-1.9-2.2-1.9-3.1-.3-1.3.6-2.5 1.6-3.1 1.3-.9 2.8-1.3 4.1-.6 1.3.6 2.2 1.6 2.5 2.8.3 1.3-.3 2.5-1.3 3.5-1.6.6-3.5 1.3-5 .5zm28.7-27.1c-.9-1.3-1.3-2.5-.9-3.5.3-1.3 1.3-2.2 2.5-2.8 1.3-.6 2.5-.6 3.8 0 1.3.6 1.9 1.9 2.2 2.8.3 1.3-.3 2.5-1.6 3.1-1.3.9-3.1 1.3-4.7.6h-1.3zm-17 14.5c-1.3-.6-1.9-1.9-2.2-3.1-.3-1.3.3-2.5 1.3-3.1 1.3-.9 2.5-1.3 3.8-.6 1.3.6 2.2 1.6 2.5 2.8.3 1.3-.3 2.2-1.3 3.1-1.3.9-2.8 1.3-4.1.9zm27.4-14.8c-.9-1.3-1.3-2.5-.9-3.8.3-1.3 1.3-2.5 2.5-3.1 1.3-.6 2.8-.6 4.1 0 1.3.6 2.2 1.9 2.2 3.1.3 1.3-.3 2.5-1.6 3.1-1.6.9-3.1 1.3-5 .6h-1.3zm-15.1 13.9c-.9-1.3-1.3-2.5-.9-3.5.3-1.3 1.3-2.2 2.5-2.8 1.3-.6 2.5-.6 3.8 0 1.3.6 2.2 1.6 2.2 2.8.3 1.3-.3 2.5-1.6 3.1-1.6.9-3.1 1.3-5 .6-.3 0-.6-.3-.6-.2zM182.9 116.2c-1.3-.9-1.9-2.2-1.9-3.1-.3-1.3.6-2.5 1.6-3.1 1.3-.9 2.8-1.3 4.1-.6 1.3.6 2.2 1.6 2.5 2.8.3 1.3-.3 2.5-1.3 3.5-1.6.6-3.5 1.3-5 .5zm28.7-27.1c-.9-1.3-1.3-2.5-.9-3.5.3-1.3 1.3-2.2 2.5-2.8 1.3-.6 2.5-.6 3.8 0 1.3.6 1.9 1.9 2.2 2.8.3 1.3-.3 2.5-1.6 3.1-1.3.9-3.1 1.3-4.7.6h-1.3zm-17 14.5c-1.3-.6-1.9-1.9-2.2-3.1-.3-1.3.3-2.5 1.3-3.1 1.3-.9 2.5-1.3 3.8-.6 1.3.6 2.2 1.6 2.5 2.8.3 1.3-.3 2.2-1.3 3.1-1.3.9-2.8 1.3-4.1.9zm27.4-14.8c-.9-1.3-1.3-2.5-.9-3.8.3-1.3 1.3-2.5 2.5-3.1 1.3-.6 2.8-.6 4.1 0 1.3.6 2.2 1.9 2.2 3.1.3 1.3-.3 2.5-1.6 3.1-1.6.9-3.1 1.3-5 .6h-1.3zm-15.1 13.9c-.9-1.3-1.3-2.5-.9-3.5.3-1.3 1.3-2.2 2.5-2.8 1.3-.6 2.5-.6 3.8 0 1.3.6 2.2 1.6 2.2 2.8.3 1.3-.3 2.5-1.6 3.1-1.6.9-3.1 1.3-5 .6-.3 0-.6-.3-.6-.2zM337.4 69.8c-.9-1.3-1.3-2.5-.9-3.5.3-1.3 1.3-2.2 2.5-2.8 1.3-.6 2.5-.6 3.8 0 1.3.6 2.2 1.6 2.2 2.8.3 1.3-.3 2.5-1.6 3.1-1.6.9-3.1 1.3-5 .6-.3 0-.6-.3-.6-.2zM286.9 146.5c-.9-1.3-1.3-2.5-.9-3.5.3-1.3 1.3-2.2 2.5-2.8 1.3-.6 2.5-.6 3.8 0 1.3.6 2.2 1.6 2.2 2.8.3 1.3-.3 2.5-1.6 3.1-1.6.9-3.1 1.3-5 .6-.3 0-.6-.3-.6-.2z";

const CITIES = [
  { id: 'nyc', x: 80, y: 55, name: 'New York', ip: '192.23.4.10' },
  { id: 'sf', x: 45, y: 55, name: 'San Francisco', ip: '10.5.23.99' },
  { id: 'ldn', x: 180, y: 40, name: 'London', ip: '82.4.55.12' },
  { id: 'fra', x: 195, y: 45, name: 'Frankfurt', ip: '185.12.3.9' },
  { id: 'mos', x: 230, y: 35, name: 'Moscow', ip: '93.1.22.4' },
  { id: 'bej', x: 280, y: 55, name: 'Beijing', ip: '211.3.4.5' },
  { id: 'tok', x: 310, y: 58, name: 'Tokyo', ip: '114.5.6.7' },
  { id: 'syd', x: 315, y: 110, name: 'Sydney', ip: '103.4.5.22' },
  { id: 'sp', x: 110, y: 100, name: 'Sao Paulo', ip: '177.2.3.11' },
  { id: 'cpt', x: 190, y: 110, name: 'Cape Town', ip: '41.3.2.1' },
];

type Attack = {
  id: string;
  source: typeof CITIES[0];
  target: typeof CITIES[0];
  type: string;
  color: string;
};

export function ThreatMap() {
  const [attacks, setAttacks] = useState<Attack[]>([]);
  const [activeTarget, setActiveTarget] = useState<typeof CITIES[0] | null>(null);

  useEffect(() => {
    const attackInterval = setInterval(() => {
      const sourceIdx = Math.floor(Math.random() * CITIES.length);
      let targetIdx = Math.floor(Math.random() * CITIES.length);
      while (targetIdx === sourceIdx) targetIdx = Math.floor(Math.random() * CITIES.length);

      const types = ['DDoS', 'SQLi', 'Brute Force', 'Malware', 'Port Scan'];
      // Clean, professional tactical colors
      const colors = ['#e11d48', '#3b82f6', '#10b981', '#f59e0b']; 
      
      const target = CITIES[targetIdx];
      const newAttack: Attack = {
        id: Math.random().toString(36).substr(2, 9),
        source: CITIES[sourceIdx],
        target,
        type: types[Math.floor(Math.random() * types.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
      };

      setActiveTarget(target);
      setAttacks(prev => [...prev.slice(-3), newAttack]);
    }, 3000);
    return () => clearInterval(attackInterval);
  }, []);

  const createArc = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dr = Math.sqrt(dx * dx + dy * dy) * 1.8; 
    const sweep = dx > 0 ? 0 : 1; 
    return `M ${x1},${y1} A ${dr},${dr} 0 0,${sweep} ${x2},${y2}`;
  };

  return (
    <div className="relative w-full aspect-[21/8] bg-gradient-to-b from-[#010102] to-[#040000] overflow-hidden rounded-xl border border-emerald-900/20 flex flex-col group tilt-card">
      
      {/* Very clean horizontal scanning line */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="w-full h-[50%] bg-gradient-to-b from-transparent via-emerald-600/5 to-transparent animate-[scan-vertical_4s_linear_infinite]" style={{ backgroundSize: '100% 400px' }} />
      </div>

      {/* Professional UI Header */}
      <div className="absolute top-6 left-8 flex items-center gap-4 z-20">
        <div className="p-2.5 bg-emerald-950/10 rounded-lg border border-emerald-900/30 relative overflow-hidden backdrop-blur-md">
          <Globe className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] text-emerald-500 font-black uppercase tracking-[0.3em] font-hacker drop-shadow-md">Global_Threat_Map</span>
          <span className="text-[8px] text-emerald-900/70 uppercase tracking-widest font-mono font-bold mt-1">Live Intelligence Vector</span>
        </div>
      </div>

      {/* Right Stats */}
      <div className="absolute top-6 right-8 text-[9px] font-mono text-emerald-900/70 font-black uppercase tracking-[0.2em] text-right z-20">
        <div className="flex items-center gap-3 justify-end mb-1">
          <span className="text-emerald-500 text-[14px]">{attacks.length * 1234}</span> <span className="opacity-50">ATK/H</span>
        </div>
        <div className="text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">DEFCON 4</div>
      </div>

      {/* Map SVG Area */}
      <div className="relative w-full h-full flex-1 flex items-center justify-center z-10 px-10">
        
        <svg viewBox="0 0 400 180" className="w-full h-full max-h-[500px] overflow-visible mix-blend-screen">
          
          {/* Subtle Grid */}
          <g stroke="rgba(255,255,255,0.03)" strokeWidth="0.2">
             <line x1="0" y1="45" x2="400" y2="45" />
             <line x1="0" y1="90" x2="400" y2="90" />
             <line x1="0" y1="135" x2="400" y2="135" />
             <line x1="100" y1="0" x2="100" y2="180" />
             <line x1="200" y1="0" x2="200" y2="180" />
             <line x1="300" y1="0" x2="300" y2="180" />
          </g>

          {/* Clean Dotted Map Pattern */}
          <path d={WORLD_MAP_SVG} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="1 2" strokeLinecap="round" />
          
          {/* Active Target Crosshair */}
          <AnimatePresence>
            {activeTarget && (
              <motion.g 
                key={`reticle-${activeTarget.id}`}
                initial={{ opacity: 0, scale: 2 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                transform={`translate(${activeTarget.x}, ${activeTarget.y})`}
              >
                <circle cx="0" cy="0" r="10" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                <path d="M-15,0 L-5,0 M15,0 L5,0 M0,-15 L0,-5 M0,15 L0,5" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
                <circle cx="0" cy="0" r="2" fill="rgba(255,255,255,0.8)" />
              </motion.g>
            )}
          </AnimatePresence>

          {/* Attack Arcs */}
          <AnimatePresence>
            {attacks.map(attack => (
              <motion.g key={attack.id}>
                
                {/* Clean Glowing Arc */}
                <motion.path
                  d={createArc(attack.source.x, attack.source.y, attack.target.x, attack.target.y)}
                  fill="none"
                  stroke={attack.color}
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 4px ${attack.color})` }}
                  initial={{ strokeDasharray: "0 1000", opacity: 0 }}
                  animate={{ 
                    strokeDasharray: ["0 1000", "60 1000", "0 1000"],
                    strokeDashoffset: [0, -100, -200],
                    opacity: [0, 1, 0] 
                  }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />

                {/* Single Professional Ripple */}
                <motion.circle
                  cx={attack.target.x}
                  cy={attack.target.y}
                  r="1"
                  fill="none"
                  stroke={attack.color}
                  strokeWidth="1"
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 15, opacity: 0 }}
                  transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
                />
              </motion.g>
            ))}
          </AnimatePresence>
        </svg>

        {/* Clean Feed */}
        <div className="absolute bottom-6 left-8 right-8 flex justify-between items-end pointer-events-none z-30">
          <div className="flex flex-col gap-1 w-full max-w-sm">
            <AnimatePresence>
              {attacks.slice(-3).map(attack => (
                <motion.div key={attack.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-[9px] font-mono uppercase font-black flex items-center gap-4 bg-black/60 px-4 py-2 rounded-lg border border-emerald-900/20 backdrop-blur-md"
                >
                  <Target className="w-3 h-3 text-emerald-900/70" />
                  <span className="text-emerald-400">[{attack.source.ip}]</span>
                  <Activity className="w-3 h-3 text-emerald-900/70" />
                  <span className="text-emerald-500">[{attack.target.ip}]</span>
                  <span className="ml-auto px-2 py-0.5 text-[8px] rounded tracking-widest text-black" style={{ backgroundColor: attack.color }}>{attack.type}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
