import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Calendar, Cpu, FileCode2, X, Box, GitCommit, GitBranch, FileText,
  CheckCircle2, Loader2, ChevronDown, ChevronRight, Sparkles, Check, Ban,
  AlertTriangle, Code2, Layers, Clock, ArrowRight, Target, Layout as LayoutIcon,
  RefreshCw, Trash2, Smartphone, Terminal, History, Workflow
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, useToast } from '../components/Toast';
import { useApi } from '../hooks/useApi';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionCard, Skeleton, StatusBadge, BackTrackLoading, Sparkline, CRTScreen } from '../components/ui';

const COLUMNS = ['offen', 'in-arbeit', 'review', 'erledigt'];

const COL_CONFIG: any = {
  'offen': { label: 'Backlog', icon: Target, color: 'text-emerald-400', border: 'border-emerald-900/30', glow: '' },
  'in-arbeit': { label: 'In Execution', icon: Activity, color: 'text-cyan-400', border: 'border-cyan-500/30', glow: 'glow-cyan' },
  'review': { label: 'Quality Gates', icon: Sparkles, color: 'text-purple-400', border: 'border-purple-500/30', glow: 'glow-purple' },
  'erledigt': { label: 'Deployed', icon: CheckCircle2, color: 'text-emerald-400', border: 'border-emerald-600/30', glow: 'glow-emerald' },
};

// ── Shared UI: Activity Icon ────────────────────────────────────────────────
function Activity({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

// ── Shared UI: Diff Viewer ──────────────────────────────────────────────────
function DiffViewer({ diff }: { diff: string }) {
  if (!diff) return null;
  const lines = diff.split('\n');
  return (
    <CRTScreen>
      <div className="font-mono text-[10px] leading-relaxed bg-black/40 overflow-auto max-h-96 p-6 scrollbar-hide">
        {lines.map((line, i) => {
          let cls = 'text-emerald-900/70';
          if (line.startsWith('+++') || line.startsWith('---')) cls = 'text-emerald-400 font-bold';
          else if (line.startsWith('+')) cls = 'text-emerald-400 bg-emerald-600/5 px-1 rounded';
          else if (line.startsWith('-')) cls = 'text-emerald-500 bg-emerald-500/5 px-1 rounded';
          else if (line.startsWith('@@')) cls = 'text-cyan-400 bg-cyan-500/5';
          return <div key={i} className={`whitespace-pre mb-0.5 ${cls}`}>{line || ' '}</div>;
        })}
      </div>
    </CRTScreen>
  );
}

// ── Shared UI: Commit Card (Server Changes) ──────────────────────────────────
function CommitCard({ commit, onCreateProject }: { commit: any; onCreateProject: (c: any) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [diffData, setDiffData] = useState<any>(null);
  const [loadingDiff, setLoadingDiff] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadDiff = async () => {
    if (diffData) { setExpanded(!expanded); return; }
    setExpanded(true); setLoadingDiff(true);
    try {
      const res = await fetch(`/api/git/diff/${commit.hash}`);
      const d = await res.json();
      if (d.ok) setDiffData(d);
    } finally { setLoadingDiff(false); }
  };

  const handleCreate = async () => {
    if (commit.has_project) return;
    setCreating(true);
    try {
      await fetch('/api/git/create-project', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash: commit.hash, subject: commit.subject, date: commit.date, files: diffData?.files || [], diff: diffData?.diff || '' }),
      });
      onCreateProject(commit);
    } finally { setCreating(false); }
  };

  return (
    <div className="glass-panel border-flow rounded-2xl overflow-hidden transition-all hover:bg-white/[0.05] animate-fade-in mb-4">
      <div className="p-5 flex items-center gap-4">
        <div className="p-3 bg-emerald-600/10 text-emerald-500 rounded-xl border border-emerald-600/20"><GitCommit className="w-5 h-5 glow-emerald" /></div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-emerald-500 truncate tracking-tight">{commit.subject}</p>
          <div className="flex items-center gap-3 mt-1 text-[9px] text-emerald-900/70 font-black uppercase tracking-[0.2em]">
            <span className="text-emerald-500 font-mono">{commit.short}</span>
            <span>{commit.date}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {commit.has_project ? (
            <span className="px-3 py-1 rounded-lg bg-emerald-600/10 text-emerald-400 text-[9px] font-black uppercase tracking-widest border border-emerald-600/30 glow-emerald">Linked</span>
          ) : (
            <button onClick={handleCreate} disabled={creating || !diffData} className="px-4 py-2 rounded-lg bg-emerald-600 text-emerald-950 text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-30 glow-emerald">
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Instantiate'}
            </button>
          )}
          <button onClick={loadDiff} className="p-2.5 rounded-lg glass-panel text-emerald-400 hover:text-emerald-500 transition-all">
            {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="p-6 border-t border-emerald-900/20 bg-black/40 space-y-4 animate-in slide-in-from-top-2 duration-300">
          {loadingDiff ? <Skeleton className="h-20 w-full" /> : (
            <>
              <div className="flex flex-wrap gap-2">
                {diffData?.files?.map((f: any, i: number) => <span key={i} className="px-2 py-1 rounded bg-emerald-950/10 text-[9px] font-mono text-emerald-400 border border-emerald-900/20">{f}</span>)}
              </div>
              <DiffViewer diff={diffData?.diff} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Board() {
  const apiFetch = useApi();
  const [projects, setProjects] = useState<any[]>([]);
  const [activePid, setActivePid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'board' | 'changes'>('board');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [commits, setCommits] = useState<any[]>([]);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);

  const { toast, toasts, remove } = useToast();
  const navigate = useNavigate();

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
      if (data.length > 0 && !activePid) setActivePid(data[0].id);
    } catch { navigate('/login'); }
    finally { setLoading(false); }
  }, [navigate, activePid]);

  const fetchCommits = useCallback(async () => {
    setLoadingCommits(true);
    try {
      const res = await fetch('/api/git/log');
      const d = await res.json();
      if (d.ok) setCommits(d.commits);
    } finally { setLoadingCommits(false); }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);
  useEffect(() => { if (tab === 'changes') fetchCommits(); }, [tab, fetchCommits]);

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const tid = e.dataTransfer.getData('taskId');
    if (!tid || !activePid) return;
    await fetch(`/project/${activePid}/task/${tid}/move`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ status: newStatus }) 
    });
    fetchProjects();
  };

  const activeProject = projects.find(p => p.id === activePid);

  if (loading) return (
    <div className="w-full min-h-screen bg-black flex items-center justify-center">
      <BackTrackLoading label="Accessing_Strategic_Core..." />
    </div>
  );

  return (
    <div className="w-full space-y-12 pb-32 animate-fade-in relative bg-transparent">
      {/* Decorative background scanning line */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-10">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-emerald-600 animate-[scan-vertical_10s_linear_infinite]" />
      </div>

      {/* Header & Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 relative z-10">
        <div className="space-y-6">
          <div className="flex items-center gap-6">
             <div className="p-4 rounded-3xl bg-emerald-600/10 border border-emerald-600/20 glow-emerald shadow-2xl holo-icon relative overflow-hidden group">
                <div className="absolute inset-0 scan-overlay opacity-30" />
                <LayoutIcon className="text-emerald-500 w-12 h-12 relative z-10 group-hover:scale-110 transition-transform duration-500" />
             </div>
             <div>
                <div className="flex items-center gap-2 mb-1">
                   <div className="h-[1px] w-8 bg-emerald-600/50" />
                   <span className="text-[8px] font-black text-emerald-900 uppercase tracking-[0.8em]">Operations_Node: STRAT-01</span>
                </div>
                <h2 className="text-3xl sm:text-6xl font-black text-emerald-500 tracking-tighter uppercase italic flex items-center gap-4 drop-shadow-[0_0_20px_rgba(204,0,0,0.3)]">
                  Strategic<span className="text-emerald-600 font-outline-1">_Board</span>
                </h2>
                <p className="text-[10px] text-emerald-900 font-black uppercase tracking-[0.6em] mt-3 opacity-70">Multi-Domain Operations Controller</p>
             </div>
          </div>
          <div className="flex p-1.5 glass-panel border-emerald-600/10 rounded-2xl w-full sm:w-fit shadow-2xl">
             <button onClick={() => setTab('board')} className={`flex-1 sm:flex-none px-4 sm:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'board' ? 'bg-emerald-600/10 text-emerald-500 border border-emerald-600/30 glow-emerald' : 'text-emerald-900/70 hover:text-emerald-500 border-transparent'}`}>Modules</button>
             <button onClick={() => setTab('changes')} className={`flex-1 sm:flex-none px-4 sm:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'changes' ? 'bg-emerald-600/10 text-emerald-500 border border-emerald-600/30 glow-emerald' : 'text-emerald-900/70 hover:text-emerald-500 border-transparent'}`}>Server Flow</button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button 
            disabled={diagnosing}
            onClick={async () => {
              setDiagnosing(true);
              try {
                const res = await fetch('/api/ki/auto-diagnose', { method: 'POST' });
                const d = await res.json();
                if (d.ok) { 
                  toast('success', `${d.count} KI-Vorschläge erstellt`); 
                  fetchProjects(); 
                } else {
                  toast('error', d.error || 'Scan fehlgeschlagen');
                }
              } catch (e) {
                toast('error', 'Netzwerkfehler beim Scan');
              } finally { setDiagnosing(false); }
            }} 
            className={`px-6 py-3 glass-panel border-purple-500/30 text-purple-400 font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center gap-3 transition-all shadow-2xl ${diagnosing ? 'opacity-50' : 'hover:bg-purple-500/10'}`}
          >
            {diagnosing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing System...</>
            ) : (
              <><Sparkles className="w-4 h-4 glow-purple" /> Scan for Problems</>
            )}
          </button>

          {tab === 'board' && (
            <button onClick={() => setAddModalOpen(true)} className="px-8 py-3 bg-emerald-600 text-emerald-950 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl glow-emerald">
              <Plus className="w-5 h-5" /> Deploy Module
            </button>
          )}
        </div>
      </div>

      {tab === 'board' ? (
        <>
          {/* Project Selector Tabs */}
          <div className="flex flex-wrap gap-4">
            {projects.map(p => (
              <button key={p.id} onClick={() => setActivePid(p.id)} className={`relative px-6 py-4 rounded-2xl transition-all flex items-center gap-4 border-2 ${activePid === p.id ? 'glass-panel border-emerald-600/40 text-emerald-500 glow-emerald' : 'bg-emerald-950/10 border-transparent text-emerald-900/70 hover:text-emerald-500'}`}>
                <Box className={`w-4 h-4 ${activePid === p.id ? 'text-emerald-400' : 'text-emerald-900'}`} />
                <span className="text-[11px] font-black uppercase tracking-widest">{p.name}</span>
                {activePid === p.id && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-600 rounded-full glow-emerald" />}
              </button>
            ))}
          </div>

          {/* Kanban Board */}
          {activeProject && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
              {COLUMNS.map(col => {
                const tasks = activeProject.tasks?.filter((t: any) => t.status === col) || [];
                const cfg = COL_CONFIG[col];
                return (
                  <div key={col} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, col)} className={`flex flex-col rounded-[2.5rem] glass-panel min-h-[600px] transition-all border-t-4 ${cfg.border} relative overflow-hidden group`}>
                    {/* Column Header Glow */}
                    <div className={`absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-current opacity-5 pointer-events-none ${cfg.color}`} />
                    
                    <div className="p-8 border-b border-emerald-900/20 flex justify-between items-center relative z-10">
                      <div className="flex items-center gap-4">
                        <cfg.icon className={`w-5 h-5 ${cfg.color} ${cfg.glow}`} />
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400">{cfg.label}</h3>
                      </div>
                      <span className="text-[11px] font-mono font-black bg-emerald-950/10 px-3 py-1 rounded-lg text-emerald-900/70">{tasks.length}</span>
                    </div>

                    <div className="p-4 space-y-6 flex-1 relative z-10">
                      <AnimatePresence mode="popLayout">
                        {tasks.map((t: any) => (
                          <motion.div 
                            key={t.id} 
                            layout
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, x: -20 }}
                            draggable 
                            onDragStart={(e: any) => e.dataTransfer.setData('taskId', t.id)} 
                            onClick={() => setSelectedTask(t)} 
                            className="group relative p-6 bg-black/40 border border-emerald-900/20 rounded-[1.8rem] hover:border-emerald-600/40 hover:bg-white/[0.06] transition-all cursor-pointer reactive-border overflow-hidden"
                          >
                            <div className="absolute inset-0 scan-overlay opacity-5 pointer-events-none" />
                            <h4 className={`text-sm font-black text-emerald-500 mb-4 leading-tight tracking-tight relative z-10 ${col === 'erledigt' ? 'opacity-30 line-through' : ''}`}>{t.title}</h4>
                            
                            {/* Progress Indicator for In-Work */}
                            {col === 'in-arbeit' && (
                              <div className="mb-4 relative z-10">
                                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-cyan-400 mb-2"><span>Execution</span><span>{t.progress ?? 15}%</span></div>
                                <div className="h-1.5 w-full bg-emerald-950/10 rounded-full overflow-hidden shadow-inner">
                                  <motion.div 
                                    className="h-full bg-cyan-500 glow-cyan" 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${t.progress ?? 15}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                  />
                                </div>
                              </div>
                            )}

                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-emerald-900 relative z-10">
                               <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> {t.due_date || 'No Deadline'}</div>
                               <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400"><ArrowRight className="w-3 h-3" /> Info</div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      
                      {tasks.length === 0 && (
                        <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-emerald-900/10 rounded-[2rem] opacity-20 relative overflow-hidden">
                           <div className="absolute inset-x-0 top-0 h-[1px] bg-emerald-600 animate-[scan-vertical_4s_linear_infinite]" />
                           <History className="w-8 h-8 mb-3" />
                           <span className="text-[9px] font-black uppercase tracking-widest">Void Sector</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6 max-w-5xl">
          {loadingCommits ? <Skeleton className="h-64 w-full rounded-[2.5rem]" /> : commits.map(c => <CommitCard key={c.hash} commit={c} onCreateProject={() => { fetchProjects(); fetchCommits(); }} />)}
        </div>
      )}

      {selectedTask && <TaskDetailModal task={selectedTask} pid={activePid!} onClose={() => setSelectedTask(null)} onUpdate={fetchProjects} />}
      {addModalOpen && <AddModuleModal onClose={() => setAddModalOpen(false)} activePid={activePid!} onUpdate={fetchProjects} />}
      <ToastContainer toasts={toasts} remove={remove} />
    </div>
  );
}

// ── Modals (Internal) ────────────────────────────────────────────────────────

function TaskDetailModal({ task, pid, onClose, onUpdate }: any) {
  const [editTask, setEditTask] = useState({ ...task });
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/project/${pid}/task/${task.id}/edit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editTask) });
      if (res.ok) { onUpdate(); onClose(); }
    } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
      <div className="glass-panel border-emerald-600/20 w-full max-w-3xl rounded-[3rem] overflow-hidden animate-in zoom-in duration-500 hologram-overlay">
        <div className="p-8 border-b border-emerald-900/20 flex justify-between items-center bg-emerald-600/5">
          <div className="flex items-center gap-5">
            <div className="p-3 bg-emerald-600/10 text-emerald-500 rounded-2xl border border-emerald-600/20"><FileText className="w-6 h-6 glow-emerald" /></div>
            <div>
              <h3 className="text-2xl font-black text-emerald-500 tracking-tighter uppercase">Module Parameters</h3>
              <p className="text-[9px] text-emerald-900/70 font-black uppercase tracking-[0.3em] mt-1">Operational Data Entry</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 glass-panel rounded-2xl text-emerald-900/70 hover:text-emerald-400 transition-all"><X className="w-8 h-8" /></button>
        </div>
        <div className="p-10 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-emerald-900 tracking-widest ml-1">Mission Title</label>
            <input value={editTask.title} onChange={e => setEditTask({...editTask, title: e.target.value})} className="w-full glass-panel border-emerald-900/30 rounded-2xl p-5 text-emerald-500 font-black tracking-tight outline-none focus:border-emerald-600/40 text-lg shadow-inner" />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-emerald-900 tracking-widest ml-1">Blackbox Notes</label>
            <textarea rows={4} value={editTask.description || ''} onChange={e => setEditTask({...editTask, description: e.target.value})} className="w-full glass-panel border-emerald-900/30 rounded-2xl p-5 text-emerald-400 text-sm font-mono font-bold leading-relaxed outline-none shadow-inner" />
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-emerald-900 tracking-widest ml-1">Execution Status</label>
              <select value={editTask.status} onChange={e => setEditTask({...editTask, status: e.target.value})} className="w-full glass-panel border-emerald-900/30 rounded-2xl p-4 text-emerald-500 font-black uppercase tracking-widest outline-none bg-black/60 shadow-inner">{COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}</select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-emerald-900 tracking-widest ml-1">Target Date</label>
              <input type="date" value={editTask.due_date || ''} onChange={e => setEditTask({...editTask, due_date: e.target.value})} className="w-full glass-panel border-emerald-900/30 rounded-2xl p-4 text-emerald-500 font-mono font-black outline-none bg-black/60 shadow-inner [color-scheme:dark]" />
            </div>
          </div>
          {task.ai_patch && (
            <div className="space-y-5 p-8 glass-panel border-purple-500/20 bg-purple-500/5 rounded-3xl">
              <p className="text-[10px] font-black uppercase text-purple-400 tracking-[0.3em] flex items-center gap-3"><Sparkles className="w-4 h-4" /> AI Patch Proposition</p>
              <DiffViewer diff={task.ai_patch.content} />
            </div>
          )}
        </div>
        <div className="p-8 border-t border-emerald-900/20 bg-black/40 flex justify-end gap-6">
          <button onClick={onClose} className="px-8 py-3 text-emerald-900/70 font-black text-[11px] uppercase tracking-widest hover:text-emerald-500 transition-colors">Abbrechen</button>
          <button onClick={handleSave} disabled={saving} className="px-12 py-4 bg-emerald-600 text-emerald-950 font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:scale-105 transition-all shadow-2xl glow-emerald">{saving ? 'Processing...' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
}

function AddModuleModal({ onClose, activePid, onUpdate }: any) {
  const [newTask, setNewTask] = useState({ title: '', description: '', labels: '', due_date: '', status: 'offen' });
  const [scanning, setScanning] = useState(false);
  const handlePropose = async () => {
    if (!newTask.title.trim() || scanning) return;
    setScanning(true);
    try {
      const res = await fetch('/api/ki/propose-task', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ title: newTask.title, pid: activePid }) 
      });
      const d = await res.json();
      if (d.title) setNewTask({ ...newTask, title: d.title, description: d.description });
    } finally { setScanning(false); }
  };
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await fetch(`/project/${activePid}/task/add`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newTask) });
    onUpdate(); onClose();
  };
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
      <div className="glass-panel border-purple-500/20 w-full max-w-xl rounded-[3rem] overflow-hidden animate-in zoom-in duration-500 hologram-overlay">
        <div className="p-8 border-b border-emerald-900/20 bg-purple-500/10 flex justify-between items-center">
          <div className="flex items-center gap-5 text-purple-400">
            <div className="p-3 bg-purple-500/20 rounded-2xl border border-purple-500/30 shadow-lg"><Sparkles className="w-7 h-7 glow-purple" /></div>
            <div>
              <h3 className="text-2xl font-black text-emerald-500 tracking-tighter uppercase">Mission Objective</h3>
              <p className="text-[9px] text-purple-500/60 font-black uppercase tracking-[0.3em] mt-1">AI-Assisted Task Creation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-emerald-900/70 hover:text-emerald-500 transition-all"><X className="w-8 h-8" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-10 space-y-10">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-emerald-900 tracking-widest ml-1">Objective Title</label>
            <div className="flex gap-4">
              <input required value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} placeholder="z.B. API Refactoring..."
                     className="flex-1 glass-panel border-emerald-900/30 rounded-2xl p-5 text-emerald-500 font-black tracking-tight outline-none focus:border-purple-500/50 shadow-inner" />
              <button type="button" onClick={handlePropose} disabled={scanning} 
                      className="p-5 glass-panel border-purple-500/30 text-purple-400 rounded-2xl hover:bg-purple-500/20 transition-all shadow-xl">
                {scanning ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6 glow-purple" />}
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-emerald-900 tracking-widest ml-1">Strategic Description</label>
            <textarea rows={4} value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} placeholder="Beschreibe das Ziel dieses Moduls..."
                      className="w-full glass-panel border-emerald-900/30 rounded-2xl p-5 text-emerald-400 text-sm font-bold outline-none shadow-inner" />
          </div>
          <div className="flex gap-6 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 text-emerald-900/70 font-black text-[11px] uppercase tracking-widest hover:text-emerald-500 transition-colors">Abort</button>
            <button type="submit" className="flex-1 py-4 bg-emerald-600 text-emerald-950 font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl glow-emerald">Initialize</button>
          </div>
        </form>
      </div>
    </div>
  );
}
