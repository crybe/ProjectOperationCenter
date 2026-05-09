import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export default function UpdateBanner() {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW();
  if (!needRefresh) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-4 px-5 py-3 rounded-2xl bg-black/95 border border-emerald-500/50 shadow-2xl shadow-emerald-500/20 backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-300">
      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
      <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400 whitespace-nowrap">
        Neue_Version_verfügbar
      </span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-600 text-black text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shrink-0"
      >
        <RefreshCw className="w-3 h-3" />
        Update
      </button>
      <button
        onClick={() => setNeedRefresh(false)}
        className="text-emerald-900 hover:text-emerald-500 transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
