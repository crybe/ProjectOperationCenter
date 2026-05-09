import { useState, useEffect } from 'react';
import { Radio, Rss, ExternalLink, Zap } from 'lucide-react';
import { SectionCard, SkeletonCard } from '../components/ui';
import { useApi } from '../hooks/useApi';

export default function CipherStream() {
  const apiFetch = useApi();
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeed = async () => {
      try {
        const res = await apiFetch('/api/intel/cipher');
        setFeed(res?.items || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadFeed();
    const t = setInterval(loadFeed, 60000); // 1 minute refresh
    return () => clearInterval(t);
  }, [apiFetch]);

  return (
    <div className="w-full min-h-screen pb-48 animate-fade-in space-y-16">
      <div className="flex flex-col gap-4">
        <h2 className="text-4xl font-black text-emerald-500 tracking-tighter uppercase italic flex items-center gap-4">
           <Radio className="w-10 h-10 text-emerald-500 animate-pulse" />
           Cipher<span className="text-emerald-600">_Stream</span>
        </h2>
        <p className="text-[10px] text-emerald-900/70 font-black uppercase tracking-[0.4em]">Live Intelligence & Exploit Aggregator</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
         <div className="lg:col-span-8">
            <SectionCard title="Live_Feed" icon={Rss} delay={1}>
               {loading ? (
                 <SkeletonCard />
               ) : feed.length === 0 ? (
                 <div className="py-20 text-center text-emerald-900 font-hacker uppercase text-[10px] tracking-widest">No signals intercepted.</div>
               ) : (
                 <div className="space-y-6">
                    {feed.map((item, i) => (
                      <a key={i} href={item.url} target="_blank" rel="noreferrer" className="block hacker-frame p-6 bg-black/40 hover:bg-emerald-900/10 transition-all group border-l-2 border-emerald-600/30 hover:border-emerald-500">
                         <div className="flex justify-between items-start mb-3">
                            <h3 className="text-[13px] font-black text-emerald-500 group-hover:text-emerald-400 transition-colors tracking-tight line-clamp-2">{item.title}</h3>
                            <ExternalLink className="w-4 h-4 text-emerald-900 group-hover:text-emerald-500 flex-shrink-0 ml-4" />
                         </div>
                         <div className="flex items-center gap-4 text-[9px] font-black text-emerald-900/70 uppercase tracking-widest mt-4">
                            <span className="text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">{item.source || 'UNKNOWN_SRC'}</span>
                            <span>{item.date || 'RECENT'}</span>
                         </div>
                      </a>
                    ))}
                 </div>
               )}
            </SectionCard>
         </div>

         <div className="lg:col-span-4 space-y-16">
            <SectionCard title="Trending_Keywords" icon={Zap} delay={2}>
               <div className="flex flex-wrap gap-3">
                  {['CVE-2024', 'Zero-Day', 'Ransomware', 'Kernel Panic', 'OpenAI', 'Data Breach', 'Botnet', 'Supply Chain'].map((tag, i) => (
                    <span key={i} className="px-3 py-1.5 text-[9px] font-black uppercase text-emerald-900 bg-emerald-950/20 hacker-frame border-dashed border-emerald-900/30">
                       #{tag}
                    </span>
                  ))}
               </div>
            </SectionCard>
         </div>
      </div>
    </div>
  );
}
