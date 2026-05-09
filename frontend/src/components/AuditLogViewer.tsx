import { useState, useEffect, useCallback } from 'react';
import { Terminal } from 'lucide-react';

export function AuditLogViewer({ apiFetch }: { apiFetch: any }) {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      const d = await apiFetch('/api/admin/audit-logs?lines=30');
      if (d?.ok) setLogs(d.logs);
    } catch {}
    finally { setLoading(false); }
  }, [apiFetch]);

  useEffect(() => {
    fetchLogs();
    const t = setInterval(fetchLogs, 10000);
    return () => clearInterval(t);
  }, [fetchLogs]);

  return (
    <div className="w-full">
      <div className="p-4 bg-black/40 border border-white/5 rounded-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-[9px] text-emerald-500 font-black uppercase tracking-widest">
            <Terminal className="w-3 h-3" /> System_Audit_Log
          </div>
          {loading && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
        </div>
        <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar font-mono text-[9px]">
          {logs.map((log, i) => {
            const parts = log.match(/\[(.*?)\] \[(.*?)\] \[(.*?)\] (.*)/);
            if (!parts) return <div key={i} className="text-gray-600 truncate">{log}</div>;
            const [_, time, user, cat, msg] = parts;
            const isError = msg.includes('ERROR') || msg.includes('FAILED');
            const isSuccess = msg.includes('SUCCESS');
            
            return (
              <div key={i} className="border-l border-white/5 pl-2 py-0.5 group/item">
                <div className="flex justify-between items-center opacity-40 group-hover/item:opacity-100">
                  <span className="text-gray-600">{time.split(' ')[1]}</span>
                  <span className={`px-1 rounded ${isError ? 'bg-emerald-500/20 text-emerald-500' : isSuccess ? 'bg-emerald-600/20 text-emerald-500' : 'bg-white/5 text-gray-500'}`}>{cat}</span>
                </div>
                <div className={`truncate ${isError ? 'text-emerald-400' : isSuccess ? 'text-emerald-400' : 'text-gray-400'}`}>
                  {msg.split(' | ')[0]}
                </div>
              </div>
            );
          })}
          {logs.length === 0 && !loading && <div className="text-gray-700 italic">Keine Einträge.</div>}
        </div>
      </div>
    </div>
  );
}
