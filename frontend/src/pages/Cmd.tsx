import { useState, useEffect } from 'react';
import { Terminal, Copy, Plus, X, Trash2, Code2, ShieldAlert, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BackTrackLoading, CRTScreen } from '../components/ui';

export default function Cmd() {
  const [shortcuts, setShortcuts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [outputStates, setOutputStates] = useState<Record<string, { stdout: string, stderr: string, executing: boolean }>>({});
  
  // Add Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newShortcut, setNewShortcut] = useState({ label: '', cmd: '' });
  
  const navigate = useNavigate();

  const fetchShortcuts = async () => {
    try {
      const res = await fetch('/api/shortcuts');
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setShortcuts(data);
    } catch (err) {
      console.error(err);
      navigate('/login');
    } finally {
      if (loading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchShortcuts();
  }, [navigate]);

  const handleRun = async (id: string) => {
    // Reset output and show loading
    setOutputStates(prev => ({ 
      ...prev, 
      [id]: { stdout: '', stderr: '', executing: true } 
    }));

    try {
      const res = await fetch(`/api/shortcuts/${id}/run`, { method: 'POST' });
      const data = await res.json();
      setOutputStates(prev => ({ 
         ...prev, 
         [id]: { 
            stdout: data.stdout || (data.ok ? 'Executed successfully.' : ''), 
            stderr: data.stderr || '', 
            executing: false 
         } 
      }));
    } catch (err: any) {
      setOutputStates(prev => ({ 
         ...prev, 
         [id]: { stdout: '', stderr: err.message || 'Network error', executing: false } 
      }));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eintrag löschen?')) return;
    try {
      const res = await fetch(`/api/shortcuts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setShortcuts(prev => prev.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShortcut.label.trim() || !newShortcut.cmd.trim()) return;
    
    try {
      const res = await fetch('/api/shortcuts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newShortcut, icon: 'terminal' })
      });
      if (res.ok) {
        setAddModalOpen(false);
        setNewShortcut({ label: '', cmd: '' });
        fetchShortcuts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="w-full min-h-screen bg-black flex items-center justify-center">
      <BackTrackLoading label="Initializing_Bash_Interface..." />
    </div>
  );

  return (
    <div className="w-full flex flex-col gap-8 pb-32 animate-fade-in relative bg-transparent">
      {/* Decorative background scanning line */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-10">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-emerald-600 animate-[scan-vertical_10s_linear_infinite]" />
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 glass-panel p-8 rounded-3xl border border-emerald-600/10 shadow-2xl relative z-10 overflow-hidden">
         <div className="absolute inset-0 scan-overlay opacity-10 pointer-events-none" />
         <div className="flex items-center gap-6 relative z-10">
            <div className="p-4 rounded-2xl bg-emerald-600/10 border border-emerald-600/20 glow-emerald shadow-2xl holo-icon group relative overflow-hidden">
               <div className="absolute inset-0 scan-overlay opacity-30" />
               <Terminal className="w-10 h-10 text-emerald-500 relative z-10 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div>
               <div className="flex items-center gap-2 mb-1">
                  <div className="h-[1px] w-6 bg-emerald-600/50" />
                  <span className="text-[8px] font-black text-emerald-900 uppercase tracking-[0.6em]">Interface_Node: BASH-CORE</span>
               </div>
               <h2 className="text-2xl sm:text-4xl font-black text-emerald-500 tracking-tighter uppercase italic flex items-center gap-4 drop-shadow-[0_0_20px_rgba(204,0,0,0.3)]">
                 Remote<span className="text-emerald-600 font-outline-1">_Execution</span>
               </h2>
               <p className="text-[10px] text-emerald-900 font-black uppercase tracking-[0.4em] mt-2 opacity-70">Low-Level Payload Injection Hub</p>
            </div>
         </div>
         <button 
            onClick={() => setAddModalOpen(true)}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-black font-black py-4 px-8 rounded-2xl transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest shadow-xl glow-emerald relative z-10 active:scale-95"
          >
            <Plus className="w-5 h-5" /> <span>Deploy Sequence</span>
         </button>
      </div>

      {/* Grid of Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
         {shortcuts.map((sc) => {
            const out = outputStates[sc.id] || { stdout: '', stderr: '', executing: false };
            const hasOutput = out.stdout || out.stderr || out.executing;
            
            return (
               <div key={sc.id} className="bg-black/40 border border-emerald-900/20 rounded-2xl overflow-hidden shadow-2xl flex flex-col group relative reactive-border hover:border-emerald-600/40 transition-all">
                  <div className="absolute inset-0 scan-overlay opacity-5 pointer-events-none" />
                  
                  <motion.div 
                     layout
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     className="p-6 flex-1 relative z-10"
                   >
                      <div className="flex justify-between items-start mb-6">
                         <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-600/5 rounded-xl text-emerald-500 border border-emerald-600/20 shadow-inner holo-icon relative overflow-hidden">
                               <div className="absolute inset-0 scan-overlay opacity-20" />
                               <Code2 className="w-6 h-6 relative z-10" />
                            </div>
                            <div>
                               <h3 className="font-black text-emerald-500 tracking-tight uppercase">{sc.label}</h3>
                               <div className="flex items-center gap-2 mt-1">
                                  <div className="status-dots">
                                     <div className="status-dot active" />
                                  </div>
                                  <span className="text-[8px] text-emerald-900 font-black uppercase tracking-widest">Protocol_Active</span>
                               </div>
                            </div>
                         </div>
                         <button onClick={() => handleDelete(sc.id)} className="text-emerald-900 hover:text-emerald-500 transition-colors bg-emerald-600/5 p-2 rounded-lg hover:bg-emerald-600/10">
                            <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                      
                      <div className="bg-black/60 rounded-xl p-4 text-emerald-400 font-mono text-[11px] border border-emerald-900/30 mb-6 overflow-x-auto whitespace-nowrap scrollbar-hide shadow-inner">
                         <span className="text-emerald-600 mr-2 opacity-50">$</span>{sc.cmd}
                      </div>

                      <button 
                         onClick={() => handleRun(sc.id)}
                         disabled={out.executing}
                         className={`w-full py-4 rounded-xl border font-mono text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-lg ${
                            out.executing 
                            ? 'bg-emerald-900/20 text-emerald-500 border-emerald-600/20 animate-pulse' 
                            : 'bg-emerald-600 text-black border-none hover:bg-emerald-500 active:scale-95 glow-emerald'
                         }`}
                      >
                         {out.executing ? 'RUNNING_SEQUENCE...' : 'EXECUTE_PAYLOAD'}
                      </button>
                   </motion.div>

                  {/* Terminal Output Layer */}
                  {hasOutput && (
                      <div className="bg-[#050505] p-2 border-t border-emerald-900/20 font-mono text-[11px] leading-relaxed relative max-h-64 overflow-hidden">
                         <CRTScreen>
                            <div className="p-6 overflow-y-auto custom-scrollbar max-h-48">
                               <button onClick={() => setOutputStates(p => { const np={...p}; delete np[sc.id]; return np; })} className="absolute top-4 right-4 p-1.5 text-emerald-900/70 hover:text-emerald-400 bg-black/40 rounded-lg z-20">
                                  <X className="w-3.5 h-3.5" />
                               </button>

                               {out.executing && <div className="text-emerald-500 animate-pulse flex items-center gap-3"><div className="w-2 h-4 bg-emerald-600"></div> Initializing Remote Uplink...</div>}
                               
                               {!out.executing && out.stdout && (
                                  <div className="whitespace-pre-wrap text-emerald-400 drop-shadow-[0_0_2px_rgba(16,185,129,0.8)]">
                                     {out.stdout}
                                  </div>
                                )}
                               {!out.executing && out.stderr && (
                                  <div className="whitespace-pre-wrap text-emerald-500 mt-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex gap-3">
                                     <ShieldAlert className="w-4 h-4 shrink-0" />
                                     <div className="flex-1 drop-shadow-[0_0_2px_rgba(244,63,94,0.8)] break-all">{out.stderr}</div>
                                  </div>
                               )}
                               {!out.executing && (
                                  <div className="mt-4 text-emerald-900 flex items-center gap-3">
                                     <div className="w-2 h-4 bg-gray-700 animate-pulse"></div> sequence finished
                                  </div>
                               )}
                            </div>
                         </CRTScreen>
                      </div>
                   )}
               </div>
            );
         })}
         
         {shortcuts.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-2xl text-emerald-900/70 font-mono">
               <Copy className="w-8 h-8 mb-4 opacity-50" />
               <p>Keine Shortcuts konfiguriert.</p>
            </div>
         )}
      </div>

      {/* Add Shortcut Modal */}
      {addModalOpen && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0b0f12] border border-gray-800 w-full max-w-lg rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.1)] overflow-hidden flex flex-col">
               <div className="border-b border-gray-800/80 p-5 flex justify-between items-center bg-gray-900/40">
                  <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                     <Terminal className="w-5 h-5 text-emerald-500" /> New Bash Sequence
                  </h3>
                  <button onClick={() => setAddModalOpen(false)} className="text-emerald-900/70 hover:text-emerald-400 transition-colors">
                     <X className="w-5 h-5" />
                  </button>
               </div>
               
               <form onSubmit={handleAdd} className="p-6 flex flex-col gap-6">
                  <div>
                     <label className="text-xs font-bold text-emerald-900/70 uppercase tracking-widest mb-1.5 block">Label / Alias</label>
                     <input 
                       autoFocus
                       required
                       value={newShortcut.label}
                       onChange={e => setNewShortcut({...newShortcut, label: e.target.value})}
                       className="w-full bg-gray-950/50 border border-gray-800 rounded-lg py-3 px-4 text-emerald-400 placeholder-gray-600 focus:outline-none focus:border-emerald-600/50 transition-colors font-mono"
                       placeholder="z.B. Update System"
                     />
                  </div>
                  <div>
                     <label className="text-xs font-bold text-emerald-900/70 uppercase tracking-widest mb-1.5 block">Native Bash Command</label>
                     <textarea 
                       required
                       rows={3}
                       value={newShortcut.cmd}
                       onChange={e => setNewShortcut({...newShortcut, cmd: e.target.value})}
                       className="w-full bg-gray-950/50 border border-gray-800 rounded-lg py-3 px-4 text-emerald-400 placeholder-gray-600 focus:outline-none focus:border-emerald-600/50 transition-colors font-mono resize-none leading-relaxed"
                       placeholder="sudo apt update && sudo apt upgrade -y"
                     />
                  </div>
                  
                  <div className="pt-2 flex justify-end gap-3 mt-2">
                     <button type="button" onClick={() => setAddModalOpen(false)} className="px-5 py-2.5 rounded-lg font-medium text-emerald-400 hover:bg-gray-800 transition-colors text-sm">
                        Cancel
                     </button>
                     <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-400 text-gray-950 font-bold rounded-lg transition-colors text-sm shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                        Save Payload
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
}
