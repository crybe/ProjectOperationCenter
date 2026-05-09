import React, { useState } from 'react';
import { LayoutDashboard, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

const dashboards = [
  { id: 'server', name: 'Server Stats', url: 'http://localhost:3000/d/rpi5-main?orgId=1&refresh=10s&kiosk' },
  { id: 'pihole', name: 'Pi-hole Stats', url: 'http://localhost:3000/d/pihole-dns-v1?orgId=1&refresh=10s&kiosk' },
];

const MobileDashboards: React.FC = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const dashboard = dashboards[currentIdx];

  const next = () => setCurrentIdx((currentIdx + 1) % dashboards.length);
  const prev = () => setCurrentIdx((currentIdx - 1 + dashboards.length) % dashboards.length);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Selector Header */}
      <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
        <button onClick={prev} className="p-2 hover:bg-white/10 rounded-full text-gray-400">
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
          <h2 className="text-lg font-bold flex items-center justify-center gap-2">
            <LayoutDashboard size={18} className="text-emerald-400" />
            {dashboard.name}
          </h2>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Dashboard {currentIdx + 1} von {dashboards.length}</p>
        </div>
        <button onClick={next} className="p-2 hover:bg-white/10 rounded-full text-gray-400">
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Dashboard Iframe */}
      <div className="flex-1 relative bg-black">
        <iframe 
          src={dashboard.url}
          className="w-full h-full border-none"
          title={dashboard.name}
        />
        
        {/* Overlay Tools */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <a 
            href={dashboard.url.replace('&kiosk', '')} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-3 bg-emerald-600 rounded-full shadow-lg active:scale-90 transition-all"
          >
            <ExternalLink size={20} />
          </a>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-black/40 text-[11px] text-gray-400 text-center italic">
        Tipp: Nutze das Dashboard im Querformat für eine bessere Übersicht.
      </div>
    </div>
  );
};

export default MobileDashboards;
