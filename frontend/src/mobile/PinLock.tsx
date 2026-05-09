import React, { useState, useEffect } from 'react';
import { Lock, Delete, ShieldCheck } from 'lucide-react';

interface PinLockProps {
  onUnlock: () => void;
}

const PinLock: React.FC<PinLockProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const storedPin = localStorage.getItem('nexus_pin');

  const handleInput = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);

      if (newPin.length === 4) {
        if (newPin === storedPin) {
          onUnlock();
        } else {
          setTimeout(() => {
            setPin('');
            setError(true);
          }, 200)
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0a0a] flex flex-col items-center justify-center p-6 select-none">
      <div className="mb-12 text-center">
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 transition-colors ${error ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/10 text-emerald-400'}`}>
          <Lock size={40} className={error ? 'animate-bounce' : ''} />
        </div>
        <h2 className="text-2xl font-bold mb-1">Nexus Safe</h2>
        <p className="text-gray-500 text-sm">{error ? 'Falscher Code, versuch es erneut' : 'PIN eingeben zum Entsperren'}</p>
      </div>

      <div className="flex gap-4 mb-16">
        {[...Array(4)].map((_, i) => (
          <div 
            key={i} 
            className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
              pin.length > i 
                ? 'bg-emerald-400 border-emerald-400 scale-125 shadow-[0_0_10px_rgba(74,222,128,0.5)]' 
                : 'border-gray-700 bg-transparent'
            }`} 
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6 w-full max-w-[280px]">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button 
            key={num}
            onClick={() => handleInput(num.toString())}
            className="w-16 h-16 rounded-full bg-white/5 border border-white/10 text-2xl font-semibold flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all"
          >
            {num}
          </button>
        ))}
        <div />
        <button 
          onClick={() => handleInput('0')}
          className="w-16 h-16 rounded-full bg-white/5 border border-white/10 text-2xl font-semibold flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all"
        >
          0
        </button>
        <button 
          onClick={handleDelete}
          className="w-16 h-16 rounded-full flex items-center justify-center text-gray-500 hover:text-white active:scale-90 transition-all"
        >
          <Delete size={24} />
        </button>
      </div>
    </div>
  );
};

export default PinLock;
