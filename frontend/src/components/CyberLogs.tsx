import React, { useState, useEffect } from 'react';

export function CyberLogs({ apiFetch }: any) {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await apiFetch('/api/botlog');
        if (res.lines && Array.isArray(res.lines)) {
          // Take last 15 lines and clean them
          const cleaned = res.lines.slice(-15).map((l: any) => 
            typeof l === 'string' ? l.replace(/\[\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2}\] /, '') : String(l)
          );
          setLogs(cleaned);
        } else if (typeof res.lines === 'string') {
          setLogs([res.lines]);
        }
      } catch (e) {}
    };

    fetchLogs();
    const t = setInterval(fetchLogs, 10000);
    return () => clearInterval(t);
  }, [apiFetch]);

  return (
    <div className="fixed inset-y-0 right-0 w-64 pointer-events-none z-0 overflow-hidden opacity-10 hidden xl:block">
      <div className="absolute inset-0 bg-gradient-to-l from-emerald-500/10 to-transparent" />
      <div className="flex flex-col gap-4 p-8 animate-[slide-up_20s_linear_infinite]">
        {logs.map((log, i) => (
          <div key={i} className="text-[10px] font-mono text-emerald-400 whitespace-nowrap overflow-hidden text-ellipsis uppercase tracking-tighter">
            {`>> ${log}`}
          </div>
        ))}
        {/* Duplicate for seamless loop */}
        {logs.map((log, i) => (
          <div key={`d-${i}`} className="text-[10px] font-mono text-emerald-400 whitespace-nowrap overflow-hidden text-ellipsis uppercase tracking-tighter">
            {`>> ${log}`}
          </div>
        ))}
      </div>
    </div>
  );
}
