import { useEffect, useState } from 'react';
import { 
  Server, Cpu, Database, Bot, Globe, Shield, 
  Smartphone, Monitor, Zap, Terminal, Activity,
  ChevronRight, Layers, Share2, Network
} from 'lucide-react';
import { SectionCard } from '../components/ui';

interface NodeProps {
  id: string;
  label: string;
  icon: React.ElementType;
  status: 'online' | 'active' | 'offline';
  description: string;
  connections: string[];
  type: 'core' | 'service' | 'hardware' | 'agent';
}

const NODES: NodeProps[] = [
  { 
    id: 'pi5', 
    label: 'Primary_Node (RPi5)', 
    icon: Cpu, 
    status: 'online', 
    description: 'Central Processing & Host OS', 
    connections: ['flask', 'docker', 'growbox'],
    type: 'core'
  },
  { 
    id: 'flask', 
    label: 'Tactical_API (Flask)', 
    icon: Terminal, 
    status: 'active', 
    description: 'System Orchestration Layer', 
    connections: ['db', 'ui', 'sentinel'],
    type: 'service'
  },
  { 
    id: 'docker', 
    label: 'Container_Cluster', 
    icon: Layers, 
    status: 'online', 
    description: 'n8n, Prometheus, Grafana, NPM', 
    connections: ['flask', 'net'],
    type: 'service'
  },
  { 
    id: 'db', 
    label: 'Neural_Storage (DB)', 
    icon: Database, 
    status: 'online', 
    description: 'SQLite + JSON Event Logs', 
    connections: ['flask'],
    type: 'service'
  },
  { 
    id: 'ui', 
    label: 'React_Front_End', 
    icon: Monitor, 
    status: 'active', 
    description: 'Vite Next-Gen UI', 
    connections: ['flask'],
    type: 'service'
  },
  { 
    id: 'bot', 
    label: 'P.I.G.E.O.N. Bot', 
    icon: Bot, 
    status: 'active', 
    description: 'Telegram Integration & AI Agent', 
    connections: ['flask', 'net'],
    type: 'agent'
  },
  { 
    id: 'growbox', 
    label: 'Growbox_Hardware', 
    icon: Zap, 
    status: 'online', 
    description: 'AC Infinity Control Hub', 
    connections: ['pi5', 'flask'],
    type: 'hardware'
  },
  { 
    id: 'net', 
    label: 'External_Gateway', 
    icon: Globe, 
    status: 'online', 
    description: 'Nginx Proxy Manager', 
    connections: ['flask', 'ui'],
    type: 'service'
  }
];

export default function SystemMap() {
  const [activeNode, setActiveNode] = useState<string | null>('pi5');

  const currentNode = NODES.find(n => n.id === activeNode) || NODES[0];
  const CurrentIcon = currentNode.icon as any;

  return (
    <div className="w-full space-y-12 pb-48 animate-fade-in relative">
      {/* Background Grid & Scanline */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-10">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-emerald-600 animate-[scan-vertical_12s_linear_infinite]" />
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 relative z-10">
        <div className="space-y-4">
          <div className="flex items-center gap-6">
             <div className="p-4 rounded-3xl bg-emerald-600/10 border border-emerald-600/20 glow-emerald shadow-2xl holo-icon relative overflow-hidden group">
                <div className="absolute inset-0 scan-overlay opacity-30" />
                <Share2 className="w-12 h-12 text-emerald-500 relative z-10 group-hover:scale-110 transition-transform duration-500" />
             </div>
             <div>
                <div className="flex items-center gap-2 mb-1">
                   <div className="h-[1px] w-8 bg-emerald-600/50" />
                   <span className="text-[8px] font-black text-emerald-900 uppercase tracking-[0.8em]">Architecture_Node: SYS-BLUEPRINT</span>
                </div>
                <h2 className="text-4xl sm:text-6xl font-black text-emerald-500 tracking-tighter uppercase italic flex items-center gap-4 drop-shadow-[0_0_20px_rgba(204,0,0,0.3)]">
                  System<span className="text-emerald-600 font-outline-1">_Blueprint</span>
                </h2>
                <p className="text-[10px] text-emerald-900 font-black uppercase tracking-[0.6em] mt-3 opacity-70">Infrastructure & Data Flow Visualizer</p>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
           <div className="flex flex-col items-end">
             <span className="text-[10px] text-emerald-900 font-black uppercase tracking-widest mb-1 opacity-50">Map_Type</span>
             <span className="text-2xl font-black text-emerald-500 glow-emerald tracking-widest uppercase italic">Full_Logic</span>
           </div>
           <div className="p-5 glass-panel border-emerald-600/30 text-emerald-500 shadow-2xl rounded-2xl holo-icon relative overflow-hidden">
              <div className="absolute inset-0 scan-overlay opacity-20" />
              <Network className="w-6 h-6 relative z-10" />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
        
        {/* Interactive Map Visualizer */}
        <div className="lg:col-span-8 space-y-8">
           <div className="bg-black/60 border border-emerald-900/20 rounded-[3rem] p-12 min-h-[600px] relative overflow-hidden flex items-center justify-center group shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <div className="absolute inset-0 scan-overlay opacity-5 pointer-events-none" />
              
              {/* SVG Connector Lines (Simplified Visual) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                 <defs>
                    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                       <stop offset="0%" stopColor="transparent" />
                       <stop offset="50%" stopColor="#e11d48" />
                       <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                 </defs>
                 {/* Visual connectors would go here - simplified for this pass */}
              </svg>

              {/* Node Cluster */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-12 relative z-10">
                 {NODES.map((node) => {
                   const IconComponent = node.icon as any;
                   const isActive = activeNode === node.id;
                   const isConnected = currentNode.connections.includes(node.id) || node.connections.includes(currentNode.id);

                   return (
                     <button
                       key={node.id}
                       onClick={() => setActiveNode(node.id)}
                       className={`flex flex-col items-center gap-4 transition-all duration-500 ${isActive ? 'scale-110' : isConnected ? 'opacity-100 scale-105' : 'opacity-30 hover:opacity-60'}`}
                     >
                        <div className={`p-6 rounded-3xl border-2 relative overflow-hidden transition-all duration-500 ${
                          isActive 
                            ? 'bg-emerald-600/20 border-emerald-600 shadow-[0_0_40px_rgba(225,29,72,0.4)]' 
                            : isConnected 
                              ? 'bg-emerald-600/10 border-emerald-600/40' 
                              : 'bg-black/40 border-emerald-900/20'
                        }`}>
                           <div className="absolute inset-0 scan-overlay opacity-10" />
                           <IconComponent className={`w-10 h-10 ${isActive ? 'text-emerald-500 animate-pulse' : 'text-emerald-900'}`} />
                        </div>
                        <div className="text-center">
                           <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-emerald-500' : 'text-emerald-900'}`}>{node.label}</span>
                           {isActive && <div className="h-[2px] w-full bg-emerald-600 mt-1 glow-emerald rounded-full" />}
                        </div>
                     </button>
                   );
                 })}
              </div>
           </div>
        </div>

        {/* Node Metadata Analysis */}
        <div className="lg:col-span-4 space-y-12">
           <SectionCard 
             title="Node_Analysis" 
             icon={Activity}
             action={
               <div className="flex items-center gap-3">
                  <div className="status-dots">
                     <div className={`status-dot ${currentNode.status === 'active' ? 'active' : ''}`} />
                     <div className="status-dot" />
                  </div>
                  <span className="text-[9px] font-black text-emerald-900 uppercase tracking-widest">{currentNode.status}</span>
               </div>
             }
           >
              <div className="space-y-10">
                 <div className="p-8 bg-black/40 border border-emerald-600/20 rounded-[2.5rem] relative overflow-hidden group reactive-border shadow-2xl">
                    <div className="absolute inset-0 scan-overlay opacity-5 pointer-events-none" />
                    <div className="flex items-center gap-5 mb-8 relative z-10">
                       <div className="p-4 bg-emerald-600/10 rounded-2xl border border-emerald-600/20 holo-icon shadow-[0_0_30px_rgba(225,29,72,0.15)]">
                          <CurrentIcon className="w-8 h-8 text-emerald-500 relative z-10" />
                       </div>
                       <div>
                          <h4 className="text-xl font-black text-emerald-500 uppercase tracking-tighter italic">{currentNode.label}</h4>
                          <p className="text-[9px] text-emerald-900 font-black uppercase tracking-widest opacity-40">Type: {currentNode.type}</p>
                       </div>
                    </div>
                    
                    <div className="space-y-6 relative z-10">
                       <div className="p-6 border-l-2 border-emerald-600/30 bg-emerald-950/5 rounded-r-2xl">
                          <p className="text-[10px] text-emerald-500 leading-relaxed font-black uppercase tracking-widest italic">
                             {currentNode.description}
                          </p>
                       </div>

                       <div className="space-y-4">
                          <p className="text-[9px] text-emerald-900 font-black uppercase tracking-[0.3em] opacity-40">Active_Connections</p>
                          <div className="flex flex-wrap gap-3">
                             {currentNode.connections.map(conn => (
                               <div key={conn} className="px-4 py-2 bg-black/60 border border-emerald-900/20 rounded-xl text-[10px] text-emerald-500 font-black uppercase tracking-tighter hover:border-emerald-600/40 transition-colors">
                                 {conn.toUpperCase()}
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="p-10 glass-card bg-emerald-600/5 group border-emerald-600/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 scan-overlay opacity-10 pointer-events-none" />
                    <div className="flex items-center gap-4 mb-8 relative z-10">
                       <div className="p-2 bg-emerald-600/10 rounded-lg border border-emerald-600/20"><Terminal className="w-5 h-5 text-emerald-500" /></div>
                       <h4 className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.4em] font-hacker">Protocol_Status</h4>
                    </div>
                    <div className="space-y-4 relative z-10">
                       <div className="flex items-center justify-between px-2">
                          <span className="text-[9px] text-emerald-900 font-black uppercase tracking-widest">Health_Factor</span>
                          <span className="text-[9px] text-emerald-500 font-black uppercase">98.4%</span>
                       </div>
                       <div className="h-1.5 w-full bg-emerald-950/20 rounded-full overflow-hidden border border-emerald-900/10">
                          <div className="h-full bg-emerald-600 glow-emerald rounded-full w-[98.4%]" />
                       </div>
                    </div>
                 </div>
              </div>
           </SectionCard>
        </div>

      </div>
    </div>
  );
}
