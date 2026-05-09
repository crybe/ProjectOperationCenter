import { useState, useEffect } from 'react';
import { ShieldAlert, Bug, Server, Code, CheckCircle, AlertTriangle, RefreshCw, Activity, Zap } from 'lucide-react';
import { SectionCard, SkeletonCard } from '../components/ui';
import { useApi } from '../hooks/useApi';

export default function CVEReport() {
  const apiFetch = useApi();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/security/vulnerabilities');
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const triggerScan = async () => {
    if (scanning) return;
    setScanning(true);
    try {
      // Step 1: Trigger the scan
      await apiFetch('/api/security/scan', { method: 'POST' });
      
      // Step 2: Poll for results (simple approach: wait a few seconds)
      // Real implementation might use a task ID, but here we just wait and refresh
      setTimeout(async () => {
        await loadData();
        setScanning(false);
      }, 5000);
    } catch (e) {
      console.error("Scan failed", e);
      setScanning(false);
    }
  };

  useEffect(() => {
    loadData();
    const t = setInterval(loadData, 60000); // refresh every minute
    return () => clearInterval(t);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      case 'low': return 'text-emerald-500 bg-emerald-600/10 border-emerald-600/30';
      default: return 'text-emerald-900/70 bg-gray-500/10 border-gray-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'os': return <Server className="w-4 h-4" />;
      case 'python': return <Code className="w-4 h-4" />;
      case 'npm': return <Bug className="w-4 h-4" />;
      default: return <ShieldAlert className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full min-h-screen pb-48 animate-fade-in space-y-16">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-emerald-900/20 pb-8">
        <div className="flex flex-col gap-4">
          <h2 className="text-5xl font-black text-emerald-500 tracking-tighter uppercase italic flex items-center gap-6">
             <ShieldAlert className={`w-12 h-12 text-emerald-500 ${scanning ? 'animate-pulse' : ''}`} />
             CVE<span className="text-emerald-600">_Intelligence</span>
          </h2>
          <p className="text-[11px] text-emerald-900/70 font-black uppercase tracking-[0.5em] flex items-center gap-3">
            <Activity className="w-3 h-3" />
            <span>Tactical Security & Vulnerability Scanner</span>
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
           <div className="flex items-center gap-4">
              {scanning && (
                <div className="flex items-center gap-2 text-emerald-500 font-mono text-[10px] animate-pulse">
                  <Zap className="w-3 h-3 fill-emerald-500" />
                  SCANNING_IN_PROGRESS...
                </div>
              )}
              <div className="text-[10px] font-mono text-emerald-900/50 bg-emerald-950/20 px-3 py-1 border border-emerald-900/30">
                STATUS: {data?.status?.toUpperCase() || 'UNKNOWN'}
              </div>
           </div>
           {data?.last_scan && (
             <div className="text-[10px] text-emerald-500/60 font-mono">
               LAST_CHECK: {new Date(data.last_scan).toLocaleString()}
             </div>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
         {/* Summary Panel */}
         <div className="lg:col-span-4 space-y-8">
            <SectionCard title="Threat_Matrix" icon={AlertTriangle} delay={1}>
               {loading && !data ? (
                 <SkeletonCard />
               ) : (
                 <div className="grid grid-cols-2 gap-4">
                   {['critical', 'high', 'medium', 'low'].map(level => (
                     <div key={level} className={`p-6 border hacker-frame flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.02] ${getSeverityColor(level)}`}>
                       <span className="text-4xl font-black">{data?.summary?.[level] || 0}</span>
                       <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-80">{level}</span>
                     </div>
                   ))}
                 </div>
               )}
            </SectionCard>

            <div className="space-y-4">
              <button 
                onClick={triggerScan} 
                disabled={scanning}
                className={`w-full hacker-frame py-5 font-black uppercase tracking-[0.4em] transition-all flex justify-center items-center gap-4 ${
                  scanning 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 cursor-wait' 
                  : 'bg-emerald-600/10 border-emerald-600/30 text-emerald-500 hover:bg-emerald-600/20 hover:border-emerald-500/60'
                }`}
              >
                 <RefreshCw className={`w-6 h-6 ${scanning ? 'animate-spin' : ''}`} /> 
                 {scanning ? 'Analyzing_Systems...' : 'Initiate_Full_Scan'}
              </button>
              
              {data?.recommendations && data.recommendations.length > 0 && (
                <div className="p-5 hacker-frame bg-emerald-950/20 border border-emerald-500/20">
                  <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                    <Zap className="w-3 h-3 fill-emerald-500" /> Strategic_Advisory
                  </h4>
                  <ul className="space-y-3">
                    {data.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="text-[10px] text-emerald-400 font-mono flex items-start gap-3">
                        <span className="text-emerald-600 mt-1">▶</span>
                        <span className="leading-relaxed uppercase">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-4 bg-emerald-950/10 border border-emerald-900/20 rounded-sm">
                <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Activity className="w-3 h-3" /> Scanner_Info
                </h4>
                <p className="text-[10px] text-emerald-900/60 leading-relaxed italic">
                  Checks OS packages, Python dependencies, and known exploit databases. Automated scans occur every 24h.
                </p>
              </div>
            </div>
         </div>

         {/* Vulnerabilities List */}
         <div className="lg:col-span-8">
            <SectionCard title="Identified_Vulnerabilities" icon={Bug} delay={2}>
               {loading && !data ? (
                 <SkeletonCard />
               ) : !data?.vulnerabilities || data.vulnerabilities.length === 0 ? (
                 <div className="py-32 flex flex-col items-center justify-center gap-6 text-emerald-500/40">
                    <div className="relative">
                      <CheckCircle className="w-24 h-24 opacity-20" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 border-2 border-emerald-500/10 rounded-full animate-ping" />
                      </div>
                    </div>
                    <span className="font-hacker uppercase text-[12px] tracking-[0.3em] text-emerald-500">System Secure. No active threats.</span>
                 </div>
               ) : (
                 <div className="space-y-6">
                    {data.vulnerabilities.map((vuln: any, idx: number) => (
                      <div key={vuln.id || idx} className={`p-6 hacker-frame bg-black/40 border-l-4 group transition-all hover:bg-black/60 ${
                        vuln.severity === 'critical' ? 'border-red-500 shadow-[inset_4px_0_0_rgba(239,68,68,0.1)]' :
                        vuln.severity === 'high' ? 'border-orange-500' :
                        vuln.severity === 'medium' ? 'border-yellow-500' : 'border-emerald-600'
                      }`}>
                         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                            <div className="flex items-center gap-4">
                               <span className={`px-3 py-1 flex items-center gap-2 rounded-sm text-[10px] font-black uppercase tracking-widest border ${getSeverityColor(vuln.severity)}`}>
                                  {getTypeIcon(vuln.type)} {vuln.severity}
                               </span>
                               <span className="text-emerald-500 font-mono font-bold text-sm tracking-tight">{vuln.id}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-mono">
                               <span className="text-emerald-900/50 uppercase">Package:</span>
                               <span className="text-emerald-400 bg-emerald-950/30 px-2 py-0.5 rounded">{vuln.package}</span>
                               <span className="text-emerald-900/50 mx-1">/</span>
                               <span className="text-emerald-500/70">{vuln.version}</span>
                               <span className="text-emerald-900/50 mx-1">→</span>
                               <span className="text-emerald-400 font-bold underline decoration-emerald-500/30">{vuln.fixed_version}</span>
                            </div>
                         </div>
                         <p className="text-[12px] text-emerald-400/90 font-hacker leading-relaxed uppercase tracking-wide border-t border-emerald-900/10 pt-4 mt-2">
                            {vuln.description}
                         </p>
                      </div>
                    ))}
                 </div>
               )}
            </SectionCard>
         </div>
      </div>
    </div>
  );
}

