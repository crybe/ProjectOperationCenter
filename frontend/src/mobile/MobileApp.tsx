import React, { useState, useEffect } from 'react';
import { Activity, LayoutDashboard, Workflow, Settings, Shield, Box } from 'lucide-react';
import MobileStatus from './MobileStatus';
import MobileDashboards from './MobileDashboards';
import MobileWorkflows from './MobileWorkflows';
import MobileSettings from './MobileSettings';
import MobileServices from './MobileServices';
import PinLock from './PinLock';

const MobileApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'status' | 'grafana' | 'n8n' | 'services' | 'settings' | 'vpanel'>('status');
  const [hideNav, setHideNav] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const pin = localStorage.getItem('nexus_pin');
    if (pin) {
      setIsLocked(true);
    }
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'status':
        return <MobileStatus />;
      case 'grafana':
        return <MobileDashboards />;
      case 'n8n':
        return <MobileWorkflows onToggleNav={setHideNav} />;
      case 'services':
        return <MobileServices />;
      case 'vpanel':
        window.location.href = '/vpanel';
        return null;
      case 'settings':
        return <MobileSettings />;
      default:
        return <MobileStatus />;
    }
  };

  if (isLocked) {
    return <PinLock onUnlock={() => setIsLocked(false)} />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-white overflow-hidden font-sans">
      {/* Header */}
      {!hideNav && (
        <header className="p-4 border-b border-white/10 bg-black/50 backdrop-blur-md flex justify-between items-center sticky top-0 z-50">
          <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
            Nexus
          </h1>
          <div className="flex items-center gap-3">
            {localStorage.getItem('nexus_pin') && (
              <button onClick={() => setIsLocked(true)} className="text-gray-500 hover:text-emerald-400">
                <Shield size={18} />
              </button>
            )}
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto ${!hideNav ? 'pb-24' : ''}`}>
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 px-4 py-3 pb-8 flex justify-around items-center z-50">
          <button 
            onClick={() => { setActiveTab('status'); setHideNav(false); }}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'status' ? 'text-emerald-400 scale-110' : 'text-gray-500'}`}
          >
            <Activity size={24} />
            <span className="text-[10px] font-medium uppercase tracking-wider">Status</span>
          </button>
          
          <button 
            onClick={() => { setActiveTab('vpanel'); }}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'vpanel' ? 'text-emerald-400 scale-110' : 'text-gray-500'}`}
          >
            <LayoutDashboard size={24} />
            <span className="text-[10px] font-medium uppercase tracking-wider">VPanel</span>
          </button>

          <button 
            onClick={() => { setActiveTab('n8n'); setHideNav(false); }}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'n8n' ? 'text-emerald-400 scale-110' : 'text-gray-500'}`}
          >
            <Workflow size={24} />
            <span className="text-[10px] font-medium uppercase tracking-wider">n8n</span>
          </button>

          <button 
            onClick={() => { setActiveTab('services'); setHideNav(false); }}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'services' ? 'text-emerald-400 scale-110' : 'text-gray-500'}`}
          >
            <Box size={24} />
            <span className="text-[10px] font-medium uppercase tracking-wider">Docker</span>
          </button>

          <button 
            onClick={() => { setActiveTab('settings'); setHideNav(false); }}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'settings' ? 'text-emerald-400 scale-110' : 'text-gray-500'}`}
          >
            <Settings size={24} />
            <span className="text-[10px] font-medium uppercase tracking-wider">Settings</span>
          </button>
        </nav>
      )}
    </div>
  );
};

export default MobileApp;
