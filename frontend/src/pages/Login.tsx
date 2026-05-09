import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginPanel } from '../components/Login/LoginPanel';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });
      
      const finalPath = new URL(res.url).pathname;
      if (res.ok && res.redirected && !finalPath.endsWith('/login')) {
        setIsSuccess(true);
        setTimeout(() => navigate('/'), 1200);
      } else if (res.ok && !res.redirected) {
         const text = await res.text();
         if (text.includes('Ungültige Zugangsdaten')) {
            setError('Auth Rejected: Invalid credentials');
         } else {
            setIsSuccess(true);
            setTimeout(() => navigate('/'), 1200);
         }
      } else {
        setError('Connection failed. Backend accessible?');
      }
    } catch (err: any) {
      setError(err.message || 'System error');
    } finally {
      if (!isSuccess) setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-start overflow-hidden relative selection:bg-emerald-500/30">
      
      {/* Primary Background Layer (Old/Original) */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-no-repeat transition-opacity duration-1000 opacity-40"
        style={{
          backgroundImage: 'url(/static/assets/login.webp)',
          backgroundPosition: 'center center',
          backgroundSize: 'cover'
        }}
      />

      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-black via-black/60 to-transparent pointer-events-none" />
      
      {/* Matrix/Scanline Overlay */}
      <div className="absolute inset-0 z-[2] opacity-20 pointer-events-none mix-blend-overlay"
           style={{
             backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)`,
             backgroundSize: '30px 30px'
           }}
      />
      <div className="absolute inset-0 z-[3] scan-overlay opacity-10 pointer-events-none" />

      {/* Login Panel Container */}
      <div className="relative z-10 w-full max-w-xl ml-[15%] animate-fade-in py-12 px-4">
        
        {/* Refactored Login Panel */}
        <LoginPanel 
          username={username}
          setUsername={setUsername}
          password={password}
          setPassword={setPassword}
          error={error}
          loading={loading}
          onLogin={handleLogin}
          isSuccess={isSuccess}
        />
        
        {/* Security Footer */}
        <div className="mt-12 text-left opacity-30 px-2">
           <p className="text-[8px] text-emerald-900 font-black uppercase tracking-widest leading-loose">
              SYSTEM STATUS: AERITH G. ACCESSS [CLEAN]<br/>
              SECURED BY G.A.T.E. ENCRYPTION PROTOCOL
           </p>
        </div>
      </div>
    </div>
  );
}
