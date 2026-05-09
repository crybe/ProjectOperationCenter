import { useState, useEffect } from 'react';
import { Zap, Key, Activity, Clock, Server, Trash2, ShieldAlert, Cpu, BarChart3, Globe, Users, UserPlus, UserMinus, UserCheck, UserX, ShieldCheck } from 'lucide-react';
import { SectionCard, SkeletonCard } from '../components/ui';
import { useApi } from '../hooks/useApi';
import ModuleBadge from '../components/ModuleBadge';

export default function ShinraAdmin() {
  const apiFetch = useApi();
  const [logs, setLogs] = useState<any[]>([]);
  const [keys, setKeys] = useState<any[]>([]);
  const [securityIps, setSecurityIps] = useState<{banned: any[], whitelisted: string[]}>({banned: [], whitelisted: []});
  const [users, setUsers] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'operator' });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, errors: 0, uptime: '99.9%' });

  const loadData = async () => {
    try {
      const [logsRes, keysRes, ipsRes, usersRes] = await Promise.all([
        apiFetch('/api/nexus/logs'),
        apiFetch('/api/nexus/keys'),
        apiFetch('/api/system/security/ips'),
        apiFetch('/api/system/users')
      ]);
      const currentLogs = logsRes?.logs || [];
      setLogs(currentLogs);
      setKeys(keysRes?.keys || []);
      setSecurityIps(ipsRes || {banned: [], whitelisted: []});
      setUsers(usersRes?.users || []);
      
      // Calculate mini-stats
      const errors = currentLogs.filter((l: any) => l.status >= 400).length;
      setStats({
        total: currentLogs.length,
        errors: errors,
        uptime: '99.9%'
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const t = setInterval(loadData, 10000);
    return () => clearInterval(t);
  }, []);

  const generateKey = async () => {
    const name = prompt("Enter service name for new API Key:");
    if (!name) return;
    try {
      await apiFetch('/api/nexus/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      loadData();
    } catch (e: any) {
      alert("Failed to generate key: " + e.message);
    }
  };

  const deleteKey = async (id: string) => {
    if (!confirm("De-authorize this security token?")) return;
    try {
      await apiFetch(`/api/nexus/keys/${id}`, { method: 'DELETE' });
      loadData();
    } catch (e: any) {
      alert("Deletion failed: " + e.message);
    }
  };

  const handleSecurityAction = async (action: 'unban' | 'whitelist', ip: string) => {
    try {
      await apiFetch('/api/system/security/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ip })
      });
      loadData();
    } catch (e: any) {
      alert("Action failed: " + e.message);
    }
  };

  const handleAddUser = async () => {
    try {
      await apiFetch('/api/system/users/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      setNewUser({ username: '', password: '', role: 'operator' });
      loadData();
    } catch (e: any) {
      alert("Failed to add user: " + e.message);
    }
  };

  const handleUserAction = async (id: number, action: 'toggle_active' | 'delete') => {
    try {
      await apiFetch('/api/system/users/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action })
      });
      loadData();
    } catch (e: any) {
      alert("Action failed: " + e.message);
    }
  };

  const manualWhitelist = () => {
    const ip = prompt("Enter IP to whitelist:");
    if (ip) handleSecurityAction('whitelist', ip);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'POST': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5';
      case 'GET': return 'text-blue-400 border-blue-500/30 bg-blue-500/5';
      case 'DELETE': return 'text-rose-400 border-rose-500/30 bg-rose-500/5';
      case 'PUT': return 'text-amber-400 border-amber-500/30 bg-amber-500/5';
      default: return 'text-zinc-400 border-zinc-500/30 bg-zinc-500/5';
    }
  };

  return (
    <div className="w-full min-h-screen pb-48 animate-fade-in space-y-16 relative overflow-hidden">
      {/* Tactical Scanline Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,118,0.06))] bg-[length:100%_4px,3px_100%]" />

      {/* Header with Telemetry HUD */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-12 mb-8 p-8 glass-card border-l-4 border-emerald-500 bg-emerald-950/5">
        <div className="flex items-center gap-8">
           <div className="p-4 rounded-3xl bg-emerald-600/10 border border-emerald-500/30 glow-emerald shadow-2xl group relative overflow-hidden">
              <Zap className="w-12 h-12 text-emerald-500 group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-emerald-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
           </div>
           <div>
              <h2 className="text-6xl font-black text-white tracking-tighter uppercase italic flex items-center gap-6">
                Shinra<span className="text-emerald-500 font-hacker">_Admin</span>
                <ModuleBadge status="TACTICAL" className="scale-75 origin-left" />
              </h2>
              <div className="flex items-center gap-4 mt-2">
                <p className="text-[11px] text-emerald-500/70 font-black uppercase tracking-[0.6em]">Nexus Protocol Control Node</p>
                <div className="h-px w-24 bg-emerald-900/40" />
                <span className="text-[9px] font-mono text-emerald-900 flex items-center gap-2">
                  <Activity className="w-3 h-3 animate-pulse" /> LINK_ESTABLISHED_084
                </span>
              </div>
           </div>
        </div>

        {/* Telemetry Ribbon */}
        <div className="grid grid-cols-3 gap-12 px-10 py-4 border-l border-emerald-900/30">
           <div className="space-y-1">
              <div className="text-[9px] font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2">
                <Globe className="w-3 h-3" /> Total_Traffic
              </div>
              <div className="text-2xl font-black text-emerald-500 font-mono tracking-tighter">{stats.total} <span className="text-[10px] text-emerald-900 font-normal">REQ/10M</span></div>
           </div>
           <div className="space-y-1">
              <div className="text-[9px] font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert className="w-3 h-3" /> Anomalies
              </div>
              <div className="text-2xl font-black text-rose-600 font-mono tracking-tighter">{stats.errors} <span className="text-[10px] text-emerald-900 font-normal">DET</span></div>
           </div>
           <div className="space-y-1">
              <div className="text-[9px] font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2">
                <Cpu className="w-3 h-3" /> Integrity
              </div>
              <div className="text-2xl font-black text-emerald-200 font-mono tracking-tighter">{stats.uptime}</div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
         {/* Request Stream */}
         <div className="lg:col-span-8">
            <SectionCard title="Live_Command_Intercept" icon={Activity} delay={1}>
               <div className="mb-4 flex justify-between items-center border-b border-emerald-900/20 pb-4">
                  <div className="text-[9px] font-hacker text-emerald-900 uppercase tracking-[0.3em]">Monitoring Encrypted Webhook Traffic...</div>
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <div className="text-[9px] text-emerald-500 font-black">STREAM_ACTIVE</div>
                  </div>
               </div>

               {loading ? (
                 <SkeletonCard />
               ) : logs.length === 0 ? (
                 <div className="py-24 text-center">
                    <BarChart3 className="w-12 h-12 text-emerald-900/20 mx-auto mb-4" />
                    <div className="text-emerald-900 font-black uppercase text-[11px] tracking-widest">Awaiting Strategic Signal...</div>
                 </div>
               ) : (
                 <div className="space-y-5">
                    {logs.map((log, i) => (
                      <div key={i} className="group relative flex items-center gap-8 p-5 glass-card bg-black/50 border-l-2 border-emerald-900/50 hover:border-emerald-500 hover:bg-emerald-500/[0.03] transition-all duration-300 overflow-hidden">
                         {/* Subtle Background Glow on Hover */}
                         <div className="absolute inset-y-0 left-0 w-64 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                         
                         <div className={`w-14 h-10 flex items-center justify-center text-[11px] font-black tracking-widest rounded-lg border-2 uppercase transition-colors ${log.status >= 400 ? 'border-rose-500/40 bg-rose-500/10 text-rose-500' : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400'}`}>
                            {log.status}
                         </div>
                         
                         <div className="flex-1 flex flex-col gap-2 relative">
                            <div className="flex items-center gap-4">
                               <span className={`px-2 py-0.5 text-[9px] font-black border rounded ${getMethodColor(log.method)}`}>
                                 {log.method}
                               </span>
                               <span className="text-[14px] font-mono text-emerald-200 tracking-tight">{log.path}</span>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] text-emerald-900 font-hacker uppercase tracking-widest">
                               <span className="text-emerald-600/60 font-black">SOURCE:</span> {log.ip}
                               <div className="w-1 h-1 rounded-full bg-emerald-900" />
                               <span className="text-emerald-600/60 font-black">AGENT:</span> {log.agent}
                            </div>
                         </div>

                         <div className="flex flex-col items-end gap-2 relative">
                            <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-mono font-black">
                               <Clock className="w-4 h-4 opacity-50" /> {log.time}
                            </div>
                            <div className="px-2 py-0.5 border border-emerald-900/30 text-[8px] text-emerald-900 font-black uppercase tracking-widest bg-black/40">
                               SECURED_BY_SHINRA
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
               )}
            </SectionCard>
            
            <SectionCard title="User_Matrix" icon={Users} delay={2}>
              <div className="space-y-6">
                <div className="p-6 glass-card border border-emerald-500/10 bg-emerald-500/5 rounded-2xl mb-8">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input 
                      type="text" 
                      placeholder="Username" 
                      className="bg-black/40 border border-emerald-900/30 rounded-xl px-4 py-2 text-[11px] text-emerald-200 focus:border-emerald-500 outline-none flex-1"
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    />
                    <input 
                      type="password" 
                      placeholder="Password" 
                      className="bg-black/40 border border-emerald-900/30 rounded-xl px-4 py-2 text-[11px] text-emerald-200 focus:border-emerald-500 outline-none flex-1"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    />
                    <select 
                      className="bg-black/40 border border-emerald-900/30 rounded-xl px-4 py-2 text-[11px] text-emerald-200 focus:border-emerald-500 outline-none"
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    >
                      <option value="operator">Operator</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button 
                      onClick={handleAddUser}
                      className="p-2 bg-emerald-500 text-black rounded-xl hover:bg-emerald-400 transition-all flex items-center justify-center min-w-[48px]"
                    >
                      <UserPlus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {users.map((u: any) => (
                    <div key={u.id} className="flex items-center justify-between p-4 glass-card border border-emerald-900/20 hover:border-emerald-500/30 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${u.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          {u.role === 'admin' ? <ShieldAlert className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-[12px] font-black text-emerald-200 uppercase tracking-tighter">{u.username}</p>
                          <p className="text-[8px] text-emerald-900/60 font-mono uppercase">{u.role} | Active: {u.is_active ? 'YES' : 'NO'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleUserAction(u.id, 'toggle_active')}
                          className={`p-2 rounded-lg transition-all ${u.is_active ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black'}`}
                        >
                          {u.is_active ? <UserMinus className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => handleUserAction(u.id, 'delete')}
                          className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-black transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
         </div>

         {/* Security Keys */}
         <div className="lg:col-span-4 space-y-16">
            <SectionCard title="Strategic_Tokens" icon={Key} delay={2}>
               <div className="relative group">
                 <button onClick={generateKey} className="w-full mb-8 py-4 glass-card bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 text-[11px] font-black uppercase tracking-[0.3em] hover:bg-emerald-600 hover:text-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
                   + Authorize New Service
                 </button>
                 <div className="absolute inset-0 bg-emerald-500/20 blur-xl opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none" />
               </div>
               
               {keys.length === 0 ? (
                 <div className="p-12 text-center border-2 border-dashed border-emerald-900/20 rounded-2xl">
                    <ShieldAlert className="w-10 h-10 text-emerald-900/30 mx-auto mb-4" />
                    <p className="text-[10px] text-emerald-900 font-black uppercase tracking-widest">No Active Authorizations</p>
                 </div>
               ) : (
                 <div className="space-y-6">
                    {keys.map(k => (
                      <div key={k.id} className="p-5 bg-emerald-950/10 border border-emerald-900/30 glass-card relative group hover:border-emerald-500/40 transition-all duration-300">
                         <div className="flex justify-between items-start mb-4">
                            <div className="flex flex-col gap-1">
                               <span className="text-[12px] font-black text-emerald-500 uppercase tracking-widest">{k.name}</span>
                               <span className="text-[10px] font-mono text-emerald-900/60">ID: {k.id}</span>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button 
                                 onClick={() => deleteKey(k.id)}
                                 className="p-2 bg-rose-900/20 text-rose-500 rounded border border-rose-500/30 hover:bg-rose-500 hover:text-white transition-all"
                                 title="Revoke Token"
                               >
                                 <Trash2 className="w-4 h-4" />
                               </button>
                            </div>
                         </div>
                         
                         <div className="flex items-center gap-3 p-3 bg-black/60 border border-emerald-900/50 rounded-lg">
                            <Server className="w-4 h-4 text-emerald-700" />
                            <span className="flex-1 text-[11px] text-emerald-500 font-mono blur-[3px] group-hover:blur-none transition-all duration-500 select-all cursor-copy">
                              {k.key}
                            </span>
                         </div>
                      </div>
                    ))}
                 </div>
               )}
            </SectionCard>

            <SectionCard title="IP_Defense_Control" icon={ShieldAlert} delay={3}>
               <div className="space-y-8">
                  <button onClick={manualWhitelist} className="w-full py-4 glass-card border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/10 transition-all">
                    + Add IP Whitelist
                  </button>

                  <div className="space-y-4">
                     <h4 className="text-[9px] font-black text-emerald-900 uppercase tracking-[0.4em] mb-4">Banned_Entities</h4>
                     {securityIps.banned.length === 0 ? (
                        <p className="text-[10px] text-emerald-900/40 italic">No IPs currently restricted.</p>
                     ) : (
                        securityIps.banned.map(ip => (
                           <div key={ip} className="flex items-center justify-between p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl group">
                              <span className="text-[11px] font-mono text-rose-500">{ip}</span>
                              <div className="flex gap-2">
                                 <button onClick={() => handleSecurityAction('whitelist', ip)} className="p-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-md hover:bg-emerald-500 hover:text-black transition-all">
                                    <Globe className="w-3.5 h-3.5" />
                                 </button>
                                 <button onClick={() => handleSecurityAction('unban', ip)} className="p-1.5 bg-rose-500/20 text-rose-500 border border-rose-500/30 rounded-md hover:bg-rose-500 hover:text-white transition-all">
                                    <Trash2 className="w-3.5 h-3.5" />
                                 </button>
                              </div>
                           </div>
                        ))
                     )}
                  </div>

                  <div className="space-y-4 pt-4 border-t border-emerald-900/10">
                     <h4 className="text-[9px] font-black text-emerald-900 uppercase tracking-[0.4em] mb-4">Whitelisted_Nodes</h4>
                     <div className="flex flex-wrap gap-2">
                        {securityIps.whitelisted.map(ip => (
                           <span key={ip} className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[9px] font-mono text-emerald-500">
                              {ip}
                           </span>
                        ))}
                     </div>
                  </div>
               </div>
            </SectionCard>

            {/* Decorative Tactical Element */}
            <div className="p-8 glass-card border border-emerald-500/20 bg-emerald-950/10 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                  <ShieldAlert className="w-24 h-24 text-emerald-500" />
               </div>
               <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Protocol_Directive</h4>
               <p className="text-[9px] text-emerald-900 font-hacker leading-relaxed">
                 All Nexus traffic is filtered through Shinra Layer-7 interception. 
                 Strategic keys are encrypted using AES-256-GCM. 
                 Any anomaly will trigger a Sentinel lockdown.
               </p>
               <div className="mt-4 flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8px] font-black text-emerald-700 uppercase">Strategic_Guardian_Active</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
