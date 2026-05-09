import React, { useEffect, useState } from 'react';
import { Cpu, Database, HardDrive, Thermometer, Droplets, Sun, Wind } from 'lucide-react';
import { useApi } from '../hooks/useApi';

interface SysInfo {
  cpu_pct: number;
  cpu: string;
  ram_pct: number;
  ram: string;
  disk_pct: number;
  disk: string;
  temp: number | null;
  uptime: string;
}

interface GrowMetrics {
  temperature: number | null;
  humidity: number | null;
  vpd: number | null;
  lamp_level: number | null;
  fan_speed: number | null;
}

const MobileStatus: React.FC = () => {
  const apiFetch = useApi();
  const [sysInfo, setSysInfo] = useState<SysInfo | null>(null);
  const [grow, setGrow] = useState<GrowMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [sysData, growData] = await Promise.all([
        apiFetch('/api/sentinel/sysinfo'),
        apiFetch('/api/grow/metrics')
      ]);
      setSysInfo(sysData);
      setGrow(growData);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const StatusCard = ({ title, icon: Icon, value, pct, color }: any) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm shadow-xl">
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2 rounded-lg ${color} bg-opacity-20`}>
          <Icon size={20} className={color.replace('bg-', 'text-')} />
        </div>
        <span className="text-xs font-bold text-gray-500 uppercase">{title}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-xl font-bold">{value}</span>
        {pct !== undefined && (
          <span className={`text-xs font-bold ${pct > 80 ? 'text-red-400' : 'text-emerald-400'}`}>
            {pct}%
          </span>
        )}
      </div>
      {pct !== undefined && (
        <div className="mt-3 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${pct > 80 ? 'bg-red-500' : 'bg-emerald-500'}`} 
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );

  if (loading && !sysInfo) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <section>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Database size={14} /> Server Ressourcen
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <StatusCard 
            title="CPU Load" 
            icon={Cpu} 
            value={sysInfo?.cpu || '–'} 
            pct={sysInfo?.cpu_pct}
            color="bg-cyan-500"
          />
          <StatusCard 
            title="Memory" 
            icon={Database} 
            value={sysInfo?.ram.split(' / ')[0] + ' MB' || '–'} 
            pct={sysInfo?.ram_pct}
            color="bg-purple-500"
          />
          <StatusCard 
            title="Storage" 
            icon={HardDrive} 
            value={sysInfo?.disk.split(' / ')[0] + ' GB' || '–'} 
            pct={sysInfo?.disk_pct}
            color="bg-orange-500"
          />
          <StatusCard 
            title="Temp" 
            icon={Thermometer} 
            value={sysInfo?.temp ? `${sysInfo.temp}°C` : '–'} 
            color="bg-red-500"
          />
        </div>
        <div className="mt-4 text-[10px] text-gray-500 text-center">
          Uptime: {sysInfo?.uptime}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Sun size={14} /> Growbox Live
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <StatusCard 
            title="Temp" 
            icon={Thermometer} 
            value={grow?.temperature ? `${grow.temperature}°C` : '–'} 
            color="bg-yellow-500"
          />
          <StatusCard 
            title="Humidity" 
            icon={Droplets} 
            value={grow?.humidity ? `${grow.humidity}%` : '–'} 
            color="bg-cyan-400"
          />
          <StatusCard 
            title="VPD" 
            icon={Wind} 
            value={grow?.vpd ? `${grow.vpd} kPa` : '–'} 
            color="bg-emerald-400"
          />
          <StatusCard 
            title="Lamp" 
            icon={Sun} 
            value={grow && grow.lamp_level !== null ? `${grow.lamp_level * 10}%` : '–'} 
            color="bg-orange-400"
          />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Wind size={14} /> Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={async () => {
              const level = grow?.lamp_level === 0 ? 10 : 0;
              await apiFetch('/api/grow/lamp', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ level }) 
              });
              fetchData();
            }}
            className="bg-white/5 border border-white/10 p-4 rounded-3xl flex flex-col items-center gap-2 active:scale-95 transition-all"
          >
            <div className={`p-3 rounded-2xl ${grow?.lamp_level && grow.lamp_level > 0 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-500'}`}>
              <Sun size={24} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">Licht {grow?.lamp_level && grow.lamp_level > 0 ? 'Aus' : 'An'}</span>
          </button>

          <button 
            onClick={async () => {
              if (confirm('Bewässerung für 10 Sekunden starten?')) {
                await apiFetch('/api/grow/water', { method: 'POST' });
                alert('Bewässerung gestartet!');
                fetchData();
              }
            }}
            className="bg-white/5 border border-white/10 p-4 rounded-3xl flex flex-col items-center gap-2 active:scale-95 transition-all"
          >
            <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-2xl">
              <Droplets size={24} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">Wässern</span>
          </button>
        </div>
      </section>
    </div>
  );
};

export default MobileStatus;
