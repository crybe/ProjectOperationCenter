import React, { useState, useEffect, useRef } from 'react';
import { User, Lock, ChevronRight, ShieldAlert, Cpu, Fingerprint, Eye, EyeOff, LayoutPanelLeft } from 'lucide-react';
import aerithBg from '../../assets/mascot_aerith.png';
import pigeonBg from '../../assets/pigeon_tactical.jpg';

interface LoginPanelProps {
  username: string;
  setUsername: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  error: string;
  loading: boolean;
  onLogin: (e: React.FormEvent) => void;
  isSuccess: boolean;
}

export const LoginPanel: React.FC<LoginPanelProps> = ({
  username,
  setUsername,
  password,
  setPassword,
  error,
  loading,
  onLogin,
  isSuccess
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isTypingPassword, setIsTypingPassword] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [tickerMsg, setTickerMsg] = useState('G.A.T.E. Security Node Active...');
  const cardRef = useRef<HTMLDivElement>(null);

  // Ticker Logic
  useEffect(() => {
    const msgs = [
      'G.A.T.E. Security Node Active...',
      'Monitoring Neural Pathways...',
      'Encryption: AES-256 Enabled',
      'System: Antigravity v4.0.0',
      'Ready for Operator Auth...',
      'Lifestream Sync: 99.8%'
    ];
    let i = 0;
    const interval = setInterval(() => {
      setTickerMsg(msgs[i % msgs.length]);
      i++;
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`bg-black/85 backdrop-blur-3xl border border-emerald-500/30 rounded-[2rem] p-8 sm:p-12 shadow-[0_0_100px_rgba(16,185,129,0.15)] relative overflow-hidden group transition-all duration-1000 ${isSuccess ? 'scale-110 opacity-0 blur-2xl' : 'scale-100'}`}
    >
      
      {/* Lifestream Particle Effect (Mouse Reactive) */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-40 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, rgba(16, 185, 129, 0.15) 0%, transparent 40%)`
        }}
      />
      
      {/* Mascot Background */}
      <div 
        className={`absolute inset-0 z-0 transition-all duration-1000 pointer-events-none grayscale contrast-125 ${isTypingPassword ? 'scale-110 brightness-[0.7] saturate-150' : 'scale-100 brightness-[0.4]'}`}
        style={{
          backgroundImage: `url(${aerithBg})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          filter: `hue-rotate(${error ? '300deg' : '0deg'}) ${isTypingPassword ? 'brightness(0.7)' : 'brightness(0.5)'}`
        }}
      />
      
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black via-black/40 to-black/20 pointer-events-none" />
      <div className="absolute inset-0 z-[2] scan-overlay opacity-5 pointer-events-none" />

      <div className="relative z-10">
        {/* Audit Log Ticker */}
        <div className="flex items-center gap-3 mb-10 overflow-hidden bg-emerald-500/5 border-l-2 border-emerald-500/40 py-2 px-4 rounded-r-lg">
           <Cpu className="w-3 h-3 text-emerald-500 animate-pulse shrink-0" />
           <p className="text-[9px] font-mono font-black text-emerald-400 uppercase tracking-widest whitespace-nowrap animate-in fade-in slide-in-from-left duration-700">
             {tickerMsg}
           </p>
        </div>

        {error && (
          <div className="mb-10 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-5 animate-shake shadow-[0_0_30px_rgba(239,68,68,0.1)]">
            <ShieldAlert className="w-6 h-6 text-red-500" />
            <p className="text-[10px] text-red-400 font-black uppercase tracking-widest leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={onLogin} className="space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] ml-1 opacity-70">Operator_ID</label>
            <div className="relative group/input">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                 <User className="w-5 h-5 text-emerald-800 group-focus-within/input:text-emerald-400 transition-colors" />
              </div>
              <input 
                type="text" 
                autoFocus
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/40 border border-emerald-500/10 rounded-2xl py-5 pl-14 pr-5 text-emerald-400 placeholder-emerald-900/30 focus:outline-none focus:border-emerald-500/40 focus:bg-emerald-500/5 transition-all font-mono text-sm tracking-widest"
                placeholder="ID..."
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
               <label className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] opacity-70">Neural_Key</label>
               <button 
                 type="button"
                 onClick={() => setShowPassword(!showPassword)}
                 className="text-emerald-900 hover:text-emerald-400 transition-colors"
               >
                 {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
               </button>
            </div>
            <div className="relative group/input">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                 <Lock className={`w-5 h-5 transition-colors ${isTypingPassword ? 'text-emerald-400' : 'text-emerald-800'}`} />
              </div>
              <input 
                type={showPassword ? 'text' : 'password'} 
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setIsTypingPassword(true);
                }}
                onBlur={() => setIsTypingPassword(false)}
                className="w-full bg-black/40 border border-emerald-500/10 rounded-2xl py-5 pl-14 pr-14 text-emerald-400 placeholder-emerald-900/30 focus:outline-none focus:border-emerald-500/40 focus:bg-emerald-500/5 transition-all font-mono text-sm tracking-widest"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="pt-6 flex flex-col gap-4">
             <button 
               type="submit" 
               disabled={loading}
               className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-5 px-8 rounded-2xl transition-all flex items-center justify-center gap-5 group/btn disabled:opacity-20 shadow-[0_20px_40px_rgba(16,185,129,0.25)] hover:shadow-[0_25px_50px_rgba(16,185,129,0.4)] active:scale-[0.97] relative overflow-hidden"
             >
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
               <span className="text-[11px] font-black uppercase tracking-[0.5em] relative z-10">
                 {loading ? 'SYNCING...' : 'Lebensstrom initialisieren'}
               </span>
               {!loading && <ChevronRight className="w-6 h-6 group-hover/btn:translate-x-2 transition-transform relative z-10" />}
             </button>

             <button 
               type="button"
               className="w-full bg-black/40 border border-emerald-500/10 hover:border-emerald-500/30 text-emerald-800 hover:text-emerald-400 py-4 px-8 rounded-2xl transition-all flex items-center justify-center gap-4 group/bio"
               title="Neural Scan (Biometric Auth)"
             >
               <Fingerprint className="w-5 h-5 group-hover/bio:scale-110 transition-transform" />
               <span className="text-[9px] font-black uppercase tracking-[0.4em]">Neural Scan</span>
             </button>
          </div>
        </form>

        {/* Decorative Bottom Info */}
        <div className="mt-12 pt-8 border-t border-emerald-900/10 flex justify-between items-center opacity-40">
           <div className="flex items-center gap-4">
              <div className="flex gap-1.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30" />
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30" />
              </div>
              <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">G.A.T.E. 04</span>
           </div>
           <span className="text-[9px] text-emerald-950 font-black uppercase tracking-widest">S_Lvl: Omega</span>
        </div>
      </div>
    </div>
  );
};
