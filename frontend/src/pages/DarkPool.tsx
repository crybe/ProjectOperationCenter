import { useState, useEffect } from 'react';
import { Bitcoin, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { SectionCard, SkeletonCard } from '../components/ui';
import { useApi } from '../hooks/useApi';

export default function DarkPool() {
  const apiFetch = useApi();
  const [cryptoData, setCryptoData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await apiFetch('/api/intel/crypto');
        setCryptoData(res?.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    const t = setInterval(loadData, 30000); // 30 sec refresh
    return () => clearInterval(t);
  }, [apiFetch]);

  return (
    <div className="w-full min-h-screen pb-48 animate-fade-in space-y-16">
      <div className="flex flex-col gap-4">
        <h2 className="text-4xl font-black text-emerald-500 tracking-tighter uppercase italic flex items-center gap-4">
           <Bitcoin className="w-10 h-10 text-emerald-500" />
           Dark<span className="text-emerald-600">_Pool</span>
        </h2>
        <p className="text-[10px] text-emerald-900/70 font-black uppercase tracking-[0.4em]">Decentralized Finance & Treasury Monitoring</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
         <div className="lg:col-span-8">
            <SectionCard title="Live_Treasury_Assets" icon={DollarSign} delay={1}>
               {loading ? (
                 <SkeletonCard />
               ) : cryptoData.length === 0 ? (
                 <div className="py-20 text-center text-emerald-900 font-hacker uppercase text-[10px] tracking-widest">No assets tracked.</div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {cryptoData.map((asset, i) => {
                      const isUp = asset.change_24h >= 0;
                      return (
                        <div key={i} className={`p-8 hacker-frame border-t-4 shadow-xl ${isUp ? 'border-emerald-600 bg-emerald-600/5' : 'border-emerald-500 bg-emerald-500/5'}`}>
                           <div className="flex justify-between items-start mb-6">
                              <span className="text-[14px] font-black text-emerald-500 uppercase tracking-tighter">{asset.symbol}</span>
                              {isUp ? <TrendingUp className="w-5 h-5 text-emerald-500" /> : <TrendingDown className="w-5 h-5 text-emerald-500" />}
                           </div>
                           <div className="space-y-1">
                              <p className="text-3xl font-black text-emerald-500 tabular-nums">${asset.price.toLocaleString()}</p>
                              <p className={`text-[10px] font-black uppercase tracking-widest ${isUp ? 'text-emerald-500' : 'text-emerald-500'}`}>
                                {isUp ? '+' : ''}{asset.change_24h.toFixed(2)}% (24H)
                              </p>
                           </div>
                        </div>
                      );
                    })}
                 </div>
               )}
            </SectionCard>
         </div>
      </div>
    </div>
  );
}
