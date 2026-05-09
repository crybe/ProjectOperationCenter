import { useState, useCallback, useEffect } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import mascotAerith from '../assets/mascot_aerith.png';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMsg {
  id: number;
  type: ToastType;
  text: string;
}

let _nextId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const toast = useCallback((type: ToastType, text: string) => {
    const id = ++_nextId;
    setToasts(prev => [...prev, { id, type, text }]);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, toast, remove };
}

const STYLES: Record<ToastType, string> = {
  success: 'border-emerald-600/30 shadow-emerald-900/20',
  error:   'border-emerald-500/30   shadow-emerald-900/20',
  info:    'border-cyan-500/30   shadow-cyan-900/20',
};
const ICON_CLS: Record<ToastType, string> = {
  success: 'text-emerald-400',
  error:   'text-emerald-400',
  info:    'text-cyan-400',
};
const Icons = { success: CheckCircle2, error: XCircle, info: Info };

function ToastItem({ t, onRemove }: { t: ToastMsg; onRemove: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onRemove, 4000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  const Icon = Icons[t.type];
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border bg-gray-900/95
      backdrop-blur-md shadow-xl min-w-[240px] max-w-xs text-sm relative overflow-hidden group ${STYLES[t.type]}`}
      style={{ animation: 'slideIn 0.2s ease-out' }}>
      <img src={mascotAerith} className="mascot-ornament" style={{ width: '60px', opacity: '0.1' }} alt="Mascot" />
      <Icon className={`w-4 h-4 shrink-0 relative z-10 ${ICON_CLS[t.type]}`} />
      <span className="flex-1 text-emerald-400 font-medium">{t.text}</span>
      <button onClick={onRemove} className="text-emerald-900 hover:text-emerald-400 transition-colors ml-1">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, remove }: { toasts: ToastMsg[]; remove: (id: number) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem t={t} onRemove={() => remove(t.id)} />
        </div>
      ))}
    </div>
  );
}
