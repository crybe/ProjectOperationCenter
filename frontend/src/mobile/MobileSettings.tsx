import React, { useState } from 'react';
import { Shield, Key, Trash2, CheckCircle2 } from 'lucide-react';

const MobileSettings: React.FC = () => {
  const [pin, setPin] = useState(localStorage.getItem('nexus_pin') || '');
  const [newPin, setNewPin] = useState('');
  const [step, setStep] = useState<'view' | 'edit'>('view');
  const [success, setSuccess] = useState(false);

  const savePin = () => {
    if (newPin.length === 4) {
      localStorage.setItem('nexus_pin', newPin);
      setPin(newPin);
      setStep('view');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  const removePin = () => {
    localStorage.removeItem('nexus_pin');
    setPin('');
    setStep('view');
  };

  return (
    <div className="p-4 space-y-6">
      <div className="bg-gradient-to-br from-cyan-500/20 to-purple-500/10 border border-cyan-500/20 rounded-3xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-cyan-500 rounded-2xl">
            <Shield size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Sicherheit</h2>
            <p className="text-sm text-gray-400">App-Zugriff schützen</p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Key className="text-emerald-400" />
            <span className="font-semibold">PIN-Schutz</span>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${pin ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-500'}`}>
            {pin ? 'Aktiv' : 'Inaktiv'}
          </span>
        </div>

        {step === 'view' ? (
          <div className="space-y-4">
            {pin ? (
              <div className="flex gap-2">
                <button 
                  onClick={() => setStep('edit')}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-xl font-medium"
                >
                  PIN ändern
                </button>
                <button 
                  onClick={removePin}
                  className="p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setStep('edit')}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
              >
                PIN einrichten
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">Gib einen 4-stelligen Code ein:</p>
            <input 
              type="number" 
              maxLength={4}
              value={newPin}
              onChange={e => setNewPin(e.target.value.slice(0, 4))}
              className="w-full bg-black border border-white/20 rounded-xl py-4 text-center text-3xl font-mono tracking-[1em] focus:border-emerald-500 focus:outline-none"
              placeholder="0000"
            />
            <div className="flex gap-2">
              <button 
                onClick={() => setStep('view')}
                className="flex-1 py-3 text-gray-500 font-medium"
              >
                Abbrechen
              </button>
              <button 
                onClick={savePin}
                disabled={newPin.length !== 4}
                className="flex-1 bg-emerald-600 disabled:opacity-30 py-3 rounded-xl font-bold"
              >
                Speichern
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-emerald-400 text-sm justify-center animate-bounce">
            <CheckCircle2 size={16} /> PIN erfolgreich gespeichert
          </div>
        )}
      </div>

      <div className="text-center pt-8 opacity-30">
        <p className="text-xs uppercase tracking-widest font-bold">Nexus Command Hub</p>
        <p className="text-[10px] mt-1">Version 1.1.0-mobile</p>
      </div>
    </div>
  );
};

export default MobileSettings;
