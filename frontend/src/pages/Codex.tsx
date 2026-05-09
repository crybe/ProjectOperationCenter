import { useState, useEffect } from 'react';
import { BookOpen, FileText, Save, Folder } from 'lucide-react';
import { SectionCard } from '../components/ui';
import { useApi } from '../hooks/useApi';
import { useToast } from '../components/Toast';

export default function Codex() {
  const apiFetch = useApi();
  const { toast } = useToast();
  const [files, setFiles] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const res = await apiFetch('/api/codex/files');
      setFiles(res?.files || []);
    } catch (e) {
      console.error(e);
    }
  };

  const openFile = async (filename: string) => {
    try {
      const res = await apiFetch(`/api/codex/file?name=${filename}`);
      setContent(res.content || '');
      setActiveFile(filename);
    } catch (e: any) {
      toast('error', e.message);
    }
  };

  const saveFile = async () => {
    if (!activeFile) return;
    setSaving(true);
    try {
      await apiFetch('/api/codex/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: activeFile, content })
      });
      toast('success', 'Codex_Updated');
      loadFiles();
    } catch (e: any) {
      toast('error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const createNew = () => {
    const name = prompt("Enter new filename (e.g. tactics.md):");
    if (name) {
      setActiveFile(name);
      setContent('# New Document\n\n...');
    }
  };

  return (
    <div className="w-full min-h-screen pb-48 animate-fade-in space-y-16">
      <div className="flex flex-col gap-4">
        <h2 className="text-4xl font-black text-emerald-500 tracking-tighter uppercase italic flex items-center gap-4">
           <BookOpen className="w-10 h-10 text-emerald-500" />
           The<span className="text-emerald-600">_Codex</span>
        </h2>
        <p className="text-[10px] text-emerald-900/70 font-black uppercase tracking-[0.4em]">Personal Knowledge Base & Rulesets</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-3 space-y-8">
            <SectionCard title="Directory" icon={Folder} delay={1}>
               <button onClick={createNew} className="w-full mb-6 py-3 hacker-frame bg-emerald-600/10 text-emerald-500 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-emerald-600 hover:text-black transition-all">
                 + New Document
               </button>
               <div className="space-y-2">
                 {files.map(f => (
                   <button 
                     key={f} 
                     onClick={() => openFile(f)}
                     className={`w-full text-left p-3 flex items-center gap-3 text-[11px] font-black tracking-wider uppercase transition-all ${activeFile === f ? 'bg-emerald-600/20 text-emerald-500 border-l-2 border-emerald-500' : 'text-emerald-400 hover:text-emerald-500 hover:bg-emerald-950/10'}`}
                   >
                     <FileText className="w-4 h-4 opacity-50" />
                     {f}
                   </button>
                 ))}
                 {files.length === 0 && <p className="text-[10px] text-emerald-900 font-hacker p-4 uppercase">No files found.</p>}
               </div>
            </SectionCard>
         </div>

         <div className="lg:col-span-9">
            <SectionCard 
              title={activeFile ? `Editing: ${activeFile}` : 'Editor'} 
              icon={FileText} 
              delay={2}
              action={activeFile && (
                <button onClick={saveFile} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-black hover:bg-emerald-500 transition-all text-[9px] font-black uppercase tracking-[0.2em] shadow-2xl">
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save_Doc'}
                </button>
              )}
            >
               {activeFile ? (
                 <textarea 
                   value={content}
                   onChange={e => setContent(e.target.value)}
                   className="w-full h-[600px] bg-black/80 border border-emerald-900/30 hacker-frame p-6 text-sm text-emerald-100 font-mono focus:outline-none focus:border-emerald-500 transition-all resize-y custom-scrollbar"
                   spellCheck={false}
                 />
               ) : (
                 <div className="h-[600px] flex items-center justify-center border border-dashed border-emerald-900/30 hacker-frame bg-black/20">
                    <p className="text-[12px] text-emerald-900 font-black uppercase tracking-[0.4em] font-hacker text-center">Select or Create a Document<br/><span className="text-[9px] opacity-50 mt-2 block">Awaiting Input...</span></p>
                 </div>
               )}
            </SectionCard>
         </div>
      </div>
    </div>
  );
}
